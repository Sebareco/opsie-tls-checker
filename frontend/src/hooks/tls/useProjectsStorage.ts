import { useState } from 'react';
import { PROJECTS_STORAGE_KEY } from '../../constants/storage';
import type { Project, TLSResult } from '../../types/tls';
import { error } from '../../utils/logger';

const INITIAL_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Tester',
    urls: []
  }
];

export const useProjectsStorage = () => {
  const [projects, setProjects] = useState<Project[]>(() => {
    const dataRaw = localStorage.getItem(PROJECTS_STORAGE_KEY);
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
      error('Error al hidratar storage de proyectos:', e);
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
