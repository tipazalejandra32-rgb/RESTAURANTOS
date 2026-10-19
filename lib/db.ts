import mysql from 'mysql2/promise'

const database = process.env.MYSQL_DATABASE ?? 'restaurante-facturacion-si'

let pool: mysql.Pool | null = null

export function getPool(): mysql.Pool {
  if (!pool) {
    const useSsl =
      process.env.MYSQL_SSL === 'true' ||
      process.env.MYSQL_SSL === '1' ||
      (process.env.MYSQL_HOST ?? '').includes('tidbcloud')

    pool = mysql.createPool({
      host: process.env.MYSQL_HOST ?? '127.0.0.1',
      port: Number(process.env.MYSQL_PORT ?? 3306),
      user: process.env.MYSQL_USER ?? 'root',
      password: process.env.MYSQL_PASSWORD ?? '',
      database,
      waitForConnections: true,
      connectionLimit: 10,
      namedPlaceholders: true,
      ...(useSsl ? { ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true } } : {}),
    })
  }
  return pool
}
