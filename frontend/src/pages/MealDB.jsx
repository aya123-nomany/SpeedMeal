import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ChevronRight, Leaf, Shuffle, Clock, Star,
  ArrowLeft, ExternalLink, Play, Globe, Tag, Utensils,
  BookOpen, Video, Flame, MapPin, Filter,
} from 'lucide-react';
import {
  searchMeals, getMealById, getRandomMeal, getCategories,
  filterByCategory, filterByArea, filterByIngredient,
  listAreas, listIngredients, extractIngredients,
} from '../services/mealDBAPI';

/* ── Country → ISO2 code map for FlagCDN ────────────────────────────────── */
const AREA_FLAGS = {
  Afghan:              'af',
  Albanian:            'al',
  Algerian:            'dz',
  Andorran:            'ad',
  Angolan:             'ao',
  Argentine:           'ar',
  Armenian:            'am',
  Australian:          'au',
  Austrian:            'at',
  Azerbaijani:         'az',
  Bahamian:            'bs',
  Bahraini:            'bh',
  Bangladeshi:         'bd',
  Barbadian:           'bb',
  Belarusian:          'by',
  Belgian:             'be',
  Belizean:            'bz',
  Beninese:            'bj',
  Bhutanese:           'bt',
  Bolivian:            'bo',
  Brazilian:           'br',
  Bruneian:            'bn',
  Bulgarian:           'bg',
  Burkinabe:           'bf',
  Burundian:           'bi',
  Cambodian:           'kh',
  Cameroonian:         'cm',
  Canadian:            'ca',
  Chilean:             'cl',
  Chinese:             'cn',
  Colombian:           'co',
  'Costa Rican':       'cr',
  Croatian:            'hr',
  Cuban:               'cu',
  Cypriot:             'cy',
  Czech:               'cz',
  Danish:              'dk',
  Djibouti:            'dj',
  Dominican:           'do',
  Congolese:           'cd',
  Ecuadorean:          'ec',
  Egyptian:            'eg',
  Salvadoran:          'sv',
  Eritrean:            'er',
  Estonian:            'ee',
  Ethiopian:           'et',
  Fijian:              'fj',
  Finnish:             'fi',
  French:              'fr',
  Gabonese:            'ga',
  Gambian:             'gm',
  Georgian:            'ge',
  German:              'de',
  Ghanaian:            'gh',
  Greek:               'gr',
  Grenadian:           'gd',
  Guatemalan:          'gt',
  Guinean:             'gn',
  Guyanese:            'gy',
  Haitian:             'ht',
  Honduran:            'hn',
  'Hong Konger':       'hk',
  Hungarian:           'hu',
  Icelander:           'is',
  Indian:              'in',
  Indonesian:          'id',
  Iranian:             'ir',
  Iraqi:               'iq',
  Irish:               'ie',
  Israeli:             'il',
  Italian:             'it',
  Ivorian:             'ci',
  Jamaican:            'jm',
  Japanese:            'jp',
  Jordanian:           'jo',
  Kazakhstani:         'kz',
  Kenyan:              'ke',
  Kosovar:             'xk',
  Kuwaiti:             'kw',
  Kirghiz:             'kg',
  Laotian:             'la',
  Latvian:             'lv',
  Lebanese:            'lb',
  Liberian:            'lr',
  Libyan:              'ly',
  Lithuanian:          'lt',
  Luxembourger:        'lu',
  Malagasy:            'mg',
  Malawian:            'mw',
  Malaysian:           'my',
  Maldivan:            'mv',
  Malian:              'ml',
  Maltese:             'mt',
  Mauritian:           'mu',
  Mexican:             'mx',
  Moldovan:            'md',
  Mongolian:           'mn',
  Montenegrin:         'me',
  Moroccan:            'ma',
  Mozambican:          'mz',
  Burmese:             'mm',
  Namibian:            'na',
  Nepalese:            'np',
  Dutch:               'nl',
  'New Zealander':     'nz',
  Nicaraguan:          'ni',
  Nigerien:            'ne',
  Nigerian:            'ng',
  'North Korean':      'kp',
  Macedonian:          'mk',
  Norwegian:           'no',
  Omani:               'om',
  Pakistani:           'pk',
  Palestinian:         'ps',
  Panamanian:          'pa',
  'Papua New Guinean': 'pg',
  Paraguayan:          'py',
  Peruvian:            'pe',
  Filipino:            'ph',
  Polish:              'pl',
  Portuguese:          'pt',
  'Puerto Rican':      'pr',
  Qatari:              'qa',
  Romanian:            'ro',
  Russian:             'ru',
  Rwandan:             'rw',
  'Saint Lucian':      'lc',
  Samoan:              'ws',
  'Saudi Arabian':     'sa',
  Senegalese:          'sn',
  Serbian:             'rs',
  Seychellois:         'sc',
  'Sierra Leonean':    'sl',
  Singaporean:         'sg',
  Slovak:              'sk',
  Slovene:             'si',
  'Solomon Islander':  'sb',
  Somali:              'so',
  'South African':     'za',
  'South Korean':      'kr',
  'South Sudanese':    'ss',
  Spanish:             'es',
  'Sri Lankan':        'lk',
  Sudanese:            'sd',
  Surinamer:           'sr',
  Swedish:             'se',
  Swiss:               'ch',
  Syrian:              'sy',
  Taiwanese:           'tw',
  Tadzhik:             'tj',
  Tanzanian:           'tz',
  Thai:                'th',
  Togolese:            'tg',
  Tongan:              'to',
  Trinidadian:         'tt',
  Tunisian:            'tn',
  Turkish:             'tr',
  Turkmen:             'tm',
  Tuvaluan:            'tv',
  Ugandan:             'ug',
  Ukrainian:           'ua',
  Emirati:             'ae',
  British:             'gb',
  American:            'us',
  Uruguayan:           'uy',
  Uzbekistani:         'uz',
  Venezuelan:          've',
  Vietnamese:          'vn',
  Yemeni:              'ye',
  Zambian:             'zm',
  Zimbabwean:          'zw',
};

