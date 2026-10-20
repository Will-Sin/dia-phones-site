// Main process: owns all state, the focus timer and the hourly check-in schedule,
// so they keep running even when the dashboard window is closed.
const { app, BrowserWindow, ipcMain, screen, Notification, Tray, Menu, nativeImage, powerMonitor } = require("electron");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(app.getPath("userData"), "data.json");
const PROJECT_COLORS = ["#3b6ef5", "#d9433b", "#4a9a6a", "#d98a1f", "#8b5cf6", "#0e9aa7", "#c2478f", "#7a7a80"];
const TIMER_SIZE = { width: 250, height: 118 };
const TIMER_DONE_SIZE = { width: 250, height: 140 };

const uid = () => Math.random().toString(36).slice(2, 10);

const defaultState = () => ({
  projects: [{ id: uid(), name: "General", color: PROJECT_COLORS[0] }],
  tasks: [],      // {id, title, projectId, priority 1-3, done, doneAt, createdAt, spentSec}
  sessions: [],   // {taskId, timerId, start, end, plannedMin}
  checkins: [],   // {at, did, mood, note}
  timer: null,    // {taskId, durationSec, endsAt, pausedRemaining, startedAt, segmentStart, finished}
  settings: { checkinsOn: true, checkinMinutes: 60, sound: true, nextCheckinAt: null, timerPos: null },
});

let state;
let mainWin = null, timerWin = null, checkinWin = null, tray = null;
let quitting = false;

// ---------- persistence ----------
function load() {
  try {
    const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    const d = defaultState();
    return { ...d, ...data, settings: { ...d.settings, ...data.settings } };
  } catch {
    return defaultState();
  }
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 300);
}
function saveNow() {
  clearTimeout(saveTimer);
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}

function broadcast() {
  for (const w of [mainWin, timerWin, checkinWin]) {
    if (w && !w.isDestroyed()) w.webContents.send("state", state);
  }
  updateTray();
}
function commit() { save(); broadcast(); }

// ---------- timer ----------
const taskById = (id) => state.tasks.find((t) => t.id === id);

function remainingSec() {
  const t = state.timer;
  if (!t) return 0;
  return t.pausedRemaining != null ? t.pausedRemaining : (t.endsAt - Date.now()) / 1000;
}

// Move time from the running segment into the task total and the session log.
function flushSegment() {
  const t = state.timer;
  if (!t || t.pausedRemaining != null || !t.segmentStart) return;
  const now = Date.now();
  const task = taskById(t.taskId);
  if (task) task.spentSec = (task.spentSec || 0) + (now - t.segmentStart) / 1000;
  state.sessions.push({ taskId: t.taskId, timerId: t.startedAt, start: t.segmentStart, end: now, plannedMin: Math.round(t.durationSec / 60) });
  t.segmentStart = now;
}

function startTimer(taskId, minutes) {
  if (state.timer) stopTimer();
  const now = Date.now();
  state.timer = { taskId, durationSec: minutes * 60, endsAt: now + minutes * 60000, pausedRemaining: null, startedAt: now, segmentStart: now, finished: false };
  showTimerWindow();
  commit();
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
  commit();
}

function addMinutes(min) {
  const t = state.timer;
  if (!t) return;
  if (t.pausedRemaining != null) t.pausedRemaining += min * 60;
  else t.endsAt += min * 60000;
  t.durationSec += min * 60;
  if (remainingSec() > 0) t.finished = false;
  resizeTimer();
  commit();
}

function stopTimer() {
  flushSegment();
  state.timer = null;
  if (timerWin && !timerWin.isDestroyed()) timerWin.hide();
  commit();
}

function finishTimer() {
  state.timer.finished = true;
  const task = taskById(state.timer.taskId);
  notify("Time's up", task ? task.title : "Timer finished");
  resizeTimer();
  if (timerWin) timerWin.webContents.send("chime", 3);
  commit();
}

// ---------- check-ins ----------
function scheduleNextCheckin() {
  state.settings.nextCheckinAt = Date.now() + state.settings.checkinMinutes * 60000;
}

