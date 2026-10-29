// server/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' })); // Aumenta o limite para payloads grandes (fingerprinting)

// Servir os arquivos estáticos (HTML e JS) da pasta public
app.use(express.static(path.join(__dirname, '../public')));

// Função para sanitizar o nome do arquivo
// Remove caracteres inválidos no Windows: < > : " / \ | ? *
function sanitizeFilename(str) {
    if (!str) return 'unknown';
    return str
        .replace(/[<>:"/\\|?*]/g, '_') // Substitui caracteres inválidos por underscore
        .replace(/\s+/g, '_')          // Substitui espaços por underscore
        .substring(0, 50);             // Limita o tamanho do nome do arquivo
}

// Função auxiliar para salvar logs
// Em Vercel o filesystem é efêmero — usamos /tmp e também logamos no console (visível nos logs da função)
function saveLog(data, prefix = 'deephat') {
    const logDir = process.env.VERCEL ? path.join('/tmp', 'logs') : path.join(__dirname, '../logs');
    
    // Cria a pasta de logs se não existir
    try {
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
    } catch (e) {
        console.error('Não foi possível criar pasta de logs:', e.message);
    }

    // Gera um nome de arquivo único e seguro
    // Usa timestamp + parte do userAgent sanitizado
    const uaPart = sanitizeFilename(data.userAgent || data.parsedUserAgent?.browser || 'unknown');
    const filename = `${Date.now()}-${prefix}-${uaPart}.json`;
    const filepath = path.join(logDir, filename);

    // Sempre loga no console (importante para Vercel Function Logs)
    console.log(`[LOG] ${prefix.toUpperCase()} | filename=${filename}`);
    console.log(JSON.stringify(data, null, 2));

    try {
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`[LOG] Salvo em: ${filepath}`);
        return { success: true, filename: filename };
    } catch (err) {
        console.error('Erro ao salvar log em disco (usando apenas console):', err.message);
        return { success: true, filename: filename, note: 'logged to console only' };
    }
}

// --- ROTA 1: Coleta Principal (Dados Iniciais) ---
app.post('/api/collect', (req, res) => {
    try {
        const data = req.body;
        console.log(`\n[NOW] NOVO DEVICE CAPTURADO`);
        console.log(`[IP] ${data.publicIP}`);
        console.log(`[UA] ${data.parsedUserAgent?.browser} ${data.parsedUserAgent?.browserVersion} on ${data.parsedUserAgent?.os} ${data.parsedUserAgent?.osVersion}`);
        console.log(`[DEVICE] ${data.parsedUserAgent?.device} (${data.parsedUserAgent?.deviceType})`);
        console.log(`[GEO-IP] ${data.ipGeolocation?.city}, ${data.ipGeolocation?.region}`);
        
        const result = saveLog(data, 'main');
        res.status(200).json(result);
    } catch (err) {
        console.error('Erro no /api/collect:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- ROTA 2: Consentimento e Fingerprint Avançado ---
app.post('/api/consent', (req, res) => {
    try {
        const data = req.body;
        const status = data.consent ? 'ACEITOU' : 'RECUSOU';
        console.log(`\n[CONSENT] Usuário ${status} cookies.`);
        console.log(`[BEHAVIOR] Tempo na página: ${data.behavior?.timeOnPage}s | Cliques: ${data.behavior?.clicks} | Mouse Moves: ${data.behavior?.mouseMoves}`);
        
        if (data.advancedFingerprint) {
            console.log(`[WEBGL] ${data.advancedFingerprint.webgl?.renderer}`);
            console.log(`[FONTS] ${data.advancedFingerprint.fonts?.length} fontes detectadas`);
        }

        const result = saveLog(data, 'consent');
        res.status(200).json(result);
    } catch (err) {
        console.error('Erro no /api/consent:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- ROTA 3: Health Check (Opcional) ---
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- INICIALIZAÇÃO ---
// Em ambiente local escuta a porta; no Vercel exporta o app
if (require.main === module) {
    app.listen(PORT, () => {
        console.log('==================================================');
        console.log(' DeepHat Intelligence Collector Online');
        console.log(` Servidor rodando em http://localhost:${PORT}`);
        console.log('==================================================');
        console.log(' Acesse o navegador para iniciar a coleta.\n');
    });
}

module.exports = app;
