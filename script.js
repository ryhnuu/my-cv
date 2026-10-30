document.documentElement.classList.add("js");
const root = document.documentElement;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover)").matches;
const NS = "http://www.w3.org/2000/svg";
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Add your own links here. Anything left empty is hidden.
const LINKS = { linkedin: "", github: "" };

// Turn off the heaviest effects on slower devices
const lowPower = (navigator.hardwareConcurrency || 8) <= 4 || (navigator.deviceMemory || 8) <= 2 || !!(navigator.connection && navigator.connection.saveData);
if (lowPower) root.classList.add("low-power");

function icon(name) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "i");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(NS, "use");
  use.setAttribute("href", "#i-" + name);
  svg.appendChild(use);
  return svg;
}

// ---------- Welcome splash ----------
const SHOW_INTRO_EVERY_VISIT = false; // set to true to show it on every page load
const splash = document.getElementById("splash");
const readyQueue = [];
let heroIsReady = false;
function afterReady(fn) { if (heroIsReady) fn(); else readyQueue.push(fn); }
function heroReady() {
  if (heroIsReady) return;
  heroIsReady = true;
  root.classList.add("hero-ready");
  readyQueue.forEach((fn) => fn());
}
function endSplash() {
  if (!splash || splash.dataset.done) return;
  splash.dataset.done = "1";
  root.classList.remove("splash-on");
  splash.classList.add("leave");
  window.scrollTo(0, 0);
  setTimeout(heroReady, 250);
  setTimeout(() => { splash.remove(); const m = document.getElementById("main"); if (m) m.focus({ preventScroll: true }); }, 800);
  try { sessionStorage.setItem("seenIntro", "1"); } catch (err) {}
}
(function startSplash() {
  let seen = false;
  try { seen = sessionStorage.getItem("seenIntro") === "1"; } catch (err) {}
  if (!splash || reduceMotion || (!SHOW_INTRO_EVERY_VISIT && seen)) {
    if (splash) splash.remove();
    heroReady();
    return;
  }
  root.classList.add("splash-on");
  const greetEl = document.getElementById("greet");
  const skipBtn = document.getElementById("skip-intro");
  const bar = document.getElementById("load-bar");
  const num = document.getElementById("load-num");
  const greetings = [["Hello", "en"], ["\u09b8\u09cd\u09ac\u09be\u0997\u09a4\u09ae", "bn"], ["Welcome", "en"]];
  let g = 0;
  function showGreeting() {
    greetEl.textContent = greetings[g][0];
    greetEl.setAttribute("lang", greetings[g][1]);
    greetEl.classList.remove("swap");
    void greetEl.offsetWidth;
    greetEl.classList.add("swap");
  }
  showGreeting();
  const cycle = setInterval(() => { if (g < greetings.length - 1) { g++; showGreeting(); } else clearInterval(cycle); }, 520);
  const DURATION = 1700, t0 = performance.now();
  (function load(now) {
    if (splash.dataset.done) return;
    const p = clamp((now - t0) / DURATION, 0, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    bar.style.transform = "scaleX(" + eased + ")";
    num.textContent = Math.round(eased * 100);
    if (p < 1) requestAnimationFrame(load); else endSplash();
  })(t0);
  skipBtn.addEventListener("click", endSplash);
  splash.addEventListener("click", endSplash);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") endSplash(); });
  skipBtn.focus({ preventScroll: true });
})();

// ---------- Text splitting (hero name letters, headings words) ----------
document.querySelectorAll("#name .line").forEach((line, li, all) => {
  const text = line.textContent;
  line.textContent = "";
  let idx = 0;
  Array.from(text).forEach((ch) => {
    if (ch === " ") { line.appendChild(document.createTextNode(" ")); return; }
    const s = document.createElement("span");
    s.className = "ch";
    s.setAttribute("aria-hidden", "true");
    s.textContent = ch;
    s.style.setProperty("--i", li * 4 + idx);
    s.style.setProperty("--t", (idx / Math.max(text.length - 1, 1)).toFixed(3));
    line.appendChild(s);
    idx++;
  });
});
document.querySelectorAll("[data-split]").forEach((el) => {
  const words = el.textContent.trim().split(/\s+/);
  el.setAttribute("aria-label", el.textContent.trim());
  el.textContent = "";
  words.forEach((w, i) => {
    const outer = document.createElement("span");
    outer.className = "w";
    outer.setAttribute("aria-hidden", "true");
    const inner = document.createElement("span");
    inner.className = "wi";
    inner.style.setProperty("--i", i);
    inner.textContent = w;
    outer.appendChild(inner);
    el.appendChild(outer);
    if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
  });
});
const statement = document.getElementById("statement");
statement.innerHTML = statement.textContent.trim().split(/\s+/).map((w) => '<span class="sw">' + w + "</span>").join(" ");
const statementWords = statement.querySelectorAll(".sw");
document.querySelectorAll(".checks").forEach((ul) => ul.querySelectorAll("li").forEach((li, i) => li.style.setProperty("--i", i)));

// ---------- Mobile menu, nav indicator and section spy ----------
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
const navInd = document.getElementById("nav-ind");
const links = Array.from(document.querySelectorAll("nav a"));
function closeNav() { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
toggle.addEventListener("click", () => { const open = nav.classList.toggle("open"); toggle.setAttribute("aria-expanded", open); });
nav.addEventListener("click", (e) => { if (e.target.tagName === "A") closeNav(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { closeNav(); toggle.focus(); } });

function placeIndicator() {
  const a = links.find((l) => l.classList.contains("active"));
  if (!a) { navInd.style.opacity = 0; return; }
  navInd.style.opacity = 1;
  navInd.style.width = a.offsetWidth + "px";
  navInd.style.transform = "translateX(" + a.offsetLeft + "px)";
}
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((l) => {
      const on = l.getAttribute("href") === "#" + entry.target.id;
      l.classList.toggle("active", on);
      if (on) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
    });
    placeIndicator();
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));
window.addEventListener("resize", placeIndicator);

// ---------- Reveal on scroll ----------
document.querySelectorAll(".bento > .reveal").forEach((el, i) => el.style.setProperty("--i", i));
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); } });
}, { threshold: 0.12 });
function watch(el) { if (reduceMotion) el.classList.add("in"); else revealObs.observe(el); }
document.querySelectorAll(".reveal, [data-split]").forEach(watch);

