<template>
  <div :class="['section-layout', classes, { 'd-none d-print-block': print }]">
    <div :class="['section-layout-header', ['coordinator', 'coordinator-delivery', 'coordinator-logs'].includes($route.name) ? 'coordinator-header' : '']">
      <h1 class="section-layout-title" v-text="title" />

      <slot name="header" />

      <n-link
        v-if="routeBack"
        :to="routeBack"
        class="text-ping"
        v-text="'חזרה'" />
    </div>

    <div class="section-layout-body">
      <v-container fluid>
        <v-row justify="center">
          <v-col :cols="cols">
            <slot />
          </v-col>
        </v-row>
      </v-container>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SectionLayout',

  props: {
    title: { type: String, default: '' },
    sm: { type: Boolean, default: false },
    md: { type: Boolean, default: false },
    lg: { type: Boolean, default: false },
    routeBack: { type: Object, default: null },
    classes: { type: String, default: '' },
    print: { type: Boolean, default: false }
  },

  computed: {
    cols () {
      if (this.sm) {
        return 8
      } else if (this.md) {
        return 9
      } else if (this.lg) {
        return 10
      } else {
        return 12
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.section-layout{
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  flex-wrap: nowrap;
  min-width: 0;
  padding: 0 2rem 0 .55rem;
  background-color: #f8f8fd;
  height: 100%;
}
.section-layout-header{
  display: flex;
  justify-content: space-between;
  padding: 1.6rem 1rem 1.2rem 2.1rem;

}
.section-layout-title{
  font-size: 1.4rem;
}
</style>
