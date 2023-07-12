<template>
  <FormUi
    :form="form"
    :v="$v.form"
    :url="form && form.uuid ? `delivery/update/${form.uuid}` : 'delivery/add'"
    no-btn
    name="deliveryData"
    :readonly="!$hasPermission('coordinator-delivery', 'edit')"
    @submitted="submitted"
  >
    <v-card v-if="$hasPermission('coordinator-delivery', 'edit')" outlined class="card">
      <v-container>
        <v-row class="top-details-row">
          <v-col cols="4" class="form-title">
            <span class="origin-details">פרטי לקוח</span>
            <small v-if="delivery && delivery.customer">תאריך יצירה: {{ delivery.customer.created_at | formatDate}}</small>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>משקל</span>
            <span class="data-label">{{ delivery.package_weight }}</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>נפח</span>
            <span class="data-label">{{ delivery.package_volume }}</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>סניף</span>
            <span class="data-label">{{ delivery.branch ? delivery.branch.name : null }}</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>קו</span>
            <span class="data-label">{{ delivery.line ? delivery.line.name : null }}</span>
          </v-col>
        </v-row>

        <v-row class="row-form" justify="space-around" no-gutters>
          <v-col cols="5">
            <v-select
              v-model="form.delivery_type_id"
              clearable
              :items="deliveryTypes"
              item-text="name"
              item-value="id"
              label="סוג משלוח"
              :error-messages="$v.$dirty && $v.form.delivery_type_id.$invalid && 'שדה חובה' || ''"
              @change="isReverseDelivery()"/>
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.customer_uid"
              clearable
              :disabled="!!delivery.uuid"
              :items="customers"
              item-text="name"
              item-value="uuid"
              label="שם הלקוח"
              :error-messages="$v.$dirty && $v.form.customer_uid.$invalid && 'שדה חובה' || ''"
            />
          </v-col>
          <v-col cols="5">
            <v-text-field v-model="form.customer_address" disabled label="כתובת מוצא" />
          </v-col>
          <v-col cols="5">
            <v-text-field v-model="form.barcode" label="ברקוד" :disabled="!!delivery.uuid" />
          </v-col>
          <v-col cols="5">
            <v-text-field v-model="form.order_number" label="מספר הזמנה" :disabled="!!delivery.uuid" />
          </v-col>
          <v-col cols="5" v-if="delivery && delivery.uuid">
            <v-text-field v-model="form.tapuz_number" label="מספר תפוז" :disabled="!!delivery.uuid" />
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.pickup_driver_uid"
              clearable
              :items="drivers"
              :item-text="(item) => `${item.first_name} ${item.last_name}`"
              item-value="uuid"
              label="נהג אוסף" />
          </v-col>
          <v-col cols="5">
            <v-text-field v-model="form.rf_id" label="RF-ID" :disabled="!!delivery.uuid" />
          </v-col>
        </v-row>
      </v-container>

      <span style="display: flex; justify-content: center;">
        <i class="icon icon-arrow" :class="{'rotate-arrow': isReverse}" />
      </span>
    </v-card>
    <v-card v-if="$hasPermission('coordinator-delivery', 'edit')"  class="card" outlined>
      <v-container style="height: 28rem;">
        <v-row>
          <v-col cols="8" class="form-title">
            <span class="origin-details">פרטי נמען</span>
            <small>זמן מסירה משוער: 25/10/20 | 8:35</small>
          </v-col>
          <v-col cols="4">
            <span class="show-map" @click.prevent="googleMap = true">
              <i class="icon icon-points position-driver-icon" />
              <span>הצג מפה</span>
            </span>
          </v-col>
        </v-row>
        <v-row class="row-form" style="justify-content: space-around;" no-gutters>
          <v-col cols="5">
            <v-text-field v-model="form.target_name" label="שם הלקוח" :error-messages="$v.$dirty && $v.form.target_name.$invalid && 'שדה חובה' || ''" />
          </v-col>
          <v-col cols="5">
            <v-text-field v-model="form.target_phone" label="טלפון" :error-messages="$v.$dirty && $v.form.target_phone.$invalid && 'שדה חובה' || ''" />
          </v-col>
          <v-col cols="5">
            <v-text-field v-model="form.target_city" label="עיר" :error-messages="$v.$dirty && $v.form.target_city.$invalid && 'שדה חובה' || ''" />
          </v-col>
          <v-col cols="2">
            <v-text-field v-model="form.target_street_name" label="כתובת יעד" :error-messages="$v.$dirty && $v.form.target_street_name.$invalid && 'שדה חובה' || ''" />
          </v-col>
          <v-col cols="2">
            <v-text-field v-model.number="form.target_street_number" label="מספר בית" :error-messages="$v.$dirty && $v.form.target_street_number.$invalid && 'שדה חובה' || ''" />
          </v-col>
          <v-col cols="5">
            <v-text-field v-model="form.target_email" label="דואר אלקטרוני" />
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.divisor_driver_uid"
              clearable
              :items="drivers"
              :item-text="(item) => `${item.first_name} ${item.last_name}`"
              item-value="uuid"
              label="נהג מוסר" />
          </v-col>
          <v-col cols="5">
            <v-text-field v-model="form.delivery_error_id" label="סיבת כשל" />
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.bring_back_driver_uid"
              clearable
              :items="drivers"
              :item-text="(item) => `${item.first_name} ${item.last_name}`"
              item-value="uuid"
              label="נהג החזרות" />
          </v-col>
          <v-col v-if="isGovaina" cols="5">
            <v-text-field  type="number" v-model.number="form.govaina_amount"  label="סכום גוביינא" :error-messages="$v.$dirty && $v.form.govaina_amount.$invalid && 'שדה חובה' || ''" />
          </v-col>

        </v-row>
        <v-row>
          <v-col cols="12">
            <v-text-field v-model="form.comments" label="הערות למשלוח" />
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <DialogUi v-model="googleMap" xl>
      <GoogleMap>
        <GMapMarkerIO :position="{lat: delivery.target_address ? +delivery.target_address.lat : 0 , lng: delivery.target_address ? +delivery.target_address.lng : 0 }" icon="driver" />
      </GoogleMap>
    </DialogUi>
  </FormUi>
