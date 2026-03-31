import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://asfrtcbpygesbhqhqull.supabase.co'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFzZnJ0Y2JweWdlc2JocWhxdWxsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDA1ODUwNSwiZXhwIjoyMDg5NjM0NTA1fQ.kGETdDRRh0ODR7izZ-hcG0-9qW3ch9w3XugUv85w_L4'

const db = createClient(SUPABASE_URL, SERVICE_KEY)

const COMPANY_ID = 'aabbccdd-1111-2222-3333-444455556666'
const today = new Date().toISOString().slice(0, 10)
const d = (days) => { const dt = new Date(); dt.setDate(dt.getDate() + days); return dt.toISOString().slice(0, 10) }

const clients = [
  { id: 'c1000000-0000-0000-0000-000000000001', company_id: COMPANY_ID, codigo: 'CLI-001', name: 'Supermercados Norte S.A.', cuit: '30-71234567-8', direccion: 'Av. Corrientes 1234, CABA', email: 'compras@supernorte.com', phone: '011-4567-8901', status: 'activo' },
  { id: 'c1000000-0000-0000-0000-000000000002', company_id: COMPANY_ID, codigo: 'CLI-002', name: 'Distribuidora del Sur S.R.L.', cuit: '30-65432198-7', direccion: 'Ruta 2 Km 45, La Plata', email: 'admin@distrsur.com', phone: '0221-456-7890', status: 'activo' },
  { id: 'c1000000-0000-0000-0000-000000000003', company_id: COMPANY_ID, codigo: 'CLI-003', name: 'Almacenes Central S.R.L.', cuit: '30-54321987-6', direccion: 'San Martín 567, Rosario', email: 'pedidos@almacencentral.com', phone: '0341-456-7890', status: 'activo' },
  { id: 'c1000000-0000-0000-0000-000000000004', company_id: COMPANY_ID, codigo: 'CLI-004', name: 'Comercios Reunidos S.A.', cuit: '30-43219876-5', direccion: 'Italia 890, Córdoba', email: 'gerencia@comerciosreunidos.com', phone: '0351-567-8901', status: 'activo' },
  { id: 'c1000000-0000-0000-0000-000000000005', company_id: COMPANY_ID, codigo: 'CLI-005', name: 'Productos del Campo S.A.', cuit: '30-32198765-4', direccion: 'Belgrano 234, Mendoza', email: 'ventas@prodcampo.com', phone: '0261-678-9012', status: 'activo' },
]

const suppliers = [
  { id: 's1000000-0000-0000-0000-000000000001', company_id: COMPANY_ID, name: 'Importadora Textil S.A.', cuit: '30-99887766-5', contact: 'María López', email: 'ventas@imptextil.com', phone: '011-5678-9012', payment_days: 30, bank: 'Banco Galicia', cbu: '0070012530004012345678', product_codes: [] },
  { id: 's1000000-0000-0000-0000-000000000002', company_id: COMPANY_ID, name: 'Proveedor Logístico Norte S.R.L.', cuit: '30-88776655-4', contact: 'Carlos Díaz', email: 'logistica@provnorte.com', phone: '011-6789-0123', payment_days: 15, bank: 'Banco Nación', cbu: '0110099830009912345678', product_codes: [] },
  { id: 's1000000-0000-0000-0000-000000000003', company_id: COMPANY_ID, name: 'Materiales Construcción S.R.L.', cuit: '30-77665544-3', contact: 'Ana García', email: 'compras@matconstruccion.com', phone: '0341-789-0123', payment_days: 45, bank: 'BBVA', cbu: '0170096520096012345678', product_codes: [] },
]

