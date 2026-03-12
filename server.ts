import tls from "node:tls";

type Site = { name: string; url: string };
type TLSResult = { name: string; url: string; version?: string; error?: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function validateSites(value: unknown): Site[] {
  if (!Array.isArray(value)) {
    throw new Error("sites.json debe ser un array");
  }

  const sites: Site[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      throw new Error("Cada item de sites.json debe ser un objeto");
    }
    const name = item.name;
    const url = item.url;
    if (typeof name !== "string" || name.trim().length === 0) {
      throw new Error("Cada site debe tener 'name' (string no vacío)");
    }
    if (typeof url !== "string" || url.trim().length === 0) {
      throw new Error("Cada site debe tener 'url' (string no vacío)");
    }
    sites.push({ name, url });
  }
  return sites;
}

async function readSites(): Promise<Site[]> {
  const file = Bun.file(`${import.meta.dir}/data/sites.json`);
  const parsed = (await file.json()) as unknown;
  return validateSites(parsed);
}

async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  const runOne = async () => {
    while (true) {
      const currentIndex = nextIndex++;
      if (currentIndex >= items.length) return;
      results[currentIndex] = await worker(items[currentIndex], currentIndex);
    }
  };

  const concurrency = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: concurrency }, () => runOne()));
  return results;
}

/**
 * Función: getTLSVersion
 * Por qué: El módulo 'tls' de Node/Bun permite abrir un socket seguro. 
 * Usamos una Promise porque la conexión es un evento asíncrono y queremos 
 * usar 'await' en nuestro servidor.
 */
async function getTLSVersion(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // 1. Limpieza: Extraemos solo el dominio (ej: google.com) de una URL completa.
    const cleanHost = hostname.replace(/^(https?:\/\/)/, "").split('/')[0];

    // 2. tls.connect: Inicia el "Handshake" (saludo) TLS en el puerto 443.
    const socket = tls.connect({
      host: cleanHost,
      port: 443,
      servername: cleanHost, // SNI: Necesario para que el servidor sepa qué certificado mostrar.
      timeout: 5000,
    }, () => {
      // 3. socket.getProtocol(): Una vez conectados, extraemos la versión negociada.
      const protocol = socket.getProtocol();
      resolve(protocol || "Unknown");
      socket.destroy(); // Cerramos la conexión para no dejar sockets abiertos.
    });

    // Manejo de errores (dominio no existe, timeout, etc.)
    socket.on("error", (err) => {
      reject(`Error de conexión: ${err.message}`);
      socket.destroy();
    });
  });
}

/**
 * Bun.serve: El motor nativo de Bun para manejar HTTP.
 * Es mucho más rápido que Express o Node puro.
 */
const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/sites" && req.method === "GET") {
      try {
        const sites = await readSites();
        return Response.json(sites);
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }

    // RUTA DE API: Procesamos la petición del formulario.
    if (url.pathname === "/api/check-tls" && req.method === "POST") {
      try {
        const body: any = await req.json(); // Leemos el JSON enviado por el frontend.
        const version = await getTLSVersion(body.url);
        return Response.json({ url: body.url, version });
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }

    if (url.pathname === "/api/check-tls-batch" && req.method === "POST") {
      try {
        const sites = await readSites();
        const results = await mapWithConcurrency(sites, 8, async (site) => {
          try {
            const version = await getTLSVersion(site.url);
            const result: TLSResult = { name: site.name, url: site.url, version };
            return result;
          } catch (error) {
            const result: TLSResult = { name: site.name, url: site.url, error: String(error) };
            return result;
          }
        });
        return Response.json(results);
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }

    // SERVIDOR ESTÁTICO: Si no es una ruta de API, buscamos el archivo en el build de React.
    const filePath = "./frontend/dist" + (url.pathname === "/" ? "/index.html" : url.pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    // Fallback para React Router: Sirve el index.html si la ruta no existe físicamente.
    return new Response(Bun.file("./frontend/dist/index.html"));
  },
});

console.log(`🚀 Servidor listo en http://localhost:3000`);