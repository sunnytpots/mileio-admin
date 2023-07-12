<template>
  <SectionLayout
    title="ניהול תגיות"
    :route-back="{ name: 'settings' }"
    lg>
    <v-layout row wrap>
      <v-flex md12 xs12 class="mb-5">
        <v-btn
          class="white--text"
          color="#fa4616"
          @click="showDialog = true">
          {{ 'הוספת תגית' }}
        </v-btn>
      </v-flex>
      <v-flex md12 xs12 class="mb-5">
        <FilterUi
          v-model="filter"
          show-search
          show-submit-button
          show-reset
          :data-loading="loading"
          :clear-filter-inputs="clearFilterInputs"
          @submit="getTags"/>
      </v-flex>
      <v-flex md12 xs12>
        <CardUi>
          <v-data-table
            :items="items"
            :total="totalItems"
            :headers="headers"
            :loading="loading"
            :options.sync="options"
            :footer-props="footerProps"
            class="elevation-1">
            <template v-slot:item.actions="{ item }">
              <div
                v-if="$hasPermission('settings-tags-management', 'edit')"
                class="options">
                <v-btn
                  class="btn-secondary btn-edit"
                  @click.prevent="editTag(item)">
                  <i class="icon icon-pen" />
                  <p
                    style="margin: auto 5px 0 auto"
                    v-text="'עריכה'"/>
                </v-btn>

                <DeleteButton
                  :url="`tags/delete/${item.id}`"
                  has-warning
                  @deleted="tagDeleted"/>
              </div>
            </template>
          </v-data-table>
        </CardUi>
      </v-flex>
    </v-layout>

    <DialogUi
      v-model="showDialog"
      persistent>
      <FormUi
        :form="form"
        ref-prop="tags-management"
        :url="form.id ? `tags/update/${form.id}` : 'tags/create'"
        cancel-btn
        @cancel-submission="cancelSubmission"
        @submitted="submitted">
        <v-text-field
          v-model="form.text"
          placeholder="שם תגית"
          :rules="notEmptyRule"/>
      </FormUi>
    </DialogUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'NewSorter',
  middleware: ['permissions'],

  data () {
    return {
      pagination: {
        skip: 0,
        take: 100
      },
      loading: false,
      options: {},
      resetDialog: false,
      filter: {},
      items: [],
      totalItems: null,
      showDialog: false,
      form: {
        id: null,
        text: null
      },
      notEmptyRule: [
        v => !!v || 'שדה חובה'
      ]
    }
  },
  computed: {
    ...mapState('global', ['footerProps']),

    headers () {
      const arr = [
        { text: 'מזהה', align: 'center', value: 'id', width: '10%', sortable: true },
        { text: 'תגית', align: 'start', value: 'text', width: '50%', sortable: true },
        { text: 'אפשרויות', align: 'center', value: 'actions', width: '40%', sortable: false }
      ]
      return arr
    },
  },
  watch: {
    options: {
      async handler (newOptions, oldOptions) {
        try {
          if (Object.keys(oldOptions)?.length < 1) {
            return
          }
          this.pagination = {
            skip: (newOptions.page - 1) * newOptions.itemsPerPage,
            take: newOptions.itemsPerPage
          }

          await this.getTags()
        } catch (e) {
          this.$helper.snackbar(e, 'options watch')
        }
      }
    }
  },
  created () {
    return this.getTags()
  },
  methods: {
    clearFilterInputs () {
      this.filter = {}
      return this.getTags()
    },
    tagDeleted () {
      this.$store.commit('setSnackbar',
        { value: true, message: 'תגית נמחקה', success: true })
      return this.getTags()
    },
    editTag (tag) {
      this.form = {
        id: tag.id,
        text: tag.text
      }
      return this.showDialog = true
    },
    submitted (results) {
      if (!results?.status) {
        return
      }

      this.showDialog = false
      this.$store.commit('setSnackbar',
        { value: true, message: 'תגית נוצרה בהצלחה', success: true })
      return this.getTags()
    },
    cancelSubmission () {
      this.showDialog = false
      this.form = { text: null }
    },
    async getTags () {
      try {
        this.loading = true
        const results = await this.$tagsService.viewTags({
          filter: this.filter,
          ...this.pagination
        })
        this.items = results.items
        this.totalItems = results.totalItems
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getTags')
      }
    }
  },
  validations: {
  },
  head: { title: 'ניהול תגיות' }
}
</script>

<style lang="scss" scoped>
.filter-ui {
  ::v-deep {
    .v-input {
      margin-right: 0 !important;
    }
    .filter-submit {
      padding-right: 0 !important;
      margin-top: -30px;
    }
    .clear-search-col {
      margin-right: 0 !important;
    }
  }
}
.polygon-list-item {
  display: flex;
  justify-content: space-between;
  width: 100%;

  .all-polylines-button {
    padding: 0 10px;
  }
}
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
</style>
