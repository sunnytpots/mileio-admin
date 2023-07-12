<template>
  <FormUi
    :form="form"
    :v="$v.form"
    :url="form && form.uuid ? `distribution-deliveries-points/update/${form.uuid}` : 'distribution-deliveries-points/add'"
    no-btn
    name="distributionPointDeliveryData"
    :readonly="!$hasPermission('coordinator-delivery', 'edit')"
    @submitted="submitted"
  >
    <v-card v-if="$hasPermission('coordinator-delivery', 'edit')" outlined class="card">
      <v-container>
        <v-row class="top-details-row">
          <v-col cols="4" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>משקל</span>
            <span class="data-label">{{ delivery.package_weight }}</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>נפח</span>
            <span class="data-label">{{ delivery.package_volume }}</span>
          </v-col>
          <v-col cols="4" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>סניף</span>
            <span class="data-label">{{ delivery.branch ? delivery.branch.name : null }}</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>קו</span>
            <span class="data-label">{{ delivery.line ? delivery.line.name : null }}</span>
          </v-col>
        </v-row>
        <v-row class="row-form" justify="space-around" no-gutters>
<!--          <v-col cols="5">-->
<!--            <v-select v-model="form.delivery_type_id" text="distPntOption.name" value="distPntOption.id" label="סוג משלוח" :error-messages="$v.$dirty && $v.form.delivery_type_id.$invalid && 'שדה חובה' || ''" />-->
<!--          </v-col>-->
          <v-col cols="5">
            <div v-if="delivery && delivery.uuid" class="unedited-field">
              <small>שם לקוח</small>
              <span class="data-label">{{ delivery.customer ? delivery.customer.name : null }}</span>
            </div>
            <v-autocomplete
              v-else
              class="autocomplete-ui"
              filled
              rounded
              v-model="form.customer_uid"
              :disabled="!!delivery.uuid"
              :items="customers"
              item-text="name"
              item-value="uuid"
              label="שם הלקוח"
              :error-messages="$v.$dirty && $v.form.customer_uid.$invalid && 'שדה חובה' || ''">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="5">
            <div class="unedited-field">
              <small>כתובת מוצא</small>
              <span class="data-label">{{ form.customer_address }}</span>
            </div>
            <!--            <v-text-field v-else v-model="form.customer_address" disabled label="כתובת מוצא" />-->
          </v-col>
          <v-col cols="5" v-if="delivery && delivery.uuid">
            <div class="unedited-field">
              <small>ברקוד</small>
              <span class="data-label">{{ form.barcode }}</span>
            </div>
            <!--            <v-text-field v-model="form.barcode" label="ברקוד" :disabled="!!delivery.uuid" />-->
          </v-col>
          <v-col cols="5">
            <div v-if="delivery && delivery.uuid" class="unedited-field">
              <small>מספר הזמנה</small>
              <span class="data-label">{{ form.order_number }}</span>
            </div>
            <v-text-field
              v-else
              v-model="form.order_number"
              label="מספר הזמנה"
              rounded
              class="input-ui"
              filled
            />
          </v-col>
          <v-col cols="5" v-if="delivery && delivery.uuid">
            <div v-if="delivery && delivery.uuid" class="unedited-field">
              <small>מספר תפוז</small>
              <span class="data-label">{{ form.tapuz_number }}</span>
            </div>
            <!--            <v-text-field v-else v-model="form.tapuz_number" label="מספר תפוז" />-->
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.pickup_driver_uid"
              clearable
              :items="drivers"
              :item-text="(item) => `${item.first_name} ${item.last_name}`"
              item-value="uuid"
              class="autocomplete-ui"
              filled
              rounded
              label="נהג איסוף כמותי">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="5" style="text-align: center; margin-top: 25px">
            <div v-if="delivery.distributionPointBag && delivery.distributionPointBag.bag_number" class="unedited-field">
              <small>מספר שק</small>
              <span class="data-label">{{ delivery.distributionPointBag.bag_number }}</span>
            </div>
