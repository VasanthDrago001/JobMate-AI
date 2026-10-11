@echo off
title JobMate AI - Test Suite Runner
echo ===================================================
echo  1. Running Backend Pytest Suite
echo ===================================================
backend\.venv\Scripts\pytest.exe backend
if %errorlevel% neq 0 (
    echo [ERROR] Backend tests failed.
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo  2. Running Frontend Vitest Suite
echo ===================================================
call npm.cmd --prefix frontend run test
if %errorlevel% neq 0 (
    echo [ERROR] Frontend tests failed.
    exit /b %errorlevel%
)

echo.
echo ===================================================
echo  ALL TESTS PASSED SUCCESSFULLY!
echo ===================================================
pause
