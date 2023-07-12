<template>
  <SectionLayout title="סיבת כשל" :route-back="{ name: 'settings-causes-failures' }">
    <CardUi>
      <v-data-table
        :items="causesFailures"
        :headers="headers"
        :loading="loading"
        :footer-props="footerProps">
        <template v-slot:item.actions="{ item }">
          <div v-if="$hasPermission('settings-causes-failures', 'edit')" class="options">
            <v-btn class="btn-secondary btn-edit" @click.prevent="editData(item)">
              <i class="icon icon-pen" />
            </v-btn>

            <DeleteButton
              :url="`causes-failures/${item.uuid}`"
              has-warning
              @deleted="getData" />
          </div>
        </template>
      </v-data-table>
    </CardUi>

    <DialogUi v-model="drawerUi" sm>
      <FormUi
        :form="form"
        ref-prop="cause-failure"
        :url="causesFailureUid ? `causes-failures/${causesFailureUid}` : 'causes-failures'"
        btn-text="אישור"
        @submitted="getData">
        <v-text-field
          v-model="form.value"
          label="סיבת כשל"
          :rules="failureRules"/>
        <v-text-field
          v-model="form.key"
          label="מפתח"
          :rules="failureRules"/>
      </FormUi>
    </DialogUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'SettingsCausesFailures',
  middleware: ['permissions'],

  async asyncData ({ $causesFailuresService, $helper }) {
    try {
      const causesFailures = await $causesFailuresService.viewFailures()
      return { causesFailures }
    } catch (e) {
      $helper.snackbar(e, 'asyncData')
    }
  },
  data () {
    return {
      valid: true,
      loading: false,
      causesFailures: [],
      causesFailureUid: null,
      form: {
        value: '',
        key: ''
      },
      failureRules: [
        v => !!v || 'שדה חובה'
      ]
    }
  },
  computed: {
    ...mapState('global', ['footerProps']),

    headers () {
      const arr = [
        { text: 'סיבת כשל', align: 'center', value: 'value' },
        { text: 'מפתח', align: 'center', value: 'key' },
        { text: 'פעולות', align: 'center', value: 'actions' }
      ]
      return arr
    },
    drawerUi: {
      get () {
        return this.$store.state.drawerUi
      },
      set (value) {
        if (!value) {
          this.form.value = ''
          this.form.key = ''
          this.causesFailureUid = null
        }

        this.$store.commit('setDrawerUi', value)
      }
    }
  },
  methods: {
    editData (causesFailure) {
      this.causesFailureUid = causesFailure.uuid
      this.form.value = causesFailure.value
      this.form.key = causesFailure.key
      this.drawerUi = true
    },

    async getData (response) {
      try {
        if (response.status) {
          this.causesFailures = await this.$causesFailuresService.viewFailures()
          this.drawerUi = false
        }
      } catch (e) {
        this.$helper.snackbar(e, 'getData')
      }
    }
  },
  head: { title: 'סיבות כשל' }
}
</script>

<style scoped>

</style>
