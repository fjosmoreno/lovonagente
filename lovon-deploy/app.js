#!/usr/bin/env node
// ===========================================================
// Lovon Agente — Entry point para CPanel Node.js Selector
// Substitui o start.sh. O CPanel chama este arquivo com `node app.js`.
// ===========================================================

const path = require('path');
const fs = require('fs');

// 1. Descobre o diretório do app
const APP_DIR = __dirname;
process.chdir(APP_DIR);

// 2. Lê o .env manualmente (sem dependência do dotenv)
const envPath = path.join(APP_DIR, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        // Tira aspas
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        // Só seta se ainda não estiver no environment
        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

// 3. Resolve DATABASE_URL absoluto (Prisma resolve relativo ao schema.prisma,
//    não ao cwd, então caminho relativo quebra)
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('file:./')) {
    const relPath = process.env.DATABASE_URL.slice('file:'.length);
    const absPath = path.resolve(APP_DIR, relPath);
    process.env.DATABASE_URL = `file:${absPath}`;
    console.log(`[lovon] DATABASE_URL resolvido: ${process.env.DATABASE_URL}`);
}

// 4. Garante NODE_ENV=production (CPanel define via Modo, mas defensivo)
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// 5. Cria pasta de logs
const logsDir = path.join(APP_DIR, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

// 6. Log inicial
console.log(`[lovon] App dir: ${APP_DIR}`);
console.log(`[lovon] NODE_ENV: ${process.env.NODE_ENV}`);
console.log(`[lovon] PORT: ${process.env.PORT || '(default 3000)'}`);

// 7. Repassa erros não capturados pro log
process.on('uncaughtException', (err) => {
    console.error('[lovon] uncaughtException:', err);
});
process.on('unhandledRejection', (err) => {
    console.error('[lovon] unhandledRejection:', err);
});

// 8. Inicia o server.js do Next.js (standalone)
require('./server.js');
