const fs = require("fs")
const path = require("path")
const { sql } = require("@vercel/postgres")

function loadPostgresUrlFromEnvLocal() {
  if (process.env.POSTGRES_URL) {
    return process.env.POSTGRES_URL
  }

  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) {
    return null
  }

  const envText = fs.readFileSync(envPath, "utf8")
  const line = envText
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.startsWith("POSTGRES_URL="))

  if (!line) {
    return null
  }

  return line.slice("POSTGRES_URL=".length)
}

function getMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), "migrations")

  if (!fs.existsSync(migrationsDir)) {
    return []
  }

  return fs
    .readdirSync(migrationsDir)
    .filter((filename) => filename.endsWith(".sql"))
    .sort()
    .map((filename) => ({
      filename,
      fullPath: path.join(migrationsDir, filename),
    }))
}

function splitSqlStatements(sqlText) {
  return sqlText
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
}

async function ensureMigrationTable() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) NOT NULL UNIQUE,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `)
}

async function hasMigrationRun(filename) {
  const result = await sql.query("SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1", [filename])
  return result.rows.length > 0
}

async function markMigrationRun(filename) {
  await sql.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [filename])
}

async function applyMigrationFile(file) {
  const sqlText = fs.readFileSync(file.fullPath, "utf8")
  const statements = splitSqlStatements(sqlText)

  for (const statement of statements) {
    await sql.query(statement)
  }

  await markMigrationRun(file.filename)
}

async function main() {
  const postgresUrl = loadPostgresUrlFromEnvLocal()
  if (!postgresUrl) {
    throw new Error("POSTGRES_URL was not found in environment or .env.local")
  }

  process.env.POSTGRES_URL = postgresUrl

  await ensureMigrationTable()

  const migrationFiles = getMigrationFiles()

  for (const file of migrationFiles) {
    if (await hasMigrationRun(file.filename)) {
      console.log(`Skipping ${file.filename} (already applied)`)
      continue
    }

    console.log(`Applying ${file.filename}...`)
    await applyMigrationFile(file)
    console.log(`Applied ${file.filename}`)
  }

  console.log("Database migrations completed successfully.")
}

main().catch((error) => {
  console.error("Failed to run database migrations:", error)
  process.exit(1)
})
