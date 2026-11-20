# SahaySetu Repository Audit

Audit date: 20 November 2026

This report summarizes source inspection and checks performed in the existing repository. It is not a live production or Jira audit. No MongoDB records were modified as part of this work.

## Project and architecture

SahaySetu is a disaster response and resource coordination web application. The current repository is a React/Vite client and an Express API backed by MongoDB/Mongoose. Public roles are Citizen, Volunteer and Coordinator; administrator accounts are controlled separately, including a Super Admin flag and per-module permissions.

The frontend includes authentication and role pages, incident reporting and detail views, volunteer tasks and review workflows, coordinator incident/request/shelter/resource workflows, administrator and Super Admin pages, notifications, and analytics/report views. The backend includes User, Incident, EmergencyRequest, Shelter, Resource, Notification, SystemSetting and ActivityLog models, with corresponding route/controller groups.

## Feature status

| Component | Status | Evidence and remaining work |
|---|---|---|
| Citizen, Volunteer, Coordinator and Admin UI/API | IMPLEMENTED BUT NOT FULLY TESTED | Role pages, API routes and authorization middleware exist. No live four-role regression pass was run. |
| Super Admin controls and administrator management | IMPLEMENTED BUT NOT FULLY TESTED | Separate protected routes, admin permissions and activity-log code exist. Live database workflows remain unverified. |
| Incident, emergency request, volunteer, shelter and resource workflows | IMPLEMENTED BUT NOT FULLY TESTED | Models, routes, controllers and frontend pages exist. End-to-end acceptance checks remain outstanding. |
| Notifications and analytics | IMPLEMENTED BUT NOT FULLY TESTED | Database-backed notification routes/UI and database-derived reports exist. Sprint 4 notes identify date filtering/export and resource allocation-ledger gaps. |
| Registration and sign-in | IMPLEMENTED BUT NOT FULLY TESTED | Citizens sign in immediately after registration; Volunteer and Coordinator dashboard access requires Super Admin approval. No email/SMS provider is needed for registration. |
| Administrator account setup | IMPLEMENTED BUT NOT FULLY TESTED | Super Admin provisions a generated administrator ID and temporary password manually; first login requires a password change. |
| Automated testing | PARTIALLY IMPLEMENTED | Database-backed auth, API authorization and end-to-end tests are still missing. |
| Production deployment | BLOCKED BY EXTERNAL CONFIGURATION | Deployment instructions exist, but hosting, database, storage and provider setup were not validated here. |
| Jira traceability | BLOCKED BY MISSING JIRA EXPORT | The supplied planning brief specifies four sprints, 53 stories and 216 points (50/43/55/68 points per sprint). Repository docs show Sprint 1 and Sprint 4; Sprint 4 documents SS-50–SS-69. No Jira export/story register was present, so exact story-to-code mapping cannot be verified. |

## Registration behavior update

- Citizens receive a JWT immediately after registering and can use email/password sign-in from their devices.
- Volunteer and Coordinator accounts must use an `@sahaysetu.com` email and wait for Super Admin approval before dashboard access.
- OTP registration routes, screens, providers and contact-change verification have been removed.
- Administrator provisioning remains manual with an ID and temporary password; first login requires a new password.
- Password reset can send an email when mail credentials are configured, but it does not block registration or sign-in.

## Issues found and fixed

- Backend CORS accepted every browser origin. Production now uses configured `CLIENT_URL`/`CORS_ORIGINS`, with local development and Capacitor exceptions.
- The API began listening before MongoDB and Super Admin initialization finished. Startup now waits for initialization.
- Public account access no longer depends on email or mobile verification; role approval and administrator permission rules remain enforced.
- Frontend effects had stale dependency warnings and unused imports. Lint now completes cleanly.
- The production bundle exceeded Vite's single-chunk warning threshold. Route-level lazy loading now splits page code.
- npm reported backend dependency advisories. Compatible runtime updates fixed the critical and high findings. The remaining report is limited to moderate issues in the development-only nodemon/minimatch chain.

## Checks run

- Backend: `node --check` — all backend JavaScript files passed syntax checks.
- Frontend: `npm run lint` — passed with no warnings.
- Frontend: `npm run build` — passed; route chunks were generated and the previous oversized-entry warning was absent.
- Backend dependency audit: runtime advisories were remediated. Two moderate development-tool advisories remain in nodemon's minimatch dependency; production dependencies are checked separately after updates.
4. Test citizen registration/sign-in, volunteer/coordinator approval, administrator activation, deactivation, and protected API authorization against a non-production MongoDB database.
