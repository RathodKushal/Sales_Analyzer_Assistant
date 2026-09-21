import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Creates ultra-soft Gaussian radial glow particle texture with high-luminance core.
 */
function createCRMNodeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.18, 'rgba(255, 255, 255, 0.95)');
  gradient.addColorStop(0.35, 'rgba(255, 255, 255, 0.6)');
  gradient.addColorStop(0.65, 'rgba(255, 255, 255, 0.18)');
  gradient.addColorStop(0.9, 'rgba(255, 255, 255, 0.03)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

const THEME_3D_PALETTES = {
  aurora: {
    fog: 0x03040a,
    lights: [0x06b6d4, 0xec4899, 0x8b5cf6],
    colors: [
      new THREE.Color(0x06b6d4), // Cyan: Inflow / Leads
      new THREE.Color(0x8b5cf6), // Violet: Active Deals
      new THREE.Color(0xec4899), // Hot Pink: High-Value VIP
      new THREE.Color(0x10b981), // Emerald: Retention
      new THREE.Color(0xf59e0b), // Amber: Opportunities
    ],
    ringColor: 0x8b5cf6,
  },
  cyber: {
    fog: 0x020508,
    lights: [0x10b981, 0x06b6d4, 0x3b82f6],
    colors: [
      new THREE.Color(0x10b981), // Emerald
      new THREE.Color(0x06b6d4), // Cyan
      new THREE.Color(0x34d399), // Mint
      new THREE.Color(0x3b82f6), // Blue
      new THREE.Color(0x6ee7b7), // Light green
    ],
    ringColor: 0x10b981,
  },
  nebula: {
    fog: 0x04030a,
    lights: [0xa855f7, 0xf43f5e, 0x6366f1],
    colors: [
      new THREE.Color(0xa855f7), // Purple
      new THREE.Color(0x6366f1), // Indigo
      new THREE.Color(0xf43f5e), // Rose
      new THREE.Color(0x38bdf8), // Sky Blue
      new THREE.Color(0xc084fc), // Lavender
    ],
    ringColor: 0xa855f7,
  },
  solar: {
    fog: 0x060304,
    lights: [0xf59e0b, 0xe11d48, 0xf97316],
    colors: [
      new THREE.Color(0xf59e0b), // Amber
      new THREE.Color(0xf97316), // Orange
      new THREE.Color(0xe11d48), // Crimson
      new THREE.Color(0x8b5cf6), // Violet
      new THREE.Color(0xfbbf24), // Gold
    ],
    ringColor: 0xf59e0b,
  },
};

/**
 * FullPageCRMCanvas
 * Full-page immersive 3D CRM Data Universe.
 * Embodies:
 * - Dynamic theme chromatic spectrum
 * - Clustered customer & deal nodes
 * - Luminous synaptic pipelines
 * - Flowing transaction energy packets
 * - Holographic spatial orbital data rings
 * - Smooth natural camera floating & mouse parallax
 */
export default function FullPageCRMCanvas({
  opacity = 0.75,
  interactive = true,
  enableNodes = true,
  theme = 'aurora',
  intensity = 'vibrant',
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const paletteConfig = THEME_3D_PALETTES[theme] || THEME_3D_PALETTES.aurora;
    const nodeTexture = createCRMNodeTexture();

    // 1. Scene & Atmosphere Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(paletteConfig.fog, 0.024);

    // 2. Perspective Camera
    const camera = new THREE.PerspectiveCamera(
      48,
      window.innerWidth / window.innerHeight,
      0.1,
      160
    );
    camera.position.set(0, 0, 14);

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = intensity === 'vibrant' ? 1.4 : intensity === 'subtle' ? 0.9 : 1.15;
    container.appendChild(renderer.domElement);

    // 4. Dynamic Lighting System
    const ambientLight = new THREE.AmbientLight(0x060712, 2.2);
    scene.add(ambientLight);

    const light1 = new THREE.PointLight(paletteConfig.lights[0], 65, 30);
    light1.position.set(-9, 6, 8);
    scene.add(light1);

    const light2 = new THREE.PointLight(paletteConfig.lights[1], 70, 30);
    light2.position.set(9, -5, 7);
    scene.add(light2);

    const light3 = new THREE.PointLight(paletteConfig.lights[2], 75, 35);
    light3.position.set(0, 9, -3);
    scene.add(light3);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    const CRM_COLORS = paletteConfig.colors;

    // --- ELEMENT 1: CRM Customer Network Nodes ---
    const NODE_COUNT = enableNodes ? 110 : 0;
    const nodePositions = [];
    const nodeCoords = [];
    const nodeColors = [];
    const nodeSizes = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      const radius = 4.0 + Math.random() * 9.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.9;

      const x = radius * Math.cos(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.sin(theta) - 2;

      nodeCoords.push(new THREE.Vector3(x, y, z));
      nodePositions.push(x, y, z);

      const color = CRM_COLORS[i % CRM_COLORS.length];
      nodeColors.push(color.r, color.g, color.b);
      nodeSizes.push(0.3 + Math.random() * 0.25);
    }

    let crmNodes = null;
    let nodeGeo = null;
    let nodeMat = null;

    if (enableNodes && NODE_COUNT > 0) {
      nodeGeo = new THREE.BufferGeometry();
      nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
      nodeGeo.setAttribute('color', new THREE.Float32BufferAttribute(nodeColors, 3));

      nodeMat = new THREE.PointsMaterial({
        size: intensity === 'vibrant' ? 0.38 : 0.28,
        map: nodeTexture,
        vertexColors: true,
        transparent: true,
        opacity: intensity === 'vibrant' ? 0.95 : 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      crmNodes = new THREE.Points(nodeGeo, nodeMat);
      masterGroup.add(crmNodes);
    }

    // --- ELEMENT 2: Synaptic Deal Pipelines (Interconnecting Lines) ---
    const linePositions = [];
    const lineColors = [];
    const maxDistance = 4.2;

    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        const dist = nodeCoords[i].distanceTo(nodeCoords[j]);
        if (dist < maxDistance) {
          linePositions.push(
            nodeCoords[i].x, nodeCoords[i].y, nodeCoords[i].z,
            nodeCoords[j].x, nodeCoords[j].y, nodeCoords[j].z
          );

          const c1 = CRM_COLORS[i % CRM_COLORS.length];
          const c2 = CRM_COLORS[j % CRM_COLORS.length];

          lineColors.push(c1.r, c1.g, c1.b);
          lineColors.push(c2.r, c2.g, c2.b);
        }
      }
    }

    let crmLines = null;
    let lineGeo = null;
    let lineMat = null;

    if (enableNodes && linePositions.length > 0) {
      lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
      lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

      lineMat = new THREE.LineBasicMaterial({
        vertexColors: true,
        transparent: true,
        opacity: intensity === 'vibrant' ? 0.25 : 0.16,
        blending: THREE.AdditiveBlending,
      });

      crmLines = new THREE.LineSegments(lineGeo, lineMat);
      masterGroup.add(crmLines);
    }

    // --- ELEMENT 3: Flowing Transaction Energy Packets ---
    const packetCount = enableNodes && linePositions.length > 0 ? 65 : 0;
    const packetPositions = new Float32Array(packetCount * 3);
    const packetPairs = [];

    const totalLines = (linePositions.length / 6) || 1;
    for (let i = 0; i < packetCount; i++) {
      const lineIdx = Math.floor(Math.random() * totalLines) * 6;
      packetPairs.push({
        start: new THREE.Vector3(linePositions[lineIdx], linePositions[lineIdx + 1], linePositions[lineIdx + 2]),
        end: new THREE.Vector3(linePositions[lineIdx + 3], linePositions[lineIdx + 4], linePositions[lineIdx + 5]),
        progress: Math.random(),
        speed: 0.0035 + Math.random() * 0.007,
      });
    }

    let packetPoints = null;
    let packetGeo = null;
    let packetMat = null;

    if (packetCount > 0) {
      packetGeo = new THREE.BufferGeometry();
      packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPositions, 3));

      packetMat = new THREE.PointsMaterial({
        size: 0.26,
        map: nodeTexture,
        color: 0xffffff,
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      packetPoints = new THREE.Points(packetGeo, packetMat);
      masterGroup.add(packetPoints);
    }

    // --- ELEMENT 4: Holographic Orbital Deal Rings ---
    const ringGroup = new THREE.Group();
    const ringRadii = [3.8, 5.2, 7.0];
    const ringMeshes = [];

    ringRadii.forEach((rad, idx) => {
      const ringGeometry = new THREE.BufferGeometry();
      const segments = 90;
      const positions = new Float32Array((segments + 1) * 3);
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        positions[s * 3] = Math.cos(theta) * rad;
        positions[s * 3 + 1] = Math.sin(theta) * rad;
        positions[s * 3 + 2] = 0;
      }
      ringGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      const ringMaterial = new THREE.LineBasicMaterial({
        color: paletteConfig.ringColor,
        transparent: true,
        opacity: 0.09 - idx * 0.02,
        blending: THREE.AdditiveBlending,
      });

      const ring = new THREE.Line(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI * (0.35 + idx * 0.15);
      ring.rotation.y = Math.PI * (0.1 + idx * 0.2);
      ringMeshes.push(ring);
      ringGroup.add(ring);
    });
    masterGroup.add(ringGroup);

    // --- ELEMENT 5: Ambient Floating Spatial Stardust ---
    const dustCount = 480;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 40;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 30;

      const c = CRM_COLORS[i % CRM_COLORS.length];
      dustColors[i * 3] = c.r;
      dustColors[i * 3 + 1] = c.g;
      dustColors[i * 3 + 2] = c.b;
    }

    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.095,
      map: nodeTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    // --- 5. Mouse Parallax and Smooth Camera Inertia ---
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e) => {
      if (!interactive) return;
      targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // --- 6. Window Resize Handler ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // --- 7. Animation Loop with Organic Breathing ---
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Camera easing with smooth damping
      currentX += (targetX - currentX) * 0.035;
      currentY += (targetY - currentY) * 0.035;

      // Organic subtle floating drift
      const naturalDriftX = Math.sin(elapsedTime * 0.35) * 0.6;
      const naturalDriftY = Math.cos(elapsedTime * 0.28) * 0.45;

      camera.position.x = currentX * 2.2 + naturalDriftX;
      camera.position.y = -currentY * 1.8 + naturalDriftY;
      camera.lookAt(0, 0, 0);

      // Slow master universe rotation
      masterGroup.rotation.y = elapsedTime * 0.035 + currentX * 0.18;
      masterGroup.rotation.x = Math.sin(elapsedTime * 0.025) * 0.08 - currentY * 0.12;

      // Holographic Rings slow orbit spin
      ringGroup.rotation.z = elapsedTime * 0.04;
      ringGroup.rotation.y = elapsedTime * 0.02;

      // Move transaction packets between connected customer nodes
      if (packetGeo && packetPairs.length > 0) {
        const posAttr = packetGeo.attributes.position;
        for (let i = 0; i < packetCount; i++) {
          const p = packetPairs[i];
          p.progress += p.speed;
          if (p.progress > 1) {
            p.progress = 0;
          }

          const currPos = new THREE.Vector3().lerpVectors(p.start, p.end, p.progress);
          posAttr.setXYZ(i, currPos.x, currPos.y, currPos.z);
        }
        posAttr.needsUpdate = true;
      }

      // Starfield gentle rotation
      dustPoints.rotation.y = elapsedTime * 0.012;
      dustPoints.rotation.x = Math.sin(elapsedTime * 0.01) * 0.05;

      // Dynamic cinematic light orbits
      light1.position.x = Math.cos(elapsedTime * 0.5) * 11;
      light1.position.z = Math.sin(elapsedTime * 0.5) * 11;
      light2.position.x = -Math.cos(elapsedTime * 0.4) * 11;
      light2.position.z = -Math.sin(elapsedTime * 0.4) * 11;
      light3.position.y = 8 + Math.sin(elapsedTime * 0.3) * 2;

      renderer.render(scene, camera);
    };

    animate();

    // --- 8. Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      if (nodeGeo) nodeGeo.dispose();
      if (nodeMat) nodeMat.dispose();
      if (lineGeo) lineGeo.dispose();
      if (lineMat) lineMat.dispose();
      if (packetGeo) packetGeo.dispose();
      if (packetMat) packetMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      nodeTexture.dispose();
      renderer.dispose();

      ringMeshes.forEach((r) => {
        r.geometry.dispose();
        r.material.dispose();
      });

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, enableNodes, theme, intensity]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none select-none z-[1] overflow-hidden transition-opacity duration-1000"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
