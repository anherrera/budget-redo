import {DateTime} from "luxon";
import {RRule} from "rrule";

const defaultEvent = {
    title: '',
    type: 'bill',
    amount: '',
    startdate: DateTime.now().startOf('month').toISODate(),
    recurring: false,
    interval: 1,
    frequency: RRule.MONTHLY,
    setPos: 1,
    lastDayOfMonth: false,
    weekdays: [],
    weekdaysOnly: false,
    until: '',
    autoPay: false,
    statementDate: null,
    variableAmount: false
}

export default defaultEvent;
