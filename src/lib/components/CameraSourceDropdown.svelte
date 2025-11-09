<script lang="ts">
  export interface CameraSourceOption {
    id: string;
    label: string;
    type: 'camera' | 'screen';
  }

  interface Props {
    options?: CameraSourceOption[];
    selectedId?: string;
    ariaLabel: string;
    placeholder?: string;
    disabled?: boolean;
    onSelect?: (id: string) => void | Promise<void>;
  }

  let {
    options = [],
    selectedId = '',
    ariaLabel,
    placeholder,
    disabled = false,
    onSelect,
  }: Props = $props();

  let isOpen = $state(false);
  let buttonRef = $state<HTMLButtonElement>();
  let dropdownRef = $state<HTMLDivElement>();

  let selectedOption: CameraSourceOption | undefined = $derived.by(() =>
    options.find((option) => option.id === selectedId)
  );

  let buttonLabel = $derived(selectedOption?.label || placeholder || ariaLabel);

  function toggleDropdown() {
    if (disabled) return;
    isOpen = !isOpen;

    if (isOpen) {
      queueMicrotask(() => {
        const activeOption = dropdownRef?.querySelector('[data-active="true"]') as HTMLElement | null;
        activeOption?.focus();
      });
    }
  }

  function closeDropdown() {
    isOpen = false;
  }

  async function selectOption(optionId: string) {
    if (disabled) return;

    try {
      await onSelect?.(optionId);
    } finally {
      closeDropdown();
      buttonRef?.focus();
    }
  }

  function handleButtonKeyDown(event: KeyboardEvent) {
    if (disabled) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) {
        isOpen = true;
        queueMicrotask(() => {
          const firstOption = dropdownRef?.querySelector('[role="menuitemradio"]') as HTMLElement | null;
          firstOption?.focus();
        });
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
    }
  }

  function handleMenuKeyDown(event: KeyboardEvent) {
    const optionsEls = Array.from(dropdownRef?.querySelectorAll('[role="menuitemradio"]') || []) as HTMLElement[];
    if (optionsEls.length === 0) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDropdown();
        buttonRef?.focus();
      }
      return;
    }

    const currentIndex = optionsEls.findIndex(el => el === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % optionsEls.length;
      optionsEls[nextIndex]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      const prevIndex = currentIndex <= 0 ? optionsEls.length - 1 : currentIndex - 1;
      optionsEls[prevIndex]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      optionsEls[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      optionsEls[optionsEls.length - 1]?.focus();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeDropdown();
      buttonRef?.focus();
    }
  }

  function handleClickOutside(event: MouseEvent) {
    if (!isOpen || !buttonRef || !dropdownRef) return;

    const target = event.target as Node;
    if (!buttonRef.contains(target) && !dropdownRef.contains(target)) {
      closeDropdown();
    }
  }

  $effect(() => {
    if (!isOpen) return;
    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  });
</script>

<div class="source-dropdown">
  <button
    bind:this={buttonRef}
    type="button"
    class="source-button"
    onclick={toggleDropdown}
    onkeydown={handleButtonKeyDown}
    aria-haspopup="menu"
    aria-expanded={isOpen}
    aria-label={ariaLabel}
    disabled={disabled}
  >
    <span>{buttonLabel}</span>
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M4 6L8 10L12 6"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>

  {#if isOpen}
    <div
      bind:this={dropdownRef}
      class="dropdown-panel"
      role="menu"
      aria-label={ariaLabel}
      tabindex="-1"
      onkeydown={handleMenuKeyDown}
    >
      {#if options.length === 0}
        <div class="empty-state">
          {placeholder || ariaLabel}
        </div>
      {:else}
        {#each options as option}
          <button
            class="dropdown-option"
            class:active={option.id === selectedOption?.id}
            role="menuitemradio"
            aria-checked={option.id === selectedOption?.id}
            onclick={() => selectOption(option.id)}
            data-active={option.id === selectedOption?.id}
          >
            {option.label}
          </button>
        {/each}
      {/if}
    </div>
  {/if}
</div>

<style>
  .source-dropdown {
    position: relative;
    min-width: 220px;
  }

  .source-button {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: #f7fafc;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    color: #2d3748;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .source-button:hover:not(:disabled) {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  .source-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .source-button:focus-visible {
    outline: 3px solid #63b3ed;
    outline-offset: 2px;
  }

  .dropdown-panel {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    overflow: hidden;
  }

  .dropdown-option {
    width: 100%;
    padding: 0.75rem 1rem;
    background: white;
    border: none;
    text-align: left;
    font-size: 0.9rem;
    color: #2d3748;
    cursor: pointer;
    transition: background 0.2s;
  }

  .dropdown-option:hover,
  .dropdown-option:focus-visible {
    background: #f7fafc;
    outline: none;
  }

  .dropdown-option.active {
    background: #3182ce;
    color: white;
  }

  .empty-state {
    padding: 0.75rem 1rem;
    color: #4a5568;
    font-size: 0.85rem;
  }

  @media (max-width: 640px) {
    .source-dropdown {
      min-width: 180px;
    }
  }
</style>
