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
        check(amount, Number);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        EventsCollection.insert({
            title: title,
            type: type,
            amount: parseFloat(amount).toFixed(2),
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

    async 'events.edit'(event) {
        // probably need to conditionally validate this
        // check(event.title, String);
        // check(event.type, String);
        // check(event.lastDayOfMonth, Boolean);
        // check(event.weekdaysOnly, Boolean);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        const foundEvent = await EventsCollection.findOne({ _id: event._id, userId: this.userId });

        if (!foundEvent) {
            throw new Meteor.Error('Not found.');
        }

        if (event.rule) {
            event.rule = new RRule({
                interval: event.interval,
                freq: event.frequency,
                byweekday: event.weekdaysOnly ? [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR] : null,
                bymonthday: event.lastDayOfMonth ? -1 : event.dayOfMonth,
                byhour: 0,
                byminute: 0,
                bysecond: 0
            }).toString();
        }

        if (event.amount) {
            event.amount = parseFloat(event.amount).toFixed(2);
        }

        // slow, see difference in object and update individual keys. or send only keys that need upating from front ned
        return await EventsCollection.update({ _id: event._id, userId: this.userId }, event)

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
