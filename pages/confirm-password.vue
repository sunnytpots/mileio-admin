<template>
  <section class="section-login">
    <div class="row">
      <div class="col-lg-6">
        <div class="section-login-white">
          <div class="login-form">
            <div class="login-form-header">
              <n-link class="logo" to="/" />

              <h1 v-text="'איפוס סיסמא'" />
            </div>

            <div class="login-form-body">
              <v-form class="form-ui" @submit.prevent="onReset">
                <v-text-field v-model="form.password" label="סיסמא" filled />
                <v-text-field v-model="form.confirmPassword" label="חזור שנית" filled />
                <n-link :to="{name: 'login'}" class="forgot-password" v-text="'מסך כניסה'" />
                <v-btn class="btn-primary" type="submit" :loading="loading">
                  שחזור
                </v-btn>
              </v-form>
            </div>
          </div>
        </div>
      </div>

      <div class="col-lg-6">
        <div class="section-login-black">
          <div class="login-bg" />
        </div>
      </div>
    </div>

    <SnackbarUi v-model="snackbar" :message="errors" error />
  </section>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'ConfirmPassword',
  layout: 'auth',

  data () {
    return {
      loading: false,
      snackbar: false,

      form: {
        password: '',
        confirmPassword: '',
        token: this.$route.query.token ? this.$route.query.token : null
      }
    }
  },
  computed: {
    ...mapState('auth', ['status']),

    errors: {
      get () {
        return this.$store.state.auth.errors
      },
      set (value) {
        this.$store.commit('auth/setErrors', value)
      }
    }
  },
  watch: {
    status (newIsAuth) {
      newIsAuth && this.$router.push({ name: 'coordinator' })
    },

    errors (newErrors) {
      newErrors && (this.snackbar = true)
    }
  },
  mounted () {
    if (this.$route.query.message === 'login') {
      this.errors = 'You aren\'t authorized'
    }
  },
  methods: {
    async onReset () {
      this.loading = true
      await this.$store.dispatch('auth/resetPassword', this.form)
      this.loading = false
    },

    async user () {
      await this.$store.dispatch('auth/getUser')
    }
  },
  head: { title: 'איפוס סיסמא' }
}
</script>

<style lang="scss" scoped>
.section-login{
  width: 100%;
}
.row{
  margin-top: 0;
  margin-bottom: 0;

  & > * {
    padding-top: 0;
    padding-bottom: 0;
  }
}
.section-login-black{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  padding: 2rem;
  background-color: #1C222A;
}
.section-login-white{
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #fff;
}
.login-bg{
  width: 100%;
  max-width: 841px;
  height: 449px;
  background: url('../assets/images/login-bg.png') no-repeat center;
  background-size: contain;
}
h1 {
  color: #1C222A;
  font-size: 1.3rem;
  margin-bottom: 2rem;
}
.login-form{
  width: 100%;
  max-width: 30.3rem;
}
.login-form-header{
  display: flex;
  flex-direction: column;
  align-items: center;

  .logo{
    width: 148px;
    height: 42px;
    margin-left: 0;
    margin-bottom: 2rem;
    background-image: url('../assets/images/logo-black.png');
  }
}
.form-ui{
  display: flex;
  flex-direction: column;

  ::v-deep {
    .v-text-field__details{
      display: none;
    }

    .v-input{
      margin-bottom: 1rem;
      border-radius: 6px;
    }

    .theme--light.v-text-field--filled > .v-input__control > .v-input__slot {
      background: #F6F6F6;
      min-height: 52px;
    }

    .v-text-field > .v-input__control > .v-input__slot{
      &:before, &:after {
        content: none;
      }
    }

    .theme--light.v-label {
      color: #22272E !important;
    }

    .error--text{
      .v-text-field__details{
        display: flex;
      }
    }
  }
}
.v-btn:not(.v-btn--round).v-size--default.btn-primary{
  height: 63px;
  font-size: 1.3rem;
}
.forgot-password{
  margin-bottom: 1.7rem;
  font-size: .8rem;
  color: #1C222A;
  text-decoration: none;

  &:hover{
    text-decoration: underline;
  }
}
</style>
