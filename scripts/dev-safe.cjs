const fs = require("fs")
const path = require("path")
const { spawn } = require("child_process")

const projectRoot = process.cwd()
const lockFilePath = path.join(projectRoot, ".dev-server.lock")
const nextCachePath = path.join(projectRoot, ".next")

function cleanupLockFile() {
  try {
    fs.rmSync(lockFilePath, { force: true })
  } catch {
    // Ignore cleanup failures.
  }
}

function isProcessAlive(pid) {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

function ensureSingleDevServer() {
  if (!fs.existsSync(lockFilePath)) {
    return
  }

  const raw = fs.readFileSync(lockFilePath, "utf8").trim()
  const existingPid = Number.parseInt(raw, 10)

  if (Number.isInteger(existingPid) && isProcessAlive(existingPid)) {
    console.error(
      `Another dev server is already running for this project (PID ${existingPid}). Stop it before starting a new one.`,
    )
    process.exit(1)
  }

  cleanupLockFile()
}

function cleanNextArtifacts() {
  try {
    fs.rmSync(nextCachePath, { recursive: true, force: true })
  } catch (error) {
    console.error("Failed to clean .next directory:", error)
    process.exit(1)
  }
}

ensureSingleDevServer()
cleanNextArtifacts()
fs.writeFileSync(lockFilePath, String(process.pid), "utf8")

process.on("exit", cleanupLockFile)
process.on("SIGINT", () => {
  cleanupLockFile()
  process.exit(130)
})
process.on("SIGTERM", () => {
  cleanupLockFile()
  process.exit(143)
})

const nextBinPath = require.resolve("next/dist/bin/next")
const forwardedArgs = process.argv.slice(2)

const child = spawn(process.execPath, [nextBinPath, "dev", ...forwardedArgs], {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    // Prevent flaky Windows webpack pack-file rename cache issues.
    NEXT_DISABLE_WEBPACK_CACHE: process.env.NEXT_DISABLE_WEBPACK_CACHE ?? "1",
  },
})

child.on("exit", (code) => {
  cleanupLockFile()
  process.exit(code ?? 0)
})

child.on("error", (error) => {
  cleanupLockFile()
  console.error("Failed to start Next.js dev server:", error)
  process.exit(1)
})
