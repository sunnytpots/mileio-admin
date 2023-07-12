<template>
  <FormUi
    :form="form"
    :url="customer && customer.uuid ? `customers/update/${customer.uuid}` : 'customers/add'"
    ref-prop="customersGeneral"
    no-btn
    :form-data="customer && !!customer.uuid"
    name="customerData"
    :readonly="!$hasPermission('settings-customers-general', 'edit')"
    @submitted="submitted">
    <v-card outlined class="card">
      <v-container>
        <v-row v-if="customer" class="top-details-row">
          <v-col cols="4" class="form-title">
            <span class="origin-details">פרטי חברה</span>
            <small v-if="customer">תאריך הצטרפות: {{ customer.created_at | formatDate }}</small>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>ממוצע יומי</span>
            <span class="data-label">-</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>ממוצע חודשי</span>
            <span class="data-label">-</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>סניף</span>
            <span class="data-label">-</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>קו</span>
            <span class="data-label">-</span>
          </v-col>
        </v-row>

        <v-row class="row-form" style="justify-content: space-around;" no-gutters>
          <v-col cols="5">
            <v-text-field
              v-model="form.name"
              label="שם חברה"
              :rules="requiredRule"/>
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model="form.hp"
              label="ח.פ/עוסק מורשה"
              :rules="requiredRule"/>
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model="form.customer_number"
              label="מספר לקוח"
              :rules="requiredRule"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.address"
              label="כתובת משרדים"
              :rules="requiredRule"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.phone"
              label="טלפון משרדים"
              :rules="requiredRule"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.fax"
              label="פקס" />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.email"
              label="אימייל" />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.bookkeeping_number"
              label="מספר הנהלת חשבונות" />
          </v-col>
          <v-col cols="5">
            <v-switch
              v-model="form.api_permission"
              label="הרשאת API"
              color="red"
              hide-details/>
          </v-col>
          <v-col cols="5">
            <v-text-field v-model="form.comment" label="הערות" />
          </v-col>
          <v-col cols="5">
            <v-switch
              v-model="form.paying_customer"
              label="לקוח אב"
              color="rgb(250, 70, 22)"
              hide-details/>
          </v-col>
          <v-col v-if="form.paying_customer" cols="5">
            <v-autocomplete
              v-model="form.sub_customers"
              clearable
              multiple
              :items="customers"
              item-text="name"
              item-value="id"
              label="בחירת לקוחות משניים"
              :rules="subCustomersRules"
              :search-input.sync="selectSubCustomer"/>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
    <v-card class="card" outlined>
      <v-container>
        <v-row>
          <v-col cols="8" class="form-title">
            <span class="origin-details">כתובת איסוף</span>
          </v-col>
          <v-col cols="4">
            <span class="show-map">
              <i class="icon icon-points position-driver-icon" />
              <span>הצג מיקום</span>
            </span>
          </v-col>
        </v-row>
        <v-row class="row-form" style="justify-content: space-around;" no-gutters>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_city"
              label="עיר"
              :rules="requiredRule"/>
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model="form.target_street_name"
              label="כתובת יעד"
              :rules="requiredRule"/>
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model.number="form.target_street_number"
              label="מספר בית"
              :rules="requiredRule"/>
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.branches"
              clearable
              multiple
              :items="branches"
              item-text="name"
              item-value="id"
              label="איזורי עבודה"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.daily_pickup_quantity"
              label="כמות איסופים יומי"/>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
    <v-card class="card" outlined>
      <v-container>
        <v-row>
          <v-col cols="8" class="form-title">
            <span class="origin-details">מידע נוסף</span>
          </v-col>
        </v-row>
        <v-row class="row-form" style="justify-content: space-around;" no-gutters>
          <v-col cols="5">
            <v-text-field
              v-model="form.platform_type"
              label="סוג פלטפורמה"/>
          </v-col>
          <v-col cols="5"/>
        </v-row>
        <v-row class="row-form" style="justify-content: space-around;" no-gutters>
          <v-col cols="5">
            <v-text-field
              v-model="form.technical_contact_name"
              label="שם איש קשר טכני"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.technical_contact_phone"
              label="טלפון איש קשר טכני"/>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </FormUi>
