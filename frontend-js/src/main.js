import './style.css';

const app = document.querySelector('#app');

const template = `
  <main class="container">
    <header>
      <h1>Vibe Habit Tracker Playground</h1>
      <p>
        Quick and dirty UI for testing the Nest API and the Google OAuth flow.
        Configure the backend base URL, ping it, and jump into the OAuth consent
        screen without wiring up a full frontend yet.
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
      <h2>Sign in with Google</h2>
      <p>
        Opens <code>/auth/google</code> from the backend in a new tab. Complete
        the consent screen and the API will show the authenticated user payload
        plus the OAuth tokens.
      </p>
      <a id="googleLoginLink" class="primary" target="_blank" rel="noreferrer"
        >Continue with Google</a
      >
      <p class="hint">
        Keep <code>http://localhost:3000/auth/google/redirect</code> authorized
        in Google Cloud if you're running locally. The callback response renders
        in the tab that opens.
      </p>
    </section>
  </main>
`;

app.innerHTML = template;

const STORAGE_KEY = 'vibe-habit-tracker-api-base';
const apiBaseInput = document.querySelector('#apiBaseUrl');
const saveSettingsButton = document.querySelector('#saveSettings');
const pingButton = document.querySelector('#pingApi');
const outputEl = document.querySelector('#pingOutput');
const googleLoginLink = document.querySelector('#googleLoginLink');

const setOutput = (content) => {
  outputEl.textContent =
    typeof content === 'string' ? content : JSON.stringify(content, null, 2);
};

const getBaseUrl = () => {
  const raw = apiBaseInput.value?.trim();
  return raw?.length ? raw : 'http://localhost:3000';
};

const updateLoginLink = () => {
  const base = getBaseUrl().replace(/\/$/, '');
  googleLoginLink.href = `${base}/auth/google`;
};

const hydrateBaseUrl = () => {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  apiBaseInput.value = stored ?? 'http://localhost:3000';
  updateLoginLink();
};

saveSettingsButton.addEventListener('click', () => {
  const base = getBaseUrl();
  window.localStorage.setItem(STORAGE_KEY, base);
  updateLoginLink();
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

hydrateBaseUrl();
