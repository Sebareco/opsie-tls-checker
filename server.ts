// server.ts
const server = Bun.serve({
    port: 3000,
    async fetch(req) {
      const url = new URL(req.url);
  
      // Servir archivos estáticos del build de React
      const filePath = "./frontend/dist" + (url.pathname === "/" ? "/index.html" : url.pathname);
      const file = Bun.file(filePath);
  
      if (await file.exists()) {
        return new Response(file);
      }
  
      // Fallback para SPA (Single Page Application)
      return new Response(Bun.file("./frontend/dist/index.html"));
    },
  });
  
  console.log(`🚀 Servidor corriendo en http://localhost:${server.port}`);