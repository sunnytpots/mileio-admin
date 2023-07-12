<template>
  <CardUi>
    <v-data-table
      :items="items"
      :headers="headers"
      :loading="loading"
      class="elevation-1"
      loading-text="טוען מחירונים, אנא המתן..."
      :footer-props="footerProps">
      <template v-slot:no-data>
        <p v-text="'אין מידע.'"/>
      </template>

      <template v-slot:item.actions="{ item, index }">
        <div v-if="$hasPermission('settings-pricing', 'edit')" class="options">
          <v-btn class="btn-secondary btn-edit" @click.prevent="editData(item)">
            <i class="icon icon-pen" />
          </v-btn>
          <v-btn class="btn-secondary btn-edit" @click.prevent="copyData(item)">
            <i class="icon icon-copy" />
          </v-btn>
          <DeleteButton
            :url="`pricing/delete/${items[index].id}`"
            api-method="$post"
            has-warning
            @deleted="getData"/>
        </div>
      </template>
    </v-data-table>

    <DialogUi
      v-model="drawerUi"
      md
      persistent>
      <FormUi
        :form="pricing"
        ref-prop="checkDistributionPointPricing"
        :url="pricing && pricing.id ? 'pricing/update-delivery-type-pricing' : 'pricing/add-delivery-type-pricing'"
        name="distributionPointPricingData"
        cancel-btn
        @cancel-submission="drawerUi = false"
        @submitted="submitted">
        <v-container>
          <v-row>
            <v-col cols="6" style="margin: auto">
              <v-text-field
                v-model="pricing.name"
                label="שם מחירון"
                :rules="[pricingNameRule]" />
            </v-col>
          </v-row>
          <v-row v-for="(textField, index) in pricing.deliveryTypesPricing" :key="index">
            <v-col cols="4">
              <v-text-field v-text="'מחירון עבור נקודת חלוקה'"/>
            </v-col>
            <v-col cols="5">
              <v-text-field
                v-model.number="textField.price"
                label="מחיר"
                type="number"
                min="1"
                :rules="priceRules"/>
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" align="center">
              <p v-if="showError" style="color: red">לא ניתן ליצור מחירון חדש עבור סוג מחירון קיים</p>
            </v-col>
          </v-row>
        </v-container>
      </FormUi>
    </DialogUi>
  </CardUi>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'SettingsPricingDistributionPoint',

  data () {
    return {
      loading: false,
      editMode: false,
      noDoubleType: true,
      showError: false,
      headersOld: [
        { title: 'שם מחירון' },
        { title: 'מזהה מחירון' },
        { ...this.$hasPermission('settings-pricing', 'edit') && { title: 'אפשרויות', classes: 'text-left' } }
      ],
      deliveryValidate: [],
      onSave: false,
      items: [],
      distributionDeliveryPointType: null,
      pricing: {
        id: null,
        name: '',
        custom_to: 'distribution_point',
        pricing_to: 'distribution_point',
        deliveryTypesPricing: [{
          delivery_type_id: null,
          from_quantity: null,
          until_quantity: null,
          price: null,
          name: null
        }]
      },
      valid: true,
      FieldsRules: [
        v => !!v || 'שדה חובה'
      ],
      priceRules: [
        v => !!v || 'שדה חובה',
        v => (v && typeof v === 'number' && v >= 0) || 'שדה מספרי חיובי בלבד'
      ],
      deliveryTypeRules: []
    }
  },

  computed: {
    ...mapState('global', ['delivery_types', 'footerProps']),

    disableConfirm () {
      return !this.pricing?.name?.length || !this.noDoubleType || !this.valid
    },
    headers () {
      const arr = [
        { text: 'שם מחירון', align: 'center', value: 'name' },
        { text: 'מזהה מחירון', align: 'center', value: 'id' },
        { text: 'פעולות', align: 'center', value: 'actions', sortable: false }
      ]
      return arr
    },
    drawerUi: {
      get () {
        return this.$store.state.drawerUi
      },
      set (value) {
        if (!value) {
          this.pricing.id = null
          this.pricing.name = ''
          this.pricing.deliveryTypesPricing = [{
            delivery_type_id: this.distributionDeliveryPointType?.id,
            from_quantity: null,
            until_quantity: null,
            price: null,
            name: null
          }]
          this.editMode = false
        }
        this.$store.commit('setDrawerUi', value)
      }
    }
  },
  async created () {
    try {
      this.loading = true
      await this.$store.dispatch('global/getDeliveryTypes')
      this.distributionDeliveryPointType = this.delivery_types.find(deliveryType => deliveryType.name === 'distribution_point')
      this.pricing.deliveryTypesPricing[0].delivery_type_id = this.distributionDeliveryPointType?.id
      this.loading = false
      return this.getData()
    } catch (e) {
      this.loading = false
      this.$helper.snackbar(e, 'getData')
    }
  },
  methods: {
    pricingNameRule () {
      if (!this.pricing?.name?.length) {
        return 'שדה חובה'
      }
      for (const item of this.items) {
        if (item.name === this.pricing?.name && item.id !== this.pricing?.id) {
          return 'לא ניתן ליצור/לעדכן שם מחירון לשם קיים'
        }
      }
      return true
    },
    cancelUpdatingPrices () {
      this.drawerUi = false
      this.showError = false
      this.noDoubleType = true
      this.valid = true
      this.pricing.id = null
      this.pricing.name = null
      this.pricing.deliveryTypesPricing = []
      return this.getData()
    },
    async getData () {
      try {
        this.loading = true
        this.items = await this.$pricingService.findDeliveryTypePricing({ pricing_to: 'distribution_point' })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData')
      }
    },
    copyData (item) {
      this.pricing.deliveryTypesPricing = item?.deliveryTypesPricing
      this.drawerUi = true
      this.editMode = true
    },
    editData (item) {
      this.pricing.name = item.name
      this.pricing.id = item.id
      this.pricing.deliveryTypesPricing = item?.deliveryTypesPricing
      this.drawerUi = true
      this.editMode = true
    },
    addRow () {
      this.pricing.deliveryTypesPricing.push({
        delivery_type_id: this.distributionDeliveryPointType?.id,
        from_quantity: null,
        until_quantity: null,
        price: null,
        name: null
      })
    },
    async submitted () {
      try {
        this.onSave = true
        this.items = await this.$pricingService.findDeliveryTypePricing({ pricing_to: 'distribution_point' })
        this.drawerUi = false
        this.onSave = false
      } catch (e) {
        this.$helper.snackbar(e, 'addOrUpdatePricing')
      }
    },
    async deletePricing (index) {
      try {
        await this.$pricingService.deletePricing(this.items[index].id)
        this.items.splice(index, 1)
      } catch (e) {
        this.$helper.snackbar(e, 'deletePricing')
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

    .late-delivery {
      background-color: #ff3f3f !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .late-delivery:hover {
      background-color: darken(#ff3f3f, 10%) !important;
    }

    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}
.delete-button {
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

</style>
