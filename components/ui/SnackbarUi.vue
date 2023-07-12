<template>
  <div :class="classes">
    <v-snackbar :value="snackbar.value" @input="$store.commit('setSnackbar', { value: $event })" :timeout="snackbar.timeout || 5000">
      <template #default>
        {{ snackbar.message }}
      </template>

      <template #action>
        <v-btn @click.prevent="$store.commit('setSnackbar', { value: false })">
          Close
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'SnackbarUi',

  computed: {
    ...mapState(['snackbar']),

    classes () {
      return [
        'mileio-snackbar d-print-none',
        { 'success-snackbar': this.snackbar.success },
        { 'error-snackbar': this.snackbar.error }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.mileio-snackbar{
  &.success-snackbar {
    ::v-deep {
      .v-snack__wrapper.theme--dark{
        background-color: #4caf50;
        border-color: #4caf50;
        color: #fff;
      }
    }
  }
  &.error-snackbar {
    ::v-deep {
      .v-snack__wrapper.theme--dark{
        background-color: #ff5252;
        border-color: #ff5252;
        color: #fff;
      }
    }
  }
}
</style>
