import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as d3 from 'd3';
import { 
  Zap, Search, Network, FileText, User, Shield, 
  AlertCircle, ChevronRight, Share2, Download, 
  Filter, Activity, Eye, ExternalLink, Hash,
  Database, Globe, Lock, Loader2, RefreshCw
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useTranslate } from '@/hooks/useTranslate';
import { cn } from '@/lib/utils';
import GlobalCyberGlobe from './GlobalCyberGlobe';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

interface Node extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  group: 'criminal' | 'bank' | 'location' | 'transaction';
}

interface Link extends d3.SimulationLinkDatum<Node> {
  source: string;
  target: string;
  value?: number;
}

const Intelligence: React.FC = () => {
  const { t } = useTranslate();
  const [activeTab, setActiveTab] = useState<'analytics' | 'search' | 'dossier' | 'prediction' | 'globe'>('analytics');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingDossier, setLoadingDossier] = useState(false);
  const [intelligenceFeed, setIntelligenceFeed] = useState<any[]>([]);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoadingSearch(true);
    try {
      // Simple search in Firestore
      const q = query(
        collection(db, 'criminals'),
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSearchResults(results);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'criminals');
    } finally {
      setLoadingSearch(false);
    }
  };

  const exportDossier = () => {
    if (!selectedEntity) return;

    const doc = new jsPDF();
    const title = `INTELLIGENCE DOSSIER: ${selectedEntity.name}`;
    
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    
    doc.setFontSize(10);
    doc.text(`Entity ID: ${selectedEntity.id}`, 14, 30);
    doc.text(`Alias: ${selectedEntity.alias}`, 14, 35);
    doc.text(`Risk Level: ${selectedEntity.risk_level}`, 14, 40);
    doc.text(`Generated At: ${new Date().toLocaleString()}`, 14, 45);

    // Biometrics
    doc.setFontSize(14);
    doc.text("Biometric Profile", 14, 60);
    const bioData = Object.entries(selectedEntity.biometrics || {}).map(([k, v]) => [k.replace('_', ' ').toUpperCase(), v]);
    autoTable(doc, {
      startY: 65,
      head: [['Metric', 'Value']],
      body: bioData as any,
    });

    // Financial
    doc.setFontSize(14);
    doc.text("Financial Footprint", 14, (doc as any).lastAutoTable.finalY + 15);
    const finData = (selectedEntity.financial_footprint || []).map((f: any) => [f.date, f.activity, `Rs. ${f.amount}`, f.status]);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Date', 'Activity', 'Amount', 'Status']],
      body: finData,
    });

    // Timeline
    doc.setFontSize(14);
    doc.text("Intelligence Timeline", 14, (doc as any).lastAutoTable.finalY + 15);
    const timeData = (selectedEntity.timeline || []).map((t: any) => [t.date, t.event]);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Date', 'Event']],
      body: timeData,
    });

    doc.save(`Dossier_${selectedEntity.id}.pdf`);
  };

  const fetchDossier = async (id: string) => {
    setLoadingDossier(true);
    try {
      const docRef = doc(db, 'intelligence_dossiers', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setSelectedEntity({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Try to fetch from criminals if not in dossiers
        const criminalRef = doc(db, 'criminals', id);
        const criminalSnap = await getDoc(criminalRef);
        if (criminalSnap.exists()) {
          setSelectedEntity({ id: criminalSnap.id, ...criminalSnap.data() });
        }
      }
      setActiveTab('dossier');
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'intelligence_dossiers');
    } finally {
      setLoadingDossier(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'analytics') {
      // fetchAnalyticsData();
    }
  }, [activeTab]);

  const fetchNetworkData = async () => {
    setLoading(true);
    try {
      // In a real app, this would be a complex query or a pre-computed graph
      // For now, we'll fetch from a 'network_graph' collection or mock it
      const networkDoc = await getDoc(doc(db, 'intelligence_meta', 'network_graph'));
      if (networkDoc.exists()) {
        const data = networkDoc.data();
        renderNetwork(data.nodes, data.links);
      } else {
        // Mock data if Firestore doesn't have it yet
        const mockNodes: Node[] = [
          { id: '1', name: 'Syndicate X', group: 'criminal' },
          { id: '2', name: 'Global Bank', group: 'bank' },
          { id: '3', name: 'Mumbai Server', group: 'location' },
        ];
        const mockLinks: Link[] = [
          { source: '1', target: '2', value: 1 },
          { source: '1', target: '3', value: 1 },
        ];
        renderNetwork(mockNodes, mockLinks);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'intelligence_meta');
    } finally {
      setLoading(false);
    }
  };

  const renderNetwork = (nodes: Node[], links: Link[]) => {
    if (!svgRef.current) return;

    const width = svgRef.current.clientWidth;
    const height = 600;

    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height]);

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2));

    const link = svg.append("g")
      .attr("stroke", "rgba(0, 242, 255, 0.2)")
      .attr("stroke-width", 1)
      .selectAll("line")
      .data(links)
      .join("line");

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .on("click", (event, d) => {
        if (d.group === 'criminal') {
          fetchDossier(d.id);
        }
      })
      .call(d3.drag<any, any>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    node.append("circle")
      .attr("r", (d) => d.group === 'criminal' ? 8 : 5)
      .attr("fill", (d) => d.group === 'criminal' ? "#FF006B" : "#00F2FF")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("class", "shadow-glow");

    node.append("text")
      .attr("x", 12)
      .attr("y", 4)
      .text(d => d.name)
      .attr("fill", "#94a3b8")
      .attr("font-size", "10px")
      .attr("font-family", "JetBrains Mono");

    simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      node
        .attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3 uppercase italic neon-text">
            <Zap className="w-10 h-10 text-cyber-blue" />
            Intelligence Hub
          </h1>
          <p className="text-slate-400 font-medium">Advanced fraud network analysis and entity profiling engine.</p>
        </div>
        
        <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'analytics' ? "bg-cyber-blue text-black" : "text-slate-400 hover:text-white"
            )}
          >
            <Activity className="w-4 h-4" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'search' ? "bg-cyber-blue text-black" : "text-slate-400 hover:text-white"
            )}
          >
            <Search className="w-4 h-4" />
            Entity Search
          </button>
          <button
            onClick={() => setActiveTab('dossier')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'dossier' ? "bg-cyber-blue text-black" : "text-slate-400 hover:text-white"
            )}
          >
            <FileText className="w-4 h-4" />
            Dossier Engine
          </button>
          <button
            onClick={() => setActiveTab('prediction')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'prediction' ? "bg-cyber-blue text-black" : "text-slate-400 hover:text-white"
            )}
          >
            <Activity className="w-4 h-4" />
            AI Prediction
          </button>
          <button
            onClick={() => setActiveTab('globe')}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
              activeTab === 'globe' ? "bg-cyber-blue text-black" : "text-slate-400 hover:text-white"
            )}
          >
            <Globe className="w-4 h-4" />
            Attack Globe
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-3 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'analytics' && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-card p-6 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <Activity className="w-6 h-6 text-cyber-blue" />
                      Fraud Trends Analysis
                    </h3>
                    <div className="space-y-4">
                      {[
                        { label: 'UPI Phishing', value: 78, trend: '+12%', color: 'bg-cyber-blue' },
                        { label: 'Identity Theft', value: 45, trend: '-5%', color: 'bg-cyber-pink' },
                        { label: 'Card Cloning', value: 62, trend: '+8%', color: 'bg-cyber-purple' },
                        { label: 'Social Engineering', value: 89, trend: '+15%', color: 'bg-red-500' },
                      ].map((trend, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10">
                          <div className="flex justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{trend.label}</span>
                            <span className={cn("text-xs font-bold uppercase", trend.trend.startsWith('+') ? "text-red-400" : "text-emerald-400")}>
                              {trend.trend}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${trend.value}%` }}
                              className={cn("h-full", trend.color)} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="glass-card p-6 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <AlertCircle className="w-6 h-6 text-red-500" />
                      Recent Intelligence Alerts
                    </h3>
                    <div className="space-y-4">
                      {[
                        { title: 'New Malware Variant', desc: 'A new variant of "CyberShield-Killer" has been detected targeting government servers.', time: '10m ago', severity: 'Critical' },
                        { title: 'Mule Account Cluster', desc: 'A cluster of 50+ mule accounts has been identified in the Delhi region.', time: '45m ago', severity: 'High' },
                        { title: 'Data Leak Alert', desc: 'Credentials from a major telecom provider have appeared on a dark web forum.', time: '2h ago', severity: 'Medium' },
                      ].map((alert, i) => (
                        <div key={i} className="p-4 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden group">
                          <div className={cn(
                            "absolute left-0 top-0 bottom-0 w-1",
                            alert.severity === 'Critical' ? "bg-red-500" : alert.severity === 'High' ? "bg-amber-500" : "bg-cyber-blue"
                          )} />
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-bold text-white">{alert.title}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">{alert.time}</span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{alert.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'search' && (
              <motion.div
                key="search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by IP, Transaction ID, Phone, or Name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-16 pr-6 py-6 bg-white/5 border border-white/10 rounded-3xl focus:outline-none focus:border-cyber-blue/50 transition-all text-xl text-white placeholder:text-slate-600"
                  />
                  {loadingSearch && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-6 h-6 text-cyber-blue animate-spin" />}
                </form>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {searchResults.length === 0 && !loadingSearch && searchQuery && (
                    <div className="col-span-full text-center py-20 text-slate-500">No entities found matching your search.</div>
                  )}
                  {searchResults.map((entity) => (
                    <div key={entity.id} className="glass-card p-6 group hover:border-cyber-blue/30 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                            <User className="w-6 h-6 text-slate-400" />
                          </div>
                          <div>
                            <h4 className="font-bold text-white">{entity.name}</h4>
                            <p className="text-xs text-slate-500">Alias: {entity.alias}</p>
                          </div>
                        </div>
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-widest",
                          entity.risk_level === 'High' ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                        )}>
                          {entity.risk_level} Risk
                        </span>
                      </div>
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">Status</span>
                          <span className="text-cyber-blue font-bold uppercase">{entity.status}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => fetchDossier(entity.id)}
                        className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-cyber-blue hover:text-black transition-all flex items-center justify-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View Full Profile
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'prediction' && (
              <motion.div
                key="prediction"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-card p-8 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <Zap className="w-6 h-6 text-cyber-blue" />
                      AI Fraud Prediction Engine
                    </h3>
                    <p className="text-slate-400 text-sm">Neural network analysis of current transaction patterns to predict upcoming fraud waves.</p>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Predicted Wave Intensity</span>
                          <span className="text-xs font-bold text-red-400 uppercase">High Risk</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 w-[78%]" />
                        </div>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex justify-between mb-2">
                          <span className="text-xs font-bold text-slate-500 uppercase">Confidence Score</span>
                          <span className="text-xs font-bold text-cyber-blue uppercase">92%</span>
                        </div>
                        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-cyber-blue w-[92%]" />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Targeted Sectors</h4>
                      <div className="flex flex-wrap gap-2">
                        {['Retail Banking', 'Crypto Exchanges', 'E-commerce', 'Healthcare'].map(s => (
                          <span key={s} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-slate-400">{s}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-8 space-y-6">
                    <h3 className="text-xl font-bold text-white flex items-center gap-3">
                      <Shield className="w-6 h-6 text-cyber-pink" />
                      Scam Call Detector
                    </h3>
                    <p className="text-slate-400 text-sm">Real-time analysis of voice patterns and metadata to identify fraudulent communication.</p>
                    
                    <div className="p-6 bg-black/40 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-cyber-pink/10 flex items-center justify-center border border-cyber-pink/20 animate-pulse">
                        <Activity className="w-8 h-8 text-cyber-pink" />
                      </div>
                      <p className="text-cyber-pink font-bold uppercase tracking-widest text-xs">Monitoring Active Channels...</p>
                    </div>

                    <div className="space-y-3">
                      {[
                        { phone: '+91 98XXX XXX21', risk: '98%', type: 'Vishing' },
                        { phone: '+91 70XXX XXX10', risk: '85%', type: 'Tech Support' },
                      ].map((c, i) => (
                        <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-bold text-white">{c.phone}</p>
                            <p className="text-[10px] text-slate-500 uppercase">{c.type}</p>
                          </div>
                          <span className="text-xs font-bold text-red-400">{c.risk} Risk</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'globe' && (
              <motion.div
                key="globe"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card min-h-[600px] relative overflow-hidden"
              >
                <GlobalCyberGlobe hideHeader={true} />
              </motion.div>
            )}
            {activeTab === 'dossier' && (
              <motion.div
                key="dossier"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {!selectedEntity ? (
                  <div className="glass-card p-12 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-24 h-24 rounded-3xl bg-cyber-blue/10 flex items-center justify-center border border-cyber-blue/20">
                      <FileText className="w-12 h-12 text-cyber-blue" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">Dossier Generation Engine</h3>
                      <p className="text-slate-400 max-w-md mx-auto">Select an entity from the search or network graph to generate a comprehensive intelligence dossier with AI-powered insights.</p>
                    </div>
                    <button onClick={() => setActiveTab('search')} className="cyber-button">
                      Search Entities
                    </button>
                  </div>
                ) : (
                  <div className="glass-card p-8 space-y-10">
                    {/* Dossier Header */}
                    <div className="flex flex-col md:flex-row justify-between gap-8 border-b border-white/10 pb-8">
                      <div className="flex items-center gap-6">
                        <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                          <User className="w-16 h-16 text-slate-500" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-3xl font-bold text-white">{selectedEntity.name}</h2>
                            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold border border-red-500/30 uppercase tracking-widest">Warrant Issued</span>
                          </div>
                          <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">ID: {selectedEntity.id} | ALIAS: {selectedEntity.alias}</p>
                          <div className="flex gap-4 mt-4">
                            <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Risk Level</p>
                              <p className="text-red-500 font-black">{selectedEntity.risk_level}</p>
                            </div>
                            <div className="text-center px-4 py-2 bg-white/5 rounded-xl border border-white/10">
                              <p className="text-[10px] text-slate-500 uppercase font-bold">Reliability</p>
                              <p className="text-cyber-blue font-black">94%</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={exportDossier}
                          className="cyber-button flex items-center gap-2 justify-center"
                        >
                          <Download className="w-4 h-4" /> Export Dossier
                        </button>
                        <button className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all flex items-center gap-2 justify-center">
                          <Share2 className="w-4 h-4" /> Share Intel
                        </button>
                      </div>
                    </div>

                    {/* Dossier Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-sm font-bold text-cyber-blue uppercase tracking-widest flex items-center gap-2">
                          <Shield className="w-4 h-4" /> Biometric Profile
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(selectedEntity.biometrics || {}).map(([key, val]: any) => (
                            <div key={key} className="p-4 bg-white/5 rounded-xl border border-white/10">
                              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">{key.replace('_', ' ')}</p>
                              <p className="text-sm font-bold text-white">{val}</p>
                            </div>
                          ))}
                        </div>

                        <h4 className="text-sm font-bold text-cyber-blue uppercase tracking-widest flex items-center gap-2 mt-8">
                          <Activity className="w-4 h-4" /> Financial Footprint
                        </h4>
                        <div className="space-y-3">
                          {(selectedEntity.financial_footprint || []).map((f: any, i: number) => (
                            <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
                              <div>
                                <p className="text-sm font-bold text-white">{f.activity}</p>
                                <p className="text-[10px] text-slate-500">{f.date}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold text-red-400">₹{f.amount.toLocaleString()}</p>
                                <p className="text-[10px] text-slate-500 uppercase">{f.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-sm font-bold text-cyber-blue uppercase tracking-widest flex items-center gap-2">
                          <Network className="w-4 h-4" /> Known Associates
                        </h4>
                        <div className="space-y-3">
                          {(selectedEntity.known_associates || []).map((a: any, i: number) => (
                            <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-500" />
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-bold text-white">{a.name}</p>
                                <p className="text-[10px] text-slate-500">{a.relationship}</p>
                              </div>
                              <span className="text-[10px] font-bold text-red-400 uppercase">{a.risk} Risk</span>
                            </div>
                          ))}
                        </div>

                        <h4 className="text-sm font-bold text-cyber-blue uppercase tracking-widest flex items-center gap-2 mt-8">
                          <ChevronRight className="w-4 h-4" /> Intelligence Timeline
                        </h4>
                        <div className="space-y-4 relative pl-4 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-white/10">
                          {(selectedEntity.timeline || []).map((t: any, i: number) => (
                            <div key={i} className="relative">
                              <div className="absolute left-[-20px] top-1.5 w-2 h-2 rounded-full bg-cyber-blue" />
                              <p className="text-[10px] text-slate-500 font-bold uppercase">{t.date}</p>
                              <p className="text-xs text-slate-300">{t.event}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Intelligence Feed */}
        <div className="space-y-6">
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyber-blue" />
              Global Threat Feed
            </h3>
            <div className="space-y-6">
              {[
                { tag: 'Ransomware', msg: 'LockBit 3.0 variant detected in Southeast Asia financial sector.', time: '5m ago', color: 'text-red-400' },
                { tag: 'Phishing', msg: 'New UPI-themed phishing kit "BharatSafe" spreading via SMS.', time: '12m ago', color: 'text-yellow-400' },
                { tag: 'Data Breach', msg: 'Potential leak of 2M records from major e-commerce provider.', time: '24m ago', color: 'text-cyber-blue' },
                { tag: 'Botnet', msg: 'Mirai variant "CyberShield-Killer" targeting IoT devices.', time: '1h ago', color: 'text-cyber-pink' },
                { tag: 'Zero-Day', msg: 'Critical vulnerability in popular enterprise VPN discovered.', time: '2h ago', color: 'text-red-500' },
              ].map((news, i) => (
                <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-white/10">
                  <div className="absolute left-[-4px] top-1.5 w-2 h-2 rounded-full bg-cyber-blue" />
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10", news.color)}>
                      {news.tag}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase font-mono">{news.time}</span>
                  </div>
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {news.msg}
                  </p>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 text-xs font-bold text-slate-400 hover:text-cyber-blue transition-colors flex items-center justify-center gap-2">
              Deep Web Monitoring
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>

          <div className="glass-card p-6 bg-gradient-to-br from-cyber-blue/10 to-transparent border-cyber-blue/20">
            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyber-blue" />
              AI Risk Assessment
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              The neural engine has detected a 14% increase in UPI-based phishing attempts over the last 24 hours.
            </p>
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                <span className="text-slate-500">System Confidence</span>
                <span className="text-cyber-blue">94.2%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-cyber-blue w-[94%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Intelligence;
