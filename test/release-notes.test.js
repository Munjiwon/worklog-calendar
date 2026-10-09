const {test} = require('node:test');
const assert = require('node:assert/strict');
const releases = require('../release-notes');
test('release history has valid unique versions, dates and descriptions in newest-first order', () => {
  assert.ok(releases.length > 0);
  assert.equal(new Set(releases.map(r=>r.version)).size, releases.length);
  releases.forEach((r,i) => {
    assert.match(r.version,/^\d+\.\d+\.\d+$/);
    assert.match(r.date,/^\d{4}-\d{2}-\d{2}$/);
    assert.ok(r.title && r.changes.length && r.changes.every(c=>typeof c==='string' && c.trim()));
    if (i) assert.ok(releases[i-1].date >= r.date);
  });
  assert.equal(releases[0].version, require('../package.json').version);
});
