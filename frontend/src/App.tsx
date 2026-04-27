import {useEffect, useState } from 'react';
import { ScannerTable } from './components/features/ScannerTable';
import type{ TLSResult, Project, HistoryEvent, ProtocolDetail} from './types/tls';



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

        //localStorage.removeItem('v4');
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
      const currentScanDate = new Date().toISOString();


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

            const nuevoEvento = { date: currentScanDate, results: data };
            return {
              ...u,
              details: data,
              history: [nuevoEvento, ...(u.history || [])],
              scannedAt: currentScanDate,
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
      <ScannerTable 
        urlsToShow={urlsToShow}
        globalLoading={globalLoading}
        singleUrl={singleUrl}
        errorUrl={errorUrl}
        selectedProjectId={selectedProjectId}
        setSingleUrl={setSingleUrl}
        handleAddAndScan={handleAddAndScan}
        fetchScan={fetchScan}
        handleDelete={handleDelete}
      />
    </div>
  );
}

export default App;