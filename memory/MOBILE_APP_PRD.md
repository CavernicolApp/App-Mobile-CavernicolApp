# CavernicolApp Mobile — Memoria del proyecto (app móvil de ventas/operación)

> ⚠️ **Este archivo es SEPARADO del PRD principal del SaaS** (`memory/PRD.md`).
> El PRD principal es propiedad de Grok/Claude en el flujo del SaaS y NO debe ser modificado.
> Todo el trabajo del cliente móvil (React Native + Expo) vive en `/app/mobile/` y su
> documentación de contexto vive aquí: `memory/MOBILE_APP_PRD.md`.
>
> **El código del SaaS actual NO se toca** — vive en producción externa (`app.cavernicolapp.com`,
> VPS `77.37.62.6`, `/opt/cavernicolapp`). El repo se analizó vía deploy-key SSH de solo lectura
> (clonado en `/tmp/cavernicol-analysis`, fuera de `/app`).
>
> **Objetivo próximo (a espera de instrucción del usuario):** construir una **app móvil productiva** para el uso diario de **ventas y operación** — quedan explícitamente FUERA los componentes de administración de plataforma (Super Admin, Plan Builder, Infraestructura, etc.).

---

## 1. Identidad del producto

| Campo | Valor |
|---|---|
| Nombre comercial | **CavernicolApp** |
| Dueño legal (México) | **Dragon Technologies S.A.P.I. de C.V.** (RFC DTE220909DT1, CDMX) |
| Corresponsable (EE.UU.) | **Dragon Technologies LLC** (EIN 33-2352150, San Antonio TX) |
| Contacto oficial | `contacto@cavernicolacreativo.com` |
| Dominio prod | `https://app.cavernicolapp.com` |
| Landing público | `https://cavernicolapp.com/landing` (`/terminos`, `/privacidad`) |
| VPS producción | `77.37.62.6:/opt/cavernicolapp` |
| Repo (privado) | `github.com/CavernicolApp/SAAS-CavernicolApp` |
| Idioma primario | Español (México), es-MX, MXN, `America/Mexico_City` |
| Categoría | Multi-tenant SaaS **CRM/CEM verticalizable + white-label** |

---

## 2. Stack tecnológico del SaaS actual (fuente de verdad para APIs)

| Capa | Tecnología |
|---|---|
| Frontend web | **React 19** + Tailwind CSS 3.4 + Shadcn/UI (Radix) + Framer Motion 11 + react-router-dom 7 + axios + zustand + swr + @tanstack/react-query 5 |
| Backend | **FastAPI** + SQLAlchemy async (asyncpg) |
| Base de datos | **PostgreSQL 15** — migraciones Alembic (HEAD `0105`) |
| Cache/Rate limit | **Redis 7** |
| Reverse proxy | Nginx |
| Deploy | Docker Compose (`docker-compose.production.yml`, 5 servicios: postgres, redis, backend, frontend, nginx + evolution-api managed opcional) |
| Storage objetos | Cloudflare R2 (multi-tenant, cuotas por plan) |
| Edge | Cloudflare Worker (dominios/publicación web, gated OFF) |
| CI/deploy | Grok/Cursor commit+push por sprint, deploy via `deploy.sh` en VPS |

**Auth arquitectura:**
- JWT access token 15 min + refresh 7 días, en **cookies HttpOnly `ca_access`/`ca_refresh`** (nunca localStorage tras S71).
- Turnstile de Cloudflare validado server-side (login/register/forgot).
- CSRF double-submit (`ca_csrf` + `X-CSRF-Token`).
- Rate limit Redis por IP+email, dummy-bcrypt anti-enumeración.
- MFA (TOTP `pyotp`).
- Tabla `auth_sessions` (Alembic `0097`) con inactividad 60min / absoluto 7d, rotación de refresh.

**Health actual (jul 2026):** `2.9.218-web_cro_engine` · Alembic `0105`.

---

## 3. Modelo multi-tenant

- Cada tabla de negocio tiene columna `tenant_id` (UUID v4).
- Todas las queries filtran por `tenant_id`.
- Tablas de plataforma (users con roles de plataforma, audit logs) tienen `tenant_id` nullable.
- Identidad en todas las llamadas: JWT decodifica `user_id` → `tenant_id` en middleware.

### Verticales soportadas (11)
`beauty`, `health`, `fitness`, `education`, `automotive`, `real_estate`, `professional_services`, `generic`, `workshop` (Talleres — con tabla `workshop_service_vehicles`), `hotel`, `restaurant`.

Cada vertical tiene su propio diccionario de vocabulario, etapas de pipeline default, roles, presets de pools de asignación.

---

## 4. Roles del sistema

### Plataforma (NUNCA en app móvil de ventas)
`platform_owner_root` (único), `super_admin_platform`, `platform_admin`, `platform_support`, `billing_admin`, `integration_admin`, `security_admin`, `qa_support_auditor`.

