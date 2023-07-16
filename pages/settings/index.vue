<template>
  <SectionLayout title="הגדרות">
    <CardUi padding-body>
      <v-row>
        <v-col
          v-for="(link, index) of linksFiltered"
          :key="index"
          md="3"
          sm="12"
          class="settings-container"
          @click.prevent="settingsClick(link)">
          <a
            href="#"
            class="settings-card">
            <div class="icon-wrapper">
              <i :class="['icon', link.icon]" />
            </div>

            <div class="text">
              <h3 v-text="link.name" />
              <p v-text="link.desc" />
            </div>
          </a>
        </v-col>
      </v-row>
    </CardUi>

    <v-dialog
      v-model="satisfactionDialog"
      content-class="satisfaction-dialog"
      max-width="510"
      light>
      <v-card>
        <FormUi
          :form="satisfactionForm"
          ref-prop="checkQuestion"
          url="target-satisfaction/add-question"
          btn-text="הוסף"
          @submitted="getSatisfactionQuestions">
          <v-text-field
            v-model="satisfactionForm.question"
            label="הוסף שאלה"
            :rules="satisfactionQuestionRules"/>
        </FormUi>
        <v-data-table
          :headers="satisfactionHeader"
          :items="targetQuestions"
          item-key="id"
          class="elevation-1"
          :loading="loading"
          loading-text="טוען מידע, אנא המתן..."
          hide-default-footer>
          <template v-slot:no-data>
            <p v-text="'אין מידע.'"/>
          </template>

          <template v-slot:item.delete="{ item }">
            <DeleteButton
              :url="`target-satisfaction/${item.id}`"
              warning-message="מחיקה של שאלת משוב תשנה את הממוצע עבור המשובים שהוזנו, האם אתה בטוח שברצונך לבצע פעולה זו?"
              has-warning
              @deleted="getSatisfactionQuestions"/>
          </template>
        </v-data-table>
      </v-card>
    </v-dialog>

    <v-dialog
      v-model="timingDialog"
      content-class="timing-dialog"
      persistent
      max-width="510">
      <v-card>
        <FormUi
          :form="timingForm"
          url="user/change-timing-connection-option"
          btn-text="אישור"
          :disabled-confirm="loading"
          cancel-btn
          class="timing-form"
          @cancel-submission="timingDialog = false"
          @submitted="timingDialog = false">
          <v-select
            v-model="timingForm.allow_timing_communication"
            :items="timingOptions"
            label="בחר/י האם לאפשר סידור מסלול אוטומטי"
            item-text="title"
            item-value="slug"/>
        </FormUi>
        <v-row class="release-drivers-container">
          <v-col>
            <v-btn
              :loading="loading"
              @click="releaseDrivers">
              שחרור נהגים מהמתנה
            </v-btn>
          </v-col>
        </v-row>
      </v-card>
    </v-dialog>

    <DialogUi v-model="printDialog" sm>
      <FormUi
        :form="printForm"
        url="auth/change-print-type"
        btn-text="אישור"
        @submitted="onReload">
        <v-select
          v-model="printForm.print_type"
          :items="printTypes"
          label="הדפסת מדבקה"
          item-text="title"
          item-value="slug"/>
      </FormUi>
    </DialogUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'
