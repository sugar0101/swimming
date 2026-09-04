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
      // El resumen es la pantalla principal.
      { path: '', redirect: '/resumen' },
      {
        path: 'alumnos',
        name: 'students',
        component: () => import('src/pages/StudentsPage.vue'),
      },
      {
        path: 'resumen',
        name: 'analytics',
        component: () => import('src/pages/AnalyticsPage.vue'),
      },
      {
        path: 'asistencias',
        name: 'attendance',
        component: () => import('src/pages/AttendancePage.vue'),
      },
      {
        path: 'pagos',
        name: 'payments',
        component: () => import('src/pages/PaymentsPage.vue'),
      },
      {
        path: 'configuracion',
        name: 'settings',
        component: () => import('src/pages/SettingsPage.vue'),
      },
    ],
  },

  // El detalle del alumno es una pantalla propia, sin la navegación azul.
  {
    path: '/alumnos/:id',
    component: () => import('src/layouts/BareLayout.vue'),
    meta: { needsAuth: true },
    children: [
      {
        path: '',
        name: 'student-detail',
        component: () => import('src/pages/StudentDetailPage.vue'),
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
