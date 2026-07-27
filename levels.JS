document.addEventListener('DOMContentLoaded', () => {
  const levelsContainer = document.getElementById('levels-container');
  const levelCards = Array.from(document.querySelectorAll('.level-card'));
  const searchInput = document.getElementById('search-input');
  const clearSearchBtn = document.getElementById('clear-search');
  const statusFilter = document.getElementById('status-filter');
  const difficultyFilter = document.getElementById('difficulty-filter');
  const noResultsDiv = document.getElementById('no-results');
  const resetFiltersBtn = document.getElementById('reset-filters-btn');
  
  const overallPercentageEl = document.getElementById('overall-percentage');
  const overallProgressBarFill = document.querySelector('.overall-progress-card .progress-bar-fill');
  const roadmapProgressFill = document.getElementById('roadmap-progress-fill');

  // التزامن الذكي لفتح وقفل الأزرار بين الـ 9 مستويات
  const syncProgressFromLocalStorage = () => {
    const unitData = localStorage.getItem('educational_unit_2.2_progress');
    let unitPercent = 0; 

    if (unitData) {
      const progress = JSON.parse(unitData);
      const totalActivities = 10; 
      const completedCount = progress.completedIds ? progress.completedIds.length : 0;
      unitPercent = Math.round((completedCount / totalActivities) * 100);
    }

    // حساب تقدم المستويات: التمهيدي يتأثر ديناميكياً بتقدم الطالب الحالي
    const level1Percent = unitPercent;
    let level2Percent = 0; 

    // --- تحديث المستوى الأول التمهيدي (data-level="1") ---
    const level1Card = document.querySelector('.level-card[data-level="1"]');
    if (level1Card) {
      const progressValEl = level1Card.querySelector('.level-progress-section .progress-value');
      const progressBarFill = level1Card.querySelector('.level-progress-section .progress-bar-fill');
      const badge = level1Card.querySelector('.status-badge');
      const actionArea = level1Card.querySelector('.dynamic-action-area');
      
      if (progressValEl && progressBarFill) {
        progressValEl.textContent = `${level1Percent}%`;
        progressBarFill.style.width = `${level1Percent}%`;
      }

      if (level1Percent < 100) {
        level1Card.dataset.status = 'current';
        if (badge) {
          badge.className = 'status-badge badge-current';
          badge.innerHTML = '<i class="fas fa-play-circle"></i> قيد الدراسة';
        }
        if (actionArea) {
          actionArea.innerHTML = `<a href="unit1.html" class="btn btn-primary">استئناف التعلم <i class="fas fa-arrow-left"></i></a>`;
        }
      } else {
        level1Card.dataset.status = 'completed';
        if (badge) {
          badge.className = 'status-badge badge-completed';
          badge.innerHTML = '<i class="fas fa-check-circle"></i> مكتمل';
        }
        if (actionArea) {
          actionArea.innerHTML = `<a href="unit1.html" class="btn btn-primary-outline">مراجعة المنهج</a>`;
        }
      }
    }

    // --- تحديث المستوى الثاني (data-level="2") ---
    const level2Card = document.querySelector('.level-card[data-level="2"]');
    if (level2Card) {
      const progressValEl = level2Card.querySelector('.level-progress-section .progress-value');
      const progressBarFill = level2Card.querySelector('.level-progress-section .progress-bar-fill');
      const badge = level2Card.querySelector('.status-badge');
      const actionArea = level2Card.querySelector('.dynamic-action-area');

      if (level1Percent < 100) {
        level2Card.dataset.status = 'locked';
        if (badge) {
          badge.className = 'status-badge badge-locked';
          badge.innerHTML = '<i class="fas fa-lock"></i> مغلق';
        }
        if (actionArea) {
          actionArea.innerHTML = `<button class="btn btn-disabled" disabled><i class="fas fa-lock"></i> مغلق بانتظار المتطلبات</button>`;
        }
      } else {
        level2Card.dataset.status = 'current';
        if (badge) {
          badge.className = 'status-badge badge-current';
          badge.innerHTML = '<i class="fas fa-play-circle"></i> استئناف التعلم';
        }
        if (actionArea) {
          actionArea.innerHTML = `<a href="level2.html" class="btn btn-primary">استئناف التعلم <i class="fas fa-arrow-left"></i></a>`;
        }
      }
    }

    // حساب النسبة الإجمالية للمنهج من أصل 9 مستويات كاملة
    const totalCurriculumProgress = Math.round((level1Percent + level2Percent) / 9);
    
    if (overallPercentageEl) overallPercentageEl.textContent = `${totalCurriculumProgress}%`;
    if (overallProgressBarFill) overallProgressBarFill.style.width = `${totalCurriculumProgress}%`;
    if (roadmapProgressFill) roadmapProgressFill.style.height = `${totalCurriculumProgress}%`;
  };

  syncProgressFromLocalStorage();

  // ميزة التوسيع والعرض التفصيلي للمنهج الدراسي
  if (levelsContainer) {
    levelsContainer.addEventListener('click', (event) => {
      const toggleBtn = event.target.closest('.toggle-details-btn');
      if (!toggleBtn) return;

      const cardMain = toggleBtn.closest('.level-card-main');
      const expandedDetails = cardMain.querySelector('.level-expanded-details');
      const chevronIcon = toggleBtn.querySelector('.transition-icon');
      const textSpan = toggleBtn.querySelector('span');

      const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';

      if (isExpanded) {
        if (expandedDetails) expandedDetails.style.display = 'none';
        toggleBtn.setAttribute('aria-expanded', 'false');
        if (chevronIcon) chevronIcon.classList.remove('rotate-180');
        if (textSpan) textSpan.textContent = 'عرض ملخص المنهج';
      } else {
        if (expandedDetails) expandedDetails.style.display = 'block';
        toggleBtn.setAttribute('aria-expanded', 'true');
        if (chevronIcon) chevronIcon.classList.add('rotate-180');
        if (textSpan) textSpan.textContent = 'إخفاء ملخص المنهج';
      }
    });
  }

  // فلاتر التصفية والبحث
  const filterLevels = () => {
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const activeStatus = statusFilter ? statusFilter.value : 'all';
    const activeDifficulty = difficultyFilter ? difficultyFilter.value : 'all';

    let visibleCardsCount = 0;

    levelCards.forEach(card => {
      const titleEl = card.querySelector('.level-title');
      const descEl = card.querySelector('.level-description');
      
      const cardTitle = titleEl ? titleEl.textContent.toLowerCase() : '';
      const cardDesc = descEl ? descEl.textContent.toLowerCase() : '';
      const cardStatus = card.dataset.status || '';
      const cardDifficulty = card.dataset.difficulty || '';

      const matchesSearch = searchTerm === '' || cardTitle.includes(searchTerm) || cardDesc.includes(searchTerm);
      const matchesStatus = activeStatus === 'all' || cardStatus === activeStatus;
      const matchesDifficulty = activeDifficulty === 'all' || cardDifficulty === activeDifficulty;

      if (matchesSearch && matchesStatus && matchesDifficulty) {
        card.style.display = 'block';
        visibleCardsCount++;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResultsDiv) {
      noResultsDiv.style.display = visibleCardsCount === 0 ? 'block' : 'none';
    }
  };

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      if (clearSearchBtn) clearSearchBtn.style.display = searchInput.value.length > 0 ? 'block' : 'none';
      filterLevels();
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearSearchBtn.style.display = 'none';
      filterLevels();
    });
  }

  if (statusFilter) statusFilter.addEventListener('change', filterLevels);
  if (difficultyFilter) difficultyFilter.addEventListener('change', filterLevels);
});