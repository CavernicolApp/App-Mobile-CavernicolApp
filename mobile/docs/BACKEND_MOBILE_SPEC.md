# Backend Spec — Endpoints móviles para CavernicolApp Mobile

> **Estado:** 🔒 **PENDIENTE DE REVISIÓN POR CLAUDE** — no entregar a Grok hasta que Claude firme.
> **Audiencia final (post-review):** Grok (Cursor) trabajando en `github.com/CavernicolApp/SAAS-CavernicolApp`.
> **Objetivo:** exponer 3 endpoints móviles para que la app iOS/Android (`/app/mobile`)
> pueda autenticarse y recibir push notifications sin depender de widgets web (Turnstile) ni cookies HttpOnly.
> **Rama sugerida:** `feature/mobile-api-s72`.
> **Sprint sugerido:** S72 (Mobile API Foundation).

---

## 🔎 SECCIÓN DE REVISIÓN PARA CLAUDE (leer primero)

> Claude: este spec pide **superficie nueva de backend con implicaciones de seguridad crítica**.
> Antes de que el usuario lo pase a Grok, por favor valida los siguientes puntos y déjame
> saber si algún punto necesita repensarse.

### 1. Superficie nueva de backend que este spec pide

| Componente | Tipo | Riesgo | Justificación |
|---|---|---|---|
| `POST /api/mobile/auth/login` | Endpoint público | 🔴 ALTO — bypass parcial de Turnstile | RN no puede ejecutar el widget web de Turnstile sin WebView; se sustituye por App Attest (iOS) / Play Integrity (Android) |
| `POST /api/mobile/auth/refresh` | Endpoint público | 🟡 MEDIO — refresh en body | Necesario porque HttpOnly cookies no funcionan bien en RN sin `@react-native-cookies/cookies` + workarounds |
| `POST /api/tenant/mobile/register-device` | Endpoint autenticado | 🟢 BAJO | Solo guarda un token push por device_id de un usuario ya autenticado |
| `DELETE /api/tenant/mobile/register-device/{id}` | Endpoint autenticado | 🟢 BAJO | Idem al desregistrar |
| Tabla `mobile_devices` | Nueva tabla SQL | 🟢 BAJO | 1 sola tabla, 1 sola migración Alembic `0106` |
| Migración Alembic `0106_mobile_devices.py` | Nueva migración | 🟢 BAJO | No modifica tablas existentes |
| Servicio `mobile_attestation.py` | Nuevo módulo | 🟠 MEDIO-ALTO | Introduce dependencias externas: Apple `api.devicecheck.apple.com` + Google Play Integrity API |
| Servicio `expo_push.py` | Nuevo módulo | 🟢 BAJO | Cliente HTTP para Expo Push API pública |
| Cambio en `trigger_engine.py` | Extensión de módulo existente | 🟡 MEDIO | Se agrega dispatch a Expo push además de WhatsApp/Email — hay que revisar cómo se ordena la fan-out |
| Nueva config en `settings.py` | Extensión de módulo existente | 🟢 BAJO | Solo agrega variables `MOBILE_*`, `APPLE_*`, `EXPO_ACCESS_TOKEN` |

### 2. Tradeoffs de seguridad enumerados

**Login sin Turnstile (móvil)**
- **Tradeoff:** Se pierde la protección anti-bot que da Turnstile en la web. Se gana confianza de dispositivo con App Attest/Play Integrity.
- **Alternativas consideradas:**
  - (a) Turnstile en WebView oculto → rechazado: mala UX en RN, complejidad, fragilidad
  - (b) Solo rate limiting sin attestation → rechazado: expone el endpoint a credential stuffing más fácil que la web
  - (c) **Elegida: App Attest + Play Integrity** → estándar de industria (Netflix, Uber, la propia Meta lo hacen así)
- **Mitigación adicional propuesta:**
  - Rate limit móvil más estricto que web: 5 intentos/15min por device_id (vs 10/15min por IP en web)
  - Dummy bcrypt anti-enumeration ya usado en web debe replicarse tal cual
  - Log de attestation failures con alerta a `security_admin` si supera umbral

