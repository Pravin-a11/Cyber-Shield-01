import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, Legend 
} from 'recharts';
import { useTranslate } from '@/hooks/useTranslate';
import { useAuthStore } from '@/store/authStore';
import { Activity, TrendingUp, Shield, AlertTriangle, PieChart as PieIcon, BarChart3, Globe } from 'lucide-react';
import { formatCurrency, cn } from '@/lib/utils';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

const COLORS = ['#00f2ff', '#ff00ff', '#eab308', '#ef4444', '#10b981', '#6366f1'];

const FraudAnalytics: React.FC = () => {
  const { t } = useTranslate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'system_meta', 'analytics'), (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data());
      } else {
        // Fallback to mock data if doc doesn't exist
        setData({
          total_volume: 12500000,
          avg_loss: 45000,
          recovery_rate: 24.5,
          high_risk_nodes: 142
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_meta/analytics');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyber-blue"></div>
      </div>
    );
  }

  // Mock data for charts since /api/stats might be basic
  const fraudByType = [
    { name: 'Phishing', value: 4500 },
    { name: 'UPI Fraud', value: 3200 },
    { name: 'OTP Scam', value: 2800 },
    { name: 'Investment', value: 2100 },
    { name: 'Loan Fraud', value: 1500 },
    { name: 'ATM Skim', value: 900 },
  ];

  const monthlyTrend = [
    { month: 'Jan', amount: 450000 },
    { month: 'Feb', amount: 520000 },
    { month: 'Mar', amount: 480000 },
    { month: 'Apr', amount: 610000 },
    { month: 'May', amount: 550000 },
    { month: 'Jun', amount: 670000 },
  ];

  const fraudByLocation = [
    { name: 'Mumbai', value: 1200 },
    { name: 'Delhi', value: 950 },
    { name: 'Bangalore', value: 800 },
    { name: 'Hyderabad', value: 600 },
    { name: 'Chennai', value: 550 },
  ];

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight neon-text">{t('analytics')}</h1>
        <p className="text-slate-400 mt-1">Deep intelligence and trend analysis of cybercrime patterns</p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Total Fraud Volume', value: formatCurrency(12500000), icon: TrendingUp, color: 'text-cyber-blue' },
          { label: 'Avg. Loss per Incident', value: formatCurrency(45000), icon: Activity, color: 'text-cyber-pink' },
          { label: 'Recovery Rate', value: '24.5%', icon: Shield, color: 'text-emerald-400' },
          { label: 'High Risk Nodes', value: '142', icon: AlertTriangle, color: 'text-amber-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-white/5 border border-white/10 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-2xl font-black mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fraud Type Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-8">
            <PieIcon className="w-5 h-5 text-cyber-blue" />
            <h3 className="text-lg font-bold">Fraud Type Distribution</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fraudByType}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {fraudByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0b1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Monthly Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-5 h-5 text-cyber-pink" />
            <h3 className="text-lg font-bold">Monthly Fraud Volume Trend</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff00ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ff00ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0b1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#ff00ff" fillOpacity={1} fill="url(#colorAmt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Fraud by Location */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-8">
            <Globe className="w-5 h-5 text-cyber-blue" />
            <h3 className="text-lg font-bold">Top Fraud Hotspots</h3>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fraudByLocation} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0b1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                />
                <Bar dataKey="value" fill="#00f2ff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Risk Level Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
          <div className="flex items-center gap-3 mb-8">
            <Shield className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold">Intelligence Insights</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'UPI Fraud Spike', desc: '12% increase in Chennai area over last 48h', risk: 'High' },
              { label: 'New Phishing Vector', desc: 'Fake banking apps targeting SBI customers', risk: 'Critical' },
              { label: 'ATM Skimming Alert', desc: 'Suspicious activity detected in Mumbai North', risk: 'Medium' },
              { label: 'Recovery Success', desc: '₹4.2L recovered from fraudulent account in Delhi', risk: 'Success' },
            ].map((insight, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">{insight.label}</h4>
                  <p className="text-xs text-slate-500 mt-1">{insight.desc}</p>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter",
                  insight.risk === 'High' || insight.risk === 'Critical' ? "bg-red-500/20 text-red-400" : 
                  insight.risk === 'Success' ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                )}>
                  {insight.risk}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FraudAnalytics;
