const OpenAI = require('openai');

const client = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: process.env.NVIDIA_API_KEY,
    timeout: 60000, // 60s timeout — Llama 49B can be slow
});

/**
 * Send a message to NVIDIA Llama and get a response.
 * @param {string} message  - User or system prompt
 * @param {Array}  history  - Optional prior messages [{role, content}]
 * @returns {string} AI response text
 */
async function askAI(message, history = [], siteContext = null) {
    // Build a rich system prompt that includes real site data when available
    let systemContent =
        'You are SpeedMeal AI Assistant — an intelligent assistant embedded in the SpeedMeal ' +
        'food delivery admin dashboard. You have full access to the platform\'s live data. ' +
        'Always respond concisely and in the SAME LANGUAGE the user writes in (Darija/Arabic/French/English). ' +
        'Use the site data provided to give accurate, data-driven answers. ' +
        'When asked about restaurants, orders, revenue, or trends — use the exact numbers from the context below.';

    if (siteContext) {
        const stats = siteContext.stats || {};
        // Limit data to avoid massive system prompts that slow the model
        const restaurants = (Array.isArray(siteContext.restaurants) ? siteContext.restaurants : []).slice(0, 15);
        const orders = (Array.isArray(siteContext.orders) ? siteContext.orders : []).slice(0, 50);
        const topRestaurants = Array.isArray(siteContext.topRestaurants) ? siteContext.topRestaurants : [];
        const recentOrders = (Array.isArray(siteContext.recentOrders) ? siteContext.recentOrders : []).slice(0, 5);

        // Compute derived metrics
        const deliveredOrders  = orders.filter(o => o && o.status === 'delivered').length;
        const cancelledOrders  = orders.filter(o => o && o.status === 'cancelled').length;
        const pendingOrders    = orders.filter(o => o && o.status === 'pending').length;
        const avgOrderValue    = orders.length
            ? (orders.reduce((s, o) => s + Number(o && o.total_price || 0), 0) / orders.length).toFixed(2)
            : 0;

        // Compute peak hour and peak day
        const ordersByHour = new Array(24).fill(0);
        const ordersByDay = new Array(7).fill(0);
        const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        orders.forEach(o => {
            if (o && o.created_at) {
                const d = new Date(o.created_at);
                if (!isNaN(d.getTime())) {
                    ordersByHour[d.getHours()]++;
                    ordersByDay[d.getDay()]++;
                }
            }
        });
        const peakHour = ordersByHour.indexOf(Math.max(...ordersByHour));
        const peakDay = ordersByDay.indexOf(Math.max(...ordersByDay));
        const peakHourText = ordersByHour[peakHour] > 0 ? `${peakHour}h00` : 'N/A';
        const peakDayText = ordersByDay[peakDay] > 0 ? dayNames[peakDay] : 'N/A';

        const topRest = restaurants
            .filter(r => r && typeof r === 'object')
            .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
            .slice(0, 5)
            .map((r, i) => `  ${i + 1}. ${r.name || 'Restaurant'} (${r.city || 'N/A'}, ${r.cuisine || 'Various'}) — Note: ${Number(r.rating || 0).toFixed(1)}/5`);

        const topByOrders = restaurants
            .filter(r => r && typeof r === 'object')
            .sort((a, b) => (b._orderCount || 0) - (a._orderCount || 0))
            .slice(0, 3)
            .map(r => `  - ${r.name || 'Restaurant'}: ${r._orderCount || 0} commandes`);

        systemContent +=
            '\n\n━━━━━━━━━━ DONNÉES RÉELLES SPEEDMEAL ━━━━━━━━━━\n' +
            `📊 VUE D'ENSEMBLE:\n` +
            `  • Total utilisateurs: ${stats.totalUsers || 0}\n` +
            `  • Total commandes: ${stats.totalOrders || 0}\n` +
            `  • Commandes aujourd'hui: ${stats.todayOrders || 0}\n` +
            `  • Restaurants actifs: ${stats.totalRestaurants || 0}\n` +
            `  • Livreurs: ${stats.totalDeliveries || 0}\n` +
            `  • Revenus totaux: ${Number(stats.revenue || 0).toFixed(2)} MAD\n` +
            `  • Revenus aujourd'hui: ${Number(stats.todayRevenue || 0).toFixed(2)} MAD\n` +
            `  • Commandes en attente: ${stats.pendingOrders || pendingOrders}\n` +
            `  • Commandes livrées: ${deliveredOrders}\n` +
            `  • Commandes annulées: ${cancelledOrders}\n` +
            `  • Valeur moyenne par commande: ${avgOrderValue} MAD\n\n` +
            (orders.length
                ? `📈 TENDANCES HISTORIQUES:\n` +
                  `  - Heure de pointe (plus de commandes): ${peakHourText} (${ordersByHour[peakHour]} commandes au total)\n` +
                  `  - Jour de pointe: ${peakDayText} (${ordersByDay[peakDay]} commandes au total)\n\n`
                : '') +
            (topRest.length
                ? `⭐ TOP RESTAURANTS PAR NOTE:\n${topRest.join('\n')}\n\n`
                : '') +
            (restaurants.length
                ? `🏪 TOUS LES RESTAURANTS (${restaurants.length} total):\n` +
                  restaurants.filter(r => r && typeof r === 'object').map(r => `  - ${r.name || 'Restaurant'} | ${r.city || 'N/A'} | ${r.cuisine || 'N/A'} | ★${Number(r.rating||0).toFixed(1)} | ${r.isOpen ? 'Ouvert' : 'Fermé'}`).join('\n') + '\n\n'
                : '') +
            (recentOrders.length
                ? `📦 COMMANDES RÉCENTES (${recentOrders.length}):\n` +
                  recentOrders.slice(0, 5).filter(o => o && typeof o === 'object').map(o =>
                      `  - #${o.id || 'N/A'} | ${o.user_name || 'Client'} → ${o.restaurant_name || 'Restaurant'} | ${Number(o.total_price||0).toFixed(2)} MAD | ${o.status || 'N/A'}`
                  ).join('\n') + '\n\n'
                : '') +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    }

    const messages = [
        { role: 'system', content: systemContent },
        ...history,
        { role: 'user', content: message },
    ];

    const response = await client.chat.completions.create({
        model: 'nvidia/llama-3.3-nemotron-super-49b-v1.5',
        messages,
        temperature: 0.6,
        max_tokens: 1024,
    });

    return response.choices[0].message.content;
}

/**
 * Ask Llama to interpret forecast data and return business recommendations.
 * @param {Object} forecastData - { predicted_orders, trend, peak_day, weekly_forecast }
 * @returns {string} Recommendations text
 */
async function interpretForecast(forecastData) {
    const prompt =
        `Analyse les données de prévision SpeedMeal suivantes et donne des recommandations business:\n\n` +
        `📊 Données:\n` +
        `- Commandes prévues (prochains 7 jours): ${forecastData.predicted_orders}\n` +
        `- Tendance: ${forecastData.trend}\n` +
        `- Jour de pointe prévu: ${forecastData.peak_day || 'N/A'}\n` +
        `- Prévision journalière: ${JSON.stringify(forecastData.weekly_forecast || [])}\n\n` +
        `Recommande:\n` +
        `1. Gestion des stocks (quoi commander, combien)\n` +
        `2. Staffing (livreurs, cuisine)\n` +
        `3. Promotions suggérées pour les jours creux\n` +
        `4. Alertes gaspillage alimentaire\n` +
        `Sois concis et pratique.`;

    return await askAI(prompt);
}

module.exports = { askAI, interpretForecast };
