<template>
  <div style="width: 100%">
    <SectionLayout class="d-print-none" title="ניהול מחסן החזרות">
      <template #header>
        <CardDriver
          v-if="driversSelected && driversSelected.length > 0"
          :selected-array="driversSelectedArray" />
        <DateFilter
          v-if="!driversSelected || driversSelected.length === 0"
          v-model="filter" />
      </template>

      <DrawerUi :title=" customerBagNumber ? `מספר שק החזרות ${customerBagNumber}` : null" >
        <template v-if="$hasPermission('refunds-refunds-storage-scan-bag', 'edit')" #header>

          <v-btn
            nuxt
            :to="{ name: 'refunds-refunds-storage-logs', params: { bagNumber: customerBagNumber } }"
            class="btn-primary d-print-none">
            לוג שק לקוח
          </v-btn>

          <v-btn
            v-if="refund && refund.is_blocked"
            class="btn-primary d-print-none"
            @click.prevent="printListOfBag">
            הדפס טופס
          </v-btn>

          <v-btn
            :disabled="refund && refund.is_blocked"
            class="btn-primary d-print-none"
            @click.prevent="blockCustomerBag">
            נעילת שק
          </v-btn>
        </template>
        <n-child
          :refund="refund"
          :customers="customers"
          :bag-number="customerBagNumber"
          @update-comments="newComments => comments = newComments"
          @customer-bag-number="newCustomerBagNumber => customerBagNumber = newCustomerBagNumber"/>
      </DrawerUi>
      <v-row>
        <v-col>
          <InfoPanel
            v-model="filter.delivery_type_status_key"
            :delivery-info="deliveryData"
            :widgets="widgetsSummaries"
            show-clear-button
            widget-clickable
            :widgets-loading="summariesLoading"/>
        </v-col>
        <v-col class="scan-col">
          <BarcodeSearch
            v-model="filter.search"
            :side-text="'איתור ברקוד'"
            @scanFromBarcodeSearch="fromBarcodeSearch = true"/>
        </v-col>
      </v-row>
      <div class="coordinator-body">
        <FilterUi
          v-model="filter"
          show-delivery-status
          :delivery-type-statuses="statuses"
          show-customer
          :customer-list="customers"
          show-search
          show-customer-city
          @submit="onFilter"/>
        <div :class="['col-2', 'btns-coordinator']">
          <v-btn class="btn-primary" @click="onFilter">
            מיין תוצאות
          </v-btn>

          <ExportReport
            report-type="customerBags"
            :filter="filter"/>

          <v-select
            v-if="showActions"
            clearable
            rounded
            class="coordinatorActions"
            filled
            :items="actions"
            item-text="name"
            item-value="key"
            label="פעולות"
            @change="selectAction"/>
          <div v-if="showActions && associatedToDriver" class="choose-driver-coordinator">
            <v-autocomplete
              v-model="associatedTo"
              clearable
              dense
              filled
              outlined
              :items="drivers"
              :item-text="getFullName"
              item-value="uuid"
              :label="associatedTo === null ? 'בחר נהג' : ''"/>
            <v-btn
              :disabled="!associatedTo"
              :loading="loading"
              class="btn-primary"
              style="margin: 0"
              @click.prevent="multipleAssociateToDriver">
              {{ 'שמירה' }}
            </v-btn>
          </div>
        </div>
        <small
          v-if="itemsSelectedList.length > 0"
          class="deliveries-checked-amount">
          {{ `מספר השקים שסומנו: ${itemsSelectedList && itemsSelectedList.length}` }}
        </small>
        <CardUi>
          <v-flex>
            <v-data-table
              v-model="itemsSelectedList"
              :headers="headers"
              :items="items"
              :server-items-length="totalItems"
              :options.sync="options"
              item-key="id"
              show-select
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
                  v-if="item.status"
                  :status-value="getBagStatusValue(item.status)"
                  :status-key="item.status" />
              </template>

              <template v-slot:item.driver="{ item }">
                {{ item.driver && `${item.driver.first_name} ${item.driver.last_name}` }}
              </template>

              <template v-slot:item.return>
                החזרה
              </template>

              <template v-slot:item.created_at="{ item }">
                {{ item.created_at | formatDate2 }}
              </template>

              <template v-slot:item.blocking_date="{ item }">
                {{ item.blocking_date | formatDate2 }}
              </template>

              <template v-slot:item.collected_date="{ item }">
                {{ item.collected_date | formatDate2 }}
              </template>

              <template v-slot:item.delivered_date="{ item }">
                {{ item.delivered_date | formatDate2 }}
              </template>
            </v-data-table>
          </v-flex>

          <v-dialog
            v-model="dialog"
            persistent
            max-width="290">
            <v-card>
              <v-card-title class="headline">
                הודעה
              </v-card-title>
              <v-card-text>האם אתה בטוח שברצונך לבטל את השקים שסומנו?</v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="green darken-1"
                  text
                  @click="dialog = false">
                  לא
                </v-btn>
                <v-btn
                  color="green darken-1"
                  text
                  @click="cancelBagDeliveries">
                  בצע
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>
        </CardUi>
      </div>
    </SectionLayout>
    <PrintListUi
      v-if="printBagList"
      :customer-bag="bagDataToPrinter"
      :items="bagPrintList"
      :headers="bagPrintListHeaders"
      :comments="comments"
      title="שק החזרות" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'

