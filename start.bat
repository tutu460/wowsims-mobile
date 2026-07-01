@echo off
chcp 65001 >nul 2>&1
title WoWSims 本地模拟器
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   WoWSims WOTLK 本地模拟器          ║
echo  ║   启动中...                         ║
echo  ╚══════════════════════════════════════╝
echo.

:: Try Python 3 first, then Python, then py launcher
where python3 >nul 2>&1
if %ERRORLEVEL%==0 (
    set PYTHON=python3
    goto :found
)
where python >nul 2>&1
if %ERRORLEVEL%==0 (
    set PYTHON=python
    goto :found
)
where py >nul 2>&1
if %ERRORLEVEL%==0 (
    set PYTHON=py
    goto :found
)
echo [错误] 未找到 Python，请先安装 Python 3
echo 下载地址: https://www.python.org/downloads/
pause
exit /b 1

:found
echo 使用 Python: %PYTHON%
echo.

:: Get local IP
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4"') do (
    for /f "tokens=1 delims= " %%b in ("%%a") do (
        set LOCAL_IP=%%b
    )
)

echo  ╔══════════════════════════════════════╗
echo  ║   服务已启动！                      ║
echo  ║                                    ║
echo  ║   本机访问: http://127.0.0.1:8080   ║
echo  ║   手机访问: http://%LOCAL_IP%:8080    ║
echo  ║                                    ║
echo  ║   手机请确保连接同一WiFi           ║
echo  ║   按 Ctrl+C 停止服务               ║
echo  ╚══════════════════════════════════════╝
echo.

%PYTHON% -m http.server 8080 --bind 0.0.0.0
pause