// ---------- Count-up numbers ----------
const countObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countObs.unobserve(e.target);
    const el = e.target, end = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = end; return; }
    const start = performance.now();
    (function step(now) {
      const t = Math.min((now - start) / 1300, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((el) => { if (!reduceMotion) el.textContent = "0"; countObs.observe(el); });

// ---------- Scroll effects ----------
const progress = document.getElementById("progress");
const toTop = document.getElementById("to-top");
const toTopRing = document.getElementById("to-top-ring");
let ticking = false, stmtOn = false, litCount = 0, lastShow = null, lastScrolled = null;

function updateStatement(rect) {
  const n = statementWords.length;
  const p = clamp((window.innerHeight * 0.85 - rect.top) / (rect.height + window.innerHeight * 0.25), 0, 1);
  const target = Math.min(n, Math.round(p * n * 1.2));
  if (target === litCount) return;
  const a = Math.min(target, litCount), b = Math.max(target, litCount);
  for (let i = a; i < b; i++) statementWords[i].classList.toggle("lit", i < target);
  litCount = target;
}
function frame() {
  ticking = false;
  // read first, then write
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const rect = stmtOn && !reduceMotion ? statement.getBoundingClientRect() : null;
  const p = max > 0 ? y / max : 0;
  progress.style.transform = "scaleX(" + p + ")";
  toTopRing.style.strokeDashoffset = 132 * (1 - p);
  const show = y > 600, scrolled = y > 40;
  if (show !== lastShow) { toTop.classList.toggle("show", show); lastShow = show; }
  if (scrolled !== lastScrolled) { root.classList.toggle("scrolled", scrolled); lastScrolled = scrolled; }
  if (rect) updateStatement(rect);
}
if (reduceMotion) statementWords.forEach((w) => w.classList.add("lit"));
else new IntersectionObserver((entries) => { stmtOn = entries[0].isIntersecting; if (stmtOn) requestAnimationFrame(frame); }, { rootMargin: "20% 0px 20% 0px" }).observe(statement);
window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
window.addEventListener("resize", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
frame();
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

// Only animate the project illustrations while they are on screen
const projObs = new IntersectionObserver((entries) => entries.forEach((e) => e.target.classList.toggle("vis", e.isIntersecting)), { rootMargin: "80px" });
document.querySelectorAll(".proj").forEach((el) => projObs.observe(el));

// ---------- Card spotlight and tilt (mouse devices only) ----------
if (canHover) {
  let lastMove = null, moveRaf = 0;
  document.addEventListener("pointermove", (e) => {
    lastMove = e;
    if (moveRaf) return;
    moveRaf = requestAnimationFrame(() => {
      moveRaf = 0;
      const ev = lastMove;
      const card = ev.target.closest && ev.target.closest(".card");
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", ev.clientX - r.left + "px");
      card.style.setProperty("--my", ev.clientY - r.top + "px");
      if (card.classList.contains("tilt") && !reduceMotion && !lowPower) {
        card.style.setProperty("--ry", (((ev.clientX - r.left) / r.width - 0.5) * 8).toFixed(2) + "deg");
        card.style.setProperty("--rx", ((-((ev.clientY - r.top) / r.height - 0.5)) * 8).toFixed(2) + "deg");
      }
    });
  }, { passive: true });
  document.addEventListener("pointerout", (e) => {
    const card = e.target.closest && e.target.closest(".card.tilt");
    if (card && !card.contains(e.relatedTarget)) { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); }
  }, { passive: true });
}

// ---------- Theme ----------
const themeBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
let dotColor = "124,140,255";
function applyTheme(t) {
  root.dataset.theme = t;
  themeIcon.setAttribute("href", t === "light" ? "#i-moon" : "#i-sun");
  themeBtn.setAttribute("aria-label", "Switch to " + (t === "light" ? "dark" : "light") + " theme");
  dotColor = getComputedStyle(root).getPropertyValue("--dot").trim() || dotColor;
}
applyTheme(root.dataset.theme === "light" ? "light" : "dark");
themeBtn.addEventListener("click", () => {
  const next = root.dataset.theme === "light" ? "dark" : "light";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (err) {}
});

// ---------- Hero network canvas ----------
const canvas = document.getElementById("net");
const ctx = canvas.getContext("2d");
const heroEl = canvas.parentElement;
const LINK2 = 120 * 120, MOUSE2 = 160 * 160;
let W = 0, H = 0, pts = [], mouse = { x: -999, y: -999 }, running = false, lastCanvasW = 0;
function sizeCanvas() {
  const r = heroEl.getBoundingClientRect();
  if (pts.length && Math.abs(r.width - lastCanvasW) < 1) return; // ignore phone address-bar resizes
  lastCanvasW = r.width;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  W = r.width; H = r.height;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cap = lowPower ? 16 : canHover ? 42 : 24;
  const n = Math.round(Math.min(cap, (W * H) / 20000));
  pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.35, vy: (Math.random() - 0.5) * 0.35 }));
  draw(false);
}
function draw(move) {
  ctx.clearRect(0, 0, W, H);
  ctx.globalAlpha = 0.75;
  ctx.fillStyle = "rgb(" + dotColor + ")";
  for (const p of pts) {
    if (move) { p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1; }
    ctx.fillRect(p.x - 1, p.y - 1, 2.4, 2.4);
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgb(" + dotColor + ")";
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    for (let j = i + 1; j < pts.length; j++) {
      const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
      if (d2 < LINK2) {
        ctx.globalAlpha = (1 - d2 / LINK2) * 0.3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  if (mouse.x > -900) {
    ctx.strokeStyle = "rgb(45, 226, 195)";
    for (const a of pts) {
      const dx = a.x - mouse.x, dy = a.y - mouse.y, d2 = dx * dx + dy * dy;
      if (d2 < MOUSE2) {
        ctx.globalAlpha = (1 - d2 / MOUSE2) * 0.6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
  }
  ctx.globalAlpha = 1;
}
function loop() { if (!running) return; draw(true); requestAnimationFrame(loop); }
function setRunning(on) { if (on && !running && !reduceMotion) { running = true; loop(); } else if (!on) running = false; }
sizeCanvas();
let resizeTimer = 0;
window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(sizeCanvas, 180); }, { passive: true });
if (canHover) {
  heroEl.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
  heroEl.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
}
let heroVisible = true;
new IntersectionObserver((entries) => { heroVisible = entries[0].isIntersecting; setRunning(heroVisible && !document.hidden); }).observe(heroEl);
document.addEventListener("visibilitychange", () => setRunning(heroVisible && !document.hidden));

// ---------- EEG-style wave illustration ----------
const eeg = document.getElementById("eeg");
const ec = eeg.getContext("2d");
let eegT = 0, eegOn = false, eegRunning = false, eegFrame = 0, lastEegW = 0;
function sizeEEG() {
  const r = eeg.getBoundingClientRect();
  if (lastEegW && Math.abs(r.width - lastEegW) < 1) return;
  lastEegW = r.width;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  eeg.width = Math.max(r.width, 10) * dpr; eeg.height = Math.max(r.height, 10) * dpr;
  ec.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawEEG();
}
function drawEEG() {
  const r = eeg.getBoundingClientRect(), w = r.width, h = r.height, channels = 5;
  ec.clearRect(0, 0, w, h);
  ec.lineWidth = 1.6; ec.lineJoin = "round";
  for (let c = 0; c < channels; c++) {
    const y0 = (h * (c + 1)) / (channels + 1);
    const grad = ec.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, "rgba(" + dotColor + ",0.15)");
    grad.addColorStop(0.5, c % 2 ? "rgba(45,226,195,0.95)" : "rgba(" + dotColor + ",0.95)");
    grad.addColorStop(1, "rgba(" + dotColor + ",0.15)");
    ec.strokeStyle = grad;
    ec.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const u = x / w;
      const a = 7 + c * 1.5;
      const bump = Math.exp(-Math.pow((u - (((eegT * 0.12 + c * 0.23) % 1.5) - 0.25)) * 11, 2)) * 26;
      const v = Math.sin(u * (9 + c * 2.5) + eegT * (1.4 + c * 0.25)) * a + Math.sin(u * (34 + c * 6) - eegT * 2.3) * a * 0.35 + bump * Math.sin(u * 60);
      if (x === 0) ec.moveTo(x, y0 + v); else ec.lineTo(x, y0 + v);
    }
    ec.stroke();
  }
}
function eegLoop() {
  if (!eegOn || reduceMotion) { eegRunning = false; return; }
  if ((eegFrame++ & 1) === 0) { eegT += 0.06; drawEEG(); } // about 30 frames a second is plenty
  requestAnimationFrame(eegLoop);
}
new IntersectionObserver((entries) => {
  eegOn = entries[0].isIntersecting;
  if (eegOn && !eegRunning && !reduceMotion) { eegRunning = true; requestAnimationFrame(eegLoop); }
}).observe(eeg);
sizeEEG();
let eegResizeTimer = 0;
window.addEventListener("resize", () => { clearTimeout(eegResizeTimer); eegResizeTimer = setTimeout(sizeEEG, 180); }, { passive: true });

// ---------- Tabs (About me) ----------
document.querySelectorAll(".tabs[role='tablist']").forEach((group) => {
  const tabs = Array.from(group.querySelectorAll(".tab"));
  function select(tab, focus) {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
    });
    if (focus) tab.focus();
  }
  tabs.forEach((tab, i) => {
    tab.tabIndex = i === 0 ? 0 : -1;
    tab.addEventListener("click", () => select(tab, false));
    tab.addEventListener("keydown", (e) => {
      let n = null;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") n = tabs[(i + 1) % tabs.length];
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (e.key === "Home") n = tabs[0];
      if (e.key === "End") n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); select(n, true); }
    });
  });
});

