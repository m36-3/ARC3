/**
 * Project: Research Tracks Platform (منصة المسارات البحثية)
 * File: login.js
 */

const LoginController = {
    emailInput: null,
    passwordInput: null,
    rememberMeCheckbox: null,
    submitBtn: null,

    init() {
        // التقاط عناصر الواجهة بدقة بعد تحميل الصفحة
        this.emailInput = document.getElementById('login-email');
        this.passwordInput = document.getElementById('login-password');
        this.rememberMeCheckbox = document.getElementById('remember-me');
        this.submitBtn = document.getElementById('btn-login-submit');

        // التحقق الفوري من وجود جلسة نشطة مسبقاً
        this.checkExistingSession();

        // ربط الحدث مباشرة بنقرة الزر لمنع أي تداخل
        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', (e) => {
                e.preventDefault(); // تأكيد حظر التحديث الافتراضي
                this.handleFormSubmit();
            });
        }

        this.emailInput?.addEventListener('input', () => this.clearError('email-error'));
        this.passwordInput?.addEventListener('input', () => this.clearError('password-error'));
    },

    checkExistingSession() {
        const sessionEmail = sessionStorage.getItem('activeUserEmail') || localStorage.getItem('remembered_research_user');
        if (sessionEmail) {
            window.location.replace('index.html'); 
        }
    },

    async handleFormSubmit() {
        const email = this.emailInput ? this.emailInput.value.trim().toLowerCase() : '';
        const password = this.passwordInput ? this.passwordInput.value : '';
        
        let hasError = false;

        if (!email || !this.validateEmail(email)) {
            this.showError('email-error', 'يرجى إدخال بريد إلكتروني أكاديمي صحيح.');
            hasError = true;
        }

        if (!password || password.length < 6) {
            this.showError('password-error', 'كلمة المرور يجب ألا تقل عن 6 رموز.');
            hasError = true;
        }

        if (hasError) return;

        this.setLoadingState(true);

        try {
            // التحقق من جهوزية محرك قاعدة البيانات المحلي في النافذة العالمية
            if (window.DatabaseEngine) {
                await window.DatabaseEngine.connectionManager.connect();
                const registeredUser = await window.DatabaseEngine.getUserByEmail(email);

                if (!registeredUser) {
                    this.showError('email-error', 'لم يتم العثور على باحث مسجل بهذا البريد.');
                    this.setLoadingState(false);
                    return;
                }

                if (registeredUser.password !== password) {
                    this.showError('password-error', 'كلمة المرور التي أدخلتها غير صحيحة.');
                    this.setLoadingState(false);
                    return;
                }

                // حفظ الجلسة بنجاح وتأمين الهوية الرقمية
                sessionStorage.setItem('activeUserEmail', email);

                if (this.rememberMeCheckbox?.checked) {
                    localStorage.setItem('remembered_research_user', email);
                    localStorage.setItem('active_user_email', email); 
                } else {
                    localStorage.removeItem('remembered_research_user');
                    localStorage.removeItem('active_user_email');
                }

                this.showFormToast('تم تسجيل الدخول بنجاح! جاري الانتقال...', 'success');
                
                // التوجيه القاطع والآمن لكسر حلقة الـ Refresh
                setTimeout(() => {
                    window.location.replace('index.html'); 
                }, 800);

            } else {
                this.showFormToast('خطأ: محرك قاعدة البيانات لم يتم تهيئته بالنظام.', 'danger');
                this.setLoadingState(false);
            }
        } catch (dbError) {
            console.error('Database Error:', dbError);
            this.showFormToast('حدث خطأ أثناء الاتصال بقاعدة البيانات المحلية.', 'danger');
            this.setLoadingState(false);
        }
    },

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },

    showError(elementId, message) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    },

    clearError(elementId) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    },

    setLoadingState(isLoading) {
        if (!this.submitBtn) return;
        if (isLoading) {
            this.submitBtn.disabled = true;
            this.submitBtn.textContent = 'جاري التحقق...';
        } else {
            this.submitBtn.disabled = false;
            this.submitBtn.textContent = 'الدخول إلى المنصة';
        }
    },

    showFormToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.style.position = 'fixed';
        toast.style.bottom = '20px';
        toast.style.right = '20px';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.color = '#fff';
        toast.style.backgroundColor = type === 'success' ? '#2ecc71' : '#e74c3c';
        toast.style.zIndex = '9999';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2500);
    }
};

// تشغيل التهيئة الموحدة
document.addEventListener('DOMContentLoaded', () => {
    LoginController.init();
});