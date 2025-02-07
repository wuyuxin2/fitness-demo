<template>
    <div class="chart-container">
      <Line :data="chartData" :options="options" />
    </div>
  </template>

  <script setup>
  import { Line } from 'vue-chartjs';
  import { useChallengeStore } from '../stores/useChallengeStore';

  const store = useChallengeStore();

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        title: { display: true, text: '体重 (kg)' }
      },
      y1: {
        position: 'right',
        title: { display: true, text: '热量缺口 (kcal)' }
      }
    }
  };
  </script>