// ---------- Skills ----------
const skills = [
  { name: "Face-to-face customer service", type: "people", icon: "users", note: "Built through sales work and volunteering with BHS." },
  { name: "Teamwork", type: "people", icon: "network", note: "Built through team-based tasks on CyberFirst Horizons and the NHS young persons’ group." },
  { name: "Communication", type: "people", icon: "message", note: "Developed in sales, volunteering and the NHS young persons’ group." },
  { name: "Decision making", type: "people", icon: "target", note: "Took part in interviewing candidates and decided who was the most suitable, which developed my decision-making skills." },
  { name: "Python", type: "technical", icon: "code", level: "Basic, and growing", note: "Learnt it during GCSE and A-Level, and used it on my projects, such as my quiz application." },
  { name: "MySQL", type: "technical", icon: "database", level: "Basic, and growing", note: "I designed relational databases for my quiz app." },
  { name: "Object-oriented programming", type: "technical", icon: "cube", note: "I rewrote my quiz app from procedural code into Python classes." },
  { name: "Cyber security", type: "technical", icon: "shield", note: "Threat identification and protecting virtual environments, practised on TryHackMe." },
  { name: "Logical thinking", type: "technical", icon: "layers", note: "Breaking big challenges into clear steps, in code and in maths." },
  { name: "Microsoft Office 365", type: "technical", icon: "briefcase", note: "Word, Excel, Outlook, PowerPoint and Teams." },
  { name: "Active listening", type: "people", icon: "message", note: "Used face to face to understand what customers need." },
  { name: "Customer engagement", type: "people", icon: "users", note: "Applying a sales process in real customer conversations." },
  { name: "Problem solving", type: "technical", icon: "zap", note: "I’ve developed this through maths and computer science projects, and I enjoy solving problems." },
  { name: "HTML, CSS and JavaScript", type: "technical", icon: "code", note: "Used to build my Hazard Ready web app and my own website." },
  { name: "Research", type: "technical", icon: "search", note: "Compared Neuralink, Stentrode and the Emotiv EEG headset for my brain-computer interface project." },
  { name: "Presenting", type: "people", icon: "message", note: "Presented my brain-computer interface findings to my supervisors." }
];
const grid = document.getElementById("skills-grid");
const filters = document.querySelectorAll(".filter");
function renderSkills(filter) {
  grid.textContent = "";
  skills.filter((s) => filter === "all" || s.type === filter).forEach((s, i) => {
    const card = document.createElement("article");
    card.className = "card tilt skill reveal";
    card.style.setProperty("--i", i);
    const ico = document.createElement("span");
    ico.className = "s-ico";
    ico.style.setProperty("--i", i);
    ico.appendChild(icon(s.icon));
    const h = document.createElement("h3");
    h.textContent = s.name;
    const p = document.createElement("p");
    p.textContent = s.note;
    card.append(ico, h, p);
    if (s.level) { const l = document.createElement("span"); l.className = "level"; l.textContent = s.level; card.appendChild(l); }
    grid.appendChild(card);
    watch(card);
  });
}
filters.forEach((f) => f.addEventListener("click", () => {
  filters.forEach((x) => x.setAttribute("aria-pressed", x === f));
  renderSkills(f.dataset.filter);
}));
renderSkills("all");

