import assert from "assert";
import { Meteor } from "meteor/meteor";
import { RRule } from "rrule";
import expandEvents from "../imports/util/expandEvents";

// Each fixture below mirrors a real record from the budget `events` collection,
// chosen because the standalone Python re-implementation in openclaw's
// dashboard-data.py got it wrong. These lock in the behavior that lives here.
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

const dues = (events, start, end) =>
  expandEvents(events, start, end).map((e) => e.due);

if (Meteor.isServer) {
  describe("expandEvents", function () {
    it("expands a monthly bill on its setPos day", function () {
      const mortgage = baseEvent({
        title: "Mortgage",
        startdate: "2025-12-01",
        frequency: RRule.MONTHLY,
        interval: 1,
        setPos: 1,
        amountCents: 320000,
      });

      assert.deepStrictEqual(
        dues([mortgage], "2026-08-13", "2026-09-12"),
        ["09/01/2026"]
      );
    });

    it("expands a daily-interval bill that is not expressible in months", function () {
      // "Cleaner": every 28 days from a Monday. The Python port only handled
      // frequency === MONTHLY, so this bill silently vanished from the dashboard.
      const cleaner = baseEvent({
        title: "Cleaner",
        startdate: "2026-06-29",
        frequency: RRule.DAILY,
        interval: 28,
        weekdays: "MO",
        amountCents: 40000,
      });

      assert.deepStrictEqual(
        dues([cleaner], "2026-08-13", "2026-09-12"),
        ["08/24/2026"]
      );
    });

    it("coerces a string interval before computing occurrences", function () {
      // "Vetsource": interval is stored as the string "3", which crashed the
      // Python port with `unsupported operand type(s) for +: 'int' and 'str'`.
      const vetsource = baseEvent({
        title: "Vetsource",
        startdate: "2025-02-19",
        frequency: RRule.WEEKLY,
        interval: "3",
        weekdays: "WE",
        amountCents: 7928,
      });

      assert.deepStrictEqual(
        dues([vetsource], "2026-08-13", "2026-09-12"),
        ["08/19/2026", "09/09/2026"]
      );
    });

    it("excludes a recurrence whose until date has passed", function () {
      const expired = baseEvent({
        title: "Klarna (Wayfair)",
        startdate: "2024-09-18",
        frequency: RRule.MONTHLY,
        interval: 2,
        until: "2024-11-01",
      });

      assert.deepStrictEqual(dues([expired], "2026-08-13", "2026-09-12"), []);
    });

    it("yields exactly one occurrence for a non-recurring bill", function () {
      const oneOff = baseEvent({
        title: "Juniper surgery",
        startdate: "2026-08-20",
        recurring: false,
        amountCents: 120000,
      });

      assert.deepStrictEqual(
        dues([oneOff], "2026-08-13", "2026-09-12"),
        ["08/20/2026"]
      );
    });

    it("excludes a non-recurring bill dated outside the window", function () {
      const past = baseEvent({
        title: "Home Audit",
        startdate: "2025-08-19",
        recurring: false,
        amountCents: 116000,
      });

      assert.deepStrictEqual(dues([past], "2026-08-13", "2026-09-12"), []);
    });

    it("resolves amountCents through getAmountCents for legacy records", function () {
      const legacy = baseEvent({
        title: "Whole Life",
        startdate: "2026-08-22",
        recurring: false,
        amountCents: undefined,
        amount: "93.00",
      });

      const [occurrence] = expandEvents([legacy], "2026-08-13", "2026-09-12");
      assert.strictEqual(occurrence.amountCents, 9300);
    });

    it("flags only the occurrences listed in skipDates as skipped", function () {
      const travel = baseEvent({
        title: "Savings - Travel",
        startdate: "2026-01-01",
        setPos: 1,
        skipDates: ["2026-09-01"],
      });

      assert.deepStrictEqual(
        expandEvents([travel], "2026-08-01", "2026-10-31").map((e) => [e.dueISO, e.skipped]),
        [["2026-08-01", false], ["2026-09-01", true], ["2026-10-01", false]]
      );
    });

    // Occurrences after the November DST fall-back used to land a day early
    // (local midnight fed to rrule's UTC math). Only visible when the process
    // runs in a DST zone, which the app container does (America/Chicago).
    it("keeps a 28-day Monday bill on Mondays across the DST change", function () {
      const cleaner = baseEvent({
        title: "Cleaner",
        startdate: "2026-09-28",
        frequency: RRule.DAILY,
        interval: 28,
        weekdays: "MO",
      });

      assert.deepStrictEqual(
        dues([cleaner], "2026-09-01", "2027-01-31"),
        ["09/28/2026", "10/26/2026", "11/23/2026", "12/21/2026", "01/18/2027"]
      );
    });

    it("keeps a monthly bill on its setPos day through winter", function () {
      const card = baseEvent({
        title: "BofA CC",
        type: "cc_payment",
        startdate: "2024-08-14",
        setPos: 14,
      });

      assert.deepStrictEqual(
        dues([card], "2026-10-01", "2027-03-31"),
        ["10/14/2026", "11/14/2026", "12/14/2026", "01/14/2027", "02/14/2027", "03/14/2027"]
      );
    });

    it("reports dates without a time-of-day offset", function () {
      const [occ] = expandEvents([baseEvent({ startdate: "2026-12-01", recurring: false })],
        "2026-12-01", "2026-12-01");
      assert.strictEqual(occ.dueISO, "2026-12-01");
      assert.strictEqual(occ.dueHuge.startsWith("Tue"), true);
    });
  });
}
