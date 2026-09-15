import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Creates soft Gaussian radial glow particle texture for luminous CRM nodes.
 */
function createCRMNodeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.25, 'rgba(255, 255, 255, 0.85)');
  gradient.addColorStop(0.55, 'rgba(255, 255, 255, 0.25)');
  gradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.05)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * FullPageCRMCanvas
 * Full-page immersive 3D CRM Data Universe.
 * Embodies core CRM concepts:
 * - Interconnected Customer & Deal Nodes (VIP, Loyal, At-Risk, Leads)
 * - Dynamic Synaptic Connection Lines (Pipelines & Transactions)
 * - Flowing Transaction Packets traveling along network lines
 * - Orbiting CRM metric rings & spatial currency/deal halos
 * - Full-page responsive camera with mouse parallax inertia
 */
export default function FullPageCRMCanvas({
  opacity = 0.85,
  interactive = true,
  enableNodes = true,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const nodeTexture = createCRMNodeTexture();

    // 1. Scene & Depth Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040406, 0.028);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      150
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
    renderer.toneMappingExposure = 1.3;
    container.appendChild(renderer.domElement);

    // 4. Vibrant Chromatic Lighting (CRM Theme: Cyan, Violet, Pink, Emerald, Amber)
    const ambientLight = new THREE.AmbientLight(0x090a14, 2.5);
    scene.add(ambientLight);

    const cyanLight = new THREE.PointLight(0x06b6d4, 60, 25);
    cyanLight.position.set(-8, 5, 8);
    scene.add(cyanLight);

    const pinkLight = new THREE.PointLight(0xec4899, 65, 25);
    pinkLight.position.set(8, -4, 6);
    scene.add(pinkLight);

    const violetLight = new THREE.PointLight(0x8b5cf6, 70, 30);
    violetLight.position.set(0, 8, -4);
    scene.add(violetLight);

    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- CRM SEGMENTS & CLUSTERS PALETTE ---
    const CRM_COLORS = [
      new THREE.Color(0x06b6d4), // Cyan: New Leads & Inflow
      new THREE.Color(0x8b5cf6), // Violet: Active Deals / Pipelines
      new THREE.Color(0xec4899), // Hot Pink: High-Value VIP Champions
      new THREE.Color(0x10b981), // Emerald: Recurring / Retention
      new THREE.Color(0xf59e0b), // Golden Amber: Churn Risk / Re-engagement
    ];

    // --- ELEMENT 1: CRM Customer Network Nodes ---
    const NODE_COUNT = 90;
    const nodePositions = [];
    const nodeCoords = [];
    const nodeColors = [];

    for (let i = 0; i < NODE_COUNT; i++) {
      // Clustered in 3D spatial field with depth
      const radius = 4.5 + Math.random() * 8.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI * 0.85;

      const x = radius * Math.cos(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi);
      const z = radius * Math.cos(phi) * Math.sin(theta) - 2;

      nodeCoords.push(new THREE.Vector3(x, y, z));
      nodePositions.push(x, y, z);

      const color = CRM_COLORS[i % CRM_COLORS.length];
      nodeColors.push(color.r, color.g, color.b);
    }

    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nodePositions, 3));
    nodeGeo.setAttribute('color', new THREE.Float32BufferAttribute(nodeColors, 3));

    const nodeMat = new THREE.PointsMaterial({
      size: 0.35,
      map: nodeTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const crmNodes = new THREE.Points(nodeGeo, nodeMat);
    masterGroup.add(crmNodes);

    // --- ELEMENT 2: CRM Synaptic Deal Pipelines (Lines connecting nearby customer nodes) ---
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

    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    lineGeo.setAttribute('color', new THREE.Float32BufferAttribute(lineColors, 3));

    const lineMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.22,
      blending: THREE.AdditiveBlending,
    });

    const crmLines = new THREE.LineSegments(lineGeo, lineMat);
    masterGroup.add(crmLines);

    // --- ELEMENT 3: Flowing Transaction Packets (Streaming along network) ---
    const packetCount = 60;
    const packetPositions = new Float32Array(packetCount * 3);
    const packetSpeeds = [];
    const packetPairs = [];

    // Select random connected pairs for transactions to travel between
    const totalLines = linePositions.length / 6;
    for (let i = 0; i < packetCount; i++) {
      const lineIdx = Math.floor(Math.random() * totalLines) * 6;
      packetPairs.push({
        start: new THREE.Vector3(linePositions[lineIdx], linePositions[lineIdx + 1], linePositions[lineIdx + 2]),
        end: new THREE.Vector3(linePositions[lineIdx + 3], linePositions[lineIdx + 4], linePositions[lineIdx + 5]),
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.006,
      });
    }

    const packetGeo = new THREE.BufferGeometry();
    packetGeo.setAttribute('position', new THREE.BufferAttribute(packetPositions, 3));

    const packetMat = new THREE.PointsMaterial({
      size: 0.22,
      map: nodeTexture,
      color: 0xffffff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const packetPoints = new THREE.Points(packetGeo, packetMat);
    masterGroup.add(packetPoints);

    // --- ELEMENT 4: Central CRM Sales Core Halo ---
    const coreGeo = new THREE.IcosahedronGeometry(2.8, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x8b5cf6,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    masterGroup.add(coreMesh);

    // Ambient floating starfield / dust
    const dustCount = 450;
    const dustPositions = new Float32Array(dustCount * 3);
    const dustColors = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPositions[i * 3] = (Math.random() - 0.5) * 35;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * 35;
      dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 25;

      const c = CRM_COLORS[i % CRM_COLORS.length];
      dustColors[i * 3] = c.r;
      dustColors[i * 3 + 1] = c.g;
      dustColors[i * 3 + 2] = c.b;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dustColors, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.09,
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

    // --- 7. Animation Loop ---
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth camera parallax
      currentX += (targetX - currentX) * 0.035;
      currentY += (targetY - currentY) * 0.035;

      camera.position.x = currentX * 2.5;
      camera.position.y = -currentY * 2.0;
      camera.lookAt(0, 0, 0);

      // Slow master rotation for living universe feeling
      masterGroup.rotation.y = elapsedTime * 0.04 + currentX * 0.2;
      masterGroup.rotation.x = Math.sin(elapsedTime * 0.03) * 0.1 - currentY * 0.15;

      coreMesh.rotation.y = elapsedTime * 0.08;
      coreMesh.rotation.z = elapsedTime * 0.05;

      // Move transaction packets between connected nodes
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

      // Starfield gentle rotation
      dustPoints.rotation.y = elapsedTime * 0.015;

      // Dynamic light movement
      cyanLight.position.x = Math.cos(elapsedTime * 0.6) * 10;
      cyanLight.position.z = Math.sin(elapsedTime * 0.6) * 10;
      pinkLight.position.x = -Math.cos(elapsedTime * 0.5) * 10;
      pinkLight.position.z = -Math.sin(elapsedTime * 0.5) * 10;

      renderer.render(scene, camera);
    };

    animate();

    // --- 8. Cleanup ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);

      nodeGeo.dispose();
      nodeMat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      packetGeo.dispose();
      packetMat.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      nodeTexture.dispose();
      renderer.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [interactive, enableNodes]);

  return (
    <div
      ref={mountRef}
      className="fixed inset-0 pointer-events-none select-none z-0 overflow-hidden"
      style={{ opacity }}
      aria-hidden="true"
    />
  );
}
