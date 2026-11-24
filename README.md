 # MedStudy Hub — Complete project package

This is the main MedStudy Hub website. It contains the student experience and the administrator dashboard in one website and uses one Supabase project/database.

## What is included

### Student area
- Email/password registration and login.
- Five courses: Biochemistry, Histology, Physiology, Embryology and Gross Anatomy.
- Google Forms quiz links.
- Notes, textbook/reference and YouTube resource library.
- Personal results history and course performance chart.
- Quiz search and course/topic/difficulty filters, with per-account quiz favorites.
- Course-level review recommendations, a weekly quiz target and CSV/printable progress reports.
- Practice-score entry for private tracking.
- Achievements based on practice activity.
- Overall, course, weekly, most-improved and recent-activity leaderboards.
- Display name and leaderboard opt-in controls.
- Per-account website accent colour selection.
- Medical-school, year-of-study, specialty-interest, favourite-course and optional quiz-rank details.
- A responsive medical-student profile with study metrics, saved resources, study-group access and a photo-backed global avatar.
- Profile photos compressed to WebP and stored in the public `profile-photos` Supabase Storage bucket, with a browser-local fallback for local testing.
- Profile preference to show or hide the photo in the profile header banner while keeping the avatar photo enabled.
- Saved study resources synced to the signed-in profile.
- Recently opened quizzes and resources with account-synced links to reopen them; Google Forms controls whether an in-progress answer draft can resume.
- A configurable focus timer with pause/reset and an optional five-minute break.
- Private, account-synced notes attached to saved resources.
- Home dashboard section visibility preferences in **Settings → Appearance**, synced across devices.
- A theme-coloured left navigation drawer and a right-side settings drawer, with the admin dashboard shown to admins.
- Account, appearance, notification, privacy/security and motion/visual preferences, including dark mode, region/time-zone formatting, quiet hours, activity consent and sign-out of other devices.
- Responsive navigation and settings drawers with reduced-motion and color-vision palette options.
- A daily consecutive-visit streak with an animated welcome and detailed Results & Progress summary.
- A personal study task list on Home with due dates, completion tracking and clear-completed controls. Tasks are saved locally in the current browser for each signed-in account; they do not sync across devices.
- An in-app notification centre for group announcements.
- Expanded floating home-page group chat with a larger window, up to 300 recent messages, online and typing indicators, and private voice notes (up to 60 seconds / 5 MB) that expire after seven days.
- Admin dashboard organized into collapsible management sections.
- Admin user directory for email invitations, bans/restores, protected account deletion and recent activity timelines.
- Admin activity view for sign-ins, pages visited and approximate visible active time; typed content and chat messages are not collected.
- Users can permanently reset their own activity, active-time totals, streak and quiz results; admins can reset those records for all users with a typed confirmation. Profiles, accounts and course content are kept.
- Admins can clear shared announcements and request clearing saved class/exam reminders for all users; browser-local reminders are removed the next time each user's notification centre syncs.
- Admin switches for classes, exams, chat, quizzes, resources, leaderboards, manual scores, announcements and schedule/phone alerts.
- Optional native phone notifications for class start/end while the hub is open, with per-browser permission and opt-in. Web notifications cannot bypass browser/OS permission; closed-app delivery requires a separately configured Web Push service.
- A Monday–Friday class timetable with lecturer and live class status.
- Admin-managed MB exam periods with Viva, MCQ or Theory type and countdown reminders.
- Class start/end and 30-day, 7-day and 1-day exam reminders in the in-app notification centre.
- Home dashboard profile card and full medal-ranked leaderboard for opted-in students after three students qualify.
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
- Organize course resources into separate notes/documents, textbooks/references, videos and other resources sections.
- Private Supabase Storage bucket and policies for uploaded study documents.
- Admin overview counts.
- Google Form ID field to help configure verified score import.

### Verified score import
The package includes:
- `google-apps-script/MedStudy_Form_Score_Import.gs`
- `supabase/functions/import-google-form-score/index.ts`

The Google Apps Script sends scored form submissions, including each graded question, the student's answer, points, available correct answers and configured feedback, to a Supabase Edge Function. The Edge Function checks a shared secret, matches the respondent email to a MedStudy Hub account, and records the first attempt for a course and quiz title as verified. Later submissions for that same quiz are kept in the student's results as unverified. The private answer review labels correct, incorrect and partially correct responses and shows the answer key where Google Forms exposes it (multiple choice, checkboxes and dropdowns). The built-in Forms Apps Script API does not expose an answer key for every question type; configured feedback is still shown when available. The service-role key stays on the server.

