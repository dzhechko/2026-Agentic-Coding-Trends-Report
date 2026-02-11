// ==================== ИНИЦИАЛИЗАЦИЯ ==================== //
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializeNavigation();
    initializeSearch();
    initializeScrollEffects();
    initializeSocialShare();
    initializeTableOfContents();
});

// ==================== УПРАВЛЕНИЕ ТЕМОЙ ==================== //
function initializeTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const html = document.documentElement;
    
    // Загрузить сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
    
    // Переключение темы
    themeToggle.addEventListener('click', () => {
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
        
        // Анимация
        themeToggle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            themeToggle.style.transform = 'rotate(0deg)';
        }, 300);
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#theme-toggle i');
    icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
}

// ==================== НАВИГАЦИЯ И МЕНЮ ==================== //
function initializeNavigation() {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const sidebarClose = document.getElementById('sidebar-close');
    
    // Открыть боковую панель
    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Закрыть боковую панель
    sidebarClose.addEventListener('click', closeSidebar);
    
    // Закрыть при клике вне панели
    sidebar.addEventListener('click', (e) => {
        if (e.target === sidebar) {
            closeSidebar();
        }
    });
    
    // Закрыть при выборе пункта меню
    const tocLinks = sidebar.querySelectorAll('.toc a');
    tocLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                closeSidebar();
                
                // Плавная прокрутка
                setTimeout(() => {
                    targetElement.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 300);
            }
        });
    });
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('active');
    document.body.style.overflow = '';
}

// ==================== СОДЕРЖАНИЕ (TABLE OF CONTENTS) ==================== //
function initializeTableOfContents() {
    const sections = document.querySelectorAll('.content-section[id]');
    const tocLinks = document.querySelectorAll('.toc a');
    
    // Intersection Observer для активных разделов
    const observerOptions = {
        root: null,
        rootMargin: '-80px 0px -80% 0px',
        threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                updateActiveSection(id);
            }
        });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
}

function updateActiveSection(activeId) {
    const tocLinks = document.querySelectorAll('.toc a');
    
    tocLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${activeId}`) {
            link.classList.add('active');
        }
    });
}

// ==================== ПОИСК ==================== //
function initializeSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchPanel = document.getElementById('search-panel');
    const searchClose = document.getElementById('search-close');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    // Открыть панель поиска
    searchBtn.addEventListener('click', () => {
        searchPanel.classList.remove('hidden');
        searchInput.focus();
    });
    
    // Закрыть панель поиска
    searchClose.addEventListener('click', closeSearch);
    
    // Закрыть при клике вне контейнера
    searchPanel.addEventListener('click', (e) => {
        if (e.target === searchPanel) {
            closeSearch();
        }
    });
    
    // Закрыть при нажатии ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!searchPanel.classList.contains('hidden')) {
                closeSearch();
            }
            if (document.getElementById('sidebar').classList.contains('active')) {
                closeSidebar();
            }
        }
    });
    
    // Поиск при вводе
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(e.target.value, searchResults);
        }, 300);
    });
}

function closeSearch() {
    const searchPanel = document.getElementById('search-panel');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    searchPanel.classList.add('hidden');
    searchInput.value = '';
    searchResults.innerHTML = '';
}

function performSearch(query, resultsContainer) {
    if (!query || query.length < 2) {
        resultsContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Введите минимум 2 символа для поиска</p>';
        return;
    }
    
    const sections = document.querySelectorAll('.content-section');
    const results = [];
    
    sections.forEach(section => {
        const content = section.textContent.toLowerCase();
        const queryLower = query.toLowerCase();
        
        if (content.includes(queryLower)) {
            const title = section.querySelector('h2, h3');
            const titleText = title ? title.textContent : 'Раздел';
            const sectionId = section.getAttribute('id');
            
            // Найти контекст вокруг совпадения
            const index = content.indexOf(queryLower);
            const start = Math.max(0, index - 80);
            const end = Math.min(content.length, index + query.length + 80);
            let excerpt = section.textContent.substring(start, end).trim();
            
            if (start > 0) excerpt = '...' + excerpt;
            if (end < content.length) excerpt = excerpt + '...';
            
            // Подсветить совпадения
            const regex = new RegExp(`(${query})`, 'gi');
            excerpt = excerpt.replace(regex, '<mark>$1</mark>');
            
            results.push({
                title: titleText,
                excerpt: excerpt,
                id: sectionId
            });
        }
    });
    
    displaySearchResults(results, resultsContainer, query);
}

function displaySearchResults(results, container, query) {
    if (results.length === 0) {
        container.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">Ничего не найдено</p>';
        return;
    }
    
    const resultsHTML = results.map(result => `
        <div class="search-result-item" data-target="${result.id}">
            <div class="search-result-title">${result.title}</div>
            <div class="search-result-text">${result.excerpt}</div>
        </div>
    `).join('');
    
    container.innerHTML = `
        <p style="color: var(--text-secondary); margin-bottom: 1rem; font-size: 0.875rem;">
            Найдено результатов: ${results.length}
        </p>
        ${resultsHTML}
    `;
    
    // Добавить обработчики кликов
    container.querySelectorAll('.search-result-item').forEach(item => {
        item.addEventListener('click', () => {
            const targetId = item.getAttribute('data-target');
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                closeSearch();
                setTimeout(() => {
                    targetElement.scrollIntoView({ 
                        behavior: 'smooth',
                        block: 'start'
                    });
                }, 100);
            }
        });
    });
}

// ==================== ЭФФЕКТЫ ПРОКРУТКИ ==================== //
function initializeScrollEffects() {
    const scrollTopBtn = document.getElementById('scroll-to-top');
    const readingProgress = document.getElementById('reading-progress');
    
    // Прогресс чтения и кнопка "Наверх"
    window.addEventListener('scroll', () => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight - windowHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / documentHeight) * 100;
        
        // Обновить прогресс-бар
        readingProgress.style.width = progress + '%';
        
        // Показать/скрыть кнопку "Наверх"
        if (scrolled > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    });
    
    // Кнопка "Наверх"
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Анимация появления элементов при прокрутке
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };
    
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Анимировать секции
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(20px)';
        section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeObserver.observe(section);
    });
}

// ==================== СОЦИАЛЬНЫЕ СЕТИ ==================== //
function initializeSocialShare() {
    const shareButtons = document.querySelectorAll('.share-btn');
    
    shareButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const platform = btn.getAttribute('data-platform');
            const url = encodeURIComponent(window.location.href);
            const title = encodeURIComponent('Отчет по трендам ИИ-агентного программирования 2026');
            
            let shareUrl = '';
            
            switch(platform) {
                case 'twitter':
                    shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
                    break;
                case 'linkedin':
                    shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                    break;
                case 'telegram':
                    shareUrl = `https://t.me/share/url?url=${url}&text=${title}`;
                    break;
            }
            
            if (shareUrl) {
                window.open(shareUrl, '_blank', 'width=600,height=400');
            }
        });
    });
    
    // Кнопка копирования ссылки
    const copyLinkBtn = document.getElementById('copy-link');
    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(window.location.href);
                
                // Показать уведомление
                const originalHTML = copyLinkBtn.innerHTML;
                copyLinkBtn.innerHTML = '<i class="fas fa-check"></i>';
                copyLinkBtn.style.background = 'var(--success-color)';
                copyLinkBtn.style.color = 'white';
                
                setTimeout(() => {
                    copyLinkBtn.innerHTML = originalHTML;
                    copyLinkBtn.style.background = '';
                    copyLinkBtn.style.color = '';
                }, 2000);
            } catch (err) {
                console.error('Ошибка копирования:', err);
                alert('Не удалось скопировать ссылку');
            }
        });
    }
}

