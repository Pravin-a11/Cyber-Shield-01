import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Globe, Satellite, Zap, AlertTriangle, Shield, Radar, Target, Crosshair, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const SatelliteMonitoring: React.FC = () => {
  const [activeSatellites, setActiveSatellites] = useState(4);
  const [scanning, setScanning] = useState(true);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3 uppercase italic neon-text">
            <Satellite className="w-10 h-10 text-cyber-blue" />
            Satellite Cyber-Surveillance
          </h1>
          <p className="text-slate-400 font-medium">Real-time orbital monitoring of cross-border data traffic and illicit server clusters.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-card px-4 py-2 border-cyber-blue/20 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Orbital Link: Stable</span>
          </div>
          <div className="glass-card px-4 py-2 border-cyber-pink/20 flex items-center gap-3">
            <Radar className="w-4 h-4 text-cyber-pink animate-spin" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Scanning...</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Viewport */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card aspect-video relative overflow-hidden border-cyber-blue/20">
            {/* Satellite Grid Overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
            <div className="absolute inset-0 grid grid-cols-8 grid-rows-6">
              {Array.from({ length: 48 }).map((_, i) => (
                <div key={i} className="border-[0.5px] border-white/5" />
              ))}
            </div>

            {/* Simulated Map View */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full bg-slate-900/50">
                {/* Scanning Beam */}
                <motion.div 
                  animate={{ top: ['0%', '100%', '0%'] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute left-0 right-0 h-px bg-cyber-blue shadow-[0_0_15px_rgba(0,242,255,1)] z-20"
                />
                
                {/* Targets */}
                {[
                  { x: '20%', y: '30%', label: 'IP_CLUSTER_ALPHA', risk: 'High' },
                  { x: '65%', y: '45%', label: 'DARK_NODE_77', risk: 'Critical' },
                  { x: '40%', y: '70%', label: 'PROXY_RELAY_B', risk: 'Medium' },
                  { x: '80%', y: '20%', label: 'BOTNET_C2', risk: 'Critical' },
                ].map((target, i) => (
                  <motion.div
                    key={i}
                    style={{ left: target.x, top: target.y }}
                    className="absolute -translate-x-1/2 -translate-y-1/2"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center animate-pulse",
                      target.risk === 'Critical' ? 'border-cyber-pink bg-cyber-pink/10' : 
                      target.risk === 'High' ? 'border-orange-500 bg-orange-500/10' : 'border-yellow-500 bg-yellow-500/10'
                    )}>
                      <Crosshair className="w-4 h-4 text-white" />
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 whitespace-nowrap">
                      <span className="text-[8px] font-mono text-white bg-black/80 px-1 py-0.5 rounded border border-white/10">
                        {target.label}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* HUD Elements */}
            <div className="absolute top-4 left-4 space-y-2">
              <div className="text-[10px] font-mono text-cyber-blue">LAT: 28.6139° N</div>
              <div className="text-[10px] font-mono text-cyber-blue">LON: 77.2090° E</div>
              <div className="text-[10px] font-mono text-cyber-blue">ALT: 35,786 KM</div>
            </div>

            <div className="absolute bottom-4 right-4 flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-[8px] text-slate-500 font-black uppercase">Signal Strength</span>
                <div className="flex gap-0.5 mt-1">
                  {[1, 2, 3, 4, 5].map(b => (
                    <div key={b} className={cn("w-1 h-3 rounded-full", b <= 4 ? "bg-cyber-blue" : "bg-white/10")} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-card p-6 border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyber-pink" />
                Anomalous Traffic Detected
              </h3>
              <div className="space-y-4">
                {[
                  { origin: 'Eastern Europe', target: 'Gov Cloud', type: 'DDoS Attempt', time: '0.4s ago' },
                  { origin: 'South East Asia', target: 'Fin-Net', type: 'SQL Injection', time: '1.2s ago' },
                ].map((alert, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-white">{alert.type}</p>
                      <p className="text-[10px] text-slate-500">{alert.origin} → {alert.target}</p>
                    </div>
                    <span className="text-[10px] font-mono text-cyber-pink">{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 border-white/5">
              <h3 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyber-blue" />
                Active Countermeasures
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Orbital Firewall</span>
                  <span className="text-xs font-bold text-emerald-500">ACTIVE</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-cyber-blue" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Signal Jamming</span>
                  <span className="text-xs font-bold text-slate-500">STANDBY</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[10%] h-full bg-cyber-pink" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          <div className="glass-card p-6 border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6">Satellite Array</h3>
            <div className="space-y-4">
              {['SAT-01 (POLAR)', 'SAT-02 (GEO)', 'SAT-03 (LEO)', 'SAT-04 (MEO)'].map((sat, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3">
                    <Satellite className="w-4 h-4 text-cyber-blue" />
                    <span className="text-xs font-bold text-white">{sat}</span>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 border-white/5">
            <h3 className="text-sm font-black uppercase tracking-widest mb-6">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="p-4 rounded-2xl bg-cyber-blue/10 border border-cyber-blue/20 flex flex-col items-center gap-2 hover:bg-cyber-blue/20 transition-all">
                <Radar className="w-6 h-6 text-cyber-blue" />
                <span className="text-[10px] font-black uppercase">Deep Scan</span>
              </button>
              <button className="p-4 rounded-2xl bg-cyber-pink/10 border border-cyber-pink/20 flex flex-col items-center gap-2 hover:bg-cyber-pink/20 transition-all">
                <Zap className="w-6 h-6 text-cyber-pink" />
                <span className="text-[10px] font-black uppercase">Intercept</span>
              </button>
              <button className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 hover:bg-white/10 transition-all">
                <Target className="w-6 h-6 text-white" />
                <span className="text-[10px] font-black uppercase">Lock On</span>
              </button>
              <button className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center gap-2 hover:bg-white/10 transition-all">
                <MapIcon className="w-6 h-6 text-white" />
                <span className="text-[10px] font-black uppercase">Relocate</span>
              </button>
            </div>
          </div>

          <div className="glass-card p-6 border-cyber-pink/20 bg-cyber-pink/5">
            <h3 className="text-sm font-black text-cyber-pink uppercase tracking-widest mb-2">Emergency Alert</h3>
            <p className="text-xs text-slate-400 mb-4">Unidentified orbital object detected in Sector 7G. Potential data exfiltration in progress.</p>
            <button className="w-full py-3 rounded-xl bg-cyber-pink text-white text-xs font-black uppercase tracking-widest shadow-[0_0_20px_rgba(255,0,128,0.4)]">
              Initiate Lockdown
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SatelliteMonitoring;
