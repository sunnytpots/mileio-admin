<template>
  <div class="delete-button">
    <v-btn
      class="btn-secondary"
      :loading="loading"
      @click.stop="checkWarning">
      <i class="icon icon-bucket" />
    </v-btn>
    <v-dialog
      v-model="onWarningDialog"
      persistent
      max-width="340"
      text-align="-webkit-center">
      <div style="background-color: #f8f8fd">
        <v-card-title class="headline">
          {{ warningMessage }}
        </v-card-title>
        <v-card-actions>
          <v-btn
            class="white--text"
            color="#fa4616"
            @click="onWarningDialog = false">
            ביטול
          </v-btn>
          <v-spacer />
          <v-btn
            class="white--text"
            color="#fa4616"
            @click="onDelete(); onWarningDialog = false">
            אישור
          </v-btn>
        </v-card-actions>
      </div>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'DeleteButton',

  props: {
    url: { type: String, default: '' },
    hasWarning: { type: Boolean, default: false },
    warningMessage: { type: String, default: 'האם אתה בטוח שברצונך לבצע פעולה זו?' },
    apiMethod: { type: String, default: '$delete' },
    reqBody: { type: Object, default: () => ({}) }
  },

  data () {
    return {
      loading: false,
      onWarningDialog: false
    }
  },

  methods: {
    checkWarning () {
      if (this.hasWarning) {
        return this.onWarningDialog = true
      }
      return this.onDelete()
    },
    async onDelete () {
      try {
        this.loading = true
        if (this.url) {
          await this.$axios[this.apiMethod](this.url, this.reqBody)
        }
        this.$emit('deleted', { status: true })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$emit('deleted', { status: false, errors: e })
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .headline {
    font-size: 15px !important;
    text-align: center !important;
  }
  .v-card__title {
    display: block !important;
  }
}
.delete-button{
  .v-btn{
    padding: .2rem;
    height: inherit;
    min-width: inherit;
  }

  .icon{
    width: 16px;
    height: 16px;
  }
}
</style>
