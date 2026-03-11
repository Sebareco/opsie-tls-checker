import { useEffect, useState } from 'react';
import { requestFormReset } from 'react-dom';
import { resumeToPipeableStream } from 'react-dom/server';

/**
 * Explicación de Hooks:
 * - useState: Lo usamos para "reaccionar" a los cambios de datos en la pantalla.
 * - onSubmit: Manejamos el envío para controlar el flujo de datos.
 */
function App() {
  type Site = { name: string; url: string };
  type TLSResult = { name: string; url: string; version?: string; error?: string };

  const [sites, setSites] = useState<Site[]>([]);
  const [results, setResults] = useState<TLSResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const getSeverity = (result: TLSResult): 'good' | 'warning' | 'bad' | 'unknown' => {

    if(result.error) return 'bad';

    if (!result.version) return 'unknown';

    const v = result.version.toLocaleLowerCase();

    if(v.includes('1.3')) return 'good';

    if(v.includes('1.2')) return 'warning';

    if (
      v.includes('1.1') ||
      v.includes('1.0') ||
      v.includes('ssl') ||
      v.includes('2.0') ||
      v.includes('3.0')
    ){ return 'bad'; }

    return 'unknown';
  };

  useEffect(() => {
    let cancelled = false;

    const loadSites = async () => {
      setErrorMessage(null);
      try {
        const response = await fetch('/api/sites');
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data?.error ?? 'Error cargando sites');
        }
        if (!cancelled) setSites(data as Site[]);
      } catch (err) {
        if (!cancelled) setErrorMessage(String(err));
      }
    };

    void loadSites();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAnalyzeAll = async () => {
    setLoading(true);
    setResults([]);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/check-tls-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.error ?? 'Error analizando');
      setResults(data as TLSResult[]);
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <h1 className="app-title">Analizador de Seguridad TLS</h1>
      
      <div className="controls-row">
        <button
          type="button"
          disabled={loading || sites.length === 0}
          onClick={handleAnalyzeAll}
          className="primary-button"
        >
          {loading ? 'Analizando...' : `Analizar todo (${sites.length})`}
        </button>
        <span className="sites-status">
          {sites.length > 0 ? 'Lista cargada desde el servidor.' : 'Cargando lista...'}
        </span>
      </div>

      {errorMessage && (
        <div className="alert-warning">
          {errorMessage}
        </div>
      )}

      {results.length > 0 && (
        <div className="results-card">
          <div className="results-title">Resultados</div>
          <table className="results-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>URL</th>
                <th>TLS / Error</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={`${r.name}-${r.url}`}>
                  <td>{r.name}</td>
                  <td>{r.url}</td>
                  <td>
                    <span className={`tls-badge tls-badge--${getSeverity(r)}`}>
                      {r.error ? r.error : r.version ?? 'Unknown'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default App;