const fs = require('fs');
const path = require('path');

const dir = 'D:/code/paxta-gift-upgrade/public/a/imperialcrown';

// Map old 30 indices to new 10 VIP indices so NO old links ever break!
const OLD_TO_NEW = {
  0: 0,  // shadow monarch
  1: 1,  // amir temur
  2: 3,  // black gold vip
  3: 2,  // satoshi nakamoto
  4: 4,  // eye of sauron
  5: 5,  // ton crystal
  6: 6,  // julius caesar
  7: 7,  // akatsuki cloud
  8: 3,  // rolex -> black gold vip
  9: 5,  // frozen lich -> ton crystal
  10: 7, // cyberpunk -> akatsuki
  11: 8, // paxta imperial
  12: 5, // archangel -> ton
  13: 4, // hellfire demon -> sauron
  14: 6, // sakura emperor -> caesar
  15: 7, // matrix hacker -> akatsuki
  16: 1, // pharaoh -> amir temur
  17: 0, // supernova -> shadow monarch
  18: 3, // midas touch -> black gold vip
  19: 0, // venom -> shadow monarch
  20: 5, // diamond ice -> ton crystal
  21: 4, // blood dracula -> sauron
  22: 0, // arcane magic -> shadow monarch
  23: 1, // poseidon -> amir temur
  24: 1, // emerald sultan -> amir temur
  25: 3, // liquid chrome -> black gold vip
  26: 4, // toxic neon -> sauron
  27: 9, // royal amethyst -> imperial classic
  28: 2, // sunset miami -> satoshi
  29: 9  // imperial classic -> imperial classic
};

for (let oldIdx = 0; oldIdx < 30; oldIdx++) {
  const vipIdx = OLD_TO_NEW[oldIdx];
  for (const ext of ['json', 'svg', 'tgs']) {
    const src = path.join(dir, `vip${vipIdx}.${ext}`);
    const dst = path.join(dir, `m${oldIdx}.${ext}`);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dst);
    }
  }
}
console.log('Successfully created legacy alias copies for m0..m29!');
