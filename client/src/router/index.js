import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/pages/HomePage.vue'
import AnalysisPage from '@/pages/AnalysisPage.vue'
import TheoryPage from '@/pages/TheoryPage.vue'
import TheoryEditorPage from '@/pages/TheoryEditorPage.vue'
import GamesPage from '@/pages/GamesPage.vue'
import NotFound from '@/pages/NotFound.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomePage,
    },
    {
      path: '/analysis',
      name: 'analysis',
      component: AnalysisPage,
    },
    {
      path: '/theory',
      name: 'theory',
      component: TheoryPage
    },
    {
      path: '/theory-editor',
      name: 'theory-editor',
      component: TheoryEditorPage,
      props: true,
    },
    {
      path: '/games',
      name: 'games',
      component: GamesPage
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'NotFound',
      component: NotFound, 
    },
  ],
})

export default router
