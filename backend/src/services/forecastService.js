const axios = require('axios');

const FORECAST_URL = process.env.FORECAST_SERVICE_URL || 'http://localhost:8000';

/**
 * Get order forecast for the next N days.
 * @param {number} days
 * @returns {Object} forecast data
 */
async function getForecast(days = 7) {
    try {
        const { data } = await axios.get(`${FORECAST_URL}/forecast`, {
            params: { days },
            timeout: 10000,
        });
        return { success: true, ...data };
    } catch (err) {
        console.error('Forecast service error:', err.message);
        // Return mock data if Python service is down
        return {
            success: false,
            predicted_orders: 0,
            trend: 'unavailable',
            peak_day: null,
            weekly_forecast: [],
            source: 'unavailable',
            error: 'Forecast service unreachable',
        };
    }
}

/**
 * Get forecast for a specific restaurant.
 * @param {number} restaurantId
 * @param {number} days
 */
async function getRestaurantForecast(restaurantId, days = 7) {
    try {
        const { data } = await axios.get(
            `${FORECAST_URL}/forecast/restaurant/${restaurantId}`,
            { params: { days }, timeout: 10000 }
        );
        return { success: true, ...data };
    } catch (err) {
        console.error('Restaurant forecast error:', err.message);
        return {
            success: false,
            predicted_orders: 0,
            trend: 'unavailable',
            weekly_forecast: [],
            source: 'unavailable',
            error: 'Forecast service unreachable',
        };
    }
}

/**
 * Check if forecast service is healthy.
 */
async function isForecastServiceUp() {
    try {
        await axios.get(`${FORECAST_URL}/health`, { timeout: 3000 });
        return true;
    } catch {
        return false;
    }
}

module.exports = { getForecast, getRestaurantForecast, isForecastServiceUp };
