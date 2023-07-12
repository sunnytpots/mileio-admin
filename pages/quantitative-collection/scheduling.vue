<template>
  <SectionLayout title="תזמון משימות איסוף">
    <v-row>
      <v-col cols="6">
        <div class="scan-widget">
          <v-container>
            <v-row>
              <v-col cols="8">
                <div class="scan-search">
                  <v-autocomplete
                    clearable
                    outlined
                    :value="form.customer_uid"
                    :items="customers"
                    item-text="name"
                    item-value="uuid"
                    solo
                    :error-messages="$v.$dirty && $v.form.customer_uid.$invalid && 'שדה חובה' || ''"
                    label="בחר לקוח"
                    @input="getCustomerScheduling">
                    <template #append>
                      <button class="btn-search" type="button" @click.prevent="true" v-text="'הצג'" />
                    </template>
                  </v-autocomplete>
                </div>
              </v-col>
              <v-col cols="4" class="side-block">
                <h3>{{ customerData && customerData.name }}</h3>
                <h5>{{ customerData && customerData.address}}</h5>
              </v-col>
            </v-row>
          </v-container>
        </div>
      </v-col>

    </v-row>
    <v-row>
      <v-col cols="6">
        <CardUi>
          <div>
            <template>
              <v-container v-if="eventList && eventList.length > 0" class="container-events">
                <v-alert
                  v-for="(item, index) in eventList"
                  :key="index"
                  class="alertEvent"
                  close-icon
                  color="#ff3066"
                  elevation="2">
                  <v-row>
                    <v-col cols="3">זמן איסוף: {{ item.pick_up_time }}</v-col>
                    <v-col v-if="item.recurring_task" cols="3">{{ `משימה חוזרת ליום: ${translateDays(item.collection_days)}` }}</v-col>
                    <v-col v-else cols="3">
                      <p style="margin-bottom: 0" v-text="'משימה לתאריך: '"/>
                      <div v-if="item.pick_up_date.includes('Z')">
                        {{ item.pick_up_date | formatDate }}
                      </div>
                      <div v-else>
                        {{ item.pick_up_date }}
                      </div>
                    </v-col>
                    <v-col cols="3">{{ item.driver_id }}</v-col>
                    <v-col cols="2">{{ item.driver_id && `סוג רכב: ${item.carType || 'לא נמצא'}` }}</v-col>
                    <v-col cols="1"><i class="icon icon-trash-white" style="cursor: pointer" @click="deleteSchedulingTask(index)" /></v-col>
                  </v-row>
                </v-alert>
              </v-container>
            </template>
          </div>
        </CardUi>
      </v-col>
      <v-col cols="6">
        <CardUi v-if="form.customer_uid" :key="renderKey">
          <v-container>
            <v-row>
              <v-col cols="4">
                <v-row>
                  <v-col cols="6">
                    <v-select
                      v-model="form.pick_up_minutes_time"
                      clearable
                      :items="pickMinTime"
                      item-text="name"
                      item-value="key"
                      label="דקה"
                      class="select-ui"
                      filled
                      rounded
                      :error-messages="$v.$dirty && $v.form.pick_up_minutes_time.$invalid && 'שדה חובה' || ''">
                      <template v-slot:append>
                        <i class="icon icon-arrowSelect"/>
                      </template>
                    </v-select>
                  </v-col>
                  <v-col cols="6">
                    <v-select
                      v-model="form.pick_up_hours_time"
                      clearable
                      :items="pickHourTime"
                      label="שעה"
                      class="select-ui"
                      filled
                      rounded
                      :error-messages="$v.$dirty && $v.form.pick_up_hours_time.$invalid && 'שדה חובה' || ''">
                      <template v-slot:append>
                        <i class="icon icon-arrowSelect"/>
                      </template>
                    </v-select>
                  </v-col>
                </v-row>
                <v-switch
                  v-model="form.recurring_task"
                  label="משימה חוזרת"
                  color="red"
                  hide-details
                />
                <div v-if="form.recurring_task">
                  <v-checkbox
                    v-for="(day, index) of days"
                    :key="index"
                    :label="day.key"
                    color="red"
                    hide-details
                    @click="addToDayList(day)"
                  />
                </div>
                <div v-else class="singular_task_date_picker">
                  <p>בחר תאריך</p>
                  <v-menu v-model="pickDate" :close-on-content-click="false" transition="scale-transition" offset-y>
                    <template #activator="{ on, attrs }">
                      <v-text-field
                        v-model="form.pick_up_date"
                        class="date-filter-coordinator"
                        outlined
                        dense
                        append-icon="icon icon-calender"
                        readonly
                        v-bind="attrs"
                        v-on="on">
                        <template v-slot:append>
                          <i class="icon icon-arrowSelect"/>
                        </template>
                      </v-text-field>
                    </template>

                    <v-date-picker v-model="form.pick_up_date" @input="pickDate = false" />
                  </v-menu>
                </div>
              </v-col>
              <v-col cols="8" >
                <v-container class="card">
                  <v-row style="border-bottom: 1px solid #e4e4e4;">
