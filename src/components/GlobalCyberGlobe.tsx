import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Loader2, Shield, Zap, Globe as GlobeIcon, AlertTriangle } from 'lucide-react';
import { useTranslate } from '@/hooks/useTranslate';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/firebase';

interface GlobalCyberGlobeProps {
  hideHeader?: boolean;
}

const GlobalCyberGlobe: React.FC<GlobalCyberGlobeProps> = ({ hideHeader = false }) => {
  const { t } = useTranslate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [threats, setThreats] = useState<any[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Globe
    const geometry = new THREE.SphereGeometry(5, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const earthTexture = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-dark.jpg');
    
    const material = new THREE.MeshPhongMaterial({
      map: earthTexture,
      transparent: true,
      opacity: 0.9,
      color: 0x1a1b3a,
      emissive: 0x00f2ff,
      emissiveIntensity: 0.2,
    });
    
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Add some points for cities
    const cities = [
      { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      { name: 'New York', lat: 40.7128, lng: -74.0060 },
      { name: 'London', lat: 51.5074, lng: -0.1278 },
      { name: 'Moscow', lat: 55.7558, lng: 37.6173 },
      { name: 'Beijing', lat: 39.9042, lng: 116.4074 },
      { name: 'Sydney', lat: -33.8688, lng: 151.2093 },
      { name: 'Sao Paulo', lat: -23.5505, lng: -46.6333 },
    ];

    const latLngToVector3 = (lat: number, lng: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const z = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      return new THREE.Vector3(x, y, z);
    };

    cities.forEach(city => {
      const pos = latLngToVector3(city.lat, city.lng, 5.05);
      const dotGeom = new THREE.SphereGeometry(0.05, 16, 16);
      const dotMat = new THREE.MeshBasicMaterial({ color: 0x00f2ff });
      const dot = new THREE.Mesh(dotGeom, dotMat);
      dot.position.copy(pos);
      scene.add(dot);
    });

    // Attack lines
    const createCurve = (start: THREE.Vector3, end: THREE.Vector3) => {
      const distance = start.distanceTo(end);
      const mid = start.clone().lerp(end, 0.5).normalize().multiplyScalar(5 + distance * 0.2);
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: 0xff0066, transparent: true, opacity: 0.6 });
      return new THREE.Line(geometry, material);
    };

    const attackLines: THREE.Line[] = [];
    const addAttack = () => {
      const s = cities[Math.floor(Math.random() * cities.length)];
      const t = cities[Math.floor(Math.random() * cities.length)];
      if (s === t) return;
      
      const startPos = latLngToVector3(s.lat, s.lng, 5);
      const endPos = latLngToVector3(t.lat, t.lng, 5);
      const line = createCurve(startPos, endPos);
      scene.add(line);
      attackLines.push(line);
      
      setTimeout(() => {
        scene.remove(line);
        attackLines.splice(attackLines.indexOf(line), 1);
      }, 3000);
    };

    const attackInterval = setInterval(addAttack, 2000);

    // Atmosphere glow
    const glowGeometry = new THREE.SphereGeometry(5.2, 64, 64);
    const glowMaterial = new THREE.MeshPhongMaterial({
      color: 0x00f2ff,
      transparent: true,
      opacity: 0.05,
      side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(glow);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0x00f2ff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    camera.position.z = 12;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.5;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    setLoading(false);

    // Cleanup
    return () => {
      clearInterval(attackInterval);
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'live_threats'), orderBy('timestamp', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toLocaleTimeString() || new Date().toLocaleTimeString()
      }));
      if (data.length > 0) {
        setThreats(data);
      } else {
        // Fallback to simulation if collection is empty
        const interval = setInterval(() => {
          const newThreat = {
            id: Math.random(),
            source: ['USA', 'China', 'Russia', 'India', 'Brazil'][Math.floor(Math.random() * 5)],
            target: ['India', 'UK', 'Germany', 'Japan', 'Australia'][Math.floor(Math.random() * 5)],
            type: ['DDoS', 'Phishing', 'Malware', 'Ransomware'][Math.floor(Math.random() * 4)],
            severity: ['Critical', 'High', 'Medium'][Math.floor(Math.random() * 3)],
            timestamp: new Date().toLocaleTimeString()
          };
          setThreats(prev => [newThreat, ...prev].slice(0, 10));
        }, 3000);
        return () => clearInterval(interval);
      }
    }, (error) => {
      console.error('Failed to fetch live threats:', error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="p-8 space-y-8 h-full flex flex-col">
      {!hideHeader && (
        <header>
          <h1 className="text-4xl font-bold tracking-tight neon-text uppercase italic flex items-center gap-3">
            <GlobeIcon className="w-10 h-10 text-cyber-blue" />
            {t('global_cyber_warfare_map')}
          </h1>
          <p className="text-slate-400 mt-1">{t('real_time_visualization_desc')}</p>
        </header>
      )}

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
        <div className="lg:col-span-2 glass-card relative overflow-hidden border-cyber-blue/20">
          {loading && (
            <div className="absolute inset-0 z-10 bg-cyber-dark/50 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-cyber-blue animate-spin" />
            </div>
          )}
          <div ref={containerRef} className="w-full h-full cursor-move" />
          
          <div className="absolute bottom-6 left-6 glass-card p-4 border-white/10 bg-cyber-dark/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live Attack</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyber-blue" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fraud Cluster</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6 border-cyber-pink/20">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-cyber-pink">
              <Zap className="w-4 h-4" />
              {t('live_threat_stream')}
            </h3>
            <div className="space-y-4">
              {threats.map((threat) => (
                <motion.div
                  key={threat.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-cyber-blue uppercase tracking-widest">{threat.type}</p>
                    <p className="text-xs text-white font-bold">{threat.source} → {threat.target}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${
                      threat.severity === 'Critical' ? 'bg-red-500/20 border-red-500/50 text-red-400' :
                      threat.severity === 'High' ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' :
                      'bg-cyber-blue/20 border-cyber-blue/50 text-cyber-blue'
                    }`}>
                      {threat.severity}
                    </span>
                    <p className="text-[8px] text-slate-500 mt-1 font-mono">{threat.timestamp}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="glass-card p-6 border-red-500/20 bg-red-500/5">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-red-400">
              <AlertTriangle className="w-4 h-4" />
              {t('ai_threat_alert')}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {t('ai_threat_alert_desc')}
              <span className="text-red-400 font-bold block mt-2">{t('recommended_action')}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalCyberGlobe;
