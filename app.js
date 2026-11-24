/* MedStudy Hub — configure only the Supabase project URL and anon/publishable key. */
const SUPABASE_URL = "https://qiwqluwtmpflmekgjiob.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SA2ullhPQI-ftOEUfBqcvQ_oRendrnb";
// Public read-only Google Drive folder configuration. Restrict the API key by HTTP referrer and Drive API.
const GOOGLE_DRIVE_API_KEY = "AIzaSyD53iYS0MZgzcQBBXHXVXEISqytGHin0Sk";
const GOOGLE_DRIVE_FOLDER_ID = "1n6gS6uo_G2SW3Uenhg9FpXieha74HPcA";
const configured = !SUPABASE_URL.startsWith("YOUR_") && !SUPABASE_ANON_KEY.startsWith("YOUR_");
const db = configured && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY,{global:{fetch:networkAwareFetch}}) : null;
const COURSES = ["Biochemistry","Histology","Physiology","Embryology","Gross Anatomy"];
const DEFAULT_THEME_COLOR = "#087f8c";
const PROFILE_PHOTO_BUCKET = "profile-photos";
const PROFILE_PHOTO_MAX_INPUT_BYTES = 10 * 1024 * 1024;
const PROFILE_PHOTO_MAX_BYTES = 512 * 1024;
const PROFILE_PHOTO_MAX_DIMENSION = 512;
const PAGE_STATE_TTL = 30 * 60 * 1000;
const DOCUMENT_BUCKET = "study-documents";
const NOTIFICATION_TTL_DAYS = 14;
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const FEATURE_OPTIONS = [
  ["classes","Class timetable"],
  ["exams","MB exam schedule and countdowns"],
  ["group_chat","Study-group chat"],
  ["quizzes","Quiz centre"],
  ["resources","Study resources"],
  ["leaderboards","Group leaderboards"],
  ["practice_scores","Manual practice-score entry"],
  ["announcements","Group announcements"],
  ["schedule_reminders","In-app class and exam reminders"],
  ["phone_class_notifications","Phone notifications for class start/end"]
];
const STREAK_MASCOTS=[
  {id:"chick",days:0,symbol:"🐣",name:"Chick"},
  {id:"fox",days:3,symbol:"🦊",name:"Fox"},
  {id:"panda",days:7,symbol:"🐼",name:"Panda"},
  {id:"dragon",days:14,symbol:"🐉",name:"Dragon"},
  {id:"unicorn",days:30,symbol:"🦄",name:"Unicorn"},
  {id:"evolving-fire",symbol:"🔥",name:"Evolving flame"},
  {id:"cat",symbol:"🐱",name:"Cat"},
  {id:"frog",symbol:"🐸",name:"Frog"},
  {id:"turtle",symbol:"🐢",name:"Turtle"}
];
const STREAK_FIRE_STAGES=[
  {days:0,name:"Ember",hue:"0deg",glow:"#ff8a00"},
  {days:3,name:"Golden flame",hue:"24deg",glow:"#ffc247"},
  {days:7,name:"Verdant flame",hue:"85deg",glow:"#93dc63"},
  {days:14,name:"Azure flame",hue:"190deg",glow:"#66cfff"},
  {days:30,name:"Cosmic flame",hue:"285deg",glow:"#c888ff"}
];
const DEFAULT_USER_PREFERENCES={
  language:"system",timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||"UTC",region:"global",
  darkMode:false,density:"comfortable",textSize:"medium",reduceMotion:false,noAutoplay:true,
  streakMascot:"evolving",
  highContrast:false,colorVision:"none",announcementAlerts:true,scheduleAlerts:true,quizFavorites:[],savedResourceIds:[],recentItems:[],resourceNotes:{},
  homeSections:{profile:true,tasks:true,focus:true,recent:true,leaderboard:true,courses:true,quickstart:true},focusDurationMinutes:25,weeklyQuizGoal:3,
  quietHours:false,quietStart:"22:00",quietEnd:"07:00",dailyPopupLimit:6,activityConsent:true,profileBannerPhoto:true
};
const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const loadingMessage = text => `<p class="muted loading-inline skeleton-loading" role="status" aria-live="polite"><span class="sr-only">${esc(text)}</span><span class="skeleton-line"></span><span class="skeleton-line skeleton-line-short"></span></p>`;
let currentUser=null,isAdmin=false,currentProfileRole="member",currentProfileGems=0,currentProfileLevel=1,currentProfileGemsEnabled=true,currentProfileGemSettings={unlocked_items:[],equipped_items:{}},selectedPresetAvatar="",unlockedQuizIds=new Set(),activityResetSyncAvailable=false,profileAcademicFieldsAvailable=true,authMode="login",quizzes=[],resources=[],adminQuizzes=[],adminResources=[],attempts=[],notifications=[],calendarNotifications=[],classSessions=[],mbExams=[],groupChatMessages=[],groupChatPresence=[],featureSettings=Object.fromEntries(FEATURE_OPTIONS.map(([key])=>[key,true])),userPreferences={...DEFAULT_USER_PREFERENCES},studyStreak={current:0,longest:0,lastActiveDate:null,syncStatus:""},studyTasks=[],studyTasksAvailable=true,streakCheckPending=false,queuedLiveNotices=[],scheduleDataLoaded=false,scheduleLoadError=null,notificationReadIds=new Set(),notificationRefreshTimer=null,chatRefreshTimer=null,chatHeartbeatTimer=null,chatTypingTimer=null,chatRecorder=null,chatRecordingStream=null,chatRecordingChunks=[],chatRecordingBlob=null,chatRecordingUrl=null,chatRecordingTimer=null,chatRecordingStartedAt=0,chatRecordingCancelled=false,chatAudioUrlCache=new Map(),activeBoard="overall",chart=null,resourceRenderId=0,recentRenderId=0,focusTimerInterval=null,focusEndsAt=0,focusRemainingSeconds=0,focusTimerPhase="focus",focusSessionStarted=false,activeTimetableDay=0,liveNoticeTimer=null,usageTimer=null,usageLastTick=null,activityPendingSeconds=0,activityLoggingUnavailable=false,adminUserRows=[],adminUserPage=1,adminUsersHaveMore=false,toastTimer=null,sessionExpiryTimer=null,sessionExpiryInProgress=false,fallbackSessionStartedAt=null,fallbackSessionUserId=null,profilePhotoFallback=null,shopCategory="themes",shopRarity="All";
let currentProfileXp=0,currentProfileVisuals={avatar_url:null,equipped_items:{}},publicProfileVisuals=new Map(),shopPreviewTimer=null;
const CHAT_AUDIO_BUCKET="group-chat-audio";
const CHAT_MAX_VOICE_SECONDS=60;
const CHAT_MAX_VOICE_BYTES=5*1024*1024;
const CHAT_HISTORY_LIMIT=300;
const resourceLinkCache=new Map();
let driveFiles=[],driveFilesLoaded=false,driveRequestId=0;
const pendingPhoneAlerts=new Set();
function userPreferencesKey(){return currentUser?"medstudy:preferences:"+currentUser.id:null}
function studyStreakCacheKey(){return currentUser?"medstudy:study-streak:"+currentUser.id:null}
function studyTasksKey(){return currentUser?"medstudy:study-tasks:"+currentUser.id:null}
function activityResetMarkerKey(){return currentUser?"medstudy:activity-reset-at:"+currentUser.id:null}
function loadStudyTasks(){
  studyTasks=[];studyTasksAvailable=true;
  const key=studyTasksKey();
  if(!key){renderStudyTasks();return}
  try{
    const saved=JSON.parse(localStorage.getItem(key)||"[]");
    if(!Array.isArray(saved)||saved.length>50)throw new Error("Saved task data has an unexpected format.");
    studyTasks=saved.map(task=>{
      if(!task||typeof task.id!=="string"||typeof task.title!=="string"||typeof task.completed!=="boolean"||
        (task.dueDate!==null&&task.dueDate!==""&&!/^\d{4}-\d{2}-\d{2}$/.test(task.dueDate))){
        throw new Error("A saved study task is invalid.");
      }
      return {id:task.id,title:task.title,dueDate:task.dueDate||"",completed:task.completed};
    });
  }catch(error){
    studyTasksAvailable=false;
    console.error("Could not load saved study tasks.",error);
    message("study-task-status","Saved study tasks could not be read. Clear this browser's site data only if you no longer need them.",true);
  }
  renderStudyTasks();
}
function saveStudyTasks(nextTasks){
  const key=studyTasksKey();
  if(!key||!studyTasksAvailable)return false;
  try{localStorage.setItem(key,JSON.stringify(nextTasks))}
  catch(error){
    console.error("Could not save study tasks.",error);
    message("study-task-status","Could not save your task. Check available browser storage and try again.",true);
    return false;
  }
  studyTasks=nextTasks;renderStudyTasks();return true;
}
function renderStudyTasks(){
  const list=$("study-task-list");
  if(!list)return;
  const form=$("study-task-form"),clearButton=$("study-task-clear-completed");
  form.querySelectorAll("input,button").forEach(control=>control.disabled=!studyTasksAvailable);
  clearButton.classList.toggle("hidden",!studyTasksAvailable||!studyTasks.some(task=>task.completed));
  const completeCount=studyTasks.filter(task=>task.completed).length;
  const remainingCount=studyTasks.length-completeCount;
  $("study-task-summary").textContent=studyTasks.length
    ?`${remainingCount} remaining · ${completeCount} completed`
    :"Plan a few focused tasks for your next study session.";
  if(studyTasksAvailable)$("study-task-status").textContent=studyTasks.length?"Your tasks are saved on this device for your account.":"";
  const today=localDateKey();
  const ordered=[...studyTasks].sort((a,b)=>{
    if(a.completed!==b.completed)return a.completed?1:-1;
    const aDue=a.dueDate||"9999-12-31",bDue=b.dueDate||"9999-12-31";
    return aDue.localeCompare(bDue);
  });
  list.innerHTML=ordered.length?ordered.map(task=>{
    const overdue=!task.completed&&task.dueDate&&task.dueDate<today;
    const dueText=task.dueDate?`Due ${formatDate(new Date(`${task.dueDate}T12:00:00`))}`:"No due date";
    return `<li class="study-task-item${task.completed?" is-complete":""}">
      <label class="study-task-toggle"><input type="checkbox" data-study-task-toggle="${esc(task.id)}" ${task.completed?"checked":""} aria-label="${task.completed?"Mark incomplete":"Complete"}: ${esc(task.title)}"><span class="study-task-copy"><strong>${esc(task.title)}</strong><small class="${overdue?"study-task-overdue":""}">${esc(overdue?"Overdue · "+dueText:dueText)}</small></span></label>
      <button class="study-task-remove" type="button" data-study-task-remove="${esc(task.id)}" aria-label="Remove task: ${esc(task.title)}">Remove</button>
    </li>`;
  }).join(""):'<li class="study-task-empty muted">No study tasks yet. Add one small next step to get started.</li>';
}
function localDateKeyInZone(timeZone=userPreferences.timeZone){
  const parts=new Intl.DateTimeFormat("en-CA",{timeZone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(new Date());
  const values=Object.fromEntries(parts.filter(part=>part.type!=="literal").map(part=>[part.type,part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
function sanitizeUserPreferences(saved={}){
  const merged={...DEFAULT_USER_PREFERENCES,...saved};
  if(!["system","en-GB","en-US"].includes(merged.language))merged.language="system";
  try{new Intl.DateTimeFormat("en",{timeZone:merged.timeZone})}
  catch{merged.timeZone=DEFAULT_USER_PREFERENCES.timeZone}
  if(!["global","east-africa","west-africa","southern-africa","middle-east","europe","americas","asia-pacific"].includes(merged.region))merged.region="global";
  if(!["comfortable","compact"].includes(merged.density))merged.density="comfortable";
  if(!["small","medium","large"].includes(merged.textSize))merged.textSize="medium";
  if(!["none","blue-orange","monochrome"].includes(merged.colorVision))merged.colorVision="none";
  if(merged.streakMascot!=="evolving"&&!STREAK_MASCOTS.some(mascot=>mascot.id===merged.streakMascot))merged.streakMascot="evolving";
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(merged.quietStart))merged.quietStart="22:00";
  if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(merged.quietEnd))merged.quietEnd="07:00";
  merged.dailyPopupLimit=Math.max(1,Math.min(20,Number.parseInt(merged.dailyPopupLimit,10)||6));
  merged.quizFavorites=Array.isArray(merged.quizFavorites)
    ?[...new Set(merged.quizFavorites.filter(id=>/^\d+$/.test(String(id))).map(String))].slice(0,500)
    :[];
  merged.savedResourceIds=Array.isArray(merged.savedResourceIds)
    ?[...new Set(merged.savedResourceIds.filter(id=>/^\d+$/.test(String(id))).map(String))].slice(0,500)
    :[];
  merged.recentItems=Array.isArray(merged.recentItems)
    ?merged.recentItems.filter(item=>item&&["quiz","resource"].includes(item.kind)&&/^\d+$/.test(String(item.id))&&Number.isFinite(Date.parse(item.visitedAt)))
      .slice(0,8).map(item=>({kind:item.kind,id:String(item.id),visitedAt:item.visitedAt}))
    :[];
  const resourceNotes=merged.resourceNotes&&typeof merged.resourceNotes==="object"&&!Array.isArray(merged.resourceNotes)?merged.resourceNotes:{};
  merged.resourceNotes=Object.fromEntries(Object.entries(resourceNotes).filter(([id,note])=>/^\d+$/.test(id)&&typeof note==="string").slice(0,50).map(([id,note])=>[id,note.slice(0,2000)]));
  const homeSections=merged.homeSections&&typeof merged.homeSections==="object"&&!Array.isArray(merged.homeSections)?merged.homeSections:{};
  merged.homeSections=Object.fromEntries(Object.keys(DEFAULT_USER_PREFERENCES.homeSections).map(key=>[key,homeSections[key]!==false]));
  merged.focusDurationMinutes=Math.max(1,Math.min(180,Number.parseInt(merged.focusDurationMinutes,10)||25));
  merged.weeklyQuizGoal=Math.max(1,Math.min(20,Number.parseInt(merged.weeklyQuizGoal,10)||3));
  ["darkMode","reduceMotion","noAutoplay","highContrast","announcementAlerts","scheduleAlerts","quietHours","activityConsent","profileBannerPhoto"].forEach(key=>merged[key]=merged[key]!==false&&merged[key]!==0);
  return merged;
}
function loadUserPreferences(){
  const key=userPreferencesKey();
  let saved={};
  try{saved=JSON.parse(localStorage.getItem(key)||"{}")}
  catch(error){console.warn("Could not load personal settings.",error)}
  return sanitizeUserPreferences(saved);
}
async function savePersonalPreferences(updates,statusId,successText){
  if(!currentUser)return false;
  userPreferences=sanitizeUserPreferences({...userPreferences,...updates});
  let localError=null;
  try{localStorage.setItem(userPreferencesKey(),JSON.stringify(userPreferences))}
  catch(error){localError=error;console.error("Could not save personal preferences on this device.",error)}
  try{
    const {error}=await db.from("profiles").update({preferences:userPreferences}).eq("id",currentUser.id);
    if(error){
      console.error("Could not sync personal preferences to the account.",error);
      message(statusId,`Saved on this device, but account sync failed: ${error.message}`,true);
      return false;
    }
    message(statusId,localError?`Synced to your account, but device storage failed: ${localError.message}`:successText,!!localError);
    return !localError;
  }catch(error){
    console.error("Could not sync personal preferences to the account.",error);
    message(statusId,`Saved on this device, but account sync failed: ${error.message}`,true);
    return false;
  }
}
function selectedLocale(){
  return userPreferences.language==="system"?(navigator.language||"en-GB"):userPreferences.language;
}
function formatDateTime(value,options={dateStyle:"medium",timeStyle:"short"}){
  const {timeZone=userPreferences.timeZone,...formatOptions}=options;
  return new Intl.DateTimeFormat(selectedLocale(),{...formatOptions,timeZone}).format(new Date(value));
}
function formatDate(value,options={dateStyle:"medium"}){
  const {timeZone=userPreferences.timeZone,...formatOptions}=options;
  return new Intl.DateTimeFormat(selectedLocale(),{...formatOptions,timeZone}).format(new Date(value));
}
function applyUserPreferences(){
  const body=document.body;
  body.classList.toggle("theme-dark",userPreferences.darkMode);
  body.classList.toggle("density-compact",userPreferences.density==="compact");
  body.classList.toggle("text-size-small",userPreferences.textSize==="small");
  body.classList.toggle("text-size-large",userPreferences.textSize==="large");
  body.classList.toggle("reduce-motion",userPreferences.reduceMotion);
  body.classList.toggle("high-contrast",userPreferences.highContrast);
  body.dataset.colorVision=userPreferences.colorVision;
  renderHomeSectionOptions();
  applyHomeSectionPreferences();
  if($("focus-duration"))$("focus-duration").value=String(userPreferences.focusDurationMinutes);
  renderNotifications();
  applyCurrentShopTheme();
  updateStreakMascots(studyStreak.current);
}
function renderHomeSectionOptions(){
  document.querySelectorAll("[data-home-section-toggle]").forEach(input=>{
    input.checked=userPreferences.homeSections[input.dataset.homeSectionToggle]!==false;
  });
}
function applyHomeSectionPreferences(){
  document.querySelectorAll("[data-home-section]").forEach(section=>{
    const key=section.dataset.homeSection;
    section.hidden=userPreferences.homeSections[key]===false||
      (key==="leaderboard"&&!featureEnabled("leaderboards"))||
      (key==="courses"&&!featureEnabled("quizzes"));
  });
}
function fillSettingsForm(){
  $("settings-language").value=userPreferences.language;
  $("settings-timezone").value=userPreferences.timeZone;
  $("settings-region").value=userPreferences.region;
  $("settings-dark-mode").checked=userPreferences.darkMode;
  $("settings-streak-mascot").value=userPreferences.streakMascot;
  $("settings-density").value=userPreferences.density;
  $("settings-text-size").value=userPreferences.textSize;
  $("settings-announcements").checked=userPreferences.announcementAlerts;
  $("settings-schedule-reminders").checked=userPreferences.scheduleAlerts;
  $("settings-quiet-enabled").checked=userPreferences.quietHours;
  $("settings-quiet-start").value=userPreferences.quietStart;
  $("settings-quiet-end").value=userPreferences.quietEnd;
  $("settings-notification-limit").value=String(userPreferences.dailyPopupLimit);
  $("settings-activity-consent").checked=userPreferences.activityConsent;
  $("settings-leaderboard-opt-in").checked=$("leaderboard-opt-in").checked;
  $("settings-reduce-motion").checked=userPreferences.reduceMotion;
  $("settings-no-autoplay").checked=userPreferences.noAutoplay;
  $("settings-high-contrast").checked=userPreferences.highContrast;
  $("settings-color-vision").value=userPreferences.colorVision;
  $("settings-accent-color").value=$("theme-color").value||"#087f8c";
  $("settings-device-name").textContent=`This browser · ${navigator.userAgentData?.platform||navigator.platform||"device"}`;
}
function populateTimeZones(){
  const select=$("settings-timezone");
  const zones=typeof Intl.supportedValuesOf==="function"?Intl.supportedValuesOf("timeZone"):["UTC","Africa/Kampala","Africa/Nairobi","Africa/Lagos","Europe/London","Europe/Paris","America/New_York","America/Los_Angeles","Asia/Dubai","Asia/Kolkata","Asia/Tokyo","Australia/Sydney"];
  const current=DEFAULT_USER_PREFERENCES.timeZone;
  if(!zones.includes(current))zones.push(current);
  if(!zones.includes("UTC"))zones.push("UTC");
  select.innerHTML=zones.sort().map(zone=>`<option value="${esc(zone)}">${esc(zone.replace(/_/g," "))}</option>`).join("");
}
function animateCountUp(element,target,decimals=0,suffix=""){
  const value=Number(target);
  if(!element||!Number.isFinite(value))return;
  if(userPreferences.reduceMotion||window.matchMedia("(prefers-reduced-motion: reduce)").matches){element.textContent=value.toFixed(decimals)+suffix;return}
  const start=performance.now(),duration=650;
  const tick=now=>{
    const progress=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-progress,3);
    element.textContent=(value*eased).toFixed(decimals)+suffix;
    if(progress<1)requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function networkAwareFetch(input,init){
  return window.fetch(input,init).catch(error=>{
    if(error instanceof TypeError)window.dispatchEvent(new CustomEvent("medstudy:network-error",{detail:error}));
    throw error;
  });
}
function message(id,text,error=false){const e=$(id);if(e){e.textContent=text;e.classList.toggle("error",error);}}
function safeUrl(v){try{const u=new URL(v);return ["https:","http:"].includes(u.protocol)}catch{return false}}
function pageStateKey(){return currentUser?"medstudy:last-page:"+currentUser.id:null}
function authSessionKey(userId){return "medstudy:session-start:"+userId}
function notificationReadKey(){return currentUser?"medstudy:read-notifications:"+currentUser.id:null}
function calendarNoticeKey(){return currentUser?"medstudy:calendar-notifications:"+currentUser.id:null}
function notificationResetMarkerKey(){return currentUser?"medstudy:notification-reset-at:"+currentUser.id:null}
function dismissedCalendarNoticesKey(){return currentUser?"medstudy:dismissed-calendar-notices:"+currentUser.id:null}
function websiteUsageKey(){return currentUser?"medstudy:website-usage:"+currentUser.id:null}
function classPhoneAlertsKey(){return currentUser?"medstudy:phone-class-alerts:"+currentUser.id:null}
function sentClassPhoneAlertsKey(){return currentUser?"medstudy:sent-phone-class-alerts:"+currentUser.id:null}
function weekdayIndex(date=new Date()){const index=(date.getDay()+6)%7;return index>4?0:index}
function dayNumber(date=new Date()){const day=date.getDay();return day===0?7:day}
function localDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function localEndOfDay(date=new Date()){return new Date(date.getFullYear(),date.getMonth(),date.getDate()+1).toISOString()}
function formatTime(value){
  if(!value)return "";
  const [hours,minutes]=value.split(":").map(Number),date=new Date();
  date.setHours(hours,minutes,0,0);
  return date.toLocaleTimeString(selectedLocale(),{hour:"numeric",minute:"2-digit"});
}
function formatDuration(milliseconds){
  const mins=Math.floor(milliseconds/60000),hours=Math.floor(mins/60),days=Math.floor(hours/24);
  if(days)return `${days}d ${hours%24}h`;
  if(hours)return `${hours}h ${mins%60}m`;
  return `${mins}m`;
}
function loadWebsiteUsage(){
  try{const value=Number(localStorage.getItem(websiteUsageKey())||0);return Number.isFinite(value)&&value>0?value:0}
  catch(error){console.warn("Could not load website usage.",error);return 0}
}
function saveWebsiteUsage(milliseconds){
  try{localStorage.setItem(websiteUsageKey(),String(milliseconds))}
  catch(error){console.warn("Could not save website usage.",error)}
}
function loadDismissedCalendarNoticeIds(){
  try{
    const saved=JSON.parse(localStorage.getItem(dismissedCalendarNoticesKey())||"[]");
    return new Set(Array.isArray(saved)?saved.map(String):[]);
  }catch(error){console.warn("Could not load cleared reminder state.",error);return new Set()}
}
function applyActivityResetMarker(resetAt,force=false){
  if(!currentUser)return false;
  const resetTime=new Date(resetAt).getTime();
  if(!Number.isFinite(resetTime))return false;
  const markerKey=activityResetMarkerKey();
  let previousTime=0;
  try{previousTime=Number(localStorage.getItem(markerKey)||0)}
  catch(error){console.warn("Could not read the activity reset marker.",error)}
  if(!force&&resetTime<=previousTime)return false;
  try{
    localStorage.removeItem(websiteUsageKey());
    localStorage.removeItem(studyStreakCacheKey());
    localStorage.setItem(markerKey,String(resetTime));
  }catch(error){console.error("Could not clear this browser's saved activity totals.",error);return false}
  activityPendingSeconds=0;
  usageLastTick=document.visibilityState==="visible"?Date.now():null;
  studyStreak={current:0,longest:0,lastActiveDate:null,syncStatus:"Your study data was reset. A new streak starts with your next daily check-in."};
  renderStudyStreak();renderWebsiteUsage();
  return true;
}
function applyNotificationResetMarker(resetAt,force=false){
  if(!currentUser)return false;
  const resetTime=new Date(resetAt).getTime();
  if(!Number.isFinite(resetTime))return false;
  const markerKey=notificationResetMarkerKey();
  let previousTime=0;
  try{previousTime=Number(localStorage.getItem(markerKey)||0)}
  catch(error){console.warn("Could not read the notification reset marker.",error)}
  if(!force&&resetTime<=previousTime)return false;
  const dismissed=loadDismissedCalendarNoticeIds();
  calendarNotifications.forEach(item=>{
    const createdAt=new Date(item.created_at).getTime();
    if(Number.isFinite(createdAt)&&createdAt<=resetTime)dismissed.add(String(item.id));
  });
  calendarNotifications=calendarNotifications.filter(item=>new Date(item.created_at).getTime()>resetTime);
  try{
    localStorage.setItem(markerKey,String(resetTime));
    localStorage.setItem(dismissedCalendarNoticesKey(),JSON.stringify([...dismissed].slice(-500)));
  }catch(error){console.error("Could not save the notification reset state for this browser.",error)}
  saveCalendarNotices();renderNotifications();
  return true;
}
async function recordUserActivity(eventType,page=null,activeSeconds=0){
  if(!currentUser||!db||activityLoggingUnavailable||!userPreferences.activityConsent)return;
  try{
    const {error}=await db.from("user_activity_log").insert({
      user_id:currentUser.id,event_type:eventType,page,
      active_seconds:Math.max(0,Math.min(60,Math.floor(activeSeconds)))
    });
    if(error){
      console.error("Could not record website activity.",error);
      if(error.code==="PGRST205")activityLoggingUnavailable=true;
    }
  }catch(error){console.error("Could not record website activity.",error)}
}
async function recordActiveTime(seconds,page){
  if(!currentUser||!db||activityLoggingUnavailable||!userPreferences.activityConsent)return;
  try{
    const {error}=await db.rpc("record_user_active_time",{p_active_seconds:seconds,p_page:page});
    if(error){
      console.error("Could not record active website time.",error);
      if(error.code==="PGRST202")activityLoggingUnavailable=true;
    }
  }catch(error){console.error("Could not record active website time.",error)}
}
function flushActivityTime(final=false){
  const writes=[];
  while(activityPendingSeconds>=60){
    activityPendingSeconds-=60;
    writes.push(recordActiveTime(60,document.querySelector(".page:not(.hidden)")?.id.replace(/^page-/,"")||null));
  }
  if(final&&activityPendingSeconds>0){
    const seconds=activityPendingSeconds;activityPendingSeconds=0;
    writes.push(recordActiveTime(seconds,document.querySelector(".page:not(.hidden)")?.id.replace(/^page-/,"")||null));
  }
  return Promise.all(writes);
}
function calendarNoticeIsCurrent(item,now=new Date()){
  const nowMs=now.getTime(),createdAt=new Date(item?.created_at).getTime(),expiresAt=new Date(item?.expires_at).getTime();
  const classDate=/^class-.+-(\d{4}-\d{2}-\d{2})-(?:start|end)$/.exec(String(item?.id||""));
  return !!item?.id&&Number.isFinite(createdAt)&&createdAt<=nowMs&&nowMs-createdAt<=NOTIFICATION_TTL_DAYS*DAY_MILLISECONDS&&
    (!item.expires_at||Number.isFinite(expiresAt)&&expiresAt>nowMs)&&(!classDate||classDate[1]===localDateKey(now));
}
function pruneExpiredCalendarNotices(now=new Date()){
  const active=calendarNotifications.filter(item=>calendarNoticeIsCurrent(item,now));
  if(active.length===calendarNotifications.length)return false;
  calendarNotifications=active;saveCalendarNotices();return true;
}
function loadCalendarNotices(){
  try{
    const saved=JSON.parse(localStorage.getItem(calendarNoticeKey())||"[]");
    const resetAt=Number(localStorage.getItem(notificationResetMarkerKey())||0),dismissed=loadDismissedCalendarNoticeIds();
    const stored=Array.isArray(saved)?saved:[];
    calendarNotifications=stored.filter(item=>new Date(item?.created_at).getTime()>resetAt&&calendarNoticeIsCurrent(item)&&!dismissed.has(String(item.id)));
    if(calendarNotifications.length!==stored.length)saveCalendarNotices();
  }catch(error){console.warn("Could not load class and exam reminders.",error);calendarNotifications=[]}
}
function saveCalendarNotices(){
  try{localStorage.setItem(calendarNoticeKey(),JSON.stringify(calendarNotifications.slice(0,100)))}
  catch(error){console.warn("Could not save class and exam reminders.",error)}
}
function featureEnabled(key){return featureSettings[key]!==false}
function allNotifications(){
  pruneExpiredCalendarNotices();
  const announcements=featureEnabled("announcements")&&userPreferences.announcementAlerts?notifications:[];
  const reminders=featureEnabled("schedule_reminders")&&userPreferences.scheduleAlerts?calendarNotifications:[];
  return [...announcements,...reminders].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
}
function insideQuietHours(){
  if(!userPreferences.quietHours)return false;
  const parts=new Intl.DateTimeFormat("en-GB",{timeZone:userPreferences.timeZone,hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date());
  const values=Object.fromEntries(parts.filter(part=>part.type!=="literal").map(part=>[part.type,Number(part.value)]));
  const current=values.hour*60+values.minute;
  const [startHour,startMinute]=userPreferences.quietStart.split(":").map(Number),[endHour,endMinute]=userPreferences.quietEnd.split(":").map(Number);
  const start=startHour*60+startMinute,end=endHour*60+endMinute;
  return start===end?true:start<end?current>=start&&current<end:current>=start||current<end;
}
function allowSchedulePopup(){
  if(insideQuietHours())return false;
  const key=`medstudy:reminder-popups:${currentUser.id}:${localDateKeyInZone()}`;
  try{
    const count=Number(localStorage.getItem(key)||0);
    if(count>=userPreferences.dailyPopupLimit)return false;
    localStorage.setItem(key,String(count+1));return true;
  }catch(error){console.warn("Could not apply reminder popup limits.",error);return true}
}
function showLiveNotice(title,body){
  if(streakCheckPending||$("streak-modal").classList.contains("is-open")){
    queuedLiveNotices.push({title,body});queuedLiveNotices=queuedLiveNotices.slice(-5);return;
  }
  const region=$("live-notice-region");
  region.innerHTML=`<article class="live-notice"><strong>${esc(title)}</strong><p>${esc(body)}</p></article>`;
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{region.innerHTML=""},8000);
}
function flushQueuedLiveNotices(){
  if(streakCheckPending||$("streak-modal").classList.contains("is-open")||!queuedLiveNotices.length)return;
  const notice=queuedLiveNotices.shift();showLiveNotice(notice.title,notice.body);
  if(queuedLiveNotices.length)setTimeout(flushQueuedLiveNotices,8100);
}
function showNetworkNotice(){
  showLiveNotice("Connection problem","Your session may have expired. Check your network connection, then log in again if needed.");
}
window.addEventListener("offline",showNetworkNotice);
window.addEventListener("medstudy:network-error",showNetworkNotice);
window.addEventListener("online",()=>showLiveNotice("Connection restored","Your network is back. You can retry the action."));
function getSessionStartedAt(userId){
  const key=authSessionKey(userId);
  try{
    const saved=Number(localStorage.getItem(key));
    if(Number.isFinite(saved)&&saved>0&&saved<=Date.now())return saved;
    const startedAt=Date.now();localStorage.setItem(key,String(startedAt));return startedAt;
  }catch(error){
    console.warn("Could not read the login session age.",error);
    if(fallbackSessionUserId!==userId){fallbackSessionUserId=userId;fallbackSessionStartedAt=Date.now()}
    return fallbackSessionStartedAt;
  }
}
function clearSessionStartedAt(userId){
  if(!userId)return;
  if(fallbackSessionUserId===userId){fallbackSessionUserId=null;fallbackSessionStartedAt=null}
  try{localStorage.removeItem(authSessionKey(userId))}
  catch(error){console.warn("Could not clear the login session age.",error)}
}
function resetSessionStartedAt(userId){
  fallbackSessionUserId=userId;fallbackSessionStartedAt=Date.now();
  try{localStorage.setItem(authSessionKey(userId),String(Date.now()))}
  catch(error){console.warn("Could not save the login session age.",error)}
}
async function expireAuthSession(){
  if(!currentUser||sessionExpiryInProgress)return;
  sessionExpiryInProgress=true;
  const expiredUser=currentUser;
  try{
    const {error}=await db.auth.signOut({scope:"local"});
    if(error)throw error;
    clearSessionStartedAt(expiredUser.id);
    if(currentUser?.id===expiredUser.id)signedOut();
    showLiveNotice("Session expired","You have been logged out after 24 hours. Please log in again.");
  }catch(error){
    console.error("Could not end the expired login session.",error);
    if(currentUser?.id===expiredUser.id){
      showLiveNotice("Session expired","Could not end the saved session. Check your network connection and reload to sign in again.");
      sessionExpiryTimer=setTimeout(()=>void expireAuthSession(),60*1000);
    }
  }finally{sessionExpiryInProgress=false}
}
function startSessionExpiryTimer(userId){
  if(sessionExpiryTimer)clearTimeout(sessionExpiryTimer);
  const expiresAt=getSessionStartedAt(userId)+SESSION_MAX_AGE;
  const check=()=>{
    if(!currentUser||currentUser.id!==userId)return;
    const remaining=expiresAt-Date.now();
    if(remaining<=0){void expireAuthSession();return}
    sessionExpiryTimer=setTimeout(check,Math.min(remaining,60*1000));
  };
  check();
}
window.addEventListener("focus",()=>{
  if(currentUser&&Date.now()-getSessionStartedAt(currentUser.id)>=SESSION_MAX_AGE)void expireAuthSession();
  else if(currentUser)void syncActivityResetMarker(true);
});
function addCalendarNotice(id,title,body,expiresAt){
  if(calendarNotifications.some(item=>item.id===id)||loadDismissedCalendarNoticeIds().has(String(id)))return;
  const created_at=new Date().toISOString();
  calendarNotifications.unshift({id,title,body,created_at,expires_at:expiresAt||new Date(Date.now()+NOTIFICATION_TTL_DAYS*DAY_MILLISECONDS).toISOString()});
  calendarNotifications=calendarNotifications.slice(0,100);
  saveCalendarNotices();renderNotifications();
  if(currentUser&&allowSchedulePopup())showLiveNotice(title,body);
}
function closeStreakCelebration(){
  const modal=$("streak-modal");if(!modal)return;
  modal.querySelector("[data-streak-mascot]")?.classList.remove("is-celebrating");
  modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");document.body.classList.remove("dialog-open");
  flushQueuedLiveNotices();
}
function updateStreakMascots(days,selection=userPreferences.streakMascot){
  const stages=STREAK_MASCOTS.filter(item=>Number.isFinite(item.days));
  const fireStage=[...STREAK_FIRE_STAGES].reverse().find(stage=>days>=stage.days)||STREAK_FIRE_STAGES[0];
  const evolvingFire=selection==="evolving-fire";
  const mascot=evolvingFire
    ?{symbol:"🔥",name:fireStage.name}
    :selection==="evolving"
    ?[...stages].reverse().find(item=>days>=item.days)||stages[0]
    :STREAK_MASCOTS.find(item=>item.id===selection)||stages[0];
  document.querySelectorAll("[data-streak-mascot]").forEach(element=>{
    element.textContent=mascot.symbol;
    element.title=evolvingFire?`${mascot.name} · ${Math.max(0,days)}-day streak`:`${mascot.name} study buddy`;
    element.classList.toggle("streak-mascot-fire",evolvingFire);
    if(evolvingFire){
      element.style.setProperty("--streak-fire-hue",fireStage.hue);
      element.style.setProperty("--streak-fire-glow",fireStage.glow);
    }else{
      element.style.removeProperty("--streak-fire-hue");
      element.style.removeProperty("--streak-fire-glow");
    }
  });
  return mascot;
}
function showStreakCelebration(shouldShow,wasReset=false){
  if(!shouldShow)return;
  const count=studyStreak.current;
  const mascot=updateStreakMascots(count);
  $("streak-modal-title").textContent=wasReset?"Let's start a new streak!":count===1?"Your first day starts today!":`${mascot.name}, that's a streak!`;
  $("streak-modal-description").textContent=wasReset
    ?"Your previous streak ended after a missed day. Today is day one of a fresh start."
    :count===1?"You checked in today. Come back tomorrow to keep your streak going.":`You've studied on ${count} consecutive days. Your ${mascot.name.toLowerCase()} study buddy is cheering you on!`;
  $("streak-modal-count").textContent="0";
  $("streak-modal-status").textContent=studyStreak.syncStatus;
  if(wasReset){
    const restore=$("restore-streak-gems");
    if(restore)restore.classList.remove("hidden");
  }
  const modal=$("streak-modal"),modalMascot=modal.querySelector("[data-streak-mascot]");
  modal.classList.add("is-open");modal.setAttribute("aria-hidden","false");document.body.classList.add("dialog-open");
  modalMascot.classList.remove("is-celebrating");void modalMascot.offsetWidth;modalMascot.classList.add("is-celebrating");
  animateCountUp($("streak-modal-count"),count);
  void playStreakSound();
}
let streakSoundAudio=null;
async function playStreakSound(){
  try{
    const {data}=await db.from("app_settings").select("value").eq("key","streak_sound_url").maybeSingle();
    if(data?.value){
      streakSoundAudio=new Audio(data.value);await streakSoundAudio.play();return;
    }
  }catch(error){console.info("Using the built-in streak chime.",error)}
  try{
    const context=new (window.AudioContext||window.webkitAudioContext)();
    const oscillator=context.createOscillator(),gain=context.createGain();
    oscillator.type="sine";oscillator.frequency.setValueAtTime(660,context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880,context.currentTime+.12);
    gain.gain.setValueAtTime(.0001,context.currentTime);gain.gain.exponentialRampToValueAtTime(.12,context.currentTime+.02);
    gain.gain.exponentialRampToValueAtTime(.0001,context.currentTime+.35);
    oscillator.connect(gain);gain.connect(context.destination);oscillator.start();oscillator.stop(context.currentTime+.36);
  }catch(error){console.info("Browser autoplay blocked the streak chime.",error)}
}
function renderStudyStreak(){
  const current=Math.max(0,Number(studyStreak.current)||0),longest=Math.max(current,Number(studyStreak.longest)||0);
  const mascot=updateStreakMascots(current);
  $("streak-chip-count").textContent=String(current);
  $("streak-current-count").textContent="0";$("streak-best-count").textContent="0";
  animateCountUp($("streak-current-count"),current);animateCountUp($("streak-best-count"),longest);
  $("streak-last-date").textContent=studyStreak.lastActiveDate
    ?new Intl.DateTimeFormat(selectedLocale(),{dateStyle:"medium",timeZone:"UTC"}).format(new Date(`${studyStreak.lastActiveDate}T12:00:00Z`))
    :"—";
  $("streak-summary").textContent=current
    ?`${current} consecutive day${current===1?"":"s"} so far. Your ${mascot.name.toLowerCase()} buddy is cheering you on; your longest streak is ${longest} day${longest===1?"":"s"}.`
    :"Visit each day to meet your study buddy and start building a streak.";
  const progress=current?current%7||7:0;
  $("streak-progress-fill").style.width=`${progress/7*100}%`;
  $("streak-progress").querySelector('[role="progressbar"]').setAttribute("aria-valuenow",String(progress));
  $("streak-sync-status").textContent=studyStreak.syncStatus;
  renderProfileMetrics();
}
function recordLocalStudyDay(){
  const today=localDateKeyInZone(),key=studyStreakCacheKey();
  let previous=null,storageAvailable=true;
  try{previous=JSON.parse(localStorage.getItem(key)||"null")}
  catch(error){storageAvailable=false;console.warn("Could not read the local study streak.",error)}
  let current=1,longest=Number(previous?.longest)||0,reset=false,shouldShow=true;
  if(previous?.lastActiveDate){
    const gap=Math.round((Date.parse(`${today}T00:00:00Z`)-Date.parse(`${previous.lastActiveDate}T00:00:00Z`))/DAY_MILLISECONDS);
    if(gap===0){current=Number(previous.current)||1;shouldShow=false}
    else if(gap===1)current=(Number(previous.current)||0)+1;
    else{reset=(Number(previous.current)||0)>0;current=1}
  }
  longest=Math.max(longest,current);
  try{localStorage.setItem(key,JSON.stringify({current,longest,lastActiveDate:today}))}
  catch(error){storageAvailable=false;console.warn("Could not save the local study streak.",error)}
  return {current,longest,lastActiveDate:today,shouldShow,streakReset:reset,storageAvailable};
}
async function loadStudyStreak(){
  if(!currentUser)return;
  const userId=currentUser.id;
  try{
    const {data,error}=await db.rpc("record_daily_study_streak",{p_time_zone:userPreferences.timeZone});
    if(error)throw error;
    if(currentUser?.id!==userId)return;
    const row=Array.isArray(data)?data[0]:data;
    if(!row)throw new Error("The streak service returned no result.");
    studyStreak={
      current:Number(row.current_streak)||0,longest:Number(row.longest_streak)||0,
      lastActiveDate:row.last_active_date||null,syncStatus:"Synced across your devices."
    };
    let alreadyWelcomedToday=false;
    try{alreadyWelcomedToday=JSON.parse(localStorage.getItem(studyStreakCacheKey())||"null")?.lastActiveDate===studyStreak.lastActiveDate}
    catch(storageError){console.warn("Could not check the local streak welcome state.",storageError)}
    try{localStorage.setItem(studyStreakCacheKey(),JSON.stringify({current:studyStreak.current,longest:studyStreak.longest,lastActiveDate:studyStreak.lastActiveDate}))}
    catch(storageError){console.warn("Could not cache the study streak.",storageError)}
    renderStudyStreak();showStreakCelebration(!!row.should_show&&!alreadyWelcomedToday,!!row.streak_reset);
  }catch(error){
    if(currentUser?.id!==userId)return;
    console.error("Could not sync the study streak.",error);
    const local=recordLocalStudyDay();
    const syncMessage=!local.storageAvailable
      ?"Browser storage is unavailable, so the streak may not persist."
      :error.code==="PGRST202"||error.code==="PGRST205"
      ?"Run the latest schema.sql to enable cross-device streaks."
      :"Cloud sync failed: "+error.message;
    studyStreak={current:local.current,longest:local.longest,lastActiveDate:local.lastActiveDate,syncStatus:`This streak is stored on this browser only. ${syncMessage}`};
    renderStudyStreak();showStreakCelebration(local.shouldShow,local.streakReset);
  }finally{if(currentUser?.id===userId){streakCheckPending=false;flushQueuedLiveNotices()}}
}
function loadSentPhoneAlertIds(){
  try{const saved=JSON.parse(localStorage.getItem(sentClassPhoneAlertsKey())||"[]");return new Set(Array.isArray(saved)?saved.map(String):[])}
  catch(error){console.warn("Could not load sent phone alert state.",error);return new Set()}
}
async function showPhoneClassNotice(id,title,body){
  if(!featureEnabled("phone_class_notifications")||!featureEnabled("classes"))return;
  try{
    if(localStorage.getItem(classPhoneAlertsKey())!=="true"||!("Notification" in window)||Notification.permission!=="granted")return;
    const sent=loadSentPhoneAlertIds();if(sent.has(id)||pendingPhoneAlerts.has(id))return;
    pendingPhoneAlerts.add(id);
    const options={body,tag:id,icon:"./icon-192.png",badge:"./icon-192.png"};
    try{
      const notification=new Notification(title,options);
      notification.onclick=()=>{window.focus();showPage("classes");notification.close()};
      sent.add(id);localStorage.setItem(sentClassPhoneAlertsKey(),JSON.stringify([...sent].slice(-100)));
    }finally{pendingPhoneAlerts.delete(id)}
  }catch(error){console.warn("Could not send a phone class notification.",error)}
}
function updateClassNotificationControls(){
  const button=$("enable-class-phone-notifications");if(!button||!currentUser)return;
  const enabled=featureEnabled("phone_class_notifications");
  let optedIn=false;try{optedIn=localStorage.getItem(classPhoneAlertsKey())==="true"}catch(error){console.warn("Could not read phone notification preference.",error)}
  button.disabled=!enabled||!("Notification" in window)||!window.isSecureContext;
  button.textContent=optedIn?"Disable phone class alerts":"Enable phone class alerts";
  $("class-notification-status").textContent=!enabled?"Phone alerts are disabled by the administrator."
    :!("Notification" in window)?"This browser does not support phone notifications."
    :!window.isSecureContext?"Phone notifications require a secure (HTTPS) connection."
    :Notification.permission==="denied"?"Notifications are blocked by your browser or operating system. Allow them for this site in browser settings; MedStudy Hub cannot bypass that."
    :optedIn?"Alerts are enabled on this browser while MedStudy Hub is open. Closed-app delivery requires Web Push.":"Allow notifications to receive class start/end alerts while the hub is open.";
}
function phoneClassAlertsEnabled(){
  try{return featureEnabled("phone_class_notifications")&&localStorage.getItem(classPhoneAlertsKey())==="true"}
  catch(error){console.warn("Could not read phone notification preference.",error);return false}
}
async function toggleClassPhoneNotifications(){
  if(!featureEnabled("phone_class_notifications"))return;
  try{
    if(localStorage.getItem(classPhoneAlertsKey())==="true"){
      localStorage.removeItem(classPhoneAlertsKey());updateClassNotificationControls();return;
    }
    if(!("Notification" in window)){message("class-notification-status","This browser does not support phone notifications.",true);return}
    if(!window.isSecureContext){message("class-notification-status","Phone notifications require a secure (HTTPS) connection.",true);return}
    const permission=Notification.permission==="granted"? "granted" : await Notification.requestPermission();
    if(permission!=="granted"){message("class-notification-status","Notification permission was not granted. Allow notifications for this site in browser or phone settings, then try again.",true);return}
    localStorage.setItem(classPhoneAlertsKey(),"true");
    updateClassNotificationControls();
    try{
      new Notification("Class alerts enabled",{body:"You will be notified when a scheduled class starts or ends while MedStudy Hub is open.",icon:"./icon-192.png"});
    }catch(error){
      console.error("Could not display the class notification test.",error);
      message("class-notification-status","Alerts are enabled on this browser, but the test notification could not be displayed: "+error.message,true);return;
    }
    message("class-notification-status","Alerts are enabled on this browser while MedStudy Hub is open. Closed-app delivery requires Web Push.");
  }catch(error){
    console.error("Could not enable phone class notifications.",error);updateClassNotificationControls();
    message("class-notification-status","Could not enable notifications: "+error.message,true);
  }
}
function loadNotificationReadIds(){
  const key=notificationReadKey();if(!key)return new Set();
  try{const saved=JSON.parse(localStorage.getItem(key)||"[]");return new Set(Array.isArray(saved)?saved.map(String):[])}
  catch(error){console.warn("Could not load notification read state.",error);return new Set()}
}
function saveNotificationReadIds(){
  const key=notificationReadKey();if(!key)return;
  try{localStorage.setItem(key,JSON.stringify([...notificationReadIds]))}
  catch(error){console.warn("Could not save notification read state.",error)}
}
function saveLastPage(page){
  const key=pageStateKey();if(!key)return;
  try{localStorage.setItem(key,JSON.stringify({page,savedAt:Date.now()}))}
  catch(error){console.warn("Could not save the last visited page.",error)}
}
function getLastPage(){
  const key=pageStateKey();if(!key)return "home";
  try{
    const saved=JSON.parse(localStorage.getItem(key)||"null"),age=saved?Date.now()-saved.savedAt:Infinity;
    const allowed=["home","quizzes","classes","progress","resources","profile","admin"];
    if(!saved||!allowed.includes(saved.page)||!Number.isFinite(age)||age<0||age>PAGE_STATE_TTL){
      localStorage.removeItem(key);return "home";
    }
    if(saved.page==="admin"&&!isAdmin)return "home";
    return saved.page;
  }catch(error){console.warn("Could not restore the last visited page.",error);return "home"}
}
function courseSelects(){
  ["quiz-course-filter","resource-course-filter","score-course","admin-quiz-course","admin-resource-course","admin-class-course","admin-exam-course","favorite-subject"].forEach(id=>{
    const el=$(id);if(!el)return;const all=["quiz-course-filter","resource-course-filter"].includes(id);
    const optional=id==="favorite-subject";
    el.innerHTML=(all?'<option value="all">All courses</option>':"")+(optional?'<option value="">Select a subject</option>':"")+COURSES.map(c=>`<option>${esc(c)}</option>`).join("");
  });
}
function setProfileIdentity(name){
  const displayName=(name||"Student").trim()||"Student";
  $("user-display-name").textContent=displayName;
  document.querySelectorAll(".avatar-initials").forEach(initials=>{
    initials.textContent=displayName.split(/\s+/).slice(0,2).map(part=>part.charAt(0).toUpperCase()).join("")||"S";
  });
}
function profilePhotoKey(userId=currentUser?.id){
  return userId?`medstudy:profile-photo:${userId}`:null;
}
function profilePhotoPublicUrl(userId=currentUser?.id,cacheBust=true){
  if(!db||!userId)return null;
  const {data}=db.storage.from(PROFILE_PHOTO_BUCKET).getPublicUrl(`${userId}/avatar.webp`);
  return cacheBust?`${data.publicUrl}?v=${Date.now()}`:data.publicUrl;
}
function shopItem(itemId){
  return (window.SHOP_CATALOG||[]).find(item=>item.id===itemId)||null;
}
function avatarTitle(profile){
  const equipped=profile?.equipped_items||{};
  const title=shopItem(equipped.title);
  return title?.slot==="title"?title:null;
}
function avatarMarkup(name,userId,className="member-avatar",providedProfile=null){
  const displayName=(name||"Student").trim()||"Student";
  const initials=displayName.split(/\s+/).slice(0,2).map(part=>part.charAt(0).toUpperCase()).join("")||"S";
  const profile=providedProfile||(userId===currentUser?.id?currentProfileVisuals:publicProfileVisuals.get(userId))||{};
  const equipped=profile.equipped_items&&typeof profile.equipped_items==="object"?profile.equipped_items:{};
  const preset=MEDICAL_AVATAR_PRESETS.find(item=>item.id===equipped.avatar);
  const outfit=shopItem(equipped.outfit||equipped.scrubs);
  const accessory=shopItem(equipped.accessory);
  const frame=shopItem(equipped.frame);
  const photoUrl=typeof profile.avatar_url==="string"&&/^https:\/\//i.test(profile.avatar_url)?profile.avatar_url:null;
  const localPhoto=userId===currentUser?.id&&typeof profile.avatar_url==="string"&&/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(profile.avatar_url)?profile.avatar_url:null;
  const photo=photoUrl||localPhoto;
  const fallback=preset
    ?`<span class="avatar-symbol" style="--avatar-color:${preset.color}" aria-label="${esc(preset.label)}">${preset.symbol}</span>`
    :`<span class="avatar-initials">${esc(initials)}</span>`;
  const fallbackImage=photoUrl&&userId===currentUser?.id&&profilePhotoFallback?` data-fallback="${esc(profilePhotoFallback)}"`:"";
  const frameColor=frame?.color||"transparent";
  const frameClass=frame?` avatar-frame-${esc(frame.id)}`:"";
  const outfitMark=outfit?`<span class="avatar-cosmetic avatar-outfit" style="--cosmetic-color:${outfit.color||"#087f8c"}" title="${esc(outfit.name)}" aria-hidden="true">${outfit.symbol||"🥼"}</span>`:"";
  const accessoryMark=accessory?`<span class="avatar-cosmetic avatar-accessory" style="--cosmetic-color:${accessory.color||"#087f8c"}" title="${esc(accessory.name)}" aria-hidden="true">${accessory.symbol||"✦"}</span>`:"";
  return `<span class="${esc(className)} avatar-mark${frame?" has-frame":""}${frameClass}${photo?" has-photo":""}" style="--avatar-frame:${frameColor};--avatar-bg:${outfit?.color||preset?.color||"var(--mint)"}" aria-hidden="true"><span class="avatar-fallback">${fallback}</span>${photo?`<img class="avatar-image" src="${esc(photo)}" alt="" loading="lazy"${fallbackImage} onerror="if(this.dataset.fallback){this.src=this.dataset.fallback;this.dataset.fallback=''}else{this.parentElement.classList.remove('has-photo');this.remove()}">`:""}${outfitMark}${accessoryMark}</span>`;
}
function setProfilePhoto(photo,fallbackPhoto=null){
  const validPhoto=typeof photo==="string"&&(/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(photo)||/^https:\/\/[^"\s]+$/i.test(photo));
  profilePhotoFallback=fallbackPhoto;
  currentProfileVisuals.avatar_url=validPhoto?photo:null;
  renderCurrentAvatar();
  const cover=$("profile-cover-image");
  if(cover){
    const showPhoto=validPhoto&&userPreferences.profileBannerPhoto;
    cover.classList.toggle("hidden",!showPhoto);
    if(showPhoto){cover.onerror=()=>{if(profilePhotoFallback){cover.onerror=null;cover.src=profilePhotoFallback}else cover.classList.add("hidden")};cover.src=photo}
    else cover.removeAttribute("src");
  }
}
function renderCurrentAvatar(){
  const displayName=$("display-name")?.value||currentUser?.user_metadata?.full_name||"Student";
  const markup=avatarMarkup(displayName,currentUser?.id,"profile-avatar-art",currentProfileVisuals);
  document.querySelectorAll(".user-avatar,.home-profile-avatar,.profile-avatar").forEach(element=>{element.innerHTML=markup});
  const title=avatarTitle(currentProfileVisuals);
  const titleElement=$("profile-hero-title");
  if(titleElement){
    titleElement.textContent=title?`${title.symbol||""} ${title.name}`.trim():"";
    if(title?.color)titleElement.style.setProperty("--title-color",title.color);else titleElement.style.removeProperty("--title-color");
    titleElement.classList.toggle("hidden",!title);
  }
}
function renderProfileOverview(){
  const name=$("display-name").value.trim()||"Student";
  const className=$("class-name").value.trim()||"Not set";
  const school=$("medical-school").value.trim()||"Not set";
  const interest=$("specialty-interest").value.trim()||"Not set";
  $("profile-hero-name").textContent=name;
  $("profile-hero-academic").innerHTML=`${esc(school==="Not set"?"Medical school not set":school)} <span aria-hidden="true">·</span> ${esc(className==="Not set"?"Year of study not set":className)}`;
  $("profile-hero-interest").textContent=interest==="Not set"?"Specialty interest not set":`Clinical interest: ${interest}`;
  $("profile-overview-school").textContent=school;
  $("profile-overview-class").textContent=className;
  $("profile-overview-interest").textContent=interest;
}
function loadProfilePhoto(userId){
  return loadProfilePhotoForUser(userId,null);
}
function loadProfilePhotoForUser(userId,storedUrl){
  try{
    let localPhoto=localStorage.getItem(profilePhotoKey(userId));
    if(localPhoto&&!/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(localPhoto)){
      console.warn("Saved profile photo has an unsupported format.");
      message("profile-photo-message","Your saved profile picture could not be displayed. Choose a new image or remove it.",true);
      localPhoto=null;
    }
    const remotePhoto=typeof storedUrl==="string"&&/^https:\/\/[^"\s]+$/i.test(storedUrl)?storedUrl:null;
    setProfilePhoto(remotePhoto||localPhoto,remotePhoto?localPhoto:null);
  }catch(error){
    console.warn("Could not load the saved profile picture.",error);
    message("profile-photo-message","Could not load your saved profile picture from this browser.",true);
    setProfilePhoto(null);
  }
}
const MEDICAL_AVATAR_PRESETS=[
  {id:"doctor-teal",label:"Doctor",symbol:"👨‍⚕️",color:"#087f8c"},
  {id:"surgeon-navy",label:"Surgeon",symbol:"🥼",color:"#315b78"},
  {id:"nurse-rose",label:"Nurse",symbol:"👩‍⚕️",color:"#b85f89"},
  {id:"pharmacist-green",label:"Pharmacist",symbol:"👩‍🔬",color:"#287d62"},
  {id:"resident-gold",label:"Resident",symbol:"🎓",color:"#967019"},
  {id:"student-lavender",label:"Medical Student",symbol:"🧑‍⚕️",color:"#8068bd"},
  {id:"cardio-red",label:"Cardiology",symbol:"❤️",color:"#b43d4a"},
  {id:"neuro-violet",label:"Neurology",symbol:"🧠",color:"#7657a8"}
];
function presetAvatarMarkup(preset,selected=false){
  return `<button type="button" class="profile-avatar-option ${selected?"is-selected":""}" role="radio" aria-checked="${selected}" data-preset-avatar="${preset.id}" style="--avatar-color:${preset.color}" title="${esc(preset.label)}"><span aria-hidden="true">${preset.symbol}</span><small>${esc(preset.label)}</small></button>`;
}
function renderPresetAvatars(){
  const box=$("profile-avatar-options");
  if(!box)return;
  box.innerHTML=MEDICAL_AVATAR_PRESETS.map(preset=>presetAvatarMarkup(preset,selectedPresetAvatar===preset.id)).join("");
}
async function selectPresetAvatar(presetId){
  if(!currentUser)return;
  const preset=MEDICAL_AVATAR_PRESETS.find(item=>item.id===presetId);
  if(!preset)return;
  const equipped={...(currentProfileGemSettings.equipped_items||{}),avatar:presetId};
  const {error}=await db.from("profiles").update({equipped_items:equipped,avatar_url:null}).eq("id",currentUser.id);
  if(error){message("profile-avatar-message",error.message,true);return}
  selectedPresetAvatar=presetId;
  currentProfileGemSettings.equipped_items=equipped;
  currentProfileVisuals.equipped_items=equipped;
  currentProfileVisuals.avatar_url=null;
  setProfilePhoto(null);
  document.querySelectorAll(".profile-avatar-option").forEach(button=>{const selected=button.dataset.presetAvatar===presetId;button.classList.toggle("is-selected",selected);button.setAttribute("aria-checked",String(selected))});
  message("profile-avatar-message",`${preset.label} avatar selected.`);
  renderPresetAvatars();
}
$("profile-avatar-options").addEventListener("click",event=>{
  const button=event.target.closest("[data-preset-avatar]");
  if(button)void selectPresetAvatar(button.dataset.presetAvatar);
});
function renderProfileMetrics(){
  $("profile-metric-streak").textContent=`${Math.max(0,Number(studyStreak.current)||0)} days`;
  $("profile-metric-quizzes").textContent=String(attempts.length);
  $("profile-metric-courses").textContent=`${new Set(attempts.map(attempt=>attempt.course)).size} / ${COURSES.length}`;
}
function renderProfileProgression(){
  currentProfileXp=Math.max(0,Math.floor(Number(currentProfileXp)||0));
  currentProfileLevel=1+Math.floor(currentProfileXp/100);
  const progress=currentProfileXp%100;
  $("profile-level-value").textContent=`Level ${currentProfileLevel}`;
  $("profile-xp-value").textContent=`${currentProfileXp} XP`;
  $("profile-hero-level").textContent=`Level ${currentProfileLevel} · ${currentProfileXp} XP`;
  $("profile-xp-progress").style.width=`${progress}%`;
  $("profile-level-panel").querySelector('[role="progressbar"]').setAttribute("aria-valuenow",String(progress));
  $("profile-next-level").textContent=`${100-progress} XP to Level ${currentProfileLevel+1}. Claim achievements to earn XP.`;
}
function renderNotifications(){
  pruneExpiredCalendarNotices();
  const items=allNotifications(),unreadCount=items.filter(item=>!notificationReadIds.has(String(item.id))).length;
  const badge=$("notification-badge"),toggle=$("notification-toggle");
  badge.textContent=unreadCount>99?"99+":String(unreadCount);
  badge.classList.toggle("hidden",unreadCount===0);
  toggle.setAttribute("aria-label",unreadCount?`Open notification centre, ${unreadCount} unread`:"Open notification centre");
  $("notification-summary").textContent=items.length
    ?`${unreadCount} unread • announcements and reminders appear here.`
    :"No current announcements or schedule reminders.";
  $("mark-all-read").classList.toggle("hidden",unreadCount===0);
  $("notification-list").innerHTML=items.length?items.map(item=>{
    const read=notificationReadIds.has(String(item.id));
    return `<article class="notification-item${read?" is-read":""}"><div class="notification-item-heading"><h3>${esc(item.title)}</h3><time datetime="${esc(item.created_at)}">${esc(formatDateTime(item.created_at))}</time></div><p>${esc(item.body)}</p><div class="notification-item-footer"><span>Expires ${esc(formatDate(item.expires_at))}</span><button type="button" class="text-button" data-mark-notification="${esc(item.id)}" ${read?"disabled":""}>${read?"Read":"Mark as read"}</button></div></article>`;
  }).join(""):'<p class="notification-empty">You’re all caught up. New study-group announcements will appear here.</p>';
  renderAdminNotifications();
}
function renderAdminNotifications(){
  const list=$("admin-notification-list");if(!list)return;
  if(!isAdmin){list.textContent="";return}
  if(!notifications.length){list.innerHTML='<p class="muted">No current announcements.</p>';return}
  list.innerHTML=notifications.map(item=>`<article class="admin-notification-item"><div><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p><span>Expires ${esc(formatDateTime(item.expires_at))}</span></div><button class="button button-light" type="button" data-delete-notification="${esc(item.id)}" aria-label="Delete announcement: ${esc(item.title)}">Delete</button></article>`).join("");
}
function renderGroupChatMessages(){
  const list=$("chat-message-list");if(!list)return;
  const wasNearBottom=list.scrollHeight-list.scrollTop-list.clientHeight<60;
  list.innerHTML=groupChatMessages.length?groupChatMessages.map(item=>{
    const mine=item.user_id===currentUser.id;
    const body=item.audio_path
      ?`<button class="chat-voice-play" type="button" data-chat-play-audio="${esc(item.audio_path)}">▶ Play voice note · ${Number(item.audio_duration_seconds)||1}s</button>`
      :`<p>${esc(item.message)}</p>`;
    return `<article class="chat-message${mine?" chat-message-mine":""}"><div class="chat-message-heading">${avatarMarkup(item.display_name,item.user_id,"chat-avatar")}<strong>${esc(item.display_name)}</strong><time datetime="${esc(item.created_at)}">${esc(formatDateTime(item.created_at,{hour:"numeric",minute:"2-digit"}))}</time></div>${body}</article>`;
  }).join(""):'<p class="chat-empty">No messages yet. Start the conversation.</p>';
  if(wasNearBottom)list.scrollTop=list.scrollHeight;
}
async function loadGroupChatMessages(){
  if(!currentUser||!featureEnabled("group_chat"))return false;
  try{
    const {data,error}=await db.from("group_chat_messages").select("id,user_id,display_name,message,created_at,audio_path,audio_mime_type,audio_duration_seconds")
      .gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(CHAT_HISTORY_LIMIT);
    if(error)throw error;
    const nextMessages=(data||[]).reverse();
    const changed=nextMessages.length!==groupChatMessages.length||nextMessages.some((item,index)=>
      item.id!==groupChatMessages[index]?.id||item.message!==groupChatMessages[index]?.message||
      item.audio_path!==groupChatMessages[index]?.audio_path
    );
    groupChatMessages=nextMessages;
    if(changed)renderGroupChatMessages();
    return true;
  }catch(error){
    console.error("Could not load group chat.",error);
    $("chat-message-list").textContent=error.code==="PGRST205"
      ?"Run the latest schema.sql in Supabase to enable the expanded group chat."
      :"Could not load group messages: "+error.message;
    return false;
  }
}
function renderGroupChatPresence(){
  const online=groupChatPresence.filter(item=>Date.now()-new Date(item.last_seen_at).getTime()<=45000);
  $("chat-online-summary").textContent=`${online.length} member${online.length===1?"":"s"} online in chat`;
  $("chat-online-list").innerHTML=online.length?online.slice(0,12).map(item=>
    `<span class="chat-online-member${item.user_id===currentUser?.id?" is-self":""}">${avatarMarkup(item.display_name,item.user_id,"chat-avatar")}<span class="chat-online-dot" aria-hidden="true"></span>${esc(item.display_name)}${item.user_id===currentUser?.id?" (you)":""}</span>`
  ).join(""):'<span class="muted">No members are active in chat right now.</span>';
  const typing=online.filter(item=>item.user_id!==currentUser?.id&&item.typing_until&&new Date(item.typing_until).getTime()>Date.now());
  $("chat-typing-indicator").textContent=typing.length
    ?`${typing.slice(0,3).map(item=>item.display_name).join(", ")}${typing.length===1?" is":" are"} typing…`
    :"";
}
async function loadGroupChatPresence(){
  if(!currentUser||!featureEnabled("group_chat"))return false;
  const cutoff=new Date(Date.now()-45000).toISOString();
  try{
    const {data,error}=await db.from("group_chat_presence").select("user_id,display_name,last_seen_at,typing_until")
      .gt("last_seen_at",cutoff).order("display_name");
    if(error)throw error;
    groupChatPresence=data||[];renderGroupChatPresence();return true;
  }catch(error){
    console.error("Could not load chat presence.",error);
    $("chat-online-summary").textContent="Online status is unavailable. Run the latest schema.sql.";
    $("chat-online-list").textContent="";
    $("chat-typing-indicator").textContent="";
    return false;
  }
}
async function updateGroupChatPresence(isTyping=false){
  if(!currentUser||!featureEnabled("group_chat"))return false;
  try{
    const {error}=await db.from("group_chat_presence").upsert({
      user_id:currentUser.id,
      typing_until:isTyping?new Date(Date.now()+6500).toISOString():null
    },{onConflict:"user_id"});
    if(error)throw error;
    return true;
  }catch(error){console.error("Could not update chat presence.",error);return false}
}
async function removeGroupChatPresence(){
  if(!currentUser)return;
  try{
    const {error}=await db.from("group_chat_presence").delete().eq("user_id",currentUser.id);
    if(error)throw error;
  }catch(error){console.error("Could not clear chat presence.",error)}
}
async function cleanExpiredChatAudio(){
  if(!currentUser)return;
  const {error}=await db.functions.invoke("cleanup-group-chat-audio");
  if(error){
    console.error("Could not clean expired group voice notes.",error);
    message("chat-message-status","Expired voice notes could not be cleaned up. Deploy cleanup-group-chat-audio and run the latest schema.sql.",true);
  }
}
function chatVoiceMimeType(){
  const supported=["audio/webm;codecs=opus","audio/ogg;codecs=opus","audio/mp4"];
  return supported.find(type=>typeof MediaRecorder.isTypeSupported!=="function"||MediaRecorder.isTypeSupported(type))||"";
}
function updateChatRecordingStatus(){
  if(!chatRecorder||chatRecorder.state!=="recording")return;
  const seconds=Math.min(CHAT_MAX_VOICE_SECONDS,Math.floor((Date.now()-chatRecordingStartedAt)/1000));
  message("chat-message-status",`Recording voice note… ${seconds}s / ${CHAT_MAX_VOICE_SECONDS}s`);
  if(seconds>=CHAT_MAX_VOICE_SECONDS)stopChatVoiceRecording();
}
async function startChatVoiceRecording(){
  if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==="undefined"){
    message("chat-message-status","Voice recording is not supported in this browser. Try a current browser over HTTPS.",true);return;
  }
  const button=$("chat-record-voice");button.disabled=true;
  message("chat-message-status","Requesting microphone access…");
  try{
    chatRecordingStream=await navigator.mediaDevices.getUserMedia({audio:true});
    const mimeType=chatVoiceMimeType();
    chatRecorder=mimeType?new MediaRecorder(chatRecordingStream,{mimeType}):new MediaRecorder(chatRecordingStream);
    chatRecordingChunks=[];chatRecordingCancelled=false;chatRecordingStartedAt=Date.now();
    chatRecorder.addEventListener("dataavailable",event=>{if(event.data.size)chatRecordingChunks.push(event.data)});
    chatRecorder.addEventListener("stop",()=>{
      chatRecordingStream?.getTracks().forEach(track=>track.stop());chatRecordingStream=null;
      if(chatRecordingTimer){clearInterval(chatRecordingTimer);chatRecordingTimer=null}
      $("chat-stop-voice").classList.add("hidden");
      chatRecorder=null;
      if(chatRecordingCancelled){resetChatVoiceDraft();return}
      chatRecordingDurationSeconds=Math.max(1,Math.min(CHAT_MAX_VOICE_SECONDS,Math.ceil((Date.now()-chatRecordingStartedAt)/1000)));
      chatRecordingStartedAt=0;
      chatRecordingBlob=new Blob(chatRecordingChunks,{type:chatRecordingChunks[0]?.type||mimeType||"audio/webm"});
      chatRecordingChunks=[];
      if(chatRecordingBlob.size>CHAT_MAX_VOICE_BYTES){
        resetChatVoiceDraft();message("chat-message-status","That recording is larger than 5 MB. Record a shorter voice note.",true);return;
      }
      if(!chatRecordingBlob.size){resetChatVoiceDraft();message("chat-message-status","The recording was empty. Please try again.",true);return}
      if(chatRecordingUrl)URL.revokeObjectURL(chatRecordingUrl);
      chatRecordingUrl=URL.createObjectURL(chatRecordingBlob);
      $("chat-voice-preview").src=chatRecordingUrl;
      $("chat-voice-preview").classList.remove("hidden");
      $("chat-record-voice").classList.add("hidden");
      $("chat-send-voice").classList.remove("hidden");
      $("chat-discard-voice").classList.remove("hidden");
      $("chat-message-input").disabled=true;
      message("chat-message-status",`Voice note ready (${chatRecordingDurationSeconds}s). Listen before sending.`);
    });
    chatRecorder.start(250);
    $("chat-record-voice").classList.add("hidden");$("chat-stop-voice").classList.remove("hidden");
    $("chat-send").disabled=true;$("chat-message-input").disabled=true;
    updateChatRecordingStatus();chatRecordingTimer=setInterval(updateChatRecordingStatus,1000);
  }catch(error){
    chatRecordingStream?.getTracks().forEach(track=>track.stop());chatRecordingStream=null;
    console.error("Could not start voice recording.",error);
    message("chat-message-status",error.name==="NotAllowedError"?"Microphone permission was denied. Allow microphone access in your browser and try again.":`Could not start voice recording: ${error.message}`,true);
    button.disabled=false;
  }
}
function stopChatVoiceRecording(){
  if(chatRecorder?.state==="recording"){
    chatRecordingDurationSeconds=Math.max(1,Math.min(CHAT_MAX_VOICE_SECONDS,Math.ceil((Date.now()-chatRecordingStartedAt)/1000)));
    chatRecorder.stop();
  }
  if(chatRecordingTimer){clearInterval(chatRecordingTimer);chatRecordingTimer=null}
}
let chatRecordingDurationSeconds=0;
function resetChatVoiceDraft(){
  if(chatRecordingTimer){clearInterval(chatRecordingTimer);chatRecordingTimer=null}
  if(chatRecordingUrl){URL.revokeObjectURL(chatRecordingUrl);chatRecordingUrl=null}
  chatRecordingBlob=null;chatRecordingChunks=[];chatRecordingDurationSeconds=0;chatRecordingStartedAt=0;
  $("chat-voice-preview").pause();$("chat-voice-preview").removeAttribute("src");$("chat-voice-preview").load();$("chat-voice-preview").classList.add("hidden");
  $("chat-record-voice").classList.remove("hidden");$("chat-record-voice").disabled=false;
  $("chat-stop-voice").classList.add("hidden");$("chat-send-voice").classList.add("hidden");$("chat-send-voice").disabled=false;
  $("chat-discard-voice").classList.add("hidden");$("chat-send").disabled=false;$("chat-message-input").disabled=false;
}
function discardChatVoiceRecording(){
  if(chatRecorder?.state==="recording"){chatRecordingCancelled=true;chatRecorder.stop()}
  chatRecordingStream?.getTracks().forEach(track=>track.stop());chatRecordingStream=null;
  resetChatVoiceDraft();message("chat-message-status","");
}
async function sendChatVoiceMessage(){
  if(!currentUser||!chatRecordingBlob||!featureEnabled("group_chat"))return;
  const button=$("chat-send-voice"),blob=chatRecordingBlob;
  const mimeType=(blob.type||"audio/webm").split(";")[0].toLowerCase();
  const extensions={"audio/webm":"webm","audio/ogg":"ogg","audio/mp4":"mp4","audio/wav":"wav"};
  const extension=extensions[mimeType];
  if(!extension){message("chat-message-status",`Voice format ${mimeType} is not supported. Try another browser.`,true);return}
  const path=`${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2,10)}.${extension}`;
  button.disabled=true;$("chat-discard-voice").disabled=true;message("chat-message-status","Uploading voice note…");
  let uploaded=false;
  try{
    const {error:uploadError}=await db.storage.from(CHAT_AUDIO_BUCKET).upload(path,blob,{contentType:mimeType,upsert:false});
    if(uploadError)throw uploadError;
    uploaded=true;
    const {error}=await db.from("group_chat_messages").insert({
      user_id:currentUser.id,message:"Voice message",audio_path:path,audio_mime_type:mimeType,audio_duration_seconds:chatRecordingDurationSeconds
    });
    if(error)throw error;
    resetChatVoiceDraft();message("chat-message-status","Voice note sent.");await loadGroupChatMessages();
  }catch(error){
    console.error("Could not send group voice note.",error);
    let detail=error.message;
    if(uploaded){
      const {error:cleanupError}=await db.storage.from(CHAT_AUDIO_BUCKET).remove([path]);
      if(cleanupError){console.error("Could not remove the unsent voice note.",cleanupError);detail+=` The uploaded file also needs cleanup: ${cleanupError.message}`}
    }
    message("chat-message-status","Could not send voice note: "+detail,true);
  }finally{button.disabled=false;$("chat-discard-voice").disabled=false}
}
async function playChatVoice(button){
  const path=button.dataset.chatPlayAudio;
  if(!path)return;
  button.disabled=true;message("chat-message-status","Loading voice note…");
  try{
    let cached=chatAudioUrlCache.get(path);
    if(!cached||cached.expiresAt<=Date.now()){
      const {data,error}=await db.storage.from(CHAT_AUDIO_BUCKET).createSignedUrl(path,60);
      if(error)throw error;
      cached={url:data.signedUrl,expiresAt:Date.now()+55000};chatAudioUrlCache.set(path,cached);
    }
    const audio=document.createElement("audio");audio.controls=true;audio.preload="none";audio.className="chat-voice-player";audio.src=cached.url;
    button.replaceWith(audio);message("chat-message-status","");
    try{await audio.play()}catch(error){console.info("Voice note is ready; press play to listen.",error)}
  }catch(error){
    console.error("Could not load group voice note.",error);
    button.disabled=false;message("chat-message-status","Could not load this voice note: "+error.message,true);
  }
}
function openGroupChat(){
  if(!featureEnabled("group_chat"))return;
  $("group-chat-panel").classList.remove("hidden");$("chat-launch").setAttribute("aria-expanded","true");
  void cleanExpiredChatAudio();void updateGroupChatPresence(false);
  void loadGroupChatMessages();void loadGroupChatPresence();$("chat-message-input").focus();
  if(chatRefreshTimer)clearInterval(chatRefreshTimer);
  chatRefreshTimer=setInterval(()=>{
    if(!$("group-chat-panel").classList.contains("hidden")){void loadGroupChatMessages();void loadGroupChatPresence()}
  },5000);
  if(chatHeartbeatTimer)clearInterval(chatHeartbeatTimer);
  chatHeartbeatTimer=setInterval(()=>void updateGroupChatPresence(!!$("chat-message-input").value.trim()),15000);
}
function closeGroupChat(){
  const panel=$("group-chat-panel"),wasOpen=panel&&!panel.classList.contains("hidden");if(panel)panel.classList.add("hidden");
  if($("chat-launch"))$("chat-launch").setAttribute("aria-expanded","false");
  if(chatRefreshTimer){clearInterval(chatRefreshTimer);chatRefreshTimer=null}
  if(chatHeartbeatTimer){clearInterval(chatHeartbeatTimer);chatHeartbeatTimer=null}
  if(chatTypingTimer){clearTimeout(chatTypingTimer);chatTypingTimer=null}
  if(wasOpen)void removeGroupChatPresence();
  groupChatPresence=[];$("chat-online-summary").textContent="Chat closed";$("chat-online-list").textContent="";$("chat-typing-indicator").textContent="";
  if(chatRecorder?.state==="recording"){chatRecordingCancelled=true;chatRecorder.stop()}
  chatRecordingStream?.getTracks().forEach(track=>track.stop());chatRecordingStream=null;
  resetChatVoiceDraft();
}
async function loadFeatureSettings(){
  const {data,error}=await db.from("feature_settings").select("key,enabled");
  if(error){
    console.error("Could not load feature settings.",error);
    if(isAdmin){
      renderAdminFeatureSettings();
      $("admin-feature-settings").querySelectorAll("[data-feature-switch]").forEach(toggle=>toggle.disabled=true);
      message("admin-feature-settings-message","Feature settings could not be loaded. Run the latest schema.sql: "+error.message,true);
    }
    applyFeatureSettings();return false;
  }
  FEATURE_OPTIONS.forEach(([key])=>featureSettings[key]=true);
  (data||[]).forEach(item=>{if(Object.prototype.hasOwnProperty.call(featureSettings,item.key))featureSettings[item.key]=!!item.enabled});
  renderAdminFeatureSettings();applyFeatureSettings();return true;
}
function renderAdminFeatureSettings(){
  const box=$("admin-feature-settings");if(!box)return;
  if(!isAdmin){box.textContent="";return}
  box.innerHTML=FEATURE_OPTIONS.map(([key,label])=>`<label class="feature-switch"><span><strong>${esc(label)}</strong><small>${key==="phone_class_notifications"?"Available only when users allow device notifications.":key==="group_chat"?"Chat history is automatically purged after 7 days.":"Controls this activity for signed-in students."}</small></span><input type="checkbox" data-feature-switch="${esc(key)}" ${featureEnabled(key)?"checked":""} aria-label="Enable ${esc(label)}"></label>`).join("");
}
function applyFeatureSettings(){
  document.querySelectorAll("[data-feature-nav]").forEach(button=>{
    const key=button.dataset.featureNav;
    button.classList.toggle("hidden",!featureEnabled(key));
  });
  const classesOn=featureEnabled("classes"),examsOn=featureEnabled("exams");
  document.querySelector('[data-page="classes"]').classList.toggle("hidden",!classesOn&&!examsOn);
  $("student-timetable-panel").classList.toggle("hidden",!classesOn);
  $("student-exam-panel").classList.toggle("hidden",!examsOn);
  $("course-grid").classList.toggle("hidden",!featureEnabled("quizzes"));
  document.querySelector('[data-go="quizzes"]').classList.toggle("hidden",!featureEnabled("quizzes"));
  $("chat-launch").classList.toggle("hidden",!featureEnabled("group_chat"));
  renderProfileMetrics();
  $("home-leaderboard").classList.toggle("hidden",!featureEnabled("leaderboards")||userPreferences.homeSections.leaderboard===false);
  $("home-courses-section").classList.toggle("hidden",!featureEnabled("quizzes")||userPreferences.homeSections.courses===false);
  $("leaderboard-panel").classList.toggle("hidden",!featureEnabled("leaderboards"));
  $("score-entry-panel").classList.toggle("hidden",!featureEnabled("practice_scores"));
  $("notification-wrap").classList.toggle("hidden",!featureEnabled("announcements")&&!featureEnabled("schedule_reminders"));
  $("admin-notification-form").closest(".admin-section").classList.toggle("hidden",!featureEnabled("announcements"));
  $("class-notification-controls").classList.toggle("hidden",!featureEnabled("phone_class_notifications"));
  updateClassNotificationControls();
  if(!featureEnabled("group_chat"))closeGroupChat();
  const activePage=document.querySelector(".page:not(.hidden)");
  if(activePage&&((activePage.id==="page-quizzes"&&!featureEnabled("quizzes"))||
    (activePage.id==="page-resources"&&!featureEnabled("resources"))||
    (activePage.id==="page-progress"&&!featureEnabled("leaderboards")&&!featureEnabled("practice_scores"))||
    (activePage.id==="page-classes"&&!classesOn&&!examsOn)))showPage("home");
  renderNotifications();
}
async function loadNotifications(){
  if(!currentUser)return false;
  const [notificationResult,resetResult]=await Promise.all([
    db.from("notifications").select("id,title,body,created_at,expires_at")
      .gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(100),
    db.from("feature_settings").select("updated_at").eq("key","notifications_reset").maybeSingle()
  ]);
  const {data,error}=notificationResult;
  if(resetResult.error){
    console.error("Could not check the shared notification reset marker.",resetResult.error);
    if(isAdmin)message("admin-notification-reset-message","Run the latest schema.sql to enable clearing reminders for all users: "+resetResult.error.message,true);
  }else if(resetResult.data){
    applyNotificationResetMarker(resetResult.data.updated_at);
    if(isAdmin)message("admin-notification-reset-message","");
  }else if(isAdmin){
    message("admin-notification-reset-message","Run the latest schema.sql to enable clearing reminders for all users.",true);
  }
  if(error){
    console.error("Could not load notifications.",error);
    const detail=error.code==="PGRST205"
      ?"Notifications are not set up yet. Run the latest schema.sql in Supabase."
      :"Could not load announcements: "+error.message;
    $("notification-summary").textContent="Notifications could not be loaded.";
    $("notification-list").textContent=detail;
    if(isAdmin)$("admin-notification-list").textContent=detail;
    return false;
  }
  notifications=data||[];
  const activeIds=new Set(allNotifications().map(item=>String(item.id)));
  notificationReadIds=new Set([...notificationReadIds].filter(id=>activeIds.has(id)));
  saveNotificationReadIds();renderNotifications();return true;
}
function closeNavigation(){
  $("main-navigation").classList.remove("is-open");
  $("main-navigation").setAttribute("aria-hidden","true");
  $("nav-menu-toggle").setAttribute("aria-expanded","false");
  $("nav-menu-toggle").setAttribute("aria-label","Open menu");
  updateDrawerBackdrop();
}
function updateDrawerBackdrop(){
  const open=$("main-navigation").classList.contains("is-open")||$("settings-drawer").classList.contains("is-open");
  $("drawer-backdrop").classList.toggle("is-open",open);
  document.body.classList.toggle("drawer-open",open);
}
function openNavigation(){
  closeSettings();closeNotificationPanel();
  $("main-navigation").classList.remove("hidden");
  $("main-navigation").classList.add("is-open");
  $("main-navigation").setAttribute("aria-hidden","false");
  $("nav-menu-toggle").setAttribute("aria-expanded","true");
  $("nav-menu-toggle").setAttribute("aria-label","Close menu");
  updateDrawerBackdrop();$("nav-menu-close").focus();
}
function closeSettings(){
  $("settings-drawer").classList.remove("is-open");
  $("settings-drawer").setAttribute("aria-hidden","true");
  $("settings-toggle").setAttribute("aria-expanded","false");
  $("settings-streak-mascot").value=userPreferences.streakMascot;
  updateStreakMascots(studyStreak.current,userPreferences.streakMascot);
  updateDrawerBackdrop();
}
function openSettings(){
  closeNavigation();closeNotificationPanel();fillSettingsForm();
  $("settings-drawer").classList.add("is-open");
  $("settings-drawer").setAttribute("aria-hidden","false");
  $("settings-toggle").setAttribute("aria-expanded","true");
  updateDrawerBackdrop();$("settings-close").focus();
}
function closeNotificationPanel(){
  $("notification-panel").classList.add("hidden");
  $("notification-panel").classList.remove("is-open");
  $("notification-toggle").setAttribute("aria-expanded","false");
  if(notificationRefreshTimer){clearInterval(notificationRefreshTimer);notificationRefreshTimer=null}
}
async function toggleNotificationPanel(){
  if(!$("notification-panel").classList.contains("hidden")){closeNotificationPanel();return}
  const panel=$("notification-panel");
  panel.style.setProperty("--notification-top",`${Math.round($("topbar").getBoundingClientRect().bottom+8)}px`);
  panel.classList.remove("hidden");
  requestAnimationFrame(()=>panel.classList.add("is-open"));
  $("notification-toggle").setAttribute("aria-expanded","true");
  const loaded=await loadNotifications();
  if(loaded&&!notificationRefreshTimer)notificationRefreshTimer=setInterval(()=>{
    if(!$("notification-panel").classList.contains("hidden"))loadNotifications();
  },60000);
}
function setAuthMode(m){authMode=m;$("show-login").classList.toggle("active",m==="login");$("show-signup").classList.toggle("active",m==="signup");$("name-label").classList.toggle("hidden",m!=="signup");$("full-name").required=m==="signup";$("auth-title").textContent=m==="login"?"Welcome back":"Create your account";$("auth-submit").textContent=m==="login"?"Log in":"Create account";message("auth-message","");}
$("show-login").onclick=()=>setAuthMode("login");$("show-signup").onclick=()=>setAuthMode("signup");
$("auth-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!db){message("auth-message","Add your Supabase URL and anon key in app.js, then refresh.",true);return}
  const email=$("email").value.trim(),password=$("password").value,button=$("auth-submit"),label=authMode==="login"?"Log in":"Create account";
  button.disabled=true;button.setAttribute("aria-busy","true");button.innerHTML=`<span class="refresh-spinner" aria-hidden="true"></span>${authMode==="login"?"Signing in…":"Creating account…"}`;
  try{
    if(authMode==="signup"){
      const {data,error}=await db.auth.signUp({email,password,options:{data:{full_name:$("full-name").value.trim()}}});if(error)throw error;
      message("auth-message",data.session?"Account created.":"Account created. Check your email to confirm, then log in.");
    }else{const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error}
  }catch(err){message("auth-message",err.message,true)}finally{button.disabled=false;button.removeAttribute("aria-busy");button.textContent=label}
});
$("forgot-password").onclick=async()=>{
  if(!db){message("auth-message","Connect Supabase first.",true);return}
  const email=$("email").value.trim();if(!email){message("auth-message","Enter your email address first.",true);return}
  const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});
  message("auth-message",error?error.message:"If this email belongs to an account, a password-reset link has been sent.",!!error);
};
$("logout-btn").onclick=async()=>{
  if(!db)return;
  await recordWebsiteUsage(true);
  await recordUserActivity("sign_out",document.querySelector(".page:not(.hidden)")?.id.replace(/^page-/,"")||null);
  await db.auth.signOut();
};
document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.page)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>showPage(b.dataset.go)));
$("nav-menu-toggle").addEventListener("click",()=>{
  if($("main-navigation").classList.contains("is-open"))closeNavigation();else openNavigation();
});
$("nav-menu-close").addEventListener("click",closeNavigation);
$("settings-toggle").addEventListener("click",()=>{
  if($("settings-drawer").classList.contains("is-open"))closeSettings();else openSettings();
});
$("settings-close").addEventListener("click",closeSettings);
$("drawer-backdrop").addEventListener("click",()=>{closeNavigation();closeSettings()});
$("streak-modal-close").addEventListener("click",closeStreakCelebration);
$("streak-modal-done").addEventListener("click",closeStreakCelebration);
$("notification-toggle").addEventListener("click",toggleNotificationPanel);
$("notification-list").addEventListener("click",event=>{
  const button=event.target.closest("[data-mark-notification]");if(!button)return;
  notificationReadIds.add(String(button.dataset.markNotification));saveNotificationReadIds();renderNotifications();
});
$("mark-all-read").addEventListener("click",()=>{
  allNotifications().forEach(item=>notificationReadIds.add(String(item.id)));saveNotificationReadIds();renderNotifications();
});
$("admin-notifications-refresh").addEventListener("click",loadNotifications);
$("admin-notification-list").addEventListener("click",async event=>{
  const button=event.target.closest("[data-delete-notification]");if(!button||!isAdmin)return;
  if(!confirm("Delete this announcement for everyone?"))return;
  button.disabled=true;
  const {error}=await db.from("notifications").delete().eq("id",button.dataset.deleteNotification);
  if(error){button.disabled=false;message("admin-notification-message",error.message,true);return}
  message("admin-notification-message","Announcement deleted.");await loadNotifications();
});
$("chat-launch").addEventListener("click",openGroupChat);
$("chat-close").addEventListener("click",closeGroupChat);
$("chat-message-form").addEventListener("submit",async event=>{
  event.preventDefault();if(!currentUser||!featureEnabled("group_chat"))return;
  const text=$("chat-message-input").value.trim();if(!text)return;
  const button=$("chat-send");button.disabled=true;message("chat-message-status","Sending…");
  try{
    const {error}=await db.from("group_chat_messages").insert({user_id:currentUser.id,message:text});
    if(error)throw error;
    $("chat-message-input").value="";void updateGroupChatPresence(false);message("chat-message-status","");await loadGroupChatMessages();$("chat-message-input").focus();
  }catch(error){message("chat-message-status","Could not send message: "+error.message,true)}
  finally{button.disabled=false}
});
$("chat-message-input").addEventListener("input",()=>{
  if(chatTypingTimer)clearTimeout(chatTypingTimer);
  if(!$("group-chat-panel").classList.contains("hidden")&&$("chat-message-input").value.trim()){
    chatTypingTimer=setTimeout(()=>{
      if($("chat-message-input").value.trim()){
        void updateGroupChatPresence(true);
        chatTypingTimer=setTimeout(()=>void updateGroupChatPresence(false),2500);
      }
    },450);
  }else if(currentUser){
    void updateGroupChatPresence(false);
  }
});
$("chat-message-input").addEventListener("blur",()=>void updateGroupChatPresence(false));
$("chat-record-voice").addEventListener("click",()=>void startChatVoiceRecording());
$("chat-stop-voice").addEventListener("click",stopChatVoiceRecording);
$("chat-send-voice").addEventListener("click",()=>void sendChatVoiceMessage());
$("chat-discard-voice").addEventListener("click",discardChatVoiceRecording);
$("chat-message-list").addEventListener("click",event=>{
  const button=event.target.closest("[data-chat-play-audio]");
  if(button)void playChatVoice(button);
});
$("admin-feature-settings").addEventListener("change",async event=>{
  const toggle=event.target.closest("[data-feature-switch]");if(!toggle||!isAdmin)return;
  const key=toggle.dataset.featureSwitch,enabled=toggle.checked;
  toggle.disabled=true;message("admin-feature-settings-message","Saving feature setting…");
  try{
    const {error}=await db.from("feature_settings").update({enabled,updated_at:new Date().toISOString()}).eq("key",key);
    if(error)throw error;
    featureSettings[key]=enabled;applyFeatureSettings();
    message("admin-feature-settings-message",`${FEATURE_OPTIONS.find(item=>item[0]===key)?.[1]||"Feature"} ${enabled?"enabled":"disabled"}.`);
  }catch(error){toggle.checked=!enabled;message("admin-feature-settings-message","Could not save setting: "+error.message,true)}
  finally{toggle.disabled=false}
});
$("enable-class-phone-notifications").addEventListener("click",toggleClassPhoneNotifications);
 $("home-section-options").addEventListener("change",event=>{
  const toggle=event.target.closest("[data-home-section-toggle]");if(!toggle)return;
  const key=toggle.dataset.homeSectionToggle;
  userPreferences.homeSections={...userPreferences.homeSections,[key]:toggle.checked};
  applyHomeSectionPreferences();
  void savePersonalPreferences({homeSections:userPreferences.homeSections},"home-customization-status","Home page preferences synced to your account.");
});
$("focus-mode-open").addEventListener("click",openFocusMode);
$("focus-modal-close").addEventListener("click",closeFocusMode);
$("focus-modal").addEventListener("click",event=>{if(event.target.id==="focus-modal")closeFocusMode()});
$("focus-start").addEventListener("click",startFocusTimer);
$("focus-pause").addEventListener("click",pauseFocusTimer);
$("focus-reset").addEventListener("click",resetFocusTimer);
$("focus-break").addEventListener("click",startFocusBreak);
$("focus-floating-start").addEventListener("click",startFocusTimer);
$("focus-floating-pause").addEventListener("click",pauseFocusTimer);
$("focus-floating-reset").addEventListener("click",resetFocusTimer);
$("focus-floating-exit").addEventListener("click",closeFocusMode);
$("restore-streak-gems").addEventListener("click",async()=>{
  if(!currentUser)return;
  const {error}=await db.rpc("restore_streak",{p_cost:50});
  if(error){message("streak-modal-status",error.message,true);return}
  message("streak-modal-status","Streak restored.");
  $("restore-streak-gems").classList.add("hidden");
  await Promise.all([loadStudyStreak(),loadGemsProfile()]);
});
$("streak-sound-test").addEventListener("click",()=>{void playStreakSound()});
$("streak-sound-save").addEventListener("click",async()=>{
  if(!isAdmin)return;
  const file=$("streak-sound-file").files?.[0];
  if(!file){message("streak-sound-status","Choose an MP3 or WAV file.",true);return}
  if(!/\.(mp3|wav)$/i.test(file.name)){message("streak-sound-status","Only MP3 and WAV files are supported.",true);return}
  const path=`streak/${Date.now()}-${file.name.replace(/[^a-z0-9_.-]/gi,"_")}`;
  const {error:uploadError}=await db.storage.from("app-assets").upload(path,file,{upsert:true,contentType:file.type||undefined});
  if(uploadError){message("streak-sound-status",uploadError.message,true);return}
  const {data}=db.storage.from("app-assets").getPublicUrl(path);
  const {error}=await db.from("app_settings").upsert({key:"streak_sound_url",value:data.publicUrl,updated_at:new Date().toISOString()},{onConflict:"key"});
  if(error){message("streak-sound-status",error.message,true);return}
  streakSoundAudio=new Audio(data.publicUrl);
  message("streak-sound-status","Streak sound saved and active.");
});
function configureAchievementRequirementFields(){
  const type=$("achievement-requirement-type").value;
  const podium=type==="quiz_podium"||type==="course_podium";
  const weekly=type==="weekly_top_scorer";
  const scopeField=$("achievement-requirement-scope-field");
  const scopeInput=$("achievement-requirement-scope");
  const valueInput=$("achievement-requirement-value");
  scopeField.classList.toggle("hidden",!podium);
  scopeInput.required=podium;
  scopeInput.placeholder=type==="quiz_podium"?"Exact verified quiz title":"Exact course name";
  $("achievement-requirement-scope-help").textContent=type==="quiz_podium"
    ?"Use the verified result's quiz title; podium rank uses each student's best verified percentage."
    :"Use a course name from the course leaderboard; podium rank uses each student's average verified percentage.";
  $("achievement-requirement-value-field").classList.toggle("hidden",weekly);
  $("achievement-requirement-value-help").textContent=podium
    ?"Set the place to 1, 2 or 3. Tied students share a place."
    :type==="average_threshold"||type==="score_threshold"
    ?"Set a percentage from 0 to 100."
    :"Set the required count.";
  valueInput.disabled=weekly;
  valueInput.min=podium?"1":"0";
  valueInput.max=podium?"3":type==="average_threshold"||type==="score_threshold"?"100":"";
  valueInput.value=weekly?"1":valueInput.value;
}
$("achievement-requirement-type").addEventListener("change",configureAchievementRequirementFields);
configureAchievementRequirementFields();
$("achievement-form").addEventListener("submit",async event=>{
  event.preventDefault();
  if(!isAdmin)return;
  const id=$("achievement-id").value;
  const requirementType=$("achievement-requirement-type").value;
  const row={
    title:$("achievement-title").value.trim(),description:$("achievement-description").value.trim(),
    icon:$("achievement-icon").value.trim()||"🏅",gem_reward:Number($("achievement-gems").value)||0,
    requirement_type:requirementType,
    requirement_value:requirementType==="weekly_top_scorer"?1:Number($("achievement-requirement-value").value)||0,
    requirement_scope:["quiz_podium","course_podium"].includes(requirementType)?$("achievement-requirement-scope").value.trim():null,
    is_default:false
  };
  const result=id?await db.from("achievements").update(row).eq("id",id):await db.from("achievements").insert(row);
  message("achievement-admin-status",result.error?result.error.message:(id?"Achievement updated.":"Achievement saved."),!!result.error);
  if(!result.error){event.target.reset();$("achievement-id").value="";configureAchievementRequirementFields();await loadAchievementAdmin()}
});
function achievementRequirementSummary(item){
  const value=Number(item.requirement_value)||0,scope=esc(item.requirement_scope||"");
  if(item.requirement_type==="quizzes_completed")return `${value} quiz attempts`;
  if(item.requirement_type==="streak_days")return `${value}-day study streak`;
  if(item.requirement_type==="score_threshold")return `single score ≥ ${value}%`;
  if(item.requirement_type==="courses_completed")return `${value} courses`;
  if(item.requirement_type==="average_threshold")return `average score ≥ ${value}%`;
  if(item.requirement_type==="weekly_top_scorer")return "weekly leaderboard #1 by average";
  if(item.requirement_type==="quiz_podium")return `#${value} on quiz “${scope}”`;
  if(item.requirement_type==="course_podium")return `#${value} in “${scope}”`;
  return `${esc(item.requirement_type)} ${value}`;
}
async function loadAchievementAdmin(){
  if(!isAdmin||!$("achievement-admin-list"))return;
  const {data,error}=await db.from("achievements").select("*").order("gem_reward");
  if(error){message("achievement-admin-status",error.message,true);return}
  $("achievement-admin-list").innerHTML=(data||[]).map(item=>`<article class="achievement earned"><strong>${esc(item.icon)} ${esc(item.title)}</strong><p>${esc(item.description)}</p><span>${item.gem_reward} Gems · ${achievementRequirementSummary(item)}</span><div class="button-row"><button class="button button-outline" type="button" data-edit-achievement="${esc(item.id)}">Edit</button><button class="button button-danger" type="button" data-delete-achievement="${esc(item.id)}" ${item.is_default?"disabled":""}>Delete</button></div></article>`).join("")||'<p class="muted">No achievements.</p>';
}
$("achievement-list").addEventListener("click",async event=>{
  const button=event.target.closest("[data-claim-achievement]");
  if(!button||!currentUser)return;
  button.disabled=true;
  const {data,error}=await db.rpc("claim_achievement",{p_achievement_id:button.dataset.claimAchievement});
  if(error){message("achievement-status",error.message,true);button.disabled=false;return}
  const claimResult=data&&typeof data==="object"&&!Array.isArray(data)&&Number.isFinite(Number(data.gems))?data:null;
  syncGemBalance(claimResult?claimResult.gems:data,currentProfileGems);
  if(claimResult){
    currentProfileXp=Number(claimResult.xp)||0;
    renderProfileProgression();
  }
  await loadGemsProfile();
  await renderAchievements();
  message("achievement-status",claimResult
    ?`Achievement claimed: +${Number(claimResult.gems_awarded)||0} Gems and +${Number(claimResult.xp_awarded)||0} XP. You are Level ${currentProfileLevel}.`
    :"Achievement Gems claimed. Apply the XP progression migration to enable XP rewards.");
});
$("achievement-admin-list").addEventListener("click",async event=>{
  const edit=event.target.closest("[data-edit-achievement]");
  const del=event.target.closest("[data-delete-achievement]");
  if(edit){
    const {data,error}=await db.from("achievements").select("*").eq("id",edit.dataset.editAchievement).single();
    if(error){message("achievement-admin-status",error.message,true);return}
    $("achievement-id").value=data.id;$("achievement-title").value=data.title;$("achievement-description").value=data.description;
    $("achievement-icon").value=data.icon;$("achievement-gems").value=data.gem_reward;
    $("achievement-requirement-type").value=data.requirement_type;$("achievement-requirement-value").value=data.requirement_value;
    $("achievement-requirement-scope").value=data.requirement_scope||"";configureAchievementRequirementFields();
    $("achievement-form").scrollIntoView({behavior:"smooth"});
  }else if(del){
    if(!confirm("Delete this achievement?"))return;
    const {error}=await db.from("achievements").delete().eq("id",del.dataset.deleteAchievement);
    if(error){message("achievement-admin-status",error.message,true);return}
    await loadAchievementAdmin();
  }
});
$("focus-duration").addEventListener("change",()=>{
  const duration=Number($("focus-duration").value);
  if(!Number.isInteger(duration)||duration<1||duration>180){
    message("focus-save-status","Choose a focus duration from 1 to 180 minutes.",true);return;
  }
  $("focus-duration").value=String(duration);
  userPreferences.focusDurationMinutes=duration;
  if(!focusTimerInterval&&focusTimerPhase==="focus"&&!focusSessionStarted){
    focusRemainingSeconds=duration*60;renderFocusTimer();
  }
  void savePersonalPreferences({focusDurationMinutes:duration},"focus-save-status","Your focus duration synced to your account.");
});
document.addEventListener("click",event=>{
  if(!event.target.closest(".notification-wrap"))closeNotificationPanel();
  if(!event.target.closest("#main-navigation")&&!event.target.closest("#nav-menu-toggle"))closeNavigation();
  if(!event.target.closest("#settings-drawer")&&!event.target.closest("#settings-toggle"))closeSettings();
  const publicProfile=event.target.closest("[data-public-profile]");
  if(publicProfile)void openPublicProfile(publicProfile.dataset.publicProfile,Number(publicProfile.dataset.publicRank)||null);
  const recentLink=event.target.closest("[data-recent-kind][data-recent-id]");
  if(recentLink)recordRecentItem(recentLink.dataset.recentKind,recentLink.dataset.recentId);
},true);
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"){closeNavigation();closeSettings();closeNotificationPanel();closeGroupChat();closeStreakCelebration();closeFocusMode();closePublicProfile()}
});
function renderFocusTimer(){
  const total=Math.max(0,focusRemainingSeconds),minutes=Math.floor(total/60),seconds=total%60;
  $("focus-timer-display").textContent=`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
  if($("focus-floating-time"))$("focus-floating-time").textContent=`${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
  $("focus-phase-label").textContent=focusTimerInterval
    ?focusTimerPhase==="break"?"Break in progress":"Focus session in progress"
    :total===0?focusTimerPhase==="break"?"Break complete. Ready to focus?":"Focus session complete. Well done."
    :focusTimerPhase==="break"?"Ready for a short break":"Ready for a focus session";
  $("focus-start").disabled=!!focusTimerInterval;
  $("focus-pause").disabled=!focusTimerInterval;
  $("focus-duration").disabled=!!focusTimerInterval||(focusTimerPhase==="break"&&total>0);
}
function playFocusTimerChime(){
  if(currentProfileGemSettings.equipped_items?.chime!=="pomodoro-chimes")return;
  try{
    const AudioContextClass=window.AudioContext||window.webkitAudioContext;
    if(!AudioContextClass)throw new Error("Audio playback is not supported in this browser.");
    const context=new AudioContextClass(),notes=[659.25,783.99,987.77],start=context.currentTime;
    notes.forEach((frequency,index)=>{
      const time=start+index*.2,oscillator=context.createOscillator(),gain=context.createGain();
      oscillator.type="sine";oscillator.frequency.setValueAtTime(frequency,time);
      gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(.12,time+.025);
      gain.gain.exponentialRampToValueAtTime(.0001,time+.34);
      oscillator.connect(gain);gain.connect(context.destination);oscillator.start(time);oscillator.stop(time+.35);
    });
    window.setTimeout(()=>{void context.close()},1200);
  }catch(error){console.warn("Could not play the equipped focus timer chime.",error)}
}
function openFocusMode(){
  if(!focusSessionStarted&&focusTimerPhase==="focus")focusRemainingSeconds=userPreferences.focusDurationMinutes*60;
  renderFocusTimer();
  $("focus-modal").classList.add("is-open");$("focus-modal").setAttribute("aria-hidden","false");
  if($("focus-floating-bar"))$("focus-floating-bar").classList.add("is-active");
  document.body.classList.add("dialog-open");$("focus-start").focus();
}
function closeFocusMode(){
  const modal=$("focus-modal");if(!modal?.classList.contains("is-open"))return;
  pauseFocusTimer();
  modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");
  if($("focus-floating-bar"))$("focus-floating-bar").classList.remove("is-active");
  if(!$("streak-modal").classList.contains("is-open"))document.body.classList.remove("dialog-open");
  $("focus-mode-open").focus({preventScroll:true});
}
function startFocusTimer(){
  if(focusTimerInterval)return;
  if(focusRemainingSeconds<=0){
    focusTimerPhase="focus";focusRemainingSeconds=Number($("focus-duration").value)*60;
  }
  if(!Number.isFinite(focusRemainingSeconds)||focusRemainingSeconds<1){
    message("focus-save-status","Choose a valid focus duration before starting.",true);return;
  }
  focusSessionStarted=focusTimerPhase==="focus";focusEndsAt=Date.now()+focusRemainingSeconds*1000;
  focusTimerInterval=setInterval(()=>{
    focusRemainingSeconds=Math.max(0,Math.ceil((focusEndsAt-Date.now())/1000));
    if(focusRemainingSeconds===0){
      clearInterval(focusTimerInterval);focusTimerInterval=null;focusSessionStarted=false;
      playFocusTimerChime();
    }
    renderFocusTimer();
  },250);
  renderFocusTimer();
}
function pauseFocusTimer(){
  if(!focusTimerInterval)return;
  focusRemainingSeconds=Math.max(0,Math.ceil((focusEndsAt-Date.now())/1000));
  clearInterval(focusTimerInterval);focusTimerInterval=null;renderFocusTimer();
}
function resetFocusTimer(){
  pauseFocusTimer();focusTimerPhase="focus";focusSessionStarted=false;
  focusRemainingSeconds=Number($("focus-duration").value)*60;renderFocusTimer();
}
function startFocusBreak(){
  pauseFocusTimer();focusTimerPhase="break";focusSessionStarted=false;focusRemainingSeconds=5*60;
  startFocusTimer();
}
function showPage(page,skipDataLoad=false){
  if(page==="admin"&&!isAdmin){showPage("home");return}
  if(currentProfileRole==="guest"&&["resources","achievements"].includes(page)){showPage("home");return}
  if((page==="quizzes"&&!featureEnabled("quizzes"))||(page==="resources"&&!featureEnabled("resources"))||
    (page==="classes"&&!featureEnabled("classes")&&!featureEnabled("exams"))||
    (page==="progress"&&!featureEnabled("leaderboards")&&!featureEnabled("practice_scores"))){showPage("home");return}
  if(page!=="home")closeGroupChat();
  closeNavigation();closeSettings();
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));
  const targetPage=$("page-"+page);targetPage.classList.remove("hidden");targetPage.classList.remove("page-entering");void targetPage.offsetWidth;targetPage.classList.add("page-entering");
  void recordUserActivity("page_view",page);
  saveLastPage(page);
  document.querySelectorAll(".nav-link").forEach(n=>{
    const active=n.dataset.page===page;n.classList.toggle("active",active);
    if(active)n.setAttribute("aria-current","page");else n.removeAttribute("aria-current");
  });
  if(page==="progress"){if(!skipDataLoad){void syncActivityResetMarker();loadAttempts()}if(featureEnabled("leaderboards"))renderLeaderboard()}
  if(page==="achievements"&&!skipDataLoad)void renderAchievements();
  if(page==="home"&&featureEnabled("leaderboards")&&!skipDataLoad)renderHomeLeaderboard();
  if(page==="resources"){
    if(!skipDataLoad)renderResources();
    void loadDriveFiles();
  }
  if(!skipDataLoad){
    if(page==="classes")loadClassAndExamData();
    if(page==="quizzes")renderQuizzes();if(page==="profile")loadProfile();if(page==="admin")loadAdmin();
  }
}
function signedOut(){
  if(sessionExpiryTimer){clearTimeout(sessionExpiryTimer);sessionExpiryTimer=null}
  if(liveNoticeTimer){clearInterval(liveNoticeTimer);liveNoticeTimer=null}
  if(usageTimer){recordWebsiteUsage(true);clearInterval(usageTimer);usageTimer=null}
  activityPendingSeconds=0;activityLoggingUnavailable=false;
  adminUserRows=[];adminUserPage=1;adminUsersHaveMore=false;
  $("admin-user-list").textContent="User accounts have not been loaded yet.";
  $("admin-user-count").textContent="";$("admin-user-message").textContent="";
  $("admin-user-activity").classList.add("hidden");$("admin-user-activity-content").textContent="";
  if(currentUser)clearSessionStartedAt(currentUser.id);
  queuedLiveNotices=[];streakCheckPending=false;studyTasks=[];studyTasksAvailable=true;renderStudyTasks();
  closeGroupChat();closeStreakCelebration();closeFocusMode();closeSettings();currentUser=null;isAdmin=false;currentProfileRole="member";currentProfileGems=0;currentProfileLevel=1;currentProfileGemsEnabled=true;currentProfileGemSettings={unlocked_items:[],equipped_items:{}};currentProfileVisuals={avatar_url:null,equipped_items:{}};selectedPresetAvatar="";publicProfileVisuals.clear();if(shopPreviewTimer){clearTimeout(shopPreviewTimer);shopPreviewTimer=null}activityResetSyncAvailable=false;userPreferences={...DEFAULT_USER_PREFERENCES};studyStreak={current:0,longest:0,lastActiveDate:null,syncStatus:""};notifications=[];calendarNotifications=[];groupChatMessages=[];notificationReadIds=new Set();$("ai-assistant-launch").classList.add("hidden");setProfileIdentity("Student");setProfilePhoto(null);applyUserPreferences();applyThemeColor(DEFAULT_THEME_COLOR);renderGemBalance();renderStudyStreak();
  currentProfileXp=0;renderProfileProgression();
  groupChatMessages=[];groupChatPresence=[];chatAudioUrlCache.clear();
  closeNavigation();closeNotificationPanel();$("auth-view").classList.remove("hidden");$("app-view").classList.add("hidden");
  $("user-tools").classList.add("hidden");$("main-navigation").classList.add("hidden");$("nav-menu-toggle").classList.add("hidden");$("admin-nav").classList.add("hidden");
  $("notification-badge").classList.add("hidden");$("notification-list").textContent="";
}
window.addEventListener("pagehide",()=>{
  if(!currentUser)return;
  recordWebsiteUsage(true);
  void recordUserActivity("page_closed",document.querySelector(".page:not(.hidden)")?.id.replace(/^page-/,"")||null);
  const activePage=document.querySelector(".page:not(.hidden)");
  if(activePage)saveLastPage(activePage.id.replace(/^page-/,""));
});
async function signedIn(user){
  const sessionStartedAt=getSessionStartedAt(user.id);
  if(Date.now()-sessionStartedAt>=SESSION_MAX_AGE){
    try{
      const {error}=await db.auth.signOut({scope:"local"});
      if(error)throw error;
      clearSessionStartedAt(user.id);signedOut();
      showLiveNotice("Session expired","You have been logged out after 24 hours. Please log in again.");
    }catch(error){
      console.error("Could not end the expired login session.",error);
      signedOut();showNetworkNotice();
    }
    return;
  }
  if(currentUser?.id===user.id&&!$("app-view").classList.contains("hidden"))return;
  currentUser=user;
  userPreferences=loadUserPreferences();applyUserPreferences();fillSettingsForm();
  loadStudyTasks();
  startSessionExpiryTimer(user.id);
  if(user.user_metadata?.requires_password_setup){
    $("auth-view").classList.remove("hidden");$("app-view").classList.add("hidden");
    $("auth-form").classList.add("hidden");$("forgot-password").classList.add("hidden");
    $("password-update-form").classList.remove("hidden");
    message("password-update-message","Set a password to finish creating your account.");
    return;
  }
  activityPendingSeconds=0;activityLoggingUnavailable=false;
  activeTimetableDay=weekdayIndex();notificationReadIds=loadNotificationReadIds();loadCalendarNotices();setProfileIdentity(user.user_metadata&&user.user_metadata.full_name);
  $("auth-view").classList.add("hidden");$("app-view").classList.remove("hidden");$("user-tools").classList.remove("hidden");
  $("main-navigation").classList.remove("hidden");$("nav-menu-toggle").classList.remove("hidden");
  void recordUserActivity("sign_in");
  courseSelects();startUsageTracking();showPage("home",true);
  studyStreak.syncStatus="Checking your streak…";renderStudyStreak();
  streakCheckPending=true;const profileLoad=loadProfile(),streakLoad=profileLoad.catch(error=>console.error("Could not load settings before the study streak.",error)).then(()=>loadStudyStreak());
  void loadGemsProfile();
  const accessSetup=Promise.allSettled([checkAdmin(),loadFeatureSettings()]);
  const dataLoads=Promise.allSettled([loadContent(),loadAttempts(),profileLoad,loadNotifications(),loadClassAndExamData()]);
  const setupResults=await accessSetup;
  setupResults.filter(result=>result.status==="rejected").forEach(result=>console.error("Could not finish account setup.",result.reason));
  const initialPage=getLastPage();
  showPage(initialPage,true);updateClassNotificationControls();
  if(initialPage==="home"&&featureEnabled("leaderboards"))renderHomeLeaderboard();
  if(initialPage==="admin")loadAdmin();
  Promise.all([dataLoads,streakLoad]).then(([results])=>{
    results.filter(result=>result.status==="rejected").forEach(result=>console.error("Could not finish loading study data.",result.reason));
    startScheduleNotifications();
  });
}
$("profile-shortcut").addEventListener("click",()=>showPage("profile"));
async function checkAdmin(){const {data,error}=await db.rpc("is_current_user_admin");isAdmin=!error&&data===true;$("admin-nav").classList.toggle("hidden",!isAdmin);$("settings-admin-link").classList.toggle("hidden",!isAdmin)}
function renderCourses(){
  const icons={"Biochemistry":"⚗","Histology":"◉","Physiology":"♡","Embryology":"✳","Gross Anatomy":"⌘"};
  $("course-grid").innerHTML=COURSES.map(c=>`<article class="course-card"><div>${icons[c]}</div><h3>${c}</h3><p>Quizzes and learning materials for ${c.toLowerCase()}.</p><button class="button button-outline" data-course="${esc(c)}">Explore course</button></article>`).join("");
  document.querySelectorAll("[data-course]").forEach(b=>b.onclick=()=>{showPage("quizzes");$("quiz-course-filter").value=b.dataset.course;renderQuizzes()});
}
function startUsageTracking(){
  if(usageTimer)clearInterval(usageTimer);
  usageLastTick=document.visibilityState==="visible"?Date.now():null;
  usageTimer=setInterval(()=>recordWebsiteUsage(),15000);
}
function recordWebsiteUsage(final=false){
  if(!currentUser)return Promise.resolve();
  const now=Date.now();
  if(document.visibilityState==="visible"&&usageLastTick!==null){
    const elapsed=Math.min(Math.max(0,now-usageLastTick),30000);
    if(elapsed){saveWebsiteUsage(loadWebsiteUsage()+elapsed);renderWebsiteUsage();activityPendingSeconds+=Math.floor(elapsed/1000);flushActivityTime()}
  }
  const activityWrites=flushActivityTime(final);
  usageLastTick=final||document.visibilityState!=="visible"?null:now;
  return activityWrites;
}
function renderWebsiteUsage(){
  const total=$("website-usage-total");if(total)total.textContent=formatDuration(loadWebsiteUsage());
}
document.addEventListener("visibilitychange",()=>{
  if(!currentUser)return;
  if(document.visibilityState==="hidden")recordWebsiteUsage(true);
  else{
    usageLastTick=Date.now();
    if(Date.now()-getSessionStartedAt(currentUser.id)>=SESSION_MAX_AGE)void expireAuthSession();
  }
});
function renderBulkQuizRows(){
  $("bulk-quiz-grid").innerHTML=COURSES.map(course=>`<fieldset class="bulk-quiz-course" data-course="${esc(course)}"><legend>${esc(course)}</legend><label class="bulk-course-label"><input type="checkbox" class="bulk-course-toggle"> Include in this batch</label>
    <label>Quiz title<input class="bulk-course-input" data-field="title" maxlength="140" required disabled></label>
    <label>Google Forms responder URL<input class="bulk-course-input" data-field="url" type="url" placeholder="https://docs.google.com/forms/..." required disabled></label>
    <label>Topics (optional)<input class="bulk-course-input" data-field="topics" maxlength="300" placeholder="Cell biology, membranes" disabled></label>
    <label>Google Form ID (optional)<input class="bulk-course-input" data-field="form-id" disabled></label></fieldset>`).join("");
  document.querySelectorAll(".bulk-course-toggle").forEach(toggle=>toggle.addEventListener("change",()=>{
    toggle.closest(".bulk-quiz-course").querySelectorAll(".bulk-course-input").forEach(input=>{input.disabled=!toggle.checked});
  }));
}
renderBulkQuizRows();
async function loadContent(){
  const [q,r]=await Promise.all([db.from("quizzes").select("*").eq("is_published",true).order("created_at",{ascending:false}),db.from("resources").select("*").eq("is_published",true).order("created_at",{ascending:false})]);
  if(q.error||r.error){console.error(q.error||r.error);return}quizzes=q.data||[];resources=r.data||[];renderQuizzes();renderResources();renderRecentItems();renderCourses();
}
function recordRecentItem(kind,id){
  if(!currentUser||!["quiz","resource"].includes(kind)||!/^\d+$/.test(String(id)))return;
  const recentItems=[{kind,id:String(id),visitedAt:new Date().toISOString()},...(userPreferences.recentItems||[])
    .filter(item=>item.kind!==kind||String(item.id)!==String(id))].slice(0,8);
  void savePersonalPreferences({recentItems},"recent-items-status","Recent items synced to your account.");
  renderRecentItems();
}
async function renderRecentItems(){
  const list=$("recent-items-list");if(!list)return;
  const requestId=++recentRenderId;
  const entries=(userPreferences.recentItems||[]).map(item=>{
    const data=item.kind==="quiz"?quizzes.find(row=>String(row.id)===item.id):resources.find(row=>String(row.id)===item.id);
    return data?{...item,data}:null;
  }).filter(Boolean);
  if(!entries.length){
    list.innerHTML='<p class="muted">Your recent quizzes and resources will appear here as you study.</p>';return;
  }
  const resolved=await Promise.all(entries.map(async item=>{
    if(item.kind==="quiz")return {...item,url:item.data.google_form_url,error:null};
    try{return {...item,...await getResourceLink(item.data)}}
    catch(error){console.error("Could not load a recent study resource.",error);return {...item,url:null,error:error.message}}
  }));
  if(requestId!==recentRenderId)return;
  list.innerHTML=resolved.map(item=>{
    const link=item.url&&safeUrl(item.url)
      ?`<a class="button button-outline" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" data-recent-kind="${item.kind}" data-recent-id="${esc(item.id)}">Open again ↗</a>`
      :'<span class="field-help">This item is no longer available.</span>';
    return `<article class="recent-item"><div><span class="tag">${esc(item.kind==="quiz"?"Quiz":"Resource")} • ${esc(item.data.course)}</span><h3>${esc(item.data.title)}</h3><time datetime="${esc(item.visitedAt)}">Opened ${esc(formatDateTime(item.visitedAt))}</time></div>${link}</article>`;
  }).join("");
}
async function loadClassAndExamData(){
  if(!currentUser)return;
  const [classes,exams]=await Promise.all([
    db.from("class_timetable").select("*").order("day_of_week").order("start_time"),
    db.from("mb_exams").select("*").order("starts_at")
  ]);
  if(classes.error||exams.error){
    const error=classes.error||exams.error;
    scheduleDataLoaded=false;classSessions=[];mbExams=[];
    console.error("Could not load class and exam schedules.",error);
    const detail=error.code==="PGRST205"
      ?"Run the latest schema.sql in Supabase to enable classes and exams."
      :"Could not load the timetable: "+error.message;
    scheduleLoadError=detail;renderTimetable();renderExams();
    return false;
  }
  scheduleDataLoaded=true;scheduleLoadError=null;classSessions=classes.data||[];mbExams=exams.data||[];
  if(!document.querySelector(".day-tab[aria-selected='true']"))activeTimetableDay=weekdayIndex();
  renderTimetable();renderExams();
  return true;
}
function classStatus(session,date=new Date()){
  if(dayNumber(date)!==Number(session.day_of_week))return "upcoming";
  const [startHour,startMinute]=session.start_time.split(":").map(Number);
  const [endHour,endMinute]=session.end_time.split(":").map(Number);
  const start=new Date(date);start.setHours(startHour,startMinute,0,0);
  const end=new Date(date);end.setHours(endHour,endMinute,0,0);
  if(date<start)return "upcoming";
  return date<end?"started":"ended";
}
function renderTimetable(){
  const tabs=$("timetable-day-tabs");if(!tabs)return;
  const now=new Date(),today=weekdayIndex(now),isWeekday=now.getDay()>=1&&now.getDay()<=5;
  tabs.innerHTML=WEEKDAYS.map((day,index)=>`<button class="day-tab${activeTimetableDay===index?" active":""}" type="button" role="tab" aria-selected="${activeTimetableDay===index}" data-timetable-day="${index}">${day}${isWeekday&&today===index?'<span class="today-label">Today</span>':""}</button>`).join("");
  tabs.querySelectorAll("[data-timetable-day]").forEach(button=>button.addEventListener("click",()=>{
    activeTimetableDay=Number(button.dataset.timetableDay);renderTimetable();
  }));
  const selectedDate=new Date(),selectedJsDay=(activeTimetableDay+1)%7,jsDay=selectedDate.getDay();
  const dateOffset=jsDay===0||jsDay===6?(1-jsDay+7)%7:selectedJsDay-jsDay;
  selectedDate.setDate(selectedDate.getDate()+dateOffset);
  $("timetable-date").textContent=formatDateTime(selectedDate,{weekday:"long",month:"long",day:"numeric"});
  if(!scheduleDataLoaded){$("class-timetable").textContent=scheduleLoadError||"The class timetable is unavailable.";return}
  const rows=classSessions.filter(item=>Number(item.day_of_week)===activeTimetableDay+1)
    .sort((a,b)=>a.start_time.localeCompare(b.start_time));
  $("class-timetable").innerHTML=rows.length?rows.map(item=>{
    const status=activeTimetableDay===today?classStatus(item,new Date()):"upcoming",label=status==="started"?"In progress":status==="ended"?"Ended":"Upcoming";
    return `<article class="class-session class-${status}"><div class="class-session-time"><strong>${esc(formatTime(item.start_time))}</strong><span>to ${esc(formatTime(item.end_time))}</span></div><div class="class-session-info"><span class="tag">${esc(item.course)}</span><h3>${esc(item.title)}</h3><p>Lecturer: ${esc(item.lecturer)}</p></div><span class="class-status">${label}</span></article>`;
  }).join(""):'<p class="muted">No lectures are scheduled for this day.</p>';
}
function examCountdown(startsAt,now=new Date()){
  const start=new Date(startsAt);
  if(start<=now)return "Started";
  const today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
  const examDay=new Date(start.getFullYear(),start.getMonth(),start.getDate());
  const days=Math.max(0,Math.ceil((examDay-today)/DAY_MILLISECONDS));
  if(days===0)return "Today";
  return `${days} day${days===1?"":"s"} to go`;
}
function renderExams(){
  const list=$("exam-list");if(!list)return;
  if(!scheduleDataLoaded){list.textContent=scheduleLoadError||"The exam timetable is unavailable.";return}
  const now=new Date(),upcoming=mbExams.filter(exam=>new Date(exam.ends_at)>=now);
  list.innerHTML=upcoming.length?upcoming.map(exam=>`<article class="exam-card">
    <div class="exam-countdown"><strong>${esc(examCountdown(exam.starts_at,now))}</strong><span>until exam</span></div>
    <div class="exam-details"><span class="tag">${esc(exam.course)} • ${esc(exam.exam_type)}</span><h3>${esc(exam.exam_name)}</h3>
      <p>Starts ${esc(formatDateTime(exam.starts_at))}</p><p>Ends ${esc(formatDateTime(exam.ends_at))}</p></div>
  </article>`).join(""):'<p class="muted">No upcoming exams have been scheduled.</p>';
}
function startScheduleNotifications(){
  if(liveNoticeTimer)clearInterval(liveNoticeTimer);
  const check=()=>{
    if(!currentUser)return;
    const now=new Date(),today=localDateKey(now),minuteOfDay=now.getHours()*60+now.getMinutes();
    if(pruneExpiredCalendarNotices(now))renderNotifications();
    const showInApp=featureEnabled("schedule_reminders")&&userPreferences.scheduleAlerts,showClassInApp=showInApp&&featureEnabled("classes");
    const showPhone=phoneClassAlertsEnabled()&&featureEnabled("classes");
    const classExpiresAt=localEndOfDay(now);
    if(showClassInApp||showPhone){
      for(const session of classSessions){
        if(Number(session.day_of_week)!==dayNumber(now))continue;
        const start=session.start_time.split(":").map(Number),end=session.end_time.split(":").map(Number);
        const startMinute=start[0]*60+start[1],endMinute=end[0]*60+end[1];
        const startId=`class-${session.id}-${today}-start`,endId=`class-${session.id}-${today}-end`;
        if(showClassInApp&&minuteOfDay>=startMinute){
          const title=`${session.course} class has started`,body=`${session.title} with ${session.lecturer} ${minuteOfDay<endMinute?"is now in session.":"started earlier today."}`;
          addCalendarNotice(startId,title,body,classExpiresAt);
        }
        if(showPhone&&minuteOfDay>=startMinute&&minuteOfDay<startMinute+5){
          const title=`${session.course} class has started`,body=`${session.title} with ${session.lecturer} is now in session.`;
          showPhoneClassNotice(startId,title,body);
        }
        if(showClassInApp&&minuteOfDay>=endMinute){
          const title=`${session.course} class has ended`,body=`${session.title} with ${session.lecturer} has finished.`;
          addCalendarNotice(endId,title,body,classExpiresAt);
        }
        if(showPhone&&minuteOfDay>=endMinute&&minuteOfDay<endMinute+5){
          const title=`${session.course} class has ended`,body=`${session.title} with ${session.lecturer} has finished.`;
          showPhoneClassNotice(endId,title,body);
        }
      }
    }
    if(showInApp&&featureEnabled("exams"))for(const exam of mbExams){
      const start=new Date(exam.starts_at),days=Math.round((new Date(start.getFullYear(),start.getMonth(),start.getDate())-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/DAY_MILLISECONDS);
      const reminderDays=[30,7,1];
      if(reminderDays.includes(days)){
        addCalendarNotice(`exam-${exam.id}-${days}d-${today}`,`${exam.exam_name} is ${days===30?"one month":days===7?"one week":"one day"} away`,`${exam.course} ${exam.exam_type} starts ${formatDateTime(start)}.`);
      }
    }
  };
  check();liveNoticeTimer=setInterval(()=>{check();if(scheduleDataLoaded){renderTimetable();renderExams()}},15000);
}
async function renderHomeLeaderboard(){
  const box=$("home-leaderboard-content");if(!box||!currentUser)return;
  box.setAttribute("aria-busy","true");box.innerHTML=loadingMessage("Loading rankings…");
  try{
    const rows=(await getView("overall_leaderboard")).sort((a,b)=>b.average_percentage-a.average_percentage);
    await hydratePublicProfileVisuals(rows);
    const rank=rows.findIndex(row=>row.user_id===currentUser.id);
    $("home-leaderboard-rank").innerHTML=rank>=0?rank<3?`${medal(rank+1)} <span>${rank+1}</span>`:`<span class="ordinal-rank">${medal(rank+1)}</span>`:"—";
    $("home-leaderboard-label").textContent=rank>=0?"Your overall rank":$("leaderboard-opt-in").checked?"Waiting for 3 students with verified scores":"Opt in; ranking starts after 3 students qualify";
    box.innerHTML=rows.length?rows.map((row,index)=>{
      const title=avatarTitle(publicProfileVisuals.get(row.user_id));
      return `<button type="button" class="home-leader-row leaderboard-member-row" data-public-profile="${esc(row.user_id)}" data-public-rank="${index+1}"><span class="medal${index>=3?" ordinal-rank":""}">${index===0?'🏆':medal(index+1)}</span>${avatarMarkup(row.display_name,row.user_id,"leader-avatar")}<span class="home-leader-name"><strong>${esc(row.display_name)}${row.user_id===currentUser.id?" (you)":""}</strong>${title?`<small style="--title-color:${esc(title.color||"var(--teal)")}">${esc(title.symbol||"")} ${esc(title.name)}</small>`:""}</span><span>${Number(row.average_percentage).toFixed(1)}%</span></button>`;
    }).join(""):'<p class="muted">No rankings yet. At least three opted-in students need a verified score before rankings appear.</p>';
  }catch(error){box.innerHTML=`<p class="muted">Could not load leaderboard: ${esc(error.message)}</p>`}
  finally{
    box.removeAttribute("aria-busy");
    if("IntersectionObserver" in window){
      const observer=new IntersectionObserver(entries=>{
        entries.forEach(entry=>{
          if(!entry.isIntersecting)return;
          entry.target.querySelectorAll(".leaderboard-member-row").forEach((row,index)=>{
            row.style.transitionDelay=`${Math.min(index*55,330)}ms`;
            row.classList.add("is-overtaking");
            setTimeout(()=>row.classList.remove("is-overtaking"),1200);
          });
          observer.unobserve(entry.target);
        });
      },{threshold:.25});
      observer.observe(box);
    }
  }
}
function medal(rank){
  if(rank===1)return "🥇";
  if(rank===2)return "🥈";
  if(rank===3)return "🥉";
  const suffix=rank%100>=11&&rank%100<=13?"th":rank%10===1?"st":rank%10===2?"nd":rank%10===3?"rd":"th";
  return `${rank}${suffix}`;
}
async function openPublicProfile(userId,rank){
  if(currentProfileRole==="guest"||!["member","admin"].includes(currentProfileRole))return;
  const {data,error}=await db.from("member_public_profiles").select("id,display_name,avatar_url,level,xp,equipped_items,school,clinical_interests").eq("id",userId).single();
  if(error||!data)return;
  publicProfileVisuals.set(userId,data);
  const title=avatarTitle(data);
  const avatar=avatarMarkup(data.display_name,userId,"public-profile-avatar",data);
  $("public-profile-content").innerHTML=`<div class="public-profile-hero">${avatar}<p class="eyebrow">PUBLIC MEMBER PROFILE</p><h2 id="public-profile-name">${esc(data.display_name||"Student")}</h2>${title?`<p class="public-profile-title" style="--title-color:${esc(title.color||"var(--teal)")}">${esc(title.symbol||"")} ${esc(title.name)}</p>`:""}<div class="public-profile-stats"><span><strong>#${rank||"—"}</strong>Leaderboard rank</span><span><strong>${Number(data.level)||1}</strong>Level</span><span><strong>${Number(data.xp)||0}</strong>XP</span></div><dl><dt>School</dt><dd>${esc(data.school||"Not set")}</dd><dt>Clinical interests</dt><dd>${esc(data.clinical_interests||"Not set")}</dd></dl></div>`;
  const modal=$("public-profile-modal");modal.classList.add("is-open");modal.setAttribute("aria-hidden","false");document.body.classList.add("dialog-open");
}
function closePublicProfile(){
  const modal=$("public-profile-modal");if(!modal)return;
  modal.classList.remove("is-open");modal.setAttribute("aria-hidden","true");document.body.classList.remove("dialog-open");
}
$("public-profile-close").addEventListener("click",closePublicProfile);
$("public-profile-modal").addEventListener("click",event=>{if(event.target.id==="public-profile-modal")closePublicProfile()});
function renderQuizzes(){
  const topicSelect=$("quiz-topic-filter"),previousTopic=topicSelect.value;
  const allTopics=[...new Set(quizzes.flatMap(quiz=>Array.isArray(quiz.topics)?quiz.topics.filter(topic=>typeof topic==="string"&&topic.trim()):[]))]
    .sort((a,b)=>a.localeCompare(b));
  topicSelect.innerHTML='<option value="all">All topics</option>'+allTopics.map(topic=>`<option value="${esc(topic)}">${esc(topic)}</option>`).join("");
  if(allTopics.includes(previousTopic))topicSelect.value=previousTopic;
  const course=$("quiz-course-filter").value||"all",difficulty=$("quiz-difficulty-filter").value||"all";
  const topic=topicSelect.value||"all",query=$("quiz-search").value.trim().toLocaleLowerCase();
  const favorites=new Set(userPreferences.quizFavorites||[]),favoritesOnly=$("quiz-favorites-only").checked;
  const rows=quizzes.filter(quiz=>{
    const topics=Array.isArray(quiz.topics)?quiz.topics:[];
    const searchable=[quiz.title,quiz.description,quiz.course,quiz.difficulty,...topics].filter(Boolean).join(" ").toLocaleLowerCase();
    return (course==="all"||quiz.course===course)&&(difficulty==="all"||(quiz.difficulty||"Practice")===difficulty)&&
      (topic==="all"||topics.includes(topic))&&(!query||searchable.includes(query))&&
      (!favoritesOnly||favorites.has(String(quiz.id)));
  });
  $("quiz-results-status").textContent=`${rows.length} quiz${rows.length===1?"":"zes"} found.`;
  $("quiz-list").innerHTML=rows.length?rows.map(quiz=>{
    const favorite=favorites.has(String(quiz.id)),topics=Array.isArray(quiz.topics)?quiz.topics:[];
    const requiredLevel=Number(quiz.required_level)||1,gemCost=Number(quiz.gem_cost)||0;
    const levelLocked=currentProfileLevel<requiredLevel;
    const prerequisiteLocked=quiz.prerequisite_quiz_id&&attempts.every(attempt=>String(attempt.quiz_id)!==String(quiz.prerequisite_quiz_id));
    const gemLocked=gemCost>0&&!unlockedQuizIds.has(String(quiz.id));
    const locked=levelLocked||prerequisiteLocked||gemLocked;
    const requirements=[
      levelLocked?`Level ${requiredLevel} required`:"",
      prerequisiteLocked?"Complete prerequisite quiz":"",
      gemLocked?`${gemCost} gems required`:""
    ].filter(Boolean);
    const action=locked
      ?`<button class="button button-outline" type="button" data-unlock-quiz="${esc(quiz.id)}" ${gemCost===0?"disabled":""}>${gemCost?`Unlock for ${gemCost} Gems`:"Locked"}</button>`
      :`<a class="button button-primary" href="${esc(quiz.google_form_url)}" target="_blank" rel="noopener noreferrer" data-recent-kind="quiz" data-recent-id="${esc(quiz.id)}">Open Google Form ↗</a>`;
    return `<article class="content-card quiz-gated-card ${locked?"is-locked":""}"><span class="tag">${esc(quiz.course)} • ${esc(quiz.difficulty||"Practice")}</span><h3>${esc(quiz.title)}</h3><p>${esc(quiz.description||"Open the quiz to begin.")}</p>${topics.length?`<div class="quiz-topic-tags">${topics.map(item=>`<span class="quiz-topic-tag">${esc(item)}</span>`).join("")}</div>`:""}${locked?`<div class="quiz-lock-overlay" role="status"><span aria-hidden="true">🔒</span><strong>Locked</strong><small>${requirements.map(esc).join(" • ")}</small></div>`:""}<div class="quiz-card-actions">${action}<button class="button button-outline quiz-favorite-button" type="button" data-favorite-quiz="${esc(quiz.id)}" aria-pressed="${favorite}" aria-label="${favorite?"Remove from":"Add to"} favorites: ${esc(quiz.title)}">${favorite?"★ Saved":"☆ Save"}</button></div></article>`;
  }).join(""):'<p class="panel">No quizzes match these filters. Try changing your search or filters.</p>';
}
function parseQuizTopics(value){
  return [...new Map(String(value||"").split(",").map(topic=>topic.trim().slice(0,40)).filter(Boolean)
    .map(topic=>[topic.toLocaleLowerCase(),topic])).values()].slice(0,12);
}
["quiz-course-filter","quiz-topic-filter","quiz-difficulty-filter","quiz-favorites-only"].forEach(id=>$(id).addEventListener("change",renderQuizzes));
$("quiz-search").addEventListener("input",renderQuizzes);
async function unlockQuiz(quizId){
  if(!currentUser||currentProfileRole==="guest")return;
  const quiz=quizzes.find(item=>String(item.id)==String(quizId));
  if(!quiz)return;
  const cost=Number(quiz.gem_cost)||0;
  if(cost<=0)return;
  const {data,error}=await db.rpc("spend_gems",{p_amount:cost});
  if(error){message("quiz-results-status",error.message,true);return}
  const {error:unlockError}=await db.from("user_unlocked_quizzes").insert({user_id:currentUser.id,quiz_id:Number(quizId)});
  if(unlockError){message("quiz-results-status",unlockError.message,true);return}
  unlockedQuizIds.add(String(quizId));syncGemBalance(data,Math.max(0,currentProfileGems-cost));
  message("quiz-results-status","Quiz unlocked.");
  renderQuizzes();renderGemsShop();
}
$("quiz-list").addEventListener("click",event=>{
  const unlock=event.target.closest("[data-unlock-quiz]");
  if(unlock){void unlockQuiz(unlock.dataset.unlockQuiz);return}
  const button=event.target.closest("[data-favorite-quiz]");
  if(!button)return;
  const id=button.dataset.favoriteQuiz,current=new Set(userPreferences.quizFavorites||[]);
  if(current.has(id))current.delete(id);else current.add(id);
  const save=savePersonalPreferences({quizFavorites:[...current]},"quiz-preference-status","Quiz favorites synced to your account.");
  renderQuizzes();void save;
});
function renderDriveSearchResults(){
  const results=$("drive-search-results");
  if(!driveFilesLoaded){results.textContent="";return}
  const query=$("drive-document-search").value.trim().toLocaleLowerCase();
  const matching=driveFiles.filter(file=>file.name.toLocaleLowerCase().includes(query));
  $("drive-search-status").textContent=matching.length
    ?`${matching.length} document${matching.length===1?"":"s"} found.`
    :"No documents found.";
  results.innerHTML=matching.length?matching.map(file=>`<button class="drive-file-result" type="button" data-drive-file-id="${esc(file.id)}" data-drive-file-name="${esc(file.name)}">
    <span class="drive-file-icon" aria-hidden="true">▤</span><span class="drive-file-copy"><strong>${esc(file.name)}</strong><small>${esc(file.mimeType||"Google Drive file")}</small></span><span class="drive-file-open">Preview</span>
  </button>`).join(""):'<p class="muted drive-empty-state">No documents found. Try another search.</p>';
}
async function loadDriveFiles(force=false){
  if(driveFilesLoaded&&!force){renderDriveSearchResults();return}
  const errorBox=$("drive-search-error"),retry=$("drive-search-retry");
  const apiKey=GOOGLE_DRIVE_API_KEY.trim(),folderId=GOOGLE_DRIVE_FOLDER_ID.trim();
  if(!apiKey||apiKey.startsWith("YOUR_")||!folderId||folderId.startsWith("YOUR_")){
    errorBox.textContent="Google Drive search is not configured yet. Add your API key and public folder ID to GOOGLE_DRIVE_API_KEY and GOOGLE_DRIVE_FOLDER_ID at the top of app.js, then reload this page.";
    errorBox.classList.remove("hidden");retry.classList.add("hidden");
    $("drive-search-status").textContent="Waiting for Google Drive configuration.";
    $("drive-search-results").textContent="";
    return;
  }
  const requestId=++driveRequestId;
  errorBox.classList.add("hidden");retry.classList.add("hidden");
  $("drive-search-status").innerHTML='<span class="refresh-spinner" aria-hidden="true"></span>Loading documents from Google Drive…';
  $("drive-search-results").textContent="";
  retry.disabled=true;
  try{
    const escapedFolderId=folderId.replace(/\\/g,"\\\\").replace(/'/g,"\\'");
    const query=`'${escapedFolderId}' in parents and trashed = false`;
    const files=[];
    let pageToken="";
    const seenPageTokens=new Set();
    do{
      const url=new URL("https://www.googleapis.com/drive/v3/files");
      url.searchParams.set("key",apiKey);
      url.searchParams.set("q",query);
      url.searchParams.set("fields","nextPageToken,files(id,name,mimeType)");
      url.searchParams.set("pageSize","1000");
      url.searchParams.set("orderBy","name");
      url.searchParams.set("includeItemsFromAllDrives","true");
      url.searchParams.set("supportsAllDrives","true");
      if(pageToken)url.searchParams.set("pageToken",pageToken);
      const response=await fetch(url);
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.error&&payload.error.message||`Google Drive returned HTTP ${response.status}.`);
      if(!Array.isArray(payload.files))throw new Error("Google Drive returned an unexpected file list.");
      files.push(...payload.files.filter(file=>file&&typeof file.id==="string"&&typeof file.name==="string"));
      pageToken=payload.nextPageToken||"";
      if(pageToken&&seenPageTokens.has(pageToken))throw new Error("Google Drive returned a repeated page token.");
      if(pageToken)seenPageTokens.add(pageToken);
    }while(pageToken);
    if(requestId!==driveRequestId)return;
    driveFiles=files;driveFilesLoaded=true;
    $("drive-search-status").textContent=`Loaded ${files.length} file${files.length===1?"":"s"} from the shared folder.`;
    renderDriveSearchResults();
  }catch(error){
    if(requestId!==driveRequestId)return;
    console.error("Could not load Google Drive files.",error);
    errorBox.textContent=`Google Drive documents could not be loaded: ${error.message} Check that the Drive API is enabled, your API key is valid, and the folder is shared so anyone with the link can view it.`;
    errorBox.classList.remove("hidden");retry.classList.remove("hidden");
    $("drive-search-status").textContent="Document search is unavailable until the folder can be loaded.";
  }finally{
    if(requestId===driveRequestId)retry.disabled=false;
  }
}
function openDrivePreview(fileId,fileName){
  const encodedId=encodeURIComponent(fileId);
  $("drive-preview-title").textContent=fileName;
  $("drive-preview-frame").src=`https://drive.google.com/file/d/${encodedId}/preview`;
  $("drive-download-link").href=`https://drive.google.com/uc?export=download&id=${encodedId}`;
  $("drive-viewer").classList.remove("hidden");
  $("drive-viewer").scrollIntoView({behavior:userPreferences.reduceMotion?"auto":"smooth",block:"start"});
}
$("drive-document-search").addEventListener("input",renderDriveSearchResults);
$("drive-search-results").addEventListener("click",event=>{
  const button=event.target.closest("[data-drive-file-id]");
  if(button)openDrivePreview(button.dataset.driveFileId,button.dataset.driveFileName);
});
$("drive-preview-close").addEventListener("click",()=>{
  $("drive-preview-frame").src="";$("drive-viewer").classList.add("hidden");
});
$("drive-search-retry").addEventListener("click",()=>void loadDriveFiles(true));
async function getResourceLink(resource){
  if(!resource.storage_path)return {url:resource.url,error:null};
  const cached=resourceLinkCache.get(resource.storage_path);
  if(cached&&cached.expiresAt>Date.now())return {url:cached.url,error:null};
  const {data,error}=await db.storage.from(DOCUMENT_BUCKET).createSignedUrl(resource.storage_path,3600);
  if(error){console.error(error);return {url:null,error:error.message}}
  const result={url:data.signedUrl,error:null};resourceLinkCache.set(resource.storage_path,{url:result.url,expiresAt:Date.now()+55*60*1000});
  return result;
}
async function renderResources(){
  const requestId=++resourceRenderId,c=$("resource-course-filter").value||"all",t=$("resource-type-filter").value||"all";
  const rows=resources.filter(r=>(c==="all"||r.course===c)&&(t==="all"||r.resource_type===t));
  $("resource-list").setAttribute("aria-busy","true");$("resource-list").innerHTML=loadingMessage("Loading study materials…");
  const entries=await Promise.all(rows.map(async resource=>{
    try{const link=await getResourceLink(resource);return {resource,...link}}
    catch(error){console.error("Could not load a study resource.",error);return {resource,url:null,error:error.message}}
  }));
  if(requestId!==resourceRenderId)return;
  const visibleCourses=c==="all"?COURSES:[c];
  const card=entry=>{
    const r=entry.resource,link=entry.url&&safeUrl(entry.url)?`<a class="button button-outline" href="${esc(entry.url)}" target="_blank" rel="noopener noreferrer" data-recent-kind="resource" data-recent-id="${esc(r.id)}">${r.storage_path?"Download document ↗":r.resource_type==="video"?"Watch video ↗":"Open resource ↗"}</a>`:`<p class="message error">Could not load this document: ${esc(entry.error||"Invalid resource URL")}</p>`;
    return `<article class="content-card"><span class="tag">${esc(r.course)} • ${esc(r.resource_type)}</span><h4>${esc(r.title)}</h4><p>${esc(r.description||"")}</p><div class="resource-card-actions">${link}</div></article>`;
  };
  $("resource-list").innerHTML=visibleCourses.map(course=>{
    const courseRows=entries.filter(entry=>entry.resource.course===course);
    const groups=[
      ["note","Notes &amp; documents","No notes or documents yet."],
      ["textbook","Textbooks &amp; references","No textbooks or references yet."],
      ["video","Videos","No videos yet."],
      ["other","Other resources","No other resources yet."]
    ];
    return `<section class="course-resource-section"><h2>${esc(course)}</h2><div class="course-resource-columns">
      ${groups.filter(([type])=>t==="all"||t===type).map(([type,heading,empty])=>{
        const matching=courseRows.filter(entry=>entry.resource.resource_type===type);
        return `<div class="resource-group"><h3>${heading}</h3><div class="resource-group-cards">${matching.length?matching.map(card).join(""):`<p class="muted">${empty}</p>`}</div></div>`;
      }).join("")}
    </div></section>`;
  }).join("");
  $("resource-list").removeAttribute("aria-busy");
}
$("resource-course-filter").onchange=renderResources;$("resource-type-filter").onchange=renderResources;

$("study-task-form").addEventListener("submit",event=>{
  event.preventDefault();
  const title=$("study-task-title").value.trim();
  if(!title)return;
  if(studyTasks.length>=50){message("study-task-status","You can keep up to 50 study tasks. Remove or clear completed tasks to add another.",true);return}
  const dueDate=$("study-task-due-date").value;
  const nextTasks=[...studyTasks,{id:`${Date.now()}-${Math.random().toString(36).slice(2,8)}`,title,dueDate,completed:false}];
  if(saveStudyTasks(nextTasks)){$("study-task-form").reset();$("study-task-title").focus()}
});
$("study-task-list").addEventListener("change",event=>{
  const checkbox=event.target.closest("[data-study-task-toggle]");
  if(!checkbox)return;
  const nextTasks=studyTasks.map(task=>task.id===checkbox.dataset.studyTaskToggle?{...task,completed:checkbox.checked}:task);
  if(!saveStudyTasks(nextTasks))checkbox.checked=!checkbox.checked;
});
$("study-task-list").addEventListener("click",event=>{
  const button=event.target.closest("[data-study-task-remove]");
  if(!button)return;
  saveStudyTasks(studyTasks.filter(task=>task.id!==button.dataset.studyTaskRemove));
});
$("study-task-clear-completed").addEventListener("click",()=>{
  saveStudyTasks(studyTasks.filter(task=>!task.completed));
});
$("study-goal-form").addEventListener("submit",async event=>{
  event.preventDefault();
  const goal=Number($("weekly-quiz-goal").value);
  if(!Number.isInteger(goal)||goal<1||goal>20){message("study-goal-save-status","Choose a weekly target between 1 and 20 quizzes.",true);return}
  const submit=$("study-goal-form").querySelector('[type="submit"]');
  submit.disabled=true;
  await savePersonalPreferences({weeklyQuizGoal:goal},"study-goal-save-status","Weekly quiz goal saved to your account.");
  renderWeeklyQuizGoal();submit.disabled=false;
});
$("page-progress").addEventListener("click",event=>{
  const quizzesButton=event.target.closest("[data-focus-quizzes]"),resourcesButton=event.target.closest("[data-focus-resources]");
  if(quizzesButton){
    $("quiz-course-filter").value=quizzesButton.dataset.focusQuizzes;showPage("quizzes");return;
  }
  if(resourcesButton){
    $("resource-course-filter").value=resourcesButton.dataset.focusResources;showPage("resources");
  }
});
$("export-progress-csv").addEventListener("click",downloadProgressCsv);
$("print-progress-report").addEventListener("click",printProgressReport);
$("score-form").addEventListener("submit",async e=>{
  e.preventDefault();const score=Number($("score-earned").value),total=Number($("score-total").value);
  if(total<=0||score<0||score>total){message("score-message","Enter a valid score; earned marks cannot exceed total marks.",true);return}
  const {error}=await db.from("quiz_attempts").insert({user_id:currentUser.id,course:$("score-course").value,quiz_title:$("score-title").value.trim(),score,total_marks:total,is_verified:false,source:"manual"});
  if(error){message("score-message",error.message,true);return}
  $("score-form").reset();message("score-message","Saved to your private record. This manually entered score is not included in official rankings.");await loadAttempts();
});
async function loadAttempts(){
  if(!currentUser)return;const {data,error}=await db.from("quiz_attempts").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false});
  if(error){console.error(error);return}attempts=data||[];renderPersonalStats();
  try{await syncUnlockedAchievements()}
  catch(syncError){console.warn("Could not sync achievement progress.",syncError)}
}
function renderPersonalStats(){
  const n=attempts.length,avg=n?attempts.reduce((s,a)=>s+100*Number(a.score)/Number(a.total_marks),0)/n:0;
  const verified=attempts.filter(a=>a.is_verified).length;
  renderProfileMetrics();
  $("stats-grid").innerHTML=`<div class="stat"><strong data-count-up="${n}">${n}</strong><span>Personal quizzes recorded</span></div><div class="stat"><strong data-count-up="${avg.toFixed(1)}" data-count-decimals="1" data-count-suffix="%">${avg.toFixed(1)}%</strong><span>Personal average</span></div><div class="stat"><strong data-count-up="${verified}">${verified}</strong><span>Verified scores</span></div><div class="stat"><strong id="website-usage-total">${esc(formatDuration(loadWebsiteUsage()))}</strong><span>Time on this device</span></div>`;
  $("stats-grid").querySelectorAll("[data-count-up]").forEach(item=>animateCountUp(item,item.dataset.countUp,Number(item.dataset.countDecimals)||0,item.dataset.countSuffix||""));
  $("results-body").innerHTML=n?attempts.map(a=>{
    const answerSummary=Array.isArray(a.answer_summary)?a.answer_summary:[];
    const paidReview=a.summary_unlocked===true;
    const review=answerSummary.length
      ?paidReview?`<details class="answer-review"><summary>Review answers (${answerSummary.length})</summary><ol>${answerSummary.map(item=>{
      const result=quizAnswerResult(item),status=`<span class="answer-result answer-${result.kind}">${result.label}</span>`;
      const points=result.kind!=="pending"?`<p><strong>Points:</strong> ${esc(item.points_awarded)} / ${esc(item.points_possible)}</p>`:"";
      const correctAnswers=Array.isArray(item.correct_answers)?item.correct_answers.filter(answer=>typeof answer==="string"):[];
      const correctAnswer=correctAnswers.length?`<p><strong>Correct answer${correctAnswers.length===1?"":"s"}:</strong> ${correctAnswers.map(esc).join(", ")}</p>`:"";
      return `<li><h4>${esc(item.question)} ${status}</h4><p><strong>Your answer:</strong> ${esc(item.answer)}</p>${correctAnswer}${points}${item.feedback?`<p><strong>Feedback:</strong> ${esc(item.feedback)}</p>`:""}</li>`;
    }).join("")}</ol></details>`:`<button class="button button-outline" type="button" data-unlock-summary="${esc(a.id)}" ${currentProfileRole==="guest"?"disabled":""}>Unlock Answer Review · 15 Gems</button>`
      :'<span class="muted">Not provided</span>';
    return `<tr><td>${esc(formatDate(a.created_at))}</td><td>${esc(a.course)}</td><td>${esc(a.quiz_title)}</td><td>${Number(a.score)} / ${Number(a.total_marks)} (${(100*Number(a.score)/Number(a.total_marks)).toFixed(1)}%)</td><td><span class="status-pill ${a.is_verified?"status-published":"status-draft"}">${a.is_verified?"Verified":"Private / unverified"}</span></td><td>${review}</td></tr>`;
  }).join(""):'<tr><td colspan="6">No results recorded yet.</td></tr>';
  renderStudyStreak();renderChart();renderAchievements();renderWeeklyQuizGoal();renderCourseFocus();
}
function quizAnswerResult(item){
  if(!String(item.answer??"").trim())return {label:"Unanswered",kind:"unanswered"};
  if(!Number.isFinite(item.points_awarded)||!Number.isFinite(item.points_possible)||item.points_possible<=0)return {label:"Result unavailable",kind:"pending"};
  if(item.points_awarded>=item.points_possible)return {label:"Correct",kind:"correct"};
  if(item.points_awarded<=0)return {label:"Incorrect",kind:"incorrect"};
  return {label:"Partially correct",kind:"partial"};
}
async function unlockAnswerSummary(attemptId){
  if(!currentUser||currentProfileRole==="guest")return;
  const {data,error}=await db.rpc("spend_gems",{p_amount:15});
  if(error){message("progress-export-status",error.message,true);return}
  const {error:updateError}=await db.from("quiz_attempts").update({summary_unlocked:true}).eq("id",attemptId).eq("user_id",currentUser.id);
  if(updateError){message("progress-export-status",updateError.message,true);return}
  syncGemBalance(data,Math.max(0,currentProfileGems-15));
  await loadAttempts();
  renderGemsShop();
}
$("results-body").addEventListener("click",event=>{
  const button=event.target.closest("[data-unlock-summary]");
  if(button)void unlockAnswerSummary(button.dataset.unlockSummary);
});
function renderWeeklyQuizGoal(){
  const goal=userPreferences.weeklyQuizGoal||3,cutoff=Date.now()-7*DAY_MILLISECONDS;
  const count=attempts.filter(attempt=>Number.isFinite(new Date(attempt.created_at).getTime())&&new Date(attempt.created_at).getTime()>=cutoff).length;
  const progress=Math.min(100,100*count/goal),track=document.querySelector(".study-goal-track");
  $("weekly-quiz-goal").value=String(goal);
  $("study-goal-summary").textContent=`${count} of ${goal} quiz${goal===1?"":"zes"} recorded in the last 7 days.`;
  $("study-goal-status").textContent=count>=goal?"Weekly target reached. Keep up the good work.":`${goal-count} more quiz${goal-count===1?"":"zes"} to reach your target.`;
  track.setAttribute("aria-valuemax",String(goal));track.setAttribute("aria-valuenow",String(Math.min(count,goal)));
  $("study-goal-fill").style.width=`${progress}%`;
}
function renderCourseFocus(){
  const courseStats=COURSES.map(course=>{
    const rows=attempts.filter(attempt=>attempt.course===course&&Number(attempt.total_marks)>0);
    return {course,count:rows.length,average:rows.length?rows.reduce((sum,attempt)=>sum+100*Number(attempt.score)/Number(attempt.total_marks),0)/rows.length:0};
  }).filter(item=>item.count).sort((a,b)=>a.average-b.average||b.count-a.count);
  const list=$("course-focus-list"),actions=$("course-focus-actions");
  if(!courseStats.length){
    $("course-focus-summary").textContent="Record a quiz result to see which course could use more practice.";
    list.innerHTML='<p class="muted">No course results to compare yet.</p>';actions.classList.add("hidden");return;
  }
  const focus=courseStats[0];
  $("course-focus-summary").textContent=focus.average<70
    ?`${focus.course} is currently your lowest-scoring course at ${focus.average.toFixed(1)}%.`
    :`${focus.course} is your lowest-scoring course at ${focus.average.toFixed(1)}%. Keep practising to maintain your progress.`;
  list.innerHTML=courseStats.map(item=>`<div class="course-focus-row"><div><strong>${esc(item.course)}</strong><span>${item.average.toFixed(1)}% average · ${item.count} result${item.count===1?"":"s"}</span></div><div class="course-focus-track" role="progressbar" aria-label="${esc(item.course)} average score" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${item.average.toFixed(1)}"><span style="width:${Math.max(0,Math.min(100,item.average))}%"></span></div></div>`).join("");
  actions.innerHTML=`${featureEnabled("quizzes")?`<button class="button button-primary" type="button" data-focus-quizzes="${esc(focus.course)}">Practice ${esc(focus.course)} quizzes</button>`:""}${featureEnabled("resources")?`<button class="button button-outline" type="button" data-focus-resources="${esc(focus.course)}">Review ${esc(focus.course)} resources</button>`:""}`;
  actions.classList.toggle("hidden",!actions.childElementCount);
}
function csvCell(value){
  const text=String(value??""),safe=/^[\t\r\n ]*[=+\-@]/.test(text)?`'${text}`:text;
  return `"${safe.replace(/"/g,'""')}"`;
}
function downloadProgressCsv(){
  const overallAverage=attempts.length?attempts.reduce((sum,attempt)=>sum+100*Number(attempt.score)/Number(attempt.total_marks),0)/attempts.length:0;
  const rows=[
    ["METROS Study Hub progress report"],
    ["Student",$("home-display-name").textContent],
    ["Generated",formatDateTime(new Date())],
    ["Recorded quizzes",attempts.length],
    ["Overall average",`${overallAverage.toFixed(1)}%`],
    ["Weekly target",`${attempts.filter(attempt=>new Date(attempt.created_at).getTime()>=Date.now()-7*DAY_MILLISECONDS).length} / ${userPreferences.weeklyQuizGoal} quizzes`],
    [],
    ["Date","Course","Quiz","Score","Total marks","Percentage","Verification","Question review"]
  ];
  attempts.forEach(attempt=>{
    const answers=Array.isArray(attempt.answer_summary)?attempt.answer_summary.map(item=>
      `${item.question}: ${quizAnswerResult(item).label}; Your answer: ${item.answer}${Array.isArray(item.correct_answers)&&item.correct_answers.length?`; Correct answer: ${item.correct_answers.join(", ")}`:""}${Number.isFinite(item.points_awarded)&&Number.isFinite(item.points_possible)?` (${item.points_awarded}/${item.points_possible} points)`:""}${item.feedback?` (Feedback: ${item.feedback})`:""}`
    ).join(" | "):"";
    rows.push([
      formatDateTime(attempt.created_at),attempt.course,attempt.quiz_title,attempt.score,attempt.total_marks,
      `${(100*Number(attempt.score)/Number(attempt.total_marks)).toFixed(1)}%`,
      attempt.is_verified?"Verified":"Private / unverified",answers
    ]);
  });
  try{
    const blob=new Blob(["\uFEFF"+rows.map(row=>row.map(csvCell).join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"});
    const url=URL.createObjectURL(blob),link=document.createElement("a");
    link.href=url;link.download=`metros-progress-${localDateKey()}.csv`;document.body.append(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    message("progress-export-status","Your progress report was downloaded.");
  }catch(error){
    console.error("Could not export the progress report.",error);
    message("progress-export-status","Could not download the report: "+error.message,true);
  }
}
function printProgressReport(){
  const progressPage=$("page-progress"),wasHidden=progressPage.classList.contains("hidden");
  progressPage.classList.remove("hidden");document.body.classList.add("printing-progress");
  try{window.print()}
  finally{
    document.body.classList.remove("printing-progress");
    if(wasHidden)progressPage.classList.add("hidden");
  }
}
function renderChart(){
  const ctx=$("performance-chart");if(chart)chart.destroy();
  const dayKeys=[...new Set(attempts.map(a=>new Date(a.created_at).toISOString().slice(0,10)))].sort();
  const labels=dayKeys.map(day=>formatDate(`${day}T12:00:00Z`,{dateStyle:"medium",timeZone:"UTC"}));
  const datasets=COURSES.map(course=>({
    label:course,
    data:dayKeys.map(day=>{
      const rows=attempts.filter(a=>a.course===course&&new Date(a.created_at).toISOString().slice(0,10)===day);
      return rows.length?rows.reduce((sum,a)=>sum+100*Number(a.score)/Number(a.total_marks),0)/rows.length:null;
    }),
    tension:.25,spanGaps:true
  }));
  chart=new Chart(ctx,{type:"line",data:{labels,datasets},options:{responsive:true,interaction:{mode:"index",intersect:false},scales:{y:{beginAtZero:true,max:100,title:{display:true,text:"Average score (%)"}}},plugins:{legend:{position:"bottom"}}}});
}
async function renderAchievements(){
  if(!currentUser||currentProfileRole==="guest"){$("achievement-list").textContent="";return}
  try{await syncUnlockedAchievements()}catch(error){console.info("Achievement sync unavailable.",error)}
  const [achievementResult,userResult]=await Promise.all([
    db.from("achievements").select("*").order("gem_reward"),
    db.from("user_achievements").select("achievement_id,claimed,unlocked_at").eq("user_id",currentUser.id)
  ]);
  if(achievementResult.error||userResult.error){
    message("achievement-status","Achievements could not be loaded. Apply the latest migration.",!!(achievementResult.error||userResult.error));
    return;
  }
  const claimed=new Map((userResult.data||[]).map(row=>[row.achievement_id,row]));
  const achievements=achievementResult.data||[];
  $("achievement-list").innerHTML=achievements.length?achievements.map(item=>{
    const progress=claimed.get(item.id);
    const earned=!!progress;
    const action=earned&&!progress.claimed
      ?`<button class="button button-primary" type="button" data-claim-achievement="${esc(item.id)}">Claim ${item.gem_reward} Gems + ${item.gem_reward} XP</button>`
      :earned?'<span class="status-pill status-published">Gems claimed</span>':'<span>Locked</span>';
    return `<div class="achievement ${earned?"earned":""}"><strong>${earned?esc(item.icon):"🔒"} ${esc(item.title)}</strong><p>${esc(item.description)}</p>${action}</div>`;
  }).join(""):'<p class="muted">No achievements available.</p>';
}
async function syncUnlockedAchievements(){
  if(!currentUser||currentProfileRole==="guest")return;
  const {error}=await db.rpc("sync_unlocked_achievements");
  if(error)throw error;
}
async function loadProfile(){
  if(!currentUser)return;
  profileAcademicFieldsAvailable=true;
  const userId=currentUser.id,panel=document.querySelector(".profile-panel");
  panel.setAttribute("aria-busy","true");message("profile-message","Loading your profile…");
  try{
    const baseFields=["display_name","leaderboard_opt_in","full_name","theme_color","class_name","favorite_subject","quiz_rank","medical_school","specialty_interest","avatar_url","equipped_items"];
    let fields=[...baseFields,"preferences","activity_reset_at"];
    let profile=await db.from("profiles").select(fields.join(",")).eq("id",userId).single();
    let preferencesAvailable=true,resetMarkerAvailable=true,academicFieldsAvailable=true,avatarColumnsAvailable=true;
    for(let retry=0;profile.error&&retry<4;retry++){
      const errorText=profile.error.message||"";
      if(preferencesAvailable&&(profile.error.code==="42703"||profile.error.code==="PGRST204")&&/preferences.*(column|schema cache)|column.*preferences/i.test(errorText)){
        preferencesAvailable=false;fields=fields.filter(field=>field!=="preferences");
      }else if(resetMarkerAvailable&&(profile.error.code==="42703"||profile.error.code==="PGRST204")&&/activity_reset_at.*(column|schema cache)|column.*activity_reset_at/i.test(errorText)){
        resetMarkerAvailable=false;fields=fields.filter(field=>field!=="activity_reset_at");
      }else if(academicFieldsAvailable&&(profile.error.code==="42703"||profile.error.code==="PGRST204")&&/(medical_school|specialty_interest).*(column|schema cache)|column.*(medical_school|specialty_interest)/i.test(errorText)){
        academicFieldsAvailable=false;fields=fields.filter(field=>field!=="medical_school"&&field!=="specialty_interest");
      }else if(avatarColumnsAvailable&&(profile.error.code==="42703"||profile.error.code==="PGRST204")&&/(avatar_url|equipped_items).*(column|schema cache)|column.*(avatar_url|equipped_items)/i.test(errorText)){
        avatarColumnsAvailable=false;fields=fields.filter(field=>field!=="avatar_url"&&field!=="equipped_items");
      }else break;
      console.warn("The profile table is missing a newer optional settings column.",profile.error);
      profile=await db.from("profiles").select(fields.join(",")).eq("id",userId).single();
    }
    if(profile.error)throw profile.error;
    const {data}=profile;
    if(currentUser?.id!==userId)return;
    activityResetSyncAvailable=resetMarkerAvailable;
    profileAcademicFieldsAvailable=academicFieldsAvailable;
    if(avatarColumnsAvailable){
      currentProfileVisuals={avatar_url:data.avatar_url||null,equipped_items:data.equipped_items||{}};
      currentProfileGemSettings.equipped_items=data.equipped_items||currentProfileGemSettings.equipped_items||{};
      selectedPresetAvatar=typeof data.equipped_items?.avatar==="string"?data.equipped_items.avatar:"";
      renderPresetAvatars();
    }
    const activityWasReset=resetMarkerAvailable&&data.activity_reset_at?applyActivityResetMarker(data.activity_reset_at):false;
    if(preferencesAvailable&&data.preferences&&typeof data.preferences==="object"&&!Array.isArray(data.preferences)){
      userPreferences=sanitizeUserPreferences({...userPreferences,...data.preferences});
      applyUserPreferences();fillSettingsForm();renderQuizzes();renderWeeklyQuizGoal();renderCourseFocus();
    }
    const themeColor=data.theme_color||DEFAULT_THEME_COLOR;
    if(!applyThemeColor(themeColor)){message("profile-message","Your saved website colour is invalid. Choose a new colour and save your profile.",true);return}
    const displayName=data.display_name||data.full_name||"Student";
    $("display-name").value=displayName;$("class-name").value=data.class_name||"";$("medical-school").value=data.medical_school||"";
    $("specialty-interest").value=data.specialty_interest||"";$("favorite-subject").value=data.favorite_subject||"";$("quiz-rank").value=data.quiz_rank||"";
    $("profile-banner-photo").checked=userPreferences.profileBannerPhoto;
    $("leaderboard-opt-in").checked=!!data.leaderboard_opt_in;$("settings-leaderboard-opt-in").checked=!!data.leaderboard_opt_in;$("theme-color").value=themeColor;$("settings-accent-color").value=themeColor;setProfileIdentity(displayName);
    renderProfileOverview();loadProfilePhotoForUser(userId,avatarColumnsAvailable?data.avatar_url:null);
    renderProfileMetrics();renderRecentItems();
    $("home-display-name").textContent=displayName;$("home-class-name").textContent=data.class_name||"Class / year not set";
    if(!preferencesAvailable)message("settings-message","Preferences are stored on this browser until the latest schema.sql is applied for cross-device sync.");
    message("profile-message",academicFieldsAvailable?"":"Run the latest schema.sql to sync medical school and specialty details.");
    if(activityWasReset)await loadAttempts();
  }catch(error){
    console.error("Could not load profile settings.",error);
    message("profile-message","Could not load profile settings: "+error.message,true);
  }finally{panel.removeAttribute("aria-busy")}
}
async function syncActivityResetMarker(refreshResults=false){
  if(!currentUser||!activityResetSyncAvailable)return false;
  const userId=currentUser.id;
  try{
    const {data,error}=await db.from("profiles").select("activity_reset_at").eq("id",userId).single();
    if(error)throw error;
    if(currentUser?.id!==userId||!data.activity_reset_at)return false;
    const reset=applyActivityResetMarker(data.activity_reset_at);
    if(reset&&refreshResults)await loadAttempts();
    return reset;
  }catch(error){console.error("Could not check the latest activity reset.",error);return false}
}
function applyThemeColor(color){
  if(!/^#[0-9a-f]{6}$/i.test(color))return false;
  const root=document.body,channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)),dark=root.classList.contains("theme-dark");
  const mix=(accentRatio,base)=>"#"+channels.map(c=>Math.round(c*accentRatio+base*(1-accentRatio)).toString(16).padStart(2,"0")).join("");
  root.style.setProperty("--teal",color);
  root.style.setProperty("--teal-dark",dark?mix(.68,255):mix(.78,0));
  root.style.setProperty("--teal-text",dark?mix(.42,255):color);
  if(shopItem(currentProfileGemSettings.equipped_items?.theme)?.category==="themes"){
    root.style.setProperty("--theme-focus",`rgba(${channels.join(",")},${dark?".34":".12"})`);
    return true;
  }
  if(dark){
    root.style.setProperty("--paper",mix(.12,12));
    root.style.setProperty("--white",mix(.16,24));
    root.style.setProperty("--surface-raised",mix(.2,34));
    root.style.setProperty("--ink","#f4f6f7");
    root.style.setProperty("--muted","#c4cdd2");
    root.style.setProperty("--line",mix(.34,92));
  }
  root.style.setProperty("--mint",mix(dark ? .18 : .1,dark?22:255));
  root.style.setProperty("--theme-soft",mix(dark ? .2 : .11,dark?18:255));
  root.style.setProperty("--theme-softer",dark?mix(.14,15):mix(.04,255));
  root.style.setProperty("--theme-border",mix(dark ? .36 : .15,dark?52:255));
  root.style.setProperty("--theme-notice",mix(dark ? .2 : .07,dark?18:255));
  root.style.setProperty("--theme-notice-border",mix(dark ? .4 : .2,dark?48:255));
  root.style.setProperty("--theme-notice-text",dark?mix(.28,255):mix(.78,0));
  root.style.setProperty("--theme-outline-border",mix(dark ? .46 : .35,dark?80:255));
  root.style.setProperty("--theme-focus",`rgba(${channels.join(",")},${dark?".34":".12"})`);
  return true;
}
function applyShopPalette(item){
  const palette=item?.palette?.[document.body.classList.contains("theme-dark")?"dark":"light"];
  if(!palette)return false;
  const properties={
    "--paper":palette.paper,"--white":palette.surface,"--surface-raised":palette.raised,
    "--ink":palette.ink,"--muted":palette.muted,"--line":palette.line,
    "--teal":palette.accent,"--teal-dark":palette.accentStrong,"--teal-text":palette.accentText,
    "--mint":palette.soft,"--theme-soft":palette.soft,"--theme-softer":palette.softer,
    "--theme-border":palette.border,"--theme-notice":palette.notice,
    "--theme-notice-border":palette.noticeBorder,"--theme-notice-text":palette.noticeText,
    "--theme-outline-border":palette.border,"--theme-focus":`${palette.accent}44`
  };
  Object.entries(properties).forEach(([name,value])=>document.body.style.setProperty(name,value));
  return true;
}
function applyCurrentShopTheme(){
  const theme=shopItem(currentProfileGemSettings.equipped_items?.theme);
  if(theme?.category==="themes"&&applyShopPalette(theme))return true;
  ["--paper","--white","--surface-raised","--ink","--muted","--line","--teal","--teal-dark","--teal-text","--mint","--theme-soft","--theme-softer","--theme-border","--theme-notice","--theme-notice-border","--theme-notice-text","--theme-outline-border","--theme-focus"].forEach(name=>document.body.style.removeProperty(name));
  const accent=$("theme-color")?.value||DEFAULT_THEME_COLOR;
  return applyThemeColor(accent);
}
function renderGemBalance(){
  const balance=Number(currentProfileGems)||0;
  const formatted=balance.toLocaleString();
  const count=$("gem-balance-count"),button=$("gem-balance-button");
  if(count)count.textContent=formatted;
  if(button)button.classList.toggle("hidden",currentProfileRole==="guest");
  if(button)button.setAttribute("aria-label",`Open Gems Shop, balance: ${balance} gems${currentProfileRole==="guest"?" (disabled for Guest accounts)":""}`);
  const shopBalance=$("shop-balance");
  if(shopBalance)shopBalance.textContent=`Balance: ${formatted} gems${currentProfileRole==="guest"?" · Gems disabled in Guest mode":""}`;
}
function syncGemBalance(value,fallback=currentProfileGems){
  const balance=Number(value);
  currentProfileGems=Number.isFinite(balance)&&balance>=0?balance:fallback;
  renderGemBalance();
}
function applyGuestMode(){
  const guest=currentProfileRole==="guest";
  ["page-resources","page-achievements","profile-tab-button-shop","chat-launch","home-leaderboard","leaderboard-panel","streak-progress","streak-chip","profile-metric-streak"].forEach(id=>{
    const el=$(id);if(el)el.classList.toggle("hidden",guest);
  });
  document.querySelectorAll('[data-go="resources"],[data-feature-nav="resources"],[data-page="achievements"]').forEach(el=>el.classList.toggle("hidden",guest));
  document.querySelector(".ai-assistant-card")?.classList.toggle("hidden",guest);
  if(guest){
    document.querySelectorAll(".profile-metric-card").forEach(card=>{if(card.textContent.includes("STREAK")||card.textContent.includes("STUDY GROUP"))card.classList.add("hidden")});
  }
  const badge=document.querySelector(".profile-member-badge");
  if(badge)badge.innerHTML=`<span aria-hidden="true">●</span> ${guest?"GUEST — PRIVATE & UNVERIFIED":"METROS member"}`;
  const aiLauncher=$("ai-assistant-launch");
  if(aiLauncher)aiLauncher.classList.toggle("hidden",!window.medstudyCanUseAi?.());
  renderGemBalance();
}
async function buyOrEquipShopItem(itemId){
  if(!currentUser)return;
  const item=(window.SHOP_CATALOG||[]).find(entry=>entry.id===itemId);
  if(!item||currentProfileRole==="guest")return;
  if(item.available===false){message("gems-shop-status",item.description||"This item is not available yet.",true);return}
  const owned=(currentProfileGemSettings.unlocked_items||[]).includes(itemId);
  if(!owned){
    const {data,error}=await db.rpc("buy_shop_item",{p_item_id:item.id,p_price:item.price});
    if(error){message("gems-shop-status",error.message,true);return}
    const unlocked=[...new Set([...(currentProfileGemSettings.unlocked_items||[]),itemId])];
    currentProfileGemSettings.unlocked_items=unlocked;
    syncGemBalance(data,Math.max(0,currentProfileGems-item.price));
  }
  const equipped={...(currentProfileGemSettings.equipped_items||{})};
  const key=item.slot||(item.category==="themes"?"theme":item.category==="frames"?"frame":item.category);
  if(equipped[key]===itemId){delete equipped[key]}else{equipped[key]=itemId}
  if(item.category==="scrubs"&&item.slot==="outfit")delete equipped.scrubs;
  const updates={equipped_items:equipped};
  if(item.category==="themes"){
    const palette=item.palette?.[document.body.classList.contains("theme-dark")?"dark":"light"];
    updates.theme_color=equipped.theme?palette?.accent||item.colors?.light:DEFAULT_THEME_COLOR;
  }
  const {error}=await db.from("profiles").update(updates).eq("id",currentUser.id);
  if(error){message("gems-shop-status",error.message,true);return}
  currentProfileGemSettings.equipped_items=equipped;
  currentProfileVisuals.equipped_items=equipped;
  publicProfileVisuals.delete(currentUser.id);
  if(item.category==="themes"){
    const accent=equipped.theme?shopItem(equipped.theme)?.colors?.[document.body.classList.contains("theme-dark")?"dark":"light"]:DEFAULT_THEME_COLOR;
    if(accent){$("theme-color").value=accent;$("settings-accent-color").value=accent}
    applyCurrentShopTheme();
  }
  renderCurrentAvatar();
  message("gems-shop-status",owned?"Shop item equip state updated.":"Purchase complete; item equipped.");
  renderGemsShop();
}
function shopPreview(item,equipKey,equipped){
  if(item.category==="themes"){
    const palette=item.palette?.[document.body.classList.contains("theme-dark")?"dark":"light"];
    return `<div class="shop-theme-preview" style="--preview-paper:${palette?.paper||"#f5f8fa"};--preview-surface:${palette?.surface||"#fff"};--preview-raised:${palette?.raised||"#f7fbfa"};--preview-accent:${palette?.accent||"#087f8c"};--preview-line:${palette?.line||"#dce5eb"}"><span class="shop-theme-sidebar"></span><span class="shop-theme-top"></span><span class="shop-theme-panel"></span><span class="shop-theme-panel short"></span><b>${item.symbol||"✦"}</b></div>`;
  }
  if(item.category==="boosters")return `<div class="shop-booster-preview"><span aria-hidden="true">${esc(item.symbol||"⏱️")}</span><strong>${esc(item.slot==="chime"?"Focus timer sound":"Study tool")}</strong></div>`;
  const previewEquipment={...equipped,[equipKey]:item.id};
  if(equipKey==="outfit")delete previewEquipment.scrubs;
  const previewProfile={...currentProfileVisuals,equipped_items:previewEquipment};
  const title=avatarTitle(previewProfile);
  return `<div class="shop-avatar-preview">${avatarMarkup($("display-name")?.value||"METROS Student",currentUser?.id,"shop-preview-avatar",previewProfile)}<span class="shop-preview-detail">${esc(item.symbol||"✦")} ${esc(title?title.name:item.name)}</span></div>`;
}
function renderGemsShop(){
  const grid=$("gems-shop-grid");if(!grid)return;
  const catalog=window.SHOP_CATALOG||[];
  const unlocked=new Set(Array.isArray(currentProfileGemSettings.unlocked_items)?currentProfileGemSettings.unlocked_items:[]);
  const equipped=currentProfileGemSettings.equipped_items&&typeof currentProfileGemSettings.equipped_items==="object"?currentProfileGemSettings.equipped_items:{};
  const items=catalog.filter(item=>item.category===shopCategory&&(shopRarity==="All"||item.rarity===shopRarity));
  renderGemBalance();
  grid.innerHTML=items.map(item=>{
    const equipKey=item.slot||(item.category==="themes"?"theme":item.category==="frames"?"frame":item.category);
    const owned=unlocked.has(item.id),isEquipped=equipped[equipKey]===item.id||equipped[item.category]===item.id||equipped[item.id]===true;
    const unavailable=item.available===false;
    return `<article class="shop-item rarity-${esc(String(item.rarity).toLowerCase())}${isEquipped?" is-equipped":""}">
      ${shopPreview(item,equipKey,equipped)}
      <div class="shop-item-copy"><div class="shop-item-labels"><span class="rarity-label">${esc(item.rarity)}</span>${isEquipped?'<span class="equipped-label">EQUIPPED</span>':""}</div><h3>${esc(item.name)}</h3><p>${esc(item.description||"A cosmetic for your study profile.")}</p></div>
      <div class="shop-actions">
      ${item.category==="themes"?`<button class="button button-light" type="button" data-shop-preview="${esc(item.id)}">Preview theme</button>`:""}
      ${unavailable?`<button class="button button-outline" type="button" disabled>Coming soon</button>`:
      owned?`<button class="button ${isEquipped?"button-primary":"button-outline"}" type="button" data-shop-toggle="${esc(item.id)}">${isEquipped?"Equipped":"Equip"}</button>`:
      `<button class="button button-primary" type="button" data-shop-buy="${esc(item.id)}" ${currentProfileRole==="guest"?"disabled":""}>Buy · ${item.price} Gems</button>`}
      </div></article>`;
  }).join("")||'<p class="muted">No items match this filter.</p>';
}
async function loadGemsProfile(){
  if(!currentUser)return;
  const {data,error}=await db.from("profiles").select("gems,gems_enabled,unlocked_items,equipped_items,banner_blur,role,level,xp,avatar_url").eq("id",currentUser.id).single();
  if(error)return;
  currentProfileGems=Number(data.gems)||0;
  currentProfileXp=Number(data.xp)||0;
  renderProfileProgression();
  currentProfileGemsEnabled=data.gems_enabled!==false&&data.role!=="guest";
  currentProfileRole=data.role==="guest"?"guest":data.role==="admin"?"admin":"member";
  currentProfileGemSettings={unlocked_items:Array.isArray(data.unlocked_items)?data.unlocked_items:[],equipped_items:data.equipped_items||{}};
  selectedPresetAvatar=typeof data.equipped_items?.avatar==="string"?data.equipped_items.avatar:"";
  currentProfileVisuals={avatar_url:data.avatar_url||currentProfileVisuals.avatar_url||null,equipped_items:data.equipped_items||{}};
  renderPresetAvatars();
  if(data.role==="guest")currentProfileGemSettings.gems_enabled=false;
  const blur=Math.min(20,Math.max(0,Number(data.banner_blur)||4));
  if($("banner-blur")){$("banner-blur").value=String(blur);$("banner-blur-value").textContent=`${blur} px`}
  document.documentElement.style.setProperty("--profile-banner-blur",`${blur}px`);
  if(document.documentElement.style.getPropertyValue("--profile-banner-blur")===""){document.documentElement.style.setProperty("--profile-banner-blur",`${Math.min(20,Math.max(0,Number(data.banner_blur)||4))}px`)}
  applyGuestMode();applyCurrentShopTheme();renderCurrentAvatar();renderGemBalance();renderGemsShop();
  const equippedTheme=shopItem(data.equipped_items?.theme);
  const palette=equippedTheme?.palette?.[document.body.classList.contains("theme-dark")?"dark":"light"];
  if(palette){$("theme-color").value=palette.accent;$("settings-accent-color").value=palette.accent}
  const unlockResult=await db.from("user_unlocked_quizzes").select("quiz_id").eq("user_id",currentUser.id);
  unlockedQuizIds=new Set((unlockResult.data||[]).map(row=>String(row.quiz_id)));
}
window.medstudyCanUseAi=()=>currentUser&&currentProfileRole==="member"&&currentProfileGemsEnabled;
window.medstudySpendAiGem=async()=>{
  if(!window.medstudyCanUseAi())return false;
  if(currentProfileGems<10){message("ai-assistant-status","You need at least 10 Gems to open the AI assistant.",true);return false}
  if(!confirm("Opening the AI assistant spends 10 Gems once for this page session. Continue?")){
    message("ai-assistant-status","Canceled. No Gems were spent.");
    return false;
  }
  const {data,error}=await db.rpc("spend_gems",{p_amount:10});
  if(error){message("ai-assistant-status",error.message,true);showLiveNotice("AI Study Tools",error.message);return false}
  syncGemBalance(data,Math.max(0,currentProfileGems-10));
  renderGemsShop();
  return true;
};
document.addEventListener("click",event=>{
  const category=event.target.closest("[data-shop-category]");
  if(category){shopCategory=category.dataset.shopCategory;document.querySelectorAll("[data-shop-category]").forEach(el=>el.classList.toggle("active",el===category));renderGemsShop();return}
  const rarity=event.target.closest("[data-rarity]");
  if(rarity){shopRarity=rarity.dataset.rarity;document.querySelectorAll("[data-rarity]").forEach(el=>el.classList.toggle("active",el===rarity));renderGemsShop();return}
  const buy=event.target.closest("[data-shop-buy]");
  if(buy){void buyOrEquipShopItem(buy.dataset.shopBuy);return}
  const toggle=event.target.closest("[data-shop-toggle]");
  if(toggle){void buyOrEquipShopItem(toggle.dataset.shopToggle);return}
  const preview=event.target.closest("[data-shop-preview]");
  if(preview){
    const item=(window.SHOP_CATALOG||[]).find(entry=>entry.id===preview.dataset.shopPreview);
    if(!item)return;
    if(shopPreviewTimer)clearTimeout(shopPreviewTimer);
    applyShopPalette(item);
    message("gems-shop-status",`Previewing ${item.name}. The preview will reset in 10 seconds.`);
    shopPreviewTimer=setTimeout(()=>{shopPreviewTimer=null;applyCurrentShopTheme()},10000);
  }
});
$("gem-balance-button").addEventListener("click",()=>{
  if(currentProfileRole==="guest")return;
  showPage("profile");
  $("profile-tab-button-shop").click();
});
$("theme-color").addEventListener("input",e=>{$("settings-accent-color").value=e.target.value;applyThemeColor(e.target.value)});
$("settings-accent-color").addEventListener("input",e=>{$("theme-color").value=e.target.value;applyThemeColor(e.target.value)});
$("banner-blur").addEventListener("input",()=>{
  const value=Math.min(20,Math.max(0,Number($("banner-blur").value)||0));
  $("banner-blur-value").textContent=`${value} px`;
  document.documentElement.style.setProperty("--profile-banner-blur",`${value}px`);
});
$("reset-theme-color").addEventListener("click",()=>{$("theme-color").value=DEFAULT_THEME_COLOR;$("settings-accent-color").value=DEFAULT_THEME_COLOR;applyThemeColor(DEFAULT_THEME_COLOR)});
$("edit-profile-button").addEventListener("click",()=>{
  $("profile-tab-button-overview").click();
  $("profile-editor").scrollIntoView({behavior:"smooth",block:"start"});
  $("display-name").focus({preventScroll:true});
});
document.querySelectorAll("[data-profile-tab]").forEach(button=>button.addEventListener("click",()=>{
  const activeTab=button.dataset.profileTab;
  document.querySelectorAll("[data-profile-tab]").forEach(tab=>{
    const active=tab===button;tab.classList.toggle("active",active);tab.setAttribute("aria-selected",String(active));
  });
  document.querySelectorAll(".profile-tab-panel").forEach(panel=>{
    const active=panel.id===`profile-tab-${activeTab}`;panel.hidden=!active;panel.classList.toggle("hidden",!active);
  });
}));
function compressProfilePhoto(file){
  return new Promise((resolve,reject)=>{
    const objectUrl=URL.createObjectURL(file),image=new Image();
    image.onload=()=>{
      const scale=Math.min(1,PROFILE_PHOTO_MAX_DIMENSION/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement("canvas");
      canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      const context=canvas.getContext("2d");
      if(!context){URL.revokeObjectURL(objectUrl);reject(new Error("Image processing is unavailable in this browser."));return}
      context.drawImage(image,0,0,canvas.width,canvas.height);
      canvas.toBlob(blob=>{
        URL.revokeObjectURL(objectUrl);
        if(!blob){reject(new Error("The selected image could not be compressed. Try another image."));return}
        if(blob.type!=="image/webp"){reject(new Error("WebP image compression is unavailable in this browser."));return}
        if(blob.size>PROFILE_PHOTO_MAX_BYTES){reject(new Error("The optimized image is still too large. Choose a simpler or smaller photo."));return}
        resolve(blob);
      },"image/webp",.82);
    };
    image.onerror=()=>{URL.revokeObjectURL(objectUrl);reject(new Error("The selected image could not be read. Try another image."))};
    image.src=objectUrl;
  });
}
async function uploadProfilePhoto(file,onProgress=()=>{}){
  onProgress("Optimizing your profile picture…");
  const blob=await compressProfilePhoto(file);
  if(db&&currentUser){
    onProgress("Uploading your profile picture…");
    const path=`${currentUser.id}/avatar.webp`;
    const {error}=await db.storage.from(PROFILE_PHOTO_BUCKET).upload(path,blob,{
      contentType:"image/webp",upsert:true,cacheControl:"0"
    });
    if(error)throw error;
    return profilePhotoPublicUrl(currentUser.id);
  }
  onProgress("Saving your profile picture…");
  const dataUrl=await new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>typeof reader.result==="string"?resolve(reader.result):reject(new Error("The optimized image could not be read."));
    reader.onerror=()=>reject(reader.error||new Error("Could not read the optimized image."));
    reader.readAsDataURL(blob);
  });
  const key=profilePhotoKey();
  if(!key)throw new Error("Sign in before choosing a profile picture.");
  localStorage.setItem(key,dataUrl);
  return dataUrl;
}
$("profile-picture").addEventListener("change",async event=>{
  const file=event.target.files?.[0];
  if(!file)return;
  if(!["image/png","image/jpeg","image/webp","image/gif"].includes(file.type)){
    message("profile-photo-message","Choose a PNG, JPEG, WebP or GIF image.",true);event.target.value="";return;
  }
  if(file.size>PROFILE_PHOTO_MAX_INPUT_BYTES){
    message("profile-photo-message","Choose an image smaller than 10 MB.",true);event.target.value="";return;
  }
  const userId=currentUser?.id,button=$("profile-picture");
  if(!userId){message("profile-photo-message","Sign in before choosing a profile picture.",true);event.target.value="";return}
  button.disabled=true;
  try{
    const photo=await uploadProfilePhoto(file,text=>message("profile-photo-message",text));
    if(currentUser?.id!==userId)return;
    const equipped={...(currentProfileGemSettings.equipped_items||{})};delete equipped.avatar;
    const {error:profileError}=await db.from("profiles").update({avatar_url:photo,equipped_items:equipped}).eq("id",currentUser.id);
    if(profileError)throw profileError;
    try{localStorage.removeItem(profilePhotoKey(userId))}
    catch(error){console.warn("Could not clear the local profile-photo cache.",error)}
    selectedPresetAvatar="";
    currentProfileGemSettings.equipped_items=equipped;
    currentProfileVisuals={avatar_url:photo,equipped_items:equipped};
    publicProfileVisuals.delete(userId);
    renderPresetAvatars();
    setProfilePhoto(photo);
    message("profile-photo-message","Profile picture uploaded successfully.");
  }catch(error){
    console.error("Could not upload the profile picture.",error);
    message("profile-photo-message",error.message||"Could not upload the profile picture. Try again.",true);
  }finally{button.disabled=false}
  event.target.value="";
});
$("profile-banner-photo").addEventListener("change",event=>{
  const usePhoto=event.target.checked;
  const photo=document.querySelector("#profile-avatar-image").getAttribute("src");
  userPreferences.profileBannerPhoto=usePhoto;
  setProfilePhoto(photo);
  void savePersonalPreferences(
    {profileBannerPhoto:usePhoto},
    "profile-photo-message",
    usePhoto?"Profile banner preference saved.":"The profile banner will use your theme colours."
  );
});
$("remove-profile-picture").addEventListener("click",async()=>{
  const key=profilePhotoKey();
  if(!key){message("profile-photo-message","Sign in before changing your profile picture.",true);return}
  const button=$("remove-profile-picture");button.disabled=true;
  try{
    if(db&&currentUser){
      const {error}=await db.storage.from(PROFILE_PHOTO_BUCKET).remove([`${currentUser.id}/avatar.webp`]);
      if(error)throw error;
    }
    const {error:profileError}=await db.from("profiles").update({avatar_url:null}).eq("id",currentUser.id);
    if(profileError)throw profileError;
    localStorage.removeItem(key);
    currentProfileVisuals.avatar_url=null;publicProfileVisuals.delete(currentUser.id);
    setProfilePhoto(null);
    renderPresetAvatars();
    message("profile-photo-message","Profile picture removed.");
  }catch(error){
    console.error("Could not remove the saved profile picture.",error);
    message("profile-photo-message",error.message||"Could not remove the profile picture.",true);
  }finally{button.disabled=false}
});
$("profile-form").addEventListener("submit",async e=>{
  e.preventDefault();const name=$("display-name").value.trim(),themeColor=$("theme-color").value;if(!name){message("profile-message","Please enter a display name.",true);return}
  if(!applyThemeColor(themeColor)){message("profile-message","Choose a valid website colour.",true);return}
  const updates={
    display_name:name,
    class_name:$("class-name").value.trim()||null,favorite_subject:$("favorite-subject").value||null,
    quiz_rank:$("quiz-rank").value.trim()||null,leaderboard_opt_in:$("leaderboard-opt-in").checked,theme_color:themeColor
  };
  if(profileAcademicFieldsAvailable){
    updates.medical_school=$("medical-school").value.trim()||null;
    updates.specialty_interest=$("specialty-interest").value.trim()||null;
  }
  const {error}=await db.from("profiles").update(updates).eq("id",currentUser.id);
  const successMessage=profileAcademicFieldsAvailable?"Profile saved.":"Profile saved. Run the latest schema.sql to sync medical school and specialty details.";
  message("profile-message",error?error.message:successMessage,!!error);if(!error){
    $("settings-leaderboard-opt-in").checked=$("leaderboard-opt-in").checked;$("settings-accent-color").value=themeColor;
    setProfileIdentity(name);$("home-display-name").textContent=name;renderCurrentAvatar();publicProfileVisuals.delete(currentUser.id);
    renderProfileOverview();
    $("home-class-name").textContent=$("class-name").value.trim()||"Class / year not set";
    renderLeaderboard();renderHomeLeaderboard()
  }
});
async function saveUserSettings(event){
  event.preventDefault();
  const accentColor=$("settings-accent-color").value;
  const dailyPopupLimit=Number($("settings-notification-limit").value);
  if(!currentUser||!/^#[0-9a-f]{6}$/i.test(accentColor)){message("settings-message","Choose a valid accent colour.",true);return}
  if(!Number.isInteger(dailyPopupLimit)||dailyPopupLimit<1||dailyPopupLimit>20){message("settings-message","Reminder popup limit must be between 1 and 20.",true);return}
  const next={
    ...userPreferences,
    language:$("settings-language").value,timeZone:$("settings-timezone").value,region:$("settings-region").value,
    darkMode:$("settings-dark-mode").checked,density:$("settings-density").value,textSize:$("settings-text-size").value,
    streakMascot:$("settings-streak-mascot").value,
    announcementAlerts:$("settings-announcements").checked,scheduleAlerts:$("settings-schedule-reminders").checked,
    quietHours:$("settings-quiet-enabled").checked,quietStart:$("settings-quiet-start").value,quietEnd:$("settings-quiet-end").value,
    dailyPopupLimit,activityConsent:$("settings-activity-consent").checked,
    reduceMotion:$("settings-reduce-motion").checked,noAutoplay:$("settings-no-autoplay").checked,
    highContrast:$("settings-high-contrast").checked,colorVision:$("settings-color-vision").value,
    quizFavorites:userPreferences.quizFavorites,weeklyQuizGoal:userPreferences.weeklyQuizGoal
  };
  if(!next.quietStart||!next.quietEnd){message("settings-message","Enter both quiet-hour times.",true);return}
  userPreferences={...DEFAULT_USER_PREFERENCES,...next};
  if(!userPreferences.activityConsent)activityPendingSeconds=0;
  applyUserPreferences();applyThemeColor(accentColor);$("theme-color").value=accentColor;
  let localError=null,profileError=null,profileSyncNotice="";
  try{localStorage.setItem(userPreferencesKey(),JSON.stringify(userPreferences))}
  catch(error){localError=error;console.error("Could not save device settings.",error)}
  try{
    let result=await db.from("profiles").update({
      theme_color:accentColor,leaderboard_opt_in:$("settings-leaderboard-opt-in").checked,preferences:userPreferences,
      banner_blur:Number($("banner-blur")?.value)||4
    }).eq("id",currentUser.id);
    if(result.error&&(result.error.code==="42703"||result.error.code==="PGRST204"||/preferences.*(column|schema cache)|column.*preferences/i.test(result.error.message||""))){
      console.warn("Account preference sync requires the latest schema.",result.error);
      profileSyncNotice="Device preferences are saved, but cross-device sync requires the latest schema.sql.";
      result=await db.from("profiles").update({theme_color:accentColor,leaderboard_opt_in:$("settings-leaderboard-opt-in").checked}).eq("id",currentUser.id);
    }
    profileError=result.error;
  }catch(error){profileError=error;console.error("Could not save account settings.",error)}
  $("leaderboard-opt-in").checked=$("settings-leaderboard-opt-in").checked;
  fillSettingsForm();
  if(!profileError){renderLeaderboard();renderHomeLeaderboard()}
  if(liveNoticeTimer)startScheduleNotifications();
  const errors=[];
  if(localError)errors.push("Device preferences could not be saved: "+localError.message);
  if(profileError)errors.push("Other settings were saved on this device, but profile appearance/leaderboard preference failed: "+profileError.message);
  message("settings-message",errors.join(" ")||profileSyncNotice||"Settings saved.",errors.length>0);
}
$("settings-form").addEventListener("submit",saveUserSettings);
$("settings-streak-mascot").addEventListener("change",()=>updateStreakMascots(studyStreak.current,$("settings-streak-mascot").value));
function resetCount(row,key){return Number(row?.[key])||0}
function formatResetCount(row,key,singular,plural=singular+"s"){
  const count=resetCount(row,key);
  return `${count} ${count===1?singular:plural}`;
}
async function resetMyStudyData(){
  if(!currentUser)return;
  if(!confirm("This permanently deletes your web activity, active-time totals, study streak and all quiz results. Your profile, account and study content will remain."))return;
  if(prompt("Type RESET MY STUDY DATA to confirm.")?.trim()!=="RESET MY STUDY DATA")return;
  const button=$("settings-reset-study-data");button.disabled=true;
  let resetCompleted=false;
  message("settings-reset-data-message","Resetting your study data…");
  try{
    const {data,error}=await db.rpc("reset_my_study_data");
    if(error)throw error;
    const row=Array.isArray(data)?data[0]:data;
    if(!row?.reset_at)throw new Error("The reset completed without returning its reset timestamp.");
    resetCompleted=true;
    applyActivityResetMarker(row.reset_at,true);
    attempts=[];
    renderPersonalStats();
    if(featureEnabled("leaderboards")){void renderLeaderboard();void renderHomeLeaderboard()}
    message("settings-reset-data-message",`Reset complete: ${formatResetCount(row,"activity_events_deleted","activity event")}, ${formatResetCount(row,"active_time_days_deleted","active-time total")}, ${formatResetCount(row,"streak_deleted","streak")} and ${formatResetCount(row,"quiz_results_deleted","quiz result")} cleared.`);
  }catch(error){
    console.error("Could not reset personal study data.",error);
    const detail=error.code==="PGRST202"?"Run the latest schema.sql in Supabase first. "+error.message:error.message;
    message("settings-reset-data-message",resetCompleted?"Study data was reset, but the page could not refresh: "+error.message:"Could not reset study data: "+detail,true);
  }finally{button.disabled=false}
}
$("settings-reset-study-data").addEventListener("click",resetMyStudyData);
async function sendPasswordReset(messageId="security-message"){
  if(!currentUser){message(messageId,"Sign in before requesting a password reset.",true);return}
  const {error}=await db.auth.resetPasswordForEmail(currentUser.email,{redirectTo:location.origin+location.pathname});
  message(messageId,error?error.message:"If the address is registered, a password-reset link has been sent.",!!error);
}
$("profile-reset-password").onclick=()=>sendPasswordReset();
$("settings-reset-password").addEventListener("click",()=>sendPasswordReset("settings-security-message"));
$("settings-signout-others").addEventListener("click",async()=>{
  if(!currentUser||!confirm("Sign out all other devices connected to this account? This device will remain signed in."))return;
  const button=$("settings-signout-others");button.disabled=true;message("settings-security-message","Signing out other devices…");
  try{
    const {error}=await db.auth.signOut({scope:"others"});
    if(error)throw error;
    message("settings-security-message","Other devices have been signed out. This device remains connected.");
  }catch(error){message("settings-security-message","Could not sign out other devices: "+error.message,true)}
  finally{button.disabled=false}
});
$("password-update-form").addEventListener("submit",async e=>{
  e.preventDefault();const password=$("new-password").value;
  const requiredSetup=!!currentUser?.user_metadata?.requires_password_setup;
  const update={password};
  if(requiredSetup)update.data={requires_password_setup:false};
  const {data,error}=await db.auth.updateUser(update);
  message("password-update-message",error?error.message:"Password updated. You can now continue using MedStudy Hub.",!!error);
  if(!error){
    $("password-update-form").classList.add("hidden");
    if(requiredSetup&&currentUser?.user_metadata?.requires_password_setup&&data.user)await signedIn(data.user);
    else $("auth-form").classList.remove("hidden");
  }
});
$("delete-account").onclick=async()=>{
  const ok=confirm("Permanently delete your account, profile, quiz history, chat messages and activity? This cannot be undone.");if(!ok)return;
  const {data,error}=await db.functions.invoke("delete-account");
  if(error){message("security-message","Account deletion failed: "+error.message,true);return}
  await db.auth.signOut();alert("Your account deletion request was completed.");
};
document.querySelectorAll("[data-board]").forEach(b=>b.onclick=()=>{activeBoard=b.dataset.board;document.querySelectorAll("[data-board]").forEach(x=>x.classList.toggle("active",x===b));$("student-detail").classList.add("hidden");renderLeaderboard()});
async function refreshLeaderboard(){
  const button=$("refresh-leaderboard");if(button.disabled)return;
  const label=button.innerHTML;button.disabled=true;button.setAttribute("aria-busy","true");
  button.innerHTML='<span class="refresh-spinner" aria-hidden="true"></span><span>Refreshing…</span>';
  try{await Promise.all([renderLeaderboard(),new Promise(resolve=>setTimeout(resolve,450))])}
  finally{button.innerHTML=label;button.disabled=false;button.removeAttribute("aria-busy")}
}
$("refresh-leaderboard").onclick=refreshLeaderboard;
async function getView(view){const {data,error}=await db.from(view).select("*");if(error)throw error;return data||[]}
function rankingTable(rows,scoreKey="average_percentage"){
  if(!rows.length)return '<p class="muted">No rankings yet. At least three opted-in students need a verified score before rankings appear.</p>';
  return `<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Student</th><th>Average / change</th><th>Quizzes</th></tr></thead><tbody>${rows.map((r,i)=>`<tr class="leaderboard-member-row" data-public-profile="${esc(r.user_id)}" data-public-rank="${i+1}"><td><span class="rank-medal${i>=3?" ordinal-rank":""}" aria-label="Rank ${i+1}">${i===0?"🏆":medal(i+1)}</span></td><td>${leaderboardPerson(r)}</td><td>${Number(r[scoreKey]||0).toFixed(1)}%</td><td>${r.quiz_count??r.current_quiz_count??"—"}</td></tr>`).join("")}</tbody></table></div>`;
}
function leaderboardPerson(row){
  const profile=publicProfileVisuals.get(row.user_id);
  const title=avatarTitle(profile);
  return `<span class="leaderboard-person">${avatarMarkup(row.display_name,row.user_id,"leader-avatar",profile)}<span class="leaderboard-person-copy"><button class="student-name" type="button">${esc(row.display_name)}</button>${row.user_id===currentUser?.id?' <b>(you)</b>':""}${title?`<small style="--title-color:${esc(title.color||"var(--teal)")}">${esc(title.symbol||"")} ${esc(title.name)}</small>`:""}</span></span>`;
}
async function hydratePublicProfileVisuals(rows){
  const ids=[...new Set(rows.map(row=>row.user_id).filter(id=>id&&!publicProfileVisuals.has(id)))];
  if(!ids.length)return;
  try{
    const result=await db.from("member_public_profiles")
      .select("id,display_name,avatar_url,equipped_items,level,xp,school,clinical_interests")
      .in("id",ids);
    if(result.error)throw result.error;
    (result.data||[]).forEach(profile=>publicProfileVisuals.set(profile.id,profile));
  }catch(error){console.warn("Could not load leaderboard profile visuals.",error)}
}
async function renderLeaderboard(){
  const box=$("leaderboard-content");box.setAttribute("aria-busy","true");box.innerHTML=loadingMessage("Loading rankings…");
  try{
    if(activeBoard==="overall"){
      const rows=(await getView("overall_leaderboard")).sort((a,b)=>b.average_percentage-a.average_percentage);
      await hydratePublicProfileVisuals(rows);box.innerHTML=rankingTable(rows);
    }
    if(activeBoard==="courses"){
      const rows=await getView("course_leaderboard");
      await hydratePublicProfileVisuals(rows);
      box.innerHTML=COURSES.map(c=>{const group=rows.filter(r=>r.course===c).sort((a,b)=>b.average_percentage-a.average_percentage);return `<div class="course-board"><h3>${esc(c)}</h3>${group.length?`<ol>${group.map((r,index)=>`<li data-public-profile="${esc(r.user_id)}" data-public-rank="${index+1}"><span class="rank-medal${index>=3?" ordinal-rank":""}" aria-label="Rank ${index+1}">${medal(index+1)}</span> ${leaderboardPerson(r)} — <strong>${Number(r.average_percentage).toFixed(1)}%</strong> (${r.quiz_count} quizzes)</li>`).join("")}</ol>`:'<p class="muted">No qualifying scores.</p>'}</div>`}).join("");
    }
    if(activeBoard==="weekly"){
      const rows=(await getView("weekly_leaderboard")).sort((a,b)=>b.average_percentage-a.average_percentage);
      await hydratePublicProfileVisuals(rows);box.innerHTML=rankingTable(rows);
    }
    if(activeBoard==="improved"){
      const rows=(await getView("most_improved_leaderboard")).sort((a,b)=>b.improvement_percentage_points-a.improvement_percentage_points);
      await hydratePublicProfileVisuals(rows);
      box.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Student</th><th>Previous avg.</th><th>Current avg.</th><th>Improvement</th></tr></thead><tbody>${rows.map((r,index)=>`<tr class="leaderboard-member-row" data-public-profile="${esc(r.user_id)}" data-public-rank="${index+1}"><td><span class="rank-medal${index>=3?" ordinal-rank":""}" aria-label="Rank ${index+1}">${medal(index+1)}</span></td><td>${leaderboardPerson(r)}</td><td>${Number(r.previous_average).toFixed(1)}%</td><td>${Number(r.current_average).toFixed(1)}%</td><td>+${Number(r.improvement_percentage_points).toFixed(1)} points</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">Not enough verified results in both seven-day periods yet.</p>';
    }
    if(activeBoard==="activity"){
      const rows=await getView("recent_group_activity");
      await hydratePublicProfileVisuals(rows);
      box.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Course</th><th>Quiz</th><th>Result</th><th>Date</th></tr></thead><tbody>${rows.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,20).map(r=>`<tr class="leaderboard-member-row" data-public-profile="${esc(r.user_id)}"><td>${leaderboardPerson(r)}</td><td>${esc(r.course)}</td><td>${esc(r.quiz_title)}</td><td>${Number(r.percentage).toFixed(1)}%</td><td>${esc(formatDate(r.created_at))}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">No recent verified activity.</p>';
    }
  }catch(err){box.innerHTML=`<p class="muted">Could not load rankings: ${esc(err.message)}</p>`}
  finally{box.removeAttribute("aria-busy")}
}
const ADMIN_USER_PAGE_SIZE=50;
function renderAdminUsers(){
  const search=$("admin-user-search").value.trim().toLowerCase();
  const rows=adminUserRows.filter(user=>!search||`${user.display_name} ${user.email}`.toLowerCase().includes(search));
  if(!adminUserRows.length){$("admin-user-list").innerHTML='<p class="muted">No accounts found.</p>';return}
  if(!rows.length){$("admin-user-list").innerHTML='<p class="muted">No loaded users match that search. Load more users to search the next page.</p>';return}
  $("admin-user-list").innerHTML=`<div class="table-wrap"><table class="admin-users-table"><thead><tr><th>User</th><th>Email</th><th>Class / year</th><th>Account status</th><th>Last sign-in</th><th>Last website activity</th><th>Actions</th></tr></thead><tbody>${rows.map(user=>{
    const banned=user.banned_until&&new Date(user.banned_until)>new Date();
    const status=banned?`Banned until ${esc(formatDate(user.banned_until))}`:user.email_confirmed_at?"Active":"Invitation pending";
    const lastSignIn=user.last_sign_in_at?formatDateTime(user.last_sign_in_at):"Never";
    const lastActivity=user.last_activity_at?formatDateTime(user.last_activity_at):"No activity recorded";
    const actions=`<button class="button button-outline" type="button" data-user-activity="${esc(user.id)}">Activity</button>${user.is_admin?'<span class="status-pill status-published">Admin protected</span>':`<button class="button button-light" type="button" data-user-ban="${esc(user.id)}" data-banned="${banned}">${banned?"Restore access":"Ban access"}</button><button class="button button-danger" type="button" data-user-delete="${esc(user.id)}">Delete</button>`}`;
    const role=user.role||"member";
    const controls=user.is_admin?"":`<label>Role<select data-user-role="${esc(user.id)}"><option value="member"${role==="member"?" selected":""}>Member</option><option value="guest"${role==="guest"?" selected":""}>Guest</option></select></label><label class="settings-switch"><span>Gems enabled</span><input type="checkbox" data-user-gems="${esc(user.id)}"${user.gems_enabled!==false?" checked":""}${role==="guest"?" disabled":""}></label>`;
    return `<tr><td>${esc(user.display_name||"Student")}</td><td>${esc(user.email)}</td><td>${esc(user.class_name||"—")}</td><td>${esc(status)}${controls}</td><td>${esc(lastSignIn)}</td><td>${esc(lastActivity)}</td><td><div class="admin-actions">${actions}</div></td></tr>`;
  }).join("")}</tbody></table></div>`;
}
async function loadAdminUsers(append=false){
  if(!isAdmin)return;
  const button=$("admin-users-refresh"),more=$("admin-users-load-more");
  if(button)button.disabled=true;if(more)more.disabled=true;
  if(!append){adminUserRows=[];adminUserPage=1;adminUsersHaveMore=false;$("admin-user-count").textContent="";$("admin-user-list").innerHTML='<p class="muted">Loading user accounts…</p>'}
  const page=adminUserPage;
  try{
    const {data,error}=await db.functions.invoke("admin-user-management",{body:{action:"list",page,perPage:ADMIN_USER_PAGE_SIZE}});
    if(error)throw error;
    const ids=(data.users||[]).map(user=>user.id);
    let activityByUser=new Map();
    if(ids.length){
      const {data:activity,error:activityError}=await db.rpc("get_admin_user_last_activity",{p_user_ids:ids});
      if(activityError)throw activityError;
      activityByUser=new Map((activity||[]).map(item=>[item.user_id,item.last_activity_at]));
    }
    let accessByUser=new Map();
    if(ids.length){
      const {data:profiles,error:profileError}=await db.from("profiles").select("id,role,gems_enabled").in("id",ids);
      if(profileError)throw profileError;
      accessByUser=new Map((profiles||[]).map(profile=>[profile.id,{role:profile.role,gems_enabled:profile.gems_enabled}]));
    }
    const pageRows=(data.users||[]).map(user=>({...user,...accessByUser.get(user.id),last_activity_at:activityByUser.get(user.id)||null}));
    adminUserRows=append?adminUserRows.concat(pageRows):pageRows;
    adminUserPage=page+1;adminUsersHaveMore=pageRows.length===ADMIN_USER_PAGE_SIZE;
    renderAdminUsers();more.classList.toggle("hidden",!adminUsersHaveMore);
    $("admin-user-count").textContent=`${adminUserRows.length} user${adminUserRows.length===1?"":"s"} loaded${adminUsersHaveMore?"; load more to see the rest":""}.`;
  }catch(error){
    console.error("Could not load admin user accounts.",error);
    if(!append)$("admin-user-list").innerHTML='<p class="muted">Could not load user accounts.</p>';
    $("admin-user-count").textContent="";
    message("admin-user-message","Could not reach admin-user-management. Confirm the latest schema.sql is installed, deploy the function to Supabase project qiwqluwtmpflmekgjiob, and verify your admin_users access. Deploy with: supabase functions deploy admin-user-management --project-ref qiwqluwtmpflmekgjiob. Details: "+error.message,true);
  }finally{if(button)button.disabled=false;if(more)more.disabled=false}
}
async function showAdminUserActivity(userId){
  if(!isAdmin)return;
  const user=adminUserRows.find(item=>item.id===userId);if(!user)return;
  const panel=$("admin-user-activity");panel.classList.remove("hidden");
  $("admin-user-activity-heading").textContent=`Recent activity — ${user.display_name||user.email}`;
  $("admin-user-activity-content").innerHTML='<p class="muted">Loading activity…</p>';
  panel.scrollIntoView({behavior:"smooth",block:"nearest"});
  const cutoff=new Date(Date.now()-29*DAY_MILLISECONDS).toISOString().slice(0,10);
  let eventResult,dailyResult;
  try{
    [eventResult,dailyResult]=await Promise.all([
      db.from("user_activity_log").select("event_type,page,active_seconds,created_at")
        .eq("user_id",userId).order("created_at",{ascending:false}).limit(100),
      db.from("user_activity_daily").select("activity_date,active_seconds,last_active_at,last_page")
        .eq("user_id",userId).gte("activity_date",cutoff).order("activity_date",{ascending:false}).limit(30)
    ]);
  }catch(error){
    console.error("Could not load user activity.",error);
    $("admin-user-activity-content").innerHTML=`<p class="message error">Could not load activity: ${esc(error.message)}</p>`;
    return;
  }
  if(eventResult.error||dailyResult.error){
    const error=eventResult.error||dailyResult.error;
    console.error("Could not load user activity.",error);
    $("admin-user-activity-content").innerHTML=`<p class="message error">Could not load activity: ${esc(error.message)}</p>`;
    return;
  }
  const events=eventResult.data||[],daily=dailyResult.data||[];
  const activeSeconds=daily.reduce((sum,item)=>sum+Number(item.active_seconds||0),0);
  const pageViews=events.filter(item=>item.event_type==="page_view").length;
  const labels={sign_in:"Signed in",page_view:"Visited page",active_time:"Active time",sign_out:"Signed out",page_closed:"Closed page"};
  const eventTable=events.length?`<h4>Sign-ins and page visits</h4><div class="table-wrap"><table><thead><tr><th>When</th><th>Activity</th><th>Page</th></tr></thead><tbody>${events.map(item=>`<tr><td>${esc(formatDateTime(item.created_at))}</td><td>${esc(labels[item.event_type]||item.event_type)}</td><td>${esc(item.page||"—")}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">No sign-in or page activity has been recorded yet.</p>';
  const dailyTable=daily.length?`<h4>Active time by day (last 30 days)</h4><div class="table-wrap"><table><thead><tr><th>Date</th><th>Active time</th><th>Last active</th><th>Last page</th></tr></thead><tbody>${daily.map(item=>`<tr><td>${esc(formatDate(`${item.activity_date}T12:00:00Z`,{dateStyle:"medium",timeZone:"UTC"}))}</td><td>${esc(formatDuration(Number(item.active_seconds)*1000))}</td><td>${esc(formatDateTime(item.last_active_at))}</td><td>${esc(item.last_page||"—")}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">No visible active time has been recorded in the last 30 days.</p>';
  $("admin-user-activity-content").innerHTML=`<div class="stats-grid"><div class="stat"><strong>${pageViews}</strong><span>Page visits in recent events</span></div><div class="stat"><strong>${esc(formatDuration(activeSeconds*1000))}</strong><span>Active time in last 30 days</span></div><div class="stat"><strong>${events.length}</strong><span>Recent events shown (up to 100)</span></div></div>${eventTable}${dailyTable}`;
}
async function manageAdminUser(action,userId){
  if(!isAdmin)return;
  const user=adminUserRows.find(item=>item.id===userId);if(!user)return;
  if(action==="delete"){
    if(!confirm(`Permanently delete ${user.email} and their associated profile, results, messages and activity? This cannot be undone.`))return;
    const confirmation=prompt(`Type ${user.email} to confirm permanent deletion.`);
    if(confirmation?.trim().toLowerCase()!==user.email.toLowerCase())return;
  }else if(!confirm(action==="ban"
    ?`Ban ${user.email} from signing in? An existing session may remain usable until its access token expires.`
    :`Restore sign-in access for ${user.email}?`))return;
  try{
    const {error}=await db.functions.invoke("admin-user-management",{body:{action,userId}});
    if(error)throw error;
    $("admin-user-activity").classList.add("hidden");
    message("admin-user-message",action==="delete"?"User account permanently deleted.":action==="ban"?"User account banned.":"User access restored.");
    await loadAdminUsers();
  }catch(error){
    console.error(`Could not ${action} user account.`,error);
    message("admin-user-message",`Could not ${action} user: ${error.message}`,true);
  }
}
$("admin-invite-user-form").addEventListener("submit",async event=>{
  event.preventDefault();if(!isAdmin)return;
  const button=$("admin-invite-submit");button.disabled=true;
  message("admin-user-message","Sending invitation…");
  try{
    const {error}=await db.functions.invoke("admin-user-management",{body:{
      action:"invite",email:$("admin-invite-email").value.trim(),
      displayName:$("admin-invite-name").value.trim()
    }});
    if(error)throw error;
    $("admin-invite-user-form").reset();
    message("admin-user-message","Invitation sent. The user can finish setting up their account from the email.");
    await loadAdminUsers();
  }catch(error){
    console.error("Could not invite user.",error);
    message("admin-user-message","Could not send invitation: "+error.message,true);
  }finally{button.disabled=false}
});
$("admin-users-refresh").addEventListener("click",()=>loadAdminUsers());
$("admin-users-load-more").addEventListener("click",()=>loadAdminUsers(true));
$("admin-user-search").addEventListener("input",renderAdminUsers);
$("admin-user-list").addEventListener("change",async event=>{
  const roleSelect=event.target.closest("[data-user-role]");
  const gemsToggle=event.target.closest("[data-user-gems]");
  if(!roleSelect&&!gemsToggle)return;
  const userId=(roleSelect||gemsToggle).dataset.userRole||(roleSelect||gemsToggle).dataset.userGems;
  if(!isAdmin||!userId)return;
  const role=roleSelect?roleSelect.value:undefined;
  const gemsEnabled=gemsToggle?gemsToggle.checked:undefined;
  const {error}=await db.rpc("set_user_access",{p_user_id:userId,p_role:role,p_gems_enabled:gemsEnabled});
  if(error)message("admin-user-message",error.message,true);else{message("admin-user-message","User access updated.");await loadAdminUsers()}
});
$("admin-user-list").addEventListener("click",event=>{
  const activity=event.target.closest("[data-user-activity]");
  const ban=event.target.closest("[data-user-ban]");
  const remove=event.target.closest("[data-user-delete]");
  if(activity)showAdminUserActivity(activity.dataset.userActivity);
  else if(ban)manageAdminUser(ban.dataset.banned==="true"?"unban":"ban",ban.dataset.userBan);
  else if(remove)manageAdminUser("delete",remove.dataset.userDelete);
});
$("admin-user-activity-close").addEventListener("click",()=>$("admin-user-activity").classList.add("hidden"));
async function loadAdmin(){
  if(!isAdmin)return;
  const {data,error}=await db.rpc("get_admin_summary");
  if(error){$("admin-stats").textContent="Could not load admin statistics: "+error.message;return}
  if(!("group_average" in data)){$("admin-stats").textContent="Could not load the group average. Run the latest schema.sql in the Supabase SQL Editor.";return}
  const groupAverage=data.group_average==null?"—":`${Number(data.group_average).toFixed(1)}%`;
  $("admin-stats").innerHTML=`<div class="stat"><strong>${data.quiz_count}</strong><span>Quizzes</span></div><div class="stat"><strong>${data.resource_count}</strong><span>Resources</span></div><div class="stat"><strong>${data.attempt_count}</strong><span>Recorded attempts</span></div><div class="stat"><strong>${data.student_count}</strong><span>Registered students</span></div><div class="stat"><strong>${groupAverage}</strong><span>Verified group average</span></div>`;
  await Promise.all([loadAdminLists(),loadAdminSchedules(),loadAdminUsers(),loadAchievementAdmin()]);
}
async function loadAdminLists(){
  if(!isAdmin)return;
  const [q,r]=await Promise.all([db.from("quizzes").select("*").order("created_at",{ascending:false}),db.from("resources").select("*").order("created_at",{ascending:false})]);
  if(q.error||r.error){$("admin-quiz-list").textContent=$("admin-resource-list").textContent=(q.error||r.error).message;return}
  adminQuizzes=q.data||[];adminResources=r.data||[];
  const render=(row,type)=>{const location=type==="quiz"?row.google_form_url:row.storage_path?row.storage_path.split("/").pop():row.url;
    return `<article class="admin-item"><div><h3>${esc(row.title)} <span class="status-pill ${row.is_published?"status-published":"status-draft"}">${row.is_published?"Published":"Draft"}</span></h3><p>${esc(row.course)} • ${esc(type==="quiz"?"Google Form":"Resource")} • ${esc(location||"Uploaded document")}</p></div><div class="admin-actions"><button class="button button-outline" data-edit="${type}" data-id="${row.id}">Edit</button><button class="button button-light" data-toggle="${type}" data-id="${row.id}">${row.is_published?"Unpublish":"Publish"}</button><button class="button button-light" data-delete="${type}" data-id="${row.id}">Delete</button></div></article>`;
  };
  $("admin-quiz-list").innerHTML=adminQuizzes.length?adminQuizzes.map(x=>render(x,"quiz")).join(""):'<p class="muted">No quizzes yet.</p>';
  $("admin-resource-list").innerHTML=adminResources.length?adminResources.map(x=>render(x,"resource")).join(""):'<p class="muted">No resources yet.</p>';
}
function asLocalDateTime(value){
  const date=new Date(value),local=new Date(date.getTime()-date.getTimezoneOffset()*60000);
  return local.toISOString().slice(0,16);
}
async function loadAdminSchedules(){
  if(!isAdmin)return;
  const [classes,exams]=await Promise.all([
    db.from("class_timetable").select("*").order("day_of_week").order("start_time"),
    db.from("mb_exams").select("*").order("starts_at")
  ]);
  if(classes.error||exams.error){
    const error=classes.error||exams.error;
    scheduleDataLoaded=false;classSessions=[];mbExams=[];
    scheduleLoadError=error.message;renderTimetable();renderExams();
    $("admin-class-list").textContent=$("admin-exam-list").textContent=error.message;
    return;
  }
  scheduleDataLoaded=true;scheduleLoadError=null;classSessions=classes.data||[];mbExams=exams.data||[];
  renderTimetable();renderExams();
  $("admin-class-list").innerHTML=classSessions.length?classSessions.map(item=>`<article class="admin-item"><div><h3>${esc(item.title)}</h3><p>${esc(WEEKDAYS[Number(item.day_of_week)-1])} • ${esc(item.course)} • ${esc(formatTime(item.start_time))}–${esc(formatTime(item.end_time))} • ${esc(item.lecturer)}</p></div><div class="admin-actions"><button class="button button-outline" type="button" data-schedule-edit="class" data-id="${item.id}">Edit</button><button class="button button-light" type="button" data-schedule-delete="class" data-id="${item.id}">Delete</button></div></article>`).join(""):'<p class="muted">No classes have been added.</p>';
  $("admin-exam-list").innerHTML=mbExams.length?mbExams.map(item=>`<article class="admin-item"><div><h3>${esc(item.exam_name)} <span class="status-pill status-published">${esc(item.exam_type)}</span></h3><p>${esc(item.course)} • ${esc(formatDateTime(item.starts_at))} to ${esc(formatDateTime(item.ends_at))}</p></div><div class="admin-actions"><button class="button button-outline" type="button" data-schedule-edit="exam" data-id="${item.id}">Edit</button><button class="button button-light" type="button" data-schedule-delete="exam" data-id="${item.id}">Delete</button></div></article>`).join(""):'<p class="muted">No exams have been added.</p>';
}
function clearScheduleForm(type){
  const isClass=type==="class",form=$(isClass?"admin-class-form":"admin-exam-form");
  form.reset();$(isClass?"admin-class-id":"admin-exam-id").value="";
}
$("admin-class-form").addEventListener("submit",async event=>{
  event.preventDefault();if(!isAdmin)return;
  const id=$("admin-class-id").value,start=$("admin-class-start").value,end=$("admin-class-end").value;
  if(end<=start){message("admin-class-message","The end time must be later than the start time.",true);return}
  const row={course:$("admin-class-course").value,day_of_week:Number($("admin-class-day").value),title:$("admin-class-title").value.trim(),lecturer:$("admin-class-lecturer").value.trim(),start_time:start,end_time:end};
  const result=id?await db.from("class_timetable").update(row).eq("id",id):await db.from("class_timetable").insert(row);
  message("admin-class-message",result.error?result.error.message:"Class timetable saved.",!!result.error);
  if(!result.error){clearScheduleForm("class");await loadAdminSchedules();startScheduleNotifications()}
});
$("admin-exam-form").addEventListener("submit",async event=>{
  event.preventDefault();if(!isAdmin)return;
  const id=$("admin-exam-id").value,start=new Date($("admin-exam-start").value),end=new Date($("admin-exam-end").value);
  if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime())||end<=start){message("admin-exam-message","The end date and time must be later than the start.",true);return}
  const row={course:$("admin-exam-course").value,exam_name:$("admin-exam-name").value.trim(),exam_type:$("admin-exam-type").value,starts_at:start.toISOString(),ends_at:end.toISOString()};
  const result=id?await db.from("mb_exams").update(row).eq("id",id):await db.from("mb_exams").insert(row);
  message("admin-exam-message",result.error?result.error.message:"Exam period saved.",!!result.error);
  if(!result.error){clearScheduleForm("exam");await loadAdminSchedules();startScheduleNotifications()}
});
$("admin-class-cancel").addEventListener("click",()=>clearScheduleForm("class"));
$("admin-exam-cancel").addEventListener("click",()=>clearScheduleForm("exam"));
$("admin-resource-type").addEventListener("change",()=>{
  const textbook=$("admin-resource-type").value==="textbook",resourceUrl=$("admin-resource-url"),driveUrl=$("admin-resource-drive-url");
  if(textbook&&!driveUrl.value&&resourceUrl.value){driveUrl.value=resourceUrl.value;resourceUrl.value=""}
  else if(!textbook&&!resourceUrl.value&&driveUrl.value){resourceUrl.value=driveUrl.value;driveUrl.value=""}
});
function clearAdminForm(type){
  const quiz=type==="quiz";$(quiz?"admin-quiz-form":"admin-resource-form").reset();$(quiz?"admin-quiz-id":"admin-resource-id").value="";
  $(quiz?"admin-quiz-heading":"admin-resource-heading").textContent=quiz?"Add a quiz":"Add a resource";
  if(!quiz)$("admin-resource-file-help").textContent="PDF, Word, PowerPoint or text documents up to 50 MB. Videos should be added as links.";
}
$("admin-quiz-form").onsubmit=async e=>{
  e.preventDefault();if(!isAdmin)return;const id=$("admin-quiz-id").value,url=$("admin-quiz-url").value.trim();
  if(!safeUrl(url)){message("admin-quiz-message","Enter a valid http/https URL.",true);return}
  const row={course:$("admin-quiz-course").value,title:$("admin-quiz-title").value.trim(),description:$("admin-quiz-description").value.trim(),topics:parseQuizTopics($("admin-quiz-topics").value),difficulty:$("admin-quiz-difficulty").value,google_form_url:url,google_form_id:$("admin-quiz-form-id").value.trim()||null,is_published:$("admin-quiz-published").checked};
  const res=id?await db.from("quizzes").update(row).eq("id",id):await db.from("quizzes").insert(row);
  message("admin-quiz-message",res.error?res.error.message:"Quiz saved.",!!res.error);if(!res.error){clearAdminForm("quiz");await loadAdminLists();await loadContent()}
};
$("admin-quiz-bulk-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!isAdmin)return;
  const selected=[...document.querySelectorAll(".bulk-quiz-course")].filter(row=>row.querySelector(".bulk-course-toggle").checked);
  if(!selected.length){message("bulk-quiz-message","Select at least one course.",true);return}
  const rows=selected.map(row=>({
    course:row.dataset.course,title:row.querySelector('[data-field="title"]').value.trim(),description:null,
    topics:parseQuizTopics(row.querySelector('[data-field="topics"]').value),
    difficulty:$("bulk-quiz-difficulty").value,google_form_url:row.querySelector('[data-field="url"]').value.trim(),
    google_form_id:row.querySelector('[data-field="form-id"]').value.trim()||null,is_published:$("bulk-quiz-published").checked
  }));
  const invalid=rows.find(row=>!row.title||!safeUrl(row.google_form_url));
  if(invalid){message("bulk-quiz-message",`Enter a title and valid https/http form URL for ${invalid.course}.`,true);return}
  const submit=$("admin-quiz-bulk-form").querySelector('[type="submit"]');
  submit.disabled=true;message("bulk-quiz-message",`Creating ${rows.length} quizzes…`);
  try{
    const {error}=await db.from("quizzes").insert(rows);
    if(error){message("bulk-quiz-message",error.message,true);return}
    $("admin-quiz-bulk-form").reset();renderBulkQuizRows();
    message("bulk-quiz-message",`${rows.length} quizzes created.`);
    await loadAdminLists();await loadContent();
  }catch(error){message("bulk-quiz-message","Could not create quizzes: "+error.message,true)}
  finally{submit.disabled=false}
});
$("admin-notification-form").addEventListener("submit",async event=>{
  event.preventDefault();if(!isAdmin)return;
  const title=$("admin-notification-title").value.trim(),body=$("admin-notification-body").value.trim();
  if(!title||!body){message("admin-notification-message","Enter both a title and a message.",true);return}
  const submit=$("admin-notification-form").querySelector('[type="submit"]');
  submit.disabled=true;message("admin-notification-message","Sending announcement…");
  try{
    const {error}=await db.from("notifications").insert({title,body});
    if(error){message("admin-notification-message",error.message,true);return}
    $("admin-notification-form").reset();
    const refreshed=await loadNotifications();
    message("admin-notification-message",refreshed
      ?"Announcement sent to everyone. It will be available for 14 days."
      :"Announcement sent, but the notification list could not be refreshed.",!refreshed);
  }catch(error){message("admin-notification-message","Could not send announcement: "+error.message,true)}
  finally{submit.disabled=false}
});
$("admin-reset-all-study-data").addEventListener("click",async()=>{
  if(!isAdmin)return;
  if(!confirm("This permanently deletes every user's web activity, active-time totals, study streak and quiz results. Profiles, accounts and study content will remain."))return;
  if(prompt("Type RESET ALL STUDY DATA to confirm.")?.trim()!=="RESET ALL STUDY DATA")return;
  const button=$("admin-reset-all-study-data");button.disabled=true;
  let resetCompleted=false;
  message("admin-reset-data-message","Resetting study data for all users…");
  try{
    const {data,error}=await db.rpc("admin_reset_all_study_data");
    if(error)throw error;
    const row=Array.isArray(data)?data[0]:data;
    if(!row?.reset_at)throw new Error("The reset completed without returning its reset timestamp.");
    resetCompleted=true;
    applyActivityResetMarker(row.reset_at,true);
    attempts=[];renderPersonalStats();
    if(featureEnabled("leaderboards")){void renderLeaderboard();void renderHomeLeaderboard()}
    $("admin-user-activity").classList.add("hidden");
    adminUserRows.forEach(user=>user.last_activity_at=null);renderAdminUsers();
    void loadAdmin();
    message("admin-reset-data-message",`Reset complete: ${formatResetCount(row,"activity_events_deleted","activity event")}, ${formatResetCount(row,"active_time_days_deleted","active-time total")}, ${formatResetCount(row,"streaks_deleted","streak")} and ${formatResetCount(row,"quiz_results_deleted","quiz result")} cleared for all users.`);
  }catch(error){
    console.error("Could not reset study data for all users.",error);
    const detail=error.code==="PGRST202"?"Run the latest schema.sql in Supabase first. "+error.message:error.message;
    message("admin-reset-data-message",resetCompleted?"All user data was reset, but the dashboard could not refresh: "+error.message:"Could not reset all users' data: "+detail,true);
  }finally{button.disabled=false}
});
$("admin-notifications-clear").addEventListener("click",async()=>{
  if(!isAdmin)return;
  if(!confirm("This permanently deletes every shared announcement and tells all signed-in users to clear saved class/exam reminders at their next notification-centre sync."))return;
  if(prompt("Type CLEAR ALL NOTIFICATIONS to confirm.")?.trim()!=="CLEAR ALL NOTIFICATIONS")return;
  const button=$("admin-notifications-clear");button.disabled=true;
  let resetCompleted=false;
  message("admin-notification-reset-message","Clearing notification centres…");
  try{
    const {data,error}=await db.rpc("admin_clear_notifications");
    if(error)throw error;
    const row=Array.isArray(data)?data[0]:data;
    if(!row?.reminders_reset_at)throw new Error("Notifications were cleared without returning the reminder reset marker.");
    resetCompleted=true;
    applyNotificationResetMarker(row.reminders_reset_at,true);
    const refreshed=await loadNotifications();
    message("admin-notification-reset-message",refreshed
      ?`Cleared ${formatResetCount(row,"announcements_deleted","shared announcement")}. Saved class/exam reminders will clear for users the next time their centre syncs.`
      :"Notifications were cleared, but this centre could not refresh. Try Refresh.",!refreshed);
  }catch(error){
    console.error("Could not clear notification centres.",error);
    const detail=error.code==="PGRST202"?"Run the latest schema.sql in Supabase first. "+error.message:error.message;
    message("admin-notification-reset-message",resetCompleted?"Notifications were cleared, but the centre could not refresh: "+error.message:"Could not clear notification centres: "+detail,true);
  }finally{button.disabled=false}
});
const DOCUMENT_TYPES={
  pdf:"application/pdf",doc:"application/msword",
  docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt:"application/vnd.ms-powerpoint",
  pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt:"text/plain",rtf:"application/rtf"
};
async function removeUploadedDocument(path){
  return await db.storage.from(DOCUMENT_BUCKET).remove([path]);
}
$("admin-resource-form").onsubmit=async e=>{
  e.preventDefault();if(!isAdmin)return;
  const id=$("admin-resource-id").value,urlInput=$("admin-resource-url").value.trim(),driveUrlInput=$("admin-resource-drive-url").value.trim(),file=$("admin-resource-file").files[0]||null;
  const existing=id?adminResources.find(item=>String(item.id)===id):null,type=$("admin-resource-type").value;
  if(type==="textbook"&&urlInput&&driveUrlInput){message("admin-resource-message","Use either the resource URL or the Google Drive textbook link, not both.",true);return}
  if(type!=="textbook"&&driveUrlInput){message("admin-resource-message","Use the Google Drive textbook link only for textbook resources.",true);return}
  const resourceUrl=type==="textbook"?driveUrlInput||urlInput:urlInput;
  if(type==="video"&&(file||(existing?.storage_path&&!resourceUrl))){message("admin-resource-message","Video resources must be added as a video URL.",true);return}
  if(file){
    const extension=(file.name.split(".").pop()||"").toLowerCase();
    if(!DOCUMENT_TYPES[extension]||file.size===0||file.size>50*1024*1024){message("admin-resource-message","Choose a non-empty PDF, Word, PowerPoint or text document no larger than 50 MB.",true);return}
  }
  if(!file&&resourceUrl&&!safeUrl(resourceUrl)){message("admin-resource-message","Enter a valid http/https URL.",true);return}
  if(!file&&!resourceUrl&&!existing?.storage_path){message("admin-resource-message","Enter a resource URL or choose a document to upload.",true);return}
  const oldStoragePath=existing?.storage_path||null;
  let storagePath=oldStoragePath&&!resourceUrl?oldStoragePath:null,uploadedPath=null;
  const submit=$("admin-resource-form").querySelector('[type="submit"]');submit.disabled=true;
  let resourceSaved=false;
  try{
    if(file){
      const safeName=file.name.replace(/[^a-zA-Z0-9._-]/g,"_").slice(-100),path=`${currentUser.id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}-${safeName}`;
      const {error}=await db.storage.from(DOCUMENT_BUCKET).upload(path,file,{contentType:DOCUMENT_TYPES[file.name.split(".").pop().toLowerCase()],upsert:false});
      if(error){message("admin-resource-message",error.message,true);return}
      storagePath=path;uploadedPath=path;
    }
    const row={
      course:$("admin-resource-course").value,title:$("admin-resource-title").value.trim(),description:$("admin-resource-description").value.trim(),
      resource_type:type,url:storagePath?null:resourceUrl||null,storage_path:storagePath,is_published:$("admin-resource-published").checked
    };
    const res=id?await db.from("resources").update(row).eq("id",id):await db.from("resources").insert(row);
    if(res.error){
      let errorText=res.error.message;
      if(uploadedPath){const cleanup=await removeUploadedDocument(uploadedPath);if(cleanup.error){console.error(cleanup.error);errorText+=" Uploaded file cleanup failed: "+cleanup.error.message}}
      message("admin-resource-message",errorText,true);return
    }
    resourceSaved=true;
    if(oldStoragePath&&oldStoragePath!==storagePath){
      const cleanup=await removeUploadedDocument(oldStoragePath);
      if(cleanup.error){console.error(cleanup.error);message("admin-resource-message","Resource saved, but the previous uploaded document could not be removed: "+cleanup.error.message,true)}
      else message("admin-resource-message","Resource saved.");
    }else message("admin-resource-message","Resource saved.");
    clearAdminForm("resource");await loadAdminLists();await loadContent();
  }catch(error){
    let errorText="Could not save resource: "+error.message;
    if(uploadedPath&&!resourceSaved){
      const cleanup=await removeUploadedDocument(uploadedPath);
      if(cleanup.error){console.error(cleanup.error);errorText+=" Uploaded file cleanup failed: "+cleanup.error.message}
    }
    message("admin-resource-message",errorText,true);
  }finally{submit.disabled=false}
};
$("admin-quiz-cancel").onclick=()=>clearAdminForm("quiz");$("admin-resource-cancel").onclick=()=>clearAdminForm("resource");$("admin-refresh").onclick=loadAdminLists;
$("page-admin").addEventListener("click",async e=>{
  const scheduleEdit=e.target.closest("[data-schedule-edit]"),scheduleDelete=e.target.closest("[data-schedule-delete]");
  if(scheduleEdit){
    const type=scheduleEdit.dataset.scheduleEdit,isClass=type==="class",rows=isClass?classSessions:mbExams;
    const item=rows.find(row=>String(row.id)===scheduleEdit.dataset.id);if(!item)return;
    if(isClass){
      $("admin-class-id").value=item.id;$("admin-class-course").value=item.course;$("admin-class-day").value=item.day_of_week;
      $("admin-class-title").value=item.title;$("admin-class-lecturer").value=item.lecturer;
      $("admin-class-start").value=item.start_time.slice(0,5);$("admin-class-end").value=item.end_time.slice(0,5);
      $("admin-class-form").scrollIntoView({behavior:"smooth"});
    }else{
      $("admin-exam-id").value=item.id;$("admin-exam-course").value=item.course;$("admin-exam-name").value=item.exam_name;
      $("admin-exam-type").value=item.exam_type;$("admin-exam-start").value=asLocalDateTime(item.starts_at);
      $("admin-exam-end").value=asLocalDateTime(item.ends_at);$("admin-exam-form").scrollIntoView({behavior:"smooth"});
    }
    return;
  }
  if(scheduleDelete){
    const type=scheduleDelete.dataset.scheduleDelete,isClass=type==="class",table=isClass?"class_timetable":"mb_exams";
    if(!confirm(`Delete this ${isClass?"class":"exam"} schedule?`))return;
    scheduleDelete.disabled=true;
    const {error}=await db.from(table).delete().eq("id",scheduleDelete.dataset.id);
    if(error){scheduleDelete.disabled=false;message(isClass?"admin-class-message":"admin-exam-message",error.message,true);return}
    message(isClass?"admin-class-message":"admin-exam-message",`${isClass?"Class":"Exam"} schedule deleted.`);
    await loadAdminSchedules();return;
  }
  const edit=e.target.closest("[data-edit]"),toggle=e.target.closest("[data-toggle]"),del=e.target.closest("[data-delete]");
  if(edit){
    const quiz=edit.dataset.edit==="quiz",row=(quiz?adminQuizzes:adminResources).find(x=>String(x.id)===edit.dataset.id);if(!row)return;
    if(quiz){$("admin-quiz-id").value=row.id;$("admin-quiz-course").value=row.course;$("admin-quiz-title").value=row.title;$("admin-quiz-description").value=row.description||"";$("admin-quiz-topics").value=Array.isArray(row.topics)?row.topics.join(", "):"";$("admin-quiz-difficulty").value=row.difficulty||"Practice";$("admin-quiz-url").value=row.google_form_url;$("admin-quiz-form-id").value=row.google_form_id||"";$("admin-quiz-published").checked=row.is_published;$("admin-quiz-heading").textContent="Edit quiz";$("admin-quiz-form").scrollIntoView({behavior:"smooth"})}
    else{$("admin-resource-id").value=row.id;$("admin-resource-course").value=row.course;$("admin-resource-title").value=row.title;$("admin-resource-description").value=row.description||"";$("admin-resource-type").value=row.resource_type;$("admin-resource-url").value=row.resource_type==="textbook"?"":row.url||"";$("admin-resource-drive-url").value=row.resource_type==="textbook"?row.url||"":"";$("admin-resource-file-help").textContent=row.storage_path?`Current document: ${row.storage_path.split("/").pop()}. Leave empty to keep it, or select a replacement.`:"PDF, Word, PowerPoint or text documents up to 50 MB. Videos should be added as links.";$("admin-resource-published").checked=row.is_published;$("admin-resource-heading").textContent="Edit resource";$("admin-resource-form").scrollIntoView({behavior:"smooth"})}
  }
  if(toggle){const type=toggle.dataset.toggle,table=type==="quiz"?"quizzes":"resources",rows=type==="quiz"?adminQuizzes:adminResources,row=rows.find(x=>String(x.id)===toggle.dataset.id);if(!row)return;
    const {error}=await db.from(table).update({is_published:!row.is_published}).eq("id",row.id);if(error)alert(error.message);else{await loadAdminLists();await loadContent()}}
  if(del){const type=del.dataset.delete,table=type==="quiz"?"quizzes":"resources",row=(type==="quiz"?adminQuizzes:adminResources).find(x=>String(x.id)===del.dataset.id);if(!confirm("Delete this item permanently?"))return;const {error}=await db.from(table).delete().eq("id",del.dataset.id);if(error)alert(error.message);else{
    if(type==="resource"&&row?.storage_path){const cleanup=await removeUploadedDocument(row.storage_path);if(cleanup.error)alert("Resource deleted, but its uploaded document could not be removed: "+cleanup.error.message)}
    await loadAdminLists();await loadContent()
  }}
});
const plannerDayNames=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
async function loadStudySchedules(){
  if(!currentUser||currentProfileRole==="guest"){return}
  const {data,error}=await db.from("study_schedules").select("*").eq("user_id",currentUser.id).order("day_of_week").order("start_time");
  if(error){message("study-schedule-status",error.message,true);return}
  const rows=data||[];
  $("study-schedule-grid").innerHTML=rows.length?rows.map(row=>`
    <article class="schedule-block" style="--schedule-color:${esc(row.color)}">
      <label class="schedule-complete"><input type="checkbox" data-schedule-complete="${esc(row.id)}"${row.completed?" checked":""}> <span>Complete</span></label>
      <strong>${esc(plannerDayNames[Number(row.day_of_week)])}</strong>
      <h3>${esc(row.subject)}</h3>
      <p>${esc(row.start_time.slice(0,5))}–${esc(row.end_time.slice(0,5))}</p>
      <button class="text-button" type="button" data-schedule-delete="${esc(row.id)}">Delete</button>
    </article>`).join(""):'<p class="muted">No study blocks yet.</p>';
}
$("study-schedule-form").addEventListener("submit",async event=>{
  event.preventDefault();
  if(!currentUser||currentProfileRole==="guest")return;
  if($("schedule-end").value<=$("schedule-start").value){message("study-schedule-status","End time must be after start time.",true);return}
  const row={user_id:currentUser.id,subject:$("schedule-subject").value.trim(),day_of_week:Number($("schedule-day").value),
    start_time:$("schedule-start").value,end_time:$("schedule-end").value,color:$("schedule-color").value,
    notification_enabled:$("schedule-notifications").checked};
  const {error}=await db.from("study_schedules").insert(row);
  if(error){message("study-schedule-status",error.message,true);return}
  event.target.reset();message("study-schedule-status","Study block saved.");await loadStudySchedules();
});
let activeFlashcardDeckId=null,flashcardIndex=0,flashcardCards=[];
async function loadFlashcardDecks(){
  if(!currentUser||currentProfileRole==="guest")return;
  const {data,error}=await db.from("flashcard_decks").select("*").eq("user_id",currentUser.id).order("created_at",{ascending:false});
  if(error){message("flashcard-status",error.message,true);return}
  $("flashcard-deck-list").innerHTML=(data||[]).length?(data||[]).map(deck=>`<article class="flashcard-deck"><div><h3>${esc(deck.title)}</h3><p>${esc(deck.description||"Custom medical flashcards")}</p></div><button class="button button-outline" type="button" data-open-deck="${esc(deck.id)}">Open deck</button></article>`).join(""):'<p class="muted">Create your first flashcard deck.</p>';
}
$("flashcard-deck-form").addEventListener("submit",async event=>{
  event.preventDefault();
  if(!currentUser||currentProfileRole==="guest")return;
  const row={user_id:currentUser.id,title:$("flashcard-deck-title").value.trim(),description:$("flashcard-deck-description").value.trim()||null};
  const {data,error}=await db.from("flashcard_decks").insert(row).select("id").single();
  if(error){message("flashcard-status",error.message,true);return}
  event.target.reset();activeFlashcardDeckId=data.id;message("flashcard-status","Deck created.");await loadFlashcardDecks();await openFlashcardDeck(data.id);
});
async function openFlashcardDeck(deckId){
  activeFlashcardDeckId=deckId;flashcardIndex=0;
  const {data,error}=await db.from("flashcards").select("*").eq("deck_id",deckId).order("created_at");
  if(error){message("flashcard-status",error.message,true);return}
  flashcardCards=data||[];
  const studio=$("flashcard-studio");studio.classList.remove("hidden");
  renderFlashcardStudio();
}
function renderFlashcardStudio(){
  const studio=$("flashcard-studio");
  if(!flashcardCards.length){
    studio.innerHTML=`<h3>Add a flashcard</h3><form id="flashcard-add-form" class="flashcard-add-form"><label>Front<input id="flashcard-front" maxlength="500" required></label><label>Back<textarea id="flashcard-back" maxlength="1000" required></textarea></label><label>Hint (optional)<input id="flashcard-hint" maxlength="180"></label><label>Image URL (optional)<input id="flashcard-image" type="url"></label><button class="button button-primary" type="submit">Add card</button></form>`;
  }else{
    const card=flashcardCards[Math.min(flashcardIndex,flashcardCards.length-1)];
    studio.innerHTML=`<div class="flashcard-progress">${flashcardIndex+1} / ${flashcardCards.length}</div><button id="flashcard-flip" class="flashcard-3d" type="button"><span class="flashcard-face flashcard-front-face">${esc(card.front)}${card.hint?`<small>Hint: ${esc(card.hint)}</small>`:""}</span><span class="flashcard-face flashcard-back-face">${card.image_url?`<img src="${esc(card.image_url)}" alt="">`:""}${esc(card.back)}</span></button><div class="flashcard-grading"><button class="button button-light" type="button" data-grade="again">Again</button><button class="button button-outline" type="button" data-grade="hard">Hard</button><button class="button button-primary" type="button" data-grade="good">Good</button><button class="button button-light" type="button" data-grade="easy">Easy</button></div><form id="flashcard-add-form" class="flashcard-add-form"><label>Front<input id="flashcard-front" maxlength="500" required></label><label>Back<textarea id="flashcard-back" maxlength="1000" required></textarea></label><button class="button button-outline" type="submit">Add another card</button></form>`;
  }
}
$("study-schedule-grid").addEventListener("click",async event=>{
  const del=event.target.closest("[data-schedule-delete]");
  if(del){const {error}=await db.from("study_schedules").delete().eq("id",del.dataset.scheduleDelete);if(!error)await loadStudySchedules();return}
});
$("study-schedule-grid").addEventListener("change",async event=>{
  const toggle=event.target.closest("[data-schedule-complete]");
  if(toggle)await db.from("study_schedules").update({completed:toggle.checked}).eq("id",toggle.dataset.scheduleComplete);
});
$("flashcard-deck-list").addEventListener("click",event=>{
  const button=event.target.closest("[data-open-deck]");
  if(button)void openFlashcardDeck(button.dataset.openDeck);
});
$("flashcard-studio").addEventListener("submit",async event=>{
  if(event.target.id!=="flashcard-add-form")return;
  event.preventDefault();
  const row={deck_id:activeFlashcardDeckId,front:$("flashcard-front").value.trim(),back:$("flashcard-back").value.trim(),
    hint:$("flashcard-hint")?.value.trim()||null,image_url:$("flashcard-image")?.value.trim()||null};
  if(!row.deck_id)return;
  const {error}=await db.from("flashcards").insert(row);
  if(error){message("flashcard-status",error.message,true);return}
  message("flashcard-status","Card added.");await openFlashcardDeck(activeFlashcardDeckId);
});
$("flashcard-studio").addEventListener("click",event=>{
  const flip=event.target.closest("#flashcard-flip");
  if(flip){flip.classList.toggle("is-flipped");return}
  const grade=event.target.closest("[data-grade]");
  if(!grade||!flashcardCards.length)return;
  const card=flashcardCards[Math.min(flashcardIndex,flashcardCards.length-1)];
  const step={again:1,hard:2,good:4,easy:7}[grade.dataset.grade]||1;
  flashcardIndex=(flashcardIndex+1)%flashcardCards.length;
  db.from("flashcards").update({ease:Math.max(130,step===1?130:250+step*20),interval_days:step,next_review_at:new Date(Date.now()+step*86400000).toISOString()}).eq("id",card.id).then();
  renderFlashcardStudio();
});
document.querySelectorAll("[data-planner-tab]").forEach(button=>button.addEventListener("click",()=>{
  document.querySelectorAll("[data-planner-tab]").forEach(tab=>tab.classList.toggle("active",tab===button));
  const schedule=button.dataset.plannerTab==="schedule";
  $("planner-schedule").classList.toggle("hidden",!schedule);$("planner-schedule").hidden=!schedule;
  $("planner-flashcards").classList.toggle("hidden",schedule);$("planner-flashcards").hidden=schedule;
  if(schedule)void loadStudySchedules();else void loadFlashcardDecks();
}));
async function init(){
  populateTimeZones();
  if(!navigator.onLine)showNetworkNotice();
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").catch(error=>console.warn("Could not register the app service worker.",error));
  }
  if(!configured){message("auth-message","Setup needed: connect Supabase using the README instructions.");return}
  if(!db){message("auth-message","The Supabase client could not load. Connect to the internet and refresh to access your study data.",true);return}
  db.auth.onAuthStateChange((event,session)=>{
    if(event==="PASSWORD_RECOVERY"){
      $("auth-view").classList.remove("hidden");$("app-view").classList.add("hidden");
      $("auth-form").classList.add("hidden");$("forgot-password").classList.add("hidden");
      $("password-update-form").classList.remove("hidden");
    }else if(event==="INITIAL_SESSION"){
      if(session&&!currentUser)void signedIn(session.user);
      else if(!session&&currentUser)signedOut();
    }else if(event==="SIGNED_IN"&&session&&currentUser?.id!==session.user.id){
      resetSessionStartedAt(session.user.id);
      $("password-update-form").classList.add("hidden");$("auth-form").classList.remove("hidden");$("forgot-password").classList.remove("hidden");
      void signedIn(session.user);
    }else if(event==="USER_UPDATED"&&session&&currentUser?.id===session.user.id&&
      currentUser.user_metadata?.requires_password_setup&&!session.user.user_metadata?.requires_password_setup){
      $("password-update-form").classList.add("hidden");$("auth-form").classList.remove("hidden");$("forgot-password").classList.remove("hidden");
      void signedIn(session.user);
    }else if(event==="SIGNED_OUT")signedOut();
  });
  try{
    const {data:{session},error}=await db.auth.getSession();
    if(error)throw error;
    if(session)await signedIn(session.user);else signedOut();
  }catch(error){
    console.error("Could not restore the login session.",error);
    signedOut();message("auth-message","Could not connect. Your session may have expired; check your network connection and try again.",true);
    showNetworkNotice();
  }
  setInterval(()=>{
    if(!currentUser)return;
    if(!$("page-progress").classList.contains("hidden"))void renderLeaderboard();
    if(!$("page-home").classList.contains("hidden"))void renderHomeLeaderboard();
  },30000);
  if(db&&currentProfileRole!=="guest"){
    db.channel("medstudy-profile-leaderboard")
      .on("postgres_changes",{event:"UPDATE",schema:"public",table:"profiles"},()=>{
        if(!$("page-progress").classList.contains("hidden"))void renderLeaderboard();
        if(!$("page-home").classList.contains("hidden"))void renderHomeLeaderboard();
      }).subscribe();
  }
}
init();