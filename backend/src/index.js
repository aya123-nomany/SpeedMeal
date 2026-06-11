const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

const ALLOWED_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
];

const io = new Server(server, {
    cors: {
        origin: ALLOWED_ORIGINS,
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

// Make io accessible in routes
app.set('io', io);

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(helmet());
app.use(morgan('dev'));

// ── Socket.io ───────────────────────────────────────────────────────────────
io.on('connection', (socket) => {
    console.log('🔌 Connected:', socket.id);

    // Client joins their order room for live updates
    socket.on('joinOrder', (orderId) => {
        socket.join(`order_${orderId}`);
        console.log(`Socket ${socket.id} joined order_${orderId}`);
    });

    // Restaurant joins their room for new order notifications
    socket.on('joinRestaurant', (restaurantId) => {
        socket.join(`restaurant_${restaurantId}`);
    });

    // Delivery driver broadcasts location
    socket.on('driverLocationUpdate', (data) => {
        // data: { orderId, latitude, longitude }
        io.to(`order_${data.orderId}`).emit('driverLocationUpdate', data);
    });

    // Client / restaurant join user-specific room for notifications
    socket.on('joinUser', (userId) => {
        socket.join(`user_${userId}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ Disconnected:', socket.id);
    });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',                require('./routes/authRoutes'));
app.use('/api/restaurants',         require('./routes/restaurantRoutes'));
app.use('/api/orders',              require('./routes/orderRoutes'));
app.use('/api/admin',               require('./routes/adminRoutes'));
app.use('/api/delivery',            require('./routes/deliveryRoutes'));
app.use('/api/reviews',             require('./routes/reviewRoutes'));
app.use('/api/group-orders',        require('./routes/groupOrderRoutes'));
app.use('/api/coupons',             require('./routes/couponRoutes'));
app.use('/api/favorites',           require('./routes/favoriteRoutes'));
app.use('/api/notifications',       require('./routes/notificationRoutes'));
app.use('/api/addresses',           require('./routes/addressRoutes'));
app.use('/api/restaurant-dashboard',require('./routes/restaurantDashboardRoutes'));
app.use('/api/openmenu',            require('./routes/openMenuProxy'));
app.use('/api/ai',                  require('./routes/aiRoutes'));
app.use('/api/financial',                require('./routes/financialRoutes'));
app.use('/api/staff',                   require('./routes/staffRoutes'));
app.use('/api/analytics',               require('./routes/analyticsRoutes'));
app.use('/api/promotions',              require('./routes/promotionsRoutes'));
app.use('/api/settings',                require('./routes/settingsRoutes'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 SpeedMeal API running on port ${PORT}`));
