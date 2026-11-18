 # MedStudy Hub — Complete project package

This is the main MedStudy Hub website. It contains the student experience and the administrator dashboard in one website and uses one Supabase project/database.

## What is included

### Student area
- Email/password registration and login.
- Five courses: Biochemistry, Histology, Physiology, Embryology and Gross Anatomy.
- Google Forms quiz links.
- Notes, textbook/reference and YouTube resource library.
- Personal results history and course performance chart.
- Practice-score entry for private tracking.
- Achievements based on practice activity.
- Overall, course, weekly, most-improved and recent-activity leaderboards.
- Display name and leaderboard opt-in controls.
- Per-account website accent colour selection.
- Personal class/year, favourite subject and optional quiz-rank details.
- A top-bar profile shortcut with display name and initials.
- Responsive phone navigation with an animated slide-out menu.
- An in-app notification centre for group announcements.
- Floating home-page group chat with shared messages automatically hidden after seven days and purged weekly.
- Admin dashboard organized into collapsible management sections.
- Admin user directory for email invitations, bans/restores, protected account deletion and recent activity timelines.
- Admin activity view for sign-ins, pages visited and approximate visible active time; typed content and chat messages are not collected.
- Admin switches for classes, exams, chat, quizzes, resources, leaderboards, manual scores, announcements and schedule/phone alerts.
- Optional native phone notifications for class start/end, with per-device permission and opt-in.
- A Monday–Friday class timetable with lecturer and live class status.
- Admin-managed MB exam periods with Viva, MCQ or Theory type and countdown reminders.
- Class start/end and 30-day, 7-day and 1-day exam reminders in the in-app notification centre.
- Home dashboard profile card and medal-ranked top-three leaderboard.
- Active website time in Results & Progress (stored per account on the current device).
- Installable Progressive Web App (PWA) with a cached app shell.
- Resume the last visited section for up to 30 minutes.
- Automatically sign out of this browser after 24 hours; a fresh login is required.
- Password-reset email flow and account deletion flow.

### Administrator area
- Protected admin-only dashboard.
- Add, edit, publish/unpublish and delete quiz links.
- Create separate quizzes for several courses in one batch.
- Add resources by URL or upload documents from the device.
- Send and remove announcements for all signed-in users.
- Organize course resources into separate notes/documents and videos sections.
- Private Supabase Storage bucket and policies for uploaded study documents.
- Admin overview counts.
- Google Form ID field to help configure verified score import.

### Verified score import
The package includes:
- `google-apps-script/MedStudy_Form_Score_Import.gs`
- `supabase/functions/import-google-form-score/index.ts`

The Google Apps Script sends scored form submissions to a Supabase Edge Function. The Edge Function checks a shared secret, matches the respondent email to a MedStudy Hub account, and inserts a verified score. The service-role key stays on the server.

**Important:** You must configure and deploy the Google Apps Script and Edge Function for this integration to work. A Google Form must be configured as a quiz, have points assigned, and collect respondent email addresses. Manual score entries remain private and are excluded from official group rankings.

---

# STEP-BY-STEP SETUP

## Part 1 — Create one Supabase project

