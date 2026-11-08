// Backs up everything GitHub does not hold: the database, uploaded files and secrets.
//   npm run backup                 saves to "G:\Nonsenseland Backups\<date>"
//   BACKUP_DIR=E:\Backups npm run backup     saves somewhere else
import { spawn } from 'node:child_process'
import { cpSync, createWriteStream, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

const CONTAINER = 'site-postgres-1'
const DB_USER = 'nonsense'
const DB_NAME = 'nonsenseland'

const site = process.cwd()
const project = path.dirname(site)
const root = process.env.BACKUP_DIR || path.join(path.dirname(project), 'Nonsenseland Backups')
const stamp = new Date().toLocaleString('sv').replace(' ', '_').replace(/:/g, '-').slice(0, 16)
const target = path.join(root, stamp)

/** Inside the project folder, and what each one is called in the backup. */
const FOLDERS = [
  [path.join(site, 'media'), 'media'],
  [path.join(site, 'book-files'), 'book-files'],
  [path.join(project, 'free-books'), 'free-books'],
  [path.join(project, 'book-covers'), 'book-covers'],
  [path.join(project, 'Features image'), 'Features image'],
]

async function dumpDatabase(file) {
  const child = spawn('docker', ['exec', CONTAINER, 'pg_dump', '-U', DB_USER, '-Fc', DB_NAME])
  let errors = ''
  child.stderr.on('data', (d) => (errors += d))
  const exited = new Promise((resolve, reject) => {
    child.on('error', reject)
    child.on('close', resolve)
  })
  await pipeline(child.stdout, createWriteStream(file))
  const code = await exited
  if (code !== 0) throw new Error(`pg_dump failed: ${errors || code}. Is Docker running?`)
}

function measure(dir) {
  let files = 0
  let bytes = 0
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const inner = measure(full)
      files += inner.files
      bytes += inner.bytes
    } else {
      files += 1
      bytes += statSync(full).size
    }
  }
  return { files, bytes }
}

mkdirSync(target, { recursive: true })
await dumpDatabase(path.join(target, 'database.dump'))
const dumpSize = statSync(path.join(target, 'database.dump')).size
if (dumpSize < 1000) throw new Error('The database backup is suspiciously small.')

const manifest = { createdAt: new Date().toISOString(), database: { bytes: dumpSize }, folders: {} }
for (const [from, name] of FOLDERS) {
  if (!existsSync(from)) continue
  cpSync(from, path.join(target, name), { recursive: true })
  manifest.folders[name] = measure(path.join(target, name))
}
if (existsSync(path.join(site, '.env'))) cpSync(path.join(site, '.env'), path.join(target, 'site.env'))
writeFileSync(path.join(target, 'manifest.json'), JSON.stringify(manifest, null, 2))

console.log(`Backup saved: ${target}`)
console.log(`  database: ${(dumpSize / 1024 / 1024).toFixed(1)} MB`)
for (const [name, m] of Object.entries(manifest.folders)) {
  console.log(`  ${name}: ${m.files} files, ${(m.bytes / 1024 / 1024).toFixed(1)} MB`)
}
console.log('This backup contains site.env (passwords and keys). Keep it private.')
