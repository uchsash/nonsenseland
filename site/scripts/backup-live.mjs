// Backs up the LIVE site: the Neon database, every uploaded file in R2 and the live settings.
//   npm run backup:live                 saves to "G:\Nonsenseland Backups\live-<date>"
//   BACKUP_DIR=E:\Backups npm run backup:live
// Needs Docker running (for pg_dump) and wrangler signed in (for R2).
// Files are mirrored in "<backups>\live-files" and only new ones are downloaded.
import { execFileSync, spawn } from 'node:child_process'
import { cpSync, createWriteStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

const CONTAINER = 'site-postgres-1'
const site = process.cwd()
const project = path.dirname(site)
const root = process.env.BACKUP_DIR || path.join(path.dirname(project), 'Nonsenseland Backups')
const stamp = new Date().toLocaleString('sv').replace(' ', '_').replace(/:/g, '-').slice(0, 16)
const target = path.join(root, `live-${stamp}`)
const mirror = path.join(root, 'live-files')

const envFile = path.join(site, '.env.production.local')
const env = Object.fromEntries(
  readFileSync(envFile, 'utf8')
    .split(/\r?\n/)
    .map((l) => /^\s*([A-Z_0-9]+)\s*=\s*"?(.*?)"?\s*$/.exec(l))
    .filter(Boolean)
    .map((m) => [m[1], m[2]]),
)
const database = env.DATABASE_URL_DIRECT
if (!database) throw new Error('DATABASE_URL_DIRECT is missing from .env.production.local')

/** Runs psql/pg_dump inside the local Postgres container (same major version as Neon). */
const inContainer = (args) => ['exec', '-e', `NEON=${database}`, CONTAINER, 'sh', '-c', args]

async function dumpDatabase(file) {
  const child = spawn('docker', inContainer('pg_dump -Fc "$NEON"'))
  let errors = ''
  child.stderr.on('data', (d) => (errors += d))
  const exited = new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', resolve)
  })
  await pipeline(child.stdout, createWriteStream(file))
  if ((await exited) !== 0) throw new Error(`pg_dump failed: ${errors}. Is Docker running?`)
}

/** Every stored file name, from the live database: originals and their sizes. */
function storedFiles() {
  const sizes = ['thumb', 'card', 'cover', 'og', 'square'].map((s) => `select sizes_${s}_filename from media`).join(' union ')
  const sql = `select 'media', f from (select filename as f from media union ${sizes}) x where f is not null
    union select 'book-files', filename from book_files where filename is not null`
  const out = execFileSync('docker', inContainer(`psql "$NEON" -tA -F '|' -c "${sql.replace(/\s+/g, ' ')}"`), {
    encoding: 'utf8',
  })
  return out
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => line.split('|'))
}

const BUCKETS = { media: 'nonsenseland-media', 'book-files': 'nonsenseland-files' }

mkdirSync(target, { recursive: true })
await dumpDatabase(path.join(target, 'database.dump'))
const dumpSize = statSync(path.join(target, 'database.dump')).size
if (dumpSize < 1000) throw new Error('The database backup is suspiciously small.')

const files = storedFiles()
let downloaded = 0
let failed = 0
for (const [collection, name] of files) {
  const local = path.join(mirror, collection, name)
  if (existsSync(local)) continue
  mkdirSync(path.dirname(local), { recursive: true })
  try {
    execFileSync('npx', ['wrangler', 'r2', 'object', 'get', `${BUCKETS[collection]}/${name}`, '--remote', '--file', local], {
      stdio: 'ignore',
      shell: process.platform === 'win32',
    })
    downloaded++
  } catch {
    failed++
    console.warn(`  could not download ${collection}/${name}`)
  }
}
cpSync(mirror, path.join(target, 'files'), { recursive: true })
cpSync(envFile, path.join(target, 'live.env'))
const manifest = { createdAt: new Date().toISOString(), database: { bytes: dumpSize }, files: files.length, downloaded, failed }
writeFileSync(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.log(`Live backup saved: ${target}`)
console.log(`  database: ${(dumpSize / 1024 / 1024).toFixed(1)} MB`)
console.log(`  files: ${files.length} (${downloaded} new, ${failed} failed)`)
console.log('This backup contains live.env (passwords and keys). Keep it private.')
