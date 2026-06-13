import type { Dispatch, SetStateAction } from 'react';
import { PROJECTS_STORAGE_KEY } from '../../constants/storage';
import type { Project } from '../../types/tls';

export const useDeleteUrl = (setProjects: Dispatch<SetStateAction<Project[]>>) => {
  const handleDelete = (projectId: string, urlId: string) => {
    setProjects(prevProjects => {
      const nuevosProyectos = prevProjects.map(proj => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          urls: proj.urls.filter(u => u.id !== urlId)
        };
      });

      localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(nuevosProyectos));
      return nuevosProyectos;
    });
  };

  return { handleDelete };
};