<template>
  <div style="margin-top: 1em">
    <i class="icon icon-truck-blue" style="width: 60px;" />
    <ul>
      <li v-for="(status, index) of statusHistory" :key="index" :class="{ isNotActive: isNotActive(status) }">
        <i class="icon icon-status-check" />
        <div class="status-data">
          <span v-text="status && status.name" />
          <small v-if="!!status.bag_number">
            מספר שק: {{ status.bag_number }}
          </small>
          <small v-if="status.key === 'stored'">
            מחסן: {{ deliveryInfo.customer_address }}
          </small>
          <small v-if="status.updated_by_user && authUser.level.id === 1">
            <p style="margin-bottom: 0" v-text="'על ידי משתמש:'"/>
            <p style="margin-bottom: 0" v-text="status.updated_by_user"/>
          </small>
          <small v-else-if="status.updated_by_driver && authUser.level.id === 1">
            <p style="margin-bottom: 0" v-text="'בוצע על ידי נהג:'"/>
            <p style="margin-bottom: 0" v-text="status.updated_by_driver"/>
          </small>
          <small>
            {{ status.updated_at | formatDate2 }}
          </small>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'DeliveryStatus',
  props: {
    deliveryInfo: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      deliveryTypeStatuses: [],
      statusHistory: []
    }
  },
  computed: {
    ...mapState('global', ['drivers']),
    ...mapState("auth", ["authUser"])
  },
  async created () {
    try {
      console.log('created this.deliveryInfo', this.deliveryInfo)
      this.deliveryTypeStatuses = await this.$deliveryTypeStatusesService.findByDeliveryStatus({
        delivery_type_id: +this.deliveryInfo.delivery_type.id,
        delivery_type_status_id: +this.deliveryInfo.status.id
      })
      const templateStatus = [{
        key: 'accepted',
        name: 'שודר',
        updated_at: this.deliveryInfo?.status_data?.created_at
      }]
      this.statusHistory = this.deliveryInfo?.status_data?.status_history || templateStatus
      console.log('this.statusHistory', this.statusHistory)
    } catch (e) {
      this.$helper.snackbar(e, 'DeliveryStatus.vue created()')
    }
  },
  methods: {
    isNotActive (status) {
      if (this.deliveryInfo?.status?.key !== status.key) {
        if (typeof this.deliveryInfo.status === 'object' || typeof this.deliveryInfo.status === 'string') {
          return true
        }
      }
      return false
    }
  }
}
</script>

<style lang="scss" scoped>
.isNotActive{
  opacity: .5;
}
.item-status {
  text-align: -webkit-center;
  padding: 10px;
}
.side-status-label{
  margin-top: 3px;
  margin-right: 3px
}
.position-driver-icon{
  width: 8px
}
ul {
  list-style-type: none;

  li {
    padding: 5px 0;
    display: flex;
  }
}
small {
  display: block;
  font-size: 12px;
}
.status-data {
  margin: auto;
}
</style>
