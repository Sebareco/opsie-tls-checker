import { useEffect, useState } from 'react';


function App() {
  type Site = { name: string; url: string };
  type TLSResult = { name: string; url: string; version?: string; error?: string };

  const [sites, setSites] = useState<Site[]>([]);
  const [results, setResults] = useState<TLSResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [singleUrl, setSingleUrl] = useState('');
  const [singleResult, setSingleResult] = useState<TLSResult | null>(null);
  const [singleLoading, setSingleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);


  const getSeverityColor = (result: TLSResult): 'bg-green-100 text-green-700' | 'bg-yellow-100 text-yellow-700' | 'bg-red-100 text-red-700' | 'bg-grey-100 text-grey-700' => {

    if(result.error) return 'bg-red-100 text-red-700';

    if (!result.version) return 'bg-grey-100 text-grey-700';

    const v = result.version.toLocaleLowerCase();

    if(v.includes('1.2')) return 'bg-yellow-100 text-yellow-700';

    if(v.includes('1.3')) return 'bg-green-100 text-green-700';

    if (
      v.includes('1.1') ||
      v.includes('1.0') ||
      v.includes('ssl') ||
      v.includes('2.0') ||
      v.includes('3.0')
    ){ return 'bg-red-100 text-red-700'; }

    return 'bg-grey-100 text-grey-700';
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

  const handleAnalyzeSingle = async () => {
    if (!singleUrl.trim()) return;
    setSingleLoading(true);
    setSingleResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/check-tls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: singleUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data?.error ?? 'Error analizando URL');

      const result: TLSResult = {
        name: singleUrl.trim(),
        url: singleUrl.trim(),
        version: data.version,
        error: data.error,
      };
      setSingleResult(result);
    } catch (err) {
      setErrorMessage(String(err));
    } finally {
      setSingleLoading(false);
    }
  };

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
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="w-full max-w-3xl space-y-6 px-4 py-8 text-center">
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">Analizador de Seguridad TLS</h1>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <input
            type="url"
            id="miURL"
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            placeholder="Ejemplo: https://google.com"
            className="w-full sm:w-2/3 px-3 py-2 rounded-md border border-slate-300 text-grey focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={handleAnalyzeSingle}
            disabled={singleLoading || !singleUrl.trim()}
            className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {singleLoading ? 'Analizando...' : 'Analizar URL'}
          </button>
        </div>

        {singleResult && (
          <div className="mx-auto max-w-md p-4 bg-white rounded-xl shadow-md space-y-2s text-left">
            <div className="text-black font-bold">Resultado individual</div>
            <div className="text-sm text-slate-700 break-all">
              <span className="font-semibold">URL: </span>{singleResult.url}
            </div>
            <div className="text-sm text-slate-700">
              <span className="font-semibold">TLS / Error: </span>
              <span className={`ml-1 px-3 py-1 rounded-full text-xs font-bold ${getSeverityColor(singleResult)}`}>
                {singleResult.error ? singleResult.error : singleResult.version ?? 'No identificada'}
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <button
            type="button"
            disabled={loading || sites.length === 0}
            onClick={handleAnalyzeAll}
            className="px-5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Analizando...' : `Analizar todo (${sites.length})`}
          </button>
          <span className="text-sm text-slate-300">
            {sites.length > 0 ? 'Lista cargada desde el servidor.' : 'Cargando lista...'}
          </span>
        </div>

        {errorMessage && (
          <div className="alert-warning">
            {errorMessage}
          </div>
        )}

        {results.length > 0 && (
          <div className="p-6 bg-white shadow-lg rounded-xl border border-slate-200 space-y-4">
            <div className="text-black font-bold">Resultados</div>
            <table className="text-black min-w-full divide-y divide-slate-200">
              <thead className='bg-slate-50 font-bold uppercase tracking-wider'>
                <tr>
                  <th>Name</th>
                  <th>URL</th>
                  <th>TLS / Error</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-200'>
                {results.map((r) => (
                  <tr className='hover:bg-slate-50 text-center' key={`${r.name}-${r.url}`}>
                    <td>{r.name}</td>
                    <td>{r.url}</td>
                    <td>
                      <span className={`px-4 rounded-full text-xs font-bold ${getSeverityColor(r)}`}>
                        {r.error ? r.error : r.version ?? 'No identificada'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;