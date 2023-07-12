<template>
  <div class="coordinator">
    <SectionLayout :title="'רשימת TA-BOX'" :class="['d-print-none', 'mainBody']" >
      <template class="d-print-none" #header>
        <CardDriver v-show="driversSelected && driversSelected.length > 0" :selected-array="driversSelectedArray" />
<!--        <DateFilter v-model="datesFilter" :loading="loading" />-->
      </template>
      <DrawerUi v-model="tab" :tabs="tabs" class="d-print-none">
        <template v-if="$hasPermission('distribution-points-list', 'edit')" #header>
          <v-btn class="btn-primary" :loading="loading" @click.prevent="onsubmit">
            שמירה
          </v-btn>
        </template>

        <n-child :distribution-point="distributionPoint"/>
      </DrawerUi>
      <div class="coordinator-body">
        <FilterUi
          v-model="filter"
          show-reset
          show-distribution-point-cities
          :distribution-point-cities="distribution_point_cities"
          :clear-filter-inputs="clearFilterInputs"
          show-search
          :on-drivers-selected="driversSelected && driversSelected.length > 0"
          @submit="onFilter"/>
        <div :class="['col-2', 'btns-coordinator']">
          <v-btn class="btn-primary" @click="onFilter">
            מיין תוצאות
          </v-btn>
          <ExportReport
            report-type="distributionPointsList"
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
        </div>
        <small v-if="showActions" class="deliveries-checked-amount">{{ `מספר נקודות החלוקה שסומנו: ${deliveriesPrint && deliveriesPrint.length}` }}</small>
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
              loading-text="טוען נקודות חלוקה, אנא המתן..."
              :footer-props="footerProps"
              @click:row="showInfo">
              <template v-slot:no-data>
                <p v-text="'אין מידע.'"/>
              </template>

              <template v-slot:item.active="{ item }">
                <StatusesUi
                  :status-value="item && item.active && 'פעיל' || 'לא פעיל'"
                  :status-key="item && item.active"/>
              </template>

              <template v-slot:item.city="{ item }">
                {{ item.address.correct_long_city_name }}
              </template>

              <template v-slot:item.address="{ item }">
                {{ item.address && getAddressValue(item.address) }}
              </template>

              <template v-slot:item.line="{ item }">
                {{ item.line && item.line.name }}
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
              <v-card-text>האם אתה בטוח שברצונך להסיר את נקודת החלוקה שסומנה?</v-card-text>
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
                  @click="deleteSelectedDistPoints">
                  בצע
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

        </CardUi>
      </div>
    </SectionLayout>

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
import socket from '../../plugins/socket.io'

