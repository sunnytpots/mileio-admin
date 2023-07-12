<template>
  <div>
    <v-row class="top-details-row">
      <v-col class="top-details-col">
        <span>שם נהג</span>
        <span class="data-label">{{ refund.driver ? refund.driver.first_name + ' ' + refund.driver.last_name : 'אין נהג' }}</span>
      </v-col>
      <v-col class="top-details-col">
        <span>ברקוד</span>
        <span class="data-label">{{ delivery.barcode }}</span>
      </v-col>
      <v-col class="top-details-col">
        <span>מספר לקוח</span>
        <span class="data-label">{{ delivery.customer.customer_number }}</span>
      </v-col>
      <v-col class="top-details-col">
        <span>תאריך זיכוי</span>
        <span v-if="refund_date" class="data-label">{{ refund_date | formatDate }}</span>
      </v-col>
    </v-row>
    <v-card outlined class="card">
      <v-container>
        <v-row style="max-height: 130px">
          <v-col>
            <v-row>
              <v-col>
                <i :class="`icon icon-${(refundType[delivery.delivery_type.name] && refundType[delivery.delivery_type.name].icon) || 'box'} refunds-icon`" />
              </v-col>
              <v-col>
                <div class="refunds-cols">
                  <span>סוג</span>
                  <span class="data-label">{{ delivery.delivery_type.value }}</span>
                </div>
              </v-col>
            </v-row>
          </v-col>
          <v-col>
            <v-select
              v-if="refund['sum']"
              v-text="`סכום מצופה: ${refund['sum']}`"/>
            <div :class="['refunds-cols', { 'refunds-govaina-cols': delivery.delivery_type.name === 'govaina' }]" >
              <v-text-field
                v-if="itemStatus === 'valid' && delivery.delivery_type.name === 'govaina'"
                v-model.number="form.verified_govaina_amount"
                type="number"
                class="govaina-field"
                :disabled="refund.is_refunded"
                label="אימות סכום שהתקבל"
                :error-messages="$v.$dirty && $v.form.verified_govaina_amount.$invalid && 'נדרש סכום בגובה לפחות מהסכום המצופה' || ''"/>
              <v-select
                v-model="itemStatus"
                class="select-ui"
                filled
                rounded
                :disabled="refund.is_refunded"
                :items="itemStatuses"
                item-text="key"
                item-value="value"
                label="מצב פריט">
                <template v-slot:append>
                  <i class="icon icon-arrowSelect"/>
                </template>
              </v-select>
            </div>
          </v-col>
          <v-col >
            <div class="refunds-cols">
              <span v-if="refund.is_refunded" class="item-refunded-label">
                פריט זוכה
              </span>
              <v-btn
                v-if="!refund.is_refunded"
                class="btn-primary action-btn"
                :disabled="itemStatus === 'lost' && !form.error_key"
                :loading="loading"
                @click.prevent="refundItem">
                {{ buttonType.name }}
              </v-btn>
            </div>
          </v-col>
        </v-row>

        <v-row style="justify-content: center; margin-top: 0">
          <v-col cols="4">
            <v-text-field
              v-if="itemStatus === 'invalid'"
              v-model="reasonMessage"
              type="text"
              class="input-ui input-ui-append-inner"
              dense
              rounded
              filled
              label="אנא הזן סיבה"/>
            <v-select
              v-else-if="itemStatus === 'lost'"
              v-model="form.error_key"
              class="select-ui"
              :items="failureList"
              item-text="value"
              item-value="key"
              clearable
              rounded
              filled
              label="סיבת כשל"/>
          </v-col>
        </v-row>
      </v-container>
    </v-card>

  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'RefundsCoordinatorRefund',
  props: {
    delivery: { type: Object, default: () => ({}) },
    refund: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      reasonMessage: null,
      loading: false,
      refundType: {
        collection: { name: 'חבילה', icon: 'box' },
        dual: { name: 'חבילה', icon: 'box' },
        govaina: { name: 'גוביינא', icon: 'cash' },
        certificate: { name: 'תעודה', icon: 'certificate' }
      },
      itemStatuses: [
        { key: 'תקין', value: 'valid' },
        // { key: 'לא תקין', value: 'invalid' },
        { key: 'אבדן', value: 'lost' }
      ],
      failureList: [
        { value: 'חבילה אבדה בדרך', key: 'delivery-lost' },
        { value: 'חבילה לא נמצאה', key: 'delivery-not-found' }
      ],
      verified_govaina_amount: null,
      error_key: null,
      itemStatus: 'valid',
      form: {
        delivery_id: null,
        item_status: null,
        refund_id: null,
        verified_govaina_amount: null,
        refund_name: null
      },
      formLostItem: {
        delivery_id: null,
        refund_id: null
      }
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),

    buttonType () {
      const urls = {
        valid: { name: 'זיכוי פריט', url: 'refunds/add' },
        // invalid: { name: 'זיכוי פריט', url: 'refunds/add' },
        lost: { name: 'שמור', url: 'refunds/lost' }
      }
      return urls[this.itemStatus]
    }
  },
  created () {
    console.log('refund', this.refund)
    this.form.verified_govaina_amount = this.refund.verified_govaina_amount
    this.itemStatus = this.refund.item_status ? this.refund.item_status : this.itemStatus
    this.refund_date = this.refund?.refund_date
  },
  methods: {
    async refundItem () {
      try {
        this.$v.$touch()
        if (this.$v.$error) {
          return console.log('this.$v', this.$v)
        }

        this.form = {
          ...this.form,
          delivery_id: this.delivery.id,
          refund_id: this.refund.id,
          item_status: this.itemStatus,
          refund_name: this.authUser.first_name + ' ' + this.authUser.last_name
        }

        if (this.form.item_status === 'invalid') {
          Object.assign(this.form, { invalid_reason: this.reasonMessage })
        }

        this.loading = true
        const response = await this.$axios.$post(this.buttonType.url, this.form)
        this.loading = false

        if (this.itemStatus === 'lost') {
          return this.$store.commit('setSnackbar',
            { value: true, message: 'סיבת כשל נשמרה בהצלחה', success: true })
        }

        this.refund_date = response?.refund_date
        this.refund.is_refunded = true
        return this.$emit('open-preview-print-sticker')
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'refundItem')
      }
    }
  },
  validations: {
    form: {
      verified_govaina_amount: {
        required (value) {
          if (this.delivery?.delivery_type?.name !== 'govaina') {
            return true
          } else if (Number(this.refund['sum']) <= value) {
            return true
          }
          return false
        }
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.top-details-col {
  border-left: 1px solid #e4e4e4;
  text-align: center;
}
.action-btn{
  width: 200px;
  margin: 15px auto;
}
.refunds-icon{
  margin: 45px auto;
  width: 65px;
  height: 65px;
}
.refunds-cols{
  margin: 50px auto;
  display: grid;
}
.refunds-govaina-cols{
  display: flex;
  justify-content: space-between;
  .govaina-field{
    margin-right: 8px;
    margin-left: 8px
  }
}
.top-details-row{
  border-bottom: 1px solid rgb(228, 228, 228);
.data-label{
  display: block;
  font-size: 15px;
}
}
.card{
  border-radius: 10px;
  margin-top: 25px;
  background: #ffffff;
  //height: 160px;
  overflow: hidden;

  //position: static;
}
.item-refunded-label{
  display: block;
  padding: 0px 34px 0px 26px;
  margin: 0;
  background-color: #ff3366;
  color: #fff;
  border-radius: 4px;
  text-align: center;
  position: absolute;
  top: 13px;
  left: -26px;
  transform: rotate(-40deg);
  font-size: small;
}

</style>
