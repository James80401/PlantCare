# Build staging API + web images (does not start containers).
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$docker = & (Join-Path $PSScriptRoot 'docker-cli.ps1')

$envFile = Join-Path $Root '.env.staging'
$example = Join-Path $Root '.env.staging.example'
if (-not (Test-Path $envFile)) {
  Copy-Item $example $envFile
  Write-Host 'Created .env.staging from .env.staging.example'
}

Write-Host 'Building staging images (api + web)...'
& $docker compose -f docker-compose.staging.yml --env-file .env.staging build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Images built. Start stack: npm run staging:up'
Write-Host 'Full smoke test:    npm run staging:smoke'
