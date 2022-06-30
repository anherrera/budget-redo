import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EventsCollection } from '../db/EventsCollection';
import RRule from "rrule";
import {DateTime} from "luxon";

Meteor.methods({
    'events.insert'(title, eventType, amount, interval, frequency, dayOfMonth, weekdaysOnly) {
        check(title, String);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        EventsCollection.insert({
            title: title,
            type: eventType,
            amount: amount,
            rule: new RRule({
                interval: interval,
                freq: frequency,
                byweekday: weekdaysOnly ? [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR] : null,
                bymonthday: dayOfMonth // -1 for last
            }).toString(),
            createdAt: DateTime.now().toISODate(),
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