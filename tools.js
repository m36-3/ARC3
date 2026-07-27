/* ==========================================================================
   محرك صفحة الأدوات المساعدة والتصفية الذكية - منصة المسارات البحثية
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. نظام تشغيل القوائم المنسدلة لليوتيوب داخل الكروت
    // ==========================================
    const dropdownTriggers = document.querySelectorAll('.dropdown-trigger-btn');

    dropdownTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            // منع أي تداخل برمي محتمل
            e.stopPropagation();
            
            const dropdownWrapper = trigger.parentElement;
            const contentList = dropdownWrapper.querySelector('.dropdown-content-list');
            
            // التحقق من حالة القائمة الحالية (مفتوحة أم مغلقة)
            const isOpen = contentList.style.display === 'block';
            
            // إغلاق أي قائمة منسدلة أخرى مفتوحة في الصفحة لإعطاء تجربة مستخدم نظيفة
            document.querySelectorAll('.dropdown-content-list').forEach(list => {
                list.style.display = 'none';
            });
            document.querySelectorAll('.dropdown-trigger-btn').forEach(btn => {
                btn.classList.remove('is-active');
            });

            // إذا كانت مغلقة، قم بفتحها
            if (!isOpen) {
                contentList.style.display = 'block';
                trigger.classList.add('is-active');
            }
        });
    });

    // إغلاق القوائم المنسدلة تلقائياً إذا ضغط المستخدم في أي مكان فارغ بالصفحة
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown-content-list').forEach(list => {
            list.style.display = 'none';
        });
        document.querySelectorAll('.dropdown-trigger-btn').forEach(btn => {
            btn.classList.remove('is-active');
        });
    });


    // ==========================================
    // 2. نظام تصفية وفرز الكروت بناءً على التصنيف (Tabs Filter)
    // ==========================================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const toolCards = document.querySelectorAll('.tool-card');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 1. تحديث زر التبويب النشط
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // 2. الحصول على اسم التصنيف المطلوب تصفيتة
            const filterValue = button.getAttribute('data-filter');

            // 3. فرز الكروت بحركات تأثيرية سلسة
            toolCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');

                if (filterValue === 'all' || cardCategory === filterValue) {
                    // إظهار الكرت
                    card.style.display = 'flex';
                    // إضافة حركة ظهور خفيفة مريحة للعين
                    card.style.opacity = '0';
                    setTimeout(() => {
                        card.style.transition = 'opacity 0.4s ease';
                        card.style.opacity = '1';
                    }, 10);
                } else {
                    // إخفاء الكرت
                    card.style.display = 'none';
                }
            });
        });
    });

});