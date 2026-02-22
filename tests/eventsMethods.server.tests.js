import assert from "assert";
import { Meteor } from "meteor/meteor";
import { RRule } from "rrule";
import { EventsCollection } from "../imports/db/EventsCollection";
import "../imports/api/eventsMethods";

const insertMethod = () => Meteor.server.method_handlers["events.insertAsync"];
const editMethod = () => Meteor.server.method_handlers["events.edit"];
const removeMethod = () => Meteor.server.method_handlers["events.removeAsync"];
const updateCCMethod = () => Meteor.server.method_handlers["events.updateCCStatement"];

const validEvent = (overrides = {}) => ({
  title: "Rent",
  type: "bill",
  amount: "1250.55",
  startdate: "2026-02-01",
  recurring: true,
  interval: 1,
  frequency: RRule.MONTHLY,
  setPos: 1,
  lastDayOfMonth: false,
  weekdays: [],
  weekdaysOnly: false,
  until: "",
  autoPay: false,
  ccStatement: {
    statementDate: null,
  },
  ...overrides,
});

const expectMeteorError = async (fn, expectedReason) => {
  let caught = null;
  try {
    await fn();
  } catch (err) {
    caught = err;
  }

  assert.ok(caught, "Expected method to throw");
  const actualMessage = String(caught.reason || caught.error || caught.message || "");
  assert.ok(
    actualMessage.includes(expectedReason),
    `Expected error to include "${expectedReason}" but got "${actualMessage}"`
  );
};

if (Meteor.isServer) {
  describe("events methods", function () {
    beforeEach(async function () {
      await EventsCollection.removeAsync({});
    });

    it("inserts a valid event and stores amountCents", async function () {
      await insertMethod().apply({ userId: "user-1" }, [validEvent()]);

      const saved = await EventsCollection.findOneAsync({ userId: "user-1" });
      assert.ok(saved);
      assert.strictEqual(saved.title, "Rent");
      assert.strictEqual(saved.amountCents, 125055);
      assert.strictEqual(saved.amount, undefined);
      assert.strictEqual(saved.type, "bill");
    });

    it("rejects unauthenticated insert", async function () {
      await expectMeteorError(
        async () => insertMethod().apply({}, [validEvent()]),
        "Not authorized."
      );
    });

    it("rejects invalid type enum", async function () {
      await expectMeteorError(
        async () =>
          insertMethod().apply({ userId: "user-1" }, [validEvent({ type: "loan" })]),
        "Type must be one of: bill, income, cc_payment"
      );
    });

    it("rejects invalid frequency enum", async function () {
      await expectMeteorError(
        async () =>
          insertMethod().apply({ userId: "user-1" }, [validEvent({ frequency: 999 })]),
        "Frequency must be daily, weekly, monthly, or yearly."
      );
    });

    it("rejects invalid weekday value", async function () {
      await expectMeteorError(
        async () =>
          insertMethod().apply({ userId: "user-1" }, [validEvent({ weekdays: ["MO", "XX"] })]),
        "Invalid weekday: XX"
      );
    });

    it("rejects negative amounts", async function () {
      await expectMeteorError(
        async () =>
          insertMethod().apply({ userId: "user-1" }, [validEvent({ amount: "-1.00" })]),
        "Amount must be zero or greater."
      );
    });

    it("prevents editing another user's event", async function () {
      const eventId = await EventsCollection.insertAsync({
        ...validEvent(),
        amountCents: 500,
        userId: "owner-user",
        createdAt: Date.now(),
      });

      await expectMeteorError(
        async () =>
          editMethod().apply(
            { userId: "other-user" },
            [{ ...validEvent({ _id: eventId, amount: "10.00" }) }]
          ),
        "Not found."
      );
    });

    it("edits event, normalizes amountCents, and removes legacy amount", async function () {
      const eventId = await EventsCollection.insertAsync({
        ...validEvent(),
        userId: "owner-user",
        amount: "12.34",
        amountCents: null,
        createdAt: Date.now(),
      });

      await editMethod().apply(
        { userId: "owner-user" },
        [{ ...validEvent({ _id: eventId, amount: "20.01", title: "Updated rent" }) }]
      );

      const saved = await EventsCollection.findOneAsync({ _id: eventId });
      assert.strictEqual(saved.title, "Updated rent");
      assert.strictEqual(saved.amountCents, 2001);
      assert.strictEqual(saved.amount, undefined);
      assert.strictEqual(saved.updatedAt !== undefined, true);
    });

    it("prevents deleting another user's event", async function () {
      const eventId = await EventsCollection.insertAsync({
        ...validEvent(),
        amountCents: 1000,
        userId: "owner-user",
        createdAt: Date.now(),
      });

      await expectMeteorError(
        async () => removeMethod().apply({ userId: "other-user" }, [eventId]),
        "Not authorized."
      );
    });

    it("deletes owner event", async function () {
      const eventId = await EventsCollection.insertAsync({
        ...validEvent(),
        amountCents: 1000,
        userId: "owner-user",
        createdAt: Date.now(),
      });

      await removeMethod().apply({ userId: "owner-user" }, [eventId]);
      const saved = await EventsCollection.findOneAsync({ _id: eventId });
      assert.strictEqual(saved, undefined);
    });

    it("updates cc statement metadata for owner only", async function () {
      const eventId = await EventsCollection.insertAsync({
        ...validEvent({ type: "cc_payment" }),
        amountCents: 4200,
        userId: "owner-user",
        createdAt: Date.now(),
      });

      await expectMeteorError(
        async () =>
          updateCCMethod().apply(
            { userId: "other-user" },
            [eventId, { statementDate: "2026-02-15" }]
          ),
        "Not authorized."
      );

      await updateCCMethod().apply(
        { userId: "owner-user" },
        [eventId, { statementDate: "2026-02-15" }]
      );
      const saved = await EventsCollection.findOneAsync({ _id: eventId });
      assert.strictEqual(saved.ccStatement.statementDate, "2026-02-15");
    });
  });
}
