<template>
  <SectionLayout
    title="פוליגונים"
    :route-back="{ name: 'settings' }"
    classes="settings-polygons">
    <CardUi padding-body-sm>
      <v-container>
        <v-row class="no-gutters-y">
          <v-col md="3" lg="3" xl="3">
            <div class="container">
              <div class="row no-gutters-y">
                <div class="col-md-12 col-lg-6">
                  <v-text-field
                    v-model="filter.search"
                    label="חיפוש"
                    dense />
                </div>

                <div class="col-md-12 col-lg-6">
                  <n-link
                    class="btn"
                    :to="{ name: 'settings-polygons-create' }"
                    v-text="'יצירת פוליגון חדש'" />
                </div>
              </div>
            </div>

            <PolygonCard
              v-for="(polygon, index) of polygons"
              :key="index"
              :polygon="polygon"
              :polygon-active.sync="polygonActive"
              :polygon-deleted.sync="polygonDeleted"
              :line-deleted.sync="lineDeleted"/>
            <h3 v-if="loading">טוען פוליגונים...</h3>
            <h3 v-else-if="polygons.length === 0">אין מידע.</h3>
          </v-col>

          <v-col md="9" lg="9" xl="9">
            <GoogleMap>
              <template v-for="polygon of polygons">
                <GMapPolygon
                  :key="polygon.id"
                  :value="polygon.lat_lng"
                  :color="getColor(polygon)"
                  @click="setPolygonActive(polygon)">
                  <GMapPolygon
                    v-for="line of polygon.lines"
                    :key="line.id"
                    :value="line.lat_lng"
                    color="blue"
                    @click="setPolygonActive(polygon)"/>
                </GMapPolygon>
              </template>
            </GoogleMap>
          </v-col>
        </v-row>
      </v-container>
    </CardUi>
  </SectionLayout>
</template>

<script>
import _ from 'lodash'

export default {
  name: 'SettingsPolygonsIndex',
  middleware: ['permissions'],

  data () {
    return {
      loading: false,
      polygons: [],
      polygonActive: {},
      polygonDeleted: {},
      lineDeleted: {},
      filter: {
        search: null
      }
    }
  },
  computed: {},
  watch: {
    'filter.search' () {
      return this.getPolygonsWithDelay()
    },
    polygonDeleted () {
      console.log('polygonDeleted', this.polygonDeleted)
      return this.$store.dispatch('polygons/get')
    },
    lineDeleted () {
      console.log('lineDeleted', this.lineDeleted)
      return this.$store.dispatch('polygons/get')
    }
  },
  created () {
    return this.getPolygons()
  },
  methods: {
    setPolygonActive (polygon) {
      this.polygonActive = polygon
    },
    async getPolygons () {
      try {
        this.loading = true
        this.polygons = await this.$polygonsService.list(this.filter)
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getPolygons')
      }
    },
    getPolygonsWithDelay: _.debounce(async function () {
      try {
        this.loading = true
        this.polygons = await this.$polygonsService.list(this.filter)
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getPolygons')
      }
    }, 500),
    getColor (polygon) {
      return this.polygonActive.id === polygon.id ? 'green' : 'red'
    }
  }
}
</script>

<style lang="scss" scoped>
.polygons-body{
  padding-top: 1rem;
}
</style>
