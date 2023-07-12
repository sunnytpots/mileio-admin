<template>
  <div class="card-ui">
    <div v-if="$slots.header" :class="['card-ui-header', { 'card-ui-header-padding': paddingHeader }]">
      <slot name="header" />
    </div>

    <div :class="classesBody">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'CardUi',

  props: {
    paddingHeader: { type: Boolean, default: false },
    paddingBody: { type: Boolean, default: false },
    paddingBodySm: { type: Boolean, default: false }
    // overflow: { type: Boolean, default: false }
  },

  computed: {
    classesBody () {
      return [
        'card-ui-body',
        { 'card-ui-body-padding': this.paddingBody },
        { 'card-ui-body-padding': this.paddingBody }
        // { 'card-ui-body-overflow': this.overflow }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.card-ui{
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 0 7px -3px #0000005e;
}
.card-ui-header{
  padding: .75rem 1.2rem;
}
.card-ui-header-padding{
  padding: 2.5rem 1.6rem;
}
.card-ui-body-padding{
  padding: 4.7rem 3.7rem;
}
.card-ui-body-padding-sm{
  padding: 2rem;
}
.card-ui-body-overflow{
  max-height: 50vh;
  overflow-y: auto;
}
</style>
