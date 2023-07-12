<template>
  <SectionLayout title="רכז">
    טוען נתונים...
  </SectionLayout>
</template>

<script>
export default {
  name: 'Index',

  middleware: ['permissions'],

  created () {
    this.$router.push({ name: 'coordinator' })
  }
}
</script>
