const fs = require('fs');
const u = JSON.parse(fs.readFileSync('D:/code/paxta-gift-upgrade/data/users.json'));
console.log(Object.values(u).map(x => `${x.username} (id: ${x.paxtaId}, stars: ${x.stars}, name: ${x.displayName})`).join('\n'));
