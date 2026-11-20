let allGames = [];
let allAccounts = [];
let activeAccountName = '';

let currentPlatform = 'all';

window.addEventListener('DOMContentLoaded', async () => {
    initSearch();
    initPlatformFilters();
    await loadAccounts();
    await loadGames();
});

// 1. Загрузка аккаунтов
async function loadAccounts() {
    try {
        const res = await fetch('/api/accounts');
        allAccounts = await res.json();
        const active = allAccounts.find(a => a.isActive);
        activeAccountName = active ? active.accountName : (allAccounts[0] ? allAccounts[0].accountName : '');
    } catch (e) {
        console.error('Ошибка загрузки аккаунтов:', e);
    }
}

// 2. Загрузка игр
async function loadGames() {
    try {
        const res = await fetch('/api/games');
        const steamGames = await res.json();

        // Помечаем реальные игры из Steam
        steamGames.forEach(g => g.platform = 'steam');

        // Только настоящие игры из твоих реальных файлов!
        allGames = steamGames;

        renderCurrentView();
    } catch (e) {
        console.error('Ошибка загрузки игр:', e);
    }
}

// Фильтры платформ
function initPlatformFilters() {
    const pills = document.querySelectorAll('.filter-pills .pill');
    pills.forEach(pill => {
        pill.onclick = () => {
            pills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentPlatform = pill.getAttribute('data-filter');
            renderCurrentView();
        };
    });
}

function renderCurrentView() {
    let filtered = allGames.filter(g => g.isInstalled);
    if (currentPlatform !== 'all') {
        filtered = filtered.filter(g => g.platform === currentPlatform);
    }

    const countBadge = document.getElementById('gamesCount');
    if (countBadge) countBadge.innerText = `${filtered.length} игр`;

    renderSidebarList(filtered);
    renderInstalledGrid(filtered);
    renderRecentGrid(filtered);
}

// Отрисовка списка в левом сайдбаре
function renderSidebarList(games) {
    const list = document.getElementById('sidebarList');
    if (!list) return;
    list.innerHTML = games.map(g => `
        <div class="sidebar-game-item" onclick="launchGame('${g.appId}', event)">
            <img class="sidebar-game-thumb" src="${g.bannerUrl}" alt="${g.name}" onerror="this.src='${g.coverUrl}'">
            <span class="sidebar-game-title">${g.name}</span>
        </div>
    `).join('');
}

// Отрисовка основной сетки карточек игр
function renderInstalledGrid(games) {
    const grid = document.getElementById('installedGrid');
    if (!grid) return;

    grid.innerHTML = games.map(g => {
        return `
            <div class="media-card">
                <img class="media-thumb" src="${g.bannerUrl}" alt="${g.name}" onerror="this.src='${g.coverUrl}'">
                <div class="media-body">
                    <h3 class="media-title" title="${g.name}">${g.name}</h3>
                    <div class="media-meta">
                        <span>${g.playtimeHours} ч.</span>
                        <span class="owner-tag">@${g.ownerAccount}</span>
                    </div>
                    <button class="launch-btn" onclick="launchGame('${g.appId}', event)">
                        ▶ Играть
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Секция "Недавно запускались"
function renderRecentGrid(games) {
    const grid = document.getElementById('recentGrid');
    if (!grid) return;

    const recent = [...games].sort((a, b) => b.lastPlayed - a.lastPlayed).slice(0, 4);
    grid.innerHTML = recent.map(g => {
        const dateStr = g.lastPlayed > 0 ? new Date(g.lastPlayed * 1000).toLocaleDateString('ru-RU') : 'Ранее';
        return `
            <div class="recent-card" onclick="launchGame('${g.appId}', event)">
                <img class="recent-thumb" src="${g.bannerUrl}" alt="${g.name}" onerror="this.src='${g.coverUrl}'">
                <div class="recent-info">
                    <h4 title="${g.name}">${g.name}</h4>
                    <p>${dateStr} • ${g.playtimeHours} ч.</p>
                </div>
            </div>
        `;
    }).join('');
}

// Запуск игры с волной
async function launchGame(appId, event) {
    if (window.triggerMegaWave && event) {
        window.triggerMegaWave(event.clientX, event.clientY);
    }

    try {
        await fetch(`/api/launch?appId=${appId}`);
        setTimeout(loadAccounts, 2500);
    } catch (e) {
        alert('Ошибка запуска: ' + e.message);
    }
}

// Поиск
function initSearch() {
    const input = document.getElementById('searchInput');
    if (!input) return;
    input.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const filtered = allGames.filter(g => g.isInstalled && g.name.toLowerCase().includes(val));
        renderInstalledGrid(filtered);
    });
}
