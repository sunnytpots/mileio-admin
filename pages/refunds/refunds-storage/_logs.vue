<template>
  <v-container>
    <v-progress-circular
      v-if="loading"
      class="spinner"
      size="50"
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
    <v-container>
      <v-row>
        <n-link  to="refunds-storage/scan-bag" class="text-ping" v-text="'חזרה'" />
      </v-row>
      <v-row v-for="item of items" :key="item.id" class="block-log">
        <v-col v-if="item.request_from" cols="2" style="display: flex;flex-direction: column">
          <span v-text="`נוצר מ - ${item.request_from}`" />
        </v-col>
        <v-col v-if="item.user && item.created_at" cols="2" style="display: flex;flex-direction: column">
          <span class="log-user" v-text="`שם משתמש-${item.user.first_name} ${item.user.last_name}`" />
          <small> {{ item.created_at | formatDate }} </small>
        </v-col>
        <v-col v-else-if="item.driver" cols="2" style="display: flex;flex-direction: column">
          <span class="log-user" v-text="`שם נהג-${item.driver.first_name} ${item.driver.last_name}`" />
          <small> {{ item.created_at | formatDate }} </small>
        </v-col>
        <v-col cols="8">
          <p v-if="item.title === 'app-delivery-photo'" style="display: inline">צולם מהאפליקציה:</p>
          <img
            v-if="item.title === 'app-delivery-photo'"
            alt="deliveryPhoto"
            :src="item.description.split('~~~')[1]"
            style="width: 6rem; cursor: pointer"
            @click="initPhotoModal(item)"/>
          <span v-else v-text="item.description" />
        </v-col>
      </v-row>
      <v-row class="block-log">
        <v-col cols="9">
          <v-text-field v-model="comment" label="הוספת הערה" />
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
  name: 'RefundsRefundsStorageLogs',
  props: {
    refund: { type: Object, default: () => ({}) }
    // bagNumber: { type: Number, default: null }
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
      console.log(this.$route.params.bagNumber, 'this.$route.params.bagNumber')
      this.loading = true
      this.items = await this.$logsService.list({
        record_id: this.$route.params.bagNumber,
        table_name: 'customerBag'
      })
      this.loading = false
      console.log('items', this.items)
    } catch (e) {
      this.loading = false
      this.$helper.snackbar(e, '_logs created')
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
        table_name: 'customerBag',
        title: 'comment',
        record_id: this.$route.params.bagNumber,
        description: this.comment
      })
      this.items = await this.$logsService.list({
        record_id: this.$route.params.bagNumber,
        table_name: 'customerBag'
      })
      this.loading = false
      this.comment = null
    }
  }
}
</script>

<style lang="scss" scoped>
.spinner {
  margin: 20% 50%;
}
.log-user {
  color: #fa4616;
}

</style>
