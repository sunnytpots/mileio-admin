<template>
  <FormUi
    :form="form"
    :v="$v.form"
    no-btn
    name="apiSettings"
    url="api-setting/update"
    :readonly="!$hasPermission('settings-customers', 'edit')"
    @submitted="$emit('update:submit-status', $event)">
    <v-container>
      <v-row v-if="!apiKey && !secretKey">
        <v-col cols="12 text-center">
          <v-btn class="btn-primary" @click.prevent="generateNewKeys()">
            יצירת מפתחות גישה ל-API
          </v-btn>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="6">
          <v-text-field
            v-model="form.callback_url"
            clearable
            label="Callback URL" />
        </v-col>
      </v-row>

      <v-row v-if="apiKey && secretKey">
        <v-col cols="6">
          <v-text-field
            v-model="apiKey"
            disabled
            label="Api Key"/>
        </v-col>
        <v-col cols="6">
          <v-btn class="btn-primary" @click.prevent="copyText(apiKey)">
            העתקה
          </v-btn>
        </v-col>
      </v-row>

      <v-row v-if="apiKey && secretKey">
        <v-col cols="6">
          <v-text-field
            v-model="secretKey"
            disabled
            label="Secret Key" />
        </v-col>
        <v-col cols="6" style="flex-direction: row">
          <v-btn class="btn-primary" @click.prevent="copyText(secretKey)">
            העתקה
          </v-btn>
          <small
            v-if="secretKey"
            class="text-ping clear-filter"
            @click.prevent="resetAccessApi()">
            איפוס
          </small>
        </v-col>
      </v-row>
    </v-container>

    <v-container>
      <v-row>
        <v-col cols="4">
          <p v-text="'מהיכן יקבע ברקוד משלוח?'"/>
          <v-radio-group v-model="form.barcode_assign_from" mandatory>
            <v-radio
              v-for="(barcodeAssignChoice, key) in barcodeAssignChoices"
              :key="key"
              color="#fa4616"
              :label="barcodeAssignChoice.key"
              :value="barcodeAssignChoice.value"/>
          </v-radio-group>
        </v-col>
      </v-row>
    </v-container>

    <v-container>
      <v-switch
        v-model="form.api_permission"
        :label="form.api_permission ? 'יש הרשאה' : 'אין הרשאה' "
        class="pa-3"
      ></v-switch>
      <h2>רשימת אייפים מורשים (WhiteList)</h2>
      <v-data-table
        :items="form.items"
        :headers="headers"
        hide-default-footer>
        <template v-slot:item.name="{ item, index }">
          <v-text-field v-model="item.name" @keyup="onChange(index, 'nameChanged')"/>
        </template>

        <template v-slot:item.ip="{ item, index }">
          <v-text-field v-model="item.ip" @keyup="onChange(index, 'ipChanged')" />
        </template>

        <template v-slot:item.last_req_date="{ item }">
          <v-text-field v-model="item.last_req_date" disabled/>
        </template>

        <template v-slot:item.options="{ index }">
          <div class="delete-button">
            <v-btn class="btn-secondary" @click.prevent="remove(index)">
              <i class="icon icon-bucket"/>
            </v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <p v-text="'אין מידע'"/>
        </template>
      </v-data-table>

      <v-row no-gutters class="justify-end mt-4">
        <v-col cols="1" align="center" >
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <i
                class=" ml-5 icon icon-red-plus"
                v-bind="attrs"
                v-on="on"
                @click="addRow"/>
            </template>
            <span>הוספת IP</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-container>
  </FormUi>
</template>

<script>
import { required } from 'vuelidate/lib/validators'

export default {
  name: 'ApiSettings',
  props: {
    customer: { type: Object, default: () => ({}) }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },

  data () {
    return {
      barcodeAssignChoices: [
        { value: 'tapuz_number', key: 'מספר תפוז' },
        { value: 'order_number', key: 'מספר הזמנה' }
      ],
      valid: true,
      apiKey: null,
      secretKey: null,
      form: {
        api_permission: false,
        callback_url: null,
        customer_uid: null,
        items: [],
        itemsToRemove: [],
        barcode_assign_from: 'tapuz_number'
      }
    }
  },
  computed: {
    headers () {
      const arr = [
        { text: 'שם', align: 'center', value: 'name' },
        { text: 'IP', align: 'center', value: 'ip' },
        { text: 'פנייה אחרונה', align: 'center', value: 'last_req_date' },
        { text: 'אפשרויות', align: 'center', value: 'options', sortable: false }
      ]
      return arr
    }
  },
  async created () {
    try {
      const res = await this.$apiSettingsService.viewSettings({ customer_uid: this.customer.uuid })
      this.form.customer_uid = this.customer.uuid
      this.form.api_permission = this.customer.api_permission
      this.form.callback_url = this.customer.callback_url
      this.form.barcode_assign_from = this.customer.barcode_assign_from || this.form.barcode_assign_from
      this.form.items = res?.map(item => {
        return {
          id: item.id,
          name: item.name,
          ip: item.ip,
          last_req_date: item.last_req_date
        }
      })
      if (this.customer?.api_keys?.api_key) {
        this.apiKey = this.customer.api_keys.api_key
      }
      if (this.customer?.api_keys?.secret_key) {
        this.secretKey = this.customer.api_keys.secret_key
      }
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    copyText (element) {
      navigator.clipboard.writeText(element)
      this.$store.commit('setSnackbar', {
        value: true,
        message: 'שדה הועתק ללוח',
        success: true
      })
    },
    async generateNewKeys () {
      try {
        const res = await this.$customerApiKeysService.generateNewKeys({ customer_uid: this.customer.uuid })
        if (res?.data) {
          this.apiKey = res.data.api_key
          this.secretKey = res.data.secret_key
        }
      } catch (e) {
        this.$helper.snackbar(e, 'generateNewKeys')
      }
    },
    async resetAccessApi () {
      try {
        const res = await this.$customerApiKeysService.resetAccessApi({ customer_uid: this.customer.uuid })
        console.log(res)
        if (res && res.data) {
          this.secretKey = res.data.secret_key
        }
      } catch (e) {
        console.log(e)
        const errorMsg = e.response && e.response.data && e.response.data.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    },
    addRow () {
      this.form.items.push(
        { name: null, ip: null, last_req_date: null, newItem: true }
      )
      this.form.active = true
    },
    remove (index) {
      this.form.itemsToRemove.push(this.form.items[index].id)
      this.form.items.splice(index, 1)
      this.form.active = true
    },
    onChange (index, key) {
      this.form.active = true
      this.form.items[index][key] = true
    },
    switchItemStatus (item, index) {
      this.form.api_permission = !this.form.api_permission
    }
  },
  validations: {
    form: { required }
  }
}
</script>

<style lang="scss" scoped>
.v-input--radio-group {
  width: 150px !important;
}
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
