<template>
  <div
    v-if="delivery && delivery.target_feedback_average"
    class="feedback-dialog-container">
    <p
      class="feedback-average"
      @click.stop="showPreview"
      v-text="delivery.target_feedback_average"/>
    <v-dialog
      v-model="showPreviewDialog"
      transition="dialog-bottom-transition"
      max-width="500"
      overlay-opacity="0"
      light
      text-align="-webkit-center"
      class="preview-modal">
      <div class="feedback-title">
        <i class="icon icon-info"/>
        <p>משוב נמען</p>
      </div>
      <div class="feedback-content">
        <v-progress-circular
          v-if="loadingPreview"
          class="spinner"
          size="50"
          color="#fa4616"
          indeterminate/>
        <div v-else-if="targetAnswers && targetAnswers.length > 0" class="feedback-container">
          <v-card class="feedback-card">
            <div class="feedback-title">
              <p v-text="'לקוח יקר, חשוב לנו לשמוע את דעתך על השירות שקיבלת מתפוז'"/>
            </div>
            <div class="questions-container">
              <div v-for="(feedbackQuestion, index) of feedbackQuestions" :key="index">
                <v-row class="feedback-question-title">
                  <v-col>
                    <p v-text="feedbackQuestion.question"/>
                  </v-col>
                </v-row>
                <v-row class="feedback-question-answers">
                  <v-col>
                    <v-radio-group v-model="targetFeedback.targetSatisfaction[index].answer_value">
                      <v-layout align-start row>
                        <v-radio
                          v-for="(feedbackAnswer, answerIndex) of feedbackAnswers"
                          :key="answerIndex"
                          disabled
                          :label="feedbackAnswer"
                          :value="answerIndex"
                          color="#FA4616"/>
                      </v-layout>
                    </v-radio-group>
                  </v-col>
                </v-row>
              </div>
            </div>
          </v-card>
        </div>
        <v-row v-else class="block-feedback">
          <v-col>
            <p v-text="'הנמען עוד לא מילא משוב עבור משלוח זה'"/>
          </v-col>
        </v-row>
      </div>
    </v-dialog>
  </div>
</template>

