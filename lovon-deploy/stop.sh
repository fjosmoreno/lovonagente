#!/usr/bin/env bash
# Para a instância iniciada por start-bg.sh
APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$APP_DIR"
if [ -f lovon.pid ]; then
    PID=$(cat lovon.pid 2>/dev/null || echo "")
    if [ -n "$PID" ] && kill -0 "$PID" 2>/dev/null; then
        kill "$PID" && echo "[lovon] PID $PID encerrado."
    fi
    rm -f lovon.pid
else
    pkill -f "node app.js" 2>/dev/null && echo "[lovon] Encerrado." || echo "[lovon] Nada rodando."
fi
