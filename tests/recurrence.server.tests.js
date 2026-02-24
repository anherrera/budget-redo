import assert from "assert";
import { Meteor } from "meteor/meteor";
import { DateTime } from "luxon";
import { RRule } from "rrule";
import { EventsCollection } from "../imports/db/EventsCollection";
import { adjustToWeekday, shouldAdjustToWeekday } from "../imports/util/weekdayAdjustment";
import "../imports/api/eventsMethods";

const insertMethod = () => Meteor.server.method_handlers["events.insertAsync"];

const baseEvent = (overrides = {}) => ({
  title: "Recurring item",
  type: "bill",
  amount: "10.00",
  startdate: "2026-02-02",
  recurring: true,
  interval: 1,
  frequency: RRule.MONTHLY,
  setPos: 1,
  lastDayOfMonth: false,
  weekdays: [],
  weekdaysOnly: false,
  until: "",
  autoPay: false,
  statementDate: null,
  variableAmount: false,
  ...overrides,
});

if (Meteor.isServer) {
  describe("recurrence behavior", function () {
    beforeEach(async function () {
      await EventsCollection.removeAsync({});
    });

    it("defaults weekly recurrence weekday to startdate weekday when weekdays is empty", async function () {
      await insertMethod().apply(
        { userId: "user-1" },
        [
          baseEvent({
            frequency: RRule.WEEKLY,
            startdate: "2026-02-02",
            weekdays: [],
          }),
        ]
      );

      const saved = await EventsCollection.findOneAsync({ userId: "user-1" });
      assert.strictEqual(saved.weekdays, "MO");
    });

    it("forces weekdays to Mon-Fri when weekdaysOnly is enabled", async function () {
      await insertMethod().apply(
        { userId: "user-1" },
        [
          baseEvent({
            weekdaysOnly: true,
            weekdays: ["SU"],
          }),
        ]
      );

      const saved = await EventsCollection.findOneAsync({ userId: "user-1" });
      assert.strictEqual(saved.weekdays, "MO,TU,WE,TH,FR");
    });
  });

  describe("weekday adjustment utils", function () {
    it("adjusts Saturday to previous Friday", function () {
      const sat = DateTime.fromISO("2026-02-28").toJSDate();
      const adjusted = adjustToWeekday(sat);
      assert.strictEqual(DateTime.fromJSDate(adjusted).toISODate(), "2026-02-27");
    });

    it("adjusts Sunday to previous Friday", function () {
      const sun = DateTime.fromISO("2026-03-01").toJSDate();
      const adjusted = adjustToWeekday(sun);
      assert.strictEqual(DateTime.fromJSDate(adjusted).toISODate(), "2026-02-27");
    });

    it("does not adjust weekdays", function () {
      const mon = DateTime.fromISO("2026-03-02").toJSDate();
      const adjusted = adjustToWeekday(mon);
      assert.strictEqual(DateTime.fromJSDate(adjusted).toISODate(), "2026-03-02");
    });

    it("shouldAdjustToWeekday returns true for weekdaysOnly monthly events", function () {
      assert.strictEqual(
        shouldAdjustToWeekday({
          recurring: true,
          weekdaysOnly: true,
          frequency: RRule.MONTHLY,
        }),
        true
      );
    });

    it("shouldAdjustToWeekday returns true for explicit Mon-Fri string weekdays", function () {
      assert.strictEqual(
        shouldAdjustToWeekday({
          recurring: true,
          weekdaysOnly: false,
          weekdays: "MO,TU,WE,TH,FR",
          frequency: RRule.MONTHLY,
        }),
        true
      );
    });

    it("shouldAdjustToWeekday returns false when weekend day is included", function () {
      assert.strictEqual(
        shouldAdjustToWeekday({
          recurring: true,
          weekdaysOnly: false,
          weekdays: "MO,TU,WE,TH,SA",
          frequency: RRule.MONTHLY,
        }),
        false
      );
    });
  });
}
