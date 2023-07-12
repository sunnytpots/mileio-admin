<template>
  <SectionLayout title="רמות משתמשים" :route-back="{ name: 'settings' }" sm>
    <CardUi>
      <TableUi :headers="headers">
        <tr v-for="level of levels" :key="level.id">
          <td v-text="level.id" />
          <td v-text="level.key" />
          <td v-text="level.name" />
          <td v-if="$hasPermission('settings-levels', 'edit')">
            <div class="options">
              <v-btn
                class="btn-secondary btn-edit"
                @click.prevent="editData(level)">
                <i class="icon icon-pen" />
              </v-btn>

              <DeleteButton
                has-warning
                :url="`level/${level.id}`"
                @deleted="getData"/>
            </div>
          </td>
        </tr>
      </TableUi>
    </CardUi>

    <DialogUi v-model="drawerUi" sm>
      <FormUi
        :form="form"
        :url="levelId ? `level/update/${levelId}` : 'level/add'"
        @submitted="getData">
        <v-text-field v-model="form.key" label="מפתח" />
        <v-text-field v-model="form.name" label="שם" />

        <TableUi overflow-hidden>
          <template #header>
            <tr>
              <th>
                <v-checkbox
                  v-model="selectAll"
                  label="בחר הכל" />
              </th>
              <th v-text="'מפתח'" />
              <th v-text="'אפשרויות'" />
            </tr>
          </template>

          <tr v-for="(permission, index) of form.permissions" :key="index">
            <td>
              <v-checkbox :input-value="permission.selected" @change="onSelect($event, index)" />
            </td>
            <td v-text="permission.title" />
            <td>
              <v-checkbox v-model="permission.read_only" label="Readonly" disabled />
              <v-checkbox v-model="permission.editing" label="Editing" :disabled="!permission.selected" />
            </td>
          </tr>
        </TableUi>
      </FormUi>
    </DialogUi>
  </SectionLayout>
</template>

<script>
export default {
  name: 'SettingsLevels',
  middleware: ['permissions'],

  async asyncData ({ $levelService, $permissionsService, $helper }) {
    try {
      const levels = await $levelService.list()
      const permissions = await $permissionsService.list()
      return { levels, permissions }
    } catch (e) {
      $helper.snackbar(e, 'asyncData')
    }
  },
  data () {
    return {
      selectAll: false,
      headers: [
        { title: 'Id' },
        { title: 'רמה' },
        { title: 'שם רמה' },
        { ...this.$hasPermission('settings-levels', 'edit') && { title: 'אפשרויות', classes: 'text-center' } }
      ],
      form: {
        name: '',
        key: '',
        permissions: []
      },
      levelId: null,
      levels: [],
      permissions: []
    }
  },
  computed: {
    drawerUi: {
      get () {
        return this.$store.state.drawerUi
      },
      set (value) {
        if (!value) {
          this.form.key = ''
          this.form.name = ''
          this.levelId = null
          this.setPermissionGroups()
          this.selectAll = false
        }

        this.$store.commit('setDrawerUi', value)
      }
    }
  },
  watch: {
    selectAll (newSelectAll) {
      this.form.permissions.forEach(permission => {
        permission.selected = newSelectAll
        permission.read_only = newSelectAll
        permission.editing = newSelectAll
      })
    }
  },
  created () {
    this.setPermissionGroups()
  },
  methods: {
    editData (level) {
      this.levelId = level.id
      this.form.key = level.key
      this.form.name = level.name
      this.form.permissions.map(permission => {
        const levelPermission = level.level_permissions
          .filter(lP => !lP.deleted_at)
          .find(levelPermission => levelPermission.permission_group_id === permission.permission_group_id)

        if (levelPermission) {
          permission.selected = true
          permission.read_only = levelPermission.read_only
          permission.editing = levelPermission.editing
        } else {
          permission.selected = false
          permission.read_only = false
          permission.editing = false
        }
        return permission
      })

      this.drawerUi = true
    },

    setPermissionGroups () {
      this.form.permissions = this.permissions.map((permission, index) => ({
        permission_group_id: permission.id,
        title: permission.title,
        key: permission.key,
        selected: false,
        read_only: false,
        editing: false
      }))
    },

    getData (response) {
      response.status && window.location.reload()
    },

    onSelect (value, index) {
      const permission = this.form.permissions[index]
      permission.selected = value
      permission.read_only = value

      !value && (permission.editing = false)
    }
  },
  head: { title: 'רמות משתמשים' }
}
</script>

<style lang="scss" scoped>
::v-deep{
  .table-ui{
    .v-label{
      font-size: 13px;
    }
  }
}
</style>
