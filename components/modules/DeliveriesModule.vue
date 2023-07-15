<template>
  <div class="coordinator">
    <SectionLayout :title="title" :class="['d-print-none', 'mainBody']">
      <template class="d-print-none" #header>
        <CardDriver
          v-show="driversSelected && driversSelected.length > 0"
          :selected-array="driversSelectedArray"/>
        <DateFilter
          v-if="!driversSelected || driversSelected.length === 0"
          v-model="filter.datesFilter"
          :loading="loading"/>
      </template>

      <InfoPanel
        v-model="filter.delivery_type_status_key"
        :class="['d-print-none','info-panel-coordinator']"
        show-clear-button
        widget-clickable
        :widgets="widgetsSummaries"
        :widgets-loading="summariesLoading"/>

      <div class="coordinator-body">
        <FilterUi
          v-model="filter"
          class="filter-ui"
          show-customer-bag-number
          show-collected-date
          show-created-date
          show-delivered-date
          show-scan-date
          show-filter-options
          show-with-additional-directive
          show-without-filter
          :without-filters="withoutFilters"
          show-failed
          :failure-list="failureList"
          customer-is-clearable
          show-reset
          :clear-filter-inputs="clearFilterInputs"
          show-delivery-status
          :delivery-type-statuses="delivery_type_statuses"
          show-customer
          :customer-list="customers"
          show-cancelled
          show-delivery-types
          :delivery-types="delivery_types"
          show-tags
          :tags="tagList"
          show-lines
          :lines="lines"
          show-search
          show-customer-city
          show-target-city
          :on-drivers-selected="driversSelected && driversSelected.length > 0"
          :data-loading="loading"
          @submit="filterHelper"/>
        <div :class="['col-2', 'btns-coordinator']">
          <v-btn class="btn-primary" @click="filterHelper">
            מיין תוצאות
          </v-btn>
          <v-btn
            depressed
            :class="{'white--text': true, 'btn-gray': true, 'disable-events': !showActions}"
            @click.prevent="multiPrint">
            <img src="../../assets/images/icons/printer.svg"/>
            הדפסת מדבקה
          </v-btn>

          <ExportReport
            report-type="deliveries"
            :filter="filter"
            :pagination="pagination"
            :by-driver-ids="driversSelected"
            :branch_id="branchSelected"/>
          <v-select
            v-if="showActions"
            :key="vSelect"
            rounded
            class="coordinatorActions"
            filled
            :items="actions"
            item-text="name"
            item-value="key"
            :label="showActionsLabel ? 'פעולות' : ''"
            @change="selectAction"/>

          <div v-if="showActions && associatedToDriver" class="choose-driver-coordinator">
            <v-autocomplete
              v-model="associatedTo"
              dense
              filled
              outlined
              :items="drivers"
              :item-text="driverItem => driverItem && `${driverItem.first_name} ${driverItem.last_name}`"
              item-value="uuid"
              :label="associatedTo === null ? 'בחר נהג' : ''"/>
            <v-btn
              :loading="actionLoading"
              :disabled="associatedTo === null"
              class="btn-primary"
              style="margin: 0"
              @click.prevent="dialogOnConfirm">
              שמירה
            </v-btn>
          </div>
        </div>
        <small
          v-if="showActions"
          class="deliveries-checked-amount">
          {{ `מספר המשלוחים שסומנו: ${deliveriesPrint && deliveriesPrint.length}` }}
        </small>

        <CardUi class="d-print-none text-center" overflow>
          <v-flex>
            <v-data-table
              :key="renderKey"
              v-model="deliveriesPrint"
              :headers="headers"
              :items="items"
              :server-items-length="totalItems"
              :options.sync="options"
              item-key="id"
              show-select
              class="elevation-1"
              :item-class="itemRowBackground"
              :loading="loading"
              loading-text="טוען משלוחים, אנא המתן..."
              :footer-props="footerProps"
              @click:row="showInfo">
              <template v-slot:no-data>
                <p v-text="'אין מידע.'"/>
              </template>

              <template v-slot:item.barcode="{ item }">
                <p
                  v-if="item.barcode && item.barcode.length > 10"
                  style="margin-bottom: 0"
                  v-text="item.barcode.slice(0, 9) + '...'" />
                <p
                  v-else
                  style="margin-bottom: 0"
                  v-text="item.barcode"/>
              </template>

              <template v-slot:item.info="{ item, index }">
                <LogsDialog
                  :ref="`logs_dialog_${index}`"
                  :delivery="item"
                  @reset-other-logs="resetOtherLogs(index)"/>
              </template>

              <template v-slot:item.created_at="{ item }">
                {{ item.created_at | formatDate2 }}
              </template>

              <template v-slot:item.collected_date="{ item }">
                {{ item.collected_date | formatDate2 }}
              </template>

              <template v-slot:item.delivered_date="{ item }">
                {{ item.delivered_date | formatDate2 }}
              </template>

              <template v-slot:item.status="{ item }">
                <StatusesUi
                  v-if="item.status"
                  :status-value="getDeliveryStatusValue(item)"
                  :status-key="item.status.key"/>
              </template>

              <template v-slot:item.pickup_driver="{ item }">
                <p
                  v-if="item.pickup_driver"
                  style="margin-bottom: 0"
                  v-text="`${item.pickup_driver.first_name} ${item.pickup_driver.last_name}`"/>
              </template>

              <template v-slot:item.divisor_driver="{ item }">
                <p
                  v-if="item.divisor_driver"
                  style="margin-bottom: 0"
                  v-text="`${item.divisor_driver.first_name} ${item.divisor_driver.last_name}`"/>
              </template>

              <template v-slot:item.bring_back_driver="{ item }">
                <p
                  v-if="item.bring_back_driver"
                  style="margin-bottom: 0"
                  v-text="`${item.bring_back_driver.first_name} ${item.bring_back_driver.last_name}`"/>
              </template>

              <template v-slot:item.last_scan="{ item }">
                <div v-if="item.status_data">
                  {{ getLastScanDate(item.status_data.status_history) | formatDate2 }}
                </div>
              </template>

              <template v-slot:item.collected_date="{ item }">
                <div v-if="item.collected_date">
                  {{ item.collected_date | formatDate2 }}
                </div>
                <div v-else-if="item.status_data">
                  {{ getFirstScanDate(item.status_data.status_history) | formatDate2 }}
                </div>
              </template>
            </v-data-table>
          </v-flex>

          <v-dialog
            v-model="dialog"
            persistent
            max-width="700">
            <v-card>
              <v-card-title class="headline">
                הודעה
              </v-card-title>
              <v-card-text>{{ dialogTitle }}</v-card-text>
              <v-textarea
                v-if="selectedAction === 'sendSms'"
                v-model="smsContent"
                :no-resize="true"
                label="תוכן ההודעה"/>
              <v-switch
                v-model="showDeliveriesList"
                color="orange darken-3"
                :label="showDeliveriesList ? 'הסתר משלוחים שסומנו' : 'הצג משלוחים שסומנו'"/>
              <v-virtual-scroll
                v-if="showDeliveriesList"
                :items="deliveriesPrint"
                height="200"
                item-height="45">
                <template v-slot:default="{ item }">
                  <v-container>
                    <v-row>
                      <v-col cols="4">
                        ברקוד: <span style="color:#fa4616"> {{ item.barcode }} </span>,
                      </v-col>
                      <v-col cols="4">
                        שם נמען: <span style="color:#fa4616"> {{ item.target_name }} </span>,
                      </v-col>
                      <v-col v-if="selectedAction === 'sendSms'" cols="4">
                        נייד: <span style="color:#fa4616"> {{ item.target_phone }} </span>
                      </v-col>
                      <v-col v-else cols="4">
                        שם לקוח: <span style="color:#fa4616"> {{ item.customer_name }} </span>
                      </v-col>
                    </v-row>
                  </v-container>
                </template>
              </v-virtual-scroll>
              <v-card-actions>
                <v-spacer />
                <v-btn
                  color="green darken-1"
                  text
                  @click="resetActionSelect(false)">
                  בטל
                </v-btn>
                <v-btn
                  color="green darken-1"
                  text
                  :loading="actionLoading"
                  @click="dialogOnConfirm">
                  בצע
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

        </CardUi>
      </div>

      <DrawerUi v-model="tab" :tabs="tabs" class="d-print-none">
        <template v-if="$hasPermission('coordinator', 'edit')" #header>
          <div v-if="delivery && delivery.uuid">
            <v-btn
              class="btn-primary"
              :loading="loading"
              :disabled="disableCopyDelivery"
              @click.prevent="copyDelivery">
              {{ disableCopyDelivery ? 'שוכפל בהצלחה' : 'שכפול משלוח' }}
            </v-btn>

            <v-btn
              class="btn-primary"
              @click.prevent="openPreviewPrintSticker">
              הדפסת מדבקה
            </v-btn>
          </div>

          <v-btn
            class="btn-primary"
            :loading="loading"
            @click.prevent="onsubmit">
            שמירה
          </v-btn>
        </template>

        <template
          v-if="['coordinator-delivery', 'customer-service-delivery'].includes($route.name) && delivery.uuid"
          #aside>
          <div
            v-if="delivery.status"
            style="display: flex; margin-bottom: 10px; justify-content: center;">
            <StatusesUi
              v-if="delivery.status"
              :status-value="getDeliveryStatusValue(delivery)"
              :status-key="delivery.status.key"/>
          </div>
          <div
            v-if="delivery.status"
            style="display: grid; margin-bottom: 10px;justify-content: center;">
            <div
              v-if="delivery.delivered_date"
              class="unedited-field">
              <small>זמן מסירה:</small>
              <small style="margin: auto;font-weight: 700;">
                {{ delivery.delivered_date | formatDate }}
              </small>
            </div>
            <div v-else-if="delivery.duration_value" class="unedited-field">
              <small>חלון מסירה משוער:</small>
              <small style="margin: auto;font-weight: 700;">
                {{ delivery.duration_time | formatDate }}
              </small>
            </div>
          </div>
          <v-spacer />
          <div
            v-if="delivery.duration_time"
            style="display: flex; margin-bottom: 10px;justify-content: center;">
            <div class="unedited-field">
              <small>חלון מסירה:</small>
              <small
                v-if="delivery.duration_time"
                style="margin: auto;font-weight: 700;">{{ delivery.duration_time }}</small>
              <small v-else>טרם עודכן</small>
            </div>
          </div>

          <TagsUi
            v-model="tags"
            :tag-list="tagList"/>

          <DeliveryStatus :delivery-info="delivery"/>
        </template>
        <n-child
          :delivery="delivery"
          :customer-fields="customerFields"
          :tags="tags"
          :delivery-types="deliveryTypesItems"
          :drivers="drivers"
          :customers="customers"/>
      </DrawerUi>
    </SectionLayout>

    <FlatStickerUi
      v-show="(printDeliveries && authUser && authUser.print_type === 'Sticker')"
      :deliveries="deliveriesPrint"
      :delivery="delivery"
      @printed="isPrinted"/>

    <FlatStickersUi
      v-show="(printDeliveries && authUser && authUser.print_type === 'A4')"
      :deliveries="deliveriesPrint"
      :delivery="delivery"
      @printed="isPrinted"/>

    <PrintListUi
      v-if="printDriverDeliveries"
      :driver-selected="driverPrintList"
      :items="printList"
      :headers="printListHeaders"
      title="רשימת משלוחים"/>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'

