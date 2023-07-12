<template>
  <div class="coordinator">
    <SectionLayout :class="['d-print-none', 'mainBody']" title="איתור זיכוי - מחסן החזרות">
      <template #header>
        <CardDriver
          v-if="driversSelected && driversSelected.length > 0"
          :selected-array="driversSelectedArray" />
        <DateFilter
          v-if="!driversSelected || driversSelected.length === 0"
          v-model="filter.datesFilter"
          :loading="loading" />
      </template>

      <DrawerUi
        class="d-print-none"
        :show-tabs="false"
        :title="delivery && delivery.customer && delivery.customer.name">
        <template #header>
          <v-btn
            class="btn-primary"
            @click.prevent="openPreviewPrintSticker">
            הדפסת מדבקה
          </v-btn>
        </template>
        <n-child :delivery="delivery" :refund="refund" />
      </DrawerUi>

      <InfoPanel
        v-model="filter.delivery_type_status_key"
        :delivery-info="deliveryData"
        :widgets="widgetsSummaries"
        show-clear-button
        widget-clickable
        :widgets-loading="summariesLoading"/>

      <div class="coordinator-body">
        <FilterUi
          v-model="filter"
          show-customer
          :customer-list="customers"
          show-delivery-types
          :delivery-types="delivery_types"
          show-search
          @submit="filterHelper"/>
        <div :class="['col-2', 'btns-coordinator']">
          <v-btn class="btn-primary" @click="filterHelper">
            מיין תוצאות
          </v-btn>
          <v-btn
            depressed
            :class="{'white--text': true, 'btn-gray': true, 'disable-events': !showActions}"
            @click.prevent="multiPrint">
            <img src="../../assets/images/icons/printer.svg"/>
            הדפסת מדבקה
          </v-btn>
          <ExportReport
            report-type="refunds"
            :filter="filter"/>
        </div>
        <small
          v-if="deliveriesPrint.length > 0"
          class="deliveries-checked-amount">
          {{ `מספר הזיכויים שסומנו: ${deliveriesPrint && deliveriesPrint.length}` }}
        </small>
        <CardUi>
          <v-flex>
            <v-data-table
              :key="renderKey"
              v-model="refundsSelected"
              :headers="headers"
              :items="items"
              :server-items-length="totalItems"
              :options.sync="options"
              item-key="id"
              class="elevation-1"
              :loading="loading"
              loading-text="טוען מידע, אנא המתן..."
              show-select
              :footer-props="footerProps"
              @click:row="showInfo">
              <template v-slot:no-data>
                <p v-text="'אין מידע.'"/>
              </template>

              <template v-slot:item.created_at="{ item }">
                {{ item.created_at | formatDate2 }}
              </template>

              <template v-slot:item.delivery.created_at="{ item }">
                {{ item.delivery && item.delivery.created_at | formatDate2 }}
              </template>

              <template v-slot:item.delivery.status="{ item }">
                <StatusesUi
                  v-if="item.delivery && item.delivery.status"
                  :status-value="getDeliveryStatusValue(item.delivery)"
                  :status-key="item.delivery.status.key"/>
              </template>
              <template v-slot:item.driver="{ item }">
                {{ item.driver && item.driver.first_name ? item.driver.first_name + ' ' + item.driver.last_name : null }}
              </template>
            </v-data-table>
          </v-flex>
        </CardUi>
      </div>
    </SectionLayout>
    <FlatStickerUi
      v-show="(printDeliveries && authUser && authUser.print_type === 'Sticker')"
      :deliveries="deliveriesPrint"
      :delivery="deliveryPrint"
    />
    <FlatStickersUi
      v-show="(printDeliveries && authUser && authUser.print_type === 'A4')"
      :deliveries="deliveriesPrint"
      :delivery="deliveryPrint"/>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'

