# OPSIE TLS Checker

Herramienta de auditoría de seguridad web para monitorear protocolos TLS. Usa Nmap (`ssl-enum-ciphers`) en el backend y React + Vite en el frontend.

## Requisitos

- [Bun](https://bun.sh)
- [Nmap](https://nmap.org/download.html) en el `PATH` del sistema

## Instalación

```bash
git clone https://github.com/tu-usuario/opsie-tls-checker.git
cd opsie-tls-checker
bun install
```

`bun install` en la raíz instala las dependencias de `backend` y `frontend` (workspaces).

## Desarrollo

Desde la raíz del repositorio:

```bash
bun run dev
```

- **UI (Vite):** http://localhost:5173 — las peticiones `/api` se proxyan al backend.
- **API (Bun):** http://localhost:3000

Scripts por paquete (solo si trabajás en una parte):

```bash
bun run --cwd backend dev
bun run --cwd frontend dev
```

## Producción

```bash
bun run build
bun run start
```

La app queda servida en http://localhost:3000 (API + estáticos de `frontend/dist`).

## Estructura del proyecto

```
opsie-tls-checker/
├── package.json      # orquestación (dev, build, start)
├── backend/          # API Bun + Nmap
└── frontend/         # React + Vite + Tailwind
```

## Formato de auditoría (JSON)

```json
{
  "url": "host.com",
  "details": [
    { "version": "TLSv1.2", "supported": true },
    { "version": "TLSv1.3", "supported": true }
  ],
  "scannedAt": "10/04/2026, 19:30:00",
  "loading": false,
  "error": null
}
```

## Solución de problemas (Windows)

Si aparece `ETIMEDOUT`:

- Nmap usa el flag `-n` para evitar resolución DNS lenta.
- Ejecutá la terminal con permisos de administrador si el escaneo lo requiere.

## Autor

Sebastian Areco — Ingeniería en Informática, Misiones, Argentina.
