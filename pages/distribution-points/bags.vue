<template>
  <div class="coordinator">
    <SectionLayout :title="'ניהול שק פיזורים'" :class="['d-print-none', 'mainBody']" >
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
        :title=" distPointBagNumber ? `מספר שק פיזורים ${distPointBagNumber}` : null"
        class="d-print-none"
        :tabs="tabs">
        <template v-if="$hasPermission('distribution-points', 'edit')" #header>
          <v-btn class="btn-primary" @click.prevent="printListOfBag">
            הדפס טופס
          </v-btn>
          <v-btn
            :disabled="bag && bag.is_blocked"
            class="btn-primary d-print-none"
            @click.prevent="blockBag">
            נעילת שק
          </v-btn>
          <v-btn :loading="loading" class="btn-primary" @click.prevent="onsubmit">
            שמירה
          </v-btn>
        </template>

        <n-child
          :bag-number="distPointBagNumber"
          :bag="bag"
          :distribution-points="distribution_points" />
      </DrawerUi>

      <InfoPanel
        v-model="filter.delivery_type_status_key"
        :class="['d-print-none','info-panel-coordinator']"
        :delivery-info="deliveryData"
        show-clear-button
        widget-clickable
        :widgets="widgetsSummaries"
        :widgets-loading="summariesLoading"/>
      <div class="coordinator-body">
        <FilterUi
          v-model="filter"
          show-reset
          show-distribution-point-cities
          :distribution-point-cities="distribution_point_cities"
          show-bag-status
          :bag-statuses="bagStatusDictionary"
          show-distribution-points
          :distribution-points="distribution_points"
          :clear-filter-inputs="clearFilterInputs"
          show-search
          :on-drivers-selected="driversSelected && driversSelected.length > 0"
          @submit="filterHelper"/>
        <div :class="['col-2', 'btns-coordinator']">
          <v-btn class="btn-primary" @click="filterHelper">
            מיין תוצאות
          </v-btn>

          <ExportReport
            report-type="distributionPointBags"
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

          <div v-if="showActions && (associatedToDriver || cancelDriver)" class="choose-driver-coordinator">
            <v-autocomplete
              v-model="associatedTo"
              clearable
              dense
              filled
              outlined
              :items="drivers"
              :item-text="getFullName"
              item-value="id"
              :label="associatedTo===null ? 'בחר נהג' : ''" />
            <v-btn
              :disabled="associatedTo === null"
              class="btn-primary"
              style="margin: 0"
              @click.prevent="onSaveDriverSelected">
              שמירה
            </v-btn>
          </div>
        </div>
        <small
          v-if="deliveriesPrint.length>0"
          class="deliveries-checked-amount">
          {{ `מספר השקים שסומנו: ${deliveriesPrint && deliveriesPrint.length}` }}
        </small>

        <CardUi class="d-print-none text-center" overflow>
          <template #header>
          </template>
          <v-flex>
            <v-data-table
              v-model="deliveriesPrint"
              :headers="headers"
              :items="items"
              :server-items-length="totalItems"
              :options.sync="options"
              item-key="id"
              show-select
              class="elevation-1"
              :loading="loading"
              loading-text="טוען שקי פיזורים, אנא המתן..."
              :footer-props="footerProps"
              @click:row="showInfo">
              <template v-slot:no-data>
                <p v-text="'אין מידע.'"/>
              </template>

              <template v-slot:item.dist_point_address="{ item }">
                {{ item.dist_point && item.dist_point.address ? getAddressValue(item.dist_point.address) : null }}
              </template>

              <template v-slot:item.dist_point_city="{ item }">
                {{ item.dist_point && item.dist_point.address && item.dist_point.address.correct_long_city_name }}
              </template>

              <template v-slot:item.dist_point_line="{ item }">
                {{ item.dist_point && item.dist_point.line ? item.dist_point.line.name : null }}
              </template>

              <template v-slot:item.is_blocked="{ item }">
                {{ item.is_blocked ? 'נעול' : 'לא נעול' }}
              </template>

              <template v-slot:item.deliveries_length="{ item }">
                {{ item.dist_point && item.packages.length }}
              </template>

              <template v-slot:item.status="{ item }">
                <StatusesUi :status-value="item && getBagStatusValue(item.status)" :status-key="item.status" />
              </template>

              <template v-slot:item.divisor_driver="{ item }">
                <td
                  v-if="item.driver"
                  v-text="item.driver.first_name + ' ' + item.driver.last_name">
                <td v-else @click.stop="">
                  <v-btn
                    height="21px"
                    color="white"
                    @click.prevent="selectDriver(item)">
                    בחר נהג
                  </v-btn>
                </td>
              </template>

              <template v-slot:item.blocking_date="{ item }">
                {{ item.blocking_date | formatDate }}
              </template>

              <template v-slot:item.delivered_date="{ item }">
                {{ item.delivered_date | formatDate }}
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
                  בטל
                </v-btn>
                <v-btn
                  color="green darken-1"
                  text
                  @click="cancelBags">
                  בצע
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

        </CardUi>
      </div>
      <v-dialog
        v-model="openSelectDriver"
        persistent
        max-width="340"
        text-align="-webkit-center">
        <SectionLayout>
          <v-card-title class="headline">
            שיוך נהג למשימה
          </v-card-title>
          <v-autocomplete
            v-model="taskDriver"
            clearable
            :items="drivers"
            :item-text="(item) => `${item.first_name} ${item.last_name}`"
            item-value="id"
            label="נהג" />
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="green darken-1"
              text
              @click="openSelectDriver = false">
              בטל
            </v-btn>
            <v-btn
              color="green darken-1"
              text
              @click.prevent="associateToDriver">
              בצע
            </v-btn>
          </v-card-actions>
        </SectionLayout>
      </v-dialog>

    </SectionLayout>

    <PrintListUi
      v-if="printBagList"
      :customer-bag="bagDataToPrinter"
      :items="bagPrintList"
      :headers="bagPrintListHeaders"
      :title="'שק פיזורים'" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'

