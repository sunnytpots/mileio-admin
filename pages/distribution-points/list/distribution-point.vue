<template>
  <FormUi
    :form="form"
    :v="$v.form"
    :ref-prop="'checkDistPoint'"
    :url="distributionPoint && distributionPoint.uuid ? `distribution-points/update/${distributionPoint.uuid}` : 'distribution-points/add'"
    no-btn
    name="distributionPointsData"
    :readonly="!$hasPermission('distribution-points-list', 'edit')"
    @submitted="submitted">
    <v-card outlined class="card">
      <v-container>
        <v-row v-if="distributionPoint && distributionPoint.uuid" class="top-details-row">
          <v-col cols="4" class="form-title">
            <span class="origin-details">זמן יצירה</span>
            <small v-if="distributionPoint">{{ distributionPoint.created_at | formatDate }}</small>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4;">
            <span>סטאטוס</span>
            <v-switch
              v-model="form.active"
              :label="form.active ? 'פעיל' : 'לא פעיל' "/>
          </v-col>
          <v-col cols="3" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>קו</span>
            <span class="data-label">{{ distributionPoint.line && distributionPoint.line.name }}</span>
          </v-col>
          <v-col cols="3" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>מספר נקודה</span>
            <span class="data-label">{{ distributionPoint.point_number }}</span>
          </v-col>
        </v-row>

        <v-row class="row-form" style="justify-content: space-around;" no-gutters>
          <v-col cols="5">
            <v-text-field
              v-model="form.name"
              label="שם נקודה"
              filled
              rounded
              class="input-ui"
              :error-messages="$v.$dirty && $v.form.name.$invalid && 'שדה חובה' || ''"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.contact_name"
              :rules="contactNameRules"
              label="שם איש קשר"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.phone"
              :rules="phoneRules"
              label="טלפון איש קשר"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.additional_phone"
              :rules="additionalPhoneRules"
              label="טלפון נוסף"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.personal_company"
              label="ח.פ"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.store_owner_name"
              label="שם בעל החנות"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.store_owner_phone_number"
              :rules="additionalPhoneRules"
              label="נייד בעל החנות"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.store_owner_email"
              label="מייל בעל החנות"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.bank_branch_number"
              label="מספר סניף בנק"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.bank_name"
              label="שם הבנק"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.bank_account_number"
              label="מספר חשבון בנק"
              filled
              rounded
              class="input-ui"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.bank_account_owner_name"
              label="שם בעל חשבון הבנק"
              filled
              rounded
              class="input-ui"/>
          </v-col>
        </v-row>
      </v-container>
      <v-divider/>
      <v-container>
        <v-row>
          <v-col cols="8" class="form-title">
            <span class="origin-details">כתובת</span>
          </v-col>
          <v-col cols="4">
            <span class="show-map" @click.prevent="googleMap = true">
              <i class="icon icon-points position-driver-icon" />
              <span>הצג מיקום</span>
            </span>
          </v-col>
        </v-row>
        <v-row class="row-form" style="justify-content: space-around;" no-gutters>
          <v-col cols="5">
            <v-text-field
              v-model="form.address.target_city"
              label="עיר"
              filled
              rounded
              class="input-ui"
              :error-messages="$v.$dirty && $v.form.address.target_city.$invalid && 'שדה חובה' || ''" />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model="form.address.target_street_name"
              label="כתובת יעד"
              filled
              rounded
              class="input-ui"
              :error-messages="$v.$dirty && $v.form.address.target_street_name.$invalid && 'שדה חובה' || ''" />
          </v-col>
          <v-col cols="2">
            <v-text-field
              v-model.number="form.address.target_street_number"
              label="מספר בית"
              filled
              rounded
              class="input-ui"
              :error-messages="$v.$dirty && $v.form.address.target_street_number.$invalid && 'שדה חובה' || ''" />
          </v-col>
        </v-row>
      </v-container>
      <v-container>
        <v-row>
          <v-col cols="8" class="form-title">
            <span class="origin-details">זמני פעילות</span>
          </v-col>
        </v-row>
        <v-row class="row-form" style="justify-content: space-around;" no-gutters>
          <v-col cols="12">
            <v-text-field
              v-model="form.active_time_free_text"
              :rules="activeTimeFreeTextRules"
              label="נא לכתוב כאן את זמני הפעילות"
              filled
              rounded
              class="input-ui"/>
          </v-col>
        </v-row>
        <v-row
          v-show="false"
          v-for="(active_time, index) in form.active_time"
          :key="index"
          class="row-form"
          style="justify-content: space-around;"
          no-gutters>
          <v-col cols="1">
            <DeleteButton
              v-if="index !== 0"
              style="flex: 1"
              class="delete-button"
              has-warning
              @deleted="removeActiveDay(index)"/>
          </v-col>
          <v-col style="display: flex; align-items: center;" cols="2">
            <v-select
              v-model="active_time.active_day"
              clearable
              style="flex: 2"
              :items="active_day"
              item-text="key"
              item-value="value"
              label="יום פעילות"/>
          </v-col>
          <v-col style="display: flex; align-items: center" cols="1">
            <p style="flex: 1" class="active-time-label">מ-</p>
            <v-select
              v-model="active_time.active_from_hour"
              clearable
              style="flex: 2"
              :items="hours"
              label="שעה"/>
          </v-col>
          <v-col cols="1">
            <v-select
              v-model="active_time.active_from_minute"
              clearable
              :items="minutes"
              item-text="name"
              item-value="key"
              label="דקה"/>
          </v-col>
          <v-col style="display: flex; align-items: center" cols="1">
            <p style="flex: 1" class="active-time-label">עד</p>
            <v-select
              v-model="active_time.active_until_hour"
              clearable
              style="flex: 2"
              :items="hours"
              label="שעה"/>
          </v-col>
          <v-col cols="1">
            <v-select
              v-model="active_time.active_until_minute"
              clearable
              :items="minutes"
              item-text="name"
              item-value="key"
              label="דקה"/>
          </v-col>
        </v-row>
        <v-row v-show="false">
          <v-col v-if="form.active_time && form.active_time.length < 7" cols="12">
            <v-btn
              color="#fa4616"
              class="white--text"
              @click="addActiveDay">
              הוסף יום
            </v-btn>
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
import { required } from 'vuelidate/lib/validators'

