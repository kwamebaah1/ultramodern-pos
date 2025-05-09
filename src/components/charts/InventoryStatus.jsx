'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export function InventoryStatus({ data }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 16,
          font: {
            size: 12
          },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 12
        },
        callbacks: {
          label: (context) => {
            const total = context.dataset.data.reduce((acc, curr) => acc + curr, 0);
            const value = context.raw;
            const percentage = Math.round((value / total) * 100);
            return ` ${context.label}: ${value} (${percentage}%)`;
          }
        },
        displayColors: false,
        padding: 12,
        cornerRadius: 8
      }
    },
    cutout: '70%',
  };

  return <Doughnut options={options} data={data} />;
}