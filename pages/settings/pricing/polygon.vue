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
            url="pricing/delete-polygon-pricing"
            api-method="$post"
            :req-body="{ id: items[index].id }"
            has-warning
            @deleted="getData"/>
        </div>
      </template>
    </v-data-table>
    <DialogUi
      v-model="drawerUi"
      sm
      persistent>
      <FormUi
        :form="pricing"
        :ref-prop="'checkPolygonPricing'"
        :url="pricing && pricing.id ? 'pricing/update-polygon-pricing' : 'pricing/create-polygon-pricing'"
        name="polygonPricingData"
        cancel-btn
        @cancel-submission="drawerUi = false"
        @submitted="submitted">
        <v-container>
          <v-row>
            <v-col cols="6" style="margin: auto">
              <v-text-field
                v-model="pricing.name"
                label="שם מחירון"
                :rules="[pricingNameRule]"/>
            </v-col>
          </v-row>
          <v-row v-for="(textField, index) in pricing.polygonsPricingList" :key="index">
            <v-col cols="6">
              <v-select
                v-model="textField.polygon_id"
                clearable
                :rules="FieldsRules"
                :items="polygons"
                item-text="name"
                item-value="id"
                label="פוליגון"
                @change="setPolygonName(textField.polygon_id, index)"/>
            </v-col>
            <v-col cols="4">
              <v-text-field
                v-model.number="textField.polygon_price"
                label="תוספת למחיר"
                type="number"
                min="1"
                :rules="priceRules"/>
            </v-col>
            <v-col cols="1">
              <div v-if="index > 0" class="delete-button">
                <v-btn class="btn-secondary" @click.prevent="remove(index)">
                  <i class="icon icon-bucket" />
                </v-btn>
              </div>
            </v-col>
          </v-row>
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
import { required } from 'vuelidate/lib/validators'
import { mapState } from 'vuex'

export default {
  name: 'SettingsPricingPolygon',

  data () {
    return {
      loading: false,
      editMode: false,
      noDoubleType: true,
      showError: false,
      deliveryValidate: [],
      onSave: false,
      items: [],
      deliveryTypes: [],
      pricing: {
        polygonsPricingList: [{
          polygon_id: null,
          polygon_name: null,
          polygon_price: null
        }],
        id: null
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
    ...mapState('polygons', ['polygons']),
    ...mapState('global', ['footerProps']),

    disableConfirm () {
      if (!this.pricing?.name?.length ||
        !this.noDoubleType ||
        !this.valid ||
        !this.pricing?.polygonsPricingList?.length > 0) {
        return true
      }

      for (const polygon of this.pricing?.polygonsPricingList) {
        if (!polygon.polygon_id || !polygon.polygon_price) {
          return true
        }
      }
      return false
    },
    headers () {
      const arr = [
        { text: 'שם מחירון', align: 'center', value: 'pricing_name' },
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
          this.pricing.polygonsPricingList = [{
            polygon_id: null,
            polygon_name: null,
            polygon_price: null
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
      this.deliveryTypes = await this.$deliveryTypeService.list()
      this.deliveryTypes = this.deliveryTypes.map(dt => ({
        delivery_type_id: dt.id,
        name: dt.name,
        value: dt.value
      }))
      this.loading = false
      return this.getData()
    } catch (e) {
      this.loading = false
      this.$helper.snackbar(e, 'created error')
    }
  },
  methods: {
    setPolygonName (polygonId, i) {
      const polygon = this.polygons.find(p => p.id === polygonId)
      this.pricing.polygonsPricingList[i].polygonName = polygon.name
    },
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
    checkIfTypePricingExists () {
      const deliveryTypesPricing = this.pricing.deliveryTypesPricing.map(dtp => dtp.delivery_type_id)
      const deliveryTypesPricingSet = Array.from(new Set(deliveryTypesPricing))
      if (deliveryTypesPricing.length !== deliveryTypesPricingSet.length) {
        this.showError = true
        this.noDoubleType = false
      } else {
        this.showError = false
        this.noDoubleType = true
      }
    },
    async getData () {
      try {
        this.loading = true
        this.items = await this.$pricingService.getPolygonPricing()
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData')
      }
    },
    copyData (item) {
      this.pricing.polygonsPricingList = item?.polygon_pricing_list
      this.drawerUi = true
      this.editMode = true
    },
    editData (item) {
      this.pricing.name = item.pricing_name
      this.pricing.id = item.id
      this.pricing.polygonsPricingList = item?.polygon_pricing_list
      this.drawerUi = true
      this.editMode = true
    },
    addRow () {
      this.pricing.polygonsPricingList.push({
        polygon_id: null,
        polygon_name: null,
        polygon_price: null
      })
    },
    submitted () {
      this.onSave = true
      this.drawerUi = false
      this.onSave = false
      return this.getData()
    },
    async remove (index) {
      try {
        this.loading = true
        await this.$pricingService.deletePolygonPricingFromList({ id: this.pricing.polygonsPricingList[index].id })
        this.pricing.polygonsPricingList.splice(index, 1)
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'polygon remove')
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
    margin-top: 1.6rem;
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}
</style>
