#!/usr/bin/env node

const API_BASE = 'https://api.cloudflare.com/client/v4';
const ZONE_NAME = process.env.CLOUDFLARE_ZONE_NAME ?? 'drplant.app';
const TOKEN = process.env.CLOUDFLARE_API_TOKEN ?? process.env.CF_API_TOKEN;
const EXPLICIT_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID ?? process.env.CF_ZONE_ID;

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const purge = args.has('--purge');
const skipDns = args.has('--skip-dns');
const skipRules = args.has('--skip-rules');

const webHosts = ['drplant.app', 'www.drplant.app'];
const apiHost = 'api.drplant.app';
const dnsTargets = [
  { name: 'drplant.app', proxied: true },
  { name: 'www.drplant.app', proxied: true },
  { name: apiHost, proxied: false },
];

const privateBypassExpression = [
  `(http.host in {"${webHosts.join('" "')}"})`,
  'and',
  '(',
  'http.request.uri.path eq "/"',
  'or starts_with(http.request.uri.path, "/garden")',
  'or starts_with(http.request.uri.path, "/admin")',
  'or starts_with(http.request.uri.path, "/login")',
  'or starts_with(http.request.uri.path, "/register")',
  'or starts_with(http.request.uri.path, "/verify-email")',
  'or starts_with(http.request.uri.path, "/resend-verification")',
  'or starts_with(http.request.uri.path, "/forgot-password")',
  'or starts_with(http.request.uri.path, "/reset-password")',
  'or http.request.uri.path eq "/robots.txt"',
  'or http.request.uri.path eq "/sitemap.xml"',
  'or http.request.uri.path eq "/llms.txt"',
  ')',
].join(' ');

const tierFRules = [
  {
    ref: 'drplant_tier_f_bypass_private_shell',
    description: 'Dr. Plant Tier F: bypass app shell, auth, app routes, and crawler files',
    expression: privateBypassExpression,
    action: 'set_cache_settings',
    action_parameters: { cache: false },
    enabled: true,
  },
  {
    ref: 'drplant_tier_f_cache_vite_assets',
    description: 'Dr. Plant Tier F: cache hashed Vite assets using origin headers',
    expression: `(http.host in {"${webHosts.join('" "')}"}) and starts_with(http.request.uri.path, "/assets/")`,
    action: 'set_cache_settings',
    action_parameters: { cache: true },
    enabled: true,
  },
  {
    ref: 'drplant_tier_f_cache_public_static',
    description: 'Dr. Plant Tier F: cache public static app assets using origin headers',
    expression: `(http.host in {"${webHosts.join('" "')}"}) and (starts_with(http.request.uri.path, "/icons/") or starts_with(http.request.uri.path, "/marketing/") or http.request.uri.path eq "/manifest.webmanifest")`,
    action: 'set_cache_settings',
    action_parameters: { cache: true },
    enabled: true,
  },
];

function usage() {
  console.log(`Usage:
  node scripts/apply-cloudflare-tier-f.mjs              # print the intended changes
  node scripts/apply-cloudflare-tier-f.mjs --apply      # apply DNS + cache rules
  node scripts/apply-cloudflare-tier-f.mjs --apply --purge

Environment:
  CLOUDFLARE_API_TOKEN or CF_API_TOKEN    required for --apply
  CLOUDFLARE_ZONE_ID or CF_ZONE_ID        optional; otherwise zone is found by name
  CLOUDFLARE_ZONE_NAME                    optional; defaults to drplant.app

Options:
  --skip-dns      do not update DNS proxied flags
  --skip-rules    do not update cache rules
  --purge         purge Cloudflare cache for the zone after applying
`);
}

function printPlan() {
  console.log('Dr. Plant Tier F Cloudflare plan');
  console.log(`Zone: ${ZONE_NAME}`);
  console.log('');
  console.log('DNS desired state:');
  for (const record of dnsTargets) {
    console.log(`- ${record.name}: ${record.proxied ? 'proxied' : 'DNS-only'}`);
  }
  console.log('');
  console.log('Cache rules desired state:');
  for (const rule of tierFRules) {
    console.log(`- ${rule.description}`);
    console.log(`  ${rule.expression}`);
  }
  console.log('');
  console.log('API host remains DNS-only in Tier F v1. No /uploads or API auth route caching is configured.');
}

