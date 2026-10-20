// Dashboard window: task list, projects, stats and check-in history.
// All changes go through window.api.action(); the main process sends back the new state.

let state;
let groupBy = localStorage.getItem("dashboard-group") || "project";
let pendingTaskId = null;

const projectById = (id) => state.projects.find((p) => p.id === id);
const taskById = (id) => state.tasks.find((t) => t.id === id);
const act = (name, payload) => window.api.action(name, payload);

function render() {
  renderProjectSelect();
  renderProjects();
  renderTasks();
  renderStats();
  renderCheckins();
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
      el("button", { class: "ghost small del", title: "Delete project", onclick: () => deleteProject(p) }, "x"));
  }));
}

function renderTasks() {
  const showDone = $("#show-done").checked;
  const tasks = state.tasks.filter((t) => showDone || !t.done);
  const byPrio = (a, b) => a.priority - b.priority || a.createdAt - b.createdAt;
  const projName = (t) => projectById(t.projectId)?.name || "";
  const groups = groupBy === "project"
    ? state.projects.map((p) => ({ title: p.name, color: p.color, tasks: tasks.filter((t) => t.projectId === p.id).sort(byPrio) }))
    : [1, 2, 3].map((pr) => ({
        title: PRIORITIES[pr], prio: pr,
        tasks: tasks.filter((t) => t.priority === pr).sort((a, b) => projName(a).localeCompare(projName(b)) || a.createdAt - b.createdAt),
      }));

  $("#task-groups").replaceChildren(...groups.map((g) => el("div", { class: "group" },
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
      onclick: (e) => { e.stopPropagation(); act("toggleTask", t.id); },
    }),
    el("span", { class: "task-title" }, t.title),
    t.spentSec >= 30 ? el("span", { class: "task-meta" }, fmtMinutes(t.spentSec)) : null,
    groupBy === "priority" && p ? el("span", { class: "task-meta" }, p.name) : null,
    groupBy === "project" ? el("span", { class: `prio prio-${t.priority}` }, PRIORITIES[t.priority]) : null,
    el("button", {
      class: "ghost small del", title: "Delete task",
      onclick: (e) => { e.stopPropagation(); if (confirm(`Delete "${t.title}"?`)) act("deleteTask", t.id); },
    }, "x"));
}

function renderStats() {
  const today = state.sessions.filter((s) => isToday(s.start));
  let focusSec = today.reduce((n, s) => n + (s.end - s.start) / 1000, 0);
  const t = state.timer;
  if (t && t.pausedRemaining == null && t.segmentStart) focusSec += (Date.now() - t.segmentStart) / 1000;
  const timers = new Set(today.map((s) => s.timerId ?? s.start));
  if (t) timers.add(t.startedAt);
  const done = state.tasks.filter((x) => x.done && x.doneAt && isToday(x.doneAt)).length;
  const checkins = state.checkins.filter((c) => isToday(c.at)).length;
  const stat = (v, label) => el("div", { class: "stat" }, el("b", {}, String(v)), el("span", {}, label));
  $("#today-stats").replaceChildren(
    stat(fmtMinutes(focusSec), "focused"), stat(timers.size, "sessions"),
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
  $("#next-checkin").textContent = s.checkinsOn && s.nextCheckinAt ? `Next check-in ${fmtTime(s.nextCheckinAt)}` : "Check-ins off";
}

function deleteProject(p) {
  if (state.projects.length === 1) return alert("Keep at least one project.");
  const n = state.tasks.filter((t) => t.projectId === p.id).length;
  if (confirm(`Delete project "${p.name}"${n ? ` and its ${n} task(s)` : ""}?`)) act("deleteProject", p.id);
}

function openStartDialog(taskId) {
  const task = taskById(taskId);
  if (!task) return;
  pendingTaskId = taskId;
  $("#start-task-name").textContent = task.title;
  $("#custom-min").value = "";
  if (!$("#start-dialog").open) $("#start-dialog").showModal();
}
function start(minutes) {
  $("#start-dialog").close();
  act("startTimer", { taskId: pendingTaskId, minutes });
}

function wire() {
  $("#add-task").addEventListener("submit", (e) => {
    e.preventDefault();
    const title = $("#task-title").value.trim();
    if (!title) return;
    act("addTask", { title, projectId: $("#task-project").value, priority: Number($("#task-priority").value) });
    $("#task-title").value = "";
  });
  $("#add-project").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("#project-name").value.trim();
    if (!name) return;
    act("addProject", name);
    $("#project-name").value = "";
  });
  $("#show-done").addEventListener("change", renderTasks);
  document.querySelectorAll(".seg button").forEach((b) => {
    b.classList.toggle("active", b.dataset.group === groupBy);
    b.addEventListener("click", () => {
      groupBy = b.dataset.group;
      document.querySelectorAll(".seg button").forEach((x) => x.classList.toggle("active", x === b));
      localStorage.setItem("dashboard-group", groupBy);
      renderTasks();
    });
  });

  document.querySelectorAll(".durations button").forEach((b) => b.addEventListener("click", () => start(Number(b.dataset.min))));
  const startCustom = () => {
    const m = Number($("#custom-min").value);
    if (!m || m <= 0) return $("#custom-min").focus();
    start(m);
  };
  $("#start-custom").addEventListener("click", startCustom);
  $("#custom-min").addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); startCustom(); } });

  $("#checkin-now").addEventListener("click", () => act("openCheckin"));

  $("#open-settings").addEventListener("click", () => {
    $("#set-checkins").checked = state.settings.checkinsOn;
    $("#set-interval").value = state.settings.checkinMinutes;
    $("#set-sound").checked = state.settings.sound;
    $("#settings-dialog").showModal();
  });
  $("#set-checkins").addEventListener("change", (e) => act("updateSettings", { checkinsOn: e.target.checked }));
  $("#set-interval").addEventListener("change", (e) => {
    const v = Math.max(5, Number(e.target.value) || 60);
    e.target.value = v;
    act("updateSettings", { checkinMinutes: v });
  });
  $("#set-sound").addEventListener("change", (e) => act("updateSettings", { sound: e.target.checked }));
  $("#export-data").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    el("a", { href: URL.createObjectURL(blob), download: `dashboard-${new Date().toISOString().slice(0, 10)}.json` }).click();
  });

  window.api.onState((s) => { state = s; render(); });
  window.api.onPickDuration(openStartDialog);
}

(async function init() {
  state = await window.api.getState();
  wire();
  render();
  // Keep the "focused" stat ticking while a timer runs.
  setInterval(() => { if (state.timer) renderStats(); }, 15000);
})();
