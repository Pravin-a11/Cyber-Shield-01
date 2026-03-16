import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Brain, TrendingUp, Shield, AlertTriangle, Loader2, RefreshCw, BarChart3 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

const CrimePrediction: React.FC = () => {
  const { t } = useTranslate();
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'fraud_predictions'), orderBy('created_at', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          type: d.fraud_type,
          probability: (d.probability || 0) / 100,
          location: d.location,
          expected_time: d.expected_time,
          risk_level: d.risk_level
        };
      });
      setPredictions(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fraud_predictions');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchPredictions = () => {
    // onSnapshot handles updates
  };

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--text-primary)] uppercase flex items-center gap-3">
            <Brain className="w-10 h-10 text-[var(--accent-color)]" />
            {t('ai_crime_prediction_engine')}
          </h1>
          <p className="text-[var(--text-secondary)] mt-1">{t('predictive_analytics_desc')}</p>
        </div>
        
        <button 
          onClick={fetchPredictions}
          className="p-3 rounded-xl bg-[var(--card-bg)] border border-[var(--border-color)] hover:bg-[var(--border-color)] transition-colors text-[var(--text-primary)]"
        >
          <RefreshCw className={cn("w-5 h-5 text-[var(--accent-color)]", loading && "animate-spin")} />
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Probability Chart */}
        <div className="lg:col-span-2 glass-card p-8 border-[var(--border-color)] bg-[var(--card-bg)] min-h-[400px]">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2 uppercase tracking-widest text-[var(--text-primary)]">
            <BarChart3 className="w-5 h-5 text-[var(--accent-color)]" />
            {t('attack_probability_by_type')}
          </h3>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={predictions}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="type" 
                  stroke="var(--text-secondary)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: 'var(--text-secondary)', fontWeight: 'bold' }}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                  tick={{ fill: 'var(--text-secondary)' }}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--accent-color)', opacity: 0.1 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card-bg)', 
                    border: '1px solid var(--border-color)',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: 'var(--text-primary)'
                  }}
                  itemStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                  {predictions.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.probability > 0.8 ? '#ef4444' : 'var(--accent-color)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hotspots */}
        <div className="glass-card p-8 border-[var(--border-color)] bg-[var(--card-bg)]">
          <h3 className="text-lg font-bold mb-8 flex items-center gap-2 uppercase tracking-widest text-[var(--text-primary)]">
            <TrendingUp className="w-5 h-5 text-[var(--accent-color)]" />
            {t('predicted_hotspots')}
          </h3>
          
          <div className="space-y-6">
            {predictions.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-4 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-[var(--text-primary)]">{p.location}</h4>
                    <p className="text-[10px] text-[var(--text-secondary)] uppercase font-black tracking-widest">{p.type}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border",
                    p.probability > 0.8 ? "bg-red-500/10 border-red-500/30 text-red-500" : "bg-[var(--accent-color)]/10 border-[var(--accent-color)]/30 text-[var(--accent-color)]"
                  )}>
                    {(p.probability * 100).toFixed(0)}% PROB
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)]">
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  Timeframe: <span className="text-[var(--text-primary)] font-bold">{p.timeframe}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-6 border-emerald-500/20 bg-emerald-500/5">
          <h3 className="font-bold text-emerald-500 mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
            <Shield className="w-4 h-4" />
            {t('preventive_strategy')}
          </h3>
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
            {t('preventive_strategy_desc')}
            <span className="text-emerald-500 font-bold block mt-2">{t('recommended_action_strategy')}</span>
          </p>
        </div>
        
        <div className="glass-card p-6 border-[var(--border-color)] bg-[var(--accent-color)]/5">
          <h3 className="font-bold text-[var(--accent-color)] mb-4 flex items-center gap-2 uppercase tracking-widest text-sm">
            <Brain className="w-4 h-4" />
            {t('model_confidence')}
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
              <span className="text-[var(--text-secondary)]">{t('training_accuracy')}</span>
              <span className="text-[var(--accent-color)]">94.2%</span>
            </div>
            <div className="h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent-color)] w-[94.2%]" />
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] italic">
              {t('model_update_info')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrimePrediction;
