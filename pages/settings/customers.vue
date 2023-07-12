<template>
  <SectionLayout title="ניהול לקוחות" :route-back="{ name: 'settings' }">
    <template #header>
      <DateFilter
        :key="renderKey"
        v-model="filter.datesFilter" />
    </template>

    <FilterUi
      v-model="filter"
      show-customer
      :customer-list="customers"
      show-customer-status
      customer-is-clearable
      :customer-statuses="customerStatuses"
      show-search
      show-reset
      :clear-filter-inputs="clearFilterInputs"/>

    <ExportReport
      report-type="customers"
      :filter="filter"/>

    <CardUi>
      <v-data-table
        :headers="headers"
        :items="items"
        :items-per-page="100"
        :footer-props="footerProps"
        :server-items-length="totalItems"
        :options.sync="options"
        :loading="loading"
        loading-text="טוען רשימת לקוחות, אנא המתן..."
        class="elevation-1"
        @click:row="showInfo">
        <template v-slot:no-data>
          <p v-text="'אין מידע.'"/>
        </template>

        <template v-slot:item.has_price="{ item }">
          {{ item.deliveries_types && item.deliveries_types.length > 0 ? 'קיים' : 'לא קיים' }}
        </template>

        <template v-slot:item.status="{ item }">
          <StatusesUi
            :status-value="item.status ? 'פעיל' : 'לא פעיל'"
            :status-key="item.status"/>
        </template>

        <template v-slot:item.pickup_address_city="{ item }">
          <p
            v-if="item.pickup_address && item.pickup_address.correct_long_city_name"
            v-text="item.pickup_address.correct_long_city_name"/>
          <p
            v-else
            v-text="item.pickup_city_from_user"/>
        </template>

        <template v-slot:item.pickup_address_street="{ item }">
          <p
            v-if="item.pickup_address && item.pickup_address.correct_long_street_name && item.pickup_address.correct_street_number"
            v-text="`${item.pickup_address.correct_long_street_name} ${item.pickup_address.correct_street_number}`"/>
          <p
            v-else
            v-text="`${item.pickup_street_name_from_user} ${item.pickup_street_number_from_user}`"/>
        </template>

        <template v-slot:item.branches="{ item }">
          {{ item.branches && item.branches.map(b => b.branch && b.branch.name).join(',') }}
        </template>

        <template v-slot:item.lines="{ item }">
          {{ item.lines && item.lines.map(l => l.line && l.line.name).join(',') }}
        </template>
      </v-data-table>
    </CardUi>

    <DrawerUi v-model="tab" :tabs="tabs">
      <template v-if="$hasPermission('settings-customers-general', 'edit')" #header>
        <v-btn
          v-if="$route && !$route.name.includes('invoices-payments')"
          class="btn-primary"
          @click.prevent="onSubmit">
          שמירה
        </v-btn>
      </template>

      <template v-if="$route && $route.name === 'settings-customers-general'" #aside>
        <div v-if="customer && customer.uuid">
          <v-select
            :items="customerStatuses"
            clearable
            item-text="value"
            item-value="key"
            label="סטטוס"
            @change="changeCustomerStatus($event)"
          />
          <v-avatar
            v-if="customer"
            color="grey lighten-2"
            class="customer-avatar"
            :height="!imageBase64 ? '185' : 'auto'"
            @click="onUploadLogo">
            <p
              v-if="!imageBase64"
              class="upload-logo"
              v-text="'העלאת לוגו'"/>
            <i
              v-if="imageBase64"
              class="icon icon-delete delete-img"
              @click.stop=""
              @click="onDeleteLogo('customer_logo')" />
            <img
              v-if="imageBase64"
              :src="imageBase64"
              class="preview">
            <input
              ref="uploader"
              class="d-none"
              type="file"
              accept="image/*"
              @change="onFileChanged($event, 'customer_logo')">
          </v-avatar>
          <v-avatar
            color="grey lighten-2"
            class="customer-avatar"
            :height="!bannerBase64 ? '185' : 'auto'"
            style="margin-top: 5rem"
            @click="onUploadBanner">
            <p
              v-if="!bannerBase64"
              class="upload-logo"
              v-text="'העלאת באנר'" />
            <i
              v-if="bannerBase64"
              class="icon icon-delete delete-img"
              @click.stop=""
              @click="onDeleteLogo('customer_banner')"/>
            <img
              v-if="bannerBase64"
              :src="bannerBase64"
              class="preview">
            <input
              ref="bannerUploader"
              class="d-none"
              type="file"
              accept="image/*"
              @change="onFileChanged($event, 'customer_banner')">
          </v-avatar>
          <p style="text-align: center">
            <small> מימדים אופטימאליים: 642px * 400px </small>
          </p>

          <v-btn
            color="#fa4616"
            class="white--text customer-login-sms-btn"
            @click="sendLoginSmsDialog = true"
            v-text="'שלח SMS עם לינק התחברות ראשוני ללקוח'"/>

          <v-text-field v-model="bannerLink" label="הגדר לינק לבאנר" />

          <div class="delete-customer">
            <p>מחיקת לקוח</p>
            <DeleteButton
              url="customers/delete-customer"
              has-warning
              api-method="$post"
              :warning-message="'פעולת מחיקה לקוח אינה הפיכה! האם אתה בטוח שברצונך למחוק לקוח זה?'"
              :req-body="customer && { customer_uid: customer.uuid }"
              @deleted="afterCustomerDelete"/>
          </div>
        </div>
      </template>
      <v-dialog
        v-model="sendLoginSmsDialog"
        max-width="510"
        light>
        <v-card class="send-login-sms-dialog">
          <p v-text="'בחר משתמש'"/>
          <v-select
            v-model="selectedUser"
            clearable
            filled
            :items="customer && customer.users"
            item-value="uuid"
            :item-text="user => user.first_name +' - '+ user.last_name"
            label="משתמש">
          </v-select>
          <v-btn
            :disabled="!selectedUser"
            @click="sendLoginSms"
            v-text="'שלח לינק התחברות'"/>
        </v-card>
      </v-dialog>
      <n-child
        :customer="customer"
        :submit-status.sync="submitStatus"
        :customer-logo="fileLogo"
        :customer-banner="fileBanner"
        :banner-url="bannerLink" />
    </DrawerUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'