**Refresh token en body (móvil)**
- **Tradeoff:** Refresh viaja en JSON body en vez de HttpOnly cookie → posible XSS-exfil si la app tuviera un webview vulnerable.
- **Mitigación:**
  - En RN, guardamos refresh en **Expo SecureStore** (Keychain iOS / Keystore Android encriptado con hardware) — protección equivalente a HttpOnly.
  - Refresh rotativo por uso — si se roba, en el próximo uso legítimo se invalida.
  - **Refresh ligado a `device_id`** — un refresh de device A no vale para device B (defense in depth).

**Push notifications via Expo Push Service**
- **Tradeoff:** Los pushes pasan por servidores de Expo (`exp.host`) antes de llegar a FCM/APNs, agregando un intermediario.
- **Alternativa:** Enviar directo a FCM/APNs con SDKs de Google/Apple.
- **Decisión propuesta:** Empezar con Expo Push (más simple, gratis, se puede migrar después). El contenido de los pushes NO incluye PII sensible (solo `lead_id`, `deep_link`, contact name en título) — mismo criterio que WhatsApp notifications actuales.
- **Migración futura:** cuando la carga exceda 1000 pushes/día, migrar a FCM+APNs directo con `pyfcm` + `apns2`.

### 3. Preguntas abiertas que necesitan tu decisión, Claude

1. **¿Reemplazar `/api/auth/login` (post-S71) por un flag `mobile=true` en el mismo endpoint, o crear `/api/mobile/auth/login` separado?**
   - **Recomendación E1:** endpoint separado. Razón: aísla la superficie de attestation, permite rate-limit distinto, no complica la ruta principal.
   - **Contra:** duplicación de lógica de credenciales (mitigable extrayendo `_verify_credentials()` a servicio compartido).

2. **¿App Attest y Play Integrity son bloqueantes en producción o se aceptan como "soft-fail" con log?**
   - **Recomendación E1:** hard-fail en producción. Soft-fail solo con `settings.MOBILE_DEV_MODE=True`.
   - **Consideración:** hay reportes de que Play Integrity da falsos negativos en dispositivos rooteados legítimos y en emuladores oficiales. Considerar aceptar `MEETS_BASIC_INTEGRITY` como fallback si `MEETS_DEVICE_INTEGRITY` falla.

3. **¿La app móvil puede consumir `/api/auth/refresh` con `client=mobile` header o requiere endpoint dedicado `/api/mobile/auth/refresh`?**
   - **Recomendación E1:** endpoint dedicado. Razón: contract del refresh es distinto (body en vez de cookie, ligado a device_id).

4. **¿El refresh móvil debe durar 30 días o replicar el 7 días de web?**
   - **Recomendación E1:** 30 días. UX móvil requiere sesiones más largas (nadie quiere loggearse a diario en su app de trabajo). Compensamos con rotación por uso + revocación al desregistrar device.
   - **Contra:** ventana de exposición si SecureStore es comprometido. Aceptable dado protección de hardware.

5. **¿Los eventos que disparan push notifications (Trigger Engine) deben ser configurables por tenant o siempre "on" para los 4 canales propuestos?**
   - **Recomendación E1:** siempre-on al inicio (menor complejidad). Agregar toggle por usuario en `/tenant/mobile/notification-preferences` en v2.

6. **¿Cómo se maneja el logout desde web cuando el usuario tiene sesiones móviles activas?**
   - **Propuesta:** el logout de web invalida SOLO la sesión web. Para revocar todas las sesiones (incluidas móviles) hay que agregar botón "Cerrar todas las sesiones" en el perfil del SaaS (endpoint `/api/auth/sessions/revoke-all`).

