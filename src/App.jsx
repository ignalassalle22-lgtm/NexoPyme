import { useState, useMemo, useEffect, createContext, useContext } from "react";
import * as XLSX from 'xlsx-js-style';
import { Workbook as ExcelWorkbook } from 'exceljs';
import { supabase } from './lib/supabase.js';

// ─── THEME ────────────────────────────────────────────────────────────────────
const T = {
  bg: "#0d1117", sidebar: "#0a0e14", paper: "#161b22", surface: "#1c2333",
  surface2: "#212836", border: "#2a3441", border2: "#1e2d3d",
  ink: "#e6edf3", muted: "#7d8590", faint: "#3d4a5c",
  accent: "#2ea043", accentLight: "#0d2818", accentGlow: "#2ea04360",
  blue: "#388bfd", blueLight: "#0d1f3c",
  orange: "#f0883e", orangeLight: "#2b1a0e",
  red: "#f85149", redLight: "#2d0f0e",
  yellow: "#e3b341", yellowLight: "#2b2008",
  purple: "#a371f7", purpleLight: "#1e1240",
};

// ─── INITIAL DATA ─────────────────────────────────────────────────────────────
const initPriceLists = [
  { id: "lista_a", label: "Lista A · Minorista" },
  { id: "lista_b", label: "Lista B · Mayorista" },
  { id: "lista_c", label: "Lista C · Distribuidor" },
];

const initProducts = [
  { id: "p1", name: "Pintura látex blanca 20L", sku: "PIN-001", stock: 45, minStock: 20, unit: "unidad", category: "Pinturas", cost: 12800, iva: 21, prices: { lista_a: 18500, lista_b: 15800, lista_c: 13500 }, clientOverrides: [{ clientId: "c2", customCode: "VIDAL-PLA20", price: 14200 }, { clientId: "c3", customCode: "DSM-P001", discount: 8 }] },
  { id: "p2", name: "Cemento Portland 50kg", sku: "CEM-002", stock: 8, minStock: 15, unit: "bolsa", category: "Materiales", cost: 3400, iva: 10.5, prices: { lista_a: 4200, lista_b: 3600, lista_c: 3100 }, clientOverrides: [{ clientId: "c1", customCode: "DL-CEM50", discount: 5 }] },
  { id: "p3", name: "Caño PVC 4\" x 3m", sku: "PVC-003", stock: 120, minStock: 30, unit: "unidad", category: "Plomería", cost: 2100, iva: 21, prices: { lista_a: 2800, lista_b: 2400, lista_c: 2100 }, clientOverrides: [] },
  { id: "p4", name: "Cable eléctrico 2.5mm rollo", sku: "ELE-004", stock: 3, minStock: 10, unit: "rollo", category: "Electricidad", cost: 9200, iva: 21, prices: { lista_a: 12600, lista_b: 10800, lista_c: 9500 }, clientOverrides: [{ clientId: "c2", customCode: "VIDAL-CAB25", price: 9900 }] },
  { id: "p5", name: "Tornillo autoperforante c/500", sku: "TOR-005", stock: 67, minStock: 25, unit: "caja", category: "Ferretería", cost: 1450, iva: 21, prices: { lista_a: 1850, lista_b: 1550, lista_c: 1300 }, clientOverrides: [] },
  { id: "p6", name: "Pintura exterior premium 10L", sku: "PIN-006", stock: 32, minStock: 12, unit: "unidad", category: "Pinturas", cost: 18500, iva: 21, prices: { lista_a: 25900, lista_b: 22400, lista_c: 19800 }, clientOverrides: [] },
  { id: "p7", name: "Adhesivo cerámico 30kg", sku: "ADH-007", stock: 55, minStock: 20, unit: "bolsa", category: "Materiales", cost: 2800, iva: 21, prices: { lista_a: 3900, lista_b: 3400, lista_c: 2950 }, clientOverrides: [{ clientId: "c5", customCode: "DC-ADH30", discount: 7 }] },
  { id: "p8", name: "Llave térmica 32A bipolar", sku: "ELE-008", stock: 4, minStock: 15, unit: "unidad", category: "Electricidad", cost: 4200, iva: 21, prices: { lista_a: 5800, lista_b: 5100, lista_c: 4500 }, clientOverrides: [] },
  { id: "p9", name: "Membrana líquida impermeab. 20kg", sku: "IMP-009", stock: 0, minStock: 8, unit: "balde", category: "Impermeabilización", cost: 8900, iva: 21, prices: { lista_a: 12500, lista_b: 10800, lista_c: 9500 }, clientOverrides: [] },
  { id: "p10", name: "Rejilla pluvial 30cm acero inox", sku: "PLO-010", stock: 80, minStock: 20, unit: "unidad", category: "Plomería", cost: 950, iva: 21, prices: { lista_a: 1380, lista_b: 1200, lista_c: 1050 }, clientOverrides: [] },
];

const initClients = [
  { id: "c1", codigo: "FDL-001", name: "Ferretería Don Luis", cuit: "20-18234567-3", direccion: "Av. Corrientes 1234, CABA", email: "luis@ferreteria.com", phone: "11-4523-8901", priceList: "lista_b", lastPurchase: "2026-03-08", status: "activo", nextFollowUp: "2026-03-25" },
  { id: "c2", codigo: "CV-002", name: "Constructora Vidal", cuit: "30-71882341-9", direccion: "Av. San Martín 4500, GBA Norte", email: "marta@vidal.com", phone: "11-3344-7722", priceList: "lista_c", lastPurchase: "2026-03-05", status: "en riesgo", nextFollowUp: "2026-03-22" },
  { id: "c3", codigo: "DSM-003", name: "Depósito San Martín", cuit: "30-65412300-1", direccion: "Ruta 8 Km 42, GBA Oeste", email: "jorge@deposito.com", phone: "11-5566-1234", priceList: "lista_b", lastPurchase: "2026-03-12", status: "activo", nextFollowUp: "2026-03-28" },
  { id: "c4", codigo: "TH-004", name: "TecnoHogar S.R.L.", cuit: "30-44123098-7", direccion: "Av. Rivadavia 5600, CABA", email: "ana@tecnohog.com", phone: "11-2233-9988", priceList: "lista_a", lastPurchase: "2025-12-15", status: "inactivo", nextFollowUp: "2026-04-01" },
  { id: "c5", codigo: "DC-005", name: "Distribuidora Central S.A.", cuit: "30-80123456-7", direccion: "Parque Industrial Pilar, Lote 14", email: "compras@distcentral.com.ar", phone: "0230-445-8800", priceList: "lista_b", lastPurchase: "2026-03-10", status: "activo", nextFollowUp: "2026-03-30" },
  { id: "c6", codigo: "AET-006", name: "Almacén El Trébol", cuit: "20-35678901-2", direccion: "Calle 9 N° 342, La Plata", email: "trebol@almacen.com", phone: "221-512-7733", priceList: "lista_a", lastPurchase: "2026-03-01", status: "activo", nextFollowUp: "2026-04-05" },
];

const initSuppliers = [
  { id: "s1", name: "Pinturas del Sur S.A.", cuit: "30-71234567-8", contact: "Roberto Cano", email: "ventas@pinturasdelsur.com", phone: "11-4455-6677", paymentDays: 30, cbu: "0720123400000012345678", bank: "Santander", productCodes: [{ productId: "p1", supplierCode: "PDS-LAT20B", lastPrice: 12800 }, { productId: "p6", supplierCode: "PDS-EXT10L", lastPrice: 18500 }, { productId: "p5", supplierCode: "PDS-TOR500", lastPrice: 1450 }] },
  { id: "s2", name: "Materiales Norte S.R.L.", cuit: "30-68901234-5", contact: "Claudia Herrera", email: "compras@matnorte.com", phone: "11-3322-1100", paymentDays: 15, cbu: "0140234500000098765432", bank: "Nación", productCodes: [{ productId: "p2", supplierCode: "MN-CEM50", lastPrice: 3400 }, { productId: "p3", supplierCode: "MN-PVC4X3", lastPrice: 2100 }, { productId: "p7", supplierCode: "MN-ADH30K", lastPrice: 2800 }] },
  { id: "s3", name: "ElectroDistribuidora S.R.L.", cuit: "30-55443322-1", contact: "Marcelo Vega", email: "info@electrodist.com", phone: "11-6677-8899", paymentDays: 0, cbu: "0170345600000011223344", bank: "BBVA", productCodes: [{ productId: "p4", supplierCode: "ED-CAB25R", lastPrice: 9200 }, { productId: "p8", supplierCode: "ED-LT32A", lastPrice: 4200 }] },
  { id: "s4", name: "Impermeabilizantes del Plata S.R.L.", cuit: "30-45678901-3", contact: "Silvia Romero", email: "ventas@imperplata.com", phone: "11-5544-2211", paymentDays: 21, cbu: "0110456700000099887766", bank: "Galicia", productCodes: [{ productId: "p9", supplierCode: "IP-MEM20K", lastPrice: 8900 }, { productId: "p10", supplierCode: "IP-REJ30AI", lastPrice: 950 }] },
];

const initSaleInvoices = [
  // ── OCTUBRE 2025 ────────────────────────────────────────────────────────────
  { id: "FAC-0013", nroFactura: "0001-00001234", type: "factura", clientId: "c1", clientName: "Ferretería Don Luis", date: "2025-10-03", due: "2025-10-18", total: 95200, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 4, unitPrice: 15800, subtotal: 63200 }, { productId: "p5", name: "Tornillo autoperforante c/500", qty: 12, unitPrice: 1550, subtotal: 18600 }, { productId: "p3", name: "Caño PVC 4\" x 3m", qty: 6, unitPrice: 2400, subtotal: 14400 }] },
  { id: "FAC-0014", nroFactura: "0001-00001235", type: "factura", clientId: "c3", clientName: "Depósito San Martín", date: "2025-10-11", due: "2025-10-26", total: 224000, status: "cobrada", lines: [{ productId: "p3", name: "Caño PVC 4\" x 3m", qty: 60, unitPrice: 2400, subtotal: 144000 }, { productId: "p2", name: "Cemento Portland 50kg", qty: 22, unitPrice: 3600, subtotal: 79200 }] },
  { id: "FAC-0015", nroFactura: "0001-00001236", type: "factura", clientId: "c5", clientName: "Distribuidora Central S.A.", date: "2025-10-22", due: "2025-11-06", total: 186400, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 8, unitPrice: 15800, subtotal: 126400 }, { productId: "p6", name: "Pintura exterior premium 10L", qty: 3, unitPrice: 22400, subtotal: 67200 }] },

  // ── NOVIEMBRE 2025 ──────────────────────────────────────────────────────────
  { id: "FAC-0016", nroFactura: "0001-00001237", type: "factura", clientId: "c2", clientName: "Constructora Vidal", date: "2025-11-05", due: "2025-11-20", total: 448000, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 20, unitPrice: 13500, subtotal: 270000 }, { productId: "p2", name: "Cemento Portland 50kg", qty: 36, unitPrice: 3100, subtotal: 111600 }, { productId: "p7", name: "Adhesivo cerámico 30kg", qty: 22, unitPrice: 3100, subtotal: 68200 }] },
  { id: "FAC-0017", nroFactura: "0001-00001238", type: "factura", clientId: "c1", clientName: "Ferretería Don Luis", date: "2025-11-14", due: "2025-11-29", total: 118500, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 5, unitPrice: 15800, subtotal: 79000 }, { productId: "p4", name: "Cable eléctrico 2.5mm rollo", qty: 3, unitPrice: 10800, subtotal: 32400 }, { productId: "p10", name: "Rejilla pluvial 30cm acero inox", qty: 6, unitPrice: 1200, subtotal: 7200 }] },
  { id: "FAC-0018", nroFactura: "0001-00001239", type: "factura", clientId: "c5", clientName: "Distribuidora Central S.A.", date: "2025-11-19", due: "2025-12-04", total: 97400, status: "cobrada", lines: [{ productId: "p6", name: "Pintura exterior premium 10L", qty: 3, unitPrice: 22400, subtotal: 67200 }, { productId: "p7", name: "Adhesivo cerámico 30kg", qty: 10, unitPrice: 3400, subtotal: 34000 }] },
  { id: "FAC-0019", nroFactura: "0001-00001240", type: "factura", clientId: "c6", clientName: "Almacén El Trébol", date: "2025-11-28", due: "2025-12-13", total: 49350, status: "cobrada", lines: [{ productId: "p5", name: "Tornillo autoperforante c/500", qty: 8, unitPrice: 1850, subtotal: 14800 }, { productId: "p3", name: "Caño PVC 4\" x 3m", qty: 8, unitPrice: 2800, subtotal: 22400 }, { productId: "p10", name: "Rejilla pluvial 30cm acero inox", qty: 9, unitPrice: 1380, subtotal: 12420 }] },

  // ── DICIEMBRE 2025 ──────────────────────────────────────────────────────────
  { id: "FAC-0020", nroFactura: "0001-00001241", type: "factura", clientId: "c3", clientName: "Depósito San Martín", date: "2025-12-03", due: "2025-12-18", total: 378000, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 12, unitPrice: 15800, subtotal: 189600 }, { productId: "p6", name: "Pintura exterior premium 10L", qty: 8, unitPrice: 22400, subtotal: 179200 }] },
  { id: "FAC-0021", nroFactura: "0001-00001242", type: "factura", clientId: "c2", clientName: "Constructora Vidal", date: "2025-12-10", due: "2025-12-25", total: 618000, status: "cobrada", lines: [{ productId: "p2", name: "Cemento Portland 50kg", qty: 80, unitPrice: 3100, subtotal: 248000 }, { productId: "p3", name: "Caño PVC 4\" x 3m", qty: 100, unitPrice: 2100, subtotal: 210000 }, { productId: "p7", name: "Adhesivo cerámico 30kg", qty: 52, unitPrice: 3100, subtotal: 161200 }] },
  { id: "FAC-0022", nroFactura: "0001-00001243", type: "factura", clientId: "c1", clientName: "Ferretería Don Luis", date: "2025-12-15", due: "2025-12-30", total: 143500, status: "cobrada", lines: [{ productId: "p4", name: "Cable eléctrico 2.5mm rollo", qty: 7, unitPrice: 10800, subtotal: 75600 }, { productId: "p8", name: "Llave térmica 32A bipolar", qty: 12, unitPrice: 5100, subtotal: 61200 }] },
  { id: "FAC-0023", nroFactura: "0001-00001244", type: "factura", clientId: "c6", clientName: "Almacén El Trébol", date: "2025-12-20", due: "2026-01-04", total: 71500, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 2, unitPrice: 18500, subtotal: 37000 }, { productId: "p9", name: "Membrana líquida impermeab. 20kg", qty: 2, unitPrice: 12500, subtotal: 25000 }, { productId: "p5", name: "Tornillo autoperforante c/500", qty: 5, unitPrice: 1850, subtotal: 9250 }] },
  { id: "FAC-0024", nroFactura: "0001-00001245", type: "factura", clientId: "c5", clientName: "Distribuidora Central S.A.", date: "2025-12-27", due: "2026-01-11", total: 265600, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 10, unitPrice: 15800, subtotal: 158000 }, { productId: "p6", name: "Pintura exterior premium 10L", qty: 4, unitPrice: 22400, subtotal: 89600 }, { productId: "p7", name: "Adhesivo cerámico 30kg", qty: 6, unitPrice: 3000, subtotal: 18000 }] },

  // ── ENERO 2026 ──────────────────────────────────────────────────────────────
  { id: "FAC-0010", nroFactura: "0001-00001246", type: "factura", clientId: "c1", clientName: "Ferretería Don Luis", date: "2026-01-15", due: "2026-01-30", total: 74000, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 4, unitPrice: 18500, subtotal: 74000 }] },
  { id: "FAC-0011", nroFactura: "0001-00001247", type: "factura", clientId: "c3", clientName: "Depósito San Martín", date: "2026-01-22", due: "2026-02-06", total: 126000, status: "cobrada", lines: [{ productId: "p3", name: "Caño PVC 4\" x 3m", qty: 45, unitPrice: 2800, subtotal: 126000 }] },
  { id: "FAC-0006", nroFactura: "0001-00001248", type: "factura", clientId: "c2", clientName: "Constructora Vidal", date: "2026-01-10", due: "2026-01-25", total: 612000, status: "pendiente", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 36, unitPrice: 14200, subtotal: 511200 }, { productId: "p2", name: "Cemento Portland 50kg", qty: 30, unitPrice: 3600, subtotal: 108000 }] },
  { id: "FAC-0009", nroFactura: "0001-00001249", type: "factura", clientId: "c4", clientName: "TecnoHogar S.R.L.", date: "2026-01-20", due: "2026-02-04", total: 38700, status: "pendiente", lines: [{ productId: "p4", name: "Cable eléctrico 2.5mm rollo", qty: 2, unitPrice: 12600, subtotal: 25200 }, { productId: "p8", name: "Llave térmica 32A bipolar", qty: 3, unitPrice: 5100, subtotal: 15300 }] },
  { id: "FAC-0025", nroFactura: "0001-00001250", type: "factura", clientId: "c5", clientName: "Distribuidora Central S.A.", date: "2026-01-08", due: "2026-01-23", total: 271200, status: "cobrada", lines: [{ productId: "p6", name: "Pintura exterior premium 10L", qty: 8, unitPrice: 22400, subtotal: 179200 }, { productId: "p7", name: "Adhesivo cerámico 30kg", qty: 30, unitPrice: 3200, subtotal: 96000 }] },
  { id: "FAC-0026", nroFactura: "0001-00001251", type: "factura", clientId: "c6", clientName: "Almacén El Trébol", date: "2026-01-29", due: "2026-02-13", total: 54650, status: "cobrada", lines: [{ productId: "p5", name: "Tornillo autoperforante c/500", qty: 10, unitPrice: 1850, subtotal: 18500 }, { productId: "p3", name: "Caño PVC 4\" x 3m", qty: 13, unitPrice: 2800, subtotal: 36400 }] },

  // ── FEBRERO 2026 ────────────────────────────────────────────────────────────
  { id: "FAC-0003", nroFactura: "0001-00001252", type: "factura", clientId: "c3", clientName: "Depósito San Martín", date: "2026-02-20", due: "2026-03-07", total: 47500, status: "cobrada", lines: [{ productId: "p10", name: "Rejilla pluvial 30cm acero inox", qty: 20, unitPrice: 1200, subtotal: 24000 }, { productId: "p5", name: "Tornillo autoperforante c/500", qty: 12, unitPrice: 1550, subtotal: 18600 }] },
  { id: "FAC-0012", nroFactura: "0001-00001253", type: "factura", clientId: "c2", clientName: "Constructora Vidal", date: "2026-02-28", due: "2026-03-15", total: 284000, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 20, unitPrice: 14200, subtotal: 284000 }] },
  { id: "FAC-0004", nroFactura: "0001-00001254", type: "factura", clientId: "c1", clientName: "Ferretería Don Luis", date: "2026-02-01", due: "2026-02-16", total: 124300, status: "pendiente", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 6, unitPrice: 18500, subtotal: 111000 }, { productId: "p3", name: "Caño PVC 4\" x 3m", qty: 5, unitPrice: 2800, subtotal: 14000 }] },
  { id: "FAC-0005", nroFactura: "0001-00001255", type: "factura", clientId: "c1", clientName: "Ferretería Don Luis", date: "2026-02-15", due: "2026-03-02", total: 55800, status: "pendiente", lines: [{ productId: "p4", name: "Cable eléctrico 2.5mm rollo", qty: 3, unitPrice: 12600, subtotal: 37800 }, { productId: "p5", name: "Tornillo autoperforante c/500", qty: 9, unitPrice: 1850, subtotal: 16650 }] },
  { id: "FAC-0007", nroFactura: "0001-00001256", type: "factura", clientId: "c2", clientName: "Constructora Vidal", date: "2026-02-03", due: "2026-02-18", total: 189500, status: "pendiente", lines: [{ productId: "p3", name: "Caño PVC 4\" x 3m", qty: 40, unitPrice: 2400, subtotal: 96000 }, { productId: "p4", name: "Cable eléctrico 2.5mm rollo", qty: 10, unitPrice: 9900, subtotal: 99000 }] },
  { id: "FAC-0008", nroFactura: "0001-00001257", type: "factura", clientId: "c3", clientName: "Depósito San Martín", date: "2026-02-10", due: "2026-02-25", total: 93200, status: "pendiente", lines: [{ productId: "p2", name: "Cemento Portland 50kg", qty: 20, unitPrice: 3600, subtotal: 72000 }, { productId: "p1", name: "Pintura látex blanca 20L", qty: 5, unitPrice: 17020, subtotal: 85100 }] },
  { id: "FAC-0027", nroFactura: "0001-00001258", type: "factura", clientId: "c5", clientName: "Distribuidora Central S.A.", date: "2026-02-12", due: "2026-02-27", total: 312000, status: "cobrada", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 10, unitPrice: 15800, subtotal: 158000 }, { productId: "p6", name: "Pintura exterior premium 10L", qty: 7, unitPrice: 22400, subtotal: 156800 }] },
  { id: "FAC-0028", nroFactura: "0001-00001259", type: "factura", clientId: "c6", clientName: "Almacén El Trébol", date: "2026-02-25", due: "2026-03-12", total: 88400, status: "cobrada", lines: [{ productId: "p9", name: "Membrana líquida impermeab. 20kg", qty: 4, unitPrice: 12500, subtotal: 50000 }, { productId: "p7", name: "Adhesivo cerámico 30kg", qty: 12, unitPrice: 3200, subtotal: 38400 }] },

  // ── MARZO 2026 ──────────────────────────────────────────────────────────────
  { id: "FAC-0001", nroFactura: "0001-00001260", type: "factura", clientId: "c1", clientName: "Ferretería Don Luis", date: "2026-03-08", due: "2026-03-23", total: 85000, status: "pendiente", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 4, unitPrice: 18500, subtotal: 74000 }, { productId: "p5", name: "Tornillo autoperforante c/500", qty: 6, unitPrice: 1850, subtotal: 11100 }] },
  { id: "FAC-0002", nroFactura: "0001-00001261", type: "factura", clientId: "c2", clientName: "Constructora Vidal", date: "2026-03-05", due: "2026-03-20", total: 340000, status: "pendiente", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 24, unitPrice: 14200, subtotal: 340800 }] },
  { id: "FAC-0029", nroFactura: "0001-00001262", type: "factura", clientId: "c5", clientName: "Distribuidora Central S.A.", date: "2026-03-10", due: "2026-03-25", total: 196200, status: "pendiente", lines: [{ productId: "p6", name: "Pintura exterior premium 10L", qty: 5, unitPrice: 22400, subtotal: 112000 }, { productId: "p7", name: "Adhesivo cerámico 30kg", qty: 27, unitPrice: 3200, subtotal: 86400 }] },
  { id: "FAC-0030", nroFactura: "0001-00001263", type: "factura", clientId: "c6", clientName: "Almacén El Trébol", date: "2026-03-01", due: "2026-03-16", total: 67150, status: "pendiente", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 2, unitPrice: 18500, subtotal: 37000 }, { productId: "p3", name: "Caño PVC 4\" x 3m", qty: 10, unitPrice: 2800, subtotal: 28000 }, { productId: "p5", name: "Tornillo autoperforante c/500", qty: 1, unitPrice: 1850, subtotal: 1850 }] },
  { id: "FAC-0031", nroFactura: "0001-00001264", type: "factura", clientId: "c1", clientName: "Ferretería Don Luis", date: "2026-03-17", due: "2026-04-01", total: 88200, status: "cobrada", lines: [{ productId: "p8", name: "Llave térmica 32A bipolar", qty: 10, unitPrice: 5100, subtotal: 51000 }, { productId: "p4", name: "Cable eléctrico 2.5mm rollo", qty: 3, unitPrice: 10800, subtotal: 32400 }, { productId: "p10", name: "Rejilla pluvial 30cm acero inox", qty: 3, unitPrice: 1380, subtotal: 4140 }] },
  { id: "FAC-0032", nroFactura: "0001-00001265", type: "factura", clientId: "c3", clientName: "Depósito San Martín", date: "2026-03-12", due: "2026-03-27", total: 156000, status: "cobrada", lines: [{ productId: "p2", name: "Cemento Portland 50kg", qty: 25, unitPrice: 3600, subtotal: 90000 }, { productId: "p7", name: "Adhesivo cerámico 30kg", qty: 22, unitPrice: 3000, subtotal: 66000 }] },

  // ── Remitos ──────────────────────────────────────────────────────────────────
  { id: "REM-0001", type: "remito", clientId: "c1", clientName: "Ferretería Don Luis", date: "2026-03-10", due: "2026-03-10", total: 37000, status: "emitido", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 2, unitPrice: 18500, subtotal: 37000 }] },
  { id: "REM-0002", type: "remito", clientId: "c5", clientName: "Distribuidora Central S.A.", date: "2026-03-14", due: "2026-03-14", total: 44800, status: "emitido", lines: [{ productId: "p6", name: "Pintura exterior premium 10L", qty: 2, unitPrice: 22400, subtotal: 44800 }] },
  { id: "REM-0003", type: "remito", clientId: "c3", clientName: "Depósito San Martín", date: "2026-03-18", due: "2026-03-18", total: 25200, status: "emitido", lines: [{ productId: "p4", name: "Cable eléctrico 2.5mm rollo", qty: 2, unitPrice: 12600, subtotal: 25200 }] },

  // ── Presupuestos ─────────────────────────────────────────────────────────────
  { id: "PRE-0001", type: "presupuesto", clientId: "c4", clientName: "TecnoHogar S.R.L.", date: "2026-03-10", due: "2026-03-24", total: 63000, status: "pendiente", lines: [{ productId: "p8", name: "Llave térmica 32A bipolar", qty: 8, unitPrice: 5800, subtotal: 46400 }, { productId: "p4", name: "Cable eléctrico 2.5mm rollo", qty: 1, unitPrice: 12600, subtotal: 12600 }] },
  { id: "PRE-0002", type: "presupuesto", clientId: "c2", clientName: "Constructora Vidal", date: "2026-03-15", due: "2026-03-30", total: 520000, status: "pendiente", lines: [{ productId: "p1", name: "Pintura látex blanca 20L", qty: 36, unitPrice: 14200, subtotal: 511200 }] },
  { id: "PRE-0003", type: "presupuesto", clientId: "c6", clientName: "Almacén El Trébol", date: "2026-03-17", due: "2026-04-01", total: 84000, status: "pendiente", lines: [{ productId: "p9", name: "Membrana líquida impermeab. 20kg", qty: 4, unitPrice: 12500, subtotal: 50000 }, { productId: "p7", name: "Adhesivo cerámico 30kg", qty: 10, unitPrice: 3900, subtotal: 39000 }] },
];

const initPurchaseInvoices = [
  { id: "OC-0001", nroFactura: "F-2025-4521", supplierId: "s1", supplierName: "Pinturas del Sur S.A.", date: "2025-10-10", dueDate: "2025-11-09", total: 172800, status: "pagada", lines: [{ productId: "p1", supplierCode: "PDS-LAT20B", name: "Pintura látex blanca 20L", qty: 12, unitPrice: 12800 }, { productId: "p6", supplierCode: "PDS-EXT10L", name: "Pintura exterior premium 10L", qty: 2, unitPrice: 18500 }] },
  { id: "OC-0002", nroFactura: "REM-2025-8801", supplierId: "s2", supplierName: "Materiales Norte S.R.L.", date: "2025-11-03", dueDate: "2025-11-18", total: 95200, status: "pagada", lines: [{ productId: "p2", supplierCode: "MN-CEM50", name: "Cemento Portland 50kg", qty: 20, unitPrice: 3400 }, { productId: "p3", supplierCode: "MN-PVC4X3", name: "Caño PVC 4\" x 3m", qty: 12, unitPrice: 2100 }] },
  { id: "OC-0003", nroFactura: "A-0003-00087652", supplierId: "s3", supplierName: "ElectroDistribuidora S.R.L.", date: "2025-12-05", dueDate: "2025-12-05", total: 88400, status: "pagada", lines: [{ productId: "p4", supplierCode: "ED-CAB25R", name: "Cable eléctrico 2.5mm rollo", qty: 8, unitPrice: 9200 }, { productId: "p8", supplierCode: "ED-LT32A", name: "Llave térmica 32A bipolar", qty: 4, unitPrice: 4200 }] },
  { id: "OC-0004", nroFactura: "F-2026-0112", supplierId: "s1", supplierName: "Pinturas del Sur S.A.", date: "2026-01-14", dueDate: "2026-02-13", total: 256000, status: "pagada", lines: [{ productId: "p1", supplierCode: "PDS-LAT20B", name: "Pintura látex blanca 20L", qty: 14, unitPrice: 12800 }, { productId: "p6", supplierCode: "PDS-EXT10L", name: "Pintura exterior premium 10L", qty: 6, unitPrice: 18500 }] },
  { id: "OC-0005", nroFactura: "REM-2026-0055", supplierId: "s2", supplierName: "Materiales Norte S.R.L.", date: "2026-02-03", dueDate: "2026-02-18", total: 122500, status: "pagada", lines: [{ productId: "p2", supplierCode: "MN-CEM50", name: "Cemento Portland 50kg", qty: 25, unitPrice: 3400 }, { productId: "p7", supplierCode: "MN-ADH30K", name: "Adhesivo cerámico 30kg", qty: 15, unitPrice: 2800 }] },
  { id: "OC-0006", nroFactura: "IP-2026-0381", supplierId: "s4", supplierName: "Impermeabilizantes del Plata S.R.L.", date: "2026-02-20", dueDate: "2026-03-13", total: 71200, status: "pagada", lines: [{ productId: "p9", supplierCode: "IP-MEM20K", name: "Membrana líquida 20kg", qty: 6, unitPrice: 8900 }, { productId: "p10", supplierCode: "IP-REJ30AI", name: "Rejilla pluvial 30cm", qty: 40, unitPrice: 950 }] },
  { id: "OC-0007", nroFactura: "F-2026-0443", supplierId: "s1", supplierName: "Pinturas del Sur S.A.", date: "2026-03-05", dueDate: "2026-04-04", total: 192000, status: "pendiente", lines: [{ productId: "p1", supplierCode: "PDS-LAT20B", name: "Pintura látex blanca 20L", qty: 15, unitPrice: 12800 }] },
  { id: "OC-0008", nroFactura: "REM-2026-0311", supplierId: "s2", supplierName: "Materiales Norte S.R.L.", date: "2026-03-01", dueDate: "2026-03-16", total: 63000, status: "pendiente", lines: [{ productId: "p2", supplierCode: "MN-CEM50", name: "Cemento Portland 50kg", qty: 18, unitPrice: 3500 }] },
  { id: "OC-0009", nroFactura: "A-0003-00099103", supplierId: "s3", supplierName: "ElectroDistribuidora S.R.L.", date: "2026-03-12", dueDate: "2026-03-12", total: 54600, status: "pendiente", lines: [{ productId: "p4", supplierCode: "ED-CAB25R", name: "Cable eléctrico 2.5mm rollo", qty: 4, unitPrice: 9200 }, { productId: "p8", supplierCode: "ED-LT32A", name: "Llave térmica 32A bipolar", qty: 4, unitPrice: 4200 }] },
];

const initVendedores = [];

// ─── DB MAPPERS (DB → App) ─────────────────────────────────────────────────
const mapProduct = r => ({
  id: r.id, name: r.name, sku: r.sku, stock: r.stock ?? 0,
  minStock: r.min_stock ?? 0, unit: r.unit || '', category: r.category || '',
  cost: r.cost ?? 0, iva: r.iva ?? 21, tracksStock: r.tracks_stock !== false,
  prices: r.prices || {}, pricesUsd: r.prices_usd || {}, clientOverrides: r.client_overrides || [],
  esCompuesto: r.es_compuesto || false, componentes: r.componentes || [],
});
const mapClient = r => ({
  id: r.id, codigo: r.codigo || '', name: r.name, cuit: r.cuit || '',
  direccion: r.direccion || '', email: r.email || '', phone: r.phone || '',
  priceList: r.price_list || 'lista_a', lastPurchase: r.last_purchase || '—',
  status: r.status || 'activo', nextFollowUp: r.next_follow_up || '—',
});
const mapSupplier = r => ({
  id: r.id, name: r.name, cuit: r.cuit || '', contact: r.contact || '',
  email: r.email || '', phone: r.phone || '', paymentDays: r.payment_days ?? 30,
  cbu: r.cbu || '', bank: r.bank || '', productCodes: r.product_codes || [],
});
const mapSaleInvoice = r => ({
  id: r.id, ref: r.ref, nroFactura: r.nro_factura, type: r.type,
  clientId: r.client_id, clientName: r.client_name, date: r.date,
  due: r.due, total: r.total ?? 0, totalNeto: r.total_neto,
  totalIva: r.total_iva, status: r.status, lines: typeof r.lines === 'string' ? JSON.parse(r.lines) : (r.lines || []),
  originPresupuestoId: r.origin_presupuesto_id, originRemitoIds: r.origin_remito_ids,
  modificaStock: r.modifica_stock, observaciones: r.observaciones,
  moneda: r.moneda || 'ARS', vendedor: r.vendedor || '', metodoPago: r.metodo_pago || '',
  tipoComprobante: r.tipo_comprobante || 'B',
  clientCuit: r.client_cuit || '',
  cae: r.cae || '', caeVto: r.cae_vto || '', arcaNumero: r.arca_numero || null,
  retenciones: r.retenciones || null,
});
const mapPurchaseInvoice = r => ({
  id: r.id, ref: r.ref, nroFactura: r.nro_factura, supplierId: r.supplier_id,
  supplierName: r.supplier_name, date: r.date, dueDate: r.due_date,
  total: r.total ?? 0, totalNeto: r.total_neto, totalIva: r.total_iva,
  status: r.status, lines: typeof r.lines === 'string' ? JSON.parse(r.lines) : (r.lines || []),
  metodoPago: r.metodo_pago || '',
  percepciones: r.percepciones || null,
});
const mapEmployee = r => ({
  id: r.id, legajo: r.legajo || '', nombre: r.nombre, apellido: r.apellido,
  cuil: r.cuil || '', puesto: r.puesto || '', sector: r.sector || '',
  fechaIngreso: r.fecha_ingreso || '', sueldoBasico: r.sueldo_basico ?? 0,
  cbu: r.cbu || '', banco: r.banco || '', obraSocial: r.obra_social || '',
  email: r.email || '', estado: r.estado || 'activo',
});
const mapPriceList = r => ({ id: r.id, label: r.label });
const mapCaja = r => ({ id: r.id, date: String(r.date || '').slice(0, 10), turno: r.turno || null, montoInicial: r.monto_inicial ?? 0, estado: r.estado || 'abierta' });
const mapCajaMovimiento = r => ({ id: r.id, cajaId: r.caja_id, tipo: r.tipo, monto: r.monto ?? 0, fecha: r.fecha, hora: r.hora || '—', motivo: r.motivo || '', empleadoId: r.empleado_id || null, observaciones: r.observaciones || '', origen: r.origen || 'manual', origenId: r.origen_id || null });

// ─── DB WRITERS (App → DB) ─────────────────────────────────────────────────
const productToDb = (p, cid) => ({
  id: p.id, company_id: cid, name: p.name, sku: p.sku, stock: p.stock,
  min_stock: p.minStock, unit: p.unit, category: p.category, cost: p.cost,
  iva: p.iva, tracks_stock: p.tracksStock !== false,
  prices: p.prices, prices_usd: p.pricesUsd || {}, client_overrides: p.clientOverrides,
  es_compuesto: p.esCompuesto || false, componentes: p.componentes || [],
});
const clientToDb = (c, cid) => ({
  id: c.id, company_id: cid, codigo: c.codigo, name: c.name, cuit: c.cuit,
  direccion: c.direccion, email: c.email, phone: c.phone, price_list: c.priceList,
  last_purchase: c.lastPurchase, status: c.status, next_follow_up: c.nextFollowUp,
});
const supplierToDb = (s, cid) => ({
  id: s.id, company_id: cid, name: s.name, cuit: s.cuit, contact: s.contact,
  email: s.email, phone: s.phone, payment_days: s.paymentDays, cbu: s.cbu,
  bank: s.bank, product_codes: s.productCodes,
});
const saleInvoiceToDb = (i, cid) => ({
  id: i.id, company_id: cid, ref: i.ref || null, nro_factura: i.nroFactura, type: i.type,
  client_id: i.clientId, client_name: i.clientName, date: i.date, due: i.due,
  total: i.total, total_neto: i.totalNeto, total_iva: i.totalIva, status: i.status,
  lines: i.lines, origin_presupuesto_id: i.originPresupuestoId || null,
  origin_remito_ids: i.originRemitoIds || null, modifica_stock: i.modificaStock,
  observaciones: i.observaciones, moneda: i.moneda, vendedor: i.vendedor,
  metodo_pago: i.metodoPago || null,
  retenciones: i.retenciones || null,
});
const purchaseInvoiceToDb = (i, cid) => ({
  id: i.id, company_id: cid, ref: i.ref || null, nro_factura: i.nroFactura,
  supplier_id: i.supplierId, supplier_name: i.supplierName, date: i.date,
  due_date: i.dueDate, total: i.total, total_neto: i.totalNeto, total_iva: i.totalIva,
  status: i.status, lines: i.lines,
  percepciones: i.percepciones || null,
});
const employeeToDb = (e, cid) => ({
  id: e.id, company_id: cid, legajo: e.legajo, nombre: e.nombre,
  apellido: e.apellido, cuil: e.cuil, puesto: e.puesto, sector: e.sector,
  fecha_ingreso: e.fechaIngreso, sueldo_basico: e.sueldoBasico, cbu: e.cbu,
  banco: e.banco, obra_social: e.obraSocial, email: e.email, estado: e.estado,
});
const priceListToDb = (l, cid) => ({ id: l.id, company_id: cid, label: l.label });
const cajaToDb = (c, cid) => ({ id: c.id, company_id: cid, date: c.date, turno: c.turno || null, monto_inicial: c.montoInicial, estado: c.estado });
const cajaMovimientoToDb = (m, cid) => ({ id: m.id, company_id: cid, caja_id: m.cajaId, tipo: m.tipo, monto: m.monto, fecha: m.fecha, hora: m.hora, motivo: m.motivo, empleado_id: m.empleadoId || null, observaciones: m.observaciones || null, origen: m.origen, origen_id: m.origenId || null });
const mapCheque = r => ({ id: r.id, tipo: r.tipo, numero: r.numero || '', fechaPago: r.fecha_pago, fechaVencimiento: r.fecha_vencimiento, monto: r.monto ?? 0, emisor: r.emisor || '', estado: r.estado || 'pendiente' });
const chequeToDb = (c, cid) => ({ id: c.id, company_id: cid, tipo: c.tipo, numero: c.numero, fecha_pago: c.fechaPago, fecha_vencimiento: c.fechaVencimiento, monto: c.monto, emisor: c.emisor, estado: c.estado });
const mapOrdenCompra = r => ({ id: r.id, ref: r.ref || '', supplierId: r.supplier_id, supplierName: r.supplier_name || '', date: r.date, observaciones: r.observaciones || '', total: r.total ?? 0, lines: r.lines || [] });
const ordenCompraToDb = (o, cid) => ({ id: o.id, company_id: cid, ref: o.ref, supplier_id: o.supplierId, supplier_name: o.supplierName, date: o.date, observaciones: o.observaciones, total: o.total, lines: o.lines });

// Helper: human-readable display ref for sale/purchase invoices
const docRef = inv => inv?.ref || inv?.id || '';

const initEmpleados = [
  { id: "emp1", legajo: "0001", nombre: "Juan", apellido: "García", cuil: "20-25678901-3", puesto: "Vendedor", sector: "Ventas", fechaIngreso: "2020-03-01", sueldoBasico: 350000, cbu: "0720123400000012345678", banco: "Santander", obraSocial: "OSDE", email: "juan@empresa.com", estado: "activo" },
  { id: "emp2", legajo: "0002", nombre: "María", apellido: "López", cuil: "27-28901234-5", puesto: "Administrativa", sector: "Administración", fechaIngreso: "2018-06-15", sueldoBasico: 420000, cbu: "0140234500000098765432", banco: "Nación", obraSocial: "Swiss Medical", email: "maria@empresa.com", estado: "activo" },
  { id: "emp3", legajo: "0003", nombre: "Carlos", apellido: "Rodríguez", cuil: "20-30234567-8", puesto: "Depósito", sector: "Logística", fechaIngreso: "2022-09-01", sueldoBasico: 290000, cbu: "0170345600000011223344", banco: "BBVA", obraSocial: "OSECAC", email: "carlos@empresa.com", estado: "activo" },
];

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) => `$${Number(n).toLocaleString("es-AR")}`;
const today = new Date().toISOString().slice(0, 10);

function getClientPrice(product, clientId, clients) {
  const client = clients.find(c => c.id === clientId);
  const ov = product.clientOverrides.find(o => o.clientId === clientId);
  let base = product.prices[client?.priceList || "lista_a"];
  if (ov?.price != null) return { price: ov.price, source: "Precio fijo", code: ov.customCode || product.sku };
  if (ov?.discount != null) return { price: Math.round(base * (1 - ov.discount / 100)), source: `Desc. ${ov.discount}%`, code: ov.customCode || product.sku };
  return { price: base, source: initPriceLists.find(l => l.id === client?.priceList)?.label || "Lista A", code: product.sku };
}

function getClientCode(product, clientId) {
  const ov = product.clientOverrides.find(o => o.clientId === clientId);
  return ov?.customCode || product.sku;
}

// ─── UI ATOMS ─────────────────────────────────────────────────────────────────
const Badge = ({ status }) => {
  const m = {
    activo: [T.accent, T.accentLight], cobrada: [T.accent, T.accentLight], pagada: [T.accent, T.accentLight], convertido: [T.accent, T.accentLight],
    "en riesgo": [T.yellow, T.yellowLight], pendiente: [T.yellow, T.yellowLight],
    inactivo: [T.red, T.redLight], vencida: [T.red, T.redLight],
    presupuesto: [T.blue, T.blueLight], factura: [T.purple, T.purpleLight], remito: [T.orange, T.orangeLight],
  };
  const [color, bg] = m[status] || [T.muted, T.surface];
  return <span style={{ background: bg, color, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
};

const ReadOnlyCtx = createContext(false);

const Btn = ({ children, onClick, v = "primary", sm, disabled, full }) => {
  const s = {
    primary: { bg: T.accent, color: "#fff", border: `1px solid ${T.accent}` },
    ghost: { bg: "transparent", color: T.ink, border: `1px solid ${T.border}` },
    blue: { bg: T.blueLight, color: T.blue, border: `1px solid #1a3a6a` },
    orange: { bg: T.orangeLight, color: T.orange, border: `1px solid #5a2e0e` },
    danger: { bg: T.redLight, color: T.red, border: `1px solid #5a1a1a` },
  }[v];
  return <button onClick={onClick} disabled={disabled} style={{ background: s.bg, color: s.color, border: s.border, borderRadius: 8, padding: sm ? "5px 12px" : "9px 18px", fontWeight: 700, fontSize: sm ? 11 : 13, cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.4 : 1, fontFamily: "inherit", width: full ? "100%" : "auto" }}>{children}</button>;
};

function Input({ label, value, onChange, placeholder, mono, type = "text", small, step, min }) {
  return (
    <div>
      {label && <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>{label}</label>}
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        step={step} min={min}
        style={{ width: "100%", padding: small ? "7px 10px" : "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: small ? 12 : 13, fontFamily: mono ? "monospace" : "inherit", outline: "none" }} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div>
      {label && <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Modal({ title, onClose, children, wide, xl }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "#00000080", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 16, width: xl ? 960 : wide ? 760 : 540, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 32px 80px #000000a0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 26px", borderBottom: `1px solid ${T.border}`, position: "sticky", top: 0, background: T.paper, zIndex: 1 }}>
          <span style={{ fontWeight: 800, fontSize: 16, color: T.ink }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.muted }}>×</button>
        </div>
        <div style={{ padding: 26 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── DOCUMENT BUILDER (Factura / Presupuesto / Remito) ────────────────────────
function DocBuilder({ type, clients, products, saleInvoices, tipoCambio, preload, onSave, onClose, priceLists, vendedores }) {
  const isPresupuesto = type === "presupuesto";
  const [origin, setOrigin] = useState(preload ? "scratch" : (isPresupuesto ? "scratch" : null));
  const [selectedPresupuestoId, setSelectedPresupuestoId] = useState("");
  const [selectedRemitoIds, setSelectedRemitoIds] = useState([]);
  const [remitoClientFilter, setRemitoClientFilter] = useState("");

  // Step 2: doc data
  const [clientId, setClientId] = useState(preload?.clientId || "");
  const [docType] = useState(type || "factura");
  const [lines, setLines] = useState(preload?.lines || []);
  const [codeInput, setCodeInput] = useState("");
  const [qtyInput, setQtyInput] = useState(1);
  const [priceInput, setPriceInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [done, setDone] = useState(false);
  const [moneda, setMoneda] = useState(preload?.moneda || "ARS");
  const [selectedPriceList, setSelectedPriceList] = useState("");

  const client = clients.find(c => c.id === clientId);
  const presupuestos = saleInvoices.filter(i => i.type === "presupuesto" && i.status === "pendiente" && i.lines?.length > 0);
  const remitos = saleInvoices.filter(i => i.type === "remito" && i.status !== "facturado" && i.lines?.length > 0);

  const loadPresupuesto = (id) => {
    const pre = saleInvoices.find(i => i.id === id);
    if (!pre) return;
    setSelectedPresupuestoId(id);
    setClientId(pre.clientId);
    setLines(pre.lines.map(l => ({ ...l })));
    setPriceInput("");
  };

  const toggleRemito = (id) => {
    const rem = saleInvoices.find(i => i.id === id);
    if (!rem) return;
    setSelectedRemitoIds(prev => {
      if (prev.includes(id)) return prev.filter(r => r !== id);
      // Cuando es el primero, fija el cliente
      if (prev.length === 0) setRemitoClientFilter(rem.clientId);
      return [...prev, id];
    });
  };

  const loadRemitos = () => {
    const selected = saleInvoices.filter(i => selectedRemitoIds.includes(i.id));
    if (selected.length === 0) return;
    const firstClientId = selected[0].clientId;
    setClientId(firstClientId);
    // Combinar líneas de todos los remitos, agrupando por productId
    const combined = [];
    selected.forEach(rem => {
      (rem.lines || []).forEach(l => {
        const existing = combined.findIndex(x => x.productId === l.productId && x.unitPrice === l.unitPrice);
        if (existing >= 0) {
          const e = combined[existing];
          const qty = e.qty + l.qty;
          const neto = qty * e.unitPrice;
          const ivaImporte = Math.round(neto * e.iva) / 100;
          combined[existing] = { ...e, qty, neto, ivaImporte, subtotal: neto + ivaImporte };
        } else {
          combined.push({ ...l, isManualPrice: false });
        }
      });
    });
    setLines(combined);
    // Guardar los ids de remitos origen para marcarlos como facturados al guardar
    setSelectedPresupuestoId(""); // no viene de presupuesto
    setPriceInput("");
    setOrigin("remito_loaded");
  };

  const findProduct = (code) => {
    const n = code.trim().toUpperCase();
    for (const p of products) {
      if (p.sku.toUpperCase() === n) return p;
      const ov = p.clientOverrides.find(o => o.clientId === clientId && o.customCode?.toUpperCase() === n);
      if (ov) return p;
    }
    return null;
  };

  // Resuelve precio según lista, moneda y tipo de cambio
  // Acepta moneda como parámetro para poder usarla antes de que se actualice el estado
  const getPriceForLine = (prod, overrideMoneda) => {
    if (!prod) return { price: 0, source: "", code: "" };
    const m = overrideMoneda !== undefined ? overrideMoneda : moneda;
    const ov = prod.clientOverrides?.find(o => o.clientId === clientId);
    if (ov?.price != null) return { price: ov.price, source: "Precio fijo cliente", code: ov.customCode || prod.sku };
    const listId = selectedPriceList || client?.priceList || "lista_a";
    const listLabel = (priceLists || initPriceLists).find(l => l.id === listId)?.label || listId;
    const code = ov?.customCode || prod.sku;
    if (ov?.discount != null) {
      const base = prod.prices[listId] || 0;
      const discounted = Math.round(base * (1 - ov.discount / 100));
      if (m === "USD") {
        const usdBase = prod.pricesUsd?.[listId];
        const usdPrice = usdBase > 0 ? Math.round(usdBase * (1 - ov.discount / 100) * 100) / 100 : Math.round(discounted / tipoCambio * 100) / 100;
        return { price: usdPrice, source: "Desc. " + ov.discount + "% · USD", code };
      }
      return { price: discounted, source: "Desc. " + ov.discount + "%", code };
    }
    if (m === "USD") {
      const usdPrice = prod.pricesUsd?.[listId];
      if (usdPrice > 0) return { price: usdPrice, source: listLabel + " · USD", code };
      const arsPrice = prod.prices[listId] || 0;
      const converted = Math.round(arsPrice / tipoCambio * 100) / 100;
      return { price: converted, source: listLabel + " · conv. TC " + fmt(tipoCambio), code };
    }
    return { price: prod.prices[listId] || 0, source: listLabel, code };
  };

  // When code changes, auto-fill price input with list price
  const handleCodeChange = (v) => {
    setCodeInput(v);
    setCodeError("");
    const prod = findProduct(v);
    if (prod && clientId) {
      const { price } = getPriceForLine(prod);
      setPriceInput(String(price));
    } else {
      setPriceInput("");
    }
  };

  const addLine = () => {
    if (!clientId) { setCodeError("Seleccioná un cliente primero."); return; }
    const prod = findProduct(codeInput);
    if (!prod) { setCodeError(`Código "${codeInput}" no encontrado.`); return; }
    if (docType === "factura" && prod.stock < qtyInput + (lines.find(l => l.productId === prod.id)?.qty || 0)) {
      setCodeError(`Stock insuficiente (${prod.stock} disponibles).`); return;
    }
    setCodeError("");
    const { price: listPrice, source, code } = getPriceForLine(prod);
    const unitPrice = parseFloat(priceInput) || listPrice;
    const isManualPrice = !!(priceInput && parseFloat(priceInput) !== listPrice);
    const iva = prod.iva ?? 21;
    const existing = lines.findIndex(l => l.productId === prod.id);
    if (existing >= 0) {
      setLines(lines.map((l, i) => i === existing ? { ...l, qty: l.qty + qtyInput, neto: (l.qty + qtyInput) * l.unitPrice, ivaImporte: Math.round((l.qty + qtyInput) * l.unitPrice * iva) / 100, subtotal: Math.round((l.qty + qtyInput) * l.unitPrice * (1 + iva / 100)) } : l));
    } else {
      const neto = qtyInput * unitPrice;
      const ivaImporte = Math.round(neto * iva) / 100;
      setLines([...lines, { productId: prod.id, clientCode: code, name: prod.name, sku: prod.sku, qty: qtyInput, unitPrice, listPrice, isManualPrice, source, unit: prod.unit, iva, neto, ivaImporte, subtotal: neto + ivaImporte }]);
    }
    setCodeInput(""); setQtyInput(1); setPriceInput("");
  };

  const updateLineQty = (i, qty) => {
    setLines(lines.map((l, j) => {
      if (j !== i) return l;
      const neto = qty * l.unitPrice;
      const ivaImporte = Math.round(neto * l.iva) / 100;
      return { ...l, qty, neto, ivaImporte, subtotal: neto + ivaImporte };
    }));
  };

  const updateLinePrice = (i, newPrice) => {
    setLines(lines.map((l, j) => {
      if (j !== i) return l;
      const unitPrice = parseFloat(newPrice) || l.unitPrice;
      const isManualPrice = unitPrice !== l.listPrice;
      const neto = l.qty * unitPrice;
      const ivaImporte = Math.round(neto * l.iva) / 100;
      return { ...l, unitPrice, isManualPrice, neto, ivaImporte, subtotal: neto + ivaImporte };
    }));
  };

  const [modificaStock, setModificaStock] = useState(preload?.modificaStock || false);
  const [imprimirPDF, setImprimirPDF] = useState(true);
  const [observaciones, setObservaciones] = useState(preload?.observaciones || "");
  const [vendedor, setVendedor] = useState(preload?.vendedor || "");
  const [metodoPago, setMetodoPago] = useState(preload?.metodoPago || "");
  const [retenciones, setRetenciones] = useState(preload?.retenciones || { iibbCaba: "", iibbBsAs: "", ganancias: "", ivaRet: "", suss: "" });
  const [stockAlert, setStockAlert] = useState(null);

  const currSymbol = moneda === "USD" ? "US$" : "$";
  const fmtM = (v) => `${currSymbol} ${Number(v || 0).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const handleMonedaChange = (m) => {
    setMoneda(m);
    setPriceInput("");
    if (lines.length > 0) {
      setLines(prev => prev.map(l => {
        const iva = l.iva ?? 21;
        if (l.isManualPrice) {
          // Precio manual: mantener el monto, solo recalcular neto/IVA/subtotal
          const neto = l.qty * l.unitPrice;
          const ivaImporte = Math.round(neto * iva) / 100;
          return { ...l, neto, ivaImporte, subtotal: neto + ivaImporte };
        }
        // Precio de lista: recalcular con la nueva moneda
        const prod = products.find(p => p.id === l.productId);
        if (!prod) return l;
        const { price: newPrice, source } = getPriceForLine(prod, m);
        const neto = l.qty * newPrice;
        const ivaImporte = Math.round(neto * iva) / 100;
        return { ...l, unitPrice: newPrice, listPrice: newPrice, source, neto, ivaImporte, subtotal: neto + ivaImporte };
      }));
    }
    if (codeInput) {
      const prod = findProduct(codeInput);
      if (prod && clientId) {
        const { price } = getPriceForLine(prod, m);
        setPriceInput(String(price));
      }
    }
    if (m === "USD") {
      setObservaciones(prev => {
        const leyenda = "Moneda cotizada: Dólar estadounidense.";
        if (prev.includes(leyenda)) return prev;
        return prev ? prev + "\n" + leyenda : leyenda;
      });
    } else {
      setObservaciones(prev => prev.replace(/\n?Moneda cotizada: Dólar estadounidense\.?/g, "").trim());
    }
  };

  const totalNeto = lines.reduce((s, l) => s + l.neto, 0);
  const totalIva = lines.reduce((s, l) => s + l.ivaImporte, 0);
  const total = totalNeto + totalIva;

  const generarPDF = (docId) => {
    const win = window.open("", "_blank");
    const cli = clients.find(c => c.id === clientId);
    const docLabel2 = { factura: "FACTURA", presupuesto: "PRESUPUESTO", remito: "REMITO" }[docType];
    win.document.write(`
      <html><head><title>${docLabel2} ${docId}</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; color: #1a1a2e; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { font-size: 28px; font-weight: 900; margin: 0; color: #2ea043; }
        .sub { color: #888; font-size: 13px; margin-bottom: 24px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 32px; }
        .block { font-size: 13px; line-height: 1.8; }
        .block strong { display: block; font-size: 11px; color: #888; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { background: #f0f4f8; padding: 10px 12px; text-align: left; font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.8px; }
        td { padding: 11px 12px; border-bottom: 1px solid #e8ecf0; font-size: 13px; }
        .total-box { float: right; width: 260px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px; }
        .total-row { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 6px; color: #555; }
        .total-final { display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; border-top: 2px solid #2ea043; padding-top: 10px; margin-top: 8px; color: #2ea043; }
        .footer { clear: both; margin-top: 60px; font-size: 11px; color: #aaa; text-align: center; border-top: 1px solid #eee; padding-top: 16px; }
      </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px">
        <div><h1>NexoPyME</h1><div class="sub">${docLabel2} N° ${docId}</div></div>
        <div style="text-align:right;font-size:13px;color:#555">
          <div><strong>Fecha:</strong> ${today}</div>
          ${moneda === "USD" ? `<div style="margin-top:6px;display:inline-block;background:#1a3a5c;color:#60a5fa;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:0.5px">🇺🇸 USD</div>` : ""}
        </div>
      </div>
      <div class="row">
        <div class="block"><strong>Cliente</strong>${cli?.name || clientId}${cli?.cuit ? `<br>CUIT: ${cli.cuit}` : ""}${cli?.direccion ? `<br>${cli.direccion}` : ""}${cli?.email ? `<br>${cli.email}` : ""}</div>
        <div class="block" style="text-align:right"><strong>Código cliente</strong>${cli?.codigo || "—"}${vendedor ? `<br><strong>Vendedor:</strong> ${(() => { const vend = (vendedores||[]).find(v=>v.id===vendedor); return vend ? vend.codigo+" · "+vend.nombre : vendedor; })()}` : ""}</div>
      </div>
      <table>
        <thead><tr><th>Código</th><th>Producto</th><th>Cant.</th><th>P. Unit. s/IVA</th><th>IVA</th><th>Subtotal</th></tr></thead>
        <tbody>${lines.map(l => `<tr><td style="font-family:monospace;font-weight:700">${l.clientCode}</td><td>${l.name}</td><td>${l.qty} ${l.unit}</td><td>${currSymbol} ${Number(l.unitPrice).toLocaleString("es-AR")}</td><td style="color:#888">IVA ${l.iva}% · ${currSymbol} ${Number(l.ivaImporte).toLocaleString("es-AR")}</td><td style="font-weight:700">${currSymbol} ${Number(l.subtotal).toLocaleString("es-AR")}</td></tr>`).join("")}</tbody>
      </table>
      <div class="total-box">
        <div class="total-row"><span>Subtotal s/IVA</span><span>${currSymbol} ${Number(totalNeto).toLocaleString("es-AR")}</span></div>
        ${Object.entries(lines.reduce((acc, l) => { const k = l.iva; acc[k] = (acc[k] || 0) + l.ivaImporte; return acc; }, {})).map(([r, v]) => `<div class="total-row"><span>IVA ${r}%</span><span>${currSymbol} ${Number(v).toLocaleString("es-AR")}</span></div>`).join("")}
        <div class="total-final"><span>TOTAL</span><span>${currSymbol} ${Number(total).toLocaleString("es-AR")}</span></div>
      </div>
      ${observaciones ? `<div style="clear:both;margin-top:32px;border:1px solid #e0e0e0;border-radius:8px;padding:16px"><div style="font-size:11px;color:#888;font-weight:700;letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Observaciones</div><div style="font-size:13px;color:#333;line-height:1.7;white-space:pre-wrap">${observaciones}</div></div>` : ""}
      <div class="footer">Documento generado por NexoPyME · ${today}</div>
      <script>window.onload = () => { window.print(); }<\/script>
      </body></html>
    `);
    win.document.close();
  };

  const doSave = () => {
    const retObj = docType === "factura" ? Object.fromEntries(Object.entries(retenciones).map(([k, v]) => [k, parseFloat(v) || 0])) : null;
    onSave({ lines, total, totalNeto, totalIva, clientId, clientName: client.name, docType, originPresupuestoId: selectedPresupuestoId || null, originRemitoIds: selectedRemitoIds.length > 0 ? selectedRemitoIds : null, modificaStock: docType === "factura" ? true : modificaStock, imprimirPDF, generarPDF, observaciones, moneda, vendedor, metodoPago, retenciones: retObj, editingId: preload?.editingId || null, oldLines: preload?.lines || null, posTicketIds: preload?.posTicketIds || null });
    setDone(true);
  };

  const confirm = () => {
    // Check for items that would go negative (only when stock is actually modified)
    const willModifyStock = (docType === "factura" && !selectedRemitoIds?.length) || docType === "remito" || (docType === "presupuesto" && modificaStock);
    if (willModifyStock) {
      const negativeItems = lines
        .map(l => {
          const prod = products.find(p => p.id === l.productId);
          if (!prod || prod.tracksStock === false) return null;
          const resulting = prod.stock - l.qty;
          return resulting < 0 ? { name: l.name, current: prod.stock, qty: l.qty, resulting } : null;
        })
        .filter(Boolean);
      if (negativeItems.length > 0) {
        setStockAlert({ items: negativeItems });
        return;
      }
    }
    doSave();
  };

  // ── DONE SCREEN ──
  if (done) return (
    <Modal title="Documento generado" onClose={onClose}>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.accent, marginBottom: 8 }}>
          {docType.charAt(0).toUpperCase() + docType.slice(1)} creada exitosamente
        </div>
        {docType === "factura" && <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Stock descontado automáticamente.</p>}
        {docType === "presupuesto" && <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Podés convertirlo en factura o remito cuando el cliente acepte.</p>}
        {docType === "remito" && <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Remito emitido correctamente.</p>}
        <Btn onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );

  // ── ORIGIN CHOOSER (only for factura) ──
  if (!isPresupuesto && origin === null) {
    const docLabel = docType === "factura" ? "Factura" : "Remito";
    const remitosCount = remitos.length;
    return (
      <Modal title={"Nueva " + docLabel} onClose={onClose}>
        <div style={{ marginBottom: 20, color: T.muted, fontSize: 13 }}>
          ¿Cómo querés generar esta {docLabel.toLowerCase()}?
        </div>
        <div style={{ display: "grid", gridTemplateColumns: docType === "factura" ? "1fr 1fr 1fr" : "1fr 1fr", gap: 14, marginBottom: 24 }}>
          {/* Desde presupuesto */}
          <button onClick={() => setOrigin("presupuesto")}
            style={{ background: T.blueLight, border: "2px solid " + T.blue + "40", borderRadius: 14, padding: "22px 18px", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.blue}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.blue + "40"}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>📋</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.blue, marginBottom: 4 }}>Desde presupuesto</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>Convertí un presupuesto aprobado en {docLabel.toLowerCase()}.</div>
            <div style={{ marginTop: 8, fontSize: 11, color: presupuestos.length > 0 ? T.blue : T.muted, fontWeight: 700 }}>
              {presupuestos.length > 0 ? presupuestos.length + " disponible(s)" : "Sin presupuestos pendientes"}
            </div>
          </button>

          {/* Desde remito(s) — solo para facturas */}
          {docType === "factura" && (
            <button onClick={() => setOrigin("remito")}
              style={{ background: T.orangeLight, border: "2px solid " + T.orange + "40", borderRadius: 14, padding: "22px 18px", cursor: "pointer", textAlign: "left" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.orange}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.orange + "40"}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>📦</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: T.orange, marginBottom: 4 }}>Desde remito(s)</div>
              <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>Facturá uno o varios remitos del mismo cliente en una sola factura.</div>
              <div style={{ marginTop: 8, fontSize: 11, color: remitosCount > 0 ? T.orange : T.muted, fontWeight: 700 }}>
                {remitosCount > 0 ? remitosCount + " remito(s) disponible(s)" : "Sin remitos pendientes"}
              </div>
            </button>
          )}

          {/* Desde cero */}
          <button onClick={() => setOrigin("scratch")}
            style={{ background: T.surface, border: "2px solid " + T.border, borderRadius: 14, padding: "22px 18px", cursor: "pointer", textAlign: "left" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>✏️</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 4 }}>Desde cero</div>
            <div style={{ fontSize: 11, color: T.muted, lineHeight: 1.5 }}>Creá la {docLabel.toLowerCase()} manualmente eligiendo los productos.</div>
          </button>
        </div>
      </Modal>
    );
  }

  // ── REMITO SELECTOR ──
  if (origin === "remito" && docType === "factura") {
    const clientsWithRemitos = [...new Set(remitos.map(r => r.clientId))];
    const filteredRemitos = remitoClientFilter
      ? remitos.filter(r => r.clientId === remitoClientFilter)
      : remitos;
    const allSameClient = selectedRemitoIds.length === 0 || remitos.filter(r => selectedRemitoIds.includes(r.id)).every(r => r.clientId === remitos.find(x => x.id === selectedRemitoIds[0])?.clientId);

    return (
      <Modal title="Seleccionar remito(s) a facturar" onClose={onClose} wide>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
          Seleccioná uno o más remitos del mismo cliente. Sus líneas se combinarán en una sola factura.
        </div>

        {/* Filtro por cliente */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>FILTRAR POR CLIENTE</label>
          <select value={remitoClientFilter} onChange={e => { setRemitoClientFilter(e.target.value); setSelectedRemitoIds([]); }}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: "1px solid " + T.border, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
            <option value="">Todos los clientes</option>
            {clientsWithRemitos.map(cid => {
              const c = clients.find(x => x.id === cid);
              return <option key={cid} value={cid}>{c?.name || cid}</option>;
            })}
          </select>
        </div>

        {filteredRemitos.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted, background: T.surface, borderRadius: 12, border: "1px dashed " + T.border }}>
            No hay remitos disponibles{remitoClientFilter ? " para este cliente" : ""}.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 8, marginBottom: 20, maxHeight: 380, overflowY: "auto" }}>
            {filteredRemitos.map(rem => {
              const isSelected = selectedRemitoIds.includes(rem.id);
              const cli = clients.find(c => c.id === rem.clientId);
              // Deshabilitar si hay selección de otro cliente
              const firstSelected = selectedRemitoIds.length > 0 ? remitos.find(r => r.id === selectedRemitoIds[0]) : null;
              const disabled = firstSelected && rem.clientId !== firstSelected.clientId;
              return (
                <div key={rem.id} onClick={() => !disabled && toggleRemito(rem.id)}
                  style={{ background: isSelected ? T.orangeLight : T.surface, border: "2px solid " + (isSelected ? T.orange : disabled ? T.faint : T.border), borderRadius: 10, padding: "14px 18px", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 4, border: "2px solid " + (isSelected ? T.orange : T.border), background: isSelected ? T.orange : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {isSelected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.orange }}>{rem.id}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{rem.clientName}</span>
                      </div>
                      <div style={{ fontSize: 11, color: T.muted, marginBottom: 4 }}>Emitido: {rem.date} · {rem.lines.length} ítem(s)</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {rem.lines.slice(0, 4).map((l, i) => (
                          <span key={i} style={{ background: T.surface2, color: T.muted, padding: "1px 7px", borderRadius: 5, fontSize: 10 }}>{l.clientCode} × {l.qty}</span>
                        ))}
                        {rem.lines.length > 4 && <span style={{ fontSize: 10, color: T.muted }}>+{rem.lines.length - 4} más</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: isSelected ? T.orange : T.ink }}>{fmt(rem.total)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {selectedRemitoIds.length > 0 && (
          <div style={{ background: T.orangeLight, border: "1px solid " + T.orange + "40", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: T.orange, fontWeight: 600 }}>
            {selectedRemitoIds.length} remito(s) seleccionado(s) · {remitos.filter(r => selectedRemitoIds.includes(r.id)).reduce((s, r) => s + r.total, 0).toLocaleString("es-AR", { style: "currency", currency: "ARS" })}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setOrigin(null)} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>← Volver</button>
          <Btn disabled={selectedRemitoIds.length === 0} onClick={loadRemitos}>
            Cargar {selectedRemitoIds.length > 0 ? selectedRemitoIds.length + " remito(s)" : ""} →
          </Btn>
        </div>
      </Modal>
    );
  }

  // ── PRESUPUESTO SELECTOR ──
  if (origin === "presupuesto" && !selectedPresupuestoId) {
    return (
      <Modal title={`Seleccionar presupuesto`} onClose={onClose} wide>
        <div style={{ marginBottom: 16, color: T.muted, fontSize: 13 }}>
          Presupuestos pendientes disponibles para convertir en {docType === "factura" ? "factura" : "remito"}:
        </div>
        {presupuestos.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: T.muted, background: T.surface, borderRadius: 12, border: `1px dashed ${T.border}` }}>
            No hay presupuestos pendientes con ítems cargados.
            <div style={{ marginTop: 14 }}><Btn v="ghost" onClick={() => setOrigin("scratch")}>Crear desde cero</Btn></div>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gap: 10, marginBottom: 20 }}>
              {presupuestos.map(pre => {
                const cli = clients.find(c => c.id === pre.clientId);
                return (
                  <div key={pre.id}
                    onClick={() => loadPresupuesto(pre.id)}
                    style={{ background: T.surface, border: `2px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", cursor: "pointer", transition: "all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.background = T.blueLight; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.blue }}>{pre.id}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{pre.clientName}</span>
                          {cli?.codigo && <span style={{ fontSize: 11, color: T.muted, fontFamily: "monospace" }}>{cli.codigo}</span>}
                        </div>
                        <div style={{ fontSize: 12, color: T.muted, marginBottom: 8 }}>
                          Emitido: {pre.date} · Vence: {pre.due}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {pre.lines.map((l, i) => (
                            <span key={i} style={{ background: T.surface2, color: T.muted, padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>
                              {l.clientCode} × {l.qty}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 16 }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: T.accent }}>{fmt(pre.total)}</div>
                        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{pre.lines.length} ítem(s)</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setOrigin("scratch")} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                ← Crear desde cero
              </button>
            </div>
          </>
        )}
      </Modal>
    );
  }

  // ── MAIN DOC FORM ──
  const docLabel = { factura: "Factura", presupuesto: "Presupuesto", remito: "Remito" }[docType];
  const fromPre = !!selectedPresupuestoId;
  const fromRemitos = selectedRemitoIds.length > 0;
  const sourcePre = fromPre ? saleInvoices.find(i => i.id === selectedPresupuestoId) : null;
  const sourceRemitos = fromRemitos ? saleInvoices.filter(i => selectedRemitoIds.includes(i.id)) : [];

  const modalTitle = fromPre ? docLabel + " desde " + selectedPresupuestoId
    : fromRemitos ? "Factura desde " + selectedRemitoIds.length + " remito(s)"
    : "Nuevo/a " + docLabel;

  return (
    <Modal title={modalTitle} onClose={onClose} xl>

      {/* ── STOCK ALERT MODAL ── */}
      {stockAlert && (
        <div style={{ position: "fixed", inset: 0, background: "#000000a0", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: T.paper, border: `2px solid ${T.orange}60`, borderRadius: 16, width: 480, boxShadow: "0 32px 80px #000000c0", padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <span style={{ fontSize: 32 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.orange }}>Stock insuficiente</div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>Los siguientes ítems quedarían con stock negativo</div>
              </div>
            </div>
            <div style={{ background: T.surface, borderRadius: 10, marginBottom: 20, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.surface2 }}>
                    {["Producto", "Stock actual", "Cantidad", "Resultado"].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {stockAlert.items.map((item, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 600 }}>{item.name}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: T.muted }}>{item.current}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: T.muted }}>−{item.qty}</td>
                      <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 800, color: T.red }}>{item.resulting}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginBottom: 20, lineHeight: 1.6 }}>
              Podés igualmente emitir el documento. El stock quedará en negativo y podrás ajustarlo desde Inventario.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn v="ghost" onClick={() => setStockAlert(null)}>Cancelar</Btn>
              <button onClick={() => { setStockAlert(null); doSave(); }}
                style={{ padding: "10px 22px", borderRadius: 8, border: `1px solid ${T.orange}`, background: T.orangeLight, color: T.orange, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                Emitir igualmente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Origin banner — presupuesto */}
      {fromPre && (
        <div style={{ background: T.blueLight, border: `1px solid ${T.blue}40`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 13, color: T.blue }}>
            <strong>Presupuesto base:</strong> {selectedPresupuestoId} · {sourcePre?.clientName} · {fmt(sourcePre?.total)}
          </div>
          <div style={{ fontSize: 12, color: T.muted }}>Podés modificar ítems antes de confirmar</div>
        </div>
      )}

      {/* Origin banner — remitos */}
      {fromRemitos && (
        <div style={{ background: T.orangeLight, border: `1px solid ${T.orange}40`, borderRadius: 10, padding: "12px 16px", marginBottom: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.orange, marginBottom: 6 }}>REMITOS INCLUIDOS EN ESTA FACTURA</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {sourceRemitos.map(r => (
              <span key={r.id} style={{ fontFamily: "monospace", fontSize: 11, background: T.surface2, color: T.orange, padding: "2px 10px", borderRadius: 6, fontWeight: 700 }}>
                {r.id} · {fmt(r.total)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Client selector — locked if from presupuesto */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr auto auto 1fr", gap: 14, marginBottom: 20, alignItems: "end" }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>CLIENTE</label>
          {fromPre ? (
            <div style={{ padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, fontSize: 13, color: T.ink, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
              <span>{client?.name}</span>
              {client?.codigo && <span style={{ fontFamily: "monospace", fontSize: 11, color: T.muted }}>{client.codigo}</span>}
            </div>
          ) : (
            <select value={clientId} onChange={v => { setClientId(v.target.value); setLines([]); setSelectedPriceList(""); }}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
              <option value="">Seleccionar cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}{c.codigo ? ` (${c.codigo})` : ""}</option>)}
            </select>
          )}
        </div>

        {/* Lista de precios */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>LISTA DE PRECIOS</label>
          <select value={selectedPriceList} onChange={e => { setSelectedPriceList(e.target.value); setLines([]); setPriceInput(""); }}
            style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${selectedPriceList ? T.accent : T.border}`, background: selectedPriceList ? T.accentLight : T.surface, color: selectedPriceList ? T.accent : T.muted, fontSize: 13, fontFamily: "inherit", outline: "none", fontWeight: selectedPriceList ? 700 : 400 }}>
            <option value="">Predeterminada del cliente</option>
            {(priceLists || initPriceLists).map(l => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
        </div>

        {/* Moneda selector */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>MONEDA</label>
          <div style={{ display: "flex", borderRadius: 8, border: `1px solid ${T.border}`, overflow: "hidden" }}>
            {[["ARS", "$ ARS"], ["USD", "🇺🇸 USD"]].map(([val, label]) => (
              <button key={val} onClick={() => handleMonedaChange(val)}
                style={{ flex: 1, padding: "10px 14px", border: "none", background: moneda === val ? (val === "USD" ? T.blueLight : T.accentLight) : T.surface, color: moneda === val ? (val === "USD" ? T.blue : T.accent) : T.muted, fontWeight: moneda === val ? 800 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {client && <div style={{ fontSize: 12, color: T.muted, padding: "4px 0" }}>
            {[client.cuit && "CUIT: " + client.cuit, client.direccion].filter(Boolean).join(" · ")}
          </div>}
          {selectedPriceList && client && (
            <div style={{ fontSize: 11, color: T.accent }}>
              Lista seleccionada — ignorando predeterminada del cliente
            </div>
          )}
        </div>
      </div>

      {/* Add product line */}
      {clientId && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 18, marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 12 }}>
            {fromPre ? "MODIFICAR / AGREGAR PRODUCTOS" : "AGREGAR PRODUCTO"}
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 2 }}>
              <Input label="CÓDIGO (interno o del cliente)" value={codeInput} onChange={handleCodeChange} placeholder="ej: VIDAL-PLA20 o PIN-001" mono />
            </div>
            <div style={{ flex: 0.6 }}>
              <Input label="CANTIDAD" type="number" step="any" min="0.01" value={qtyInput} onChange={v => setQtyInput(parseFloat(v) || 1)} />
            </div>
            <div style={{ flex: 1 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>PRECIO UNIT. S/IVA</label>
                <div style={{ position: "relative" }}>
                  {(() => {
                    const p = findProduct(codeInput);
                    const placeholder = (p && clientId) ? String(getPriceForLine(p).price) : "0.00";
                    return (
                      <input type="number" value={priceInput} onChange={e => setPriceInput(e.target.value)}
                        placeholder={placeholder}
                        style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: "1px solid " + (priceInput && p && clientId && parseFloat(priceInput) !== getPriceForLine(p).price ? T.yellow : T.border), background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                    );
                  })()}
                </div>
                {(() => {
                  const p = findProduct(codeInput);
                  if (!p || !clientId) return null;
                  const { price, source } = getPriceForLine(p);
                  const custom = priceInput && parseFloat(priceInput) !== price;
                  return <div style={{ fontSize: 10, color: custom ? T.yellow : T.muted, marginTop: 3 }}>{custom ? "⚠ Lista: " + fmtM(price) : "Lista: " + fmtM(price) + " (" + source + ")"}</div>;
                })()}
              </div>
            </div>
            <Btn onClick={addLine}>Agregar</Btn>
          </div>
          {codeError && <div style={{ fontSize: 12, color: T.red, marginTop: 8 }}>⚠ {codeError}</div>}
          {/* Searchable product dropdown */}
          {clientId && (() => {
            const q = codeInput.trim().toLowerCase();
            if (!q) return (
              <div style={{ marginTop: 10, fontSize: 11, color: T.faint, padding: "6px 0" }}>
                Escribí un código o nombre para buscar productos
              </div>
            );
            const exact = findProduct(codeInput);
            if (exact) {
              const { price, source } = getPriceForLine(exact);
              return (
                <div style={{ marginTop: 10, background: T.surface2, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 12, alignItems: "center" }}>
                  <span style={{ color: T.ink, fontWeight: 600 }}>{exact.name} <span style={{ color: T.muted }}>· stock: {exact.stock}</span></span>
                  <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ background: T.yellowLight, color: T.yellow, padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700 }}>IVA {exact.iva ?? 21}%</span>
                    <span style={{ color: T.accent, fontWeight: 700 }}>{fmtM(price)} <span style={{ color: T.muted, fontWeight: 400 }}>s/IVA · {source}</span></span>
                  </span>
                </div>
              );
            }
            // Search suggestions by name or any code
            const suggestions = products.filter(p => {
              const ov = p.clientOverrides.find(o => o.clientId === clientId);
              const clientCode = ov?.customCode || p.sku;
              return (
                p.name.toLowerCase().includes(q) ||
                p.sku.toLowerCase().includes(q) ||
                clientCode.toLowerCase().includes(q) ||
                p.category?.toLowerCase().includes(q)
              );
            }).slice(0, 8);
            if (suggestions.length === 0) return (
              <div style={{ marginTop: 10, fontSize: 12, color: T.muted, padding: "8px 0" }}>
                Sin resultados para "{codeInput}"
              </div>
            );
            return (
              <div style={{ marginTop: 8, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
                {suggestions.map(p => {
                  const ov = p.clientOverrides.find(o => o.clientId === clientId);
                  const clientCode = ov?.customCode || p.sku;
                  const { price, source } = getPriceForLine(p);
                  const isCustomCode = clientCode !== p.sku;
                  return (
                    <div key={p.id}
                      onClick={() => { handleCodeChange(clientCode); }}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: T.surface, transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = T.surface2}
                      onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: isCustomCode ? T.blue : T.muted, background: isCustomCode ? T.blueLight : T.surface2, padding: "2px 7px", borderRadius: 5 }}>
                          {clientCode}{isCustomCode && " ✦"}
                        </span>
                        <div>
                          <div style={{ fontSize: 13, color: T.ink }}>{p.name}</div>
                          <div style={{ fontSize: 11, color: T.faint }}>{p.category} · SKU: {p.sku} · stock: {p.stock}</div>
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{fmtM(price)}</div>
                        <div style={{ fontSize: 10, color: T.muted }}>{source} · IVA {p.iva ?? 21}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* Lines table */}
      {lines.length > 0 && (
        <>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>
                {["Código", "Producto", "Cant.", "P. Unit. s/IVA", "IVA", "Subtotal c/IVA", ""].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
              </tr></thead>
              <tbody>{lines.map((l, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.blue }}>{l.clientCode}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13 }}>
                    {l.name}
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>IVA {l.iva}%{l.listPrice && l.unitPrice !== l.listPrice ? <span style={{ color: T.yellow }}> · precio especial</span> : ""}</div>
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <input type="number" min="0.01" step="any" value={l.qty}
                      onChange={e => updateLineQty(i, parseFloat(e.target.value) || 1)}
                      style={{ width: 56, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", textAlign: "center" }} />
                  </td>
                  <td style={{ padding: "11px 14px" }}>
                    <input type="number" value={l.unitPrice}
                      onChange={e => updateLinePrice(i, e.target.value)}
                      style={{ width: 90, padding: "4px 8px", borderRadius: 6, border: `1px solid ${l.listPrice && l.unitPrice !== l.listPrice ? T.yellow : T.border}`, background: l.listPrice && l.unitPrice !== l.listPrice ? T.yellowLight : T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", textAlign: "right" }} />
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 13, color: T.muted }}>{fmtM(l.ivaImporte)}</td>
                  <td style={{ padding: "11px 14px", fontSize: 14, fontWeight: 800, color: moneda === "USD" ? T.blue : T.ink }}>{fmtM(l.subtotal)}</td>
                  <td style={{ padding: "11px 14px" }}><button onClick={() => setLines(lines.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 15 }}>✕</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          {/* Fiscal totals */}
          {/* Options: stock toggle (presupuesto only) + PDF */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            {docType === "presupuesto" && (
              <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", padding: "10px 14px", borderRadius: 10, border: `1px solid ${modificaStock ? T.accent : T.border}`, background: modificaStock ? T.accentLight : T.surface }}>
                <div onClick={() => setModificaStock(!modificaStock)}
                  style={{ width: 38, height: 22, borderRadius: 11, background: modificaStock ? T.accent : T.faint, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 3, left: modificaStock ? 18 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: modificaStock ? T.accent : T.ink }}>Modificar stock al guardar</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Si está activo, este presupuesto reserva o descuenta stock al confirmarse</div>
                </div>
              </label>
            )}
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none", padding: "10px 14px", borderRadius: 10, border: `1px solid ${imprimirPDF ? T.blue : T.border}`, background: imprimirPDF ? T.blueLight : T.surface }}>
              <div onClick={() => setImprimirPDF(!imprimirPDF)}
                style={{ width: 38, height: 22, borderRadius: 11, background: imprimirPDF ? T.blue : T.faint, position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ position: "absolute", top: 3, left: imprimirPDF ? 18 : 3, width: 16, height: 16, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: imprimirPDF ? T.blue : T.ink }}>Imprimir / exportar PDF al guardar</div>
                <div style={{ fontSize: 11, color: T.muted }}>Se abrirá el diálogo de impresión del navegador con el documento listo</div>
              </div>
            </label>
          </div>

          {/* Vendedor */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>
              VENDEDOR <span style={{ fontWeight: 400, color: T.faint }}>(opcional · aparece en el documento)</span>
            </label>
            {vendedores && vendedores.length > 0 ? (
              <select value={vendedor} onChange={e => setVendedor(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: `1px solid ${vendedor ? T.accent + "60" : T.border}`, background: vendedor ? T.accentLight : T.surface, color: vendedor ? T.accent : T.muted, fontSize: 13, fontFamily: "inherit", outline: "none", fontWeight: vendedor ? 700 : 400 }}>
                <option value="">— Sin vendedor asignado —</option>
                {vendedores.map(v => (
                  <option key={v.id} value={v.id}>{v.codigo} · {v.nombre}</option>
                ))}
              </select>
            ) : (
              <div style={{ padding: "10px 14px", borderRadius: 10, border: `1px dashed ${T.border}`, background: T.surface, color: T.muted, fontSize: 12 }}>
                No hay vendedores cargados. Agregá vendedores en <strong>Ventas → Vendedores</strong>.
              </div>
            )}
          </div>

          {/* Método de pago */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>
              MÉTODO DE PAGO <span style={{ fontWeight: 400, color: T.faint }}>(opcional · usado por el módulo Caja)</span>
            </label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {[["", "Sin especificar"], ["efectivo", "Efectivo"], ["transferencia", "Transferencia"], ["cuenta_corriente", "Cuenta corriente"], ["cheque", "Cheque"], ["tarjeta", "Tarjeta"]].map(([val, label]) => (
                <button key={val} onClick={() => setMetodoPago(val)}
                  style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${metodoPago === val ? T.accent : T.border}`, background: metodoPago === val ? T.accentLight : T.surface, color: metodoPago === val ? T.accent : T.muted, fontWeight: metodoPago === val ? 700 : 500, fontSize: 12, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Retenciones sufridas — solo facturas */}
          {docType === "factura" && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>
                RETENCIONES SUFRIDAS <span style={{ fontWeight: 400, color: T.faint }}>(opcional · impactan en contabilidad al cobrar)</span>
              </label>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {[
                    ["iibbCaba",  "IIBB Ret. CABA",      "Cta. 114203"],
                    ["iibbBsAs",  "IIBB Ret. Bs. As.",   "Cta. 114205"],
                    ["ganancias", "Ret. Ganancias",       "Cta. 114403"],
                    ["ivaRet",    "Ret. IVA",             "Cta. 114302"],
                    ["suss",      "Ret. SUSS",            "Cta. 213400"],
                  ].map(([key, label, cta]) => (
                    <div key={key}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4, letterSpacing: 0.8 }}>
                        {label} <span style={{ fontWeight: 400, color: T.faint, fontFamily: "monospace", fontSize: 9 }}>{cta}</span>
                      </label>
                      <input
                        type="number" min="0" placeholder="0"
                        value={retenciones[key]}
                        onChange={e => setRetenciones(r => ({ ...r, [key]: e.target.value }))}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${retenciones[key] ? T.accent + "60" : T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }}
                      />
                    </div>
                  ))}
                </div>
                {(() => {
                  const totalRet = ["iibbCaba","iibbBsAs","ganancias","ivaRet","suss"].reduce((s, k) => s + (parseFloat(retenciones[k]) || 0), 0);
                  return totalRet > 0 ? (
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: T.muted }}>Total retenciones</span>
                      <span style={{ fontWeight: 700, color: T.red, fontFamily: "monospace" }}>-${totalRet.toLocaleString("es-AR")}</span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>
          )}

          {/* Observaciones */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>
              OBSERVACIONES <span style={{ fontWeight: 400, color: T.faint }}>(opcional · aparece en el documento)</span>
            </label>
            <textarea
              value={observaciones}
              onChange={e => setObservaciones(e.target.value)}
              placeholder={`ej: Plazo de entrega 5 días hábiles. Cotización en dólares tipo cambio vendedor BNA al día de emisión. Validez del presupuesto: 15 días.`}
              rows={3}
              style={{ width: "100%", padding: "11px 14px", borderRadius: 10, border: `1px solid ${observaciones ? T.accent + "60" : T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box", transition: "border-color 0.2s" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "flex-end" }}>
            <div style={{ display: "flex", gap: 20, alignItems: "flex-end" }}>
              <div style={{ background: T.surface, border: `1px solid ${moneda === "USD" ? T.blue + "50" : T.border}`, borderRadius: 12, padding: "14px 20px", textAlign: "right", minWidth: 220 }}>
                {moneda === "USD" && (
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 10 }}>
                    <span style={{ background: T.blueLight, color: T.blue, fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 6, letterSpacing: 0.5 }}>🇺🇸 Dólares estadounidenses</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.muted, marginBottom: 6 }}>
                  <span>Subtotal s/IVA</span><span style={{ color: T.ink }}>{fmtM(totalNeto)}</span>
                </div>
                {Object.entries(lines.reduce((acc, l) => { const k = l.iva; acc[k] = (acc[k] || 0) + l.ivaImporte; return acc; }, {})).map(([rate, imp]) => (
                  <div key={rate} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.muted, marginBottom: 6 }}>
                    <span>IVA {rate}%</span><span style={{ color: T.yellow }}>{fmtM(imp)}</span>
                  </div>
                ))}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800 }}>
                  <span style={{ color: T.muted }}>TOTAL</span><span style={{ color: moneda === "USD" ? T.blue : T.accent }}>{fmtM(total)}</span>
                </div>
              </div>
              <Btn onClick={confirm} disabled={!clientId}>✓ Confirmar {docLabel}</Btn>
            </div>
          </div>
        </>
      )}

      {clientId && lines.length === 0 && (
        <div style={{ padding: "20px", textAlign: "center", color: T.muted, fontSize: 13 }}>
          Agregá productos usando los códigos de arriba.
        </div>
      )}
    </Modal>
  );
}

// ─── ORDEN DE COMPRA: PDF PRINT ───────────────────────────────────────────────
function imprimirOC(oc) {
  const win = window.open('', '_blank', 'width=800,height=600');
  const totalNeto = oc.lines.reduce((s, l) => s + (l.neto ?? l.qty * (l.precioNeto ?? l.precio ?? 0)), 0);
  const totalIva = oc.lines.reduce((s, l) => s + (l.ivaImporte ?? 0), 0);
  const ivaByRate = oc.lines.reduce((acc, l) => {
    const rate = l.iva ?? 0;
    if (rate > 0) acc[rate] = (acc[rate] || 0) + (l.ivaImporte ?? 0);
    return acc;
  }, {});
  const linesHtml = oc.lines.map(l => {
    const neto = l.neto ?? l.qty * (l.precioNeto ?? l.precio ?? 0);
    const iv = l.ivaImporte ?? 0;
    const sub = l.subtotal ?? (neto + iv);
    return `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${l.nombre}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${l.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">$${Number(l.precioNeto ?? l.precio ?? 0).toLocaleString('es-AR')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${l.iva ?? 0}%</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">$${Number(iv).toLocaleString('es-AR')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right">$${Number(sub).toLocaleString('es-AR')}</td>
    </tr>`;
  }).join('');
  const ivaRowsHtml = Object.entries(ivaByRate).map(([rate, imp]) =>
    `<tr><td colspan="5" style="text-align:right;padding:6px 12px;color:#6b7280;font-size:13px">IVA ${rate}%</td><td style="text-align:right;padding:6px 12px;color:#d97706;font-size:13px">$${Number(imp).toLocaleString('es-AR')}</td></tr>`
  ).join('');
  win.document.write(`<!DOCTYPE html><html><head><title>Orden de Compra ${oc.ref}</title>
    <style>body{font-family:'Segoe UI',sans-serif;color:#1a1a1a;padding:40px;max-width:760px;margin:0 auto}
    h1{font-size:24px;font-weight:800;color:#2ea043;margin-bottom:4px}
    .sub{color:#6b7280;font-size:13px;margin-bottom:24px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:24px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px}
    .label{font-size:10px;font-weight:700;color:#9ca3af;letter-spacing:.8px;margin-bottom:3px}
    .val{font-size:13px;font-weight:600}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    thead tr{background:#f3f4f6}
    th{padding:9px 12px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;letter-spacing:.8px}
    .subtot td{padding:6px 12px;font-size:13px;color:#6b7280;border-top:1px solid #e5e7eb}
    .total-row td{font-size:15px;font-weight:800;color:#2ea043;padding:10px 12px;border-top:2px solid #e5e7eb}
    .obs{background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-size:13px;color:#374151;margin-bottom:20px}
    .footer{text-align:center;font-size:11px;color:#9ca3af;margin-top:40px}
    @media print{body{padding:20px}}</style></head>
    <body>
    <h1>Orden de Compra</h1>
    <div class="sub">${oc.ref} &nbsp;·&nbsp; ${oc.date}</div>
    <div class="grid">
      <div><div class="label">PROVEEDOR</div><div class="val">${oc.supplierName}</div></div>
      <div><div class="label">FECHA</div><div class="val">${oc.date}</div></div>
      <div><div class="label">REFERENCIA</div><div class="val">${oc.ref}</div></div>
    </div>
    <table>
      <thead><tr>
        <th>Artículo</th>
        <th style="text-align:center">Cant.</th>
        <th style="text-align:right">P. Unit. s/IVA</th>
        <th style="text-align:center">IVA</th>
        <th style="text-align:right">IVA $</th>
        <th style="text-align:right">Subtotal c/IVA</th>
      </tr></thead>
      <tbody>${linesHtml}
      <tr class="subtot"><td colspan="5" style="text-align:right">Subtotal s/IVA</td><td style="text-align:right">$${Number(totalNeto).toLocaleString('es-AR')}</td></tr>
      ${ivaRowsHtml}
      <tr class="total-row"><td colspan="5" style="text-align:right">TOTAL</td><td style="text-align:right">$${Number(oc.total).toLocaleString('es-AR')}</td></tr>
      </tbody>
    </table>
    ${oc.observaciones ? `<div class="label" style="margin-bottom:6px">OBSERVACIONES</div><div class="obs">${oc.observaciones}</div>` : ''}
    <div class="footer">Documento generado por NexoPyME</div>
    <script>window.onload=()=>{window.print();}</script>
    </body></html>`);
  win.document.close();
}

// ─── ORDEN DE COMPRA BUILDER ──────────────────────────────────────────────────
function OrdenCompraBuilder({ suppliers, products, onSave, onClose }) {
  const [supplierId, setSupplierId] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [lines, setLines] = useState([]);
  const [nombre, setNombre] = useState("");
  const [qty, setQty] = useState(1);
  const [precioNeto, setPrecioNeto] = useState("");
  const [iva, setIva] = useState(21);
  const [done, setDone] = useState(false);
  const [savedOC, setSavedOC] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  const supplier = suppliers.find(s => s.id === supplierId);
  const totalNeto = lines.reduce((s, l) => s + l.neto, 0);
  const totalIva = lines.reduce((s, l) => s + l.ivaImporte, 0);
  const total = totalNeto + totalIva;

  const addLine = () => {
    if (!nombre.trim()) return;
    const pn = parseFloat(precioNeto) || 0;
    const q = qty || 1;
    const neto = q * pn;
    const ivaImporte = Math.round(neto * iva) / 100;
    setLines(prev => [...prev, { nombre: nombre.trim(), qty: q, precioNeto: pn, iva, neto, ivaImporte, subtotal: neto + ivaImporte }]);
    setNombre(""); setQty(1); setPrecioNeto("");
  };

  const handleConfirm = () => {
    if (!supplierId || lines.length === 0) return;
    const oc = { supplierId, supplierName: supplier.name, observaciones, lines, total };
    const saved = onSave(oc);
    setSavedOC(saved);
    setDone(true);
  };

  if (done && savedOC) return (
    <Modal title="Orden creada" onClose={onClose}>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.accent, marginBottom: 8 }}>Orden registrada</div>
        <div style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Ref: <strong style={{ color: T.ink }}>{savedOC.ref}</strong> · {savedOC.supplierName}</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <Btn v="ghost" onClick={() => imprimirOC(savedOC)}>⬡ Exportar PDF</Btn>
          <Btn onClick={onClose}>Cerrar</Btn>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal title="Nueva orden de compra" onClose={onClose} xl>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 18 }}>
        <Select label="PROVEEDOR" value={supplierId} onChange={setSupplierId} options={[{ value: "", label: "Seleccionar proveedor..." }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]} />
        <div />
      </div>

      {supplierId && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 12 }}>AGREGAR ARTÍCULO</div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 3 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>DESCRIPCIÓN</label>
              <input
                value={nombre}
                onChange={e => {
                  const v = e.target.value;
                  setNombre(v);
                  const q = v.trim().toLowerCase();
                  setSuggestions(q.length >= 1
                    ? (products || []).filter(p => p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)).slice(0, 8)
                    : []);
                }}
                placeholder="Nombre del producto o servicio..."
                style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ flex: 0.6 }}>
              <Input label="CANT." type="number" step="any" min="0.01" value={qty} onChange={v => setQty(parseFloat(v) || 1)} />
            </div>
            <div style={{ flex: 1 }}>
              <Input label="PRECIO UNIT. S/IVA" type="number" value={precioNeto} onChange={setPrecioNeto} placeholder="0" />
            </div>
            <div style={{ flex: 0.6 }}>
              <Select label="IVA %" value={String(iva)} onChange={v => setIva(Number(v))} options={[{ value: "0", label: "0%" }, { value: "10.5", label: "10.5%" }, { value: "21", label: "21%" }, { value: "27", label: "27%" }]} />
            </div>
            <Btn onClick={addLine} disabled={!nombre.trim()}>Agregar</Btn>
          </div>
          {suggestions.length > 0 && (
            <div style={{ marginTop: 8, border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden" }}>
              {suggestions.map(p => (
                <div key={p.id}
                  onClick={() => { setNombre(p.name); if (p.cost > 0) setPrecioNeto(String(p.cost)); if (p.iva) setIva(p.iva); setSuggestions([]); }}
                  style={{ padding: "10px 14px", cursor: "pointer", background: T.paper, borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface}
                  onMouseLeave={e => e.currentTarget.style.background = T.paper}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: T.muted, marginLeft: 8 }}>{p.sku}{p.category ? ` · ${p.category}` : ""}</span>
                  </div>
                  {p.cost > 0 && <span style={{ fontSize: 12, color: T.accent, fontWeight: 700 }}>Costo: ${Number(p.cost).toLocaleString("es-AR")}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {lines.length > 0 && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: T.surface }}>
              {["Artículo", "Cant.", "P. Unit. s/IVA", "IVA", "IVA $", "Subtotal c/IVA", ""].map(h =>
                <th key={h} style={{ padding: "9px 13px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
            </tr></thead>
            <tbody>{lines.map((l, i) => (
              <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                <td style={{ padding: "11px 13px", fontSize: 13 }}>{l.nombre}</td>
                <td style={{ padding: "11px 13px", fontSize: 13 }}>{l.qty}</td>
                <td style={{ padding: "11px 13px", fontSize: 13 }}>{fmt(l.precioNeto)}</td>
                <td style={{ padding: "11px 13px", fontSize: 12, color: T.muted }}>{l.iva}%</td>
                <td style={{ padding: "11px 13px", fontSize: 13, color: T.yellow }}>{fmt(l.ivaImporte)}</td>
                <td style={{ padding: "11px 13px", fontSize: 14, fontWeight: 700 }}>{fmt(l.subtotal)}</td>
                <td style={{ padding: "11px 13px" }}><button onClick={() => setLines(lines.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>✕</button></td>
              </tr>
            ))}</tbody>
          </table>
          <div style={{ padding: "12px 16px", borderTop: `2px solid ${T.border}` }}>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: T.muted }}>Subtotal s/IVA: <strong style={{ color: T.ink }}>{fmt(totalNeto)}</strong></span>
              <span style={{ fontSize: 12, color: T.muted }}>IVA: <strong style={{ color: T.yellow }}>{fmt(totalIva)}</strong></span>
              <span style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>TOTAL {fmt(total)}</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>OBSERVACIONES</label>
        <textarea value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Condiciones de entrega, plazos, notas para el proveedor..."
          style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", minHeight: 72, resize: "vertical" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <Btn v="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleConfirm} disabled={!supplierId || lines.length === 0}>✓ Crear orden de compra</Btn>
      </div>
    </Modal>
  );
}

// ─── PURCHASE INVOICE BUILDER ─────────────────────────────────────────────────
function PurchaseBuilder({ suppliers, products, onSave, onClose, ordenesCompra = [] }) {
  const [supplierId, setSupplierId] = useState("");
  const [nroFactura, setNroFactura] = useState("");
  const [payStatus, setPayStatus] = useState("pendiente");
  const [lines, setLines] = useState([]);
  const [codeInput, setCodeInput] = useState("");
  const [qtyInput, setQtyInput] = useState(1);
  const [priceInput, setPriceInput] = useState("");
  const [codeError, setCodeError] = useState("");
  const [done, setDone] = useState(false);
  const [ordenCompraId, setOrdenCompraId] = useState("");
  const [percepciones, setPercepciones] = useState({ iibbCaba: "", iibbBsAs: "" });

  const supplier = suppliers.find(s => s.id === supplierId);
  const ocOptions = ordenesCompra.filter(o => o.supplierId === supplierId);

  // Find product by supplier code OR internal SKU, returns { product, supplierCode, suggestedPrice }
  const findProduct = (code) => {
    const n = code.trim().toUpperCase();
    const bySupCode = supplier?.productCodes.find(pc => pc.supplierCode.toUpperCase() === n);
    if (bySupCode) {
      const prod = products.find(p => p.id === bySupCode.productId);
      return prod ? { product: prod, supplierCode: bySupCode.supplierCode, suggestedPrice: bySupCode.lastPrice } : null;
    }
    const byInternal = products.find(p => p.sku.toUpperCase() === n);
    if (byInternal) return { product: byInternal, supplierCode: code, suggestedPrice: null };
    return null;
  };

  // Search suggestions: match by supplier code, SKU, or product name/category
  const getSuggestions = (q) => {
    if (!q.trim()) return [];
    const lq = q.toLowerCase();
    const results = [];
    const seen = new Set();
    // First: products this supplier sells (supplier codes)
    if (supplier) {
      for (const pc of supplier.productCodes) {
        const prod = products.find(p => p.id === pc.productId);
        if (!prod || seen.has(prod.id)) continue;
        if (pc.supplierCode.toLowerCase().includes(lq) || prod.name.toLowerCase().includes(lq) || prod.sku.toLowerCase().includes(lq) || prod.category?.toLowerCase().includes(lq)) {
          results.push({ product: prod, supplierCode: pc.supplierCode, suggestedPrice: pc.lastPrice, fromSupplier: true });
          seen.add(prod.id);
        }
      }
    }
    // Then: all products by SKU/name (not already added)
    for (const prod of products) {
      if (seen.has(prod.id)) continue;
      if (prod.name.toLowerCase().includes(lq) || prod.sku.toLowerCase().includes(lq) || prod.category?.toLowerCase().includes(lq)) {
        results.push({ product: prod, supplierCode: prod.sku, suggestedPrice: null, fromSupplier: false });
        seen.add(prod.id);
      }
    }
    return results.slice(0, 8);
  };

  const handleCodeChange = (v) => {
    setCodeInput(v);
    setCodeError("");
    const found = findProduct(v);
    if (found) setPriceInput(String(found.suggestedPrice || ""));
    else setPriceInput("");
  };

  const selectSuggestion = (s) => {
    setCodeInput(s.supplierCode);
    setPriceInput(s.suggestedPrice ? String(s.suggestedPrice) : "");
    setCodeError("");
  };

  const addLine = () => {
    if (!supplierId) { setCodeError("Seleccioná un proveedor."); return; }
    const found = findProduct(codeInput);
    if (!found) { setCodeError(`Código "${codeInput}" no encontrado.`); return; }
    setCodeError("");
    const unitPrice = parseFloat(priceInput) || found.suggestedPrice || 0;
    const iva = found.product.iva ?? 21;
    const neto = qtyInput * unitPrice;
    const ivaImporte = Math.round(neto * iva) / 100;
    const existing = lines.findIndex(l => l.productId === found.product.id);
    if (existing >= 0) {
      setLines(lines.map((l, i) => {
        if (i !== existing) return l;
        const newNeto = (l.qty + qtyInput) * l.unitPrice;
        const newIva = Math.round(newNeto * l.iva) / 100;
        return { ...l, qty: l.qty + qtyInput, neto: newNeto, ivaImporte: newIva, subtotal: newNeto + newIva };
      }));
    } else {
      setLines([...lines, { productId: found.product.id, supplierCode: found.supplierCode, name: found.product.name, sku: found.product.sku, qty: qtyInput, unitPrice, suggestedPrice: found.suggestedPrice, unit: found.product.unit, iva, neto, ivaImporte, subtotal: neto + ivaImporte }]);
    }
    setCodeInput(""); setQtyInput(1); setPriceInput("");
  };

  const updateLineQty = (i, qty) => setLines(lines.map((l, j) => {
    if (j !== i) return l;
    const neto = qty * l.unitPrice; const ivaImporte = Math.round(neto * l.iva) / 100;
    return { ...l, qty, neto, ivaImporte, subtotal: neto + ivaImporte };
  }));

  const updateLinePrice = (i, val) => setLines(lines.map((l, j) => {
    if (j !== i) return l;
    const unitPrice = parseFloat(val) || l.unitPrice;
    const neto = l.qty * unitPrice; const ivaImporte = Math.round(neto * l.iva) / 100;
    return { ...l, unitPrice, neto, ivaImporte, subtotal: neto + ivaImporte };
  }));

  const totalNeto = lines.reduce((s, l) => s + l.neto, 0);
  const totalIva = lines.reduce((s, l) => s + l.ivaImporte, 0);
  const total = totalNeto + totalIva;
  const percObj = { iibbCaba: parseFloat(percepciones.iibbCaba) || 0, iibbBsAs: parseFloat(percepciones.iibbBsAs) || 0 };
  const totalPercepciones = percObj.iibbCaba + percObj.iibbBsAs;
  const totalConPerc = total + totalPercepciones;

  const confirm = () => { onSave({ lines, total: totalConPerc, totalNeto, totalIva, supplierId, supplierName: supplier.name, payStatus, nroFactura, ordenCompraId: ordenCompraId || null, percepciones: percObj }); setDone(true); };

  if (done) return (
    <Modal title="Factura registrada" onClose={onClose}>
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: T.accent, marginBottom: 8 }}>Compra registrada</div>
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 20 }}>Stock actualizado. Factura registrada como <strong style={{ color: payStatus === "pagada" ? T.accent : T.yellow }}>{payStatus}</strong>.</p>
        <Btn onClick={onClose}>Cerrar</Btn>
      </div>
    </Modal>
  );

  const suggestions = getSuggestions(codeInput);
  const exactMatch = findProduct(codeInput);

  return (
    <Modal title="Nueva factura de proveedor" onClose={onClose} xl>
      {/* Row 1: proveedor + nro factura + estado */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, marginBottom: 18 }}>
        <Select label="PROVEEDOR" value={supplierId} onChange={v => { setSupplierId(v); setLines([]); setCodeInput(""); setOrdenCompraId(""); }} options={[{ value: "", label: "Seleccionar proveedor..." }, ...suppliers.map(s => ({ value: s.id, label: s.name }))]} />
        <Input label="N° DE FACTURA" value={nroFactura} onChange={setNroFactura} placeholder="ej: 0001-00012345" mono />
        <Select label="ESTADO DE PAGO" value={payStatus} onChange={setPayStatus} options={[{ value: "pendiente", label: "Pendiente de pago" }, { value: "pagada", label: "Ya pagada / Contado" }]} />
      </div>
      {supplierId && ocOptions.length > 0 && (
        <div style={{ marginBottom: 18 }}>
          <Select label="VINCULAR A ORDEN DE COMPRA (opcional)" value={ordenCompraId} onChange={setOrdenCompraId}
            options={[{ value: "", label: "Sin orden de compra asociada" }, ...ocOptions.map(o => ({ value: o.id, label: `${o.ref} · ${o.supplierName} · ${fmt(o.total)}` }))]} />
        </div>
      )}

      {supplierId && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 12 }}>AGREGAR PRODUCTO</div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <div style={{ flex: 2 }}>
              <Input label="CÓDIGO PROVEEDOR, SKU O DESCRIPCIÓN" value={codeInput} onChange={handleCodeChange} mono placeholder="Buscá por código o nombre..." />
            </div>
            <div style={{ flex: 0.6 }}>
              <Input label="CANTIDAD" type="number" step="any" min="0.01" value={qtyInput} onChange={v => setQtyInput(parseFloat(v) || 1)} />
            </div>
            <div style={{ flex: 1 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>PRECIO UNIT. S/IVA</label>
                <input type="number" value={priceInput} onChange={e => setPriceInput(e.target.value)} placeholder="Ingresá precio"
                  style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                {exactMatch?.suggestedPrice && priceInput && parseFloat(priceInput) !== exactMatch.suggestedPrice &&
                  <div style={{ fontSize: 10, color: T.yellow, marginTop: 3 }}>⚠ Últ. precio: {fmt(exactMatch.suggestedPrice)}</div>}
              </div>
            </div>
            <Btn onClick={addLine}>Agregar</Btn>
          </div>
          {codeError && <div style={{ fontSize: 12, color: T.red, marginTop: 8 }}>⚠ {codeError}</div>}

          {/* Dropdown */}
          {codeInput && !exactMatch && suggestions.length > 0 && (
            <div style={{ marginTop: 8, border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
              {suggestions.map(s => (
                <div key={s.product.id}
                  onClick={() => selectSuggestion(s)}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderBottom: `1px solid ${T.border}`, cursor: "pointer", background: T.surface, transition: "background 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surface2}
                  onMouseLeave={e => e.currentTarget.style.background = T.surface}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: s.fromSupplier ? T.orange : T.muted, background: s.fromSupplier ? T.orangeLight : T.surface2, padding: "2px 7px", borderRadius: 5 }}>
                      {s.supplierCode}{s.fromSupplier && " ★"}
                    </span>
                    <div>
                      <div style={{ fontSize: 13, color: T.ink }}>{s.product.name}</div>
                      <div style={{ fontSize: 11, color: T.faint }}>{s.product.category} · SKU: {s.product.sku} · stock actual: {s.product.stock}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                    {s.suggestedPrice
                      ? <div style={{ fontSize: 13, fontWeight: 700, color: T.orange }}>{fmt(s.suggestedPrice)}</div>
                      : <div style={{ fontSize: 12, color: T.faint }}>Sin precio previo</div>}
                    <div style={{ fontSize: 10, color: T.yellow }}>IVA {s.product.iva ?? 21}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {codeInput && exactMatch && (
            <div style={{ marginTop: 10, background: T.surface2, borderRadius: 8, padding: "10px 14px", display: "flex", justifyContent: "space-between", fontSize: 12, alignItems: "center" }}>
              <span style={{ color: T.ink, fontWeight: 600 }}>{exactMatch.product.name} <span style={{ color: T.muted }}>· stock: {exactMatch.product.stock}</span></span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ background: T.yellowLight, color: T.yellow, padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700 }}>IVA {exactMatch.product.iva ?? 21}%</span>
                {exactMatch.suggestedPrice && <span style={{ color: T.orange, fontWeight: 700 }}>Últ. precio: {fmt(exactMatch.suggestedPrice)}</span>}
              </span>
            </div>
          )}
          {codeInput && !exactMatch && suggestions.length === 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: T.muted, padding: "8px 0" }}>Sin resultados para "{codeInput}"</div>
          )}
          {!codeInput && (
            <div style={{ marginTop: 10, fontSize: 11, color: T.faint }}>Escribí un código de proveedor, SKU interno o nombre de producto</div>
          )}
        </div>
      )}

      {lines.length > 0 && (
        <>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>
                {["Código", "Producto", "Cant.", "P. Unit. s/IVA", "IVA", "Subtotal c/IVA", ""].map(h =>
                  <th key={h} style={{ padding: "9px 13px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
              </tr></thead>
              <tbody>{lines.map((l, i) => (
                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "11px 13px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.orange }}>{l.supplierCode}</td>
                  <td style={{ padding: "11px 13px", fontSize: 13 }}>
                    {l.name}
                    <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>IVA {l.iva}%</div>
                  </td>
                  <td style={{ padding: "11px 13px" }}>
                    <input type="number" min="0.01" step="any" value={l.qty} onChange={e => updateLineQty(i, parseFloat(e.target.value) || 1)}
                      style={{ width: 56, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", textAlign: "center" }} />
                  </td>
                  <td style={{ padding: "11px 13px" }}>
                    <input type="number" value={l.unitPrice} onChange={e => updateLinePrice(i, e.target.value)}
                      style={{ width: 90, padding: "4px 8px", borderRadius: 6, border: `1px solid ${l.suggestedPrice && l.unitPrice !== l.suggestedPrice ? T.yellow : T.border}`, background: l.suggestedPrice && l.unitPrice !== l.suggestedPrice ? T.yellowLight : T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", textAlign: "right" }} />
                  </td>
                  <td style={{ padding: "11px 13px", fontSize: 13, color: T.muted }}>{fmt(l.ivaImporte)}</td>
                  <td style={{ padding: "11px 13px", fontSize: 14, fontWeight: 800 }}>{fmt(l.subtotal)}</td>
                  <td style={{ padding: "11px 13px" }}><button onClick={() => setLines(lines.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer" }}>✕</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {/* Percepciones de IIBB sufridas */}
          <div style={{ marginTop: 16, padding: "14px 16px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>
              PERCEPCIONES DE IIBB SUFRIDAS <span style={{ fontWeight: 400, color: T.faint }}>(opcional · el proveedor las cobra y las suma al total)</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[["iibbCaba","IIBB Percepción CABA","Cta. 114204"],["iibbBsAs","IIBB Percepción Bs. As.","Cta. 114206"]].map(([key, label, cta]) => (
                <div key={key}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4, letterSpacing: 0.8 }}>
                    {label} <span style={{ fontWeight: 400, color: T.faint, fontFamily: "monospace", fontSize: 9 }}>{cta}</span>
                  </label>
                  <input type="number" min="0" placeholder="0" value={percepciones[key]}
                    onChange={e => setPercepciones(p => ({ ...p, [key]: e.target.value }))}
                    style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${percepciones[key] ? T.accent + "60" : T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 20, alignItems: "flex-end", marginTop: 16 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 20px", textAlign: "right", minWidth: 220 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.muted, marginBottom: 6 }}>
                <span>Subtotal s/IVA</span><span style={{ color: T.ink }}>{fmt(totalNeto)}</span>
              </div>
              {Object.entries(lines.reduce((acc, l) => { const k = l.iva; acc[k] = (acc[k] || 0) + l.ivaImporte; return acc; }, {})).map(([rate, imp]) => (
                <div key={rate} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.muted, marginBottom: 6 }}>
                  <span>IVA {rate}%</span><span style={{ color: T.yellow }}>{fmt(imp)}</span>
                </div>
              ))}
              {totalPercepciones > 0 && <>
                {percObj.iibbCaba > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.muted, marginBottom: 6 }}><span>IIBB Perc. CABA</span><span style={{ color: T.orange }}>{fmt(percObj.iibbCaba)}</span></div>}
                {percObj.iibbBsAs > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: T.muted, marginBottom: 6 }}><span>IIBB Perc. Bs.As.</span><span style={{ color: T.orange }}>{fmt(percObj.iibbBsAs)}</span></div>}
              </>}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 8, marginTop: 4, display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 800 }}>
                <span style={{ color: T.muted }}>TOTAL</span><span style={{ color: T.accent }}>{fmt(totalConPerc)}</span>
              </div>
            </div>
            <Btn onClick={confirm} disabled={!supplierId}>✓ Confirmar compra</Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── SEARCH BAR ───────────────────────────────────────────────────────────────
function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative", flex: 1 }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: T.muted, fontSize: 14, pointerEvents: "none" }}>🔍</span>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || "Buscar..."}
        style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      {value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14, lineHeight: 1 }}>✕</button>}
    </div>
  );
}

// ─── SHARED: CHART → PNG ──────────────────────────────────────────────────────
function chartToPng(type, labels, values, { width = 660, height = 260, color = '#2ea043', title = '' } = {}) {
  try {
    const fmtV = (v) => v >= 1e6 ? '$' + (v/1e6).toFixed(1).replace('.',',') + 'M' : v >= 1e3 ? '$' + Math.round(v/1000).toLocaleString('es-AR') + 'K' : '$' + Math.round(v).toLocaleString('es-AR');
    const canvas = document.createElement('canvas');
    canvas.width = width * 2; canvas.height = height * 2; // 2x for sharpness
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
    const nums = values.map(v => typeof v === 'number' ? v : 0);
    const maxVal = Math.max(...nums, 1);
    const padL = 20, padR = 20, padT = title ? 36 : 24, padB = 32;
    const cW = width - padL - padR, cH = height - padT - padB;
    if (title) {
      ctx.fillStyle = '#444'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'left';
      ctx.fillText(title.toUpperCase(), padL, 18);
      ctx.strokeStyle = '#e0e0e0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, 24); ctx.lineTo(width - padR, 24); ctx.stroke();
    }
    // Light horizontal gridlines
    for (let g = 1; g <= 3; g++) {
      const y = padT + (g / 4) * cH;
      ctx.strokeStyle = '#f0f0f0'; ctx.lineWidth = 0.5;
      ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + cW, y); ctx.stroke();
    }
    // Baseline
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(padL, padT + cH); ctx.lineTo(padL + cW, padT + cH); ctx.stroke();

    if (type === 'bar') {
      const gap = cW / (labels.length || 1);
      const bW = Math.max(gap * 0.72, 6);
      nums.forEach((v, i) => {
        const bH = Math.max((v / maxVal) * cH, v > 0 ? 3 : 0);
        const x = padL + i * gap + (gap - bW) / 2;
        const y = padT + cH - bH;
        // Bar with slight rounding on top
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(x, y, bW, bH, [3, 3, 0, 0]) : ctx.rect(x, y, bW, bH);
        ctx.fill();
        // Value label above bar
        if (v > 0) {
          ctx.fillStyle = '#333'; ctx.font = 'bold 9px Arial'; ctx.textAlign = 'center';
          ctx.fillText(fmtV(v), x + bW / 2, y - 5);
        }
        // X label
        const s = String(labels[i]).slice(0, 8);
        ctx.fillStyle = '#888'; ctx.font = '9px Arial'; ctx.textAlign = 'center';
        ctx.fillText(s, x + bW / 2, height - padB + 14);
      });
    } else if (type === 'line' && nums.length >= 2) {
      const pts = nums.map((v, i) => ({ x: padL + (i / (nums.length - 1)) * cW, y: padT + cH - (v / maxVal) * cH, v }));
      // Fill under line
      ctx.beginPath(); ctx.moveTo(pts[0].x, padT + cH);
      pts.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(pts[pts.length-1].x, padT + cH); ctx.closePath();
      ctx.fillStyle = color + '18'; ctx.fill();
      // Line
      ctx.beginPath(); pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
      // Dots
      pts.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, Math.PI*2); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); });
      // X labels (sparse)
      const step = Math.max(1, Math.floor(labels.length / 7));
      pts.forEach((p, i) => {
        if (i % step === 0 || i === pts.length - 1) {
          const s = String(labels[i]).length > 7 ? String(labels[i]).slice(5) : String(labels[i]);
          ctx.fillStyle = '#888'; ctx.font = '9px Arial'; ctx.textAlign = 'center';
          ctx.fillText(s, p.x, height - padB + 14);
        }
      });
    }
    return canvas.toDataURL('image/png').split(',')[1];
  } catch { return null; }
}

// ─── SHARED: EXCELJS SHEET BUILDER ────────────────────────────────────────────
async function addFormattedSheet(wb, sheetDef, period) {
  const { title, headers, rows, chart } = sheetDef;
  const ws = wb.addWorksheet(title.slice(0, 31));
  const nc = headers.length;
  ws.columns = headers.map((h, ci) => ({
    width: Math.min(Math.max(String(h).length + 4, ...rows.map(r => String(r[ci] ?? '').length + 2), 12), 42)
  }));
  const merge = (r, style) => { try { ws.mergeCells(r, 1, r, nc); } catch{} ws.getCell(r, 1).value = style.v; ws.getCell(r, 1).style = style.s; };
  merge(1, { v: title, s: { font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF185FA5' } }, alignment: { horizontal: 'center', vertical: 'middle' } } });
  ws.getRow(1).height = 30;
  merge(2, { v: period, s: { font: { italic: true, size: 11, color: { argb: 'FF333333' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F1FB' } }, alignment: { horizontal: 'center' } } });
  ws.getRow(2).height = 20;
  merge(3, { v: `Generado el ${new Date().toLocaleDateString('es-AR', { day:'2-digit', month:'2-digit', year:'numeric' })}`, s: { font: { size: 9, color: { argb: 'FF888888' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } }, alignment: { horizontal: 'center' } } });
  ws.getRow(3).height = 14; ws.getRow(4).height = 6;
  const numCols = new Set(headers.map((_, i) => typeof rows[0]?.[i] === 'number' ? i : -1).filter(i => i >= 0));
  headers.forEach((h, ci) => {
    const c = ws.getRow(5).getCell(ci + 1); c.value = h;
    c.style = { font: { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1C6EF2' } }, alignment: { horizontal: 'center', vertical: 'middle' }, border: { bottom: { style: 'medium', color: { argb: 'FF1550CC' } }, left: { style: 'thin', color: { argb: 'FF1550CC' } }, right: { style: 'thin', color: { argb: 'FF1550CC' } } } };
  });
  ws.getRow(5).height = 22;
  rows.forEach((row, ri) => {
    const exRow = ws.getRow(6 + ri);
    const bg = ri % 2 === 0 ? 'FFFFFFFF' : 'FFEFF4FF';
    row.forEach((val, ci) => {
      const c = exRow.getCell(ci + 1); c.value = val ?? '';
      const isN = numCols.has(ci);
      c.style = { font: { size: 11, color: { argb: 'FF1A1A1A' } }, fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }, alignment: { horizontal: isN ? 'right' : 'left', vertical: 'middle' }, border: { bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } }, left: { style: 'thin', color: { argb: 'FFDDDDDD' } }, right: { style: 'thin', color: { argb: 'FFDDDDDD' } } } };
      if (isN && typeof val === 'number') c.numFmt = '#,##0.00';
    });
    exRow.height = 18;
  });
  if (chart) {
    const png = chartToPng(chart.type, chart.labels, chart.values, { title: chart.title, color: chart.color });
    if (png) {
      const imgRow = 6 + rows.length + 2;
      const imgId = wb.addImage({ base64: png, extension: 'png' });
      ws.addImage(imgId, { tl: { col: 0, row: imgRow - 1 }, ext: { width: 660, height: 260 } });
      for (let r = imgRow; r < imgRow + 17; r++) ws.getRow(r).height = 15;
    }
  }
}

// ─── SHARED: EXCEL FORMATTER ──────────────────────────────────────────────────
function buildFormattedSheet(title, period, headers, rows) {
  const numericCols = new Set(headers.map((_, i) => typeof rows[0]?.[i] === "number" ? i : -1).filter(i => i >= 0));
  const aoa = [[title], [period], [`Generado el ${new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}`], [], headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const nc = headers.length;

  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: nc - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: nc - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: nc - 1 } },
  ];

  ws['!cols'] = headers.map((h, ci) => ({
    wch: Math.min(Math.max(String(h).length + 4, ...rows.map(r => String(r[ci] ?? "").length + 2), 12), 42)
  }));

  ws['!rows'] = [{ hpt: 30 }, { hpt: 20 }, { hpt: 14 }, { hpt: 6 }, { hpt: 22 }];

  const sc = (addr, s) => { if (!ws[addr]) ws[addr] = { v: "", t: "s" }; ws[addr].s = s; };

  // Title
  for (let c = 0; c < nc; c++) sc(XLSX.utils.encode_cell({ r: 0, c }), {
    font: { bold: true, sz: 14, color: { rgb: "FFFFFF" } },
    fill: { patternType: "solid", fgColor: { rgb: "185FA5" } },
    alignment: { horizontal: "center", vertical: "center" },
  });
  // Period
  for (let c = 0; c < nc; c++) sc(XLSX.utils.encode_cell({ r: 1, c }), {
    font: { italic: true, sz: 11, color: { rgb: "333333" } },
    fill: { patternType: "solid", fgColor: { rgb: "E6F1FB" } },
    alignment: { horizontal: "center" },
  });
  // Generated
  for (let c = 0; c < nc; c++) sc(XLSX.utils.encode_cell({ r: 2, c }), {
    font: { sz: 9, color: { rgb: "888888" } },
    fill: { patternType: "solid", fgColor: { rgb: "F5F5F5" } },
    alignment: { horizontal: "center" },
  });
  // Headers (row 4)
  for (let c = 0; c < nc; c++) {
    const addr = XLSX.utils.encode_cell({ r: 4, c });
    if (!ws[addr]) ws[addr] = { v: headers[c], t: "s" };
    ws[addr].s = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { patternType: "solid", fgColor: { rgb: "1C6EF2" } },
      alignment: { horizontal: "center", vertical: "center" },
      border: { bottom: { style: "medium", color: { rgb: "1550CC" } }, left: { style: "thin", color: { rgb: "1550CC" } }, right: { style: "thin", color: { rgb: "1550CC" } } },
    };
  }
  // Data rows (from row 5)
  rows.forEach((row, ri) => {
    const bg = ri % 2 === 0 ? "FFFFFF" : "EEF4FF";
    row.forEach((val, ci) => {
      const addr = XLSX.utils.encode_cell({ r: 5 + ri, c: ci });
      if (!ws[addr]) ws[addr] = { v: val ?? "", t: typeof val === "number" ? "n" : "s" };
      const isNum = numericCols.has(ci);
      ws[addr].s = {
        font: { sz: 11, color: { rgb: "1A1A1A" } },
        fill: { patternType: "solid", fgColor: { rgb: bg } },
        alignment: { horizontal: isNum ? "right" : "left", vertical: "center" },
        border: { bottom: { style: "thin", color: { rgb: "DDDDDD" } }, left: { style: "thin", color: { rgb: "DDDDDD" } }, right: { style: "thin", color: { rgb: "DDDDDD" } } },
      };
      if (isNum && typeof val === "number") ws[addr].z = '#,##0.00';
    });
  });

  return ws;
}

// ─── SHARED: QUICK DATE FILTER ────────────────────────────────────────────────
function QuickDateFilter({ setFrom, setTo, style }) {
  const hoy = new Date().toISOString().slice(0, 10);
  const apply = (preset) => {
    const d = new Date(hoy);
    if (preset === "semana") {
      const day = d.getDay(); const diff = day === 0 ? -6 : 1 - day;
      const lunes = new Date(d); lunes.setDate(d.getDate() + diff);
      setFrom(lunes.toISOString().slice(0, 10)); setTo(hoy);
    } else if (preset === "mes") {
      setFrom(hoy.slice(0, 7) + "-01");
      setTo(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10));
    } else if (preset === "6meses") {
      const s = new Date(d); s.setMonth(d.getMonth() - 6);
      setFrom(s.toISOString().slice(0, 10)); setTo(hoy);
    } else if (preset === "anio") {
      setFrom(d.getFullYear() + "-01-01"); setTo(d.getFullYear() + "-12-31");
    } else if (preset === "anio_ant") {
      const y = d.getFullYear() - 1;
      setFrom(y + "-01-01"); setTo(y + "-12-31");
    }
  };
  const s = style || { padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 12, fontFamily: "inherit", outline: "none" };
  return (
    <select value="" onChange={e => { if (e.target.value) apply(e.target.value); }} style={s}>
      <option value="">Período rápido…</option>
      <option value="semana">Esta semana</option>
      <option value="mes">Este mes</option>
      <option value="6meses">Últimos 6 meses</option>
      <option value="anio">Este año</option>
      <option value="anio_ant">Año pasado</option>
    </select>
  );
}

// Selector de banco argentino reutilizable
function BancoSelect({ value, onChange, style, placeholder = "Seleccionar banco..." }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)} style={style}>
      <option value="">{placeholder}</option>
      {BANCOS_ARGENTINA.map(b => (
        <option key={b.codigo} value={b.nombre}>{b.codigo} — {b.nombre}</option>
      ))}
    </select>
  );
}

// ─── MODULE: HUB ──────────────────────────────────────────────────────────────
function HubModule({ saleInvoices, purchaseInvoices, products, clients, suppliers, onQuickAction, tipoCambio, setTipoCambio }) {
  const thisMonth = saleInvoices.filter(i => i.date?.startsWith("2026-03") && i.type === "factura");
  const facturado = thisMonth.reduce((s, i) => s + i.total, 0);
  const pendienteCobrar = saleInvoices.filter(i => i.status === "pendiente" && i.type === "factura").reduce((s, i) => s + i.total, 0);
  const pendientePagar = purchaseInvoices.filter(i => i.status === "pendiente").reduce((s, i) => s + i.total, 0);
  const criticalStock = products.filter(p => p.tracksStock !== false && p.stock < p.minStock).length;
  const [tcInput, setTcInput] = useState(String(tipoCambio));
  const [tcEditing, setTcEditing] = useState(false);
  const [tcLoading, setTcLoading] = useState(false);
  const [tcLastFetch, setTcLastFetch] = useState(null);
  const [tcFetchError, setTcFetchError] = useState(false);

  const fetchTC = async () => {
    setTcLoading(true);
    setTcFetchError(false);
    try {
      const res = await fetch("https://api.bluelytics.com.ar/v2/latest");
      const data = await res.json();
      const venta = data.oficial?.value_sell;
      if (venta && venta > 0) {
        setTipoCambio(venta);
        setTcInput(String(venta));
        setTcLastFetch(new Date());
      }
    } catch {
      setTcFetchError(true);
    } finally {
      setTcLoading(false);
    }
  };

  useEffect(() => { fetchTC(); }, []);

  // Panel expansion
  const [expanded, setExpanded] = useState(null); // "cobros" | "pagos" | null

  // Cobros filters
  const [fCobroCliente, setFCobroCliente] = useState("");
  const [fCobroMontoMin, setFCobroMontoMin] = useState("");
  const [fCobroMontoMax, setFCobroMontoMax] = useState("");
  const [fCobroCuit, setFCobroCuit] = useState("");

  // Pagos filters
  const [fPagoProveedor, setFPagoProveedor] = useState("");
  const [fPagoMontoMin, setFPagoMontoMin] = useState("");
  const [fPagoMontoMax, setFPagoMontoMax] = useState("");

  const cobrosPendientes = saleInvoices.filter(i => i.status === "pendiente" && i.type === "factura");
  const pagosPendientes = purchaseInvoices.filter(i => i.status === "pendiente");

  const filteredCobros = cobrosPendientes.filter(inv => {
    const cli = clients.find(c => c.id === inv.clientId);
    if (fCobroCliente && !inv.clientName?.toLowerCase().includes(fCobroCliente.toLowerCase())) return false;
    if (fCobroCuit && !cli?.cuit?.toLowerCase().includes(fCobroCuit.toLowerCase())) return false;
    if (fCobroMontoMin && inv.total < parseFloat(fCobroMontoMin)) return false;
    if (fCobroMontoMax && inv.total > parseFloat(fCobroMontoMax)) return false;
    return true;
  });

  const filteredPagos = pagosPendientes.filter(inv => {
    if (fPagoProveedor && !inv.supplierName?.toLowerCase().includes(fPagoProveedor.toLowerCase())) return false;
    if (fPagoMontoMin && inv.total < parseFloat(fPagoMontoMin)) return false;
    if (fPagoMontoMax && inv.total > parseFloat(fPagoMontoMax)) return false;
    return true;
  });

  const totalCobrosFiltrados = filteredCobros.reduce((s, i) => s + i.total, 0);
  const totalPagosFiltrados = filteredPagos.reduce((s, i) => s + i.total, 0);

  const FilterInput = ({ value, onChange, placeholder }) => (
    <div style={{ position: "relative" }}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "7px 28px 7px 10px", borderRadius: 7, border: `1px solid ${value ? T.accent + "80" : T.border}`, background: T.surface2, color: T.ink, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      {value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 12 }}>✕</button>}
    </div>
  );

  // Expanded panel: COBROS
  const CobroPanel = () => (
    <div style={{ background: T.paper, border: `1px solid ${T.yellow}40`, borderRadius: 14, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setExpanded(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>←</button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Cobros pendientes</div>
            <div style={{ fontSize: 12, color: T.muted }}>{filteredCobros.length} de {cobrosPendientes.length} · Total filtrado: <span style={{ color: T.yellow, fontWeight: 700 }}>{fmt(totalCobrosFiltrados)}</span></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>
        <FilterInput value={fCobroCliente} onChange={setFCobroCliente} placeholder="🔍 Cliente..." />
        <FilterInput value={fCobroCuit} onChange={setFCobroCuit} placeholder="🔍 CUIT..." />
        <FilterInput value={fCobroMontoMin} onChange={setFCobroMontoMin} placeholder="Monto mín." />
        <FilterInput value={fCobroMontoMax} onChange={setFCobroMontoMax} placeholder="Monto máx." />
      </div>

      {/* Table */}
      <div style={{ overflowY: "auto", maxHeight: 420 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.surface, position: "sticky", top: 0 }}>
              {["N° Factura", "Cliente", "CUIT", "Fecha", "Vence", "Total", "Estado"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredCobros.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: T.muted, fontSize: 13 }}>Sin resultados para los filtros aplicados.</td></tr>
            )}
            {filteredCobros.map(inv => {
              const cli = clients.find(c => c.id === inv.clientId);
              const venceProx = inv.due && inv.due <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
              return (
                <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}`, background: venceProx ? `${T.yellow}08` : "transparent" }}>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.blue }}>{docRef(inv)}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600 }}>{inv.clientName}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: T.muted, fontFamily: "monospace" }}>{cli?.cuit || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: T.muted }}>{inv.date}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: venceProx ? T.yellow : T.muted, fontWeight: venceProx ? 700 : 400 }}>
                    {inv.due} {venceProx && "⚠"}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 14, fontWeight: 800, color: T.yellow }}>{fmt(inv.total)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ background: T.yellowLight, color: T.yellow, padding: "2px 9px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>Pendiente</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Expanded panel: PAGOS
  const PagoPanel = () => (
    <div style={{ background: T.paper, border: `1px solid ${T.orange}40`, borderRadius: 14, overflow: "hidden" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setExpanded(null)} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0 }}>←</button>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>Pagos pendientes</div>
            <div style={{ fontSize: 12, color: T.muted }}>{filteredPagos.length} de {pagosPendientes.length} · Total filtrado: <span style={{ color: T.orange, fontWeight: 700 }}>{fmt(totalPagosFiltrados)}</span></div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>
        <FilterInput value={fPagoProveedor} onChange={setFPagoProveedor} placeholder="🔍 Proveedor..." />
        <FilterInput value={fPagoMontoMin} onChange={setFPagoMontoMin} placeholder="Monto mín." />
        <FilterInput value={fPagoMontoMax} onChange={setFPagoMontoMax} placeholder="Monto máx." />
      </div>

      {/* Table */}
      <div style={{ overflowY: "auto", maxHeight: 420 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.surface, position: "sticky", top: 0 }}>
              {["N° OC", "N° Factura Prov.", "Proveedor", "Fecha", "Vence", "Total", "Estado"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPagos.length === 0 && (
              <tr><td colSpan={7} style={{ padding: "24px", textAlign: "center", color: T.muted, fontSize: 13 }}>Sin resultados para los filtros aplicados.</td></tr>
            )}
            {filteredPagos.map(inv => {
              const sup = suppliers.find(s => s.id === inv.supplierId);
              const venceProx = inv.dueDate && inv.dueDate <= new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
              return (
                <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}`, background: venceProx ? `${T.orange}08` : "transparent" }}>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.orange }}>{docRef(inv)}</td>
                  <td style={{ padding: "11px 14px", fontFamily: "monospace", fontSize: 12, color: T.muted }}>{inv.nroFactura || "—"}</td>
                  <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 600 }}>{inv.supplierName}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: T.muted }}>{inv.date}</td>
                  <td style={{ padding: "11px 14px", fontSize: 12, color: venceProx ? T.orange : T.muted, fontWeight: venceProx ? 700 : 400 }}>
                    {inv.dueDate} {venceProx && "⚠"}
                  </td>
                  <td style={{ padding: "11px 14px", fontSize: 14, fontWeight: 800, color: T.orange }}>{fmt(inv.total)}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{ background: T.orangeLight, color: T.orange, padding: "2px 9px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>Pendiente</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ color: T.muted, fontSize: 13 }}>{new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</div>
      </div>

      {/* Tipo de cambio */}
      <div style={{ background: T.paper, border: `1px solid ${tcFetchError ? T.orange + "60" : T.border}`, borderRadius: 12, padding: "14px 20px", marginBottom: 20, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>🇺🇸</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1 }}>TIPO DE CAMBIO DEL DÍA</div>
            <div style={{ fontSize: 11, color: T.faint }}>
              {tcFetchError ? "Error al obtener cotización · valor manual" : "Dólar oficial BNA vendedor · Bluelytics"}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: T.muted, fontWeight: 700 }}>US$ 1 =</span>
          {tcEditing ? (
            <input type="number" value={tcInput} onChange={e => setTcInput(e.target.value)} autoFocus
              onBlur={() => { const v = parseFloat(tcInput); if (v > 0) setTipoCambio(v); setTcEditing(false); }}
              onKeyDown={e => { if (e.key === "Enter") { const v = parseFloat(tcInput); if (v > 0) setTipoCambio(v); setTcEditing(false); } if (e.key === "Escape") setTcEditing(false); }}
              style={{ width: 120, padding: "6px 10px", borderRadius: 7, border: `1px solid ${T.accent}`, background: T.surface, color: T.ink, fontSize: 16, fontFamily: "monospace", fontWeight: 800, outline: "none" }} />
          ) : (
            <button onClick={() => { setTcInput(String(tipoCambio)); setTcEditing(true); }}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 16, fontWeight: 800, color: T.blue, fontFamily: "monospace", cursor: "pointer" }}>
              {tcLoading ? "..." : fmt(tipoCambio)}
            </button>
          )}
          {!tcEditing && <span style={{ fontSize: 11, color: T.muted }}>· click para editar</span>}
        </div>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
          {tcLastFetch && !tcFetchError && (
            <span style={{ fontSize: 11, color: T.muted }}>
              Actualizado: {tcLastFetch.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {tcFetchError && (
            <span style={{ fontSize: 11, color: T.orange }}>Sin conexión</span>
          )}
          <button
            onClick={fetchTC}
            disabled={tcLoading}
            style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: tcLoading ? T.muted : T.ink, cursor: tcLoading ? "default" : "pointer", fontFamily: "inherit" }}>
            {tcLoading ? "Actualizando..." : "↻ Actualizar"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
        {[
          { label: "Facturado este mes", value: fmt(facturado), sub: `${thisMonth.length} facturas`, color: T.accent, icon: "◈", action: null },
          { label: "A cobrar", value: fmt(pendienteCobrar), sub: `${cobrosPendientes.length} facturas · click para ver`, color: T.yellow, icon: "⏳", action: "cobros" },
          { label: "A pagar", value: fmt(pendientePagar), sub: `${pagosPendientes.length} facturas · click para ver`, color: T.orange, icon: "📤", action: "pagos" },
          { label: "Stock crítico", value: `${criticalStock} items`, sub: "Por debajo del mínimo", color: criticalStock > 0 ? T.red : T.accent, icon: "▦", action: null },
        ].map((k, i) => (
          <div key={i} onClick={() => k.action && setExpanded(k.action)}
            style={{ background: T.paper, border: `1px solid ${expanded === k.action && k.action ? k.color + "60" : T.border}`, borderRadius: 14, padding: "20px 22px", cursor: k.action ? "pointer" : "default", transition: "border-color 0.2s, transform 0.15s" }}
            onMouseEnter={e => k.action && (e.currentTarget.style.transform = "translateY(-2px)")}
            onMouseLeave={e => k.action && (e.currentTarget.style.transform = "translateY(0)")}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{k.label.toUpperCase()}</span>
              <span style={{ fontSize: 18, opacity: 0.4 }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: T.muted }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Acciones rápidas */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 14 }}>ACCESO RÁPIDO</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {[
            { label: "Nueva Factura", icon: "📄", action: "new_factura", color: T.blue, bg: T.blueLight },
            { label: "Nuevo Presupuesto", icon: "📋", action: "new_presupuesto", color: T.purple, bg: T.purpleLight },
            { label: "Nuevo Remito", icon: "📦", action: "new_remito", color: T.orange, bg: T.orangeLight },
            { label: "Registrar Pago", icon: "💳", action: "new_pago", color: T.accent, bg: T.accentLight },
          ].map(a => (
            <button key={a.action} onClick={() => onQuickAction(a.action)}
              style={{ background: a.bg, border: `1px solid ${a.color}30`, borderRadius: 12, padding: "18px 16px", cursor: "pointer", textAlign: "left", transition: "transform 0.1s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"}
              onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>{a.icon}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: a.color }}>{a.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      {expanded === "cobros" && <CobroPanel />}
      {expanded === "pagos" && <PagoPanel />}

      {/* Vista resumida (cuando no hay ninguno expandido) */}
      {!expanded && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Cobros */}
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: 1 }}>COBROS PENDIENTES</div>
              <button onClick={() => setExpanded("cobros")}
                style={{ background: T.yellowLight, color: T.yellow, border: "none", borderRadius: 7, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Ver todos →
              </button>
            </div>
            {cobrosPendientes.slice(0, 4).map(inv => (
              <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}
                onClick={() => setExpanded("cobros")}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{inv.clientName}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Vence {inv.due}</div>
                </div>
                <div style={{ fontWeight: 800, color: T.yellow }}>{fmt(inv.total)}</div>
              </div>
            ))}
            {cobrosPendientes.length === 0 && <div style={{ fontSize: 13, color: T.muted, padding: "10px 0" }}>Sin cobros pendientes.</div>}
          </div>

          {/* Pagos */}
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: 1 }}>PAGOS PENDIENTES</div>
              <button onClick={() => setExpanded("pagos")}
                style={{ background: T.orangeLight, color: T.orange, border: "none", borderRadius: 7, padding: "4px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                Ver todos →
              </button>
            </div>
            {pagosPendientes.slice(0, 4).map(inv => (
              <div key={inv.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}
                onClick={() => setExpanded("pagos")}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{inv.supplierName}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>Vence {inv.dueDate}</div>
                </div>
                <div style={{ fontWeight: 800, color: T.orange }}>{fmt(inv.total)}</div>
              </div>
            ))}
            {pagosPendientes.length === 0 && <div style={{ fontSize: 13, color: T.muted, padding: "10px 0" }}>Sin pagos pendientes.</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VENDEDORES TAB ───────────────────────────────────────────────────────────
const EMPTY_VENDEDOR = { codigo: "", nombre: "", comision: "" };

function VendedoresTab({ vendedores, setVendedores, saleInvoices }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_VENDEDOR);
  const [editingId, setEditingId] = useState(null);

  const facturas = saleInvoices.filter(i => i.type === "factura");

  const ventasPorVendedor = (vid) =>
    facturas.filter(i => i.vendedor === vid).reduce((s, i) => s + i.total, 0);

  const openNew = () => { setForm(EMPTY_VENDEDOR); setEditingId(null); setShowForm(true); };
  const openEdit = (v) => { setForm({ codigo: v.codigo, nombre: v.nombre, comision: String(v.comision) }); setEditingId(v.id); setShowForm(true); };

  const save = () => {
    if (!form.codigo.trim() || !form.nombre.trim()) return;
    if (editingId) {
      setVendedores(prev => prev.map(v => v.id === editingId ? { ...v, ...form, comision: parseFloat(form.comision) || 0 } : v));
    } else {
      setVendedores(prev => [...prev, { id: "vend-" + Date.now(), ...form, comision: parseFloat(form.comision) || 0 }]);
    }
    setShowForm(false); setEditingId(null); setForm(EMPTY_VENDEDOR);
  };

  const remove = (id) => setVendedores(prev => prev.filter(v => v.id !== id));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>Vendedores</div>
        <Btn sm onClick={openNew}>+ Nuevo vendedor</Btn>
      </div>

      {showForm && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 14 }}>{editingId ? "Editar vendedor" : "Nuevo vendedor"}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12, marginBottom: 14 }}>
            <Input label="CÓDIGO" value={form.codigo} onChange={v => setForm(f => ({ ...f, codigo: v }))} placeholder="V001" />
            <Input label="NOMBRE COMPLETO" value={form.nombre} onChange={v => setForm(f => ({ ...f, nombre: v }))} placeholder="Juan Pérez" />
            <Input label="COMISIÓN %" type="number" value={form.comision} onChange={v => setForm(f => ({ ...f, comision: v }))} placeholder="5" />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Btn v="ghost" sm onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Btn>
            <Btn sm disabled={!form.codigo.trim() || !form.nombre.trim()} onClick={save}>Guardar</Btn>
          </div>
        </div>
      )}

      {vendedores.length === 0 ? (
        <div style={{ background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 12, padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>
          No hay vendedores cargados.<br />Agregá vendedores para asignarlos a facturas, presupuestos y remitos.
        </div>
      ) : (
        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: T.surface }}>
                {["Código", "Nombre", "Comisión", "Ventas asignadas", "Comisión estimada", ""].map(h => (
                  <th key={h} style={{ padding: "11px 16px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vendedores.map(v => {
                const ventas = ventasPorVendedor(v.id);
                const comisionEstimada = ventas * (v.comision / 100);
                return (
                  <tr key={v.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.accent }}>{v.codigo}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: T.ink }}>{v.nombre}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ background: T.accentLight, color: T.accent, padding: "3px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{v.comision}%</span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700 }}>{fmt(ventas)}</td>
                    <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: T.accent }}>{fmt(comisionEstimada)}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn sm v="ghost" onClick={() => openEdit(v)}>Editar</Btn>
                        <Btn sm v="ghost" onClick={() => remove(v.id)}>Eliminar</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── POS IMPORT MODAL ─────────────────────────────────────────────────────────
function POSImportModal({ companyId, onImport, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);

  const loadTickets = async (from, to) => {
    setLoading(true);
    setSelectedIds([]);
    const { data } = await supabase.from('pos_tickets')
      .select('*').eq('company_id', companyId).neq('estado', 'anulado').eq('facturado', false)
      .gte('fecha', from).lte('fecha', to).order('created_at', { ascending: false });
    if (data) setTickets(data);
    setLoading(false);
  };

  useEffect(() => { loadTickets(dateFrom, dateTo); }, []);

  const toggle = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleAll = () => setSelectedIds(selectedIds.length === tickets.length ? [] : tickets.map(t => t.id));

  const buildPreload = () => {
    const selected = tickets.filter(t => selectedIds.includes(t.id));
    const lineMap = {};
    for (const ticket of selected) {
      for (const l of (ticket.lines || [])) {
        const key = l.productId || l.nombre;
        const iva = l.iva ?? 21;
        const unitNeto = l.precio / (1 + iva / 100);
        if (lineMap[key]) {
          const e = lineMap[key];
          const qty = e.qty + l.qty;
          const neto = qty * e.unitPrice;
          const ivaImporte = neto * iva / 100;
          lineMap[key] = { ...e, qty, neto, ivaImporte, subtotal: neto + ivaImporte };
        } else {
          const neto = l.qty * unitNeto;
          const ivaImporte = neto * iva / 100;
          lineMap[key] = { productId: l.productId || null, name: l.nombre, sku: l.sku || '', qty: l.qty, unitPrice: unitNeto, listPrice: unitNeto, isManualPrice: true, source: 'pos', unit: l.unit || 'unidad', iva, neto, ivaImporte, subtotal: neto + ivaImporte };
        }
      }
    }
    const dates = selected.map(t => t.fecha).sort();
    const obs = `Consolidado de ${selected.length} ticket(s) POS · ${dates[0]}${dates[0] !== dates[dates.length - 1] ? ' al ' + dates[dates.length - 1] : ''}`;
    onImport({ lines: Object.values(lineMap), moneda: 'ARS', modificaStock: false, observaciones: obs, posTicketIds: selectedIds });
  };

  const fmtAR = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n || 0);
  const totalSel = tickets.filter(t => selectedIds.includes(t.id)).reduce((s, t) => s + (t.total || 0), 0);

  return (
    <Modal title="Facturar desde POS" onClose={onClose} wide>
      {/* Filtro de fechas */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "flex-end" }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>DESDE</label>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>HASTA</label>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
        </div>
        <Btn onClick={() => loadTickets(dateFrom, dateTo)}>Buscar</Btn>
      </div>

      {loading ? (
        <div style={{ padding: "32px", textAlign: "center", color: T.muted }}>Cargando tickets…</div>
      ) : tickets.length === 0 ? (
        <div style={{ padding: "32px", textAlign: "center", color: T.muted, background: T.surface, borderRadius: 12, border: `1px dashed ${T.border}` }}>
          Sin tickets sin facturar en el rango seleccionado.
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 13, color: T.muted }}>{tickets.length} ticket(s) disponibles · {selectedIds.length} seleccionados</div>
            <button onClick={toggleAll} style={{ background: "none", border: "none", color: T.blue, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
              {selectedIds.length === tickets.length ? "Deseleccionar todo" : "Seleccionar todo"}
            </button>
          </div>

          <div style={{ display: "grid", gap: 8, maxHeight: 380, overflowY: "auto", marginBottom: 16 }}>
            {tickets.map(t => {
              const isSel = selectedIds.includes(t.id);
              return (
                <div key={t.id} onClick={() => toggle(t.id)}
                  style={{ background: isSel ? T.accentLight : T.surface, border: `2px solid ${isSel ? T.accent : T.border}`, borderRadius: 10, padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSel ? T.accent : T.border}`, background: isSel ? T.accent : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {isSel && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 3 }}>
                      <span style={{ fontFamily: "monospace", fontWeight: 700, color: T.accent, fontSize: 12 }}>{t.numero}</span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtAR(t.total)}</span>
                      <span style={{ fontSize: 11, color: T.muted }}>{t.fecha} · {t.cajero_nombre}</span>
                    </div>
                    <div style={{ fontSize: 11, color: T.muted }}>
                      {(t.lines || []).slice(0, 4).map((l, i) => <span key={i} style={{ background: T.surface2, padding: "1px 7px", borderRadius: 5, marginRight: 4 }}>{l.nombre} ×{l.qty}</span>)}
                      {(t.lines || []).length > 4 && <span style={{ color: T.muted }}>+{t.lines.length - 4} más</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {selectedIds.length > 0 && (
        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: T.muted }}>Total seleccionado</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.accent }}>{fmtAR(totalSel)}</div>
          </div>
          <Btn onClick={buildPreload}>Generar factura →</Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── MODULE: VENTAS ───────────────────────────────────────────────────────────
// ─── EMAIL DOC MODAL ──────────────────────────────────────────────────────────
function EmailDocModal({ inv, clients, products, onClose }) {
  const client = clients.find(c => c.id === inv.clientId);
  const typeLabel = inv.type === "factura" ? "Factura" : inv.type === "remito" ? "Remito" : "Presupuesto";
  const [toExtra, setToExtra] = useState("");
  const [subject, setSubject] = useState(`${typeLabel} ${docRef(inv)} — ${inv.clientName}`);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // "ok" | "error: ..."

  const buildHtml = () => {
    const linesHtml = (inv.lines || []).map(l => {
      const prod = products.find(p => p.id === l.productId);
      const ivaRate = prod?.iva ?? 21;
      const ivaAmt = l.subtotal * ivaRate / 100;
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px">${l.clientCode || l.sku || "—"}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px">${l.name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${l.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right">${fmt(l.unitPrice)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right">${fmt(l.subtotal)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;font-size:12px;text-align:right;color:#666">${ivaRate}% (${fmt(ivaAmt)})</td>
      </tr>`;
    }).join("");
    const totalIva = (inv.lines || []).reduce((s, l) => {
      const prod = products.find(p => p.id === l.productId);
      return s + l.subtotal * (prod?.iva ?? 21) / 100;
    }, 0);
    const totalConIva = inv.total + totalIva;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;color:#222;max-width:700px;margin:0 auto;padding:24px">
  <div style="background:#0d1117;color:#fff;padding:18px 24px;border-radius:10px 10px 0 0;display:flex;align-items:center;gap:12px">
    <span style="font-size:20px;font-weight:800;letter-spacing:-0.5px">NexoPyme</span>
    <span style="margin-left:auto;background:#238636;color:#fff;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700">${typeLabel.toUpperCase()}</span>
  </div>
  <div style="border:1px solid #e0e0e0;border-top:none;border-radius:0 0 10px 10px;padding:24px">
    <div style="display:flex;justify-content:space-between;margin-bottom:20px">
      <div>
        <div style="font-size:22px;font-weight:800;margin-bottom:4px">${typeLabel} ${docRef(inv)}</div>
        ${inv.nroFactura ? `<div style="font-size:12px;color:#666">N° ${inv.nroFactura}</div>` : ""}
        ${inv.cae ? `<div style="font-size:11px;color:#238636;margin-top:2px">✓ CAE: ${inv.cae}</div>` : ""}
      </div>
      <div style="text-align:right;font-size:13px;color:#444">
        <div><strong>Fecha:</strong> ${inv.date}</div>
        ${inv.due && inv.due !== inv.date ? `<div><strong>Vence:</strong> ${inv.due}</div>` : ""}
      </div>
    </div>
    <div style="background:#f8f9fa;border-radius:8px;padding:14px 16px;margin-bottom:20px">
      <div style="font-size:11px;color:#888;font-weight:700;letter-spacing:1px;margin-bottom:6px">CLIENTE</div>
      <div style="font-size:15px;font-weight:700">${client?.name || inv.clientName}</div>
      ${client?.cuit ? `<div style="font-size:13px;color:#555">CUIT: ${client.cuit}</div>` : ""}
      ${client?.direccion ? `<div style="font-size:13px;color:#555">${client.direccion}</div>` : ""}
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead>
        <tr style="background:#f5f5f5">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#666">CÓDIGO</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#666">DESCRIPCIÓN</th>
          <th style="padding:8px 12px;text-align:center;font-size:11px;color:#666">CANT.</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#666">PRECIO UNIT.</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#666">SUBTOTAL</th>
          <th style="padding:8px 12px;text-align:right;font-size:11px;color:#666">IVA</th>
        </tr>
      </thead>
      <tbody>${linesHtml}</tbody>
    </table>
    <div style="text-align:right;border-top:2px solid #eee;padding-top:12px">
      <div style="font-size:13px;color:#666;margin-bottom:4px">Neto: <strong>${fmt(inv.total)}</strong></div>
      <div style="font-size:13px;color:#666;margin-bottom:4px">IVA: <strong>${fmt(totalIva)}</strong></div>
      <div style="font-size:22px;font-weight:800">TOTAL: ${fmt(totalConIva)}</div>
    </div>
    ${inv.observaciones ? `<div style="margin-top:16px;padding:12px 14px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:4px;font-size:13px;color:#555"><strong>Observaciones:</strong> ${inv.observaciones}</div>` : ""}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center">
      Este documento fue generado por <strong>NexoPyme</strong>. Ante cualquier consulta respondé este correo.
    </div>
  </div>
</body></html>`;
  };

  const handleSend = async () => {
    const primaryEmail = client?.email || "";
    const extras = toExtra.split(",").map(e => e.trim()).filter(Boolean);
    const allEmails = [...(primaryEmail ? [primaryEmail] : []), ...extras];
    if (allEmails.length === 0) { setResult("error: No hay ningún correo destinatario"); return; }
    setSending(true); setResult(null);
    try {
      const r = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: allEmails.join(","), subject, html: buildHtml() })
      });
      const data = await r.json();
      setResult(data.ok ? "ok" : "error: " + (data.error || "Error desconocido"));
    } catch (e) {
      setResult("error: " + e.message);
    }
    setSending(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 520, maxWidth: "95vw" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>✉ Enviar por email</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>{`${inv.type === "factura" ? "Factura" : inv.type === "remito" ? "Remito" : "Presupuesto"} ${docRef(inv)} — ${inv.clientName}`}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>

        {/* Destinatario principal */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 6 }}>DESTINATARIO PRINCIPAL (email registrado del cliente)</label>
          <div style={{ padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: client?.email ? T.ink : T.red, fontSize: 13, fontFamily: "monospace" }}>
            {client?.email || "⚠ Este cliente no tiene email registrado"}
          </div>
        </div>

        {/* CC extras */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 6 }}>CORREOS ADICIONALES (separados por coma)</label>
          <input value={toExtra} onChange={e => setToExtra(e.target.value)} placeholder="otro@mail.com, copia@mail.com"
            style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Asunto */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 6 }}>ASUNTO</label>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
        </div>

        {/* Resultado */}
        {result === "ok" && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: T.accentLight, color: T.accent, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            ✓ Email enviado correctamente
          </div>
        )}
        {result && result.startsWith("error") && (
          <div style={{ padding: "10px 14px", borderRadius: 8, background: T.redLight, color: T.red, fontSize: 13, fontWeight: 600, marginBottom: 14 }}>
            {result}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Btn v="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn onClick={handleSend} disabled={sending || (!client?.email && !toExtra.trim())}>
            {sending ? "Enviando…" : "Enviar email"}
          </Btn>
        </div>
      </div>
    </div>
  );
}

function VentasModule({ saleInvoices, setSaleInvoices, clients, setClients, products, setProducts, vendedores, setVendedores, companyId, profile, cheques, setCheques, cajas, cajaMovimientos, setCajaMovimientos, onNewFactura, onNewRemito, onNewPresupuesto, onNewPresupuestoIA, onEditDoc, onNewFacturaFromPOS }) {
  const [tab, setTab] = useState("docs");
  const [filterType, setFilterType] = useState("all");
  const [searchDocNum, setSearchDocNum] = useState("");
  const [searchDocClient, setSearchDocClient] = useState("");
  const [searchDocDateFrom, setSearchDocDateFrom] = useState("");
  const [searchDocDateTo, setSearchDocDateTo] = useState("");
  const [searchClientName, setSearchClientName] = useState("");
  const [searchClientCuit, setSearchClientCuit] = useState("");
  const [newClient, setNewClient] = useState(null);
  const [ncForm, setNcForm] = useState({ codigo: "", name: "", cuit: "", direccion: "", email: "", phone: "", horarioAbre: "", horarioCierra: "", diasDisponibles: "Lun-Vie" });
  const [payingInv, setPayingInv] = useState(null);
  const [payForm, setPayForm] = useState({ metodo: "efectivo", referencia: "", bancoTransferencia: "", nroCheque: "", bancoEmisor: "", fechaPago: "", fechaVenc: "", emisorCheque: "", fechaEndoso: "" });
  const [viewingInv, setViewingInv] = useState(null);
  const [showPOSImport, setShowPOSImport] = useState(false);
  const [emailingDoc, setEmailingDoc] = useState(null);

  // ── IA Presupuesto rápido ────────────────────────────────────────────────
  const [showIAModal, setShowIAModal] = useState(false);
  const [iaStep, setIaStep] = useState("input"); // "input"|"loading"|"clarify"|"review"
  const [iaText, setIaText] = useState("");
  const [iaPdfData, setIaPdfData] = useState(null);
  const [iaResult, setIaResult] = useState(null);
  const [iaClarifyAnswers, setIaClarifyAnswers] = useState({}); // { questionIdx: answer }
  const [iaObs, setIaObs] = useState("");
  const [iaError, setIaError] = useState("");

  const resetIA = () => { setIaStep("input"); setIaText(""); setIaPdfData(null); setIaResult(null); setIaClarifyAnswers({}); setIaObs(""); setIaError(""); };

  const handleIaPdf = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setIaPdfData({ base64: ev.target.result.split(",")[1], name: file.name });
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const buildUserContent = (extraText) => {
    const clientList = clients.map(c => c.codigo + " | " + c.name).join("\n");
    const productList = products.map(p => p.sku + " | " + p.name + " | $" + (p.prices?.lista_a || 0)).join("\n");
    const content = [];
    if (iaPdfData) content.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: iaPdfData.base64 } });
    content.push({ type: "text", text: (iaText ? "Mensaje/pedido:\n" + iaText + "\n\n" : "") + (extraText || "") + "Clientes del sistema:\n" + clientList + "\n\nProductos del sistema (SKU | Nombre | Precio):\n" + productList });
    return content;
  };

  const IA_SYSTEM = `Sos un asistente de una PyME argentina que interpreta pedidos y los convierte en presupuestos.
Tu objetivo es identificar: cliente, productos con SKU exacto del catálogo, cantidades, precios y moneda.

REGLAS MUY IMPORTANTES:
- Intentá hacer coincidir cada producto mencionado con alguno del catálogo usando sinónimos, abreviaciones o descripciones parciales. Ej: "látex blanca 20" puede ser "Pintura látex blanca 20L".
- Si después de intentar no podés identificar un producto con certeza razonable, formulá una pregunta clara al usuario.
- Si no identificás al cliente, preguntá.
- NUNCA inventés un producto que no esté en el catálogo. Si no coincide, preguntá.
- Si todo está claro, pasá directo al resultado final.

Respondé SOLO con JSON sin backticks, en uno de estos dos formatos:

Formato A — hay dudas, necesitás aclaraciones:
{
  "status": "clarify",
  "preguntas": [
    { "id": "p1", "texto": "¿A qué cliente es este pedido?", "tipo": "cliente", "opciones": null },
    { "id": "p2", "texto": "¿Cuál de estos productos es 'látex blanca'?", "tipo": "producto", "itemOriginal": "látex blanca", "opciones": ["PIN-001 | Pintura látex blanca 20L", "PIN-002 | Pintura látex blanca 4L"] }
  ]
}

Formato B — todo claro, presupuesto listo:
{
  "status": "ready",
  "clientId": "id o null",
  "clientName": "nombre detectado o null",
  "moneda": "ARS o USD",
  "lines": [
    { "sku": "SKU exacto del catálogo", "name": "nombre del catálogo", "qty": 2, "unitPrice": null }
  ],
  "obsRecomendadas": ["Validez: 15 días.", "Plazo de entrega: 3 días hábiles."]
}

Para preguntas de tipo "cliente": opciones null (el usuario elige del dropdown).
Para preguntas de tipo "producto": opciones = array con los candidatos del catálogo.
Para preguntas de tipo "general": opciones = array de opciones posibles o null para respuesta libre.`;

  const runIA = async () => {
    if (!iaText.trim() && !iaPdfData) return;
    setIaStep("loading"); setIaError("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: IA_SYSTEM,
          messages: [{ role: "user", content: buildUserContent("") }] })
      });
      const data = await res.json();
      const parsed = JSON.parse((data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim());
      if (parsed.status === "clarify") {
        setIaResult(parsed);
        setIaClarifyAnswers({});
        setIaStep("clarify");
      } else {
        setIaResult(parsed);
        setIaObs(parsed.obsRecomendadas?.[0] || "");
        setIaStep("review");
      }
    } catch { setIaError("No se pudo interpretar. Intentá de nuevo."); setIaStep("input"); }
  };

  const runIAWithAnswers = async () => {
    setIaStep("loading"); setIaError("");
    try {
      const answersText = (iaResult.preguntas || []).map(q => {
        const ans = iaClarifyAnswers[q.id] || "(sin respuesta)";
        return "Pregunta: " + q.texto + "\nRespuesta: " + ans;
      }).join("\n\n");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, system: IA_SYSTEM,
          messages: [
            { role: "user", content: buildUserContent("") },
            { role: "assistant", content: JSON.stringify(iaResult) },
            { role: "user", content: "Respuestas a tus preguntas:\n\n" + answersText + "\n\nCon esta información, generá el presupuesto final en formato B (status: ready)." }
          ] })
      });
      const data = await res.json();
      const parsed = JSON.parse((data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim());
      if (parsed.status === "clarify") {
        // Todavía tiene preguntas — mostrarlas de nuevo
        setIaResult(parsed); setIaClarifyAnswers({}); setIaStep("clarify");
      } else {
        setIaResult(parsed);
        setIaObs(parsed.obsRecomendadas?.[0] || "");
        setIaStep("review");
      }
    } catch { setIaError("Error al procesar las respuestas."); setIaStep("clarify"); }
  };

  const confirmarPresupuesto = () => {
    if (!iaResult) return;
    const builtLines = (iaResult.lines || []).map(l => {
      const prod = products.find(p => p.sku === l.sku);
      const unitPrice = l.unitPrice || prod?.prices?.lista_a || 0;
      const iva = prod?.iva ?? 21;
      const qty = l.qty || 1;
      const neto = qty * unitPrice;
      const ivaImporte = Math.round(neto * iva) / 100;
      return {
        productId: prod?.id || null,
        clientCode: prod?.sku || l.sku || l.name,
        name: prod?.name || l.name,
        sku: prod?.sku || l.sku || "",
        qty, unitPrice, listPrice: unitPrice,
        source: "Lista A",
        unit: prod?.unit || "unidad",
        iva, neto, ivaImporte, subtotal: neto + ivaImporte,
      };
    });
    const clientId = iaResult.clientId || clients.find(c => c.name?.toLowerCase().includes((iaResult.clientName || "___").toLowerCase()))?.id || "";
    onNewPresupuestoIA({ clientId, moneda: iaResult.moneda || "ARS", modificaStock: false, lines: builtLines, observaciones: iaObs });
    setShowIAModal(false); resetIA();
  };

  const filtered = saleInvoices.filter(i => {
    if (filterType !== "all" && i.type !== filterType) return false;
    if (searchDocNum && !i.id?.toLowerCase().includes(searchDocNum.toLowerCase()) && !i.ref?.toLowerCase().includes(searchDocNum.toLowerCase())) return false;
    if (searchDocClient && !i.clientName?.toLowerCase().includes(searchDocClient.toLowerCase())) return false;
    if (searchDocDateFrom && i.date < searchDocDateFrom) return false;
    if (searchDocDateTo && i.date > searchDocDateTo) return false;
    return true;
  });

  const filteredClients = clients.filter(c => {
    if (searchClientName && !c.name?.toLowerCase().includes(searchClientName.toLowerCase()) && !c.codigo?.toLowerCase().includes(searchClientName.toLowerCase())) return false;
    if (searchClientCuit && !c.cuit?.toLowerCase().includes(searchClientCuit.toLowerCase())) return false;
    return true;
  });

  const openPayModal = (inv) => { const today = new Date().toISOString().slice(0,10); setPayingInv(inv); setPayForm({ metodo: "efectivo", referencia: "", bancoTransferencia: "", nroCheque: "", bancoEmisor: "", fechaPago: today, fechaVenc: "", emisorCheque: inv.clientName || "", fechaEndoso: today }); };

  const [arcaLoading, setArcaLoading] = useState(null); // invoice id en proceso
  const emitirARCA = async (inv) => {
    if (!companyId) return alert("Sin empresa configurada.");
    setArcaLoading(inv.id);
    try {
      // 1. Obtener / refrescar token
      const tokRes = await fetch("/api/arca-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId })
      });
      const tokData = await tokRes.json();
      if (!tokRes.ok) { alert("Error ARCA (token): " + tokData.error); return; }

      // 2. Emitir comprobante
      const emitRes = await fetch("/api/arca-emitir", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company_id: companyId, invoice_id: inv.id })
      });
      const emitData = await emitRes.json();
      if (!emitRes.ok) { alert("Error ARCA: " + emitData.error); return; }

      // 3. Actualizar estado local
      setSaleInvoices(prev => prev.map(i => i.id === inv.id
        ? { ...i, cae: emitData.cae, caeVto: emitData.caeVto, arcaNumero: emitData.numero }
        : i
      ));
      alert(`✓ CAE obtenido: ${emitData.cae}\nVence: ${emitData.caeVto}`);
    } catch (e) {
      alert("Error inesperado: " + e.message);
    } finally {
      setArcaLoading(null);
    }
  };
  const confirmPayVenta = () => {
    if (!payingInv) return;
    const pf = payForm;
    if ((pf.metodo === "cheque_propio" || pf.metodo === "cheque_tercero") && (!pf.nroCheque || !pf.bancoEmisor || !pf.fechaPago || !pf.fechaVenc)) { alert("Completá todos los campos del cheque."); return; }
    if (pf.metodo === "cheque_tercero" && (!pf.emisorCheque || !pf.fechaEndoso)) { alert("Completá el emisor y la fecha de endoso."); return; }
    const metodoPagoStr = pf.metodo === "efectivo" ? "Efectivo" : pf.metodo === "debito" ? "Tarjeta de débito" : pf.metodo === "credito" ? "Tarjeta de crédito" : pf.metodo === "transferencia" ? ("Transferencia" + (pf.bancoTransferencia ? " — " + pf.bancoTransferencia : "") + (pf.referencia ? " — N°" + pf.referencia : "")) : pf.metodo === "cheque_propio" ? ("Cheque propio N°" + pf.nroCheque + " — " + pf.bancoEmisor) : ("Cheque de tercero N°" + pf.nroCheque + " — " + pf.bancoEmisor + " — Emisor: " + pf.emisorCheque + " — Endosado: " + pf.fechaEndoso);
    setSaleInvoices(prev => prev.map(i => i.id === payingInv.id ? { ...i, status: "cobrada", metodoPago: metodoPagoStr } : i));
    if (companyId) supabase.from('sale_invoices').update({ status: 'cobrada', metodo_pago: metodoPagoStr }).eq('id', payingInv.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    if (pf.metodo === "cheque_propio" || pf.metodo === "cheque_tercero") {
      const nc = { id: crypto.randomUUID(), tipo: "cobrar", numero: pf.nroCheque, fechaPago: pf.fechaPago, fechaVencimiento: pf.fechaVenc, monto: payingInv.total, emisor: pf.metodo === "cheque_tercero" ? pf.emisorCheque : payingInv.clientName, estado: "pendiente" };
      setCheques(prev => [...prev, nc]);
      if (companyId) supabase.from('cheques').insert({ id: nc.id, company_id: companyId, tipo: nc.tipo, numero: nc.numero, fecha_pago: nc.fechaPago, fecha_vencimiento: nc.fechaVencimiento, monto: nc.monto, emisor: nc.emisor, estado: nc.estado }).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    }
    if (pf.metodo === "efectivo") {
      const cajasDelDia = (cajas || []).filter(c => String(c.date).slice(0,10) === pf.fechaPago);
      const caja = cajasDelDia.find(c => c.estado === "abierta") || cajasDelDia[cajasDelDia.length - 1];
      if (caja) {
        const mov = { id: crypto.randomUUID(), cajaId: caja.id, tipo: "ingreso", monto: payingInv.total, fecha: pf.fechaPago, hora: new Date().toTimeString().slice(0,5), motivo: "Cobro " + (payingInv.ref || "") + " — " + payingInv.clientName, empleadoId: null, observaciones: "", origen: "venta", origenId: payingInv.id };
        setCajaMovimientos(prev => [...prev, mov]);
        if (companyId) supabase.from('caja_movimientos').insert(cajaMovimientoToDb(mov, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
      }
    }
    setPayingInv(null);
  };
  const markCobrada = (id) => { setSaleInvoices(saleInvoices.map(i => i.id === id ? { ...i, status: "cobrada" } : i)); if (companyId) supabase.from('sale_invoices').update({ status: 'cobrada' }).eq('id', id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }); };
  const unmarkCobrada = (id) => {
    setSaleInvoices(saleInvoices.map(i => i.id === id ? { ...i, status: "pendiente", metodoPago: "" } : i));
    if (companyId) supabase.from('sale_invoices').update({ status: 'pendiente', metodo_pago: null }).eq('id', id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    const mov = cajaMovimientos.find(m => m.origenId === id && m.origen === "venta");
    if (mov) {
      setCajaMovimientos(prev => prev.filter(m => m.id !== mov.id));
      if (companyId) supabase.from('caja_movimientos').delete().eq('id', mov.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    }
  };

  const eliminarPresupuesto = (id) => {
    const tieneDocLinkeado = saleInvoices.some(i => i.originPresupuestoId === id);
    if (tieneDocLinkeado) return;
    if (!window.confirm("¿Eliminar este presupuesto? Esta acción no se puede deshacer.")) return;
    setSaleInvoices(prev => prev.filter(i => i.id !== id));
    if (companyId) supabase.from('sale_invoices').delete().eq('id', id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
  };

  // ── Cobranzas ────────────────────────────────────────────────────────────
  const [selectedReclamos, setSelectedReclamos] = useState([]); // ids de facturas tildadas
  const [reclamoSent, setReclamoSent] = useState({}); // { invoiceId: true }
  const [reclaimMsg, setReclaimMsg] = useState(null); // feedback
  const [emailProvider, setEmailProvider] = useState("gmail"); // "gmail" | "outlook"

  // Días hábiles: lunes a viernes
  const addBusinessDays = (dateStr, days) => {
    const d = new Date(dateStr);
    let added = 0;
    while (added < days) {
      d.setDate(d.getDate() + 1);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) added++;
    }
    return d.toISOString().slice(0, 10);
  };

  const todayReal = new Date().toISOString().slice(0, 10);

  // Facturas vencidas hace más de 5 días hábiles
  const facturasVencidas = saleInvoices.filter(i => {
    if (i.type !== "factura" || i.status !== "pendiente") return false;
    if (!i.due) return false;
    const limite = addBusinessDays(i.due, 5);
    return todayReal > limite;
  }).sort((a, b) => a.due.localeCompare(b.due));

  // Agrupar por cliente
  const vencidasPorCliente = clients.map(c => {
    const facturas = facturasVencidas.filter(i => i.clientId === c.id);
    if (facturas.length === 0) return null;
    return { client: c, facturas, total: facturas.reduce((s, i) => s + i.total, 0) };
  }).filter(Boolean).sort((a, b) => b.total - a.total);

  const toggleReclamo = (id) => setSelectedReclamos(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  // Genera un mailto agrupando TODAS las facturas seleccionadas de un cliente
  const generarMailReclamoCliente = (clientId, facturas) => {
    const client = clients.find(c => c.id === clientId);
    if (!client?.email) return null;

    const totalGeneral = facturas.reduce((s, i) => s + i.total, 0);
    const maxDias = Math.max(...facturas.map(i => Math.round((new Date(todayReal) - new Date(i.due)) / 86400000)));

    const detalle = facturas.map(i => {
      const dias = Math.round((new Date(todayReal) - new Date(i.due)) / 86400000);
      return "  • " + i.id + " — Vto: " + i.due + " — Importe: " + fmt(i.total) + " (" + dias + " días vencida)";
    }).join("\n");

    const subject = encodeURIComponent(
      facturas.length === 1
        ? "Reclamo de pago — Factura " + facturas[0].id
        : "Reclamo de pago — " + facturas.length + " facturas pendientes"
    );

    const body = encodeURIComponent(
      "Estimado/a " + client.name + ",\n\n" +
      "Nos comunicamos con usted para informarle que registramos " +
      (facturas.length === 1 ? "la siguiente factura vencida" : "las siguientes " + facturas.length + " facturas vencidas") +
      " sin pago acreditado:\n\n" +
      detalle + "\n\n" +
      "TOTAL ADEUDADO: " + fmt(totalGeneral) + "\n\n" +
      "Han transcurrido " + maxDias + " días desde el vencimiento" +
      (facturas.length > 1 ? " de la factura más antigua" : "") +
      " sin que hayamos registrado el pago correspondiente.\n\n" +
      "Le solicitamos que regularice la situación a la brevedad posible o se comunique con nosotros para coordinar una forma de pago.\n\n" +
      "Adjuntamos los comprobantes en formato PDF para su referencia.\n\n" +
      "Quedamos a disposición para cualquier consulta.\n\n" +
      "Saludos cordiales.\n" +
      (profile?.company_name || '') + (profile?.email ? "\n" + profile.email : "")
    );

    if (emailProvider === "gmail") {
      return "https://mail.google.com/mail/?view=cm&to=" + encodeURIComponent(client.email) + "&su=" + subject + "&body=" + body;
    }
    return "mailto:" + client.email + "?subject=" + subject + "&body=" + body;
  };

  // Mantener el individual para el botón por fila
  const generarMailReclamo = (inv) => {
    const client = clients.find(c => c.id === inv.clientId);
    if (!client?.email) return null;
    return generarMailReclamoCliente(inv.clientId, [inv]);
  };

  const enviarReclamos = () => {
    const seleccionadas = facturasVencidas.filter(i => selectedReclamos.includes(i.id));
    // Agrupar por cliente
    const porCliente = {};
    seleccionadas.forEach(inv => {
      if (!porCliente[inv.clientId]) porCliente[inv.clientId] = [];
      porCliente[inv.clientId].push(inv);
    });
    // Descargar PDF de cada factura seleccionada
    seleccionadas.forEach(inv => descargarHTMLFactura(inv));
    // Abrir compose por cliente
    let mailsAbiertos = 0;
    Object.entries(porCliente).forEach(([clientId, facturas]) => {
      const url = generarMailReclamoCliente(clientId, facturas);
      if (url) { window.open(url, "_blank"); mailsAbiertos++; }
    });
    setReclamoSent(prev => { const next = {...prev}; selectedReclamos.forEach(id => next[id] = true); return next; });
    const clientesCount = Object.keys(porCliente).length;
    setReclaimMsg(
      (seleccionadas.length === 1 ? "1 PDF descargado" : seleccionadas.length + " PDFs descargados") +
      " · " + (clientesCount === 1 ? "1 borrador abierto" : clientesCount + " borradores abiertos") +
      ". Adjuntá cada PDF al borrador antes de enviar."
    );
    setSelectedReclamos([]);
  };

  const descargarHTMLFactura = (inv) => {
    const client = clients.find(c => c.id === inv.clientId);
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Factura ${docRef(inv)}</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;color:#222;max-width:800px;margin:0 auto}
    h1{font-size:22px;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f5f5f5;padding:8px 12px;text-align:left;font-size:12px}
    td{padding:8px 12px;border-bottom:1px solid #eee;font-size:13px}
    .total{font-size:18px;font-weight:700;text-align:right;padding:12px 0}
    .badge{display:inline-block;background:#fff3cd;color:#856404;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700}
    @media print{body{padding:0}}</style></head>
    <body>
    <h1>FACTURA — ${docRef(inv)}</h1>
    <p style="color:#666;margin:0">Fecha: ${inv.date} · Vence: ${inv.due} · <span class="badge">PENDIENTE DE PAGO</span></p>
    <hr style="margin:16px 0;border:none;border-top:2px solid #eee"/>
    <p><strong>Cliente:</strong> ${client?.name || inv.clientName}${client?.cuit ? " · CUIT: " + client.cuit : ""}</p>
    ${client?.direccion ? "<p><strong>Dirección:</strong> " + client.direccion + "</p>" : ""}
    <table><thead><tr><th>Código</th><th>Descripción</th><th>Cant.</th><th>Precio unit.</th><th>Total</th></tr></thead>
    <tbody>${(inv.lines || []).map(l => "<tr><td>" + (l.clientCode || l.sku || "—") + "</td><td>" + l.name + "</td><td>" + l.qty + "</td><td>" + fmt(l.unitPrice) + "</td><td>" + fmt(l.subtotal) + "</td></tr>").join("")}</tbody></table>
    <div class="total">TOTAL: ${fmt(inv.total)}</div>
    <script>window.onload=()=>window.print()<\/script></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Factura_" + docRef(inv) + ".html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const generarPDFFactura = (inv) => {
    const client = clients.find(c => c.id === inv.clientId);
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Factura ${docRef(inv)}</title>
    <style>body{font-family:Arial,sans-serif;padding:32px;color:#222;max-width:800px;margin:0 auto}
    h1{font-size:22px;margin-bottom:4px}table{width:100%;border-collapse:collapse;margin:16px 0}
    th{background:#f5f5f5;padding:8px 12px;text-align:left;font-size:12px}
    td{padding:8px 12px;border-bottom:1px solid #eee;font-size:13px}
    .total{font-size:18px;font-weight:700;text-align:right;padding:12px 0}
    .badge{display:inline-block;background:#fff3cd;color:#856404;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700}</style></head>
    <body>
    <h1>FACTURA — ${docRef(inv)}</h1>
    <p style="color:#666;margin:0">Fecha: ${inv.date} · Vence: ${inv.due} · <span class="badge">PENDIENTE DE PAGO</span></p>
    <hr style="margin:16px 0;border:none;border-top:2px solid #eee"/>
    <p><strong>Cliente:</strong> ${client?.name || inv.clientName}${client?.cuit ? " · CUIT: " + client.cuit : ""}</p>
    ${client?.direccion ? "<p><strong>Dirección:</strong> " + client.direccion + "</p>" : ""}
    <table><thead><tr><th>Código</th><th>Descripción</th><th>Cant.</th><th>Precio unit.</th><th>Total</th></tr></thead>
    <tbody>${(inv.lines || []).map(l => "<tr><td>" + (l.clientCode || l.sku || "—") + "</td><td>" + l.name + "</td><td>" + l.qty + "</td><td>" + fmt(l.unitPrice) + "</td><td>" + fmt(l.subtotal) + "</td></tr>").join("")}</tbody></table>
    <div class="total">TOTAL: ${fmt(inv.total)}</div>
    <script>window.onload=()=>window.print()<\/script></body></html>`);
    win.document.close();
  };

  return (
    <div>
      {/* Modal Facturar desde POS */}
      {showPOSImport && (
        <POSImportModal companyId={companyId} onClose={() => setShowPOSImport(false)}
          onImport={(preload) => { setShowPOSImport(false); onNewFacturaFromPOS(preload); }}
        />
      )}
      {/* Modal IA Presupuesto Rápido */}
      {showIAModal && (
        <Modal title="✦ Presupuesto rápido con IA" onClose={() => { setShowIAModal(false); resetIA(); }} wide>

          {/* PASO 1: Input */}
          {iaStep === "input" && (
            <div>
              <div style={{ fontSize: 13, color: T.muted, marginBottom: 18, lineHeight: 1.7 }}>
                Pegá el mensaje del cliente o subí el PDF del pedido. La IA va a intentar identificar los productos del catálogo y, si tiene dudas, te va a hacer preguntas antes de armar el presupuesto.
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>MENSAJE O TEXTO DEL PEDIDO</label>
                <textarea value={iaText} onChange={e => setIaText(e.target.value)} rows={7}
                  placeholder="Ej: Hola, me manda 5 de la látex blanca grande y 3 rollos del cable fino. Somos la ferretería de Don Luis."
                  style={{ width: "100%", padding: "12px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.7, boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <label style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  📄 {iaPdfData ? iaPdfData.name : "Adjuntar PDF (opcional)"}
                  <input type="file" accept="application/pdf" onChange={handleIaPdf} style={{ display: "none" }} />
                </label>
                {iaPdfData && <button onClick={() => setIaPdfData(null)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 12 }}>✕ Quitar</button>}
              </div>
              {iaError && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>⚠ {iaError}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn v="ghost" onClick={() => { setShowIAModal(false); resetIA(); }}>Cancelar</Btn>
                <Btn disabled={!iaText.trim() && !iaPdfData} onClick={runIA}>✦ Analizar pedido</Btn>
              </div>
            </div>
          )}

          {/* LOADING */}
          {iaStep === "loading" && (
            <div style={{ textAlign: "center", padding: "48px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 16 }}>⏳</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Analizando el pedido...</div>
              <div style={{ fontSize: 13, color: T.muted }}>La IA está buscando los productos en tu catálogo e identificando cliente y moneda.</div>
            </div>
          )}

          {/* PASO 2: Preguntas de aclaración */}
          {iaStep === "clarify" && iaResult && (
            <div>
              <div style={{ background: T.blueLight, border: `1px solid ${T.blue}30`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: T.blue }}>
                La IA tiene algunas dudas sobre el pedido. Respondelas para poder armar el presupuesto correctamente.
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 18, marginBottom: 24 }}>
                {(iaResult.preguntas || []).map((q, i) => (
                  <div key={q.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 12 }}>{i + 1}. {q.texto}</div>
                    {q.tipo === "cliente" && (
                      <select value={iaClarifyAnswers[q.id] || ""} onChange={e => setIaClarifyAnswers(a => ({...a, [q.id]: e.target.value}))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${iaClarifyAnswers[q.id] ? T.accent : T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                        <option value="">Seleccionar cliente...</option>
                        {clients.map(c => <option key={c.id} value={c.name + " (" + c.codigo + ")"}>{c.name} — {c.codigo}</option>)}
                      </select>
                    )}
                    {q.tipo === "producto" && q.opciones && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {q.opciones.map((op, oi) => (
                          <button key={oi} onClick={() => setIaClarifyAnswers(a => ({...a, [q.id]: op}))}
                            style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${iaClarifyAnswers[q.id] === op ? T.accent : T.border}`, background: iaClarifyAnswers[q.id] === op ? T.accentLight : T.surface2, color: iaClarifyAnswers[q.id] === op ? T.accent : T.ink, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left", fontWeight: iaClarifyAnswers[q.id] === op ? 700 : 400 }}>
                            {op}
                          </button>
                        ))}
                        <button onClick={() => setIaClarifyAnswers(a => ({...a, [q.id]: "No está en el catálogo, omitir"}))}
                          style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${iaClarifyAnswers[q.id] === "No está en el catálogo, omitir" ? T.red : T.border}`, background: iaClarifyAnswers[q.id] === "No está en el catálogo, omitir" ? T.redLight : "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                          No está en el catálogo — omitir este ítem
                        </button>
                      </div>
                    )}
                    {q.tipo === "general" && (
                      q.opciones
                        ? <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {q.opciones.map((op, oi) => (
                              <button key={oi} onClick={() => setIaClarifyAnswers(a => ({...a, [q.id]: op}))}
                                style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${iaClarifyAnswers[q.id] === op ? T.accent : T.border}`, background: iaClarifyAnswers[q.id] === op ? T.accentLight : T.surface2, color: iaClarifyAnswers[q.id] === op ? T.accent : T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", fontWeight: iaClarifyAnswers[q.id] === op ? 700 : 400 }}>
                                {op}
                              </button>
                            ))}
                          </div>
                        : <input value={iaClarifyAnswers[q.id] || ""} onChange={e => setIaClarifyAnswers(a => ({...a, [q.id]: e.target.value}))} placeholder="Escribí tu respuesta..."
                            style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    )}
                  </div>
                ))}
              </div>
              {iaError && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>⚠ {iaError}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn v="ghost" onClick={() => setIaStep("input")}>← Volver</Btn>
                <Btn onClick={runIAWithAnswers}>Continuar →</Btn>
              </div>
            </div>
          )}

          {/* PASO 3: Revisión y confirmación */}
          {iaStep === "review" && iaResult && (
            <div>
              <div style={{ background: T.accentLight, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: "10px 16px", marginBottom: 18, fontSize: 13, color: T.accent }}>
                ✓ Presupuesto interpretado. Revisá los datos antes de abrirlo en el editor.
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 18 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>CLIENTE</div>
                  <select value={iaResult.clientId || ""} onChange={e => setIaResult(r => ({...r, clientId: e.target.value}))}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${iaResult.clientId ? T.accent : T.yellow}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                    <option value="">Sin cliente asignado</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>MONEDA</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[["ARS","$ ARS"],["USD","🇺🇸 USD"]].map(([v,l]) => (
                      <button key={v} onClick={() => setIaResult(r => ({...r, moneda: v}))}
                        style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${iaResult.moneda===v?(v==="USD"?T.blue:T.accent):T.border}`, background: iaResult.moneda===v?(v==="USD"?T.blueLight:T.accentLight):T.surface, color: iaResult.moneda===v?(v==="USD"?T.blue:T.accent):T.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>MODIFICA STOCK</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[[false,"No"],[true,"Sí"]].map(([v,l]) => (
                      <button key={String(v)} onClick={() => setIaResult(r => ({...r, modificaStock: v}))}
                        style={{ flex: 1, padding: "9px", borderRadius: 8, border: `1px solid ${iaResult.modificaStock===v?T.accent:T.border}`, background: iaResult.modificaStock===v?T.accentLight:T.surface, color: iaResult.modificaStock===v?T.accent:T.muted, fontWeight: 600, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 8 }}>PRODUCTOS</div>
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr style={{ background: T.surface }}>
                    {["Producto","Cant.","Precio unit.",""].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {(iaResult.lines || []).map((l, i) => {
                      const prod = products.find(p => p.sku === l.sku);
                      return (
                        <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                          <td style={{ padding: "10px 12px" }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{prod?.name || l.name}</div>
                            <div style={{ fontSize: 11, fontFamily: "monospace", color: T.accent }}>{l.sku}</div>
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <input type="number" value={l.qty} onChange={e => setIaResult(r => ({...r, lines: r.lines.map((x,j) => j===i?{...x,qty:parseFloat(e.target.value)||1}:x)}))}
                              style={{ width: 60, padding: "5px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <input type="number" value={l.unitPrice || ""} onChange={e => setIaResult(r => ({...r, lines: r.lines.map((x,j) => j===i?{...x,unitPrice:parseFloat(e.target.value)||0}:x)}))}
                              placeholder={prod ? String(prod.prices?.lista_a || 0) : "0"}
                              style={{ width: 100, padding: "5px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none" }} />
                          </td>
                          <td style={{ padding: "10px 12px" }}>
                            <button onClick={() => setIaResult(r => ({...r, lines: r.lines.filter((_,j) => j!==i)}))}
                              style={{ background: T.redLight, color: T.red, border: "none", borderRadius: 6, padding: "3px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 8 }}>OBSERVACIONES</div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
                  {(iaResult.obsRecomendadas || []).map((obs, i) => (
                    <button key={i} onClick={() => setIaObs(prev => prev ? prev + "\n" + obs : obs)}
                      style={{ padding: "4px 10px", borderRadius: 16, border: `1px solid ${T.accent}40`, background: T.accentLight, color: T.accent, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      + {obs}
                    </button>
                  ))}
                </div>
                <textarea value={iaObs} onChange={e => setIaObs(e.target.value)} rows={3}
                  placeholder="Ej: Validez: 15 días. Plazo de entrega: 3 días hábiles."
                  style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn v="ghost" onClick={() => setIaStep("input")}>← Volver</Btn>
                <Btn disabled={!iaResult.lines?.length} onClick={confirmarPresupuesto}>Abrir en editor →</Btn>
              </div>
            </div>
          )}
        </Modal>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Ventas</div><div style={{ fontSize: 13, color: T.muted }}>Facturación, clientes y seguimiento comercial</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowIAModal(true)}
            style={{ background: T.accentLight, color: T.accent, border: `1px solid ${T.accent}40`, borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            ✦ Presupuesto desde mensaje / PDF
          </button>
          <button onClick={onNewPresupuesto}
            style={{ background: T.purpleLight, color: T.purple, border: `1px solid ${T.purple}40`, borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📋 Nuevo presupuesto
          </button>
          <button onClick={onNewRemito}
            style={{ background: T.orangeLight, color: T.orange, border: `1px solid ${T.orange}40`, borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📦 Nuevo remito
          </button>
          {onNewFacturaFromPOS && (
            <button onClick={() => setShowPOSImport(true)}
              style={{ background: T.purpleLight, color: T.purple, border: `1px solid ${T.purple}40`, borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              🏪 Desde POS
            </button>
          )}
          <button onClick={onNewFactura}
            style={{ background: T.accent, color: "#fff", border: `1px solid ${T.accent}`, borderRadius: 8, padding: "9px 16px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            📄 Nueva factura
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 22, background: T.surface, borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[["docs", "Documentos"], ["clients", "Clientes"], ["vendedores", "Vendedores"], ["cobranzas", "💰 Cobranzas"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: tab === v ? T.paper : "transparent", color: tab === v ? T.ink : T.muted, fontWeight: tab === v ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>

      {tab === "docs" && (
        <>
          <div style={{ display: "flex", gap: 8, marginBottom: 12, alignItems: "center", flexWrap: "wrap" }}>
            {[["all", "Todos"], ["factura", "Facturas"], ["presupuesto", "Presupuestos"], ["remito", "Remitos"]].map(([v, l]) => (
              <button key={v} onClick={() => setFilterType(v)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${filterType === v ? T.blue : T.border}`, background: filterType === v ? T.blueLight : "transparent", color: filterType === v ? T.blue : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <SearchBar value={searchDocNum} onChange={setSearchDocNum} placeholder="N° de documento..." />
            <SearchBar value={searchDocClient} onChange={setSearchDocClient} placeholder="Cliente..." />
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <div style={{ position: "relative", flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4, letterSpacing: 0.8 }}>DESDE</label>
                <input type="date" value={searchDocDateFrom} onChange={e => setSearchDocDateFrom(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${searchDocDateFrom ? T.blue : T.border}`, background: T.surface, color: searchDocDateFrom ? T.ink : T.muted, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "relative", flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4, letterSpacing: 0.8 }}>HASTA</label>
                <input type="date" value={searchDocDateTo} onChange={e => setSearchDocDateTo(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${searchDocDateTo ? T.blue : T.border}`, background: T.surface, color: searchDocDateTo ? T.ink : T.muted, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <QuickDateFilter setFrom={setSearchDocDateFrom} setTo={setSearchDocDateTo} />
              </div>
              {(searchDocDateFrom || searchDocDateTo) && (
                <button onClick={() => { setSearchDocDateFrom(""); setSearchDocDateTo(""); }} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14, marginTop: 18 }}>✕</button>
              )}
            </div>
          </div>
          {/* Modal de forma de pago — Ventas */}
          {payingInv && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw" }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Registrar cobro</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>{docRef(payingInv)} — {payingInv.clientName} — <strong style={{ color: T.ink }}>{fmt(payingInv.total)}</strong></div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FORMA DE PAGO</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[["efectivo","Efectivo"],["debito","Débito"],["credito","Crédito"],["transferencia","Transferencia"],["cheque_propio","Cheque propio"],["cheque_tercero","Cheque de tercero"]].map(([v,l]) => (
                      <button key={v} onClick={() => setPayForm(f => ({ ...f, metodo: v }))}
                        style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${payForm.metodo === v ? T.accent : T.border}`, background: payForm.metodo === v ? T.accentLight : T.surface, color: payForm.metodo === v ? T.accent : T.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {payForm.metodo === "transferencia" && (
                  <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>BANCO ORIGEN <span style={{ color: T.red }}>*</span></label>
                      <BancoSelect value={payForm.bancoTransferencia} onChange={v => setPayForm(f => ({ ...f, bancoTransferencia: v }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>N° TRANSFERENCIA (opcional)</label>
                      <input value={payForm.referencia} onChange={e => setPayForm(f => ({ ...f, referencia: e.target.value }))} placeholder="Ej: TRF-00123456"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                )}
                {payForm.metodo === "efectivo" && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FECHA DE COBRO</label>
                    <input type="date" value={payForm.fechaPago} onChange={e => setPayForm(f => ({ ...f, fechaPago: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    {(() => { const hay = (cajas || []).some(c => String(c.date).slice(0,10) === payForm.fechaPago); return hay ? <div style={{ fontSize: 11, color: T.accent, marginTop: 4 }}>✓ Se registrará en la caja de ese día</div> : <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Sin caja abierta para esa fecha — no se registrará movimiento</div>; })()}
                  </div>
                )}
                {(payForm.metodo === "cheque_propio" || payForm.metodo === "cheque_tercero") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>N° DE CHEQUE <span style={{ color: T.red }}>*</span></label>
                      <input value={payForm.nroCheque} onChange={e => setPayForm(f => ({ ...f, nroCheque: e.target.value }))} placeholder="00001234"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>BANCO EMISOR <span style={{ color: T.red }}>*</span></label>
                      <BancoSelect value={payForm.bancoEmisor} onChange={v => setPayForm(f => ({ ...f, bancoEmisor: v }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FECHA DE PAGO <span style={{ color: T.red }}>*</span></label>
                      <input type="date" value={payForm.fechaPago} onChange={e => setPayForm(f => ({ ...f, fechaPago: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FECHA DE VENCIMIENTO <span style={{ color: T.red }}>*</span></label>
                      <input type="date" value={payForm.fechaVenc} onChange={e => setPayForm(f => ({ ...f, fechaVenc: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    {payForm.metodo === "cheque_tercero" && (<>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>EMISOR DEL CHEQUE <span style={{ color: T.red }}>*</span></label>
                        <input value={payForm.emisorCheque} onChange={e => setPayForm(f => ({ ...f, emisorCheque: e.target.value }))} placeholder="Razón social del emisor original"
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FECHA DE ENDOSO <span style={{ color: T.red }}>*</span></label>
                        <input type="date" value={payForm.fechaEndoso} onChange={e => setPayForm(f => ({ ...f, fechaEndoso: e.target.value }))}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </>)}
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>MONTO</label>
                      <div style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, fontSize: 13, fontFamily: "monospace" }}>{fmt(payingInv.total)} (cargado automáticamente)</div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <Btn v="ghost" onClick={() => setPayingInv(null)}>Cancelar</Btn>
                  <Btn onClick={confirmPayVenta}>Confirmar cobro</Btn>
                </div>
              </div>
            </div>
          )}

          {/* Modal de detalle — Ventas */}
          {viewingInv && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 700, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color: T.blue }}>{docRef(viewingInv)}</div>
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}><Badge status={viewingInv.type} /><Badge status={viewingInv.status} /></div>
                  </div>
                  <button onClick={() => setViewingInv(null)} style={{ background: "none", border: "none", color: T.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={{ background: T.surface, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 10 }}>CLIENTE</div>
                    {[["Nombre", viewingInv.clientName], ["Fecha", viewingInv.date], ["Vencimiento", viewingInv.due || "—"], ["Vendedor", viewingInv.vendedor || "—"], ["Moneda", viewingInv.moneda || "ARS"]].map(([l,v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: T.surface, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 10 }}>TOTALES</div>
                    {[["Neto", fmt(viewingInv.totalNeto || 0)], ["IVA", fmt(viewingInv.totalIva || 0)], ["Total", fmt(viewingInv.total)]].map(([l,v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: l === "Total" ? 800 : 600, color: l === "Total" ? T.accent : T.ink }}>{v}</span>
                      </div>
                    ))}
                    {viewingInv.type === "factura" && viewingInv.cae && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 6 }}>COMPROBANTE ARCA</div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}><span style={{ color: T.muted }}>Tipo</span><span style={{ fontWeight: 700 }}>Factura {viewingInv.tipoComprobante || "B"}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}><span style={{ color: T.muted }}>Número</span><span style={{ fontFamily: "monospace", fontWeight: 700 }}>{String(viewingInv.arcaNumero || "").padStart(8, "0")}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}><span style={{ color: T.muted }}>CAE</span><span style={{ fontFamily: "monospace", fontSize: 11 }}>{viewingInv.cae}</span></div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span style={{ color: T.muted }}>Venc. CAE</span><span style={{ fontWeight: 600 }}>{viewingInv.caeVto}</span></div>
                      </div>
                    )}
                    {viewingInv.type === "factura" && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 6 }}>FORMA DE PAGO</div>
                        {viewingInv.status !== "cobrada" ? (
                          <div style={{ fontSize: 13, color: T.muted, fontStyle: "italic" }}>Aún no cobrado</div>
                        ) : (() => {
                          const mp = viewingInv.metodoPago || ""
                          const row = (l, v) => <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
                          if (mp === "Efectivo") return <div style={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>✓ Cobrado en efectivo</div>
                          if (mp === "Tarjeta de débito") return <div style={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>✓ Cobrado con tarjeta de débito</div>
                          if (mp === "Tarjeta de crédito") return <div style={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>✓ Cobrado con tarjeta de crédito</div>
                          if (mp.startsWith("Transferencia")) {
                            const ref = mp.includes(" — ") ? mp.split(" — ").slice(1).join(" — ") : null
                            return <>{row("Método", "Transferencia")}{ref && row("Referencia", ref)}</>
                          }
                          if (mp.startsWith("Cheque propio")) {
                            const nro = mp.replace("Cheque propio N°", "").split(" — ")[0]
                            const banco = mp.split(" — ")[1] || ""
                            return <>{row("Tipo", "Cheque propio")}{row("N° cheque", nro)}{row("Banco", banco)}</>
                          }
                          if (mp.startsWith("Cheque de tercero")) {
                            const parts = mp.replace("Cheque de tercero N°", "").split(" — ")
                            return <>{row("Tipo", "Cheque de tercero")}{row("N° cheque", parts[0] || "")}{row("Banco", parts[1] || "")}{parts[2] && row("Emisor", parts[2].replace("Emisor: ", ""))}{parts[3] && row("Fecha de endoso", parts[3].replace("Endosado: ", ""))}</>
                          }
                          return <div style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>{mp}</div>
                        })()}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ background: T.surface, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 10 }}>ARTÍCULOS</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Descripción","Cantidad","Precio unit.","Subtotal"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>{(viewingInv.lines || []).map((l, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "9px 10px", fontSize: 13 }}>{l.name}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right" }}>{l.qty}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, fontFamily: "monospace", textAlign: "right" }}>{fmt(l.unitPrice)}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, fontFamily: "monospace", fontWeight: 700, textAlign: "right" }}>{fmt(l.subtotal)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                {viewingInv.observaciones && (
                  <div style={{ background: T.surface, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 6 }}>OBSERVACIONES</div>
                    <div style={{ fontSize: 13, color: T.ink }}>{viewingInv.observaciones}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>{["Número", "Tipo", "Cliente", "Fecha", "Vence", "Total", "Estado", ""].map(h => <th key={h} style={{ padding: "11px 15px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}</tr></thead>
              <tbody>{filtered.map(inv => (
                <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 15px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.blue }}>{docRef(inv)}</td>
                  <td style={{ padding: "12px 15px" }}><Badge status={inv.type} /></td>
                  <td style={{ padding: "12px 15px", fontSize: 13, fontWeight: 600 }}>{inv.clientName}</td>
                  <td style={{ padding: "12px 15px", fontSize: 12, color: T.muted }}>{inv.date}</td>
                  <td style={{ padding: "12px 15px", fontSize: 12, color: T.muted }}>{inv.due}</td>
                  <td style={{ padding: "12px 15px", fontSize: 14, fontWeight: 800 }}>{fmt(inv.total)}</td>
                  <td style={{ padding: "12px 15px" }}><Badge status={inv.status} /></td>
                  <td style={{ padding: "12px 15px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Btn sm v="ghost" onClick={() => setViewingInv(inv)}>👁 Ver</Btn>
                      {inv.type === "factura" && inv.status === "pendiente" && <Btn sm v="ghost" onClick={() => openPayModal(inv)}>Marcar cobrada</Btn>}
                      {inv.type === "factura" && inv.status === "cobrada" && <Btn sm v="ghost" onClick={() => unmarkCobrada(inv.id)}>↩ Revertir</Btn>}
                      {inv.type === "factura" && !inv.cae && <Btn sm v="ghost" onClick={() => emitirARCA(inv)} disabled={arcaLoading === inv.id}>{arcaLoading === inv.id ? "Enviando..." : "🏛 Emitir ARCA"}</Btn>}
                      {inv.type === "factura" && inv.cae && <span style={{ fontSize: 10, color: T.accent, fontWeight: 700, padding: "3px 8px", border: `1px solid ${T.accent}40`, borderRadius: 6 }}>✓ CAE</span>}
                      <Btn sm v="ghost" onClick={() => generarPDFFactura(inv)}>📄 PDF</Btn>
                      <Btn sm v="ghost" onClick={() => setEmailingDoc(inv)}>✉ Enviar</Btn>
                      <Btn sm v="ghost" onClick={() => onEditDoc(inv)}>✏ Editar</Btn>
                      {inv.type === "presupuesto" && (() => {
                        const linkedDoc = saleInvoices.find(i => i.originPresupuestoId === inv.id);
                        return linkedDoc
                          ? <span style={{ fontSize: 10, color: T.muted, padding: "3px 8px", border: `1px solid ${T.border}`, borderRadius: 6 }} title={`Tiene ${linkedDoc.type} ${docRef(linkedDoc)}`}>🔒 Vinculado</span>
                          : <Btn sm v="danger" onClick={() => eliminarPresupuesto(inv.id)}>🗑 Eliminar</Btn>;
                      })()}
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === "clients" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 14, alignItems: "flex-end" }}>
            <SearchBar value={searchClientName} onChange={setSearchClientName} placeholder="Nombre o código..." />
            <SearchBar value={searchClientCuit} onChange={setSearchClientCuit} placeholder="CUIT..." />
            <Btn sm onClick={() => setNewClient(true)}>+ Nuevo cliente</Btn>
          </div>
          {newClient && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Nuevo cliente</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Solo el código y la razón social son obligatorios. El resto se puede completar después.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>CÓDIGO <span style={{ color: T.accent }}>*</span></label>
                  <input value={ncForm.codigo} onChange={e => setNcForm(f => ({ ...f, codigo: e.target.value }))} placeholder="ej: FDL-001"
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${ncForm.codigo ? T.border : T.red + "80"}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none" }} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>RAZÓN SOCIAL <span style={{ color: T.accent }}>*</span></label>
                  <input value={ncForm.name} onChange={e => setNcForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre o razón social"
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${ncForm.name ? T.border : T.red + "80"}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                </div>
                {[["cuit","CUIT","20-12345678-9",false], ["direccion","DIRECCIÓN","Av. Corrientes 123, CABA",false], ["email","EMAIL","contacto@empresa.com",false], ["phone","TELÉFONO","11-1234-5678",false]].map(([k, l, ph]) => (
                  <div key={k}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>{l} <span style={{ color: T.faint, fontWeight: 400 }}>(opcional)</span></label>
                    <input value={ncForm[k]} onChange={e => setNcForm(f => ({ ...f, [k]: e.target.value }))} placeholder={ph}
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  </div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>LOGÍSTICA · HORARIOS DE ATENCIÓN</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>ABRE <span style={{ color: T.faint, fontWeight: 400 }}>(opcional)</span></label>
                    <input type="time" value={ncForm.horarioAbre} onChange={e => setNcForm(f => ({...f, horarioAbre: e.target.value}))}
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>CIERRA <span style={{ color: T.faint, fontWeight: 400 }}>(opcional)</span></label>
                    <input type="time" value={ncForm.horarioCierra} onChange={e => setNcForm(f => ({...f, horarioCierra: e.target.value}))}
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>DÍAS DISPONIBLES <span style={{ color: T.faint, fontWeight: 400 }}>(opcional)</span></label>
                    <input value={ncForm.diasDisponibles} onChange={e => setNcForm(f => ({...f, diasDisponibles: e.target.value}))} placeholder="ej: Lun-Vie"
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn v="ghost" sm onClick={() => setNewClient(false)}>Cancelar</Btn>
                <Btn sm disabled={!ncForm.codigo || !ncForm.name} onClick={() => { const nc = { ...ncForm, id: crypto.randomUUID(), priceList: "lista_a", lastPurchase: "—", status: "activo", nextFollowUp: "—" }; setClients([...clients, nc]); if (companyId) supabase.from('clients').insert(clientToDb(nc, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }); setNewClient(false); setNcForm({ codigo: "", name: "", cuit: "", direccion: "", email: "", phone: "", horarioAbre: "", horarioCierra: "", diasDisponibles: "Lun-Vie" }); }}>Guardar cliente</Btn>
              </div>
            </div>
          )}
          <div style={{ display: "grid", gap: 10 }}>
            {filteredClients.map(c => (
              <div key={c.id} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: T.muted, background: T.surface, padding: "1px 7px", borderRadius: 5 }}>{c.codigo}</span>
                    <span style={{ fontSize: 14, fontWeight: 700 }}>{c.name}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    {[c.cuit && `CUIT: ${c.cuit}`, c.email, c.phone].filter(Boolean).join(" · ")}
                  </div>
                  {c.direccion && <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{c.direccion}</div>}
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>Últ. compra<br /><span style={{ color: T.ink, fontWeight: 600 }}>{c.lastPurchase}</span></div>
                <div style={{ fontSize: 12, color: T.muted }}>Seguimiento<br /><span style={{ color: T.ink, fontWeight: 600 }}>{c.nextFollowUp}</span></div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === "vendedores" && (
        <VendedoresTab vendedores={vendedores} setVendedores={setVendedores} saleInvoices={saleInvoices} />
      )}

      {tab === "cobranzas" && (
        <div>
          {/* KPIs de cobranzas */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total vencido +5 días hábiles", value: fmt(facturasVencidas.reduce((s, i) => s + i.total, 0)), color: T.red },
              { label: "Facturas a reclamar", value: facturasVencidas.length + " facturas", color: T.orange },
              { label: "Clientes en mora", value: vencidasPorCliente.length + " clientes", color: T.yellow },
            ].map((k, i) => (
              <div key={i} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px" }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Feedback */}
          {reclaimMsg && (
            <div style={{ background: T.accentLight, border: `1px solid ${T.accent}40`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: T.accent, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              ✓ {reclaimMsg}
              <button onClick={() => setReclaimMsg(null)} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          )}

          {facturasVencidas.length === 0 ? (
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: "48px 32px", textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 6 }}>Sin facturas vencidas</div>
              <div style={{ fontSize: 13, color: T.muted }}>No hay facturas con más de 5 días hábiles de atraso.</div>
            </div>
          ) : (
            <div>
              {/* Barra de acción */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={{ fontSize: 13, color: T.muted }}>
                  {selectedReclamos.length > 0
                    ? <span style={{ color: T.red, fontWeight: 700 }}>{selectedReclamos.length} factura(s) seleccionada(s) para reclamar</span>
                    : "Tildá las facturas que querés reclamar"}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {/* Toggle Gmail / Outlook */}
                  <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: `1px solid ${T.border}` }}>
                    {[["gmail", "Gmail"], ["outlook", "Outlook"]].map(([val, label]) => (
                      <button key={val} onClick={() => setEmailProvider(val)}
                        style={{ padding: "7px 12px", border: "none", background: emailProvider === val ? T.accent : T.surface, color: emailProvider === val ? "#fff" : T.muted, fontSize: 11, fontWeight: emailProvider === val ? 700 : 400, cursor: "pointer", fontFamily: "inherit" }}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <button onClick={() => setSelectedReclamos(facturasVencidas.map(i => i.id))}
                    style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    Seleccionar todas
                  </button>
                  <button onClick={() => setSelectedReclamos([])}
                    style={{ padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                    Deseleccionar
                  </button>
                  <button onClick={enviarReclamos} disabled={selectedReclamos.length === 0}
                    style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: selectedReclamos.length > 0 ? T.red : T.surface, color: selectedReclamos.length > 0 ? "#fff" : T.muted, fontSize: 12, fontWeight: 700, cursor: selectedReclamos.length > 0 ? "pointer" : "default", fontFamily: "inherit" }}>
                    ✉ Enviar reclamo{selectedReclamos.length > 1 ? "s" : ""} {selectedReclamos.length > 0 ? "(" + selectedReclamos.length + ")" : ""}
                  </button>
                </div>
              </div>

              {/* Tabla por cliente */}
              {vencidasPorCliente.map(({ client: c, facturas, total }) => (
                <div key={c.id} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, marginBottom: 14, overflow: "hidden" }}>
                  {/* Header cliente */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: T.muted, background: T.surface2, padding: "1px 7px", borderRadius: 5 }}>{c.codigo}</span>
                        <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{c.name}</span>
                        {c.email
                          ? <span style={{ fontSize: 11, color: T.accent }}>✉ {c.email}</span>
                          : <span style={{ fontSize: 11, color: T.red }}>⚠ Sin email registrado</span>}
                      </div>
                      {c.phone && <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>📞 {c.phone}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 20, fontWeight: 800, color: T.red }}>{fmt(total)}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>{facturas.length} factura(s) vencida(s)</div>
                    </div>
                  </div>

                  {/* Facturas del cliente */}
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ background: T.surface2 }}>
                        <th style={{ padding: "8px 16px", width: 36 }}></th>
                        {["N° Factura", "Fecha", "Vencimiento", "Días vencido", "Total", "Estado reclamo", ""].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {facturas.map(inv => {
                        const isSelected = selectedReclamos.includes(inv.id);
                        const wasSent = reclamoSent[inv.id];
                        const diasVencido = Math.round((new Date(todayReal) - new Date(inv.due)) / 86400000);
                        const mailUrl = generarMailReclamo(inv);
                        return (
                          <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}`, background: isSelected ? T.redLight + "30" : "transparent" }}>
                            <td style={{ padding: "12px 16px" }}>
                              <div onClick={() => toggleReclamo(inv.id)}
                                style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? T.red : T.border}`, background: isSelected ? T.red : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                {isSelected && <span style={{ color: "#fff", fontSize: 11, fontWeight: 800 }}>✓</span>}
                              </div>
                            </td>
                            <td style={{ padding: "12px 12px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.red }}>{docRef(inv)}</td>
                            <td style={{ padding: "12px 12px", fontSize: 12, color: T.muted }}>{inv.date}</td>
                            <td style={{ padding: "12px 12px", fontSize: 12, fontWeight: 700, color: T.red }}>{inv.due}</td>
                            <td style={{ padding: "12px 12px" }}>
                              <span style={{ background: T.redLight, color: T.red, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>
                                {diasVencido} días
                              </span>
                            </td>
                            <td style={{ padding: "12px 12px", fontSize: 14, fontWeight: 800, color: T.red }}>{fmt(inv.total)}</td>
                            <td style={{ padding: "12px 12px" }}>
                              {wasSent
                                ? <span style={{ fontSize: 11, color: T.accent, fontWeight: 700 }}>✓ Reclamado</span>
                                : <span style={{ fontSize: 11, color: T.muted }}>Pendiente</span>}
                            </td>
                            <td style={{ padding: "12px 12px" }}>
                              <div style={{ display: "flex", gap: 6 }}>
                                <button onClick={() => generarPDFFactura(inv)}
                                  style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                                  🖨 PDF
                                </button>
                                {mailUrl && (
                                  <button onClick={() => { descargarHTMLFactura(inv); window.open(mailUrl, "_blank"); setReclamoSent(p => ({ ...p, [inv.id]: true })); setReclaimMsg("PDF de " + docRef(inv) + " descargado · Adjuntalo manualmente al correo antes de enviarlo."); }}
                                    style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.red}40`, background: T.redLight, color: T.red, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                                    ✉ Reclamar
                                  </button>
                                )}
                                <Btn sm v="ghost" onClick={() => markCobrada(inv.id)}>Cobrada</Btn>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ))}

              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", fontSize: 12, color: T.muted, lineHeight: 1.7 }}>
                <strong style={{ color: T.ink }}>Cómo funciona el reclamo:</strong> seleccioná el cliente de correo con el toggle <strong>Gmail / Outlook</strong> y presioná "✉ Enviar reclamos" o el botón individual. El PDF de cada factura se <strong>descarga automáticamente</strong> a tu carpeta de Descargas como archivo HTML (abrilo y guardalo como PDF con Ctrl+P). Simultáneamente se abre el borrador en tu cliente de correo — adjuntá el PDF antes de enviar.
              </div>
            </div>
          )}
        </div>
      )}

      {emailingDoc && <EmailDocModal inv={emailingDoc} clients={clients} products={products} onClose={() => setEmailingDoc(null)} />}
    </div>
  );
}
function ComercialModule({ clients, saleInvoices }) {
  const [tab, setTab] = useState("calendario");

  // ── CALENDARIO state ───────────────────────────────────────────────────────
  const [events, setEvents] = useState([
    { id: "ev1", title: "Reunión Distribuidora Norte", date: "2026-03-14", time: "10:00", clientId: "c1", clientName: "Distribuidora Norte SA", notes: "Revisar condiciones del trimestre", location: "Av. Corrientes 1234, CABA", type: "reunion" },
    { id: "ev2", title: "Llamado seguimiento", date: "2026-03-17", time: "15:30", clientId: "c2", clientName: "Ferretería El Tornillo", notes: "", location: "", type: "llamado" },
  ]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [calView, setCalView] = useState("mes"); // "mes" | "lista"
  const [calMonth, setCalMonth] = useState("2026-03");
  const EMPTY_EVENT = { title: "", date: "", time: "", clientId: "", clientName: "", notes: "", location: "", type: "reunion" };
  const [evForm, setEvForm] = useState(EMPTY_EVENT);

  const EVENT_TYPES = {
    reunion:  { label: "Reunión",   color: T.blue,   bg: T.blueLight },
    llamado:  { label: "Llamado",   color: T.accent,  bg: T.accentLight },
    visita:   { label: "Visita",    color: T.purple,  bg: T.purpleLight },
    propuesta:{ label: "Propuesta", color: T.orange,  bg: T.orangeLight },
    otro:     { label: "Otro",      color: T.muted,   bg: T.surface2 },
  };

  const saveEvent = () => {
    if (!evForm.title || !evForm.date) return;
    if (editingEvent) {
      setEvents(events.map(e => e.id === editingEvent ? { ...evForm, id: editingEvent } : e));
    } else {
      setEvents([...events, { ...evForm, id: `ev${Date.now()}` }]);
    }
    setShowEventForm(false); setEditingEvent(null); setEvForm(EMPTY_EVENT);
  };

  const deleteEvent = (id) => setEvents(events.filter(e => e.id !== id));

  const openEdit = (ev) => { setEvForm({ ...ev }); setEditingEvent(ev.id); setShowEventForm(true); };

  const googleCalUrl = (ev) => {
    const dt = ev.date.replace(/-/g, "") + "T" + (ev.time || "090000").replace(":", "") + "00";
    const dtEnd = ev.date.replace(/-/g, "") + "T" + (ev.time ? String(parseInt(ev.time.split(":")[0]) + 1).padStart(2,"0") + ev.time.slice(2) : "100000").replace(":","") + "00";
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${dt}/${dtEnd}&details=${encodeURIComponent(ev.notes || "")}&location=${encodeURIComponent(ev.location || "")}`;
  };

  // Build calendar grid
  const [cy, cm] = calMonth.split("-").map(Number);
  const firstDay = new Date(cy, cm - 1, 1).getDay();
  const daysInMonth = new Date(cy, cm, 0).getDate();
  const calDays = [];
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);

  const eventsInMonth = events.filter(e => e.date?.startsWith(calMonth));
  const eventsForDay = (d) => d ? events.filter(e => e.date === `${calMonth}-${String(d).padStart(2,"0")}`) : [];
  const today2 = new Date().toISOString().slice(0,10);

  const monthNames = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const prevMonth = () => { let [y,m] = calMonth.split("-").map(Number); m--; if(m<1){m=12;y--;} setCalMonth(`${y}-${String(m).padStart(2,"0")}`); };
  const nextMonth = () => { let [y,m] = calMonth.split("-").map(Number); m++; if(m>12){m=1;y++;} setCalMonth(`${y}-${String(m).padStart(2,"0")}`); };

  const upcomingEvents = [...events].filter(e => e.date >= today2).sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).slice(0, 8);

  // ── NOTAS state ────────────────────────────────────────────────────────────
  const [notes, setNotes] = useState([
    { id: "n1", title: "Proceso de onboarding clientes nuevos", content: "1. Enviar bienvenida\n2. Configurar lista de precios\n3. Primera factura con descuento", clientId: "", clientName: "", tag: "proceso", updatedAt: "2026-03-10" },
    { id: "n2", title: "Seguimiento Ferretería El Tornillo", content: "Interesados en ampliar línea de productos. Lllamar después del 20/03.", clientId: "c2", clientName: "Ferretería El Tornillo", tag: "cliente", updatedAt: "2026-03-08" },
  ]);
  const [selectedNote, setSelectedNote] = useState("n1");
  const [noteSearch, setNoteSearch] = useState("");
  const [noteTagFilter, setNoteTagFilter] = useState("all");
  const [noteClientFilter, setNoteClientFilter] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const EMPTY_NOTE = { title: "", content: "", clientId: "", clientName: "", tag: "general" };
  const [nForm, setNForm] = useState(EMPTY_NOTE);

  const NOTE_TAGS = { general: { label: "General", color: T.muted }, proceso: { label: "Proceso", color: T.blue }, cliente: { label: "Cliente", color: T.accent }, importante: { label: "Importante", color: T.red } };

  const filteredNotes = notes.filter(n => {
    if (noteTagFilter !== "all" && n.tag !== noteTagFilter) return false;
    if (noteClientFilter && n.clientId !== noteClientFilter) return false;
    if (noteSearch && !n.title.toLowerCase().includes(noteSearch.toLowerCase()) && !n.content.toLowerCase().includes(noteSearch.toLowerCase())) return false;
    return true;
  });

  const saveNote = () => {
    if (!nForm.title) return;
    const now = new Date().toISOString().slice(0,10);
    if (selectedNote && notes.find(n => n.id === selectedNote) && showNoteForm) {
      setNotes(notes.map(n => n.id === selectedNote ? { ...nForm, id: selectedNote, updatedAt: now } : n));
    } else {
      const id = `n${Date.now()}`;
      setNotes([{ ...nForm, id, updatedAt: now }, ...notes]);
      setSelectedNote(id);
    }
    setShowNoteForm(false);
  };

  const deleteNote = (id) => { setNotes(notes.filter(n => n.id !== id)); setSelectedNote(notes.find(n => n.id !== id)?.id || null); };

  const activeNote = notes.find(n => n.id === selectedNote);

  // ── IA COMERCIAL state ─────────────────────────────────────────────────────
  const [aiChat, setAiChat] = useState([{ role: "ai", text: "Hola! Soy tu asistente comercial. Tenés 2 clientes sin contacto hace más de 30 días. ¿Querés que preparemos un seguimiento?" }]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  const sendAi = async () => {
    if (!aiInput.trim() || aiLoading) return;
    const msg = aiInput; setAiInput("");
    setAiChat(prev => [...prev, { role: "user", text: msg }]);
    setAiLoading(true);
    try {
      const ctx = clients.map(c => `${c.name}: última compra ${c.lastPurchase}, estado ${c.status}, próx. seguimiento ${c.nextFollowUp}`).join("\n");
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: `Sos asistente comercial de una PyME argentina. Hoy es ${today}. Clientes:\n${ctx}\nRespondé en español, conciso y accionable.`,
          messages: [...aiChat.filter((_,i) => i > 0).map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.text })), { role: "user", content: msg }] })
      });
      const data = await res.json();
      setAiChat(prev => [...prev, { role: "ai", text: data.content?.[0]?.text || "Error." }]);
    } catch { setAiChat(prev => [...prev, { role: "ai", text: "Error de conexión." }]); }
    setAiLoading(false);
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Comercial</div>
          <div style={{ fontSize: 13, color: T.muted }}>Agenda, notas y seguimiento de clientes</div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, background: T.surface, borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[["calendario","📅 Calendario"], ["notas","📝 Bloc de notas"], ["ai","✦ IA Comercial"]].map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            style={{ padding: "7px 18px", borderRadius: 7, border: "none", background: tab === v ? T.paper : "transparent", color: tab === v ? T.ink : T.muted, fontWeight: tab === v ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>

      {/* ══════════ CALENDARIO ══════════ */}
      {tab === "calendario" && (
        <div>
          {/* Modal nuevo/editar evento */}
          {showEventForm && (
            <Modal title={editingEvent ? "Editar evento" : "Nuevo evento"} onClose={() => { setShowEventForm(false); setEditingEvent(null); setEvForm(EMPTY_EVENT); }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>TÍTULO <span style={{ color: T.accent }}>*</span></label>
                  <input value={evForm.title} onChange={e => setEvForm(f => ({...f, title: e.target.value}))} placeholder="ej: Reunión con cliente"
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${evForm.title ? T.border : T.red+"60"}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>FECHA <span style={{ color: T.accent }}>*</span></label>
                  <input type="date" value={evForm.date} onChange={e => setEvForm(f => ({...f, date: e.target.value}))}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${evForm.date ? T.border : T.red+"60"}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>HORA</label>
                  <input type="time" value={evForm.time} onChange={e => setEvForm(f => ({...f, time: e.target.value}))}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>TIPO</label>
                  <select value={evForm.type} onChange={e => setEvForm(f => ({...f, type: e.target.value}))}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                    {Object.entries(EVENT_TYPES).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>EMPRESA / CLIENTE</label>
                  <select value={evForm.clientId} onChange={e => { const c = clients.find(c => c.id === e.target.value); setEvForm(f => ({...f, clientId: e.target.value, clientName: c?.name || ""})); }}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: evForm.clientId ? T.ink : T.muted, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                    <option value="">Sin cliente específico</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>UBICACIÓN</label>
                  <input value={evForm.location} onChange={e => setEvForm(f => ({...f, location: e.target.value}))} placeholder="Dirección o link de videollamada (opcional)"
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div style={{ gridColumn: "span 2" }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>ANOTACIONES</label>
                  <textarea value={evForm.notes} onChange={e => setEvForm(f => ({...f, notes: e.target.value}))} placeholder="Temas a tratar, datos de contacto, recordatorios..." rows={3}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <a href={evForm.date ? googleCalUrl(evForm) : "#"} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.blue, textDecoration: "none", opacity: evForm.date ? 1 : 0.4, pointerEvents: evForm.date ? "auto" : "none" }}>
                  📅 Agregar a Google Calendar
                </a>
                <div style={{ display: "flex", gap: 10 }}>
                  <Btn v="ghost" onClick={() => { setShowEventForm(false); setEditingEvent(null); setEvForm(EMPTY_EVENT); }}>Cancelar</Btn>
                  <Btn disabled={!evForm.title || !evForm.date} onClick={saveEvent}>Guardar</Btn>
                </div>
              </div>
            </Modal>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>
            {/* Calendario principal */}
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
              {/* Nav de mes */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button onClick={prevMonth} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: T.ink, fontSize: 14 }}>‹</button>
                  <div style={{ fontSize: 16, fontWeight: 800, color: T.ink, minWidth: 160, textAlign: "center" }}>{monthNames[cm-1]} {cy}</div>
                  <button onClick={nextMonth} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 10px", cursor: "pointer", color: T.ink, fontSize: 14 }}>›</button>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["mes","Mes"],["lista","Lista"]].map(([v,l]) => (
                    <button key={v} onClick={() => setCalView(v)}
                      style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${calView===v ? T.accent : T.border}`, background: calView===v ? T.accentLight : "transparent", color: calView===v ? T.accent : T.muted, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
                  ))}
                  <button onClick={() => { setEvForm(EMPTY_EVENT); setEditingEvent(null); setShowEventForm(true); }}
                    style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Evento</button>
                </div>
              </div>

              {calView === "mes" ? (
                <div style={{ padding: 16 }}>
                  {/* Días semana */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 4 }}>
                    {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map(d => (
                      <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: T.muted, padding: "4px 0" }}>{d}</div>
                    ))}
                  </div>
                  {/* Celdas */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
                    {calDays.map((d, i) => {
                      const dayStr = d ? `${calMonth}-${String(d).padStart(2,"0")}` : null;
                      const dayEvs = eventsForDay(d);
                      const isToday = dayStr === today2;
                      return (
                        <div key={i} style={{ minHeight: 72, borderRadius: 8, border: `1px solid ${isToday ? T.accent+"60" : T.border}`, background: d ? (isToday ? T.accentLight : T.surface) : "transparent", padding: "6px 7px", opacity: d ? 1 : 0 }}>
                          {d && <>
                            <div style={{ fontSize: 12, fontWeight: isToday ? 800 : 500, color: isToday ? T.accent : T.ink, marginBottom: 3 }}>{d}</div>
                            {dayEvs.slice(0,2).map(ev => {
                              const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.otro;
                              return (
                                <div key={ev.id} onClick={() => openEdit(ev)} title={ev.title}
                                  style={{ fontSize: 10, background: tc.bg, color: tc.color, borderRadius: 4, padding: "2px 5px", marginBottom: 2, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 600 }}>
                                  {ev.time && <span style={{ opacity: 0.7 }}>{ev.time} </span>}{ev.title}
                                </div>
                              );
                            })}
                            {dayEvs.length > 2 && <div style={{ fontSize: 10, color: T.muted, paddingLeft: 2 }}>+{dayEvs.length - 2} más</div>}
                          </>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Vista lista */
                <div style={{ padding: 16 }}>
                  {eventsInMonth.length === 0 && <div style={{ textAlign: "center", color: T.muted, fontSize: 13, padding: 32 }}>Sin eventos en {monthNames[cm-1]}.</div>}
                  {[...eventsInMonth].sort((a,b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)).map(ev => {
                    const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.otro;
                    return (
                      <div key={ev.id} style={{ display: "flex", gap: 14, alignItems: "flex-start", padding: "14px 0", borderBottom: `1px solid ${T.border}` }}>
                        <div style={{ minWidth: 50, textAlign: "center" }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{ev.date.slice(8)}</div>
                          <div style={{ fontSize: 10, color: T.muted }}>{monthNames[parseInt(ev.date.slice(5,7))-1].slice(0,3)}</div>
                          {ev.time && <div style={{ fontSize: 11, color: T.accent, fontWeight: 700, marginTop: 2 }}>{ev.time}</div>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, background: tc.bg, color: tc.color, padding: "2px 8px", borderRadius: 6 }}>{tc.label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{ev.title}</span>
                          </div>
                          {ev.clientName && <div style={{ fontSize: 12, color: T.accent, marginBottom: 2 }}>🏢 {ev.clientName}</div>}
                          {ev.location && <div style={{ fontSize: 12, color: T.muted }}>📍 {ev.location}</div>}
                          {ev.notes && <div style={{ fontSize: 12, color: T.muted, marginTop: 4, fontStyle: "italic" }}>{ev.notes}</div>}
                        </div>
                        <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                          <a href={googleCalUrl(ev)} target="_blank" rel="noreferrer"
                            style={{ background: T.blueLight, color: T.blue, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center" }}>
                            📅 GCal
                          </a>
                          <button onClick={() => openEdit(ev)} style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Editar</button>
                          <button onClick={() => deleteEvent(ev.id)} style={{ background: T.redLight, color: T.red, border: "none", borderRadius: 6, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Panel lateral: próximos eventos */}
            <div>
              <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 14 }}>PRÓXIMOS EVENTOS</div>
                {upcomingEvents.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>Sin eventos próximos.</div>}
                {upcomingEvents.map(ev => {
                  const tc = EVENT_TYPES[ev.type] || EVENT_TYPES.otro;
                  const isToday3 = ev.date === today2;
                  return (
                    <div key={ev.id} onClick={() => openEdit(ev)} style={{ padding: "10px 0", borderBottom: `1px solid ${T.border}`, cursor: "pointer" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: T.ink, flex: 1, marginRight: 6 }}>{ev.title}</span>
                        <span style={{ fontSize: 10, background: tc.bg, color: tc.color, padding: "1px 6px", borderRadius: 5, fontWeight: 700, flexShrink: 0 }}>{tc.label}</span>
                      </div>
                      <div style={{ fontSize: 11, color: isToday3 ? T.accent : T.muted, fontWeight: isToday3 ? 700 : 400 }}>
                        {isToday3 ? "Hoy" : ev.date} {ev.time && `· ${ev.time}`}
                      </div>
                      {ev.clientName && <div style={{ fontSize: 11, color: T.muted, marginTop: 1 }}>🏢 {ev.clientName}</div>}
                    </div>
                  );
                })}
                <button onClick={() => { setEvForm(EMPTY_EVENT); setEditingEvent(null); setShowEventForm(true); }}
                  style={{ width: "100%", marginTop: 14, padding: "9px", borderRadius: 8, border: `1px solid ${T.accent}40`, background: T.accentLight, color: T.accent, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  + Nuevo evento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ BLOC DE NOTAS ══════════ */}
      {tab === "notas" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, height: 620 }}>

          {/* Panel izquierdo: lista de notas */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Buscador y filtros */}
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12 }}>
              <SearchBar value={noteSearch} onChange={setNoteSearch} placeholder="Buscar notas..." />
              <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
                {[["all","Todas"], ...Object.entries(NOTE_TAGS).map(([k,v]) => [k, v.label])].map(([k,l]) => (
                  <button key={k} onClick={() => setNoteTagFilter(k)}
                    style={{ padding: "3px 10px", borderRadius: 12, border: `1px solid ${noteTagFilter===k ? T.accent : T.border}`, background: noteTagFilter===k ? T.accentLight : "transparent", color: noteTagFilter===k ? T.accent : T.muted, fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
                ))}
              </div>
              <div style={{ marginTop: 8 }}>
                <select value={noteClientFilter} onChange={e => setNoteClientFilter(e.target.value)}
                  style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: `1px solid ${noteClientFilter ? T.accent+"60" : T.border}`, background: T.surface, color: noteClientFilter ? T.ink : T.muted, fontSize: 12, fontFamily: "inherit", outline: "none" }}>
                  <option value="">Todos los clientes</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <button onClick={() => { setNForm(EMPTY_NOTE); setShowNoteForm(true); setSelectedNote(null); }}
              style={{ padding: "9px", borderRadius: 8, border: `1px solid ${T.accent}40`, background: T.accentLight, color: T.accent, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              + Nueva nota
            </button>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {filteredNotes.length === 0 && <div style={{ color: T.muted, fontSize: 13, padding: "12px 0", textAlign: "center" }}>Sin notas.</div>}
              {filteredNotes.map(n => {
                const tag = NOTE_TAGS[n.tag] || NOTE_TAGS.general;
                const isActive = selectedNote === n.id;
                return (
                  <div key={n.id} onClick={() => { setSelectedNote(n.id); setShowNoteForm(false); }}
                    style={{ background: isActive ? T.accentLight : T.paper, border: `1px solid ${isActive ? T.accent+"60" : T.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: T.ink, flex: 1, marginRight: 6, lineHeight: 1.3 }}>{n.title}</span>
                      <span style={{ fontSize: 10, color: tag.color, fontWeight: 700, flexShrink: 0 }}>●</span>
                    </div>
                    {n.clientName && <div style={{ fontSize: 11, color: T.accent, marginBottom: 3 }}>🏢 {n.clientName}</div>}
                    <div style={{ fontSize: 11, color: T.muted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{n.content}</div>
                    <div style={{ fontSize: 10, color: T.faint, marginTop: 4 }}>{n.updatedAt}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Panel derecho: editor / vista de nota */}
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            {showNoteForm ? (
              /* Formulario nueva nota */
              <div style={{ padding: 24, flex: 1, overflowY: "auto" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.ink, marginBottom: 18 }}>Nueva nota</div>
                <div style={{ display: "grid", gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>TÍTULO <span style={{ color: T.accent }}>*</span></label>
                    <input value={nForm.title} onChange={e => setNForm(f => ({...f, title: e.target.value}))} placeholder="Título de la nota"
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${nForm.title ? T.border : T.red+"60"}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>ETIQUETA</label>
                      <select value={nForm.tag} onChange={e => setNForm(f => ({...f, tag: e.target.value}))}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                        {Object.entries(NOTE_TAGS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>CLIENTE (opcional)</label>
                      <select value={nForm.clientId} onChange={e => { const c = clients.find(c => c.id === e.target.value); setNForm(f => ({...f, clientId: e.target.value, clientName: c?.name || ""})); }}
                        style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: nForm.clientId ? T.ink : T.muted, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                        <option value="">Sin cliente</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>CONTENIDO</label>
                    <textarea value={nForm.content} onChange={e => setNForm(f => ({...f, content: e.target.value}))} placeholder="Escribí tu nota..." rows={10}
                      style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.7, boxSizing: "border-box" }} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 16 }}>
                  <Btn v="ghost" onClick={() => setShowNoteForm(false)}>Cancelar</Btn>
                  <Btn disabled={!nForm.title} onClick={saveNote}>Guardar nota</Btn>
                </div>
              </div>
            ) : activeNote ? (
              /* Vista de nota activa */
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 6 }}>{activeNote.title}</div>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: (NOTE_TAGS[activeNote.tag]||NOTE_TAGS.general).color, background: T.surface2, padding: "2px 9px", borderRadius: 8 }}>
                        {(NOTE_TAGS[activeNote.tag]||NOTE_TAGS.general).label}
                      </span>
                      {activeNote.clientName && <span style={{ fontSize: 12, color: T.accent }}>🏢 {activeNote.clientName}</span>}
                      <span style={{ fontSize: 11, color: T.faint }}>Actualizado: {activeNote.updatedAt}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setNForm({...activeNote}); setShowNoteForm(true); }}
                      style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Editar</button>
                    <button onClick={() => deleteNote(activeNote.id)}
                      style={{ background: T.redLight, color: T.red, border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Eliminar</button>
                  </div>
                </div>
                <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
                  <pre style={{ fontSize: 14, color: T.ink, lineHeight: 1.8, whiteSpace: "pre-wrap", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>{activeNote.content}</pre>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 14 }}>
                Seleccioná una nota o creá una nueva
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ IA COMERCIAL ══════════ */}
      {tab === "ai" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 12 }}>ALERTAS DE SEGUIMIENTO</div>
            {clients.filter(c => c.status !== "activo" || c.nextFollowUp <= today).slice(0, 4).map(c => (
              <div key={c.id} style={{ background: T.paper, border: `1px solid ${c.status === "en riesgo" ? T.yellow + "50" : T.border}`, borderRadius: 12, padding: 16, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13 }}>{c.name}</span>
                  <Badge status={c.status} />
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Últ. compra: {c.lastPurchase} · Seguimiento: {c.nextFollowUp}</div>
                <button onClick={() => setAiInput(`Preparame un mensaje de seguimiento personalizado para ${c.name}`)}
                  style={{ background: T.accentLight, color: T.accent, border: `1px solid ${T.accentGlow}`, borderRadius: 7, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontWeight: 700, fontFamily: "inherit" }}>
                  ✦ Generar mensaje
                </button>
              </div>
            ))}
          </div>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, display: "flex", flexDirection: "column", height: 520 }}>
            <div style={{ padding: "16px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.accent, display: "inline-block", boxShadow: `0 0 8px ${T.accent}` }}></span>
              <span style={{ fontWeight: 700, fontSize: 13 }}>Asistente Comercial IA</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              {aiChat.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                  <div style={{ maxWidth: "82%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 3px 14px" : "14px 14px 14px 3px", background: m.role === "user" ? T.accent : T.surface2, color: m.role === "user" ? "#fff" : T.ink, fontSize: 13, lineHeight: 1.6, border: m.role === "ai" ? `1px solid ${T.border}` : "none", whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {aiLoading && <div style={{ background: T.surface2, borderRadius: 12, padding: "10px 14px", width: 60, border: `1px solid ${T.border}` }}><span style={{ color: T.accent }}>···</span></div>}
            </div>
            <div style={{ padding: 14, borderTop: `1px solid ${T.border}`, display: "flex", gap: 10 }}>
              <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendAi()} placeholder="Preguntá sobre clientes, seguimientos..."
                style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 13px", color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              <Btn onClick={sendAi} disabled={aiLoading}>↑</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRICE LISTS TAB ──────────────────────────────────────────────────────────
function PriceListsTab({ products, setProducts, priceLists, setPriceLists, companyId }) {
  const [selectedList, setSelectedList] = useState(priceLists[0]?.id || "");
  const [showNewList, setShowNewList] = useState(false);
  const [newListLabel, setNewListLabel] = useState("");
  const [editingListId, setEditingListId] = useState(null);
  const [editingListLabel, setEditingListLabel] = useState("");
  const [importError, setImportError] = useState("");
  const [importSuccess, setImportSuccess] = useState("");
  const [editingPrice, setEditingPrice] = useState(null); // { productId, ars, usd }
  const STALE_DAYS = 45;

  const list = priceLists.find(l => l.id === selectedList);

  const getArs = (p) => p.prices?.[selectedList] || 0;
  const getUsd = (p) => p.pricesUsd?.[selectedList] || 0;

  const missingPrice = products.filter(p => p.tracksStock !== false && getArs(p) === 0 && getUsd(p) === 0);

  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() - STALE_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const stalePrice = products.filter(p => {
    if (p.tracksStock === false) return false;
    if (getArs(p) === 0 && getUsd(p) === 0) return false;
    const updatedAt = p.priceUpdatedAt?.[selectedList];
    return !updatedAt || updatedAt < cutoffStr;
  });

  const addList = () => {
    if (!newListLabel.trim()) return;
    const id = "lista_" + newListLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (priceLists.find(l => l.id === id)) return;
    const nl = { id, label: newListLabel.trim() };
    setPriceLists(prev => [...prev, nl]);
    if (companyId) supabase.from('price_lists').insert(priceListToDb(nl, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    setSelectedList(id);
    setNewListLabel(""); setShowNewList(false);
  };

  const renameList = () => {
    if (!editingListLabel.trim() || !editingListId) return;
    setPriceLists(prev => prev.map(l => l.id === editingListId ? { ...l, label: editingListLabel.trim() } : l));
    if (companyId) supabase.from('price_lists').update({ label: editingListLabel.trim() }).eq('id', editingListId).eq('company_id', companyId).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    setEditingListId(null);
    setEditingListLabel("");
  };

  const deleteList = (listId) => {
    if (priceLists.length <= 1) { alert("No podés eliminar la única lista de precios. Debe quedar al menos una."); return; }
    const lista = priceLists.find(l => l.id === listId);
    if (!lista) return;
    const productosAfectados = products.filter(p => (p.prices?.[listId] > 0) || (p.pricesUsd?.[listId] > 0)).length;
    // Primera confirmación
    if (!window.confirm(`¿Eliminar la lista "${lista.label}"?\n\nEsto borrará los precios de esta lista en ${productosAfectados} producto${productosAfectados !== 1 ? "s" : ""}. La acción no se puede deshacer.`)) return;
    // Segunda confirmación
    if (!window.confirm(`CONFIRMACIÓN FINAL\n\n¿Estás completamente seguro de que querés eliminar "${lista.label}" de forma permanente?\n\nPresioná Aceptar solo si estás seguro.`)) return;
    // Eliminar de estado
    setPriceLists(prev => prev.filter(l => l.id !== listId));
    setProducts(prev => prev.map(p => {
      const newPrices = { ...p.prices }; delete newPrices[listId];
      const newPricesUsd = { ...(p.pricesUsd || {}) }; delete newPricesUsd[listId];
      const updated = { ...p, prices: newPrices, pricesUsd: newPricesUsd };
      if (companyId) supabase.from('products').update({ prices: newPrices, prices_usd: newPricesUsd }).eq('id', p.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
      return updated;
    }));
    if (companyId) supabase.from('price_lists').delete().eq('id', listId).eq('company_id', companyId).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    if (selectedList === listId) setSelectedList(priceLists.find(l => l.id !== listId)?.id || "");
  };

  const savePrice = (productId, ars, usd) => {
    const arsVal = parseFloat(ars) || 0;
    const usdVal = parseFloat(usd) || 0;
    setProducts(prev => {
      const next = prev.map(p => p.id !== productId ? p : {
        ...p,
        prices: { ...p.prices, [selectedList]: arsVal },
        pricesUsd: { ...(p.pricesUsd || {}), [selectedList]: usdVal },
        priceUpdatedAt: { ...(p.priceUpdatedAt || {}), [selectedList]: today }
      });
      if (companyId) {
        const updated = next.find(p => p.id === productId);
        if (updated) supabase.from('products').update({ prices: updated.prices, prices_usd: updated.pricesUsd }).eq('id', productId).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
      }
      return next;
    });
    setEditingPrice(null);
  };

  // Importar desde Excel — columnas: SKU | Precio ARS | Precio USD
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(""); setImportSuccess("");
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        const isHeader = (r) => {
          const v = String(r[0] || "").toLowerCase();
          return v.includes("sku") || v.includes("codigo") || v.includes("código");
        };
        const dataRows = rows.filter((r, i) => i === 0 ? !isHeader(r) : true).filter(r => r[0]);
        let updated = 0; let notFound = 0;
        setProducts(prev => {
          const next = [...prev];
          dataRows.forEach(row => {
            const sku = String(row[0] || "").trim();
            const arsRaw = String(row[1] || "").replace(/[^0-9.,]/g, "").replace(",", ".");
            const usdRaw = String(row[2] || "").replace(/[^0-9.,]/g, "").replace(",", ".");
            const ars = parseFloat(arsRaw) || 0;
            const usd = parseFloat(usdRaw) || 0;
            if (!sku || (ars === 0 && usd === 0)) return;
            const idx = next.findIndex(p => p.sku === sku || p.id === sku);
            if (idx === -1) { notFound++; return; }
            next[idx] = {
              ...next[idx],
              prices: { ...next[idx].prices, [selectedList]: ars },
              pricesUsd: { ...(next[idx].pricesUsd || {}), [selectedList]: usd },
              priceUpdatedAt: { ...(next[idx].priceUpdatedAt || {}), [selectedList]: today }
            };
            updated++;
          });
          return next;
        });
        setImportSuccess("Se actualizaron " + updated + " productos." + (notFound > 0 ? " " + notFound + " SKU no encontrados." : ""));
      } catch (err) {
        setImportError("Error al leer el archivo. Verificá que sea un Excel válido.");
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const rows = [
      ["SKU", "Precio ARS (s/IVA)", "Precio USD (s/IVA)"],
      ...products.filter(p => p.tracksStock !== false).map(p => [p.sku, getArs(p) || "", getUsd(p) || ""])
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 16 }, { wch: 20 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lista de precios");
    XLSX.writeFile(wb, "plantilla_" + (list?.label || selectedList) + ".xlsx");
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 16, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {priceLists.map(l => (
            <div key={l.id} style={{ display: "flex", alignItems: "center" }}>
              {editingListId === l.id ? (
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  <input autoFocus value={editingListLabel} onChange={e => setEditingListLabel(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") renameList(); if (e.key === "Escape") setEditingListId(null); }}
                    style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${T.accent}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", width: 160 }} />
                  <button onClick={renameList} style={{ background: T.accent, border: "none", color: "#fff", borderRadius: 6, padding: "5px 10px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✓</button>
                  <button onClick={() => setEditingListId(null)} style={{ background: "none", border: "none", color: T.muted, fontSize: 14, cursor: "pointer" }}>✕</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <button onClick={() => setSelectedList(l.id)}
                    style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${selectedList === l.id ? T.accent : T.border}`, background: selectedList === l.id ? T.accentLight : "transparent", color: selectedList === l.id ? T.accent : T.muted, fontWeight: selectedList === l.id ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    {l.label}
                  </button>
                  <button title="Renombrar lista" onClick={() => { setEditingListId(l.id); setEditingListLabel(l.label); }}
                    style={{ background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer", padding: "0 2px", opacity: 0.5 }}>✏</button>
                  <button title="Eliminar lista" onClick={() => deleteList(l.id)}
                    style={{ background: "none", border: "none", color: T.faint, fontSize: 12, cursor: "pointer", padding: "0 2px" }}
                    onMouseEnter={e => e.target.style.color = T.red}
                    onMouseLeave={e => e.target.style.color = T.faint}>🗑</button>
                </div>
              )}
            </div>
          ))}
          <button onClick={() => setShowNewList(v => !v)}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1px dashed ${T.border}`, background: "transparent", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            + Nueva lista
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadTemplate}
            style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            ⬇ Descargar plantilla
          </button>
          <label style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${T.blue}40`, background: T.blueLight, color: T.blue, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
            📥 Importar Excel
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleImport} style={{ display: "none" }} />
          </label>
        </div>
      </div>

      {/* Form nueva lista */}
      {showNewList && (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 18px", marginBottom: 16, display: "flex", gap: 10, alignItems: "center" }}>
          <input value={newListLabel} onChange={e => setNewListLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && addList()} placeholder="Nombre de la lista (ej: Lista D · Revendedor)"
            style={{ flex: 1, padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
          <Btn sm onClick={addList} disabled={!newListLabel.trim()}>Crear</Btn>
          <Btn sm v="ghost" onClick={() => { setShowNewList(false); setNewListLabel(""); }}>Cancelar</Btn>
        </div>
      )}

      {/* Feedback */}
      {importSuccess && (
        <div style={{ background: T.accentLight, border: `1px solid ${T.accent}40`, borderRadius: 8, padding: "10px 16px", marginBottom: 14, fontSize: 13, color: T.accent, display: "flex", justifyContent: "space-between" }}>
          ✓ {importSuccess}
          <button onClick={() => setImportSuccess("")} style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}
      {importError && (
        <div style={{ background: T.redLight, border: `1px solid ${T.red}40`, borderRadius: 8, padding: "10px 16px", marginBottom: 14, fontSize: 13, color: T.red, display: "flex", justifyContent: "space-between" }}>
          ⚠ {importError}
          <button onClick={() => setImportError("")} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14 }}>✕</button>
        </div>
      )}

      {/* Alertas */}
      {(missingPrice.length > 0 || stalePrice.length > 0) && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
          {missingPrice.length > 0 && (
            <div style={{ background: T.redLight, border: `1px solid ${T.red}30`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.red, marginBottom: 10 }}>⚠ Sin precio en esta lista ({missingPrice.length})</div>
              {missingPrice.slice(0, 5).map(p => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.red}20` }}>
                  <div>
                    <span style={{ fontSize: 12, color: T.ink }}>{p.name}</span>
                    <span style={{ fontSize: 11, color: T.muted, marginLeft: 8, fontFamily: "monospace" }}>{p.sku}</span>
                  </div>
                  <button onClick={() => setEditingPrice({ productId: p.id, ars: "", usd: "" })}
                    style={{ fontSize: 11, background: T.redLight, color: T.red, border: `1px solid ${T.red}40`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                    Cargar precio
                  </button>
                </div>
              ))}
              {missingPrice.length > 5 && <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>y {missingPrice.length - 5} más...</div>}
            </div>
          )}
          {stalePrice.length > 0 && (
            <div style={{ background: T.yellowLight, border: `1px solid ${T.yellow}30`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.yellow, marginBottom: 10 }}>🕐 Precio desactualizado +{STALE_DAYS} días ({stalePrice.length})</div>
              {stalePrice.slice(0, 5).map(p => {
                const updatedAt = p.priceUpdatedAt?.[selectedList];
                return (
                  <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.yellow}20` }}>
                    <div>
                      <span style={{ fontSize: 12, color: T.ink }}>{p.name}</span>
                      <span style={{ fontSize: 11, color: T.muted, marginLeft: 6 }}>{updatedAt ? "Últ: " + updatedAt : "Sin fecha"}</span>
                    </div>
                    <button onClick={() => setEditingPrice({ productId: p.id, ars: String(getArs(p) || ""), usd: String(getUsd(p) || "") })}
                      style={{ fontSize: 11, background: T.yellowLight, color: T.yellow, border: `1px solid ${T.yellow}40`, borderRadius: 6, padding: "3px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                      Actualizar
                    </button>
                  </div>
                );
              })}
              {stalePrice.length > 5 && <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>y {stalePrice.length - 5} más...</div>}
            </div>
          )}
        </div>
      )}

      {/* Modal edición de precio — dual moneda */}
      {editingPrice && (() => {
        const prod = products.find(p => p.id === editingPrice.productId);
        return (
          <Modal title={"Actualizar precio · " + (prod?.name || "")} onClose={() => setEditingPrice(null)}>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Podés cargar precio en ARS, en USD, o en ambas. Dejá en 0 si no aplica para esta lista.</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>PRECIO ARS (s/IVA)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, color: T.muted, fontWeight: 700 }}>$</span>
                  <input type="number" value={editingPrice.ars} onChange={e => setEditingPrice(ep => ({ ...ep, ars: e.target.value }))}
                    placeholder="0.00" autoFocus
                    style={{ flex: 1, padding: "11px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 15, fontFamily: "monospace", outline: "none" }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>PRECIO USD (s/IVA)</label>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14, color: T.muted, fontWeight: 700 }}>US$</span>
                  <input type="number" value={editingPrice.usd} onChange={e => setEditingPrice(ep => ({ ...ep, usd: e.target.value }))}
                    placeholder="0.00"
                    style={{ flex: 1, padding: "11px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 15, fontFamily: "monospace", outline: "none" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn v="ghost" onClick={() => setEditingPrice(null)}>Cancelar</Btn>
              <Btn onClick={() => savePrice(editingPrice.productId, editingPrice.ars, editingPrice.usd)}
                disabled={!editingPrice.ars && !editingPrice.usd}>Guardar</Btn>
            </div>
          </Modal>
        );
      })()}

      {/* Tabla */}
      <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ padding: "12px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>{list?.label || selectedList}</span>
          <span style={{ fontSize: 12, color: T.muted }}>{products.filter(p => p.tracksStock !== false).length} productos</span>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.surface }}>
              {["SKU", "Producto", "Categoría", "Precio ARS", "Precio USD", "Últ. actualización", ""].map(h => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {products.filter(p => p.tracksStock !== false).map(p => {
              const ars = getArs(p);
              const usd = getUsd(p);
              const updatedAt = p.priceUpdatedAt?.[selectedList];
              const noPrice = ars === 0 && usd === 0;
              const isStale = !noPrice && (!updatedAt || updatedAt < cutoffStr);
              return (
                <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: noPrice ? T.redLight + "22" : isStale ? T.yellowLight + "22" : "transparent" }}>
                  <td style={{ padding: "11px 16px", fontFamily: "monospace", fontSize: 12, color: T.muted }}>{p.sku}</td>
                  <td style={{ padding: "11px 16px", fontSize: 13, fontWeight: 600, color: T.ink }}>{p.name}</td>
                  <td style={{ padding: "11px 16px", fontSize: 12, color: T.muted }}>{p.category}</td>
                  <td style={{ padding: "11px 16px" }}>
                    {ars > 0
                      ? <span style={{ fontSize: 14, fontWeight: 800, color: T.ink }}>{fmt(ars)}</span>
                      : <span style={{ fontSize: 12, color: T.faint }}>—</span>
                    }
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    {usd > 0
                      ? <span style={{ fontSize: 14, fontWeight: 800, color: T.blue }}>US$ {Number(usd).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      : <span style={{ fontSize: 12, color: T.faint }}>—</span>
                    }
                  </td>
                  <td style={{ padding: "11px 16px", fontSize: 12, color: isStale ? T.yellow : T.muted }}>
                    {updatedAt || <span style={{ color: noPrice ? T.red : T.muted }}>Sin fecha</span>}
                    {isStale && <span style={{ marginLeft: 6, fontSize: 10, color: T.yellow, fontWeight: 700 }}>⚠ +{STALE_DAYS}d</span>}
                  </td>
                  <td style={{ padding: "11px 16px" }}>
                    <button onClick={() => setEditingPrice({ productId: p.id, ars: String(ars || ""), usd: String(usd || "") })}
                      style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 6, padding: "4px 12px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      {noPrice ? "Cargar" : "Editar"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Instrucciones */}
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 18px", marginTop: 16, fontSize: 12, color: T.muted, lineHeight: 1.8 }}>
        <span style={{ fontWeight: 700, color: T.ink }}>Formato de importación Excel:</span> tres columnas: SKU, Precio ARS y Precio USD (sin IVA). Podés dejar una columna en 0 si el producto solo se vende en una moneda. La primera fila puede ser encabezado. Usá la plantilla para ver el formato exacto.
      </div>
    </div>
  );
}

// ─── MODULE: COMPRAS ──────────────────────────────────────────────────────────
function ComprasModule({ purchaseInvoices, setPurchaseInvoices, suppliers, setSuppliers, products, setProducts, priceLists, setPriceLists, companyId, onNewPurchase, ordenesCompra, setOrdenesCompra, cheques, setCheques, cajas, cajaMovimientos, setCajaMovimientos }) {
  const [tab, setTab] = useState("invoices");
  const [payingInv, setPayingInv] = useState(null);
  const [payForm, setPayForm] = useState({ metodo: "efectivo", referencia: "", bancoTransferencia: "", nroCheque: "", bancoEmisor: "", fechaPago: "", fechaVenc: "", emisorCheque: "", fechaEndoso: "" });
  const [viewingInv, setViewingInv] = useState(null);
  const [editingPurchaseInv, setEditingPurchaseInv] = useState(null);
  const [editingOC, setEditingOC] = useState(null);
  const [editingSup, setEditingSup] = useState(null);

  // ── Facturas compra: edit / delete ────────────────────────────────────────
  const saveEditPurchase = () => {
    const e = editingPurchaseInv;
    setPurchaseInvoices(prev => prev.map(i => i.id === e.id ? e : i));
    if (companyId) supabase.from('purchase_invoices').update({
      nro_factura: e.nroFactura || null,
      date: e.date,
      due_date: e.dueDate || null,
      observaciones: e.observaciones || null,
    }).eq('id', e.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
    setEditingPurchaseInv(null);
  };

  const deletePurchaseInv = (inv) => {
    if (!window.confirm(`¿Eliminar la factura ${inv.ref}?\nEsta acción no se puede deshacer.`)) return;
    setPurchaseInvoices(prev => prev.filter(i => i.id !== inv.id));
    if (companyId) supabase.from('purchase_invoices').delete().eq('id', inv.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
  };

  // ── OC: edit / delete ─────────────────────────────────────────────────────
  const saveEditOC = () => {
    const e = editingOC;
    setOrdenesCompra(prev => prev.map(o => o.id === e.id ? e : o));
    if (companyId) supabase.from('ordenes_compra').update({
      date: e.date,
      observaciones: e.observaciones || null,
    }).eq('id', e.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
    setEditingOC(null);
  };

  // ── Proveedores: edit / delete ────────────────────────────────────────────
  const saveEditSup = () => {
    const e = editingSup;
    setSuppliers(prev => prev.map(s => s.id === e.id ? e : s));
    if (companyId) supabase.from('suppliers').update(supplierToDb(e, companyId)).eq('id', e.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
    setEditingSup(null);
  };

  const deleteSup = (s) => {
    if (!window.confirm(`¿Eliminar el proveedor "${s.name}"?\nEsta acción no se puede deshacer.`)) return;
    setSuppliers(prev => prev.filter(x => x.id !== s.id));
    if (companyId) supabase.from('suppliers').delete().eq('id', s.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
  };

  const [showOCBuilder, setShowOCBuilder] = useState(false);
  const [showSupForm, setShowSupForm] = useState(false);
  const [supForm, setSupForm] = useState({ name: "", cuit: "", contact: "", email: "", phone: "", paymentDays: 30, bank: "", cbu: "", direccion: "", horarioAbre: "", horarioCierra: "", diasDisponibles: "Lun-Vie" });
  const [searchInvNum, setSearchInvNum] = useState("");
  const [searchInvSupplier, setSearchInvSupplier] = useState("");
  const [searchInvDateFrom, setSearchInvDateFrom] = useState("");
  const [searchInvDateTo, setSearchInvDateTo] = useState("");
  const [searchInvStatus, setSearchInvStatus] = useState("");
  const [searchInvAmount, setSearchInvAmount] = useState("");
  const [searchSupName, setSearchSupName] = useState("");
  const [searchSupCuit, setSearchSupCuit] = useState("");

  // ── IA PDF Import ─────────────────────────────────────────────────────────
  const [showIAImport, setShowIAImport] = useState(false);
  const [iaPdfFile, setIaPdfFile] = useState(null);
  const [iaPdfLoading, setIaPdfLoading] = useState(false);
  const [iaPdfError, setIaPdfError] = useState("");
  const [iaPdfResult, setIaPdfResult] = useState(null);
  const [iaApiKey, setIaApiKey] = useState(() => localStorage.getItem("nexo_api_key") || "");

  const saveApiKey = (k) => { setIaApiKey(k); localStorage.setItem("nexo_api_key", k); };

  const procesarPDFconIA = async () => {
    if (!iaPdfFile) return;
    if (!iaApiKey.trim()) { setIaPdfError("Ingresá tu API Key de Anthropic para continuar."); return; }
    setIaPdfLoading(true); setIaPdfError(""); setIaPdfResult(null);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(",")[1];
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": iaApiKey.trim(),
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-allow-browser": "true",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 2000,
            messages: [{
              role: "user",
              content: [{
                type: "document",
                source: { type: "base64", media_type: "application/pdf", data: base64 }
              }, {
                type: "text",
                text: `Extraé los datos de esta factura y devolvé SOLO un JSON con este formato exacto (sin texto extra, sin markdown):
{"nroFactura":"0012-00014202","fecha":"2026-03-18","vencimiento":"2026-03-19","proveedor":"MADERWIL S.A.","cuitProveedor":"30-70725102-2","condicionPago":"CCTE 1 DIAS FF","vendedor":"ELIU PEREZ","subtotal":1301940.51,"iva21":273407.51,"iva105":0,"percepciones":26038.81,"total":1601386.82,"items":[{"codigo":"MON70","cantidad":129,"descripcion":"MONTANTE 70MM X 2.60 MTS","precioUnitario":3790.08,"importe":488920.66}]}`
              }]
            }]
          })
        });
        const data = await res.json();
        if (data.error) { setIaPdfError("Error API: " + data.error.message); setIaPdfLoading(false); return; }
        const text = (data.content?.[0]?.text || "{}").replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(text);
        setIaPdfResult(parsed);
        setIaPdfLoading(false);
      };
      reader.onerror = () => { setIaPdfError("No se pudo leer el archivo."); setIaPdfLoading(false); };
      reader.readAsDataURL(iaPdfFile);
    } catch (err) {
      setIaPdfError("Error al procesar el PDF: " + err.message);
      setIaPdfLoading(false);
    }
  };

  const confirmarImportacion = () => {
    if (!iaPdfResult) return;
    const r = iaPdfResult;
    const lines = (r.items || []).map((it) => ({
      productId: null, supplierCode: it.codigo, name: it.descripcion,
      sku: it.codigo, qty: it.cantidad, unitPrice: it.precioUnitario,
      neto: it.importe, ivaImporte: 0, subtotal: it.importe, iva: 0
    }));
    const existingSup = suppliers.find(s => s.cuit === r.cuitProveedor);
    let supplierId = existingSup?.id || null;
    let supplierName = r.proveedor;
    if (!existingSup && r.proveedor) {
      const newSup = { id: crypto.randomUUID(), name: r.proveedor, cuit: r.cuitProveedor || "", contact: "", email: "", phone: "", paymentDays: 0, bank: "", cbu: "", productCodes: [] };
      setSuppliers(prev => [...prev, newSup]);
      if (companyId) supabase.from('suppliers').insert(supplierToDb(newSup, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
      supplierId = newSup.id;
    }
    const newPI = {
      id: crypto.randomUUID(), ref: "OC-" + String(Date.now()).slice(-6), nroFactura: r.nroFactura, supplierId, supplierName,
      date: r.fecha || today, dueDate: r.vencimiento || today,
      total: r.total, totalNeto: r.subtotal, totalIva: r.iva21,
      status: "pendiente", lines, condicionPago: r.condicionPago, vendedor: r.vendedor
    };
    setPurchaseInvoices(prev => [newPI, ...prev]);
    if (companyId) supabase.from('purchase_invoices').insert(purchaseInvoiceToDb(newPI, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    setShowIAImport(false); setIaPdfFile(null); setIaPdfResult(null);
  };

  const filteredInvoices = purchaseInvoices.filter(inv => {
    if (searchInvNum && !inv.id?.toLowerCase().includes(searchInvNum.toLowerCase()) && !inv.nroFactura?.toLowerCase().includes(searchInvNum.toLowerCase())) return false;
    if (searchInvSupplier && !inv.supplierName?.toLowerCase().includes(searchInvSupplier.toLowerCase())) return false;
    if (searchInvDateFrom && inv.date < searchInvDateFrom) return false;
    if (searchInvDateTo && inv.date > searchInvDateTo) return false;
    if (searchInvStatus && !inv.status?.toLowerCase().includes(searchInvStatus.toLowerCase())) return false;
    if (searchInvAmount && !String(inv.total).includes(searchInvAmount)) return false;
    return true;
  });

  const filteredSuppliers = suppliers.filter(s => {
    if (searchSupName && !s.name?.toLowerCase().includes(searchSupName.toLowerCase())) return false;
    if (searchSupCuit && !s.cuit?.toLowerCase().includes(searchSupCuit.toLowerCase())) return false;
    return true;
  });

  const openPayModalCompra = (inv) => { const today = new Date().toISOString().slice(0,10); setPayingInv(inv); setPayForm({ metodo: "efectivo", referencia: "", bancoTransferencia: "", nroCheque: "", bancoEmisor: "", fechaPago: today, fechaVenc: "", emisorCheque: "", fechaEndoso: today }); };
  const confirmPayCompra = () => {
    if (!payingInv) return;
    const pf = payForm;
    if ((pf.metodo === "cheque_propio" || pf.metodo === "cheque_tercero") && (!pf.nroCheque || !pf.bancoEmisor || !pf.fechaPago || !pf.fechaVenc)) { alert("Completá todos los campos del cheque."); return; }
    if (pf.metodo === "cheque_tercero" && (!pf.emisorCheque || !pf.fechaEndoso)) { alert("Completá el emisor y la fecha de endoso."); return; }
    const metodoPagoStr = pf.metodo === "efectivo" ? "Efectivo" : pf.metodo === "debito" ? "Tarjeta de débito" : pf.metodo === "credito" ? "Tarjeta de crédito" : pf.metodo === "transferencia" ? ("Transferencia" + (pf.bancoTransferencia ? " — " + pf.bancoTransferencia : "") + (pf.referencia ? " — N°" + pf.referencia : "")) : pf.metodo === "cheque_propio" ? ("Cheque propio N°" + pf.nroCheque + " — " + pf.bancoEmisor) : ("Cheque de tercero N°" + pf.nroCheque + " — " + pf.bancoEmisor + " — Emisor: " + pf.emisorCheque + " — Endosado: " + pf.fechaEndoso);
    setPurchaseInvoices(prev => prev.map(i => i.id === payingInv.id ? { ...i, status: "pagada", metodoPago: metodoPagoStr } : i));
    if (companyId) supabase.from('purchase_invoices').update({ status: 'pagada' }).eq('id', payingInv.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    if (companyId) supabase.from('purchase_invoices').update({ metodo_pago: metodoPagoStr }).eq('id', payingInv.id).then(r => { if (r?.error) console.error("DB metodo_pago Error:", r.error.message) });
    if (pf.metodo === "cheque_propio") {
      const nc = { id: crypto.randomUUID(), tipo: "pagar", numero: pf.nroCheque, fechaPago: pf.fechaPago, fechaVencimiento: pf.fechaVenc, monto: payingInv.total, emisor: "", estado: "pendiente" };
      setCheques(prev => [...prev, nc]);
      if (companyId) supabase.from('cheques').insert({ id: nc.id, company_id: companyId, tipo: nc.tipo, numero: nc.numero, fecha_pago: nc.fechaPago, fecha_vencimiento: nc.fechaVencimiento, monto: nc.monto, emisor: nc.emisor, estado: nc.estado }).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    }
    if (pf.metodo === "efectivo") {
      const cajasDelDia = (cajas || []).filter(c => String(c.date).slice(0,10) === pf.fechaPago);
      const caja = cajasDelDia.find(c => c.estado === "abierta") || cajasDelDia[cajasDelDia.length - 1];
      if (caja) {
        const mov = { id: crypto.randomUUID(), cajaId: caja.id, tipo: "gasto", monto: payingInv.total, fecha: pf.fechaPago, hora: new Date().toTimeString().slice(0,5), motivo: "Pago " + (payingInv.ref || "") + " — " + payingInv.supplierName, empleadoId: null, observaciones: "", origen: "compra", origenId: payingInv.id };
        setCajaMovimientos(prev => [...prev, mov]);
        if (companyId) supabase.from('caja_movimientos').insert(cajaMovimientoToDb(mov, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
      }
    }
    setPayingInv(null);
  };
  const markPagada = (id) => { setPurchaseInvoices(purchaseInvoices.map(i => i.id === id ? { ...i, status: "pagada" } : i)); if (companyId) supabase.from('purchase_invoices').update({ status: 'pagada' }).eq('id', id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }); };
  const unmarkPagada = (id) => {
    setPurchaseInvoices(purchaseInvoices.map(i => i.id === id ? { ...i, status: "pendiente", metodoPago: "" } : i));
    if (companyId) supabase.from('purchase_invoices').update({ status: 'pendiente', metodo_pago: null }).eq('id', id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    const mov = cajaMovimientos.find(m => m.origenId === id && m.origen === "compra");
    if (mov) {
      setCajaMovimientos(prev => prev.filter(m => m.id !== mov.id));
      if (companyId) supabase.from('caja_movimientos').delete().eq('id', mov.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    }
  };

  const handleSaveOC = ({ supplierId, supplierName, observaciones, lines, total }) => {
    const id = crypto.randomUUID();
    const ref = "OC-" + String(Date.now()).slice(-6);
    const newOC = { id, ref, supplierId, supplierName, date: today, observaciones, lines, total };
    setOrdenesCompra(prev => [newOC, ...prev]);
    if (companyId) supabase.from('ordenes_compra').insert(ordenCompraToDb(newOC, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    return newOC;
  };

  const eliminarOC = (id) => {
    if (!window.confirm("¿Eliminar esta orden de compra?")) return;
    setOrdenesCompra(prev => prev.filter(o => o.id !== id));
    if (companyId) supabase.from('ordenes_compra').delete().eq('id', id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Compras</div><div style={{ fontSize: 13, color: T.muted }}>Proveedores, facturas y listas de precios</div></div>
        <div style={{ display: "flex", gap: 8 }}>
          <Btn v="ghost" onClick={() => { setShowIAImport(true); setIaPdfResult(null); setIaPdfFile(null); setIaPdfError(""); }}>✦ Importar PDF con IA</Btn>
          <Btn v="ghost" onClick={() => setShowOCBuilder(true)}>+ Nueva orden de compra</Btn>
          <Btn onClick={onNewPurchase}>+ Nueva factura de compra</Btn>
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, marginBottom: 22, background: T.surface, borderRadius: 10, padding: 4, width: "fit-content" }}>
        {[["invoices", "Facturas a pagar"], ["orders", "Órdenes de compra"], ["suppliers", "Proveedores"], ["prices", "Listas de precios"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: tab === v ? T.paper : "transparent", color: tab === v ? T.ink : T.muted, fontWeight: tab === v ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
        ))}
      </div>

      {tab === "invoices" && (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            {[
              { l: "Total comprado mes", v: fmt(purchaseInvoices.filter(i => i.date?.startsWith("2026-03")).reduce((s, i) => s + i.total, 0)) },
              { l: "Pendiente de pago", v: fmt(purchaseInvoices.filter(i => i.status === "pendiente").reduce((s, i) => s + i.total, 0)), c: T.orange },
            ].map((k, i) => (
              <div key={i} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", flex: 1 }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>{k.l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.c || T.ink }}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
            <SearchBar value={searchInvNum} onChange={setSearchInvNum} placeholder="N° de factura..." />
            <SearchBar value={searchInvSupplier} onChange={setSearchInvSupplier} placeholder="Proveedor..." />
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              <SearchBar value={searchInvStatus} onChange={setSearchInvStatus} placeholder="Estado (pendiente / pagada)..." />
              <SearchBar value={searchInvAmount} onChange={setSearchInvAmount} placeholder="Monto..." />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4, letterSpacing: 0.8 }}>FECHA DESDE</label>
                <input type="date" value={searchInvDateFrom} onChange={e => setSearchInvDateFrom(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${searchInvDateFrom ? T.blue : T.border}`, background: T.surface, color: searchInvDateFrom ? T.ink : T.muted, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 4, letterSpacing: 0.8 }}>FECHA HASTA</label>
                <input type="date" value={searchInvDateTo} onChange={e => setSearchInvDateTo(e.target.value)}
                  style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${searchInvDateTo ? T.blue : T.border}`, background: T.surface, color: searchInvDateTo ? T.ink : T.muted, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <QuickDateFilter setFrom={setSearchInvDateFrom} setTo={setSearchInvDateTo} />
              </div>
              {(searchInvDateFrom || searchInvDateTo) && (
                <button onClick={() => { setSearchInvDateFrom(""); setSearchInvDateTo(""); }} style={{ background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 14, paddingBottom: 2 }}>✕</button>
              )}
            </div>
          </div>
          {/* Modal forma de pago — Compras */}
          {payingInv && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 480, maxWidth: "95vw" }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Registrar pago</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>{docRef(payingInv)} — {payingInv.supplierName} — <strong style={{ color: T.ink }}>{fmt(payingInv.total)}</strong></div>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FORMA DE PAGO</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[["efectivo","Efectivo"],["debito","Débito"],["credito","Crédito"],["transferencia","Transferencia"],["cheque_propio","Cheque propio"],["cheque_tercero","Cheque de tercero"]].map(([v,l]) => (
                      <button key={v} onClick={() => setPayForm(f => ({ ...f, metodo: v }))}
                        style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${payForm.metodo === v ? T.accent : T.border}`, background: payForm.metodo === v ? T.accentLight : T.surface, color: payForm.metodo === v ? T.accent : T.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                {payForm.metodo === "transferencia" && (
                  <div style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>BANCO DESTINO <span style={{ color: T.red }}>*</span></label>
                      <BancoSelect value={payForm.bancoTransferencia} onChange={v => setPayForm(f => ({ ...f, bancoTransferencia: v }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>N° TRANSFERENCIA (opcional)</label>
                      <input value={payForm.referencia} onChange={e => setPayForm(f => ({ ...f, referencia: e.target.value }))} placeholder="Ej: TRF-00123456"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                  </div>
                )}
                {payForm.metodo === "efectivo" && (
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FECHA DE PAGO</label>
                    <input type="date" value={payForm.fechaPago} onChange={e => setPayForm(f => ({ ...f, fechaPago: e.target.value }))}
                      style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    {(() => { const hay = (cajas || []).some(c => String(c.date).slice(0,10) === payForm.fechaPago); return hay ? <div style={{ fontSize: 11, color: T.accent, marginTop: 4 }}>✓ Se registrará en la caja de ese día</div> : <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Sin caja abierta para esa fecha — no se registrará movimiento</div>; })()}
                  </div>
                )}
                {(payForm.metodo === "cheque_propio" || payForm.metodo === "cheque_tercero") && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>N° DE CHEQUE <span style={{ color: T.red }}>*</span></label>
                      <input value={payForm.nroCheque} onChange={e => setPayForm(f => ({ ...f, nroCheque: e.target.value }))} placeholder="00001234"
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>BANCO EMISOR <span style={{ color: T.red }}>*</span></label>
                      <BancoSelect value={payForm.bancoEmisor} onChange={v => setPayForm(f => ({ ...f, bancoEmisor: v }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FECHA DE PAGO <span style={{ color: T.red }}>*</span></label>
                      <input type="date" value={payForm.fechaPago} onChange={e => setPayForm(f => ({ ...f, fechaPago: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FECHA DE VENCIMIENTO <span style={{ color: T.red }}>*</span></label>
                      <input type="date" value={payForm.fechaVenc} onChange={e => setPayForm(f => ({ ...f, fechaVenc: e.target.value }))}
                        style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    {payForm.metodo === "cheque_tercero" && (<>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>EMISOR DEL CHEQUE <span style={{ color: T.red }}>*</span></label>
                        <input value={payForm.emisorCheque} onChange={e => setPayForm(f => ({ ...f, emisorCheque: e.target.value }))} placeholder="Razón social del emisor original"
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                      </div>
                      <div style={{ gridColumn: "span 2" }}>
                        <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>FECHA DE ENDOSO <span style={{ color: T.red }}>*</span></label>
                        <input type="date" value={payForm.fechaEndoso} onChange={e => setPayForm(f => ({ ...f, fechaEndoso: e.target.value }))}
                          style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                      </div>
                    </>)}
                    <div style={{ gridColumn: "span 2" }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, display: "block", marginBottom: 6 }}>MONTO</label>
                      <div style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, fontSize: 13, fontFamily: "monospace" }}>{fmt(payingInv.total)} (cargado automáticamente)</div>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 8 }}>
                  <Btn v="ghost" onClick={() => setPayingInv(null)}>Cancelar</Btn>
                  <Btn onClick={confirmPayCompra}>Confirmar pago</Btn>
                </div>
              </div>
            </div>
          )}

          {/* Modal detalle — Compras */}
          {editingOC && (
            <Modal title={`Editar OC · ${editingOC.ref}`} onClose={() => setEditingOC(null)}>
              <div style={{ display: "grid", gap: 14 }}>
                <Input label="FECHA" type="date" value={(editingOC.date || "").slice(0,10)} onChange={v => setEditingOC(o => ({...o, date: v}))} />
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>OBSERVACIONES</label>
                  <textarea value={editingOC.observaciones || ""} onChange={e => setEditingOC(o => ({...o, observaciones: e.target.value}))} rows={3} style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <Btn v="ghost" onClick={() => setEditingOC(null)}>Cancelar</Btn>
                  <Btn onClick={saveEditOC}>Guardar cambios</Btn>
                </div>
              </div>
            </Modal>
          )}

          {editingSup && (
            <Modal title={`Editar proveedor · ${editingSup.name}`} onClose={() => setEditingSup(null)}>
              <div style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  {[["name","NOMBRE"], ["cuit","CUIT"], ["contact","CONTACTO"], ["email","EMAIL"], ["phone","TELÉFONO"], ["bank","BANCO"]].map(([k, l]) => (
                    <Input key={k} label={l} value={editingSup[k] || ""} onChange={v => setEditingSup(s => ({...s, [k]: v}))} />
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="DÍAS DE PAGO" type="number" value={editingSup.paymentDays || 0} onChange={v => setEditingSup(s => ({...s, paymentDays: parseInt(v) || 0}))} />
                  <Input label="CBU" value={editingSup.cbu || ""} onChange={v => setEditingSup(s => ({...s, cbu: v}))} mono />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                  <Input label="DIRECCIÓN" value={editingSup.direccion || ""} onChange={v => setEditingSup(s => ({...s, direccion: v}))} />
                  <Input label="ABRE" type="time" value={editingSup.horarioAbre || ""} onChange={v => setEditingSup(s => ({...s, horarioAbre: v}))} />
                  <Input label="CIERRA" type="time" value={editingSup.horarioCierra || ""} onChange={v => setEditingSup(s => ({...s, horarioCierra: v}))} />
                  <Input label="DÍAS" value={editingSup.diasDisponibles || ""} onChange={v => setEditingSup(s => ({...s, diasDisponibles: v}))} />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <Btn v="ghost" onClick={() => setEditingSup(null)}>Cancelar</Btn>
                  <Btn onClick={saveEditSup}>Guardar cambios</Btn>
                </div>
              </div>
            </Modal>
          )}

          {editingPurchaseInv && (
            <Modal title={`Editar · ${editingPurchaseInv.ref}`} onClose={() => setEditingPurchaseInv(null)}>
              <div style={{ display: "grid", gap: 14 }}>
                <Input label="N° FACTURA PROVEEDOR" value={editingPurchaseInv.nroFactura || ""} onChange={v => setEditingPurchaseInv(p => ({...p, nroFactura: v}))} placeholder="ej: 0001-00012345" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <Input label="FECHA" type="date" value={(editingPurchaseInv.date || "").slice(0,10)} onChange={v => setEditingPurchaseInv(p => ({...p, date: v}))} />
                  <Input label="VENCIMIENTO" type="date" value={(editingPurchaseInv.dueDate || "").slice(0,10)} onChange={v => setEditingPurchaseInv(p => ({...p, dueDate: v}))} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>OBSERVACIONES</label>
                  <textarea value={editingPurchaseInv.observaciones || ""} onChange={e => setEditingPurchaseInv(p => ({...p, observaciones: e.target.value}))} rows={3} style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <Btn v="ghost" onClick={() => setEditingPurchaseInv(null)}>Cancelar</Btn>
                  <Btn onClick={saveEditPurchase}>Guardar cambios</Btn>
                </div>
              </div>
            </Modal>
          )}

          {viewingInv && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, width: 700, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color: T.orange }}>{docRef(viewingInv)}</div>
                    {viewingInv.nroFactura && <div style={{ fontFamily: "monospace", fontSize: 13, color: T.muted, marginTop: 2 }}>{viewingInv.nroFactura}</div>}
                    <div style={{ marginTop: 6 }}><Badge status={viewingInv.status} /></div>
                  </div>
                  <button onClick={() => setViewingInv(null)} style={{ background: "none", border: "none", color: T.muted, fontSize: 20, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                  <div style={{ background: T.surface, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 10 }}>PROVEEDOR</div>
                    {[["Nombre", viewingInv.supplierName], ["Fecha", viewingInv.date], ["Vencimiento", viewingInv.dueDate || "—"]].map(([l,v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ background: T.surface, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 10 }}>TOTALES</div>
                    {[["Neto", fmt(viewingInv.totalNeto || 0)], ["IVA", fmt(viewingInv.totalIva || 0)], ["Total", fmt(viewingInv.total)]].map(([l,v]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                        <span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: l === "Total" ? 800 : 600, color: l === "Total" ? T.accent : T.ink }}>{v}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 6 }}>FORMA DE PAGO</div>
                      {viewingInv.status !== "pagada" ? (
                        <div style={{ fontSize: 13, color: T.muted, fontStyle: "italic" }}>Aún no pagado</div>
                      ) : (() => {
                        const mp = viewingInv.metodoPago || ""
                        const row = (l, v) => <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: T.muted }}>{l}</span><span style={{ fontWeight: 600 }}>{v}</span></div>
                        if (mp === "Efectivo") return <div style={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>✓ Pagado en efectivo</div>
                        if (mp === "Tarjeta de débito") return <div style={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>✓ Pagado con tarjeta de débito</div>
                        if (mp === "Tarjeta de crédito") return <div style={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>✓ Pagado con tarjeta de crédito</div>
                        if (mp.startsWith("Transferencia")) {
                          const ref = mp.includes(" — ") ? mp.split(" — ").slice(1).join(" — ") : null
                          return <>{row("Método", "Transferencia")}{ref && row("Referencia", ref)}</>
                        }
                        if (mp.startsWith("Cheque propio")) {
                          const nro = mp.replace("Cheque propio N°", "").split(" — ")[0]
                          const banco = mp.split(" — ")[1] || ""
                          return <>{row("Tipo", "Cheque propio")}{row("N° cheque", nro)}{row("Banco", banco)}</>
                        }
                        if (mp.startsWith("Cheque de tercero")) {
                          const parts = mp.replace("Cheque de tercero N°", "").split(" — ")
                          return <>{row("Tipo", "Cheque de tercero")}{row("N° cheque", parts[0] || "")}{row("Banco", parts[1] || "")}{parts[2] && row("Emisor", parts[2].replace("Emisor: ", ""))}{parts[3] && row("Fecha de endoso", parts[3].replace("Endosado: ", ""))}</>
                        }
                        return <div style={{ fontSize: 13, color: T.accent, fontWeight: 600 }}>{mp}</div>
                      })()}
                    </div>
                  </div>
                </div>
                <div style={{ background: T.surface, borderRadius: 10, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 10 }}>ARTÍCULOS</div>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr>{["Descripción","Cód. proveedor","Cantidad","Precio unit.","Subtotal"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, borderBottom: `1px solid ${T.border}` }}>{h}</th>)}</tr></thead>
                    <tbody>{(viewingInv.lines || []).map((l, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: "9px 10px", fontSize: 13 }}>{l.name}</td>
                        <td style={{ padding: "9px 10px", fontSize: 12, fontFamily: "monospace", color: T.muted }}>{l.supplierCode || "—"}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right" }}>{l.qty}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, fontFamily: "monospace", textAlign: "right" }}>{fmt(l.unitPrice)}</td>
                        <td style={{ padding: "9px 10px", fontSize: 13, fontFamily: "monospace", fontWeight: 700, textAlign: "right" }}>{fmt(l.qty * l.unitPrice)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                {viewingInv.observaciones && (
                  <div style={{ background: T.surface, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 6 }}>OBSERVACIONES</div>
                    <div style={{ fontSize: 13, color: T.ink }}>{viewingInv.observaciones}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 760 }}>
              <thead><tr style={{ background: T.surface }}>{["Número", "Proveedor", "Fecha", "Vencimiento", "Total", "Estado", "Acciones"].map(h => <th key={h} style={{ padding: "11px 15px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
              <tbody>{filteredInvoices.map(inv => (
                <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 15px" }}>
                    <div style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.orange }}>{docRef(inv)}</div>
                    {inv.nroFactura && <div style={{ fontFamily: "monospace", fontSize: 11, color: T.muted, marginTop: 2 }}>{inv.nroFactura}</div>}
                  </td>
                  <td style={{ padding: "12px 15px", fontSize: 13, fontWeight: 600 }}>{inv.supplierName}</td>
                  <td style={{ padding: "12px 15px", fontSize: 12, color: T.muted }}>{inv.date}</td>
                  <td style={{ padding: "12px 15px", fontSize: 12, color: inv.status === "pendiente" ? T.yellow : T.muted }}>{inv.dueDate}</td>
                  <td style={{ padding: "12px 15px", fontSize: 14, fontWeight: 800 }}>{fmt(inv.total)}</td>
                  <td style={{ padding: "12px 15px" }}><Badge status={inv.status} /></td>
                  <td style={{ padding: "12px 15px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Btn sm v="ghost" onClick={() => setViewingInv(inv)}>👁 Ver</Btn>
                      {inv.status === "pendiente" && <Btn sm v="ghost" onClick={() => openPayModalCompra(inv)}>Marcar pagada</Btn>}
                      {inv.status === "pagada" && <Btn sm v="ghost" onClick={() => unmarkPagada(inv.id)}>↩ Revertir a pendiente</Btn>}
                      <Btn sm v="ghost" onClick={() => openEditPurchase(inv)}>✏ Editar</Btn>
                      <Btn sm v="danger" onClick={() => deletePurchaseInv(inv)}>Eliminar</Btn>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {tab === "suppliers" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 14, alignItems: "flex-end" }}>
            <SearchBar value={searchSupName} onChange={setSearchSupName} placeholder="Nombre..." />
            <SearchBar value={searchSupCuit} onChange={setSearchSupCuit} placeholder="CUIT..." />
            <Btn sm onClick={() => setShowSupForm(true)}>+ Nuevo proveedor</Btn>
          </div>
          {showSupForm && (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Nuevo proveedor</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 14 }}>
                {[["name","NOMBRE"], ["cuit","CUIT"], ["contact","CONTACTO"], ["email","EMAIL"], ["phone","TELÉFONO"], ["bank","BANCO"]].map(([k, l]) => <Input key={k} label={l} value={supForm[k] || ""} onChange={v => setSupForm(f => ({ ...f, [k]: v }))} />)}
                <Input label="DÍAS DE PAGO" type="number" value={supForm.paymentDays} onChange={v => setSupForm(f => ({ ...f, paymentDays: parseInt(v) || 0 }))} />
                <Input label="CBU" value={supForm.cbu || ""} onChange={v => setSupForm(f => ({ ...f, cbu: v }))} mono />
              </div>
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 14, marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>LOGÍSTICA · DIRECCIÓN Y HORARIOS</div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 12 }}>
                  <Input label="DIRECCIÓN" value={supForm.direccion || ""} onChange={v => setSupForm(f => ({ ...f, direccion: v }))} />
                  <Input label="ABRE" type="time" value={supForm.horarioAbre || ""} onChange={v => setSupForm(f => ({ ...f, horarioAbre: v }))} />
                  <Input label="CIERRA" type="time" value={supForm.horarioCierra || ""} onChange={v => setSupForm(f => ({ ...f, horarioCierra: v }))} />
                  <Input label="DÍAS" value={supForm.diasDisponibles || ""} onChange={v => setSupForm(f => ({ ...f, diasDisponibles: v }))} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn v="ghost" sm onClick={() => setShowSupForm(false)}>Cancelar</Btn>
                <Btn sm onClick={() => { const ns = { ...supForm, id: crypto.randomUUID(), productCodes: [] }; setSuppliers([...suppliers, ns]); if (companyId) supabase.from('suppliers').insert(supplierToDb(ns, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }); setShowSupForm(false); setSupForm({ name: "", cuit: "", contact: "", email: "", phone: "", paymentDays: 30, bank: "", cbu: "", direccion: "", horarioAbre: "", horarioCierra: "", diasDisponibles: "Lun-Vie" }); }}>Guardar</Btn>
              </div>
            </div>
          )}
          <div style={{ display: "grid", gap: 10 }}>
            {filteredSuppliers.map(s => {
              const pending = purchaseInvoices.filter(i => i.supplierId === s.id && i.status === "pendiente").reduce((sum, i) => sum + i.total, 0);
              return (
                <div key={s.id} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr auto", gap: 12, alignItems: "center" }}>
                  <div><div style={{ fontSize: 14, fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 12, color: T.muted }}>CUIT: {s.cuit} · {s.contact}</div></div>
                  <div style={{ fontSize: 12, color: T.muted }}>{s.paymentDays === 0 ? "Contado" : `${s.paymentDays} días`}</div>
                  <div style={{ fontSize: 12 }}>{s.productCodes.length} producto(s)</div>
                  <div style={{ fontWeight: 700, color: pending > 0 ? T.orange : T.muted, textAlign: "right" }}>{pending > 0 ? fmt(pending) : "Sin deuda"}</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Btn sm v="ghost" onClick={() => setEditingSup({ ...s })}>✏ Editar</Btn>
                    <Btn sm v="danger" onClick={() => deleteSup(s)}>Eliminar</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {tab === "prices" && (
        <PriceListsTab products={products} setProducts={setProducts} priceLists={priceLists} setPriceLists={setPriceLists} companyId={companyId} />
      )}

      {tab === "orders" && (
        <>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            {[
              { l: "Total de órdenes", v: (ordenesCompra || []).length, c: T.ink },
              { l: "Total comprometido", v: fmt((ordenesCompra || []).reduce((s, o) => s + o.total, 0)), c: T.orange },
            ].map((k, i) => (
              <div key={i} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", flex: 1 }}>
                <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 6 }}>{k.l}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: k.c }}>{k.v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>{["Referencia", "Proveedor", "Fecha", "Total c/IVA", ""].map(h => <th key={h} style={{ padding: "11px 15px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
              <tbody>{(ordenesCompra || []).length === 0 ? (
                <tr><td colSpan={5} style={{ padding: "32px 15px", textAlign: "center", color: T.muted, fontSize: 13 }}>No hay órdenes de compra. Creá la primera con "+ Nueva orden de compra".</td></tr>
              ) : (ordenesCompra || []).map(oc => (
                <tr key={oc.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "12px 15px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.orange }}>{oc.ref}</td>
                  <td style={{ padding: "12px 15px", fontSize: 13, fontWeight: 600 }}>{oc.supplierName}</td>
                  <td style={{ padding: "12px 15px", fontSize: 12, color: T.muted }}>{oc.date}</td>
                  <td style={{ padding: "12px 15px", fontSize: 14, fontWeight: 800 }}>{fmt(oc.total)}</td>
                  <td style={{ padding: "12px 15px" }}>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Btn sm v="ghost" onClick={() => imprimirOC(oc)}>⬡ PDF</Btn>
                      <Btn sm v="ghost" onClick={() => setEditingOC({ ...oc })}>✏ Editar</Btn>
                      <Btn sm v="danger" onClick={() => { if (window.confirm(`¿Eliminar la orden ${oc.ref}?\nEsta acción no se puede deshacer.`)) eliminarOC(oc.id); }}>Eliminar</Btn>
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>
      )}

      {showOCBuilder && <OrdenCompraBuilder suppliers={suppliers} products={products} onSave={handleSaveOC} onClose={() => setShowOCBuilder(false)} />}

      {/* Modal IA PDF Import */}
      {showIAImport && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: T.paper, borderRadius: 18, padding: 32, width: 580, maxWidth: "95vw", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>✦ Importar factura con IA</div>
              <button onClick={() => setShowIAImport(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: T.muted }}>✕</button>
            </div>

            {/* API Key */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>API KEY DE ANTHROPIC</label>
              <input type="password" value={iaApiKey} onChange={e => saveApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${iaApiKey ? T.accent : T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
              <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>Se guarda localmente en tu navegador. Obtené tu key en console.anthropic.com</div>
            </div>

            {/* File Upload */}
            {!iaPdfResult && (
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 6, letterSpacing: 1 }}>FACTURA EN PDF</label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 10, border: `2px dashed ${iaPdfFile ? T.accent : T.border}`, background: T.surface, cursor: "pointer" }}>
                  <span style={{ fontSize: 24 }}>📄</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: iaPdfFile ? T.ink : T.muted }}>{iaPdfFile ? iaPdfFile.name : "Hacer clic para seleccionar PDF"}</div>
                    {iaPdfFile && <div style={{ fontSize: 11, color: T.muted }}>{(iaPdfFile.size / 1024).toFixed(0)} KB</div>}
                  </div>
                  <input type="file" accept="application/pdf" onChange={e => { setIaPdfFile(e.target.files[0] || null); setIaPdfResult(null); setIaPdfError(""); }} style={{ display: "none" }} />
                </label>
              </div>
            )}

            {iaPdfError && <div style={{ background: T.redLight, color: T.red, borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 14 }}>⚠ {iaPdfError}</div>}

            {/* Loading */}
            {iaPdfLoading && (
              <div style={{ textAlign: "center", padding: "32px 0" }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>⏳</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>Leyendo la factura...</div>
                <div style={{ fontSize: 12, color: T.muted, marginTop: 6 }}>La IA está extrayendo los datos del PDF</div>
              </div>
            )}

            {/* Preview resultado */}
            {iaPdfResult && !iaPdfLoading && (
              <div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16, marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 12, letterSpacing: 0.8 }}>DATOS EXTRAÍDOS</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                    {[
                      ["Proveedor", iaPdfResult.proveedor],
                      ["CUIT", iaPdfResult.cuitProveedor],
                      ["N° Factura", iaPdfResult.nroFactura],
                      ["Fecha", iaPdfResult.fecha],
                      ["Vencimiento", iaPdfResult.vencimiento],
                      ["Cond. de pago", iaPdfResult.condicionPago],
                      ["Vendedor", iaPdfResult.vendedor],
                      ["Total", "$" + (iaPdfResult.total || 0).toLocaleString("es-AR")],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k} style={{ fontSize: 12 }}>
                        <span style={{ color: T.muted }}>{k}: </span>
                        <span style={{ fontWeight: 700, color: T.ink }}>{v}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 8, letterSpacing: 0.8 }}>ÍTEMS ({(iaPdfResult.items || []).length})</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                    <thead><tr style={{ background: T.surface2 }}>
                      {["Código", "Descripción", "Cant.", "P. Unit.", "Importe"].map(h => <th key={h} style={{ padding: "5px 8px", textAlign: "left", color: T.muted, fontWeight: 700 }}>{h}</th>)}
                    </tr></thead>
                    <tbody>{(iaPdfResult.items || []).map((it, i) => (
                      <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: "5px 8px", fontFamily: "monospace", fontSize: 10 }}>{it.codigo}</td>
                        <td style={{ padding: "5px 8px" }}>{it.descripcion}</td>
                        <td style={{ padding: "5px 8px" }}>{it.cantidad}</td>
                        <td style={{ padding: "5px 8px" }}>${(it.precioUnitario || 0).toLocaleString("es-AR")}</td>
                        <td style={{ padding: "5px 8px", fontWeight: 700 }}>${(it.importe || 0).toLocaleString("es-AR")}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                  <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${T.border}`, display: "flex", justifyContent: "flex-end", gap: 20, fontSize: 12 }}>
                    <span style={{ color: T.muted }}>Subtotal: <strong>${(iaPdfResult.subtotal || 0).toLocaleString("es-AR")}</strong></span>
                    <span style={{ color: T.muted }}>IVA 21%: <strong>${(iaPdfResult.iva21 || 0).toLocaleString("es-AR")}</strong></span>
                    {iaPdfResult.percepciones > 0 && <span style={{ color: T.muted }}>Percepciones: <strong>${(iaPdfResult.percepciones || 0).toLocaleString("es-AR")}</strong></span>}
                    <span style={{ color: T.ink, fontWeight: 800, fontSize: 14 }}>Total: ${(iaPdfResult.total || 0).toLocaleString("es-AR")}</span>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>
                  Si el proveedor no existe en el sistema se creará automáticamente con los datos del PDF.
                </div>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn v="ghost" onClick={() => { setShowIAImport(false); setIaPdfFile(null); setIaPdfResult(null); }}>Cancelar</Btn>
              {!iaPdfResult
                ? <Btn disabled={!iaPdfFile || iaPdfLoading} onClick={procesarPDFconIA}>✦ Analizar PDF</Btn>
                : <Btn onClick={confirmarImportacion}>✓ Confirmar e importar</Btn>
              }
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODULE: INVENTARIO ───────────────────────────────────────────────────────
const EMPTY_FORM = { name: "", sku: "", category: "", unit: "unidad", minStock: 10, cost: 0, iva: 21, tracksStock: true, prices: { lista_a: 0, lista_b: 0, lista_c: 0 }, clientCodes: [], esCompuesto: false, componentes: [] };

function InventarioModule({ products, setProducts, clients, suppliers, priceLists, companyId }) {
  const [showForm, setShowForm] = useState(false);
  const [adjustProd, setAdjustProd] = useState(null);
  const [adjustQty, setAdjustQty] = useState(0);
  const [adjustType, setAdjustType] = useState("add");
  const [adjustNote, setAdjustNote] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");

  // client-code row being built inside the form
  const [ccClient, setCcClient] = useState("");
  const [ccCode, setCcCode] = useState("");

  const filtered = useMemo(() => products.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s) ||
      (p.clientOverrides || []).some(o => o.customCode?.toLowerCase().includes(s));
  }), [products, search]);

  const doAdjust = () => {
    const qty = parseFloat(adjustQty) || 0;
    const newStock = Math.max(0, adjustType === "add" ? adjustProd.stock + qty : adjustProd.stock - qty);
    setProducts(products.map(p => p.id === adjustProd.id ? { ...p, stock: newStock } : p));
    if (companyId) supabase.from('products').update({ stock: newStock }).eq('id', adjustProd.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    setAdjustProd(null); setAdjustQty(0); setAdjustNote("");
  };

  const addClientCode = () => {
    if (!ccClient || !ccCode.trim()) return;
    if (form.clientCodes.some(r => r.clientId === ccClient)) return; // ya existe
    setForm(f => ({ ...f, clientCodes: [...f.clientCodes, { clientId: ccClient, customCode: ccCode.trim(), sku: f.sku }] }));
    setCcClient(""); setCcCode("");
  };

  const removeClientCode = (clientId) => setForm(f => ({ ...f, clientCodes: f.clientCodes.filter(r => r.clientId !== clientId) }));

  const addProduct = () => {
    const overrides = form.clientCodes.map(r => ({ clientId: r.clientId, customCode: r.customCode, skuRef: form.sku }));
    const finalPrices = form.esCompuesto ? preciosCompuesto : form.prices;
    const np = { ...form, prices: finalPrices, id: crypto.randomUUID(), stock: 0, clientOverrides: overrides };
    setProducts([...products, np]);
    if (companyId) supabase.from('products').insert(productToDb(np, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    setShowForm(false);
    setForm(EMPTY_FORM);
    setCcClient(""); setCcCode("");
  };

  // Precios calculados para producto compuesto (actualizados en cada render con form actual)
  const preciosCompuesto = (() => {
    const result = {};
    initPriceLists.forEach(pl => {
      result[pl.id] = form.componentes.reduce((sum, c) => {
        const p = products.find(x => x.id === c.productId);
        return sum + (p?.prices?.[pl.id] || 0) * (c.qty || 1);
      }, 0);
    });
    return result;
  })();
  const faltantesCompuesto = form.componentes.flatMap(c => {
    const p = products.find(x => x.id === c.productId);
    return initPriceLists.filter(pl => !(p?.prices?.[pl.id] > 0)).map(pl => ({ nombre: p?.name || "?", lista: pl.label }));
  });
  const compuestoInvalido = form.esCompuesto && (form.componentes.length === 0 || faltantesCompuesto.length > 0);

  const critical = products.filter(p => p.tracksStock !== false && p.stock < p.minStock);

  // ── Importación masiva ─────────────────────────────────────────────────────
  const [importMsg, setImportMsg] = useState(null);
  const [dupConfirm, setDupConfirm] = useState(null); // { pending: [...], ccRows: [...] }
  const [editingProduct, setEditingProduct] = useState(null); // producto a editar

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Hoja 1: Productos
    const prodData = [
      ["SKU", "Nombre", "Categoría", "Unidad", "IVA (%)", "Sin stock (S/N)", "Stock inicial", "Stock mínimo", "Costo (ARS)", "Precio Lista A (ARS)", "Precio Lista A (USD)"],
      ["PROD-001", "Ejemplo Producto", "General", "unidad", 21, "N", 10, 2, 1500, 2500, 0],
      ["PROD-002", "Ejemplo Servicio", "Servicios", "hora", 21, "S", 0, 0, 0, 5000, 0],
    ];
    const wsProd = XLSX.utils.aoa_to_sheet(prodData);
    wsProd["!cols"] = [10,30,16,10,10,16,14,14,14,20,20].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsProd, "Productos");

    // Hoja 2: Códigos clientes
    const ccData = [
      ["SKU producto", "Código o nombre del cliente", "Código personalizado", "Precio fijo (opcional)", "Descuento % (opcional)"],
      ["PROD-001", "cliente-ejemplo", "PROV-X-001", "", ""],
    ];
    const wsCC = XLSX.utils.aoa_to_sheet(ccData);
    wsCC["!cols"] = [14,26,22,20,22].map(w => ({ wch: w }));
    XLSX.utils.book_append_sheet(wb, wsCC, "Codigos clientes");

    XLSX.writeFile(wb, "plantilla_inventario.xlsx");
  };

  const applyImport = (prodRows, ccRows, skipSkus) => {
    let created = 0; let updated = 0; let skipped = 0;
    setProducts(prev => {
      const next = [...prev];
      prodRows.forEach(row => {
        const sku = String(row[0] || "").trim();
        const name = String(row[1] || "").trim();
        if (!sku || !name) return;
        if (skipSkus.includes(sku)) { skipped++; return; }
        const category = String(row[2] || "").trim();
        const unit = String(row[3] || "unidad").trim();
        const ivaRaw = parseFloat(String(row[4] || "21").replace(",", "."));
        const iva = [21, 10.5].includes(ivaRaw) ? ivaRaw : 21;
        const tracksStock = String(row[5] || "P").trim().toUpperCase() !== "S";
        const stockInit = tracksStock ? (parseFloat(row[6]) || 0) : 0;
        const minStock = tracksStock ? (parseFloat(row[7]) || 0) : 0;
        const cost = parseFloat(String(row[8] || "0").replace(",", ".")) || 0;
        const priceArs = parseFloat(String(row[9] || "0").replace(",", ".")) || 0;
        const priceUsd = parseFloat(String(row[10] || "0").replace(",", ".")) || 0;
        const existing = next.findIndex(p => p.sku === sku);
        if (existing >= 0) {
          next[existing] = {
            ...next[existing], name, category, unit, iva, tracksStock, minStock, cost,
            prices: priceArs > 0 ? { ...next[existing].prices, lista_a: priceArs } : next[existing].prices,
            pricesUsd: priceUsd > 0 ? { ...(next[existing].pricesUsd || {}), lista_a: priceUsd } : (next[existing].pricesUsd || {}),
          };
          updated++;
        } else {
          next.push({
            id: crypto.randomUUID(),
            sku, name, category, unit, iva, tracksStock,
            stock: stockInit, minStock, cost,
            prices: { lista_a: priceArs, lista_b: 0, lista_c: 0 },
            pricesUsd: { lista_a: priceUsd, lista_b: 0, lista_c: 0 },
            clientOverrides: [],
          });
          created++;
        }
      });
      ccRows.forEach(row => {
        const sku = String(row[0] || "").trim();
        const clientRef = String(row[1] || "").trim().toLowerCase();
        const customCode = String(row[2] || "").trim();
        const fixedPrice = row[3] !== "" && row[3] != null ? parseFloat(String(row[3]).replace(",", ".")) : null;
        const discount = row[4] !== "" && row[4] != null ? parseFloat(String(row[4]).replace(",", ".")) : null;
        const prodIdx = next.findIndex(p => p.sku === sku);
        if (prodIdx === -1) return;
        const client = clients.find(c => c.codigo?.toLowerCase() === clientRef || c.name?.toLowerCase() === clientRef);
        if (!client) return;
        const overrides = [...(next[prodIdx].clientOverrides || [])];
        const ovIdx = overrides.findIndex(o => o.clientId === client.id);
        const newOv = { clientId: client.id, customCode, ...(fixedPrice != null && !isNaN(fixedPrice) ? { price: fixedPrice } : {}), ...(discount != null && !isNaN(discount) ? { discount } : {}) };
        if (ovIdx >= 0) overrides[ovIdx] = newOv; else overrides.push(newOv);
        next[prodIdx] = { ...next[prodIdx], clientOverrides: overrides };
      });
      // Sync to DB
      if (companyId) next.forEach(p => supabase.from('products').upsert(productToDb(p, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }));
      return next;
    });
    const parts = [];
    if (created > 0) parts.push(created + " creado(s)");
    if (updated > 0) parts.push(updated + " actualizado(s)");
    if (skipped > 0) parts.push(skipped + " omitido(s) por duplicado");
    if (ccRows.length > 0) parts.push(ccRows.length + " código(s) de cliente");
    setImportMsg({ type: "ok", text: parts.join(" · ") || "Sin cambios." });
  };

  const handleBulkImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: "binary" });
        const wsProd = wb.Sheets["Productos"] || wb.Sheets[wb.SheetNames[0]];
        const prodRows = XLSX.utils.sheet_to_json(wsProd, { header: 1 }).slice(1).filter(r => r[0] && r[1]);
        const wsCC = wb.Sheets["Codigos clientes"] || wb.Sheets["Códigos clientes"];
        const ccRows = wsCC ? XLSX.utils.sheet_to_json(wsCC, { header: 1 }).slice(1).filter(r => r[0] && r[1] && r[2]) : [];
        // Detectar duplicados
        const duplicates = prodRows.filter(row => {
          const sku = String(row[0] || "").trim();
          return products.some(p => p.sku === sku);
        });
        if (duplicates.length > 0) {
          setDupConfirm({ prodRows, ccRows, duplicates });
        } else {
          applyImport(prodRows, ccRows, []);
        }
      } catch {
        setImportMsg({ type: "error", text: "Error al leer el archivo. Verificá que uses la plantilla correcta." });
      }
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Inventario</div>
          <div style={{ fontSize: 13, color: T.muted }}>
            {products.length} items · {critical.length > 0
              ? <span style={{ color: T.red }}>{critical.length} con stock crítico</span>
              : "todo en orden"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={downloadTemplate} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.accent}40`, background: T.accentLight, color: T.accent, fontSize: 12, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5, fontFamily: "inherit" }}>
            ⬇ Plantilla Excel
          </button>
          <label style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.blue}40`, background: T.blueLight, color: T.blue, fontSize: 12, cursor: "pointer", fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            📥 Importar masivo
            <input type="file" accept=".xlsx,.xls,.csv" onChange={handleBulkImport} style={{ display: "none" }} />
          </label>
          <Btn onClick={() => setShowForm(true)}>+ Nuevo producto</Btn>
        </div>
      </div>

      {/* Modal confirmación duplicados */}
      {dupConfirm && (
        <Modal title="SKUs duplicados detectados" onClose={() => setDupConfirm(null)} wide>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>
            Los siguientes SKUs ya existen en el sistema. Confirmá cuáles querés sobreescribir:
          </div>
          <div style={{ background: T.surface, borderRadius: 10, padding: 14, marginBottom: 18, maxHeight: 260, overflowY: "auto" }}>
            {dupConfirm.duplicates.map(row => {
              const sku = String(row[0]).trim();
              const existing = products.find(p => p.sku === sku);
              return (
                <div key={sku} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${T.border}` }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.yellow }}>{sku}</span>
                    <span style={{ fontSize: 12, color: T.muted, marginLeft: 10 }}>En sistema: <span style={{ color: T.ink }}>{existing?.name}</span></span>
                    <span style={{ fontSize: 11, color: T.blue, marginLeft: 10 }}>→ Excel: <span style={{ color: T.ink }}>{String(row[1])}</span></span>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: T.muted, marginBottom: 18, lineHeight: 1.7 }}>
            <strong style={{ color: T.ink }}>Reemplazar:</strong> sobreescribe nombre, categoría, IVA y tipo. Los precios y códigos de cliente existentes se conservan.<br />
            <strong style={{ color: T.ink }}>Omitir duplicados:</strong> procesa solo los artículos nuevos, ignora los que ya existen.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn v="ghost" onClick={() => setDupConfirm(null)}>Cancelar todo</Btn>
            <button onClick={() => { const { prodRows, ccRows } = dupConfirm; setDupConfirm(null); applyImport(prodRows, ccRows, dupConfirm.duplicates.map(r => String(r[0]).trim())); }}
              style={{ padding: "9px 18px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Omitir duplicados
            </button>
            <Btn onClick={() => { const { prodRows, ccRows } = dupConfirm; setDupConfirm(null); applyImport(prodRows, ccRows, []); }}>
              Reemplazar todos
            </Btn>
          </div>
        </Modal>
      )}

      {/* Modal editar producto */}
      {editingProduct && (
        <Modal title={"Editar · " + editingProduct.name} onClose={() => setEditingProduct(null)} xl>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 18 }}>
            <div style={{ gridColumn: "span 2" }}>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>NOMBRE <span style={{ color: T.accent }}>*</span></label>
              <input value={editingProduct.name} onChange={e => setEditingProduct(p => ({...p, name: e.target.value}))}
                style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>SKU <span style={{ color: T.accent }}>*</span></label>
              <input value={editingProduct.sku} onChange={e => setEditingProduct(p => ({...p, sku: e.target.value}))}
                style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
            </div>
            <Input label="CATEGORÍA" value={editingProduct.category || ""} onChange={v => setEditingProduct(p => ({...p, category: v}))} />
            <Input label="UNIDAD" value={editingProduct.unit || ""} onChange={v => setEditingProduct(p => ({...p, unit: v}))} />
            <Input label="COSTO ($)" type="number" value={editingProduct.cost || 0} onChange={v => setEditingProduct(p => ({...p, cost: parseFloat(v) || 0}))} />
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 8, letterSpacing: 1 }}>ALÍCUOTA IVA</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[21, 10.5].map(rate => (
                <button key={rate} onClick={() => setEditingProduct(p => ({...p, iva: rate}))}
                  style={{ padding: "9px 20px", borderRadius: 8, border: `2px solid ${editingProduct.iva === rate ? T.yellow : T.border}`, background: editingProduct.iva === rate ? T.yellowLight : T.surface, color: editingProduct.iva === rate ? T.yellow : T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  {rate}%
                </button>
              ))}
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 8, letterSpacing: 1 }}>MANEJO DE STOCK</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[[true, "📦 Producto", T.accent, T.accentLight], [false, "🔧 Servicio", T.purple, T.purpleLight]].map(([val, label, col, bg]) => (
                <button key={String(val)} onClick={() => setEditingProduct(p => ({...p, tracksStock: val}))}
                  style={{ padding: "10px 20px", borderRadius: 9, border: `2px solid ${editingProduct.tracksStock === val ? col : T.border}`, background: editingProduct.tracksStock === val ? bg : T.surface, color: editingProduct.tracksStock === val ? col : T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  {label}
                </button>
              ))}
            </div>
            {editingProduct.tracksStock && (
              <div style={{ marginTop: 10, maxWidth: 200 }}>
                <Input label="STOCK MÍNIMO" type="number" value={editingProduct.minStock || 0} onChange={v => setEditingProduct(p => ({...p, minStock: parseInt(v) || 0}))} />
              </div>
            )}
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>PRECIOS DE VENTA (S/IVA)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {(priceLists || initPriceLists).map(pl => (
                <Input key={pl.id} label={pl.label.toUpperCase() + " · ARS"} type="number"
                  value={editingProduct.prices?.[pl.id] || 0}
                  onChange={v => setEditingProduct(p => ({...p, prices: {...(p.prices||{}), [pl.id]: parseFloat(v)||0}}))} />
              ))}
              {(priceLists || initPriceLists).map(pl => (
                <Input key={pl.id + "_usd"} label={pl.label.toUpperCase() + " · USD"} type="number"
                  value={editingProduct.pricesUsd?.[pl.id] || 0}
                  onChange={v => setEditingProduct(p => ({...p, pricesUsd: {...(p.pricesUsd||{}), [pl.id]: parseFloat(v)||0}}))} />
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn v="ghost" onClick={() => setEditingProduct(null)}>Cancelar</Btn>
            <Btn disabled={!editingProduct.name || !editingProduct.sku} onClick={() => {
              if (companyId) supabase.from('products').upsert(productToDb(editingProduct, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
              setProducts(prev => {
                const updated = prev.map(p => p.id === editingProduct.id ? editingProduct : p);
                return updated.map(p => {
                  if (!p.esCompuesto || !p.componentes.some(c => c.productId === editingProduct.id)) return p;
                  const newPrices = {};
                  Object.keys(p.prices || {}).forEach(plId => {
                    newPrices[plId] = p.componentes.reduce((sum, c) => {
                      const comp = updated.find(x => x.id === c.productId);
                      return sum + (comp?.prices?.[plId] || 0) * (c.qty || 1);
                    }, 0);
                  });
                  const recalc = { ...p, prices: newPrices };
                  if (companyId) supabase.from('products').upsert(productToDb(recalc, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
                  return recalc;
                });
              });
              setEditingProduct(null);
            }}>Guardar cambios</Btn>
          </div>
        </Modal>
      )}

      {/* Feedback importación */}
      {importMsg && (
        <div style={{ background: importMsg.type === "ok" ? T.accentLight : T.redLight, border: `1px solid ${importMsg.type === "ok" ? T.accent : T.red}40`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: importMsg.type === "ok" ? T.accent : T.red, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {importMsg.type === "ok" ? "✓ " : "⚠ "}{importMsg.text}
          <button onClick={() => setImportMsg(null)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: 14, marginLeft: 12 }}>✕</button>
        </div>
      )}

      {/* ── MODAL AJUSTE STOCK ── */}
      {adjustProd && (
        <Modal title={`Ajustar stock: ${adjustProd.name}`} onClose={() => setAdjustProd(null)}>
          <div style={{ marginBottom: 16, background: T.surface, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontSize: 12, color: T.muted }}>Stock actual</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: T.ink }}>{adjustProd.stock} <span style={{ fontSize: 14 }}>{adjustProd.unit}s</span></div>
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            {[["add", "➕ Agregar"], ["sub", "➖ Quitar"]].map(([v, l]) => (
              <button key={v} onClick={() => setAdjustType(v)}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${adjustType === v ? (v === "add" ? T.accent : T.red) : T.border}`, background: adjustType === v ? (v === "add" ? T.accentLight : T.redLight) : "transparent", color: adjustType === v ? (v === "add" ? T.accent : T.red) : T.muted, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>{l}</button>
            ))}
          </div>
          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            <Input label="CANTIDAD" type="number" step="any" min="0" value={adjustQty} onChange={setAdjustQty} />
            <Input label="MOTIVO (opcional)" value={adjustNote} onChange={setAdjustNote} placeholder="ej: Devolución, merma, ajuste inventario..." />
          </div>
          {adjustQty > 0 && (
            <div style={{ background: T.surface, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: T.muted }}>
              Nuevo stock: <strong style={{ color: T.ink }}>{Math.max(0, adjustType === "add" ? adjustProd.stock + parseFloat(adjustQty) : adjustProd.stock - parseFloat(adjustQty))} {adjustProd.unit}s</strong>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn v="ghost" onClick={() => setAdjustProd(null)}>Cancelar</Btn>
            <Btn onClick={doAdjust} disabled={!adjustQty}>Confirmar ajuste</Btn>
          </div>
        </Modal>
      )}

      {/* ── MODAL NUEVO PRODUCTO ── */}
      {showForm && (
        <Modal title="Nuevo producto / servicio" onClose={() => { setShowForm(false); setForm(EMPTY_FORM); setCcClient(""); setCcCode(""); }} xl>

          {/* ── SECCIÓN 1: datos básicos ── */}
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>DATOS BÁSICOS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 6 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>
                NOMBRE <span style={{ color: T.accent }}>*</span>
              </label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre del producto o servicio"
                style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${form.name ? T.border : T.red + "60"}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>
                SKU INTERNO <span style={{ color: T.accent }}>*</span>
              </label>
              <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="ej: PRD-001"
                style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${form.sku ? T.border : T.red + "60"}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
            </div>
            <Input label="CATEGORÍA" value={form.category} onChange={v => setForm(f => ({ ...f, category: v }))} />
            <Input label="UNIDAD" value={form.unit} onChange={v => setForm(f => ({ ...f, unit: v }))} />
            <Input label="COSTO PROMEDIO ($)" type="number" value={form.cost} onChange={v => setForm(f => ({ ...f, cost: parseFloat(v) || 0 }))} />

            {/* ALÍCUOTA IVA */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>ALÍCUOTA IVA</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[21, 10.5].map(rate => (
                  <button key={rate} onClick={() => setForm(f => ({ ...f, iva: rate }))}
                    style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${form.iva === rate ? T.yellow : T.border}`, background: form.iva === rate ? T.yellowLight : T.surface, color: form.iva === rate ? T.yellow : T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                    {rate}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── MUEVE STOCK ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 8, letterSpacing: 1 }}>MANEJO DE STOCK</label>
            <div style={{ display: "flex", gap: 10 }}>
              {[[true, "📦 Producto (mueve stock)", T.accent, T.accentLight], [false, "🔧 Servicio (no mueve stock)", T.purple, T.purpleLight]].map(([val, label, col, bg]) => (
                <button key={String(val)} onClick={() => setForm(f => ({ ...f, tracksStock: val }))}
                  style={{ flex: 1, padding: "12px 14px", borderRadius: 10, border: `2px solid ${form.tracksStock === val ? col : T.border}`, background: form.tracksStock === val ? bg : T.surface, color: form.tracksStock === val ? col : T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                  {label}
                </button>
              ))}
            </div>
            {form.tracksStock && (
              <div style={{ marginTop: 10 }}>
                <Input label="STOCK MÍNIMO" type="number" value={form.minStock} onChange={v => setForm(f => ({ ...f, minStock: parseInt(v) || 0 }))} />
              </div>
            )}
          </div>

          {/* ── PRODUCTO COMPUESTO ── */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 8, letterSpacing: 1 }}>TIPO DE PRODUCTO</label>
            <div style={{ display: "flex", gap: 10, marginBottom: form.esCompuesto ? 14 : 0 }}>
              <button onClick={() => setForm(f => ({ ...f, esCompuesto: false, componentes: [] }))}
                style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: `2px solid ${!form.esCompuesto ? T.accent : T.border}`, background: !form.esCompuesto ? T.accentLight : T.surface, color: !form.esCompuesto ? T.accent : T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                ◆ Producto simple
              </button>
              <button onClick={() => setForm(f => ({ ...f, esCompuesto: true }))}
                style={{ flex: 1, padding: "11px 14px", borderRadius: 10, border: `2px solid ${form.esCompuesto ? T.purple : T.border}`, background: form.esCompuesto ? T.purpleLight : T.surface, color: form.esCompuesto ? T.purple : T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                ◈ Producto compuesto
              </button>
            </div>
            {form.esCompuesto && (
              <div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>Seleccioná los componentes. El precio Lista A se calculará automáticamente como la suma de sus partes.</div>
                {form.componentes.length > 0 && (
                  <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead><tr style={{ background: T.surface }}>
                        {["Componente","Cantidad","Precio unit. (Lista A)",""].map(h => <th key={h} style={{ padding: "7px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}
                      </tr></thead>
                      <tbody>{form.componentes.map((comp, idx) => {
                        const prod = products.find(p => p.id === comp.productId);
                        return (
                          <tr key={comp.productId} style={{ borderTop: `1px solid ${T.border}` }}>
                            <td style={{ padding: "8px 12px", fontSize: 13 }}>{prod?.name || "?"}</td>
                            <td style={{ padding: "8px 12px" }}>
                              <input type="number" min="1" value={comp.qty}
                                onChange={e => setForm(f => ({ ...f, componentes: f.componentes.map((c, i) => i === idx ? { ...c, qty: parseFloat(e.target.value)||1 } : c) }))}
                                style={{ width: 70, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
                            </td>
                            <td style={{ padding: "8px 12px", fontSize: 13, color: T.muted }}>{fmt((prod?.prices?.lista_a || 0) * comp.qty)}</td>
                            <td style={{ padding: "8px 12px" }}>
                              <button onClick={() => setForm(f => ({ ...f, componentes: f.componentes.filter((_, i) => i !== idx) }))}
                                style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14 }}>✕</button>
                            </td>
                          </tr>
                        );
                      })}</tbody>
                    </table>
                    <div style={{ padding: "8px 12px", background: T.surface2, fontSize: 12, fontWeight: 700, color: T.purple, borderTop: `1px solid ${T.border}` }}>
                      Total Lista A: {fmt(form.componentes.reduce((s, c) => { const p = products.find(x => x.id === c.productId); return s + (p?.prices?.lista_a || 0) * c.qty; }, 0))}
                    </div>
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>AGREGAR COMPONENTE</label>
                  <select onChange={e => {
                    const pid = e.target.value;
                    if (!pid || form.componentes.some(c => c.productId === pid)) return;
                    setForm(f => ({ ...f, componentes: [...f.componentes, { productId: pid, qty: 1 }] }));
                    e.target.value = "";
                  }}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                    <option value="">Seleccionar producto para agregar...</option>
                    {products.filter(p => !p.esCompuesto && !form.componentes.some(c => c.productId === p.id)).map(p => (
                      <option key={p.id} value={p.id}>{p.name} — {fmt(p.prices?.lista_a || 0)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── PRECIOS ── */}
          {form.esCompuesto ? (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>PRECIOS CALCULADOS AUTOMÁTICAMENTE (S/IVA)</div>
              {faltantesCompuesto.length > 0 && (
                <div style={{ background: T.redLight, border: `1px solid ${T.red}40`, borderRadius: 8, padding: "10px 14px", marginBottom: 12, fontSize: 12, color: T.red }}>
                  <strong>No se puede guardar:</strong> faltan precios en:
                  <ul style={{ margin: "6px 0 0 16px", padding: 0 }}>
                    {faltantesCompuesto.map((f, i) => <li key={i}>{f.nombre} — {f.lista}</li>)}
                  </ul>
                </div>
              )}
              {form.componentes.length === 0 ? (
                <div style={{ fontSize: 12, color: T.muted, fontStyle: "italic" }}>Agregá componentes para calcular el precio.</div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {initPriceLists.map(pl => (
                    <div key={pl.id} style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6 }}>{pl.label.toUpperCase()}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: preciosCompuesto[pl.id] > 0 ? T.purple : T.red }}>{fmt(preciosCompuesto[pl.id])}</div>
                      <div style={{ fontSize: 10, color: T.faint, marginTop: 3 }}>suma de componentes</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>PRECIOS DE VENTA POR LISTA (S/IVA)</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
                {initPriceLists.map(pl => (
                  <Input key={pl.id} label={pl.label.toUpperCase()} type="number" value={form.prices[pl.id]}
                    onChange={v => setForm(f => ({ ...f, prices: { ...f.prices, [pl.id]: parseFloat(v) || 0 } }))} />
                ))}
              </div>
            </>
          )}

          {/* ── CÓDIGOS POR CLIENTE ── */}
          <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>CÓDIGOS ESPECIALES POR CLIENTE</div>
          <div style={{ fontSize: 12, color: T.faint, marginBottom: 12 }}>
            Cada código queda vinculado al SKU interno <span style={{ fontFamily: "monospace", color: form.sku ? T.blue : T.muted, fontWeight: 700 }}>{form.sku || "—"}</span>.
            Cuando ese cliente busque o reciba un documento, verá su código propio.
          </div>

          {/* Tabla de códigos ya agregados */}
          {form.clientCodes.length > 0 && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 14 }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: T.surface }}>
                    {["Cliente", "Código del cliente", "SKU vinculado", ""].map(h => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {form.clientCodes.map(r => {
                    const cl = clients.find(c => c.id === r.clientId);
                    return (
                      <tr key={r.clientId} style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: "9px 12px", fontSize: 13 }}>{cl?.name || r.clientId}</td>
                        <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: T.blue }}>{r.customCode} <span style={{ color: T.accent, fontSize: 11 }}>✦</span></td>
                        <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12, color: T.muted }}>{form.sku}</td>
                        <td style={{ padding: "9px 12px" }}>
                          <button onClick={() => removeClientCode(r.clientId)}
                            style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 14 }}>✕</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Agregar nuevo código */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, alignItems: "flex-end", marginBottom: 24 }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>CLIENTE</label>
              <select value={ccClient} onChange={e => setCcClient(e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: ccClient ? T.ink : T.muted, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                <option value="">Seleccionar cliente...</option>
                {clients.filter(c => !form.clientCodes.some(r => r.clientId === c.id)).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>CÓDIGO DEL CLIENTE</label>
              <input value={ccCode} onChange={e => setCcCode(e.target.value)} placeholder="ej: CLI-A-4892"
                onKeyDown={e => e.key === "Enter" && addClientCode()}
                style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
            </div>
            <Btn onClick={addClientCode} disabled={!ccClient || !ccCode.trim()}>+ Agregar</Btn>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn v="ghost" onClick={() => { setShowForm(false); setForm(EMPTY_FORM); setCcClient(""); setCcCode(""); }}>Cancelar</Btn>
            <Btn onClick={addProduct} disabled={!form.name || !form.sku || compuestoInvalido}>Crear</Btn>
          </div>
        </Modal>
      )}

      {/* ── BUSCADOR ── */}
      <div style={{ marginBottom: 16 }}>
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nombre, SKU o código de cliente..." />
      </div>

      {/* ── TABLA ── */}
      <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: T.surface }}>
              {["SKU", "Producto / Servicio", "Categoría", "Stock", "Lista A", "Lista B / C", "Estado", ""].map(h => (
                <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.7 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{filtered.map(p => {
            const isCritical = p.tracksStock !== false && p.stock < p.minStock;
            const isService = p.tracksStock === false;
            return (
              <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: isCritical ? `${T.red}08` : "transparent" }}>
                <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: T.muted }}>{p.sku}</td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</span>
                    {isService && <span style={{ fontSize: 10, fontWeight: 700, color: T.purple, background: T.purpleLight, padding: "2px 7px", borderRadius: 5 }}>SERVICIO</span>}
                  </div>
                  {(p.clientOverrides || []).length > 0 && (
                    <div style={{ fontSize: 11, color: T.blue, marginTop: 2 }}>
                      {p.clientOverrides.length} código{p.clientOverrides.length > 1 ? "s" : ""} especial{p.clientOverrides.length > 1 ? "es" : ""}
                    </div>
                  )}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <span style={{ background: T.surface, color: T.muted, padding: "2px 8px", borderRadius: 6, fontSize: 11 }}>{p.category || "—"}</span>
                </td>
                <td style={{ padding: "12px 14px" }}>
                  {isService
                    ? <span style={{ fontSize: 12, color: T.muted }}>N/A</span>
                    : <span style={{ fontSize: 18, fontWeight: 800, color: isCritical ? T.red : T.accent }}>
                        {p.stock} <span style={{ fontSize: 11, fontWeight: 400, color: T.muted }}>mín.{p.minStock}</span>
                      </span>}
                </td>
                <td style={{ padding: "12px 14px", fontSize: 14, fontWeight: 700 }}>{fmt(p.prices?.lista_a)}</td>
                <td style={{ padding: "12px 14px", fontSize: 12, color: T.muted }}>{fmt(p.prices?.lista_b)} / {fmt(p.prices?.lista_c)}</td>
                <td style={{ padding: "12px 14px" }}>
                  {isService
                    ? <span style={{ background: T.purpleLight, color: T.purple, padding: "2px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>Servicio</span>
                    : isCritical
                      ? <span style={{ background: T.redLight, color: T.red, padding: "2px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>⚠ Crítico</span>
                      : <span style={{ background: T.accentLight, color: T.accent, padding: "2px 9px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>OK</span>}
                </td>
                <td style={{ padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {!isService && <Btn sm v="ghost" onClick={() => { setAdjustProd(p); setAdjustQty(0); }}>Ajustar</Btn>}
                    <button onClick={() => setEditingProduct({...p})}
                      style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface2, color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      Editar
                    </button>
                    <button onClick={() => { if (window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) { setProducts(prev => prev.filter(x => x.id !== p.id)); if (companyId) supabase.from('products').delete().eq('id', p.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) }); } }}
                      style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.red}40`, background: T.redLight, color: T.red, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}</tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MODULE: MÉTRICAS ─────────────────────────────────────────────────────────
function MetricasModule({ saleInvoices, purchaseInvoices, products, clients, suppliers }) {
  const [view, setView] = useState("home"); // "home" | "operativos" | "tacticos" | "estrategicos"
  const [from, setFrom] = useState("2026-01-01");
  const [to, setTo] = useState("2026-03-31");

  // ── Operativos filters ────────────────────────────────────────────────────
  const [fCobroCliente, setFCobroCliente] = useState("");
  const [fCobroCuit, setFCobroCuit] = useState("");
  const [fCobroMontoMin, setFCobroMontoMin] = useState("");
  const [fCobroMontoMax, setFCobroMontoMax] = useState("");
  const [fPagoProveedor, setFPagoProveedor] = useState("");
  const [fPagoMontoMin, setFPagoMontoMin] = useState("");
  const [fPagoMontoMax, setFPagoMontoMax] = useState("");

  // ── helpers ───────────────────────────────────────────────────────────────
  const getLastPurchasePrice = (productId) => {
    const allLines = purchaseInvoices
      .filter(inv => inv.date)
      .sort((a, b) => b.date.localeCompare(a.date))
      .flatMap(inv => (inv.lines || []).map(l => ({ ...l, date: inv.date })));
    const hit = allLines.find(l => l.productId === productId);
    return hit ? (hit.unitPrice ?? hit.price ?? 0) : 0;
  };

  // ── computed data ─────────────────────────────────────────────────────────
  const salesInRange = saleInvoices.filter(i => i.type === "factura" && i.date >= from && i.date <= to);
  const purchasesInRange = purchaseInvoices.filter(i => i.date >= from && i.date <= to);

  const buildMonths = (f, t) => {
    const months = [];
    const [fy, fm] = f.split("-").map(Number);
    const [ty, tm] = t.split("-").map(Number);
    let y = fy, m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      months.push(`${y}-${String(m).padStart(2, "0")}`);
      m++; if (m > 12) { m = 1; y++; }
    }
    return months;
  };

  const monthsInRange = useMemo(() => buildMonths(from, to), [from, to]);

  const monthlyData = useMemo(() => monthsInRange.map(ym => {
    const mSales = saleInvoices.filter(i => i.type === "factura" && i.date?.startsWith(ym));
    const ventasBrutas = mSales.reduce((s, i) => s + i.total, 0);
    const mPurch = purchaseInvoices.filter(i => i.date?.startsWith(ym));
    const costoCompras = mPurch.reduce((s, i) => s + i.total, 0);
    const costoVentas = mSales.flatMap(inv => inv.lines || []).reduce((sum, line) =>
      sum + getLastPurchasePrice(line.productId) * (line.qty || 0), 0);
    const label = new Date(ym + "-01").toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
    return { ym, label, ventasBrutas, costoCompras, costoVentas, gananciaBruta: ventasBrutas - costoVentas };
  }), [monthsInRange, saleInvoices, purchaseInvoices]);

  const totVentas   = monthlyData.reduce((s, d) => s + d.ventasBrutas, 0);
  const totCompras  = monthlyData.reduce((s, d) => s + d.costoCompras, 0);
  const totCostoV   = monthlyData.reduce((s, d) => s + d.costoVentas, 0);
  const totGanancia = monthlyData.reduce((s, d) => s + d.gananciaBruta, 0);
  const margin      = totVentas > 0 ? ((totGanancia / totVentas) * 100).toFixed(1) : 0;

  const byClient = {};
  salesInRange.forEach(inv => { byClient[inv.clientName] = (byClient[inv.clientName] || 0) + inv.total; });
  const clientRanking = Object.entries(byClient).sort((a, b) => b[1] - a[1]);

  const byProduct = {};
  salesInRange.flatMap(i => i.lines || []).forEach(l => {
    if (!byProduct[l.name]) byProduct[l.name] = { qty: 0, revenue: 0, productId: l.productId };
    byProduct[l.name].qty += l.qty; byProduct[l.name].revenue += l.subtotal;
  });
  const productRanking = Object.entries(byProduct).sort((a, b) => b[1].revenue - a[1].revenue);

  const cobrosPendientes = saleInvoices.filter(i => i.status === "pendiente" && i.type === "factura");
  const pagosPendientes  = purchaseInvoices.filter(i => i.status === "pendiente");
  const stockCritico     = products.filter(p => p.stock <= p.minStock);

  const filteredCobros = cobrosPendientes.filter(inv => {
    const cli = clients.find(c => c.id === inv.clientId);
    if (fCobroCliente && !inv.clientName?.toLowerCase().includes(fCobroCliente.toLowerCase())) return false;
    if (fCobroCuit && !cli?.cuit?.toLowerCase().includes(fCobroCuit.toLowerCase())) return false;
    if (fCobroMontoMin && inv.total < parseFloat(fCobroMontoMin)) return false;
    if (fCobroMontoMax && inv.total > parseFloat(fCobroMontoMax)) return false;
    return true;
  });
  const filteredPagos = pagosPendientes.filter(inv => {
    if (fPagoProveedor && !inv.supplierName?.toLowerCase().includes(fPagoProveedor.toLowerCase())) return false;
    if (fPagoMontoMin && inv.total < parseFloat(fPagoMontoMin)) return false;
    if (fPagoMontoMax && inv.total > parseFloat(fPagoMontoMax)) return false;
    return true;
  });

  const abcData = useMemo(() => {
    const total = productRanking.reduce((s, [, d]) => s + d.revenue, 0);
    let acum = 0;
    return productRanking.map(([name, d]) => {
      acum += d.revenue;
      const pct = total > 0 ? (d.revenue / total * 100) : 0;
      const acumPct = total > 0 ? (acum / total * 100) : 0;
      const cat = acumPct <= 80 ? "A" : acumPct <= 95 ? "B" : "C";
      return { name, revenue: d.revenue, qty: d.qty, pct, acumPct, cat };
    });
  }, [productRanking]);

  // ── sub-components ────────────────────────────────────────────────────────
  const Bar = ({ value, max, color }) => (
    <div style={{ height: 6, background: T.surface, borderRadius: 3, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.round((Math.max(value, 0) / max) * 100)}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
    </div>
  );

  const BarChart = ({ data, valueKey, color, height = 180 }) => {
    const max = Math.max(...data.map(d => Math.abs(d[valueKey])), 1);
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: height + 28, paddingBottom: 24, position: "relative" }}>
        {[0.25, 0.5, 0.75, 1].map(r => (
          <div key={r} style={{ position: "absolute", left: 0, right: 0, bottom: 24 + r * height, borderTop: `1px dashed ${T.border}`, pointerEvents: "none" }}>
            <span style={{ fontSize: 9, color: T.faint, paddingLeft: 2 }}>{fmt(max * r)}</span>
          </div>
        ))}
        {data.map(d => {
          const val = d[valueKey];
          const h = Math.max(3, Math.round((Math.abs(val) / max) * height));
          return (
            <div key={d.ym} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative", height: "100%", justifyContent: "flex-end" }}>
              <div style={{ fontSize: 9, color, fontWeight: 700, marginBottom: 3, whiteSpace: "nowrap", textAlign: "center" }}>{val !== 0 ? fmt(val) : "—"}</div>
              <div style={{ width: "100%", height: h, background: val < 0 ? T.red : color, borderRadius: "4px 4px 0 0", opacity: 0.88 }} />
              <div style={{ fontSize: 9, color: T.muted, position: "absolute", bottom: 0, whiteSpace: "nowrap" }}>{d.label}</div>
            </div>
          );
        })}
      </div>
    );
  };

  const FilterInput = ({ value, onChange, placeholder, color }) => (
    <div style={{ position: "relative" }}>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={`🔍 ${placeholder}`}
        style={{ width: "100%", padding: "7px 26px 7px 10px", borderRadius: 7, border: `1px solid ${value ? (color || T.yellow) + "80" : T.border}`, background: T.surface, color: T.ink, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
      {value && <button onClick={() => onChange("")} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: T.muted, cursor: "pointer", fontSize: 11 }}>✕</button>}
    </div>
  );

  const SectionTitle = ({ label, count, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, color: T.muted, letterSpacing: 1 }}>{label.toUpperCase()}</div>
      {count !== undefined && <span style={{ fontSize: 10, fontWeight: 700, background: (color || T.accent) + "20", color: color || T.accent, padding: "2px 8px", borderRadius: 10 }}>{count}</span>}
    </div>
  );

  const PageHeader = ({ title, subtitle, color, onPDF, onExcel, extraFilters }) => (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button onClick={() => setView("home")}
            style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.muted, borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
            ← Reportes
          </button>
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color, background: color + "20", padding: "3px 10px", borderRadius: 20, letterSpacing: 0.8 }}>{title.toUpperCase()}</span>
            {subtitle && <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{subtitle}</div>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          {extraFilters}
          {onExcel && <button onClick={onExcel} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.accent}40`, background: T.accentLight, color: T.accent, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>⬇ Excel</button>}
          {onPDF && <button onClick={onPDF} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${T.blue}40`, background: T.blueLight, color: T.blue, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>🖨 PDF</button>}
        </div>
      </div>
    </div>
  );

  const DateInputs = () => (
    <>
      {[["DESDE", from, setFrom], ["HASTA", to, setTo]].map(([lbl, val, setter]) => (
        <div key={lbl}>
          <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, marginBottom: 4 }}>{lbl}</div>
          <input type="date" value={val} onChange={e => setter(e.target.value)}
            style={{ padding: "7px 8px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.paper, color: T.ink, fontSize: 12, fontFamily: "inherit" }} />
        </div>
      ))}
      <div>
        <div style={{ fontSize: 9, color: T.muted, fontWeight: 700, marginBottom: 4 }}>PERÍODO</div>
        <QuickDateFilter setFrom={setFrom} setTo={setTo}
          style={{ padding: "7px 8px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.paper, color: T.muted, fontSize: 12, fontFamily: "inherit" }} />
      </div>
    </>
  );

  // ── PDF generators ────────────────────────────────────────────────────────
  const pdfStyle = `body{font-family:Arial,sans-serif;font-size:12px;color:#111;margin:24px}h1{font-size:18px;margin-bottom:2px}h2{font-size:13px;color:#444;margin:18px 0 8px}table{width:100%;border-collapse:collapse;margin-bottom:16px}th{background:#f0f0f0;padding:7px 10px;text-align:left;font-size:11px;border-bottom:2px solid #ccc}td{padding:6px 10px;border-bottom:1px solid #e0e0e0}.tot{font-weight:700;background:#fafafa}@media print{button{display:none}}`;

  const openPDF = (title, html) => {
    const w = window.open("", "_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${pdfStyle}</style></head><body><h1>NexoPyme · ${title}</h1><p style="color:#888;font-size:11px;margin-bottom:16px">Generado: ${new Date().toLocaleDateString("es-AR")}</p>${html}<script>window.onload=()=>window.print()<\/script></body></html>`);
    w.document.close();
  };

  const pdfOperativos = () => {
    const cobroRows = filteredCobros.map(inv => { const cli = clients.find(c => c.id === inv.clientId); return `<tr><td>${docRef(inv)}</td><td>${inv.clientName}</td><td>${cli?.cuit || "—"}</td><td>${inv.date}</td><td>${inv.due || "—"}</td><td>${fmt(inv.total)}</td></tr>`; }).join("");
    const pagoRows = filteredPagos.map(inv => `<tr><td>${docRef(inv)}</td><td>${inv.nroFactura || "—"}</td><td>${inv.supplierName}</td><td>${inv.date}</td><td>${inv.dueDate || "—"}</td><td>${fmt(inv.total)}</td></tr>`).join("");
    const stockRows = stockCritico.map(p => `<tr><td>${p.sku}</td><td>${p.name}</td><td>${p.category}</td><td>${p.stock}</td><td>${p.minStock}</td><td style="color:red;font-weight:700">−${p.minStock - p.stock}</td></tr>`).join("");
    openPDF("Reportes Operativos", `
      <h2>Cobros Pendientes</h2><table><thead><tr><th>Factura</th><th>Cliente</th><th>CUIT</th><th>Fecha</th><th>Vence</th><th>Total</th></tr></thead><tbody>${cobroRows || "<tr><td colspan='6'>Sin datos</td></tr>"}</tbody><tfoot><tr class="tot"><td colspan="5">Total</td><td>${fmt(filteredCobros.reduce((s,i)=>s+i.total,0))}</td></tr></tfoot></table>
      <h2>Pagos Pendientes</h2><table><thead><tr><th>OC</th><th>N° Fact. Prov.</th><th>Proveedor</th><th>Fecha</th><th>Vence</th><th>Total</th></tr></thead><tbody>${pagoRows || "<tr><td colspan='6'>Sin datos</td></tr>"}</tbody><tfoot><tr class="tot"><td colspan="5">Total</td><td>${fmt(filteredPagos.reduce((s,i)=>s+i.total,0))}</td></tr></tfoot></table>
      <h2>Stock Crítico</h2><table><thead><tr><th>SKU</th><th>Producto</th><th>Categoría</th><th>Stock actual</th><th>Mínimo</th><th>Faltante</th></tr></thead><tbody>${stockRows || "<tr><td colspan='6'>Sin productos críticos</td></tr>"}</tbody></table>
    `);
  };

  const pdfTacticos = () => {
    const vRows = salesInRange.map(i => `<tr><td>${i.id}</td><td>${i.clientName}</td><td>${i.date}</td><td>${fmt(i.total)}</td></tr>`).join("");
    const cliRows = clientRanking.map(([name, total], i) => `<tr><td>#${i+1}</td><td>${name}</td><td>${fmt(total)}</td></tr>`).join("");
    const prodRows = productRanking.map(([name, d], i) => { const lp = getLastPurchasePrice(d.productId); return `<tr><td>#${i+1}</td><td>${name}</td><td>${d.qty}</td><td>${fmt(d.revenue)}</td><td>${fmt(d.revenue - lp * d.qty)}</td></tr>`; }).join("");
    const cRows = purchasesInRange.map(i => `<tr><td>${i.id}</td><td>${i.supplierName}</td><td>${i.date}</td><td>${fmt(i.total)}</td></tr>`).join("");
    openPDF("Reportes Tácticos", `
      <p style="color:#666">Período: ${from} al ${to}</p>
      <h2>Ventas del Período</h2><table><thead><tr><th>Factura</th><th>Cliente</th><th>Fecha</th><th>Total</th></tr></thead><tbody>${vRows || "<tr><td colspan='4'>Sin datos</td></tr>"}</tbody><tfoot><tr class="tot"><td colspan="3">Total</td><td>${fmt(salesInRange.reduce((s,i)=>s+i.total,0))}</td></tr></tfoot></table>
      <h2>Ranking Clientes</h2><table><thead><tr><th>#</th><th>Cliente</th><th>Total vendido</th></tr></thead><tbody>${cliRows || "<tr><td colspan='3'>Sin datos</td></tr>"}</tbody></table>
      <h2>Ranking Productos</h2><table><thead><tr><th>#</th><th>Producto</th><th>Cant.</th><th>Ingresos</th><th>Ganancia</th></tr></thead><tbody>${prodRows || "<tr><td colspan='5'>Sin datos</td></tr>"}</tbody></table>
      <h2>Compras del Período</h2><table><thead><tr><th>OC</th><th>Proveedor</th><th>Fecha</th><th>Total</th></tr></thead><tbody>${cRows || "<tr><td colspan='4'>Sin datos</td></tr>"}</tbody><tfoot><tr class="tot"><td colspan="3">Total</td><td>${fmt(purchasesInRange.reduce((s,i)=>s+i.total,0))}</td></tr></tfoot></table>
    `);
  };

  const pdfEstrategicos = () => {
    const mRows = monthlyData.map(d => { const mg = d.ventasBrutas > 0 ? (d.gananciaBruta/d.ventasBrutas*100).toFixed(1)+"%" : "—"; return `<tr><td>${d.label}</td><td>${fmt(d.ventasBrutas)}</td><td>${fmt(d.costoCompras)}</td><td>${fmt(d.costoVentas)}</td><td>${fmt(d.gananciaBruta)}</td><td>${mg}</td></tr>`; }).join("");
    const abcRows = abcData.map(d => `<tr><td>${d.name}</td><td>${fmt(d.revenue)}</td><td>${d.pct.toFixed(1)}%</td><td>${d.acumPct.toFixed(1)}%</td><td style="font-weight:700">${d.cat}</td></tr>`).join("");
    openPDF("Reportes Estratégicos", `
      <p style="color:#666">Período: ${from} al ${to}</p>
      <h2>Rentabilidad Mensual</h2><table><thead><tr><th>Mes</th><th>Ventas brutas</th><th>Costo compras</th><th>Costo ventas</th><th>Ganancia bruta</th><th>Margen</th></tr></thead><tbody>${mRows}</tbody><tfoot><tr class="tot"><td>TOTAL</td><td>${fmt(totVentas)}</td><td>${fmt(totCompras)}</td><td>${fmt(totCostoV)}</td><td>${fmt(totGanancia)}</td><td>${margin}%</td></tr></tfoot></table>
      <h2>Análisis ABC de Productos</h2><table><thead><tr><th>Producto</th><th>Ingresos</th><th>% del total</th><th>% acumulado</th><th>Cat.</th></tr></thead><tbody>${abcRows || "<tr><td colspan='5'>Sin datos</td></tr>"}</tbody></table>
    `);
  };

  // ── Excel generators ──────────────────────────────────────────────────────
  const excelOperativos = () => {
    const hoyStr = new Date().toISOString().slice(0,10);
    const period = `Período: ${hoyStr}`;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildFormattedSheet("Cobros pendientes", period,
      ["Factura","Cliente","CUIT","Fecha","Vence","Total"],
      filteredCobros.map(inv => { const cli = clients.find(c => c.id === inv.clientId); return [docRef(inv), inv.clientName, cli?.cuit||"", inv.date, inv.due||"", inv.total]; })
    ), "Cobros pendientes");
    XLSX.utils.book_append_sheet(wb, buildFormattedSheet("Pagos pendientes", period,
      ["OC","N° Fact. Prov.","Proveedor","Fecha","Vence","Total"],
      filteredPagos.map(inv => [docRef(inv), inv.nroFactura||"", inv.supplierName, inv.date, inv.dueDate||"", inv.total])
    ), "Pagos pendientes");
    XLSX.utils.book_append_sheet(wb, buildFormattedSheet("Stock crítico", period,
      ["SKU","Producto","Categoría","Stock actual","Stock mínimo","Faltante"],
      stockCritico.map(p => [p.sku, p.name, p.category||"", p.stock, p.minStock, p.minStock - p.stock])
    ), "Stock crítico");
    XLSX.writeFile(wb, `NexoPyME_operativos_${hoyStr}.xlsx`);
  };

  const excelTacticos = () => {
    const period = `Período: ${from}  →  ${to}`;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildFormattedSheet("Ventas del período", period,
      ["N° Factura","Cliente","Fecha","Total c/IVA"],
      salesInRange.map(i => [docRef(i), i.clientName, i.date, i.total])
    ), "Ventas");
    XLSX.utils.book_append_sheet(wb, buildFormattedSheet("Ranking de clientes", period,
      ["#","Cliente","Total vendido"],
      clientRanking.map(([name, total], i) => [i+1, name, total])
    ), "Ranking clientes");
    XLSX.utils.book_append_sheet(wb, buildFormattedSheet("Ranking de productos", period,
      ["#","Producto","Cantidad","Ingresos","Ganancia"],
      productRanking.map(([name, d], i) => { const lp = getLastPurchasePrice(d.productId); return [i+1, name, d.qty, d.revenue, d.revenue - lp * d.qty]; })
    ), "Ranking productos");
    XLSX.utils.book_append_sheet(wb, buildFormattedSheet("Compras del período", period,
      ["N° OC","N° Fact. Prov.","Proveedor","Fecha","Total"],
      purchasesInRange.map(i => [docRef(i), i.nroFactura||"", i.supplierName, i.date, i.total])
    ), "Compras");
    XLSX.writeFile(wb, `NexoPyME_tacticos_${from}_${to}.xlsx`);
  };

  const excelEstrategicos = () => {
    const period = `Período: ${from}  →  ${to}`;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildFormattedSheet("Rentabilidad mensual", period,
      ["Mes","Ventas brutas","Costo compras","Costo ventas","Ganancia bruta","Margen %"],
      [...monthlyData.map(d => [d.label, d.ventasBrutas, d.costoCompras, d.costoVentas, d.gananciaBruta, d.ventasBrutas > 0 ? +(d.gananciaBruta/d.ventasBrutas*100).toFixed(1) : 0]),
       ["TOTAL", totVentas, totCompras, totCostoV, totGanancia, +margin]]
    ), "Rentabilidad mensual");
    XLSX.utils.book_append_sheet(wb, buildFormattedSheet("Análisis ABC de productos", period,
      ["Producto","Ingresos","% del total","% acumulado","Categoría ABC"],
      abcData.map(d => [d.name, d.revenue, +d.pct.toFixed(1), +d.acumPct.toFixed(1), d.cat])
    ), "Análisis ABC");
    XLSX.writeFile(wb, `NexoPyME_estrategicos_${from}_${to}.xlsx`);
  };

  // ── HOME ──────────────────────────────────────────────────────────────────
  if (view === "home") {
    const cats = [
      { id: "operativos", label: "Operativos", desc: "Control diario de cobros, pagos y stock", color: T.yellow, bg: T.yellowLight, icon: "◉",
        items: ["Cobros pendientes", "Pagos pendientes", "Stock crítico"],
        badges: [{ label: `${cobrosPendientes.length} cobros`, color: T.yellow }, { label: `${pagosPendientes.length} pagos`, color: T.orange }, { label: `${stockCritico.length} alertas`, color: T.red }] },
      { id: "tacticos", label: "Tácticos", desc: "Análisis de ventas, compras y rankings del período", color: T.blue, bg: T.blueLight, icon: "◈",
        items: ["Ventas del período", "Compras del período", "Ranking de clientes", "Ranking de productos"],
        badges: [{ label: `${saleInvoices.filter(i=>i.type==="factura").length} facturas`, color: T.blue }] },
      { id: "estrategicos", label: "Estratégicos", desc: "Rentabilidad, márgenes y análisis ABC", color: T.purple, bg: T.purpleLight, icon: "▦",
        items: ["Rentabilidad mensual", "Evolución de márgenes", "Análisis ABC de productos"],
        badges: [] },
    ];
    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Reportes</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Seleccioná una categoría para ver y filtrar los datos</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          {cats.map(cat => (
            <div key={cat.id} onClick={() => setView(cat.id)}
              style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 16, padding: 28, cursor: "pointer", transition: "border-color 0.2s, transform 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color; e.currentTarget.style.transform = "translateY(-3px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = "translateY(0)"; }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: cat.color }}>{cat.icon}</div>
                <span style={{ fontSize: 10, color: cat.color, background: cat.bg, padding: "4px 10px", borderRadius: 8, fontWeight: 800, letterSpacing: 0.5 }}>Ver reporte →</span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 800, color: T.ink, marginBottom: 6 }}>{cat.label}</div>
              <div style={{ fontSize: 12, color: T.muted, marginBottom: 18, lineHeight: 1.5 }}>{cat.desc}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
                {cat.items.map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: T.muted }}>
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: cat.color, flexShrink: 0 }} />{item}
                  </div>
                ))}
              </div>
              {cat.badges.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                  {cat.badges.map(b => (
                    <span key={b.label} style={{ fontSize: 11, fontWeight: 700, background: b.color + "20", color: b.color, padding: "3px 10px", borderRadius: 20 }}>{b.label}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── OPERATIVOS ────────────────────────────────────────────────────────────
  if (view === "operativos") {
    const totalCobros = filteredCobros.reduce((s, i) => s + i.total, 0);
    const totalPagos  = filteredPagos.reduce((s, i) => s + i.total, 0);
    const nearDate    = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    return (
      <div>
        <PageHeader title="Operativos" subtitle="Cobros, pagos y stock crítico" color={T.yellow} onPDF={pdfOperativos} onExcel={excelOperativos} />

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.yellow}`, borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.yellow, letterSpacing: 1, marginBottom: 12 }}>¿QUÉ MUESTRA ESTE REPORTE?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Cobros pendientes</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Facturas de venta emitidas que aún no fueron cobradas. Las marcadas en amarillo vencen en los próximos 7 días y requieren seguimiento urgente.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Pagos pendientes</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Órdenes de compra que todavía no fueron pagadas al proveedor. El vencimiento surge de la condición pactada al registrar cada OC.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Stock crítico</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Productos con stock actual ≤ mínimo configurado en Inventario. El faltante = mínimo − stock actual. Sirve para anticipar reposiciones antes de quedarse sin mercadería.</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 28 }}>
          {[{ label: "Cobros pendientes", value: fmt(cobrosPendientes.reduce((s,i)=>s+i.total,0)), sub: `${cobrosPendientes.length} facturas`, color: T.yellow },
            { label: "Pagos pendientes",  value: fmt(pagosPendientes.reduce((s,i)=>s+i.total,0)),  sub: `${pagosPendientes.length} OC`,       color: T.orange },
            { label: "Productos críticos", value: stockCritico.length, sub: "Stock ≤ mínimo",      color: T.red }].map((k, i) => (
            <div key={i} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Cobros */}
        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
            <SectionTitle label="Cobros pendientes" count={filteredCobros.length} color={T.yellow} />
            <div style={{ fontSize: 12, color: T.muted, marginTop: -8 }}>Total filtrado: <span style={{ color: T.yellow, fontWeight: 700 }}>{fmt(totalCobros)}</span></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>
            <FilterInput value={fCobroCliente} onChange={setFCobroCliente} placeholder="Cliente..." color={T.yellow} />
            <FilterInput value={fCobroCuit} onChange={setFCobroCuit} placeholder="CUIT..." color={T.yellow} />
            <FilterInput value={fCobroMontoMin} onChange={setFCobroMontoMin} placeholder="Monto mín." color={T.yellow} />
            <FilterInput value={fCobroMontoMax} onChange={setFCobroMontoMax} placeholder="Monto máx." color={T.yellow} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>
                {["N° Factura","Cliente","CUIT","Fecha","Vence","Total"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredCobros.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: T.muted }}>Sin cobros pendientes.</td></tr>}
                {filteredCobros.map(inv => { const cli = clients.find(c => c.id === inv.clientId); const prox = inv.due && inv.due <= nearDate; return (
                  <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}`, background: prox ? `${T.yellow}08` : "transparent" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.blue }}>{docRef(inv)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{inv.clientName}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.muted, fontFamily: "monospace" }}>{cli?.cuit || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>{inv.date}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: prox ? T.yellow : T.muted, fontWeight: prox ? 700 : 400 }}>{inv.due || "—"}{prox && " ⚠"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: T.yellow }}>{fmt(inv.total)}</td>
                  </tr>); })}
              </tbody>
              {filteredCobros.length > 0 && <tfoot><tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
                <td colSpan={5} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: T.muted }}>TOTAL</td>
                <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: T.yellow }}>{fmt(totalCobros)}</td>
              </tr></tfoot>}
            </table>
          </div>
        </div>

        {/* Pagos */}
        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
            <SectionTitle label="Pagos pendientes" count={filteredPagos.length} color={T.orange} />
            <div style={{ fontSize: 12, color: T.muted, marginTop: -8 }}>Total filtrado: <span style={{ color: T.orange, fontWeight: 700 }}>{fmt(totalPagos)}</span></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 10, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>
            <FilterInput value={fPagoProveedor} onChange={setFPagoProveedor} placeholder="Proveedor..." color={T.orange} />
            <FilterInput value={fPagoMontoMin} onChange={setFPagoMontoMin} placeholder="Monto mín." color={T.orange} />
            <FilterInput value={fPagoMontoMax} onChange={setFPagoMontoMax} placeholder="Monto máx." color={T.orange} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>
                {["N° OC","N° Fact. Prov.","Proveedor","Fecha","Vence","Total"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {filteredPagos.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: T.muted }}>Sin pagos pendientes.</td></tr>}
                {filteredPagos.map(inv => { const prox = inv.dueDate && inv.dueDate <= nearDate; return (
                  <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}`, background: prox ? `${T.orange}08` : "transparent" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.orange }}>{docRef(inv)}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: T.muted }}>{inv.nroFactura || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{inv.supplierName}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>{inv.date}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: prox ? T.orange : T.muted, fontWeight: prox ? 700 : 400 }}>{inv.dueDate || "—"}{prox && " ⚠"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: T.orange }}>{fmt(inv.total)}</td>
                  </tr>); })}
              </tbody>
              {filteredPagos.length > 0 && <tfoot><tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
                <td colSpan={5} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: T.muted }}>TOTAL</td>
                <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: T.orange }}>{fmt(totalPagos)}</td>
              </tr></tfoot>}
            </table>
          </div>
        </div>

        {/* Stock crítico */}
        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
            <SectionTitle label="Stock crítico" count={stockCritico.length} color={T.red} />
            <div style={{ fontSize: 12, color: T.muted, marginTop: -8 }}>Productos con stock ≤ mínimo requerido</div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: T.surface }}>
              {["SKU","Producto","Categoría","Stock actual","Stock mínimo","Faltante"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {stockCritico.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: T.muted }}>Sin productos críticos.</td></tr>}
              {stockCritico.map(p => (
                <tr key={p.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: T.muted }}>{p.sku}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{p.name}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>{p.category}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: p.stock === 0 ? T.red : T.orange }}>{p.stock}</td>
                  <td style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>{p.minStock}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: T.red }}>−{p.minStock - p.stock} uds</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    );
  }

  // ── TÁCTICOS ──────────────────────────────────────────────────────────────
  if (view === "tacticos") {
    const totalVentas  = salesInRange.reduce((s, i) => s + i.total, 0);
    const totalCompras = purchasesInRange.reduce((s, i) => s + i.total, 0);
    return (
      <div>
        <PageHeader title="Tácticos" subtitle={`Período: ${from} al ${to}`} color={T.blue} onPDF={pdfTacticos} onExcel={excelTacticos}
          extraFilters={<div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}><DateInputs /></div>} />

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.blue}`, borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, letterSpacing: 1, marginBottom: 12 }}>¿QUÉ MUESTRA ESTE REPORTE?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Ventas del período</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Total facturado con IVA en el rango seleccionado. Incluye todas las facturas emitidas, sin importar si ya fueron cobradas.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Compras del período</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Total de órdenes de compra registradas en el período, sin importar el estado de pago. Refleja el gasto en mercadería.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Ranking de clientes</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Clientes ordenados de mayor a menor por total facturado en el período. Se suman todos los importes de sus facturas con IVA.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Ranking de productos</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Productos ordenados por ingresos generados. Ganancia = ingresos − (último precio de compra × unidades vendidas).</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[{ label: "Ventas del período",  value: fmt(totalVentas),         sub: `${salesInRange.length} facturas`,      color: T.accent },
            { label: "Compras del período", value: fmt(totalCompras),        sub: `${purchasesInRange.length} OC`,         color: T.orange },
            { label: "Clientes activos",    value: clientRanking.length,     sub: "Con ventas en el período",              color: T.blue },
            { label: "Productos vendidos",  value: productRanking.length,    sub: "Con movimiento",                        color: T.purple }].map((k, i) => (
            <div key={i} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 }}>
            <SectionTitle label="Ranking clientes" count={clientRanking.length} color={T.accent} />
            {clientRanking.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>Sin ventas en el período.</div>}
            {clientRanking.map(([name, total], i) => (
              <div key={name} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}><span style={{ color: T.muted, marginRight: 8 }}>#{i + 1}</span>{name}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: T.accent }}>{fmt(total)}</span>
                </div>
                <Bar value={total} max={clientRanking[0]?.[1] || 1} color={T.accent} />
              </div>
            ))}
          </div>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: 22 }}>
            <SectionTitle label="Ranking productos" count={productRanking.length} color={T.blue} />
            {productRanking.length === 0 && <div style={{ color: T.muted, fontSize: 13 }}>Sin ventas en el período.</div>}
            {productRanking.map(([name, data], i) => { const lp = getLastPurchasePrice(data.productId); const profit = data.revenue - lp * data.qty; return (
              <div key={name} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}><span style={{ color: T.muted, marginRight: 8 }}>#{i + 1}</span>{name}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color: T.blue }}>{fmt(data.revenue)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: T.muted, marginBottom: 5 }}>
                  <span>{data.qty} uds</span>
                  <span style={{ color: profit >= 0 ? T.accent : T.red }}>Ganancia: {fmt(profit)}</span>
                </div>
                <Bar value={data.revenue} max={productRanking[0]?.[1]?.revenue || 1} color={T.blue} />
              </div>); })}
          </div>
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
            <SectionTitle label="Ventas del período" count={salesInRange.length} color={T.accent} />
            <div style={{ fontSize: 12, color: T.muted, marginTop: -8 }}>Total: <span style={{ color: T.accent, fontWeight: 700 }}>{fmt(totalVentas)}</span></div>
          </div>
          <div style={{ overflowX: "auto", maxHeight: 340 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface, position: "sticky", top: 0 }}>
                {["N° Factura","Cliente","Fecha","Total c/IVA"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {salesInRange.length === 0 && <tr><td colSpan={4} style={{ padding: 24, textAlign: "center", color: T.muted }}>Sin facturas en el período.</td></tr>}
                {salesInRange.map(inv => (
                  <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.blue }}>{docRef(inv)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{inv.clientName}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>{inv.date}</td>
                    <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: T.accent }}>{fmt(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
              {salesInRange.length > 0 && <tfoot><tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
                <td colSpan={3} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: T.muted }}>TOTAL</td>
                <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: T.accent }}>{fmt(totalVentas)}</td>
              </tr></tfoot>}
            </table>
          </div>
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
            <SectionTitle label="Compras del período" count={purchasesInRange.length} color={T.orange} />
            <div style={{ fontSize: 12, color: T.muted, marginTop: -8 }}>Total: <span style={{ color: T.orange, fontWeight: 700 }}>{fmt(totalCompras)}</span></div>
          </div>
          <div style={{ overflowX: "auto", maxHeight: 300 }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface, position: "sticky", top: 0 }}>
                {["N° OC","N° Fact. Prov.","Proveedor","Fecha","Total c/IVA"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {purchasesInRange.length === 0 && <tr><td colSpan={5} style={{ padding: 24, textAlign: "center", color: T.muted }}>Sin compras en el período.</td></tr>}
                {purchasesInRange.map(inv => (
                  <tr key={inv.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.orange }}>{docRef(inv)}</td>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: 12, color: T.muted }}>{inv.nroFactura || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{inv.supplierName}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>{inv.date}</td>
                    <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: T.orange }}>{fmt(inv.total)}</td>
                  </tr>
                ))}
              </tbody>
              {purchasesInRange.length > 0 && <tfoot><tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
                <td colSpan={4} style={{ padding: "10px 14px", fontSize: 12, fontWeight: 700, color: T.muted }}>TOTAL</td>
                <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: T.orange }}>{fmt(totalCompras)}</td>
              </tr></tfoot>}
            </table>
          </div>
        </div>

      </div>
    );
  }

  // ── ESTRATÉGICOS ──────────────────────────────────────────────────────────
  if (view === "estrategicos") {
    return (
      <div>
        <PageHeader title="Estratégicos" subtitle={`Período: ${from} al ${to}`} color={T.purple} onPDF={pdfEstrategicos} onExcel={excelEstrategicos}
          extraFilters={<div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}><DateInputs /></div>} />

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.purple}`, borderRadius: 10, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.purple, letterSpacing: 1, marginBottom: 12 }}>¿QUÉ MUESTRA ESTE REPORTE?</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Ventas brutas</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Total facturado con IVA en el período. Es el ingreso bruto antes de descontar cualquier costo.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Costo de compras</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Total de OC del período. Cuánto se gastó en mercadería, no necesariamente lo que se vendió ese mes.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Rentabilidad mensual</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Costo de ventas = último precio de compra × unidades vendidas. Ganancia bruta = ventas − costo de ventas. Margen % = ganancia / ventas × 100.</div>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Análisis ABC</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.6 }}>Clasifica productos por Pareto: A = top 80% de ingresos (los más rentables), B = 80–95%, C = el resto. Ayuda a enfocar esfuerzos en los productos que más aportan.</div>
            </div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {[{ label: "Ventas brutas",    value: fmt(totVentas),   sub: `${salesInRange.length} facturas`,      color: T.accent },
            { label: "Costo de compras", value: fmt(totCompras),  sub: `${purchasesInRange.length} OC`,         color: T.orange },
            { label: "Ganancia bruta",   value: fmt(totGanancia), sub: `Margen ${margin}%`,                     color: totGanancia >= 0 ? T.accent : T.red },
            { label: "Costo de ventas",  value: fmt(totCostoV),   sub: "Últ. precio de compra",                 color: T.muted }].map((k, i) => (
            <div key={i} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px" }}>
              <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{k.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
          {[{ label: "Ventas brutas",    key: "ventasBrutas",  color: T.accent },
            { label: "Costo de compras", key: "costoCompras",  color: T.orange },
            { label: "Ganancia bruta",   key: "gananciaBruta", color: T.blue }].map(cfg => (
            <div key={cfg.key} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 20px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 4 }}>{cfg.label.toUpperCase()}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: cfg.color, marginBottom: 14 }}>{fmt(monthlyData.reduce((s, d) => s + d[cfg.key], 0))}</div>
              <BarChart data={monthlyData} valueKey={cfg.key} color={cfg.color} height={140} />
            </div>
          ))}
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
            <SectionTitle label="Rentabilidad mensual" color={T.purple} />
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead><tr style={{ background: T.surface }}>
              {["Mes","Ventas brutas","Costo compras","Costo ventas","Ganancia bruta","Margen"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
            </tr></thead>
            <tbody>
              {monthlyData.map(d => { const m = d.ventasBrutas > 0 ? ((d.gananciaBruta / d.ventasBrutas) * 100).toFixed(1) : "—"; return (
                <tr key={d.ym} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{d.label}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: T.accent, fontWeight: 700 }}>{fmt(d.ventasBrutas)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: T.orange }}>{fmt(d.costoCompras)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: T.muted }}>{fmt(d.costoVentas)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: d.gananciaBruta >= 0 ? T.accent : T.red }}>{fmt(d.gananciaBruta)}</td>
                  <td style={{ padding: "10px 14px", fontSize: 13, color: T.muted }}>{m}{m !== "—" ? "%" : ""}</td>
                </tr>); })}
            </tbody>
            <tfoot><tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
              <td style={{ padding: "10px 14px", fontSize: 12, fontWeight: 800, color: T.muted }}>TOTAL</td>
              <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: T.accent }}>{fmt(totVentas)}</td>
              <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: T.orange }}>{fmt(totCompras)}</td>
              <td style={{ padding: "10px 14px", fontSize: 13, color: T.muted }}>{fmt(totCostoV)}</td>
              <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: totGanancia >= 0 ? T.accent : T.red }}>{fmt(totGanancia)}</td>
              <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 800, color: T.muted }}>{margin}%</td>
            </tr></tfoot>
          </table>
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <SectionTitle label="Análisis ABC de productos" color={T.purple} />
              <div style={{ fontSize: 12, color: T.muted, marginTop: -8 }}>Regla de Pareto: A = top 80% ingresos · B = 80–95% · C = resto</div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[["A", T.accent], ["B", T.blue], ["C", T.muted]].map(([cat, color]) => (
                <span key={cat} style={{ fontSize: 11, fontWeight: 700, background: color + "20", color, padding: "3px 10px", borderRadius: 20 }}>
                  {cat}: {abcData.filter(d => d.cat === cat).length}
                </span>
              ))}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>
                {["#","Producto","Ingresos","% del total","% acumulado","Categoría"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {abcData.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: T.muted }}>Sin datos de ventas.</td></tr>}
                {abcData.map((d, i) => { const cc = d.cat === "A" ? T.accent : d.cat === "B" ? T.blue : T.muted; return (
                  <tr key={d.name} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>{i + 1}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 600 }}>{d.name}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, fontWeight: 700, color: cc }}>{fmt(d.revenue)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 12, color: T.muted }}>{d.pct.toFixed(1)}%</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: T.surface, borderRadius: 2, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${d.acumPct}%`, background: cc, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, color: T.muted, minWidth: 36 }}>{d.acumPct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, background: cc + "20", color: cc, padding: "3px 10px", borderRadius: 20 }}>{d.cat}</span>
                    </td>
                  </tr>); })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    );
  }

  return null;
}

// ─── MODULE: LOGÍSTICA ────────────────────────────────────────────────────────
function LogisticaModule({ clients, suppliers }) {
  // ── Estado de rutas guardadas ──────────────────────────────────────────────
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [activeRoute, setActiveRoute] = useState(null); // ruta en edición/vista
  const [view, setView] = useState("editor"); // "editor" | "lista"

  // ── Estado del editor de ruta ──────────────────────────────────────────────
  const [routeName, setRouteName] = useState("");
  const [routeDate, setRouteDate] = useState(today);
  const [routeStart, setRouteStart] = useState(""); // dirección de salida
  const [stops, setStops] = useState([]); // { id, type:"cliente"|"proveedor"|"custom", refId, name, address, horarioAbre, horarioCierra, diasDisponibles, note, order }
  const [optimized, setOptimized] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState("");
  const [showSavePanel, setShowSavePanel] = useState(false);

  // ── Agregar parada ─────────────────────────────────────────────────────────
  const [addMode, setAddMode] = useState(null); // null | "cliente" | "proveedor" | "custom"
  const [addSearch, setAddSearch] = useState("");
  const [customAddr, setCustomAddr] = useState({ name: "", address: "", note: "" });

  const addStop = (type, ref) => {
    const id = `stop_${Date.now()}`;
    setStops(prev => [...prev, {
      id, type, refId: ref.id,
      name: ref.name,
      address: ref.direccion || "",
      horarioAbre: ref.horarioAbre || "",
      horarioCierra: ref.horarioCierra || "",
      diasDisponibles: ref.diasDisponibles || "",
      note: "",
      order: prev.length + 1,
    }]);
    setAddMode(null); setAddSearch("");
    setOptimized(false);
  };

  const addCustomStop = () => {
    if (!customAddr.name || !customAddr.address) return;
    const id = `stop_${Date.now()}`;
    setStops(prev => [...prev, { id, type: "custom", refId: null, name: customAddr.name, address: customAddr.address, horarioAbre: "", horarioCierra: "", diasDisponibles: "", note: customAddr.note, order: prev.length + 1 }]);
    setCustomAddr({ name: "", address: "", note: "" });
    setAddMode(null);
    setOptimized(false);
  };

  const removeStop = (id) => { setStops(prev => prev.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 }))); setOptimized(false); };

  const moveStop = (id, dir) => {
    setStops(prev => {
      const arr = [...prev];
      const idx = arr.findIndex(s => s.id === id);
      const target = idx + dir;
      if (target < 0 || target >= arr.length) return arr;
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr.map((s, i) => ({ ...s, order: i + 1 }));
    });
    setOptimized(false);
  };

  const updateStopNote = (id, note) => setStops(prev => prev.map(s => s.id === id ? { ...s, note } : s));
  const updateStopAddr = (id, address) => setStops(prev => prev.map(s => s.id === id ? { ...s, address } : s));

  // ── Optimización con IA ────────────────────────────────────────────────────
  const optimizeRoute = async () => {
    if (stops.length < 2) return;
    setIsOptimizing(true);
    setOptimizeError("");
    try {
      const res = await fetch("/api/claude-optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stops, routeStart }),
      });
      const data = await res.json();
      if (data.error) { setOptimizeError(data.error); setIsOptimizing(false); return; }
      const order = data.order;
      if (Array.isArray(order) && order.length === stops.length) {
        const reordered = order.map((idx, i) => ({ ...stops[idx], order: i + 1 }));
        setStops(reordered);
        setOptimized(true);
      }
    } catch (e) {
      console.error("Optimize error", e);
      setOptimizeError("No se pudo conectar con el servidor. Intentá de nuevo.");
    }
    setIsOptimizing(false);
  };

  // ── URL Google Maps con todas las paradas ─────────────────────────────────
  const googleMapsUrl = () => {
    if (stops.length === 0) return "#";
    const origin = encodeURIComponent(routeStart || "Buenos Aires, Argentina");
    const waypoints = stops.map(s => encodeURIComponent(s.address || s.name)).join("|");
    const waypointsParam = waypoints ? "&waypoints=" + waypoints : "";
    return "https://www.google.com/maps/dir/?api=1&origin=" + origin + "&destination=" + origin + waypointsParam + "&travelmode=driving";
  };

  // ── Guardar ruta ───────────────────────────────────────────────────────────
  const saveRoute = () => {
    if (!routeName || stops.length === 0) return;
    const route = { id: activeRoute || `r${Date.now()}`, name: routeName, date: routeDate, start: routeStart, stops: [...stops], optimized, createdAt: today };
    if (activeRoute) {
      setSavedRoutes(prev => prev.map(r => r.id === activeRoute ? route : r));
    } else {
      setSavedRoutes(prev => [...prev, route]);
      setActiveRoute(route.id);
    }
  };

  const loadRoute = (r) => {
    setRouteName(r.name); setRouteDate(r.date); setRouteStart(r.start);
    setStops(r.stops); setOptimized(r.optimized); setActiveRoute(r.id);
    setShowSavePanel(true);
    setView("editor");
  };

  const deleteRoute = (id) => { setSavedRoutes(prev => prev.filter(r => r.id !== id)); if (activeRoute === id) { setActiveRoute(null); setView("lista"); } };

  const newRoute = () => {
    setRouteName(""); setRouteDate(today); setRouteStart(""); setStops([]);
    setOptimized(false); setActiveRoute(null); setShowSavePanel(false); setView("editor");
  };

  // ── Helper URL Maps para ruta guardada ───────────────────────────────────
  const routeMapsUrl = (r) => {
    if (!r.stops.length) return "#";
    const origin = encodeURIComponent(r.start || "Buenos Aires, Argentina");
    const wp = r.stops.map(s => encodeURIComponent(s.address || s.name)).join("|");
    const wpParam = wp ? "&waypoints=" + wp : "";
    return "https://www.google.com/maps/dir/?api=1&origin=" + origin + "&destination=" + origin + wpParam + "&travelmode=driving";
  };

  // ── Filtros de búsqueda para paradas ──────────────────────────────────────
  const clientResults = clients.filter(c =>
    addSearch === "" || c.name.toLowerCase().includes(addSearch.toLowerCase()) || c.direccion?.toLowerCase().includes(addSearch.toLowerCase())
  ).filter(c => !stops.some(s => s.refId === c.id));

  const supplierResults = suppliers.filter(s =>
    addSearch === "" || s.name.toLowerCase().includes(addSearch.toLowerCase()) || s.direccion?.toLowerCase().includes(addSearch.toLowerCase())
  ).filter(s => !stops.some(st => st.refId === s.id));

  // ── Helpers de horario ────────────────────────────────────────────────────
  const horarioLabel = (s) => {
    if (s.horarioAbre && s.horarioCierra) return `${s.horarioAbre} – ${s.horarioCierra}`;
    if (s.horarioAbre) return `Desde ${s.horarioAbre}`;
    return "Sin horario";
  };

  const TYPE_COLORS = {
    cliente:   { color: T.accent,  bg: T.accentLight,  label: "Cliente" },
    proveedor: { color: T.orange,  bg: T.orangeLight,  label: "Proveedor" },
    custom:    { color: T.purple,  bg: T.purpleLight,  label: "Especial" },
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Logística</div>
          <div style={{ fontSize: 13, color: T.muted }}>Armá la ruta de hoy, optimizala y compartila con el chofer</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {savedRoutes.length > 0 && view === "editor" && (
            <button onClick={() => setView("lista")}
              style={{ background: T.surface2, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              Rutas guardadas ({savedRoutes.length})
            </button>
          )}
          {view === "lista" && (
            <button onClick={() => { setView("editor"); setActiveRoute(null); }}
              style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
              + Nueva ruta
            </button>
          )}
        </div>
      </div>

      {/* ══ LISTA DE RUTAS GUARDADAS ══ */}
      {view === "lista" && (
        <div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 16 }}>Rutas guardadas como referencia. Podés cargarlas para reutilizarlas o editarlas.</div>
          {savedRoutes.length === 0 ? (
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: "32px", textAlign: "center", color: T.muted, fontSize: 13 }}>
              No hay rutas guardadas todavía.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {savedRoutes.map(r => (
                <div key={r.id} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: "18px 22px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: T.ink }}>{r.name}</span>
                      {r.optimized && <span style={{ fontSize: 10, fontWeight: 700, color: T.accent, background: T.accentLight, padding: "2px 8px", borderRadius: 8 }}>✦ Optimizada</span>}
                    </div>
                    <div style={{ fontSize: 12, color: T.muted, marginBottom: 6 }}>
                      📅 {r.date} · {r.stops.length} parada{r.stops.length !== 1 ? "s" : ""}
                      {r.start && <span> · Salida: {r.start}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {r.stops.slice(0, 4).map(s => {
                        const tc = TYPE_COLORS[s.type];
                        return <span key={s.id} style={{ fontSize: 11, background: tc.bg, color: tc.color, padding: "2px 8px", borderRadius: 8, fontWeight: 600 }}>{s.order}. {s.name}</span>;
                      })}
                      {r.stops.length > 4 && <span style={{ fontSize: 11, color: T.muted }}>+{r.stops.length - 4} más</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginLeft: 16 }}>
                    <a href={routeMapsUrl(r)}
                      target="_blank" rel="noreferrer"
                      style={{ background: T.blueLight, color: T.blue, border: `1px solid ${T.blue}30`, borderRadius: 7, padding: "6px 12px", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                      🗺 Maps
                    </a>
                    <button onClick={() => loadRoute(r)} style={{ background: T.surface2, color: T.ink, border: `1px solid ${T.border}`, borderRadius: 7, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Editar</button>
                    <button onClick={() => deleteRoute(r.id)} style={{ background: T.redLight, color: T.red, border: "none", borderRadius: 7, padding: "6px 12px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ EDITOR DE RUTA ══ */}
      {view === "editor" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>

          {/* Panel principal */}
          <div>
          {/* Header de ruta — fecha y salida siempre visibles, nombre solo para guardar */}
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: 20, marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>FECHA DE LA RUTA</label>
                  <input type="date" value={routeDate} onChange={e => setRouteDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>DIRECCIÓN DE SALIDA Y LLEGADA</label>
                  <input value={routeStart} onChange={e => setRouteStart(e.target.value)} placeholder="ej: Campana, Buenos Aires"
                    style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                </div>
              </div>
              {/* Guardar — opcional, colapsable */}
              <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 12 }}>
                <button onClick={() => setShowSavePanel(s => !s)}
                  style={{ background: "none", border: "none", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 5 }}>
                  {showSavePanel ? "▾" : "▸"} Guardar esta ruta para usarla de referencia (opcional)
                </button>
                {showSavePanel && (
                  <div style={{ marginTop: 10, display: "flex", gap: 10, alignItems: "flex-end" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>NOMBRE DE LA RUTA</label>
                      <input value={routeName} onChange={e => setRouteName(e.target.value)} placeholder="ej: Ruta GBA Norte - Jueves"
                        style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                    </div>
                    <button onClick={saveRoute} disabled={!routeName || stops.length === 0}
                      style={{ padding: "10px 18px", borderRadius: 8, background: T.accentLight, color: T.accent, border: `1px solid ${T.accent}40`, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap", opacity: (!routeName || stops.length === 0) ? 0.5 : 1 }}>
                      💾 Guardar
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Lista de paradas */}
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: T.ink }}>
                  Paradas <span style={{ fontSize: 12, color: T.muted, fontWeight: 400 }}>({stops.length})</span>
                </div>
                {optimized && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.accent, background: T.accentLight, padding: "3px 10px", borderRadius: 8 }}>
                    ✦ Ruta optimizada por IA
                  </span>
                )}
              </div>

              {stops.length === 0 ? (
                <div style={{ padding: "32px", textAlign: "center", color: T.muted, fontSize: 13 }}>
                  Agregá paradas usando el panel de la derecha →
                </div>
              ) : (
                <div>
                  {/* Punto de salida */}
                  {routeStart && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, background: T.surface2 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 800, flexShrink: 0 }}>🏁</div>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>SALIDA</div>
                        <div style={{ fontSize: 13, color: T.ink }}>{routeStart}</div>
                      </div>
                    </div>
                  )}

                  {stops.map((s, idx) => {
                    const tc = TYPE_COLORS[s.type];
                    const hasConflict = false; // podría calcularse vs hora estimada de llegada
                    return (
                      <div key={s.id} style={{ borderBottom: `1px solid ${T.border}`, background: hasConflict ? `${T.yellow}08` : "transparent" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "14px 20px" }}>
                          {/* Número y controles de orden */}
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0 }}>
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: tc.bg, border: `2px solid ${tc.color}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: tc.color }}>{s.order}</div>
                            <button onClick={() => moveStop(s.id, -1)} disabled={idx === 0}
                              style={{ background: "none", border: "none", color: idx === 0 ? T.faint : T.muted, cursor: idx === 0 ? "default" : "pointer", fontSize: 12, padding: "1px 4px" }}>▲</button>
                            <button onClick={() => moveStop(s.id, 1)} disabled={idx === stops.length - 1}
                              style={{ background: "none", border: "none", color: idx === stops.length - 1 ? T.faint : T.muted, cursor: idx === stops.length - 1 ? "default" : "pointer", fontSize: 12, padding: "1px 4px" }}>▼</button>
                          </div>

                          {/* Info de la parada */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                              <span style={{ fontSize: 10, fontWeight: 700, background: tc.bg, color: tc.color, padding: "2px 7px", borderRadius: 6 }}>{tc.label}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{s.name}</span>
                            </div>
                            {/* Dirección editable */}
                            <input value={s.address} onChange={e => updateStopAddr(s.id, e.target.value)} placeholder="Dirección..."
                              style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: `1px solid ${s.address ? T.border : T.yellow+"60"}`, background: T.surface2, color: T.ink, fontSize: 12, fontFamily: "inherit", outline: "none", marginBottom: 6, boxSizing: "border-box" }} />
                            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                              {(s.horarioAbre || s.horarioCierra) && (
                                <span style={{ fontSize: 11, color: T.blue }}>🕐 {horarioLabel(s)}</span>
                              )}
                              {s.diasDisponibles && (
                                <span style={{ fontSize: 11, color: T.muted }}>📅 {s.diasDisponibles}</span>
                              )}
                            </div>
                            {/* Nota de la parada */}
                            <input value={s.note} onChange={e => updateStopNote(s.id, e.target.value)} placeholder="Nota para el chofer (opcional)..."
                              style={{ width: "100%", padding: "6px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 11, fontFamily: "inherit", outline: "none", marginTop: 6, boxSizing: "border-box" }} />
                          </div>

                          {/* Botones */}
                          <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.address || s.name)}`}
                              target="_blank" rel="noreferrer"
                              style={{ background: T.blueLight, color: T.blue, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center" }}>
                              📍
                            </a>
                            <button onClick={() => removeStop(s.id)}
                              style={{ background: T.redLight, color: T.red, border: "none", borderRadius: 6, padding: "4px 8px", fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Regreso al origen */}
                  {stops.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", background: T.surface2 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.accentLight, border: `2px solid ${T.accent}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>🏁</div>
                      <div style={{ fontSize: 12, color: T.muted }}>Regreso a <span style={{ color: T.accent, fontWeight: 600 }}>{routeStart || "punto de salida"}</span></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Botones de acción principales */}
            {optimizeError && (
              <div style={{ background: "#ff000015", border: "1px solid #ff000040", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: T.red, marginBottom: 10 }}>
                {optimizeError}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button onClick={optimizeRoute} disabled={isOptimizing || stops.length < 2}
                style={{ flex: 1, padding: "13px", borderRadius: 10, border: `1px solid ${stops.length < 2 ? T.border : T.accent + "50"}`, background: stops.length < 2 ? T.surface : optimized ? T.surface : T.accentLight, color: stops.length < 2 ? T.muted : T.accent, fontWeight: 700, fontSize: 14, cursor: (isOptimizing || stops.length < 2) ? "default" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: isOptimizing ? 0.7 : 1 }}>
                {isOptimizing ? "⏳ Optimizando ruta..." : optimized ? "✦ Ruta optimizada · Reoptimizar" : "✦ Optimizar ruta con IA"}
              </button>
              <a href={stops.length >= 1 ? googleMapsUrl() : "#"}
                onClick={e => stops.length < 1 && e.preventDefault()}
                target="_blank" rel="noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 6, background: stops.length >= 1 ? T.accent : T.surface, color: stops.length >= 1 ? "#fff" : T.muted, border: `1px solid ${stops.length >= 1 ? T.accent : T.border}`, borderRadius: 10, padding: "13px 22px", fontWeight: 700, fontSize: 14, textDecoration: "none", whiteSpace: "nowrap", cursor: stops.length >= 1 ? "pointer" : "default" }}>
                🗺 Abrir en Google Maps
              </a>
            </div>
          </div>

          {/* Panel lateral: agregar paradas */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Acciones de agregar */}
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 12 }}>AGREGAR PARADA</div>
              <div style={{ display: "flex", flex: 1, flexDirection: "column", gap: 8 }}>
                {[["cliente", "🏪 Cliente", T.accent, T.accentLight], ["proveedor", "📦 Proveedor", T.orange, T.orangeLight], ["custom", "📍 Dirección especial", T.purple, T.purpleLight]].map(([mode, label, color, bg]) => (
                  <button key={mode} onClick={() => setAddMode(addMode === mode ? null : mode)}
                    style={{ padding: "10px 14px", borderRadius: 9, border: `1px solid ${addMode === mode ? color : T.border}`, background: addMode === mode ? bg : "transparent", color: addMode === mode ? color : T.muted, fontWeight: 600, fontSize: 13, cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Panel cliente */}
              {addMode === "cliente" && (
                <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                  <SearchBar value={addSearch} onChange={setAddSearch} placeholder="Buscar cliente..." />
                  <div style={{ marginTop: 10, maxHeight: 220, overflowY: "auto" }}>
                    {clientResults.length === 0 && <div style={{ fontSize: 12, color: T.muted, padding: "8px 0" }}>{stops.some(s => s.type === "cliente") ? "Todos los clientes ya están en la ruta" : "Sin clientes disponibles"}</div>}
                    {clientResults.map(c => (
                      <div key={c.id} onClick={() => addStop("cliente", c)}
                        style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 6, cursor: "pointer", background: T.surface }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = T.accent}
                        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{c.name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{c.direccion || "Sin dirección"}</div>
                        {(c.horarioAbre || c.horarioCierra) && <div style={{ fontSize: 11, color: T.blue }}>🕐 {c.horarioAbre || "?"} – {c.horarioCierra || "?"}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel proveedor */}
              {addMode === "proveedor" && (
                <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 14 }}>
                  <SearchBar value={addSearch} onChange={setAddSearch} placeholder="Buscar proveedor..." />
                  <div style={{ marginTop: 10, maxHeight: 220, overflowY: "auto" }}>
                    {supplierResults.length === 0 && <div style={{ fontSize: 12, color: T.muted, padding: "8px 0" }}>Sin proveedores disponibles</div>}
                    {supplierResults.map(s => (
                      <div key={s.id} onClick={() => addStop("proveedor", s)}
                        style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${T.border}`, marginBottom: 6, cursor: "pointer", background: T.surface }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = T.orange}
                        onMouseLeave={e => e.currentTarget.style.borderColor = T.border}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: T.muted }}>{s.direccion || "Sin dirección"}</div>
                        {(s.horarioAbre || s.horarioCierra) && <div style={{ fontSize: 11, color: T.blue }}>🕐 {s.horarioAbre || "?"} – {s.horarioCierra || "?"}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Panel dirección especial */}
              {addMode === "custom" && (
                <div style={{ marginTop: 14, borderTop: `1px solid ${T.border}`, paddingTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={customAddr.name} onChange={e => setCustomAddr(f => ({...f, name: e.target.value}))} placeholder="Nombre del lugar *"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${customAddr.name ? T.border : T.red+"50"}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  <input value={customAddr.address} onChange={e => setCustomAddr(f => ({...f, address: e.target.value}))} placeholder="Dirección *"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${customAddr.address ? T.border : T.red+"50"}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  <input value={customAddr.note} onChange={e => setCustomAddr(f => ({...f, note: e.target.value}))} placeholder="Nota (opcional)"
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
                  <button onClick={addCustomStop} disabled={!customAddr.name || !customAddr.address}
                    style={{ padding: "9px", borderRadius: 8, background: T.purpleLight, color: T.purple, border: `1px solid ${T.purple}40`, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit", opacity: (!customAddr.name || !customAddr.address) ? 0.5 : 1 }}>
                    + Agregar parada
                  </button>
                </div>
              )}
            </div>

            {/* Info / ayuda */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>CÓMO USAR</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.7 }}>
                1. Cargá la dirección de salida<br />
                2. Agregá los clientes y proveedores a visitar<br />
                3. Presioná <span style={{ color: T.accent, fontWeight: 700 }}>✦ Optimizar ruta</span> para que la IA ordene las paradas respetando horarios<br />
                4. Ajustá manualmente con ▲▼ si necesitás<br />
                5. Presioná <span style={{ color: T.accent, fontWeight: 700 }}>🗺 Abrir en Google Maps</span> para compartir con el chofer
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODULE: REPORTES ────────────────────────────────────────────────────────
function ReportesModule({ saleInvoices, purchaseInvoices, products, clients, suppliers, cajas, cajaMovimientos }) {
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [filterDesde, setFilterDesde] = useState("");
  const [filterHasta, setFilterHasta] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [ventasDiaView, setVentasDiaView] = useState("cliente");
  const [ventasDiaDeselClientes, setVentasDiaDeselClientes] = useState(new Set());
  const [ventasDiaDeselProductos, setVentasDiaDeselProductos] = useState(new Set());
  const [cobranzasTab, setCobranzasTab] = useState("cobradas");
  const [evolView, setEvolView] = useState("mes");
  const [evolDeselClientes, setEvolDeselClientes] = useState(new Set());
  const [evolDeselProductos, setEvolDeselProductos] = useState(new Set());
  const [rankingDrillClient, setRankingDrillClient] = useState(null);

  const hoy = new Date().toISOString().slice(0, 10);
  const diasAtras = (n) => { const d = new Date(hoy); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  const ym = (date) => date?.slice(0, 7) || "";


  const allFacturas = saleInvoices.filter(i => i.type === "factura");
  const facturas = allFacturas.filter(i => {
    if (filterDesde && i.date < filterDesde) return false;
    if (filterHasta && i.date > filterHasta) return false;
    if (filterSearch && !i.clientName?.toLowerCase().includes(filterSearch.toLowerCase())) return false;
    return true;
  });

  const facturasHoy = allFacturas.filter(i => i.date === hoy);
  const facturasSemanaAnterior = allFacturas.filter(i => i.date >= diasAtras(14) && i.date <= diasAtras(7));
  const ventasHoy = facturasHoy.reduce((s, i) => s + i.total, 0);
  const ventasSemAnt = facturasSemanaAnterior.reduce((s, i) => s + i.total, 0);

  const pendientes = facturas.filter(i => i.status === "pendiente");
  const cobradas = facturas.filter(i => i.status === "cobrada");

  const aging = (days) => pendientes.filter(i => {
    const d = Math.round((new Date(hoy) - new Date(i.due)) / 86400000);
    return d > 0 && (days === "+90" ? d > 90 : days === "61-90" ? d > 60 && d <= 90 : days === "31-60" ? d > 30 && d <= 60 : d <= 30);
  });

  const stockBajo = products.filter(p => p.tracksStock !== false && p.stock < p.minStock);

  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(hoy); d.setDate(1); d.setMonth(d.getMonth() - i);
    return d.toISOString().slice(0, 7);
  }).reverse();

  const ventasPorMes = last6Months.map(m => ({
    label: m,
    total: facturas.filter(i => ym(i.date) === m).reduce((s, i) => s + i.total, 0),
    count: facturas.filter(i => ym(i.date) === m).length,
  }));

  const rankingProductos = (() => {
    const map = {};
    facturas.forEach(inv => (inv.lines || []).forEach(l => {
      if (!l.name) return;
      map[l.name] = (map[l.name] || 0) + l.subtotal;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();

  const rankingClientes = (() => {
    const map = {};
    facturas.forEach(inv => { map[inv.clientName] = (map[inv.clientName] || 0) + inv.total; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();

  const totalVentas = facturas.reduce((s, i) => s + i.total, 0);
  const totalCompras = purchaseInvoices.reduce((s, i) => s + i.total, 0);
  const totalCobrado = cobradas.reduce((s, i) => s + i.total, 0);
  const totalPendiente = pendientes.reduce((s, i) => s + i.total, 0);

  // ── Reports data ──────────────────────────────────────────────────────────
  const reports = {
    // OPERATIVOS
    ventas_dia: {
      title: "Resumen de ventas del día", layer: "op", mvp: true, tag: "Ventas",
      exportData: () => {
        const todosClientes = [...new Set(facturas.map(i => i.clientName).filter(Boolean))].sort();
        const todosProductos = [...new Set(facturas.flatMap(i => (i.lines||[]).map(l => l.name).filter(Boolean)))].sort();
        const clientesSel = todosClientes.filter(c => !ventasDiaDeselClientes.has(c));
        const productosSel = todosProductos.filter(p => !ventasDiaDeselProductos.has(p));
        const totalSel = ventasDiaView === "cliente"
          ? facturas.filter(i => clientesSel.includes(i.clientName)).reduce((s,i)=>s+i.total,0)
          : facturas.reduce((s,inv)=>s+(inv.lines||[]).filter(l=>productosSel.includes(l.name)).reduce((ss,l)=>ss+l.subtotal,0),0);
        if (ventasDiaView === "cliente") {
          const map = {};
          facturas.filter(i => clientesSel.includes(i.clientName)).forEach(i => { map[i.clientName] = (map[i.clientName]||0) + i.total; });
          const resumen = Object.entries(map).sort((a,b)=>b[1]-a[1]);
          return { sheets: [
            { title: "Resumen por cliente", headers: ["Cliente", "Total facturado", "Facturas", "Ticket promedio", "% del total"],
              rows: resumen.map(([c,t]) => { const n=facturas.filter(i=>i.clientName===c).length; return [c, t, n, n>0?+(t/n).toFixed(2):0, totalSel>0?+(t/totalSel*100).toFixed(1):0]; }),
              chart: { type: 'bar', labels: resumen.map(([c])=>c), values: resumen.map(([,t])=>t), title: 'Total facturado por cliente' } },
            { title: "Facturas", headers: ["Nro.", "Fecha", "Cliente", "Estado", "Total"],
              rows: facturas.filter(i=>clientesSel.includes(i.clientName)).sort((a,b)=>b.date.localeCompare(a.date)).map(i=>[i.nroFactura||i.id, i.date, i.clientName, i.status, i.total]) },
          ]};
        } else {
          const map = {};
          facturas.forEach(inv => (inv.lines||[]).forEach(l => { if (!l.name||!productosSel.includes(l.name)) return; map[l.name]=(map[l.name]||0)+l.subtotal; }));
          const resumen = Object.entries(map).sort((a,b)=>b[1]-a[1]);
          return { sheets: [
            { title: "Resumen por producto", headers: ["Producto", "Total facturado", "% del total"],
              rows: resumen.map(([p,t]) => [p, t, totalSel>0?+(t/totalSel*100).toFixed(1):0]),
              chart: { type: 'bar', labels: resumen.map(([p])=>p), values: resumen.map(([,t])=>t), title: 'Total facturado por producto' } },
            { title: "Líneas de factura", headers: ["Nro. Factura", "Fecha", "Cliente", "Producto", "Cant.", "Precio unit.", "Subtotal"],
              rows: facturas.flatMap(inv => (inv.lines||[]).filter(l=>productosSel.includes(l.name)).map(l=>[inv.nroFactura||inv.id, inv.date, inv.clientName, l.name, l.qty, l.price, l.subtotal])).sort((a,b)=>b[1].localeCompare(a[1])) },
          ]};
        }
      },
      render: () => {
        const todosClientes = [...new Set(facturas.map(i => i.clientName).filter(Boolean))].sort();
        const todosProductos = [...new Set(facturas.flatMap(i => (i.lines || []).map(l => l.name).filter(Boolean)))].sort();
        const clientesSel = todosClientes.filter(c => !ventasDiaDeselClientes.has(c));
        const productosSel = todosProductos.filter(p => !ventasDiaDeselProductos.has(p));

        const porCliente = {};
        facturas.forEach(i => { if (!porCliente[i.clientName]) porCliente[i.clientName] = 0; porCliente[i.clientName] += i.total; });
        const porProducto = {};
        facturas.forEach(inv => (inv.lines || []).forEach(l => { if (!l.name) return; if (!porProducto[l.name]) porProducto[l.name] = 0; porProducto[l.name] += l.subtotal; }));

        const totalSel = ventasDiaView === "cliente"
          ? facturas.filter(i => clientesSel.includes(i.clientName)).reduce((s, i) => s + i.total, 0)
          : ventasDiaView === "producto"
            ? facturas.reduce((s, inv) => s + (inv.lines || []).filter(l => productosSel.includes(l.name)).reduce((ss, l) => ss + l.subtotal, 0), 0)
            : facturas.reduce((s, i) => s + i.total, 0);
        const opsSel = ventasDiaView === "cliente"
          ? facturas.filter(i => clientesSel.includes(i.clientName)).length
          : facturas.length;

        const is = { padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 12, fontFamily: "inherit", outline: "none" };
        const maxBarCliente = Math.max(...clientesSel.map(c => porCliente[c] || 0), 1);
        const maxBarProducto = Math.max(...productosSel.map(p => porProducto[p] || 0), 1);

        const toggleCliente = (c) => setVentasDiaDeselClientes(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });
        const toggleProducto = (p) => setVentasDiaDeselProductos(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });

        return (
          <div>
            {/* KPIs dinámicos */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
              {[
                { l: ventasDiaView === "total" ? "Total vendido" : "Total seleccionado", v: fmt(totalSel), c: T.accent },
                { l: "Operaciones", v: opsSel },
                { l: "Ticket promedio", v: opsSel > 0 ? fmt(Math.round(totalSel / opsSel)) : "—" },
              ].map((k, i) => (
                <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, fontWeight: 700 }}>{k.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: k.c || T.ink }}>{k.v}</div>
                </div>
              ))}
            </div>

            {/* Controles: selector de vista + fechas */}
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 24, flexWrap: "wrap", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1 }}>VISTA</span>
                <select value={ventasDiaView} onChange={e => setVentasDiaView(e.target.value)} style={{ ...is, fontWeight: 600 }}>
                  <option value="cliente">Por cliente</option>
                  <option value="producto">Por producto</option>
                </select>
              </div>
              <div style={{ width: 1, height: 28, background: T.border }} />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1 }}>DESDE</span>
                <input type="date" value={filterDesde} onChange={e => setFilterDesde(e.target.value)} style={is} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1 }}>HASTA</span>
                <input type="date" value={filterHasta} onChange={e => setFilterHasta(e.target.value)} style={is} />
              </div>
              <QuickDateFilter setFrom={setFilterDesde} setTo={setFilterHasta} style={is} />
              {(filterDesde || filterHasta) && (
                <button onClick={() => { setFilterDesde(""); setFilterHasta(""); }} style={{ fontSize: 11, padding: "5px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, cursor: "pointer", fontFamily: "inherit" }}>Limpiar fechas</button>
              )}
            </div>

            {facturas.length === 0 && <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 32 }}>Sin ventas en el período seleccionado.</div>}

            {/* VISTA: POR CLIENTE */}
            {ventasDiaView === "cliente" && facturas.length > 0 && (
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>CLIENTES · seleccioná para sumar</div>
                  {todosClientes.map(c => {
                    const checked = !ventasDiaDeselClientes.has(c);
                    return (
                      <label key={c} onClick={() => toggleCliente(c)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: checked ? T.accentLight : T.surface, border: `1px solid ${checked ? T.accent + "50" : T.border}`, cursor: "pointer", userSelect: "none" }}>
                        <input type="checkbox" checked={checked} onChange={() => toggleCliente(c)} style={{ accentColor: T.accent, width: 14, height: 14 }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: checked ? 600 : 400, color: checked ? T.ink : T.muted }}>{c}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: checked ? T.accent : T.muted }}>{fmt(porCliente[c] || 0)}</span>
                      </label>
                    );
                  })}
                  <div style={{ marginTop: 10, padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>TOTAL</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: T.accent }}>{fmt(totalSel)}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {clientesSel.length === 0
                    ? <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 40 }}>Seleccioná al menos un cliente.</div>
                    : clientesSel.sort((a, b) => (porCliente[b] || 0) - (porCliente[a] || 0)).map(c => (
                      <div key={c} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                          <span style={{ fontWeight: 600 }}>{c}</span>
                          <span style={{ fontWeight: 800, color: T.accent }}>{fmt(porCliente[c] || 0)}</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 5, background: T.border }}>
                          <div style={{ height: "100%", width: `${((porCliente[c] || 0) / maxBarCliente) * 100}%`, background: T.accent, borderRadius: 5 }} />
                        </div>
                        <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{((porCliente[c] || 0) / Math.max(totalSel, 1) * 100).toFixed(1)}% del total seleccionado</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* VISTA: POR PRODUCTO */}
            {ventasDiaView === "producto" && facturas.length > 0 && (
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 6 }}>ARTÍCULOS · seleccioná para sumar</div>
                  {todosProductos.length === 0
                    ? <div style={{ color: T.muted, fontSize: 12, padding: 12 }}>Sin detalle de artículos en las facturas.</div>
                    : todosProductos.map(p => {
                      const checked = !ventasDiaDeselProductos.has(p);
                      return (
                        <label key={p} onClick={() => toggleProducto(p)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 8, background: checked ? T.accentLight : T.surface, border: `1px solid ${checked ? T.accent + "50" : T.border}`, cursor: "pointer", userSelect: "none" }}>
                          <input type="checkbox" checked={checked} onChange={() => toggleProducto(p)} style={{ accentColor: T.accent, width: 14, height: 14 }} />
                          <span style={{ flex: 1, fontSize: 12, fontWeight: checked ? 600 : 400, color: checked ? T.ink : T.muted }}>{p}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: checked ? T.accent : T.muted }}>{fmt(porProducto[p] || 0)}</span>
                        </label>
                      );
                    })
                  }
                  <div style={{ marginTop: 10, padding: "10px 14px", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>TOTAL</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: T.accent }}>{fmt(totalSel)}</span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  {productosSel.length === 0
                    ? <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 40 }}>Seleccioná al menos un artículo.</div>
                    : productosSel.sort((a, b) => (porProducto[b] || 0) - (porProducto[a] || 0)).map(p => (
                      <div key={p} style={{ marginBottom: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 5 }}>
                          <span style={{ fontWeight: 600 }}>{p}</span>
                          <span style={{ fontWeight: 800, color: T.accent }}>{fmt(porProducto[p] || 0)}</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 5, background: T.border }}>
                          <div style={{ height: "100%", width: `${((porProducto[p] || 0) / maxBarProducto) * 100}%`, background: T.accent, borderRadius: 5 }} />
                        </div>
                        <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>{((porProducto[p] || 0) / Math.max(totalSel, 1) * 100).toFixed(1)}% del total seleccionado</div>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    cobranzas_dia: {
      title: "Cobranzas del día", layer: "op", mvp: true, tag: "Ventas",
      exportData: () => ({
        sheets: [
          { title: "Resumen", headers: ["Indicador", "Monto", "Facturas"],
            rows: [["Total cobrado", totalCobrado, cobradas.length], ["Pendiente de cobro", totalPendiente, pendientes.length]] },
          { title: "Cobradas", headers: ["Nro.", "Cliente", "Fecha emisión", "Vencimiento", "Total"],
            rows: cobradas.sort((a,b)=>b.date.localeCompare(a.date)).map(i=>[i.nroFactura||i.id, i.clientName||"", i.date, i.due, i.total]) },
          { title: "Pendientes de cobro", headers: ["Nro.", "Cliente", "Fecha emisión", "Vencimiento", "Días vencida", "Total"],
            rows: pendientes.sort((a,b)=>b.date.localeCompare(a.date)).map(i=>{ const d=Math.round((new Date(hoy)-new Date(i.due))/86400000); return [i.nroFactura||i.id, i.clientName||"", i.date, i.due, d>0?d:0, i.total]; }) },
        ]
      }),
      render: () => {
        const cobradasPorCliente = {};
        cobradas.forEach(i => { if (!cobradasPorCliente[i.clientName]) cobradasPorCliente[i.clientName] = []; cobradasPorCliente[i.clientName].push(i); });
        const pendientesPorCliente = {};
        pendientes.forEach(i => { if (!pendientesPorCliente[i.clientName]) pendientesPorCliente[i.clientName] = []; pendientesPorCliente[i.clientName].push(i); });
        const tabStyle = (k) => ({ padding: "7px 20px", borderRadius: 7, border: "none", background: cobranzasTab === k ? T.accent : T.surface, color: cobranzasTab === k ? "#fff" : T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" });
        const renderGrupo = (porCliente, accentColor) => Object.entries(porCliente).sort((a, b) => b[1].reduce((s, i) => s + i.total, 0) - a[1].reduce((s, i) => s + i.total, 0)).map(([cliente, invs]) => (
          <div key={cliente} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: T.surface, borderRadius: "8px 8px 0 0", borderBottom: `2px solid ${accentColor}` }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{cliente}</span>
              <span style={{ fontWeight: 800, color: accentColor, fontSize: 14 }}>{fmt(invs.reduce((s, i) => s + i.total, 0))}</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ background: T.surface2 }}>{["Nro. Factura", "Fecha emisión", "Vencimiento", "Total"].map(h => <th key={h} style={{ padding: "6px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
              <tbody>{invs.map(i => (
                <tr key={i.id} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "7px 12px", fontFamily: "monospace", fontSize: 11, color: T.blue }}>{i.nroFactura || i.id}</td>
                  <td style={{ padding: "7px 12px", color: T.muted }}>{i.date}</td>
                  <td style={{ padding: "7px 12px", color: i.due < hoy && cobranzasTab === "pendientes" ? T.red : T.muted }}>{i.due}</td>
                  <td style={{ padding: "7px 12px", fontWeight: 700, color: accentColor }}>{fmt(i.total)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ));
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              {[{ l: "Total cobrado", v: fmt(totalCobrado), c: T.accent, n: cobradas.length }, { l: "Pendiente de cobro", v: fmt(totalPendiente), c: T.red, n: pendientes.length }].map((k, i) => (
                <div key={i} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px" }}>
                  <div style={{ fontSize: 10, color: T.muted, marginBottom: 6, fontWeight: 700 }}>{k.l}</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: k.c }}>{k.v}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{k.n} facturas</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 20, background: T.surface2, padding: 4, borderRadius: 9, width: "fit-content" }}>
              <button onClick={() => setCobranzasTab("cobradas")} style={tabStyle("cobradas")}>Cobradas ({cobradas.length})</button>
              <button onClick={() => setCobranzasTab("pendientes")} style={tabStyle("pendientes")}>Pendientes ({pendientes.length})</button>
            </div>
            {cobranzasTab === "cobradas" && (Object.keys(cobradasPorCliente).length === 0
              ? <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 24 }}>Sin facturas cobradas en el período.</div>
              : renderGrupo(cobradasPorCliente, T.accent)
            )}
            {cobranzasTab === "pendientes" && (Object.keys(pendientesPorCliente).length === 0
              ? <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 24 }}>Sin facturas pendientes.</div>
              : renderGrupo(pendientesPorCliente, T.red)
            )}
          </div>
        );
      }
    },
    aging: {
      title: "Facturas pendientes", layer: "op", mvp: true, tag: "Ventas",
      exportData: () => {
        const buckets = [["0-30 días","0-30"],["31-60 días","31-60"],["61-90 días","61-90"],["+90 días","+90"]];
        const agingRows = buckets.map(([lbl,k]) => { const items=aging(k); return [lbl, items.reduce((s,i)=>s+i.total,0), items.length]; });
        return { sheets: [
          { title: "Resumen aging", headers: ["Rango", "Monto pendiente", "Facturas"],
            rows: agingRows,
            chart: { type: 'bar', labels: agingRows.map(r=>r[0]), values: agingRows.map(r=>r[1]), title: 'Deuda por antigüedad', color: '#E06C2A' } },
          { title: "Detalle por factura", headers: ["Cliente", "Nro.", "Fecha emisión", "Vencimiento", "Rango", "Días vencida", "Total"],
            rows: pendientes.sort((a,b)=>b.due.localeCompare(a.due)).map(i => {
              const d=Math.round((new Date(hoy)-new Date(i.due))/86400000);
              const rng=d>90?"+90 días":d>60?"61-90 días":d>30?"31-60 días":d>0?"0-30 días":"Vigente";
              return [i.clientName||"", i.nroFactura||i.id, i.date||"", i.due||"", rng, d>0?d:0, i.total];
            }) },
          { title: "Por cliente", headers: ["Cliente", "0-30 días", "31-60 días", "61-90 días", "+90 días", "Total"],
            rows: [...new Set(pendientes.map(i=>i.clientName))].map(c => {
              const cp=pendientes.filter(i=>i.clientName===c);
              return [c, aging("0-30").filter(i=>i.clientName===c).reduce((s,i)=>s+i.total,0), aging("31-60").filter(i=>i.clientName===c).reduce((s,i)=>s+i.total,0), aging("61-90").filter(i=>i.clientName===c).reduce((s,i)=>s+i.total,0), aging("+90").filter(i=>i.clientName===c).reduce((s,i)=>s+i.total,0), cp.reduce((s,i)=>s+i.total,0)];
            }).sort((a,b)=>b[5]-a[5]) },
        ]};
      },
      render: () => {
        const pendientesPorCliente = {};
        pendientes.forEach(i => { if (!pendientesPorCliente[i.clientName]) pendientesPorCliente[i.clientName] = []; pendientesPorCliente[i.clientName].push(i); });
        const getDiasColor = (due) => { const d = Math.round((new Date(hoy) - new Date(due)) / 86400000); return d > 90 ? T.red : d > 60 ? T.orange : d > 30 ? T.yellow : d > 0 ? T.accent : T.muted; };
        const getDiasLabel = (due) => { const d = Math.round((new Date(hoy) - new Date(due)) / 86400000); return d > 0 ? `${d}d vencida` : due === hoy ? "Vence hoy" : "Vigente"; };
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 24 }}>
              {[["0-30 días", aging("0-30"), T.accent], ["31-60 días", aging("31-60"), T.yellow], ["61-90 días", aging("61-90"), T.orange], ["+90 días", aging("+90"), T.red]].map(([label, items, color]) => (
                <div key={label} style={{ background: T.surface, border: `1px solid ${color}40`, borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 6 }}>{label}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color }}>{fmt(items.reduce((s, i) => s + i.total, 0))}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>{items.length} facturas</div>
                </div>
              ))}
            </div>
            {pendientes.length === 0
              ? <div style={{ color: T.muted, fontSize: 13, textAlign: "center", padding: 24 }}>Sin facturas pendientes.</div>
              : Object.entries(pendientesPorCliente).sort((a, b) => b[1].reduce((s, i) => s + i.total, 0) - a[1].reduce((s, i) => s + i.total, 0)).map(([cliente, invs]) => (
                <div key={cliente} style={{ marginBottom: 20 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", background: T.surface, borderRadius: "8px 8px 0 0", borderBottom: `2px solid ${T.yellow}` }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{cliente}</span>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: T.muted }}>{invs.length} factura{invs.length !== 1 ? "s" : ""}</span>
                      <span style={{ fontWeight: 800, color: T.yellow, fontSize: 14 }}>{fmt(invs.reduce((s, i) => s + i.total, 0))}</span>
                    </div>
                  </div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr style={{ background: T.surface2 }}>{["Nro. Factura", "Fecha emisión", "Vencimiento", "Estado", "Total"].map(h => <th key={h} style={{ padding: "6px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
                    <tbody>{invs.sort((a, b) => a.due > b.due ? 1 : -1).map(i => {
                      const color = getDiasColor(i.due);
                      return (
                        <tr key={i.id} style={{ borderTop: `1px solid ${T.border}` }}>
                          <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 11, color: T.blue }}>{i.nroFactura || i.id}</td>
                          <td style={{ padding: "8px 14px", color: T.muted }}>{i.date}</td>
                          <td style={{ padding: "8px 14px", color: T.muted }}>{i.due}</td>
                          <td style={{ padding: "8px 14px" }}><span style={{ fontSize: 11, fontWeight: 700, color, background: color + "18", padding: "2px 8px", borderRadius: 4 }}>{getDiasLabel(i.due)}</span></td>
                          <td style={{ padding: "8px 14px", fontWeight: 800, color: T.yellow }}>{fmt(i.total)}</td>
                        </tr>
                      );
                    })}</tbody>
                  </table>
                </div>
              ))
            }
          </div>
        );
      }
    },
    stock_alertas: {
      title: "Stock actual + alertas", layer: "op", mvp: true, tag: "Inventario",
      exportData: () => ({ headers: ["Producto", "SKU", "Stock actual", "Mínimo", "Unidad", "Estado"], rows: products.filter(p => p.tracksStock !== false).map(p => [p.name, p.sku || "", p.stock, p.minStock, p.unit || "", p.stock < p.minStock ? "Reponer" : "OK"]) }),
      render: () => (
        <div>
          <div style={{ marginBottom: 14, fontSize: 13, color: stockBajo.length > 0 ? T.red : T.accent, fontWeight: 700 }}>{stockBajo.length > 0 ? `⚠ ${stockBajo.length} producto(s) con stock bajo mínimo` : "✓ Todos los productos con stock suficiente"}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: T.surface }}>{["Producto", "SKU", "Stock actual", "Mínimo", "Estado"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
            <tbody>{products.filter(p => p.tracksStock !== false).slice(0, 15).map(p => {
              const bajo = p.stock < p.minStock;
              return <tr key={p.id} style={{ borderTop: `1px solid ${T.border}`, background: bajo ? T.redLight + "20" : "transparent" }}>
                <td style={{ padding: "8px 12px" }}>{p.name}</td>
                <td style={{ padding: "8px 12px", fontFamily: "monospace", fontSize: 11 }}>{p.sku}</td>
                <td style={{ padding: "8px 12px", fontWeight: 700, color: bajo ? T.red : T.ink }}>{p.stock} {p.unit}</td>
                <td style={{ padding: "8px 12px", color: T.muted }}>{p.minStock}</td>
                <td style={{ padding: "8px 12px" }}>{bajo ? <span style={{ color: T.red, fontSize: 11, fontWeight: 700 }}>⚠ Reponer</span> : <span style={{ color: T.accent, fontSize: 11 }}>✓ OK</span>}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      )
    },
    mov_dia: { title: "Movimientos del día", layer: "op", tag: "Inventario", render: () => <div style={{ color: T.muted, fontSize: 13, padding: 20 }}>Mostrando movimientos de inventario del día (entradas por compras, salidas por ventas).<br /><br />{saleInvoices.filter(i => i.date === hoy).map(i => <div key={i.id} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>{i.type === "factura" ? "📤 Salida" : "📋"} · {i.clientName} · {fmt(i.total)}</div>)}{purchaseInvoices.filter(i => i.date === hoy).map(i => <div key={i.id} style={{ padding: "6px 0", borderBottom: `1px solid ${T.border}` }}>📥 Entrada · {i.supplierName} · {fmt(i.total)}</div>)}</div> },
    entregas_dia: { title: "Entregas del día", layer: "op", tag: "Logística", render: () => <div style={{ color: T.muted, fontSize: 13, padding: 20, textAlign: "center" }}>Datos de entregas disponibles en el módulo Logística.</div> },
    pipeline: { title: "Pipeline de pedidos", layer: "op", tag: "Logística", render: () => <div style={{ color: T.muted, fontSize: 13, padding: 20, textAlign: "center" }}>Pipeline de pedidos disponible en el módulo Logística.</div> },
    // TÁCTICOS
    evolucion_ventas: {
      title: "Evolución de ventas", layer: "ta", mvp: true, tag: "Ventas",
      exportData: () => {
        const todosClientes = [...new Set(facturas.map(i => i.clientName).filter(Boolean))].sort();
        const todosProductos = [...new Set(facturas.flatMap(i => (i.lines||[]).map(l => l.name).filter(Boolean)))].sort();
        const clientesSel = todosClientes.filter(c => !evolDeselClientes.has(c));
        const productosSel = todosProductos.filter(p => !evolDeselProductos.has(p));
        const allDates = [...new Set(facturas.map(i => i.date))].sort();
        const dailyRows = allDates.map(date => {
          const df = facturas.filter(i => i.date === date);
          const tot = evolView === "cliente"
            ? df.filter(i=>clientesSel.includes(i.clientName)).reduce((s,i)=>s+i.total,0)
            : evolView === "producto"
            ? df.reduce((s,inv)=>s+(inv.lines||[]).filter(l=>productosSel.includes(l.name)).reduce((ss,l)=>ss+l.subtotal,0),0)
            : df.reduce((s,i)=>s+i.total,0);
          return [date, tot];
        });
        const monthRows = ventasPorMes.map(m => [m.label, m.total, m.count]);
        if (evolView === "mes") {
          return { sheets: [
            { title: "Ventas por mes", headers: ["Mes", "Total", "Facturas"], rows: monthRows,
              chart: { type: 'bar', labels: monthRows.map(r=>r[0]), values: monthRows.map(r=>r[1]), title: 'Ventas por mes' } },
            { title: "Evolución diaria", headers: ["Fecha", "Total del día"], rows: dailyRows,
              chart: { type: 'line', labels: dailyRows.map(r=>r[0]), values: dailyRows.map(r=>r[1]), title: 'Evolución diaria' } },
          ]};
        } else if (evolView === "cliente") {
          const resumen = clientesSel.map(c => [c, facturas.filter(i=>i.clientName===c).reduce((s,i)=>s+i.total,0)]).sort((a,b)=>b[1]-a[1]);
          return { sheets: [
            { title: "Por cliente", headers: ["Cliente", "Total facturado"], rows: resumen,
              chart: { type: 'bar', labels: resumen.map(r=>r[0]), values: resumen.map(r=>r[1]), title: 'Total por cliente' } },
            { title: "Evolución diaria", headers: ["Fecha", "Total (clientes seleccionados)"], rows: dailyRows,
              chart: { type: 'line', labels: dailyRows.map(r=>r[0]), values: dailyRows.map(r=>r[1]), title: 'Evolución diaria' } },
            { title: "Ventas por mes (ref.)", headers: ["Mes", "Total", "Facturas"], rows: monthRows,
              chart: { type: 'bar', labels: monthRows.map(r=>r[0]), values: monthRows.map(r=>r[1]), title: 'Ventas por mes' } },
          ]};
        } else {
          const resumen = productosSel.map(p => [p, facturas.reduce((s,inv)=>s+(inv.lines||[]).filter(l=>l.name===p).reduce((ss,l)=>ss+l.subtotal,0),0)]).sort((a,b)=>b[1]-a[1]);
          return { sheets: [
            { title: "Por producto", headers: ["Producto", "Total facturado"], rows: resumen,
              chart: { type: 'bar', labels: resumen.map(r=>r[0]), values: resumen.map(r=>r[1]), title: 'Total por producto' } },
            { title: "Evolución diaria", headers: ["Fecha", "Total (productos seleccionados)"], rows: dailyRows,
              chart: { type: 'line', labels: dailyRows.map(r=>r[0]), values: dailyRows.map(r=>r[1]), title: 'Evolución diaria' } },
            { title: "Ventas por mes (ref.)", headers: ["Mes", "Total", "Facturas"], rows: monthRows,
              chart: { type: 'bar', labels: monthRows.map(r=>r[0]), values: monthRows.map(r=>r[1]), title: 'Ventas por mes' } },
          ]};
        }
      },
      render: () => {
        const todosClientes = [...new Set(facturas.map(i => i.clientName).filter(Boolean))].sort();
        const todosProductos = [...new Set(facturas.flatMap(i => (i.lines||[]).map(l => l.name).filter(Boolean)))].sort();
        const clientesSel = todosClientes.filter(c => !evolDeselClientes.has(c));
        const productosSel = todosProductos.filter(p => !evolDeselProductos.has(p));
        const toggleEvolCliente = (c) => setEvolDeselClientes(prev => { const n = new Set(prev); n.has(c) ? n.delete(c) : n.add(c); return n; });
        const toggleEvolProducto = (p) => setEvolDeselProductos(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; });
        const allDates = [...new Set(facturas.map(i => i.date))].sort();
        const dailyData = allDates.map(date => {
          const df = facturas.filter(i => i.date === date);
          const total = evolView === "cliente"
            ? df.filter(i => clientesSel.includes(i.clientName)).reduce((s,i) => s+i.total, 0)
            : evolView === "producto"
            ? df.reduce((s,inv) => s + (inv.lines||[]).filter(l => productosSel.includes(l.name)).reduce((ss,l) => ss+l.subtotal, 0), 0)
            : df.reduce((s,i) => s+i.total, 0);
          return { date, total };
        });
        const barData = evolView === "cliente"
          ? clientesSel.map(c => ({ label: c, total: facturas.filter(i => i.clientName === c).reduce((s,i) => s+i.total, 0) })).sort((a,b) => b.total-a.total)
          : evolView === "producto"
          ? productosSel.map(p => ({ label: p, total: facturas.reduce((s,inv) => s+(inv.lines||[]).filter(l=>l.name===p).reduce((ss,l)=>ss+l.subtotal,0), 0) })).sort((a,b) => b.total-a.total)
          : ventasPorMes.map(m => ({ label: m.label.slice(5)+"/"+m.label.slice(2,4), total: m.total }));
        const maxBar = Math.max(...barData.map(d => d.total), 1);
        const svgW = 600, svgH = 120;
        const maxDay = Math.max(...dailyData.map(d => d.total), 1);
        const pts = dailyData.map((d, i) => {
          const x = dailyData.length > 1 ? (i/(dailyData.length-1))*(svgW-40)+20 : svgW/2;
          const y = svgH - 20 - (d.total/maxDay)*(svgH-30);
          return `${x},${y}`;
        }).join(" ");
        const totalSel = evolView === "cliente"
          ? facturas.filter(i => clientesSel.includes(i.clientName)).reduce((s,i) => s+i.total, 0)
          : evolView === "producto"
          ? facturas.reduce((s,inv) => s+(inv.lines||[]).filter(l=>productosSel.includes(l.name)).reduce((ss,l)=>ss+l.subtotal,0), 0)
          : facturas.reduce((s,i) => s+i.total, 0);
        return (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <label style={{ fontSize: 12, color: T.muted }}>Vista:</label>
              <select value={evolView} onChange={e => setEvolView(e.target.value)} style={inputStyle}>
                <option value="mes">Por mes</option>
                <option value="cliente">Por cliente</option>
                <option value="producto">Por producto</option>
              </select>
              <span style={{ fontSize: 12, color: T.muted }}>Total: <strong style={{ color: T.ink }}>{fmt(totalSel)}</strong></span>
            </div>
            {evolView === "cliente" && todosClientes.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {todosClientes.map(c => (
                  <label key={c} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer", padding: "4px 10px", borderRadius: 20, background: evolDeselClientes.has(c) ? T.surface : T.accentLight, border: `1px solid ${evolDeselClientes.has(c) ? T.border : T.accent}`, color: evolDeselClientes.has(c) ? T.muted : T.accent }}>
                    <input type="checkbox" checked={!evolDeselClientes.has(c)} onChange={() => toggleEvolCliente(c)} style={{ accentColor: T.accent }} />
                    {c}
                  </label>
                ))}
              </div>
            )}
            {evolView === "producto" && todosProductos.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                {todosProductos.map(p => (
                  <label key={p} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, cursor: "pointer", padding: "4px 10px", borderRadius: 20, background: evolDeselProductos.has(p) ? T.surface : T.accentLight, border: `1px solid ${evolDeselProductos.has(p) ? T.border : T.accent}`, color: evolDeselProductos.has(p) ? T.muted : T.accent }}>
                    <input type="checkbox" checked={!evolDeselProductos.has(p)} onChange={() => toggleEvolProducto(p)} style={{ accentColor: T.accent }} />
                    {p}
                  </label>
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 160, marginBottom: 20, overflowX: "auto" }}>
              {barData.map((d, idx) => (
                <div key={idx} style={{ flex: 1, minWidth: evolView === "mes" ? 0 : 80, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 10, color: T.muted }}>{fmt(d.total)}</div>
                  <div style={{ width: "100%", background: T.accent, borderRadius: "4px 4px 0 0", height: Math.max((d.total/maxBar)*120, 4) }}></div>
                  <div style={{ fontSize: 10, color: T.muted, textAlign: "center", maxWidth: 80, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</div>
                </div>
              ))}
            </div>
            {dailyData.length > 1 && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 8 }}>EVOLUCIÓN DIARIA DEL PERÍODO</div>
                <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: 130 }}>
                  <polyline fill="none" stroke={T.accent} strokeWidth="2" points={pts} />
                  {dailyData.map((d, i) => {
                    const x = dailyData.length > 1 ? (i/(dailyData.length-1))*(svgW-40)+20 : svgW/2;
                    const y = svgH - 20 - (d.total/maxDay)*(svgH-30);
                    return <circle key={i} cx={x} cy={y} r="3" fill={T.accent} />;
                  })}
                </svg>
              </div>
            )}
          </div>
        );
      }
    },
    ranking_productos: {
      title: "Ranking de productos", layer: "ta", mvp: true, tag: "Ventas",
      exportData: () => ({ headers: ["#", "Producto", "Facturado"], rows: rankingProductos.map(([name, total], i) => [i + 1, name, total]) }),
      render: () => (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: T.surface }}>{["#","Producto","Facturado"].map(h=><th key={h} style={{ padding:"8px 12px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:700 }}>{h}</th>)}</tr></thead>
          <tbody>{rankingProductos.map(([name,total],i)=><tr key={name} style={{borderTop:`1px solid ${T.border}`}}><td style={{padding:"8px 12px",color:T.muted,fontWeight:700}}>{i+1}</td><td style={{padding:"8px 12px"}}>{name}</td><td style={{padding:"8px 12px",fontWeight:700,color:T.accent}}>{fmt(total)}</td></tr>)}</tbody>
        </table>
      )
    },
    margenes: {
      title: "Análisis de márgenes", layer: "ta", mvp: true, tag: "Ventas",
      exportData: () => ({ headers: ["Producto", "SKU", "Costo", "Precio Lista A", "Margen %"], rows: products.filter(p => p.cost > 0).map(p => { const precio = p.prices?.lista_a || 0; const margen = precio > 0 ? ((precio - p.cost) / precio * 100).toFixed(1) : 0; return [p.name, p.sku || "", p.cost, precio, margen]; }) }),
      render: () => (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ background: T.surface }}>{["Producto","Costo","Lista A","Margen %"].map(h=><th key={h} style={{ padding:"8px 12px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:700 }}>{h}</th>)}</tr></thead>
          <tbody>{products.filter(p=>p.cost>0).map(p=>{const precio=p.prices?.lista_a||0;const margen=precio>0?((precio-p.cost)/precio*100).toFixed(1):0;return<tr key={p.id} style={{borderTop:`1px solid ${T.border}`}}><td style={{padding:"8px 12px"}}>{p.name}</td><td style={{padding:"8px 12px",color:T.muted}}>{fmt(p.cost)}</td><td style={{padding:"8px 12px"}}>{fmt(precio)}</td><td style={{padding:"8px 12px",fontWeight:700,color:margen>30?T.accent:margen>15?T.yellow:T.red}}>{margen}%</td></tr>;})}</tbody>
        </table>
      )
    },
    abc_ventas: { title: "ABC de ventas (Pareto)", layer: "ta", tag: "Ventas", render: () => { const tot = rankingProductos.reduce((s,[,t])=>s+t,0); let acum=0; return <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:T.surface}}>{["Producto","Monto","Acum.%","Clase"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:700}}>{h}</th>)}</tr></thead><tbody>{rankingProductos.map(([name,t])=>{acum+=t;const pct=(acum/tot*100);const cls=pct<=80?"A":pct<=95?"B":"C";return<tr key={name} style={{borderTop:`1px solid ${T.border}`}}><td style={{padding:"8px 12px"}}>{name}</td><td style={{padding:"8px 12px",fontWeight:700}}>{fmt(t)}</td><td style={{padding:"8px 12px",color:T.muted}}>{(acum/tot*100).toFixed(1)}%</td><td style={{padding:"8px 12px",fontWeight:700,color:cls==="A"?T.accent:cls==="B"?T.yellow:T.muted}}>{cls}</td></tr>;})}</tbody></table>; } },
    pago_medio: { title: "Ventas por medio de pago", layer: "ta", tag: "Ventas", render: () => <div style={{color:T.muted,fontSize:13,padding:20,textAlign:"center"}}>Este reporte requiere registrar el medio de pago en cada factura. Próximamente.</div> },
    rotacion: { title: "Rotación de inventario", layer: "ta", tag: "Inventario", render: () => { const costoVentas = facturas.reduce((s,i)=>(i.lines||[]).reduce((ss,l)=>{const p=products.find(x=>x.id===l.productId);return ss+(p?.cost||0)*l.qty;},s),0); const valorStock=products.reduce((s,p)=>s+(p.cost||0)*p.stock,0); const rot=valorStock>0?(costoVentas/valorStock).toFixed(2):0; return <div style={{textAlign:"center",padding:20}}><div style={{fontSize:48,fontWeight:800,color:T.accent}}>{rot}x</div><div style={{fontSize:13,color:T.muted,marginTop:8}}>Índice de rotación · Costo de ventas {fmt(costoVentas)} / Valor stock {fmt(valorStock)}</div></div>; } },
    valorizacion: { title: "Valorización de stock", layer: "ta", tag: "Inventario", render: () => { const aCosto=products.reduce((s,p)=>s+(p.cost||0)*p.stock,0); const aVenta=products.reduce((s,p)=>s+(p.prices?.lista_a||0)*p.stock,0); return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px"}}><div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6}}>VALOR A COSTO</div><div style={{fontSize:24,fontWeight:800,color:T.ink}}>{fmt(aCosto)}</div></div><div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"16px 20px"}}><div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6}}>VALOR A PRECIO LISTA A</div><div style={{fontSize:24,fontWeight:800,color:T.accent}}>{fmt(aVenta)}</div></div></div>; } },
    ranking_clientes: {
      title: "Ranking de clientes", layer: "ta", mvp: true, tag: "Clientes",
      exportData: () => {
        if (rankingDrillClient) {
          const cf = facturas.filter(i => i.clientName === rankingDrillClient);
          const clientTotal = cf.reduce((s,i)=>s+i.total,0);
          const porMes = last6Months.map(m => [m, cf.filter(i=>ym(i.date)===m).reduce((s,i)=>s+i.total,0), cf.filter(i=>ym(i.date)===m).length]);
          const allDates = [...new Set(cf.map(i=>i.date))].sort();
          const porDia = allDates.map(d => [d, cf.filter(i=>i.date===d).reduce((s,i)=>s+i.total,0)]);
          const prodMap = {}; cf.forEach(inv=>(inv.lines||[]).forEach(l=>{ if(!l.name)return; prodMap[l.name]=(prodMap[l.name]||0)+l.subtotal; }));
          const prodList = Object.entries(prodMap).sort((a,b)=>b[1]-a[1]);
          return { sheets: [
            { title: "Resumen", headers: ["Indicador", "Valor"],
              rows: [["Cliente", rankingDrillClient], ["Total facturado", clientTotal], ["Nro. de facturas", cf.length], ["Ticket promedio", cf.length>0?+(clientTotal/cf.length).toFixed(2):0], ["% del total general", totalVentas>0?+(clientTotal/totalVentas*100).toFixed(1):0]] },
            { title: "Ventas por mes", headers: ["Mes", "Total", "Facturas"], rows: porMes,
              chart: { type: 'bar', labels: porMes.map(r=>r[0]), values: porMes.map(r=>r[1]), title: `${rankingDrillClient} — ventas por mes` } },
            { title: "Evolución diaria", headers: ["Fecha", "Total del día"], rows: porDia,
              chart: { type: 'line', labels: porDia.map(r=>r[0]), values: porDia.map(r=>r[1]), title: `${rankingDrillClient} — evolución diaria` } },
            { title: "Facturas", headers: ["Nro.", "Fecha", "Vencimiento", "Estado", "Total"],
              rows: cf.sort((a,b)=>b.date.localeCompare(a.date)).map(i=>[i.nroFactura||i.id, i.date, i.due, i.status, i.total]) },
            { title: "Detalle de productos", headers: ["Producto", "Total facturado", "% del cliente"],
              rows: prodList.map(([p,t])=>[p, t, clientTotal>0?+(t/clientTotal*100).toFixed(1):0]),
              chart: { type: 'bar', labels: prodList.map(([p])=>p), values: prodList.map(([,t])=>t), title: 'Facturado por producto' } },
          ]};
        }
        return { sheets: [
          { title: "Ranking de clientes", headers: ["#", "Cliente", "Facturado", "% del total"],
            rows: rankingClientes.map(([name, total], i) => [i+1, name, total, totalVentas>0?+(total/totalVentas*100).toFixed(1):0]) },
        ]};
      },
      render: () => {
        const durDias = filterDesde && filterHasta ? Math.round((new Date(filterHasta) - new Date(filterDesde)) / 86400000) + 1 : 30;
        const prevEnd = filterDesde ? new Date(new Date(filterDesde).getTime() - 86400000).toISOString().slice(0,10) : diasAtras(30);
        const prevStart = new Date(new Date(prevEnd).getTime() - (durDias - 1) * 86400000).toISOString().slice(0,10);
        const factPrev = allFacturas.filter(i => i.date >= prevStart && i.date <= prevEnd);
        if (rankingDrillClient) {
          const clientName = rankingDrillClient;
          const clientFacturas = facturas.filter(i => i.clientName === clientName);
          const clientTotal = clientFacturas.reduce((s,i) => s+i.total, 0);
          const clientPorMes = last6Months.map(m => ({ label: m, total: clientFacturas.filter(i => ym(i.date) === m).reduce((s,i) => s+i.total, 0) }));
          const maxMes = Math.max(...clientPorMes.map(m => m.total), 1);
          const clientDates = [...new Set(clientFacturas.map(i => i.date))].sort();
          const clientDaily = clientDates.map(d => clientFacturas.filter(i => i.date === d).reduce((s,i) => s+i.total, 0));
          const maxDayC = Math.max(...clientDaily, 1);
          const svgW = 600, svgH = 120;
          const ptsC = clientDaily.map((v, i) => { const x = clientDaily.length > 1 ? (i/(clientDaily.length-1))*(svgW-40)+20 : svgW/2; const y = svgH-20-(v/maxDayC)*(svgH-30); return `${x},${y}`; }).join(" ");
          const prodMap = {};
          clientFacturas.forEach(inv => (inv.lines||[]).forEach(l => { if (!l.name) return; prodMap[l.name] = (prodMap[l.name]||0) + l.subtotal; }));
          const prodList = Object.entries(prodMap).sort((a,b) => b[1]-a[1]);
          return (
            <div>
              <button onClick={() => setRankingDrillClient(null)} style={{ marginBottom: 16, padding: "6px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>← Volver al ranking</button>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.ink }}>{clientName}</div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Total facturado: <strong style={{ color: T.accent }}>{fmt(clientTotal)}</strong> · {clientFacturas.length} factura{clientFacturas.length !== 1 ? "s" : ""}</div>
              </div>
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 8 }}>VENTAS POR MES</div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 120, marginBottom: 20 }}>
                {clientPorMes.map(m => (
                  <div key={m.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ fontSize: 10, color: T.muted }}>{m.total > 0 ? fmt(m.total) : ""}</div>
                    <div style={{ width: "100%", background: m.total > 0 ? T.accent : T.border, borderRadius: "3px 3px 0 0", height: Math.max((m.total/maxMes)*90, 4) }}></div>
                    <div style={{ fontSize: 10, color: T.muted }}>{m.label.slice(5)}/{m.label.slice(2,4)}</div>
                  </div>
                ))}
              </div>
              {clientDaily.length > 1 && (
                <>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 8 }}>EVOLUCIÓN DIARIA</div>
                  <svg viewBox={`0 0 ${svgW} ${svgH}`} style={{ width: "100%", height: 110, marginBottom: 20 }}>
                    <polyline fill="none" stroke={T.accent} strokeWidth="2" points={ptsC} />
                    {clientDaily.map((v, i) => { const x = clientDaily.length > 1 ? (i/(clientDaily.length-1))*(svgW-40)+20 : svgW/2; const y = svgH-20-(v/maxDayC)*(svgH-30); return <circle key={i} cx={x} cy={y} r="3" fill={T.accent} />; })}
                  </svg>
                </>
              )}
              <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 8 }}>FACTURAS</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginBottom: 20 }}>
                <thead><tr style={{ background: T.surface }}>{["Nro.", "Fecha", "Vencimiento", "Estado", "Total"].map(h => <th key={h} style={{ padding: "6px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
                <tbody>{clientFacturas.sort((a,b) => b.date.localeCompare(a.date)).map(i => (
                  <tr key={i.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "7px 12px", fontFamily: "monospace", fontSize: 11, color: T.blue }}>{i.nroFactura || i.id}</td>
                    <td style={{ padding: "7px 12px", color: T.muted }}>{i.date}</td>
                    <td style={{ padding: "7px 12px", color: T.muted }}>{i.due}</td>
                    <td style={{ padding: "7px 12px" }}><span style={{ fontSize: 11, fontWeight: 700, color: i.status === "cobrada" ? T.accent : T.orange }}>{i.status}</span></td>
                    <td style={{ padding: "7px 12px", fontWeight: 700, color: T.accent }}>{fmt(i.total)}</td>
                  </tr>
                ))}</tbody>
              </table>
              {prodList.length > 0 && (
                <>
                  <div style={{ fontSize: 11, color: T.muted, fontWeight: 700, marginBottom: 8 }}>DETALLE DE PRODUCTOS</div>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead><tr style={{ background: T.surface }}>{["Producto", "Facturado", "% del cliente"].map(h => <th key={h} style={{ padding: "6px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
                    <tbody>{prodList.map(([name, total]) => (
                      <tr key={name} style={{ borderTop: `1px solid ${T.border}` }}>
                        <td style={{ padding: "7px 12px" }}>{name}</td>
                        <td style={{ padding: "7px 12px", fontWeight: 700, color: T.accent }}>{fmt(total)}</td>
                        <td style={{ padding: "7px 12px", color: T.muted }}>{clientTotal > 0 ? (total/clientTotal*100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </>
              )}
            </div>
          );
        }
        return (
          <div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ background: T.surface }}>{["#", "Cliente", "Facturado", "Variación", "% del total"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
              <tbody>{rankingClientes.map(([name, total], i) => {
                const prevTotal = factPrev.filter(inv => inv.clientName === name).reduce((s, inv) => s + inv.total, 0);
                const variacion = prevTotal > 0 ? ((total - prevTotal) / prevTotal * 100).toFixed(1) : null;
                const varColor = variacion !== null ? (parseFloat(variacion) >= 0 ? T.accent : T.red) : T.muted;
                return (
                  <tr key={name} onClick={() => setRankingDrillClient(name)} style={{ borderTop: `1px solid ${T.border}`, cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.background = T.surface}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <td style={{ padding: "9px 12px", color: T.muted, fontWeight: 700 }}>{i + 1}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 600, color: T.blue }}>🔍 {name}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: T.accent }}>{fmt(total)}</td>
                    <td style={{ padding: "9px 12px", fontWeight: 700, color: varColor }}>{variacion !== null ? (parseFloat(variacion) >= 0 ? "+" : "") + variacion + "%" : "—"}</td>
                    <td style={{ padding: "9px 12px", color: T.muted }}>{totalVentas > 0 ? (total/totalVentas*100).toFixed(1) : 0}%</td>
                  </tr>
                );
              })}</tbody>
            </table>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 10 }}>Hacé click en un cliente para ver el detalle.</div>
          </div>
        );
      }
    },
    antiguedad_saldos: { title: "Antigüedad de saldos", layer: "ta", tag: "Clientes", render: () => { const a0=aging("0-30"),a1=aging("31-60"),a2=aging("61-90"),a3=aging("+90"); return <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>{[[`0-30d`,a0,T.accent],[`31-60d`,a1,T.yellow],[`61-90d`,a2,T.orange],[`+90d`,a3,T.red]].map(([l,items,c])=><div key={l} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"12px 14px"}}><div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6}}>{l}</div><div style={{fontSize:20,fontWeight:800,color:c}}>{fmt(items.reduce((s,i)=>s+i.total,0))}</div><div style={{fontSize:11,color:T.muted}}>{items.length} fact.</div></div>)}</div>; } },
    clientes_nuevos: { title: "Clientes nuevos vs perdidos", layer: "ta", tag: "Clientes", render: () => <div style={{color:T.muted,fontSize:13,padding:20,textAlign:"center"}}>Requiere registro de fecha de alta de clientes. Próximamente.</div> },
    eficiencia_log: {
      title: "Eficiencia logística", layer: "ta", tag: "Logística",
      render: () => {
        const cobradas2 = facturas.filter(i => i.status === "cobrada");
        const plazoPromedio = facturas.length > 0 ? Math.round(facturas.reduce((s,i) => s + Math.round((new Date(i.due) - new Date(i.date)) / 86400000), 0) / facturas.length) : 0;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: "14px 18px", fontSize: 12, color: T.muted }}>
              <strong style={{ color: T.ink, display: "block", marginBottom: 6 }}>¿Qué muestra este reporte?</strong>
              Eficiencia de entrega y cumplimiento: tasa de entregas a tiempo, tiempos de respuesta y calidad del servicio. Para métricas completas se requiere registrar fechas de entrega reales en cada pedido. Indicadores disponibles con datos actuales:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
              {[["Plazo prom. de cobro", `${plazoPromedio} días`, T.blue], ["Facturas cobradas", cobradas2.length, T.accent], ["Facturas pendientes", facturas.filter(i => i.status === "pendiente").length, T.orange]].map(([l,v,c]) => (
                <div key={l} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 6 }}>{l.toUpperCase()}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    },
    ciclos: {
      title: "Tiempos de ciclo", layer: "ta", tag: "Logística",
      render: () => {
        const cicloVenta = facturas.length > 0 ? Math.round(facturas.reduce((s,i) => s + Math.round((new Date(i.due) - new Date(i.date)) / 86400000), 0) / facturas.length) : 0;
        const cicloCompra = purchaseInvoices.length > 0 ? Math.round(purchaseInvoices.reduce((s,i) => { const d = i.dueDate && i.date ? Math.round((new Date(i.dueDate) - new Date(i.date)) / 86400000) : 0; return s+d; }, 0) / purchaseInvoices.length) : 0;
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: T.surface, borderRadius: 10, padding: "14px 18px", fontSize: 12, color: T.muted }}>
              <strong style={{ color: T.ink, display: "block", marginBottom: 6 }}>¿Qué muestra este reporte?</strong>
              Ciclo de venta: tiempo promedio entre emisión de factura y su vencimiento. Ciclo de compra: tiempo promedio entre orden de compra y su vencimiento/pago. El ciclo de entrega requiere registrar fechas reales de despacho.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
              {[["Ciclo promedio ventas", cicloVenta, T.accent], ["Ciclo promedio compras", cicloCompra, T.blue]].map(([l,v,c]) => (
                <div key={l} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "24px 20px" }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 8 }}>{l.toUpperCase()}</div>
                  <div style={{ fontSize: 36, fontWeight: 800, color: c }}>{v}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>días promedio</div>
                </div>
              ))}
            </div>
          </div>
        );
      }
    },
    // ESTRATÉGICOS
    pyl: {
      title: "P&L simplificado", layer: "es", mvp: true, tag: "Cross",
      render: () => {
        const costoVentas = facturas.reduce((s,i)=>(i.lines||[]).reduce((ss,l)=>{const p=products.find(x=>x.id===l.productId);return ss+(p?.cost||0)*l.qty;},s),0);
        const ganancia = totalVentas - costoVentas;
        return (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[["Ingresos (ventas)", totalVentas, T.accent,true],["Costo de ventas", -costoVentas, T.red,false],["Ganancia bruta", ganancia, ganancia>=0?T.accent:T.red,true]].map(([l,v,c,bold])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"12px 16px",background:T.surface,borderRadius:10,fontSize:bold?15:13,fontWeight:bold?800:500}}>
                <span>{l}</span><span style={{color:c}}>{fmt(Math.abs(v))}</span>
              </div>
            ))}
            <div style={{fontSize:12,color:T.muted,marginTop:8}}>Margen bruto: {totalVentas>0?((ganancia/totalVentas)*100).toFixed(1):0}%</div>
          </div>
        );
      }
    },
    equilibrio: { title: "Punto de equilibrio", layer: "es", tag: "Ventas", render: () => <div style={{color:T.muted,fontSize:13,padding:20,textAlign:"center"}}>Requiere registrar costos fijos. Próximamente.</div> },
    cashflow: {
      title: "Cash flow proyectado", layer: "es", mvp: true, tag: "Cross",
      render: () => {
        const cobros = pendientes.filter(i => i.due >= hoy && i.due <= diasAtras(-30)).reduce((s,i)=>s+i.total,0);
        const pagos = purchaseInvoices.filter(i => i.status === "pendiente" && i.dueDate >= hoy && i.dueDate <= diasAtras(-30)).reduce((s,i)=>s+i.total,0);
        return (
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {[["Cobros esperados (30d)", cobros, T.accent],["Pagos comprometidos (30d)", pagos, T.red],["Saldo proyectado", cobros-pagos, cobros>=pagos?T.accent:T.red]].map(([l,v,c])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"12px 16px",background:T.surface,borderRadius:10,fontSize:13}}><span>{l}</span><span style={{color:c,fontWeight:700}}>{fmt(Math.abs(v))}</span></div>
            ))}
          </div>
        );
      }
    },
    estacionalidad: { title: "Estacionalidad", layer: "es", tag: "Ventas", render: () => <div style={{display:"flex",gap:8,alignItems:"flex-end",height:120,marginBottom:10}}>{ventasPorMes.map(m=>{const maxV=Math.max(...ventasPorMes.map(x=>x.total),1);return<div key={m.label} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}><div style={{width:"100%",background:T.accent,borderRadius:"3px 3px 0 0",height:Math.max((m.total/maxV)*100,4)}}></div><div style={{fontSize:9,color:T.muted}}>{m.label.slice(5)}/{m.label.slice(2,4)}</div></div>;})}></div> },
    rentabilidad_cliente: { title: "Rentabilidad por cliente", layer: "es", tag: "Clientes", render: () => <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><thead><tr style={{background:T.surface}}>{["Cliente","Facturado","% del total"].map(h=><th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,color:T.muted,fontWeight:700}}>{h}</th>)}</tr></thead><tbody>{rankingClientes.map(([n,t])=><tr key={n} style={{borderTop:`1px solid ${T.border}`}}><td style={{padding:"8px 12px"}}>{n}</td><td style={{padding:"8px 12px",fontWeight:700}}>{fmt(t)}</td><td style={{padding:"8px 12px",color:T.muted}}>{totalVentas>0?(t/totalVentas*100).toFixed(1):0}%</td></tr>)}</tbody></table> },
    concentracion: { title: "Concentración de ingresos", layer: "es", tag: "Clientes", render: () => { const top5=rankingClientes.slice(0,5).reduce((s,[,t])=>s+t,0); const pct=totalVentas>0?(top5/totalVentas*100).toFixed(1):0; return <div style={{textAlign:"center",padding:20}}><div style={{fontSize:48,fontWeight:800,color:pct>80?T.red:T.accent}}>{pct}%</div><div style={{fontSize:13,color:T.muted,marginTop:8}}>de los ingresos concentrados en los top 5 clientes</div></div>; } },
    mix_productos: { title: "Mix óptimo de productos", layer: "es", tag: "Ventas", render: () => <div style={{color:T.muted,fontSize:13,padding:20,textAlign:"center"}}>Análisis de matriz volumen × margen. Próximamente.</div> },
    caja_movimientos: {
      title: "Gastos e ingresos de caja", layer: "cx", mvp: true, tag: "Caja",
      exportData: () => {
        const allMovs = (cajas || []).flatMap(caja => {
          const autoMovs = (saleInvoices || [])
            .filter(inv => { if (inv.metodoPago !== "efectivo" || inv.date !== caja.date) return false; if (inv.type === "factura") return true; if (inv.type === "presupuesto" && inv.modificaStock) return !(saleInvoices||[]).some(d => d.originPresupuestoId === inv.id); return false; })
            .map(inv => ({ cajaId: caja.id, cajaDate: caja.date, tipo: "ingreso", monto: inv.total, fecha: inv.date, hora: "—", motivo: (inv.type === "factura" ? "Factura" : "Presupuesto") + " · " + (inv.ref || inv.id), origenId: inv.ref || inv.id, observaciones: "Cliente: " + inv.clientName, isAuto: true }));
          const manualMovs = (cajaMovimientos || []).filter(m => m.cajaId === caja.id).map(m => ({ ...m, cajaDate: caja.date, isAuto: false }));
          return [...autoMovs, ...manualMovs].map((m, i) => ({ ...m, numero: i + 1, cajaId: caja.id }));
        }).filter(m => {
          if (filterDesde && m.fecha < filterDesde) return false;
          if (filterHasta && m.fecha > filterHasta) return false;
          return true;
        });
        return { sheets: [{ title: "Movimientos de caja", headers: ["N°", "Caja", "Fecha", "Tipo", "Motivo", "Monto", "Origen", "Observaciones"], rows: allMovs.map(m => [m.numero, m.cajaId, m.fecha, m.tipo === "ingreso" ? "INGRESO" : "GASTO", m.motivo, m.tipo === "ingreso" ? m.monto : -m.monto, m.origenId || "Manual", m.observaciones || ""]) }] };
      },
      render: () => {
        const allMovs = (cajas || []).flatMap(caja => {
          const autoMovs = (saleInvoices || [])
            .filter(inv => { if (inv.metodoPago !== "efectivo" || inv.date !== caja.date) return false; if (inv.type === "factura") return true; if (inv.type === "presupuesto" && inv.modificaStock) return !(saleInvoices||[]).some(d => d.originPresupuestoId === inv.id); return false; })
            .map(inv => ({ cajaId: caja.id, cajaDate: caja.date, turno: caja.turno, tipo: "ingreso", monto: inv.total, fecha: inv.date, hora: "—", motivo: (inv.type === "factura" ? "Factura" : "Presupuesto") + " · " + (inv.ref || inv.id), origenId: inv.ref || inv.id, observaciones: "Cliente: " + inv.clientName, isAuto: true }));
          const manualMovs = (cajaMovimientos || []).filter(m => m.cajaId === caja.id).map(m => ({ ...m, cajaDate: caja.date, turno: caja.turno, isAuto: false }));
          return [...autoMovs, ...manualMovs].map((m, i) => ({ ...m, numero: i + 1 }));
        }).filter(m => {
          if (filterDesde && m.fecha < filterDesde) return false;
          if (filterHasta && m.fecha > filterHasta) return false;
          return true;
        });
        const totalIngresos = allMovs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
        const totalGastos = allMovs.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
        if (allMovs.length === 0) return <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>Sin movimientos para el período seleccionado. Registrá movimientos en el módulo Caja.</div>;
        return (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
              {[["Total ingresos", totalIngresos, T.accent], ["Total gastos", totalGastos, T.red], ["Balance neto", totalIngresos - totalGastos, totalIngresos >= totalGastos ? T.blue : T.red]].map(([l, v, c]) => (
                <div key={l} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 6 }}>{l.toUpperCase()}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{fmt(v)}</div>
                </div>
              ))}
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>{["N°", "Caja / Turno", "Fecha", "Tipo", "Motivo", "Monto", "Origen"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}</tr></thead>
              <tbody>{allMovs.map(m => (
                <tr key={m.numero + m.cajaId} style={{ borderTop: `1px solid ${T.border}` }}>
                  <td style={{ padding: "10px 12px", fontFamily: "monospace", color: T.muted, fontSize: 12 }}>#{m.numero}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12 }}><span style={{ fontFamily: "monospace", color: T.accent }}>{m.cajaId}</span>{m.turno && <span style={{ marginLeft: 6, fontSize: 10, color: T.muted }}>Turno {m.turno}</span>}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: T.muted }}>{m.fecha}</td>
                  <td style={{ padding: "10px 12px" }}><span style={{ background: m.tipo === "ingreso" ? T.accentLight : T.redLight, color: m.tipo === "ingreso" ? T.accent : T.red, padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{m.tipo === "ingreso" ? "▲ INGRESO" : "▼ GASTO"}</span></td>
                  <td style={{ padding: "10px 12px", fontSize: 13 }}>{m.motivo}</td>
                  <td style={{ padding: "10px 12px", fontSize: 14, fontWeight: 800, color: m.tipo === "ingreso" ? T.accent : T.red }}>{m.tipo === "ingreso" ? "+" : "-"}{fmt(m.monto)}</td>
                  <td style={{ padding: "10px 12px", fontSize: 12, color: m.origenId ? T.blue : T.muted, fontFamily: "monospace" }}>{m.origenId || "Manual"}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        );
      }
    },
    cmv: {
      title: "Reporte CMV", layer: "ta", mvp: true, tag: "Ventas",
      exportData: () => {
        const mesActual = hoy.slice(0, 7);
        const facturasEsteMes = allFacturas.filter(i => i.date?.startsWith(mesActual));
        const ventasPorProducto = {};
        facturasEsteMes.forEach(inv => (inv.lines||[]).forEach(l => {
          if (!l.productId) return;
          if (!ventasPorProducto[l.productId]) ventasPorProducto[l.productId] = { name: l.name, qty: 0, precioVenta: 0 };
          ventasPorProducto[l.productId].qty += l.qty || 0;
          ventasPorProducto[l.productId].precioVenta += l.subtotal || 0;
        }));
        const hace45Dias = diasAtras(45);
        const rows = Object.entries(ventasPorProducto).map(([pid, data]) => {
          const prod = products.find(p => p.id === pid);
          const lastPurchase = purchaseInvoices.filter(i => (i.lines||[]).some(l => l.productId === pid)).sort((a,b) => (b.date||'').localeCompare(a.date||''))[0];
          const lastPurchaseLine = lastPurchase?.lines?.find(l => l.productId === pid);
          const costo = lastPurchaseLine?.unitPrice || prod?.cost || 0;
          const sinPrecio = costo === 0;
          const stale = !sinPrecio && (!lastPurchase || lastPurchase.date < hace45Dias);
          return { id: pid, name: data.name, qty: data.qty, costo, cmv: data.qty * costo, precioVenta: data.precioVenta, margen: data.precioVenta - (data.qty * costo), sinPrecio, stale, lastPurchaseDate: lastPurchase?.date || null };
        }).sort((a,b) => b.cmv - a.cmv);
        return { sheets: [{ title: `CMV ${mesActual}`, headers: ["Producto", "Uds. vendidas", "Último costo", "CMV", "Venta", "Margen", "Estado precio"], rows: rows.map(r => [r.name, r.qty, r.costo, r.cmv, r.precioVenta, r.margen, r.sinPrecio ? "SIN PRECIO" : r.stale ? "DESACTUALIZADO" : "OK"]) }] };
      },
      render: () => {
        const mesActual = hoy.slice(0, 7);
        const facturasEsteMes = allFacturas.filter(i => i.date?.startsWith(mesActual));
        const ventasPorProducto = {};
        facturasEsteMes.forEach(inv => (inv.lines||[]).forEach(l => {
          if (!l.productId) return;
          if (!ventasPorProducto[l.productId]) ventasPorProducto[l.productId] = { name: l.name, qty: 0, precioVenta: 0 };
          ventasPorProducto[l.productId].qty += l.qty || 0;
          ventasPorProducto[l.productId].precioVenta += l.subtotal || 0;
        }));
        const hace45Dias = diasAtras(45);
        const rows = Object.entries(ventasPorProducto).map(([pid, data]) => {
          const prod = products.find(p => p.id === pid);
          const lastPurchase = purchaseInvoices.filter(i => (i.lines||[]).some(l => l.productId === pid)).sort((a,b) => (b.date||'').localeCompare(a.date||''))[0];
          const lastPurchaseLine = lastPurchase?.lines?.find(l => l.productId === pid);
          const costo = lastPurchaseLine?.unitPrice || prod?.cost || 0;
          const sinPrecio = costo === 0;
          const stale = !sinPrecio && (!lastPurchase || lastPurchase.date < hace45Dias);
          return { id: pid, name: data.name, qty: data.qty, costo, cmv: data.qty * costo, precioVenta: data.precioVenta, margen: data.precioVenta - (data.qty * costo), sinPrecio, stale, lastPurchaseDate: lastPurchase?.date || null };
        }).sort((a,b) => b.cmv - a.cmv);
        const totalCMV = rows.reduce((s,r) => s + r.cmv, 0);
        const totalVentaMes = rows.reduce((s,r) => s + r.precioVenta, 0);
        const alertas = rows.filter(r => r.sinPrecio || r.stale);
        return (
          <div>
            {alertas.length > 0 && (
              <div style={{ background: T.yellowLight, border: `1px solid ${T.yellow}40`, borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.yellow, marginBottom: 8 }}>⚠ ALERTAS DE PRECIO — {alertas.length} producto{alertas.length > 1 ? "s" : ""} requieren atención</div>
                {alertas.map(a => (
                  <div key={a.id} style={{ fontSize: 12, color: T.ink, marginBottom: 3 }}>
                    <span style={{ background: a.sinPrecio ? T.redLight : T.yellowLight, color: a.sinPrecio ? T.red : T.yellow, padding: "1px 7px", borderRadius: 8, fontSize: 10, fontWeight: 700, marginRight: 8 }}>{a.sinPrecio ? "SIN PRECIO" : "DESACTUALIZADO"}</span>
                    {a.name}{!a.sinPrecio && a.lastPurchaseDate && <span style={{ color: T.muted }}> — última compra: {a.lastPurchaseDate}</span>}
                    {!a.sinPrecio && !a.lastPurchaseDate && <span style={{ color: T.muted }}> — sin compras registradas</span>}
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: 20 }}>
              {[["CMV del mes", totalCMV, T.orange], ["Ventas del mes", totalVentaMes, T.accent], ["Margen bruto", totalVentaMes - totalCMV, totalVentaMes >= totalCMV ? T.blue : T.red]].map(([l,v,c]) => (
                <div key={l} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "14px 16px" }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 4 }}>{l.toUpperCase()}</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{fmt(v)}</div>
                  {l === "Margen bruto" && totalVentaMes > 0 && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{((totalVentaMes - totalCMV) / totalVentaMes * 100).toFixed(1)}% margen</div>}
                </div>
              ))}
            </div>
            {rows.length === 0 ? (
              <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>Sin ventas registradas este mes.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: T.surface }}>
                  {["Producto","Uds.","Último costo","CMV","Venta","Margen","Estado"].map(h => <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}
                </tr></thead>
                <tbody>{rows.map(r => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${T.border}`, background: r.sinPrecio ? `${T.red}08` : r.stale ? `${T.yellow}08` : "transparent" }}>
                    <td style={{ padding: "10px 12px", fontSize: 13 }}>{r.name}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700 }}>{r.qty}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: r.sinPrecio ? T.red : T.ink }}>{r.sinPrecio ? "—" : fmt(r.costo)}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, fontWeight: 700, color: T.orange }}>{fmt(r.cmv)}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: T.accent }}>{fmt(r.precioVenta)}</td>
                    <td style={{ padding: "10px 12px", fontSize: 13, color: r.margen >= 0 ? T.blue : T.red }}>{fmt(r.margen)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {r.sinPrecio ? <span style={{ background: T.redLight, color: T.red, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>SIN PRECIO</span>
                        : r.stale ? <span style={{ background: T.yellowLight, color: T.yellow, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>DESACTUALIZADO</span>
                        : <span style={{ background: T.accentLight, color: T.accent, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>OK</span>}
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        );
      }
    },
    scorecard: {
      title: "Scorecard PyME", layer: "es", mvp: true, tag: "Cross",
      render: () => {
        const kpis = [
          ["Ventas totales", fmt(totalVentas), T.accent],
          ["Pendiente cobrar", fmt(totalPendiente), T.red],
          ["Facturas cobradas", cobradas.length, T.accent],
          ["Facturas vencidas", pendientes.filter(i=>i.due<hoy).length, T.red],
          ["Stock bajo mínimo", stockBajo.length, stockBajo.length>0?T.red:T.accent],
          ["Proveedores activos", suppliers.length, T.ink],
          ["Clientes activos", clients.filter(c=>c.status==="activo").length, T.accent],
          ["Compras totales", fmt(totalCompras), T.orange],
        ];
        return <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>{kpis.map(([l,v,c])=><div key={l} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:12,padding:"14px 16px"}}><div style={{fontSize:10,color:T.muted,fontWeight:700,marginBottom:6}}>{l}</div><div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div></div>)}</div>;
      }
    },
  };

  const layers = [
    { id: "op", label: "Operativos", freq: "Diario", desc: "Control diario de ventas, cobranzas y stock", color: "#0F6E56", colorLight: "#E1F5EE", reports: ["ventas_dia","cobranzas_dia","aging","stock_alertas","mov_dia","entregas_dia","pipeline"] },
    { id: "ta", label: "Tácticos", freq: "Semanal / Mensual", desc: "Tendencias, rankings y performance del período", color: "#185FA5", colorLight: "#E6F1FB", reports: ["evolucion_ventas","ranking_productos","margenes","abc_ventas","pago_medio","rotacion","valorizacion","ranking_clientes","antiguedad_saldos","clientes_nuevos","eficiencia_log","ciclos","cmv"] },
    { id: "es", label: "Estratégicos", freq: "Trimestral / Anual", desc: "P&L, cashflow y visión financiera del negocio", color: "#534AB7", colorLight: "#EEEDFE", reports: ["pyl","equilibrio","cashflow","estacionalidad","rentabilidad_cliente","concentracion","mix_productos","scorecard"] },
    { id: "cx", label: "Caja", freq: "Diario / Período", desc: "Gastos e ingresos de efectivo por período", color: "#92400E", colorLight: "#FEF3C7", reports: ["caja_movimientos"] },
  ];

  const tagColors = { Ventas: { bg: T.blueLight, c: T.blue }, Clientes: { bg: "#EEEDFE", c: "#534AB7" }, Inventario: { bg: T.accentLight, c: T.accent }, Logística: { bg: T.yellowLight || "#FFF8E1", c: T.yellow || "#B45309" }, Cross: { bg: T.surface2, c: T.muted }, Caja: { bg: "#FEF3C7", c: "#92400E" } };

  const inputStyle = { padding: "7px 10px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 12, fontFamily: "inherit", outline: "none" };
  const ghostBtn = { padding: "7px 14px", borderRadius: 7, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" };

  const printReport = () => {
    const existing = document.getElementById("__nexo_print_style");
    if (existing) existing.remove();
    const style = document.createElement("style");
    style.id = "__nexo_print_style";
    style.textContent = `
      @media print {
        @page { margin: 18mm 14mm; }
        body * { visibility: hidden !important; }
        #nexopyme-report-content, #nexopyme-report-content * { visibility: visible !important; }
        #nexopyme-report-content {
          position: fixed !important;
          inset: 0 !important;
          width: 100% !important;
          padding: 24px 32px !important;
          background: #fff !important;
          color: #000 !important;
          overflow: visible !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    window.addEventListener("afterprint", () => {
      const s = document.getElementById("__nexo_print_style");
      if (s) s.remove();
    }, { once: true });
  };

  const exportExcel = async (reportId) => {
    const r = reports[reportId];
    if (!r?.exportData) { printReport(); return; }
    const period = filterDesde && filterHasta ? `Período: ${filterDesde}  →  ${filterHasta}` : filterDesde ? `Desde: ${filterDesde}` : filterHasta ? `Hasta: ${filterHasta}` : "Período: todos";
    const data = r.exportData();
    const sheets = data.sheets || [{ title: r.title, headers: data.headers, rows: data.rows }];
    const wb = new ExcelWorkbook(); wb.creator = 'NexoPyME'; wb.created = new Date();
    for (const s of sheets) await addFormattedSheet(wb, s, period);
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `NexoPyME_${reportId}_${hoy}.xlsx`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── FULL PAGE REPORT ──────────────────────────────────────────────────────
  if (activeReport) {
    const r = reports[activeReport];
    if (!r) { setActiveReport(null); return null; }
    const layer = layers.find(l => l.reports.includes(activeReport));
    const hasFilters = filterDesde || filterHasta || filterSearch;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <button onClick={() => setActiveReport(null)} style={{ ...ghostBtn, marginTop: 4, whiteSpace: "nowrap" }}>← {layer?.label}</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 4 }}>{layer?.label?.toUpperCase()} · {layer?.freq}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>{r.title}</div>
          </div>
          <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
            {r.exportData && <button onClick={() => exportExcel(activeReport)} style={{ ...ghostBtn, color: T.accent, borderColor: T.accent + "60" }}>↓ Excel</button>}
            <button onClick={printReport} style={ghostBtn}>⎙ PDF</button>
          </div>
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 18px", marginBottom: 20, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1 }}>FILTROS</span>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: T.muted }}>Desde</span>
            <input type="date" value={filterDesde} onChange={e => setFilterDesde(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, color: T.muted }}>Hasta</span>
            <input type="date" value={filterHasta} onChange={e => setFilterHasta(e.target.value)} style={inputStyle} />
          </div>
          <QuickDateFilter setFrom={setFilterDesde} setTo={setFilterHasta} style={inputStyle} />
          <input placeholder="🔍 Buscar cliente / producto..." value={filterSearch} onChange={e => setFilterSearch(e.target.value)} style={{ ...inputStyle, width: 220 }} />
          {hasFilters && <button onClick={() => { setFilterDesde(""); setFilterHasta(""); setFilterSearch(""); }} style={ghostBtn}>Limpiar</button>}
          {hasFilters && <span style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>· Datos filtrados</span>}
        </div>

        <div id="nexopyme-report-content" style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: "28px 32px" }}>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, paddingBottom: 10, borderBottom: `1px solid ${T.border}`, display: "none" }} className="print-title">{r.title}</div>
          {r.render()}
        </div>
      </div>
    );
  }

  // ── CATEGORY VIEW ─────────────────────────────────────────────────────────
  if (selectedLayer) {
    const layer = layers.find(l => l.id === selectedLayer);
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <button onClick={() => setSelectedLayer(null)} style={ghostBtn}>← Reportes</button>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1 }}>{layer.freq.toUpperCase()}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.ink }}>{layer.label}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
          {layer.reports.map(rId => {
            const r = reports[rId];
            if (!r) return null;
            const tc = tagColors[r.tag] || tagColors.Cross;
            return (
              <div key={rId}
                onClick={() => { setFilterDesde(""); setFilterHasta(""); setFilterSearch(""); setActiveReport(rId); }}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "18px 20px", cursor: "pointer", position: "relative" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; e.currentTarget.style.background = T.accentLight; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.surface; }}>
                {r.mvp && <span style={{ position: "absolute", top: 10, right: 12, fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, background: "#FEF3C7", color: "#92400E" }}>MVP</span>}
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 10, paddingRight: r.mvp ? 40 : 0 }}>{r.title}</div>
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: tc.bg, color: tc.c, fontWeight: 700 }}>{r.tag}</span>
                <div style={{ marginTop: 16, fontSize: 11, color: T.accent, fontWeight: 600 }}>Ver reporte →</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── LANDING ───────────────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Reportes</div>
        <div style={{ fontSize: 13, color: T.muted }}>33 reportes · 4 capas de análisis · Datos en tiempo real</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {layers.map(layer => (
          <div key={layer.id} onClick={() => setSelectedLayer(layer.id)}
            style={{ background: layer.color, borderRadius: 18, padding: "32px 28px", cursor: "pointer", color: layer.colorLight, minHeight: 190, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.75, letterSpacing: 1, marginBottom: 10 }}>{layer.freq.toUpperCase()}</div>
              <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 10 }}>{layer.label}</div>
              <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>{layer.desc}</div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24 }}>
              <span style={{ fontSize: 13, fontWeight: 600, background: "rgba(255,255,255,0.15)", padding: "4px 10px", borderRadius: 8 }}>{layer.reports.length} reportes</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>Entrar →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MODULE: RRHH ─────────────────────────────────────────────────────────────
function calcVacacionesDias(fechaIngreso) {
  const anos = (new Date() - new Date(fechaIngreso)) / (365.25 * 24 * 3600 * 1000);
  if (anos < 5) return 14;
  if (anos < 10) return 21;
  if (anos < 20) return 28;
  return 35;
}

function calcAntiguedadAnos(fechaIngreso) {
  return Math.floor((new Date() - new Date(fechaIngreso)) / (365.25 * 24 * 3600 * 1000));
}

function calcSueldo(emp) {
  const anos = calcAntiguedadAnos(emp.fechaIngreso);
  const adicionalAntiguedad = emp.sueldoBasico * (anos * 0.01);
  const bruto = emp.sueldoBasico + adicionalAntiguedad;
  const jubilacion = bruto * 0.11;
  const inssjp = bruto * 0.03;
  const obraSocial = bruto * 0.03;
  const totalRetenciones = jubilacion + inssjp + obraSocial;
  const neto = bruto - totalRetenciones;
  return { bruto, adicionalAntiguedad, jubilacion, inssjp, obraSocial, totalRetenciones, neto };
}

function RRHHModule({ empleados, setEmpleados, companyId }) {
  const [tab, setTab] = useState("empleados");
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [empForm, setEmpForm] = useState({ legajo: "", nombre: "", apellido: "", cuil: "", puesto: "", sector: "", fechaIngreso: "", sueldoBasico: "", cbu: "", banco: "", obraSocial: "", email: "", estado: "activo" });

  // Asistencia
  const hoyRRHH = new Date().toISOString().slice(0, 10);
  const [asistMes, setAsistMes] = useState(hoyRRHH.slice(0, 7));
  const [asistencia, setAsistencia] = useState({}); // key: "empId-YYYY-MM-DD" → "P"|"A"|"LS"|"LP"|"V"|"ART"

  // Vacaciones days taken
  const [vacTomadas, setVacTomadas] = useState({}); // empId → number

  // Recibos
  const [reciboEmpId, setReciboEmpId] = useState("");
  const [reciboPeriodo, setReciboPeriodo] = useState(hoyRRHH.slice(0, 7));

  const openNewEmp = () => { setEmpForm({ legajo: String(empleados.length + 1).padStart(4, "0"), nombre: "", apellido: "", cuil: "", puesto: "", sector: "", fechaIngreso: "", sueldoBasico: "", cbu: "", banco: "", obraSocial: "", email: "", estado: "activo" }); setEditingEmp(null); setShowEmpForm(true); };
  const openEditEmp = (emp) => { setEmpForm({ ...emp, sueldoBasico: String(emp.sueldoBasico) }); setEditingEmp(emp.id); setShowEmpForm(true); };
  const saveEmp = () => {
    const data = { ...empForm, sueldoBasico: Number(empForm.sueldoBasico) || 0 };
    if (editingEmp) {
      setEmpleados(prev => prev.map(e => e.id === editingEmp ? { ...e, ...data } : e));
      if (companyId) { const upd = { ...empleados.find(e => e.id === editingEmp), ...data }; supabase.from('employees').upsert(employeeToDb(upd, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }); }
    } else {
      const ne = { ...data, id: crypto.randomUUID() };
      setEmpleados(prev => [...prev, ne]);
      if (companyId) supabase.from('employees').insert(employeeToDb(ne, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    }
    setShowEmpForm(false);
  };
  const deleteEmp = (id) => { if (window.confirm("¿Eliminar empleado?")) { setEmpleados(prev => prev.filter(e => e.id !== id)); if (companyId) supabase.from('employees').delete().eq('id', id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }); } };

  const toggleAsist = (empId, dia, codigo) => {
    const key = `${empId}-${asistMes}-${String(dia).padStart(2, "0")}`;
    setAsistencia(prev => ({ ...prev, [key]: prev[key] === codigo ? "P" : codigo }));
  };
  const getAsist = (empId, dia) => asistencia[`${empId}-${asistMes}-${String(dia).padStart(2, "0")}`] || "P";

  const diasDelMes = () => { const [y, m] = asistMes.split("-").map(Number); return new Date(y, m, 0).getDate(); };

  const asistCodigos = [
    { c: "P", label: "Presente", color: T.accent, bg: T.accentLight },
    { c: "A", label: "Ausente", color: T.red, bg: T.redLight },
    { c: "LS", label: "Lic. Médica", color: T.blue, bg: T.blueLight },
    { c: "LP", label: "Lic. Particular", color: T.purple, bg: T.purpleLight },
    { c: "V", label: "Vacaciones", color: T.orange, bg: T.orangeLight },
    { c: "ART", label: "ART", color: T.yellow, bg: T.yellowLight },
  ];
  const asistColorMap = Object.fromEntries(asistCodigos.map(a => [a.c, a]));

  const generarReciboPDF = () => {
    const emp = empleados.find(e => e.id === reciboEmpId);
    if (!emp) return;
    const s = calcSueldo(emp);
    const [y, m] = reciboPeriodo.split("-");
    const periodoLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recibo de Sueldo</title>
<style>body{font-family:Arial,sans-serif;padding:32px;color:#222;max-width:800px;margin:0 auto}
h2{font-size:18px;margin-bottom:4px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0}
.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:13px}
.row.total{font-weight:bold;font-size:15px;border-top:2px solid #333;border-bottom:none;margin-top:8px}
.label{color:#555}.val{font-weight:600}
.neg{color:#d32f2f}.pos{color:#2e7d32}
table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
td,th{padding:6px 10px;border:1px solid #ddd}th{background:#f5f5f5;font-weight:700}
</style></head><body>
<h2>RECIBO DE SUELDO — ${periodoLabel.toUpperCase()}</h2>
<table><tr><th>Empleado</th><th>Legajo</th><th>CUIL</th><th>Puesto</th></tr>
<tr><td>${emp.apellido}, ${emp.nombre}</td><td>${emp.legajo}</td><td>${emp.cuil}</td><td>${emp.puesto} · ${emp.sector}</td></tr></table>
<table><tr><th>Fecha Ingreso</th><th>Antigüedad</th><th>Banco</th><th>CBU</th></tr>
<tr><td>${emp.fechaIngreso}</td><td>${calcAntiguedadAnos(emp.fechaIngreso)} años</td><td>${emp.banco}</td><td>${emp.cbu}</td></tr></table>
<h3 style="margin-top:20px">HABERES</h3>
<div class="row"><span class="label">Sueldo Básico</span><span class="val pos">${fmt(emp.sueldoBasico)}</span></div>
<div class="row"><span class="label">Adicional Antigüedad (${calcAntiguedadAnos(emp.fechaIngreso)}%)</span><span class="val pos">${fmt(s.adicionalAntiguedad)}</span></div>
<div class="row total"><span>Total Bruto</span><span class="pos">${fmt(s.bruto)}</span></div>
<h3 style="margin-top:20px">DEDUCCIONES</h3>
<div class="row"><span class="label">Jubilación (11%)</span><span class="val neg">- ${fmt(s.jubilacion)}</span></div>
<div class="row"><span class="label">INSSJP / PAMI (3%)</span><span class="val neg">- ${fmt(s.inssjp)}</span></div>
<div class="row"><span class="label">Obra Social (3%) — ${emp.obraSocial}</span><span class="val neg">- ${fmt(s.obraSocial)}</span></div>
<div class="row total"><span>Total Retenciones</span><span class="neg">- ${fmt(s.totalRetenciones)}</span></div>
<h3 style="margin-top:20px">NETO A COBRAR</h3>
<div style="font-size:28px;font-weight:800;color:#2e7d32;padding:16px 0;border-top:3px solid #2e7d32;">${fmt(s.neto)}</div>
<p style="font-size:11px;color:#888;margin-top:24px">Recibo emitido por NexoPyme · Período: ${periodoLabel} · Obra Social: ${emp.obraSocial}</p>
<div style="margin-top:40px;display:flex;justify-content:space-between">
<div style="border-top:1px solid #333;width:200px;text-align:center;padding-top:4px;font-size:12px">Firma Empleador</div>
<div style="border-top:1px solid #333;width:200px;text-align:center;padding-top:4px;font-size:12px">Firma Empleado</div>
</div></body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `Recibo_${emp.apellido}_${emp.legajo}_${reciboPeriodo}.html`;
    a.click(); URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "empleados", label: "👥 Empleados" },
    { id: "liquidacion", label: "💰 Liquidación" },
    { id: "vacaciones", label: "🌴 Vacaciones" },
    { id: "asistencia", label: "📅 Asistencia" },
    { id: "recibos", label: "📄 Recibos" },
  ];

  const activos = empleados.filter(e => e.estado === "activo");

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Recursos Humanos</div>
        <div style={{ fontSize: 13, color: T.muted }}>{empleados.length} empleados · {activos.length} activos</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${tab === t.id ? T.accent : T.border}`, background: tab === t.id ? T.accentLight : T.surface, color: tab === t.id ? T.accent : T.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: EMPLEADOS ───────────────────────────────────────────────────── */}
      {tab === "empleados" && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
            <Btn onClick={openNewEmp}>+ Nuevo Empleado</Btn>
          </div>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {["Legajo", "Apellido y Nombre", "CUIL", "Puesto", "Sector", "Ingreso", "Sueldo Básico", "Estado", ""].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {empleados.map(emp => (
                  <tr key={emp.id} style={{ borderTop: `1px solid ${T.border}` }}>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12 }}>{emp.legajo}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 600 }}>{emp.apellido}, {emp.nombre}</td>
                    <td style={{ padding: "10px 12px", fontFamily: "monospace", fontSize: 12, color: T.muted }}>{emp.cuil}</td>
                    <td style={{ padding: "10px 12px" }}>{emp.puesto}</td>
                    <td style={{ padding: "10px 12px", color: T.muted }}>{emp.sector}</td>
                    <td style={{ padding: "10px 12px", color: T.muted, fontSize: 12 }}>{emp.fechaIngreso}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: T.accent }}>{fmt(emp.sueldoBasico)}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{ background: emp.estado === "activo" ? T.accentLight : emp.estado === "licencia" ? T.blueLight : T.redLight, color: emp.estado === "activo" ? T.accent : emp.estado === "licencia" ? T.blue : T.red, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{emp.estado}</span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn sm v="ghost" onClick={() => openEditEmp(emp)}>✏ Editar</Btn>
                        <Btn sm v="danger" onClick={() => deleteEmp(emp.id)}>✕</Btn>
                      </div>
                    </td>
                  </tr>
                ))}
                {empleados.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: T.muted, fontSize: 13 }}>No hay empleados cargados. Agregá el primero.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {showEmpForm && (
            <Modal title={editingEmp ? "Editar Empleado" : "Nuevo Empleado"} onClose={() => setShowEmpForm(false)} wide>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {[
                  ["Legajo", "legajo"], ["Nombre", "nombre"], ["Apellido", "apellido"], ["CUIL", "cuil"],
                  ["Puesto", "puesto"], ["Sector", "sector"], ["Fecha Ingreso", "fechaIngreso", "date"],
                  ["Sueldo Básico", "sueldoBasico", "number"], ["CBU", "cbu"], ["Banco", "banco"],
                  ["Obra Social", "obraSocial"], ["Email", "email"],
                ].map(([label, field, type]) => (
                  <Input key={field} label={label} type={type || "text"} value={empForm[field]} onChange={v => setEmpForm(p => ({ ...p, [field]: v }))} />
                ))}
                <Select label="Estado" value={empForm.estado} onChange={v => setEmpForm(p => ({ ...p, estado: v }))}
                  options={[{ value: "activo", label: "Activo" }, { value: "licencia", label: "Licencia" }, { value: "baja", label: "Baja" }]} />
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end" }}>
                <Btn v="ghost" onClick={() => setShowEmpForm(false)}>Cancelar</Btn>
                <Btn onClick={saveEmp}>Guardar</Btn>
              </div>
            </Modal>
          )}
        </div>
      )}

      {/* ── Tab: LIQUIDACIÓN ─────────────────────────────────────────────────── */}
      {tab === "liquidacion" && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: T.muted }}>
            <strong style={{ color: T.ink }}>Deducciones aplicadas:</strong> Jubilación SIPA 11% · INSSJP/PAMI 3% · Obra Social 3% · Adicional antigüedad 1% por año según LCT
          </div>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {["Empleado", "Puesto", "Antigüedad", "Básico", "+ Antigüedad", "Bruto", "Retenciones (17%)", "Neto a Cobrar"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activos.map(emp => {
                  const s = calcSueldo(emp);
                  return (
                    <tr key={emp.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{emp.apellido}, {emp.nombre}</td>
                      <td style={{ padding: "10px 12px", color: T.muted, fontSize: 12 }}>{emp.puesto}</td>
                      <td style={{ padding: "10px 12px", color: T.muted }}>{calcAntiguedadAnos(emp.fechaIngreso)} años</td>
                      <td style={{ padding: "10px 12px" }}>{fmt(emp.sueldoBasico)}</td>
                      <td style={{ padding: "10px 12px", color: T.accent }}>+{fmt(s.adicionalAntiguedad)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700 }}>{fmt(s.bruto)}</td>
                      <td style={{ padding: "10px 12px", color: T.red }}>-{fmt(s.totalRetenciones)}</td>
                      <td style={{ padding: "10px 12px", fontWeight: 800, color: T.accent, fontSize: 14 }}>{fmt(s.neto)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: T.surface, borderTop: `2px solid ${T.border}` }}>
                  <td colSpan={5} style={{ padding: "10px 12px", fontWeight: 800, fontSize: 13 }}>TOTALES</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800 }}>{fmt(activos.reduce((s, e) => s + calcSueldo(e).bruto, 0))}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: T.red }}>{fmt(activos.reduce((s, e) => s + calcSueldo(e).totalRetenciones, 0))}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 800, color: T.accent, fontSize: 14 }}>{fmt(activos.reduce((s, e) => s + calcSueldo(e).neto, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: VACACIONES ──────────────────────────────────────────────────── */}
      {tab === "vacaciones" && (
        <div>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12, color: T.muted }}>
            <strong style={{ color: T.ink }}>Ley 20.744 — Art. 150:</strong> hasta 5 años: 14 días · 5 a 10 años: 21 días · 10 a 20 años: 28 días · más de 20 años: 35 días. Período de goce: 1 octubre – 30 abril.
          </div>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {["Empleado", "Ingreso", "Antigüedad", "Días correspond.", "Días tomados", "Días pendientes", "Estado"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activos.map(emp => {
                  const anos = calcAntiguedadAnos(emp.fechaIngreso);
                  const diasCorr = calcVacacionesDias(emp.fechaIngreso);
                  const tomados = vacTomadas[emp.id] || 0;
                  const pendientes = diasCorr - tomados;
                  return (
                    <tr key={emp.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: "10px 12px", fontWeight: 600 }}>{emp.apellido}, {emp.nombre}</td>
                      <td style={{ padding: "10px 12px", color: T.muted, fontSize: 12 }}>{emp.fechaIngreso}</td>
                      <td style={{ padding: "10px 12px" }}>{anos} años</td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: T.blue }}>{diasCorr} días</td>
                      <td style={{ padding: "10px 12px" }}>
                        <input type="number" min={0} max={diasCorr} value={tomados}
                          onChange={e => setVacTomadas(p => ({ ...p, [emp.id]: Math.min(diasCorr, Math.max(0, Number(e.target.value))) }))}
                          style={{ width: 60, padding: "4px 8px", borderRadius: 6, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", textAlign: "center" }} />
                      </td>
                      <td style={{ padding: "10px 12px", fontWeight: 700, color: pendientes > 0 ? T.orange : T.accent }}>{pendientes} días</td>
                      <td style={{ padding: "10px 12px" }}>
                        <span style={{ background: pendientes === 0 ? T.accentLight : T.orangeLight, color: pendientes === 0 ? T.accent : T.orange, padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                          {pendientes === 0 ? "✓ Gozadas" : "Pendiente"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: ASISTENCIA ──────────────────────────────────────────────────── */}
      {tab === "asistencia" && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: T.muted, fontWeight: 700 }}>PERÍODO</label>
            <input type="month" value={asistMes} onChange={e => setAsistMes(e.target.value)}
              style={{ padding: "7px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit" }} />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: 8 }}>
              {asistCodigos.map(a => (
                <span key={a.c} style={{ background: a.bg, color: a.color, padding: "2px 10px", borderRadius: 10, fontSize: 11, fontWeight: 700 }}>{a.c} = {a.label}</span>
              ))}
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  <th style={{ padding: "8px 14px", textAlign: "left", color: T.muted, fontWeight: 700, fontSize: 11, minWidth: 160 }}>Empleado</th>
                  {Array.from({ length: diasDelMes() }, (_, i) => (
                    <th key={i+1} style={{ padding: "6px 4px", textAlign: "center", color: T.muted, fontSize: 10, fontWeight: 700, minWidth: 30 }}>{i+1}</th>
                  ))}
                  <th style={{ padding: "8px 10px", textAlign: "center", color: T.muted, fontSize: 10, fontWeight: 700 }}>Ausc.</th>
                </tr>
              </thead>
              <tbody>
                {activos.map(emp => {
                  let ausencias = 0;
                  return (
                    <tr key={emp.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: "6px 14px", fontWeight: 600, whiteSpace: "nowrap" }}>{emp.apellido}, {emp.nombre}</td>
                      {Array.from({ length: diasDelMes() }, (_, i) => {
                        const dia = i + 1;
                        const cod = getAsist(emp.id, dia);
                        const cfg = asistColorMap[cod] || asistColorMap["P"];
                        if (cod !== "P") ausencias++;
                        return (
                          <td key={dia} style={{ padding: "3px 2px", textAlign: "center" }}>
                            <button onClick={() => {
                              const cur = getAsist(emp.id, dia);
                              const idx = asistCodigos.findIndex(a => a.c === cur);
                              const next = asistCodigos[(idx + 1) % asistCodigos.length].c;
                              toggleAsist(emp.id, dia, next);
                            }}
                              style={{ width: 28, height: 24, borderRadius: 4, border: "none", background: cfg.bg, color: cfg.color, fontSize: 9, fontWeight: 800, cursor: "pointer", fontFamily: "inherit" }}>
                              {cod}
                            </button>
                          </td>
                        );
                      })}
                      <td style={{ padding: "6px 10px", textAlign: "center", fontWeight: 700, color: ausencias > 0 ? T.red : T.accent }}>{ausencias}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: T.muted }}>Hacé clic en cada celda para cambiar el estado. Rota entre: P → A → LS → LP → V → ART → P</div>
        </div>
      )}

      {/* ── Tab: RECIBOS ─────────────────────────────────────────────────────── */}
      {tab === "recibos" && (
        <div>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, maxWidth: 500 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Select label="EMPLEADO" value={reciboEmpId} onChange={setReciboEmpId}
                options={[{ value: "", label: "Seleccioná un empleado..." }, ...empleados.map(e => ({ value: e.id, label: `${e.legajo} · ${e.apellido}, ${e.nombre}` }))]} />
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>PERÍODO</label>
                <input type="month" value={reciboPeriodo} onChange={e => setReciboPeriodo(e.target.value)}
                  style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit" }} />
              </div>

              {reciboEmpId && (() => {
                const emp = empleados.find(e => e.id === reciboEmpId);
                const s = calcSueldo(emp);
                return (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                    <div style={{ fontWeight: 700, marginBottom: 12, color: T.ink }}>{emp.apellido}, {emp.nombre} · Legajo {emp.legajo}</div>
                    {[
                      ["Sueldo Básico", fmt(emp.sueldoBasico), T.ink, false],
                      [`Adicional Antigüedad (${calcAntiguedadAnos(emp.fechaIngreso)}%)`, fmt(s.adicionalAntiguedad), T.accent, false],
                      ["Total Bruto", fmt(s.bruto), T.ink, true],
                      ["Jubilación (11%)", `-${fmt(s.jubilacion)}`, T.red, false],
                      ["INSSJP (3%)", `-${fmt(s.inssjp)}`, T.red, false],
                      ["Obra Social (3%)", `-${fmt(s.obraSocial)}`, T.red, false],
                      ["Total Retenciones", `-${fmt(s.totalRetenciones)}`, T.red, true],
                      ["NETO A COBRAR", fmt(s.neto), T.accent, true],
                    ].map(([l, v, c, bold]) => (
                      <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${T.border}`, fontSize: bold ? 14 : 13, fontWeight: bold ? 800 : 400 }}>
                        <span style={{ color: T.muted }}>{l}</span>
                        <span style={{ color: c }}>{v}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              <Btn onClick={generarReciboPDF} disabled={!reciboEmpId} full>⬇ Descargar Recibo (HTML → PDF)</Btn>
              <div style={{ fontSize: 11, color: T.muted }}>El archivo se descarga como HTML. Abrilo en el navegador y usá Ctrl+P → "Guardar como PDF" para obtener el PDF final.</div>
            </div>
          </div>

          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: T.ink, marginBottom: 12 }}>Generar todos los recibos del período</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="month" value={reciboPeriodo} onChange={e => setReciboPeriodo(e.target.value)}
                style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit" }} />
              <Btn onClick={() => activos.forEach((emp, i) => setTimeout(() => {
                const s = calcSueldo(emp);
                const [y, m] = reciboPeriodo.split("-");
                const periodoLabel = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
                const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Recibo ${emp.legajo}</title><style>body{font-family:Arial,sans-serif;padding:32px;color:#222;max-width:800px;margin:0 auto}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-size:13px}.row.total{font-weight:bold;font-size:15px;}</style></head><body><h2>RECIBO DE SUELDO — ${periodoLabel.toUpperCase()}</h2><p>${emp.apellido}, ${emp.nombre} · Legajo ${emp.legajo} · ${emp.cuil}</p><div class="row"><span>Sueldo Básico</span><span>${fmt(emp.sueldoBasico)}</span></div><div class="row"><span>Adicional Antigüedad</span><span>+${fmt(s.adicionalAntiguedad)}</span></div><div class="row total"><span>Bruto</span><span>${fmt(s.bruto)}</span></div><div class="row"><span>Retenciones (17%)</span><span>-${fmt(s.totalRetenciones)}</span></div><div style="font-size:24px;font-weight:800;color:green;margin-top:16px">Neto: ${fmt(s.neto)}</div></body></html>`;
                const blob = new Blob([html], { type: "text/html" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `Recibo_${emp.apellido}_${emp.legajo}_${reciboPeriodo}.html`;
                a.click(); URL.revokeObjectURL(url);
              }, i * 300))}>⬇ Descargar Todos ({activos.length})</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MODULE: CAJA ─────────────────────────────────────────────────────────────
function CajaModule({ cajas, setCajas, cajaMovimientos, setCajaMovimientos, saleInvoices, empleados, defaultMontoInicial, setDefaultMontoInicial, companyId }) {
  const hoy = today; // usa la misma constante que los documentos
  const [selectedCajaId, setSelectedCajaId] = useState(null);
  const [showAbrirModal, setShowAbrirModal] = useState(false);
  const [showMovModal, setShowMovModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Abrir caja form
  const [formFecha, setFormFecha] = useState(hoy);
  const [formTurno, setFormTurno] = useState("");
  const [formMonto, setFormMonto] = useState(String(defaultMontoInicial));

  // Movimiento manual form
  const [movTipo, setMovTipo] = useState("ingreso");
  const [movMonto, setMovMonto] = useState("");
  const [movMotivo, setMovMotivo] = useState("");
  const [movFecha, setMovFecha] = useState(hoy);
  const [movHora, setMovHora] = useState(new Date().toTimeString().slice(0, 5));
  const [movEmpleado, setMovEmpleado] = useState("");
  const [movObs, setMovObs] = useState("");

  const selectedCaja = cajas.find(c => c.id === selectedCajaId);
  const fmt$ = (n) => `$${Number(n || 0).toLocaleString("es-AR")}`;

  const getAutoMovimientos = (caja) =>
    saleInvoices
      .filter(inv => {
        if (inv.metodoPago !== "efectivo") return false;
        if (inv.date !== caja.date) return false;
        if (inv.type === "factura") return true;
        if (inv.type === "presupuesto" && inv.modificaStock) {
          // excluir si ya tiene una factura o remito generado desde este presupuesto
          return !saleInvoices.some(d => d.originPresupuestoId === inv.id);
        }
        return false;
      })
      .map(inv => ({
        id: "auto-" + inv.id, tipo: "ingreso", monto: inv.total, fecha: inv.date, hora: "—",
        motivo: (inv.type === "factura" ? "Factura" : "Presupuesto") + " · " + (inv.ref || inv.id),
        empleadoId: null, observaciones: "Cliente: " + inv.clientName,
        origen: inv.type, origenId: inv.ref || inv.id, isAuto: true,
      }));

  const getAllMovimientos = (caja) => {
    const auto = getAutoMovimientos(caja);
    const manual = cajaMovimientos.filter(m => m.cajaId === caja.id);
    return [...auto, ...manual].map((m, i) => ({ ...m, numero: i + 1 }));
  };

  const abrirCaja = () => {
    const newCaja = { id: `CAJA-${String(Date.now()).slice(-6)}`, date: formFecha, turno: formTurno || null, montoInicial: parseFloat(formMonto) || 0, estado: "abierta" };
    setCajas(prev => [newCaja, ...prev]);
    if (companyId) supabase.from('cajas').insert(cajaToDb(newCaja, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
    const monto = parseFloat(formMonto) || 0;
    if (monto !== defaultMontoInicial) setDefaultMontoInicial(monto);
    setSelectedCajaId(newCaja.id);
    setShowAbrirModal(false);
  };

  const guardarMovimiento = (cajaId) => {
    const mov = { id: crypto.randomUUID(), cajaId, tipo: movTipo, monto: parseFloat(movMonto) || 0, fecha: selectedCaja ? selectedCaja.date : hoy, hora: movHora, motivo: movMotivo, empleadoId: movEmpleado || null, observaciones: movObs, origen: "manual", origenId: null };
    setCajaMovimientos(prev => [...prev, mov]);
    if (companyId) supabase.from('caja_movimientos').insert(cajaMovimientoToDb(mov, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
    setShowMovModal(false);
    setMovTipo("ingreso"); setMovMonto(""); setMovMotivo(""); setMovObs(""); setMovEmpleado("");
    setMovHora(new Date().toTimeString().slice(0, 5));
  };

  const exportarExcel = (caja) => {
    const movs = getAllMovimientos(caja);
    const totalIngresos = movs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
    const totalGastos = movs.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
    const saldo = caja.montoInicial + totalIngresos - totalGastos;
    const headers = ["N°", "Tipo", "Motivo", "Monto ($)", "Fecha", "Hora", "Empleado", "Origen", "Observaciones"];
    const dataRows = [
      ...movs.map(m => {
        const emp = m.empleadoId ? (empleados || []).find(e => e.id === m.empleadoId) : null;
        return [m.numero, m.tipo === "ingreso" ? "INGRESO" : "GASTO", m.motivo, m.tipo === "ingreso" ? m.monto : -m.monto, m.fecha, m.hora !== "—" ? m.hora : "", emp ? emp.nombre + " " + emp.apellido : "—", m.origenId || "Manual", m.observaciones || ""];
      }),
      ["", "", "Monto inicial", caja.montoInicial, "", "", "", "", ""],
      ["", "", "TOTAL INGRESOS", totalIngresos, "", "", "", "", ""],
      ["", "", "TOTAL GASTOS", totalGastos, "", "", "", "", ""],
      ["", "", "SALDO FINAL", saldo, "", "", "", "", ""],
    ];
    const period = `Caja ${caja.id} · Fecha: ${caja.date}${caja.turno ? " · Turno " + caja.turno : ""} · Estado: ${caja.estado}`;
    const ws = buildFormattedSheet(`Caja ${caja.id}`, period, headers, dataRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Movimientos");
    XLSX.writeFile(wb, `Caja-${caja.id}-${caja.date}.xlsx`);
  };

  // ── VISTA DETALLE DE UNA CAJA ──
  if (selectedCaja) {
    const movs = getAllMovimientos(selectedCaja);
    const totalIngresos = movs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
    const totalGastos = movs.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
    const saldo = selectedCaja.montoInicial + totalIngresos - totalGastos;
    const estaAbierta = selectedCaja.estado === "abierta";
    return (
      <div>
        {showMovModal && (
          <Modal title="Nuevo movimiento manual" onClose={() => setShowMovModal(false)}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 8, letterSpacing: 1 }}>TIPO DE MOVIMIENTO</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[["ingreso", T.accent, T.accentLight, "▲ Ingreso"], ["gasto", T.red, T.redLight, "▼ Gasto"]].map(([v, col, bg, lbl]) => (
                    <button key={v} onClick={() => setMovTipo(v)} style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${movTipo === v ? col : T.border}`, background: movTipo === v ? bg : T.surface, color: movTipo === v ? col : T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Input label="MONTO ($)" type="number" value={movMonto} onChange={setMovMonto} placeholder="0.00" />
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>EMPLEADO (opcional)</label>
                  <select value={movEmpleado} onChange={e => setMovEmpleado(e.target.value)} style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                    <option value="">— Sin asignar —</option>
                    {(empleados || []).filter(e => e.estado === "activo").map(e => <option key={e.id} value={e.id}>{e.nombre} {e.apellido}</option>)}
                  </select>
                </div>
              </div>
              <Input label="MOTIVO" value={movMotivo} onChange={setMovMotivo} placeholder="ej: Compra de materiales de limpieza" />
              <Input label="HORA" type="time" value={movHora} onChange={setMovHora} />
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>OBSERVACIONES (opcional)</label>
                <textarea value={movObs} onChange={e => setMovObs(e.target.value)} rows={2} style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 4 }}>
                <Btn v="ghost" onClick={() => setShowMovModal(false)}>Cancelar</Btn>
                <Btn onClick={() => guardarMovimiento(selectedCaja.id)} disabled={!movMonto || !movMotivo}>Agregar movimiento</Btn>
              </div>
            </div>
          </Modal>
        )}

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <button onClick={() => setSelectedCajaId(null)} style={{ background: "none", border: "none", color: T.muted, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: 8 }}>← Cajas</button>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>{selectedCaja.id}</div>
              <span style={{ background: estaAbierta ? T.accentLight : T.surface, color: estaAbierta ? T.accent : T.muted, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{estaAbierta ? "ABIERTA" : "CERRADA"}</span>
              {selectedCaja.turno && <span style={{ background: T.blueLight, color: T.blue, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>Turno {selectedCaja.turno}</span>}
            </div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Fecha: {selectedCaja.date} · Monto inicial: {fmt$(selectedCaja.montoInicial)}</div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Btn v="ghost" onClick={() => exportarExcel(selectedCaja)}>↓ Excel</Btn>
            {estaAbierta ? (
              <>
                <Btn onClick={() => { setMovFecha(hoy); setMovHora(new Date().toTimeString().slice(0, 5)); setShowMovModal(true); }}>+ Movimiento</Btn>
                <Btn v="danger" onClick={() => { setCajas(prev => prev.map(c => c.id === selectedCaja.id ? { ...c, estado: "cerrada" } : c)); if (companyId) supabase.from('cajas').update({ estado: 'cerrada' }).eq('id', selectedCaja.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) }); }}>Cerrar caja</Btn>
              </>
            ) : (
              <Btn v="ghost" onClick={() => { setCajas(prev => prev.map(c => c.id === selectedCaja.id ? { ...c, estado: "abierta" } : c)); if (companyId) supabase.from('cajas').update({ estado: 'abierta' }).eq('id', selectedCaja.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) }); }}>Reabrir caja</Btn>
            )}
            <Btn v="danger" onClick={() => { if (window.confirm(`¿Eliminar la caja ${selectedCaja.id} y todos sus movimientos? Esta acción no se puede deshacer.`)) { setCajaMovimientos(prev => prev.filter(m => m.cajaId !== selectedCaja.id)); setCajas(prev => prev.filter(c => c.id !== selectedCaja.id)); setSelectedCajaId(null); if (companyId) { supabase.from('caja_movimientos').delete().eq('caja_id', selectedCaja.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) }); supabase.from('cajas').delete().eq('id', selectedCaja.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) }); } } }}>Eliminar caja</Btn>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
          {[["Monto inicial", fmt$(selectedCaja.montoInicial), T.muted], ["Total ingresos", fmt$(totalIngresos), T.accent], ["Total gastos", fmt$(totalGastos), T.red], ["Saldo actual", fmt$(saldo), saldo >= 0 ? T.blue : T.red]].map(([lbl, val, col]) => (
            <div key={lbl} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, marginBottom: 6, letterSpacing: 1 }}>{lbl.toUpperCase()}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: col }}>{val}</div>
            </div>
          ))}
        </div>

        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink }}>Movimientos ({movs.length})</div>
            <div style={{ fontSize: 11, color: T.muted }}>AUTO = desde facturas/presupuestos con pago efectivo</div>
          </div>
          {movs.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>
              No hay movimientos para este día.
              {estaAbierta && <div style={{ marginTop: 12 }}><Btn v="ghost" onClick={() => setShowMovModal(true)}>+ Agregar movimiento manual</Btn></div>}
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>
                {["N°", "Tipo", "Motivo", "Monto", "Fecha / Hora", "Origen", "Obs.", ""].map(h => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {movs.map(m => {
                  const emp = m.empleadoId ? (empleados || []).find(e => e.id === m.empleadoId) : null;
                  const isIng = m.tipo === "ingreso";
                  return (
                    <tr key={m.id} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: T.muted }}>#{m.numero}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ background: isIng ? T.accentLight : T.redLight, color: isIng ? T.accent : T.red, padding: "2px 10px", borderRadius: 12, fontSize: 11, fontWeight: 700 }}>{isIng ? "▲ INGRESO" : "▼ GASTO"}</span>
                        {m.isAuto && <span style={{ marginLeft: 6, background: T.blueLight, color: T.blue, padding: "1px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700 }}>AUTO</span>}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: T.ink }}>
                        {m.motivo}
                        {emp && <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Empleado: {emp.nombre} {emp.apellido}</div>}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 15, fontWeight: 800, color: isIng ? T.accent : T.red }}>{isIng ? "+" : "-"}{fmt$(m.monto)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: T.muted }}>{m.fecha}<br />{m.hora !== "—" ? m.hora : ""}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: m.origenId ? T.blue : T.muted, fontFamily: "monospace" }}>{m.origenId || "Manual"}</td>
                      <td style={{ padding: "12px 16px", fontSize: 12, color: T.muted, maxWidth: 160 }}>{m.observaciones || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {!m.isAuto && estaAbierta && (
                          <button onClick={() => { if (window.confirm("¿Eliminar este movimiento? Esta acción no se puede deshacer.")) { setCajaMovimientos(prev => prev.filter(x => x.id !== m.id)); if (companyId) supabase.from('caja_movimientos').delete().eq('id', m.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) }); } }} style={{ background: "none", border: "none", color: T.muted, fontSize: 16, cursor: "pointer", padding: "2px 6px", borderRadius: 4 }} title="Eliminar movimiento">×</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ── VISTA LISTA DE CAJAS ──
  return (
    <div>
      {showAbrirModal && (
        <Modal title="Abrir nueva caja" onClose={() => setShowAbrirModal(false)}>
          <div style={{ display: "grid", gap: 14 }}>
            <Input label="FECHA" type="date" value={formFecha} onChange={setFormFecha} />
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>TURNO (opcional)</label>
              <select value={formTurno} onChange={e => setFormTurno(e.target.value)} style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }}>
                <option value="">Sin turno definido</option>
                <option value="mañana">Turno Mañana</option>
                <option value="tarde">Turno Tarde</option>
                <option value="noche">Turno Noche</option>
              </select>
            </div>
            <Input label={`MONTO INICIAL ($) — predeterminado: $${Number(defaultMontoInicial).toLocaleString("es-AR")}`} type="number" value={formMonto} onChange={setFormMonto} placeholder="0" />
            <div style={{ fontSize: 11, color: T.muted, background: T.surface, borderRadius: 8, padding: "10px 14px", lineHeight: 1.6 }}>
              Las facturas y presupuestos (con "Mueve stock") del día con método de pago <strong>Efectivo</strong> se suman automáticamente como ingresos.
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <Btn v="ghost" onClick={() => setShowAbrirModal(false)}>Cancelar</Btn>
              <Btn onClick={abrirCaja}>Abrir caja</Btn>
            </div>
          </div>
        </Modal>
      )}

      {showConfigModal && (
        <Modal title="Configurar monto inicial predeterminado" onClose={() => setShowConfigModal(false)}>
          <div style={{ display: "grid", gap: 14 }}>
            <Input label="MONTO INICIAL PREDETERMINADO ($)" type="number" value={String(defaultMontoInicial)} onChange={v => setDefaultMontoInicial(parseFloat(v) || 0)} placeholder="0" />
            <div style={{ fontSize: 12, color: T.muted }}>Este monto se usará como valor por defecto al abrir nuevas cajas. Podés modificarlo para cada caja individualmente.</div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Btn onClick={() => setShowConfigModal(false)}>Guardar</Btn>
            </div>
          </div>
        </Modal>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: T.ink }}>Caja</div>
          <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>Control de flujo de efectivo diario</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <Btn v="ghost" onClick={() => setShowConfigModal(true)}>Configurar monto inicial</Btn>
          <Btn onClick={() => { setFormFecha(hoy); setFormMonto(String(defaultMontoInicial)); setFormTurno(""); setShowAbrirModal(true); }}>+ Abrir caja</Btn>
        </div>
      </div>

      {cajas.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 20px", color: T.muted }}>
          <div style={{ fontSize: 48, marginBottom: 16, color: T.faint }}>◈</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Sin cajas registradas</div>
          <div style={{ fontSize: 13, marginBottom: 24 }}>Abrí la primera caja del día para comenzar a registrar el flujo de efectivo.</div>
          <Btn onClick={() => { setFormFecha(hoy); setFormMonto(String(defaultMontoInicial)); setFormTurno(""); setShowAbrirModal(true); }}>+ Abrir caja</Btn>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {cajas.map(caja => {
            const movs = getAllMovimientos(caja);
            const totalIngresos = movs.filter(m => m.tipo === "ingreso").reduce((s, m) => s + m.monto, 0);
            const totalGastos = movs.filter(m => m.tipo === "gasto").reduce((s, m) => s + m.monto, 0);
            const saldo = caja.montoInicial + totalIngresos - totalGastos;
            const estaAbierta = caja.estado === "abierta";
            return (
              <div key={caja.id} onClick={() => setSelectedCajaId(caja.id)}
                style={{ background: T.paper, border: `1px solid ${estaAbierta ? T.accent + "50" : T.border}`, borderRadius: 12, padding: "18px 22px", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "border-color 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = T.accent; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = estaAbierta ? T.accent + "50" : T.border; }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "monospace", fontSize: 13, fontWeight: 700, color: T.accent }}>{caja.id}</span>
                    <span style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{caja.date}</span>
                    {caja.turno && <span style={{ background: T.blueLight, color: T.blue, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>Turno {caja.turno}</span>}
                    <span style={{ background: estaAbierta ? T.accentLight : T.surface, color: estaAbierta ? T.accent : T.muted, padding: "2px 8px", borderRadius: 12, fontSize: 10, fontWeight: 700 }}>{estaAbierta ? "ABIERTA" : "CERRADA"}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.muted }}>
                    Inicial: {fmt$(caja.montoInicial)} · {movs.length} movimiento(s) · Ingresos: {fmt$(totalIngresos)} · Gastos: {fmt$(totalGastos)}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 20 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: saldo >= 0 ? T.blue : T.red }}>{fmt$(saldo)}</div>
                  <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>Saldo actual</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
// ─── MODULE: CHEQUES ──────────────────────────────────────────────────────────
function ChequesModule({ cheques, setCheques, companyId }) {
  const [tab, setTab] = useState("cobrar");
  const [showForm, setShowForm] = useState(false);
  const [formTipo, setFormTipo] = useState("cobrar");
  const [formNumero, setFormNumero] = useState("");
  const [formFechaPago, setFormFechaPago] = useState(today);
  const [formFechaVenc, setFormFechaVenc] = useState("");
  const [formMonto, setFormMonto] = useState(0);
  const [formEmisor, setFormEmisor] = useState("");
  const [importMsg, setImportMsg] = useState(null);

  const cobrar = cheques.filter(c => c.tipo === "cobrar");
  const pagar = cheques.filter(c => c.tipo === "pagar");

  const addCheque = () => {
    const c = { id: crypto.randomUUID(), tipo: formTipo, numero: formNumero, fechaPago: formFechaPago, fechaVencimiento: formFechaVenc || formFechaPago, monto: parseFloat(formMonto) || 0, emisor: formEmisor, estado: "pendiente" };
    setCheques(prev => [...prev, c]);
    if (companyId) supabase.from('cheques').insert(chequeToDb(c, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
    setShowForm(false);
    setFormNumero(""); setFormMonto(0); setFormEmisor(""); setFormFechaVenc(""); setFormFechaPago(today);
  };

  const marcarEstado = (id, estado) => {
    setCheques(prev => prev.map(c => c.id === id ? { ...c, estado } : c));
    if (companyId) supabase.from('cheques').update({ estado }).eq('id', id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
  };

  const eliminarCheque = (id) => {
    setCheques(prev => prev.filter(c => c.id !== id));
    if (companyId) supabase.from('cheques').delete().eq('id', id).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
  };

  const vaciarCheques = () => {
    if (!window.confirm(`¿Vaciar todos los cheques ${tab === "pagar" ? "a pagar" : "a cobrar"}? Esta acción no se puede deshacer.`)) return;
    const ids = (tab === "cobrar" ? cobrar : pagar).map(c => c.id);
    setCheques(prev => prev.filter(c => !ids.includes(c.id)));
    if (companyId) supabase.from('cheques').delete().in('id', ids).then(r => { if (r?.error) console.error("DB Error:", r.error.message) });
  };

  const descargarPlantilla = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ["Nro Cheque", "Fecha Pago", "Fecha Vencimiento", "Monto", "Emisor"],
      ["12345678", "15/04/2026", "15/04/2026", 50000, "Juan García"],
      ["87654321", "20/04/2026", "25/04/2026", 120000, "Distribuidora Central"],
    ]);
    ws['!cols'] = [{ wch: 15 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 28 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Cheques");
    XLSX.writeFile(wb, "NexoPyME_Plantilla_Cheques.xlsx");
  };

  const importarExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const tipoImport = tab === "pagar" ? "pagar" : "cobrar";
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: 'binary', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
      if (rows.length < 2) return;

      const toDateStr = (v) => {
        if (!v) return today;
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        const s = String(v).trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        const parts = s.split(/[/\-\.]/);
        if (parts.length === 3) { const [d, m, y] = parts; return `${y.length === 2 ? '20' + y : y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`; }
        return today;
      };

      // Detectar columnas por encabezado
      const headerRow = rows[0].map(h => String(h || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
      const hasHeaders = headerRow.some(h => /[a-z]/.test(h));
      // findCol: busca patterns, opcionalmente excluye columnas que contengan exclude
      const findCol = (patterns, exclude = []) => {
        const idx = headerRow.findIndex(h => patterns.some(p => h.includes(p)) && !exclude.some(ex => h.includes(ex)));
        return idx >= 0 ? idx : -1;
      };

      let colNumero = 0, colFechaPago = 1, colFechaVenc = 2, colMonto = 3, colEmisor = 4;
      if (hasHeaders) {
        const n = findCol(['nro', 'num', 'cheque', 'n°', 'numero']);
        const fp = findCol(['fecha pag', 'pago', 'cobro', 'acredit', 'fecha'], ['vencim', 'vto', 'vence']);
        const fv = findCol(['vencim', 'vto', 'vence']);
        const m = findCol(['monto', 'importe', 'valor', 'amount']);
        // Emisor: priorizar "emitido por" sobre "banco emisor" — excluir columnas que contengan "banco"
        let em = findCol(['emitido', 'librador', 'beneficiario', 'titular']);
        if (em < 0) em = findCol(['nombre', 'emisor', 'cliente'], ['banco']);
        if (n >= 0) colNumero = n;
        if (fp >= 0) colFechaPago = fp;
        if (fv >= 0) colFechaVenc = fv;
        if (m >= 0) colMonto = m;
        if (em >= 0) colEmisor = em;
      }

      // Numeros de cheque ya cargados (para evitar duplicados)
      const existingNumeros = new Set(cheques.map(c => c.numero).filter(Boolean));

      const dataRows = hasHeaders ? rows.slice(1) : rows;
      const nuevos = [];
      let duplicados = 0;
      dataRows.filter(r => r.some(c => c !== "")).forEach(row => {
        const numero = String(row[colNumero] || "").trim();
        const monto = parseFloat(String(row[colMonto] || "0").replace(/[^0-9,.-]/g, "").replace(",", ".")) || 0;
        if (!numero && !monto) return;
        if (numero && existingNumeros.has(numero)) { duplicados++; return; }
        const c = { id: crypto.randomUUID(), tipo: tipoImport, numero, fechaPago: toDateStr(row[colFechaPago]), fechaVencimiento: toDateStr(row[colFechaVenc]) || toDateStr(row[colFechaPago]), monto, emisor: String(row[colEmisor] || "").trim(), estado: "pendiente" };
        nuevos.push(c);
        if (numero) existingNumeros.add(numero);
      });
      setCheques(prev => [...prev, ...nuevos]);
      if (companyId) nuevos.forEach(c => supabase.from('cheques').insert(chequeToDb(c, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message) }));
      const dupMsg = duplicados > 0 ? ` · ${duplicados} duplicado${duplicados > 1 ? "s" : ""} ignorado${duplicados > 1 ? "s" : ""}` : "";
      setImportMsg(`${nuevos.length} cheques importados${dupMsg}`);
      setTimeout(() => setImportMsg(null), 4000);
    };
    reader.readAsBinaryString(file);
    e.target.value = "";
  };

  const flujoData = (() => {
    const days = {};
    cheques.filter(c => c.estado === "pendiente").forEach(c => {
      const d = c.fechaPago;
      if (!days[d]) days[d] = { cobrar: 0, pagar: 0 };
      days[d][c.tipo] += c.monto;
    });
    return Object.entries(days).sort((a, b) => a[0].localeCompare(b[0]));
  })();

  const listaCheques = tab === "cobrar" ? cobrar : tab === "pagar" ? pagar : [];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800 }}>Cheques</div>
          <div style={{ fontSize: 13, color: T.muted }}>Cheques a cobrar, a pagar y flujo diario</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={descargarPlantilla}
            style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            📋 Plantilla
          </button>
          <label style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center" }}>
            📥 Importar Excel
            <input type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={importarExcel} />
          </label>
          {(tab === "cobrar" || tab === "pagar") && (tab === "cobrar" ? cobrar : pagar).length > 0 && (
            <button onClick={vaciarCheques}
              style={{ padding: "9px 16px", borderRadius: 9, border: `1px solid ${T.red}60`, background: T.redLight, color: T.red, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              🗑 Vaciar lista
            </button>
          )}
          <Btn onClick={() => { setFormTipo(tab === "pagar" ? "pagar" : "cobrar"); setShowForm(true); }}>+ Nuevo cheque</Btn>
        </div>
      </div>

      {importMsg && <div style={{ background: T.accentLight, border: `1px solid ${T.accent}40`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: T.accent }}>✓ {importMsg}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        {[
          ["A cobrar (pendiente)", cobrar.filter(c=>c.estado==="pendiente").reduce((s,c)=>s+c.monto,0), T.accent],
          ["Cobrados", cobrar.filter(c=>c.estado==="cobrado").reduce((s,c)=>s+c.monto,0), T.blue],
          ["A pagar (pendiente)", pagar.filter(c=>c.estado==="pendiente").reduce((s,c)=>s+c.monto,0), T.orange],
          ["Pagados", pagar.filter(c=>c.estado==="pagado").reduce((s,c)=>s+c.monto,0), T.muted],
        ].map(([l,v,c]) => (
          <div key={l} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, marginBottom: 6 }}>{l.toUpperCase()}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: c }}>{fmt(v)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {[["cobrar","A Cobrar"],["pagar","A Pagar"],["flujo","Flujo diario"]].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: "8px 18px", borderRadius: 8, border: `1px solid ${tab===id?T.accent:T.border}`, background: tab===id?T.accentLight:"transparent", color: tab===id?T.accent:T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "flujo" ? (
        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          {flujoData.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>No hay cheques pendientes registrados.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>
                {["Fecha","A cobrar","A pagar","Balance del día"].map(h => <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}
              </tr></thead>
              <tbody>{flujoData.map(([d, v]) => (
                <tr key={d} style={{ borderTop: `1px solid ${T.border}`, background: d === today ? `${T.accent}10` : "transparent" }}>
                  <td style={{ padding: "10px 14px", fontFamily: "monospace", fontWeight: 600 }}>{d}{d === today && <span style={{ marginLeft: 8, fontSize: 10, background: T.accentLight, color: T.accent, padding: "1px 6px", borderRadius: 6, fontWeight: 700 }}>HOY</span>}</td>
                  <td style={{ padding: "10px 14px", color: T.accent, fontWeight: 700 }}>{v.cobrar > 0 ? fmt(v.cobrar) : <span style={{color:T.faint}}>—</span>}</td>
                  <td style={{ padding: "10px 14px", color: T.red, fontWeight: 700 }}>{v.pagar > 0 ? fmt(v.pagar) : <span style={{color:T.faint}}>—</span>}</td>
                  <td style={{ padding: "10px 14px", fontWeight: 800, color: v.cobrar - v.pagar >= 0 ? T.blue : T.red }}>{fmt(v.cobrar - v.pagar)}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      ) : (
        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, overflow: "hidden" }}>
          {listaCheques.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: T.muted, fontSize: 13 }}>No hay cheques {tab === "cobrar" ? "a cobrar" : "a pagar"} registrados. Importá un Excel o creá uno manual.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>
                {(tab === "cobrar" ? ["N° Cheque","Emisor","Fecha pago","Vencimiento","Monto","Estado","",""] : ["N° Cheque","Fecha pago","Vencimiento","Monto","Estado","",""]).map(h => <th key={h} style={{ padding: "11px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700 }}>{h}</th>)}
              </tr></thead>
              <tbody>{listaCheques.sort((a,b) => a.fechaPago.localeCompare(b.fechaPago)).map(c => {
                const vencido = c.estado === "pendiente" && c.fechaVencimiento < today;
                return (
                  <tr key={c.id} style={{ borderTop: `1px solid ${T.border}`, background: vencido ? `${T.red}08` : "transparent" }}>
                    <td style={{ padding: "10px 14px", fontFamily: "monospace", color: T.blue, fontWeight: 700 }}>{c.numero || "—"}</td>
                    {tab === "cobrar" && <td style={{ padding: "10px 14px", fontSize: 13 }}>{c.emisor || "—"}</td>}
                    <td style={{ padding: "10px 14px", fontSize: 13, color: T.muted }}>{c.fechaPago}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: vencido ? T.red : T.muted }}>{c.fechaVencimiento || "—"}</td>
                    <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 800, color: tab === "cobrar" ? T.accent : T.orange }}>{fmt(c.monto)}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ background: c.estado === "pendiente" ? (vencido ? T.redLight : T.yellowLight) : T.accentLight, color: c.estado === "pendiente" ? (vencido ? T.red : T.yellow) : T.accent, padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>
                        {c.estado.toUpperCase()}{vencido ? " ⚠" : ""}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      {c.estado === "pendiente" ? (
                        <button onClick={() => marcarEstado(c.id, tab === "cobrar" ? "cobrado" : "pagado")}
                          style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.accent}`, background: T.accentLight, color: T.accent, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          Marcar {tab === "cobrar" ? "cobrado" : "pagado"}
                        </button>
                      ) : (
                        <button onClick={() => marcarEstado(c.id, "pendiente")}
                          style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                          ↩ Revertir
                        </button>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <button onClick={() => eliminarCheque(c.id)}
                        style={{ background: "none", border: "none", color: T.faint, cursor: "pointer", fontSize: 16, lineHeight: 1 }}
                        title="Eliminar cheque"
                        onMouseEnter={e => e.target.style.color = T.red}
                        onMouseLeave={e => e.target.style.color = T.faint}>✕</button>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          )}
        </div>
      )}

      {showForm && (
        <Modal title="Nuevo cheque" onClose={() => setShowForm(false)}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {[["cobrar","A cobrar"],["pagar","A pagar"]].map(([v,l]) => (
              <button key={v} onClick={() => setFormTipo(v)}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${formTipo===v?T.accent:T.border}`, background: formTipo===v?T.accentLight:T.surface, color: formTipo===v?T.accent:T.muted, fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                {l}
              </button>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
            <Input label="N° DE CHEQUE" value={formNumero} onChange={setFormNumero} placeholder="ej: 12345678" />
            {formTipo === "cobrar" && <Input label="EMISOR" value={formEmisor} onChange={setFormEmisor} placeholder="Nombre del emisor" />}
            <Input label="FECHA DE PAGO" type="date" value={formFechaPago} onChange={setFormFechaPago} />
            <Input label="FECHA VENCIMIENTO" type="date" value={formFechaVenc} onChange={setFormFechaVenc} />
            <Input label="MONTO ($)" type="number" value={formMonto} onChange={v => setFormMonto(parseFloat(v)||0)} />
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Btn v="ghost" onClick={() => setShowForm(false)}>Cancelar</Btn>
            <Btn onClick={addCheque} disabled={!formFechaPago || formMonto <= 0}>Guardar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CONTABILIDAD MODULE ──────────────────────────────────────────────────────

// Lista oficial de bancos argentinos con código BCRA
const BANCOS_ARGENTINA = [
  // Bancos Públicos Nacionales
  { codigo: "011", nombre: "Banco de la Nación Argentina" },
  { codigo: "014", nombre: "Banco de la Provincia de Buenos Aires" },
  { codigo: "020", nombre: "Banco de la Provincia de Córdoba S.A." },
  { codigo: "029", nombre: "Banco de la Ciudad de Buenos Aires" },
  { codigo: "044", nombre: "Banco Hipotecario S.A." },
  { codigo: "191", nombre: "BICE - Banco de Inversión y Comercio Exterior" },
  // Bancos Públicos Provinciales
  { codigo: "045", nombre: "Banco de San Juan S.A." },
  { codigo: "065", nombre: "Banco Municipal de Rosario" },
  { codigo: "083", nombre: "Banco del Chubut S.A." },
  { codigo: "086", nombre: "Banco de Santa Cruz S.A." },
  { codigo: "093", nombre: "Banco de La Pampa S.E.M." },
  { codigo: "094", nombre: "Banco de Corrientes S.A." },
  { codigo: "097", nombre: "Banco Provincia del Neuquén S.A." },
  { codigo: "198", nombre: "Banco de Formosa S.A." },
  { codigo: "206", nombre: "Banco de Santiago del Estero S.A." },
  { codigo: "213", nombre: "Banco Municipal de La Plata" },
  { codigo: "269", nombre: "Nuevo Banco del Chaco S.A." },
  { codigo: "294", nombre: "Banco de Tierra del Fuego S.A." },
  // Bancos Privados Nacionales
  { codigo: "007", nombre: "Banco de Galicia y Buenos Aires S.A.U." },
  { codigo: "027", nombre: "Banco Supervielle S.A." },
  { codigo: "034", nombre: "Banco Patagonia S.A." },
  { codigo: "060", nombre: "Nuevo Banco de Santa Fe S.A." },
  { codigo: "072", nombre: "Banco Santander Argentina S.A." },
  { codigo: "143", nombre: "Brubank S.A.U." },
  { codigo: "165", nombre: "Banco Credicoop Cooperativo Limitado" },
  { codigo: "200", nombre: "Banco CMF S.A." },
  { codigo: "215", nombre: "BACS - Banco de Crédito y Securitización S.A." },
  { codigo: "224", nombre: "Banco Comafi S.A." },
  { codigo: "268", nombre: "Banco del Sol S.A." },
  { codigo: "277", nombre: "Wilobank S.A." },
  { codigo: "281", nombre: "Reba Compañía Financiera S.A." },
  { codigo: "285", nombre: "Banco Mariva S.A." },
  { codigo: "286", nombre: "Banco Ualá Bis S.A." },
  { codigo: "288", nombre: "Banco Roela S.A." },
  { codigo: "300", nombre: "Banco de Servicios y Transacciones S.A." },
  { codigo: "317", nombre: "BIND Banco Industrial S.A." },
  { codigo: "322", nombre: "Naranja X S.A.U." },
  { codigo: "330", nombre: "Banco de Valores S.A." },
  { codigo: "338", nombre: "BEAL - Banco Europeo para América Latina S.A." },
  { codigo: "340", nombre: "Banco Meridian S.A." },
  { codigo: "341", nombre: "Banco Masventas S.A." },
  // Bancos Privados Extranjeros
  { codigo: "017", nombre: "BBVA Argentina S.A." },
  { codigo: "046", nombre: "Banco do Brasil S.A." },
  { codigo: "150", nombre: "HSBC Bank Argentina S.A." },
  { codigo: "222", nombre: "ICBC - Industrial and Commercial Bank of China Argentina S.A.U." },
  { codigo: "259", nombre: "Banco Itaú Argentina S.A." },
  { codigo: "266", nombre: "Banco Bradesco Argentina S.A.U." },
  { codigo: "299", nombre: "Bank of America, National Association" },
  // Billeteras / Entidades de Pago
  { codigo: "307", nombre: "Mercado Pago S.A." },
  { codigo: "384", nombre: "Cuenta DNI - Banco Provincia" },
];

const PLAN_CUENTAS = [
  // ACTIVO
  { code: "1",      name: "Activo",                                        tipo: "activo", nivel: 1 },
  { code: "11",     name: "Activo Corriente",                              tipo: "activo", nivel: 2 },
  { code: "111",    name: "Caja y Bancos",                                 tipo: "activo", nivel: 3 },
  { code: "111100", name: "Caja en pesos",                                 tipo: "activo", nivel: 4, imputable: true },
  { code: "111200", name: "Banco Provincia Cta Cte.",                      tipo: "activo", nivel: 4, imputable: true },
  { code: "111300", name: "Banco Nacion Cta Especial",                     tipo: "activo", nivel: 4, imputable: true },
  { code: "113",    name: "Creditos por Ventas",                           tipo: "activo", nivel: 3 },
  { code: "113100", name: "Deudores Por Ventas",                           tipo: "activo", nivel: 4, imputable: true },
  { code: "113200", name: "Valores a Depositar",                           tipo: "activo", nivel: 4, imputable: true },
  { code: "114",    name: "Otros Creditos",                                tipo: "activo", nivel: 3 },
  { code: "114101", name: "Accionistas",                                   tipo: "activo", nivel: 4, imputable: true },
  { code: "114102", name: "Varios",                                        tipo: "activo", nivel: 4, imputable: true },
  { code: "114103", name: "Alquileres a Devengar",                         tipo: "activo", nivel: 4, imputable: true },
  { code: "114104", name: "Depositos de Alquiler",                         tipo: "activo", nivel: 4, imputable: true },
  { code: "114201", name: "IIBB Saldo a Favor CABA",                       tipo: "activo", nivel: 4, imputable: true },
  { code: "114202", name: "IIBB Saldo a Favor BS AS",                      tipo: "activo", nivel: 4, imputable: true },
  { code: "114203", name: "IIBB Retenciones CABA",                         tipo: "activo", nivel: 4, imputable: true },
  { code: "114204", name: "IIBB Percepciones CABA",                        tipo: "activo", nivel: 4, imputable: true },
  { code: "114205", name: "IIBB Retenciones BS AS",                        tipo: "activo", nivel: 4, imputable: true },
  { code: "114206", name: "IIBB Percepciones BS AS",                       tipo: "activo", nivel: 4, imputable: true },
  { code: "114301", name: "IVA Credito Fiscal",                            tipo: "activo", nivel: 4, imputable: true },
  { code: "114302", name: "IVA Retenciones",                               tipo: "activo", nivel: 4, imputable: true },
  { code: "114303", name: "IVA Percepciones",                              tipo: "activo", nivel: 4, imputable: true },
  { code: "114304", name: "IVA Saldo Tecnico a Favor",                     tipo: "activo", nivel: 4, imputable: true },
  { code: "114305", name: "IVA Saldo Libre Disponibilidad",                tipo: "activo", nivel: 4, imputable: true },
  { code: "114401", name: "Saldo a Favor Ganancias",                       tipo: "activo", nivel: 4, imputable: true },
  { code: "114402", name: "Anticipos de Ganancias",                        tipo: "activo", nivel: 4, imputable: true },
  { code: "114403", name: "Retenciones de Ganancias",                      tipo: "activo", nivel: 4, imputable: true },
  { code: "114404", name: "Percepciones de Ganancias",                     tipo: "activo", nivel: 4, imputable: true },
  { code: "114405", name: "Impuesto al debito y credito Bancario",         tipo: "activo", nivel: 4, imputable: true },
  { code: "114406", name: "Credito Impuesto Diferido",                     tipo: "activo", nivel: 4, imputable: true },
  { code: "115",    name: "Bienes de Cambio",                              tipo: "activo", nivel: 3 },
  { code: "115100", name: "Materias Primas",                               tipo: "activo", nivel: 4, imputable: true },
  { code: "115101", name: "Productos en Proceso",                          tipo: "activo", nivel: 4, imputable: true },
  { code: "115102", name: "Productos Terminados",                          tipo: "activo", nivel: 4, imputable: true },
  { code: "115103", name: "Mercanderias",                                  tipo: "activo", nivel: 4, imputable: true },
  { code: "115200", name: "Anticipos a Proveedores",                       tipo: "activo", nivel: 4, imputable: true },
  { code: "12",     name: "Activo No Corriente",                           tipo: "activo", nivel: 2 },
  { code: "125",    name: "Bienes de Uso",                                 tipo: "activo", nivel: 3 },
  { code: "125100", name: "Maquinarias",                                   tipo: "activo", nivel: 4, imputable: true },
  { code: "125200", name: "Amortizacion Acumulada Maquinarias",            tipo: "activo", nivel: 4, imputable: true },
  { code: "126",    name: "Activos Intangibles",                           tipo: "activo", nivel: 3 },
  { code: "126100", name: "Gastos de Organizacion",                        tipo: "activo", nivel: 4, imputable: true },
  { code: "126200", name: "Amortizacion Acumulada Gastos de Organizacion", tipo: "activo", nivel: 4, imputable: true },
  { code: "127",    name: "Otros Creditos No Corriente",                   tipo: "activo", nivel: 3 },
  { code: "127100", name: "Deposito Alquiler",                             tipo: "activo", nivel: 4, imputable: true },
  { code: "127200", name: "Quebrantos",                                    tipo: "activo", nivel: 4, imputable: true },
  { code: "128",    name: "Regularizadoras del Activo",                    tipo: "activo", nivel: 3 },
  { code: "128100", name: "Intereses Positivos a Devengar",                tipo: "activo", nivel: 4, imputable: true },
  // PASIVO
  { code: "2",      name: "Pasivo",                                        tipo: "pasivo", nivel: 1 },
  { code: "21",     name: "Pasivo Corriente",                              tipo: "pasivo", nivel: 2 },
  { code: "211",    name: "Deudas Comerciales",                            tipo: "pasivo", nivel: 3 },
  { code: "211100", name: "Proveedores",                                   tipo: "pasivo", nivel: 4, imputable: true },
  { code: "211200", name: "Acreedores Varios",                             tipo: "pasivo", nivel: 4, imputable: true },
  { code: "211300", name: "Provisiones",                                   tipo: "pasivo", nivel: 4, imputable: true },
  { code: "211400", name: "Cheques Diferidos no debitados",                tipo: "pasivo", nivel: 4, imputable: true },
  { code: "211500", name: "Anticipo de Clientes",                          tipo: "pasivo", nivel: 4, imputable: true },
  { code: "212",    name: "Deudas Financieras",                            tipo: "pasivo", nivel: 3 },
  { code: "212100", name: "Prestamo Banco a pagar",                        tipo: "pasivo", nivel: 4, imputable: true },
  { code: "213",    name: "Deudas Sociales",                               tipo: "pasivo", nivel: 3 },
  { code: "213100", name: "Remuneraciones a Pagar",                        tipo: "pasivo", nivel: 4, imputable: true },
  { code: "213200", name: "Cargas Sociales a pagar",                       tipo: "pasivo", nivel: 4, imputable: true },
  { code: "213300", name: "Sindicatos a Pagar",                            tipo: "pasivo", nivel: 4, imputable: true },
  { code: "213400", name: "Retenciones Sufridas SUSS",                     tipo: "pasivo", nivel: 4, imputable: true },
  { code: "214",    name: "Deudas Fiscales",                               tipo: "pasivo", nivel: 3 },
  { code: "214100", name: "IVA a Pagar DDJJ",                              tipo: "pasivo", nivel: 4, imputable: true },
  { code: "214101", name: "IVA Debito Fiscal",                             tipo: "pasivo", nivel: 4, imputable: true },
  { code: "214200", name: "Impuesto a las Ganancias a pagar",              tipo: "pasivo", nivel: 4, imputable: true },
  { code: "214300", name: "Impuesto a los IIBB a pagar CABA",              tipo: "pasivo", nivel: 4, imputable: true },
  { code: "214301", name: "Impuesto a los IIBB a pagar BS.AS",             tipo: "pasivo", nivel: 4, imputable: true },
  { code: "214400", name: "Tasa de Seguridad e Higiene a Pagar",           tipo: "pasivo", nivel: 4, imputable: true },
  { code: "215",    name: "Otras Deudas",                                  tipo: "pasivo", nivel: 3 },
  { code: "215100", name: "Alquileres a Pagar",                            tipo: "pasivo", nivel: 4, imputable: true },
  { code: "215200", name: "Servicios a Pagar",                             tipo: "pasivo", nivel: 4, imputable: true },
  { code: "215300", name: "Honorarios a pagar",                            tipo: "pasivo", nivel: 4, imputable: true },
  { code: "215400", name: "Acreedores Varios",                             tipo: "pasivo", nivel: 4, imputable: true },
  { code: "216",    name: "Regularizadoras del Pasivo",                    tipo: "pasivo", nivel: 3 },
  { code: "216100", name: "Intereses Negativos a Devengar",                tipo: "pasivo", nivel: 4, imputable: true },
  // PATRIMONIO NETO
  { code: "3",      name: "Patrimonio Neto",                               tipo: "pn",     nivel: 1 },
  { code: "310100", name: "Acciones a emitir",                             tipo: "pn",     nivel: 4, imputable: true },
  { code: "310101", name: "Acciones en circulacion",                       tipo: "pn",     nivel: 4, imputable: true },
  { code: "311100", name: "Ajuste de Capital",                             tipo: "pn",     nivel: 4, imputable: true },
  { code: "320100", name: "Reserva Legal",                                 tipo: "pn",     nivel: 4, imputable: true },
  { code: "320102", name: "Reserva Estatutaria",                           tipo: "pn",     nivel: 4, imputable: true },
  { code: "320103", name: "Reserva Facultativa",                           tipo: "pn",     nivel: 4, imputable: true },
  { code: "330100", name: "Resultados No Asignados",                       tipo: "pn",     nivel: 4, imputable: true },
  { code: "330101", name: "Resultado del Ejercicio",                       tipo: "pn",     nivel: 4, imputable: true },
  // INGRESOS
  { code: "4",      name: "Ingresos",                                      tipo: "ingreso",nivel: 1 },
  { code: "410100", name: "Ventas",                                        tipo: "ingreso",nivel: 4, imputable: true },
  // EGRESOS
  { code: "5",      name: "Egresos",                                       tipo: "egreso", nivel: 1 },
  { code: "511100", name: "Costo de Mercaderia Vendida",                   tipo: "egreso", nivel: 4, imputable: true },
  { code: "521100", name: "Sueldos de produccion",                         tipo: "egreso", nivel: 4, imputable: true },
  { code: "521101", name: "Sueldos de administracion",                     tipo: "egreso", nivel: 4, imputable: true },
  { code: "521102", name: "Cargas Sociales de produccion",                 tipo: "egreso", nivel: 4, imputable: true },
  { code: "521103", name: "Cargas Sociales de administracion",             tipo: "egreso", nivel: 4, imputable: true },
  { code: "521104", name: "Sindicatos",                                    tipo: "egreso", nivel: 4, imputable: true },
  { code: "521105", name: "Honorarios Contables",                          tipo: "egreso", nivel: 4, imputable: true },
  { code: "521106", name: "Honorarios",                                    tipo: "egreso", nivel: 4, imputable: true },
  { code: "521107", name: "Alquileres",                                    tipo: "egreso", nivel: 4, imputable: true },
  { code: "521108", name: "Agua",                                          tipo: "egreso", nivel: 4, imputable: true },
  { code: "521109", name: "Energia Electrica",                             tipo: "egreso", nivel: 4, imputable: true },
  { code: "521110", name: "Limpieza",                                      tipo: "egreso", nivel: 4, imputable: true },
  { code: "521111", name: "Gastos Generales",                              tipo: "egreso", nivel: 4, imputable: true },
  { code: "521112", name: "Gastos de Fabrica",                             tipo: "egreso", nivel: 4, imputable: true },
  { code: "521113", name: "Gastos Bancarios",                              tipo: "egreso", nivel: 4, imputable: true },
  { code: "521114", name: "Impuestos Deb/Cred CtaCte",                     tipo: "egreso", nivel: 4, imputable: true },
  { code: "521115", name: "Amortizacion Gastos de Organizacion",           tipo: "egreso", nivel: 4, imputable: true },
  { code: "521116", name: "Amortizacion Maquinarias",                      tipo: "egreso", nivel: 4, imputable: true },
  { code: "521200", name: "Ingresos Brutos",                               tipo: "egreso", nivel: 4, imputable: true },
  { code: "521201", name: "Tasa Seguridad y Higiene",                      tipo: "egreso", nivel: 4, imputable: true },
  { code: "521202", name: "Impuesto al Sello",                             tipo: "egreso", nivel: 4, imputable: true },
  { code: "521203", name: "Impuestos y Tasas",                             tipo: "egreso", nivel: 4, imputable: true },
  { code: "53",     name: "Impuestos a las Ganancias",                     tipo: "egreso", nivel: 2 },
  { code: "530100", name: "Impuesto a las Ganancias",                      tipo: "egreso", nivel: 4, imputable: true },
  { code: "54",     name: "Otros Resultados",                              tipo: "egreso", nivel: 2 },
  { code: "541001", name: "Intereses Negativos",                           tipo: "egreso", nivel: 4, imputable: true },
  { code: "541002", name: "Intereses Positivos",                           tipo: "ingreso",nivel: 4, imputable: true },
  { code: "541003", name: "R.F.G.A.",                                      tipo: "egreso", nivel: 4, imputable: true },
  { code: "541004", name: "R.F.G.P.",                                      tipo: "egreso", nivel: 4, imputable: true },
  { code: "551001", name: "RECPAM",                                        tipo: "egreso", nivel: 4, imputable: true },
];

// Calcula el saldo de una cuenta a partir de sus movimientos
// Activo/Egreso → saldo = debe - haber (deudora)
// Pasivo/PN/Ingreso → saldo = haber - debe (acreedora)
function saldoCuenta(code, movimientos) {
  const debe = movimientos.filter(m => m.debe === code).reduce((s, m) => s + m.importe, 0);
  const haber = movimientos.filter(m => m.haber === code).reduce((s, m) => s + m.importe, 0);
  const acc = PLAN_CUENTAS.find(a => a.code === code);
  if (!acc) return debe - haber;
  return (acc.tipo === "activo" || acc.tipo === "egreso") ? debe - haber : haber - debe;
}

// Genera asientos automáticos a partir de los datos del sistema
function generarAsientosAuto(saleInvoices, purchaseInvoices, products, cheques = []) {
  const asientos = [];
  // Facturas de venta
  (saleInvoices || []).filter(i => i.type === "factura").forEach(inv => {
    const totalIva = (inv.lines || []).reduce((s, l) => {
      const prod = products.find(p => p.id === l.productId);
      return s + l.subtotal * (prod?.iva ?? 21) / 100;
    }, 0);
    const neto = inv.total;
    const totalConIva = neto + totalIva;
    // Emisión: DB Deudores / CR Ventas + IVA Débito
    asientos.push({
      id: `auto-vta-${inv.id}`,
      fecha: inv.date,
      glosa: `Factura venta ${docRef(inv)} — ${inv.clientName}`,
      lineas: [
        { cuenta: "113100", debe: totalConIva, haber: 0 },
        { cuenta: "410100", debe: 0, haber: neto },
        { cuenta: "214101", debe: 0, haber: totalIva },
      ],
      origen: "sistema"
    });
    // Cobro: DB Caja (+retenciones activo) / CR Deudores
    if (inv.status === "cobrada") {
      const ret = inv.retenciones || {};
      const totalRet = (ret.iibbCaba || 0) + (ret.iibbBsAs || 0) + (ret.ganancias || 0) + (ret.ivaRet || 0) + (ret.suss || 0);
      const cajaMonto = totalConIva - totalRet;
      const lineasCobro = [
        { cuenta: "111100", debe: cajaMonto, haber: 0 },
        ...(ret.iibbCaba > 0 ? [{ cuenta: "114203", debe: ret.iibbCaba, haber: 0 }] : []),
        ...(ret.iibbBsAs > 0 ? [{ cuenta: "114205", debe: ret.iibbBsAs, haber: 0 }] : []),
        ...(ret.ganancias > 0 ? [{ cuenta: "114403", debe: ret.ganancias, haber: 0 }] : []),
        ...(ret.ivaRet > 0 ? [{ cuenta: "114302", debe: ret.ivaRet, haber: 0 }] : []),
        ...(ret.suss > 0 ? [{ cuenta: "213400", debe: ret.suss, haber: 0 }] : []),
        { cuenta: "113100", debe: 0, haber: totalConIva },
      ];
      asientos.push({
        id: `auto-cobro-${inv.id}`,
        fecha: inv.date,
        glosa: `Cobro factura ${docRef(inv)} — ${inv.clientName}`,
        lineas: lineasCobro,
        origen: "sistema"
      });
    }
  });
  // Facturas de compra
  (purchaseInvoices || []).forEach(inv => {
    const totalIva = (inv.lines || []).reduce((s, l) => {
      const prod = products.find(p => p.id === l.productId);
      return s + (l.subtotal || 0) * (prod?.iva ?? 21) / 100;
    }, 0);
    const neto = inv.total; // ya incluye percepciones (sumadas en PurchaseBuilder)
    // Recepción: DB Mercaderías + IVA Crédito + Percepciones IIBB / CR Proveedores
    const perc = inv.percepciones || {};
    const totalPerc = (perc.iibbCaba || 0) + (perc.iibbBsAs || 0);
    const netoSinPerc = neto - totalPerc;
    const lineasCmp = [
      { cuenta: "115103", debe: netoSinPerc, haber: 0 },
      { cuenta: "114301", debe: totalIva, haber: 0 },
      ...(perc.iibbCaba > 0 ? [{ cuenta: "114204", debe: perc.iibbCaba, haber: 0 }] : []),
      ...(perc.iibbBsAs > 0 ? [{ cuenta: "114206", debe: perc.iibbBsAs, haber: 0 }] : []),
      { cuenta: "211100", debe: 0, haber: neto + totalIva },
    ];
    asientos.push({
      id: `auto-cmp-${inv.id}`,
      fecha: inv.date,
      glosa: `Factura compra ${docRef(inv)} — ${inv.supplierName || "Proveedor"}`,
      lineas: lineasCmp,
      origen: "sistema"
    });
    // Pago
    if (inv.status === "pagada") {
      asientos.push({
        id: `auto-pago-${inv.id}`,
        fecha: inv.dueDate || inv.date,
        glosa: `Pago factura compra ${docRef(inv)} — ${inv.supplierName || "Proveedor"}`,
        lineas: [
          { cuenta: "211100", debe: neto + totalIva, haber: 0 },
          { cuenta: "111100", debe: 0, haber: neto + totalIva },
        ],
        origen: "sistema"
      });
    }
  });
  // Cheques a cobrar pendientes → Valores a Depositar (113200)
  // Cada cheque pendiente reclasifica el dinero de Caja (111100) a Valores a Depositar (113200)
  // Cuando el cheque se marca cobrado, la reclasificación desaparece y el saldo queda en 111100
  (cheques || []).filter(c => c.tipo === "cobrar" && c.estado === "pendiente").forEach(ch => {
    const fecha = (ch.fechaPago || ch.fechaVencimiento || new Date().toISOString().slice(0, 10));
    asientos.push({
      id: `auto-chq-${ch.id}`,
      fecha,
      glosa: `Cheque a cobrar N°${ch.numero} — ${ch.emisor || ""} (pendiente depósito)`,
      lineas: [
        { cuenta: "113200", debe: ch.monto || 0, haber: 0 },
        { cuenta: "111100", debe: 0, haber: ch.monto || 0 },
      ],
      origen: "sistema"
    });
  });
  return asientos.sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
}

// Expande asientos en movimientos planos cuenta/debe/haber para cálculo de saldos
function asientosAMovimientos(asientos) {
  const movs = [];
  asientos.forEach(a => {
    (a.lineas || []).forEach(l => {
      if (!l || typeof l !== "object") return;
      if (l.debe > 0)  movs.push({ debe: l.cuenta, haber: null,    importe: l.debe,  fecha: a.fecha });
      if (l.haber > 0) movs.push({ debe: null,    haber: l.cuenta, importe: l.haber, fecha: a.fecha });
    });
  });
  return movs;
}

function ContabilidadModule({ saleInvoices, purchaseInvoices, products, cheques, companyId }) {
  // ── Estado principal ──────────────────────────────────────────────────────
  const [tab, setTab] = useState("plan");

  // Configuración de cuentas: mods = { [code]: { name?, inactiva? } }, custom = [{ code, name, tipo, nivel }]
  const [cuentasConfig, setCuentasConfig] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`nexopyme_cuentas_${companyId}`) || '{"mods":{},"custom":[]}'); }
    catch { return { mods: {}, custom: [] }; }
  });
  const saveCuentasConfig = (cfg) => {
    setCuentasConfig(cfg);
    localStorage.setItem(`nexopyme_cuentas_${companyId}`, JSON.stringify(cfg));
  };

  // Asientos manuales
  const [manualEntries, setManualEntries] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`nexopyme_asientos_${companyId}`) || "[]"); } catch { return []; }
  });
  const saveManual = (entries) => {
    setManualEntries(entries);
    localStorage.setItem(`nexopyme_asientos_${companyId}`, JSON.stringify(entries));
  };

  // Filtros Plan de Cuentas
  const [filterTipo, setFilterTipo] = useState("todas");
  const [searchCuenta, setSearchCuenta] = useState("");
  const [mostrarInactivas, setMostrarInactivas] = useState(false);

  // Edición de cuenta
  const [editandoCuenta, setEditandoCuenta] = useState(null); // { code, name, tipo, nivel, imputable, esCustom }
  const [editForm, setEditForm] = useState({ name: "", code: "" });

  // Nueva cuenta
  const [showNuevaCuenta, setShowNuevaCuenta] = useState(false);
  const [nuevaCuentaForm, setNuevaCuentaForm] = useState({ code: "", name: "", tipo: "activo" });
  const [nuevaCuentaError, setNuevaCuentaError] = useState("");

  // Asientos manuales
  const [showNewAsiento, setShowNewAsiento] = useState(false);
  const [newAsiento, setNewAsiento] = useState({ fecha: new Date().toISOString().slice(0, 10), glosa: "", lineas: [{ cuenta: "", debe: "", haber: "" }, { cuenta: "", debe: "", haber: "" }] });
  const [asientoError, setAsientoError] = useState("");

  // Período
  const [periodoFrom, setPeriodoFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [periodoTo, setPeriodoTo] = useState(new Date().toISOString().slice(0, 10));

  // Extracto
  const [extractoCuentas, setExtractoCuentas] = useState([]);
  const [extractoFrom, setExtractoFrom] = useState(new Date().toISOString().slice(0, 7) + "-01");
  const [extractoTo, setExtractoTo] = useState(new Date().toISOString().slice(0, 10));
  const [searchExtractoCuenta, setSearchExtractoCuenta] = useState("");

  // ── Plan de cuentas vigente (base + mods + custom, sin inactivas por defecto) ──
  const planVigente = [
    ...PLAN_CUENTAS.map(a => ({
      ...a,
      name: cuentasConfig.mods[a.code]?.name ?? a.name,
      code: cuentasConfig.mods[a.code]?.code ?? a.code,
      inactiva: cuentasConfig.mods[a.code]?.inactiva ?? false,
      esCustom: false,
    })),
    ...cuentasConfig.custom.map(a => ({ ...a, imputable: true, esCustom: true, inactiva: cuentasConfig.mods[a.code]?.inactiva ?? false })),
  ];

  const planActivo = planVigente.filter(a => !a.inactiva);
  const cuentasImputables = planActivo.filter(a => a.imputable);

  // ── Cálculo de saldos ────────────────────────────────────────────────────
  const asientosAuto = (() => { try { return generarAsientosAuto(saleInvoices, purchaseInvoices, products, cheques); } catch(e) { console.error("Error generando asientos:", e); return []; } })();
  const manualesValidos = (manualEntries || []).filter(a => a && typeof a === "object" && Array.isArray(a.lineas));
  const todosAsientos = [...asientosAuto, ...manualesValidos].sort((a, b) => (a.fecha || "").localeCompare(b.fecha || ""));
  const movimientos = asientosAMovimientos(todosAsientos);

  const getSaldo = (code) => saldoCuenta(code, movimientos);
  const getSaldoGrupo = (prefijo) => planActivo.filter(a => a.imputable && a.code.startsWith(prefijo)).reduce((s, a) => s + getSaldo(a.code), 0);

  // IVA y IIBB
  const ivaDebito  = Math.abs(getSaldo("214101"));
  const ivaCredito = Math.abs(getSaldo("114301"));
  const ivaNeto    = ivaDebito - ivaCredito;
  const iibbPagar  = getSaldo("214300") + getSaldo("214301");
  const iibbAFavor = getSaldo("114201") + getSaldo("114202") + getSaldo("114203") + getSaldo("114204") + getSaldo("114205") + getSaldo("114206");

  const fmtN = (n) => `$${Math.abs(n).toLocaleString("es-AR")}`;

  // Período
  const asientosPeriodo = todosAsientos.filter(a => a.fecha >= periodoFrom && a.fecha <= periodoTo);

  const tipoColor = { activo: T.blue, pasivo: T.red, pn: T.accent, ingreso: "#10b981", egreso: "#f59e0b" };
  const tipoLabel = { activo: "Activo", pasivo: "Pasivo", pn: "Patrimonio Neto", ingreso: "Ingresos", egreso: "Egresos" };

  // ── Editar cuenta ─────────────────────────────────────────────────────────
  const abrirEdicion = (acc) => {
    setEditandoCuenta(acc);
    setEditForm({ name: acc.name, code: acc.code });
  };
  const guardarEdicion = () => {
    if (!editForm.name.trim()) return;
    const mods = { ...cuentasConfig.mods };
    const originalCode = editandoCuenta.esCustom ? editandoCuenta.code : editandoCuenta.code;
    mods[editandoCuenta.code] = { ...(mods[editandoCuenta.code] || {}), name: editForm.name.trim() };
    // Si se cambió el código en una cuenta custom, actualizamos el array
    let custom = cuentasConfig.custom;
    if (editandoCuenta.esCustom && editForm.code !== editandoCuenta.code) {
      custom = custom.map(c => c.code === editandoCuenta.code ? { ...c, code: editForm.code, name: editForm.name.trim() } : c);
      delete mods[editandoCuenta.code];
    }
    saveCuentasConfig({ ...cuentasConfig, mods, custom });
    setEditandoCuenta(null);
  };
  const toggleInactiva = (acc) => {
    const mods = { ...cuentasConfig.mods };
    mods[acc.code] = { ...(mods[acc.code] || {}), inactiva: !acc.inactiva };
    saveCuentasConfig({ ...cuentasConfig, mods });
  };

  // ── Nueva cuenta ──────────────────────────────────────────────────────────
  const guardarNuevaCuenta = () => {
    setNuevaCuentaError("");
    const code = nuevaCuentaForm.code.trim();
    const name = nuevaCuentaForm.name.trim();
    if (!code || !name) { setNuevaCuentaError("El código y nombre son obligatorios"); return; }
    if (planVigente.some(a => a.code === code)) { setNuevaCuentaError("Ya existe una cuenta con ese código"); return; }
    const nueva = { code, name, tipo: nuevaCuentaForm.tipo, nivel: 4, imputable: true };
    saveCuentasConfig({ ...cuentasConfig, custom: [...cuentasConfig.custom, nueva] });
    setShowNuevaCuenta(false);
    setNuevaCuentaForm({ code: "", name: "", tipo: "activo" });
  };

  const eliminarCustom = (code) => {
    if (!window.confirm("¿Eliminar esta cuenta personalizada?")) return;
    const custom = cuentasConfig.custom.filter(c => c.code !== code);
    const mods = { ...cuentasConfig.mods };
    delete mods[code];
    saveCuentasConfig({ ...cuentasConfig, custom, mods });
  };

  // ── Guardar asiento manual ────────────────────────────────────────────────
  const handleGuardarAsiento = () => {
    setAsientoError("");
    if (!newAsiento.fecha || !newAsiento.glosa.trim()) { setAsientoError("Completá fecha y descripción"); return; }
    const lineasValidas = newAsiento.lineas.filter(l => l.cuenta && (parseFloat(l.debe) > 0 || parseFloat(l.haber) > 0));
    if (lineasValidas.length < 2) { setAsientoError("El asiento necesita al menos 2 líneas con importes"); return; }
    const totalDebe  = lineasValidas.reduce((s, l) => s + (parseFloat(l.debe) || 0), 0);
    const totalHaber = lineasValidas.reduce((s, l) => s + (parseFloat(l.haber) || 0), 0);
    if (Math.abs(totalDebe - totalHaber) > 0.01) { setAsientoError(`No balancea: Debe ${fmtN(totalDebe)} ≠ Haber ${fmtN(totalHaber)}`); return; }
    const asiento = {
      id: `manual-${Date.now()}`,
      fecha: newAsiento.fecha,
      glosa: newAsiento.glosa.trim(),
      lineas: lineasValidas.map(l => ({ cuenta: l.cuenta, debe: parseFloat(l.debe) || 0, haber: parseFloat(l.haber) || 0 })),
      origen: "manual"
    };
    saveManual([...manualEntries, asiento]);
    setShowNewAsiento(false);
    setNewAsiento({ fecha: new Date().toISOString().slice(0, 10), glosa: "", lineas: [{ cuenta: "", debe: "", haber: "" }, { cuenta: "", debe: "", haber: "" }] });
  };
  const eliminarManual = (id) => {
    if (!window.confirm("¿Eliminar este asiento manual?")) return;
    saveManual(manualEntries.filter(a => a.id !== id));
  };

  // ── Exports ───────────────────────────────────────────────────────────────
  const exportLibroDiario = () => {
    const rows = [["Fecha", "N°", "Descripción", "Cuenta", "Nombre Cuenta", "Debe", "Haber"]];
    asientosPeriodo.forEach((a, idx) => {
      a.lineas.forEach((l, li) => {
        const acc = planVigente.find(x => x.code === l.cuenta);
        rows.push([li === 0 ? a.fecha : "", li === 0 ? (idx + 1) : "", li === 0 ? a.glosa : "", l.cuenta, acc?.name || "", l.debe || "", l.haber || ""]);
      });
      rows.push(["", "", "", "", "", "", ""]);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Libro Diario");
    XLSX.writeFile(wb, `LibroDiario_${periodoFrom}_${periodoTo}.xlsx`);
  };

  const exportPlanCuentas = () => {
    const rows = [["Código", "Nombre", "Tipo", "Activa", "Saldo"]];
    planVigente.forEach(a => {
      const saldo = a.imputable ? getSaldo(a.code) : getSaldoGrupo(a.code);
      rows.push([a.code, a.name, tipoLabel[a.tipo] || a.tipo, a.inactiva ? "No" : "Sí", saldo]);
    });
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, "Plan de Cuentas");
    XLSX.writeFile(wb, "PlanDeCuentas.xlsx");
  };

  // ── Extracto por cuenta ───────────────────────────────────────────────────
  const toggleExtractoCuenta = (code) => {
    setExtractoCuentas(prev => prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]);
  };

  const getExtracto = (code) => {
    const acc = planVigente.find(a => a.code === code);
    const esDeudora = acc?.tipo === "activo" || acc?.tipo === "egreso";
    const asientosFiltrados = todosAsientos.filter(a => a.fecha >= extractoFrom && a.fecha <= extractoTo && (a.lineas || []).some(l => l && l.cuenta === code));
    let saldoAcum = 0;
    const rows = [];
    asientosFiltrados.forEach(a => {
      const lineasCuenta = a.lineas.filter(l => l.cuenta === code);
      lineasCuenta.forEach(l => {
        const debe = l.debe || 0;
        const haber = l.haber || 0;
        saldoAcum += esDeudora ? (debe - haber) : (haber - debe);
        rows.push({ fecha: a.fecha, glosa: a.glosa, debe, haber, saldo: saldoAcum, origen: a.origen });
      });
    });
    return rows;
  };

  const exportExtracto = () => {
    if (extractoCuentas.length === 0) return;
    const wb = XLSX.utils.book_new();
    extractoCuentas.forEach(code => {
      const acc = planVigente.find(a => a.code === code);
      const rows = getExtracto(code);
      const data = [
        [`Extracto de cuenta: ${code} — ${acc?.name || ""}`, "", "", "", ""],
        [`Período: ${extractoFrom} al ${extractoTo}`, "", "", "", ""],
        [""],
        ["Fecha", "Descripción", "Debe", "Haber", "Saldo"],
        ...rows.map(r => [r.fecha, r.glosa, r.debe || "", r.haber || "", r.saldo]),
      ];
      const ws = XLSX.utils.aoa_to_sheet(data);
      const sheetName = `${code}`.slice(0, 31);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
    XLSX.writeFile(wb, `Extracto_${extractoFrom}_${extractoTo}.xlsx`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  const inpStyle = { width: "100%", padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Contabilidad</div>
          <div style={{ fontSize: 13, color: T.muted }}>Plan de cuentas, libro diario y posición impositiva</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${T.border}` }}>
        {[["plan","Plan de Cuentas"], ["diario","Libro Diario"], ["manual","Asientos Manuales"], ["extracto","Extracto"], ["impuestos","Posición Impositiva"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ padding: "10px 18px", border: "none", borderBottom: `3px solid ${tab === v ? T.accent : "transparent"}`, background: "transparent", color: tab === v ? T.accent : T.muted, fontWeight: tab === v ? 700 : 500, fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginBottom: -1 }}>{l}</button>
        ))}
      </div>

      {/* ── PLAN DE CUENTAS ── */}
      {tab === "plan" && (
        <div>
          {/* Toolbar */}
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
            <input value={searchCuenta} onChange={e => setSearchCuenta(e.target.value)} placeholder="Buscar por código o nombre..." style={{ padding: "9px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none", width: 240 }} />
            {["todas","activo","pasivo","pn","ingreso","egreso"].map(v => (
              <button key={v} onClick={() => setFilterTipo(v)} style={{ padding: "7px 12px", borderRadius: 20, border: `1px solid ${filterTipo === v ? T.accent : T.border}`, background: filterTipo === v ? T.accentLight : "transparent", color: filterTipo === v ? T.accent : T.muted, fontSize: 12, fontWeight: filterTipo === v ? 700 : 500, cursor: "pointer", fontFamily: "inherit" }}>
                {v === "todas" ? "Todas" : tipoLabel[v]}
              </button>
            ))}
            <button onClick={() => setMostrarInactivas(v => !v)} style={{ padding: "7px 12px", borderRadius: 20, border: `1px solid ${mostrarInactivas ? T.accent : T.border}`, background: mostrarInactivas ? T.accentLight : "transparent", color: mostrarInactivas ? T.accent : T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
              {mostrarInactivas ? "Ocultar inactivas" : "Mostrar inactivas"}
            </button>
            <button onClick={() => setShowNuevaCuenta(true)} style={{ marginLeft: "auto", padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.accent}`, background: T.accentLight, color: T.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>+ Nueva cuenta</button>
            <button onClick={exportPlanCuentas} style={{ padding: "8px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>⬇ Excel</button>
          </div>

          {/* Info asientos automáticos */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 12, color: T.muted, lineHeight: 1.8 }}>
            <strong style={{ color: T.ink }}>Cuentas actualizadas automáticamente desde el sistema:</strong>{" "}
            <span style={{ color: T.blue, fontFamily: "monospace" }}>113100</span> Deudores (cada factura de venta emitida) ·{" "}
            <span style={{ color: T.blue, fontFamily: "monospace" }}>410100</span> Ventas (neto de cada factura) ·{" "}
            <span style={{ color: T.blue, fontFamily: "monospace" }}>214101</span> IVA Débito Fiscal (IVA de ventas calculado por alícuota de producto) ·{" "}
            <span style={{ color: T.blue, fontFamily: "monospace" }}>111100</span> Caja en pesos (facturas cobradas / compras pagadas) ·{" "}
            <span style={{ color: T.blue, fontFamily: "monospace" }}>113200</span> Valores a Depositar (<strong style={{ color: T.ink }}>cheques a cobrar pendientes del módulo Cheques</strong>) ·{" "}
            <span style={{ color: T.blue, fontFamily: "monospace" }}>115103</span> Mercaderías (neto de facturas de compra) ·{" "}
            <span style={{ color: T.blue, fontFamily: "monospace" }}>114301</span> IVA Crédito Fiscal (IVA de compras) ·{" "}
            <span style={{ color: T.blue, fontFamily: "monospace" }}>211100</span> Proveedores (facturas de compra recibidas y pagadas).{" "}
            El resto de las cuentas se nutren de los <strong>asientos manuales</strong>.
          </div>

          {/* Formulario nueva cuenta */}
          {showNuevaCuenta && (
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 10, padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>Nueva cuenta personalizada</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 12, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>CÓDIGO</label>
                  <input value={nuevaCuentaForm.code} onChange={e => setNuevaCuentaForm(f => ({ ...f, code: e.target.value }))} placeholder="ej: 521204" style={inpStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>NOMBRE</label>
                  <input value={nuevaCuentaForm.name} onChange={e => setNuevaCuentaForm(f => ({ ...f, name: e.target.value }))} placeholder="ej: Combustibles" style={inpStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>TIPO</label>
                  <select value={nuevaCuentaForm.tipo} onChange={e => setNuevaCuentaForm(f => ({ ...f, tipo: e.target.value }))} style={{ ...inpStyle, cursor: "pointer" }}>
                    {Object.entries(tipoLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              {nuevaCuentaError && <div style={{ color: T.red, fontSize: 12, marginBottom: 10 }}>{nuevaCuentaError}</div>}
              <div style={{ display: "flex", gap: 10 }}>
                <Btn v="ghost" onClick={() => { setShowNuevaCuenta(false); setNuevaCuentaError(""); }}>Cancelar</Btn>
                <Btn onClick={guardarNuevaCuenta}>Guardar cuenta</Btn>
              </div>
            </div>
          )}

          {/* Modal edición de cuenta */}
          {editandoCuenta && (
            <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 14, padding: 28, width: 420, maxWidth: "95vw" }}>
                <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Editar cuenta</div>
                <div style={{ marginBottom: 14 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>NOMBRE</label>
                  <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} style={inpStyle} />
                </div>
                {editandoCuenta.esCustom && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>CÓDIGO</label>
                    <input value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} style={inpStyle} />
                  </div>
                )}
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>
                  {editandoCuenta.esCustom ? "Podés editar nombre y código de esta cuenta personalizada." : "Solo podés editar el nombre de cuentas del plan base. El código es fijo."}
                </div>
                <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                  <Btn v="ghost" onClick={() => setEditandoCuenta(null)}>Cancelar</Btn>
                  {editandoCuenta.esCustom && <Btn v="danger" onClick={() => { setEditandoCuenta(null); eliminarCustom(editandoCuenta.code); }}>Eliminar</Btn>}
                  <Btn onClick={guardarEdicion}>Guardar</Btn>
                </div>
              </div>
            </div>
          )}

          {/* Tabla del plan */}
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: T.surface }}>
                  {["Código", "Nombre", "Tipo", "Saldo", ""].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: h === "Saldo" ? "right" : "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {planVigente
                  .filter(a => {
                    if (!mostrarInactivas && a.inactiva) return false;
                    if (filterTipo !== "todas" && a.tipo !== filterTipo) return false;
                    if (searchCuenta && !a.name.toLowerCase().includes(searchCuenta.toLowerCase()) && !a.code.includes(searchCuenta)) return false;
                    return true;
                  })
                  .map(a => {
                    const saldo = a.imputable ? getSaldo(a.code) : getSaldoGrupo(a.code);
                    const isGroup = !a.imputable;
                    return (
                      <tr key={a.code} style={{ borderTop: `1px solid ${T.border}`, background: a.inactiva ? T.surface + "40" : isGroup ? T.surface + "80" : "transparent", opacity: a.inactiva ? 0.5 : 1 }}>
                        <td style={{ padding: "9px 14px", fontFamily: "monospace", fontSize: 12, fontWeight: isGroup ? 700 : 400, color: isGroup ? T.ink : T.muted, paddingLeft: 14 + Math.min((a.nivel - 1) * 14, 56) }}>
                          {a.code}
                          {a.esCustom && <span style={{ marginLeft: 6, fontSize: 9, color: T.accent, background: T.accentLight, padding: "1px 5px", borderRadius: 6, fontWeight: 700 }}>CUSTOM</span>}
                        </td>
                        <td style={{ padding: "9px 14px", fontSize: 13, fontWeight: isGroup ? 700 : 400, color: a.inactiva ? T.muted : T.ink }}>{a.name}</td>
                        <td style={{ padding: "9px 14px" }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: tipoColor[a.tipo] || T.muted, background: (tipoColor[a.tipo] || T.muted) + "20", padding: "2px 8px", borderRadius: 10 }}>{tipoLabel[a.tipo] || a.tipo}</span>
                        </td>
                        <td style={{ padding: "9px 14px", textAlign: "right", fontFamily: "monospace", fontSize: 13, fontWeight: isGroup ? 700 : 400, color: saldo === 0 ? T.muted : saldo > 0 ? T.ink : T.red }}>
                          {saldo !== 0 ? fmtN(saldo) : "—"}
                        </td>
                        <td style={{ padding: "9px 14px", whiteSpace: "nowrap" }}>
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => abrirEdicion(a)} style={{ background: "none", border: `1px solid ${T.border}`, borderRadius: 6, color: T.muted, cursor: "pointer", fontSize: 11, padding: "3px 8px", fontFamily: "inherit" }}>✏ Editar</button>
                            <button onClick={() => toggleInactiva(a)} style={{ background: "none", border: `1px solid ${a.inactiva ? T.accent : T.border}`, borderRadius: 6, color: a.inactiva ? T.accent : T.muted, cursor: "pointer", fontSize: 11, padding: "3px 8px", fontFamily: "inherit" }}>
                              {a.inactiva ? "✓ Activar" : "Desactivar"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LIBRO DIARIO ── */}
      {tab === "diario" && (
        <div>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>DESDE</label>
              <input type="date" value={periodoFrom} onChange={e => setPeriodoFrom(e.target.value)} style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>HASTA</label>
              <input type="date" value={periodoTo} onChange={e => setPeriodoTo(e.target.value)} style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
            </div>
            <div style={{ alignSelf: "flex-end" }}>
              <QuickDateFilter setFrom={setPeriodoFrom} setTo={setPeriodoTo} />
            </div>
            <button onClick={exportLibroDiario} style={{ padding: "9px 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit", alignSelf: "flex-end" }}>⬇ Excel</button>
            <span style={{ alignSelf: "flex-end", fontSize: 12, color: T.muted }}>{asientosPeriodo.length} asientos</span>
          </div>
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, overflow: "hidden" }}>
            {asientosPeriodo.length === 0
              ? <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13 }}>No hay asientos en el período seleccionado</div>
              : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: T.surface }}>
                      {["Fecha", "Descripción / Cuenta", "Debe", "Haber"].map(h => <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {asientosPeriodo.map((a) => (
                      <React.Fragment key={a.id}>
                        <tr style={{ borderTop: `2px solid ${T.border}`, background: T.surface + "80" }}>
                          <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 12, color: T.blue }}>{a.fecha}</td>
                          <td colSpan={3} style={{ padding: "8px 14px", fontSize: 13, fontWeight: 700, color: T.ink }}>
                            {a.glosa}
                            {a.origen === "manual" && <span style={{ marginLeft: 8, fontSize: 10, color: T.accent, background: T.accentLight, padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>MANUAL</span>}
                          </td>
                        </tr>
                        {(a.lineas || []).map((l, li) => {
                          const acc = planVigente.find(x => x.code === l.cuenta);
                          return (
                            <tr key={li} style={{ borderTop: `1px solid ${T.border}` }}>
                              <td style={{ padding: "7px 14px" }} />
                              <td style={{ padding: "7px 14px", fontSize: 12, color: T.muted }}>
                                <span style={{ fontFamily: "monospace", color: T.blue, marginRight: 8 }}>{l.cuenta}</span>{acc?.name || "—"}
                              </td>
                              <td style={{ padding: "7px 14px", fontFamily: "monospace", fontSize: 12, textAlign: "right", color: l.debe > 0 ? T.ink : "transparent" }}>{l.debe > 0 ? fmtN(l.debe) : "—"}</td>
                              <td style={{ padding: "7px 14px", fontFamily: "monospace", fontSize: 12, textAlign: "right", color: l.haber > 0 ? T.ink : "transparent" }}>{l.haber > 0 ? fmtN(l.haber) : "—"}</td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      )}

      {/* ── ASIENTOS MANUALES ── */}
      {tab === "manual" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: T.muted }}>{manualEntries.length} asientos manuales cargados</div>
            <Btn onClick={() => { setShowNewAsiento(true); setAsientoError(""); }}>+ Nuevo asiento</Btn>
          </div>

          {showNewAsiento && (
            <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 20 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Nuevo asiento contable</div>
              <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>FECHA</label>
                  <input type="date" value={newAsiento.fecha} onChange={e => setNewAsiento(a => ({ ...a, fecha: e.target.value }))} style={inpStyle} />
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>DESCRIPCIÓN / GLOSA</label>
                  <input value={newAsiento.glosa} onChange={e => setNewAsiento(a => ({ ...a, glosa: e.target.value }))} placeholder="ej: Pago alquiler mes de abril" style={inpStyle} />
                </div>
              </div>
              <div style={{ background: T.surface, borderRadius: 8, padding: 16, marginBottom: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr 1fr auto", gap: 8, marginBottom: 8 }}>
                  {["CUENTA", "NOMBRE", "DEBE", "HABER", ""].map(h => <div key={h} style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.8 }}>{h}</div>)}
                </div>
                {newAsiento.lineas.map((l, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 3fr 1fr 1fr auto", gap: 8, marginBottom: 8, alignItems: "center" }}>
                    <select value={l.cuenta} onChange={e => setNewAsiento(a => { const ls = [...a.lineas]; ls[i] = { ...ls[i], cuenta: e.target.value }; return { ...a, lineas: ls }; })}
                      style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 12, fontFamily: "monospace", outline: "none" }}>
                      <option value="">Seleccionar...</option>
                      {cuentasImputables.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                    </select>
                    <div style={{ fontSize: 12, color: T.muted, padding: "8px 0" }}>{l.cuenta ? (planVigente.find(a => a.code === l.cuenta)?.name || "—") : ""}</div>
                    <input type="number" value={l.debe} onChange={e => setNewAsiento(a => { const ls = [...a.lineas]; ls[i] = { ...ls[i], debe: e.target.value, haber: e.target.value ? "" : ls[i].haber }; return { ...a, lineas: ls }; })} placeholder="0" min="0" style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", textAlign: "right" }} />
                    <input type="number" value={l.haber} onChange={e => setNewAsiento(a => { const ls = [...a.lineas]; ls[i] = { ...ls[i], haber: e.target.value, debe: e.target.value ? "" : ls[i].debe }; return { ...a, lineas: ls }; })} placeholder="0" min="0" style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "monospace", outline: "none", textAlign: "right" }} />
                    <button onClick={() => setNewAsiento(a => ({ ...a, lineas: a.lineas.filter((_, j) => j !== i) }))} disabled={newAsiento.lineas.length <= 2} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 16, padding: "4px 6px" }}>×</button>
                  </div>
                ))}
                <button onClick={() => setNewAsiento(a => ({ ...a, lineas: [...a.lineas, { cuenta: "", debe: "", haber: "" }] }))} style={{ marginTop: 4, padding: "6px 14px", border: `1px dashed ${T.border}`, borderRadius: 8, background: "transparent", color: T.muted, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>+ Agregar línea</button>
              </div>
              {(() => {
                const td = newAsiento.lineas.reduce((s, l) => s + (parseFloat(l.debe) || 0), 0);
                const th = newAsiento.lineas.reduce((s, l) => s + (parseFloat(l.haber) || 0), 0);
                const ok = Math.abs(td - th) < 0.01 && td > 0;
                return (
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 24, marginBottom: 14, fontSize: 13 }}>
                    <span style={{ color: T.muted }}>Total Debe: <strong style={{ color: T.ink, fontFamily: "monospace" }}>{fmtN(td)}</strong></span>
                    <span style={{ color: T.muted }}>Total Haber: <strong style={{ color: T.ink, fontFamily: "monospace" }}>{fmtN(th)}</strong></span>
                    <span style={{ fontWeight: 700, color: ok ? "#10b981" : T.red }}>{ok ? "✓ Balanceado" : "⚠ No balancea"}</span>
                  </div>
                );
              })()}
              {asientoError && <div style={{ padding: "8px 12px", borderRadius: 8, background: T.redLight, color: T.red, fontSize: 12, marginBottom: 14 }}>{asientoError}</div>}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Btn v="ghost" onClick={() => { setShowNewAsiento(false); setAsientoError(""); }}>Cancelar</Btn>
                <Btn onClick={handleGuardarAsiento}>Guardar asiento</Btn>
              </div>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {manualEntries.length === 0 && !showNewAsiento && (
              <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12 }}>
                No hay asientos manuales. Usá "+ Nuevo asiento" para cargar ajustes contables.
              </div>
            )}
            {[...manualEntries].reverse().map(a => (
              <div key={a.id} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 10, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <span style={{ fontFamily: "monospace", fontSize: 12, color: T.blue, marginRight: 10 }}>{a.fecha}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: T.ink }}>{a.glosa}</span>
                  </div>
                  <button onClick={() => eliminarManual(a.id)} style={{ background: "none", border: "none", color: T.red, cursor: "pointer", fontSize: 12, fontFamily: "inherit" }}>🗑 Eliminar</button>
                </div>
                <table style={{ width: "100%", fontSize: 12 }}>
                  <tbody>
                    {a.lineas.map((l, i) => {
                      const acc = planVigente.find(x => x.code === l.cuenta);
                      return (
                        <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${T.border}` : "none" }}>
                          <td style={{ padding: "5px 0", fontFamily: "monospace", color: T.blue, width: 80 }}>{l.cuenta}</td>
                          <td style={{ padding: "5px 8px", color: T.muted }}>{acc?.name || "—"}</td>
                          <td style={{ padding: "5px 0", textAlign: "right", color: T.ink, fontFamily: "monospace" }}>{l.debe > 0 ? fmtN(l.debe) : ""}</td>
                          <td style={{ padding: "5px 0 5px 16px", textAlign: "right", color: T.muted, fontFamily: "monospace" }}>{l.haber > 0 ? fmtN(l.haber) : ""}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── EXTRACTO ── */}
      {tab === "extracto" && (
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20, alignItems: "flex-start" }}>
          {/* Panel izquierdo: selección de cuentas */}
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Seleccionar cuentas</div>
            <input value={searchExtractoCuenta} onChange={e => setSearchExtractoCuenta(e.target.value)} placeholder="Buscar..." style={{ width: "100%", padding: "8px 10px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 12, fontFamily: "inherit", outline: "none", boxSizing: "border-box", marginBottom: 10 }} />
            <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
              <button onClick={() => setExtractoCuentas(cuentasImputables.map(a => a.code))} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Todas</button>
              <button onClick={() => setExtractoCuentas([])} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit" }}>Ninguna</button>
            </div>
            <div style={{ maxHeight: 420, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
              {cuentasImputables
                .filter(a => !searchExtractoCuenta || a.name.toLowerCase().includes(searchExtractoCuenta.toLowerCase()) || a.code.includes(searchExtractoCuenta))
                .map(a => (
                  <label key={a.code} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 6, cursor: "pointer", background: extractoCuentas.includes(a.code) ? T.accentLight : "transparent" }}>
                    <input type="checkbox" checked={extractoCuentas.includes(a.code)} onChange={() => toggleExtractoCuenta(a.code)} style={{ accentColor: T.accent }} />
                    <span style={{ fontFamily: "monospace", fontSize: 11, color: T.blue }}>{a.code}</span>
                    <span style={{ fontSize: 12, color: extractoCuentas.includes(a.code) ? T.ink : T.muted, flex: 1 }}>{a.name}</span>
                  </label>
                ))}
            </div>
          </div>

          {/* Panel derecho: período + extracto */}
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>DESDE</label>
                <input type="date" value={extractoFrom} onChange={e => setExtractoFrom(e.target.value)} style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 1, display: "block", marginBottom: 5 }}>HASTA</label>
                <input type="date" value={extractoTo} onChange={e => setExtractoTo(e.target.value)} style={{ padding: "9px 12px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface2, color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <QuickDateFilter setFrom={setExtractoFrom} setTo={setExtractoTo} />
              </div>
              <Btn onClick={exportExtracto} disabled={extractoCuentas.length === 0} style={{ alignSelf: "flex-end" }}>⬇ Descargar Excel ({extractoCuentas.length} {extractoCuentas.length === 1 ? "cuenta" : "cuentas"})</Btn>
            </div>

            {extractoCuentas.length === 0
              ? <div style={{ padding: 40, textAlign: "center", color: T.muted, fontSize: 13, background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12 }}>Seleccioná una o más cuentas del panel izquierdo para ver su extracto</div>
              : extractoCuentas.map(code => {
                  const acc = planVigente.find(a => a.code === code);
                  const rows = getExtracto(code);
                  const saldoFinal = rows.length > 0 ? rows[rows.length - 1].saldo : 0;
                  return (
                    <div key={code} style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 16, overflow: "hidden" }}>
                      <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontFamily: "monospace", fontSize: 13, color: T.blue, marginRight: 10 }}>{code}</span>
                          <span style={{ fontSize: 15, fontWeight: 700 }}>{acc?.name || "—"}</span>
                          <span style={{ marginLeft: 10, fontSize: 11, color: tipoColor[acc?.tipo] || T.muted, background: (tipoColor[acc?.tipo] || T.muted) + "20", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{tipoLabel[acc?.tipo] || acc?.tipo}</span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 11, color: T.muted }}>Saldo al {extractoTo}</div>
                          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: "monospace", color: saldoFinal >= 0 ? T.ink : T.red }}>{fmtN(saldoFinal)}</div>
                        </div>
                      </div>
                      {rows.length === 0
                        ? <div style={{ padding: 20, textAlign: "center", color: T.muted, fontSize: 13 }}>Sin movimientos en el período</div>
                        : (
                          <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ background: T.surface }}>
                                {["Fecha", "Descripción", "Debe", "Haber", "Saldo"].map(h => <th key={h} style={{ padding: "8px 14px", textAlign: h === "Descripción" ? "left" : "right", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}
                              </tr>
                            </thead>
                            <tbody>
                              {rows.map((r, i) => (
                                <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                                  <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 12, color: T.blue, whiteSpace: "nowrap" }}>{r.fecha}</td>
                                  <td style={{ padding: "8px 14px", fontSize: 12, color: T.muted }}>
                                    {r.glosa}
                                    {r.origen === "manual" && <span style={{ marginLeft: 6, fontSize: 10, color: T.accent, background: T.accentLight, padding: "1px 5px", borderRadius: 6, fontWeight: 700 }}>M</span>}
                                  </td>
                                  <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 12, textAlign: "right", color: r.debe > 0 ? T.ink : T.muted }}>{r.debe > 0 ? fmtN(r.debe) : "—"}</td>
                                  <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 12, textAlign: "right", color: r.haber > 0 ? T.ink : T.muted }}>{r.haber > 0 ? fmtN(r.haber) : "—"}</td>
                                  <td style={{ padding: "8px 14px", fontFamily: "monospace", fontSize: 13, textAlign: "right", fontWeight: 700, color: r.saldo >= 0 ? T.ink : T.red }}>{fmtN(r.saldo)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                    </div>
                  );
                })}
          </div>
        </div>
      )}

      {/* ── POSICIÓN IMPOSITIVA ── */}
      {tab === "impuestos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* IVA */}
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>IVA — Posición fiscal</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 20 }}>
              Calculado automáticamente desde facturas de venta y compra registradas.{" "}
              <strong>IVA Débito</strong> = IVA de cada línea de factura de venta (alícuota × neto por producto).{" "}
              <strong>IVA Crédito</strong> = ídem para facturas de compra.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 20 }}>
              <div style={{ background: T.redLight, borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: 1, marginBottom: 8 }}>IVA DÉBITO FISCAL (ventas) · Cta. 214101</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: T.red, fontFamily: "monospace" }}>{fmtN(ivaDebito)}</div>
              </div>
              <div style={{ background: T.accentLight, borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1, marginBottom: 8 }}>IVA CRÉDITO FISCAL (compras) · Cta. 114301</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: T.accent, fontFamily: "monospace" }}>{fmtN(ivaCredito)}</div>
              </div>
              <div style={{ background: ivaNeto > 0 ? T.redLight : T.surface, borderRadius: 10, padding: 18, border: `2px solid ${ivaNeto > 0 ? T.red : T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: ivaNeto > 0 ? T.red : "#10b981", letterSpacing: 1, marginBottom: 8 }}>{ivaNeto > 0 ? "IVA A INGRESAR (DDJJ)" : "SALDO A FAVOR"}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: ivaNeto > 0 ? T.red : "#10b981", fontFamily: "monospace" }}>{fmtN(Math.abs(ivaNeto))}</div>
              </div>
            </div>
            <div style={{ background: T.surface, borderRadius: 8, padding: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 1, marginBottom: 10 }}>DETALLE POR ALÍCUOTA (ventas)</div>
              {[21, 10.5, 27].map(rate => {
                const base = saleInvoices.filter(i => i.type === "factura").flatMap(i => (i.lines || []).filter(l => { const p = products.find(x => x.id === l.productId); return (p?.iva ?? 21) === rate; })).reduce((s, l) => s + l.subtotal, 0);
                const iva = base * rate / 100;
                if (base === 0) return null;
                return (
                  <div key={rate} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderTop: `1px solid ${T.border}`, fontSize: 13 }}>
                    <span style={{ color: T.muted }}>Alícuota {rate}%</span>
                    <span>Base neta: <strong style={{ color: T.ink }}>{fmtN(base)}</strong></span>
                    <span>IVA: <strong style={{ color: T.red, fontFamily: "monospace" }}>{fmtN(iva)}</strong></span>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>

          {/* IIBB */}
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Ingresos Brutos</div>
            <div style={{ fontSize: 12, color: T.muted, marginBottom: 16 }}>Posición actualizada desde asientos contables (automáticos y manuales)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ background: T.redLight, borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.red, letterSpacing: 1, marginBottom: 8 }}>IIBB A PAGAR · Ctas. 214300 + 214301</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: T.red, fontFamily: "monospace" }}>{fmtN(Math.max(0, iibbPagar))}</div>
              </div>
              <div style={{ background: T.accentLight, borderRadius: 10, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.accent, letterSpacing: 1, marginBottom: 8 }}>IIBB A FAVOR · Ctas. 114201–114206</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: T.accent, fontFamily: "monospace" }}>{fmtN(Math.abs(iibbAFavor))}</div>
              </div>
            </div>
          </div>

          {/* Otras cuentas fiscales */}
          <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24 }}>
            <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 16 }}>Otras cuentas fiscales</div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr style={{ background: T.surface }}>{["Código","Cuenta","Saldo"].map(h => <th key={h} style={{ padding: "9px 14px", textAlign: "left", fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.8 }}>{h}</th>)}</tr></thead>
              <tbody>
                {["214200","214400","114401","114402","114403","114404","114405"].map(code => {
                  const acc = planVigente.find(a => a.code === code);
                  if (!acc) return null;
                  const s = getSaldo(code);
                  return (
                    <tr key={code} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: "9px 14px", fontFamily: "monospace", fontSize: 12, color: T.blue }}>{code}</td>
                      <td style={{ padding: "9px 14px", fontSize: 13, color: T.ink }}>{acc.name}</td>
                      <td style={{ padding: "9px 14px", fontFamily: "monospace", fontSize: 13, textAlign: "right", color: s === 0 ? T.muted : T.ink }}>{s !== 0 ? fmtN(s) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── USUARIOS MODULE ──────────────────────────────────────────────────────────
const PERM_MODULES = [
  { id: "hub", label: "Inicio" }, { id: "ventas", label: "Ventas" },
  { id: "comercial", label: "Comercial" }, { id: "compras", label: "Compras" },
  { id: "caja", label: "Caja" }, { id: "cheques", label: "Cheques" },
  { id: "inventario", label: "Inventario" }, { id: "logistica", label: "Logística" },
  { id: "reportes", label: "Reportes" }, { id: "rrhh", label: "RRHH" },
  { id: "contabilidad", label: "Contabilidad" },
];

const DEFAULT_PERMS = Object.fromEntries(PERM_MODULES.map(m => [m.id, "edit"]));

function UsuariosModule({ companyId, profile }) {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ display_name: "", email: "", password: "", role: "user" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editPermsId, setEditPermsId] = useState(null);
  const [permsForm, setPermsForm] = useState({});

  useEffect(() => { loadData(); }, [companyId]);

  const loadData = async () => {
    setLoading(true);
    const [{ data: usersData }, { data: reqData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("company_id", companyId).eq("role", "user").eq("active", true),
      supabase.from("user_requests").select("*").eq("company_id", companyId).order("requested_at", { ascending: false }),
    ]);
    if (usersData) setUsers(usersData);
    if (reqData) setRequests(reqData);
    setLoading(false);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!form.display_name.trim() || !form.email.trim() || !form.password) { setError("Completá todos los campos"); return; }
    if (form.password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setSaving(true); setError("");
    const { error: err } = await supabase.from("user_requests").insert({
      company_id: companyId, company_name: profile.company_name,
      display_name: form.display_name.trim(), email: form.email.trim(),
      password: form.password, role: form.role, requested_by: profile.id,
    });
    if (err) { setError(err.message); } else {
      setShowForm(false); setForm({ display_name: "", email: "", password: "", role: "user" });
      await loadData();
    }
    setSaving(false);
  };

  const savePerms = async (userId) => {
    setSaving(true);
    await supabase.from("profiles").update({ permissions: permsForm }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: permsForm } : u));
    setEditPermsId(null); setSaving(false);
  };

  const togglePosMode = async (userId, current) => {
    await supabase.from("profiles").update({ pos_mode: !current }).eq("id", userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, pos_mode: !current } : u));
  };

  const deactivate = async (userId, name) => {
    if (!window.confirm(`¿Desactivar a ${name}? Ya no podrá acceder.`)) return;
    await supabase.from("profiles").update({ active: false }).eq("id", userId);
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  const pendingReqs = requests.filter(r => r.status === "pending");
  const otherReqs = requests.filter(r => r.status !== "pending");

  const statusBadge = (s) => {
    const map = { pending: { bg: T.yellowLight, c: T.yellow, l: "Pendiente" }, approved: { bg: T.accentLight, c: T.accent, l: "Aprobada" }, rejected: { bg: T.redLight, c: T.red, l: "Rechazada" } };
    const x = map[s] || map.pending;
    return <span style={{ background: x.bg, color: x.c, padding: "2px 9px", borderRadius: 8, fontSize: 11, fontWeight: 700 }}>{x.l}</span>;
  };

  if (loading) return <div style={{ padding: 40, color: T.muted, textAlign: "center" }}>Cargando…</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Usuarios</div>
          <div style={{ fontSize: 13, color: T.muted }}>Gestioná los usuarios de tu empresa</div>
        </div>
        <Btn onClick={() => { setShowForm(true); setError(""); }}>+ Solicitar nuevo usuario</Btn>
      </div>

      {/* Formulario nuevo usuario */}
      {showForm && (
        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, marginBottom: 24 }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Solicitud de nuevo usuario</div>
          <form onSubmit={submitRequest}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 12, alignItems: "end", marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: "block", marginBottom: 5 }}>NOMBRE COMPLETO *</label>
                <input value={form.display_name} onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))} placeholder="Juan García" style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: "block", marginBottom: 5 }}>EMAIL *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="juan@empresa.com" style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.5, display: "block", marginBottom: 5 }}>CONTRASEÑA *</label>
                <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Mínimo 6 caracteres" style={{ width: "100%", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7, padding: "9px 12px", color: T.ink, fontSize: 13, fontFamily: "inherit", outline: "none" }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Btn type="submit" disabled={saving}>{saving ? "Enviando…" : "Solicitar"}</Btn>
                <Btn v="ghost" onClick={() => { setShowForm(false); setError(""); }}>Cancelar</Btn>
              </div>
            </div>
            {error && <div style={{ background: T.redLight, color: T.red, borderRadius: 7, padding: "9px 12px", fontSize: 13 }}>{error}</div>}
          </form>
          <div style={{ marginTop: 10, background: T.yellowLight, border: `1px solid ${T.yellow}`, borderRadius: 8, padding: "9px 12px", fontSize: 12, color: T.yellow }}>
            ⚠ La solicitud quedará pendiente hasta que el administrador la apruebe. Una vez aprobada, el usuario podrá iniciar sesión.
          </div>
        </div>
      )}

      {/* Solicitudes pendientes */}
      {pendingReqs.length > 0 && (
        <div style={{ background: T.paper, border: `1px solid ${T.yellow}`, borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.yellow, marginBottom: 12 }}>Solicitudes pendientes de aprobación ({pendingReqs.length})</div>
          {pendingReqs.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{r.display_name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{r.email} · {r.role === "jefe" ? "Jefe" : "Usuario"}</div>
              </div>
              {statusBadge(r.status)}
            </div>
          ))}
        </div>
      )}

      {/* Usuarios activos */}
      <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, marginBottom: 20 }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700 }}>Usuarios activos ({users.length})</div>
        {users.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: T.muted, fontSize: 13 }}>Todavía no hay usuarios en tu empresa.</div>
        ) : users.map(u => (
          <div key={u.id}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: T.accent }}>
                  {(u.display_name || "?")[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{u.display_name || "Sin nombre"}</div>
                  <div style={{ fontSize: 12, color: T.muted }}>{u.email || "—"}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button onClick={() => togglePosMode(u.id, u.pos_mode)}
                  title="Activar / desactivar modo POS para este usuario"
                  style={{ background: u.pos_mode ? T.blueLight : "transparent", color: u.pos_mode ? T.blue : T.muted, border: `1px solid ${u.pos_mode ? T.blue : T.border}`, borderRadius: 7, padding: "5px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  🏪 POS {u.pos_mode ? "ON" : "OFF"}
                </button>
                <button onClick={() => { setEditPermsId(editPermsId === u.id ? null : u.id); setPermsForm(u.permissions || DEFAULT_PERMS); }}
                  style={{ background: editPermsId === u.id ? T.accentLight : "transparent", color: editPermsId === u.id ? T.accent : T.muted, border: `1px solid ${editPermsId === u.id ? T.accent : T.border}`, borderRadius: 7, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {editPermsId === u.id ? "▲ Permisos" : "▼ Permisos"}
                </button>
                <button onClick={() => deactivate(u.id, u.display_name)}
                  style={{ background: "transparent", color: T.muted, border: `1px solid ${T.border}`, borderRadius: 7, padding: "5px 14px", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  Desactivar
                </button>
              </div>
            </div>
            {editPermsId === u.id && (
              <div style={{ padding: "16px 20px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, letterSpacing: 0.8, marginBottom: 12 }}>PERMISOS POR MÓDULO</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 14 }}>
                  {PERM_MODULES.map(m => {
                    const active = permsForm[m.id] && permsForm[m.id] !== 'none';
                    return (
                      <button key={m.id} onClick={() => setPermsForm(p => ({ ...p, [m.id]: active ? 'none' : 'edit' }))}
                        style={{ background: active ? T.accentLight : T.surface2, border: `1px solid ${active ? T.accent : T.border}`, borderRadius: 8, padding: "10px 12px", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: active ? T.ink : T.muted, marginBottom: 4 }}>{m.label}</div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: active ? T.accent : T.faint }}>{active ? "✓ Activo" : "✕ Sin acceso"}</div>
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <Btn sm onClick={() => savePerms(u.id)} disabled={saving}>Guardar permisos</Btn>
                  <Btn v="ghost" sm onClick={() => setEditPermsId(null)}>Cancelar</Btn>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Historial de solicitudes */}
      {otherReqs.length > 0 && (
        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12 }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700 }}>Historial de solicitudes</div>
          {otherReqs.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.display_name}</div>
                <div style={{ fontSize: 12, color: T.muted }}>{r.email}</div>
                {r.rejection_reason && <div style={{ fontSize: 12, color: T.red, marginTop: 3 }}>Motivo: {r.rejection_reason}</div>}
              </div>
              {statusBadge(r.status)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── POS JEFE MODULE ───────────────────────────────────────────────────────────
function POSJefeModule({ companyId }) {
  const [tickets, setTickets] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [ticketDetalle, setTicketDetalle] = useState(null);

  useEffect(() => { loadData(fecha); }, []);

  const loadData = async (f) => {
    setLoading(true);
    const [t, c] = await Promise.all([
      supabase.from("pos_tickets").select("*").eq("company_id", companyId).eq("fecha", f).order("created_at", { ascending: false }),
      supabase.from("pos_cajas").select("*").eq("company_id", companyId).order("abierta_at", { ascending: false }).limit(20),
    ]);
    if (t.data) setTickets(t.data);
    if (c.data) setCajas(c.data);
    setLoading(false);
  };

  const vigentes = tickets.filter(t => t.estado !== "anulado");
  const totalDia = vigentes.reduce((s, t) => s + (t.total || 0), 0);
  // Efectivo en caja: solo cobros con método efectivo
  const totalEfectivo = vigentes.reduce((s, t) => {
    const pg = t.pagos?.length > 0 ? t.pagos : [{ metodo: t.metodo_pago, monto: t.total }];
    return s + pg.filter(p => p.metodo === "efectivo").reduce((ss, p) => ss + (p.monto || 0), 0);
  }, 0);
  // Ventas por método usando array pagos[] (soporta pago dividido)
  const porMetodo = vigentes.reduce((acc, t) => {
    const pg = t.pagos?.length > 0 ? t.pagos : [{ metodo: t.metodo_pago, monto: t.total }];
    for (const p of pg) acc[p.metodo] = (acc[p.metodo] || 0) + (p.monto || 0);
    return acc;
  }, {});
  const fmtAR = (n) => new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n || 0);

  const metodoLabel = { efectivo: "Efectivo", debito: "Débito", credito: "Crédito", transferencia: "Transf.", qr: "QR/MP", cuenta_corriente: "Cta. cte." };

  if (loading) return <div style={{ padding: 40, color: T.muted, textAlign: "center" }}>Cargando…</div>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Punto de Venta — Vista jefe</div>
          <div style={{ fontSize: 13, color: T.muted }}>Seguí las ventas del POS en tiempo real</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="date" value={fecha} onChange={e => { setFecha(e.target.value); loadData(e.target.value); }}
            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 12px", color: T.ink, fontSize: 13, outline: "none" }} />
          <Btn sm onClick={() => loadData(fecha)}>↻ Actualizar</Btn>
        </div>
      </div>

      {/* KPIs del día */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Ventas del día", value: fmtAR(totalDia), color: T.blue, border: T.blue },
          { label: "Efectivo en caja", value: fmtAR(totalEfectivo), color: T.accent, border: T.accent },
          { label: "Tickets emitidos", value: vigentes.length, color: T.ink, border: T.border },
          { label: "Ticket promedio", value: vigentes.length ? fmtAR(totalDia / vigentes.length) : "—", color: T.ink, border: T.border },
          { label: "Anulados", value: tickets.filter(t => t.estado === "anulado").length, color: T.red, border: T.border },
        ].map(k => (
          <div key={k.label} style={{ background: T.paper, border: `1px solid ${k.border}`, borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.5, marginBottom: 8 }}>{k.label.toUpperCase()}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>
      <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: "8px 14px", marginBottom: 20, fontSize: 11, color: T.muted }}>
        💡 <strong style={{ color: T.ink }}>Ventas del día</strong> = total de todos los tickets (todos los métodos) ·{" "}
        <strong style={{ color: T.ink }}>Efectivo en caja</strong> = solo cobros en efectivo (lo que debería haber físicamente en la caja)
      </div>

      {/* Por método de pago */}
      {Object.keys(porMetodo).length > 0 && (
        <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, letterSpacing: 0.5, marginBottom: 12 }}>VENTAS POR MÉTODO DE PAGO</div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {Object.entries(porMetodo).map(([m, v]) => (
              <div key={m} style={{ background: T.surface, borderRadius: 8, padding: "10px 16px", minWidth: 120 }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 3 }}>{metodoLabel[m] || m}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: T.accent }}>{fmtAR(v)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cajas activas */}
      {cajas.filter(c => c.estado === "abierta").length > 0 && (
        <div style={{ background: T.paper, border: `1px solid ${T.accent}`, borderRadius: 12, padding: "16px 20px", marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.accent, letterSpacing: 0.5, marginBottom: 12 }}>CAJAS ACTIVAS</div>
          <div style={{ display: "flex", gap: 12 }}>
            {cajas.filter(c => c.estado === "abierta").map(c => (
              <div key={c.id} style={{ background: T.accentLight, border: `1px solid ${T.accent}`, borderRadius: 8, padding: "10px 16px" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.accent }}>Turno {c.turno}</div>
                <div style={{ fontSize: 11, color: T.muted }}>{c.cajero_nombre}</div>
                <div style={{ fontSize: 11, color: T.muted }}>Abrió: {new Date(c.abierta_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tickets del día */}
      <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12 }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700 }}>
          Tickets del día ({tickets.length})
        </div>
        {tickets.length === 0 ? (
          <div style={{ padding: "32px", textAlign: "center", color: T.muted, fontSize: 13 }}>Sin tickets para esta fecha</div>
        ) : tickets.map(t => {
          const pagosT = t.pagos?.length > 0 ? t.pagos : [{ metodo: t.metodo_pago, monto: t.total }];
          const pagosLabel = pagosT.map(p => metodoLabel[p.metodo] || p.metodo).join(" + ");
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", borderBottom: `1px solid ${T.border}`, opacity: t.estado === "anulado" ? 0.5 : 1 }}>
              <div style={{ minWidth: 72 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: t.estado === "anulado" ? T.red : T.accent }}>{t.numero}</div>
                <div style={{ fontSize: 10, color: T.muted }}>{new Date(t.created_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                  {fmtAR(t.total)}
                  {t.descuento > 0 && <span style={{ fontSize: 11, color: T.yellow, marginLeft: 6 }}>− {fmtAR(t.descuento)}</span>}
                  {t.facturado && <span style={{ fontSize: 10, background: T.blueLight, color: T.blue, borderRadius: 4, padding: "1px 6px", marginLeft: 8, fontWeight: 700 }}>Facturado</span>}
                </div>
                <div style={{ fontSize: 11, color: T.muted }}>{pagosLabel} · {t.cajero_nombre} · {t.lines?.length || 0} ítem(s)</div>
                {t.estado === "anulado" && <span style={{ fontSize: 11, color: T.red }}>ANULADO: {t.anulado_motivo}</span>}
              </div>
              <button onClick={() => setTicketDetalle(t)}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "5px 14px", color: T.ink, fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
                Ver
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal detalle de ticket */}
      {ticketDetalle && (() => {
        const td = ticketDetalle;
        const lines = td.lines || [];
        const pagosT = td.pagos?.length > 0 ? td.pagos : [{ metodo: td.metodo_pago, monto: td.total }];
        const descuento = td.descuento || 0;
        const totalBruto = (td.total || 0) + descuento;
        // Calcular neto e IVA por línea
        const ivaDesglose = {};
        let netoTotal = 0;
        let ivaTotal = 0;
        const linesCalc = lines.map(l => {
          const neto = Math.round((l.precio / (1 + (l.iva || 21) / 100)) * l.qty * 100) / 100;
          const ivaImporte = Math.round((l.precio * l.qty - neto) * 100) / 100;
          netoTotal += neto;
          ivaTotal += ivaImporte;
          if (!ivaDesglose[l.iva || 21]) ivaDesglose[l.iva || 21] = 0;
          ivaDesglose[l.iva || 21] += ivaImporte;
          return { ...l, neto, ivaImporte, subtotal: l.precio * l.qty };
        });
        return (
          <Modal title={`Ticket ${td.numero}`} onClose={() => setTicketDetalle(null)} wide>
            {/* Cabecera */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
              {[
                { label: "Fecha y hora", value: new Date(td.created_at).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) },
                { label: "Cajero", value: td.cajero_nombre || "—" },
                { label: "Estado", value: td.estado === "anulado" ? "ANULADO" : td.facturado ? "Facturado" : "Emitido", color: td.estado === "anulado" ? T.red : td.facturado ? T.blue : T.accent },
              ].map(f => (
                <div key={f.label} style={{ background: T.surface, borderRadius: 8, padding: "10px 14px" }}>
                  <div style={{ fontSize: 10, color: T.muted, fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>{f.label.toUpperCase()}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: f.color || T.ink }}>{f.value}</div>
                </div>
              ))}
            </div>
            {td.estado === "anulado" && td.anulado_motivo && (
              <div style={{ background: T.redLight, border: `1px solid ${T.red}40`, borderRadius: 8, padding: "8px 14px", fontSize: 12, color: T.red, marginBottom: 16 }}>Motivo de anulación: {td.anulado_motivo}</div>
            )}

            {/* Tabla de productos */}
            <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.5, marginBottom: 8 }}>PRODUCTOS</div>
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 100px 60px 90px 90px", background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                {["Producto", "Cant.", "Precio c/IVA", "IVA %", "Neto", "Subtotal"].map(h => (
                  <div key={h} style={{ padding: "7px 12px", fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.5 }}>{h}</div>
                ))}
              </div>
              {linesCalc.map((l, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 60px 100px 60px 90px 90px", borderBottom: i < linesCalc.length - 1 ? `1px solid ${T.border}` : "none", background: i % 2 === 0 ? T.paper : T.surface }}>
                  <div style={{ padding: "9px 12px", fontSize: 13 }}>{l.nombre}</div>
                  <div style={{ padding: "9px 12px", fontSize: 13, color: T.muted }}>{l.qty}</div>
                  <div style={{ padding: "9px 12px", fontSize: 13 }}>{fmtAR(l.precio)}</div>
                  <div style={{ padding: "9px 12px", fontSize: 13, color: T.muted }}>{l.iva || 21}%</div>
                  <div style={{ padding: "9px 12px", fontSize: 13, color: T.muted }}>{fmtAR(l.neto)}</div>
                  <div style={{ padding: "9px 12px", fontSize: 13, fontWeight: 700 }}>{fmtAR(l.subtotal)}</div>
                </div>
              ))}
            </div>

            {/* Totales */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {/* IVA desglose */}
              <div style={{ background: T.surface, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.5, marginBottom: 10 }}>IMPUESTOS</div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: T.muted }}>
                  <span>Neto gravado:</span><span>{fmtAR(netoTotal)}</span>
                </div>
                {Object.entries(ivaDesglose).map(([tasa, monto]) => (
                  <div key={tasa} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: T.muted }}>
                    <span>IVA {tasa}%:</span><span>{fmtAR(monto)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.muted, paddingTop: 6, borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
                  <span>Total IVA:</span><span>{fmtAR(ivaTotal)}</span>
                </div>
              </div>
              {/* Total */}
              <div style={{ background: T.surface, borderRadius: 8, padding: "12px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.5, marginBottom: 10 }}>RESUMEN</div>
                {descuento > 0 && (
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: T.muted }}>
                      <span>Subtotal:</span><span>{fmtAR(totalBruto)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12, color: T.yellow }}>
                      <span>Descuento:</span><span>− {fmtAR(descuento)}</span>
                    </div>
                  </>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800, color: T.accent, paddingTop: 6, borderTop: `1px solid ${T.border}`, marginTop: 4 }}>
                  <span>TOTAL</span><span>{fmtAR(td.total)}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: T.muted, letterSpacing: 0.5, marginBottom: 6 }}>PAGOS</div>
                  {pagosT.map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                      <span style={{ color: T.muted }}>{metodoLabel[p.metodo] || p.metodo}</span>
                      <span style={{ fontWeight: 700 }}>{fmtAR(p.monto)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}

// ─── ARCA CONFIG MODULE ────────────────────────────────────────────────────────
function ArcaConfigModule({ companyId }) {
  const [cfg, setCfg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [form, setForm] = useState({ cuit: "", ptoVta: "", ambiente: "homologacion", cert: "", key: "" });

  useEffect(() => {
    if (!companyId) return;
    fetch(`/api/arca-config?company_id=${companyId}`)
      .then(r => r.json())
      .then(d => {
        setCfg(d);
        setForm(f => ({ ...f, cuit: d.cuit || "", ptoVta: d.ptoVta || "", ambiente: d.ambiente || "homologacion" }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [companyId]);

  const save = async () => {
    setSaving(true); setMsg(null);
    const body = { company_id: companyId, cuit: form.cuit, pto_venta: form.ptoVta, ambiente: form.ambiente };
    if (form.cert.trim()) body.cert = form.cert.trim();
    if (form.key.trim())  body.key  = form.key.trim();
    const res  = await fetch("/api/arca-config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) { setMsg({ ok: true, text: "Configuración guardada." }); setForm(f => ({ ...f, cert: "", key: "" })); fetch(`/api/arca-config?company_id=${companyId}`).then(r => r.json()).then(setCfg); }
    else setMsg({ ok: false, text: data.error });
  };

  const testToken = async () => {
    setSaving(true); setMsg(null);
    const res  = await fetch("/api/arca-token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ company_id: companyId }) });
    const data = await res.json();
    setSaving(false);
    if (res.ok) setMsg({ ok: true, text: "✓ Token WSAA obtenido correctamente. Conexión con ARCA funcionando." });
    else setMsg({ ok: false, text: "Error WSAA: " + data.error });
  };

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: T.muted }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: 640, margin: "0 auto" }}>
      <div style={{ fontSize: 18, fontWeight: 800, color: T.ink, marginBottom: 6 }}>Configuración ARCA</div>
      <div style={{ fontSize: 13, color: T.muted, marginBottom: 24 }}>Integrá tu empresa con ARCA (ex-AFIP) para emitir comprobantes electrónicos.</div>

      {msg && (
        <div style={{ background: msg.ok ? T.accentLight : T.redLight, border: `1px solid ${msg.ok ? T.accent : T.red}40`, borderRadius: 8, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: msg.ok ? T.accent : T.red }}>
          {msg.text}
        </div>
      )}

      <div style={{ background: T.paper, border: `1px solid ${T.border}`, borderRadius: 12, padding: 24, display: "grid", gap: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Input label="CUIT EMPRESA (sin guiones)" value={form.cuit} onChange={v => setForm(f => ({...f, cuit: v}))} placeholder="20123456789" />
          <Input label="PUNTO DE VENTA" type="number" value={form.ptoVta} onChange={v => setForm(f => ({...f, ptoVta: v}))} placeholder="1" />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 8, letterSpacing: 1 }}>AMBIENTE</label>
          <div style={{ display: "flex", gap: 8 }}>
            {[["homologacion", "Homologación (pruebas)"], ["produccion", "Producción"]].map(([val, lbl]) => (
              <button key={val} onClick={() => setForm(f => ({...f, ambiente: val}))}
                style={{ flex: 1, padding: "10px", borderRadius: 8, border: `2px solid ${form.ambiente === val ? T.accent : T.border}`, background: form.ambiente === val ? T.accentLight : T.surface, color: form.ambiente === val ? T.accent : T.muted, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 4 }}>Certificado digital</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>
            {cfg?.tieneCert ? "✓ Ya hay un certificado cargado. Pegá uno nuevo solo si querés reemplazarlo." : "Todavía no hay certificado. Pegá el contenido del archivo .crt que te dio ARCA."}
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>CERTIFICADO (.crt — PEM)</label>
            <textarea value={form.cert} onChange={e => setForm(f => ({...f, cert: e.target.value}))} rows={4}
              placeholder={"-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 11, fontFamily: "monospace", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, color: T.muted, display: "block", marginBottom: 5, letterSpacing: 1 }}>CLAVE PRIVADA (.key — PEM)</label>
            <textarea value={form.key} onChange={e => setForm(f => ({...f, key: e.target.value}))} rows={4}
              placeholder={"-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"}
              style={{ width: "100%", padding: "10px 13px", borderRadius: 8, border: `1px solid ${T.border}`, background: T.surface, color: T.ink, fontSize: 11, fontFamily: "monospace", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          </div>
        </div>

        {cfg?.tokenExp && (
          <div style={{ fontSize: 12, color: T.muted, background: T.surface, borderRadius: 8, padding: "8px 12px" }}>
            Token WSAA vigente hasta: <strong>{new Date(cfg.tokenExp).toLocaleString("es-AR")}</strong>
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          {cfg?.tieneCert && <Btn v="ghost" onClick={testToken} disabled={saving}>Probar conexión WSAA</Btn>}
          <Btn onClick={save} disabled={saving}>{saving ? "Guardando..." : "Guardar configuración"}</Btn>
        </div>
      </div>

      <div style={{ marginTop: 20, background: T.surface, borderRadius: 10, padding: 16, fontSize: 12, color: T.muted, lineHeight: 1.7 }}>
        <strong style={{ color: T.ink }}>Pasos para configurar:</strong><br/>
        1. Generá el par de claves con OpenSSL: <code style={{ background: T.paper, padding: "1px 6px", borderRadius: 4 }}>openssl req -x509 -newkey rsa:2048 -keyout privada.key -out cert.crt -days 730 -nodes</code><br/>
        2. Subí el <code style={{ background: T.paper, padding: "1px 6px", borderRadius: 4 }}>cert.crt</code> al portal de ARCA → Administración de Certificados Digitales.<br/>
        3. Registrá el certificado para el servicio <strong>wsfe</strong>.<br/>
        4. Pegá el contenido de ambos archivos acá y guardá.<br/>
        5. Usá "Probar conexión WSAA" para verificar que todo funciona.
      </div>
    </div>
  );
}

const NAV = [
  { id: "hub",        label: "Inicio",     icon: "⬡" },
  { id: "ventas",     label: "Ventas",     icon: "◈" },
  { id: "comercial",  label: "Comercial",  icon: "◇" },
  { id: "compras",    label: "Compras",    icon: "◉" },
  { id: "caja",       label: "Caja",       icon: "◈" },
  { id: "cheques",    label: "Cheques",    icon: "✦" },
  { id: "inventario", label: "Inventario", icon: "▦" },
  { id: "logistica",  label: "Logística",  icon: "🚚" },
  { id: "reportes",      label: "Reportes",      icon: "◎" },
  { id: "rrhh",          label: "RRHH",          icon: "👥" },
  { id: "contabilidad",  label: "Contabilidad",  icon: "⚖" },
];

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null, info: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error("ErrorBoundary caught:", error, info); this.setState({ info }); }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: "center", color: T.ink }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: T.red, marginBottom: 12 }}>⚠ Error en Contabilidad</div>
          <div style={{ fontSize: 13, color: T.muted, fontFamily: "monospace", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: 16, maxWidth: 600, margin: "0 auto 16px", textAlign: "left", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
            {String(this.state.error)}
            {this.state.info?.componentStack ? "\n\n" + this.state.info.componentStack.slice(0, 500) : ""}
          </div>
          <button onClick={() => this.setState({ error: null, info: null })} style={{ padding: "9px 20px", borderRadius: 8, border: `1px solid ${T.accent}`, background: T.accentLight, color: T.accent, cursor: "pointer", fontFamily: "inherit", fontWeight: 700, fontSize: 13 }}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App({ session, profile, onLogout }) {
  const [module, setModule] = useState("hub");
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [priceLists, setPriceLists] = useState(initPriceLists);
  const [vendedores, setVendedores] = useState(initVendedores);
  const [empleados, setEmpleados] = useState([]);
  const [tipoCambio, setTipoCambio] = useState(1200); // ARS por USD
  const [saleInvoices, setSaleInvoices] = useState([]);
  const [purchaseInvoices, setPurchaseInvoices] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [cajaMovimientos, setCajaMovimientos] = useState([]);
  const [cheques, setCheques] = useState([]);
  const [ordenesCompra, setOrdenesCompra] = useState([]);
  const [defaultMontoInicial, setDefaultMontoInicial] = useState(0);
  const [showDocBuilder, setShowDocBuilder] = useState(false);
  const [docBuilderType, setDocBuilderType] = useState("factura");
  const [preloadDoc, setPreloadDoc] = useState(null);

  const openDoc = (type, preload) => {
    setDocBuilderType(type); setPreloadDoc(preload || null); setShowDocBuilder(true);
  };
  const [showPurchaseBuilder, setShowPurchaseBuilder] = useState(false);
  const [idCounter, setIdCounter] = useState(5);
  const [dbLoading, setDbLoading] = useState(true);

  const companyId = profile?.company_id;
  const companyDisplayName = profile?.company_name || 'Mi Empresa';
  const isJefe = !profile?.role || profile.role === 'jefe';
  const userPerms = profile?.permissions || {};
  const visibleNav = [
    ...NAV.filter(n => isJefe || (userPerms[n.id] && userPerms[n.id] !== 'none')),
    ...(isJefe ? [{ id: "pos", label: "POS", icon: "🏪" }, { id: "usuarios", label: "Usuarios", icon: "👤" }, { id: "arca", label: "ARCA", icon: "🏛" }] : []),
  ];

  const nextId = (prefix) => { const n = idCounter + 1; setIdCounter(n); return `${prefix}-${String(n).padStart(4, "0")}`; };

  const [dbError, setDbError] = useState(null);

  // ── Inactividad: cerrar sesión después de 15 minutos ────────────────────
  useEffect(() => {
    const TIMEOUT = 15 * 60 * 1000;
    let timer = setTimeout(onLogout, TIMEOUT);
    const reset = () => { clearTimeout(timer); timer = setTimeout(onLogout, TIMEOUT); };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, reset, { passive: true }));
    return () => { clearTimeout(timer); events.forEach(e => window.removeEventListener(e, reset)); };
  }, []);

  // ── Cargar datos desde Supabase al login ────────────────────────────────
  useEffect(() => {
    if (!companyId) { setDbLoading(false); return; }
    const load = async () => {
      setDbLoading(true);
      setDbError(null);
      try {
        const fetchWithTimeout = (promise, label) =>
          Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout: ${label}`)), 10000))
          ]);

        const [r1, r2, r3, r4, r5, r6, r7, r8, r9, r10, r11] = await Promise.all([
          fetchWithTimeout(supabase.from('products').select('*').eq('company_id', companyId).order('name'), 'products'),
          fetchWithTimeout(supabase.from('clients').select('*').eq('company_id', companyId).order('name'), 'clients'),
          fetchWithTimeout(supabase.from('suppliers').select('*').eq('company_id', companyId).order('name'), 'suppliers'),
          fetchWithTimeout(supabase.from('sale_invoices').select('*').eq('company_id', companyId).order('date', { ascending: false }), 'sale_invoices'),
          fetchWithTimeout(supabase.from('purchase_invoices').select('*').eq('company_id', companyId).order('date', { ascending: false }), 'purchase_invoices'),
          fetchWithTimeout(supabase.from('employees').select('*').eq('company_id', companyId).order('apellido'), 'employees'),
          fetchWithTimeout(supabase.from('price_lists').select('*').eq('company_id', companyId).order('label'), 'price_lists'),
          fetchWithTimeout(supabase.from('cajas').select('*').eq('company_id', companyId).order('date', { ascending: false }), 'cajas'),
          fetchWithTimeout(supabase.from('caja_movimientos').select('*').eq('company_id', companyId).order('created_at'), 'caja_movimientos'),
          fetchWithTimeout(supabase.from('cheques').select('*').eq('company_id', companyId).order('fecha_pago'), 'cheques'),
          fetchWithTimeout(supabase.from('ordenes_compra').select('*').eq('company_id', companyId).order('date', { ascending: false }), 'ordenes_compra'),
        ]);

        if (r1.error) throw new Error('products: ' + r1.error.message);
        if (r2.error) throw new Error('clients: ' + r2.error.message);
        if (r3.error) throw new Error('suppliers: ' + r3.error.message);
        if (r4.error) throw new Error('sale_invoices: ' + r4.error.message);
        if (r5.error) throw new Error('purchase_invoices: ' + r5.error.message);
        if (r6.error) throw new Error('employees: ' + r6.error.message);
        if (r7.error) throw new Error('price_lists: ' + r7.error.message);
        if (r8.error) throw new Error('cajas: ' + r8.error.message);
        if (r9.error) throw new Error('caja_movimientos: ' + r9.error.message);
        if (r10.error) throw new Error('cheques: ' + r10.error.message);
        if (r11.error) throw new Error('ordenes_compra: ' + r11.error.message);

        if (r1.data) setProducts(r1.data.map(mapProduct));
        if (r2.data) setClients(r2.data.map(mapClient));
        if (r3.data) setSuppliers(r3.data.map(mapSupplier));
        if (r4.data) setSaleInvoices(r4.data.map(mapSaleInvoice));
        if (r5.data) setPurchaseInvoices(r5.data.map(mapPurchaseInvoice));
        if (r6.data) setEmpleados(r6.data.map(mapEmployee));
        if (r8.data) setCajas(r8.data.map(mapCaja));
        if (r9.data) setCajaMovimientos(r9.data.map(mapCajaMovimiento));
        if (r10.data) setCheques(r10.data.map(mapCheque));
        if (r11.data) setOrdenesCompra(r11.data.map(mapOrdenCompra));

        if (r7.data?.length) {
          setPriceLists(r7.data.map(mapPriceList));
        } else {
          // Initialize default price lists for new company
          for (const pl of initPriceLists) {
            await supabase.from('price_lists').insert(priceListToDb(pl, companyId));
          }
          setPriceLists(initPriceLists);
        }

        const allRefs = [...(r4.data || []), ...(r5.data || [])].map(r => parseInt((r.ref || '').split('-')[1] || '0') || 0);
        const maxRef = allRefs.length ? Math.max(...allRefs) : 0;
        if (maxRef > 0) setIdCounter(maxRef);
      } catch (e) {
        console.error('Error cargando datos:', e);
        setDbError(e.message);
      }
      setDbLoading(false);
    };
    load();
  }, [companyId]);

  const handleQuickAction = (action) => {
    if (action === "new_pago") { setModule("compras"); return; }
    const typeMap = { new_factura: "factura", new_presupuesto: "presupuesto", new_remito: "remito" };
    setModule("ventas");
    openDoc(typeMap[action] || "factura");
  };

  const handleSaveDoc = ({ lines, total, totalNeto, totalIva, clientId, clientName, docType, originPresupuestoId, originRemitoIds, modificaStock, imprimirPDF, generarPDF, observaciones, moneda, vendedor = "", metodoPago = "", retenciones = null, editingId, oldLines, posTicketIds }) => {
    // Las facturas desde remito NO descuentan stock (el remito ya lo hizo)
    const vieneDeRemito = docType === "factura" && originRemitoIds?.length > 0;
    const debeDescontarStock = !vieneDeRemito && (docType === "factura" || (docType === "presupuesto" && modificaStock) || docType === "remito");

    if (editingId) {
      // Editing existing doc: revert old stock, apply new stock
      if (debeDescontarStock && oldLines) {
        setProducts(prev => {
          const next = prev.map(p => {
            const oldL = oldLines.find(l => l.productId === p.id);
            const newL = lines.find(l => l.productId === p.id);
            let stock = p.stock;
            if (oldL) stock += oldL.qty;
            if (newL) stock -= newL.qty;
            return oldL || newL ? { ...p, stock } : p;
          });
          if (companyId) next.filter(p => oldLines.find(l=>l.productId===p.id)||lines.find(l=>l.productId===p.id)).forEach(p => supabase.from('products').update({ stock: p.stock }).eq('id', p.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }));
          return next;
        });
      }
      setSaleInvoices(prev => {
        const updated = { clientId, clientName, total, totalNeto, totalIva, lines, observaciones, moneda, modificaStock, vendedor, metodoPago, retenciones };
        if (companyId) {
          const inv = prev.find(i => i.id === editingId);
          if (inv) supabase.from('sale_invoices').update(Object.fromEntries(Object.entries(saleInvoiceToDb({ ...inv, ...updated }, companyId)).filter(([k]) => k !== 'id' && k !== 'company_id'))).eq('id', editingId).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
        }
        return prev.map(i => i.id === editingId ? { ...i, ...updated } : i);
      });
      setShowDocBuilder(false);
      return;
    }

    // New doc
    const prefix = { factura: "FAC", presupuesto: "PRE", remito: "REM" }[docType];
    const ref = nextId(prefix);
    const id = crypto.randomUUID();
    if (debeDescontarStock) {
      setProducts(prev => {
        const next = prev.map(p => { const l = lines.find(l => l.productId === p.id); return l ? { ...p, stock: p.stock - l.qty } : p; });
        if (companyId) next.filter(p => lines.find(l=>l.productId===p.id)).forEach(p => supabase.from('products').update({ stock: p.stock }).eq('id', p.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }));
        return next;
      });
    }
    if (originPresupuestoId) {
      setSaleInvoices(prev => prev.map(i => i.id === originPresupuestoId ? { ...i, status: "convertido" } : i));
      if (companyId) supabase.from('sale_invoices').update({ status: 'convertido' }).eq('id', originPresupuestoId).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    }
    if (originRemitoIds?.length > 0) {
      setSaleInvoices(prev => prev.map(i => originRemitoIds.includes(i.id) ? { ...i, status: "facturado" } : i));
      if (companyId) supabase.from('sale_invoices').update({ status: 'facturado' }).in('id', originRemitoIds).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    }
    if (posTicketIds?.length > 0) {
      if (companyId) supabase.from('pos_tickets').update({ facturado: true }).in('id', posTicketIds).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    }
    const due = new Date(today); due.setDate(due.getDate() + 15);
    const newInv = { id, ref, type: docType, clientId, clientName, date: today, due: due.toISOString().slice(0, 10), total, totalNeto, totalIva, status: docType === "remito" ? "emitido" : "pendiente", lines, originPresupuestoId: originPresupuestoId || null, originRemitoIds: originRemitoIds || null, modificaStock, observaciones, moneda, vendedor, metodoPago, retenciones: retenciones || null };
    setSaleInvoices(prev => [newInv, ...prev]);
    if (companyId) supabase.from('sale_invoices').insert(saleInvoiceToDb(newInv, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    setShowDocBuilder(false);
    if (imprimirPDF && generarPDF) generarPDF(id);
  };

  const handleSavePurchase = ({ lines, total, totalNeto, totalIva, supplierId, supplierName, payStatus, nroFactura, ordenCompraId, percepciones }) => {
    setProducts(prev => {
      const next = prev.map(p => { const l = lines.find(l => l.productId === p.id); return l ? { ...p, stock: p.stock + l.qty } : p; });
      if (companyId) next.filter(p => lines.find(l=>l.productId===p.id)).forEach(p => supabase.from('products').update({ stock: p.stock }).eq('id', p.id).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) }));
      return next;
    });
    const due = new Date(today); const sup = suppliers.find(s => s.id === supplierId); due.setDate(due.getDate() + (sup?.paymentDays || 0));
    const ref = nextId("OC");
    const id = crypto.randomUUID();
    const newPI = { id, ref, nroFactura: nroFactura || null, supplierId, supplierName, date: today, dueDate: due.toISOString().slice(0, 10), total, totalNeto, totalIva, status: payStatus, lines, percepciones: percepciones || null };
    setPurchaseInvoices(prev => [newPI, ...prev]);
    if (companyId) supabase.from('purchase_invoices').insert(purchaseInvoiceToDb(newPI, companyId)).then(r => { if (r?.error) console.error("DB Error:", r.error.message, r.error) });
    setShowPurchaseBuilder(false);
  };

  const criticalCount = products.filter(p => p.stock < p.minStock).length;
  const pendienteCobrar = saleInvoices.filter(i => i.status === "pendiente" && i.type === "factura").reduce((s, i) => s + i.total, 0);

  if ((dbLoading || dbError) && companyId) return (
    <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center", background: T.bg, color: T.ink, fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: "center", maxWidth: 420, padding: 24 }}>
        <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}><span style={{ color: T.accent }}>Nexo</span>PyME</div>
        {dbError ? (
          <>
            <div style={{ color: T.red, fontSize: 13, background: T.redLight, borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
              Error al cargar datos:<br /><code style={{ fontSize: 11 }}>{dbError}</code>
            </div>
            <button onClick={() => { setDbError(null); setDbLoading(true); }} style={{ background: T.accent, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Reintentar</button>
          </>
        ) : (
          <div style={{ color: T.muted, fontSize: 14 }}>Cargando datos de tu empresa…</div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", background: T.bg, fontFamily: "'DM Sans', 'Segoe UI', sans-serif", color: T.ink }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, select, button, textarea { font-family: inherit; }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-thumb { background: ${T.faint}; border-radius: 3px; }
        input[type=date]::-webkit-calendar-picker-indicator { filter: invert(0.5); }
      `}</style>

      {/* Sidebar */}
      <div style={{ width: 210, background: T.sidebar, borderRight: `1px solid ${T.border2}`, display: "flex", flexDirection: "column", padding: "24px 12px" }}>
        <div style={{ padding: "4px 12px", marginBottom: 32 }}>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}><span style={{ color: T.accent }}>Nexo</span>PyME</div>
          <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>plataforma integral</div>
        </div>
        <nav style={{ flex: 1 }}>
          {visibleNav.map(n => (
            <button key={n.id} onClick={() => setModule(n.id)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer", marginBottom: 2, textAlign: "left", background: module === n.id ? T.surface : "transparent", color: module === n.id ? T.ink : T.muted, fontWeight: module === n.id ? 700 : 500, fontSize: 13, borderLeft: `3px solid ${module === n.id ? T.accent : "transparent"}`, transition: "all 0.12s" }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              {n.label}
              {n.id === "inventario" && criticalCount > 0 && <span style={{ marginLeft: "auto", background: T.redLight, color: T.red, padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{criticalCount}</span>}
              {n.id === "ventas" && pendienteCobrar > 0 && <span style={{ marginLeft: "auto", background: T.yellowLight, color: T.yellow, padding: "1px 7px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>$</span>}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px", background: T.surface, borderRadius: 10, border: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 10, color: T.muted, marginBottom: 3 }}>EMPRESA</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{companyDisplayName}</div>
          <div style={{ fontSize: 11, color: T.muted, marginBottom: 10 }}>{profile?.display_name || profile?.email || ''}</div>
          <button onClick={onLogout} style={{ width: "100%", background: "transparent", border: `1px solid ${T.border}`, borderRadius: 6, padding: "6px 10px", color: T.muted, fontSize: 11, cursor: "pointer", fontFamily: "inherit", transition: "all 0.12s" }}
            onMouseEnter={e => { e.target.style.borderColor = T.red; e.target.style.color = T.red; }}
            onMouseLeave={e => { e.target.style.borderColor = T.border; e.target.style.color = T.muted; }}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>
        <ReadOnlyCtx.Provider value={false}>
        <div>
        {module === "hub" && <HubModule saleInvoices={saleInvoices} purchaseInvoices={purchaseInvoices} products={products} clients={clients} suppliers={suppliers} onQuickAction={handleQuickAction} tipoCambio={tipoCambio} setTipoCambio={setTipoCambio} />}
        {module === "ventas" && <VentasModule saleInvoices={saleInvoices} setSaleInvoices={setSaleInvoices} clients={clients} setClients={setClients} products={products} setProducts={setProducts} vendedores={vendedores} setVendedores={setVendedores} companyId={companyId} profile={profile} cheques={cheques} setCheques={setCheques} cajas={cajas} cajaMovimientos={cajaMovimientos} setCajaMovimientos={setCajaMovimientos}
          onNewFactura={() => openDoc("factura")}
          onNewRemito={() => openDoc("remito")}
          onNewPresupuesto={() => openDoc("presupuesto")}
          onNewPresupuestoIA={(preload) => openDoc("presupuesto", preload)}
          onEditDoc={(inv) => openDoc(inv.type, { editingId: inv.id, clientId: inv.clientId, lines: inv.lines, moneda: inv.moneda, observaciones: inv.observaciones, vendedor: inv.vendedor, modificaStock: inv.modificaStock, metodoPago: inv.metodoPago || "" })}
          onNewFacturaFromPOS={(preload) => openDoc("factura", preload)}
        />}
        {module === "comercial" && <ComercialModule clients={clients} saleInvoices={saleInvoices} />}
        {module === "compras" && <ComprasModule purchaseInvoices={purchaseInvoices} setPurchaseInvoices={setPurchaseInvoices} suppliers={suppliers} setSuppliers={setSuppliers} products={products} setProducts={setProducts} priceLists={priceLists} setPriceLists={setPriceLists} companyId={companyId} onNewPurchase={() => setShowPurchaseBuilder(true)} ordenesCompra={ordenesCompra} setOrdenesCompra={setOrdenesCompra} cheques={cheques} setCheques={setCheques} cajas={cajas} cajaMovimientos={cajaMovimientos} setCajaMovimientos={setCajaMovimientos} />}
        {module === "inventario" && <InventarioModule products={products} setProducts={setProducts} clients={clients} suppliers={suppliers} priceLists={priceLists} companyId={companyId} />}
        {module === "logistica" && <LogisticaModule clients={clients} suppliers={suppliers} />}
        {module === "reportes" && <ReportesModule saleInvoices={saleInvoices} purchaseInvoices={purchaseInvoices} products={products} clients={clients} suppliers={suppliers} cajas={cajas} cajaMovimientos={cajaMovimientos} />}
        {module === "caja" && <CajaModule cajas={cajas} setCajas={setCajas} cajaMovimientos={cajaMovimientos} setCajaMovimientos={setCajaMovimientos} saleInvoices={saleInvoices} empleados={empleados} defaultMontoInicial={defaultMontoInicial} setDefaultMontoInicial={setDefaultMontoInicial} companyId={companyId} />}
        {module === "cheques" && <ChequesModule cheques={cheques} setCheques={setCheques} companyId={companyId} />}
        {module === "rrhh" && <RRHHModule empleados={empleados} setEmpleados={setEmpleados} companyId={companyId} />}
        {module === "contabilidad" && <ErrorBoundary><ContabilidadModule saleInvoices={saleInvoices} purchaseInvoices={purchaseInvoices} products={products} cheques={cheques} companyId={companyId} /></ErrorBoundary>}
        {module === "pos" && isJefe && <POSJefeModule companyId={companyId} />}
        {module === "usuarios" && isJefe && <UsuariosModule companyId={companyId} profile={profile} />}
        {module === "arca" && isJefe && <ArcaConfigModule companyId={companyId} />}
        </div>
        </ReadOnlyCtx.Provider>
      </div>

      {showDocBuilder && <DocBuilder type={docBuilderType} clients={clients} products={products} saleInvoices={saleInvoices} tipoCambio={tipoCambio} preload={preloadDoc} onSave={handleSaveDoc} onClose={() => { setShowDocBuilder(false); setPreloadDoc(null); }} priceLists={priceLists} vendedores={vendedores} />}
      {showPurchaseBuilder && <PurchaseBuilder suppliers={suppliers} products={products} onSave={handleSavePurchase} onClose={() => setShowPurchaseBuilder(false)} ordenesCompra={ordenesCompra} />}
    </div>
  );
}
