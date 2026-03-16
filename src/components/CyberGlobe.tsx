import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const CyberGlobe: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Get CSS variables for colors
    const style = getComputedStyle(document.body);
    const accentColorHex = style.getPropertyValue('--accent-color').trim() || '#00f2ff';
    // Convert hex to number for THREE.js
    const accentColor = parseInt(accentColorHex.replace('#', '0x'), 16);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);

    // Globe
    const geometry = new THREE.SphereGeometry(5, 64, 64);
    const material = new THREE.MeshPhongMaterial({
      color: accentColor,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const globe = new THREE.Mesh(geometry, material);
    scene.add(globe);

    // Inner glow globe
    const innerGeometry = new THREE.SphereGeometry(4.9, 64, 64);
    const innerMaterial = new THREE.MeshBasicMaterial({
      color: 0x001a33, // Keep this dark for contrast
      transparent: true,
      opacity: 0.5,
    });
    const innerGlobe = new THREE.Mesh(innerGeometry, innerMaterial);
    scene.add(innerGlobe);

    // Points (Simulated attacks)
    const pointsGeometry = new THREE.BufferGeometry();
    const pointsCount = 100;
    const positions = new Float32Array(pointsCount * 3);
    for (let i = 0; i < pointsCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / pointsCount);
      const theta = Math.sqrt(pointsCount * Math.PI) * phi;
      positions[i * 3] = 5 * Math.cos(theta) * Math.sin(phi);
      positions[i * 3 + 1] = 5 * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = 5 * Math.cos(phi);
    }
    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMaterial = new THREE.PointsMaterial({ color: 0xff00ff, size: 0.1 }); // Keep pink for contrast
    const points = new THREE.Points(pointsGeometry, pointsMaterial);
    scene.add(points);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(accentColor, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    camera.position.z = 12;

    const animate = () => {
      requestAnimationFrame(animate);
      globe.rotation.y += 0.002;
      points.rotation.y += 0.002;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;
};

export default CyberGlobe;
