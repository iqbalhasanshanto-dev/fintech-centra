import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Housing & Rent', value: 247933, color: '#6366f1', percentage: '90%' },
  { name: 'Entertainment', value: 16528, color: '#60a5fa', percentage: '6%' },
  { name: 'Shopping', value: 8264, color: '#fb7185', percentage: '3%' },
  { name: 'Transport & Food', value: 2755, color: '#38bdf8', percentage: '1%' },
];

export const DonutChartCard: React.FC = () => {
  return (
    <div className="bg-[#171717] border border-gray-800 rounded-2xl p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-gray-500 block mb-1">Spend Breakdown</span>
          <h2 className="text-3xl font-bold text-white">৳275,481.18</h2>
        </div>
        <div className="flex items-center gap-2 bg-gray-900 border border-gray-800 p-1 rounded-xl">
          <button className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium">Monthly</button>
          <button className="px-4 py-2 text-gray-400 hover:text-white text-sm font-medium">Weekly</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 relative h-[300px] flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={105}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs font-bold text-gray-400">Top Spend</span>
            <span className="text-2xl font-bold text-white">90%</span>
          </div>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-800/50 hover:bg-gray-800/20 transition-colors">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-300 truncate">{d.name}</p>
                <p className="text-xs text-gray-500">৳{d.value.toLocaleString()} ({d.percentage})</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
