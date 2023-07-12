<template>
  <SectionLayout
    title="חיבור לממיינת"
    :route-back="{ name: 'settings' }">
    <v-container>
      <v-layout row wrap justify-center align-center>
        <v-flex md12 xs12>
          <v-checkbox
            v-model="allowSorterConnection"
            color="#fa4616"
            :label="`${allowSorterConnection ? 'כבה' : 'הפעל'} חיבור לממיינת`"/>
        </v-flex>
      </v-layout>

      <div>
        <v-layout row wrap justify-center align-center>
          <v-flex class="pl-2" md1 xs12>
            <p
              style="margin-bottom: 0"
              v-text="'קישור ל-callback:'"/>
          </v-flex>
          <v-flex md8 xs12>
            <v-text-field
              v-model="sorterCallbackUrl"
              label="הקלד כאן את הקישור עבור ה-callback"/>
          </v-flex>
        </v-layout>

        <v-layout
          v-if="disableSaveChanges"
          row
          wrap>
          <v-flex class="ml-16" md2 xs12/>

          <v-flex md8 xs12>
            <p
              style="color: red"
              v-text="'שדה חובה'"/>
          </v-flex>
        </v-layout>

        <v-layout row wrap justify-center align-center>
          <v-flex md1 xs12/>
          <v-flex md8 xs12 style="text-align: center">
            <v-btn
              width="60%"
              class="btn-primary"
              :disabled="disableSaveChanges"
              :loading="loading"
              @click="updateSorterCallbackUrl">
              {{ 'שמור שינויים' }}
            </v-btn>
          </v-flex>

          <v-flex md2 xs12 style="text-align: center">
            <v-btn
              width="60%"
              class="btn-primary"
              :disabled="disableSaveChanges"
              :loading="loading"
              @click="sendSorterCallbacks">
              {{ 'שלח callback' }}
            </v-btn>
          </v-flex>
        </v-layout>
      </div>
    </v-container>
  </SectionLayout>
</template>

<script>

export default {
  name: 'SorterConnection',
  middleware: ['permissions'],

  data () {
    return {
      allowSorterConnection: false,
      loading: false,
      sorterCallbackUrl: ''
    }
  },
  computed: {
    disableSaveChanges () {
      return this.allowSorterConnection && this.sorterCallbackUrl.length < 1
    }
  },
  watch: {},
  async created () {
    try {
      this.loading = true
      const response = await this.$newExitsManagementService.getSorterSettings()
      this.allowSorterConnection = response.allow_sorter_connection
      this.sorterCallbackUrl = response.sorter_callback_url
      this.loading = false
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    async sendSorterCallbacks () {
      try {
        this.loading = true
        await this.$newExitsManagementService.triggerCallbacks()
        this.$store.commit('setSnackbar', {
          value: true,
          message: 'שולח callbacks אחרונים...',
          success: true
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'updateSorterCallbackUrl')
      }
    },
    async updateSorterCallbackUrl () {
      try {
        this.loading = true
        await this.$newExitsManagementService.updateSorterCallbackUrl({
          allow_sorter_connection: this.allowSorterConnection,
          sorter_callback_url: this.sorterCallbackUrl
        })
        this.$store.commit('setSnackbar', {
          value: true,
          message: `חיבור לממיינת ${this.allowSorterConnection ? 'עודכן' : 'כובה'}`,
          success: true
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'updateSorterCallbackUrl')
      }
    }
  },
  head: { title: 'חיבור לממיינת' }
}
</script>

<style lang="scss" scoped>
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

    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}

.form-ui{
  ::v-deep {
    .v-text-field__details{
      display: none;
    }

    .error--text{
      .v-text-field__details{
        display: flex;
      }
    }
  }
}
</style>
