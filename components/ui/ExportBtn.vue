<template>
  <div class="export-btn">
    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <div :class="['col-2']">
          <v-btn
            depressed
            :class="['white--text', 'btn-gray']"
            :loading="loading"
            v-bind="attrs"
            v-on="on">
            <img src="../../assets/images/icons/export-icon.svg"/>
            <span v-text="title" />
          </v-btn>
        </div>
      </template>
      <v-list>
        <v-list-item
          v-for="(option, index) in options"
          :key="index"
          @click.prevent="handle_function_call(option.schemaType)">
          <v-list-item-icon>
            <v-icon v-text="option.icon" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title
              @click="fileExtension = option.fileExtension"
              v-text="option.title"/>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>
    <JsonCSV
      ref="csvBtn"
      class="hidden format-component"
      :data="items"
      :name="componentName + '_csv' + fileExtension"/>
    <JsonExcel
      ref="excelBtn"
      class="hidden format-component"
      :data="items"
      :name="componentName + '_excel' + fileExtension"/>
  </div>
</template>

<script>
import JsonCSV from 'vue-json-csv'
import JsonExcel from 'vue-json-excel'
import moment from 'moment'

export default {
  name: 'ExportBtn',
  components: { JsonCSV, JsonExcel },
  props: {
    apiFunction: { type: String, require: false, default: null },
    componentName: { type: String, require: false, default: null },
    title: { type: String, require: false, default: 'יצוא מסמך' },
    reqType: { type: String, require: false, default: 'post' },
    filter: { type: Object, require: false, default: () => ({}) },
    pagination: { type: Object, require: false, default: () => ({}) },
    specificOption: { type: String, require: false, default: null }
  },
  data () {
    return {
      loading: false,
      items: [],
      resData: [],
      fileExtension: '.csv'
    }
  },
  computed: {
    options () {
      let options = []
      if (this.specificOption) {
        options.push({ title: this.specificOption, icon: 'icon-csv', schemaType: 'csv', fileExtension: '.csv' })
      } else {
        options = [
          { title: 'Excel', icon: 'icon-excel', schemaType: 'excel', fileExtension: '.xls' },
          { title: 'CSV', icon: 'icon-csv', schemaType: 'csv', fileExtension: '.csv' }
        ]
      }
      return options
    }
  },
  created () {
    console.log('ExportBtn this.apiFunction', this.apiFunction)
  },
  methods: {
    translateStatus (status) {
      switch (status) {
        case 'in_process':
          return 'בתהליך'
        case 'collected_waiting_refund':
          return 'נמסר ממתין לזיכוי'
        case 'payment_received':
          return 'כסף התקבל'
        case 'deposit':
          return 'הפקדה'
        case 'done':
          return 'בוצע'
        case 'failure':
          return 'נכשל'
      }
      return status
    },
    getBagStatusValue (statusName) {
      switch (statusName) {
        case 'in_preparation':
          return 'בהכנות'
        case 'ready_to_delivered':
          return 'מוכן למסירה'
        case 'on_the_way':
          return 'בדרך ליעד'
        case 'done':
          return 'בוצע'
      }
      return statusName
    },
    async handle_function_call (schemaType) {
      try {
        console.log('handle_function_call', schemaType)
        this.loading = true
        if (!this.apiFunction && this.componentName !== 'Example') {
          return
        }

        let data = []
        if (this.componentName !== 'Example') {
          const parts = this.apiFunction.split('.')
          let func = ''
          parts.forEach(part => func += `${part}/`)
          if (this.reqType === 'post') {
            data = await this.$axios.$post(func, { ...this.pagination, filter: this.filter })
          } else {
            data = await this.$axios.$get(func, { params: { ...this.filter } })
          }
        }

        await this.buildFinalCsvArray(data, schemaType)
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'handle_function_call')
      }
    },
    async buildFinalCsvArray (data, schemaType) {
      try {
        console.log('buildFinalCsvArray', this.componentName)
        switch (this.componentName) {
          case 'SettingsPolygonsPolygon':
            this.resData = data
            await this.polygonLinesItems()
            break
          case 'GovainaPayments':
            this.resData = data
            await this.govainaPaymentsItems()
            break
          case 'SettingsUsers':
            this.resData = data
            await this.SettingsUsers()
            break
          case 'DriverManagement':
            this.resData = data
            await this.driversManagementItems()
            break
          case 'DeliveriesModule':
            this.resData = data?.items
            await this.deliveriesItems()
            break
          case 'DistributionPoints':
            this.resData = data?.items
            await this.DistributionPointsItems()
            break
          case 'Bags' :
            this.resData = data?.items
            await this.BagsItems()
            break
          case 'RefundsCoordinator':
            this.resData = data?.items
            await this.RefundsItems()
            break
          case 'Drivers':
            this.resData = data?.items
            await this.DriversItems()
            break
          case 'DistributionDeliveryPointsCoordinator':
            this.resData = data?.items
            await this.distDelPtsItems()
            break
          case 'Customers':
            this.resData = data
            await this.customersItems()
            break
          case 'RefundStorage':
            this.resData = data
            await this.refundStorageItems()
            break
          case 'Example':
            await this.uploadExample()
            break
          case 'Branches':
            this.resData = data
            await this.branchItems()
            break
          case 'QuantitativeCollectionCoordinator':
            this.resData = data?.tasks
            await this.quantitativeCollectionItems()
            break
          case 'SettingsSmsMessages':
            this.resData = data?.items
            await this.smsHistoryItems()
            break
          case 'Scans':
            this.resData = data
            await this.scanItems()
            break
        }

        this.$nextTick(() => {
          console.log('schemaType', schemaType)
          if (schemaType === 'csv') {
            this.$refs.csvBtn.$el.click()
          } else {
            this.$refs.excelBtn.$el.click()
          }
        })
      } catch (e) {
        this.$helper.snackbar(e, 'buildFinalCsvArray')
      }
    },
    SettingsUsers () {
      console.log('SettingsUsers', this.resData)
      for (const obj of this.resData) {
        const users = {}
        users['שם'] = obj.first_name + obj.last_name
        users['נייד'] = obj.mobile
        users['אימייל'] = obj.email
        users['סניפים'] = obj.branches.map(branch => branch.name).join(',')
        this.items.push(users)
      }
    },
    RefundsItems () {
      const tempItems = []
      for (const obj of this.resData) {
        const refund = {}
        if (!obj.delivery) {
          continue
        }
        refund['שם לקוח'] = obj.delivery.customer && obj.delivery.customer.name
        refund['ברקוד'] = obj.delivery.barcode
        refund['סוג משלוח'] = obj.delivery.delivery_type && obj.delivery.delivery_type.value
        refund['תאריך שידור'] = obj.delivery.created_at && moment(obj.delivery.created_at).format('YYYY-MM-DD HH:mm:ss')
        refund['סטטוס'] = obj.delivery.status && obj.delivery.status.name
        refund['שם נמען'] = obj.delivery.target_name
        refund['עיר'] = obj.delivery.target_address && obj.delivery.target_address.correct_long_city_name
        refund['רחוב'] = obj.delivery.target_address && obj.delivery.target_address.correct_long_street_name
        refund['תאריך איסוף'] = obj.delivery.collected_date && moment(obj.delivery.collected_date).format('YYYY-MM-DD HH:mm:ss')
        refund['תאריך מסירה'] = obj.delivery.delivered_date && moment(obj.delivery.delivered_date).format('YYYY-MM-DD HH:mm:ss')
        refund['נהג'] = obj.driver && obj.driver.first_name
        refund['כמות'] = obj.amount
        refund['סכום'] = obj['sum']
        refund['שם מזכה'] = obj.refund_name
        tempItems.push(refund)
      }
      this.items = tempItems
    },
    DistributionPointsItems () {
      console.log('DistributionPointsItems', this.resData)
      for (const obj of this.resData) {
        const branch = {}
        branch['שם הנקודה'] = obj.name
        branch['סטאטוס'] = obj.active ? 'פעיל' : 'לא פעיל'
        branch['קו'] = obj.line && obj.line.name
        branch['כתובת'] = obj.address && `${obj.address.correct_long_city_name} ${obj.address.correct_street_number}`
        branch['מספר נקודה'] = obj.point_number
        branch['שם איש קשר'] = obj.contact_name
        branch['טלפון איש קשר'] = obj.phone
        branch['שעות פעילות'] = obj.active_time
        this.items.push(branch)
      }
    },
    BagsItems () {
      console.log('BagsItems', this.resData)
      for (const obj of this.resData) {
        const branch = {}
        branch['מספר שק'] = obj.bag_number
        branch['נקודת חלוקה'] = obj.dist_point && obj.dist_point.name
        branch['כתובת מסירה'] = obj.dist_point && obj.dist_point.address && `${obj.dist_point.address.correct_long_street_name} ${obj.dist_point.address.correct_street_number}`
        branch['קו'] = obj.dist_point && obj.dist_point.line && obj.dist_point.line.name
        branch['שם לקוח'] = obj.dist_point && obj.dist_point.contact_name
        branch['כמות חבילות בשק'] = obj.packages && obj.packages.length
        branch['תאריך נעילת שק'] = obj.blocking_date ? moment(obj.blocking_date).format('YYYY-MM-DD HH:mm:ss') : ''
        branch['תאריך מסירת שק'] = obj.delivered_date ? moment(obj.delivered_date).format('YYYY-MM-DD HH:mm:ss') : ''
        branch['סטטוס'] = obj.status && this.getBagStatusValue(obj.status)
        branch['נהג'] = obj.driver && `${obj.driver.first_name} ${obj.driver.last_name}`
        this.items.push(branch)
      }
    },
    polygonLinesItems () {
      console.log('polygonLinesItems', this.resData)
      const tempItems = []
      for (const obj of this.resData?.lines) {
        const line = {}
        line['מספר קו'] = obj.line_number
        line['שם קו'] = obj.name
        line['שם פולגיון'] = this.resData.name
        tempItems.push(line)
      }
      this.items = tempItems
    },
    govainaPaymentsItems () {
      console.log('govainaPaymentsItems this.resData', this.resData)
      const tempItems = []
      for (const obj of this.resData) {
        const govaina = {}
        govaina['שם לקוח'] = obj.customer?.name
        govaina['ברקוד'] = obj.delivery?.barcode
        govaina['סוג'] = obj.delivery_type?.value
        govaina['סכום'] = obj.delivery?.govaina_amount
        govaina['שם נמען'] = obj.delivery?.target_name
        govaina['נהג'] = obj.driver && `${obj.driver.first_name} ${obj.driver.last_name}`
        govaina['תאריך ביצוע'] = obj.delivered_at
        govaina['שם מזכה'] = obj.refund?.refund_name
        govaina['תאריך ביצוע'] = obj.refunded_at
        govaina['שם מפקיד'] = obj.depositor
        govaina['תאריך ביצוע'] = obj.deposited_at
        govaina['מספר דו"ח'] = obj.report_number
        govaina['תאריך ביצוע'] = obj.transferred_at
        govaina['סטטוס'] = this.translateStatus(obj.status)
        tempItems.push(govaina)
      }
      this.items = tempItems
    },
    driversManagementItems () {
      const tempItems = []
      for (const obj of this.resData) {
        const driver = {}
        driver['סטטוס'] = obj.delivery_type_status?.name
        driver['סוג משלוח'] = obj.delivery_type?.value
        driver['שם נמען'] = obj.target_name
        driver['שם לקוח'] = obj.customer?.name
        driver['כישלון'] = obj.causes_failure?.value || ''
        driver['ברקוד'] = obj.barcode
        driver['סטטוס משימות נהג שבוצעו'] = obj.driver_tasks && `${obj.driver_tasks.done_tasks_today}/${obj.driver_tasks.active_tasks}`
        driver['שם נהג'] = obj.driver && `${obj.driver.first_name} ${obj.driver.last_name}`
        driver['סניף נהג'] = obj.branch?.name
        driver['האם נסרק'] = obj.was_scanned ? 'נסרק' : 'לא נסרק'
        driver['תאריך סריקה'] = obj.scanned_at ? moment(obj.scanned_at).format('DD-MM-YYYY') : null
        tempItems.push(driver)
      }
      this.items = tempItems
    },
    deliveriesItems () {
      const tempItems = []
      for (const obj of this.resData) {
        const delivery = {}
        delivery['שם לקוח'] = obj.customer_name
        delivery['מספר לקוח'] = obj.customer_number
        delivery['מספר תפוז'] = obj.tapuz_number
        delivery['מספר הזמנה'] = obj.order_number
        delivery['ברקוד'] = obj.barcode
        delivery['סוג'] = obj.delivery_type_value
        delivery['קו'] = obj.line_name
        delivery['סניף'] = obj.branch_name
        delivery['תאריך שידור'] = moment(obj.created_at).format('YYYY-MM-DD HH:mm:ss')
        delivery['סטאטוס'] = obj.status_value
        delivery['עיר איסוף'] = obj.customer_pick_up_city
        delivery['כתובת לקוח'] = obj.customer_pick_up_street + ' ' + obj.customer_pick_up_street_number
        delivery['תאריך איסוף'] = obj.collected_date ? obj.collected_date : null
        delivery['נהג איסוף'] = obj.pickup_driver_name ? obj.pickup_driver_name : null
        delivery['שם נמען'] = obj.target_name
        delivery['טלפון נמען'] = obj.target_phone
        delivery['עיר נמען'] = obj.target_city ? obj.target_city : null
        delivery['רחוב נמען'] = obj.target_street ? obj.target_street : null
        delivery['מספר רחוב נמען'] = obj.target_street_number ? obj.target_street_number : null
        delivery['כניסה נמען'] = obj.entrance ? obj.entrance : null
        delivery['קומה נמען'] = obj['floor'] ? obj['floor'] : null
        delivery['דירה נמען'] = obj.apartment ? obj.apartment : null
        delivery['תאריך סריקה'] = obj.scan_date ? moment(obj.scan_date).format('YYYY-MM-DD HH:mm:ss') : null
        delivery['תאריך מסירה'] = obj.delivered_date
        delivery['חלון מסירה'] = obj.eta_time_window
        delivery['נהג מסירה'] = obj.divisor_driver_name ? obj.divisor_driver_name : null
        delivery['נהג החזרות'] = obj.bring_back_driver_name ? obj.bring_back_driver_name : null
        delivery['ממוצע משוב נמען'] = obj.target_feedback_average ? obj.target_feedback_average : null
        tempItems.push(delivery)
      }
      this.items = tempItems
    },
    DriversItems () {
      const tempItems = []
      for (const obj of this.resData) {
        const driver = {}
        driver['שם נהג'] = obj.first_name + ' ' + obj.last_name
        driver['תעודת זהות'] = obj.identification_id
        driver['סוג רכב'] = obj.car_type
        driver['מספר רכב'] = obj.car_number
        driver['קיבולת'] = obj.car_capacity
        driver['סטאטוס'] = obj.status
        driver['איזור'] = obj.branches.map(b => b.name).join(',')
        driver['טלפון נייד'] = obj.mobile
        driver['קווים'] = obj.lines.map(b => b.name).join(',')
        driver['סוג עובד'] = obj.driver_type
        driver['כתובת מגורים'] = obj.address
        driver['כתובת מגורים'] = obj.address
        driver['עיר מגורים'] = obj.city && obj.city.city_name
        driver['סוג טלפון'] = obj.mobile_type
        driver['תאריך לידה'] = obj.birthdate
        driver['משימות פעילות'] = obj.deliveries_undone ? obj.deliveries_undone : 0
        driver['משימות שבוצעו'] = obj.deliveries_done ? obj.deliveries_done : 0
        tempItems.push(driver)
      }
      this.items = tempItems
    },
    distDelPtsItems () {
      for (const obj of this.resData) {
        const delivery = {}
        delivery['נקודת חלוקה'] = obj.distribution_point && obj.distribution_point.name
        delivery['מספר שק'] = obj.distributionPointBag && obj.distributionPointBag.bag_number
        delivery['שם לקוח'] = obj.customer && obj.customer.name
        delivery['מספר לקוח'] = obj.customer && obj.customer.customer_number
        delivery['מספר תפוז'] = obj.tapuz_number
        delivery['מספר הזמנה'] = obj.order_number
        delivery['ברקוד'] = obj.barcode
        delivery['סוג'] = this.getTypeName(obj.delivery_type)
        delivery['קו'] = obj.line && obj.line.name
        delivery['תאריך שידור'] = obj.created_at
        delivery['סטאטוס'] = obj.status && obj.status.name
        delivery['נהג איסוף'] = obj.pickup_driver ? obj.pickup_driver.first_name + ' ' + obj.pickup_driver.last_name : null
        delivery['שם נמען'] = obj.target_name
        delivery['טלפון נמען'] = obj.target_phone
        delivery['תאריך מסירה'] = obj.delivered_date
        delivery['נהג מסירה'] = obj.divisor_driver ? obj.divisor_driver.first_name + ' ' + obj.divisor_driver.last_name : null
        delivery['שם המקבל'] = obj.distribution_point && obj.distribution_point.contact_name
        this.items.push(delivery)
      }
      console.log('this.items', this.items)
    },
    customersItems () {
      for (const obj of this.resData) {
        const customer = {}
        customer['שם לקוח'] = obj.name
        customer['סטטוס'] = obj.status ? 'פעיל' : 'לא פעיל'
        customer['מספר לקוח'] = obj.customer_number
        customer['חפ'] = obj.hp
        customer['כתובת משרדים'] = obj.address
        customer['טלפון משרדים'] = obj.phone
        customer['אימייל'] = obj.email
        customer['הערות'] = obj.comments
        customer['שיטת תשלום'] = obj.customer_invoices_payment && obj.customer_invoices_payment.payment_method
        customer['מספר הנהלת חשבונות'] = obj.bookkeeping_number
        customer['ממוצע חבילות חודשי'] = null
        customer['כתובת איסוף'] = obj.pickup_address && obj.pickup_address.correct_long_city_name &&
          (obj.pickup_address.correct_long_street_name + ' ' + obj.pickup_address.correct_street_number)
        customer['עיר איסוף'] = obj.pickup_address && obj.pickup_address.correct_long_city_name
        customer['איזור'] = obj.branches && obj.branches.map(b => b.branch && b.branch.name).join(',')
        customer['קו'] = obj.lines && obj.lines.map(l => l.line && l.line.name).join(',')
        this.items.push(customer)
      }
      console.log('this.items', this.items)
    },
    branchItems () {
      for (const obj of this.resData) {
        const branch = {}
        branch['שם הסניף'] = obj.name
        branch['פוליגון'] = obj.polygon && obj.polygon.name
        branch['כמות קווים'] = obj.lines.length
        branch['כמות נהגים'] = obj.drivers.length
        branch['כמות משתמשים'] = obj.drivers.length
        branch['כמות חבילות ממצועת'] = null
        this.items.push(branch)
      }
      console.log('this.items', this.items)
    },
    quantitativeCollectionItems () {
      console.log('quantitativeCollectionItems', this.resData)
      for (const obj of this.resData) {
        const quantitativeCollection = {}
        quantitativeCollection['שם לקוח'] = obj.customer && obj.customer.name
        quantitativeCollection['מספר משימה'] = obj.task_number
        quantitativeCollection['נהג איסוף'] = obj.pickup_driver && obj.pickup_driver.first_name + ' ' + obj.pickup_driver.last_name
        quantitativeCollection['תאריך איסוף מיועד'] = obj.pick_up_date
        quantitativeCollection['סטטוס'] = obj.status
        quantitativeCollection['זמנים'] = obj.punctuality
        quantitativeCollection['עיר'] = obj.customer && obj.customer.pickup_address && obj.customer.pickup_address.correct_long_city_name
        quantitativeCollection['כתובת איסוף'] = obj.customer && obj.customer.pickup_address && obj.customer.pickup_address.correct_long_street_name
        quantitativeCollection['כמות'] = obj.customer.daily_pickup_quantity
        quantitativeCollection['תאריך איסוף'] = obj.pick_up_date
        this.items.push(quantitativeCollection)
      }
    },
    smsHistoryItems () {
      console.log('smsHistoryItems', this.resData)
      for (const obj of this.resData) {
        const sms = {}
        sms['מספר הזמנה'] = obj.delivery?.order_number
        sms['על פי לקוח'] = obj.customer?.name
        sms['סוג משלוח'] = obj.delivery?.delivery_type_value
        sms['סטטוס / סיבת כשל'] = obj.delivery_type_status?.name
        sms['שם נמען'] = obj.delivery?.target_name
        sms['תוכן ההודעה'] = obj.message
        sms['תאריך שליחה'] = moment(obj.created_at).format('YYYY-MM-DD HH:mm:ss')
        this.items.push(sms)
      }
    },
    scanItems () {
      console.log('scanItems', this.resData)
      for (const obj of this.resData) {
        const scan = {}
        const branchDirection = obj.delivery.status_key === 'enter_to' ? obj.delivery.enter_to_branch : obj.status_key === 'exit_to' ? obj.delivery.exit_to_branch : null
        scan['סטטוס'] = obj.delivery?.order_number
        scan['שם לקוח'] = obj.customer?.name
        scan['ברקוד'] = obj.delivery?.delivery_type_value
        scan['סטטוס'] = branchDirection ? (obj.delivery.status_value + branchDirection) : obj.delivery.status_value
        scan['שם קו'] = obj.line?.name
        scan['שם פוליגון'] = obj.polygon?.name
        scan['מספר יציאה'] = obj.exit?.exit_number
        scan['שגיאה'] = obj.err_msg
        scan['תאריך יצירה'] = moment(obj.created_at).format('YYYY-MM-DD HH:mm:ss')
        this.items.push(scan)
      }
    },
    refundStorageItems () {
      for (const obj of this.resData) {
        const refundStorage = {}
        refundStorage['מספר שק'] = obj.refund_bag_number
        refundStorage['שם לקוח'] = obj.customer && obj.customer.name
        refundStorage['כמות חבילות'] = obj.packages && obj.packages.length
        refundStorage['תאריך נעילת שק'] = obj.blocking_date && moment(obj.blocking_date).format('YYYY-MM-DD HH:mm:ss')
        refundStorage['תאריך מסירה ללקוח'] = obj.delivered_date && moment(obj.delivered_date).format('YYYY-MM-DD HH:mm:ss')
        refundStorage['סטאטוס'] = this.getBagStatusValue(obj.status)
        refundStorage['שם מחסנאי'] = obj.storekeeper_name
        refundStorage['נהג'] = obj.driver ? obj.driver.first_name + ' ' + obj.driver.last_name : null
        this.items.push(refundStorage)
      }
      console.log('this.items', this.items)
    },
    uploadExample () {
      console.log('uploadExample')
      const delivery = {}
      delivery['מספר לקוח'] = null
      delivery['שם'] = null
      delivery['שם מזמין'] = null
      delivery['קוד ישוב'] = null
      delivery['שם ישוב'] = null
      delivery['קוד רחוב'] = null
      delivery['שם רחוב'] = null
      delivery['בית'] = null
      delivery['כניסה'] = null
      delivery['קומה'] = null
      delivery['דירה'] = null
      delivery['טלפון'] = null
      delivery['טלפון נוסף'] = null
      delivery['תעודה'] = null
      delivery['ברקוד'] = null
      delivery['קרטונים'] = null
      delivery['גוביינא'] = null
      delivery['הערות'] = null
      delivery['כיוון'] = null
      delivery['סוג כפולה'] = null
      delivery['סוג רכב'] = null
      delivery['סוג דחיפות'] = null
      delivery['תאריך משלוח'] = null
      delivery['שעת התחלה'] = null
      delivery['שעת סיום'] = null
      delivery['חבילות'] = null
      delivery['משטחים'] = null
      this.items.push(delivery)
    },
    getTypeName (type) {
      let deliveryType = null
      const names = {
        regular: 'רגיל',
        dual: 'כפול',
        certificate: 'תעודה',
        collection: 'איסוף',
        govaina: 'גוביינא',
        transference: 'העברה'
      }
      if (!type) {
        deliveryType = null
      } else {
        deliveryType = names[type.name]
      }
      return deliveryType
    }
  }
}
</script>

<style lang="scss" scoped>
.format-component {
  width:auto !important;
  cursor: pointer !important;
  pointer-events: none !important;
}
.hidden {
  display: none;
}
</style>
