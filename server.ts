import tls from "node:tls";


async function getTLSVersion(hostname: string): Promise<string> {
  return new Promise((resolve, reject) => {
   
    const cleanHost = hostname.replace(/^(https?:\/\/)/, "").split('/')[0];

    
    const socket = tls.connect({
      host: cleanHost,
      port: 443,
      servername: cleanHost,
      timeout: 5000,
    }, () => {
      
      const protocol = socket.getProtocol();
      resolve(protocol || "Unknown");
      socket.destroy(); 
    });

    
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


const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === "/api/sites" && req.method === "GET") {
      try {
        const sitesFile = Bun.file("./data/sites.json");
        const sites = JSON.parse(await sitesFile.text());
        return Response.json(sites);
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }

    if (url.pathname === "/api/check-tls" && req.method === "POST") {
      try {
        const body = (await req.json()) as { url: string };
        const version = await getTLSVersion(body.url);
        return Response.json({ url: body.url, version });
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }

    if (url.pathname === "/api/check-tls-batch" && req.method === "POST") {
      try {
        const sitesFile = Bun.file("./data/sites.json");
        const sites: { name: string; url: string }[] = JSON.parse(
          await sitesFile.text()
        );

        const results = await Promise.all(
          sites.map(async (site) => {
            try {
              const version = await getTLSVersion(site.url);
              return { ...site, version };
            } catch (error) {
              return { ...site, error: String(error) };
            }
          })
        );

        return Response.json(results);
      } catch (error) {
        return Response.json({ error: String(error) }, { status: 500 });
      }
    }

    
    const filePath = "./frontend/dist" + (url.pathname === "/" ? "/index.html" : url.pathname);
    const file = Bun.file(filePath);

    if (await file.exists()) {
      return new Response(file);
    }

    
    return new Response(Bun.file("./frontend/dist/index.html"));
  },
});

console.log(`🚀 Servidor listo en http://localhost:3000`);