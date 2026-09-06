import { Mongo } from 'meteor/mongo';

/**
 * One document per paid occurrence of a bill. The app models bills as
 * recurrence RULES (events) and expands them at read time, so this is the only
 * place an individual due date can be marked paid.
 *
 *   { eventId:  'nBsA6FuvkxMqJp8px',   // events._id — the key
 *     dueDate:  '2026-09-14',          // YYYY-MM-DD — the key
 *     title:    'HELOC',               // display only, as it read when paid
 *     paidAt:   '2026-09-05T21:55:43',
 *     amountCents: 0,
 *     note, source, createdAt, updatedAt }
 *
 * Keyed on (eventId, dueDate), not title: titles are display strings that get
 * edited ("Amex CC [4th]" → "[5th]" when the statement day moved) and a
 * title-keyed row silently detaches from its bill the moment that happens.
 * Rows written before the eventId backfill may lack one; readers fall back to
 * (title, dueDate) for those and only those.
 */
export const PaymentsCollection = new Mongo.Collection('payments');

export const ensurePaymentIndexes = async () => {
    await PaymentsCollection.createIndexAsync(
        {eventId: 1, dueDate: 1},
        {
            name: 'occurrence_by_event',
            unique: true,
            // Legacy rows with a null eventId must not collide with each other.
            partialFilterExpression: {eventId: {$type: 'string'}},
        }
    );
    await PaymentsCollection.createIndexAsync({dueDate: 1}, {name: 'by_due'});
};
