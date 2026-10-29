// server/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json({ limit: '10mb' }));

// Servir arquivos estáticos — tenta vários caminhos possíveis no Vercel
const possiblePublicPaths = [
  path.join(__dirname, '../public'),
  path.join(__dirname, 'public'),
  path.join(process.cwd(), 'public'),
  path.join(__dirname, '../../public')
];

let publicPath = possiblePublicPaths.find(p => {
  try { return fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html')); }
  catch { return false; }
}) || path.join(__dirname, '../public');

console.log('[DeepHat] Serving static from:', publicPath);
app.use(express.static(publicPath));

// Fallback para index.html em rotas GET que não forem API
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexFile = path.join(publicPath, 'index.html');
  if (fs.existsSync(indexFile)) {
    return res.sendFile(indexFile);
  }
  res.status(404).send('index.html not found. publicPath=' + publicPath);
});

// Função para sanitizar o nome do arquivo
function sanitizeFilename(str) {
  if (!str) return 'unknown';
  return str
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .substring(0, 50);
}

// Função auxiliar para salvar logs
function saveLog(data, prefix = 'deephat') {
  const logDir = process.env.VERCEL ? path.join('/tmp', 'logs') : path.join(__dirname, '../logs');
  try {
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  } catch (e) {
    console.error('Não foi possível criar pasta de logs:', e.message);
  }

  const uaPart = sanitizeFilename(data.userAgent || data.parsedUserAgent?.browser || 'unknown');
  const filename = `${Date.now()}-${prefix}-${uaPart}.json`;
  const filepath = path.join(logDir, filename);

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

// --- ROTA 1: Coleta Principal ---
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

// --- ROTA 3: Health Check ---
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// --- INICIALIZAÇÃO ---
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('==================================================');
    console.log(' DeepHat Intelligence Collector Online');
    console.log(` Servidor rodando em http://localhost:${PORT}`);
    console.log('==================================================');
  });
}

module.exports = app;
