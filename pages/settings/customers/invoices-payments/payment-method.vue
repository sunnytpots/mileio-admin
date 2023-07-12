<template>
  <FormUi
    :form="form"
    url="pricing/add-custom-delivery-type-pricing"
    no-btn
    name="customerPricing"
    :readonly="!$hasPermission('settings-customers-invoices-payments', 'edit')"
    @submitted="$emit('update:submit-status', $event)">
    <v-container>
      <v-row>
        <v-col cols="12" class="active-checkbox">
          <v-checkbox v-model="active" label="שיטה פעילה" />
          <small v-if="active">כל השיטות האחרות (במידה וקיימות) יתעדכנו ללא פעיל</small>
        </v-col>
        <v-col cols="5">
          <v-text-field
            v-model="new_amount"
            filled
            :label="paymentMethodSelected === 'regular' ? 'סכום להגבלה (*אם לא מוגדר סכום אז יהיה ללא הגבלה)' : 'סכום לטעינה'"
            :error-messages="$v.$dirty && $v.total_balance.$invalid && 'שדה חובה' || ''"/>
        </v-col>
        <v-col cols="3">
          <v-select
            v-model="paymentMethodSelected"
            clearable
            :items="paymentMethods"
            item-text="value"
            item-value="key"
            label="שיטת תשלום"
            filled
            @change="paymentMethodIsChanged"
          />
        </v-col>
        <v-col cols="4" style="text-align: end;">
          <v-btn
            v-if="payments.length || (paymentMethodSelected === 'regular')"
            class="btn-primary"
            @click.prevent="addNewPaymentMethod" style="height: 3rem;width: 12rem;font-size: 1rem;">
            שמירה
          </v-btn>
        </v-col>
        <v-col cols="12">
          <small>{{paymentMethodDesc}}</small>
        </v-col>
        <v-col v-if="paymentMethodSelected !== 'regular'" cols="12">
          <h5>אמצעי תשלום</h5>
          <v-btn
            v-for="(btn, i) in paymentTypeBtns"
            :key="i"
            rounded
            outlined
            color="#FA4616"
            :class="['payment-type-btn' , {'payment-type-selected': btn.clicked}]"
            @click="paymentTypeClicked(i)">
            {{ btn.value }}
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
    <v-container v-if="paymentMethodSelected !== 'regular'">
      <v-row>
        <v-col :cols="paymentTypeSelected === 'credit-card' ? '2' : '4'">
          <v-menu
            ref="menu"
            v-model="menu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            min-width="auto">
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-model="formattedFromDate"
                filled
                label="תאריך עסקה"
                class="date-filter-coordinator"
                append-icon="icon icon-calender"
                readonly
                v-bind="attrs"
                v-on="on"
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="form.payment_date"
              filled
              :active-picker.sync="activePicker"
              :max="(new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000)).toISOString().substr(0, 10)"
              min="1950-01-01"
            ></v-date-picker>
          </v-menu>
        </v-col>
        <v-col
          v-if="paymentTypeSelected === 'credit-card'"
          :cols="paymentTypeSelected === 'credit-card' ? '3' : '4'">
          <v-text-field
            v-model="form.four_digits"
            filled
            label="4 ספרות אחרונות"/>
        </v-col>
        <v-col
          v-if="paymentTypeSelected === 'credit-card'"
          :cols="paymentTypeSelected === 'credit-card' ? '3' : '4'">
          <v-select
            v-model="form.card_type"
            clearable
            filled
            :items="cardTypes"
            item-text="value"
            item-value="key"
            label="סוג כרטיס"/>
        </v-col>
        <v-col
          v-if="paymentTypeSelected === 'credit-card'"
          :cols="paymentTypeSelected === 'credit-card' ? '3' : '4'">
          <v-select
            v-model="form.transaction_type"
            clearable
            filled
            :items="transactionTypes"
            item-text="value"
            item-value="key"
            label="סוג עסקה"/>
        </v-col>
        <v-col :cols="paymentTypeSelected === 'credit-card' ? '3' : '4'">
          <v-text-field
            v-model="form.amount"
            filled
            type="number"
            label="סכום"/>
        </v-col>
        <v-col :cols="paymentTypeSelected === 'credit-card' ? '3' : '4'">
          <v-select
            v-model="form.currency_code"
            clearable
            filled
            :items="currencies"
            item-text="value"
            item-value="key"
            label="מטבע"/>
        </v-col>
        <v-col
          v-if="paymentTypeSelected === 'credit-card'"
          :cols="paymentTypeSelected === 'credit-card' ? '3' : '4'">
          <v-text-field
            v-model="form.payments"
            filled
            type="number"
            label="תשלומים"/>
        </v-col>
        <v-col
          v-if="paymentTypeSelected === 'credit-card'"
          :cols="paymentTypeSelected === 'credit-card' ? '4' : '4'">
          <v-text-field
            v-model="form.first_payment"
            filled
            type="number"
            label="תשלום ראשון"/>
        </v-col>
        <v-col
          v-if="paymentTypeSelected === 'credit-card'"
          :cols="paymentTypeSelected === 'credit-card' ? '4' : '4'">
          <v-text-field
            v-model="form.subsequent_payments"
            filled
            type="number"
            label="תשלום נוספים"/>
        </v-col>
        <v-col :cols="paymentTypeSelected === 'credit-card' ? '3' : '4'">
          <v-text-field
            v-model="form.comments"
            filled
            label="הערות"/>
        </v-col>
        <v-col v-if="paymentTypeSelected === 'payment-check' || paymentTypeSelected === 'bank-transfer'">
          <v-text-field
            v-model="form.bank_number"
            filled
            label="מספר בנק"/>
        </v-col>
        <v-col v-if="paymentTypeSelected === 'payment-check' || paymentTypeSelected === 'bank-transfer'">
          <v-text-field
            v-model="form.branch_number"
            filled
            label="מספר סניף"/>
        </v-col>
        <v-col v-if="paymentTypeSelected === 'payment-check' || paymentTypeSelected === 'bank-transfer'">
          <v-text-field
            v-model="form.account_number"
            filled
            label="מספר חשבון"/>
        </v-col>
        <v-col v-if="paymentTypeSelected === 'payment-check'">
          <v-text-field
            v-model="form.check_number"
            filled
            label="מספר שיק"/>
        </v-col>
      </v-row>
      <v-row>
        <v-btn
          rounded
          outlined
          :class="['payment-type-btn', 'save-payment-btn']"
          @click="savePayment">
          הוספת תשלום
        </v-btn>
      </v-row>
      <v-row v-if="payments.length && paymentMethodSelected !== 'regular'">
        <v-col cols="12">
          <v-simple-table >
            <template v-slot:default>
              <thead>
                <tr>
                  <th class="text-right">
                    תאריך
                  </th>
                  <th class="text-right">
                    סוג אמצעי תשלום
                  </th>
                  <th class="right">
                    הערות
                  </th>
                  <th class="right">
                    סכום
                  </th>
                  <th>פעולות</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(item2, idx) in payments"
                  :key="idx">
                  <td>{{ item2.payment_date }}</td>
                  <td>{{ item2.payment_type }}</td>
                  <td>{{ item2.comments }}</td>
                  <td>{{ item2.amount }}</td>
                  <td>
                    <i class="icon icon-delete delete-payment" @click="removePayment(idx)"/>
                  </td>
                </tr>
              </tbody>
            </template>
          </v-simple-table>
        </v-col>
      </v-row>
    </v-container>
  </FormUi>
