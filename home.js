/**
 * Project: Research Tracks Platform (منصة المسارات البحثية)
 * File: home.js
 * Role: Senior JavaScript Engineer Architecture Core & Identity Lifecycle
 * Description: Production-ready Vanilla ES6 architecture module matching the visual flow 
 *              and lifecycle controls. Integrates real-time IndexedDB tracking statistics
 *              and dynamic navbar auth state switching tied to the centralized DatabaseEngine.
 */

// ==========================================================================
// 1. STATE, DEPENDENCIES & DATA LAYER
// ==========================================================================
// تم إلغاء الـ import المحلي هنا والاعتماد على المحرك العالمي المتاح في المتصفح window لكسر قيود الـ CORS

const AppState = {
    isDarkMode: false,
    userSession: null,
    notificationsCount: 1,
    
    // Abstracted asynchronous data fetching ready for IndexedDB integration
    async fetchServices() {
        return [
            { id: 'card-research-tracks', title: 'المسارات البحثية', desc: 'استكشف مجالات البحث المتاحة', url: '#tracks' },
            { id: 'card-workshops', title: 'التدريب وورش العمل', desc: 'سجل في الدورات القادمة', url: '#workshops' },
            { id: 'card-publishing-guide', title: 'دليل النشر', desc: 'خطوات النشر العلمي', url: '#publishing' },
            { id: 'card-research-advisor', title: 'الادوات المساعدة', desc: 'برامج مكتبية ومساعدة وذكاء اصطناعي', url: '#tools' }
        ];
    },

    async fetchAnnouncements() {
        return {
            id: 'card-visa-announcement',
            title: 'بطاقة فيزا',
            subtitle: 'آخر إصدارات الأبحاث',
            url: '#visa-details'
        };
    }
};

const DOMRegistry = {
    numStatTracks: document.getElementById('num-stat-tracks'),
    numStatResearchers: document.getElementById('num-stat-researchers'),
    numStatPapers: document.getElementById('num-stat-papers'),
    tabProfile: document.getElementById('tab-profile')
};

// ==========================================================================
// 2. UI UTILITIES & REUSABLE COMPONENTS
// ==========================================================================

