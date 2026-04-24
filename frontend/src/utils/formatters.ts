export const formatDateTime = (isoString: string | null | undefined): string => {
    if (!isoString) return "--/--/-- --:--";
    
    const date = new Date(isoString);
    
    // Usamos el locale del navegador para que se adapte al usuario
    return date.toLocaleString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

export const formatDate = (isoString: string | null | undefined): string => {
    if(!isoString) return "Sin fecha";
    return new Date(isoString).toLocaleDateString();
    };

export const formatTime = (isoString: string | null | undefined): string => {
    if (!isoString) return "--:--";
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };