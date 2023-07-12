<template>
  <SectionLayout title="נהגים">
    <template #header>
      <CardDriver
        v-if="driversSelected && driversSelected.length > 0"
        :selected-array="driversSelectedArray" />
    </template>

    <DrawerUi v-model="tab" :tabs="tabs">
      <template v-if="$hasPermission('drivers', 'edit')" #header>
        <v-btn
          v-if="driver && driver.id"
          class="btn-primary"
          :loading="loading"
          @click="dialogDeleteDriver = true">
          מחק נהג
        </v-btn>
        <v-btn
          class="btn-primary"
          :loading="loading"
          @click.prevent="onsubmit">
          שמירה
        </v-btn>
      </template>

      <template #aside>
<!--        <v-select-->
<!--          v-model="driverStatus"-->
<!--          :disabled="driverStatus === 'not_active' && !statusChanged"-->
<!--          :items="['active','not_active']"-->
<!--          label="סטטוס"-->
<!--          @change="statusChanged = true" />-->

        <v-select
          v-model="driverStatus"
          clearable
          :items="driverStatuses"
          item-text="name"
          item-value="key"
          label="סטטוס"
          class="select-ui"
          rounded
          filled
          @change="changeDriverStatus">
          <template v-slot:append>
            <i class="icon icon-arrowSelect"/>
          </template>
        </v-select>

