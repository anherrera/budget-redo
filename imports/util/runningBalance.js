const parseBalanceToCents = (balance) => {
    if (balance === '' || balance === null || balance === undefined) return 0;
    const parsed = parseFloat(balance);
    return Number.isFinite(parsed) ? Math.round(parsed * 100) : 0;
};

export const getAmountCents = (evt) => {
    if (Number.isInteger(evt.amountCents)) return evt.amountCents;
    const legacyAmount = parseFloat(evt.amount);
    if (!Number.isFinite(legacyAmount)) return 0;
    return Math.round(legacyAmount * 100);
};

export const sortByTimestampDeterministic = (events) => {
    return [...events].sort((a, b) => {
        if (a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;

        const aList = String(a.listId || '');
        const bList = String(b.listId || '');
        if (aList !== bList) return aList.localeCompare(bList);

        const aId = String(a._id || '');
        const bId = String(b._id || '');
        return aId.localeCompare(bId);
    });
};

export const applyRunningBalance = (events, balance) => {
    let runningCents = parseBalanceToCents(balance);

    return sortByTimestampDeterministic(events).map((evt) => {
        const amountCents = getAmountCents(evt);
        if (evt.type === 'bill' || evt.type === 'cc_payment') {
            runningCents -= amountCents;
        } else {
            runningCents += amountCents;
        }

        return {
            ...evt,
            amountCents,
            running: (runningCents / 100).toFixed(2)
        };
    });
};

