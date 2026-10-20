// Personal dashboard: tasks by project/priority, focus timer, hourly check-ins.
// State is saved to the local server (data.json) and mirrored to localStorage
// so the page still works if opened straight from disk.

const $ = (sel, root = document) => root.querySelector(sel);
const PRIORITIES = { 1: "High", 2: "Medium", 3: "Low" };
const PROJECT_COLORS = ["#3b6ef5", "#d9433b", "#4a9a6a", "#d98a1f", "#8b5cf6", "#0e9aa7", "#c2478f", "#7a7a80"];
const MOODS = ["Rough", "Meh", "OK", "Good", "Great"];
const LS_KEY = "dashboard-state";

const defaultState = () => ({
  projects: [{ id: uid(), name: "General", color: PROJECT_COLORS[0] }],
  tasks: [],
  sessions: [],   // {taskId, start, end, plannedMin}
  checkins: [],   // {at, did, mood, note}
  timer: null,    // {taskId, durationSec, endsAt, pausedRemaining, startedAt}
  settings: { checkinsOn: true, checkinMinutes: 60, sound: true, nextCheckinAt: null },
});

let state;
let useServer = false;
let groupBy = "project";
let pipWindow = null;
let checkinOpen = false;

function uid() { return Math.random().toString(36).slice(2, 10); }

// ---------- persistence ----------
async function load() {
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (res.ok) {
      useServer = true;
      const data = await res.json();
      if (data) return data;
    }
  } catch { /* opened from file:// or server down */ }
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* storage blocked */ }
  return defaultState();
}

let saveTimer = null;
function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
  if (!useServer) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    fetch("/api/state", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    }).catch(() => {});
  }, 200);
}

// ---------- helpers ----------
const projectById = (id) => state.projects.find((p) => p.id === id);
const taskById = (id) => state.tasks.find((t) => t.id === id);

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

// ---------- rendering ----------
function render() {
  renderProjectSelect();
  renderProjects();
  renderTasks();
  renderStats();
  renderCheckins();
  renderTimer();
  renderNextCheckin();
}

function renderProjectSelect() {
  const sel = $("#task-project");
  const current = sel.value;
  sel.replaceChildren(...state.projects.map((p) => el("option", { value: p.id }, p.name)));
  if (state.projects.some((p) => p.id === current)) sel.value = current;
}

function renderProjects() {
  $("#project-list").replaceChildren(...state.projects.map((p) => {
    const open = state.tasks.filter((t) => t.projectId === p.id && !t.done).length;
    return el("li", {},
      el("span", { class: "dot", style: `background:${p.color}` }),
      el("span", { class: "name" }, p.name),
      el("span", { class: "muted small-text" }, `${open} open`),
      el("button", { class: "ghost small del", title: "Delete project", onclick: () => deleteProject(p.id) }, "x"));
  }));
}

function renderTasks() {
  const showDone = $("#show-done").checked;
  const tasks = state.tasks.filter((t) => showDone || !t.done);
  const byPrio = (a, b) => a.priority - b.priority || a.createdAt - b.createdAt;
  let groups;
  if (groupBy === "project") {
    groups = state.projects.map((p) => ({
      title: p.name, color: p.color,
      tasks: tasks.filter((t) => t.projectId === p.id).sort(byPrio),
    }));
  } else {
    groups = [1, 2, 3].map((pr) => ({
      title: PRIORITIES[pr], prio: pr,
      tasks: tasks.filter((t) => t.priority === pr)
        .sort((a, b) => (projectById(a.projectId)?.name || "").localeCompare(projectById(b.projectId)?.name || "") || a.createdAt - b.createdAt),
    }));
  }

  const container = $("#task-groups");
  container.replaceChildren(...groups.map((g) => el("div", { class: "group" },
    el("div", { class: "group-title" },
      g.color ? el("span", { class: "dot", style: `background:${g.color}` }) : el("span", { class: `prio prio-${g.prio}` }, g.title),
      g.color ? g.title : null,
      el("span", { class: "count" }, String(g.tasks.length))),
    g.tasks.length ? g.tasks.map(taskRow) : el("div", { class: "empty" }, "Nothing here."))));
}

