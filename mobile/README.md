# CavernicolApp Mobile

App móvil productiva de **CavernicolApp** — el SaaS multi-tenant CRM/CEM de Dragon Technologies.
Consume las mismas APIs del SaaS actual (`app.cavernicolapp.com`) desde iOS y Android.

## Módulos incluidos (v0.1)
- **Dashboard** — KPIs del día (conversaciones sin leer, leads activos, citas hoy, tareas pendientes)
- **Inbox** — Conversaciones unificadas (WhatsApp, Messenger, Instagram, LinkedIn, Email, SMS, Voz)
- **CRM** — Leads, Pipeline de Deals y Tareas
- **Agenda** — Calendario de citas con acciones (confirmar, iniciar, completar, no-show, cancelar)
- **Perfil** — Configuración, notificaciones, cierre de sesión, legales

## Módulos EXCLUIDOS (por diseño — son administración de plataforma)
Super Admin, Plan Builder, Integration Center, Team Manager, Marketing Automations, Social Studio,
Web Builder, POS Terminal, AI Training, Observability avanzada.

## Permisos por rol
- `tenant_owner`, `tenant_admin` → **ven todo del tenant**
- `tenant_manager`, `tenant_user` → **solo ven lo asignado a su user_id**
- `tenant_cajero` → rechazado en login (rol es de POS/administración, no productivo móvil)
- Usuarios de plataforma (super_admin, etc.) → rechazados en login

## Stack
- **React Native 0.76** + **Expo SDK 52** + **Expo Router 4** (typed routes)
- **NativeWind 4** (Tailwind CSS para RN) + **Ionicons** / **MaterialCommunityIcons**
- **React Query 5** para caché y sincronización
- **Zustand 5** para auth store con lógica de permisos
- **Expo SecureStore** para tokens
- **Expo Notifications** para push (endpoint de registro pendiente en backend)
- **TypeScript 5** estricto

## Deploy targets
- **Android** (Play Store) — Package: `com.dragontech.cavernicolapp.mobile`
- **iOS** (App Store) — Bundle ID: `com.dragontech.cavernicolapp.mobile`
- Build system: **EAS Build**

## Setup local
```bash
cd /app/mobile
yarn install
cp .env.example .env         # ya viene creado por defecto
npx expo start                # dev con Metro
# o
npx expo run:android         # build local Android (requiere Android Studio)
npx expo run:ios             # build local iOS (requiere Xcode, macOS)
```

## Build para tiendas con EAS
```bash
# Preview interna (APK / TestFlight)
yarn eas:build:preview

# Producción
yarn eas:build:production

# Submit a stores
yarn eas:submit:android
yarn eas:submit:ios
```

**Antes del primer build necesitas:**
1. `npx eas login` con la cuenta de Dragon Technologies
2. `npx eas init` — te asigna un `projectId`, cópialo a `app.json → extra.eas.projectId`
3. Rellenar `eas.json → submit.production.ios` con `appleId`, `ascAppId`, `appleTeamId`
4. Colocar `./secrets/play-service-account.json` para Play Store (service account de Google)
5. Configurar credenciales iOS en EAS (`npx eas credentials`)

## Blockers actuales (a coordinar con Claude/Grok en el SaaS)
1. **Login móvil** — el endpoint `/api/auth/login` actual requiere `turnstile_token` (widget web) y no
   devuelve Bearer token en JSON después de S71. Se necesita `/api/mobile/auth/login` que:
   - Skipee Turnstile validando **App Attest** (iOS) / **Play Integrity** (Android)
   - Devuelva `access_token` + `refresh_token` en body JSON
   - Omita el requisito de header `X-CSRF-Token` cuando venga con `Authorization: Bearer`
2. **Push notifications** — no existe `/api/tenant/mobile/register-device`. Los push están
   MOCKEADOS: la UI del perfil muestra el estado "Pendiente" hasta que se habilite.
3. **Refresh** — el endpoint `/api/auth/refresh` actual sólo lee refresh de cookies; en móvil se
   envía como body `{ refresh_token }`. A coordinar.

## Workflow: audit-first antes de save
Antes de mergear a `main`:
1. `cd /tmp/cavernicol-analysis/SAAS-CavernicolApp && GIT_SSH_COMMAND="ssh -F /root/.ssh/config" git fetch --all`
2. Comparar `git rev-parse HEAD` con el commit registrado en `/app/memory/MOBILE_APP_PRD.md` sección
   "Última verificación de sync con el SaaS".
3. Si hay commits nuevos → revisar diffs de `backend/app/routers/{auth,crm,inbox,agenda}.py` y
   adaptar el cliente.
4. Actualizar la fecha y HEAD en `/app/memory/MOBILE_APP_PRD.md`.
5. Recién ahí → save a main.

## Estructura de carpetas
```
mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── (auth)/                   # login, mfa, forgot-password
│   ├── (tabs)/                   # dashboard, inbox, crm, agenda, profile
│   ├── inbox/[conversationId].tsx
│   ├── crm/lead/[leadId].tsx
│   └── agenda/appointment/[id].tsx
├── src/
│   ├── api/                      # HTTP client + endpoints por dominio
│   ├── hooks/                    # React Query hooks
│   ├── stores/                   # Zustand (auth + permisos)
│   ├── components/ui/            # Componentes reusables
│   ├── constants/                # config, endpoints, roles
│   ├── lib/                      # format, roleLabels
│   └── types/                    # TypeScript types (mirror del backend schema)
├── assets/                       # icons, splash
├── app.json                      # Expo config (bundle ids, permisos, notifs)
├── eas.json                      # EAS Build profiles
├── tailwind.config.js            # paleta CavernicolApp
├── metro.config.js               # nativewind bundler
├── babel.config.js
└── tsconfig.json
```

## Legal
- **Términos:** https://cavernicolapp.com/terminos
- **Privacidad:** https://cavernicolapp.com/privacidad
- **Contacto ARCO:** contacto@cavernicolacreativo.com
- Responsable: Dragon Technologies S.A.P.I. de C.V. (MX)
- Corresponsable: Dragon Technologies LLC (EIN 33-2352150, San Antonio TX)

---
**Versión:** 0.1.0 · **SDK Expo:** 52 · **HEAD analizado del SaaS:** `5825e4d0` (Web CRO Engine ADR-159)