export default {
  name: 'Settings',
  middleware: ['permissions'],

  data () {
    return {
      satisfactionQuestionRules: [
        v => !!v || 'שדה חובה'
      ],
      targetQuestions: [],
      loading: false,
      satisfactionDialog: false,
      timingDialog: false,
      printDialog: false,
      allowTimingCommunication: true,
      printTypes: [],
      timingOptions: [{
        slug: true,
        title: 'לאפשר'
      }, {
        slug: false,
        title: 'לא לאפשר'
      }],
      satisfactionForm: {
        question: null
      },
      printForm: {
        print_type: 'a4'
      },
      timingForm: {
        allow_timing_communication: true
      },
      links: [
        {
          name: 'פוליגונים',
          desc: 'ניהול איזורי חלוקה',
          icon: 'icon-polygons',
          key: 'settings-polygons',
          to: { name: 'settings-polygons' }
        }, {
          name: 'סניפים',
          desc: 'ניהול ויצירת סניפים',
          icon: 'icon-branches',
          key: 'settings-branches',
          to: { name: 'settings-branches' }
        }, {
          name: 'הודעות SMS',
          desc: 'ניהול ויצירת הודעות SMS',
          icon: 'icon-sms',
          key: 'settings-sms-messages',
          to: { name: 'settings-sms-messages' }
        }, {
          name: 'חוקיות',
          desc: 'קביעת חוקיות במערכת המאפשרת התראות והתנהגות',
          icon: 'icon-settings',
          key: 'settings-legality',
          to: { name: 'settings-legality' }
        }, {
          name: 'משתמשים',
          desc: 'יצירה ניהול ומתן הרשאות',
          icon: 'icon-users',
          key: 'settings-users',
          to: { name: 'settings-users' }
        }, {
          name: 'רמות משתמשים',
          desc: '',
          icon: 'icon-users',
          key: 'settings-levels',
          to: { name: 'settings-levels' }
        }, {
          name: 'ניהול יציאות ממיינת ישנה',
          desc: '',
          icon: 'icon-settings',
          key: 'settings-exits-managements-old-sorter',
          to: { name: 'settings-exits-managements-old-sorter' }
        }, {
          name: 'ניהול יציאות ממיינת חדשה',
          desc: '',
          icon: 'icon-settings',
          key: 'settings-exits-managements-new-sorter',
          to: { name: 'settings-exits-managements-new-sorter' }
        }, {
          name: 'חיבור לממיינת',
          desc: '',
          icon: 'icon-billing',
          key: 'settings-exits-managements-sorter-connection',
          to: { name: 'settings-exits-managements-sorter-connection' }
        }, {
          name: 'הרשאות',
          desc: '',
          icon: 'icon-billing',
          key: 'settings-permissions',
          to: { name: 'settings-permissions' }
        }, {
          name: 'לקוחות',
          desc: 'ניהול ויצירת לקוחות במערכת',
          icon: 'icon-people',
          key: 'settings-customers',
          to: { name: 'settings-customers' }
        }, {
          name: 'תשלומים וחיובים',
          desc: 'הגדרות ניהול וייצוא חשבונות ותשלומים',
          icon: 'icon-dashboard',
          key: 'settings-payments-charges',
          to: { name: 'settings-payments-charges-customers' }
        }, {
          name: 'התקשרות לטיימינג',
          desc: 'ניהול ההתקשרות לטיימינג',
          icon: 'icon-api',
          key: 'settings-timing-api',
          // to: { name: 'settings-api' },
          action: () => {
            this.timingDialog = true
          }
        }, {
          name: 'TA-BOX',
          desc: 'ניהול והוספת TA-BOX',
          icon: 'icon-dashboard',
          key: 'settings-distribution-points',
          to: { name: 'settings-distribution-points' }
        }, {
          name: 'שיוכים',
          desc: 'יצירת וניהול שיוכים במערכת',
          icon: 'icon-dashboard',
          key: 'settings-associations',
          to: { name: 'settings-associations' }
        }, {
          name: 'מחירונים',
          desc: 'ניהול והוספת מחירוני נהגים ולקוחות',
          icon: 'icon-dashboard',
          key: 'settings-pricing',
          to: { name: 'settings-pricing-customer' }
        }, {
          name: 'הגדרת מדפסת',
          desc: 'הגדרת סוג המדפסת',
          icon: 'icon-dashboard',
          key: 'settings-print',
          action: () => {
            this.printDialog = true
          }
        }, {
          name: 'סיבות כשל',
          desc: 'הגדרת סיבות כשל שיהיה ניתן להגדיר עבור משלוח שנכשל',
          icon: 'icon-dashboard',
          key: 'settings-causes-failures',
          to: { name: 'settings-causes-failures' }
        }, {
          name: 'שביעות רצון',
          desc: 'ניהול מאגר שאלות עבור שביעות רצון נמענים',
          icon: 'icon-people',
          key: 'settings-satisfaction',
          action: () => {
            this.satisfactionDialog = true
          }
        }, {
          name: 'לוג שגיאות',
          desc: 'מכיל את מאגר השגיאות שהצטברו',
          icon: 'icon-people',
          key: 'settings-failure-logs',
          to: { name: 'settings-failure-logs' }
        }, {
          name: 'מחיקת משלוחים',
          desc: 'כאן ניתן למחוק משלוחים וכל המידע השייך להם',
          icon: 'icon-people',
          key: 'settings-deliveries-deletion',
          to: { name: 'settings-deliveries-deletion' }
        }, {
          name: 'שיוך קווים ידני',
          desc: 'שיוך קווים ידני',
          icon: 'icon-people',
          key: 'settings-manual-polyline-associate',
          to: { name: 'settings-manual-polyline-associate' }
        }, {
          name: 'ניהול תגיות',
          desc: 'ניהול תגיות',
          icon: 'icon-people',
          key: 'settings-tags-management',
          to: { name: 'settings-tags-management' }
        },
        {
          name: "ניהול עמודות משתמש",
          desc: "",
          icon: "icon-users",
          key: "settings-column-management",
          to: { name: "settings-column-management" }
        }
      ]
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),

    satisfactionHeader () {
      const arr = [
        { text: 'תוכן שאלה', align: 'center', value: 'question' },
        { text: 'מחיקה', align: 'center', value: 'delete', sortable: false }
      ]
      return arr
    },
    linksFiltered () {
      return this.links.filter(link => this.$hasPermission(link.key))
    }
  },
  async created () {
    try {
      this.printTypes = await this.$authService.getPrintTypes()
      this.allowTimingCommunication = await this.$userService.getTimingCommunicationPermission()
      this.targetQuestions = await this.$targetSatisfactionService.viewQuestions()
      if (this.authUser) {
        this.printForm.print_type = this.authUser.print_type.toLowerCase()
      }
      this.timingForm.allow_timing_communication = this.allowTimingCommunication === 1
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    async getSatisfactionQuestions () {
      try {
        this.satisfactionDialog = false
        this.satisfactionForm.question = null
        this.targetQuestions = await this.$targetSatisfactionService.viewQuestions()
      } catch (e) {
        this.$helper.snackbar(e, 'getSatisfactionQuestions')
      }
    },
    async releaseDrivers () {
      try {
        this.loading = true
        await this.$authService.releaseDriversApprovals()
        this.loading = false
        this.timingDialog = false
      } catch (e) {
        this.timingDialog = false
        console.log('releaseDrivers error', e)
        const errorMsg = e?.response?.data?.message
        this.$store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
      }
    },
    settingsClick (link) {
      if (link.to) {
        this.$router.push(link.to)
      }

      if (link.action) {
        link.action()
      }
    },

    onReload () {
      location.reload()
    }
  },
  head: { title: 'הגדרות' }
}
</script>

<style lang="scss" scoped>
.timing-dialog, .satisfaction-dialog {
  background-color: #ffffff;
  height: auto;
  .timing-form {
    text-align: left;
  }
  .release-drivers-container {
    text-align: left;
    background-color: gray;
    margin: 0 !important;
  }
}

.settings-card{
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
  text-decoration: none;

  .icon-wrapper {
    width: 56px;
    height: 56px;
    margin-left: .6rem;
    background-color: #F0F0F0;

    i {
      width: 28px;
      height: 24px;
    }
  }

  h3{
    color: #38A8CD;
    margin: 0 0 .25rem;
  }
  p{
    color: #6A6F76;
    margin-bottom: 0;
    font-size: .8rem;
  }
}

.settings-container:hover {
  background-color: #efeeee;
  cursor: pointer;
  transform: scale(1.05);
}

.settings-container {
  transition: all .2s ease-in-out;
}
</style>
