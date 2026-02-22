import { DateTime } from "luxon";
import { RRule } from "rrule";
import { Event } from "../types/Event";

const defaultEvent: Partial<Event> = {
    title: '',
    type: 'bill',
    amountCents: 0,
    startdate: DateTime.now().startOf('month').toISODate(),
    interval: 1,
    frequency: RRule.MONTHLY,
    lastDayOfMonth: false,
    weekdays: '',
    weekdaysOnly: false,
    ccStatement: {
        statementDate: undefined
    }
}

export default defaultEvent;
