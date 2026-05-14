/*
 * Logger module — salida unificada por consola (Bun/Node).
 */

const DEBUG_ENABLED =
  process.env.LOG_DEBUG?.toLowerCase() === 'true';

function getTimestamp(): string {
  return new Date().toISOString();
}

export function debug(
  message: string,
  ...optionalParams: unknown[]
): void {
  if (!DEBUG_ENABLED) {
    return;
  }

  console.debug(
    `[${getTimestamp()}] [DEBUG] ${message}`,
    ...optionalParams
  );
}

export function info(
  message: string,
  ...optionalParams: unknown[]
): void {
  console.info(
    `[${getTimestamp()}] [INFO] ${message}`,
    ...optionalParams
  );
}

export function warn(
  message: string,
  ...optionalParams: unknown[]
): void {
  console.warn(
    `[${getTimestamp()}] [WARN] ${message}`,
    ...optionalParams
  );
}

export function error(
  message: string,
  ...optionalParams: unknown[]
): void {
  console.error(
    `[${getTimestamp()}] [ERROR] ${message}`,
    ...optionalParams
  );
}
