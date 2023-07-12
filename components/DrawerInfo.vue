<template>
  <div class="drawer-info">
    <div class="drawer-info-bg" @click="$emit('drawerToggle', false)" />
    <div class="drawer-info-shell">
      <div class="drawer-info-header">
        <slot name="header" />
      </div>
      <div class="drawer-info-body">
        <div class="drawer-info-aside">
          <slot name="side-content" />
        </div>
        <div class="drawer-info-content">
          <slot name="form-content" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DrawerInfo',

  model: {
    event: 'drawerToggle',
    prop: 'drawerInfo'
  },

  props: {
    deliveryInfo: { type: Object, default: () => ({}) },
    tabs: { type: Array, default: () => ([]) },
    showDeliveryDetails: { type: Boolean, default: false }
  },

  data () {
    return {
      stepper: 1,
      customerDetailsFields: [
        {
          field_name: 'שם הלקוח',
          model: 'customer_name',
          component: 'v-text'
        },
        {
          field_name: 'ברקוד',
          model: 'barcode',
          component: 'v-select'
        },
        {
          field_name: 'כתובת מוצא',
          model: 'customer_address'
        },
        {
          field_name: 'מספר הזמנה',
          model: 'order_number'
        },
        {
          field_name: 'סוג משלוח',
          model: 'delivery_type'
        },
        {
          field_name: 'מספר תפוז',
          model: 'tapuz_number'
        },
        {
          field_name: 'נהג אוסף',
          model: 'divisor_driver'
        },
        {
          field_name: 'RF-ID',
          model: 'rf_id'
        }
      ],

      tab: null,
      showItemStatus: false,
      showDeliveryStatuses: false
    }
  },

  computed: {
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

  watch: {
    deliveryInfo () {
      console.log(this.deliveryInfo, 'deliveryInfo')
    }
  }
}
</script>

<style lang="scss" scoped>

.save-btn{
  margin-top: 6px;
  margin-right: 50px;
}

.row-form {
  .v-text-field__details {
    display: none;
  }
}

.drawer-info {
  display: flex;
  justify-content: flex-end;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;

  .drawer-info-bg {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .drawer-info-shell {
    width: 61.55rem;
    height: 100%;
    background-color: #fff;
    box-shadow: 0 0 15px 0 #00000078;
    position: relative;
    z-index: 5;
  }

  .drawer-info-header {
    border-bottom: 1px solid #E4E4E4;

    .v-tab {
      font-size: 1rem;
      padding: 0 3rem;
    }

    .v-tab.v-tab--active {
      color: #34AA54;
    }

    .theme--light.v-tabs > .v-tabs-bar .v-tab:not(.v-tab--active) {
      color: #363636;
    }

    .primary--text {
      caret-color: #34AA54 !important;
      color: #34AA54 !important;
    }

    .v-tabs-slider-wrapper {
      height: 4px !important;
    }

    .v-tabs-bar {
      height: 51px;
    }
  }

  .drawer-info-body {
    display: grid;
    grid-template-columns: 30% 70%;
    grid-template-rows: 1fr;
    height: 100%;

    .drawer-info-aside {
      padding: 2.7rem 1.5rem;
      border-left: 1px solid #E4E4E4;

      h4 {
        font-size: 1.3rem;
        margin-bottom: .9rem;
      }

      p {
        font-size: .8rem;
        margin-bottom: 0;
      }
    }

    .drawer-info-content {
      padding: 1rem 1.5rem;
    }

    .contact-text {
      padding-top: 5rem;

      h4 {
        margin-bottom: .25rem;
        font-size: 1rem;
        color: #363636;
      }

      div {
        font-size: 1rem;
        color: #8A8888;
      }
    }
  }
}
</style>
