import {WebApp} from 'meteor/webapp';
import {Meteor} from 'meteor/meteor';
import {EventsCollection} from '../imports/db/EventsCollection';
import {PaymentsCollection, ensurePaymentIndexes} from '../imports/db/PaymentsCollection';
import buildUpcomingBills from '../imports/util/upcomingBills';

// Read-only JSON for LAN consumers (Home Assistant, the openclaw dashboard).
// Deliberately thin: everything interesting lives in buildUpcomingBills, which
// is unit tested. This layer only parses a window and serialises.
//
// Unauthenticated, and therefore only appropriate because it is not exposed
// beyond the LAN. Do not publish this port.

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const localISO = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const daysFromToday = (n) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return localISO(d);
};

const sendJSON = (res, status, body) => {
    res.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    });
    res.end(JSON.stringify(body));
};

Meteor.startup(async () => {
    try {
        await ensurePaymentIndexes();
    } catch (err) {
        console.error('[api/bills] payments index', err);
    }
});

// Meteor 3 moved WebApp to Express; connectHandlers remains for compatibility.
const handlers = WebApp.handlers || WebApp.connectHandlers;

handlers.use('/api/bills', async (req, res) => {
    try {
        const params = new URL(req.originalUrl || req.url, 'http://localhost').searchParams;
        const start = params.get('start') || daysFromToday(0);
        const end = params.get('end') || daysFromToday(30);

        if (!ISO_DATE.test(start) || !ISO_DATE.test(end)) {
            return sendJSON(res, 400, {error: 'start and end must be YYYY-MM-DD'});
        }
        if (end < start) {
            return sendJSON(res, 400, {error: 'end must not precede start'});
        }

        const events = await EventsCollection.find({
            type: {$in: ['bill', 'cc_payment']},
        }).fetchAsync();

        // Paid state lives per occurrence in `payments`; only rows in the window
        // can match, so that is all we load.
        const payments = await PaymentsCollection.find({
            dueDate: {$gte: start, $lte: end},
        }).fetchAsync();

        const bills = buildUpcomingBills(events, start, end, payments);

        sendJSON(res, 200, {
            start,
            end,
            generated: new Date().toISOString(),
            count: bills.length,
            total: Math.round(bills.reduce((sum, b) => sum + b.amount, 0) * 100) / 100,
            bills,
        });
    } catch (err) {
        console.error('[api/bills]', err);
        sendJSON(res, 500, {error: err.message || String(err)});
    }
});
