import { auditVersionTLS } from './services/auditVersionTLS';


const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/api/version-tls-all') {
      try {
        const body = await req.json() as { url?: string };
        const urlAProbar = body.url;
        if (!urlAProbar) {
          return Response.json({ error: 'URL requerida' }, { status: 400 });
        }
        const hostLimpio = urlAProbar.replace(/^https?:\/\//, '').split('/')[0] || '';
        if (!hostLimpio) {
          return Response.json({ error: 'Host invalido' }, { status: 400 });
        }

        const resultados = await auditVersionTLS(hostLimpio);
        return Response.json(resultados);
      } catch (error: any) {
        const status = error.code === 'ETIMEDOUT' ? 504 : 500;
        const message = error.message ? `Error en el escaneo de red: ${error.message}` : 'Error en el escaneo de red';

        return Response.json({ error: message }, { status });
      }
    }

    const filePath = './frontend/dist' + (url.pathname === '/' ? '/index.html' : url.pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    return new Response(Bun.file('./frontend/dist/index.html'));
  },
});

console.log(`🚀 Servidor listo en http://localhost:3000`);