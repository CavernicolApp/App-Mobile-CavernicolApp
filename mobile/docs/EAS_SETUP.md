# EAS Setup — Guía paso a paso

> **Estos comandos NO puedo ejecutarlos yo** porque requieren autenticación interactiva
> con tu cuenta de **Expo**, **Apple Developer** y **Google Play Console**.
> Los ejecutas tú desde tu máquina local (Mac/Linux/Windows).

## 0. Prerrequisitos (una sola vez, en tu máquina)

```bash
# 1. Node 20+ y yarn instalados
node --version   # >= 20.x
yarn --version   # >= 1.22

# 2. Clonar este proyecto móvil a tu máquina
# (o descargar la carpeta /app/mobile del pod)
cd ~/proyectos
# Aquí traes el proyecto de este pod a tu máquina — 3 opciones:
#   a) Emergent → botón "Save to Github" → clonas de tu repo
#   b) Descargar como ZIP desde Emergent
#   c) scp -r desde el pod si tienes acceso SSH al VPS

cd cavernicolapp-mobile
yarn install

# 3. Instalar EAS CLI global
npm install -g eas-cli
eas --version
```

## 1. Cuenta Expo + login

Si aún no tienes cuenta Expo:
- Ve a https://expo.dev/signup y crea una con el email corporativo de Dragon Technologies
  (recomendado: `dev@cavernicolacreativo.com` o similar).
- La cuenta es **gratuita** hasta cierto volumen de builds.

```bash
eas login
# Te pedirá email + password (o SSO)
eas whoami
# Debe mostrar tu username
```

## 2. Inicializar el proyecto en EAS

```bash
cd cavernicolapp-mobile
eas init
```

- Te preguntará si crear un proyecto nuevo → **Yes**.
- Te propondrá un slug (`cavernicolapp-mobile`) → **acepta** o cambia por `cavernicolapp` (debe coincidir con `expo.slug` en `app.json`).
- Te devolverá un `projectId` tipo `abc12345-6789-4def-abcd-ef1234567890`.

**Copia ese `projectId` a `app.json`:**
```jsonc
{
  "expo": {
    // ...
    "extra": {
      "eas": {
        "projectId": "PEGA_AQUI_EL_projectId_QUE_TE_DIO_eas_init"
      }
    }
  }
}
```

## 3. Configurar credenciales

### 3a. Android (Google Play)

**Necesitas antes:**
- Cuenta en Google Play Console ($25 USD una sola vez): https://play.google.com/console/signup
- Crear una **App nueva** en Play Console con el package `com.dragontech.cavernicolapp.mobile`.
- Crear un **Service Account** para automatizar submits:
  1. Play Console → Setup → API access → Choose a Google Cloud Project → Create/Link
  2. Create service account → nómbrala `eas-submit-cavernicolapp`
  3. Grant permissions: **Release manager**
  4. Create Key (JSON) → descarga el archivo
  5. Guárdalo como `secrets/play-service-account.json` en el proyecto (¡nunca a git!)

```bash
mkdir -p secrets
mv ~/Downloads/eas-submit-cavernicolapp-xxxxx.json secrets/play-service-account.json
```

EAS genera y guarda automáticamente el keystore Android cuando corras tu primer build.

### 3b. iOS (App Store)

**Necesitas antes:**
- Cuenta Apple Developer ($99 USD/año): https://developer.apple.com/programs/
- Crear el App ID en https://developer.apple.com/account/resources/identifiers/list
  - Bundle ID: `com.dragontech.cavernicolapp.mobile`
  - Habilitar **Push Notifications** capability
- Crear la app en App Store Connect: https://appstoreconnect.apple.com
  - Anota el **App Store Connect App ID** (número tipo `1234567890`)
  - Anota tu **Apple Team ID** (10 caracteres tipo `ABC1DEF234`)

**Actualiza `eas.json`:**
```jsonc
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "TU_APPLE_ID@ejemplo.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABC1DEF234"
      }
    }
  }
}
```

**Deja que EAS genere los certificados y provisioning profiles automáticamente:**
```bash
eas credentials
# → Select platform: iOS
# → Select build profile: production
# → EAS te pedirá tu Apple ID + password
# → Confirma que EAS genere el Distribution Certificate + Push Notification Certificate + Provisioning Profile
```

## 4. Primer build de prueba

```bash
# Preview interno (APK Android + Simulador iOS)
yarn eas:build:preview

# EAS te va a mostrar un link tipo https://expo.dev/accounts/xxx/projects/cavernicolapp-mobile/builds/yyy
# El build tarda ~15-25 min. Al terminar, descargas el APK y lo instalas en tu Android
# para probar. Para iOS necesitas subirlo a TestFlight con `eas submit`.
```

## 5. Submit a stores

**Solo hazlo después de que el backend tenga los 3 endpoints mobile** (`login`, `refresh`, `register-device`) — de lo contrario la app va a fallar el review de Apple.

```bash
yarn eas:build:production
# Espera a que termine el build
yarn eas:submit:android    # Sube a Play Console Internal Testing
yarn eas:submit:ios        # Sube a TestFlight
```

## Costos totales para deploy en tiendas

| Concepto | Costo | Frecuencia |
|---|---|---|
| Apple Developer Program | $99 USD | anual |
| Google Play Console | $25 USD | una sola vez |
| Expo Free tier | $0 | ilimitado hasta 30 builds/mes |
| Expo Production tier (opcional) | $29 USD/mes | si necesitas más builds |

## Troubleshooting común

- **"Invalid credentials"** en `eas login` → verifica que tu cuenta Expo tenga MFA configurado y usa `eas login --sso` si tu cuenta usa Google/GitHub SSO.
- **"Bundle ID already in use"** → alguien más ya registró el ID en Apple. Cambia a `com.dragontech.cavernicol.mobile` o similar en `app.json` + Apple Developer.
- **Build iOS falla con "No profile found"** → corre `eas credentials` y regenera el provisioning profile.
- **Build Android falla con "keystore mismatch"** → si ya subiste una versión, EAS necesita el keystore original; guárdalo con `eas credentials → Android → Keystore → Download`.

---

**Cuando termines los pasos 1 y 2**, comparte conmigo:
- El `projectId` que te dio `eas init`
- Tu `Apple Team ID` y `App Store Connect App ID`

Yo actualizo `app.json` y `eas.json` y te dejo todo listo para el primer build.