<!--                      <v-col cols="5" style="border-left: 1px solid #e4e4e4;">-->
<!--                        <v-select v-model="form.branch_uid" :items="branches" item-text="name" item-value="uuid" label="איזור" :error-messages="$v.$dirty && $v.form.branch_uid.$invalid && 'שדה חובה' || ''"/>-->
<!--                      </v-col>-->
                    <v-col cols="12">
                      <v-autocomplete
                        v-model="form.driver_id"
                        clearable
                        :items="drivers"
                        :item-text="getFullName"
                        item-value="id"
                        label="שם הנהג"
                        class="autocomplete-ui"
                        filled
                        rounded>
                        <template v-slot:append>
                          <i class="icon icon-arrowSelect"/>
                        </template>
                      </v-autocomplete>
                    </v-col>
                  </v-row>
                  <v-container class="driver-data" >
                    <v-row v-if="form.driver_id">
                      <v-col cols="6">
                        <small>סוג רכב</small>
                        <span>{{ driverData.car_type }}</span>
                      </v-col>
                      <v-col cols="6">
                        <small>איזורי עבודה</small>
                        <label>{{ driverData.branches.map( elem =>{return elem.name}).join(',') }}</label>
                      </v-col>
                      <v-col cols="6">
                        <small>מספר רכב</small>
                        <label>{{driverData.car_number}}</label>
                      </v-col>
                      <v-col cols="6">
                        <small>קווים</small>
                        <p style="overflow: auto;">{{ driverData.lines.map( elem =>{return elem.name}).join(',') }}</p>
                      </v-col>
                      <v-col cols="6">
                        <small>קיבולת</small>
                        <label>{{ driverData.car_capacity }}</label>
                      </v-col>
                      <v-col cols="6">
                        <small>טלפון</small>
                        <label>{{ driverData.mobile }}</label>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-container>
              </v-col>
            </v-row>
            <v-row style="float: left">
              <v-btn
                class="btn-primary btn-sm"
                :disabled="addingTask"
                @click="addSchedulingTask(form, false)">
                שמירה
              </v-btn>
            </v-row>
          </v-container>
        </CardUi>
      </v-col>
    </v-row>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'
import { required } from 'vuelidate/lib/validators'
import moment from 'moment'

