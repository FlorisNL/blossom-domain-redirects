import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import historical from './worker.mjs';

const plan = JSON.parse(await readFile(new URL('./native-redirect-plan.json', import.meta.url), 'utf8'));
const source = await readFile(new URL('./worker.mjs', import.meta.url), 'utf8');
const legacy = JSON.parse(source.match(/const exact = new Map\((.*?)\);\r?\n/s)[1]);
const exact = new Map();
const prefixes = [];
for (const { redirect } of plan.items) {
  assert.equal(redirect.status_code, 301);
  assert.equal(redirect.include_subdomains, true);
  assert.equal(redirect.preserve_query_string, true);
  const path = decodeURIComponent(redirect.source_url.replace('blossomanalysis.com', ''));
  assert(!exact.has(path), `Duplicate source ${path}`);
  exact.set(path, redirect);
  if (redirect.subpath_matching) prefixes.push([path, redirect]);
}
assert(plan.items.length <= 10_000, 'Exceeds free Bulk Redirect capacity');
assert(plan.singleRules.length <= 10, 'Exceeds free Single Redirect capacity');
assert.equal(plan.singleRules.length, 6);
prefixes.sort((a, b) => b[0].length - a[0].length);

function bulk(path) {
  const direct = exact.get(path);
  if (direct) return direct.target_url;
  const match = prefixes.find(([prefix]) => path.startsWith(prefix));
  assert(match, `No homepage fallback for ${path}`);
  const [prefix, redirect] = match;
  return new URL(redirect.target_url + (redirect.preserve_path_suffix ? path.slice(prefix.length) : '')).href;
}

let verified = 0;
for (const [path] of legacy) {
  for (const variant of [path, `${path}/`]) {
    const previous = await historical.fetch(new Request(`https://blossomanalysis.com${variant}`));
    assert.equal(bulk(variant), previous.headers.get('location'), variant);
    verified++;
  }
}
for (const [path, target] of [
  ['/topic/new-topic', '/topics/new-topic'],
  ['/companies/new-company', '/stakeholders/new-company'],
  ['/people/new-person', '/persons/new-person'],
  ['/papers/missing-paper', '/papers'],
  ['/product/retired-product', '/pricing'],
  ['/unknown-path', '/'],
  ['/', '/'],
]) assert.equal(bulk(path), `https://www.moreblossom.com${target}`, path);

console.log(JSON.stringify({ specificMappingsVerified: verified, bulkEntries: plan.items.length, singleRules: plan.singleRules.length, prefixChecks: 7 }));