export default {
  name: 'DistributionPointsBags',
  props: {
    title: { type: String, default: '' }
  },

  data () {
    return {
      distPointBagNumber: null,
      printBagList: false,
      bagPrintList: [],
      bagDataToPrinter: null,
      bagPrintListHeaders: [
        { text: 'מספר משלוח', align: 'center', value: 'barcode' },
        { text: 'שם נמען', align: 'center', value: 'target_name' },
        { text: 'ברקוד', align: 'center', value: '_barcode' }
      ],
      bagStatusDictionary: {
        in_preparation: 'שק פיזורים בהכנה',
        ready_to_delivered: 'שק פיזורים מוכן לאיסוף',
        on_the_way: 'שק פיזורים בדרך לנקודה',
        done: 'שק פיזורים הגיע לנקודה'
      },
      showActionsLabel: true,
      isPrintDisabled: false,
      enter: 'animate__animated animate__faster animate__slideInLeft',
      loading: false,
      leave: 'animate__animated animate__faster animate__slideOutLeft',
      drawerInfo: false,
      checkBoxClicked: false,
      rowClicked: false,
      showActions: false,
      item: null,
      tab: null,
      page: 'delivery',

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
      bag: null,
      deliveryData: {},
      filter: {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        }
      },
      actions: [
        { name: 'שיוך לנהג', key: 'associatedTo' },
        { name: 'הורדה מנהג', key: 'cancelDriver' },
        { name: 'ביטול שקים', key: 'cancelDelivery' }
      ],
      associatedToDriver: false,
      cancelDelivery: false,
      cancelDriver: false,
      pagination: {
        skip: 0,
        take: 100
      },
      tags: [],
      formNames: {
        '/distribution-points/bags/scan-bag': 'ScanBag'
      },
      formName: 'deliveryData',
      bottom: false,
      printDriverDeliveries: false,
      printList: [],
      driverPrintList: null,
      bagIdSelected: null,
      taskDriver: null,
      openSelectDriver: false
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
      'distribution_point_cities',
      'footerProps'
    ]),
    ...mapState('auth', ['authUser']),

    headers () {
      const arr = [
        { text: 'מספר שק', align: 'right', value: 'bag_number' },
        { text: 'נקודת חלוקה', align: 'center', value: 'dist_point.name' },
        { text: 'עיר מסירה', align: 'center', value: 'dist_point_city' },
        { text: 'כתובת מסירה', align: 'center', value: 'dist_point_address' },
        { text: 'קו', align: 'center', value: 'dist_point_line' },
        { text: 'שם לקוח', align: 'center', value: 'dist_point.contact_name' },
        { text: 'כמות חבילות בשק', align: 'center', value: 'deliveries_length' },
        { text: 'תאריך נעילת שק', align: 'center', value: 'blocking_date' },
        { text: 'תאריך מסירת שק', align: 'center', value: 'delivered_date' },
        { text: 'סטטוס', sortable: false, align: 'center', value: 'status' },
        { text: 'נהג', align: 'center', value: 'divisor_driver' },
        { text: 'שק נעול', align: 'center', value: 'is_blocked' }
      ]
      return arr
    },
    deliveryTypesItems () {
      const arr = []
      let list = arr.concat(this.delivery_types)
      list = list.map(type => {
        return {
          id: type.id,
          name: type.value,
          key: type.name
        }
      })
      return list
      // return arr.concat(this.deliveryTypes)
    },

    tabs () {
      let tabs = [
        { title: 'משלוח', to: { name: `${this.$route.matched[0].name}-delivery` }, mode: 'create_edit' }
      ]
      if (this.delivery && this.delivery.uuid) {
        // this.$router.push({ name: `${this.$route.name}-logs` })
        tabs.push({ title: 'לוג משלוח', to: { name: `${this.$route.matched[0].name}-logs` }, mode: 'create' })
      }

      tabs = tabs.filter(tab => this.$hasPermission(tab.to.name))
      console.log('tabs', tabs)
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
        { key: 'in_preparation', title: 'שק פיזורים בהכנה', value: this.summariesRes.in_preparation || 0 },
        { key: 'ready_to_delivered', title: 'שק פיזורים מוכן לאיסוף', value: this.summariesRes.ready_to_delivered || 0 },
        { key: 'on_the_way', title: 'שק פיזורים בדרך לנקודה', value: this.summariesRes.on_the_way || 0 },
        { key: 'done', title: 'שק החזרות הגיע לנקודה', value: this.summariesRes.done || 0 }
      ]
    }
  },
  watch: {
    deliveriesPrint (newValue) {
      console.log('deliveriesPrint watch', newValue)
      this.itemsSelectedList = []
      newValue.forEach(item => {
        this.itemsSelectedList.push(item.id)
      })
      if (newValue.length > 0) {
        for (const bag of newValue) {
          if (bag && bag.status === 'done') {
            return this.showActions = false
          }
        }
        return this.showActions = true
      }
      return this.showActions = false
    },

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
          await this.getBags()
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
        this.$nuxt.$on('dist-point-bag-number', res => {
          this.distPointBagNumber = res
        })
        if (this.$route.name === 'distribution-points-bags') {
          this.distPointBagNumber = null
          this.bag = null
          this.tags = []
          this.pagination.skip = 0
          this.pagination.take = 100
          await this.getBags()
          // await this.$store.dispatch('global/getTagsList')
        }
      } catch (e) {
        console.log('$route error', e)
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
    this.$store.dispatch('global/getDeliveryTypeStatuses')
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
    getBagStatusValue (statusName, toHebrew = true) {
      if (toHebrew) {
        return this.bagStatusDictionary[statusName] || statusName
      }
      const statusKeys = Object.keys(this.bagStatusDictionary)
      return (statusKeys && statusKeys.find(status => status === statusName)) || statusName
    },
    async filterHelper () {
      try {
        await Promise.all([this.getBags(), this.getSummaries()])

        if (this.$route.params.delivery_id) {
          return this.showInfo({ delivery_id: this.$route.params.delivery_id })
        }
      } catch (e) {
        this.$helper.snackbar('filterHelper')
      }
    },
    async getSummaries () {
      try {
        this.summariesLoading = true
        this.summariesRes = await this.$distributionPointBagsService.getSummaries({
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
    async getBags () {
      try {
        this.loading = true
        const resp = await this.$distributionPointBagsService.viewBags({
          ...this.pagination,
          filter: this.filter,
          branch_id: this.branchSelected,
          byDriverIds: this.driversSelected
        })
        this.items = resp.items
        this.totalItems = resp.total
        this.loading = false
      } catch (e) {
        this.$helper.snackbar(e, 'getBags')
      }
    },
    clearFilterInputs () {
      this.filter = {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        }
      }
      return this.filterHelper()
    },
    async selectDriver (bag) {
      try {
        await this.$store.dispatch('global/getDriverList')
        console.log('select driver ', bag)
        this.openSelectDriver = true
        this.bagIdSelected = [bag.id]
        this.taskDriver = bag.driver?.id
      } catch (e) {
        this.$helper.snackbar(e, 'selectDriver')
      }
    },
    async associateToDriver () {
      try {
        console.log('this.associatedTo', this.associatedTo)
        console.log('this.itemsSelectedList', this.itemsSelectedList)
        const res = await this.$distributionPointBagsService.associateToDriver({
          driver_id: this.taskDriver,
          bags_ids: this.bagIdSelected,
          user_id: this.authUser.id
        })
        if (res?.status) {
          this.$store.commit('setSnackbar', { value: true, message: 'שיוך לנהג בוצע בהצלחה', success: true })
        }
        await this.getBags()
        this.openSelectDriver = false
      } catch (e) {
        this.$helper.snackbar(e, 'associateToDriver')
      }
    },
    getFullName (item) {
      return `${item.first_name} ${item.last_name}`
    },
    selectAction (action) {
      switch (action) {
        case 'associatedTo' :
          this.associatedToDriver = true
          this.cancelDriver = false
          this.cancelDelivery = false
          this.showActionsLabel = false
          break

        case 'cancelDelivery' :
          this.cancelDelivery = true
          this.dialog = true
          this.associatedToDriver = false
          this.cancelDriver = false
          this.showActionsLabel = false
          break

        case 'cancelDriver' :
          this.cancelDriver = true
          this.associatedToDriver = false
          this.cancelDelivery = false
          this.showActionsLabel = false
          break
      }
    },
    async onSaveDriverSelected () {
      try {
        this.taskDriver = this.associatedTo
        this.bagIdSelected = this.itemsSelectedList
        if (this.associatedToDriver && !this.cancelDriver) {
          await this.associateToDriver()
        } else if (this.cancelDriver && !this.associatedToDriver) {
          await this.onCancelDriver()
        }
        this.selected = []
        this.associatedTo = null
        this.itemsSelectedList = []
        this.cancelDriver = false
        this.associatedToDriver = false
        this.cancelDelivery = false
        this.showActions = false
        this.showActionsLabel = true
        this.deliveriesPrint = []
      } catch (e) {
        this.$helper.snackbar(e, 'onSaveDriverSelected')
      }
    },
    async associatedToNewDriver () {
      try {
        console.log('associatedToNewDriver', this.deliveriesPrint)
        const data = { driver_uid: this.associatedTo, deliveries: this.itemsSelectedList }
        const res = await this.$deliveryService.associateToDriver(data)
        if (res?.results?.code === 0) {
          this.$store.commit('setSnackbar', { value: true, message: 'association was performed successfully', success: true })
        }
        this.pagination.skip = 0
        this.pagination.take = 100
        await this.getBags()
      } catch (e) {
        this.$helper.snackbar(e, 'associatedToNewDriver')
      }
    },
    async onCancelDriver () {
      try {
        console.log('onCancelDriver')
        this.loading = true
        const data = {
          driver_id: this.associatedTo,
          bags: this.itemsSelectedList,
          user_id: this.authUser.id
        }
        const res = await this.$distributionPointBagsService.cancelOneDriver(data)
        if (res?.results?.code === 0) {
          this.$store.commit('setSnackbar', { value: true, message: 'driver cancellation was succeed', success: true })
        } else {
          this.$store.commit('setSnackbar', { value: true, message: res.results.description, error: true })
        }
        this.loading = false
        this.itemsSelectedList = []
        this.pagination.skip = 0
        this.pagination.take = 100
        await this.getBags()
      } catch (e) {
        this.$helper.snackbar(e, 'onCancelDriver')
        this.itemsSelectedList = []
      }
    },
    async cancelBags () {
      try {
        await this.$distributionPointBagsService.cancelMultipleBags({ bags: this.itemsSelectedList })
        this.dialog = false
        this.pagination.skip = 0
        this.pagination.take = 100

        const resp = await this.$distributionPointBagsService.viewBags({
          ...this.pagination,
          filter: this.filter,
          branch_id: this.branchSelected,
          byDriverIds: this.driversSelectedArray
        })
        this.items = resp.items
        this.totalItems = resp.total
      } catch (e) {
        console.log('cancelBags error', e)
        const errorMsg = e.response?.data?.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    },
    itemSelected (index) {
      this.checkBoxClicked = true
      if (!this.itemsSelectedList.includes(this.items[index].id)) {
        this.itemsSelectedList.push(this.items[index].id)
      } else {
        this.itemsSelectedList.splice(this.itemsSelectedList.indexOf(this.items[index].id), 1)
      }
      if (this.itemsSelectedList.length > 0) {
        this.showActions = true
      } else {
        this.associatedToDriver = false
        this.showActions = false
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
    async showInfo (item) {
      try {
        console.log('showInfo', item)
        if (item.delivery_id) {
          const bag = await this.$distributionPointBagsService.viewOne({ bag_id: item.delivery_id })
          this.bag = bag
          this.distPointBagNumber = bag?.bag_number
        } else {
          this.bag = item
          this.distPointBagNumber = item.bag_number
        }

        await this.$router.push({ name: 'distribution-points-bags-scan-bag' })
        this.$store.commit('setDrawerUi', true)
      } catch (e) {
        this.$helper.snackbar(e, 'showInfo')
      }
    },
    onsubmit (item) { // every component call different function
      this.$router.push({ name: this.$route.matched[0].name })
      this.$store.commit('setDrawerUi', false)
    },
    async printListOfBag () {
      try {
        this.deliveriesPrint = []
        const res = await this.$distributionPointBagsService.getBagList({ bag_id: this.bag.id })
        console.log(res, 'printListOfBag')
        this.printBagList = true
        this.bagPrintList = res?.deliveries
        this.bagDataToPrinter = res?.bag_data
        setTimeout(() => window.print(), 0)
      } catch (e) {
        this.$helper.snackbar(e, 'printListOfBag')
      }
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
    getAddressValue (addressObj) {
      let addressVal = ''
      addressObj.correct_long_street_name && (addressVal += `${addressObj.correct_long_street_name} `)
      addressObj.correct_street_number && (addressVal += `${addressObj.correct_street_number}`)
      return addressVal
    },
    async isPrinted () {
      try {
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
        console.log('isPrint error', e)
      }
    },
    async blockBag (item) {
      try {
        if (this.distPointBagNumber) {
          console.log('this.distPointBagNumber', this.distPointBagNumber)
          await this.$distributionPointBagsService.blockBag({
            bag_number: this.distPointBagNumber,
            user_id: this.authUser.id
          })
          this.$store.commit('setDrawerUi', false)
          await this.$router.push({ name: 'distribution-points-bags' })
          this.distPointBagNumber = null
        } else {
          this.$store.commit('setSnackbar', { value: true, message: 'יש לבחור נקודת חלוקה', error: true })
        }
      } catch (e) {
        const errorMsg = e.response && e.response.data && e.response.data.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    }
  },
  head: { title: 'ניהול שק פיזורים' }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .btns-coordinator .export-btn .col-2 {
    padding-right: 0 !important;
  }
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
}

.filter-ui{
  margin-bottom: .4rem;
  ::v-deep {
    & > .container > .row > .col-1 {
      padding-left: 0;
    }
    & > .container > .row > .col-11 {
      padding-right: 0;
    }
    .v-btn {
      width: 100%;
    }
    .v-input {
      margin-top: 0;
      padding-top: 0;

      .v-input__slot{
        margin-bottom: 0;
      }
      .v-text-field__details{
        display: none;
      }

      &.error--text{
        .v-input__slot{
          margin-bottom: 8px;
        }
        .v-text-field__details{
          display: flex;
        }
      }
    }
    .theme--light.v-select .v-select__selection--comma{
      color: #22272E;
    }
    .theme--light.v-label{
      color: #7C7C7C !important;
    }
    .v-text-field--enclosed .v-input__append-inner {
      margin-top: 10px;
      .v-icon {
        margin-right: 20px;
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
    margin: -25px 7px 0px 0;
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
    //.v-text-field--full-width .v-input__prepend-outer, .v-text-field--full-width .v-input__prepend-inner, .v-text-field--full-width .v-input__append-inner, .v-text-field--full-width .v-input__append-outer, .v-text-field--enclosed .v-input__prepend-outer, .v-text-field--enclosed .v-input__prepend-inner, .v-text-field--enclosed .v-input__append-inner, .v-text-field--enclosed .v-input__append-outer{
    //  margin-top: 7px !important;
    //  margin-left: -15px !important;
    //}

    .v-select__selection--comma {
      margin: -3px -1px 12px 0 !important;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: smaller !important;
    }
  }
}

.table-th-green{
  background-color: #fff4f1;
}
</style>
