<template>
  <div>
    <FormUi
      :form="form"
      url="pricing/add-custom-delivery-type-pricing"
      no-btn
      name="customerPricing"
      :readonly="!$hasPermission('settings-customers-invoices-payments', 'edit')"
      @submitted="$emit('update:submit-status', $event)">
      <v-container>
        <v-row>
          <v-col cols="12" style="display: flex;flex-direction: column">
            <label v-if="total_balance">סה"כ נטען <b> {{total_balance}} ₪ </b></label>
            <br>
            <label :class="[( 0 > current_balance) ? 'negative-balance' : '']" v-if="current_balance">סה"כ יתרה נוכחית<b> {{current_balance}} ₪ </b></label>
          </v-col>
          <v-col cols="12">
            <v-simple-table >
              <template v-slot:default>
                <thead>
                  <tr>
                  <th class="text-right">
                    תאריך
                  </th>
                  <th class="right">
                    שיטת תשלום
                  </th>
                  <th class="text-right">
                    סכום שנטען
                  </th>
                  <th class="text-right">
                    סכום ששולם
                  </th>
                  <th class="text-right">
                    יתרה
                  </th>
                  <th class="right">
                    ע"י
                  </th>
                  <th class="right">
                    שיטה פעילה
                  </th>
                  <th class="right"/>
                </tr>
                </thead>
                <tbody>
                  <tr
                  v-for="(item2, idx) in customerPaymentMethod"
                  :key="idx">
                  <td>{{ item2.created_at | formatDate}}</td>
                  <td>{{ item2.payment_method }}</td>
                  <td v-if="item2.payment_method === 'regular'">{{ +item2.total_balance || 'ללא הגבלה' }}</td>
                  <td v-else>{{ item2.total_balance}}</td>
                  <td></td>
                  <td :class="[( 0 > item2.current_balance) ? 'negative-balance' : '']">{{ item2.current_balance }}</td>
                  <td>{{ item2.system_user.first_name + ' ' + item2.system_user.last_name }}</td>
                  <td>
                    <v-switch
                      v-model="item2.active"
                      color="green"
                      hide-details
                      :disabled="item2.active"
                      @change="activePaymentMethod(item2, idx)"
                    />
                  </td>
                  <td>
                    <v-btn v-if="+item2.current_balance < 0 && item2.payment_method !== 'regular'" outlined color="orange" @click="paymentCharge(item2, 'renew')" >
                      טעינה מחדש
                    </v-btn>
                    <v-btn v-if="item2.payment_method === 'regular' && item2.invoice_url" outlined color="orange" @click="paymentCharge(item2, 'charge')">
                      עדכון תשלום
                    </v-btn>
                  </td>
                </tr>
                </tbody>
              </template>
            </v-simple-table>
          </v-col>
        </v-row>
      </v-container>
    </FormUi>
    <DialogUi v-model="dialog" xl>
      <PaymentMethod :current-balance="current_balance_clicked" :payment-method="paymentMethod" :customer="customer"/>
    </DialogUi>
  </div>
</template>

<script>
import { required, requiredIf } from 'vuelidate/lib/validators'
import moment from 'moment'

export default {
  name: 'LogPaymentMethod',
  props: {
    customer: { type: Object, default: () => ({}) }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },
  computed: {
    formattedFromDate () {
      return moment(this.form.payment_date).format('DD-MM-YYYY')
    }
  },
  data () {
    return {
      tabs: [
        { name: 'תשלומי לקוחות', to: { name: 'settings-payments-charges-customers' } }
      ],
      showToChangeButton: false,
      fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
      adminPassword: null,
      dialog: false,
      showNewTotalBalance: false,
      menuFrom: false,
      menu: null,
      paymentMethod: null,
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
      current_balance_clicked: null,
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
        check_number: null,
      },
      customer_uid: this.customer.uuid,
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
  async created () {
    try {
      await this.getCustomerPaymentMethods()
      console.log('this.form', this.form)
    } catch (e) {
      const errorMsg = e.response && e.response.data && e.response.data.message
      this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
    }
  },
  methods: {
    paymentCharge (item, type) {
      console.log(type)
      console.log(item)
      this.dialog = true
      this.current_balance_clicked = Math.abs(+item.current_balance)
      this.paymentMethod = item.payment_method
    },
    async getCustomerPaymentMethods () {
      try {
        const res = await this.$customerInvoicesPaymentsService.findByCustomer(this.customer.uuid)
        this.customerPaymentMethod = res.items
        this.total_balance = res?.total_balance || null
        this.current_balance = res?.current_balance || null
      } catch (e) {
        const errorMsg = e.response && e.response.data && e.response.data.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    },
    async activePaymentMethod (item, index) {
      try {
        console.log(item)
        await this.$customerInvoicesPaymentsService.activePaymentMethod(item.id)
        await this.getCustomerPaymentMethods()
      } catch (e) {
        const errorMsg = e.response && e.response.data && e.response.data.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
        this.customerPaymentMethod[index].active = false
      }
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
.negative-balance {
  color: red;
}
</style>
