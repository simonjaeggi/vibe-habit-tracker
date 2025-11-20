import './style.css';

const app = document.querySelector('#app');

const template = `
  <main class="container">
    <header>
      <h1>Vibe Habit Tracker Playground</h1>
      <p>
        Quick and dirty UI for testing the Nest API, Google OAuth flow, and the
        diary entry endpoints without wiring up a full product yet.
      </p>
    </header>

    <section class="card">
      <h2>API Settings</h2>
      <label class="field">
        <span>Backend base URL</span>
        <input
          id="apiBaseUrl"
          type="url"
          placeholder="http://localhost:3000"
        />
      </label>
      <button id="saveSettings" type="button">Save Base URL</button>
    </section>

    <section class="card">
      <h2>Connectivity Check</h2>
      <p>Send <code>GET /</code> to confirm the API responds before logging in.</p>
      <button id="pingApi" type="button">Ping API</button>
      <pre id="pingOutput" class="output" aria-live="polite"></pre>
    </section>

    <section class="card">
      <h2>Auth Session</h2>
      <p>
        Use Google login to get a short-lived JWT from the backend. The token is
        stored in <code>localStorage</code> so every request automatically
        includes the <code>Authorization</code> header. Hit "Logout" to clear the
        token.
      </p>
      <div class="session-info">
        <div>
          <span>Status</span>
          <strong id="sessionStatus">Logged out</strong>
        </div>
        <div>
          <span>User</span>
          <strong id="sessionUserName">-</strong>
        </div>
        <div>
          <span>User ID</span>
          <code id="sessionUserId">-</code>
        </div>
        <div>
          <span>Email</span>
          <code id="sessionUserEmail">-</code>
        </div>
      </div>
      <div class="actions wrap">
        <button id="loginButton" class="primary" type="button">Login with Google</button>
        <button id="logoutButton" class="ghost" type="button">Logout</button>
      </div>
    </section>

    <section class="card">
      <h2>Diary Entries</h2>
      <div class="grid two">
        <label class="field">
          <span>Entry Date (optional)</span>
          <input id="entryDateInput" type="date" />
        </label>
        <label class="field full">
          <span>Content</span>
          <textarea id="entryContentInput" rows="4" placeholder="What vibe are you tracking today?"></textarea>
        </label>
      </div>
      <div class="actions">
        <button id="createEntry" type="button" class="primary">Save Entry</button>
        <button id="refreshEntries" type="button">Refresh List</button>
      </div>
      <p id="diaryStatus" class="hint"></p>
      <div id="entriesList" class="entries"></div>
    </section>
  </main>
`;

app.innerHTML = template;

const STORAGE_KEY = 'vibe-habit-tracker-api-base';
const TOKEN_KEY = 'vibe-habit-tracker-jwt';
const USER_INFO_KEY = 'vibe-habit-tracker-user-info';
const apiBaseInput = document.querySelector('#apiBaseUrl');
const saveSettingsButton = document.querySelector('#saveSettings');
const pingButton = document.querySelector('#pingApi');
const outputEl = document.querySelector('#pingOutput');
const loginButton = document.querySelector('#loginButton');
const logoutButton = document.querySelector('#logoutButton');
const diaryStatusEl = document.querySelector('#diaryStatus');
const entriesListEl = document.querySelector('#entriesList');
const entryContentInput = document.querySelector('#entryContentInput');
const entryDateInput = document.querySelector('#entryDateInput');
const createEntryButton = document.querySelector('#createEntry');
const refreshEntriesButton = document.querySelector('#refreshEntries');
const sessionStatusEl = document.querySelector('#sessionStatus');
const sessionUserNameEl = document.querySelector('#sessionUserName');
const sessionUserIdEl = document.querySelector('#sessionUserId');
const sessionUserEmailEl = document.querySelector('#sessionUserEmail');

let entries = [];
let isLoadingEntries = false;
let jwtToken = '';
let currentUser = null;

const setOutput = (content) => {
  outputEl.textContent =
    typeof content === 'string' ? content : JSON.stringify(content, null, 2);
};

