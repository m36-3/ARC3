document.addEventListener('DOMContentLoaded', () => {
    // =========================================
    // إعدادات عامة
    // =========================================
    const STORAGE_KEY = 'educational_unit_2.2_progress';
    
    // مصفوفة ملفات المقالات للـ 8 أنشطة الحالية
    const articleFiles = [
        "UNIT01/article011.html",
        "UNIT01/article012.HTML",
        "UNIT01/article013.HTML",
        "UNIT01/article014.HTML",
        "UNIT01/article015.HTML",
        "UNIT01/article016.HTML",
        "UNIT01/article017.HTML",
        "UNIT01/article018.HTML"
    ];

    // البنية الافتراضية للتقدم
    let unitProgress = {
        currentActiveId: 1, 
        completedIds: []    
    };

    // =========================================
    // تحميل البيانات المخزنة مسبقاً
    // =========================================
    const loadProgressFromStorage = () => {
        const data = localStorage.getItem(STORAGE_KEY);
        if (!data) {
            saveProgressToStorage();
            return;
        }

        try {
            const saved = JSON.parse(data);
            unitProgress.currentActiveId = saved.currentActiveId || 1;
            unitProgress.completedIds = Array.isArray(saved.completedIds) ? saved.completedIds : [];
        } catch (err) {
            console.error("Error parsing progress data:", err);
            unitProgress = { currentActiveId: 1, completedIds: [] };
        }
    };

    // =========================================
    // حفظ التحديثات في الذاكرة المحلية
    // =========================================
    const saveProgressToStorage = () => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(unitProgress));
    };

    // --- عناصر الـ DOM المستهدفة ---
    const activityCards = Array.from(document.querySelectorAll('.activity-row-card'));
    const timelineItems = Array.from(document.querySelectorAll('#sidebar-timeline-list .timeline-item'));
    const radialProgressBar = document.getElementById('radial-progress-bar');
    const radialPercentageText = document.getElementById('radial-percentage-text');
    const toastContainer = document.getElementById('toast-container');
    const btnPrev = document.getElementById('btn-prev-activity');
    const btnNext = document.getElementById('btn-next-activity');
    const currentStepIndicator = document.getElementById('current-step-indicator');
    const wrapper = document.getElementById('activities-wrapper');

    // =========================================
    // واجهة التحكم وتعديل المظهر التفاعلي (UI Controller)
    // =========================================
    const updateWorkspaceUI = () => {
        const { currentActiveId, completedIds } = unitProgress;

        // 1. تحديث بطاقات الأنشطة
        activityCards.forEach(card => {
            const cardId = parseInt(card.dataset.id, 10);
            const actionArea = card.querySelector('.activity-action-area');
            const badge = card.querySelector('.status-text-badge');

            if (!cardId) return;

            card.className = 'activity-row-card';
            if (actionArea) actionArea.innerHTML = '';
            if (badge) badge.className = 'status-text-badge';

            if (completedIds.includes(cardId)) {
                card.classList.add('completed-state');
                if (badge) {
                    badge.classList.add('completed');
                    badge.innerHTML = '<i class="fas fa-check-circle"></i> مكتمل';
                }
                if (actionArea) {
                    const article = articleFiles[cardId - 1] || "#";
                    actionArea.innerHTML = `<a href="${article}" class="btn btn-primary-outline review-article-btn" data-article="${article}">مراجعة المقال</a>`;
                }
            } else if (cardId === currentActiveId) {
                card.classList.add('current-state');
                if (badge) {
                    badge.classList.add('current');
                    badge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> الخطوة التالية النشطة';
                }
                if (actionArea) {
                    const article = articleFiles[cardId - 1] || "#";
                    if (cardId <= articleFiles.length) {
                        actionArea.innerHTML = `<a href="${article}" class="btn btn-primary read-article-btn">قراءة المقال <i class="fas fa-arrow-left"></i></a>`;
                    } else {
                        actionArea.innerHTML = `<button class="btn btn-primary complete-action-btn" data-id="${cardId}">تحديد كمكتمل <i class="fas fa-check"></i></button>`;
                    }
                }
            } else {
                card.classList.add('locked-state');
                if (badge) {
                    badge.classList.add('locked');
                    badge.innerHTML = '<i class="fas fa-lock"></i> مغلق بانتظار التقدم';
                }
                if (actionArea) {
                    actionArea.innerHTML = `<button class="btn btn-disabled" disabled><i class="fas fa-lock"></i> مغلق</button>`;
                }
            }
        });

        // 2. تحديث الخط الزمني في الـ Sidebar (مع إخفاء العناصر الزائدة إن وجدت)
        timelineItems.forEach(item => {
            const targetVal = parseInt(item.dataset.target, 10);
            const dot = item.querySelector('.status-indicator-dot');
            
            // إذا كان العنصر في القائمة الجانبية يتجاوز عدد الأنشطة المتاحة (8)، قم بإخفائه لتجنب الأخطاء
            if (targetVal > activityCards.length) {
                item.style.display = 'none';
                return;
            }

            item.className = 'timeline-item';
            if (!dot) return;

            if (completedIds.includes(targetVal)) {
                item.classList.add('completed');
                dot.innerHTML = '<i class="fas fa-check"></i>';
            } else if (targetVal === currentActiveId) {
                item.classList.add('current');
                dot.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            } else {
                item.classList.add('locked');
                dot.innerHTML = `<i class="fas fa-lock"></i>`;
            }
        });

        // 3. نسبة الإنجاز
        const totalCount = activityCards.length;
        const progressPercent = totalCount > 0 ? Math.round((completedIds.length / totalCount) * 100) : 0;

        if (radialProgressBar) {
            radialProgressBar.style.strokeDasharray = `${progressPercent},100`;
        }
        if (radialPercentageText) {
            radialPercentageText.textContent = `${progressPercent}%`;
        }

        // 4. الخطوة الحالية
        if (currentStepIndicator) {
            currentStepIndicator.innerHTML = `النشاط الفعّال: <strong>الخطوة ${currentActiveId} من ${totalCount}</strong>`;
        }

        // 5. أزرار السابق والتالي
        if (btnPrev) {
            btnPrev.disabled = (currentActiveId === 1);
            btnPrev.className = (currentActiveId === 1) ? "btn btn-disabled" : "btn btn-secondary";
        }

        if (btnNext) {
            const lockedNext = (currentActiveId === totalCount && !completedIds.includes(totalCount));
            btnNext.disabled = lockedNext;
            btnNext.className = lockedNext ? "btn btn-disabled" : "btn btn-primary";
        }
    };

    // =========================================
    // التنبيهات (Toast Notifications)
    // =========================================
    const triggerToast = (title, xp) => {
        if (!toastContainer) return;

        const toast = document.createElement("div");
        toast.className = "toast-badge";
        toast.innerHTML = `
            <i class="fas fa-star toast-icon"></i>
            <div class="toast-content">
                <h4>${title}</h4>
                <p>لقد حصلت على +${xp} نقطة خبرة إضافية!</p>
            </div>
        `;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3200);
    };

    // =========================================
    // إكمال النشاط وفتح التالي
    // =========================================
    const completeCurrentActivity = (id) => {
        if (unitProgress.completedIds.includes(id)) return;

        const currentCard = document.getElementById(`activity-${id}`) || document.querySelector(`[data-id="${id}"]`);
        const xpReward = currentCard ? parseInt(currentCard.dataset.xp, 10) || 0 : 0;

        unitProgress.completedIds.push(id);

        if (id < activityCards.length) {
            unitProgress.currentActiveId = id + 1;
        }

        saveProgressToStorage();
        updateWorkspaceUI();

        if (xpReward > 0) {
            triggerToast("تم إنجاز الخطوة بنجاح!", xpReward);
        }
    };

    // =========================================
    // الانتقال السلس للكرت
    // =========================================
    const scrollToCardElement = (element) => {
        const yOffset = -100;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({
            top: y,
            behavior: "smooth"
        });
    };

    // =========================================
    // تشغيل الصفحة الأولى
    // =========================================
    loadProgressFromStorage();
    updateWorkspaceUI();

    // =========================================
    // أحداث الخط الزمني
    // =========================================
    timelineItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetVal = parseInt(item.dataset.target, 10);
            if (unitProgress.completedIds.includes(targetVal) || targetVal === unitProgress.currentActiveId) {
                const card = document.getElementById(`activity-${targetVal}`) || document.querySelector(`[data-id="${targetVal}"]`);
                if (card) {
                    scrollToCardElement(card);
                }
            }
        });
    });

    // =========================================
    // أحداث البطاقات (التفويض عبر Wrapper)
    // =========================================
    if (wrapper) {
        wrapper.addEventListener("click", event => {
            const readBtn = event.target.closest(".read-article-btn");
            if (readBtn) {
                event.preventDefault();
                const currentCard = readBtn.closest('.activity-row-card');
                const targetUrl = readBtn.getAttribute("href");
                
                if (currentCard) {
                    const id = parseInt(currentCard.dataset.id, 10);
                    completeCurrentActivity(id);
                }

                if (targetUrl && targetUrl !== "#") {
                    setTimeout(() => {
                        window.location.href = targetUrl;
                    }, 200);
                }
            }

            const completeBtn = event.target.closest(".complete-action-btn");
            if (completeBtn) {
                const id = parseInt(completeBtn.dataset.id, 10);
                completeCurrentActivity(id);
            }

            const reviewBtn = event.target.closest(".review-article-btn");
            if (reviewBtn) {
                const article = reviewBtn.dataset.article;
                if (article) {
                    window.location.href = article;
                }
            }
        });
    }

    // =========================================
    // زر التالي والسابق
    // =========================================
    if (btnNext) {
        btnNext.addEventListener("click", () => {
            const card = document.getElementById(`activity-${unitProgress.currentActiveId}`) || document.querySelector(`[data-id="${unitProgress.currentActiveId}"]`);
            if (card) {
                scrollToCardElement(card);
            }
        });
    }

    if (btnPrev) {
        btnPrev.addEventListener("click", () => {
            if (unitProgress.currentActiveId > 1) {
                unitProgress.currentActiveId--;
                saveProgressState(); // أو دالة الحفظ المعتمدة
                saveProgressToStorage();
                updateWorkspaceUI();

                const card = document.getElementById(`activity-${unitProgress.currentActiveId}`) || document.querySelector(`[data-id="${unitProgress.currentActiveId}"]`);
                if (card) {
                    scrollToCardElement(card);
                }
            }
        });
    }
});
