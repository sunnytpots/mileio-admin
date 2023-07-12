<template>
  <v-dialog
    :persistent="persistent"
    :width="width"
    :value="value"
    @input="$emit('input', $event)">
    <div class="dialog-ui-wrap d-print-none">
      <slot />
    </div>
  </v-dialog>
</template>

<script>
export default {
  name: 'DialogUi',

  props: {
    value: { type: Boolean, default: false },
    xl: { type: Boolean, default: false },
    lg: { type: Boolean, default: false },
    md: { type: Boolean, default: false },
    sm: { type: Boolean, default: false },
    xs: { type: Boolean, default: false },
    persistent: { type: Boolean, default: false }
  },

  data () {
    return {
      size: {
        xl: 1200,
        lg: 1000,
        md: 800,
        sm: 500,
        xs: 300
      }
    }
  },

  computed: {
    width () {
      return (this.xl && this.size.xl) ||
        (this.lg && this.size.lg) ||
        (this.md && this.size.md) ||
        (this.sm && this.size.sm) ||
        (this.xs && this.size.xs) ||
        this.size.xs
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-ui-wrap {
  background-color: #fff;
}
</style>
