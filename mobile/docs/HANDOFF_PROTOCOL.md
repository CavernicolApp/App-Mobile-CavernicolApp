# Cómo entregar este spec — Handoff Protocol

Este documento **NO va directo a Grok**. Sigue este flujo obligatorio.

## Flujo formal

```
       ┌──────────────────┐
       │   E1 (Emergent)   │
       │  crea/actualiza  │
       │ BACKEND_*_SPEC.md│
       └────────┬─────────┘
                │
                ▼
       ┌──────────────────┐
       │ Usuario pasa el  │
       │  spec a Claude   │  ← ESTE PASO ES OBLIGATORIO
       │  para revisión   │
       └────────┬─────────┘
                │
        ¿Claude aprueba?
         ┌──────┴──────┐
         │             │
        NO            SÍ
         │             │
         ▼             ▼
    ┌────────┐   ┌────────────┐
    │ Volver │   │ Usuario    │
    │ a E1   │   │ pasa spec  │
    │ con    │   │ (aprobado) │
    │ notas  │   │ a Grok     │
    └────────┘   └─────┬──────┘
                       │
                       ▼
                  ┌─────────┐
                  │ Grok    │
                  │ implem. │
                  │ en SaaS │
                  └────┬────┘
                       │
                       ▼
                  ┌──────────┐
                  │ E1 audita│
                  │ mergea el│
                  │ contract │
                  └──────────┘
```

## Paso 1 — Compartir con Claude (revisor)

Copia y pega el archivo `BACKEND_MOBILE_SPEC.md` completo en el chat de Claude con este prompt:

```
Claude, actuando como auditor concurrente del proyecto CavernicolApp Mobile.
Este es el spec que E1 preparó para agregar 3 endpoints móviles al SaaS.
Por favor revisa la "SECCIÓN DE REVISIÓN PARA CLAUDE" al inicio y contesta:

1. ¿La superficie nueva de backend está justificada? ¿Ves alternativas más simples?
2. ¿Los tradeoffs de seguridad son aceptables? ¿Falta alguna mitigación?
3. ¿Las 8 preguntas abiertas tienen respuestas claras? ¿Cuáles son tus decisiones?
4. ¿La estimación de 3-4 días es realista para Grok?
5. ¿Hay riesgo de romper el auth de web (S71) que no esté cubierto?

Sé exhaustivo. Todo lo que apruebes se convierte en la especificación final que
va a manos de Grok para implementar.
```

## Paso 2 — Recibir feedback de Claude

Cuando Claude responda, tienes 3 escenarios:

- **✅ Aprobado sin cambios**: pasa el spec a Grok tal cual.
- **⚠️ Aprobado con notas menores**: aplica los cambios que Claude sugiera (o pídeme a mí que los aplique) antes de pasar a Grok.
- **❌ Rechazado o pide rediseño**: mándame las notas de Claude — reescribo el spec, iteramos, y volvemos al paso 1.

## Paso 3 — Entregar a Grok (después de aprobación)

Cuando Claude firme, pasa a Grok con este prompt:

```
Grok, iniciamos Sprint S72 (Mobile API Foundation).
Este spec fue revisado y aprobado por Claude. Implementa exactamente lo especificado.
Rama: feature/mobile-api-s72
[pegar spec completo]

Cuando termines: notifica el commit hash del PR para que E1 haga audit-first
antes de mergear a main.
```

## Paso 4 — Audit-first cuando Grok mergee (E1 hace esto solo, sin acción de tu parte)

Yo (E1) verificaré:
- Que el contract del response de `/api/mobile/auth/login` matchea el JSON schema del cliente móvil.
- Que la migración Alembic `0106_mobile_devices.py` no rompe migraciones existentes.
- Que ningún archivo del SaaS que la app móvil consume (`auth.py`, `crm.py`, `inbox.py`, `agenda.py`) cambió sin adaptarse el cliente.
- Actualizaré `EXPO_PUBLIC_DEV_MODE=false` en `/app/mobile/.env` y validaré end-to-end contra staging.

---

**Punto crítico:** nunca saltes el paso 1 (revisión de Claude) para specs de backend. Este protocolo
existe porque estos endpoints son superficie de auth crítica y una decisión mal tomada aquí puede
comprometer la seguridad de todo el SaaS.