const getBaseUrl = () => {
  const raw = apiBaseInput.value?.trim();
  return raw?.length ? raw : 'http://localhost:3000';
};

const hydrateBaseUrl = () => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  apiBaseInput.value = stored ?? 'http://localhost:3000';
};

const persistSession = () => {
  if (jwtToken) {
    window.localStorage.setItem(TOKEN_KEY, jwtToken);
  } else {
    window.localStorage.removeItem(TOKEN_KEY);
  }

  if (currentUser) {
    window.localStorage.setItem(USER_INFO_KEY, JSON.stringify(currentUser));
  } else {
    window.localStorage.removeItem(USER_INFO_KEY);
  }
};

const updateSessionUI = () => {
  if (jwtToken && currentUser) {
    sessionStatusEl.textContent = 'Logged in';
    sessionUserNameEl.textContent = currentUser.displayName ?? 'Unknown';
    sessionUserIdEl.textContent = currentUser.id ?? '-';
    sessionUserEmailEl.textContent = currentUser.email ?? '-';
    logoutButton.disabled = false;
  } else {
    sessionStatusEl.textContent = 'Logged out';
    sessionUserNameEl.textContent = '-';
    sessionUserIdEl.textContent = '-';
    sessionUserEmailEl.textContent = '-';
    logoutButton.disabled = true;
  }
};

const hydrateSessionFromStorage = () => {
  const storedToken = window.localStorage.getItem(TOKEN_KEY);
  const storedUser = window.localStorage.getItem(USER_INFO_KEY);

  if (storedToken) {
    jwtToken = storedToken;
  }

  if (storedUser) {
    try {
      currentUser = JSON.parse(storedUser);
    } catch {
      currentUser = null;
    }
  }

  updateSessionUI();
};

const handleAuthCallback = () => {
  const url = new URL(window.location.href);
  const token = url.searchParams.get('token');

  if (!token) {
    return false;
  }

  jwtToken = token;
  currentUser = {
    id: url.searchParams.get('userId') ?? '',
    displayName: url.searchParams.get('displayName') ?? '',
    email: url.searchParams.get('email') ?? '',
  };

  persistSession();
  updateSessionUI();

  // clean URL
  ['token', 'userId', 'displayName', 'email'].forEach((param) =>
    url.searchParams.delete(param),
  );
  window.history.replaceState({}, document.title, url.toString());
  return true;
};

const clearSession = () => {
  jwtToken = '';
  currentUser = null;
  persistSession();
  updateSessionUI();
  entries = [];
  renderEntries();
  setDiaryStatus('Logged out. Log in to manage diary entries.');
};

const startGoogleLogin = () => {
  const base = getBaseUrl().replace(/\/$/, '');
  window.location.href = `${base}/auth/google`;
};

const setDiaryStatus = (message, tone = 'info') => {
  diaryStatusEl.textContent = message;
  diaryStatusEl.dataset.tone = tone;
};

