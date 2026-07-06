// Client script: auto-detect-as-you-type with optional manual override
// Localized UI strings
const i18n = {
    en: {
        placeholder: "Type a word or phrase...",
        button: "Translate",
        help: "Use short phrases for best results",
        errorServer: "Cannot reach translation server. Make sure it is running.",
        detectedPrefix: "Detected:",
        translatingTo: "Translating to:",
        manualMode: "Manual mode",
        manualSourceLabel: "I speak:",
        manualTargetLabel: "Translate to:",
        autoOption: "Auto-detect"
    },
    es: {
        placeholder: "Escriba una palabra o frase...",
        button: "Traducir",
        help: "Use frases cortas para mejores resultados",
        errorServer: "No se puede acceder al servidor de traducción. Asegúrate de que esté en ejecución.",
        detectedPrefix: "Detectado:",
        translatingTo: "Traduciendo a:",
        manualMode: "Modo manual",
        manualSourceLabel: "Hablo:",
        manualTargetLabel: "Traducir a:",
        autoOption: "Detección automática"
    },
    fr: {
        placeholder: "Tapez un mot ou une phrase...",
        button: "Traduire",
        help: "Utilisez des phrases courtes pour de meilleurs résultats",
        errorServer: "Impossible d'accéder au serveur de traduction. Assurez-vous qu'il est en cours d'exécution.",
        detectedPrefix: "Détecté:",
        translatingTo: "Traduction en:",
        manualMode: "Mode manuel",
        manualSourceLabel: "Je parle:",
        manualTargetLabel: "Traduire en:",
        autoOption: "Détection automatique"
    }
};

// Friendly names for language codes
const codeToFriendly = { en: 'English', es: 'Spanish', fr: 'French', hi: 'Hindi', zh: 'Mandarin', vi: 'Vietnamese' };

// Manual options (values map to server mapping expectations)
const manualOptions = [
    { key: '', label_en: i18n.en.autoOption, label_es: i18n.es.autoOption, label_fr: i18n.fr.autoOption },
    { key: 'english', label_en: 'English', label_es: 'Inglés', label_fr: 'Anglais' },
    { key: 'spanish', label_en: 'Spanish (Español)', label_es: 'Español', label_fr: 'Espagnol' },
    { key: 'french', label_en: 'French (Français)', label_es: 'Francés', label_fr: 'Français' },
    { key: 'hindi', label_en: 'Hindi (हिंदी)', label_es: 'Hindi', label_fr: 'Hindi' },
    { key: 'mandarin', label_en: 'Mandarin (中文)', label_es: 'Mandarín', label_fr: 'Mandarin' },
    { key: 'vietnamese', label_en: 'Vietnamese (Tiếng Việt)', label_es: 'Vietnamita', label_fr: 'Vietnamien' }
];

let detectTimer = null;
const DEBOUNCE_MS = 1500; // Increased from 600ms to avoid interrupting the user mid-word

function setBusy(busy) {
  const input = document.getElementById('input');
  if (input) input.disabled = !!busy;
}function clearOutputAnimated(el) {
    const letters = Array.from(el.querySelectorAll('.letter'));
    if (letters.length === 0) {
        el.textContent = '';
        return;
    }
    let index = 0;
    const interval = setInterval(() => {
        if (index < letters.length) {
            letters[index].classList.add('pop-out');
            index++;
        } else {
            clearInterval(interval);
            el.textContent = '';
        }
    }, 35);
}

function typeOutputAnimated(el, text) {
    el.innerHTML = '';
    const chars = text.split('');
    chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.className = 'letter';
        span.textContent = char;
        el.appendChild(span);
        setTimeout(() => {
            span.classList.add('pop-in');
        }, index * 28);
    });
}

function localizeUI() {
    // Use page language to choose locale (default to en)
    const pageLang = (document.documentElement.lang || 'en').slice(0,2).toLowerCase();
    return i18n[pageLang] ? i18n[pageLang] : i18n.en;
}

