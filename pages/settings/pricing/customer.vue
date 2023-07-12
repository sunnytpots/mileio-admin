<template>
  <CardUi>
    <v-data-table
      :items="items"
      :headers="headers"
      :loading="loading"
      class="elevation-1"
      :footer-props="footerProps"
      loading-text="טוען מחירונים, אנא המתן...">
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
        ref-prop="checkCustomerPricing"
        :url="pricing && pricing.id ? 'pricing/update-delivery-type-pricing' : 'pricing/add-delivery-type-pricing'"
        name="customerPricingData"
        cancel-btn
        @cancel-submission="drawerUi = false"
        @submitted="submitted">
        <v-container>
          <v-row>
            <v-col cols="6" style="margin: auto">
              <v-text-field
                v-model="pricing.name"
                label="שם מחירון"
                class="input-ui"
                style="margin-bottom: 30px !important;"
                dense
                rounded
                filled
                :rules="[pricingNameRule]" />
            </v-col>
          </v-row>
          <v-container v-for="(textField, index) in pricing.deliveryTypesPricing" :key="index">
            <v-row class="d-flex justify-center">
              <v-col cols="3">
                <v-select
                  v-model="textField.delivery_type_id"
                  clearable
                  class="select-ui"
                  rounded
                  filled
                  :rules="FieldsRules"
                  :items="deliveryTypes"
                  item-text="value"
                  item-value="delivery_type_id"
                  label="סוגי משלוח"/>
              </v-col>
              <v-col cols="4" style="display: flex">
                <span style="font-size: small;padding-top: 2px;margin: auto 0;">מ</span>

                <v-text-field
                  v-model.number="textField.from_quantity"
                  label="כמות"
                  class="input-ui"
                  type="number"
                  min="1"
                  dense
                  rounded
                  filled
                  :rules="numberRules"/>
                <span style="font-size: small;padding-top: 2px;margin: auto 0;">עד</span>

                <v-text-field
                  v-model.number="textField.until_quantity"
                  label="כמות"
                  class="input-ui"
                  type="number"
                  min="1"
                  dense
                  rounded
                  filled
                  :rules="numberRules"/>
              </v-col>
              <v-col cols="2">
                <v-text-field
                  v-model.number="textField.price"
                  class="input-ui"
                  type="number"
                  min="1"
                  dense
                  rounded
                  filled
                  label="מחיר"
                  :rules="priceRules"/>
              </v-col>
              <v-col cols="1">
                <DeleteButton
                  v-if="index > 0"
                  url="pricing/delete-delivery-type-pricing"
                  :req-body="{ id: pricing.deliveryTypesPricing && pricing.deliveryTypesPricing[index].id }"
                  api-method="$post"
                  has-warning
                  @deleted="removeFromList(index)"/>
              </v-col>
            </v-row>
            <v-row class="d-flex justify-center">
            </v-row>
          </v-container>
          <v-row>
            <v-col cols="12" align="center">
              <v-tooltip top>
                <template v-slot:activator="{ on, attrs }">
                  <i class="icon icon-red-plus" v-bind="attrs" @click="addRow" v-on="on" />
                </template>
                <span>הוספת סוגי משלוח</span>
              </v-tooltip>
            </v-col>
          </v-row>
          <v-row style="justify-content: center;">
            <v-col cols="8">
              <v-select
                v-model="pricing.polygonPricingId"
                clearable
                class="select-ui"
                rounded
                filled
                :items="polygonsPricing"
                item-text="pricing_name"
                item-value="id"
                label="מחירון פוליגונים"/>
            </v-col>
          </v-row>
        </v-container>
      </FormUi>
    </DialogUi>
  </CardUi>
</template>

<script>
import { required } from 'vuelidate/lib/validators'
import { mapState } from 'vuex'
export default {
  name: 'SettingsPricingCustomer',

  data () {
    return {
      deliveryTypes: [],
      loading: false,
      editMode: false,
      deliveryValidate: [],
      items: [],
      pricing: {
        id: null,
        name: '',
        custom_to: 'customer',
        pricing_to: 'customer',
        polygonPricingId: null,
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
      numberRules: [
        v => !v || (v && typeof v === 'number' && v >= 0) || 'שדה מספרי חיובי בלבד'
      ],
      priceRules: [
        v => !!v || 'שדה חובה',
        v => (v && typeof v === 'number' && v >= 0) || 'שדה מספרי חיובי בלבד'
      ],
      polygonsPricing: [],
      deliveryTypeRules: []
    }
  },
  computed: {
    ...mapState('polygons', ['polygons']),
    ...mapState('global', ['delivery_types', 'footerProps']),

    disableConfirm () {
      if (!this.pricing?.name?.length ||
        !this.valid ||
        !this.pricing?.deliveryTypesPricing?.length > 0) {
        return true
      }
      for (const pricing of this.pricing?.deliveryTypesPricing) {
        if (!pricing.price || !pricing.delivery_type_id || !pricing.from_quantity) {
          return true
        }
      }
      return false
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
            delivery_type_id: null,
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
      await this.$store.dispatch('polygons/get')
      await this.$store.dispatch('global/getDeliveryTypes')

      this.polygonsPricing = await this.$pricingService.getPolygonPricing()
      this.deliveryTypes = this.delivery_types.map(deliveryType => ({
        delivery_type_id: deliveryType.id,
        name: deliveryType.name,
        value: deliveryType.value
      }))

      this.loading = false
      return this.getData()
    } catch (e) {
      this.loading = false
      this.$helper.snackbar(e, 'created')
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
    async getData () {
      try {
        this.loading = true
        this.items = await this.$pricingService.findDeliveryTypePricing({ pricing_to: 'customer' })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData')
      }
    },
    copyData (item) {
      this.pricing.deliveryTypesPricing = item.deliveryTypesPricing
      this.pricing.polygonPricingId = item.polygon_pricing_id
      this.drawerUi = true
      this.editMode = true
    },
    editData (item) {
      this.pricing.name = item.name
      this.pricing.id = item.id
      this.pricing.deliveryTypesPricing = item.deliveryTypesPricing
      this.pricing.polygonPricingId = item.polygon_pricing_id
      this.drawerUi = true
      this.editMode = true
    },
    addRow () {
      this.pricing.deliveryTypesPricing.push({
        delivery_type_id: null,
        from_quantity: null,
        until_quantity: null,
        price: null,
        name: null
      })
    },
    async submitted () {
      try {
        this.items = await this.$pricingService.findDeliveryTypePricing({ pricing_to: 'customer' })
        this.drawerUi = false
      } catch (e) {
        this.$helper.snackbar(e, 'addOrUpdatePricing')
      }
    },
    removeFromList (index) {
      this.pricing.deliveryTypesPricing?.splice(index, 1)
    },
    async deletePricing (index) {
      try {
        await this.$pricingService.deletePricing(this.items[index].id)
        this.items.splice(index, 1)
      } catch (e) {
        this.$helper.snackbar(e, 'deletePricing')
      }
    },
    deliveryTypeValidation (val) {
      for (const dt of this.pricing.deliveryTypesPricing) {
        if (!dt.name) {
          continue
        }
        if (dt.delivery_type_id === val) {
          return false
        }
      }
      return true
    }
  },
  validations: {
    pricing: {
      name: { required }
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
    margin-top: 0.5rem;
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}
</style>
