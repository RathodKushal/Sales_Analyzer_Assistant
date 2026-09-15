import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * Creates soft Gaussian radial glow particle texture for luminous orbs.
 */
function createGlowTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.9)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.35)');
  gradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.08)');
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Converts Latitude and Longitude to 3D Cartesian Vector.
 */
function latLongToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
}

const PALETTES = {
  aurora: [
    new THREE.Color(0x06b6d4), // Neon Cyan
    new THREE.Color(0x8b5cf6), // Electric Violet
    new THREE.Color(0xec4899), // Vivid Pink
    new THREE.Color(0x10b981), // Emerald
    new THREE.Color(0xf59e0b), // Amber
  ],
  solar: [
    new THREE.Color(0xf59e0b), // Gold
    new THREE.Color(0xef4444), // Crimson
    new THREE.Color(0xf43f5e), // Rose
    new THREE.Color(0xfbbf24), // Amber
    new THREE.Color(0xff7a00), // Orange
  ],
  nebula: [
    new THREE.Color(0xa855f7), // Purple
    new THREE.Color(0x3b82f6), // Royal Blue
    new THREE.Color(0x06b6d4), // Bright Cyan
    new THREE.Color(0x6366f1), // Indigo
    new THREE.Color(0xd946ef), // Hot Fuchsia
  ],
};

// Global CRM Hubs for the 3D Holographic Globe
const CRM_HUBS = [
  { name: 'Mumbai Hub', lat: 19.076, lon: 72.877, deals: '₹94.2M', status: 'High Inflow' },
  { name: 'New York Central', lat: 40.712, lon: -74.006, deals: '$18.4M', status: 'Optimal' },
  { name: 'London Exchange', lat: 51.507, lon: -0.127, deals: '£12.1M', status: 'Active' },
  { name: 'Singapore Gateway', lat: 1.352, lon: 103.819, deals: 'S$14.8M', status: 'Rapid Scale' },
  { name: 'Tokyo Node', lat: 35.676, lon: 139.65, deals: '¥2.4B', status: 'High Retention' },
  { name: 'Frankfurt Core', lat: 50.11, lon: 8.682, deals: '€9.8M', status: 'Reinforced' },
  { name: 'Sydney Outpost', lat: -33.868, lon: 151.209, deals: 'A$7.2M', status: 'Stable' },
];

/**
 * AAA-Grade Three.js 3D Spatial Intelligence Engine
 * Modes:
 * - 'globe': 3D Holographic Earth with Global Flight Arcs, City Hubs & Traveling Photons
 * - 'quantum': GLSL Wave Noise Displaced Liquid Chrome Plasma with Fresnel Edge Glow
 * - 'matrix': Geodesic Polyhedron Lattice with Additive Node Beacons & Orbiting Rings
 * - 'vortex': 1,500+ Particle Swarm with Interactive Gravity Well Suction & Supernova
 */
