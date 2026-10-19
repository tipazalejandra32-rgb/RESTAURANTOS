import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mysql from 'mysql2/promise'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envLocal = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envLocal)) {
  for (const line of fs.readFileSync(envLocal, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const eq = t.indexOf('=')
    if (eq === -1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = val
  }
}

const sqlPath = path.join(__dirname, '..', 'sql', 'schema.sql')
const sql = fs.readFileSync(sqlPath, 'utf8')

const host = process.env.MYSQL_HOST || '127.0.0.1'
const port = Number(process.env.MYSQL_PORT || 3306)
const user = process.env.MYSQL_USER || 'root'
const password = process.env.MYSQL_PASSWORD ?? ''
const dbName = process.env.MYSQL_DATABASE || 'restaurante-facturacion-si'

console.log('Conectando a MySQL:', `${user}@${host}:${port} (sin elegir base aún; el SQL incluye CREATE/USE)...`)

const useSsl =
  process.env.MYSQL_SSL === 'true' ||
  process.env.MYSQL_SSL === '1' ||
  host.includes('tidbcloud')

let connection
try {
  connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    multipleStatements: true,
    ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
  })
  await connection.query(sql)
  await connection.end()
  connection = undefined

  const verify = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database: dbName,
    ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
  })
  const [rows] = await verify.query(
    `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME`,
    [dbName]
  )
  await verify.end()

  console.log('OK — Tablas en', dbName + ':')
  for (const r of rows) {
    console.log('  -', r.TABLE_NAME)
  }
  if (!rows.length) {
    console.error('ADVERTENCIA: el script terminó pero no hay tablas. Revisa permisos del usuario MySQL.')
    process.exit(1)
  }
} catch (err) {
  console.error('ERROR al crear tablas:', err.message || err)
  if (connection) {
    try {
      await connection.end()
    } catch {
      /* ignore */
    }
  }
  process.exit(1)
}