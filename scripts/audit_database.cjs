const fs = require('fs');

const act = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/activity.json', 'utf8'));
const inv = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/inventory.json', 'utf8'));
const users = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/users.json', 'utf8'));
const payments = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/payments.json', 'utf8'));

console.log('--- USERS ---');
for (const [k, u] of Object.entries(users)) {
  const userGifts = inv.filter(g => g.owner === k && g.state !== 'burned');
  const userBurned = inv.filter(g => g.owner === k && g.state === 'burned');
  console.log(`User: ${k} (${u.displayName || u.username}, paxtaId: ${u.paxtaId}) | Stars: ${u.stars} | Active Gifts: ${userGifts.length} | Burned (Craft): ${userBurned.length}`);
}

console.log('\n--- PAYMENTS / INVOICES ---');
console.log('Invoices count:', Object.keys(payments.invoices || {}).length);
for (const [nonce, invc] of Object.entries(payments.invoices || {})) {
  console.log(`Invoice ${nonce}: user=${invc.user}, amount=${invc.amount}, status=${invc.status}, paidAt=${invc.paidAt}`);
}

console.log('\n--- ALL BUYS IN ACTIVITY LOG ---');
const buys = act.filter(a => a.type === 'buy');
console.log(`Total buys in activity: ${buys.length}`);
buys.forEach(b => {
  const inInv = inv.find(g => g.id === b.giftId);
  console.log(`Buy: ${b.createdAt} | Actor: ${b.actor} (${b.actorName}) | Gift: ${b.giftName} (${b.giftId}) | Slug: ${b.slug} | Price: ${b.price} | Still in inv: ${!!inInv} (state: ${inInv?.state})`);
});
