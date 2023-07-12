<template>
  <SectionLayout title="רכז איסופים">
    <template #header>
      <CardDriver
        v-if="driversSelected && driversSelected.length > 0"
        :selected-array="driversSelectedArray" />
      <DateFilter
        v-if="!driversSelected || driversSelected.length === 0"
        v-model="filter.datesFilter" />
    </template>

    <DrawerUi
      v-model="tab"
      :tabs="tabs"
      show-delivery-details
      show-delivery-statuses>
      <template v-if="$hasPermission('quantitative-collection-coordinator', 'edit')" #header>
        <v-btn class="btn-primary" @click.prevent="onsubmit">
          שמירה
        </v-btn>
      </template>

      <template v-if="delivery.uuid" #aside>
        <TagsUi
          v-model="tags"
          :tag-list="tagList"
          :form="form"/>
      </template>
      <n-child
        :delivery="delivery"
        :form="form"
        :tags="tags"
        :delivery-types="delivery_types"
        :drivers="drivers"
        :submit-status.sync="submitStatus" />
    </DrawerUi>

    <InfoPanel
      v-model="filter.status"
      :delivery-info="delivery"
      show-clear-button
      widget-clickable
      :widgets="widgetsSummaries"
      show-delivery-info
      :widgets-loading="summariesLoading"/>

    <FilterUi
      v-model="filter"
      show-collection-task-status
      show-customer
      :customer-list="customers"
      :collection-task-statuses="collectionTaskStatuses"
      show-tags
      :tags="tagList"
      show-time-status
      :time-status-list="[]"
      show-search
      show-punctuality
      :punctuality="punctuality"
      show-collection-city
      :on-drivers-selected="driversSelected && driversSelected.length > 0"
      show-reset
      :clear-filter-inputs="clearFilterInputs"
      @submit="onFilter"/>

    <div class="action-section">
      <v-btn class="btn-primary" @click="onFilter">
        מיין תוצאות
      </v-btn>

      <ExportReport
        report-type="collectionTasks"
        :filter="filter"/>

      <v-select
        v-if="showActions"
        :key="vSelect"
        clearable
        rounded
        class="coordinatorActions"
        filled
        :items="actions"
        item-text="name"
        item-value="key"
        label="פעולות"
        @change="selectAction($event)"/>
    </div>
    <small
      v-if="collectionTasks.length > 0"
      class="deliveries-checked-amount">
      {{ `מספר המשימות שסומנו: ${collectionTasks && collectionTasks.length}` }}
    </small>
    <CardUi>
      <template #header>
      </template>
      <v-flex>
        <v-data-table
          v-model="collectionTasks"
          :headers="headers"
          :items="items"
          :server-items-length="totalItems"
          :options.sync="options"
          show-select
          item-key="id"
          class="elevation-1"
          :loading="loading"
          loading-text="טוען מידע, אנא המתן..."
          :footer-props="footerProps"
          @click:row="showInfo">
          <template v-slot:no-data>
            <p v-text="'אין מידע.'"/>
          </template>

          <template v-slot:item.pickup_driver="{ item }">
            {{ item.pickup_driver && `${item.pickup_driver.first_name} ${item.pickup_driver.last_name}` }}
          </template>

          <template v-slot:item.pick_up_date="{ item }">
            {{ item.pick_up_date | formatDate2 }}
          </template>

          <template v-slot:item.status="{ item }">
            <StatusesUi :status-value="translateStatus(item.status)" :status-key="item.status" />
          </template>

          <template v-slot:item.punctuality="{ item }">
            <StatusesUi :status-value="item.punctuality ? 'תקין' : 'מאחר'" :status-key="item.punctuality" />
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
          <v-card-text>האם אתה בטוח שברצונך למחוק את המשימות שסומנו?</v-card-text>
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
              @click="deleteTasks">
              בצע
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </CardUi>
  </SectionLayout>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'
import socket from '../../plugins/socket.io'

