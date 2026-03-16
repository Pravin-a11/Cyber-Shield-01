import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings as SettingsIcon, Save, RefreshCw, Shield, Bell, 
  Globe, Lock, Users, Database, Server, HardDrive, 
  ShieldAlert, Languages, Clock, Key, UserPlus, UserMinus,
  CheckCircle, AlertTriangle, Info, Activity
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

interface SystemSettings {
  system_name: string;
  org_name: string;
  system_version: string;
  high_risk_threshold: string;
  medium_risk_threshold: string;
  alert_sensitivity: string;
  enable_email: string;
  enable_sms: string;
  language: string;
  date_format: string;
  time_format: string;
  timezone: string;
  password_policy: string;
  two_factor: string;
  session_timeout: string;
  login_limit: string;
}

const Settings: React.FC = () => {
  const { t } = useTranslate();
  const { language, setLanguage } = useUIStore();
  const { user } = useAuthStore();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('system');
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'system_meta', 'settings'), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SystemSettings);
      } else {
        // Default settings
        setSettings({
          system_name: 'CyberShield Omega',
          org_name: 'Cyber Crime Investigation Bureau',
          system_version: 'v4.2.0-stable',
          high_risk_threshold: '85',
          medium_risk_threshold: '60',
          alert_sensitivity: 'High',
          enable_email: 'true',
          enable_sms: 'false',
          language: 'en',
          date_format: 'DD/MM/YYYY',
          time_format: '24h',
          timezone: 'UTC+5:30',
          password_policy: 'Strict',
          two_factor: 'true',
          session_timeout: '30',
          login_limit: '5'
        });
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'system_meta/settings');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      await setDoc(doc(db, 'system_meta', 'settings'), settings);
      setMessage({ text: 'Settings updated successfully', type: 'success' });
      // Update language if changed
      if (settings.language !== language) {
        setLanguage(settings.language);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'system_meta/settings');
      setMessage({ text: 'An error occurred while saving', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const updateSetting = (key: keyof SystemSettings, value: string) => {
    if (!settings) return;
    setSettings({ ...settings, [key]: value });
  };

  const handleAdminAction = async (action: string, data?: any) => {
    setMessage(null);
    try {
      // Simulated admin action since backend is removed
      setMessage({ text: 'Action completed successfully (simulated)', type: 'success' });
    } catch (err) {
      setMessage({ text: 'An error occurred', type: 'error' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const sections = [
    { id: 'system', label: 'System Configuration', icon: Server },
    { id: 'alerts', label: 'Alert Configuration', icon: Bell },
    { id: 'localization', label: 'Localization', icon: Globe },
    { id: 'security', label: 'Security Settings', icon: Lock },
    { id: 'admin', label: 'Admin Control', icon: Users, adminOnly: true },
    { id: 'data', label: 'Data Management', icon: Database, adminOnly: true },
    { id: 'health', label: 'System Health', icon: Activity },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 text-cyber-blue animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 uppercase italic neon-text">
            <SettingsIcon className="w-10 h-10 text-cyber-blue" />
            System Settings
          </h1>
          <p className="text-slate-400 font-medium">Configure global platform parameters and security protocols.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="cyber-button-primary flex items-center gap-2 px-8"
        >
          {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
        </button>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-xl mb-8 flex items-center gap-3 border",
            message.type === 'success' ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"
          )}
        >
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="font-bold">{message.text}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          {sections.map((section) => {
            if (section.adminOnly && user?.role !== 'officer') return null;
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all border",
                  activeSection === section.id 
                    ? "bg-cyber-blue/10 border-cyber-blue text-cyber-blue shadow-[0_0_15px_rgba(0,242,255,0.1)]" 
                    : "bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="w-5 h-5" />
                {section.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-8">
          {activeSection === 'system' && settings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-8 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <Server className="w-6 h-6 text-cyber-blue" />
                  Core System Configuration
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Name</label>
                    <input 
                      type="text" 
                      value={settings.system_name} 
                      onChange={(e) => updateSetting('system_name', e.target.value)}
                      className="cyber-input w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Organization Name</label>
                    <input 
                      type="text" 
                      value={settings.org_name} 
                      onChange={(e) => updateSetting('org_name', e.target.value)}
                      className="cyber-input w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Version</label>
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 font-mono text-sm">
                      {settings.system_version}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Server Status</label>
                    <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-sm">
                      <Activity className="w-4 h-4" />
                      OPERATIONAL
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 flex flex-wrap gap-4">
                  <button 
                    onClick={() => handleAdminAction('rebuild-index')}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Rebuild Database Index
                  </button>
                  <button 
                    onClick={() => handleAdminAction('backup')}
                    className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <HardDrive className="w-4 h-4" />
                    System Backup
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'alerts' && settings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-8 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <ShieldAlert className="w-6 h-6 text-cyber-pink" />
                  Alert & Risk Thresholds
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">High Risk Threshold</label>
                        <span className="text-cyber-pink font-bold">{settings.high_risk_threshold}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={settings.high_risk_threshold} 
                        onChange={(e) => updateSetting('high_risk_threshold', e.target.value)}
                        className="w-full accent-cyber-pink"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Medium Risk Threshold</label>
                        <span className="text-cyber-blue font-bold">{settings.medium_risk_threshold}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={settings.medium_risk_threshold} 
                        onChange={(e) => updateSetting('medium_risk_threshold', e.target.value)}
                        className="w-full accent-cyber-blue"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fraud Alert Sensitivity</label>
                        <span className="text-cyber-purple font-bold">{settings.alert_sensitivity}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" max="100" 
                        value={settings.alert_sensitivity} 
                        onChange={(e) => updateSetting('alert_sensitivity', e.target.value)}
                        className="w-full accent-cyber-purple"
                      />
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div>
                        <p className="font-bold text-white">Email Notifications</p>
                        <p className="text-xs text-slate-500">Send alerts to administrative emails</p>
                      </div>
                      <button 
                        onClick={() => updateSetting('enable_email', settings.enable_email === 'true' ? 'false' : 'true')}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          settings.enable_email === 'true' ? "bg-cyber-blue" : "bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                          settings.enable_email === 'true' ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                      <div>
                        <p className="font-bold text-white">SMS Notifications</p>
                        <p className="text-xs text-slate-500">Send critical alerts via SMS gateway</p>
                      </div>
                      <button 
                        onClick={() => updateSetting('enable_sms', settings.enable_sms === 'true' ? 'false' : 'true')}
                        className={cn(
                          "w-12 h-6 rounded-full transition-all relative",
                          settings.enable_sms === 'true' ? "bg-cyber-blue" : "bg-slate-700"
                        )}
                      >
                        <div className={cn(
                          "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                          settings.enable_sms === 'true' ? "left-7" : "left-1"
                        )} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'localization' && settings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-8 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <Languages className="w-6 h-6 text-cyber-purple" />
                  Regional & Language Settings
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">System Language</label>
                    <select 
                      value={settings.language} 
                      onChange={(e) => updateSetting('language', e.target.value)}
                      className="cyber-input w-full"
                    >
                      <option value="en">English (Global)</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="ta">Tamil (தமிழ்)</option>
                      <option value="te">Telugu (తెలుగు)</option>
                      <option value="kn">Kannada (ಕನ್ನಡ)</option>
                      <option value="ml">Malayalam (മലയാളം)</option>
                      <option value="sa">Sanskrit (संस्कृतम्)</option>
                      <option value="fr">French (Français)</option>
                      <option value="es">Spanish (Español)</option>
                      <option value="de">German (Deutsch)</option>
                      <option value="ja">Japanese (日本語)</option>
                      <option value="zh">Chinese (中文)</option>
                      <option value="ar">Arabic (العربية)</option>
                      <option value="ru">Russian (Русский)</option>
                      <option value="pt">Portuguese (Português)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time Zone</label>
                    <select 
                      value={settings.timezone} 
                      onChange={(e) => updateSetting('timezone', e.target.value)}
                      className="cyber-input w-full"
                    >
                      <option value="IST (UTC+5:30)">IST (UTC+5:30) - India</option>
                      <option value="UTC">UTC (Universal Time)</option>
                      <option value="EST (UTC-5:00)">EST (UTC-5:00) - US East</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Date Format</label>
                    <select 
                      value={settings.date_format} 
                      onChange={(e) => updateSetting('date_format', e.target.value)}
                      className="cyber-input w-full"
                    >
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Time Format</label>
                    <select 
                      value={settings.time_format} 
                      onChange={(e) => updateSetting('time_format', e.target.value)}
                      className="cyber-input w-full"
                    >
                      <option value="24h">24-Hour Clock</option>
                      <option value="12h">12-Hour Clock (AM/PM)</option>
                    </select>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'security' && settings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-8 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <Shield className="w-6 h-6 text-emerald-400" />
                  Access & Security Protocols
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password Policy</label>
                    <select 
                      value={settings.password_policy} 
                      onChange={(e) => updateSetting('password_policy', e.target.value)}
                      className="cyber-input w-full"
                    >
                      <option value="Strong">Strong (Min 12 chars, Symbols, Case)</option>
                      <option value="Medium">Medium (Min 8 chars, Numbers)</option>
                      <option value="Basic">Basic (Min 6 chars)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Session Timeout (Minutes)</label>
                    <input 
                      type="number" 
                      value={settings.session_timeout} 
                      onChange={(e) => updateSetting('session_timeout', e.target.value)}
                      className="cyber-input w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Login Attempt Limit</label>
                    <input 
                      type="number" 
                      value={settings.login_limit} 
                      onChange={(e) => updateSetting('login_limit', e.target.value)}
                      className="cyber-input w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div>
                      <p className="font-bold text-white">Two-Factor Auth</p>
                      <p className="text-xs text-slate-500">Require 2FA for all officer accounts</p>
                    </div>
                    <button 
                      onClick={() => updateSetting('two_factor', settings.two_factor === 'true' ? 'false' : 'true')}
                      className={cn(
                        "w-12 h-6 rounded-full transition-all relative",
                        settings.two_factor === 'true' ? "bg-emerald-500" : "bg-slate-700"
                      )}
                    >
                      <div className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        settings.two_factor === 'true' ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'admin' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-8 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <Users className="w-6 h-6 text-cyber-blue" />
                  Officer Management Panel
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-cyber-blue/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyber-blue/20 flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-cyber-blue" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Invite New Officer</p>
                        <p className="text-xs text-slate-500">Generate a secure invitation link for departmental onboarding</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAdminAction('invite-officer', { email: 'new.officer@cyber.gov', role: 'officer' })}
                      className="px-4 py-2 rounded-lg bg-cyber-blue text-black font-bold text-xs"
                    >
                      Generate Link
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-cyber-pink/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyber-pink/20 flex items-center justify-center">
                        <UserMinus className="w-5 h-5 text-cyber-pink" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Revoke Access</p>
                        <p className="text-xs text-slate-500">Immediately suspend an officer's credentials and session</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAdminAction('remove-officer', { officerId: 'OFF-8821' })}
                      className="px-4 py-2 rounded-lg bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/30 font-bold text-xs"
                    >
                      Manage Access
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:border-cyber-purple/30 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-cyber-purple/20 flex items-center justify-center">
                        <Key className="w-5 h-5 text-cyber-purple" />
                      </div>
                      <div>
                        <p className="font-bold text-white">Reset Credentials</p>
                        <p className="text-xs text-slate-500">Force a password reset for any system user</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleAdminAction('reset-password', { officerId: 'OFF-8821' })}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-xs"
                    >
                      Search User
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'data' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="glass-card p-8 space-y-6">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
                  <Database className="w-6 h-6 text-cyber-blue" />
                  Data & Cache Management
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div>
                      <p className="font-bold text-white">Export System Logs</p>
                      <p className="text-xs text-slate-500">Download encrypted system activity logs in CSV format</p>
                    </div>
                    <button 
                      onClick={() => handleAdminAction('export-logs')}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-xs"
                    >
                      Export CSV
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div>
                      <p className="font-bold text-white">Clear System Cache</p>
                      <p className="text-xs text-slate-500">Flush temporary files and API response cache</p>
                    </div>
                    <button 
                      onClick={() => handleAdminAction('clear-cache')}
                      className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-bold text-xs"
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeSection === 'health' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">CPU Usage</h4>
                    <Activity className="w-4 h-4 text-cyber-blue" />
                  </div>
                  <div className="text-3xl font-black text-white">12%</div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyber-blue h-full w-[12%] shadow-[0_0_8px_rgba(0,242,255,0.5)]" />
                  </div>
                </div>
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Memory</h4>
                    <Database className="w-4 h-4 text-cyber-pink" />
                  </div>
                  <div className="text-3xl font-black text-white">2.4 GB</div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-cyber-pink h-full w-[45%] shadow-[0_0_8px_rgba(255,0,255,0.5)]" />
                  </div>
                </div>
                <div className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Storage</h4>
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-black text-white">128 GB</div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-[15%] shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  </div>
                </div>
              </div>

              <div className="glass-card p-8">
                <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
                  <Server className="w-6 h-6 text-cyber-blue" />
                  Network Monitor
                </h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <div>
                        <p className="font-bold text-white">Primary Database Node</p>
                        <p className="text-[10px] text-slate-500 uppercase">Latency: 4ms | Uptime: 99.99%</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Operational</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                      <div>
                        <p className="font-bold text-white">AI Prediction Engine</p>
                        <p className="text-[10px] text-slate-500 uppercase">Load: 0.2 | Status: Idle</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Operational</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                    <div className="flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                      <div>
                        <p className="font-bold text-white">Global Threat Feed Sync</p>
                        <p className="text-[10px] text-slate-500 uppercase">Last Sync: 2m ago | Rate: 1.2k/s</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Syncing</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const Loader2 = ({ className }: { className?: string }) => (
  <RefreshCw className={cn("animate-spin", className)} />
);

export default Settings;