export default {
  name: 'DeliveriesModule',
  props: {
    title: { type: String, default: '' }
  },

  data () {
    return {
      disableCopyDelivery: false,
      renderKey: false,
      showOriginalTable: false,
      withoutFilters: [
        { name: 'ללא עיר לקוח', key: 'customer_city' },
        { name: 'ללא עיר יעד', key: 'target_city' },
        { name: 'ללא כתובת יעד', key: 'target_street' },
        { name: 'ללא נכשלים', key: 'failures' },
        { name: 'ללא תגיות', key: 'tags' },
        { name: 'ללא קווים', key: 'lines' },
        { name: 'ללא נהג אוסף', key: 'pickup_driver' },
        { name: 'ללא נהג מוסר', key: 'divisor_driver' },
        { name: 'ללא נהג החזרות', key: 'bring_back_driver' }
      ],
      smsContent: '',
      dialogTitle: '',
      selectedAction: null,
      sendSms: false,
      actionLoading: false,
      vSelect: null,
      showDeliveriesList: false,
      showActionsLabel: true,
      isPrintDisabled: false,
      loading: false,
      drawerInfo: false,
      checkBoxClicked: false,
      rowClicked: false,
      showActions: false,
      item: null,
      tab: null,
      deliveriesPrint: [],
      flatDeliveriesPrint: [],
      summaries: {},
      summariesLoading: false,
      options: {},
      dialog: false,
      selected: [],
      associatedTo: null,
      items: [],
      totalItems: 1000,
      delivery: {},
      filter: {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        },
        filter_option: 2
      },
      associatedToDriver: false,
      cancelDelivery: false,
      cancelDriver: false,
      pagination: {
        skip: 0,
        take: 100
      },
      sortBy: {
        value: null,
        sortOrder: null
      },
      tags: [],
      formNames: {
        '/coordinator/delivery': 'deliveryData',
        '/customer-service/delivery': 'deliveryData',
        '/coordinator/logs': 'logsData'
      },
      formName: 'deliveryData',
      bottom: false,
      printDriverDeliveries: false,
      printDeliveries: false,
      printList: [],
      driverPrintList: null,
      printListHeaders: [
        { text: 'ברקוד', align: 'center', value: 'barcode' },
        { text: 'שם לקוח', align: 'center', value: 'customer_name' },
        { text: 'סוג משלוח', align: 'center', value: 'delivery_type' },
        { text: 'שם נמען', value: 'target_name' },
        { text: 'כתובת נמען', align: 'center', value: 'target_address' },
        { text: 'סכום גוביינא', align: 'center', value: 'govaina_amount' },
        { text: 'הערות משלוח', sortable: false, align: 'center', value: 'comments' }
      ]
    }
  },
  computed: {
    ...mapGetters('auth', ['customer', 'branchSelected']),
    ...mapState('global', [
      'delivery_types',
      'customers',
      'driver',
      'driversSelected',
      'drivers',
      'lines',
      'tagList',
      'delivery_type_statuses',
      'onUploadByCsv',
      'failureList',
      'footerProps'
    ]),
    ...mapState('auth', ['authUser']),

    actions () {
      const arr = [
        { name: 'שליחת SMS', key: 'sendSms' },
        { name: 'חוזר לשולח', key: 'returnToStorage' }
      ]
      let allMarkedIsLost = true
      let allMarkedIsCancelled = true
      let allMarkedIsDone = true
      let atLeastOneMarkedIsDone = false
      for (const delivery of this.deliveriesPrint) {
        if (delivery.status_key !== 'lost') {
          allMarkedIsLost = false
        }
        if (delivery.status_key !== 'cancelled') {
          allMarkedIsCancelled = false
        }
        if (delivery.status_key === 'done') {
          atLeastOneMarkedIsDone = true
        } else {
          allMarkedIsDone = false
        }
      }
      if (allMarkedIsLost) {
        arr.push({ name: 'ביטול סימון כאבוד', key: 'deliveriesRetrieved' })
      } else {
        arr.push({ name: 'סמן כבוטל', key: 'cancelDelivery' })
      }
      if (allMarkedIsCancelled) {
        arr.push({ name: 'ביטול סימון כמבוטל', key: 'unCancelDelivery' })
      } else {
        arr.push({ name: 'סמן כאבוד', key: 'lostDeliveries' })
      }
      if (!atLeastOneMarkedIsDone) {
        arr.push({ name: 'סמן כבוצע', key: 'markAsDone' })
      } else if (allMarkedIsDone) {
        arr.push({ name: 'שחרר מבוצע', key: 'releaseFromDone' })
      }
      if (this.$route.name === 'coordinator') {
        arr.push(...[
          { name: 'שיוך לנהג', key: 'associatedTo' },
          { name: 'הורדה מנהג', key: 'cancelDriver' }])
      }
      return arr
    },
    headers () {
      const arr = [
        { text: 'תקציר', align: 'center', value: 'info', sortable: false },
        { text: 'שם לקוח', align: 'right', value: 'customer.name' },
        { text: 'ברקוד', align: 'right', value: 'barcode' },
        { text: 'סוג', align: 'center', value: 'delivery_type.value' },
        { text: 'קו', align: 'center', value: 'line.line_number' },
        { text: 'פוליגון', align: 'center', value: 'polygon.name' },
        { text: 'תאריך שידור', align: 'center', value: 'created_at' },
        { text: 'סטטוס', class: 'status-header', align: 'center', value: 'status' },
        { text: 'סריקה אחרונה', align: 'center', value: 'last_scan' },
        { text: 'כשל', align: 'center', value: 'failure.value' },
        { text: 'עיר מוצא', align: 'center', value: 'customer.pickup_address.correct_long_city_name' },
        { text: 'כתובת מוצא', align: 'center', value: 'customer.pickup_address.correct_long_street_name' },
        { text: 'תאריך איסוף', align: 'center', value: 'collected_date' },
        { text: 'עיר יעד', align: 'center', value: 'target_address.correct_long_city_name' },
        { text: 'כתובת יעד', align: 'center', value: 'target_address.correct_long_street_name' },
        { text: 'חלון מסירה', align: 'center', value: 'duration_time' },
        { text: 'תאריך מסירה', align: 'center', value: 'delivered_date' },
        { text: 'נהג אוסף', align: 'center', value: 'pickup_driver' },
        { text: 'נהג מוסר', align: 'center', value: 'divisor_driver' },
        { text: 'נהג החזרות', align: 'center', value: 'bring_back_driver' },
        { text: 'יציאה ממיינת', align: 'center', value: 'new_exits_management.exit_number' },
        { text: 'נמסר בפועל על ידי', align: 'center', value: 'delivered_in_practice' }
      ]
      if (this.driversSelected?.length > 0) {
        arr.unshift({ text: 'סידור', align: 'center', value: 'position' })
      }
      this.userColumnPermissions.forEach(allCol => {
        arr.forEach((col, index) => {
          if (allCol.value === col.text) {
            if (!allCol.display) {
              arr.splice(index, 1)
            }
          }
        });
      });
      return arr;
    },
    deliveryTypesItems () {
      const arr = []
      let list = arr.concat(this.delivery_types)
      list = list.map(type => ({
        id: type.id,
        name: type.value,
        key: type.name
      }))
      return list
    },
    tabs () {
      let tabs = [
        { title: 'משלוח', to: { name: `${this.$route.matched[0].name}-delivery` }, mode: 'create_edit' }
      ]
      if (this.delivery && this.delivery.uuid) {
        tabs.push({ title: 'לוג משלוח', to: { name: `${this.$route.matched[0].name}-logs` }, mode: 'create' })
      }

      tabs = tabs.filter(tab => this.$hasPermission(tab.to.name))
      return tabs
    },
    defaultDeliveryType () {
      for (const type of this.delivery_types) {
        if (this.delivery.delivery_type.name === type.name) {
          return type
        }
      }
      return null
    },
    customerFields () {
      return this.computeObject('delivery', 'customer')
    },
    driversSelectedArray () {
      const items = []
      this.drivers.forEach(item => {
        if (this.driversSelected?.length > 0 && this.driversSelected?.includes(item.id)) {
          return items.push(item)
        }
      })
      return items
    },
    widgetsSummaries () {
      return [
        { key: 'accepted', title: 'שודר', value: this.summaries.accepted || 0 },
        { key: 'waiting_to_be_collected', title: 'ממתין לאיסוף', value: this.summaries.waiting_to_be_collected || 0 },
        { key: 'collected', title: 'נאסף', value: this.summaries.collected || 0 },
        { key: 'stored', title: 'נקלט ממיינת', value: this.summaries.sorter_stored || 0 },
        { key: 'on_target_way', title: 'בדרך ליעד', value: this.summaries.on_target_way || 0 },
        { key: 'done', title: 'בוצע', value: this.summaries.done || 0 },
        { key: 'error', title: 'כשל', value: this.summaries.error || 0 }
      ]
    }
  },
  watch: {
    deliveriesPrint (newValue) {
      this.showActions = newValue?.length > 0
    },
    options: {
      async handler (newOptions, oldOptions) {
        try {
          if (Object.keys(oldOptions)?.length < 1) {
            return
          }
          const { sortBy, sortDesc } = newOptions
          this.pagination = {
            skip: (newOptions.page - 1) * newOptions.itemsPerPage,
            take: newOptions.itemsPerPage
          }
          this.sortBy = {
            value: sortBy[0],
            sortOrder: sortDesc[0] ? 'DESC' : 'ASC'
          };
          await this.getDeliveriesViews()
          /* this.items = this.items.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'customer.name':
                sortA = a.customer.name || ''
                sortB = b.customer.name || ''
                break
              case 'order_number':
                sortA = a.order_number
                sortB = b.order_number
                break
              case 'line.line_number':
                sortA = a.line.line_number?.charCodeAt(0) || 0
                sortB = b.line.line_number?.charCodeAt(0) || 0
                break
              case 'delivery_type.value':
                sortA = a.delivery_type.value || ''
                sortB = b.delivery_type.value || ''
                break
              case 'line.name':
                sortA = a.line.name || ''
                sortB = b.line.name || ''
                break
              case 'polygon.name':
                sortA = a.polygon?.name || ''
                sortB = b.polygon?.name || ''
                break
              case 'created_at':
                sortA = a.created_at || 0
                sortB = b.created_at || 0
                break
              case 'status':
                sortA = a.status.key
                sortB = b.status.key
                break
              case 'failure.value':
                sortA = a.failure?.value || ''
                sortB = b.failure?.value || ''
                break
              case 'customer.pickup_address.correct_long_city_name':
                sortA = a.customer?.pickup_address?.correct_long_city_name || ''
                sortB = b.customer?.pickup_address?.correct_long_city_name || ''
                break
              case 'customer.pickup_address.correct_long_street_name':
                sortA = a.customer?.pickup_address?.correct_long_street_name || ''
                sortB = b.customer?.pickup_address?.correct_long_street_name || ''
                break
              case 'collected_date':
                sortA = a.collected_date?.charCodeAt(0) || 0
                sortB = b.collected_date?.charCodeAt(0) || 0
                break
              case 'target_address.correct_long_city_name':
                sortA = a.target_address?.correct_long_city_name || ''
                sortB = b.target_address?.correct_long_city_name || ''
                break
              case 'target_address.correct_long_street_name':
                sortA = a.target_address?.correct_long_street_name || ''
                sortB = b.target_address?.correct_long_street_name || ''
                break
              case 'duration_time':
                sortA = a.duration_time?.charCodeAt(0) || 0
                sortB = b.duration_time?.charCodeAt(0) || 0
                break
              case 'delivered_date':
                sortA = a.delivered_date?.charCodeAt(0) || 0
                sortB = b.delivered_date?.charCodeAt(0) || 0
                break
              case 'pickup_driver':
                sortA = a.pickup_driver?.first_name || ''
                sortB = b.pickup_driver?.first_name || ''
                break
              case 'divisor_driver':
                sortA = a.divisor_driver?.first_name || ''
                sortB = b.divisor_driver?.first_name || ''
                break
              case 'bring_back_driver':
                sortA = a.bring_back_driver?.first_name || ''
                sortB = b.bring_back_driver?.first_name || ''
                break
            }

            if (sortDesc[0]) {
              return sortA < sortB ? 1 : sortA > sortB ? -1 : 0
            } else {
              return sortA < sortB ? -1 : sortA > sortB ? 1 : 0
            }
          }) */
        } catch (e) {
          this.$helper.snackbar(e, 'opt ions watch error')
        }
      },
      deep: true
    },
    value: {
      handler (newFilter) {
        this.$emit('input', newFilter)
      },
      deep: true
    },
    async $route (newRoute, oldRoute) {
      if (!newRoute) {
        return
      }
      if (['coordinator', 'customer-service'].includes(newRoute.name)) {
        this.delivery = {}
        this.tags = []
        this.pagination.skip = 0
        this.pagination.take = 100

        if (!['coordinator-delivery', 'coordinator-logs'].includes(newRoute.name)) {
          this.$store.commit('setDrawerUi', false)
          this.disableCopyDelivery = false
        }

        await this.getDeliveriesViews()
        await this.$store.dispatch('global/getTagsList')
      } else {
        console.log('$route.name :: ', this.$route.name)
      }
    },
    driversSelected () {
      return this.filterHelper()
    },
    branchSelected () {
      return this.filterHelper()
    },
    onUploadByCsv: {
      async handler (newValue) {
        try {
          if (newValue) {
            await this.getDeliveriesViews()
            this.$store.commit('global/setOnUploadByCsv', false)
          }
        } catch (e) {
          this.$helper.snackbar(e, 'onUploadByCsv')
        }
      },
      deep: true
    }
  },
  created () {
    this.$store.dispatch('global/getDeliveryTypes')
    this.$store.dispatch('global/getTagsList')
    this.$store.dispatch('global/getAllLines')
    this.$store.dispatch('global/getCustomerList')
    this.$store.dispatch('global/getDeliveryTypeStatuses', {
      delivery_type_status_keys: [
        'regular',
        'dual',
        'govaina',
        'collection',
        'transference',
        'certificate'
      ],
      exclude_status_keys: [
        'sorting_stored'
      ]
    })
    this.$store.dispatch('global/getFailureList')
    this.fetchColumnsPermission()
    return this.filterHelper()
  },
  methods: {
    async fetchColumnsPermission() {
      this.userColumnPermissions = []
      const payload = {
        level_id: 1,
        type: "deliveries"
      };

      try {
        const response = await this.$manageUserColumns.list(payload);
          await response[0].columnPermissions.map((res) => {
              this.userColumnPermissions.push({
                label: res.label,
                value: res.value,
                display: res.display
              })
          })
      } catch (error) {
        this.$helper.snackbar(error, "fetchColumnsPermission");
      }
    },
    getFirstScanDate (statusHistory) {
      if (!(statusHistory?.length > 1)) {
        return
      }

      const scanStatuses = ['enter_to', 'exit_to', 'stored', 'packed']
      for (const status of statusHistory) {
        if (scanStatuses.includes(status.key)) {
          return status.updated_at
        }
      }
    },
    getLastScanDate (statusHistory) {
      if (!(statusHistory?.length > 1)) {
        return
      }

      let lastScanDate
      const scanStatuses = ['enter_to', 'exit_to', 'stored', 'packed']
      for (const status of statusHistory) {
        if (scanStatuses.includes(status.key)) {
          lastScanDate = status.updated_at
        }
      }

      return lastScanDate
    },
    resetOtherLogs (indexToKeep) {
      const refsArray = Object.keys(this.$refs)
      refsArray.forEach((ref, index) => {
        if (ref.includes('logs_dialog') && index === indexToKeep) {
          return
        }
        this.$refs[ref].showPreviewDialog = false
      })
    },
    async returnToStorage () {
      try {
        console.log('returnToStorage')
        const deliveriesIds = this.deliveriesPrint.map(delivery => delivery.id)
        this.loading = true
        await this.$deliveryService.returnToStorage({ deliveries_ids: deliveriesIds })
        await this.getDeliveriesViews()
        this.loading = false
        this.deliveriesPrint = []
        this.$store.commit('setSnackbar', { value: true, message: 'משלוחים הוחזרו לשולח', success: true })
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'returnToStorage')
      }
    },
    async updateDeliveryStatus (deliveryTypeStatusKey) {
      try {
        console.log('updateDeliveryStatus')
        const deliveriesIds = this.deliveriesPrint.map(delivery => delivery.id)
        const data = {
          deliveries_ids: deliveriesIds,
          delivery_type_status_key: deliveryTypeStatusKey,
          writeToLog: true,
          user_id: this.authUser?.id
        }
        this.loading = true
        await this.$deliveryService.updateDeliveryStatus(data)
        await this.getDeliveriesViews()
        this.loading = false
        this.deliveriesPrint = []
        this.$store.commit('setSnackbar', { value: true, message: 'משלוחים עודכנו בהצלחה', success: true })
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'updateDeliveryStatus')
      }
    },
    async deliveriesRetrieved () {
      try {
        console.log('this.deliveriesRetrieved', this.deliveriesPrint)
        const deliveriesIds = this.deliveriesPrint?.map(delivery => delivery.id)
        this.loading = true
        await this.$deliveryService.updateDeliveryToPreviousStatus({ deliveries_ids: deliveriesIds })
        await this.getDeliveriesViews()
        this.loading = false
        this.deliveriesPrint = []
        this.$store.commit('setSnackbar', { value: true, message: 'ביטול סימוני משלוחים כאבודים', success: true })
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'deliveriesRetrieved')
      }
    },
    async unCancelDelivery () {
      try {
        console.log('unCancelDelivery', this.deliveriesPrint)
        const deliveriesIds = this.deliveriesPrint?.map(delivery => delivery.id)
        this.loading = true
        await this.$deliveryService.updateDeliveryToPreviousStatus({ deliveries_ids: deliveriesIds })
        await this.getDeliveriesViews()
        this.loading = false
        this.deliveriesPrint = []
        this.$store.commit('setSnackbar', { value: true, message: 'ביטול סימון המשלוחים כמבוטלים', success: true })
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'unCancelDelivery')
      }
    },
    itemRowBackground (item) {
      if (item?.delivery_error_id) {
        return item.delivery_error_key === 'late-delivery' ? 'late-delivery' : 'delivery-with-error'
      } else if (item?.deleted_at) {
        return 'deleted-delivery'
      }
      return 'no-applied-class'
    },
    computeObject (prop, propKey) {
      const obj = {}
      if (this[prop] && !this[prop][propKey]) {
        obj.customer = { name: null, address: null }
      } else {
        return this[prop][propKey]
      }
      return obj
    },
    async getDeliveryCount () {
      this.totalItems = await this.$deliveryService.viewDeliveriesCount({
        ...this.pagination,
        filter: this.filter,
        byDriverIds: this.driversSelected,
        branch_id: this.branchSelected
      })
    },
    async getDeliveriesViews () {
      try {
        this.loading = true
        const response = await this.$deliveryService.viewDeliveries({
          ...this.pagination,
          sortBy: this.sortBy,
          filter: this.filter,
          byDriverIds: this.driversSelected,
          branch_id: this.branchSelected
        })
        this.loading = false
        this.items = response.items
        this.getDeliveryCount()
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getDeliveriesViews')
      }
    },
    async getSummaries () {
      try {
        if (this.filter.delivery_type_status_key) {
          return
        }

        this.summariesLoading = true
        this.summaries = await this.$deliveryService.viewSummaries({
          ...this.pagination,
          byDriverIds: this.driversSelected,
          filter: this.filter,
          branch_id: this.branchSelected
        })
        this.summariesLoading = false
      } catch (e) {
        this.$helper.snackbar(e, 'getSummaries')
      }
    },
    async filterHelper () {
      try {
        await Promise.all([this.getDeliveriesViews(), this.getSummaries()])
        if (this.$route.params.id) {
          return this.showInfo({ id: this.$route.params.id })
        }
      } catch (e) {
        this.$helper.snackbar(e, 'filterHelper')
      }
    },
    clearFilterInputs () {
      this.filter = {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        },
        filter_option: 1
      }
      return this.filterHelper()
    },
    multiPrint () {
      this.printDeliveries = true
      console.log('this.authUser.print_type', this.authUser?.print_type)
      if (this.deliveriesPrint.length === 0) {
        return this.$store.commit('setSnackbar', { value: true, message: 'print is empty', error: true })
      }
      if (this.authUser.print_type === 'A4') {
        this.$nuxt.$emit('stickersUi')
      } else if (this.authUser.print_type === 'Sticker') {
        this.$nuxt.$emit('stickerUi')
      }
    },
    selectAction (action) {
      this.selectedAction = action
      switch (action) {
        case 'associatedTo' :
          this.associatedToDriver = true
          break
        case 'cancelDelivery' :
          this.dialogTitle = 'האם אתה בטוח שברצונך לבטל את המשלוחים שסומנו?'
          return this.dialog = true
        case 'cancelDriver' :
          this.dialogTitle = 'האם אתה בטוח שברצונך להוריד את המשלוחים שסומנו מהנהג המוסר?'
          return this.dialog = true
        case 'sendSms':
          this.dialogTitle = 'אנא רשום את ההודעה לנמענים שסומנו'
          return this.dialog = true
        case 'lostDeliveries':
          return this.updateDeliveryStatus('lost')
        case 'returnToStorage':
          return this.returnToStorage()
        case 'deliveriesRetrieved':
          return this.deliveriesRetrieved()
        case 'unCancelDelivery':
          return this.unCancelDelivery()
        case 'markAsDone':
          return this.updateDeliveryStatus('done')
        case 'releaseFromDone':
          return this.updateDeliveryStatus('release_from_done')
      }
    },
    async dialogOnConfirm () {
      try {
        await this.engageSelectedAction()
        return this.resetActionSelect()
      } catch (e) {
        this.$helper.snackbar(e, 'dialogOnConfirm')
      }
    },
    engageSelectedAction () {
      switch (this.selectedAction) {
        case 'associatedTo':
          return this.associatedToNewDriver()
        case 'cancelDelivery' :
          return this.updateDeliveryStatus('cancelled')
        case 'cancelDriver' :
          return this.onCancelDriver()
        case 'sendSms':
          return this.onSendSms()
      }
    },
    resetActionSelect (clearCheckBoxes = true) {
      this.vSelect++
      this.dialog = false
      this.cancelDriver = false
      this.associatedToDriver = false
      this.cancelDelivery = false
      this.showActionsLabel = true
      this.smsContent = ''
      if (clearCheckBoxes) {
        this.selected = []
        this.associatedTo = null
        this.showActions = false
        this.deliveriesPrint = []
      }
    },
    async associatedToNewDriver () {
      try {
        const deliveriesIds = this.deliveriesPrint.map(delivery => delivery.id)
        const data = { driver_uid: this.associatedTo, deliveries: deliveriesIds }

        this.actionLoading = true
        const res = await this.$deliveryService.associateToDriver(data)
        this.actionLoading = false

        if (res?.results?.code === 0) {
          this.$store.commit('setSnackbar', { value: true, message: 'שיוך לנהג התבצע בהצלחה', success: true })
        }

        this.pagination = { skip: 0, take: 100 }
        await this.getDeliveriesViews()
        return this.$nuxt.$emit('reload-driver-management')
      } catch (e) {
        this.$helper.snackbar(e, 'associatedToNewDriver')
      }
    },
    async onCancelDriver () {
      try {
        this.loading = true
        const deliveriesIds = this.deliveriesPrint.map(delivery => delivery.id)
        const data = { deliveries: deliveriesIds }
        this.actionLoading = true
        const res = await this.$deliveryService.cancelDrivers(data)
        if (res?.results?.code === 0) {
          this.$store.commit('setSnackbar',
            { value: true, message: 'driver cancellation was succeed', success: true })
        } else if (res?.results) {
          this.$store.commit('setSnackbar',
            { value: true, message: res.results.description, error: true })
        } else {
          this.$store.commit('setSnackbar',
            { value: true, message: 'could not remove drivers from deliveries', error: true })
        }
        this.loading = false
        this.actionLoading = false
        this.resetActionSelect()
        this.pagination = { skip: 0, take: 100 }
        await this.getDeliveriesViews()
        return this.$nuxt.$emit('reload-driver-management')
      } catch (e) {
        this.$helper.snackbar(e, 'onCancelDriver')
      }
    },
    async onSendSms () {
      try {
        console.log('sendSms', this.smsContent)
        const smsData = []
        for (const delivery of this.deliveriesPrint) {
          if (delivery.target_phone) {
            smsData.push({
              target_phone: delivery.target_phone,
              message: this.smsContent
            })
          }
        }
        this.actionLoading = true
        await this.$messagesByStatusesService.sendMultipleSms(smsData)
        this.actionLoading = false
      } catch (e) {
        this.$helper.snackbar(e, 'onSendSms')
      }
    },
    async showInfo (item) {
      try {
        if (this.$route.name.includes('delivery')) {
          return
        }

        this.delivery = await this.$deliveryService.viewOne({ delivery_id: item.id })
        this.tags = this.delivery.tags

        const currentRoute = this.$route.name?.includes('coordinator') ? 'coordinator' : 'customer-service'
        await this.$router.push({ name: `${currentRoute}-delivery` })
        this.$store.commit('setDrawerUi', true)
      } catch (e) {
        this.$helper.snackbar(e, 'showInfo')
      }
    },
    onsubmit (item) { // every component call different function
      console.log('onsubmit')
      this.loading = true
      const formName = this.formNames[this.tab]
      this.$nuxt.$emit('formSubmit', formName) // submit to function from child comp
      this.loading = false
    },
    async copyDelivery () {
      try {
        this.loading = true
        await this.$deliveryService.copyDelivery(this.delivery.id)
        this.loading = false
        await this.$router.push({ name: 'coordinator' })
        setTimeout(() => {
          this.disableCopyDelivery = true
          return this.showInfo({ id: this.items[0].id, disable_copy: true })
        }, 1000)
        this.$store.commit('setSnackbar', { value: true, message: 'משלוח שוכפל בהצלחה', success: true })
      } catch (e) {
        this.$helper.snackbar(e, 'copyDelivery')
      }
    },
    openPreviewPrintSticker () {
      this.printDeliveries = true
      console.log('this.authUser.print_type', this.authUser?.print_type)
      if (this.authUser?.print_type === 'A4') {
        this.$nuxt.$emit('stickersUi', true)
      } else {
        this.$nuxt.$emit('stickerUi', true)
      }
    },
    getDeliveryStatusValue (delivery) {
      let statusValue = null
      if (delivery?.status?.key === 'enter_to') {
        statusValue = (delivery.status_data.enter_to_branch && (delivery.status.name + delivery.status_data.enter_to_branch)) ||
          delivery.status.name
      } else if (delivery?.status?.key === 'exit_to') {
        statusValue = (delivery.status_data.exit_to_branch && (delivery.status.name + delivery.status_data.exit_to_branch)) ||
          delivery.status.name
      } else {
        statusValue = delivery.status?.name
      }

      return statusValue
    },
    async isPrinted () {
      try {
        this.printDeliveries = false
        const deliveriesChunks = this.deliveriesPrint.reduce((resultArray, item, index) => {
          const chunkIndex = Math.floor(index / 100)

          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = [] // start a new chunk
          }

          resultArray[chunkIndex].push(item.uuid)
          return resultArray
        }, [])

        for (const deliveries of deliveriesChunks) {
          await this.$deliveryService.printed({ deliveries })
        }
      } catch (e) {
        this.$helper.snackbar(e, 'isPrint')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .mdi-arrow-up {
    display: block !important;
  }
  .v-dialog--active {
    //max-width: 645px !important;
    .v-input__control {
      margin-right: 20px;
    }
    span {
      color: #fa4616;
    }
  }
  .v-textarea {
    .v-input__control {
      margin: auto 10%;
    }
  }
}

