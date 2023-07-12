<template>
  <FormUi
    :form="form"
    url="pricing/add-custom-delivery-type-pricing"
    no-btn
    name="customerPricing"
    :readonly="!$hasPermission('settings-customers-pricing', 'edit')"
    @submitted="$emit('update:submit-status', $event)">
    <v-container>
      <v-row>
        <v-col cols="4">
          <v-select
            v-model="pricingSelected"
            clearable
            :items="pricingItems"
            item-text="name"
            item-value="id"
            label="סוג מחירון" />
        </v-col>
      </v-row>

      <v-data-table
        :items="form.delivery_types"
        :headers="pricingHeaders"
        :loading="loading"
        hide-default-footer>
        <template v-slot:no-data>
          <p v-text="'אין מידע.'"/>
        </template>

        <template v-slot:item.price="{ item, index }">
          <v-text-field v-model.number="item.price" @keyup="changePricing(item, index)" />
        </template>

        <template v-slot:item.options="{ item, index }">
          <div class="delete-button">
            <v-btn class="btn-secondary" @click.prevent="remove(index)">
              <i class="icon icon-bucket" />
            </v-btn>
          </div>
        </template>
      </v-data-table>

      <div
        v-if="form.polygon_pricing"
        style="margin-top: 100px">
        <h4
          style="margin-bottom: 30px"
          v-text="'*למחירון זה קיימת תוספת מחיר על פוליגון'"/>
        <h5
          style="margin-bottom:15px;"
          v-text="`שם מחירון פוליגון: ${form.polygon_pricing.pricing_name}`"/>
        <v-data-table
          :items="form.polygon_pricing.polygon_pricing_list"
          :headers="polygonPricingListHeaders"
          :loading="loading"
          hide-default-footer
          style="width: 50%; background-color: #c9c1c1"/>
      </div>
    </v-container>
  </FormUi>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'SettingsCustomersPricing',

  props: {
    customer: { type: Object, default: () => ({}) }
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
        custom_to: 'customer',
        name: null,
        pricing_id: null,
        customer_id: null,
        pricingChanged: false,
        delivery_types: [],
        polygon_pricing: null
      }
    }
  },
  computed: {
    ...mapState('pricing', ['statusOriginalPricingChanged']),

    pricingHeaders () {
      const arr = [
        { text: 'סוג משלוח', align: 'center', value: 'delivery_type.value' },
        { text: 'מחיר', align: 'center', value: 'price', width: '20%' },
        { text: 'מכמות', align: 'center', value: 'from_quantity' },
        { text: 'עד כמות', align: 'center', value: 'until_quantity' },
        { text: 'אפשרויות', align: 'center', value: 'options', sortable: false }
      ]
      return arr
    },
    polygonPricingListHeaders () {
      const arr = [
        { text: 'שם פוליגון', align: 'center', value: 'polygon.name' },
        { text: 'תוספת מחיר', align: 'center', value: 'polygon_price' }
      ]
      return arr
    }
  },
  watch: {
    pricingSelected: {
      handler (item) {
        const id = typeof item === 'object' ? item?.id : item
        const pricingSelected = this.pricingItems.find(pricingItem => pricingItem.id === id)
        this.form.name = pricingSelected?.name
        this.form.pricing_id = pricingSelected?.id
        this.form.delivery_types = pricingSelected?.deliveryTypesPricing
        this.form.polygon_pricing = pricingSelected?.polygon_pricing
        this.form.customer_id = this.customer.id
      }
    }
  },
  async created () {
    try {
      this.loading = true
      this.pricingItems = await this.$pricingService.findDeliveryTypePricing({
        params: { pricing_to: 'customer', show_custom: true }
      })
      this.originalPricingItems = JSON.parse(JSON.stringify(this.pricingItems))

      if (this.customer?.deliveries_types?.length > 0) {
        const defaultPricing = this.pricingItems.find(p => p.id === this.customer.deliveries_types?.[0]?.pricing?.id)
        this.form.delivery_types = defaultPricing?.deliveryTypesPricing
        this.pricingSelected = this.customer.deliveries_types[0].pricing
      }

      this.loading = false

      this.$nuxt.$on('pricingSubmit', () => {
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
td{
  border: 1px solid #ebebeb;
  height: 70px !important;
}
.top-details-row{
  border-bottom: 1px solid rgb(228, 228, 228);
  .data-label{
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
</style>
