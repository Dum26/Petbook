const fs = require("node:fs");
const path = require("node:path");

function databaseConfig() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const url = new URL(process.env.DATABASE_URL);
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"]) url.searchParams.delete(key);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  const ca = process.env.DATABASE_CA_CERT?.replace(/\\n/g, "\n") ||
    (url.hostname.endsWith(".supabase.com") || url.hostname.endsWith(".supabase.co")
      ? fs.readFileSync(path.join(process.cwd(), "certs/supabase-ca.crt"), "utf8") : undefined);
  return {
    connectionString: url.toString(),
    ssl: local && process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: true, ca },
    connectionTimeoutMillis: 10000,
  };
}
module.exports = { databaseConfig };
