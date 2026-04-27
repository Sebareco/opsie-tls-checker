import { useState } from 'react';
import type { Project } from '../../types/tls';


export const useScanUrl = (setProjects: React.Dispatch<React.SetStateAction<Project[]>>) => {
  const [isScanning, setIsScanning] = useState(false);

  const fetchScan = async (projectId: string, urlId: string, url: string) => {
    setIsScanning(true);
    
    try {
      
      const response = await fetch(`TU_API_URL/scan?url=${url}`);
      const data = await response.json();

      
      setProjects(prev => prev.map(p => {
        if (p.id === projectId) {
          return {
            ...p,
            urls: p.urls.map(u => u.id === urlId ? { ...u, details: data, loading: false } : u)
          };
        }
        return p;
      }));
    } catch (err) {
      console.error("Error en scan:", err);
    } finally {
      setIsScanning(false);
    }
  };

  return { fetchScan, isScanning };
};