const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createRequire } = require('node:module');

function load(file, mocks = {}) {
  const filename = path.resolve(file);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const module = { exports: {} };
  const nativeRequire = createRequire(filename);
  new Function('require', 'module', 'exports', compiled)(id => mocks[id] || nativeRequire(id), module, module.exports);
  return module.exports;
}
const validation = load('lib/social-validation.ts');
const { detectMedia } = load('lib/media.ts');
const { databaseConfig } = require('../lib/database-config.cjs');
const userId = '11111111-1111-4111-8111-111111111111';
const ownPet = '22222222-2222-4222-8222-222222222222';
const otherPet = '33333333-3333-4333-8333-333333333333';
const postId = '44444444-4444-4444-8444-444444444444';
let viewer = { id: userId };
let statements = [];
let answer = () => [];
const service = load('lib/petbook-service.ts', {
  react: { cache: fn => fn },
  'next/headers': { cookies: async () => ({ get: () => ({ value: ownPet }) }) },
  '@/lib/social-validation': validation,
  '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: viewer } }) } }) },
  '@/lib/db': {
    dbQuery: async (sql, params) => {
      statements.push({ sql, params });
      if (sql.includes('WHERE owner_id = $1')) return [{ id: ownPet, owner_id: userId }];
      return answer(sql, params);
    },
    dbQuerySingle: async (sql, params) => {
      statements.push({ sql, params });
      if (sql.includes('public.profiles WHERE id')) return { id: userId };
      if (sql.includes('AND owner_id = $2')) return params[0] === ownPet ? { id: ownPet, owner_id: userId } : null;
      return answer(sql, params)[0] || null;
    },
    dbTransaction: async fn => fn({ query: async (sql, params) => {
      statements.push({ sql, params });
      return { rows: sql.includes('INSERT INTO public.posts') ? [{ id: postId }] : answer(sql, params) };
    } }),
  },
});

test('post validation rejects blank posts, unknown visibility, oversize media and arbitrary URLs', () => {
  assert.equal(validation.postInput.safeParse({ petId: ownPet, content: '  ' }).success, false);
  assert.equal(validation.postInput.safeParse({ petId: ownPet, content: 'hello', visibility: 'everyone' }).success, false);
  assert.equal(validation.postInput.safeParse({ petId: ownPet, content: 'hello', media: [{ url: 'https://example.com/x.svg' }] }).success, false);
  assert.equal(validation.postInput.safeParse({ petId: ownPet, content: 'x'.repeat(10001) }).success, false);
  assert.equal(validation.postInput.safeParse({ petId: ownPet, content: 'ok' }).success, true);
});

test('media checks reject SVG, HTML, fake MIME and HEIC; accept supported signatures', () => {
  assert.equal(detectMedia(Buffer.from('<svg onload="alert(1)"></svg>')), null);
  assert.equal(detectMedia(Buffer.from('<html>fake.jpg</html>')), null);
  assert.equal(detectMedia(Buffer.from('0000ftypheic')), null);
  assert.equal(detectMedia(Buffer.from('ffd8ffe0', 'hex')).mime, 'image/jpeg');
  assert.equal(detectMedia(Buffer.from('89504e470d0a1a0a', 'hex')).mime, 'image/png');
  assert.equal(detectMedia(Buffer.from('0000ftypisom')).type, 'video');
});

test('server checks media ownership even for syntactically valid paths', () => {
  const own = `/api/media/${userId}/${postId}.jpg`;
  assert.doesNotThrow(() => service.assertOwnedMedia(own, userId));
  assert.throws(() => service.assertOwnedMedia(own, otherPet));
  assert.throws(() => service.assertOwnedMedia('/api/media/../../secret', userId));
});

test('birthday calculation handles today, year boundary and leap day', () => {
  assert.equal(validation.birthdayDaysAway('2020-10-28', '2026-10-28'), 0);
  assert.equal(validation.birthdayDaysAway('2020-01-01', '2026-12-30'), 2);
  assert.equal(validation.birthdayDaysAway('2024-02-29', '2028-02-28'), 1);
});

test('feed parameterizes identity and refuses another account pet as active viewer', async () => {
  statements = []; viewer = { id: userId }; answer = () => [];
  await service.getFeedPosts({ viewerPetId: otherPet, query: "%' OR true --", mode: 'following' });
  const query = statements.find(item => item.sql.includes('row_to_json(pt)'));
  assert.equal(query.params[2], userId);
  assert.equal(query.params[3], ownPet);
  assert.ok(query.sql.includes('p.author_id = $3::uuid'));
  assert.ok(query.sql.includes("p.visibility = 'followers'"));
  assert.ok(!query.sql.includes("OR true --"));
  assert.ok(query.sql.includes('vf.following_pet_id = p.pet_id'));
  assert.ok(query.sql.includes('f.follower_pet_id = $4'));
});

test('anonymous feed contains no authenticated or pet identity', async () => {
  statements = []; viewer = null;
  await service.getFeedPosts();
  const query = statements.find(item => item.sql.includes('row_to_json(pt)'));
  assert.equal(query.params[2], null); assert.equal(query.params[3], null);
});

test('forged pet mutations fail before writing any rows', async () => {
  statements = []; viewer = { id: userId };
  await assert.rejects(service.createPost({ petId: otherPet, authorId: userId, content: 'impersonation' }));
  await assert.rejects(service.toggleReaction(postId, otherPet, userId, 'heart'));
  await assert.rejects(service.addComment({ postId, petId: otherPet, userId, content: 'impersonation' }));
  await assert.rejects(service.toggleFollow(otherPet, ownPet, userId));
  assert.ok(!statements.some(item => /INSERT|UPDATE|DELETE/.test(item.sql)));
});

test('post creation fetches its own ID rather than the latest global post', async () => {
  statements = []; viewer = { id: userId };
  answer = sql => sql.includes('row_to_json(pt)') ? [{ id: postId, pet_id: ownPet, media: [] }] : [];
  assert.equal((await service.createPost({ petId: ownPet, authorId: userId, content: 'my post' })).id, postId);
  const query = statements.find(item => item.sql.includes('row_to_json(pt)'));
  assert.ok(query.params.includes(postId));
  assert.match(query.sql, /p.id = \$5/);
});

test('invalid UUID and pagination are rejected before SQL', async () => {
  await assert.rejects(service.getFeedPosts({ viewerPetId: "x' OR true--" }));
  await assert.rejects(service.getFeedPosts({ limit: 100000 }));
  await assert.rejects(service.getFeedPosts({ offset: -1 }));
});

test('database config verifies CA and hostname even if URL requests insecure TLS', () => {
  const original = process.env.DATABASE_URL;
  process.env.DATABASE_URL = 'postgresql://user:password@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres?sslmode=no-verify';
  try {
    const config = databaseConfig();
    assert.equal(config.ssl.rejectUnauthorized, true);
    assert.ok(config.ssl.ca.includes('BEGIN CERTIFICATE'));
    assert.ok(!config.connectionString.includes('sslmode'));
  } finally { if (original) process.env.DATABASE_URL = original; else delete process.env.DATABASE_URL; }
});
