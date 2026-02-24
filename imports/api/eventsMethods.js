import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
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

const EVENT_TYPES = ['bill', 'income', 'cc_payment'];
const FREQUENCIES = [RRule.DAILY, RRule.WEEKLY, RRule.MONTHLY, RRule.YEARLY];
const VALID_WEEKDAYS = new Set(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']);

const isISODate = (value) => {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    return DateTime.fromISO(value).isValid;
};

const toIntegerOr = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const parseAmountToCents = (value) => {
    const raw = typeof value === 'number' ? value : parseFloat(value);
    if (!Number.isFinite(raw)) {
        throw new Meteor.Error('validation-error', 'Amount must be a valid number.');
    }

    const cents = Math.round(raw * 100);
    if (!Number.isInteger(cents) || cents < 0) {
        throw new Meteor.Error('validation-error', 'Amount must be zero or greater.');
    }

    return cents;
};

const validateEventInput = (evt) => {
    check(evt, Object);
    check(evt.title, String);
    check(evt.type, String);
    check(evt.startdate, String);

    if (evt.title.trim().length === 0) {
        throw new Meteor.Error('validation-error', 'Title cannot be empty.');
    }
    if (!EVENT_TYPES.includes(evt.type)) {
        throw new Meteor.Error('validation-error', `Type must be one of: ${EVENT_TYPES.join(', ')}`);
    }
    if (!isISODate(evt.startdate)) {
        throw new Meteor.Error('validation-error', 'Start date must be in YYYY-MM-DD format.');
    }
    if (evt.until && !isISODate(evt.until)) {
        throw new Meteor.Error('validation-error', 'Until date must be in YYYY-MM-DD format.');
    }

    const frequency = toIntegerOr(evt.frequency, RRule.MONTHLY);
    if (!FREQUENCIES.includes(frequency)) {
        throw new Meteor.Error('validation-error', 'Frequency must be daily, weekly, monthly, or yearly.');
    }

    const interval = toIntegerOr(evt.interval, 1);
    if (interval < 1) {
        throw new Meteor.Error('validation-error', 'Interval must be at least 1.');
    }

    if (evt.setPos !== undefined && evt.setPos !== null && evt.setPos !== '') {
        const parsedSetPos = toIntegerOr(evt.setPos, -1);
        if (parsedSetPos < 1 || parsedSetPos > 31) {
            throw new Meteor.Error('validation-error', 'setPos must be between 1 and 31.');
        }
    }

    if (evt.weekdays) {
        const weekdays = Array.isArray(evt.weekdays) ? evt.weekdays : String(evt.weekdays).split(',');
        const invalidWeekday = weekdays.find((weekday) => !VALID_WEEKDAYS.has(String(weekday)));
        if (invalidWeekday) {
            throw new Meteor.Error('validation-error', `Invalid weekday: ${invalidWeekday}`);
        }
    }
};

const standardizeEvent = (evt, userId) => {
    let evtObj = { ...evt };
    delete evtObj.running;
    delete evtObj.timestamp;
    delete evtObj.due;
    delete evtObj.dueHuge;
    delete evtObj.listId;
    delete evtObj.amount;

    evtObj.title = evt.title.trim();
    evtObj.type = evt.type;
    evtObj.startdate = evt.startdate;
    evtObj.amountCents = parseAmountToCents(evt.amount);
    evtObj.recurring = !!evt.recurring;
    evtObj.interval = toIntegerOr(evt.interval, 1);
    evtObj.frequency = toIntegerOr(evt.frequency, RRule.MONTHLY);
    evtObj.lastDayOfMonth = !!evt.lastDayOfMonth;
    evtObj.weekdaysOnly = !!evt.weekdaysOnly;
    evtObj.autoPay = !!evt.autoPay;
    evtObj.setPos = evt.setPos === '' || evt.setPos === undefined ? 1 : toIntegerOr(evt.setPos, 1);
    evtObj.until = evt.until || '';
    evtObj.statementDate = evt.statementDate || evt.ccStatement?.statementDate || null;
    evtObj.variableAmount = !!evt.variableAmount;
    delete evtObj.ccStatement;

    // if the event is weekly and no weekdays are selected, set the weekday to the day of the week
    // if only one weekday is selected, set the weekday to the new day, for convenience
    if (
        evtObj.frequency === RRule.WEEKLY &&
        evt.weekdays &&
        (evt.weekdays.length === 0 || evt.weekdays.length === 1)
    ) {
        // figure out the day of the week from the startdate
        let weekday = DateTime.fromISO(evtObj.startdate).weekday;


        evtObj.weekdays = [weekdayMap[weekday]].toString();
    }

    if (evt._id) {
        evtObj.updatedAt = DateTime.now().toMillis();
        delete evtObj.createdAt;
    } else {
        evtObj.createdAt = DateTime.now().toMillis();
    }
    evtObj.userId = userId;

    if (evtObj.weekdaysOnly === true) {
        evtObj.weekdays = [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR].toString();
    } else {
        if (evtObj.weekdays) {
            // Normalize to comma-separated string (form sends arrays from multi-select)
            evtObj.weekdays = Array.isArray(evtObj.weekdays)
                ? evtObj.weekdays.join(',')
                : String(evtObj.weekdays);
        } else if (evt.weekdays) {
            evtObj.weekdays = Array.isArray(evt.weekdays)
                ? evt.weekdays.join(',')
                : String(evt.weekdays);
        } else {
            evtObj.weekdays = '';
        }
    }

    return evtObj;
}

const migrateStatementDateToTopLevel = async () => {
    const candidates = await EventsCollection.find({
        ccStatement: { $exists: true }
    }).fetchAsync();

    for (const evt of candidates) {
        await EventsCollection.updateAsync(evt._id, {
            $set: { statementDate: evt.ccStatement?.statementDate || null },
            $unset: { ccStatement: '' }
        });
    }
};

const migrateAmountsToCents = async () => {
    const candidates = await EventsCollection.find({
        $or: [{ amountCents: { $exists: false } }, { amountCents: null }],
        amount: { $exists: true }
    }).fetchAsync();

    for (const evt of candidates) {
        let amountCents = 0;
        try {
            amountCents = parseAmountToCents(evt.amount);
        } catch (err) {
            amountCents = 0;
        }

        await EventsCollection.updateAsync(evt._id, {
            $set: { amountCents },
            $unset: { amount: '' }
        });
    }
};

Meteor.startup(async () => {
    await migrateAmountsToCents();
    await migrateStatementDateToTopLevel();
});

Meteor.methods({
    async 'events.insertAsync'(evt) {
        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        validateEventInput(evt);
        await EventsCollection.insertAsync({...standardizeEvent(evt, this.userId)})
    },

    async 'events.edit'(evt) {
        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        check(evt._id, String);
        validateEventInput(evt);

        const foundEvent = await EventsCollection.findOneAsync({ _id: evt._id, userId: this.userId });

        if (!foundEvent) {
            throw new Meteor.Error('Not found.');
        }

        let evtUpdate = standardizeEvent(evt, this.userId);

        // slow, see difference in object and update individual keys. or send only keys that need updating from front ned
        return await EventsCollection.updateAsync(evt._id, {
            $set: {...evtUpdate},
            $unset: { amount: '' }
        })

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
    },

    async 'events.updateStatementDate'(eventId, statementDate) {
        check(eventId, String);
        check(statementDate, Match.Maybe(String));

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        const event = await EventsCollection.findOneAsync({_id: eventId, userId: this.userId});

        if (!event) {
            throw new Meteor.Error('Not authorized.');
        }

        await EventsCollection.updateAsync(eventId, {
            $set: { statementDate }
        });
    }
});
