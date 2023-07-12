<template>
  <SectionLayout title="מחירונים" :route-back="{ name: 'settings' }" sm>
    <v-tabs background-color="transparent" color="#ff3066">
      <v-tab v-for="(tab, index) of tabs" :key="index" :to="tab.to">
        {{ tab.name }}
      </v-tab>
    </v-tabs>

    <n-child />
  </SectionLayout>
</template>

<script>
export default {
  name: 'SettingsPricing',
  middleware: ['permissions'],

  data () {
    return {
      tabs: [
        { name: 'מחירון לקוחות', to: { name: 'settings-pricing-customer' } },
        { name: 'מחירון TA-BOX', to: { name: 'settings-pricing-distribution-point' } },
        { name: 'מחירון נהגים', to: { name: 'settings-pricing-driver' } },
        { name: 'מחירון פוליגונים', to: { name: 'settings-pricing-polygon' } }
      ]
    }
  },
  head: { title: 'מחירונים' }
}
</script>

<style lang="scss" scoped>

</style>
