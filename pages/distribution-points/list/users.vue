<template>
  <FormUi
    :form="form"
    :v="$v.form"
    no-btn
    name="distributionPointUsers"
    url="distribution-points/add-user"
    :readonly="!$hasPermission('settings-customers-users', 'edit')"
    @submitted="submitted"
  >
    <v-container>
      <TableUi :headers="headers">
        <tr  v-for="(item, i) in form.items" :key="i">
          <td>
            <v-text-field
              v-model="item.name"
              solo
              flat
            />
          </td>
          <td>
            <v-text-field
              v-model="item.email"
              solo
              flat
            />
          </td>
          <td>
            <v-text-field
              v-model="item.mobile"
              solo
              flat
            />
          </td>
          <td v-if="$hasPermission('distribution-points-list', 'edit')">
            <div class="delete-button">
              <v-btn class="btn-secondary" @click.prevent="remove(i)">
                <i class="icon icon-bucket"/>
              </v-btn>
            </div>
          </td>
        </tr>
      </TableUi>
      <v-row no-gutters class="justify-end mt-4">
        <v-col cols="1" align="center" >
          <v-tooltip bottom>
            <template v-slot:activator="{ on, attrs }">
              <i class=" ml-5 icon icon-red-plus" @click="addRow" v-bind="attrs" v-on="on"/>
            </template>
            <span>הוספת משתמש</span>
          </v-tooltip>
        </v-col>
      </v-row>
    </v-container>
  </FormUi>
</template>

<script>

import { required } from 'vuelidate/lib/validators'

export default {
  name: 'DistributionPointsListUsers',

  props: {
    distributionPoint: { type: Object, default: null }
  },
  asyncData ({ $axios, store }) {
    store.commit('setDrawerUi', true)
  },
  data () {
    return {
      form: {
        distribution_point_id: null,
        items: [],
        itemsToRemove: []
      },
      headers: [
        { title: 'שם מלא', classes: 'th-border' },
        { title: 'דוא"ל', classes: 'th-border' },
        { title: 'נייד', classes: 'th-border' },
        { ...this.$hasPermission('distribution-points-list', 'edit') && { title: 'אפשרויות', classes: 'text-left' } }

      ]
    }
  },

  async created () {
    try {
      let res = []
      if (this.distributionPoint && this.distributionPoint.id) {
        this.form.distribution_point_id = this.distributionPoint.id
        res = await this.$distributionPointsService.getUsers(this.distributionPoint.uuid)
        this.form.items = res.map(user => {
          return {
            id: user.id,
            name: user.name,
            email: user.email ? user.email : null,
            mobile: user.mobile
          }
        })
      }
    } catch (e) {
      console.log('created error', e)
    }
  },

  methods: {
    addRow () {
      this.form.items.push(
        { name: null, email: null, mobile: null, newUser: true })
    },
    remove (index) {
      this.form.itemsToRemove.push(this.form.items[index].id)
      if (this.form.items.length > 0) {
        this.form.items.splice(index, 1)
      }
    },
    submitted (value) {
      if (value.status) {
        this.$store.commit('setSnackbar', { value: true, message: 'נשמר בהצלחה', success: true })
        this.form = {}
        this.$router.push({ name: this.$route.matched[0].name })
        this.$store.commit('setDrawerUi', false)
      }
    }
  },
  validations: {
    form: { required }
  }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .theme--light.v-input input {
    font-size: 13px;
  }
}

td{
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
