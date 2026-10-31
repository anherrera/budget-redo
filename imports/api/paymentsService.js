import {Meteor} from 'meteor/meteor';
import {DateTime} from 'luxon';
import {EventsCollection} from '../db/EventsCollection';
import {PaymentsCollection} from '../db/PaymentsCollection';

const isISODate = (value) =>
    typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && DateTime.fromISO(value).isValid;

const ownedEvent = async (userId, eventId) => {
    if (typeof eventId !== 'string') throw new Meteor.Error('validation-error', 'eventId is required.');
    const event = await EventsCollection.findOneAsync({_id: eventId, userId});
    if (!event) throw new Meteor.Error('Not found.');
    return event;
};

const nowISO = () => DateTime.now().toISO({suppressMilliseconds: true, includeOffset: false});

/** Payments for the owner's events, optionally limited to a due-date window. */
export const listPayments = async (userId, {start, end} = {}) => {
    const eventIds = (await EventsCollection.find({userId}, {fields: {_id: 1}}).fetchAsync()).map((e) => e._id);
    const dueDate = {};
    if (start) dueDate.$gte = start;
    if (end) dueDate.$lte = end;
    return PaymentsCollection.find({
        eventId: {$in: eventIds},
        ...(start || end ? {dueDate} : {}),
    }, {sort: {dueDate: 1}}).fetchAsync();
};

/**
 * Mark one occurrence paid, keyed (eventId, dueDate). Posting the same
 * occurrence again updates it rather than adding a second row.
 * $0.00 is a valid amount, not missing data.
 */
export const upsertPayment = async (userId, input) => {
    const event = await ownedEvent(userId, input.eventId);
    if (!isISODate(input.dueDate)) {
        throw new Meteor.Error('validation-error', 'dueDate must be YYYY-MM-DD.');
    }
    const amountCents = input.amountCents ?? 0;
    if (!Number.isInteger(amountCents) || amountCents < 0) {
        throw new Meteor.Error('validation-error', 'amountCents must be a non-negative integer.');
    }

    const now = nowISO();
    await PaymentsCollection.upsertAsync(
        {eventId: event._id, dueDate: input.dueDate},
        {
            $set: {
                title: event.title,
                paidAt: input.paidAt || now,
                amountCents,
                note: input.note ?? null,
                source: input.source || 'api',
                updatedAt: now,
            },
            $setOnInsert: {createdAt: now},
        }
    );
    return PaymentsCollection.findOneAsync({eventId: event._id, dueDate: input.dueDate});
};

/** Unmark an occurrence. Returns whether a row was removed. */
export const removePayment = async (userId, eventId, dueDate) => {
    await ownedEvent(userId, eventId);
    return (await PaymentsCollection.removeAsync({eventId, dueDate})) > 0;
};