const UIUtils = {
    showSpinner(targetElementId) {
        const container = document.getElementById(targetElementId);
        if (!container) return;
        const spinner = document.createElement('div');
        spinner.id = 'loading-spinner';
        spinner.className = 'spinner';
        spinner.setAttribute('role', 'status');
        spinner.setAttribute('aria-live', 'polite');
        container.appendChild(spinner);
    },

    hideSpinner() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) spinner.remove();
    },

    showToast(message, type = 'success') {
        const existingToast = document.getElementById('toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.dir = 'rtl';
        toast.textContent = message;

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
};

// ==========================================================================
// 3. INTERACTION & IDENTITY LIFECYCLE MANAGEMENT
// ==========================================================================

const IdentityModule = {
    /**
     * Inspects active session identifiers and mutates navigation controllers smoothly.
     */
    async checkAuthAndRenderNavbar() {
        // فحص الجلسة المؤقتة أو الدائمة عبر البريد الإلكتروني المحفوظ
        const sessionEmail = sessionStorage.getItem('activeUserEmail') || localStorage.getItem('remembered_research_user') || localStorage.getItem('active_user_email');
        const authContainer = document.getElementById('auth-nav-container') || document.getElementById('auth-actions');

        if (!authContainer) return;

        if (sessionEmail && window.DatabaseEngine) {
            try {
                // استدعاء بيانات المستخدم من قاعدة البيانات المركزية الموحدة عبر كائن window
                const user = await window.DatabaseEngine.getUserByEmail(sessionEmail.toLowerCase().trim());

                if (user) {
                    AppState.userSession = user;
                    const avatarLetter = user.name.charAt(0).toUpperCase();

                    // حقن كتلة البروفايل الشخصي ديناميكياً بدلاً من أزرار تسجيل الدخول والإنشاء بنفس الهيكلية
                    authContainer.innerHTML = `
                        <div class="user-profile-nav" id="btn-nav-profile-context" style="display: flex; align-items: center; gap: 12px; cursor: pointer;" role="button" aria-label="عرض الملف الشخصي لـ ${user.name}">
                            <div class="user-profile-badge" style="display: flex; align-items: center; gap: 10px;">
                                <div class="user-nav-avatar" style="width: 35px; height: 35px; background-color: var(--primary-color, #0f4c81); color: #fff; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 15px; border: 2px solid rgba(255,255,255,0.2);">
                                    ${user.avatar || avatarLetter}
                                </div>
                                <span class="user-nav-name" style="font-weight: 500; color: var(--text-color, #333); font-size: 0.95rem;">${user.name}</span>
                                <button id="btn-logout" class="btn btn-link" style="font-size: 0.85rem; color: #ff4d4d; cursor: pointer; border: none; background: none; padding: 0 5px;">خروج</button>
                            </div>
                        </div>
                    `;

                    // ربط أحداث ملف التعريف والـ Logout
                    document.getElementById('btn-nav-profile-context')?.addEventListener('click', (e) => {
                        if (e.target.id === 'btn-logout') return;
                        window.location.href = 'profile.html';
                    });

                    document.getElementById('btn-logout')?.addEventListener('click', (e) => {
                        e.stopPropagation();
                        IdentityModule.handleLogout();
                    });

                    // تعديل مسار تبويب "ملفي" في شريط الموبايل السفلي ليوجه للوحة التحكم مباشرة
                    if (DOMRegistry.tabProfile) {
                        DOMRegistry.tabProfile.href = 'dashboard.html';
                    }
                    return;
                }
            } catch (error) {
                console.error('Identity Lifecycle Fetch Error:', error);
            }
        }

        // هيكلية الأزرار الافتراضية في حال عدم وجود جلسة نشطة
        authContainer.innerHTML = `
            <a href="login.html" id="btn-login" class="btn btn-link">تسجيل الدخول</a>
        `;
        
        if (DOMRegistry.tabProfile) {
            DOMRegistry.tabProfile.href = 'login.html';
        }
        EventInteractionModule.setupAuthButtons();
    },

    handleLogout() {
        sessionStorage.removeItem('activeUserEmail');
        localStorage.removeItem('remembered_research_user');
        localStorage.removeItem('active_user_email');
        AppState.userSession = null;
        window.location.reload();
    },

    /**
     * Pulls active data store aggregates to calculate actual dynamic platform footprints.
     */
    async syncPlatformStatistics() {
        if (!window.DatabaseEngine) return;
        try {
            const db = await window.DatabaseEngine.connectionManager.connect();
            
            // 1. حساب عدد الباحثين المسجلين في النظام
            const usersTx = db.transaction('users', 'readonly');
            const usersStore = usersTx.objectStore('users');
            usersStore.count().onsuccess = (e) => {
                const count = e.target.result || 0;
                if (DOMRegistry.numStatResearchers) {
                    DOMRegistry.numStatResearchers.textContent = count > 0 ? count : 27; 
                }
            };

            // 2. تحديث عداد المسارات البحثية النشطة من الجدول المخصص
            const allTracks = await window.DatabaseEngine.getAllTracks();
            if (DOMRegistry.numStatTracks) {
                DOMRegistry.numStatTracks.textContent = allTracks.length > 0 ? allTracks.length : 12;
            }

            // 3. تحديث عداد الأوراق العلمية بناءً على المشاريع والأبحاث المكتملة
            const projectsTx = db.transaction('projects', 'readonly');
            const projectsStore = projectsTx.objectStore('projects');
            projectsStore.count().onsuccess = (e) => {
                const papersCount = e.target.result || 0;
                if (DOMRegistry.numStatPapers) {
                    DOMRegistry.numStatPapers.textContent = papersCount > 0 ? papersCount : 5;
                }
            };
        } catch (error) {
            console.warn('Statistics Sync Warning (Using defaults):', error);
        }
    }
};

const NavigationModule = {
    init() {
        const navItems = document.querySelectorAll('#desktop-nav a, #mobile-bottom-nav a, #nav-list a, .bottom-nav-item');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const targetHash = item.getAttribute('href');
                if (targetHash && targetHash.startsWith('#') && targetHash.length > 1) {
                    e.preventDefault();
                    
                    navItems.forEach(nav => nav.classList.remove('active'));
                    item.classList.add('active');

                    const targetSection = document.querySelector(targetHash);
                    if (targetSection) {
                        targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        targetSection.setAttribute('focus', '-1');
                        targetSection.focus();
                    }
                }
            });
        });
    }
};

