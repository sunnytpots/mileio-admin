<template>
  <FormUi
    :form="form"
    url="pricing/add-custom-delivery-type-pricing"
    no-btn
    name="customerPricing"
    :readonly="!$hasPermission('settings-customers-invoices-payments', 'edit')"
    @submitted="$emit('update:submit-status', $event)">
    <InfoPanel
      :class="['d-print-none','info-panel-coordinator']"
      show-clear-button
      widget-clickable
      :widgets="widgetsSummaries"
      :widgets-loading="loading"/>
    <v-container>
      <div v-for="(item, i) in customerPaymentMethod" :key="i" style="display: block;margin-bottom: 16px" >
        <div style="margin-bottom: 10px">
          <div style="color:#6D7A84;flex: 1;display: flex; gap: 12px">
            <label>שיטת תשלום: <b>{{ paymentMethodsDesc[item.payment_method] }}</b></label>
            <div v-if="item.receipt_url" class="invoices-links">
              <label >קבלה:</label>
              <a target="_blank" :href="item.receipt_url">
                <i class="icon icon-document" />
              </a>
            </div>
            <div v-if="item.invoice_receipt_url" class="invoices-links">
              <label >חש' מס קבלה:</label>
              <a target="_blank" :href="item.invoice_receipt_url">
                <i class="icon icon-document" />
              </a>
            </div>
          </div>
        </div>
        <div style="background: #FAFBFB;padding: 16px;border: 1px solid #e4f2f2;">
          <div style="display: flex;font-size:16px;margin-bottom: 10px">
            <div class="block" style="flex:4">תאריך</div>
            <div class="block" style="flex:2">בוצע ע"י</div>
            <div class="block" style="flex:2">סוג תשלום</div>
            <div class="block" style="flex:2">שיטת תשלום</div>
            <div class="block" style="flex:3; text-align: left">סכום שנטען</div>
            <div class="block" style="flex:1; text-align: left"></div>
          </div>
          <v-row
            style="background: rgba(250, 70, 22, 0.06);border-top: 1px solid #E4E4E4;border-bottom: 1px solid #E4E4E4;"
            @click="showPaymentDetails(item, i)">
            <div style="flex:4;" class="block">
              {{ item.created_at | formatDate('DD/MM/YYYY') }}
            </div>
            <div style="flex:2;" class="block">
              {{ item.system_user.first_name + ' ' + item.system_user.last_name }}
            </div>
            <div style="flex:2;" class="block">
            </div>
            <div style="flex:3;" class="block">
              {{ paymentMethodsDesc[item.payment_method] }}
            </div>
            <div style="flex:2; text-align: left;font-weight: 600" class="block">
              {{ item.total_balance }} ₪
            </div>
            <div style="flex:1;text-align: -webkit-left;" class="block">
              <!--            <i class="icon icon-arrow-top" />-->
              <i :class="['arrow', showDetails && paymentDetailsIndex === i ? 'up' : 'down' ]"></i>
            </div>
          </v-row>
          <template v-if="showDetails && paymentDetailsIndex === i">
            <v-row v-for="(item2, idx) in item.payments" :key="idx" style="background:rgba(250, 70, 22, 0.03);border-bottom: 1px solid #E4E4E4;" >
              <div style="flex:4;" class="block">
                {{ item2.payment_date }}
              </div>
              <div style="flex:2;" class="block">
              </div>
              <div style="flex:2;" class="block">
                {{ item2.payment_type }}
              </div>
              <div style="flex:3;" class="block">
              </div>
              <div class="block" style="flex:2; text-align: left">
                {{ item2.amount }} ₪
              </div>
              <div class="block" style="flex:1; text-align: left">
              </div>
            </v-row>
          </template>
          <v-row style="background:white;margin-top: 50px;border-bottom: 1px solid #E4E4E4;" @click="getDeliveriesDetails(item, i)">
            <div style="flex:1" class="block">
              {{ item.balance_calc && item.balance_calc.calculated_date || 'אין מידע' }}
            </div>
            <div style="flex:3" class="block">
              כמות משלוחים: {{ item.deliveries_count }}
            </div>
            <div style="display:flex; flex:3; gap: 15px; align-items: center" class="block">
              <div>
                סה"כ עלות משלוחים: {{ item.open_charge}} ₪
              </div>
              <div v-if="item.already_used" class="negative-balance" style="font-weight: 600">
                הסתיים
              </div>
              <div v-else :class="[( 0 > item.current_balance) ? 'negative-balance' : '']">
                יתרה: {{item.total_balance === item.current_balance ? item.total_balance : item.total_balance - (item.total_balance - item.current_balance)}} ₪
              </div>
            </div>
            <div class="block" style="flex:3;"></div>
            <div v-if="item.invoice_url" style="flex: 2;display: flex;align-items: center" class="invoices-links">
              <label >חש' מס:</label>
              <a target="_blank" :href="item.invoice_url">
                <i class="icon icon-document" />
              </a>
            </div>
            <div style="flex:1;text-align: -webkit-left;display: flex;align-items: center" class="block">
              <div style="flex:1;text-align: -webkit-left;">
                <i :class="['arrow', showDeliveriesDetails && deliveriesDetailsIndex === i ? 'up' : 'down' ]"></i>
              </div>
            </div>
          </v-row>
          <template v-if="showDeliveriesDetails && deliveriesDetailsIndex === i">
            <v-simple-table style="background:#FAFBFB;margin-top: 12px;" >
              <template v-slot:default>
                <thead>
                  <tr>
                    <th class="text-right">
                      שם לקוח
                    </th>
                    <th class="text-right">
                      שם נמען
                    </th>
                    <th class="right">
                      ברקוד
                    </th>
                    <th class="right">
                      סוג משלוח
                    </th>
                    <th class="right">
                      כמות חבילות
                    </th>
                    <th class="right">
                      עלות משלוח בודד (ב-₪)
                    </th>
                    <th style="text-align: center">
                      סטאטוס
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(item2, idx) in deliveriesDetailsList"
                    :key="idx"
                    style="background: white">
                    <td>{{ item2.customer && item2.customer.name }}</td>
                    <td>{{ item2.target_name }}</td>
                    <td>{{ item2.barcode }}</td>
                    <td>{{ item2.delivery_type && item2.delivery_type.value }}</td>
                    <td>{{ item2.amount }}</td>
                    <td>{{ item2.delivery_type_price }}</td>
                    <td>
                      <StatusesUi
                        :status-value="item2.status && item2.status.name"
                        :status-key="item2.status && item2.status.value" />
                    </td>
                  </tr>
                </tbody>
              </template>
            </v-simple-table>
          </template>
        </div>
      </div>
    </v-container>
  </FormUi>
