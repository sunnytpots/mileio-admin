<template>
  <div
    v-if="statisticsLoading"
    class="loading-block">
    <v-progress-circular
      indeterminate
      color="#fa4616"
      size="60"/>
  </div>
  <section
    v-else
    class="statistics-bar-ui">
    <StatisicsbarBlock
      v-for="(data, index) in statisticsBarBlockData"
      :key="index"
      :title="data.title"
      :value="data.value || 0 "
      :sub-title="data.subTitle"
      :value2="data.value2"
      :stars="data.stars"
      :type-prop="data.typeProp"/>
  </section>
</template>

<script>
export default {
  name: 'StatisticsbarUi',
  props: {
    statistics: { type: Object, required: true },
    statisticsLoading: { type: Boolean, default: false }
  },
  computed: {
    statisticsBarBlockData () {
      return [
        {
          title: 'משלוחים ששודרו',
          value: this.statistics?.total_deliveries
        },
        {
          title: 'משלוחים שבוצעו',
          value: this.statistics?.done_deliveries,
          subTitle: 'משלוחים שנמסרו לנמענים',
          typeProp: '1'
        },
        {
          title: 'משלוחים בכשל',
          value: this.statistics?.deliveries_with_error,
          subTitle: 'משלוחים שדווח כשל בנתונים',
          typeProp: '2'
        },
        {
          title: 'משלוחים שאבדו',
          value: this.statistics?.lost_deliveries,
          typeProp: '2'
        },
        {
          title: 'זמן ביצוע ממוצע (SLA)',
          value: (this.statistics?.done_deliveries_avg || 0) + ' ימים'
        },
        {
          title: 'נמענים חוזרים',
          value: this.statistics?.existed_target_phone,
          value2: this.statistics?.existed_target_phone_percent + '%',
          subTitle: 'נמענים שביצעו הזמנה בעבר',
          typeProp: '3'
        },
        {
          title: 'נמענים חדשים',
          value: this.statistics?.new_target_phone,
          value2: this.statistics?.new_target_phone_percent + '%',
          subTitle: '',
          typeProp: '3'
        },
        {
          title: 'שביעות רצון ממוצעת',
          value: this.statistics?.satisfaction,
          stars: this.statistics?.satisfaction || '0',
          typeProp: '4'
        }
      ]
    }
  },
  created () {}
}
</script>

<style scoped lang="scss">
.statistics-bar-ui{
  max-width: 1536px;
  min-height: 310px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  padding: 5px;
  background-color: white;
}
</style>
