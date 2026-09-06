import expandEvents from "./expandEvents.js";
import {getAmountCents} from "./runningBalance.js";

/**
 * Bills and card payments falling due within a window, as plain JSON-friendly
 * objects for external consumers (Home Assistant, the openclaw dashboard).
 *
 * Two sources of truth are reconciled here:
 *
 *   - `statementDate` is a real due date, recorded when an actual statement
 *     arrives. It is fact. (It is misnamed — see issue #25.)
 *   - the recurrence rule is an estimate of when the bill will next land.
 *
 * Where a statement date exists inside the window it wins outright, and the
 * recurrence for that event is skipped: the two would otherwise both appear,
 * disagreeing. Riverside is the motivating case — its recurrence resolves to
 * October while the bill is genuinely due in August.
 *
 * `payments` (PaymentsCollection rows) mark individual occurrences paid. A
 * paid bill is still listed — consumers decide how to show it — it just stops
 * being something that needs doing.
 */

// expandEvents formats `due` for display; consumers want ISO.
const toISO = (mmddyyyy) => {
    const [m, d, y] = mmddyyyy.split('/');
    return `${y}-${m}-${d}`;
};

const toBill = (evt, dueISO, cents, payment) => ({
    eventId: evt._id,
    title: evt.title,
    type: evt.type,
    amount: Math.round(cents) / 100,
    due: dueISO,
    autopay: Boolean(evt.autoPay),
    paid: Boolean(payment),
    paidAt: payment ? payment.paidAt ?? null : null,
});

/**
 * Index payment rows for the overlay. The key is (eventId, dueDate); a row
 * with no eventId (written before the backfill, or for a title that matched
 * several events) is matched on (title, dueDate) instead — and only such rows,
 * so an id-keyed row can never be claimed by a same-named sibling bill.
 */
export const paymentLookup = (payments = []) => {
    const byEvent = new Map();
    const byTitle = new Map();
    for (const p of payments) {
        if (p.eventId) byEvent.set(`${p.eventId}|${p.dueDate}`, p);
        else byTitle.set(`${p.title}|${p.dueDate}`, p);
    }
    return (evt, dueISO) =>
        byEvent.get(`${evt._id}|${dueISO}`) || byTitle.get(`${evt.title}|${dueISO}`) || null;
};

const buildUpcomingBills = (events, start, end, payments = []) => {
    const paymentFor = paymentLookup(payments);
    const all = [];
    events.forEach((e) => all.push(e));

    const stated = [];
    const inferred = [];
    for (const evt of all) {
        const sd = evt.statementDate;
        if (sd && sd >= start && sd <= end) stated.push(evt);
        else inferred.push(evt);
    }

    const bills = [
        ...stated.map((evt) =>
            toBill(evt, evt.statementDate, getAmountCents(evt), paymentFor(evt, evt.statementDate))
        ),
        ...expandEvents(inferred, start, end).map((occ) => {
            const dueISO = toISO(occ.due);
            return toBill(occ, dueISO, occ.amountCents, paymentFor(occ, dueISO));
        }),
    ];

    return bills.sort(
        (a, b) => a.due.localeCompare(b.due) || a.title.localeCompare(b.title)
    );
};

export default buildUpcomingBills;
