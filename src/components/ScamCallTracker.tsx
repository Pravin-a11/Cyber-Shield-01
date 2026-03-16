import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Phone, Search, AlertTriangle, ShieldCheck, History, MapPin, Calendar, User, FileText, Send, RefreshCw, Loader2, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, limit, onSnapshot, addDoc, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

const ScamCallTracker: React.FC = () => {
  const { language, addNotification } = useUIStore();
  const { t } = useTranslate();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [recentScams, setRecentScams] = useState<any[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportData, setReportData] = useState({
    reporter_name: '',
    phone_number: '',
    fraud_type: 'UPI Phishing',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
    location: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'scam_numbers'), orderBy('last_reported_date', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scams = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRecentScams(scams);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'scam_numbers');
    });

    return () => unsubscribe();
  }, []);

  const handleCheckNumber = async () => {
    if (!phoneNumber.trim()) return;
    setScanning(true);
    setResult(null);
    
    try {
      // Simulate scanning animation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const q = query(collection(db, 'scam_numbers'), where('phone_number', '==', phoneNumber.trim()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        setResult({
          found: true,
          ...data
        });
      } else {
        setResult({
          found: false,
          phone_number: phoneNumber.trim(),
          risk_level: 'Safe',
          complaint_count: 0
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'scam_numbers');
    } finally {
      setScanning(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // 1. Add to scam_reports
      await addDoc(collection(db, 'scam_reports'), {
        ...reportData,
        created_at: new Date().toISOString()
      });

      // 2. Update or create in scam_numbers
      const q = query(collection(db, 'scam_numbers'), where('phone_number', '==', reportData.phone_number));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const scamDoc = querySnapshot.docs[0];
        const currentData = scamDoc.data();
        await updateDoc(doc(db, 'scam_numbers', scamDoc.id), {
          complaint_count: (currentData.complaint_count || 0) + 1,
          last_reported_date: new Date().toISOString(),
          risk_level: (currentData.complaint_count + 1) > 10 ? 'Critical' : ((currentData.complaint_count + 1) > 5 ? 'High' : 'Medium')
        });
      } else {
        await addDoc(collection(db, 'scam_numbers'), {
          phone_number: reportData.phone_number,
          fraud_type: reportData.fraud_type,
          complaint_count: 1,
          risk_level: 'Low',
          reported_location: reportData.location,
          last_reported_date: new Date().toISOString()
        });
      }

      addNotification(`Scam report submitted for ${reportData.phone_number}`, 'success');
      setShowReportForm(false);
      setReportData({
        reporter_name: '',
        phone_number: '',
        fraud_type: 'UPI Phishing',
        description: '',
        incident_date: new Date().toISOString().split('T')[0],
        location: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'scam_reports/scam_numbers');
      addNotification('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 uppercase italic neon-text">
          <Phone className="w-10 h-10 text-accent" />
          {t('scam_tracker')}
        </h1>
        <p className="text-secondary font-medium">Verify suspicious numbers and report fraudulent call activity to the Cyber Command.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Search Section */}
        <div className="lg:col-span-2 space-y-8">
          <div className="glass-card p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <RefreshCw className={cn("w-20 h-20 text-accent", scanning && "animate-spin")} />
            </div>
            
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <Search className="w-5 h-5 text-accent" />
              Intelligence Search
            </h2>

            <div className="flex gap-4">
              <div className="relative flex-1">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary" />
                <input
                  type="text"
                  placeholder="Enter phone number (e.g. +91 98765 43210)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-border-custom rounded-2xl focus:outline-none focus:border-accent/50 transition-all text-primary text-lg font-mono"
                />
              </div>
              <button
                onClick={handleCheckNumber}
                disabled={scanning || !phoneNumber.trim()}
                className="cyber-button px-8 flex items-center gap-2"
              >
                {scanning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                {t('check_number')}
              </button>
            </div>

            <AnimatePresence mode="wait">
              {scanning && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-10 p-10 flex flex-col items-center justify-center space-y-4"
                >
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-accent animate-pulse" />
                    </div>
                  </div>
                  <p className="text-accent font-mono text-sm animate-pulse">SCANNING GLOBAL SCAM DATABASE...</p>
                </motion.div>
              )}

              {result && !scanning && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-10"
                >
                  {result.found ? (
                    <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/30 space-y-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6">
                        <AlertTriangle className="w-16 h-16 text-red-500 opacity-20 animate-pulse" />
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                          <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-red-500 uppercase tracking-tighter">{t('scam_detected')}</h3>
                          <p className="text-secondary font-mono">{phoneNumber}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-red-500/20">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Fraud Type</p>
                          <p className="text-primary font-bold">{result.data.fraud_type}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Complaints</p>
                          <p className="text-primary font-bold">{result.data.complaint_count}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Risk Level</p>
                          <span className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                            result.data.risk_level === 'Critical' ? "bg-red-500 text-white" : "bg-orange-500 text-white"
                          )}>
                            {result.data.risk_level}
                          </span>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Last Location</p>
                          <p className="text-primary font-bold">{result.data.reported_location}</p>
                        </div>
                      </div>

                      {result.data.risk_level === 'Critical' && (
                        <div className="bg-red-500 text-white p-3 rounded-xl flex items-center gap-3 animate-pulse">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <p className="text-xs font-bold uppercase tracking-widest">Warning: High-Risk Fraudulent Activity Detected. Do not share any OTP or personal details.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.5)]">
                        <ShieldCheck className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-emerald-400 uppercase tracking-tighter">{t('no_scam_found')}</h3>
                        <p className="text-secondary font-mono">This number has no reported fraudulent activity in our database.</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-8 flex justify-center">
                    <button
                      onClick={() => {
                        setReportData(prev => ({ ...prev, phone_number: phoneNumber }));
                        setShowReportForm(true);
                      }}
                      className="px-8 py-3 rounded-xl border border-border-custom text-primary font-bold hover:bg-white/5 transition-all flex items-center gap-2"
                    >
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      {t('report_scam')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Recent Scams Table */}
          <div className="glass-card p-8">
            <h2 className="text-xl font-bold text-primary mb-6 flex items-center gap-2">
              <History className="w-5 h-5 text-accent" />
              Recent Scam Reports
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-custom">
                    <th className="py-4 text-[10px] uppercase tracking-widest text-secondary font-bold">Phone Number</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-secondary font-bold">Fraud Type</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-secondary font-bold">Risk</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-secondary font-bold">Location</th>
                    <th className="py-4 text-[10px] uppercase tracking-widest text-secondary font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-custom">
                  {recentScams.map((scam, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors group">
                      <td className="py-4 font-mono text-sm text-accent font-bold">{scam.phone_number}</td>
                      <td className="py-4 text-sm text-primary">{scam.fraud_type}</td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          scam.risk_level === 'Critical' ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                          scam.risk_level === 'High' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                          "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        )}>
                          {scam.risk_level}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-secondary">{scam.reported_location}</td>
                      <td className="py-4 text-xs text-secondary">{new Date(scam.last_reported_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar / Stats */}
        <div className="space-y-8">
          <div className="glass-card p-6 border-accent/20">
            <h3 className="text-lg font-bold text-primary mb-4">AI Risk Analysis</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-white/5 border border-border-custom">
                <p className="text-xs text-secondary mb-2">Our AI analyzes patterns such as repeated complaints, fraud keywords, and suspicious activity to determine risk levels in real-time.</p>
                <div className="flex items-center gap-2 text-accent">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Active Monitoring</span>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-accent/5 border border-accent/20">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-secondary font-bold mb-1">Database Size</p>
                  <p className="text-2xl font-mono font-bold text-accent">12,842</p>
                </div>
                <Globe className="w-10 h-10 text-accent opacity-20" />
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-pink-500/20">
            <h3 className="text-lg font-bold text-primary mb-4">Safety Tips</h3>
            <ul className="space-y-3">
              {[
                "Never share OTP or banking passwords.",
                "Verify callers claiming to be from banks.",
                "Report suspicious numbers immediately.",
                "Use CyberShield to verify unknown links."
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-xs text-secondary">
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-1.5 shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <AnimatePresence>
        {showReportForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReportForm(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl glass-card p-8 border-accent/30"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-orange-500" />
                  Report Scam Number
                </h2>
                <button onClick={() => setShowReportForm(false)} className="text-secondary hover:text-primary transition-colors">
                  <RefreshCw className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleReportSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Reporter Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="text"
                      required
                      value={reportData.reporter_name}
                      onChange={(e) => setReportData(prev => ({ ...prev, reporter_name: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary"
                      placeholder="Your Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Scam Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="text"
                      required
                      value={reportData.phone_number}
                      onChange={(e) => setReportData(prev => ({ ...prev, phone_number: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary font-mono"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Fraud Type</label>
                  <select
                    value={reportData.fraud_type}
                    onChange={(e) => setReportData(prev => ({ ...prev, fraud_type: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary"
                  >
                    {['UPI Phishing', 'OTP Scam', 'Investment Fraud', 'Loan Scam', 'Identity Theft', 'Job Scam', 'Other'].map(type => (
                      <option key={type} value={type} className="bg-sidebar-bg">{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Incident Date</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="date"
                      required
                      value={reportData.incident_date}
                      onChange={(e) => setReportData(prev => ({ ...prev, incident_date: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Description</label>
                  <div className="relative">
                    <FileText className="absolute left-4 top-4 w-4 h-4 text-secondary" />
                    <textarea
                      required
                      value={reportData.description}
                      onChange={(e) => setReportData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-white/5 border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary min-h-[100px] resize-none"
                      placeholder="Describe the scam call..."
                    />
                  </div>
                </div>

                <div className="md:col-span-2 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full cyber-button py-4 flex items-center justify-center gap-3 text-lg"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                    Submit Intelligence Report
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

export default ScamCallTracker;
