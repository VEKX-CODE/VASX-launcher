const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

function getSteamPath() {
    try {
        const out = execSync('reg query "HKCU\\Software\\Valve\\Steam" /v SteamPath', { encoding: 'utf-8' });
        const match = out.match(/SteamPath\s+REG_SZ\s+(.+)/);
        if (match && match[1]) return match[1].trim().replace(/\//g, '\\');
    } catch (e) {
        const def = 'C:\\Program Files (x86)\\Steam';
        if (fs.existsSync(def)) return def;
    }
    return null;
}

function getActiveUser() {
    try {
        const out = execSync('reg query "HKCU\\Software\\Valve\\Steam" /v AutoLoginUser', { encoding: 'utf-8' });
        const match = out.match(/AutoLoginUser\s+REG_SZ\s+(.*)/);
        return match && match[1] ? match[1].trim() : '';
    } catch (e) {
        return '';
    }
}

function getAccounts() {
    const steamPath = getSteamPath();
    if (!steamPath) return [];
    const vdfPath = path.join(steamPath, 'config', 'loginusers.vdf');
    if (!fs.existsSync(vdfPath)) return [];

    const content = fs.readFileSync(vdfPath, 'utf-8');
    const active = getActiveUser();
    const accounts = [];
    const blocks = content.split(/"(\d{17})"/g);

    for (let i = 1; i < blocks.length; i += 2) {
        const steamId = blocks[i];
        const block = blocks[i + 1] || '';
        const acc = block.match(/"AccountName"\s+"([^"]+)"/);
        const name = block.match(/"PersonaName"\s+"([^"]+)"/);

        if (acc) {
            accounts.push({
                steamId: steamId,
                accountName: acc[1],
                personaName: name ? name[1] : acc[1],
                isActive: acc[1].toLowerCase() === active.toLowerCase()
            });
        }
    }
    return accounts;
}

// Чтение реального времени игры (Playtime в минутах) из localconfig.vdf всех аккаунтов
function getRealPlaytimes() {
    const steamPath = getSteamPath();
    const playtimes = {};
    if (!steamPath) return playtimes;

    const userDataDir = path.join(steamPath, 'userdata');
    if (!fs.existsSync(userDataDir)) return playtimes;

    const userDirs = fs.readdirSync(userDataDir);
    userDirs.forEach(dir => {
        const localConfig = path.join(userDataDir, dir, 'config', 'localconfig.vdf');
        if (fs.existsSync(localConfig)) {
            try {
                const content = fs.readFileSync(localConfig, 'utf-8');
                // Парсим блоки вида "1238840" { ... "Playtime" "773" ... }
                const regex = /"(\d+)"\s*\{[^}]*?"Playtime"\s*"(\d+)"/g;
                let match;
                while ((match = regex.exec(content)) !== null) {
                    const appId = match[1];
                    const minutes = parseInt(match[2], 10);
                    // Берем максимум, если игра запускалась на разных аккаунтах
                    playtimes[appId] = Math.max(playtimes[appId] || 0, minutes);
                }
            } catch (e) {}
        }
    });

    return playtimes;
}

// Сканирование установленных И неустановленных игр из кэша Steam библиотеки
function getGames() {
    const steamPath = getSteamPath();
    if (!steamPath) return [];

    const accounts = getAccounts();
    const accMap = {};
    accounts.forEach(a => { accMap[a.steamId] = a.accountName; });

    const playtimes = getRealPlaytimes();
    const games = [];
    const gamesMap = {};

    // 1. Сначала считываем УСТАНОВЛЕННЫЕ игры из steamapps/*.acf
    const steamApps = path.join(steamPath, 'steamapps');
    if (fs.existsSync(steamApps)) {
        const files = fs.readdirSync(steamApps);
        files.forEach(file => {
            if (!file.startsWith('appmanifest_') || !file.endsWith('.acf')) return;
            try {
                const raw = fs.readFileSync(path.join(steamApps, file), 'utf-8');
                const appId = (raw.match(/"appid"\s+"(\d+)"/) || [])[1];
                const name = (raw.match(/"name"\s+"([^"]+)"/) || [])[1];
                const lastOwner = (raw.match(/"LastOwner"\s+"(\d+)"/) || [])[1] || '';
                const lastPlayed = parseInt((raw.match(/"LastPlayed"\s+"(\d+)"/) || [])[1] || '0', 10);

                if (!appId || !name || appId === '228980') return;

                const minutes = playtimes[appId] || 0;
                const hours = (minutes / 60).toFixed(1);

                const gameObj = {
                    appId: appId,
                    name: name,
                    isInstalled: true,
                    ownerSteamId: lastOwner,
                    ownerAccount: accMap[lastOwner] || 'Unknown',
                    lastPlayed: lastPlayed,
                    playtimeMinutes: minutes,
                    playtimeHours: hours,
                    // Высочайшее разрешение постеров: 600x900 капсула и HD Hero арт
                    coverUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900_2x.jpg`,
                    bannerUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
                    heroUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`
                };

                games.push(gameObj);
                gamesMap[appId] = true;
            } catch (e) {}
        });
    }

    // 2. Добавляем игры из библиотеки аккаунта (неустановленные, но купленные/запускавшиеся)
    // Steam кэширует их в appcache/librarycache/<appId>
    const libCache = path.join(steamPath, 'appcache', 'librarycache');
    if (fs.existsSync(libCache)) {
        const cachedDirs = fs.readdirSync(libCache);
        cachedDirs.forEach(dirName => {
            if (/^\d+$/.test(dirName) && !gamesMap[dirName] && dirName !== '228980') {
                const appId = dirName;
                const minutes = playtimes[appId] || 0;
                // Добавляем, если в эту игру играли
                if (minutes > 0) {
                    const hours = (minutes / 60).toFixed(1);
                    games.push({
                        appId: appId,
                        name: `Steam Game (${appId})`,
                        isInstalled: false, // Можно скачать!
                        ownerSteamId: '',
                        ownerAccount: 'Steam Library',
                        lastPlayed: 0,
                        playtimeMinutes: minutes,
                        playtimeHours: hours,
                        coverUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/library_600x900_2x.jpg`,
                        bannerUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`,
                        heroUrl: `https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${appId}/library_hero.jpg`
                    });
                    gamesMap[appId] = true;
                }
            }
        });
    }

    return games;
}

function launchGame(appId) {
    const games = getGames();
    const game = games.find(g => g.appId === appId);
    if (!game) throw new Error("Game not found");

    const current = getActiveUser();
    if (game.ownerAccount && game.ownerAccount !== 'Unknown' && game.ownerAccount !== 'Steam Library' && game.ownerAccount.toLowerCase() !== current.toLowerCase()) {
        try { execSync('taskkill /F /IM steam.exe /T 2>nul'); } catch (e) {}
        execSync(`reg add "HKCU\\Software\\Valve\\Steam" /v AutoLoginUser /t REG_SZ /d "${game.ownerAccount}" /f`);
    }

    spawn('cmd.exe', ['/c', `start steam://run/${appId}`], { detached: true, stdio: 'ignore' }).unref();
}

function installGame(appId) {
    spawn('cmd.exe', ['/c', `start steam://install/${appId}`], { detached: true, stdio: 'ignore' }).unref();
}

module.exports = { getSteamPath, getActiveUser, getAccounts, getGames, launchGame, installGame };
