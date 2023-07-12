<template>
  <section class="statistics-report-bar-ui">
    <div class="deliveries-report-container">
      <div v-if="deploymentLoading" class="loading-block">
        <v-progress-circular indeterminate color="#fa4616" size="60"/>
      </div>
      <div v-else class="deliveries-report">
        <h5>פריסת משלוחים לפי ערים</h5>
        <div class="table">
          <div class="header-row">
            <span>עיר</span>
            <span>מס משלוחים</span>
            <span>חוזרים</span>
            <span>חדשים</span>
            <span>שביעות רצון</span>
          </div>
          <div v-for="(deployment, idx) in deployments" :key="idx" class="row1">
            <span class="city">
              {{ deployment.correct_long_city_name && deployment.correct_long_city_name.substring(0, 13) }}
            </span>
            <span class="deliveries">
              {{ deployment.amount }}
            </span>
            <span class="returns">
              {{ deployment.existed }}
            </span>
            <span class="news">
              {{ deployment.amount - deployment.existed }}
            </span>
            <span class="rate" :style="{'background-color': bgColor(deployment.rate)}">
              {{ deployment.rate || 0 }}
            </span>
          </div>
        </div>
        <a href="#">צפייה בדו"ח המלא</a>
      </div>
    </div>

    <div class="invoices-report">
      <h5>חשבוניות ותשלומים</h5>

      <div v-for="invoice in activities.months" :key="invoice.id" class="block-drop">
        <div v-if="false" class="block">
          <div class="block-right">
            <i
              v-if="isInvoiceDrop && invoice.id === openInvoiceId"
              class="icon icon-close-circle-green"
              @click="onInvoiceClicked(invoice.id)" />
            <i
              v-else
              class="icon icon-plus-circle-green"
              @click="onInvoiceClicked(invoice.id)" />
            <span>{{ invoice.date }}</span>
          </div>
          <div class="block-left">
            <span class="currency">₪</span>
            <span class="shkalim">{{ shkalim(invoice.price) }}</span>
            <span class="agorot">{{ agorot(invoice.price) }}</span>
          </div>
        </div>
        <div v-if="isInvoiceDrop && invoice.id === openInvoiceId" class="drop">
          <a class="download-doc" href="#">לכל החשבוניות</a>
          <div class="table">
            <div class="row1">
              <span>מוצר</span>
              <span>מחיר ליח'</span>
              <span>כמות</span>
              <span>סה"כ</span>
            </div>
            <div class="row1">
              <span>פתיחת מסוף בשבא</span>
              <span>195.00</span>
              <span>1</span>
              <span>55.00</span>
            </div>
            <div class="row1">
              <span>פתיחת מסוף בשבא</span>
              <span>195.00</span>
              <span>1</span>
              <span>55.00</span>
            </div>
            <div class="row1">
              <span>פתיחת מסוף בשבא</span>
              <span>195.00</span>
              <span>1</span>
              <span>55.00</span>
            </div>
            <div class="row1">
              <span>פתיחת מסוף בשבא</span>
              <span>195.00</span>
              <span>1</span>
              <span>55.00</span>
            </div>
          </div>
        </div>
      </div>
      <a href="#">לכל החשבוניות</a>
    </div>

    <div class="actions-report-container">
      <div v-if="activitiesLoading" class="loading-block">
        <v-progress-circular indeterminate color="#fa4616" size="60"/>
      </div>
      <div v-else class="actions-report">
        <div class="block-upper">
          <div class="upper-right">
            <h5>היקף פעילות</h5>
            <h6>בהשוואה לתקופה מקבילה ({{ new Date().getFullYear()-1 }})</h6>
          </div>

          <div class="upper-left">
            <span :style="{color: activities.activity_change > 0 ? '#34C05B' : '#F25656'}">
              {{ activities.activity_change > 0 ? activities.activity_change : (activities.activity_change * (-1)) }}%
            </span>
            <i v-if="activities.activity_change > 0 " class="icon icon-arrow-up" />
            <i v-else class="icon icon-arrow-down" />
          </div>
        </div>

        <div class="block-lower">
          <h5>פעילות לפי חודשים</h5>
          <div class="graph">
            <div v-for="(monthActivity, index) in activities.activities_per_month" :key="index" class="month">
              <span>{{ monthActivity.activity }}</span>
              <div
                class="progress1"
                :style="{
                  height : ((monthActivity.activity / activities.max_activity) * 200) + 'px',
                  backgroundColor: monthActivity.activity === activities.max_activity ? '#34C05B' : '#FA4616',
                  marginTop: activities.max_activity > 0 ? 0 : 200 + 'px'}"/>
              <span>{{ getMonthName(monthActivity.month) }}</span>
            </div>
          </div>
        </div>
        <a href="#">צפייה בדו"ח המלא</a>
      </div>
    </div>
  </section>
