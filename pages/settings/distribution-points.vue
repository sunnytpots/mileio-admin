<template>
  <SectionLayout title="TA-BOX" :route-back="{ name: 'settings' }">
    <p>TA-BOX</p>
  </SectionLayout>
</template>

<script>
export default {
  name: 'SettingsDistributionPoints',
  head: { title: 'TA-BOX' },
  middleware: ['permissions']
}
</script>

<style lang="scss" scoped>

</style>
