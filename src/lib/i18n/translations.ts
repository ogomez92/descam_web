export type Language = 'en' | 'es' | 'de' | 'fr' | 'it';

export interface Translations {
  appTitle: string;
  photoModeTitle: string;
  videoModeTitle: string;
  language: {
    selectLabel: string;
  };
  mode: {
    switchToPhoto: string;
    switchToVideo: string;
    currentModePhoto: string;
    currentModeVideo: string;
    switchModeAriaLabel: string;
    geminiKeyRequiredForVideo: string;
  };
  onboarding: {
    title: string;
    description: string;
    apiKeyLabel: string;
    apiKeyPlaceholder: string;
    geminiApiKeyLabel: string;
    geminiApiKeyPlaceholder: string;
    saveButton: string;
    securityNote: string;
    sourceCodeLink: string;
    atLeastOneKeyRequired: string;
  };
  camera: {
    captureButton: string;
    uploadButton: string;
    capturingFrame: string;
    uploadingImage: string;
    errorNoPermission: string;
    errorNotSupported: string;
    errorGeneric: string;
    errorVideoSource: string;
    errorNotReady: string;
    errorNotFound: string;
    switchCamera: string;
    frontCamera: string;
    backCamera: string;
    camera: string;
    initializing: string;
    videoFeedAriaLabel: string;
    cameraSelectionAriaLabel: string;
    shareScreen: string;
    stopSharing: string;
    screenShare: string;
    errorScreenCapture: string;
  };
  outputMode: {
    label: string;
    aria: string;
    tts: string;
    ariaDescription: string;
    ttsDescription: string;
    ttsNotSupported: string;
  };
  video: {
    startStreaming: string;
    stopStreaming: string;
    streaming: string;
    connecting: string;
    currentDescription: string;
    errorNoApiKey: string;
    errorGeneric: string;
    startStreamingAriaLabel: string;
    stopStreamingAriaLabel: string;
  };
  prompt: {
    label: string;
    placeholder: string;
    defaultPrompt: string;
    resetButton: string;
    customPromptLabel: string;
    customPromptPlaceholder: string;
    resetButtonAriaLabel: string;
  };
  history: {
    title: string;
  };
  outputs: {
    legend: string;
    stopTTS: string;
    ttsRate: string;
  };
  footer: {
    apiKeyFound: string;
    apiKeyNotFound: string;
    cameraAccessGranted: string;
    cameraAccessDenied: string;
    cameraAccessUnknown: string;
    cameraActive: string;
    cameraInactive: string;
    copyright: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appTitle: 'Descam - AI Image Description',
    photoModeTitle: 'Descam - Photo Mode',
    videoModeTitle: 'Descam - Video Mode',
    language: {
      selectLabel: 'Select language',
    },
    mode: {
      switchToPhoto: 'Switch to Photo Mode',
      switchToVideo: 'Switch to Video Mode',
      currentModePhoto: 'Currently in Photo Mode',
      currentModeVideo: 'Currently in Video Mode',
      switchModeAriaLabel: 'Switch between photo and video modes',
      geminiKeyRequiredForVideo: 'A Gemini API key is required to use video mode. Please add your Gemini API key in the settings.',
    },
    onboarding: {
      title: 'Welcome to Descam',
      description: 'To get started, please enter at least one API key. You can use OpenAI for photo descriptions, Gemini for both photo and video, or both. These keys are stored locally in your browser.',
      apiKeyLabel: 'OpenAI API Key (for Photo Mode)',
      apiKeyPlaceholder: 'sk-...',
      geminiApiKeyLabel: 'Gemini API Key (for Photo & Video Mode)',
      geminiApiKeyPlaceholder: 'Enter your Gemini API key',
      saveButton: 'Save and Continue',
      securityNote: 'Your API keys are stored locally and never leave your device except when making requests to OpenAI or Google.',
      sourceCodeLink: 'View source code on GitHub',
      atLeastOneKeyRequired: 'Please provide at least one API key (OpenAI or Gemini).',
    },
    camera: {
      captureButton: 'Capture Image',
      uploadButton: 'Upload Image',
      capturingFrame: 'Capturing frame...',
      uploadingImage: 'Uploading image...',
      errorNoPermission: 'Camera permission denied. Please allow camera access in your browser settings.',
      errorNotSupported: 'Camera access is not supported in this browser. Please use HTTPS or a modern browser.',
      errorGeneric: 'An error occurred while accessing the camera. Please try again.',
      errorVideoSource: 'Could not start video source. The camera may be in use by another application.',
      errorNotReady: 'Camera is not ready. Please wait.',
      errorNotFound: 'No camera found.',
      switchCamera: 'Switch Camera',
      frontCamera: 'Front Camera',
      backCamera: 'Back Camera',
      camera: 'Camera',
      initializing: 'Initializing camera...',
      videoFeedAriaLabel: 'Live camera feed',
      cameraSelectionAriaLabel: 'Select camera',
      shareScreen: 'Share Screen',
      stopSharing: 'Stop Sharing',
      screenShare: 'Screen Share',
      errorScreenCapture: 'Failed to capture screen. Please try again.',
    },
    outputMode: {
      label: 'Output Mode',
      aria: 'ARIA (Screen Reader)',
      tts: 'Text-to-Speech',
      ariaDescription: 'Use ARIA live regions for screen readers',
      ttsDescription: 'Speak descriptions aloud using text-to-speech',
      ttsNotSupported: 'Text-to-speech is not supported in this browser.',
    },
    video: {
      startStreaming: 'Start Streaming',
      stopStreaming: 'Stop Streaming',
      streaming: 'Streaming video...',
      connecting: 'Connecting to Gemini...',
      currentDescription: 'Current Description',
      errorNoApiKey: 'Gemini API key is required for video mode.',
      errorGeneric: 'Failed to start streaming.',
      startStreamingAriaLabel: 'Start streaming video to Gemini',
      stopStreamingAriaLabel: 'Stop streaming video',
    },
    prompt: {
      label: 'Custom Prompt (optional)',
      placeholder: 'Describe this image in detail',
      defaultPrompt: 'Describe this image in detail, including objects, people shown, etc. Read any visible text. If someone\'s face is shown, try to say whether it is centered or if they are off screen.',
      resetButton: 'Reset Prompt',
      customPromptLabel: 'Custom Prompt (optional)',
      customPromptPlaceholder: 'Enter custom instructions',
      resetButtonAriaLabel: 'Reset prompt to default',
    },
    history: {
      title: 'History',
    },
    outputs: {
      legend: 'Outputs',
      stopTTS: 'Stop Speaking',
      ttsRate: 'Speech Rate',
    },
    footer: {
      apiKeyFound: 'OpenAI API Key: Configured',
      apiKeyNotFound: 'OpenAI API Key: Not Configured',
      cameraAccessGranted: 'Camera: Granted',
      cameraAccessDenied: 'Camera: Denied',
      cameraAccessUnknown: 'Camera: Unknown',
      cameraActive: 'Camera:',
      cameraInactive: 'Camera: Inactive',
      copyright: '© 2025 Oriol Gómez',
    },
  },
  es: {
    appTitle: 'Descam - Descripción de Imagen con IA',
    photoModeTitle: 'Descam - Modo Foto',
    videoModeTitle: 'Descam - Modo Video',
    language: {
      selectLabel: 'Seleccionar idioma',
    },
    mode: {
      switchToPhoto: 'Cambiar a Modo Foto',
      switchToVideo: 'Cambiar a Modo Video',
      currentModePhoto: 'Actualmente en Modo Foto',
      currentModeVideo: 'Actualmente en Modo Video',
      switchModeAriaLabel: 'Cambiar entre modos foto y video',
      geminiKeyRequiredForVideo: 'Se requiere una clave API de Gemini para usar el modo video. Por favor agrega tu clave API de Gemini en la configuración.',
    },
    onboarding: {
      title: 'Bienvenido a Descam',
      description: 'Para comenzar, por favor ingresa al menos una clave API. Puedes usar OpenAI para descripciones de fotos, Gemini para fotos y video, o ambos. Estas claves se almacenan localmente en tu navegador.',
      apiKeyLabel: 'Clave API de OpenAI (para Modo Foto)',
      apiKeyPlaceholder: 'sk-...',
      geminiApiKeyLabel: 'Clave API de Gemini (para Modos Foto y Video)',
      geminiApiKeyPlaceholder: 'Ingresa tu clave API de Gemini',
      saveButton: 'Guardar y Continuar',
      securityNote: 'Tus claves API se almacenan localmente y nunca salen de tu dispositivo excepto al hacer solicitudes a OpenAI o Google.',
      sourceCodeLink: 'Ver código fuente en GitHub',
      atLeastOneKeyRequired: 'Por favor proporciona al menos una clave API (OpenAI o Gemini).',
    },
    camera: {
      captureButton: 'Capturar Imagen',
      uploadButton: 'Subir Imagen',
      capturingFrame: 'Capturando fotograma...',
      uploadingImage: 'Subiendo imagen...',
      errorNoPermission: 'Permiso de cámara denegado. Por favor permite el acceso a la cámara en la configuración de tu navegador.',
      errorNotSupported: 'El acceso a la cámara no está soportado en este navegador. Por favor usa HTTPS o un navegador moderno.',
      errorGeneric: 'Ocurrió un error al acceder a la cámara. Por favor intenta de nuevo.',
      errorVideoSource: 'No se pudo iniciar la fuente de video. La cámara puede estar en uso por otra aplicación.',
      errorNotReady: 'La cámara no está lista. Por favor espera.',
      errorNotFound: 'No se encontró cámara.',
      switchCamera: 'Cambiar Cámara',
      frontCamera: 'Cámara Frontal',
      backCamera: 'Cámara Trasera',
      camera: 'Cámara',
      initializing: 'Inicializando cámara...',
      videoFeedAriaLabel: 'Transmisión en vivo de la cámara',
      cameraSelectionAriaLabel: 'Seleccionar cámara',
      shareScreen: 'Compartir Pantalla',
      stopSharing: 'Detener Compartir',
      screenShare: 'Compartir Pantalla',
      errorScreenCapture: 'Error al capturar pantalla. Por favor intenta de nuevo.',
    },
    outputMode: {
      label: 'Modo de Salida',
      aria: 'ARIA (Lector de Pantalla)',
      tts: 'Texto a Voz',
      ariaDescription: 'Usar regiones en vivo ARIA para lectores de pantalla',
      ttsDescription: 'Leer descripciones en voz alta usando texto a voz',
      ttsNotSupported: 'Texto a voz no está soportado en este navegador.',
    },
    video: {
      startStreaming: 'Iniciar Transmisión',
      stopStreaming: 'Detener Transmisión',
      streaming: 'Transmitiendo video...',
      connecting: 'Conectando a Gemini...',
      currentDescription: 'Descripción Actual',
      errorNoApiKey: 'Se requiere la clave API de Gemini para el modo video.',
      errorGeneric: 'Error al iniciar la transmisión.',
      startStreamingAriaLabel: 'Iniciar transmisión de video a Gemini',
      stopStreamingAriaLabel: 'Detener transmisión de video',
    },
    prompt: {
      label: 'Instrucción Personalizada (opcional)',
      placeholder: 'Describe esta imagen en detalle',
      defaultPrompt: 'Describe esta imagen en detalle, incluyendo objetos, personas mostradas, etc. Lee cualquier texto visible. Si se muestra el rostro de alguien, intenta decir si está centrado o si están fuera de pantalla.',
      resetButton: 'Restablecer Instrucción',
      customPromptLabel: 'Instrucción Personalizada (opcional)',
      customPromptPlaceholder: 'Ingresa instrucciones personalizadas',
      resetButtonAriaLabel: 'Restablecer instrucción a predeterminada',
    },
    history: {
      title: 'Historial',
    },
    outputs: {
      legend: 'Salidas',
      stopTTS: 'Detener Lectura',
      ttsRate: 'Velocidad de Voz',
    },
    footer: {
      apiKeyFound: 'Clave API de OpenAI: Configurada',
      apiKeyNotFound: 'Clave API de OpenAI: No Configurada',
      cameraAccessGranted: 'Cámara: Permitida',
      cameraAccessDenied: 'Cámara: Denegada',
      cameraAccessUnknown: 'Cámara: Desconocido',
      cameraActive: 'Cámara:',
      cameraInactive: 'Cámara: Inactiva',
      copyright: '© 2025 Oriol Gómez',
    },
  },
  de: {
    appTitle: 'Descam - KI-Bildbeschreibung',
    photoModeTitle: 'Descam - Fotomodus',
    videoModeTitle: 'Descam - Videomodus',
    language: {
      selectLabel: 'Sprache auswählen',
    },
    mode: {
      switchToPhoto: 'Zu Fotomodus wechseln',
      switchToVideo: 'Zu Videomodus wechseln',
      currentModePhoto: 'Derzeit im Fotomodus',
      currentModeVideo: 'Derzeit im Videomodus',
      switchModeAriaLabel: 'Zwischen Foto- und Videomodus wechseln',
      geminiKeyRequiredForVideo: 'Für den Videomodus ist ein Gemini API-Schlüssel erforderlich. Bitte fügen Sie Ihren Gemini API-Schlüssel in den Einstellungen hinzu.',
    },
    onboarding: {
      title: 'Willkommen bei Descam',
      description: 'Um zu beginnen, geben Sie bitte mindestens einen API-Schlüssel ein. Sie können OpenAI für Fotobeschreibungen, Gemini für Fotos und Videos oder beides verwenden. Diese Schlüssel werden lokal in Ihrem Browser gespeichert.',
      apiKeyLabel: 'OpenAI API-Schlüssel (für Fotomodus)',
      apiKeyPlaceholder: 'sk-...',
      geminiApiKeyLabel: 'Gemini API-Schlüssel (für Foto- und Videomodus)',
      geminiApiKeyPlaceholder: 'Geben Sie Ihren Gemini API-Schlüssel ein',
      saveButton: 'Speichern und Fortfahren',
      securityNote: 'Ihre API-Schlüssel werden lokal gespeichert und verlassen Ihr Gerät nur bei Anfragen an OpenAI oder Google.',
      sourceCodeLink: 'Quellcode auf GitHub ansehen',
      atLeastOneKeyRequired: 'Bitte geben Sie mindestens einen API-Schlüssel ein (OpenAI oder Gemini).',
    },
    camera: {
      captureButton: 'Bild Aufnehmen',
      uploadButton: 'Bild Hochladen',
      capturingFrame: 'Frame wird aufgenommen...',
      uploadingImage: 'Bild wird hochgeladen...',
      errorNoPermission: 'Kamera-Berechtigung verweigert. Bitte erlauben Sie den Kamerazugriff in Ihren Browsereinstellungen.',
      errorNotSupported: 'Kamerazugriff wird in diesem Browser nicht unterstützt. Bitte verwenden Sie HTTPS oder einen modernen Browser.',
      errorGeneric: 'Beim Zugriff auf die Kamera ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.',
      errorVideoSource: 'Videoquelle konnte nicht gestartet werden. Die Kamera wird möglicherweise von einer anderen Anwendung verwendet.',
      errorNotReady: 'Kamera ist nicht bereit. Bitte warten.',
      errorNotFound: 'Keine Kamera gefunden.',
      switchCamera: 'Kamera Wechseln',
      frontCamera: 'Frontkamera',
      backCamera: 'Rückkamera',
      camera: 'Kamera',
      initializing: 'Kamera wird initialisiert...',
      videoFeedAriaLabel: 'Live-Kamerafeed',
      cameraSelectionAriaLabel: 'Kamera auswählen',
      shareScreen: 'Bildschirm Teilen',
      stopSharing: 'Teilen Stoppen',
      screenShare: 'Bildschirmfreigabe',
      errorScreenCapture: 'Bildschirmaufnahme fehlgeschlagen. Bitte versuchen Sie es erneut.',
    },
    outputMode: {
      label: 'Ausgabemodus',
      aria: 'ARIA (Bildschirmleser)',
      tts: 'Text-zu-Sprache',
      ariaDescription: 'ARIA Live-Regionen für Bildschirmleser verwenden',
      ttsDescription: 'Beschreibungen laut vorlesen mit Text-zu-Sprache',
      ttsNotSupported: 'Text-zu-Sprache wird in diesem Browser nicht unterstützt.',
    },
    video: {
      startStreaming: 'Streaming Starten',
      stopStreaming: 'Streaming Stoppen',
      streaming: 'Video wird gestreamt...',
      connecting: 'Verbindung zu Gemini...',
      currentDescription: 'Aktuelle Beschreibung',
      errorNoApiKey: 'Gemini API-Schlüssel ist für Videomodus erforderlich.',
      errorGeneric: 'Streaming konnte nicht gestartet werden.',
      startStreamingAriaLabel: 'Video-Streaming zu Gemini starten',
      stopStreamingAriaLabel: 'Video-Streaming stoppen',
    },
    prompt: {
      label: 'Benutzerdefinierte Anweisung (optional)',
      placeholder: 'Beschreiben Sie dieses Bild im Detail',
      defaultPrompt: 'Beschreiben Sie dieses Bild im Detail, einschließlich Objekte, gezeigte Personen, usw. Lesen Sie jeden sichtbaren Text. Wenn das Gesicht einer Person gezeigt wird, versuchen Sie zu sagen, ob es zentriert ist oder ob sie außerhalb des Bildschirms sind.',
      resetButton: 'Anweisung Zurücksetzen',
      customPromptLabel: 'Benutzerdefinierte Anweisung (optional)',
      customPromptPlaceholder: 'Benutzerdefinierte Anweisungen eingeben',
      resetButtonAriaLabel: 'Anweisung auf Standard zurücksetzen',
    },
    history: {
      title: 'Verlauf',
    },
    outputs: {
      legend: 'Ausgaben',
      stopTTS: 'Sprechen Stoppen',
      ttsRate: 'Sprechgeschwindigkeit',
    },
    footer: {
      apiKeyFound: 'OpenAI API-Schlüssel: Konfiguriert',
      apiKeyNotFound: 'OpenAI API-Schlüssel: Nicht Konfiguriert',
      cameraAccessGranted: 'Kamera: Erlaubt',
      cameraAccessDenied: 'Kamera: Verweigert',
      cameraAccessUnknown: 'Kamera: Unbekannt',
      cameraActive: 'Kamera:',
      cameraInactive: 'Kamera: Inaktiv',
      copyright: '© 2025 Oriol Gómez',
    },
  },
  fr: {
    appTitle: 'Descam - Description d\'Image par IA',
    photoModeTitle: 'Descam - Mode Photo',
    videoModeTitle: 'Descam - Mode Vidéo',
    language: {
      selectLabel: 'Sélectionner la langue',
    },
    mode: {
      switchToPhoto: 'Passer au Mode Photo',
      switchToVideo: 'Passer au Mode Vidéo',
      currentModePhoto: 'Actuellement en Mode Photo',
      currentModeVideo: 'Actuellement en Mode Vidéo',
      switchModeAriaLabel: 'Basculer entre les modes photo et vidéo',
      geminiKeyRequiredForVideo: 'Une clé API Gemini est requise pour utiliser le mode vidéo. Veuillez ajouter votre clé API Gemini dans les paramètres.',
    },
    onboarding: {
      title: 'Bienvenue sur Descam',
      description: 'Pour commencer, veuillez entrer au moins une clé API. Vous pouvez utiliser OpenAI pour les descriptions de photos, Gemini pour les photos et vidéos, ou les deux. Ces clés sont stockées localement dans votre navigateur.',
      apiKeyLabel: 'Clé API OpenAI (pour Mode Photo)',
      apiKeyPlaceholder: 'sk-...',
      geminiApiKeyLabel: 'Clé API Gemini (pour Modes Photo et Vidéo)',
      geminiApiKeyPlaceholder: 'Entrez votre clé API Gemini',
      saveButton: 'Enregistrer et Continuer',
      securityNote: 'Vos clés API sont stockées localement et ne quittent jamais votre appareil sauf lors des requêtes à OpenAI ou Google.',
      sourceCodeLink: 'Voir le code source sur GitHub',
      atLeastOneKeyRequired: 'Veuillez fournir au moins une clé API (OpenAI ou Gemini).',
    },
    camera: {
      captureButton: 'Capturer l\'Image',
      uploadButton: 'Télécharger une Image',
      capturingFrame: 'Capture de l\'image...',
      uploadingImage: 'Téléchargement de l\'image...',
      errorNoPermission: 'Permission de caméra refusée. Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur.',
      errorNotSupported: 'L\'accès à la caméra n\'est pas pris en charge dans ce navigateur. Veuillez utiliser HTTPS ou un navigateur moderne.',
      errorGeneric: 'Une erreur s\'est produite lors de l\'accès à la caméra. Veuillez réessayer.',
      errorVideoSource: 'Impossible de démarrer la source vidéo. La caméra peut être utilisée par une autre application.',
      errorNotReady: 'La caméra n\'est pas prête. Veuillez patienter.',
      errorNotFound: 'Aucune caméra trouvée.',
      switchCamera: 'Changer de Caméra',
      frontCamera: 'Caméra Avant',
      backCamera: 'Caméra Arrière',
      camera: 'Caméra',
      initializing: 'Initialisation de la caméra...',
      videoFeedAriaLabel: 'Flux caméra en direct',
      cameraSelectionAriaLabel: 'Sélectionner la caméra',
      shareScreen: 'Partager l\'Écran',
      stopSharing: 'Arrêter le Partage',
      screenShare: 'Partage d\'Écran',
      errorScreenCapture: 'Échec de la capture d\'écran. Veuillez réessayer.',
    },
    outputMode: {
      label: 'Mode de Sortie',
      aria: 'ARIA (Lecteur d\'Écran)',
      tts: 'Synthèse Vocale',
      ariaDescription: 'Utiliser les régions en direct ARIA pour les lecteurs d\'écran',
      ttsDescription: 'Lire les descriptions à voix haute avec synthèse vocale',
      ttsNotSupported: 'La synthèse vocale n\'est pas prise en charge dans ce navigateur.',
    },
    video: {
      startStreaming: 'Démarrer le Streaming',
      stopStreaming: 'Arrêter le Streaming',
      streaming: 'Streaming vidéo...',
      connecting: 'Connexion à Gemini...',
      currentDescription: 'Description Actuelle',
      errorNoApiKey: 'La clé API Gemini est requise pour le mode vidéo.',
      errorGeneric: 'Échec du démarrage du streaming.',
      startStreamingAriaLabel: 'Démarrer le streaming vidéo vers Gemini',
      stopStreamingAriaLabel: 'Arrêter le streaming vidéo',
    },
    prompt: {
      label: 'Instruction Personnalisée (optionnel)',
      placeholder: 'Décrivez cette image en détail',
      defaultPrompt: 'Décrivez cette image en détail, y compris les objets, les personnes montrées, etc. Lisez tout texte visible. Si le visage de quelqu\'un est montré, essayez de dire s\'il est centré ou s\'ils sont hors de l\'écran.',
      resetButton: 'Réinitialiser l\'Instruction',
      customPromptLabel: 'Instruction Personnalisée (optionnel)',
      customPromptPlaceholder: 'Entrez des instructions personnalisées',
      resetButtonAriaLabel: 'Réinitialiser l\'instruction par défaut',
    },
    history: {
      title: 'Historique',
    },
    outputs: {
      legend: 'Sorties',
      stopTTS: 'Arrêter la Lecture',
      ttsRate: 'Vitesse de Parole',
    },
    footer: {
      apiKeyFound: 'Clé API OpenAI : Configurée',
      apiKeyNotFound: 'Clé API OpenAI : Non Configurée',
      cameraAccessGranted: 'Caméra : Accordée',
      cameraAccessDenied: 'Caméra : Refusée',
      cameraAccessUnknown: 'Caméra : Inconnu',
      cameraActive: 'Caméra :',
      cameraInactive: 'Caméra : Inactive',
      copyright: '© 2025 Oriol Gómez',
    },
  },
  it: {
    appTitle: 'Descam - Descrizione Immagine con IA',
    photoModeTitle: 'Descam - Modalità Foto',
    videoModeTitle: 'Descam - Modalità Video',
    language: {
      selectLabel: 'Seleziona lingua',
    },
    mode: {
      switchToPhoto: 'Passa a Modalità Foto',
      switchToVideo: 'Passa a Modalità Video',
      currentModePhoto: 'Attualmente in Modalità Foto',
      currentModeVideo: 'Attualmente in Modalità Video',
      switchModeAriaLabel: 'Passa tra le modalità foto e video',
      geminiKeyRequiredForVideo: 'È necessaria una chiave API Gemini per utilizzare la modalità video. Aggiungi la tua chiave API Gemini nelle impostazioni.',
    },
    onboarding: {
      title: 'Benvenuto su Descam',
      description: 'Per iniziare, inserisci almeno una chiave API. Puoi utilizzare OpenAI per le descrizioni di foto, Gemini per foto e video, o entrambi. Queste chiavi sono memorizzate localmente nel tuo browser.',
      apiKeyLabel: 'Chiave API OpenAI (per Modalità Foto)',
      apiKeyPlaceholder: 'sk-...',
      geminiApiKeyLabel: 'Chiave API Gemini (per Modalità Foto e Video)',
      geminiApiKeyPlaceholder: 'Inserisci la tua chiave API Gemini',
      saveButton: 'Salva e Continua',
      securityNote: 'Le tue chiavi API sono memorizzate localmente e non lasciano mai il tuo dispositivo tranne quando effettui richieste a OpenAI o Google.',
      sourceCodeLink: 'Visualizza codice sorgente su GitHub',
      atLeastOneKeyRequired: 'Fornisci almeno una chiave API (OpenAI o Gemini).',
    },
    camera: {
      captureButton: 'Cattura Immagine',
      uploadButton: 'Carica Immagine',
      capturingFrame: 'Catturando frame...',
      uploadingImage: 'Caricamento immagine...',
      errorNoPermission: 'Permesso fotocamera negato. Consenti l\'accesso alla fotocamera nelle impostazioni del browser.',
      errorNotSupported: 'L\'accesso alla fotocamera non è supportato in questo browser. Utilizza HTTPS o un browser moderno.',
      errorGeneric: 'Si è verificato un errore durante l\'accesso alla fotocamera. Riprova.',
      errorVideoSource: 'Impossibile avviare la sorgente video. La fotocamera potrebbe essere in uso da un\'altra applicazione.',
      errorNotReady: 'La fotocamera non è pronta. Attendere.',
      errorNotFound: 'Nessuna fotocamera trovata.',
      switchCamera: 'Cambia Fotocamera',
      frontCamera: 'Fotocamera Anteriore',
      backCamera: 'Fotocamera Posteriore',
      camera: 'Fotocamera',
      initializing: 'Inizializzazione fotocamera...',
      videoFeedAriaLabel: 'Feed fotocamera in diretta',
      cameraSelectionAriaLabel: 'Seleziona fotocamera',
      shareScreen: 'Condividi Schermo',
      stopSharing: 'Interrompi Condivisione',
      screenShare: 'Condivisione Schermo',
      errorScreenCapture: 'Impossibile catturare lo schermo. Riprova.',
    },
    outputMode: {
      label: 'Modalità di Output',
      aria: 'ARIA (Lettore di Schermo)',
      tts: 'Sintesi Vocale',
      ariaDescription: 'Usa le regioni live ARIA per i lettori di schermo',
      ttsDescription: 'Leggi le descrizioni ad alta voce usando la sintesi vocale',
      ttsNotSupported: 'La sintesi vocale non è supportata in questo browser.',
    },
    video: {
      startStreaming: 'Avvia Streaming',
      stopStreaming: 'Interrompi Streaming',
      streaming: 'Streaming video...',
      connecting: 'Connessione a Gemini...',
      currentDescription: 'Descrizione Attuale',
      errorNoApiKey: 'La chiave API Gemini è richiesta per la modalità video.',
      errorGeneric: 'Impossibile avviare lo streaming.',
      startStreamingAriaLabel: 'Avvia streaming video su Gemini',
      stopStreamingAriaLabel: 'Interrompi streaming video',
    },
    prompt: {
      label: 'Istruzione Personalizzata (opzionale)',
      placeholder: 'Descrivi questa immagine in dettaglio',
      defaultPrompt: 'Descrivi questa immagine in dettaglio, includendo oggetti, persone mostrate, ecc. Leggi qualsiasi testo visibile. Se è mostrato il volto di qualcuno, prova a dire se è centrato o se sono fuori dallo schermo.',
      resetButton: 'Ripristina Istruzione',
      customPromptLabel: 'Istruzione Personalizzata (opzionale)',
      customPromptPlaceholder: 'Inserisci istruzioni personalizzate',
      resetButtonAriaLabel: 'Ripristina istruzione predefinita',
    },
    history: {
      title: 'Cronologia',
    },
    outputs: {
      legend: 'Uscite',
      stopTTS: 'Ferma Lettura',
      ttsRate: 'Velocità di Voce',
    },
    footer: {
      apiKeyFound: 'Chiave API OpenAI: Configurata',
      apiKeyNotFound: 'Chiave API OpenAI: Non Configurata',
      cameraAccessGranted: 'Fotocamera: Consentita',
      cameraAccessDenied: 'Fotocamera: Negata',
      cameraAccessUnknown: 'Fotocamera: Sconosciuto',
      cameraActive: 'Fotocamera:',
      cameraInactive: 'Fotocamera: Inattiva',
      copyright: '© 2025 Oriol Gómez',
    },
  },
};
