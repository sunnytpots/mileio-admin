<template>
  <SectionLayout title="חוקיות" :route-back="{ name: 'settings' }">
    <p>חוקיות</p>
  </SectionLayout>
</template>

<script>
export default {
  name: 'SettingsApi',
  head: { title: 'חוקיות' },
  middleware: ['permissions']
}
</script>

<style lang="scss" scoped>

</style>
