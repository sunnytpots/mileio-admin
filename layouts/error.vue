<template>
  <v-app id="mile-io" :class="`layout-error layout-${$route.name}`">
    <v-main>
      <div class="error-block">
        <img class="error-image" src="../assets/images/tapuz-error.png"/>
        <p class="error-occurred-text" v-text="'זה קורה גם לטובים ביותר...'"/>
        <n-link :to="{ name: 'index' }" v-text="'חזרה לעמוד הראשי'" />
        <div class="error-details">
          <p class="error-title" v-text="'פרטי שגיאה:'"/>
          <pre>
          {{ error }}
        </pre>

          <h1 v-if="error.statusCode === 404" v-text="pageNotFound" />
          <h1 v-else v-text="otherError" />
        </div>
      </div>
    </v-main>
  </v-app>
</template>

<script>
export default {
  props: {
    error: {
      type: Object,
      default: null
    }
  },
  data () {
    return {
      pageNotFound: '404 - עמוד לא נמצא',
      otherError: 'An error occurred'
    }
  },
  mounted () {
    console.log(this.error, 'error')
  },
  head () {
    const title = this.error.statusCode === 404 ? this.pageNotFound : this.otherError
    return { title }
  }
}
</script>

<style lang="scss" scoped>
@import url('https://fonts.googleapis.com/css2?family=Rubik:wght@400&display=swap');
#mile-io {
  font-family: 'Rubik';
}
::v-deep {
  .v-application--wrap {
    min-height: unset !important;
  }
}
h1 {
  font-size: 20px;
}
.error-block{
  background-color: #fff;
  border-radius: 8px;
  width: 100%;
  max-width: 40rem;
  padding: 3rem 0;
  text-align: center;
  .error-image {
    width: 200px;
    //height: 100px;
  }
  .error-occurred-text {
    font-size: 36px;
  }
  .error-details {
    margin: 25px;
    border: 1px solid black;
    box-shadow: 5px 5px 5px gray;
    .error-title {
      font-size: 24px;
    }
  }
}
.layout-error{
  width: 100%;

  ::v-deep {
    .v-main{
      background-color: #f8f8fd;
    }
    .v-main__wrap{
      width: 100%;
      align-items: center;
      background-color: #FFFFFF;
      flex-direction: row;
      justify-content: center;
    }
  }
}
</style>
