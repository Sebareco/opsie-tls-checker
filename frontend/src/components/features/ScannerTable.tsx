// src/components/features/ScannerTable.tsx
import React, { useState } from 'react';
import type { TLSResult } from '../../types/tls';
import { formatDateTime, formatDate, formatTime } from '../../utils/formatters';
import { StatusBadge } from '../shared/StatusBadge';

interface Props {
  urlsToShow: TLSResult[];
  globalLoading: boolean;
  singleUrl: string;
  errorUrl: string | null;
  selectedProjectId: string | null;

  setSingleUrl: (val: string) => void;
  handleAddAndScan: () => Promise<void>;
  fetchScan: (projId: string, resId: string, url: string) => Promise<void>;
  handleDelete: (projId: string, resId: string) => void;
}

export const ScannerTable = ({ 
  urlsToShow, globalLoading, singleUrl, errorUrl, 
  selectedProjectId, setSingleUrl, handleAddAndScan, 
  fetchScan, handleDelete 
}: Props) => {
  
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <h1 className="text-3xl font-bold text-center text-purple-400">Monitor TLS en Vivo</h1>
        <div className="flex gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700">
        <input
            type="text"
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            placeholder="Ingrese la URL (ej: google.com)"
            className="flex-1 bg-transparent px-4 outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAddAndScan()}
        />
        <button
            onClick={handleAddAndScan}
            disabled={globalLoading}
            className="bg-purple-600 px-6 py-2 rounded-lg font-bold hover:bg-purple-500 transition-colors disabled:opacity-50"
        >
            {globalLoading ? 'Buscando...' : 'Chequear'}
        </button>
        </div>

        {errorUrl && <div className="text-red-400 text-sm font-medium px-2">{errorUrl}</div>}

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
            <thead className="bg-slate-700/50 text-[10px] uppercase tracking-widest text-slate-400">
            <tr>
                <th className="p-4">URL</th>
                <th className="p-4 text-center">ESTADO</th>
                <th className="p-4 text-center">DETALLES</th>
                <th className="p-4 text-right">ACCIONES</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-700 text-sm">
            {urlsToShow.map((res) => (
                <React.Fragment key={res.id}>
                <tr
                    className="hover:bg-slate-700/30 transition-colors group"
                >
                    {/* COLUMNA URL */}
                    <td className="p-4" onClick={() => setExpandedIndex(expandedIndex === res.id ? null : res.id)}>
                    <div className="font-mono font-bold text-purple-300 cursor-pointer">{res.url}</div>
                    <div className="text-[10px] text-slate-500 italic">
                        Visto: {res.scannedAt ? formatDateTime(res.scannedAt)
                    : 'Nunca'}
                    </div>
                    </td>

                    {/* COLUMNA ESTADO */}
                    <td className="p-4 text-center">
                    {res.loading ? (
                        <span className="text-slate-500 animate-pulse text-xs">Escaneando...</span>
                    ) : res.error ? (
                        <span className="text-red-400 text-[10px] font-bold">ERROR</span>
                    ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        res.details.some(d => d.supported && !/TLSv1\.(2|3)/.test(d.version))
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                        {res.details.some(d => d.supported && !/TLSv1\.(2|3)/.test(d.version)) ? '⚠️ VULNERABLE' : '✅ SEGURO'}
                        </span>
                    )}
                    </td>

                    {/* COLUMNA DETALLES */}
                    <td className="p-4 cursor-pointer" onClick={() => setExpandedIndex(expandedIndex === res.id ? null : res.id)}>
                    <div className="flex items-center justify-center flex-col gap-2">
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">
                        {expandedIndex === res.id ? 'Cerrar ▲' : 'Ver más ▼'}
                        </span>
                        {!res.loading && !res.error && (
                        <div className="flex gap-1">
                            {res.details
                            .filter(d => d.supported)
                            .slice(0, 3)
                            .map(d => (
                                <div key={d.version} className="bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-700 flex items-center gap-1">
                                    <StatusBadge detail={d} hideText={true} size='sm'/>
                                    <span className="text-[8px] font-mono text-slate-400">
                                        {d.version.replace('TLSv', '')}
                                    </span>
                                </div>
                            ))}
                        </div>
                        )}
                    </div>
                    </td>


                    {/* COLUMNA ACCIONES - AQUÍ ESTÁ EL CAMBIO CLAVE */}
                    <td className="p-4">
                    <div className="flex flex-col items-end gap-1.5">
                        <button
                        onClick={(e) => { e.stopPropagation(); fetchScan(selectedProjectId!, res.id, res.url); }}
                        className="p-2 bg-slate-800 hover:bg-purple-500/20 text-purple-400 rounded-md border border-slate-700 transition-all text-[10px] font-bold uppercase tracking-tighter"
                        title="Re-escanear"
                        >
                        🔄 Scan
                        </button>
                        <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(selectedProjectId!, res.id) /* Tu función de eliminar aquí */ }}
                        className="p-2 bg-slate-800 hover:bg-red-500/20 text-red-400 rounded-md border border-slate-700 transition-all text-[10px] font-bold uppercase tracking-tighter"
                        title="Eliminar"
                        >
                        🗑️ Borrar
                        </button>
                    </div>
                    </td>
                </tr>

                {/* DESPLEGABLE (Igual que antes, pero con colSpan=4 para cubrir la nueva columna) */}
                {expandedIndex === res.id && !res.loading && (
                    <tr className="bg-slate-900/30 shadow-inner">
                    <td colSpan={4} className="p-6">
                        <div className="bg-slate-800/60 p-6 rounded-xl border border-slate-700">
                        <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-slate-900/50 rounded-t-lg border-b border-slate-700">
                            <div className="text-[10px] uppercase font-bold text-slate-500">Fecha</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 text-center">1.0</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 text-center">1.1</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 text-center">1.2</div>
                            <div className="text-[10px] uppercase font-bold text-slate-500 text-center">1.3</div>
                        </div>
                        

                        <div className="divide-y divide-slate-800">
                            {res.history.map((h, i) => (
                            <div key={i} className="grid grid-cols-5 gap-4 px-4 py-3 items-center hover:bg-slate-800/50">
                                <div className="flex flex-col">
                                <span className="text-[9px] text-slate-500">
                                    {formatDate(h.date)}
                                </span>
                                <span className="text-[10px] text-slate-300 font-mono italic">
                                    {formatTime(h.date)}
                                </span>
                                </div>

                                {h.results
                                .filter(r => !r.version.toLocaleLowerCase().includes('ssl'))
                                .map((r) => (
                                <div key={r.version} className="flex justify-center">
                                    <StatusBadge detail={r} hideText={true} size='md'/>
                                </div>
                                ))}
                            </div>
                            ))}
                        </div>
                        </div>
                    </td>
                    </tr>
                )}
                </React.Fragment>
            ))}
            </tbody>
        </table>
        </div>
    </div>
  );
};