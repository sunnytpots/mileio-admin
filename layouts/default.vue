<template>
  <v-app id="mile-io" :class="`layout-default layout-${$route.name}`">
    <Header />
    <v-main>
      <Navigation />
      <nuxt />
    </v-main>
    <SnackbarUi />
  </v-app>
</template>

<script>
export default {
  name: 'Default'
}
</script>
