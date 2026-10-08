document.documentElement.classList.add("js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const canHover = window.matchMedia("(hover: hover)").matches;
const NS = "http://www.w3.org/2000/svg";

// ---------- Welcome splash ----------
const SHOW_INTRO_EVERY_VISIT = true; // set to false to show it once per browser session
const root = document.documentElement;
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
  setTimeout(heroReady, 350);
  setTimeout(() => { splash.remove(); const m = document.getElementById("main"); if (m) m.focus({ preventScroll: true }); }, 1100);
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
  const greetings = [["Hello", "en"], ["স্বাগতম", "bn"], ["Welcome", "en"]];
  let g = 0;
  function showGreeting() {
    greetEl.textContent = greetings[g][0];
    greetEl.setAttribute("lang", greetings[g][1]);
    greetEl.classList.remove("swap");
    void greetEl.offsetWidth;
    greetEl.classList.add("swap");
  }
  showGreeting();
  const cycle = setInterval(() => {
    if (g < greetings.length - 1) { g++; showGreeting(); } else clearInterval(cycle);
  }, 950);
  setTimeout(endSplash, 3300);
  skipBtn.addEventListener("click", endSplash);
  splash.addEventListener("click", endSplash);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") endSplash(); });
  skipBtn.focus({ preventScroll: true });
})();

function icon(name) {
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "i");
  svg.setAttribute("aria-hidden", "true");
  const use = document.createElementNS(NS, "use");
  use.setAttribute("href", "#i-" + name);
  svg.appendChild(use);
  return svg;
}

// ---------- Mobile menu ----------
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
function closeNav() { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", (e) => { if (e.target.tagName === "A") closeNav(); });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && nav.classList.contains("open")) { closeNav(); toggle.focus(); }
});

// ---------- Nav highlight ----------
const links = document.querySelectorAll("nav a");
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((l) => {
      const on = l.getAttribute("href") === "#" + entry.target.id;
      l.classList.toggle("active", on);
      if (on) l.setAttribute("aria-current", "true"); else l.removeAttribute("aria-current");
    });
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

// ---------- Reveal on scroll ----------
document.querySelectorAll(".stagger").forEach((parent) => {
  Array.from(parent.children).forEach((child, i) => {
    child.classList.add("reveal");
    child.style.setProperty("--i", i);
  });
});
document.querySelectorAll(".timeline li").forEach((li, i) => li.style.setProperty("--i", 0));
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.12 });
function watch(el) { if (reduceMotion) el.classList.add("in"); else revealObs.observe(el); }
document.querySelectorAll(".reveal").forEach(watch);

// ---------- Count-up numbers ----------
const countObs = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    countObs.unobserve(e.target);
    const el = e.target;
    const end = Number(el.dataset.count);
    if (reduceMotion) { el.textContent = end; return; }
    const start = performance.now();
    (function step(now) {
      const t = Math.min((now - start) / 1200, 1);
      el.textContent = Math.round(end * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(step);
    })(start);
  });
}, { threshold: 0.6 });
document.querySelectorAll("[data-count]").forEach((el) => {
  if (!reduceMotion) el.textContent = "0";
  countObs.observe(el);
});

// ---------- Scroll effects: progress, parallax, timeline, back-to-top ----------
const progress = document.getElementById("progress");
const bg = document.getElementById("bg");
const toTop = document.getElementById("to-top");
const timeline = document.getElementById("timeline");
const timelineItems = timeline.querySelectorAll("li");
const parallaxEls = document.querySelectorAll("[data-parallax]");
let ticking = false;

function frame() {
  ticking = false;
  const y = window.scrollY;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
  bg.style.setProperty("--sy", y);
  toTop.classList.toggle("show", y > 600);
  if (!reduceMotion && y < window.innerHeight * 1.3) {
    parallaxEls.forEach((el) => { el.style.transform = "translateY(" + (y * Number(el.dataset.parallax)) + "px)"; });
  }
  const r = timeline.getBoundingClientRect();
  const fill = Math.max(0, Math.min(r.height, window.innerHeight * 0.65 - r.top));
  timeline.style.setProperty("--fill", fill + "px");
  timelineItems.forEach((li) => li.classList.toggle("reached", li.getBoundingClientRect().top < window.innerHeight * 0.65));
}
window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
window.addEventListener("resize", frame);
frame();
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

// ---------- Card spotlight and tilt ----------
document.addEventListener("pointermove", (e) => {
  const card = e.target.closest && e.target.closest(".card");
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--mx", e.clientX - r.left + "px");
  card.style.setProperty("--my", e.clientY - r.top + "px");
  if (card.classList.contains("tilt") && canHover && !reduceMotion) {
    const x = (e.clientX - r.left) / r.width - 0.5;
    const yy = (e.clientY - r.top) / r.height - 0.5;
    card.style.setProperty("--ry", (x * 9).toFixed(2) + "deg");
    card.style.setProperty("--rx", (-yy * 9).toFixed(2) + "deg");
  }
});
document.addEventListener("pointerout", (e) => {
  const card = e.target.closest && e.target.closest(".card.tilt");
  if (card && !card.contains(e.relatedTarget)) { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); }
});

