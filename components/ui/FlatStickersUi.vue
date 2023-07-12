<template>
  <div class="stickers-ui">
    <div
      v-if="authUser && authUser.print_type === 'A4'"
      :class="['stickers-ui-wrapper', 'd-none', 'd-print-block', authUser && `print-type-${authUser.print_type}`]">
      <div
        v-for="(delivery, index) of deliveriesPrint.length < 8 ? 8 : deliveriesPrint.length"
        :key="index"
        class="col-6 print-items">
        <div v-if="index >= parts - 1 && !!(deliveriesPrint[index] && deliveriesPrint[index].id)">
          <div class="d-flex justify-space-between sticker-header" style="border-bottom: 3px solid black">
            <v-container v-if="deliveriesPrint[index] && deliveriesPrint[index].line && deliveriesPrint[index].line.name" class="polyline-container">
              <v-row>
                <v-col>
                  <h4>
                    <label v-text="deliveriesPrint[index].polygon && deliveriesPrint[index].polygon.name"/>
                  </h4>
                </v-col>
                <v-col>
                  <label
                    :style="`font-size: ${deliveriesPrint[index].branch.name && deliveriesPrint[index].branch.name.length > 15 ? '12px !important' : 'auto'}`"
                    v-text="deliveriesPrint[index].branch.name"/>
                </v-col>
              </v-row>
              <v-row v-if="deliveriesPrint[index]">
                <v-col>
                  <h4>
                    <label v-text="deliveriesPrint[index].line.line_number"/>
                  </h4>
                </v-col>
                <v-col>
                  <p
                    :style="`font-size: ${deliveriesPrint[index].line.name && deliveriesPrint[index].line.name.length > 15 ? '12px !important' : 'auto'}`"
                    v-text="deliveriesPrint[index].line.name.length > 70? deliveriesPrint[index].line.name.substring(0,70) + '...' : deliveriesPrint[index].line.name "/>
                </v-col>
              </v-row>
            </v-container>
            <h4
              v-if="deliveriesPrint[index] && deliveriesPrint[index].customer.name"
              :style="`font-size: ${deliveriesPrint[index].customer.name && deliveriesPrint[index].customer.name.length > 15 ? '12px !important' : 'auto'}`"
              class="customer-name-label"
              v-text="deliveriesPrint[index].customer.name" />
          </div>
          <div class="mb-2" style="border-bottom: 1px solid black;">
            <div class="mb-3 d-flex justify-space-between">
              <v-row style="justify-content: space-between;">
                <v-col cols="8">
                  <div v-if="deliveriesPrint[index] && statusesToSwitchAddress.includes(deliveriesPrint[index].status.key)">
                    <h4>
                      <label
                        v-if="deliveriesPrint[index]"
                        class="mb-1"
                        v-text="`מ: ${deliveriesPrint[index].target_name}`" />
                    </h4>
                    <h4>
                      <label
                        v-if="deliveriesPrint[index]"
                        class="mb-1"
                        v-text="`אל: ${deliveriesPrint[index].customer.pickup_address.correct_long_city_name}`" />
                    </h4>
                    <h4>
                      <label
                        v-if="deliveriesPrint[index] && deliveriesPrint[index].customer &&
                          deliveriesPrint[index].customer.pickup_address &&
                          deliveriesPrint[index].customer.pickup_address.correct_long_street_name &&
                          deliveriesPrint[index].customer.pickup_address.correct_street_number"
                        class="mb-1"
                        v-text="`${deliveriesPrint[index].customer.pickup_address.correct_long_street_name} ${deliveriesPrint[index].customer.pickup_address.correct_street_number}`" />
                    </h4>
                  </div>
                  <div v-else>
                    <h4>
                      <label
                        v-if="deliveriesPrint[index]"
                        class="mb-1"
                        v-text="deliveriesPrint[index].target_name" />
                    </h4>
                    <h4>
                      <label
                        v-if="deliveriesPrint[index]"
                        class="mb-1"
                        v-text="deliveriesPrint[index].target_address.correct_long_city_name" />
                    </h4>
                    <h4>
                      <label
                        v-if="deliveriesPrint[index] && deliveriesPrint[index].target_address &&
                          deliveriesPrint[index].target_address.correct_long_street_name &&
                          deliveriesPrint[index].target_address.correct_street_number"
                        class="mb-1"
                        v-text="`${deliveriesPrint[index].target_address.correct_long_street_name} ${deliveriesPrint[index].target_address.correct_street_number}`" />
                    </h4>
                  </div>
                  <h4>
                    <label
                      class="mb-1"
                      v-text="deliveriesPrint[index].target_phone" />
                  </h4>
                </v-col>
                <v-col cols="4" style="left: 0">
                  <label
                    class="regular_tab"
                    v-text="deliveriesPrint[index].delivery_type.value" />
                </v-col>
              </v-row>
            </div>
          </div>
          <div class="d-flex justify-space-between">
            <v-row>
              <v-col cols="8">
                <h5>
                  <label
                    v-if="deliveriesPrint[index] && deliveriesPrint[index].comments"
                    :style="`font-size: ${deliveriesPrint[index].comments && deliveriesPrint[index].comments.length > 15 ? '12px !important' : 'auto'}`"
                    class="mb-0"
                    v-text="deliveriesPrint[index].comments && deliveriesPrint[index].comments.slice(0,30)"/>
                </h5>
              </v-col>
              <v-col cols="4">
                <h4>
                  <label class="mb-0">
                    {{ deliveriesPrint[index].created_at | formatDate('DD-MM-YYYY') }}
                  </label>
                </h4>
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
  name: 'FlatStickersUi',

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
      statusesToSwitchAddress: [
        'returning_to_storage',
        'collected_waiting_refund',
        'back_to_storage'
      ],
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

    parts: {
      handler (newParts) {
        const arrLength = newParts !== null ? newParts - 1 : 0
        const tempDeliveriesPrint = this.deliveriesPrint.filter(delivery => delivery && delivery.id)
        this.deliveriesPrint = [...new Array(arrLength), ...tempDeliveriesPrint]
        console.log('this.deliveriesPrint', this.deliveriesPrint)
        console.log('parts watch', newParts)
      },
      deep: true
    }
  },
  created () {
    this.$nuxt.$on('stickersUi', (isSingle = false) => {
      console.log('flatStickersUi created')
      if (isSingle) {
        this.deliveriesPrint = [this.delivery]
      } else {
        this.deliveriesPrint = this.deliveries
      }
      this.dialog = true
      console.log('FlatStickersUi this.deliveriesPrint', this.deliveriesPrint)
    })
  },
  mounted () {
    // window.addEventListener('afterprint', this.afterPrint)
  },
  destroyed () {
    this.$nuxt.$off('stickersUi')
    // window.removeEventListener('afterprint', this.afterPrint)
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
      .long-text {
        font-size: 50%;
        line-height: 10px;
        text-indent: 0;
        letter-spacing: 0;
      }
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
</style>
