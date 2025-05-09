'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export function RevenueBreakdownChart({ data }) {
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
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
            return ` ${context.label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        },
        displayColors: false,
        padding: 12,
        cornerRadius: 8
      }
    },
    cutout: '70%',
  };

  const chartData = {
    labels: data.map(item => item.payment_method),
    datasets: [{
      data: data.map(item => item.total_revenue),
      backgroundColor: [
        'rgba(99, 102, 241, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)',
      ],
      borderColor: [
        'rgba(99, 102, 241, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)',
      ],
      borderWidth: 1,
    }]
  };

  return <Doughnut options={options} data={chartData} />;
}