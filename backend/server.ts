import { execSync } from "child_process";
import { Socket } from "node:dgram";
import { resourceUsage } from "node:process";
import { escape } from "node:querystring";
import tls from "node:tls";
import { createBuilderStatusReporter, OuterExpressionKinds } from "typescript";


async function auditVersionTLS(host: string): Promise<{version: string, supported: boolean}[]> {
  try {
    console.log("auditando...")
    const comando = `nmap -p 443 --script ssl-enum-ciphers -n ${host}`;
    const output = execSync(comando, { encoding: 'utf-8', timeout: 60000 });

    const versionesCheck = ["SSLv3", "TLSv1.0", "TLSv1.1", "TLSv1.2", "TLSv1.3"];
    return versionesCheck.map(v => ({
      version: v,
      supported: output.includes(v) 
    }));
  } catch (error: any) {
    console.error(`Error Nmap en ${host}:`, error.message);
    
    throw error; 
  }
}


const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/version-tls-all") {
      try {
        const { url: urlAProbar } = await req.json();
        const hostLimpio = urlAProbar.replace(/^https?:\/\//, '').split('/')[0];
        
        const resultados = await auditVersionTLS(hostLimpio);
        return Response.json(resultados);
      } catch (error: any) {
        const status = error.code === 'ETIMEDOUT' ? 504 : 500;
        const message = error.message ? `Error en el escaneo de red: ${error.message}` : "Error en el escaneo de red";

        return Response.json({ error: message }, { status });
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