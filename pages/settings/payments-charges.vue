<template>
  <SectionLayout title="תשלומים וחיובים לחודש נוכחי" :route-back="{ name: 'settings' }" lg>
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
  name: 'SettingsPaymentsCharges',
  head: { title: 'תשלומים וחיובים' },
  middleware: ['permissions'],

  data () {
    return {
      tabs: [
        { name: 'תשלומי לקוחות', to: { name: 'settings-payments-charges-customers' } },
        { name: 'תשלומי נקודות חלוקה', to: { name: 'settings-payments-charges-distribution-points' } },
        { name: 'תשלומי נהגים', to: { name: 'settings-payments-charges-drivers' } }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
