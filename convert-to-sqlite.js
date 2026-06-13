import fs from 'fs';

const schemaPath = 'prisma/schema.prisma';
let schema = fs.readFileSync(schemaPath, 'utf8');

// Wrap @default values in quotes for string fields
schema = schema.replace(/@default\(AKTIF\)/g, '@default("AKTIF")');
schema = schema.replace(/@default\(PENDING\)/g, '@default("PENDING")');

fs.writeFileSync(schemaPath, schema);
console.log('Schema converted to SQLite (Fixed Defaults)');
