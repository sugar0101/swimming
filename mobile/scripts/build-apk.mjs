// Compila el APK de Swimming is Cool y lo deja listo para servir en la web:
//   app/public/downloads/swimming.apk
//
// Uso:  cd mobile && npm run apk
//
// Luego: cd ../app && npm run deploy  (o quasar build + firebase deploy).
// La página /download/app lo servirá y la descarga funcionará.
//
// Requisitos: Android SDK (ANDROID_HOME) + Java 17 instalados (los mismos que
// usa `npm run android`). El APK se firma con la llave debug del template, así
// que es instalable sin configurar credenciales.

import { execSync } from 'child_process';
import { existsSync, mkdirSync, copyFileSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..'); // mobile/
const ANDROID = join(ROOT, 'android');
const isWin = process.platform === 'win32';

function run(cmd, cwd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd, stdio: 'inherit' });
}

// 1. Sincronizar el proyecto nativo (toma app.json, iconos, splash...).
run('npx expo prebuild --platform android', ROOT);

// 2. Compilar el APK de release (incluye el bundle de JS, firmado con debug).
//    Solo arm64-v8a: es la ABI de todos los teléfonos modernos, pesa menos y
//    evita el límite de 260 caracteres de ruta de Windows en el build C++.
//    Ruta ABSOLUTA al wrapper: cmd.exe no resuelve `gradlew.bat` desde el cwd.
const gradle = join(ANDROID, isWin ? 'gradlew.bat' : 'gradlew');
run(`"${gradle}" assembleRelease -PreactNativeArchitectures=arm64-v8a`, ANDROID);

// 3. Copiar a app/public/downloads/swimming.apk
const apk = join(ANDROID, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

if (!existsSync(apk)) {
  console.error(`\n✖ No se encontró el APK en:\n  ${apk}`);
  process.exit(1);
}

const destDir = join(ROOT, '..', 'app', 'public', 'downloads');
mkdirSync(destDir, { recursive: true });
const dest = join(destDir, 'swimming.apk');
copyFileSync(apk, dest);

const mb = (statSync(dest).size / (1024 * 1024)).toFixed(1);
console.log(`\n✅ APK listo (${mb} MB): app/public/downloads/swimming.apk`);
console.log('   Ahora: cd ../app && npm run deploy — la descarga quedará activa en /download/app.');
