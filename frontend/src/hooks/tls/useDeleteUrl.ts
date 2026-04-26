import type { Project } from '../../types/tls';

export const useDeleteUrl = (setProjects: React.Dispatch<React.SetStateAction<Project[]>>) => {
  
  const handleDelete = (projectId: string, urlId: string) => {
    // Pegás tu lógica de filter
    setProjects(prev => prev.map(proj => {
      if (proj.id === projectId) {
        return { 
          ...proj, 
          urls: proj.urls.filter(u => u.id !== urlId) 
        };
      }
      return proj;
    }));
  };

  return { handleDelete };
};