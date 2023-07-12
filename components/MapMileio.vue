<template>
  <div class="map-mileio">
    <button class="btn-icon">
      <i class="icon icon-map" />
      <a target="_blank" href="/coordinator-maps" v-text="'תצוגת מפה'" />
    </button>
    <DialogUi v-model="dialog" xl>
      <GoogleMap>
        <GMapMarkerIO :position="position" icon="user" />
      </GoogleMap>
    </DialogUi>
  </div>
</template>

<script>
export default {
  name: 'MapMileio',

  data () {
    return {
      dialog: false,
      openCoordinatorMaps: false,
      position: { lat: 32.41471663972185, lng: 35.18578241341798 }
    }
  }
}
</script>

<style lang="scss" scoped>
.map-mileio{
  //margin-left: 3rem;
  //margin-left: 850px;
}
</style>
