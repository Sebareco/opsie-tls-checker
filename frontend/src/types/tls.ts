export type ProtocolDetail = {
    version: string;
    supported: boolean;
  };
  
  
export type HistoryEvent = {
    date: string;
    results: ProtocolDetail[];
  };
  
  
export type TLSResult = {
    id: string;
    url: string;
    details: ProtocolDetail[];
    history: HistoryEvent[];
    loading?: boolean;
    error?: string | null;
    scannedAt?: string | null;
  };
  
  
export type Project = {
    id: string;
    name: string;
    urls: TLSResult[];
  };