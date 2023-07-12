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
        <v-row>
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
                clearable
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
                v-if="itemStatus !== 'lost' && !refund.is_refunded"
                class="btn-primary action-btn"
                :loading="loading"
                @click.prevent="refundItem">
                {{ buttonType.name }}
              </v-btn>
              <v-select
                v-if="itemStatus === 'lost'"
                v-model="form.lostValue"
                clearable
                :items="failureList"
                item-text="value"
                item-value="key"
                label="סיבות כשל"/>
            </div>
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
      loading: false,
      refundType: {
        collection: { name: 'חבילה', icon: 'box' },
        dual: { name: 'חבילה', icon: 'box' },
        govaina: { name: 'גוביינא', icon: 'cash' },
        certificate: { name: 'תעודה', icon: 'certificate' }
      },
      itemStatuses: [
        { key: 'תקין', value: 'valid' },
        { key: 'לא תקין', value: 'invalid' },
        { key: 'אבדן', value: 'lost' }
      ],
      failureList: [
        { value: 'חבילה אבדה בדרך', key: 'lost_on_way' },
        { value: 'חבילה לא נמצאה', key: 'delivery_not_found' }
      ],
      verified_govaina_amount: null,
      lostValue: null,
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
        invalid: { name: 'זיכוי פריט', url: 'refunds/add' },
        lost: { name: 'כשל', url: 'refunds/lost' }
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
          console.log('this.$v', this.$v)
          return
        }
        this.form.delivery_id = this.delivery.id
        this.form.refund_id = this.refund.id
        this.form.item_status = this.itemStatus
        this.form.refund_name = this.authUser.first_name + ' ' + this.authUser.last_name
        console.log('call refundItem function', this.form)
        this.loading = true
        const response = await this.$axios.$post(this.buttonType.url, this.form)
        this.refund_date = response?.refund_date
        this.loading = false
        this.refund.is_refunded = true
        // this.$router.push({ name: 'refunds-coordinator' })
        // this.$store.commit('setDrawerUi', false)
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'refundItem')
      }
    },
    async lostItem () {
      console.log('call lostItem function ')
      this.formLostItem.delivery_id = this.delivery.id
      this.formLostItem.refund_id = this.refund.id
      // const params = { item_status: this.itemStatus, delivery_id: this.delivery.id, refund_id: this.refund.id }
      await this.$axios.$post(this.buttonType.url, this.formLostItem)
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
