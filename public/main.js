/* ---------- THREE.JS PARTICLE FIELD ------------------------------- */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById("bg"),
  alpha: true
});
renderer.setSize(innerWidth, innerHeight);

const COUNT = 2000;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(COUNT * 3).map(
  () => (Math.random() - 0.5) * 20
);
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const material = new THREE.PointsMaterial({
  size: 0.06,
  transparent: true
});
const particles = new THREE.Points(geometry, material);
scene.add(particles);

let bpm = 120;
let hue = 0;
let currentTrackId = null;

function animateParticles() {
  const speed = bpm / 60 / 10;
  hue = (hue + speed) % 360;
  material.color.setHSL(hue / 360, 1, 0.6);

  particles.rotation.y += 0.0005 + speed * 0.0005;
  renderer.render(scene, camera);
  requestAnimationFrame(animateParticles);
}
animateParticles();

/* ---------- 2D EQUALISER ------------------------------------------ */
const eq = document.getElementById("eq");
const ctx = eq.getContext("2d");

function resize() {
  eq.width = innerWidth;
  eq.height = innerHeight;
  renderer.setSize(innerWidth, innerHeight);
}
addEventListener("resize", resize);
resize();

function drawEQ() {
  ctx.clearRect(0, 0, eq.width, eq.height);
  const bars = 60;
  const barW = eq.width / bars;
  const t = Date.now() / 1000;
  for (let i = 0; i < bars; i++) {
    const phase = (i / bars) * Math.PI * 2;
    const height = (Math.sin(t * (bpm / 60) + phase) + 1) / 2; // 0-1
    ctx.fillStyle = `hsla(${(hue + i * 4) % 360},100%,60%,0.5)`;
    ctx.fillRect(
      i * barW,
      eq.height * (1 - height),
      barW * 0.8,
      eq.height * height
    );
  }
  requestAnimationFrame(drawEQ);
}
// drawEQ();

/* ---------- METADATA POLLING -------------------------------------- */
async function fetchSong() {
  const res = await fetch("/api/now");
  if (!res.ok) return;
  const d = await res.json();
  if (!d.title) return;

  // Detect a track change
  if (d.track_id && d.track_id !== currentTrackId) {
    await transitionCard(d);       // fancy cross-fade
    currentTrackId = d.track_id;
  } else if (!currentTrackId) {
    // initial fill (first load)
    updateCard(d);
    currentTrackId = d.track_id;
  }

  bpm = d.bpm || 120;

  // tint particles toward album colour
  material.color.setRGB(d.color.r / 255, d.color.g / 255, d.color.b / 255);

  document.getElementById("art").src = d.img;
  document.getElementById("title").textContent = d.title;
  document.getElementById("artist").textContent = d.artist;

  bpm = d.bpm || 120;

  // tint particles toward album colour
  material.color.setRGB(d.color.r / 255, d.color.g / 255, d.color.b / 255);
}
setInterval(fetchSong, 5000);
fetchSong();

/* ---------- helpers ----------------------------------------------- */
function updateCard(d) {
  document.getElementById("art").src = d.img;
  document.getElementById("title").textContent = d.title;
  document.getElementById("artist").textContent = d.artist;
}

async function transitionCard(d) {
  const card = document.querySelector(".card");
  card.classList.add("fade-out");
  // wait for half the transition before swapping content
  await new Promise((r) => setTimeout(r, 300));
  updateCard(d);
  card.classList.remove("fade-out");
  card.classList.add("fade-in");
  // remove helper after animation ends (600 ms total)
  setTimeout(() => card.classList.remove("fade-in"), 600);
}