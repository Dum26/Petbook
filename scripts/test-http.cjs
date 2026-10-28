const assert = require('node:assert/strict');
const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3100';

async function main() {
  const routes = ['/', '/explore', '/explore?q=Boss&species=cat', '/login', '/register', '/forgot-password', '/memories'];
  const results = await Promise.all(routes.map(async route => {
    const response = await fetch(base + route, { signal: AbortSignal.timeout(30000) });
    const html = await response.text();
    assert.equal(response.status, 200, route);
    assert.ok(!html.includes('Chưa tải được nội dung.'), route + ' rendered error boundary');
    assert.ok(html.includes('PetBook'), route + ' missing app shell');
    return { route, html };
  }));
  async function expectRedirect(route, destination) {
    const response = await fetch(base + route, { redirect: 'manual' });
    if (response.status === 307) assert.equal(response.headers.get('location'), destination, route);
    else {
      assert.equal(response.status, 200, route);
      const html = await response.text();
      assert.ok(html.includes('NEXT_REDIRECT;replace;' + destination + ';307;'), route + ' missing streamed redirect');
    }
  }
  for (const route of ['/settings', '/my-pets', '/notifications', '/pet/new']) {
    await expectRedirect(route, '/login');
  }
  const home = results[0].html;
  const petPath = home.match(/href="(\/pet\/[^"?]+)"/)?.[1];
  const postPath = home.match(/href="(\/post\/[a-f0-9-]+)"/)?.[1];
  for (const route of [petPath, petPath && petPath + '?tab=media', postPath].filter(Boolean)) {
    const response = await fetch(base + route);
    const html = await response.text();
    assert.equal(response.status, 200, route);
    assert.ok(!html.includes('Chưa tải được nội dung.'), route);
  }
  const upload = await fetch(base + '/api/upload', { method: 'POST' });
  assert.equal(upload.status, 401);
  const media = await fetch(base + '/api/media/invalid');
  assert.equal(media.status, 404);
  for (const [route, destination] of [['/album','/my-pets'], ['/timeline','/memories'], ['/fun','/'], ['/admin','/settings']]) {
    await expectRedirect(route, destination);
  }
  console.log('PASS: public pages, search, pet profile/album, post detail, protected routes, upload authentication, media 404, legacy redirects.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
