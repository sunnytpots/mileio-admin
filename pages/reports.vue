<template>
  <SectionLayout
    :title="`דו''חות עבור ${authUser && authUser.first_name + ' ' + authUser.last_name}`"
    :route-back="{ name: 'settings' }">
    <v-row style="margin-bottom: 10px">
      <v-col cols="8"/>
      <v-col
        cols="4"
        style="display: flex; justify-content: flex-start">
        <DateFilter
          v-model="filter.datesFilter"
          :loading="loading" />
      </v-col>
    </v-row>

    <v-data-table
      :key="renderKey"
      :headers="headers"
      :items="items"
      :server-items-length="totalItems"
      :options.sync="options"
      item-key="id"
      class="elevation-1"
      :loading="loading"
      loading-text="טוען דוח''ות, אנא המתן..."
      :footer-props="footerProps">
      <template v-slot:item.report_type="{ item }">
        <p
          style="margin-bottom: 0"
          v-text="translateReportType(item.report_type)"/>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | formatDate2 }}
      </template>

      <template v-slot:item.status="{ item }">
        <p
          style="margin-bottom: 0"
          v-text="item.link ? 'מוכן' : 'בהמתנה'"/>
      </template>

      <template v-slot:item.link="{ item }">
        <a
          v-if="item.link"
          :href="item.link">
          <v-btn
            class="btn-primary"
            style="text-decoration: underline #fa4616">
            {{ 'הורדה' }}
          </v-btn>
        </a>
      </template>

      <template v-slot:item.schema_type="{ item }">
        <p
          style="text-align: center"
          v-text="item.schema_type === 'excel' ? 'excel' : 'csv'"/>
      </template>
    </v-data-table>
  </SectionLayout>
</template>

<script>
import moment from 'moment/moment'
import { mapState } from 'vuex'

export default {
  name: 'Reports',
  middleware: ['permissions'],

  data () {
    return {
      filter: {
        datesFilter: {
          fromDate: moment().subtract(1, 'year').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        }
      },
      pagination: {
        skip: 0,
        take: 100
      },
      totalItems: 0,
      items: [],
      options: {},
      loading: false,
      renderKey: false
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    ...mapState('global', ['footerProps']),

    headers () {
      const arr = [
        { text: 'מזהה ד"וח', align: 'center', value: 'id' },
        { text: 'מסמך עבור', align: 'center', value: 'report_type' },
        { text: 'תאריך ייצוא הדו"ח', align: 'center', value: 'created_at' },
        { text: 'סטטוס', align: 'center', value: 'status' },
        { text: 'סוג מסמך', align: 'center', value: 'schema_type' },
        { text: 'לינק להורדה', align: 'center', value: 'link' }
      ]
      return arr
    }
  },
  watch: {
    filter: {
      handler (newVal) {
        return this.getData()
      },
      deep: true
    },
    options: {
      async handler (newOptions, oldOptions) {
        try {
          if (Object.keys(oldOptions)?.length < 1) {
            return
          }
          const { sortBy, sortDesc } = newOptions
          this.pagination = {
            skip: (newOptions.page - 1) * newOptions.itemsPerPage,
            take: newOptions.itemsPerPage
          }
          await this.getData()

          this.items = this.items.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'id':
                sortA = a.id
                sortB = b.id
                break
              case 'error_message':
                sortA = a.error_message?.charCodeAt(0) || 0
                sortB = b.error_message?.charCodeAt(0) || 0
                break
              case 'error_response_status':
                sortA = a.error_response_status
                sortB = b.error_response_status
                break
              case 'created_at':
                sortA = a.created_at
                sortB = b.created_at
                break
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
      }
    },
    deep: true
  },
  created () {
    return this.getData()
  },
  methods: {
    translateReportType (reportType) {
      switch (reportType) {
        case 'deliveries':
          return 'משלוחים'
        case 'distributionPointsList':
          return 'נקודות חלוקה'
        case 'usersSettings':
          return 'הגדרות משתמשים'
        case 'smsMessagesSettings':
          return 'הודעות SMS'
        case 'refunds':
          return 'זיכויים'
        case 'distributionPointBags':
          return 'שקי נקודות חלוקה'
        case 'branches':
          return 'סניפים'
        case 'distributionDeliveriesPoints':
          return 'משלוחי נקודות חלוקה'
        case 'customers':
          return 'לקוחות'
        case 'driversManagement':
          return 'ניהול נהגים'
        case 'drivers':
          return 'נהגים'
        case 'customerBags':
          return 'שקי לקוחות'
        case 'collectionTasks':
          return 'משימות איסוף'
        case 'polygons':
          return 'פוליגונים'
        case 'scans':
          return 'סריקות'
        case 'example':
          return 'מסמך דוגמה'
        default:
          return ''
      }
    },
    async getData () {
      try {
        this.loading = true
        const response = await this.$reportsService.viewReport({
          ...this.pagination,
          filter: this.filter
        })
        this.items = response?.items
        this.totalItems = response?.total
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData')
      }
    },
  },
  head: { title: 'דו"חות' }
}
</script>

<style lang="scss" scoped>
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

    .delivery-with-error {
      background-color: #f5b700 !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .delivery-with-error:hover {
      background-color: darken(#ffd344, 10%) !important;
    }

    .late-delivery {
      background-color: red !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .late-delivery:hover {
      background-color: darken(red, 10%) !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}
</style>
