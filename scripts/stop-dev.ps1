# Detiene el servidor Next.js del proyecto (puerto 3000) sin tocar Node de Cursor.
Write-Host "Buscando proceso en puerto 3000..." -ForegroundColor Cyan

$lines = netstat -ano | Select-String ":3000\s+.*LISTENING"
if (-not $lines) {
    Write-Host "No hay nada escuchando en el puerto 3000." -ForegroundColor Green
    exit 0
}

$pids = $lines | ForEach-Object {
    if ($_ -match '\s+(\d+)\s*$') { [int]$Matches[1] }
} | Sort-Object -Unique

foreach ($procId in $pids) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    if ($proc) {
        Write-Host "Cerrando PID $procId ($($proc.ProcessName))..." -ForegroundColor Yellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
}

Start-Sleep -Seconds 1
$still = netstat -ano | Select-String ":3000\s+.*LISTENING"
if ($still) {
    Write-Host "Aun queda algo en 3000. Cierra la terminal donde corre npm run dev (Ctrl+C)." -ForegroundColor Red
} else {
    Write-Host "Puerto 3000 liberado. Ya puedes volver a ejecutar npm run dev." -ForegroundColor Green
}
