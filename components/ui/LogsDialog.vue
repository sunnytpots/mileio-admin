<template>
  <div class="logs-dialog-container" @mouseover.stop="currentIcon = 'icon-info-on-hover'" @mouseleave="currentIcon = 'icon-info'">
    <i :class="`icon ${currentIcon}`" @click.stop="showPreview()"/>
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
        <p>לוגים</p>
      </div>
      <div class="logs-content">
        <v-progress-circular
          v-if="loadingPreview"
          class="spinner"
          size="50"
          color="#fa4616"
          indeterminate
        />
        <div v-else-if="logsPreview && logsPreview.length > 0">
          <v-row
            v-for="log of logsPreview"
            :key="log.id"
            class="block-log">
            <v-col cols="1">
              <i class="icon icon-settings" />
            </v-col>
            <v-col cols="11">
              <span v-text="log.description" />
            </v-col>
          </v-row>
        </div>
        <v-row v-else class="block-log">
          <v-col>
            <p v-text="'אין לוגים כרגע'"/>
          </v-col>
        </v-row>
      </div>
      <div class="comments-container">
        <p class="comment-title" v-text="'הערות: '"/>
        <v-row class="block-log comments">
          <v-col>
            <p v-if="delivery.comments" v-text="delivery.comments"/>
            <p v-else v-text="'אין הערות'"/>
          </v-col>
        </v-row>
        <p class="comment-title" v-text="'הערות נוספות: '"/>
        <v-row class="block-log comments">
          <v-col>
            <p v-if="delivery.additional_comments" v-text="delivery.additional_comments"/>
            <p v-else v-text="'אין הערות נוספות'"/>
          </v-col>
        </v-row>
        <p class="comment-title" v-text="'הערות מאת נמען: '"/>
        <v-row class="block-log comments">
          <v-col>
            <p v-if="delivery.additional_directive" v-text="delivery.additional_directive"/>
            <p v-else v-text="'אין הערות מאת נמען'"/>
          </v-col>
        </v-row>
      </div>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'LogsDialog',

  props: {
    delivery: { type: Object, default: () => ({}) }
  },

  data () {
    return {
      currentIcon: 'icon-info',
      logsPreview: [],
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
  methods: {
    async showPreview () {
      try {
        this.$emit('reset-other-logs')
        if (!this.delivery) {
          return
        }
        this.showPreviewDialog = true
        this.loadingPreview = true
        this.logsPreview = await this.$logsService.list({
          record_id: this.delivery?.tapuz_number,
          table_name: 'deliveries'
        })
        this.loadingPreview = false
      } catch (e) {
        console.log('showPreview error', e)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
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
    height: 70px !important;
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
