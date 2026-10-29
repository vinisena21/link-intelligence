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

// Placeholder - full collector will be loaded from original; this is a minimal stub if needed.
// The full original collector.js is longer and includes IP fetch, geolocation, canvas, webgl, fonts, etc.
console.log('[DeepHat] Collector loaded (stub for deploy - full version in original zip)');
