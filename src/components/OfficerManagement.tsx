import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, UserPlus, UserMinus, Shield, BadgeCheck, 
  Search, Filter, MoreVertical, Mail, Phone, 
  Briefcase, Calendar, Award, TrendingUp,
  ChevronRight, X, Loader2, CheckCircle, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import GlassPanel from './GlassPanel';
import { collection, query, onSnapshot, doc, addDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

interface Officer {
  id: number;
  name: string;
  email: string;
  role: string;
  rank: string;
  department: string;
  phone: string;
  profile_photo: string;
  success_rate: number;
  cases_solved: number;
  cases_pending: number;
  recovered_amount: number;
}

const OfficerManagement: React.FC = () => {
  const { t } = useTranslate();
  const { user } = useAuthStore();
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOfficer, setSelectedOfficer] = useState<Officer | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newOfficer, setNewOfficer] = useState({ name: '', email: '', rank: 'Investigation Officer', department: 'Cyber Crime Unit', phone: '' });
  const [officerStats, setOfficerStats] = useState<any>(null);
  const [officerToDelete, setOfficerToDelete] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'officers'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const officersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setOfficers(officersData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'officers');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const fetchOfficerStats = async (id: string) => {
    try {
      // In a real app, stats might be in a subcollection or separate collection
      // For now, we'll try to fetch from an 'officer_stats' collection
      const statsDoc = await getDoc(doc(db, 'officer_stats', id));
      if (statsDoc.exists()) {
        setOfficerStats(statsDoc.data());
      } else {
        // Fallback/Mock stats if not found in Firestore yet
        setOfficerStats({
          activity: [
            { month: 'Jan', cases: 12 },
            { month: 'Feb', cases: 19 },
            { month: 'Mar', cases: 15 },
            { month: 'Apr', cases: 22 },
            { month: 'May', cases: 30 },
            { month: 'Jun', cases: 25 },
          ]
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'officer_stats');
    }
  };

  const handleAddOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'officers'), {
        ...newOfficer,
        profile_photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newOfficer.name}`,
        success_rate: 0,
        cases_solved: 0,
        cases_pending: 0,
        recovered_amount: 0,
        role: 'officer'
      });
      setIsAddModalOpen(false);
      setNewOfficer({ name: '', email: '', rank: 'Investigation Officer', department: 'Cyber Crime Unit', phone: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'officers');
    }
  };

  const handleDeleteOfficer = async (id: string) => {
    setOfficerToDelete(id);
  };

  const confirmDeleteOfficer = async () => {
    if (!officerToDelete) return;
    try {
      await deleteDoc(doc(db, 'officers', officerToDelete));
      if (selectedOfficer?.id === officerToDelete) setSelectedOfficer(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'officers');
    } finally {
      setOfficerToDelete(null);
    }
  };

  const filteredOfficers = officers.filter(o => 
    o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.rank.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight neon-text uppercase italic flex items-center gap-3">
            <Users className="w-10 h-10 text-cyber-blue" />
            {t('officer_management')}
          </h1>
          <p className="text-slate-400 mt-1">Manage departmental hierarchy, permissions, and performance metrics.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="Search officers..."
              className="cyber-input pl-11 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {user?.rank === 'Chief Officer' && (
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="cyber-button-primary flex items-center gap-2 px-6"
            >
              <UserPlus className="w-5 h-5" />
              Add Officer
            </button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-12 h-12 text-cyber-blue animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Officers List */}
          <div className="xl:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOfficers.map((officer) => (
                  <motion.div
                    key={officer.id}
                    layoutId={`officer-${officer.id}`}
                    onClick={() => {
                      setSelectedOfficer(officer);
                      fetchOfficerStats(officer.id);
                    }}
                    className={cn(
                      "cursor-pointer transition-all border group",
                      selectedOfficer?.id === officer.id ? "border-cyber-blue bg-cyber-blue/5" : "border-white/10 hover:border-white/20"
                    )}
                  >
                    <GlassPanel className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <img 
                            src={officer.profile_photo} 
                            alt={officer.name} 
                            className="w-16 h-16 rounded-xl object-cover border-2 border-white/10"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-cyber-dark border border-white/10 flex items-center justify-center">
                            <BadgeCheck className="w-3 h-3 text-cyber-blue" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-white truncate group-hover:text-cyber-blue transition-colors">{officer.name}</h3>
                          <p className="text-[10px] font-black text-cyber-blue uppercase tracking-widest">{officer.rank}</p>
                          <div className="flex items-center gap-3 mt-2 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />
                              {officer.department}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={cn(
                          "w-5 h-5 text-slate-600 transition-transform",
                          selectedOfficer?.id === officer.id ? "rotate-90 text-cyber-blue" : ""
                        )} />
                      </div>
                    </GlassPanel>
                  </motion.div>
              ))}
            </div>
          </div>

          {/* Officer Detail & Stats */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {selectedOfficer ? (
                <motion.div
                  key={selectedOfficer.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <GlassPanel className="p-8 sticky top-8 space-y-8 border-cyber-blue/20">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-6">
                      <img 
                        src={selectedOfficer.profile_photo} 
                        alt={selectedOfficer.name} 
                        className="w-24 h-24 rounded-2xl object-cover border-4 border-white/5 shadow-2xl"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h2 className="text-2xl font-black text-white">{selectedOfficer.name}</h2>
                        <p className="text-cyber-blue font-bold uppercase tracking-widest text-xs">{selectedOfficer.rank}</p>
                        <div className="mt-4 space-y-2">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Mail className="w-3.5 h-3.5 text-cyber-pink" />
                            {selectedOfficer.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-cyber-blue" />
                            {selectedOfficer.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                    {user?.rank === 'Chief Officer' && selectedOfficer.rank !== 'Chief Officer' && (
                      <button 
                        onClick={() => handleDeleteOfficer(selectedOfficer.id)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                      >
                        <UserMinus className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Success Rate</p>
                      <p className="text-2xl font-black text-cyber-blue">{selectedOfficer.success_rate}%</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Cases Solved</p>
                      <p className="text-2xl font-black text-cyber-pink">{selectedOfficer.cases_solved}</p>
                    </div>
                  </div>

                  {officerStats && (
                    <div className="space-y-6">
                      <div className="h-48 w-full">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Activity Trend (6 Months)</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={officerStats.activity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                            <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0a0b1e', border: '1px solid #ffffff10', borderRadius: '8px' }}
                              itemStyle={{ color: '#00f2ff', fontSize: '12px' }}
                            />
                            <Bar dataKey="cases" fill="#00f2ff" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-white uppercase tracking-widest">Performance Metrics</h4>
                          <TrendingUp className="w-4 h-4 text-cyber-blue" />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Recovery Efficiency</span>
                            <span className="text-white font-bold">High</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-cyber-blue h-full w-[85%]" />
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-400">Response Time</span>
                            <span className="text-white font-bold">2.4h Avg</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                            <div className="bg-cyber-pink h-full w-[92%]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  </GlassPanel>
                </motion.div>
              ) : (
                <GlassPanel className="p-12 text-center space-y-4 border-dashed border-white/10">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto">
                    <Shield className="w-8 h-8 text-slate-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Select an Officer</h3>
                    <p className="text-sm text-slate-500">Choose an officer from the list to view detailed performance metrics and departmental status.</p>
                  </div>
                </GlassPanel>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Add Officer Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md glass-card p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-white flex items-center gap-3">
                  <UserPlus className="w-6 h-6 text-cyber-blue" />
                  Add New Officer
                </h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddOfficer} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="cyber-input w-full"
                    value={newOfficer.name}
                    onChange={e => setNewOfficer({...newOfficer, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                  <input 
                    type="email" 
                    required
                    className="cyber-input w-full"
                    value={newOfficer.email}
                    onChange={e => setNewOfficer({...newOfficer, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rank</label>
                    <select 
                      className="cyber-input w-full"
                      value={newOfficer.rank}
                      onChange={e => setNewOfficer({...newOfficer, rank: e.target.value})}
                    >
                      <option>Investigation Officer</option>
                      <option>Analyst</option>
                      <option>Field Officer</option>
                      <option>Senior Officer</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Department</label>
                    <select 
                      className="cyber-input w-full"
                      value={newOfficer.department}
                      onChange={e => setNewOfficer({...newOfficer, department: e.target.value})}
                    >
                      <option>Cyber Crime Unit</option>
                      <option>Forensics</option>
                      <option>Intelligence</option>
                      <option>Field Operations</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Phone Number</label>
                  <input 
                    type="tel" 
                    className="cyber-input w-full"
                    value={newOfficer.phone}
                    onChange={e => setNewOfficer({...newOfficer, phone: e.target.value})}
                  />
                </div>

                <div className="pt-4">
                  <button type="submit" className="cyber-button-primary w-full py-4">
                    Confirm Onboarding
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OfficerManagement;
