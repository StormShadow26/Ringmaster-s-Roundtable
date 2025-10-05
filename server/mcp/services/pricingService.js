// services/pricingService.js
import { getGoogleLodgingSamples, getGoogleRestaurantSamples } from '../api/googlePlacesAPI.js';

function percentile(values, p) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.floor((p / 100) * sorted.length)));
  return sorted[idx];
}

function inferHotelPriceRangesFromPriceLevel(samples) {
  // price_level mapping heuristic to USD night ranges
  // 0: free/unknown; 1: budget; 2: mid; 3: upper-mid; 4: expensive
  const levels = samples.filter(s => typeof s.price_level === 'number').map(s => s.price_level);
  if (!levels.length) return null;
  const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
  const scale = 1 + (avgLevel - 2) * 0.35; // shift around mid-level 2
  return {
    cheap: [20, 50].map(v => Math.round(v * Math.max(0.6, scale * 0.7))),
    moderate: [60, 120].map(v => Math.round(v * Math.max(0.8, scale))),
    luxury: [180, 400].map(v => Math.round(v * Math.max(1.0, scale * 1.4)))
  };
}

function inferMealCostsFromPriceLevel(samples) {
  const priceLevels = samples.filter(s => typeof s.price_level === 'number').map(s => s.price_level);
  if (!priceLevels.length) return null;
  const p25 = percentile(priceLevels, 25) ?? 1;
  const p50 = percentile(priceLevels, 50) ?? 2;
  const p75 = percentile(priceLevels, 75) ?? 3;
  // Base meal anchors in USD
  const base = { street: 4, casual: 12, fine: 40 };
  const scaleStreet = 1 + (p25 - 1) * 0.25;
  const scaleCasual = 1 + (p50 - 2) * 0.35;
  const scaleFine = 1 + (p75 - 3) * 0.50;
  return {
    street: Math.max(2, Math.round(base.street * scaleStreet)),
    casual: Math.max(6, Math.round(base.casual * scaleCasual)),
    fine: Math.max(15, Math.round(base.fine * scaleFine))
  };
}

export async function getLocalPricingSignals(lat, lon) {
  try {
    const [lodging, restaurants] = await Promise.all([
      getGoogleLodgingSamples(lat, lon, 30),
      getGoogleRestaurantSamples(lat, lon, 40)
    ]);
    const hotelRanges = inferHotelPriceRangesFromPriceLevel(lodging);
    const mealCosts = inferMealCostsFromPriceLevel(restaurants);
    console.log('💰 pricingService signals:', {
      coords: { lat, lon },
      lodgingSamples: lodging.length,
      restaurantSamples: restaurants.length,
      inferredHotelRanges: hotelRanges,
      inferredMealCosts: mealCosts
    });
    return { hotelRanges, mealCosts, sources: { lodgingCount: lodging.length, restaurantCount: restaurants.length } };
  } catch (e) {
    console.error('❌ pricingService error:', e.message);
    return { hotelRanges: null, mealCosts: null, sources: { lodgingCount: 0, restaurantCount: 0 } };
  }
}


