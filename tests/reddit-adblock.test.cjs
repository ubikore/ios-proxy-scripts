const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const script = fs.readFileSync(path.join(__dirname, '../scripts/reddit-adblock.js'), 'utf8');

function run(body, requestHeaders, responseHeaders = {}) {
  let result, calls = 0;
  const context = {
    $response: { body, headers: responseHeaders },
    $done: value => { result = value; calls++; },
    console: { log() {} }
  };
  if (requestHeaders !== undefined) context.$request = { headers: requestHeaders };
  vm.runInNewContext(script, context, { timeout: 1000 });
  assert.equal(calls, 1, '$done must be called exactly once');
  return result.body === undefined ? body : result.body;
}

// Synthetic operation names exercise the reference rule's Ads matching behavior.
// They are not claimed to come from a captured post-page response.
test('dedicated ad operations are suppressed even without feed edges', () => {
  const body = JSON.stringify({ data: { placement: { creative: { id: 'ad' } } } });
  for (const operation of ['PostAds', 'CommentTreeAds', 'Ads', 'postads']) {
    for (const key of ['X-APOLLO-OPERATION-NAME', 'x-apollo-operation-name', 'X-Apollo-Operation-Name']) {
      assert.equal(run(body, { [key]: operation }), '{}');
    }
  }
});

test('normal post, comment and eligibility responses stay byte-for-byte unchanged', () => {
  const body = '{ "data": {"post":{"title":"Ads discussion"},"comments":[{"body":"keep"}],"isNsfw":true,"isPremiumMember":false} }';
  for (const operation of ['PostDetails', 'PostComments', 'GetUserAdEligibility', '']) {
    assert.equal(run(body, { 'x-apollo-operation-name': operation }), body);
  }
  assert.equal(run(body), body);
  assert.equal(run(body, {}), body);
});

test('feed ads are still filtered while pagination and normal nodes survive', () => {
  const normal = { node: { __typename: 'Post', title: 'keep', isNsfw: true } };
  const pageInfo = { endCursor: 'next', hasNextPage: true };
  const data = { data: { feed: { edges: [{ node: { adPayload: { id: 'ad' } } }, normal], pageInfo } } };
  const expected = { data: { feed: { edges: [normal], pageInfo } } };
  assert.deepEqual(JSON.parse(run(JSON.stringify(data), {})), expected);
  for (const newline of ['\r\n', '\n']) {
    const prefix = '--test-boundary' + newline + 'Content-Type: application/json' + newline + newline;
    const suffix = newline + '--test-boundary--' + newline;
    const body = prefix + JSON.stringify(data) + suffix;
    const headers = { 'Content-Type': 'multipart/mixed; boundary="test-boundary"' };
    assert.equal(run(body, {}, headers), prefix + JSON.stringify(expected) + suffix);
    const truncated = body.replace('--test-boundary--', '');
    assert.equal(run(truncated, {}, headers), truncated);
  }
});

test('malformed and empty non-ad responses are passed through', () => {
  for (const body of ['', '{bad', '<html>error</html>', 'null', '[]']) {
    assert.equal(run(body, {}), body);
  }
});