const saleInvoices = [
  { id: 'fi000000-0000-0000-0000-000000000001', company_id: COMPANY_ID, ref: 'FAC-001', nro_factura: '0001-00000001', type: 'factura', client_id: 'c1000000-0000-0000-0000-000000000001', client_name: 'Supermercados Norte S.A.', date: d(-30), due: d(-15), total: 485000, total_neto: 401240, total_iva: 83760, status: 'cobrada', metodo_pago: 'Transferencia — Banco Galicia', lines: JSON.stringify([{productId:'p1',name:'Producto Premium A',qty:100,unitPrice:2500,subtotal:250000},{productId:'p2',name:'Producto Estándar B',qty:150,unitPrice:1567,subtotal:235050}]), modifica_stock: true, observaciones: 'Entrega en depósito central', moneda: 'ARS', vendedor: 'Juan Pérez' },
  { id: 'fi000000-0000-0000-0000-000000000002', company_id: COMPANY_ID, ref: 'FAC-002', nro_factura: '0001-00000002', type: 'factura', client_id: 'c1000000-0000-0000-0000-000000000002', client_name: 'Distribuidora del Sur S.R.L.', date: d(-20), due: d(10), total: 312500, total_neto: 258678, total_iva: 53822, status: 'pendiente', metodo_pago: null, lines: JSON.stringify([{productId:'p3',name:'Artículo Línea C',qty:250,unitPrice:1250,subtotal:312500}]), modifica_stock: true, observaciones: '', moneda: 'ARS', vendedor: 'Laura Gómez' },
  { id: 'fi000000-0000-0000-0000-000000000003', company_id: COMPANY_ID, ref: 'FAC-003', nro_factura: '0001-00000003', type: 'factura', client_id: 'c1000000-0000-0000-0000-000000000003', client_name: 'Almacenes Central S.R.L.', date: d(-10), due: d(20), total: 178900, total_neto: 148099, total_iva: 30801, status: 'pendiente', metodo_pago: null, lines: JSON.stringify([{productId:'p1',name:'Producto Premium A',qty:50,unitPrice:2500,subtotal:125000},{productId:'p4',name:'Accesorio D',qty:30,unitPrice:1797,subtotal:53900}]), modifica_stock: true, observaciones: 'Cliente nuevo, verificar dirección', moneda: 'ARS', vendedor: 'Juan Pérez' },
  { id: 'fi000000-0000-0000-0000-000000000004', company_id: COMPANY_ID, ref: 'FAC-004', nro_factura: '0001-00000004', type: 'factura', client_id: 'c1000000-0000-0000-0000-000000000004', client_name: 'Comercios Reunidos S.A.', date: d(-5), due: d(25), total: 923400, total_neto: 764793, total_iva: 158607, status: 'pendiente', metodo_pago: null, lines: JSON.stringify([{productId:'p2',name:'Producto Estándar B',qty:400,unitPrice:1567,subtotal:626800},{productId:'p3',name:'Artículo Línea C',qty:238,unitPrice:1250,subtotal:296600}]), modifica_stock: true, observaciones: 'Condición especial acordada con gerencia', moneda: 'ARS', vendedor: 'Laura Gómez' },
  { id: 'fi000000-0000-0000-0000-000000000005', company_id: COMPANY_ID, ref: 'FAC-005', nro_factura: '0001-00000005', type: 'factura', client_id: 'c1000000-0000-0000-0000-000000000005', client_name: 'Productos del Campo S.A.', date: d(-45), due: d(-15), total: 267000, total_neto: 221074, total_iva: 45926, status: 'cobrada', metodo_pago: 'Cheque propio N°00012345 — Banco Nación', lines: JSON.stringify([{productId:'p4',name:'Accesorio D',qty:100,unitPrice:1797,subtotal:179700},{productId:'p1',name:'Producto Premium A',qty:35,unitPrice:2500,subtotal:87500}]), modifica_stock: true, observaciones: '', moneda: 'ARS', vendedor: 'Juan Pérez' },
  { id: 'fi000000-0000-0000-0000-000000000006', company_id: COMPANY_ID, ref: 'REM-001', nro_factura: null, type: 'remito', client_id: 'c1000000-0000-0000-0000-000000000001', client_name: 'Supermercados Norte S.A.', date: d(-25), due: null, total: 185000, total_neto: 153306, total_iva: 31694, status: 'emitido', metodo_pago: null, lines: JSON.stringify([{productId:'p3',name:'Artículo Línea C',qty:148,unitPrice:1250,subtotal:185000}]), modifica_stock: true, observaciones: 'Entrega urgente', moneda: 'ARS', vendedor: 'Laura Gómez' },
  { id: 'fi000000-0000-0000-0000-000000000007', company_id: COMPANY_ID, ref: 'REM-002', nro_factura: null, type: 'remito', client_id: 'c1000000-0000-0000-0000-000000000002', client_name: 'Distribuidora del Sur S.R.L.', date: d(-15), due: null, total: 94500, total_neto: 78223, total_iva: 16277, status: 'emitido', metodo_pago: null, lines: JSON.stringify([{productId:'p2',name:'Producto Estándar B',qty:60,unitPrice:1575,subtotal:94500}]), modifica_stock: false, observaciones: '', moneda: 'ARS', vendedor: 'Juan Pérez' },
  { id: 'fi000000-0000-0000-0000-000000000008', company_id: COMPANY_ID, ref: 'REM-003', nro_factura: null, type: 'remito', client_id: 'c1000000-0000-0000-0000-000000000003', client_name: 'Almacenes Central S.R.L.', date: d(-8), due: null, total: 63000, total_neto: 52149, total_iva: 10851, status: 'emitido', metodo_pago: null, lines: JSON.stringify([{productId:'p1',name:'Producto Premium A',qty:25,unitPrice:2520,subtotal:63000}]), modifica_stock: true, observaciones: 'Sin observaciones', moneda: 'ARS', vendedor: 'Laura Gómez' },
  { id: 'fi000000-0000-0000-0000-000000000009', company_id: COMPANY_ID, ref: 'PRE-001', nro_factura: null, type: 'presupuesto', client_id: 'c1000000-0000-0000-0000-000000000004', client_name: 'Comercios Reunidos S.A.', date: d(-3), due: d(27), total: 540000, total_neto: 446281, total_iva: 93719, status: 'pendiente', metodo_pago: null, lines: JSON.stringify([{productId:'p2',name:'Producto Estándar B',qty:200,unitPrice:1700,subtotal:340000},{productId:'p3',name:'Artículo Línea C',qty:160,unitPrice:1250,subtotal:200000}]), modifica_stock: false, observaciones: 'Válido por 30 días', moneda: 'ARS', vendedor: 'Juan Pérez' },
  { id: 'fi000000-0000-0000-0000-000000000010', company_id: COMPANY_ID, ref: 'PRE-002', nro_factura: null, type: 'presupuesto', client_id: 'c1000000-0000-0000-0000-000000000005', client_name: 'Productos del Campo S.A.', date: today, due: d(30), total: 198000, total_neto: 163636, total_iva: 34364, status: 'pendiente', metodo_pago: null, lines: JSON.stringify([{productId:'p4',name:'Accesorio D',qty:110,unitPrice:1800,subtotal:198000}]), modifica_stock: false, observaciones: 'Precio sujeto a variación de tipo de cambio', moneda: 'ARS', vendedor: 'Laura Gómez' },
]

