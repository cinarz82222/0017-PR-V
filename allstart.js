const { spawn } = require('child_process');
const path = require('path');

const config = require('./Global/Settings/System.js');
const basePath = __dirname;

const bots = [];

if (config.Main?.Mainframe) {
    bots.push({ name: 'Mainframe', cwd: path.join(basePath, 'Bot/Mainframe'), script: 'Index.js' });
}
if (config.Main?.Elixir) {
    bots.push({ name: 'Elixir', cwd: path.join(basePath, 'Bot/Elixir'), script: 'Index.js' });
}
if (config.Main?.Point) {
    bots.push({ name: 'Point', cwd: path.join(basePath, 'Bot/Point'), script: 'Index.js' });
}
if (config.Security?.Logger) {
    bots.push({ name: 'Logger', cwd: path.join(basePath, 'Bot/Guardian/I'), script: 'index.js' });
}
if (config.Security?.Punish) {
    bots.push({ name: 'Punish', cwd: path.join(basePath, 'Bot/Guardian/II'), script: 'index.js' });
}
if (config.Security?.Backup) {
    bots.push({ name: 'Backup', cwd: path.join(basePath, 'Bot/Guardian/III'), script: 'index.js' });
}

if (bots.length === 0) {
    console.log('\n[ALLSTART] Hiç bot token\'ı tanımlı değil. System.js içinde Main veya Security token\'larını doldurun.\n');
    process.exit(0);
}

const processes = [];

console.log(`\n[ALLSTART] ${config.serverName || 'Bots'} - ${bots.length} bot başlatılıyor...\n`);

bots.forEach((bot) => {
    const proc = spawn('node', [bot.script, '--color'], {
        cwd: bot.cwd,
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, BOT_NAME: bot.name }
    });

    proc.on('error', (err) => {
        console.error(`[${bot.name}] Hata:`, err.message);
    });

    proc.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
            console.log(`[${bot.name}] Çıkış (kod: ${code})`);
        }
    });

    processes.push({ name: bot.name, proc });
    console.log(`[ALLSTART] ${bot.name} başlatıldı (PID: ${proc.pid})\n`);
});

process.on('SIGINT', () => {
    console.log('\n[ALLSTART] Tüm botlar kapatılıyor...');
    processes.forEach(({ name, proc }) => {
        proc.kill('SIGTERM');
        console.log(`[ALLSTART] ${name} kapatıldı`);
    });
    setTimeout(() => process.exit(0), 2000);
});

process.on('SIGTERM', () => {
    processes.forEach(({ proc }) => proc.kill('SIGTERM'));
    process.exit(0);
});