async function cf(path, init = {}) {
  if (!TOKEN) throw new Error('CLOUDFLARE_API_TOKEN or CF_API_TOKEN is required for --apply.');
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const errors = payload?.errors?.map((err) => err.message).join('; ') || response.statusText;
    throw new Error(`Cloudflare API ${response.status} ${path}: ${errors}`);
  }
  return payload;
}

async function resolveZoneId() {
  if (EXPLICIT_ZONE_ID) return EXPLICIT_ZONE_ID;
  const zones = await cf(`/zones?name=${encodeURIComponent(ZONE_NAME)}&per_page=50`);
  const zone = zones.result?.find((candidate) => candidate.name === ZONE_NAME);
  if (!zone) throw new Error(`Could not find Cloudflare zone named ${ZONE_NAME}.`);
  return zone.id;
}

async function listDnsRecords(zoneId, name) {
  const payload = await cf(`/zones/${zoneId}/dns_records?name=${encodeURIComponent(name)}&per_page=50`);
  return payload.result ?? [];
}

async function applyDns(zoneId) {
  for (const target of dnsTargets) {
    const records = await listDnsRecords(zoneId, target.name);
    const proxyableRecords = records.filter((record) => ['A', 'AAAA', 'CNAME'].includes(record.type));
    if (!proxyableRecords.length) {
      console.warn(`! No proxyable A/AAAA/CNAME record found for ${target.name}; skipping.`);
      continue;
    }

    for (const record of proxyableRecords) {
      if (record.proxied === target.proxied) {
        console.log(`✓ DNS ${target.name} already ${target.proxied ? 'proxied' : 'DNS-only'} (${record.type})`);
        continue;
      }
      await cf(`/zones/${zoneId}/dns_records/${record.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ proxied: target.proxied }),
      });
      console.log(`✓ DNS ${target.name} set to ${target.proxied ? 'proxied' : 'DNS-only'} (${record.type})`);
    }
  }
}

async function getCacheRuleset(zoneId) {
  try {
    const payload = await cf(`/zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`);
    return payload.result;
  } catch (error) {
    if (!String(error.message).includes('404')) throw error;
    return null;
  }
}

async function applyCacheRules(zoneId) {
  const existing = await getCacheRuleset(zoneId);
  const existingRules = existing?.rules ?? [];
  const tierFRefs = new Set(tierFRules.map((rule) => rule.ref));
  const preservedRules = existingRules.filter((rule) => !tierFRefs.has(rule.ref));
  const body = {
    name: existing?.name ?? 'default',
    description: existing?.description ?? 'Zone-level cache settings',
    kind: 'zone',
    phase: 'http_request_cache_settings',
    rules: [...tierFRules, ...preservedRules],
  };

  const path = existing
    ? `/zones/${zoneId}/rulesets/phases/http_request_cache_settings/entrypoint`
    : `/zones/${zoneId}/rulesets`;
  await cf(path, {
    method: existing ? 'PUT' : 'POST',
    body: JSON.stringify(body),
  });
  console.log(`✓ Cache ruleset updated with ${tierFRules.length} Dr. Plant Tier F rules`);
  if (preservedRules.length) {
    console.log(`  Preserved ${preservedRules.length} existing non-Tier-F cache rule(s) after the Tier F rules.`);
  }
}

async function purgeCache(zoneId) {
  await cf(`/zones/${zoneId}/purge_cache`, {
    method: 'POST',
    body: JSON.stringify({ purge_everything: true }),
  });
  console.log('✓ Cloudflare cache purged');
}

async function main() {
  if (args.has('--help') || args.has('-h')) {
    usage();
    return;
  }

  printPlan();
  if (!apply) {
    console.log('');
    console.log('Dry run only. Re-run with --apply after setting CLOUDFLARE_API_TOKEN.');
    return;
  }

  const zoneId = await resolveZoneId();
  console.log('');
  console.log(`Applying to zone ${ZONE_NAME} (${zoneId})`);
  if (!skipDns) await applyDns(zoneId);
  if (!skipRules) await applyCacheRules(zoneId);
  if (purge) await purgeCache(zoneId);
  console.log('Done. Run production signoff and hosted Lighthouse checks next.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
