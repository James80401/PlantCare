# Private Online Setup — Step-by-Step Checklist

> **Navigation:** [Operations INDEX](INDEX.md) · [deployment.md](deployment.md) · [production-signoff.md](production-signoff.md)

Work through **Phase A → Phase G** in order. Check each box, then tell your assistant (or teammate): **“Done with Phase X”** and paste any errors if something failed.

**Goal:** Plant Care is online with HTTPS, **not public** — outsiders cannot use it without your gate (password or allowlist).

---

## Before you start — fill this in

| Item | Your value |
|------|------------|
| Domain | e.g. `yourdomain.com` |
| Web URL | `https://____________` (apex, e.g. `drplant.app`) |
| API URL | `https://api.____________/api/v1` |
| VPS provider | e.g. DigitalOcean, Hetzner, Linode |
| VPS public IP | e.g. `203.0.113.10` |
| SSH user | e.g. `ubuntu` |
| Lock-down choice | **A** = shared password (Basic Auth) · **B** = Cloudflare Access (email allowlist) |

**Rough monthly cost (starter):** domain ~$10–15/yr · VPS ~$6–12/mo · Cloudflare free tier often enough.

---

## Phase A — Buy / create accounts (no server yet)

- [ ] **A1.** Register a **domain** (Namecheap, Cloudflare Registrar, Google Domains, etc.).
- [ ] **A2.** Create a **VPS** (Ubuntu 22.04 or 24.04, **2 GB+ RAM**, 1 vCPU minimum; 2 vCPU nicer for Docker builds).
- [ ] **A3.** Note the VPS **public IP** from the provider dashboard.
- [ ] **A4.** Ensure you can **SSH** into the VPS (password or SSH key from provider).
- [ ] **A5.** (Optional) Create a **Cloudflare** account if you might use DNS + Access later — free tier is fine.
- [ ] **A6.** (Optional, later) **SMTP** for real email (SendGrid, Gmail app password, etc.) — skip for first boot; app can auto-verify without SMTP in dev-style configs.
- [ ] **A7.** (Optional, later) **OpenAI API key** — only if you want Dr. Plant / diagnosis live.

**Done when:** You have domain + VPS IP + SSH working.

**Report:** `Phase A done — domain: ___ , VPS IP: ___`

---

## Phase B — DNS (point names at your server)

- [ ] **B1.** In DNS (registrar or Cloudflare), add records pointing at your VPS IP:

| Type | Name | Value |
|------|------|--------|
| A | `@` | your VPS IP |
| A | `api` | your VPS IP |

(Optional: A or CNAME `www` → same IP or `@`.)

- [ ] **B2.** Wait for DNS (often 5–30 minutes; up to 48h worst case).
- [ ] **B3.** From your PC, verify:

```powershell
nslookup yourdomain.com
nslookup api.yourdomain.com
```

Both should return your VPS IP.

**Done when:** apex (`@`) and `api` resolve to the VPS.

**Report:** `Phase B done — DNS resolves`

---

## Phase C — First login & server hardening

SSH in:

```powershell
ssh ubuntu@YOUR_VPS_IP
```

On the VPS:

- [ ] **C1.** Update packages:

```bash
sudo apt update && sudo apt upgrade -y
```

- [ ] **C2.** Install firewall basics:

```bash
sudo apt install -y ufw fail2ban
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

- [ ] **C3.** Install **Docker** and **Docker Compose** (follow Docker’s official Ubuntu install guide if not preinstalled).
- [ ] **C4.** Install **Git** and **Node 20+** (for `npm run production:*` scripts on server):

```bash
sudo apt install -y git
# Node: use NodeSource or nvm — need node + npm on server
```

- [ ] **C5.** (Recommended) Use SSH keys only; disable password SSH after keys work.

**Done when:** Docker works (`docker ps`), git works, ports 80/443 allowed.

**Report:** `Phase C done`

---

## Phase D — Deploy Plant Care (Docker)

On the VPS:

- [ ] **D1.** Clone repo:

```bash
git clone https://github.com/James80401/PlantCare.git
cd PlantCare
```

- [ ] **D2.** Create production env:

```bash
cp .env.production.example .env.production
nano .env.production   # or vim
```

Set at minimum (use your real URLs, **https**, no trailing slash on FRONTEND_URL):

```env
JWT_SECRET=<run: openssl rand -hex 32>
JWT_REFRESH_SECRET=<run again, different value>
FRONTEND_URL=https://yourdomain.com
CORS_ORIGINS=https://yourdomain.com
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_PUBLIC_SITE_MODE=private
VITE_MARKETING_INDEXABLE=false
VITE_CANONICAL_BASE_URL=https://yourdomain.com
```

- [ ] **D3.** Validate env (on server, in repo root):

```bash
npm install
npm run production:check
```

Must exit 0.

- [ ] **D4.** Start stack:

```bash
npm run production:up
```

- [ ] **D5.** Watch API until seed finishes (first time can take **several minutes**):

```bash
docker compose -f docker-compose.production.yml logs -f api
```

Look for healthy startup, no crash loop.

- [ ] **D6.** On VPS, quick local check:

```bash
curl -s http://127.0.0.1:3001/api/v1/health
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080
```

Expect health JSON + web `200`.

**Done when:** Containers running; health OK on localhost inside VPS.

**Report:** `Phase D done` (or paste last 20 lines of api logs if stuck)

---

## Phase E — HTTPS reverse proxy (Caddy)

- [ ] **E1.** Install Caddy on VPS:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl gnupg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update
sudo apt install -y caddy
```

- [ ] **E2.** Create `/etc/caddy/Caddyfile` **without auth first** (easier to debug):

```caddyfile
api.yourdomain.com {
  reverse_proxy 127.0.0.1:3001
}

yourdomain.com, www.yourdomain.com {
  reverse_proxy 127.0.0.1:8080
}
```

- [ ] **E3.** Reload Caddy:

```bash
sudo systemctl reload caddy
sudo systemctl status caddy
```

- [ ] **E4.** From your PC browser, open:

  - `https://api.yourdomain.com/api/v1/health` → should show `{"status":"ok",...}`
  - `https://yourdomain.com` → should load Plant Care

**Done when:** HTTPS works for web + API (no lock yet).

**Report:** `Phase E done` or describe certificate / connection errors

---

## Phase F — Lock it down (private, not public)

Use **SMTP + admin approval** (no shared browser password on the site).

### F0 — Remove Caddy basic auth (if you added it earlier)

On the VPS, restore a plain Caddyfile:

```bash
tee /etc/caddy/Caddyfile << 'EOF'
api.drplant.app {
	reverse_proxy 127.0.0.1:3001
}

drplant.app, www.drplant.app {
	reverse_proxy 127.0.0.1:8080
}
EOF
systemctl reload caddy
```

### F1 — SMTP in `.env.production`

