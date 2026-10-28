const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { Client } = require('pg');
const { databaseConfig } = require('../lib/database-config.cjs');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const { createRequire } = require('node:module');
require('@next/env').loadEnvConfig(process.cwd());

async function main() {
  const client = new Client(databaseConfig());
  await client.connect();
  try {
    await client.query('BEGIN');
    const users = [randomUUID(), randomUUID(), randomUUID()];
    const pets = [randomUUID(), randomUUID(), randomUUID()];
    const posts = [randomUUID(), randomUUID(), randomUUID()];
    for (let i = 0; i < 3; i++) {
      await client.query("INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES ($1, $2, '{}'::jsonb)", [users[i], `petbook-test-${users[i]}@example.invalid`]);
      await client.query('INSERT INTO public.profiles (id, username, display_name) VALUES ($1,$2,$2) ON CONFLICT (id) DO NOTHING', [users[i], `test_${users[i]}`]);
      await client.query("INSERT INTO public.pets (id, owner_id, name, slug) VALUES ($1,$2,'Test pet',$3)", [pets[i], users[i], `test_${pets[i]}`]);
    }
    for (let i = 0; i < 3; i++) await client.query('INSERT INTO public.posts (id, pet_id, author_id, content, visibility) VALUES ($1,$2,$3,$4,$5)', [posts[i], pets[0], users[0], 'test', ['public','followers','private'][i]]);
    await client.query('INSERT INTO public.follows (follower_pet_id, following_pet_id) VALUES ($1,$2)', [pets[1], pets[0]]);
    for (const post of posts) await client.query("INSERT INTO public.post_media (post_id, url) VALUES ($1,$2)", [post, `/api/media/${users[0]}/${post}.jpg`]);
    async function role(name, user = '') {
      await client.query('RESET ROLE');
      await client.query("SELECT set_config('request.jwt.claim.sub', $1, true), set_config('request.jwt.claims', $2, true)", [user, JSON.stringify(user ? { sub: user } : {})]);
      await client.query(`SET LOCAL ROLE ${name}`);
    }
    async function visible(expected) {
      const result = await client.query('SELECT id FROM public.posts WHERE id = ANY($1::uuid[]) ORDER BY id', [posts]);
      assert.deepEqual(result.rows.map(row => row.id).sort(), expected.sort());
      const media = await client.query('SELECT post_id FROM public.post_media WHERE post_id = ANY($1::uuid[])', [posts]);
      assert.deepEqual(media.rows.map(row => row.post_id).sort(), expected.sort());
    }
    await role('anon'); await visible([posts[0]]);
    await role('authenticated', users[2]); await visible([posts[0]]);
    await role('authenticated', users[1]); await visible([posts[0], posts[1]]);
    await role('authenticated', users[0]); await visible(posts);
    await role('authenticated', users[2]);
    const access = await client.query('SELECT public.can_view_petbook_media($1) AS allowed', [`${users[0]}/${posts[2]}.jpg`]);
    assert.equal(access.rows[0].allowed, false);
    await client.query('SAVEPOINT forbidden_write');
    await assert.rejects(client.query('UPDATE public.pets SET owner_id=$1 WHERE id=$2', [users[2], pets[0]]), error => error.code === '42501');
    await client.query('ROLLBACK TO SAVEPOINT forbidden_write');
    await client.query('RESET ROLE');
    const bucket = await client.query("SELECT public FROM storage.buckets WHERE id='petbook-private'");
    assert.equal(bucket.rows[0]?.public, false);
    function load(file, mocks = {}) {
      const filename = path.resolve(file), module = { exports: {} };
      const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const nativeRequire = createRequire(filename);
      new Function('require', 'module', 'exports', compiled)(id => mocks[id] || nativeRequire(id), module, module.exports);
      return module.exports;
    }
    let viewerIndex = 0;
    const service = load('lib/petbook-service.ts', {
      react: { cache: fn => fn },
      'next/headers': { cookies: async () => ({ get: () => ({ value: pets[viewerIndex] }) }) },
      '@/lib/social-validation': load('lib/social-validation.ts'),
      '@/lib/supabase/server': { createClient: async () => ({ auth: { getUser: async () => ({ data: { user: { id: users[viewerIndex] } } }) } }) },
      '@/lib/db': {
        dbQuery: async (sql, params) => (await client.query(sql, params)).rows,
        dbQuerySingle: async (sql, params) => (await client.query(sql, params)).rows[0] || null,
        dbTransaction: fn => fn(client),
      },
    });
    const birthday = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    await client.query('UPDATE public.pets SET birthday = $1 WHERE id = $2', [birthday, pets[0]]);
    assert.ok((await service.getBirthdayPets()).some(pet => pet.id === pets[0]));
    const created = await service.createPost({ petId: pets[0], authorId: users[0], content: 'A service integration post', visibility: 'private' });
    assert.equal(created.pet.id, pets[0]);
    assert.equal(created.author.id, users[0]);
    assert.equal(created.visibility, 'private');
    const reacted = await service.toggleReaction(created.id, pets[0], users[0], 'heart');
    assert.equal(reacted.reaction_count, 1);
    const unreacted = await service.toggleReaction(created.id, pets[0], users[0], 'heart');
    assert.equal(unreacted.reaction_count, 0);
    const comment = await service.addComment({ postId: created.id, petId: pets[0], userId: users[0], content: 'Test comment' });
    assert.equal(comment.pet.id, pets[0]);
    assert.equal((await service.getComments(created.id))[0].id, comment.id);
    viewerIndex = 2;
    assert.equal(await service.getPostById(created.id), null);
    assert.equal(await service.canReadMedia(`/api/media/${users[0]}/${posts[2]}.jpg`, users[2]), false);
    await assert.rejects(service.createPost({ petId: pets[0], authorId: users[2], content: 'forged' }));
    console.log('PASS: anonymous/stranger/follower/owner visibility; media privacy; forged writes; private bucket. All test data rolled back.');
    console.log('PASS: actual service queries, birthdays, post creation, reaction counters, comments, private post lookup, media authorization.');
  } finally {
    await client.query('ROLLBACK');
    await client.end();
  }
}
main().catch(error => { console.error('Database test failed:', error.code || error.name, error.message?.replace(/postgres(?:ql)?:\/\/\S+/g, '[redacted]')); process.exitCode = 1; });
