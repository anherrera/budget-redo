import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { EventsCollection } from '../db/EventsCollection';
import {DateTime} from "luxon";
import {RRule} from "rrule";

const weekdayMap = {
    1: RRule.MO,
    2: RRule.TU,
    3: RRule.WE,
    4: RRule.TH,
    5: RRule.FR,
    6: RRule.SA,
    7: RRule.SU
}

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

    // if the event is weekly and no weekdays are selected, set the weekday to the day of the week
    // if only one weekday is selected, set the weekday to the new day, for convenience
    if (evt.frequency == RRule.WEEKLY && (evt.weekdays.length === 0 || evt.weekdays.length === 1)) {
        // figure out the day of the week from the startdate
        let weekday = DateTime.fromISO(evt.startdate).weekday;


        evt.weekdays = [weekdayMap[weekday]].toString();
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
    async 'events.insertAsync'(evt) {
        //check(evt.title, String);
        //check(evt.type, String);
        //check(lastDayOfMonth, Boolean);
        //check(amount, Number);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        await EventsCollection.insertAsync({...standardizeEvent(evt, this.userId)})
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

        const foundEvent = await EventsCollection.findOneAsync({ _id: evt._id, userId: this.userId });

        if (!foundEvent) {
            throw new Meteor.Error('Not found.');
        }

        let evtUpdate = standardizeEvent(evt);

        // slow, see difference in object and update individual keys. or send only keys that need updating from front ned
        return await EventsCollection.updateAsync(evt._id, { $set: {...evtUpdate}})

    },

    async 'events.removeAsync'(eventId) {
        check(eventId, String);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        const event = await EventsCollection.findOneAsync({_id: eventId, userId: this.userId});

        if (!event) {
            throw new Meteor.Error('Not authorized.');
        }

        await EventsCollection.removeAsync(eventId);
    }
});