// ---------- Contact dialog ----------
const EMAIL = "08rayhan.uddin@gmail.com";
const dialog = document.getElementById("contact-dlg");
const statusEl = document.getElementById("contact-status");
const form = document.getElementById("contact-form");
const msg = document.getElementById("c-msg");

function openDialog(d) { if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", ""); }
document.querySelectorAll(".open-contact").forEach((b) => b.addEventListener("click", () => { statusEl.textContent = ""; openDialog(dialog); }));
document.getElementById("close-contact").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (e) => { if (e.target === dialog) dialog.close(); });

document.getElementById("copy-email").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(EMAIL);
    statusEl.textContent = "\u2713 Email copied. You can paste it into your mail app.";
  } catch (err) {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById("email-text"));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    statusEl.textContent = "Press Ctrl+C (or Cmd+C) to copy the selected email.";
  }
});

// HOW MESSAGES REACH YOU
// Option A (recommended, most reliable): Web3Forms. Go to web3forms.com, enter 08rayhan.uddin@gmail.com,
// and they email you an "access key". Paste it between the quotes below. It is safe to keep in public code.
// Every message from the form then arrives in your inbox straight away, with no activation step.
const WEB3FORMS_KEY = "";
// Option B (used while the key above is empty): FormSubmit. It only works on the live, hosted site (not a
// file on your computer), and the very first message triggers an activation email you must click.
const FORM_ENDPOINT = "https://formsubmit.co/ajax/" + EMAIL;
const emailField = document.getElementById("c-email");
const sendBtn = document.getElementById("send-btn");
const nameField = document.getElementById("c-name");

