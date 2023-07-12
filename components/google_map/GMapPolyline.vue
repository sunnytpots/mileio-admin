<template>
  <div class="GMap__Polyline">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'GMapPolyline',

  props: {
    value: { type: Array, default: null },
    options: { type: Object, default: () => ({}) },
    edit: { type: Boolean, default: false }
  },

  data () {
    return {
      polyline: null,

      flightPlanCoordinates: [
        { lat: 32.16293982567052, lng: 34.928298046093765 },
        { lat: 32.15038050196612, lng: 34.943683178475254 },
        { lat: 32.14497208353526, lng: 34.95206087562406 },
        { lat: 32.14043517442276, lng: 34.960094362953946 },
        { lat: 32.15048447177927, lng: 34.96304919382533 },
        { lat: 32.162736124032975, lng: 34.961751633001256 },
        { lat: 32.180569299059506, lng: 34.95844976668897 },
        { lat: 32.19627509913386, lng: 34.95614430818275 },
        { lat: 32.222725626972355, lng: 34.974791576367195 }
      ]
    }
  },

  watch: {
    edit (newEdit) {
      this.polyline.setDraggable(newEdit)
      this.polyline.setEditable(newEdit)
    },

    value: {
      handler (newValue) {
        console.log('newValue ::', newValue)
        if (!this.edit) {
          this.polyline.setOptions({ paths: newValue })
        }
      },
      deep: true
    }
  },

  created () {
    if (this.$parent.google && !this.edit) {
      this.init()
    }
  },

  methods: {
    init () {
      this.polyline = new this.$parent.google.maps.Polyline({
        map: this.$parent.map,
        path: this.value,
        geodesic: true,
        strokeColor: this.options && this.options.strokeColor ? this.options.strokeColor : '#0000ff',
        strokeOpacity: 1.0,
        strokeWeight: this.options && this.options.strokeWeight ? this.options.strokeWeight : 2,
        editable: this.edit,
        draggable: this.edit
      })

      console.log(this.$parent.google.maps.event)
      console.log(this.polyline)

      this.$parent.google.maps.event.addListener(this.polyline.getPath(), 'insert_at', this.positionHandler)
      this.$parent.google.maps.event.addListener(this.polyline.getPath(), 'set_at', this.positionHandler)
    },

    positionHandler () {
      const vertices = this.polyline.getPath()
      const latLng = []
      for (let i = 0; i < vertices.getLength(); i++) {
        const getAt = vertices.getAt(i)
        latLng.push({ lat: getAt.lat(), lng: getAt.lng() })
      }

      this.$emit('input', latLng)
    }
  }
}
</script>

<style scoped>

</style>
