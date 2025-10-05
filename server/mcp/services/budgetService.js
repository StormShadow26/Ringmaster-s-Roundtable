// services/budgetService.js
import { getLocalPricingSignals } from './pricingService.js';

// Heuristic cost baselines in local currency (USD-like units)
const DEFAULTS = {
  perNightHotel: {
    cheap: [20, 50],
    moderate: [60, 120],
    luxury: [180, 400]
  },
  perDayTransport: {
    cheap: 6,      // local buses/metro
    moderate: 20,  // mix of metro + taxis
    luxury: 60     // private cabs / rentals
  },
  perMeal: {
    street: 4,
    casual: 12,
    fine: 40
  },
  snacksAndWaterPerDay: 3,
  sightseeingPerDay: {
    cheap: 5,      // free/low-cost attractions
    moderate: 20,  // paid popular attractions
    luxury: 60     // premium experiences / guided tours
  }
};

function clampRange([min, max], factor) {
  return [Math.max(1, Math.round(min * factor)), Math.max(1, Math.round(max * factor))];
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}

function getTripDays(travelPlan) {
  const start = new Date(travelPlan?.tripDuration?.startDate);
  const end = new Date(travelPlan?.tripDuration?.endDate);
  if (isNaN(start) || isNaN(end)) return travelPlan?.tripDuration?.totalDays || 1;
  const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, days);
}

function deriveCityCostFactor(city) {
  if (!city) return 1;
  const name = city.toLowerCase();
  // Very rough city cost multipliers
  const premium = [
    'new york', 'london', 'paris', 'tokyo', 'singapore', 'zurich', 'dubai'
  ];
  const budget = [
    'bangkok', 'hanoi', 'bali', 'goa', 'cairo', 'lisbon', 'budapest'
  ];
  if (premium.some(c => name.includes(c))) return 1.6;
  if (budget.some(c => name.includes(c))) return 0.8;
  return 1.0;
}

function buildMealsPerDay(tier, perMealBase) {
  if (tier === 'cheap') {
    return {
      breakfast: perMealBase.street,
      lunch: perMealBase.street,
      dinner: perMealBase.casual
    };
  }
  if (tier === 'moderate') {
    return {
      breakfast: perMealBase.casual,
      lunch: perMealBase.casual,
      dinner: perMealBase.casual
    };
  }
  return {
    breakfast: perMealBase.casual,
    lunch: perMealBase.casual,
    dinner: perMealBase.fine
  };
}

function computeTierBudget(travelPlan, travelers = 2, currency = 'USD', tier, cityFactor, bases) {
  const tripDays = getTripDays(travelPlan);

  const hotelRangeBase = (bases?.perNightHotel?.[tier]) || DEFAULTS.perNightHotel[tier];
  const hotelRange = clampRange(hotelRangeBase, cityFactor);
  const roomsNeeded = Math.max(1, Math.ceil(travelers / 2));
  const hotelPerNightMin = hotelRange[0] * roomsNeeded;
  const hotelPerNightMax = hotelRange[1] * roomsNeeded;

  const transportPerDay = Math.round(DEFAULTS.perDayTransport[tier] * cityFactor);
  const sightseeingPerDay = Math.round(DEFAULTS.sightseeingPerDay[tier] * cityFactor);
  const snacksPerDay = Math.round(DEFAULTS.snacksAndWaterPerDay * cityFactor);

  const perMealBase = (bases?.perMeal) || DEFAULTS.perMeal;
  const meals = buildMealsPerDay(tier, perMealBase);
  const mealsPerTravelerPerDay = meals.breakfast + meals.lunch + meals.dinner;
  const mealsPerDayTotal = Math.round(mealsPerTravelerPerDay * travelers * cityFactor);

  const dailyMin = transportPerDay + sightseeingPerDay + snacksPerDay + mealsPerDayTotal + hotelPerNightMin;
  const dailyMax = transportPerDay + sightseeingPerDay + snacksPerDay + mealsPerDayTotal + hotelPerNightMax;

  const tripMin = dailyMin * tripDays;
  const tripMax = dailyMax * tripDays;

  const tierResult = {
    tier,
    currency,
    assumptions: {
      travelers,
      roomsNeeded,
      tripDays,
      cityCostFactor: cityFactor
    },
    perNightHotelRange: { min: hotelPerNightMin, max: hotelPerNightMax },
    perDay: {
      transport: transportPerDay,
      meals: mealsPerDayTotal,
      sightseeing: sightseeingPerDay,
      snacksAndWater: snacksPerDay,
      hotelMin: hotelPerNightMin,
      hotelMax: hotelPerNightMax,
      totalMin: dailyMin,
      totalMax: dailyMax
    },
    tripTotal: {
      min: roundCurrency(tripMin),
      max: roundCurrency(tripMax)
    },
    guidance: {
      hotels: tier === 'cheap'
        ? 'Hostels, budget hotels, guesthouses'
        : tier === 'moderate'
        ? '3-star hotels, boutique stays'
        : '4-5 star hotels, upscale boutique',
      transport: tier === 'cheap'
        ? 'Metro, buses, shared autos, occasional rickshaw'
        : tier === 'moderate'
        ? 'Metro + taxis or ride-hailing'
        : 'Private cabs, hotel transfers',
      food: tier === 'cheap'
        ? 'Street food + casual local eateries'
        : tier === 'moderate'
        ? 'Casual dining, mid-range restaurants'
        : 'Upscale dining and tasting menus',
      activities: tier === 'cheap'
        ? 'Free walking tours, public parks, low-cost museums'
        : tier === 'moderate'
        ? 'Popular paid attractions, guided tours'
        : 'Premium experiences, private guides'
    }
  };

  // Build simple day-by-day breakdown using per-day totals
  const startStr = travelPlan?.tripDuration?.startDate;
  if (startStr) {
    const start = new Date(startStr);
    const days = [];
    for (let i = 0; i < tripDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateIso = d.toISOString().split('T')[0];
      days.push({
        date: dateIso,
        hotel: { min: hotelPerNightMin, max: hotelPerNightMax },
        food: mealsPerDayTotal,
        transport: transportPerDay,
        sightseeing: sightseeingPerDay,
        snacksAndWater: snacksPerDay,
        total: { min: dailyMin, max: dailyMax }
      });
    }
    tierResult.dailyBreakdown = days;
  }

  return tierResult;
}

