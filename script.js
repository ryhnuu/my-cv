document.documentElement.classList.add("js");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Mobile menu
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", open);
});
nav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") { nav.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
});

// Scroll progress bar
const progress = document.getElementById("progress");
function updateProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
}
window.addEventListener("scroll", updateProgress, { passive: true });
updateProgress();

// Highlight current section in nav
const links = document.querySelectorAll("nav a");
const spy = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      links.forEach((l) => l.classList.toggle("active", l.getAttribute("href") === "#" + entry.target.id));
    }
  });
}, { rootMargin: "-40% 0px -55% 0px" });
document.querySelectorAll("main section[id]").forEach((s) => spy.observe(s));

// Scroll reveal
const reveal = new IntersectionObserver((entries) => {
  entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); } });
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => reveal.observe(el));

// Rotating word in hero
const words = ["people", "teamwork", "solving problems"];
const rotator = document.getElementById("rotator");
if (!reduceMotion) {
  let i = 0;
  setInterval(() => {
    rotator.classList.add("fade");
    setTimeout(() => {
      i = (i + 1) % words.length;
      rotator.textContent = words[i];
      rotator.classList.remove("fade");
    }, 300);
  }, 2600);
}

// Tabs (About me, Education)
document.querySelectorAll(".tabs").forEach((group) => {
  const tabs = group.querySelectorAll(".tab");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", on);
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      });
    });
  });
});

// Skills: filter + detail
const skills = [
  { name: "Face-to-face customer service", type: "people", note: "Used every day as a sales executive and while volunteering with BHS." },
  { name: "Teamwork", type: "people", note: "Built through team-based tasks on CyberFirst Horizons and the NHS young persons' group." },
  { name: "Communication", type: "people", note: "Developed in sales, volunteering and the NHS young persons' group." },
  { name: "Decision making", type: "people", note: "Practised as a member of the NHS young persons' group." },
  { name: "Python", type: "technical", note: "Basic level, and growing through my computer science studies." },
  { name: "MySQL", type: "technical", note: "Basic level, and growing through my computer science studies." },
  { name: "Problem solving", type: "technical", note: "Something I enjoy, from cyber security activities to computer science and maths." }
];
const chips = document.getElementById("chips");
const detail = document.getElementById("skill-detail");
const filters = document.querySelectorAll(".filter");

function showDetail(skill) {
  detail.textContent = "";
  const strong = document.createElement("strong");
  strong.textContent = skill.name + ": ";
  detail.append(strong, skill.note);
}
function renderChips(filter) {
  chips.textContent = "";
  skills.filter((s) => filter === "all" || s.type === filter).forEach((skill) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.textContent = skill.name;
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", c === b));
      showDetail(skill);
    });
    chips.appendChild(b);
  });
  chips.firstChild.click();
}
filters.forEach((f) => f.addEventListener("click", () => {
  filters.forEach((x) => x.setAttribute("aria-pressed", x === f));
  renderChips(f.dataset.filter);
}));
renderChips("all");

// Contact dialog
const EMAIL = "08rayhan.uddin@gmail.com";
const dialog = document.getElementById("contact");
const statusEl = document.getElementById("contact-status");
const form = document.getElementById("contact-form");
const msg = document.getElementById("c-msg");

document.querySelectorAll(".open-contact").forEach((b) => b.addEventListener("click", () => {
  statusEl.textContent = "";
  if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
}));
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

form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!msg.value.trim()) {
    msg.classList.add("invalid");
    msg.focus();
    statusEl.textContent = "Write a short message first.";
    return;
  }
  msg.classList.remove("invalid");
  const name = document.getElementById("c-name").value.trim();
  const body = msg.value.trim() + (name ? "\n\nFrom, " + name : "");
  const url = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Message from your portfolio") + "&body=" + encodeURIComponent(body);
  statusEl.textContent = "Opening your mail app. If nothing opens, use Copy email instead.";
  window.open(url, "_top");
});
msg.addEventListener("input", () => msg.classList.remove("invalid"));

document.getElementById("year").textContent = new Date().getFullYear();
