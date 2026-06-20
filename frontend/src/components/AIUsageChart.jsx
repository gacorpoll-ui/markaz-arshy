import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

/**
 * AIUsageChart - Displays AI usage data in a line chart.
 * Expected data format:
 * [
 *   { date: '2026-06-10', totalTokens: 10000, totalCost: 0.05 },
 *   { date: '2026-06-11', totalTokens: 15000, totalCost: 0.08 },
 *   ...
 * ]
 */
export default function AIUsageChart({ data, title = 'AI Usage Over Time' }) {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Total Tokens',
        data: data.map(item => item.totalTokens),
        borderColor: 'rgba(79, 172, 254, 1)',
        backgroundColor: 'rgba(79, 172, 254, 0.2)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: 'rgba(79, 172, 254, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(79, 172, 254, 1)',
      },
      {
        label: 'Total Cost ($)',
        data: data.map(item => item.totalCost),
        borderColor: 'rgba(168, 85, 247, 1)',
        backgroundColor: 'rgba(168, 85, 247, 0.2)',
        fill: true,
        tension: 0.3,
        pointBackgroundColor: 'rgba(168, 85, 247, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(168, 85, 247, 1)',
        yAxisID: 'y1', // Use a secondary Y-axis for cost
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: 'var(--text-secondary)',
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: title,
        color: 'var(--text-primary)',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.dataset.label === 'Total Cost ($)') {
              label += `$${context.raw.toFixed(4)}`;
            } else {
              label += `${context.raw.toLocaleString()} tokens`;
            }
            return label;
          }
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'var(--text-muted)',
          font: {
            size: 10,
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          color: 'var(--text-muted)',
          font: {
            size: 10,
          },
          callback: function (value) {
            return `${(value / 1000).toFixed(0)}K`;
          }
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        title: {
          display: true,
          text: 'Tokens',
          color: 'var(--text-secondary)',
          font: {
            size: 12,
          },
        },
      },
      y1: { // Secondary Y-axis for cost
        type: 'linear',
        display: true,
        position: 'right',
        ticks: {
          color: 'var(--text-muted)',
          font: {
            size: 10,
          },
          callback: function (value) {
            return `$${value.toFixed(2)}`;
          }
        },
        grid: {
          drawOnChartArea: false, // Only draw the grid for the main Y-axis
        },
        title: {
          display: true,
          text: 'Cost (USD)',
          color: 'var(--text-secondary)',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div style={{ height: '300px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