export default {
  name: 'DistributionPointsListDistributionPoint',

  props: {
    distributionPoint: { type: Object, default: null }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },

  data () {
    return {
      activeTimeFreeTextRules: [
        v => !!v || 'שדה חובה'
      ],
      contactNameRules: [
        v => !!v || 'שדה חובה'
      ],
      additionalPhoneRules: [
        v => !v || v?.length === 10 || 'שדה לא תקין',
        v => !v || /^[0-9]+$/.test(v) || 'שדה לא תקין'
      ],
      phoneRules: [
        v => !!v || 'שדה חובה',
        v => (v && v.length === 10) || 'שדה לא תקין',
        v => /^[0-9]+$/.test(v) || 'שדה לא תקין'
      ],
      minutes: [
        {
          key: 0,
          name: '00'
        }, {
          key: 15,
          name: '15'
        }, {
          key: 30,
          name: '30'
        }, {
          key: 45,
          name: '45'
        }
      ],
      hours: [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
        11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
        21, 22, 23],
      active_day: [
        { key: 'ראשון', value: 1 },
        { key: 'שני', value: 2 },
        { key: 'שלישי', value: 3 },
        { key: 'רביעי', value: 4 },
        { key: 'חמישי', value: 5 },
        { key: 'שישי', value: 6 },
        { key: 'שבת', value: 7 }
      ],
      googleMap: false,
      form: {
        active_time_free_text: null,
        active_time: [{
          active_from_hour: 1,
          active_from_minute: 0,
          active_until_hour: 2,
          active_until_minute: 0,
          active_day: 1
        }],
        name: null,
        point_number: null,
        active: true,
        contact_name: null,
        phone: null,
        additional_phone: null,
        address: {
          target_city: null,
          target_street_name: null,
          target_street_number: null
        },
        personal_company: null,
        store_owner_name: null,
        store_owner_phone_number: null,
        store_owner_email: null,
        bank_account_number: null,
        bank_branch_number: null,
        bank_name: null,
        bank_account_owner_name: null
      }
    }
  },
  computed: {
    deliveryPosition () {
      return {
        lat: +this.distributionPoint?.address?.lat || 0,
        lng: +this.distributionPoint?.address?.lng || 0
      }
    }
  },
  watch: {},
  created () {
    console.log('this.distributionPoint', this.distributionPoint)
    console.log('this.form', this.form)
    if (this.distributionPoint?.uuid) {
      Object.keys(this.form).forEach(key => this.form[key] = this.distributionPoint[key])
      this.form.address.target_street_name = this.distributionPoint.address ? this.distributionPoint.address.correct_long_street_name : null
      this.form.address.target_street_number = this.distributionPoint.address ? this.distributionPoint.address.correct_street_number : null
      this.form.address.target_city = this.distributionPoint.address ? this.distributionPoint.address.correct_long_city_name : null
      this.form.active_time = this.form.active_time ? this.form.active_time : [{
        active_from_hour: 1,
        active_from_minute: 0,
        active_until_hour: 2,
        active_until_minute: 0,
        active_day: 1
      }]
    }
  },
  methods: {
    removeActiveDay (index) {
      this.form.active_time.splice(index, 1)
    },
    addActiveDay () {
      this.form.active_time.push({
        active_from_hour: null,
        active_from_minute: 0,
        active_until_hour: null,
        active_until_minute: 0,
        active_day: null
      })
    },
    submitted (value) {
      if (value.status) {
        this.form = {
          name: null,
          point_number: null,
          contact_name: null,
          phone: null,
          additional_phone: null,
          address: {
            target_city: null,
            target_street_name: null,
            target_street_number: null
          },
          active_time_free_text: null,
          active_time: [{
            active_from_hour: 1,
            active_from_minute: 0,
            active_until_hour: 2,
            active_until_minute: 0,
            active_day: 1
          }]
        }
        this.$router.push({ name: this.$route.matched[0].name })
        this.$store.commit('setDrawerUi', false)
        console.log(value, this.from, 'after')
      }
    }
  },
  validations: {
    form: {
      name: { required },
      address: {
        target_city: { required },
        target_street_name: { required },
        target_street_number: { required }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.delete-button {

}
.active-time-label {
  display: inline;
  margin: 0;
}
.active-time-input {
  border-radius: 10px;
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
  margin: 15px;
}
.input-ui {
  margin-top: 15px;
}
</style>
