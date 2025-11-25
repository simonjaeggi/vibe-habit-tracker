import './style.css';

const app = document.querySelector('#app');

const template = `
  <main class="container">
    <header>
      <h1>Vibe Habit Tracker Playground</h1>
      <p>
        Quick UI to test the Nest API, Google OAuth flow, diary entries, and the new habits + habit entries endpoints.
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
        Log in with Google or email/password to get a JWT. The token is stored in
        <code>localStorage</code> so every request automatically includes the
        <code>Authorization</code> header. Hit "Logout" to clear the token.
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
      <div class="grid two auth-forms">
        <div>
          <h3>Local Login</h3>
          <label class="field">
            <span>Email</span>
            <input id="loginEmail" type="email" placeholder="you@example.com" />
          </label>
          <label class="field">
            <span>Password</span>
            <input id="loginPassword" type="password" placeholder="••••••••" />
          </label>
          <button id="localLoginButton" class="primary" type="button">Login</button>
        </div>
        <div>
          <h3>Register</h3>
          <label class="field">
            <span>Display Name</span>
            <input id="registerName" type="text" placeholder="Your name" />
          </label>
          <label class="field">
            <span>Email</span>
            <input id="registerEmail" type="email" placeholder="you@example.com" />
          </label>
          <label class="field">
            <span>Password (min 8 chars)</span>
            <input id="registerPassword" type="password" placeholder="••••••••" />
          </label>
          <button id="localRegisterButton" type="button">Create Account</button>
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

    <section class="card">
      <h2>Habits</h2>
      <div class="grid two">
        <label class="field">
          <span>Name</span>
          <input id="habitName" type="text" placeholder="e.g., Drink Water" />
        </label>
        <label class="field">
          <span>Recurrence</span>
          <select id="habitRecurrence">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="custom">Custom interval</option>
          </select>
        </label>
        <label class="field">
          <span>Custom Interval (days)</span>
          <input id="habitCustomInterval" type="number" min="1" placeholder="Only for custom" />
        </label>
      </div>

      <div class="toggles">
        <div class="toggle-group">
          <label><input type="checkbox" id="allowText" /> Allow text</label>
          <label><input type="checkbox" id="requireText" /> Require text</label>
        </div>
        <div class="toggle-group">
          <label><input type="checkbox" id="allowPicture" /> Allow picture</label>
          <label><input type="checkbox" id="requirePicture" /> Require picture</label>
        </div>
        <div class="toggle-group">
          <label><input type="checkbox" id="allowVoice" /> Allow voice memo</label>
          <label><input type="checkbox" id="requireVoice" /> Require voice memo</label>
        </div>
      </div>

      <div class="actions">
        <button id="createHabit" type="button" class="primary">Create Habit</button>
        <button id="refreshHabits" type="button">Refresh Habits</button>
      </div>
      <p id="habitStatus" class="hint"></p>
      <div id="habitsList" class="entries"></div>
    </section>

    <section class="card">
      <h2>Habit Entries</h2>
      <p class="hint">Select a habit above to load and manage its entries.</p>
      <div class="selected-habit">
        <span>Selected Habit:</span>
        <strong id="selectedHabitName">None</strong>
        <small id="selectedHabitRules"></small>
      </div>
      <div class="grid two">
        <label class="field">
          <span>Entry Date</span>
          <input id="habitEntryDate" type="date" />
        </label>
        <label class="field full">
          <span>Text Content</span>
          <textarea id="habitEntryText" rows="3" placeholder="Optional unless required by habit"></textarea>
        </label>
        <label class="field">
          <span>Picture URL</span>
          <input id="habitEntryPicture" type="url" placeholder="Optional unless required" />
        </label>
        <label class="field">
          <span>Voice Memo URL</span>
          <input id="habitEntryVoice" type="url" placeholder="Optional unless required" />
        </label>
      </div>
      <div class="actions">
        <button id="createHabitEntry" type="button" class="primary">Save Habit Entry</button>
        <button id="refreshHabitEntries" type="button">Refresh Habit Entries</button>
      </div>
      <p id="habitEntryStatus" class="hint"></p>
      <div id="habitEntriesList" class="entries"></div>
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
const loginEmailInput = document.querySelector('#loginEmail');
const loginPasswordInput = document.querySelector('#loginPassword');
const registerNameInput = document.querySelector('#registerName');
const registerEmailInput = document.querySelector('#registerEmail');
const registerPasswordInput = document.querySelector('#registerPassword');
const localLoginButton = document.querySelector('#localLoginButton');
const localRegisterButton = document.querySelector('#localRegisterButton');
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
const habitStatusEl = document.querySelector('#habitStatus');
const habitsListEl = document.querySelector('#habitsList');
const createHabitButton = document.querySelector('#createHabit');
const refreshHabitsButton = document.querySelector('#refreshHabits');
const habitNameInput = document.querySelector('#habitName');
const habitRecurrenceInput = document.querySelector('#habitRecurrence');
const habitCustomIntervalInput = document.querySelector('#habitCustomInterval');
const allowTextInput = document.querySelector('#allowText');
const requireTextInput = document.querySelector('#requireText');
const allowPictureInput = document.querySelector('#allowPicture');
const requirePictureInput = document.querySelector('#requirePicture');
const allowVoiceInput = document.querySelector('#allowVoice');
const requireVoiceInput = document.querySelector('#requireVoice');
const selectedHabitNameEl = document.querySelector('#selectedHabitName');
const selectedHabitRulesEl = document.querySelector('#selectedHabitRules');
const habitEntryDateInput = document.querySelector('#habitEntryDate');
const habitEntryTextInput = document.querySelector('#habitEntryText');
const habitEntryPictureInput = document.querySelector('#habitEntryPicture');
const habitEntryVoiceInput = document.querySelector('#habitEntryVoice');
const habitEntryStatusEl = document.querySelector('#habitEntryStatus');
const createHabitEntryButton = document.querySelector('#createHabitEntry');
const refreshHabitEntriesButton = document.querySelector('#refreshHabitEntries');
const habitEntriesListEl = document.querySelector('#habitEntriesList');

let entries = [];
let isLoadingEntries = false;
let jwtToken = '';
let currentUser = null;
let habits = [];
let habitEntries = [];
let isLoadingHabitEntries = false;
let selectedHabitId = '';

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
  habits = [];
  habitEntries = [];
  selectedHabitId = '';
  renderEntries();
  renderHabits();
  renderHabitEntries();
  setDiaryStatus('Logged out. Log in to manage diary entries.');
  setHabitStatus('Logged out. Log in to manage habits.');
  setHabitEntryStatus('Log in and select a habit to manage entries.');
};

const startGoogleLogin = () => {
  const base = getBaseUrl().replace(/\/$/, '');
  window.location.href = `${base}/auth/google`;
};

const handleLocalAuthResponse = (payload) => {
  if (!payload?.jwt || !payload?.user) {
    throw new Error('Unexpected auth response.');
  }
  jwtToken = payload.jwt;
  currentUser = payload.user;
  persistSession();
  updateSessionUI();
};

const handleLocalRegister = async () => {
  const email = registerEmailInput.value.trim();
  const displayName = registerNameInput.value.trim();
  const password = registerPasswordInput.value;

  if (!email || !displayName || !password) {
    setDiaryStatus('Provide name, email, and password to register.', 'error');
    return;
  }

  try {
    setDiaryStatus('Registering...');
    const result = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, displayName, password }),
    });
    handleLocalAuthResponse(result);
    setDiaryStatus('Registered and logged in!');
    await Promise.all([loadEntries(), loadHabits()]);
  } catch (error) {
    setDiaryStatus(error.message, 'error');
  }
};

const handleLocalLogin = async () => {
  const email = loginEmailInput.value.trim();
  const password = loginPasswordInput.value;

  if (!email || !password) {
    setDiaryStatus('Provide email and password to log in.', 'error');
    return;
  }

  try {
    setDiaryStatus('Logging in...');
    const result = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    handleLocalAuthResponse(result);
    setDiaryStatus('Logged in.');
    await Promise.all([loadEntries(), loadHabits()]);
  } catch (error) {
    setDiaryStatus(error.message, 'error');
  }
};

const setDiaryStatus = (message, tone = 'info') => {
  diaryStatusEl.textContent = message;
  diaryStatusEl.dataset.tone = tone;
};

const setHabitStatus = (message, tone = 'info') => {
  habitStatusEl.textContent = message;
  habitStatusEl.dataset.tone = tone;
};

const setHabitEntryStatus = (message, tone = 'info') => {
  habitEntryStatusEl.textContent = message;
  habitEntryStatusEl.dataset.tone = tone;
};

const apiFetch = async (path, options = {}) => {
  const base = getBaseUrl().replace(/\/$/, '');

  const response = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(jwtToken ? { Authorization: `Bearer ${jwtToken}` } : {}),
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

const renderHabits = () => {
  if (!habits.length) {
    habitsListEl.innerHTML = '<p class="hint">No habits yet. Create one above.</p>';
    selectedHabitNameEl.textContent = 'None';
    selectedHabitRulesEl.textContent = '';
    return;
  }

  const markup = habits
    .map((habit) => {
      const isSelected = habit.id === selectedHabitId;
      const recurrence =
        habit.recurrence === 'custom'
          ? `Every ${habit.customIntervalDays} day(s)`
          : habit.recurrence;

      const rules = [
        habit.requireText
          ? 'Text required'
          : habit.allowText
            ? 'Text allowed'
            : 'No text',
        habit.requirePicture
          ? 'Picture required'
          : habit.allowPicture
            ? 'Picture allowed'
            : 'No picture',
        habit.requireVoiceMemo
          ? 'Voice required'
          : habit.allowVoiceMemo
            ? 'Voice allowed'
            : 'No voice',
      ].join(' • ');

      return `
        <article class="entry-card" data-id="${habit.id}">
          <div class="entry-row">
            <div>
              <strong>${habit.name}</strong>
              <p class="hint tiny">${recurrence}</p>
            </div>
            <div class="badge ${isSelected ? 'selected' : ''}">
              ${isSelected ? 'Selected' : 'Not selected'}
            </div>
          </div>
          <p class="hint tiny">${rules}</p>
          <div class="actions">
            <button class="primary" data-action="select">${isSelected ? 'Selected' : 'Select'}</button>
            <button class="ghost" data-action="delete">Delete</button>
          </div>
        </article>
      `;
    })
    .join('');

  habitsListEl.innerHTML = markup;
  updateSelectedHabitInfo();
};

const updateSelectedHabitInfo = () => {
  const habit = habits.find((h) => h.id === selectedHabitId);
  if (!habit) {
    selectedHabitNameEl.textContent = 'None';
    selectedHabitRulesEl.textContent =
      'Pick a habit above to create or view entries.';
    return;
  }

  selectedHabitNameEl.textContent = habit.name;
  const bits = [];
  bits.push(
    habit.recurrence === 'custom'
      ? `Every ${habit.customIntervalDays} day(s)`
      : habit.recurrence,
  );
  if (habit.requireText) bits.push('Text required');
  else if (habit.allowText) bits.push('Text allowed');
  if (habit.requirePicture) bits.push('Picture required');
  else if (habit.allowPicture) bits.push('Picture allowed');
  if (habit.requireVoiceMemo) bits.push('Voice required');
  else if (habit.allowVoiceMemo) bits.push('Voice allowed');
  selectedHabitRulesEl.textContent = bits.join(' • ');
};

const loadHabits = async () => {
  if (!jwtToken) {
    habits = [];
    selectedHabitId = '';
    renderHabits();
    setHabitStatus('Log in to load habits.');
    return;
  }

  try {
    setHabitStatus('Loading habits...');
    const result = await apiFetch('/habits');
    habits = result ?? [];
    if (!habits.find((h) => h.id === selectedHabitId)) {
      selectedHabitId = habits[0]?.id ?? '';
    }
    renderHabits();
    if (selectedHabitId) {
      setHabitStatus(`Loaded ${habits.length} habit(s).`);
      await loadHabitEntries();
    } else {
      setHabitStatus('No habits yet. Create one above.');
      renderHabitEntries();
    }
  } catch (error) {
    setHabitStatus(error.message, 'error');
  }
};

const createHabit = async () => {
  if (!jwtToken) {
    setHabitStatus('Log in before creating habits.', 'error');
    return;
  }

  const name = habitNameInput.value.trim();
  const recurrence = habitRecurrenceInput.value;
  const customIntervalDays =
    recurrence === 'custom'
      ? Number(habitCustomIntervalInput.value) || undefined
      : undefined;

  if (!name) {
    setHabitStatus('Name is required.', 'error');
    return;
  }

  try {
    setHabitStatus('Creating habit...');
    await apiFetch('/habits', {
      method: 'POST',
      body: JSON.stringify({
        name,
        recurrence,
        customIntervalDays,
        allowText: allowTextInput.checked,
        requireText: requireTextInput.checked,
        allowPicture: allowPictureInput.checked,
        requirePicture: requirePictureInput.checked,
        allowVoiceMemo: allowVoiceInput.checked,
        requireVoiceMemo: requireVoiceInput.checked,
      }),
    });

    habitNameInput.value = '';
    habitCustomIntervalInput.value = '';
    allowTextInput.checked = false;
    requireTextInput.checked = false;
    allowPictureInput.checked = false;
    requirePictureInput.checked = false;
    allowVoiceInput.checked = false;
    requireVoiceInput.checked = false;
    habitRecurrenceInput.value = 'daily';

    setHabitStatus('Habit created.');
    await loadHabits();
  } catch (error) {
    setHabitStatus(error.message, 'error');
  }
};

const handleHabitListClick = async (event) => {
  const button = event.target;
  if (!(button instanceof HTMLButtonElement)) return;
  const action = button.dataset.action;
  if (!action) return;

  const card = button.closest('.entry-card');
  if (!card) return;
  const id = card.dataset.id;

  if (action === 'select') {
    selectedHabitId = id;
    renderHabits();
    await loadHabitEntries();
    return;
  }

  if (action === 'delete') {
    const confirmed = window.confirm('Delete this habit? All its entries will be removed.');
    if (!confirmed) return;
    try {
      setHabitStatus('Deleting habit...');
      await apiFetch(`/habits/${id}`, { method: 'DELETE' });
      if (selectedHabitId === id) {
        selectedHabitId = '';
      }
      await loadHabits();
      setHabitStatus('Habit deleted.');
    } catch (error) {
      setHabitStatus(error.message, 'error');
    }
  }
};

const renderHabitEntries = () => {
  const selected = habits.find((h) => h.id === selectedHabitId);
  if (!selected) {
    habitEntriesListEl.innerHTML =
      '<p class="hint">Select a habit to view its entries.</p>';
    return;
  }

  if (isLoadingHabitEntries) {
    habitEntriesListEl.innerHTML = '<p class="hint">Loading habit entries…</p>';
    return;
  }

  if (!habitEntries.length) {
    habitEntriesListEl.innerHTML =
      '<p class="hint">No entries yet for this habit.</p>';
    return;
  }

  const markup = habitEntries
    .map(
      (entry) => `
        <article class="entry-card" data-id="${entry.id}">
          <div class="entry-row">
            <label>
              <span>Date</span>
              <input type="date" class="habit-entry-date" value="${entry.entryDate}" />
            </label>
            <small>Updated ${new Date(entry.updatedAt).toLocaleString()}</small>
          </div>
          <label class="field full">
            <span>Text</span>
            <textarea class="habit-entry-text" rows="3">${entry.textContent ?? ''}</textarea>
          </label>
          <label class="field">
            <span>Picture URL</span>
            <input type="url" class="habit-entry-picture" value="${entry.pictureUrl ?? ''}" />
          </label>
          <label class="field">
            <span>Voice Memo URL</span>
            <input type="url" class="habit-entry-voice" value="${entry.voiceMemoUrl ?? ''}" />
          </label>
          <div class="actions">
            <button class="ghost" data-action="delete-entry">Delete</button>
            <button class="primary" data-action="save-entry">Save Changes</button>
          </div>
        </article>
      `,
    )
    .join('');

  habitEntriesListEl.innerHTML = markup;
};

const loadHabitEntries = async () => {
  const habit = habits.find((h) => h.id === selectedHabitId);
  if (!habit) {
    habitEntries = [];
    renderHabitEntries();
    setHabitEntryStatus('Select a habit first.');
    return;
  }

  try {
    isLoadingHabitEntries = true;
    renderHabitEntries();
    const result = await apiFetch(`/habits/${habit.id}/entries`);
    habitEntries = result ?? [];
    setHabitEntryStatus(`Loaded ${habitEntries.length} entr${habitEntries.length === 1 ? 'y' : 'ies'}.`);
  } catch (error) {
    setHabitEntryStatus(error.message, 'error');
  } finally {
    isLoadingHabitEntries = false;
    renderHabitEntries();
  }
};

const createHabitEntry = async () => {
  const habit = habits.find((h) => h.id === selectedHabitId);
  if (!habit) {
    setHabitEntryStatus('Select a habit first.', 'error');
    return;
  }

  const payload = {
    entryDate: habitEntryDateInput.value || undefined,
    textContent: habitEntryTextInput.value.trim() || undefined,
    pictureUrl: habitEntryPictureInput.value.trim() || undefined,
    voiceMemoUrl: habitEntryVoiceInput.value.trim() || undefined,
  };

  // quick client-side guards to avoid predictable server errors
  if (habit.requireText && !payload.textContent) {
    setHabitEntryStatus('Text is required for this habit.', 'error');
    return;
  }
  if (habit.requirePicture && !payload.pictureUrl) {
    setHabitEntryStatus('Picture is required for this habit.', 'error');
    return;
  }
  if (habit.requireVoiceMemo && !payload.voiceMemoUrl) {
    setHabitEntryStatus('Voice memo is required for this habit.', 'error');
    return;
  }

  try {
    setHabitEntryStatus('Saving habit entry...');
    await apiFetch(`/habits/${habit.id}/entries`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    habitEntryDateInput.value = '';
    habitEntryTextInput.value = '';
    habitEntryPictureInput.value = '';
    habitEntryVoiceInput.value = '';

    setHabitEntryStatus('Habit entry saved.');
    await loadHabitEntries();
  } catch (error) {
    setHabitEntryStatus(error.message, 'error');
  }
};

const handleHabitEntriesListClick = async (event) => {
  const button = event.target;
  if (!(button instanceof HTMLButtonElement)) return;
  const action = button.dataset.action;
  if (!action) return;

  const card = button.closest('.entry-card');
  if (!card) return;
  const id = card.dataset.id;
  const habit = habits.find((h) => h.id === selectedHabitId);
  if (!habit) {
    setHabitEntryStatus('Select a habit first.', 'error');
    return;
  }

  const dateInput = card.querySelector('.habit-entry-date');
  const textInput = card.querySelector('.habit-entry-text');
  const pictureInput = card.querySelector('.habit-entry-picture');
  const voiceInput = card.querySelector('.habit-entry-voice');

  if (action === 'save-entry') {
    const payload = {
      entryDate: dateInput?.value,
      textContent: textInput?.value.trim(),
      pictureUrl: pictureInput?.value.trim(),
      voiceMemoUrl: voiceInput?.value.trim(),
    };

    if (habit.requireText && !payload.textContent) {
      setHabitEntryStatus('Text is required for this habit.', 'error');
      return;
    }
    if (habit.requirePicture && !payload.pictureUrl) {
      setHabitEntryStatus('Picture is required for this habit.', 'error');
      return;
    }
    if (habit.requireVoiceMemo && !payload.voiceMemoUrl) {
      setHabitEntryStatus('Voice memo is required for this habit.', 'error');
      return;
    }

    try {
      setHabitEntryStatus('Updating habit entry...');
      await apiFetch(`/habits/${habit.id}/entries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setHabitEntryStatus('Habit entry updated.');
      await loadHabitEntries();
    } catch (error) {
      setHabitEntryStatus(error.message, 'error');
    }
  }

  if (action === 'delete-entry') {
    const confirmed = window.confirm('Delete this habit entry?');
    if (!confirmed) return;
    try {
      setHabitEntryStatus('Deleting habit entry...');
      await apiFetch(`/habits/${habit.id}/entries/${id}`, {
        method: 'DELETE',
      });
      setHabitEntryStatus('Habit entry deleted.');
      await loadHabitEntries();
    } catch (error) {
      setHabitEntryStatus(error.message, 'error');
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
localLoginButton.addEventListener('click', handleLocalLogin);
localRegisterButton.addEventListener('click', handleLocalRegister);
createHabitButton.addEventListener('click', createHabit);
refreshHabitsButton.addEventListener('click', loadHabits);
habitsListEl.addEventListener('click', handleHabitListClick);
createHabitEntryButton.addEventListener('click', createHabitEntry);
refreshHabitEntriesButton.addEventListener('click', loadHabitEntries);
habitEntriesListEl.addEventListener('click', handleHabitEntriesListClick);

requireTextInput.addEventListener('change', () => {
  if (requireTextInput.checked) {
    allowTextInput.checked = true;
  }
});

requirePictureInput.addEventListener('change', () => {
  if (requirePictureInput.checked) {
    allowPictureInput.checked = true;
  }
});

requireVoiceInput.addEventListener('change', () => {
  if (requireVoiceInput.checked) {
    allowVoiceInput.checked = true;
  }
});

hydrateBaseUrl();
hydrateSessionFromStorage();
const handledCallback = handleAuthCallback();
if (handledCallback || jwtToken) {
  loadEntries();
  loadHabits();
} else {
  renderEntries();
  renderHabits();
  renderHabitEntries();
}
