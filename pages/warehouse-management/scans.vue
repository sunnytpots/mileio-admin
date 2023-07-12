<template>
  <SectionLayout title="ניהול מחסן - מסך סריקה">
    <CardUi class="text-center">
      <v-progress-circular
        v-if="loading"
        class="spinner"
        size="50"
        color="green"
        indeterminate/>
      <template #header>
        <div class="scan-header">
          <v-form
            ref="form"
            v-model="valid"
            lazy-validation>
            <v-container>
              <v-row style="justify-content: space-between;">
                <v-col>
                  <v-row>
                    <v-col cols="4">
                      <v-select
                        v-model="form.action_type"
                        clearable
                        class="select-ui"
                        rounded
                        filled
                        :items="actions"
                        label="סוג פעולה"
                        item-text="value"
                        item-value="key"
                        :error-messages="$v.$dirty && $v.form.action_type.$invalid && 'שדה חובה' || ''">
                        <template v-slot:append>
                          <i class="icon icon-arrowSelect"/>
                        </template>
                      </v-select>
                    </v-col>

                    <v-col v-if="!['stored', 'packed'].includes(form.action_type)" cols="4">
                      <v-select
                        v-model="form.branch_id"
                        clearable
                        class="select-ui"
                        filled
                        rounded
                        :items="branches"
                        item-text="name"
                        item-value="id"
                        label="סניף"
                        :error-messages="$v.$dirty && $v.form.branch_id.$invalid && 'שדה חובה' || ''">
                        <template v-slot:append>
                          <i class="icon icon-arrowSelect"/>
                        </template>
                      </v-select>
                    </v-col>

                    <v-col cols="4">
                      <v-checkbox
                        v-if="!['stored', 'packed'].includes(form.action_type)"
                        v-model="form.scan_forced"
                        class="force-scan"
                        label="סריקה בכפייה"/>
                    </v-col>
                  </v-row>

                  <v-row>
                    <v-col cols="4">
                      <v-select
                        v-model="form.scan_option"
                        class="select-ui"
                        filled
                        rounded
                        :items="scanOptions"
                        item-text="key"
                        item-value="value"
                        label="אפשרויות סריקה">
                        <template v-slot:append>
                          <i class="icon icon-arrowSelect"/>
                        </template>
                      </v-select>
                    </v-col>

                    <v-col cols="4">
                      <v-text-field
                        v-model="search"
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
                  </v-row>
                </v-col>

                <v-col cols="6">
                  <div class="scan-widget">
                    <v-container>
                      <v-row>
                        <v-col cols="4" class="side-block">
                          <span>כמות חבילות שנסרקו בחודש זה</span>
                          <div>{{ items.length }}</div>
                        </v-col>
                        <v-col cols="6">
                          <div class="scan-search">
                            <v-text-field
                              v-model="form.delivery_identification"
                              outlined
                              :error-messages="$v.$dirty && $v.form.delivery_identification.$invalid && 'שדה חובה' || ''">
                              <template #append>
                                <v-btn
                                  class="btn-search"
                                  type="button"
                                  :loading="loading"
                                  @click.prevent="onScan"
                                  v-text="'סרוק'"/>
                              </template>
                            </v-text-field>
                          </div>
                        </v-col>
                        <v-col cols="2" class="side-block">
                          <img src="../../assets/images/scan-search.png">
                        </v-col>
                      </v-row>
                    </v-container>
                  </div>
                </v-col>
              </v-row>

              <v-row style="justify-content: space-between;">
                <v-col cols="3" style="padding: 0">
                  <ExportReport
                    report-type="scans"
                    :filter="{ user_id: authUser && authUser.id, search }"/>
                </v-col>
              </v-row>
            </v-container>
          </v-form>
        </div>
      </template>
      <v-container class="text-center">
        <v-row>
          <v-col>
            <small
              class="text-ping clear-filter"
              @click="deleteScans">
              מחק סריקות
            </small>
          </v-col>
        </v-row>

        <v-row style="justify-content: flex-start">
          <v-col cols="2">
            <p v-if="items && items.length > 0" v-text="'סריקות לשעה האחרונה:'"/>
            <p v-else v-text="'לא נמצאו סריקות לשעה האחרונה.'"/>
          </v-col>
        </v-row>

        <v-row class="scans-row">
          <v-col>
            <v-alert
              v-for="(item, index) in items"
              :key="index"
              :color="scanStatus[item.status]">
              <v-row>
                <v-col cols="1">
                  <div class="scan-status">
                    <i :class="['icon', scanStatusIcon[item.status]]" />
                    <p
                      style="margin-bottom: 0; padding-top: 10px; font-size: 14px"
                      v-text="getScanStatus(item.status)"/>
                  </div>
                </v-col>
                <v-col cols="2" class="block">
                  <p
                    style="margin-bottom: 0"
                    v-text="item.customer && item.customer.name"/>
                </v-col>
                <v-col cols="1" class="block">
                  <p
                    class="col-title"
                    v-text="'ברקוד שנסרק:'"/>
                  <p
                    style="margin-bottom: 0"
                    v-text="item.delivery && item.delivery.barcode"/>
                </v-col>
                <v-col cols="2" class="block">
                  <p
                    class="col-title"
                    v-text="'פעולה שבוצעה'"/>
                  <p
                    v-if="item && item.action_type === 'stored'"
                    style="margin-bottom: 0"
                    v-text="'ממיינת בפעולה'"/>
                  <p
                    v-else
                    style="margin-bottom: 0"
                    v-text="item && getFlatDeliveryStatusValue(item.delivery)"/>
                </v-col>
                <v-col cols="2" class="block">
                  <p
                    class="col-title"
                    v-text="'פוליגון משלוח וסניף'"/>

                  <div v-if="item.action_type === 'stored'">
                    <p
                      style="margin-bottom: 0"
                      v-text="item.line && item.line.line_number"/>
                    <p
                      style="margin-bottom: 0"
                      v-text="item.exit && ` מספר יציאה - ${item.exit.exit_number}`"/>
                  </div>
                  <div v-else>
                    <p
                      style="margin-bottom: 0"
                      v-text="item.polygon && item.polygon.name"/>
                    <p
                      style="margin-bottom: 0"
                      v-text="item.line && item.line.line_number"/>
                  </div>
                </v-col>
                <v-col cols="1" class="block">
                  <p
                    :style="`margin-bottom: 0; font-size: ${item.err_msg && item.err_msg.length > 15 ? '13px' : '15px'}`"
                    v-text="item.err_msg || 'תקין'"/>
                </v-col>
                <v-col cols="1" class="block">
                  <p
                    class="col-title"
                    style="font-size: 14px"
                    v-text="'תאריך ושעת סריקה'"/>
                  {{ item.created_at | formatDate }}
                </v-col>
                <v-col cols="1" class="block">
                  <v-btn
                    class="btn-primary"
                    @click="openInCoordinator(item)">
                    {{ 'הצג ברכז' }}
                  </v-btn>
                </v-col>
                <v-col cols="1" class="scan-delete-col">
                  <DeleteButton
                    url="scans/delete-scan"
                    api-method="$post"
                    :req-body="{ user_id: authUser.id, scan_id: item.id }"
                    warning-message="האם אתה בטוח למחוק סריקה זו?"
                    has-warning
                    @deleted="getScans"/>
                </v-col>
              </v-row>
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
    </CardUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'
