import axios from 'axios';

const BASE = 'https://www.themealdb.com/api/json/v1/1';

const api = axios.create({ baseURL: BASE });

// ── Search meals by name ─────────────────────────────────────────────────────
export const searchMeals = async (name = '') => {
  const { data } = await api.get(`/search.php?s=${encodeURIComponent(name)}`);
  return data?.meals || [];
};

// ── Get meal details by ID ───────────────────────────────────────────────────
export const getMealById = async (id) => {
  const { data } = await api.get(`/lookup.php?i=${id}`);
  return data?.meals?.[0] || null;
};

// ── Random meal ──────────────────────────────────────────────────────────────
export const getRandomMeal = async () => {
  const { data } = await api.get('/random.php');
  return data?.meals?.[0] || null;
};

// ── All categories (full details) ────────────────────────────────────────────
export const getCategories = async () => {
  const { data } = await api.get('/categories.php');
  return data?.categories || [];
};

// ── Filter meals by category ─────────────────────────────────────────────────
export const filterByCategory = async (category) => {
  const { data } = await api.get(`/filter.php?c=${encodeURIComponent(category)}`);
  return data?.meals || [];
};

// ── List all ingredients ─────────────────────────────────────────────────────
export const listIngredients = async () => {
  const { data } = await api.get('/list.php?i=list');
  return data?.meals || [];
};

// ── Filter by ingredient ─────────────────────────────────────────────────────
export const filterByIngredient = async (ingredient) => {
  const { data } = await api.get(`/filter.php?i=${encodeURIComponent(ingredient)}`);
  return data?.meals || [];
};

// ── List all areas / cuisines ────────────────────────────────────────────────
export const listAreas = async () => {
  const { data } = await api.get('/list.php?a=list');
  return data?.meals || [];
};

// ── Filter by area / cuisine ─────────────────────────────────────────────────
export const filterByArea = async (area) => {
  const { data } = await api.get(`/filter.php?a=${encodeURIComponent(area)}`);
  return data?.meals || [];
};

// ── Extract ingredients list from a meal object ──────────────────────────────
export const extractIngredients = (meal) => {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ing    = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ing && ing.trim()) {
      ingredients.push({
        name:    ing.trim(),
        measure: measure?.trim() || '',
        image:   `https://www.themealdb.com/images/ingredients/${encodeURIComponent(ing.trim())}-Small.png`,
      });
    }
  }
  return ingredients;
};
