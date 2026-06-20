import axios from 'axios';

// All calls go through our Express proxy → no CORS issues
const PROXY = 'https://speedmeal.ayaennoamany.workers.dev/api/openmenu';

/**
 * Search restaurants + menu items
 * s='sample' → sandbox data (no credits consumed)
 */
export const searchOpenMenu = async (term = 'sample', opts = {}) => {
    const params = {
        s:      term || 'sample',
        offset: opts.offset || 0,
        ...(opts.city        && { city:        opts.city }),
        ...(opts.postal_code && { postal_code: opts.postal_code }),
        ...(opts.country     && { country:     opts.country }),
        ...(opts.state       && { state:        opts.state }),
        ...(opts.r           && { r: 1 }),
        ...(opts.mi          && { mi: 1 }),
    };
    const { data } = await axios.get(`${PROXY}/search`, { params });
    const result = data?.response?.result || {};
    return {
        restaurants: result.restaurants || [],
        items:       result.items       || [],
        menus:       result.menus       || [],
    };
};

/**
 * Get deals/coupons for a restaurant id
 * id='sample' → sandbox
 */
export const getDeals = async (id = 'sample') => {
    const { data } = await axios.get(`${PROXY}/deals`, { params: { id } });
    return data?.response?.result?.deals || [];
};

/**
 * Search ingredients + nutrition data
 */
export const searchIngredients = async (term = 'sample', opts = {}) => {
    const params = {
        s:      term || 'sample',
        offset: opts.offset || 0,
        ...(opts.food_group && { food_group: opts.food_group }),
    };
    const { data } = await axios.get(`${PROXY}/ingredients`, { params });
    const result = data?.response?.result;
    if (!result || result === '') return [];
    return Array.isArray(result) ? result : result.ingredients || [];
};

/**
 * Get restaurants by location
 */
export const getByLocation = async (opts = {}) => {
    const params = {
        offset: opts.offset || 0,
        ...(opts.city             && { city:             opts.city }),
        ...(opts.postal_code      && { postal_code:      opts.postal_code }),
        ...(opts.country          && { country:          opts.country }),
        ...(opts.restaurant_name  && { restaurant_name:  opts.restaurant_name }),
    };
    const { data } = await axios.get(`${PROXY}/location`, { params });
    return data?.response?.result?.restaurants || [];
};

/**
 * Normalize OpenMenu restaurant → SpeedMeal-compatible shape
 */
export const normalizeRestaurant = (r) => ({
    id:          r.id,
    name:        r.restaurant_name,
    description: r.brief_description || '',
    cuisine:     r.cuisine_type_primary || 'Restaurant',
    city:        [r.city_town, r.state_province].filter(Boolean).join(', '),
    address:     [r.address_1, r.city_town].filter(Boolean).join(', '),
    latitude:    r.latitude,
    longitude:   r.longitude,
    image_url:   r.image_url || null,
    website_url: r.website_url || null,
    isOpen:      true,
    rating:      null,
    deals_count: Number(r.totals?.deals) || 0,
    source:      'openmenu',
});

/**
 * Normalize OpenMenu menu item → SpeedMeal-compatible shape
 */
export const normalizeMenuItem = (item, restaurantId) => ({
    id:          `om_${restaurantId}_${(item.menu_item_name || '').replace(/\s+/g, '_')}`,
    name:        item.menu_item_name  || 'Plat sans nom',
    description: item.menu_item_description || '',
    price:       item.menu_item_price || item.sizes?.[0]?.menu_item_size_price || 0,
    category:    item.cuisine_type_primary || 'Menu',
    image_url:   item.image_url || null,
    isAvailable: true,
    vegetarian:  item.vegetarian === '1',
    vegan:       item.vegan      === '1',
    halal:       item.halal      === '1',
    gluten_free: item.gluten_free === '1',
    special:     item.special    === '1',
    sizes:       item.sizes      || [],
    source:      'openmenu',
});
