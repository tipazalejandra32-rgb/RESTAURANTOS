# Muestra que hace cada proceso node.exe (para no cerrar Cursor por error).
Write-Host "`nProcesos node.exe activos:`n" -ForegroundColor Cyan
Get-CimInstance Win32_Process -Filter "name = 'node.exe'" |
    ForEach-Object {
        $cmd = $_.CommandLine
        $tipo = if ($cmd -match 'next|restaurant-os') { '[PROYECTO]' }
                elseif ($cmd -match 'cursor|Cursor') { '[CURSOR - no cerrar]' }
                else { '[OTRO]' }
        [PSCustomObject]@{
            PID   = $_.ProcessId
            Tipo  = $tipo
            Linea = if ($cmd.Length -gt 120) { $cmd.Substring(0, 120) + '...' } else { $cmd }
        }
    } | Format-Table -AutoSize

Write-Host "Solo debes cerrar los marcados [PROYECTO] o usar scripts\stop-dev.ps1`n"
