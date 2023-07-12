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
<!--          <v-col cols="4" class="form-title">-->
<!--            <span class="origin-details">פרטי לקוח</span>-->
<!--            <small v-if="delivery && delivery.customer">תאריך יצירה: {{ delivery.customer.created_at | formatDate}}</small>-->
<!--          </v-col>-->
          <v-col cols="4" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>משקל</span>
            <span class="data-label">{{ delivery.package_weight }}</span>
          </v-col>
          <v-col cols="4" style="border-left: 1px solid #e4e4e4; text-align: center;">
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
          <v-col cols="2">
            <v-select
              v-model="form.delivery_type_id"
              clearable
              class="select-ui deliveryTypeInput"
              filled
              rounded
              :disabled="disableChangeDeliveryType"
              :items="deliveryTypes"
              item-text="name"
              item-value="id"
              label="סוג משלוח"
              :error-messages="$v.$dirty && $v.form.delivery_type_id.$invalid && 'שדה חובה' || ''"
              @change="isReverseDelivery()">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-select>
          </v-col>
          <v-col cols="2">
            <v-text-field
              type="number"
              v-model="form.amount"
              min="1"
              label="כמות חבילות"
              :error-messages="$v.$dirty && $v.form.amount.$invalid && 'שדה חובה וערך חיובי בלבד' || ''"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="5">
            <div v-if="delivery && delivery.uuid" class="unedited-field">
              <small>שם הלקוח</small>
              <span class="data-label">{{ delivery.customer ? delivery.customer.name : null }}</span>
            </div>
            <v-autocomplete
              v-else
              v-model="form.customer_uid"
              clearable
              class="autocomplete-ui"
              filled
              rounded
              :disabled="!!delivery.uuid"
              :items="customers"
              item-text="name"
              item-value="uuid"
              label="שם הלקוח"
              :error-messages="$v.$dirty && $v.form.customer_uid.$invalid && 'שדה חובה' || ''"
            />
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
              class="input-ui"
              filled
              rounded
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
              label="נהג איסוף כמותי"
              class="autocomplete-ui"
              filled
              rounded
            >
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="5">
            <div v-if="delivery && delivery.uuid" class="unedited-field">
              <small>RF-ID</small>
              <span class="data-label">{{ form.rf_id }}</span>
            </div>
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
              label="שם הלקוח"
              :error-messages="$v.$dirty && $v.form.target_name.$invalid && 'שדה חובה' || ''"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_phone"
              label="טלפון"
              :error-messages="$v.$dirty && $v.form.target_phone.$invalid && 'שדה חובה' || ''"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_city"
              label="עיר"
              :error-messages="$v.$dirty && $v.form.target_city.$invalid && 'שדה חובה' || ''"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_street_name"
              label="כתובת יעד"
              :error-messages="$v.$dirty && $v.form.target_street_name.$invalid && 'שדה חובה' || ''"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="3">
            <v-text-field
              v-model.number="form.target_street_number"
              label="מספר בית"
              :error-messages="$v.$dirty && $v.form.target_street_number.$invalid && 'שדה חובה' || ''"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model.number="form.entrance"
              label="כניסה"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model.number="form.floor"
              label="קומה"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="1">
            <v-text-field
              v-model.number="form.apartment"
              label="דירה"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.receiver_name"
              label="שם מקבל"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_email"
              label="דואר אלקטרוני"
              :error-messages="$v.$dirty && $v.form.target_email.$invalid && 'ערך לא חוקי' || ''"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col v-if="delivery && delivery.uuid" cols="5">
            <!--            <v-autocomplete clearable v-model="form.divisor_driver_uid" :items="drivers" :item-text="(item) => `${item.first_name} ${item.last_name}`" item-value="uuid" label="נהג מוסר" />-->
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-autocomplete
                  v-model="form.divisor_driver_uid"
                  clearable
                  class="autocomplete-ui"
                  filled
                  rounded
                  v-bind="attrs"
                  :items="drivers"
                  :item-text="(item) => `${item.first_name} ${item.last_name}`"
                  item-value="uuid"
                  :label="delivery.delivery_type.name === 'collection' ? 'נהג אוסף' : 'נהג מוסר'"
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
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="11">
            <v-text-field
              v-model="form.comments"
              label="הערות למשלוח"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col cols="11">
            <v-text-field
              v-model="form.additional_comments"
              label="הערות נוספות למשלוח"
              class="input-ui"
              filled
              rounded
            />
          </v-col>
          <v-col v-if="delivery && delivery.uuid" cols="12">
            <a
              target="_blank"
              :href="`https://tapuzdelivery.com/tn?tracking_number=${delivery.track_number}&uid=${delivery.uuid}`"
              v-text="'לינק מעקב משלוח'" />
          </v-col>
          <v-col v-if="delivery && delivery.tapuz_old_api_request" cols="12">
            <v-text-field
              v-model="delivery.tapuz_old_api_request"
              label="סטרינג שנשלח"
              class="input-ui"
              filled
              rounded
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
import { required, requiredIf, email } from 'vuelidate/lib/validators'
import _ from 'lodash'

