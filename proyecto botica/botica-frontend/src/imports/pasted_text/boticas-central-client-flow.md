Design a complete web system for "Boticas Central" pharmacy 
with tagline "Salud y Ahorro". This system has 3 separate 
access points via different URLs. Design ONLY the CLIENT 
flow for now.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BRAND & COLOR SYSTEM (Split-Complementary Theory)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Primary:     #F47920 (orange)  → CTAs, header, prices, badges
Complement1: #2B7DBF (blue)    → trust, links, secondary buttons
Complement2: #3AAB4A (green)   → stock ok, success, health tags
Neutral:     #FFFFFF / #F5F5F5 → backgrounds
Dark text:   #1A1A1A           → body text (WCAG AA compliant)
Error/Alert: #E03131           → out of stock, form errors

Typography: Poppins Bold for headings, Inter Regular 14-16px body
Border radius: 12px cards, 8px buttons
Shadows: rgba(0,0,0,0.08) soft elevation
Breakpoint: Desktop 1440px (mobile-first thinking)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
URL ARCHITECTURE & ACCESS SECURITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
The system has 3 completely separated access URLs:

PUBLIC  → boticascentral.com         (client-facing, fully visible)
HIDDEN1 → boticascentral.com/staff   (worker panel, no public link)
HIDDEN2 → boticascentral.com/admin   (owner panel, no public link)

IMPORTANT DESIGN RULE:
- NEVER show /staff or /admin links anywhere in the public UI
- The public site has NO mention of internal roles
- "Iniciar sesión" on public site = CLIENT login ONLY
- Internal panels have a separate, minimal, unbranded login form
- The system detects the role server-side after login, 
  then redirects automatically to the correct dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 1 — HOME  /  boticascentral.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layout: Full-width, vertical scroll, 8 sections

[ TOP BANNER ]
Thin bar, orange background #F47920, white text 12px
"Sede Ate: 01 XXX-XXXX  |  Sede Santa Anita: 01 XXX-XXXX"

[ NAVBAR — sticky on scroll ]
Left:   Logo "Boticas Central BM"
Center: Search bar, rounded full, placeholder 
        "Busca por medicamento, marca o principio activo"
        with orange search icon button
Right:  Location pill selector (Ate / Santa Anita) in blue,
        icon "Mis Pedidos", icon "Iniciar sesión", 
        Cart icon with orange item-count badge

[ SECONDARY NAV ]
Orange background, white text, horizontal pill menu:
Categorías ▾ | Ofertas | Vitaminas | Mamá & Bebé | 
Genéricos | Cuidado Personal | Catálogos

[ HERO CAROUSEL ]
Full-width rounded banner (16px radius), auto-scroll dots below
Slide content: bold promotional offer, product image right-side,
price in large white + yellow text, CTA button "Ver oferta"
Background: orange-to-blue gradient or solid orange #F47920

[ SECTION: Productos Destacados ]
Title: "Productos Destacados" — Poppins Bold 22px, left-aligned
Horizontal scrollable card row, each card (200px wide):
- Product image top (white bg)
- Product name Bold 14px
- Active ingredient: gray 12px italic "Principio activo: X"
- Price: #F47920 ExtraBold 18px "S/ 00.00"
- Stock badge: green pill "Disponible" or red "Agotado"
- CTA button: "Agregar al carrito" — solid blue #2B7DBF, 
  rounded 8px, full card width

[ SECTION: Nuestras Sedes ]
Title: "¿Dónde recoger tu pedido?"
Two cards side by side, soft shadow, 12px radius:
Card 1 — Sede Ate
Card 2 — Sede Santa Anita
Each card: branch icon (orange), name Bold, address, 
schedule, "Ver disponibilidad →" link in blue

[ SECTION: Categorías Populares ]
4-column icon grid, white cards with soft shadow:
Analgésicos | Vitaminas | Pañales | Antibióticos
Digestivos  | Genéricos | Dermato | Oftalmología
Orange icon + label below each, hover: orange border

