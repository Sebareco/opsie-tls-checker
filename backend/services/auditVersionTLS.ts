import { execSync } from 'child_process';
import { error } from '../utils/logger';

export type AuditResult = {
  version: string;
  supported: boolean;
};

export async function auditVersionTLS(host: string): Promise<AuditResult[]> {
  try {
    const comando = `nmap -p 443 --script ssl-enum-ciphers -n ${host}`;
    const output = execSync(comando, { encoding: 'utf-8', timeout: 60000 });

    const versionesCheck = ['SSLv3', 'TLSv1.0', 'TLSv1.1', 'TLSv1.2', 'TLSv1.3'];
    return versionesCheck.map(v => ({
      version: v,
      supported: output.includes(v)
    }));
  } catch (err: any) {
    error(`Error Nmap en ${host}:`, err.message);
    throw err;
  }
}