export default {
  name: 'RefundsStorage',
  middleware: ['permissions'],

  data () {
    return {
      comments: null,
      options: {},
      totalItems: 1000,
      renderKey: 1,
      fromBarcodeSearch: false,
      summariesLoading: false,
      summariesRes: {},
      loading: false,
      enter: 'animate__animated animate__faster animate__slideInLeft',
      leave: 'animate__animated animate__faster animate__slideOutLeft',
      checkBoxClicked: false,
      rowClicked: false,
      item: null,
      tab: null,
      dialog: false,
      associatedTo: null,
      items: [],
      itemsSelectedList: [],
      refund: null,
      deliveryData: {},
      filter: {
        search: null,
        fromDate: moment().startOf('month').format('YYYY-MM-DD'),
        untilDate: moment().format('YYYY-MM-DD')
      },
      associatedToDriver: false,
      removeFrom: false,
      cancelBags: false,

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
        delivery_type_status_key: null,
        pickup_driver_uid: null,
        divisor_driver_uid: null,
        bring_back_driver_uid: null,
        drivers_ids: null
      },
      pagination: {
        skip: 0,
        take: 20
      },
      formNames: {
        '/coordinator/refund': 'refundData'
      },
      formName: 'deliveryData',
      filterValue: false,
      customerBagNumber: null,
      statuses: [
        { key: 'in_preparation', name: 'שק בהכנה' },
        { key: 'ready_to_delivered', name: 'שק החזרות במחסן' },
        { key: 'on_the_way', name: 'שק בדרך ליעד' },
        { key: 'done', name: 'בוצע' }
      ],
      customerBagIdSelected: null,
      taskDriver: null,
      printBagList: false,
      bagPrintList: [],
      bagDataToPrinter: null,
      bagPrintListHeaders: [
        // { text: '', sortable: false, align: 'start', value: 'barcode' },
        { text: 'מספר משלוח', align: 'center', value: 'barcode' },
        { text: 'שם נמען', align: 'center', value: 'target_name' },
        { text: 'ברקוד', align: 'center', value: '_barcode' }
      ]
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

    showActions () {
      if (this.itemsSelectedList?.length === 0) {
        return false
      }
      for (const bag of this.itemsSelectedList) {
        if (bag.status === 'done') {
          return false
        }
      }
      return true
    },
    headers () {
      const arr = [
        { text: 'מספר שק החזרות', align: 'center', value: 'refund_bag_number' },
        { text: 'שם לקוח', align: 'center', value: 'customer.name' },
        { text: 'כמות חבילות בשק', align: 'center', value: 'packages.length' },
        { text: 'סטטוס', align: 'center', value: 'status' },
        { text: 'מחסנאי', align: 'center', value: 'storekeeper_name' },
        { text: 'נהג', align: 'center', value: 'driver' },
        { text: 'סוג', align: 'center', value: 'return' },
        { text: 'עיר', align: 'center', value: 'address.correct_long_city_name' },
        { text: 'כתובת', align: 'center', value: 'address.correct_long_street_name' },
        { text: 'תאריך יצירה', align: 'center', value: 'created_at' },
        { text: 'תאריך נעילה', align: 'center', value: 'blocking_date' },
        { text: 'תאריך איסוף', align: 'center', value: 'collected_date' },
        { text: 'תאריך מסירה', align: 'center', value: 'delivered_date' }
      ]
      return arr
    },
    actions () {
      const arr = [{ name: 'ביטול שקים', key: 'cancelBags' }]
      for (const bag of this.itemsSelectedList) {
        if (bag?.status === 'done') {
          return []
        }
      }

      for (const bag of this.itemsSelectedList) {
        if (bag && !bag.is_blocked) {
          return arr
        }
      }
      arr.push(...[
        { name: 'שיוך לנהג', key: 'associatedTo' },
        { name: 'הורדה מנהג', key: 'removeFrom' }
      ])
      return arr
    },
    tabs () {
      const tabs = [
        { title: 'לוג שק לקוח', to: { name: 'refunds-refunds-storage-logs' }, mode: 'create_edit' }
      ]

      // tabs = tabs.filter(tab => this.$hasPermission(tab.to.name))
      return tabs
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
    },
    widgetsSummaries () {
      return [
        { key: 'in_preparation', title: 'שק בהכנה', value: this.summariesRes.in_preparation || 0 },
        { key: 'on_the_way', title: 'שק בדרך ליעד', value: this.summariesRes.on_the_way || 0 },
        // { key: 'ready_to_delivered', title: 'מוכן למסירה', value: this.summariesRes.ready_to_delivered || 0 },
        { key: 'done', title: 'שק הגיע ליעד', value: this.summariesRes.done || 0 },
        { key: 'back_to_storage', title: 'כמות חבילות במחסן', value: this.summariesRes.back_to_storage || 0, specificNotClickable: true }
      ]
    }
  },
  watch: {
    options: {
      async handler (newOptions) {
        try {
          const { sortBy, sortDesc } = this.options
          this.pagination = {
            skip: (newOptions.page - 1) * newOptions.itemsPerPage,
            take: newOptions.itemsPerPage
          }
          await this.getItems()

          if (sortBy.length < 1 || sortDesc.length < 1) {
            return
          }

          this.items = this.items?.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'refund_bag_number':
                sortA = a.refund_bag_number || 0
                sortB = b.refund_bag_number || 0
                break
              case 'customer.name':
                sortA = a.customer.name?.charCodeAt(0) || 0
                sortB = b.customer.name?.charCodeAt(0) || 0
                break
              case 'packages.length':
                sortA = a.packages.length || 0
                sortB = b.packages.length || 0
                break
              case 'status':
                sortA = a.status?.charCodeAt(0) || 0
                sortB = b.status?.charCodeAt(0) || 0
                break
              case 'storekeeper_name':
                sortA = a.storekeeper_name || 0
                sortB = b.storekeeper_name || 0
                break
              case 'driver':
                sortA = a.driver?.first_name?.charCodeAt(0) || 0
                sortB = b.driver?.first_name?.charCodeAt(0) || 0
                break
              case 'address.correct_long_city_name':
                sortA = a.address.correct_long_city_name?.charCodeAt(0) || 0
                sortB = b.address.correct_long_city_name?.charCodeAt(0) || 0
                break
              case 'address.correct_long_street_name':
                sortA = a.address.correct_long_street_name?.charCodeAt(0) || 0
                sortB = b.address.correct_long_street_name?.charCodeAt(0) || 0
                break
              case 'created_at':
                sortA = a.created_at || 0
                sortB = b.created_at || 0
                break
              case 'collected_date':
                sortA = a.collected_date || 0
                sortB = b.collected_date || 0
                break
              case 'delivered_date':
                sortA = a.delivered_date || 0
                sortB = b.delivered_date || 0
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
    driversSelected (newVal) {
      this.filter = {
        ...this.filter,
        drivers_ids: newVal
      }
    },
    async $route (newRoute) {
      try {
        if (this.$route.name === 'refunds-refunds-storage') {
          console.log('this.$route.name', this.$route.name)
          this.pagination.skip = 0
          this.pagination.take = 20
          await this.getItems()
          this.customerBagNumber = null
          this.bagDataToPrinter = null
          this.bagPrintList = []
          this.refund = null
        }
      } catch (e) {
        this.$helper.snackbar(e, '$route watch')
      }
    }
  },
  async created () {
    try {
      await Promise.all([
        this.getItems(),
        this.$store.dispatch('global/getDeliveryTypes'),
        this.$store.dispatch('global/getCustomerList'),
        this.$store.dispatch('global/getDeliveryTypeStatuses')
      ])
    } catch (e) {
      this.loading = false
      this.summariesLoading = false
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    async onFilter () {
      try {
        this.loading = true
        this.summariesLoading = true
        let fromBarcodeSearchResult
        if (this.fromBarcodeSearch) {
          fromBarcodeSearchResult = await this.$customerBagsService.findBagByPackage({ filter: this.filter })
          this.fromBarcodeSearch = false
        }
        if (!fromBarcodeSearchResult) {
          await this.getItems()
        } else {
          await this.showInfo(fromBarcodeSearchResult)
        }
        this.loading = false
        this.summariesLoading = false
      } catch (e) {
        this.loading = false
        this.summariesLoading = false
        this.fromBarcodeSearch = false
        this.$helper.snackbar(e, 'filter error')
      }
    },
    async getItems () {
      try {
        this.loading = true
        this.summariesLoading = true
        const response = await this.$customerBagsService.viewBag({
          ...this.pagination,
          filter: this.filter
        })
        this.items = response?.items
        this.totalItems = response?.total
        this.summariesRes = await this.$customerBagsService.getSummaries({ filter: this.filter })
        this.loading = false
        this.summariesLoading = false
      } catch (e) {
        this.$helper.snackbar(e, 'getItems')
      }
    },
    getBagStatusValue (statusName) {
      switch (statusName) {
        case 'in_preparation':
          return 'שק בהכנה'
        case 'ready_to_delivered':
          return 'שק החזרות במחסן'
        case 'on_the_way':
          return 'שק בדרך ליעד'
        case 'done':
          return 'בוצע'
      }
      return statusName
    },
    getFullName (item) {
      return `${item.first_name} ${item.last_name}`
    },
    selectAction (action) {
      switch (action) {
        case 'associatedTo':
          this.associatedToDriver = true
          this.cancelBags = false
          break
        case 'removeFrom':
          this.cancelBags = false
          this.associatedToDriver = false
          return this.multipleRemoveFromDriver()
        case 'cancelBags':
          this.cancelBags = true
          this.associatedToDriver = false
          this.dialog = true
          break
      }
    },
    async cancelBagDeliveries () {
      try {
        this.dialog = false
        this.loading = true
        const itemsSelectedListIds = this.itemsSelectedList.map(item => item.id)
        await this.$customerBagsService.cancelBag({ bags_ids: itemsSelectedListIds })
        this.itemsSelectedList = []
        return this.getItems()
      } catch (e) {
        this.$helper.snackbar(e, 'cancelBagDeliveries')
      }
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
      console.log('showInfo', item)
      Object.keys(this.form).forEach(key => this.form[key] = item[key])
      this.refund = item
      this.customerBagNumber = item.refund_bag_number
      this.$router.push({ name: 'refunds-refunds-storage-scan-bag' })
      this.$store.commit('setDrawerUi', true)
    },
    onsubmit (item) {
      this.$store.commit('setDrawerUi', false)
      this.$router.push({ name: 'refunds-refunds-storage' })
    },
    async blockCustomerBag () {
      try {
        if (this.customerBagNumber) {
          console.log('this.customerBagNumber', this.customerBagNumber)
          await this.$customerBagsService.blockBag({ refund_bag_number: this.customerBagNumber })
          this.refund.is_blocked = true
        } else {
          this.$store.commit('setSnackbar', { value: true, message: 'have-to-select-customer', error: true })
        }
      } catch (e) {
        this.$helper.snackbar(e, 'blockCustomerBag')
      }
    },

    async printListOfBag () {
      try {
        const res = await this.$packagesBagService.viewByCustomerBag({ bag_id: this.refund.id })
        this.printBagList = true
        this.bagPrintList = res?.deliveries
        this.bagDataToPrinter = res?.bag_data
        setTimeout(() => window.print(), 0)
      } catch (e) {
        this.$helper.snackbar(e, 'printListOfBag')
      }
    },
    async multipleAssociateToDriver () {
      try {
        console.log('multipleAssociateToDriver this.itemsSelectedList', this.associatedTo)
        const bagIds = this.itemsSelectedList?.map(item => item.id)
        await this.$customerBagsService.multipleAssociateToDriver({ driver_uid: this.associatedTo, bag_ids: bagIds })
        this.pagination = { skip: 0, take: 20 }
        await this.getItems()
        this.itemsSelectedList = []
        this.checkBoxClicked = false
        this.associatedToDriver = false
        this.renderKey++
      } catch (e) {
        this.$helper.snackbar(e, 'multipleAssociateToDriver')
      }
    },
    async multipleRemoveFromDriver () {
      try {
        console.log('multipleRemoveFromDriver')
        const bagIds = this.itemsSelectedList?.map(item => item.id)
        this.loading = true
        await this.$customerBagsService.multipleRemoveFromDriver({ bag_ids: bagIds })
        this.pagination = { skip: 0, take: 100 }
        await this.getItems()
        this.loading = false
        this.itemsSelectedList = []
        this.checkBoxClicked = false
        this.associatedToDriver = false
        this.renderKey++
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'multipleRemoveFromDriver')
      }
    },
    async associateToDriver () {
      try {
        await this.$customerBagsService.associateToDriver({
          driver_id: this.taskDriver,
          bag_id: this.customerBagIdSelected
        })
        this.pagination = { skip: 0, take: 20 }
        return this.getItems()
      } catch (e) {
        this.$helper.snackbar(e, 'associateToDriver')
      }
    }
  },
  head: { title: 'ניהול מחסן החזרות' }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .col-2.btns-coordinator {
    padding-right: 0 !important;
    .export-btn .col-2 {
      padding-right: 0 !important;
    }
  }
}
.filter-ui {
  margin-right: -20px;
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
.deliveries-checked-amount {
  margin-right: 10px;
}
.spinner {
  margin: auto 50%;
}
.scan-col {
  padding-top: 40px;
}
.coordinator-body {
  background-color: #F8F8FD;
  .btn-primary{
    margin: 0 0 0 12px!important;
  }
}
.v-input__slot{
  background: unset;
}
</style>
