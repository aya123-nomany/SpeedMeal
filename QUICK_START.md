# SpeedMeal - Quick Start Guide for New Features

## 🚀 5-Minute Setup

### Step 1: Run Database Migrations (2 minutes)
```bash
cd backend
node src/migrate_financial.js
node src/migrate_staff_settings.js
node src/migrate_promotions.js
node src/migrate_business_hours.js
```

### Step 2: Restart Backend (30 seconds)
```bash
# If running, stop with Ctrl+C then:
npm start
```

### Step 3: Test the APIs (1 minute)
Open a new terminal:
```bash
# Test Financial API
curl http://localhost:5000/api/financial/1/summary

# Test Analytics API
curl http://localhost:5000/api/analytics/1/best-sellers

# Test Staff API
curl http://localhost:5000/api/staff/1/staff
```

---

## 📊 Features at a Glance

### Financial Management ✅ READY
- Track daily, weekly, monthly earnings
- View commission breakdowns
- Request payouts
- View transaction history

**Quick Test:**
```bash
curl http://localhost:5000/api/financial/1/summary
```

### Staff Management ✅ READY
- Add staff members by email
- Assign roles (Manager, Cashier, Kitchen, Delivery Coordinator)
- Track activity logs
- Manage permissions

**Quick Test:**
```bash
curl http://localhost:5000/api/staff/1/staff
```

### Advanced Analytics ✅ READY
- Best-selling items
- Revenue by category
- Peak hours analysis
- Customer trends
- Performance metrics

**Quick Test:**
```bash
curl http://localhost:5000/api/analytics/1/best-sellers
```

### Restaurant Settings ✅ READY
- Delivery radius
- Minimum order amount
- Delivery fees (fixed or percentage)
- Estimated delivery time
- Business hours per day

**Quick Test:**
```bash
curl http://localhost:5000/api/settings/1/settings
```

### Enhanced Promotions ✅ READY
- Create promotional campaigns
- Bundle deals
- Loyalty programs
- Customer points tracking

**Quick Test:**
```bash
curl http://localhost:5000/api/promotions/1/campaigns
```

---

## 🔗 All New API Endpoints

### Financial Management (6 endpoints)
```
GET  /api/financial/:restaurantId/earnings
GET  /api/financial/:restaurantId/summary
GET  /api/financial/:restaurantId/transactions
POST /api/financial/:restaurantId/payouts
GET  /api/financial/:restaurantId/payouts
POST /api/financial/:restaurantId/record-earnings
```

### Staff Management (6 endpoints)
```
GET    /api/staff/:restaurantId/staff
POST   /api/staff/:restaurantId/staff
PUT    /api/staff/:restaurantId/staff/:staffId
DELETE /api/staff/:restaurantId/staff/:staffId
GET    /api/staff/:restaurantId/staff/:staffId/logs
POST   /api/staff/:restaurantId/staff/:staffId/logs
```

### Analytics (5 endpoints)
```
GET /api/analytics/:restaurantId/best-sellers
GET /api/analytics/:restaurantId/revenue-by-category
GET /api/analytics/:restaurantId/peak-hours
GET /api/analytics/:restaurantId/customer-trends
GET /api/analytics/:restaurantId/performance
```

### Promotions (8 endpoints)
```
POST /api/promotions/:restaurantId/campaigns
GET  /api/promotions/:restaurantId/campaigns
POST /api/promotions/:restaurantId/bundles
GET  /api/promotions/:restaurantId/bundles
POST /api/promotions/:restaurantId/loyalty
GET  /api/promotions/:restaurantId/loyalty
GET  /api/promotions/:restaurantId/loyalty/:userId/points
POST /api/promotions/:restaurantId/loyalty/:userId/points
```

### Settings (4 endpoints)
```
GET /api/settings/:restaurantId/settings
PUT /api/settings/:restaurantId/settings
GET /api/settings/:restaurantId/business-hours
PUT /api/settings/:restaurantId/business-hours
```

---

## 💾 Database Tables Created

1. ✅ restaurant_earnings
2. ✅ restaurant_transactions
3. ✅ restaurant_payouts
4. ✅ restaurant_staff
5. ✅ staff_activity_logs
6. ✅ promotion_campaigns
7. ✅ bundle_deals
8. ✅ bundle_items
9. ✅ loyalty_programs
10. ✅ customer_loyalty_points
11. ✅ business_hours

---

## 📝 Files Created

### Backend Controllers (4 files)
- `backend/src/controllers/financialController.js`
- `backend/src/controllers/staffController.js`
- `backend/src/controllers/analyticsController.js`
- `backend/src/controllers/promotionsController.js`
- `backend/src/controllers/settingsController.js`

### Backend Routes (5 files)
- `backend/src/routes/financialRoutes.js`
- `backend/src/routes/staffRoutes.js`
- `backend/src/routes/analyticsRoutes.js`
- `backend/src/routes/promotionsRoutes.js`
- `backend/src/routes/settingsRoutes.js`

### Database Migrations (4 files)
- `backend/src/migrate_financial.js`
- `backend/src/migrate_staff_settings.js`
- `backend/src/migrate_promotions.js`
- `backend/src/migrate_business_hours.js`

### Modified Files (1 file)
- `backend/src/index.js` - Added new route registrations

---

## ⚠️ Important Notes

1. **Migrations**: Run all 4 migration files to create tables
2. **Restart Backend**: Required after migrations and index.js changes
3. **Frontend Components**: Still need to be created for UI integration
4. **Authentication**: All endpoints use authMiddleware - include valid JWT token
5. **Restaurant ID**: Replace `:restaurantId` with actual restaurant ID (e.g., 1)

---

## 🎓 Example Usage

### Create a Financial Record
```bash
curl -X POST http://localhost:5000/api/financial/1/record-earnings \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-06-11"}'
```

### Add Staff Member
```bash
curl -X POST http://localhost:5000/api/staff/1/staff \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "chef@restaurant.com",
    "role": "kitchen",
    "salary": 2000,
    "hiredDate": "2026-06-01"
  }'
```

### Create Promotion
```bash
curl -X POST http://localhost:5000/api/promotions/1/campaigns \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Summer Sale",
    "type": "discount",
    "discountType": "percentage",
    "discountValue": 20,
    "minOrderAmount": 50,
    "maxUses": 100,
    "startDate": "2026-06-11T00:00:00Z",
    "endDate": "2026-06-30T23:59:59Z"
  }'
```

---

## 🔍 Troubleshooting

### Issue: Tables not found error
**Solution**: Make sure all 4 migration files were run
```bash
node src/migrate_financial.js
node src/migrate_staff_settings.js
node src/migrate_promotions.js
node src/migrate_business_hours.js
```

### Issue: Route not found (404)
**Solution**: Backend server needs restart after changes
```bash
npm start
```

### Issue: Authentication error
**Solution**: Include valid JWT token in headers:
```bash
-H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✨ Summary

| Component | Status | Files |
|-----------|--------|-------|
| Database | ✅ Ready | 4 migrations |
| Backend APIs | ✅ Ready | 9 files (5 controllers + 4 routes) |
| Frontend UI | ⏳ Needed | To be created |

**Total New Endpoints**: 29
**Database Relationships**: All with CASCADE DELETE
**Authentication**: All endpoints secured

---

**Your SpeedMeal platform now has enterprise-grade features!**