export default {
  name: 'QuantitativeCollectionScheduling',
  middleware: ['permissions'],
  data () {
    return {
      pickDate: false,
      addingTask: false,
      renderKey: 1,
      widgets: [
        { title: 'איזור איסוף', value: 22 },
        { title: 'קו', value: 15 },
        { title: 'ממוצע יומי', value: 25 },
        { title: 'משימות איסוף', value: 25 }
      ],
      customerData: {},
      type: 'day',
      types: ['month', 'week', 'day', '4day'],
      mode: 'stack',
      modes: ['stack', 'column'],
      weekday: [0, 1, 2, 3, 4, 5, 6],
      weekdays: [
        { text: 'Sun - Sat', value: [0, 1, 2, 3, 4, 5, 6] },
        { text: 'Mon - Sun', value: [1, 2, 3, 4, 5, 6, 0] },
        { text: 'Mon - Fri', value: [1, 2, 3, 4, 5] },
        { text: 'Mon, Wed, Fri', value: [1, 3, 5] }
      ],
      value: '',
      events: [],
      colors: ['blue', 'indigo', 'deep-purple', 'cyan', 'green', 'orange', 'grey darken-1'],
      names: ['Meeting', 'Holiday', 'PTO', 'Travel', 'Event', 'Birthday', 'Conference', 'Party'],
      pickMinTime: [
        {
          key: 0,
          name: '00'
        }, {
          key: 15,
          name: '15'
        }, {
          key: 30,
          name: '30'
        }, {
          key: 45,
          name: '45'
        }
      ],
      pickHourTime: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
      pickTime: [
        { key: '00:00', value: 0 },
        { key: '01:00', value: 1 },
        { key: '02:00', value: 2 },
        { key: '03:00', value: 3 },
        { key: '04:00', value: 4 },
        { key: '05:00', value: 5 },
        { key: '06:00', value: 6 },
        { key: '07:00', value: 7 },
        { key: '08:00', value: 8 },
        { key: '09:00', value: 9 },
        { key: '10:00', value: 10 },
        { key: '11:00', value: 11 },
        { key: '12:00', value: 12 }
      ],
      days: [
        { key: 'ראשון', value: 1 },
        { key: 'שני', value: 2 },
        { key: 'שלישי', value: 3 },
        { key: 'רביעי', value: 4 },
        { key: 'חמישי', value: 5 },
        { key: 'שישי', value: 6 },
        { key: 'שבת', value: 7 }

      ],
      form: {
        setting_uid: null,
        driver_id: null,
        customer_uid: null,
        // branch_uid: null,
        pick_up_time: null,
        pick_up_hours_time: null,
        pick_up_minutes_time: null,
        recurring_task: false,
        collection_days: [],
        pick_up_date: moment().endOf('day').format('YYYY-MM-DD')
      },
      eventList: [],
      driverData: {},
      driverBranches: [],
      filteredEvent: [],
      currentEvent: null
    }
  },
  computed: {
    ...mapState('global', ['customers', 'branches', 'drivers'])
  },
  watch: {
    'form.customer_uid' (uid) {
      this.customerData = this.customers.find(c => { return c.uuid === uid })
    },
    'form.driver_id' (id) {
      this.driverData = this.drivers.find(d => {
        return d.id === id
      })
    }
  },
  async created () {
    try {
      await this.$store.dispatch('global/getCustomerList')
      await this.$store.dispatch('global/getBranchList')
      await this.$store.dispatch('global/getDriverList')
    } catch (e) {
      this.$helper(e, 'created')
    }
  },
  methods: {
    cleanUp () {
      const tempCustomerUid = this.form.customer_uid
      this.form = {
        // setting_uid: null,
        driver_id: null,
        customer_uid: null,
        // branch_uid: null,
        pick_up_time: null,
        pick_up_hours_time: null,
        pick_up_minutes_time: null,
        recurring_task: false,
        collection_days: [],
        pick_up_date: moment().endOf('day').format('YYYY-MM-DD')
      }
      this.form.customer_uid = tempCustomerUid
      this.renderKey++
    },
    translateDays (days) {
      const translatedDays = []
      const unObserveredDays = JSON.parse(JSON.stringify(days))
      const unObserveredDataDays = JSON.parse(JSON.stringify(this.days))
      for (let i = 0; i < unObserveredDays.length; i++) {
        unObserveredDataDays.forEach(day => {
          if (unObserveredDays[i] === day.value) {
            translatedDays.push(day.key)
          }
        })
      }
      return translatedDays.join(',')
    },
    async getCustomerScheduling (value) {
      try {
        this.form.customer_uid = value
        this.eventList = []
        if (this.form.customer_uid) {
          const tasksSettings = await this.$collectionTaskSettingService.findByCustomer({ customer_uid: this.form.customer_uid })
          for (const task of tasksSettings) {
            await this.addSchedulingTask(task, true)
          }
        } else {
          this.eventList = []
        }
      } catch (e) {
        console.log('error', e)
        this.$store.commit('setSnackbar', { value: true, message: e.response.data.message, error: true })
      }
    },
    eventFiltered (item, index) {
      let currentEvent = null
      for (const event of this.eventList) {
        if (item.value === event.pick_up_time) {
          currentEvent = event
          this.filteredEvent[index] = currentEvent
          return true
        }
      }
      return false
    },
    addToDayList (day) {
      const index = this.form.collection_days.indexOf(day.value)
      index > -1 ? this.form.collection_days.splice(index, 1) : this.form.collection_days.push(day.value)
    },
    async deleteSchedulingTask (index) {
      try {
        await this.$collectionTaskSettingService.removeTask(this.eventList[index].setting_uid)
        this.eventList.splice(index, 1)
      } catch (e) {
        this.$helper.snackbar(e, 'deleteSchedulingTask')
      }
    },
    async addSchedulingTask (form, getCustomerData) {
      try {
        if (!getCustomerData) {
          this.$v.$touch()
          if (this.$v.$error) {
            return
          }
          if (form.recurring_task && form.collection_days?.length === 0) {
            return this.$store.commit('setSnackbar', { value: true, message: 'יש לבחור לפחות יום אחד', error: true })
          }
        }
        const driver = this.drivers.find(d => d.id === form.driver_id)
        const driverName = driver ? ` שם נהג: ${driver.first_name} ${driver.last_name}` : ''
        const pickUpMinutesTime = form.pick_up_minutes_time === 0 ? '00' : form.pick_up_minutes_time
        const obj = {
          setting_uid: getCustomerData ? form.uuid : null,
          pick_up_time: `${form.pick_up_hours_time}:${pickUpMinutesTime}`,
          recurring_task: form.recurring_task,
          driver_id: driverName,
          carType: driver?.car_type,
          collection_days: form.collection_days
        }
        if (getCustomerData && !form.recurring_task && form.collection_task) {
          Object.assign(obj, { pick_up_date: form.collection_task.pick_up_date })
        }

        if (!getCustomerData) {
          this.addingTask = true
          if (form.recurring_task) {
            Object.assign(obj, { collection_days: form.collection_days })
            await this.$collectionTaskSettingService.addTask(this.form)
          } else {
            const pickUpDate = moment(form.pick_up_date)
              .set({ h: form.pick_up_hours_time, m: form.pick_up_minutes_time })

            if (!pickUpDate || pickUpDate.valueOf() < moment().valueOf()) {
              this.addingTask = false
              return this.$store.commit('setSnackbar', { value: true, message: 'לא ניתן ליצור משימה בתאריך זה', error: true })
            }
            Object.assign(obj, { pick_up_date: pickUpDate.format('DD/MM/YYYY HH:mm') })
            await this.$collectionTaskSettingService.addSingular(this.form)
          }
          this.cleanUp()
          this.addingTask = false
        }

        const pushedObject = JSON.parse(JSON.stringify(obj))
        this.eventList.push(pushedObject)
      } catch (e) {
        this.addingTask = false
        this.$helper.snackbar(e, 'addSchedulingTask')
      }
    },
    getFullName (item) {
      return `${item.first_name} ${item.last_name}`
    }
  },
  validations: {
    form: {
      pick_up_hours_time: { required },
      pick_up_minutes_time: { required },
      customer_uid: { required }
    }
  },
  head: { title: 'תזמון משימות איסוף' }
}
</script>