const apiFetch = async (path, options = {}) => {
  const base = getBaseUrl().replace(/\/$/, '');
  if (!jwtToken) {
    throw new Error('Log in with Google to continue.');
  }

  const response = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${jwtToken}`,
      ...(options.headers ?? {}),
    },
    ...options,
  });

  const text = await response.text();

  if (!response.ok) {
    let detail = text;
    try {
      const parsed = JSON.parse(text);
      detail = parsed.message ?? JSON.stringify(parsed);
    } catch {
      // ignore
    }
    throw new Error(detail || `Request failed with ${response.status}`);
  }

  return text ? JSON.parse(text) : null;
};

const renderEntries = () => {
  if (isLoadingEntries) {
    entriesListEl.innerHTML = '<p class="hint">Loading entries…</p>';
    return;
  }

  if (!entries.length) {
    entriesListEl.innerHTML =
      '<p class="hint">No entries yet. Write something above and hit "Save Entry".</p>';
    return;
  }

  const markup = entries
    .map(
      (entry) => `
        <article class="entry-card" data-id="${entry.id}">
          <div class="entry-row">
            <label>
              <span>Date</span>
              <input type="date" class="entry-date" value="${entry.entryDate}" />
            </label>
            <small>Updated ${new Date(entry.updatedAt).toLocaleString()}</small>
          </div>
          <label class="field full">
            <span>Content</span>
            <textarea class="entry-content" rows="4">${entry.content ?? ''}</textarea>
          </label>
          <div class="actions">
            <button class="ghost" data-action="delete">Delete</button>
            <button class="primary" data-action="save">Save Changes</button>
          </div>
        </article>
      `,
    )
    .join('');

  entriesListEl.innerHTML = markup;
};

const loadEntries = async () => {
  if (!jwtToken) {
    entries = [];
    renderEntries();
    setDiaryStatus('Log in to load your diary entries.');
    return;
  }

  try {
    isLoadingEntries = true;
    renderEntries();
    const result = await apiFetch('/diary');
    entries = result ?? [];
    setDiaryStatus(`Loaded ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}.`);
  } catch (error) {
    setDiaryStatus(error.message, 'error');
  } finally {
    isLoadingEntries = false;
    renderEntries();
  }
};

const handleCreateEntry = async () => {
  if (!jwtToken) {
    setDiaryStatus('Log in before creating entries.', 'error');
    return;
  }
  const content = entryContentInput.value.trim();
  const entryDate = entryDateInput.value || undefined;

  if (!content) {
    setDiaryStatus('Content is required to create an entry.', 'error');
    return;
  }

  try {
    setDiaryStatus('Saving entry...');
    await apiFetch('/diary', {
      method: 'POST',
      body: JSON.stringify({ content, entryDate }),
    });
    entryContentInput.value = '';
    entryDateInput.value = '';
    setDiaryStatus('Entry saved!');
    await loadEntries();
  } catch (error) {
    setDiaryStatus(error.message, 'error');
  }
};

const handleEntriesListClick = async (event) => {
  if (!jwtToken) {
    return;
  }
  const button = event.target;
  if (!(button instanceof HTMLButtonElement)) return;

  const action = button.dataset.action;
  if (!action) return;

  const card = button.closest('.entry-card');
  if (!card) return;

  const id = card.dataset.id;
  const contentInput = card.querySelector('.entry-content');
  const dateInput = card.querySelector('.entry-date');

  if (!contentInput || !dateInput) return;

  if (action === 'save') {
    try {
      setDiaryStatus('Updating entry...');
      await apiFetch(`/diary/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: contentInput.value,
          entryDate: dateInput.value,
        }),
      });
      setDiaryStatus('Entry updated.');
      await loadEntries();
    } catch (error) {
      setDiaryStatus(error.message, 'error');
    }
  }

  if (action === 'delete') {
    const confirmed = window.confirm('Delete this entry?');
    if (!confirmed) return;
    try {
      setDiaryStatus('Deleting entry...');
      await apiFetch(`/diary/${id}`, {
        method: 'DELETE',
      });
      setDiaryStatus('Entry deleted.');
      await loadEntries();
    } catch (error) {
      setDiaryStatus(error.message, 'error');
    }
  }
};

saveSettingsButton.addEventListener('click', () => {
  const base = getBaseUrl();
  window.localStorage.setItem(STORAGE_KEY, base);
  setOutput(`Saved base URL: ${base}`);
});

pingButton.addEventListener('click', async () => {
  const base = getBaseUrl().replace(/\/$/, '');
  setOutput('Pinging API...');
  try {
    const response = await fetch(base, {
      headers: { Accept: 'application/json' },
    });

    const text = await response.text();
    try {
      setOutput(JSON.parse(text));
    } catch (error) {
      setOutput(text);
    }
  } catch (error) {
    setOutput(`Failed to reach API: ${error}`);
  }
});

createEntryButton.addEventListener('click', handleCreateEntry);
refreshEntriesButton.addEventListener('click', loadEntries);
entriesListEl.addEventListener('click', handleEntriesListClick);
loginButton.addEventListener('click', startGoogleLogin);
logoutButton.addEventListener('click', clearSession);

hydrateBaseUrl();
hydrateSessionFromStorage();
const handledCallback = handleAuthCallback();
if (handledCallback || jwtToken) {
  loadEntries();
} else {
  renderEntries();
}
