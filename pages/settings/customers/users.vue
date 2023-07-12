<template>
  <FormUi
    :form="form"
    :v="$v.form"
    no-btn
    name="usersManagement"
    url="customers/add-user"
    :readonly="!$hasPermission('settings-customers-users', 'edit')"
    @submitted="$emit('update:submit-status', $event)">
    <v-container>
      <v-switch
        v-model="form.toSendSms"
        label="שלח הודעה עם פרטי התחברות עבור משתמשים חדשים, בעת שמירה"
        color="#fa4616"/>

      <v-data-table
        :items="form.items"
        :headers="headers"
        :loading="loading"
        class="elevation-1"
        disable-pagination
        hide-default-footer
        :footer-props="footerProps">
        <template v-slot:item.first_name="{ item }">
          <v-text-field v-model="item.first_name" />
        </template>

        <template v-slot:item.last_name="{ item }">
          <v-text-field v-model="item.last_name" />
        </template>

        <template v-slot:item.email="{ item }">
          <v-text-field v-model="item.email" />
        </template>

        <template v-slot:item.mobile="{ item }">
          <v-text-field v-model="item.mobile" />
        </template>

        <template v-slot:item.user_level="{ item }">
          <v-autocomplete
            v-model="item.level_id"
            clearable
            :items="levels"
            label="Level"
            item-text="key"
            item-value="id"/>
        </template>

        <template v-slot:item.options="{ item }">
          <DeleteButton
            v-if="$hasPermission('settings-customers', 'edit')"
            url="customers/remove-user"
            has-warning
            api-method="$post"
            :req-body="{ user_id: item.id }"
            @deleted="getData"/>
        </template>
      </v-data-table>

      <v-row no-gutters class="justify-end mt-4">
        <v-col cols="1" align="center">
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <i
                class=" ml-5 icon icon-red-plus"
                v-bind="attrs"
                v-on="on"
                @click="addRow"/>
            </template>
            <span>הוספת משתמש</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-container>
  </FormUi>
</template>

<script>

import { mapState } from 'vuex'
import { required } from 'vuelidate/lib/validators'

export default {
  name: 'SettingsCustomersUsers',
  props: {
    customer: { type: Object, default: () => ({}) }
  },

  async asyncData ({ $levelService, $helper, store }) {
    try {
      store.commit('setDrawerUi', true)
      const levels = await $levelService.list()

      return { levels }
    } catch (e) {
      $helper.snackbar(e, 'asyncData')
    }
  },
  data () {
    return {
      loading: false,
      levels: [],
      form: {
        toSendSms: false,
        customer_id: null,
        items: []
      }
    }
  },
  computed: {
    ...mapState('global', ['branches', 'footerProps']),

    headers () {
      const arr = [
        { text: 'שם פרטי', align: 'center', value: 'first_name', sortable: false },
        { text: 'שם משפחה', align: 'center', value: 'last_name', sortable: false },
        { text: 'דוא"ל', align: 'center', value: 'email', sortable: false },
        { text: 'נייד', align: 'center', value: 'mobile', sortable: false },
        { text: 'רמת משתמש', align: 'center', value: 'user_level', sortable: false },
        { text: 'אפשרויות', align: 'center', value: 'options', sortable: false }
      ]
      return arr
    }
  },
  created () {
    return this.getData()
  },
  methods: {
    async getData () {
      try {
        this.loading = true
        this.form.customer_id = this.customer.id
        const response = await this.$customersService.getUsers(this.customer.uuid)
        this.form.items = response?.map(user => {
          return {
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            email: user.email ? user.email : null,
            mobile: user.mobile,
            level_id: user?.level?.id
          }
        })
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'getData')
      }
    },
    addRow () {
      this.form.items.push({
        first_name: null,
        last_name: null,
        email: null,
        mobile: null,
        password: null,
        level_id: null,
        newUser: true
      })
    }
  },
  validations: {
    form: { required }
  }
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
::v-deep {
  .theme--light.v-input input {
    font-size: 13px;
  }
}

td {
  border: 1px solid #ebebeb;
  height: 70px !important;
}

.delete-button {
  text-align: center;
  margin-top: -1rem;
  .v-btn {
    padding: .2rem;
    height: inherit;
    min-width: inherit;
    margin-top: 1.6rem;
  }
  .icon {
    width: 16px;
    height: 16px;
  }
}
</style>
