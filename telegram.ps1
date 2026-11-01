# Claude Code'ni Telegram kanali bilan ishga tushiradi.
# Sabab: Telegram plagini eski jarayonni o'chirish uchun `ps` buyrug'ini ishlatadi,
# Windows'da u yo'q. Shuning uchun eski bun jarayoni qolib, yangi sessiyada
# "409 Conflict" chiqadi. Bu skript eski jarayonni o'zi o'chiradi.

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# 1. PATH'ni yangilash (yangi o'rnatilgan ffmpeg, bun, node ko'rinsin)
$env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
            [Environment]::GetEnvironmentVariable('Path', 'User')

# 2. Eski Telegram jarayonlarini o'chirish
$stateDir = if ($env:TELEGRAM_STATE_DIR) { $env:TELEGRAM_STATE_DIR }
            elseif ($env:CLAUDE_CONFIG_DIR) { Join-Path $env:CLAUDE_CONFIG_DIR 'channels\telegram' }
            else { Join-Path $HOME '.claude\channels\telegram' }
$pidFile = Join-Path $stateDir 'bot.pid'

$pids = @()
if (Test-Path $pidFile) {
    $p = 0
    if ([int]::TryParse((Get-Content $pidFile -Raw).Trim(), [ref]$p) -and $p -gt 1) { $pids += $p }
}
# bot.pid eskirgan bo'lsa ham, telegram server.ts ishlatayotgan bun jarayonlarini topamiz
$pids += Get-CimInstance Win32_Process -Filter "Name='bun.exe'" |
    Where-Object { $_.CommandLine -match 'telegram' -and $_.CommandLine -match 'server\.ts' } |
    ForEach-Object { [int]$_.ProcessId }

foreach ($id in ($pids | Sort-Object -Unique)) {
    $proc = Get-Process -Id $id -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq 'bun') {
        Write-Host "Eski Telegram jarayoni o'chirilyapti: pid=$id"
        Stop-Process -Id $id -Force -ErrorAction SilentlyContinue
    }
}
if (Test-Path $pidFile) { Remove-Item $pidFile -Force -ErrorAction SilentlyContinue }

# 3. Claude'ni Telegram kanali bilan ishga tushirish
claude --channels plugin:telegram@claude-plugins-official @args