export default {
  name: 'QuantitativeCollectionCoordinator',
  middleware: ['permissions'],

  data () {
    return {
      vSelect: 1,
      collectionTaskStatuses: [
        { key: 'pickup_waiting', value: 'ממתין לאיסוף' },
        { key: 'on_the_way', value: 'בדרך ליעד' },
        { key: 'picked_up', value: 'נאסף' },
        { key: 'not_picked_up', value: 'לא נאסף' }
      ],
      collectionTasks: [],
      totalItems: 1000,
      options: {},
      loading: false,
      summariesRes: {
        on_the_way: 0,
        picked_up: 0,
        pickup_waiting: 0
      },
      summariesLoading: false,
      enter: 'animate__animated animate__faster animate__slideInLeft',
      leave: 'animate__animated animate__faster animate__slideOutLeft',
      drawerInfo: false,
      checkBoxClicked: false,
      rowClicked: false,
      tabs: [
        {
          title: 'משימת איסוף', to: { name: 'quantitative-collection-coordinator-delivery' }
        }
        // {
        //   title: 'לוג משלוח', to: { name: 'quantitative-collection-coordinator-logs' }
        // }
      ],
      item: null,
      tab: null,
      page: 'delivery',

      widgets: [
        { title: 'ממתין לאיסוף', value: 22 },
        { title: 'נאסף', value: 15 },
        { title: 'נקלט במחסן', value: 25 },
        { title: 'בדרך למסירה', value: 25 },
        { title: 'בוצע', value: 100 },
        { title: 'נכשל', value: 0 }
      ],
      headers: [
        { text: 'שם לקוח', align: 'center', value: 'customer.name' },
        { text: 'מספר משימה', align: 'center', value: 'task_number' },
        { text: 'נהג איסוף', align: 'center', value: 'pickup_driver' },
        { text: 'תאריך איסוף מיועד', align: 'center', value: 'pick_up_date' },
        { text: 'סטטוס', align: 'center', value: 'status' },
        { text: 'זמנים', align: 'center', value: 'punctuality' },
        { text: 'עיר', align: 'center', value: 'customer.pickup_address.correct_long_city_name' },
        { text: 'כתובת איסוף', align: 'center', value: 'customer.pickup_address.correct_long_street_name' },
        { text: 'כמות', align: 'center', value: 'customer.daily_pickup_quantity' }
      ],
      dialog: false,
      selected: [],
      selectAll: false,
      associatedTo: null,
      items: [],
      itemsSelectedList: [],
      unableToEdit: false,
      delivery: {},
      filter: {
        datesFilter: {
          fromDate: moment().format('YYYY-MM-DD'),
          untilDate: moment().format('YYYY-MM-DD')
        }
      },
      actions: [
        { name: 'מחיקת משימות', key: 'delete_tasks' }
      ],
      associatedToDriver: false,
      cancelDelivery: false,
      punctuality: [
        {
          key: 'true',
          text: 'תקין'
        }, {
          key: 'false',
          text: 'מאחר'
        }
      ],

      form: {
        comments: null,
        created_at: null,
        customer: null,
        customer_id: null,
        line: null,
        pick_up_date: null,
        pick_up_hours_time: null,
        pick_up_minutes_time: null,
        pickup_driver: null,
        pickup_driver_uid: null,
        polygon_line_id: null,
        punctuality: null,
        setting_id: null,
        status: null,
        uuid: null,
        task_number: null,
        tags: []
      },
      formNames: {
        '/quantitative-collection/coordinator/delivery': 'quantitativeDeliveryData',
        '/quantitative-collection/coordinator/logs': 'quantitativeLogsData'
      },
      formName: 'quantitativeDeliveryData',
      submitStatus: null,
      pagination: {
        skip: 0,
        take: 20
      },
      bottom: false,
      filterValue: false,
      tags: []
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    ...mapGetters('auth', ['customer']),
    ...mapState('global', [
      'delivery_types',
      'customers',
      'delivery_type_statuses',
      'driver',
      'driversSelected',
      'drivers',
      'tagList',
      'footerProps'
    ]),

    showActions () {
      return this.collectionTasks?.length > 0
    },
    driversUids () {
      return this.driversSelectedArray.map(driver => driver.uuid)
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
      if (this.driversSelected?.length > 0) {
        for (const driverId of this.driversSelected) {
          this.items.forEach(item => {
            if (item.driver_id === driverId) {
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
      this.drivers && this.drivers.forEach(item => {
        if (this.driversSelected?.length > 0 && this.driversSelected.includes(item.id)) {
          return items.push(item)
        }
      })
      return items
    },
    widgetsSummaries () {
      return [
        { key: 'pickup_waiting', title: 'ממתין לאיסוף', value: this.summariesRes.pickup_waiting || 0 },
        { key: 'picked_up', title: 'נאסף', value: this.summariesRes.picked_up || 0 },
        { key: 'on_the_way', title: 'בדרך לאיסוף', value: this.summariesRes.on_the_way || 0 }
      ]
    }
  },
  watch: {
    driversSelected (newVal) {
      return this.getCollectionTasksView()
    },
    options: {
      async handler (newOptions) {
        try {
          const { sortBy, sortDesc } = this.options
          if (sortBy.length < 1 || sortDesc.length < 1) {
            return
          }
          this.loading = true
          const response = await this.$collectionTasksService.viewTasks({
            skip: (newOptions.page - 1) * newOptions.itemsPerPage,
            take: newOptions.itemsPerPage,
            filter: this.filter,
            drivers_uid: this.driversUids
          })
          this.items = response?.tasks?.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'customer.name':
                sortA = a.customer?.name || 0
                sortB = b.customer?.name || 0
                break
              case 'task_number':
                sortA = a.task_number || 0
                sortB = b.task_number || 0
                break
              case 'pickup_driver':
                sortA = a.pickup_driver?.first_name?.charCodeAt(0) || 0
                sortB = b.pickup_driver?.first_name?.charCodeAt(0) || 0
                break
              case 'pick_up_date':
                sortA = a.pick_up_date || 0
                sortB = b.pick_up_date || 0
                break
              case 'status':
                sortA = a.status?.charCodeAt(0) || 0
                sortB = b.status?.charCodeAt(0) || 0
                break
              case 'punctuality':
                sortA = a.punctuality || 0
                sortB = b.punctuality || 0
                break
              case 'customer.pickup_address.correct_long_city_name':
                sortA = a.customer?.pickup_address?.correct_long_city_name?.charCodeAt(0) || 0
                sortB = b.customer?.pickup_address?.correct_long_city_name?.charCodeAt(0) || 0
                break
              case 'customer.pickup_address.correct_long_street_name':
                sortA = a.customer?.pickup_address?.correct_long_street_name?.charCodeAt(0) || 0
                sortB = b.customer?.pickup_address?.correct_long_street_name?.charCodeAt(0) || 0
                break
              case 'customer.daily_pickup_quantity':
                sortA = a.customer?.daily_pickup_quantity || 0
                sortB = b.customer?.daily_pickup_quantity || 0
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
          // this.items = res.tasks
          this.totalItems = response?.total
          this.loading = false
        } catch (e) {
          this.loading = false
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
    selectAll (newSelectAll) {
      this.selected = newSelectAll ? this.items.map((item, index) => index) : []
    },

    async submitStatus (newSubmitStatus) { // waiting for child response and then run a new request and close the drawer
      try {
        if (newSubmitStatus.status) {
          await this.getCollectionTasksView()
          this.$store.commit('setDrawerUi', false) // close drawer
          await this.$router.push({ name: 'quantitative-collection/coordinator' })
          this.delivery = {}
        }
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'submitStatus')
      }
    },
    async $route (newRoute, oldRoute) {
      try {
        if (!(newRoute?.name === 'quantitative-collection-coordinator')) {
          return
        }

        this.delivery = {}
        this.tags = []
        this.pagination.skip = 0
        this.pagination.take = 100

        if (!['coordinator-delivery', 'coordinator-logs'].includes(newRoute.name)) {
          this.$store.commit('setDrawerUi', false)
        }

        await this.getCollectionTasksView()
        await this.$store.dispatch('global/getTagsList')
      } catch (e) {
        this.$helper.snackbar(e, '$route')
      }
    }
  },
  async created () {
    try {
      this.loading = true
      await Promise.all([
        this.getCollectionTasksView(),
        this.$store.dispatch('global/getDeliveryTypes'),
        this.$store.dispatch('global/getTagsList'),
        this.$store.dispatch('global/getCustomerList'),
        this.$store.dispatch('global/getDeliveryTypeStatuses'),
        this.getSummaries({ ...this.pagination, filter: this.filter })
      ])
      this.loading = false
    } catch (e) {
      this.loading = false
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    async onFilter () {
      try {
        Object.keys(this.filter).forEach(key => this.filter[key] ? this.filterValue = true : this.filterValue = false)
        if (this.filterValue) {
          this.pagination = {}
        } else {
          this.pagination.skip = 0
          this.pagination.take = 100
        }
        this.loading = true
        await Promise.all([
          this.getCollectionTasksView(),
          this.getSummaries({ skip: 0, take: 100, filter: this.filter, drivers_uid: this.driversUids })
        ])
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'filter watch')
      }
    },
    async getSummaries (data) {
      try {
        this.summariesRes = await this.$collectionTasksService.getSummaries(data)
      } catch (e) {
        this.$helper.snackbar(e, 'getSummaries')
      }
    },
    async deleteTasks () {
      try {
        console.log('deleteTasks', this.collectionTasks)
        const tasksIds = this.collectionTasks?.map(task => task.id)
        this.loading = true
        await Promise.all([
          this.$collectionTasksService.deleteCollectionTasks({ tasks_ids: tasksIds }),
          this.getCollectionTasksView()
        ])
        this.loading = false
        this.dialog = false
        this.vSelect++
      } catch (e) {
        this.loading = false
        this.dialog = false
        this.$helper.snackbar(e, 'deleteTasks')
      }
    },
    async getCollectionTasksView () {
      try {
        this.loading = true
        const res = await this.$collectionTasksService.viewTasks({
          ...this.pagination,
          filter: this.filter,
          drivers_uid: this.driversUids
        })
        this.loading = false
        this.items = res.tasks
        this.totalItems = res.total
      } catch (e) {
        this.$helper.snackbar(e, 'getCollectionTasksView')
      }
    },
    clearFilterInputs () {
      this.filter = {
        datesFilter: {
          fromDate: moment().format('YYYY-MM-DD'),
          untilDate: moment().format('YYYY-MM-DD')
        }
      }
      this.onFilter()
    },
    translateStatus (statusName) {
      switch (statusName) {
        case 'pickup_waiting':
          return 'ממתין לאיסוף'
        case 'on_the_way':
          return 'בדרך ליעד'
        case 'picked_up':
          return 'נאסף'
        case 'not_picked_up':
          return 'לא נאסף'
      }
      return statusName
    },
    getFullName (item) {
      return `${item.first_name} ${item.last_name}`
    },
    selectAction (action) {
      console.log('selectAction', action)
      if (action === 'delete_tasks') {
        this.dialog = true
      }
    },
    showInfo (item) {
      try {
        Object.keys(this.form).forEach(key => this.form[key] = item[key])
        this.delivery = item
        this.form.customer_uid = this.customer?.uuid
        this.form.uuid = this.delivery?.uuid
        this.tags = item.tags
        this.$router.push({ name: 'quantitative-collection-coordinator-delivery' })
        this.$store.commit('setDrawerUi', true)
      } catch (e) {
        this.$helper.snackbar(e, 'showInfo')
      }
    },
    async onsubmit (item) { // every component call different function
      try {
        const formName = this.formNames[this.tab]
        await this.$nuxt.$emit('formSubmit', formName) // submit to function from child comp
        await this.$router.push({ name: this.$route.matched[0].name })
        this.$store.commit('setDrawerUi', false)
      } catch (e) {
        this.$helper.snackbar(e, 'onsubmit')
      }
    }
  },
  head: { title: 'רכז איסופים' }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .filter-ui {
    margin-right: -27px
  }
  .action-section {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 15px;
    .coordinatorActions {
      border: none !important;
    }
    .export-btn .col-2 {
      padding-right: 0 !important;
    }
  }
  .clear-search-col {
    @media (max-width: 1900px) {
      margin-top: 100px !important;
    }
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

.v-input__slot{
  background: unset;
}
.table-ui table td[data-v-0e202662] {
  text-align: center !important;
}
.coordinator-body {
  background-color: #F8F8FD;
  .btn-primary{
    margin: 0 0 0 12px!important;
  }
}
.filter-ui {
  margin-right: -12px;
}
</style>