// ==================== ПЛАВНАЯ ПРОКРУТКА ДЛЯ ВСЕХ ССЫЛОК ==================== //
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        
        // Пропустить, если это не якорная ссылка или уже обработано
        if (href === '#' || this.closest('.toc') || this.closest('.search-result-item')) {
            return;
        }
        
        e.preventDefault();
        const targetElement = document.querySelector(href);
        
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ==================== КЛАВИАТУРНЫЕ СОКРАЩЕНИЯ ==================== //
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K для поиска
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-btn').click();
    }
    
    // Ctrl/Cmd + B для меню
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        document.getElementById('menu-toggle').click();
    }
});

// ==================== УЛУЧШЕНИЕ ПРОИЗВОДИТЕЛЬНОСТИ ==================== //
// Debounce функция для оптимизации
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Оптимизированный обработчик изменения размера окна
const handleResize = debounce(() => {
    // Закрыть боковую панель на больших экранах
    if (window.innerWidth > 768) {
        closeSidebar();
    }
}, 250);

window.addEventListener('resize', handleResize);

// ==================== АНАЛИТИКА (ОПЦИОНАЛЬНО) ==================== //
// Отслеживание времени чтения
let readingStartTime = Date.now();
let totalReadingTime = 0;

window.addEventListener('beforeunload', () => {
    totalReadingTime = Date.now() - readingStartTime;
    console.log(`Время чтения: ${Math.round(totalReadingTime / 1000)} секунд`);
});

// ==================== УЛУЧШЕНИЕ ДОСТУПНОСТИ ==================== //
// Управление фокусом для модальных окон
function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        
        if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
                lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === lastFocusable) {
                firstFocusable.focus();
                e.preventDefault();
            }
        }
    });
}

// Применить trap focus к модальным окнам
const searchPanel = document.getElementById('search-panel');
const sidebar = document.getElementById('sidebar');

if (searchPanel) trapFocus(searchPanel);
if (sidebar) trapFocus(sidebar);

console.log('✅ Сайт загружен успешно! Тренды ИИ-агентного программирования 2026');
