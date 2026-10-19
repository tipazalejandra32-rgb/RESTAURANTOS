/**
 * Arranque del servidor con menos uso de RAM:
 * - Webpack en lugar de Turbopack (evita OOM en Node 24)
 * - Límite de memoria de Node aumentado
 */
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const isWin = process.platform === 'win32'
const nextCli = path.join(
  root,
  'node_modules',
  'next',
  'dist',
  'bin',
  isWin ? 'next' : 'next'
)

const child = spawn(
  process.execPath,
  ['--max-old-space-size=4096', nextCli, 'dev', '--webpack'],
  {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_OPTIONS: [
        process.env.NODE_OPTIONS,
        '--max-old-space-size=4096',
      ]
        .filter(Boolean)
        .join(' '),
    },
  }
)

child.on('exit', (code) => process.exit(code ?? 0))
