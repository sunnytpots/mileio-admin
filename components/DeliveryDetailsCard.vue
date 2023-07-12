<template>
  <div>
    <v-card outlined class="card">
      <v-container>
        <v-row class="top-details-row" v-if="showHeader">
          <v-col cols="4" class="form-title">
            <span class="origin-details">פרטי מוצא</span>
            <small>תאריך יצירה: 25/10/20 | 8:35 </small>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4;text-align: center">
            <span>משקל</span>
            <span style="display: block;font-size: 22px;">2</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4;text-align: center">
            <span>נפח</span>
            <span style="display: block;font-size: 22px;">86</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4;text-align: center">
            <span>סניף</span>
            <span style="display: block;font-size: 22px;">A</span>
          </v-col>
          <v-col cols="2" style="border-left: 1px solid #e4e4e4;text-align: center">
            <span>קו</span>
            <span style="display: block;font-size: 22px;">611</span>
          </v-col>
        </v-row>
      </v-container>
      <v-form>
        <v-container>
          <v-row class="row-form" style="justify-content: space-around" no-gutters>
            <v-col cols="5">
              <v-text-field v-model="customerFields.name" label="שם הלקוח"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.barcode" label="ברקוד"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="customerFields.address" label="כתובת מוצא"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.order_number" label="מספר הזמנה"/>
            </v-col>
            <v-col cols="5">
<!--              <v-text-field v-model="deliveryInfo.delivery_type.name"  label="סוג משלוח"  />-->
              <v-select
                v-model="defaultDeliveryType"
                clearable
                :items="deliveryTypes"
                item-text="name"
                item-value="id"
                label="סוגי משלוח" />
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.tapuz_number" label="מספר תפוז"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="pickupDriverFields.first_name" label="נהג אוסף"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.rf_id" label="RF-ID"/>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
      <span v-if="showArrow" style="display: flex;justify-content: center;">
        <i class="icon icon-arrow"/>
      </span>
    </v-card>
    <v-card class="card" outlined>
      <v-form>
        <v-container>
          <v-row>
            <v-col cols="8" class="form-title">
              <span class="origin-details">פרטי יעד</span>
              <small>זמן מסירה משוער: 25/10/20 | 8:35 </small>
            </v-col>
            <v-col cols="4">
              <span class="show-map">
                <i class="icon icon-points position-driver-icon"></i>
                <span>הצג מפה</span>
              </span>
            </v-col>
          </v-row>
          <v-row class="row-form" style="justify-content: space-around" no-gutters>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.target_name" label="שם הלקוח"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.target_phone" label="טלפון"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.target_address" label="כתובת"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.target_email" label="דואר אלקטרוני"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.target_city" label="עיר"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="divisorDriverFields.first_name"  label="נהג מוסר" />
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="deliveryInfo.delivery_error_id" label="סיבת כשל"/>
            </v-col>
            <v-col cols="5">
              <v-text-field v-model="bringBackDriverFields.first_name"  label="נהג החזרות" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12">
              <v-text-field v-model="deliveryInfo.comments" label="הערות למשלוח"/>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </v-card>
  </div>
</template>

<script>

// import { mapState } from 'vuex'

export default {
  name: 'DeliveryDetailsCard',

  props: {
    showHeader: { type: Boolean, default: false },
    showArrow: { type: Boolean, default: false },
    deliveryInfo: {
      type: Object,
      default: () => ({})
    },
    deliveryTypes: { type: Array, default: () => ([]) }
  },

  data () {
    return {

    }
  },

  computed: {
    defaultDeliveryType () {
      // for (const type of this.deliveryTypes) {
      //   if (this.deliveryInfo.delivery_type.name === type.name) {
      //     return type
      //   }
      // }
      return this.deliveryTypes.find(type => this.deliveryInfo.delivery_type.name === type.name)
    },
    customerFields () {
      const obj = {}
      if (this.deliveryInfo) {
        if (!this.deliveryInfo.customer) {
          obj.customer = {
            name: null,
            address: null
          }
        } else {
          return this.deliveryInfo.customer
        }
      }
      return obj
    },
    pickupDriverFields () {
      const obj = {}
      if (this.deliveryInfo) {
        if (!this.deliveryInfo.pickup_driver) {
          obj.customer = {
            first_name: null,
            last_name: null
          }
        } else {
          return this.deliveryInfo.pickup_driver
        }
      }
      return obj
    },
    divisorDriverFields () {
      const obj = {}
      if (this.deliveryInfo) {
        if (!this.deliveryInfo.divisor_driver) {
          obj.customer = {
            first_name: null,
            last_name: null
          }
        } else {
          return this.deliveryInfo.divisor_driver
        }
      }
      return obj
    },
    bringBackDriverFields () {
      const obj = {}
      if (this.deliveryInfo) {
        if (!this.deliveryInfo.bring_back_driver) {
          obj.customer = {
            first_name: null,
            last_name: null
          }
        } else {
          return this.deliveryInfo.bring_back_driver
        }
      }
      return obj
    }
  },

  methods: {
    removeSelectedDriver (driverUid) {
      this.$store.commit('global/removeFromDriversArraySelected', driverUid)
    }
  }
}
</script>

<style lang="scss" scoped>

.form-title{
  border-left: 1px solid rgb(228, 228, 228);
  padding-right: 25px;
}
.show-map{
display: flex;
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
  background: #f7f7f7;
}
small{
  display: block;
  font-size: 12px;
}
.top-details-row{
  border-bottom: 1px solid rgb(228, 228, 228);
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
.v-input__slot{
  background: unset;
}
</style>