[ SECTION: Genéricos vs Marca ]
Light orange background banner #FFF0E0
Left: branded product card
Right: generic product card
Center tag: green badge "Mismo principio activo · Mejor precio"
CTA: "Ver todos los genéricos" — outlined orange button

[ FOOTER ]
Dark #2D2D2D background, white text
Left:  Logo + tagline "Salud y Ahorro"
Mid:   Links: Inicio · Catálogo · Mis Pedidos · Contacto
Right: Payment icons: Efectivo · Yape
       Address Ate + Address Santa Anita
Bottom bar: "© 2025 Boticas Central. Todos los derechos reservados."
NO links to /staff or /admin anywhere in footer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 2 — CATÁLOGO  /  boticascentral.com/catalogo
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layout: 3-column grid. Left sidebar filters + Right product grid

[ BREADCRUMB ]  Inicio > Catálogo

[ LEFT SIDEBAR — 280px ]
Filter title: "Filtrar productos" Bold
Sections with checkboxes:
  - Sede: ○ Ate  ○ Santa Anita
  - Categoría: Vitaminas / Genéricos / Pañales / etc.
  - Laboratorio: text input search
  - Disponibilidad: toggle "Solo con stock"
  - Precio: range slider S/0 — S/200, orange thumb
CTA: "Aplicar filtros" orange full-width button
Link: "Limpiar filtros" gray underlined

[ TOP BAR ]
Left:  "X productos encontrados" gray text
Right: Sort dropdown "Ordenar por: Relevancia ▾"
       View toggle: Grid icon / List icon

[ PRODUCT GRID — 4 columns ]
Each card identical to Featured card style from Home.
Agotado products: image with gray overlay 40% opacity,
red badge "Agotado", button disabled gray "No disponible"

[ PAGINATION ]
Centered, orange active page pill, arrows prev/next

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 3 — DETALLE DE PRODUCTO
/  boticascentral.com/producto/:id
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ BREADCRUMB ]  Inicio > Catálogo > Producto

[ MAIN CONTENT — 2 columns ]
Left (40%): 
  Product image large, white card, soft shadow
  Thumbnail row below if multiple images

Right (60%):
  Lab badge: blue pill "Laboratorio: XXXX"
  Product name: Poppins Bold 28px
  Active ingredient: gray 14px "Principio activo: Ibuprofeno"
  Price: #F47920 ExtraBold 32px "S/ 00.00"
  
  Stock by branch:
    🟢 Sede Ate — Disponible
    🔴 Sede Santa Anita — Agotado
  
  Quantity selector: [ − ] [ 1 ] [ + ] gray bordered
  
  Primary CTA:   "Agregar al carrito" — orange full-width button
  Secondary CTA: "Ver genérico equivalente" — outlined blue button
  
  Divider line

  Tabs row (underline style, orange active):
  [ Composición ] [ Contraindicaciones ] [ Efectos adversos ]
  Tab content: body text 14px Inter, readable line-height

[ RELATED PRODUCTS ]
Title: "También te puede interesar"
Horizontal scroll card row, same card style as home

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 4 — CARRITO
/  boticascentral.com/carrito
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Layout: 2 columns — Cart items left, Order summary right

[ LEFT — Cart items list ]
Each row:
  Product image small (60px) | Name + active ingredient |
  Qty selector [ − ][ N ][ + ] | Unit price | Total price |
  Trash icon (red on hover)

  Stock warning inline if qty > available:
  ⚠️ orange text "Solo X unidades disponibles en sede Ate"

[ RIGHT — Order Summary card ]
Sticky card, soft shadow, 12px radius
  "Resumen de pedido" Bold title
  Subtotal:        S/ 00.00
  Delivery:        S/ 00.00 or "Gratis recojo en tienda"
  ─────────────────────────
  Total:           S/ 00.00  (orange ExtraBold)
  
  CTA: "Continuar al pago" — orange large button full-width
  Link: "← Seguir comprando" gray underlined

Empty state: centered illustration, 
"Tu carrito está vacío" gray text,
"Explorar productos" orange button

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 5 — CHECKOUT
/  boticascentral.com/checkout
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Progress stepper top (3 steps, orange active):
① Datos  →  ② Entrega  →  ③ Pago

