import React, {useEffect, useState } from 'react';

type ProtocolDetail = { 
  version: string; 
  supported: boolean; 
};


type HistoryEvent = {
  date: string;
  results: ProtocolDetail[];
};


type TLSResult = { 
  id: string; 
  url: string; 
  details: ProtocolDetail[];
  history: HistoryEvent[];
  loading?: boolean; 
  error?: string | null;
  scannedAt?: string | null;
};


type Project = {
  id: string;
  name: string;
  urls: TLSResult[];
};

function App() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: '1',
      name: 'Tester',
      urls: [] 
    }
  ]);
  
  // const [projects, setProjects] = useState<Project[]>(() => {
  //   const saved = localStorage.getItem('opsie_urls_v3');
  //   return saved ? JSON.parse(saved) : [];
  // });
  // Y para la tabla, probablemente necesites saber qué proyecto está seleccionado
  const [selectedProjectId, _setSelectedProjectId] = useState<string | null>('1');


  const [singleUrl, setSingleUrl] = useState('');
  const [globalLoading, setGlobalLoading] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>("");

  useEffect(() => {
    
    const dataRaw = localStorage.getItem('v4'); 
    
    if (dataRaw) {
      try {
        const listaProyectos = JSON.parse(dataRaw);
        
        if (Array.isArray(listaProyectos)) {
          
          const hidratados = listaProyectos?.map((proyecto: Project) => ({
            ...proyecto,
            urls: proyecto.urls.map((u: TLSResult) => ({
              ...u,
              loading: false, 
              error: u.error || null,
              history: u.history || [] 
            }))
          }));
          
          setProjects(hidratados); 
        }
      } catch (e) {
        console.error("Error al hidratar storage de proyectos:", e);
        
        localStorage.removeItem('v4'); 
      }
    }
  }, []);

  const fetchScan = async (projectId: string, urlId: string, urlToScan: string) => {
    setGlobalLoading(true);
    setErrorUrl(null);
    
    setProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      urls: p.urls.map(u => u.id === urlId ? { ...u, loading: true, error: null } : u)
    } : p));
    
    console.log("Iniciando scan para:", projectId, urlId, urlToScan);

    try {
      const response = await fetch('/api/version-tls-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScan }),
      });
  
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})); 
        const msg = errorData.error || "El servidor tuvo un problema.";
        setErrorUrl(`⚠️ Error: ${msg}`);
        
        actualizarEstadoUrl(projectId, urlId, { loading: false, error: msg });
        return;
      }
  
      
      const data: ProtocolDetail[] = await response.json();
      const dateLocal = new Date().toLocaleString();
  
      
      const hasConnection = data.some((d) => d.supported);
      if (!hasConnection) {
        setErrorUrl("El host no respondió a ninguna prueba TLS.");
        actualizarEstadoUrl(projectId, urlId, { loading: false, error: "Sin respuesta TLS" });
        return;
      }
  
     
      setProjects(prev => prev.map(p => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          urls: p.urls.map(u => {
            if (u.id !== urlId) return u;
            
            const nuevoEvento = { date: dateLocal, results: data };
            return {
              ...u,
              details: data,
              history: [nuevoEvento, ...(u.history || [])],
              scannedAt: dateLocal,
              loading: false,
              error: null
            };
          })
        };
      }));
  
    } catch (err) {
      console.error("CRÍTICO", err);
      setErrorUrl("❌ No se puede conectar con el Backend.");
      actualizarEstadoUrl(projectId, urlId, { loading: false, error: "Servidor Offline" });
    } finally {
      setGlobalLoading(false);
    }
  };
  
  
  const actualizarEstadoUrl = (pId: string, uId: string, cambios: any) => {
    setProjects(prev => prev.map(p => p.id === pId ? {
      ...p,
      urls: p.urls.map(u => u.id === uId ? { ...u, ...cambios } : u)
    } : p));
  };

  const handleAddAndScan = async () => {
    
    const targetUrl = singleUrl.trim();
    
   
    if (!targetUrl) return setErrorUrl("URL vacía");
    
    
    if (!selectedProjectId) {
        console.error("ERROR: No hay ID de proyecto seleccionado");
        return;
    }

    const currentProject = projects.find(p => p.id === selectedProjectId);

    if (currentProject) {
        const existingUrl = currentProject.urls.find(u => u.url === targetUrl);
        if (existingUrl) {
            console.log("4. La URL ya existía, disparando fetch directo");
            setSingleUrl('');
            return fetchScan(selectedProjectId, existingUrl.id, targetUrl);
        }
    }

    const urlId = crypto.randomUUID(); 

    const nuevoResultado = {
        id: urlId,
        url: targetUrl,
        details: [],
        history: [],
        scannedAt: null,
        loading: true,
        error: null
    };

    
    setProjects(prev => {
        const nuevaLista = prev.map(p => {
            if (p.id !== selectedProjectId) return p;
            return { ...p, urls: [nuevoResultado, ...p.urls] };
        });
        localStorage.setItem('v4', JSON.stringify(nuevaLista));
        return nuevaLista;
    });

    setSingleUrl('');
    
    
    await fetchScan(selectedProjectId, urlId, targetUrl); 
};

  const handleDelete = (projectId: string, urlId: string) => {
    
    if (!window.confirm("¿Estás seguro de que querés eliminar esta URL y su historial?")) return;
  
    setProjects(prevProjects => {
      const nuevosProyectos = prevProjects.map(proj => {
        if (proj.id !== projectId) return proj; 
  
        
        return {
          ...proj,
          urls: proj.urls.filter(u => u.id !== urlId)
        };
      });

      localStorage.setItem('v4', JSON.stringify(nuevosProyectos));
  
      return nuevosProyectos;
    });
  };


  
  const activeProject = projects.find(p => p.id === selectedProjectId);
  const urlsToShow = activeProject ? activeProject.urls : [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-center text-purple-400">Monitor TLS en Vivo</h1>

        <div className="flex gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
          <input
            type="text"
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            placeholder="Ingrese la URL (ej: google.com)"
            className="flex-1 bg-transparent px-4 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAndScan()}
          />
          <button 
            onClick={handleAddAndScan}
            disabled={globalLoading}
            className="bg-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-purple-500 transition-colors disabled:opacity-50"
          >
            {globalLoading ? 'Buscando...' : 'Chequear'}
          </button>
        </div>
        
        {errorUrl && <div className="text-red-400 text-sm font-medium px-2">{errorUrl}</div>}

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-700/50 text-[10px] uppercase tracking-widest text-slate-400">
              <tr>
                <th className="p-4">URL</th>
                <th className="p-4 text-center">ESTADO</th>
                <th className="p-4 text-center">DETALLES</th>
                <th className="p-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
              {urlsToShow.map((res) => (
                <React.Fragment key={res.id}>
                  <tr 
                    className="hover:bg-slate-700/30 transition-colors group"
                  >
                    {/* COLUMNA URL */}
                    <td className="p-4" onClick={() => setExpandedIndex(expandedIndex === res.id ? null : res.id)}>
                      <div className="font-mono font-bold text-purple-300 cursor-pointer">{res.url}</div>
                      <div className="text-[10px] text-slate-500 italic">Visto: {res.scannedAt || 'Nunca'}</div>
                    </td>
                    
                    {/* COLUMNA ESTADO */}
                    <td className="p-4 text-center">
                      {res.loading ? (
                        <span className="text-slate-500 animate-pulse text-xs">Escaneando...</span>
                      ) : res.error ? (
                        <span className="text-red-400 text-[10px] font-bold">ERROR</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          res.details.some(d => d.supported && !/TLSv1\.(2|3)/.test(d.version)) 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                          {res.details.some(d => d.supported && !/TLSv1\.(2|3)/.test(d.version)) ? '⚠️ VULNERABLE' : '✅ SEGURO'}
                        </span>
                      )}
                    </td>

                    {/* COLUMNA DETALLES */}
                    <td className="p-4 cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === res.id ? null : res.id)}>
                      <div className="flex items-center justify-center flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                          {expandedIndex === res.id ? 'Cerrar ▲' : 'Ver más ▼'}
                        </span>
                        {!res.loading && !res.error && (
                          <div className="flex gap-1">
                            {res.details.filter(d => d.supported).slice(0, 3).map(d => (
                              <div key={d.version} className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                                <div className={`w-1 h-1 rounded-full ${/1\.(2|3)/.test(d.version) ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                <span className="text-[8px] font-mono text-slate-400">{d.version.replace('TLSv', '')}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>


                    {/* COLUMNA ACCIONES - AQUÍ ESTÁ EL CAMBIO CLAVE */}
                    <td className="p-4">
                      <div className="flex flex-col items-end gap-1.5">
                        <button 
                          onClick={(e) => { e.stopPropagation(); fetchScan(selectedProjectId!, res.id, res.url); }}
                          className="p-2 bg-slate-800 hover:bg-purple-500/20 text-purple-400 rounded-md border border-slate-700 transition-all text-[10px] font-bold uppercase tracking-tighter"
                          title="Re-escanear"
                        >
                          🔄 Scan
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(selectedProjectId!, res.id) /* Tu función de eliminar aquí */ }}
                          className="p-2 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-md border border-slate-700 transition-all text-[10px] font-bold uppercase tracking-tighter"
                          title="Eliminar"
                        >
                          🗑️ Borrar
                        </button>
                      </div>
                    </td>   
                  </tr>
                  
                  {/* DESPLEGABLE (Igual que antes, pero con colSpan=4 para cubrir la nueva columna) */}
                  {expandedIndex === res.id && !res.loading && (
                    <tr className="bg-slate-900/30 shadow-inner">
                      <td colSpan={4} className="p-6">
                        <div className="bg-slate-800/80 p-6 rounded-xl border border-slate-700">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            
                            {/* SECCIÓN IZQUIERDA: DETALLES ACTUALES (Tus circulitos) */}
                            <div className="lg:col-span-2">
                              <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-widest">Estado Actual de Protocolos</h4>
                              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                                {res.details.map(d => (
                                  <div key={d.version} className="flex flex-col items-center gap-2 p-3 rounded-lg bg-slate-900/40 border border-slate-700/50">
                                    <span className="text-[10px] text-slate-400 font-bold">{d.version}</span>
                                    <div className={`h-3 w-3 rounded-full ${
                                        d.supported 
                                          ? (d.version.includes('1.2') || d.version.includes('1.3') ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]') 
                                          : 'bg-slate-700'
                                      }`} 
                                    />
                                    <span className="text-[8px] uppercase text-slate-500 font-bold">
                                      {d.supported ? 'Activo' : 'Off'}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* SECCIÓN DERECHA: HISTORIAL (Línea de tiempo) */}
                            <div className="border-l border-slate-700/50 pl-6">
                              <h4 className="text-[10px] text-slate-500 font-bold uppercase mb-4 tracking-widest">
                                Historial de Auditorías
                              </h4>
                              <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-700">
                                {res.history && res.history.length > 0 ? (
                                  res.history.map((h, i) => {
                                    // Lógica: es vulnerable si alguna versión vieja está soportada
                                    const isVulnerable = h.results.some(r => 
                                      r.supported && (r.version.includes('1.0') || r.version.includes('1.1'))
                                    );

                                    return (
                                      <div key={i} className="flex items-center justify-between bg-slate-900/20 p-2 rounded border border-transparent hover:border-slate-700/50 transition-colors">
                                        <div className="flex flex-col">
                                          <span className="text-[9px] text-slate-500">
                                            {new Date(h.date).toLocaleDateString()}
                                          </span>
                                          <span className="text-[10px] text-slate-300 font-mono italic">
                                            {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                          </span>
                                        </div>
                                        {/* Si NO es vulnerable, se pone verde (emerald) */}
                                        <div className={`h-1.5 w-1.5 rounded-full ${!isVulnerable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span className="text-[10px] text-slate-600 italic">No hay registros previos</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;