import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy for ArXiv API to avoid CORS issues in development
      '/arxiv-proxy': {
        target: 'https://arxiv.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/arxiv-proxy/, ''),
        configure: (proxy) => {
          // Add custom headers that allow CORS
          proxy.on('proxyRes', (proxyRes) => {
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET,HEAD,PUT,PATCH,POST,DELETE';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ['react-pdf-highlighter-extended'],
    esbuildOptions: {
      // Fix "define" for pdfjs-dist
      define: {
        global: 'globalThis',
      },
    },
  },
  ssr: {
    // Force bundling for these problematic dependencies during SSR
    noExternal: ['react-pdf-highlighter-extended', 'pdfjs-dist'],
  },
  define: {
    // Add polyfill for the global object needed by react-graph-vis and pdfjs-dist
    global: 'globalThis',
  },
}));
