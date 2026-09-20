# MedPal — Digital Healthcare Platform

MedPal is a web application I built to manage the workflow between clinics, doctors, and patients. The idea came from a simple problem: small clinics often handle appointments, patient records, and doctor schedules through a mix of paper, phone calls, and scattered spreadsheets. MedPal tries to bring all of that into one place.

The system has three types of users — clinics, doctors, and patients — and each one gets a different view and set of features depending on their role.

---

## What the app does

### For clinics

When a clinic registers, they get their own dashboard where they can:

- Add and manage doctors (via invitation links sent by email)
- Invite patients to the platform
- Manage departments and the services the clinic offers
- See all appointments across the clinic
- Set working hours for each doctor
- Review visit reports and test results submitted by their doctors

### For doctors

Doctors log in with a special doctor code (instead of an email) and can:

- See their upcoming and pending appointments
- Approve or cancel appointments
- Write visit reports after a consultation (diagnosis, symptoms, temperature, blood pressure, recommendations)
- Add test results, with the option to upload a PDF or image
- View their personal calendar
- Set their weekly availability

### For patients

Patients join through an invitation from a clinic, and once registered they can:

- Book appointments by choosing a doctor, a service, a date, and an available time slot
- See their full appointment history
- View their medical reports and test results
- Get notifications when an appointment is approved or still pending
- Upload their own medical documents (lab results, scans, etc.)
- Manage their profile and medical information

---

## How the roles fit together

The flow between the three roles goes like this:

1. A clinic registers and sets up its departments and services.
2. The clinic invites doctors via email — each invitation includes a unique token.
3. When the doctor completes registration, they appear in the clinic's doctor list.
4. The clinic also invites patients the same way.
5. Once a patient is registered, they can book appointments with any available doctor.
6. The doctor approves the appointment, and later writes a visit report and/or test results.
7. The patient sees everything from their dashboard.

This keeps the data scoped correctly — a clinic only sees its own doctors and patients, a doctor only sees their own appointments, and a patient only sees their own records.

---

## Tech stack

I used the following tools and libraries:

**Frontend**
- React 19 — UI library
- Vite — build tool and dev server
- React Router DOM 7 — routing between pages
- Bootstrap 5 — base grid and responsive layout
- Custom CSS — design system built on top of Bootstrap
- React Calendar — calendar component for appointments
- Chart.js — for the statistics sections
- UUID — generating unique IDs for users
- Bcrypt.js — hashing passwords before storing them

**Backend**
- Supabase — the whole backend runs on this:
  - PostgreSQL for the database
  - Supabase Auth for authentication
  - Supabase Storage for file uploads (documents, test result attachments)
  - Edge Functions for serverless logic (sending emails)

**Email**
- SMTP through Gmail, triggered by a Supabase Edge Function
- Used for sending invitation links to doctors and patients

**Deployment**
- Frontend hosted on Netlify: [medpalplatform.netlify.app](https://medpalplatform.netlify.app)
- Backend on Supabase
- Source code on GitHub

---

## Project structure

```
MedPal/
├── frontend/
│   ├── src/
│   │   ├── components/     → layouts, route guards
│   │   ├── pages/          → grouped by role (Auth, Clinic, Doctor, Patient, Common)
│   │   ├── lib/            → supabase client
│   │   └── styles/         → theme and global styles
│   └── public/
└── supabase/
    ├── functions/          → edge functions (send-invitation, send-reset-password, etc.)
    └── migrations/         → database schema
```

The `pages/` folder is organized by role, so it's easy to see which files belong to which part of the app.

---

## Running the project locally

### What you need first

- Node.js (v18 or newer) and npm
- A Supabase project (free tier is fine)
- A Gmail account with an App Password if you want email invitations to work

### Steps

1. Clone the repository:

```bash
git clone https://github.com/GentianaMehana/MedPal-Platform.git
cd MedPal-Platform
```

2. Install dependencies:

```bash
cd frontend
npm install
```

3. Create a `.env.local` file inside `frontend/` with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

You can find these in your Supabase dashboard under **Settings → API**.

4. Start the development server:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`.

5. To build for production:

```bash
npm run build
```

This creates a `dist/` folder with the production build.

---

## How authentication works

A few things worth explaining, since the auth flow is a bit different from a typical app:

- **Clinics** register themselves directly and log in with their email and password.
- **Doctors** are invited by clinics. They receive an email with a unique link, complete their registration, and then log in using a **doctor code** (like `DR-XXXXXXXX`) instead of an email. Each doctor gets a code generated when they're added.
- **Patients** are also invited by clinics. They complete registration through the invitation link, verify their account, and then log in with their email and password.
- Passwords are hashed with Bcrypt before being stored in the database.
- The router checks the user's role on every protected route and redirects if the role doesn't match.

---

## Notes on security

A few things I paid attention to while building:

- Passwords are never stored in plain text — they're hashed with Bcrypt.
- Route guards (`PrivateRoute`, `AdminRoute`) check the user's role before rendering protected pages.
- Supabase Row-Level Security (RLS) is enabled on the main tables so users can only query data they're supposed to see.
- Patient accounts must be verified before they can log in.
- File uploads are stored in per-patient folders in Supabase Storage.

This isn't a production-hardened system, but the basics are in place.

---

## What I'd improve next

If I had more time, I'd work on:

- Server-side validation for all forms (right now a lot of checks happen client-side)
- Better error handling in the Supabase Edge Functions
- Unit tests for the main booking and registration flows
- A proper admin role for overseeing the platform
- Dark mode for the UI
- Migrating to a full TypeScript codebase

---

## About

This is a personal/academic project. It's not affiliated with any real clinic, and the data used during development was entirely made up for testing.

© MedPal
