<template>
  <div class="GMap__Marker" />
</template>

<script>
export default {
  name: 'GMapMarkerIO',

  props: {
    position: { type: Object, default: () => ({}) },
    index: { type: Number, default: null },
    delivery_id: { type: Number, default: null },
    driverName: { type: String, default: '' },
    icon: {
      type: String,
      default: '',
      validator: () => (['driver', 'user'])
    }
  },

  data () {
    return {
      marker: null,
      markerLoaded: false,
      icons: {
        driver: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
        truck: require('../../assets/images/icons/truck-dark.svg'),
        user: require('../../assets/images/icons/drivers.svg'),
        delivery: require('../../assets/images/icons/square.svg')
      }
    }
  },
  computed: {
    options () {
      return {
        icon: this.icons[this.icon],
        isDriverMarker: false
      }
    }
  },

  methods: {
    init () {
      this.marker = new this.$parent.google.maps.Marker({
        position: this.position,
        map: this.$parent.map,
        title: this.icon === 'truck' ? `שם נהג:  ${this.driverName}` : `מספר משלוח: ${this.delivery_id}`,
        label: this.index ? `${this.index + 1}` : null,
        icon: this.icons[this.icon]
      })
      // Add a click listener for each marker, and set up the info window.
      const infoWindow = new this.$parent.google.maps.InfoWindow()
      this.marker.addListener('click', () => {
        infoWindow.close()
        infoWindow.setContent(this.marker.getTitle())
        infoWindow.open(this.marker.getMap(), this.marker)
      })
      this.markerLoaded = true
      this.$parent.markers.push(this.marker)
    }
  }
}
</script>

<style scoped>

</style>
