function installSubmitTrigger() {
  var form = FormApp.getActiveForm();
  ScriptApp.getProjectTriggers()
    .filter(function(trigger) { return trigger.getHandlerFunction() === "handleFormSubmit"; })
    .forEach(function(trigger) { ScriptApp.deleteTrigger(trigger); });
  ScriptApp.newTrigger("handleFormSubmit").forForm(form).onFormSubmit().create();
}

function handleFormSubmit(event) {
  if (!event || !event.response) throw new Error("This function must run from a Google Forms submit trigger.");

  var properties = PropertiesService.getScriptProperties();
  var response = event.response;
  var email = response.getRespondentEmail();
  var score = response.getScore();
  var items = response.getGradableItemResponses();
  var answerSummary = items.map(function(itemResponse) {
    var item = itemResponse.getItem();
    var rawAnswer = itemResponse.getResponse();
    var feedback = itemResponse.getFeedback();
    var correctAnswers = getCorrectAnswers(item);

    return {
      question: item.getTitle(),
      answer: Array.isArray(rawAnswer) ? rawAnswer.join(", ") : String(rawAnswer == null ? "" : rawAnswer),
      points_awarded: itemResponse.getScore(),
      points_possible: item.getPoints(),
      correct_answers: correctAnswers,
      feedback: feedback ? feedback.getText() : ""
    };
  });
  var total = items.reduce(function(sum, itemResponse) {
    return sum + itemResponse.getItem().getPoints();
  }, 0);

  if (!email || score == null || total <= 0) {
    throw new Error("The response needs a collected respondent email and graded quiz questions with points.");
  }

  var payload = {
    email: email,
    course: properties.getProperty("MEDSTUDY_COURSE"),
    quiz_title: properties.getProperty("MEDSTUDY_QUIZ_TITLE"),
    score: score,
    total_marks: total,
    external_source_id: response.getId(),
    answer_summary: answerSummary
  };
  var result = UrlFetchApp.fetch(properties.getProperty("MEDSTUDY_EDGE_FUNCTION_URL"), {
    method: "post",
    contentType: "application/json",
    headers: { "x-medstudy-secret": properties.getProperty("MEDSTUDY_SHARED_SECRET") },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  if (result.getResponseCode() < 200 || result.getResponseCode() >= 300) {
    throw new Error("Score import failed (" + result.getResponseCode() + "): " + result.getContentText());
  }
}

function getCorrectAnswers(item) {
  var choices;
  switch (item.getType()) {
    case FormApp.ItemType.MULTIPLE_CHOICE:
      choices = item.asMultipleChoiceItem().getChoices();
      break;
    case FormApp.ItemType.CHECKBOX:
      choices = item.asCheckboxItem().getChoices();
      break;
    case FormApp.ItemType.LIST:
      choices = item.asListItem().getChoices();
      break;
    default:
      return [];
  }
  return choices
    .filter(function(choice) { return choice.isCorrectAnswer(); })
    .map(function(choice) { return choice.getValue(); });
}