<!--        <v-avatar v-if="driver" color="grey lighten-2" size="210">-->
<!--          <span class="headline" v-text="driver.first_name" />-->
<!--        </v-avatar>-->

        <v-avatar
          v-if="driver"
          color="grey lighten-2"
          class="driver-avatar"
          height="200"
          width="200"
          @click="onUploadLogo">
          <p v-if="!imageBase64" class="upload-logo" v-text="'העלאת תמונת נהג'" />
          <img v-else :src="imageBase64" class="preview"/>
          <input
            ref="uploader"
            class="d-none"
            type="file"
            accept="image/*"
            @change="onFileChanged($event)"
          />
        </v-avatar>
        <p v-if="imageBase64" class="delete-driver-logo" @click="onDeleteLogo">מחיקת תמונת נהג</p>

      </template>

      <n-child :driver="driver" :submit-status.sync="submitStatus" :driver-logo="fileLogo"/>
    </DrawerUi>

    <InfoPanel
      v-model="filter.status"
      :delivery-info="null"
      show-clear-button
      widget-clickable
      :widgets="widgetsSummaries"
      :widgets-loading="summariesLoading" />

    <div class="coordinator-body">
      <FilterUi
        v-model="filter"
        show-drivers
        :drivers="drivers"
        show-driver-status
        show-branch-list
        :branch-list="branches"
        :status-list="statusList"
        show-search
        @submit="filterHelper"/>
      <div :class="['col-2', 'btns-coordinator']">
        <v-btn class="btn-primary" @click="filterHelper">
          מיין תוצאות
        </v-btn>
        <ExportReport
          report-type="drivers"
          :filter="filter"/>
      </div>
    </div>
    <CardUi  class="d-print-none text-center" overflow>
      <v-flex>
        <v-data-table
          :headers="headers"
          :items="items"
          :server-items-length="totalItems"
          :options.sync="options"
          item-key="id"
          class="elevation-1"
          :loading="loading"
          loading-text="טוען רשימת נהגים, אנא המתן..."
          :footer-props="footerProps"
          @click:row="showInfo">
          <template v-slot:no-data>
            <p v-text="'אין מידע.'"/>
          </template>

          <template v-slot:item.name="{ item }">
            {{ `${item.first_name} ${item.last_name}` }}
          </template>

          <template v-slot:item.status="{ item }">
            <StatusesUi :status-value="translateStatus(item.status)" :status-key="item.status" />
          </template>

          <template v-slot:item.branches="{ item }">
            {{ getBranchesNames(item.branches) }}
          </template>

          <template v-slot:item.position>
            <div class="driver-position">
              <i class="icon icon-points position-driver-icon" />
              <span>הצג מיקום</span>
            </div>
          </template>

          <template v-slot:item.active_tasks="{ item }">
            {{ (item.tasks && item.tasks.active_tasks) || 0 }}
          </template>

          <template v-slot:item.done_tasks="{ item }">
            {{ (item.tasks && item.tasks.done_tasks) || 0 }}
          </template>

          <template v-slot:item.lateness="{ item }">
            {{ item.lateness || 0 }}
          </template>
        </v-data-table>
      </v-flex>
    </CardUi>

    <v-dialog
      v-model="dialogDeleteDriver"
      persistent
      max-width="290">
      <v-card>
        <v-card-title class="headline">
          הודעה
        </v-card-title>
        <v-card-text>האם אתה בטוח שברצונך למחוק את הנהג ?</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="green darken-1"
            text
            @click="dialogDeleteDriver = false"
          >
            בטל
          </v-btn>
          <v-btn
            color="green darken-1"
            text
            @click="onDeleteDriver()"
          >
            בצע
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Drivers',
  middleware: ['permissions'],

  data () {
    return {
      take: 100,
      skip: 0,
      totalItems: 1000,
      options: {},
      driverStatuses: [
        { name: 'פעיל', key: 'active' },
        { name: 'לא פעיל', key: 'not_active' }
      ],
      isSelecting: false,
      fileLogo: null,
      imageBase64: null,
      summariesRes: {
        active: 0,
        not_active: 0
      },
      summariesLoading: false,
      loading: false,
      item: null,
      tab: null,
      page: 'general',
      submitStatus: null,
      statusChanged: false,
      statusList: [{ status: 'not_active', name: 'לא פעיל' }, { status: 'active', name: 'פעיל' }],
      selected: [],
      selectAll: false,
      items: [],
      itemSelected: null,
      driver: {},
      filter: {},
      formNames: {
        '/drivers/general': 'driverData',
        '/drivers/pricing': 'driverPricing'
      },
      formName: 'driverData',
      driverStatus: 'not_active',
      bottom: false,
      filterValue: false,
      pagination: {
        skip: 0,
        take: 20
      },
      dialogDeleteDriver: false
    }
  },
  computed: {
    ...mapState(['drawerUi', 'openSnackbar']),
    ...mapState('auth', ['authUser', 'branchSelected']),
    ...mapState('global', ['drivers', 'driversSelected', 'branches', 'lines', 'drivers', 'footerProps']),
    ...mapState('drivers', ['status']),

    tabs () {
      const tabsResult = []
      if (this.driver?.uuid) {
        tabsResult.push(...[
          { title: 'מידע כללי', to: { name: 'drivers-general' } },
          { title: 'מחירון', to: { name: 'drivers-pricing' } }
        ])
      } else {
        tabsResult.push({ title: 'יצירת נהג', to: { name: 'drivers-general' } })
      }
      return tabsResult
    },
    headers () {
      const arr = [
        { text: 'שם נהג', align: 'center', value: 'name' },
        { text: 'סוג רכב', align: 'center', value: 'car_type' },
        { text: 'קיבולת', align: 'center', value: 'car_capacity' },
        { text: 'סטטוס', align: 'center', value: 'status' },
        { text: 'איזור', align: 'center', value: 'branches' },
        { text: 'טלפון', align: 'center', value: 'mobile' },
        { text: 'מיקום שליח', align: 'center', value: 'position' },
        { text: 'משימות פעילות', align: 'center', value: 'active_tasks' },
        { text: 'משימות שבוצעו', align: 'center', value: 'done_tasks' },
        { text: 'איחורים', align: 'center', value: 'lateness' }
      ]
      return arr
    },
    widgetsSummaries () {
      return [
        { key: 'active', title: 'פעיל', value: this.summariesRes.active || 0 },
        { key: 'not_active', title: 'לא פעיל', value: this.summariesRes.not_active || 0 }
      ]
    },
    driversSelectedArray () {
      const items = []
      this.drivers.forEach(item => {
        if (this.driversSelected?.includes(item.id)) {
          return items.push(item)
        }
      })
      return items
    }
  },
  watch: {
    driversSelected (newVal) {
      this.filter.byDriversIds = newVal
      return this.filterHelper()
    },
    options: {
      async handler (newOptions) {
        try {
          const { sortBy, sortDesc } = this.options
          this.pagination.skip = (newOptions.page - 1) * newOptions.itemsPerPage
          this.pagination.take = newOptions.itemsPerPage
          const response = await this.$driverService.driverView({
            ...this.pagination,
            filter: this.filter,
            branch_id: this.branchSelected
          })
          this.totalItems = response?.total
          this.items = response?.items?.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'name':
                sortA = (a.first_name + a.last_name)?.charCodeAt(0) || 0
                sortB = (b.first_name + b.last_name)?.charCodeAt(0) || 0
                break
              case 'car_type':
                sortA = a.car_type?.charCodeAt(0) || 0
                sortB = b.car_type?.charCodeAt(0) || 0
                break
              case 'car_capacity':
                sortA = a.car_capacity || 0
                sortB = b.car_capacity || 0
                break
              case 'status':
                sortA = a.status || 0
                sortB = b.status || 0
                break
              case 'mobile':
                sortA = a.mobile?.charCodeAt(0) || 0
                sortB = b.mobile?.charCodeAt(0) || 0
                break
              case 'active_tasks':
                sortA = a.tasks?.active_tasks || 0
                sortB = b.tasks?.active_tasks || 0
                break
              case 'done_tasks':
                sortA = a.tasks?.done_tasks || 0
                sortB = b.tasks?.done_tasks || 0
                break
              case 'lateness':
                sortA = a.lateness?.charCodeAt(0) || 0
                sortB = b.lateness?.charCodeAt(0) || 0
                break
            }
            if (sortDesc[0]) {
              return sortA < sortB ? 1 : sortA > sortB ? -1 : 0
            } else {
              return sortA < sortB ? -1 : sortA > sortB ? 1 : 0
            }
          })
        } catch (e) {
          this.$helper.snackbar(e, 'options watch')
        }
      },
      deep: true
    },
    drawerUi (newDrawerUi) {
      !newDrawerUi && (this.driver = {})
    },
    async submitStatus (newSubmitStatus) { // waiting for child response and then run a new request and close the drawer
      try {
        console.log('newSubmitStatus::::', newSubmitStatus)
        if (newSubmitStatus.status) {
          this.loading = true
          this.$store.commit('setDrawerUi', false) // close drawer
          await this.$router.push({ name: 'drivers' })
          this.loading = false
          this.driver = {}
        }
      } catch (e) {
        this.$helper.snackbar(e, 'submitStatus')
      }
    },
    selectAll (newSelectAll) {
      this.selected = newSelectAll ? this.items.map((item, index) => this.drivers) : []
    },
    async $route (newRoute) {
      try {
        console.log('this.$route.name', newRoute.name)
        if (newRoute.name === 'drivers') {
          this.loading = true
          this.driverStatus = 'not_active'
          this.driver = {}
          this.$nuxt.$emit('reload-driver-management')
          await this.filterHelper()
          this.loading = false
          this.imageBase64 = null
          this.fileLogo = null
        }
      } catch (e) {
        this.$helper.snackbar(e, '$route')
      }
    },
    branchSelected (newValue) {
      if (newValue) {
        return this.filterHelper()
      }
    }
  },
  async created () {
    try {
      await Promise.all([
        this.filterHelper(),
        this.$store.dispatch('global/getBranchList')
      ])
      // await this.$store.dispatch('global/getLineList')
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  mounted () {
    this.$nuxt.$on('driverFormStatus', res => {
      console.log('mounted', res)
      this.statusChanged = res === 'not_active' ? false : this.statusChanged
      this.driverStatus = res
    })
  },
  methods: {
    async getDriverView () {
      try {
        const response = await this.$driverService.driverView({
          ...this.pagination,
          filter: this.filter,
          branch_id: this.branchSelected
        })
        this.totalItems = response?.total
        this.items = response?.items
      } catch (e) {
        this.$helper.snackbar(e, 'getDriverView')
      }
    },
    async filterHelper () {
      try {
        this.loading = true
        await Promise.all([this.getDriverView(), this.getSummaries()])
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'filterHelper')
      }
    },
    async getSummaries () {
      try {
        this.summariesLoading = true
        this.summariesRes = await this.$driverService.getSummaries({ ...this.pagination, filter: this.filter })
        this.summariesLoading = false
      } catch (e) {
        this.$helper.snackbar(e, 'getSummaries')
      }
    },
    getBranchesNames (branches) {
      return branches?.map(branch => branch.name)?.join(', ')
    },
    translateStatus (status) {
      return status === 'active' ? 'פעיל' : 'לא פעיל'
    },
    async changeDriverStatus () {
      try {
        console.log('changeDriverStatus this.driverStatus', this.driverStatus)
        this.statusChanged = true
        await this.$driverService.changeStatus({ driver_id: this.driver?.id, status: this.driverStatus })
        this.$store.commit('setSnackbar', { value: true, message: 'סטטוס הנהג שונה בהצלחה', success: true })
      } catch (e) {
        console.log('changeDriverStatus error', e)
        const errorMsg = e.response && e.response.data && e.response.data.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    },
    async onDeleteLogo () {
      try {
        await this.$driverService.deleteLogo({ id: this.driver.id })
        this.imageBase64 = null
      } catch (e) {
        console.log('onDeleteLogo error', e)
      }
    },
    onUploadLogo () {
      this.isSelecting = true
      window.addEventListener('focus', () => {
        this.isSelecting = false
      }, { once: true })

      this.$refs.uploader.click()
    },
    onLoadFile (e) {
      console.log('e.target', e.target)
      this.imageBase64 = e.target.result
    },
    createBase64Image (fileObject) {
      const reader = new FileReader()
      reader.onload = this.onLoadFile
      reader.readAsDataURL(fileObject)
    },
    onFileChanged (e) {
      console.log(e.target.files[0], 'uploadType')
      const selectedFile = e.target.files[0]
      if (selectedFile) {
        this.fileLogo = selectedFile
        console.log('fileLogo', this.fileLogo)
        this.createBase64Image(selectedFile)
      }
    },
    showInfo (item) {
      if (item && item.driver_logo) {
        this.imageBase64 = item.driver_logo
      }
      this.driver = item
      this.$router.push({ name: 'drivers-general' })
      this.$store.commit('setDrawerUi', true)
    },
    async onsubmit (item) { // every component call different function
      try {
        this.loading = true
        const formName = this.formNames[this.tab]
        await this.$nuxt.$emit('pricingSubmit')
        await this.$nuxt.$emit('formSubmit', formName) // submit to function from child comp
        this.loading = false
      } catch (e) {
        console.log('onsubmit error', e)
      }
    },
    async onDeleteDriver () {
      try {
        console.log('driver', this.driver)
        this.loading = true
        await this.$driverService.deleteDriver(this.driver.id)
        this.loading = false
        this.dialogDeleteDriver = false
        await this.filterHelper()
        this.$store.commit('setDrawerUi', false)
      } catch (e) {
        const errorMsg = e.response && e.response.data && e.response.data.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    }
  },
  head: { title: 'נהגים' }
}
</script>

<style lang="scss" scoped>
.coordinator-body {
  background-color: #F8F8FD;
  .btn-primary{
    margin: 0 -28px 0 12px!important;
  }
}
.elevation-1 {
  background-color: #FFFFFF;
  ::v-deep {
    table thead tr th {
      background-color: #F4F4F4 !important;
      height: 65px;
      span {
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #000000;
      }
      .v-data-table-body {
        height: 65px;
      }
    }

    .deleted-delivery {
      background-color: #ffffa1 !important;
    }

    .late-delivery {
      background-color: #ff3f3f !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .late-delivery:hover {
      background-color: darken(#ff3f3f, 10%) !important;
    }

    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}
.filter-ui{
  margin-right:  -25px}
.driver-rate {
  margin-top: 30px;
  p {
    color: #FA4616;
  }
}

.upload-logo {
  cursor: pointer;
}

.delete-driver-logo {
  margin-top: 30px;
  cursor: pointer;
  color: red;
}

.customer-avatar {
  width: 185px !important;
  position: relative;
  border-radius: 0 !important;
  cursor: pointer;
  p {
    position: absolute;
    font-size: larger;
  }
}

.info-panel {
  width: 900px;
  margin: auto;
}

::v-deep {
  th.text-center {
    padding: 0 !important;
  }
  .export-btn .col-2 {
    padding-right: 0 !important;
  }
}

.v-progress-circular {
  position: absolute;
}

.driver_table {
  td {
    text-align: center !important;
  }
}

.export-btn {
  width: min-content;
}

.form-title{
  border-left: 1px solid rgb(228, 228, 228);
  padding-right: 25px;
}
.driver-position {
  color: #34a5c8;
  display: flex;
  span {
    margin: 2px 5px 0 5px;
    cursor: pointer;
  }
}
.card{
  border-radius: 10px;
  margin-bottom: 15px;
  background: #f7f7f7;
}
small{
  display: block;
  font-size: 12px;
}
.top-details-row{
  border-bottom: 1px solid rgb(228, 228, 228);
  .data-label{
    display: block;
    font-size: 16px;
  }
}
.position-driver-icon{
  width: 8px
}
.v-input__slot{
  background: unset;
}
.inputUi {
  margin-bottom: 15px;
}
.filter-ui {
  margin-right: -18px;
}

</style>
