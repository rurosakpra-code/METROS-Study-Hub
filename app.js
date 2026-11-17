/* MedStudy Hub — configure only the Supabase project URL and anon/publishable key. */
const SUPABASE_URL = "https://qiwqluwtmpflmekgjiob.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_SA2ullhPQI-ftOEUfBqcvQ_oRendrnb";
const configured = !SUPABASE_URL.startsWith("YOUR_") && !SUPABASE_ANON_KEY.startsWith("YOUR_");
const db = configured && window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const COURSES = ["Biochemistry","Histology","Physiology","Embryology","Gross Anatomy"];
const DEFAULT_THEME_COLOR = "#087f8c";
const PAGE_STATE_TTL = 30 * 60 * 1000;
const DOCUMENT_BUCKET = "study-documents";
const NOTIFICATION_TTL_DAYS = 14;
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
const $ = id => document.getElementById(id);
const esc = v => String(v ?? "").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let currentUser=null,isAdmin=false,authMode="login",quizzes=[],resources=[],adminQuizzes=[],adminResources=[],attempts=[],notifications=[],calendarNotifications=[],classSessions=[],mbExams=[],groupChatMessages=[],featureSettings=Object.fromEntries(FEATURE_OPTIONS.map(([key])=>[key,true])),scheduleDataLoaded=false,scheduleLoadError=null,notificationReadIds=new Set(),notificationRefreshTimer=null,chatRefreshTimer=null,activeBoard="overall",chart=null,resourceRenderId=0,activeTimetableDay=0,liveNoticeTimer=null,usageTimer=null,usageLastTick=null,activityPendingSeconds=0,activityLoggingUnavailable=false,adminUserRows=[],adminUserPage=1,adminUsersHaveMore=false,toastTimer=null;
const resourceLinkCache=new Map();
function message(id,text,error=false){const e=$(id);if(e){e.textContent=text;e.classList.toggle("error",error);}}
function safeUrl(v){try{const u=new URL(v);return ["https:","http:"].includes(u.protocol)}catch{return false}}
function pageStateKey(){return currentUser?"medstudy:last-page:"+currentUser.id:null}
function notificationReadKey(){return currentUser?"medstudy:read-notifications:"+currentUser.id:null}
function calendarNoticeKey(){return currentUser?"medstudy:calendar-notifications:"+currentUser.id:null}
function websiteUsageKey(){return currentUser?"medstudy:website-usage:"+currentUser.id:null}
function classPhoneAlertsKey(){return currentUser?"medstudy:phone-class-alerts:"+currentUser.id:null}
function sentClassPhoneAlertsKey(){return currentUser?"medstudy:sent-phone-class-alerts:"+currentUser.id:null}
function weekdayIndex(date=new Date()){const index=(date.getDay()+6)%7;return index>4?0:index}
function dayNumber(date=new Date()){const day=date.getDay();return day===0?7:day}
function localDateKey(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`}
function formatTime(value){
  if(!value)return "";
  const [hours,minutes]=value.split(":").map(Number),date=new Date();
  date.setHours(hours,minutes,0,0);
  return date.toLocaleTimeString([],{hour:"numeric",minute:"2-digit"});
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
async function recordUserActivity(eventType,page=null,activeSeconds=0){
  if(!currentUser||!db||activityLoggingUnavailable)return;
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
  if(!currentUser||!db||activityLoggingUnavailable)return;
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
function loadCalendarNotices(){
  try{
    const saved=JSON.parse(localStorage.getItem(calendarNoticeKey())||"[]");
    calendarNotifications=Array.isArray(saved)?saved.filter(item=>item&&item.id&&item.created_at&&Date.now()-new Date(item.created_at).getTime()<=NOTIFICATION_TTL_DAYS*DAY_MILLISECONDS):[];
  }catch(error){console.warn("Could not load class and exam reminders.",error);calendarNotifications=[]}
}
function saveCalendarNotices(){
  try{localStorage.setItem(calendarNoticeKey(),JSON.stringify(calendarNotifications.slice(0,100)))}
  catch(error){console.warn("Could not save class and exam reminders.",error)}
}
function featureEnabled(key){return featureSettings[key]!==false}
function allNotifications(){
  const announcements=featureEnabled("announcements")?notifications:[];
  const reminders=featureEnabled("schedule_reminders")?calendarNotifications:[];
  return [...announcements,...reminders].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
}
function showLiveNotice(title,body){
  const region=$("live-notice-region");
  region.innerHTML=`<article class="live-notice"><strong>${esc(title)}</strong><p>${esc(body)}</p></article>`;
  if(toastTimer)clearTimeout(toastTimer);
  toastTimer=setTimeout(()=>{region.innerHTML=""},8000);
}
function addCalendarNotice(id,title,body){
  if(calendarNotifications.some(item=>item.id===id))return;
  const created_at=new Date().toISOString();
  calendarNotifications.unshift({id,title,body,created_at,expires_at:new Date(Date.now()+NOTIFICATION_TTL_DAYS*DAY_MILLISECONDS).toISOString()});
  calendarNotifications=calendarNotifications.slice(0,100);
  saveCalendarNotices();renderNotifications();showLiveNotice(title,body);
}
function loadSentPhoneAlertIds(){
  try{const saved=JSON.parse(localStorage.getItem(sentClassPhoneAlertsKey())||"[]");return new Set(Array.isArray(saved)?saved.map(String):[])}
  catch(error){console.warn("Could not load sent phone alert state.",error);return new Set()}
}
async function showPhoneClassNotice(id,title,body){
  if(!featureEnabled("phone_class_notifications")||!featureEnabled("classes"))return;
  try{
    if(localStorage.getItem(classPhoneAlertsKey())!=="true"||!("Notification" in window)||Notification.permission!=="granted")return;
    const sent=loadSentPhoneAlertIds();if(sent.has(id))return;
    const options={body,tag:id,icon:"./icon-192.png",badge:"./icon-192.png"};
    if("serviceWorker" in navigator){
      const registration=await navigator.serviceWorker.ready;
      await registration.showNotification(title,options);
    }else new Notification(title,options);
    sent.add(id);localStorage.setItem(sentClassPhoneAlertsKey(),JSON.stringify([...sent].slice(-100)));
  }catch(error){console.warn("Could not send a phone class notification.",error)}
}
function updateClassNotificationControls(){
  const button=$("enable-class-phone-notifications");if(!button||!currentUser)return;
  const enabled=featureEnabled("phone_class_notifications");
  let optedIn=false;try{optedIn=localStorage.getItem(classPhoneAlertsKey())==="true"}catch(error){console.warn("Could not read phone notification preference.",error)}
  button.disabled=!enabled||!("Notification" in window);
  button.textContent=optedIn?"Disable phone class alerts":"Enable phone class alerts";
  $("class-notification-status").textContent=!enabled?"Phone alerts are disabled by the administrator."
    :!("Notification" in window)?"This browser does not support phone notifications."
    :Notification.permission==="denied"?"Notifications are blocked in browser settings."
    :optedIn?"Phone alerts are enabled for this device.":"Allow notifications to receive class start/end alerts.";
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
    const permission=Notification.permission==="granted"? "granted" : await Notification.requestPermission();
    if(permission!=="granted"){message("class-notification-status","Notification permission was not granted. Change it in your browser or phone settings.",true);return}
    const registration=await navigator.serviceWorker.ready;
    await registration.showNotification("Class alerts enabled",{body:"You will be notified when a scheduled class starts or ends.",icon:"./icon-192.png"});
    localStorage.setItem(classPhoneAlertsKey(),"true");updateClassNotificationControls();
  }catch(error){console.error("Could not enable phone class notifications.",error);message("class-notification-status","Could not enable notifications: "+error.message,true)}
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
  $("user-avatar").textContent=displayName.split(/\s+/).slice(0,2).map(part=>part.charAt(0).toUpperCase()).join("")||"S";
}
function renderNotifications(){
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
    return `<article class="notification-item${read?" is-read":""}"><div class="notification-item-heading"><h3>${esc(item.title)}</h3><time datetime="${esc(item.created_at)}">${esc(new Date(item.created_at).toLocaleString())}</time></div><p>${esc(item.body)}</p><div class="notification-item-footer"><span>Expires ${esc(new Date(item.expires_at).toLocaleDateString())}</span><button type="button" class="text-button" data-mark-notification="${esc(item.id)}" ${read?"disabled":""}>${read?"Read":"Mark as read"}</button></div></article>`;
  }).join(""):'<p class="notification-empty">You’re all caught up. New study-group announcements will appear here.</p>';
  renderAdminNotifications();
}
function renderAdminNotifications(){
  const list=$("admin-notification-list");if(!list)return;
  if(!isAdmin){list.textContent="";return}
  if(!notifications.length){list.innerHTML='<p class="muted">No current announcements.</p>';return}
  list.innerHTML=notifications.map(item=>`<article class="admin-notification-item"><div><h3>${esc(item.title)}</h3><p>${esc(item.body)}</p><span>Expires ${esc(new Date(item.expires_at).toLocaleString())}</span></div><button class="button button-light" type="button" data-delete-notification="${esc(item.id)}" aria-label="Delete announcement: ${esc(item.title)}">Delete</button></article>`).join("");
}
function renderGroupChatMessages(){
  const list=$("chat-message-list");if(!list)return;
  const wasNearBottom=list.scrollHeight-list.scrollTop-list.clientHeight<60;
  list.innerHTML=groupChatMessages.length?groupChatMessages.map(item=>{
    const mine=item.user_id===currentUser.id;
    return `<article class="chat-message${mine?" chat-message-mine":""}"><div><strong>${esc(item.display_name)}</strong><time datetime="${esc(item.created_at)}">${esc(new Date(item.created_at).toLocaleTimeString([],{hour:"numeric",minute:"2-digit"}))}</time></div><p>${esc(item.message)}</p></article>`;
  }).join(""):'<p class="chat-empty">No messages yet. Start the conversation.</p>';
  if(wasNearBottom)list.scrollTop=list.scrollHeight;
}
async function loadGroupChatMessages(){
  if(!currentUser||!featureEnabled("group_chat"))return false;
  try{
    const {data,error}=await db.from("group_chat_messages").select("id,user_id,display_name,message,created_at")
      .gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(100);
    if(error)throw error;
    groupChatMessages=(data||[]).reverse();renderGroupChatMessages();return true;
  }catch(error){
    console.error("Could not load group chat.",error);
    $("chat-message-list").textContent=error.code==="PGRST205"
      ?"Run the latest schema.sql in Supabase to enable group chat."
      :"Could not load group messages: "+error.message;
    return false;
  }
}
function openGroupChat(){
  if(!featureEnabled("group_chat"))return;
  $("group-chat-panel").classList.remove("hidden");$("chat-launch").setAttribute("aria-expanded","true");
  loadGroupChatMessages();$("chat-message-input").focus();
  if(chatRefreshTimer)clearInterval(chatRefreshTimer);
  chatRefreshTimer=setInterval(()=>{if(!$("group-chat-panel").classList.contains("hidden"))loadGroupChatMessages()},5000);
}
function closeGroupChat(){
  const panel=$("group-chat-panel");if(panel)panel.classList.add("hidden");
  if($("chat-launch"))$("chat-launch").setAttribute("aria-expanded","false");
  if(chatRefreshTimer){clearInterval(chatRefreshTimer);chatRefreshTimer=null}
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
  $("home-leaderboard").classList.toggle("hidden",!featureEnabled("leaderboards"));
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
  const {data,error}=await db.from("notifications").select("id,title,body,created_at,expires_at")
    .gt("expires_at",new Date().toISOString()).order("created_at",{ascending:false}).limit(100);
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
  $("nav-menu-toggle").setAttribute("aria-expanded","false");
  $("nav-menu-toggle").setAttribute("aria-label","Open menu");
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
  const email=$("email").value.trim(),password=$("password").value;$("auth-submit").disabled=true;
  try{
    if(authMode==="signup"){
      const {data,error}=await db.auth.signUp({email,password,options:{data:{full_name:$("full-name").value.trim()}}});if(error)throw error;
      message("auth-message",data.session?"Account created.":"Account created. Check your email to confirm, then log in.");
    }else{const {error}=await db.auth.signInWithPassword({email,password});if(error)throw error}
  }catch(err){message("auth-message",err.message,true)}finally{$("auth-submit").disabled=false}
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
  const open=!$("main-navigation").classList.contains("is-open");
  if(open){$("main-navigation").classList.add("is-open");$("nav-menu-toggle").setAttribute("aria-expanded","true");$("nav-menu-toggle").setAttribute("aria-label","Close menu")}
  else closeNavigation();
});
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
    $("chat-message-input").value="";message("chat-message-status","");await loadGroupChatMessages();$("chat-message-input").focus();
  }catch(error){message("chat-message-status","Could not send message: "+error.message,true)}
  finally{button.disabled=false}
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
document.addEventListener("click",event=>{
  if(!event.target.closest(".notification-wrap"))closeNotificationPanel();
  if(!event.target.closest("#main-navigation")&&!event.target.closest("#nav-menu-toggle"))closeNavigation();
});
document.addEventListener("keydown",event=>{
  if(event.key==="Escape"){closeNavigation();closeNotificationPanel();closeGroupChat()}
});
function showPage(page){
  if(page==="admin"&&!isAdmin){showPage("home");return}
  if((page==="quizzes"&&!featureEnabled("quizzes"))||(page==="resources"&&!featureEnabled("resources"))||
    (page==="classes"&&!featureEnabled("classes")&&!featureEnabled("exams"))||
    (page==="progress"&&!featureEnabled("leaderboards")&&!featureEnabled("practice_scores"))){showPage("home");return}
  if(page!=="home")closeGroupChat();
  closeNavigation();
  document.querySelectorAll(".page").forEach(p=>p.classList.add("hidden"));$("page-"+page).classList.remove("hidden");
  void recordUserActivity("page_view",page);
  saveLastPage(page);
  document.querySelectorAll(".nav-link").forEach(n=>{
    const active=n.dataset.page===page;n.classList.toggle("active",active);
    if(active)n.setAttribute("aria-current","page");else n.removeAttribute("aria-current");
  });
  if(page==="progress"){loadAttempts();if(featureEnabled("leaderboards"))renderLeaderboard()}
  if(page==="home"&&featureEnabled("leaderboards"))renderHomeLeaderboard();
  if(page==="classes")loadClassAndExamData();
  if(page==="quizzes")renderQuizzes();if(page==="resources")renderResources();if(page==="profile")loadProfile();if(page==="admin")loadAdmin();
}
function signedOut(){
  if(liveNoticeTimer){clearInterval(liveNoticeTimer);liveNoticeTimer=null}
  if(usageTimer){recordWebsiteUsage(true);clearInterval(usageTimer);usageTimer=null}
  activityPendingSeconds=0;activityLoggingUnavailable=false;
  adminUserRows=[];adminUserPage=1;adminUsersHaveMore=false;
  $("admin-user-list").textContent="User accounts have not been loaded yet.";
  $("admin-user-count").textContent="";$("admin-user-message").textContent="";
  $("admin-user-activity").classList.add("hidden");$("admin-user-activity-content").textContent="";
  closeGroupChat();currentUser=null;isAdmin=false;notifications=[];calendarNotifications=[];groupChatMessages=[];notificationReadIds=new Set();setProfileIdentity("Student");
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
  currentUser=user;
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
  courseSelects();await checkAdmin();await loadFeatureSettings();
  await Promise.all([loadContent(),loadAttempts(),loadProfile(),loadNotifications(),loadClassAndExamData()]);
  startUsageTracking();startScheduleNotifications();updateClassNotificationControls();showPage(getLastPage());
}
$("profile-shortcut").addEventListener("click",()=>showPage("profile"));
async function checkAdmin(){const {data,error}=await db.rpc("is_current_user_admin");isAdmin=!error&&data===true;$("admin-nav").classList.toggle("hidden",!isAdmin)}
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
  else usageLastTick=Date.now();
});
function renderBulkQuizRows(){
  $("bulk-quiz-grid").innerHTML=COURSES.map(course=>`<fieldset class="bulk-quiz-course" data-course="${esc(course)}"><legend>${esc(course)}</legend><label class="bulk-course-label"><input type="checkbox" class="bulk-course-toggle"> Include in this batch</label>
    <label>Quiz title<input class="bulk-course-input" data-field="title" maxlength="140" required disabled></label>
    <label>Google Forms responder URL<input class="bulk-course-input" data-field="url" type="url" placeholder="https://docs.google.com/forms/..." required disabled></label>
    <label>Google Form ID (optional)<input class="bulk-course-input" data-field="form-id" disabled></label></fieldset>`).join("");
  document.querySelectorAll(".bulk-course-toggle").forEach(toggle=>toggle.addEventListener("change",()=>{
    toggle.closest(".bulk-quiz-course").querySelectorAll(".bulk-course-input").forEach(input=>{input.disabled=!toggle.checked});
  }));
}
renderBulkQuizRows();
async function loadContent(){
  const [q,r]=await Promise.all([db.from("quizzes").select("*").eq("is_published",true).order("created_at",{ascending:false}),db.from("resources").select("*").eq("is_published",true).order("created_at",{ascending:false})]);
  if(q.error||r.error){console.error(q.error||r.error);return}quizzes=q.data||[];resources=r.data||[];renderQuizzes();renderResources();renderCourses();
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
  $("timetable-date").textContent=selectedDate.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
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
      <p>Starts ${esc(new Date(exam.starts_at).toLocaleString())}</p><p>Ends ${esc(new Date(exam.ends_at).toLocaleString())}</p></div>
  </article>`).join(""):'<p class="muted">No upcoming exams have been scheduled.</p>';
}
function startScheduleNotifications(){
  if(liveNoticeTimer)clearInterval(liveNoticeTimer);
  const check=()=>{
    if(!currentUser)return;
    const now=new Date(),today=localDateKey(now),minuteOfDay=now.getHours()*60+now.getMinutes();
    const showInApp=featureEnabled("schedule_reminders"),showClassInApp=showInApp&&featureEnabled("classes");
    const showPhone=phoneClassAlertsEnabled()&&featureEnabled("classes");
    if(showClassInApp||showPhone){
      for(const session of classSessions){
        if(Number(session.day_of_week)!==dayNumber(now))continue;
        const start=session.start_time.split(":").map(Number),end=session.end_time.split(":").map(Number);
        const startMinute=start[0]*60+start[1],endMinute=end[0]*60+end[1];
        const startId=`class-${session.id}-${today}-start`,endId=`class-${session.id}-${today}-end`;
        if(Math.abs(minuteOfDay-startMinute)<1){
          const title=`${session.course} class has started`,body=`${session.title} with ${session.lecturer} is now in session.`;
          if(showClassInApp)addCalendarNotice(startId,title,body);
          if(showPhone)showPhoneClassNotice(startId,title,body);
        }
        if(Math.abs(minuteOfDay-endMinute)<1){
          const title=`${session.course} class has ended`,body=`${session.title} with ${session.lecturer} has finished.`;
          if(showClassInApp)addCalendarNotice(endId,title,body);
          if(showPhone)showPhoneClassNotice(endId,title,body);
        }
      }
    }
    if(showInApp&&featureEnabled("exams"))for(const exam of mbExams){
      const start=new Date(exam.starts_at),days=Math.round((new Date(start.getFullYear(),start.getMonth(),start.getDate())-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/DAY_MILLISECONDS);
      const reminderDays=[30,7,1];
      if(reminderDays.includes(days)){
        addCalendarNotice(`exam-${exam.id}-${days}d-${today}`,`${exam.exam_name} is ${days===30?"one month":days===7?"one week":"one day"} away`,`${exam.course} ${exam.exam_type} starts ${start.toLocaleString()}.`);
      }
    }
  };
  check();liveNoticeTimer=setInterval(()=>{check();if(scheduleDataLoaded){renderTimetable();renderExams()}},15000);
}
async function renderHomeLeaderboard(){
  const box=$("home-leaderboard-content");if(!box||!currentUser)return;
  try{
    const rows=(await getView("overall_leaderboard")).sort((a,b)=>b.average_percentage-a.average_percentage);
    const rank=rows.findIndex(row=>row.user_id===currentUser.id);
    $("home-leaderboard-rank").innerHTML=rank>=0?`${medal(rank+1)} <span>${rank+1}</span>`:"—";
    $("home-leaderboard-label").textContent=rank>=0?"Your overall rank":"Opt in and record 3 verified scores to rank";
    box.innerHTML=rows.length?rows.slice(0,3).map((row,index)=>`<div class="home-leader-row"><span class="medal">${medal(index+1)}</span><strong>${esc(row.display_name)}${row.user_id===currentUser.id?" (you)":""}</strong><span>${Number(row.average_percentage).toFixed(1)}%</span></div>`).join(""):'<p class="muted">No ranked students yet. Opt in from My profile and add verified scores to appear.</p>';
  }catch(error){box.innerHTML=`<p class="muted">Could not load leaderboard: ${esc(error.message)}</p>`}
}
function medal(rank){return rank===1?"🥇":rank===2?"🥈":rank===3?"🥉":String(rank)}
function renderQuizzes(){
  const c=$("quiz-course-filter").value||"all",rows=quizzes.filter(q=>c==="all"||q.course===c);
  $("quiz-list").innerHTML=rows.length?rows.map(q=>`<article class="content-card"><span class="tag">${esc(q.course)} • ${esc(q.difficulty||"Practice")}</span><h3>${esc(q.title)}</h3><p>${esc(q.description||"Open the quiz to begin.")}</p><a class="button button-primary" href="${esc(q.google_form_url)}" target="_blank" rel="noopener noreferrer">Open Google Form ↗</a></article>`).join(""):'<p class="panel">No published quizzes yet.</p>';
}
$("quiz-course-filter").onchange=renderQuizzes;
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
  $("resource-list").innerHTML='<p class="muted">Loading study materials…</p>';
  const entries=await Promise.all(rows.map(async resource=>{
    const link=await getResourceLink(resource);return {resource,...link};
  }));
  if(requestId!==resourceRenderId)return;
  const visibleCourses=c==="all"?COURSES:[c];
  const card=entry=>{
    const r=entry.resource,link=entry.url&&safeUrl(entry.url)?`<a class="button button-outline" href="${esc(entry.url)}" target="_blank" rel="noopener noreferrer">${r.storage_path?"Download document ↗":r.resource_type==="video"?"Watch video ↗":"Open resource ↗"}</a>`:`<p class="message error">Could not load this document: ${esc(entry.error||"Invalid resource URL")}</p>`;
    return `<article class="content-card"><span class="tag">${esc(r.resource_type)}</span><h4>${esc(r.title)}</h4><p>${esc(r.description||"")}</p>${link}</article>`;
  };
  $("resource-list").innerHTML=visibleCourses.map(course=>{
    const courseRows=entries.filter(entry=>entry.resource.course===course);
    const notes=courseRows.filter(entry=>entry.resource.resource_type!=="video");
    const videos=courseRows.filter(entry=>entry.resource.resource_type==="video");
    const showNotes=t!=="video",showVideos=t==="all"||t==="video";
    return `<section class="course-resource-section"><h2>${esc(course)}</h2><div class="course-resource-columns">
      ${showNotes?`<div class="resource-group"><h3>Notes &amp; documents</h3><div class="resource-group-cards">${notes.length?notes.map(card).join(""):'<p class="muted">No notes or documents yet.</p>'}</div></div>`:""}
      ${showVideos?`<div class="resource-group"><h3>Videos</h3><div class="resource-group-cards">${videos.length?videos.map(card).join(""):'<p class="muted">No videos yet.</p>'}</div></div>`:""}
    </div></section>`;
  }).join("");
}
$("resource-course-filter").onchange=renderResources;$("resource-type-filter").onchange=renderResources;

