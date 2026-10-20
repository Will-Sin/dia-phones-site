// Always-on-top timer window.
let state;
const act = (name, payload) => window.api.action(name, payload);

function render() {
  const t = state?.timer;
  if (!t) return;
  const task = state.tasks.find((x) => x.id === t.taskId);
  const rem = remainingSec(t);
  const paused = t.pausedRemaining != null;
  const box = $("#box");
  box.classList.toggle("paused", paused);
  box.classList.toggle("over", rem < 0);
  $("#task").textContent = task ? task.title : "(deleted task)";
  $("#time").textContent = fmtClock(rem);
  $("#progress").style.width = Math.min(100, Math.max(0, (1 - rem / t.durationSec) * 100)) + "%";
  $("#pause").textContent = paused ? "Resume" : "Pause";
  $("#running-actions").hidden = !!t.finished;
  $("#done-actions").hidden = !t.finished;
}

$("#pause").addEventListener("click", () => act("togglePause"));
$("#plus").addEventListener("click", () => act("addMinutes", 5));
$("#plus2").addEventListener("click", () => act("addMinutes", 5));
$("#stop").addEventListener("click", () => act("stopTimer"));
$("#stop2").addEventListener("click", () => act("stopTimer"));
$("#open").addEventListener("click", () => act("focusMain"));
$("#complete").addEventListener("click", () => act("completeTimerTask"));
$("#again").addEventListener("click", () => act("anotherRound"));

window.api.onState((s) => { state = s; render(); });
window.api.onChime((n) => { if (state?.settings.sound) chime(n); });
window.api.getState().then((s) => { state = s; render(); });
setInterval(render, 250);
