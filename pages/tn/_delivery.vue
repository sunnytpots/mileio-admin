<template>
  <section>
    <header>
      <n-link to="/" class="logo-img">
        <img :src="customerLogo" alt="">
      </n-link>

      <div class="header-info">
        <p>היי {{ delivery.target_name }},</p>
        <p>כאן אפשר לעקוב אחרי ההזמנה שלך</p>
      </div>
    </header>

    <main>
      <section class="banner-section">
        <img src="../../assets/images/banner1.png" alt="">
        <div class="eta-status">
          <v-progress-circular
            style="z-index: 0;"
            :rotate="90"
            :size="150"
            :width="15"
            :value="value"
            color="#fa4616"
          >
            {{ value }}
          </v-progress-circular>
        </div>
      </section>

      <section class="info-section">
        <div class="row">
          <div class="col-6">
            <div>
              <p>מספר הזמנה</p>
              <p>{{ delivery.barcode }}</p>
            </div>
          </div>
          <div class="col-6">
            <div>
              <p>כתובת:</p>
              <p>{{ delivery.target_address && delivery.target_address.correct_long_street_name + ' ' + delivery.target_address.correct_street_number }}</p>
              <p>{{ delivery.target_address && delivery.target_address.correct_long_city_name }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="driver-section">
        <n-link to="/" class="driver-img">
          <img src="https://cdn.vuetifyjs.com/images/lists/1.jpg" >
        </n-link>
        <div class="driver-info">
          <p v-if="delivery.divisor_driver">השליח שלך</p>
          <p>{{ delivery.divisor_driver ?  delivery.divisor_driver.first_name + ' ' + ' ' + delivery.divisor_driver.last_name : 'טרם נבחר שליח'  }}</p>
        </div>
        <div v-if="delivery.divisor_driver" class="mr-auto wrapper-phone-btn">
          <button class="btn btn-phone">
            <i class="icon icon-plus" />
            חייג לשליח
          </button>
        </div>
      </section>

      <section class="map-section">
        <GoogleMap>
          <GMapMarkerIO :position="position" icon="user" />
        </GoogleMap>
      </section>

      <section class="delivery-section">
        <div class="action-btn" v-for="(action, index) of actions" :key="index" @click.prevent="onAction(action.key)">
          <i :class="`icon icon-${action.icon}`" />
          <p class="caption">{{ action.text }}</p>
        </div>

      </section>
    </main>

    <footer>
      <div style="text-align: center">
        <p>
          המערכת מנוהלת ע"י
        </p>
      </div>
    </footer>
    <DialogUi v-model="dialog" sm>
      <h1>Hello</h1>
    </DialogUi>
  </section>
</template>

<script>
export default {
  name: 'DeliveryWebsite',

  layout: 'website',

  data () {
    return {
      dialog: false,
      delivery: {},
      customerLogo: {},
      value: 0,
      position: { lat: 32.41471663972185, lng: 35.18578241341798 },
      actions: [
        {
          key: 'send_notice',
          text: 'שלח לי התראה',
          icon: 'bell-black'
        },
        {
          key: 'change_delivery_time',
          text: 'שינוי זמן אספקה',
          icon: 'time'
        },
        {
          key: 'change_address',
          text: 'שינוי כתובת למשלוח',
          icon: 'address'
        },
        {
          key: 'delivery_position',
          text: 'השארת חבילה במקום מוסכם',
          icon: 'box_2'
        }
      ]
    }
  },

  mounted () {
    this.interval = setInterval(() => {
      if (this.value === 100) {
        return (this.value = 0)
      }
      this.value += 10
    }, 1000)
  },

  async created () {
    try {
      const res = await this.$deliveryService.viewDeliveries({ delivery_uid: this.$route.params.delivery })
      if (res?.results?.status === 'error') {
        // todo: throw page not found
        alert(res.results.description)
        return
      }
      this.delivery = res
      if (this.delivery.customer.customer_logo) {
        this.customerLogo = this.delivery.customer.customer_logo
      }
      console.log('delivery res', res)
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    onAction (actionKey) {
      this.dialog = true
    }
  }
}
</script>

<style lang="scss" scoped>
header{
  display: flex;
  padding: 1rem;
  height: 79px;

  p {
    margin-bottom: 0;
  }

  outline: 1px solid white;
}
.logo-img{
  display: flex;
  width: 85px;
  height: 85px;
  border-radius: 60px;
  margin-left: 1rem;
  box-shadow: 4px 3px 11px 3px #00000059;
  z-index: 0;

  img {
    width: 100%;
    border-radius: 50% 50%;
  }
}

.driver-img{
  display: flex;
  width: 65px;
  height: 65px;
  border-radius: 60px;
  margin-left: 1rem;

  img {
    width: 100%;
    border-radius: 50% 50%;
  }
}
.info-section {
  text-align: center;
  padding: 50px 15px 0;

  p {
    margin-bottom: 0;
  }

  & > .row  > .col-6 {
    &:first-child{
      border-left: 1px solid #bfb4b4;
    }
  }
}

.comment {
  text-align: center;
  padding: 15px;
  border-top: 1px solid #bfb4b4;
  border-bottom: 1px solid #bfb4b4;
}
.banner-section {
  img {
    width: 100%;
  }
}

.wrapper-phone-btn {
  width: 8rem;
  .btn-phone{
    height: 54px;
    width: 100%;
    padding: 0;
    background-color: black;
    color: #fff;
    //border-radius: 50px;
  }
}

.driver-section {
  display: flex;
  /* justify-content: space-around; */
  padding: 15px 15px 0;
  margin-top: 15px;
  background-color: #e8e4e4;
  align-items: center;

  .driver-info {
    margin: 0;
  }

  p {
    margin-bottom: 0;
  }
}

.delivery-section {
  display: flex;
  /* justify-content: space-around; */
  padding: 25px 15px 15px;
  background-color: #e8e4e4;
  align-items: center;
  justify-content: space-between;

  .driver-info {
    margin: 0;
  }

  .action-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  p {
    margin-bottom: 0;
    font-size: 15px !important;
  }

  & > .action-btn {
    & {
      border-left: 1px solid #bfb4b4;
    }
  }
}

.eta-status{
    width: 180px;
    height: 180px;
    display: flex;
    background: #ececec;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    opacity: .5;
    text-align: center;
    margin-top: -70px;
    margin-left: auto ;
    margin-right: auto ;
}

.map-section {
  .google-map[data-v-6e9f7a85] {
    width: 100%;
    height: 400px !important;
  }
}

</style>
