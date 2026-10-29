// server/list-logs.js
const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');

if (!fs.existsSync(logDir)) {
    console.log('Nenhum log encontrado. A pasta de logs ainda não existe.');
    process.exit(0);
}

const files = fs.readdirSync(logDir).filter(file => file.endsWith('.json'));

// Ordena por data (mais recente primeiro)
files.sort((a, b) => {
    return fs.statSync(path.join(logDir, b)).mtimeMs - fs.statSync(path.join(logDir, a)).mtimeMs;
});

console.log('--- ÚLTIMOS 5 DISPOSITIVOS CAPTURADOS ---');
files.slice(0, 5).forEach(file => {
    const filePath = path.join(logDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`\n[${data.timestamp}]`);
    console.log(`Dispositivo: ${data.userAgent}`);
    console.log(`IP Público: ${data.publicIP}`);
    console.log(`Fuso Horário: ${data.timezone}`);
    console.log(`Resolução: ${data.screen.width}x${data.screen.height}`);
    console.log('-----------------------------');
});
