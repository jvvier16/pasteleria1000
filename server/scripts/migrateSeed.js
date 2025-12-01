const path = require('path')
const fs = require('fs')
const { run, query } = require('../db')

async function loadJson(relPath) {
  const full = path.join(__dirname, '..', '..', relPath)
  return JSON.parse(fs.readFileSync(full, 'utf8'))
}

async function insertUsuarios(usuarios) {
  for (const u of usuarios) {
    try {
      // Avoid duplicate by correo
      const exists = await query('SELECT id FROM usuarios WHERE correo = ?', [u.correo])
      if (exists && exists.length) continue
      await run(
        `INSERT INTO usuarios (nombre, apellido, correo, contrasena, role, fechaNacimiento, direccion, imagen) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [u.nombre || '', u.apellido || '', u.correo || '', u.contrasena || 'changeme', u.role || 'user', u.fechaNacimiento || null, u.direccion || null, u.imagen || null]
      )
    } catch (e) {
      console.error('Error insertando usuario', u.correo, e.message)
    }
  }
}

async function insertPasteles(pasteles) {
  for (const p of pasteles) {
    try {
      const exists = await query('SELECT id FROM pasteles WHERE nombre = ? AND precio = ?', [p.nombre, p.precio])
      if (exists && exists.length) continue
      await run(
        `INSERT INTO pasteles (nombre, descripcion, precio, stock, stockCritico, categoria, imagen) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [p.nombre || '', p.descripcion || '', p.precio || 0, p.stock || 0, p.stockCritico || 5, p.categoria || null, p.imagen || null]
      )
    } catch (e) {
      console.error('Error insertando pastel', p.nombre, e.message)
    }
  }
}

async function main() {
  try {
    const usuarios = await loadJson('src/data/Usuarios.json')
    const pasteles = await loadJson('src/data/Pasteles.json')
    console.log('Usuarios a insertar:', usuarios.length)
    console.log('Pasteles a insertar:', pasteles.length)
    await insertUsuarios(usuarios)
    await insertPasteles(pasteles)
    console.log('Migración completada')
    process.exit(0)
  } catch (e) {
    console.error('Error en migración:', e)
    process.exit(1)
  }
}

main()
