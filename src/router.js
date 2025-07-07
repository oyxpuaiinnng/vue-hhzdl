import { createRouter, createWebHistory } from 'vue-router';
import Home from './pages/Home.vue';
import Settings from './pages/Settings.vue';

const routes = [
  { path: '/', component: Home },
  { path: '/settings', component: Settings }
];

export default createRouter({
    history: createWebHistory('/vue-hhzdl/'), // 注意 base 匹配 vite.config.js
    routes: [
      { path: '/', component: Home },
      { path: '/settings', component: Settings }
    ]
  });
  