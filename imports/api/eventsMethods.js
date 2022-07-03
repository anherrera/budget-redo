import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EventsCollection } from '../db/EventsCollection';
import RRule from "rrule";
import {DateTime} from "luxon";

Meteor.methods({
    'events.insert'(evt) {
        //check(evt.title, String);
        //check(evt.type, String);
        //check(lastDayOfMonth, Boolean);
        //check(amount, Number);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        if (evt.amount) {
            evt.amount = parseFloat(evt.amount).toFixed(2);
        }

        if (evt.weekdays) {
            evt.weekdays = evt.weekdays.toString();
        }

        evt.createdAt = DateTime.now().toMillis();
        evt.userId = this.userId;

        EventsCollection.insert({...evt})
    },

    async 'events.edit'(evt) {
        let evtUpdate = evt;

        // probably need to conditionally validate this
        // check(event.title, String);
        // check(event.type, String);
        // check(event.lastDayOfMonth, Boolean);
        // check(event.weekdaysOnly, Boolean);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        const foundEvent = await EventsCollection.findOne({ _id: evtUpdate._id, userId: this.userId });

        if (!foundEvent) {
            throw new Meteor.Error('Not found.');
        }

        if (evtUpdate.amount) {
            evtUpdate.amount = parseFloat(evt.amount).toFixed(2);
        }

        if (evtUpdate.weekdays) {
            evtUpdate.weekdays = evt.weekdays.toString();
        }

        evtUpdate.updatedAt = DateTime.now().toMillis();

        delete evtUpdate.running;
        delete evtUpdate.timestamp;
        delete evtUpdate.due;
        delete evtUpdate.dueHuge;
        delete evtUpdate.listId;

        // slow, see difference in object and update individual keys. or send only keys that need upating from front ned
        return await EventsCollection.update(evtUpdate._id, { $set: {...evtUpdate}})

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