export default {
  name: 'RefundsCoordinator',
  middleware: ['permissions'],

  data () {
    return {
      renderKey: 1,
      refundsSelected: [],
      printDeliveries: false,
      options: {},
      summariesRes: [],
      summariesLoading: false,
      loading: false,
      enter: 'animate__animated animate__faster animate__slideInLeft',
      leave: 'animate__animated animate__faster animate__slideOutLeft',
      drawerInfo: false,
      checkBoxClicked: false,
      rowClicked: false,
      item: null,
      tab: null,
      page: 'delivery',
      selected: [],
      selectAll: false,
      associatedTo: null,
      totalItems: 1000,
      items: [],
      itemsSelectedList: [],
      deliveryPrint: {},
      delivery: {},
      refund: null,

      deliveryData: {},
      filter: {
        filterScreen: 'refunds-locator',
        search: '',
        delivery_type_status_key: null,
        datesFilter: {
          fromDate: moment().startOf('month').format('YYYY-MM-DD'),
          untilDate: moment().format('YYYY-MM-DD')
        }
      },
      associatedToDriver: false,
      cancelDelivery: false,

      form: {
        barcode: null,
        delivery_error_id: null,
        rf_id: null,
        order_number: null,
        tapuz_number: null,
        delivery_type_id: null,
        customer_address: null,
        target_name: null,
        target_email: null,
        target_phone: null,
        target_street_name: null,
        target_street_number: null,
        target_city: null,
        comments: null,
        delivery_type_status_key: null,
        pickup_driver_uid: null,
        divisor_driver_uid: null,
        bring_back_driver_uid: null
      },
      pagination: {
        skip: 0,
        take: 20
      },
      formNames: {
        '/coordinator/refund': 'refundData'
      },
      formName: 'deliveryData',
      bottom: false,
      filterValue: false
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    ...mapGetters('auth', ['customer']),
    ...mapState('global', [
      'delivery_types',
      'customers',
      'driver',
      'driversSelected',
      'drivers',
      'tagList',
      'delivery_type_statuses',
      'footerProps'
    ]),

    deliveriesPrint () {
      return this.refundsSelected?.map(refund => refund.delivery)
    },
    showActions () {
      return this.deliveriesPrint?.length > 0
    },
    headers () {
      const arr = [
        { text: 'מספר לקוח', align: 'center', value: 'delivery.customer.customer_number' },
        { text: 'שם לקוח', align: 'center', value: 'delivery.customer.name' },
        { text: 'ברקוד', align: 'center', value: 'delivery.barcode' },
        { text: 'מספר הזמנה', align: 'center', value: 'delivery.order_number' },
        { text: 'סוג משלוח', align: 'center', value: 'delivery.delivery_type.value' },
        { text: 'תאריך שידור', align: 'center', value: 'delivery.created_at' },
        { text: 'סטטוס', align: 'center', value: 'delivery.status' },
        { text: 'תאריך זיכוי', align: 'center', value: 'created_at' },
        { text: 'נהג', align: 'center', value: 'driver' },
        { text: 'כמות', align: 'center', value: 'amount' },
        { text: 'סכום', align: 'center', value: 'delivery.govaina_amount' },
        { text: 'שם מזכה', align: 'center', value: 'refund_name' },
        // { text: 'מספר שק', align: 'center', value: '' },
        // { text: 'תאריך יצירת שק', align: 'center', value: 'created_at' }
      ]
      return arr
    },
    widgetsSummaries () {
      return [
        { key: 'collected_waiting_refund', title: 'ממתין לזיכוי', value: this.summariesRes.collected_waiting_refund || 0 },
        { key: 'back_to_storage', title: 'מוכן למסירה', value: this.summariesRes.back_to_storage || 0 },
        { key: 'bag_on_the_way', title: 'בדרך למסירה', value: this.summariesRes.bag_on_the_way || 0 },
        { key: 'done', title: 'בוצע', value: this.summariesRes.done || 0 },
        { key: 'error', title: 'נכשל', value: this.summariesRes.error || 0 }
      ]
    },
    tabs () {
      let tabs = [
        { title: 'משלוח', to: { name: 'coordinator-delivery' }, mode: 'create_edit' }
      ]
      if (this.delivery && this.delivery.uuid) {
        tabs.push({ title: 'לוג משלוח', to: { name: 'coordinator-logs' }, mode: 'create' })
      }

      tabs = tabs.filter(tab => this.$hasPermission(tab.to.name))
      return tabs
    },

    defaultDeliveryType () {
      for (const type of this.delivery_types) {
        if (this.delivery.delivery_type.name === type.name) {
          return type
        }
      }
      return null
    },
    customerFields () {
      const obj = {}
      if (this.delivery) {
        if (!this.delivery.customer) {
          obj.customer = {
            name: null,
            address: null
          }
        } else {
          return this.delivery.customer
        }
      }
      return obj
    },
    pickupDriverFields () {
      const obj = {}
      if (this.delivery) {
        if (!this.delivery.pickup_driver) {
          obj.customer = {
            first_name: null,
            last_name: null,
            uuid: null
          }
        } else {
          return this.delivery.pickup_driver
        }
      }
      return obj
    },
    divisorDriverFields () {
      const obj = {}
      if (this.delivery) {
        if (!this.delivery.divisor_driver) {
          obj.customer = {
            first_name: null,
            last_name: null
          }
        } else {
          return this.delivery.divisor_driver
        }
      }
      return obj
    },
    bringBackDriverFields () {
      const obj = {}
      if (this.delivery) {
        if (!this.delivery.bring_back_driver) {
          obj.customer = {
            first_name: null,
            last_name: null
          }
        } else {
          return this.delivery.bring_back_driver
        }
      }
      return obj
    },
    itemsFiltered () {
      // console.log('authUser', this.authUser)
      const items = []
      if (this.driversSelected && this.driversSelected.length > 0) {
        for (const driverUid of this.driversSelected) {
          this.items.forEach(item => {
            if (item.pickup_driver && item.pickup_driver.uuid === driverUid) {
              return items.push(item)
            }
          })
        }
        return items
      } else {
        return this.items
      }
    },
    driversSelectedArray () {
      const items = []
      this.drivers.forEach(item => {
        if (this.driversSelected && this.driversSelected.length > 0 && this.driversSelected.includes(item.id)) {
          return items.push(item)
        }
      })
      return items
    }
  },
  watch: {
    options: {
      async handler (newOptions) {
        try {
          const { sortBy, sortDesc } = this.options

          if (sortBy.length < 1 || sortDesc.length < 1) {
            return
          }

          this.pagination = {
            skip: (newOptions.page - 1) * newOptions.itemsPerPage,
            take: newOptions.itemsPerPage
          }

          await this.getRefundsViews()

          this.items = this.items?.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'delivery.customer.customer_number':
                sortA = a.delivery?.customer?.customer_number || 0
                sortB = b.delivery?.customer?.customer_number || 0
                break
              case 'delivery.customer.name':
                sortA = a.delivery?.customer?.name?.charCodeAt(0) || 0
                sortB = b.delivery?.customer?.name?.charCodeAt(0) || 0
                break
              case 'delivery.barcode':
                sortA = a.delivery.barcode?.charCodeAt(0) || 0
                sortB = b.delivery.barcode?.charCodeAt(0) || 0
                break
              case 'delivery.delivery_type.value':
                sortA = a.delivery?.delivery_type?.value?.charCodeAt(0) || 0
                sortB = b.delivery?.delivery_type?.value?.charCodeAt(0) || 0
                break
              case 'delivery.created_at':
                sortA = a.delivery?.created_at || 0
                sortB = b.delivery?.created_at || 0
                break
              case 'delivery.status':
                sortA = a.delivery?.status?.key?.charCodeAt(0) || 0
                sortB = b.delivery?.status?.key?.charCodeAt(0) || 0
                break
              case 'created_at':
                sortA = a.created_at || 0
                sortB = b.created_at || 0
                break
              case 'driver':
                sortA = a.driver?.first_name?.charCodeAt(0) || 0
                sortB = b.driver?.first_name?.charCodeAt(0) || 0
                break
              case 'amount':
                sortA = a.amount?.charCodeAt(0) || 0
                sortB = b.amount?.charCodeAt(0) || 0
                break
              case 'delivery.govaina_amount':
                sortA = a.delivery?.govaina_amount?.charCodeAt(0) || 0
                sortB = b.delivery?.govaina_amount?.charCodeAt(0) || 0
                break
              case 'refund_name':
                sortA = a.refund_name?.charCodeAt(0) || 0
                sortB = b.refund_name?.charCodeAt(0) || 0
                break
              default:
                console.log('no sorting option!')
            }
            if (sortDesc[0]) {
              return sortA < sortB ? 1 : sortA > sortB ? -1 : 0
            } else {
              return sortA < sortB ? -1 : sortA > sortB ? 1 : 0
            }
          })
        } catch (e) {
          this.$helper.snackbar(e, 'options watch')
        }
      },
      deep: true
    },
    value: {
      handler (newFilter) {
        this.$emit('input', newFilter)
      },
      deep: true
    },
    $route (newRoute) {
      try {
        // console.log('this.$route.name', this.$route.name)
        if (newRoute.name === 'coordinator') {
          this.delivery = {}
          this.pagination.skip = 0
          this.pagination.take = 20
          this.filterHelper()
          this.totalItems = this.items?.length
        }
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, '$route')
      }
    },

    selectAll (newSelectAll) {
      this.selected = newSelectAll ? this.items.map((item, index) => index) : []
    }

  },
  created () {
    this.$store.dispatch('global/getDeliveryTypes')
    this.$store.dispatch('global/getCustomerList')
    this.$store.dispatch('global/getDeliveryTypeStatuses')
    return this.filterHelper()
  },
  methods: {
    openPreviewPrintSticker () {
      this.printDeliveries = true
      if (this.authUser?.print_type === 'A4') {
        this.$nuxt.$emit('stickersUi', true)
      } else {
        this.$nuxt.$emit('stickerUi', true)
      }
    },
    filterHelper () {
      return Promise.all([this.getRefundsViews(), this.getSummaries()])
    },
    async getRefundsViews () {
      try {
        this.loading = true
        const response = await this.$refundsService.viewRefunds({ ...this.pagination, filter: this.filter })
        this.items = response.items
        this.totalItems = response.total
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getRefundsViews')
      }
    },
    async getSummaries () {
      try {
        this.loading = true
        this.summariesRes = await this.$refundsService.getSummaries({
          ...this.pagination,
          filter: this.filter
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getSummaries')
      }
    },
    multiPrint () {
      this.printDeliveries = true
      console.log('this.authUser.print_type', this.authUser && this.authUser.print_type)
      if (this.deliveriesPrint.length === 0) {
        return this.$store.commit('setSnackbar', { value: true, message: 'print is empty', error: true })
      }
      if (this.authUser.print_type === 'A4') {
        this.$nuxt.$emit('stickersUi')
      } else if (this.authUser.print_type === 'Sticker') {
        this.$nuxt.$emit('stickerUi')
      }
    },
    getDeliveryStatusValue (delivery) {
      let statusValue = null
      if (delivery.status?.key === 'enter_to') {
        statusValue = ((delivery.status_data?.enter_to_branch && delivery.status.name) + delivery.status_data?.enter_to_branch) || delivery.status.name
      } else if (delivery.status && delivery.status.key === 'exit_to') {
        statusValue = ((delivery.status_data?.exit_to_branch && delivery.status.name) + delivery.status_data?.exit_to_branch) || delivery.status.name
      } else {
        statusValue = delivery.status.name
      }
      return statusValue
    },
    getFullName (item) {
      return `${item.first_name} ${item.last_name}`
    },
    updateStatus (deliveryUid, deliveryStatus) {
      if (this.items) {
        for (const delivery of this.items) {
          if (delivery.uuid === deliveryUid) {
            delivery.status = deliveryStatus
          }
        }
      }
    },
    showInfo (item) {
      Object.keys(this.form).forEach(key => this.form[key] = item[key])
      this.delivery = item.delivery
      this.deliveryPrint = item.delivery
      this.refund = item
      this.$router.push({ name: 'refunds-locator-refund' })
      this.$store.commit('setDrawerUi', true)
    },
    onsubmit (item) { // every component call different function
      const formName = this.formNames[this.tab]
      this.$nuxt.$emit('formSubmit', formName) // submit to function from child comp
    }
  },
  head: { title: 'איתור זיכוי - מחסן החזרות' }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .col-10 {
    padding-right: 0 !important;
  }
}
.coordinator{
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
      font-size: 1.5px !important;
    }
    .theme--light.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
      font-size: 15px !important;
      background-color: #e6e6e6;
    }
    .v-data-table > .v-data-table__wrapper > table > tbody > tr > td, .v-data-table > .v-data-table__wrapper > table > tbody > tr > th,
    .v-data-table > .v-data-table__wrapper > table > thead > tr > td, .v-data-table > .v-data-table__wrapper > table > thead > tr > th,
    .v-data-table > .v-data-table__wrapper > table > tfoot > tr > td, .v-data-table > .v-data-table__wrapper > table > tfoot > tr > th {
      padding: 0 8px !important;
    }
  }
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

    .deleted-delivery {
      background-color: #ffffa1 !important;
    }

    .late-delivery {
      background-color: #ff3f3f !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .late-delivery:hover {
      background-color: darken(#ff3f3f, 10%) !important;
    }

    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}

.btns-coordinator {
  padding-right: 0 !important;
  margin-right: 0 !important;
}
.table-ui-tr {
  td {
    text-align: center !important;
  }
}
.deliveries-checked-amount {
  margin-right: 10px;
}
.scan-col {
  padding-top: 40px;
}
.v-input__slot{
  background: unset;
}
.coordinator-body {
  background-color: #F8F8FD;
  .btn-primary{
    margin: 0 0 0 12px!important;
  }
}
.filter-ui {
  margin-right: -8px;
}</style>
