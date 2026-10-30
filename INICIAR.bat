@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (echo Instale Node.js LTS antes de continuar. & pause & exit /b 1)
if not exist "backend\.env" (
 copy "backend\.env.example" "backend\.env" >nul
 echo.
 echo Configure DATABASE_URL e JWT_SECRET em backend\.env.
 echo Use um JWT_SECRET aleatorio de 32 caracteres ou mais.
 notepad "backend\.env"
 pause
)
if not exist "backend\node_modules" (
 cd backend
 call npm install
 if errorlevel 1 (pause & exit /b 1)
 cd ..
)
if not exist "frontend\node_modules" (
 cd frontend
 call npm install
 if errorlevel 1 (pause & exit /b 1)
 cd ..
)
start "NekoUrban API" cmd /k "cd /d ""%~dp0backend"" && npm run dev"
start "NekoUrban Angular" cmd /k "cd /d ""%~dp0frontend"" && npm start"
echo Abra http://localhost:4200
pause
