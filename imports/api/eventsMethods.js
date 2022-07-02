import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EventsCollection } from '../db/EventsCollection';
import RRule from "rrule";
import {DateTime} from "luxon";

Meteor.methods({
    'events.insert'(title, type, amount, interval, frequency, dayOfMonth, lastDayOfMonth, weekdays) {
        //check(title, String);
        //check(type, String);
        //check(lastDayOfMonth, Boolean);
        //check(amount, Number);

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
            weekdays: weekdays,
            createdAt: DateTime.now().setZone('UTC').toMillis(),
            userId: this.userId,
        })
    },

    async 'events.edit'(evt) {
        // probably need to conditionally validate this
        // check(event.title, String);
        // check(event.type, String);
        // check(event.lastDayOfMonth, Boolean);
        // check(event.weekdaysOnly, Boolean);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        const foundEvent = await EventsCollection.findOne({ _id: evt._id, userId: this.userId });

        if (!foundEvent) {
            throw new Meteor.Error('Not found.');
        }

        if (evt.rule) {
            evt.rule = new RRule({
                interval: evt.interval,
                freq: evt.frequency,
                byweekday: evt.weekdaysOnly ? [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR] : null,
                bymonthday: evt.lastDayOfMonth ? -1 : evt.dayOfMonth,
                byhour: 0,
                byminute: 0,
                bysecond: 0
            }).toString();
        }

        if (evt.amount) {
            evt.amount = parseFloat(evt.amount).toFixed(2);
        }

        // slow, see difference in object and update individual keys. or send only keys that need upating from front ned
        return await EventsCollection.update({ _id: evt._id, userId: this.userId }, evt)

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
