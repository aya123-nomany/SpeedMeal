import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  LayoutDashboard, Users, User, ShoppingBag, Store, DollarSign,
  LogOut, Shield, Download, FileText, Star, Truck,
  Search, RefreshCw, Trash2, Plus, TrendingUp,
  ChevronRight, MapPin, Bell, Settings, Menu as MenuIcon,
  X, ArrowUpRight, ArrowDownRight, MoreHorizontal,
  Clock, CheckCircle, XCircle, AlertCircle, Package,
  Eye, ChevronDown, Zap, Activity, Bot, Send, Sparkles,
  BarChart2, BrainCircuit, MessageSquare,
  ClipboardList, Mail, Phone, Utensils, Bike, Globe
} from 'lucide-react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import logoUrl from '../assets/logo.png';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend, Filler);
import { useLanguage } from '../context/LanguageContext';

/* ── constants ── */
const API    = 'http://localhost:5000/api/admin';
const ROLES  = ['client', 'restaurant', 'delivery', 'admin'];
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const SHORT_MONTHS = ['J','F','M','A','M','J','J','A','S','O','N','D'];

const STATUS = {
  pending:    { color: '#f97316', bg: '#fff7ed', label: 'En attente', icon: Clock },
  preparing:  { color: '#8b5cf6', bg: '#f5f3ff', label: 'Préparation', icon: Package },
  on_the_way: { color: '#3b82f6', bg: '#eff6ff', label: 'En livraison', icon: Truck },
  delivered:  { color: '#22c55e', bg: '#f0fdf4', label: 'Livré', icon: CheckCircle },
  cancelled:  { color: '#ef4444', bg: '#fef2f2', label: 'Annulé', icon: XCircle },
};

const C = { red:'#E8472A', dark:'#1C1C2E', card:'#FFFFFF', bg:'#F4F6FB', border:'#EEF0F6', muted:'#94A3B8', text:'#1C1C2E', sub:'#64748B' };

/* ── Sparkline (tiny inline chart) ── */
const Sparkline = ({ data, color, fill }) => {
  const W = 80, H = 36, pad = 2;
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => [
    pad + (i / (data.length - 1)) * (W - pad * 2),
    H - pad - ((v - min) / range) * (H - pad * 2)
  ]);
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const area = `${d} L${pts[pts.length-1][0]},${H} L${pts[0][0]},${H} Z`;
  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      {fill && <path d={area} fill={color + '20'} />}
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/* ── helpers ── */
const fmt = n => Number(n || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK = n => { const v = Number(n || 0); return v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v.toFixed(0); };

/* ── Section title (matching site style: red bg + white text + yellow sparks) ── */
const SectionHeading = ({ title }) => (
  <div style={{ position:'relative', display:'inline-flex', alignItems:'center', gap:0, marginBottom:20 }}>
    {/* Spark SVG */}
    <svg width="26" height="26" viewBox="0 0 40 40" fill="none" style={{ position:'absolute', top:-10, left:-14, pointerEvents:'none' }}>
      <path d="M10 25C10 25 8 22 5 22" stroke="#FFC244" strokeWidth="4" strokeLinecap="round"/>
      <path d="M12 18C12 18 10 14 8 12" stroke="#FFC244" strokeWidth="4" strokeLinecap="round"/>
      <path d="M18 14C18 14 20 10 22 8"  stroke="#FFC244" strokeWidth="4" strokeLinecap="round"/>
    </svg>
    <div style={{
      background:'#A51C1C', borderRadius:10,
      padding:'6px 20px',
      display:'inline-flex', alignItems:'center',
    }}>
      <span style={{ fontSize:18, fontWeight:900, color:'#fff', letterSpacing:'-0.3px', whiteSpace:'nowrap' }}>{title}</span>
    </div>
  </div>
);

/* ── mini components ── */
const Badge = ({ label, color, bg, dot = true }) => (
  <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, color, background:bg, whiteSpace:'nowrap' }}>
    {dot && <span style={{ width:5, height:5, borderRadius:'50%', background:color, flexShrink:0 }} />}
    {label}
  </span>
);

