<template>
  <div
    class="logs-dialog-container"
    @mouseover.stop="currentIcon = 'icon-info-on-hover'"
    @mouseleave="currentIcon = 'icon-info'">
    <i
      :class="`icon ${currentIcon}`"
      @click.stop="showPreview()"/>
    <v-dialog
      v-model="showPreviewDialog"
      transition="dialog-bottom-transition"
      max-width="500"
      hide-overlay
      light
      text-align="-webkit-center"
      class="preview-modal">
      <div class="logs-title">
        <i class="icon icon-info"/>
        <p v-text="'מידע נוסף'"/>
      </div>
      <div class="logs-content">
        <v-progress-circular
          v-if="loadingPreview"
          class="spinner"
          size="50"
          color="#fa4616"
          indeterminate/>
        <v-row v-else class="block-log">
          <v-col>
            <p
              v-for="(extraDetail, key) in extraDetails"
              :key="key"
              class="details"
              v-text="`${extraDetail && extraDetail.trim()}`"/>
          </v-col>
        </v-row>
      </div>
      <div class="comments-container">
        <p class="comment-title" v-text="'מידע על ה-callback: '"/>
        <v-row v-if="callbackDetails.length > 0" class="block-log comments">
          <v-col>
            <p
              v-for="(callbackDetail, key) in callbackDetails"
              :key="key"
              class="details"
              v-text="callbackDetail"/>
          </v-col>
        </v-row>
        <v-row v-else class="block-log comments">
          <v-col>
            <p class="comment-title" v-text="'אין מידע על ה-callback'"/>
          </v-col>
        </v-row>
      </div>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'ErrorLogsDialog',

  props: {
    errorLog: { type: Object, default: () => ({}) }
  },

  data () {
    return {
      extraDetails: [],
      callbackDetails: [],
      currentIcon: 'icon-info',
      loadingPreview: false,
      showPreviewDialog: false
    }
  },
  watch: {
    showPreviewDialog (newVal) {
      if (!newVal) {
        this.loadingPreview = []
      }
    }
  },
  created () {
  },
  methods: {
    showPreview () {
      console.log('showPreview', this.errorLog)
      this.$emit('reset-other-logs')
      if (!this.errorLog) {
        return
      }

      this.extraDetails = this.errorLog.extra_details.split('\n')
      console.log('this.extraDetails', this.extraDetails)
      if (this.errorLog.callback?.response) {
        const callback = this.errorLog.callback.response
        this.callbackDetails = [
          `barcode: ${callback.barcode}`,
          `delivery_status_key: ${callback.delivery_status_key}`,
          `delivery_status_name: ${callback.delivery_status_name}`,
          `order_number: ${callback.order_number}`,
          `tapuz_number: ${callback.tapuz_number}`
        ]
      }
      console.log('this.callbackDetails', this.callbackDetails)
      this.showPreviewDialog = true
      this.loadingPreview = true
      this.loadingPreview = false
    }
  }
}
</script>

<style lang="scss" scoped>
.details {
  text-align: start;
  direction: ltr;
}
.spinner {
  margin-right: 220px;
}
.logs-dialog-container {
  margin: auto 15%;
}
.icon-info-on-hover {
  cursor: pointer;
}
::v-deep {
  .v-dialog--active {
    background-color: #ffffff;
    height: 730px;
  }
  .block-log {
    width: auto;
  }
  .block-log.comments {
    //height: 70px !important;
    //background-color: #E8E8E8;
    margin-top: 5px !important;
    margin-bottom: 0 !important;
    font-size: 14px;
  }
  .logs-title {
    //background-color: #7C7C7C;
    padding-right: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    p {
      padding-right: 10px;
      padding-top: 15px;
      font-size: 20px;
    }
  }
  .logs-content {
    height: 350px;
    overflow-y: auto;
  }
  .comments-container {
    .comment-title {
      font-size: 12px;
      margin-right: 17px;
      margin-top: 10px;
      margin-bottom: 0;
    }
  }
}
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
