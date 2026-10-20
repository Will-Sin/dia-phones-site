# Dashboard (desktop app)

A small desktop app: tasks by project and priority, an always-on-top focus timer, and hourly check-ins. Built with Electron, runs on macOS, Windows and Linux.

## Run it

Needs [Node.js](https://nodejs.org) 20 or newer.

```
cd dashboard
npm install
npm start
```

## Build a real app you can put in Applications / Start menu

```
npm run dist
```

The installer lands in `dashboard/dist/` (a `.dmg` on a Mac, an `.exe` installer on Windows, an AppImage on Linux). Build on the OS you want the app for. The Mac build is unsigned, so the first time you open it, right-click the app and choose Open.

## How it works

- Add projects on the right, add tasks with a project and priority. Toggle "By project" / "By priority" to regroup. Tick a task's box to mark it done.
- Click a task to pick 15, 25, 40 or a custom number of minutes. A small timer window appears in the top right of your screen and stays on top of every app until you stop it. Drag it anywhere; it remembers where you put it. When time runs out you get a chime, a notification, and buttons to mark the task done, go again, add 5 minutes, or stop.
- Every hour a check-in window pops up over whatever you're doing and asks what you've done and how it's going. Close it or press Skip to dismiss. Change the interval or turn it off in Settings or from the tray menu.
- Closing the dashboard window doesn't quit: the timer and check-ins keep running, and the app lives in the menu bar (Mac) or system tray (Windows/Linux). On a Mac the menu bar also shows the countdown. Use Quit in that menu to exit.

Your data is stored in `data.json` in the app's data folder (`~/Library/Application Support/focus-dashboard` on Mac, `%APPDATA%\focus-dashboard` on Windows, `~/.config/focus-dashboard` on Linux). Settings -> Export JSON saves a copy.
