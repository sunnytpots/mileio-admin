<template>
  <div>
    <v-hover v-model="hover">
      <div class="create-route-button">
        <button
          v-if="currentCreateRoute || currentChildCreateRoute"
          class="btn btn-create-route"
          v-on="!canOnHover && !canChildOnHover ? { click: openCreateRoute } : null">
          <i class="icon icon-plus"/>
          <span
            v-if="currentCreateRoute"
            v-text="currentCreateRoute.title"/>
          <span
            v-else-if="currentChildCreateRoute"
            v-text="currentChildCreateRoute.title"/>
        </button>
        <v-list v-if="(canOnHover || canChildOnHover) && hover">
          <v-list-item
            v-for="(action, index) of actions"
            :key="index"
            @click="selectAction(action)">
            <v-list-item-title>{{ action.name }}</v-list-item-title>
          </v-list-item>
        </v-list>
        <input ref="csvFileInput" type="file" class="d-none" @change="loadCsvFile($event)" />
      </div>
    </v-hover>
    <v-dialog
      v-model="onUploadFile"
      persistent
      max-width="340"
      text-align="-webkit-center">
      <div v-if="successDialog" style="background-color: #f8f8fd">
        <v-card-title class="headline">
          {{ uploadSuccessMessage }}
        </v-card-title>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="green darken-1"
            text
            @click="resetAll">
            אישור
          </v-btn>
        </v-card-actions>
      </div>
      <div v-else style="background-color: #f8f8fd" >
        <v-card-title class="headline">
          העלאת משלוחים
        </v-card-title>

        <div style="display: flex; justify-content: space-around;">
          <v-btn class="btn-primary" @click.prevent="uploadFile"  >
            העלאת קובץ
          </v-btn>

          <ExportReport
            report-type="example"
            specific-option="csv"/>
        </div>

        <v-card-subtitle v-if="hasUploadError">
          <small class="sub-title-card-error">{{ uploadErrorMessage }}</small>
        </v-card-subtitle>
        <v-card-subtitle v-else-if="csvUploaded">
          <small class="sub-title-card-success">קובץ מוכן לשליחה</small>
        </v-card-subtitle>
        <v-card-actions>
          <v-spacer />
          <v-btn
            color="green darken-1"
            text
            @click="resetAll">
            בטל
          </v-btn>
          <v-btn
            :loading="csvLoading"
            color="green darken-1"
            text
            :disabled="!csvUploaded"
            @click.prevent="onSubmitUpload">
            בצע
          </v-btn>
        </v-card-actions>
      </div>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'CreateRouteButton',

  data () {
    return {
      successDialog: false,
      uploadSuccessMessage: '',
      uploadErrorMessage: '',
      hasUploadError: false,
      csv: null,
      onUploadFile: false,
      createRoutes: {
        drivers: { title: 'יצירת נהג חדש', to: { name: 'drivers-general' } },
        coordinator: { title: 'יצירת משלוח חדש', to: { name: 'coordinator-delivery' }, onHover: true },
        'refunds-refunds-storage': { title: 'יצירת שק חדש', dialogUi: true, to: { name: 'refunds-refunds-storage-scan-bag' } },
        'distribution-points-bags': { title: 'יצירת שק חדש', dialogUi: true, to: { name: 'distribution-points-bags-scan-bag' } },
        'settings-users': { title: 'יצירת משתמש חדש', to: { name: 'settings-users-info' } },
        'settings-branches': { title: 'יצירת סניף חדש', dialogUi: true },
        'settings-customers': { title: 'יצירת לקוח חדש', to: { name: 'settings-customers-general' } },
        'settings-payments-charges-customers': { title: 'חיוב לקוחות', dialogUi: true },
        'settings-payments-charges-distribution-points': { title: 'תשלום נקודות חלוקה', dialogUi: true },
        'settings-levels': { title: 'רמת משתמש חדשה', dialogUi: true },
        'settings-permissions': { title: 'יצירת הרשאה חדשה', dialogUi: true },
        'settings-pricing-driver': { title: 'צור מחירון', dialogUi: true },
        'settings-pricing-customer': { title: 'צור מחירון', dialogUi: true },
        'settings-pricing-distribution-point': { title: 'צור מחירון', dialogUi: true },
        'settings-pricing-polygon': { title: 'צור מחירון', dialogUi: true },
        'settings-causes-failures': { title: 'יצירת סיבת כשל', dialogUi: true },
        'distribution-points-list': { title: 'יצירת נקודת חלוקה', dialogUi: true, to: { name: 'distribution-points-list-distribution-point' } },
        'distribution-points-coordinator': { title: 'יצירת משלוח', dialogUi: true, to: { name: 'distribution-points-coordinator-delivery' } },
        'settings-column-management': { title: 'ניהול עמודות משתמש', dialogUi: true }
      },
      actions: [
        { name: 'העלאת קובץ', key: 'uploadFile' },
        { name: 'יצירה ידנית', key: 'addDelivery' }
      ],
      showHoverList: false,
      hover: false,
      csvUploaded: false,
      csvLoading: false,
      customer_number: null,
      deliveries: []
    }
  },

  computed: {
    canCreate () {
      return this.$route.matched[0] ? this.$hasPermission(this.$route.matched[0].name, 'edit') : false
    },

    canChildCreate () {
      return this.createRoutes[this.$route.name] && this.$hasPermission(this.$route.name, 'edit')
    },

    currentCreateRoute () {
      return this.$route.matched[0] ? this.createRoutes[this.$route.matched[0].name] : undefined
    },

    currentChildCreateRoute () {
      return this.createRoutes[this.$route.name]
    },
    canOnHover () {
      return this.$route.matched[0] && this.createRoutes[this.$route.matched[0].name] && this.createRoutes[this.$route.matched[0].name].onHover
    },
    canChildOnHover () {
      return this.createRoutes[this.$route.name] && this.createRoutes[this.$route.name].onHover
    }
  },

  methods: {
    checkFileHeaders (headers) {
      headers = headers.map(header => header.replace('\r', ''))
      console.log('headers', headers)
      const oldValidHeaders = [
        'מספר לקוח', 'שם', 'שם מזמין', 'קוד ישוב', 'שם ישוב', 'קוד רחוב', 'שם רחוב', 'בית', 'כניסה', 'קומה', 'דירה',
        'טלפון', 'טלפון נוסף', 'תעודה', 'ברקוד', 'קרטונים', 'גוביינא', 'הערות', 'כיוון', 'סוג כפולה', 'סוג רכב',
        'סוג דחיפות', 'תאריך משלוח', 'שעת התחלה', 'שעת סיום', 'חבילות', 'משטחים'
      ]
      const validHeaders = ['מספר לקוח', 'שם', 'טלפון', 'שם ישוב', 'שם רחוב', 'בית']
      for (let i = 0; i < validHeaders.length - 1; i++) {
        if (!headers.includes(validHeaders[i])) {
          return false
        }
      }
      return true
    },
    resetAll (removeDialog = true) {
      if (removeDialog) {
        this.onUploadFile = false
        this.successDialog = false
      }
      this.csvLoading = false
      this.deliveries = []
      this.csvUploaded = false
      this.$refs.csvFileInput.value = null
      this.hasUploadError = false
      this.uploadErrorMessage = ''
      this.uploadSuccessMessage = ''
    },
    openCreateRoute () {
      if (this.currentCreateRoute?.dialogUi || this.currentChildCreateRoute?.dialogUi) {
        this.$store.commit('setDrawerUi', true)
      }
      if (this.currentCreateRoute?.to) {
        this.$router.push(this.currentCreateRoute.to)
      }
      if (this.currentChildCreateRoute?.to) {
        this.$router.push(this.currentChildCreateRoute.to)
      }
    },
    uploadFile () {
      this.resetAll(false)
      this.$refs.csvFileInput.click()
    },
    async onSubmitUpload () {
      try {
        this.csvLoading = true
        console.log('this.deliveries.length', this.deliveries.length)
        const res = await this.$deliveryService.addByCsv({ deliveries: this.deliveries })
        if (res) {
          // window.location.reload()
          this.$store.commit('global/setOnUploadByCsv', true)
          this.successDialog = true
          // this.$store.commit('setSnackbar', { value: true, message: `נוצרו ${this.deliveries.length.toString()} משלוחים בהצלחה `, success: true })
        } else {
          this.$store.commit('setSnackbar', { value: true, message: res.results.description, error: true })
          this.csvLoading = false
          this.csvUploaded = false
          this.deliveries = []
        }
      } catch (e) {
        this.resetAll()
        this.$helper.snackbar(e, 'DonSubmitUpload')
      }
    },
    selectAction (action) {
      if (action.key === 'addDelivery') {
        this.openCreateRoute()
      } else if (action.key === 'uploadFile') {
        // this.uploadFile()
        this.onUploadFile = true
      }
    },
    loadCsvFile (event) {
      const selectedFile = event.target.files[0]
      const reader = new FileReader()
      reader.readAsText(selectedFile, 'UTF-8') // Default UTF-8
      // reader.readAsText(selectedFile, 'Windows-1255') // Default UTF-8
      // reader.readAsText(selectedFile, 'ISO-8859-8') // Default UTF-8
      reader.onload = this.onLoadCsvFile
    },
    onLoadCsvFile (e) {
      try {
        const splitRes = e.target.result.split('\n')
        const hebrewKeys = {
          'מספר לקוח': 'customer_number',
          שם: 'target_name',
          'שם מזמין': 'sender_name',
          'שם ישוב': 'target_city',
          'שם רחוב': 'target_street_name',
          בית: 'target_street_number',
          כניסה: 'entrance',
          קומה: 'floor',
          דירה: 'apartment',
          טלפון: 'target_phone',
          תעודה: 'order_number',
          ברקוד: 'barcode',
          אימייל: 'target_email',
          גוביינא: 'govaina_amount',
          הערות: 'comments',
          'סוג כפולה': 'delivery_type_code',
          חבילות: 'amount'
        }
        splitRes.pop()

        const areHeadersOk = this.checkFileHeaders(splitRes[0].split(','))
        if (!areHeadersOk) {
          this.hasUploadError = true
          this.uploadErrorMessage = 'העמודות שבקובץ אינן תקינות'
          return
        }

        let keys = []
        let values = []
        for (let i = 0; i <= splitRes.length - 1; i++) {
          let count = 0
          const delivery = {}
          if (i === 0) {
            keys = splitRes[0].split(',')
            continue
          } else {
            values = splitRes[i].split(',')
            if (values.length > 27) {
              // console.log(splitRes[i])
              this.resetAll(false)
              // this.$store.commit('setSnackbar', { value: true, message: `שגיאה בעת העלאת קובץ : שורה מספר ${+i + 1}- אין אפשרות להזין פסיק `, error: true })
              this.uploadErrorMessage = `שגיאה בעת העלאת קובץ : שורה מספר ${+i + 1}- אין אפשרות להזין פסיק `
              this.hasUploadError = true
              return
            }
          }
          while (count <= keys.length - 1) {
            if (hebrewKeys[keys[count].trim()]) {
              delivery[hebrewKeys[keys[count].trim()]] = values[count] && values[count].trim()
            }
            count++
          }
          this.deliveries.push(delivery)
        }
        if (this.deliveries && this.deliveries.length === 0) {
          this.hasUploadError = true
          this.uploadErrorMessage = 'אין מידע בקובץ שהועלה'
          return
        }
        this.uploadSuccessMessage = `נוצרו ${this.deliveries.length.toString()} משלוחים בהצלחה `
        this.csvUploaded = true
        // console.log('this.deliveries', this.deliveries)
      } catch (e) {
        this.$helper.snackbar(e, 'onLoadCsvFile')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.sub-title-card-error {
  font-weight:bold;
  color: #fa4616;
}
.sub-title-card-success{
  font-size: 15px;
  font-weight:bold;
  color: #43A047;
}
.btn-create-route{
  height: 54px;
  width: 100%;
  padding: 0;
  border-radius: 50px;
  box-shadow: 0 5px 14px -7px #353535;

  &:hover{
    background-color: $primary;
    border-color: transparent;
    color: #fff;
    box-shadow: none;
  }
}
.v-sheet.v-list:not(.v-sheet--outlined) {
  box-shadow: 0px 5px 5px -3px rgb(0 0 0 / 20%), 0px 8px 10px 1px rgb(0 0 0 / 14%), 0px 3px 14px 2px rgb(0 0 0 / 12%);
  border-radius: 20px;
}
.export-btn{
  margin-top: -.4rem
}
</style>