export async function estimateBudget(travelPlan, options = {}) {
  const { travelers = 2, currency = 'USD' } = options;
  const city = travelPlan?.destination?.city || '';
  const coords = travelPlan?.destination?.coordinates || {};
  const cityFactor = deriveCityCostFactor(city);

  // Try to fetch local pricing signals using coordinates
  let bases = null;
  if (typeof coords.lat === 'number' && typeof coords.lon === 'number') {
    const signals = await getLocalPricingSignals(coords.lat, coords.lon);
    if (signals.hotelRanges || signals.mealCosts) {
      bases = {
        perNightHotel: signals.hotelRanges || DEFAULTS.perNightHotel,
        perMeal: signals.mealCosts || DEFAULTS.perMeal
      };
    }
  }

  const cheap = computeTierBudget(travelPlan, travelers, currency, 'cheap', cityFactor, bases);
  const moderate = computeTierBudget(travelPlan, travelers, currency, 'moderate', cityFactor, bases);
  const luxury = computeTierBudget(travelPlan, travelers, currency, 'luxury', cityFactor, bases);

  console.log('🧮 Budget computed:', {
    city,
    travelers,
    currency,
    usedLocalSignals: !!bases,
    cheap: { perNight: cheap.perNightHotelRange, trip: cheap.tripTotal },
    moderate: { perNight: moderate.perNightHotelRange, trip: moderate.tripTotal },
    luxury: { perNight: luxury.perNightHotelRange, trip: luxury.tripTotal }
  });

  return {
    destination: city,
    currency,
    travelers,
    tripDays: getTripDays(travelPlan),
    tiers: { cheap, moderate, luxury }
  };
}

export function summarizeBudgetText(budget) {
  const { destination, currency, travelers, tripDays, tiers } = budget;
  const lines = [];
  lines.push(`Budget estimate for ${destination || 'destination'} — ${tripDays} days, ${travelers} travelers (${currency})`);
  for (const key of ['cheap', 'moderate', 'luxury']) {
    const t = tiers[key];
    lines.push(
      `\n${t.tier.toUpperCase()} — per-night hotel ${currency} ${t.perNightHotelRange.min}-${t.perNightHotelRange.max}, per-day total ${currency} ${t.perDay.totalMin}-${t.perDay.totalMax}, trip total ${currency} ${t.tripTotal.min}-${t.tripTotal.max}`
    );
    lines.push(`  Hotels: ${t.guidance.hotels}`);
    lines.push(`  Transport: ${t.guidance.transport}`);
    lines.push(`  Food: ${t.guidance.food}`);
    lines.push(`  Activities: ${t.guidance.activities}`);
  }
  return lines.join('\n');
}


