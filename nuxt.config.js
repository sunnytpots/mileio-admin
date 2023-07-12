import colors from 'vuetify/es5/util/colors'

export default {
  // debug :true,
  /*
  ** Nuxt rendering mode
  ** See https://nuxtjs.org/api/configuration-mode
  */
  ssr: true,
  /*
  ** Nuxt target
  ** See https://nuxtjs.org/api/configuration-target
  */
  target: 'server',
  /*
  ** Nuxt env
  ** See https://nuxtjs.org/api/configuration-env
  */
  env: {
    baseUrl: process.env.NUXT_ENV_BASE_URL
  },
  /*
  ** Headers of the page
  ** See https://nuxtjs.org/api/configuration-head
  */
  head: {
    titleTemplate: '%s | ' + 'תפוז משלוחים',
    title: process.env.npm_package_name || '',
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.npm_package_description || '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
    ]
  },
  loading: {
    color: '#FF3366'
  },
  /*
  ** Global CSS
  */
  css: [
    '@/node_modules/@fortawesome/fontawesome-free/css/all.css',
    '@/node_modules/animate.css/animate.min.css',
    '~assets/css/style.scss',
    '~assets/css/responsive.scss'
  ],
  /*
  ** Plugins to load before mounting the App
  ** https://nuxtjs.org/guide/plugins
  */
  plugins: [
    '~plugins/axios',
    '~plugins/includes',
    '~plugins/hasPermission',
    '~plugins/helper',
    '~plugins/apis'
  ],
  /*
  ** Auto import components
  ** See https://nuxtjs.org/api/configuration-components
  */
  components: true,

  router: {
    prefetchLinks: false,
    middleware: 'auth'
  },
  /*
  ** Nuxt.js dev-modules
  */
  buildModules: [
    // Doc: https://github.com/nuxt-community/eslint-module
    // '@nuxtjs/eslint-module',
    '@nuxtjs/vuetify'
  ],
  /*
  ** Nuxt.js modules
  */
  modules: [
    // Doc: https://axios.nuxtjs.org/usage
    '@nuxtjs/axios',
    'nuxt-socket-io',
    ['nuxt-gmaps', {
      key: 'AIzaSyCrYTJBJrV5CYhkni58W-vAxFt_BLAcfuM',
      libraries: ['places', 'drawing', 'geometry']
    }]
  ],
  /*
  ** Axios module configuration
  ** See https://axios.nuxtjs.org/options
  */
  axios: {
    baseURL: process.env.NUXT_ENV_API_URL
  },
  /*
  ** vuetify module configuration
  ** https://github.com/nuxt-community/vuetify-module
  */
  vuetify: {
    rtl: true,
    customVariables: ['~/assets/css/variables.scss'],
    theme: {
      dark: false,
      light: {
        primary: '#FF3366'
      }
    }
  },
  /*
  ** Build configuration
  ** See https://nuxtjs.org/api/configuration-build/
  */
  build: {
    transpile: [/^vue2-google-maps($|\/)/]
  },
  io: {
    // module options
    sockets: [
      {
      name: 'main',
      url: process.env.NUXT_ENV_API_URL,
      default: true
    },
    { name: 'adminSocket', url: 'http://localhost:3001' },
    ]
  }
}
