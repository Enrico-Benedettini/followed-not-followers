let sortListenersAttached = false;

function extractFollowingData(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const entries = doc.querySelectorAll('.uiBoxWhite.noborder');

  const followingMap = new Map();

  entries.forEach(entry => {
    const link = entry.querySelector('a[href^="https://www.instagram.com/"]');
    const dateDiv = entry.querySelector('div:nth-child(2)');

    if (link && dateDiv) {
      const url = link.getAttribute('href');
      const match = url.match(/instagram\.com\/([^/?]+)/);
      const dateText = dateDiv.textContent.trim();
      if (match && dateText) {
        const username = match[1];
        const parsedDate = parseDate(dateText);
        followingMap.set(username, parsedDate);
      }
    }
  });

  return followingMap;
}

function extractFollowers(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const links = doc.querySelectorAll('a[href^="https://www.instagram.com/"]');
  const followers = new Set();

  links.forEach(link => {
    const url = link.getAttribute('href');
    const match = url.match(/instagram\.com\/([^/?]+)/);
    if (match) {
      followers.add(match[1]);
    }
  });

  return followers;
}

function parseDate(dateStr) {
  const months = {
    gen: 0, feb: 1, mar: 2, apr: 3, mag: 4, giu: 5,
    lug: 6, ago: 7, set: 8, ott: 9, nov: 10, dic: 11
  };

  const regex = /([a-z]{3}) (\d{1,2}), (\d{4}) (\d{1,2}):(\d{2}) (am|pm)/i;
  const match = dateStr.match(regex);

  if (!match) return null;

  const [, mmm, day, year, hour, minute, ampm] = match;
  let h = parseInt(hour);
  if (ampm.toLowerCase() === 'pm' && h !== 12) h += 12;
  if (ampm.toLowerCase() === 'am' && h === 12) h = 0;

  return new Date(year, months[mmm.toLowerCase()], day, h, parseInt(minute));
}

function formatDate(date) {
  return date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
}

function downloadAsTxt(content, filename) {
  const blob = new Blob([content], { type: 'text/plain' });
  const link = document.createElement('a');
  link.download = filename;
  link.href = URL.createObjectURL(blob);
  link.click();
}

let currentSort = { column: 'date', asc: true };
let resultList = [];

function renderTable() {
  const tbody = document.getElementById('resultBody');
  tbody.innerHTML = '';

  resultList.sort((a, b) => {
    if (currentSort.column === 'date') {
      return currentSort.asc ? a.date - b.date : b.date - a.date;
    } else if (currentSort.column === 'username') {
      return currentSort.asc
        ? a.username.localeCompare(b.username)
        : b.username.localeCompare(a.username);
    }
    return 0;
  });

  resultList.forEach(entry => {
    const tr = document.createElement('tr');

    const tdUser = document.createElement('td');
    tdUser.textContent = entry.username;
    tr.appendChild(tdUser);

    const tdDate = document.createElement('td');
    tdDate.textContent = formatDate(entry.date);
    tr.appendChild(tdDate);

    tbody.appendChild(tr);
  });
}

function attachSortListeners() {
  if (sortListenersAttached) return;
  sortListenersAttached = true;

  document.querySelectorAll('#resultTable th').forEach(th => {
    th.addEventListener('click', () => {
      const sortKey = th.getAttribute('data-sort');
      if (currentSort.column === sortKey) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort.column = sortKey;
        currentSort.asc = true;
      }
      renderTable();
    });
  });
}

document.getElementById('checkButton').addEventListener('click', async () => {
  const followingFile = document.getElementById('following').files[0];
  const followersFile = document.getElementById('followers').files[0];
  const dateLimitStr = document.getElementById('dateLimit').value;

  if (!followingFile || !followersFile) {
    alert('Please upload both files.');
    return;
  }

  const [followingText, followersText] = await Promise.all([
    followingFile.text(),
    followersFile.text()
  ]);

  const followingMap = extractFollowingData(followingText);
  const followers = extractFollowers(followersText);

  let dateLimit = null;
  if (dateLimitStr) {
    dateLimit = new Date(dateLimitStr);
  }

  resultList = [];
  followingMap.forEach((followDate, username) => {
    if (!followers.has(username)) {
      if (!dateLimit || (followDate && followDate <= dateLimit)) {
        resultList.push({ username, date: followDate });
      }
    }
  });

  renderTable();
  attachSortListeners();

  // Enable download
  if (resultList.length > 0) {
    const txt = resultList
      .map(entry => `${entry.username} — ${formatDate(entry.date)}`)
      .join('\n');

    const downloadBtn = document.getElementById('downloadButton');
    downloadBtn.style.display = 'inline-block';
    downloadBtn.onclick = () => downloadAsTxt(txt, 'not_following_back.txt');
  }
});