function taskRow(t) {
  const p = projectById(t.projectId);
  const active = state.timer && state.timer.taskId === t.id;
  return el("div", {
    class: `task${t.done ? " done" : ""}${active ? " active" : ""}`,
    onclick: () => openStartDialog(t.id),
    title: "Click to start a timer",
  },
    el("input", {
      type: "checkbox", ...(t.done ? { checked: "" } : {}), "aria-label": "Done",
      onclick: (e) => { e.stopPropagation(); toggleDone(t.id); },
    }),
    el("span", { class: "task-title" }, t.title),
    t.spentSec ? el("span", { class: "task-meta" }, fmtMinutes(t.spentSec)) : null,
    groupBy === "priority" && p ? el("span", { class: "task-meta" }, p.name) : null,
    groupBy === "project" ? el("span", { class: `prio prio-${t.priority}` }, PRIORITIES[t.priority]) : null,
    el("button", { class: "ghost small del", title: "Delete task", onclick: (e) => { e.stopPropagation(); deleteTask(t.id); } }, "x"));
}

function renderStats() {
  const done = state.tasks.filter((t) => t.done && t.doneAt && isToday(t.doneAt)).length;
  const focusSec = state.sessions.filter((s) => isToday(s.start)).reduce((n, s) => n + (s.end - s.start) / 1000, 0);
  const sessions = new Set(state.sessions.filter((s) => isToday(s.start)).map((s) => s.timerId ?? s.start)).size;
  const checkins = state.checkins.filter((c) => isToday(c.at)).length;
  const stat = (v, label) => el("div", { class: "stat" }, el("b", {}, String(v)), el("span", {}, label));
  $("#today-stats").replaceChildren(
    stat(fmtMinutes(focusSec), "focused"), stat(sessions, "sessions"),
    stat(done, "tasks done"), stat(checkins, "check-ins"));
}

function renderCheckins() {
  const items = state.checkins.slice(-30).reverse();
  $("#checkin-log").replaceChildren(...(items.length ? items.map((c) => el("li", {},
    el("time", {}, `${new Date(c.at).toLocaleDateString([], { month: "short", day: "numeric" })} ${fmtTime(c.at)}`
      + (c.mood != null ? ` · ${MOODS[c.mood]}` : "")),
    c.did ? el("div", {}, c.did) : null,
    c.note ? el("div", { class: "muted" }, c.note) : null))
    : [el("li", { class: "empty" }, "No check-ins yet.")]));
}

function renderNextCheckin() {
  const s = state.settings;
  $("#next-checkin").textContent = s.checkinsOn && s.nextCheckinAt
    ? `Next check-in ${fmtTime(s.nextCheckinAt)}` : "Check-ins off";
}

// ---------- tasks & projects ----------
function addTask(title, projectId, priority) {
  state.tasks.push({ id: uid(), title, projectId, priority, done: false, createdAt: Date.now(), spentSec: 0 });
  save(); render();
}
function toggleDone(id) {
  const t = taskById(id);
  t.done = !t.done;
  t.doneAt = t.done ? Date.now() : null;
  save(); render();
}
function deleteTask(id) {
  const t = taskById(id);
  if (!confirm(`Delete "${t.title}"?`)) return;
  if (state.timer?.taskId === id) stopTimer(false);
  state.tasks = state.tasks.filter((x) => x.id !== id);
  save(); render();
}
function addProject(name) {
  const color = PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length];
  state.projects.push({ id: uid(), name, color });
  save(); render();
}
function deleteProject(id) {
  const p = projectById(id);
  const n = state.tasks.filter((t) => t.projectId === id).length;
  if (state.projects.length === 1) return alert("Keep at least one project.");
  if (!confirm(`Delete project "${p.name}"${n ? ` and its ${n} task(s)` : ""}?`)) return;
  if (state.timer && taskById(state.timer.taskId)?.projectId === id) stopTimer(false);
  state.projects = state.projects.filter((x) => x.id !== id);
  state.tasks = state.tasks.filter((t) => t.projectId !== id);
  save(); render();
}

// ---------- timer ----------
let pendingTaskId = null;

function openStartDialog(taskId) {
  pendingTaskId = taskId;
  $("#start-task-name").textContent = taskById(taskId).title;
  $("#custom-min").value = "";
  $("#start-dialog").showModal();
}

function startTimer(taskId, minutes) {
  if (state.timer) stopTimer(false);
  const now = Date.now();
  state.timer = { taskId, durationSec: minutes * 60, endsAt: now + minutes * 60000, pausedRemaining: null, startedAt: now, segmentStart: now, notified: false };
  ensureNotificationPermission();
  save(); render();
}

