<template>
  <div class="date-filter">
    <h3 class="date-filter-title" v-text="'הצג נתונים מחודש:'" />
    <v-menu v-model="menuFrom" :close-on-content-click="false" transition="scale-transition" offset-y>
      <template #activator="{ on, attrs }">
        <v-text-field v-model="dates.fromDate" :loading="loading" :disabled="loading" prepend-icon="mdi-calendar" readonly v-bind="attrs" v-on="on" />
      </template>
      <v-date-picker v-model="dates.fromDate" @input="menuFrom = false" type="month" />
    </v-menu>
  </div>
</template>

<script>
import moment from 'moment'

export default {
  name: 'MonthlyFilter',
  props: {
    loading: { type: Boolean, default: false },
    type: { type: String, default: null }
  },

  data () {
    return {
      menuFrom: false,
      menuTo: false,
      dates: {
        fromDate: moment().startOf('month').format('YYYY-MM')
      }
    }
  },
  watch: {
    dates: {
      handler (newDate) {
        this.$emit('input', newDate)
      },
      deep: true
    }
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
