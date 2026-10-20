// Check-in window. Closing it without saving counts as a skip.
let mood = null;

MOODS.forEach((m, i) => $("#moods").append(el("button", {
  type: "button",
  onclick: (e) => {
    mood = i;
    document.querySelectorAll("#moods button").forEach((b) => b.classList.toggle("active", b === e.currentTarget));
  },
}, m)));

const save = () => window.api.action("submitCheckin", { did: $("#did").value.trim(), mood, note: $("#note").value.trim() });
$("#save").addEventListener("click", save);
$("#skip").addEventListener("click", () => window.close());
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") window.close();
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save();
});

window.api.getState().then((state) => {
  const since = Date.now() - state.settings.checkinMinutes * 60000;
  const names = [...new Set(state.sessions.filter((s) => s.end > since).map((s) => s.taskId)
    .concat(state.timer ? [state.timer.taskId] : [])
    .map((id) => state.tasks.find((t) => t.id === id)?.title).filter(Boolean))];
  if (names.length) {
    $("#worked").textContent = `Timed since last check-in: ${names.join(", ")}`;
    $("#worked").hidden = false;
  }
  if (state.settings.sound) chime(2);
});
$("#did").focus();
