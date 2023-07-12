<template>
  <div>
    <h1>error vue</h1>
  </div>
</template>

<script>
export default {
  name: 'Error',

  created () {
    console.log(this.messages)
  },
  head: { title: 'שגיאה' }
}
</script>

<style scoped>

</style>
