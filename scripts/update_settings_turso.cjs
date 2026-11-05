const fs = require('fs');
const path = require('path');
const { saveToTurso } = require('../turso.js');

const settingsPath = path.join(__dirname, '..', 'data', 'settings.json');
const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));

if (!settings.collections) settings.collections = {};

settings.collections.imperialcrown = {
  enabled: true,
  price: 3000,
  upgradePrice: 0,
  supply: 100
};

fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
console.log('Local settings.json updated:', settings.collections.imperialcrown);

(async () => {
  try {
    const res = await saveToTurso('settings', settings, false);
    console.log('Turso sync result for settings:', res);
  } catch (err) {
    console.error('Turso sync error:', err);
  }
})();
