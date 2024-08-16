import {EventsCollection} from "../db/EventsCollection";
import {DateTime} from "luxon";
import {RRule, Weekday} from "rrule";

const getCurrentEvents = (user, start, end, balance) => {
    const userFilter = user ? {userId: user._id} : {};

    let filteredEvts = [];
    if (!user) return [];

    const handler = Meteor.subscribe('events');
    if (!handler.ready()) {
        return filteredEvts;
    }

    let evtsAll = EventsCollection.find(userFilter, {sort: {createdAt: -1}});

    evtsAll.forEach(evt => {
        let betweenBegin = DateTime.fromISO(start).startOf('day').toJSDate();
        let betweenEnd = DateTime.fromISO(end).endOf('day').toJSDate();

        let weekdaysArray = [];
        let weekdays = [];
        if (evt.weekdaysOnly === true) {
            weekdaysArray = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR];
            weekdays = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR].map((i) => i.toString());
        } else {
            if (evt.weekdays) {
                weekdaysArray = evt.weekdays !== "" ? evt.weekdays.split(",").map((w) => Weekday.fromStr(w)) : [];
                weekdays = evt.weekdays !== "" ? evt.weekdays.split(",") : [];
            }
        }

        let rule;
        if (evt.recurring) {
            let ruleOpts = {
                dtstart: DateTime.fromISO(evt.startdate).toJSDate(),
                wkst: RRule.SU,
                interval: evt.interval,
                freq: evt.frequency,
                byweekday: weekdaysArray
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
                interval: RRule.DAILY,
                dtstart: DateTime.fromISO(evt.startdate).toJSDate(),
                count: 1
            });
        }

        rule.between(betweenBegin, betweenEnd, true).forEach((instance, idx) => {
            let displayTime = DateTime.fromJSDate(instance).setZone('utc');
            filteredEvts.push({
                ...evt,
                weekdays: weekdays,
                listId: evt._id + idx,
                timestamp: displayTime.toMillis(),
                due: displayTime.toLocaleString(),
                dueHuge: displayTime.toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)
            })
        })
    });

    filteredEvts.sort((a, b) => a.timestamp >= b.timestamp ? 1 : -1)

    let running = balance !== '' ? parseFloat(balance) : 0;
    filteredEvts.map((evt) => {
        if (evt.type === 'bill') {
            running -= parseFloat(evt.amount);
        } else {
            running += parseFloat(evt.amount);
        }
        evt.running = running.toFixed(2);
    });


    return filteredEvts;
};

export default getCurrentEvents;
