import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/styles.css';  // 引入全局样式
alert("已知bug：\n在读档的时候第一次战斗对方会不见，不要慌，只需要自己随便点一个技能然后点一下自己（打一下自己），就会因为对面没有角色而胜利\n（那怎么打敌人就不用说了吧）\n另外，开局自己是裸的，可以装备初始装然后自杀一次哦（要不然会打不过）")
const app = createApp(App);
app.use(createPinia());
app.use(router);
app.mount('#app');