<template>
  <SectionLayout class="main-layout">
    <template #header>
    </template>
    <InfoPanel
      :widgets="widgetsSummaries"
      :widgets-loading="loading"/>

    <div class="actions-body">
      <FilterUi
        v-model="filter"
        show-payment-status
        :payment-statuses="statuses"
        show-customer
        show-reset
        :clear-filter-inputs="clearFilterInputs"
        :customer-list="$store.state.global.customers"/>
    </div>

    <CardUi overflow>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="customers"
          :server-items-length="totalItems"
          :options.sync="options"
          item-key="id"
          class="elevation-1"
          :loading="loading"
          loading-text="טוען מידע, אנא המתן..."
          :footer-props="footerProps"
          @click:row="showInfo">
          <template v-slot:no-data>
            <p v-text="'אין מידע.'"/>
          </template>

          <template v-slot:item.status="{ item }">
            <StatusesUi
              v-if="item.monthly_balance_payment"
              :status-value="translateStatus(item.monthly_balance_payment.status)"
              :status-key="item.monthly_balance_payment.status" />
          </template>
        </v-data-table>
      </v-flex>
    </CardUi>
    <v-dialog
      v-model="drawerUi"
      persistent
      max-width="290">
      <v-card>
        <v-card-title class="headline">
          <i :class="`icon icon-warning`" />
          הודעה
        </v-card-title>
        <v-card-text>כל לקוח יחוייב בהתאם למחירון שהוגדר לו מראש.</v-card-text>
        <v-card-text v-if="loading" class="text-center">
          <v-progress-circular
            style="position: absolute"
            :width="5"
            color="green"
            indeterminate
          />
        </v-card-text>
        <v-card-text>האם אתה בטוח שברצונך לחייב את כלל הלקוחות ?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="green darken-1"
            text
            @click="drawerUi = false">
            בטל
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click="billingAllCustomers">
            בצע
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'CustomersPay',
  data () {
    return {
      options: {},
      totalItems: 1000,
      loading: false,
      filter: {},
      pagination: {
        skip: 0,
        take: 20
      },
      customers: [],
      summariesRes: {},
      statuses: [
        { title: 'שולם', key: 'paid' },
        { title: 'ממתין לתשלום', key: 'awaiting_payment' }
      ],
      items: [],
      delivery: {},
      currentItem: null,
      tab: null,
      selectAll: false,
      showActions: false
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    ...mapState('global', ['footerProps']),

    headers () {
      const arr = [
        { text: 'שם לקוח', align: 'right', value: 'name', width: '30%' },
        { text: 'ח.פ', align: 'center', value: 'hp', width: '20%' },
        { text: 'סטאטוס חודשי', align: 'center', value: 'status', width: '50%' }
      ]
      return arr
    },
    drawerUi: {
      get () {
        return this.$store.state.drawerUi
      },
      set (value) {
        this.$store.commit('setDrawerUi', value)
      }
    },

    widgetsSummaries () {
      return [
        { key: 'total', title: 'כמות משלוחים', value: this.summariesRes.total || 0 },
        { key: 'done', title: 'בוצע בהצלחה', value: this.summariesRes.done || 0 },
        { key: 'error', title: 'כשל', value: this.summariesRes.error || 0 },
        { key: 'billing_amount', title: 'סכום לחיוב משלוחים', value: this.summariesRes.billing_amount || 0 },
        { key: 'refund_amount', title: 'סכום לתשלום TA-BOX', value: this.summariesRes.refund_amount || 0 }
        // { key: 'total_payment', title: 'סה"כ לתשלום', value: this.summariesRes.total_payment || 0 }
      ]
    },
    tabs () {
      let tabs = [
        { title: 'משלוח', to: { name: 'settings-payments-charges-customers-delivery' }, mode: 'create_edit' }
      ]
      if (this.delivery && this.delivery.uuid) {
        tabs.push({ title: 'לוג משלוח', to: { name: 'coordinator-logs' }, mode: 'create' })
      }

      tabs = tabs.filter(tab => this.$hasPermission(tab.to.name))
      return tabs
    }
  },
  watch: {
    options: {
      async handler (newOptions, oldOptions) {
        try {
          const { sortBy, sortDesc } = newOptions
          if (Object.keys(oldOptions)?.length < 1) {
            return
          }
          this.pagination = { skip: (newOptions.page - 1) * newOptions.itemsPerPage, take: newOptions.itemsPerPage }
          await this.getCustomersViews()
          this.customers = this.customers.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'name' :
                sortA = a.name
                sortB = b.name
                break
              case 'hp' :
                sortA = a.hp
                sortB = b.hp
                break
              case 'status':
                sortA = a?.monthly_balance_payment?.status || 'z'
                sortB = b?.monthly_balance_payment?.status || 'z'
                break
              default :
                sortA = a[sortBy[0]]
                sortB = b[sortBy[0]]
                break
            }

            if (sortDesc[0]) {
              if (sortA < sortB) {
                return 1
              }
              if (sortA > sortB) {
                return -1
              }
              return 0
            } else {
              if (sortA < sortB) {
                return -1
              }
              if (sortA > sortB) {
                return 1
              }
              return 0
            }
          })
        } catch (e) {
          this.$helper.snackbar(e, 'options watch')
        }
      },
      deep: true
    },
    filter: {
      handler () {
        return this.getCustomersViews()
      },
      deep: true
    }
  },
  created () {
    this.$store.dispatch('global/getCustomerList')
    return this.getCustomersViews()
  },
  methods: {
    clearFilterInputs () {
      this.filter = {}
    },
    translateStatus (statusKey) {
      const foundStatus = this.statuses.find(status => status.key === statusKey)
      return foundStatus?.title || statusKey
    },
    async getCustomersViews () {
      try {
        this.loading = true
        this.customers = await this.$customersService.customersPaymentsList({
          ...this.pagination,
          filter: this.filter
        })
        this.summariesRes = await this.$customersService.getSummary({
          ...this.pagination,
          filter: this.filter
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getCustomersViews')
      }
    },
    showInfo (item) {
      console.log('item', item)
      // Object.keys(this.form).forEach(key => this.form[key] = item[key])
      // this.delivery = item
      // this.tags = this.delivery.tags
      this.$router.push({ name: 'settings-payments-charges-customers-customer_uid', params: { customer_uid: item.uuid } })
      // this.$store.commit('setDrawerUi', true)
    },
    async billingAllCustomers () {
      try {
        this.loading = true
        await this.$customerBalanceCalculationService.billingAllCustomers()
        this.loading = false
        this.$store.commit('setSnackbar', { value: true, message: 'כלל הלקוחות חוייבו בהצלחה', success: true })
        this.drawerUi = false
      } catch (e) {
        this.$store.commit('setSnackbar', { value: true, message: 'התהליך נכשל, יש לנסות שוב', success: true })
      }
    }
  }

}
</script>

<style lang="scss" scoped>
.section-layout {
  padding-right: 0;
}
.actions-body {
  .filter-ui {
    padding-right: 0;
  }
}
.verify-label {
  text-align: center;
  font-size: large;
}
.main-layout {
  background-color: #F8F8FD !important;
  width : 100%;
  .text-center {
    padding: 20px 30px 20px 20px !important;
    background-color: #F8F8FD !important;
    box-shadow: none !important;
  }
  ::v-deep {
    .v-data-table__wrapper {
      overflow: hidden;
    }
    .status-header {
      padding-bottom: 19px !important;
      span {
        padding-bottom: 19px !important;
      }
    }
    .v-data-table > .v-data-table__wrapper > table > tbody > tr > th,
    .v-data-table > .v-data-table__wrapper > table > thead > tr > th,
    .v-data-table > .v-data-table__wrapper > table > tfoot > tr > th,
    .theme--light.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
      font-style: normal;
      font-weight: normal;
      font-size: 14px;
      color: #000000;
      background-color: #F4F4F4 !important;
    }
    .v-data-table > .v-data-table__wrapper > table > tbody > tr > td, .v-data-table > .v-data-table__wrapper > table > tbody > tr > th,
    .v-data-table > .v-data-table__wrapper > table > thead > tr > td, .v-data-table > .v-data-table__wrapper > table > thead > tr > th,
    .v-data-table > .v-data-table__wrapper > table > tfoot > tr > td, .v-data-table > .v-data-table__wrapper > table > tfoot > tr > th {
      padding: 0 8px !important;
    }

    .v-select__selection--comma {
      margin: -3px -1px 12px 0 !important;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: smaller !important;
    }
  }
}
</style>