function fail(el, text) {
  el.classList.add("invalid");
  el.setAttribute("aria-invalid", "true");
  el.focus();
  statusEl.textContent = text;
}
[msg, emailField].forEach((el) => el.addEventListener("input", () => {
  el.classList.remove("invalid");
  el.removeAttribute("aria-invalid");
}));

function mailtoUrl() {
  const name = nameField.value.trim();
  const from = emailField.value.trim();
  const body = msg.value.trim() + (name || from ? "\n\nFrom " + [name, from].filter(Boolean).join(", ") : "");
  return "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Message from your portfolio") + "&body=" + encodeURIComponent(body);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!msg.value.trim()) return fail(msg, "Write a short message first.");
  if (!emailField.value.trim() || !emailField.validity.valid) return fail(emailField, "Enter a valid email so I can reply.");
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";
  statusEl.textContent = "";
  try {
    if (form.elements._honey && form.elements._honey.value) { form.reset(); statusEl.textContent = "Thanks, your message has been sent."; sendBtn.disabled = false; sendBtn.textContent = "Send message"; return; }
    let res, data;
    if (WEB3FORMS_KEY) {
      res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ access_key: WEB3FORMS_KEY, subject: "New message from your portfolio", from_name: nameField.value.trim() || "Portfolio visitor", name: nameField.value.trim(), email: emailField.value.trim(), message: msg.value.trim() })
      });
      data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) !== "true") throw new Error("Not delivered");
    } else {
      res = await fetch(FORM_ENDPOINT, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      data = await res.json().catch(() => ({}));
      if (!res.ok || String(data.success) === "false") throw new Error("Not delivered");
    }
    form.reset();
    statusEl.textContent = "Thanks, your message has been sent.";
  } catch (err) {
    statusEl.textContent = "Sorry, that didn\u2019t send. ";
    const a = document.createElement("a");
    a.href = mailtoUrl();
    a.textContent = "Open it in your mail app instead";
    statusEl.appendChild(a);
  }
  sendBtn.disabled = false;
  sendBtn.textContent = "Send message";
});

// ---------- Project dialogs ----------
const projects = {
  quiz: {
    title: "Adaptive quiz app",
    tags: ["Python", "Tkinter", "MySQL", "OOP", "Algorithms"],
    summary: "A quiz application that adapts to each learner. It keeps track of how well a user knows every topic and uses that to choose which questions to ask next.",
    points: [
      "A desktop app in Python with a Tkinter interface, with separate admin and quiz sides and a login for different roles.",
      "A MySQL database with six tables covering users, questions, answer choices, user answers and topic mastery.",
      "An adaptive algorithm that scores questions using topic mastery, difficulty and how often they have been attempted.",
      "Each 10-question quiz is built from three groups: gap fill (weak topics), consolidation (topics I’m getting there with) and exploration (topics not seen yet), in a 7/2/1 split.",
      "Wildcard search, mixed-topic quizzes, a results screen with per-topic scores and a performance graph."
    ],
    process: "I built it over three development cycles: first a terminal version with the database, login and algorithm, then an object-oriented rewrite with a Tkinter interface, then search, mixed quizzes and a better results screen.",
    demo: true,
    miniquiz: true,
    // Add screenshots of your app here, e.g. { src: "screens/quiz.png", alt: "The quiz screen", caption: "Quiz screen" }
    screenshots: []
  },
  bci: {
    title: "Brain-computer interfaces",
    tags: ["Research", "Critical thinking", "Writing", "Presenting"],
    summary: "A research project on brain-computer interfaces, which are systems that let the brain communicate directly with a computer or device. I compared three real-world approaches and presented what I found.",
    points: [
      "Compared Neuralink, Stentrode and the Emotiv EEG headset on what each can do (functionality), the risks involved and the wider concerns around them.",
      "Wrote a researched essay on the topic (Extended Project Qualification).",
      "Kept a logbook to record my research and progress as the project developed.",
      "Presented my findings to my supervisors."
    ],
    skills: ["Research", "Critical thinking", "Comparing and evaluating sources", "Written communication", "Presenting", "Time management", "Independent learning"],
    process: ""
  },
  hazard: {
    title: "Hazard Ready",
    tags: ["HTML", "CSS", "JavaScript", "Web app"],
    summary: "A hazard perception practice web app for the driving theory test. I built it from scratch with HTML, CSS and JavaScript.",
    points: [
      "Theory learning: animated lessons that explain each topic of the car theory test, plus a road sign library.",
      "Practice: exam-style theory questions by topic, and a full mock exam.",
      "Hazard perception practice: watch clips from the driver\u2019s seat, press Space the moment a hazard starts to develop, and see how early you reacted.",
      "A progress tracker with score history, streaks and badges.",
      "Display options including light, dark and high contrast themes, and reduced motion."
    ],
    process: "I started with a basic version and expanded it feature by feature.",
    link: { href: "https://ryhnuu.github.io/Hazard-Perception-Practice/", label: "Open the live site" }
  }
};
const pDialog = document.getElementById("project");
const pBody = document.getElementById("p-body");