// ── Spinner ──────────────────────────────────────────────────────────────────
const Spinner = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 0', gap: '12px' }}>
    <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.3)', borderTop: '3px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', fontWeight: '600' }}>Chargement...</span>
  </div>
);

// ── Badge ────────────────────────────────────────────────────────────────────
const Badge = ({ icon, label, color = '#A51C1C', bg = '#fff0f0' }) => (
  <span style={{ background: bg, color, padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
    {icon && React.cloneElement(icon, { size: 11 })}
    {label}
  </span>
);

// ── Meal Card ────────────────────────────────────────────────────────────────
const MealCard = ({ meal, onClick, index = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.04 }}
    whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(0,0,0,0.14)' }}
    onClick={() => onClick(meal.idMeal)}
    style={{
      background: '#fff', borderRadius: '20px', overflow: 'hidden',
      cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      border: '1px solid #f0f0f0',
    }}
  >
    <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
      <img
        src={meal.strMealThumb}
        alt={meal.strMeal}
        style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }}
        onMouseEnter={e => e.target.style.transform = 'scale(1.08)'}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
      />
      {meal.strCategory && (
        <span style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.65)', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Utensils size={10} /> {meal.strCategory}
        </span>
      )}
      {meal.strArea && (
        <span style={{ position: 'absolute', bottom: '10px', right: '10px', background: '#A51C1C', color: '#fff', padding: '4px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Globe size={10} /> {meal.strArea}
        </span>
      )}
    </div>
    <div style={{ padding: '16px 18px' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: '15px', fontWeight: '800', color: '#111', lineHeight: 1.3,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {meal.strMeal}
      </h3>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ color: '#A51C1C', fontWeight: '700', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Voir la recette <ChevronRight size={13} />
        </span>
      </div>
    </div>
  </motion.div>
);

// ── Category Card ────────────────────────────────────────────────────────────
const CategoryCard = ({ cat, onClick }) => (
  <motion.div
    whileHover={{ y: -4, boxShadow: '0 12px 28px rgba(0,0,0,0.1)' }}
    onClick={() => onClick(cat.strCategory)}
    style={{ background: '#fff', borderRadius: '18px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0' }}
  >
    <div style={{ height: '130px', overflow: 'hidden', position: 'relative' }}>
      <img src={cat.strCategoryThumb} alt={cat.strCategory} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
        onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
      />
    </div>
    <div style={{ padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
        <Utensils size={13} color="#A51C1C" />
        <p style={{ margin: 0, fontWeight: '800', fontSize: '14px', color: '#111' }}>{cat.strCategory}</p>
      </div>
      {cat.strCategoryDescription && (
        <p style={{ margin: 0, fontSize: '11px', color: '#999', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {cat.strCategoryDescription}
        </p>
      )}
    </div>
  </motion.div>
);

// ── Meal Detail Modal ────────────────────────────────────────────────────────
const MealDetail = ({ meal, onClose }) => {
  if (!meal) return null;
  const ingredients = extractIngredients(meal);
  const youtubeId   = meal.strYoutube?.split('v=')?.[1];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 3000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px', overflowY: 'auto' }}
      >
        <motion.div
          initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 30 }}
          onClick={e => e.stopPropagation()}
          style={{ background: '#fff', borderRadius: '28px', width: '100%', maxWidth: '820px', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,0.3)', margin: 'auto' }}
        >
          {/* Hero */}
          <div style={{ position: 'relative', height: '320px', overflow: 'hidden' }}>
            <img src={meal.strMealThumb} alt={meal.strMeal} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 55%)' }} />
            <button onClick={onClose}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.92)', border: 'none', borderRadius: '50%', width: '42px', height: '42px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <X size={20} />
            </button>
            <div style={{ position: 'absolute', bottom: '20px', left: '24px', right: '24px' }}>
              <h2 style={{ margin: '0 0 10px', color: '#fff', fontSize: '26px', fontWeight: '900', lineHeight: 1.2 }}>{meal.strMeal}</h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {meal.strCategory && <Badge icon={<Utensils />} label={meal.strCategory} color="#fff" bg="rgba(255,255,255,0.2)" />}
                {meal.strArea     && <Badge icon={<Globe />}    label={meal.strArea}     color="#fff" bg="rgba(255,255,255,0.2)" />}
                {meal.strTags     && meal.strTags.split(',').slice(0, 3).map(t => t.trim()).filter(Boolean).map(t => (
                  <Badge key={t} icon={<Tag />} label={t} color="#fff" bg="rgba(255,255,255,0.15)" />
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '28px 32px' }}>
            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
              {meal.strYoutube && (
                <a href={meal.strYoutube} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#fee2e2', color: '#b91c1c', padding: '10px 18px', borderRadius: '999px', fontWeight: '700', fontSize: '13px', textDecoration: 'none' }}>
                  <Play size={15} /> Voir sur YouTube
                </a>
              )}
              {meal.strSource && (
                <a href={meal.strSource} target="_blank" rel="noreferrer"
                  style={{ display: 'flex', alignItems: 'center', gap: '7px', background: '#eff6ff', color: '#1d4ed8', padding: '10px 18px', borderRadius: '999px', fontWeight: '700', fontSize: '13px', textDecoration: 'none' }}>
                  <ExternalLink size={15} /> Recette originale
                </a>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
              {/* Ingredients */}
              <div>
                <h3 style={{ margin: '0 0 16px', fontWeight: '900', color: '#111', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Leaf size={17} color="#A51C1C" /> Ingrédients ({ingredients.length})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {ingredients.map((ing, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: '#f9f9f9', borderRadius: '10px' }}>
                      <img
                        src={ing.image} alt={ing.name}
                        style={{ width: '32px', height: '32px', objectFit: 'contain', borderRadius: '6px', background: '#fff', flexShrink: 0 }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <div>
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '13px', color: '#111' }}>{ing.name}</p>
                        {ing.measure && <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>{ing.measure}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <h3 style={{ margin: '0 0 16px', fontWeight: '900', color: '#111', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <BookOpen size={17} color="#A51C1C" /> Instructions
                </h3>
                <div style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
                  {meal.strInstructions
                    ?.split(/\r?\n/)
                    .filter(l => l.trim())
                    .map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                        <span style={{ background: '#A51C1C', color: '#fff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '800', flexShrink: 0, marginTop: '2px' }}>
                          {i + 1}
                        </span>
                        <p style={{ margin: 0, fontSize: '13px', color: '#555', lineHeight: 1.65 }}>{step}</p>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* YouTube embed */}
            {youtubeId && (
              <div style={{ marginTop: '28px' }}>
                <h3 style={{ margin: '0 0 14px', fontWeight: '900', color: '#111', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Video size={17} color="#A51C1C" /> Vidéo de la recette
                </h3>
                <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/9' }}>
                  <iframe
                    width="100%" height="100%"
                    src={`https://www.youtube.com/embed/${youtubeId}`}
                    title={meal.strMeal}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ display: 'block' }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function MealDB() {
  const [view, setView]               = useState('home');
  const [meals, setMeals]             = useState([]);
  const [categories, setCategories]   = useState([]);
  const [areas, setAreas]             = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [loading, setLoading]         = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [randomMeal, setRandomMeal]   = useState(null);
  const [tab, setTab]                 = useState('categories');
  const [areaSearch, setAreaSearch]   = useState('');

  useEffect(() => { loadHome(); }, []);

  const loadHome = async () => {
    setLoading(true);
    try {
      const [cats, ar, ings, rand] = await Promise.all([
        getCategories(), listAreas(), listIngredients(), getRandomMeal(),
      ]);
      setCategories(cats);
      setAreas(ar);
      setIngredients(ings.slice(0, 100));
      setRandomMeal(rand);
    } catch {}
    setLoading(false);
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true); setView('search'); setActiveFilter(searchQuery);
    try { setMeals(await searchMeals(searchQuery)); } catch { setMeals([]); }
    setLoading(false);
  };

  const handleCategoryClick = async (cat) => {
    setLoading(true); setView('category'); setActiveFilter(cat);
    try { setMeals(await filterByCategory(cat)); } catch { setMeals([]); }
    setLoading(false);
  };

  const handleAreaClick = async (area) => {
    setLoading(true); setView('area'); setActiveFilter(area);
    try { setMeals(await filterByArea(area)); } catch { setMeals([]); }
    setLoading(false);
  };

  const handleIngredientClick = async (ing) => {
    setLoading(true); setView('ingredient'); setActiveFilter(ing);
    try { setMeals(await filterByIngredient(ing)); } catch { setMeals([]); }
    setLoading(false);
  };

  const handleMealClick = async (id) => {
    setLoadingDetail(true);
    try { setSelectedMeal(await getMealById(id)); } catch {}
    setLoadingDetail(false);
  };

  const handleRandom = async () => {
    setLoadingDetail(true);
    try { setSelectedMeal(await getRandomMeal()); } catch {}
    setLoadingDetail(false);
  };

  const goBack = () => {
    setView('home'); setMeals([]); setActiveFilter(''); setSearchQuery('');
  };

  const VIEW_LABELS = {
    search:     { icon: <Search size={16} />,  text: `"${activeFilter}"` },
    category:   { icon: <Utensils size={16} />, text: activeFilter },
    area:       { icon: <Globe size={16} />,    text: activeFilter },
    ingredient: { icon: <Leaf size={16} />,     text: activeFilter },
  };

  const TABS = [
    { id: 'categories',  label: 'Catégories',  icon: <Utensils size={15} />,  count: categories.length },
    { id: 'areas',       label: 'Cuisines',    icon: <Globe size={15} />,     count: areas.length },
    { id: 'ingredients', label: 'Ingrédients', icon: <Leaf size={15} />,      count: ingredients.length },
  ];

  return (
    <div style={{ background: '#A51C1C', minHeight: '100vh', paddingBottom: '80px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {/* Detail modal */}
      {selectedMeal && <MealDetail meal={selectedMeal} onClose={() => setSelectedMeal(null)} />}

      {/* Loading overlay for detail */}
      {loadingDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 2999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 44, height: 44, border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      )}

      {/* ── HERO ── */}
      <div style={{ padding: '160px 20px 60px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            {/* ── Title with SectionTitle design ── */}
            <div style={{ position: 'relative', display: 'inline-block', marginBottom: 16 }}>
              {/* Yellow sparks */}
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none"
                style={{ position: 'absolute', top: -25, left: -30, pointerEvents: 'none' }}>
                <motion.path initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  d="M10 25C10 25 8 22 5 22" stroke="#FFC244" strokeWidth="4" strokeLinecap="round" />
                <motion.path initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  d="M12 18C12 18 10 14 8 12" stroke="#FFC244" strokeWidth="4" strokeLinecap="round" />
                <motion.path initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  d="M18 14C18 14 20 10 22 8" stroke="#FFC244" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <h1 style={{
                color: '#fff',
                fontSize: 'clamp(36px, 6vw, 72px)',
                fontWeight: '900',
                lineHeight: 1,
                letterSpacing: '-2px',
                margin: '0 0 16px',
                textTransform: 'uppercase',
              }}>
                Découvrez des<br /><span style={{ color: '#ffd97d' }}>Recettes</span> du Monde
              </h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '16px', marginBottom: '36px', fontWeight: '500' }}>
              Milliers de recettes, ingrédients, vidéos et plus encore
            </p>
          </motion.div>

          {/* Search bar */}
          <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            onSubmit={handleSearch} style={{ maxWidth: '680px', margin: '0 auto 20px' }}>
            <div style={{ display: 'flex', background: '#fff', borderRadius: '999px', padding: '7px 7px 7px 22px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', gap: '8px', alignItems: 'center' }}>
              <Search size={20} color="#888" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Rechercher une recette... (ex: chicken, pasta, sushi)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', fontWeight: '500', background: 'transparent', color: '#111', padding: '10px 0' }}
              />
              {searchQuery && (
                <button type="button" onClick={() => { setSearchQuery(''); goBack(); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', display: 'flex', padding: '4px' }}>
                  <X size={17} />
                </button>
              )}
              <button type="submit" style={{ background: '#A51C1C', color: '#fff', border: 'none', borderRadius: '999px', padding: '12px 24px', fontWeight: '800', fontSize: '14px', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Search size={14} /> Rechercher
              </button>
            </div>
          </motion.form>

          {/* Random button */}
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} onClick={handleRandom}
            style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '999px', padding: '12px 24px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', backdropFilter: 'blur(8px)' }}>
            <Shuffle size={16} /> Recette aléatoire
          </motion.button>
        </div>
      </div>

      {/* ── CONTENT ── */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>

        {/* Back + title bar */}
        {view !== 'home' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
            <button onClick={goBack}
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '10px 18px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)', fontSize: '13px' }}>
              <ArrowLeft size={15} /> Retour
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {VIEW_LABELS[view] && React.cloneElement(VIEW_LABELS[view].icon, { color: 'rgba(255,255,255,0.8)' })}
              <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '20px', margin: 0 }}>{VIEW_LABELS[view]?.text}</h2>
            </div>
            {meals.length > 0 && (
              <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '4px 12px', borderRadius: '999px', fontSize: '12px', fontWeight: '700' }}>
                {meals.length} plat{meals.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* ── MEAL RESULTS ── */}
        {view !== 'home' && (
          loading ? <Spinner /> :
          meals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px', color: 'rgba(255,255,255,0.7)' }}>
              <Utensils size={52} color="rgba(255,255,255,0.25)" style={{ marginBottom: '16px' }} />
              <p style={{ fontSize: '18px', fontWeight: '700' }}>Aucun plat trouvé</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px', paddingBottom: '40px' }}>
              {meals.map((meal, i) => (
                <MealCard key={meal.idMeal} meal={meal} onClick={handleMealClick} index={i} />
              ))}
            </div>
          )
        )}

        {/* ── HOME ── */}
        {view === 'home' && (
          loading ? <Spinner /> : (
            <>
              {/* Random meal spotlight */}
              {randomMeal && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '48px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <Star size={18} color="#ffd97d" fill="#ffd97d" />
                    <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '20px', margin: 0 }}>Plat du jour</h2>
                  </div>
                  <motion.div whileHover={{ y: -4 }} onClick={() => handleMealClick(randomMeal.idMeal)}
                    style={{ background: '#fff', borderRadius: '24px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                    <img src={randomMeal.strMealThumb} alt={randomMeal.strMeal} style={{ width: '100%', height: '280px', objectFit: 'cover' }} />
                    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                        {randomMeal.strCategory && <Badge icon={<Utensils />} label={randomMeal.strCategory} color="#A51C1C" bg="#fff0f0" />}
                        {randomMeal.strArea     && <Badge icon={<Globe />}    label={randomMeal.strArea}     color="#1d4ed8" bg="#eff6ff" />}
                      </div>
                      <h2 style={{ margin: '0 0 12px', fontSize: '24px', fontWeight: '900', color: '#111', lineHeight: 1.2 }}>
                        {randomMeal.strMeal}
                      </h2>
                      <p style={{ margin: '0 0 20px', color: '#888', fontSize: '13px', lineHeight: 1.6,
                        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {randomMeal.strInstructions}
                      </p>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={e => { e.stopPropagation(); handleMealClick(randomMeal.idMeal); }}
                          style={{ background: '#A51C1C', color: '#fff', border: 'none', padding: '12px 22px', borderRadius: '999px', fontWeight: '800', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <BookOpen size={14} /> Voir la recette
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleRandom(); }}
                          style={{ background: '#f5f5f5', color: '#555', border: 'none', padding: '12px 18px', borderRadius: '999px', fontWeight: '700', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Shuffle size={14} /> Autre plat
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {/* Tabs */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
                {TABS.map(t => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    style={{ padding: '10px 18px', background: tab === t.id ? '#fff' : 'rgba(255,255,255,0.12)', border: tab === t.id ? 'none' : '1px solid rgba(255,255,255,0.2)', borderRadius: '999px', cursor: 'pointer', color: tab === t.id ? '#A51C1C' : '#fff', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '7px', transition: 'all 0.2s' }}>
                    {React.cloneElement(t.icon, { color: tab === t.id ? '#A51C1C' : '#fff' })}
                    {t.label}
                    <span style={{ background: tab === t.id ? '#A51C1C' : 'rgba(255,255,255,0.25)', color: '#fff', padding: '1px 7px', borderRadius: '999px', fontSize: '11px', fontWeight: '800' }}>
                      {t.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* CATEGORIES */}
              {tab === 'categories' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', paddingBottom: '40px' }}>
                  {categories.map(cat => (
                    <CategoryCard key={cat.idCategory} cat={cat} onClick={handleCategoryClick} />
                  ))}
                </div>
              )}

              {/* AREAS */}
              {tab === 'areas' && (
                <>
                  {/* Search bar */}
                  <div style={{ marginBottom: 16, maxWidth: 360 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', borderRadius: 999, padding: '10px 18px', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
                      <Search size={16} color="#A51C1C" style={{ flexShrink: 0 }} />
                      <input
                        type="text"
                        placeholder="Rechercher un pays..."
                        value={areaSearch}
                        onChange={e => setAreaSearch(e.target.value)}
                        style={{ border: 'none', outline: 'none', fontSize: 14, fontWeight: 600, background: 'transparent', color: '#111', width: '100%', fontFamily: 'inherit' }}
                      />
                      {areaSearch && (
                        <button onClick={() => setAreaSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 0 }}>
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', paddingBottom: '40px' }}>
                    {[...new Map(areas.map(a => [a.strArea, a])).values()]
                      .filter(a => a.strArea.toLowerCase().includes(areaSearch.toLowerCase()))
                      .map(a => (
                        <motion.button key={a.strArea} whileHover={{ y: -3, scale: 1.04 }} whileTap={{ scale: 0.96 }}
                          onClick={() => handleAreaClick(a.strArea)}
                          style={{ background: '#fff', color: '#111', border: 'none', padding: '10px 18px', borderRadius: '999px', fontWeight: '700', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {AREA_FLAGS[a.strArea] ? (
                            <img
                              src={`https://flagcdn.com/w40/${AREA_FLAGS[a.strArea]}.png`}
                              alt={a.strArea}
                              style={{ width: 28, height: 20, objectFit: 'cover', borderRadius: 4, flexShrink: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}
                            />
                          ) : (
                            <Globe size={20} color="#555" />
                          )}
                          {a.strArea}
                        </motion.button>
                      ))}
                    {[...new Map(areas.map(a => [a.strArea, a])).values()]
                      .filter(a => a.strArea.toLowerCase().includes(areaSearch.toLowerCase())).length === 0 && (
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 600, padding: '10px 0' }}>
                        Aucun pays trouvé pour "{areaSearch}"
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* INGREDIENTS */}
              {tab === 'ingredients' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '12px', paddingBottom: '40px' }}>
                  {ingredients.map(ing => (
                    <motion.div key={ing.idIngredient || ing.strIngredient}
                      whileHover={{ y: -4, boxShadow: '0 10px 24px rgba(0,0,0,0.12)' }}
                      onClick={() => handleIngredientClick(ing.strIngredient)}
                      style={{ background: '#fff', borderRadius: '16px', padding: '16px 12px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' }}>
                      <img
                        src={`https://www.themealdb.com/images/ingredients/${encodeURIComponent(ing.strIngredient)}-Small.png`}
                        alt={ing.strIngredient}
                        style={{ width: '56px', height: '56px', objectFit: 'contain', marginBottom: '8px' }}
                        onError={e => { e.target.style.display = 'none'; }}
                      />
                      <p style={{ margin: 0, fontWeight: '700', fontSize: '12px', color: '#111', lineHeight: 1.3 }}>
                        {ing.strIngredient}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )
        )}
      </div>
    </div>
  );
}
