
🛡️ OPSIE-TLS-CHECKER - DOCUMENTACIÓN TÉCNICA

DESCRIPCIÓN:
Herramienta de auditoría de seguridad web para monitoreo de 
protocolos TLS en tiempo real. Utiliza Nmap para escaneo 
profundo y React para la visualización.

TECNOLOGÍAS:
- Frontend: React 18 + TypeScript + Tailwind CSS
- Runtime: Bun (Backend de alta performance)
- Seguridad: Nmap (Script ssl-enum-ciphers)
- Persistencia: LocalStorage V3 (Basado en objetos)

------------------------------------------------------------
✨ CARACTERÍSTICAS PRINCIPALES
------------------------------------------------------------
- Escaneo Multiversión: Detecta SSLv3, TLS 1.0, 1.1, 1.2 y 1.3.
- Indicadores LED: Visualización Emerald (Seguro) / Red (Vulnerable).
- Historial Local: Persistencia de auditorías con fecha y hora.
- Alertas de Vulnerabilidad: Identifica protocolos obsoletos.

------------------------------------------------------------
🛠️ INSTALACIÓN Y EJECUCIÓN
------------------------------------------------------------
## 🛠️ Instalación y Configuración

### 1. Requisitos Previos
* Tener instalado [Bun](https://bun.sh).
* Tener instalado [Nmap](https://nmap.org/download.html) (Asegurarse de tener `nmap` en el PATH del sistema).

1. Clonar repo:
   git clone https://github.com/tu-usuario/opsie-tls-checker.git

2. Instalar dependencias:
   bun install

3. Correr proyecto:
   bun run dev

------------------------------------------------------------
📋 ESTRUCTURA DE DATOS (JSON V3)
------------------------------------------------------------
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

------------------------------------------------------------
⚠️ SOLUCIÓN DE PROBLEMAS (TIMEOUTS EN WINDOWS)
------------------------------------------------------------
Si recibís error ETIMEDOUT:
- El sistema usa el flag '-n' en Nmap para evitar DNS lento.
- Se recomienda subir el timeout a 60000ms en server.ts.
- Correr en terminal con permisos de Administrador.

------------------------------------------------------------
👤 AUTOR: Sebastian Areco
 Ingeniería en Informática - Misiones, Argentina.
------------------------------------------------------------
Desarrollado en Abril de 2026.
============================================================
