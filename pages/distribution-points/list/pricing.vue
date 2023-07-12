<template>
  <FormUi
    :form="form"
    url="distribution-points/add-custom-pricing"
    no-btn
    name="distributionPointPricing"
    :readonly="!$hasPermission('settings-customers-pricing', 'edit')"
    @submitted="submitted">
    <v-container>
      <v-row>
        <v-col cols="4">
          <v-select
            v-model="pricingSelected"
            clearable
            :items="pricingItems"
            item-text="name"
            item-value="id"
            class="select-ui"
            filled
            rounded
            label="סוג מחירון"
            @change="onChangePricingType()"/>
        </v-col>
      </v-row>

      <v-data-table
        class="elevation-1"
        :headers="headers"
        :items="form.delivery_types"
        :footer-props="footerProps">
        <template v-slot:no-data>
          <p v-text="'לא שוייך מחירון'"/>
        </template>

        <template v-slot:item.price="{ item, index }">
          <div>
            <v-text-field
              v-model.number="item.price"
              class="centered-input"
              solo
              flat
              @keyup="changePricing(item, index)"/>
          </div>
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
  name: 'DistributionPointsListPricing',

  props: {
    distributionPoint: { type: Object, default: () => ({}) }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },

  data () {
    return {
      valid: true,
      rows: [],
      pricingItems: [],
      pricingSelected: {},
      originalPricingItems: [],
      form: {
        custom_to: 'distribution_point',
        name: null,
        pricing_id: null,
        distribution_point_id: null,
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
  watch: {},
  async created () {
    try {
      this.pricingItems = await this.$pricingService.findDeliveryTypePricing({
        params: { pricing_to: 'distribution_point', show_custom: true }
      })
      this.originalPricingItems = JSON.parse(JSON.stringify(this.pricingItems))
      this.form.distribution_point_id = this.distributionPoint.id

      this.form.delivery_types = this.distributionPoint.deliveries_types
      if (this.distributionPoint?.deliveries_types?.length > 0) {
        this.pricingSelected = this.distributionPoint.deliveries_types[0].pricing_id
      } else {
        this.pricingSelected = null
      }
      this.form.pricing_id = this.pricingSelected

      this.$nuxt.$on('pricingSubmit', () => {
        if (this.statusOriginalPricingChanged.length > 0) {
          this.form.pricingChanged = true
        }
        console.log('pricingSubmit on ', this.form.pricingChanged)
      })
    } catch (e) {
      this.$helper.snackbar(e, 'created error');
    }
  },
  methods: {
    addRow () {
      this.form.delivery_types.push(
        {
          delivery_type_id: null,
          id: null,
          name: null,
          price: null
        })
    },
    remove (index) {
      this.form.delivery_types.splice(index, 1)
    },
    changePricing (item, index) {
      console.log('item changed', item)
      console.log(index)
      console.log('originalPricingItems', this.originalPricingItems)
      const id = typeof this.pricingSelected === 'object' ? this.pricingSelected && this.pricingSelected.id : this.pricingSelected
      console.log(id)
      for (const pricing of this.originalPricingItems) {
        if (pricing.id === id) {
          const dtp = pricing.deliveryTypesPricing[index]
          console.log('dtp', dtp)
          if (dtp.price !== item.price) {
            if (!this.statusOriginalPricingChanged.includes(dtp.id)) {
              this.$store.dispatch('pricing/addToStatusOriginalPricingChanged', dtp.id)
            }
          } else {
            this.$store.dispatch('pricing/removeFromStatusOriginalPricingChanged', dtp.id)
          }
        }
      }
    },
    onChangePricingType () {
      console.log('onChangePricingType', this.pricingSelected)
      const pricingSelected = this.pricingItems.find(p => {
        return p.id === this.pricingSelected
      })
      this.form.name = pricingSelected?.name
      this.form.pricing_id = pricingSelected?.id
      this.form.delivery_types = pricingSelected?.deliveryTypesPricing
    },
    submitted (value) {
      if (value.status) {
        this.$store.commit('setSnackbar', { value: true, message: 'נשמר בהצלחה', success: true })
        this.form = {}
        this.$router.push({ name: this.$route.matched[0].name })
        this.$store.commit('setDrawerUi', false)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.select-ui {
  margin-bottom: 10px;
}
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

.add-row-btn {
  margin-top: 10px;
  margin-right: 17.6rem;
}
::v-deep {
  .table-ui {
    margin-top: 10px;
  }
}
</style>
