<template>
  <div class="stickers-ui">
    <div v-if="authUser && authUser.print_type === 'A4'" :class="['stickers-ui-wrapper', 'd-none', 'd-print-block', authUser && `print-type-${authUser.print_type}`]">
      <div class="container">
        <div class="row">
<!--          <p>MULTI STICKER</p>-->
          <div v-for="(delivery, index) of deliveriesPrint.length < 8 ? 8 : deliveriesPrint.length" :key="index" class="col-6 print-items">
            <div v-if="index >= parts - 1 && deliveriesPrint[index]">
              <div v-if="componentName === 'DistributionPointsBags'">
                <div class="mb-0 d-flex justify-space-between" style="border-bottom: 3px solid black;">
                  <h3>
                    <label v-if="deliveriesPrint[index].dist_point.name" style="background-color: black; -webkit-print-color-adjust: exact; color: white">
                      {{ 'נקודת חלוקה: ' }}
                      {{ deliveriesPrint[index].dist_point.name }}
                    </label>
                  </h3>
                  <h3>
                    <label v-if="deliveriesPrint[index].dist_point.line">
                      {{ 'קו: ' }}
                      {{ deliveriesPrint[index].dist_point.line.name }}
                    </label>
                  </h3>
                </div>

                <div class="mb-2" style="border-bottom: 1px solid black;">
                  <div class="mb-3 d-flex justify-space-between">
                    <div v-if="deliveriesPrint[index].dist_point">
                      <h3>
                        <label class="mb-1">
                          {{ 'עובד החנות שבמשמרת:' }}
                          {{ deliveriesPrint[index].storekeeper_name }}
                        </label>
                      </h3>
                      <h3>
                        <label class="mb-1">
                          {{ 'איש קשר: ' }}
                          {{ deliveriesPrint[index].dist_point.contact_name }}
                        </label>
                      </h3>
                      <h3>
                        <label v-if="deliveriesPrint[index].dist_point.address" class="mb-1">
                          {{ 'עיר נקודת חלוקה: ' }}
                          {{ deliveriesPrint[index].dist_point.address.correct_long_city_name }}
                        </label>
                      </h3>
                      <h3>
                        <label v-if="deliveriesPrint[index].dist_point.address" class="mb-1">
                          {{ 'כתובת: ' }}
                          {{ `${deliveriesPrint[index].dist_point.address.correct_long_street_name} ${deliveriesPrint[index].dist_point.address.correct_street_number}` }}
                        </label>
                      </h3>
                      <h4>
                        <label class="mb-1" v-text="deliveriesPrint[index].dist_point.phone" />
                      </h4>
                    </div>
                  </div>
                </div>

                <div class="d-flex justify-space-between">
                  <v-row>
                    <v-col cols="8">
                      <h3>
                        <label style="display: inline" class="mb-0" v-text="'כמות משלוחים בשק: '"/>
                      </h3>
                      <h3>
                        <label style="display: inline" class="mb-0" v-text="deliveriesPrint[index].packages && deliveriesPrint[index].packages.length" />
                      </h3>
                    </v-col>
                    <v-col cols="4">
                      <h3>
                        <label class="mb-0">
                          {{ deliveriesPrint[index].created_at | formatDate('DD-MM-YYYY') }}
                        </label>
                      </h3>
                    </v-col>
                  </v-row>
                </div>

                <div class="d-flex justify-center">
                  <barcode :value="deliveriesPrint[index].bag_number" height="45">
                    ERROR
                  </barcode>
                </div>
              </div>
              <div v-else>
                <div class="mb-0 d-flex justify-space-between" style="border-bottom: 3px solid black;">
                  <h3>
                    <label v-if="deliveriesPrint[index].branch" style="background-color: black; -webkit-print-color-adjust: exact; color: white">
                      {{ deliveriesPrint[index].branch.name + ' ' }}
                    </label>
                    <label v-if="deliveriesPrint[index].line" v-text="deliveriesPrint[index].line.line_number" />
                  </h3>
                  <h3 v-if="deliveriesPrint[index].customer" v-text="deliveriesPrint[index].customer.name" />
                </div>
                <div class="mb-2" style="border-bottom: 1px solid black;">
                  <div
                    v-if="deliveriesPrint[index].delivery_type && !['regular', 'distribution_point'].includes(deliveriesPrint[index].delivery_type.name)"
                    class="mb-3 d-flex justify-space-between">
                    <v-row style="justify-content: space-between !important;">
                      <v-col cols="5">
                        <h3>
                          <label class="mb-1" v-text="deliveriesPrint[index].customer.name" />
                        </h3>
                        <h3>
                          <label v-if="deliveriesPrint[index].customer.pickup_address" v-text="deliveriesPrint[index].customer.pickup_address.correct_long_city_name" class="mb-1" />
                        </h3>
                        <h3>
                          <label
                            v-if="deliveriesPrint[index].customer.pickup_address"
                            class="mb-1"
                            v-text="`${deliveriesPrint[index].customer.pickup_address.correct_long_street_name} ${deliveriesPrint[index].customer.pickup_address.correct_street_number}`"/>
                        </h3>
                        <h4>
                          <label class="mb-1" v-text="deliveriesPrint[index].customer.phone" />
                        </h4>
                      </v-col>
                      <v-col cols="2" style="display: flex;flex-direction: column;align-items: center;">
                        <div class="text-center" v-text="'»'" />
                        <div class="rectangle" v-text="deliveriesPrint[index].delivery_type.value" />
                      </v-col>
                      <v-col cols="5" style="text-align: left">
                        <h3>
                          <label class="mb-1" v-text="deliveriesPrint[index].target_name" />
                        </h3>
                        <h3>
                          <label class="mb-1" v-text="deliveriesPrint[index].target_address && deliveriesPrint[index].target_address.correct_long_city_name" />
                        </h3>
                        <h3>
                          <label class="mb-1" v-text="deliveriesPrint[index].target_address && `${deliveriesPrint[index].target_address.correct_long_street_name} ${deliveriesPrint[index].target_address.correct_street_number}`" />
                        </h3>
                        <h4>
                          <label class="mb-1" v-text="deliveriesPrint[index].target_phone" />
                        </h4>
                      </v-col>
                    </v-row>
                  </div>
                  <div v-else class="mb-3 d-flex justify-space-between">
                    <v-row style="justify-content: space-between;">
                      <v-col cols="8">
                        <h3>
                          <label class="mb-1" v-text="deliveriesPrint[index].target_name" />
                        </h3>
                        <h3>
                          <label v-if="deliveriesPrint[index].target_address" class="mb-1" v-text="deliveriesPrint[index].target_address.correct_long_city_name" />
                        </h3>
                        <h3>
                          <label v-if="deliveriesPrint[index].target_address" class="mb-1" v-text="`${deliveriesPrint[index].target_address.correct_long_street_name} ${deliveriesPrint[index].target_address.correct_street_number}`" />
                        </h3>
                        <h4>
                          <label class="mb-1" v-text="deliveriesPrint[index].target_phone" />
                        </h4>
                      </v-col>
                      <v-col cols="4" style="left: 0">
                        <div class="regular_tab" v-text="deliveriesPrint[index].delivery_type.value" />
                      </v-col>
                    </v-row>
                  </div>
                </div>
                <div class="d-flex justify-space-between">
                  <v-row>
                    <v-col cols="8">
                      <h3>
                        <label class="mb-0" v-text="deliveriesPrint[index].comments && deliveriesPrint[index].comments.slice(0,30)" />
                      </h3>
                    </v-col>
                    <v-col cols="4">
                      <h3>
                        <label class="mb-0">
                          {{ deliveriesPrint[index].created_at | formatDate('DD-MM-YYYY') }}
                        </label>
                      </h3>
                    </v-col>
                  </v-row>
                </div>
                <div class="d-flex justify-center">
                  <barcode :value="deliveriesPrint[index].barcode" height="45">
                    ERROR
                  </barcode>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <DialogUi v-model="dialog" sm>
      <div class="container">
        <v-radio-group v-model="parts">
          <div class="row">
            <div v-for="part of 8" :key="part" class="col-6 d-flex justify-center">
              <v-radio :label="`מיקום - ${part}`" :value="part" />
            </div>
          </div>
        </v-radio-group>

        <button class="btn" @click.prevent="onPrint" v-text="'שמירה'" />
      </div>
    </DialogUi>
  </div>
