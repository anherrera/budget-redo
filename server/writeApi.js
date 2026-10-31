import {WebApp} from 'meteor/webapp';
import {Meteor} from 'meteor/meteor';
import {timingSafeEqual} from 'crypto';
import {EventsCollection} from '../imports/db/EventsCollection';
import {isAllowedUser} from '../imports/api/allowedUsers';
import {EVENT_FIELDS, insertEvent, patchEvent, removeEvent, setSkip} from '../imports/api/eventsMethods';
import {listPayments, upsertPayment, removePayment} from '../imports/api/paymentsService';

// Token-authenticated JSON API over events and payments, so automation (the
// openclaw agent) edits through the app's own validation instead of writing
// Mongo directly.
//
//   GET    /api/events[?type=bill]          the owner's raw events
//   GET    /api/events/:id
//   POST   /api/events                      create; amount in dollars or amountCents
//   PATCH  /api/events/:id                  partial update, validated whole
//   DELETE /api/events/:id
//   POST   /api/events/:id/skips            {"date": "YYYY-MM-DD"}
//   DELETE /api/events/:id/skips/:date
//   GET    /api/payments[?start=&end=]
//   POST   /api/payments                    {eventId, dueDate, amountCents?, paidAt?, note?, source?}
//   DELETE /api/payments/:eventId/:dueDate
//
// Every request needs `Authorization: Bearer $BUDGET_API_TOKEN`. With no token
// configured the API is off.

const MAX_BODY = 64 * 1024;

const send = (res, status, body) => {
    res.writeHead(status, {'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store'});
    res.end(body === undefined ? '' : JSON.stringify(body));
};

class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}

const authorized = (req) => {
    const token = process.env.BUDGET_API_TOKEN;
    if (!token) throw new HttpError(503, 'API disabled: BUDGET_API_TOKEN is not set');
    const header = req.headers.authorization || '';
    const given = Buffer.from(header.startsWith('Bearer ') ? header.slice(7) : '');
    const want = Buffer.from(token);
    if (given.length !== want.length || !timingSafeEqual(given, want)) {
        throw new HttpError(401, 'Missing or wrong bearer token');
    }
};

const readJSON = (req) => new Promise((resolve, reject) => {
    if (req.body && typeof req.body === 'object') return resolve(req.body);
    let raw = '';
    req.on('data', (chunk) => {
        raw += chunk;
        if (raw.length > MAX_BODY) reject(new HttpError(413, 'Body too large'));
    });
    req.on('end', () => {
        try {
            const body = raw ? JSON.parse(raw) : {};
            if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error();
            resolve(body);
        } catch {
            reject(new HttpError(400, 'Body must be a JSON object'));
        }
    });
    req.on('error', reject);
});

const eventBody = async (req) => {
    const body = await readJSON(req);
    const unknown = Object.keys(body).filter((k) => !EVENT_FIELDS.includes(k));
    if (unknown.length) throw new HttpError(400, `Unknown field(s): ${unknown.join(', ')}`);
    return body;
};

const ownerId = async () => {
    const users = await Meteor.users.find({}, {fields: {services: 1}}).fetchAsync();
    const owners = users.filter((u) => isAllowedUser(u));
    if (owners.length !== 1) throw new HttpError(500, `Expected one allowlisted user, found ${owners.length}`);
    return owners[0]._id;
};

const routes = [
    ['GET', /^\/api\/events\/?$/, async ({userId, query}) => {
        const filter = {userId};
        if (query.get('type')) filter.type = query.get('type');
        return [200, await EventsCollection.find(filter, {sort: {createdAt: 1}}).fetchAsync()];
    }],
    ['GET', /^\/api\/events\/([^/]+)$/, async ({userId, params: [id]}) => {
        const event = await EventsCollection.findOneAsync({_id: id, userId});
        if (!event) throw new HttpError(404, 'Event not found');
        return [200, event];
    }],
    ['POST', /^\/api\/events\/?$/, async ({userId, req}) => {
        const id = await insertEvent(userId, await eventBody(req));
        return [201, await EventsCollection.findOneAsync(id)];
    }],
    ['PATCH', /^\/api\/events\/([^/]+)$/, async ({userId, req, params: [id]}) =>
        [200, await patchEvent(userId, id, await eventBody(req))]],
    ['DELETE', /^\/api\/events\/([^/]+)$/, async ({userId, params: [id]}) => {
        await removeEvent(userId, id);
        return [204];
    }],
    ['POST', /^\/api\/events\/([^/]+)\/skips\/?$/, async ({userId, req, params: [id]}) => {
        const {date} = await readJSON(req);
        await setSkip(userId, id, date, true);
        return [200, await EventsCollection.findOneAsync(id)];
    }],
    ['DELETE', /^\/api\/events\/([^/]+)\/skips\/(\d{4}-\d{2}-\d{2})$/, async ({userId, params: [id, date]}) => {
        await setSkip(userId, id, date, false);
        return [200, await EventsCollection.findOneAsync(id)];
    }],
    ['GET', /^\/api\/payments\/?$/, async ({userId, query}) =>
        [200, await listPayments(userId, {start: query.get('start'), end: query.get('end')})]],
    ['POST', /^\/api\/payments\/?$/, async ({userId, req}) =>
        [200, await upsertPayment(userId, await readJSON(req))]],
    ['DELETE', /^\/api\/payments\/([^/]+)\/(\d{4}-\d{2}-\d{2})$/, async ({userId, params: [eventId, dueDate]}) => {
        if (!await removePayment(userId, eventId, dueDate)) throw new HttpError(404, 'No payment for that occurrence');
        return [204];
    }],
];

// Meteor.Error codes from the shared validation -> HTTP status.
const statusFor = (err) => {
    if (err instanceof HttpError) return err.status;
    if (err.error === 'validation-error' || err.errorType === 'Match.Error') return 400;
    if (err.error === 'Not found.' || err.error === 'Not authorized.') return 404;
    return 500;
};

export const handleWriteApi = async (req, res) => {
    const url = new URL(req.originalUrl || req.url, 'http://localhost');
    try {
        authorized(req);
        const path = url.pathname.replace(/\/+$/, '') || '/';
        let matchedPath = false;
        for (const [method, pattern, handler] of routes) {
            const m = pattern.exec(path) || pattern.exec(`${path}/`);
            if (!m) continue;
            matchedPath = true;
            if (method !== req.method) continue;
            const [status, body] = await handler({
                req, userId: await ownerId(), query: url.searchParams, params: m.slice(1).map(decodeURIComponent),
            });
            return send(res, status, body);
        }
        throw new HttpError(matchedPath ? 405 : 404, matchedPath ? 'Method not allowed' : 'No such endpoint');
    } catch (err) {
        const status = statusFor(err);
        if (status === 500) console.error('[api]', req.method, url.pathname, err);
        send(res, status, {error: err.reason || err.message || String(err)});
    }
};

const handlers = WebApp.handlers || WebApp.connectHandlers;
handlers.use('/api/events', handleWriteApi);
handlers.use('/api/payments', handleWriteApi);
