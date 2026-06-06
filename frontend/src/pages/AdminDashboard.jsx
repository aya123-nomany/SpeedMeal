import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import {
  Users, ShoppingBag, Store, DollarSign,
  LogOut, BarChart2, Shield, Download, FileText
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoUrl from '../assets/logo.png';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const ROLES = ['client', 'restaurant', 'delivery', 'admin'];

const statusColors = {
  pending:    '#f97316',
  preparing:  '#eab308',
  on_the_way: '#3b82f6',
  delivered:  '#22c55e',
  cancelled:  '#ef4444',
};

const StatCard = ({ icon, label, value, color, sub }) => (
  <motion.div whileHover={{ y: -3 }} style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {React.cloneElement(icon, { color, size: 26 })}
    </div>
    <div>
      <p style={{ margin: 0, color: '#888', fontSize: '13px', fontWeight: '600' }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: '26px', fontWeight: '900', color: '#111' }}>{value}</p>
      {sub && <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#aaa' }}>{sub}</p>}
    </div>
  </motion.div>
);

const chartOpts = (title) => ({
  responsive: true,
  plugins: { legend: { display: false }, title: { display: !!title, text: title, font: { size: 14, weight: '700' }, color: '#111', padding: { bottom: 12 } } },
  scales: { x: { grid: { display: false } }, y: { grid: { color: '#f0f0f0' }, ticks: { font: { size: 12 } } } },
});

const AdminDashboard = () => {
  const [tab, setTab]               = useState('stats');
  const [stats, setStats]           = useState(null);
  const [users, setUsers]           = useState([]);
  const [orders, setOrders]         = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [coupons, setCoupons]       = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading]       = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '' });
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const user  = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!token || user.role !== 'admin') { navigate('/'); return; }
    fetchStats(); fetchUsers(); fetchOrders(); fetchRestaurants();
  }, []);

  useEffect(() => {
    if (tab === 'users'       && users.length === 0)       fetchUsers();
    if (tab === 'orders'      && orders.length === 0)      fetchOrders();
    if (tab === 'restaurants' && restaurants.length === 0) fetchRestaurants();
    if (tab === 'coupons'     && coupons.length === 0)     fetchCoupons();
    if (tab === 'commissions' && commissions.length === 0) fetchCommissions();
  }, [tab]);

  const api = (path) => axios.get(`http://localhost:5000/api/admin/${path}`, { headers: { Authorization: `Bearer ${token}` } });

  const fetchStats       = async () => { try { const { data } = await api('stats');       setStats(data);       } catch {} };
  const fetchUsers       = async () => { setLoading(true); try { const { data } = await api('users');       setUsers(data);       } catch {} setLoading(false); };
  const fetchOrders      = async () => { setLoading(true); try { const { data } = await api('orders');      setOrders(data);      } catch {} setLoading(false); };
  const fetchRestaurants = async () => { setLoading(true); try { const { data } = await api('restaurants'); setRestaurants(data); } catch {} setLoading(false); };
  const fetchCoupons     = async () => { setLoading(true); try { const { data } = await api('coupons');     setCoupons(data);     } catch {} setLoading(false); };
  const fetchCommissions = async () => { setLoading(true); try { const { data } = await api('commissions'); setCommissions(data); } catch {} setLoading(false); };

  const toggleUser = async (id) => {
    await axios.put(`http://localhost:5000/api/admin/users/${id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };
  const changeRole = async (id, role) => {
    await axios.put(`http://localhost:5000/api/admin/users/${id}/role`, { role }, { headers: { Authorization: `Bearer ${token}` } });
    fetchUsers();
  };
  const handleLogout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };

  /* ── CHART DATA ── */
  const ordersByStatus = {
    labels: Object.keys(statusColors),
    datasets: [{ data: Object.keys(statusColors).map(s => orders.filter(o => o.status === s).length), backgroundColor: Object.values(statusColors), borderWidth: 0, hoverOffset: 6 }],
  };

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const ordersByMonth = {
    labels: months,
    datasets: [{
      label: 'Orders',
      data: months.map((_, i) => orders.filter(o => new Date(o.created_at).getMonth() === i).length),
      backgroundColor: 'rgba(165,28,28,0.12)',
      borderColor: '#A51C1C',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#A51C1C',
      pointRadius: 4,
    }],
  };

  const revenueByMonth = {
    labels: months,
    datasets: [{
      label: 'Revenue (MAD)',
      data: months.map((_, i) => orders.filter(o => new Date(o.created_at).getMonth() === i).reduce((s, o) => s + Number(o.total_price || 0), 0)),
      backgroundColor: months.map((_, i) => i % 2 === 0 ? '#A51C1C' : '#c0392b'),
      borderRadius: 8,
      borderSkipped: false,
    }],
  };

  const roleDistribution = {
    labels: ROLES,
    datasets: [{ data: ROLES.map(r => users.filter(u => u.role === r).length), backgroundColor: ['#6366f1','#22c55e','#3b82f6','#A51C1C'], borderWidth: 0, hoverOffset: 6 }],
  };

  /* ── EXPORT PDF ── */
  const exportPDF = () => {
    const doc = new jsPDF();
    // Logo
    const img = new Image(); img.src = logoUrl;
    doc.addImage(img, 'PNG', 14, 10, 30, 20);
    doc.setFontSize(18); doc.setTextColor(165, 28, 28);
    doc.setFont(undefined, 'bold');
    doc.text('SpeedMeal — Admin Report', 50, 22);
    doc.setFontSize(10); doc.setTextColor(150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 50, 30);

    let y = 45;

    if (stats) {
      doc.setFontSize(13); doc.setTextColor(17); doc.setFont(undefined, 'bold');
      doc.text('Overview', 14, y); y += 8;
      autoTable(doc, {
        startY: y,
        head: [['Metric', 'Value']],
        body: [
          ['Total Users',    stats.totalUsers],
          ['Total Orders',   stats.totalOrders],
          ['Restaurants',    stats.totalRestaurants],
          ['Revenue (MAD)',  Number(stats.revenue || 0).toFixed(2)],
        ],
        headStyles: { fillColor: [165, 28, 28], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        styles: { fontSize: 11 },
      });
      y = doc.lastAutoTable.finalY + 14;
    }

    if (orders.length) {
      doc.setFontSize(13); doc.setTextColor(17); doc.setFont(undefined, 'bold');
      doc.text('Orders', 14, y); y += 8;
      autoTable(doc, {
        startY: y,
        head: [['#', 'Customer', 'Restaurant', 'Total (MAD)', 'Status', 'Date']],
        body: orders.slice(0, 50).map(o => [
          `#${o.id}`, o.user_name, o.restaurant_name,
          Number(o.total_price).toFixed(2), o.status,
          new Date(o.created_at).toLocaleDateString(),
        ]),
        headStyles: { fillColor: [165, 28, 28], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 250, 250] },
        styles: { fontSize: 10 },
      });
      y = doc.lastAutoTable.finalY + 14;
    }

    if (users.length) {
      if (y > 220) { doc.addPage(); y = 20; }
      doc.setFontSize(13); doc.setTextColor(17); doc.setFont(undefined, 'bold');
      doc.text('Users', 14, y); y += 8;
      autoTable(doc, {
        startY: y,
        head: [['Name', 'Email', 'Role', 'Status', 'Joined']],
        body: users.slice(0, 50).map(u => [
          u.name, u.email, u.role,
          u.isActive ? 'Active' : 'Disabled',
          new Date(u.created_at).toLocaleDateString(),
        ]),
        headStyles: { fillColor: [165, 28, 28], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [255, 250, 250] },
        styles: { fontSize: 10 },
      });
    }

    doc.save(`SpeedMeal_Report_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  /* ── EXPORT EXCEL ── */
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (stats) {
      const ws = XLSX.utils.aoa_to_sheet([
        ['SpeedMeal Admin Report'],
        [`Generated: ${new Date().toLocaleString()}`],
        [],
        ['Metric', 'Value'],
        ['Total Users',   stats.totalUsers],
        ['Total Orders',  stats.totalOrders],
        ['Restaurants',   stats.totalRestaurants],
        ['Revenue (MAD)', Number(stats.revenue || 0).toFixed(2)],
      ]);
      XLSX.utils.book_append_sheet(wb, ws, 'Overview');
    }

    if (orders.length) {
      const ws = XLSX.utils.json_to_sheet(orders.map(o => ({
        ID: `#${o.id}`, Customer: o.user_name, Restaurant: o.restaurant_name,
        'Total (MAD)': Number(o.total_price).toFixed(2), Status: o.status,
        Date: new Date(o.created_at).toLocaleDateString(),
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'Orders');
    }

    if (users.length) {
      const ws = XLSX.utils.json_to_sheet(users.map(u => ({
        Name: u.name, Email: u.email, Role: u.role,
        Status: u.isActive ? 'Active' : 'Disabled',
        Joined: new Date(u.created_at).toLocaleDateString(),
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'Users');
    }

    if (restaurants.length) {
      const ws = XLSX.utils.json_to_sheet(restaurants.map(r => ({
        Name: r.name, City: r.city, Cuisine: r.cuisine,
        Rating: r.rating, Status: r.isOpen ? 'Open' : 'Closed',
      })));
      XLSX.utils.book_append_sheet(wb, ws, 'Restaurants');
    }

    XLSX.writeFile(wb, `SpeedMeal_Report_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const tabs = [
    { id: 'stats',       label: 'Overview',       icon: <BarChart2 size={16} /> },
    { id: 'users',       label: 'Users',          icon: <Users size={16} /> },
    { id: 'orders',      label: 'Orders',         icon: <ShoppingBag size={16} /> },
    { id: 'restaurants', label: 'Restaurants',    icon: <Store size={16} /> },
    { id: 'coupons',     label: 'Coupons',        icon: <Shield size={16} /> },
    { id: 'commissions', label: 'Commissions',    icon: <DollarSign size={16} /> },
  ];

  const thStyle = { padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f0f0f0' };
  const tdStyle = { padding: '14px 16px', fontSize: '14px', color: '#333', borderBottom: '1px solid #f9f9f9' };

  return (
    <div style={{ minHeight: '100vh', background: '#f4f5f7', display: 'flex' }}>

      {/* ── SIDEBAR ── */}
      <div style={{ width: '260px', background: '#111', minHeight: '100vh', padding: '30px 20px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <img src={logoUrl} alt="SpeedMeal" style={{ height: '70px', objectFit: 'contain' }} />
          <p style={{ margin: '8px 0 0', color: '#666', fontSize: '11px', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase' }}>Admin Panel</p>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '13px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '14px', textAlign: 'left', transition: 'all 0.2s',
              background: tab === t.id ? '#A51C1C' : 'transparent',
              color: tab === t.id ? '#fff' : '#888',
            }}>
              {t.icon}{t.label}
            </button>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid #222', paddingTop: '20px' }}>
          <div style={{ padding: '0 8px', marginBottom: '16px' }}>
            <p style={{ margin: 0, color: '#fff', fontWeight: '700', fontSize: '14px' }}>{user.name}</p>
            <p style={{ margin: 0, color: '#A51C1C', fontSize: '12px', fontWeight: '600' }}>Administrator</p>
          </div>
          <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'transparent', border: '1px solid #333', color: '#888', padding: '12px 16px', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '14px', width: '100%' }}>
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* ── MAIN ── */}
      <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '14px' }}>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: '#111' }}>
            {tabs.find(t => t.id === tab)?.label}
          </h2>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={exportPDF} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#A51C1C', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(165,28,28,0.3)' }}>
              <FileText size={15} /> Export PDF
            </button>
            <button onClick={exportExcel} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#15803d', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: '12px', fontWeight: '700', fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(21,128,61,0.3)' }}>
              <Download size={15} /> Export Excel
            </button>
          </div>
        </div>

        {/* ── OVERVIEW TAB ── */}
        {tab === 'stats' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Stat cards */}
            {stats ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '32px' }}>
                <StatCard icon={<Users />} label="Total Users"       value={stats.totalUsers}                         color="#6366f1" />
                <StatCard icon={<ShoppingBag />} label="Total Orders" value={stats.totalOrders}                       color="#f97316" sub={`${stats.todayOrders} aujourd'hui`} />
                <StatCard icon={<Store />} label="Restaurants"       value={stats.totalRestaurants}                   color="#22c55e" />
                <StatCard icon={<DollarSign />} label="Revenue (MAD)" value={Number(stats.revenue||0).toFixed(2)}    color="#A51C1C" sub={`${Number(stats.todayRevenue||0).toFixed(2)} MAD aujourd'hui`} />
              </div>
            ) : <p style={{ color: '#aaa', marginBottom: '32px' }}>Loading stats...</p>}

            {/* Charts grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
              {/* Orders over months */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 20px', fontWeight: '800', fontSize: '15px', color: '#111' }}>Commandes par mois</p>
                <Line data={ordersByMonth} options={{ ...chartOpts(), plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f5f5f5' }, beginAtZero: true } } }} />
              </div>

              {/* Revenue per month */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <p style={{ margin: '0 0 20px', fontWeight: '800', fontSize: '15px', color: '#111' }}>Revenus par mois (MAD)</p>
                <Bar data={revenueByMonth} options={{ ...chartOpts(), plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { grid: { color: '#f5f5f5' }, beginAtZero: true } } }} />
              </div>

              {/* Orders by status */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ margin: '0 0 20px', fontWeight: '800', fontSize: '15px', color: '#111', alignSelf: 'flex-start' }}>Statut des commandes</p>
                <div style={{ width: '220px' }}>
                  <Doughnut data={ordersByStatus} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 14 } } }, cutout: '68%' }} />
                </div>
              </div>

              {/* Users by role */}
              <div style={{ background: '#fff', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <p style={{ margin: '0 0 20px', fontWeight: '800', fontSize: '15px', color: '#111', alignSelf: 'flex-start' }}>Utilisateurs par rôle</p>
                <div style={{ width: '220px' }}>
                  <Doughnut data={roleDistribution} options={{ plugins: { legend: { position: 'bottom', labels: { font: { size: 12 }, padding: 14 } } }, cutout: '68%' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── USERS TAB ── */}
        {tab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {loading ? <p style={{ padding: '30px', color: '#aaa', textAlign: 'center' }}>Loading...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Name</th><th style={thStyle}>Email</th>
                      <th style={thStyle}>Role</th><th style={thStyle}>Status</th>
                      <th style={thStyle}>Joined</th><th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ background: u.isActive ? '#fff' : '#fef2f2' }}>
                        <td style={tdStyle}><span style={{ fontWeight: '700' }}>{u.name}</span></td>
                        <td style={tdStyle}>{u.email}</td>
                        <td style={tdStyle}>
                          <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                            style={{ padding: '6px 10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', fontWeight: '700', cursor: 'pointer', background: '#fafafa' }}>
                            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', background: u.isActive ? '#f0fdf4' : '#fef2f2', color: u.isActive ? '#15803d' : '#b91c1c' }}>
                            {u.isActive ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td style={tdStyle}>{new Date(u.created_at).toLocaleDateString()}</td>
                        <td style={tdStyle}>
                          <button onClick={() => toggleUser(u.id)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', background: u.isActive ? '#fef2f2' : '#f0fdf4', color: u.isActive ? '#b91c1c' : '#15803d' }}>
                            {u.isActive ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {/* ── ORDERS TAB ── */}
        {tab === 'orders' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {loading ? <p style={{ padding: '30px', color: '#aaa', textAlign: 'center' }}>Loading...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>#</th><th style={thStyle}>Customer</th>
                      <th style={thStyle}>Restaurant</th><th style={thStyle}>Total</th>
                      <th style={thStyle}>Status</th><th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id}>
                        <td style={tdStyle}><span style={{ fontWeight: '800' }}>#{o.id}</span></td>
                        <td style={tdStyle}>{o.user_name}</td>
                        <td style={tdStyle}>{o.restaurant_name}</td>
                        <td style={tdStyle}><span style={{ fontWeight: '700' }}>{Number(o.total_price).toFixed(2)} MAD</span></td>
                        <td style={tdStyle}>
                          <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', background: (statusColors[o.status] || '#888') + '20', color: statusColors[o.status] || '#888' }}>
                            {o.status}
                          </span>
                        </td>
                        <td style={tdStyle}>{new Date(o.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {/* ── RESTAURANTS TAB ── */}
        {tab === 'restaurants' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
              {loading ? <p style={{ color: '#aaa' }}>Loading...</p> : restaurants.map(r => (
                <motion.div key={r.id} whileHover={{ y: -4 }} style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                  {r.image_url && <img src={r.image_url} alt={r.name} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />}
                  <div style={{ padding: '20px' }}>
                    <p style={{ margin: '0 0 6px', fontWeight: '800', fontSize: '16px', color: '#111' }}>{r.name}</p>
                    <p style={{ margin: '0 0 4px', color: '#888', fontSize: '13px' }}>{r.city} · {r.cuisine}</p>
                    <p style={{ margin: '0 0 10px', color: '#aaa', fontSize: '12px' }}>Propriétaire: {r.owner_name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontWeight: '700', color: '#f59e0b', fontSize: '14px' }}>★ {r.rating}</span>
                      <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', background: r.isOpen ? '#f0fdf4' : '#fef2f2', color: r.isOpen ? '#15803d' : '#b91c1c' }}>
                        {r.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                      <button onClick={async () => { await axios.put(`http://localhost:5000/api/admin/restaurants/${r.id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } }); fetchRestaurants(); }}
                        style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', background: r.isOpen ? '#fef2f2' : '#f0fdf4', color: r.isOpen ? '#b91c1c' : '#15803d' }}>
                        {r.isOpen ? 'Fermer' : 'Ouvrir'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── COUPONS TAB ── */}
        {tab === 'coupons' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '24px' }}>
              <h3 style={{ margin: '0 0 18px', fontWeight: '800', color: '#111' }}>Créer un coupon</h3>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await axios.post('http://localhost:5000/api/coupons', couponForm, { headers: { Authorization: `Bearer ${token}` } });
                  setCouponForm({ code: '', discount_type: 'percentage', discount_value: '', min_order: '', max_uses: '' });
                  fetchCoupons();
                } catch (err) { alert(err.response?.data?.message || 'Error'); }
              }}
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                <input style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
                  placeholder="Code *" required value={couponForm.code} onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} />
                <select style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
                  value={couponForm.discount_type} onChange={e => setCouponForm({ ...couponForm, discount_type: e.target.value })}>
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (MAD)</option>
                </select>
                <input style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
                  type="number" placeholder="Valeur *" required value={couponForm.discount_value} onChange={e => setCouponForm({ ...couponForm, discount_value: e.target.value })} />
                <input style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
                  type="number" placeholder="Commande min (MAD)" value={couponForm.min_order} onChange={e => setCouponForm({ ...couponForm, min_order: e.target.value })} />
                <input style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid #e5e7eb', fontSize: '13px', outline: 'none' }}
                  type="number" placeholder="Utilisations max" value={couponForm.max_uses} onChange={e => setCouponForm({ ...couponForm, max_uses: e.target.value })} />
                <button type="submit" style={{ background: '#A51C1C', color: '#fff', border: 'none', borderRadius: '10px', padding: '10px', fontWeight: '700', cursor: 'pointer' }}>
                  + Créer
                </button>
              </form>
            </div>

            <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {loading ? <p style={{ padding: '30px', textAlign: 'center', color: '#aaa' }}>Loading...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Code</th><th style={thStyle}>Type</th><th style={thStyle}>Valeur</th>
                      <th style={thStyle}>Min. commande</th><th style={thStyle}>Utilisations</th>
                      <th style={thStyle}>Status</th><th style={thStyle}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coupons.map(c => (
                      <tr key={c.id}>
                        <td style={tdStyle}><span style={{ fontWeight: '800', fontFamily: 'monospace', color: '#A51C1C' }}>{c.code}</span></td>
                        <td style={tdStyle}>{c.discount_type === 'percentage' ? 'Pourcentage' : 'Fixe'}</td>
                        <td style={tdStyle}><span style={{ fontWeight: '700' }}>{c.discount_value}{c.discount_type === 'percentage' ? '%' : ' MAD'}</span></td>
                        <td style={tdStyle}>{c.min_order} MAD</td>
                        <td style={tdStyle}>{c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}</td>
                        <td style={tdStyle}>
                          <span style={{ padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700', background: c.is_active ? '#f0fdf4' : '#fef2f2', color: c.is_active ? '#15803d' : '#b91c1c' }}>
                            {c.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={async () => { await axios.put(`http://localhost:5000/api/coupons/${c.id}/toggle`, {}, { headers: { Authorization: `Bearer ${token}` } }); fetchCoupons(); }}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', background: '#f5f5f5', color: '#555' }}>
                              {c.is_active ? 'Désactiver' : 'Activer'}
                            </button>
                            <button onClick={async () => { if (window.confirm('Supprimer ce coupon?')) { await axios.delete(`http://localhost:5000/api/coupons/${c.id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchCoupons(); } }}
                              style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', background: '#fef2f2', color: '#b91c1c' }}>
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {/* ── COMMISSIONS TAB ── */}
        {tab === 'commissions' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              {loading ? <p style={{ padding: '30px', textAlign: 'center', color: '#aaa' }}>Loading...</p> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Restaurant</th><th style={thStyle}>Commandes</th>
                      <th style={thStyle}>Revenus totaux</th><th style={thStyle}>Commission (15%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commissions.map(c => (
                      <tr key={c.id}>
                        <td style={tdStyle}><span style={{ fontWeight: '800' }}>{c.restaurant_name}</span></td>
                        <td style={tdStyle}>{c.total_orders}</td>
                        <td style={tdStyle}><span style={{ fontWeight: '700' }}>{Number(c.total_revenue).toFixed(2)} MAD</span></td>
                        <td style={tdStyle}><span style={{ fontWeight: '900', color: '#A51C1C' }}>{Number(c.commission_15pct).toFixed(2)} MAD</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