// ---------- Hero typing effect ----------
const typed = document.getElementById("typed");
const words = ["people", "teamwork", "solving problems", "customers"];
if (!reduceMotion) {
  let w = 0, c = 0, deleting = false, rounds = 0;
  typed.textContent = "";
  function tick() {
    const word = words[w];
    c += deleting ? -1 : 1;
    typed.textContent = word.slice(0, c);
    let delay = deleting ? 45 : 85;
    if (!deleting && c === word.length) { deleting = true; delay = 1500; }
    else if (deleting && c === 0) {
      deleting = false;
      w = (w + 1) % words.length;
      if (w === 0 && ++rounds >= 2) { typed.textContent = words[0]; return; }
      delay = 300;
    }
    setTimeout(tick, delay);
  }
  afterReady(() => setTimeout(tick, 700));
}

// ---------- Hero network canvas ----------
const canvas = document.getElementById("net");
const ctx = canvas.getContext("2d");
const heroEl = canvas.parentElement;
let W = 0, H = 0, pts = [], mouse = { x: -999, y: -999 }, running = false;

function sizeCanvas() {
  const r = heroEl.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = r.width; H = r.height;
  canvas.width = W * dpr; canvas.height = H * dpr;
  canvas.style.width = W + "px"; canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const n = Math.round(Math.min(75, (W * H) / 15000));
  pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4 }));
  draw(false);
}
function draw(move) {
  ctx.clearRect(0, 0, W, H);
  for (const p of pts) {
    if (move) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
    ctx.fillStyle = "rgba(140, 180, 245, 0.7)";
    ctx.beginPath(); ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2); ctx.fill();
  }
  for (let i = 0; i < pts.length; i++) {
    for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 130) {
        ctx.strokeStyle = "rgba(108, 155, 240," + ((1 - d / 130) * 0.35).toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
      }
    }
    const dm = Math.hypot(pts[i].x - mouse.x, pts[i].y - mouse.y);
    if (dm < 170) {
      ctx.strokeStyle = "rgba(76, 201, 192," + ((1 - dm / 170) * 0.6).toFixed(3) + ")";
      ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
    }
  }
}
function loop() { if (!running) return; draw(true); requestAnimationFrame(loop); }
function setRunning(on) { if (on && !running && !reduceMotion) { running = true; loop(); } else if (!on) running = false; }
sizeCanvas();
window.addEventListener("resize", sizeCanvas);
heroEl.addEventListener("pointermove", (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
heroEl.addEventListener("pointerleave", () => { mouse.x = mouse.y = -999; });
let heroVisible = true;
new IntersectionObserver((entries) => { heroVisible = entries[0].isIntersecting; setRunning(heroVisible && !document.hidden); }).observe(heroEl);
document.addEventListener("visibilitychange", () => setRunning(heroVisible && !document.hidden));

// ---------- Tabs (About me, Education) ----------
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
  { name: "Face-to-face customer service", type: "people", icon: "users", note: "Used every day as a sales executive and while volunteering with BHS." },
  { name: "Teamwork", type: "people", icon: "network", note: "Built through team-based tasks on CyberFirst Horizons and the NHS young persons' group." },
  { name: "Communication", type: "people", icon: "message", note: "Developed in sales, volunteering and the NHS young persons' group." },
  { name: "Decision making", type: "people", icon: "target", note: "Practised as a member of the NHS young persons' group." },
  { name: "Python", type: "technical", icon: "code", level: "Basic, and growing", note: "Used to build my adaptive quiz app, including its Tkinter interface." },
  { name: "MySQL", type: "technical", icon: "database", level: "Basic, and growing", note: "I designed a six-table database for my quiz app." },
  { name: "Algorithm design", type: "technical", icon: "layers", note: "I designed the adaptive algorithm that chooses each quiz question." },
  { name: "Object-oriented programming", type: "technical", icon: "cube", note: "I rewrote my quiz app from procedural code into Python classes." },
  { name: "Problem solving", type: "technical", icon: "zap", note: "Something I enjoy, from cyber security activities to computer science and maths." }
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
    ico.appendChild(icon(s.icon));
    const h = document.createElement("h3");
    h.textContent = s.name;
    const p = document.createElement("p");
    p.textContent = s.note;
    card.append(ico, h, p);
    if (s.level) {
      const l = document.createElement("span");
      l.className = "level";
      l.textContent = s.level;
      card.appendChild(l);
    }
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
const dialog = document.getElementById("contact");
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
    statusEl.textContent = "Email copied. You can paste it into your mail app.";
  } catch (err) {
    const range = document.createRange();
    range.selectNodeContents(document.getElementById("email-text"));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    statusEl.textContent = "Press Ctrl+C (or Cmd+C) to copy the selected email.";
  }
});