7. **¿Cómo se comporta el filtro role-based cuando `assigned_to=me` no está seteado por el cliente?**
   - **Estado actual verificado (audit `0e8fcbf` / SaaS HEAD `5825e4d0`):**
     - ✅ `/api/tenant/inbox/conversations` (línea 175 `inbox.py`) → **enforce automático**: filtra por `assigned_to_user_id == user.id` cuando `user.tenant_role not in ('tenant_owner', 'tenant_admin')`.
     - ✅ `/api/tenant/agenda/appointments` (líneas 469-470 `agenda.py`) → **enforce automático**: `if not is_agenda_admin(user): q = q.where(AgendaAppointment.assigned_to_user_id == user.id)`.
     - ❌ `/api/tenant/crm/leads` (líneas 426-441 `crm.py`) → **NO enforce por rol**. Solo respeta el `?assigned_to=<id>` que envíe el cliente. Idéntico patrón en `/deals` y `/tasks`.
   - **Riesgo:** un `tenant_user` malicioso que llame `GET /api/tenant/crm/leads` sin filtro ve **todos los leads del tenant**. La app móvil está OK porque el hook `useLeads` siempre inyecta `?assigned_to=<user_id>`, pero cualquier cliente que no lo haga (por ejemplo, Postman con el JWT del user) tiene acceso indebido.
   - **Pregunta:** ¿Se corrige el bug de `/crm/*` en este mismo sprint S72 como parte del hardening móvil, o se levanta como CR (change request) separado que Grok debe atender antes/en paralelo?
   - **Recomendación E1:** corregir en S72. Agregar en `_apply_crm_filters()` o al inicio de `list_leads()`:
     ```python
     if getattr(user, 'tenant_role', None) not in ('tenant_owner', 'tenant_admin'):
         q = q.where(CrmLead.assigned_to_user_id == user.id)
     ```
   - **Impacto en compatibilidad:** revisar si el frontend web actual asume que un `tenant_manager` ve leads del equipo — si sí, agregar rol `tenant_manager` a `full_access` o crear un filtro por `branch_id`/`pool_id` en su lugar.

8. **¿ADR-160 o ADR-nnn para documentar la decisión de API móvil separada?**
   - **Propuesta:** ADR-160.

### 4. Cambios en dependencias del backend

Este spec agrega estas dependencias nuevas al `requirements.txt`:

```
httpx>=0.27           # ya está en el SaaS — solo verificar versión
cryptography>=42.0    # para verificar attestation JWTs de Play Integrity — verificar si ya está
pyjwt[crypto]>=2.8    # ya está en el SaaS
```

Y opcionalmente (si migramos de Expo Push a FCM/APNs directo en v2):
```
pyfcm>=1.5
apns2>=0.7
```

### 5. Impacto en el flujo actual de auth (S71 hardening)

- ✅ **NO se rompe la web** — todos los cambios son aditivos, no se toca `/api/auth/login` existente.
- ✅ **NO se rompe MFA** — el flujo `mfa_required` + `challenge_token` se replica idéntico en el path móvil.
- ✅ **NO se rompe rate limit web** — el path móvil tiene su propio rate limit.
- ⚠️ **Se comparte** `_verify_credentials()` con web (proponemos extraer a `services/auth_credentials.py`).
- ⚠️ **Se comparte** el sistema `auth_sessions` de S71 con web (Alembic `0097`). El path móvil agrega `device_platform` y `device_id` en la sesión.

### 6. Superficie de testing propuesta

- Tests unitarios para `mobile_attestation.py` (mocks de Apple/Google APIs)
- Tests de integración para los 4 endpoints nuevos
- Tests de contrato: JSON schema del response de `/api/mobile/auth/login` debe matchear con lo que la app RN espera (usar Pydantic + schema exportado a JSON para validar en cliente).
- Test de regresión: el flujo web sigue funcionando exactamente igual.
- Test de rate limit: 5 intentos fallidos en 15min por device_id → 429.
- Test de seguridad: refresh de device_id A no funciona en device_id B (invalidación explícita).

### 7. Estimación revisada

