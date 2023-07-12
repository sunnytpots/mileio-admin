<template>
  <FormUi
    :form="form"
    :v="$v.form"
    ref-prop="checkDelivery"
    :url="form && form.uuid ? `delivery/update/${form.uuid}` : 'delivery/add'"
    no-btn
    name="deliveryData"
    :readonly="!$hasPermission('coordinator-delivery', 'edit')"
    @submitted="submitted">
    <v-card v-if="$hasPermission('coordinator-delivery', 'edit')" class="card" outlined>
      <v-container>
        <v-row class="top-details-row">
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
            <span class="data-label">{{ delivery.line ? delivery.line.line_number : null }}</span>
          </v-col>
        </v-row>

        <v-row class="row-form" justify="space-around" no-gutters>
          <v-col cols="2">
            <v-select
              v-model="form.delivery_type_id"
              class="select-ui"
              filled
              rounded
              :disabled="disableChangeDeliveryType"
              :items="deliveryTypes"
              item-text="name"
              item-value="id"
              label="סוג משלוח"
              :error-messages="$v.$dirty && $v.form.delivery_type_id.$invalid && 'שדה חובה' || ''"
              @change="isReverseDelivery()" >
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-select>
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model="form.amount"
              dense
              rounded
              filled
              class="input-ui"
              type="number"
              min="1"
              label="כמות חבילות"
              :error-messages="$v.$dirty && $v.form.amount.$invalid && 'שדה חובה וערך חיובי בלבד' || ''" />
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
              :disabled="!!delivery.uuid"
              filled
              rounded
              class="autocomplete-ui"
              :items="customers"
              item-text="name"
              item-value="uuid"
              label="שם הלקוח"
              :error-messages="$v.$dirty && $v.form.customer_uid.$invalid && 'שדה חובה' || ''"
            >
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
          <v-col v-if="delivery && delivery.uuid" cols="5">
            <div class="unedited-field">
              <small>ברקוד</small>
              <span class="data-label">{{ form.barcode }}</span>
            </div>
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
              dense
              rounded
              filled
              class="input-ui"
            />
          </v-col>
          <v-col v-if="delivery && delivery.uuid" cols="5">
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
              :item-text="item => `${item.first_name} ${item.last_name}`"
              item-value="uuid"
              label="נהג איסוף כמותי"
              filled
              rounded
              class="autocomplete-ui">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="5">
            <div
              v-if="delivery && delivery.customer_bag && delivery.customer_bag.receiver_name"
              class="unedited-field">
              <small>שם מקבל שק החזרות</small>
              <span class="data-label">{{ delivery.customer_bag.receiver_name }}</span>
            </div>
          </v-col>
        </v-row>
      </v-container>

      <span style="display: flex; justify-content: center;">
        <i class="icon icon-arrow" :class="{'rotate-arrow': isReverse}" />
        <i v-if="isDual" class="icon icon-arrow" />
      </span>
    </v-card>

    <v-card v-if="$hasPermission('coordinator-delivery', 'edit')" class="card" outlined>
      <v-container>
        <v-row>
          <v-col cols="8" class="form-title">
            <span class="origin-details">פרטי נמען</span>
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
              label="שם נמען"
              :rules="deliveryRuleHandler(requiredRule)"
              dense
              rounded
              filled
              class="input-ui"/>
          </v-col>
          <v-col :cols="delivery && delivery.id ? '2' : '5'">
            <v-text-field
              v-model="form.target_phone"
              label="טלפון"
              :rules="deliveryRuleHandler(phoneRule)"
              dense
              rounded
              filled
              class="input-ui phone-input" />
          </v-col>
          <v-col v-if="delivery && delivery.id" cols="2">
            <v-btn
              :disabled="form.target_phone && form.target_phone.length < 9"
              class="btn-primary"
              width="inherit"
              style="margin-top: 15px"
              @click="smsDialog = true">
              <p
                style="margin-bottom: 0; font-size: 13px;"
                v-text="'שלח SMS לנמען'"/>
            </v-btn>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_city"
              label="עיר"
              :rules="deliveryRuleHandler(requiredRule)"
              dense
              filled
              rounded
              class="input-ui">
              <template v-slot:append>
                <div v-if="correctedByGoogle">
                  <i
                    v-if="isCityCorrectedByGoogle"
                    class="icon icon-corrected"/>
                  <i
                    v-else
                    class="icon icon-valid"/>
                </div>
              </template>
            </v-text-field>
            <small
              v-if="form.api_target_city"
              class="small-label">
              עיר שנשלחה : {{ form.api_target_city }}
            </small>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_street_name"
              label="כתובת יעד"
              :rules="deliveryRuleHandler(requiredRule)"
              dense
              rounded
              filled
              class="input-ui">
              <template v-slot:append>
                <div v-if="correctedByGoogle">
                  <i
                    v-if="isStreetCorrectedByGoogle"
                    class="icon icon-corrected"/>
                  <i
                    v-else
                    class="icon icon-valid"/>
                </div>
              </template>
            </v-text-field>
            <small
              v-if="form.api_target_street_name"
              class="small-label">
              כתובת יעד שנשלחה : {{ form.api_target_street_name }}
            </small>
          </v-col>
          <v-row style="justify-content: space-around">
            <v-col cols="2">
              <v-text-field
                v-model.number="form.target_street_number"
                type="number"
                label="מספר בית"
                :rules="deliveryRuleHandler(numRule)"
                dense
                rounded
                filled
                class="input-ui">
                <template v-slot:append>
                  <div v-if="correctedByGoogle">
                    <i
                      v-if="isStreetNumberCorrectedByGoogle"
                      class="icon icon-corrected"/>
                    <i
                      v-else
                      class="icon icon-valid"/>
                  </div>
                </template>
              </v-text-field>
              <small
                v-if="form.api_target_street_number"
                class="small-label">
                מספר בית שנשלח : {{ form.api_target_street_number }}
              </small>
            </v-col>
            <v-col cols="2">
              <v-text-field
                v-model.number="form.entrance"
                label="כניסה"
                dense
                rounded
                filled
                class="input-ui" />
            </v-col>
            <v-col cols="2">
              <v-text-field
                v-model.number="form.floor"
                label="קומה"
                dense
                rounded
                filled
                class="input-ui" />
            </v-col>
            <v-col cols="2">
              <v-text-field
                v-model.number="form.apartment"
                label="דירה"
                dense
                rounded
                filled
                class="input-ui" />
            </v-col>
          </v-row>
          <v-col cols="11">
            <v-checkbox
              v-model="form.allow_google_correction"
              label="תיקון כתובות אוטומטי (לעדכון כתובת שאינה מופיעה בגוגל, בטל סימון)"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.receiver_name"
              label="שם מקבל"
              ense
              rounded
              filled
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.target_email"
              label="דואר אלקטרוני"
              dense
              rounded
              filled
              class="input-ui"/>
          </v-col>
          <v-col v-if="delivery && delivery.uuid" cols="5">
            <v-tooltip bottom>
              <template v-slot:activator="{ on, attrs }">
                <v-autocomplete
                  v-model="form.divisor_driver_uid"
                  clearable
                  filled
                  rounded
                  class="autocomplete-ui"
                  v-bind="attrs"
                  :items="drivers"
                  :item-text="(item) => `${item.first_name} ${item.last_name}`"
                  item-value="uuid"
                  :label="delivery.delivery_type && delivery.delivery_type.name === 'collection' ? 'נהג אוסף' : 'נהג מוסר'"
                  v-on="form.divisor_driver_uid ? on : null">
                  <template v-slot:append>
                    <i class="icon icon-arrowSelect"/>
                  </template>
                </v-autocomplete>
              </template>
              <div class="driver-mobile-tooltip">
                <i class="icon icon-mobile" />
                <span>{{ driverDivisorMobile }}</span>
              </div>
            </v-tooltip>
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.delivery_error_id"
              clearable
              :items="causesFailures"
              item-text="value"
              filled
              rounded
              class="autocomplete-ui"
              item-value="id"
              label="סיבת כשל">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="5">
            <v-autocomplete
              v-model="form.bring_back_driver_uid"
              clearable
              filled
              rounded
              class="autocomplete-ui"
              :items="drivers"
              :item-text="(item) => `${item.first_name} ${item.last_name}`"
              item-value="uuid"
              label="נהג החזרות">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.sku"
              item-value="uuid"
              label='מק"ט'
              dense
              rounded
              filled
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.serial_number"
              label="מספר סידורי"
              class="input-ui"
              dense
              rounded
              filled/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.delivered_in_practice"
              label="נמסר בפועל על ידי"
              class="input-ui"
              dense
              rounded
              filled/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.refund_bag_receiver"
              label="מקבל שק החזרות"
              class="input-ui"
              dense
              rounded
              filled/>
          </v-col>
          <v-col v-if="isGovaina" cols="5">
            <div v-if="delivery && delivery.uuid" class="unedited-field">
              <small>סכום גוביינא</small>
              <span class="data-label">{{ form.govaina_amount }}</span>
            </div>
            <v-text-field
              v-else
              v-model.number="form.govaina_amount"
              type="number"
              dense
              rounded
              filled
              class="input-ui"
              label="סכום גוביינא"
              :error-messages="$v.$dirty && $v.form.govaina_amount.$invalid && 'שדה חובה' || ''" />
          </v-col>
          <v-col cols="11">
            <v-text-field
              v-model="form.comments"
              label="הערות למשלוח"
              dense
              rounded
              filled
              class="input-ui"/>
          </v-col>
          <v-col cols="11">
            <v-text-field
              v-model="form.additional_comments"
              label="הערות נוספות למשלוח"
              dense
              rounded
              filled
              class="input-ui"/>
          </v-col>
          <v-col cols="11">
            <v-text-field
              v-model="form.content"
              label="תכולה"
              dense
              rounded
              filled
              class="input-ui"/>
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
              dense
              rounded
              filled
              class="input-ui"/>
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <DialogUi v-model="googleMap" xl>
      <GoogleMap :center="deliveryPosition" :zoom="15">
        <GMapMarkerIO :position="deliveryPosition" icon="driver" />
      </GoogleMap>
    </DialogUi>

    <v-dialog
      v-model="smsDialog"
      persistent
      max-width="700">
      <v-card>
        <v-card-title class="headline">
          הודעה
        </v-card-title>
        <v-card-text>{{ 'אנא רשום את ההודעה לנמען' }}</v-card-text>
        <v-card-text>{{ `ישלח למספר ${form.target_phone}` }}</v-card-text>
        <v-textarea
          v-model="smsContent"
          :no-resize="true"
          label="תוכן ההודעה"/>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="green darken-1"
            text
            @click="smsDialog = false">
            בטל
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            :loading="loading"
            @click="onSendSms">
            בצע
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      loading: false,
      smsContent: null,
      smsDialog: false,
      isReverse: false,
      isDual: false,
      isGovaina: false,
      googleMap: false,
      causesFailures: [],
      form: {
        content: null,
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
        api_target_city: null,
        api_target_street_name: null,
        api_target_street_number: null,
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
        sku: null,
        serial_number: null,
        tags: [],
        allow_google_correction: true,
        delivered_in_practice: null,
        refund_bag_receiver: null
      },
      customerItems: [],
      searchCustomer: '',
      driverDivisorMobile: null,
      numRule: [
        v => /^[0-9]+$/.test(v) || !v || 'שדה לא תקין'
      ],
      requiredRule: [
        v => !!v || 'שדה חובה'
      ],
      phoneRule: [
        v => !!v || 'שדה חובה',
        v => (v && v.length === 10) || 'שדה לא תקין',
        v => /^[0-9]+$/.test(v) || 'שדה לא תקין'
      ],
      formattedAddress: {},
      unFormattedAddress: {},
      correctedByGoogle: false
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    disableChangeDeliveryType () {
      if (this.delivery && this.delivery.status && !this.$hasPermission('change-delivery-type', 'edit')) {
        return true
      }

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
    },
    isCityCorrectedByGoogle () {
      return this.formattedAddress?.correct_long_city_name !== this.unFormattedAddress?.city_name
    },
    isStreetCorrectedByGoogle () {
      return this.formattedAddress?.correct_long_street_name !== this.unFormattedAddress?.street_name
    },
    isStreetNumberCorrectedByGoogle () {
      return this.formattedAddress?.correct_street_number !== Number(this.unFormattedAddress?.street_number)
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
      if (uid) {
        let customerSelected = null
        if (this.delivery?.uuid && this.delivery?.customer?.pickup_address) {
          customerSelected = this.delivery.customer
        } else {
          customerSelected = this.customers.find(c => { return c.uuid === uid })
        }

        if (customerSelected?.pickup_address) {
          const {
            correct_long_city_name: correctLongCityName,
            correct_long_street_name: correctLongStreetName,
            correct_street_number: correctStreetNumber
          } = customerSelected.pickup_address
          this.form.customer_address = `${correctLongCityName} ${correctLongStreetName} ${correctStreetNumber}`
        }
      }
    },
    searchCustomer (val) {
      if (val) {
        this.queryCustomer(val)
      }
    }
  },
  async created () {
    try {
      this.causesFailures = await this.$causesFailuresService.viewFailures()

      if (!this.delivery?.uuid && this.deliveryTypes.length > 0) {
        this.form.delivery_type_id = this.deliveryTypes.find(dt => dt.key === 'regular').id
        return
      }

      Object.keys(this.form).forEach(key => this.form[key] = this.delivery[key])
      this.form = {
        ...this.form,
        amount: this.delivery.amount ? this.delivery.amount : 1,
        customer_uid: this.delivery.customer.uuid,
        uuid: this.delivery.uuid,
        tags: this.delivery.tags,
        sku: this.delivery.sku,
        serial_number: this.delivery.serial_number,
        pickup_driver_uid: this.delivery.pickup_driver?.uuid ? this.delivery.pickup_driver.uuid : null,
        divisor_driver_uid: this.delivery.divisor_driver?.uuid ? this.delivery.divisor_driver.uuid : null,
        bring_back_driver_uid: this.delivery.bring_back_driver?.uuid ? this.delivery.bring_back_driver.uuid : null,
        target_city: this.delivery.target_address?.correct_long_city_name || this.unformatted_address?.city_name,
        target_street_name: this.delivery.target_address?.correct_long_street_name || this.delivery.unformatted_address?.street_name,
        target_street_number: this.delivery.target_address?.correct_street_number || this.delivery.unformatted_address?.street_number
      }

      this.driverDivisorMobile = this.delivery.divisor_driver?.mobile ? this.delivery.divisor_driver.mobile : null
      this.isReverseDelivery()

      this.formattedAddress = this.delivery.target_address
      this.unFormattedAddress = this.delivery.unformatted_address
      this.correctedByGoogle = this.delivery.target_address?.corrected_by_google
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    async onSendSms () {
      try {
        console.log('sendSms', this.smsContent)
        const smsData = [{
          target_phone: this.form.target_phone,
          message: this.smsContent
        }]
        this.loading = true
        await this.$messagesByStatusesService.sendMultipleSms(smsData)
        this.loading = false
        this.smsDialog = false
        this.smsContent = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'onSendSms')
      }
    },
    deliveryRuleHandler (rule) {
      return this.delivery?.id ? [] : rule
    },
    isReverseDelivery () {
      let res = false
      for (const dt of this.deliveryTypes) {
        this.isDual = ['dual', 'certificate'].includes(dt.key)
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
        // this.$router.back()
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
          }
          return true
        }
      },
      delivery_type_id: { required },
      customer_uid: { required },
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
.autocomplete-ui {
  margin-top: 15px;
}
::v-deep {
  .v-text-field__details{
    margin-top: -8px;
  }
  .phone-input {
    input {
      font-size: 15px;
    }
  }
  .v-dialog--active {
    //max-width: 645px !important;
    .v-input__control {
      margin-right: 20px;
    }
    span {
      color: #fa4616;
    }
  }
  .v-textarea {
    .v-input__control {
      margin: auto 10%;
    }
  }
}
.input-ui, .select-ui {
  margin-top: 15px;
  ::v-deep{
    .v-text-field__details{
      margin-top: -3px;
    }
  }
}
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
  background: white;
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
.rotate-arrow{
  transform: rotate(178deg)
}
.small-label {
  font-weight: bold;
  color: red;
  text-align: left;
}
</style>