### Tenant
| Rol | Descripción | ¿App móvil? |
|---|---|---|
| `tenant_owner` | Dueño del negocio, 14 módulos | ✅ SÍ |
| `tenant_admin` | Admin general (sin billing), 12 módulos | ✅ SÍ |
| `tenant_manager` | Gerente de sede/equipo, 8 módulos | ✅ SÍ |
| `tenant_user` | Vendedor / operador, 5 módulos (dashboard, crm, agenda, inbox) | ✅ **CORE del mobile** |
| `tenant_cajero` | Solo Administración/POS terminal | ❌ NO (usa PoS físico) |

---

## 5. Módulos del SaaS — qué va y qué NO va a la app móvil

### 5.1 ✅ INCLUIR en la app móvil (productivo / ventas)

Ordenado por prioridad de valor para un vendedor/operador en campo:

| # | Módulo web (ruta actual) | Descripción funcional | Endpoints principales `/api/tenant/*` |
|---|---|---|---|
| 1 | **Dashboard** (`/tenant`) | KPIs del día: leads nuevos, citas próximas, conversaciones sin atender, tareas pendientes | `/business-hub`, `/observability/dashboard` |
| 2 | **Conversaciones / Inbox** (`/tenant/inbox`) | **Bandeja unificada** de WhatsApp/Messenger/IG DM/Meta comments/LinkedIn/Email + IA (auto/suggest/disabled) + "Tomar control" | `/inbox/conversations`, `/inbox/messages`, `/inbox/reply`, `/inbox/takeover` |
| 3 | **CRM** (`/tenant/crm`) | Leads, Pipeline Kanban por vertical, Contactos+Timeline, Tareas, Deals, asignación round-robin, filtros SLA/estado, notas | `/crm/leads`, `/crm/deals`, `/crm/tasks`, `/crm/contacts`, `/assignment/*` |
| 4 | **Agenda** (`/tenant/agenda`) | Calendario de citas, servicios, recursos, capacidad, waitlist, sync Google Calendar, recordatorios | `/agenda/appointments`, `/agenda/services`, `/agenda/resources`, `/agenda/availability` |
| 5 | **Catálogo** (`/tenant/business/catalog`) | Productos/servicios verticalizados (search y show — no editar desde móvil en v1) | `/business-hub/catalog/*` |
| 6 | **Notificaciones push** | Trigger Engine ya emite eventos post-commit → hay que envolverlos en FCM/APNs para la app | `/triggers/*` (webhooks internos) |
| 7 | **Perfil / Sesión** | Login, MFA, cerrar sesión, cambiar contraseña, notificaciones on/off | `/auth/*`, `/mfa/*` |

**Extensiones opcionales de v1** (evaluar en v2):
- **POS ligero** (`/tenant/administracion/pos`) — cobrar en campo desde móvil (Stripe/Mercado Pago), imprimir ticket a impresora Bluetooth. Solo si el usuario lo pide explícitamente.
- **Voz IA saliente** (`/tenant/voice`) — disparar llamadas de seguimiento con IA (Twilio + tool calling).
- **Reportes lectura** — vistas simplificadas para gerente/dueño.

### 5.2 ❌ EXCLUIR de la app móvil (administración)

Todo lo que el usuario indicó: componentes de administración de plataforma y de configuración pesada.

- **Super Admin completo** (`/admin/*`): Tenants, Plan Builder, Add-ons, Users platform, Usage Dashboard, Support Tickets, Verticals, Infrastructure, Landing Config, Web Templates, Web Domains.
- **Configuración compleja del tenant**: Mi Plan, Integration Center (WhatsApp/Meta/LinkedIn/Google/Stripe wiring), Evolution Panel, WhatsApp Proxies, Team Manager (invitaciones), Locations (sedes), Business Hours Editor, Business Vertical Profile, Development Manager, Onboarding Wizard, Lead Attendance Setup, MCP Connector Center, AI Training Studio, AI Skill Builder, AI Tool Registry, AI Routing Config, AI Test Console, Knowledge Library (upload/manage).
- **Marketing pesado**: Campaign Builder, Campaign Scheduler, Campaign Delivery, Audience Builder, Marketing Segments, Marketing Automations, Marketing Templates, Email Templates, Meta Ads Config, Social Publishing (Social Studio con IA), Flow Builder, QR Campaigns.
- **Web Builder** (`/tenant/web`) — constructor de sitios web con IA + CRO.
- **Observability/Reports avanzados**: Observability Center, Executive Reports, Deep BI Suite, Audit Logs.
- **Cajero/POS Terminal completo**: `/tenant/administracion/*` cuando actúa como caja registradora física.

### 5.3 Filtro adicional de la app móvil
Para simplificar y ser productiva:
- Vista lista → detalle → acción rápida (llamar / WhatsApp / agendar / avanzar etapa).
- Búsqueda global de contactos/leads/citas.
- Modo offline básico (cache de lectura con SWR/React Query).
- Notificaciones push nativas cuando llega lead/mensaje nuevo o cita próxima.

---

