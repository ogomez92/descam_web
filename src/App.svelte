<script lang="ts">
  import { getApiKey } from './lib/storage.svelte';
  import { getTranslations } from './lib/i18n/store.svelte';
  import Onboarding from './lib/components/Onboarding.svelte';
  import CameraCapture from './lib/components/CameraCapture.svelte';
  import History from './lib/components/History.svelte';
  import Footer from './lib/components/Footer.svelte';
  import LanguageSelector from './lib/components/LanguageSelector.svelte';

  let descriptions = $state<string[]>([]);

  function handleDescriptionComplete(description: string) {
    descriptions = [description, ...descriptions];
  }

  let hasApiKey = $derived(!!getApiKey());
  let t = $derived(getTranslations());
</script>

<svelte:head>
  <title>{t.appTitle}</title>
</svelte:head>

{#if !hasApiKey}
  <Onboarding />
{:else}
  <main>
    <div class="container">
      <header>
        <div class="header-content">
          <h1>{t.appTitle}</h1>
          <LanguageSelector />
        </div>
      </header>

      <CameraCapture onDescriptionComplete={handleDescriptionComplete} />

      <History {descriptions} />
    </div>
  </main>

  <Footer />
{/if}

<style>
  main {
    min-height: calc(100vh - 200px);
    padding: 2rem 1rem;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
  }

  header {
    margin-bottom: 2rem;
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }

  h1 {
    margin: 0;
    font-size: 2rem;
    color: #1a202c;
    font-weight: 700;
  }

  @media (max-width: 640px) {
    main {
      padding: 1.5rem 1rem;
    }

    .header-content {
      flex-direction: column;
      align-items: flex-start;
    }

    h1 {
      font-size: 1.5rem;
    }
  }
</style>
