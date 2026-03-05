import tls from "node:tls";

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

    socket.setTimeout(5000, () => {
      reject("Timeout: El servidor no respondió a tiempo");
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

    // RUTA DE API: Procesamos la petición del formulario.
    if (url.pathname === "/api/check-tls" && req.method === "POST") {
      try {
        const body = await req.json(); // Leemos el JSON enviado por el frontend.
        const version = await getTLSVersion(body.url);
        return Response.json({ url: body.url, version });
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