## 6. APIs relevantes para la app móvil (ya existen en el backend, `/api/*`)

Todas requieren cookie `ca_access` o header `Authorization: Bearer` (compatibilidad).
La app móvil NO puede usar cookies HttpOnly con la misma facilidad → **usar Bearer token en `Authorization` header** (el backend ya lo acepta como fallback).

### 6.1 Auth
- `POST /api/auth/login` — email, password, turnstile_token
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/mfa/verify`, `POST /api/mfa/enable`, `POST /api/mfa/disable`

### 6.2 CRM
- `GET/POST /api/tenant/crm/leads` (list, create, filter by status/source/assigned_to)
- `GET/PATCH /api/tenant/crm/leads/{id}`
- `POST /api/tenant/crm/leads/{id}/convert` (a deal)
- `GET/POST /api/tenant/crm/deals` (pipeline por vertical)
- `PATCH /api/tenant/crm/deals/{id}/stage` (avanzar etapa)
- `GET/POST /api/tenant/crm/tasks`
- `GET/POST /api/tenant/crm/contacts`
- `GET /api/tenant/crm/contacts/{id}/timeline`
- `POST /api/tenant/assignment/round-robin` (asignar lead)

### 6.3 Inbox / Conversaciones
- `GET /api/tenant/inbox/conversations` (filtros: canal, unread, assigned_to, status)
- `GET /api/tenant/inbox/conversations/{id}/messages` (tail incremental)
- `POST /api/tenant/inbox/reply` (envía por WhatsApp/Meta/IG/LinkedIn/Email según canal)
- `POST /api/tenant/inbox/conversations/{id}/takeover` (IA suspende, humano toma)
- `POST /api/tenant/inbox/conversations/{id}/ai-mode` (auto/suggest/disabled)
- `POST /api/tenant/inbox/conversations/{id}/summary` (IA resumen del hilo)
- `POST /api/tenant/inbox/conversations/{id}/transfer` (a otro vendedor)

**Canales soportados en Inbox** (`InboxConversation.channel`):
`whatsapp` · `facebook_dm` · `facebook_wall` · `instagram_dm` · `instagram_wall` · `linkedin_wall` · `email` · `voice_call` · `sms` (Twilio).

### 6.4 Agenda
- `GET /api/tenant/agenda/appointments` (rango de fechas, filtros por servicio/recurso)
- `POST /api/tenant/agenda/appointments`
- `PATCH /api/tenant/agenda/appointments/{id}` (reagendar, cancelar, marcar attended)
- `GET /api/tenant/agenda/services`
- `GET /api/tenant/agenda/resources`
- `GET /api/tenant/agenda/availability` (huecos disponibles)

### 6.5 Catálogo (solo lectura desde móvil v1)
- `GET /api/tenant/business/catalog/items`
- `GET /api/tenant/business/catalog/items/{id}`
- `GET /api/tenant/business/catalog/categories`
- Item types por vertical: `service`, `package`, `product`, `membership`, `treatment`, `class`, `unit`, `property`.

### 6.6 Dashboard
- `GET /api/tenant/business-hub/summary`
- `GET /api/tenant/observability/dashboard` (KPIs del rol autenticado; role-scoped)

### 6.7 Push notifications (a construir en backend)
Actualmente el Trigger Engine emite eventos vía WhatsApp al vendedor. Para la app móvil habría que agregar:
- `POST /api/tenant/mobile/register-device` (fcm_token, device_id, platform iOS/Android)
- `DELETE /api/tenant/mobile/register-device/{id}`
- Hook en Trigger Engine → despachar a FCM/APNs además de WhatsApp.

---

## 7. Integraciones externas ya cableadas (el móvil las consume vía backend)

| Integración | Provider(s) | Estado | Uso desde móvil |
|---|---|---|---|
| WhatsApp | Evolution API (managed + external), Meta Cloud API, Gupshup, Twilio | Producción | Inbox reply, mensajes a lead |
| Facebook Messenger / Wall | Meta Graph API + webhooks | Producción | Inbox reply, comentarios |
| Instagram DM / Wall | Meta Graph + Instagram Login separado | Producción | Inbox reply, comentarios |
| Meta Ads | Marketing API (campañas, conjuntos, anuncios, píxel, WhatsApp destino) | Producción | Solo lectura de leads generados |
| LinkedIn Pages | Community Management API + webhooks | Producción | Inbox comentarios |
| TikTok Login Kit | OAuth v2 | Connect-only | (Sin uso en móvil v1) |
| Voz IA | Twilio + streaming realtime | Producción | Disparar llamadas (opcional v2) |
| Email | SendGrid + Resend + SES + Mailgun (registry) | Producción | Enviar respuestas / notif |
| Google Calendar | OAuth + Calendar API | Producción | Sync agenda 2-way |
| Storage | Cloudflare R2 (multi-tenant, cuotas por plan) | Producción | Adjuntos, media, avatares |
| Pagos POS | Mercado Pago + Stripe (adapters) | Producción | POS opcional v2 |
| IA | Gemini 3, Claude Sonnet 4.5, GPT-5.x (gateway común) | Producción | Respuestas IA, resúmenes |

---

## 8. Recomendación de stack para la app móvil (a decidir con el usuario)

El usuario respondió "que yo recomiende" en la pregunta de stack. Análisis:

### Opción A — **React Native + Expo** ⭐ RECOMENDADA
**Pros**:
- El equipo del SaaS ya trabaja React 19 → reutiliza mental model, hooks, patrones.
- Reutiliza `axios`, `zustand`, `swr`, `zod`, `date-fns`, `framer-motion` (motion/react-native), lucide-react-native.
- Shadcn/UI no existe nativo pero hay equivalentes (Tamagui, gluestack-ui, NativeWind con Tailwind).
- Expo Notifications (FCM+APNs), Expo Camera (QR/adjuntos), Expo Contacts (importar), OTA updates.
- Compatible con backend FastAPI actual sin cambios (solo Bearer token en Authorization header).
- Build único → iOS + Android.
- **Contras**: peso del bundle inicial, algo de latencia en listas grandes.

### Opción B — Flutter
**Pros**: performance nativo, UI súper pulida, Material 3.
**Contras**: **el equipo tendría que aprender Dart**, ecosistema separado del SaaS actual, más divergencia código-conocimiento.

### Opción C — PWA mobile-first
**Pros**: cero app store, actualización instant, reutiliza el frontend React 19 tal cual.
**Contras**: sin push nativo confiable en iOS (WebPush llegó en iOS 16.4 pero limitado), sin acceso a contactos/cámara nativa completos, no se ve "profesional" para ventas de campo.

### Recomendación final
**React Native con Expo (managed workflow) + NativeWind (Tailwind) + Zustand + React Query + Expo Notifications**. Es lo que menos fricciona con el SaaS existente y da la mejor experiencia móvil en 4-6 semanas de trabajo.

---

## 9. Arquitectura propuesta de la app móvil (borrador para validar con el usuario)

```
CavernicolAppMobile/
├── app/                         # Expo Router
│   ├── (auth)/
│   │   ├── login.tsx
│   │   ├── forgot-password.tsx
│   │   └── mfa.tsx
│   ├── (tabs)/                  # Bottom tabs
│   │   ├── dashboard.tsx        # KPIs del día
│   │   ├── inbox.tsx            # Conversaciones (bandeja unificada)
│   │   ├── crm.tsx              # Leads + Pipeline
│   │   ├── agenda.tsx           # Calendario / Hoy
│   │   └── more.tsx             # Perfil, notif, logout
│   ├── inbox/[conversationId].tsx
│   ├── crm/lead/[leadId].tsx
│   ├── crm/deal/[dealId].tsx
│   ├── agenda/appointment/[id].tsx
│   └── contact/[contactId].tsx
├── src/
│   ├── api/                     # axios client + interceptors (auth, refresh)
│   ├── queries/                 # React Query hooks
│   ├── stores/                  # Zustand (auth, ui, drafts)
│   ├── components/              # UI primitives (NativeWind + reuse patterns of SaaS)
│   ├── screens/                 # Pantallas grandes
│   ├── lib/                     # utils, formatters, i18n
│   └── constants/               # endpoints, verticalConfig, roleConfig
├── assets/
├── app.json / eas.json
└── package.json
```

**Principios UX**:
- Diseño consistente con el SaaS web (paleta `#F72585` primario, `#0F172A` texto, `#F8F9FA` fondo, `#E2E8F0` bordes — extraídos de `TenantLayout.js`).
- Bottom tabs de 5 pestañas.
- Cada acción tiene atajo rápido (llamar, WhatsApp, avanzar etapa) con haptic feedback.
- Search global en top bar.
- Notificaciones push agrupadas por conversación/lead.
- Modo oscuro opcional (`next-themes` equivalente).

