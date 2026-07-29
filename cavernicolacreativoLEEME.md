# Sitio web — Cavernícola Creativo

Sitio de la agencia (`www.cavernicolacreativo.com`). CavernicolApp se presenta como
producto de la agencia y enlaza a `https://app.cavernicolapp.com`.

## Qué es este archivo

`index.html` es un **sitio de archivo único, autocontenido**: CSS y JS embebidos, sin
CDN, sin fuentes externas, sin dependencias. Está así a propósito, porque va a cargarse
como **sitio personalizado en el módulo de sitio web** (white-label), donde el HTML se
descarga como texto y se escribe en el documento — cualquier `<script src>`, `<link>` o
ruta relativa se rompería.

## Antes de publicar — lo que hay que reemplazar

Todo lo pendiente está marcado en el código con `<!-- REEMPLAZAR -->` y/o
`data-placeholder="true"`. Para listarlo:

```bash
grep -n "REEMPLAZAR\|data-placeholder" index.html
```

1. **Bloque `CONFIG`** (al final del archivo, en el `<script>`):
   - `crmSlug` — el slug real de la empresa en CavernicolApp. Sin esto el formulario falla
     y cae al respaldo de WhatsApp/correo.
   - `whatsapp` — formato internacional sin signos (ej. `5215512345678`).
   - `email`, `telefono`.
2. **Isotipo** — **no hay que tocar código.** El sitio busca el archivo solo, en este
   orden, y coloca el primero que exista:

   ```
   isotipo-cavernicola.png   ·   /isotipo-cavernicola.png
   isotipo-cavernicola.svg   ·   /isotipo-cavernicola.svg
   ```

   Basta con subir el archivo del cliente con ese nombre, junto al `index.html` o en la
   raíz del dominio. Si ninguno existe, la marca se queda con su lockup tipográfico:
   **nunca aparece una imagen rota**. Verificado en los dos casos.

   ⚠️ **En el módulo de sitio web de CavernicolApp las rutas relativas NO funcionan**
   (el HTML se escribe en el documento de otro origen). Ahí hay que poner en
   `CONFIG.logo` una URL completa (`https://www.cavernicolacreativo.com/isotipo-…png`)
   o el archivo como data URI.

   Si la imagen ya trae las palabras "Cavernícola Creativo", poner además
   `logoEsLockup: true` para que no se duplique el nombre.

   ⚠️ **El isotipo NO se dibuja ni se reconstruye.** Se retiraron a propósito todas las
   reconstrucciones: un logotipo aproximado es peor que ninguno. Es el archivo oficial
   del cliente, o solo tipografía.

3. **Métricas** — los cuatro números de la franja bajo el hero son de muestra.
   No publicar cifras que no se puedan sostener.
4. **Portafolio** — seis marcas **ficticias**, construidas con tipografía (bloques `.mk`):
   Motomosion (seminuevos), The Parallel Residences (residencial), Aurora Centro Médico,
   Nordika (retail), Colegio Aldebarán y Sereno Spa. Cada tarjeta lleva su etiqueta
   visible **"Ejemplo"**: no son clientes reales y no deben presentarse como tales.
   Al entrar un caso verdadero: sustituir el bloque `.mk` por la imagen del cliente,
   actualizar sector/título/resultado y **quitar la etiqueta**.
5. **Testimonios** — tres citas de muestra. Usar solo frases autorizadas por el cliente.
6. **Redes sociales** — enlaces del pie (`href="#"`).
7. **Imagen social** (`og:image`) — 1200×630 en el dominio.
8. **JSON-LD** — revisar `sameAs`, `logo`, `email` y agregar dirección si aplica.

## Cómo se cargan los prospectos al CRM

El formulario hace `POST` a:

```
{crmBase}/api/public/l/{crmSlug}/contact
```

con `{ name, email, phone, message }`. El endpoint exige nombre **y** (correo o teléfono);
el formulario valida lo mismo antes de enviar. Empresa, servicio de interés y el origen
del sitio viajan concatenados en `message`.

