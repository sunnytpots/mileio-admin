<template>
  <SectionLayout title="הודעות SMS" :route-back="{ name: 'settings' }" style="padding: 0">
    <v-overlay :value="toEdit"/>
    <v-row class="messages-screen-actions">
      <v-col style="padding-top: 20px" cols="1">
        <v-checkbox
          v-model="byCustomer"
          label="לפי לקוח"/>
      </v-col>
      <v-col>
        <v-combobox
          v-if="!!byCustomer"
          :key="renderKey"
          :items="customers"
          rounded
          filled
          :item-text="customer => customer.name"
          class="select-customer"
          label="בחר/י לקוח"
          @input="chooseCustomer($event)"/>
        <p
          v-if="!!byCustomer && chosenCustomerName"
          v-text="`לקוח נבחר: ${chosenCustomerName}`"/>
      </v-col>
      <v-col class="left-top-col">
        <DateFilter
          v-if="tabs[currentTab] === 'history'"
          v-model="filter.datesFilter"
          :loading="loading" />
        <v-btn
          v-else
          color="red"
          class="white--text"
          @click="emergencyTurnOffDialog = true"
          v-text="'כיבוי חירום'"/>
      </v-col>
    </v-row>
    <CardUi>
      <v-tabs v-model="currentTab" color="#FA4616" center-active>
        <v-tab>
          סטטוסים
        </v-tab>
        <v-tab>
          כשלים
        </v-tab>
        <v-tab>
          היסטוריה
        </v-tab>
      </v-tabs>
      <v-progress-circular
        v-if="loading && tabs[currentTab] !== 'history'"
        class="spinner"
        size="100"
        color="#FA4616"
        indeterminate/>
      <div v-else>
        <v-container v-if="tabs[currentTab] === 'history'">
          <CardUi class="d-print-none text-center sms-history" overflow>
            <v-layout mt-3 row wrap>
              <v-flex md12 xs12 style="text-align: right">
                <FilterUi
                  v-model="filter"
                  show-search/>
              </v-flex>
              <v-flex md12 xs12 style="text-align: right">
                <ExportReport
                  report-type="smsMessagesSettings"
                  :filter="filter"/>
              </v-flex>
            </v-layout>

            <v-layout row wrap>
              <v-flex md12 xs12>
                <v-data-table
                  :key="renderKey"
                  :headers="headers"
                  :items="historyItems"
                  :server-items-length="totalItems"
                  :options.sync="options"
                  item-key="id"
                  class="elevation-1"
                  :loading="loading"
                  loading-text="טוען מידע, אנא המתן..."
                  :footer-props="footerProps">
                  <template v-slot:no-data>
                    <p v-text="'אין מידע.'"/>
                  </template>

                  <template v-slot:item.reason="{ item }">
                    <StatusesUi
                      v-if="item.delivery_type_status_id"
                      :status-value="item.delivery_type_status.name"
                      :status-key="item.delivery_type_status.key" />
                    <p v-else v-text="item.casuse_failure && item.casuse_failure.value"/>
                  </template>

                  <template v-slot:item.customer_name="{ item }">
                    <p
                      v-if="item.customer_id"
                      v-text="item.delivery && item.delivery.customer_name"/>
                  </template>

                  <template v-slot:item.created_at="{ item }">
                    {{ item.created_at | formatDate2 }}
                  </template>

                  <template v-slot:item.message="{ item }" class="info-td">
                    <p v-if="item.message" style="display: inline-flex">
                      <i
                        class="icon icon-info"
                        style="margin-left: 10px"
                        @click.stop="showInfo(item)"/>
                      {{ item.message.length > 40 ? item.message.substring(0 , 40) + '...' : item.message }}
                    </p>
                  </template>
                </v-data-table>
              </v-flex>
            </v-layout>
          </CardUi>
        </v-container>
        <v-container v-else>
          <v-row class="cards-header add-card">
            <v-col>
              <v-btn class="btn-primary" @click.prevent="openDialog = true" >
                <v-icon left dark>mdi-upload</v-icon>
                הוספה
              </v-btn>
            </v-col>
          </v-row>
          <v-row class="cards-header cards-message">
            <v-col v-if="items && items.length === 0">
              <p style="margin-right: 10px" v-text="'לא קיימות הודעות SMS'" />
            </v-col>
          </v-row>
          <v-row>
            <v-col v-for="(item, index) of items" :key="index" cols="4">
              <v-card
                :key="renderKey"
                :class="{'mx-auto': true, 'card-on-edit': !disabledCards[index]}"
                max-width="400"
                outlined
                shaped
                :loading="loading && currentCard === index">
                <v-card-title class="justify-space-between headline">
                  <v-checkbox
                    v-model="item.sendSms"
                    label="שליחת SMS"
                    :disabled="disabledCards[index]"
                    @change="hasChanges[index] = true"/>
                  <v-checkbox
                    v-model="item.sendMail"
                    label="שליחת מייל"
                    :disabled="disabledCards[index]"
                    @change="hasChanges[index] = true"/>
                </v-card-title>
                <v-card-title class="justify-space-between headline">
                  <StatusesUi
                    v-if="item.delivery_type_status"
                    :status-value="item.delivery_type_status.name"
                    :status-key="item.delivery_type_status.key"/>
                  <p
                    v-else-if="item.failure"
                    style="font-size: 16px; color: red"
                    v-text="item.failure && item.failure.value"/>
                  <v-switch
                    v-model="item.status"
                    :label="item.status ? 'פעיל' : 'לא פעיל' "
                    class="pa-3"
                    :disabled="disabledCards[index]"
                    @change="switchItemStatus(item, index)"/>
                </v-card-title>
                <v-card-subtitle>
                  סוג משלוח: {{ item.delivery_type && item.delivery_type.value }}
                </v-card-subtitle>
                <v-card-subtitle>
                  <v-select
                    clearable
                    :items="params"
                    :disabled="disabledCards[index]"
                    item-value="key"
                    item-text="value"
                    label="בחר מילת מפתח להוסיף להודעה"
                    @input="(key) => vSelectParam(key)"/>
                </v-card-subtitle>
                <v-spacer />
                <v-textarea
                  v-model="item.message"
                  filled
                  autofocus
                  label="תוכן"
                  :disabled="disabledCards[index]"
                  @change="hasChanges[index] = true"/>
                <v-card-actions>
                  <v-row style="justify-content: space-between">
                    <v-col cols="8">
                      <v-btn
                        v-if="!toEdit"
                        color="green darken-1"
                        text
                        @click="checkSmsDialog(item)">
                        בדיקת SMS
                      </v-btn>
                      <v-btn
                        v-else-if="!disabledCards[index]"
                        color="green darken-1"
                        text
                        @click="cancelChanges(index)">
                        ביטול
                      </v-btn>
                    </v-col>
                    <v-col cols="4">
                      <DeleteButton
                        v-if="!toEdit"
                        class="delete-button"
                        has-warning
                        @deleted="deleteMessage(item)"/>
                      <v-btn
                        v-if="!toEdit"
                        color="green darken-1"
                        text
                        @click="allowEdit(item, index)">
                        עריכה
                      </v-btn>
                      <v-btn
                        v-else-if="!disabledCards[index]"
                        color="green darken-1"
                        text
                        @click="updateCard(item, index)">
                        שמירה
                      </v-btn>
                    </v-col>
                  </v-row>
                </v-card-actions>
              </v-card>
            </v-col>
          </v-row>
        </v-container>
      </div>
      <v-dialog
        v-model="openDialog"
        persistent
        max-width="400">
        <v-card>
          <v-card-title class="headline">
            הוספת כרטיס חדש
          </v-card-title>
          <v-spacer />
          <v-container class="d-flex justify-space-between">
            <v-row>
              <v-col cols="6">
                <v-select
                  v-model="form.delivery_type_id"
                  clearable
                  :items="delivery_types"
                  item-text="value"
                  item-value="id"
                  label="סוג משלוח"
                  :error-messages="$v.$dirty && $v.form.delivery_type_id.$invalid && 'שדה חובה' || ''"
                  @change="onDeliveryType"/>
              </v-col>
              <v-col v-if="form.delivery_type_id" cols="6">
                <v-select
                  v-if="tabs[currentTab] === 'statuses'"
                  v-model="form.delivery_type_status_id"
                  clearable
                  :items="delivery_type_statuses"
                  item-text="name"
                  item-value="id"
                  label="סטאטוס"
                  :error-messages="$v.$dirty && $v.form.delivery_type_status_id.$invalid && 'שדה חובה' || ''"/>
                <v-select
                  v-else-if="tabs[currentTab] === 'failures'"
                  v-model="form.failure_id"
                  clearable
                  :items="failureList"
                  item-text="name"
                  item-value="key"
                  label="סיבת כשל"
                  :error-messages="$v.$dirty && $v.form.failure_id.$invalid && 'שדה חובה' || ''"/>
              </v-col>
            </v-row>
          </v-container>
          <v-card-actions>
            <v-spacer />
            <v-btn
              color="green darken-1"
              text
              @click="resetForm">
              בטל
            </v-btn>
            <v-btn
              color="green darken-1"
              text
              @click="addNewCard">
              שמירה
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
      <v-dialog
        v-model="openSmsDialog"
        persistent
        max-width="531">
        <v-form ref="checkSmsForm" lazy-validation>
          <v-card>
            <v-card-title>אנא הכנס מספר פלאפון שאליו תשלח הודעה למען בדיקה</v-card-title>
            <v-card-text>
              <v-text-field v-model="smsCheckNumber" label="אנא הכנס מספר" :rules="FieldsRules"/>
            </v-card-text>
            <v-card-actions>
              <v-btn
                color="green darken-1"
                text
                @click="openSmsDialog = false; smsCheckNumber = null">
                ביטול
              </v-btn>
              <v-spacer/>
              <v-btn
                color="green darken-1"
                text
                @click="checkSms">
                שלח
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-dialog>
      <v-dialog
        v-model="openHistoryDialog"
        max-width="400"
        transition="dialog-bottom-transition">
        <v-card>
          <v-card-title class="headline">
            תוכן ההודעה
          </v-card-title>
          <v-spacer />
          <v-container class="d-flex justify-space-between">
            <v-row>
              <v-col>
                {{ historyMessageContent }}
              </v-col>
            </v-row>
          </v-container>
        </v-card>
      </v-dialog>
      <v-dialog
        v-model="emergencyTurnOffDialog"
        max-width="750"
        transition="dialog-bottom-transition"
        persistent>
        <v-card>
          <v-card-title>
            <p v-text="'פעולה זו תהפוך את כל ההודעות (כולל עבור לקוחות ספיציפיים) ללא פעילות.'"/>
            <p v-text="'האם את/ה בטוח/ה שברצונך לבצע פעולה זו?'"/>
          </v-card-title>
          <v-card-actions>
            <v-btn class="btn-primary" @click="emergencyTurnOffDialog = false" v-text="'ביטול'"/>
            <v-spacer/>
            <v-btn class="btn-primary" @click="emergencyTurnOff" v-text="'אישור'"/>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </CardUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'
