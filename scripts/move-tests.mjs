import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

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

async function moveTests() {
  // Asegurar que existe la carpeta test
  try {
    await fs.mkdir(path.join(rootDir, 'test'), { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }

  // Copiar setup.js si existe
  try {
    const setupExists = await fs.access(path.join(rootDir, 'src', 'test', 'setup.js'))
      .then(() => true)
      .catch(() => false);

    if (setupExists) {
      await fs.copyFile(
        path.join(rootDir, 'src', 'test', 'setup.js'),
        path.join(rootDir, 'test', 'setup.js')
      );
      console.log('Copied setup.js');
    }
  } catch (err) {
    console.error('Error copying setup.js:', err);
  }

  // Mover cada archivo de test
  for (const file of testFiles) {
    try {
      const srcPath = path.join(rootDir, 'src', 'test', file);
      const destPath = path.join(rootDir, 'test', file);
      
      await fs.access(srcPath);
      await fs.rename(srcPath, destPath);
      console.log(`Moved ${file}`);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(`Error moving ${file}:`, err);
      }
    }
  }
}

moveTests().catch(console.error);