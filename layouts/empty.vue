<template>
  <v-app class="empty-layout">
    <h1>empty-layout</h1>

    <pre>
      {{ error }}
    </pre>

    <nuxt />
  </v-app>
</template>

<script>
export default {
  props: ['error'],

  created () {
    console.log(this.error, 'created')
  }
}
</script>
