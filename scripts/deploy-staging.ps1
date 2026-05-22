# Start Docker staging stack and run smoke tests against http://localhost:8080
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$envFile = Join-Path $Root '.env.staging'
$example = Join-Path $Root '.env.staging.example'
if (-not (Test-Path $envFile)) {
  Copy-Item $example $envFile
  Write-Host 'Created .env.staging from example - review JWT secrets before sharing a link.'
}

node (Join-Path $Root 'scripts/check-staging-env.mjs') $envFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$docker = & (Join-Path $PSScriptRoot 'docker-cli.ps1')

Write-Host 'Building and starting staging containers (first run: seed + photos may take several minutes)...'
& $docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build

$healthUrl = 'http://localhost:3001/api/v1/health'
$deadline = (Get-Date).AddMinutes(15)
Write-Host "Waiting for API at ${healthUrl}..."
do {
  try {
    $r = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 5
    if ($r.StatusCode -eq 200) { break }
  } catch { }
  if ((Get-Date) -gt $deadline) {
    Write-Error 'API did not become healthy in time. Check: docker compose -f docker-compose.staging.yml logs api'
  }
  Start-Sleep -Seconds 5
} while ($true)
Write-Host 'API is up.'

Write-Host 'Generating Prisma client for staging Postgres (host smoke tests)...'
$env:API_URL = 'http://localhost:3001/api/v1'
$env:UAT_WEB_URL = 'http://localhost:8080'
$env:STAGING_E2E = '1'

Write-Host 'Running verify against staging API...'
npm run verify
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Running Plant Buddy API smoke...'
npm run smoke:buddy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host 'Running Playwright UAT against staging web...'
npm run uat:e2e
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Staging is ready:'
Write-Host '  Web:  http://localhost:8080'
Write-Host '  API:  http://localhost:3001/api/v1'
Write-Host '  Docs: http://localhost:3001/api/docs'
Write-Host ''
Write-Host 'Stop: docker compose -f docker-compose.staging.yml down'

Write-Host 'Staging smoke complete.'
