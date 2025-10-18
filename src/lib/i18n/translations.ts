export type Language = 'en' | 'es' | 'de' | 'fr' | 'it';

export interface Translations {
  appTitle: string;
  language: {
    selectLabel: string;
  };
  onboarding: {
    title: string;
    description: string;
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    saveButton: string;
    securityNote: string;
  };
  camera: {
    captureButton: string;
    capturingFrame: string;
    uploadingImage: string;
    errorNoPermission: string;
    errorNotSupported: string;
    errorGeneric: string;
  };
  prompt: {
    label: string;
    placeholder: string;
    defaultPrompt: string;
  };
  history: {
    title: string;
  };
  footer: {
    apiKeyFound: string;
    apiKeyNotFound: string;
    cameraAccessGranted: string;
    cameraAccessDenied: string;
    cameraAccessUnknown: string;
    copyright: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Descam - AI Image Description',
    language: {
      selectLabel: 'Select language',
    },
    onboarding: {
      title: 'Welcome to Descam',
      description: 'To get started, please enter your OpenAI API key. This key is stored locally in your browser and is never sent to our servers.',
      apiKeyLabel: 'OpenAI API Key',
      apiKeyPlaceholder: 'sk-...',
      saveButton: 'Save and Continue',
      securityNote: 'Your API key is stored locally and never leaves your device except when making requests to OpenAI.',
    },
    camera: {
      captureButton: 'Capture Image',
      capturingFrame: 'Capturing frame...',
      uploadingImage: 'Uploading image...',
      errorNoPermission: 'Camera permission denied. Please allow camera access in your browser settings.',
      errorNotSupported: 'Camera access is not supported in this browser. Please use HTTPS or a modern browser.',
      errorGeneric: 'An error occurred while accessing the camera. Please try again.',
    },
    prompt: {
      label: 'Custom Prompt (optional)',
      placeholder: 'Describe this image in detail',
      defaultPrompt: 'Describe this image in detail, including objects, people shown, etc. Read any visible text. If someone\'s face is shown, try to say whether it is centered or if they are off screen.',
    },
    history: {
      title: 'History',
    },
    footer: {
      apiKeyFound: 'OpenAI API Key: Configured',
      apiKeyNotFound: 'OpenAI API Key: Not Configured',
      cameraAccessGranted: 'Camera: Granted',
      cameraAccessDenied: 'Camera: Denied',
      cameraAccessUnknown: 'Camera: Unknown',
      copyright: '© 2025 Oriol Gómez',
    },
  },
  es: {
    appTitle: 'Descam - Descripción de Imagen con IA',
    language: {
      selectLabel: 'Seleccionar idioma',
    },
    onboarding: {
      title: 'Bienvenido a Descam',
      description: 'Para comenzar, por favor ingresa tu clave API de OpenAI. Esta clave se almacena localmente en tu navegador y nunca se envía a nuestros servidores.',
      apiKeyLabel: 'Clave API de OpenAI',
      apiKeyPlaceholder: 'sk-...',
      saveButton: 'Guardar y Continuar',
      securityNote: 'Tu clave API se almacena localmente y nunca sale de tu dispositivo excepto al hacer solicitudes a OpenAI.',
    },
    camera: {
      captureButton: 'Capturar Imagen',
      capturingFrame: 'Capturando fotograma...',
      uploadingImage: 'Subiendo imagen...',
      errorNoPermission: 'Permiso de cámara denegado. Por favor permite el acceso a la cámara en la configuración de tu navegador.',
      errorNotSupported: 'El acceso a la cámara no está soportado en este navegador. Por favor usa HTTPS o un navegador moderno.',
      errorGeneric: 'Ocurrió un error al acceder a la cámara. Por favor intenta de nuevo.',
    },
    prompt: {
      label: 'Instrucción Personalizada (opcional)',
      placeholder: 'Describe esta imagen en detalle',
      defaultPrompt: 'Describe esta imagen en detalle, incluyendo objetos, personas mostradas, etc. Lee cualquier texto visible. Si se muestra el rostro de alguien, intenta decir si está centrado o si están fuera de pantalla.',
    },
    history: {
      title: 'Historial',
    },
    footer: {
      apiKeyFound: 'Clave API de OpenAI: Configurada',
      apiKeyNotFound: 'Clave API de OpenAI: No Configurada',
      cameraAccessGranted: 'Cámara: Permitida',
      cameraAccessDenied: 'Cámara: Denegada',
      cameraAccessUnknown: 'Cámara: Desconocido',
      copyright: '© 2025 Oriol Gómez',
    },
  },
  de: {
    appTitle: 'Descam - KI-Bildbeschreibung',
    language: {
      selectLabel: 'Sprache auswählen',
    },
    onboarding: {
      title: 'Willkommen bei Descam',
      description: 'Um zu beginnen, geben Sie bitte Ihren OpenAI API-Schlüssel ein. Dieser Schlüssel wird lokal in Ihrem Browser gespeichert und nie an unsere Server gesendet.',
      apiKeyLabel: 'OpenAI API-Schlüssel',
      apiKeyPlaceholder: 'sk-...',
      saveButton: 'Speichern und Fortfahren',
      securityNote: 'Ihr API-Schlüssel wird lokal gespeichert und verlässt Ihr Gerät nur bei Anfragen an OpenAI.',
    },
    camera: {
      captureButton: 'Bild Aufnehmen',
      capturingFrame: 'Frame wird aufgenommen...',
      uploadingImage: 'Bild wird hochgeladen...',
      errorNoPermission: 'Kamera-Berechtigung verweigert. Bitte erlauben Sie den Kamerazugriff in Ihren Browsereinstellungen.',
      errorNotSupported: 'Kamerazugriff wird in diesem Browser nicht unterstützt. Bitte verwenden Sie HTTPS oder einen modernen Browser.',
      errorGeneric: 'Beim Zugriff auf die Kamera ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
    },
    prompt: {
      label: 'Benutzerdefinierte Anweisung (optional)',
      placeholder: 'Beschreiben Sie dieses Bild im Detail',
      defaultPrompt: 'Beschreiben Sie dieses Bild im Detail, einschließlich Objekte, gezeigte Personen, usw. Lesen Sie jeden sichtbaren Text. Wenn das Gesicht einer Person gezeigt wird, versuchen Sie zu sagen, ob es zentriert ist oder ob sie außerhalb des Bildschirms sind.',
    },
    history: {
      title: 'Verlauf',
    },
    footer: {
      apiKeyFound: 'OpenAI API-Schlüssel: Konfiguriert',
      apiKeyNotFound: 'OpenAI API-Schlüssel: Nicht Konfiguriert',
      cameraAccessGranted: 'Kamera: Erlaubt',
      cameraAccessDenied: 'Kamera: Verweigert',
      cameraAccessUnknown: 'Kamera: Unbekannt',
      copyright: '© 2025 Oriol Gómez',
    },
  },
  fr: {
    appTitle: 'Descam - Description d\'Image par IA',
    language: {
      selectLabel: 'Sélectionner la langue',
    },
    onboarding: {
      title: 'Bienvenue sur Descam',
      description: 'Pour commencer, veuillez entrer votre clé API OpenAI. Cette clé est stockée localement dans votre navigateur et n\'est jamais envoyée à nos serveurs.',
      apiKeyLabel: 'Clé API OpenAI',
      apiKeyPlaceholder: 'sk-...',
      saveButton: 'Enregistrer et Continuer',
      securityNote: 'Votre clé API est stockée localement et ne quitte jamais votre appareil sauf lors des requêtes à OpenAI.',
    },
    camera: {
      captureButton: 'Capturer l\'Image',
      capturingFrame: 'Capture de l\'image...',
      uploadingImage: 'Téléchargement de l\'image...',
      errorNoPermission: 'Permission de caméra refusée. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
      errorNotSupported: 'L\'accès à la caméra n\'est pas pris en charge dans ce navigateur. Veuillez utiliser HTTPS ou un navigateur moderne.',
      errorGeneric: 'Une erreur s\'est produite lors de l\'accès à la caméra. Veuillez réessayer.',
    },
    prompt: {
      label: 'Instruction Personnalisée (optionnel)',
      placeholder: 'Décrivez cette image en détail',
      defaultPrompt: 'Décrivez cette image en détail, y compris les objets, les personnes montrées, etc. Lisez tout texte visible. Si le visage de quelqu\'un est montré, essayez de dire s\'il est centré ou s\'ils sont hors de l\'écran.',
    },
    history: {
      title: 'Historique',
    },
    footer: {
      apiKeyFound: 'Clé API OpenAI : Configurée',
      apiKeyNotFound: 'Clé API OpenAI : Non Configurée',
      cameraAccessGranted: 'Caméra : Accordée',
      cameraAccessDenied: 'Caméra : Refusée',
      cameraAccessUnknown: 'Caméra : Inconnu',
      copyright: '© 2025 Oriol Gómez',
    },
  },
  it: {
    appTitle: 'Descam - Descrizione Immagine con IA',
    language: {
      selectLabel: 'Seleziona lingua',
    },
    onboarding: {
      title: 'Benvenuto su Descam',
      description: 'Per iniziare, inserisci la tua chiave API di OpenAI. Questa chiave è memorizzata localmente nel tuo browser e non viene mai inviata ai nostri server.',
      apiKeyLabel: 'Chiave API OpenAI',
      apiKeyPlaceholder: 'sk-...',
      saveButton: 'Salva e Continua',
      securityNote: 'La tua chiave API è memorizzata localmente e non lascia mai il tuo dispositivo tranne quando effettui richieste a OpenAI.',
    },
    camera: {
      captureButton: 'Cattura Immagine',
      capturingFrame: 'Catturando frame...',
      uploadingImage: 'Caricamento immagine...',
      errorNoPermission: 'Permesso fotocamera negato. Consenti l\'accesso alla fotocamera nelle impostazioni del browser.',
      errorNotSupported: 'L\'accesso alla fotocamera non è supportato in questo browser. Utilizza HTTPS o un browser moderno.',
      errorGeneric: 'Si è verificato un errore durante l\'accesso alla fotocamera. Riprova.',
    },
    prompt: {
      label: 'Istruzione Personalizzata (opzionale)',
      placeholder: 'Descrivi questa immagine in dettaglio',
      defaultPrompt: 'Descrivi questa immagine in dettaglio, includendo oggetti, persone mostrate, ecc. Leggi qualsiasi testo visibile. Se è mostrato il volto di qualcuno, prova a dire se è centrato o se sono fuori dallo schermo.',
    },
    history: {
      title: 'Cronologia',
    },
    footer: {
      apiKeyFound: 'Chiave API OpenAI: Configurata',
      apiKeyNotFound: 'Chiave API OpenAI: Non Configurata',
      cameraAccessGranted: 'Fotocamera: Consentita',
      cameraAccessDenied: 'Fotocamera: Negata',
      cameraAccessUnknown: 'Fotocamera: Sconosciuto',
      copyright: '© 2025 Oriol Gómez',
    },
  },
};