- Backend (endpoints + service + tabla + tests): **10-16 horas** (subida de 8-14h para incluir la extracción de `_verify_credentials()` y tests de contrato).
- Trigger Engine push dispatch: **4-6 horas**.
- QA + deploy staging: **3-5 horas**.
- **Total: 3-4 días** para un dev familiarizado con el codebase (subida de 2-3d).

### 8. Después de la revisión de Claude

Solo cuando Claude firme este spec, el usuario:
1. Pasa el archivo completo a Grok con la instrucción de iniciar Sprint S72.
2. Grok crea rama `feature/mobile-api-s72` desde `main`.
3. E1 hace audit-first cuando Grok mergee → verifica contratos vs. lo especificado → adapta el cliente móvil si hubo cambios.

---

## Contexto

Se está desarrollando una **app móvil productiva** en React Native + Expo que consumirá las APIs
existentes del SaaS para 4 módulos: **Dashboard, Inbox, CRM y Agenda**. El código de la app vive fuera
de este repo (en `github.com/CavernicolApp/CavernicolApp-Mobile` una vez lo migres, hoy en
un pod Emergent en `/app/mobile`).

### Blockers actuales detectados en audit del SaaS (HEAD `5825e4d0` — Web CRO Engine ADR-159)

1. `/api/auth/login` (post S71 Auth Hardening) **exige `turnstile_token`** de Cloudflare Turnstile — un widget web que no funciona en RN nativo sin WebView.
2. La respuesta **ya no devuelve tokens en JSON**, solo cookies `HttpOnly` `ca_access` y `ca_refresh` + CSRF `ca_csrf`. Los tokens en cookies HttpOnly funcionan mal en Expo (cookie jar limitado y sin auto-forward entre requests).
3. `/api/auth/refresh` **lee refresh solo de cookie** — un cliente móvil no puede setear una HttpOnly cookie.
4. No existe endpoint para registrar el **push token** (FCM/APNs) del dispositivo, ni integración con el **Trigger Engine** para despachar push además de WhatsApp/Email.

---

## Endpoints a implementar

### 1. `POST /api/mobile/auth/login`

Login sin Turnstile, con verificación de integridad del dispositivo (**App Attest** en iOS / **Play Integrity** en Android).

#### Request
```http
POST /api/mobile/auth/login
Content-Type: application/json
X-Device-Platform: ios | android
X-Device-Id: <UUID único del dispositivo, generado por la app y almacenado en SecureStore>
X-Device-Attestation: <JWT/blob de App Attest o Play Integrity>
X-App-Version: 0.1.0
X-Client: cavernicolapp-mobile

{
  "email": "user@empresa.com",
  "password": "***",
  "mfa_token": "123456"      // opcional, solo si el usuario tiene MFA habilitado
}
```

#### Response (200 OK)
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",
  "token_type": "Bearer",
  "access_expires_in": 900,        // 15 min
  "refresh_expires_in": 2592000,   // 30 días (mobile es más largo que web para UX)
  "user": {
    "id": "uuid",
    "email": "...",
    "name": "...",
    "user_type": "tenant",
    "tenant_id": "uuid",
    "tenant_role": "tenant_owner | tenant_admin | tenant_manager | tenant_user",
    "platform_role": null,
    "is_active": true,
    "timezone": "America/Mexico_City",
    "locale": "es-MX",
    "last_login_at": "2026-01-15T10:00:00Z",
    "created_at": "2025-06-01T00:00:00Z"
  }
}
```

#### Response (200 OK — MFA requerido)
```json
{
  "mfa_required": true,
  "challenge_token": "opaque-string-signed-jwt-15-min"
}
```
La app reintentará el mismo POST con `mfa_token` (6 dígitos TOTP) — el backend valida
`challenge_token` para atar la request al mismo intento.

#### Response (401 — credenciales inválidas)
Devolver **respuesta genérica** (anti-enumeration, ya lo hacen bien en web):
```json
{ "detail": "Credenciales inválidas" }
```

#### Response (403 — usuario no elegible para móvil)
```json
{ "detail": "Esta cuenta no tiene acceso a la app móvil.", "reason": "role_not_allowed" }
```
Rechazar:
- `user.user_type == 'platform'` (super_admin, billing_admin, etc.) — la app es solo para tenants
- `user.tenant_role == 'tenant_cajero'` — el cajero usa el POS terminal, no la app móvil
- `user.is_active == false`

#### Response (429 — rate limit)
Rate limit igual al de web (Redis + IP + email), con el mismo mensaje.

#### Verificación de integridad del dispositivo (`X-Device-Attestation`)

**iOS — App Attest** (Apple):
- Recibir el blob de attestation generado por `DeviceCheck.AppAttest` en el cliente.
- Validar contra `https://api.devicecheck.apple.com/v1/attestation` con el team ID de Dragon Technologies (`ABC1DEF234` — a llenar cuando lo tengas).
- Guardar el `keyId` del dispositivo en la tabla `mobile_devices` para futuras validaciones.

