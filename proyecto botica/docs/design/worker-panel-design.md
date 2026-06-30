Design the internal worker panel for "Boticas Central" pharmacy.
This is a private, minimal, functional web dashboard.
Accessed ONLY via direct URL: boticascentral.com/staff
Never linked from the public website.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN PHILOSOPHY FOR THIS PANEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is NOT a public-facing site. Design for efficiency:
- Clean, distraction-free UI
- Large touch-friendly buttons (min 44px height)
- High contrast text for readability under pharmacy lighting
- Minimal clicks to complete frequent actions
- No decorative elements, no hero banners, no carousels
- Color usage is functional, not decorative

COLOR SYSTEM (toned-down brand palette):
Primary action:  #F47920 (orange)  → confirm, register, primary CTA
Informational:   #2B7DBF (blue)    → view details, navigate, links  
Success:         #3AAB4A (green)   → stock ok, delivered, confirmed
Warning:         #F59E0B (amber)   → low stock, pending states
Danger:          #E03131 (red)     → cancel, error, out of stock
Neutral bg:      #F8F9FA           → page background
Card bg:         #FFFFFF           → content cards
Sidebar bg:      #1E293B (dark navy) → left navigation
Text primary:    #1A1A1A
Text secondary:  #6B7280

Typography: Inter throughout. Bold 16-18px titles, Regular 14px body
Border radius: 8px cards, 6px buttons
Shadows: rgba(0,0,0,0.06)
Layout: Fixed left sidebar + main content area, 1440px desktop

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 1 — WORKER LOGIN
boticascentral.com/staff
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full page background: #F0F2F5 light gray
Centered card: white, 380px wide, 12px radius, soft shadow

  [ TOP OF CARD ]
  Logo Boticas Central — grayscale version, 80px, centered
  Thin divider line
  Title: "Acceso Personal" — Inter Bold 20px #1A1A1A
  Subtitle: "Panel de trabajadores" — Inter Regular 13px #6B7280

  [ FORM ]
  Label + Input: "Usuario" 
    → placeholder "Ingresa tu código"
    → numeric keyboard hint
  Label + Input: "Contraseña"
    → placeholder "••••••••"
    → toggle show/hide icon right side
  
  CTA button: "Ingresar al turno"
    → full width, #1A1A1A dark fill, white text
    → hover: #2D2D2D

  [ ERROR STATE — show after failed attempt ]
  Inline red banner below button:
  Icon ⚠ + "Usuario o contraseña incorrectos. 
  Intentos fallidos: X de 3"
  
  [ LOCKED STATE — after 3 fails ]
  Red bordered card replacing form:
  Icon 🔒 "Acceso bloqueado"
  "Comunícate con el administrador para restablecer acceso"

  [ FOOTER OF CARD ]
  Gray 11px centered:
  "Uso exclusivo del personal de Boticas Central
   Esta sesión queda registrada en el sistema"

  SECURITY RULES TO SHOW IN DESIGN:
  - No "Olvidé mi contraseña" link
  - No "Crear cuenta" link
  - No link back to public website
  - No mention of /admin URL

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL LAYOUT — AUTHENTICATED WORKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Once logged in, ALL screens share this shell:

[ LEFT SIDEBAR — 240px fixed, dark navy #1E293B ]

  Top section:
  Logo small white version 40px
  Divider
  Worker info card:
    Avatar circle initials (orange bg)
    Name: "Carlos Quispe" white Bold 14px
    Role tag: blue pill "Técnico"
    Branch tag: green pill "Sede Ate"

  Navigation menu items (white icons + labels):
  🏠  Dashboard          ← active: orange left border + bg #2D3F55
  🛒  Nueva Venta
  📦  Pedidos Web
  📋  Cierre de Caja
  
  Bottom section:
  Thin divider
  Current shift info:
    "Turno iniciado: 08:00 AM" gray 12px
  Button: "Cerrar sesión" — red text, no fill, full width

[ TOP BAR — white, 64px height, full width ]
  Left:  Page title (changes per screen) Bold 18px
  Right: 
    Branch pill selector (read-only for worker): "Sede Ate 📍"
    Date + time live: "Lunes 21 Abr · 15:20" gray 14px
    Notification bell with orange badge count

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 2 — DASHBOARD / INICIO DE TURNO
boticascentral.com/staff/dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Resumen del turno"

[ SHIFT HEADER BANNER ]
Orange gradient banner, full width, 100px height, rounded 12px
Left:  "Buenos días, Carlos 👋" white Bold 20px
       "Turno activo desde las 08:00 AM" white 14px
Right: CTA button "Registrar venta" — white fill, orange text

[ STATS ROW — 4 cards horizontal ]
Each card: white bg, soft shadow, 12px radius, padding 20px

Card 1 — Ventas del turno
  Icon 🛒 orange
  Value: "S/ 0.00" ExtraBold 28px orange
  Label: "Ventas registradas hoy" gray 13px
  Subtext: "X transacciones" blue 12px

Card 2 — Pedidos web pendientes
  Icon 📦 amber
  Value: "X" ExtraBold 28px amber
  Label: "Pedidos por atender" gray 13px
  CTA link: "Ver pedidos →" blue 12px

Card 3 — Productos con stock bajo
  Icon ⚠️ amber  
  Value: "X productos" ExtraBold 20px amber
  Label: "Alertas de stock bajo" gray 13px
  CTA link: "Revisar →" blue 12px

Card 4 — Efectivo en caja
  Icon 💵 green
  Value: "S/ 0.00" ExtraBold 28px green
  Label: "Efectivo acumulado" gray 13px
  Subtext: "Yape: S/ 0.00" gray 12px

[ RECENT ACTIVITY — last 5 sales ]
Title: "Últimas ventas del turno" Bold 16px
White card, full width, table style:

Columns:
Hora | Producto | Cantidad | Precio | Método de pago | —

Each row: alternating white / #F8F9FA
Last column: eye icon blue "Ver detalle"

Empty state: 
Centered gray illustration
"Aún no hay ventas en este turno"
Button: "Registrar primera venta" orange

[ PENDING ORDERS MINI LIST ]
Title: "Pedidos web recientes" Bold 16px + 
       orange badge with count right-side

Compact list, 3 rows max, each row:
  Order # | Client name | Products | Status pill | 
  "Atender" blue button

CTA at bottom: "Ver todos los pedidos →" blue link

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 3 — REGISTRO DE VENTA EN MOSTRADOR
boticascentral.com/staff/nueva-venta
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Nueva Venta"
Layout: 2 columns — Left product search (60%) + Right cart (40%)

[ LEFT — PRODUCT SEARCH PANEL ]
White card full height

  Search bar large (48px height):
  Placeholder: "Buscar por nombre, principio activo o laboratorio"
  Orange search icon button right side
  
  Below search: filter pills row
  [ Todos ] [ Genéricos ] [ Vitaminas ] [ Pañales ] [ Ver más ]
  Orange fill = active filter, gray outline = inactive

  [ SEARCH RESULTS — product list ]
  Each result row (80px height, bordered bottom):
    Left:  Product name Bold 14px
           Principio activo: gray 12px
           Laboratorio: blue 12px
    Center: Stock indicator
            Green dot "Disponible: X unid." 
            or Red dot "Agotado"
    Right:  Price "S/ 00.00" orange Bold
            Button "Agregar +" blue rounded

  No-results state:
  "No se encontraron productos para [búsqueda]"
  gray centered text

[ RIGHT — CART / CURRENT SALE ]
White card full height, sticky

  Title: "Venta actual" Bold 16px
  Worker name small: "Registrada por: Carlos Q." gray 12px

  [ CART ITEMS LIST — scrollable ]
  Each item row:
    Product name 13px Bold
    Qty selector: [ − ][ N ][ + ] small, bordered
    Unit price gray 12px
    Line total: orange Bold 14px
    Trash icon red hover
  
  Divider

  [ TOTALS ]
  Subtotal:   S/ 00.00   gray
  ──────────────────────
  TOTAL:      S/ 00.00   orange ExtraBold 22px

  [ PAYMENT METHOD ]
  Title: "Método de pago" Bold 14px
  Two large radio cards side by side:
  ○ Efectivo  |  ○ Yape
  Blue border when selected, checkmark icon

  [ CLIENT DATA — optional collapsible ]
  Toggle: "¿Agregar datos del cliente? (boleta/factura)"
  If expanded:
    Input: Nombre completo
    Input: DNI
    Toggle: Boleta / Factura
    If factura: RUC + Razón social

  [ ACTION BUTTONS ]
  Primary:   "Confirmar venta" — orange full-width large 52px
  Secondary: "Cancelar" — red outlined full-width

  [ CONFIRM MODAL — overlay ]
  White modal card, centered:
  "¿Confirmar esta venta?"
  Summary: X productos · Total S/ 00.00 · Método: Efectivo
  Buttons: "Sí, confirmar" orange | "Cancelar" gray

  [ SUCCESS STATE — replaces cart after confirm ]
  Green checkmark large centered
  "¡Venta registrada!" Bold green 20px
  "Total cobrado: S/ 00.00"
  "Cambio a devolver: S/ 00.00" (if cash)
  Button: "Nueva venta" orange
  Link: "Ver comprobante" blue

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 4 — LISTA DE PEDIDOS WEB
boticascentral.com/staff/pedidos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Pedidos Web"

[ FILTER BAR ]
Row of controls:
  Status tabs: [ Todos ] [ Pendientes ] [ Entregados ] [ Cancelados ]
  Orange underline = active tab, count badge per tab
  Right side: Date filter input + Branch filter dropdown

[ ORDERS TABLE ]
White card, full width, soft shadow

Columns:
# Pedido | Fecha/Hora | Cliente | Productos | Total | 
Sede | Estado | Acciones

Each row (56px height):
  # Pedido:   "#0001" blue bold link
  Fecha/Hora: "21 Abr · 14:30" gray 13px
  Cliente:    "Juan Pérez" + DNI gray below
  Productos:  "Paracetamol x2, Vitamina C x1..." 
               truncated with +X more pill
  Total:      "S/ 00.00" bold
  Sede:       pill "Ate" or "Santa Anita" blue outlined
  Estado:     status pill (see below)
  Acciones:   "Ver" blue icon button

STATUS PILLS design:
  🟡 Pendiente   → amber bg #FEF3C7, amber text #92400E
  ✅ Entregado   → green bg #D1FAE5, green text #065F46  
  ❌ Cancelado   → red bg #FEE2E2, red text #991B1B

[ EMPTY STATE ]
No orders illustration centered
"No hay pedidos en este estado" gray text

[ PAGINATION ]
Centered, orange active pill, show 10 per page

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 5 — DETALLE + CAMBIO DE ESTADO
boticascentral.com/staff/pedidos/:id
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Pedido #0001"
Back link: "← Volver a pedidos" blue

Layout: 2 columns

[ LEFT — Order Detail (60%) ]

  White card:
  Header row:
    "Pedido #0001" Bold 20px
    Status pill current state (large version)
    "Creado: 21 Abr 2025 · 14:30" gray 13px

  Section: "Productos solicitados"
  List each product:
    Product name Bold 14px
    Marca + Laboratorio gray 12px
    Qty: x2 blue pill
    Subtotal: S/ 00.00 orange

  Divider + Total row:
  "Total del pedido: S/ 00.00" ExtraBold 18px orange

  Section: "Método de entrega"
  Radio icon (read-only):
    📍 Recojo en Sede Ate
    or 🚗 Delivery — address shown

  Section: "Método de pago"
    💵 Efectivo  or  📱 Yape

[ RIGHT — Client Data + Status Actions (40%) ]

  White card: "Datos del cliente"
    👤 Nombre: Juan Pérez
    🪪 DNI: 12345678
    📱 Celular: 9XX XXX XXX
    📧 Correo: juan@email.com
    📄 Comprobante: Boleta

  White card: "Cambiar estado del pedido"
    Current state shown large with pill
    
    If PENDIENTE → show two buttons:
      "Marcar como Entregado" — green full-width button
      "Cancelar pedido" — red outlined full-width button
    
    If ENTREGADO → 
      Green checkmark + "Pedido completado"
      Timestamp: "Entregado el 21 Abr · 15:00 por Carlos Q."
    
    If CANCELADO →
      Red X icon + "Pedido cancelado"
      "El stock fue restituido automáticamente" 
      gray 12px info note
    
    [ CANCEL CONFIRMATION MODAL ]
    Overlay modal:
    "¿Cancelar este pedido?"
    "Esta acción restituirá el stock al inventario."
    Buttons: "Sí, cancelar" red | "No, volver" gray

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 6 — CIERRE DE CAJA / CUADRE DE TURNO
boticascentral.com/staff/cierre
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Cierre de Caja"

[ WARNING BANNER — top ]
Amber background, full width:
Icon ⚠️ "Esta acción cerrará tu turno actual. 
Asegúrate de haber registrado todas las ventas."

[ SHIFT SUMMARY CARD ]
White card, full width, soft shadow

  Header: "Resumen del turno — Carlos Quispe"
  Subtext: "Sede Ate · 21 Abr 2025 · 08:00 AM → ahora"

  [ STATS GRID — 2x2 ]
  Cell 1: Total ventas registradas    → "X transacciones"
  Cell 2: Total en efectivo           → "S/ 0.00" green Bold
  Cell 3: Total en Yape               → "S/ 0.00" blue Bold
  Cell 4: Total general del turno     → "S/ 0.00" orange ExtraBold

  [ SALES BREAKDOWN TABLE ]
  Title: "Detalle de ventas del turno"
  Columns: Hora | Producto | Cant. | Precio | Método
  All rows from current shift listed
  Footer row: TOTAL | — | — | S/ 0.00 | —

[ CASH RECONCILIATION CARD ]
White card

  Title: "Cuadre de efectivo" Bold 16px
  
  Row: "Efectivo registrado en sistema"  S/ 0.00  gray
  Row: "Efectivo contado físicamente"    
       → Input field editable: [ S/___.___ ]
  
  Divider
  
  Difference row (dynamic):
  If match:    ✅ "Cuadre correcto · Diferencia: S/ 0.00" green
  If surplus:  ⚠️ "Sobrante: S/ +00.00" amber
  If shortage: ❌ "Faltante: S/ -00.00" red

  Notes field:
  Label: "Observaciones (opcional)"
  Textarea placeholder: "Ej: Se encontró billete falso, 
  cliente pagó con billete de S/100..."

[ ACTION BUTTONS ]
Primary:   "Confirmar cierre de turno" — orange large full-width
Secondary: "Cancelar" — gray outlined

  [ FINAL CONFIRMATION MODAL ]
  White overlay modal centered:
  Title: "¿Confirmar cierre de turno?"
  Summary:
    Turno: 08:00 AM — 04:30 PM (X horas)
    Ventas: X transacciones · S/ 0.00
    Efectivo: S/ 0.00 · Yape: S/ 0.00
    Diferencia: S/ 0.00 ✅
  Buttons: "Cerrar turno" orange | "Volver" gray

  [ SUCCESS STATE — post confirmation ]
  Full page centered:
  Green checkmark Lottie-style icon
  "Turno cerrado correctamente" Bold green 22px
  "El reporte fue enviado al administrador" gray 14px
  Timestamp: "Cierre registrado: 21 Abr · 04:30 PM"
  Button: "Cerrar sesión" dark full-width