**Important:** You must configure and deploy the Google Apps Script and Edge Function for this integration to work. A Google Form must be configured as a quiz, have points assigned, and collect respondent email addresses. Manual score entries remain private and are excluded from official group rankings.

---

# STEP-BY-STEP SETUP

## Guest and Member access

Each registered profile is assigned `role = 'member'` by default. An administrator can open **Admin dashboard → Users and website activity**, select **Guest** in a user's role selector, and optionally toggle Gems. Guest mode sets `gems_enabled = false` automatically. Disabled Gems block purchases, spending, and achievement Gem claims; an administrator can re-enable Gems after changing the account back to Member.

Guest users can take quizzes and save private quiz progress, but their submissions are marked `is_verified = false` and private. The website hides the leaderboard, AI tools, group chat, study resources, Gems Shop, achievements and public profile navigation for Guests. Guest users cannot open another user's public profile.

Member and admin users can open member leaderboard rows and public profiles. RLS blocks Guest users from reading or appearing in public member leaderboards and blocks them from published resources and shared chat/storage areas. The migration also blocks guests from reading other users' profiles and quiz submissions. Public storage reads are limited to the `app-assets` bucket; member-only restricted documents remain in private buckets.

Apply `supabase/migrations/20261124_phase_gems_roles_shop.sql`, `supabase/migrations/20261124_achievement_podium_streak_profiles.sql`, then `supabase/migrations/20261124_achievement_xp_progression.sql` in the Supabase SQL Editor after backing up the database. Review each migration and refresh the app session after applying them. The achievement migration adds average, weekly-champion and quiz/course podium rules, and removes class and favourite-course fields from the public profile view. Podiums use verified scores from leaderboard-opted-in members; quiz podiums compare each student's best score for the named quiz, course podiums compare average scores in the named course, and tied places share permanent awards. The weekly champion uses the rolling seven-day leaderboard average. The XP migration awards XP equal to an achievement's Gem reward when it is claimed, backfills previously claimed achievements once, and recalculates levels from total XP: Level 1 plus one level per 100 XP. The streak character can be selected in **Settings → Appearance**, including the **Evolving fire** option, whose flame glow changes color as your streak grows, or left on Evolving buddy. The streak sound can be uploaded from **Admin dashboard → Sound & Media Settings** once that UI has been configured in your deployment.

## Public avatars

Members can choose one of the built-in medical avatar presets or upload a PNG, JPEG, WebP or GIF image under **My profile → Overview & Bio → Profile picture**. Uploaded images are optimized and stored in the public `profile-photos` bucket. A selected upload takes priority over a preset. Removing the upload leaves the selected preset or initials fallback available. Preset and uploaded avatars appear in public member profiles and leaderboard avatars.

## Part 1 — Create one Supabase project

