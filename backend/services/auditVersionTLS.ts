import { execSync } from 'child_process';

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
  } catch (error: any) {
    console.error(`Error Nmap en ${host}:`, error.message);
    throw error;
  }
}
