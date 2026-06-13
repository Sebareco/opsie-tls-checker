import type { Dispatch, SetStateAction } from 'react';
import type { Project, ProtocolDetail } from '../../types/tls';
import { error } from '../../utils/logger';

type UseScanUrlParams = {
  setProjects: Dispatch<SetStateAction<Project[]>>;
  setGlobalLoading: Dispatch<SetStateAction<boolean>>;
  setErrorUrl: Dispatch<SetStateAction<string | null>>;
};

export const useScanUrl = ({ setProjects, setGlobalLoading, setErrorUrl }: UseScanUrlParams) => {
  const updateProjects = (updater: (prev: Project[]) => Project[]) => {
    setProjects(prev => {
      const next = updater(prev);
      localStorage.setItem('v4', JSON.stringify(next));
      return next;
    });
  };

  const esPrimerEscaneoFallido = (url: Project['urls'][number]) =>
    !url.scannedAt && (!url.history || url.history.length === 0);

  const manejarFalloScan = (pId: string, uId: string, msg: string) => {
    updateProjects(prev => prev.map(p => {
      if (p.id !== pId) return p;

      const url = p.urls.find(u => u.id === uId);
      if (url && esPrimerEscaneoFallido(url)) {
        return { ...p, urls: p.urls.filter(u => u.id !== uId) };
      }

      return {
        ...p,
        urls: p.urls.map(u => u.id === uId ? { ...u, loading: false, error: msg } : u)
      };
    }));
  };

  const fetchScan = async (projectId: string, urlId: string, urlToScan: string) => {
    setGlobalLoading(true);
    setErrorUrl(null);

    updateProjects(prev => prev.map(p => p.id === projectId ? {
      ...p,
      urls: p.urls.map(u => u.id === urlId ? { ...u, loading: true, error: null } : u)
    } : p));

    try {
      const response = await fetch('/api/version-tls-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScan }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const msg = errorData.error || 'El servidor tuvo un problema.';
        setErrorUrl(`⚠️ Error: ${msg}`);

        manejarFalloScan(projectId, urlId, msg);
        return;
      }

      const data: ProtocolDetail[] = await response.json();
      const currentScanDate = new Date().toISOString();

      const hasConnection = data.some((d) => d.supported);
      if (!hasConnection) {
        setErrorUrl('El host no respondió a ninguna prueba TLS.');
        manejarFalloScan(projectId, urlId, 'Sin respuesta TLS');
        return;
      }

      updateProjects(prev => prev.map(p => {
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
      error('CRITICO', err);
      setErrorUrl('❌ No se puede conectar con el Backend.');
      manejarFalloScan(projectId, urlId, 'Servidor Offline');
    } finally {
      setGlobalLoading(false);
    }
  };

  return { fetchScan };
};