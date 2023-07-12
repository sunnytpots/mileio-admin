<template>
  <CardUi>
    <v-dialog
      v-model="openDialog"
      max-width="500"
      text-align="-webkit-center"
      class="drawer-modal">
      <div style="background-color: #f8f8fd">
        <v-card-text class="dialog-title">
          {{ `שק לא נעול עם מספר ${bagNumber} כבר קיים לנקודת חלוקה זו` }}
        </v-card-text>
        <v-card-text class="dialog-title">
          {{ `האם תרצה ליצור שק חדש או להשתמש בשק הקיים?` }}
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="green darken-1"
            text
            @click="getExistingBags">
            השתמש בשק קיים
          </v-btn>
          <v-spacer />
          <v-btn
            color="green darken-1"
            text
            @click="createNewBag">
            צור שק חדש
          </v-btn>
        </v-card-actions>
      </div>
    </v-dialog>
    <template #header>
      <div class="filter-ui">
        <v-form
          ref="form"
          v-model="valid"
          lazy-validation>
          <v-container>
            <v-row class="top-details-row">
              <v-col  style="border-bottom: 1px solid #e4e4e4;border-left: 1px solid #e4e4e4; text-align: center;">
                <span>שם מחסנאי</span>
                <span v-if="bag && bag.storekeeper_name" class="data-label">{{ bag && bag.storekeeper_name }}</span>
                <span v-else class="data-label">{{ authUser && (authUser.first_name + ' ' + authUser.last_name) }}</span>
              </v-col>
              <v-col  style="border-bottom: 1px solid #e4e4e4;border-left: 1px solid #e4e4e4; text-align: center;">
                <span>שם נקודת חלוקה</span>
                <v-autocomplete
                  v-model="distPointId"
                  clearable
                  dense
                  outlined
                  :disabled="bag && bag.id !== null"
                  :items="distributionPoints"
                  item-text="name"
                  item-value="id"
                  :error-messages="$v.$dirty && $v.form.dist_point_id.$invalid && 'שדה חובה' || ''"
                  @change="selectDistPoint($event)">
                  <template v-slot:append>
                    <i class="icon icon-arrowSelect"/>
                  </template>
                </v-autocomplete>
              </v-col>
              <v-col  style="border-bottom: 1px solid #e4e4e4;border-left: 1px solid #e4e4e4; text-align: center;">
                <span>מספר נקודה</span>
                <br>
                <span class="data-label">{{ pointNumber }}</span>
              </v-col>
              <v-col style="border-bottom: 1px solid #e4e4e4;border-left: 1px solid #e4e4e4; text-align: center;">
                <span>תאריך יצירה</span>
                <br>
                <span v-if="created_at" class="data-label">{{ created_at | formatDate }}</span>
              </v-col>
            </v-row>
            <v-row class="d-print-none">
              <v-col>
                <div class="scan-widget">
                  <v-container>
                    <v-row>
                      <v-col cols="4" class="side-block">
                        <span>כמות חבילות שנסרקו</span>
                        <div>{{ packages.length }}</div>
                      </v-col>
                      <v-col cols="6">
                        <div class="scan-search">
                          <v-text-field
                            v-model="form.barcode"
                            :disabled="bag && bag.is_blocked"
                            outlined
                            :error-messages="$v.$dirty && $v.form.barcode.$invalid && 'שדה חובה' || ''">
                            <template #append>
                              <button
                                :class="['btn-search', bag && bag.is_blocked && 'btn-disabled']"
                                type="button"
                                :disabled="bag && bag.is_blocked"
                                @click.prevent="onScan">
                                {{ bag && bag.is_blocked ? 'שק נעול' : 'סרוק' }}
                              </button>
                            </template>
                          </v-text-field>
                        </div>
                      </v-col>
                      <v-col cols="2" class="side-block">
                        <img src="../../../assets/images/scan-search.png">
                      </v-col>
                    </v-row>
                  </v-container>
                </div>
              </v-col>
            </v-row>
          </v-container>
        </v-form>
      </div>
    </template>
    <v-container class="items-list">
      <v-alert v-for="(item, index) in packages" :key="index" :color="scanStatus[item.status]">
        <v-row>
          <v-col cols="4" class="block">
            <small
              v-if="bag && !bag.is_blocked"
              class="text-ping clear-filter"
              @click="removeFromBag(index, item.delivery.id, item.delivery.barcode, item.status)">
              הסרה
            </small>
            <div class="div-content">
              <span>ברקוד: {{ item.delivery && item.delivery.barcode }}</span>
              <br>
              <span style="font-size: small;">תאריך שידור: {{ item.delivery && item.delivery.created_at | formatDate }}</span>
            </div>
          </v-col>
          <v-col cols="2" class="block">
            <div class="div-content">
              מספר לקוח: {{item.dist_point && item.dist_point.point_number || null}}
            </div>
          </v-col>
          <v-col cols="2" class="block">
            <div class="div-content">
              {{item.dist_point && item.dist_point.name || null}}
            </div>
          </v-col>
          <v-col cols="3" class="block">
            <div class="div-content" v-if="item.status === 'success'">
              תאריך סריקה לשק:
              <br>
              {{item.created_at | formatDate }}
            </div>
            <div class="div-content" v-else>
              {{ item.errMsg }}
            </div>
          </v-col>
          <v-col cols="1" :class="`scan-status-${item.status}`">
            <i :class="['icon', scanStatusIcon[item.status]]" />
            <div>
              {{ item.status === 'error' ? 'שגיאה' : 'תקין'  }}
            </div>
          </v-col>
        </v-row>
      </v-alert>
    </v-container>
  </CardUi>
