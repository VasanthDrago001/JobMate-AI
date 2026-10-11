@echo off
title Push JobMate AI to GitHub
echo ===================================================
echo  Pushing to https://github.com/VasanthDrago001/JobMate-AI
echo ===================================================
"C:\Program Files\Git\cmd\git.exe" push -u origin main
if %errorlevel% neq 0 (
    echo.
    echo If the remote repository has existing files (e.g. README or license), syncing...
    "C:\Program Files\Git\cmd\git.exe" pull origin main --rebase --allow-unrelated-histories
    "C:\Program Files\Git\cmd\git.exe" push -u origin main
)
echo.
echo ===================================================
echo  Finished.
echo ===================================================
pause