const Spin = () => (
  <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
    <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid #EEF0F6', borderTopColor:C.red, animation:'spin .7s linear infinite' }} />
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const TH = ({ children, right }) => (
  <th style={{ padding:'12px 16px', textAlign: right ? 'right' : 'left', fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.07em', borderBottom:`1px solid ${C.border}`, background:'#FAFBFD', whiteSpace:'nowrap' }}>{children}</th>
);
const TD = ({ children, right, style = {} }) => (
  <td style={{ padding:'13px 16px', fontSize:13, color:C.text, borderBottom:`1px solid ${C.border}`, textAlign:right?'right':'left', ...style }}>{children}</td>
);

const Btn = ({ children, onClick, variant='ghost', style={} }) => {
  const v = { primary:{bg:C.red,color:'#fff',border:'none'}, ghost:{bg:'#F4F6FB',color:C.sub,border:'none'}, danger:{bg:'#FEF2F2',color:'#DC2626',border:'none'}, success:{bg:'#F0FDF4',color:'#16A34A',border:'none'} }[variant];
  return <button onClick={onClick} style={{ padding:'7px 14px', borderRadius:9, border:v.border, cursor:'pointer', fontWeight:700, fontSize:12, background:v.bg, color:v.color, display:'inline-flex', alignItems:'center', gap:5, fontFamily:'Outfit,sans-serif', transition:'opacity .15s', ...style }} onMouseEnter={e=>e.currentTarget.style.opacity='.82'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>{children}</button>;
};

/* ─────────────────────────────────────────────────────── */
const AdminDashboard = () => {
  const navigate  = useNavigate();
  const token     = localStorage.getItem('token');
  const user      = JSON.parse(localStorage.getItem('user') || '{}');
  const { language, t } = useLanguage();

  const [tab,          setTab]          = useState('overview');
  const [collapsed,    setCollapsed]    = useState(false);
  const [stats,        setStats]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [orders,       setOrders]       = useState([]);
  const [restaurants,  setRestaurants]  = useState([]);
  const [coupons,      setCoupons]      = useState([]);
  const [commissions,  setCommissions]  = useState([]);
  const [reviews,      setReviews]      = useState([]);
  const [complaints,   setComplaints]   = useState([]);
  const [selectedComplaintOrder, setSelectedComplaintOrder] = useState(null);
  const [selectedNotifyComplaint, setSelectedNotifyComplaint] = useState(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [notifyForm, setNotifyForm] = useState({ recipientType: 'client', title: '', message: '' });
  const [notifications, setNotifications] = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [search,       setSearch]       = useState('');
  const [notifOpen,    setNotifOpen]    = useState(false);
  const [couponForm,   setCouponForm]   = useState({ code:'', discount_type:'percentage', discount_value:'', min_order:'', max_uses:'' });

  // ── AI state ──────────────────────────────────────────────────────────────
  const [aiChat,       setAiChat]       = useState([]);   // [{role, content}]
  const [aiInput,      setAiInput]      = useState('');
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiInsights,   setAiInsights]   = useState(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const chatBottomRef = useRef(null);

  const [toast, setToast] = useState(null);
  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Requests state ────────────────────────────────────────────────────────
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [pendingDelivery,    setPendingDelivery]    = useState([]);
  const [requestsTab,        setRequestsTab]        = useState('restaurants');
  const [rejectModal,        setRejectModal]        = useState(null);
  const [rejectReason,       setRejectReason]       = useState('');

  // ── Approved drivers ──────────────────────────────────────────────────────
  const [drivers, setDrivers] = useState([]);
  const [detailsModal, setDetailsModal] = useState(null);

  useEffect(() => { if (!token || user.role !== 'admin') navigate('/'); }, []);

  const get = useCallback(p => axios.get(`${API}/${p}`, { headers:{ Authorization:`Bearer ${token}` } }), [token]);

  const load = async (fn, setter) => { setLoading(true); try { const { data } = await fn(); setter(data); } catch {} setLoading(false); };

  const fetchStats       = () => get('stats').then(r => setStats(r.data)).catch(() => {});
  const fetchUsers       = () => load(() => get('users'),       setUsers);
  const fetchOrders      = () => load(() => get('orders'),      setOrders);
  const fetchRestaurants = () => load(() => get('restaurants'), setRestaurants);

  const fetchCoupons     = () => load(
    () => axios.get('http://localhost:5000/api/coupons', { headers:{ Authorization:`Bearer ${token}` } }),
    setCoupons
  );

  const fetchCommissions = () => load(() => get('commissions'), setCommissions);
  const fetchReviews     = () => load(() => get('reviews'),     setReviews);
  
  const fetchComplaints  = () => load(
    () => axios.get('http://localhost:5000/api/complaints', { headers:{ Authorization:`Bearer ${token}` } }),
    setComplaints
  );

  const updateComplaintStatus = async (id, status) => {
    try {
      await axios.put(`http://localhost:5000/api/complaints/${id}/status`,
        { status },
        { headers:{ Authorization:`Bearer ${token}` } }
      );
      fetchComplaints();
    } catch (err) {
      alert('Error updating status');
    }
  };

  const fetchComplaintOrderDetails = async (orderId) => {
    try {
      const { data } = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedComplaintOrder(data);
    } catch (err) {
      console.error('Error fetching order details:', err);
    }
  };

  const handleSendNotify = async (e) => {
    e.preventDefault();
    if (!selectedNotifyComplaint || !notifyForm.title || !notifyForm.message) return;
    try {
      await axios.post(`http://localhost:5000/api/complaints/${selectedNotifyComplaint.id}/notify`,
        notifyForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Message envoyé avec succès', 'success');
      setShowNotifyModal(false);
      setNotifyForm({ recipientType: 'client', title: '', message: '' });
      setSelectedNotifyComplaint(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Erreur lors de l\'envoi', 'error');
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/api/notifications', { headers:{ Authorization:`Bearer ${token}` } });
      setNotifications(data);
    } catch {}
  };

  const markAsRead = async (id) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, { headers:{ Authorization:`Bearer ${token}` } });
      fetchNotifications();
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      await axios.put('http://localhost:5000/api/notifications/read-all', {}, { headers:{ Authorization:`Bearer ${token}` } });
      fetchNotifications();
    } catch {}
  };

  useEffect(() => { fetchStats(); fetchUsers(); fetchOrders(); fetchRestaurants(); fetchNotifications(); }, []);
  useEffect(() => {
    if (tab === 'coupons'     && !coupons.length)     fetchCoupons();
    if (tab === 'commissions' && !commissions.length) fetchCommissions();
    if (tab === 'reviews'     && !reviews.length)     fetchReviews();
    if (tab === 'complaints'  && !complaints.length)  fetchComplaints();
  }, [tab]);

  // ── AI helpers ─────────────────────────────────────────────────────────────
  const fetchInsights = async () => {
    setInsightsLoading(true);
    try {
      const { data } = await axios.get('http://localhost:5000/api/ai/forecast/insights', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAiInsights(data);
    } catch (err) {
      setAiInsights({ error: err.response?.data?.error || 'Erreur service IA' });
    }
    setInsightsLoading(false);
  };

  const sendAiMessage = async () => {
    const msg = aiInput.trim();
    if (!msg || aiLoading) return;
    const history = aiChat.map(m => ({ role: m.role, content: m.content }));
    const newChat = [...aiChat, { role: 'user', content: msg }];
    setAiChat(newChat);
    setAiInput('');
    setAiLoading(true);

    // Build site context from already-loaded dashboard data
    const siteContext = {
      stats,
      restaurants,
      orders,
      recentOrders: orders.slice(0, 20),
    };

    try {
      const { data } = await axios.post(
        'http://localhost:5000/api/ai/chat',
        { message: msg, history, context: siteContext },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiChat([...newChat, { role: 'assistant', content: data.response }]);
    } catch (err) {
      setAiChat([...newChat, { role: 'assistant', content: `[!] ${err.response?.data?.error || 'Erreur'}` }]);
    }
    setAiLoading(false);
  };

  useEffect(() => {
    if (tab === 'ai' && !aiInsights) fetchInsights();
  }, [tab]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiChat, aiLoading]);

  // ── Requests helpers ──────────────────────────────────────────────────────
  const fetchPendingRestaurants = () => load(
    () => axios.get(`${API}/pending/restaurants`, { headers:{ Authorization:`Bearer ${token}` } }),
    setPendingRestaurants
  );
  const fetchPendingDelivery = () => load(
    () => axios.get(`${API}/pending/delivery`, { headers:{ Authorization:`Bearer ${token}` } }),
    setPendingDelivery
  );
  const fetchDrivers = () => load(
    () => axios.get(`${API}/drivers`, { headers:{ Authorization:`Bearer ${token}` } }),
    setDrivers
  );

  const approveRequest = async (type, userId) => {
    try {
      await axios.put(`${API}/pending/${type}/${userId}/approve`, {}, { headers:{ Authorization:`Bearer ${token}` } });
      if (type === 'restaurants') {
        fetchPendingRestaurants();
        fetchRestaurants();
      } else {
        fetchPendingDelivery();
      }
    } catch (err) { alert(err.response?.data?.error || 'Erreur'); }
  };

  const rejectRequest = async () => {
    if (!rejectModal) return;
    try {
      await axios.put(`${API}/pending/${rejectModal.type}/${rejectModal.userId}/reject`, { reason: rejectReason }, { headers:{ Authorization:`Bearer ${token}` } });
      setRejectModal(null); setRejectReason('');
      if (rejectModal.type === 'restaurants') fetchPendingRestaurants(); else fetchPendingDelivery();
    } catch (err) {
      console.error('Reject error:', err);
      alert(err.response?.data?.error || err.message || 'Erreur');
    }
  };

  useEffect(() => {
    if (tab === 'requests') { fetchPendingRestaurants(); fetchPendingDelivery(); }
    if (tab === 'delivery') { fetchDrivers(); }
  }, [tab]);

  const put = (p, d = {}) => axios.put(`${API}/${p}`, d, { headers:{ Authorization:`Bearer ${token}` } });
  const del = p           => axios.delete(`${API}/${p}`,    { headers:{ Authorization:`Bearer ${token}` } });

  const toggleUser   = id     => put(`users/${id}/toggle`).then(fetchUsers);
  const changeRole   = (id,r) => put(`users/${id}/role`, { role:r }).then(fetchUsers);
  const toggleResto  = id     => put(`restaurants/${id}/toggle`).then(fetchRestaurants);
  const deleteResto  = id     => window.confirm('Supprimer?') && del(`restaurants/${id}`).then(fetchRestaurants);
  const deleteReview = id     => window.confirm('Supprimer?') && del(`reviews/${id}`).then(fetchReviews);
  const toggleCoupon = id     => axios.put(`http://localhost:5000/api/coupons/${id}/toggle`,{},{headers:{Authorization:`Bearer ${token}`}}).then(fetchCoupons);
  const deleteCoupon = id     => window.confirm('Supprimer?') && axios.delete(`http://localhost:5000/api/coupons/${id}`,{headers:{Authorization:`Bearer ${token}`}}).then(fetchCoupons);
  const handleLogout = ()     => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/'); };

  /* ── chart data ── */
  const ordersByMonth = {
    labels: SHORT_MONTHS,
    datasets:[{ data: MONTHS.map((_,i) => orders.filter(o => new Date(o.created_at).getMonth()===i).length),
      borderColor:C.red, backgroundColor:C.red+'15', borderWidth:2.5, fill:true,
      tension:.45, pointBackgroundColor:C.red, pointRadius:3, pointHoverRadius:6 }],
  };

  const revenueByMonth = {
    labels: SHORT_MONTHS,
    datasets:[{ data: MONTHS.map((_,i) => orders.filter(o=>new Date(o.created_at).getMonth()===i).reduce((s,o)=>s+Number(o.total_price||0),0)),
      backgroundColor: MONTHS.map((_,i)=> i===new Date().getMonth() ? C.red : C.red+'50'),
      borderRadius:6, borderSkipped:false }],
  };

  const ordersByStatus = {
    labels: Object.values(STATUS).map(s=>s.label),
    datasets:[{ data: Object.keys(STATUS).map(s=>orders.filter(o=>o.status===s).length),
      backgroundColor: Object.values(STATUS).map(s=>s.color), borderWidth:0, hoverOffset:6 }],
  };

  const roleData = {
    labels: ROLES,
    datasets:[{ data: ROLES.map(r=>users.filter(u=>u.role===r).length),
      backgroundColor:['#8B5CF6','#22C55E','#3B82F6',C.red], borderWidth:0, hoverOffset:6 }],
  };

  /* month sparklines for KPIs */
  const ordersSparkData  = MONTHS.map((_,i)=>orders.filter(o=>new Date(o.created_at).getMonth()===i).length);
  const revenueSparkData = MONTHS.map((_,i)=>orders.filter(o=>new Date(o.created_at).getMonth()===i).reduce((s,o)=>s+Number(o.total_price||0),0));

  /* ── export PDF ── */
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(232,71,42); doc.rect(0,0,210,38,'F');
    try { const img=new Image(); img.src=logoUrl; doc.addImage(img,'PNG',12,7,22,18); } catch {}
    doc.setFontSize(16); doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
    doc.text('SpeedMeal — Rapport Admin',40,18);
    doc.setFontSize(9); doc.setFont('helvetica','normal');
    doc.text(`${new Date().toLocaleString('fr-FR')}  ·  ${user.name||'Admin'}`,40,27);
    let y=48;
    if(stats){
      doc.setFontSize(12); doc.setTextColor(28,28,46); doc.setFont('helvetica','bold');
      doc.text('Vue d\'ensemble',14,y); y+=5;
      autoTable(doc,{ startY:y, head:[['Métrique','Valeur']], body:[['Utilisateurs',stats.totalUsers],['Commandes',stats.totalOrders],["Aujourd'hui",stats.todayOrders],['Restaurants',stats.totalRestaurants],['Revenus (MAD)',fmt(stats.revenue)],["Revenus aujourd'hui",fmt(stats.todayRevenue)],['En attente',stats.pendingOrders]], headStyles:{fillColor:[232,71,42],fontStyle:'bold'}, alternateRowStyles:{fillColor:[255,250,250]}, styles:{fontSize:10} });
      y=doc.lastAutoTable.finalY+10;
    }
    if(orders.length){ if(y>190){doc.addPage();y=18;} doc.setFontSize(12);doc.setTextColor(28,28,46);doc.setFont('helvetica','bold');doc.text('Commandes',14,y);y+=5; autoTable(doc,{startY:y,head:[['#','Client','Restaurant','Total','Statut','Date']],body:orders.slice(0,40).map(o=>[`#${o.id}`,o.user_name,o.restaurant_name,fmt(o.total_price)+' MAD',o.status,new Date(o.created_at).toLocaleDateString('fr-FR')]),headStyles:{fillColor:[232,71,42],fontStyle:'bold'},alternateRowStyles:{fillColor:[255,250,250]},styles:{fontSize:9}}); y=doc.lastAutoTable.finalY+10; }
    if(users.length){ doc.addPage();y=18; doc.setFontSize(12);doc.setTextColor(28,28,46);doc.setFont('helvetica','bold');doc.text('Utilisateurs',14,y);y+=5; autoTable(doc,{startY:y,head:[['Nom','Email','Rôle','Statut','Inscrit le']],body:users.slice(0,60).map(u=>[u.name,u.email,u.role,u.isActive?'Actif':'Désactivé',new Date(u.created_at).toLocaleDateString('fr-FR')]),headStyles:{fillColor:[232,71,42],fontStyle:'bold'},alternateRowStyles:{fillColor:[255,250,250]},styles:{fontSize:9}}); }
    const pages=doc.internal.getNumberOfPages();
    for(let i=1;i<=pages;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(180);doc.text(`SpeedMeal © ${new Date().getFullYear()} — Page ${i}/${pages}`,14,290);}
    doc.save(`SpeedMeal_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  /* ── export Excel ── */
  const exportExcel = () => {
    const wb = XLSX.utils.book_new();
    if(stats){ const ws=XLSX.utils.aoa_to_sheet([['SpeedMeal — Rapport'],[`${new Date().toLocaleString('fr-FR')}`],[],['Métrique','Valeur'],['Utilisateurs',stats.totalUsers],['Commandes',stats.totalOrders],['Restaurants',stats.totalRestaurants],['Revenus (MAD)',fmt(stats.revenue)]]); XLSX.utils.book_append_sheet(wb,ws,"Vue d'ensemble"); }
    if(orders.length){ const ws=XLSX.utils.json_to_sheet(orders.map(o=>({'ID':`#${o.id}`,'Client':o.user_name,'Restaurant':o.restaurant_name,'Livreur':o.driver_name||'—','Total (MAD)':fmt(o.total_price),'Statut':o.status,'Date':new Date(o.created_at).toLocaleDateString('fr-FR')}))); XLSX.utils.book_append_sheet(wb,ws,'Commandes'); }
    if(users.length){ const ws=XLSX.utils.json_to_sheet(users.map(u=>({'Nom':u.name,'Email':u.email,'Rôle':u.role,'Statut':u.isActive?'Actif':'Désactivé','Inscrit':new Date(u.created_at).toLocaleDateString('fr-FR')}))); XLSX.utils.book_append_sheet(wb,ws,'Utilisateurs'); }
    if(restaurants.length){ const ws=XLSX.utils.json_to_sheet(restaurants.map(r=>({'Nom':r.name,'Ville':r.city,'Cuisine':r.cuisine,'Note':r.rating,'Statut':r.isOpen?'Ouvert':'Fermé'}))); XLSX.utils.book_append_sheet(wb,ws,'Restaurants'); }
    if(commissions.length){ const ws=XLSX.utils.json_to_sheet(commissions.map(c=>({'Restaurant':c.restaurant_name,'Commandes':c.total_orders,'Revenus':fmt(c.total_revenue),'Commission 15%':fmt(c.commission_15pct)}))); XLSX.utils.book_append_sheet(wb,ws,'Commissions'); }
    XLSX.writeFile(wb,`SpeedMeal_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  /* ── nav ── */
  const NAV = [
    { id:'overview',    label: t('navDashboard'),    icon:LayoutDashboard },
    { id:'orders',      label: t('orders'),    icon:ShoppingBag },
    { id:'users',       label: t('users'), icon:Users },
    { id:'restaurants', label: t('restaurants'),  icon:Store },
    { id:'delivery',    label: t('couriers'),     icon:Truck },
    { id:'commissions', label: t('commissions'),  icon:DollarSign },
    { id:'coupons',     label: t('coupons'),      icon:Shield },
    { id:'reviews',     label: t('reviews'),         icon:Star },
    { id:'complaints',  label: t('complaints'), icon:AlertCircle },
    { id:'requests',    label: t('requests'),     icon:ClipboardList },
    { id:'ai',          label: t('aiForecast'),icon:BrainCircuit },
  ];

  const filter = (arr, keys) =>
    !search.trim() ? arr : arr.filter(item => keys.some(k => String(item[k]||'').toLowerCase().includes(search.toLowerCase())));

  /* ─────────────── render ─────────────── */
  return (
    <>
    <div style={{ display:'flex', minHeight:'100vh', background:C.bg, fontFamily:'Outfit,sans-serif', color:C.text }}>

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <motion.aside
        animate={{ width: collapsed ? 68 : 230 }}
        transition={{ type:'spring', stiffness:320, damping:30 }}
        style={{
          background:'#fff',
          borderRight:`1px solid ${C.border}`,
          minHeight:'100vh', flexShrink:0, overflow:'hidden',
          display:'flex', flexDirection:'column',
          boxShadow:'2px 0 20px rgba(0,0,0,0.04)',
          position:'relative', zIndex:20,
        }}
      >
        {/* Logo */}
        <div style={{
          height:64, display:'flex', alignItems:'center',
          padding: collapsed ? '0 16px' : '0 20px',
          justifyContent: collapsed ? 'center' : 'space-between',
          borderBottom:`1px solid ${C.border}`, flexShrink:0,
        }}>
          {!collapsed && (
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <img src={logoUrl} alt="SpeedMeal" style={{ height:34, objectFit:'contain' }} />
            </div>
          )}
          <button onClick={() => setCollapsed(p=>!p)} style={{
            width:32, height:32, borderRadius:8, border:'none',
            background: collapsed ? C.red+'15' : C.bg,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
            color: collapsed ? C.red : C.muted, flexShrink:0,
          }}>
            <MenuIcon size={16} />
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
          {!collapsed && (
            <p style={{ fontSize:10, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.1em', padding:'8px 8px 4px', marginBottom:4 }}>MENU</p>
          )}
          {NAV.map(({ id, label, icon:Icon }) => {
            const active = tab === id;
            return (
              <motion.button key={id} onClick={() => setTab(id)} whileHover={{ x: collapsed ? 0 : 2 }}
                title={collapsed ? label : undefined}
                style={{
                  display:'flex', alignItems:'center', gap:10,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '11px' : '11px 12px',
                  borderRadius:10, border:'none', cursor:'pointer',
                  fontWeight:active ? 700 : 600, fontSize:13,
                  background: active ? C.red+'12' : 'transparent',
                  color: active ? C.red : C.sub,
                  transition:'all .18s', fontFamily:'Outfit,sans-serif',
                  position:'relative', whiteSpace:'nowrap',
                }}>
                {active && (
                  <span style={{ position:'absolute', left:0, top:'20%', bottom:'20%', width:3, borderRadius:'0 3px 3px 0', background:C.red }} />
                )}
                <Icon size={17} strokeWidth={active ? 2.5 : 2} style={{ flexShrink:0 }} />
                {!collapsed && label}
                {!collapsed && active && <ChevronRight size={13} style={{ marginLeft:'auto', opacity:.5 }} />}
              </motion.button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ borderTop:`1px solid ${C.border}`, padding: collapsed ? '14px 10px' : '14px 14px 20px' }}>
          {!collapsed ? (
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:34, height:34, borderRadius:10, background:C.red+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:800, color:C.red, flexShrink:0 }}>
                {(user.name||'A')[0].toUpperCase()}
              </div>
              <div style={{ overflow:'hidden', flex:1 }}>
                <p style={{ margin:0, fontWeight:700, fontSize:13, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</p>
                <p style={{ margin:0, fontSize:11, color:C.red, fontWeight:600 }}>{t('admin')}</p>
              </div>
            </div>
          ) : null}
          <button onClick={handleLogout} title={t('navLogout')} style={{
            display:'flex', alignItems:'center', justifyContent: collapsed ? 'center' : 'flex-start',
            gap:8, width:'100%', padding: collapsed ? '10px' : '10px 12px',
            background:'#FEF2F2', border:'none', borderRadius:9,
            color:'#DC2626', fontWeight:700, fontSize:12, cursor:'pointer',
            fontFamily:'Outfit,sans-serif', transition:'opacity .15s',
          }}
            onMouseEnter={e=>e.currentTarget.style.opacity='.8'}
            onMouseLeave={e=>e.currentTarget.style.opacity='1'}
          >
            <LogOut size={14} strokeWidth={2.5} />
            {!collapsed && t('navLogout')}
          </button>
        </div>
      </motion.aside>

      {/* ═══════════════ MAIN ═══════════════ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* ── Topbar ── */}
        <header style={{
          height:64, background:'#fff', borderBottom:`1px solid ${C.border}`,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'0 28px', boxShadow:'0 1px 8px rgba(0,0,0,0.04)', flexShrink:0,
        }}>
          <div>
            <h1 style={{ margin:0, fontSize:18, fontWeight:900, color:C.text }}>
              {NAV.find(n=>n.id===tab)?.label}
            </h1>
            <p style={{ margin:0, fontSize:11, color:C.muted }}>
              {new Date().toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </p>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Search */}
            <div style={{ display:'flex', alignItems:'center', gap:8, background:C.bg, border:`1.5px solid ${C.border}`, borderRadius:10, padding:'8px 12px', width:200 }}>
              <Search size={13} color={C.muted} />
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t('search')}
                style={{ border:'none', background:'transparent', outline:'none', fontSize:12, color:C.text, fontFamily:'Outfit,sans-serif', width:'100%' }} />
              {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted, padding:0, display:'flex' }}><X size={12}/></button>}
            </div>

            {/* Notifications */}
            <div style={{ position:'relative' }}>
              <button onClick={() => setNotifOpen(!notifOpen)} style={{ 
                width:36, height:36, borderRadius:9, border:`1.5px solid ${C.border}`, 
                background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', 
                color:C.muted, transition:'all .2s', position:'relative' 
              }} 
                onMouseEnter={e=>e.currentTarget.style.background=C.bg} 
                onMouseLeave={e=>e.currentTarget.style.background='#fff'}
              >
                <Bell size={14} />
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <span style={{
                    position:'absolute', top:4, right:4, width:8, height:8,
                    borderRadius:'50%', background:C.red
                  }} />
                )}
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {notifOpen && (
                  <motion.div 
                    initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }}
                    style={{
                      position:'absolute', top:46, right:0, width:380, maxHeight:450,
                      overflowY:'auto', background:'#fff', borderRadius:16,
                      boxShadow:'0 8px 32px rgba(0,0,0,0.12)', zIndex:1000,
                      border:`1px solid ${C.border}`
                    }}
                  >
                    <div style={{ 
                      padding:'16px 20px', borderBottom:`1px solid ${C.border}`, 
                      display:'flex', justifyContent:'space-between', alignItems:'center' 
                    }}>
                      <h3 style={{ margin:0, fontWeight:800, fontSize:16, color:C.text }}>Notifications</h3>
                      {notifications.filter(n => !n.is_read).length > 0 && (
                        <button 
                          onClick={markAllAsRead} 
                          style={{ fontSize:12, fontWeight:700, color:C.red, background:'none', border:'none', cursor:'pointer' }}
                        >
                          Tous lus
                        </button>
                      )}
                    </div>
                    <div style={{ padding:8 }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding:32, textAlign:'center', color:C.muted }}><p>Aucune notification</p></div>
                      ) : (
                        notifications.map(n => (
                          <div 
                            key={n.id} 
                            onClick={() => !n.is_read && markAsRead(n.id)}
                            style={{
                              padding:'14px 16px', borderRadius:12,
                              background:n.is_read ? 'transparent' : C.red+'08',
                              cursor:'pointer', marginBottom:4,
                              transition:'background .15s'
                            }}
                          >
                            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                              <div style={{ flex:1 }}>
                                <p style={{ margin:0, fontWeight:700, fontSize:13, color:C.text }}>{n.title}</p>
                                <p style={{ margin:'4px 0 0', fontSize:12, color:C.sub }}>{n.message}</p>
                              </div>
                              <p style={{ margin:0, fontSize:11, color:C.muted, whiteSpace:'nowrap', marginLeft:8 }}>
                                {new Date(n.created_at).toLocaleDateString('fr-FR', { 
                                  day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Refresh */}
            <button onClick={()=>{fetchStats();fetchUsers();fetchOrders();fetchRestaurants();}} style={{ width:36, height:36, borderRadius:9, border:`1.5px solid ${C.border}`, background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.muted, transition:'all .2s' }} onMouseEnter={e=>e.currentTarget.style.background=C.bg} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              <RefreshCw size={14} />
            </button>

            {/* Exports */}
            <button onClick={exportPDF} style={{ display:'flex', alignItems:'center', gap:6, background:C.red, color:'#fff', border:'none', padding:'8px 16px', borderRadius:9, fontWeight:700, fontSize:12, cursor:'pointer', boxShadow:`0 4px 12px ${C.red}40`, fontFamily:'Outfit,sans-serif', transition:'all .2s' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <FileText size={13}/> PDF
            </button>
            <button onClick={exportExcel} style={{ display:'flex', alignItems:'center', gap:6, background:'#16A34A', color:'#fff', border:'none', padding:'8px 16px', borderRadius:9, fontWeight:700, fontSize:12, cursor:'pointer', boxShadow:'0 4px 12px rgba(22,163,74,.35)', fontFamily:'Outfit,sans-serif', transition:'all .2s' }} onMouseEnter={e=>e.currentTarget.style.transform='translateY(-1px)'} onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
              <Download size={13}/> Excel
            </button>
          </div>
        </header>

        {/* ── Content ── */}
        <main style={{ flex:1, overflowY:'auto', padding:24 }}>
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-8 }} transition={{ duration:.15 }}>

              {/* ═══════════ OVERVIEW ═══════════ */}
              {tab === 'overview' && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

                  {/* KPI row */}
                  <SectionHeading title={t('overview')} />
                  {stats ? (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
                      {[
                        { label: t('totalMenus'), value:fmtK(stats.totalRestaurants*12||0), spark:ordersSparkData, color:'#8B5CF6', icon:Package, sub: t('allDishes') },
                        { label: t('totalRevenue'), value:`${fmtK(stats.revenue)} MAD`, spark:revenueSparkData, color:C.red, icon:DollarSign, sub:`+${fmt(stats.todayRevenue)} ${t('today')}`, trend:'up' },
                        { label: t('totalOrders'), value:stats.totalOrders, spark:ordersSparkData, color:'#3B82F6', icon:ShoppingBag, sub:`+${stats.todayOrders} ${t('today')}`, trend:'up' },
                        { label: t('totalClients'), value:stats.totalUsers, spark:ordersSparkData.map((_,i)=>Math.round(ordersSparkData[i]*1.4)), color:'#22C55E', icon:Users, sub:`${stats.totalDeliveries||0} ${t('couriers').toLowerCase()}`, trend:'up' },
                      ].map(({ label, value, spark, color, icon:Icon, sub, trend }) => (
                        <div key={label} style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 16px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column', gap:14, position:'relative', overflow:'hidden' }}>
                          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                            <div style={{ width:40, height:40, borderRadius:11, background:color+'15', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              <Icon size={19} color={color} strokeWidth={2.2} />
                            </div>
                            {trend && (
                              <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, fontWeight:700, color:'#22C55E', background:'#F0FDF4', padding:'3px 8px', borderRadius:999 }}>
                                <ArrowUpRight size={11}/> +12%
                              </span>
                            )}
                          </div>
                          <div>
                            <p style={{ margin:0, fontSize:11, color:C.muted, fontWeight:600 }}>{label}</p>
                            <p style={{ margin:'3px 0 0', fontSize:24, fontWeight:900, color:C.text, lineHeight:1.1 }}>{value}</p>
                            <p style={{ margin:'4px 0 0', fontSize:11, color:C.muted }}>{sub}</p>
                          </div>
                          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:-8 }}>
                            <Sparkline data={spark} color={color} fill />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <Spin />}

                  {/* Charts row */}
                  <SectionHeading title={t('statistics')} />
                  <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16 }}>
                    {/* Revenue overview */}
                    <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                        <div>
                          <p style={{ margin:0, fontWeight:800, fontSize:14, color:C.text }}>Revenue Overview</p>
                          <p style={{ margin:'2px 0 0', fontSize:11, color:C.muted }}>Revenus mensuels en MAD</p>
                        </div>
                        <select style={{ fontSize:11, fontWeight:700, color:C.sub, border:`1px solid ${C.border}`, borderRadius:7, padding:'4px 10px', background:'#fff', fontFamily:'Outfit,sans-serif', outline:'none' }}>
                          <option>Cette année</option>
                        </select>
                      </div>
                      <Line data={ordersByMonth} options={{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:10, family:'Outfit' }, color:C.muted } }, y:{ grid:{ color:'#F4F6FB' }, ticks:{ font:{ size:10, family:'Outfit' }, color:C.muted }, beginAtZero:true } } }} />
                    </div>

                    {/* Doughnut orders status */}
                    <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                      <div style={{ marginBottom:16 }}>
                        <p style={{ margin:0, fontWeight:800, fontSize:14, color:C.text }}>Statut commandes</p>
                        <p style={{ margin:'2px 0 0', fontSize:11, color:C.muted }}>Répartition par statut</p>
                      </div>
                      <div style={{ display:'flex', justifyContent:'center' }}>
                        <div style={{ width:200 }}>
                          <Doughnut data={ordersByStatus} options={{ plugins:{ legend:{ position:'bottom', labels:{ font:{ size:11, family:'Outfit' }, padding:12, usePointStyle:true, pointStyleWidth:7 } } }, cutout:'68%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom row: trending items + bar chart + recent orders */}
                  <SectionHeading title={`${t('restaurants')} & ${t('commissions')}`} />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:16 }}>

                    {/* Trending restaurants */}
                    <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                        <p style={{ margin:0, fontWeight:800, fontSize:14, color:C.text }}>Trending Restaurants</p>
                        <Btn onClick={()=>setTab('restaurants')} variant="ghost" style={{ fontSize:11 }}>Voir tout</Btn>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
                        {[...restaurants].sort((a,b)=>Number(b.rating)-Number(a.rating)).slice(0,5).map((r,i) => (
                          <div key={r.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 0', borderBottom: i<4 ? `1px solid ${C.border}` : 'none' }}>
                            <span style={{ fontSize:11, fontWeight:700, color:C.muted, width:18, textAlign:'center' }}>#{i+1}</span>
                            <div style={{ width:40, height:40, borderRadius:10, overflow:'hidden', flexShrink:0, background:C.bg }}>
                              {r.image_url ? <img src={r.image_url} alt={r.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : <Store size={18} color={C.muted} style={{ margin:11 }} />}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ margin:0, fontSize:13, fontWeight:700, color:C.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.name}</p>
                              <p style={{ margin:'1px 0 0', fontSize:11, color:C.muted }}>{r.city} · {r.cuisine}</p>
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <p style={{ margin:0, fontSize:12, fontWeight:800, color:'#F59E0B', display:'flex', alignItems:'center', gap:3 }}><Star size={11} fill="#F59E0B" color="#F59E0B"/>{Number(r.rating||0).toFixed(1)}</p>
                              <Sparkline data={[3,5,4,7,6,8,9,7,10,9].map(v=>v+i)} color="#F59E0B" />
                            </div>
                          </div>
                        ))}
                        {restaurants.length === 0 && <p style={{ color:C.muted, fontSize:13, padding:'10px 0' }}>Aucun restaurant</p>}
                      </div>
                    </div>

                    {/* Revenue bar + recent orders */}
                    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                      <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                          <p style={{ margin:0, fontWeight:800, fontSize:14, color:C.text }}>Revenus par mois</p>
                          <select style={{ fontSize:11, fontWeight:700, color:C.sub, border:`1px solid ${C.border}`, borderRadius:7, padding:'4px 10px', background:'#fff', fontFamily:'Outfit,sans-serif', outline:'none' }}>
                            <option>2026</option>
                          </select>
                        </div>
                        <Bar data={revenueByMonth} options={{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:10, family:'Outfit' }, color:C.muted } }, y:{ grid:{ color:'#F4F6FB' }, ticks:{ font:{ size:10, family:'Outfit' }, color:C.muted }, beginAtZero:true } } }} />
                      </div>

                      {/* mini stats */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                        {[
                          { label:'En attente', value:stats?.pendingOrders||0, color:'#F97316', bg:'#FFF7ED', icon:Clock },
                          { label:'Livrés', value:orders.filter(o=>o.status==='delivered').length, color:'#22C55E', bg:'#F0FDF4', icon:CheckCircle },
                          { label:'Annulés', value:orders.filter(o=>o.status==='cancelled').length, color:'#EF4444', bg:'#FEF2F2', icon:XCircle },
                          { label:'En livraison', value:orders.filter(o=>o.status==='on_the_way').length, color:'#3B82F6', bg:'#EFF6FF', icon:Truck },
                        ].map(({ label, value, color, bg, icon:Icon }) => (
                          <div key={label} style={{ background:bg, borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:9, background:'#fff', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                              <Icon size={16} color={color} />
                            </div>
                            <div>
                              <p style={{ margin:0, fontSize:11, color, fontWeight:700 }}>{label}</p>
                              <p style={{ margin:'1px 0 0', fontSize:20, fontWeight:900, color:C.text, lineHeight:1.1 }}>{value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Recent orders table */}
                  <SectionHeading title="Commandes Récentes" />
                  <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px 14px', borderBottom:`1px solid ${C.border}` }}>
                      <p style={{ margin:0, fontWeight:800, fontSize:14, color:C.text }}>Commandes récentes</p>
                      <Btn onClick={()=>setTab('orders')} variant="ghost" style={{ fontSize:11, display:'inline-flex', alignItems:'center', gap:4 }}>Voir tout <ChevronRight size={12}/></Btn>
                    </div>
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr><TH>#</TH><TH>Client</TH><TH>Restaurant</TH><TH>Total</TH><TH>Statut</TH><TH>Date</TH></tr></thead>
                        <tbody>
                          {orders.slice(0,6).map(o => {
                            const s = STATUS[o.status] || { color:'#888', bg:'#f5f5f5', label:o.status };
                            return (
                              <tr key={o.id} style={{ transition:'background .15s' }} onMouseEnter={e=>e.currentTarget.style.background='#FAFBFD'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
                                <TD><span style={{ fontWeight:800, color:C.red }}>#{o.id}</span></TD>
                                <TD style={{ fontWeight:600 }}>{o.user_name}</TD>
                                <TD style={{ color:C.sub }}>{o.restaurant_name}</TD>
                                <TD right><span style={{ fontWeight:700 }}>{fmt(o.total_price)} MAD</span></TD>
                                <TD><Badge label={s.label} color={s.color} bg={s.bg} /></TD>
                                <TD style={{ color:C.muted, fontSize:12 }}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</TD>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════ ORDERS ═══════════ */}
              {tab === 'orders' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <SectionHeading title="Commandes" />
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
                    {Object.entries(STATUS).map(([key,{color,bg,label,icon:Icon}]) => (
                      <div key={key} style={{ background:'#fff', borderRadius:14, padding:'16px 18px', boxShadow:'0 2px 12px rgba(0,0,0,0.04)', borderLeft:`3px solid ${color}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                          <div style={{ width:28,height:28,borderRadius:8,background:bg,display:'flex',alignItems:'center',justifyContent:'center' }}>
                            <Icon size={14} color={color} />
                          </div>
                          <p style={{ margin:0, fontSize:11, fontWeight:700, color, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</p>
                        </div>
                        <p style={{ margin:0, fontSize:26, fontWeight:900, color:C.text }}>{orders.filter(o=>o.status===key).length}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                    {loading ? <Spin /> : (
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                          <thead><tr><TH>#</TH><TH>Client</TH><TH>Restaurant</TH><TH>Livreur</TH><TH right>Total</TH><TH>Statut</TH><TH>Date</TH></tr></thead>
                          <tbody>
                            {filter(orders,['user_name','restaurant_name','status']).map(o => {
                              const s = STATUS[o.status] || { color:'#888', bg:'#f5f5f5', label:o.status };
                              return (
                                <tr key={o.id} onMouseEnter={e=>e.currentTarget.style.background='#FAFBFD'} onMouseLeave={e=>e.currentTarget.style.background='#fff'} style={{ transition:'background .15s' }}>
                                  <TD><span style={{ fontWeight:800, color:C.red }}>#{o.id}</span></TD>
                                  <TD style={{ fontWeight:600 }}>{o.user_name}</TD>
                                  <TD style={{ color:C.sub }}>{o.restaurant_name}</TD>
                                  <TD style={{ color:C.muted }}>{o.driver_name||'—'}</TD>
                                  <TD right><span style={{ fontWeight:700 }}>{fmt(o.total_price)} MAD</span></TD>
                                  <TD><Badge label={s.label} color={s.color} bg={s.bg} /></TD>
                                  <TD style={{ color:C.muted, fontSize:12 }}>{new Date(o.created_at).toLocaleDateString('fr-FR')}</TD>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        {!filter(orders,['user_name','restaurant_name','status']).length && <p style={{ textAlign:'center', color:C.muted, padding:30 }}>Aucun résultat</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════ USERS ═══════════ */}
              {tab === 'users' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <SectionHeading title="Utilisateurs" />
                  <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                  {loading ? <Spin /> : (
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr><TH>Utilisateur</TH><TH>Email</TH><TH>Téléphone</TH><TH>Rôle</TH><TH>Statut</TH><TH>Inscrit le</TH><TH>Actions</TH></tr></thead>
                        <tbody>
                          {filter(users,['name','email','role']).map(u => (
                            <tr key={u.id} onMouseEnter={e=>e.currentTarget.style.background='#FAFBFD'} onMouseLeave={e=>e.currentTarget.style.background='#fff'} style={{ transition:'background .15s' }}>
                              <TD>
                                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                  <div style={{ width:34, height:34, borderRadius:10, background:'#8B5CF6'+'18', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#8B5CF6', flexShrink:0 }}>
                                    {(u.name||'?')[0].toUpperCase()}
                                  </div>
                                  <span style={{ fontWeight:700 }}>{u.name}</span>
                                </div>
                              </TD>
                              <TD style={{ color:C.sub }}>{u.email}</TD>
                              <TD style={{ color:C.muted }}>{u.phone||'—'}</TD>
                              <TD>
                                <select value={u.role} onChange={e=>changeRole(u.id,e.target.value)} style={{ padding:'5px 8px', borderRadius:8, border:`1.5px solid ${C.border}`, fontSize:12, fontWeight:700, cursor:'pointer', background:'#FAFBFD', fontFamily:'Outfit,sans-serif', color:C.text, outline:'none' }}>
                                  {ROLES.map(r=><option key={r} value={r}>{r}</option>)}
                                </select>
                              </TD>
                              <TD><Badge label={u.isActive?'Actif':'Désactivé'} color={u.isActive?'#16A34A':'#DC2626'} bg={u.isActive?'#F0FDF4':'#FEF2F2'} /></TD>
                              <TD style={{ color:C.muted, fontSize:12 }}>{new Date(u.created_at).toLocaleDateString('fr-FR')}</TD>
                              <TD><Btn onClick={()=>toggleUser(u.id)} variant={u.isActive?'danger':'success'}>{u.isActive?'Désactiver':'Activer'}</Btn></TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!filter(users,['name','email','role']).length && <p style={{ textAlign:'center', color:C.muted, padding:30 }}>Aucun résultat</p>}
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* ═══════════ RESTAURANTS ═══════════ */}
              {tab === 'restaurants' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <SectionHeading title="Nos Restaurants" />

                  {loading ? <Spin /> : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                    {filter(restaurants.filter(r => r.isVerified),['name','city','cuisine','owner_name']).map(r => (
                      <motion.div key={r.id} whileHover={{ y:-4, boxShadow:'0 16px 32px rgba(0,0,0,0.10)' }} transition={{ type:'spring', stiffness:300, damping:22 }}
                        onClick={() => setDetailsModal({ type: 'restaurant', data: r })}
                        style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                        <div style={{ position:'relative' }}>
                          {r.image_url
                            ? <img src={r.image_url} alt={r.name} style={{ width:'100%', height:150, objectFit:'cover' }} />
                            : <div style={{ width:'100%', height:150, background:'linear-gradient(135deg,#F4F6FB,#E2E8F0)', display:'flex', alignItems:'center', justifyContent:'center' }}><Store size={36} color={C.muted} /></div>
                          }
                          <div style={{ position:'absolute', top:10, right:10 }}>
                            <Badge label={r.isOpen?'Ouvert':'Fermé'} color={r.isOpen?'#16A34A':'#DC2626'} bg={r.isOpen?'#F0FDF4':'#FEF2F2'} />
                          </div>
                        </div>
                        <div style={{ padding:18 }}>
                          <p style={{ margin:'0 0 3px', fontWeight:800, fontSize:15, color:C.text }}>{r.name}</p>
                          <p style={{ margin:'0 0 2px', color:C.sub, fontSize:12, display:'flex', alignItems:'center', gap:3 }}><MapPin size={11}/>{r.city} · {r.cuisine}</p>
                          <p style={{ margin:'0 0 12px', color:C.muted, fontSize:11, display:'flex', alignItems:'center', gap:4 }}><User size={11}/> {r.owner_name}</p>
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                            <span style={{ display:'flex', alignItems:'center', gap:3, fontWeight:700, color:'#F59E0B', fontSize:13 }}><Star size={13} fill="#F59E0B" />{Number(r.rating||0).toFixed(1)}</span>
                            <Sparkline data={[4,5,6,5,7,8,7,9,8,10].map(v=>v+Math.random())} color="#F59E0B" />
                          </div>
                          <div style={{ display:'flex', gap:8 }}>
                            <Btn onClick={(e)=>{ e.stopPropagation(); toggleResto(r.id); }} variant={r.isOpen?'danger':'success'} style={{ flex:1, justifyContent:'center' }}>{r.isOpen?'Fermer':'Ouvrir'}</Btn>
                            <Btn onClick={(e)=>{ e.stopPropagation(); deleteResto(r.id); }} variant="danger" style={{ padding:'7px 10px' }}><Trash2 size={13}/></Btn>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    {!filter(restaurants,['name','city','cuisine','owner_name']).length && <p style={{ color:C.muted }}>Aucun résultat</p>}
                  </div>
                  )}
                </div>
              )}

              {/* ═══════════ LIVREURS ═══════════ */}
              {tab === 'delivery' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <SectionHeading title="Nos Livreurs" />

                  {/* KPI row */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                    {[
                      { label:'Total livreurs',     value: drivers.length,                                                           color:'#3B82F6', bg:'#EFF6FF', icon:Bike },
                      { label:'Actifs',              value: drivers.filter(d=>d.isActive).length,                                    color:'#22C55E', bg:'#F0FDF4', icon:CheckCircle },
                      { label:'Livraisons totales',  value: drivers.reduce((s,d)=>s+Number(d.delivered_count||0),0),                 color:'#F97316', bg:'#FFF7ED', icon:Package },
                      { label:'Revenus générés',     value: fmtK(drivers.reduce((s,d)=>s+Number(d.total_revenue||0),0))+' MAD',     color:C.red,     bg:'#FFF1EE', icon:DollarSign },
                    ].map(({ label, value, color, bg, icon:Icon }) => (
                      <div key={label} style={{ background:'#fff', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Icon size={20} color={color}/>
                        </div>
                        <div>
                          <p style={{ margin:0, fontSize:11, color:C.muted, fontWeight:600 }}>{label}</p>
                          <p style={{ margin:'2px 0 0', fontSize:22, fontWeight:900, color:C.text, lineHeight:1 }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Drivers list */}
                  {loading ? <Spin /> : drivers.length === 0 ? (
                    <div style={{ background:'#fff', borderRadius:16, padding:'60px 0', textAlign:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.05)', border:`1.5px dashed ${C.border}` }}>
                      <Bike size={48} color={C.muted} style={{ marginBottom:12, opacity:.35 }}/>
                      <p style={{ color:C.text, fontSize:15, fontWeight:700, margin:'0 0 4px' }}>Aucun livreur approuvé</p>
                      <p style={{ color:C.muted, fontSize:13 }}>Les livreurs approuvés apparaîtront ici</p>
                    </div>
                  ) : (
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16 }}>
                      {filter(drivers,['name','email','phone','address']).map(d => (
                        <motion.div key={d.id} whileHover={{ y:-3, boxShadow:'0 12px 32px rgba(0,0,0,0.10)' }} transition={{ type:'spring', stiffness:300, damping:22 }}
                          onClick={() => setDetailsModal({ type: 'delivery', data: d })}
                          style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:`1px solid ${C.border}`, cursor: 'pointer' }}>

                          {/* Header */}
                          <div style={{ background:'linear-gradient(135deg,#EFF6FF,#DBEAFE)', padding:'18px 20px', display:'flex', alignItems:'center', gap:14 }}>
                            {d.face_photo ? (
                              <img src={d.face_photo} alt={d.name} style={{ width:52, height:52, borderRadius:14, objectFit:'cover', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }} />
                            ) : (
                              <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#3B82F6,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:20, fontWeight:900, color:'#fff', boxShadow:'0 4px 12px rgba(59,130,246,0.35)' }}>
                                {(d.name||'?')[0].toUpperCase()}
                              </div>
                            )}
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ margin:'0 0 2px', fontWeight:900, fontSize:15, color:'#1E3A8A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.name}</p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: d.is_available ? '#22c55e' : '#94a3b8' }} />
                                <span style={{ fontSize: 11, color: d.is_available ? '#16a34a' : '#64748b', fontWeight: 700 }}>
                                  {d.is_available ? 'Disponible' : 'Indisponible'}
                                </span>
                              </div>
                            </div>
                            <span style={{ background: d.isActive ? '#F0FDF4' : '#FEF2F2', color: d.isActive ? '#16A34A' : '#DC2626', border:`1px solid ${d.isActive?'#BBF7D0':'#FECACA'}`, padding:'4px 10px', borderRadius:999, fontSize:11, fontWeight:800, flexShrink:0, display:'inline-flex', alignItems:'center', gap:4 }}>
                              <span style={{ width:6, height:6, borderRadius:'50%', background: d.isActive?'#16A34A':'#DC2626', display:'inline-block' }}/>
                              {d.isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </div>

                          {/* Body */}
                          <div style={{ padding:'14px 18px', display:'flex', flexDirection:'column', gap:10 }}>
                            {/* Contact */}
                            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                              {d.phone && <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:C.sub }}><Phone size={12} color={C.muted}/>{d.phone}</div>}
                              {d.address && <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:C.sub }}><MapPin size={12} color={C.muted}/>{d.address}</div>}
                              <div style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:C.sub }}><Clock size={12} color={C.muted}/>Depuis le {new Date(d.created_at).toLocaleDateString('fr-FR')}</div>
                            </div>

                            {/* Chips */}
                            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                              {d.vehicle_type && (
                                <span style={{ background:'#EFF6FF', color:'#3B82F6', border:'1px solid #BFDBFE', padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
                                  <Bike size={11}/> {d.vehicle_type.charAt(0).toUpperCase()+d.vehicle_type.slice(1)}
                                </span>
                              )}
                              <span style={{ background: d.has_license==='Oui'?'#F0FDF4':'#FEF2F2', color: d.has_license==='Oui'?'#16A34A':'#DC2626', border:`1px solid ${d.has_license==='Oui'?'#BBF7D0':'#FECACA'}`, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
                                {d.has_license==='Oui' ? <CheckCircle size={10}/> : <XCircle size={10}/>} Permis
                              </span>
                              <span style={{ background: d.has_insurance==='Oui'?'#F0FDF4':'#FEF2F2', color: d.has_insurance==='Oui'?'#16A34A':'#DC2626', border:`1px solid ${d.has_insurance==='Oui'?'#BBF7D0':'#FECACA'}`, padding:'3px 10px', borderRadius:999, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
                                {d.has_insurance==='Oui' ? <CheckCircle size={10}/> : <XCircle size={10}/>} Assurance
                              </span>
                            </div>

                            {/* Stats row */}
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginTop:2 }}>
                              {[
                                { label:'Livraisons', value: Number(d.delivered_count||0), color:'#3B82F6' },
                                { label:'Commandes',  value: Number(d.total_deliveries||0), color:'#F97316' },
                                { label:'Revenus',    value: fmtK(d.total_revenue||0)+' MAD', color:C.red },
                              ].map(({ label, value, color }) => (
                                <div key={label} style={{ background:C.bg, borderRadius:10, padding:'8px 10px', textAlign:'center' }}>
                                  <p style={{ margin:0, fontSize:10, color:C.muted, fontWeight:600 }}>{label}</p>
                                  <p style={{ margin:'2px 0 0', fontSize:15, fontWeight:900, color }}>{value}</p>
                                </div>
                              ))}
                            </div>

                            {/* Toggle active button */}
                            <button onClick={(e) => { e.stopPropagation(); put(`users/${d.id}/toggle`).then(fetchDrivers); }}
                              style={{ width:'100%', padding:'9px', borderRadius:10, border:`1.5px solid ${d.isActive?'#FECACA':'#BBF7D0'}`, background: d.isActive?'#FEF2F2':'#F0FDF4', color: d.isActive?'#DC2626':'#16A34A', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'Outfit,sans-serif', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'all .18s' }}
                              onMouseEnter={e=>e.currentTarget.style.opacity='.8'} onMouseLeave={e=>e.currentTarget.style.opacity='1'}>
                              {d.isActive ? <><XCircle size={13}/> Désactiver</> : <><CheckCircle size={13}/> Activer</>}
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ═══════════ COMMISSIONS ═══════════ */}
              {tab === 'commissions' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <SectionHeading title="Commissions" />
                  {(() => {
                    const verifiedCommissions = commissions.filter(c => {
                      // Just show all restaurants (no need to filter)
                      return true;
                    });
                    return (
                      <>
                        {verifiedCommissions.length > 0 && (
                          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
                            {[
                              { label:'Commandes livrées', value:verifiedCommissions.reduce((s,c)=>s+Number(c.total_orders),0), color:'#F97316', icon:ShoppingBag },
                              { label:'Revenus totaux (MAD)', value:fmtK(verifiedCommissions.reduce((s,c)=>s+Number(c.total_revenue),0))+' MAD', color:'#3B82F6', icon:TrendingUp },
                              { label:'Commissions 15% (MAD)', value:fmt(verifiedCommissions.reduce((s,c)=>s+Number(c.commission_15pct),0))+' MAD', color:C.red, icon:DollarSign },
                            ].map(({ label, value, color, icon:Icon }) => (
                              <div key={label} style={{ background:'#fff', borderRadius:14, padding:'20px 22px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:14 }}>
                                <div style={{ width:44, height:44, borderRadius:12, background:color+'15', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}><Icon size={20} color={color}/></div>
                                <div><p style={{ margin:0, fontSize:11, color:C.muted, fontWeight:600 }}>{label}</p><p style={{ margin:'3px 0 0', fontSize:22, fontWeight:900, color:C.text }}>{value}</p></div>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                          {loading ? <Spin /> : (
                            <div style={{ overflowX:'auto' }}>
                              <table style={{ width:'100%', borderCollapse:'collapse' }}>
                                <thead><tr><TH>#</TH><TH>Restaurant</TH><TH right>Commandes</TH><TH right>Revenus (MAD)</TH><TH right>Commission 15%</TH></tr></thead>
                                <tbody>
                                  {verifiedCommissions.map((c,i) => (
                                    <tr key={c.id} onMouseEnter={e=>e.currentTarget.style.background='#FAFBFD'} onMouseLeave={e=>e.currentTarget.style.background='#fff'} style={{ transition:'background .15s' }}>
                                      <TD><span style={{ fontWeight:700, color:C.muted }}>{i+1}</span></TD>
                                      <TD><span style={{ fontWeight:700 }}>{c.restaurant_name}</span></TD>
                                      <TD right><span style={{ fontWeight:600 }}>{c.total_orders}</span></TD>
                                      <TD right><span style={{ fontWeight:600 }}>{fmt(c.total_revenue)}</span></TD>
                                      <TD right><span style={{ fontWeight:900, color:C.red, background:C.red+'12', padding:'3px 10px', borderRadius:7 }}>{fmt(c.commission_15pct)}</span></TD>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {!verifiedCommissions.length && <p style={{ textAlign:'center', color:C.muted, padding:30 }}>Aucune donnée</p>}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* ═══════════ COUPONS ═══════════ */}
              {tab === 'coupons' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <SectionHeading title="Coupons" />
                  <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                    <p style={{ margin:'0 0 16px', fontWeight:800, fontSize:14, color:C.text, display:'flex', alignItems:'center', gap:7 }}><Plus size={15} color={C.red}/>Créer un coupon</p>
                    <form onSubmit={async e => {
                      e.preventDefault();
                      try { await axios.post('http://localhost:5000/api/coupons', couponForm, { headers:{ Authorization:`Bearer ${token}` } }); setCouponForm({ code:'', discount_type:'percentage', discount_value:'', min_order:'', max_uses:'' }); fetchCoupons(); }
                      catch(err) { alert(err.response?.data?.message||'Erreur'); }
                    }} style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:10 }}>
                      {[{ ph:'Code *', key:'code', tf:v=>v.toUpperCase() },{ ph:'Valeur *', key:'discount_value', type:'number' },{ ph:'Commande min', key:'min_order', type:'number' },{ ph:'Utilisations max', key:'max_uses', type:'number' }].map(({ ph, key, type='text', tf }) => (
                        <input key={key} placeholder={ph} type={type} required={ph.includes('*')} value={couponForm[key]}
                          onChange={e=>setCouponForm({ ...couponForm, [key]: tf?tf(e.target.value):e.target.value })}
                          style={{ padding:'10px 13px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:12, fontFamily:'Outfit,sans-serif', color:C.text, outline:'none', transition:'border .15s' }}
                          onFocus={e=>e.target.style.borderColor=C.red} onBlur={e=>e.target.style.borderColor=C.border} />
                      ))}
                      <select value={couponForm.discount_type} onChange={e=>setCouponForm({ ...couponForm, discount_type:e.target.value })}
                        style={{ padding:'10px 13px', borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:12, fontFamily:'Outfit,sans-serif', color:C.text, outline:'none', background:'#fff' }}>
                        <option value="percentage">Pourcentage (%)</option>
                        <option value="fixed">Montant fixe (MAD)</option>
                      </select>
                      <button type="submit" style={{ background:C.red, color:'#fff', border:'none', borderRadius:9, padding:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', boxShadow:`0 4px 12px ${C.red}40` }}>+ Créer</button>
                    </form>
                  </div>
                  <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                    {loading ? <Spin /> : (
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                          <thead><tr><TH>Code</TH><TH>Type</TH><TH right>Valeur</TH><TH right>Min. cmd</TH><TH right>Utilisations</TH><TH>Restaurants</TH><TH>Statut</TH><TH>Actions</TH></tr></thead>
                          <tbody>
                            {coupons.map(c => (
                              <tr key={c.id} onMouseEnter={e=>e.currentTarget.style.background='#FAFBFD'} onMouseLeave={e=>e.currentTarget.style.background='#fff'} style={{ transition:'background .15s' }}>
                                <TD><code style={{ fontWeight:800, color:C.red, background:C.red+'10', padding:'2px 8px', borderRadius:5, fontSize:12, letterSpacing:'.04em' }}>{c.code}</code></TD>
                                <TD style={{ color:C.sub }}>{c.discount_type==='percentage'?'Pourcentage':'Fixe'}</TD>
                                <TD right><span style={{ fontWeight:700 }}>{c.discount_value}{c.discount_type==='percentage'?'%':' MAD'}</span></TD>
                                <TD right style={{ color:C.sub }}>{c.min_order} MAD</TD>
                                <TD right>{c.used_count}{c.max_uses?`/${c.max_uses}`:''}</TD>
                                <TD style={{ color:C.sub }}>{c.accepted_restaurants}/{c.total_restaurants}</TD>
                                <TD><Badge label={c.is_active?'Actif':'Inactif'} color={c.is_active?'#16A34A':'#DC2626'} bg={c.is_active?'#F0FDF4':'#FEF2F2'} /></TD>
                                <TD>
                                  <div style={{ display:'flex', gap:6 }}>
                                    <Btn onClick={()=>toggleCoupon(c.id)} variant="ghost">{c.is_active?'Désactiver':'Activer'}</Btn>
                                    <Btn onClick={()=>deleteCoupon(c.id)} variant="danger"><Trash2 size={12}/></Btn>
                                  </div>
                                </TD>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {!coupons.length && <p style={{ textAlign:'center', color:C.muted, padding:30 }}>Aucun coupon</p>}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ═══════════ REVIEWS ═══════════ */}
              {tab === 'reviews' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <SectionHeading title="Avis Clients" />
                  <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                  {loading ? <Spin /> : (
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr><TH>Client</TH><TH>Restaurant</TH><TH>Note</TH><TH>Commentaire</TH><TH>Date</TH><TH>Actions</TH></tr></thead>
                        <tbody>
                          {filter(reviews,['user_name','restaurant_name','comment']).map(r => (
                            <tr key={r.id} onMouseEnter={e=>e.currentTarget.style.background='#FAFBFD'} onMouseLeave={e=>e.currentTarget.style.background='#fff'} style={{ transition:'background .15s' }}>
                              <TD>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div style={{ width:30,height:30,borderRadius:8,background:C.red+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:C.red,flexShrink:0 }}>{(r.user_name||'?')[0].toUpperCase()}</div>
                                  <span style={{ fontWeight:700 }}>{r.user_name}</span>
                                </div>
                              </TD>
                              <TD style={{ color:C.sub }}>{r.restaurant_name}</TD>
                              <TD>
                                <div style={{ display:'flex', gap:1 }}>
                                  {[1,2,3,4,5].map(i=><Star key={i} size={12} fill={i<=r.rating?'#F59E0B':'none'} color={i<=r.rating?'#F59E0B':'#E2E8F0'}/>)}
                                </div>
                              </TD>
                              <TD style={{ color:C.sub, maxWidth:240 }}><p style={{ margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.comment||'—'}</p></TD>
                              <TD style={{ color:C.muted, fontSize:12 }}>{new Date(r.created_at).toLocaleDateString('fr-FR')}</TD>
                              <TD><Btn onClick={()=>deleteReview(r.id)} variant="danger"><Trash2 size={12}/></Btn></TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!filter(reviews,['user_name','restaurant_name','comment']).length && <p style={{ textAlign:'center', color:C.muted, padding:30 }}>Aucun avis</p>}
                    </div>
                  )}
                  </div>
                </div>
              )}

              {/* ═══════════ COMPLAINTS ═══════════ */}
              {tab === 'complaints' && (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  <SectionHeading title="Réclamations" />
                  <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                  {loading ? <Spin /> : (
                    <div style={{ overflowX:'auto' }}>
                      <table style={{ width:'100%', borderCollapse:'collapse' }}>
                        <thead><tr><TH>Client</TH><TH>Sujet</TH><TH>Description</TH><TH>Restaurant</TH><TH>Livreur</TH><TH>Statut</TH><TH>Date</TH><TH>Actions</TH></tr></thead>
                        <tbody>
                          {filter(complaints,['user_name','subject','description']).map(c => (
                            <tr key={c.id} onMouseEnter={e=>e.currentTarget.style.background='#FAFBFD'} onMouseLeave={e=>e.currentTarget.style.background='#fff'} style={{ transition:'background .15s' }}>
                              <TD>
                                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                                  <div style={{ width:30,height:30,borderRadius:8,background:C.red+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:800,color:C.red,flexShrink:0 }}>{(c.user_name||'?')[0].toUpperCase()}</div>
                                  <span style={{ fontWeight:700 }}>{c.user_name}</span>
                                </div>
                              </TD>
                              <TD style={{ fontWeight:700 }}>
                                <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                                  <span style={{
                                    background: c.target === 'restaurant' ? '#fff0f0' : c.target === 'driver' ? '#eff6ff' : '#f3f4f6',
                                    color: c.target === 'restaurant' ? '#A51C1C' : c.target === 'driver' ? '#1d4ed8' : '#4b5563',
                                    padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '3px', width: 'fit-content'
                                  }}>
                                    {c.target === 'restaurant' ? <Store size={10} /> : c.target === 'driver' ? <Bike size={10} /> : <Globe size={10} />}
                                    {c.target === 'restaurant' ? 'Restaurant' : c.target === 'driver' ? 'Livreur' : 'Site Web'}
                                  </span>
                                  {c.subject}
                                </div>
                              </TD>
                              <TD style={{ color:C.sub, maxWidth:280 }}><p style={{ margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.description||'—'}</p></TD>
                              <TD style={{ color:C.sub }}>{c.restaurant_name||'—'}</TD>
                              <TD style={{ color:C.sub }}>{c.driver_name||'—'}</TD>
                              <TD>
                                <select
                                  value={c.status}
                                  onChange={(e)=>updateComplaintStatus(c.id, e.target.value)}
                                  style={{
                                    padding:'4px 8px', borderRadius:8, border:`1px solid ${C.border}`,
                                    background:'#fff', fontWeight:700, fontSize:12, cursor:'pointer',
                                    fontFamily:'Outfit,sans-serif'
                                  }}
                                >
                                  <option value="pending">En attente</option>
                                  <option value="in_review">En cours</option>
                                  <option value="resolved">Résolu</option>
                                  <option value="dismissed">Rejeté</option>
                                </select>
                              </TD>
                              <TD style={{ color:C.muted, fontSize:12 }}>{new Date(c.created_at).toLocaleDateString('fr-FR')}</TD>
                              <TD>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  {c.order_id && (
                                    <button
                                      onClick={() => fetchComplaintOrderDetails(c.order_id)}
                                      style={{ background:'#eff6ff', color:'#3b82f6', border:'none', padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}
                                    >
                                      <Eye size={14} /> Voir commande
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      setSelectedNotifyComplaint(c);
                                      setNotifyForm({
                                        recipientType: 'client',
                                        title: `Réponse à votre réclamation : ${c.subject}`,
                                        message: ''
                                      });
                                      setShowNotifyModal(true);
                                    }}
                                    style={{ background:'#f0fdf4', color:'#16a34a', border:'none', padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}
                                  >
                                    <Send size={14} /> Contacter
                                  </button>
                                </div>
                              </TD>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {!filter(complaints,['user_name','subject','description']).length && <p style={{ textAlign:'center', color:C.muted, padding:30 }}>Aucune réclamation</p>}
                    </div>
                  )}
                  </div>

                  {selectedComplaintOrder && (
                    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                      style={{ background:'#fff', borderRadius:16, padding:24, boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                        <h3 style={{ margin:0, fontSize:18, fontWeight:800, color:C.text }}>Détails de la commande #{selectedComplaintOrder.id}</h3>
                        <button onClick={() => setSelectedComplaintOrder(null)} style={{ background:'#f5f5f5', border:'none', padding:'8px 12px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700 }}>
                          <X size={14} />
                        </button>
                      </div>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px, 1fr))', gap:16, marginBottom:20 }}>
                        <div style={{ background:'#f9f9f9', borderRadius:12, padding:16 }}>
                          <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:C.muted }}>Restaurant</p>
                          <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.text }}>{selectedComplaintOrder.restaurant_name}</p>
                        </div>
                        <div style={{ background:'#f9f9f9', borderRadius:12, padding:16 }}>
                          <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:C.muted }}>Client</p>
                          <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.text }}>{selectedComplaintOrder.user_name}</p>
                          <p style={{ margin:'4px 0 0', fontSize:12, color:C.sub }}>{selectedComplaintOrder.user_phone}</p>
                        </div>
                        <div style={{ background:'#f9f9f9', borderRadius:12, padding:16 }}>
                          <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:C.muted }}>Total</p>
                          <p style={{ margin:0, fontSize:16, fontWeight:800, color:C.red }}>{fmt(selectedComplaintOrder.total_price)} MAD</p>
                        </div>
                        <div style={{ background:'#f9f9f9', borderRadius:12, padding:16 }}>
                          <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:C.muted }}>Statut</p>
                          <Badge label={STATUS[selectedComplaintOrder.status]?.label || selectedComplaintOrder.status} color={STATUS[selectedComplaintOrder.status]?.color} bg={STATUS[selectedComplaintOrder.status]?.bg} />
                        </div>
                        {selectedComplaintOrder.delivery_name && (
                          <div style={{ background:'#f9f9f9', borderRadius:12, padding:16 }}>
                            <p style={{ margin:'0 0 8px', fontSize:12, fontWeight:700, color:C.muted }}>Livreur</p>
                            <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.text }}>{selectedComplaintOrder.delivery_name}</p>
                            <p style={{ margin:'4px 0 0', fontSize:12, color:C.sub }}>{selectedComplaintOrder.delivery_phone}</p>
                          </div>
                        )}
                      </div>
                      {selectedComplaintOrder.items && selectedComplaintOrder.items.length > 0 && (
                        <div>
                          <p style={{ margin:'0 0 12px', fontSize:14, fontWeight:800, color:C.text }}>Articles commandés</p>
                          <div style={{ display:'grid', gap:8 }}>
                            {selectedComplaintOrder.items.map((item, idx) => (
                              <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px', background:'#f9f9f9', borderRadius:8 }}>
                                <div>
                                  <p style={{ margin:0, fontSize:14, fontWeight:700, color:C.text }}>{item.quantity}× {item.item_name}</p>
                                  {item.options && <p style={{ margin:'4px 0 0', fontSize:12, color:C.sub }}>{item.options}</p>}
                                </div>
                                <p style={{ margin:0, fontSize:14, fontWeight:800, color:C.red }}>{fmt(item.price)} MAD</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              )}

              {/* ═══════════ AI & FORECAST ═══════════ */}
              {tab === 'ai' && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <SectionHeading title="IA & Prévisions" />

                  {/* Top action bar */}
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <Btn onClick={fetchInsights} variant="primary" style={{ gap:8 }}>
                      <Sparkles size={14}/> Actualiser les insights
                    </Btn>
                    <span style={{ fontSize:12, color:C.muted }}>
                      {aiInsights?.generated_at ? `Généré le ${new Date(aiInsights.generated_at).toLocaleString('fr-FR')}` : ''}
                    </span>
                  </div>

                  {/* Forecast cards */}
                  {insightsLoading ? <Spin /> : aiInsights && !aiInsights.error && aiInsights.forecast && (
                    <>
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                        {[
                          { label:'Commandes prévues', value: aiInsights.forecast.predicted_orders ?? '—', color:'#3B82F6', icon:BarChart2, sub:'7 prochains jours' },
                          { label:'Tendance', value: aiInsights.forecast.trend ?? '—', color: aiInsights.forecast.trend === 'up' ? '#22C55E' : '#EF4444', icon:TrendingUp, sub:'Direction actuelle' },
                          { label:'Jour de pointe', value: aiInsights.forecast.peak_day ?? '—', color:'#F59E0B', icon:Zap, sub:'Pic prévu' },
                          { label:'Service IA', value: aiInsights.ai_available ? 'Actif' : 'Limité', color: aiInsights.ai_available ? '#22C55E' : '#F97316', icon:Bot, sub: aiInsights.ai_available ? 'NVIDIA Llama' : 'Clé non configurée' },
                        ].map(({ label, value, color, icon:Icon, sub }) => (
                          <div key={label} style={{ background:'#fff', borderRadius:16, padding:'20px 22px', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                            <div style={{ width:40,height:40,borderRadius:11,background:color+'18',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12 }}>
                              <Icon size={19} color={color} strokeWidth={2.2}/>
                            </div>
                            <p style={{ margin:0, fontSize:11, color:C.muted, fontWeight:600 }}>{label}</p>
                            <p style={{ margin:'4px 0 2px', fontSize:22, fontWeight:900, color:C.text, lineHeight:1.1 }}>{String(value)}</p>
                            <p style={{ margin:0, fontSize:11, color:C.muted }}>{sub}</p>
                          </div>
                        ))}
                      </div>

                      {/* Weekly forecast bar */}
                      {aiInsights.forecast.weekly_forecast?.length > 0 && (
                        <div style={{ background:'#fff', borderRadius:16, padding:'22px 24px', boxShadow:'0 2px 16px rgba(0,0,0,0.05)' }}>
                          <p style={{ margin:'0 0 16px', fontWeight:800, fontSize:14, color:C.text }}>Prévision journalière (7 jours)</p>
                          <Bar
                            data={{
                              labels: aiInsights.forecast.weekly_forecast.map(d => d.date || d.day || `J${d.index ?? ''}`),
                              datasets:[{
                                label:'Commandes prévues',
                                data: aiInsights.forecast.weekly_forecast.map(d => d.predicted ?? d.orders ?? d.value ?? 0),
                                backgroundColor: C.red + '99',
                                borderColor: C.red,
                                borderWidth:2, borderRadius:8, borderSkipped:false,
                              }]
                            }}
                            options={{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ display:false }, ticks:{ font:{ size:11, family:'Outfit' }, color:C.muted } }, y:{ grid:{ color:'#F4F6FB' }, ticks:{ font:{ size:11, family:'Outfit' }, color:C.muted }, beginAtZero:true } } }}
                          />
                        </div>
                      )}

                      {/* AI Recommendations */}
                      {aiInsights.recommendations && (
                        <div style={{ background:'linear-gradient(135deg,#1C1C2E,#2D1B4E)', borderRadius:16, padding:'24px 28px', boxShadow:'0 8px 32px rgba(28,28,46,0.25)' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
                            <div style={{ width:38,height:38,borderRadius:11,background:'#fff2',display:'flex',alignItems:'center',justifyContent:'center' }}>
                              <BrainCircuit size={20} color="#A78BFA"/>
                            </div>
                            <div>
                              <p style={{ margin:0, fontWeight:800, fontSize:15, color:'#fff' }}>Recommandations IA — Llama</p>
                              <p style={{ margin:0, fontSize:11, color:'#A78BFA' }}>Analyse des prévisions SpeedMeal</p>
                            </div>
                          </div>
                          <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:12, padding:'16px 20px' }}>
                            <p style={{ margin:0, fontSize:13.5, color:'#E2E8F0', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{aiInsights.recommendations}</p>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {aiInsights?.error && (
                    <div style={{ background:'#FEF2F2', borderRadius:14, padding:'18px 22px', color:'#DC2626', fontWeight:600, fontSize:13, display:'flex', alignItems:'center', gap:8 }}>
                      <AlertCircle size={16}/> {aiInsights.error}
                    </div>
                  )}

                  {/* ── Chatbot ── */}
                  <SectionHeading title="Assistant IA" />
                  <div style={{ background:'#fff', borderRadius:16, overflow:'hidden', boxShadow:'0 2px 16px rgba(0,0,0,0.05)', display:'flex', flexDirection:'column' }}>

                    {/* Messages */}
                    <div style={{ overflowY:'auto', padding:'20px 24px', display:'flex', flexDirection:'column', gap:12, maxHeight:440, minHeight:200 }}>
                      {aiChat.length === 0 && (
                        <div style={{ textAlign:'center', padding:'40px 0', color:C.muted }}>
                          <Bot size={40} color={C.red} style={{ opacity:.4, marginBottom:10 }}/>
                          <p style={{ margin:0, fontSize:14, fontWeight:600 }}>Posez une question à l'assistant SpeedMeal</p>
                          <p style={{ margin:'6px 0 0', fontSize:12 }}>Commandes, prévisions, conseils business…</p>
                          <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginTop:16 }}>
                            {['Analyse mes ventes de ce mois','Quand est le prochain pic de commandes ?','Comment réduire le gaspillage alimentaire ?'].map(s => (
                              <button key={s} onClick={()=>setAiInput(s)} style={{ padding:'7px 14px', borderRadius:20, border:`1.5px solid ${C.border}`, background:C.bg, fontSize:11, fontWeight:600, cursor:'pointer', color:C.sub, fontFamily:'Outfit,sans-serif' }}>{s}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiChat.map((m, i) => (
                        <div key={i} style={{ display:'flex', gap:10, justifyContent: m.role==='user' ? 'flex-end' : 'flex-start' }}>
                          {m.role === 'assistant' && (
                            <div style={{ width:32,height:32,borderRadius:10,background:'#1C1C2E',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2 }}>
                              <Bot size={16} color="#A78BFA"/>
                            </div>
                          )}
                          <div style={{
                            maxWidth:'72%', padding:'11px 16px',
                            borderRadius: m.role==='user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                            background: m.role==='user' ? C.red : '#F8F9FE',
                            color: m.role==='user' ? '#fff' : C.text,
                            fontSize:13.5, lineHeight:1.7, whiteSpace:'pre-wrap',
                            boxShadow: m.role==='user' ? `0 4px 12px ${C.red}30` : '0 2px 8px rgba(0,0,0,0.05)',
                          }}>
                            {m.content}
                          </div>
                          {m.role === 'user' && (
                            <div style={{ width:32,height:32,borderRadius:10,background:C.red+'18',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2,fontSize:13,fontWeight:800,color:C.red }}>
                              {(user.name||'A')[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                      ))}
                      {aiLoading && (
                        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                          <div style={{ width:32,height:32,borderRadius:10,background:'#1C1C2E',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                            <Bot size={16} color="#A78BFA"/>
                          </div>
                          <div style={{ padding:'11px 16px', borderRadius:'14px 14px 14px 4px', background:'#F8F9FE', display:'flex', gap:5, alignItems:'center' }}>
                            {[0,1,2].map(i=><span key={i} style={{ width:7,height:7,borderRadius:'50%',background:C.red,opacity:.7,animation:`bounce .9s ${i*0.2}s infinite` }}/>)}
                            <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}`}</style>
                          </div>
                        </div>
                      )}
                      <div ref={chatBottomRef}/>
                    </div>

                    {/* Input */}
                    <div style={{ borderTop:`1px solid ${C.border}`, padding:'14px 20px', display:'flex', gap:10 }}>
                      <input
                        value={aiInput}
                        onChange={e=>setAiInput(e.target.value)}
                        onKeyDown={e=>{ if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendAiMessage(); } }}
                        placeholder="Écrivez votre message… (Entrée pour envoyer)"
                        style={{ flex:1, padding:'11px 16px', borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:'Outfit,sans-serif', color:C.text, outline:'none', transition:'border .15s', background:'#FAFBFD' }}
                        onFocus={e=>e.target.style.borderColor=C.red}
                        onBlur={e=>e.target.style.borderColor=C.border}
                      />
                      <button
                        onClick={sendAiMessage}
                        disabled={!aiInput.trim() || aiLoading}
                        style={{ width:44,height:44,borderRadius:12,background: (aiInput.trim()&&!aiLoading) ? C.red : C.border,border:'none',cursor:(aiInput.trim()&&!aiLoading)?'pointer':'default',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,transition:'background .2s',boxShadow:(aiInput.trim()&&!aiLoading)?`0 4px 14px ${C.red}40`:'none' }}
                      >
                        <Send size={16} color="#fff"/>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ═══════════ DEMANDES ═══════════ */}
              {tab === 'requests' && (
                <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
                  <SectionHeading title="Demandes en attente" />

                  {/* Stats row */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
                    {[
                      { label:'Total demandes',     value: pendingRestaurants.length + pendingDelivery.length, color:'#8B5CF6', bg:'#F5F3FF', icon:ClipboardList },
                      { label:'Restaurants',         value: pendingRestaurants.length, color:'#F97316', bg:'#FFF7ED', icon:Store },
                      { label:'Livreurs',            value: pendingDelivery.length,    color:'#3B82F6', bg:'#EFF6FF', icon:Truck },
                      { label:'À traiter aujourd\'hui', value: pendingRestaurants.length + pendingDelivery.length, color:C.red, bg:'#FFF1EE', icon:AlertCircle },
                    ].map(({ label, value, color, bg, icon:Icon }) => (
                      <div key={label} style={{ background:'#fff', borderRadius:16, padding:'18px 20px', boxShadow:'0 2px 12px rgba(0,0,0,0.05)', display:'flex', alignItems:'center', gap:14 }}>
                        <div style={{ width:44, height:44, borderRadius:12, background:bg, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                          <Icon size={20} color={color} />
                        </div>
                        <div>
                          <p style={{ margin:0, fontSize:11, color:C.muted, fontWeight:600 }}>{label}</p>
                          <p style={{ margin:'2px 0 0', fontSize:24, fontWeight:900, color:C.text, lineHeight:1 }}>{value}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sub-tabs */}
                  <div style={{ display:'flex', gap:8 }}>
                    {[
                      { id:'restaurants', label:'Restaurants', icon: Store, count: pendingRestaurants.length },
                      { id:'delivery',    label:'Livreurs',    icon: Bike,  count: pendingDelivery.length },
                    ].map(t => (
                      <button key={t.id} onClick={() => setRequestsTab(t.id)} style={{
                        padding:'10px 22px', borderRadius:11, border: requestsTab === t.id ? 'none' : `1.5px solid ${C.border}`, cursor:'pointer',
                        fontWeight:700, fontSize:13, fontFamily:'Outfit,sans-serif',
                        background: requestsTab === t.id ? C.red : '#fff',
                        color: requestsTab === t.id ? '#fff' : C.sub,
                        display:'flex', alignItems:'center', gap:8, transition:'all .18s',
                        boxShadow: requestsTab === t.id ? `0 4px 14px ${C.red}40` : 'none',
                      }}>
                        <t.icon size={14}/>
                        {t.label}
                        {t.count > 0 && (
                          <span style={{ background: requestsTab===t.id ? 'rgba(255,255,255,0.25)' : C.red, color:'#fff', padding:'1px 8px', borderRadius:999, fontSize:11, fontWeight:800 }}>
                            {t.count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* ── RESTAURANT REQUESTS ── */}
                  {requestsTab === 'restaurants' && (
                    loading ? <Spin /> :
                    pendingRestaurants.length === 0 ? (
                      <div style={{ background:'#fff', borderRadius:16, padding:'60px 0', textAlign:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.05)', border:`1.5px dashed ${C.border}` }}>
                        <Store size={48} color={C.muted} style={{ marginBottom:12, opacity:.35 }} />
                        <p style={{ color:C.text, fontSize:15, fontWeight:700, margin:'0 0 4px' }}>Aucune demande restaurant</p>
                        <p style={{ color:C.muted, fontSize:13 }}>Toutes les demandes ont été traitées</p>
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
                        {pendingRestaurants.map(r => (
                          <motion.div key={r.user_id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:.2 }}
                            onClick={() => setDetailsModal({ type: 'pending_restaurant', data: r })}
                            style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 3px 18px rgba(0,0,0,0.07)', border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', cursor: 'pointer' }}>
                            {/* Restaurant image banner */}
                            <div style={{ position:'relative', height:140, background:'linear-gradient(135deg,#FFF7ED,#FEE2D5)', overflow:'hidden', flexShrink:0 }}>
                              {r.image_url
                                ? <img src={r.image_url} alt={r.restaurant_name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                                : (
                                  <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6 }}>
                                    <Store size={38} color="#F97316" style={{ opacity:.4 }} />
                                    <span style={{ fontSize:11, color:'#F97316', fontWeight:600, opacity:.6 }}>Pas d'image</span>
                                  </div>
                                )}
                              <div style={{ position:'absolute', top:10, left:10 }}>
                                <span style={{ background:'#F97316', color:'#fff', padding:'4px 12px', borderRadius:999, fontSize:11, fontWeight:800, boxShadow:'0 2px 8px rgba(249,115,22,0.4)', display:'inline-flex', alignItems:'center', gap:4 }}>
                                  <Clock size={10}/> En attente
                                </span>
                              </div>
                              {r.cuisine && (
                                <div style={{ position:'absolute', top:10, right:10 }}>
                                  <span style={{ background:'rgba(0,0,0,0.55)', color:'#fff', padding:'4px 10px', borderRadius:999, fontSize:11, fontWeight:700, backdropFilter:'blur(4px)' }}>
                                    {r.cuisine}
                                  </span>
                                </div>
                              )}
                            </div>
                            {/* Card body */}
                            <div style={{ padding:'16px 18px', flex:1, display:'flex', flexDirection:'column', gap:10 }}>
                              <div>
                                <p style={{ margin:'0 0 2px', fontWeight:900, fontSize:16, color:C.text }}>{r.restaurant_name || 'Restaurant sans nom'}</p>
                                <p style={{ margin:0, fontSize:12, color:C.muted, display:'flex', alignItems:'center', gap:4 }}><MapPin size={11}/>{r.city || '—'}</p>
                              </div>
                              {r.description && (
                                <p style={{ margin:0, fontSize:12, color:C.sub, lineHeight:1.5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden', background:'#FAFBFD', borderRadius:8, padding:'8px 10px' }}>
                                  "{r.description}"
                                </p>
                              )}
                              {/* Owner info */}
                              <div style={{ background:C.bg, borderRadius:10, padding:'10px 12px', display:'flex', flexDirection:'column', gap:5 }}>
                                <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Responsable</p>
                                {[
                                  { icon:<Users size={12}/>,   val: r.name },
                                  { icon:<Mail size={12}/>,    val: r.email },
                                  { icon:<Phone size={12}/>,   val: r.phone || '—' },
                                  { icon:<Clock size={12}/>,   val: `Inscrit le ${new Date(r.created_at).toLocaleDateString('fr-FR')}` },
                                ].map(({ icon, val }, i) => (
                                  <div key={i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:C.sub }}>
                                    <span style={{ color:C.muted, flexShrink:0 }}>{icon}</span>
                                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Action buttons */}
                              <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:4 }}>
                                <button onClick={(e) => { e.stopPropagation(); approveRequest('restaurants', r.user_id); }}
                                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#16A34A', color:'#fff', border:'none', padding:'10px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', boxShadow:'0 3px 10px rgba(22,163,74,0.3)', transition:'all .18s' }}
                                  onMouseEnter={e=>{e.currentTarget.style.background='#15803D';e.currentTarget.style.transform='translateY(-1px)';}}
                                  onMouseLeave={e=>{e.currentTarget.style.background='#16A34A';e.currentTarget.style.transform='translateY(0)';}}>
                                  <CheckCircle size={14}/> Approuver
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setRejectModal({ type:'restaurants', userId:r.user_id, name: r.restaurant_name || r.name }); }}
                                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', padding:'10px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', transition:'all .18s' }}
                                  onMouseEnter={e=>e.currentTarget.style.background='#FEE2E2'}
                                  onMouseLeave={e=>e.currentTarget.style.background='#FEF2F2'}>
                                  <XCircle size={14}/> Refuser
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  )}

                  {/* ── DELIVERY REQUESTS ── */}
                  {requestsTab === 'delivery' && (
                    loading ? <Spin /> :
                    pendingDelivery.length === 0 ? (
                      <div style={{ background:'#fff', borderRadius:16, padding:'60px 0', textAlign:'center', boxShadow:'0 2px 16px rgba(0,0,0,0.05)', border:`1.5px dashed ${C.border}` }}>
                        <Bike size={48} color={C.muted} style={{ marginBottom:12, opacity:.35 }} />
                        <p style={{ color:C.text, fontSize:15, fontWeight:700, margin:'0 0 4px' }}>Aucune demande livreur</p>
                        <p style={{ color:C.muted, fontSize:13 }}>Toutes les demandes ont été traitées</p>
                      </div>
                    ) : (
                      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
                        {pendingDelivery.map(d => (
                          <motion.div key={d.user_id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:.2 }}
                            onClick={() => setDetailsModal({ type: 'pending_delivery', data: d })}
                            style={{ background:'#fff', borderRadius:18, overflow:'hidden', boxShadow:'0 3px 18px rgba(0,0,0,0.07)', border:`1px solid ${C.border}`, display:'flex', flexDirection:'column', cursor: 'pointer' }}>
                            {/* Header banner */}
                            <div style={{ background:'linear-gradient(135deg,#EFF6FF,#DBEAFE)', padding:'20px 20px 16px', display:'flex', alignItems:'center', gap:14 }}>
                              {d.face_photo ? (
                                <img src={d.face_photo} alt={d.name} style={{ width:56, height:56, borderRadius:16, objectFit:'cover', boxShadow:'0 4px 12px rgba(0,0,0,0.15)' }} />
                              ) : (
                                <div style={{ width:56, height:56, borderRadius:16, background:'linear-gradient(135deg,#3B82F6,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:22, fontWeight:900, color:'#fff', boxShadow:'0 4px 14px rgba(59,130,246,0.4)' }}>
                                  {(d.name||'?')[0].toUpperCase()}
                                </div>
                              )}
                              <div style={{ flex:1, minWidth:0 }}>
                                <p style={{ margin:'0 0 2px', fontWeight:900, fontSize:16, color:'#1E3A8A' }}>{d.name}</p>
                                <p style={{ margin:0, fontSize:12, color:'#3B82F6', display:'flex', alignItems:'center', gap:4 }}><MapPin size={11}/>{d.address || '—'}</p>
                              </div>
                              <span style={{ background:'#F97316', color:'#fff', padding:'4px 10px', borderRadius:999, fontSize:11, fontWeight:800, flexShrink:0, display:'inline-flex', alignItems:'center', gap:4 }}>
                                <Clock size={10}/> En attente
                              </span>
                            </div>
                            {/* Card body */}
                            <div style={{ padding:'16px 18px', flex:1, display:'flex', flexDirection:'column', gap:12 }}>
                              {/* Contact info */}
                              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                                {[
                                  { icon:<Mail size={12}/>,   val: d.email },
                                  { icon:<Phone size={12}/>,  val: d.phone || '—' },
                                  { icon:<Clock size={12}/>,  val: `Inscrit le ${new Date(d.created_at).toLocaleDateString('fr-FR')}` },
                                ].map(({ icon, val }, i) => (
                                  <div key={i} style={{ display:'flex', alignItems:'center', gap:7, fontSize:12, color:C.sub }}>
                                    <span style={{ color:C.muted, flexShrink:0 }}>{icon}</span>
                                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val}</span>
                                  </div>
                                ))}
                              </div>
                              {/* Chips */}
                              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                                {d.vehicle_type && (
                                  <span style={{ background:'#EFF6FF', color:'#3B82F6', border:'1px solid #BFDBFE', padding:'4px 11px', borderRadius:999, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
                                    <Bike size={11}/> {d.vehicle_type.charAt(0).toUpperCase()+d.vehicle_type.slice(1)}
                                  </span>
                                )}
                                <span style={{ background: d.has_license==='Oui'?'#F0FDF4':'#FEF2F2', color: d.has_license==='Oui'?'#16A34A':'#DC2626', border:`1px solid ${d.has_license==='Oui'?'#BBF7D0':'#FECACA'}`, padding:'4px 11px', borderRadius:999, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
                                  {d.has_license==='Oui' ? <CheckCircle size={10}/> : <XCircle size={10}/>} Permis
                                </span>
                                <span style={{ background: d.has_insurance==='Oui'?'#F0FDF4':'#FEF2F2', color: d.has_insurance==='Oui'?'#16A34A':'#DC2626', border:`1px solid ${d.has_insurance==='Oui'?'#BBF7D0':'#FECACA'}`, padding:'4px 11px', borderRadius:999, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4 }}>
                                  {d.has_insurance==='Oui' ? <CheckCircle size={10}/> : <XCircle size={10}/>} Assurance
                                </span>
                              </div>
                              {/* Action buttons */}
                              <div style={{ display:'flex', gap:8, marginTop:'auto', paddingTop:4 }}>
                                <button onClick={(e) => { e.stopPropagation(); approveRequest('delivery', d.user_id); }}
                                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#16A34A', color:'#fff', border:'none', padding:'10px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', boxShadow:'0 3px 10px rgba(22,163,74,0.3)', transition:'all .18s' }}
                                  onMouseEnter={e=>{e.currentTarget.style.background='#15803D';e.currentTarget.style.transform='translateY(-1px)';}}
                                  onMouseLeave={e=>{e.currentTarget.style.background='#16A34A';e.currentTarget.style.transform='translateY(0)';}}>
                                  <CheckCircle size={14}/> Approuver
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setRejectModal({ type:'delivery', userId:d.user_id, name: d.name }); }}
                                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, background:'#FEF2F2', color:'#DC2626', border:'1.5px solid #FECACA', padding:'10px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', transition:'all .18s' }}
                                  onMouseEnter={e=>e.currentTarget.style.background='#FEE2E2'}
                                  onMouseLeave={e=>e.currentTarget.style.background='#FEF2F2'}>
                                  <XCircle size={14}/> Refuser
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>


    {/* ── Details Modal — popup for restaurant/delivery details ── */}
    {detailsModal && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
        onClick={() => setDetailsModal(null)}>
        <motion.div initial={{ scale:0.92, opacity:0, y:20 }} animate={{ scale:1, opacity:1, y:0 }}
          onClick={e => e.stopPropagation()}
          style={{ background:'#fff', borderRadius:24, width:'100%', maxWidth:540, boxShadow:'0 30px 80px rgba(0,0,0,0.25)', border:'1px solid rgba(0,0,0,0.05)', overflow:'hidden', fontFamily:'Outfit,sans-serif', maxHeight:'90vh', overflowY:'auto' }}>
          
          {/* Banner / Avatar Header */}
          {['restaurant', 'pending_restaurant'].includes(detailsModal.type) ? (
            <div style={{ height:180, position:'relative', background:'linear-gradient(135deg,#A51C1C,#7a1010)' }}>
              {detailsModal.data.image_url ? (
                <img src={detailsModal.data.image_url} alt={detailsModal.data.restaurant_name || detailsModal.data.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              ) : (
                <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Store size={64} color="rgba(255,255,255,0.3)" />
                </div>
              )}
              <button onClick={() => setDetailsModal(null)} style={{ position:'absolute', top:20, right:20, background:'rgba(0,0,0,0.4)', color:'#fff', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', backdropFilter:'blur(4px)' }}>
                <X size={18} />
              </button>
            </div>
          ) : (
            <div style={{ padding:'32px 32px 20px', background:'linear-gradient(135deg,#1C1C2E,#2D1B4E)', color:'#fff', position:'relative', display:'flex', alignItems:'center', gap:20 }}>
              <button onClick={() => setDetailsModal(null)} style={{ position:'absolute', top:20, right:20, background:'rgba(255,255,255,0.1)', color:'#fff', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                <X size={18} />
              </button>
              
              {/* Driver Photo */}
              {detailsModal.data.face_photo ? (
                <img src={detailsModal.data.face_photo} alt={detailsModal.data.name} style={{ width:80, height:80, borderRadius:20, objectFit:'cover', border:'3px solid #fff', boxShadow:'0 8px 20px rgba(0,0,0,0.2)' }} />
              ) : (
                <div style={{ width:80, height:80, borderRadius:20, background:'linear-gradient(135deg,#3B82F6,#6366F1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, fontWeight:900, color:'#fff', border:'3px solid #fff', boxShadow:'0 8px 20px rgba(0,0,0,0.2)' }}>
                  {(detailsModal.data.name||'?')[0].toUpperCase()}
                </div>
              )}
              
              <div>
                <span style={{ background:'#3B82F6', color:'#fff', padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:800, textTransform:'uppercase', letterSpacing:'0.5px', display:'inline-block', marginBottom:6 }}>
                  Livreur
                </span>
                <h2 style={{ margin:0, fontSize:22, fontWeight:950 }}>{detailsModal.data.name}</h2>
                <p style={{ margin:'4px 0 0', opacity:0.7, fontSize:13 }}>{detailsModal.data.email}</p>
              </div>
            </div>
          )}

          {/* Details Body */}
          <div style={{ padding:32 }}>
            {['restaurant', 'pending_restaurant'].includes(detailsModal.type) ? (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:20 }}>
                  <div>
                    <h2 style={{ margin:0, fontSize:24, fontWeight:900, color:C.text }}>{detailsModal.data.restaurant_name || detailsModal.data.name}</h2>
                    <p style={{ margin:'4px 0 0', color:C.sub, fontSize:14, display:'flex', alignItems:'center', gap:4 }}><MapPin size={14}/> {detailsModal.data.city || '—'}</p>
                  </div>
                  <Badge 
                    label={detailsModal.type === 'pending_restaurant' ? 'En attente' : detailsModal.data.isOpen ? 'Ouvert' : 'Fermé'} 
                    color={detailsModal.type === 'pending_restaurant' ? '#f97316' : detailsModal.data.isOpen ? '#16A34A' : '#DC2626'} 
                    bg={detailsModal.type === 'pending_restaurant' ? '#fff7ed' : detailsModal.data.isOpen ? '#F0FDF4' : '#FEF2F2'} 
                  />
                </div>

                {detailsModal.data.cuisine && (
                  <div style={{ marginBottom:20 }}>
                    <span style={{ background:'#FAFBFD', border:`1.5px solid ${C.border}`, padding:'6px 14px', borderRadius:10, fontSize:12, fontWeight:700, color:C.text }}>
                      Spécialité : {detailsModal.data.cuisine}
                    </span>
                  </div>
                )}

                {detailsModal.data.description && (
                  <div style={{ background:'#f8fafc', borderRadius:14, padding:'16px 20px', marginBottom:24, border:`1px solid ${C.border}` }}>
                    <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>Description / Message de motivation</p>
                    <p style={{ margin:0, fontSize:13.5, color:C.text, lineHeight:1.6, fontStyle:'italic' }}>"{detailsModal.data.description}"</p>
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <h4 style={{ margin:0, fontSize:12, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:`1.5px solid ${C.border}`, paddingBottom:6 }}>Informations Responsable</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <span style={{ fontSize:11, color:C.muted, display:'block' }}>Nom du responsable</span>
                      <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{detailsModal.data.owner_name || detailsModal.data.name}</span>
                    </div>
                    <div>
                      <span style={{ fontSize:11, color:C.muted, display:'block' }}>Ville</span>
                      <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{detailsModal.data.city || '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize:11, color:C.muted, display:'block' }}>Adresse précise</span>
                      <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{detailsModal.data.address || '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize:11, color:C.muted, display:'block' }}>Date d'inscription</span>
                      <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{new Date(detailsModal.data.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div>
                      <span style={{ fontSize:11, color:C.muted, display:'block' }}>Email</span>
                      <a href={`mailto:${detailsModal.data.email}`} style={{ fontSize:14, fontWeight:700, color:C.red, textDecoration:'none' }}>{detailsModal.data.email}</a>
                    </div>
                    <div>
                      <span style={{ fontSize:11, color:C.muted, display:'block' }}>Téléphone</span>
                      <a href={`tel:${detailsModal.data.phone}`} style={{ fontSize:14, fontWeight:700, color:C.text, textDecoration:'none' }}>{detailsModal.data.phone || '—'}</a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                  <div>
                    <p style={{ margin:0, fontSize:12, color:C.muted }}>Ville d'opération</p>
                    <p style={{ margin:'2px 0 0', fontSize:16, fontWeight:850, color:C.text, display:'flex', alignItems:'center', gap:4 }}><MapPin size={14} color={C.red}/> {detailsModal.data.address || '—'}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
                    <Badge 
                      label={detailsModal.type === 'pending_delivery' ? 'En attente' : detailsModal.data.isActive ? 'Actif' : 'Inactif'} 
                      color={detailsModal.type === 'pending_delivery' ? '#f97316' : detailsModal.data.isActive ? '#16A34A' : '#DC2626'} 
                      bg={detailsModal.type === 'pending_delivery' ? '#fff7ed' : detailsModal.data.isActive ? '#F0FDF4' : '#FEF2F2'} 
                    />
                    {detailsModal.type === 'delivery' && (
                      <span style={{
                        background: detailsModal.data.is_available ? '#f0fdf4' : '#f1f5f9',
                        color: detailsModal.data.is_available ? '#15803d' : '#475569',
                        border: `1px solid ${detailsModal.data.is_available ? '#bbf7d0' : '#cbd5e1'}`,
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 800,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: detailsModal.data.is_available ? '#22c55e' : '#64748b' }} />
                        {detailsModal.data.is_available ? 'Disponible' : 'Indisponible'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Vehicule & Docs */}
                <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:24 }}>
                  {detailsModal.data.vehicle_type && (
                    <div style={{ background:'#EFF6FF', color:'#3B82F6', border:'1px solid #BFDBFE', padding:'6px 14px', borderRadius:10, fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:6 }}>
                      <Bike size={14}/> Véhicule : {detailsModal.data.vehicle_type.toUpperCase()}
                    </div>
                  )}
                  <div style={{ background: detailsModal.data.has_license==='Oui'?'#F0FDF4':'#FEF2F2', color: detailsModal.data.has_license==='Oui'?'#16A34A':'#DC2626', border:`1px solid ${detailsModal.data.has_license==='Oui'?'#BBF7D0':'#FECACA'}`, padding:'6px 14px', borderRadius:10, fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:6 }}>
                    {detailsModal.data.has_license==='Oui' ? <CheckCircle size={14}/> : <XCircle size={14}/>} Permis de conduire
                  </div>
                  <div style={{ background: detailsModal.data.has_insurance==='Oui'?'#F0FDF4':'#FEF2F2', color: detailsModal.data.has_insurance==='Oui'?'#16A34A':'#DC2626', border:`1px solid ${detailsModal.data.has_insurance==='Oui'?'#BBF7D0':'#FECACA'}`, padding:'6px 14px', borderRadius:10, fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:6 }}>
                    {detailsModal.data.has_insurance==='Oui' ? <CheckCircle size={14}/> : <XCircle size={14}/>} Assurance véhicule
                  </div>
                </div>

                {/* Performance Stats for active drivers */}
                {detailsModal.type === 'delivery' && (
                  <div style={{ background:'#FAFBFD', border:`1.5px solid ${C.border}`, borderRadius:16, padding:20, marginBottom:24 }}>
                    <p style={{ margin:0, fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:12 }}>Statistiques de Livraison</p>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12, textAlign:'center' }}>
                      <div style={{ background:'#fff', padding:'10px 14px', borderRadius:12, border:`1px solid ${C.border}` }}>
                        <span style={{ fontSize:10, color:C.muted, display:'block' }}>Livrées</span>
                        <span style={{ fontSize:18, fontWeight:900, color:'#3B82F6' }}>{detailsModal.data.delivered_count || 0}</span>
                      </div>
                      <div style={{ background:'#fff', padding:'10px 14px', borderRadius:12, border:`1px solid ${C.border}` }}>
                        <span style={{ fontSize:10, color:C.muted, display:'block' }}>Commandes</span>
                        <span style={{ fontSize:18, fontWeight:900, color:'#F97316' }}>{detailsModal.data.total_deliveries || 0}</span>
                      </div>
                      <div style={{ background:'#fff', padding:'10px 14px', borderRadius:12, border:`1px solid ${C.border}` }}>
                        <span style={{ fontSize:10, color:C.muted, display:'block' }}>Gains</span>
                        <span style={{ fontSize:16, fontWeight:900, color:C.red }}>{fmt(detailsModal.data.total_revenue || 0)} MAD</span>
                      </div>
                    </div>
                  </div>
                )}


                {/* ── Face Photo Section ── */}
                {detailsModal.data.face_photo ? (
                  <div style={{ marginBottom:24 }}>
                    <h4 style={{ margin:'0 0 12px', fontSize:12, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:`1.5px solid ${C.border}`, paddingBottom:6, display:'flex', alignItems:'center', gap:6 }}>
                      📸 Photo d'identité
                    </h4>
                    <div style={{ display:'flex', gap:16, alignItems:'center' }}>
                      <div style={{ position:'relative', flexShrink:0 }}>
                        <img
                          src={detailsModal.data.face_photo}
                          alt={`Photo de ${detailsModal.data.name}`}
                          style={{ width:120, height:140, objectFit:'cover', borderRadius:14, border:`3px solid ${C.border}`, boxShadow:'0 8px 24px rgba(0,0,0,0.12)' }}
                        />
                        <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', background:'#16A34A', color:'#fff', padding:'3px 10px', borderRadius:999, fontSize:10, fontWeight:800, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4, boxShadow:'0 2px 8px rgba(22,163,74,0.4)' }}>
                          ✓ Photo soumise
                        </div>
                      </div>
                      <div>
                        <p style={{ margin:'0 0 6px', fontWeight:700, fontSize:13, color:C.text }}>Photo de visage</p>
                        <p style={{ margin:0, fontSize:12, color:C.sub, lineHeight:1.6 }}>Photo soumise par le livreur lors de son inscription. Utilisez cette photo pour vérifier l'identité du candidat avant d'approuver son dossier.</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom:24, background:'#FAFBFD', borderRadius:14, padding:'16px 18px', border:`1.5px dashed ${C.border}`, display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:52, height:52, borderRadius:12, background:'#F4F6FB', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <span style={{ fontSize:24 }}>📷</span>
                    </div>
                    <div>
                      <p style={{ margin:'0 0 2px', fontWeight:700, fontSize:13, color:C.text }}>Aucune photo soumise</p>
                      <p style={{ margin:0, fontSize:12, color:C.muted }}>Le livreur n'a pas soumis de photo de visage lors de son inscription.</p>
                    </div>
                  </div>
                )}

                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <h4 style={{ margin:0, fontSize:12, fontWeight:800, color:C.muted, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:`1.5px solid ${C.border}`, paddingBottom:6 }}>Dossier Livreur</h4>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <span style={{ fontSize:11, color:C.muted, display:'block' }}>Téléphone</span>
                      <a href={`tel:${detailsModal.data.phone}`} style={{ fontSize:14, fontWeight:700, color:C.text, textDecoration:'none' }}>{detailsModal.data.phone || '—'}</a>
                    </div>
                    <div>
                      <span style={{ fontSize:11, color:C.muted, display:'block' }}>Date d'inscription</span>
                      <span style={{ fontSize:14, fontWeight:700, color:C.text }}>{new Date(detailsModal.data.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div style={{ gridColumn:'span 2' }}>
                      <span style={{ fontSize:11, color:C.muted, display:'block' }}>Email</span>
                      <a href={`mailto:${detailsModal.data.email}`} style={{ fontSize:14, fontWeight:700, color:C.red, textDecoration:'none' }}>{detailsModal.data.email}</a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action button at bottom */}
            <div style={{ marginTop:32, borderTop:`1px solid ${C.border}`, paddingTop:20, display:'flex', justifyContent:'flex-end' }}>
              <button onClick={() => setDetailsModal(null)} style={{ background:C.red, color:'#fff', border:'none', padding:'10px 24px', borderRadius:10, fontWeight:700, fontSize:13, cursor:'pointer', boxShadow:`0 4px 12px ${C.red}40` }}>
                Fermer
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}

    {/* ── Reject Modal — outside AnimatePresence ── */}
    {rejectModal && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:5000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
        onClick={() => { setRejectModal(null); setRejectReason(''); }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'28px 32px', maxWidth:440, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', fontFamily:'Outfit,sans-serif' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
            <div style={{ width:42, height:42, borderRadius:11, background:'#FEF2F2', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <XCircle size={20} color="#DC2626"/>
            </div>
            <div>
              <p style={{ margin:0, fontWeight:800, fontSize:16, color:C.text }}>Refuser la demande</p>
              <p style={{ margin:'2px 0 0', fontSize:12, color:C.muted }}>{rejectModal.name}</p>
            </div>
          </div>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Raison du refus (optionnel)..."
            rows={3}
            style={{ width:'100%', padding:'12px 14px', borderRadius:11, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:'Outfit,sans-serif', resize:'none', outline:'none', boxSizing:'border-box', color:C.text, transition:'border .15s' }}
            onFocus={e=>e.target.style.borderColor='#DC2626'} onBlur={e=>e.target.style.borderColor=C.border}
          />
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button onClick={() => { setRejectModal(null); setRejectReason(''); }}
              style={{ flex:1, padding:11, borderRadius:10, border:`1.5px solid ${C.border}`, background:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', color:C.sub }}>
              Annuler
            </button>
            <button onClick={rejectRequest}
              style={{ flex:1, padding:11, borderRadius:10, border:'none', background:'#DC2626', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', boxShadow:'0 4px 12px rgba(220,38,38,0.35)' }}>
              Confirmer le refus
            </button>
          </div>
        </div>
      </div>
    )}

    {/* ── Notify Modal ── */}
    {showNotifyModal && selectedNotifyComplaint && (
      <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:5000, display:'flex', alignItems:'center', justifyContext:'center', padding:20, justifyContent: 'center' }}
        onClick={() => { setShowNotifyModal(false); setSelectedNotifyComplaint(null); }}>
        <div style={{ background:'#fff', borderRadius:20, padding:'28px 32px', maxWidth:480, width:'100%', boxShadow:'0 24px 64px rgba(0,0,0,0.2)', fontFamily:'Outfit,sans-serif' }}
          onClick={e => e.stopPropagation()}>
          <div style={{ display:'flex', alignItems:'center', justifyContext:'space-between', justifyContent: 'space-between', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:40, height:40, borderRadius:11, background:'#F0FDF4', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Send size={18} color="#16A34A"/>
              </div>
              <div>
                <p style={{ margin:0, fontWeight:800, fontSize:16, color:C.text }}>Contacter les intervenants</p>
                <p style={{ margin:'2px 0 0', fontSize:12, color:C.muted }}>Sujet : {selectedNotifyComplaint.subject}</p>
              </div>
            </div>
            <button onClick={() => { setShowNotifyModal(false); setSelectedNotifyComplaint(null); }} style={{ background:'none', border:'none', cursor:'pointer', color:C.muted }}>
              <X size={18} />
            </button>
          </div>
          
          <form onSubmit={handleSendNotify} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Destinataire *</label>
              <div style={{ display:'flex', gap:8 }}>
                {[
                  { value: 'client', label: 'Client', enabled: true },
                  { value: 'restaurant', label: 'Restaurant', enabled: !!selectedNotifyComplaint.restaurant_owner_id },
                  { value: 'driver', label: 'Livreur', enabled: !!selectedNotifyComplaint.driver_id }
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={!opt.enabled}
                    onClick={() => setNotifyForm(prev => ({ ...prev, recipientType: opt.value }))}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 10,
                      border: notifyForm.recipientType === opt.value ? `2px solid ${C.red}` : `1px solid ${C.border}`,
                      background: notifyForm.recipientType === opt.value ? '#FFF1EE' : opt.enabled ? '#fff' : '#f5f5f5',
                      color: notifyForm.recipientType === opt.value ? C.red : opt.enabled ? C.text : '#ccc',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: opt.enabled ? 'pointer' : 'not-allowed',
                      opacity: opt.enabled ? 1 : 0.6,
                      transition: 'all 0.15s'
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Titre de la notification *</label>
              <input
                type="text"
                required
                value={notifyForm.title}
                onChange={e => setNotifyForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ex: Réponse à votre réclamation"
                style={{ width:'100%', padding:'10px 12px', borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:'Outfit,sans-serif', outline:'none', boxSizing:'border-box', color:C.text }}
              />
            </div>

            <div>
              <label style={{ fontSize:11, fontWeight:700, color:C.muted, textTransform:'uppercase', display:'block', marginBottom:6 }}>Message *</label>
              <textarea
                required
                value={notifyForm.message}
                onChange={e => setNotifyForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Écrivez votre message ou résolution de la réclamation ici..."
                rows={4}
                style={{ width:'100%', padding:'12px 14px', borderRadius:10, border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:'Outfit,sans-serif', resize:'none', outline:'none', boxSizing:'border-box', color:C.text }}
              />
            </div>

            <div style={{ display:'flex', gap:10, marginTop:10 }}>
              <button type="button" onClick={() => { setShowNotifyModal(false); setSelectedNotifyComplaint(null); }}
                style={{ flex:1, padding:11, borderRadius:10, border:`1.5px solid ${C.border}`, background:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', color:C.sub }}>
                Annuler
              </button>
              <button type="submit"
                style={{ flex:1, padding:11, borderRadius:10, border:'none', background:C.red, color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:'Outfit,sans-serif', boxShadow:`0 4px 12px ${C.red}35` }}>
                Envoyer
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            style={{
              position: 'fixed',
              top: 0,
              left: '50%',
              zIndex: 9999,
              background: toast.type === 'error' ? '#ef4444' : '#22c55e',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontWeight: 600,
              fontFamily: 'Outfit, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AdminDashboard;