---

## 10. Estado actual y próximas acciones

### ✅ Hecho en esta sesión (E1 · jul 24, 2026) — Formulario "Nueva Cita" (P0)
- **Feature P0 completada**: formulario real "Nueva Cita" en la Agenda, reemplazando el stub `Alert`.
  - Nuevo `src/components/ui/BottomSheet.tsx` — hoja inferior Cyberpunk reutilizable (RN `Modal` + `Animated` + `PanResponder`, borde superior gradiente flame→magenta sobre obsidian, drag-handle para cerrar, `KeyboardAvoidingView`). **Cero dependencias nuevas** (no reanimated: se descartó porque su setup web exige envolver `metro.config.js`, archivo protegido, y rompe en Expo Go SDK 52).
  - Nuevo `src/components/ui/Toast.tsx` — `ToastProvider` global (montado en `app/_layout.tsx`) + hook `useToast()`, animado con RN `Animated`.
  - Nuevo `src/components/agenda/NewAppointmentSheet.tsx` — form de 6 pasos: Cliente/Lead (typeahead sobre `listLeads`), Servicio (chips), Fecha (chips 14 días), Slot de horario (grid agrupado por hora desde `getAvailability`), Recurso (opcional), Notas (multiline). CTA "CREAR CITA" → `createAppointment`.
  - Data mock extendida en `src/api/mockData.ts`: `MOCK_SERVICES`, `MOCK_RESOURCES`, `buildMockAvailability()` (slots 09–19h c/30min, marca no disponibles los solapes + comida 14:00), `createMockAppointment()`. Contrato idéntico a `BACKEND_MOBILE_SPEC.md` — al poner `MOCK_MODE=false` solo se cambia la rama de red.
  - `src/api/agenda.ts`: `listServices`/`listResources` ahora devuelven mocks; añadidos `getAvailability()` y `createAppointment()`.
  - `src/hooks/useAgenda.ts`: añadidos `useAvailability()` y `useCreateAppointment()` (invalidan `appointments`/`agenda-status`/`availability`).
  - `app/(tabs)/agenda.tsx`: FAB abre la hoja; al crear → cierra + toast verde "Cita creada correctamente" + haptic Success + refetch.
