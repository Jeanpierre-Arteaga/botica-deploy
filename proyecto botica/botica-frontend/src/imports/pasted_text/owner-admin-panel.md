Continue designing the "Boticas Central" pharmacy system.
This is the OWNER admin panel. Most privileged access level.
Accessed ONLY via direct URL: boticascentral.com/admin
Never linked from public website or /staff panel.
Never mentioned anywhere in the UI of other panels.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DESIGN PHILOSOPHY FOR ADMIN PANEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This panel manages the entire business. Design for:
- Data density: owner needs to see a lot at once
- Authority feel: darker, more serious than /staff panel
- Trust & control: every action has confirmation
- Cross-branch visibility: always show Ate vs Santa Anita
- No decorative elements, pure functionality
- All destructive actions require double confirmation

COLOR SYSTEM (same brand, darker authority tone):
Primary action:  #F47920 (orange)  → main CTAs, highlights
Data positive:   #3AAB4A (green)   → growth, stock ok, delivered
Data negative:   #E03131 (red)     → alerts, delete, danger
Informational:   #2B7DBF (blue)    → links, filters, secondary
Warning:         #F59E0B (amber)   → low stock, pending
Sidebar bg:      #0F172A (deep navy) → darker than /staff
Top bar bg:      #1E293B
Card bg:         #FFFFFF
Page bg:         #F1F5F9
Text primary:    #0F172A
Text secondary:  #64748B

Typography: Inter throughout
  - Dashboard numbers: Inter ExtraBold 32-40px
  - Section titles: Inter Bold 18px
  - Table content: Inter Regular 14px
  - Labels: Inter Medium 13px
Border radius: 10px cards, 6px buttons, 4px inputs
Layout: Fixed left sidebar 260px + main content, 1440px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 1 — OWNER LOGIN
boticascentral.com/admin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Full page background: deep navy #0F172A
Centered card: white, 400px wide, 16px radius, 
strong shadow rgba(0,0,0,0.4)

  [ TOP OF CARD ]
  Logo Boticas Central grayscale 80px centered
  Thin divider
  Title: "Panel Administrativo" Inter Bold 22px #0F172A
  Subtitle: "Acceso exclusivo — Dueño" 
            Inter Regular 13px #64748B

  [ SECURITY BADGE ]
  Small row centered below subtitle:
  🔒 icon + "Sesión encriptada · Actividad registrada"
  gray 11px — signals to owner this is secure

  [ FORM ]
  Label + Input: "Usuario administrador"
    → placeholder "Ingresa tu usuario"
  Label + Input: "Contraseña"
    → placeholder "••••••••••••"
    → toggle show/hide icon
    → hint below: "Mínimo 8 caracteres, incluye números"
    → gray 11px

  CTA button: "Acceder al panel"
    → full width, solid blue #2B7DBF
    → hover: #1D6FA8
    → icon 🔐 left side

  [ ERROR STATE ]
  Red bordered alert below button:
  "Credenciales incorrectas. 
   Intentos restantes: X de 3"

  [ LOCKED STATE ]
  Full red alert card replacing form:
  🔒 "Panel bloqueado por seguridad"
  "Se han registrado X intentos fallidos.
   Restablece el acceso desde el servidor."

  [ CARD FOOTER ]
  Gray 11px centered:
  "Este panel no está enlazado públicamente.
   El acceso no autorizado queda registrado."

  SECURITY RULES:
  - No forgot password link
  - No register option
  - No link to /staff or public site
  - Lockout after 3 failed attempts
  - Session expires after 2 hours of inactivity

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
GLOBAL LAYOUT — AUTHENTICATED OWNER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All screens share this shell after login:

[ LEFT SIDEBAR — 260px fixed, deep navy #0F172A ]

  Top section:
  Logo white version 44px
  Thin divider white 10% opacity

  Owner identity card:
    Avatar circle: orange bg, white initials "JP"
    Name: "Jorge Pérez" white Bold 14px
    Role badge: orange pill "Administrador"
    "Ambas sedes" green pill small

  Navigation groups with labels:

  GENERAL
  🏠  Dashboard

  INVENTARIO  
  📦  Gestión de Productos
  🏪  Control de Stock

  OPERACIONES
  📋  Pedidos Web
  👥  Gestión de Usuarios

  REPORTES
  📊  Ventas y Rotación

  Bottom section:
  Thin divider
  "Última sesión: 20 Abr · 09:00 AM" gray 11px
  Button: "Cerrar sesión" red text no fill full width

  Active state: orange left border 3px + 
                background #1E293B + white text

[ TOP BAR — #1E293B, 64px height ]
  Left:  Page title Bold 18px white
  Right:
    Branch toggle pills: 
      [ Ambas sedes ] [ Ate ] [ Santa Anita ]
      orange fill = active, white text
    Alert bell: orange badge with count
    Date: "Lunes 21 Abr 2026" white 13px

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 2 — DASHBOARD GENERAL
boticascentral.com/admin/dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Dashboard General"

[ ALERT BANNER — conditional, shows when alerts exist ]
Amber background full width banner, 48px height:
⚠️ icon "Hay X productos con stock bajo en Sede Ate 
         y X en Sede Santa Anita"
Right side: "Revisar ahora →" dark link underlined

[ KPI ROW — 4 cards ]
Each card: white, soft shadow, 10px radius, 24px padding
Top left: icon circle (colored bg)
Top right: trend arrow + % (green up / red down)

Card 1 — Ventas hoy (ambas sedes)
  Icon 💰 orange circle
  Value: "S/ 0,000.00" ExtraBold 36px orange
  Label: "Ventas del día" gray 13px
  Subtext: "Ate: S/0.00 · Santa Anita: S/0.00" 
           blue 12px

Card 2 — Transacciones hoy
  Icon 🛒 blue circle
  Value: "XX" ExtraBold 36px blue
  Label: "Ventas registradas" gray 13px
  Subtext: "Web: X · Mostrador: X" gray 12px

Card 3 — Pedidos pendientes
  Icon 📦 amber circle
  Value: "X" ExtraBold 36px amber
  Label: "Pedidos por atender" gray 13px
  CTA link: "Ver todos →" blue 12px

Card 4 — Alertas de stock
  Icon ⚠️ red circle
  Value: "X" ExtraBold 36px red
  Label: "Productos con stock bajo" gray 13px
  CTA link: "Revisar stock →" blue 12px

[ MAIN CONTENT — 2 columns below KPIs ]

Left column (65%):

  [ SALES CHART CARD ]
  White card full width, 320px height
  Title: "Ventas de la semana" Bold 16px
  Right of title: toggle [ Día ] [ Semana ] [ Mes ]
  
  Bar chart:
    X axis: days of week Mon-Sun
    Two bars per day: orange = Ate, blue = Santa Anita
    Hover tooltip: "Sede Ate · S/ 000.00"
    Y axis: currency amounts
    Legend below: ■ Ate  ■ Santa Anita

  [ RECENT SALES TABLE ]
  White card
  Title: "Últimas ventas registradas" Bold 16px
  Right: "Ver reporte completo →" blue link

  Columns: Hora | Técnico | Sede | Productos | 
           Total | Método | —

  Each row 52px: 
    Hora: "15:20" gray
    Técnico: avatar initials + name
    Sede: blue pill "Ate" or "Santa Anita"
    Productos: truncated product list
    Total: orange bold
    Método: icon + "Efectivo" or "Yape"
    Action: eye icon blue

Right column (35%):

  [ STOCK ALERTS CARD ]
  White card
  Title: "⚠️ Alertas de stock" Bold 16px red
  
  List items (each 56px, red left border 3px):
    Product name Bold 13px
    Blue pill: sede name
    Red text: "Stock: X unidades"
    CTA: "Reponer →" orange small button

  Footer: "Ver todos los productos →" blue link

  [ ORDERS BY STATUS CARD ]
  White card
  Title: "Pedidos web hoy" Bold 16px
  
  Donut chart (180px):
    Orange slice: Pendientes
    Green slice:  Entregados
    Red slice:    Cancelados
  
  Legend right of chart:
    ■ Pendientes: X
    ■ Entregados: X
    ■ Cancelados: X

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 3 — GESTIÓN DE PRODUCTOS
boticascentral.com/admin/productos
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Gestión de Productos"

[ ACTION BAR ]
Left:  Search input "Buscar producto, principio activo..."
       gray border, 320px wide
Right: 
  Filter dropdown "Laboratorio ▾"
  Filter dropdown "Categoría ▾"
  Primary CTA: "+ Nuevo producto" orange button

[ PRODUCTS TABLE ]
White card full width, soft shadow

Columns:
Imagen | Producto | Principio Activo | Laboratorio | 
Categoría | Precio | Stock Ate | Stock S.Anita | 
Vencimiento | Acciones

Each row 64px:
  Imagen:    Product thumbnail 40x40px rounded
  Producto:  Name Bold 14px + generic name gray 12px below
  P. Activo: gray italic 13px
  Lab:       blue text 13px
  Categoría: gray pill outlined
  Precio:    "S/ 00.00" orange bold
  Stock Ate: green bold if ok, amber if low, red if zero
  Stock S.A: same logic
  Vencimiento: 
    green "DD/MM/AA" if >3 months
    amber if <3 months  
    red if <1 month
  Acciones:  
    ✏️ edit icon blue
    🗑️ delete icon red

Low stock row highlight: 
  Entire row bg: #FFFBEB (light amber)

Expired row highlight:
  Entire row bg: #FFF1F1 (light red)

[ PAGINATION + COUNT ]
Left: "Mostrando X de XX productos"
Right: pagination orange active pill

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 3B — CREAR / EDITAR PRODUCTO
boticascentral.com/admin/productos/nuevo
boticascentral.com/admin/productos/:id/editar
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Nuevo Producto" or "Editar Producto"
Back link: "← Volver a productos" blue
Layout: 2 columns + full-width bottom section

[ LEFT COLUMN — Basic Info (60%) ]
White card "Información del producto"

  Required fields (red asterisk):
  Input: Nombre comercial *
  Input: Nombre genérico (relación marca/genérico)
  Input: Principio activo / Composición *
  Dropdown: Laboratorio * (+ "Agregar nuevo" blue link)
  Dropdown: Categoría * (+ "Crear categoría" blue link)
  Input: Precio de venta * "S/ ___"
  Input: Registro sanitario *

  Product image upload zone:
  Dashed border box 200x200px:
  "Arrastra una imagen o haz clic"
  gray centered text + upload icon
  Accepted: JPG, PNG max 2MB

[ RIGHT COLUMN — Lot & Expiry (40%) ]
White card "Lote y vencimiento"

  Input: Número de lote *
  Date picker: Fecha de vencimiento *
  
  Expiry warning logic (show dynamically):
    If >3 months: green check "Vigente"
    If <3 months: amber warning "Próximo a vencer"
    If past:      red alert "VENCIDO — no publicar"

White card "Composición y seguridad"
  Textarea: Contraindicaciones
  Textarea: Efectos adversos
  Toggle: "¿Requiere receta médica?"

[ FULL WIDTH — Stock by Branch ]
White card "Stock inicial por sede"

  Two columns side by side:
  
  Left — Sede Ate:
    Input: Stock actual * "XX unidades"
    Input: Stock mínimo (alert threshold) "X unidades"
    Helper: "Se alertará cuando llegue a este número"
    gray 12px
  
  Right — Sede Santa Anita:
    Same inputs mirrored

[ ACTION BUTTONS — sticky bottom bar ]
White bar full width, shadow top:
Left:  "Cancelar" gray outlined
Right: "Guardar producto" orange solid large

[ DELETE CONFIRMATION MODAL ]
Overlay, white card centered, max 440px:
Red icon ⚠️ large centered
"¿Eliminar este producto?"
"Esta acción no se puede deshacer.
 El producto se eliminará de ambas sedes."
Input confirmation: "Escribe el nombre del producto 
                    para confirmar" gray 12px
Input field bordered red
Buttons: "Sí, eliminar" red | "Cancelar" gray

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 4 — CONTROL DE STOCK POR SEDE
boticascentral.com/admin/stock
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Control de Stock"

[ BRANCH TABS — prominent ]
Two large tab cards side by side (not just underline tabs):
  [ 📍 Sede Ate ] active: orange border + orange title
  [ 📍 Sede Santa Anita ] inactive: gray border

[ SUMMARY BAR — for active branch ]
3 stat pills in a row:
  ✅ "XX productos con stock normal" green
  ⚠️ "X productos con stock bajo" amber
  ❌ "X productos agotados" red

[ STOCK TABLE ]
White card full width

Columns:
Producto | Principio Activo | Laboratorio | 
Stock Actual | Stock Mínimo | Estado | 
Últ. Actualización | Acciones

Each row 56px:
  Stock Actual: 
    Bold number + "unidades" gray
  Stock Mínimo: 
    gray number (threshold)
  Estado:
    Green pill "Normal" if above minimum
    Amber pill "Stock bajo" if at or near minimum
    Red pill "Agotado" if zero

  Acciones:
    "Reponer stock" orange small button
    → opens inline edit row or side drawer

[ RESTOCK SIDE DRAWER ]
Slides in from right, 380px wide, white bg:
Title: "Reponer stock — [Producto]" Bold 16px
Subtext: "Sede Ate" blue pill

  Current stock display:
  Large number center: "X unidades" gray

  Input: "Unidades a agregar" *
    Numeric large input, centered
    Preview below: "Nuevo total: X unidades" 
    green bold dynamic

  Input: "Número de lote nuevo" 
  Date picker: "Nueva fecha de vencimiento"
  Textarea: "Notas (opcional)"

  Buttons:
  "Confirmar reposición" orange full-width
  "Cancelar" gray text link centered

[ ALERTS SECTION — below table ]
White card
Title: "⚠️ Historial de alertas de stock" Bold 16px

List: each row shows
  Date | Product | Branch | 
  "Bajó a X unidades" amber text | 
  "Repuesto" green or "Pendiente" amber pill

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 5 — GESTIÓN DE USUARIOS
boticascentral.com/admin/usuarios
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Gestión de Usuarios"

[ ACTION BAR ]
Left:  Search "Buscar trabajador..."
Right: "+ Nuevo usuario" orange button

[ USERS TABLE ]
White card full width

Columns:
Usuario | Nombre | Rol | Sede | 
Estado | Último acceso | Acciones

Each row 60px:
  Usuario:  
    Avatar circle initials (orange bg) + 
    code "TEC-001" gray 12px
  Nombre:   Bold 14px
  Rol:      
    Orange pill "Administrador" 
    or Blue pill "Técnico"
  Sede:     
    "Ate" or "Santa Anita" or "Ambas" gray pill
  Estado:   
    Green dot + "Activo"
    or Gray dot + "Inactivo"
  Último acceso: 
    "Hoy 08:00 AM" or "Hace 3 días" gray 13px
  Acciones: 
    ✏️ edit blue | 🔒 reset password amber | 
    toggle active/inactive gray

[ CREATE / EDIT USER MODAL ]
Overlay white card, 480px wide, 16px radius:
Title: "Nuevo usuario" or "Editar usuario" Bold 18px

  Input: Nombre completo *
  Input: Código de usuario * 
    helper: "Solo números, mínimo 4 dígitos" gray 12px
  Input: Contraseña *
    helper: "Solo números" gray 12px
    (for workers, numeric codes as per interview)
  Dropdown: Rol * → Técnico / Administrador
  Dropdown: Sede asignada * → Ate / Santa Anita / Ambas
  Toggle: Estado → Activo / Inactivo

  Buttons:
  "Guardar" orange | "Cancelar" gray

[ DEACTIVATE CONFIRMATION MODAL ]
White overlay:
"¿Desactivar a [Nombre]?"
"El usuario no podrá iniciar sesión hasta 
 que vuelvas a activarlo."
Buttons: "Sí, desactivar" red | "Cancelar" gray

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCREEN 6 — REPORTES DE VENTAS Y ROTACIÓN
boticascentral.com/admin/reportes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Page title: "Reportes"

[ FILTER BAR ]
Row of controls, white card:
  Date range picker: "Desde [DD/MM] Hasta [DD/MM]"
  Dropdown: Sede → Ambas / Ate / Santa Anita
  Dropdown: Período → Diario / Semanal / Mensual
  Dropdown: Técnico → Todos / [names list]
  CTA: "Generar reporte" orange button
  Secondary: "Exportar Excel" blue outlined button
             with download icon

[ KPI SUMMARY ROW — 4 cards ]
Same card style as dashboard:

  Card 1: Total ventas período
    "S/ 0,000.00" orange ExtraBold 36px
    Subtext: vs período anterior ↑ X% green

  Card 2: Total transacciones
    "XX" blue ExtraBold 36px
    Subtext: "Promedio S/ 00.00 por venta"

  Card 3: Producto más vendido
    Product name Bold 16px orange
    "XX unidades vendidas" gray 13px

  Card 4: Técnico con más ventas
    Name Bold 16px blue
    "S/ 0,000.00 registrados" gray 13px

[ CHARTS ROW — 2 columns ]

Left (60%) — Sales over time:
  White card "Evolución de ventas"
  Line chart: 
    Orange line = Ate, Blue line = Santa Anita
    X axis: dates in range
    Y axis: S/ amounts
    Hover tooltip with exact values
    Toggle above: [ Monto ] [ Transacciones ]

Right (40%) — Payment methods:
  White card "Métodos de pago"
  Donut chart:
    Orange: Efectivo XX%
    Blue: Yape XX%
  Total center: "XX ventas"
  Legend below with amounts

[ TOP PRODUCTS TABLE ]
White card full width
Title: "Productos más vendidos (rotación)" Bold 16px
Subtitle: "Período seleccionado · Ambas sedes" gray 13px

Columns:
# | Producto | Principio Activo | Laboratorio | 
Unidades Vendidas | Ingresos | Sede Mayor Venta | 
Tendencia

Each row 52px:
  #: rank number gray Bold
  Producto: name + generic gray below
  Unidades: Bold blue
  Ingresos: orange bold "S/ 0,000.00"
  Sede mayor venta: pill Ate or Santa Anita
  Tendencia: 
    ↑ green arrow if growing
    ↓ red arrow if declining
    → gray if stable

[ SALES BY WORKER TABLE ]
White card full width
Title: "Ventas por técnico" Bold 16px

Columns:
Técnico | Sede | Transacciones | 
Total Efectivo | Total Yape | Total General

Footer row: TOTALES bold across all columns

[ EXPORT SECTION ]
White card
Title: "Exportar reportes" Bold 16px

Two download cards side by side:
  Card 1: "Reporte de ventas"
    Description: "Detalle completo por transacción"
    Button: "Descargar Excel" blue with icon

  Card 2: "Reporte de rotación"
    Description: "Productos más vendidos del período"
    Button: "Descargar Excel" blue with icon