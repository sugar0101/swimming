import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('src/pages/login/LoginPage.vue'),
  },
  {
    // Pública: se comparte el enlace para instalar el APK en Android.
    path: '/download/app',
    component: () => import('src/pages/download/DownloadPage.vue'),
  },
  {
    path: '/',
    component: () => import('src/layouts/MainLayout.vue'),
    meta: { needsAuth: true },
    children: [
      {
        path: '',
        name: 'students',
        component: () => import('src/pages/StudentsPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    name: 'NotFound',
    component: () => import('src/pages/ErrorNotFound.vue'),
  },
];

export default routes;
