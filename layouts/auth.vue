<template>
  <v-app id="mile-io" :class="`layout-auth layout-${$route.name}`">
    <v-main>
      <nuxt />
    </v-main>

    <SnackbarUi />
  </v-app>
</template>

<script>
export default {
  name: 'Auth'
}
</script>
