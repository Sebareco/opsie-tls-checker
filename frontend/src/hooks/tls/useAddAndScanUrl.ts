import type { Dispatch, SetStateAction } from 'react';
import { PROJECTS_STORAGE_KEY } from '../../constants/storage';
import type { Project } from '../../types/tls';
import { normalizeUrl } from '../../utils/urlNormalizer';

type UseAddAndScanUrlParams = {
  projects: Project[];
  selectedProjectId: string | null;
  singleUrl: string;
  setSingleUrl: Dispatch<SetStateAction<string>>;
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setErrorUrl: Dispatch<SetStateAction<string | null>>;
  fetchScan: (projectId: string, urlId: string, urlToScan: string) => Promise<void>;
};

export const useAddAndScanUrl = ({
  projects,
  selectedProjectId,
  singleUrl,
  setSingleUrl,
  setProjects,
  setErrorUrl,
  fetchScan
}: UseAddAndScanUrlParams) => {
    const handleAddAndScan = async () => {
    const targetUrl = normalizeUrl(singleUrl).value;
    if (!targetUrl) {
      setErrorUrl(normalizeUrl(singleUrl).error);
      return;
    }
    if (!selectedProjectId) return;

    const currentProject = projects.find(p => p.id === selectedProjectId);
    if (currentProject) {
      const existingUrl = currentProject.urls.find(u => u.url === targetUrl);
      if (existingUrl) {
        setSingleUrl('');
        await fetchScan(selectedProjectId, existingUrl.id, targetUrl);
        return;
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
      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(nuevaLista));
      return nuevaLista;
    });

    setSingleUrl('');
    await fetchScan(selectedProjectId, urlId, targetUrl);
  };

  return { handleAddAndScan };
};
