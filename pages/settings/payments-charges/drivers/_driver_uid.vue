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
        :loading="loading"
        class="elevation-1"
        :footer-props="footerProps">
        <template v-slot:no-data>
          <p v-text="'אין מידע.'"/>
        </template>

        <template v-slot:item.delivery_type="{ item }">
          <p v-if="item.delivery_type_key" v-text="item.delivery_type_value"/>
          <p v-else-if="item.delivery_type" v-text="item.delivery_type.value"/>
        </template>

        <template v-slot:item.street="{ item }">
          <p
            v-if="item.address"
            v-text="`${item.address.correct_long_street_name} ${item.address.correct_street_number}`"/>
        </template>

        <template v-slot:item.status="{ item }">
          <StatusesUi
            v-if="item.delivery_type_status"
            :status-value="item.delivery_type_status.name"
            :status-key="item.delivery_type_status.key"/>
        </template>

        <template v-slot:item.price="{ item }">
          <p v-text="getTotalPrice(item)"/>
        </template>
      </v-data-table>
    </CardUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'DistributionPointUid',

  data () {
    return {
      loading: false,
      filter: {
        driver_uid: null
      },
      pagination: {
        skip: 0,
        take: 100
      },
      filterValue: false,
      summariesRes: {},
      items: [],
      totalItems: null,
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
        { text: 'שם לקוח', align: 'center', value: 'customer.name' },
        { text: 'ברקוד', align: 'center', value: 'barcode' },
        { text: 'סוג', align: 'center', value: 'delivery_type' },
        { text: 'תאריך ביצוע', align: 'center', value: 'delivered_date' },
        { text: 'סטטוס', align: 'center', value: 'status' },
        { text: 'שם נמען', align: 'center', value: 'target_name' },
        { text: 'עיר', align: 'center', value: 'address.correct_long_city_name' },
        { text: 'כתובת', align: 'center', value: 'street' },
        { text: 'מחיר', align: 'center', value: 'price' }
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
        { key: 'billing_amount', title: 'סכום לחיוב', value: this.summariesRes.billing_amount || 0 },
        { key: 'refund_amount', title: 'סכום לזיכוי', value: this.summariesRes.refund_amount || 0 },
        { key: 'total_payment', title: 'סה"כ לתשלום', value: this.summariesRes.total_payment || 0 }
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
          const response = await this.$driverService.paymentList({
            ...this.pagination,
            filter: this.filter,
            driver_uid: this.$route.params.driver_uid
          })

          this.items = response?.items
          this.totalItems = response?.total

          if (newFilter.customer_uid) {
            this.summariesRes = await this.$customersService.getSummary({
              ...this.pagination,
              filter: newFilter,
              customer_uid: newFilter.customer_uid
            })
          } else {
            this.summariesRes = await this.$customersService.getSummary({
              ...this.pagination,
              newFilter
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
    this.filter.driver_uid = this.$route.params.driver_uid
    return this.getData()
  },
  methods: {
    getTotalPrice (item) {
      const divisorPrice = item.divisor_delivery_types_pricing?.price
      const pickupPrice = item.pickup_delivery_types_pricing?.price
      const bringBackPrice = item.bring_back_delivery_types_pricing?.price
      const total = (divisorPrice || 0) + (pickupPrice || 0) + (bringBackPrice || 0)
      return total
    },
    async getData () {
      try {
        this.loading = true
        const response = await this.$driverService.paymentList({
          ...this.pagination,
          filter: this.filter
        })
        this.items = response?.items
        this.totalItems = response?.total
        this.summariesRes = await this.$driverService.getSummary({
          ...this.pagination,
          filter: this.filter
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData error')
      }
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