function remainingSec() {
  const t = state.timer;
  if (!t) return 0;
  return t.pausedRemaining != null ? t.pausedRemaining : (t.endsAt - Date.now()) / 1000;
}

// Record focused time from the current running segment into the task + session log.
function flushSegment() {
  const t = state.timer;
  if (!t || t.pausedRemaining != null || !t.segmentStart) return;
  const now = Date.now();
  const task = taskById(t.taskId);
  if (task) task.spentSec = (task.spentSec || 0) + (now - t.segmentStart) / 1000;
  state.sessions.push({ taskId: t.taskId, timerId: t.startedAt, start: t.segmentStart, end: now, plannedMin: Math.round(t.durationSec / 60) });
  t.segmentStart = now;
}

function togglePause() {
  const t = state.timer;
  if (!t) return;
  if (t.pausedRemaining == null) {
    flushSegment();
    t.pausedRemaining = remainingSec();
    t.segmentStart = null;
  } else {
    t.endsAt = Date.now() + t.pausedRemaining * 1000;
    t.pausedRemaining = null;
    t.segmentStart = Date.now();
  }
  save(); render();
}

function addFive() {
  const t = state.timer;
  if (!t) return;
  if (t.pausedRemaining != null) t.pausedRemaining += 300;
  else t.endsAt += 300000;
  t.durationSec += 300;
  t.notified = remainingSec() <= 0 ? t.notified : false;
  save(); render();
}

function stopTimer(rerender = true) {
  flushSegment();
  state.timer = null;
  if (pipWindow) pipWindow.close();
  save();
  if (rerender) render();
}

function onTimerFinished() {
  const t = state.timer;
  t.notified = true;
  save();
  const task = taskById(t.taskId);
  if (state.settings.sound) chime();
  notify("Time's up", task ? task.title : "Timer finished");
  $("#done-task-name").textContent = task ? task.title : "";
  if (!$("#done-dialog").open) $("#done-dialog").showModal();
}

function renderTimer() {
  const box = $("#timer-box");
  const t = state.timer;
  box.hidden = !t;
  document.body.classList.toggle("timer-on", !!t);
  if (!t) return;
  const task = taskById(t.taskId);
  const rem = remainingSec();
  const paused = t.pausedRemaining != null;
  const pct = Math.min(100, Math.max(0, (1 - rem / t.durationSec) * 100));
  box.classList.toggle("paused", paused);
  box.classList.toggle("over", rem < 0);
  $("#timer-task").textContent = task ? task.title : "(deleted task)";
  $("#timer-time").textContent = fmtClock(rem);
  $("#timer-progress").style.width = pct + "%";
  $("#timer-pause").textContent = paused ? "Resume" : "Pause";
  $("#timer-popout").hidden = !("documentPictureInPicture" in window) || !!pipWindow;
  document.title = `${fmtClock(rem)} · ${task ? task.title : "Dashboard"}`;
  renderPip();
}

// ---------- always-on-top pop-out (Document Picture-in-Picture, Chrome/Edge) ----------
async function openPip() {
  if (!("documentPictureInPicture" in window) || pipWindow) return;
  pipWindow = await documentPictureInPicture.requestWindow({ width: 260, height: 150 });
  for (const sheet of document.styleSheets) {
    try {
      const style = document.createElement("style");
      style.textContent = [...sheet.cssRules].map((r) => r.cssText).join("\n");
      pipWindow.document.head.append(style);
    } catch {
      if (sheet.href) pipWindow.document.head.append(el("link", { rel: "stylesheet", href: sheet.href }));
    }
  }
  pipWindow.document.body.append(el("div", { id: "pip-root", style: "padding:10px 12px" }));
  pipWindow.addEventListener("pagehide", () => { pipWindow = null; renderTimer(); });
  renderTimer();
}

