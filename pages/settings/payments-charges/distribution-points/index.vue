<template>
  <SectionLayout class="main-layout">
    <InfoPanel
      :widgets="widgetsSummaries"
      :widgets-loading="loading"/>

    <div class="actions-body">
      <FilterUi
        v-model="filter"
        show-search
        show-reset
        show-distribution-point-cities
        :distribution-point-cities="distribution_point_cities"
        :clear-filter-inputs="clearFilterInput"/>
    </div>

    <CardUi overflow>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="distributionPoints"
          item-key="id"
          class="elevation-1"
          :loading="loading"
          loading-text="טוען מידע, אנא המתן..."
          :footer-props="footerProps"
          @click:row="showInfo">
          <template v-slot:no-data>
            <p v-text="'אין מידע.'"/>
          </template>

          <template v-slot:item.active="{ item }">
            <StatusesUi
              :status-value="item.active ? 'פעיל' : 'לא פעיל'"
              :status-key="item.active ? 'active' : 'not_active'"/>
          </template>

          <template v-slot:item.address="{ item }">
            {{ item.address && getAddressValue(item.address) }}
          </template>

          <template v-slot:item.line="{ item }">
            {{ item.line && item.line.name }}
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
      loading: false,
      filter: {},
      distributionPoints: [],
      totalItems: null,
      summariesRes: {},
      items: [],
      delivery: {},
      currentItem: null,
      tab: null
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    ...mapState('global', ['distribution_point_cities', 'footerProps']),

    headers () {
      const arr = [
        { text: 'שם נקודה', align: 'right', value: 'name' },
        { text: 'סטאטוס', align: 'center', value: 'active' },
        { text: 'קו', align: 'right', value: 'line' },
        { text: 'עיר', align: 'center', value: 'address.correct_long_city_name' },
        { text: 'כתובת', align: 'center', value: 'address' },
        { text: 'מספר נקודה', align: 'center', value: 'point_number' },
        { text: 'שם איש קשר', align: 'center', value: 'contact_name' },
        { text: 'טלפון איש קשר', align: 'center', value: 'phone' }
      ]
      return arr
    },
    widgetsSummaries () {
      return [
        { key: 'total', title: 'כמות משלוחים', value: this.summariesRes?.total || 0 },
        { key: 'done', title: 'בוצע בהצלחה', value: this.summariesRes?.done || 0 },
        { key: 'error', title: 'כשל', value: this.summariesRes?.error || 0 },
        { key: 'total_payment', title: 'סה"כ לתשלום TA-BOX', value: this.summariesRes?.refund_amount || 0 }
      ]
    }
  },
  watch: {
    filter: {
      handler () {
        return this.getDistributionViews()
      },
      deep: true
    }
  },
  async created () {
    try {
      await this.$store.dispatch('global/getDistributionPointCities')
      return this.getDistributionViews()
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    async getDistributionViews () {
      try {
        this.loading = true
        const response = await this.$distributionPointsService.postDistributionPoints({ filter: this.filter })
        this.distributionPoints = response?.items
        this.totalItems = response?.total
        this.summariesRes = await this.$distributionDeliveriesPointsService.getSummary({ filter: this.filter })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getDistributionViews')
      }
    },
    clearFilterInput () {
      this.filter = {}
    },
    showInfo (item) {
      return this.$router.push({ name: 'settings-payments-charges-distribution-points-distribution_point_uid',
        params: { distribution_point_uid: item.uuid }
      })
    },
    getAddressValue (addressObj) {
      let addressVal = ''
      addressObj.correct_long_street_name && (addressVal += `${addressObj.correct_long_street_name} `)
      addressObj.correct_street_number && (addressVal += `${addressObj.correct_street_number}`)
      return addressVal
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
    .row--dense {
      margin: -15px;
    }
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

  }
}
</style>
