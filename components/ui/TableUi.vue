<template>
  <div :class="['table-ui', { 'overflow-hidden': overflowHidden }]">
    <table>
      <thead>
        <slot name="header" />

        <tr>
          <th
            v-for="(header, index) of headersFiltered"
            :key="index"
            :class="header.classes || ''"
            v-text="header.title"
          />
        </tr>
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
  </div>
</template>

<script>
export default {
  name: 'TableUi',

  props: {
    headers: { type: Array, default: () => ([]) },
    overflowHidden: { type: Boolean, default: false }
  },

  computed: {
    headersFiltered () {
      return this.headers.filter(header => header.title !== undefined)
    }
  }
}
</script>

<style lang="scss" scoped>
.table-ui {
  width: 100%;
  overflow: auto;

  table {
    width: 100%;
    border-collapse: collapse;

    th {
      height: 50px;
      padding: 0 25px;
      font-weight: normal;
      color: #22272E;
      font-size: 1rem;
      text-align: right;
      background-color: #F8F8F8;
      border-top: 1px solid #ebebeb;

      &.table-th-blue{
        background-color: #E0FDFD;
      }
      &.table-th-green{
        background-color: #fff4f1;
      }
      &.table-ui-th-black{
        background-color: #22272e !important;
        color: #fff;
        text-align: center;
        border-left: 1px solid #fff;

        &:last-child{
          border-left: none;
        }
      }
      &.table-ui-th-orange{
        background-color: #fa4616 !important;
        color: #fff;
        text-align: center;
        border-left: 1px solid #fff;

        &:last-child{
          border-left: none;
        }
      }
    }
    td {
      height: 50px;
      padding: 0 10px;
      color: #22272E;
      text-align: right;
      font-size: .8rem;
      border-top: 1px solid #ebebeb;
    }
    .table-ui-top{
      th {
        height: 30px;
        background-color: transparent;
        border-top: none;
      }
    }
    tr:hover {
      background: #E0FDFD !important;
      cursor: pointer;
    }
  }

  ::v-deep {
    .v-input--selection-controls__ripple{
      display: none;
    }
    .v-input {
      margin-top: 0;
      padding-top: 0;
    }
    .v-input__slot{
      margin-bottom: 0;
    }
    .v-messages{
      display: none;
    }
  }

  .th-border {
    border: 1px solid #e4e4e4;
  }
}
</style>
