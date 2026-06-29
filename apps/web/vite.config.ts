import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { buildRobotsTxt, buildSitemapXml, defaultRobotsDirective } from './src/seo/crawlerFiles';
import { indexableMarketingRoutes } from './src/seo/marketingRegistry';
import { readPublicSiteConfig } from './src/seo/siteConfig';

const allowedHosts = process.env.VITE_DEV_ALLOWED_HOSTS
  ?.split(',')
  .map((host) => host.trim())
  .filter(Boolean);

function seoOutputPlugin() {
  const siteConfig = readPublicSiteConfig(process.env);

  return {
    name: 'dr-plant-seo-output',
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
