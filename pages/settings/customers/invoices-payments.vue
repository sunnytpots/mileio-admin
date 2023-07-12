<template>
  <FormUi
    :form="form"
    url="pricing/add-custom-delivery-type-pricing"
    no-btn
    name="customerPricing"
    :readonly="!$hasPermission('settings-customers-invoices-payments', 'edit')"
    @submitted="$emit('update:submit-status', $event)">
    <v-tabs background-color="transparent" color="#ff3066" style="border-bottom: 1px solid #E4E4E4;">
      <v-tab v-for="(tab, index) of tabs" :key="index" :to="tab.to"  >
        {{ tab.name }}
      </v-tab>
    </v-tabs>
    <n-child :customer="customer"/>
  </FormUi>
</template>

<script>
import { required, requiredIf } from 'vuelidate/lib/validators'
import moment from 'moment'

export default {
  name: 'InvoicesPayments',
  props: {
    customer: { type: Object, default: () => ({}) }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },
  data () {
    return {
      tabs: [
        { name: 'הגדרת שיטת תשלום', to: { name: 'settings-customers-invoices-payments-payment-method' } },
        { name: 'פירוט שיטות תשלום', to: { name: 'settings-customers-invoices-payments-log-payment-method' } },
        { name: 'פירוט תשלומים', to: { name: 'settings-customers-invoices-payments-payment-method-details' } }
      ],
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
      customerPaymentMethod: null,
      activePicker: null,
      items: [],
      total_balance: null,
      new_amount: null,
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
      customer_uid: this?.customer?.uuid,
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
      paymentDetailsList: [],
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
      this.customerPaymentMethod = await this.$customerInvoicesPaymentsService.findByCustomer(this.customer.uuid)
      this.items = await this.$customerBalanceCalculationService.findCustomerBalance(this.customer.uuid)
      this.total_balance = this.customerPaymentMethod.total_balance ? this.customerPaymentMethod.total_balance : null
      this.paymentMethodSelected = this.customerPaymentMethod.payment_method ? this.customerPaymentMethod.payment_method : ''
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
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
        console.log('item', item)
        this.showDetails = !this.showDetails
        this.paymentDetailsIndex = index
        this.paymentDetailsList = await this.$customerBalanceCalculationService.paymentDetails(item.id)
      } catch (e) {
        this.$helper.snackbar(e, 'showPaymentDetails')
      }
    },
    async addNewPaymentMethod () {
      try {
        console.log(this.payments, 'addNewPaymentMethod')
        const payments = {
          payments: this.payments,
          customer_uid: this.customer_uid,
          total_balance: this.total_balance,
          payment_method: this.paymentMethodSelected
        }
        this.customerPaymentMethod = await this.$customerInvoicesPaymentsService.addPayment(payments)
      } catch (e) {
        this.$helper.snackbar(e, 'addNewPaymentMethod')
      }
    },
    async updatePaymentMethod () {
      try {
        console.log('updatePaymentMethod this.form', this.form)
        console.log('updatePaymentMethod this.adminPassword', this.adminPassword)
        const res = await this.$customerInvoicesPaymentsService.updatePayment(this.form)
        this.customerPaymentMethod = res
        this.dialog = false
        this.$store.commit('setSnackbar', { value: true, message: 'עודכן בהצלחה', success: true })
      } catch (e) {
        this.$helper.snackbar(e, 'updatePaymentMethod')
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
.col{
  .block{
    text-align: center;
    border-left: 1px solid #d8d1d1;
  }
}
.div-content{
  width: 100%;
  margin-top: 15px;
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
</style>