</template>

<script>
import { mapState } from 'vuex'
import _ from 'lodash'

export default {
  name: 'SettingsCustomersGeneral',

  props: {
    customer: { type: Object, default: null },
    bannerUrl: { type: String, default: null },
    customerBanner: { default: null },
    customerLogo: { default: null }
  },

  fetch ({ store }) {
    store.dispatch('global/getBranchList')
    store.commit('setDrawerUi', true)
  },
  data () {
    return {
      requiredRule: [
        v => !!v || 'שדה חובה'
      ],
      form: {
        name: null,
        status: true,
        customer_number: null,
        hp: null,
        address: null,
        phone: null,
        fax: null,
        email: null,
        branches: null,
        lines: null,
        api_permission: false,
        paying_customer: false,
        sub_customers: [],
        bookkeeping_number: null,
        target_street_name: null,
        target_street_number: null,
        target_city: null,
        daily_pickup_quantity: null,
        customer_logo: null,
        customer_banner: null,
        customer_banner_url: null,
        comment: null,
        platform_type: null,
        technical_contact_name: null,
        technical_contact_phone: null
      },
      customers: [],
      selectSubCustomer: null,
      subCustomersRules: [
        v => v?.length > 0 || 'חובה לבחור לפחות לקוח אחד'
      ]
    }
  },
  computed: {
    ...mapState('global', ['branches', 'lines'])
  },
  watch: {
    customerLogo (newValue) {
      if (newValue) {
        this.form.base64_logo = newValue
      }
    },
    customerBanner (newValue) {
      if (newValue) {
        this.form.base64_banner = newValue
      }
    },
    bannerUrl (newValue) {
      if (newValue || newValue === '') {
        this.form.customer_banner_url = newValue
      }
    },
    selectSubCustomer (newValue) {
      console.log(newValue, 'selectSubCustomer')
      this.getCustomerByValue(newValue)
    }
  },
  async created () {
    try {
      console.log('this.customer', this.customer)
      this.customers = await this.$customersService.findCustomers()

      if (!this.customer) {
        return
      }

      if (this.customer.sub_customers?.length > 0) {
        this.customers = this.customer.sub_customers
      }

      Object.keys(this.form).forEach(key => !['branches', 'lines'].includes(key) ? this.form[key] = this.customer[key] : null)

      this.form = {
        ...this.form,
        target_street_name: this.customer.pickup_address?.correct_long_street_name || this.customer.pickup_street_name_from_user,
        target_street_number: this.customer.pickup_address?.correct_street_number || this.customer.pickup_street_number_from_user,
        target_city: this.customer.pickup_address?.correct_long_city_name || this.customer.pickup_city_from_user,
        branches: this.customer.branches?.map(b => b.branch.id),
        sub_customers: this.customer.sub_customers?.map(b => b.id),
        comment: this.customer.comment,
        lines: this.customer.lines?.map(l => l.line.id),
        customer_logo: this.customerLogo || this.form.customer_logo,
        customer_banner: this.customerBanner || this.form.customer_banner,
        customer_banner_url: this.bannerUrl || this.form.customer_banner_url
      }
    } catch (e) {
      this.$helper(e, 'created error')
    }
  },
  methods: {
    getCustomerByValue: _.debounce(async function (value) {
      try {
        this.customers = await this.$customersService.findCustomers({ value })
      } catch (e) {
        this.$helper(e, 'getCustomerByValue error')
      }
    }, 500),
    submitted (value) {
      console.log(value, this.from, 'before')
      if (value.status) {
        this.form = {}
        this.$router.push({ name: this.$route.matched[0].name })
        this.$store.commit('setDrawerUi', false)
        console.log(value, this.from, 'after')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.top-details-row{
  border-bottom: 1px solid rgb(228, 228, 228);
  .data-label{
    display: block;
    font-size: 16px;
  }
}
.origin-details{
  display: block;
  color: #38a8cd;
}
.form-title{
  border-left: 1px solid rgb(228, 228, 228);
  padding-right: 25px;
}
.card{
  border-radius: 10px;
  margin-bottom: 15px;
  background: #f7f7f7;
}
</style>
