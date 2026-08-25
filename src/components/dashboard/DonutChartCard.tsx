import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Food', value: 400, color: '#22d3ee' }, // cyan-400
  { name: 'Transport', value: 300, color: '#22d3ee' },
  { name: 'Bills', value: 300, color: '#22d3ee' },
  { name: 'Others', value: 200, color: '#22d3ee' },
];

export const DonutChartCard: React.FC = () => {
  return (
    <div className="relative rounded-2xl bg-slate-800 dark:bg-slate-800 p-6 border border-slate-700/30">
      {/* Full Report button */}
      <div className="absolute top-3 right-3">
        <button className="text-xs text-slate-300 hover:text-white transition">Full Report</button>
      </div>
      {/* Chart */}
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: 'none', color: '#fff' }}
            itemStyle={{ color: '#fff' }}
          />
        </PieChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-slate-300">
        {data.map((d, i) => (
          <div key={i} className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
            <span>{d.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
