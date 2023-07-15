<template>
  <div class="filter-ui" >
    <div
      class="inputs-container"
      @keyup.enter="$emit('submit')">
      <v-row align="center">
        <v-col cols="10">
          <v-row dense>
            <v-col v-if="showFreeSearch" cols="4" >
              <v-text-field
                v-model="freeSearch"
                class="input-ui input-ui-append-inner"
                dense
                rounded
                filled
                label="חיפוש" >
                <template v-slot:append>
                  <i class="icon icon-search"/>
                </template>
              </v-text-field>
            </v-col>
            <v-col v-if="showSearch" cols="4">
              <v-text-field
                v-model="value.search"
                label="חיפוש"
                class="input-ui input-ui-append-inner"
                dense
                rounded
                filled>
                <template v-slot:append>
                  <i class="icon icon-search"/>
                </template>
              </v-text-field>
            </v-col>
            <v-col v-if="showFilterOptions" cols="2">
              <v-select
                v-model="value.filter_option"
                class="select-ui"
                :items="filterOptions"
                item-text="key"
                item-value="value"
                rounded
                filled
                label="סינון חיפוש">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showStatusCode" cols="4">
              <v-select
                v-model="value.status_code"
                clearable
                class="select-ui"
                :items="statusCodes"
                rounded
                filled
                label="קוד סטאטוס" />
            </v-col>
            <v-col v-if="showColumnManageType" cols="6">
              <v-select
                v-model="value.column_manage"
                class="select-ui"
                :items="columnManageType"
                item-text="key"
                item-value="value"
                rounded
                filled
                label="סוג ניהול עמודות">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showReportType" cols="8">
              <v-select
                v-model="report_type_default_selected"
                class="select-ui"
                :items="reportType"
                item-text="key"
                item-value="value"
                rounded
                filled
                :disabled="true"
                label="סוג דוח">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showBranches" cols="2">
              <v-text-field
                v-model="value.branch"
                class="input-ui"
                dense
                rounded
                filled
                label="שם סניף" >
                <template v-slot:append>
                  <i class="icon icon-search"/>
                </template>
              </v-text-field>
            </v-col>
            <v-col v-if="showDrivers" cols="2">
              <v-autocomplete
                v-model="value.driver_id"
                clearable
                rounded
                class="autocomplete-ui"
                filled
                :items="drivers"
                :item-text="item => `${item.first_name} ${item.last_name}`"
                item-value="id"
                label="שם נהג">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col v-if="showDriverStatus" cols="2">
              <v-select
                v-model="value.status"
                clearable
                class="select-ui"
                :items="statusItems"
                item-value="status"
                rounded
                filled
                item-text="name"
                label="סטאטוס" />
            </v-col>
            <v-col v-if="showBranchList" cols="2">
              <v-select
                v-model="value.branch_uid"
                clearable
                class="select-ui"
                rounded
                filled
                :items="branchItems"
                item-text="name"
                item-value="uuid"
                label="איזור" />
            </v-col>
            <v-col v-if="showDistPts" cols="2">
              <v-autocomplete
                v-model="value.dist_point_uid"
                clearable
                rounded
                class="autocomplete-ui"
                filled
                :items="distPts"
                item-text="name"
                item-value="uuid"
                label="נקודת חלוקה">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col v-if="showCustomer" cols="2">
              <v-autocomplete
                v-model="value.customer_uid"
                rounded
                class="autocomplete-ui"
                filled
                :clearable="customerIsClearable"
                :items="customerItems"
                item-text="name"
                item-value="uuid"
                label="לקוח">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col v-if="showCustomerBagNumber" cols="2">
              <v-text-field
                v-model="value.customer_bag_number"
                class="input-ui"
                dense
                rounded
                filled
                label="מספר שק החזרות" />
            </v-col>
            <v-col v-if="showCustomerCity" cols="2">
              <v-text-field
                v-model="value.customer_address"
                class="input-ui"
                dense
                rounded
                filled
                label="עיר לקוח" />
            </v-col>
            <v-col v-if="showTargetCity" cols="2">
              <v-text-field
                v-model="value.target_address"
                class="input-ui"
                dense
                rounded
                filled
                label="עיר נמען" />
              <!--              <v-autocomplete-->
