import assert from "assert";
import { Meteor } from "meteor/meteor";
import { allowedLogins, isAllowedUser } from "../imports/api/allowedUsers";

if (Meteor.isServer) {
  describe("allowedUsers", function () {
    // Shape of the real owner document in `users`.
    const owner = { _id: "MXMPRxci7jwGtMvBB", services: { github: { username: "anherrera" } } };

    it("allows the owner by default", function () {
      assert.strictEqual(isAllowedUser(owner, allowedLogins("")), true);
    });

    it("rejects any other GitHub or Google account", function () {
      const allowed = allowedLogins("");
      assert.strictEqual(isAllowedUser({ services: { github: { username: "someone" } } }, allowed), false);
      assert.strictEqual(isAllowedUser({ services: { google: { email: "x@example.com" } } }, allowed), false);
      assert.strictEqual(isAllowedUser(null, allowed), false);
    });

    it("reads a case-insensitive list from ALLOWED_LOGINS", function () {
      const allowed = allowedLogins("github:AnHerrera, google:Me@Example.com");
      assert.strictEqual(isAllowedUser(owner, allowed), true);
      assert.strictEqual(isAllowedUser({ services: { google: { email: "me@example.com" } } }, allowed), true);
    });
  });
}
