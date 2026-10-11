@echo off
title JobMate AI - Backend Server
echo ===================================================
echo  Starting JobMate AI FastAPI Backend (Port 8000)
echo ===================================================
echo API URL:   http://127.0.0.1:8000
echo Health:    http://127.0.0.1:8000/health
echo Swagger:   http://127.0.0.1:8000/docs
echo ===================================================
backend\.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --host 127.0.0.1 --port 8000 --reload
pause
