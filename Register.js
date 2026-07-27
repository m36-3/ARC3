/**
 * Project: Research Tracks Platform (منصة المسارات البحثية)
 * File: register.js
 * Role: Senior JavaScript Engineer (Authentication & Onboarding Architecture)
 * Description: Clean, production-ready Vanilla ES6 architecture module providing fully accessible,
 *              asynchronous dynamic user onboarding powered by the centralized DatabaseEngine.
 */

// ==========================================================================
// 1. DATA LAYERS & DEPENDENCIES
// ==========================================================================
import { DatabaseEngine } from './database.js';

// ==========================================================================
// 2. UI UTILITIES & TOAST ALERTS SUB-SYSTEM
// ==========================================================================
const UIUtils = {
    showToast(message, type = 'success') {
        const existingToast = document.getElementById('toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.className = `toast toast-${type}`;
        toast.setAttribute('role', 'alert');
        toast.dir = 'rtl';
        toast.textContent = message; // Safe text assignment avoiding XSS layers

        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: type === 'success' ? '#10b981' : '#ef4444',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            zIndex: '1000',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            fontSize: '15px'
        });

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    },

    toggleSpinner(buttonId, show) {
        const button = document.getElementById(buttonId);
        if (!button) return;

        if (show) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            
            // Build elements securely through safe structural nodes
            const spinnerSpan = document.createElement('span');
            spinnerSpan.className = 'spinner-loader';
            spinnerSpan.setAttribute('aria-hidden', 'true');
            
            button.textContent = '';
            button.appendChild(spinnerSpan);
            button.appendChild(document.createTextNode(' جاري إنشاء الحساب...'));
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || button.textContent;
        }
    },

    showInputError(inputId, message) {
        const inputElement = document.getElementById(inputId);
        if (!inputElement) return;

        inputElement.classList.add('input-error');
        inputElement.setAttribute('aria-invalid', 'true');

        const errorId = `${inputId}-error-text`;
        let errorElement = document.getElementById(errorId);
        
        if (!errorElement) {
            errorElement = document.createElement('span');
            errorElement.id = errorId;
            errorElement.className = 'error-message-text';
            errorElement.style.color = '#ef4444';
            errorElement.style.fontSize = '12px';
            errorElement.style.marginTop = '4px';
            errorElement.style.display = 'block';
            inputElement.parentNode.appendChild(errorElement);
        }
        
        errorElement.textContent = message;
        inputElement.setAttribute('aria-describedby', errorId); // Screen Reader Adaptive
    },

    clearInputError(inputId) {
        const inputElement = document.getElementById(inputId);
        if (!inputElement) return;

        inputElement.classList.remove('input-error');
        inputElement.removeAttribute('aria-invalid');
        inputElement.removeAttribute('aria-describedby');
        
        const errorElement = document.getElementById(`${inputId}-error-text`);
        if (errorElement) errorElement.remove();
    }
};

// ==========================================================================
// 3. VALIDATION ENGINE & ID ENGINE GENERATOR
// ==========================================================================
const ValidationEngine = {
    validateName(name) {
        if (!name.trim()) return 'الاسم الكامل مطلوب.';
        if (name.trim().split(/\s+/).length < 2) return 'يرجى إدخال الاسم الثنائي على الأقل.';
        return null;
    },

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) return 'البريد الإلكتروني مطلوب.';
        if (!emailRegex.test(email)) return 'يرجى إدخال بريد إلكتروني صحيح المفهوم.';
        return null;
    },

    validatePhone(phone) {
        if (!phone.trim()) return 'رقم الهاتف مطلوب.';
        if (!/^\d{10,15}$/.test(phone.replace(/[\s-+]/g, ''))) return 'يرجى إدخال رقم هاتف صالح للاستخدام.';
        return null;
    },

    validateSelection(value, fieldName) {
        if (!value || value === '') return `يرجى تحديد اختيار ${fieldName}.`;
        return null;
    },

    validateUniversity(university) {
        if (!university.trim()) return 'اسم المؤسسة التعليمية أو الجامعة مطلوب.';
        return null;
    },

    validatePassword(password) {
        if (!password) return 'كلمة المرور مطلوبة.';
        if (password.length < 8) return 'يجب ألا تقل كلمة المرور عن 8 رموز.';
        if (!/[A-Z]/.test(password)) return 'يجب أن تحتوي كلمة المرور على حرف كبير واحد (Uppercase) على الأقل.';
        if (!/[a-z]/.test(password)) return 'يجب أن تحتوي كلمة المرور على حرف صغير واحد (Lowercase) على الأقل.';
        if (!/\d/.test(password)) return 'يجب أن تحتوي كلمة المرور على رقم واحد على الأقل.';
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'يجب أن تحتوي كلمة المرور على رمز خاص واحد على الأقل.';
        return null;
    },

    generateUnique8DigitID() {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    }
};

