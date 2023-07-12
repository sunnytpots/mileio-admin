<template>
  <span
    class="badge"
    :style="{
      backgroundColor: statuses[statusKey] && statuses[statusKey].backgroundColor,
      color: statuses[statusKey] && statuses[statusKey].color
    }"
    v-text="statusValue"/>
</template>

<script>
export default {
  name: 'StatusesUi',

  props: {
    statusValue: { type: [String, Number, Boolean], default: null },
    statusKey: { type: [String, Number, Boolean], default: null }
  },

  data () {
    return {
      statuses: {
        true: { backgroundColor: '#04c569', color: '#FFFFFF' },
        packed: { backgroundColor: '#e7e7e7', color: '#22272E' },
        false: { backgroundColor: '#ff5050', color: '#FFFFFF' },
        lost: { backgroundColor: '#ff5050', color: '#FFFFFF' },
        cancelled: { backgroundColor: '#ffe5b4', color: '#22272E' },
        active: { backgroundColor: '#04c569', color: '#FFFFFF' },
        not_active: { backgroundColor: '#ff5050', color: '#FFFFFF' },
        not_picked_up: { backgroundColor: '#ff5050', color: '#FFFFFF' },
        accepted: { backgroundColor: '#d9f7da', color: '#22272E' },
        collected: { backgroundColor: '#9dd89e', color: '#22272E' },
        stored: { backgroundColor: '#e7e7e7', color: '#22272E' },
        enter_to: { backgroundColor: '#b1f3b2', color: '#22272E' },
        exit_to: { backgroundColor: '#b1f3b2', color: '#22272E' },
        on_target_way: { backgroundColor: '#f3edb2', color: '#22272E' },
        awaiting_payment: { backgroundColor: '#f3edb2', color: '#22272E' },
        done: { backgroundColor: '#b1f3b2', color: '#22272E' },
        paid: { backgroundColor: '#b1f3b2', color: '#22272E' },
        pickup_waiting: { backgroundColor: '#fcd8d8', color: '#22272E' },
        collected_waiting_refund: { backgroundColor: '#fcd8d8', color: '#22272E' },
        delivered_awaiting_refund: { backgroundColor: '#fcd8d8', color: '#22272E' },
        on_the_way: { backgroundColor: '#f3edb2', color: '#22272E' },
        bag_on_the_way: { backgroundColor: '#f3edb2', color: '#22272E' },
        distribution_bag_on_the_way: { backgroundColor: '#f3edb2', color: '#22272E' },
        in_distribution_bag: { backgroundColor: '#d9f7da', color: '#22272E' },
        in_dist_point_waiting_for_receiver: { backgroundColor: '#fcd8d8', color: '#22272E' },
        in_dist_point_waiting_for_scan: { backgroundColor: '#e8a7a7', color: '#22272E' },
        returning_to_storage: { backgroundColor: '#94a594', color: '#FFFFFF' },
        upgraded_to_delivery: { backgroundColor: '#f3edb2', color: '#22272E' },
        picked_up: { backgroundColor: '#b1f3b2', color: '#22272E' },
        release_from_done: { backgroundColor: '#b1f3b2', color: '#22272E' },
        ready_to_delivered: { backgroundColor: '#b1f3b2', color: '#22272E' },
        back_to_storage: { backgroundColor: '#94a594', color: '#FFFFFF' },
        payment_received: { backgroundColor: '#94a594', color: '#FFFFFF' },
        in_preparation: { backgroundColor: '#d9f7da', color: '#22272E' },
        error: { backgroundColor: '#e03838', color: '#FFFFFF' },
        in_process: { backgroundColor: '#f3eeb3', color: '#22272E' },
        driver_scan: { backgroundColor: '#c8c234', color: '#22272E' },
        failure: { backgroundColor: '#fcd8d8', color: '#22272E' },
        deposit: { backgroundColor: '#b1f3b2', color: '#22272E' },
        waiting_to_be_collected: { backgroundColor: '#b1f3b2', color: '#22272E' },
        refund_package_on_storage: { backgroundColor: '#e7e7e7', color: '#22272E' }
      },
      statusStyle: [],
      statusColor: ''
    }
  },
  methods: {}
}
</script>

<style lang="scss" scoped>
.badge{
  display: flex;
  align-items: center;
  justify-content: center;
  padding: .4rem .7rem;
  color: #22272E;
  border-radius: 3px;
  font-size: .8rem;
  width: auto;
  margin: 0.4rem;
}
</style>