1. Visit [https://supabase.com](https://supabase.com) and create an account.
2. Create one new project. Give it a name such as `MedStudy-Hub`.
3. Save the database password somewhere safe.
4. Wait until the project has finished provisioning.
5. In the project dashboard, open **SQL Editor** → **New query**.
6. Open the supplied `schema.sql`, copy the entire file, paste it into the SQL Editor and click **Run**.
7. Confirm that the query completes without an error.

The profile-picture upload and medical academic details require this latest schema. Profile photos are resized to a 512 × 512 WebP image and uploaded to Supabase Storage; the profile form shows upload progress and completion. If Supabase is not configured, the same compressed image can be stored locally for development. Public-bucket URLs make uploaded profile photos visible wherever a member's avatar is shown.

If you previously used an earlier MedStudy Hub database, back it up first, then run this updated `schema.sql` in the SQL Editor. It adds profile settings, medical-school and specialty-interest fields, profile-photo Storage and its per-user upload policies, activity-reset markers, quiz topics, the user study-streak table/functions, user/admin study-data reset functions, the notification-centre reset marker/function, resource storage path, private document bucket, admin-controlled notifications, class timetable, MB exam, feature settings, group-chat presence/audio storage and user-activity tables, plus weekly chat cleanup and a verified-score group average in the admin overview, while keeping existing quiz/resource/attempt rows. The `profile-photos` bucket is public so avatar images can appear in the signed-in hub; users can only upload, replace or remove files in their own user-ID folder. Review any custom policies you previously created. To update an existing database's leaderboard rules only, run `supabase/fix_leaderboard_eligibility.sql` in the SQL Editor.

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

### Google Drive document search

1. In `app.js`, set `GOOGLE_DRIVE_API_KEY` and `GOOGLE_DRIVE_FOLDER_ID` near the top of the file. The key must be a Google Cloud API key with the **Google Drive API v3** enabled; the folder ID is the value after `/folders/` in its Drive URL.
2. Share the folder as **Anyone with the link — Viewer** (or otherwise make the files readable to the intended users). The Drive API can only return files visible to that public API request.
3. Restrict the API key in Google Cloud Console to your website's HTTP referrers and the Google Drive API. Browser code cannot keep an API key secret; never use a service-account credential or OAuth client secret here.
4. Open **Notes, textbooks & videos** while signed in. The folder contents load there; search filters filenames as you type, and selecting a result opens its Drive preview in the page.

## Part 3 — Configure Supabase authentication

1. In Supabase, open **Authentication** → **Providers** and make sure Email is enabled.
2. Choose whether to require email confirmation. Requiring it is recommended.
3. Open **Authentication** → **URL Configuration**.
4. During local testing, add your local development URL to the allowed redirect URLs (for example, the URL shown by VS Code Live Server).
5. Later, add your deployed website URL to the allowed redirect URLs and set it as the Site URL.
6. Password reset emails use the current site URL as their redirect destination. The returned recovery session displays a new-password form. Test the full email link flow after configuring the URL allow-list.

## Part 4 — Run the website locally

1. Open a terminal in the `MedStudy_Hub_Final` project folder and run:

   ```powershell
   py -m http.server 8000
   ```

   Then visit `http://localhost:8000`. Keep the terminal open while using the site. Alternatively, install the VS Code **Live Server** extension and choose **Open with Live Server** for `index.html`.
2. Create your own account using your real email address.
3. Confirm your email if confirmation is enabled.
4. Log in.
5. Test the Home, Classes / exams, Quizzes, Results & Progress, Achievements, Notes & Videos and My Profile pages. Students can select and save their own website accent colour in My Profile.

Do not double-click `index.html` to open it as a `file://` page; use a local web server.

### Ethora medical study assistant

The home page shows an explicit AI assistant launcher for eligible members. It does not load the widget or spend Gems on page load. Selecting **Open AI assistant** asks for confirmation before charging 10 Gems once for that page session. This is a static site, so there is no `.env` build step; the public app ID provided for this site is stored in `ethora-config.js`. App IDs are public identifiers, not secrets.

The launcher is configured for the left side. In the Ethora dashboard, configure the assistant's name, knowledge and instructions for study support: explain concepts and help with exam revision, cite its knowledge sources where possible, and do not diagnose, prescribe, or give patient-specific advice. Do not upload identifiable patient information or encourage students to enter it. Ethora documents Shadow DOM style isolation, so the widget should not clash with this site's CSS.

The Home and Results & Progress leaderboards re-query Supabase every 30 seconds while visible; enabling Supabase Realtime is not required for this refresh behavior. Realtime profile updates may arrive sooner when the project's publication is enabled.

No Content Security Policy (CSP) header or policy is configured in this project. If your hosting provider adds a strict CSP, allow `https://app.chat.ethora.com` in `script-src` and `https://api.chat.ethora.com` in `connect-src`; check the browser's CSP errors and Ethora's current integration guidance for any additional origins needed by the widget. The project does not add a CSP header itself.

### Settings, privacy and daily streaks

The menu at the top left opens the theme-coloured navigation drawer. The gear beside the profile opens Settings from the right; admins also see an Admin dashboard shortcut there. Settings cover profile access, language/English regional formatting, time zone and preferred study region; light/dark mode, accent, density, text size and home dashboard section visibility; announcement/reminder preferences, quiet hours and popup limits; privacy consent, password reset and signing out other devices; and reduced motion, contrast and color-vision palettes. The language preference changes regional formatting; the interface labels are currently English. Preferred region does not change course access. Embedded-video autoplay control is ready for future embedded media; current video resources open only when selected.

Most settings are saved to the signed-in profile and sync across devices. If the `preferences` column is missing, other preferences stay on the current browser, while accent colour and leaderboard consent still use the legacy profile fields; the site displays a schema-update notice. The streak records one visit per calendar day in the selected time zone and resets after a missed day. It is stored in Supabase and shown in an animated daily welcome and in detail on Results & Progress. The activity-report consent toggle stops future sign-in, page-view and active-time reporting when disabled; it does not erase older records. **Reset my study data** permanently deletes your activity events, active-time totals, study streak and quiz results, but keeps your profile, account and course content. Admins can perform the same reset for all users from the Admin dashboard. Other devices clear their locally saved active-time totals when they next sync their profile. In the Admin dashboard, **Clear notification centres** removes all shared announcements and marks saved class/exam reminders for clearing the next time each user's notification centre syncs. The account page contains the existing permanent-deletion action. The device panel identifies the current browser and can sign out other sessions; it does not provide a per-device session inventory.

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
6. Add comma-separated topics when editing or creating the quiz; students can filter and search using these tags.
7. Publish the quiz when ready.

Students can save quizzes as favorites, set a weekly quiz target, review course averages and suggested focus areas, and download a CSV or print a personal progress report from Results & progress.

### Resources
1. In Admin dashboard → Add a resource, choose the course and resource type, and enter a title.
2. For a document, choose **Or upload a document** and select a PDF, Word, PowerPoint or text file up to 50 MB. For other web resources, enter its URL.
3. Videos are added as YouTube or other HTTP/HTTPS links by choosing `Video link`; video file uploads are not supported.
4. For a textbook or reference, paste its Google Drive sharing link in **Google Drive textbook link** and make sure students have permission to access it.
5. Publish the resource when ready. Students see separate Notes & Documents, Textbooks & References and Videos sections under each course.

Uploaded documents are stored in the private `study-documents` Supabase bucket; only admins can upload, and signed-in students can open published files. Only share files you own or have permission to distribute. Do not upload or distribute unauthorised textbook scans.

### Group announcements
Admins can post reading reminders, test dates and other updates from **Admin dashboard → Send a group announcement**. Active announcements appear in the notification bell for signed-in users and expire from the centre after 14 days. The centre is in-app only; it does not send push notifications or email. Admins can remove an announcement earlier.

### Study-group chat
Signed-in students can open the floating chat button on Home. Messages are shared with signed-in users, display the sender's saved profile name, and expire after seven days. The larger chat loads up to 300 recent messages and shows members who have the chat open plus a short-lived typing indicator. Online status is refreshed every few seconds and can take up to 45 seconds to disappear after a browser closes unexpectedly.

Students can record and preview a voice note before sending. Voice notes are private files in Supabase Storage, limited to 60 seconds and 5 MB, and are available to chat members for seven days. Microphone access requires HTTPS or localhost and user permission. To enable the expanded chat, run the latest `schema.sql`. If voice sends fail with an "infinite recursion" RLS error, run `supabase/fix_group_chat_voice_rls.sql` in the Supabase SQL Editor; this replaces the chat insert policy without querying Storage from that policy. Then deploy the cleanup function:

```powershell
supabase functions deploy cleanup-group-chat-audio
```

Expired audio files are removed when chat is opened and the cleanup function runs; expired text messages continue to be purged weekly. If the function is unavailable, text chat remains usable, but the site will show a cleanup warning. Do not send private or sensitive information in group chat or voice notes.

### Classes and MB exams
In **Admin dashboard**, use **Set up class timetable** to add weekday classes with their course, lecture title, lecturer, and start/end times. Use **Set up MB exam periods** to add the exam name, course, Viva/MCQ/Theory type, and start/end date and time. Students see the weekday timetable, the current class status, and a countdown to each upcoming exam under **Classes / exams**.

When the portal is open, class start/end notices and exam reminders one month, one week, and one day before the exam appear as page popups and in the notification centre. Class notices catch up for classes scheduled earlier that day when the signed-in app is opened, then clear at local midnight. Exam reminders remain in the current browser profile for up to 14 days; schedule reminders are not synchronized between devices. Students can opt in to phone notifications for class start/end in **Classes / exams**; the browser/phone must grant notification permission and retain this site's data. These native alerts are checked while the signed-in app is open. Browser and operating-system notification controls cannot be bypassed. Delivery while the app is fully closed requires a separately configured Web Push service and server credentials, which are not included.

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

5. Apply the latest `schema.sql` in the Supabase SQL Editor so `quiz_attempts` has the `answer_summary` column.

6. Your function URL is:

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
10. Check Supabase → Table Editor → `quiz_attempts`. The first submission for a course and quiz title should have `is_verified = true`, `source = google_forms` and an `answer_summary` array. Further submissions for the same quiz title and course are saved with `is_verified = false`. The portal displays each breakdown under Results & progress → My recent results → Question review.

Repeat the Apps Script setup for each separate Google Form. The Google Form respondent email must match the email on the student's MedStudy Hub account. The script imports graded quiz responses with a non-zero total point value. If a student uses an email that does not match an account, the import will fail rather than crediting another person. Quiz matching uses the normalized course and title, so use a distinct title when creating a different quiz in the same course. Existing score records cannot gain correct-answer keys retroactively; new submissions include them where the question type supports it after the updated Apps Script and Edge Function are deployed.

**Privacy note:** Tell students that their Google Forms respondent email is used to match their quiz score to their MedStudy Hub account. Restrict access to the Google Forms response sheet to trusted administrators.

## Part 8 — Deploy account and user-management functions

Account deletion and administrator user management use server-side Edge Functions so the service-role key is never exposed in the website. Deploy both:

The function source is included in `supabase/functions/admin-user-management/` and `supabase/functions/delete-account/`.

1. From the `MedStudy_Hub_Final` folder, install the Supabase CLI if needed and sign in with `supabase login`.
2. Link the project if it is not already linked, then deploy both functions:
   ```bash
   supabase link --project-ref qiwqluwtmpflmekgjiob
   supabase functions deploy delete-account --project-ref qiwqluwtmpflmekgjiob
   supabase functions deploy admin-user-management --project-ref qiwqluwtmpflmekgjiob
   ```
   The CLI uses Supabase's server-side function secrets; never put the service-role key in the website or source code.
3. Administrators can invite users by email, ban or restore sign-in access, inspect recent activity, and permanently delete non-admin accounts from **Admin dashboard → Users and website activity**. Invitations use Supabase's configured email templates and redirect URL; invitees finish setup from the email. Banning blocks future sign-ins, though an already-open session can remain usable until its access token expires.
4. Admin deletion removes the Auth account. Database foreign-key rules then delete that user's profile, results, messages and activity records. Administrator accounts are protected from these actions.
5. The My Profile deletion button still lets each student delete their own account.
6. Test invitations, banning, restoration and deletion with disposable accounts before inviting your study group.

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
- **Personal preferences:** Theme, regional formatting, notifications, privacy and accessibility preferences are stored on the user's own profile. The study streak is stored per user and is not public.
- **Resume state:** The last visited section is stored locally per signed-in account and expires after 30 minutes.
- **Manual scores:** Manual practice scores are unverified, visible only to the student, and excluded from shared rankings.
- **Verified scores:** The Apps Script integration sends scored quiz responses to a server-side function. The server checks a shared secret, maps the collected respondent email to a MedStudy account and records only the first Google Forms attempt for a course and quiz title as verified. Later attempts remain in the student's history but are excluded from shared rankings. A unique response ID prevents duplicate imports.
- **Service-role key:** Never put this key in `app.js`, HTML, CSS, GitHub, or any public repository. It belongs only in trusted server-side environments.
- **Account deletion:** The delete-account Edge Function uses the authenticated user's token and deletes only that user's account.
- **User management:** The admin-user-management Edge Function verifies the signed-in user and admin membership before listing/inviting accounts or changing access. Admin accounts cannot be banned or deleted through the panel.
- **Limits:** Google Forms import depends on the Form being configured as a quiz, collecting email, having point values and having an installed Apps Script trigger. This is not a proctored examination system; it verifies the score returned by Google Forms and the email identity supplied by the Form, not the student's physical identity.
- **Charts and achievements:** Personal charts include the student's recorded attempts. Group rankings and the verified high-performer achievement use verified attempts.

## Troubleshooting

- **No Admin Dashboard tab:** Confirm the admin promotion SQL used the correct registered email, then sign out and back in.
- **No published quizzes/resources:** Check that `is_published` is ticked and the course is one of the five exact course names.
- **Password reset link fails:** Check Supabase Authentication URL Configuration and email provider settings.
- **Admin study-data reset says “UPDATE requires a WHERE clause”:** Run the latest `schema.sql` in the Supabase SQL Editor to update the reset function.
- **Google score import returns 401:** Check that the Apps Script secret exactly matches `MEDSTUDY_SHARED_SECRET`.
- **Google score import returns 404:** The respondent email does not match a MedStudy Auth account.
- **Google score import says no points:** Make the Form a quiz and assign points to its questions.
- **No leaderboard entries:** At least three opted-in students must have a verified quiz attempt. Once that threshold is reached, every opted-in student with one or more verified attempts appears in Overall and By course. Weekly rankings use the same threshold within the last seven days. For an existing database, run `supabase/fix_leaderboard_eligibility.sql` in the Supabase SQL Editor, then refresh the website.
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
- [ ] Navigation opens from the left, Settings opens from the right, and the Admin dashboard shortcut is admin-only.
- [ ] Appearance, notification, privacy and motion settings persist after a reload.
- [ ] Daily streak increments once per day, resets after a missed day and appears in Results & Progress.
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
