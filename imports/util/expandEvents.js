import {DateTime} from "luxon";
// rrule is CommonJS; destructuring the default export is the interop form that
// works under both Meteor's build and plain Node's ESM loader.
import rrulePkg from "rrule";
const {RRule, Weekday} = rrulePkg;
// Explicit extensions so this module is importable both by Meteor's resolver
// and by plain Node (which requires them for ESM).
import {adjustToWeekday, shouldAdjustToWeekday} from "./weekdayAdjustment.js";
import {getAmountCents} from "./runningBalance.js";

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
    const betweenBegin = DateTime.fromISO(start).startOf('day').toJSDate();
    const betweenEnd = DateTime.fromISO(end).endOf('day').toJSDate();

    events.forEach(evt => {
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
        const needsWeekdayAdjustment = evt.frequency === RRule.MONTHLY && shouldAdjustToWeekday(evt);

        if (evt.recurring) {
            let ruleOpts = {
                dtstart: DateTime.fromISO(evt.startdate).startOf('day').toJSDate(),
                wkst: RRule.SU,
                interval: parseInt(evt.interval),
                freq: evt.frequency,
                byweekday: needsWeekdayAdjustment ? [] : weekdaysArray
            };

            if (evt.lastDayOfMonth === true || evt.setPos) {
                ruleOpts.bysetpos = evt.lastDayOfMonth ? -1 : parseInt(evt.setPos);
            }
            if (evt.until) {
                ruleOpts.until = DateTime.fromISO(evt.until).toJSDate();
            }

            rule = new RRule(ruleOpts);
        } else {
            rule = new RRule({
                wkst: RRule.SU,
                freq: RRule.DAILY,
                dtstart: DateTime.fromISO(evt.startdate).startOf('day').toJSDate(),
                count: 1
            });
        }

        rule.between(betweenBegin, betweenEnd, true).forEach((instance, idx) => {
            let adjustedInstance = needsWeekdayAdjustment ? adjustToWeekday(instance) : instance;
            let displayTime = DateTime.fromJSDate(adjustedInstance).startOf('day');
            expanded.push({
                ...evt,
                amountCents: getAmountCents(evt),
                weekdays: weekdays,
                listId: evt._id + idx,
                timestamp: displayTime.toMillis(),
                due: displayTime.toFormat('MM/dd/yyyy'),
                dueHuge: displayTime.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
            })
        })
    });

    return expanded;
};

export default expandEvents;
