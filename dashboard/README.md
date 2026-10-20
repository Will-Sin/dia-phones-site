# Personal dashboard

A small local dashboard: tasks by project and priority, a focus timer, and hourly check-ins.

## Run it

```
python3 server.py
```

Then open http://localhost:8765. Needs only Python 3, no installs. Pass a port to change it: `python3 server.py 9000`.

Your data is saved to `data.json` in this folder (git-ignored). Back it up or use Settings -> Export JSON.

## How it works

- Add projects on the right, add tasks with a project and priority. Toggle "By project" / "By priority" to regroup.
- Click a task to pick 15, 25, 40 or a custom number of minutes. The timer box sits in the top right of the page until you stop it. When time runs out you get a chime, a desktop notification, and the option to mark the task done or go another round. Time spent is tracked per task.
- **Pop out** (Chrome/Edge only) opens the timer in a small always-on-top window, so it stays visible over other apps.
- Every hour a check-in window asks what you've done and how it's going. Answers show in the Check-ins panel. Change the interval or turn it off in Settings.
- Allow notifications when the browser asks, so the timer and check-ins can reach you when the tab is in the background. If the pop-out window is open, the check-in form also appears there.

Keep the tab open (it can be in the background). Browsers slow timers in hidden tabs, so an alert can arrive up to about a minute late; the countdown itself stays accurate.
