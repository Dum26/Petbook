const { Client } = require("pg");
const fs = require("fs");
const path = require("path");
const { databaseConfig } = require("../lib/database-config.cjs");
require("@next/env").loadEnvConfig(process.cwd());
async function migrate() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const client = new Client(databaseConfig());
  await client.connect();
  try {
    await client.query("CREATE TABLE IF NOT EXISTS public.petbook_migrations (name text PRIMARY KEY, applied_at timestamptz DEFAULT now())");
    const existing = await client.query("SELECT to_regclass('public.pets') AS name");
    const migrations = [];
    if (!existing.rows[0].name) migrations.push("20261027000001_petbook_schema.sql");
    migrations.push(...fs.readdirSync(path.join(__dirname, "../supabase/migrations")).filter(name => name >= "20261028000000" && name.endsWith(".sql")).sort());
    for (const name of migrations) {
      if ((await client.query("SELECT 1 FROM public.petbook_migrations WHERE name=$1", [name])).rowCount) continue;
      await client.query(fs.readFileSync(path.join(__dirname, "../supabase/migrations", name), "utf8"));
      await client.query("INSERT INTO public.petbook_migrations (name) VALUES ($1)", [name]);
      console.log("Applied", name);
    }
  } finally { await client.end(); }
}
migrate().catch(error => { console.error("Migration failed:", error.code || error.name); process.exitCode = 1; });
