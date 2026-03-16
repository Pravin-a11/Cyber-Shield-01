import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link, Shield, Clock, Hash, CheckCircle, AlertCircle, Database, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

interface LedgerBlock {
  block_id: number;
  evidence_id: string;
  block_hash: string;
  previous_hash: string;
  timestamp: string;
  verification_status: string;
  title?: string;
}

const EvidenceChain: React.FC = () => {
  const [ledger, setLedger] = useState<LedgerBlock[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'evidence_ledger'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      setLedger(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'evidence_ledger');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center gap-3 uppercase italic neon-text text-[var(--text-primary)]">
          <Link className="w-10 h-10 text-[var(--accent-color)]" />
          Evidence Blockchain Ledger
        </h1>
        <p className="text-[var(--text-secondary)] font-medium">Immutable chain of custody for all digital evidence. Verified via SHA-256 cryptographic hashing.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        {[
          { label: 'Total Blocks', value: ledger.length, icon: Database, color: 'text-[var(--accent-color)]' },
          { label: 'Integrity Status', value: 'Verified', icon: ShieldCheck, color: 'text-emerald-500' },
          { label: 'Network Nodes', value: '12 Active', icon: Lock, color: 'text-cyber-pink' },
          { label: 'Last Sync', value: 'Just Now', icon: Clock, color: 'text-amber-500' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 border-[var(--border-color)] bg-[var(--card-bg)]">
            <stat.icon className={cn("w-6 h-6 mb-4", stat.color)} />
            <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-widest mb-1">{stat.label}</p>
            <h3 className="text-xl font-black text-[var(--text-primary)]">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="relative">
        {/* Vertical Line */}
        <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[var(--accent-color)] via-cyber-pink to-transparent opacity-20" />

        <div className="space-y-12">
          {ledger.map((block, i) => (
            <motion.div
              key={block.block_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="relative pl-20"
            >
              {/* Block Node */}
              <div className="absolute left-[29px] top-0 w-3 h-3 rounded-full bg-[var(--accent-color)] shadow-[0_0_10px_var(--accent-color)] z-10" />
              
              <div className="glass-card p-6 border-[var(--accent-color)]/20 bg-[var(--card-bg)] hover:border-[var(--accent-color)]/50 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20">
                      <Hash className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                        Block #{block.block_id}
                        <span className="text-[10px] font-mono text-[var(--text-secondary)] font-normal">ID: {block.evidence_id}</span>
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">{new Date(block.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle className="w-3 h-3" />
                    {block.verification_status}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Current Hash</p>
                    <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-[10px] text-[var(--accent-color)] break-all">
                      {block.block_hash}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Previous Hash</p>
                    <div className="p-3 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] font-mono text-[10px] text-[var(--text-secondary)] break-all">
                      {block.previous_hash || 'GENESIS_BLOCK'}
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[var(--accent-color)]" />
                    <span className="text-xs text-[var(--text-secondary)] font-medium">Verified by National Cyber Cell Node #04</span>
                  </div>
                  <button className="text-xs font-bold text-[var(--accent-color)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1">
                    View Details
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EvidenceChain;
