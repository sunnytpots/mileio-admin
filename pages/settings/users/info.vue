<template>
  <div class="user-info">
    <FormUi
      :form="form"
      :v="$v"
      store="systemUsers"
      dispatch="create_Or_Update"
      no-btn
      name="settings-users-info"
      ref-prop="checkUserCreation"
      :readonly="!$hasPermission('settings-users', 'edit')"
      @submitted-no-url="submitted">
      <div class="card-gray">
        <div class="container">
          <div class="row no-gutters-y">
            <div class="col-md-6">
              <v-text-field
                v-model="form.first_name"
                label="שם פרטי"
                class="input-ui"
                filled
                rounded
                :error-messages="errMsg('first_name')" />
            </div>

            <div class="col-md-6">
              <v-text-field
                v-model="form.last_name"
                label="שם משפחה"
                class="input-ui"
                filled
                rounded
                :error-messages="errMsg('last_name')" />
            </div>

            <div class="col-md-6">
              <v-text-field
                v-model="form.mobile"
                v-mask="'##########'"
                label="טלפון נייד"
                class="input-ui"
                filled
                rounded
                :error-messages="errMsg('mobile')" />
            </div>

            <div class="col-md-6">
              <v-text-field
                v-if="!user"
                v-model="form.password"
                label="סיסמא"
                type="password"
                class="input-ui"
                filled
                rounded
                :rules="passwordRules"/>
            </div>

            <div class="col-md-6">
              <v-text-field
                v-model="form.email"
                label="אימייל"
                class="input-ui"
                filled
                rounded
                :error-messages="errMsg('email')" />
            </div>

            <div class="col-md-6">
              <v-autocomplete
                v-model="form.level_id"
                clearable
                :items="levels"
                label="רמת משתמש"
                item-text="name"
                item-value="id"
                class="autocomplete-ui"
                filled
                rounded
                :error-messages="errMsg('level_id')">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </div>

            <div class="col-md-6">
              <v-autocomplete
                v-model="form.branches"
                clearable
                :items="branches"
                label="סניפים"
                item-text="name"
                item-value="id"
                multiple
                :class="{'combobox-ui': !(form.branches && form.branches.length > 0), 'combobox-ui-open': (form.branches && form.branches.length > 0)}"
                filled
                rounded
                :error-messages="errMsg('branches')" >
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </div>
            <div class="col-md-6">
              <v-checkbox
                v-model="form.master_permission"
                label="הרשאה לסניף מאסטר" />
            </div>
          </div>
        </div>
      </div>
    </FormUi>
  </div>
</template>

<script>
import { mask } from 'vue-the-mask'
import { mapGetters, mapState } from 'vuex'
import { required, email } from 'vuelidate/lib/validators'

export default {
  name: 'SettingsUsersInfo',

  directives: { mask },

  props: {
    user: { type: Object, default: null }
  },

  async asyncData ({ $levelService, $helper, store }) {
    try {
      store.commit('setDrawerUi', true)
      const levels = await $levelService.list()
      return { levels }
    } catch (e) {
      $helper.snackbar(e, 'asyncData')
    }
  },

  data (vc) {
    return {
      levels: [],
      form: {
        first_name: vc.user ? vc.user.first_name : '',
        last_name: vc.user ? vc.user.last_name : '',
        email: vc.user ? vc.user.email : '',
        mobile: vc.user ? vc.user.mobile : '',
        password: vc.user ? vc.user.password : '',
        level_id: null,
        is_active: true,
        master_permission: vc.user ? vc.user.master_permission : false,
        branches: []
      },
      passwordRules: [
        v => !!v || 'שדה חובה',
        v => (v && v.length > 5) || 'על הסיסמא להיות באורך של לפחות 6 תויים'
      ]
    }
  },

  computed: {
    ...mapGetters('auth', ['customer']),
    ...mapState('global', ['branches']),
    ...mapState('systemUsers', ['status', 'errors'])
  },
  watch: {},
  created () {
    if (this.user) {
      if (this.user.level) {
        this.form.level_id = this.levels.find(level => this.user.level.key === level.key).id
      }
      this.form.branches = this.user.branches.length ? this.user.branches.map(branch => branch.id) : []
      this.form.id = this.user.id
    }
  },
  methods: {
    submitted () {
      this.$store.commit('setDrawerUi', false)
      return this.$router.push({ name: this.$route.matched[0].name })
    }
  },
  validations: {
    form: {
      first_name: { required },
      last_name: { required },
      email: { email, required },
      mobile: { required },
      level_id: { required },
      branches: {}
    }
  }
}
</script>

<style lang="scss" scoped>
.card-gray{
  background-color: white;
}
.user-info{
  ::v-deep{
    .input-ui, .combobox-ui, .combobox-ui-open, .autocomplete-ui{
      margin-top: 15px;
    }
    .v-input__slot {
      margin-bottom: 0;
    }
  }
}
</style>
