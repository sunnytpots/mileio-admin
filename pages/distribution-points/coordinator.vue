<template>
  <div class="coordinator">
    <SectionLayout :title="'רכז TA-BOX'" :class="['d-print-none', 'mainBody']" >
      <template class="d-print-none" #header>
        <CardDriver
          v-show="driversSelected && driversSelected.length > 0"
          :selected-array="driversSelectedArray" />
        <DateFilter
          v-if="!driversSelected || driversSelected.length === 0"
          v-model="filter.datesFilter"
          :loading="loading" />
      </template>
      <DrawerUi
        v-model="tab"
        class="d-print-none"
        :tabs="tabs"
        show-delivery-details
        show-delivery-statuses>
        <template v-if="$hasPermission('distribution-points-coordinator', 'edit')" #header>
          <p v-if="delivery && delivery.created_at" class="drawer-top-info">
            תאריך יצירת משלוח: {{ delivery && delivery.created_at | formatDate }}
          </p>
          <v-btn class="btn-primary" @click.prevent="onsubmit" :loading="loading">
            שמירה
          </v-btn>
        </template>

        <template v-if="$route.name === 'distribution-points-coordinator-delivery' && delivery.uuid" #aside>
          <div v-if="delivery.status" style="display: flex; margin-bottom: 10px;justify-content: center;">
            <StatusesUi
              v-if="delivery.status"
              :status-value="delivery.status.name"
              :status-key="delivery.status.key"/>
          </div>

          <div v-if="delivery.status" style="display: grid; margin-bottom: 10px;justify-content: center;">
            <small v-if="delivery.eta_time" style="margin: auto;font-weight: 700;">
              ETA:{{ delivery && delivery.eta_time }}
            </small>
          </div>

          <v-spacer />
          <div v-if="delivery.duration_time" style="display: flex; margin-bottom: 10px;justify-content: center;">
            <div class="unedited-field">
              <small>חלון מסירה:</small>
              <small v-if="delivery.duration_time" style="margin: auto;font-weight: 700;">
                {{ delivery.duration_time }}
              </small>
              <small v-else >טרם עודכן</small>
            </div>
          </div>

          <TagsUi
            v-model="tags"
            :tag-list="tagList"
            :form="form"/>

          <DeliveryStatus :delivery-info="delivery"/>
        </template>
        <n-child
          :delivery="delivery"
          :customer-fields="customerFields"
          :tags="tags"
          :delivery-types="deliveryTypesItems"
          :drivers="drivers"
          :customers="customers"/>
      </DrawerUi>

      <InfoPanel
        v-model="filter.delivery_type_status_key"
        :class="['d-print-none','info-panel-coordinator']"
        :delivery-info="deliveryData"
        show-clear-button
        widget-clickable
        :widgets="widgetsSummaries"
        :widgets-loading="summariesLoading" />
      <div class="coordinator-body">
        <FilterUi
          v-model="filter"
          show-reset
          class="filter-ui"
          :clear-filter-inputs="clearFilterInputs"
          show-delivery-status
          :delivery-type-statuses="delivery_type_statuses"
          show-customer
          :customer-list="customers"
          :delivery-types="delivery_types"
          show-tags
          :tags="tagList"
          show-dist-pts
          :dist-pts="distribution_points"
          show-lines
          :lines="lines"
          show-search
          :on-drivers-selected="driversSelected && driversSelected.length > 0"
          @submit="onFilter">
        </FilterUi>
        <div :class="['col-2', 'btns-coordinator']">
          <v-btn class="btn-primary" @click="onFilter">
            מיין תוצאות
          </v-btn>
          <v-btn
            depressed
            :class="{'white--text': true, 'btn-gray': true, 'disable-events': !showActions}"
            @click.prevent="multiPrint">
            <img src="../../assets/images/icons/printer.svg"></img>
            הדפסת מדבקה
          </v-btn>

          <ExportReport
            report-type="distributionDeliveriesPoints"
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
            :label="showActionsLabel ? 'פעולות' : ''"
            @change="selectAction"/>
        </div>
        <small v-if="showActions" class="deliveries-checked-amount">
          {{ `מספר המשלוחים שסומנו: ${itemsSelectedList && itemsSelectedList.length}` }}
        </small>
        <CardUi class="d-print-none text-center" overflow>
          <template #header>
          </template>
          <v-flex>
            <v-data-table
              v-model="itemsSelectedList"
              :headers="headers"
              :items="items"
              :options.sync="options"
              item-key="id"
              show-select
              class="elevation-1"
              :loading="loading"
              loading-text="טוען TA-BOX, אנא המתן..."
              :footer-props="footerProps"
              @click:row="showInfo">
              <template v-slot:no-data>
                <p v-text="'אין מידע.'"/>
              </template>

              <template v-slot:item.address.correct_short_street_name="{ item }">
                {{ item.address.correct_short_street_name }} {{ item.address.correct_street_number }}
              </template>

              <template v-slot:item.status="{ item }">
                <StatusesUi
                  v-if="item.status"
                  :status-value="getDeliveryStatusValue(item)"
                  :status-key="item.status.key" />
              </template>

              <template v-slot:item.created_at="{ item }">
                {{ item.created_at | formatDate }}
              </template>

              <template v-slot:item.delivered_date="{ item }">
                {{ item.delivered_date | formatDate }}
              </template>

              <template v-slot:item.collected_date="{ item }">
                {{ item.collected_date | formatDate }}
              </template>

              <template v-slot:item.divisor_driver="{ item }">
                {{ item.divisor_driver ? item.divisor_driver.first_name + ' ' + item.divisor_driver.last_name : null }}
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
              <v-card-text>האם אתה בטוח שברצונך לבטל את המשלוחים שסומנו?</v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="green darken-1"
                  text
                  @click="dialog = false">
                  בטל
                </v-btn>
                <v-btn
                  color="green darken-1"
                  text
                  @click="cancelDeliveries">
                  בצע
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

        </CardUi>
      </div>
    </SectionLayout>
    <FlatStickerUi
      v-show="(printDeliveries && authUser && authUser.print_type === 'Sticker')"
      :deliveries="deliveriesPrint"
      :delivery="delivery"
    />

    <FlatStickersUi
      v-show="(printDeliveries && authUser && authUser.print_type === 'A4')"
      :deliveries="deliveriesPrint"
      :delivery="delivery"
      @printed="isPrinted" />

    <PrintListUi
      v-if="printDriverDeliveries"
      :driver-selected="driverPrintList"
      :items="printList"
      :headers="printListHeaders"
      :title="'רשימת משלוחים'"/>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'

