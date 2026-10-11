@echo off
title JobMate AI - Frontend Dev Server
echo ===================================================
echo  Starting JobMate AI React Frontend (Port 5173)
echo ===================================================
echo Web App:   http://localhost:5173
echo ===================================================
call npm.cmd --prefix frontend run dev
pause
