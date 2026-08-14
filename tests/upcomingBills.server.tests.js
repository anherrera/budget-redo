import assert from "assert";
import { Meteor } from "meteor/meteor";
import { RRule } from "rrule";
import buildUpcomingBills from "../imports/util/upcomingBills";

const baseEvent = (overrides = {}) => ({
  _id: "evt-1",
  title: "Some bill",
  type: "bill",
  amountCents: 1000,
  startdate: "2026-02-02",
  recurring: true,
  interval: 1,
  frequency: RRule.MONTHLY,
  setPos: 1,
  lastDayOfMonth: false,
  weekdays: "",
  weekdaysOnly: false,
  until: "",
  autoPay: false,
  statementDate: null,
  variableAmount: false,
  ...overrides,
});

const WINDOW = ["2026-08-13", "2026-09-12"];

if (Meteor.isServer) {
  describe("buildUpcomingBills", function () {
    it("derives occurrences from the recurrence when no statement date is set", function () {
      const mortgage = baseEvent({
        title: "Mortgage",
        startdate: "2025-12-01",
        setPos: 1,
        amountCents: 320000,
        autoPay: true,
      });

      assert.deepStrictEqual(buildUpcomingBills([mortgage], ...WINDOW), [
        { title: "Mortgage", type: "bill", amount: 3200, due: "2026-09-01", autopay: true, paid: false },
      ]);
    });

    it("prefers the statement date over the computed recurrence", function () {
      // Amex: setPos 18 puts the recurrence on the 18th, but a real statement
      // arrived saying the 28th. The statement is fact; the recurrence is a guess.
      const amex = baseEvent({
        title: "Amex CC [4th]",
        type: "cc_payment",
        startdate: "2025-10-18",
        setPos: 18,
        statementDate: "2026-08-28",
        amountCents: 355463,
        autoPay: true,
      });

      const [bill] = buildUpcomingBills([amex], ...WINDOW);
      assert.strictEqual(bill.due, "2026-08-28");
    });

    it("emits a bill whose statement date lands in the window even when its recurrence does not", function () {
      // Riverside: setPos 1 + interval 2 puts the next occurrence at Oct 1,
      // outside the window, but the bill is genuinely due Aug 20.
      const riverside = baseEvent({
        title: "Water Bill (Riverside)",
        startdate: "2026-08-20",
        interval: 2,
        setPos: 1,
        statementDate: "2026-08-20",
        amountCents: 19013,
        variableAmount: true,
      });

      const bills = buildUpcomingBills([riverside], ...WINDOW);
      assert.deepStrictEqual(
        bills.map((b) => b.due),
        ["2026-08-20"]
      );
    });

    it("falls back to the recurrence when the statement date is outside the window", function () {
      const stale = baseEvent({
        title: "Life Insurance (AmFam)",
        startdate: "2024-07-01",
        setPos: 9,
        statementDate: "2026-06-09",
        amountCents: 3868,
      });

      const [bill] = buildUpcomingBills([stale], ...WINDOW);
      assert.strictEqual(bill.due, "2026-09-09");
    });

    it("sorts by due date across events", function () {
      const late = baseEvent({ _id: "a", title: "Late", startdate: "2026-09-01", recurring: false });
      const early = baseEvent({ _id: "b", title: "Early", startdate: "2026-08-15", recurring: false });

      assert.deepStrictEqual(
        buildUpcomingBills([late, early], ...WINDOW).map((b) => b.title),
        ["Early", "Late"]
      );
    });

    it("converts cents to a currency amount", function () {
      const odd = baseEvent({ title: "Odd", startdate: "2026-08-20", recurring: false, amountCents: 19013 });
      assert.strictEqual(buildUpcomingBills([odd], ...WINDOW)[0].amount, 190.13);
    });
  });
}
