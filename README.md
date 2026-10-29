# Link Intelligence / DeepHat Collector

Coletor de inteligência de dispositivos (fingerprint, geolocalização, comportamento).

## Rotas

- `GET /` → página de coleta (`public/index.html`)
- `POST /api/collect` → dados iniciais do dispositivo
- `POST /api/consent` → consentimento + fingerprint avançado
- `GET /api/health` → health check

## Deploy

Configurado para Vercel (serverless). Os logs são gravados em `/tmp` (efêmero) e também enviados para o console da Function (visível em Vercel → Logs).

## Local

```bash
cd server   # ou raiz
npm install
npm start
```