- **Fix de login para QA/preview web**: `SlideToConfirm` ahora ofrece **tap-to-confirm SOLO en web** (`Platform.OS==='web'`). iOS/Android conservan el gesto de arrastre. Necesario porque el ResponderSystem de react-native-web ignora eventos sintéticos (bloqueaba el testing automatizado).
- **Package drift alineado a SDK 52**: `expo-linear-gradient` → `~14.0.2`, `@expo/vector-icons` → `~14.0.4` (vía `yarn expo install`). `react-native` se deja en 0.76.5 (pin SDK 52; no se actualiza).
- **Code review biometría** (`biometric.ts` + `login.tsx`): OK. Fallback web correcto, cancelación silenciosa, invalidación por credenciales obsoletas y opt-in tras primer login funcionan como se espera.
- **Testing**: `testing_agent` frontend — **14/14 checkpoints PASS** (login ambos roles, typeahead, servicio, fecha, slots disponibles/deshabilitados incl. comida 14:00, recurso, notas, submit+toast+creación, dismissal backdrop/close, view toggles, RBAC vendedor "MÍAS"). Lint + `tsc --noEmit` limpios.
- **Entorno Emergent**: código en `/app/mobile/` (respetado); `/app/frontend` es un symlink → `/app/mobile` para que el preview del supervisor (puerto 3000, dir `/app/frontend`) sirva la app móvil. Vars de packager (`EXPO_PACKAGER_PROXY_URL`, etc.) añadidas a `/app/mobile/.env`.

### 🔜 Próximas acciones sugeridas (backlog)
- **P1**: rediseñar pantallas de detalle (Conversation, Lead, Appointment) al estilo Cyberpunk.
- **P1**: confirmación de depósito en Nueva Cita (campo `deposit_paid`/monto) cuando el spec de pago móvil esté definido.
- **P1**: cuando Grok/Claude aprueben `BACKEND_MOBILE_SPEC.md` e implementen `/api/mobile/*`, cambiar `EXPO_PUBLIC_MOCK_MODE=false` y validar contratos (availability + POST appointments).
- **P2**: migrar deprecaciones RN Web (`pointerEvents`, `shadow*`) a `style`.
- **P2**: setup EAS real (`eas init` + credenciales) para builds iOS/Android.

### ✅ Hecho en sesión previa (jul 2026)
- Deploy key SSH read-only generada y usada para clonar el repo privado `SAAS-CavernicolApp` en `/tmp/cavernicol-analysis` (fuera de `/app`, sin tocar producción).
- Análisis completo: 842 archivos, 159 ADRs, 105 migraciones Alembic, ~200 sprints/hotfixes documentados.
- Mapa de módulos → clasificación productivo vs administrativo.
- **Bootstrap completo de la app móvil en `/app/mobile/`**:
  - Expo SDK 52 + React Native 0.76 + Expo Router 4 (typed routes)
  - NativeWind 4 (Tailwind), React Query 5, Zustand 5, Expo SecureStore, Expo Notifications
  - TypeScript estricto — **0 errores de tipo**, build web exitoso (15 pantallas)
  - 5 tabs: Dashboard · Inbox · CRM · Agenda · Perfil
  - 3 pantallas detalle: Conversation chat · Lead detail · Appointment detail
  - 3 pantallas auth: Login · MFA · Forgot password
  - **Filtrado por rol automático**: `useAuthStore.assignedToFilter()` inyecta `?assigned_to=<user_id>` en todos los hooks (`useLeads`, `useDeals`, `useTasks`, `useConversations`, `useAppointments`) SALVO cuando el rol es `tenant_owner`/`tenant_admin`.
  - Guard en login: usuarios de plataforma (`super_admin`, etc.) son rechazados — la app es solo para tenant.
  - `eas.json` con perfiles preview/production para iOS+Android, bundle ID `com.dragontech.cavernicolapp.mobile`.
  - Assets placeholder (icon, adaptive-icon, splash, notification-icon, favicon).
  - README con instrucciones de setup, deploy y workflow audit-first.
