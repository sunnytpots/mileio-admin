<template>
  <div class="export-btn">
    <v-menu offset-y>
      <template v-slot:activator="{ on, attrs }">
        <div :class="['col-2']">
          <v-btn
            depressed
            :class="['white--text', 'btn-gray']"
            :loading="loading"
            v-bind="attrs"
            v-on="on">
            <img src="../../assets/images/icons/export-icon.svg"/>
            <span v-text="title" />
          </v-btn>
        </div>
      </template>

      <v-list>
        <v-list-item
          v-for="(option, index) in options"
          :key="index"
          @click.prevent="handle_function_call(option.schemaType)">
          <v-list-item-icon>
            <v-icon v-text="option.icon" />
          </v-list-item-icon>
          <v-list-item-content>
            <v-list-item-title
              @click="fileExtension = option.fileExtension"
              v-text="option.title"/>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-dialog
      v-model="reportNotify"
      persistent
      max-width="510">
      <CardUi>
        <v-row justify="space-around" no-gutters>
          <v-col style="text-align: center">
            <p
              style="margin: 20px auto 0 auto"
              v-text="`דו''ח ${translatedReportType} כעת בהכנה...`"/>
            <p
              style="margin-bottom: 0"
              v-text="`רשימה מלאה במסך דו''חות`"/>
          </v-col>
        </v-row>

        <v-row justify="space-around" no-gutters>
          <v-col style="display: flex; justify-content: flex-end">
            <v-btn
              class="btn-primary"
              style="margin: 0 0 20px 20px"
              @click="reportNotify = false">
              {{ 'אישור' }}
            </v-btn>
          </v-col>
        </v-row>
      </CardUi>
    </v-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'ExportReport',
  props: {
    reportType: { type: String, require: false, default: null },
    title: { type: String, require: false, default: 'יצוא מסמך' },
    filter: { type: Object, require: false, default: () => ({}) },
    pagination: { type: Object, require: false, default: () => ({}) },
    specificOption: { type: String, require: false, default: null },
    byDriverIds: { type: Array, require: false, default: () => ([]) },
    branchId: { type: Number, require: false, default: null }
  },
  data () {
    return {
      reportNotify: false,
      loading: false,
      items: [],
      resData: [],
      fileExtension: '.csv'
    }
  },
  computed: {
    ...mapState("global", ["driversSelected"]),
    options () {
      let options = []
      if (this.specificOption) {
        options.push({ title: this.specificOption, icon: 'icon-csv', schemaType: 'csv', fileExtension: '.csv' })
      } else {
        options = [
          { title: 'Excel', icon: 'icon-excel', schemaType: 'excel', fileExtension: '.xls' },
          { title: 'CSV', icon: 'icon-csv', schemaType: 'csv', fileExtension: '.csv' }
        ]
      }
      return options
    },
    translatedReportType () {
      switch (this.reportType) {
        case 'deliveries':
          return 'משלוחים'
        case 'distributionPointsList':
          return 'נקודות חלוקה'
        case 'usersSettings':
          return 'הגדרות משתמשים'
        case 'smsMessagesSettings':
          return 'הודעות SMS'
        case 'refunds':
          return 'זיכויים'
        case 'distributionPointBags':
          return 'שקי נקודות חלוקה'
        case 'branches':
          return 'סניפים'
        case 'distributionDeliveriesPoints':
          return 'משלוחי נקודות חלוקה'
        case 'customers':
          return 'לקוחות'
        case 'driversManagement':
          return 'ניהול נהגים'
        case 'drivers':
          return 'נהגים'
        case 'customerBags':
          return 'שקי לקוחות'
        case 'collectionTasks':
          return 'משימות איסוף'
        case 'polygons':
          return 'פוליגונים'
        case 'scans':
          return 'סריקות'
        case 'example':
          return 'מסמך דוגמה'
        default:
          return ''
      }
    }
  },
  created () {
    console.log('ExportBtn this.reportType', this.reportType)
  },
  methods: {
    async handle_function_call (schemaType) {
      try {
        console.log('handle_function_call', schemaType)
        this.loading = true
        if (!this.reportType) {
          return
        }

        const response = await this.$reportsService.addReport({
          ...this.pagination,
          filter: this.filter,
          byDriverIds: this.driversSelected,
          branchId: this.branchId,
          report_type: this.reportType,
          schema_type: schemaType
        })

        this.loading = false

        if (response) {
          this.reportNotify = true
        }
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'handle_function_call')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.format-component {
  width:auto !important;
  cursor: pointer !important;
  pointer-events: none !important;
}
.hidden {
  display: none;
}
</style>
