const sectionButtons = document.querySelectorAll('[data-scroll-target]');
for (const button of sectionButtons) {
  button.addEventListener('click', () => document.getElementById(button.dataset.scrollTarget)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
}

// Optional repository metadata: failures and rate limits never block the site.
async function refreshRepoStatuses() {
  const refs = [...document.querySelectorAll('[data-repo]')];
  for (const label of refs) {
    try {
      const response = await fetch(`https://api.github.com/repos/sialock/${encodeURIComponent(label.dataset.repo)}`, {
        headers: { Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(5000)
      });
      if (!response.ok) continue;
      const repo = await response.json();
      if (typeof repo.stargazers_count === 'number' && repo.stargazers_count > 0) {
        label.textContent = `★ ${repo.stargazers_count} · Public`;
      }
    } catch {
      // The static fallback is always meaningful without network requests.
    }
  }
}
refreshRepoStatuses();

const canvas = document.getElementById('universe');
if (canvas) {
  initUniverse().catch((error) => {
    console.info('Molecular scene unavailable; displaying static fallback.', error);
    canvas.style.display = 'none';
  });
}

async function initUniverse() {
  // No build step. A pinned Three.js module is loaded at runtime from a public CDN.
  const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js');
  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.6;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.65));
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 250);
  const universe = new THREE.Group();
  scene.add(universe);
  scene.add(new THREE.AmbientLight(0x8ba2ff, 1.65));
  function light(color, intensity, x, y, z) {
    const l = new THREE.PointLight(color, intensity, 30);
    l.position.set(x, y, z); scene.add(l);
  }
  light(0x56dcff, 95, -3, -1, 7);
  light(0xba73ff, 85, 2, 4, 6);
  light(0xffa465, 70, 6, -3, 6);

  // Repeatable procedural stars, so each page load keeps the same composition.
  let seed = 19471;
  const rand = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const starData = new Float32Array(1700 * 3);
  for (let i = 0; i < starData.length; i += 3) {
    starData[i] = (rand() - 0.5) * 58;
    starData[i + 1] = (rand() - 0.5) * 30;
    starData[i + 2] = -15 - rand() * 45;
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.BufferAttribute(starData, 3));
  const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({ color: 0xdedcff, size: 0.07, transparent: true, opacity: 0.82, sizeAttenuation: true }));
  scene.add(stars);

  const central = new THREE.Group();
  central.position.set(0.85, -0.04, -2.6);
  universe.add(central);
  const disc = new THREE.Mesh(
    new THREE.TorusGeometry(1.3, 0.19, 10, 200),
    new THREE.MeshBasicMaterial({ color: 0x9047f8, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  disc.scale.set(1.35, 0.25, 1);
  central.add(disc);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 28, 18), new THREE.MeshBasicMaterial({ color: 0xf6d7ff, transparent: true, opacity: 0.92 }));
  central.add(core);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(0.65, 28, 18), new THREE.MeshBasicMaterial({ color: 0x9c6afb, transparent: true, opacity: 0.14, blending: THREE.AdditiveBlending, depthWrite: false }));
  central.add(halo);

  const orbitMat = new THREE.LineBasicMaterial({ color: 0xb18cff, transparent: true, opacity: 0.4 });
  const orbits = new THREE.Group();
  orbits.position.set(0.75, 0, -2.2);
  for (let j = 0; j < 2; j++) {
    const positions = [];
    for (let i = 0; i <= 250; i++) {
      const a = (i / 250) * Math.PI * 2;
      positions.push(new THREE.Vector3(Math.cos(a) * (3.35 + j * 0.2), Math.sin(a) * (1.52 + j * 0.16), Math.sin(a) * (0.55 + j * 0.15)));
    }
    const orbit = new THREE.Line(new THREE.BufferGeometry().setFromPoints(positions), orbitMat);
    orbit.rotation.z = j === 0 ? 0.2 : -0.21;
    orbits.add(orbit);
  }
  universe.add(orbits);

  function material(color, opacity = 1) {
    return new THREE.MeshPhysicalMaterial({ color, emissive: color, emissiveIntensity: 0.26, metalness: 0.12, roughness: 0.25, transparent: opacity < 1, opacity, clearcoat: 0.65 });
  }
  function tube(points, color, radius = 0.055, opacity = 1, seg = 90) {
    const curve = new THREE.CatmullRomCurve3(points);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, seg, radius, 9, false), material(color, opacity));
  }
  function sphere(radius, color, opacity = 1, detail = 2) {
    return new THREE.Mesh(new THREE.IcosahedronGeometry(radius, detail), material(color, opacity));
  }
  function planetShell(group, radius, main, glow) {
    const body = sphere(radius, main, 0.76, 4);
    group.add(body);
    const edge = new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 1.012, 3), new THREE.MeshBasicMaterial({ color: glow, wireframe: true, transparent: true, opacity: 0.20 }));
    group.add(edge);
    const aura = sphere(radius * 1.16, glow, 0.055, 2);
    group.add(aura);
    return body;
  }

  function createDnaPlanet() {
    const g = new THREE.Group();
    const pickable = planetShell(g, 0.93, 0x0870b9, 0x47dfff);
    // Two strands with interpolating rungs: a recognizable 3D DNA helix inside the sphere.
    const twists = 2.1, h = 1.65, rad = 0.40, turns = 110;
    const a = [], b = [];
    for (let i = 0; i <= turns; i++) {
      const t = i / turns;
      const phase = twists * Math.PI * 2 * t;
      a.push(new THREE.Vector3(Math.cos(phase) * rad, (t - .5) * h, Math.sin(phase) * rad));
      b.push(new THREE.Vector3(Math.cos(phase + Math.PI) * rad, (t - .5) * h, Math.sin(phase + Math.PI) * rad));
    }
    g.add(tube(a, 0x9ef4ff, 0.041, 1, 140), tube(b, 0x00c5ff, 0.043, 1, 140));
    for (let i = 4; i < turns; i += 8) {
      g.add(tube([a[i], b[i]], i % 16 ? 0xa4fbff : 0x86baff, 0.024, 1, 3));
    }
    return { group: g, mesh: pickable, target: 'donor-project' };
  }

  function createProteinPlanet() {
    const g = new THREE.Group();
    const pickable = planetShell(g, 1.02, 0x6c34c4, 0xc9a2ff);
    // Coil and loops evoke a protein ribbon, but are illustrative, not an experimental PDB.
    const path = [];
    for (let i = 0; i < 170; i++) {
      const t = i / 169;
      const a = Math.PI * 8.5 * t;
      path.push(new THREE.Vector3(Math.cos(a) * (.41 + .13 * Math.sin(t * 17)), (t - .5) * 1.58, Math.sin(a) * (.43 + .1 * Math.sin(t * 14))));
    }
    g.add(tube(path, 0xe2b4ff, 0.066, 1, 200));
    for (let j = 0; j < 6; j++) {
      const angle = j * Math.PI * 2 / 6;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(.48, .02, 7, 60), new THREE.MeshBasicMaterial({ color: 0xcfb6ff, transparent: true, opacity: 0.65 }));
      ring.rotation.set(Math.sin(angle) * 0.9, angle, angle * 0.4);
      g.add(ring);
    }
    return { group: g, mesh: pickable, target: 'protein-project' };
  }

  function createNextPlanet() {
    const g = new THREE.Group();
    const pickable = planetShell(g, .75, 0xa94f13, 0xffa34f);
    const points = [];
    for (let i = 0; i < 8; i++) {
      const t = i / 8 * Math.PI * 2;
      points.push(new THREE.Vector3(Math.cos(t) * .45, Math.sin(t) * .4, (i % 2 ? .23 : -.19)));
    }
    for (let i = 0; i < 8; i++) {
      const dot = sphere(.085, i % 2 ? 0xffc088 : 0xffebbb, 1, 1);
      dot.position.copy(points[i]);
      g.add(dot, tube([points[i], points[(i+1) % 8]], 0xffcf91, .029, 1, 5));
    }
    return { group: g, mesh: pickable, target: 'future-project' };
  }

  const nodes = [createDnaPlanet(), createProteinPlanet(), createNextPlanet()];
  nodes[0].group.position.set(-1.85, -0.75, 0.2);
  nodes[1].group.position.set(1.15, 1.07, -0.35);
  nodes[2].group.position.set(3.48, -0.58, 0.65);
  for (const n of nodes) universe.add(n.group);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const drag = { active: false, moved: false, startX: 0, startY: 0, lastX: 0 };
  let userRotation = 0;
  let targetRotation = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function updatePointer(event) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    drag.active = true; drag.moved = false; drag.startX = event.clientX; drag.startY = event.clientY; drag.lastX = event.clientX;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    updatePointer(event);
    if (!drag.active) return;
    if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5) drag.moved = true;
    if (drag.moved) targetRotation += (event.clientX - drag.lastX) * 0.004;
    drag.lastX = event.clientX;
  });
  canvas.addEventListener('pointerup', (event) => {
    if (!drag.active) return;
    drag.active = false;
    if (drag.moved) return;
    updatePointer(event);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(nodes.map(n => n.mesh));
    if (!hits.length) return;
    const clicked = nodes.find(n => n.mesh === hits[0].object);
    document.getElementById(clicked.target)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  canvas.addEventListener('pointercancel', () => { drag.active = false; });

  function resize() {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.position.set(width < 760 ? 0.1 : -0.3, 0.02, width < 760 ? 12.6 : 13.0);
    camera.lookAt(width < 760 ? 0.5 : 0.15, 0, -1.0);
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  }
  new ResizeObserver(resize).observe(canvas);
  resize();
  document.documentElement.classList.add('has-webgl');

  const clock = new THREE.Clock();
  function frame() {
    const elapsed = clock.getElapsedTime();
    if (!reducedMotion.matches) {
      userRotation += (targetRotation - userRotation) * 0.06;
      universe.rotation.y = userRotation + Math.sin(elapsed * .17) * .035;
      nodes.forEach((n, i) => {
        n.group.rotation.y = elapsed * (i === 1 ? -.25 : .22);
        n.group.rotation.z = Math.sin(elapsed * .21 + i * 1.8) * .12;
      });
      stars.rotation.y = elapsed * .0025;
      core.scale.setScalar(1 + Math.sin(elapsed * 2.6) * .07);
    }
    renderer.render(scene, camera);
  }
  renderer.setAnimationLoop(frame);
  document.addEventListener('visibilitychange', () => {
    renderer.setAnimationLoop(document.hidden ? null : frame);
  });
}