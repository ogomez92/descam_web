<script lang="ts">
  import { getCurrentLanguage, setLanguage, supportedLanguages, languageNames, getTranslations } from '../i18n/store.svelte';
  import type { Language } from '../i18n/translations';

  let isOpen = $state(false);
  let buttonRef = $state<HTMLButtonElement>();
  let dropdownRef = $state<HTMLDivElement>();
  let t = $derived(getTranslations());

  function toggleDropdown() {
    isOpen = !isOpen;
  }

  function selectLanguage(selectedLang: Language) {
    setLanguage(selectedLang);
    isOpen = false;
    buttonRef?.focus();
  }

  function handleButtonKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) {
        isOpen = true;
        // Focus first item after dropdown opens
        setTimeout(() => {
          const firstOption = dropdownRef?.querySelector('[role="menuitem"]') as HTMLElement;
          firstOption?.focus();
        }, 0);
      }
    } else if (event.key === 'Escape') {
      isOpen = false;
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent) {
    const options = Array.from(dropdownRef?.querySelectorAll('[role="menuitem"]') || []) as HTMLElement[];
    const currentIndex = options.findIndex(el => el === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % options.length;
      options[nextIndex]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1;
      options[prevIndex]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      isOpen = false;
      buttonRef?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      options[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      options[options.length - 1]?.focus();
    }
  }

  function handleOptionClick(selectedLang: Language) {
    selectLanguage(selectedLang);
  }

  function handleClickOutside(event: MouseEvent) {
    if (isOpen && buttonRef && dropdownRef) {
      const target = event.target as Node;
      if (!buttonRef.contains(target) && !dropdownRef.contains(target)) {
        isOpen = false;
      }
    }
  }

  $effect(() => {
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<div class="language-selector">
  <button
    bind:this={buttonRef}
    class="language-button"
    onclick={toggleDropdown}
    onkeydown={handleButtonKeyDown}
    aria-expanded={isOpen}
    aria-haspopup="menu"
    aria-controls="language-menu"
    aria-label={t.language.selectLabel}
    type="button"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M10 1C5.02944 1 1 5.02944 1 10C1 14.9706 5.02944 19 10 19C14.9706 19 19 14.9706 19 10C19 5.02944 14.9706 1 10 1Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M1 10H19"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <path
        d="M10 1C12.5 4 13.5 7 13.5 10C13.5 13 12.5 16 10 19C7.5 16 6.5 13 6.5 10C6.5 7 7.5 4 10 1Z"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
    <span>{languageNames[getCurrentLanguage()]}</span>
  </button>

  {#if isOpen}
    <div
      bind:this={dropdownRef}
      id="language-menu"
      class="language-dropdown"
      role="menu"
      tabindex="-1"
      onkeydown={handleMenuKeyDown}
    >
      {#each supportedLanguages as language}
        <button
          class="language-option"
          class:active={language === getCurrentLanguage()}
          onclick={() => handleOptionClick(language)}
          role="menuitem"
          tabindex="-1"
          aria-current={language === getCurrentLanguage() ? 'true' : undefined}
        >
          {languageNames[language]}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .language-selector {
    position: relative;
  }

  .language-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #f7fafc;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    color: #2d3748;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .language-button:hover {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  .language-button:focus-visible {
    outline: 3px solid #667eea;
    outline-offset: 2px;
  }

  .language-button svg {
    flex-shrink: 0;
  }

  .language-dropdown {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 150px;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 4px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    overflow: hidden;
  }

  .language-option {
    width: 100%;
    padding: 0.75rem 1rem;
    background: white;
    border: none;
    text-align: left;
    font-size: 0.875rem;
    color: #2d3748;
    cursor: pointer;
    transition: background 0.2s;
  }

  .language-option:hover {
    background: #f7fafc;
  }

  .language-option:focus-visible {
    outline: none;
    background: #edf2f7;
  }

  .language-option.active {
    background: #667eea;
    color: white;
    font-weight: 600;
  }

  .language-option.active:hover {
    background: #5a67d8;
  }

  @media (max-width: 640px) {
    .language-dropdown {
      right: auto;
      left: 0;
    }
  }
</style>
