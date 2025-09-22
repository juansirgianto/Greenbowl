// main.js

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://esm.run/three@0.160.0/examples/jsm/controls/OrbitControls.js';
import { Line2 } from 'https://esm.run/three@0.160.0/examples/jsm/lines/Line2.js';
import { LineMaterial } from 'https://esm.run/three@0.160.0/examples/jsm/lines/LineMaterial.js';
import { LineGeometry } from 'https://esm.run/three@0.160.0/examples/jsm/lines/LineGeometry.js';
import { LumaSplatsThree } from './libs/luma-web.module.js';
import { initCarousel } from './carousel.js';

initCarousel();

// ===== Init scene =====
const scene = new THREE.Scene();
const overlayScene = new THREE.Scene();              // ★ scene terpisah untuk overlay (garis)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5);
camera.position.set(0.1, 2.03, 1.32);

const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
scene.background = new THREE.Color(0x000000);
renderer.setSize(window.innerWidth, window.innerHeight);
const DPR = Math.min(window.devicePixelRatio, 1.25);
renderer.setPixelRatio(DPR);
renderer.autoClear = true;                            // default
document.body.appendChild(renderer.domElement);

// ===== Outline tebal (Line2) di overlayScene =====
const verticesClosed = new Float32Array([
  0.9, -0.2, -1.3,
  1.5, -0.6,  0.34,
  1,  -0.3, 1,
  0,  0, 0.5,
  -2.5, 0.8, 0.1,
  -2.6, 0.8, -0.6,
  -0.15, 0.2, -0.80,
  0.9, -0.2, -1.3,
]);

const lineGeo = new LineGeometry();
lineGeo.setPositions(Array.from(verticesClosed));

const lineMat = new LineMaterial({
  color: 0xffffff,
  linewidth: 5,        // pixel
  dashed: false,
  depthTest: false,    // selalu di atas
  depthWrite: false,
  transparent: true
});

const fatLine = new Line2(lineGeo, lineMat);
fatLine.computeLineDistances();
fatLine.renderOrder = 9999;           // tinggi sekali
fatLine.frustumCulled = false;        // ★ cegah hilang saat di sudut tertentu
overlayScene.add(fatLine);            // ★ taruh di overlayScene

// LineMaterial butuh resolusi canvas
const size = new THREE.Vector2();
renderer.getSize(size);
lineMat.resolution.set(size.x, size.y);

// ===== Controls =====
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const maxY = 3.5;
const minY = -2;

controls.addEventListener('change', () => {
  camera.position.y = Math.min(maxY, Math.max(minY, camera.position.y));
  needsRender = true;
});

controls.minDistance = 0;
controls.maxDistance = 3.5;

// ===== Luma Splats =====
const splats = new LumaSplatsThree({
  source: 'https://lumalabs.ai/capture/1220b8e6-f56e-4bbc-92f8-b4728dec5fb9',
  particleRevealEnabled: false
});
splats.position.set(2, 0.9, 0);
scene.add(splats);

// ===== Helpers =====
// const axesHelper = new THREE.AxesHelper(10);
// axesHelper.position.y = 0;
// scene.add(axesHelper);

// ===== Cam info (opsional) =====
// const camInfo = document.getElementById('cam-info');

// ===== Render loop on-demand =====
let needsRender = true;
let warmingUp = true;
const WARMUP_MS = 3000;
const warmUpEndAt = performance.now() + WARMUP_MS;

// === UI elements
const btnMap = document.getElementById('btn-map');
const mapOverlay = document.getElementById('map-overlay');
const btnCloseMap = document.getElementById('btn-close-map');

// === Toggle garis (outline) ===
const toggleBtn = document.getElementById('btn-toggle-line');
if (toggleBtn) {
  const iconEye = toggleBtn.querySelector('[data-lucide="eye"]');
  const iconEyeOff = toggleBtn.querySelector('[data-lucide="eye-off"]');

  // Default: garis terlihat
  if (iconEye) iconEye.style.display = 'inline-block';
  if (iconEyeOff) iconEyeOff.style.display = 'none';

  toggleBtn.addEventListener('click', () => {
    fatLine.visible = !fatLine.visible;

    // Toggle icon
    const isVisible = fatLine.visible;
    if (iconEye) iconEye.style.display = isVisible ? 'inline-block' : 'none';
    if (iconEyeOff) iconEyeOff.style.display = isVisible ? 'none' : 'inline-block';

    needsRender = true;
  });
}

// === Helper: easing & anim kamera
function easeInOut(t) {
  return t < 0.5 ? 2*t*t : 1 - Math.pow(-2*t + 2, 2)/2;
}

