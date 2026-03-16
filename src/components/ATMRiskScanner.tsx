import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Shield, AlertTriangle, MapPin, Activity, Database, RefreshCw, Info, CheckCircle, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { collection, query, onSnapshot, orderBy, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';
import { useUIStore } from '@/store/uiStore';

interface ATM {
  id: number;
  location: string;
  risk_score: number;
  last_incident: string;
  alert_level: string;
  latitude: number;
  longitude: number;
}

const ATMRiskScanner: React.FC = () => {
  const { t } = useTranslate();
  const { addNotification } = useUIStore();
  const [atms, setAtms] = useState<ATM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All');

  const seedData = async () => {
    const atms = [
      { location: 'Sector 4, Main Street', risk_score: 85, last_incident: '2026-03-10', alert_level: 'High', latitude: 12.9716, longitude: 77.5946 },
      { location: 'Tech Park, Phase 2', risk_score: 45, last_incident: '2026-02-15', alert_level: 'Medium', latitude: 12.9800, longitude: 77.6000 },
      { location: 'Central Mall, Gate 3', risk_score: 15, last_incident: '2026-01-05', alert_level: 'Low', latitude: 12.9900, longitude: 77.6100 },
    ];
    try {
      for (const atm of atms) {
        await addDoc(collection(db, 'atms'), atm);
      }
      addNotification('ATM data seeded', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'atms');
    }
  };

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'atms'), orderBy('risk_score', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const atmsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setAtms(atmsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'atms');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredATMs = atms.filter(atm => {
    const matchesSearch = atm.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'All' || atm.alert_level === filter;
    return matchesSearch && matchesFilter;
  });

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'High': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'Medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/30';
      case 'Low': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
      default: return 'text-[var(--text-secondary)] bg-[var(--bg-primary)] border-[var(--border-color)]';
    }
  };

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] neon-text">{t('atm_scanner')}</h1>
          <p className="text-[var(--text-secondary)] mt-1">Real-time risk assessment and predictive monitoring of ATM networks</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={seedData}
            className="px-4 py-2 rounded-xl bg-[var(--accent-color)] text-white font-bold text-xs uppercase tracking-widest hover:bg-[var(--accent-color)]/90 transition-colors"
          >
            Seed Data
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search ATM location..."
              className="cyber-input pl-11 w-80 bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => {}}
            className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--text-primary)]/10 transition-colors text-[var(--text-primary)]"
          >
            <RefreshCw className={cn("w-5 h-5 text-[var(--accent-color)]", loading && "animate-spin")} />
          </button>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1 bg-[var(--card-bg)] rounded-xl border border-[var(--border-color)] w-fit">
        {['All', 'High', 'Medium', 'Low'].map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={cn(
              "px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
              filter === l ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-secondary)] hover:bg-[var(--text-primary)]/5"
            )}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-color)]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredATMs.map((atm, i) => (
            <motion.div
              key={atm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="glass-card p-6 space-y-4 hover:border-[var(--accent-color)]/30 transition-all group border-[var(--border-color)] bg-[var(--card-bg)]"
            >
              <div className="flex justify-between items-start">
                <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] group-hover:border-[var(--accent-color)]/30 transition-all">
                  <MapPin className="w-6 h-6 text-[var(--accent-color)]" />
                </div>
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                  getAlertColor(atm.alert_level)
                )}>
                  {atm.alert_level} Alert
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)] truncate">{atm.location}</h3>
                <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest mt-1">
                  ID: ATM-{atm.id?.toString().padStart(5, '0') || '00000'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  <span>Risk Probability</span>
                  <span>{atm.risk_score}%</span>
                </div>
                <div className="h-1.5 bg-[var(--text-primary)]/10 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-1000",
                      atm.risk_score > 70 ? "bg-red-500" : atm.risk_score > 40 ? "bg-amber-500" : "bg-emerald-500"
                    )}
                    style={{ width: `${atm.risk_score}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Last Incident</p>
                  <p className="text-xs text-[var(--text-primary)] flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[var(--text-secondary)]" />
                    {new Date(atm.last_incident).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Status</p>
                  <p className="text-xs text-emerald-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Online
                  </p>
                </div>
              </div>

              <button className="w-full py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:bg-[var(--accent-color)] hover:text-white hover:border-[var(--accent-color)] transition-all">
                View Risk Profile
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ATMRiskScanner;
