# 🏥 MedPal - Digital Healthcare Platform

MedPal është një platformë digjitale për menaxhimin e klinikave, mjekëve dhe pacientëve. Ndërtuar me teknologji moderne për të ofruar një përvojë të shpejtë, të sigurt dhe të lehtë në menaxhimin e shërbimeve mjekësore.

## 🚀 Features Kryesore

### Për Klinikat
- 📋 Regjistrimi dhe menaxhimi i klinikës
- 👨‍⚕️ Shtimi dhe menaxhimi i mjekëve
- 📧 Ftesa për pacientë përmes emailit
- 📅 Shikimi i të gjitha termineve të klinikës
- 🏥 Menaxhimi i departamenteve dhe shërbimeve
- 📊 Raporte për vizitat e pacientëve

### Për Mjekët
- 📋 Shikimi i termineve të aprovuara dhe në pritje
- ✅ Aprovimi ose anulimi i termineve
- 📝 Krijimi i raporteve të vizitave
- 🧪 Shtimi i rezultateve të analizave (me mundësi upload-i)
- 📅 Kalendari personal i termineve
- 🕒 Caktimi i orarit të punës

### Për Pacientët
- 📅 Rezervimi i termineve (zgjedhja e mjekut, shërbimit, datës dhe orës)
- 📖 Historia e termineve
- 📋 Shikimi i raporteve të vizitave
- 🔔 Njoftime për statusin e termineve
- 📎 Ngarkimi i dokumenteve mjekësore
- 👤 Profili personal



## 🛠️ Tech Stack

### Frontend
- **React 19** - Biblioteka kryesore për UI
- **Vite** - Build tool dhe development server
- **React Router DOM 7** - Routing
- **Bootstrap 5** - Stilizimi
- **Chart.js** - Grafikët
- **React Calendar** - Kalendari për termine
- **UUID** - Gjenerimi i ID-ve unike
- **Bcryptjs** - Hashimi i fjalëkalimeve

### Backend & Database
- **Supabase** - Platformë e plotë backend
  - **PostgreSQL** - Database
  - **Authentication** - Menaxhimi i përdoruesve
  - **Storage** - Ruajtja e dokumenteve
  - **Edge Functions** - Funksionet serverless (për email)

### Email
- **SMTP Gmail** - Dërgimi i email-ve përmes Edge Functions
  - Konfigurim me Gmail App Password
  - Template të personalizuar për ftesa

### Deployment
- **Frontend:** Netlify
- **Backend:** Supabase
- **Version Control:** GitHub

## 📦 Instalimi dhe Konfigurimi

### 1. Klonimi i projektit
```bash
git clone https://github.com/GentianaMehana/MedPal-Platform.git
cd MedPal-Platform
