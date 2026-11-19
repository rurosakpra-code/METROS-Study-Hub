/**
 * MedStudy Hub verified Google Forms score bridge.
 * Attach this script to a Google Form quiz (Extensions > Apps Script).
 * Configure Script Properties: MEDSTUDY_EDGE_FUNCTION_URL and MEDSTUDY_SHARED_SECRET.
 * Enable "Collect email addresses" and make the Form a quiz with points assigned.
 */
function getPointsForGradedItem(item) {
  switch (item.getType()) {
    case FormApp.ItemType.CHECKBOX:
      return item.asCheckboxItem().getPoints();
    case FormApp.ItemType.LIST:
      return item.asListItem().getPoints();
    case FormApp.ItemType.MULTIPLE_CHOICE:
      return item.asMultipleChoiceItem().getPoints();
    case FormApp.ItemType.PARAGRAPH_TEXT:
      return item.asParagraphTextItem().getPoints();
    case FormApp.ItemType.TEXT:
      return item.asTextItem().getPoints();
    default:
      throw new Error("Unsupported graded question type: " + item.getType());
  }
}

function onFormSubmit(e) {
  if (!e || !e.response) throw new Error("This must run from an installable Form-submit trigger.");
  const props = PropertiesService.getScriptProperties();
  const endpoint = props.getProperty("MEDSTUDY_EDGE_FUNCTION_URL");
  const secret = props.getProperty("MEDSTUDY_SHARED_SECRET");
  const course = props.getProperty("MEDSTUDY_COURSE");
  const quizTitle = props.getProperty("MEDSTUDY_QUIZ_TITLE");
  if (!endpoint || !secret || !course || !quizTitle) throw new Error("Set all MEDSTUDY_* Script Properties first.");

  const response = e.response;
  const email = (response.getRespondentEmail() || "").trim().toLowerCase();
  if (!email) throw new Error("Respondent email is missing. Enable Collect email addresses in Google Forms.");

  const graded = response.getGradableItemResponses();
  let earned = 0, possible = 0;
  graded.forEach(function(itemResponse) {
    const item = itemResponse.getItem();
    const points = Number(getPointsForGradedItem(item));
    const score = itemResponse.getScore();
    if (!Number.isFinite(points) || points < 0) {
      throw new Error("Invalid point value on quiz question: " + item.getTitle());
    }
    if (score === null || score === undefined || !Number.isFinite(Number(score))) {
      throw new Error("Google Forms has not graded this response yet: " + item.getTitle());
    }
    possible += points;
    earned += Number(score);
  });
  if (possible <= 0) throw new Error("No graded quiz points were found. Make this Form a quiz and assign points.");

  const payload = {
    email: email,
    course: course,
    quiz_title: quizTitle,
    score: earned,
    total_marks: possible,
    external_source_id: response.getId()
  };
  const result = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    headers: { "x-medstudy-secret": secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const status = result.getResponseCode();
  if (status < 200 || status >= 300) {
    throw new Error("MedStudy Hub import failed (" + status + "): " + result.getContentText());
  }
}

/** Run once manually after setting Script Properties to install the submit trigger. */
function installSubmitTrigger() {
  const form = FormApp.getActiveForm();
  if (!form) throw new Error("Open this Apps Script from the Google Form itself.");
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === "onFormSubmit") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("onFormSubmit").forForm(form).onFormSubmit().create();
}
