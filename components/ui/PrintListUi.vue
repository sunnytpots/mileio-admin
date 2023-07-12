<template>
  <div class="page-container">
    <div v-if="driverSelected" class="header-data">
      <h3>שם הנהג: {{driverSelected  }}</h3>
      <h3>כמות משלוחים: {{items.length  }}</h3>
      <h3>תאריך הדפסה: {{ new Date() | formatDate }}</h3>
    </div>
    <v-container v-if="customerBag">
      <div style="text-align: center">
        <h3>{{ title }}</h3>
        <barcode :value="customerBag.bag_number ? customerBag.bag_number : ''" :height="45">
          ERROR
        </barcode>
      </div>
      <div class="header-data">
        <h3>{{ customerBag.customer_name }}</h3>
        <h3>{{ customerBag.created_at | formatDate }}</h3>
      </div>
      <div class="header-data">
        <h3>{{ customerBag.customer_address }}</h3>
        <h3>כמות חבילות בשק: {{ items.length }}</h3>
        <span> הערות: {{ comments }} </span>
      </div>
    </v-container>
    <v-data-table
      :headers="headers"
      :items="items"
      class="elevation-1"
      hide-default-footer
      disable-pagination>
      <template
        v-if="customerBag"
        v-slot:item._barcode="{ item }">
        <barcode
          class="mt-1"
          :value="item.barcode ? item.barcode : ''"
          :height="45"
          :display-value="false">
          ERROR
        </barcode>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import VueBarcode from 'vue-barcode'
import { mapState } from 'vuex'

export default {
  name: 'PrintListUi',
  components: { barcode: VueBarcode },
  props: {
    customerBag: { type: Object, default: null },
    driverSelected: { type: String, default: null },
    items: { type: Array, default: () => ([]) },
    headers: { type: Array, default: () => ([]) },
    onPrint: { type: Boolean, default: false },
    title: { type: String, default: null },
    comments: { type: String, default: null }
  },
  computed: {
    ...mapState('auth', ['authUser'])
  },
  created () {
    console.log(this.headers, 'headers')
    console.log(this.items, 'items')
  }
}
</script>

<style scoped lang="scss">
.header-data {
  display: flex;
  justify-content: space-between
}
@media print {
  .page-container {
    //position: fixed;
    //top:0;
    width:100%;
  }
}
</style>
