<script lang="ts">
  import { onMount } from 'svelte';
  import { getTranslations, getCurrentLanguage, getWebsiteUrl } from '../i18n/store.svelte';
  import { getApiKey } from '../storage.svelte';
  import { checkCameraPermission, type CameraPermissionStatus } from '../camera';

  let cameraStatus = $state<CameraPermissionStatus>('unknown');
  let t = $derived(getTranslations());

  onMount(async () => {
    cameraStatus = await checkCameraPermission();

    // Listen for permission changes
    if (navigator.permissions) {
      try {
        const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
        result.addEventListener('change', async () => {
          cameraStatus = await checkCameraPermission();
        });
      } catch (error) {
        // Permissions API might not be fully supported
      }
    }
  });

  let hasApiKey = $derived(!!getApiKey());
  let websiteUrl = $derived(getWebsiteUrl(getCurrentLanguage()));

  let cameraStatusText = $derived(
    cameraStatus === 'granted'
      ? t.footer.cameraAccessGranted
      : cameraStatus === 'denied'
        ? t.footer.cameraAccessDenied
        : t.footer.cameraAccessUnknown
  );

  let apiStatusText = $derived(
    hasApiKey ? t.footer.apiKeyFound : t.footer.apiKeyNotFound
  );
</script>

<footer>
  <div class="footer-content">
    <div class="status-indicators">
      <span class="status-item" class:status-ok={hasApiKey} class:status-error={!hasApiKey}>
        {apiStatusText}
      </span>
      <span
        class="status-item"
        class:status-ok={cameraStatus === 'granted'}
        class:status-error={cameraStatus === 'denied'}
        class:status-unknown={cameraStatus === 'unknown'}
      >
        {cameraStatusText}
      </span>
    </div>

    <div class="copyright">
      <span>{t.footer.copyright}</span>
      <span class="separator">•</span>
      <a href={websiteUrl} target="_blank" rel="noopener noreferrer">
        oriolgomez.com
      </a>
    </div>
  </div>
</footer>

<style>
  footer {
    margin-top: 3rem;
    padding: 2rem 1rem;
    background: #2d3748;
    color: white;
  }

  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: center;
  }

  .status-indicators {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    justify-content: center;
  }

  .status-item {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    font-size: 0.875rem;
    font-weight: 500;
    background: #4a5568;
    color: white;
  }

  .status-item.status-ok {
    background: #48bb78;
    color: white;
  }

  .status-item.status-error {
    background: #f56565;
    color: white;
  }

  .status-item.status-unknown {
    background: #ed8936;
    color: white;
  }

  .copyright {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: #cbd5e0;
  }

  .separator {
    color: #718096;
  }

  a {
    color: #90cdf4;
    text-decoration: none;
    transition: color 0.2s;
  }

  a:hover {
    color: #63b3ed;
    text-decoration: underline;
  }

  a:focus {
    outline: 2px solid #90cdf4;
    outline-offset: 2px;
  }

  @media (max-width: 640px) {
    footer {
      padding: 1.5rem 1rem;
    }

    .status-indicators {
      flex-direction: column;
      width: 100%;
      max-width: 300px;
    }

    .status-item {
      text-align: center;
    }

    .copyright {
      flex-direction: column;
      gap: 0.25rem;
      text-align: center;
    }

    .separator {
      display: none;
    }
  }
</style>