<!--            <div v-if="delivery && delivery.uuid" class="unedited-field">-->
<!--              <small>RF-ID</small>-->
<!--              <span class="data-label">{{ form.rf_id }}</span>-->
<!--            </div>-->
            <!--            <v-text-field v-model="form.rf_id" label="RF-ID" :disabled="!!delivery.uuid" />-->
          </v-col>
        </v-row>
      </v-container>

      <span style="display: flex; justify-content: center;">
        <i class="icon icon-arrow" :class="{'rotate-arrow': isReverse}" />
        <i v-if="isDual" class="icon icon-arrow" />
      </span>
    </v-card>
    <v-card v-if="$hasPermission('coordinator-delivery', 'edit')"  class="card" outlined>
      <v-container>
        <v-row>
          <v-col cols="8" class="form-title">
            <span class="origin-details">פרטי נמען</span>
            <!--            <small>זמן מסירה משוער: 25/10/20 | 8:35</small>-->
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
            <v-text-field
              v-model="form.target_name"
              label="שם הנמען"
              :error-messages="$v.$dirty && $v.form.target_name.$invalid && 'שדה חובה' || ''"
              rounded
              class="input-ui"
              filled
            />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model.number="target_id_number"
              label="תעודת זהות נמען"
              rounded
              class="input-ui"
              filled
            />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_phone"
              label="טלפון"
              :error-messages="$v.$dirty && $v.form.target_phone.$invalid && 'שדה חובה' || ''"
              rounded
              class="input-ui"
              filled
            />
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.drop_point"
              clearable
              :disabled="delivery.distributionPointBag && delivery.distributionPointBag.bag_number !== undefined"
              :items="distributionPoints"
              item-text="name"
              item-value="uuid"
              class="autocomplete-ui"
              filled
              rounded
              :label="'נקודת חלוקה'"
              :error-messages="$v.$dirty && $v.form.drop_point.$invalid && 'שדה חובה' || ''">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
              <template #item="{ item }">
                {{ item.name }} - {{ item.correct_short_city_name }} {{ item.correct_short_street_name }} {{ item.correct_street_number }}
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.receiver_name"
              label="שם מקבל"
              rounded
              class="input-ui"
              filled
            />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_email"
              label="דואר אלקטרוני"
              :error-messages="$v.$dirty && $v.form.target_email.$invalid && 'דואר אלקטרוני לא תקין' || ''"
              rounded
              class="input-ui"
              filled
            />
          </v-col>
          <v-col cols="5">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-autocomplete
                  v-model="form.divisor_driver_uid"
                  clearable
                  class="autocomplete-ui"
                  filled
                  rounded
                  :disabled="delivery.distributionPointBag && delivery.distributionPointBag.bag_number !== undefined"
                  v-bind="attrs"
                  :items="drivers"
                  :item-text="(item) => `${item.first_name} ${item.last_name}`"
                  item-value="uuid"
                  :label="'נהג מוסר'"
                  v-on="form.divisor_driver_uid ? on : null">
                  <template v-slot:append>
                    <i class="icon icon-arrowSelect"/>
                  </template>
                </v-autocomplete>
              </template>
              <div class="driver-mobile-tooltip">
                <i class="icon icon-mobile" /><span>{{ driverDivisorMobile }}</span>
              </div>
            </v-tooltip>
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.delivery_error_id"
              clearable
              :items="causesFailures"
              item-text="value"
              item-value="id"
              label="סיבת כשל"
              class="autocomplete-ui"
              filled
              rounded>
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.bring_back_driver_uid"
              clearable
              :items="drivers"
              :item-text="(item) => `${item.first_name} ${item.last_name}`"
              item-value="uuid"
              label="נהג החזרות"
              class="autocomplete-ui"
              filled
              rounded>
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col v-if="isGovaina" cols="5">
            <div v-if="delivery && delivery.uuid" class="unedited-field">
              <small>סכום גוביינא</small>
              <span class="data-label">{{ form.govaina_amount }}</span>
            </div>
            <v-text-field
              v-else
              type="number"
              v-model.number="form.govaina_amount"
              label="סכום גוביינא"
              :error-messages="$v.$dirty && $v.form.govaina_amount.$invalid && 'שדה חובה' || ''"
              rounded
              class="input-ui"
              filled
            />
          </v-col>
          <v-col cols="11">
            <v-text-field
              v-model="form.comments"
              label="הערות למשלוח"
              rounded
              class="input-ui"
              filled
            />
          </v-col>
          <v-col v-if="delivery && delivery.tapuz_old_api_request " cols="12">
            <v-text-field
              v-model="delivery.tapuz_old_api_request"
              label="סטרינג שנשלח"
              rounded
              class="input-ui"
              filled
            />
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <DialogUi v-model="googleMap" xl>
      <GoogleMap :center="deliveryPosition" :zoom="15">
        <GMapMarkerIO :position="deliveryPosition" icon="driver" />
      </GoogleMap>
    </DialogUi>
  </FormUi>
</template>

<script>
import { mapState } from 'vuex'
import { required, email } from 'vuelidate/lib/validators'
import _ from 'lodash'

