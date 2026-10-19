export interface AccessLogEntry {
  id: string
  username: string
  name: string
  role: string
  at: string
  ip?: string
}

const MAX_LOGS = 200
const logs: AccessLogEntry[] = []

export function appendAccessLog(entry: Omit<AccessLogEntry, 'id'>): AccessLogEntry {
  const full: AccessLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
  }
  logs.unshift(full)
  if (logs.length > MAX_LOGS) logs.length = MAX_LOGS
  return full
}

export function getAccessLogs(): AccessLogEntry[] {
  return [...logs]
}
