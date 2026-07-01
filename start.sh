#!/bin/bash
echo ""
echo "╔══════════════════════════════════════╗"
echo "║   WoWSims WOTLK 本地模拟器          ║"
echo "║   启动中...                         ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Find Python
PYTHON=""
for cmd in python3 python; do
    if command -v $cmd &> /dev/null; then
        PYTHON=$cmd
        break
    fi
done

if [ -z "$PYTHON" ]; then
    echo "[错误] 未找到 Python，请先安装 Python 3"
    exit 1
fi

echo "使用 Python: $PYTHON"

# Get local IP
if command -v ip &> /dev/null; then
    LOCAL_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7; exit}')
elif command -v ifconfig &> /dev/null; then
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
fi

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   服务已启动！                      ║"
echo "║                                    ║"
echo "║   本机访问: http://127.0.0.1:8080   ║"
echo "║   手机访问: http://${LOCAL_IP}:8080   ║"
echo "║                                    ║"
echo "║   手机请确保连接同一WiFi           ║"
echo "║   按 Ctrl+C 停止服务               ║"
echo "╚══════════════════════════════════════╝"
echo ""

$PYTHON -m http.server 8080 --bind 0.0.0.0