function populateManualSelects() {
    const locale = localizeUI();
    const src = document.getElementById('manualSource');
    const tgt = document.getElementById('manualTarget');
    if (!src || !tgt) return;
    src.innerHTML = '';
    tgt.innerHTML = '';
    manualOptions.forEach(opt => {
        const o1 = document.createElement('option');
        o1.value = opt.key;
        if (locale === i18n.fr) {
            o1.textContent = opt.label_fr || opt.label_en;
        } else if (locale === i18n.es) {
            o1.textContent = opt.label_es || opt.label_en;
        } else {
            o1.textContent = opt.label_en || opt.label_es;
        }
        src.appendChild(o1);

        const o2 = document.createElement('option');
        o2.value = opt.key === '' ? 'french' : opt.key; // default target options should include french first
        if (locale === i18n.fr) {
            o2.textContent = opt.label_fr || opt.label_en;
        } else if (locale === i18n.es) {
            o2.textContent = opt.label_es || opt.label_en;
        } else {
            o2.textContent = opt.label_en || opt.label_es;
        }
        tgt.appendChild(o2);
    });
}

async function startTranslate() {
    const input = document.getElementById('input');
    const output = document.getElementById('output');
    const detectLabel = document.getElementById('detectedInfo');
    if (!input || !output) return;
    const text = input.value.trim();
    if (!text) return;

    // Check for alphabet request (client-side, no server needed)
    if (/^(?:show\s+me\s+)?(?:the\s+)?alphabet$/i.test(text)) {
        setBusy(true);
        const frenchAlphabet = [
            { letter: 'A', pronunciation: 'ah' },
            { letter: 'B', pronunciation: 'bay' },
            { letter: 'C', pronunciation: 'say' },
            { letter: 'D', pronunciation: 'day' },
            { letter: 'E', pronunciation: 'uh' },
            { letter: 'F', pronunciation: 'eff' },
            { letter: 'G', pronunciation: 'zhay' },
            { letter: 'H', pronunciation: 'ash' },
            { letter: 'I', pronunciation: 'ee' },
            { letter: 'J', pronunciation: 'zhee' },
            { letter: 'K', pronunciation: 'kah' },
            { letter: 'L', pronunciation: 'ell' },
            { letter: 'M', pronunciation: 'em' },
            { letter: 'N', pronunciation: 'en' },
            { letter: 'O', pronunciation: 'oh' },
            { letter: 'P', pronunciation: 'pay' },
            { letter: 'Q', pronunciation: 'koo' },
            { letter: 'R', pronunciation: 'air' },
            { letter: 'S', pronunciation: 'ess' },
            { letter: 'T', pronunciation: 'tay' },
            { letter: 'U', pronunciation: 'oo' },
            { letter: 'V', pronunciation: 'vay' },
            { letter: 'W', pronunciation: 'doo-bluh-vay' },
            { letter: 'X', pronunciation: 'eeks' },
            { letter: 'Y', pronunciation: 'ee-grek' },
            { letter: 'Z', pronunciation: 'zed' }
        ];
        
        output.innerHTML = '';
        const alphabetDiv = document.createElement('div');
        alphabetDiv.className = 'alphabet-display';
        
        const title = document.createElement('h3');
        title.textContent = 'French Alphabet (L\'Alphabet Français)';
        title.style.marginBottom = '15px';
        alphabetDiv.appendChild(title);
        
        const grid = document.createElement('div');
        grid.style.display = 'grid';
        grid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
        grid.style.gap = '10px';
        
        frenchAlphabet.forEach(item => {
            const letterCard = document.createElement('div');
            letterCard.style.border = '1px solid #ddd';
            letterCard.style.padding = '10px';
            letterCard.style.borderRadius = '8px';
            letterCard.style.textAlign = 'center';
            letterCard.style.backgroundColor = '#f9f9f9';
            
            const letter = document.createElement('div');
            letter.textContent = item.letter;
            letter.style.fontSize = '24px';
            letter.style.fontWeight = 'bold';
            letter.style.color = '#0055A4';
            
            const pronunciation = document.createElement('div');
            pronunciation.textContent = item.pronunciation;
            pronunciation.style.fontSize = '14px';
            pronunciation.style.color = '#666';
            pronunciation.style.marginTop = '5px';
            
            letterCard.appendChild(letter);
            letterCard.appendChild(pronunciation);
            grid.appendChild(letterCard);
        });
        
        alphabetDiv.appendChild(grid);
        output.appendChild(alphabetDiv);
        
        if (detectLabel) {
            detectLabel.textContent = 'French Alphabet';
        }
        
        setBusy(false);
        return;
    }

    setBusy(true);
    try {
        // Build payload depending on manual mode
        const manualToggle = document.getElementById('manualToggle');
        const manualSource = document.getElementById('manualSource');
        const manualTarget = document.getElementById('manualTarget');

        const payload = { text };
        if (manualToggle && manualToggle.checked) {
            if (manualSource && manualSource.value) payload.source = manualSource.value;
            if (manualTarget && manualTarget.value) payload.target = manualTarget.value;
        }

        const response = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json();

        if (data.error) {
            output.textContent = 'Error: ' + data.error;
        } else {
            const result = data.result || '';
            typeOutputAnimated(output, result);

            // Update detection/target display
            if (detectLabel) {
                const manualToggleEl = document.getElementById('manualToggle');
                if (manualToggleEl && manualToggleEl.checked) {
                    const s = document.getElementById('manualSource').value || localeString('autoOption');
                    const t = document.getElementById('manualTarget').value || '—';
                    detectLabel.textContent = `Manual: ${friendlyNameFromManualKey(s)} → ${friendlyNameFromManualKey(t)}`;
                } else {
                    const det = data.detectedSource || null;
                    const targ = data.targetUsed || null;
                    const detectedName = det ? (codeToFriendly[det] || det) : '—';
                    const targetName = targ ? (codeToFriendly[targ] || targ) : '—';
                    const locale = localizeUI();
                    detectLabel.textContent = `${locale.detectedPrefix} ${detectedName} → ${locale.translatingTo} ${targetName}`;
                }
            }
        }
    } catch (error) {
        const locale = localizeUI();
        output.textContent = locale.errorServer;
    } finally {
        setBusy(false);
    }
}

