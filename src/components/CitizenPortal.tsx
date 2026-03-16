import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Send, FileText, Upload, AlertTriangle, CheckCircle, Info, Phone, Mail, MapPin, Loader2, Lock, Globe } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

const CitizenPortal: React.FC = () => {
  const { language, addNotification } = useUIStore();
  const { user } = useAuthStore();
  const { t } = useTranslate();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [complaintId, setComplaintId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    fraudType: 'Financial Fraud',
    description: '',
    evidence: null as File | null
  });

  const fraudTypes = [
    'Financial Fraud',
    'Identity Theft',
    'Cyber Stalking',
    'Social Media Crime',
    'Phishing Attack',
    'Ransomware',
    'Online Job Fraud',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const generatedId = `C-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      await addDoc(collection(db, 'complaints'), {
        citizen_id: user?.uid || 'anonymous',
        victim_name: formData.name,
        phone: formData.phone,
        email: formData.email,
        location: formData.location,
        fraud_type: formData.fraudType,
        description: formData.description,
        status: 'pending',
        risk_score: Math.floor(Math.random() * 100),
        created_at: new Date().toISOString(),
        complaint_id: generatedId,
        is_citizen_report: true
      });

      setComplaintId(generatedId);
      setStep(3);
      addNotification('Complaint submitted successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'complaints');
      addNotification('Failed to submit complaint', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-primary p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block p-4 rounded-2xl bg-accent/10 border border-accent/30 mb-6"
          >
            <Shield className="w-12 h-12 text-accent" />
          </motion.div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 neon-text uppercase italic text-primary">
            {t('citizen_portal')}
          </h1>
          <p className="text-secondary text-lg max-w-2xl mx-auto">
            Secure and anonymous reporting system for cybercrime victims. Your data is protected by law enforcement grade encryption.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { icon: Lock, title: 'Secure', desc: 'End-to-end encrypted reporting' },
            { icon: Globe, title: 'Global', desc: 'Tracked across jurisdictions' },
            { icon: Shield, title: 'Verified', desc: 'Directly handled by cyber cells' },
          ].map((item, i) => (
            <div key={i} className="glass-card p-6 text-center border-border-custom">
              <item.icon className="w-8 h-8 text-accent mx-auto mb-4" />
              <h3 className="font-bold text-primary mb-2">{item.title}</h3>
              <p className="text-xs text-secondary">{item.desc}</p>
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 md:p-12 border-accent/20"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white">1</div>
                <h2 className="text-2xl font-bold text-primary">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary"
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-[var(--bg-primary)] border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-[var(--bg-primary)] border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full pl-12 pr-4 py-3 bg-[var(--bg-primary)] border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary"
                      placeholder="City, State"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  onClick={() => setStep(2)}
                  className="cyber-button px-10 py-4 flex items-center gap-2 bg-accent text-white border-accent/20"
                >
                  Next Step
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card p-8 md:p-12 border-border-custom"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center font-bold text-white">2</div>
                <h2 className="text-2xl font-bold text-primary">Incident Details</h2>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Type of Fraud</label>
                  <select
                    value={formData.fraudType}
                    onChange={(e) => setFormData(prev => ({ ...prev, fraudType: e.target.value }))}
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 text-primary"
                  >
                    {fraudTypes.map(type => (
                      <option key={type} value={type} className="bg-sidebar-bg">{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Incident Description</label>
                  <textarea
                    required
                    rows={5}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-border-custom rounded-xl focus:outline-none focus:border-accent/50 resize-none text-primary"
                    placeholder="Describe the incident in detail..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-secondary uppercase tracking-widest">Upload Evidence (Images/PDF)</label>
                  <div className="relative border-2 border-dashed border-border-custom rounded-2xl p-8 text-center hover:border-accent/50 transition-colors cursor-pointer group bg-[var(--bg-primary)]">
                    <input
                      type="file"
                      onChange={(e) => setFormData(prev => ({ ...prev, evidence: e.target.files?.[0] || null }))}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <Upload className="w-10 h-10 text-secondary mx-auto mb-4 group-hover:text-accent transition-colors" />
                    <p className="text-sm text-secondary">
                      {formData.evidence ? formData.evidence.name : 'Drag and drop or click to upload evidence'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-8 py-4 bg-white/5 border border-border-custom rounded-xl font-bold hover:bg-white/10 transition-colors text-primary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 cyber-button py-4 flex items-center justify-center gap-3 text-lg bg-accent text-white border-accent/20"
                  >
                    {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Shield className="w-6 h-6" />}
                    Submit Official Complaint
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card p-12 text-center border-emerald-500/20"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center mx-auto mb-8">
                <CheckCircle className="w-12 h-12 text-emerald-500" />
              </div>
              <h2 className="text-3xl font-black mb-4 text-primary">Complaint Registered</h2>
              <p className="text-secondary mb-8 max-w-md mx-auto">
                Your complaint has been successfully filed. An investigation officer will be assigned within 24 hours.
              </p>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-border-custom mb-10 max-w-sm mx-auto">
                <p className="text-[10px] font-black text-secondary uppercase tracking-widest mb-2">Complaint Reference ID</p>
                <p className="text-2xl font-mono font-bold text-accent">{complaintId}</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="px-8 py-3 bg-white/5 border border-border-custom rounded-xl font-bold hover:bg-white/10 transition-colors text-primary"
                >
                  File Another Complaint
                </button>
                <button
                  className="px-8 py-3 bg-accent text-white rounded-xl font-bold hover:bg-accent/90 transition-colors"
                >
                  Track Status
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-20 pt-10 border-t border-border-custom text-center text-secondary">
          <div className="flex items-center justify-center gap-8 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Emergency: 1930</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-widest">Helpdesk: support@cybercrime.gov.in</span>
            </div>
          </div>
          <p className="text-[10px] font-medium uppercase tracking-widest">
            © 2026 CyberShield Omega - National Cybercrime Reporting Portal
          </p>
        </footer>
      </div>
    </div>
  );
};

export default CitizenPortal;
