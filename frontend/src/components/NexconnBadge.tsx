import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';

export const NexconnBadge: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { nexconnStatus } = useAuth();

  const isConnected = nexconnStatus.toLowerCase().includes('connected');
  const isConnecting = nexconnStatus.toLowerCase().includes('connecting');

  if (compact) {
    return (
      <span
        title={`Nexconn Chat SDK: ${nexconnStatus}`}
        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border border-blue-500/20 bg-blue-500/10 text-blue-400"
      >
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isConnected ? 'bg-emerald-400 animate-pulse' : isConnecting ? 'bg-amber-400 animate-ping' : 'bg-red-400'
          }`}
        />
        <span>Nexconn SDK</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border border-white/10 bg-dark-850/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-1.5">
        {isConnected ? (
          <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
        ) : isConnecting ? (
          <Wifi className="w-3.5 h-3.5 text-amber-400 animate-spin" />
        ) : (
          <WifiOff className="w-3.5 h-3.5 text-slate-400" />
        )}
        <span className="text-dark-300">Nexconn Web SDK:</span>
        <span
          className={`font-semibold ${
            isConnected
              ? 'text-emerald-400'
              : isConnecting
              ? 'text-amber-400'
              : 'text-slate-400'
          }`}
        >
          {nexconnStatus}
        </span>
      </div>
    </div>
  );
};

