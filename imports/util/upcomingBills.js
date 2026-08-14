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
 */

// expandEvents formats `due` for display; consumers want ISO.
const toISO = (mmddyyyy) => {
    const [m, d, y] = mmddyyyy.split('/');
    return `${y}-${m}-${d}`;
};

const toBill = (evt, dueISO, cents) => ({
    title: evt.title,
    type: evt.type,
    amount: Math.round(cents) / 100,
    due: dueISO,
    autopay: Boolean(evt.autoPay),
    // The budget app does not track payment. Reported unpaid so a consumer
    // over-states what is owed rather than under-stating it; openclaw layers
    // real payment detection on top from mailbox scanning.
    paid: false,
});

const buildUpcomingBills = (events, start, end) => {
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
        ...stated.map((evt) => toBill(evt, evt.statementDate, getAmountCents(evt))),
        ...expandEvents(inferred, start, end).map((occ) =>
            toBill(occ, toISO(occ.due), occ.amountCents)
        ),
    ];

    return bills.sort(
        (a, b) => a.due.localeCompare(b.due) || a.title.localeCompare(b.title)
    );
};

export default buildUpcomingBills;