</template>

<script>
import { required } from 'vuelidate/lib/validators'
import { mapState } from 'vuex'

export default {
  name: 'DistributionPointsBagsScanBag',

  props: {
    bag: { type: Object, default: null },
    distributionPoints: { type: Array, default: () => ([]) }
  },

  middleware: ['permissions'],

  data () {
    return {
      bagId: null,
      openDialog: false,
      scanData: [],
      scanInput: '',
      actions: [
        { key: 'enter_to', value: 'כניסה ל' },
        { key: 'exit_to', value: 'יציאה ל' },
        { key: 'stored', value: 'ממיינת' }
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
      packages: [],
      distPointId: null,
      pointNumber: null,
      bagNumber: null,
      created_at: null,
      valid: true,
      form: {
        user_id: null,
        barcode: null,
        dist_point_id: null,
        bag_number: null,
        storekeeper_name: null
      },
      required: [
        v => !!v || 'שדה חובה'
      ]
    }
  },
  computed: {
    ...mapState('auth', ['authUser'])
  },

  async created () {
    try {
      this.form.storekeeper_name = this.authUser.first_name + ' ' + this.authUser.last_name
      this.form.user_id = this.authUser.id
      console.log('this.bag', this.bag)
      if (!this.bag) {
        return
      }

      this.packages = await this.$distributionPointBagsService.viewByBag({ bag_id: this.bag.id })
      this.form.bag_number = this.bag.bag_number
      this.form.dist_point_id = this.bag.distribution_point_id
      this.distPointId = this.form.dist_point_id
      this.bagNumber = this.bag.bag_number
      this.pointNumber = this.bag.dist_point?.point_number
      this.customerName = this.bag.dist_point?.name
      this.created_at = this.bag.created_at
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
    async getExistingBags () {
      try {
        console.log('getExistingBags')
        this.openDialog = false
        this.packages = await this.$distributionPointBagsService.viewByBag({ bag_id: this.bagId })
      } catch (e) {
        console.log('getExistingBags error', e)
      }
    },
    async createNewBag () {
      try {
        console.log('createNewBag')
        this.openDialog = false

        const res = await this.$distributionPointBagsService.addBag({
          user_id: this.form.user_id,
          dist_point_id: this.distPointId,
          storekeeper_name: this.form.storekeeper_name
        })

        this.bagNumber = res?.bag_number

        this.$nuxt.$emit('dist-point-bag-number', res.bag_number) // submit to function from child comp

        this.form.bag_number = res.bag_number
        this.form.dist_point_id = res.distribution_point_id
        this.created_at = res.created_at
      } catch (e) {
        console.log('createNewBag error', e)
      }
    },
    myHandler (e) {
      if (e.key === 'Enter') {
        this.form.barcode = this.scanData.join('')
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
        this.$store.commit('setSnackbar', false)
        console.log('form', this.form)

        const res = await this.$distributionPointBagsService.addPackageToBag(this.form)
        this.packages.push(res)
      } catch (e) {
        const errorMsg = e.response && e.response.data && e.response.data.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
        if (!e.response.data.status) {
          const invalidItem = {
            delivery: {
              barcode: this.form.barcode
            },
            dist_point: {
              point_number: this.pointNumber,
              name: this.customerName
            },
            created_at: new Date(),
            status: 'error',
            errMsg: e.response.data.message
          }
          this.packages.push(invalidItem)
        }
      }
    },
    async onsubmit () {
      try {
        await this.onScan()
      } catch (e) {
        const errorMsg = e.response && e.response.data && e.response.data.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    },
    async selectDistPoint (newItem) {
      try {
        if (newItem) {
          const response = await this.$distributionPointBagsService.checkUnblockedBag({
            user_id: this.form.user_id,
            dist_point_id: this.distPointId,
            storekeeper_name: this.form.storekeeper_name
          })

          if (response) {
            this.bagNumber = response.bag_number
            this.$nuxt.$emit('dist-point-bag-number', response.bag_number) // submit to function from child comp
            this.form.bag_number = response.bag_number
            this.form.dist_point_id = response.distribution_point_id
            this.bagNumber = response.bag_number
            this.pointNumber = response.distribution_point_id
            this.bagId = response.id
            this.created_at = response.created_at
            if (response.bag_already_exists) {
              this.openDialog = true
            }
          }
        } else {
          this.pointNumber = null
        }
      } catch (e) {
        const errorMsg = e.response && e.response.data && e.response.data.message
        console.log('errorMsg', errorMsg)
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    },
    async removeFromBag (index, deliveryId, barcode, status) {
      try {
        if (status === 'error') {
          this.packages.splice(index, 1)
          return
        }
        await this.$distributionPointBagsService.removePackageFromBag({
          user_id: this.form.user_id,
          deliveryId,
          bag_id: this.bag.id,
          bag_number: this.bagNumber,
          barcode,
          dist_point_id: this.form.dist_point_id
        })
        this.packages.splice(index, 1)
        this.$store.commit('setSnackbar', { value: true, message: 'חבילה הוסרה מהשק בהצלחה', success: true })
      } catch (e) {
        const errorMsg = e?.response?.data?.message
        console.log('errorMsg', errorMsg)
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    }
  },

  validations: {
    form: {
      barcode: { required },
      dist_point_id: { required }
    }
  }
}
</script>

<style lang="scss" scoped>
.dialog-title {
  text-align: center;
  font-size: 18px;
}
.items-list {
  overflow: scroll;
  max-height: 600px;
  overflow-x: hidden;
}
i{
  width: auto;
}
.col{
  .block{
    text-align: center;
    border-left: 1px solid #d8d1d1;
    display: flex;

    small {
      margin-left: auto;
    }
  }
}
.div-content{
  width: 100%;
  margin-top: 15px;
}
.scan-status-success{
  background-color: #d3f8d3;
  border-radius: 4px;
  text-align: center;
  padding-top: 25px;
}
.scan-status-error{
  background-color: #fcd8d8;
  border-radius: 4px;
  text-align: center;
  padding-top: 25px;
}
.side-block{
  background-color: #303640;
  border-radius: 4px;
  text-align: center;
  color: white;
}
.v-alert {
  display: block;
  font-size: 16px;
  margin-bottom: 16px;
  padding: 12px;
  position: relative;
  transition: 0.3s cubic-bezier(0.25, 0.8, 0.5, 1);
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
  .btn-disabled {
    background-color: #d1d3da !important;
    color: gray;
    cursor: not-allowed;
  }
  .top-details-row{
    border-bottom: 1px solid rgb(228, 228, 228);
    .data-label{
      display: block;
      font-size: 15px;
    }
  }
}
</style>
