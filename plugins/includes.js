import Vue from 'vue'
import Vuelidate from 'vuelidate'
import moment from 'moment'
import vueTabevents from 'vue-tabevents'

Vue.use(Vuelidate)
Vue.use(vueTabevents)

Vue.filter('formatDate', (value, format) => value && moment(value).format(format || 'DD/MM/YYYY HH:MM'))
Vue.filter('formatDate2', (value, format) => value && moment(value).format(format || 'DD/MM/YYYY HH:mm'))
Vue.filter('formatDateIsraelTimeZone', (value, format) => value && moment(value).utcOffset('+0100').format(format || 'DD/MM/YYYY HH:mm'))

Vue.mixin({
  methods: {
    path (file) {
      return process.env.NUXT_ENV_FILE_URL + '/' + file
    },

    errMsg (field) {
      if (Array.isArray(field)) {
        console.log('this.$v', this.$v)
        if (this.$v.$dirty && this.$v.form[field[0]][field[1]].$invalid) {
          if (this.$v.form[field[0]][field[1]].required === false) {
            return 'חובה'
          }
          if (this.$v.form[field[0]][field[1]].minLength === false) {
            return 'minLength'
          }
          if (this.$v.form[field[0]][field[1]].email === false) {
            return 'email'
          }
        }
      }

      if (typeof field === 'string') {
        if (this.$v.$dirty && this.$v.form[field].$invalid) {
          if (this.$v.form[field].required === false) {
            return 'חובה'
          }
          if (this.$v.form[field].minLength === false) {
            return 'minLength'
          }
          if (this.$v.form[field].email === false) {
            return 'email'
          }
        }
      }

      return undefined
    }
  }
})
