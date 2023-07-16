<template>
    <SectionLayout title="ניהול עמודות משתמש" :route-back="{ name: 'settings' }" sm>
      <CardUi>
        <TableUi :headers="headers">
          <tr v-for="level of levels" :key="level.id">
            <td v-text="level.id" />
            <td v-text="level.key" />
            <td v-text="level.name" />
            <td v-if="$hasPermission('settings-column-management', 'edit')">
              <div class="options">
                <v-btn
                class="btn-secondary btn-edit"
                  @click.prevent="editData(level)">
                  <i class="icon icon-pen" />
                </v-btn>
              </div>
            </td>
          </tr>
        </TableUi>
      </CardUi>
  
      <DialogUi v-model="drawerUi" sm>
        <FormUi
        :form="form"
        :url="levelId ? `role-level-permissions/add` : 'role-level-permissions/add'"
        @submitted="getData">
        <v-text-field v-model="form.key" label="מפתח" />
        <v-text-field v-model="form.name" label="שם" />
  
        <FilterUi v-model="filter" show-report-type />
  
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
  
            <tr v-for="(columnPermission, index) of form.columnPermissions" :key="index">
              <td>
                <v-checkbox v-model="columnPermission.selected" :value="columnPermission.display && columnPermission.export" @change="onSelect($event, index)" />
              </td>
              <td v-text="columnPermission.value" />
              <td>
                <v-checkbox v-model="columnPermission.display" label="Display" />
                <v-checkbox v-model="columnPermission.export" label="Export" />
              </td>
            </tr>
          </TableUi>
        </FormUi>
      </DialogUi>
    </SectionLayout>
  </template>
  
  <script>  
  export default {
      name: "SettingsColumnManagement",
      middleware: ["permissions"],
      async asyncData({ $levelService, $helper }) {
          try {
              const levels = await $levelService.list();
              // const columns = await $manageColumns.list({ type: "deliveries" });
              return { levels };
          }
          catch (e) {
              $helper.snackbar(e, "asyncData");
          }
      },
      data() {
          return {
              selectAll: false,
              headers: [
                  { title: "Id" },
                  { title: "רמה" },
                  { title: "שם רמה" },
                  { ...this.$hasPermission("settings-column-management", "edit") && { title: "אפשרויות", classes: "text-center" } }
              ],
              form: {
                  id: "",
                  level_id: "",
                  type: "",
                  columnPermissions: []
              },
              levelId: null,
              levels: [],
              filter: {}
          };
      },
      computed: {
          drawerUi: {
              get() {
                  return this.$store.state.drawerUi;
              },
              set(value) {
                  if (!value) {
                      this.form.id = "";
                      this.form.level_id = "";
                      this.levelId = null;
                      this.selectAll = false;
                  }
                  this.$store.commit("setDrawerUi", value);
              }
          }
      },
      watch: {
        levelId(newLevelId) {
          if (newLevelId) {
            this.fetchColumnsPermission(newLevelId);
          }
        },
        selectAll(newSelectAll) {
          console.log(newSelectAll);
          this.form.columnPermissions.forEach(column => {
              column.display = newSelectAll;
              column.export = newSelectAll;
            });
        }
      },
      created() {
        this.fetchColumnsPermission();
      },
      methods: {
          async fetchColumnsPermission(levelId) {
            this.form = {
              id: "",
              level_id: "",
              type: "",
              columnPermissions: []
            }
            const payload = {
              level_id: levelId,
              type: 'deliveries',
            };

            try {
              this.loading = true;
              const response = await this.$manageUserColumns.list();
              for (let index = 0; index < response.length; index++) {
                if (response[index].type === 'deliveries') {
                  this.form.id = response[index].id;  // need to modify as id will be coming from loop
                  this.form.level_id = levelId;
                  this.form.type = response[index].type;
                  await response[index].columnPermissions.map((res) => {
                    if (response[index].level_id === levelId) {
                      this.form.columnPermissions.push({
                        label: res.label,
                        value: res.value,
                        selected: res.display && res.export,
                        display: res.display,
                        export: res.export
                      })
                    }
                  })
                }
              }
              // this.form.columnPermissions = await response; // Assuming the response is an array of column permissions
              this.loading = false;
            } catch (error) {
              this.loading = false;
              this.$helper.snackbar(error, "fetchColumnsPermission");
            }
          },
          editData(level) {
            this.levelId = level.id;
            this.form.key = level.key;
            this.form.name = level.name;            
            this.drawerUi = true;
          },
          getData(response) {
            response.status && window.location.reload();
          },
          onSelect(value, index) {
            const column = this.form.columnPermissions[index];
            column.display = value;
            column.export = value;
            !value && (column.display = false);
          }
      },
      head: { title: "ניהול עמודות משתמש" },
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
  