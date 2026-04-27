import { useState } from 'react';
import { ScannerTable } from './components/features/ScannerTable';
import { useAddAndScanUrl, useDeleteUrl, useProjectsStorage, useScanUrl } from './hooks/tls';
function App() {
  const { projects, setProjects, selectedProjectId } = useProjectsStorage();
  const [singleUrl, setSingleUrl] = useState('');
  const [globalLoading, setGlobalLoading] = useState(false);
  const [errorUrl, setErrorUrl] = useState<string | null>('');

  const { fetchScan } = useScanUrl({ setProjects, setGlobalLoading, setErrorUrl });
  const { handleDelete: deleteUrl } = useDeleteUrl(setProjects);
  const { handleAddAndScan } = useAddAndScanUrl({
    projects,
    selectedProjectId,
    singleUrl,
    setSingleUrl,
    setProjects,
    setErrorUrl,
    fetchScan
  });

  const handleDelete = (projectId: string, urlId: string) => {

    if (!window.confirm('¿Estás seguro de que querés eliminar esta URL y su historial?')) return;
    deleteUrl(projectId, urlId);
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