const fs = require('fs');
const idx = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/index.json'));
console.log('Total collections in index.json:', idx.length);
console.log('First 10 slugs:', idx.slice(0, 10).map(x => x.slug));
const crown = idx.find(x => x.slug === 'imperialcrown');
console.log('imperialcrown in index.json:', crown);