</template>

<script>
import VueBarcode from 'vue-barcode'
import { mapState } from 'vuex'

export default {
  name: 'StickersUi',

  components: {
    barcode: VueBarcode
  },

  props: {
    deliveries: { type: Array, default: () => ([]) },
    delivery: { type: Object, default: null },
    componentName: { type: String, default: '' }
  },

  data () {
    return {
      dialog: false,
      parts: 1,
      deliveriesPrint: []
    }
  },

  computed: {
    ...mapState('auth', ['authUser'])
  },

  watch: {
    deliveries: {
      handler (newDeliveriesPrint) {
        const arrLength = this.parts ? this.parts - 1 : 0
        this.deliveriesPrint = [...new Array(arrLength), ...newDeliveriesPrint]
      },
      deep: true
    },

    parts (newParts) {
      const arrLength = newParts !== null ? newParts - 1 : 0
      this.deliveriesPrint = [...new Array(arrLength), ...this.deliveriesPrint]
      console.log('this.deliveriesPrint', this.deliveriesPrint)
    }
  },

  mounted () {
    this.$nuxt.$on('stickersUi', (isSingle = false) => {
      if (isSingle) {
        this.deliveriesPrint = [this.delivery]
      } else {
        this.deliveriesPrint = this.deliveries
      }
      this.dialog = true
      console.log('this.deliveriesPrint', this.deliveriesPrint)
    })
    window.addEventListener('afterprint', this.afterPrint)
  },

  destroyed () {
    this.$nuxt.$off('stickersUi')

    window.removeEventListener('afterprint', this.afterPrint)
  },

  methods: {
    onPrint () {
      this.dialog = false
      setTimeout(() => window.print(), 0)
    },

    afterPrint (event) {
      this.$emit('printed', event)
    }
  }
}
</script>

<style scoped lang="scss">
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400&display=swap');

body {
  font-family: 'Rubik' !important;
}

.sticker-ui{
  position: relative;
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
  height: 30px;
  min-width: 95px;
  width: auto;
  border: 1px solid black;
  background-color: rgba(0, 0, 0);
  -webkit-print-color-adjust: exact;
  color: rgba(255, 255, 255);
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sticker-ui-wrapper{
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 99999;
  //background-color: #fff;
}
.print-type-A4 {
  ::v-deep {
    .col-12, .col-6{
      padding-top: 0;
      padding-bottom: 0;
    }

    .print-items{
      height: 25vh;
      overflow: hidden;
    }
  }
  p {
    font-size: 13px;
  }
}
</style>