export default {
  name: 'DistributionPointsCoordinator',
  middleware: ['permissions'],

  props: {
    title: { type: String, default: '' }
  },
  data () {
    return {
      printDeliveries: false,
      showActionsLabel: true,
      isPrintDisabled: false,
      loading: false,
      drawerInfo: false,
      checkBoxClicked: false,
      rowClicked: false,
      showActions: false,
      item: null,
      tab: null,
      deliveriesPrint: [],
      summariesRes: {},
      summariesLoading: false,
      options: {},
      dialog: false,
      selected: [],
      selectAll: false,
      associatedTo: null,
      items: [],
      totalItems: 1000,
      itemsSelectedList: [],
      delivery: {},
      deliveryData: {},
      filter: {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        }
      },
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
        take: 100
      },
      showPagination: false,
      tags: [],
      formNames: {
        '/distribution-points/coordinator/delivery': 'distributionPointDeliveryData'
        // '/coordinator/logs': 'logsData'
      },
      formName: 'distributionPointDeliveryData',
      bottom: false,
      printDriverDeliveries: false,
      printList: [],
      driverPrintList: null,
      printListHeaders: [
        { text: 'ברקוד', align: 'center', value: 'barcode' },
        { text: 'שם לקוח', align: 'center', value: 'customer_name' },
        { text: 'סוג משלוח', align: 'center', value: 'delivery_type' },
        { text: 'שם נמען', value: 'target_name' },
        { text: 'כתובת נמען', align: 'center', value: 'target_address' },
        { text: 'סכום גוביינא', align: 'center', value: 'govaina_amount' },
        { text: 'הערות משלוח', sortable: false, align: 'center', value: 'comments' }
      ]
    }
  },
  computed: {
    ...mapGetters('auth', ['customer', 'branchSelected']),
    ...mapState('global', [
      'delivery_types',
      'customers',
      'driver',
      'driversSelected',
      'drivers',
      'lines',
      'tagList',
      'delivery_type_statuses',
      'distribution_points',
      'footerProps'
    ]),
    ...mapState('auth', ['authUser']),

    actions () {
      // const arr = { name: 'סמן כבוטל', key: 'cancelDelivery' }
      // for (const delivery of this.itemsSelectedList) {
      //   if (delivery && delivery.status && delivery.status.key === 'done') {
      //     return []
      //   }
      // }
      // return arr
      return []
    },
    headers () {
      const arr = [
        { text: 'שם נקודת חלוקה', align: 'right', value: 'distribution_point.name' },
        { text: 'עיר', align: 'right', value: 'address.correct_short_city_name' },
        { text: 'כתובת', align: 'right', value: 'address.correct_short_street_name' },
        { text: 'מספר שק', align: 'right', value: 'distributionPointBag.bag_number' },
        { text: 'שם לקוח', align: 'right', value: 'customer.name' },
        // { text: 'סוג', align: 'center', value: 'delivery_type.value' },
        // { text: 'קו', align: 'center', value: 'line.name' },
        // { text: 'פוליגון', align: 'center', value: 'polygon.name' },
        { text: 'תאריך שידור', align: 'center', value: 'created_at' },
        { text: 'סטטוס', sortable: false, align: 'center', value: 'status' },
        { text: 'שם נמען', align: 'center', value: 'target_name' },
        { text: 'טלפון נמען', sortable: false, align: 'center', value: 'target_phone' },
        { text: 'מוסר שק', align: 'center', value: 'divisor_driver' },
        // { text: 'מספר שק פיזורים', align: 'center', value: '' },
        { text: 'תאריך הגעה לנקודת חלוקה', align: 'center', value: 'collected_date' },
        { text: 'תאריך מסירה', align: 'center', value: 'delivered_date' }
      ]

      if (this.driversSelected && this.driversSelected.length > 0) {
        arr.unshift({ text: 'סידור', align: 'center', value: 'position' })
      }
      return arr
    },
    deliveryTypesItems () {
      const arr = []
      let list = arr.concat(this.delivery_types)
      list = list.map(type => ({
        id: type.id,
        name: type.value,
        key: type.name
      }))
      return list
    },
    tabs () {
      let tabs = [
        { title: 'משלוח', to: { name: `${this.$route.matched[0].name}-delivery` }, mode: 'create_edit' }
      ]
      if (this.delivery && this.delivery.uuid) {
        tabs.push({ title: 'לוג משלוח', to: { name: `${this.$route.matched[0].name}-logs` }, mode: 'create' })
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
      return this.computeObject('delivery', 'customer')
    },
    divisorDriverFields () {
      return this.computeObject('delivery', 'divisor_driver')
    },
    bringBackDriverFields () {
      return this.computeObject('delivery', 'bring_back_driver')
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
        { key: 'accepted', title: 'ממתין לאיסוף', value: this.summariesRes.accepted || 0 },
        { key: 'collected', title: 'נאסף', value: this.summariesRes.collected || 0 },
        { key: 'stored', title: 'נקלט ממיינת', value: this.summariesRes.stored || 0 },
        { key: 'in_distribution_bag', title: 'בשק פיזורים', value: this.summariesRes.in_distribution_bag || 0 },
        { key: 'distribution_bag_on_the_way', title: 'שק בדרך לנקודת חלוקה', value: this.summariesRes.distribution_bag_on_the_way || 0 },
        { key: 'in_dist_point_waiting_for_receiver', title: 'בנקודת חלוקה ממתין לנמען', value: this.summariesRes.in_dist_point_waiting_for_receiver || 0 },
        { key: 'returning_to_storage', title: 'חוזר לשולח', value: this.summariesRes.returning_to_storage || 0 },
        { key: 'upgraded_to_delivery', title: 'שודרג למשלוח', value: this.summariesRes.upgraded_to_delivery || 0 },
        { key: 'in_dist_point_waiting_for_scan', title: 'בנקודת חלוקה ממתין לסריקה', value: this.summariesRes.in_dist_point_waiting_for_scan || 0 },
        { key: 'done', title: 'בוצע', value: this.summariesRes.done || 0 },
        { key: 'error', title: 'נכשל', value: this.summariesRes.error || 0 }
      ]
    }
  },
  watch: {
    itemsSelectedList (newValue) {
      this.deliveriesPrint = newValue?.map(item => ({
        id: item.id,
        delivery_type_value: item.delivery_type?.value,
        delivery_type_key: item.delivery_type?.name,
        distribution_point: item.distribution_point.name,
        target_name: item.target_name,
        target_address: item.address,
        target_city: item.address?.correct_long_city_name,
        target_street: item.address?.correct_short_street_name,
        target_street_number: item.address?.correct_street_number,
        target_phone: item.target_phone,
        comments: item.comments,
        created_at: item.created_at,
        barcode: item.barcode,
        line: item.line,
        customer_name: item.customer?.name
      }))
      if (newValue.length > 0) {
        this.showActions = true
      } else {
        this.showActions = false
      }
    },

    // items (newItems) {
    //   this.distribution_points = newItems.map(item => item.distribution_point)
    // },
    options: {
      async handler (newOptions, oldOptions) {
        try {
          if (Object.keys(oldOptions)?.length < 1) {
            return
          }
          this.pagination = {
            skip: (newOptions.page - 1) * newOptions.itemsPerPage,
            take: newOptions.itemsPerPage
          }
          const { sortBy, sortDesc } = this.options
          await this.getDeliveryViews()
          this.items = this.items.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'delivery_type' :
                sortA = a[sortBy[0]].value
                sortB = b[sortBy[0]].value
                break
              case 'customer.pickup_address.correct_long_city_name' :
                sortA = a.customer.pickup_address && a.customer.pickup_address.correct_long_city_name
                sortB = b.customer.pickup_address && b.customer.pickup_address.correct_long_city_name
                break
              case 'customer.pickup_address' :
                sortA = a.customer.pickup_address && a.customer.pickup_address.correct_long_street_name
                sortB = b.customer.pickup_address && b.customer.pickup_address.correct_long_street_name
                break
              case 'target_address.correct_long_city_name' :
                sortA = a.target_address && a.target_address.correct_long_city_name
                sortB = b.target_address && b.target_address.correct_long_city_name
                break
              case 'target_address' :
                sortA = a.target_address && a.target_address.correct_long_street_name
                sortB = b.target_address && b.target_address.correct_long_street_name
                break
              case 'divisor_driver' :
                sortA = a.divisor_driver && a.divisor_driver.first_name
                sortB = b.divisor_driver && b.divisor_driver.first_name
                break
              case 'pickup_driver' :
                sortA = a.pickup_driver && a.pickup_driver.first_name
                sortB = b.pickup_driver && b.pickup_driver.first_name
                break
              case 'line.name' :
                sortA = a.line && a.line.name
                sortB = b.line && b.line.name
                break
              case 'polygon.name' :
                sortA = a.polygon && a.polygon.name
                sortB = b.polygon && b.polygon.name
                break
              case 'customer.name' :
                sortA = a.customer && a.customer.name
                sortB = b.customer && b.customer.name
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
    value: {
      handler (newFilter) {
        this.$emit('input', newFilter)
      },
      deep: true
    },
    async $route (newRoute, oldRoute) {
      try {
        if (newRoute.name === 'distribution-points-coordinator') {
          this.delivery = {}
          this.tags = []
          this.pagination.skip = 0
          this.pagination.take = 100
          await this.filterHelper()
          await this.$store.dispatch('global/getTagsList')
        }
      } catch (e) {
        console.log('route watch error', e)
      }
    },
    selectAll (newSelectAll) {
      this.selected = newSelectAll ? this.items.map((item, index) => index) : []
    },
    driversSelected () {
      return this.filterHelper()
    },
    branchSelected () {
      return this.filterHelper()
    }
  },
  created () {
    this.$store.dispatch('global/getDeliveryTypes')
    this.$store.dispatch('global/getTagsList')
    this.$store.dispatch('global/getAllLines')
    this.$store.dispatch('global/getCustomerList')
    this.$store.dispatch('global/getDeliveryTypeStatuses', { delivery_type_status_key: 'distribution_point' })
    this.$store.dispatch('global/getDistributionPoints')
    return this.filterHelper()
  },
  mounted () {
    // socket.on('updateStatus', res => {
    //   console.log('updateStatus', res)
    //   this.updateStatus(res.delivery_uid, res.status)
    // })
  },
  methods: {
    onFilter () {
      return this.filterHelper()
    },
    computeObject (prop, propKey) {
      const obj = {}
      if (this[prop] && !this[prop][propKey]) {
        obj.customer = {
          name: null,
          address: null
        }
      } else {
        return this[prop][propKey]
      }
      return obj
    },
    async getDeliveryViews () {
      try {
        this.loading = true
        const resp = await this.$distributionDeliveriesPointsService.viewTBoxes({
          ...this.pagination,
          filter: this.filter,
          byDriverIds: this.driversSelected,
          branch_id: this.branchSelected
        })
        this.items = resp.items
        this.totalItems = resp.total
        this.showPagination = this.items && this.items.length < 100
        this.loading = false
      } catch (e) {
        this.loading = false
        console.log('getDeliveryViews error', e)
      }
    },
    async getSummaries () {
      try {
        this.summariesLoading = true
        this.summariesRes = await this.$distributionDeliveriesPointsService.getSummaries({
          ...this.pagination,
          byDriverIds: this.driversSelected,
          filter: this.filter,
          branch_id: this.branchSelected
        })
        this.summariesLoading = false
      } catch (e) {
        this.$helper.snackbar(e, 'getSummaries')
      }
    },
    filterHelper () {
      return Promise.all([this.getDeliveryViews(), this.getSummaries()])
    },
    clearFilterInputs () {
      this.filter = {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        }
      }
      return this.onFilter()
    },
    multiPrint () {
      console.log('this.authUser.print_type', this.authUser?.print_type)
      console.log('this.deliveriesPrint.length', this.deliveriesPrint.length)
      if (this.deliveriesPrint.length === 0) {
        return this.$store.commit('setSnackbar', { value: true, message: 'print is empty', error: true })
      }
      this.printDeliveries = true
      if (this.authUser.print_type === 'A4') {
        this.$nuxt.$emit('stickersUi')
      } else if (this.authUser.print_type === 'Sticker') {
        this.$nuxt.$emit('stickerUi')
      }
    },
    getFullName (item) {
      return `${item.first_name} ${item.last_name}`
    },
    selectAction (action) {
      switch (action) {
        case 'cancelDelivery' :
          this.cancelDelivery = true
          this.dialog = true
          this.showActionsLabel = false
          break
      }
    },
    async cancelDeliveries () {
      try {
        console.log('cancelDeliveries', this.itemsSelectedList)
        const deliveriesIds = this.itemsSelectedList?.map(delivery => delivery.id)
        await this.$distributionDeliveriesPointsService.updateStatus({
          deliveries_ids: deliveriesIds, delivery_type_status_key: 'cancelled'
        })
        this.dialog = false
        return this.getDeliveryViews()
      } catch (e) {
        this.$helper.snackbar(e, 'cancelDeliveries')
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
      Object.keys(this.form).forEach(key => this.form[key] = item[key])
      this.delivery = item

      this.tags = this.delivery.tags
      if (this.$route.name.includes('delivery')) {
        return
      }
      this.$router.push({ name: `${this.$route.name}-delivery` })
      this.$store.commit('setDrawerUi', true)
    },
    removeTag (item) {
      this.tags && this.tags.splice(this.tags.indexOf(item), 1)
      this.form.tags = [...this.tags]
    },
    onsubmit (item) { // every component call different function
      this.loading = true
      const formName = this.formNames[this.tab]
      this.$nuxt.$emit('formSubmit', formName) // submit to function from child comp
      this.loading = false
    },
    openPreviewPrintSticker () {
      this.printDeliveries = true
      this.$nuxt.$emit('stickerUi')
    },
    getTypeName (type) {
      let deliveryType = null
      const names = {
        regular: 'רגיל',
        dual: 'כפול',
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
    getDeliveryStatusValue (delivery) {
      let statusValue = null
      if (delivery.status && delivery.status.key === 'enter_to') {
        statusValue = (delivery.status_data.enter_to_branch && delivery.status.name + delivery.status_data.enter_to_branch) || delivery.status.name
      } else if (delivery.status && delivery.status.key === 'exit_to') {
        statusValue = (delivery.status_data.exit_to_branch && delivery.status.name + delivery.status_data.exit_to_branch) || delivery.status.name
      } else {
        statusValue = delivery.status && delivery.status.name
      }
      return statusValue
    },
    getAddressValue (addressObj) {
      let addressVal = ''
      addressObj.correct_long_street_name && (addressVal += `${addressObj.correct_long_street_name} `)
      addressObj.correct_street_number && (addressVal += `${addressObj.correct_street_number}`)
      return addressVal
    },
    async onPrintDriverDeliveries () {
      const res = await this.$deliveryService.viewByDriverId({ byDriverIds: this.driversSelected })
      this.printList = res && res.deliveries
      this.driverPrintList = res && res.driver
      this.printDriverDeliveries = true
      setTimeout(() => window.print(), 0)
    },

    async isPrinted () {
      try {
        this.printDeliveries = false
        const deliveriesChunks = this.deliveriesPrint.reduce((resultArray, item, index) => {
          const chunkIndex = Math.floor(index / 100)

          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
          }

          resultArray[chunkIndex].push(item.uuid)
          return resultArray
        }, [])

        for (const deliveries of deliveriesChunks) {
          await this.$deliveryService.printed({ deliveries })
          // location.reload()
        }
      } catch (e) {
        console.log('isPrinted error', e)
      }
    }
  },
  head: { title: 'רכז TA-BOX' }
}
</script>

<style lang="scss" scoped>
.drawer-top-info {
  margin-top: 10px;
  color: #FA562A;
}
.v-input__slot{
  background: unset;
}

.mainBody {
  padding-right: 0 !important;
}

.info-panel-coordinator {
  padding-right: 20px;
  background-color: white;
  ::v-deep {
    .widgets {
      .coordinator-widget  {
        width: 40px !important;
        height: 100px;
        h3 {
          font-size: 13px !important;
        }
        p {
          font-size: 25px;
          position: absolute;
          margin: 3% 3.5% !important;
        }
        &:nth-child(10) {
          border-radius: 0 8px 8px 0;
          margin-left: 0px;
          p {
            color: #39C087 !important;
          }
        }

        &:last-child {
          border-radius: 8px 0 0 8px;
          margin-right: 0px;
          p {
            color: #FA562A;
          }
        }
      }
    }
  }
}

.selectDriver{
  width: 14em;
  height: 2em;
  display: flex;
  margin-right: 1em;

  .autoCompleteDriver {
    margin-top: -4px !important;
  }
  .saveSelectDriver {
    margin-top: 8px !important;
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
    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}

.d-print-none {
  margin-bottom: 0;
}

.rotate-arrow{
  display: flex;
  justify-content: center;
  padding-bottom: 3rem;
  .left-side {
    transform: scaleX(-1);
    //margin-left: 1rem;
  }
  .right-side {
    transform: scaleX(1);
  }
}
.direction-icon {
  margin-top: 1vh;
}
.spinner {
  position: absolute;
  margin-top: 80px;
}

.coordinator-body {
  background-color: #F8F8FD;
  .btns-coordinator{
    margin: -5px 7px 0px 0;
  }
  .btn-primary{
    margin: 0 0 0 12px!important;
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

.table-th-green{
  background-color: #fff4f1;
}
</style>
