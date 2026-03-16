import React from 'react';
import { motion } from 'motion/react';
import { Shield, Activity, Search, FileText, Map as MapIcon, Users, Settings, LogOut, Zap, Database, Brain, Clock, Phone, Globe as GlobeIcon } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { auth } from '@/firebase';
import { signOut } from 'firebase/auth';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuthStore();
  const { t } = useTranslate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      logout();
    } catch (err) {
      console.error('Logout error:', err);
      logout(); // Still clear local state
    }
  };

  const menuItems = [
    // Officer Items
    { id: 'dashboard', icon: Activity, label: t('dashboard'), roles: ['officer'] },
    { id: 'complaints', icon: FileText, label: t('complaints'), roles: ['officer'] },
    { id: 'evidence', icon: Database, label: t('evidence_locker'), roles: ['officer'] },
    { id: 'atm_scanner', icon: Zap, label: t('atm_scanner'), roles: ['officer'] },
    { id: 'analytics', icon: Shield, label: t('fraud_analytics'), roles: ['officer'] },
    { id: 'heatmap', icon: MapIcon, label: t('risk_heatmap'), roles: ['officer'] },
    { id: 'cyber_globe', icon: GlobeIcon, label: t('cyber_globe'), roles: ['officer'] },
    { id: 'intelligence', icon: Search, label: t('intelligence'), roles: ['officer'] },
    { id: 'criminals', icon: Users, label: t('criminal_db'), roles: ['officer'] },
    { id: 'officers', icon: Users, label: t('officer_management'), roles: ['officer'] },
    
    // Citizen Items
    { id: 'home', icon: Activity, label: t('home'), roles: ['citizen'] },
    { id: 'submit_complaint', icon: FileText, label: t('submit_complaint'), roles: ['citizen'] },
    { id: 'complaint_status', icon: Clock, label: t('complaint_status'), roles: ['citizen'] },
    { id: 'scam_tracker', icon: Phone, label: t('scam_tracker'), roles: ['citizen'] },
    { id: 'scam_call_analyzer', icon: Phone, label: t('scam_call_analyzer'), roles: ['officer'] },
    { id: 'ai_assistant', icon: Brain, label: t('ai_assistant'), roles: ['citizen'] },

    // Common
    { id: 'settings', icon: Settings, label: t('settings'), roles: ['citizen', 'officer'] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role || 'citizen'));

  return (
    <motion.aside
      className="h-screen w-[260px] glass-card border-r border-white/10 flex flex-col sticky top-0 z-50 bg-black/20"
    >
      <div className="p-6 flex items-center">
        <div className="flex items-center gap-2">
          <Shield className="w-8 h-8 text-[var(--accent-color)]" />
          <span className="font-bold text-xl tracking-tighter neon-text text-[var(--accent-color)]">OMEGA</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group",
              activeTab === item.id 
                ? "bg-[var(--accent-color)]/10 text-[var(--accent-color)] border border-[var(--accent-color)]/20" 
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] hover:text-[var(--text-primary)]"
            )}
          >
            <item.icon className={cn("w-6 h-6 flex-shrink-0", activeTab === item.id && "drop-shadow-[0_0_8px_var(--accent-color)]")} />
            <span className="font-medium whitespace-nowrap block">{item.label}</span>
            {activeTab === item.id && (
              <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--accent-color)] shadow-[0_0_8px_var(--accent-color)]" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--border-color)]">
        <div className="mb-4 px-4">
          <p className="text-xs text-[var(--text-secondary)] uppercase tracking-widest font-bold">{t('user_profile')}</p>
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{user?.name}</p>
          <p className="text-[10px] text-[var(--accent-color)] uppercase font-bold">{user?.role}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-red-500 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-6 h-6" />
          <span className="font-medium">{t('logout')}</span>
        </button>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
