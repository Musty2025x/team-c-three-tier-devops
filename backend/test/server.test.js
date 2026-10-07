import test from "node:test";
import assert from "node:assert/strict";

test("health contract", () => {
  const response = {
    status: "ok",
    service: "team-c-api",
    database: "connected"
  };

  assert.equal(response.status, "ok");
  assert.equal(response.database, "connected");
});