function renderPip() {
  if (!pipWindow) return;
  const root = pipWindow.document.getElementById("pip-root");
  const t = state.timer;
  if (!t) return pipWindow.close();
  // A due check-in takes over the pop-out so it is seen even when the browser is behind other windows.
  if (checkinOpen) {
    if (!root.querySelector(".checkin-form")) {
      pipWindow.resizeTo?.(380, 420);
      root.replaceChildren(buildCheckinForm(pipWindow.document, renderPip));
    }
    return;
  }
  const rem = remainingSec();
  const task = taskById(t.taskId);
  const paused = t.pausedRemaining != null;
  if (root.querySelector(".checkin-form")) pipWindow.resizeTo?.(260, 150);
  if (!root.querySelector(".timer-time")) {
    root.replaceChildren(
      el("div", { class: "timer-task" }),
      el("div", { class: "timer-time" }),
      el("div", { class: "timer-bar" }, el("div")),
      el("div", { class: "timer-actions" },
        el("button", { class: "ghost small", "data-act": "pause", onclick: togglePause }),
        el("button", { class: "ghost small", onclick: addFive }, "+5"),
        el("button", { class: "ghost small", onclick: () => stopTimer() }, "Stop")));
  }
  root.className = `${paused ? "paused" : ""} ${rem < 0 ? "over" : ""}`;
  root.querySelector(".timer-task").textContent = task ? task.title : "";
  const time = root.querySelector(".timer-time");
  time.textContent = fmtClock(rem);
  time.style.color = rem < 0 ? "var(--high)" : paused ? "var(--muted)" : "";
  root.querySelector(".timer-bar div").style.width = Math.min(100, Math.max(0, (1 - rem / t.durationSec) * 100)) + "%";
  root.querySelector("[data-act=pause]").textContent = paused ? "Resume" : "Pause";
}

// ---------- hourly check-ins ----------
function scheduleNextCheckin(from = Date.now()) {
  state.settings.nextCheckinAt = from + state.settings.checkinMinutes * 60000;
  save(); renderNextCheckin();
}

function buildCheckinForm(doc, onDone) {
  let mood = null;
  const mk = (tag, attrs, ...kids) => {
    const n = el(tag, attrs, ...kids);
    return doc === document ? n : doc.adoptNode(n);
  };
  const lastHour = state.sessions.filter((s) => s.end > Date.now() - 3600000);
  const worked = [...new Set(lastHour.map((s) => taskById(s.taskId)?.title).filter(Boolean))];
  const did = mk("textarea", { placeholder: "What have you done since the last check-in?" });
  const note = mk("textarea", { placeholder: "How's it going? Anything in the way?", style: "min-height:60px" });
  const moodRow = mk("div", { class: "moods" }, ...MOODS.map((m, i) => mk("button", {
    type: "button",
    onclick: (e) => {
      mood = i;
      moodRow.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
    },
  }, m)));
  const finish = (saveIt) => {
    if (saveIt) state.checkins.push({ at: Date.now(), did: did.value.trim(), mood, note: note.value.trim() });
    checkinOpen = false;
    scheduleNextCheckin();
    if ($("#checkin-dialog").open) $("#checkin-dialog").close();
    save(); render();
    onDone?.();
  };
  const form = mk("div", { class: "checkin-form", style: "display:flex;flex-direction:column;gap:10px" },
    mk("h3", {}, "Check-in"),
    worked.length ? mk("p", { class: "muted small-text", style: "margin:0" }, `Timed in the last hour: ${worked.join(", ")}`) : null,
    did,
    mk("div", { class: "small-text muted" }, "How's it going?"),
    moodRow,
    note,
    mk("div", { class: "dialog-foot" },
      mk("button", { type: "button", class: "ghost", onclick: () => finish(false) }, "Skip"),
      mk("button", { type: "button", onclick: () => finish(true) }, "Save")));
  setTimeout(() => did.focus(), 50);
  return form;
}

function openCheckin() {
  if (checkinOpen) return;
  checkinOpen = true;
  $("#checkin-slot").replaceChildren(buildCheckinForm(document, () => {
    // If answered from the pop-out, close the main dialog too (and vice versa).
    if ($("#checkin-dialog").open) $("#checkin-dialog").close();
  }));
  $("#checkin-dialog").showModal();
  notify("Hourly check-in", "What have you done, and how's it going?");
  if (state.settings.sound) chime(2);
  renderPip();
}

