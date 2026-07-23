# Start the existing Docker staging stack, prepare PostgreSQL explicitly, and run UAT.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$envFile = Join-Path $Root '.env.staging'
$example = Join-Path $Root '.env.staging.example'
if (-not (Test-Path -LiteralPath $envFile)) {
  Copy-Item -LiteralPath $example -Destination $envFile
  Write-Host 'Created .env.staging; review JWT secrets before sharing a link.'
}

node (Join-Path $Root 'scripts/check-staging-env.mjs') $envFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$docker = & (Join-Path $PSScriptRoot 'docker-cli.ps1')
$compose = @('compose', '-f', 'docker-compose.staging.yml', '--env-file', '.env.staging')

Write-Host 'Starting staging PostgreSQL...'
& $docker @compose up -d postgres
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$databaseReady = $false
for ($i = 0; $i -lt 60; $i++) {
  & $docker @compose exec -T postgres pg_isready -U plantcare -d plantcare *> $null
  if ($LASTEXITCODE -eq 0) {
    $databaseReady = $true
    break
  }
  Start-Sleep -Seconds 1
}
if (-not $databaseReady) { throw 'Staging PostgreSQL did not become ready.' }

$env:DATABASE_URL = 'postgresql://plantcare:plantcare@localhost:5433/plantcare?schema=public'
try {
  npx.cmd prisma generate --schema=prisma/postgresql/schema.prisma
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  node scripts/prepare-postgres-schema.mjs
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $env:NODE_ENV = 'development'
  $env:SEED_DEMO_DATA = 'true'
  npm.cmd run db:seed
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  Remove-Item Env:NODE_ENV, Env:SEED_DEMO_DATA -ErrorAction SilentlyContinue

  Write-Host 'Building and starting staging application containers...'
  & $docker @compose up -d --build api web
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  $healthUrl = 'http://localhost:3001/api/v1/health'
  $deadline = (Get-Date).AddMinutes(8)
  do {
    try {
      $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
      if ($response.StatusCode -eq 200) { break }
    } catch { }
    if ((Get-Date) -gt $deadline) { throw 'Staging API did not become healthy.' }
    Start-Sleep -Seconds 5
  } while ($true)

  $env:API_URL = 'http://localhost:3001/api/v1'
  $env:UAT_WEB_URL = 'http://localhost:8080'
  $env:STAGING_E2E = '1'
  $env:EXPECT_BUDDY_HIDDEN = '1'

  npm.cmd run verify
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm.cmd run smoke:buddy
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  npm.cmd run uat:e2e
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Write-Host 'Staging ready:'
  Write-Host '  Web: http://localhost:8080'
  Write-Host '  API: http://localhost:3001/api/v1'
} finally {
  Remove-Item Env:DATABASE_URL, Env:NODE_ENV, Env:SEED_DEMO_DATA -ErrorAction SilentlyContinue
  npx.cmd prisma generate
}