</template>

<script>
import { required, requiredIf } from 'vuelidate/lib/validators'
import moment from 'moment'
import { mapState } from 'vuex'

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
      active: true,
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
      paymentTypeSelected: 'bank-transfer',
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
    ...mapState('auth', ['authUser'])
  },
  watch: {
    new_amount (newValue) {
      this.total_balance = newValue
      if (this.paymentMethodSelected === 'regular') {
        this.form.amount = newValue
      }
    },
    paymentMethodSelected (newValue) {
      switch (newValue) {
        case 'regular':
          this.paymentMethodDesc = 'כמות משלוחים X מחירון - חשבונית מס תצא בסוף חודש'
          break
        case 'bank_monthly_invoice':
          this.paymentMethodDesc = 'בעת שמירה תופק קבלה על הסכום שנטען, חשבונית מס תצא בסוף חודש'
          break
        case 'bank_no_monthly_invoice':
          this.paymentMethodDesc = 'בעת שמירה תופק חשבונית מס קבלה'
          break
      }
    }
  },
  methods: {
    resetForm () {
      this.form = {
        payment_type: this.paymentTypeSelected,
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
        total_balance: null,
        active: true
      }
    },
    removePayment (index) {
      this.payments.splice(index, 1)
    },
    savePayment () {
      this.payments.push(this.form)
      console.log(this.payments, 'savePayment')
      this.resetForm()
    },
    paymentTypeClicked (index) {
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
    async addNewPaymentMethod () {
      try {
        const payments = {
          payments: this.payments,
          customer_uid: this.customer_uid,
          total_balance: this.total_balance,
          payment_method: this.paymentMethodSelected,
          created_by: this.authUser.id,
          active: this.active
        }

        const res = await this.$customerInvoicesPaymentsService.addPayment(payments)
        if (res?.status) {
          this.$store.commit('setSnackbar', { value: true, message: 'שיטת תשלום נוצרה בהצלחה', success: true })
        }
      } catch (e) {
        this.$helper.snackbar(e, 'addNewPaymentMethod')
      }
    },
    async updatePaymentMethod () {
      try {
        this.customerPaymentMethod = await this.$customerInvoicesPaymentsService.updatePayment(this.form)
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
  width: 98% !important;
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
.active-checkbox {
  display: flex;align-items: center;gap: 10px;
  small {
  color:#4caf50;
}
}
.delete-payment {
  cursor: pointer;
}
</style>