</template>

<script>
import { required, requiredIf } from 'vuelidate/lib/validators'
import moment from 'moment'

export default {
  name: 'PaymentMethod',
  props: {
    customer: { type: Object, default: () => ({}) }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },
  data () {
    return {
      loading: false,
      tabs: [
        { name: 'תשלומי לקוחות', to: { name: 'settings-payments-charges-customers' } }
      ],
      paymentMethodsDesc: {
        regular: 'רגיל',
        bank_monthly_invoice: 'בנק חשבונית חודשית',
        bank_no_monthly_invoice: 'בנק ללא חשבונית חודשית'
      },
      showToChangeButton: false,
      fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
      adminPassword: null,
      dialog: false,
      showNewTotalBalance: false,
      menuFrom: false,
      menu: null,
      paymentMethods: [
        {
          key: 'regular',
          value: 'רגיל'
        },
        {
          key: 'bank_monthly_invoice',
          value: 'בנק חשבונית חודשית'
        },
        {
          key: 'bank_no_monthly_invoice',
          value: 'בנק ללא חשבונית חודשית'
        }
      ],
      paymentMethodSelected: null,
      paymentMethodDesc: null,
      customerPaymentMethod: [],
      activePicker: null,
      items: [],
      total_balance: null,
      current_balance: null,
      new_amount: null,
      summaries: {},
      form: {
        payment_type: 'bank-transfer',
        payment_date: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
        four_digits: null,
        card_type: null,
        transaction_type: null,
        amount: null,
        currency_code: null,
        payments: null,
        first_payment: null,
        subsequent_payments: null,
        comments: null,
        bank_number: null,
        branch_number: null,
        account_number: null,
        check_number: null
      },
      customer_uid: this.customer?.uuid,
      payment_method: null,
      payments: [],
      totalBalance: null,
      headers: [
        { title: '', classes: '' },
        { title: 'חודש', classes: 'th-border' },
        { title: 'סכום לתשלום', classes: 'th-border' },
        { title: 'סטטוס', classes: 'th-border' },
        { title: 'חשבונית', classes: 'th-border' }
      ],
      paymentDetailsIndex: null,
      showDetails: false,
      deliveriesDetailsIndex: null,
      showDeliveriesDetails: false,
      paymentDetailsList: [],
      deliveriesDetailsList: [],
      paymentTypeSelected: null,
      paymentTypeBtns: [
        {
          key: 'credit-card',
          value: 'כרטיס אשראי',
          clicked: false
        },
        {
          key: 'cash',
          value: 'מזומן',
          clicked: false
        },
        {
          key: 'payment-check',
          value: 'שיק',
          clicked: false
        },
        {
          key: 'bank-transfer',
          value: 'העברה בנקאית',
          clicked: true
        }
      ],
      cardTypes: [
        {
          key: 'mastercard',
          value: 'מאסטר קארד'
        },
        {
          key: 'american_express',
          value: 'אמקס'
        },
        {
          key: 'max',
          value: 'מקס'
        },
        {
          key: 'visa',
          value: 'ויזה'
        },
        {
          key: 'diners',
          value: 'דיינרס'
        },
        {
          key: 'other',
          value: 'אחר'
        }
      ],
      transactionTypes: [
        {
          key: 'payments',
          value: 'תשלומים'
        },
        {
          key: 'regular',
          value: 'רגיל'
        },
        {
          key: 'credit',
          value: 'קרדיט'
        }
      ],
      currencies: [
        {
          key: 'ILS',
          value: 'שקל'
        },
        {
          key: 'USD',
          value: 'דולר'
        },
        {
          key: 'GBP',
          value: 'פאונד'
        },
        {
          key: 'EUR',
          value: 'יורו'
        }
      ]
    }
  },
  computed: {
    formattedFromDate () {
      return moment(this.form.payment_date).format('DD-MM-YYYY')
    },
    widgetsSummaries () {
      return [
        { key: 'done', title: 'סה"כ משלוחים שבוצעו', value: this.summaries?.done || 0 },
        { key: 'error', title: 'חיובים פתוחים', value: this.summaries?.open_charge || 0 },
        { key: 'error2', title: 'סה"כ חיובים ששולמו', value: this.summaries?.paid_charge || 0 }
      ]
    }
  },
  watch: {
    new_amount (newValue) {
      this.total_balance = +this.total_balance + +newValue
    },
    paymentMethodSelected (newValue) {
      switch (newValue) {
        case 'regular':
          this.paymentMethodDesc = 'כמות משלוחים X מחירון - חשבונית מס תצא בסוף חודש'
          break
        case 'bank_monthly_invoice':
          this.paymentMethodDesc = 'בעת שמירה יופק קבלה על הסכום שנטען, חשבונית מס תצא בסוף חודש'
          break
        case 'bank_no_monthly_invoice':
          this.paymentMethodDesc = 'בעת שמירה יופק חשבונית מס קבלה'
          break
      }
    }
  },
  async created () {
    try {
      await this.getCustomerPaymentMethods()
      this.loading = true
      this.summaries = await this.$customerInvoicesPaymentsService.getSummaries(this.customer.uuid)
      this.loading = false
      console.log('summaries', this.summaries)
    } catch (e) {
      this.loading = false
      this.$helper.snackbar(e, 'created error')
    }
  },
  methods: {
    async getCustomerPaymentMethods () {
      try {
        this.loading = true
        const res = await this.$customerInvoicesPaymentsService.findByCustomer(this.customer.uuid)
        this.customerPaymentMethod = res.items
        this.total_balance = res?.total_balance || null
        this.current_balance = res?.current_balance || null
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getCustomerPaymentMethods error')
      }
    },
    resetForm () {
      this.form = {
        payment_date: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
        four_digits: null,
        card_type: null,
        transaction_type: null,
        amount: null,
        currency_code: null,
        payments: null,
        first_payment: null,
        subsequent_payments: null,
        comments: null,
        bank_number: null,
        branch_number: null,
        account_number: null,
        check_number: null,
        total_balance: null
      }
    },
    savePayment () {
      this.payments.push(this.form)
      this.resetForm()
    },
    paymentTypeClicked (index) {
      console.log(index)
      for (const i in this.paymentTypeBtns) {
        if (index === +i) {
          this.paymentTypeBtns[i].clicked = true
          this.paymentTypeSelected = this.paymentTypeBtns[i].key
          this.form.payment_type = this.paymentTypeSelected
        } else {
          this.paymentTypeBtns[i].clicked = false
        }
      }
    },
    async showPaymentDetails (item, index) {
      try {
        this.showDetails = !this.showDetails
        this.paymentDetailsIndex = index
        if (this.showDetails) {
          this.loading = true
          this.paymentDetailsList = await this.$customerBalanceCalculationService.paymentDetails(item.id, {
            payment_method: item.payment_method
          })
          this.loading = false
        }
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'showPaymentDetails error')
      }
    },
    async getDeliveriesDetails (item, index) {
      try {
        this.showDeliveriesDetails = !this.showDeliveriesDetails
        this.deliveriesDetailsIndex = index

        if (this.showDeliveriesDetails) {
          this.loading = true
          this.deliveriesDetailsList = await this.$customerBalanceCalculationService.paymentDetails(item.id)
          this.loading = true
        }
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getDeliveriesDetails error')
      }
    },
    async addNewPaymentMethod () {
      try {
        console.log('addNewPaymentMethod', this.payments)
        const payments = {
          payments: this.payments,
          customer_uid: this.customer_uid,
          total_balance: this.total_balance,
          payment_method: this.paymentMethodSelected
        }
        this.loading = true
        this.customerPaymentMethod = await this.$customerInvoicesPaymentsService.addPayment(payments)
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'addNewPaymentMethod error')
      }
    },
    async updatePaymentMethod () {
      try {
        console.log('updatePaymentMethod this.form', this.form)
        console.log('updatePaymentMethod this.adminPassword', this.adminPassword)
        this.loading = true
        this.customerPaymentMethod = await this.$customerInvoicesPaymentsService.updatePayment(this.form)
        this.loading = false
        this.dialog = false
        this.$store.commit('setSnackbar', { value: true, message: 'עודכן בהצלחה', success: true })
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'updatePaymentMethod error')
      }
    },
    paymentMethodIsChanged () {
      this.showNewTotalBalance = this.paymentMethodSelected !== 'regular'
    }
  },
  validations: {
    form: {
      payment_method: { required },
      total_balance: {
        required: requiredIf(function () {
          return this.showNewTotalBalance
        })
      }
    }
  }
}
</script>

