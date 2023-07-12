<template>
  <div class="coordinator-maps">
    <div class="draggable-items">
      <h3 v-if="!driversSelected" class="choose-driver-message">אנא בחר נהג מהרשימה</h3>
      <DriverManagement list-type="radio"/>
      <v-divider/>
      <template v-if="driversSelected">
        <div style="display: flex">
          <CardDriver :selected-array="driversSelectedArray" />
        </div>
        <v-progress-circular
          v-if="loadingTasks"
          class="spinner"
          size="50"
          color="green"
          indeterminate
        />
        <div
          v-else-if="items && items.length > 0"
          class="buttons">
          <p v-if="hasError" class="approve-msg">לא ניתן ליצור מסלול בתצוגה המקדימה עבור נקודות המשלוח שנבחרו</p>
          <div
            v-if="!approval_routes">
            <v-btn
              :loading="loading"
              class="btn-primary"
              style="width: 12rem"
              @click.prevent="onSaveDriverRoutes">
              שמירת מסלול נהג
            </v-btn>
            <v-btn
              :loading="loading"
              class="btn-success"
              style="width: 12rem"
              @click.prevent="onApproveRoutes">
              אישור יציאה לקו
            </v-btn>
            <div
              v-if="(items && items.length > 1) && allowTimingCommunication"
              style="text-align: center !important; margin-top: 20px">
              <v-btn
                v-if="enable_auto_sorting"
                :loading="loading"
                class="btn-primary"
                @click="autoSortingList">
                סידור מסלול אוטומטי
              </v-btn>
              <p v-else class="approve-msg">מסלול בהכנה, אנא המתן מספר דקות</p>
            </div>
          </div>
          <div v-else>
            <p class="approve-msg">
              מסלול הנהג אושר ונשלחו חלונות מסירה לנמענים
            </p>
            <v-btn :loading="loading" class="btn-success" @click.prevent="onCancelApproveRoutes" style="width: 12rem; margin: auto 27%;">
              ביטול יציאה לקו
            </v-btn>
          </div>
        </div>
        <div v-else class="buttons">
          <p class="approve-msg">לא קיימים משלוחים עבור הנהג שנבחר</p>
        </div>
        <draggable
          v-model="items"
          :class="[{ 'drag-opacity': approval_routes }]"
          style="margin: 2rem"
          :options="{ disabled : approval_routes }"
          @start="drag = true"
          @end="drag = false">
          <v-alert
            v-for="(item, index) in items"
            :key="item.delivery_id"
            type="success"
            @click="zoomInDelivery(item, index)">
            <v-row>
              <v-col cols="8">
                <div>
                  ({{ index + 1 }}) - {{ item.delivery_type_value }}
                </div>
                <div>
                  {{ `ברקוד: ${item.barcode}` }}
                </div>
                <div>
                  {{ item.address && getAddressValue(item.address) }}
                </div>
                <div>
                  {{ `סטטוס: ${item.status_value}` }}
                </div>
                <div>
                  {{ `שם לקוח: ${item.customer && item.customer.name}` }}
                </div>
              </v-col>

              <v-col style="display: flex; align-items: flex-end" cols="4">
                <v-btn
                  v-if="!['refund_customer_bag'].includes(item.delivery_type)"
                  class="btn-primary"
                  @click="openInCoordinator(item)">
                  {{ 'הצג ברכז' }}
                </v-btn>
              </v-col>
            </v-row>
          </v-alert>
        </draggable>
      </template>
    </div>
    <div v-if="showGoogleMap" style="width: 70%">
      <GoogleMap :key="renderKey" :zoom="zoom" :center="mapCenter">
        <GMapDirections
          :delivery-details="items"
          :driver-start-position="position"
          :driver-selected="driversSelected"
          :waypoints="waypoints"
          :driver-name="driverName"
          @alarmError="alarmError"/>
      </GoogleMap>
      <v-btn color="#fa4616" class="white--text" @click="resetMap">
        איפוס מפה
      </v-btn>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import * as vuedraggable from 'vuedraggable'

