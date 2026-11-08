// Restores a backup made by scripts/backup.mjs. This replaces the current data.
//   npm run restore -- "G:\Nonsenseland Backups\2026-11-09_10-30" --yes
// To only test a backup, restore it into a separate database and leave the site alone:
//   npm run restore -- "<backup folder>" --test
import { spawn, spawnSync } from 'node:child_process'
import { cpSync, createReadStream, existsSync, readFileSync, rmSync } from 'node:fs'
import path from 'node:path'

const CONTAINER = 'site-postgres-1'
const DB_USER = 'nonsense'
const DB_NAME = 'nonsenseland'
const TEST_DB = 'nonsenseland_restore_test'

const args = process.argv.slice(2)
const folder = args.find((a) => !a.startsWith('--'))
const test = args.includes('--test')
if (!folder || !existsSync(path.join(folder, 'database.dump'))) {
  console.error('Give the path of a backup folder (it must contain database.dump).')
  process.exit(1)
}
if (!test && !args.includes('--yes')) {
  console.error('This replaces the current database and uploaded files. Add --yes to go ahead, or --test to only check the backup.')
  process.exit(1)
}

const psql = (db, sql) => {
  const r = spawnSync('docker', ['exec', CONTAINER, 'psql', '-U', DB_USER, '-d', db, '-At', '-c', sql], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error(r.stderr)
  return r.stdout.trim()
}

function loadDump(db) {
  return new Promise((resolve, reject) => {
    const child = spawn('docker', ['exec', '-i', CONTAINER, 'pg_restore', '-U', DB_USER, '-d', db, '--no-owner', '--clean', '--if-exists'])
    let errors = ''
    child.stderr.on('data', (d) => (errors += d))
    child.on('error', reject)
    child.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`pg_restore failed: ${errors}`))))
    createReadStream(path.join(folder, 'database.dump')).pipe(child.stdin)
  })
}

const TABLES = ['users', 'articles', 'videos', 'books', 'chapters', 'alap', 'media']
const counts = (db) => Object.fromEntries(TABLES.map((t) => [t, Number(psql(db, `select count(*) from ${t}`))]))

if (test) {
  psql('postgres', `drop database if exists ${TEST_DB}`)
  psql('postgres', `create database ${TEST_DB}`)
  try {
    await loadDump(TEST_DB)
    const restored = counts(TEST_DB)
    const current = counts(DB_NAME)
    const manifest = JSON.parse(readFileSync(path.join(folder, 'manifest.json'), 'utf8'))
    const missing = Object.keys(manifest.folders).filter((n) => !existsSync(path.join(folder, n)))
    console.log('Backup   ', JSON.stringify(restored))
    console.log('Live site', JSON.stringify(current))
    console.log(missing.length ? `Missing folders: ${missing}` : 'All file folders are present.')
    console.log(JSON.stringify(restored) === JSON.stringify(current) ? 'OK: the backup matches the live data.' : 'Note: counts differ (expected if the site changed since the backup).')
  } finally {
    psql('postgres', `drop database if exists ${TEST_DB}`)
  }
} else {
  const site = process.cwd()
  const project = path.dirname(site)
  await loadDump(DB_NAME)
  const places = {
    media: path.join(site, 'media'),
    'book-files': path.join(site, 'book-files'),
    'free-books': path.join(project, 'free-books'),
    'book-covers': path.join(project, 'book-covers'),
    'Features image': path.join(project, 'Features image'),
  }
  for (const [name, to] of Object.entries(places)) {
    if (!existsSync(path.join(folder, name))) continue
    rmSync(to, { recursive: true, force: true })
    cpSync(path.join(folder, name), to, { recursive: true })
  }
  if (!existsSync(path.join(site, '.env')) && existsSync(path.join(folder, 'site.env'))) {
    cpSync(path.join(folder, 'site.env'), path.join(site, '.env'))
  }
  console.log('Restored. Restart the dev server.', JSON.stringify(counts(DB_NAME)))
}