import { required, requiredIf } from 'vuelidate/lib/validators'
import moment from 'moment'

export default {
  name: 'SettingsSmsMessages',
  middleware: ['permissions'],

  data () {
    return {
      chosenCustomerName: null,
      emergencyTurnOffDialog: false,
      filter: {
        datesFilter: {
          fromDate: moment().subtract(1, 'week').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        },
        search: null
      },
      historyMessageContent: null,
      openHistoryDialog: false,
      totalItems: 100,
      options: {},
      historyItems: [],
      tabs: ['statuses', 'failures', 'history'],
      currentTab: null,
      byCustomer: null,
      toSendEmail: false,
      toSendSms: false,
      hasChanges: [],
      renderKey: false,
      disabledCards: [],
      toEdit: false,
      chosenCard: null,
      smsCheckNumber: null,
      loading: false,
      openDialog: false,
      openSmsDialog: false,
      delivery_type_statuses: [],
      form: {
        delivery_type_id: null,
        delivery_type_status_id: null,
        customer_id: null,
        failure_id: null,
        messageBy: 'statuses',
        pagination: {
          skip: 0,
          take: 100
        }
      },
      formCard: {
        id: null,
        status: false,
        message: null,
        params: [],
        sendSms: false,
        sendMail: false
      },
      items: [],
      showParams: false,
      currentCard: null,
      paramSelected: null,
      params: [
        { key: 'customer_name', value: 'שם לקוח' },
        { key: 'order_number', value: 'מספר הזמנה' },
        { key: 'barcode', value: 'ברקוד' },
        { key: 'tapuz_number', value: 'מספר תפוז' },
        { key: 'tracking_url', value: 'לינק מעקב' },
        { key: 'target_name', value: 'שם נמען' },
        { key: 'target_address', value: 'כתובת נמען' },
        { key: 'receives_name', value: 'שם מקבל' },
        { key: 'delivered_date', value: 'תאריך מסירה' },
        { key: 'dist_point_address', value: 'כתובת נקודת חלוקה' },
        { key: 'active_time', value: 'זמני פעילות' },
        { key: 'govaina_amount', value: 'סכום גוביינא' }
      ],
      FieldsRules: [
        v => !!v || 'שדה חובה'
      ]
    }
  },
  computed: {
    ...mapState('global', ['delivery_types', 'failureList', 'customers', 'footerProps']),

    headers () {
      const arr = [
        { text: 'מספר הזמנה', align: 'center', value: 'delivery.order_number' },
        { text: 'על פי לקוח', align: 'center', value: 'customer.name' },
        { text: 'סוג משלוח', align: 'center', value: 'delivery.delivery_type.value' },
        { text: 'סטטוס / סיבת כשל', align: 'center', value: 'reason' },
        { text: 'שם נמען', align: 'center', value: 'delivery.target_name' },
        { text: 'תאריך שליחה', align: 'center', value: 'created_at' },
        { text: 'מספר יעד', align: 'center', value: 'delivery.target_phone' },
        { text: 'תוכן ההודעה', align: 'center', value: 'message' }
      ]
      return arr
    }
  },
  watch: {
    filter: {
      handler (newFilter) {
        try {
          if (this.tabs[this.currentTab] === 'history' &&
            newFilter.search?.length > 0 && newFilter.search?.length < 3) {
            return
          }
          return this.getItems()
        } catch (e) {
          this.$helper.snackbar(e, 'options watch')
        }
      },
      deep: true
    },
    options: {
      async handler (newOptions, oldOptions) {
        try {
          console.log('newOptions', newOptions)
          console.log('Object.keys(oldOptions)', Object.keys(oldOptions))
          const { sortBy, sortDesc } = newOptions
          if (Object.keys(oldOptions)?.length < 1 || this.form.messageBy !== 'history') {
            return
          }

          this.form.pagination = {
            skip: (newOptions.page - 1) * newOptions.itemsPerPage,
            take: newOptions.itemsPerPage
          }

          await this.getItems()
          this.historyItems = this.historyItems.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'delivery.order_number':
                sortA = a.delivery.order_number || 0
                sortB = b.delivery.order_number || 0
                break
              case 'delivery.delivery_type_value':
                sortA = a.delivery.delivery_type_value?.charCodeAt(0) || 0
                sortB = b.delivery.delivery_type_value?.charCodeAt(0) || 0
                break
              case 'reason':
                sortA = a.delivery.delivery_type_status_id ? (a.delivery_type_status?.key?.charCodeAt(0) || 0) : (a.casuse_failure?.value?.charCodeAt(0) || 0)
                sortB = b.delivery.delivery_type_status_id ? (b.delivery_type_status?.key?.charCodeAt(0) || 0) : (b.casuse_failure?.value?.charCodeAt(0) || 0)
                break
              case 'delivery.target_name':
                sortA = a.delivery.target_name?.charCodeAt(0) || 0
                sortB = b.delivery.target_name?.charCodeAt(0) || 0
                break
              case 'created_at':
                sortA = a.created_at
                sortB = b.created_at
                break
              default:
                sortA = a[sortBy[0]]
                sortB = b[sortBy[0]]
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
    currentTab (newVal) {
      console.log('this.tabs[newVal]', this.tabs[newVal])
      this.form.messageBy = this.tabs[newVal]

      if (this.form.messageBy !== 'history') {
        this.options = {}
      }

      return this.getItems()
    },
    byCustomer (newVal) {
      if (!newVal && this.form.customer_id) {
        this.form.customer_id = null
        this.chosenCustomerName = null
        return this.getItems()
      }
    },
    'form.customer_id' (newVal) {
      if (newVal) {
        return this.getItems()
      }
    },
    paramSelected (newValue) {
      if (newValue) {
        this.items[this.currentCard].message = this.items[this.currentCard].message + ` ${newValue.key}`
      }
    }
  },
  async created () {
    try {
      this.loading = true
      await this.$store.dispatch('global/getDeliveryTypes')
      await this.$store.dispatch('global/getFailureList')
      await this.$store.dispatch('global/getCustomerList')
      this.loading = false
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    chooseCustomer (customer) {
      this.renderKey = !this.renderKey
      this.form.customer_id = customer?.id
      this.chosenCustomerName = customer?.name
    },
    async emergencyTurnOff () {
      try {
        this.loading = true
        await this.$messagesByStatusesService.emergencyTurnOff()
        this.loading = false
        this.emergencyTurnOffDialog = false
        await this.getItems()
      } catch (e) {
        this.emergencyTurnOffDialog = false
        this.$helper.snackbar(e, 'emergencyTurnOff')
      }
    },
    showInfo (item) {
      console.log('showInfo', item)
      this.historyMessageContent = item.message
      this.openHistoryDialog = true
    },
    async getItems () {
      try {
        console.log('getItems')
        this.loading = true
        if (this.tabs[this.currentTab] === 'history') {
          const response = await this.$messagesByStatusesService.viewMessagesHistory({
            ...this.form,
            filter: this.filter
          })
          this.historyItems = response?.items
          this.totalItems = response?.total
        } else if (this.form.customer_id) {
          this.items = await this.$messagesByStatusesService.viewCustomerCustomMessages(this.form)
        } else {
          this.items = await this.$messagesByStatusesService.messagesByStatusesView(this.form)
        }
        this.items.forEach(item => {
          this.disabledCards.push(true)
          this.hasChanges.push(false)
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getItems')
      }
    },
    cancelChanges (index) {
      this.disabledCards[index] = true
      this.toEdit = false
      this.currentCard = null
    },
    allowEdit (item, index) {
      this.toEdit = true
      this.disabledCards[index] = false
      this.currentCard = index
      this.renderKey = !this.renderKey
    },
    async deleteMessage (item) {
      try {
        console.log('deleteMessage', item)
        if (this.form.customer_id) {
          await this.$messagesByStatusesService.deleteCustomerCustomMessage({
            customer_id: this.form.customer_id,
            delivery_type_status_id: item.delivery_type_status_id,
            failure_id: item.failure_id
          })
        } else {
          await this.$messagesByStatusesService.deleteStatusMsg({ msg_id: item.id })
        }
        this.$store.commit('setSnackbar', { value: true, message: 'נמחק בהצלחה', success: true })
        return this.getItems()
      } catch (e) {
        this.$helper.snackbar(e, 'deleteMessage')
      }
    },
    async onDeliveryType (deliveryTypeId) {
      try {
        this.delivery_type_statuses = await this.$deliveryTypeStatusesService.getDeliveryStatus({ delivery_type_id: deliveryTypeId })
      } catch (e) {
        this.$helper.snackbar(e, 'onDeliveryType')
      }
    },
    resetForm () {
      this.openDialog = false
      this.form.delivery_type_id = null
      this.form.delivery_type_status_id = null
      this.form.failure_id = null
    },
    async addNewCard () {
      try {
        console.log('addNewCard')
        this.$v.$touch()
        if (this.$v.$error) {
          console.log('error', this.$v)
          return
        }
        if (this.form.customer_id) {
          await this.$messagesByStatusesService.addCustomerCustomMessage(this.form)
        } else {
          await this.$messagesByStatusesService.addMessage(this.form)
        }
        this.resetForm()
        return this.getItems()
      } catch (e) {
        this.$helper.snackbar(e, 'addNewCard')
      }
    },
    checkSmsDialog (item) {
      this.openSmsDialog = true
      this.chosenCard = item
    },
    async checkSms () {
      try {
        if (!this.$refs.checkSmsForm.validate()) {
          return
        }
        await this.$messagesByStatusesService.checkSms({
          message: this.chosenCard.message,
          phoneNumber: this.smsCheckNumber
        })
        this.openSmsDialog = false
        this.smsCheckNumber = null
        this.$store.commit('setSnackbar', { value: true, message: 'הודעה נשלחה', success: true })
      } catch (e) {
        this.$helper.snackbar(e, 'checkSms')
      }
    },
    async updateCard (item, index) {
      try {
        console.log('updateCard', item)
        if (!this.hasChanges[index]) {
          this.$store.commit('setSnackbar', { value: true, message: 'לא בוצעו שינויים', error: true })
          return
        }
        this.loading = true
        this.formCard.id = item.id
        this.formCard.message = item.message
        this.formCard.status = item.status
        this.formCard.sendSms = item.sendSms
        this.formCard.sendMail = item.sendMail
        this.formCard.delivery_type_status_id = item.delivery_type_status_id
        this.formCard.failure_id = item.failure_id
        this.params.forEach(param => {
          if (item.message.includes(param.key) && !this.formCard.params.includes(param.key)) {
            this.formCard.params.push(param.key)
          }
        })
        if (this.form.customer_id) {
          this.formCard.customer_id = this.form.customer_id
          await this.$messagesByStatusesService.updateCustomerCustomMessage(this.formCard)
        } else {
          await this.$messagesByStatusesService.updateMessage(this.formCard)
        }
        setTimeout(() => {
          this.loading = false
          this.currentCard = null
          this.disabledCards[index] = true
          this.toEdit = false
          this.hasChanges[index] = false
          this.formCard = {
            id: null,
            status: false,
            message: null,
            params: [],
            sendSms: false,
            sendMail: false
          }
          this.$store.commit('setSnackbar', { value: true, message: 'שינויים נשמרו בהצלחה', success: true })
        }, 1000)
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'updateCard')
      }
    },
    switchItemStatus (item, index) {
      this.hasChanges[index] = true
      for (const i of this.items) {
        if (i.id === item.id) {
          i.status = item.status
          this.formCard.status = item.status
        }
      }
      // this.currentCard = index
    },
    selectParam (param) {
      console.log('param', param)
      this.showParams = false
      this.paramSelected = param
      if (!this.formCard.params.includes(param.key)) {
        this.formCard.params.push(param.key)
      }
    },
    vSelectParam (key) {
      this.paramSelected = this.params.find(param => param.key === key)
      // if (!this.formCard.params.includes(param.key)) {
      //   this.formCard.params.push(param.key)
      // }
    },
    onTextArea (item, index) {
      this.currentCard = index
      // const msg = item.message
      // for (const param of this.formCard.params) {
      //   if (!msg.includes(param)) {
      //     this.formCard.params.splice(this.formCard.params.indexOf(param), 1)
      //   }
      // }
      this.paramSelected = null
    }
  },
  validations: {
    form: {
      delivery_type_id: { required },
      delivery_type_status_id: {
        required: requiredIf(function () {
          return this.tabs[this.tab] === 'statuses'
        })
      },
      failure_id: {
        required: requiredIf(function () {
          return this.tabs[this.tab] === 'failures'
        })
      }
    }
  },
  head: { title: 'הודעות SMS' }
}
</script>

<style lang="scss" scoped>
.sms-history {
  box-shadow: none !important;
}
::v-deep {
  .filter-ui {
    .v-input {
      margin-right: 12px !important;
    }
  }
}

.icon-info {
  cursor: pointer;
}
.icon-info:hover {
  color: red;
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
.filter-ui .v-text-field--enclosed .v-input__append-inner {
  margin-top: 7px !important;
  margin-left: -15px !important;
}
.cards-header.add-card{
  text-align: left;
}
.cards-header.cards-message{
  text-align: right;
}
.card-on-edit {
  z-index: 5;
}
.delete-button {
  display: inline;
}
.spinner {
  margin: 15% 45% !important;
}
.messages-screen-actions {
  padding-bottom: 50px;
  height: 100px;
  .select-customer {
    display: inline-block;
    border-radius: 4px;
    padding: 0;
    border: 1px solid #E7E7E7;
    box-sizing: border-box;
    height: 42px !important;
    width: 250px;
    ::v-deep{
      .v-input__control, .v-input__slot, .v-select__slot{
        max-height: 40px !important;
        min-height: unset !important;
      }
      .v-label{
        font-size: 14px !important;
        top: 8px !important;
      }
      .v-input__append-inner {
        margin-top: 10px !important;
      }
    }
  }
  .left-top-col {
    display: flex;
    align-content: flex-end;
    justify-content: flex-end;
    button {
      margin-left: 10px;
    }
    .date-filter {
      width: 530px;
      margin: auto auto 30px 30px;
      align-self: flex-start;
    }
  }
}
.v-input--checkbox {
  margin: 0;
  display: inline-block !important;
  ::v-deep {
    display: inline-block !important;
    .v-input__slot {
      margin: 0 !important;
    }
    .v-messages.theme--light {
      display: none !important;
    }
  }
}
</style>
