// Helpers shared by the dashboard, timer and check-in windows.
const $ = (sel, root = document) => root.querySelector(sel);
const PRIORITIES = { 1: "High", 2: "Medium", 3: "Low" };
const MOODS = ["Rough", "Meh", "OK", "Good", "Great"];

function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") node.className = v;
    else if (k.startsWith("on")) node.addEventListener(k.slice(2), v);
    else if (k === "style") node.style.cssText = v;
    else node.setAttribute(k, v);
  }
  for (const c of children.flat()) if (c != null) node.append(c);
  return node;
}

function remainingSec(timer) {
  if (!timer) return 0;
  return timer.pausedRemaining != null ? timer.pausedRemaining : (timer.endsAt - Date.now()) / 1000;
}
function fmtClock(sec) {
  const neg = sec < 0;
  sec = Math.abs(Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const body = h ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
                 : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return (neg ? "+" : "") + body;
}
function fmtMinutes(sec) {
  const m = Math.round(sec / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;
}
function fmtTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function isToday(ts) {
  return new Date(ts).toDateString() === new Date().toDateString();
}

let audioCtx;
function chime(times = 3) {
  try {
    audioCtx ||= new AudioContext();
    for (let i = 0; i < times; i++) {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      const t0 = audioCtx.currentTime + i * 0.35;
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      o.connect(g).connect(audioCtx.destination);
      o.start(t0); o.stop(t0 + 0.32);
    }
  } catch {}
}