function openProject(key) {
  const p = projects[key];
  document.getElementById("p-title").textContent = p.title;
  let html = '<div class="tags">' + p.tags.map((t) => "<span>" + t + "</span>").join("") + "</div>";
  html += "<p>" + p.summary + "</p><h3>What I did</h3><ul>" + p.points.map((x) => "<li>" + x + "</li>").join("") + "</ul>";
  if (p.screenshots && p.screenshots.length) {
    html += "<h3>Screenshots</h3><div class=\"shots\">" + p.screenshots.map((s) => "<figure><img src=\"" + s.src + "\" alt=\"" + (s.alt || "") + "\" loading=\"lazy\"><figcaption>" + (s.caption || "") + "</figcaption></figure>").join("") + "</div>";
  }
  if (p.skills) html += "<h3>Skills I developed</h3><div class=\"tags\">" + p.skills.map((t) => "<span>" + t + "</span>").join("") + "</div>";
  if (p.process) html += "<h3>How I built it</h3><p>" + p.process + "</p>";
  if (p.link) html += "<div class=\"actions\"><a class=\"button\" href=\"" + p.link.href + "\" target=\"_blank\" rel=\"noopener noreferrer\">" + p.link.label + "</a></div>";
  if (p.demo) {
    html += '<div class="demo"><h3>Try the idea</h3>' +
      '<label for="mastery"><span>How well I know a topic</span><output id="m-out">35%</output></label>' +
      '<input type="range" id="mastery" min="0" max="100" value="35">' +
      '<label class="check"><input type="checkbox" id="unseen"> I haven’t tried this topic yet</label>' +
      '<p class="verdict" id="m-result" aria-live="polite"></p></div>';
  }
  if (p.miniquiz) html += '<div class="mq" id="mq"></div>';
  pBody.innerHTML = html;
  if (p.demo) setupDemo();
  if (p.miniquiz) setupMiniQuiz(document.getElementById("mq"));
  openDialog(pDialog);
}
function setupDemo() {
  const slider = document.getElementById("mastery");
  const unseen = document.getElementById("unseen");
  const out = document.getElementById("m-out");
  const result = document.getElementById("m-result");
  function update() {
    const m = slider.value / 100;
    out.textContent = unseen.checked ? "not tried" : slider.value + "%";
    slider.disabled = unseen.checked;
    let text;
    if (unseen.checked) text = "Exploration: the app introduces the topic with a few new questions.";
    else if (m < 0.4) text = "Gap fill: this is a weak spot, so the app gives it the most questions.";
    else if (m <= 0.8) text = "Consolidation: you’re getting there, so the app adds some practice to lock it in.";
    else text = "Strong: the priority score drops as mastery rises, so other topics come first.";
    result.textContent = text;
  }
  slider.addEventListener("input", update);
  unseen.addEventListener("change", update);
  update();
}
document.querySelectorAll(".open-project").forEach((b) => b.addEventListener("click", () => openProject(b.dataset.project)));
document.getElementById("close-project").addEventListener("click", () => pDialog.close());
pDialog.addEventListener("click", (e) => { if (e.target === pDialog) pDialog.close(); });


// ---------- Custom cursor, magnetic buttons, ripple ----------
if (canHover && !reduceMotion && !lowPower) {
  root.classList.add("has-cursor");
  const ring = document.getElementById("cur-ring");
  const dot = document.getElementById("cur-dot");
  let mx = -100, my = -100, rx = -100, ry = -100, following = false, hoverState = false;
  function follow() {
    rx += (mx - rx) * 0.22; ry += (my - ry) * 0.22;
    ring.style.transform = "translate(" + rx + "px," + ry + "px)";
    dot.style.transform = "translate(" + mx + "px," + my + "px)";
    if (Math.abs(mx - rx) > 0.3 || Math.abs(my - ry) > 0.3) requestAnimationFrame(follow); else following = false;
  }
  document.addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    root.classList.add("cur-on");
    const h = !!(e.target.closest && e.target.closest("a, button, input, textarea, [role='tab'], .card"));
    if (h !== hoverState) { hoverState = h; root.classList.toggle("cur-hover", h); }
    if (!following) { following = true; requestAnimationFrame(follow); }
  }, { passive: true });
  document.documentElement.addEventListener("pointerleave", () => root.classList.remove("cur-on"));
}
document.querySelectorAll(".button").forEach((btn) => {
  if (canHover && !reduceMotion) {
    btn.addEventListener("pointermove", (e) => {
      const r = btn.getBoundingClientRect();
      btn.style.translate = (e.clientX - r.left - r.width / 2) * 0.18 + "px " + (e.clientY - r.top - r.height / 2) * 0.28 + "px";
    });
    btn.addEventListener("pointerleave", () => { btn.style.translate = ""; });
  }
  btn.addEventListener("click", (e) => {
    if (reduceMotion) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) * 2;
    const x = e.detail === 0 ? r.width / 2 : e.clientX - r.left;
    const y = e.detail === 0 ? r.height / 2 : e.clientY - r.top;
    const s = document.createElement("span");
    s.className = "ripple";
    s.style.cssText = "width:" + size + "px;height:" + size + "px;left:" + (x - size / 2) + "px;top:" + (y - size / 2) + "px";
    btn.appendChild(s);
    setTimeout(() => s.remove(), 650);
  });
});
document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Mini adaptive quiz (simplified demo) ----------
const QUIZ = [
  { t: "Maths", q: "What is the derivative of x\u00b2?", o: ["x", "2x", "x\u00b2"], a: 1 },
  { t: "Maths", q: "What is 2\u2075?", o: ["10", "25", "32"], a: 2 },
  { t: "Maths", q: "What do the interior angles of a triangle add up to?", o: ["90\u00b0", "180\u00b0", "360\u00b0"], a: 1 },
  { t: "Computer Science", q: "Which data structure works first in, first out?", o: ["Stack", "Queue", "Tree"], a: 1 },
  { t: "Computer Science", q: "What does SQL stand for?", o: ["Structured Query Language", "Simple Question Logic", "Sequential Query List"], a: 0 },
  { t: "Computer Science", q: "How many bits are in a byte?", o: ["4", "8", "16"], a: 1 },
  { t: "Business", q: "Revenue minus total costs gives what?", o: ["Profit", "Turnover", "Equity"], a: 0 },
  { t: "Business", q: "What does a SWOT analysis look at?", o: ["Strengths, weaknesses, opportunities, threats", "Sales, wages, orders, targets", "Stocks, wholesalers, outputs, taxes"], a: 0 },
  { t: "Business", q: "Which type of business can sell shares to the public?", o: ["Sole trader", "Partnership", "Public limited company"], a: 2 }
];
const QUIZ_TOPICS = ["Maths", "Computer Science", "Business"];

