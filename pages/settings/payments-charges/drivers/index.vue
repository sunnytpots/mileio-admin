<template>
  <SectionLayout class="main-layout">

    <template class="d-print-none" #header>
      <CardDriver
        v-show="driversSelected && driversSelected.length > 0"
        :selected-array="driversSelectedArray"/>
    </template>

    <InfoPanel
      :widgets="widgetsSummaries"
      :widgets-loading="loading"/>

    <CardUi overflow>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="items"
          :server-items-length="totalItems"
          :options.sync="options"
          item-key="id"
          class="elevation-1"
          :loading="loading"
          loading-text="טוען מידע, אנא המתן..."
          :footer-props="footerProps"
          @click:row="showInfo">
          <template v-slot:no-data>
            <p v-text="'אין מידע.'"/>
          </template>

          <template v-slot:item.name="{ item }">
            {{ `${item.first_name} ${item.last_name}` }}
          </template>

          <template v-slot:item.status="{ item }">
            <StatusesUi
              :status-value="translateStatus(item.status)"
              :status-key="item.status || 'not_active'"/>
          </template>

          <template v-slot:item.branches="{ item }">
            {{ getBranchesNames(item.branches) }}
          </template>

          <template v-slot:item.active_tasks="{ item }">
            {{ (item.tasks && item.tasks.active_tasks) || 0 }}
          </template>

          <template v-slot:item.done_tasks="{ item }">
            {{ (item.tasks && item.tasks.done_tasks) || 0 }}
          </template>

          <template v-slot:item.lateness="{ item }">
            {{ item.lateness || 0 }}
          </template>
        </v-data-table>
      </v-flex>
    </CardUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'DistributionPointPay',

  data () {
    return {
      options: {},
      loading: false,
      filter: {},
      pagination: {
        skip: 0,
        take: 100
      },
      summariesRes: {},
      items: [],
      totalItems: null,
      delivery: {},
      currentItem: null,
      tab: null
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    ...mapState('global', ['driversSelected', 'drivers', 'footerProps']),

    headers () {
      const arr = [
        { text: 'שם נהג', align: 'center', value: 'name' },
        { text: 'סטטוס', align: 'center', value: 'status' },
        { text: 'איזור', align: 'center', value: 'branches' },
        { text: 'משימות פעילות', align: 'center', value: 'active_tasks' },
        { text: 'משימות שבוצעו', align: 'center', value: 'done_tasks' },
        { text: 'איחורים', align: 'center', value: 'lateness' }
      ]
      return arr
    },
    widgetsSummaries () {
      return [
        { key: 'total', title: 'כמות משלוחים', value: this.summariesRes.total || 0 },
        { key: 'done', title: 'בוצע בהצלחה', value: this.summariesRes.done || 0 },
        { key: 'error', title: 'כשל', value: this.summariesRes.error || 0 },
        // { key: 'billing_amount', title: 'סכום לחיוב', value: this.summariesRes.billing_amount || 0 },
        // { key: 'refund_amount', title: 'סכום לזיכוי', value: this.summariesRes.refund_amount || 0 },
        { key: 'total_payment', title: 'סה"כ לתשלום', value: this.summariesRes.total_payment || 0 }
      ]
    },
    driversSelectedArray () {
      const items = []
      this.drivers.forEach(item => {
        if (this.driversSelected?.includes(item.id)) {
          return items.push(item)
        }
      })
      return items
    }
  },
  watch: {
    driversSelected (newVal) {
      this.filter.byDriversIds = newVal
      return this.getData()
    },
    options: {
      async handler (newOptions) {
        try {
          const { sortBy, sortDesc } = this.options
          this.pagination.skip = (newOptions.page - 1) * newOptions.itemsPerPage
          this.pagination.take = newOptions.itemsPerPage
          const response = await this.$driverService.driverView({
            ...this.pagination,
            filter: this.filter,
            branch_id: this.branchSelected
          })
          this.totalItems = response?.total
          this.items = response?.items?.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'name':
                sortA = (a.first_name + a.last_name)?.charCodeAt(0) || 0
                sortB = (b.first_name + b.last_name)?.charCodeAt(0) || 0
                break
              case 'status':
                sortA = a.status || 0
                sortB = b.status || 0
                break
              case 'active_tasks':
                sortA = a.tasks?.active_tasks || 0
                sortB = b.tasks?.active_tasks || 0
                break
              case 'done_tasks':
                sortA = a.tasks?.done_tasks || 0
                sortB = b.tasks?.done_tasks || 0
                break
              case 'lateness':
                sortA = a.lateness?.charCodeAt(0) || 0
                sortB = b.lateness?.charCodeAt(0) || 0
                break
            }
            if (sortDesc[0]) {
              return sortA < sortB ? 1 : sortA > sortB ? -1 : 0
            } else {
              return sortA < sortB ? -1 : sortA > sortB ? 1 : 0
            }
          })
        } catch (e) {
          this.$helper.snackbar(e, 'options watch error')
        }
      },
      deep: true
    }
  },
  created () {
    return this.getData()
  },
  methods: {
    async getData () {
      try {
        this.loading = true
        const response = await this.$driverService.driverView({ ...this.pagination, filter: this.filter })
        this.items = response?.items
        this.totalItems = response?.total
        this.summariesRes = await this.$driverService.getSummary({ ...this.pagination, filter: this.filter })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper('getData error', e)
      }
    },
    getBranchesNames (branches) {
      return branches?.map(branch => branch.name)?.join(', ')
    },
    translateStatus (status) {
      return status === 'active' ? 'פעיל' : 'לא פעיל'
    },
    showInfo (item) {
      this.$router.push({ name: 'settings-payments-charges-drivers-driver_uid', params: { driver_uid: item.uuid } })
    }
  }

}
</script>

<style lang="scss" scoped>
.section-layout {
  padding-right: 0;
}
.actions-body {
  .filter-ui {
    padding-right: 0;
  }
}
.verify-label {
  text-align: center;
  font-size: large;
}
.main-layout {
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
      font-style: normal;
      font-weight: normal;
      font-size: 14px;
      color: #000000;
      background-color: #F4F4F4 !important;
    }
    .v-data-table > .v-data-table__wrapper > table > tbody > tr > td, .v-data-table > .v-data-table__wrapper > table > tbody > tr > th,
    .v-data-table > .v-data-table__wrapper > table > thead > tr > td, .v-data-table > .v-data-table__wrapper > table > thead > tr > th,
    .v-data-table > .v-data-table__wrapper > table > tfoot > tr > td, .v-data-table > .v-data-table__wrapper > table > tfoot > tr > th {
      padding: 0 8px !important;
    }
    .filter-ui .v-text-field--enclosed .v-input__append-inner {
      margin-top: 7px !important;
      margin-left: -15px !important;
    }
    .v-select__selection--comma {
      margin: -3px -1px 12px 0 !important;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: smaller !important;
    }
  }
}
</style>
