import React, { useState } from "react";

export default function BudgetDailyCard({ budget }) {
  if (!budget || !budget.tiers) return null;
  const [tier, setTier] = useState('moderate');
  const tiers = budget.tiers;
  const data = tiers[tier];

  if (!data || !Array.isArray(data.dailyBreakdown)) return null;

  return (
    <div className="bg-white border rounded-xl shadow-md">
      <div className="px-4 py-3 border-b bg-gradient-to-r from-sky-500 to-indigo-500 text-white rounded-t-xl flex items-center justify-between">
        <h3 className="font-semibold">Day-by-Day Expenses</h3>
        <div className="space-x-2 text-xs">
          {['cheap','moderate','luxury'].map(t => (
            <button
              key={t}
              onClick={() => setTier(t)}
              className={`px-2 py-1 rounded ${tier===t ? 'bg-white text-sky-600' : 'bg-white/20 text-white hover:bg-white/30'}`}
            >
              {t.charAt(0).toUpperCase()+t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Hotel</th>
                <th className="py-2 pr-4">Food</th>
                <th className="py-2 pr-4">Transport</th>
                <th className="py-2 pr-4">Sightseeing</th>
                <th className="py-2 pr-4">Snacks</th>
                <th className="py-2 pr-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.dailyBreakdown.map((d) => (
                <tr key={d.date} className="border-t text-gray-800">
                  <td className="py-2 pr-4">{d.date}</td>
                  <td className="py-2 pr-4">{budget.currency} {d.hotel.min}-{d.hotel.max}</td>
                  <td className="py-2 pr-4">{budget.currency} {d.food}</td>
                  <td className="py-2 pr-4">{budget.currency} {d.transport}</td>
                  <td className="py-2 pr-4">{budget.currency} {d.sightseeing}</td>
                  <td className="py-2 pr-4">{budget.currency} {d.snacksAndWater}</td>
                  <td className="py-2 pr-4 font-medium">{budget.currency} {d.total.min}-{d.total.max}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


