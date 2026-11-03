export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],
  css: ['~/assets/styles/main.scss'],
  app: {
    head: {
      htmlAttrs: { lang: 'ru' },
      title: 'Заметки',
      meta: [
        { name: 'description', content: 'Личные заметки и списки дел' },
        { name: 'theme-color', content: '#f5f5f7' },
      ],
    },
  },
  typescript: { strict: true, typeCheck: true },
})
