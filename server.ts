import { execSync } from "child_process";
import { Socket } from "node:dgram";
import { resourceUsage } from "node:process";
import { escape } from "node:querystring";
import tls from "node:tls";
import { OuterExpressionKinds } from "typescript";


async function auditVersionTLS(host: string): Promise<{version: string, supported: boolean}[]> {
  try {
    console.log(`Buscando protocolos en ${host}...`);
    const comando = `nmap -p 443 --script ssl-enum-ciphers ${host}`;
    const output = execSync(comando, { encoding: 'utf-8', timeout: 40000 });

    const versionesCheck = ["SSLv3", "TLSv1.0", "TLSv1.1", "TLSv1.2", "TLSv1.3"];

    return versionesCheck.map(v => {
      return {
        version: v,
        supported: output.includes(v) 
      };
    });

  } catch (error) {
    console.error("Error en la auditoría:", error);
    
    return [
      { version: "SSLv3", supported: false },
      { version: "TLSv1.0", supported: false },
      { version: "TLSv1.1", supported: false },
      { version: "TLSv1.2", supported: false },
      { version: "TLSv1.3", supported: false }
    ];
  }
}


const server = Bun.serve({
  port: 3000,
  async fetch(req) {
    const url = new URL(req.url);

    if (req.method === "POST" && url.pathname === "/api/version-tls-all") {
      try {
        
        const body = await req.json(); 
        const urlAProbar = body.url;
  
        if (!urlAProbar) {
          return Response.json({ error: "Falta la URL" }, { status: 400 });
        }
  
        const hostLimpio = urlAProbar.replace(/^https?:\/\//, '').split('/')[0];
        
        console.log(`--- Iniciando auditoría Nmap para: ${hostLimpio} ---`);
  
        const resultados = await auditVersionTLS(hostLimpio);
        
        return Response.json(resultados);
  
      } catch (error: any) {
        console.error("Error en el endpoint:", error.message);
        return Response.json(
          { error: "No se pudo completar el escaneo con Nmap" }, 
          { status: 500 }
        );
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