@echo off
setlocal

REM === 项目根目录：根据实际情况修改。现在是 G:\windsurf_interview system ===
set "ROOT=%~dp0"

REM 如果存在虚拟环境，就优先使用虚拟环境里的 python
if exist "%ROOT%\venv\Scripts\python.exe" (
  set "PYTHON=%ROOT%\venv\Scripts\python.exe"
) else (
  set "PYTHON=python"
)

REM === 启动后端（FastAPI）===
start "后端 Backend" /D "%ROOT%\backend" "%PYTHON%" -m uvicorn main:app --reload --port 8000

REM === 启动前端（Next.js）===
start "前端 Frontend" /D "%ROOT%\frontend" cmd /k npm run dev

endlocal
