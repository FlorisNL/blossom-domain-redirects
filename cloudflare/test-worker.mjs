import assert from 'node:assert/strict';
import worker from './worker.mjs';

const cases = [
  ['/', 'https://www.moreblossom.com/'],
  ['/?s=psilocybin', 'https://www.moreblossom.com/database?s=psilocybin'],
  ['/psychedelics-research-links-february-2020/', 'https://www.moreblossom.com/blog/psychedelics-research-links-february-2020'],
  ['/topic/psilocybin?utm_source=legacy', 'https://www.moreblossom.com/topics/psilocybin?utm_source=legacy'],
  ['/companies/example', 'https://www.moreblossom.com/stakeholders/example'],
  ['/people/example', 'https://www.moreblossom.com/persons/example'],
  ['/product/example', 'https://www.moreblossom.com/pricing'],
  ['/author/example', 'https://www.moreblossom.com/persons'],
  ['/example/feed/', 'https://www.moreblossom.com/example'],
  ['/example/page/2/', 'https://www.moreblossom.com/example'],
  ['/papers/unmapped-legacy-path', 'https://www.moreblossom.com/papers'],
  ['/unmapped-legacy-path', 'https://www.moreblossom.com/'],
  ['/topic/%E7%B2%BE%E7%A5%9E', 'https://www.moreblossom.com/topics/%E7%B2%BE%E7%A5%9E'],
];
for (const [path, expected] of cases) {
  const result = await worker.fetch(new Request(`https://blossomanalysis.com${path}`));
  assert.equal(result.status, 301, path);
  assert.equal(result.headers.get('Location'), expected, path);
}
for (const path of ['/wp-admin/', '/wp-login.php', '/xmlrpc.php', '/wp-content/uploads/example.jpg', '/wp-cron.php']) {
  const result = await worker.fetch(new Request(`https://blossomanalysis.com${path}`));
  assert.equal(result.status, 410, path);
}
console.log(`${cases.length} redirect cases and 5 retired WordPress endpoints passed`);
