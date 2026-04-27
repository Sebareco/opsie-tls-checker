import { useState } from 'react';
import type { Project, TLSResult } from '../../types/tls';

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Tester',
    urls: []
  }
];

export const useProjectsStorage = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const dataRaw = localStorage.getItem('v4');
    if (!dataRaw) return INITIAL_PROJECTS;

    try {
      const listaProyectos = JSON.parse(dataRaw);
      if (!Array.isArray(listaProyectos)) return INITIAL_PROJECTS;

      return listaProyectos.map((proyecto: Project) => ({
        ...proyecto,
        urls: proyecto.urls.map((u: TLSResult) => ({
          ...u,
          loading: false,
          error: u.error || null,
          history: u.history || []
        }))
      }));
    } catch (e) {
      console.error('Error al hidratar storage de proyectos:', e);
      return INITIAL_PROJECTS;
    }
  });
  const selectedProjectId: string | null = '1';

  return {
    projects,
    setProjects,
    selectedProjectId
  };
};
