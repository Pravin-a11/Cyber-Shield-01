import React, { useEffect, useRef, useState } from 'react';
import { useTranslate } from '@/hooks/useTranslate';
import * as d3 from 'd3';
import { motion } from 'motion/react';
import { Share2, User, Link as LinkIcon, Shield, Zap, Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { handleFirestoreError, OperationType } from '@/lib/firestoreError';

const NetworkGraph: React.FC = () => {
  const { t } = useTranslate();
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const networkDoc = await getDoc(doc(db, 'intelligence_meta', 'network_graph'));
        let data;
        if (networkDoc.exists()) {
          data = networkDoc.data();
        } else {
          data = {
            nodes: [
              { id: 'Kingpin', group: 1, label: t('target_alpha_kingpin') },
              { id: 'Associate 1', group: 2, label: t('money_launderer') },
              { id: 'Associate 2', group: 2, label: t('tech_specialist') },
              { id: 'Associate 3', group: 2, label: t('mule_coordinator') },
              { id: 'Mule 1', group: 3, label: t('mule_102') },
              { id: 'Mule 2', group: 3, label: t('mule_105') },
              { id: 'Mule 3', group: 3, label: t('mule_109') },
              { id: 'Account 1', group: 4, label: t('shell_bank_a') },
              { id: 'Account 2', group: 4, label: t('crypto_mixer') },
            ],
            links: [
              { source: 'Kingpin', target: 'Associate 1', value: 5 },
              { source: 'Kingpin', target: 'Associate 2', value: 5 },
              { source: 'Kingpin', target: 'Associate 3', value: 5 },
              { source: 'Associate 1', target: 'Account 1', value: 2 },
              { source: 'Associate 1', target: 'Account 2', value: 2 },
              { source: 'Associate 3', target: 'Mule 1', value: 1 },
              { source: 'Associate 3', target: 'Mule 2', value: 1 },
              { source: 'Associate 3', target: 'Mule 3', value: 1 },
            ]
          };
        }
        renderGraph(data);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'intelligence_meta/network_graph');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

  const renderGraph = (data: any) => {
    if (!svgRef.current) return;

    const width = 800;
    const height = 600;
// ... rest of the d3 logic ...
    const svg = d3.select(svgRef.current)
      .attr('viewBox', [0, 0, width, height]);

    svg.selectAll('*').remove();

    const simulation = d3.forceSimulation(data.nodes as any)
      .force('link', d3.forceLink(data.links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2));

    const link = svg.append('g')
      .attr('stroke', 'rgba(0, 242, 255, 0.2)')
      .attr('stroke-opacity', 0.6)
      .selectAll('line')
      .data(data.links)
      .join('line')
      .attr('stroke-width', (d: any) => Math.sqrt(d.value));

    const node = svg.append('g')
      .selectAll('g')
      .data(data.nodes)
      .join('g')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    node.append('circle')
      .attr('r', (d: any) => d.group === 1 ? 12 : 8)
      .attr('fill', (d: any) => {
        if (d.group === 1) return '#00f2ff';
        if (d.group === 2) return '#f27d26';
        if (d.group === 3) return '#ef4444';
        return '#94a3b8';
      })
      .attr('stroke', '#0a0b1e')
      .attr('stroke-width', 2);

    node.append('text')
      .text((d: any) => d.label)
      .attr('x', 15)
      .attr('y', 5)
      .attr('fill', '#94a3b8')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold');

    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('transform', (d: any) => `translate(${d.x},${d.y})`);
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

    return () => simulation.stop();
  };

  return (
    <div className="p-8 space-y-8">
      <header>
        <h1 className="text-4xl font-bold tracking-tight neon-text uppercase italic flex items-center gap-3">
          <Share2 className="w-10 h-10 text-cyber-blue" />
          {t('criminal_network_graph')}
        </h1>
        <p className="text-slate-400 mt-1">{t('network_graph_desc')}</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 glass-card relative overflow-hidden border-cyber-blue/20 bg-cyber-dark/50 min-h-[600px]">
          {loading && (
            <div className="absolute inset-0 z-10 bg-cyber-dark/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-cyber-blue animate-spin" />
            </div>
          )}
          <svg ref={svgRef} className="w-full h-full" />
          
          <div className="absolute top-6 right-6 space-y-2">
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 border-white/10">
              <div className="w-3 h-3 rounded-full bg-cyber-blue" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('kingpin')}</span>
            </div>
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 border-white/10">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('associate')}</span>
            </div>
            <div className="flex items-center gap-2 glass-card px-3 py-1.5 border-white/10">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('mule')}</span>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-cyber-blue/20">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-cyber-blue">
              <Shield className="w-4 h-4" />
              {t('network_insights')}
            </h3>
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">{t('centrality_score')}</p>
                <p className="text-lg font-bold text-white">0.94 <span className="text-xs text-cyber-blue">({t('high')})</span></p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">{t('nodes_detected')}</p>
                <p className="text-lg font-bold text-white">124</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <p className="text-[10px] text-slate-500 uppercase font-black mb-1">{t('risk_level')}</p>
                <p className="text-lg font-bold text-red-500 uppercase tracking-tighter">{t('critical')}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 border-orange-500/20">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-orange-400">
              <Zap className="w-4 h-4" />
              {t('active_surveillance')}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('surveillance_desc')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkGraph;
