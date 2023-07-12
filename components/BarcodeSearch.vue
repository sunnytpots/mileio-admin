<template>
  <div class="scan-widget">
    <v-container>
      <v-row>
        <v-col cols="4" class="sideBlock">
          <span v-text="sideText"/>
          <div v-if="scansAmount">
            {{ scansAmount }}
          </div>
        </v-col>
        <v-col cols="6">
          <div class="scan-search">
            <v-text-field v-model="barcode" outlined >
              <template #append>
                <button class="btn-search" type="button" @click="onSearch" v-text="'סרוק'"/>
              </template>
            </v-text-field>
          </div>
        </v-col>
        <v-col cols="2" class="side-block">
          <img src="../assets/images/scan-search.png">
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'BarcodeSearch',
  props: {
    sideText: { type: String, default: null },
    scansAmount: { type: String, default: null }
  },
  data () {
    return {
      value: null,
      barcode: null
    }
  },

  methods: {
    onSearch () {
      console.log('onSearch', this.barcode)
      if (this.barcode === '') {
        this.value = null
      } else {
        this.value = this.barcode
      }
      this.$emit('scanFromBarcodeSearch')
      this.$emit('input', this.value)
      this.barcode = ''
    }
  },
  watch: {
    // value: {
    //   handler (newFilter) {
    //     console.log('newFilter', newFilter)
    //     this.$emit('input', newFilter)
    //   },
    //   deep: true
    // }
  }
}
</script>

<style lang="scss" scoped>
.scan-widget{
  background-color: #22272E;
  border-radius: 4px;
}
.sideBlock{
  //background-color: #303640;
  border-radius: 4px;
  text-align: center;
  color: white;
  marign:auto !important;
}
.scan-search{
  margin-top: 0.9rem;
  ::v-deep{
    .v-input{
      width: 38.3rem;
      background-color: #373f4c;
    }
    .v-text-field--outlined{
      border-radius: 8px;
    }
    .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) > .v-input__control > .v-input__slot {
      padding-left: 0;
    }
    .v-input__slot{
      margin-bottom: 0;
    }
    .v-text-field__details{
      display: none;
    }
    .v-input__append-inner{
      margin-top: 0;
    }
    fieldset{
      border: none;
    }
    .theme--light.v-input input{
      color: #fff;
    }
  }

  .btn-search{
    min-height: 56px;
    background-color: #fa4616;
    color: #fff;
    border-radius: 8px 0 0 8px;
    font-size: .8rem;
    padding: 0 2.2rem;
  }
}

</style>
