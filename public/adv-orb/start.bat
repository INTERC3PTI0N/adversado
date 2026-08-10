@echo off
cd /d "%~dp0"
echo Starting local server at http://localhost:3456
echo Press Ctrl+C to stop.
start "" "http://localhost:3456"
python -m http.server 3456
