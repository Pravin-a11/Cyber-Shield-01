import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MapContainer, TileLayer, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Shield, AlertTriangle, MapPin, Filter, Loader2, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import GlassPanel from './GlassPanel';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

// Global dataset of cybercrime incidents
const CYBERCRIME_DATA = [
  { country: 'USA', city: 'New York', latitude: 40.7128, longitude: -74.0060, fraud_type: 'Phishing', risk_level: 'critical', cases: 1240 },
  { country: 'USA', city: 'Los Angeles', latitude: 34.0522, longitude: -118.2437, fraud_type: 'Identity Theft', risk_level: 'medium', cases: 850 },
  { country: 'UK', city: 'London', latitude: 51.5074, longitude: -0.1278, fraud_type: 'Investment Fraud', risk_level: 'critical', cases: 2100 },
  { country: 'France', city: 'Paris', latitude: 48.8566, longitude: 2.3522, fraud_type: 'Phishing', risk_level: 'medium', cases: 640 },
  { country: 'Germany', city: 'Berlin', latitude: 52.5200, longitude: 13.4050, fraud_type: 'Identity Theft', risk_level: 'low', cases: 320 },
  { country: 'Japan', city: 'Tokyo', latitude: 35.6762, longitude: 139.6503, fraud_type: 'Identity Theft', risk_level: 'critical', cases: 1560 },
  { country: 'Australia', city: 'Sydney', latitude: -33.8688, longitude: 151.2093, fraud_type: 'Banking Fraud', risk_level: 'medium', cases: 720 },
  { country: 'Brazil', city: 'São Paulo', latitude: -23.5505, longitude: -46.6333, fraud_type: 'Phishing', risk_level: 'critical', cases: 1890 },
  { country: 'South Africa', city: 'Johannesburg', latitude: -26.2041, longitude: 28.0473, fraud_type: 'Identity Theft', risk_level: 'medium', cases: 540 },
  { country: 'India', city: 'Mumbai', latitude: 19.0760, longitude: 72.8777, fraud_type: 'UPI Fraud', risk_level: 'critical', cases: 3450 },
  { country: 'India', city: 'Delhi', latitude: 28.6139, longitude: 77.2090, fraud_type: 'ATM Skimming', risk_level: 'critical', cases: 2890 },
  { country: 'Singapore', city: 'Singapore City', latitude: 1.3521, longitude: 103.8198, fraud_type: 'Banking Fraud', risk_level: 'medium', cases: 410 },
  { country: 'Canada', city: 'Toronto', latitude: 43.6532, longitude: -79.3832, fraud_type: 'Identity Theft', risk_level: 'medium', cases: 670 },
  { country: 'UAE', city: 'Dubai', latitude: 25.2048, longitude: 55.2708, fraud_type: 'Crypto Scams', risk_level: 'critical', cases: 1120 },
  { country: 'Switzerland', city: 'Zurich', latitude: 47.3769, longitude: 8.5417, fraud_type: 'None', risk_level: 'safe', cases: 12 },
  { country: 'Norway', city: 'Oslo', latitude: 59.9139, longitude: 10.7522, fraud_type: 'None', risk_level: 'safe', cases: 8 },
];

const RiskHeatmap: React.FC = () => {
  const { t } = useTranslate();
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [crimes, setCrimes] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(collection(db, 'crime_locations'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCrimes(data.length > 0 ? data : CYBERCRIME_DATA);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'crime_locations');
      setCrimes(CYBERCRIME_DATA);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRiskColor = (risk: string) => {
    const r = risk?.toLowerCase() || 'low';
    switch (r) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#facc15';
      case 'low': return '#10b981';
      case 'safe': return '#3b82f6';
      default: return '#10b981';
    }
  };

  const filteredCrimes = crimes.filter(crime => 
    filter === 'all' || crime.risk_level?.toLowerCase() === filter.toLowerCase()
  );

  return (
    <div className="p-8 space-y-8 h-full flex flex-col min-h-screen relative">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight neon-text uppercase italic">{t('heatmap')}</h1>
          <p className="text-slate-400 mt-1">{t('heatmap_desc')}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-4 bg-black/40 px-4 py-2 rounded-xl border border-white/10 backdrop-blur-md">
            {['critical', 'high', 'medium', 'low', 'safe'].map(level => (
              <div key={level} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: getRiskColor(level) }} />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t(level)}</span>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-[600px] rounded-2xl overflow-hidden relative border border-white/10">
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          style={{ height: '600px', width: '100%', background: 'transparent' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
          />
          {filteredCrimes.map((crime, i) => (
            <Circle
              key={i}
              center={[crime.latitude, crime.longitude]}
              radius={crime.risk_level === 'critical' ? 120000 : (crime.risk_level === 'high' ? 90000 : 60000)}
              pathOptions={{
                fillColor: getRiskColor(crime.risk_level),
                color: getRiskColor(crime.risk_level),
                weight: 2,
                fillOpacity: 0.6,
              }}
            >
              <Popup className="cyber-popup">
                <div className="p-3 min-w-[180px] bg-slate-900 text-white rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-black text-lg uppercase tracking-tighter italic">{crime.city}</h4>
                    <span className={cn(
                      "text-[8px] px-2 py-0.5 rounded font-black uppercase tracking-widest",
                      crime.risk_level === 'critical' ? "bg-red-500/20 text-red-500" : 
                      crime.risk_level === 'high' ? "bg-amber-500/20 text-amber-500" :
                      crime.risk_level === 'medium' ? "bg-yellow-500/20 text-yellow-500" :
                      crime.risk_level === 'low' ? "bg-emerald-500/20 text-emerald-500" :
                      "bg-blue-500/20 text-blue-500"
                    )}>
                      {t(crime.risk_level)}
                    </span>
                  </div>
                  <div className="space-y-1 text-xs text-slate-300">
                    <p className="flex justify-between"><span>{t('country')}:</span> <span className="font-bold text-white">{crime.country}</span></p>
                    <p className="flex justify-between"><span>{t('fraud_type')}:</span> <span className="font-bold text-white">{crime.fraud_type}</span></p>
                    <p className="flex justify-between"><span>{t('cases')}:</span> <span className="font-bold text-cyber-blue">{crime.cases.toLocaleString()}</span></p>
                  </div>
                </div>
              </Popup>
            </Circle>
          ))}
        </MapContainer>

        {/* Overlay Controls using GlassPanel */}
        <GlassPanel className="absolute top-6 right-6 z-[1000] p-4 w-64">
          <h4 className="text-xs font-bold mb-4 flex items-center gap-2 uppercase tracking-widest">
            <Filter className="w-4 h-4 text-cyber-blue" />
            {t('risk_threshold')}
          </h4>
          <div className="space-y-2">
            {['All', 'Critical', 'High', 'Medium', 'Low', 'Safe'].map((t_key) => (
              <button
                key={t_key}
                onClick={() => setFilter(t_key.toLowerCase())}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                  filter === t_key.toLowerCase() ? "bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20" : "hover:bg-white/5 text-slate-400"
                )}
              >
                {t(t_key.toLowerCase())}
              </button>
            ))}
          </div>
        </GlassPanel>
      </div>
    </div>
  );
};

export default RiskHeatmap;
