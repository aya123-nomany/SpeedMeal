import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  fr: {
    // Navbar & Common
    navHome: "Accueil",
    navMenu: "Menu",
    navAbout: "À propos",
    navContact: "Contact",
    navPartner: "Devenir Partenaire",
    navCourier: "Devenir Livreur",
    navLogin: "Connexion",
    navSignup: "Inscription",
    navLogout: "Déconnexion",
    navDashboard: "Dashboard",
    loading: "Chargement...",

    // Footer
    footerDesc: "L'excellence livrée à votre porte. Découvrez les meilleures saveurs de vos restaurants locaux préférés.",
    footerLinks: "Liens Utiles",
    footerContact: "Contact",
    footerNewsletter: "Newsletter",
    footerSubscribe: "S'abonner",
    footerPrivacy: "Confidentialité",
    footerTerms: "Conditions",

    // Home Page
    heroTitle: "C'est l'heure de commander",
    heroBtn: "Commander maintenant",
    whereDeliver: "Où devons-nous livrer ?",
    searchAddress: "Chercher l'adresse",
    usePosition: "Utiliser ma position",
    confirmAddress: "Confirmer l'adresse",
    locationLoading: "Localisation...",
    locationErrorGeo: "La géolocalisation n'est pas supportée par votre navigateur.",
    locationErrorDenied: "Accès refusé. Veuillez autoriser la géolocalisation dans votre navigateur.",
    locationErrorFailed: "Impossible d'obtenir votre position. Réessayez.",
    promoTitle: "Tout ce que vous adorez, livré chez vous.",
    promoSubtitle: "Vos restaurants locaux préférés",
    promoDesc: "Commandez une pizza, un burger ou votre plat préféré depuis les meilleurs restaurants de votre ville — livré en moins de 45 minutes.",
    promoBtn: "Trouver des restaurants",
    bestRestoTitle: "Les meilleurs restaurants au Maroc",
    bestRestoSub: "Découvrez une sélection variée des meilleurs établissements près de chez vous.",

    // About Page
    aboutTitle: "L'histoire de SpeedMeal",
    aboutSubtitle: "Plus que de la livraison. Nous sommes une communauté d'amoureux de la cuisine déterminés à apporter les meilleures saveurs chez vous.",
    aboutHeroTitle: "Livrer du bonheur, un repas à la fois.",
    aboutHeroDesc: "Chez SpeedMeal, nous croyons que la bonne cuisine doit être accessible, fiable et agréable. Notre technologie vous connecte aux meilleures cuisines locales.",
    feature1Title: "Les meilleurs restaurants de votre ville",
    feature1Desc: "Avec un grand choix de restaurants, vous trouverez toujours votre plat préféré et découvrirez de nouveaux restaurants !",
    feature2Title: "Livraison rapide",
    feature2Desc: "Notre rapidité est notre fierté. Commandez ou envoyez ce que vous voulez dans votre ville et on vous livre en quelques minutes.",
    feature3Title: "Vos courses et bien plus",
    feature3Desc: "Trouvez tout ce qu'il vous faut ! Supermarchés, magasins, pharmacies, fleuristes... Si ça se trouve dans votre ville, commandez-le.",
    statCities: "Villes",
    statCouriers: "Livreurs actifs",
    statRestos: "Restaurants partenaires",
    statOrders: "Commandes passées",

    // Dashboard General
    adminTitle: "Dashboard Admin",
    restaurantTitle: "Dashboard Restaurant",
    userTitle: "Mon Compte",
    deliveryTitle: "Dashboard Livreur",

    // Dashboard Specific terms
    orders: "Commandes",
    users: "Utilisateurs",
    restaurants: "Restaurants",
    couriers: "Livreurs",
    commissions: "Commissions",
    coupons: "Coupons",
    reviews: "Avis",
    complaints: "Réclamations",
    requests: "Demandes",
    aiForecast: "IA & Prévisions",
    overview: "Vue d'ensemble",
    statistics: "Statistiques",
    admin: "Administrateur",
    search: "Rechercher...",
    totalMenus: "Total menus",
    totalRevenue: "Total revenus",
    totalOrders: "Total commandes",
    totalClients: "Total clients",
    allDishes: "Tous les plats",
    today: "aujourd'hui",
    viewAll: "Voir tout",
    trendingRestos: "Trending Restaurants",
    activeStatus: "Statut actif",
    actions: "Actions",
    edit: "Modifier",
    delete: "Supprimer"
  },
  en: {
    // Navbar & Common
    navHome: "Home",
    navMenu: "Menu",
    navAbout: "About Us",
    navContact: "Contact",
    navPartner: "Become a Partner",
    navCourier: "Become a Courier",
    navLogin: "Login",
    navSignup: "Sign Up",
    navLogout: "Log Out",
    navDashboard: "Dashboard",
    loading: "Loading...",

    // Footer
    footerDesc: "Delivering excellence to your doorstep. Experience the finest flavors from your favorite local restaurants.",
    footerLinks: "Quick Links",
    footerContact: "Contact",
    footerNewsletter: "Newsletter",
    footerSubscribe: "Subscribe",
    footerPrivacy: "Privacy Policy",
    footerTerms: "Terms of Service",

    // Home Page
    heroTitle: "It's Order Time",
    heroBtn: "Order Now",
    whereDeliver: "Where should we deliver?",
    searchAddress: "Search address",
    usePosition: "Use my position",
    confirmAddress: "Confirm address",
    locationLoading: "Locating...",
    locationErrorGeo: "Geolocation is not supported by your browser.",
    locationErrorDenied: "Access denied. Please allow geolocation in your browser settings.",
    locationErrorFailed: "Failed to retrieve your position. Please try again.",
    promoTitle: "Everything you love, delivered to your door.",
    promoSubtitle: "Your favorite local restaurants",
    promoDesc: "Order a pizza, burger, or your favorite dish from the best local restaurants in your city — delivered in under 45 minutes.",
    promoBtn: "Find Restaurants",
    bestRestoTitle: "The Best Restaurants in Morocco",
    bestRestoSub: "Discover a diverse selection of the best establishments near you.",

    // About Page
    aboutTitle: "The SpeedMeal Story",
    aboutSubtitle: "More than just delivery. We are a community of food lovers dedicated to bringing the world's best flavors to your door.",
    aboutHeroTitle: "Delivering happiness, one meal at a time.",
    aboutHeroDesc: "At SpeedMeal, we believe that great food should be accessible, reliable, and delightful. Our technology connects you with the best local kitchens.",
    feature1Title: "The best restaurants in your city",
    feature1Desc: "With a huge selection of restaurants, you will always find your favorite meal and discover new spots!",
    feature2Title: "Fast Delivery",
    feature2Desc: "Speed is our pride. Order or send whatever you want in your city and we will deliver in minutes.",
    feature3Title: "Your groceries & more",
    feature3Desc: "Find everything you need! Supermarkets, shops, pharmacies, florists... If it is in your city, order it.",
    statCities: "Cities",
    statCouriers: "Active Couriers",
    statRestos: "Partner Restaurants",
    statOrders: "Orders Delivered",

    // Dashboard General
    adminTitle: "Admin Dashboard",
    restaurantTitle: "Restaurant Dashboard",
    userTitle: "My Account",
    deliveryTitle: "Delivery Dashboard",

    // Dashboard Specific terms
    orders: "Orders",
    users: "Users",
    restaurants: "Restaurants",
    couriers: "Couriers",
    commissions: "Commissions",
    coupons: "Coupons",
    reviews: "Reviews",
    complaints: "Complaints",
    requests: "Requests",
    aiForecast: "AI & Forecasting",
    overview: "Overview",
    statistics: "Statistics",
    admin: "Administrator",
    search: "Search...",
    totalMenus: "Total Menus",
    totalRevenue: "Total Revenue",
    totalOrders: "Total Orders",
    totalClients: "Total Clients",
    allDishes: "All Dishes",
    today: "today",
    viewAll: "View All",
    trendingRestos: "Trending Restaurants",
    activeStatus: "Active Status",
    actions: "Actions",
    edit: "Edit",
    delete: "Delete"
  },
  ar: {
    // Navbar & Common
    navHome: "الرئيسية",
    navMenu: "القائمة",
    navAbout: "من نحن",
    navContact: "اتصل بنا",
    navPartner: "كن شريكاً",
    navCourier: "كن موزعاً",
    navLogin: "تسجيل الدخول",
    navSignup: "إنشاء حساب",
    navLogout: "تسجيل الخروج",
    navDashboard: "لوحة التحكم",
    loading: "جاري التحميل...",

    // Footer
    footerDesc: "التميز يصل إلى عتبة داركم. جربوا أفضل النكهات من مطاعمكم المحلية المفضلة.",
    footerLinks: "روابط سريعة",
    footerContact: "اتصل بنا",
    footerNewsletter: "النشرة الإخبارية",
    footerSubscribe: "اشتراك",
    footerPrivacy: "سياسة الخصوصية",
    footerTerms: "شروط الخدمة",

    // Home Page
    heroTitle: "إنه وقت الطلب",
    heroBtn: "اطلب الآن",
    whereDeliver: "أين تريد التوصيل؟",
    searchAddress: "ابحث عن العنوان",
    usePosition: "استخدم موقعي الحالي",
    confirmAddress: "تأكيد العنوان",
    locationLoading: "جاري تحديد الموقع...",
    locationErrorGeo: "جهاز تحديد المواقع غير مدعوم في متصفحك.",
    locationErrorDenied: "تم رفض الوصول. يرجى السماح بتحديد الموقع في إعدادات متصفحك.",
    locationErrorFailed: "فشل في تحديد موقعك. يرجى المحاولة مرة أخرى.",
    promoTitle: "كل ما تحبه، يصلك إلى باب بيتك.",
    promoSubtitle: "مطاعمكم المحلية المفضلة",
    promoDesc: "اطلب البيتزا، البرجر أو وجبتك المفضلة من أفضل المطاعم في مدينتك — تصلك في أقل من 45 دقيقة.",
    promoBtn: "ابحث عن مطاعم",
    bestRestoTitle: "أفضل المطاعم في المغرب",
    bestRestoSub: "اكتشف تشكيلة متنوعة من أفضل المطاعم القريبة منك.",

    // About Page
    aboutTitle: "قصة SpeedMeal",
    aboutSubtitle: "أكثر من مجرد توصيل. نحن مجتمع من عشاق الطعام الملتزمين بتقديم أفضل النكهات إليك.",
    aboutHeroTitle: "توصيل السعادة، وجبة تلو الأخرى.",
    aboutHeroDesc: "في SpeedMeal، نؤمن بأن الطعام الرائع يجب أن يكون في متناول الجميع، موثوقًا وممتعًا. تقنيتنا تربطك بأفضل المطابخ المحلية.",
    feature1Title: "أفضل المطاعم في مدينتك",
    feature1Desc: "مع خيارات واسعة من المطاعم، ستجد دائماً وجبتك المفضلة وتكتشف مطاعم جديدة!",
    feature2Title: "توصيل سريع",
    feature2Desc: "سرعتنا هي فخرنا. اطلب أو أرسل ما تريد في مدينتك وسنقوم بالتوصيل في دقائق معدودة.",
    feature3Title: "مشترياتك وأكثر من ذلك بكثير",
    feature3Desc: "جد كل ما تحتاجه! سوبرماركت، محلات، صيدليات، زهور... إذا كان موجوداً في مدينتك، اطلبه الآن.",
    statCities: "مدن",
    statCouriers: "عمال توصيل نشطين",
    statRestos: "مطاعم شريكة",
    statOrders: "طلبات تم توصيلها",

    // Dashboard General
    adminTitle: "لوحة تحكم المسؤول",
    restaurantTitle: "لوحة تحكم المطعم",
    userTitle: "حسابي",
    deliveryTitle: "لوحة تحكم التوصيل",

    // Dashboard Specific terms
    orders: "الطلبات",
    users: "المستخدمين",
    restaurants: "المطاعم",
    couriers: "عمال التوصيل",
    commissions: "العمولات",
    coupons: "الكوبونات",
    reviews: "التقييمات",
    complaints: "الشكاوى",
    requests: "الطلبات الواردة",
    aiForecast: "الذكاء الاصطناعي والتنبؤ",
    overview: "نظرة عامة",
    statistics: "الإحصائيات",
    admin: "مسؤول النظام",
    search: "بحث...",
    totalMenus: "إجمالي القوائم",
    totalRevenue: "إجمالي الإيرادات",
    totalOrders: "إجمالي الطلبات",
    totalClients: "إجمالي العملاء",
    allDishes: "جميع الأطباق",
    today: "اليوم",
    viewAll: "عرض الكل",
    trendingRestos: "المطاعم الشائعة",
    activeStatus: "الحالة النشطة",
    actions: "الإجراءات",
    edit: "تعديل",
    delete: "حذف"
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('language') || 'fr';
  });

  const setLanguage = (lang) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key) => {
    if (!translations[language]) return key;
    return translations[language][key] || translations['fr'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
