# CavernicolApp Mobile

App móvil productiva (Ventas / Operación) del SaaS CavernicolApp.
React Native + Expo SDK 52 · TypeScript · NativeWind · Zustand · React Query.

## Setup
```bash
cd mobile
yarn install
yarn start
```

Requiere `mobile/.env` con:
```
EXPO_PUBLIC_API_URL=https://app.cavernicolapp.com
EXPO_PUBLIC_DEV_MODE=true
EXPO_PUBLIC_DEBUG=false
EXPO_PUBLIC_MOCK_MODE=true
```

## Estado actual (feb 2026)
- Módulos: Dashboard, Inbox, CRM, Agenda (4 vistas: día/semana/mes/lista).
- Login con Slide-to-Confirm + **Biometría (Face ID / Touch ID)** — `expo-local-authentication` + `expo-secure-store`.
- Tema "Cyberpunk" (Sora/Geist fonts, gradientes flame/magenta sobre obsidian).
- Backend: **MOCK_MODE** activo (`src/api/mockData.ts`) hasta que Grok implemente endpoints móviles en el SaaS.
- Credenciales de prueba: ver `memory/test_credentials.md`.

## Documentos clave
- `memory/MOBILE_APP_PRD.md` — memoria completa del proyecto (arquitectura, RBAC, sprints, backlog).
- `memory/test_credentials.md` — cuentas mock.
- `mobile/docs/BACKEND_MOBILE_SPEC.md` — spec de endpoints móviles para el equipo del SaaS.
- `mobile/docs/HANDOFF_PROTOCOL.md` — protocolo audit-first (no relevante en este repo aislado, se mantiene por referencia).

## Backend colaborador
El SaaS vive en repo separado: `github.com/CavernicolApp/SAAS-CavernicolApp` — **NO** trabajar sobre él desde este repo.

## Próximos pasos (P0/P1)
- Cambiar `EXPO_PUBLIC_MOCK_MODE=false` cuando el SaaS exponga `/api/mobile/*`.
- Aplicar feedback de Claude sobre `BACKEND_MOBILE_SPEC.md`.
- Implementar formulario real "Nueva Cita" con slot picker (`GET /availability`).
- Rediseñar pantallas de detalle (Conversation, Lead, Appointment) al estilo Cyberpunk.
- Setup EAS (`eas init` + credenciales) para builds reales iOS/Android.
