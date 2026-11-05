const fs = require('fs');

const invPath = 'D:/code/paxta-gift-upgrade/data/inventory.json';
const inv = JSON.parse(fs.readFileSync(invPath, 'utf8'));

let updated = 0;
for (const g of inv) {
  if (g.slug === 'imperialcrown') {
    if (g.model) {
      if (g.model.id === 'eye_of_sauron' || g.model.name === 'Eye of Sauron') {
        g.model.img = '/a/imperialcrown/vip4.svg';
        g.model.tgs = '/a/imperialcrown/vip4.json';
        updated++;
      } else if (g.model.id === 'paxta_imperial' || g.model.name === 'Paxta Imperial') {
        g.model.img = '/a/imperialcrown/vip8.svg';
        g.model.tgs = '/a/imperialcrown/vip8.json';
        updated++;
      }
    }
  }
}

fs.writeFileSync(invPath, JSON.stringify(inv, null, 2));
console.log(`Updated ${updated} imperialcrown gifts in data/inventory.json! Total gifts: ${inv.length}`);