</template>

<script>
export default {
  name: 'StatisticsReportbarUi',
  props: {
    deployments: { type: Array, required: true },
    activities: { type: Object, required: true },
    activitiesLoading: { type: Boolean, default: false },
    deploymentLoading: { type: Boolean, default: false }
  },
  data () {
    return {
      isInvoiceDrop: false,
      openInvoiceId: null
    }
  },
  computed: {
    maxActivity () {
      return 0
    }
  },
  methods: {
    getMonthName (monthNumber) {
      const months = [
        'ינואר',
        'פברואר',
        'מרץ',
        'אפריל',
        'מאי',
        'יוני',
        'יולי',
        'אוגוסט',
        'ספטמבר',
        'אוקטובר',
        'נובמבר',
        'דצמבר'
      ]

      if (!(monthNumber > 0 && monthNumber < 13)) {
        return 'לא מוגדר'
      }

      return months[monthNumber - 1]
    },
    bgColor (rate) {
      return rate > 3 ? '#34C05B' : rate > 2 ? '#FF9303' : '#F25656'
    },
    onInvoiceClicked (id) {
      this.openInvoiceId = id
      this.isInvoiceDrop = !this.isInvoiceDrop
    },
    shkalim (price) {
      price = price.toFixed(2)
      return price.substring(0, price.length - 2)
    },
    agorot (price) {
      price = price.toFixed(2)
      return price.substring(price.length - 2, price.length)
    }
  }
}
</script>