<!--                :items="citiesArray"-->
<!--                :search-input.sync="searchCity"-->
<!--                v-model="value.target_address"-->
<!--                clearable-->
<!--                item-text="city_name"-->
<!--                item-value="city_name"-->
<!--                label="עיר נמען" />-->
            </v-col>
            <v-col v-if="showDeliveryTypes" cols="2">
              <v-combobox
                v-model="value.delivery_types"
                :class="{'combobox-ui': !(value.delivery_types && value.delivery_types.length > 0), 'combobox-ui-open': (value.delivery_types && value.delivery_types.length > 0)}"
                clearable
                filled
                rounded
                :items="deliveryTypesItems"
                multiple
                label="סוגי משלוח"
                item-text="name"
                item-value="key">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-combobox>
            </v-col>
            <v-col v-if="showCancelled" cols="2">
              <v-select
                v-model="value.only_cancelled"
                clearable
                class="select-ui"
                :items="cancelledOptionItems"
                filled
                rounded
                item-text="name"
                label="סינון מבוטלים" >
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showFailed" cols="2">
              <v-select
                v-model="value.cause_failure"
                clearable
                rounded
                class="select-ui"
                filled
                :items="failedOptionItems"
                item-text="name"
                item-value="key"
                label="סינון נכשלים">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showDeliveryStatus" cols="2">
              <v-select
                v-model="value.delivery_type_status_key"
                clearable
                class="select-ui"
                filled
                rounded
                :items="deliveryTypeStatusesItems"
                item-text="name"
                item-value="key"
                label="סטטוס">   <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showCustomerStatus" cols="2">
              <v-select
                v-model="value.status"
                clearable
                rounded
                class="select-ui"
                filled
                :items="customerStatusesItems"
                item-text="value"
                item-value="key"
                label="סטטוס" >
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showBagStatus" cols="2">
              <v-select
                v-model="value.delivery_type_status_key"
                clearable
                rounded
                class="select-ui"
                filled
                :items="BagStatusesItems"
                item-text="name"
                item-value="key"
                label="סטטוס שק">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showDistributionPoints" cols="2">
              <v-select
                v-model="value.dist_point_uid"
                clearable
                rounded
                class="select-ui"
                filled
                :items="DistributionPointItems"
                item-text="name"
                item-value="key"
                label="נקודת חלוקה">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showDistributionPointCities" cols="2">
              <v-select
                v-model="value.city_name"
                clearable
                rounded
                class="select-ui"
                filled
                :items="DistributionPointCitiesItems"
                item-text="name"
                item-value="key"
                label="עיר נקודת חלוקה">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showCollectionTaskStatus" cols="2">
              <v-select
                v-model="value.status"
                clearable
                class="select-ui"
                filled
                rounded
                :items="collectionTaskStatusesItems"
                item-text="value"
                label="סטטוס">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showCity" cols="2">
              <v-select
                v-model="form.city"
                clearable
                :items="[1, 2, 3]"
                label="עיר" />
            </v-col>
            <v-col v-if="showTags" cols="2">
              <v-autocomplete
                v-model="value.tags"
                clearable
                class="autocomplete-ui"
                filled
                rounded
                :items="tagsItems"
                item-text="name"
                item-value="value"
                label="תגיות">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col v-if="showPunctuality" cols="2">
              <v-autocomplete
                v-model="value.punctuality"
                clearable
                rounded
                class="autocomplete-ui"
                filled
                :items="punctualityItems"
                item-text="text"
                item-value="key"
                label="זמנים">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col v-if="showCollectionCity" cols="2">
              <v-text-field
                v-model="value.collectionCity"
                rounded
                class="input-ui"
                filled
                label="עיר איסוף" />
            </v-col>
            <v-col v-if="showLines" cols="2">
              <v-autocomplete
                v-model="value.lines_ids"
                clearable
                multiple
                rounded
                :class="{ 'autocomplete-ui': true, 'autocomplete-ui-height': !(value.lines_ids && value.lines_ids.length > 0) }"
                filled
                :items="lineItems"
                item-text="line_number"
                item-value="id"
                label="קווים">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col v-if="showWithAdditionalDirective" cols="2">
              <v-select
                v-model="value.with_additional_directive"
                clearable
                class="select-ui"
                filled
                rounded
                :items="additionalDirectiveItems"
                item-text="value"
                label="הערות מאת נמען">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </v-col>
            <v-col v-if="showDeliveredDate" cols="2">
              <v-menu
                v-model="deliveredDateForm"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y>
                <template #activator="{ on, attrs }">
                  <v-text-field
                    v-model="formattedDeliveredDate"
                    class="delivered-date-filter"
                    outlined
                    dense
                    :loading="loading"
                    append-icon="icon icon-calender"
                    readonly
                    v-bind="attrs"
                    v-on="on"/>
                </template>
                <v-date-picker
                  v-model="value.delivered_date"
                  @input="deliveredDateForm = false" />
              </v-menu>
            </v-col>
            <v-col v-if="showScanDate" cols="2">
              <v-menu
                v-model="scanDateForm"
                :close-on-content-click="false"
                transition="scale-transition"
                offset-y>
                <template #activator="{ on, attrs }">
                  <v-text-field
                    v-model="formattedScanDate"
                    class="delivered-date-filter"
                    outlined
                    dense
                    :loading="loading"
                    append-icon="icon icon-calender"
                    readonly
                    v-bind="attrs"
                    v-on="on"/>
                </template>
                <v-date-picker
                  v-model="value.scan_date"
                  @input="deliveredDateForm = false" />
              </v-menu>
            </v-col>
            <v-col v-if="showWithoutFilter" cols="2">
              <v-combobox
                v-model="value.without_filter"
                :class="{
                  'combobox-ui': !(value.without_filter && value.without_filter.length > 0),
                  'combobox-ui-open': (value.without_filter && value.without_filter.length > 0)}"
                clearable
                filled
                rounded
                :items="withoutFilters"
                multiple
                label="בחר נתונים ללא"
                item-text="name"
                item-value="key">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-combobox>
            </v-col>
            <v-col v-if="onDriversSelected" cols="2">
              <slot name="printDriverDeliveries" />
            </v-col>
            <v-col v-if="showPaymentStatus" cols="2">
              <v-autocomplete
                v-model="value.payment_status"
                clearable
                class="autocomplete-ui"
                filled
                rounded
                :items="paymentStatuses"
                item-text="title"
                item-value="key"
                label="סטאטוס">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col v-if="showGovainaStatus" cols="2">
              <v-autocomplete
                v-model="value.goviana_status"
                clearable
                class="autocomplete-ui"
                filled
                rounded
                :items="govainaStatuses"
                item-text="title"
                item-value="key"
                label="סטאטוס">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col v-if="showLineCity" cols="2">
              <v-text-field
                v-model="value.city_name"
                class="input-ui"
                dense
                rounded
                filled
                label="עיר" />
            </v-col>
            <v-col v-if="showLineStreet" cols="2">
              <v-text-field
                v-model="value.street_name"
                class="input-ui"
                dense
                rounded
                filled
                label="רחוב" />
            </v-col>
            <v-col v-if="showLineNumber" cols="2">
              <v-text-field
                v-model="value.line_number"
                class="input-ui"
                dense
                rounded
                filled
                label="מספר קו" />
            </v-col>
            <slot />
          </v-row>
        </v-col>
        <v-col v-if="showReset" class="clear-search-col">
          <small
            class="clear-filter clear-search trash-icon"
            @click="clearFilterInputs">
            <img src="../../assets/images/icons/trash.svg"/>איפוס סינון
          </small>
        </v-col>
      </v-row>
      <v-row
        v-if="showSubmitButton"
        class="filter-submit">
        <v-col cols="12">
          <v-btn
            class="white--text"
            color="#fa4616"
            @click="$emit('submit')">
            {{ 'מיין תוצאות' }}
          </v-btn>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script>