import { required, requiredIf } from 'vuelidate/lib/validators'

export default {
  name: 'WarehouseManagementScans',
  middleware: ['permissions'],

  data () {
    return {
      scanOptions: [
        { value: 'last_30_days', key: '30 ימים אחרונים' },
        { value: 'from_the_beginning', key: 'כל הזמן' }
      ],
      loading: false,
      scanData: [],
      scanInput: '',
      actions: [
        { key: 'enter_to', value: 'כניסה ל' },
        { key: 'exit_to', value: 'יציאה ל' },
        { key: 'stored', value: 'ממיינת' },
        { key: 'packed', value: 'נארז' }
      ],
      scanStatus: {
        success: '#b1f3b2',
        warning: '#fcf5d8',
        error: '#fcd8d8'
      },
      scanStatusIcon: {
        success: 'icon-v',
        warning: 'icon-warning',
        error: 'icon-error'
      },
      items: [],
      valid: true,
      search: null,
      form: {
        scan_option: 'last_30_days',
        action_type: null,
        branch_id: null,
        user_id: null,
        scan_forced: false,
        delivery_identification: null,
        delivery_type: 'delivery'
      },
      required: [
        v => !!v || 'שדה חובה'
      ]
    }
  },
  computed: {
    ...mapState('global', ['branches']),
    ...mapState('auth', ['authUser'])
  },
  watch: {
    async search (newVal) {
      try {
        if (newVal.length > 0 && newVal.length < 3) {
          return
        }

        this.loading = true
        this.items = await this.$scansService.list({ user_id: this.authUser.id, search: newVal })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'search watch error')
      }
    }
  },
  async created () {
    try {
      this.form.user_id = this.authUser.id
      await this.getScans()
      await this.$store.dispatch('global/getBranches')
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  mounted () {
    document.addEventListener('keypress', this.myHandler)
  },
  destroyed () {
    document.removeEventListener('keypress', this.myHandler)
  },
  methods: {
    getScanStatus (status) {
      switch (status) {
        case 'success':
          return 'נסרק בהצלחה'
        case 'warning':
          return 'נסרק עם אזהרה'
        case 'error':
          return 'שגיאה'
      }
    },
    openInCoordinator (item) {
      return this.$router.push({ name: 'coordinator', params: { id: item.delivery?.id } })
    },
    async getScans () {
      try {
        this.loading = true
        this.items = await this.$scansService.list({ user_id: this.authUser.id })
        this.form.delivery_identification = null
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getScans')
      }
    },
    getFlatDeliveryStatusValue (delivery) {
      if (!delivery) {
        return
      }

      let statusValue = null
      if (delivery.status_key === 'enter_to') {
        statusValue = delivery.enter_to_branch ? (delivery.status_value + delivery.enter_to_branch) : delivery.status_value
      } else if (delivery.status_key === 'exit_to') {
        statusValue = delivery.exit_to_branch ? (delivery.status_value + delivery.exit_to_branch) : delivery.status_value
      } else {
        statusValue = delivery.status_value
      }
      return statusValue
    },
    myHandler (e) {
      console.log('this.$refs.form.validate()', this.$refs.form.validate())
      if (!this.$refs.form.validate()) {
        return this.$store.commit('setSnackbar',
          {
            value: true,
            message: 'לא ניתן לבצע סריקה ללא בחירת סוג פעולה וסניף',
            error: true
          })
      }
      if (e.key === 'Enter') {
        this.form.delivery_identification = this.scanData.join('')
        this.scanData = []
        this.onScan()
      } else {
        this.scanData.push(e.key)
      }
    },
    async onScan () {
      try {
        this.$v.$touch()

        if (this.$v.$error) {
          return
        }
        this.loading = true
        this.$store.commit('setSnackbar', false)
        await this.$scansService.addScan(this.form)
        this.$store.commit('setSnackbar', { timeout: 900, value: true, message: 'נסרק בהצלחה', success: true })
        await this.getScans()
        this.loading = false
      } catch (e) {
        this.$helper.snackbar(e, 'onScan')
        this.form.delivery_identification = null
        this.loading = false
        if (!e.response.data.status) {
          const delivery = e.response.data.delivery || null
          if (!delivery) {
            return
          }
          const invalidItem = {
            action_type: this.form.action_type,
            delivery_identification: delivery.barcode,
            status: 'error',
            customer: delivery.customer,
            branch: delivery.branch,
            polygon: delivery.polygon,
            line: delivery.line,
            created_at: new Date(),
            err_msg: e.response.data.message
          }
          this.items.unshift(invalidItem)
          this.loading = false
        }
      }
    },
    async onsubmit () {
      try {
        await this.onScan()
      } catch (e) {
        this.$helper.snackbar(e, 'onsubmit')
      }
    },
    async deleteScans () {
      try {
        this.loading = true
        await this.$scansService.deleteAll({ user_id: this.authUser.id })
        await this.getScans()
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'deleteScans')
      }
    }
  },
  validations: {
    form: {
      action_type: { required },
      branch_id: {
        required: requiredIf(function () {
          return !['stored', 'packed'].includes(this.form.action_type)
        })
      },
      delivery_identification: { required }
    }
  },
  head: { title: 'ניהול מחסן | מסך סריקה' }
}
</script>