<style scoped lang="scss">

.widgets {
  display: flex;
  margin-right: -12px;
  align-items: center;
  position: relative;
  justify-content: center;

  .widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;
    //max-width: 8.3rem;
    padding: .9rem 0;
    background-color: #fff;
    border-left: 1px solid #DFDFDF;

    &:first-child {
      border-radius: 0 8px 8px 0;
    }

    &:last-child {
      border-left: none;
      border-radius: 8px 0 0 8px;
    }

    h3 {
      font-size: .85rem;
      margin-bottom: 1.2rem;
    }

    p {
      font-size: 1.5rem;
      margin-bottom: 1.4rem;
    }
  }
}

.scan-status{
  background-color: #d3f8d3;
  border-radius: 4px;
  text-align: center;
}
.block{
  padding: 8px 16px;
  margin: auto;
  font-size:14px;
}
.div-content{
  width: 100%;
  //margin-top: 15px;
  margin-right: -8px;
}
.scan-status{
  background-color: #d3f8d3;
  border-radius: 4px;
  text-align: center;
}
.payment-type-btn {
  width: 216px !important;
  height: 42px !important;
  font-size: 22px;
  margin: 10px
}
.save-payment-btn {
  width: 100% !important;
  height: 42px !important;
  color: #FA4616;
  background: rgba(250, 70, 22, 0.1);
  font-size: 18px;
  border: 1px solid #FA4616;
  border-radius: 10px;
}
.payment-type-selected {
  background: rgba(250, 70, 22, 0.1);
}
.date-filter-coordinator {
  width: unset;
  .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) > .v-input__control > .v-input__slot {
    height: 100rem !important;
  }
}
.negative-balance {
  color: red;
}
.invoices-links {
  //flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 5px;
  color: #fa4616;
  font-size: 14px;
}
</style>
