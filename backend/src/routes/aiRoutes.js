const express = require('express');
const router  = express.Router();
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { askAI, interpretForecast }       = require('../services/nvidiaService');
const { getForecast, getRestaurantForecast, isForecastServiceUp } = require('../services/forecastService');

// ── Middleware shortcuts ──────────────────────────────────────────────────────
const isAdmin = [authMiddleware, roleMiddleware(['admin'])];
const isAuth  = [authMiddleware];

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
// General chatbot — available to all users (auth optional)
router.post('/chat', async (req, res) => {
    try {
        const { message, history = [], context = null } = req.body;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message requis' });
        }
        if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY.startsWith('nvapi-your')) {
            return res.status(503).json({
                error: 'NVIDIA API key not configured',
                hint: 'Add NVIDIA_API_KEY to backend/.env',
            });
        }

        const response = await askAI(message.trim(), history, context);
        res.json({ response });
    } catch (err) {
        console.error('AI chat error:', err.message);
        res.status(500).json({ error: 'AI service error', details: err.message });
    }
});

// ── GET /api/ai/forecast ──────────────────────────────────────────────────────
// Forecast next N days — admin only
router.get('/forecast', isAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const forecast = await getForecast(days);
        res.json(forecast);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/ai/forecast/restaurant/:id ──────────────────────────────────────
router.get('/forecast/restaurant/:id', isAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const forecast = await getRestaurantForecast(req.params.id, days);
        res.json(forecast);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/ai/forecast/insights ────────────────────────────────────────────
// Forecast + Llama interpretation combined — the main "AI insights" endpoint
router.get('/forecast/insights', isAdmin, async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;

        // Check NVIDIA key
        if (!process.env.NVIDIA_API_KEY || process.env.NVIDIA_API_KEY.startsWith('nvapi-your')) {
            const forecast = await getForecast(days);
            return res.json({
                forecast,
                recommendations: '⚠️ NVIDIA API key not configured. Add it to backend/.env to get AI recommendations.',
                ai_available: false,
            });
        }

        // 1. Get forecast from Python service
        const forecast = await getForecast(days);

        // 2. Ask Llama to interpret it
        const recommendations = await interpretForecast(forecast);

        res.json({
            forecast,
            recommendations,
            ai_available: true,
            generated_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Insights error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// ── GET /api/ai/status ────────────────────────────────────────────────────────
// Health check for both AI services
router.get('/status', isAdmin, async (req, res) => {
    const forecastUp = await isForecastServiceUp();
    const nvidiaConfigured =
        !!process.env.NVIDIA_API_KEY &&
        !process.env.NVIDIA_API_KEY.startsWith('nvapi-your');

    res.json({
        nvidia_llama: nvidiaConfigured ? 'configured' : 'missing_key',
        forecast_service: forecastUp ? 'running' : 'offline',
        forecast_url: process.env.FORECAST_SERVICE_URL || 'http://localhost:8000',
    });
});

module.exports = router;
