import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import LeaderboardPage from '@/pages/Leaderboard.vue'
import LoginPage from '@/pages/Login.vue'
import TournamentListPage from '@/pages/TournamentList.vue'
import TournamentDetailPage from '@/pages/TournamentDetail.vue'
import ProfilePage from '@/pages/Profile.vue'
import DashboardPage from '@/pages/Dashboard.vue'
import ForbiddenPage from '@/pages/Forbidden.vue'
import NotFoundPage from '@/pages/NotFound.vue'
import { authGuard } from './guards'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'leaderboard',
    component: LeaderboardPage,
  },
  {
    path: '/login',
    name: 'login',
    meta: { guestOnly: true },
    component: LoginPage,
  },
  {
    path: '/tournaments',
    name: 'tournaments',
    component: TournamentListPage,
  },
  {
    path: '/tournaments/:id',
    name: 'tournament-detail',
    component: TournamentDetailPage,
  },
  {
    path: '/profile/:id',
    name: 'profile',
    meta: { requiresAuth: true },
    component: ProfilePage,
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    meta: { requiresAuth: true, requiresAdmin: true },
    component: DashboardPage,
  },
  {
    path: '/forbidden',
    name: 'forbidden',
    component: ForbiddenPage,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundPage,
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(authGuard)
