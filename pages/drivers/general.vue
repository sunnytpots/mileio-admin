<template>
  <FormUi
    ref-prop="checkDriverFrom"
    :form="form"
    :v="$v.form"
    :url="driver && driver.uuid ? `driver/update/${driver.uuid}` : 'driver/add'"
    no-btn
    :form-data="driver && !!driver.uuid"
    name="driverData"
    :readonly="!$hasPermission('drivers', 'edit')"
    @submitted="submitted">
    <v-card outlined class="card">
      <v-container>
        <v-row class="top-details-row">
          <v-col cols="6" class="form-title">
            <span class="origin-details">פרטי נהג</span>
            <small>תאריך התחלה: {{ driver.created_at | formatDate }}</small>
          </v-col>
          <v-col
            v-if="driver.branches"
            cols="3"
            style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>סניף</span>
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <span class="data-label" v-bind="attrs" v-on="on">
                  {{ (driver.branches.map(b=> b.name).join(',')).substring(0,40) }}
                  {{ (driver.branches.map(b=> b.name).join(',')).length > 40? '...' : '' }}
                </span>
              </template>
              <div style="max-width: 300px">
                <span>{{ driver.branches.map(b => b.name).join(', ') }}</span>
              </div>
            </v-tooltip>
          </v-col>
          <v-col
            v-if="driver.lines"
            cols="3"
            style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>קו</span>
            <v-tooltip top>
              <template v-slot:activator="{ on, attrs }">
                <span class="data-label" v-bind="attrs" v-on="on">
                  {{ (driver.lines.map(b=> b.name).join(',')).substring(0, 40) }}
                  {{ (driver.lines.map(b=> b.name).join(',')).length > 40 ? '...' : '' }}
                </span>
              </template>
              <div style="max-width: 300px">
                <span>{{ driver.lines.map(b=> b.name).join(', ') }}</span>
              </div>
            </v-tooltip>
          </v-col>
        </v-row>

        <v-row class="form" no-gutters>
          <v-col cols="6" md="5">
            <v-text-field
              v-model="form.first_name"
              label="שם פרטי"
              :rules="driverNameRules"
              dense
              class="input-ui"
              filled
              rounded/>
          </v-col>
          <v-col cols="6" md="5">
            <v-text-field
              v-model="form.last_name"
              label="שם משפחה"
              :rules="driverNameRules"
              dense
              class="input-ui"
              filled
              rounded/>
          </v-col>
          <v-col cols="6" md="5">
            <v-text-field
              v-model="form.identification_id"
              label="תעודת זהות"
              class="input-ui"
              dense
              filled
              rounded/>
          </v-col>
          <v-col cols="6" md="5">
            <v-select
              v-model="form.driver_type"
              clearable
              class="select-ui"
              filled
              rounded
              dense
              :items="driverTypes"
              item-text="text"
              item-value="value"
              label="סוג עובד"
              :rules="driverTypeRules">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-select>
          </v-col>

          <v-col cols="6" md="5">
            <v-text-field
              v-model="form.hp"
              label="ח.פ"
              dense
              class="input-ui"
              filled
              rounded/>
          </v-col>
          <v-col cols="6" md="5">
            <v-text-field
              v-model="form.invoice_name"
              label="שם חשבונית"
              dense
              class="input-ui"
              filled
              rounded/>
          </v-col>
          <v-col cols="6" md="5">
            <v-text-field
              v-model="form.accounting_number"
              label="מספר הנהלת חשבונות"
              dense
              class="input-ui"
              filled
              rounded/>
          </v-col>

          <v-col cols="6" md="5">
            <v-text-field
              v-model="form.mobile"
              label="מספר טלפון"
              :rules="mobileRules"
              class="input-ui"
              dense
              filled
              rounded/>
          </v-col>
          <v-col cols="6" md="5">
            <v-text-field
              v-model="form.address"
              label="כתובת מגורים"
              :rules="addressRules"
              class="input-ui"
              dense
              filled
              rounded/>
          </v-col>
          <v-col cols="6" md="5">
            <v-autocomplete
              v-model="form.city_id"
              clearable
              class="autocomplete-ui"
              filled
              rounded
              :loading="loadingCity"
              :items="citiesArray"
              :search-input.sync="searchCity"
              cache-items
              label="עיר מגורים"
              item-text="city_name"
              item-value="id">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="6" md="5">
            <v-select
              v-model="form.mobile_type"
              clearable
              class="select-ui"
              filled
              rounded
              :items="['android','ios']"
              :item-text="driver.mobile_type"
              :item-value="driver.mobile_type"
              label="סוג טלפון">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-select>
          </v-col>
          <v-col cols="6" md="5">
            <v-menu :close-on-content-click="false" transition="scale-transition" offset-y>
              <template #activator="{ on, attrs }">
                <v-text-field
                  v-model="birthDateFormatted"
                  class="input-ui"
                  dense
                  filled
                  rounded
                  :rules="birthDateRules"
                  label="תאריך לידה"
                  readonly
                  v-bind="attrs"
                  v-on="on"/>
              </template>
              <v-date-picker v-model="form.birthdate"/>
            </v-menu>
          </v-col>
        </v-row>
      </v-container>
      <span style="display: flex; justify-content: center;">
        <i class="icon icon-arrow" />
      </span>
    </v-card>
    <v-card class="card" outlined>
      <v-container>
        <v-row>
          <v-col cols="12" md="8" class="form-title">
            <span class="origin-details">פרטי רכב ואיזור חלוקה</span>
          </v-col>
          <v-col cols="12" md="4">
            <span class="show-map">
              <i class="icon icon-points position-driver-icon" />
              <span>הצג מיקום</span>
            </span>
          </v-col>
        </v-row>
        <v-row class="form" no-gutters>
          <v-col cols="12" md="5">
            <v-autocomplete
              v-model="form.car_type"
              clearable
              class="autocomplete-ui"
              filled
              rounded
              :items="car_types"
              item-text="value"
              item-value="key"
              label="סוג רכב">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="form.car_number"
              class="input-ui"
              dense
              filled
              rounded
              label="מספר רכב"
              :error-messages="$v.$dirty && $v.form.car_number.$invalid && 'max 9 digits' || ''"/>
          </v-col>
          <v-col cols="12" md="5">
            <v-row>
              <v-col>
                <v-autocomplete
                  v-model="form.branches"
                  clearable
                  :class="{'combobox-ui': !(form.branches && form.branches.length > 0), 'combobox-ui-open': (form.branches && form.branches.length > 0)}"
                  filled
                  rounded
                  multiple
                  :disabled="chooseAllBranches"
                  :items="branches"
                  item-text="name"
                  item-value="uuid"
                  label="איזורי עבודה"
                  @change="changeBranch">
                  <template v-slot:append>
                    <i class="icon icon-arrowSelect"/>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col>
                <v-checkbox
                  v-if="branches && branches.length > 0"
                  v-model="chooseAllBranches"
                  label="כל איזורי העבודה"/>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" md="5">
            <v-row>
              <v-col>
                <v-autocomplete
                  v-model="formLines"
                  clearable
                  :class="{'combobox-ui': !(formLines && formLines.length > 0), 'combobox-ui-open': (formLines && formLines.length > 0)}"
                  filled
                  rounded
                  multiple
                  :disabled="chooseAllLines"
                  :items="lines"
                  item-text="line_number"
                  item-value="uuid"
                  label="קווים"
                  @change="linesChanged = true">
                  <template v-slot:append>
                    <i class="icon icon-arrowSelect"/>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col>
                <v-checkbox
                  v-if="lines && lines.length > 0"
                  v-model="chooseAllLines"
                  label="כל הקווים"/>
              </v-col>
            </v-row>
          </v-col>
          <v-col cols="12" md="5">
            <v-text-field
              v-model="form.car_capacity"
              label="קיבולת"
              class="input-ui"
              dense
              filled
              rounded
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </FormUi>
</template>

