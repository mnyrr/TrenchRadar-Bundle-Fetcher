document.addEventListener('DOMContentLoaded', () => {
    // Получаем элементы управления
    const elements = {
        twitterToggle: document.getElementById('twitterToggle'),
        fontSize: document.getElementById('fontSize'),
        fontSizeValue: document.getElementById('fontSizeValue'),
        opacity: document.getElementById('opacity'),
        opacityValue: document.getElementById('opacityValue'),
        mainColor: document.getElementById('mainColor'),
        accentColor: document.getElementById('accentColor'),
        resetButton: document.getElementById('resetButton'),
        pnlToggle: document.getElementById('pnlToggle'),
        walletInput: document.getElementById('walletInput'),
        balanceThreshold: document.getElementById('balanceThreshold')
    };

    // Настройки по умолчанию
    const DEFAULT_SETTINGS = {
        twitterEnabled: true,
        fontSize: 11,
        opacity: 75,
        mainColor: '#4FC1FF',
        accentColor: '#FFD702',
        pnlEnabled: false,
        walletAddress: '',
        balanceThreshold: 1.000
    };

    // Проверка URL для PnL
    function isPnlDomain(url) {
        return url && (url.includes('axiom.trade') || url.includes('nova.trade'));
    }

    // Загрузка настроек
    function loadSettings() {
        chrome.storage.local.get(['twitterSettings', 'pnlSettings'], (result) => {
            // Twitter настройки
            const twitterSettings = result.twitterSettings || DEFAULT_SETTINGS;
            elements.twitterToggle.checked = twitterSettings.twitterEnabled !== false;
            elements.fontSize.value = twitterSettings.fontSize || DEFAULT_SETTINGS.fontSize;
            elements.fontSizeValue.textContent = `${elements.fontSize.value}px`;
            elements.opacity.value = twitterSettings.opacity || DEFAULT_SETTINGS.opacity;
            elements.opacityValue.textContent = `${elements.opacity.value}%`;
            elements.mainColor.value = twitterSettings.mainColor || DEFAULT_SETTINGS.mainColor;
            elements.accentColor.value = twitterSettings.accentColor || DEFAULT_SETTINGS.accentColor;

            // PnL настройки
            const pnlSettings = result.pnlSettings || DEFAULT_SETTINGS;
            elements.pnlToggle.checked = pnlSettings.enabled || false;
            elements.walletInput.value = pnlSettings.walletAddress || '';
            elements.balanceThreshold.value = pnlSettings.balanceThreshold || DEFAULT_SETTINGS.balanceThreshold;
        });
    }

    // Сохранение Twitter настроек
    function saveTwitterSettings() {
        const settings = {
            twitterEnabled: elements.twitterToggle.checked,
            fontSize: parseFloat(elements.fontSize.value),
            opacity: parseInt(elements.opacity.value),
            mainColor: elements.mainColor.value,
            accentColor: elements.accentColor.value
        };

        chrome.storage.local.set({ twitterSettings: settings }, () => {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.url && tab.url.includes('axiom.trade')) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'updateTwitterSettings',
                            settings
                        });
                    }
                });
            });
        });
    }

    // Сохранение PnL настроек
    function savePnlSettings() {
        const settings = {
            enabled: elements.pnlToggle.checked,
            walletAddress: elements.walletInput.value.trim(),
            balanceThreshold: parseFloat(elements.balanceThreshold.value) || DEFAULT_SETTINGS.balanceThreshold
        };

        chrome.storage.local.set({ pnlSettings: settings }, () => {
            chrome.tabs.query({}, (tabs) => {
                tabs.forEach(tab => {
                    if (tab.url && isPnlDomain(tab.url)) {
                        chrome.tabs.sendMessage(tab.id, {
                            action: 'updatePnlSettings',
                            settings
                        });
                    }
                });
            });
        });
    }

    // Сброс настроек
    function resetSettings() {
        elements.twitterToggle.checked = DEFAULT_SETTINGS.twitterEnabled;
        elements.fontSize.value = DEFAULT_SETTINGS.fontSize;
        elements.fontSizeValue.textContent = `${DEFAULT_SETTINGS.fontSize}px`;
        elements.opacity.value = DEFAULT_SETTINGS.opacity;
        elements.opacityValue.textContent = `${DEFAULT_SETTINGS.opacity}%`;
        elements.mainColor.value = DEFAULT_SETTINGS.mainColor;
        elements.accentColor.value = DEFAULT_SETTINGS.accentColor;
        saveTwitterSettings();

        elements.pnlToggle.checked = DEFAULT_SETTINGS.pnlEnabled;
        elements.walletInput.value = DEFAULT_SETTINGS.walletAddress;
        elements.balanceThreshold.value = DEFAULT_SETTINGS.balanceThreshold;
        savePnlSettings();
    }

    // Получаем текущую активную вкладку
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        const currentUrl = currentTab.url || '';
        const currentDomain = new URL(currentUrl).hostname;

        const twitterSection = document.getElementById('twitterSection');
        const pnlSection = document.getElementById('pnlSection');
        const messageDiv = document.getElementById('messageDiv');

        if (currentDomain.includes('axiom.trade') || currentDomain.includes('nova.trade')) {
            twitterSection.style.display = currentDomain.includes('axiom.trade') ? 'block' : 'none';
            pnlSection.style.display = 'block';
            if (!currentDomain.includes('axiom.trade')) {
                messageDiv.innerHTML = '<p>Currently, Twitter Checker only works on axiom.trade.</p>';
                messageDiv.style.display = 'block';
            } else {
                messageDiv.style.display = 'none';
            }
            loadSettings();
        } else {
            twitterSection.style.display = 'none';
            pnlSection.style.display = 'none';
            messageDiv.innerHTML = '<p>Currently, this extension only works on axiom.trade and nova.trade.</p>';
            messageDiv.style.display = 'block';
        }
    });

    // Слушатели событий
    elements.twitterToggle.addEventListener('change', saveTwitterSettings);
    elements.fontSize.addEventListener('input', () => {
        elements.fontSizeValue.textContent = `${elements.fontSize.value}px`;
        saveTwitterSettings();
    });
    elements.opacity.addEventListener('input', () => {
        elements.opacityValue.textContent = `${elements.opacity.value}%`;
        saveTwitterSettings();
    });
    elements.mainColor.addEventListener('change', saveTwitterSettings);
    elements.accentColor.addEventListener('change', saveTwitterSettings);
    
    elements.pnlToggle.addEventListener('change', savePnlSettings);
    elements.walletInput.addEventListener('input', savePnlSettings);
    elements.balanceThreshold.addEventListener('input', savePnlSettings);
    
    elements.resetButton.addEventListener('click', resetSettings);

    // Установка высоты контента
    const calculateHeight = () => {
        const content = document.querySelector('.trench-content');
        if (content) {
            // Устанавливаем минимальную высоту для предотвращения сжатия
            content.style.minHeight = '300px'; // Задаём минимальную высоту
            const maxHeight = Math.min(window.innerHeight * 0.7, 600); // Ограничиваем максимальную высоту
            content.style.maxHeight = `${maxHeight}px`;
            content.style.height = 'auto'; // Позволяем содержимому определять высоту
        }
    };

    // Вызываем после полной загрузки содержимого
    setTimeout(calculateHeight, 0); // Вызов в следующем тике
    window.addEventListener('resize', calculateHeight);
});