**Android — Play Integrity**:
- Recibir el JWT firmado por Google Play Services.
- Verificar con la API de Play Integrity (`https://playintegrity.googleapis.com/v1/{package}:decodeIntegrityToken`).
- Validar `verdict.appIntegrity == 'PLAY_RECOGNIZED'` y `deviceIntegrity == 'MEETS_DEVICE_INTEGRITY'`.

**Fallback dev mode**: aceptar cualquier `X-Device-Attestation` cuando `settings.MOBILE_DEV_MODE == True`
y devolver un warning en logs. **Nunca en producción.**

#### Behavior de la sesión
- Reutilizar el sistema existente de `auth_sessions` (Alembic `0097`).
- Marcar `session.device_platform = 'ios' | 'android'`.
- Marcar `session.device_id = X-Device-Id`.
- **NO** emitir cookies (`ca_access`, `ca_refresh`, `ca_csrf`) para requests que vienen con
  `X-Client: cavernicolapp-mobile`.
- Rotar refresh en cada uso (igual que en web).

---

### 2. `POST /api/mobile/auth/refresh`

#### Request
```http
POST /api/mobile/auth/refresh
Content-Type: application/json
X-Device-Id: <mismo device_id>
X-Client: cavernicolapp-mobile

{
  "refresh_token": "eyJhbGci..."
}
```

#### Response (200 OK)
```json
{
  "access_token": "eyJhbGci...",
  "refresh_token": "eyJhbGci...",   // rotado
  "token_type": "Bearer",
  "access_expires_in": 900,
  "refresh_expires_in": 2592000
}
```

#### Response (401)
```json
{ "detail": "Refresh inválido o expirado" }
```
Cuando el refresh es inválido o el `device_id` no matchea con el que emitió el refresh, invalidar
la sesión completa (defense in depth) y forzar re-login.

---

### 3. `POST /api/tenant/mobile/register-device`

Registrar/actualizar el push token del dispositivo (FCM para Android, APNs para iOS).
**Requiere JWT válido en `Authorization: Bearer`** — el usuario ya está autenticado.

#### Request
```http
POST /api/tenant/mobile/register-device
Authorization: Bearer <access_token>
Content-Type: application/json
X-Client: cavernicolapp-mobile

{
  "expo_push_token": "ExponentPushToken[xxxxxxxxxxxxx]",
  "device_id": "dev_abc123",
  "platform": "ios" | "android",
  "app_version": "0.1.0",
  "device_model": "iPhone 15 Pro",   // opcional
  "os_version": "17.2"                // opcional
}
```

#### Response (200 OK)
```json
{
  "id": "uuid-del-registro",
  "registered_at": "2026-01-15T10:00:00Z"
}
```

#### DELETE — desregistrar al logout
```http
DELETE /api/tenant/mobile/register-device/{device_id}
Authorization: Bearer <access_token>
```

