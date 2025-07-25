'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function TopProductsChart({ data, currency }) {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: {
        display: false,
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
            return ` ${currency}${context.raw.toFixed(2)}`;
          }
        },
        displayColors: false,
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          callback: (value) => `${currency}${value}`,
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 12
          }
        }
      },
    },
  };

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [{
      label: 'Revenue',
      data: data.map(item => item.total_revenue),
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderRadius: 4,
    }]
  };

  return <Bar options={options} data={chartData} />;
}