- Este documento de memoria (`/app/memory/PRD.md`).

### ✅ Decisiones confirmadas por el usuario (jul 2026)
1. **Stack**: React Native + Expo + NativeWind + React Query + Zustand + Expo Notifications.
2. **Alcance v1**: **SOLO 4 módulos** — Dashboard, Inbox, CRM, Agenda. (Catálogo, POS, Voz IA → v2).
3. **Role-based visibility**: el usuario debe ver **solo su información** salvo que sea `tenant_owner`/`tenant_admin`. **El backend ya lo hace** — `/api/tenant/inbox/conversations` línea 175 valida `user.tenant_role not in ('tenant_owner', 'tenant_admin')` y filtra por `assigned_to`. `?assigned_to=me` supported en CRM/Inbox/Agenda.
4. **Publish target**: Android (Play Store) + iOS (App Store) via **EAS Build**. Bundle IDs propuestos: `com.dragontech.cavernicolapp.mobile` (ambos).
5. **Ubicación código**: `/app/mobile/` (misma raíz que el SaaS pero en carpeta separada — nunca se toca `/app/backend`, `/app/frontend`, `/app/docs`, ni otros archivos del SaaS).
6. **Backend NO se toca**: implementación 100% cliente. Push mockeadas hasta que Claude/Grok agreguen endpoints.
7. **Metodología de colaboración concurrente (formal desde jul 2026)** — ver sección 13.

### 📚 Sección 13 — Metodología de colaboración concurrente (audit-first + peer review)

**Colaboradores del proyecto:**
- **E1** (Emergent) — desarrollo del cliente móvil en `/app/mobile/` y esta memoria.
- **Grok** (Cursor) — implementador principal del SaaS en `/app/backend`, `/app/frontend`, etc.
- **Claude** (Cursor / Anthropic) — **auditor concurrente** del trabajo de E1 y de Grok. Actúa como revisor previo antes de que cualquier especificación llegue a manos del implementador.

**Reglas operativas (obligatorias para E1):**

1. **Audit-first antes de cualquier commit al `main` del SaaS**
   - `cd /tmp/cavernicol-analysis/SAAS-CavernicolApp && GIT_SSH_COMMAND="ssh -F /root/.ssh/config" git fetch --all`
   - Comparar `git rev-parse origin/main` con el HEAD registrado en esta memoria (sección "Última verificación de sync con el SaaS").
   - Si hay commits nuevos → revisar diff completo con especial atención a `backend/app/routers/{auth,crm,inbox,agenda}.py`, `backend/app/models/`, `backend/alembic/versions/`.
   - Adaptar el cliente móvil (`/app/mobile/`) si tocaron contratos.
   - Actualizar la fecha y HEAD en esta memoria.

2. **Audit-first al inicio de cada sesión de E1 y al final antes de decir "puedes hacer save"**.
   - Siempre 2 chequeos: apertura y cierre.

3. **Peer review por Claude antes de que cualquier especificación de backend llegue al implementador**
   - **Regla:** cualquier archivo bajo `mobile/docs/BACKEND_*` que pida superficie nueva de backend (endpoints, tablas, migraciones, dependencias, cambios en Trigger Engine) **DEBE ser compartido primero con Claude para revisión** antes de que el usuario lo pase a Grok/otro implementador.
   - El archivo debe incluir una sección **"Revisión para Claude"** al inicio con: tradeoffs, riesgos de seguridad, alternativas consideradas, superficie nueva enumerada, cambios en schemas existentes, y preguntas abiertas.
   - Solo tras el visto bueno explícito de Claude, el usuario pasa el spec a Grok.

4. **Restauración del estado del SaaS ante contaminación del pod**
   - Emergent puede auto-commitear cambios de normalización del pod (ej: URL fallback de tests, `.gitignore` duplicado). Antes de cada save a `main`:
     - Verificar `git status` en `/app`.
     - Cualquier archivo del SaaS marcado como modificado que E1 NO haya editado intencionalmente debe restaurarse con `git checkout <SaaS-remote-HEAD> -- <path>`.
     - Rebase con `git remote add saas file:///tmp/cavernicol-analysis/SAAS-CavernicolApp && git fetch saas main && git reset --soft saas/main` para que el push sea fast-forward.
     - `git remote remove saas` al terminar.

5. **Separación estricta de memorias**
   - `/app/memory/PRD.md` — propiedad de Grok/Claude (SaaS). **NUNCA modificar**.
   - `/app/memory/ROADMAP.md`, `CHANGELOG.md`, `META_INTEGRATION_STATE.md` — SaaS. **NUNCA modificar**.
   - `/app/memory/MOBILE_APP_PRD.md` — propiedad de E1. Sí actualizar cada sesión.
   - Cualquier cambio en la memoria del SaaS debe pasar por Grok con revisión de Claude.