#### Tabla nueva
```sql
CREATE TABLE mobile_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_id VARCHAR(64) NOT NULL,
    platform VARCHAR(16) NOT NULL,        -- 'ios' | 'android'
    expo_push_token VARCHAR(256) NOT NULL,
    apns_key_id VARCHAR(64),               -- iOS App Attest key
    device_model VARCHAR(128),
    os_version VARCHAR(32),
    app_version VARCHAR(32),
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, device_id)
);
CREATE INDEX idx_mobile_devices_user_active ON mobile_devices(user_id) WHERE is_active = true;
CREATE INDEX idx_mobile_devices_tenant ON mobile_devices(tenant_id);
```

Migración Alembic: `0106_mobile_devices.py` (siguiente después de `0105`).

---

## Cambios en el Trigger Engine

Cuando el Trigger Engine emite un evento post-commit
(`lead.created`, `conversation.message_inbound`, `appointment.upcoming_reminder`, `task.overdue`),
además de la ruta actual (WhatsApp/Email), agregar dispatch a **Expo Push Notification service**
(`https://exp.host/--/api/v2/push/send`) para todos los `mobile_devices` activos del usuario destinatario.

### Payload de push
```json
{
  "to": "ExponentPushToken[xxxxxxxxxxxxx]",
  "title": "Nuevo lead asignado",
  "body": "Juan Pérez desde WhatsApp Ads",
  "data": {
    "kind": "lead_assigned",
    "lead_id": "uuid",
    "deep_link": "cavernicolapp://crm/lead/uuid"
  },
  "priority": "high",
  "sound": "default",
  "channelId": "leads"   // Android channel
}
```

### Canales de notificación (Android)
- `leads` — leads nuevos y asignaciones
- `inbox` — mensajes entrantes
- `agenda` — recordatorios de citas
- `tasks` — vencimiento de tareas

### Deep links (universal links iOS + app links Android)
- `cavernicolapp://crm/lead/{lead_id}` → abre `/crm/lead/{leadId}` en la app
- `cavernicolapp://inbox/{conversation_id}` → abre `/inbox/{conversationId}`
- `cavernicolapp://agenda/appointment/{id}` → abre `/agenda/appointment/{id}`

### Rate limit por dispositivo
Máximo 60 pushes/hora por device_id (evita spamming al vendedor).

---

## Contract testing (a agregar en `backend/tests/`)

```python
# backend/tests/routers/test_mobile_auth.py
async def test_mobile_login_returns_bearer_token(client, seed_tenant_user):
    resp = await client.post("/api/mobile/auth/login",
        headers={
            "X-Client": "cavernicolapp-mobile",
            "X-Device-Platform": "ios",
            "X-Device-Id": "test-device-1",
            "X-Device-Attestation": "dev-bypass"  # settings.MOBILE_DEV_MODE=True in tests
        },
        json={"email": seed_tenant_user.email, "password": "secret"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["tenant_role"] in ("tenant_owner", "tenant_admin", "tenant_manager", "tenant_user")

async def test_mobile_login_rejects_platform_user(client, seed_platform_admin):
    resp = await client.post("/api/mobile/auth/login", ..., json={...})
    assert resp.status_code == 403
    assert resp.json()["reason"] == "role_not_allowed"

async def test_mobile_login_rejects_cajero(client, seed_cajero_user):
    resp = await client.post("/api/mobile/auth/login", ..., json={...})
    assert resp.status_code == 403

# backend/tests/routers/test_mobile_register_device.py
async def test_register_device_creates_row(client, mobile_authed_headers):
    resp = await client.post("/api/tenant/mobile/register-device",
        headers=mobile_authed_headers,
        json={
            "expo_push_token": "ExponentPushToken[test]",
            "device_id": "test-device-1",
            "platform": "ios",
            "app_version": "0.1.0"
        })
    assert resp.status_code == 200
    # Verificar en DB que existe la fila
```

---

## Filtros por rol — verificación (ya deberían estar OK según audit)

La app móvil espera que estos endpoints **ya filtren automáticamente por `assigned_to`** cuando el rol
no es `tenant_owner`/`tenant_admin`. Verifiqué en el audit que:

