// public/collector.js
// DeepHat Intelligence Collector - Versão Blindada

const behaviorData = {
    scrollDepth: 0,
    mouseMoves: 0,
    clicks: 0,
    timeOnPage: 0,
    scrollYMax: 0
};

function initBehaviorTracking() {
    try {
        window.addEventListener('scroll', () => {
            const totalHeight = document.documentElement.scrollHeight || 1;
            const scrollPosition = window.scrollY;
            behaviorData.scrollYMax = Math.max(behaviorData.scrollYMax, scrollPosition);
            behaviorData.scrollDepth = Math.round((scrollPosition / totalHeight) * 100);
        });
        document.addEventListener('mousemove', () => { behaviorData.mouseMoves++; });
        document.addEventListener('click', () => { behaviorData.clicks++; });
        setInterval(() => { behaviorData.timeOnPage++; }, 1000);
        console.log('[DeepHat] Rastreamento de comportamento iniciado.');
    } catch (e) {
        console.error('[DeepHat] Erro ao iniciar rastreamento:', e);
    }
}

function generateCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        ctx.textBaseline = 'top';
        ctx.font = '14px "Arial"';
        ctx.fillText('DeepHat-FP-2024', 2, 2);
        return canvas.toDataURL().length;
    } catch (e) {
        return 0;
    }
}

function collectAdvancedFingerprint() {
    console.log('[DeepHat] Coletando fingerprint avançado...');
    const advancedData = {
        webgl: null,
        fonts: [],
        plugins: [],
        touchPoints: navigator.maxTouchPoints || 0
    };

    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                advancedData.webgl = {
                    vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
                    renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
                };
            } else {
                advancedData.webgl = {
                    vendor: gl.getParameter(gl.VENDOR),
                    renderer: gl.getParameter(gl.RENDERER)
                };
            }
        }
    } catch (e) {
        advancedData.webgl = { error: e.message };
    }

    const testFonts = ['Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Times New Roman', 'Courier New', 'Georgia', 'Garamond', 'Palatino', 'Impact', 'Comic Sans MS', 'Trebuchet MS', 'Segoe UI', 'Calibri', 'Cambria'];
    const baseFont = 'monospace';
    const baseSize = '72px';
    const testText = 'mmmmmmmmmmlli';
    const testSpan = document.createElement('span');
    testSpan.style.font = `${baseSize} ${baseFont}`;
    testSpan.textContent = testText;
    document.body.appendChild(testSpan);
    const baselineWidth = testSpan.offsetWidth;

    testFonts.forEach(font => {
        testSpan.style.font = `${baseSize} "${font}", ${baseFont}`;
        if (testSpan.offsetWidth !== baselineWidth) {
            advancedData.fonts.push(font);
        }
    });
    document.body.removeChild(testSpan);

    if (navigator.plugins) {
        for (let i = 0; i < navigator.plugins.length; i++) {
            advancedData.plugins.push(navigator.plugins[i].name);
        }
    }
    return advancedData;
}

async function getPublicIP() {
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        return data.ip;
    } catch (e) {
        return 'unknown';
    }
}

async function getIPGeolocation(ip) {
    try {
        const res = await fetch(`https://ipapi.co/${ip}/json/`);
        return await res.json();
    } catch (e) {
        return {};
    }
}

function parseUserAgent() {
    try {
        if (typeof UAParser !== 'undefined') {
            const result = new UAParser().getResult();
            return {
                browser: result.browser.name || 'Unknown',
                browserVersion: result.browser.version || '',
                os: result.os.name || 'Unknown',
                osVersion: result.os.version || '',
                device: result.device.model || 'Desktop',
                deviceType: result.device.type || 'desktop'
            };
        }
    } catch (e) {
        console.warn('[DeepHat] UAParser falhou:', e);
    }
    // Fallback simples
    const ua = navigator.userAgent;
    return {
        browser: /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox' : /Safari/.test(ua) ? 'Safari' : 'Unknown',
        browserVersion: '',
        os: /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'Mac OS' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : 'Unknown',
        osVersion: '',
        device: 'Desktop',
        deviceType: /Mobile|Android|iPhone/.test(ua) ? 'mobile' : 'desktop'
    };
}

async function collectDeviceInfo() {
    const publicIP = await getPublicIP();
    const ipGeolocation = await getIPGeolocation(publicIP);
    const parsedUserAgent = parseUserAgent();

    const data = {
        timestamp: new Date().toISOString(),
        publicIP,
        ipGeolocation: {
            city: ipGeolocation.city,
            region: ipGeolocation.region,
            country: ipGeolocation.country_name,
            org: ipGeolocation.org
        },
        userAgent: navigator.userAgent,
        parsedUserAgent,
        screen: {
            width: screen.width,
            height: screen.height,
            colorDepth: screen.colorDepth
        },
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        canvasFingerprint: generateCanvasFingerprint(),
        behavior: { ...behaviorData }
    };

    console.log('[DeepHat] Dados coletados:', data);

    try {
        const res = await fetch('/api/collect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        console.log('[DeepHat] Coleta enviada:', result);
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = 'Diagnóstico concluído com sucesso!';
    } catch (e) {
        console.error('[DeepHat] Erro ao enviar coleta:', e);
        const statusEl = document.getElementById('status');
        if (statusEl) statusEl.textContent = 'Erro no diagnóstico. Tente novamente.';
    }
}

function setupConsent() {
    const acceptBtn = document.getElementById('accept-cookies');
    const rejectBtn = document.getElementById('reject-cookies');
    const banner = document.getElementById('cookie-banner');

    if (acceptBtn) {
        acceptBtn.addEventListener('click', async () => {
            if (banner) banner.style.display = 'none';
            const advanced = collectAdvancedFingerprint();
            const data = {
                timestamp: new Date().toISOString(),
                consent: true,
                advancedFingerprint: advanced,
                behavior: { ...behaviorData }
            };
            try {
                await fetch('/api/consent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                console.log('[DeepHat] Consentimento ACEITO enviado');
            } catch (e) {
                console.error(e);
            }
        });
    }

    if (rejectBtn) {
        rejectBtn.addEventListener('click', async () => {
            if (banner) banner.style.display = 'none';
            const data = {
                timestamp: new Date().toISOString(),
                consent: false,
                behavior: { ...behaviorData }
            };
            try {
                await fetch('/api/consent', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                console.log('[DeepHat] Consentimento RECUSADO enviado');
            } catch (e) {
                console.error(e);
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initBehaviorTracking();
    setupConsent();
    setTimeout(collectDeviceInfo, 800);
    setTimeout(() => {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.display = 'flex';
            console.log('[DeepHat] Banner de Cookies Exibido.');
        }
    }, 1500);
});