Layout: 2 columns — Form left, Order summary right (same sticky card)

[ STEP 1: Datos personales ]
  Input: Nombre completo*
  Input: DNI*
  Input: Correo electrónico*
  Input: Número de celular*
  Toggle: "¿Necesitas boleta o factura?"
    If factura → show RUC + Razón social fields

[ STEP 2: Método de entrega ]
  Radio cards (bordered, orange check when selected):
  ○ Recojo en tienda (gratis)
    → Show branch selector: Sede Ate | Sede Santa Anita
    → Show real-time stock per branch with green/red dot
  ○ Delivery a domicilio
    → Show address input fields: Calle, Distrito, Referencia

[ STEP 3: Método de pago ]
  Radio cards:
  ○ Efectivo — icon cash
  ○ Yape — icon Yape logo
  
  If Yape selected → show Yape QR mockup or phone number field

  CTA: "Confirmar pedido" — orange large button
  Note below: gray 12px 
  "Al confirmar, el stock será reservado para tu pedido"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 6 — CONFIRMACIÓN DE PEDIDO
/  boticascentral.com/confirmacion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Centered layout, max-width 600px, vertical stack

  Large green checkmark icon animated (Lottie style)
  
  "¡Pedido confirmado!" — Poppins Bold 28px
  "Tu pedido #0001 está siendo preparado" — gray 16px

  Order summary card (light gray bg):
    Products ordered list
    Branch or delivery address
    Payment method
    Estimated time: "Listo en aprox. 30 minutos"

  Order status tracker (horizontal):
  🟠 Pendiente → ⬜ En preparación → ⬜ Entregado
  (orange filled circle = current state)

  Two buttons:
  Primary:   "Ver mis pedidos" — orange
  Secondary: "Volver al inicio" — outlined blue

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CLIENT LOGIN — boticascentral.com/login
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Centered card, max-width 420px, full branding visible

  Logo top center
  Title: "Ingresa a tu cuenta" Poppins Bold 24px
  
  Input: Correo electrónico
  Input: Contraseña (toggle show/hide)
  Link:  "¿Olvidaste tu contraseña?" — blue right-aligned
  
  CTA: "Iniciar sesión" — orange full-width
  Divider: "¿No tienes cuenta?"
  CTA: "Crear cuenta" — outlined orange full-width

  Footer of card: gray 11px
  "Acceso exclusivo para clientes. 
   Si eres personal de Boticas Central 
   contacta a tu administrador."
  
  NOTE FOR DEVELOPER: 
  This page has NO link or mention of /staff or /admin URLs
  Role detection happens server-side after credentials are validated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERNAL LOGIN (WORKER) — /staff
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Minimal design. NO public branding. NO orange theme.
White card centered on light gray #F0F0F0 background.
Max-width 380px.

  Small logo top (grayscale version)
  Title: "Acceso Personal" — Inter Bold 20px dark gray
  
  Input: Usuario (numeric code)
  Input: Contraseña (numeric, toggle show/hide)
  
  CTA: "Ingresar" — solid dark #1A1A1A button full-width
  
  Error state: red inline message 
  "Usuario o contraseña incorrectos. Intentos: X/3"
  After 3 fails: "Acceso bloqueado. Contacta al administrador."
  
  NO register link. NO forgot password link.
  NO navigation to public site.
  This URL is accessed only by direct URL, never linked publicly.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INTERNAL LOGIN (OWNER) — /admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Same minimal design as /staff but with subtle difference:
Dark navy background #0F172A for the full page.
White card centered, max-width 380px.

  Small logo grayscale top
  Title: "Panel Administrativo" — Inter Bold 20px white on navy
  
  Input: Usuario administrador
  Input: Contraseña (strong, alphanumeric, toggle show/hide)
  
  CTA: "Acceder" — solid blue #2B7DBF full-width
  
  Security note below button: gray 11px
  "Sesión encriptada. Actividad registrada."
  
  Same 3-attempt lockout behavior as /staff
  NO links to public site or /staff
  This URL is never mentioned or linked anywhere in the system