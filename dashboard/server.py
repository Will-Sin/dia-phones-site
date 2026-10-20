#!/usr/bin/env python3
"""Local dashboard server. Serves the static files in this folder and
stores all dashboard state in data.json next to this script.

Usage: python3 server.py [port]    (default port 8765, localhost only)
"""
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(ROOT, "data.json")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8765


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _json(self, code, body):
        data = json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == "/api/state":
            if os.path.exists(DATA_FILE):
                with open(DATA_FILE, encoding="utf-8") as f:
                    return self._json(200, json.load(f))
            return self._json(200, None)
        if self.path.startswith("/data.json") or self.path.startswith("/server.py"):
            return self.send_error(404)
        return super().do_GET()

    def do_PUT(self):
        if self.path != "/api/state":
            return self.send_error(404)
        length = int(self.headers.get("Content-Length", 0))
        try:
            state = json.loads(self.rfile.read(length))
        except ValueError:
            return self._json(400, {"error": "invalid json"})
        tmp = DATA_FILE + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(state, f, indent=2)
        os.replace(tmp, DATA_FILE)
        return self._json(200, {"ok": True})

    do_POST = do_PUT  # navigator.sendBeacon on page close uses POST

    def log_message(self, fmt, *args):
        if "/api/state" not in str(args[0] if args else ""):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Dashboard running at http://localhost:{PORT}  (Ctrl+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