// ---------- notifications & sound ----------
function ensureNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") Notification.requestPermission().then(updateNotifStatus);
}
function notify(title, body) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, { body, tag: title, requireInteraction: true });
  n.onclick = () => { window.focus(); n.close(); };
}
function updateNotifStatus() {
  const p = "Notification" in window ? Notification.permission : "unsupported";
  $("#notif-status").textContent = p;
  $("#notif-enable").hidden = p !== "default";
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

// ---------- main loop ----------
function tick() {
  if (state.timer) {
    if (remainingSec() <= 0 && !state.timer.notified && state.timer.pausedRemaining == null) onTimerFinished();
    renderTimer();
  } else if (document.title !== "My Dashboard") {
    document.title = "My Dashboard";
  }
  const s = state.settings;
  if (s.checkinsOn && s.nextCheckinAt && Date.now() >= s.nextCheckinAt) openCheckin();
}

// ---------- wiring ----------
function wire() {
  $("#add-task").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("#task-title").value.trim();
    if (!title) return;
    addTask(title, $("#task-project").value, Number($("#task-priority").value));
    $("#task-title").value = "";
  });
  $("#add-project").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#project-name").value.trim();
    if (!name) return;
    addProject(name);
    $("#project-name").value = "";
  });
  $("#show-done").addEventListener("change", renderTasks);
  document.querySelectorAll(".seg button").forEach((b) => b.addEventListener("click", () => {
    groupBy = b.dataset.group;
    document.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("active", x === b));
    try { localStorage.setItem("dashboard-group", groupBy); } catch {}
    renderTasks();
  }));

  // Start dialog
  document.querySelectorAll(".durations button").forEach((b) => b.addEventListener("click", () => {
    $("#start-dialog").close();
    startTimer(pendingTaskId, Number(b.dataset.min));
  }));
  const startCustom = () => {
    const m = Number($("#custom-min").value);
    if (!m || m <= 0) return $("#custom-min").focus();
    $("#start-dialog").close();
    startTimer(pendingTaskId, m);
  };
  $("#start-custom").addEventListener("click", startCustom);
  $("#custom-min").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); startCustom(); } });

  // Timer controls
  $("#timer-pause").addEventListener("click", togglePause);
  $("#timer-plus").addEventListener("click", addFive);
  $("#timer-stop").addEventListener("click", () => stopTimer());
  $("#timer-popout").addEventListener("click", openPip);

  // Done dialog
  $("#done-complete").addEventListener("click", () => {
    const id = state.timer?.taskId;
    stopTimer();
    if (id && !taskById(id)?.done) toggleDone(id);
    $("#done-dialog").close();
  });
  $("#done-again").addEventListener("click", () => {
    const id = state.timer?.taskId;
    $("#done-dialog").close();
    stopTimer();
    if (id) openStartDialog(id);
  });

  // Check-ins: closing the dialog with Esc counts as a skip
  $("#checkin-dialog").addEventListener("cancel", () => { checkinOpen = false; scheduleNextCheckin(); renderPip(); });
  $("#checkin-now").addEventListener("click", openCheckin);

  // Settings
  $("#open-settings").addEventListener("click", () => {
    $("#set-checkins").checked = state.settings.checkinsOn;
    $("#set-interval").value = state.settings.checkinMinutes;
    $("#set-sound").checked = state.settings.sound;
    updateNotifStatus();
    $("#settings-dialog").showModal();
  });
  $("#set-checkins").addEventListener("change", (e) => {
    state.settings.checkinsOn = e.target.checked;
    if (e.target.checked) scheduleNextCheckin(); else { save(); renderNextCheckin(); }
  });
  $("#set-interval").addEventListener("change", (e) => {
    const v = Math.max(5, Number(e.target.value) || 60);
    state.settings.checkinMinutes = v;
    scheduleNextCheckin();
  });
  $("#set-sound").addEventListener("change", (e) => { state.settings.sound = e.target.checked; save(); });
  $("#notif-enable").addEventListener("click", () => Notification.requestPermission().then(updateNotifStatus));
  $("#export-data").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    el("a", { href: URL.createObjectURL(blob), download: `dashboard-${new Date().toISOString().slice(0, 10)}.json` }).click();
  });

  // Keep data in sync if the dashboard is open in two tabs
  window.addEventListener("storage", (e) => {
    if (e.key === LS_KEY && e.newValue) { state = JSON.parse(e.newValue); render(); }
  });
  window.addEventListener("beforeunload", () => {
    if (state.timer) flushSegment();
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch {}
    if (useServer) navigator.sendBeacon?.("/api/state", new Blob([JSON.stringify(state)], { type: "application/json" }));
  });
}

(async function init() {
  state = Object.assign(defaultState(), await load());
  state.settings = Object.assign(defaultState().settings, state.settings);
  try { groupBy = localStorage.getItem("dashboard-group") || "project"; } catch {}
  document.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("active", x.dataset.group === groupBy));
  if (state.settings.checkinsOn && !state.settings.nextCheckinAt) scheduleNextCheckin();
  wire();
  render();
  setInterval(tick, 1000);
  tick();
})();