function setupMiniQuiz(box) {
  const TOTAL = 6;
  let mastery, asked, count, score;
  box.innerHTML = '<h3>Play a mini adaptive quiz</h3><div id="mq-bars"></div><div class="mq-body" id="mq-body" aria-live="polite"></div>' +
    '<p class="mq-note">A simplified demo built for this page. My real app also weighs question difficulty and how often a question has been attempted.</p>';
  const barsEl = box.querySelector("#mq-bars");
  const body = box.querySelector("#mq-body");
  barsEl.innerHTML = QUIZ_TOPICS.map((t) => '<div class="bar-row"><span>' + t + '</span><span class="track2"><span class="fill2"></span></span><span class="pill"></span></div>').join("");

  const category = (m) => (m === null ? "Not seen" : m < 0.4 ? "Gap fill" : m <= 0.8 ? "Consolidation" : "Strong");
  function updateBars() {
    barsEl.querySelectorAll(".bar-row").forEach((row, i) => {
      const m = mastery[QUIZ_TOPICS[i]];
      row.querySelector(".fill2").style.width = (m === null ? 0 : Math.round(m * 100)) + "%";
      row.querySelector(".pill").textContent = category(m);
    });
  }
  function reset() {
    mastery = {}; QUIZ_TOPICS.forEach((t) => { mastery[t] = null; });
    asked = new Set(); count = 0; score = 0;
    updateBars();
  }
  function pick() {
    let best = -1, bestP = -1;
    QUIZ.forEach((q, i) => {
      if (asked.has(i)) return;
      const m = mastery[q.t];
      const p = m === null ? 1.5 : 1 - m;
      if (p > bestP) { bestP = p; best = i; }
    });
    return best;
  }
  function why(topic) {
    const m = mastery[topic];
    if (m === null) return topic + " is new to you, so the app explores it first (exploration).";
    if (m < 0.4) return topic + " is a weak spot, so the app prioritises it (gap fill).";
    if (m <= 0.8) return topic + " is coming along, so the app adds practice (consolidation).";
    return topic + " is going well, so it is a lower priority.";
  }
  function start() {
    reset();
    body.innerHTML = '<p class="mq-why">Answer ' + TOTAL + ' questions. Watch how the bars change and how the app chooses what to ask next.</p><button type="button" class="button ghost" id="mq-start">Start</button>';
    body.querySelector("#mq-start").addEventListener("click", ask);
  }
  function ask() {
    if (count >= TOTAL) return finish();
    const i = pick();
    const q = QUIZ[i];
    asked.add(i);
    count++;
    body.innerHTML = '<p class="mq-why"></p><p class="mq-q"></p><div class="mq-opts"></div><div class="mq-fb"></div>';
    body.querySelector(".mq-why").textContent = "Why this question: " + why(q.t);
    body.querySelector(".mq-q").textContent = "Question " + count + " of " + TOTAL + " (" + q.t + "): " + q.q;
    const opts = body.querySelector(".mq-opts");
    q.o.forEach((text, k) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mq-opt";
      b.textContent = text;
      b.addEventListener("click", () => {
        const ok = k === q.a;
        if (ok) score++;
        const m = mastery[q.t];
        mastery[q.t] = m === null ? (ok ? 0.6 : 0.2) : Math.max(0, Math.min(1, m + (ok ? 0.25 : -0.2)));
        opts.querySelectorAll(".mq-opt").forEach((x, n) => { x.disabled = true; if (n === q.a) x.classList.add("right"); });
        if (!ok) b.classList.add("wrong");
        updateBars();
        const fb = body.querySelector(".mq-fb");
        fb.innerHTML = '<p class="mq-why"></p><button type="button" class="button ghost"></button>';
        fb.querySelector(".mq-why").textContent = (ok ? "Correct. " : "Not quite. ") + q.t + " mastery is now " + category(mastery[q.t]).toLowerCase() + ".";
        const next = fb.querySelector("button");
        next.textContent = count >= TOTAL ? "See results" : "Next question";
        next.addEventListener("click", ask);
        next.focus();
      });
      opts.appendChild(b);
    });
  }
  function finish() {
    const seen = QUIZ_TOPICS.filter((t) => mastery[t] !== null);
    const weakest = seen.reduce((a, b) => (mastery[b] < mastery[a] ? b : a), seen[0]);
    body.innerHTML = '<p class="mq-q"></p><p class="mq-why"></p><button type="button" class="button ghost"><svg class="i" aria-hidden="true"><use href="#i-refresh"/></svg> Play again</button>';
    body.querySelector(".mq-q").textContent = "You scored " + score + " out of " + TOTAL + ".";
    body.querySelector(".mq-why").textContent = "Your weakest topic is " + weakest + ", so that is where the app would send you next.";
    body.querySelector("button").addEventListener("click", start);
  }
  start();
}

