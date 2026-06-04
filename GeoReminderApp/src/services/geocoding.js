import { getLocationPrefs } from './settingsStorage';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export const searchLocation = async (query) => {
  const prefs = await getLocationPrefs();

  // Build a biased query: "Metro Store, Islamabad, Pakistan"
  let biasedQuery = query;
  if (prefs.city) biasedQuery += `, ${prefs.city}`;
  if (prefs.country) biasedQuery += `, ${prefs.country}`;

  const params = new URLSearchParams({
    q: biasedQuery,
    format: 'json',
    limit: '6',
    addressdetails: '1',
  });

  // Also restrict results to user's country if country code available
  if (prefs.countryCode) {
    params.set('countrycodes', prefs.countryCode);
  }

  const response = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { 'User-Agent': 'GeoReminderApp/1.0' },
  });

  if (!response.ok) throw new Error('Geocoding failed');

  let results = await response.json();

  // Fallback: if no results with country filter, retry without it
  if (results.length === 0 && prefs.countryCode) {
    const fallbackParams = new URLSearchParams({ q: query, format: 'json', limit: '6', addressdetails: '1' });
    const fallbackRes = await fetch(`${NOMINATIM_URL}?${fallbackParams}`, {
      headers: { 'User-Agent': 'GeoReminderApp/1.0' },
    });
    results = await fallbackRes.json();
  }

  return results.map((r) => ({
    name: r.display_name,
    shortName: r.name || r.display_name.split(',')[0],
    latitude: parseFloat(r.lat),
    longitude: parseFloat(r.lon),
  }));
};
