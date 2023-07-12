<template>
  <SectionLayout title="לוג שגיאות" :route-back="{ name: 'settings' }">
    <FilterUi
      v-model="filter"
      show-search
      show-status-code/>
    <v-data-table
      :key="renderKey"
      :headers="headers"
      :items="items"
      :server-items-length="totalItems"
      :options.sync="options"
      item-key="id"
      class="elevation-1"
      :loading="loading"
      loading-text="טוען לוג שגיאות, אנא המתן..."
      :footer-props="footerProps">
      <template v-slot:item.more_info="{ item, index }">
        <ErrorLogsDialog
          :ref="`error_log_dialog_${index}`"
          :error-log="item"
          @reset-other-logs="resetOtherLogs(index)"/>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | formatDate2 }}
      </template>
    </v-data-table>
  </SectionLayout>
</template>

<script>
import moment from 'moment/moment'
import { mapState } from 'vuex'

export default {
  name: 'FailureLogs',
  middleware: ['permissions'],

  data () {
    return {
      filter: {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
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
    ...mapState('global', ['footerProps']),

    headers () {
      const arr = [
        { text: 'מזהה שגיאה', align: 'start', value: 'id', width: '5%' },
        { text: 'הודעת השגיאה', align: 'start', value: 'error_message', width: '35%' },
        { text: 'תאריך השגיאה', align: 'start', value: 'created_at', width: '10%' },
        { text: 'קוד סטטוס שחזר', align: 'start', value: 'error_response_status', width: '10%' },
        { text: 'מידע נוסף', align: 'start', value: 'more_info', width: '5%', sortable: false }
      ]
      return arr
    }
  },
  watch: {
    'filter.search' (newVal, oldVal) {
      if (newVal !== oldVal && newVal?.length > 2) {
        return this.getData()
      }
    },
    'filter.status_code' (newVal, oldVal) {
      return this.getData()
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
    resetOtherLogs (indexToKeep) {
      const refsArray = Object.keys(this.$refs)
      refsArray.forEach((ref, index) => {
        if (ref.includes('error_log_dialog') && index === indexToKeep) {
          return
        }
        this.$refs[ref].showPreviewDialog = false
      })
    },
    async getData () {
      try {
        this.loading = true
        const response = await this.$errorLogsService.viewErrors({
          ...this.pagination,
          filter: this.filter
        })
        this.items = response.items
        this.totalItems = response.total
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData')
      }
    },
  },
  head: { title: 'לוג שגיאות' }
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
