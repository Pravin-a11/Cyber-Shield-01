import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, AlertTriangle, ShieldCheck, Phone, Flag } from 'lucide-react';
import { useTranslate } from '@/hooks/useTranslate';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

export const ScamCallAnalyzer: React.FC = () => {
  const { t } = useTranslate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!phoneNumber.trim()) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'scam_calls'), where('phone_number', '==', phoneNumber.trim()));
      const snapshot = await getDocs(q);
      
      if (!snapshot.empty) {
        const data = snapshot.docs[0].data();
        setAnalysis({
          riskLevel: data.risk_level || 'High',
          fraudCategory: data.category || 'Phishing',
          complaintCount: data.reports_count || 1,
          reportedCountries: data.countries || ['Unknown'],
        });
      } else {
        // Fallback for new numbers
        setAnalysis({
          riskLevel: 'Low',
          fraudCategory: 'None',
          complaintCount: 0,
          reportedCountries: [],
        });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'scam_calls');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 glass-card">
      <h2 className="text-2xl font-bold mb-6 neon-text">Scam Call Analyzer</h2>
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Enter phone number..."
          className="flex-1 p-3 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)]"
        />
        <button
          onClick={handleAnalyze}
          className="px-6 py-3 rounded-lg bg-[var(--accent-color)] text-white font-bold hover:opacity-90 transition-all"
        >
          {loading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)]"
        >
          <div className="flex items-center gap-4 mb-4">
            {analysis.riskLevel === 'High' ? (
              <AlertTriangle className="w-10 h-10 text-red-500" />
            ) : (
              <ShieldCheck className="w-10 h-10 text-green-500" />
            )}
            <div>
              <h3 className="text-xl font-bold">Risk Level: {analysis.riskLevel}</h3>
              <p className="text-[var(--text-secondary)]">Category: {analysis.fraudCategory}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-[var(--card-bg)]">
              <p className="text-sm text-[var(--text-secondary)]">Complaints</p>
              <p className="text-2xl font-bold">{analysis.complaintCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-[var(--card-bg)]">
              <p className="text-sm text-[var(--text-secondary)]">Reported Countries</p>
              <p className="text-lg font-bold">{analysis.reportedCountries.join(', ')}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
