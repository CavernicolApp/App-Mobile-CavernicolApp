# CavernicolApp Mobile — Módulo separado del SaaS

Esta carpeta `/mobile/` contiene la **app móvil productiva de CavernicolApp** para iOS + Android
(React Native + Expo SDK 52). Es un **módulo independiente** y **no toca** el código del SaaS
que vive en `/backend`, `/frontend`, `/docs`, etc.

## Fuente de verdad — archivos que SÍ pertenecen al mobile
- Todo dentro de `/mobile/` (código, assets, config, docs)
- `/memory/MOBILE_APP_PRD.md` (memoria del proyecto móvil)

## Archivos que NO pertenecen al mobile (propiedad del SaaS)
- `/backend/` — API FastAPI del SaaS (no tocar)
- `/frontend/` — UI web del SaaS (no tocar)
- `/docs/` — documentación técnica del SaaS
- `/memory/PRD.md`, `/memory/CHANGELOG.md`, `/memory/ROADMAP.md`, `/memory/META_INTEGRATION_STATE.md` — memoria del SaaS (propiedad de Grok/Claude)
- `/edge/`, `/infra/`, `/scripts/` — infraestructura del SaaS

## Flujo de trabajo entre Grok/Claude (SaaS) y E1 (Mobile)
1. Cuando E1 (Emergent) trabaja en `/mobile/`, hace un audit-first del HEAD del SaaS antes de
   cada save, comparando con el HEAD guardado en `/memory/MOBILE_APP_PRD.md`.
2. Cuando Grok/Claude cambian APIs del SaaS que impactan al mobile, deben notificar (via
   commit descriptivo + CHANGELOG) para que E1 adapte el cliente.
3. Los 3 endpoints móviles requeridos (`/api/mobile/auth/login`, `/api/mobile/auth/refresh`,
   `/api/tenant/mobile/register-device`) están especificados en
   `/mobile/docs/BACKEND_MOBILE_SPEC.md` — cópialo tal cual a Grok/Claude cuando decidas
   iniciar Sprint S72.

## Deploy targets
- Android (Google Play) — Package: `com.dragontech.cavernicolapp.mobile`
- iOS (App Store) — Bundle ID: `com.dragontech.cavernicolapp.mobile`
- Build system: EAS Build (ver `/mobile/docs/EAS_SETUP.md`)

## Setup rápido
```bash
cd /mobile
yarn install
npx expo start          # dev con Metro
# o
npx eas build --profile preview --platform all
```

Ver `/mobile/README.md` y `/mobile/docs/EAS_SETUP.md` para detalles.
