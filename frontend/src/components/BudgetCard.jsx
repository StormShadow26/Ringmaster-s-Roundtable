import React from "react";

export default function BudgetCard({ budget, summary }) {
  if (!budget || !budget.tiers) return null;
  const { currency, travelers, tripDays, tiers } = budget;
  const Tier = ({ label, data }) => {
    return (
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-gray-800">{label}</h4>
          <span className="text-xs text-gray-500">Per-night hotel: {currency} {data.perNightHotelRange.min}-{data.perNightHotelRange.max}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-gray-50 rounded p-3">
            <div className="text-gray-600">Per-day breakdown</div>
            <div className="mt-1 text-gray-800">Hotel: {currency} {data.perDay.hotelMin}-{data.perDay.hotelMax}</div>
            <div className="text-gray-800">Meals: {currency} {data.perDay.meals}</div>
            <div className="text-gray-800">Transport: {currency} {data.perDay.transport}</div>
            <div className="text-gray-800">Sightseeing: {currency} {data.perDay.sightseeing}</div>
            <div className="text-gray-800">Snacks/Water: {currency} {data.perDay.snacksAndWater}</div>
            <div className="mt-1 font-medium text-gray-900">Total/day: {currency} {data.perDay.totalMin}-{data.perDay.totalMax}</div>
          </div>
          <div className="bg-gray-50 rounded p-3">
            <div className="text-gray-600">Trip totals ({tripDays} days)</div>
            <div className="mt-1 text-gray-900 font-semibold">{currency} {data.tripTotal.min} - {currency} {data.tripTotal.max}</div>
            <div className="mt-3 text-gray-600">Guidance</div>
            <ul className="list-disc list-inside text-gray-800 space-y-1">
              <li>Hotels: {data.guidance.hotels}</li>
              <li>Transport: {data.guidance.transport}</li>
              <li>Food: {data.guidance.food}</li>
              <li>Activities: {data.guidance.activities}</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border rounded-xl shadow-md">
      <div className="px-4 py-3 border-b bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Budget Overview</h3>
          <div className="text-sm opacity-90">{tripDays} days, {travelers} travelers, currency: {currency}</div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {summary && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded p-3 text-sm whitespace-pre-line">
            {summary}
          </div>
        )}
        <div className="grid md:grid-cols-3 gap-4">
          <Tier label="Cheap" data={tiers.cheap} />
          <Tier label="Moderate" data={tiers.moderate} />
          <Tier label="Luxury" data={tiers.luxury} />
        </div>
      </div>
    </div>
  );
}


