<template>
  <SectionLayout class="d-print-none">
    <div class="statistics-header">
      <h1>שלום תפוז משלוחים</h1>
      <DateFilter
        v-model="filter.datesFilter"
        :loading="isLoading"/>
    </div>

    <div class="filter-options-container">
      <v-radio-group
        v-model="byCustomer"
        row
        class="filter-options">
        <v-radio
          v-for="(filterOption, index) in filterOptions"
          :key="index"
          :label="filterOption.label"
          :value="filterOption.value"/>
      </v-radio-group>
      <FilterUi
        v-if="byCustomer"
        v-model="filter"
        class="filter-ui"
        show-customer
        customer-is-clearable
        :customer-list="customers"/>
    </div>

    <StatisticsbarUi
      :statistics-loading="statisticsLoading"
      :statistics="statistics" />

    <StatisticsReportbarUi
      :activities-loading="activitiesLoading"
      :deployment-loading="deploymentLoading"
      :deployments="deployments"
      :activities="activities" />
  </SectionLayout>
</template>

<script>

import moment from 'moment'
import { mapState } from 'vuex'

export default {
  name: 'Statistics',
  props: {
    distributionPointCities: { type: Array, default: () => ([]) }
  },

  data () {
    return {
      byCustomer: false,
      filterOptions: [
        { value: false, label: 'כללי' },
        { value: true, label: 'לפי לקוח' }
      ],
      isLoading: null,
      statisticsLoading: false,
      activitiesLoading: false,
      deploymentLoading: false,
      filter: {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').format('YYYY-MM-DD'),
          untilDate: moment().format('YYYY-MM-DD')
        }
      },
      statistics: {
        total_deliveries: 0,
        done_deliveries: 0,
        deliveries_with_error: 0,
        lost_deliveries: 0,
        done_deliveries_avg: 0,
        existed_target_phone: 0,
        new_target_phone: 0,
        average_rate: 0,
        existed_target_phone_percent: 0,
        new_target_phone_percent: 0
      },
      deployments: [],
      activities: {}
    }
  },
  computed: {
    ...mapState('global', ['customers'])
  },
  watch: {
    filter: {
      handler (newFilter) {
        console.log('filter watch', newFilter)
        return this.getData()
      },
      deep: true
    },
    byCustomer (newVal) {
      if (!newVal) {
        this.filter.customer_uid = null
      }
    }
  },
  created () {
    this.$store.dispatch('global/getCustomerList')
    return this.getData()
  },
  methods: {
    getData () {
      return Promise.all([
        this.getStatistics(),
        this.getDeployment(),
        this.getActivities()
      ])
    },
    async getStatistics () {
      try {
        this.statisticsLoading = true
        const response = await this.$deliveryService.getStatistics({ filter: this.filter })
        Object.assign(this.statistics, response)
        this.statisticsLoading = false
      } catch (e) {
        this.statisticsLoading = false
        this.$helper.snackbar(e, 'getStatistics')
      }
    },
    async getDeployment () {
      try {
        this.deploymentLoading = true
        const response = await this.$deliveryService.getDeployment({ filter: this.filter })
        this.deployments = response || []
        this.deploymentLoading = false
      } catch (e) {
        this.deploymentLoading = false
        this.$helper.snackbar(e, 'getDeployment')
      }
    },
    async getActivities () {
      try {
        this.activitiesLoading = true
        const response = await this.$deliveryService.getActivities({ filter: this.filter })
        Object.assign(this.activities, response)
        this.activitiesLoading = false
      } catch (e) {
        this.activitiesLoading = false
        this.$helper.snackbar(e, 'getActivities')
      }
    }
  },
  head: { title: 'סטטיסטיקות' }
}
</script>

<style scoped lang="scss">
.loading-block {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 310px;
}
.statistics-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
  width: 1536px;
  h1 {
    font-family: 'Rubik';
    font-weight: 600;
    font-size: 22px;
    line-height: 22px;
  }
}
.notification-bar {
  display: flex;
  align-items: center;
  height: 67px;
  width: 1536px;
  background: #FFFAF4;
  box-shadow: -5px 8px 24px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  font-family: 'Rubik';
  margin-bottom: 30px;
  margin-top: -37px;

  .icon {
    margin: 27px;
    width: 14px;
    height: 14px;
  }

  b {
    color: #22272E;
    font-weight: 600;
    font-size: 18px;
    line-height: 18px;
  }
}
.filter-options-container {
  display: flex;
  justify-content: flex-start;
  max-height: 48px;

  .filter-options {
    flex: 1;
    margin-top: 0;

    ::v-deep {
      .v-radio:first-child {
        margin-right: 0;
      }
    }
  }

  .filter-ui {
    flex: 7;
  }
}
.section-layout {
  ::v-deep {
    .col-12 {
      padding-top: 0;
      margin-top: -30px;
    }
  }

  .col-12 {
    padding-top: 0;
    margin-top: -30px;
  }
}
</style>
