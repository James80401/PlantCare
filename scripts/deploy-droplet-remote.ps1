# Deploy latest Plant Care to the production droplet over SSH.
# Reads SMTP settings from local .env and merges them into server .env.production.
#
# Usage (from repo root on your PC):
#   .\scripts\deploy-droplet-remote.ps1
#
# Requires: SSH key at $env:USERPROFILE\.ssh\id_ed25519 authorized on the droplet.

param(
  [string]$SshHost = '165.227.176.65',
  [string]$SshUser = 'root',
  [string]$KeyPath = "$env:USERPROFILE\.ssh\id_ed25519",
  [string]$RemoteDir = '/root/PlantCare'
)

$ErrorActionPreference = 'Stop'
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

function Parse-EnvFile([string]$Path) {
  $vars = @{}
  if (-not (Test-Path $Path)) { return $vars }
  Get-Content $Path | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      $k = $Matches[1].Trim()
      $v = $Matches[2].Trim()
      if ($v.Length -ge 2) {
        $q = $v[0]
        if (($q -eq '"' -or $q -eq "'") -and $v[-1] -eq $q) {
          $v = $v.Substring(1, $v.Length - 2)
        }
      }
      $vars[$k] = $v
    }
  }
  return $vars
}

function To-B64([string]$Text) {
  [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($Text))
}

$localEnv = Parse-EnvFile (Join-Path $Root '.env')
$syncKeys = @(
  'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM',
  'REGISTRATION_REQUIRES_ADMIN_APPROVAL', 'ADMIN_EMAILS'
)

$payload = @{}
foreach ($key in $syncKeys) {
  if ($localEnv[$key]) { $payload[$key] = $localEnv[$key] }
}
if (-not $payload['ADMIN_EMAILS'] -and $localEnv['SMTP_USER']) {
  $payload['ADMIN_EMAILS'] = $localEnv['SMTP_USER']
}
if (-not $payload['REGISTRATION_REQUIRES_ADMIN_APPROVAL']) {
  $payload['REGISTRATION_REQUIRES_ADMIN_APPROVAL'] = 'true'
}

if (-not $payload['SMTP_USER'] -or -not $payload['SMTP_PASS']) {
  Write-Error 'Local .env is missing SMTP_USER or SMTP_PASS — add Gmail app password first.'
}

$payloadJson = ($payload.GetEnumerator() | Sort-Object Name | ForEach-Object {
  @{ $_.Key = $_.Value }
}) | ConvertTo-Json -Compress
$payloadB64 = To-B64 $payloadJson

$agentKeys = ssh-add -l 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Tip: Your SSH key has a passphrase. In PowerShell run:'
  Write-Host '  Get-Service ssh-agent | Set-Service -StartupType Manual; Start-Service ssh-agent'
  Write-Host "  ssh-add `"$KeyPath`""
  Write-Host 'Then run this script again.'
}

Write-Host "Connecting to ${SshUser}@${SshHost} ..."
Write-Host 'Steps: git pull, merge SMTP into .env.production, remove Caddy basic auth, rebuild containers.'

$remoteScript = @'
set -e
REMOTE_DIR="__REMOTE_DIR__"
PAYLOAD_B64="__PAYLOAD_B64__"
cd "$REMOTE_DIR"

echo "==> git pull"
git pull

echo "==> merge SMTP / admin approval into .env.production"
python3 - "$PAYLOAD_B64" << 'PY'
import base64, json, re, sys

path = ".env.production"
payload = json.loads(base64.b64decode(sys.argv[1]).decode("utf-8"))

with open(path, encoding="utf-8") as f:
    lines = f.read().splitlines()

def render(key, val):
    safe = val.replace("\\", "\\\\").replace('"', '\\"')
    return f'"{safe}"' if any(c in val for c in " <") else val

out_lines = []
keys_written = set()
for line in lines:
    m = re.match(r"^([^#=]+)=(.*)$", line)
    if m:
        key = m.group(1).strip()
        if key in payload:
            out_lines.append(f"{key}={render(key, payload[key])}")
            keys_written.add(key)
        else:
            out_lines.append(line)
    else:
        out_lines.append(line)

for key, val in payload.items():
    if key not in keys_written:
        out_lines.append(f"{key}={render(key, val)}")

with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(out_lines) + "\n")
PY

echo "==> remove Caddy basic auth"
bash scripts/caddy-remove-basic-auth.sh

echo "==> validate env"
node scripts/check-production-env.mjs .env.production

echo "==> rebuild and start"
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build

echo "==> container status"
docker compose -f docker-compose.production.yml ps

echo "==> done"
'@

$remoteScript = $remoteScript.Replace('__REMOTE_DIR__', $RemoteDir).Replace('__PAYLOAD_B64__', $payloadB64)

$sshArgs = @(
  '-i', $KeyPath,
  '-o', 'IdentitiesOnly=yes',
  '-o', 'BatchMode=yes',
  '-o', 'ConnectTimeout=20',
  '-o', 'StrictHostKeyChecking=accept-new',
  "${SshUser}@${SshHost}",
  'bash -s'
)

$remoteScript | & ssh @sshArgs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ''
Write-Host 'Deploy finished. From this machine run Phase G sign-off:'
Write-Host '  $env:API_URL = "https://api.drplant.app/api/v1"'
Write-Host '  $env:FRONTEND_URL = "https://drplant.app"'
Write-Host '  npm run production:signoff -- --live-only'