<script>
export default {
  name: 'RateDialog',

  props: {
    delivery: { type: Object, default: () => ({}) }
  },
  data () {
    return {
      feedbackAnswers: [
        'לא מרוצה',
        'טעון שיפור',
        'מרוצה',
        'מרוצה מאוד'
      ],
      targetFeedback: {},
      feedbackQuestions: [],
      targetAnswers: [],
      loadingPreview: false,
      showPreviewDialog: false
    }
  },
  watch: {
    showPreviewDialog (newVal) {
      if (!newVal) {
        this.loadingPreview = []
      }
    }
  },
  methods: {
    async getTargetFeedbackForm () {
      try {
        const res = await this.$targetSatisfactionService.viewAnsweredFeedbackForm({ delivery_id: this.delivery.id })
        if (!res?.status) {
          return
        }

        this.feedbackQuestions = res?.feedback?.map(feedback => feedback.question)
        this.targetAnswers = res?.feedback?.map(feedback => feedback.answer)
        const targetSatisfaction = []
        for (const feedbackQuestion of this.feedbackQuestions) {
          const targetAnswer = this.targetAnswers.find(targetAnswer => targetAnswer?.question_id === feedbackQuestion.id)
          targetSatisfaction.push({
            question_id: feedbackQuestion.id,
            answer_value: targetAnswer.value
          })
        }
        this.targetFeedback = {
          delivery_id: this.delivery.id,
          targetSatisfaction
        }
      } catch (e) {
        this.$helper.snackbar(e, 'getTargetFeedbackForm')
      }
    },
    async showPreview () {
      try {
        if (!this.delivery) {
          return
        }
        this.showPreviewDialog = true
        this.loadingPreview = true
        await this.getTargetFeedbackForm()
        this.loadingPreview = false
      } catch (e) {
        this.$helper.snackbar(e, 'showPreview')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.spinner {
  margin-right: 220px;
}
.feedback-dialog-container {
  display: flex;
  justify-content: center;
  .feedback-average {
    margin-right: 5px;
    cursor: pointer;
  }
  .feedback-average:hover {
    color: #FA562A;
  }
}
.icon-info-on-hover {
  cursor: pointer;
}
::v-deep {
  .v-dialog--active {
    background-color: #ffffff;
    width: fit-content;
    height: fit-content;
    min-width: 350px;
    min-height: 350px;
    //overflow-y: hidden;
    //overflow-x: hidden;
  }
  .block-feedback {
    width: inherit;
    height: 100%;
    min-height: 350px;
    padding-right: 20px;
  }
  .feedback-title {
    padding-right: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    p {
      padding-right: 10px;
      padding-top: 15px;
      font-size: 20px;
    }
  }
  .feedback-content {
    overflow-y: hidden;
    height: 100%;
    .feedback-container {
      max-width: 435px;
      display: flex;
      flex-direction: row;
      justify-content: center;
      margin: auto auto 40px auto;
      .feedback-card.v-sheet.v-card {
        box-shadow: 0 0 21px rgba(0, 0, 0, 0.05);
        border-radius: 16px;
        overflow: hidden;
        width: 80%;
        align-self: center;
        .feedback-title {
          background: linear-gradient(90deg, rgba(52, 192, 91, 0.05) 0%, rgba(250, 70, 22, 0.05) 100%);
          border-radius: 16px;
          padding: 10px !important;
          margin: 10px !important;
          p {
            font-family: 'Rubik';
            font-style: normal;
            font-weight: normal;
            font-size: 20px;
            line-height: 28px;
            text-align: right;
            color: #000000;
            margin-bottom: 0;
            @media (max-width: 390px) {
              font-size: 16px;
            }
          }
        }
        .form-ui-footer {
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .questions-container {
          .feedback-question-title {
            .col {
              padding-bottom: 0;
              padding-right: 20px;
              p {
                font-family: 'Rubik';
                font-style: normal;
                font-weight: normal;
                line-height: 28px;
                text-align: right;
                color: #000000;
                margin-bottom: 0;
                font-size: 20px;
                @media (max-width: 390px) {
                  font-size: 16px;
                }
              }
            }
          }
          .feedback-question-answers {
            .col {
              padding: 0;
              .v-input--selection-controls {
                margin-top: 10px !important;
              }
              .v-label.theme--light {
                background-color: #FFFFFF;
                padding-left: 10px;
                padding-right: 10px;
                color: #A2ADB5;
                font-family: 'Rubik';
                font-style: normal;
                font-weight: normal;
                line-height: 21px;
                text-align: center;
                width: 100%;
                margin-bottom: 4px !important;
                padding-bottom: 10px !important;
                @media (max-width: 335px) {
                  padding: 5px;
                }
              }
              .v-radio.theme--light {
                background-color: #F8F8F8;
                margin: auto 0;
                &:last-child{
                  border-bottom-left-radius: 16px;
                  border-top-left-radius: 50px;
                }
                &:first-child{
                  border-bottom-right-radius: 16px;
                  border-top-right-radius: 50px;
                }
                .v-input--selection-controls__input {
                  margin: 0 0 2px 0;
                }
                .v-icon.notranslate.mdi.mdi-radiobox-blank.theme--light {
                  color: #FA4616;
                }
              }
              .v-label.theme--light {
                font-size: 12px !important;
                @media (min-width: 400px) {
                  font-size: 15px !important;
                }
                @media (max-width: 400px) {
                  font-size: 14px !important;
                }
                @media (max-width: 380px) {
                  font-size: 13px !important;
                }
                @media (max-width: 340px) {
                  font-size: 12px !important;
                }
                @media (max-width: 300px) {
                  font-size: 11px !important;
                }
                @media (max-width: 255px) {
                  font-size: 10px !important;
                }
              }
            }
            .v-input--radio-group__input {
              align-items: center;
              .layout.align-start.row {
                //width: 100%;
              }
            }
            .v-input--selection-controls .v-input__slot, .v-input--selection-controls .v-radio  {
              flex-direction: column-reverse;
              margin: 10px auto;
              .v-label.theme--light {
                margin-bottom: 10px;
              }
            }
          }
        }
        .v-btn:not(.v-btn--round).v-size--default {
          width: 100% !important;
        }
      }
    }
  }
}
</style>
