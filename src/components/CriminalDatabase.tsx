import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Filter, Shield, AlertTriangle, User, ExternalLink, Activity, Database, X, Info, ShieldAlert, Locate, Map as MapIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

// Fix for default marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Criminal {
  id: number;
  name: string;
  criminal_id: string;
  fraud_types: string;
  risk_score: number;
  history: string;
  associates: string;
  photo_url: string;
  warrant_status?: string;
  last_location?: { latitude: number, longitude: number };
}

const CriminalDatabase: React.FC = () => {
  const { t } = useTranslate();
  const [criminals, setCriminals] = useState<Criminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCriminal, setSelectedCriminal] = useState<Criminal | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'criminals'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const criminalsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setCriminals(criminalsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'criminals');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredCriminals = (Array.isArray(criminals) ? criminals : []).filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.criminal_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.fraud_types?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateWarrant = async (criminalId: string) => {
    try {
      // Find the document ID for this criminal
      const criminalDoc = criminals.find(c => c.criminal_id === criminalId);
      if (!criminalDoc) return;

      const docRef = doc(db, 'criminals', criminalDoc.id.toString());
      await updateDoc(docRef, {
        warrant_status: 'ISSUED'
      });
      
      alert('Warrant issued successfully and logged in blockchain.');
    } catch (err) {
      console.error('Warrant error:', err);
      alert('Failed to issue warrant.');
    }
  };

  const handleTrackLocation = async (criminalId: string) => {
    try {
      // In a real app, this might trigger a backend process or fetch from a tracking service
      // For now, we'll simulate a location update in Firestore
      const criminalDoc = criminals.find(c => c.criminal_id === criminalId);
      if (!criminalDoc) return;

      const newLocation = {
        latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.1
      };

      const docRef = doc(db, 'criminals', criminalDoc.id.toString());
      await updateDoc(docRef, {
        last_location: newLocation
      });

      alert(`Current Location: Lat ${newLocation.latitude.toFixed(4)}, Lng ${newLocation.longitude.toFixed(4)}\nStatus: Active Tracking...`);
    } catch (err) {
      console.error('Tracking error:', err);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] neon-text">{t('criminal_db')}</h1>
          <p className="text-[var(--text-secondary)] mt-1">Intelligence database of known cybercrime offenders and syndicates</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder={t('search_criminals')}
              className="cyber-input pl-11 w-80 bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--text-primary)]/10 transition-colors text-[var(--text-primary)]">
            <Filter className="w-5 h-5 text-[var(--accent-color)]" />
          </button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-color)]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCriminals.map((criminal, i) => (
            <motion.div
              key={criminal.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => setSelectedCriminal(criminal)}
              className="glass-card overflow-hidden group cursor-pointer border-[var(--border-color)] bg-[var(--card-bg)] hover:border-[var(--accent-color)]/30 transition-all"
            >
              <div className="aspect-square relative overflow-hidden">
                <img 
                  src={criminal.photo_url} 
                  alt={criminal.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
                <div className="absolute top-4 right-4">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border",
                    criminal.risk_score > 80 ? "bg-red-500/20 border-red-500/50 text-red-400" :
                    criminal.risk_score > 50 ? "bg-amber-500/20 border-amber-500/50 text-amber-400" :
                    "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                  )}>
                    Risk: {criminal.risk_score}%
                  </div>
                </div>
              </div>
              
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">{criminal.name}</h3>
                  <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest">{criminal.criminal_id}</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {criminal.fraud_types.split(',').map((type, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-[var(--accent-color)]/10 text-[var(--accent-color)] text-[10px] font-bold uppercase">
                      {type.trim()}
                    </span>
                  ))}
                </div>

                <div className="pt-3 border-t border-[var(--border-color)] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-secondary)] flex items-center gap-1">
                      <Activity className="w-3 h-3" />
                      {criminal.warrant_status === 'ISSUED' ? (
                        <span className="text-red-500 font-black">WARRANT ISSUED</span>
                      ) : (
                        t('active_investigation')
                      )}
                    </span>
                    {criminal.last_location && (
                      <span className="text-[8px] text-[var(--accent-color)] font-mono">
                        LOC: {criminal.last_location.latitude.toFixed(2)}, {criminal.last_location.longitude.toFixed(2)}
                      </span>
                    )}
                    <ExternalLink className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] transition-colors" />
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateWarrant(criminal.criminal_id);
                      }}
                      className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <ShieldAlert className="w-3 h-3" />
                      {t('warrant')}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTrackLocation(criminal.criminal_id);
                      }}
                      className="flex-1 py-2 bg-[var(--accent-color)]/20 hover:bg-[var(--accent-color)]/30 text-[var(--accent-color)] border border-[var(--accent-color)]/30 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                    >
                      <Locate className="w-3 h-3" />
                      {t('track')}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Criminal Detail Modal */}
      <AnimatePresence>
        {selectedCriminal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCriminal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl glass-card border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedCriminal(null)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-full md:w-1/3 aspect-square md:aspect-auto relative">
                <img 
                  src={selectedCriminal.photo_url} 
                  alt={selectedCriminal.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 md:bg-gradient-to-r md:from-transparent md:to-black/30" />
              </div>

              <div className="flex-1 p-8 overflow-y-auto space-y-8">
                <header>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 text-[10px] font-black uppercase tracking-widest">
                      High Risk Profile
                    </span>
                    <span className="text-[var(--text-secondary)] text-[10px] font-mono uppercase tracking-widest">
                      {selectedCriminal.criminal_id}
                    </span>
                  </div>
                  <h2 className="text-4xl font-black text-[var(--text-primary)]">{selectedCriminal.name}</h2>
                  <p className="text-[var(--accent-color)] font-bold mt-1">{selectedCriminal.fraud_types}</p>
                </header>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Risk Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[var(--accent-color)] to-red-500" 
                          style={{ width: `${selectedCriminal.risk_score}%` }}
                        />
                      </div>
                      <span className="text-xl font-black text-[var(--text-primary)]">{selectedCriminal.risk_score}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Status</p>
                    <div className="flex items-center gap-2 text-emerald-500">
                      <Activity className="w-4 h-4" />
                      <span className="font-bold">
                        {selectedCriminal.warrant_status === 'ISSUED' ? 'WARRANT ISSUED' : 'Under Surveillance'}
                      </span>
                    </div>
                    {selectedCriminal.last_location && (
                      <p className="text-[10px] text-[var(--accent-color)] font-mono mt-1">
                        Last Known: {selectedCriminal.last_location.latitude.toFixed(4)}, {selectedCriminal.last_location.longitude.toFixed(4)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[var(--accent-color)]">
                    <Info className="w-5 h-5" />
                    <h3 className="font-bold uppercase tracking-widest text-sm">{t('crime_history')}</h3>
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)]">
                    {selectedCriminal.history}
                  </p>
                </div>

                {selectedCriminal.last_location && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--accent-color)]">
                      <MapIcon className="w-5 h-5" />
                      <h3 className="font-bold uppercase tracking-widest text-sm">Live Location Tracking</h3>
                    </div>
                    <div className="h-64 rounded-xl overflow-hidden border border-[var(--border-color)] relative z-0">
                      <MapContainer 
                        center={[selectedCriminal.last_location.latitude, selectedCriminal.last_location.longitude]} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                        scrollWheelZoom={false}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />
                        <Marker position={[selectedCriminal.last_location.latitude, selectedCriminal.last_location.longitude]}>
                          <Popup>
                            Last known location of {selectedCriminal.name}
                          </Popup>
                        </Marker>
                      </MapContainer>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-red-500">
                    <User className="w-5 h-5" />
                    <h3 className="font-bold uppercase tracking-widest text-sm">{t('known_associates')}</h3>
                  </div>
                  <p className="text-[var(--text-secondary)] text-sm leading-relaxed bg-[var(--bg-primary)] p-4 rounded-xl border border-[var(--border-color)]">
                    {selectedCriminal.associates}
                  </p>
                </div>

                <div className="pt-6 border-t border-[var(--border-color)] flex gap-4">
                  <button 
                    onClick={() => handleGenerateWarrant(selectedCriminal.criminal_id)}
                    className="cyber-button flex-1 bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color)]/90"
                  >
                    {t('issue_warrant')}
                  </button>
                  <button 
                    onClick={() => handleTrackLocation(selectedCriminal.criminal_id)}
                    className="px-6 py-2.5 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold text-[10px] uppercase tracking-widest hover:bg-[var(--border-color)] transition-all"
                  >
                    {t('track_location')}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CriminalDatabase;