export default {
  name: 'DistributionPointsCoordinatorDelivery',

  props: {
    delivery: { type: Object, default: () => ({}) },
    // customerFields: { type: Object, default: () => ({}) },
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
      target_id_number: null,
      distPntOption: [],
      distributionPoints: [],
      isReverse: false,
      isDual: false,
      isGovaina: false,
      googleMap: false,
      causesFailures: [],
      // remove unnecessary data
      form: {
        user_id: null,
        delivery_error_id: null,
        barcode: null,
        target_id_number: null,
        customer_uid: null,
        rf_id: null,
        drop_point: null,
        order_number: null,
        tapuz_number: null,
        delivery_type_id: null,
        target_name: null,
        target_email: null,
        target_phone: null,
        comments: null,
        pickup_driver_uid: null,
        divisor_driver_uid: null,
        bring_back_driver_uid: null,
        receiver_name: null,
        tags: []
      },
      customerItems: [],
      searchCustomer: '',
      driverDivisorMobile: null
    }
  },

  computed: {
    ...mapState('auth', ['authUser']),
    deliveryPosition () {
      return {
        lat: this.delivery.address ? +this.delivery.address.lat : 0,
        lng: this.delivery.address ? +this.delivery.address.lng : 0
      }
    }
  },

  async created () {
    try {
      this.distributionPoints = await this.$distributionPointsService.getDistributionPoints()
      // this.form.delivery_type_id = this.deliveryTypes.find(deliveryType => deliveryType.name === 'נקודת חלוקה').id
      // this.form.delivery_type_id = this.distributionPoints[0].delivery_type_id
      if (this.delivery.uuid) {
        Object.keys(this.form).forEach(key => this.form[key] = this.delivery[key])
        this.form.user_id = this.authUser.id
        this.form.customer_uid = this.delivery.customer.uuid
        this.form.uuid = this.delivery.uuid
        this.form.tags = this.delivery.tags
        this.target_id_number = this.delivery.target_id_number
        this.form.pickup_driver_uid = this.delivery.pickup_driver ? this.delivery.pickup_driver.uuid : null
        this.form.divisor_driver_uid = this.delivery.divisor_driver ? this.delivery.divisor_driver.uuid : null
        this.driverDivisorMobile = this.delivery.divisor_driver ? this.delivery.divisor_driver.mobile : null
        this.form.bring_back_driver_uid = this.delivery.bring_back_driver ? this.delivery.bring_back_driver.uuid : null
        this.form.drop_point = this.delivery.distribution_point && this.delivery.distribution_point.uuid
        // this.isReverseDelivery()
      }
      this.causesFailures = await this.$causesFailuresService.viewFailures()
    } catch (err) {
      console.log('distribution points coordinator delivery error', err)
    }

  },

  watch: {
    target_id_number (newVal) {
      this.form.target_id_number = newVal === '' ? null : newVal
    },
    drivers (newDrivers) {
      console.log('newDrivers', newDrivers)
    },
    tags: {
      handler (newVal) {
        this.form.tags = newVal
      },
      deep: true

    },
    'form.customer_uid' (uid) {
      if (uid) {
        // if (!this.delivery.uuid && uid) {
        const customerSelected = this.customers.find(c => { return c.uuid === uid })
        this.form.customer_address = customerSelected && customerSelected.pickup_address && customerSelected.pickup_address.correct_long_city_name + ' ' + customerSelected.pickup_address.correct_long_street_name + ' ' + customerSelected.pickup_address.correct_street_number
      }
    },
    searchCustomer (val) {
      if (val) {
        this.queryCustomer(val)
      }
    }
  },

  methods: {
    // isReverseDelivery () {
    //   let res = false
    //   for (const dt of this.deliveryTypes) {
    //     if (dt.key === 'dual') {
    //       this.isDual = true
    //     } else {
    //       this.isDual = false
    //     }
    //     dt.key === 'govaina' && this.form.delivery_type_id === dt.id ? this.isGovaina = true : this.isGovaina = false
    //     if (dt.key !== 'regular' && this.form.delivery_type_id === dt.id) {
    //       res = true
    //       break
    //     }
    //   }
    //   this.isReverse = res
    // },
    submitted (value) {
      // console.log('this.form.delivery_type_id', this.form.delivery_type_id)
      console.log('this.deliveryTypes', this.deliveryTypes)
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
    }, 500),
    getDivisorDriver (driver) {
      this.driverDivisorMobile = driver.mobile
      return `${driver.first_name} ${driver.last_name}`
    }
  },

  validations: {
    form: {
      // delivery_type_id: { required },
      target_phone: { required },
      target_name: { required },
      drop_point: { required },
      customer_uid: { required },
      target_email: { email }
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
  background: #ffffff;
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
.autocomplete-ui, .input-ui, {
  margin-top: 15px;
}
::v-deep{
  .v-text-field__details{
    margin-top: -7px;
  }
}
</style>
