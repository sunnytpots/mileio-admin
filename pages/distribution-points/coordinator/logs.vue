<template>
  <v-container>
    <v-dialog
      v-model="openDialog"
      max-width="900"
      text-align="-webkit-center"
      class="drawer-modal"
    >
      <div style="background-color: #f8f8fd">
        <v-card-title class="headline">
          {{ 'צולם מהאפליקציה:' }}
        </v-card-title>
        <v-card-text style="text-align: center">
          <img
            alt="deliveryPhoto"
            :src="photoLink"
            class="modal-delivery-photo"/>
        </v-card-text>
      </div>
    </v-dialog>
    <v-progress-circular
      v-if="loading"
      class="spinner"
      size="50"
      color="#fa4616"
      indeterminate
    />
    <v-container v-if="items">
      <v-row v-for="item of items" :key="item.id" class="block-log">
        <v-col cols="1">
          <i class="icon icon-settings" />
        </v-col>
        <v-col cols="5">
          <span class="log-status" v-text="`משלוח מספר-${item.record_id}`" />
          <small> {{ item.created_at | formatDate }} </small>
        </v-col>
        <v-col cols="6">
          <!--        <span v-if="item.title === 'app-delivery-photo'">-->
          <!--          צולם מהאפליקציה:<img  :src="item.description.split('~~~')[1]" style="width: 6rem">-->
          <!--          <img  :src="'https://s3.mileio.com/mileio/deliveries/de59c23b-85de-4c7f-8c24-4a17a94ad50f_1633859003907.jpg'" class="preview">-->
          <!--        </span>-->
          <p v-if="item.title === 'app-delivery-photo'" style="display: inline">צולם מהאפליקציה:</p>
          <img
            v-if="item.title === 'app-delivery-photo'"
            alt="deliveryPhoto"
            :src="item.description.split('~~~')[1]"
            style="width: 6rem; cursor: pointer"
            @click="initPhotoModal(item)"/>
          <span v-else  v-text="item.description" />
        </v-col>
      </v-row>
      <v-row class="block-log">
        <v-col cols="9">
          <v-text-field
            v-model="comment"
            label="הוספת הערה"
            class="input-ui"
            filled
            rounded
          />
        </v-col>
        <v-col cols="3" :loading="loading">
          <v-btn class="btn-primary" @click.prevent="saveLogComment" >
            הוספה
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
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
  data () {
    return {
      photoLink: null,
      openDialog: false,
      items: [],
      loading: false,
      comment: null
    }
  },

  fetch ({ store }) {
    store.commit('setDrawerUi', true)
  },

  async created () {
    try {
      this.loading = true
      this.items = await this.$logsService.list({
        record_id: this.delivery.id,
        table_name: 'distributionDeliveriesPoint'
      })
      this.loading = false
      console.log('items', this.items)
    } catch (e) {
      console.log('created error', e)
    }
  },
  methods: {
    initPhotoModal (item) {
      this.photoLink = item.description.split('~~~')[1]
      this.openDialog = true
    },
    async saveLogComment () {
      this.loading = true
      await this.$logsService.writeInfoToLog({
        table_name: 'distributionDeliveriesPoint',
        title: 'comment',
        record_id: this.delivery.id,
        description: this.comment
      })
      this.items = await this.$logsService.list({
        record_id: this.delivery.id,
        table_name: 'distributionDeliveriesPoint'
      })
      this.loading = false
      this.comment = null
    }
  }
}
</script>

<style lang="scss" scoped>
.spinner {
  margin: auto 50%;
}
.log-status{
  color: #38a8cd;
}
</style>
