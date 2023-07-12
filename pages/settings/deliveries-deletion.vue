<template>
  <SectionLayout
    v-if="$hasPermission('settings-deliveries-deletion', 'edit')"
    title="מחיקת משלוחים"
    :route-back="{ name: 'settings' }">
    <v-layout row wrap>
      <v-flex md6 xs12>
        <DateFilter
          v-model="filter.datesFilter"
          :loading="loading"/>
      </v-flex>

      <v-flex md3 xs12 style="text-align: center">
        <v-btn
          color="red"
          class="white--text"
          :loading="loading"
          @click="removeDeliveries">
          {{ 'מחק משלוחים בטווח תאריכים זה' }}
        </v-btn>
      </v-flex>

      <v-flex md3 xs12 style="text-align: center">
        <v-btn
          color="green"
          class="white--text"
          :loading="loading"
          @click="retrieveDeliveries">
          {{ 'שחזר משלוחים בטווח תאריכים זה' }}
        </v-btn>
      </v-flex>
    </v-layout>

    <v-layout row wrap my-5>
      <v-flex md2 xs12>
        <v-checkbox
          v-model="filter.only_deleted"
          label="הצג רק משלוחים שנמחקו"/>
      </v-flex>
    </v-layout>

    <v-layout row wrap justify-center>
      <v-flex md10 xs12 style="text-align: center">
        <v-data-table
          :headers="headers"
          :items="deliveries"
          :loading="loading"
          :item-class="itemRowBackground"
          :footer-props="footerProps">
          <template v-slot:item.deleted_at="{ item }">
            {{ item.deleted_at | formatDate2 }}
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>
  </SectionLayout>
</template>

<script>
import moment from 'moment/moment'
import { mapState } from 'vuex'

export default {
  name: 'DeliveriesDeletion',
  middleware: ['permissions'],

  data () {
    return {
      deliveries: [],
      loading: false,
      filter: {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        },
        with_deleted: true,
        only_deleted: false,
      }
    }
  },
  computed: {
    ...mapState('global', ['footerProps']),

    headers () {
      const arr = [
        { text: 'מזהה משלוח', align: 'right', value: 'delivery_id', width: '40%' },
        { text: 'ברקוד משלוח', align: 'right', value: 'barcode', width: '40%' },
        { text: 'תאריך מחיקה', align: 'right', value: 'deleted_at', width: '20%' }
      ]
      return arr
    }
  },
  watch: {
    filter: {
      handler () {
        return this.getData()
      },
      deep: true
    }
  },
  created () {
    return this.getData()
  },
  methods: {
    itemRowBackground (item) {
      if (item?.deleted_at) {
        return 'deleted-delivery'
      }
      return 'no-applied-class'
    },
    async retrieveDeliveries () {
      try {
        this.loading = true
        await this.$deliveryService.retrieveDeliveries({ filter: this.filter })
        await this.getData()
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData')
      }
    },
    async removeDeliveries () {
      try {
        this.loading = true
        await this.$deliveryService.deleteDeliveries({ filter: this.filter })
        await this.getData()
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData')
      }
    },
    async getData () {
      try {
        this.loading = true
        const response = await this.$deliveryService.viewDeliveries({ filter: this.filter })
        this.deliveries = response?.items
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData')
      }
    },
    submitted () {
      this.$store.commit('setSnackbar', {
        value: true,
        message: 'SLA עודכן בהצלחה',
        success: true
      })
    }
  },
  head: { title: 'מחיקת משלוחים' }
}
</script>

<style lang="scss" scoped>
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
}
</style>