<style lang="scss" scoped>

.singular_task_date_picker{
  margin-top: 20px;
   p {
     margin: auto 5px 5px auto;
   }
}

::v-deep {
  .v-application .primary--text{
    margin-top: 5px;
  }
}
.container-events{
  max-height: 445px;
  overflow-y: auto;
}
.icon.icon-trash-white{
  float: left;
}
::v-deep {
  .v-calendar-daily__head{
    margin-right: inherit !important;
    .v-calendar-daily__intervals-head{
      width: auto !important;
    }
  }

  .theme--light.v-text-field--outlined:not(.v-input--is-focused):not(.v-input--has-state) > .v-input__control > .v-input__slot fieldset{
    background-color: white;
  }
}

::v-deep {
  .v-event-timed-container{
    .v-event-timed{
      height: 49px !important;
      text-align: center;
      padding-top: 13px;
      font-size: 13px;
      font-weight: 100;
    }
  }
}

.side-block{
  background-color: #303640;
  border-radius: 4px;
  text-align: center;
  color: white;
  font-size: larger;
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
      background-color: #e0e3e7;
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
    //.theme--light.v-input input{
    //  //color: #fff;
    //}
    .v-application--is-ltr .v-text-field .v-label {
      display: none !important;
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
.card{
  border: 1px solid #e4e4e4;
  border-radius: 15px;
}
.driver-data {
  text-align: center;
  margin-top: 15px;
  .col-6 {
    display: grid;
  }
  small{
    color:#a2a2a2 ;
  }
}
.alertEvent{
  font-size: 12px;
  font-weight: 800;
  margin-top: 13px;
  color: white;
}
</style>