// ---------- Links and footer ----------
const socials = document.getElementById("socials");
[["LinkedIn", LINKS.linkedin], ["GitHub", LINKS.github]].forEach(([name, url]) => {
  if (!url) return;
  const a = document.createElement("a");
  a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = name;
  socials.appendChild(a);
  socials.hidden = false;
});

// ---------- Command palette ----------
const palette = document.getElementById("palette");
const palInput = document.getElementById("pal-input");
const palList = document.getElementById("pal-list");
const scrollBehavior = reduceMotion ? "auto" : "smooth";
function goTo(hash) { const el = document.querySelector(hash); if (el) el.scrollIntoView({ behavior: scrollBehavior }); }
const commands = [
  { label: "Go to About", icon: "user", run: () => goTo("#about") },
  { label: "Go to Skills", icon: "sparkles", run: () => goTo("#skills") },
  { label: "Go to Experience", icon: "briefcase", run: () => goTo("#experience") },
  { label: "Go to Projects", icon: "bulb", run: () => goTo("#projects") },
  { label: "Go to Education", icon: "cap", run: () => goTo("#education") },
  { label: "Go to Certificates", icon: "check", run: () => goTo("#certificates") },
  { label: "Go to Interests", icon: "sparkles", run: () => goTo("#interests") },
  { label: "Open Hazard Ready (live site)", icon: "right", run: () => window.open("https://ryhnuu.github.io/Hazard-Perception-Practice/", "_blank", "noopener") },
  { label: "Open Hazard Ready details", icon: "bulb", run: () => openProject("hazard") },
  { label: "Email me", icon: "mail", run: () => { statusEl.textContent = ""; openDialog(dialog); } },
  { label: "Open the adaptive quiz app", icon: "bulb", run: () => openProject("quiz") },
  { label: "Open brain-computer interfaces", icon: "cpu", run: () => openProject("bci") },
  { label: "Switch light or dark theme", icon: "sun", run: () => themeBtn.click() },
  { label: "Back to top", icon: "up", run: () => window.scrollTo({ top: 0, behavior: scrollBehavior }) }
];
if (LINKS.linkedin) commands.push({ label: "Open LinkedIn", icon: "right", run: () => window.open(LINKS.linkedin, "_blank", "noopener") });
if (LINKS.github) commands.push({ label: "Open GitHub", icon: "right", run: () => window.open(LINKS.github, "_blank", "noopener") });

let shown = [], active = 0;
function renderPalette() {
  const q = palInput.value.trim().toLowerCase();
  shown = commands.filter((c) => c.label.toLowerCase().includes(q));
  active = Math.min(active, Math.max(shown.length - 1, 0));
  palList.textContent = "";
  if (!shown.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "Nothing matches that.";
    palList.appendChild(li);
    return;
  }
  shown.forEach((c, i) => {
    const li = document.createElement("li");
    li.id = "pal-opt-" + i;
    li.setAttribute("role", "option");
    li.setAttribute("aria-selected", i === active);
    li.append(icon(c.icon), document.createTextNode(c.label));
    li.addEventListener("click", () => runCommand(c));
    li.addEventListener("pointermove", () => { if (active !== i) { active = i; renderPalette(); } });
    palList.appendChild(li);
  });
  palInput.setAttribute("aria-activedescendant", "pal-opt-" + active);
}
function runCommand(c) { palette.close(); setTimeout(c.run, 60); }
function openPalette() {
  if (root.classList.contains("splash-on") || palette.open) return;
  palInput.value = ""; active = 0; renderPalette(); openDialog(palette); palInput.focus();
}
palInput.addEventListener("input", () => { active = 0; renderPalette(); });
palInput.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % Math.max(shown.length, 1); renderPalette(); }
  else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + shown.length) % Math.max(shown.length, 1); renderPalette(); }
  else if (e.key === "Enter" && shown[active]) { e.preventDefault(); runCommand(shown[active]); }
});
palette.addEventListener("click", (e) => { if (e.target === palette) palette.close(); });
document.getElementById("open-palette").addEventListener("click", openPalette);
document.addEventListener("keydown", (e) => {
  const tag = (e.target.tagName || "");
  const typing = /INPUT|TEXTAREA|SELECT/.test(tag) || e.target.isContentEditable;
  if ((e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing && !document.querySelector("dialog[open]"))) {
    e.preventDefault();
    openPalette();
  }
});
