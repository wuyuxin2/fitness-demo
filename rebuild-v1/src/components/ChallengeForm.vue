<template>
    <div class="challenge-panel">
      <h2>30天减脂挑战</h2>
      <div class="control-group">
        <input 
          type="date" 
          v-model="startDate"
          :disabled="hasActiveChallenge"
        >
        <div class="button-group">
          <button 
            @click="startChallenge"
            :disabled="hasActiveChallenge"
          >
            开始挑战
          </button>
          <button 
            @click="giveUpChallenge"
            :disabled="!hasActiveChallenge"
          >
            放弃挑战
          </button>
        </div>
      </div>
      
      <div v-if="hasActiveChallenge" class="status-info">
        <p>剩余天数: {{ remainingDays }}</p>
        <p>当前体重: {{ latestWeight || '暂无记录' }}</p>
      </div>
    </div>
  </template>

  <script setup>
  import { computed } from 'vue';
  import { useChallengeStore } from '../stores/useChallengeStore';

  const store = useChallengeStore();

  const startDate = computed({
    get: () => store.challenge.startDate?.split('T')[0],
    set: (value) => store.challenge.startDate = new Date(value).toISOString()
  });

  const hasActiveChallenge = computed(() => 
    store.challenge.endDate && new Date(store.challenge.endDate) > new Date()
  );

  const startChallenge = () => {
    store.initializeChallenge();
  };

  const giveUpChallenge = () => {
    if (confirm('确定要放弃挑战吗？')) {
      store.$reset();
    }
  };
  </script>