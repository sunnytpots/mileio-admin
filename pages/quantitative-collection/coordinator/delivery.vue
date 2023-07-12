<template>
  <FormUi
    :form="form"
    :v="$v.form"
    :url="`collection-tasks/update/${form.uuid}`"
    no-btn
    name="quantitativeDeliveryData"
    :readonly="!$hasPermission('coordinator', 'edit')"
    @submitted="$emit('update:submit-status', $event)">
    <v-card outlined class="card">
      <v-container>
        <v-row class="top-details-row">
          <v-col cols="4" class="form-title">
            <span class="origin-details">פרטי איסוף</span>
            <small>תאריך יצירה: {{ delivery.created_at | formatDate }}</small>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>ממתין לאיסוף</span>
            <span class="data-label">{{ delivery.package_weight }}</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4; text-align: center;">
            <span>נאסף</span>
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

        <v-row class="row-form" style="justify-content: space-between;" no-gutters>
          <v-col cols="5">
            <v-text-field
              v-model="form.customer.name"
              disabled
              label="שם הלקוח"
              class="input-ui"
              filled
              rounded/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.task_number"
              label="מספר משימה"
              disabled
              class="input-ui"
              filled
              rounded/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              v-model="form.customer.address"
              disabled
              label="כתובת מוצא"
              class="input-ui"
              filled
              rounded/>
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
              label="נהג אוסף">
              <template v-slot:append>
                <i class="icon icon-arrowSelect"/>
              </template>
            </v-autocomplete>
          </v-col>
        </v-row>
      </v-container>

      <span style="display: flex; justify-content: center;">
        <i class="icon icon-arrow" />
      </span>
    </v-card>
    <v-card class="card" outlined>
      <v-container style="height: 28rem;">
        <v-row>
          <v-col cols="8" class="form-title">
            <span class="origin-details">כתובת מחסן</span>
          </v-col>
          <v-col cols="4">
            <span class="show-map" @click.prevent="googleMap = true">
              <i class="icon icon-points position-driver-icon" />
              <span>הצג מפה</span>
            </span>
          </v-col>
        </v-row>
        <v-row class="row-form" no-gutters>
          <v-col cols="5">
            <v-text-field
              disabled
              class="input-ui"
              filled
              rounded
              :v-model="form.branch && form.branch.name"
              label="מחסן" />
          </v-col>
          <v-col cols="5">
            <v-text-field
              class="input-ui"
              filled
              rounded
              disabled
              :v-model="form.branch && form.branch.formatted_address && form.branch.formatted_address.correct_long_street_name"
              label="כתובת"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              class="input-ui"
              filled
              rounded
              disabled
              :v-model="form.branch && form.branch.formatted_address && form.branch.formatted_address.correct_long_city_name"
              label="עיר"/>
          </v-col>
          <v-col cols="5">
            <v-text-field
              class="input-ui"
              filled
              rounded
              disabled
              :v-model="form.branch && form.branch.formatted_address && form.branch.formatted_address.correct_street_number"
              label="מספר בית"/>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="form.comments"
              label="הערות למשלוח"
              class="input-ui"
              filled
              rounded/>
          </v-col>
        </v-row>
      </v-container>
    </v-card>

    <DialogUi v-model="googleMap" xl>
      <GoogleMap>
        <GMapMarkerIO
          :position="{
            lat: delivery.target_address ? +delivery.target_address.lat : 0 ,
            lng: delivery.target_address ? +delivery.target_address.lng : 0 }"
          icon="driver"/>
      </GoogleMap>
    </DialogUi>
  </FormUi>
</template>

<script>
import { mapState } from 'vuex'
import { required } from 'vuelidate/lib/validators'

export default {
  name: 'CoordinatorDelivery',

  props: {
    delivery: { type: Object, default: () => ({}) },
    form: { type: Object, default: () => ({}) },
    deliveryTypes: { type: Array, default: () => ([]) },
    drivers: { type: Array, default: () => ([]) },
    tags: { type: Array, default: () => ([]) }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },

  data () {
    return {
      googleMap: false
    }
  },
  computed: {
    ...mapState('auth', ['authUser'])
  },
  watch: {
    tags: {
      handler (newVal) {
        this.form.tags = newVal
      },
      deep: true
    }
  },
  created () {
    this.form.pickup_driver_uid = this.delivery.pickup_driver ? this.delivery.pickup_driver.uuid : null
  },
  methods: {
  },
  validations: {
    form: { required }
  }
}
</script>

<style lang="scss" scoped>

.row-form{
  justify-content: space-between;
  padding-left: 25px;
  padding-right: 25px;
}

iframe{
  width: 100%;
}
.form-title{
  border-left: 1px solid rgb(228, 228, 228);
  padding-right: 25px;
}
.show-map{
  display: flex;
  cursor: pointer;
  margin-top: 14px;
  margin-right: 100px;
  font-size: 14px;
  color:red;
  span{
    margin-right: 3px;
  }
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
  margin-bottom: 5px;
  border-bottom: 1px solid rgb(228, 228, 228);
  .data-label{
    display: block;
    font-size: 16px;
  }
}

.origin-details{
  color: #38a8cd;
}

.position-driver-icon{
  width: 8px
}
.delivery-info{
  width: 70%;
  margin-top: 10px;
  font-size: 15px;
}
.theme--light.v-input--is-disabled input, .theme--light.v-input--is-disabled textarea{
  color: #ff3366;
}
.input-ui,.autocomplete-ui {
  margin: 5px 0px;
}
</style>
