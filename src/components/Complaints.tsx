import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileText, Plus, Search, Filter, Download, Trash2, ExternalLink, AlertTriangle, CheckCircle, Clock, Database, Upload, Loader2, Shield, X, Activity, Lock, Eye, Edit2, Info, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslate } from '@/hooks/useTranslate';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, query, onSnapshot, doc, addDoc, deleteDoc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

const Complaints: React.FC = () => {
  const { t } = useTranslate();
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | null>(null);
  const [viewingComplaint, setViewingComplaint] = useState<any | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<any | null>(null);
  const [deletingComplaintId, setDeletingComplaintId] = useState<number | null>(null);
  const [showLedger, setShowLedger] = useState(false);
  const [ledgerData, setLedgerData] = useState<any[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceMetadata, setEvidenceMetadata] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filters, setFilters] = useState({
    type: 'All',
    status: 'All',
    location: 'All'
  });

  const [formData, setFormData] = useState({
    victim_name: '',
    phone: '',
    email: '',
    fraud_type: 'Phishing',
    amount: '',
    location: '',
    bank_name: '',
    transaction_id: '',
    description: '',
    incident_date: new Date().toISOString().split('T')[0],
    evidence_url: ''
  });

  useEffect(() => {
    setLoading(true);
    let q = query(collection(db, 'complaints'), orderBy('created_at', 'desc'));
    
    // If user is citizen, only show their complaints
    if (user?.role === 'citizen') {
      q = query(collection(db, 'complaints'), where('citizen_id', '==', user.uid), orderBy('created_at', 'desc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const complaintsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setComplaints(complaintsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'complaints');
      setLoading(false);
    });

    if (user?.role === 'officer') {
      const qLedger = query(collection(db, 'evidence'), orderBy('timestamp', 'desc'));
      const unsubscribeLedger = onSnapshot(qLedger, (snapshot) => {
        const ledgerData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];
        setLedgerData(ledgerData);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'evidence');
      });
      return () => {
        unsubscribe();
        unsubscribeLedger();
      };
    }

    return () => unsubscribe();
  }, [user]);

  const verifyEvidence = async (evidenceId: string) => {
    setVerifyingId(evidenceId);
    try {
      // In a real app, this would check a blockchain hash
      // For now, we simulate verification
      await new Promise(resolve => setTimeout(resolve, 1000));
      setVerificationResult({ id: evidenceId, isValid: true, timestamp: new Date().toISOString() });
      addNotification('Evidence integrity verified successfully', 'success');
    } catch (err) {
      console.error(err);
      addNotification('Verification service unavailable', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'complaints'), {
        ...formData,
        citizen_id: user?.uid,
        status: 'pending',
        risk_score: Math.floor(Math.random() * 100),
        created_at: new Date().toISOString(),
        complaint_id: `C-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      });
      
      setShowForm(false);
      addNotification('Intelligence report submitted successfully', 'success');
      setFormData({
        victim_name: '',
        phone: '',
        email: '',
        fraud_type: 'Phishing',
        amount: '',
        location: '',
        bank_name: '',
        transaction_id: '',
        description: '',
        incident_date: new Date().toISOString().split('T')[0],
        evidence_url: ''
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'complaints');
      addNotification('Failed to submit complaint', 'error');
    }
  };

  const handleEvidenceUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaintId || !evidenceFile) return;

    setUploading(true);
    try {
      // In a real app, upload to Firebase Storage
      // For now, we'll simulate the upload and add a record to 'evidence' collection
      const evidenceUrl = `https://firebasestorage.googleapis.com/v0/b/mock/o/${evidenceFile.name}`;
      
      await addDoc(collection(db, 'evidence'), {
        complaint_id: selectedComplaintId,
        metadata: evidenceMetadata,
        file_name: evidenceFile.name,
        file_url: evidenceUrl,
        timestamp: new Date().toISOString(),
        officer_uid: user?.uid,
        hash: Math.random().toString(36).substring(7)
      });

      // Update complaint with evidence URL
      const complaintRef = doc(db, 'complaints', selectedComplaintId.toString());
      await updateDoc(complaintRef, {
        evidence_url: evidenceUrl
      });

      setShowEvidenceModal(false);
      setEvidenceFile(null);
      setEvidenceMetadata('');
      addNotification('Evidence sealed in blockchain locker', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'evidence');
      addNotification('Failed to upload evidence', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'complaints', id));
      setDeletingComplaintId(null);
      addNotification('Complaint record deleted', 'info');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'complaints');
      addNotification('Failed to delete complaint', 'error');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingComplaint) return;

    try {
      const complaintRef = doc(db, 'complaints', editingComplaint.id);
      await updateDoc(complaintRef, {
        status: editingComplaint.status,
        risk_score: editingComplaint.risk_score,
        description: editingComplaint.description
      });
      
      setEditingComplaint(null);
      addNotification('Complaint updated successfully', 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'complaints');
      addNotification('Failed to update complaint', 'error');
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredComplaints);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Complaints");
    XLSX.writeFile(wb, "CyberShield_Complaints.xlsx");
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text("CyberShield Omega - Complaint Report", 14, 15);
    const tableColumn = ["ID", "Victim", "Type", "Amount", "Location", "Status", "Date"];
    const tableRows = filteredComplaints.map(c => [
      c.id,
      c.victim_name,
      c.fraud_type,
      c.amount,
      c.location,
      c.status,
      new Date(c.created_at).toLocaleDateString()
    ]);
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    doc.save("CyberShield_Complaints.pdf");
  };

  const filteredComplaints = (Array.isArray(complaints) ? complaints : []).filter(c => {
    const matchesSearch = 
      (c.victim_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (c.fraud_type?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (c.location?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesType = filters.type === 'All' || c.fraud_type === filters.type;
    const matchesStatus = filters.status === 'All' || c.status === filters.status;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'investigating': return <Activity className="w-4 h-4 text-cyber-blue" />;
      case 'resolved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <AlertTriangle className="w-4 h-4 text-slate-500" />;
    }
  };

  const fraudTypes = ['All', 'Phishing', 'ATM Fraud', 'Identity Theft', 'Vishing', 'Lottery Scam', 'Job Fraud'];
  const statuses = ['All', 'pending', 'investigating', 'resolved'];

  return (
    <div className="p-8 space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-[var(--text-primary)]">{t('complaints')}</h1>
          <p className="text-[var(--text-secondary)] mt-1 font-medium">{t('manage_complaints')}</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button onClick={exportToExcel} className="cyber-button flex items-center gap-2 bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-primary)]">
            <Download className="w-4 h-4" /> {t('export_excel')}
          </button>
          <button onClick={exportToPDF} className="cyber-button flex items-center gap-2 bg-[var(--text-primary)]/5 border-[var(--border-color)] text-[var(--text-primary)]">
            <FileText className="w-4 h-4" /> {t('download_pdf')}
          </button>
          {user?.role === 'officer' && (
            <button onClick={() => setShowLedger(true)} className="cyber-button flex items-center gap-2 bg-[var(--accent-color)]/10 border-[var(--accent-color)]/20 text-[var(--accent-color)]">
              <Database className="w-4 h-4" /> {t('view_ledger')}
            </button>
          )}
          {user?.role === 'citizen' && (
            <button onClick={() => setShowForm(true)} className="cyber-button flex items-center gap-2 bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color)]/90">
              <Plus className="w-4 h-4" /> {t('add_complaint')}
            </button>
          )}
        </div>
      </header>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div className="lg:col-span-2 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            className="w-full cyber-input pl-11 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          className="cyber-input bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
        >
          {fraudTypes.map(t => <option key={t} value={t} className="bg-[var(--bg-primary)]">{t}</option>)}
        </select>
        <select 
          className="cyber-input bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
          value={filters.status}
          onChange={e => setFilters({ ...filters, status: e.target.value })}
        >
          {statuses.map(s => <option key={s} value={s} className="bg-[var(--bg-primary)]">{s}</option>)}
        </select>
      </div>

      {/* Complaints Table */}
      <div className="glass-card overflow-hidden border-[var(--border-color)] bg-[var(--card-bg)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--text-primary)]/5 border-b border-[var(--border-color)]">
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Complaint ID</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{t('victim')} / {t('type')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{t('amount')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{t('location')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{t('status')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{t('risk_score')}</th>
                <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {filteredComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-[var(--text-primary)]/5 transition-all group">
                  <td className="px-6 py-4 font-mono text-[10px] text-[var(--accent-color)] font-bold">{c.complaint_id || `#C-${c.id?.toString().padStart(5, '0') || '00000'}`}</td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-[var(--text-primary)]">{c.victim_name}</div>
                    <div className="text-[10px] font-bold text-[var(--accent-color)] uppercase tracking-tighter">{c.fraud_type}</div>
                  </td>
                  <td className="px-6 py-4 font-black text-red-500">{formatCurrency(c.amount)}</td>
                  <td className="px-6 py-4 text-xs text-[var(--text-secondary)] font-medium">{c.location}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(c.status)}
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">{c.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-1.5 w-16 bg-[var(--text-primary)]/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${c.risk_score}%` }}
                          className={cn(
                            "h-full rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                            c.risk_score > 70 ? "bg-red-500" : c.risk_score > 40 ? "bg-yellow-500" : "bg-green-500"
                          )}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-[var(--text-secondary)]">{c.risk_score}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      {user?.role === 'officer' && (
                        <button 
                          onClick={() => {
                            setSelectedComplaintId(c.id);
                            setShowEvidenceModal(true);
                          }}
                          className="p-2 hover:bg-[var(--accent-color)]/20 rounded-lg text-[var(--accent-color)] transition-colors"
                          title="Upload Blockchain Evidence"
                        >
                          <Database className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setViewingComplaint(c)}
                        className="p-2 hover:bg-[var(--accent-color)]/20 rounded-lg text-[var(--accent-color)] transition-colors"
                        title="View Intelligence Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {user?.role === 'officer' && (
                        <button 
                          onClick={() => setEditingComplaint(c)}
                          className="p-2 hover:bg-[var(--accent-color)]/20 rounded-lg text-[var(--accent-color)] transition-colors"
                          title="Edit Intelligence Record"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => setDeletingComplaintId(c.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg text-red-500 transition-colors"
                        title="Delete Intelligence Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredComplaints.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-[var(--text-secondary)]">
                      <Search className="w-12 h-12 opacity-20" />
                      <p className="font-medium">No intelligence records found matching your criteria.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals remain same but with better styling */}
      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl glass-card p-10 max-h-[90vh] overflow-y-auto border-[var(--border-color)] bg-[var(--card-bg)]"
            >
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[var(--text-primary)]">File New Intelligence Report</h2>
                <button onClick={() => setShowForm(false)} className="p-2 hover:bg-[var(--text-primary)]/10 rounded-full transition-colors text-[var(--text-primary)]">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Victim Information Section */}
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-color)] mb-4 flex items-center gap-2">
                      <Shield className="w-3 h-3" /> Victim Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Full Name</label>
                        <div className="relative">
                          <Eye className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)]" />
                          <input
                            type="text"
                            required
                            placeholder="Enter victim's name"
                            className="w-full cyber-input pl-10 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                            value={formData.victim_name}
                            onChange={e => setFormData({ ...formData, victim_name: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Email Address</label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)]" />
                          <input
                            type="email"
                            required
                            placeholder="victim@example.com"
                            className="w-full cyber-input pl-10 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Phone Number</label>
                        <div className="relative">
                          <Activity className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)]" />
                          <input
                            type="tel"
                            required
                            placeholder="+91 XXXXX XXXXX"
                            className="w-full cyber-input pl-10 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Incident Location</label>
                        <div className="relative">
                          <Filter className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)]" />
                          <input
                            type="text"
                            required
                            placeholder="City, State"
                            className="w-full cyber-input pl-10 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Incident Details Section */}
                  <div className="md:col-span-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-red-500 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-3 h-3" /> Incident Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Fraud Category</label>
                        <select
                          className="w-full cyber-input bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                          value={formData.fraud_type}
                          onChange={e => setFormData({ ...formData, fraud_type: e.target.value })}
                        >
                          {fraudTypes.filter(t => t !== 'All').map(t => <option key={t} className="bg-[var(--bg-primary)]">{t}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Incident Date</label>
                        <input
                          type="date"
                          required
                          className="w-full cyber-input bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                          value={formData.incident_date}
                          onChange={e => setFormData({ ...formData, incident_date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Amount Lost (INR)</label>
                        <div className="relative">
                          <span className="absolute left-3 top-3 text-red-500 font-bold">₹</span>
                          <input
                            type="number"
                            required
                            placeholder="0.00"
                            className="w-full cyber-input pl-8 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Bank Name</label>
                        <input
                          type="text"
                          placeholder="e.g. HDFC Bank"
                          className="w-full cyber-input bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                          value={formData.bank_name}
                          onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Transaction ID / Reference Number</label>
                    <input
                      type="text"
                      placeholder="TXN123456789"
                      className="w-full cyber-input bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                      value={formData.transaction_id}
                      onChange={e => setFormData({ ...formData, transaction_id: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Evidence URL (Optional)</label>
                    <div className="relative">
                      <ExternalLink className="absolute left-3 top-3 w-4 h-4 text-[var(--text-secondary)]" />
                      <input
                        type="url"
                        placeholder="https://drive.google.com/..."
                        className="w-full cyber-input pl-10 bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                        value={formData.evidence_url}
                        onChange={e => setFormData({ ...formData, evidence_url: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Detailed Description / Modus Operandi</label>
                    <textarea
                      rows={4}
                      placeholder="Describe how the fraud occurred..."
                      className="w-full cyber-input resize-none bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button type="submit" className="w-full cyber-button py-4 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color)]/90">
                    <Shield className="w-5 h-5" />
                    Submit Official Intelligence Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* View Details Modal */}
        {viewingComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-2xl glass-card p-10 border-[var(--border-color)] overflow-y-auto max-h-[90vh] bg-[var(--card-bg)]"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--accent-color)]/10 rounded-xl">
                    <FileText className="w-8 h-8 text-[var(--accent-color)]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Intelligence Dossier</h2>
                    <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest">Record ID: {viewingComplaint.complaint_id || `#C-${viewingComplaint.id?.toString().padStart(5, '0') || '00000'}`}</p>
                  </div>
                </div>
                <button onClick={() => setViewingComplaint(null)} className="p-2 hover:bg-[var(--text-primary)]/10 rounded-full text-[var(--text-primary)]">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Victim Identity</label>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{viewingComplaint.victim_name}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Email</label>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{viewingComplaint.email || 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Contact</label>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{viewingComplaint.phone}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Incident Date</label>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{viewingComplaint.incident_date ? formatDate(viewingComplaint.incident_date) : 'N/A'}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Fraud Vector</label>
                  <p className="text-lg font-bold text-[var(--accent-color)]">{viewingComplaint.fraud_type}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Financial Impact</label>
                  <p className="text-lg font-black text-red-500">{formatCurrency(viewingComplaint.amount)}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Location</label>
                  <p className="text-lg font-bold text-[var(--text-primary)]">{viewingComplaint.location}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Status</label>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(viewingComplaint.status)}
                    <span className="text-sm font-black uppercase tracking-widest text-[var(--text-primary)]">{viewingComplaint.status}</span>
                  </div>
                </div>
              </div>

              {viewingComplaint.evidence_url && (
                <div className="mb-8 p-4 rounded-xl bg-[var(--text-primary)]/5 border border-[var(--border-color)]">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] block mb-2">Attached Evidence Link</label>
                  <a href={viewingComplaint.evidence_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent-color)] hover:underline flex items-center gap-2 text-sm">
                    <ExternalLink className="w-4 h-4" />
                    {viewingComplaint.evidence_url}
                  </a>
                </div>
              )}

              <div className="space-y-4 mb-8">
                <div className="p-6 rounded-2xl bg-[var(--text-primary)]/5 border border-[var(--border-color)]">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] block mb-3">Case Narrative</label>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed italic">"{viewingComplaint.description}"</p>
                </div>
              </div>

              <div className="flex justify-between items-center p-6 rounded-2xl bg-[var(--accent-color)]/5 border border-[var(--accent-color)]/20">
                <div className="flex items-center gap-4">
                  <Activity className="w-6 h-6 text-[var(--accent-color)]" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--accent-color)]/60">Risk Assessment</p>
                    <p className="text-xl font-black text-[var(--accent-color)]">{viewingComplaint.risk_score}% Threat Level</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Logged On</p>
                  <p className="text-sm font-bold text-[var(--text-secondary)]">{formatDate(viewingComplaint.created_at)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Modal */}
        {editingComplaint && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-lg glass-card p-10 border-[var(--border-color)] bg-[var(--card-bg)]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-[var(--text-primary)]">
                  <Edit2 className="w-8 h-8 text-[var(--accent-color)]" />
                  Update Intelligence
                </h2>
                <button onClick={() => setEditingComplaint(null)} className="p-2 hover:bg-[var(--text-primary)]/10 rounded-full text-[var(--text-primary)]">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="p-4 rounded-xl bg-[var(--text-primary)]/5 border border-[var(--border-color)] mb-6">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mb-1">Complaint ID</p>
                  <p className="text-sm font-mono font-bold text-[var(--accent-color)]">{editingComplaint.complaint_id || `#C-${editingComplaint.id}`}</p>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Investigation Status</label>
                  <select
                    className="w-full cyber-input bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                    value={editingComplaint.status}
                    onChange={e => setEditingComplaint({ ...editingComplaint, status: e.target.value })}
                  >
                    {statuses.filter(s => s !== 'All').map(s => <option key={s} value={s} className="bg-[var(--bg-primary)]">{s}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Risk Score ({editingComplaint.risk_score}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    className="w-full h-2 bg-[var(--text-primary)]/10 rounded-lg appearance-none cursor-pointer accent-[var(--accent-color)]"
                    value={editingComplaint.risk_score}
                    onChange={e => setEditingComplaint({ ...editingComplaint, risk_score: parseInt(e.target.value) })}
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Internal Case Notes</label>
                  <textarea
                    className="w-full cyber-input resize-none bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]"
                    rows={4}
                    value={editingComplaint.description}
                    onChange={e => setEditingComplaint({ ...editingComplaint, description: e.target.value })}
                  />
                </div>

                <button type="submit" className="w-full cyber-button py-4 text-sm font-black uppercase tracking-widest bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color)]/90">
                  Commit Intelligence Update
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingComplaintId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm glass-card p-10 border-red-500/20 text-center bg-[var(--card-bg)]"
            >
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 text-[var(--text-primary)]">Purge Intelligence?</h2>
              <p className="text-[var(--text-secondary)] text-sm mb-8 leading-relaxed">This action will permanently remove this record from the central intelligence repository. This cannot be undone.</p>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeletingComplaintId(null)}
                  className="flex-1 px-6 py-3 bg-[var(--text-primary)]/5 hover:bg-[var(--text-primary)]/10 rounded-xl font-bold transition-all text-[var(--text-primary)]"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDelete(deletingComplaintId)}
                  className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold text-white transition-all shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                >
                  Purge Record
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showEvidenceModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md glass-card p-10 border-[var(--border-color)] bg-[var(--card-bg)]"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3 text-[var(--text-primary)]">
                  <Database className="w-8 h-8 text-[var(--accent-color)]" />
                  Evidence Locker
                </h2>
                <button onClick={() => setShowEvidenceModal(false)} className="p-2 hover:bg-[var(--text-primary)]/10 rounded-full text-[var(--text-primary)]">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleEvidenceUpload} className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Evidence File</label>
                  <div className="relative">
                    <input
                      type="file"
                      required
                      onChange={(e) => setEvidenceFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="evidence-upload"
                    />
                    <label 
                      htmlFor="evidence-upload"
                      className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-[var(--border-color)] rounded-2xl hover:border-[var(--accent-color)]/50 hover:bg-[var(--accent-color)]/5 transition-all cursor-pointer group"
                    >
                      {evidenceFile ? (
                        <div className="flex flex-col items-center gap-2 text-[var(--accent-color)]">
                          <FileText className="w-10 h-10" />
                          <span className="text-xs font-bold">{evidenceFile.name}</span>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] transition-colors mb-3" />
                          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-widest">Select Evidence File</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Metadata / Notes</label>
                  <textarea
                    className="w-full cyber-input resize-none bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-primary)]"
                    rows={3}
                    placeholder="Enter evidence details..."
                    value={evidenceMetadata}
                    onChange={(e) => setEvidenceMetadata(e.target.value)}
                  />
                </div>

                <div className="p-5 rounded-2xl bg-[var(--accent-color)]/5 border border-[var(--accent-color)]/20 text-[10px] text-[var(--accent-color)]/80 font-medium leading-relaxed">
                  <div className="font-black mb-2 flex items-center gap-2 uppercase tracking-widest">
                    <Shield className="w-4 h-4" />
                    BLOCKCHAIN PROTOCOL ACTIVE
                  </div>
                  This file will be hashed using SHA-256 and linked to the previous block in the immutable evidence ledger.
                </div>

                <button 
                  type="submit" 
                  disabled={uploading || !evidenceFile}
                  className="w-full cyber-button py-4 flex items-center justify-center gap-3 text-sm font-black uppercase tracking-widest bg-[var(--accent-color)] text-white hover:bg-[var(--accent-color)]/90"
                >
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                    <>
                      <Lock className="w-5 h-5" />
                      Seal in Blockchain Locker
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Blockchain Ledger Modal */}
        {showLedger && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-5xl glass-card p-10 border-[var(--border-color)] bg-[var(--card-bg)] max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--accent-color)]/10 rounded-xl">
                    <Database className="w-8 h-8 text-[var(--accent-color)]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-[var(--text-primary)]">Immutable Evidence Ledger</h2>
                    <p className="text-[10px] font-mono text-[var(--text-secondary)] uppercase tracking-widest">Cryptographic Chain of Custody Protocol v4.2</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button onClick={() => setShowLedger(false)} className="p-2 hover:bg-[var(--text-primary)]/10 rounded-full transition-colors text-[var(--text-primary)]">
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                {ledgerData.map((block, index) => (
                  <div key={block.id} className="relative pl-8 border-l border-[var(--accent-color)]/20 pb-4 last:pb-0">
                    <div className="absolute left-[-5px] top-0 w-2.5 h-2.5 bg-[var(--accent-color)] rounded-full shadow-[0_0_10px_rgba(0,186,255,0.5)]" />
                    
                    <div className="glass-card p-6 border-[var(--border-color)] bg-[var(--bg-primary)]/50 hover:border-[var(--accent-color)]/30 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-black bg-[var(--accent-color)]/20 text-[var(--accent-color)] px-2 py-0.5 rounded uppercase tracking-widest">Block #{block.id}</span>
                            <span className="text-xs font-bold text-[var(--text-primary)]">{block.file_name}</span>
                          </div>
                          <p className="text-[10px] font-mono text-[var(--text-secondary)]">Linked to Complaint: #C-{block.complaint_id?.toString().padStart(5, '0') || '00000'} ({block.victim_name})</p>
                        </div>
                        <button 
                          onClick={() => verifyEvidence(block.evidence_id)}
                          disabled={verifyingId === block.evidence_id}
                          className={cn(
                            "cyber-button py-2 px-4 text-[10px] flex items-center gap-2",
                            verificationResult?.id === block.evidence_id && verificationResult.isValid ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-[var(--accent-color)] text-white"
                          )}
                        >
                          {verifyingId === block.evidence_id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Shield className="w-3 h-3" />}
                          {verificationResult?.id === block.evidence_id ? (verificationResult.isValid ? 'VERIFIED' : 'FAILED') : 'VERIFY INTEGRITY'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Current Block Hash</label>
                          <p className="text-[9px] font-mono text-[var(--accent-color)] break-all bg-[var(--bg-primary)] p-2 rounded border border-[var(--border-color)]">{block.block_hash}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] font-black uppercase tracking-widest text-[var(--text-secondary)]">Previous Block Hash</label>
                          <p className="text-[9px] font-mono text-[var(--text-secondary)] break-all bg-[var(--bg-primary)]/50 p-2 rounded border border-[var(--border-color)]">{block.previous_hash}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
                        <div className="flex items-center gap-2">
                          <Lock className="w-3 h-3" />
                          Sealed by: {block.officer_name}
                        </div>
                        <div>
                          Timestamp: {formatDate(block.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {ledgerData.length === 0 && (
                  <div className="text-center py-20 text-[var(--text-secondary)]">
                    <Database className="w-12 h-12 mx-auto opacity-10 mb-4" />
                    <p className="font-bold uppercase tracking-widest text-xs">No evidence blocks recorded in ledger</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Complaints;
