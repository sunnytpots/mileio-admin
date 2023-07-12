<template>
  <v-container>
    <v-progress-circular
      v-if="loading"
      style="position: absolute;left: 50%;top: 40%"
      :width="5"
      color="#fa4616"
      indeterminate
    />
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
    <v-row v-for="item of items" :key="item.id" class="block-log">
      <v-col cols="1">
        <i class="icon icon-settings" />
      </v-col>
      <v-col v-if="item.request_from" cols="2"   style="display: flex;flex-direction: column">
        <span   v-text="`נוצר מ - ${item.request_from}`" />
      </v-col>
      <v-col cols="2"  style="display: flex;flex-direction: column">
        <span v-if="item.user" class="log-user" v-text="`שם משתמש-${item.user.first_name} ${item.user.last_name}`" />
        <span v-else-if="item.driver" class="log-user" v-text="`שם נהג-${item.driver.first_name} ${item.driver.last_name}`" />
        <small> {{ item.created_at | formatDate }} </small>
      </v-col>
      <v-col cols="2">
        <span class="log-status" v-text="`משלוח מספר-${item.record_id}`" />
      </v-col>
      <v-col cols="5">
        <p v-if="item.title === 'app-delivery-photo-taken'" style="display: inline">צולם מהאפליקציה - חבילה נמסרה:</p>
        <p v-else-if="item.title === 'app-delivery-photo-delivered'" style="display: inline">צולם מהאפליקציה - חבילה נלקחה:</p>
        <p v-else-if="item.title === 'app-delivery-photo'" style="display: inline">צולם מהאפליקציה:</p>
        <img
          v-if="item.title.includes('app-delivery-photo')"
          alt="deliveryPhoto"
          :src="item.description.split('~~~')[1]"
          style="width: 6rem; cursor: pointer"
          @click="initPhotoModal(item)"/>
        <span v-else v-text="item.description" />
      </v-col>
    </v-row>
    <v-row class="block-log">
      <v-col cols="9">
        <v-text-field
          v-model="comment"
          label="הוספת הערה"
          class="inputUi"
          solo
          flat
        />
      </v-col>
      <v-col cols="3" :loading="loading">
        <v-btn class="btn-primary" @click.prevent="saveLogComment" >
          הוספה
        </v-btn>
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
    console.log(this.delivery.tapuz_number)
    this.loading = true
    this.items = await this.$logsService.list({
      record_id: this.delivery.tapuz_number,
      table_name: 'deliveries'
    })
    this.loading = false
  },
  methods: {
    initPhotoModal (item) {
      this.photoLink = item.description.split('~~~')[1]
      this.openDialog = true
    },
    async saveLogComment () {
      this.loading = true
      await this.$logsService.writeInfoToLog({
        table_name: 'deliveries',
        title: 'comment',
        record_id: this.delivery.tapuz_number,
        description: this.comment
      })
      this.items = await this.$logsService.list({
        record_id: this.delivery.tapuz_number,
        table_name: 'deliveries'
      })
      this.loading = false
      this.comment = null
    }
  }
}
</script>

<style lang="scss" scoped>

.modal-delivery-photo {
  width: 800px;
  height: 500px;
}

.log-status{
  color: #38a8cd;
}
.log-user{
  color: #fa4616;
}

</style>