const purchaseInvoices = [
  { id: 'b1000000-0000-0000-0000-000000000001', company_id: COMPANY_ID, ref: 'CMP-001', nro_factura: 'A-0002-00001234', supplier_id: 's1000000-0000-0000-0000-000000000001', supplier_name: 'Importadora Textil S.A.', date: d(-35), due_date: d(-5), total: 628000, total_neto: 519835, total_iva: 108165, status: 'pagada', lines: JSON.stringify([{productId:'p1',supplierCode:'IT-A001',name:'Producto Premium A',qty:200,unitPrice:2590},{productId:'p4',supplierCode:'IT-D004',name:'Accesorio D',qty:80,unitPrice:1225}]) },
  { id: 'b1000000-0000-0000-0000-000000000002', company_id: COMPANY_ID, ref: 'CMP-002', nro_factura: 'B-0001-00005678', supplier_id: 's1000000-0000-0000-0000-000000000002', supplier_name: 'Proveedor Logístico Norte S.R.L.', date: d(-20), due_date: d(10), total: 142500, total_neto: 118182, total_iva: 24318, status: 'pendiente', lines: JSON.stringify([{productId:'p3',supplierCode:'PLN-C003',name:'Artículo Línea C',qty:100,unitPrice:950},{productId:'p2',supplierCode:'PLN-B002',name:'Producto Estándar B',qty:100,unitPrice:475}]) },
  { id: 'b1000000-0000-0000-0000-000000000003', company_id: COMPANY_ID, ref: 'CMP-003', nro_factura: 'A-0003-00009012', supplier_id: 's1000000-0000-0000-0000-000000000003', supplier_name: 'Materiales Construcción S.R.L.', date: d(-15), due_date: d(30), total: 385000, total_neto: 318182, total_iva: 66818, status: 'pendiente', lines: JSON.stringify([{productId:'p5',supplierCode:'MC-E005',name:'Material E',qty:500,unitPrice:770}]) },
  { id: 'b1000000-0000-0000-0000-000000000004', company_id: COMPANY_ID, ref: 'CMP-004', nro_factura: 'B-0001-00003456', supplier_id: 's1000000-0000-0000-0000-000000000001', supplier_name: 'Importadora Textil S.A.', date: d(-60), due_date: d(-30), total: 219000, total_neto: 181405, total_iva: 37595, status: 'pagada', lines: JSON.stringify([{productId:'p2',supplierCode:'IT-B002',name:'Producto Estándar B',qty:300,unitPrice:730}]) },
  { id: 'b1000000-0000-0000-0000-000000000005', company_id: COMPANY_ID, ref: 'CMP-005', nro_factura: 'A-0002-00007890', supplier_id: 's1000000-0000-0000-0000-000000000002', supplier_name: 'Proveedor Logístico Norte S.R.L.', date: d(-5), due_date: d(25), total: 96000, total_neto: 79339, total_iva: 16661, status: 'pendiente', lines: JSON.stringify([{productId:'p1',supplierCode:'PLN-A001',name:'Producto Premium A',qty:40,unitPrice:2400}]) },
]

