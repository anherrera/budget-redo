import {getAmountCents} from './runningBalance';

const EMPTY = {income: 0, expenses: 0, series: [], min: undefined, minDate: undefined, max: undefined, chartCategories: []};

/**
 * Totals, balance extremes and the per-day chart series for a list of expanded
 * events that already carry a `running` balance (see applyRunningBalance).
 */
export const summarizeEvents = (events) => {
    if (!events.length) return EMPTY;

    let incomeCents = 0;
    let expensesCents = 0;
    let min, minDate, max;
    // Last running total of each day, for the chart.
    const dailyRunning = new Map();

    events.forEach((evt) => {
        const amountCents = evt.skipped ? 0 : getAmountCents(evt);
        if (evt.type === 'income') incomeCents += amountCents;
        else if (evt.type === 'bill' || evt.type === 'cc_payment') expensesCents += amountCents;

        const running = parseFloat(evt.running);
        if (min === undefined || running < min) {
            min = running;
            minDate = evt.due;
        }
        if (max === undefined || running > max) max = running;
        dailyRunning.set(evt.due, running);
    });

    const days = Array.from(dailyRunning.entries()).sort((a, b) => new Date(a[0]) - new Date(b[0]));

    return {
        income: incomeCents / 100,
        expenses: expensesCents / 100,
        series: days.map(([, running]) => running),
        chartCategories: days.map(([date]) => date),
        min,
        minDate,
        max,
    };
};
