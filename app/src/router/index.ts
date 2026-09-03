import routes from './routes';
import { defineRouter as route } from '#q-app/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { useAuthStore } from 'src/stores/auth-store';

export default route(function ({ store }) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
    ? createWebHistory
    : createWebHashHistory;

  const Router = createRouter({
    scrollBehavior: (to, from) => {
      if (to.path !== from.path) {
        return { left: 0, top: 0 };
      }
    },
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  Router.beforeEach(async (to) => {
    const authStore = useAuthStore(store);
    await authStore.waitUntilReady();

    if (to.meta.needsAuth && !authStore.isAuthenticated) {
      return { path: '/login', query: { redirect: to.fullPath } };
    }

    if (to.path === '/login' && authStore.isAuthenticated) {
      return { path: '/' };
    }

    return true;
  });

  return Router;
});
