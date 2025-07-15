document.addEventListener('DOMContentLoaded', function () {
  const searchBar = document.getElementById('search-bar');
  const input = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search');
  const results = document.getElementById('search-results');

  const data = [
    { title: "Artwork 1", link: "artwork1.html", image: "assets/Sample.jpg" },
    { title: "Artwork 2", link: "artwork2.html", image: "assets/Sample.jpg" },
    { title: "Artwork 3", link: "artwork3.html", image: "assets/Sample.jpg" },
    { title: "Artwork 4", link: "artwork4.html", image: "assets/Sample.jpg" },
    { title: "Artwork 5", link: "artwork5.html", image: "assets/Sample.jpg" }
  ];

  let currentIndex = -1;
  let isSearchResults = false;

  window.toggleSearch = function () {
    searchBar.classList.toggle('hidden');
    input.value = '';
    results.innerHTML = '';
    clearBtn.style.display = 'none';

    if (!searchBar.classList.contains('hidden')) {
      input.focus();
      renderRecommendations(data);
      isSearchResults = false;
    }
  };

  input.addEventListener('input', function () {
    const query = this.value.toLowerCase().replace(/\s+/g, '');
    clearBtn.style.display = query ? 'block' : 'none';

    if (query) {
      const filtered = data.filter(item =>
        item.title.toLowerCase().replace(/\s+/g, '').includes(query)
      );
      renderResults(filtered);
      isSearchResults = true;
    } else {
      renderRecommendations(data);
      isSearchResults = false;
    }
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    clearBtn.style.display = 'none';
    renderRecommendations(data);
    input.focus();
    isSearchResults = false;
  });

  document.addEventListener('click', function (e) {
    if (!searchBar.contains(e.target) && !e.target.closest('.search-icon')) {
      searchBar.classList.add('hidden');
      results.innerHTML = '';
    }
  });

  input.addEventListener('keydown', function (e) {
    const recommendItems = results.querySelectorAll('.recommend-item');
    const searchCards = results.querySelectorAll('.search-card');
    const isRecommendation = recommendItems.length > 0;
    const activeList = isRecommendation ? recommendItems : searchCards;

    if (!activeList.length) return;

    const itemsPerRow = 5;
    let row = Math.floor(currentIndex / itemsPerRow);
    let col = currentIndex % itemsPerRow;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentIndex === -1) {
        currentIndex = 0;
      } else if (isRecommendation) {
        currentIndex = (currentIndex + 1) % activeList.length;
      } else {
        row++;
        const nextIndex = row * itemsPerRow + col;
        if (nextIndex < activeList.length) {
          currentIndex = nextIndex;
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentIndex === -1) {
        currentIndex = 0;
      } else if (isRecommendation) {
        currentIndex = (currentIndex - 1 + activeList.length) % activeList.length;
      } else {
        row--;
        const prevIndex = row * itemsPerRow + col;
        if (row >= 0 && prevIndex < activeList.length) {
          currentIndex = prevIndex;
        }
      }
    } else if (!isRecommendation && e.key === 'ArrowRight') {
      e.preventDefault();
      if (currentIndex === -1) {
        currentIndex = 0;
      } else if (currentIndex + 1 < activeList.length) {
        currentIndex++;
      }
    } else if (!isRecommendation && e.key === 'ArrowLeft') {
      e.preventDefault();
      if (currentIndex > 0) {
        currentIndex--;
      }
    } else if (e.key === 'Enter' && currentIndex >= 0) {
      const selectedTitle = activeList[currentIndex].textContent.trim();
      const selected = data.find(item => item.title === selectedTitle);
      if (selected) {
        window.location.href = selected.link;
      }
    }

    updateHighlight(activeList);
  });

  function updateHighlight(items) {
    items.forEach((el, i) => {
      el.classList.toggle('highlighted', i === currentIndex);
    });
  }

  function renderRecommendations(data) {
    currentIndex = -1;
    results.innerHTML = `
      <div class="search-results-grid">
        ${data.map((d, index) => `
          <div class="recommend-item" data-index="${index}" data-link="${d.link}">
            ${d.title}
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderResults(filteredItems) {
    currentIndex = 0; // 처음 항목을 선택한 상태로 시작
    results.innerHTML = `
      <div class="search-results-images">
        ${filteredItems.map((item, index) => `
          <div class="search-card${index === 0 ? ' highlighted' : ''}">
            <img class="search-image" src="${item.image}" alt="${item.title}" />
            <div class="card-title">${item.title}</div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // 추천 클릭 시 이동
  results.addEventListener('click', function (e) {
    const target = e.target.closest('.recommend-item');
    if (target) {
      const link = target.dataset.link;
      if (link) {
        window.location.href = link;
      }
    }
  });

  // 이미지 카드 클릭 시 이동
  results.addEventListener('click', function (e) {
    const card = e.target.closest('.search-card');
    if (card) {
      const title = card.querySelector('.card-title')?.textContent.trim();
      const match = data.find(item => item.title === title);
      if (match) {
        window.location.href = match.link;
      }
    }
  });
});

// ✅ 팝업 열기
function openPopup() {
  document.getElementById('newsletter-popup').style.display = 'flex';
}

// ✅ 팝업 닫기 + 입력창 비우기
function closePopup() {
  document.getElementById('newsletter-popup').style.display = 'none';
  resetEmailInput();
}

// ✅ 입력창 초기화
function resetEmailInput() {
  document.getElementById('newsletter-email').value = '';
}

// ✅ 구독하기
async function subscribeEmail() {
  const emailInput = document.getElementById('newsletter-email');
  const email = emailInput.value.trim();

  if (!email) {
    closePopup();
    return;
  }

  // 2. 이메일 형식 검사 (한글/이상한 문자 방지)
  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailPattern.test(email)) {
    alert("Invalid email format. Please enter a valid email address.");
    return;
  }

  // 3. 이미 등록된 이메일인지 확인
  const check = await fetch(`https://sheetdb.io/api/v1/ti5ilziqzjtcf/search?email=${email}`);
  const exists = await check.json();

  if (exists.length > 0) {
    closePopup();
    return;
  }

  // 4. SheetDB에 새 이메일 추가
  await fetch('https://sheetdb.io/api/v1/ti5ilziqzjtcf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [{ email }] })
  });

  closePopup();
}

// ✅ 구독 취소
async function unsubscribeEmail() {
  const email = document.getElementById('newsletter-email').value.trim();

  if (!email) {
    closePopup();
    return;
  }

  await fetch(`https://sheetdb.io/api/v1/ti5ilziqzjtcf/email/${email}`, {
    method: 'DELETE'
  });

  closePopup();
}
