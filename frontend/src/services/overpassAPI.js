import axios from 'axios';

const OVERPASS = 'https://overpass-api.de/api/interpreter';

// Moroccan cities with bounding boxes [south, west, north, east]
export const MOROCCAN_CITIES = [
  { name: 'Casablanca',   bbox: [33.48, -7.72, 33.68, -7.48] },
  { name: 'Rabat',        bbox: [33.94, -6.90, 34.04, -6.78] },
  { name: 'Marrakech',    bbox: [31.58, -8.08, 31.70, -7.96] },
  { name: 'Fès',          bbox: [33.96, -5.06, 34.12, -4.94] },
  { name: 'Tanger',       bbox: [35.72, -5.85, 35.82, -5.75] },
  { name: 'Agadir',       bbox: [30.38, -9.62, 30.46, -9.54] },
  { name: 'Meknès',       bbox: [33.85, -5.58, 33.93, -5.50] },
  { name: 'Oujda',        bbox: [34.66, -1.93, 34.72, -1.87] },
  { name: 'Kenitra',      bbox: [34.23, -6.63, 34.30, -6.58] },
  { name: 'Tétouan',      bbox: [35.56, -5.38, 35.60, -5.34] },
  { name: 'Safi',         bbox: [32.28, -9.25, 32.32, -9.21] },
  { name: 'El Jadida',    bbox: [33.23, -8.52, 33.26, -8.48] },
  { name: 'Beni Mellal',  bbox: [32.33, -6.37, 32.37, -6.33] },
  { name: 'Nador',        bbox: [35.15, -2.96, 35.19, -2.92] },
  { name: 'Settat',       bbox: [33.00, -7.62, 33.03, -7.59] },
];

/**
 * Fetch restaurants from Overpass API for a given bounding box
 * Returns normalized restaurant objects
 */
export const fetchRestaurantsByBbox = async (bbox) => {
  const [s, w, n, e] = bbox;
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](${s},${w},${n},${e});
      node["amenity"="cafe"](${s},${w},${n},${e});
      node["amenity"="fast_food"](${s},${w},${n},${e});
    );
    out body;
  `;

  const { data } = await axios.post(
    OVERPASS,
    `data=${encodeURIComponent(query)}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 30000 }
  );

  return (data.elements || []).map(normalizeOverpassNode);
};

/**
 * Normalize an Overpass node to a clean object
 */
const normalizeOverpassNode = (node) => {
  const tags = node.tags || {};
  return {
    id:        `osm_${node.id}`,
    osm_id:    node.id,
    name:      tags.name || tags['name:fr'] || tags['name:ar'] || 'Restaurant sans nom',
    lat:       node.lat,
    lng:       node.lon,
    amenity:   tags.amenity || 'restaurant',
    cuisine:   tags.cuisine?.replace(/;/g, ', ') || '',
    phone:     tags.phone || tags['contact:phone'] || '',
    website:   tags.website || tags['contact:website'] || '',
    opening_hours: tags.opening_hours || '',
    address:   buildAddress(tags),
    halal:     tags.halal === 'yes',
    takeaway:  tags.takeaway === 'yes',
    delivery:  tags.delivery === 'yes',
    outdoor_seating: tags.outdoor_seating === 'yes',
    wheelchair: tags.wheelchair === 'yes',
  };
};

const buildAddress = (tags) => {
  return [
    tags['addr:housenumber'],
    tags['addr:street'],
    tags['addr:city'],
  ].filter(Boolean).join(', ');
};

// Amenity type → label + color
export const AMENITY_STYLE = {
  restaurant: { label: 'Restaurant', color: '#A51C1C', bg: '#fff0f0' },
  cafe:       { label: 'Café',       color: '#92400e', bg: '#fffbeb' },
  fast_food:  { label: 'Fast Food',  color: '#1d4ed8', bg: '#eff6ff' },
};
