# Validate .env.production and print deploy + verify commands.
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$envFile = Join-Path $Root '.env.production'
$example = Join-Path $Root '.env.production.example'
if (-not (Test-Path $envFile)) {
  Copy-Item $example $envFile
  Write-Host 'Created .env.production from example — edit secrets and URLs before production:up.'
}

node (Join-Path $Root 'scripts/check-production-env.mjs') $envFile
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$lines = Get-Content $envFile | Where-Object { $_ -match '^\s*[^#]' }
$vars = @{}
foreach ($line in $lines) {
  if ($line -match '^\s*([^=]+)=(.*)$') {
    $vars[$Matches[1].Trim()] = $Matches[2].Trim()
  }
}

$apiBase = $vars['VITE_API_BASE_URL'] -replace '/$', ''
Write-Host ''
Write-Host ''
Write-Host 'On the server:'
Write-Host '  npm run production:up'
Write-Host '  docker compose -f docker-compose.production.yml logs -f api'
Write-Host ''
Write-Host 'From this machine (after DNS + TLS):'
Write-Host "  `$env:API_URL = '$apiBase'; npm run verify"
Write-Host "  `$env:API_URL = '$apiBase'; npm run smoke:buddy"
Write-Host "  `$env:UAT_WEB_URL = '$($vars['FRONTEND_URL'])'; `$env:API_URL = '$apiBase'; npm run uat:e2e"
Write-Host '  npm run production:signoff'
Write-Host '  npm run production:signoff -- --e2e'
Write-Host ''
Write-Host 'Android release build:'
Write-Host '  Copy apps/web/.env.production.example to apps/web/.env.local with your API URL'
Write-Host '  npm run mobile:release:android'
Write-Host ''
Write-Host 'Guide: docs/guides/15-production-deploy-and-android.md'