import _ from 'lodash'
import moment from 'moment'

export default {
  name: 'FilterUi',
  props: {
    showCustomerStatus: { type: Boolean, default: false },
    showCustomerBagNumber: { type: Boolean, default: false },
    showWithAdditionalDirective: { type: Boolean, default: false },
    showWithoutFilter: { type: Boolean, default: false },
    showDistributionPointCities: { type: Boolean, default: false },
    distributionPointCities: { type: Array, default: () => ([]) },
    dataLoading: { type: Boolean, default: false },
    showSubmitButton: { type: Boolean, default: false },
    showFreeSearch: { type: Boolean, default: false },
    showSearch: { type: Boolean, default: false },
    showFilterOptions: { type: Boolean, default: false },
    showBranches: { type: Boolean, default: false },
    showDistPts: { type: Boolean, default: false },
    showBranchList: { type: Boolean, default: false },
    showDrivers: { type: Boolean, default: false },
    showCustomer: { type: Boolean, default: false },
    showCustomerCity: { type: Boolean, default: false },
    showTargetCity: { type: Boolean, default: false },
    showCancelled: { type: Boolean, default: false },
    showFailed: { type: Boolean, default: false },
    failureList: { type: Array, default: () => ([]) },
    showDeliveryTypes: { type: Boolean, default: false },
    branchList: { type: Array, default: () => ([]) },
    distPts: { type: Array, default: () => ([]) },
    statusList: { type: Array, default: () => ([]) },
    deliveryTypes: { type: Array, default: () => ([]) },
    customerList: { type: Array, default: () => ([]) },
    tags: { type: Array, default: () => ([]) },
    lines: { type: Array, default: () => ([]) },
    deliveryTypeStatuses: { type: Array, default: () => ([]) },
    collectionTaskStatuses: { type: Array, default: () => ([]) },
    customerStatuses: { type: Array, default: () => ([]) },
    showUrgency: { type: Boolean, default: false },
    showDriverStatus: { type: Boolean, default: false },
    showDeliveryStatus: { type: Boolean, default: false },
    showBagStatus: { type: Boolean, default: false },
    bagStatuses: { type: Object, default: () => ({}) },
    showDistributionPoints: { type: Boolean, default: false },
    distributionPoints: { type: Array, default: () => ([]) },
    showCollectionTaskStatus: { type: Boolean, default: false },
    showCity: { type: Boolean, default: false },
    showTags: { type: Boolean, default: false },
    showLines: { type: Boolean, default: false },
    onDriversSelected: { type: Boolean, default: false },
    showPaymentStatus: { type: Boolean, default: false },
    showGovainaStatus: { type: Boolean, default: false },
    customerIsClearable: { type: Boolean, default: false },
    paymentStatuses: { type: Array, default: () => ([]) },
    govainaStatuses: { type: Array, default: () => ([]) },
    withoutFilters: { type: Array, default: () => ([]) },
    value: { type: Object, default: () => ({}) },
    clearFilterInputs: { type: Function, default: () => ({}) },
    showReset: { type: Boolean, default: false },
    showPunctuality: { type: Boolean, default: false },
    showCollectionCity: { type: Boolean, default: false },
    punctuality: { type: Array, default: () => ([]) },
    submitText: { type: String, default: null },
    showStatusCode: { type: Boolean, default: false },
    drivers: { type: Array, default: () => ([]) },
    showDeliveredDate: { type: Boolean, default: false },
    showScanDate: { type: Boolean, default: false },
    showLineCity: { type: Boolean, default: false },
    showLineStreet: { type: Boolean, default: false },
    showColumnManageType: { type: Boolean, default: false },
    showReportType: { type: Boolean, default: false },
    showLineNumber: { type: Boolean, default: false }
  },

  data () {
    return {
      formattedDeliveredDate: 'תאריך מסירה',
      formattedScanDate: 'תאריך סריקה',
      deliveredDateForm: false,
      scanDateForm: false,
      filterOptions: [
        { value: 2, key: 'חודשיים אחרונים' },
        { value: 3, key: '3 חודשים אחרונים' },
        { value: 4, key: '4 חודשים אחרונים' },
        { value: 5, key: '5 חודשים אחרונים' },
        { value: 6, key: '6 חודשים אחרונים' }
      ],
      loading: false,
      freeSearch: null,
      searchCustomerCity: '',
      searchCity: '',
      citiesArray: [{ city_name: 'ללא עיר לקוח' }],
      columnManageType: [
        { value: "excel", key: "לְהִצטַיֵן"},
        { value: "display", key: "לְהַצִיג"}
      ],
      report_type_default_selected: { value: "usersSettings", key: "הגדרות משתמשים"},
      reportType: [
        { value: "deliveries", key: "משלוחים"},
        { value: "distributionPointsList", key: "נקודות חלוקה"},
        { value: "usersSettings", key: "הגדרות משתמשים"},
        { value: "smsMessagesSettings", key: "הודעות SMS"},
        { value: "refunds", key: "זיכויים"},
        { value: "distributionPointBags", key: "שקי נקודות חלוקה"},
        { value: "distributionDeliveriesPoints", key: "משלוחי נקודות חלוקה"},
        { value: "customers", key: "לקוחות"},
        { value: "driversManagement", key: "ניהול נהגים"},
        { value: "drivers", key: "נהגים"},
        { value: "customerBags", key: "שקי לקוחות"},
        { value: "collectionTasks", key: "משימות איסוף"},
        { value: "polygons", key: "פוליגונים"},
        { value: "scans", key: "סריקות"},
        { value: "example", key: "מסמך דוגמה"},
      ],
      statusCodes: [
        100, 101, 102, 103, 200,
        201, 202, 203, 204, 205, 206,
        300, 301, 302, 303, 304, 307,
        308, 400, 401, 402, 403, 404,
        405, 406, 407, 408, 409, 410,
        411, 412, 413, 414, 415, 416,
        417, 418, 421, 422, 424, 429,
        500, 501, 502, 503, 504, 505
      ],
      form: {
        customer_uid: '',
        deliveryTypes: '',
        urgency: '',
        status: '',
        city: '',
        tags: '',
        branch: ''
      }
    }
  },
  computed: {
    punctualityItems () {
      const arr = []
      arr.push({ key: null, text: 'הכל' })
      return arr.concat(this.punctuality)
    },
    customerItems () {
      const arr = []
      return arr.concat(this.customerList)
    },
    lineItems () {
      const arr = [
        { id: 'isNull', line_number: 'ללא קו' }
      ]

      const filteredLines = this.lines?.filter(line => !!line?.line_number)
      return arr.concat(filteredLines)
    },
    deliveryTypesItems () {
      const arr = []
      let list = arr.concat(this.deliveryTypes)
      list = list.map(type => {
        return {
          id: type.id,
          name: type.value
        }
      })
      list.unshift({ id: null, name: 'הכל' })
      return list
    },
    deliveryTypeStatusesItems () {
      const arr = []
      arr.push({ key: 'all_statuses', name: 'כל הסטטוסים כולל בוצע' })
      return arr.concat(this.deliveryTypeStatuses)
    },
    BagStatusesItems () {
      const arr = []
      arr.push({ key: null, name: 'הכל' })
      const keys = Object.keys(this.bagStatuses)
      for (const key of keys) {
        arr.push({ key, name: this.bagStatuses[key] })
      }
      return arr
    },
    DistributionPointItems () {
      const arr = []
      arr.push({ key: null, name: 'הכל' })
      console.log('this.distributionPoints', this.distributionPoints)
      this.distributionPoints.forEach(distPoint => {
        arr.push({ key: distPoint.uuid, name: distPoint.name })
      })
      return arr
    },
    DistributionPointCitiesItems () {
      const arr = []
      arr.push({ key: null, name: 'הכל' })
      this.distributionPointCities.forEach(distPointCity => {
        arr.push({ key: distPointCity, name: distPointCity })
      })
      return arr
    },
    tagsItems () {
      const arr = this.tags.map(tag => ({ name: tag.text, value: tag.text }))
      arr.unshift({ name: 'ללא תגיות', value: 'isNull' })
      return arr
    },
    failedOptionItems () {
      const arr = []
      arr.push(
        { key: 'isNull', name: 'ללא כשל' },
        { key: 'withFailure', name: 'עם סיבת כשל' }
      )
      this.failureList.forEach(failure => arr.push(failure))
      arr.concat(this.failureList)
      return arr
    },
    cancelledOptionItems () {
      const arr = []
      arr.push(
        { key: 'not-canceled', name: 'לא בוטלו' },
        { key: 'canceled', name: 'שבוטלו' }
      )
      return arr
    },
    additionalDirectiveItems () {
      const arr = []
      arr.push(...[
        { key: 'with', value: 'עם הערות מאת נמען' },
        { key: 'without', value: 'ללא הערות מאת נמען' }
      ])
      return arr
    },
    customerStatusesItems () {
      const arr = []
      arr.push({ key: null, value: 'הכל' })
      return arr.concat(this.customerStatuses)
    },
    collectionTaskStatusesItems () {
      const arr = []
      arr.push({ key: null, value: 'הכל' })
      return arr.concat(this.collectionTaskStatuses)
    },
    branchItems () {
      const arr = []
      arr.push({ uuid: null, name: 'הכל' })
      return arr.concat(this.branchList)
    },
    statusItems () {
      const arr = []
      arr.push({ status: null, name: 'הכל' })
      return arr.concat(this.statusList)
    }
  },
  watch: {
    'value.lines_ids': {
      handler (newVal) {
        const isNullChosen = newVal?.some?.(lineNumber => isNaN(lineNumber))
        const isLineChosen = newVal?.some?.(lineNumber => !isNaN(lineNumber))
        if (isNullChosen) {
          this.lineItems.forEach(line => Object.assign(line, { disabled: !isNaN(line.id) }))
        } else if (isLineChosen) {
          this.lineItems.forEach(line => Object.assign(line, { disabled: isNaN(line.id) }))
        } else {
          this.lineItems.forEach(line => Object.assign(line, { disabled: false }))
        }
      },
      deep: true
    },
    'value.delivered_date' (newVal) {
      this.formattedDeliveredDate = newVal ? moment(newVal).format('DD-MM-YYYY') : 'תאריך מסירה'
    },
    'value.scan_date' (newVal) {
      this.formattedScanDate = newVal ? moment(newVal).format('DD-MM-YYYY') : 'תאריך סריקה'
    },
    value: {
      handler (newFilter) {
        this.$emit('input', newFilter)
      },
      deep: true
    },
    searchCustomerCity (val) {
      if (val) {
        this.queryCities(val)
      }
    }
  },
  methods: {
    queryCities: _.debounce(async function () {
      if (!this.searchCustomerCity || this.searchCustomerCity === '') {
        return
      }

      this.citiesArray = await this.$cityService.list({ chars: this.searchCustomerCity })
      this.citiesArray = this.citiesArray.map(city => city.city_name && city.city_name.replace(/\s+/g, ' ').trim())
      this.citiesArray.unshift({ city_name: 'ללא עיר לקוח' })
    }, 500),
    getTypeName (type) {
      let deliveryType = null
      const names = {
        regular: 'רגיל',
        dual: 'כפול',
        certificate: 'תעודה',
        collection: 'איסוף',
        quantity_collection: 'איסוף כמותי',
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
.filter-submit {
  padding-right: 20px;
}
.clear-filter {
  margin-right: 10px;
}
.select-ui,
.autocomplete-ui,
.input-ui,
.combobox-ui,
.combobox-ui-open  {
  margin-right: 20px !important;
  width: 460px !important;
}

.autocomplete-ui.v-input--is-focused.v-select--is-multi,
.autocomplete-ui.v-select--is-multi {
  ::v-deep {
    height: fit-content !important;
    .v-label {
      top: 25px !important;
    }

    button {
      padding-top: 20px;
    }

    .v-input__slot {
      height: fit-content !important;
    }
  }
}

.autocomplete-ui-height.v-input--is-focused.v-select--is-multi,
.autocomplete-ui-height.v-select--is-multi {
  ::v-deep {
    height: 40px !important;
    .v-input__slot {
      height: 40px !important;
    }
    .v-input__append-inner {
      padding-top: 10px;
    }
  }
}

.delivered-date-filter {
  margin-right: 20px !important;
  width: 460px !important;
  ::v-deep {
    .v-input__slot {
      background-color: #FFFFFF;
    }
    input {
      color: #9C9DAF;
    }
    fieldset {
      border: 1px solid #DFDFDF !important;
    }
  }

}

.inputs-container{
  margin-bottom: 30px;
}
</style>
