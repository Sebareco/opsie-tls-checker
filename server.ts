import { execSync } from "child_process";
import { Socket } from "node:dgram";
import { resourceUsage } from "node:process";
import tls from "node:tls";


async function auditVersionTLS(host: string, version: string): Promise<boolean> {
  try {
    const flag = version === "SSLv3" ? "-ssl3" : 
                 version === "TLSv1" ? "-tls1" : 
                 version === "TLSv1.1" ? "-tls1_1" : 
                 version === "TLSv1.2" ? "-tls1_2" : "-tls1_3";

    const comando = `echo | openssl s_client -connect ${host}:443 ${flag} -servername ${host} 2>&1`;
    const output = execSync(comando, { encoding: 'utf-8', timeout: 5000 });
    const match = output.match(/Protocol\s*:\s*(.+)/);
    const protocoloReal = match ? match[1].trim() : "Desconocido";

    console.log(`[AUDIT] Pedido: ${version} | Real: ${protocoloReal}`);
    
    return protocoloReal === version || (version === "TLSv1.3" && protocoloReal === "TLSv1.3");
  } catch (e) {
    return false;
  }
}


const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/version-tls-all") {
      const { url: targetUrl } = await req.json();
      const hostLimpio = targetUrl.replace(/^(https?:\/\/)/, "").split('/')[0];
      
      const versions = ["SSLv3", "TLSv1", "TLSv1.1", "TLSv1.2", "TLSv1.3"];
      const results = [];

      for (const v of versions) {
        console.log(`--- Iniciando auditoría: ${v} ---`);
        const isSupported = await auditVersionTLS(hostLimpio, v);
        results.push({ version: v, supported: isSupported });
      }
      
      return Response.json(results);
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