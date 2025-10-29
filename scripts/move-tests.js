const testFiles = [
  'admin-dashboard.test.jsx',
  'Admin.test.jsx',
  'app-routing-admin.test.jsx',
  'categoria.test.jsx',
  'flujo-auth.test.jsx',
  'helpers.test.jsx',
  'localstorageHelper.test.js',
  'login.test.jsx',
  'logout-flow.test.jsx',
  'Navbar.test.jsx',
  'productos.test.jsx',
  'registro.test.jsx',
  'require-auth.test.jsx'
];

const fs = require('fs');
const path = require('path');

// Asegurar que existe la carpeta test
if (!fs.existsSync('test')) {
  fs.mkdirSync('test');
}

// Copiar setup.js si existe
if (fs.existsSync(path.join('src', 'test', 'setup.js'))) {
  fs.copyFileSync(
    path.join('src', 'test', 'setup.js'),
    path.join('test', 'setup.js')
  );
}

// Mover cada archivo de test
testFiles.forEach(file => {
  const srcPath = path.join('src', 'test', file);
  const destPath = path.join('test', file);
  
  if (fs.existsSync(srcPath)) {
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${file}`);
  }
});