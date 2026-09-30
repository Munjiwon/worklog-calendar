const test = require("node:test");
const assert = require("node:assert/strict");

const { shouldRecordUserAccess } = require("../server");

test("records authenticated page and API access", () => {
  assert.equal(shouldRecordUserAccess("GET", "/"), true);
  assert.equal(shouldRecordUserAccess("GET", "/admin"), true);
  assert.equal(shouldRecordUserAccess("GET", "/api/session"), true);
  assert.equal(shouldRecordUserAccess("PUT", "/api/calendar-data"), true);
  assert.equal(shouldRecordUserAccess("POST", "/api/activity"), true);
});

test("ignores static asset requests", () => {
  assert.equal(shouldRecordUserAccess("GET", "/app.js"), false);
  assert.equal(shouldRecordUserAccess("GET", "/styles.css"), false);
  assert.equal(shouldRecordUserAccess("GET", "/favicon.ico"), false);
});