<script>
import _ from 'lodash'
import { mapGetters, mapState } from 'vuex'
import { maxLength } from 'vuelidate/lib/validators'
import moment from 'moment'

export default {
  name: 'DriversGeneral',

  props: {
    driver: { type: Object, default: () => ({}) },
    submitStatus: { type: Object, default: null },
    driverLogo: { default: null }
  },

  async fetch ({ store }) {
    store.commit('setDrawerUi', true)
    await store.dispatch('global/getCities')
  },
  data () {
    return {
      driverTypes: [
        { text: 'קבלן', value: 'contractor' },
        { text: 'עובד', value: 'employee' }
      ],
      chooseAllBranches: false,
      chooseAllLines: false,
      firstMount: true,
      formLines: null,
      statusForm: 'not_active',
      loadingCity: false,
      linesChanged: false,
      searchCity: '',
      citiesArray: [],
      lines: [],
      car_types: [
        { key: 'private', value: 'רגיל' },
        { key: 'truck', value: 'משאית' },
        { key: 'scooter', value: 'קטנוע' },
        { key: 'ducto', value: 'דוקטו' }
      ],
      form: {
        first_name: null,
        last_name: null,
        identification_id: null,
        status: 'not_active',
        driver_type: null,
        mobile_type: null,
        address: null,
        mobile: null,
        city_id: null,
        car_id: 1,
        car_number: null,
        birthdate: null,
        car_type: null,
        car_capacity: null,
        base64_logo: null,
        branches: null,
        lines: null,
        hp: null,
        invoice_name: null,
        accounting_number: null
      },
      fetchUrl: null,
      mobileRules: [
        v => !!v || 'שדה חובה',
        v => (v && v.length === 10) || 'שדה לא תקין',
        v => /^[0-9]+$/.test(v) || 'שדה לא תקין'
      ],
      addressRules: [
        v => !!v || 'שדה חובה',
        v => typeof v === 'string' || 'שדה לא תקין',
        v => (v && v.trim() !== '') || 'שדה לא תקין'
      ],
      birthDateRules: [
        v => !!v || 'שדה חובה'
      ],
      driverTypeRules: [
        v => !!v || 'שדה חובה'
      ],
      driverNameRules: [
        v => !!v || 'שדה חובה'
      ]
    }
  },
  computed: {
    ...mapState('global', ['branches', 'url']),
    ...mapState('drivers', ['status']),
    ...mapGetters('auth', ['customer']),

    birthDateFormatted () {
      const birthDate = this.form?.birthdate
      if (birthDate?.includes('-')) {
        return moment(birthDate).format('DD-MM-YYYY')
      } else if (birthDate?.includes('/')) {
        const res = birthDate.replaceAll('/', '-')
        return moment(res).format('DD-MM-YYYY')
      }
      return birthDate
    }
  },
  watch: {
    chooseAllBranches (newVal) {
      if (newVal) {
        this.form.branches = this.branches
      } else {
        this.form.branches = []
        this.formLines = []
        this.chooseAllLines = false
        this.form.lines = []
      }
      return this.changeBranch()
    },
    chooseAllLines (newVal) {
      if (newVal) {
        this.formLines = this.lines.map(l => l.uuid)
        this.form.lines = this.formLines
      } else {
        this.formLines = []
        this.form.lines = []
      }
    },
    driverLogo (newValue) {
      if (newValue) {
        this.form.base64_logo = newValue
      }
    },
    searchCity (val) {
      if (val) {
        this.queryCities(val)
      }
    },
    formLines (newValue, oldValue) {
      if (!this.linesChanged) {
        return
      }
      this.form.lines = newValue
    }
  },
  async created () {
    try {
      if (!this.driver.uuid) {
        return
      }

      Object.keys(this.form).forEach(key => !['lines', 'branches'].includes(key) ? this.form[key] = this.driver[key] : null)
      this.formLines = this.form.lines
      this.form.branches = this.driver.branches
      if (this.driverLogo) {
        this.form.base64_logo = this.driverLogo
      }

      this.citiesArray = [{
        id: this.driver?.city ? this.driver.city.id : null,
        city_name: this.driver?.city ? this.driver.city.city_name : null
      }]
      this.form.user = { id: null, password: null, email: null }
      if (this.form.branches?.length > 0) {
        await this.changeBranch()
      }

      if (this.driver?.status !== this.statusForm) {
        this.statusForm = this.driver.status
        this.$nuxt.$emit('driverFormStatus', this.statusForm)
      }
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },

  methods: {
    queryCities: _.debounce(async function () {
      if (!this.searchCity || this.searchCity === '') {
        return
      }

      this.citiesArray = await this.$cityService.list({ chars: this.searchCity })
    }, 500),
    submitted (value) {
      if (value.status) {
        this.form = {}
        this.$router.push({ name: this.$route.matched[0].name })
        this.$store.commit('setDrawerUi', false)
      }
    },
    async changeBranch () {
      try {
        let tempBranches = []
        if (typeof this.form.branches?.[0] !== 'string') {
          this.form.branches.forEach(branch => tempBranches.push(branch.uuid))
        } else {
          tempBranches = this.form.branches
        }

        const linesRes = await this.$polygonLinesService.findByBranches({ branches: tempBranches })

        this.lines = [...linesRes]
        if (this.driver?.lines) {
          const existsLines = []
          for (const line of linesRes) {
            for (const driverLine of this.driver.lines) {
              if (line.id === driverLine.id) {
                existsLines.push(driverLine.uuid)
              }
            }
          }
          this.formLines = existsLines
        }
      } catch (e) {
        this.$helper.snackbar(e, 'changeBranch')
      }
    }
  },

  validations: {
    form: {
      car_number: {
        maxLength: maxLength(9)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.form{
  justify-content: space-between;
  display: flex;
  margin: 1rem 2rem;
}
.top-details-row{
  border-bottom: 1px solid rgb(228, 228, 228);
  .data-label{
    display: block;
    font-size: 16px;

  }
}
.origin-details{
  color: #38a8cd;
}
.form-title{
  border-left: 1px solid rgb(228, 228, 228);
  padding-right: 25px;
}
.card{
  border-radius: 10px;
  margin-bottom: 15px;
  background: #ffffff;
}
.input-ui, .select-ui, .autocomplete-ui {
  margin: 7.5px 0px;
  ::v-deep .v-messages__message {
    line-height: 7px;
  }
}
</style>
