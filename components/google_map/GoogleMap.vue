<template>
  <div class="google-map" ref="googleMap">
    <GMap :center="center" :zoom="zoom" :options="{ region: 'IL' }" @init="getGoogle">
      <slot />
    </GMap>
  </div>
</template>

<script>
export default {
  name: 'GoogleMap',
  props: {
    center: { type: Object, default: () => ({ lat: 32.41471663972185, lng: 35.18578241341798 }) },
    zoom: { type: Number, default: 10 }
  },
  methods: {
    getGoogle (google) {
      // const GMap = this.$children.find(c => c.$options.name === 'GMap')
    }
  }
}
</script>

<style lang="scss" scoped>
.google-map{
  width: 100%;
  height: 800px;

  ::v-deep {
    .GMap, .GMap__Wrapper{
      width: 100%;
      height: 100%;
    }
  }
}
</style>