export default function ThreeSalesOrb({
  className = '',
  palette = 'aurora',
  mode = 'globe', // 'globe', 'quantum', 'matrix', 'vortex'
  interactive = true,
  showRings = true,
  height = '100%',
  width = '100%',
  triggerShockwave = 0,
}) {
  const mountRef = useRef(null);
  const shockwaveFnRef = useRef(null);
  const [hoveredHub, setHoveredHub] = useState(null);
  const [hudPos, setHudPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const colors = PALETTES[palette] || PALETTES.aurora;
    const glowTexture = createGlowTexture();

    // 1. Scene & Depth Fog
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x040407, 0.028);

    // 2. Camera Setup
    const widthPx = container.clientWidth || 400;
    const heightPx = container.clientHeight || 400;
    const camera = new THREE.PerspectiveCamera(45, widthPx / heightPx, 0.1, 120);
    camera.position.z = mode === 'globe' ? 7.8 : 7.2;

    // 3. Renderer with High-End Tone Mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(widthPx, heightPx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // 4. Dynamic Chromatic Lighting
    const ambientLight = new THREE.AmbientLight(0x0c0d1e, 2.2);
    scene.add(ambientLight);

    const lightCyan = new THREE.PointLight(colors[0].getHex(), 60, 20);
    const lightPink = new THREE.PointLight(colors[2].getHex(), 65, 20);
    const lightViolet = new THREE.PointLight(colors[1].getHex(), 55, 20);
    scene.add(lightCyan, lightPink, lightViolet);

    // Master Rotating 3D World Group
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // ==========================================
    // BUILDER 1: 3D HOLOGRAPHIC GLOBE & FLIGHT ARCS
    // ==========================================
    const hubObjects = [];
    const photonPackets = [];

    if (mode === 'globe' || mode === 'matrix') {
      // Holographic Globe Wireframe Core
      const globeRadius = 2.45;
      const globeGeo = new THREE.SphereGeometry(globeRadius, 28, 20);
      const globeMat = new THREE.MeshStandardMaterial({
        color: colors[0].getHex(),
        wireframe: true,
        transparent: true,
        opacity: 0.22,
        roughness: 0.2,
        metalness: 0.9,
        emissive: colors[1].getHex(),
        emissiveIntensity: 0.25,
      });
      const globeMesh = new THREE.Mesh(globeGeo, globeMat);
      masterGroup.add(globeMesh);

      // Inner Glowing Atmospheric Core
      const innerAtmosphereGeo = new THREE.SphereGeometry(globeRadius * 0.92, 24, 20);
      const innerAtmosphereMat = new THREE.MeshBasicMaterial({
        color: colors[1].getHex(),
        transparent: true,
        opacity: 0.15,
        blending: THREE.AdditiveBlending,
      });
      const innerAtmosphere = new THREE.Mesh(innerAtmosphereGeo, innerAtmosphereMat);
      masterGroup.add(innerAtmosphere);

      // Add Major Global Hub Beacons on Sphere Surface
      CRM_HUBS.forEach((hub) => {
        const pos = latLongToVector3(hub.lat, hub.lon, globeRadius);

        // Pulsing Marker Mesh
        const markerGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const markerMat = new THREE.MeshBasicMaterial({
          color: colors[0].getHex(),
          transparent: true,
          opacity: 0.95,
        });
        const markerMesh = new THREE.Mesh(markerGeo, markerMat);
        markerMesh.position.copy(pos);
        markerMesh.userData = hub;

        // Glowing outer beacon ring
        const ringGeo = new THREE.RingGeometry(0.09, 0.15, 20);
        const ringMat = new THREE.MeshBasicMaterial({
          color: colors[2].getHex(),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
        });
        const beaconRing = new THREE.Mesh(ringGeo, ringMat);
        beaconRing.position.copy(pos.clone().multiplyScalar(1.02));
        beaconRing.lookAt(0, 0, 0);

        masterGroup.add(markerMesh);
        masterGroup.add(beaconRing);
        hubObjects.push({ mesh: markerMesh, ring: beaconRing, data: hub });
      });

      // 3D Curved Great-Circle Flight Arcs connecting hubs
      for (let i = 0; i < CRM_HUBS.length; i++) {
        const hubA = CRM_HUBS[i];
        const hubB = CRM_HUBS[(i + 2) % CRM_HUBS.length];

        const vA = latLongToVector3(hubA.lat, hubA.lon, globeRadius);
        const vB = latLongToVector3(hubB.lat, hubB.lon, globeRadius);

        // Control point curved high above globe
        const midPoint = vA.clone().add(vB).multiplyScalar(0.5);
        const distance = vA.distanceTo(vB);
        midPoint.normalize().multiplyScalar(globeRadius + distance * 0.4);

        const curve = new THREE.QuadraticBezierCurve3(vA, midPoint, vB);
        const curvePoints = curve.getPoints(36);
        const arcGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);

        const arcMat = new THREE.LineBasicMaterial({
          color: colors[i % colors.length].getHex(),
          transparent: true,
          opacity: 0.45,
          blending: THREE.AdditiveBlending,
        });

        const arcLine = new THREE.Line(arcGeo, arcMat);
        masterGroup.add(arcLine);

        // Photon pulse packet traveling along the curve
        const photonGeo = new THREE.BufferGeometry();
        photonGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
        const photonMat = new THREE.PointsMaterial({
          size: 0.22,
          map: glowTexture,
          color: colors[i % colors.length].getHex(),
          transparent: true,
          opacity: 0.95,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const photon = new THREE.Points(photonGeo, photonMat);
        masterGroup.add(photon);

        photonPackets.push({
          curve,
          photon,
          geo: photonGeo,
          t: Math.random(),
          speed: 0.006 + Math.random() * 0.005,
        });
      }
    }

    // ==========================================
    // BUILDER 2: GLSL UNDULATING QUANTUM PLASMA CORE
    // ==========================================
    let plasmaMesh = null;
    let plasmaUniforms = null;

    if (mode === 'quantum') {
      plasmaUniforms = {
        uTime: { value: 0 },
        uColorA: { value: colors[0] },
        uColorB: { value: colors[1] },
        uColorC: { value: colors[2] },
      };

      const plasmaGeo = new THREE.IcosahedronGeometry(2.1, 32);
      const plasmaMat = new THREE.ShaderMaterial({
        uniforms: plasmaUniforms,
        vertexShader: `
          uniform float uTime;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vDisplacement;

          void main() {
            vNormal = normal;
            vPosition = position;
            float disp = sin(position.x * 2.8 + uTime * 2.2) * 
                         cos(position.y * 2.8 + uTime * 1.8) * 
                         sin(position.z * 2.8 + uTime * 2.0) * 0.35;
            vDisplacement = disp;
            vec3 newPosition = position + normal * disp;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColorA;
          uniform vec3 uColorB;
          uniform vec3 uColorC;
          varying vec3 vNormal;
          varying vec3 vPosition;
          varying float vDisplacement;

          void main() {
            vec3 viewDir = normalize(-vPosition);
            float fresnel = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), 2.2);
            vec3 color = mix(uColorA, uColorB, vDisplacement * 2.2 + 0.5);
            color = mix(color, uColorC, fresnel * 0.95);
            gl_FragColor = vec4(color + vec3(fresnel * 0.7), 0.9);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
      });

      plasmaMesh = new THREE.Mesh(plasmaGeo, plasmaMat);
      masterGroup.add(plasmaMesh);
    }

    // ==========================================
    // BUILDER 3: VORTEX & PARTICLE ACCELERATOR
    // ==========================================
    const particleCount = mode === 'vortex' ? 1400 : 380;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const particleVelocities = [];

    for (let i = 0; i < particleCount; i++) {
      const theta = (i / particleCount) * Math.PI * 2;
      const radius = mode === 'vortex' 
        ? 1.5 + Math.random() * 4.2 
        : 3.1 + (Math.random() - 0.5) * 0.4;
      
      const px = Math.cos(theta) * radius;
      const py = (Math.random() - 0.5) * (mode === 'vortex' ? 3.5 : 0.4);
      const pz = Math.sin(theta) * radius;

      particlePositions[i * 3] = px;
      particlePositions[i * 3 + 1] = py;
      particlePositions[i * 3 + 2] = pz;

      particleVelocities.push({
        baseRadius: radius,
        theta,
        speed: 0.012 + Math.random() * 0.015,
        yDrift: (Math.random() - 0.5) * 0.02,
      });

      const c = colors[i % colors.length];
      particleColors[i * 3] = c.r;
      particleColors[i * 3 + 1] = c.g;
      particleColors[i * 3 + 2] = c.b;
    }

    const ringGeo = new THREE.BufferGeometry();
    ringGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    ringGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const ringMat = new THREE.PointsMaterial({
      size: mode === 'vortex' ? 0.09 : 0.12,
      map: glowTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const ringParticles = new THREE.Points(ringGeo, ringMat);
    if (showRings || mode === 'vortex') {
      ringParticles.rotation.x = Math.PI / 4;
      masterGroup.add(ringParticles);
    }

    // ==========================================
    // 5. SUPERNOVA SHOCKWAVE PULSE
    // ==========================================
    const shockwaveGeo = new THREE.RingGeometry(0.1, 0.35, 48);
    const shockwaveMat = new THREE.MeshBasicMaterial({
      color: colors[0].getHex(),
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const shockwaveMesh = new THREE.Mesh(shockwaveGeo, shockwaveMat);
    masterGroup.add(shockwaveMesh);

    let shockwaveActive = false;
    let shockwaveScale = 0.2;
    let shockwaveOpacity = 0;

    const fireShockwave = () => {
      shockwaveActive = true;
      shockwaveScale = 0.5;
      shockwaveOpacity = 1.0;
      shockwaveMat.color = colors[Math.floor(Math.random() * colors.length)];
    };
    shockwaveFnRef.current = fireShockwave;

    // ==========================================
    // 6. RAYCASTER & INTERACTION PHYSICS
    // ==========================================
    const raycaster = new THREE.Raycaster();
    const mouseNorm = new THREE.Vector2();
    let isDragging = false;
    let prevMousePos = { x: 0, y: 0 };
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;
    let isHoldingGravity = false;

    const handlePointerDown = (e) => {
      if (!interactive) return;
      isDragging = true;
      isHoldingGravity = true;
      prevMousePos = { x: e.clientX, y: e.clientY };
      fireShockwave();
    };

    const handlePointerMove = (e) => {
      const rect = container.getBoundingClientRect();
      const xPx = e.clientX - rect.left;
      const yPx = e.clientY - rect.top;

      mouseNorm.x = (xPx / rect.width) * 2 - 1;
      mouseNorm.y = -(yPx / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - prevMousePos.x;
        const deltaY = e.clientY - prevMousePos.y;
        targetRotationY += deltaX * 0.009;
        targetRotationX += deltaY * 0.009;
        prevMousePos = { x: e.clientX, y: e.clientY };
      } else {
        targetRotationY = (xPx / rect.width - 0.5) * 1.8;
        targetRotationX = (yPx / rect.height - 0.5) * 1.8;
      }

      // 3D Raycasting check for CRM Hubs
      if (hubObjects.length > 0) {
        raycaster.setFromCamera(mouseNorm, camera);
        const meshes = hubObjects.map((h) => h.mesh);
        const intersects = raycaster.intersectObjects(meshes);

        if (intersects.length > 0) {
          const hit = intersects[0].object;
          setHoveredHub(hit.userData);
          setHudPos({ x: xPx, y: yPx });
          hit.scale.set(1.6, 1.6, 1.6);
        } else {
          setHoveredHub(null);
          hubObjects.forEach((h) => h.mesh.scale.set(1, 1, 1));
        }
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
      isHoldingGravity = false;
    };

    container.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // ==========================================
    // 7. 60 FPS RENDER LOOP
    // ==========================================
    let animationFrameId;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTime) * 0.001;

      // Smooth Rotation Lerp (Damping / Inertia)
      currentRotationX += (targetRotationX - currentRotationX) * 0.065;
      currentRotationY += (targetRotationY - currentRotationY) * 0.065;

      masterGroup.rotation.y = elapsedTime * 0.15 + currentRotationY;
      masterGroup.rotation.x = Math.sin(elapsedTime * 0.2) * 0.1 + currentRotationX;

      // Update GLSL Plasma Uniforms
      if (plasmaUniforms) {
        plasmaUniforms.uTime.value = elapsedTime;
      }

      // Animate Traveling Photons along Global Flight Arcs
      if (photonPackets.length > 0) {
        photonPackets.forEach((p) => {
          p.t += p.speed;
          if (p.t > 1) p.t = 0;
          const pos = p.curve.getPointAt(p.t);
          p.geo.attributes.position.setXYZ(0, pos.x, pos.y, pos.z);
          p.geo.attributes.position.needsUpdate = true;
        });
      }

      // Animate Swarming Vortex Particles
      if (showRings || mode === 'vortex') {
        const pAttr = ringGeo.attributes.position;
        for (let i = 0; i < particleCount; i++) {
          const pv = particleVelocities[i];
          pv.theta += pv.speed * (isHoldingGravity ? 3.0 : 1.0);

          let r = pv.baseRadius;
          if (isHoldingGravity) {
            r *= 0.65; // Gravity well suction towards center
          }

          pAttr.setX(i, Math.cos(pv.theta) * r);
          pAttr.setZ(i, Math.sin(pv.theta) * r);
        }
        pAttr.needsUpdate = true;
      }

      // Animate Shockwave
      if (shockwaveActive) {
        shockwaveScale += 0.14;
        shockwaveOpacity -= 0.035;
        shockwaveMesh.scale.set(shockwaveScale, shockwaveScale, shockwaveScale);
        shockwaveMat.opacity = Math.max(0, shockwaveOpacity);
        if (shockwaveOpacity <= 0) {
          shockwaveActive = false;
        }
      }

      // Orbiting Chromatic Point Lights
      const rad = 5.5;
      lightCyan.position.set(Math.cos(elapsedTime * 1.2) * rad, Math.sin(elapsedTime * 0.8) * 3, Math.sin(elapsedTime * 1.2) * rad);
      lightPink.position.set(-Math.cos(elapsedTime * 1.1) * rad, -Math.sin(elapsedTime * 0.9) * 3, -Math.sin(elapsedTime * 1.1) * rad);
      lightViolet.position.set(0, Math.cos(elapsedTime * 1.5) * rad, Math.sin(elapsedTime * 1.5) * rad);

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      container.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      resizeObserver.disconnect();

      glowTexture.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [palette, mode, interactive, showRings]);

  // Imperative shockwave trigger
  useEffect(() => {
    if (triggerShockwave > 0 && shockwaveFnRef.current) {
      shockwaveFnRef.current();
    }
  }, [triggerShockwave]);

  return (
    <div
      ref={mountRef}
      className={`relative overflow-hidden cursor-grab active:cursor-grabbing select-none ${className}`}
      style={{ width, height }}
      aria-label="AAA 3D Spatial Intelligence Engine"
    >
      {/* 3D Raycasting Live Hover Tooltip */}
      {hoveredHub && (
        <div
          className="absolute z-30 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3 px-3.5 py-2 rounded-xl bg-zinc-950/90 backdrop-blur-2xl border border-cyan-400/50 shadow-[0_8px_30px_rgba(6,182,212,0.4)] text-xs text-white animate-in fade-in zoom-in-95 duration-150"
          style={{ left: hudPos.x, top: hudPos.y }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-extrabold text-cyan-300">{hoveredHub.name}</span>
          </div>
          <p className="text-[11px] text-zinc-300">
            Pipeline Volume: <span className="font-mono font-bold text-emerald-400">{hoveredHub.deals}</span>
          </p>
          <p className="text-[10px] text-zinc-400">
            Status: <span className="text-violet-300 font-semibold">{hoveredHub.status}</span>
          </p>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-zinc-950 border-b border-r border-cyan-400/50 transform rotate-45" />
        </div>
      )}
    </div>
  );
}
