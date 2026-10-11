@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Can cai Node.js 20+ : https://nodejs.org & pause & exit /b 1)
if not exist .env.local copy .env.local.example .env.local >nul
start "" cmd /c "timeout /t 2 >nul & for /f %%u in (data\.url) do start %%u"
node server.mjs
pause
