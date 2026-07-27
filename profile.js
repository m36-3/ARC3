/**
 * Project: Research Tracks Platform (منصة المسارات البحثية)
 * File: profile.js
 * Role: Senior JavaScript Engineer (Profile Management & Session Lifecycle Architecture)
 * Description: Production-ready Vanilla ES6 architecture module providing fully asynchronous
 *              dynamic profile rendering from the centralized DatabaseEngine, session checking,
 *              clipboard management, and clean API abstraction hooks for seamless future REST transitions.
 */

// ==========================================================================
// 1. DATA ACCESS LAYER & REST-READY ABSTRACTION (CENTRALIZED)
// ==========================================================================
import { DatabaseEngine } from './database.js';

/**
 * Service Provider layer abstracting storage access. 
 * Can be swapped with fetch() / Axios REST endpoints without changing application controller code.
 */
const ProfileService = {
    /**
     * Fetches current authenticated user profile context session using the central Database Engine.
     * REST Translation: return fetch('/api/profile/me', { headers: AuthHeaders }).then(res => res.json());
     * @returns {Promise<object|null>}
     */
    async fetchSessionUser() {
        const sessionEmail = sessionStorage.getItem('activeUserEmail') || localStorage.getItem('remembered_research_user');
        if (!sessionEmail) return null;

        try {
            // الاستعلام المباشر والآمن عبر المحرك المركزي المشترك للمنصة
            return await DatabaseEngine.getUserByEmail(sessionEmail.toLowerCase().trim());
        } catch (error) {
            console.error('ProfileService Session Fetch Error:', error);
            return null;
        }
    },

    /**
     * Updates profile criteria indices via Centralized Database Engine.
     * REST Translation: return fetch('/api/profile/update', { method: 'PUT', body: JSON.stringify(data) });
     * @param {object} updatedProfileData 
     * @returns {Promise<boolean>}
     */
    async updateProfile(updatedProfileData) {
        try {
            // الاستفادة من دالة الحفظ/التعديل المركزية في كود الداتابيز الموحد
            await DatabaseEngine.saveUser(updatedProfileData);
            return true;
        } catch (error) {
            console.error('ProfileService Update Error:', error);
            throw new Error('فشل تعديل بيانات الحساب الشخصية في قاعدة البيانات الموحدة.');
        }
    },

    /**
     * Destroys localized identity access tokens or global state pointers.
     * REST Translation: return fetch('/api/auth/logout', { method: 'POST' });
     */
    async logoutSession() {
        sessionStorage.removeItem('activeUserEmail');
        // ملاحظة: نترك 'remembered_research_user' في الـ localStorage إذا كان المستخدم قد اختار "تذكرني" لتسهيل العودة لاحقاً.
        return true;
    }
};

// ==========================================================================
// 2. UI UTILITIES & INTERACTION SUB-SYSTEMS
// ==========================================================================

const UIUtils = {
    /**
     * Renders standard production status notification toast alerts.
     * @param {string} message 
     * @param {'success'|'error'|'info'} type 
     */
    showToast(message, type = 'success') {
        const existingToast = document.getElementById('toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.dir = 'rtl';
        toast.textContent = message;

        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#0f4c81'
        };

        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors[type] || colors.info,
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: '1000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '15px',
            transition: 'all 0.3s ease'
        });

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    /**
     * Dynamic text copy utility utilizing modern clipboard platform APIs with fallback routing criteria.
     * @param {string} textValue 
     */
    async copyToClipboard(textValue) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(textValue);
                this.showToast('تم نسخ رقم الحساب المميز بنجاح', 'success');
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = textValue;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                textArea.remove();
                if (successful) {
                    this.showToast('تم نسخ رقم الحساب المميز بنجاح', 'success');
                } else {
                    throw new Error();
                }
            }
        } catch (err) {
            this.showToast('فشل عملية النسخ التلقائي لمحدد الحساب', 'error');
        }
    }
};

// ==========================================================================
// 3. PROFILE MANAGEMENT & CONTROL FLOW LIFECYCLE
// ==========================================================================

const ProfileController = {
    userState: null,

    async init() {
        try {
            await this.loadActiveUserSession();
            this.bindInteractiveActions();
        } catch (error) {
            UIUtils.showToast('حدث خطأ فني غير متوقع أثناء تحميل البيانات.', 'error');
        }
    },

    /**
     * Resolves localized context user model to safely initialize view parsing configurations.
     */
    async loadActiveUserSession() {
        const user = await ProfileService.fetchSessionUser();
        
        if (!user) {
            UIUtils.showToast('جلسة العمل منتهية الصلاحية، يرجى تسجيل الدخول.', 'error');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return;
        }

        this.userState = user;
        this.renderUserProfileView(user);
    },

    /**
     * Map data indices cleanly into validated structural Document Elements IDs.
     * @param {object} user 
     */
    renderUserProfileView(user) {
        const domMappings = {
            avatarLetter: document.getElementById('txt-profile-avatar-letter'),
            userName: document.getElementById('txt-profile-user-name'),
            userEmail: document.getElementById('txt-profile-user-email'),
            userId: document.getElementById('txt-profile-user-id'),
            papersCount: document.getElementById('txt-metric-papers-count')
        };

        if (domMappings.avatarLetter) domMappings.avatarLetter.textContent = user.avatar || user.name.charAt(0).toUpperCase();
        if (domMappings.userName) domMappings.userName.textContent = user.name;
        if (domMappings.userEmail) domMappings.userEmail.textContent = user.email;
        if (domMappings.userId) domMappings.userId.textContent = user.id || 'N/A';
        if (domMappings.papersCount) domMappings.papersCount.textContent = user.publishedPapers ?? 0;
    },

    /**
     * Attaches structural events management handling to user interaction control targets.
     */
    bindInteractiveActions() {
        const btnCopy = document.getElementById('btn-copy-user-id');
        if (btnCopy) {
            btnCopy.addEventListener('click', () => {
                if (this.userState && this.userState.id) {
                    UIUtils.copyToClipboard(this.userState.id);
                }
            });
        }

        const btnLogout = document.getElementById('menu-item-logout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogoutConfirmation();
            });
        }

        const btnEditProfile = document.getElementById('btn-link-edit-profile');
        if (btnEditProfile) {
            btnEditProfile.addEventListener('click', (e) => {
                // خطاف مستقبلي: الاحتفاظ ببيانات التعديل إذا كانت صفحة التعديل منفصلة
                if (this.userState) {
                    sessionStorage.setItem('editTargetUserEmail', this.userState.email);
                }
            });
        }
    },

    /**
     * Implements an accessible modal/native confirm workflow for destructive runtime operations.
     */
    async handleLogoutConfirmation() {
        const confirmLogout = confirm('هل أنت متأكد من رغبتك في تسجيل الخروج من منصة المسارات البحثية؟');
        if (!confirmLogout) return;

        try {
            await ProfileService.logoutSession();
            UIUtils.showToast('تم تسجيل الخروج بنجاح. نراك قريباً!', 'success');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        } catch (err) {
            UIUtils.showToast('فشل في إنهاء الدورة الفنية بشكل كامل.', 'error');
        }
    }
};

// ==========================================================================
// 4. APPLICATION CORE ENGINE STARTUP INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    ProfileController.init();
});