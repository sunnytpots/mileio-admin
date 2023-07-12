<template>
  <div class="date-filter">
    <h3 class="date-filter-title" v-text="'הצג נתונים מתאריך:'" />
    <v-menu
      v-model="menuFrom"
      :close-on-content-click="false"
      transition="scale-transition"
      offset-y>
      <template #activator="{ on, attrs }">
        <v-text-field
          v-model="formattedFromDate"
          class="date-filter-coordinator"
          outlined
          dense
          :loading="loading"
          :disabled="loading"
          append-icon="icon icon-calender"
          readonly
          v-bind="attrs"
          v-on="on"/>
      </template>
      <v-date-picker
        v-model="dates.fromDate"
        @input="menuFrom = false" />
    </v-menu>

    <h3
      class="date-filter-title"
      v-text="'עד'" />

    <v-menu
      v-model="menuTo"
      :close-on-content-click="false"
      transition="scale-transition"
      offset-y>
      <template #activator="{ on, attrs }">
        <v-text-field
          v-model="formattedUntilDate"
          class="date-filter-coordinator"
          outlined
          dense
          :loading="loading"
          :disabled="loading"
          append-icon="icon icon-calender"
          readonly
          v-bind="attrs"
          v-on="on"/>
      </template>
      <v-date-picker
        v-model="dates.untilDate"
        @input="menuTo = false"/>
    </v-menu>

    <v-radio-group
      v-if="showFilterChoice"
      v-model="filterChoice"
      row
      style="padding-right: 100px">
      <v-radio
        label="סנן לפי תאריך שידור"
        value="created_at"/>
      <v-radio
        label="סנן לפי תאריך מסירה"
        value="delivered_date"/>
    </v-radio-group>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  name: 'DateFilter',
  props: {
    loading: { type: Boolean, default: false },
    showFilterChoice: { type: Boolean, default: false },
    value: { type: Object, default: null }
  },
  data () {
    return {
      filterChoice: 'created_at',
      menuFrom: false,
      menuTo: false,
      dates: {
        filterDateBy: 'created_at',
        fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
        untilDate: moment().endOf('day').format('YYYY-MM-DD')
      }
    }
  },
  computed: {
    formattedFromDate () {
      return moment(this.dates.fromDate).format('DD-MM-YYYY')
    },
    formattedUntilDate () {
      return moment(this.dates.untilDate).format('DD-MM-YYYY')
    }
  },
  watch: {
    dates: {
      handler (newDate) {
        this.$emit('input', newDate)
      },
      deep: true
    },
    filterChoice (newVal) {
      this.dates.filterDateBy = newVal
    }
  },
  created () {
    this.dates = this.value || this.dates
  }
}
</script>

<style lang="scss" scoped>
.date-filter{
  display: flex;
  align-items: center;
  justify-content: center;

  p {
    margin-bottom: 0;
  }

  & > * {
    margin-left: 1rem;
    &:last-child {
      margin-left: 0;
    }
  }

  ::v-deep {
    .v-input{
      margin-top: 0;
      padding: 0;
      font-size: .86rem;

      input {
        color: #777777;
      }

      .v-input__append-inner {
        margin-left: 0 !important;
      }
    }
    .v-input__slot{
      margin-bottom: 0;
    }
    .v-text-field__details{
      display: none;
    }
  }
}
.date-filter-title{
  margin-bottom: 0;
  font-size: .8rem;
  font-weight: 500;
}
.loading {
  opacity: .5;
}
</style>