export default {
  name: 'CoordinatorDelivery',

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
      isReverse: false,
      isDual: false,
      isGovaina: false,
      googleMap: false,
      causesFailures: [],
      form: {
        amount: null,
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
        additional_comments: null,
        entrance: null,
        floor: null,
        apartment: null,
        delivery_type_status_key: null,
        pickup_driver_uid: null,
        divisor_driver_uid: null,
        bring_back_driver_uid: null,
        govaina_amount: null,
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
    disableChangeDeliveryType () {
      if ((this.delivery?.status &&
        ['done', 'collected_waiting_refund'].includes(this.delivery.status.key))) {
        return true
      }
      return false
    },
    isInUpdateDelivery () {
      return Object.keys(this.delivery).length > 0
    },
    deliveryPosition () {
      return {
        lat: this.delivery.target_address ? +this.delivery.target_address.lat : 0,
        lng: this.delivery.target_address ? +this.delivery.target_address.lng : 0
      }
    }
  },

  async created () {
    if (this.delivery.uuid) {
      Object.keys(this.form).forEach(key => this.form[key] = this.delivery[key])
      this.form.amount = this.delivery.amount ? this.delivery.amount : 1
      this.form.customer_uid = this.delivery.customer.uuid
      this.form.uuid = this.delivery.uuid
      this.form.tags = this.delivery.tags
      this.form.pickup_driver_uid = this.delivery.pickup_driver ? this.delivery.pickup_driver.uuid : null
      this.form.divisor_driver_uid = this.delivery.divisor_driver ? this.delivery.divisor_driver.uuid : null
      this.driverDivisorMobile = this.delivery.divisor_driver ? this.delivery.divisor_driver.mobile : null
      this.form.bring_back_driver_uid = this.delivery.bring_back_driver ? this.delivery.bring_back_driver.uuid : null

      this.form.target_street_name = this.delivery.target_address ? this.delivery.target_address.correct_long_street_name : null
      this.form.target_street_number = this.delivery.target_address ? this.delivery.target_address.correct_street_number : null
      this.form.target_city = this.delivery.target_address ? this.delivery.target_address.correct_long_city_name : null
      this.isReverseDelivery()
    } else {
      this.form.delivery_type_id = this.deliveryTypes.length > 0 && this.deliveryTypes.find(dt => dt.key === 'regular').id
    }

    this.causesFailures = await this.$causesFailuresService.viewFailures()
  },

  watch: {
    tags: {
      handler (newVal) {
        this.form.tags = newVal
      },
      deep: true

    },
    'form.customer_uid' (uid) {
      if (uid) {
        let customerSelected = null
        if (this.delivery && this.delivery.uuid && this.delivery.customer && this.delivery.customer.pickup_address ) {
          console.log(this.delivery, 'watch')
          customerSelected = this.delivery.customer
        } else {
          customerSelected = this.customers.find(c => { return c.uuid === uid })
        }
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
    isReverseDelivery () {
      let res = false
      for (const dt of this.deliveryTypes) {
        if (dt.key === 'dual') {
          this.isDual = true
        } else if (dt.key === 'certificate') {
          this.isDual = true
        } else {
          this.isDual = false
        }
        dt.key === 'govaina' && this.form.delivery_type_id === dt.id ? this.isGovaina = true : this.isGovaina = false
        if (dt.key !== 'regular' && this.form.delivery_type_id === dt.id) {
          res = true
          break
        }
      }
      this.isReverse = res
    },
    submitted (value) {
      if (value.status) {
        this.form = {}

        this.$router.push({ name: this.$route.matched[0].name })
        this.$store.commit('setDrawerUi', false)
        const resMsg = this.delivery && this.delivery.uuid ? 'משלוח עודכן בהצלחה' : 'משלוח נוצר בהצלחה'
        this.$store.commit('setSnackbar', { value: true, message: resMsg, success: true })
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
      amount: {
        required () {
          // eslint-disable-next-line no-mixed-operators
          if (this.form.amount <= 0) {
            return false
          } else {
            return true
          }
        }
      },
      delivery_type_id: { required },
      target_city: { required },
      target_phone: { required },
      target_name: { required },
      target_street_name: { required },
      customer_uid: { required },
      target_street_number: { required },
      target_email: { email },
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
  background: #ffffff;
}
small{
  display: block;
  font-size: 12px;
}
.top-details-row{
  margin-bottom: 10px;
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
.autocomplete-ui {
  margin-top: 15px;
}
::v-deep{
  .v-text-field__details{
    margin-top: -8px;
  }
}
.input-ui, .select-ui {
  margin-top: 15px;
  ::v-deep{
    .v-text-field__details{
      margin-top: -7px;
    }
  }
}
</style>
