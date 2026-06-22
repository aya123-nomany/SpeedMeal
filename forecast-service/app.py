"""
SpeedMeal Forecast Service
Uses Prophet for time-series forecasting on order data.
Runs on port 8000 (separate from Node.js on 5000).
"""

import os
import json
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── Try importing Prophet (graceful fallback if not installed) ──────────────
try:
    import pandas as pd
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False
    print("⚠️  Prophet/pandas not installed. Using mock forecasting.")

# ── Try importing mysql connector ───────────────────────────────────────────
try:
    import mysql.connector
    DB_CONFIG = {
        "host":     os.getenv("DB_HOST", "localhost"),
        "user":     os.getenv("DB_USER", "root"),
        "password": os.getenv("DB_PASSWORD", ""),
        "database": os.getenv("DB_NAME", "speedmeal"),
    }
    DB_AVAILABLE = True
except ImportError:
    DB_AVAILABLE = False
    print("⚠️  mysql-connector-python not installed. Using mock data.")


# ── Helper: fetch orders from MySQL ─────────────────────────────────────────
def fetch_orders_from_db():
    """Returns list of (date_str, count) tuples grouped by date."""
    if not DB_AVAILABLE:
        return None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT DATE(created_at) AS order_date, COUNT(*) AS cnt
            FROM orders
            GROUP BY order_date
            ORDER BY order_date ASC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        return [(str(r[0]), int(r[1])) for r in rows if r[0] is not None]
    except Exception as e:
        print(f"DB error: {e}")
        return None


# ── Helper: generate mock data when DB/Prophet unavailable ──────────────────
def mock_forecast(days=7):
    import random
    from datetime import timedelta
    today = datetime.today()
    weekly = []
    total = 0
    for i in range(1, days + 1):
        d = today + timedelta(days=i)
        cnt = random.randint(40, 120)
        weekly.append({"ds": d.strftime("%Y-%m-%d"), "yhat": cnt})
        total += cnt
    peak = max(weekly, key=lambda x: x["yhat"])
    return {
        "predicted_orders": total,
        "trend": "stable",
        "peak_day": peak["ds"],
        "weekly_forecast": weekly,
        "source": "mock",
    }


# ── Helper: run Prophet forecast ────────────────────────────────────────────
def run_prophet_forecast(rows, periods=7):
    """
    rows: list of (date_str, count)
    Returns forecast dict.
    """
    df = pd.DataFrame(rows, columns=["ds", "y"])
    df["ds"] = pd.to_datetime(df["ds"])
    df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)

    if len(df) < 2:
        return None  # not enough data

    model = Prophet(
        daily_seasonality=False,
        weekly_seasonality=True,
        yearly_seasonality=len(df) > 60,
        changepoint_prior_scale=0.05,
    )
    model.fit(df)

    future = model.make_future_dataframe(periods=periods)
    forecast = model.predict(future)

    # Take only future predictions
    future_only = forecast[forecast["ds"] > df["ds"].max()][["ds", "yhat"]].tail(periods)
    weekly = [
        {"ds": row["ds"].strftime("%Y-%m-%d"), "yhat": max(0, round(row["yhat"]))}
        for _, row in future_only.iterrows()
    ]

    total = sum(w["yhat"] for w in weekly)
    peak = max(weekly, key=lambda x: x["yhat"]) if weekly else {}

    # Trend: compare last 7 days avg vs previous 7 days avg
    trend = "stable"
    if len(df) >= 14:
        recent_avg = df["y"].tail(7).mean()
        prev_avg   = df["y"].iloc[-14:-7].mean()
        if recent_avg > prev_avg * 1.1:
            trend = "increasing ↑"
        elif recent_avg < prev_avg * 0.9:
            trend = "decreasing ↓"

    return {
        "predicted_orders": total,
        "trend": trend,
        "peak_day": peak.get("ds"),
        "weekly_forecast": weekly,
        "source": "prophet",
        "data_points": len(df),
    }


# ── ROUTES ───────────────────────────────────────────────────────────────────

@app.route("/health")
def health():
    return jsonify({
        "status": "ok",
        "prophet": PROPHET_AVAILABLE,
        "db": DB_AVAILABLE,
        "time": datetime.utcnow().isoformat(),
    })


@app.route("/forecast")
def forecast():
    """
    GET /forecast?days=7
    Returns order forecast for next N days.
    """
    days = int(request.args.get("days", 7))

    # 1. Try real DB + Prophet
    if PROPHET_AVAILABLE and DB_AVAILABLE:
        rows = fetch_orders_from_db()
        if rows and len(rows) >= 2:
            result = run_prophet_forecast(rows, periods=days)
            if result:
                return jsonify(result)

    # 2. If Prophet installed but no DB, use CSV if exists
    if PROPHET_AVAILABLE and os.path.exists("orders.csv"):
        try:
            import pandas as pd
            df = pd.read_csv("orders.csv")
            rows = list(zip(df.iloc[:, 0].astype(str), df.iloc[:, 1].astype(int)))
            result = run_prophet_forecast(rows, periods=days)
            if result:
                result["source"] = "prophet_csv"
                return jsonify(result)
        except Exception as e:
            print(f"CSV error: {e}")

    # 3. Fallback: mock data
    return jsonify(mock_forecast(days))


@app.route("/forecast/restaurant/<int:restaurant_id>")
def forecast_restaurant(restaurant_id):
    """Forecast for a specific restaurant."""
    days = int(request.args.get("days", 7))

    if PROPHET_AVAILABLE and DB_AVAILABLE:
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor()
            cursor.execute("""
                SELECT DATE(created_at) AS order_date, COUNT(*) AS cnt
                FROM orders
                WHERE restaurant_id = %s
                GROUP BY order_date
                ORDER BY order_date ASC
            """, (restaurant_id,))
            rows = [(str(r[0]), int(r[1])) for r in cursor.fetchall() if r[0]]
            cursor.close()
            conn.close()

            if rows and len(rows) >= 2:
                result = run_prophet_forecast(rows, periods=days)
                if result:
                    result["restaurant_id"] = restaurant_id
                    return jsonify(result)
        except Exception as e:
            print(f"Restaurant forecast error: {e}")

    result = mock_forecast(days)
    result["restaurant_id"] = restaurant_id
    return jsonify(result)


if __name__ == "__main__":
    port = int(os.getenv("FORECAST_PORT", 8000))
    print(f"🔮 SpeedMeal Forecast Service running on port {port}")
    print(f"   Prophet: {'✅' if PROPHET_AVAILABLE else '❌ (mock mode)'}")
    print(f"   Database: {'✅' if DB_AVAILABLE else '❌ (mock mode)'}")
    app.run(host="0.0.0.0", port=port, debug=False)