function friendlyNameFromManualKey(key) {
    if (!key) return localizeUI().autoOption || 'Auto';
    // map manual select keys to display names
    const m = manualOptions.find(o => o.key === key);
    if (!m) return key;
    const locale = localizeUI();
    if (locale === i18n.fr) {
        return m.label_fr || m.label_en;
    } else if (locale === i18n.es) {
        return m.label_es || m.label_en;
    } else {
        return m.label_en || m.label_es;
    }
}

function localeString(k) {
    const l = localizeUI();
    return l[k] || k;
}

// Initialize UI
document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('translateForm');
  const input = document.getElementById('input');
  const output = document.getElementById('output');
  const detectBar = document.getElementById('detectBar');
  const detectedInfo = document.getElementById('detectedInfo');
  const manualToggle = document.getElementById('manualToggle');
  const manualControls = document.getElementById('manualControls');
  const manualSource = document.getElementById('manualSource');
  const manualTarget = document.getElementById('manualTarget');

  // Localize placeholder/button/help
  const locale = localizeUI();
  if (input) input.placeholder = locale.placeholder;
  const help = document.querySelector('.help');
  if (help) help.textContent = locale.help;
  const manualToggleLabel = document.getElementById('manualToggleLabel');
  if (manualToggleLabel) manualToggleLabel.textContent = locale.manualMode;
  const srcLabel = document.querySelector('label[for="manualSource"]');
  const tgtLabel = document.querySelector('label[for="manualTarget"]');
  if (srcLabel) srcLabel.textContent = locale.manualSourceLabel;
  if (tgtLabel) tgtLabel.textContent = locale.manualTargetLabel;    populateManualSelects();

    // Hide manual controls initially
    if (manualControls) manualControls.style.display = 'none';

    // Submit handler
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await startTranslate();
        });
    }

    // Debounced input
    if (input) {
        input.addEventListener('input', function() {
            if (output && output.textContent.trim()) clearOutputAnimated(output);
            if (detectTimer) clearTimeout(detectTimer);
            detectTimer = setTimeout(() => startTranslate(), DEBOUNCE_MS);
        });
    }

    // Manual toggle
    if (manualToggle) {
        manualToggle.addEventListener('change', function() {
            const manualOn = manualToggle.checked;
            if (manualControls) manualControls.style.display = manualOn ? 'flex' : 'none';
            // re-run translate to respect manual mode change
            startTranslate();
        });
    }

});
