import assert from "assert";
import { Readable } from "stream";
import { Meteor } from "meteor/meteor";
import { EventsCollection } from "../imports/db/EventsCollection";
import { PaymentsCollection } from "../imports/db/PaymentsCollection";

if (Meteor.isServer) {
  const { handleWriteApi } = require("../server/writeApi");
  const TOKEN = "test-token";

  // Drive the handler the way WebApp does: a request stream and a response
  // that records writeHead/end.
  const call = (method, url, body, token = TOKEN) =>
    new Promise((resolve) => {
      // A real stream buffers the body until the handler reads it, like HTTP.
      const payload = body === undefined ? [] : [typeof body === "string" ? body : JSON.stringify(body)];
      const req = Readable.from(payload);
      Object.assign(req, { method, url, originalUrl: url, headers: token ? { authorization: `Bearer ${token}` } : {} });
      const res = {
        writeHead(status) { this.status = status; },
        end(text) { resolve({ status: this.status, body: text ? JSON.parse(text) : undefined }); },
      };
      handleWriteApi(req, res);
    });

  const cleaner = {
    title: "Cleaner", type: "bill", startdate: "2026-09-28", recurring: true, interval: 28,
    frequency: 3, setPos: 1, weekdays: "MO", amountCents: 40000,
  };

  describe("write API", function () {
    let saved;

    beforeEach(async function () {
      saved = process.env.BUDGET_API_TOKEN;
      process.env.BUDGET_API_TOKEN = TOKEN;
      await Meteor.users.removeAsync({});
      await EventsCollection.removeAsync({});
      await PaymentsCollection.removeAsync({});
      await Meteor.users.insertAsync({ _id: "owner", services: { github: { username: "anherrera" } } });
      await Meteor.users.insertAsync({ _id: "stranger", services: { github: { username: "someone" } } });
    });

    afterEach(function () {
      process.env.BUDGET_API_TOKEN = saved;
    });

    it("rejects a missing or wrong token", async function () {
      assert.strictEqual((await call("GET", "/api/events", undefined, null)).status, 401);
      assert.strictEqual((await call("GET", "/api/events", undefined, "nope")).status, 401);
    });

    it("is off when no token is configured", async function () {
      delete process.env.BUDGET_API_TOKEN;
      assert.strictEqual((await call("GET", "/api/events")).status, 503);
    });

    it("creates an event for the owner from amountCents", async function () {
      const { status, body } = await call("POST", "/api/events", cleaner);
      assert.strictEqual(status, 201);
      assert.strictEqual(body.userId, "owner");
      assert.strictEqual(body.amountCents, 40000);
      assert.strictEqual(body.amount, undefined);
    });

    it("rejects unknown fields and invalid values", async function () {
      assert.strictEqual((await call("POST", "/api/events", { ...cleaner, userId: "stranger" })).status, 400);
      assert.strictEqual((await call("POST", "/api/events", { ...cleaner, startdate: "11/23/2026" })).status, 400);
      assert.strictEqual((await call("POST", "/api/events", "not json")).status, 400);
    });

    it("patches only the given fields and validates the result", async function () {
      const { body: created } = await call("POST", "/api/events", cleaner);
      await EventsCollection.updateAsync(created._id, { $set: { skipDates: ["2026-11-23"] } });

      const { status, body } = await call("PATCH", `/api/events/${created._id}`, { statementDate: "2026-11-23", amountCents: 41000 });
      assert.strictEqual(status, 200);
      assert.strictEqual(body.statementDate, "2026-11-23");
      assert.strictEqual(body.amountCents, 41000);
      assert.strictEqual(body.title, "Cleaner");
      assert.strictEqual(body.interval, 28);
      assert.deepStrictEqual(body.skipDates, ["2026-11-23"]);

      assert.strictEqual((await call("PATCH", `/api/events/${created._id}`, { interval: 0 })).status, 400);
      assert.strictEqual((await call("PATCH", `/api/events/${created._id}`, { amount: -5 })).status, 400);
    });

    it("cannot see or touch another user's events", async function () {
      const theirs = await EventsCollection.insertAsync({ ...cleaner, userId: "stranger" });
      assert.deepStrictEqual((await call("GET", "/api/events")).body, []);
      assert.strictEqual((await call("GET", `/api/events/${theirs}`)).status, 404);
      assert.strictEqual((await call("PATCH", `/api/events/${theirs}`, { title: "x" })).status, 404);
      assert.strictEqual((await call("DELETE", `/api/events/${theirs}`)).status, 404);
      assert.ok(await EventsCollection.findOneAsync(theirs));
    });

    it("skips and unskips an occurrence", async function () {
      const { body: created } = await call("POST", "/api/events", cleaner);
      const skipped = await call("POST", `/api/events/${created._id}/skips`, { date: "2026-11-23" });
      assert.deepStrictEqual(skipped.body.skipDates, ["2026-11-23"]);
      const unskipped = await call("DELETE", `/api/events/${created._id}/skips/2026-11-23`);
      assert.deepStrictEqual(unskipped.body.skipDates, []);
    });

    it("deletes an event", async function () {
      const { body: created } = await call("POST", "/api/events", cleaner);
      assert.strictEqual((await call("DELETE", `/api/events/${created._id}`)).status, 204);
      assert.strictEqual(await EventsCollection.findOneAsync(created._id), undefined);
    });

    it("upserts and removes a payment per occurrence", async function () {
      const { body: created } = await call("POST", "/api/events", cleaner);
      const first = await call("POST", "/api/payments", { eventId: created._id, dueDate: "2026-11-23", amountCents: 0, source: "test" });
      assert.strictEqual(first.status, 200);
      assert.strictEqual(first.body.amountCents, 0);
      assert.strictEqual(first.body.title, "Cleaner");

      await call("POST", "/api/payments", { eventId: created._id, dueDate: "2026-11-23", amountCents: 40000 });
      const list = await call("GET", "/api/payments?start=2026-11-01&end=2026-11-30");
      assert.strictEqual(list.body.length, 1);
      assert.strictEqual(list.body[0].amountCents, 40000);

      assert.strictEqual((await call("DELETE", `/api/payments/${created._id}/2026-11-23`)).status, 204);
      assert.strictEqual((await call("DELETE", `/api/payments/${created._id}/2026-11-23`)).status, 404);
    });

    it("answers 405 for a known path with the wrong method", async function () {
      assert.strictEqual((await call("PUT", "/api/events")).status, 405);
    });
  });
}
