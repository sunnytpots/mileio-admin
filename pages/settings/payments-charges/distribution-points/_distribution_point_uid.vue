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
      :delivery-type-statuses="delivery_type_statuses"/>

    <CardUi overflow>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        :footer-props="footerProps"
        class="elevation-1">

        <template v-slot:item.delivered_date="{ item }">
          {{ item.delivered_date | formatDate }}
        </template>

        <template v-slot:item.target_street="{ item }">
          <p
            v-if="item.target_address"
            v-text="item.target_address.correct_long_street_name + ' ' + item.target_address.correct_street_number"/>
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
import moment from 'moment'
import { mapState } from 'vuex'

export default {
  name: 'DistributionPointUidPay',
  data () {
    return {
      loading: false,
      filter: {
        delivery_type_status_key: 'done'
      },
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
        { text: 'שם נקודה', value: 'distribution_point.name', classes: 'center' },
        { text: 'שם לקוח', value: 'customer.name', classes: 'center' },
        { text: 'ברקוד', value: 'barcode', classes: 'center' },
        { text: 'תאריך ביצוע', value: 'delivered_date', classes: 'center' },
        { text: 'שם נמען', value: 'target_name', classes: 'center' }
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
        { key: 'total', title: 'כמות משלוחים', value: this.summariesRes?.total || 0 },
        { key: 'done', title: 'בוצע בהצלחה', value: this.summariesRes?.done || 0 },
        { key: 'error', title: 'כשל', value: this.summariesRes?.error || 0 },
        { key: 'total_payment', title: 'סה"כ לתשלום TA-BOX', value: this.summariesRes?.refund_amount || 0 }
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
      handler () {
        return this.getDeliveryViews()
      },
      deep: true
    }
  },
  async created () {
    try {
      console.log('created', this.$route.params.customer_uid)
      await this.$store.dispatch('global/getDeliveryTypes')
      await this.$store.dispatch('global/getDeliveryTypeStatuses')
      return this.getDeliveryViews()
    } catch (e) {
      this.$helper.snackbar(e, 'created error')
    }
  },
  methods: {
    async getDeliveryViews () {
      try {
        this.loading = true
        const response = await this.$distributionDeliveriesPointsService.paymentList({
          filter: this.filter,
          dist_point_uid: this.$route.params.distribution_point_uid
        })
        this.items = response?.items
        this.totalItems = response?.total

        this.summariesRes = await this.$distributionDeliveriesPointsService.getSummary({
          filter: this.filter,
          dist_point_uid: this.$route.params.distribution_point_uid
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper(e, 'getDeliveryViews')
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