const cheques = [
  { id: 'cc000000-0000-0000-0000-000000000001', company_id: COMPANY_ID, tipo: 'cobrar', numero: '00012345', fecha_pago: d(5), fecha_vencimiento: d(35), monto: 267000, emisor: 'Productos del Campo S.A.', estado: 'pendiente' },
  { id: 'cc000000-0000-0000-0000-000000000002', company_id: COMPANY_ID, tipo: 'cobrar', numero: '00045678', fecha_pago: d(15), fecha_vencimiento: d(45), monto: 150000, emisor: 'Comercios Reunidos S.A.', estado: 'pendiente' },
  { id: 'cc000000-0000-0000-0000-000000000003', company_id: COMPANY_ID, tipo: 'pagar', numero: '00098765', fecha_pago: d(8), fecha_vencimiento: d(38), monto: 385000, emisor: 'Materiales Construcción S.R.L.', estado: 'pendiente' },
  { id: 'cc000000-0000-0000-0000-000000000004', company_id: COMPANY_ID, tipo: 'cobrar', numero: '00011111', fecha_pago: d(-5), fecha_vencimiento: d(25), monto: 312500, emisor: 'Distribuidora del Sur S.R.L.', estado: 'cobrado' },
  { id: 'cc000000-0000-0000-0000-000000000005', company_id: COMPANY_ID, tipo: 'pagar', numero: '00022222', fecha_pago: d(20), fecha_vencimiento: d(50), monto: 142500, emisor: 'Proveedor Logístico Norte S.R.L.', estado: 'pendiente' },
]

const CAJA_ID = 'ca000000-0000-0000-0000-000000000001'
const cajas = [
  { id: CAJA_ID, company_id: COMPANY_ID, date: today, turno: 'mañana', monto_inicial: 50000, estado: 'abierta' },
]

const cajaMovimientos = [
  { id: 'cd000000-0000-0000-0000-000000000001', company_id: COMPANY_ID, caja_id: CAJA_ID, tipo: 'ingreso', monto: 485000, fecha: today, hora: '09:30', motivo: 'Cobro factura FAC-001 - Supermercados Norte', empleado_id: null, observaciones: '', origen: 'venta', origen_id: 'f1000000-0000-0000-0000-000000000001' },
  { id: 'cd000000-0000-0000-0000-000000000002', company_id: COMPANY_ID, caja_id: CAJA_ID, tipo: 'egreso', monto: 628000, fecha: today, hora: '10:15', motivo: 'Pago factura CMP-001 - Importadora Textil', empleado_id: null, observaciones: '', origen: 'compra', origen_id: 'b1000000-0000-0000-0000-000000000001' },
  { id: 'cd000000-0000-0000-0000-000000000003', company_id: COMPANY_ID, caja_id: CAJA_ID, tipo: 'ingreso', monto: 267000, fecha: today, hora: '11:00', motivo: 'Cobro factura FAC-005 - Productos del Campo', empleado_id: null, observaciones: '', origen: 'venta', origen_id: 'f1000000-0000-0000-0000-000000000005' },
  { id: 'cd000000-0000-0000-0000-000000000004', company_id: COMPANY_ID, caja_id: CAJA_ID, tipo: 'egreso', monto: 15000, fecha: today, hora: '14:30', motivo: 'Gastos varios de oficina', empleado_id: null, observaciones: 'Insumos y papelería', origen: 'manual', origen_id: null },
]