6. **Convenciones del SaaS que se respetan (auditadas jul 2026)**
   - **Lockfiles NO se trackean** — `frontend/yarn.lock` y similares se dejan como untracked (o en `.gitignore` local).
   - **URL fallback de tests** — `https://nginx.preview.emergentagent.com` (nunca la URL del pod Emergent).
   - **Autoría de commits** — Emergent usa `emergent-agent-e1 <github@emergent.sh>`. No cambiar.
   - **Estructura de carpetas** — respetar exactamente: `backend/`, `frontend/`, `docs/`, `edge/`, `infra/`, `scripts/`, `memory/`, `tests/`. Solo agregar `mobile/`.

**Log de decisiones metodológicas:**
- **jul 2026** — Claude solicita ser revisor previo obligatorio de `mobile/docs/BACKEND_*.md` antes de handoff a Grok. Aceptado por E1 y registrado.

### 🚨 Blockers de backend detectados en audit (jul 2026)
1. **Login desde móvil**: tras S71, `/api/auth/login` requiere `turnstile_token` (Cloudflare Turnstile widget web) — imposible de generar en RN nativo sin webview. Response ya NO devuelve tokens en JSON (`class AuthResponse: no tokens in JSON — only cookies + user payload`). **Requiere endpoint mobile-friendly** en el SaaS (ej. `/api/mobile/auth/login` con App Attest/DeviceCheck en lugar de Turnstile + retorno de Bearer token). En el móvil actual: implementado con adapter **intercambiable** — modo dev con Bearer manual + modo prod (a esperar endpoint real).
2. **Push notifications**: no existe endpoint `/api/tenant/mobile/register-device` — se implementa MOCKED en cliente; el Trigger Engine actual solo despacha por WhatsApp/Email.
3. **CSRF token**: para requests que mutan (POST/PATCH/DELETE) el backend exige `X-CSRF-Token` header. En cookies-mode, la app tendría que leer `ca_csrf` (que NO es HttpOnly) y reenviarla. En bearer-mode habría que decidir cómo se maneja (posiblemente omitir CSRF cuando hay Authorization header).

### 📌 Última verificación de sync con el SaaS
- **Fecha:** jul 2026 (cuarto check — post slider fix)
- **HEAD analizado:** `18cbd7f8f87b` (Web module: AI SEO con LLM real — Grok/Claude, cierra punch list web)
- **Impacto en la app móvil:** ✅ CERO. Solo toca `backend/app/routers/web_tenant.py`, `services/web/ai_seo.py`, `frontend/src/pages/tenant/web/WebSiteEditor.js`. Ninguno de los routers que consume la app móvil (`auth`, `crm`, `inbox`, `agenda`) fue modificado.
- **Deploy key SSH activa:** `Emergent Read-Only (Cavernicol Mobile Analysis)` en GitHub
- **Repo local read-only:** `/tmp/cavernicol-analysis/SAAS-CavernicolApp` (efímero — reclonar tras cada reinicio del pod)

### 🎨 Rediseño cyberpunk (jul 2026) — v0.2
El usuario compartió designs en Stitch (`stitch_cyberpunk_cavern_colapp_redesign.zip`) y pidió apegarse a ellos. Se rediseñó toda la app con:
- **Paleta**: fondo `#000000` (OLED black), cards `#0F0F0F` con border `#1A1A1A`, gradient primario `#FF5637 → #FF45A1` (naranja fuego → magenta), tertiary `#FFBA20` (amber).
- **Tipografía**: Sora (display/heading) + Inter (body) + Geist (labels uppercase con tracking wide) — cargadas vía `@expo-google-fonts/*`.
- **Componentes rediseñados**: Text (con soporte de fuentes multi-family), Button (variant primary con LinearGradient), Input (dark con focus magenta), Card (obsidian-surface con border), Badge (chip uppercase Geist), Logo (con isotipo real de Stitch).
- **Pantallas rediseñadas**: login, mfa, forgot-password, dashboard (KPIs verticales + attention + conversion chart), inbox (search + filter chips + conv rows con avatar+channel dot), crm (gradient btn Nuevo Lead + tabs + lead cards con SCORE), agenda (date strip con día activo en gradient), profile.
- **Assets regenerados**: icon.png, adaptive-icon.png, splash.png, favicon.png, notification-icon.png con background negro y letras en gradient.

