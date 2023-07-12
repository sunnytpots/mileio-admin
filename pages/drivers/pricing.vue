<template>
  <FormUi
    :form="form"
    no-btn
    name="driverPricing"
    url="pricing/add-custom-delivery-type-pricing"
    :readonly="!$hasPermission('drivers', 'edit')"
    @submitted="$emit('update:submit-status', $event)"
  >
    <v-container>
      <v-row>
        <v-col cols="4">
          <v-select
            v-model="pricingSelected"
            clearable
            :items="pricingItems"
            item-text="name"
            item-value="id"
            label="סוג מחירון"
            class="select-ui"
            filled
            rounded>
            <template v-slot:append>
              <i class="icon icon-arrowSelect"/>
            </template>
          </v-select>
        </v-col>
      </v-row>

      <v-data-table
        :headers="headers"
        :items="form.delivery_types"
        :loading="loading"
        class="elevation-1"
        :footer-props="footerProps">
        <template v-slot:no-data>
          <p v-text="'אין מידע.'"/>
        </template>

        <template v-slot:item.price="{ item, index }">
          <v-text-field v-model.number="item.price" @keyup="changePricing(item, index)" />
        </template>

        <template v-slot:item.options="{ index }">
          <div class="delete-button">
            <v-btn class="btn-secondary" @click.prevent="remove(index)">
              <i class="icon icon-bucket" />
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-container>
  </FormUi>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'DriversPricing',

  props: {
    driver: { type: Object, default: () => ({}) }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },

  data () {
    return {
      loading: false,
      valid: true,
      rows: [],
      pricingItems: [],
      pricingSelected: {},
      originalPricingItems: [],
      form: {
        custom_to: 'driver',
        name: null,
        pricing_id: null,
        driver_id: null,
        pricingChanged: false,
        delivery_types: []
      }
    }
  },

  computed: {
    ...mapState('pricing', ['statusOriginalPricingChanged']),
    ...mapState('global', ['footerProps']),

    headers () {
      const arr = [
        { text: 'סוג משלוח', align: 'center', value: 'delivery_type.value' },
        { text: 'מחיר', align: 'center', value: 'price' },
        { text: 'אפשרויות', align: 'center', value: 'options', sortable: false }
      ]
      return arr
    }
  },
  watch: {
    pricingSelected: {
      handler (item) {
        const id = typeof item === 'object' ? item?.id : item
        const pricingSelected = this.pricingItems.find(pricing => pricing.id === id)
        this.form.name = pricingSelected?.name
        this.form.pricing_id = pricingSelected?.id
        this.form.delivery_types = pricingSelected?.deliveryTypesPricing
        this.form.driver_id = this.driver.id
      }
    }
  },

  async created () {
    try {
      this.loading = true
      this.pricingItems = await this.$pricingService.findDeliveryTypePricing({
        pricing_to: 'driver',
        driver_id: this.driver.id,
        show_custom: true
      })
      this.originalPricingItems = JSON.parse(JSON.stringify(this.pricingItems))

      if (this.driver.deliveries_types && this.driver.deliveries_types.length > 0) {
        const defaultPricing = this.pricingItems.find(pricingItem => {
          if (this.driver.deliveries_types?.[0].pricing) {
            return pricingItem.id === this.driver.deliveries_types[0].pricing.id
          }
        })

        this.form.delivery_types = defaultPricing?.deliveryTypesPricing
        this.pricingSelected = this.driver.deliveries_types[0].pricing
      }

      this.loading = false
      this.$nuxt.$on('pricingSubmit', () => {
        console.log('this.statusOriginalPricingChanged', this.statusOriginalPricingChanged)
        if (this.statusOriginalPricingChanged.length > 0) {
          this.form.pricingChanged = true
        }
      })
    } catch (e) {
      this.loading = false
      this.$helper.snackbar(e, 'created error')
    }
  },
  methods: {
    addRow () {
      this.form.delivery_types.push({
        delivery_type_id: null,
        id: null,
        name: null,
        price: null
      })
    },
    remove (index) {
      this.form.delivery_types.splice(index, 1)
      this.form.pricingChanged = true
    },
    changePricing (item, index) {
      const id = typeof this.pricingSelected === 'object' ? this.pricingSelected?.id : this.pricingSelected
      for (const pricing of this.originalPricingItems) {
        if (pricing.id === id) {
          const dtp = pricing.deliveryTypesPricing[index]
          if (dtp.id === item.id && dtp.price !== item.price) {
            if (!this.statusOriginalPricingChanged.includes(dtp.id)) {
              this.$store.dispatch('pricing/addToStatusOriginalPricingChanged', dtp.id)
            }
          } else {
            this.$store.dispatch('pricing/removeFromStatusOriginalPricingChanged', dtp.id)
          }
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.elevation-1 {
  background-color: #FFFFFF;
  ::v-deep {
    table thead tr th {
      background-color: #F4F4F4 !important;
      height: 65px;
      span {
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #000000;
      }
      .v-data-table-body {
        height: 65px;
      }
    }

    .deleted-delivery {
      background-color: #ffffa1 !important;
    }

    .delivery-with-error {
      background-color: #f5b700 !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .delivery-with-error:hover {
      background-color: darken(#ffd344, 10%) !important;
    }

    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}
td {
  border: 1px solid #ebebeb;
  height: 70px !important;
}
.top-details-row {
  border-bottom: 1px solid rgb(228, 228, 228);
  .data-label {
    display: block;
    font-size: 16px;
  }
}

.delete-button {
  text-align: center;
  margin-top: -1rem;
  .v-btn {
    padding: .2rem;
    height: inherit;
    min-width: inherit;
    margin-top: 1.6rem;
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}

.add-row-btn{
  margin-top: 10px;
  margin-right: 17.6rem;
}
.select-ui {
  margin-bottom: 10px;
}
</style>
