<template>
  <div class="GMap__DrawingManager">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'GMapDrawingManager',

  props: {
    value: { type: Array, default: null },
    inside: { type: Boolean, default: false },
    parent: { type: Boolean, default: false },
    child: { type: Boolean, default: false }
  },

  data () {
    return {
      google: null,
      map: null,
      drawingManager: null
    }
  },

  created () {
    if (this.$parent.google) {
      this.init()
    }
  },

  methods: {
    init () {
      this.drawingManager = new this.$parent.google.maps.drawing.DrawingManager({
        map: this.$parent.map,
        drawingMode: this.$parent.google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
          position: this.$parent.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            this.$parent.google.maps.drawing.OverlayType.POLYGON
          ]
        },
        polygonOptions: {
          fillColor: this.inside ? '#0000ff' : '#ff0000',
          fillOpacity: 0.2,
          strokeColor: this.inside ? '#0000ff' : '#ff0000',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          clickable: true,
          editable: true,
          draggable: true,
          zIndex: 1
        }
      })

      this.$parent.google.maps.event.addListener(this.drawingManager, 'polygoncomplete', this.polygonComplete)

      this.google = this.$parent.google
      this.map = this.$parent.map

      this.$children.forEach(child => child.init())
    },

    /**
     * get instance of POLYGON
     * @param event<POLYGON>
     */
    polygonComplete (event) {
      const vertices = event.getPath()
      const latLng = []
      let findPolygon = false
      let findParentPolygonForChild = false
      let findPolygonChild = false

      for (let i = 0; i < vertices.getLength(); i++) {
        const getAt = vertices.getAt(i)

        if (this.parent) {
          this.$parent.$children.forEach(c => {
            if (findPolygon) {
              return false
            }

            if (c.$options.name === 'GMapPolygon' && c.parent && !c.edit) {
              findPolygon = this.google.maps.geometry.poly.containsLocation(getAt, c.polygonGM) // check points of this polygon on another polygons

              if (findPolygon) {
                return false
              } else {
                const verticesAnother = c.polygonGM.getPath()

                for (let j = 0; j < verticesAnother.getLength(); j++) {
                  const getAtAnother = verticesAnother.getAt(j)

                  findPolygon = this.google.maps.geometry.poly.containsLocation(getAtAnother, event) // check points of another polygons on this polygon
                  if (findPolygon) {
                    break
                  }
                }
              }
            }
          })

          if (findPolygon) {
            event.setMap(null)
            this.$store.commit('setSnackbar', { value: true, message: 'Error', error: true })
            break
          } else {
            latLng.push({ lat: getAt.lat(), lng: getAt.lng() })
          }
        }

        if (this.child) {
          if (this.$parent.$options.name === 'GMapPolygon') {
            findParentPolygonForChild = this.google.maps.geometry.poly.containsLocation(getAt, this.$parent.polygonGM)

            if (findParentPolygonForChild) {
              this.$parent.$children.forEach(c => {
                if (findPolygonChild) {
                  return false
                }

                if (c.$options.name === 'GMapPolygon' && c.child) {
                  findPolygonChild = this.google.maps.geometry.poly.containsLocation(getAt, c.polygonGM) // check points of this polygon on another polygons

                  if (findPolygonChild) {
                    return false
                  } else {
                    const verticesAnother = c.polygonGM.getPath()

                    for (let j = 0; j < verticesAnother.getLength(); j++) {
                      const getAtAnother = verticesAnother.getAt(j)

                      findPolygonChild = this.google.maps.geometry.poly.containsLocation(getAtAnother, event) // check points of another polygons on this polygon
                      if (findPolygonChild) {
                        break
                      }
                    }
                  }
                }
              })
              if (findPolygonChild) {
                event.setMap(null)
                this.$store.commit('setSnackbar', { value: true, message: 'Error', error: true })
                break
              } else {
                latLng.push({ lat: getAt.lat(), lng: getAt.lng() })
              }
            } else {
              event.setMap(null)
              this.$store.commit('setSnackbar', { value: true, message: 'Error', error: true })
              break
            }
          }
        }
      }

      if (this.parent && !findPolygon) {
        event.setMap(null)
        this.drawingManager.setMap(null)
        this.$emit('input', latLng)
        this.$emit('drawn')
      }

      if (this.child && findParentPolygonForChild && !findPolygonChild) {
        event.setMap(null)
        this.drawingManager.setMap(null)
        this.$emit('input', latLng)
        this.$emit('drawn')
      }
    }
  }
}
</script>

<style scoped>

</style>
