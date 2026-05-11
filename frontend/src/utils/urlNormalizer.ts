/**
 * Resultado de la normalización de URL
 */
export interface UrlResult {
    value: string | null;
    error: string | null;
  }
  
  /**
   * Normaliza una URL para ser utilizada en procesos de escaneo (por ejemplo, Nmap)
   * - Elimina protocolo
   * - Extrae el hostname
   * - Elimina el prefijo 'www.'
   * - Valida hosts prohibidos
   */
  export function normalizeUrl(input: string): UrlResult {
    // 1. Validación inicial
    if (!input || typeof input !== "string") {
      return {
        value: null,
        error: "Debe ingresar una URL válida.",
      };
    }
  
    const cleaned = input.trim().toLowerCase();
  
    if (!cleaned) {
      return {
        value: null,
        error: "Debe ingresar una URL válida.",
      };
    }
  
    try {
      // 2. Asegurar protocolo para parseo correcto
      const urlObject = new URL(
        cleaned.startsWith("http") ? cleaned : `http://${cleaned}`
      );
  
      let hostname = urlObject.hostname;
  
      // 3. Normalización: eliminar 'www.' únicamente si está al inicio
      if (hostname.startsWith("www.")) {
        hostname = hostname.slice(4);
      }
  
      // 4. Validación de hosts prohibidos
      const forbiddenHosts = new Set(["localhost", "127.0.0.1", "0.0.0.0"]);
  
      if (forbiddenHosts.has(hostname)) {
        return {
          value: null,
          error: "No está permitido utilizar direcciones locales para este proceso.",
        };
      }
  
      return {
        value: hostname,
        error: null,
      };
    } catch {
      return {
        value: null,
        error: "La URL ingresada no posee un formato válido.",
      };
    }
  }