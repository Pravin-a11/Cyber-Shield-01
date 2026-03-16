import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Database, Shield, Search, Filter, Download, Eye, CheckCircle, 
  AlertCircle, ChevronRight, Hash, Clock, User, FileText, 
  FileImage, FileVideo, FileArchive, Loader2, RefreshCw,
  Lock, Activity, Layers, ExternalLink, X, Upload
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, onSnapshot, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

interface Evidence {
  evidence_id: string;
  case_id: string;
  title: string;
  file_name: string;
  evidence_type: string;
  description: string;
  uploaded_by: string;
  sha256_hash: string;
  previous_hash: string;
  timestamp: string;
  status: string;
  file_path: string;
  block_id: number;
  ledger_timestamp: string;
  verification_status: string;
}

interface LedgerBlock {
  block_id: number;
  evidence_id: string;
  block_hash: string;
  previous_hash: string;
  timestamp: string;
  verification_status: string;
  file_name: string;
  case_id: string;
}

const EvidenceLocker: React.FC = () => {
  const { t } = useTranslate();
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>([]);
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'table' | 'ledger'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'error'>('idle');
  const [previewFile, setPreviewFile] = useState<Evidence | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadData, setUploadData] = useState({ case_id: '', title: '', description: '' });

  const seedData = async () => {
    const evidence = [
      { evidence_id: 'EV-101', case_id: 'C-001', title: 'Transaction Logs', file_name: 'logs.csv', evidence_type: 'text/csv', description: 'Bank logs', uploaded_by: user?.name || 'Officer', sha256_hash: 'abc', previous_hash: '000', timestamp: new Date().toISOString(), status: 'Verified', file_path: 'path/to/logs.csv' },
      { evidence_id: 'EV-102', case_id: 'C-002', title: 'CCTV Footage', file_name: 'cctv.mp4', evidence_type: 'video/mp4', description: 'ATM footage', uploaded_by: user?.name || 'Officer', sha256_hash: 'def', previous_hash: 'abc', timestamp: new Date().toISOString(), status: 'Verified', file_path: 'path/to/cctv.mp4' },
    ];
    try {
      for (const item of evidence) {
        await addDoc(collection(db, 'evidence_files'), item);
        await addDoc(collection(db, 'evidence_ledger'), {
          evidence_id: item.evidence_id,
          block_hash: item.sha256_hash,
          previous_hash: item.previous_hash,
          timestamp: item.timestamp,
          verification_status: 'VERIFIED'
        });
      }
      addNotification('Evidence data seeded', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'evidence_files/evidence_ledger');
    }
  };
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleDownload = async (id: string, fileName: string) => {
    // Simulated download for Firestore migration
    addNotification('Downloading evidence file...', 'info');
    setTimeout(() => {
      addNotification('File downloaded successfully (simulated)', 'success');
    }, 1500);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    
    try {
      const evidenceId = `EV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const timestamp = new Date().toISOString();
      const lastBlock = ledger[0];
      const previousHash = lastBlock ? lastBlock.block_hash : "0".repeat(64);
      const currentHash = Math.random().toString(36).substr(2, 32) + Math.random().toString(36).substr(2, 32);

      // 1. Add to evidence_files
      await addDoc(collection(db, 'evidence_files'), {
        evidence_id: evidenceId,
        case_id: uploadData.case_id,
        title: uploadData.title,
        file_name: uploadFile.name,
        evidence_type: uploadFile.type,
        description: uploadData.description,
        uploaded_by: user?.name || 'Officer',
        sha256_hash: currentHash,
        previous_hash: previousHash,
        timestamp: timestamp,
        status: 'Verified',
        file_path: 'simulated_storage_path'
      });

      // 2. Add to evidence_ledger
      await addDoc(collection(db, 'evidence_ledger'), {
        evidence_id: evidenceId,
        block_hash: currentHash,
        previous_hash: previousHash,
        timestamp: timestamp,
        verification_status: 'VERIFIED'
      });

      setShowUpload(false);
      setUploadData({ case_id: '', title: '', description: '' });
      setUploadFile(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'evidence_files/evidence_ledger');
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    
    const qEv = query(collection(db, 'evidence_files'), orderBy('timestamp', 'desc'));
    const unsubscribeEv = onSnapshot(qEv, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const uniqueData = Array.from(new Map(data.map(item => [item.evidence_id, item])).values());
      setEvidenceList(uniqueData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'evidence_files');
    });

    const qLedger = query(collection(db, 'evidence_ledger'), orderBy('timestamp', 'desc'));
    const unsubscribeLedger = onSnapshot(qLedger, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      const uniqueData = Array.from(new Map(data.map(item => [item.evidence_id, item])).values());
      setLedger(uniqueData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'evidence_ledger');
      setLoading(false);
    });

    return () => {
      unsubscribeEv();
      unsubscribeLedger();
    };
  }, []);

  const handleVerifyChain = async () => {
    setVerifying(true);
    setVerificationStatus('verifying');
    
    // Simulate chain verification logic
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In a real app, we'd call an API that re-calculates all hashes
    setVerificationStatus('success');
    setVerifying(false);
    
    setTimeout(() => setVerificationStatus('idle'), 5000);
  };

  const getFileIcon = (type: string) => {
    const t = type?.toLowerCase() || '';
    if (t.includes('image')) return <FileImage className="w-5 h-5 text-cyber-blue" />;
    if (t.includes('audio')) return <FileVideo className="w-5 h-5 text-cyber-pink" />;
    if (t.includes('document') || t.includes('pdf')) return <FileText className="w-5 h-5 text-cyber-purple" />;
    return <FileArchive className="w-5 h-5 text-slate-400" />;
  };

  const filteredEvidence = evidenceList.filter(ev => 
    ev.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.case_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ev.evidence_id.includes(searchQuery)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 uppercase italic neon-text text-[var(--text-primary)]">
            <Database className="w-10 h-10 text-[var(--accent-color)]" />
            {t('evidence_locker')}
          </h1>
          <p className="text-[var(--text-secondary)] font-medium">{t('evidence_locker_desc')}</p>
        </div>
        
          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={seedData}
              className="px-6 py-3 rounded-xl bg-[var(--accent-color)]/20 text-[var(--accent-color)] border border-[var(--accent-color)] font-bold flex items-center gap-2 transition-all hover:bg-[var(--accent-color)]/30"
            >
              <Database className="w-5 h-5" />
              Seed Data
            </button>
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-3 rounded-xl bg-[var(--accent-color)] text-white font-bold flex items-center gap-2 transition-all hover:shadow-[0_0_20px_var(--accent-color)]"
            >
              <Upload className="w-5 h-5" />
              {t('upload_evidence')}
            </button>

            <div className="flex p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
            <button
              onClick={() => setView('table')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                view === 'table' ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Activity className="w-4 h-4" />
              {t('evidence_table')}
            </button>
            <button
              onClick={() => setView('ledger')}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                view === 'ledger' ? "bg-[var(--accent-color)] text-white" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              )}
            >
              <Layers className="w-4 h-4" />
              {t('blockchain_ledger')}
            </button>
          </div>

          <button
            onClick={handleVerifyChain}
            disabled={verifying}
            className={cn(
              "px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all border",
              verificationStatus === 'success' ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" :
              verificationStatus === 'verifying' ? "bg-[var(--accent-color)]/20 border-[var(--accent-color)] text-[var(--accent-color)]" :
              "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--card-bg)]"
            )}
          >
            {verifying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
            {verificationStatus === 'success' ? t('verified') : t('verify_chain')}
          </button>
        </div>
      </div>

      {/* Search & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <div className="lg:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder={t('search_evidence_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-[var(--card-bg)] border border-[var(--border-color)] rounded-2xl focus:outline-none focus:border-[var(--accent-color)]/50 transition-all text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
          />
        </div>
        <div className="glass-card p-4 flex items-center justify-between bg-[var(--card-bg)] border-[var(--border-color)]">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-1">{t('total_evidence')}</p>
            <p className="text-2xl font-mono font-bold text-[var(--accent-color)]">{evidenceList.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-[var(--accent-color)]" />
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === 'table' ? (
          <motion.div
            key="table"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card overflow-hidden bg-[var(--card-bg)] border-[var(--border-color)]"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-color)] bg-[var(--bg-primary)]">
                    <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{t('evidence_id')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{t('case_id')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{t('title')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{t('file_name')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{t('type')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{t('uploaded_by')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{t('timestamp')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{t('status')}</th>
                    <th className="p-4 text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-color)]">
                  {loading ? (
                    Array(10).fill(0).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        {Array(9).fill(0).map((_, j) => (
                          <td key={j} className="p-4"><div className="h-4 bg-[var(--bg-primary)] rounded w-full"></div></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredEvidence.map((ev) => (
                    <tr key={ev.evidence_id} className="hover:bg-[var(--bg-primary)] transition-colors group">
                      <td className="p-4 font-mono text-xs text-[var(--accent-color)] font-bold">{ev.evidence_id}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{ev.case_id}</td>
                      <td className="p-4 text-sm text-[var(--text-primary)] font-medium">{ev.title}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {getFileIcon(ev.evidence_type)}
                          <span className="text-sm text-[var(--text-secondary)]">{ev.file_name}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-[var(--text-secondary)] uppercase">{ev.evidence_type}</td>
                      <td className="p-4 text-sm text-[var(--text-secondary)]">{ev.uploaded_by}</td>
                      <td className="p-4 text-xs text-[var(--text-secondary)]">{ev.timestamp}</td>
                      <td className="p-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500">
                          <CheckCircle className="w-3 h-3" />
                          {ev.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setPreviewFile(ev)}
                            className="p-2 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--accent-color)]/20 text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-all border border-[var(--border-color)]"
                            title="View Evidence"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDownload(ev.evidence_id, ev.file_name)}
                            className="p-2 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--accent-color)]/20 text-[var(--text-secondary)] hover:text-[var(--accent-color)] transition-all border border-[var(--border-color)]" 
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="ledger"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="relative pl-8 border-l-2 border-dashed border-[var(--accent-color)]/30 space-y-12 py-4">
              {ledger.map((block, index) => (
                <motion.div
                  key={block.block_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="relative"
                >
                  {/* Connection Node */}
                  <div className="absolute -left-[41px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[var(--accent-color)] shadow-[0_0_10px_var(--accent-color)] z-10" />
                  
                  <div className="glass-card p-6 border-[var(--border-color)] bg-[var(--card-bg)] hover:border-[var(--accent-color)]/30 transition-all group relative overflow-hidden">
                    {/* Animated background glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-color)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--accent-color)]/10 flex items-center justify-center">
                            <Hash className="w-5 h-5 text-[var(--accent-color)]" />
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold">{t('block_id')}</p>
                            <p className="text-lg font-mono font-bold text-[var(--text-primary)]">#{block.block_id?.toString().padStart(4, '0') || '0000'}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-1">{t('evidence_id')}</p>
                          <p className="text-sm font-mono text-[var(--accent-color)] font-bold">{block.evidence_id}</p>
                        </div>
                      </div>

                      <div className="space-y-4 md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-1">{t('current_hash')}</p>
                            <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-[10px] text-[var(--text-secondary)] break-all">
                              {block.block_hash}
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-1">{t('previous_hash')}</p>
                            <div className="p-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-[10px] text-[var(--text-secondary)] break-all">
                              {block.previous_hash}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                              <Clock className="w-3 h-3" />
                              {block.timestamp}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                              <FileText className="w-3 h-3" />
                              {block.file_name}
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold border border-emerald-500/20 uppercase tracking-widest">
                            {block.verification_status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUpload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUpload(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg glass-card overflow-hidden bg-[var(--card-bg)] border-[var(--border-color)]"
            >
              <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]">
                <h3 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Upload className="w-6 h-6 text-[var(--accent-color)]" />
                  Upload Digital Evidence
                </h3>
                <button onClick={() => setShowUpload(false)} className="p-2 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-secondary)]">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">{t('case_id')}</label>
                  <input
                    type="text"
                    required
                    value={uploadData.case_id}
                    onChange={(e) => setUploadData({ ...uploadData, case_id: e.target.value })}
                    placeholder="e.g. CC-2025-1001"
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent-color)]/50 text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">{t('evidence_title')}</label>
                  <input
                    type="text"
                    required
                    value={uploadData.title}
                    onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                    placeholder="e.g. Phishing Email Screenshot"
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent-color)]/50 text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">{t('description')}</label>
                  <textarea
                    rows={3}
                    value={uploadData.description}
                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                    placeholder="Brief description of the evidence..."
                    className="w-full px-4 py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl focus:outline-none focus:border-[var(--accent-color)]/50 text-[var(--text-primary)] resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">{t('evidence_file')}</label>
                  <div className="relative group">
                    <input
                      type="file"
                      required
                      onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="w-full px-4 py-8 bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border-color)] rounded-xl flex flex-col items-center justify-center gap-3 group-hover:border-[var(--accent-color)]/30 transition-all">
                      <FileArchive className="w-10 h-10 text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] transition-colors" />
                      <p className="text-sm text-[var(--text-secondary)]">
                        {uploadFile ? uploadFile.name : t('drag_drop_placeholder')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="flex-1 px-6 py-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] font-bold hover:bg-[var(--border-color)] transition-all"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || !uploadFile}
                    className="flex-1 px-6 py-3 rounded-xl bg-[var(--accent-color)] text-white font-bold flex items-center justify-center gap-2 hover:shadow-[0_0_20px_var(--accent-color)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    {uploading ? t('uploading') : t('secure_upload')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewFile(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl glass-card overflow-hidden bg-[var(--card-bg)] border-[var(--border-color)]"
            >
              <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[var(--accent-color)]/10 flex items-center justify-center">
                    {getFileIcon(previewFile.evidence_type)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)]">{previewFile.title || previewFile.file_name}</h3>
                    <p className="text-xs text-[var(--text-secondary)] font-mono uppercase tracking-widest">{previewFile.evidence_id} • {previewFile.case_id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setPreviewFile(null)}
                  className="p-2 rounded-lg hover:bg-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-8 py-4 bg-[var(--bg-primary)] border-b border-[var(--border-color)]">
                <p className="text-sm text-[var(--text-secondary)] italic">"{previewFile.description || 'No description provided.'}"</p>
              </div>

              <div className="p-8 bg-[var(--bg-primary)] min-h-[400px] flex items-center justify-center">
                {previewFile.evidence_type === 'Image' ? (
                  <div className="relative group">
                    <img 
                      src={`https://picsum.photos/seed/${previewFile.evidence_id}/800/600`} 
                      alt="Evidence Preview"
                      className="max-h-[60vh] rounded-lg border border-[var(--border-color)] shadow-2xl"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-[var(--accent-color)]/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                ) : previewFile.evidence_type === 'Audio' ? (
                  <div className="w-full max-w-md p-8 glass-card flex flex-col items-center gap-6 bg-[var(--card-bg)] border-[var(--border-color)]">
                    <div className="w-20 h-20 rounded-full bg-cyber-pink/20 flex items-center justify-center animate-pulse">
                      <FileVideo className="w-10 h-10 text-cyber-pink" />
                    </div>
                    <div className="w-full space-y-2">
                      <div className="h-1 bg-[var(--border-color)] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '60%' }}
                          className="h-full bg-cyber-pink"
                        />
                      </div>
                      <div className="flex justify-between text-[10px] font-mono text-[var(--text-secondary)]">
                        <span>01:24</span>
                        <span>02:45</span>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] italic">"Scam call recording - Suspect identified as 'Vikram'..."</p>
                  </div>
                ) : (
                  <div className="w-full max-w-2xl p-12 glass-card space-y-6 bg-[var(--card-bg)] border-[var(--border-color)]">
                    <div className="flex items-center gap-4 mb-8">
                      <FileText className="w-8 h-8 text-cyber-purple" />
                      <span className="text-lg font-bold uppercase tracking-widest text-[var(--text-primary)]">Forensic Document Log</span>
                    </div>
                    <div className="space-y-4 font-mono text-xs text-[var(--text-secondary)] leading-relaxed">
                      <p className="text-[var(--accent-color)]">[SYSTEM] Document hash verified: {previewFile.sha256_hash}</p>
                      <p>[LOG] 2025-01-11 10:23:41 - Evidence captured by {previewFile.uploaded_by}</p>
                      <p>[LOG] Transaction ID: TXN_992837482</p>
                      <p>[LOG] Source IP: 192.168.1.105</p>
                      <p>[LOG] Destination Account: 992837482918 (HDFC Bank)</p>
                      <p className="pt-4">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-[var(--bg-primary)] border-t border-[var(--border-color)] flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-1">{t('blockchain_hash')}</p>
                    <p className="text-xs font-mono text-[var(--accent-color)] truncate max-w-[200px]">{previewFile.sha256_hash}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-bold mb-1">{t('verification')}</p>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      {t('verified')}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => handleDownload(previewFile.evidence_id, previewFile.file_name)}
                    className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:bg-[var(--border-color)] text-[var(--text-primary)] text-sm font-bold transition-all border border-[var(--border-color)]"
                  >
                    {t('download_original')}
                  </button>
                  <button className="px-4 py-2 rounded-lg bg-[var(--accent-color)] text-white text-sm font-bold transition-all hover:shadow-[0_0_15px_var(--accent-color)]">
                    {t('print_report')}
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

export default EvidenceLocker;
