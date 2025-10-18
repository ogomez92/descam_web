<script lang="ts">
  import { getTranslations } from '../i18n/store.svelte';

  interface Props {
    descriptions: string[];
  }

  let { descriptions }: Props = $props();
  let t = $derived(getTranslations());

  // Track the latest description for the live region
  let liveRegionMessage = $state('');
  let previousCount = $state(0);

  // Initialize with placeholder and update when new descriptions are added
  $effect(() => {
    if (descriptions.length > previousCount && descriptions.length > 0) {
      const latestDescription = descriptions[descriptions.length - 1];
      liveRegionMessage = `${t.history.title} ${descriptions.length}: ${latestDescription}`;
      previousCount = descriptions.length;
    } else if (liveRegionMessage === '' || descriptions.length === 0) {
      liveRegionMessage = t.history.placeholder;
    }
  });
</script>

<!-- Live region for screen readers - always present -->
<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
  {liveRegionMessage}
</div>

{#if descriptions.length > 0}
  <div class="history">
    <h2>{t.history.title}</h2>

    <div class="descriptions">
      {#each descriptions as description, index}
        <div class="description-item">
          <h3>Description {descriptions.length - index}</h3>
          <p>{description}</p>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  /* Screen reader only - visually hidden but accessible */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }

  .history {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #e2e8f0;
  }

  h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
    color: #1a202c;
  }

  .descriptions {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .description-item {
    padding: 1.25rem;
    background: #f7fafc;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
  }

  h3 {
    margin: 0 0 0.75rem 0;
    font-size: 1.125rem;
    color: #2d3748;
  }

  p {
    margin: 0;
    line-height: 1.6;
    color: #1a202c;
    /* High contrast for better readability */
  }

  @media (max-width: 640px) {
    h2 {
      font-size: 1.25rem;
    }

    h3 {
      font-size: 1rem;
    }

    .description-item {
      padding: 1rem;
    }
  }
</style>
