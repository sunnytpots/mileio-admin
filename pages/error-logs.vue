<template>
  <SectionLayout title="דוח שגויים" :route-back="{ name: 'error-logs' }" sm>
    <CardUi>
      <TableUi :headers="headers">
        <tr v-for="item of items" :key="item.id">
          <td v-text="item.id" />
          <td v-text="item.record_id" />
          <td v-text="item.table_name" />
          <td v-text="item.title" />
          <td v-text="item.description" />
        </tr>
      </TableUi>
    </CardUi>
  </SectionLayout>
</template>

<script>
export default {
  name: 'ErrorLogs',

  async asyncData ({ $logsService, $helper }) {
    try {
      const items = await $logsService.list()
      return { items }
    } catch (e) {
      $helper.snackbar(e, 'asyncData')
    }
  },
  data () {
    return {
      headers: [
        { title: 'Id' },
        { title: 'מזהה רשומה' },
        { title: 'נושא' },
        { title: 'שגיאה' },
        { title: 'תיאור' }
        // { ...this.$hasPermission('error-logs', 'edit') && { title: 'אפשרויות', classes: 'text-left' } }
      ],
      items: []
    }
  }
}
</script>

<style scoped>

</style>