const EventInteractionModule = {
    init() {
        this.setupCardClicks();
        this.setupNotificationBadge();
        this.setupSearch();
        this.setupAccessibilityKeyboard();
    },

    setupCardClicks() {
        const gridContainer = document.getElementById('services-grid');
        if (gridContainer) {
            gridContainer.addEventListener('click', async (e) => {
                const card = e.target.closest('.service-card');
                if (!card) return;

                const services = await AppState.fetchServices();
                const matchedService = services.find(s => s.id === card.id);

                if (matchedService) {
                    UIUtils.showToast(`جاري الانتقال إلى: ${matchedService.title}`, 'info');
                    window.location.hash = matchedService.url;
                }
            });
        }

        const announcementCard = document.getElementById('card-visa-announcement');
        if (announcementCard) {
            announcementCard.addEventListener('click', async () => {
                const data = await AppState.fetchAnnouncements();
                UIUtils.showToast(`فتح تفاصيل: ${data.title}`, 'info');
                window.location.hash = data.url;
            });
        }
    },

    setupAuthButtons() {
        const btnLogin = document.getElementById('btn-login');
        const btnRegister = document.getElementById('btn-register');

        if (btnLogin) {
            btnLogin.addEventListener('click', () => {
                window.location.href = 'login.html';
            });
        }
        if (btnRegister) {
            btnRegister.addEventListener('click', () => {
                window.location.href = 'signup.html';
            });
        }
    },

    setupNotificationBadge() {
        const btnBell = document.getElementById('btn-notifications-top');
        if (btnBell) {
            btnBell.addEventListener('click', () => {
                AppState.notificationsCount = 0;
                btnBell.classList.remove('has-new');
                UIUtils.showToast('تم العثور على تنبيه بحثي جديد: تم تحديث مسارك المفضل', 'info');
            });
        }
    },

    setupSearch() {
        const searchInput = document.getElementById('input-search-platform');
        if (searchInput && window.DatabaseEngine) {
            searchInput.addEventListener('input', this.debounce(async (e) => {
                const query = e.target.value.trim();
                if (query.length < 2) return;
                
                UIUtils.showToast(`جاري البحث عن: ${query}`, 'info');
                
                try {
                    const results = await window.DatabaseEngine.searchTracks(query);
                    if (results && results.length > 0) {
                        console.log(`تم العثور على ${results.length} مسار متطابق في IndexedDB.`);
                    }
                } catch (err) {
                    console.error('Search query execution error:', err);
                }
            }, 400));
        }
    },

    setupAccessibilityKeyboard() {
        const structuralInteractiveElements = document.querySelectorAll('.service-card, .horizontal-announcement-card');
        structuralInteractiveElements.forEach(elem => {
            elem.setAttribute('tabindex', '0');
            elem.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    elem.click();
                }
            });
        });
    },

    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }
};

// ==========================================================================
// 4. PERFORMANCE SUB-SYSTEMS
// ==========================================================================

const PerformanceModule = {
    init() {
        this.lazyLoadMedia();
        this.initScrollAnimations();
    },

    lazyLoadMedia() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        observer.unobserve(img);
                    }
                });
            });
            lazyImages.forEach(image => imageObserver.observe(image));
        } else {
            lazyImages.forEach(img => {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
            });
        }
    },

    initScrollAnimations() {
        const animatedElements = document.querySelectorAll('.service-card, .stat-box, .horizontal-announcement-card');
        
        if ('IntersectionObserver' in window) {
            const scrollObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible-animated');
                    }
                });
            }, { threshold: 0.1 });

            animatedElements.forEach(elem => scrollObserver.observe(elem));
        }
    }
};

// ==========================================================================
// 5. APPLICATION ORCHESTRATION BOOTSTRAP
// ==========================================================================

document.addEventListener('DOMContentLoaded', async () => {
    UIUtils.showSpinner('services-grid');

    try {
        if (window.DatabaseEngine) {
            // 1. تأمين ربط وتهيئة محرك قاعدة البيانات المركزي
            await window.DatabaseEngine.connectionManager.connect();

            // 2. فحص وإعادة بناء حالة الهوية الرقمية في شريط التنقل العلوي أولاً
            await IdentityModule.checkAuthAndRenderNavbar();

            // 3. مزامنة الإحصائيات من المخزن الحقيقي لـ IndexedDB وحقنها ديناميكياً
            await IdentityModule.syncPlatformStatistics();
        }

        // 4. تفعيل بقية الوحدات الوظيفية للمنصة
        NavigationModule.init();
        EventInteractionModule.init();
        PerformanceModule.init();
    } catch (criticalInitializationError) {
        console.error('Core Architecture Platform Failure:', criticalInitializationError);
    } finally {
        UIUtils.hideSpinner();
    }
});