- ✅ `GET /api/tenant/inbox/conversations` — línea 175 de `inbox.py`:
  ```python
  if user.tenant_role not in ('tenant_owner', 'tenant_admin'):
      query = query.where(InboxConversation.assigned_to_user_id == user.id)
  ```
- ✅ `GET /api/tenant/crm/leads` — acepta `?assigned_to=<user_id>`
- ✅ `GET /api/tenant/agenda/appointments` — acepta `?assigned_to_user_id=<user_id>`

**Confirma que los tres siguen enforce esto post-cualquier refactor que hagan.** La app envía el filtro,
pero el backend debe enforce como defense in depth.

---

## Configuración nueva en `backend/app/settings.py`

```python
class Settings(BaseSettings):
    # ... existentes ...

    # Mobile API
    MOBILE_DEV_MODE: bool = False                    # skipea App Attest / Play Integrity
    APPLE_TEAM_ID: str | None = None
    APPLE_APP_ATTEST_KEY_ID: str | None = None
    GOOGLE_PLAY_INTEGRITY_JSON_KEY: str | None = None  # path o inline
    EXPO_ACCESS_TOKEN: str | None = None              # para llamar Expo Push API con más quota
    MOBILE_ACCESS_TOKEN_TTL_SECONDS: int = 900        # 15 min
    MOBILE_REFRESH_TOKEN_TTL_SECONDS: int = 2592000   # 30 días (más largo que web)
```

Actualizar `.env.example` y `docs/ENVIRONMENT.md`.

---

## Checklist para Claude/Grok

- [ ] Crear rama `feature/mobile-api-s72` desde `main`.
- [ ] Nuevo router `backend/app/routers/mobile_auth.py` con `/api/mobile/auth/login` y `/api/mobile/auth/refresh`.
- [ ] Nuevo router `backend/app/routers/mobile_devices.py` con `/api/tenant/mobile/register-device` (POST + DELETE).
- [ ] Nueva migración Alembic `0106_mobile_devices.py`.
- [ ] Servicio `backend/app/services/mobile_attestation.py` (App Attest + Play Integrity + dev mode).
- [ ] Servicio `backend/app/services/expo_push.py` (dispatch a Expo Push API, batching, retry).
- [ ] Actualizar `backend/app/services/trigger_engine.py` para invocar `expo_push.send()` además de WhatsApp/Email.
- [ ] Añadir tests en `backend/tests/routers/test_mobile_auth.py` y `test_mobile_devices.py`.
- [ ] Actualizar `backend/app/settings.py` + `.env.example` + `docs/ENVIRONMENT.md`.
- [ ] Escribir ADR-160 documentando la decisión de API móvil separada de la web.
- [ ] Actualizar `docs/ARCHITECTURE.md` y `memory/CHANGELOG.md` con el nuevo sprint.
- [ ] Deploy a staging + smoke test contra `/app/mobile` de Emergent (endpoint `EXPO_PUBLIC_API_URL` apuntando a staging).

## Info que necesitas de Ricardo (dueño del proyecto)

- `APPLE_TEAM_ID` (10 chars) — sale del Apple Developer Account
- `APPLE_APP_ATTEST_KEY_ID` — se genera al crear el key en Apple Developer Account
- `GOOGLE_PLAY_INTEGRITY_JSON_KEY` — archivo JSON del service account con permiso Play Integrity API
- `EXPO_ACCESS_TOKEN` — opcional pero recomendado, sale de https://expo.dev/accounts/[team]/settings/access-tokens

## Estimación

- Backend: **8-14 horas** de implementación + tests.
- Trigger Engine push dispatch: **4-6 horas**.
- QA + deploy staging: **3-5 horas**.
- **Total: 2-3 días** para un dev familiarizado con el codebase.

---
**Preparado por:** E1 (Emergent) trabajando en `/app/mobile`.
**Referencia del cliente móvil:** `github.com/CavernicolApp/SAAS-CavernicolApp` no tiene el código móvil — vive en pod Emergent hasta que se mueva a repo propio.