function animateCamera({ toPos, toTarget = null, toFov = null, duration = 1200 }) {
  const fromPos = camera.position.clone();
  const fromTarget = controls.target.clone();
  const fromFov = camera.fov;

  let start = performance.now();
  return new Promise((resolve) => {
    function step(now) {
      const t = Math.min(1, (now - start) / duration);
      const k = easeInOut(t);

      // posisi
      camera.position.lerpVectors(fromPos, toPos, k);

      // target orbit (opsional)
      if (toTarget) {
        controls.target.set(
          fromTarget.x + (toTarget.x - fromTarget.x) * k,
          fromTarget.y + (toTarget.y - fromTarget.y) * k,
          fromTarget.z + (toTarget.z - fromTarget.z) * k
        );
      }

      // FOV (opsional)
      if (toFov !== null) {
        camera.fov = fromFov + (toFov - fromFov) * k;
        camera.updateProjectionMatrix();
      }

      // minta render ulang
      needsRender = true;

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    requestAnimationFrame(step);
  });
}

// === Orkestrasi: zoom-out lalu tampilkan peta
async function zoomOutAndShowMap() {
  // Simpan state kalau perlu kembali lagi
  const saved = {
    pos: camera.position.clone(),
    target: controls.target.clone(),
    fov: camera.fov
  };

  // Atur target zoom-out: agak mundur & tinggi supaya terasa “keluar”
  // (Silakan sesuaikan agar terasa pas dengan scene kamu)
  const toPos = new THREE.Vector3(0, 5, 0);
  const toTarget = new THREE.Vector3(0, 0, 0);
  const toFov = 75; // kecil = zoom out (default kamu 75, jadi ini tampak “menjauh”)

  controls.enabled = false; // kunci orbit selama animasi
  await animateCamera({ toPos, toTarget, toFov, duration: 1200 });
  controls.enabled = false;

  // Fade-out scene 3D (opsional, sederhana: turunkan renderer opacity via CSS)
  renderer.domElement.style.transition = 'opacity 300ms ease';
  renderer.domElement.style.opacity = '0.3';

  // Tampilkan overlay peta
  mapOverlay.style.display = 'block';
  needsRender = true;

  // Simpan ke global jika mau dipakai untuk “kembali”
  window.__savedView = saved;
}

// === Orkestrasi: tutup peta & kembalikan kamera
async function hideMapAndReturn() {
  mapOverlay.style.display = 'none';
  renderer.domElement.style.opacity = '1';

  const saved = window.__savedView;
  if (!saved) return;

  controls.enabled = false;
  await animateCamera({
    toPos: saved.pos,
    toTarget: saved.target,
    toFov: saved.fov,
    duration: 900
  });
  controls.enabled = true;
  needsRender = true;
}

// === Event listeners tombol
if (btnMap) {
  btnMap.addEventListener('click', zoomOutAndShowMap);
}
if (btnCloseMap) {
  btnCloseMap.addEventListener('click', hideMapAndReturn);
}


function renderLoop() {
  requestAnimationFrame(renderLoop);

  if (controls.update()) needsRender = true;
  if (warmingUp) {
    needsRender = true;
    if (performance.now() >= warmUpEndAt) warmingUp = false;
  }
  if (!needsRender) return;

//   if (camInfo) {
//     camInfo.textContent = `x: ${camera.position.x.toFixed(2)}, 
// y: ${camera.position.y.toFixed(2)}, 
// z: ${camera.position.z.toFixed(2)}`;
//   }

  // Pass 1: render scene biasa (dengan depth)
  renderer.autoClear = true;
  renderer.render(scene, camera);

  // Pass 2: render overlay (garis) SELALU di atas
  renderer.autoClear = false;
  renderer.clearDepth();
  renderer.render(overlayScene, camera);

  needsRender = false;
}
renderLoop();

// Pastikan render setelah menambah objek
needsRender = true;

// ===== Resize handler =====
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  // update resolusi untuk LineMaterial
  lineMat.resolution.set(window.innerWidth, window.innerHeight);

  needsRender = true;
});

const btnContact = document.getElementById('btn-contact');
const menuContact = document.getElementById('contact-menu');

function openMenu() {
  menuContact.classList.remove('invisible','opacity-0','translate-y-1','pointer-events-none');
  btnContact.setAttribute('aria-expanded', 'true');
  const icon = btnContact.querySelector('svg');
  if (icon) icon.style.transform = 'rotate(180deg)';
}

function closeMenu() {
  menuContact.classList.add('invisible','opacity-0','translate-y-1','pointer-events-none');
  btnContact.setAttribute('aria-expanded', 'false');
  const icon = btnContact.querySelector('svg');
  if (icon) icon.style.transform = '';
}

btnContact.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = btnContact.getAttribute('aria-expanded') === 'true';
  isOpen ? closeMenu() : openMenu();
});

// Tutup saat klik di luar
document.addEventListener('click', (e) => {
  if (!menuContact.contains(e.target) && !btnContact.contains(e.target)) closeMenu();
});

// Tutup dengan ESC dan dukung panah atas/bawah
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMenu();
});

const items = Array.from(menuContact.querySelectorAll('[role="menuitem"]'));

btnContact.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    openMenu();
    items[0]?.focus();
  }
});

menuContact.addEventListener('keydown', (e) => {
  const i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    items[(i + 1) % items.length]?.focus();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    items[(i - 1 + items.length) % items.length]?.focus();
  } else if (e.key === 'Tab') {
    closeMenu();
  }
});