import moment from 'moment'

export default {
  name: 'SettingsCustomers',
  middleware: ['permissions'],

  data () {
    return {
      renderKey: false,
      selectedUser: null,
      sendLoginSmsDialog: false,
      loading: false,
      customer: null,
      customerStatus: true,
      customerStatuses: [
        { value: 'פעיל', key: 'active' },
        { value: 'לא פעיל', key: 'not_active' }
      ],
      headers: [
        { text: 'מזהה בסיס נתונים', value: 'id', align: 'center' },
        { text: 'שם לקוח', value: 'name', align: 'center' },
        { text: 'סטטוס', value: 'status', align: 'center' },
        { text: 'מספר לקוח', value: 'customer_number', align: 'center' },
        { text: 'ח.פ', value: 'hp', align: 'center' },
        { text: 'כתובת משרדים', value: 'address', align: 'center' },
        { text: 'טלפון משרדים', value: 'phone', align: 'center' },
        // { text: 'ממוצע חבילות חודשי', value: 'packAvg', align: 'center' },
        { text: 'כתובת', value: 'pickup_address_street', align: 'center' },
        { text: 'עיר', value: 'pickup_address_city', align: 'center' },
        { text: 'איזור', value: 'branches', align: 'center' },
        { text: 'קו', value: 'lines', align: 'center' },
        { text: 'קיים מחירון?', value: 'has_price', align: 'center' }
      ],
      selected: [],
      selectAll: false,
      item: null,
      items: [],
      filter: {
        datesFilter: {
          fromDate: moment().subtract(1, 'year').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        }
      },
      tab: null,
      submitStatus: null,
      formNames: {
        '/settings/customers/general': 'customerData',
        '/settings/customers/pricing': 'customerPricing',
        '/settings/customers/api-settings': 'apiSettings',
        '/settings/customers/users': 'usersManagement'
      },
      pagination: {
        skip: 0,
        take: 100
      },
      totalItems: 0,
      options: {},
      bottom: false,
      selectedFile: null,
      imageBase64: null,
      fileLogo: null,
      bannerBase64: null,
      fileBanner: null,
      bannerLink: null,
      isSelecting: false,
      isBannerSelecting: false,
      urlRegex: /^\/([^?\/]+)/,
      UrlRule: [
        // eslint-disable-next-line no-mixed-operators
        v => v && /https?:[0-9]*\/\/[\w!?/\+\-_~=;\.,*&@#$%\(\)\'\[\]]+/.test(v) || 'שדה לא חוקי'
      ]
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    ...mapState('global', ['customers', 'footerProps']),

    tabs () {
      let tabs = [
        { title: 'מידע כללי', to: { name: 'settings-customers-general' } }

      ]
      if (this.customer?.uuid) {
        tabs.push(
          { title: 'מחירון', to: { name: 'settings-customers-pricing' } },
          { title: 'ניהול משתמשים', to: { name: 'settings-customers-users' } },
          { title: 'חשבוניות ותשלומים', to: { name: 'settings-customers-invoices-payments-payment-method' }, mode: 'create_edit' },
          { title: 'הגדרות API', to: { name: 'settings-customers-api-settings' }, mode: 'create_edit' }
        )
      }
      tabs = tabs.filter(tab => this.$hasPermission(tab.to?.name))
      return tabs
    }
  },
  watch: {
    sendLoginSmsDialog (newVal) {
      if (!newVal) {
        this.selectedUser = null
      }
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
          await this.getCustomersViews()
          this.items = this.items?.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'name':
                sortA = a.name?.charCodeAt(0) || 0
                sortB = b.name?.charCodeAt(0) || 0
                break
              case 'address':
                sortA = a.address?.charCodeAt(0) || 0
                sortB = b.address?.charCodeAt(0) || 0
                break
              case 'pickup_address':
                sortA = a.pickup_address?.correct_long_street_name?.charCodeAt(0) || 0
                sortB = b.pickup_address?.correct_long_street_name?.charCodeAt(0) || 0
                break
              case 'pickup_address.correct_long_city_name':
                sortA = a.pickup_address?.correct_long_city_name?.charCodeAt(0) || 0
                sortB = b.pickup_address?.correct_long_city_name?.charCodeAt(0) || 0
                break
              case 'branches':
                sortA = a.branches[0]?.branch.name?.charCodeAt(0) || 0
                sortB = b.branches[0]?.branch.name?.charCodeAt(0) || 0
                break
              case 'id':
                sortA = a.id || 0
                sortB = b.id || 0
                break
              case 'phone':
                sortA = a.phone || 0
                sortB = b.phone || 0
                break
              case 'customer_number':
                sortA = a.customer_number || 0
                sortB = b.customer_number || 0
                break
              case 'lines':
                sortA = a.lines || 0
                sortB = b.lines || 0
                break
              case 'hp':
                sortA = a.hp || 0
                sortB = b.hp || 0
                break
              case 'status':
                sortA = a.status
                sortB = b.status
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
    async submitStatus (newSubmitStatus) { // waiting for child response and then run a new request and close the drawer
      try {
        if (newSubmitStatus.status) {
          await this.$router.push({ name: 'settings-customers' })
          this.$store.commit('setDrawerUi', false)
          this.customer = null
        }
      } catch (e) {
        this.$helper.snackbar(e, 'submitStatus')
      }
    },
    selectAll (newSelectAll) {
      this.selected = newSelectAll ? this.items.map((item, index) => index) : []
    },
    filter: {
      handler (newFilter) {
        console.log('filter watch', newFilter)
        if (newFilter?.search?.length > 0 && newFilter?.search?.length <= 2) {
          return
        }
        return this.getCustomersViews()
      },
      deep: true
    },
    $route (newRoute) {
      if (newRoute.name === 'settings-customers') {
        this.customer = null
        this.imageBase64 = null
        this.fileLogo = null
        this.bannerLink = null
        this.bannerBase64 = null
        this.fileBanner = null
        this.pagination.skip = 0
        this.pagination.take = 100
        return this.getCustomersViews()
      }
    }
  },
  created () {
    this.$store.dispatch('global/getCustomerList')
    return this.getCustomersViews()
  },
  methods: {
    clearFilterInputs () {
      this.filter = {
        datesFilter: {
          fromDate: moment().subtract(1, 'year').startOf('day').format('YYYY-MM-DD'),
          untilDate: moment().endOf('day').format('YYYY-MM-DD')
        }
      }
      this.renderKey = !this.renderKey
    },
    async sendLoginSms () {
      try {
        await this.$customersService.sendLoginSms({ user_uid: this.selectedUser })
        this.sendLoginSmsDialog = false
      } catch (e) {
        this.sendLoginSmsDialog = false
        this.$helper.snackbar(e, 'sendLoginSms')
      }
    },
    async getCustomersViews () {
      try {
        this.loading = true
        const response = await this.$customersService.viewCustomers({
          ...this.pagination,
          filter: this.filter,
          from_customer_settings_screen: true
        })
        this.items = response?.items
        this.totalItems = response?.total
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getDeliveryViews')
      }
    },
    async changeCustomerStatus (status) {
      try {
        this.customerStatus = status === 'active'
        await this.$customersService.updateStatus(this.customer?.uuid, {
          status: this.customerStatus
        })
      } catch (e) {
        this.$helper.snackbar(e, 'changeCustomerStatus')
      }
    },
    afterCustomerDelete (args) {
      if (args?.status) {
        this.$store.commit('setSnackbar', { value: true, message: 'מחיקת לקוח בוצעה בהצלחה!', success: true })
        this.$store.commit('setDrawerUi', false)
        this.$router.push({ name: this.$route.matched[0]?.name })
      } else if (args?.errors) {
        const errorMsg = args.errors.response?.data?.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    },
    onSubmit () {
      const formName = this.formNames[this.tab]
      console.log('formName', formName)
      this.$nuxt.$emit('pricingSubmit')
      this.$nuxt.$emit('formSubmit', formName)
    },
    async showInfo (item) {
      try {
        this.customer = await this.$customersService.viewOne(item.id)
        this.customerStatus = this.customer?.status

        if (this.customer.customer_logo) {
          this.imageBase64 = this.customer.customer_logo
        }
        if (this.customer.customer_banner) {
          this.bannerBase64 = this.customer.customer_banner
        }

        if (this.customer.customer_banner_url) {
          this.bannerLink = this.customer.customer_banner_url
        }
        return this.$router.push({ name: 'settings-customers-general' })
      } catch (e) {
        this.$helper.snackbar(e, 'showInfo')
      }
    },
    onFileChanged (e, uploadType) {
      console.log(e.target.files[0], 'uploadType')
      const selectedFile = e.target.files[0]
      if (uploadType === 'customer_logo') {
        this.fileLogo = selectedFile
      } else {
        this.fileBanner = selectedFile
      }
      this.createBase64Image(selectedFile, uploadType)
    },
    createBase64Image (fileObject, uploadType) {
      const reader = new FileReader()
      reader.onload = uploadType === 'customer_logo' ? this.onLoadFile : this.onLoadBannerFile
      reader.readAsDataURL(fileObject)
    },
    onLoadFile (e) {
      console.log('e.target', e.target)
      this.imageBase64 = e.target.result
    },
    onLoadBannerFile (e) {
      this.bannerBase64 = e.target.result
    },
    async onDeleteLogo (imgType) {
      try {
        switch (imgType) {
          case 'customer_logo' :
            await this.$customersService.deleteLogo({ id: this.customer.id })
            this.imageBase64 = null
            break

          case 'customer_banner' :
            await this.$customersService.deleteBanner({ id: this.customer.id })
            this.bannerBase64 = null
            break
        }
      } catch (e) {
        this.$helper.snackbar(e, 'onDeleteLogo')
      }
    },
    onUploadLogo () {
      this.isSelecting = true
      window.addEventListener('focus', () => {
        this.isSelecting = false
      }, { once: true })

      this.$refs.uploader.click()
      console.log('this.imageBase64', this.imageBase64)
    },
    onUploadBanner () {
      this.isBannerSelecting = true
      window.addEventListener('focus', () => {
        this.isBannerSelecting = false
      }, { once: true })

      this.$refs.bannerUploader.click()
      console.log('this.bannerBase64', this.bannerBase64)
    }
  },
  head: { title: 'ניהול לקוחות' }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .date-filter{
    margin-right: auto;
  }
  .text-ping{
    margin-right: 20px;
  }
  .filter-ui {
    .row--dense {
      .col-4, .col-2 {
        .v-input {
          margin-right: 0 !important;
        }
      }
    }
  }
  .export-btn {
    .col-2 {
      padding-right: 0 !important;
    }
  }
}
.send-login-sms-dialog {
  padding: 20px;
}
.delete-customer {
  border-radius: 25px;
  margin: 25px 30% auto 30%;
  height: 100px;
  width: 100px;
  p {
    padding-top: 10px;
    font-size: 16px !important;
    color: #ffffff;
  }
  background-color: red;
}
.table-ui table td {
  text-align: center;
}
.banner-img{
  display: flex;
  width: 201px;
  height: 100px;
  margin-top: 2rem;
  box-shadow: 4px 3px 11px 3px #00000059;

  img {
    width: 100%;
    border-radius: 50% 50%;
  }
}

.customer-login-sms-btn {
  width: inherit;
  font-size: 12px;
  margin: 20px auto;
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

.delete-img {
  position: fixed;
  cursor: pointer;
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
  }
}
</style>