Requisitos del lado de la plataforma:
- La empresa debe tener `slug` asignado y el landing **activado** (`landing_enabled`),
  o el endpoint responde 404.
- El dominio `www.cavernicolacreativo.com` debe estar permitido por CORS en el backend.

Si la petición falla por lo que sea, el formulario no se queda mudo: muestra el error y
ofrece WhatsApp y correo como salida.

## Códigos de promoción — 15 días gratis

La sección `#promo` genera un código de cortesía en el navegador del visitante.

### Cómo funciona para el usuario

1. Deja nombre y WhatsApp (o correo) — **el código cuesta sus datos, no es gratis del todo**:
   por eso cada código generado entra al CRM como prospecto.
2. Se genera el código y se muestra con botón de copiar (con respaldo de selección
   manual si el navegador bloquea el portapapeles).
3. Se guarda en `localStorage`, así que si vuelve desde el mismo dispositivo ve **el mismo
   código**, no uno nuevo. Al vencer, se genera otro.
4. El registro en el CRM viaja al mismo endpoint del formulario de contacto, con el código y
   su vencimiento en `message`. Si esa llamada falla, **el código se muestra igual** y se le
   pide que lo mande por WhatsApp — no se le castiga por una falla de red nuestra.

### Formato

```
CAV15-XXXXXX-YY
```

- `XXXXXX` — 6 caracteres aleatorios (`crypto.getRandomValues` cuando está disponible).
- `YY` — 2 caracteres de verificación derivados de los 6 anteriores.
- Alfabeto de 26 caracteres **sin ambigüedad al dictarlo por teléfono**:
  `ACDEFGHJKLMNPQRTUVWXY34789` (sin `O`/`0`, `I`/`1`, `S`/`5`, `B`/`8`).

### Validación del lado de CavernicolApp

Los dos últimos caracteres permiten descartar códigos inventados **sin consultar base de
datos**. Equivalente en Python del algoritmo que usa el sitio:

```python
ALPHABET = "ACDEFGHJKLMNPQRTUVWXY34789"

def _checksum(core: str) -> str:
    total = sum((ALPHABET.index(ch) + 1) * (i + 3) for i, ch in enumerate(core))
    return ALPHABET[total % 26] + ALPHABET[(total * 7 + 11) % 26]

def codigo_valido(code: str) -> bool:
    partes = (code or "").strip().upper().split("-")
    if len(partes) != 3 or partes[0] != "CAV15":
        return False
    core, check = partes[1], partes[2]
    if len(core) != 6 or len(check) != 2:
        return False
    if any(ch not in ALPHABET for ch in core + check):
        return False
    return _checksum(core) == check
```

**Límite conocido y deliberado:** el dígito verificador prueba que el código tiene la forma
correcta, **no que nosotros lo emitimos**. Alguien decidido puede fabricar códigos válidos
con este mismo algoritmo. Es un cupón de captación, no una llave de seguridad, y el riesgo
real es bajo (15 días de prueba). Si más adelante se quiere blindar, dos caminos, en este orden:

1. **Cotejar contra el CRM** — cada código generado ya queda registrado como prospecto.
   Al canjearlo, buscar que exista; si no aparece, pedir contacto con la agencia.
2. **Emitir del lado del servidor** — un endpoint que firme el código con una llave secreta
   y lo guarde en una colección de cupones con estado (emitido / canjeado / vencido).
   Es el cierre definitivo, y convierte el generador del sitio en una simple llamada.

### Lo que hay que tener del lado de la plataforma

- Un campo de **código de promoción** en el alta de cuenta.
- La validación de arriba y la aplicación de los 15 días.
- El vencimiento para canjear son **7 días** (`PROMO.dias` en el `<script>`); ajustar ahí si
  cambia la política, y de paso el texto de la pregunta frecuente.

## Dirección de arte

