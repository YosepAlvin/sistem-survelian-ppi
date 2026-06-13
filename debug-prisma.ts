import { db } from './lib/db';

async function main() {
  console.log('Pasien fields:', Object.keys((db as any).pasien || {}));
  console.log('RawatInap fields:', Object.keys((db as any).rawatInap || {}));
}

main();
