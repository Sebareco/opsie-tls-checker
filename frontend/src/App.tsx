import { useState } from 'react';

/**
 * Explicación de Hooks:
 * - useState: Lo usamos para "reaccionar" a los cambios de datos en la pantalla.
 * - onSubmit: Manejamos el envío para controlar el flujo de datos.
 */
function App() {
  const [url, setUrl] = useState(''); // Guarda lo que el usuario escribe.
  const [result, setResult] = useState<{ url: string; version: string } | null>(null); // Guarda la respuesta del servidor.
  const [loading, setLoading] = useState(false); // Estado visual de "cargando".

  const handleSubmit = async (e: React.FormEvent) => {
    // e.preventDefault(): Crucial. Evita que el navegador recargue la página (comportamiento por defecto de los forms).
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      // fetch('/api/...'): Enviamos los datos al servidor de Bun.
      const response = await fetch('/api/check-tls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }), // Convertimos el objeto JS a un string JSON.
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
      } else {
        setResult(data); // Actualizamos el estado para mostrar el mensaje abajo.
      }
    } catch (err) {
      alert("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', fontFamily: 'system-ui' }}>
      <h1>Analizador de Seguridad TLS</h1>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Ej: google.com"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)} // Vinculamos el input con el estado 'url'.
          style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}
        >
          {loading ? 'Consultando...' : 'Analizar'}
        </button>
      </form>

      {/* Renderizado condicional: Solo se muestra si hay un resultado */}
      {result && (
        <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f4f4f4', borderRadius: '8px' }}>
          <p style={{margin: 0 ,color: 'black'}}>
          TLS version of <strong >{result.url}</strong> is <strong >{result.version}</strong>
          </p>
        </div>
      )}
    </div>
  );
}

export default App;