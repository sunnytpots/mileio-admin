<template>
  <div class="form-ui">
    <v-form :ref="refProp" :readonly="readonly" @submit.prevent="submit">
      <div v-if="$slots.header" class="form-ui-header">
        <slot name="header" />
      </div>

      <div class="form-ui-body">
        <slot />
      </div>

      <div class="form-ui-footer">
        <v-btn
          v-if="cancelBtn"
          class="btn-primary"
          type="submit"
          :loading="loading"
          @click.prevent="$emit('cancel-submission')">
          ביטול
        </v-btn>
        <v-btn
          v-if="!noBtn"
          class="btn-primary"
          type="submit"
          :loading="loading"
          :disabled="disableConfirm">
          {{ btnText || 'שמור' }}
        </v-btn>
      </div>
    </v-form>
  </div>
</template>

<script>
export default {
  name: 'FormUi',

  props: {
    form: { type: Object, default: () => ({}) },
    v: { type: Object, default: null },
    store: { type: String, default: '' },
    dispatch: { type: String, default: '' },
    routeTo: { type: Object, default: () => ({}) },
    url: { type: String, default: '' },
    noBtn: { type: Boolean, default: false },
    disableConfirm: { type: Boolean, default: false },
    cancelBtn: { type: Boolean, default: false },
    btnText: { type: String, default: '' },
    name: { type: String, default: '' },
    readonly: { type: Boolean, default: false },
    formData: { type: Boolean, default: false },
    refProp: { type: String, default: null }
  },

  data () {
    return {
      loading: false
    }
  },

  computed: {
    status () {
      return this.store ? this.$store.state[this.store].status : ''
    }
  },

  watch: {
    status (newStatus) {
      if (newStatus) {
        this.$router.push(this.routeTo)
      }
    }
  },

  created () {
    this.$nuxt.$on('formSubmit', async name => name === this.name && await this.submit())
  },

  destroyed () {
    this.$nuxt.$off('formSubmit')
  },

  methods: {
    madeObj (data, myObjData, key) {
      Object.entries(data).forEach(([key2, value]) => {
        const str = key !== '' ? key + `[${key2}]` : key2

        if (Array.isArray(value)) {
          myObjData = { ...myObjData, ...this.madeArray(value, myObjData, str) }
        } else if (Object.prototype.toString.call(value) === '[object Object]') {
          myObjData = { ...myObjData, ...this.madeObj(value, myObjData, str) }
        } else {
          myObjData[str] = value
        }
      })

      return myObjData
    },

    madeArray (data, myObjData, key) {
      data.forEach((value, idx) => {
        const str = key + `[${idx}]`

        if (Array.isArray(value)) {
          myObjData = { ...myObjData, ...this.madeArray(value, myObjData, str) }
        } else if (Object.prototype.toString.call(value) === '[object Object]') {
          myObjData = { ...myObjData, ...this.madeObj(value, myObjData, str) }
        } else {
          myObjData[str] = value
        }
      })

      return myObjData
    },

    async submit () {
      console.log('submitted form-ui')
      let cancelSubmission = false

      if (this.$refs[this.refProp] && !this.$refs[this.refProp].validate()) {
        cancelSubmission = true
      }

      if (this.v) {
        this.v.$touch()
        if (this.v.$error) {
          console.log('has errors this.v', this.v)
          cancelSubmission = true
        }
      }

      if (cancelSubmission) {
        return
      }

      let formData = null
      let config = null
      if (this.formData) {
        config = { headers: { 'Content-Type': 'multipart/form-data' } }
        const objData = this.madeObj(this.form, {}, '')

        formData = Object.entries(objData).reduce((fd, [key, value]) => {
          if (value !== null && value !== undefined) {
            fd.append(key, value)
          }
          return fd
        }, new FormData())
      } else {
        formData = this.form
      }

      this.loading = true
      if (this.url) {
        try {
          const response = await this.$axios.$post(this.url, formData, config)
          this.$emit('submitted', { status: true, response })
        } catch (e) {
          this.loading = false
          this.$emit('submitted', { status: false, response: e })
          this.$helper.snackbar(e, 'submit')
        }
      } else {
        try {
          await this.$store.dispatch(this.store + '/' + this.dispatch, formData)
          this.$emit('submitted-no-url', { status: true })
        } catch (e) {
          this.loading = false
          this.$emit('submitted', { status: false, response: e })
          this.$helper.snackbar(e, 'submit')
        }
      }
      this.loading = false
    }
  }
}
</script>

<style lang="scss" scoped>
.form-ui{
  ::v-deep {
    .v-text-field__details{
      display: none;
    }

    .error--text{
      .v-text-field__details{
        display: flex;
      }
    }
  }
}
.form-ui-body{
  padding: .7rem;
}
.form-ui-footer{
  padding: .7rem;
}
</style>
