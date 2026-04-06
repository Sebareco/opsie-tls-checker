import { useEffect, useState } from 'react';


type ProtocolDetail = { 
  version: string; 
  supported: boolean; 
};

type TLSResult = { 
  url: string; 
  details: ProtocolDetail[];
  loading?: boolean; 
  error?: string;
};

function App() {
  const [results, setResults] = useState<TLSResult[]>([]);
  const [singleUrl, setSingleUrl] = useState('');
  const [globalLoading, setGlobalLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [errorUrl, setErrorUrl] = useState("");

  
  useEffect(() => {
    const urlsGuardadas = localStorage.getItem('opsie_urls_v3');
    if (urlsGuardadas) {
      try {
        const listaUrls = JSON.parse(urlsGuardadas) as string[];
        
        const initialResults = listaUrls.map(url => ({ url, details: [], loading: true }));
        setResults(initialResults);

        
        listaUrls.forEach(url => fetchScan(url));
      } catch (e) {
        console.error("Error cargando URLs", e);
      }
    }
  }, []);

 
  const fetchScan = async (url: string) => {
    try {
      const response = await fetch('/api/version-tls-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok){
        const errorData = await response.json();
        setErrorUrl(errorData.error || "El sitio no existe.");
        setGlobalLoading(false);
        return;
      }
  
      const data = await response.json();

      const hasConnection = data.some((d: ProtocolDetail) => d.supported);
      if (!hasConnection) {
        
        setResults(prev => prev.filter(r => r.url !== url));
        return;
      }

      setResults(prev => {
        const index = prev.findIndex(r => r.url === url);
        const nuevo = { url, details: data, loading: false };
        
        if (index !== -1) {
          const copia = [...prev];
          copia[index] = nuevo;
          return copia;
        }
        return [nuevo, ...prev];
      });

    } catch (err) {
      console.error("Error escaneando " + url, err);
      setResults(prev => prev.filter(r => r.url !== url));
    }
  };

  const handleAddAndScan = async () => {
    const targetUrl = singleUrl.trim();

    const regexProtocol = /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,6})(\/.*)?$/i;

    if(!targetUrl){
      setErrorUrl("Por favor, ingrese una URL válida");
      return;
    }

    if (!regexProtocol.test(targetUrl)){
      setErrorUrl("La URL no es válida (ejemplo: https://www.google.com)");
      return;
    }

    setErrorUrl("");

    if(results.some(r => r.url === targetUrl)){
      setSingleUrl('');
      fetchScan(targetUrl);
      return;
    }
    
    setGlobalLoading(true);
    await fetchScan(targetUrl);

    const currentUrls = results.map(r => r.url);
    if(!currentUrls.includes(targetUrl)){
      localStorage.setItem('opsie_urls_v3', JSON.stringify([targetUrl, ...currentUrls]));
    }

    setGlobalLoading(false);
    setSingleUrl('');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-purple-400">Monitor TLS en Vivo</h1>

        
        <div className="flex gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <input
            type="text"
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            placeholder="Ingrese la URL a auditar"
            className="flex-1 bg-transparent px-4 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAndScan()}
          />
          <button 
            onClick={handleAddAndScan}
            disabled={globalLoading}
            className="bg-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-purple-500 transition-colors"
          >
            {globalLoading ? 'Buscando...' : 'Chequear'}
          </button>
        </div>
        {errorUrl && <span style={{color:'red'}}>{errorUrl}</span>}

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-700 text-[10px] uppercase tracking-widest">
              <tr>
                <th className="p-4">URL</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {results.map((res, idx) => (
                <div key={idx} className="contents">
                  <tr 
                    onClick={() => setExpandedIndex(expandedIndex === idx ? null : idx)}
                    className="hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 font-mono">{res.url}</td>
                    <td className="p-4 text-center">
                      {res.loading ? (
                        <span className="text-slate-500 animate-pulse italic text-xs font-bold">Escaneando...</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          res.details.some(d => d.supported && d.version.includes('SSL')) 
                          ? 'bg-red-500/20 text-red-400' 
                          : 'bg-emerald-500/20 text-emerald-400'
                        }`}>
                          {res.details.some(d => d.supported && d.version.includes('SSL')) ? '⚠️ VULNERABLE' : '✅ SEGURO'}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right text-slate-500 italic text-xs">
                      {expandedIndex === idx ? 'Ocultar' : 'Ver LEDs'}
                    </td>
                  </tr>
                  
                  {expandedIndex === idx && !res.loading && (
                    <tr className="bg-slate-900/50">
                      <td colSpan={3} className="p-4">
                        <div className="flex justify-around bg-slate-800/50 p-4 rounded-lg">
                          {res.details.map(d => (
                            <div key={d.version} className="flex flex-col items-center gap-2">
                              <span className="text-[9px] text-slate-500">{d.version}</span>
                              <div className={`h-3 w-3 rounded-full ${
                                d.supported 
                                  ? (d.version.includes('1.2') || d.version.includes('1.3') ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]') 
                                  : 'bg-slate-700'
                              }`} />
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </div>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;