// ==========================================================================
// 4. CONTROLLER MANAGEMENT LIFECYCLE
// ==========================================================================
const RegisterController = {
    init() {
        this.setupFormSubmission();
        this.setupPasswordVisibilityToggles();
        this.setupRealtimeValidationCleanup();
    },

    setupFormSubmission() {
        const form = document.getElementById('form-user-register');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // DOM Component Dynamic Extractor Hook
            const fields = {
                name: document.getElementById('input-register-name'),
                email: document.getElementById('input-register-email'),
                phone: document.getElementById('input-register-phone'),
                country: document.getElementById('select-register-country'),
                university: document.getElementById('input-register-university'),
                interest: document.getElementById('select-register-interest'),
                gender: document.getElementById('select-register-gender'),
                password: document.getElementById('input-register-password'),
                confirm: document.getElementById('input-register-confirm'),
                agreement: document.getElementById('chk-agreement-policy')
            };

            // Clear absolute structural visual errors
            Object.keys(fields).forEach(key => {
                if (fields[key]) UIUtils.clearInputError(fields[key].id);
            });

            // Sequential Validation System Pipeline Runs
            let hasErrors = false;

            const nameErr = ValidationEngine.validateName(fields.name.value);
            if (nameErr) { UIUtils.showInputError(fields.name.id, nameErr); hasErrors = true; }

            const emailErr = ValidationEngine.validateEmail(fields.email.value);
            if (emailErr) { UIUtils.showInputError(fields.email.id, emailErr); hasErrors = true; }

            const phoneErr = ValidationEngine.validatePhone(fields.phone.value);
            if (phoneErr) { UIUtils.showInputError(fields.phone.id, phoneErr); hasErrors = true; }

            const countryErr = ValidationEngine.validateSelection(fields.country.value, 'الدولة');
            if (countryErr) { UIUtils.showInputError(fields.country.id, countryErr); hasErrors = true; }

            const uniErr = ValidationEngine.validateUniversity(fields.university.value);
            if (uniErr) { UIUtils.showInputError(fields.university.id, uniErr); hasErrors = true; }

            const interestErr = ValidationEngine.validateSelection(fields.interest.value, 'المجال البحثي');
            if (interestErr) { UIUtils.showInputError(fields.interest.id, interestErr); hasErrors = true; }

            const genderErr = ValidationEngine.validateSelection(fields.gender.value, 'الجنس');
            if (genderErr) { UIUtils.showInputError(fields.gender.id, genderErr); hasErrors = true; }

            const passErr = ValidationEngine.validatePassword(fields.password.value);
            if (passErr) { UIUtils.showInputError(fields.password.id, passErr); hasErrors = true; }

            if (!passErr && fields.password.value !== fields.confirm.value) {
                UIUtils.showInputError(fields.confirm.id, 'كلمات المرور غير متطابقة.');
                hasErrors = true;
            }

            if (fields.agreement && !fields.agreement.checked) {
                UIUtils.showInputError(fields.agreement.id, 'يجب الموافقة على الشروط والأحكام للاستمرار.');
                hasErrors = true;
            }

            if (hasErrors) return;

            UIUtils.toggleSpinner('btn-submit-register', true);

            try {
                // 1. التحقق من البريد الإلكتروني باستخدام المحرك المركزي الموحد
                const cleanEmail = fields.email.value.toLowerCase().trim();
                const isDuplicate = await DatabaseEngine.getUserByEmail(cleanEmail);
                
                if (isDuplicate) {
                    UIUtils.showInputError(fields.email.id, 'هذا البريد الإلكتروني مسجل بالفعل.');
                    UIUtils.toggleSpinner('btn-submit-register', false);
                    return;
                }

                // بناء كائن البيانات للمستخدم الجديد
                const firstLetter = fields.name.value.trim().charAt(0).toUpperCase();
                const uniqueId = ValidationEngine.generateUnique8DigitID();

                const newUserProfile = {
                    id: uniqueId,
                    name: fields.name.value.trim(),
                    email: cleanEmail,
                    phone: fields.phone.value.trim(),
                    country: fields.country.value,
                    university: fields.university.value.trim(),
                    researchInterest: fields.interest.value,
                    gender: fields.gender.value,
                    password: fields.password.value, // ينصح بتشفيرها وتمليحها (Hashing & Salting) في بيئات الإنتاج
                    avatar: firstLetter,
                    achievements: 0,
                    publishedPapers: 0,
                    projects: 0,
                    notifications: 0,
                    role: 'Researcher',
                    timestamp: new Date().toISOString()
                };

                // 2. حفظ ملف المستخدم في مستودع قاعدة البيانات المركزي الموحد
                await DatabaseEngine.createUser(newUserProfile);

                UIUtils.showToast('تم إنشاء الحساب بنجاح! جاري تحويلك لصفحة الدخول...', 'success');
                
                // حفظ البريد الإلكتروني في الجلسة لتسهيل عمليات الدخول التالية
                sessionStorage.setItem('activeUserEmail', newUserProfile.email);

                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 2000);

            } catch (err) {
                console.error('Account Creation Context Exception:', err);
                UIUtils.showToast('فشل إكمال عملية التسجيل نظراً لخطأ داخلي، يرجى إعادة المحاولة لاحقاً.', 'error');
            } finally {
                UIUtils.toggleSpinner('btn-submit-register', false);
            }
        });
    },

    setupPasswordVisibilityToggles() {
        const toggles = [
            { btnId: 'btn-toggle-password', inputId: 'input-register-password' },
            { btnId: 'btn-toggle-confirm', inputId: 'input-register-confirm' }
        ];

        toggles.forEach(toggle => {
            const btn = document.getElementById(toggle.btnId);
            const input = document.getElementById(toggle.inputId);

            if (btn && input) {
                btn.addEventListener('click', () => {
                    const isPrivate = input.type === 'password';
                    input.type = isPrivate ? 'text' : 'password';
                    btn.setAttribute('aria-label', isPrivate ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور');
                    
                    const eyeIcon = btn.querySelector('.eye-icon');
                    if (eyeIcon) {
                        eyeIcon.style.opacity = isPrivate ? '0.6' : '1';
                    }
                });
            }
        });
    },

    setupRealtimeValidationCleanup() {
        const targetIds = [
            'input-register-name', 'input-register-email', 'input-register-phone',
            'select-register-country', 'input-register-university', 'select-register-interest',
            'select-register-gender', 'input-register-password', 'input-register-confirm',
            'chk-agreement-policy'
        ];

        targetIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                const eventType = el.tagName === 'SELECT' || el.type === 'checkbox' ? 'change' : 'input';
                el.addEventListener(eventType, () => UIUtils.clearInputError(id));
            }
        });
    }
};

// ==========================================================================
// 5. APPLICATION INITIALIZATION ENGINE
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    RegisterController.init();
});