**Tomada del logotipo, no inventada.** Barro terracota, fuego que va de ámbar a magenta,
letras metálicas y champagne, todo sobre el muro de piedra oscuro del mockup de marca.
Mundo único nocturno-cálido: el sitio **no** invierte con el modo claro del sistema.

| Token | Valor | De dónde sale |
|---|---|---|
| `--wall` / `--wall-2` / `--wall-3` | `#16181f` · `#1c1f28` · `#232732` | el muro del mockup |
| `--clay` / `--clay-hi` / `--clay-lo` | `#c4674b` · `#dc8360` · `#8d4732` | el cuerpo de la C |
| `--fire` / `--fire-hi` / `--magenta` | `#ff7a18` · `#ffc93c` · `#ff2d95` | la llama y su resplandor |
| `--grad-metal` | plata con brillo a media altura | "CAVERNÍCOLA" |
| `--grad-champ` | champagne cálido | "CREATIVO" |
| `--ink` | `#f6f1ea` | piedra clara, no blanco de oficina |

Los neutros van sesgados a cálido a propósito: un gris puro al lado del barro se ve sucio.

- **Acabados de marca** disponibles como clases: `.metal`, `.champ` y `.ardiente`
  (degradado de fuego que respira). El lockup del navbar y del pie usa metal + champagne,
  igual que el logo.
- **Rejilla bento** de 6 columnas con piezas de distinto tamaño.
- **Cortes diagonales** (`.cut`) entre bandas.
- **Textura de muro**: grano fino más viñeta, fijos sobre todo el documento.

### Capa de movimiento

Orquestada, no dispersa. Dos momentos protagonistas y micro-interacciones de apoyo:

| Momento | Qué hace |
|---|---|
| Entrada del hero | Cada línea del titular sube tras su máscara, escalonada; el resto entra en cascada con retardos declarados en `--in`. |
| Riel del método | Los cuatro pasos se encienden conforme entran al centro de la pantalla; el texto pasa de apagado a blanco y el punto del riel prende. Es la pieza firmada. |
| Barrido del titular | Gradiente que recorre "el aplauso" cada 7 s. |
| Bandeja viva | Cada 4.2 s entra un prospecto nuevo al panel del hero, con su animación de caída. Se detiene si la pestaña no está visible. |
| Reflector | Las piezas bento siguen al puntero con un halo radial (`--mx`/`--my`). |
| Inclinación 3D | Las piezas de portafolio rotan levemente con el puntero. |
| Marquesina | Sectores atendidos en bucle continuo; se pausa al pasar el cursor. |
| Paralaje | Los tres orbes del hero se desplazan a distinta velocidad al bajar. |
| Barra de lectura | Progreso cian→ámbar en el borde superior. |
| Menú activo | El enlace de la sección en pantalla se marca solo. |
| Código descifrándose | Al generar la promoción, los caracteres se revuelven y se asientan uno por uno. |
| Revelados | `.rv` con variantes `left`, `right`, `zoom` y `clip`. |

Todo el movimiento se apaga con `prefers-reduced-motion`, y el paralaje, el reflector y
la inclinación solo se activan en dispositivos con puntero real (`hover: hover`), para no
gastar batería en móvil.

### Logotipo

El isotipo vive en **un solo lugar**: el `<symbol id="cav-mark">` al inicio del `<body>`.
El navbar y el pie lo consumen con `<use href="#cav-mark">`. Para cambiarlo, sustituir el
contenido de ese símbolo por el logo oficial en SVG — no hay que tocar nada más.
El que está ahora es provisional (una chispa con degradado cian→ámbar).

## SEO incluido

Título y descripción orientados a intención comercial · canonical · Open Graph y Twitter
Card · JSON-LD con `Organization`, `WebSite`, `ProfessionalService` (catálogo de los
4 servicios), `SoftwareApplication` (CavernicolApp) y `FAQPage` · un solo `<h1>` ·
jerarquía `h2`/`h3` correcta · landmarks semánticos · `aria-label` en iconos ·
salto al contenido · `robots.txt` y `sitemap.xml` incluidos.