export default {
  name: 'DistributionPointsList',
  middleware: ['permissions'],

  props: {
    title: { type: String, default: '' }
  },

  data () {
    return {
      showActionsLabel: true,
      isPrintDisabled: false,
      enter: 'animate__animated animate__faster animate__slideInLeft',
      loading: false,
      leave: 'animate__animated animate__faster animate__slideOutLeft',
      drawerInfo: false,
      rowClicked: false,
      showActions: false,
      item: null,
      tab: null,
      page: 'delivery',

      deliveriesPrint: [],

      summariesRes: {},
      options: {},
      dialog: false,
      selected: [],
      selectAll: false,
      associatedTo: null,
      items: [],
      totalItems: 1000,
      itemsSelectedList: [],
      delivery: {},
      distributionPoint: null,
      deliveryData: {},
      filter: {},
      datesFilter: null,
      actions: [
        { name: 'מחיקת נקודת חלוקה', key: 'deleteDistPoint' }
      ],
      cancelDelivery: false,
      cancelDriver: false,
      pagination: {
        skip: 0,
        take: 100
      },
      showPagination: false,
      tags: [],
      formNames: {
        '/distribution-points/list/distribution-point': 'distributionPointsData',
        '/distribution-points/list/users': 'distributionPointUsers',
        '/distribution-points/list/pricing': 'distributionPointPricing'
      },
      formName: 'distributionPointsData',
      bottom: false,
      filterValue: false,
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
    ...mapGetters('auth', ['customer', 'branchSelected', 'authUser']),
    ...mapState('global', [
      'delivery_types',
      'driversSelected',
      'lines',
      'delivery_type_statuses',
      'customers',
      'drivers',
      'distribution_point_cities',
      'footerProps'
    ]),
    headers () {
      const arr = [
        { text: 'שם נקודה', align: 'right', value: 'name' },
        { text: 'סטאטוס', align: 'center', value: 'active' },
        { text: 'קו', align: 'right', value: 'line' },
        { text: 'עיר', align: 'center', value: 'city' },
        { text: 'כתובת', align: 'center', value: 'address' },
        { text: 'מספר נקודה', align: 'center', value: 'point_number' },
        { text: 'שם איש קשר', align: 'center', value: 'contact_name' },
        { text: 'טלפון איש קשר', align: 'center', value: 'phone' }
        // { text: 'סטטוס', sortable: false, align: 'center', value: 'status' }
      ]
      return arr
    },

    tabs () {
      console.log('this.$route.matched tabs', this.$route.matched)
      const tabsResult = []
      if (this.distributionPoint?.uuid) {
        tabsResult.push(...[
          { title: 'כללי', to: { name: `${this.$route.matched[0].name}-distribution-point` }, mode: 'create_edit' },
          { title: 'משתמשים', to: { name: `${this.$route.matched[0].name}-users` }, mode: 'create_edit' },
          { title: 'מחירון', to: { name: `${this.$route.matched[0].name}-pricing` }, mode: 'create_edit' }
        ])
      } else {
        tabsResult.push({ title: 'יצירת נקודת חלוקה', to: { name: `${this.$route.matched[0].name}-distribution-point` }, mode: 'create_edit' })
      }
      return tabsResult
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
    // widgetsSummaries () {
    //   return [
    //     { key: 'accepted', title: 'ממתין לאיסוף', value: this.summariesRes.accepted || 0 },
    //     { key: 'collected', title: 'נאסף', value: this.summariesRes.collected || 0 },
    //     { key: 'stored', title: 'נקלט במחסן', value: this.summariesRes.stored || 0 },
    //     { key: 'on_target_way', title: 'בדרך למסירה', value: this.summariesRes.on_target_way || 0 },
    //     { key: 'done', title: 'בוצע', value: this.summariesRes.done || 0 },
    //     { key: 'error', title: 'נכשל', value: this.summariesRes.error || 0 }
    //   ]
    // }
  },
  watch: {
    deliveriesPrint (newValue) {
      this.itemsSelectedList = []
      newValue.forEach(item => {
        this.itemsSelectedList.push(item.id)
      })
      if (newValue.length > 0) {
        this.showActions = true
      } else {
        this.showActions = false
      }
    },

    options: {
      async handler (newOptions) {
        try {
          const { sortBy, sortDesc } = this.options
          await this.getDistPoints({ skip: (newOptions.page - 1) * newOptions.itemsPerPage, take: newOptions.itemsPerPage }).then(() => {
            if (sortBy.length === 1 && sortDesc.length === 1) {
              console.log(this.items, 'this.items')
              this.items = this.items.sort((a, b) => {
                let sortA
                let sortB
                console.log('sortBy[0]', sortBy[0])
                switch (sortBy[0]) {
                  case 'name' :
                    sortA = a.name
                    sortB = b.name
                    break
                  case 'active' :
                    sortA = a.active
                    sortB = b.active
                    break
                  case 'line' :
                    sortA = a.line.name
                    sortB = b.line.name
                    break
                  case 'city' :
                    sortA = a.address.correct_long_city_name
                    sortB = b.address.correct_long_city_name
                    break
                  case 'address' :
                    sortA = a.address.correct_long_street_name
                    sortB = b.address.correct_long_street_name
                    break
                  case 'point_number' :
                    sortA = a.point_number
                    sortB = b.point_number
                    break
                  case 'contact_name' :
                    sortA = a.contact_name
                    sortB = b.contact_name
                    break
                  case 'phone' :
                    sortA = a.phone
                    sortB = b.phone
                    break
                }

                if (sortDesc[0]) {
                  return sortA < sortB ? 1 : sortA > sortB ? -1 : 0
                } else {
                  return sortA < sortB ? -1 : sortA > sortB ? 1 : 0
                }
              })
            }
          })
        } catch (e) {
          console.log('options error', e)
          const errorMsg = e?.response?.data?.message
          this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
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
      console.log('this.$route', this.$route)
      if (this.$route.name === 'distribution-points-list') {
        this.distributionPoint = {}
        this.pagination.skip = 0
        this.pagination.take = 100
        Object.assign(this.filter, { datesFilter: this.datesFilter })
        await this.getDistributionPoints()
      }
    },

    selectAll (newSelectAll) {
      this.selected = newSelectAll ? this.items.map((item, index) => index) : []
    },
    datesFilter: {
      handler () {
        this.filterHelper({
          ...this.pagination,
          filter: this.filter,
          branch_id: this.branchSelected
        })
      },
      deep: true
    },
    driversSelected () {
      this.filterHelper({
        ...this.pagination,
        byDriverIds: this.driversSelected,
        filter: this.filter,
        branch_id: this.branchSelected
      })
    },

    branchSelected () {
      this.filterHelper({
        ...this.pagination,
        byDriverIds: this.driversSelected,
        filter: this.filter,
        branch_id: this.branchSelected
      })
    }
  },
  async created () {
    try {
      Object.assign(this.filter, { datesFilter: this.datesFilter })
      await this.$store.dispatch('global/getDeliveryTypes')
      await this.$store.dispatch('global/getCustomerList')
      await this.$store.dispatch('global/getDeliveryTypeStatuses')
      await this.$store.dispatch('global/getDistributionPointCities')
    } catch (e) {
      console.log('created error', e)
      const errorMsg = e?.response?.data?.message
      this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
    }
  },
  methods: {
    async onFilter () {
      try {
        this.loading = true
        Object.keys(this.filter).forEach(key => this.filter[key] ? this.filterValue = true : this.filterValue = false)
        this.pagination.skip = 0
        this.pagination.take = 100
        Object.assign(this.filter, { datesFilter: this.datesFilter })
        await this.getDistributionPoints()
        this.loading = false
      } catch (e) {
        console.log('onFilter error', e)
        const errorMsg = e?.response?.data?.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
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
    async getDistributionPoints () {
      const resp = await this.$distributionPointsService.postDistributionPoints({
        ...this.pagination,
        filter: this.filter,
        branch_id: this.branchSelected
      })
      this.items = resp.items
      this.totalItems = resp.total
      this.showPagination = this.items && this.items.length < 100
    },
    async filterHelper () {
      this.loading = true
      this.pagination.skip = 0
      this.pagination.take = 100
      Object.assign(this.filter, { datesFilter: this.datesFilter })

      const resp = await this.$distributionPointsService.postDistributionPoints({
        ...this.pagination,
        filter: this.filter,
        branch_id: this.branchSelected
      })
      this.items = resp.items
      this.totalItems = resp.total
      this.showPagination = this.items.length < 100
      this.loading = false
    },
    async getDistPoints ({ skip, take }) {
      this.loading = true

      const resp = await this.$distributionPointsService.postDistributionPoints({
        skip,
        take,
        filter: this.filter,
        branch_id: this.branchSelected,
        byDriverIds: this.driversSelected
      })

      this.items = resp.items
      this.loading = false
      this.totalItems = resp.total
      this.showPagination = this.items && this.items.length < take.itemsPerPage
    },
    clearFilterInputs () {
      this.filter = {}
      return this.onFilter()
    },
    multiPrint () {
      if (this.deliveriesPrint.length) {
        this.$nuxt.$emit('stickersUi')
      } else {
        this.$store.commit('setSnackbar', { value: true, message: 'print is empty', error: true })
      }
    },
    getFullName (item) {
      return `${item.first_name} ${item.last_name}`
    },
    selectAction (action) {
      switch (action) {
        case 'deleteDistPoint' :
          this.cancelDelivery = true
          this.dialog = true
          this.showActionsLabel = false
          break
      }
    },
    async deleteSelectedDistPoints () {
      try {
        console.log('this.itemsSelectedList', this.itemsSelectedList)
        const data = { distPointsIds: this.itemsSelectedList }
        await this.$distributionPointsService.deleteDistributionPoint(data)
        this.dialog = false
        this.showActions = false
        this.pagination.skip = 0
        this.pagination.take = 100

        await this.getDistributionPoints()
      } catch (e) {
        const errorMsg = e?.response?.data?.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    },
    showInfo (item) {
      this.distributionPoint = item
      this.$router.push({ name: `${this.$route.name}-distribution-point` })
      this.$store.commit('setDrawerUi', true)
    },
    onsubmit (item) { // every component call different function
      this.loading = true
      const formName = this.formNames[this.tab]
      console.log('formName', formName)
      this.$nuxt.$emit('pricingSubmit')
      this.$nuxt.$emit('formSubmit', formName)
      this.loading = false
    },
    openPreviewPrintSticker () {
      this.$nuxt.$emit('stickerUi')
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
    }
  },
  head: { title: 'רשימת TA-BOX' }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .export-btn .col-2 {
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
  .btns-coordinator{
    margin: -25px 7px 0px 0;
  }
  background-color: #F8F8FD;
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