// Paste your Formspree form URL here (for example "https://formspree.io/f/abcdwxyz")
// to have messages sent straight to your inbox. Leave it empty to use the mail app instead.
const FORM_ENDPOINT = "";
const emailRow = document.getElementById("email-row");
const emailField = document.getElementById("c-email");
const sendBtn = document.getElementById("send-btn");
if (FORM_ENDPOINT) sendBtn.textContent = "Send message"; else emailRow.hidden = true;

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

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!msg.value.trim()) return fail(msg, "Write a short message first.");
  if (FORM_ENDPOINT && (!emailField.value.trim() || !emailField.validity.valid)) {
    return fail(emailField, "Enter a valid email so I can reply.");
  }
  if (FORM_ENDPOINT) {
    sendBtn.disabled = true;
    statusEl.textContent = "Sending...";
    try {
      const res = await fetch(FORM_ENDPOINT, { method: "POST", body: new FormData(form), headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error("Bad response");
      form.reset();
      statusEl.textContent = "Thanks, your message has been sent.";
    } catch (err) {
      statusEl.textContent = "Sorry, that didn't send. Please use Copy email instead.";
    }
    sendBtn.disabled = false;
    return;
  }
  const name = document.getElementById("c-name").value.trim();
  const body = msg.value.trim() + (name ? "\n\nFrom, " + name : "");
  const url = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Message from your portfolio") + "&body=" + encodeURIComponent(body);
  statusEl.textContent = "Opening your mail app. If nothing opens, use Copy email instead.";
  window.open(url, "_top");
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
      "Each 10-question quiz is built from three groups: gap fill (weak topics), consolidation (topics I'm getting there with) and exploration (topics not seen yet), in a 7/2/1 split.",
      "Wildcard search, mixed-topic quizzes, a results screen with per-topic scores and a performance graph."
    ],
    process: "I built it over three development cycles: first a terminal version with the database, login and algorithm, then an object-oriented rewrite with a Tkinter interface, then search, mixed quizzes and a better results screen.",
    demo: true
  },
  bci: {
    title: "Brain-computer interfaces",
    tags: ["Research", "Writing", "Presenting"],
    summary: "A research project on brain-computer interfaces, which are systems that let the brain communicate directly with a computer or device.",
    points: [
      "Wrote a researched essay on the topic.",
      "Kept a logbook to record my research and progress.",
      "Presented what I learned in a presentation."
    ],
    process: ""
  }
};
const pDialog = document.getElementById("project");
const pBody = document.getElementById("p-body");

function openProject(key) {
  const p = projects[key];
  document.getElementById("p-title").textContent = p.title;
  let html = '<div class="tags">' + p.tags.map((t) => "<span>" + t + "</span>").join("") + "</div>";
  html += "<p>" + p.summary + "</p><h3>What I did</h3><ul>" + p.points.map((x) => "<li>" + x + "</li>").join("") + "</ul>";
  if (p.process) html += "<h3>How I built it</h3><p>" + p.process + "</p>";
  if (p.demo) {
    html += '<div class="demo"><h3>Try the idea</h3>' +
      '<label for="mastery"><span>How well I know a topic</span><output id="m-out">35%</output></label>' +
      '<input type="range" id="mastery" min="0" max="100" value="35">' +
      '<label class="check"><input type="checkbox" id="unseen"> I haven\'t tried this topic yet</label>' +
      '<p class="verdict" id="m-result" aria-live="polite"></p></div>';
  }
  pBody.innerHTML = html;
  if (p.demo) setupDemo();
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
    else if (m <= 0.8) text = "Consolidation: you're getting there, so the app adds some practice to lock it in.";
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

// ---------- Light / dark theme ----------
const themeBtn = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");
function applyTheme(t) {
  document.documentElement.dataset.theme = t;
  themeIcon.setAttribute("href", t === "light" ? "#i-moon" : "#i-sun");
  themeBtn.setAttribute("aria-label", "Switch to " + (t === "light" ? "dark" : "light") + " theme");
}
applyTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
themeBtn.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (err) {}
});

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Cursor glow, magnetic buttons, ripple ----------
const glow = document.getElementById("cursor-glow");
if (glow && canHover && !reduceMotion) {
  let tx = window.innerWidth / 2, ty = window.innerHeight / 2, gx = tx, gy = ty;
  document.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add("on"); });
  document.documentElement.addEventListener("pointerleave", () => glow.classList.remove("on"));
  (function follow() {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    glow.style.transform = "translate(" + (gx - 260) + "px," + (gy - 260) + "px)";
    requestAnimationFrame(follow);
  })();
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