### 🔧 Iteración v0.2.1 (jul 2026) — feedback del usuario
1. **Login: banner de mock removido** — el rol lo determina el backend en el login, no debe haber selección visible. La app en producción no muestra credenciales demo. En mock mode los usuarios `owner@demo.mx` / `vendedor@demo.mx` con password `demo123` siguen funcionando pero solo están documentados en README y `.env.example`.
2. **Dashboard: chip "Nuevo Lead" arreglado** — se deformaba en web por conflicto de `rounded-pill` de nativewind con LinearGradient. Fix: `borderRadius: 9999` inline en el gradient + `self-start` en el Pressable padre.
3. **Agenda: 4 vistas implementadas** — el usuario pidió "todas las funciones del sistema":
   - **Vista DÍA**: timeline vertical horas 8-20 + strip de 14 días navegable, citas con borde magenta izquierdo posicionadas en su hora.
   - **Vista SEMANA**: grid horizontal 7 días con dots por citas, resumen semanal (Total/Confirmadas/Pendientes) + lista completa.
   - **Vista MES**: mini-calendario navegable ← → con día actual (borde magenta) + día seleccionado (flame fill) + dots por día con citas + resumen mensual.
   - **Vista LISTA**: próximas 14 días con hora prominente + fecha + status badge.
   - **FAB flotante** "Nueva Cita" con gradient + haptic feedback + shadow magenta glow — abre stub del formulario de creación (a implementar en v0.3 con `POST /api/tenant/agenda/appointments` + slot picker de `/availability`).
   - **HOY button** en top bar para volver rápido al día actual.
- APIs del SaaS ya disponibles para expandir en v0.3: `POST /appointments`, `GET /services`, `GET /resources`, `GET /availability`, `GET /waitlist`, `POST /blocks`.

---

## 11. Datos legales para incluir en la app móvil

- **Aviso de Privacidad**: LFPDPPP México. Responsable **Dragon Technologies S.A.P.I. de C.V.**, corresponsable **Dragon Technologies LLC**. Contacto ARCO: `contacto@cavernicolacreativo.com`.
- **Términos**: uso aceptable, planes MXN, integraciones terceros, PI, limitación responsabilidad, jurisdicción CDMX.
- URLs canónicas: `https://cavernicolapp.com/terminos`, `https://cavernicolapp.com/privacidad`.
- Deben aparecer en el **onboarding** de la app y en **Perfil → Legal**.

---

## 12. Referencias en el repositorio analizado

- **Repo local (temporal, solo lectura)**: `/tmp/cavernicol-analysis/SAAS-CavernicolApp/`
- **Docs clave leídas**:
  - `README.md`
  - `memory/PRD.md`, `memory/ROADMAP.md`, `memory/CHANGELOG.md`
  - `docs/ARCHITECTURE.md`
  - `docs/SPRINT_STATUS.md` (estado global del proyecto)
  - `docs/SPRINT_REGISTRY.md` (mapa completo de sprints)
  - `docs/SOFTWARE_AS_PRODUCT.md`
  - `docs/MODULE_RELATIONSHIP_MAP.md`
  - `docs/BILLING_AND_ENTITLEMENTS.md`
  - `docs/ENVIRONMENT.md`
  - `docs/ADR-001` a `ADR-159` (decisiones arquitectónicas)
- **Frontend layouts**: `TenantLayout.js`, `AdminLayout.js`, `CrmHubLayout.js`, `InboxHubLayout.js`, `AgendaHubLayout.js`, `BusinessHubLayout.js`, `MarketingHubLayout.js`, `SocialAdsHubLayout.js`, `ReportsHubLayout.js`, `AdministracionHubLayout.js`, `AIHubLayout.js`.
- **Backend routers**: `auth.py`, `crm.py`, `inbox.py`, `agenda.py`, `business_hub.py`, `assignment.py`, `triggers.py`, `mfa.py`, `contacts.py`, `oauth.py` (y ~55 más).

**Deploy key SSH temporal a eliminar cuando termine el proyecto** (Settings → Deploy keys → "Emergent Read-Only (Cavernicol Mobile Analysis)").

---

## 13. Historial de cambios recientes

### feb 2026 — Biometría + refinamiento del slide-to-confirm
- **Nueva feature: Login biométrico (Face ID / Touch ID / Huella)** — Implementado con `expo-local-authentication@15.0.2` + `expo-secure-store`. Archivo helper: `/app/mobile/src/lib/biometric.ts`.
  - Detecta hardware (`hasHardwareAsync`) + enrolamiento (`isEnrolledAsync`) + tipo de biometría (`FACIAL_RECOGNITION` / `FINGERPRINT` / `IRIS`).
  - Guarda credenciales en Keychain (iOS) / Keystore (Android) tras opt-in del usuario.
  - Auto-prompt al abrir la app si biometría está activa (con delay 350ms para evitar flash).
  - Botón dedicado arriba del slider: "ENTRAR CON FACE ID / TOUCH ID" (color flame + ícono contextual).
  - Fallback graceful: cancelación silenciosa; credenciales obsoletas → invalidan biometría automáticamente.
  - Web fallback: `Platform.OS === 'web'` retorna disponibilidad `none` → botón oculto.
- **UI fix del SlideToConfirm**: Texto "DESLIZA PARA INGRESAR" movido debajo del slider y centrado. Se agregó prop `labelPosition="below"` (default). Dentro del track queda solo el hint de triple-chevron.
- **app.json**: agregado plugin `expo-local-authentication` con `faceIDPermission` en español + `NSFaceIDUsageDescription` en `infoPlist`.

_Última actualización: feb 2026 · Análisis realizado sin tocar código de producción._
