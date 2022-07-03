import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EventsCollection } from '../db/EventsCollection';
import {DateTime} from "luxon";
import {RRule} from "rrule";

const standardizeEvent = (evt, userId) => {
    let evtObj = evt;

    delete evtObj.running;
    delete evtObj.timestamp;
    delete evtObj.due;
    delete evtObj.dueHuge;
    delete evtObj.listId;

    if (evt.amount) {
        evtObj.amount = parseFloat(evt.amount).toFixed(2);
    }

    if (evt._id) {
        evtObj.updatedAt = DateTime.now().toMillis();
        delete evtObj.createdAt;
    } else {
        evtObj.createdAt = DateTime.now().toMillis();
    }
    evtObj.userId = userId;

    if (evt.weekdaysOnly === true) {
        evtObj.weekdays = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR].toString();
    } else {
        if (evt.weekdays) {
            evtObj.weekdays = evt.weekdays.toString();
        }
    }

    return evtObj;
}

Meteor.methods({
    'events.insert'(evt) {
        //check(evt.title, String);
        //check(evt.type, String);
        //check(lastDayOfMonth, Boolean);
        //check(amount, Number);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        EventsCollection.insert({...standardizeEvent(evt, this.userId)})
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

        let evtUpdate = standardizeEvent(evt);

        // slow, see difference in object and update individual keys. or send only keys that need updating from front ned
        return await EventsCollection.update(evt._id, { $set: {...evtUpdate}})

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