<style lang="scss" scoped>
.scans-row {
  max-height: 473px;
  overflow-y: scroll;
  direction: ltr;

  .col {
    direction: rtl;
  }
}
.scan-header {
  padding-bottom: 0;
}
.export-btn {
  .col-2 {
    padding-right: 0;
  }
}
.force-scan {
  margin-top: 5px;
}
.scan_type_label {
  color: #FFFFFF;
  text-align: right;
  margin-top: 10px
}
.scan-delete-col {
  margin: auto;
  .icon-delete {
    cursor: pointer;
  }
}
i{
  width: auto;
}
.col{
  .block{
    border-left: 1px solid #d8d1d1;
    padding: 0;
  }
}
.div-content{
  width: 100%;
  margin-top: 15px;
}
.side-block{
  border-radius: 4px;
  text-align: center;
  color: white;
  margin: auto;
}
.v-alert {
  display: block;
  font-size: 16px;
  margin-bottom: 16px;
  padding: 0;
  position: relative;
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
  .row {
    align-items: center;
    .col {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: fit-content;
    }
    .scan-status {
      margin: 15%;
      border-left: 1px solid #d8d1d1;
    }
    .col-title {
      margin-bottom: 0; text-decoration: underline
    }
  }
}

.scan-widget{
  background-color: #22272E;
  border-radius: 4px;
}

.scan-search{
  margin-top: 0.9rem;
  ::v-deep{
    .v-input{
      width: 38.3rem;
      background-color: #373f4c;
    }
    .v-text-field--outlined{
      border-radius: 8px;
    }
    .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) > .v-input__control > .v-input__slot {
      padding-left: 0;
    }
    .v-input__slot{
      margin-bottom: 0;
    }
    .v-text-field__details{
      display: none;
    }
    .v-input__append-inner{
      margin-top: 0;
    }
    fieldset{
      border: none;
    }
    .theme--light.v-input input{
      color: #fff;
    }
  }

  .btn-search{
    min-height: 56px;
    background-color: #fa4616;
    color: #fff;
    border-radius: 8px 0 0 8px;
    font-size: .8rem;
    padding: 0 2.2rem;
  }
}
</style>
