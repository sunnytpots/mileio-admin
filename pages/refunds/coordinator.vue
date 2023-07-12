<template>
  <div class="coordinator">
    <SectionLayout title="רכז זיכויים" :class="['d-print-none', 'mainBody']">
      <template class="d-print-none" #header>
        <CardDriver
          v-if="driversSelected && driversSelected.length > 0"
          :selected-array="driversSelectedArray" />
        <DateFilter
          v-else
          v-model="filter.datesFilter"
          :loading="loading"
          show-filter-choice/>
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
        <n-child
          :delivery="delivery"
          :refund="refund"
          @open-preview-print-sticker="openPreviewPrintSticker"/>
      </DrawerUi>

      <v-row>
        <v-col>
          <InfoPanel
            v-model="filter.delivery_type_status_key"
            :class="['d-print-none','info-panel-coordinator']"
            :delivery-info="deliveryData"
            show-clear-button
            widget-clickable
            :widgets="widgetsSummaries"
            :widgets-loading="summariesLoading" />
        </v-col>
      </v-row>
      <div
        class="coordinator-body">
        <FilterUi
          v-model="filter"
          show-drivers
          :drivers="drivers"
          show-delivery-status
          :delivery-type-statuses="delivery_type_statuses"
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
          v-if="itemsSelectedList.length > 0"
          class="deliveries-checked-amount">
          {{ `מספר המשלוחים שסומנו: ${itemsSelectedList && itemsSelectedList.length}` }}
        </small>

        <CardUi>
          <template #header>
          </template>
          <v-flex>
            <v-data-table
              v-model="itemsSelectedList"
              :headers="headers"
              :items="items"
              :server-items-length="totalItems"
              item-key="id"
              class="elevation-1"
              :loading="loading"
              loading-text="טוען זיכויים, אנא המתן..."
              show-select
              :footer-props="footerProps"
              @click:row="showInfo">
              <template v-slot:no-data>
                <p v-text="'אין מידע.'"/>
              </template>

              <template v-slot:item.delivery.status="{ item }">
                <StatusesUi
                  v-if="item.delivery && item.delivery.status"
                  :status-value="item.delivery.status.name"
                  :status-key="item.delivery.status.key"/>
              </template>

              <template v-slot:item.delivery.delivered_date="{ item }">
                {{ item.delivery && item.delivery.delivered_date | formatDate }}
              </template>

              <template v-slot:item.delivery.created_at="{ item }">
                {{ item.delivery && item.delivery.created_at | formatDate }}
              </template>

              <template v-slot:item.driver="{ item }">
                {{ item.driver && (item.driver.first_name + ' ' + item.driver.last_name) }}
              </template>
            </v-data-table>
          </v-flex>
        </CardUi>
      </div>
    </SectionLayout>
    <FlatStickerUi
      v-show="(printDeliveries && authUser && authUser.print_type === 'Sticker')"
      :deliveries="deliveriesPrint"
      :delivery="deliveryPrint"/>
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
      deliveryPrint: {},
      summariesLoading: false,
      summariesRes: { },
      enter: 'animate__animated animate__faster animate__slideInLeft',
      leave: 'animate__animated animate__faster animate__slideOutLeft',
      drawerInfo: false,
      loading: false,
      checkBoxClicked: false,
      rowClicked: false,
      // showActions: false,
      item: null,
      tab: null,
      page: 'delivery',
      selected: [],
      selectAll: false,
      associatedTo: null,
      items: [],
      totalItems: 0,
      itemsSelectedList: [],
      deliveriesPrint: [],
      printDeliveries: false,
      delivery: {},
      refund: null,

      deliveryData: {},
      filter: {
        filterScreen: 'refunds-coordinator',
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
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
      formName: 'deliveryData'
    }
  },
  computed: {
    ...mapState('auth', ['authUser', 'branchSelected']),
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

    showActions () {
      return this.itemsSelectedList?.length > 0
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
    widgetsSummaries () {
      return [
        {
          key: 'collected_waiting_refund',
          title: 'נאסף ממתין לזיכוי',
          value: (this.summariesRes.collected_waiting_refund + this.summariesRes.returning_to_storage) || 0
        },
        { key: 'back_to_storage', title: 'זוכה', value: this.summariesRes.back_to_storage || 0 },
        { key: 'error', title: 'לא תקין', value: this.summariesRes.error || 0 },
        { key: 'lost', title: 'אבדן', value: this.summariesRes.lost || 0 }
      ]
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
    driversSelectedArray () {
      const items = []
      this.drivers.forEach(item => {
        if (this.driversSelected && this.driversSelected.length > 0 && this.driversSelected.includes(item.id)) {
          return items.push(item)
        }
      })
      return items
    },
    headers () {
      const arr = [
        { text: '', align: 'center', value: '' },
        { text: 'שם לקוח', align: 'center', value: 'delivery.customer.name' },
        { text: 'ברקוד', align: 'center', value: 'delivery.barcode' },
        { text: 'מספר הזמנה', align: 'center', value: 'delivery.order_number' },
        { text: 'סוג משלוח', align: 'center', value: 'delivery.delivery_type.value' },
        { text: 'תאריך שידור', align: 'center', value: 'delivery.created_at' },
        { text: 'סטטוס', align: 'center', value: 'delivery.status' },
        { text: 'שם נמען', align: 'center', value: 'delivery.target_name' },
        { text: 'עיר', align: 'center', value: 'delivery.target_address.correct_long_city_name' },
        { text: 'רחוב', align: 'center', value: 'delivery.target_address.correct_long_street_name' },
        { text: 'תאריך מסירה', align: 'center', value: 'delivery.delivered_date' },
        { text: 'נהג', align: 'center', value: 'driver' },
        { text: 'סכום מצופה', align: 'center', value: 'sum' },
        { text: 'שם מזכה', align: 'center', value: 'refund_name' }
      ]
      return arr
    }
  },
  watch: {
    itemsSelectedList (newVal) {
      this.deliveriesPrint = newVal?.map(item => item.delivery)
    },
    value: {
      handler (newFilter) {
        this.$emit('input', newFilter)
      },
      deep: true
    },
    $route (newRoute) {
      try {
        if (this.$route.name === 'refunds-coordinator') {
          return this.filterHelper()
        }
      } catch (e) {
        this.$helper.snackbar(e, '$route')
      }
    },
    selectAll (newSelectAll) {
      this.selected = newSelectAll ? this.items.map((item, index) => index) : []
    },
    async driversSelected () {
      try {
        this.loading = true
        this.pagination.skip = 0
        this.pagination.take = 100
        this.items = await this.$refundsService.viewRefunds({
          ...this.pagination,
          byDriverIds: this.driversSelected,
          filter: this.filter,
          branch_id: this.branchSelected
        })
        this.summariesRes = await this.$refundsService.getSummaries({
          ...this.pagination,
          filter: this.filter,
          branch_id: this.branchSelected,
          byDriverIds: this.driversSelected
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'driversSelected')
      }
    },
    async branchSelected () {
      try {
        this.loading = true
        this.pagination.skip = 0
        this.pagination.take = 100
        this.items = await this.$refundsService.viewRefunds({
          ...this.pagination,
          byDriverIds: this.driversSelected,
          filter: this.filter,
          branch_id: this.branchSelected
        })
        this.summariesRes = await this.$refundsService.getSummaries({
          ...this.pagination,
          filter: this.filter,
          branch_id: this.branchSelected,
          byDriverIds: this.driversSelected
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'branchSelected')
      }
    }
  },
  created () {
    this.$store.dispatch('global/getDeliveryTypes')
    this.$store.dispatch('global/getCustomerList')
    this.$store.dispatch('global/getDeliveryTypeStatuses')
    return this.filterHelper()
  },
  methods: {
    filterHelper () {
      return Promise.all([this.getRefundsViews(), this.getSummaries()])
    },
    async getSummaries () {
      try {
        this.summariesLoading = true
        this.summariesRes = await this.$refundsService.getSummaries({
          ...this.pagination,
          filter: this.filter,
          branch_id: this.branchSelected,
          byDriverIds: this.driversSelected
        })
        this.summariesLoading = false
      } catch (e) {
        this.summariesLoading = false
        this.$helper.snackbar(e, 'getRefundsViews')
      }
    },
    async getRefundsViews () {
      try {
        this.loading = true
        const response = await this.$refundsService.viewRefunds({
          ...this.pagination,
          filter: this.filter,
          byDriverIds: this.driversSelected,
          branch_id: this.branchSelected
        })
        this.items = response?.items
        this.totalItems = response?.total
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getRefundsViews')
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
      this.$router.push({ name: 'refunds-coordinator-refund' })
      this.$store.commit('setDrawerUi', true)
    },
    onsubmit (item) { // every component call different function
      const formName = this.formNames[this.tab]
      this.$nuxt.$emit('formSubmit', formName) // submit to function from child comp
    },
    getTypeName (type) {
      let deliveryType = null
      const names = {
        regular: 'רגיל',
        dual: 'כפול',
        certificate: 'תעודה',
        collection: 'איסוף',
        quantity_collection: 'איסוף כמותי',
        govaina: 'גוביינא',
        transference: 'העברה'
      }
      if (!type) {
        deliveryType = null
      } else {
        deliveryType = names[type.name]
      }
      return deliveryType
    },
    openPreviewPrintSticker () {
      this.printDeliveries = true
      if (this.authUser?.print_type === 'A4') {
        this.$nuxt.$emit('stickersUi', true)
      } else {
        this.$nuxt.$emit('stickerUi', true)
      }
    }
  },
  head: { title: 'רכז זיכויים' }
}
</script>

<style lang="scss" scoped>
.btns-coordinator {
  padding: 0 !important;
  button {
    margin-left: 10px;
  }
}
.deliveries-checked-amount {
  margin-right: 0;
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

.export-btn {
  ::v-deep {
    .col-2 {
      padding-right: 0 !important;
    }
  }
}

.scan-col {
  padding-top: 40px;
}
.v-input__slot{
  background: unset;
}

.filter-ui{
  margin-right: -25px;
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
.coordinator-body {
  background-color: #F8F8FD;
  .filter-ui {
    margin-right: -12px;
  }
  .btn-primary{
    margin: 0 0 0 12px!important;
  }
}
</style>
