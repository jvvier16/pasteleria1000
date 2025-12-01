/**
 * db.js: Inicialización de la base de datos SQLite
 * Crea las tablas necesarias: usuarios, pasteles, pedidos
 */

const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const fs = require('fs')

const dbPath = path.join(__dirname, 'pasteleria.db')

// By design: the server should NOT run if the DB file does not exist.
// This enforces "la página no funciona sin la base de datos".
// If you need to bypass this behaviour (e.g. for first-time setup),
// set environment variable `IGNORE_DB_MISSING=1`.
if (!fs.existsSync(dbPath) && process.env.IGNORE_DB_MISSING !== '1') {
  console.error('\nERROR: Archivo de base de datos no encontrado:', dbPath)
  console.error('La aplicación requiere la base de datos para funcionar.\n')
  console.error('Si quieres crear la base de datos automáticamente, ejecuta las migraciones o define IGNORE_DB_MISSING=1 para omitir esta comprobación (no recomendado en producción).')
  process.exit(1)
}

let db = null

try {
  db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Error al conectar a la BD:', err)
      // if connection fails, exit to prevent server running without DB
      process.exit(1)
    } else {
      console.log('Conectado a SQLite:', dbPath)
    }
  })
} catch (err) {
  console.error('Fallo al abrir la base de datos:', err)
  process.exit(1)
}

function runStmt(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

function initializeTables() {
  const stmts = [
    `CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      apellido TEXT,
      correo TEXT UNIQUE NOT NULL,
      contrasena TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      fechaNacimiento TEXT,
      direccion TEXT,
      imagen TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS pasteles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      descripcion TEXT,
      precio REAL NOT NULL,
      stock INTEGER DEFAULT 0,
      stockCritico INTEGER DEFAULT 5,
      categoria TEXT,
      imagen TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS pedidos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      items TEXT NOT NULL,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pendiente',
      paymentMethod TEXT,
      paypalOrderId TEXT,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES usuarios(id)
    )`,
    `CREATE TABLE IF NOT EXISTS carritos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER UNIQUE NOT NULL,
      items TEXT NOT NULL,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(userId) REFERENCES usuarios(id)
    )`
  ]

  return Promise.all(stmts.map(s => runStmt(s))).then(() => {
    console.log('Tablas inicializadas correctamente')
  })
}

// Expose a `ready` promise that resolves when tables are initialized.
const ready = initializeTables()

// Helper para ejecutar queries con promesas
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ id: this.lastID, changes: this.changes })
    })
  })
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

module.exports = { db, query, run, get, ready }
