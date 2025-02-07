<template>
    <div class="record-form">
      <h3>每日记录</h3>
      <input v-model.number="currentRecord.weight" type="number" placeholder="体重（kg）">
      <div v-for="(meal, index) in currentRecord.meals" :key="index">
        <input v-model.number="meal.calories" type="number" placeholder="热量">
        <input v-model="meal.description" type="text" placeholder="食物描述">
      </div>
      <button @click="submitRecord">提交记录</button>
    </div>
  </template>

  <script setup>
  import { useChallengeStore } from '../stores/useChallengeStore';

  const store = useChallengeStore();

  const submitRecord = () => {
    store.submitRecord();
  };
  

   // 直接引用currentRecord
   const currentRecord = store.currentRecord;
  </script>