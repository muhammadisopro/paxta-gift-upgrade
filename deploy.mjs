import { execSync } from 'node:child_process';

const RENDER_API_KEY = process.env.RENDER_API_KEY || 'rnd_169rdL44xndHTtNzb3wMvt8Gu8tz';
const SERVICE_ID = 'srv-dbm53auc6qcc7380t1m0';

function run(cmd) {
  console.log(`> ${cmd}`);
  try {
    execSync(cmd, { stdio: 'inherit', cwd: 'D:\\code\\paxta-gift-upgrade' });
    return true;
  } catch (e) {
    console.error(`Command failed: ${cmd}`, e.message);
    return false;
  }
}

async function main() {
  console.log('🚀 1/2: GitHub repozitoriyga yuklanmoqda (git push origin master)...');
  const pushed = run('git push origin master');
  if (!pushed) {
    console.error('❌ Git push amalga oshmadi!');
    process.exit(1);
  }

  console.log('\n🚀 2/2: Render.com deploy buyrug‘i yuborilmoqda...');
  try {
    const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RENDER_API_KEY}`,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clearCache: 'do_not_clear' })
    });
    const data = await res.json();
    console.log('✅ Render deploy boshlandi! Deploy ID:', data.id || data.deploy?.id);
    console.log('🌐 Manzil: https://paxta-gift-upgrade.onrender.com');
  } catch (err) {
    console.error('Render API xatosi:', err);
  }
}

main();
