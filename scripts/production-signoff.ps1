# G3 production sign-off (env check + live probes + verify/smoke).
$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root
node (Join-Path $Root 'scripts/production-signoff.mjs') @args
exit $LASTEXITCODE
