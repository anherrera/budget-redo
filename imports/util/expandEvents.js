import {DateTime} from "luxon";
// rrule is CommonJS; destructuring the default export is the interop form that
// works under both Meteor's build and plain Node's ESM loader.
import rrulePkg from "rrule";
const {RRule, Weekday} = rrulePkg;
// Explicit extensions so this module is importable both by Meteor's resolver
// and by plain Node (which requires them for ESM).
import {adjustToWeekday, shouldAdjustToWeekday} from "./weekdayAdjustment.js";
import {getAmountCents} from "./runningBalance.js";

// Bills are calendar dates with no time of day. rrule does its arithmetic in
// UTC, so feed it each date as UTC midnight and read results back in UTC.
// Handing it local midnight instead let DST leak in: after the November
// fall-back every occurrence landed at 23:00 the previous day (Cleaner due
// Mon 11/23 showed as Sun 11/22, BofA's 14th as the 13th).
const toRRuleDate = (iso) => DateTime.fromISO(iso, {zone: 'utc'}).startOf('day').toJSDate();
const fromRRuleDate = (date) => {
    const {year, month, day} = DateTime.fromJSDate(date, {zone: 'utc'});
    return DateTime.local(year, month, day);
};

const FREQUENCIES = [RRule.DAILY, RRule.WEEKLY, RRule.MONTHLY, RRule.YEARLY];

// adjustToWeekday moves a date back at most two days (Sun -> Fri), so look
// that far past the window for occurrences that land inside it once moved.
const ADJUST_LOOKAHEAD_DAYS = 3;

/**
 * Which days of the period an event falls on.
 *
 * `setPos` means two different things. With weekdays chosen on a monthly or
 * yearly event it is "the Nth of those weekdays" (first Friday). Otherwise it
 * is the day of the month. It is stored on every event (default 1), so it must
 * not leak into daily/weekly rules, where bysetpos would keep only one
 * occurrence per period (or none: Vetsource, weekly on WE with setPos 19,
 * never appeared at all).
 */
const periodOptions = (evt, freq, weekdaysArray, needsWeekdayAdjustment) => {
    const setPos = parseInt(evt.setPos, 10);
    if (freq === RRule.DAILY || freq === RRule.WEEKLY) {
        return {byweekday: weekdaysArray};
    }

    const start = DateTime.fromISO(evt.startdate);
    const opts = freq === RRule.YEARLY ? {bymonth: [start.month]} : {};
    if (weekdaysArray.length && !needsWeekdayAdjustment) {
        return {...opts, byweekday: weekdaysArray, bysetpos: evt.lastDayOfMonth ? -1 : (setPos || 1)};
    }
    if (evt.lastDayOfMonth) {
        return {...opts, bymonthday: [-1]};
    }
    const day = setPos || start.day;
    if (day > 28) {
        // The 31st in a 30-day month (or the 29th+ in February) clamps to the
        // last day instead of skipping that month.
        return {...opts, bymonthday: [28, 29, 30, 31].filter((d) => d <= day), bysetpos: -1};
    }
    return {...opts, bymonthday: [day]};
};

/**
 * Expand a set of budget events into their individual occurrences within a
 * date window.
 *
 * Deliberately free of any Meteor dependency: `events` is anything with a
 * `forEach` (a Mongo cursor from the client, a plain array from a script), so
 * this recurrence logic has exactly one implementation regardless of caller.
 *
 * @param events  iterable of raw event documents
 * @param start   ISO date string, inclusive, interpreted at start of day
 * @param end     ISO date string, inclusive, interpreted at end of day
 * @returns array of expanded occurrences (no running balance applied)
 */
const expandEvents = (events, start, end) => {
    const expanded = [];
    const startISO = DateTime.fromISO(start).toISODate();
    const endISO = DateTime.fromISO(end).toISODate();
    const betweenBegin = toRRuleDate(start);
    const betweenEnd = DateTime.fromISO(end, {zone: 'utc'}).endOf('day').toJSDate();

    events.forEach(evt => {
        const skipDates = new Set(evt.skipDates || []);
        let weekdaysArray = [];
        let weekdays = [];
        if (evt.weekdaysOnly === true) {
            weekdaysArray = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
            weekdays = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR].map((i) => i.toString());
        } else {
            if (evt.weekdays) {
                const weekdayStr = Array.isArray(evt.weekdays) ? evt.weekdays.join(',') : String(evt.weekdays);
                weekdaysArray = weekdayStr !== "" ? weekdayStr.split(",").map((w) => Weekday.fromStr(w)) : [];
                weekdays = weekdayStr !== "" ? weekdayStr.split(",") : [];
            }
        }

        let rule;
        const freq = Number(evt.frequency);
        const needsWeekdayAdjustment = freq === RRule.MONTHLY && shouldAdjustToWeekday(evt);

        if (evt.recurring) {
            // rrule loops forever on a bad freq or interval, and this runs
            // synchronously on the server for /api/bills. Skip the event.
            if (!FREQUENCIES.includes(freq)) {
                console.warn(`[expandEvents] skipping ${evt._id}: bad frequency ${evt.frequency}`);
                return;
            }
            let ruleOpts = {
                dtstart: toRRuleDate(evt.startdate),
                wkst: RRule.SU,
                interval: Math.max(1, parseInt(evt.interval, 10) || 1),
                freq,
                ...periodOptions(evt, freq, weekdaysArray, needsWeekdayAdjustment),
            };

            if (evt.until) {
                ruleOpts.until = toRRuleDate(evt.until);
            }

            rule = new RRule(ruleOpts);
        } else {
            rule = new RRule({
                wkst: RRule.SU,
                freq: RRule.DAILY,
                dtstart: toRRuleDate(evt.startdate),
                count: 1
            });
        }

        const searchEnd = needsWeekdayAdjustment
            ? DateTime.fromJSDate(betweenEnd, {zone: 'utc'}).plus({days: ADJUST_LOOKAHEAD_DAYS}).toJSDate()
            : betweenEnd;
        let idx = 0;
        rule.between(betweenBegin, searchEnd, true).forEach((instance) => {
            const adjustedInstance = needsWeekdayAdjustment ? adjustToWeekday(instance) : instance;
            const displayTime = fromRRuleDate(adjustedInstance);
            const dueISO = displayTime.toISODate();
            // Filter on the date actually reported, after any weekend shift.
            if (dueISO < startISO || dueISO > endISO) return;
            expanded.push({
                ...evt,
                amountCents: getAmountCents(evt),
                weekdays: weekdays,
                listId: evt._id + idx++,
                timestamp: displayTime.toMillis(),
                dueISO,
                // A skipped occurrence stays listed (so it can be un-skipped) but moves no money.
                skipped: skipDates.has(dueISO),
                due: displayTime.toFormat('MM/dd/yyyy'),
                dueHuge: displayTime.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
            })
        })
    });

    return expanded;
};

export default expandEvents;
