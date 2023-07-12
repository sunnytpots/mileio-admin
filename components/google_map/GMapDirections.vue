<template>
  <div class="GMap__Directions">
    <slot />
  </div>
</template>

<script>
import socket from '~/plugins/socket.io'

export default {
  name: 'GMapDirections',

  props: {
    waypoints: { type: Array, default: null },
    deliveryDetails: { type: Array, default: null },
    driverStartPosition: { type: Object, default: null },
    driverName: { type: String, default: '' },
    driverSelected: { type: Number, default: null }
  },
  data () {
    return {
      markers: [],
      origin: null,
      destination: null,
      response: null,
      position: null,
      driverMarker: null,
      directionsService: {},
      directionsRenderer: {},
      markerIcon: require('../../assets/images/icons/box.svg'),
      driverIcon: require('../../assets/images/icons/truck-dark.svg'),
      boxIcon: require('../../assets/images/icons/square-orange.svg')
    }
  },
  mounted () {
    if (!this.driverSelected) {
      return
    }
    // const socketString = this.driverSelected ? `set-driver-position-${this.driverSelected}` : ''
    // socket.on(socketString, position => {
    //   if (position) {
    //     console.log('position', position)
    //     if (this.driverMarker) {
    //       this.driverMarker.setMap(null)
    //     }
    //     this.driverMarker = this.makeMarker(position.location, this.driverName, null, true)
    //   }
    // })
    this.$nuxt.$on('onPopupMarker', index => {
      const foundMarker = this.markers.find(marker => marker.index === index)
      console.log('foundMarker', foundMarker)
      if (!foundMarker) {
        return
      }
      const foundMarkerPosition = {
        lat: foundMarker.marker.getPosition().lat(),
        lng: foundMarker.marker.getPosition().lng()
      }
      for (let i = 0; i < this.markers.length; i++) {
        const currentMarkerPosition = {
          lat: this.markers[i].marker.getPosition().lat(),
          lng: this.markers[i].marker.getPosition().lng()
        }
        if (i + 1 !== index &&
          (foundMarkerPosition.lat === currentMarkerPosition.lat &&
            foundMarkerPosition.lng === currentMarkerPosition.lng)) {
          this.markers[i].marker.setVisible(false)
        }
      }
      foundMarker.infoWindow.open({
        anchor: foundMarker.marker,
        map: this.$parent.map,
        shouldFocus: false
      })
    })
  },

  methods: {
    async init () {
      try {
        const service = new this.$parent.google.maps.DirectionsService()
        // Divide route to several parts because max stations limit is 25 (23 waypoints + 1 origin + 1 destination)
        const parts = []

        for (let i = 0, max = 25 - 1; i < this.waypoints.length; i = i + max) {
          parts.push(this.waypoints.slice(i, i + max + 1))
        }

        // Create all the markers and translate them
        this.translateMarkers()
        for (let i = 0; i < parts.length; i++) {
          const unlimitedWaypoints = []
          for (let j = 1; j < parts[i].length - 1; j++) {
            unlimitedWaypoints.push(parts[i][j])
          }
          // Send request
          this.origin = parts[i][0].location
          this.destination = parts[i][parts[i].length - 1].location
          const response = await service.route({
            origin: this.origin,
            destination: this.destination,
            waypoints: unlimitedWaypoints,
            optimizeWaypoints: false,
            travelMode: this.$parent.google.maps.TravelMode.DRIVING
          })
          const renderer = new this.$parent.google.maps.DirectionsRenderer({
            suppressMarkers: true,
            preserveViewport: true
          })
          renderer.setMap(this.$parent.map)
          renderer.setDirections(response)
        }
        this.$emit('alarmError', false)
      } catch (err) {
        console.log('Directions init error', err)
        console.log('origin', this.origin)
        console.log('destination', this.destination)
        this.$store.commit('setSnackbar', { value: true, message: 'חלה שגיאה ביצירת המסלול בתצוגה המקדימה', error: true })
        this.$emit('alarmError', true)
      }
    },
    translateMarkers () {
      for (let i = 0; i < this.deliveryDetails.length; i++) {
        const address = {
          city: this.deliveryDetails[i].address.correct_long_city_name,
          street: this.deliveryDetails[i].address.correct_long_street_name,
          streetNumber: this.deliveryDetails[i].address.correct_street_number,
          barcode: this.deliveryDetails[i].barcode
        }
        this.makeMarker({
          lat: Number(this.deliveryDetails[i].address.lat),
          lng: Number(this.deliveryDetails[i].address.lng)
        }, i + 1, address)
      }
      if (this.driverStartPosition) {
        this.driverMarker = this.makeMarker({
          lat: Number(this.driverStartPosition.lat),
          lng: Number(this.driverStartPosition.lng)
        }, this.driverName, null, true)
      }
    },
    makeMarker (position, index, address, isDriver = false) {
      const marker = new this.$parent.google.maps.Marker({
        map: this.$parent.map,
        position,
        title: !isDriver ? `כתובת:  ${address.city} ${address.street} ${address.streetNumber}\nברקוד:   ${address.barcode}` : `מיקום נוכחי:  ${this.driverName}`,
        label: !isDriver ? `${index}` : '',
        icon: isDriver ? this.driverIcon : null
      })
      if (!isDriver) {
        const infoWindow = new this.$parent.google.maps.InfoWindow({
          content: this.markerPopupMaker(address)
        })
        marker.addListener('click', () => {
          infoWindow.open({
            anchor: marker,
            map: this.$parent.map,
            shouldFocus: false
          })
        })
        this.markers.push({
          index,
          marker,
          infoWindow
        })
      }
      return marker
    },
    markerPopupMaker (address) {
      return `<div style="direction: rtl;">
        <img src=${this.boxIcon}
        alt="package"
        class="boxIcon"
        style="width: 20px;
        height: 20px;
        display: block;
        margin-left: auto;
        margin-right: auto">
        <div style="padding: 10px; font-family: inherit;">
          <div>עיר:  <h4 style="color: #fa4616; display: inline">${address.city}</h4></div>
          <div>רחוב:  <h4 style="color: #fa4616; display: inline">${address.street} ${address.streetNumber}</h4></div>
          <div>ברקוד:  <h4 style="color: #fa4616; display: inline">${address.barcode}</h4></div>
        </div>
    </div>`
    }
  }
}
</script>

<style scoped>
.boxIcon {
  width: 20px !important;
  height: 20px !important;
  display: block !important;
  margin-left: auto !important;
  margin-right: auto !important;
}
</style>
