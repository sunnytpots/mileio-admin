<template>
  <v-container>
    <v-progress-circular
      v-if="loading"
      style="position: absolute;left: 50%;top: 40%"
      :width="5"
      color="#fa4616"
      indeterminate/>
    <v-dialog
      v-model="openDialog"
      max-width="900"
      text-align="-webkit-center"
      class="drawer-modal">
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
        <v-card-actions>
          <v-btn class="btn-primary">
            <a
              target="_blank"
              :href="photoLink"
              v-text="'הורד תמונה'" />
          </v-btn>
        </v-card-actions>
      </div>
    </v-dialog>
    <v-row
      v-for="item of items"
      :key="item.id"
      class="block-log">
      <v-col cols="1">
        <i class="icon icon-settings" />
      </v-col>
      <v-col
        v-if="item.request_from"
        cols="2"
        style="display: flex;flex-direction: column">
        <span v-text="`נוצר מ - ${item.request_from}`" />
      </v-col>
      <v-col cols="2" style="display: flex;flex-direction: column">
        <div v-if="item.user">
          <span
            class="log-user log-title"
            v-text="'שם משתמש:'"/>
          <span
            class="log-user"
            v-text="`${item.user.first_name} ${item.user.last_name}`" />
        </div>
        <div v-else-if="item.target_name">
          <span
            class="log-user log-title"
            v-text="'שם נמען:'"/>
          <span
            class="log-user"
            v-text="item.target_name" />
        </div>
        <div v-else-if="item.driver">
          <span
            class="log-user log-title"
            v-text="'שם נהג'"/>
          <span
            class="log-user"
            v-text="`${item.driver.first_name} ${item.driver.last_name}`" />
        </div>
        <small>{{ item.created_at | formatDate2 }}</small>
        <div v-if="item.branches">
          <span
            v-for="index in item.branches.length <= 4 ? item.branches.length : 4"
            :key="index"
            class="user-branches"
            v-text="item.branches[index] && item.branches[index].name"/>
          <span v-if="item.branches.length > 4" v-text="'...'"/>
        </div>
      </v-col>
      <v-col cols="1">
        <span class="log-status log-title" v-text="'משלוח מספר:'" />
        <span class="log-status" v-text="`${item.record_id}`" />
      </v-col>
      <v-col cols="5">
        <p
          v-if="item.title === 'app-delivery-photo-taken'"
          style="display: inline"
          v-text="'צולם מהאפליקציה - חבילה נמסרה:'"/>
        <p
          v-else-if="item.title === 'app-delivery-photo-delivered'"
          style="display: inline"
          v-text="'צולם מהאפליקציה - חבילה נלקחה:'"/>
        <p
          v-else-if="item.title === 'app-delivery-photo'"
          style="display: inline"
          v-text="'צולם מהאפליקציה:'"/>
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
          class="input-ui"
          rounded
          filled/>
      </v-col>
      <v-col cols="3" :loading="loading">
        <v-btn
          class="btn-primary"
          @click.prevent="saveLogComment" >
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
    try {
      this.loading = true
      this.items = await this.$logsService.list({
        record_id: this.delivery.tapuz_number,
        table_name: 'deliveries'
      })
      this.loading = false
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    initPhotoModal (item) {
      this.photoLink = item.description.split('~~~')[1]
      this.openDialog = true
    },
    async saveLogComment () {
      try {
        this.loading = true
        await this.$logsService.writeInfoToLog({
          table_name: 'deliveries',
          title: 'comment',
          record_id: Number(this.delivery.tapuz_number),
          description: this.comment
        })
        this.items = await this.$logsService.list({
          record_id: this.delivery.tapuz_number,
          table_name: 'deliveries'
        })
        this.loading = false
        this.comment = null
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'saveLogComment')
      }
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
.log-status.log-title{
  font-size: 12px;
  display: block;
}
.log-user{
  color: #fa4616;
}
.log-user.log-title {
  display: block;
}
.user-branches {
  display: block;
  font-size: 12px;
}
</style>