**DigitalOcean droplets block outbound SMTP on ports 25, 587, and 465** ([docs](https://docs.digitalocean.com/support/why-is-smtp-blocked/)). Gmail SMTP will **timeout** from the server even with a correct App Password.

Use **Twilio SendGrid Email** (Twilio’s transactional email — SendGrid merged into Twilio) on port **2525**, or request an SMTP unblock from DO support.

**Twilio SendGrid Email (recommended on DO)** — works with existing Nodemailer SMTP, no code changes:

1. [Twilio SendGrid Email](https://www.twilio.com/en-us/sendgrid/email-api) → sign up / open [SendGrid dashboard](https://app.sendgrid.com).
2. Settings → **API Keys** → Create ( **Mail Send** permission).
3. Settings → **Sender Authentication** → **Verify a Single Sender** (e.g. your Gmail).
4. On the VPS:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=2525
SMTP_USER=apikey
SMTP_PASS=SG.your_twilio_sendgrid_api_key
EMAIL_FROM="Plant Care <you@gmail.com>"

REGISTRATION_REQUIRES_ADMIN_APPROVAL=true
ADMIN_EMAILS=you@gmail.com
```

- `SMTP_USER` is the literal word **`apikey`**, not your email.
- `SMTP_PASS` is the **`SG.…` API key**, not a Gmail app password.
- Confirm current pricing: [SendGrid pricing](https://sendgrid.com/pricing/) (tiers change over time).

Test from the droplet: `nc -vz smtp.sendgrid.net 2525` (should connect). Then `docker compose … up -d --force-recreate api` and check logs for `SMTP ready`.

Docs: [Twilio SendGrid SMTP](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp)

**Gmail (local dev or hosts that allow port 587)** — [App Password](https://myaccount.google.com/apppasswords):

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM="Plant Care <you@gmail.com>"
```

`ADMIN_EMAILS` must include **your** login email (comma-separated for multiple admins).

### F2 — Deploy updated app

```bash
cd ~/PlantCare
git pull
npm run production:check
npm run production:up
```

First boot runs `prisma db push` and adds `accountApprovalStatus` (existing users stay **APPROVED**).

### F3 — How access works

1. New user **registers** → must **verify email** (SMTP).
2. You get an email → open **https://drplant.app/admin/registrations** (sign in as an admin first).
3. **Approve / Enable** the user → they get an approval email → they can **sign in** and access site content.
4. Use **Disable** in the same admin portal to revoke site access later. Disabled users cannot use JWT-protected app content until an admin enables them again.

Users in `ADMIN_EMAILS` are auto-approved when they register.

### F4 — Test

- [ ] Incognito: register a throwaway email → verify → cannot sign in until approved.
- [ ] Admin: approve at `/admin/registrations` → user can sign in.
- [ ] Admin: disable the same user → user is blocked from site content; enable again → access returns.
- [ ] `https://drplant.app` loads **without** a browser password popup.

**Done when:** Unapproved users cannot use the app; site has no Caddy basic auth.

**Report:** `Phase F done`

---

## Phase G — Sign-off from your PC

On your **Windows dev machine** (in `PlantCare` repo):

- [ ] **G1.**

```powershell
cd c:\Source\Repos\PlantCare
$env:API_URL = "https://api.yourdomain.com/api/v1"
$env:FRONTEND_URL = "https://yourdomain.com"
npm run production:signoff -- --live-only
```

(If you have `.env.production` filled locally, you can run `npm run production:signoff -- --live` instead.)

- [ ] **G2.** Manual smoke: register → add plant → complete a task → open journal.

- [ ] **G3.** Save gate credentials in your password manager; document who has access.

**Done when:** Sign-off passes + you’ve used the app once on production.

**Report:** `Phase G done — we're live privately` 🎉

---

## After you're live — updating the app

Never copy files by hand. Each release:

1. Local: change code → test → `git push`
2. VPS:

```bash
cd ~/PlantCare   # or your path
git pull
npm run production:check
npm run production:up
```

3. From PC: `npm run production:signoff -- --live-only` (with your URLs)

---

## How to report progress to your assistant

Copy-paste this template:

```text
Phase: ___
Status: done | blocked
Domain: app.___ / api.___
VPS IP: ___
Lock-down: F1 password | F2 Cloudflare
Issue (if any):
<paste error text>
```

---

## Reference — detailed sections

The phases above are the checklist. For extra detail:

| Topic | Where |
|-------|--------|
| Env variables | [production-signoff.md](production-signoff.md) |
| Docker staging locally first | [deployment.md](deployment.md) |
| Android / Play later | [../product/google-play-closed-testing.md](../product/google-play-closed-testing.md) |
| Pre-launch SEO gates | [../marketing/prelaunch-seo-funnel.md](../marketing/prelaunch-seo-funnel.md) |
| Troubleshooting | Below |

### Troubleshooting

| Symptom | Fix |
|---------|-----|
| CORS errors in browser | `CORS_ORIGINS` must **exactly** match `FRONTEND_URL` (same scheme, host, no trailing slash) |
| TLS / certificate fails | DNS not propagated; firewall blocks 80/443 |
| Web loads, API fails | Wrong `VITE_API_BASE_URL`; rebuild: `npm run production:up` after env change |
| Basic auth breaks login | Put basicauth on the **web** host only, not api (see Phase F0) |
| verify fails species count | Wait for API seed to finish; check `docker compose ... logs api` |

### Related docs

- [deployment.md](deployment.md)
- [production-signoff.md](production-signoff.md)
- [../guides/15-production-deploy-and-android.md](../guides/15-production-deploy-and-android.md)
