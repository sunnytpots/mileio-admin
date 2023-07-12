<template>
  <SectionLayout title="חוקיות" :route-back="{ name: 'settings' }">
    <FormUi
      :form="form"
      ref-prop="checkDelivery"
      url="user/change-sla"
      name="deliveryData"
      @submitted="submitted">
      <v-container>
        <v-row class="row-form" style="justify-content: space-around;" no-gutters>
          <v-col cols="2">
            <v-text-field
              v-model="form.sla"
              type="number"
              label="מספר הימים המירבי לביצוע משימה (SLA)"
              :rules="alphaNumRule"/>
          </v-col>
        </v-row>
      </v-container>
    </FormUi>
  </SectionLayout>
</template>

<script>
export default {
  name: 'SettingsLegality',
  middleware: ['permissions'],

  data () {
    return {
      form: {
        sla: 5
      },
      alphaNumRule: [
        v => !!v || 'שדה חובה',
        v => v > 0 || 'שדה מספרי חיובי גדול מ-0'
      ]
    }
  },
  async created () {
    try {
      this.loading = true
      const response = await this.$userService.getSla()
      this.form.sla = response?.sla
      this.loading = false
    } catch (e) {
      this.loading = false
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    submitted () {
      this.$store.commit('setSnackbar', {
        value: true,
        message: 'SLA עודכן בהצלחה',
        success: true
      })
    }
  },
  head: { title: 'חוקיות' }
}
</script>

<style lang="scss" scoped>
</style>
