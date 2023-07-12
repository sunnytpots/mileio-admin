<template>
  <SectionLayout title="הרשאות" :route-back="{ name: 'settings' }" sm>
    <CardUi>
      <TableUi :headers="headers">
        <tr v-for="permission of permissions" :key="permission.id">
          <td v-text="permission.id" />
          <td v-text="permission.title" />
          <td v-text="permission.key" />
          <!--<td v-text="permission.parent_id ? permission.parent.title : ''" />-->
          <td v-if="$hasPermission('settings-permissions', 'edit')">
            <div class="options">
              <v-btn class="btn-secondary btn-edit" @click.prevent="editData(permission)">
                <i class="icon icon-pen" />
              </v-btn>
              <DeleteButton
                :url="`permissions/${permission.id}`"
                has-warning
                :warning-message="'האם אתה בטוח שברצונך למחוק הרשאה זו?'"
                @deleted="getData"/>
            </div>
          </td>
        </tr>
      </TableUi>
    </CardUi>

    <DialogUi v-model="drawerUi" sm>
      <FormUi :form="form" :url="permissionId ? `permissions/${permissionId}` : 'permissions'" @submitted="getData">
        <v-text-field v-model="form.key" label="מפתח" />

        <v-text-field v-model="form.title" label="כותרת" />

        <!--<v-autocomplete-->
        <!--v-model="form.parent_id"-->
        <!--:items="permissionsFiltered"-->
        <!--label="Parent"-->
        <!--item-text="title"-->
        <!--item-value="id"-->
        <!--clearable-->
        <!--/>-->
      </FormUi>
    </DialogUi>
  </SectionLayout>
</template>

<script>
export default {
  name: 'SettingsPermissions',
  middleware: ['permissions'],

  async asyncData ({ $permissionsService, $helper }) {
    try {
      const permissions = await $permissionsService.list()
      return { permissions }
    } catch (e) {
      $helper.snackbar(e, 'asyncData')
    }
  },
  data () {
    return {
      selectAll: false,

      headers: [
        { title: 'Id' },
        { title: 'כותרת' },
        { title: 'מפתח' },
        // { title: 'אבא' },
        { ...this.$hasPermission('settings-permissions', 'edit') && { title: 'אפשרויות', classes: 'text-left' } }
      ],

      form: {
        key: '',
        title: '',
        parent_id: null
      },

      permissionId: null,
      permissions: []
    }
  },
  computed: {
    permissionsFiltered () {
      return this.permissions.filter(permission => !permission.parent_id)
    },

    drawerUi: {
      get () {
        return this.$store.state.drawerUi
      },
      set (value) {
        if (!value) {
          this.form.key = ''
          this.form.title = ''
          this.form.parent_id = null
          this.permissionId = null
        }

        this.$store.commit('setDrawerUi', value)
      }
    }
  },
  watch: {
    selectAll (newSelectAll) {
      this.form.permission_groups.forEach(permission => {
        permission.selected = newSelectAll
        permission.read_only = newSelectAll

        !newSelectAll && (permission.editing = newSelectAll)
      })
    }
  },
  methods: {
    editData (permission) {
      this.permissionId = permission.id
      this.form.key = permission.key
      this.form.title = permission.title
      this.form.parent_id = permission.parent_id
      this.drawerUi = true
    },

    async getData (response) {
      if (response.status) {
        this.permissions = await this.$permissionsService.list()
        this.drawerUi = false
      }
    }
  },
  head: { title: 'הרשאות' }
}
</script>

<style lang="scss" scoped>

</style>
