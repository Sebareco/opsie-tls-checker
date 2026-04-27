import type { ProtocolDetail } from "../../types/tls";

interface Props  {
  detail: ProtocolDetail;
  hideText?: boolean;
  size?: 'sm' | "md";
}


export const StatusBadge = ({ detail, hideText = false, size = 'md'}: Props) => {
  const isSupported = detail.supported;
  const isModern = /1\.(2|3)/.test(detail.version);

  const circleSize = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';

  return (
    <div className="flex items-center gap-2">
      <div className={`${circleSize} rounded-full ${
        !isSupported 
          ? 'bg-slate-600' 
          : isModern 
            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
            : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
      }`} />
      {!hideText &&(
        <span className={`text-xs font-mono ${
          !isSupported ? 'text-slate-500' : isModern ? 'text-emerald-400' : 'text-red-400'
        }`}>
          {detail.version}
        </span>
      )}
    </div>
  );
};