function openCheckin() {
  if (checkinWin && !checkinWin.isDestroyed()) {
    checkinWin.show();
    checkinWin.focus();
    return;
  }
  const { workArea } = screen.getPrimaryDisplay();
  const w = 440, h = 470;
  checkinWin = new BrowserWindow({
    width: w, height: h,
    x: Math.round(workArea.x + (workArea.width - w) / 2),
    y: Math.round(workArea.y + (workArea.height - h) / 3),
    title: "Check-in",
    alwaysOnTop: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    show: false,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  checkinWin.setAlwaysOnTop(true, "floating");
  checkinWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  checkinWin.loadFile(path.join(__dirname, "src", "checkin.html"));
  checkinWin.once("ready-to-show", () => {
    checkinWin.show();
    checkinWin.focus();
    app.focus({ steal: true });
  });
  // Closing the window without saving counts as a skip.
  checkinWin.on("closed", () => {
    checkinWin = null;
    scheduleNextCheckin();
    commit();
  });
  notify("Check-in", "What have you done, and how's it going?");
}

function submitCheckin(entry) {
  state.checkins.push({ at: Date.now(), did: entry.did || "", mood: entry.mood ?? null, note: entry.note || "" });
  commit();
  if (checkinWin) checkinWin.close();
}

// ---------- the 1-second loop ----------
function tick() {
  const t = state.timer;
  if (t && !t.finished && t.pausedRemaining == null && remainingSec() <= 0) finishTimer();
  const s = state.settings;
  if (s.checkinsOn && s.nextCheckinAt && Date.now() >= s.nextCheckinAt && !checkinWin) openCheckin();
  if (t) updateTray();
}

// ---------- windows ----------
function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1180, height: 780, minWidth: 420, minHeight: 400,
    title: "Dashboard",
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  mainWin.loadFile(path.join(__dirname, "src", "dashboard.html"));
  // Closing the dashboard keeps the app (timer + check-ins) running in the tray / menu bar.
  mainWin.on("close", (e) => {
    if (!quitting) { e.preventDefault(); mainWin.hide(); }
  });
}
function showMain() {
  if (!mainWin || mainWin.isDestroyed()) createMainWindow();
  mainWin.show();
  mainWin.focus();
}

function timerBounds() {
  const size = state.timer?.finished ? TIMER_DONE_SIZE : TIMER_SIZE;
  const pos = state.settings.timerPos;
  if (pos) return { ...pos, ...size };
  const { workArea } = screen.getPrimaryDisplay();
  return { x: workArea.x + workArea.width - size.width - 12, y: workArea.y + 12, ...size };
}

function createTimerWindow() {
  timerWin = new BrowserWindow({
    ...timerBounds(),
    frame: false,
    transparent: true,
    resizable: false,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: true,
    show: false,
    focusable: true,
    webPreferences: { preload: path.join(__dirname, "preload.js") },
  });
  timerWin.setAlwaysOnTop(true, "screen-saver");
  timerWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  timerWin.loadFile(path.join(__dirname, "src", "timer.html"));
  timerWin.on("moved", () => {
    const [x, y] = timerWin.getPosition();
    state.settings.timerPos = { x, y };
    save();
  });
  timerWin.on("closed", () => { timerWin = null; });
}
function showTimerWindow() {
  if (!timerWin || timerWin.isDestroyed()) createTimerWindow();
  timerWin.setBounds(timerBounds());
  if (timerWin.webContents.isLoading()) timerWin.once("ready-to-show", () => timerWin.showInactive());
  else timerWin.showInactive();
}
function resizeTimer() {
  if (timerWin && !timerWin.isDestroyed()) timerWin.setBounds(timerBounds());
}

// ---------- tray / menu bar ----------
function fmtClock(sec) {
  const neg = sec < 0;
  sec = Math.abs(Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return (neg ? "+" : "") + `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "assets", "trayTemplate.png"));
  tray = new Tray(icon);
  tray.setToolTip("Dashboard");
  tray.on("click", showMain);
  updateTray();
}
let lastMenuKey = "";
function updateTray() {
  if (!tray) return;
  const t = state.timer;
  if (process.platform === "darwin") tray.setTitle(t ? ` ${fmtClock(remainingSec())}` : "");
  const menuKey = `${!!t}|${state.settings.checkinsOn}`;
  if (menuKey === lastMenuKey) return;
  lastMenuKey = menuKey;
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Open dashboard", click: showMain },
    { label: "Check in now", click: openCheckin },
    { label: "Show timer", enabled: !!t, click: showTimerWindow },
    { label: "Stop timer", enabled: !!t, click: stopTimer },
    { type: "separator" },
    { label: "Hourly check-ins", type: "checkbox", checked: state.settings.checkinsOn, click: (i) => actions.updateSettings({ checkinsOn: i.checked }) },
    { type: "separator" },
    { label: "Quit", click: () => { quitting = true; app.quit(); } },
  ]));
}

function notify(title, body) {
  if (!Notification.isSupported()) return;
  const n = new Notification({ title, body, silent: !state.settings.sound });
  n.on("click", showMain);
  n.show();
}

// ---------- actions from renderers ----------
const actions = {
  addProject(name) {
    state.projects.push({ id: uid(), name, color: PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length] });
  },
  deleteProject(id) {
    if (state.projects.length === 1) return;
    if (state.timer && taskById(state.timer.taskId)?.projectId === id) stopTimer();
    state.projects = state.projects.filter((p) => p.id !== id);
    state.tasks = state.tasks.filter((t) => t.projectId !== id);
  },
  addTask({ title, projectId, priority }) {
    state.tasks.push({ id: uid(), title, projectId, priority, done: false, doneAt: null, createdAt: Date.now(), spentSec: 0 });
  },
  toggleTask(id) {
    const t = taskById(id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : null;
  },
  deleteTask(id) {
    if (state.timer?.taskId === id) stopTimer();
    state.tasks = state.tasks.filter((t) => t.id !== id);
  },
  startTimer({ taskId, minutes }) { startTimer(taskId, minutes); },
  togglePause,
  addMinutes,
  stopTimer,
  completeTimerTask() {
    const id = state.timer?.taskId;
    stopTimer();
    const t = id && taskById(id);
    if (t && !t.done) { t.done = true; t.doneAt = Date.now(); }
  },
  anotherRound() {
    const id = state.timer?.taskId;
    stopTimer();
    if (id) { showMain(); mainWin.webContents.send("pick-duration", id); }
  },
  submitCheckin,
  openCheckin,
  updateSettings(patch) {
    Object.assign(state.settings, patch);
    if ("checkinsOn" in patch || "checkinMinutes" in patch) {
      if (state.settings.checkinsOn) scheduleNextCheckin();
    }
    lastMenuKey = "";
  },
  focusMain: showMain,
};

ipcMain.handle("get-state", () => state);
ipcMain.handle("action", (_e, name, payload) => {
  if (!actions[name]) throw new Error(`Unknown action ${name}`);
  actions[name](payload);
  commit();
  return state;
});

// ---------- app lifecycle ----------
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", showMain);

  app.whenReady().then(() => {
    state = load();
    if (state.settings.checkinsOn && !state.settings.nextCheckinAt) scheduleNextCheckin();
    // A check-in that fell due while the app was closed is pushed out rather than fired on launch.
    if (state.settings.nextCheckinAt && state.settings.nextCheckinAt < Date.now()) scheduleNextCheckin();
    if (state.timer && state.timer.pausedRemaining == null) state.timer.segmentStart = Date.now();
    if (process.platform === "darwin") app.dock?.show();
    createMainWindow();
    createTray();
    if (state.timer) showTimerWindow();
    setInterval(tick, 1000);
    // Waking the computer after a check-in fell due asks right away.
    powerMonitor.on("resume", () => {
      if (state.settings.checkinsOn && !checkinWin && state.settings.nextCheckinAt < Date.now()) openCheckin();
    });
    save();
  });

  app.on("activate", showMain);
  app.on("before-quit", () => {
    quitting = true;
    flushSegment();
    saveNow();
  });
  // Keep running in the tray when every window is closed.
  app.on("window-all-closed", () => {});
}