$("score-form").addEventListener("submit",async e=>{
  e.preventDefault();const score=Number($("score-earned").value),total=Number($("score-total").value);
  if(total<=0||score<0||score>total){message("score-message","Enter a valid score; earned marks cannot exceed total marks.",true);return}
  const {error}=await db.from("quiz_attempts").insert({user_id:currentUser.id,course:$("score-course").value,quiz_title:$("score-title").value.trim(),score,total_marks:total,is_verified:false,source:"manual"});
  if(error){message("score-message",error.message,true);return}
  $("score-form").reset();message("score-message","Saved to your private record. This manually entered score is not included in official rankings.");await loadAttempts();
});
async function loadAttempts(){
  if(!currentUser)return;const {data,error}=await db.from("quiz_attempts").select("*").order("created_at",{ascending:false});
  if(error){console.error(error);return}attempts=data||[];renderPersonalStats();
}
function renderPersonalStats(){
  const n=attempts.length,avg=n?attempts.reduce((s,a)=>s+100*Number(a.score)/Number(a.total_marks),0)/n:0;
  const verified=attempts.filter(a=>a.is_verified).length;
  $("stats-grid").innerHTML=`<div class="stat"><strong>${n}</strong><span>Personal quizzes recorded</span></div><div class="stat"><strong>${avg.toFixed(1)}%</strong><span>Personal average</span></div><div class="stat"><strong>${verified}</strong><span>Verified scores</span></div><div class="stat"><strong id="website-usage-total">${esc(formatDuration(loadWebsiteUsage()))}</strong><span>Time on this device</span></div>`;
  $("results-body").innerHTML=n?attempts.map(a=>`<tr><td>${new Date(a.created_at).toLocaleDateString()}</td><td>${esc(a.course)}</td><td>${esc(a.quiz_title)}</td><td>${Number(a.score)} / ${Number(a.total_marks)} (${(100*Number(a.score)/Number(a.total_marks)).toFixed(1)}%)</td><td><span class="status-pill ${a.is_verified?"status-published":"status-draft"}">${a.is_verified?"Verified":"Private / unverified"}</span></td></tr>`).join(""):'<tr><td colspan="5">No results recorded yet.</td></tr>';
  renderChart();renderAchievements();
}
function renderChart(){
  const ctx=$("performance-chart");if(chart)chart.destroy();
  const dayKeys=[...new Set(attempts.map(a=>new Date(a.created_at).toISOString().slice(0,10)))].sort();
  const labels=dayKeys.map(day=>new Date(day+"T00:00:00").toLocaleDateString());
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
function renderAchievements(){
  const verified=attempts.filter(a=>a.is_verified),allAvg=verified.length?verified.reduce((s,a)=>s+100*a.score/a.total_marks,0)/verified.length:0;
  const items=[
    ["First steps",attempts.length>=1,"Record your first practice result."],
    ["Practice streak",attempts.length>=5,"Record five or more quiz attempts."],
    ["Well-rounded learner",new Set(attempts.map(a=>a.course)).size===5,"Practise across all five courses."],
    ["Verified high performer",verified.length>=3&&allAvg>=80,"Average at least 80% across three verified scores."]
  ];
  $("achievement-list").innerHTML=items.map(([name,earned,desc])=>`<div class="achievement ${earned?"earned":""}"><strong>${earned?"🏅":"🔒"} ${name}</strong><p>${desc}</p><span>${earned?"Unlocked":"In progress"}</span></div>`).join("");
}
async function loadProfile(){
  const {data,error}=await db.from("profiles").select("display_name,leaderboard_opt_in,full_name,theme_color,class_name,favorite_subject,quiz_rank").eq("id",currentUser.id).single();
  if(error){console.error(error);message("profile-message","Could not load profile settings: "+error.message,true);return}
  const themeColor=data.theme_color||DEFAULT_THEME_COLOR;
  if(!applyThemeColor(themeColor)){message("profile-message","Your saved website colour is invalid. Choose a new colour and save your profile.",true);return}
  const displayName=data.display_name||data.full_name||"Student";
  $("display-name").value=displayName;$("class-name").value=data.class_name||"";$("favorite-subject").value=data.favorite_subject||"";$("quiz-rank").value=data.quiz_rank||"";
  $("leaderboard-opt-in").checked=!!data.leaderboard_opt_in;$("theme-color").value=themeColor;setProfileIdentity(displayName);
  $("home-display-name").textContent=displayName;$("home-class-name").textContent=data.class_name||"Class / year not set";
}
function applyThemeColor(color){
  if(!/^#[0-9a-f]{6}$/i.test(color))return false;
  const root=document.documentElement,channels=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  const mix=(accentRatio,base)=>"#"+channels.map(c=>Math.round(c*accentRatio+base*(1-accentRatio)).toString(16).padStart(2,"0")).join("");
  root.style.setProperty("--teal",color);
  root.style.setProperty("--teal-dark",mix(.78,0));
  root.style.setProperty("--mint",mix(.1,255));
  root.style.setProperty("--theme-soft",mix(.11,255));
  root.style.setProperty("--theme-softer",mix(.04,255));
  root.style.setProperty("--theme-border",mix(.15,255));
  root.style.setProperty("--theme-notice",mix(.07,255));
  root.style.setProperty("--theme-notice-border",mix(.2,255));
  root.style.setProperty("--theme-notice-text",mix(.78,0));
  root.style.setProperty("--theme-outline-border",mix(.35,255));
  root.style.setProperty("--theme-focus","rgba("+channels.join(",")+",.1)");
  return true;
}
$("theme-color").addEventListener("input",e=>applyThemeColor(e.target.value));
$("reset-theme-color").addEventListener("click",()=>{$("theme-color").value=DEFAULT_THEME_COLOR;applyThemeColor(DEFAULT_THEME_COLOR)});
$("profile-form").addEventListener("submit",async e=>{
  e.preventDefault();const name=$("display-name").value.trim(),themeColor=$("theme-color").value;if(!name){message("profile-message","Please enter a display name.",true);return}
  if(!applyThemeColor(themeColor)){message("profile-message","Choose a valid website colour.",true);return}
  const {error}=await db.from("profiles").update({
    display_name:name,class_name:$("class-name").value.trim()||null,favorite_subject:$("favorite-subject").value||null,
    quiz_rank:$("quiz-rank").value.trim()||null,leaderboard_opt_in:$("leaderboard-opt-in").checked,theme_color:themeColor
  }).eq("id",currentUser.id);
  message("profile-message",error?error.message:"Profile saved.",!!error);if(!error){
    setProfileIdentity(name);$("home-display-name").textContent=name;
    $("home-class-name").textContent=$("class-name").value.trim()||"Class / year not set";
    renderLeaderboard();renderHomeLeaderboard()
  }
});
async function sendPasswordReset(){
  const {error}=await db.auth.resetPasswordForEmail(currentUser.email,{redirectTo:location.origin+location.pathname});
  message("security-message",error?error.message:"If the address is registered, a password-reset link has been sent.",!!error);
}
$("profile-reset-password").onclick=sendPasswordReset;
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
  if(!rows.length)return '<p class="muted">No eligible opted-in students yet. Verified attempts are required for official rankings.</p>';
  return `<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Student</th><th>Average / change</th><th>Quizzes</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td><span class="rank-medal" aria-label="Rank ${i+1}">${medal(i+1)}</span></td><td>${esc(r.display_name)}${r.user_id===currentUser.id?' <b>(you)</b>':""}</td><td>${Number(r[scoreKey]||0).toFixed(1)}%</td><td>${r.quiz_count??r.current_quiz_count??"—"}</td></tr>`).join("")}</tbody></table></div>`;
}
async function renderLeaderboard(){
  const box=$("leaderboard-content");box.innerHTML='<p class="muted">Loading…</p>';
  try{
    if(activeBoard==="overall")box.innerHTML=rankingTable((await getView("overall_leaderboard")).sort((a,b)=>b.average_percentage-a.average_percentage));
    if(activeBoard==="courses"){
      const rows=await getView("course_leaderboard");
      box.innerHTML=COURSES.map(c=>{const group=rows.filter(r=>r.course===c).sort((a,b)=>b.average_percentage-a.average_percentage);return `<div class="course-board"><h3>${esc(c)}</h3>${group.length?`<ol>${group.map((r,index)=>`<li><span class="rank-medal" aria-label="Rank ${index+1}">${medal(index+1)}</span> ${esc(r.display_name)} — <strong>${Number(r.average_percentage).toFixed(1)}%</strong> (${r.quiz_count} quizzes)</li>`).join("")}</ol>`:'<p class="muted">No qualifying scores.</p>'}</div>`}).join("");
    }
    if(activeBoard==="weekly")box.innerHTML=rankingTable((await getView("weekly_leaderboard")).sort((a,b)=>b.average_percentage-a.average_percentage));
    if(activeBoard==="improved"){
      const rows=(await getView("most_improved_leaderboard")).sort((a,b)=>b.improvement_percentage_points-a.improvement_percentage_points);
      box.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Rank</th><th>Student</th><th>Previous avg.</th><th>Current avg.</th><th>Improvement</th></tr></thead><tbody>${rows.map((r,index)=>`<tr><td><span class="rank-medal" aria-label="Rank ${index+1}">${medal(index+1)}</span></td><td>${esc(r.display_name)}</td><td>${Number(r.previous_average).toFixed(1)}%</td><td>${Number(r.current_average).toFixed(1)}%</td><td>+${Number(r.improvement_percentage_points).toFixed(1)} points</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">Not enough verified results in both seven-day periods yet.</p>';
    }
    if(activeBoard==="activity"){
      const rows=await getView("recent_group_activity");
      box.innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>Student</th><th>Course</th><th>Quiz</th><th>Result</th><th>Date</th></tr></thead><tbody>${rows.sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,20).map(r=>`<tr><td>${esc(r.display_name)}</td><td>${esc(r.course)}</td><td>${esc(r.quiz_title)}</td><td>${Number(r.percentage).toFixed(1)}%</td><td>${new Date(r.created_at).toLocaleDateString()}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">No recent verified activity.</p>';
    }
  }catch(err){box.innerHTML=`<p class="muted">Could not load rankings: ${esc(err.message)}</p>`}
}
const ADMIN_USER_PAGE_SIZE=50;
function renderAdminUsers(){
  const search=$("admin-user-search").value.trim().toLowerCase();
  const rows=adminUserRows.filter(user=>!search||`${user.display_name} ${user.email}`.toLowerCase().includes(search));
  if(!adminUserRows.length){$("admin-user-list").innerHTML='<p class="muted">No accounts found.</p>';return}
  if(!rows.length){$("admin-user-list").innerHTML='<p class="muted">No loaded users match that search. Load more users to search the next page.</p>';return}
  $("admin-user-list").innerHTML=`<div class="table-wrap"><table class="admin-users-table"><thead><tr><th>User</th><th>Email</th><th>Class / year</th><th>Account status</th><th>Last sign-in</th><th>Last website activity</th><th>Actions</th></tr></thead><tbody>${rows.map(user=>{
    const banned=user.banned_until&&new Date(user.banned_until)>new Date();
    const status=banned?`Banned until ${esc(new Date(user.banned_until).toLocaleDateString())}`:user.email_confirmed_at?"Active":"Invitation pending";
    const lastSignIn=user.last_sign_in_at?new Date(user.last_sign_in_at).toLocaleString():"Never";
    const lastActivity=user.last_activity_at?new Date(user.last_activity_at).toLocaleString():"No activity recorded";
    const actions=`<button class="button button-outline" type="button" data-user-activity="${esc(user.id)}">Activity</button>${user.is_admin?'<span class="status-pill status-published">Admin protected</span>':`<button class="button button-light" type="button" data-user-ban="${esc(user.id)}" data-banned="${banned}">${banned?"Restore access":"Ban access"}</button><button class="button button-danger" type="button" data-user-delete="${esc(user.id)}">Delete</button>`}`;
    return `<tr><td>${esc(user.display_name||"Student")}</td><td>${esc(user.email)}</td><td>${esc(user.class_name||"—")}</td><td>${esc(status)}</td><td>${esc(lastSignIn)}</td><td>${esc(lastActivity)}</td><td><div class="admin-actions">${actions}</div></td></tr>`;
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
    const pageRows=(data.users||[]).map(user=>({...user,last_activity_at:activityByUser.get(user.id)||null}));
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
  const eventTable=events.length?`<h4>Sign-ins and page visits</h4><div class="table-wrap"><table><thead><tr><th>When</th><th>Activity</th><th>Page</th></tr></thead><tbody>${events.map(item=>`<tr><td>${esc(new Date(item.created_at).toLocaleString())}</td><td>${esc(labels[item.event_type]||item.event_type)}</td><td>${esc(item.page||"—")}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">No sign-in or page activity has been recorded yet.</p>';
  const dailyTable=daily.length?`<h4>Active time by day (last 30 days)</h4><div class="table-wrap"><table><thead><tr><th>Date</th><th>Active time</th><th>Last active</th><th>Last page</th></tr></thead><tbody>${daily.map(item=>`<tr><td>${esc(new Date(item.activity_date+"T00:00:00").toLocaleDateString())}</td><td>${esc(formatDuration(Number(item.active_seconds)*1000))}</td><td>${esc(new Date(item.last_active_at).toLocaleString())}</td><td>${esc(item.last_page||"—")}</td></tr>`).join("")}</tbody></table></div>`:'<p class="muted">No visible active time has been recorded in the last 30 days.</p>';
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
  $("admin-stats").innerHTML=`<div class="stat"><strong>${data.quiz_count}</strong><span>Quizzes</span></div><div class="stat"><strong>${data.resource_count}</strong><span>Resources</span></div><div class="stat"><strong>${data.attempt_count}</strong><span>Recorded attempts</span></div><div class="stat"><strong>${data.student_count}</strong><span>Registered students</span></div>`;
  await Promise.all([loadAdminLists(),loadAdminSchedules(),loadAdminUsers()]);
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
  $("admin-exam-list").innerHTML=mbExams.length?mbExams.map(item=>`<article class="admin-item"><div><h3>${esc(item.exam_name)} <span class="status-pill status-published">${esc(item.exam_type)}</span></h3><p>${esc(item.course)} • ${esc(new Date(item.starts_at).toLocaleString())} to ${esc(new Date(item.ends_at).toLocaleString())}</p></div><div class="admin-actions"><button class="button button-outline" type="button" data-schedule-edit="exam" data-id="${item.id}">Edit</button><button class="button button-light" type="button" data-schedule-delete="exam" data-id="${item.id}">Delete</button></div></article>`).join(""):'<p class="muted">No exams have been added.</p>';
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
function clearAdminForm(type){
  const quiz=type==="quiz";$(quiz?"admin-quiz-form":"admin-resource-form").reset();$(quiz?"admin-quiz-id":"admin-resource-id").value="";
  $(quiz?"admin-quiz-heading":"admin-resource-heading").textContent=quiz?"Add a quiz":"Add a resource";
  if(!quiz)$("admin-resource-file-help").textContent="PDF, Word, PowerPoint or text documents up to 50 MB. Videos should be added as links.";
}
$("admin-quiz-form").onsubmit=async e=>{
  e.preventDefault();if(!isAdmin)return;const id=$("admin-quiz-id").value,url=$("admin-quiz-url").value.trim();
  if(!safeUrl(url)){message("admin-quiz-message","Enter a valid http/https URL.",true);return}
  const row={course:$("admin-quiz-course").value,title:$("admin-quiz-title").value.trim(),description:$("admin-quiz-description").value.trim(),difficulty:$("admin-quiz-difficulty").value,google_form_url:url,google_form_id:$("admin-quiz-form-id").value.trim()||null,is_published:$("admin-quiz-published").checked};
  const res=id?await db.from("quizzes").update(row).eq("id",id):await db.from("quizzes").insert(row);
  message("admin-quiz-message",res.error?res.error.message:"Quiz saved.",!!res.error);if(!res.error){clearAdminForm("quiz");await loadAdminLists();await loadContent()}
};
$("admin-quiz-bulk-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!isAdmin)return;
  const selected=[...document.querySelectorAll(".bulk-quiz-course")].filter(row=>row.querySelector(".bulk-course-toggle").checked);
  if(!selected.length){message("bulk-quiz-message","Select at least one course.",true);return}
  const rows=selected.map(row=>({
    course:row.dataset.course,title:row.querySelector('[data-field="title"]').value.trim(),description:null,
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
  const id=$("admin-resource-id").value,urlInput=$("admin-resource-url").value.trim(),file=$("admin-resource-file").files[0]||null;
  const existing=id?adminResources.find(item=>String(item.id)===id):null,type=$("admin-resource-type").value;
  if(type==="video"&&(file||(existing?.storage_path&&!urlInput))){message("admin-resource-message","Video resources must be added as a video URL.",true);return}
  if(file){
    const extension=(file.name.split(".").pop()||"").toLowerCase();
    if(!DOCUMENT_TYPES[extension]||file.size===0||file.size>50*1024*1024){message("admin-resource-message","Choose a non-empty PDF, Word, PowerPoint or text document no larger than 50 MB.",true);return}
  }
  if(!file&&urlInput&&!safeUrl(urlInput)){message("admin-resource-message","Enter a valid http/https URL.",true);return}
  if(!file&&!urlInput&&!existing?.storage_path){message("admin-resource-message","Enter a resource URL or choose a document to upload.",true);return}
  const oldStoragePath=existing?.storage_path||null;
  let storagePath=oldStoragePath&&!urlInput?oldStoragePath:null,uploadedPath=null;
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
      resource_type:type,url:storagePath?null:urlInput||null,storage_path:storagePath,is_published:$("admin-resource-published").checked
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
    if(quiz){$("admin-quiz-id").value=row.id;$("admin-quiz-course").value=row.course;$("admin-quiz-title").value=row.title;$("admin-quiz-description").value=row.description||"";$("admin-quiz-difficulty").value=row.difficulty||"Practice";$("admin-quiz-url").value=row.google_form_url;$("admin-quiz-form-id").value=row.google_form_id||"";$("admin-quiz-published").checked=row.is_published;$("admin-quiz-heading").textContent="Edit quiz";$("admin-quiz-form").scrollIntoView({behavior:"smooth"})}
    else{$("admin-resource-id").value=row.id;$("admin-resource-course").value=row.course;$("admin-resource-title").value=row.title;$("admin-resource-description").value=row.description||"";$("admin-resource-type").value=row.resource_type;$("admin-resource-url").value=row.url||"";$("admin-resource-file-help").textContent=row.storage_path?`Current document: ${row.storage_path.split("/").pop()}. Leave empty to keep it, or select a replacement.`:"PDF, Word, PowerPoint or text documents up to 50 MB. Videos should be added as links.";$("admin-resource-published").checked=row.is_published;$("admin-resource-heading").textContent="Edit resource";$("admin-resource-form").scrollIntoView({behavior:"smooth"})}
  }
  if(toggle){const type=toggle.dataset.toggle,table=type==="quiz"?"quizzes":"resources",rows=type==="quiz"?adminQuizzes:adminResources,row=rows.find(x=>String(x.id)===toggle.dataset.id);if(!row)return;
    const {error}=await db.from(table).update({is_published:!row.is_published}).eq("id",row.id);if(error)alert(error.message);else{await loadAdminLists();await loadContent()}}
  if(del){const type=del.dataset.delete,table=type==="quiz"?"quizzes":"resources",row=(type==="quiz"?adminQuizzes:adminResources).find(x=>String(x.id)===del.dataset.id);if(!confirm("Delete this item permanently?"))return;const {error}=await db.from(table).delete().eq("id",del.dataset.id);if(error)alert(error.message);else{
    if(type==="resource"&&row?.storage_path){const cleanup=await removeUploadedDocument(row.storage_path);if(cleanup.error)alert("Resource deleted, but its uploaded document could not be removed: "+cleanup.error.message)}
    await loadAdminLists();await loadContent()
  }}
});
async function init(){
  if("serviceWorker" in navigator){
    navigator.serviceWorker.register("./service-worker.js").catch(error=>console.warn("Could not register the app service worker.",error));
  }
  if(!configured){message("auth-message","Setup needed: connect Supabase using the README instructions.");return}
  if(!db){message("auth-message","The Supabase client could not load. Connect to the internet and refresh to access your study data.",true);return}
  const {data:{session}}=await db.auth.getSession();if(session)await signedIn(session.user);else signedOut();
  db.auth.onAuthStateChange((event,session)=>{
    if(event==="PASSWORD_RECOVERY"){
      $("auth-view").classList.remove("hidden");$("app-view").classList.add("hidden");
      $("auth-form").classList.add("hidden");$("forgot-password").classList.add("hidden");
      $("password-update-form").classList.remove("hidden");
    }else if(event==="INITIAL_SESSION"){
      if(session&&!currentUser)signedIn(session.user);
      else if(!session&&currentUser)signedOut();
    }else if(event==="SIGNED_IN"&&session&&currentUser?.id!==session.user.id){
      $("password-update-form").classList.add("hidden");$("auth-form").classList.remove("hidden");$("forgot-password").classList.remove("hidden");
      signedIn(session.user);
    }else if(event==="USER_UPDATED"&&session&&currentUser?.id===session.user.id&&
      currentUser.user_metadata?.requires_password_setup&&!session.user.user_metadata?.requires_password_setup){
      $("password-update-form").classList.add("hidden");$("auth-form").classList.remove("hidden");$("forgot-password").classList.remove("hidden");
      signedIn(session.user);
    }else if(event==="SIGNED_OUT")signedOut();
  });
  setInterval(()=>{if(currentUser&&!$("page-progress").classList.contains("hidden"))renderLeaderboard()},45000);
}
init();