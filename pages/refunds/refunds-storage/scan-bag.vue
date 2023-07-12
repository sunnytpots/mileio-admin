<template>
  <CardUi>
    <template #header>
      <div class="filter-ui">
        <v-form
          ref="form"
          v-model="valid"
          lazy-validation>
          <v-container>
            <v-row class="top-details-row">
              <v-col  style="border-bottom: 1px solid #e4e4e4;border-left: 1px solid #e4e4e4; text-align: center;">
                <span>שם מחסנאי</span>
                <span class="data-label">
                  {{ `${authUser.first_name} ${authUser.last_name}` }}
                </span>
              </v-col>
              <v-col  style="border-bottom: 1px solid #e4e4e4;border-left: 1px solid #e4e4e4; text-align: center;">
                <span>שם לקוח</span>
                <v-autocomplete
                  v-model="customerId"
                  clearable
                  :disabled="refund !== null"
                  :items="customers"
                  item-text="name"
                  item-value="id"
                  :error-messages="$v.$dirty && $v.form.customer_id.$invalid && 'שדה חובה' || ''"
                  @change="selectCustomer($event)"/>
              </v-col>
              <v-col  style="border-bottom: 1px solid #e4e4e4;border-left: 1px solid #e4e4e4; text-align: center;">
                <span>מספר לקוח</span>
                <br>
                <span class="data-label">{{ customerNumber }}</span>
              </v-col>
              <v-col style="border-bottom: 1px solid #e4e4e4;border-left: 1px solid #e4e4e4; text-align: center;">
                <span>תאריך יצירה</span>
                <br>
                <span v-if="created_at" class="data-label">{{ created_at | formatDate }}</span>
              </v-col>
            </v-row>
            <v-row class="d-print-none">
              <v-col>
                <div class="scan-widget">
                  <v-container>
                    <v-row>
                      <v-col cols="4" class="side-block">
                        <span>כמות חבילות שנסרקו</span>
                        <div>{{ packages.length }}</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="scan-search">
                          <v-text-field
                            v-model="form.barcode"
                            :disabled="refund && refund.is_blocked"
                            outlined
                            :error-messages="$v.$dirty && $v.form.barcode.$invalid && 'שדה חובה' || ''">
                            <template #append>
                              <v-btn
                                class="btn-search"
                                :style="`background-color: ${refund && refund.is_blocked ? '#BEBEBE' : '#fa4616'} !important;
                                  color: white !important`"
                                :disabled="refund && refund.is_blocked"
                                @click.prevent="onScan">
                                {{ 'סרוק' }}
                              </v-btn>
                            </template>
                          </v-text-field>
                        </div>
                      </v-col>
                      <v-col cols="2" class="side-block">
                        <img src="../../../assets/images/scan-search.png">
                      </v-col>
                    </v-row>
                  </v-container>
                </div>
              </v-col>
            </v-row>
            <v-row v-if="!!form.refund_bag_number">
              <v-col cols="8" md="10">
                <v-text-field
                  v-model="comments"
                  label="הערות"
                  dense
                  rounded
                  filled
                  class="input-ui"/>
              </v-col>
              <v-col cols="4" md="2">
                <v-btn
                  class="btn-primary"
                  @click.prevent="saveBagComments">
                  {{ 'שמור הערות' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </div>
    </template>
    <v-container>
      <v-alert v-for="(item, index) in packages" :key="index" :color="scanStatus[item.status]">
        <v-row>
          <v-col cols="4" class="block">
            <small
              v-if="!refund || (refund && !refund.is_blocked)"
              class="text-ping clear-filter"
              @click="removeFromBag(index, item.delivery.id, item.delivery.barcode, item.status)">
              הסרה
            </small>
            <div class="div-content">
              <span>ברקוד: {{ item.delivery && item.delivery.barcode }}</span>
              <br>
              <span style="font-size: small;">תאריך שידור: {{ item.delivery && item.delivery.created_at | formatDate }}</span>
            </div>
          </v-col>
          <v-col cols="2" class="block">
            <div class="div-content">
              מספר לקוח: {{ item.customer && item.customer.customer_number }}
            </div>
          </v-col>
          <v-col cols="2" class="block">
            <div class="div-content">
              {{ item.customer && item.customer.name }}
            </div>
          </v-col>
          <v-col cols="3" class="block">
            <div class="div-content" v-if="item.status === 'success'">
              תאריך סריקה לשק:
              <br>
              {{item.created_at | formatDate }}
            </div>
            <div class="div-content" v-else>
             {{ item.errMsg }}
            </div>
          </v-col>
          <v-col cols="1" :class="`scan-status-${item.status}`">
            <i :class="['icon', scanStatusIcon[item.status]]" />
            <div>
              {{ item.status === 'error' ? 'שגיאה' : 'תקין'  }}
            </div>
          </v-col>
        </v-row>
      </v-alert>
    </v-container>
  </CardUi>
</template>

<script>
import { required } from 'vuelidate/lib/validators'
import { mapState } from 'vuex'

export default {
  name: 'ScanBag',

  props: {
    customers: { type: Array, default: () => ([]) },
    refund: { type: Object, default: null }
  },
  middleware: ['permissions'],

  data () {
    return {
      comments: null,
      scanData: [],
      scanInput: '',
      actions: [
        { key: 'enter_to', value: 'כניסה ל' },
        { key: 'exit_to', value: 'יציאה ל' },
        { key: 'stored', value: 'ממיינת' }
      ],
      scanStatus: {
        success: '#b1f3b2',
        warning: '#fcf5d8',
        error: '#fcd8d8'
      },
      scanStatusIcon: {
        success: 'icon-v',
        warning: 'icon-warning',
        error: 'icon-error'
      },
      packages: [],
      customerId: null,
      customerNumber: null,
      customerBagNumber: null,
      created_at: null,
      valid: true,
      form: {
        barcode: null,
        customer_id: null,
        refund_bag_number: null,
        storekeeper_name: null
      },
      required: [
        v => !!v || 'שדה חובה'
      ]
    }
  },
  computed: {
    ...mapState('auth', ['authUser'])
  },
  watch: {
    comments (newVal) {
      return this.$emit('update-comments', newVal)
    }
  },
  async created () {
    try {
      console.log('this.authUser', this.authUser)
      this.form.storekeeper_name = this.authUser.first_name + ' ' + this.authUser.last_name
      if (!this.refund) {
        return
      }

      this.packages = await this.$packagesBagService.viewByBag({ bag_id: this.refund.id })
      this.form.customer_id = this.refund.customer?.id
      this.form.refund_bag_number = this.refund.refund_bag_number
      this.form.customer_id = this.refund.customer_id
      this.comments = this.refund.comments
      this.customerId = this.refund.customer?.id
      this.customerBagNumber = this.refund.refund_bag_number
      this.customerNumber = this.refund.customer?.customer_number
      this.customerName = this.refund.customer?.name
      this.created_at = this.refund.created_at
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  mounted () {
    document.addEventListener('keypress', this.myHandler)
  },
  destroyed () {
    document.removeEventListener('keypress', this.myHandler)
  },
  methods: {
    async saveBagComments () {
      try {
        console.log('saveBagComments', this.comments)
        this.loading = true
        await this.$customerBagsService.saveBagComments({
          refund_bag_number: this.form.refund_bag_number,
          comments: this.comments
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'selectCustomer')
      }
    },
    myHandler (e) {
      if (!this.$refs.form.validate()) {
        this.$store.commit('setSnackbar', { value: true, message: 'לא ניתן לבצע סריקה ללא בחירת סוג פעולה וסניף', error: true })
        return
      }
      if (e.key === 'Enter') {
        this.form.delivery_identification = this.scanData.join('')
        this.scanData = []
        this.onScan()
      } else {
        this.scanData.push(e.key)
      }
    },
    async onScan () {
      try {
        if (this.refund?.is_blocked) {
          return
        }

        this.$v.$touch()

        if (this.$v.$error) {
          return
        }
        this.$store.commit('setSnackbar', false)
        console.log('form', this.form)

        const res = await this.$customerBagsService.addPackageToBag(this.form)
        this.packages.push(res)
      } catch (e) {
        this.$helper.snackbar(e, 'onScan')

        if (!e.response.data.status) {
          const invalidItem = {
            delivery: {
              barcode: this.form.barcode
            },
            customer: {
              customer_number: this.customerNumber,
              name: this.customerName
            },
            created_at: new Date(),
            status: 'error',
            errMsg: e.response.data.message
          }
          this.packages.push(invalidItem)
        }
      }
    },
    onsubmit () {
      return this.onScan()
    },
    async selectCustomer (newItem) {
      try {
        if (!newItem) {
          return this.customerNumber = null
        }

        const customer = this.customers.find(c => c.id === newItem)
        this.customerNumber = customer.customer_number
        const res = await this.$customerBagsService.addBag({
          customer_id: newItem,
          refund_bag_number: this.customerBagNumber,
          storekeeper_name: this.form.storekeeper_name
        })
        this.$emit('customer-bag-number', res.refund_bag_number) // submit to function from child comp

        this.form.refund_bag_number = res.refund_bag_number
        this.form.customer_id = res.customer_id
        this.created_at = res.created_at
      } catch (e) {
        this.$helper.snackbar(e, 'selectCustomer')
      }
    },
    async removeFromBag (index, deliveryId, barcode, status) {
      try {
        console.log('status', status)
        if (status === 'error') {
          this.packages.splice(index, 1)
          return
        }

        await this.$customerBagsService.removePackageFromBag({
          delivery_id: deliveryId,
          bag_id: this.refund.id,
          refund_bag_number: this.customerBagNumber,
          barcode
        })
        this.packages.splice(index, 1)
        this.$store.commit('setSnackbar', { value: true, message: 'חבילה הוסרה מהשק בהצלחה', success: true })
      } catch (e) {
        this.$helper.snackbar(e, 'removeFromBag')
      }
    }
  },

  validations: {
    form: {
      barcode: { required },
      customer_id: { required }
    }
  }
}
</script>

<style lang="scss" scoped>
i{
  width: auto;
}
.col{
  .block{
    text-align: center;
    border-left: 1px solid #d8d1d1;
    display: flex;

    small {
      margin-left: auto;
    }
  }
}
.div-content{
  width: 100%;
  margin-top: 15px;
}
.scan-status-success{
  background-color: #d3f8d3;
  border-radius: 4px;
  text-align: center;
  padding-top: 25px;
}
.scan-status-error{
  background-color: #fcd8d8;
  border-radius: 4px;
  text-align: center;
  padding-top: 25px;
}
.side-block{
  background-color: #303640;
  border-radius: 4px;
  text-align: center;
  color: white;
}
.v-alert {
  display: block;
  font-size: 16px;
  margin-bottom: 16px;
  padding: 12px;
  position: relative;
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
}

.filter-ui{
  margin-bottom: .4rem;
  ::v-deep {
    & > .container > .row > .col-1 {
      padding-left: 0;
    }
    & > .container > .row > .col-11 {
      padding-right: 0;
    }
    .v-btn {
      width: 100%;
    }
    .v-input {
      margin-top: 0;
      padding-top: 0;

      .v-input__slot{
        margin-bottom: 0;
      }
      .v-text-field__details{
        display: none;
      }

      &.error--text{
        .v-input__slot{
          margin-bottom: 8px;
        }
        .v-text-field__details{
          display: flex;
        }
      }
    }
    .theme--light.v-select .v-select__selection--comma{
      color: #22272E;
    }
    .theme--light.v-label{
      color: #7C7C7C !important;
    }
  }
}

.scan-widget{
  background-color: #22272E;
  border-radius: 4px;
}

.scan-search{
  margin-top: 0.9rem;
  ::v-deep{
    .v-input{
      width: 38.3rem;
      background-color: #373f4c;
    }
    .v-text-field--outlined{
      border-radius: 8px;
    }
    .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) > .v-input__control > .v-input__slot {
      padding-left: 0;
    }
    .v-input__slot{
      margin-bottom: 0;
    }
    .v-text-field__details{
      display: none;
    }
    .v-input__append-inner{
      margin-top: 0;
    }
    fieldset{
      border: none;
    }
    .theme--light.v-input input{
      color: #fff;
    }
  }

  .btn-search{
    min-height: 56px;
    background-color: #fa4616;
    color: #fff;
    border-radius: 8px 0 0 8px;
    font-size: .8rem;
    padding: 0 2.2rem;
  }
  .top-details-row{
    border-bottom: 1px solid rgb(228, 228, 228);
    .data-label{
      display: block;
      font-size: 15px;
    }
  }
}

</style>
