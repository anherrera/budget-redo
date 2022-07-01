import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EventsCollection } from '../db/EventsCollection';
import RRule from "rrule";
import {DateTime} from "luxon";

Meteor.methods({
    'events.insert'(title, type, amount, interval, frequency, dayOfMonth, lastDayOfMonth, weekdaysOnly) {
        check(title, String);
        check(type, String);
        check(lastDayOfMonth, Boolean);
        check(weekdaysOnly, Boolean);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        EventsCollection.insert({
            title: title,
            type: type,
            amount: parseFloat(amount),
            interval: interval,
            frequency: frequency,
            dayOfMonth: dayOfMonth,
            lastDayOfMonth: lastDayOfMonth,
            weekdaysOnly: weekdaysOnly,
            rule: new RRule({
                interval: interval,
                freq: frequency,
                byweekday: weekdaysOnly ? [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR] : null,
                bymonthday: lastDayOfMonth ? -1 : dayOfMonth, // -1 for last
                byhour: 0,
                byminute: 0,
                bysecond: 0
            }).toString(),
            createdAt: DateTime.now().toMillis(),
            userId: this.userId,
        })
    },

    'events.remove'(eventId) {
        check(eventId, String);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        const event = EventsCollection.findOne({ _id: eventId, userId: this.userId });

        if (!event) {
            throw new Meteor.Error('Not authorized.');
        }

        EventsCollection.remove(eventId);
    }
});