export default {
  name: 'CoordinatorMaps',
  components: {
    draggable: vuedraggable
  },

  data () {
    return {
      allowTimingCommunication: true,
      enable_auto_sorting: true,
      zoom: 10,
      renderKey: 1,
      mapCenter: null,
      loadingTasks: true,
      hasError: false,
      driverName: '',
      origin: null,
      route: [],
      toRearrangeRoute: false,
      showGoogleMap: true,
      drag: false,
      loading: false,
      myArray: [
        {
          name: 'vue.draggable1',
          order: 1,
          fixed: false
        },
        {
          name: 'vue.draggable2',
          order: 2,
          fixed: false
        },
        {
          name: 'vue.draggable3',
          order: 3,
          fixed: false
        }
      ],
      items: [],
      approval_routes: false,
      itemsSwapped: [],
      dialog: false,
      driversRoutes: [],
      currentLocation: {},
      position: null,
      waypoints: []
    }
  },
  computed: {
    ...mapState('global', ['drivers', 'driversSelected']),
    driversSelectedArray () {
      return this.drivers.filter(driver => driver.id === this.driversSelected)
    }
  },
  watch: {
    drag (newValue) {
      if (!newValue) {
        console.log('this.items newValue', newValue)
      }
      this.toRearrangeRoute = true
    },
    async driversSelected (newValue) {
      try {
        if (newValue && newValue !== 0) {
          const getUpdatedListRes = await this.reRenderGoogleMaps('sorting-deliveries-routes/get-updated-list', { driver_id: newValue })
          const checkApprovalRoutesRes = await this.$driverService.checkApprovalRoutes({ driver_id: newValue })
          this.driverName = getUpdatedListRes?.driver_name
          this.position = getUpdatedListRes?.driver_location
          this.approval_routes = checkApprovalRoutesRes?.approval_routes
          this.enable_auto_sorting = checkApprovalRoutesRes?.enable_auto_sorting
        } else {
          this.showGoogleMap = false
          this.items = null
        }
      } catch (e) {
        this.$helper.snackbar(e, 'driversSelected')
      }
    }
  },
  async created () {
    try {
      this.$store.commit('global/setToDriversArraySelected', 0)
      const allowTimingCommunication = await this.$userService.getTimingCommunicationPermission()
      this.allowTimingCommunication = allowTimingCommunication === 1
      if (process.client) {
        this.driversRoutes = JSON.parse(localStorage.getItem('googleMap'))
      }
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    openInCoordinator (item) {
      let route = 'coordinator'
      let params = { id: item.delivery_id }
      switch (item.delivery_type) {
        case 'distribution_point_bag':
          route = 'distribution-points-bags'
          params = { delivery_id: item.delivery_id }
          break
        default:
          route = 'coordinator'
          params = { id: item.delivery_id }
      }

      return this.$router.push({ name: route, params })
    },
    async autoSortingList () {
      try {
        console.log('autoSortingList driver', this.driversSelectedArray)
        const driver = this.driversSelectedArray[0]
        const body = {
          driver_uid: driver.uuid,
          driver_position: [driver.location.lat, driver.location.lng]
        }
        this.loading = true
        await this.$deliveryService.timingAutoSorting(body)
        this.approval_routes = false
        this.enable_auto_sorting = false
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'autoSortingList')
      }
    },
    resetMap () {
      this.mapCenter = this.origin
      this.zoom = 10
      this.renderKey++
    },
    zoomInDelivery (item, index) {
      this.mapCenter = {
        lat: item?.address && Number(item.address.lat),
        lng: item?.address && Number(item.address.lng)
      }
      this.zoom = 20
      this.renderKey++
      setTimeout(() => {
        this.$nuxt.$emit('onPopupMarker', index + 1)
      }, 200)
    },
    alarmError (isHasError) {
      this.hasError = isHasError
    },
    getAddressValue (addressObj) {
      let addressVal = ''
      addressObj.correct_long_city_name && (addressVal += `${addressObj?.correct_long_city_name} `)
      addressObj.correct_long_street_name && (addressVal += `${addressObj?.correct_long_street_name} `)
      addressObj.correct_street_number && (addressVal += `${addressObj?.correct_street_number}`)
      return addressVal
    },
    async reRenderGoogleMaps (url, body) {
      try {
        this.showGoogleMap = false
        this.loadingTasks = true
        let response = []
        if (this.items?.length > 100) {
          let untilIndex = 0
          let initCall = true
          for (let fromIndex = 0; fromIndex < this.items.length; fromIndex += 100) {
            untilIndex = untilIndex + 100 > this.items.length ? this.items.length : untilIndex + 100
            const itemsPart = this.items.slice(fromIndex, untilIndex)
            body.tasks = itemsPart
            body.initCall = initCall
            const resPart = await this.$deliveryService.saveDriverRoutesParts(body)
            initCall = false
            response.concat(resPart)
          }
        } else {
          response = await this.$axios.$post(url, body)
        }
        this.loadingTasks = false
        this.items = response.tasks ? response.tasks : this.items
        this.waypoints = this.items.map(delivery => ({
          location: {
            lat: Number(delivery.address?.lat),
            lng: Number(delivery.address?.lng)
          },
          stopover: true
        }))
        this.origin = this.waypoints?.[0]?.location
        this.mapCenter = this.origin
        this.showGoogleMap = true
        return response
      } catch (e) {
        this.loadingTasks = false
        this.$helper.snackbar(e, 'reRenderGoogleMaps')
      }
    },
    async onApproveRoutes () {
      try {
        this.loading = true
        await this.$deliveryService.approveRoutes({ driver_id: this.driversSelected })
        this.loading = false
        this.approval_routes = true
        this.$store.commit('setSnackbar', {
          value: true,
          message: 'מסלול הנהג אושר סופית וכעת הנהג יכול לצאת לדרך',
          success: true
        })
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'onApproveRoutes')
      }
    },
    async onCancelApproveRoutes () {
      try {
        this.loading = true
        await this.$deliveryService.cancelApproveRoutes({ driver_id: this.driversSelected })
        const checkApprovalRoutesRes = await this.$driverService.checkApprovalRoutes({ driver_id: this.driversSelected })
        this.approval_routes = checkApprovalRoutesRes?.approval_routes
        this.enable_auto_sorting = checkApprovalRoutesRes?.enable_auto_sorting
        this.loading = false
        this.$store.commit('setSnackbar', { value: true, message: 'מסלול הנהג בוטל בהצלחה', success: true })
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'onCancelApproveRoutes')
      }
    },
    async onSaveDriverRoutes () {
      try {
        this.loading = true
        const body = {
          driver_id: this.driversSelected,
          tasks: this.items,
          toRearrangeRoute: this.toRearrangeRoute
        }
        await this.reRenderGoogleMaps('delivery/save-driver-routes', body)
        this.toRearrangeRoute = false
        this.loading = false
        this.$store.commit('setSnackbar', { value: true, message: 'מסלול הנהג נשמר בהצלחה', success: true })
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'onSaveDriverRoutes')
      }
    },
    getValidMarkers (markers) {
      return markers.map(m => {
        return {
          lat: m.location.lat,
          lng: m.location.lng
        }
      })
    }
  },
  head: { title: 'תצוגת מפה' }
}
</script>

<style scoped>
.spinner {
  margin: auto 44% !important;
}
.driver-management {
  height: 50px !important;
  margin: 5% 30% !important;
}
.v-divider {
  border: 1px solid rgba(0, 0, 0, 0.12) !important;
  margin-bottom: 15px !important;
}
.choose-driver-message {
  margin-right: 10px;
}
.coordinator-maps {
  display: flex;
  width: 100%;
  margin-top: 1rem;
}
.buttons {
  margin: 2rem;
}
.draggable-items {
  width: 30%;height: 50rem;overflow-y: auto;
}
.drag-opacity {
  opacity: .5;
}
.approve-msg {
  color: red;
  font-weight: bold;
  text-align: center;
}
</style>
