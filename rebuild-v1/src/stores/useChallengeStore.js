import { defineStore } from 'pinia';
import { useStorage } from '@vueuse/core';

export const useChallengeStore = defineStore('challenge', {
  state: () => ({
    challenge: useStorage('challenge', {
      startDate: null,
      endDate: null,
      records: []
    }),
    currentRecord: {
      weight: null,
      meals: {
        breakfast: { calories: 0, description: '' },
        lunch: { calories: 0, description: '' },
        dinner: { calories: 0, description: '' },
        snack: { calories: 0, description: '' }
      },
      exercise: { name: '', duration: 0, calories: 0 }
    }
  }),
  getters: {
    remainingDays: (state) => {
      if (!state.challenge.endDate) return 0;
      return Math.ceil((new Date(state.challenge.endDate) - Date.now()) / 86400000);
    },
    chartData: (state) => ({
      labels: state.challenge.records.map(r => r.date),
      datasets: [
        {
          label: '体重 (kg)',
          data: state.challenge.records.map(r => r.weight),
          borderColor: '#4CAF50'
        },
        {
          label: '热量缺口 (kcal)',
          data: state.challenge.records.map(r => r.calorieDeficit),
          borderColor: '#FF6384'
        }
      ]
    })
  },
  actions: {
    initializeChallenge() {
      if (!this.challenge.startDate) return;
      const startDate = new Date(this.challenge.startDate);
      const endDate = new Date(startDate.getTime() + 30 * 86400000);
      this.challenge.endDate = endDate.toISOString();
    },
    submitRecord() {
      const record = {
        ...this.currentRecord,
        date: new Date().toISOString(),
        calorieDeficit: this.calorieDeficit
      };
      this.challenge.records.push(record);
      this.resetCurrentRecord();
    },
    resetCurrentRecord() {
      this.currentRecord = {
        weight: null,
        meals: {
          breakfast: { calories: 0, description: '' },
          lunch: { calories: 0, description: '' },
          dinner: { calories: 0, description: '' },
          snack: { calories: 0, description: '' }
        },
        exercise: { name: '', duration: 0, calories: 0 }
      };
    }
  }
});