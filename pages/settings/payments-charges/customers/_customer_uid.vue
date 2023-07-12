<template>
  <SectionLayout>

    <InfoPanel
      :widgets="widgetsSummaries"
      :widgets-loading="loading"/>

    <DrawerUi
      v-model="tab"
      class="d-print-none"
      :tabs="tabs"
      show-delivery-details>
      <template v-if="$hasPermission('settings-payments-charges-customers', 'edit')" #header>
        <v-btn class="btn-primary" @click.prevent="onsubmit">
          שמירה
        </v-btn>
      </template>
      <n-child :delivery="delivery " :delivery-types="delivery_types" />
    </DrawerUi>

    <FilterUi
      v-model="filter"
      show-delivery-status
      :delivery-type-statuses="delivery_type_statuses"
      show-delivery-types
      :delivery-types="delivery_types"/>

    <CardUi overflow>
      <v-data-table
        :headers="headers"
        :items="items"
        :server-items-length="totalItems"
        :loading="loading"
        class="elevation-1"
        loading-text="טוען משלוחים, אנא המתן..."
        :footer-props="footerProps">
        <template v-slot:item.customer="{ item }">
          <p
            v-if="item.customer"
            v-text="item.customer.name"/>
        </template>

        <template v-slot:item.delivery_type="{ item }">
          <p
            v-if="item.delivery_type"
            v-text="item.delivery_type.value"/>
        </template>

        <template v-slot:item.delivered_date="{ item }">
          {{ item.delivered_date | formatDate }}
        </template>

        <template v-slot:item.city="{ item }">
          <p v-if="item.formatted_address" v-text="item.formatted_address.correct_long_city_name"/>
        </template>

        <template v-slot:item.street="{ item }">
          <p
            v-if="item.formatted_address"
            v-text="`${item.formatted_address.correct_long_street_name} ${item.formatted_address.correct_street_number}`"/>
        </template>

        <template v-slot:item.divisor_driver="{ item }">
          <p
            v-if="item.divisor_driver"
            v-text="item.divisor_driver.first_name + ' ' + item.divisor_driver.last_name"/>
        </template>

        <template v-slot:item.status="{ item }">
          <StatusesUi
            v-if="item.status"
            :status-value="item.status.name"
            :status-key="item.status.key"/>
        </template>
      </v-data-table>
    </CardUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'SettingsPaymentsChargesCustomersCustomerUid',
  data () {
    return {
      loading: false,
      filter: {
        customer_uid: null
      },
      pagination: {
        skip: 0,
        take: 20
      },
      filterValue: false,
      summariesRes: {},
      items: [],
      totalItems: 0,
      delivery: {},
      currentItem: null,
      tab: null,
      selectAll: false,
      showActions: false,
      bottom: false
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    ...mapState('global', ['delivery_type_statuses', 'delivery_types', 'footerProps']),

    headers () {
      const arr = [
        { text: 'שם לקוח', value: 'customer', align: 'center' },
        { text: 'ברקוד', value: 'barcode', align: 'center' },
        { text: 'סוג', value: 'delivery_type', align: 'center' },
        { text: 'תאריך ביצוע', value: 'delivered_date', align: 'center' },
        { text: 'שם נמען', value: 'target_name', align: 'center' },
        { text: 'עיר', value: 'city', align: 'center' },
        { text: 'כתובת', value: 'street', align: 'center' },
        { text: 'נהג מסירה', value: 'divisor_driver', align: 'center' },
        { text: 'סטטוס', value: 'status', align: 'center' }
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
    filter: {
      async handler (newFilter) {
        try {
          Object.keys(newFilter).forEach(key => newFilter[key] ? this.filterValue = true : this.filterValue = false)
          this.loading = true
          const response = await this.$customersService.paymentList({
            ...this.pagination,
            filter: this.filter,
            customer_uid: this.$route.params.customer_uid
          })

          this.items = response?.items
          this.totalItems = response?.total

          if (newFilter.customer_uid) {
            this.summariesRes = await this.$customersService.getSummary({
              ...this.pagination,
              filter: this.filter,
              customer_uid: newFilter.customer_uid
            })
          } else {
            this.summariesRes = await this.$customersService.getSummary({
              ...this.pagination,
              filter: this.filter
            })
          }
          this.loading = false
        } catch (e) {
          this.loading = false
          this.$helper.snackbar(e, 'filter watch error')
        }
      },
      deep: true
    }
  },
  created () {
    this.$store.dispatch('global/getDeliveryTypes')
    this.$store.dispatch('global/getDeliveryTypeStatuses')
    return this.getData()
  },
  methods: {
    async getData () {
      try {
        this.loading = true
        const response = await this.$customersService.paymentList({
          ...this.pagination,
          filter: {
            ...this.filter,
            customer_uid: this.$route.params.customer_uid
          }
        })

        this.items = response?.items
        this.totalItems = response?.total

        this.summariesRes = await this.$customersService.getSummary({
          ...this.pagination,
          filter: {
            ...this.filter,
            customer_uid: this.$route.params.customer_uid
          }
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helpr.snackbar(e, 'getData error')
      }
    },
    showInfo (item) {
      console.log('item', item)
      this.$router.push({ name: 'settings-payments-charges-customers-customer_uid', params: { customer_uid: item.uuid } })
    }
  }

}
</script>

<style lang="scss" scoped>
.verify-label {
  text-align: center;
  font-size: large;
}
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
  }
}
</style>
