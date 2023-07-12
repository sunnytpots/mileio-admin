<template>
  <div class="sticker-ui">
    <div :class="['sticker-ui-wrapper', 'd-none', 'd-print-block', authUser && `print-type-${authUser.print_type}`]">
      <div
        v-for="(delivery, i) of deliveriesPrint"
        :key="i"
        style="page-break-after: always;">
        <div class="sticker-header" style="border-bottom: 3px solid black;">
          <v-container v-if="delivery && delivery.line && delivery.line.name" class="polyline-container">
            <v-row v-if="delivery">
              <v-col>
                <h4>
                  <label v-text="delivery.polygon.name"/>
                </h4>
              </v-col>
              <v-col>
                <label
                  :style="`font-size: ${delivery.branch && delivery.branch.name && delivery.branch.name.length > 15 ? '12px !important' : 'auto'}`"
                  v-text="delivery.branch.name"/>
              </v-col>
            </v-row>
            <v-row v-if="delivery && delivery.line">
              <v-col>
                <h4>
                  <label v-text="delivery.line.line_number"/>
                </h4>
              </v-col>
              <v-col>
                <p
                  v-if="delivery && delivery.line"
                  :style="`font-size: ${delivery.line.name && delivery.line.name.length > 15 ? '12px !important' : 'auto'}`"
                  v-text="delivery.line.name.length > 70? delivery.line.name.substring(0,70) + '...' : delivery.line.name "/>
              </v-col>
            </v-row>
          </v-container>
          <h4
            v-if="delivery.customer && delivery.customer.name"
            :style="`font-size: ${delivery.customer.name.length > 15 ? '12px !important' : 'auto'}`"
            class="customer-name-label"
            v-text="delivery.customer.name"/>
        </div>

        <div class="mb-3 d-flex justify-space-between" style="border-bottom: 1px solid black;">
          <v-row class="regular">
            <v-col style="width: 80vw;">
              <div v-if="delivery && delivery.status && statusesToSwitchAddress.includes(delivery.status.key)">
                <h4>
                  <label v-if="delivery" class="mb-1" v-text="`מ: ${delivery.target_name}`" />
                </h4>
                <h4>
                  <label
                    v-if="delivery.customer"
                    class="mb-1"
                    v-text="`אל: ${delivery.customer.pickup_address.correct_long_city_name}`" />
                </h4>
                <h4>
                  <label
                    v-if="delivery.customer && delivery.customer.pickup_address.correct_long_street_name && delivery.customer.pickup_address.correct_street_number"
                    class="mb-1"
                    v-text="`${delivery.customer.pickup_address.correct_long_street_name} ${delivery.customer.pickup_address.correct_street_number}`"/>
                </h4>
              </div>
              <div v-else>
                <h4>
                  <label
                    v-if="delivery"
                    class="mb-1"
                    v-text="delivery.target_name" />
                </h4>
                <h4>
                  <label
                    v-if="delivery.target_address"
                    class="mb-1"
                    v-text="delivery.target_address.correct_long_city_name" />
                </h4>
                <h4>
                  <label
                    v-if="delivery.target_address && delivery.target_address.correct_long_street_name && delivery.target_address.correct_street_number"
                    class="mb-1"
                    v-text="`${delivery.target_address.correct_long_street_name} ${delivery.target_address.correct_street_number}`"/>
                </h4>
              </div>
              <h4>
                <label
                  v-if="delivery"
                  class="mb-1"
                  v-text="delivery.target_phone" />
              </h4>
            </v-col>
            <v-col cols="4">
              <label
                v-if="delivery && delivery.delivery_type"
                class="regular_tab"
                v-text="delivery.delivery_type.value" />
            </v-col>
          </v-row>
        </div>
        <v-row>
          <v-col cols="8">
            <h5>
              <label
                v-if="delivery"
                :style="`font-size: ${delivery.comments && delivery.comments.length > 15 ? '12px !important' : 'auto'}`"
                class="mb-0"
                v-text="delivery.comments && delivery.comments.slice(0,30)" />
            </h5>
          </v-col>
          <v-col cols="4">
            <label class="mb-0">
              {{ delivery && delivery.created_at | formatDate('DD-MM-YYYY') }}
            </label>
          </v-col>
        </v-row>
        <barcode
          class="print-barcode"
          :value="delivery && delivery.barcode"
          height="45">
          ERROR
        </barcode>
      </div>
    </div>
  </div>
</template>

<script>
import VueBarcode from 'vue-barcode'
import { mapState } from 'vuex'

export default {
  name: 'FlatStickerUi',

  components: {
    barcode: VueBarcode
  },

  props: {
    deliveries: { type: Array, default: () => ([]) },
    delivery: { type: Object, default: null }
  },

  data () {
    return {
      deliveriesPrint: [],
      statusesToSwitchAddress: [
        'returning_to_storage',
        'collected_waiting_refund',
        'back_to_storage'
      ],
      parts: []
    }
  },
  computed: {
    ...mapState('auth', ['authUser'])
  },
  created () {
    this.$nuxt.$on('stickerUi', (isSingle = false) => {
      if (isSingle) {
        this.deliveriesPrint = [this.delivery]
      } else {
        this.deliveriesPrint = this.deliveries
      }
      console.log('FlatStickerUi this.deliveriesPrint', this.deliveriesPrint)
      // eslint-disable-next-line nuxt/no-globals-in-created
      setTimeout(() => window.print(), 0)
    })
  },
  mounted () {
    // window.addEventListener('afterprint', this.afterPrint)
  },
  destroyed () {
    this.$nuxt.$off('stickerUi')
    // window.removeEventListener('afterprint', this.afterPrint)
  },
  methods: {
    afterPrint (event) {
      this.$emit('printed', event)
    }
  }
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400&display=swap');
.sticker-header {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  .polyline-container {
    align-self: flex-start;
    flex: 2;
    .row {
      padding: 0;
    }
    .row .col {
      border: 1px solid black !important;
      text-align: center;
      padding: 0;
      height: 25px;
      p {
        margin: 0;
      }
    }
  }
  .customer-name-label {
    flex: 1;
    text-align: left !important;
  }
}
.long-text {
  font-size: 10px !important;
  line-height: 10px;
  text-indent: 0;
  letter-spacing: 0;
}
body {
  font-family: 'Rubik' !important;
  font-weight: bolder !important;
}

.print-barcode {
  width: fit-content;
  margin-inline: auto;
  //margin-top: 20px;
}

.mb-0 {
  font-size: 15px !important;
}
.text-center {
  transform: rotate(180deg);
  text-align: center !important;
}
.sticker-ui{
  z-index: 99999;
}
.fullscreen {
  width: 100vw;
  height: 100vh;
}
.rectangle{
  height: 30px;
  width: 80px;
  border: 1px solid black;
  text-align: center;
  align-items: center;
  justify-content: center;
  transform: rotate(269.5deg);
  -webkit-print-color-adjust: exact;
  background-color: rgba(0, 0, 0);
  color: rgba(255, 255, 255);
  margin-top: 25px;
}
.regular_tab{
  margin-inline-end: 75px !important;
  height: 30px;
  width: fit-content !important;
  min-width: 90px;
  background-color: rgba(0, 0, 0);
  -webkit-print-color-adjust: exact;
  color: rgba(255, 255, 255);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sticker-ui-wrapper{
  background-color: #fff;
}
</style>
