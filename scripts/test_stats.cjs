const fs = require('fs');
const path = require('path');

const index = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/index.json'));
const inv = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/inventory.json'));
const settings = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/settings.json'));

for (const slug of ['coinflip', 'imperialcrown', 'rarebird', 'deskcalendar']) {
  const c = index.find(x => x.slug === slug) || {};
  const cfg = settings.collections?.[slug] || {};
  const enabled = cfg.enabled !== undefined ? !!cfg.enabled : (slug === 'coinflip' || slug === 'imperialcrown');
  console.log(`${slug}: enabled=${enabled}, cfg.enabled=${cfg.enabled}, price=${cfg.price}`);
}
