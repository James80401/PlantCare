import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { buildLlmsTxt, buildRobotsTxt, buildSitemapXml, defaultRobotsDirective } from './src/seo/crawlerFiles';
import { indexableMarketingRoutes, marketingRoutes } from './src/seo/marketingRegistry';
import { buildPageHead, injectHeadIntoHtml } from './src/seo/headTags';
import { readPublicSiteConfig } from './src/seo/siteConfig';

const allowedHosts = process.env.VITE_DEV_ALLOWED_HOSTS
  ?.split(',')
  .map((host) => host.trim())
  .filter(Boolean);

function seoOutputPlugin() {
  const siteConfig = readPublicSiteConfig(process.env);
  let outDirAbs = '';

  return {
    name: 'dr-plant-seo-output',
    configResolved(resolved: ResolvedConfig) {
      outDirAbs = resolve(resolved.root, resolved.build.outDir);
    },
    transformIndexHtml(html: string) {
      return html.replace(
        /<meta name="robots" content="[^"]*"[^>]*>/,
        `<meta name="robots" content="${defaultRobotsDirective(siteConfig)}" data-managed="seo-default" />`,
      );
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: buildRobotsTxt(siteConfig),
      });
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: buildSitemapXml(siteConfig, indexableMarketingRoutes(siteConfig)),
      });
      // Only published once the marketing surface is indexable (launch); empty otherwise.
      const llmsTxt = buildLlmsTxt(siteConfig);
      if (llmsTxt) {
        this.emitFile({ type: 'asset', fileName: 'llms.txt', source: llmsTxt });
      }
    },
    closeBundle() {
      // Prerender per-route metadata into static HTML so non-JS crawlers and
      // social scrapers get the correct title/description/canonical/OG/JSON-LD in
      // the initial response instead of an empty SPA shell. Skipped entirely in
      // private mode so the private build stays byte-identical and the SEO
      // guardrail (empty sitemap + noindex root) still passes.
      if (siteConfig.mode === 'private' || !outDirAbs) return;
      let baseHtml: string;
      try {
        baseHtml = readFileSync(resolve(outDirAbs, 'index.html'), 'utf8');
      } catch {
        return;
      }
      for (const route of marketingRoutes) {
        const html = injectHeadIntoHtml(baseHtml, buildPageHead(route, route.path, siteConfig));
        if (route.path === '/') {
          writeFileSync(resolve(outDirAbs, 'index.html'), html);
        } else {
          const dir = resolve(outDirAbs, route.path.replace(/^\/+/, ''));
          mkdirSync(dir, { recursive: true });
          writeFileSync(resolve(dir, 'index.html'), html);
        }
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoOutputPlugin()],
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing vendor libs into their own cacheable chunks so an
        // app-code deploy doesn't bust the React/router/util caches in users' browsers.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.match(/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/)) {
            return 'vendor-react';
          }
          if (id.match(/[\\/]node_modules[\\/](axios|date-fns)[\\/]/)) {
            return 'vendor-utils';
          }
          return 'vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    allowedHosts,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/uploads': { target: 'http://localhost:3001', changeOrigin: true },
      '/care-guides/images': { target: 'http://localhost:3001', changeOrigin: true },
      '/care-guides/photos': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
});