</template>

<script>
import { mapState } from 'vuex'
import { required, requiredIf } from 'vuelidate/lib/validators'
import _ from 'lodash'

export default {
  name: 'CoordinatorDelivery',

  props: {
    delivery: { type: Object, default: () => ({}) },
    customerFields: { type: Object, default: () => ({}) },
    // form: { type: Object, default: () => ({}) },
    deliveryTypes: { type: Array, default: () => ([]) },
    drivers: { type: Array, default: () => ([]) },
    customers: { type: Array, default: () => ([]) },
    tags: { type: Array, default: () => ([]) }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },

  data () {
    return {
      isReverse: false,
      isGovaina: false,
      googleMap: false,
      form: {
        barcode: null,
        delivery_error_id: null,
        customer_uid: null,
        rf_id: null,
        order_number: null,
        tapuz_number: null,
        delivery_type_id: null,
        customer_address: null,
        target_name: null,
        target_email: null,
        target_phone: null,
        target_street_name: null,
        target_street_number: null,
        target_city: null,
        comments: null,
        delivery_type_status_key: null,
        pickup_driver_uid: null,
        divisor_driver_uid: null,
        bring_back_driver_uid: null,
        govaina_amount: null,
        tags: []
      },
      customerItems: [],
      searchCustomer: ''
    }
  },

  computed: {
    ...mapState('auth', ['authUser'])
  },

  created () {
    if (this.delivery.uuid) {
      Object.keys(this.form).forEach(key => this.form[key] = this.delivery[key])
      this.form.customer_uid = this.delivery.customer.uuid
      console.log('this.form.customer_uid', this.delivery)
      this.form.uuid = this.delivery.uuid
      this.form.tags = this.delivery.tags
      this.form.pickup_driver_uid = this.delivery.pickup_driver ? this.delivery.pickup_driver.uuid : null
      this.form.divisor_driver_uid = this.delivery.divisor_driver ? this.delivery.divisor_driver.uuid : null
      this.form.bring_back_driver_uid = this.delivery.bring_back_driver ? this.delivery.bring_back_driver.uuid : null

      this.form.target_street_name = this.delivery.target_address ? this.delivery.target_address.correct_long_street_name : null
      this.form.target_street_number = this.delivery.target_address ? this.delivery.target_address.correct_street_number : null
      this.form.target_city = this.delivery.target_address ? this.delivery.target_address.correct_long_city_name : null
      this.isReverseDelivery()
    }
  },

  watch: {

    tags: {
      handler (newVal) {
        this.form.tags = newVal
      },
      deep: true

    },
    'form.customer_uid' (uid) {
      if (!this.delivery.uuid && uid) {
        const customerSelected = this.customers.find(c => { return c.uuid === uid })
        this.form.customer_address = customerSelected.pickup_address && customerSelected.pickup_address.correct_long_city_name + ' ' + customerSelected.pickup_address.correct_long_street_name + ' ' + customerSelected.pickup_address.correct_street_number
      }
    },
    searchCustomer (val) {
      if (val) {
        this.queryCustomer(val)
      }
    },
    $route (newRoute, oldRoute) {
      console.log('newRoute', newRoute)
      console.log('oldRoute', oldRoute)
      // this.$router.push({ name: 'login' })
    }
  },

  methods: {
    isReverseDelivery () {
      let res = false
      console.log('this.form.delivery_type_id', this.form.delivery_type_id)
      for (const dt of this.deliveryTypes) {
        dt.name === 'govaina' && this.form.delivery_type_id === dt.id ? this.isGovaina = true : this.isGovaina = false
        if (dt.name !== 'regular' && this.form.delivery_type_id === dt.id) {
          res = true
          break
        }
      }
      this.isReverse = res
      console.log('this.isReverse', this.isReverse)
    },
    submitted (value) {
      console.log('this.$route.matched[0]', this.$route.matched[0])
      if (value.status) {
        this.form = {}
        this.$router.push({ name: this.$route.matched[0].name })
        this.$store.commit('setDrawerUi', false)
      }
    },
    queryCustomer: _.debounce(async function () {
      if (!this.searchCity) {
        return
      }
      this.customerItems = await this.$customersService.list({ search: this.searchCustomer })
    }, 500)
  },

  validations: {
    form: {
      delivery_type_id: { required },
      target_city: { required },
      target_phone: { required },
      target_name: { required },
      target_street_name: { required },
      customer_uid: { required },
      target_street_number: { required },
      govaina_amount: {
        required: requiredIf(function () {
          return this.isGovaina
        })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
iframe{
  width: 100%;
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
small{
  display: block;
  font-size: 12px;
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
.delivery-info{
  width: 70%;
  margin-top: 10px;
  font-size: 15px;
}
.theme--light.v-input--is-disabled input, .theme--light.v-input--is-disabled textarea{
  color: #ff3366;
}
.rotate-arrow{
  transform: rotate(178deg)
}
</style>
