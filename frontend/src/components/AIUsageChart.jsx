import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AIUsageChart({ data, title = 'AI Usage Over Time' }) {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Total Tokens',
        data: data.map(item => item.tokens || item.totalTokens || 0),
        borderColor: '#4facfe',
        backgroundColor: 'rgba(79, 172, 254, 0.15)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#4facfe',
        pointBorderColor: 'rgba(255,255,255,0.3)',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: 'Total Cost (Rp)',
        data: data.map(item => item.cost || item.totalCost || 0),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.15)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: '#a855f7',
        pointBorderColor: 'rgba(255,255,255,0.3)',
        pointRadius: 4,
        pointHoverRadius: 6,
        borderWidth: 2,
        yAxisID: 'y1',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { size: 12 }, usePointStyle: true, pointStyle: 'rectRounded' },
      },
      title: {
        display: true,
        text: title,
        color: '#e2e8f0',
        font: { size: 15, weight: '600' },
        padding: { bottom: 16 },
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#e2e8f0',
        bodyColor: '#94a3b8',
        borderColor: 'rgba(79, 172, 254, 0.3)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function (ctx) {
            if (ctx.dataset.label === 'Total Cost (Rp)') {
              return ` Rp ${Math.ceil(ctx.raw).toLocaleString('id-ID')}`;
            }
            return ` ${ctx.raw.toLocaleString()} tokens`;
          }
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748b', font: { size: 10 } },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { color: 'rgba(255, 255, 255, 0.08)' },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: '#4facfe',
          font: { size: 10 },
          callback: (v) => `${(v / 1000).toFixed(0)}K`,
        },
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        border: { color: 'rgba(255, 255, 255, 0.08)' },
        title: { display: true, text: 'Tokens', color: '#4facfe', font: { size: 11 } },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: '#a855f7',
          font: { size: 10 },
          callback: (v) => `Rp${Math.ceil(v).toLocaleString('id-ID')}`,
        },
        grid: { drawOnChartArea: false },
        border: { color: 'rgba(255, 255, 255, 0.08)' },
        title: { display: true, text: 'Biaya (Rp)', color: '#a855f7', font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ height: '280px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
