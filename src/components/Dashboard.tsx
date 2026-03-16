import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Shield, AlertTriangle, CheckCircle, TrendingUp, TrendingDown, 
  Clock, MapPin, Bell, Zap, Globe, Radar, List, MessageSquare, Radio,
  ArrowUpRight, ArrowDownRight, Brain, Target, ShieldCheck, Loader2
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar 
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslate } from '@/hooks/useTranslate';
import { formatCurrency, cn } from '@/lib/utils';
import CyberGlobe from './CyberGlobe';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

const AnimatedCounter: React.FC<{ value: number; prefix?: string; suffix?: string }> = ({ value, prefix = '', suffix = '' }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 2000;
    const increment = end / (duration / 16);
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayValue(end);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, 16);
    
    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{displayValue.toLocaleString()}{suffix}</span>;
};

const Dashboard: React.FC = () => {
  const { language } = useUIStore();
  const { t } = useTranslate();

  const [stats, setStats] = useState<any>({
    totalComplaints: 0,
    totalAmount: 0,
    highRiskAlerts: 0,
    activeInvestigations: 0,
    preventionRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [trendRange, setTrendRange] = useState<'24h' | '7d'>('24h');
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    setLoading(true);
    
    // Real-time stats from a summary document
    const statsUnsubscribe = onSnapshot(doc(db, 'system_meta', 'dashboard_stats'), (docSnap) => {
      if (docSnap.exists()) {
        setStats(docSnap.data());
      } else {
        // Fallback to demo data if not initialized
        setStats({
          totalComplaints: 12847,
          totalAmount: 87000000,
          highRiskAlerts: 328,
          activeInvestigations: 1206,
          preventionRate: 94.2
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_meta/dashboard_stats');
      setLoading(false);
    });

    // Real-time predictions
    const predictionsUnsubscribe = onSnapshot(collection(db, 'fraud_predictions'), (snapshot) => {
      const preds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPredictions(preds);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'fraud_predictions');
    });

    return () => {
      statsUnsubscribe();
      predictionsUnsubscribe();
    };
  }, []);

  const trendData = useMemo(() => {
    if (trendRange === '24h') {
      return [
        { name: '00:00', value: 420 }, { name: '04:00', value: 310 },
        { name: '08:00', value: 650 }, { name: '12:00', value: 890 },
        { name: '16:00', value: 540 }, { name: '20:00', value: 980 },
        { name: '23:59', value: 720 },
      ];
    }
    return [
      { name: 'Mon', value: 2400 }, { name: 'Tue', value: 1398 },
      { name: 'Wed', value: 9800 }, { name: 'Thu', value: 3908 },
      { name: 'Fri', value: 4800 }, { name: 'Sat', value: 3800 },
      { name: 'Sun', value: 4300 },
    ];
  }, [trendRange]);

  const hotspots = [
    { city: 'Mumbai', count: 1240, risk: 'High' },
    { city: 'Delhi', count: 980, risk: 'High' },
    { city: 'Chennai', count: 750, risk: 'Medium' },
    { city: 'Bangalore', count: 620, risk: 'Medium' },
    { city: 'Hyderabad', count: 430, risk: 'Low' },
  ];

  const insights = [
    { text: t('insight_1'), type: "warning" },
    { text: t('insight_2'), type: "error" },
    { text: t('insight_3'), type: "warning" },
    { text: t('insight_4'), type: "error" },
  ];

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
      <div className="w-16 h-16 border-4 border-[var(--accent-color)]/20 border-t-[var(--accent-color)] rounded-full animate-spin" />
      <p className="text-[var(--accent-color)] font-mono animate-pulse uppercase tracking-[0.2em]">{t('initializing_core')}</p>
    </div>
  );

  return (
    <div className="p-6 lg:p-10 space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase italic">
            <span className="text-[var(--text-secondary)]">Cyber</span>
            <span className="neon-text text-[var(--accent-color)]">Shield</span>
            <span className="text-[var(--text-secondary)]">.</span>
            <span className="text-red-500">Omega</span>
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
            {t('command_center')}
          </p>
        </motion.div>

          <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('system_status')}</span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-widest">{t('operational')}</span>
            </div>
          </div>
          <div className="h-10 w-px bg-[var(--border-color)] mx-2" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{t('threat_level')}</span>
            <span className="text-xs font-bold text-red-500 uppercase tracking-widest">{t('elevated')}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {[
          { label: t('total_complaints'), value: stats?.totalComplaints || 0, icon: Activity, color: 'text-[var(--accent-color)]', bg: 'bg-[var(--accent-color)]/10', suffix: '' },
          { label: t('fraud_detected'), value: stats?.totalAmount || 0, icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10', prefix: '₹', suffix: '' },
          { label: t('high_risk_alerts'), value: stats?.highRiskAlerts || 142, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', suffix: '' },
          { label: t('active_investigations'), value: stats?.activeInvestigations || 84, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-500/10', suffix: '' },
          { label: t('prevention_rate'), value: stats?.preventionRate || 94.2, icon: CheckCircle, color: 'text-cyan-500', bg: 'bg-cyan-500/10', suffix: '%' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 group hover:border-[var(--accent-color)]/30 transition-all relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <stat.icon className={cn("w-24 h-24", stat.color)} />
            </div>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div className="flex flex-col items-end">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] text-emerald-500 font-bold">+12%</span>
              </div>
            </div>
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black tracking-tight text-[var(--text-primary)]">
              <AnimatedCounter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
            </h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cyber Globe & Radar */}
        <div className="lg:col-span-2 space-y-8">
          {/* AI Fraud Prediction Module */}
          <div className="glass-card p-8 border-[var(--border-color)] bg-[var(--card-bg)] relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-color)]/10 border border-[var(--accent-color)]/30">
                <Brain className="w-4 h-4 text-[var(--accent-color)]" />
                <span className="text-[10px] font-black text-[var(--accent-color)] uppercase tracking-widest">AI  Active</span>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-2xl font-black flex items-center gap-3 uppercase tracking-tighter italic text-[var(--text-primary)]">
                <Target className="w-8 h-8 text-[var(--accent-color)]" />
                {t('fraud_hotspot_prediction')}
              </h3>
              <p className="text-[var(--text-secondary)] text-sm mt-1">{t('ai_analysis_desc')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {predictions.length > 0 ? predictions.map((pred, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="glass-card p-4 hover:border-[var(--accent-color)]/30 transition-all group"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2 rounded-lg bg-[var(--accent-color)]/10 text-[var(--accent-color)]">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className={cn(
                      "text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest",
                      pred.probability > 80 ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                    )}>
                      {pred.probability}% Prob.
                    </span>
                  </div>
                  <h4 className="font-bold text-[var(--text-primary)] mb-1">{pred.location}</h4>
                  <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-3">{pred.fraud_type}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--border-color)]">
                    <span className="text-[9px] text-[var(--text-secondary)] italic">{t('expected')}: {pred.expected_time}</span>
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full py-10 text-center">
                  <Loader2 className="w-8 h-8 text-[var(--accent-color)] animate-spin mx-auto mb-4" />
                  <p className="text-[var(--text-secondary)] font-mono text-xs uppercase tracking-widest">{t('analyzing_patterns')}</p>
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-8 h-[500px] relative overflow-hidden bg-[var(--card-bg)] border-[var(--border-color)]">
            <div className="absolute top-8 left-8 z-10">
              <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-tighter text-[var(--text-primary)]">
                <Globe className="w-6 h-6 text-[var(--accent-color)]" />
                {t('global_threat_matrix')}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">{t('real_time_visualization')}</p>
            </div>
            <div className="absolute inset-0">
              <CyberGlobe />
            </div>
            
            {/* Radar Overlay */}
            <div className="absolute bottom-8 right-8 w-48 h-48 rounded-full border border-[var(--accent-color)]/20 bg-[var(--accent-color)]/5 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <Radar className="w-8 h-8 text-[var(--accent-color)]/40" />
              </div>
              <div className="absolute inset-0 border-2 border-[var(--accent-color)]/20 rounded-full animate-ping opacity-20" />
              <div className="absolute top-1/2 left-1/2 w-full h-0.5 bg-[var(--accent-color)]/40 origin-left animate-[spin_4s_linear_infinite]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse" style={{ transform: 'translate(40px, -30px)' }} />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] animate-pulse" style={{ transform: 'translate(-20px, 40px)' }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* AI Fraud Insight Panel */}
            <div className="glass-card p-6 bg-[var(--card-bg)] border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-[var(--text-primary)]">
                  <MessageSquare className="w-4 h-4 text-red-500" />
                  {t('ai_fraud_insights')}
                </h3>
                <span className="text-[10px] font-mono text-[var(--text-secondary)]">{t('live_analysis')}</span>
              </div>
              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                    <div className={cn(
                      "w-1 h-full rounded-full shrink-0",
                      insight.type === 'error' ? "bg-red-500" : "bg-amber-500"
                    )} />
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">{insight.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Fraud Hotspot Ranking */}
            <div className="glass-card p-6 bg-[var(--card-bg)] border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-[var(--text-primary)]">
                  <List className="w-4 h-4 text-[var(--accent-color)]" />
                  {t('fraud_hotspot_ranking')}
                </h3>
              </div>
              <div className="space-y-4">
                {hotspots.map((hotspot, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-[var(--text-secondary)] w-4">{i + 1}</span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{hotspot.city}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-mono text-[var(--accent-color)]">{hotspot.count}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                        hotspot.risk === 'High' ? "bg-red-500/10 text-red-500" : "bg-amber-500/10 text-amber-500"
                      )}>
                        {hotspot.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Intelligence */}
        <div className="space-y-8">
          {/* Live Cybercrime Feed */}
          <div className="glass-card p-6 flex flex-col h-[400px] bg-[var(--card-bg)] border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-[var(--text-primary)]">
                <Radio className="w-4 h-4 text-red-500 animate-pulse" />
                {t('live_cybercrime_feed')}
              </h3>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <div className="absolute inset-0 space-y-4 animate-[scroll_20s_linear_infinite]">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-[var(--accent-color)] uppercase">Alert #{1000 + i}</span>
                      <span className="text-[9px] text-[var(--text-secondary)] font-mono">2m ago</span>
                    </div>
                    <p className="text-[11px] text-[var(--text-secondary)] leading-tight">
                      {t('feed_alert')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[var(--card-bg)] to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Threat Radar Chart */}
          <div className="glass-card p-6 bg-[var(--card-bg)] border-[var(--border-color)]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-[var(--text-primary)]">
                <Radar className="w-4 h-4 text-[var(--accent-color)]" />
                {t('cyber_threat_radar')}
              </h3>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-color)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-color)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="value" stroke="var(--accent-color)" fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <div className="text-center">
                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">{t('peak_load')}</p>
                <p className="text-sm font-black text-[var(--text-primary)]">942 req/s</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">{t('latency')}</p>
                <p className="text-sm font-black text-emerald-500">12ms</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase">{t('uptime')}</p>
                <p className="text-sm font-black text-[var(--text-primary)]">99.99%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
