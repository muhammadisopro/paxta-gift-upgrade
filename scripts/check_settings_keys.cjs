const fs = require('fs');
const s = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/settings.json'));
console.log('rarebird:', s.collections.rarebird);
console.log('imperialcrown:', s.collections.imperialcrown);
console.log('deskcalendar:', s.collections.deskcalendar);
