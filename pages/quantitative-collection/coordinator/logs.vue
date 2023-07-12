<template>
  <v-container>
    <v-row v-for="item of items" :key="item.id" class="block-log">
      <v-col cols="1">
        <i class="icon icon-settings" />
      </v-col>
      <v-col cols="5">
        <span class="log-status" v-text="`משלוח מספר-${item.record_id}`" />
        <small> {{ item.created_at | formatDate }} </small>
      </v-col>
      <v-col cols="6">
        <span  v-text="item.description" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'CoordinatorLogs',
  props: {
    delivery: { type: Object, default: () => ({}) },
    customerFields: { type: Object, default: () => ({}) },
    form: { type: Object, default: () => ({}) },
    deliveryTypes: { type: Array, default: () => ([]) },
    drivers: { type: Array, default: () => ([]) }
  },
  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },
  data () {
    return {
      items: []
    }
  },
  async created () {
    try {
      this.items = await this.$logsService.list({ record_id: this.delivery.task_number })
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  }
}
</script>

<style lang="scss" scoped>
.log-status{
  color: #38a8cd;
}
</style>
