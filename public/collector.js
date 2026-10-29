// public/collector.js
// DeepHat Intelligence Collector - Versão Blindada

// --- ESTADO GLOBAL DE COMPORTAMENTO ---
const behaviorData = {
    scrollDepth: 0,
    mouseMoves: 0,
    clicks: 0,
    timeOnPage: 0,
    scrollYMax: 0
};

// --- INICIALIZAÇÃO DE RASTREAMENTO ---
function initBehaviorTracking() {
    try {
        window.addEventListener('scroll', () => {
            const totalHeight = document.documentElement.scrollHeight;
            const scrollPosition = window.scrollY;
            behaviorData.scrollYMax = Math.max(behaviorData.scrollYMax, scrollPosition);
            behaviorData.scrollDepth = Math.round((scrollPosition / totalHeight) * 100);
        });

        document.addEventListener('mousemove', () => {
            behaviorData.mouseMoves++;
        });

        document.addEventListener('click', () => {
            behaviorData.clicks++;
        });

        setInterval(() => {
            behaviorData.timeOnPage++;
        }, 1000);
        console.log('[DeepHat] Rastreamento de comportamento iniciado.');
    } catch (e) {
        console.error('[DeepHat] Erro ao iniciar rastreamento:', e);
    }
}

// --- FINGERPRINTING BÁSICO ---
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
