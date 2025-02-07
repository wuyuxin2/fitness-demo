import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import './assets/main.css'; // 引入样式

const app = createApp(App);
app.use(createPinia());
app.mount('#app');