.v-input__slot{
  background: unset;
}

.mainBody {
  padding-right: 0 !important;
}

.info-panel-coordinator {
  padding-right: 20px;
  background-color: white;
  ::v-deep {
    .widgets {
      .coordinator-widget  {
        &:nth-last-child(2) {
          //border-radius: 0 8px 8px 0;
          margin-left: 0px;
          p {
            color: #39C087 !important;
          }
        }

        &:last-child {
          //border-radius: 8px 0 0 8px;
          margin-right: 0;
          p {
            color: #FA562A;
          }
        }
      }
    }
  }
}
.selectDriver{
  width: 14em;
  height: 2em;
  display: flex;
  margin-right: 1em;

  .autoCompleteDriver {
    margin-top: -4px !important;
  }
  .saveSelectDriver {
    margin-top: 8px !important;
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

    .delivery-with-error {
      background-color: #f5b700 !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .delivery-with-error:hover {
      background-color: darken(#ffd344, 10%) !important;
    }

    .late-delivery {
      background-color: red !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .late-delivery:hover {
      background-color: darken(red, 10%) !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}

.d-print-none {
  margin-bottom: 0;
}

.rotate-arrow{
  display: flex;
  justify-content: center;
  padding-bottom: 3rem;
  .left-side {
    transform: scaleX(-1);
    //margin-left: 1rem;
  }
  .right-side {
    transform: scaleX(1);
  }
}
.direction-icon {
  margin-top: 1vh;
}
.spinner {
  position: absolute;
  margin-top: 80px;
}
.coordinator-body {
  background-color: #F8F8FD;
  .btns-coordinator{
    margin: 0px 0px 0px 0;
  }
  .btn-primary{
    margin: 0px 7px 0px 12px!important;
  }
}
.coordinator{
  background-color: #F8F8FD !important;
  width : 100%;
  .text-center {
    padding: 20px 30px 20px 20px !important;
    background-color: #F8F8FD !important;
    box-shadow: none !important;
  }
  ::v-deep {
    .v-data-table__wrapper {
      overflow: hidden;
    }
    .status-header {
      padding-bottom: 19px !important;
      span {
        padding-bottom: 19px !important;
      }
    }
    .v-data-table > .v-data-table__wrapper > table > tbody > tr > th,
    .v-data-table > .v-data-table__wrapper > table > thead > tr > th,
    .v-data-table > .v-data-table__wrapper > table > tfoot > tr > th,
    .theme--light.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
      font-size: 1.5px !important;
    }
    .theme--light.v-data-table > .v-data-table__wrapper > table > thead > tr > th {
      font-size: 15px !important;
      background-color: #e6e6e6;
    }
    .v-data-table > .v-data-table__wrapper > table > tbody > tr > td, .v-data-table > .v-data-table__wrapper > table > tbody > tr > th,
    .v-data-table > .v-data-table__wrapper > table > thead > tr > td, .v-data-table > .v-data-table__wrapper > table > thead > tr > th,
    .v-data-table > .v-data-table__wrapper > table > tfoot > tr > td, .v-data-table > .v-data-table__wrapper > table > tfoot > tr > th {
      padding: 0 8px !important;
    }
  }
}

.table-th-green{
  background-color: #fff4f1;
}
</style>
