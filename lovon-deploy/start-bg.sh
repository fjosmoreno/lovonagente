#!/usr/bin/env bash
# ===========================================================
# Lovon Agente — Inicia em background (para VPS / SSH direto)
# Use somente se NÃO estiver usando o CPanel Node.js Selector.
# ===========================================================

set -e

APP_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$APP_DIR"

export PORT="${PORT:-3000}"
export HOSTNAME="${HOSTNAME:-0.0.0.0}"
export NODE_ENV="production"

mkdir -p logs

if [ -f lovon.pid ]; then
    OLD_PID=$(cat lovon.pid 2>/dev/null || echo "")
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
        echo "[lovon] Encerrando PID anterior $OLD_PID..."
        kill "$OLD_PID" || true
        sleep 2
    fi
    rm -f lovon.pid
fi

nohup node app.js > logs/server.log 2>&1 &
PID=$!
echo $PID > lovon.pid

echo "[lovon] Iniciado (PID $PID). Logs em logs/server.log"
echo "[lovon] Acesse http://localhost:$PORT"
