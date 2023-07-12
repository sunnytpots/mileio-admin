<template>
  <div class="sticker-ui">
    <div :class="['sticker-ui-wrapper', 'd-none', 'd-print-block', authUser && `print-type-${authUser.print_type}`]">
      <div
        v-for="(delivery, i) of deliveriesPrint"
        :key="i"
        style="page-break-after: always;">
        <div class="d-flex justify-space-between" style="border-bottom: 3px solid black;">
          <h3>
            <label style="background-color: black; -webkit-print-color-adjust: exact; color: white">
              {{ delivery && delivery.polygon && delivery.polygon.name + ' ' }}
            </label>
            <label v-if="delivery && delivery.line" v-text="delivery && delivery.line.name" />
          </h3>
          <h3 v-if="delivery && delivery.customer" v-text="delivery && delivery.customer.name" />
        </div>

        <div class="mb-3 d-flex justify-space-between" style="border-bottom: 1px solid black;">
          <v-row
            v-if="delivery && delivery.delivery_type && !['regular', 'distribution_point'].includes(delivery.delivery_type.name)"
            class="not-regular"
            style="justify-content: space-between !important;">
            <v-col cols="5">
              <h3>
                <label class="mb-1" v-text="delivery && delivery.customer.name" />
              </h3>
              <h3>
                <label class="mb-1" v-text="delivery && delivery.customer.pickup_address && delivery.customer.pickup_address.correct_long_city_name" />
              </h3>
              <h3>
                <label class="mb-1" v-text="delivery && delivery.customer.pickup_address && `${delivery.customer.pickup_address.correct_long_street_name} ${delivery.customer.pickup_address.correct_street_number}`" />
              </h3>
              <h4>
                <label class="mb-1" v-text="delivery && delivery.customer.phone" />
              </h4>
            </v-col>
            <v-col cols="2" style="display: flex;flex-direction: column;align-items: center;">
              <div class="text-center" v-text="'»'"/>
              <div class="rectangle" v-text="delivery && delivery.delivery_type && delivery.delivery_type.value" />
            </v-col>
            <v-col cols="5" style="text-align: left">
              <h3>
                <label class="mb-1" v-text="delivery && delivery.target_name" />
              </h3>
              <h3>
                <label class="mb-1" v-text="delivery && delivery.target_address && delivery.target_address.correct_long_city_name" />
              </h3>
              <h3>
                <label class="mb-1" v-text="delivery && delivery.target_address && `${delivery.target_address.correct_long_street_name} ${delivery.target_address.correct_street_number}`" />
              </h3>
              <h4>
                <label class="mb-1" v-text="delivery && delivery.target_phone" />
              </h4>
            </v-col>
          </v-row>

          <v-row v-else class="regular">
            <v-col style="width: 80vw;">
              <h3>
                <label class="mb-1" v-text="delivery && delivery.target_name" />
              </h3>
              <h3>
                <label class="mb-1" v-text="delivery && delivery.distribution_point" />
              </h3>
              <h3>
                <label v-if="delivery && delivery.target_address" class="mb-1" v-text="delivery.target_address.correct_long_city_name" />
                <label v-else-if="delivery && delivery.address" class="mb-1" v-text="delivery.address.correct_long_city_name" />
              </h3>
              <h3>
                <label
                  v-if="delivery && delivery.target_address"
                  class="mb-1"
                  v-text="
                    `${delivery.target_address.correct_long_street_name} ${delivery.target_address.correct_street_number}`"/>
                <label
                  v-else-if="delivery && delivery.address"
                  class="mb-1"
                  v-text="
                    `${delivery.address.correct_long_street_name} ${delivery.address.correct_street_number}`"/>
              </h3>
              <h4>
                <label class="mb-1" v-text="delivery && delivery.target_phone" />
              </h4>
            </v-col>
            <v-col cols="4">
              <div class="regular_tab" v-text="delivery && delivery.delivery_type && delivery.delivery_type.value" />
            </v-col>
          </v-row>
        </div>
        <v-row>
          <v-col cols="8">
            <label class="mb-0" v-text="delivery && delivery.comments && delivery.comments.slice(0,30)" />
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
  name: 'StickerUi',

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
      parts: []
    }
  },

  computed: {
    ...mapState('auth', ['authUser'])
  },

  created () {
    this.$nuxt.$on('stickerUi', (isSingle = false) => {
      console.log('Sticker UI ::::', this.deliveries)
      console.log('this.deliveries', this.deliveries)
      if (isSingle) {
        this.deliveriesPrint = [this.delivery]
      } else {
        this.deliveriesPrint = this.deliveries
      }
      console.log('this.deliveriesPrint', this.deliveriesPrint)
      // eslint-disable-next-line nuxt/no-globals-in-created
      setTimeout(() => window.print(), 0)
    })
  },

  destroyed () {
    this.$nuxt.$off('stickerUi')
  },

  methods: {
    onShow (i) {
      console.log('onShow')
      // if (this.deliveries.length > 0) {
      if (this.authUser && this.authUser.print_type !== 'A4') {
        console.log('onShow this.deliveries', this.deliveries)
        return true
      } else {
        console.log('im here')
        return this.parts.includes(i)
      }
      // }
    }
  }
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400&display=swap');

body {
  font-family: 'Rubik' !important;
  font-weight: bolder !important;
}

.print-barcode {
  width: fit-content;
  margin-inline: auto;
  //margin-top: 20px;
}

.regular {
  p {
    //font-size: 10px !important;
  }
}
.not-regular {
  p {
    //font-size: 100px !important;
  }
}
.mb-0 {
  font-size: 15px !important;
}
.text-center {
  transform: rotate(180deg);
  text-align: center !important;
}
.sticker-ui{
  //position: relative;
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
  //border: 1px solid black;
  background-color: rgba(0, 0, 0);
  -webkit-print-color-adjust: exact;
  color: rgba(255, 255, 255);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sticker-ui-wrapper{
  //position: fixed;
  //top: 0;
  //bottom: 0;
  //left: 0;
  //right: 0;
  //z-index: 99999;
  background-color: #fff;
}
//.print-type-A4 {
//  ::v-deep {
//    .col-12, .col-6{
//      padding-top: 0;
//      padding-bottom: 0;
//    }
//
//    .print-items{
//      height: 25vh;
//      overflow: hidden;
//    }
//  }
//  p {
//    font-size: 13px;
//  }
//}
</style>
