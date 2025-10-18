<script lang="ts">
  import { setApiKey } from '../storage.svelte';
  import { getTranslations } from '../i18n/store.svelte';

  let apiKeyInput = $state('');
  let t = $derived(getTranslations());

  function handleSave() {
    if (apiKeyInput.trim()) {
      setApiKey(apiKeyInput.trim());
    }
  }

  function handleSubmit(event: Event) {
    event.preventDefault();
    handleSave();
  }
</script>

<div class="onboarding">
  <div class="onboarding-content">
    <h1>{t.onboarding.title}</h1>
    <p class="description">{t.onboarding.description}</p>

    <form onsubmit={handleSubmit}>
      <div class="form-group">
        <label for="api-key">{t.onboarding.apiKeyLabel}</label>
        <input
          id="api-key"
          type="password"
          bind:value={apiKeyInput}
          placeholder={t.onboarding.apiKeyPlaceholder}
          required
          autocomplete="off"
          aria-describedby="security-note"
        />
      </div>

      <p id="security-note" class="security-note">
        {t.onboarding.securityNote}
      </p>

      <button type="submit" class="primary-button">
        {t.onboarding.saveButton}
      </button>
    </form>
  </div>
</div>

<style>
  .onboarding {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 1rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  .onboarding-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    max-width: 500px;
    width: 100%;
  }

  h1 {
    margin: 0 0 1rem 0;
    font-size: 1.75rem;
    color: #1a202c;
  }

  .description {
    margin: 0 0 1.5rem 0;
    color: #4a5568;
    line-height: 1.6;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: #2d3748;
  }

  input {
    width: 100%;
    padding: 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    font-size: 1rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #667eea;
  }

  .security-note {
    margin: 0 0 1.5rem 0;
    padding: 0.75rem;
    background: #edf2f7;
    border-left: 4px solid #667eea;
    font-size: 0.875rem;
    color: #4a5568;
    line-height: 1.5;
  }

  .primary-button {
    width: 100%;
    padding: 0.875rem;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .primary-button:hover {
    background: #5a67d8;
  }

  .primary-button:active {
    background: #4c51bf;
  }

  @media (max-width: 640px) {
    .onboarding-content {
      padding: 1.5rem;
    }

    h1 {
      font-size: 1.5rem;
    }
  }
</style>
