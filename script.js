function extractUsernamesFromHTML(content) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');
  const links = doc.querySelectorAll('a[href^="https://www.instagram.com/"]');
  const usernames = new Set();
  links.forEach(link => {
    const url = link.getAttribute('href');
    const match = url.match(/instagram\.com\/([^/?]+)/);
    if (match) {
      usernames.add(match[1]);
    }
  });
  return usernames;
}

document.getElementById('checkButton').addEventListener('click', async () => {
  const followingFile = document.getElementById('following').files[0];
  const followersFile = document.getElementById('followers').files[0];

  if (!followingFile || !followersFile) {
    alert('Please upload both files.');
    return;
  }

  const [followingText, followersText] = await Promise.all([
    followingFile.text(),
    followersFile.text()
  ]);

  const following = extractUsernamesFromHTML(followingText);
  const followers = extractUsernamesFromHTML(followersText);

  const notFollowingBack = [...following].filter(user => !followers.has(user));

  const resultEl = document.getElementById('result');
  resultEl.innerHTML = '';
  notFollowingBack.forEach(user => {
    const li = document.createElement('li');
    li.textContent = user;
    resultEl.appendChild(li);
  });
});