1. Visit [https://supabase.com](https://supabase.com) and create an account.
2. Create one new project. Give it a name such as `MedStudy-Hub`.
3. Save the database password somewhere safe.
4. Wait until the project has finished provisioning.
5. In the project dashboard, open **SQL Editor** → **New query**.
6. Open the supplied `schema.sql`, copy the entire file, paste it into the SQL Editor and click **Run**.
7. Confirm that the query completes without an error.

If you previously used an earlier MedStudy Hub database, back it up first, then run this updated `schema.sql` in the SQL Editor. It adds the profile fields, resource storage path, private document bucket, admin-controlled notifications, class timetable, MB exam, feature settings, group-chat and user-activity tables, plus weekly chat cleanup, while keeping existing quiz/resource/attempt rows. Review any custom policies you previously created.

## Part 2 — Configure the website

1. Extract the ZIP file on your computer.
2. Open the `MedStudy_Hub_Final` folder in Visual Studio Code.
3. Open `app.js`.
4. Find these two lines near the top:

   ```js
   const SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
   const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_PUBLIC_KEY";
   ```

5. In Supabase, open **Project Settings** → **API** (or **Connect**, depending on the dashboard layout).
6. Copy the Project URL and the anon/public/publishable key.
7. Paste them into the two lines in `app.js`. Do not paste a `service_role` or secret key here.
8. Save the file.

## Part 3 — Configure Supabase authentication

1. In Supabase, open **Authentication** → **Providers** and make sure Email is enabled.
2. Choose whether to require email confirmation. Requiring it is recommended.
3. Open **Authentication** → **URL Configuration**.
4. During local testing, add your local development URL to the allowed redirect URLs (for example, the URL shown by VS Code Live Server).
5. Later, add your deployed website URL to the allowed redirect URLs and set it as the Site URL.
6. Password reset emails use the current site URL as their redirect destination. The returned recovery session displays a new-password form. Test the full email link flow after configuring the URL allow-list.

## Part 4 — Run the website locally

1. In VS Code, install the **Live Server** extension if you do not already have it.
2. Right-click `index.html` and choose **Open with Live Server**.
3. Create your own account using your real email address.
4. Confirm your email if confirmation is enabled.
5. Log in.
6. Test the Home, Classes / exams, Quizzes, Results & Progress, Notes & Videos and My Profile pages. Students can select and save their own website accent colour in My Profile.

Do not double-click `index.html` to open it as a `file://` page; use a local web server.

## Part 5 — Make your account the administrator

After you have registered and confirmed your own account:

1. Return to Supabase → **SQL Editor** → **New query**.
2. Replace the sample email in this query with the exact email used for your MedStudy Hub account:

   ```sql
   insert into public.admin_users (user_id)
   select id from auth.users
   where lower(email) = lower('YOUR-REGISTERED-EMAIL@example.com')
   on conflict (user_id) do nothing;
   ```

3. Run the query.
4. Log out of MedStudy Hub and log back in.
5. You should now see the **Admin dashboard** tab.
6. Open it and add a test quiz and a test resource. Leave **Publish immediately** unchecked to save as a draft, or tick it to make it visible to students.
7. Confirm that published items appear in the student Quiz Centre or Notes & Videos page.

To appoint another administrator, repeat the SQL insert using that person's registered email. Only do this for people you trust.

## Part 6 — Add Google Forms quizzes and learning materials

### Google Forms
1. Create your quiz in Google Forms.
2. If you want automatic score import, open Settings and enable **Make this a quiz**.
3. Assign points to each question and enable **Collect email addresses**.
4. Copy the responder URL.
5. In MedStudy Hub → Admin dashboard, add the course, title, description, responder URL and (optionally) the Google Form ID. To add quizzes for multiple courses in one operation, use **Create quizzes for multiple courses** and enter a separate title and form link for each selected course.
6. Publish the quiz when ready.

### Resources
1. In Admin dashboard → Add a resource, choose the course and resource type, and enter a title.
2. For a document, choose **Or upload a document** and select a PDF, Word, PowerPoint or text file up to 50 MB. For other web resources, enter its URL.
3. Videos are added as YouTube or other HTTP/HTTPS links by choosing `Video link`; video file uploads are not supported.
4. Publish the resource when ready. Students see separate Notes & Documents and Videos sections under each course.

Uploaded documents are stored in the private `study-documents` Supabase bucket; only admins can upload, and signed-in students can open published files. Only share files you own or have permission to distribute. Do not upload or distribute unauthorised textbook scans.

### Group announcements
Admins can post reading reminders, test dates and other updates from **Admin dashboard → Send a group announcement**. Active announcements appear in the notification bell for signed-in users and expire from the centre after 14 days. The centre is in-app only; it does not send push notifications or email. Admins can remove an announcement earlier.

### Study-group chat
Signed-in students can open the floating chat button on Home. Messages are shared with all signed-in users, display the sender's saved profile name, and are hidden after seven days. The database schedules a weekly purge of expired rows. Chat is plain text; do not post private or sensitive information.

### Classes and MB exams
In **Admin dashboard**, use **Set up class timetable** to add weekday classes with their course, lecture title, lecturer, and start/end times. Use **Set up MB exam periods** to add the exam name, course, Viva/MCQ/Theory type, and start/end date and time. Students see the weekday timetable, the current class status, and a countdown to each upcoming exam under **Classes / exams**.

When the portal is open, class start/end notices and exam reminders one month, one week, and one day before the exam appear as page popups and in the notification centre. Students can opt in to phone notifications for class start/end in **Classes / exams**; the browser/phone must grant notification permission. These native alerts are checked while the signed-in app is open. Delivery while the app is fully closed requires a separate Web Push service and server credentials, which are not included. In-app schedule reminders are retained in the current browser profile for up to 14 days and are not synchronized between devices.

Admins can toggle each activity in **Admin dashboard → Activity and notification controls**. Access is backed by feature settings and database policies where applicable; turning a feature off hides or blocks it for students while preserving the admin's ability to manage its content.

### Install the PWA
Deploy the site over HTTPS (or run it on localhost), then use the browser's **Install app** / **Add to Home Screen** action. The service worker caches the app shell for faster repeat loads and offline access to the shell; signing in, Supabase data, and third-party quiz/chart services still require an internet connection.

Website usage time is accumulated while the signed-in portal is open and visible, and is saved locally in the current browser profile. It is not a cross-device analytics total.

The website shows a connection notice when the browser goes offline or a Supabase request cannot reach the network. The app shell can load offline, but signing in and accessing study data still require a network connection. The 24-hour sign-out is enforced by the website in each browser profile; configure Supabase Auth session limits as well if a 24-hour limit must also be enforced for sessions used outside this website.

## Part 7 — Set up VERIFIED Google Forms score import

This is an additional integration, not an automatic consequence of adding a Google Form URL. It requires a Google Apps Script trigger and a deployed Supabase Edge Function.

### A. Deploy the Supabase Edge Function

You need the Supabase CLI installed and logged in. In a terminal, from the project folder:

1. Link this folder to your Supabase project:

   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```

2. Create a long random secret string. Keep it private. You will use the same value in Supabase and Google Apps Script.
3. Set the Edge Function secrets:

   ```bash
   supabase secrets set MEDSTUDY_SHARED_SECRET="PASTE_A_LONG_RANDOM_SECRET"
   ```

   Supabase provides the project URL and service-role key to deployed functions in its environment. Do not add either secret to browser JavaScript or commit secrets to source control.

4. Deploy the score import function:

   ```bash
   supabase functions deploy import-google-form-score --no-verify-jwt
   ```

5. Your function URL is:

   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/import-google-form-score`

### B. Connect each Google Form

For each Google Forms quiz:

1. Open the Google Form itself.
2. Open the three-dot menu or Extensions menu and choose **Apps Script** (the exact menu location can vary).
3. Open `google-apps-script/MedStudy_Form_Score_Import.gs` from this project and copy its contents into the Apps Script editor, replacing the starter code.
4. In Apps Script, open **Project Settings** → **Script Properties** → **Add script property**.
5. Add these properties:

   | Property | Value |
   |---|---|
   | `MEDSTUDY_EDGE_FUNCTION_URL` | Your deployed Edge Function URL above |
   | `MEDSTUDY_SHARED_SECRET` | The exact same long secret set in Supabase |
   | `MEDSTUDY_COURSE` | Exact course name, e.g. `Biochemistry` |
   | `MEDSTUDY_QUIZ_TITLE` | Exact quiz title shown in MedStudy Hub |

6. Save the script.
7. In the function dropdown, select `installSubmitTrigger` and click Run.
8. Approve Google's requested permissions.
9. Submit a test response using an email address that already has a MedStudy Hub account.
10. Check Supabase → Table Editor → `quiz_attempts`. The inserted row should have `is_verified = true` and `source = google_forms`.

Repeat the Apps Script setup for each separate Google Form. The Google Form respondent email must match the email on the student's MedStudy Hub account. The script imports only graded quiz responses with a non-zero total point value. If a student uses an email that does not match an account, the import will fail rather than crediting another person.

**Privacy note:** Tell students that their Google Forms respondent email is used to match their quiz score to their MedStudy Hub account. Restrict access to the Google Forms response sheet to trusted administrators.

## Part 8 — Deploy account and user-management functions

Account deletion and administrator user management use server-side Edge Functions so the service-role key is never exposed in the website. Deploy both:

1. From the project folder, run:

   ```bash
   supabase functions deploy delete-account
   supabase functions deploy admin-user-management
   ```

2. Administrators can invite users by email, ban or restore sign-in access, inspect recent activity, and permanently delete non-admin accounts from **Admin dashboard → Users and website activity**. Invitations use Supabase's configured email templates and redirect URL; invitees finish setup from the email. Banning blocks future sign-ins, though an already-open session can remain usable until its access token expires.
3. Admin deletion removes the Auth account. Database foreign-key rules then delete that user's profile, results, messages and activity records. Administrator accounts are protected from these actions.
4. The My Profile deletion button still lets each student delete their own account.
5. Test invitations, banning, restoration and deletion with disposable accounts before inviting your study group.

## Part 9 — Deploy the website for your group

You can use a static hosting provider such as Netlify, Vercel or Cloudflare Pages. Upload the contents of this project folder (the website files are `index.html`, `styles.css` and `app.js`). Add the final website URL to Supabase Authentication → URL Configuration. Supabase remains the same backend for every student and the admin.

## Privacy, security and fairness explained

- **One website, one backend:** Admin and student pages are parts of the same website and use the same Supabase project.
- **Admin access:** The admin list is stored in `admin_users`; the browser only displays the admin tab after Supabase confirms membership. Database write policies independently enforce admin-only quiz/resource management.
- **Admin activity:** Administrators can see users' email addresses, sign-in times, pages visited and approximate time while the site is visible. The activity log does not collect keystrokes, form contents or chat messages. Users are informed about this on the sign-in page; browser timing and page-close events are best-effort, not a tamper-proof audit trail.
- **Student data:** Students can read their own profile and their own attempt records. The leaderboard views expose only opted-in display names and verified academic statistics, not email addresses.
- **Uploaded documents:** The `study-documents` bucket is private. Admins can upload/manage files, while authenticated students can download documents only when linked to a published resource.
- **Leaderboard opt-in:** New profiles default to opted out. Students must choose to show their display name and verified statistics.
- **Profile details:** Class/year, favourite subject and the optional quiz-rank note stay in the student's own profile and are not included in public leaderboard views.
- **Resume state:** The last visited section is stored locally per signed-in account and expires after 30 minutes.
- **Manual scores:** Manual practice scores are unverified, visible only to the student, and excluded from shared rankings.
- **Verified scores:** The Apps Script integration sends scored quiz responses to a server-side function. The server checks a shared secret, maps the collected respondent email to a MedStudy account and writes the verified attempt. A unique response ID prevents duplicate imports.
- **Service-role key:** Never put this key in `app.js`, HTML, CSS, GitHub, or any public repository. It belongs only in trusted server-side environments.
- **Account deletion:** The delete-account Edge Function uses the authenticated user's token and deletes only that user's account.
- **User management:** The admin-user-management Edge Function verifies the signed-in user and admin membership before listing/inviting accounts or changing access. Admin accounts cannot be banned or deleted through the panel.
- **Limits:** Google Forms import depends on the Form being configured as a quiz, collecting email, having point values and having an installed Apps Script trigger. This is not a proctored examination system; it verifies the score returned by Google Forms and the email identity supplied by the Form, not the student's physical identity.
- **Charts and achievements:** Personal charts include the student's recorded attempts. Group rankings and the verified high-performer achievement use verified attempts.

## Troubleshooting

- **No Admin Dashboard tab:** Confirm the admin promotion SQL used the correct registered email, then sign out and back in.
- **No published quizzes/resources:** Check that `is_published` is ticked and the course is one of the five exact course names.
- **Password reset link fails:** Check Supabase Authentication URL Configuration and email provider settings.
- **Google score import returns 401:** Check that the Apps Script secret exactly matches `MEDSTUDY_SHARED_SECRET`.
- **Google score import returns 404:** The respondent email does not match a MedStudy Auth account.
- **Google score import says no points:** Make the Form a quiz and assign points to its questions.
- **No leaderboard entries:** Students must opt in and have at least three verified quiz attempts.
- **User management says “Failed to send a request to the Edge Function”:** Confirm the latest `schema.sql` has run, then deploy `admin-user-management` to the same Supabase project as the website: `supabase functions deploy admin-user-management --project-ref qiwqluwtmpflmekgjiob`. Check Supabase Dashboard → Edge Functions to confirm it is deployed, and verify your account is in `admin_users`.
- **Function deployment errors:** Update/install the Supabase CLI, run `supabase login`, link the project, then retry the deploy command.

## Before inviting everyone — launch checklist

- [ ] Your own account can log in.
- [ ] Your account has admin access.
- [ ] A test quiz can be created, published and opened.
- [ ] A test resource can be created, published and opened.
- [ ] A normal student account cannot see the Admin Dashboard.
- [ ] A student can only see their own personal score history.
- [ ] Display name and leaderboard opt-in work.
- [ ] Profile details save, and the top-bar profile shortcut opens My Profile.
- [ ] An admin can add/edit/delete a class and students see its day, lecturer and live status.
- [ ] An admin can add/edit/delete an exam and students see the date/time and countdown.
- [ ] Class and exam reminders appear in the notification centre.
- [ ] Students can enable/disable class phone alerts and receive a test notification.
- [ ] An offline connection notice appears on both the login screen and signed-in pages.
- [ ] A signed-in session is ended after 24 hours and requires a fresh login.
- [ ] Group chat works for multiple accounts and messages expire after seven days.
- [ ] Admin feature switches change the corresponding student features.
- [ ] The Home page shows the edited name, class/year and medal-ranked leaderboard.
- [ ] Results & Progress shows active website time on the current device.
- [ ] The site can be installed from a supported HTTPS browser.
- [ ] Results refresh shows its loading state and then completes.
- [ ] Password reset has been tested.
- [ ] Google Forms import has been tested with a test form and test account.
- [ ] Account deletion has been tested using a disposable account.
- [ ] An admin can invite, ban, restore, inspect activity for and delete a disposable user account.
- [ ] Website URL is in Supabase's allowed redirect URLs.
