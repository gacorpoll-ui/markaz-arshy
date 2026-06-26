import { DatabaseSync } from 'node:sqlite';
import fs from 'fs';

const DB_NEW = 'D:/follower-store/backend/prisma/dev.db.bak-20260626-145104';
const DB_OLD = 'D:/follower-store/backend/prisma/dev.db';
const DB_FINAL = 'D:/follower-store/backend/prisma/dev.db';

// 1. Copy DB baru (1131 produk) sebagai basis final
fs.copyFileSync(DB_NEW, DB_FINAL);
console.log('✅ Basis: DB baru (1131 produk, 256 kategori)');

const db = new DatabaseSync(DB_FINAL);
const dbOld = new DatabaseSync(DB_OLD);

function getCommonCols(table) {
  const newCols = db.prepare(`PRAGMA table_info("${table}")`).all();
  const oldCols = dbOld.prepare(`PRAGMA table_info("${table}")`).all();
  const oldNames = oldCols.map(c => c.name);
  return newCols.filter(c => oldNames.includes(c.name) && c.name !== 'id').map(c => c.name);
}

function safeName(n) {
  return n.includes('-') ? `"${n}"` : n;
}

function copyTable(table) {
  try {
    const rows = dbOld.prepare(`SELECT * FROM ${safeName(table)}`).all();
    if (rows.length === 0) { console.log(`  ${table}: 0 rows, skip`); return; }
    const cols = getCommonCols(table);
    if (cols.length === 0) { console.log(`  ${table}: no common cols`); return; }
    db.prepare(`DELETE FROM ${safeName(table)}`).run();
    const ph = cols.map(() => '?').join(',');
    const ins = db.prepare(`INSERT INTO ${safeName(table)} (${cols.join(',')}) VALUES (${ph})`);
    for (const r of rows) ins.run(...cols.map(c => r[c] ?? null));
    console.log(`  ✅ ${table}: ${rows.length} rows`);
  } catch (e) {
    console.log(`  ⚠️ ${table}: ${e.message.substring(0, 80)}`);
  }
}

// Copy semua tabel user-related
copyTable('User');
copyTable('Order');
copyTable('Deposit');
copyTable('BalanceTransaction');
copyTable('AIApiKey');
copyTable('AIUsage');
copyTable('AITransaction');
copyTable('Notification');
copyTable('Review');
copyTable('Follower');

// Verifikasi
const finalUsers = db.prepare('SELECT COUNT(*) as c FROM User').get();
const finalOrders = db.prepare('SELECT COUNT(*) as c FROM "Order"').get();
const finalProducts = db.prepare('SELECT COUNT(*) as c FROM Product').get();
const finalDeposits = db.prepare('SELECT COUNT(*) as c FROM Deposit').get();
const finalCats = db.prepare('SELECT COUNT(*) as c FROM Category').get();
const finalTx = db.prepare('SELECT COUNT(*) as c FROM BalanceTransaction').get();

console.log('\n=== VERIFIKASI FINAL ===');
console.log(`Users: ${finalUsers.c} | Orders: ${finalOrders.c} | Products: ${finalProducts.c}`);
console.log(`Deposits: ${finalDeposits.c} | Categories: ${finalCats.c} | BalanceTx: ${finalTx.c}`);

// Cek user details
const users = db.prepare('SELECT id, name, email, role, balance FROM User').all();
console.log('\n=== USER ===');
users.forEach(u => console.log(`  #${u.id} ${u.name} <${u.email}> ${u.role} Rp${Math.floor(u.balance)}`));

db.close();
dbOld.close();
console.log('\n✅ Merge selesai!');
