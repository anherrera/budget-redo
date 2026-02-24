import { RRule } from 'rrule';

export interface Event {
  _id?: string;
  title: string;
  type: 'bill' | 'income' | 'cc_payment';
  amountCents: number;
  frequency: number; // RRule frequency constants
  startdate: string; // ISO date string
  enddate?: string; // ISO date string
  interval?: number;
  count?: number;
  lastDayOfMonth?: boolean;
  weekdaysOnly?: boolean;
  weekdays?: string; // Comma-separated RRule weekday constants
  statementDate?: string | null;
  variableAmount?: boolean;
  userId?: string;
  createdAt?: number;
  updatedAt?: number;
  
  // UI-only fields (not persisted)
  running?: number;
  timestamp?: number;
  due?: string;
  dueHuge?: boolean;
  listId?: string;
}

export type EventType = Event['type'];

export const EventTypes = {
  BILL: 'bill' as const,
  INCOME: 'income' as const,
  CC_PAYMENT: 'cc_payment' as const,
};
