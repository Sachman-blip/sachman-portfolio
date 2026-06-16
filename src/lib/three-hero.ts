import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

// CAD models shown in the 3D gallery. Drop optimized STLs into
// /public/assets/models and add an entry here. A procedural placeholder shows
// if none load. (Run scripts/optimize-stl.cjs on raw CAD exports first —
// raw STL assemblies are tens of MB and will not load on the web.)
type ModelDef = { file: string; label: string };
const MODELS: ModelDef[] = [
  { file: 'f1.stl', label: 'Red Bull RB16B · F1' },
  { file: 'v12.stl', label: 'V12 Engine Assembly' },
  { file: 'roboarm.stl', label: '6-DOF Robotic Arm' },
];
const MODEL_PATH = (file: string) => `/assets/models/${file}`;

function accentColor(): THREE.Color {
  const v = getComputedStyle(document.documentElement).getPropertyValue('--acc').trim();
  return new THREE.Color(v || '#c8ff00');
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

export function initThree(): void {
  const canvas = document.getElementById('threeCanvas') as HTMLCanvasElement | null;
  const section = document.getElementById('three');
  const switcher = document.getElementById('labModels');
  const nameEl = document.getElementById('labName');
  if (!canvas || !section) return;

  if (!webglAvailable()) {
    canvas.style.background = 'radial-gradient(circle at 60% 40%, #16161a, #0a0a0b)';
    return;
  }

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  scene.add(new THREE.AmbientLight(0xffffff, 0.4));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(4, 6, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-5, 2, 3);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(accentColor(), 3);
  rim.position.set(-6, -3, -4);
  scene.add(rim);

  // group holds the current object; we rotate the group.
  const group = new THREE.Group();
  scene.add(group);

  const material = new THREE.MeshStandardMaterial({
    color: 0xb8b8bd,
    metalness: 0.55,
    roughness: 0.42,
  });

  const clearGroup = () => {
    for (let i = group.children.length - 1; i >= 0; i--) {
      const child = group.children[i] as THREE.Mesh;
      group.remove(child);
      child.geometry?.dispose();
    }
  };

  const fitGeometry = (geo: THREE.BufferGeometry) => {
    geo.computeBoundingBox();
    const box = geo.boundingBox!;
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    geo.translate(-center.x, -center.y, -center.z);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const scale = 3.4 / maxDim;
    geo.scale(scale, scale, scale);
    geo.computeVertexNormals();
  };

  const buildProcedural = () => {
    clearGroup();
    const geo = new THREE.IcosahedronGeometry(1.7, 0);
    const solid = new THREE.Mesh(
      geo,
      new THREE.MeshStandardMaterial({ color: 0x121214, metalness: 0.6, roughness: 0.35, flatShading: true })
    );
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: accentColor() })
    );
    group.add(solid, edges);
    if (nameEl) nameEl.textContent = 'Placeholder · drop an STL';
  };

  const loader = new STLLoader();
  const loadModel = (i: number) => {
    const def = MODELS[i];
    loader.load(
      MODEL_PATH(def.file),
      (geo) => {
        clearGroup();
        fitGeometry(geo);
        group.add(new THREE.Mesh(geo, material));
        group.rotation.set(0, 0, 0);
        spin = 0;
        tiltX = 0;
        if (nameEl) nameEl.textContent = def.label;
        setActive(i);
      },
      undefined,
      buildProcedural
    );
  };

  const setActive = (i: number) => {
    switcher?.querySelectorAll('button').forEach((b) => {
      b.classList.toggle('on', Number((b as HTMLElement).dataset.i) === i);
    });
  };

  // Detect which model files exist, then build the switcher.
  const detect = async () => {
    const found: number[] = [];
    for (let i = 0; i < MODELS.length; i++) {
      try {
        const res = await fetch(MODEL_PATH(MODELS[i].file), { method: 'HEAD' });
        // guard against dev-server HTML fallbacks returning 200 for missing files
        const type = res.headers.get('content-type') || '';
        if (res.ok && !type.includes('text/html')) found.push(i);
      } catch {
        /* ignore */
      }
    }

    if (found.length === 0) {
      buildProcedural();
      return;
    }

    if (switcher) {
      switcher.innerHTML = '';
      found.forEach((i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.i = String(i);
        b.dataset.cursor = 'view';
        b.textContent = String(i + 1).padStart(2, '0');
        b.addEventListener('click', () => loadModel(i));
        switcher.appendChild(b);
      });
    }
    loadModel(found[0]);
  };
  detect();

  const resize = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  addEventListener('resize', resize);

  // ----- interaction: drag to rotate with inertia -----
  let spin = reduce ? 0.5 : 0; // auto-spin accumulator (y)
  let velX = 0;
  let velY = 0;
  let tiltX = 0; // extra rotation.x from drag
  let dragging = false;
  let lastX = 0;
  let lastY = 0;

  const down = (e: PointerEvent) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    canvas.classList.add('grabbing');
  };
  const moveDrag = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    velY = dx * 0.01;
    velX = dy * 0.01;
    spin += velY;
    tiltX += velX;
  };
  const up = () => {
    dragging = false;
    canvas.classList.remove('grabbing');
  };
  canvas.addEventListener('pointerdown', down);
  addEventListener('pointermove', moveDrag);
  addEventListener('pointerup', up);

  // scroll-linked tilt across the pinned section
  const scrollRot = { y: 0 };
  if (!reduce) {
    gsap.to(scrollRot, {
      y: Math.PI * 1.5,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: 'bottom bottom', scrub: true },
    });
  }

  let visible = false;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting), { threshold: 0 }).observe(section);

  const accObserver = new MutationObserver(() => rim.color.copy(accentColor()));
  accObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });

  let raf = 0;
  const clock = new THREE.Clock();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!visible) return;
    const dt = clock.getDelta();

    if (!dragging) {
      // inertia decay
      velX *= 0.94;
      velY *= 0.94;
      spin += velY;
      tiltX += velX;
      if (!reduce) spin += dt * 0.18; // idle auto-spin
    }

    group.rotation.y = spin + scrollRot.y;
    group.rotation.x = tiltX + Math.sin(scrollRot.y * 0.5) * 0.2;
    renderer.render(scene, camera);
  };
  loop();

  if (reduce) {
    cancelAnimationFrame(raf);
    setTimeout(() => renderer.render(scene, camera), 80);
  }
}
