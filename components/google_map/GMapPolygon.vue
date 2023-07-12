<template>
  <div class="GMap__Polygon">
    <slot />
  </div>
</template>

<script>
export default {
  name: 'GMapPolygon',

  props: {
    value: { type: Array, default: null },
    options: { type: Object, default: () => ({}) },
    polygon: { type: Object, default: () => ({}) },
    edit: { type: Boolean, default: false },
    inside: { type: Boolean, default: false },
    child: { type: Boolean, default: false },
    parent: { type: Boolean, default: false },
    color: {
      type: String,
      default: 'red',
      validator: value => (['black', 'red', 'blue', 'green'].includes(value))
    }
  },

  data () {
    return {
      google: null,
      map: null,
      polygonGM: null,
      findPolygon: -1,
      saveLatLng: [],
      marker: null,
      drag: false,
      colors: {
        black: '#000000',
        red: '#FF0000',
        blue: '#0000FF',
        green: '#00FF00'
      }
    }
  },

  computed: {
    colorPolygon () {
      return this.colors[this.color]
    }
  },

  watch: {
    color () {
      this.polygonGM.setOptions({
        strokeColor: this.colorPolygon,
        fillColor: this.colorPolygon
      })
    },

    value: {
      handler (newValue, oldValue) {
        // if (!this.edit) {
        //   this.polygonGM.setOptions({ paths: newValue })
        // }

        // this.polygonGM.setOptions({ paths: newValue })

        if (!oldValue.length) {
          // this.polygonGM.setOptions({ paths: newValue })
          // this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandler)
          // this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandler)

          // this.polygonGM.addListener('dragend', this.checkContainsLocation)
        }
      },
      deep: true
    },

    edit (newEdit) {
      this.polygonGM.setOptions({ editable: newEdit, draggable: newEdit })
    },

    options: {
      handler (newValue) {
        if (!this.edit) {
          this.polygonGM?.setOptions({ ...this.options })
        }
      },
      deep: true
    }
  },

  created () {
    if (this.$parent.google) {
      this.saveLatLng = this.value
      this.init()
    }
  },

  methods: {
    init () {
      this.polygonGM = new this.$parent.google.maps.Polygon({
        map: this.$parent.map,
        ...this.value && { paths: this.value },
        strokeColor: this.colorPolygon,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: this.colorPolygon,
        fillOpacity: 0.2,
        editable: this.edit,
        draggable: this.edit,
        ...this.options
      })

      if (this.polygonGM.getPath()) {
        this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
        this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)

        this.polygonGM.addListener('dragstart', this.isDragstart)
        this.polygonGM.addListener('dragend', this.positionHandler)
        this.polygonGM.addListener('click', () => this.$emit('click'))
      }

      this.google = this.$parent.google
      this.map = this.$parent.map

      this.$children.forEach(child => child.init())
    },

    positionHandlerSetAt (event) {
      if (!this.drag) {
        const vertices = this.polygonGM.getPath()
        const latLng = []
        let findPolygon = false
        let findPolygonChild = false
        let findParentPolygonForChild = false

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

                    findPolygon = this.google.maps.geometry.poly.containsLocation(getAtAnother, this.polygonGM) // check points of another polygons on this polygon
                    if (findPolygon) {
                      break
                    }
                  }
                }
              }
            })

            if (findPolygon) {
              this.polygonGM.setOptions({ paths: this.value })
              this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
              this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)
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

                  if (c.$options.name === 'GMapPolygon' && c.child && !c.edit) {
                    findPolygonChild = this.google.maps.geometry.poly.containsLocation(getAt, c.polygonGM) // check points of this polygon on another polygons

                    if (findPolygonChild) {
                      return false
                    } else {
                      const verticesAnother = c.polygonGM.getPath()

                      for (let j = 0; j < verticesAnother.getLength(); j++) {
                        const getAtAnother = verticesAnother.getAt(j)

                        findPolygonChild = this.google.maps.geometry.poly.containsLocation(getAtAnother, this.polygonGM) // check points of another polygons on this polygon
                        if (findPolygonChild) {
                          break
                        }
                      }
                    }
                  }
                })

                if (findPolygonChild) {
                  this.polygonGM.setOptions({ paths: this.value })
                  this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
                  this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)
                  this.$store.commit('setSnackbar', { value: true, message: 'Error', error: true })
                  break
                } else {
                  latLng.push({ lat: getAt.lat(), lng: getAt.lng() })
                }
              } else {
                this.polygonGM.setOptions({ paths: this.value })
                this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
                this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)
                this.$store.commit('setSnackbar', { value: true, message: 'Error', error: true })
                break
              }
            }
          }
        }

        if (this.parent && !findPolygon) {
          this.$emit('input', latLng)
        }

        if (this.child && findParentPolygonForChild && !findPolygonChild) {
          this.$emit('input', latLng)
        }
      }
    },

    positionHandlerInsertAt (event) {
      const vertices = this.polygonGM.getPath()
      const latLng = []
      let findPolygon = false
      let findPolygonChild = false
      let findParentPolygonForChild = false

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

                  findPolygon = this.google.maps.geometry.poly.containsLocation(getAtAnother, this.polygonGM) // check points of another polygons on this polygon
                  if (findPolygon) {
                    break
                  }
                }
              }
            }
          })

          if (findPolygon) {
            this.polygonGM.setOptions({ paths: this.value })
            this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
            this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)
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

                if (c.$options.name === 'GMapPolygon' && c.child && !c.edit) {
                  findPolygonChild = this.google.maps.geometry.poly.containsLocation(getAt, c.polygonGM) // check points of this polygon on another polygons

                  if (findPolygonChild) {
                    return false
                  } else {
                    const verticesAnother = c.polygonGM.getPath()

                    for (let j = 0; j < verticesAnother.getLength(); j++) {
                      const getAtAnother = verticesAnother.getAt(j)

                      findPolygonChild = this.google.maps.geometry.poly.containsLocation(getAtAnother, this.polygonGM) // check points of another polygons on this polygon
                      if (findPolygonChild) {
                        break
                      }
                    }
                  }
                }
              })

              if (findPolygonChild) {
                this.polygonGM.setOptions({ paths: this.value })
                this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
                this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)
                this.$store.commit('setSnackbar', { value: true, message: 'Error', error: true })
                break
              } else {
                latLng.push({ lat: getAt.lat(), lng: getAt.lng() })
              }
            } else {
              this.polygonGM.setOptions({ paths: this.value })
              this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
              this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)
              this.$store.commit('setSnackbar', { value: true, message: 'Error', error: true })
              break
            }
          }
        }
      }

      if (this.parent && !findPolygon) {
        this.$emit('input', latLng)
      }

      if (this.child && findParentPolygonForChild && !findPolygonChild) {
        this.$emit('input', latLng)
      }
    },

    isDragstart (event) {
      if (!this.drag) {
        this.drag = true
      }
    },

    positionHandler (event) {
      this.drag = false
      const vertices = this.polygonGM.getPath()
      const latLng = []
      let findPolygon = false
      let findPolygonChild = false
      let findParentPolygonForChild = false

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

                  findPolygon = this.google.maps.geometry.poly.containsLocation(getAtAnother, this.polygonGM) // check points of another polygons on this polygon
                  if (findPolygon) {
                    break
                  }
                }
              }
            }
          })

          if (findPolygon) {
            this.polygonGM.setOptions({ paths: this.value })
            this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
            this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)
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

                if (c.$options.name === 'GMapPolygon' && c.child && !c.edit) {
                  findPolygonChild = this.google.maps.geometry.poly.containsLocation(getAt, c.polygonGM) // check points of this polygon on another polygons

                  if (findPolygonChild) {
                    return false
                  } else {
                    const verticesAnother = c.polygonGM.getPath()

                    for (let j = 0; j < verticesAnother.getLength(); j++) {
                      const getAtAnother = verticesAnother.getAt(j)

                      findPolygonChild = this.google.maps.geometry.poly.containsLocation(getAtAnother, this.polygonGM) // check points of another polygons on this polygon
                      if (findPolygonChild) {
                        break
                      }
                    }
                  }
                }
              })

              if (findPolygonChild) {
                this.polygonGM.setOptions({ paths: this.value })
                this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
                this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)
                this.$store.commit('setSnackbar', { value: true, message: 'Error', error: true })
                break
              } else {
                latLng.push({ lat: getAt.lat(), lng: getAt.lng() })
              }
            } else {
              this.polygonGM.setOptions({ paths: this.value })
              this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'insert_at', this.positionHandlerInsertAt)
              this.$parent.google.maps.event.addListener(this.polygonGM.getPath(), 'set_at', this.positionHandlerSetAt)
              this.$store.commit('setSnackbar', { value: true, message: 'Error', error: true })
              break
            }
          }
        }
      }

      if (this.parent && !findPolygon) {
        this.$emit('input', latLng)
      }

      if (this.child && findParentPolygonForChild && !findPolygonChild) {
        this.$emit('input', latLng)
      }
    }
  }
}
</script>

<style lang="scss" scoped>

</style>
