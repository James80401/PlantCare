# Resolve Docker CLI on Windows (PATH or Docker Desktop install dir).
$ErrorActionPreference = 'Stop'

$candidates = @(
  (Get-Command docker -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source),
  'C:\Program Files\Docker\Docker\resources\bin\docker.exe'
)

foreach ($path in $candidates) {
  if ($path -and (Test-Path $path)) {
    return $path
  }
}

Write-Error @"
Docker was not found. Install Docker Desktop for Windows:
  https://docs.docker.com/desktop/install/windows-install/
Or: winget install Docker.DockerDesktop
Then restart your terminal and run: npm run docker:build
"@