async function seed() {
  console.log('🌱 Iniciando seed de datos para Tester...\n')

  // 1. Crear empresa
  console.log('📦 Creando empresa...')
  const { error: compErr } = await db.from('companies').upsert({
    id: COMPANY_ID, name: 'Empresa Tester S.A.', cuit: '30-12345678-9',
    contact_person: 'Tester Admin', phone: '011-1234-5678',
    address: 'Av. de Mayo 1234, CABA',
    status: 'approved', requested_at: new Date().toISOString()
  })
  if (compErr) { console.error('❌ Error empresa:', compErr.message); return }
  console.log('✅ Empresa creada\n')

  // 2. Crear usuario auth (o reusar si ya existe)
  console.log('👤 Creando usuario tester...')
  let userId
  const { data: authData, error: authErr } = await db.auth.admin.createUser({
    email: 'tester@nexopyme.com',
    password: 'Tester123!',
    email_confirm: true,
    user_metadata: { display_name: 'Tester' }
  })
  if (authErr) {
    if (authErr.message.includes('already been registered') || authErr.message.includes('already exists')) {
      console.log('ℹ️  Usuario ya existe, buscando ID...')
      const { data: { users }, error: listErr } = await db.auth.admin.listUsers()
      if (listErr) { console.error('❌ Error buscando usuario:', listErr.message); return }
      const existing = users.find(u => u.email === 'tester@nexopyme.com')
      if (!existing) { console.error('❌ No se encontró el usuario tester'); return }
      userId = existing.id
      console.log('✅ Usuario encontrado:', userId, '\n')
    } else {
      console.error('❌ Error auth:', authErr.message); return
    }
  } else {
    userId = authData.user.id
    console.log('✅ Usuario auth creado:', userId, '\n')
  }

  // 3. Crear perfil
  console.log('🪪 Creando perfil...')
  const { error: profErr } = await db.from('profiles').upsert({
    id: userId, company_id: COMPANY_ID, role: 'jefe',
    display_name: 'Tester', active: true, email: 'tester@nexopyme.com'
  })
  if (profErr) { console.error('❌ Error perfil:', profErr.message); return }
  console.log('✅ Perfil creado\n')

  // 4. Clientes
  console.log('👥 Insertando clientes...')
  const { error: cliErr } = await db.from('clients').upsert(clients)
  if (cliErr) console.error('❌ Error clientes:', cliErr.message)
  else console.log(`✅ ${clients.length} clientes\n`)

  // 5. Proveedores
  console.log('🏭 Insertando proveedores...')
  const { error: supErr } = await db.from('suppliers').upsert(suppliers)
  if (supErr) console.error('❌ Error proveedores:', supErr.message)
  else console.log(`✅ ${suppliers.length} proveedores\n`)

  // 6. Facturas de venta
  console.log('🧾 Insertando facturas de venta...')
  const { error: siErr } = await db.from('sale_invoices').upsert(saleInvoices)
  if (siErr) console.error('❌ Error facturas venta:', siErr.message)
  else console.log(`✅ ${saleInvoices.length} documentos de venta\n`)

  // 7. Facturas de compra
  console.log('🛒 Insertando facturas de compra...')
  const { error: piErr } = await db.from('purchase_invoices').upsert(purchaseInvoices)
  if (piErr) console.error('❌ Error facturas compra:', piErr.message)
  else console.log(`✅ ${purchaseInvoices.length} facturas de compra\n`)

  // 8. Cheques
  console.log('💳 Insertando cheques...')
  const { error: chErr } = await db.from('cheques').upsert(cheques)
  if (chErr) console.error('❌ Error cheques:', chErr.message)
  else console.log(`✅ ${cheques.length} cheques\n`)

  // 9. Caja
  console.log('💰 Insertando caja y movimientos...')
  const { error: cajaErr } = await db.from('cajas').upsert(cajas)
  if (cajaErr) console.error('❌ Error cajas:', cajaErr.message)
  else console.log('✅ Caja creada')
  const { error: movErr } = await db.from('caja_movimientos').upsert(cajaMovimientos)
  if (movErr) console.error('❌ Error movimientos:', movErr.message)
  else console.log(`✅ ${cajaMovimientos.length} movimientos de caja\n`)

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🎉 Seed completado!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Email:    tester@nexopyme.com')
  console.log('Password: Tester123!')
  console.log('Empresa:  Empresa Tester S.A.')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

seed().catch(console.error)
