<template>
  <section class="section-login">
    <div class="row">
      <div class="col-lg-6">
        <div class="section-login-white">
          <div class="login-form">
            <div class="login-form-header">
              <n-link class="logo" to="/" />

              <h1 v-text="'שכחתי סיסמא'" />
            </div>

            <div class="login-form-body">
              <FormUi
                :form="{ form, typeUrl: typeField === 'otpCode' ? 'first-login' : 'login' }"
                store="auth"
                dispatch="login"
                btn-text="התחבר"
                :route-to="{ name: 'coordinator' }"
                :no-btn="!(typeField === 'password' || isOtpValid) || disableButton"
                :refProp="'checkPassword'"
              >
                <v-text-field v-model="form.mobile" v-mask="'##########'" label="מספר נייד" filled />

                <span v-if="typeField === 'otpCode'">הכנס קוד שנשלח בהודעה</span>
                <v-text-field v-if="typeField === 'otpCode'" v-model="form.otpCode" v-mask="'####'" label="Otp code" filled />

<!--                <p v-if="typeField === 'otpCode' && code" v-text="`otp code: ${code}`" />-->

                <v-text-field
                  v-if="typeField === 'password' || isOtpValid"
                  v-model="form.password"
                  type="password"
                  :label="typeField === 'password' ? 'סיסמה' : 'סיסמה חדשה'"
                  filled
                  :rules="passwordRules"
                />

                <v-text-field
                  v-if="isOtpValid"
                  v-model="form.passwordConfirmation"
                  type="password"
                  label="חזור על הסיסמה"
                  filled
                  :rules="passwordRules"/>

                <span class="password-not-match" v-if="isPasswordsNotMatch">על אימות הסיסמה להיות תואם לסיסמה</span>

                <n-link v-if="typeField === 'password'" :to="{ name: 'login' }" class="forgot-password" v-text="'מסך התחברות'" />
              </FormUi>

              <!--              <v-form class="form-ui" @submit.prevent="onRestore">-->
<!--                <v-text-field v-model="form.mobile" label="טלפון נייד" filled />-->
<!--                <n-link to="/login" class="forgot-password" v-text="'מסך כניסה'" />-->
<!--                <v-btn class="btn-primary" type="submit" >-->
<!--                  שחזור-->
<!--                </v-btn>-->
<!--              </v-form>-->
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

<!--    <SnackbarUi v-model="snackbar" :message="errors" error />-->
  </section>
</template>

<script>
import { mapState } from 'vuex'
import _ from 'lodash'
import { mask } from 'vue-the-mask'

export default {
  name: 'ForgotPassword',

  layout: 'auth',
  directives: { mask },

  data () {
    return {
      isPasswordsNotMatch: false,
      disableButton: true,
      typeField: '', // [password, otpCode]
      isOtpValid: false,
      // code: '',

      form: {
        mobile: '',
        password: '',
        passwordConfirmation: '',
        otpCode: ''
      },
      passwordRules: [
        v => !!v || 'שדה חובה',
        v => (v && v.length >= 6) || 'על הסיסמה להיות באורך של 6 תווים לפחות'
      ]
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
    'form.password': {
      handler (newValue) {
        this.checkPasswords()
      }
    },
    'form.passwordConfirmation': {
      handler (newValue) {
        this.checkPasswords()
      }
    },
    errors (newErrors) {
      newErrors && this.$store.commit('setSnackbar', { value: true, message: newErrors, error: true })
    },
    'form.mobile': {
      handler (newMobile) {
        if (newMobile && newMobile.length === 10) {
          this.onRestore()
        } else {
          this.typeField = ''
          this.isOtpValid = false
          this.form.otpCode = ''
          this.form.password = ''
          this.form.password = ''
          this.form.passwordConfirmation = ''
        }
      }
    },
    'form.otpCode': {
      handler (newOtpCode) {
        if (newOtpCode) {
          this.checkOtpCode()
        } else {
          this.isOtpValid = false
          this.form.password = ''
          this.form.password = ''
          this.form.passwordConfirmation = ''
        }
      }
    }
  },
  mounted () {
    if (this.$route.query.message === 'login') {
      this.errors = 'You aren\'t authorized'
    }
  },
  methods: {
    checkMobile: _.debounce(async function () {
      this.errors = ''

      try {
        const response = await this.$authService.checkAuthMobile({ mobile: this.form.mobile })
        this.typeField = response.verified ? 'password' : 'otpCode'
        // this.code = response.otpCode
      } catch (e) {
        this.typeField = ''
        this.isOtpValid = false
        this.errors = e.response.data.message
      }
    }, 500),
    checkOtpCode: _.debounce(async function () {
      this.errors = ''

      try {
        const response = await this.$authService.checkAuthOtpCode({
          mobile: this.form.mobile,
          otpCode: this.form.otpCode
        })
        response.status && (this.isOtpValid = true)
      } catch (e) {
        this.isOtpValid = false
        this.errors = e.response.data.message
      }
    }, 500),
    checkPasswords () {
      if (!this.isOtpValid) {
        this.disableButton = false
        return
      }
      if (!this.form.password || !this.form.passwordConfirmation) {
        this.disableButton = true
      } else if (this.form.password !== this.form.passwordConfirmation) {
        this.isPasswordsNotMatch = true
        this.disableButton = true
      } else if (this.form.password.length < 6 || this.form.passwordConfirmation.length < 6) {
        this.isPasswordsNotMatch = false
        this.disableButton = true
      } else {
        this.isPasswordsNotMatch = false
        this.disableButton = false
      }
    },
    async onRestore () {
      // this.loading = true
      const response = await this.$authService.forgotPassword({
        mobile: this.form.mobile,
        userType: 'systemUser'
      })
      console.log('response', response)
      this.typeField = response.verified ? 'password' : 'otpCode'
      // this.code = response.otpCode
      // this.loading = false
    },

    async user () {
      await this.$store.dispatch('auth/getUser')
    }
  },
  head: { title: 'שכחתי סיסמא' }
}
</script>

<style lang="scss" scoped>
.password-not-match {
  color: red;
}
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
    height: 70px;
    margin-left: 0;
    margin-bottom: 1rem;
    background-image: url('../assets/images/tapuz-logo.png');
    //background-image: url('../assets/images/logo-black.png');
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