<style scoped lang="scss">
.statistics-report-bar-ui {
  margin-top: 20px;
  display: flex;
  gap: 20px;

  .deliveries-report-container {
    width: 478px;
    background-color: white;

    .deliveries-report {
      display: flex;
      flex-direction: column;

      h5 {
        font-family: 'Rubik';
        font-weight: 400;
        line-height: 22px;
        margin-right: 25px;
        margin-top: 30px;
        font-size: 22px;
        color: #6D7A84;
      }

      .table {
        padding: 20px;
        flex: 1;

        .row1 {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          font-size: 14px;
          line-height: 14px;
          font-weight: 400;
          border-bottom: 1px solid #E3E6E9;
          font-family: 'Rubik';
          padding-top: 15px;
          padding-bottom: 10px;
          text-align: center;

          :first-child {
            text-align: right;
          }

          .rate {
            color: white;
            border-radius: 8px;
            width: 32px;
            height: 18px;
            margin: 0 auto;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 9px 5px 6px 6px;
          }
        }

        .header-row {
          display: flex;
          text-align: center;
          font-size: 14px;
          line-height: 14px;
          font-weight: 400;
          border-bottom: 1px solid #E3E6E9;
          font-family: 'Rubik';
          padding-bottom: 10px;
          color: #6D7A84;

          :first-child {
            text-align: right;
          }

          span {
            flex: 1;
          }
        }
      }

      a {
        padding-right: 20px;
        padding-bottom: 5px;
        color: #34C05B;
      }
    }
  }

  .invoices-report {
    font-family: Rubik;
    width: 621px;
    max-height: 558px;
    background-color: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;

    h5 {
      font-family: 'Rubik';
      font-weight: 400;
      line-height: 22px;
      margin-right: 25px;
      margin-top: 30px;
      font-size: 22px;
      color: #6D7A84;
    }

    a {
      padding-right: 20px;
      padding-bottom: 5px;
      color: #34C05B;
    }

    .block-drop {
      .block {
        background-color: #FAFBFB;
        width: 581px;
        height: 90px;
        border: 1px solid #E3E6E9;
        border-radius: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-right: 40px;
        margin: 20px auto;

        .block-left {
          direction: ltr;
          margin-left: 10px;

          span {
            font-family: 'Rubik';
            font-weight: 400;
            font-size: 37px;
            line-height: 44px;
          }

          .currency {
            font-size: 25px;
          }

          .agorot {
            font-size: 20px;
          }
        }

        .block-right {
          display: flex;
          align-items: center;
          gap: 20px;

          .icon {
            cursor: pointer;
          }

          span {
            font-family: 'Rubik';
            font-weight: 500;
            font-size: 20px;
            line-height: 24px;
          }
        }
      }

      .drop {
        height: 281px;
        width: 581px;
        border: 1px solid #E3E6E9;
        border-radius: 0px 0px 6px 6px;
        background-color: #FAFBFB;
        margin: 0 auto;
        margin-top: -25px;
        border-top: none;

        .download-doc {
        }

        .table {
          padding: 30px 30px 17px 30px;
          font-family: 'Rubik';

          .row1 {
            :first-child {
              font-weight: 500;
              font-size: 18px;
              line-height: 18px;
            }

            display: grid;
            grid-template-columns: 3fr 1fr 1fr 1fr;
            font-weight: 400;
            font-size: 16px;
            line-height: 16px;
            border-bottom: 1px solid #E3E6E9;
            padding-top: 15px;
            padding-bottom: 10px;
            text-align: center;

            :first-child {
              text-align: right;
            }
          }
        }
      }
    }
  }

  .actions-report-container {
    width: 397px;
    background-color: white;
    justify-content: space-between;

    .actions-report {
      display: flex;
      flex-direction: column;
      height: 100%;

      h5 {
        font-family: 'Rubik';
        font-weight: 400;
        line-height: 22px;
        margin-right: 25px;
        margin-top: 30px;
        font-size: 22px;
        color: #6D7A84;
      }

      h6 {
        font-family: 'Rubik';
        font-weight: 400;
        line-height: 14px;
        margin-right: 25px;
        margin-top: 5px;
        font-size: 14px;
        color: #6D7A84;
      }

      a {
        padding-right: 36px;
        color: #34C05B;
      }

      .block-upper {
        display: flex;
        flex: 1;
        justify-content: space-between;
        align-items: flex-start;

        .upper-left {
          font-family: 'Rubik';
          font-weight: 500;
          font-size: 41px;
          line-height: 41px;
          margin-top: 30px;
          margin-left: 27px;
          display: flex;
          align-items: center;
        }
      }

      .block-lower {
        flex: 6;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
      }

      .graph {
        margin-top: 16px;
        display: flex;
        justify-content: space-evenly;

        .month {
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: center;
          gap: 10px;

          :first-child {
            font-family: 'Rubik';
            font-weight: bold;
            font-size: 14px;
            line-height: 14px;
          }

          span {
            font-family: 'Rubik';
            font-weight: 400;
            font-size: 14px;
            line-height: 14px;
          }

          .progress1 {
            width: 25px;
            border-radius: 8px;
          }
        }
      }
    }
  }

  .deliveries-report,
  .invoices-report,
  .actions-report-container {
    height: 450px;
  }
}
.loading-block {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 310px;
}
</style>
