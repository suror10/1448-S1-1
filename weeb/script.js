const API_URL = "https://script.google.com/macros/s/AKfycbzhkKFRRc8EiKj3CMVxVahwWmciyVNDCU4DrjSbDEIGCXVqlCOvHvHGjSaGO7gAAAY2fw/exec";
let allWeeksData = []; 
let currentWeekNumber = 1;

window.addEventListener('load', () => {
  const lastSearched = localStorage.getItem('lastSearchName');
  if (lastSearched) {
    document.getElementById('searchInput').value = lastSearched;
    handleSearch();
  }
});

window.addEventListener('offline', () => {
  const badge = document.getElementById('networkBadge');
  badge.className = 'network-badge offline';
  badge.innerText = '⚠️ انقطع الاتصال بالإنترنت! تتصفح النسخة المحفوظة محلياً.';
});

window.addEventListener('online', () => {
  const badge = document.getElementById('networkBadge');
  badge.className = 'network-badge online';
  badge.innerText = '✅ عاد الاتصال بالإنترنت! جاري تحديث البيانات...';
  
  setTimeout(() => { badge.style.display = 'none'; }, 3000);

  if (document.getElementById('searchInput').value.trim() !== '') {
    handleSearch();
  }
});

document.getElementById('searchInput').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') handleSearch();
});

async function handleSearch() {
  const nameInput = document.getElementById('searchInput').value.trim();
  const statusDiv = document.getElementById('statusMessage');
  const weeksContainer = document.getElementById('weeksContainer');
  const filterContainer = document.getElementById('filterContainer');

  weeksContainer.innerHTML = '';
  filterContainer.style.display = 'none';

  if (!nameInput) {
    statusDiv.className = 'status-message error';
    statusDiv.innerText = '⚠️ الرجاء كتابة اسم للبحث عنه';
    return;
  }

  localStorage.setItem('lastSearchName', nameInput);

  if (!navigator.onLine) {
    loadFromLocalStorage(nameInput, statusDiv, filterContainer);
    return;
  }

  statusDiv.className = 'status-message loading';
  statusDiv.innerText = '⏳ جاري البحث وتحديث البيانات...';

  try {
    const response = await fetch(`${API_URL}?name=${encodeURIComponent(nameInput)}`);
    const result = await response.json();

    if (result.status === 'success') {
      statusDiv.className = 'status-message success';
      statusDiv.innerText = `✅ تم العثور على الطالب: ${result.studentName} (الأسبوع الحالي: ${result.currentWeekNum})`;
      
      allWeeksData = result.weeks;
      currentWeekNumber = result.currentWeekNum;

      localStorage.setItem(`studentData_${nameInput}`, JSON.stringify(result));

      populateWeekSelect(result.weeks, currentWeekNumber);
      filterContainer.style.display = 'flex';
      filterWeeks();
    } else {
      statusDiv.className = 'status-message error';
      statusDiv.innerText = `❌ ${result.message}`;
    }
  } catch (error) {
    console.error(error);
    loadFromLocalStorage(nameInput, statusDiv, filterContainer);
  }
}

function loadFromLocalStorage(nameInput, statusDiv, filterContainer) {
  const cachedData = localStorage.getItem(`studentData_${nameInput}`);
  
  if (cachedData) {
    const result = JSON.parse(cachedData);
    statusDiv.className = 'status-message success';
    statusDiv.innerText = `🔄 (أوفلاين) تم عرض بيانات الطالب: ${result.studentName}`;
    
    allWeeksData = result.weeks;
    currentWeekNumber = result.currentWeekNum || 1;

    populateWeekSelect(result.weeks, currentWeekNumber);
    filterContainer.style.display = 'flex';
    filterWeeks();
  } else {
    statusDiv.className = 'status-message error';
    statusDiv.innerText = `❌ لا يوجد اتصال بالإنترنت، ولا توجد نسخة محفوظة لهذا الطالب.`;
  }
}

function populateWeekSelect(weeks, currentWeek) {
  const select = document.getElementById('weekSelect');
  select.innerHTML = '<option value="all">عرض جميع الأسابيع</option>';

  weeks.forEach((week) => {
    const option = document.createElement('option');
    option.value = week.weekNumber;
    option.innerText = week.title; 
    select.appendChild(option);
  });

  select.value = currentWeek;
}

function filterWeeks() {
  const selectedValue = document.getElementById('weekSelect').value;
  
  if (selectedValue === 'all') {
    renderWeeks(allWeeksData);
  } else {
    const filtered = allWeeksData.filter(w => w.weekNumber == selectedValue);
    renderWeeks(filtered);
  }
}

function renderWeeks(weeks) {
  const container = document.getElementById('weeksContainer');
  container.innerHTML = '';

  weeks.forEach((week) => {
    const card = document.createElement('div');
    card.className = 'week-card';

    let cardHtml = `
      <div class="week-card-header">
        <h3>📅 ${week.title}</h3>
      </div>
      <div class="table-wrapper">
        <table>
    `;

    week.data.forEach((row) => {
      cardHtml += '<tr>';
      row.forEach((cell) => {
        const val = cell !== "" ? cell : "-";
        cardHtml += `<td>${val}</td>`;
      });
      cardHtml += '</tr>';
    });

    cardHtml += `
        </table>
      </div>
    `;

    card.innerHTML = cardHtml;
    container.appendChild(card);
  });
}