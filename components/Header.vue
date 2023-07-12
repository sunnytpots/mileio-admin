<template>
  <div class="header d-print-none">
    <v-app-bar>
      <n-link class="logo" to="/coordinator" />

      <Branches />

      <DriverManagement :listType="'multiple'" v-if="$route.name !== 'coordinator-maps'"/>

      <MapMileio />

      <ProfileNav />
    </v-app-bar>
  </div>
</template>

<script>
export default {
  name: 'Header'
}
</script>

<style lang="scss" scoped>
.header {
  .v-sheet.v-app-bar.v-toolbar:not(.v-sheet--outlined) {
    box-shadow: none;
  }
  .theme--light.v-app-bar.v-toolbar.v-sheet {
    background-color: #22272E;
    color: #fff;
  }

  .btn-link{
    color: #fff;
  }
}
</style>
