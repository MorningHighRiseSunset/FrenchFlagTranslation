import { verbs } from './french_verbs.js';

// --- Needed definitions ---
const pronouns = ["I", "You", "He", "We", "You all", "They"];
const frenchPronouns = ["Je", "Tu", "Il/Elle/On", "Nous", "Vous", "Ils/Elles"];
const tenses = [
  // --- Indicative Mood ---
  "Present", "Passé Composé", "Imparfait", "Passé Simple", "Futur Simple", "Conditionnel Présent",
  "Plus-que-parfait", "Futur Antérieur", "Conditionnel Passé"
];

// Short human-readable definitions for tense info popups
const tenseDefinitions = {
  "Present": "Used for actions happening now or general truths (I speak).",
  "Passé Composé": "Compound past used for completed actions (I have spoken).",
  "Imparfait": "Past habitual or ongoing actions (I was speaking / used to speak).",
  "Passé Simple": "Literary past tense for completed actions (I spoke).",
  "Futur Simple": "Actions that will happen (I will speak).",
  "Conditionnel Présent": "Hypothetical or polite actions (I would speak).",
  "Plus-que-parfait": "Action completed before another past action (I had spoken).",
  "Futur Antérieur": "Action that will have been completed (I will have spoken).",
  "Conditionnel Passé": "Hypothetical past (I would have spoken)."
};

// --- Accent-insensitive normalization helper ---
function normalizeFrench(str) {
  return str
    .normalize("NFD") // decompose accents
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/ç/g, "c") // treat ç as c for matching
    .replace(/Ç/g, "C");
}

// --- Practice Mode: French → English ---
practiceFormFr.onsubmit = function(e) {
  e.preventDefault();
  const input = practiceInputFr.value.trim().toLowerCase();
  if (!input) return;

  let found = null;
  // 1. Try to match full conjugated forms (now accent-insensitive)
  for (let verb of verbs) {
    for (let t of tenses) {
      if (!verb.conjugations[t]) continue;
      for (let i = 0; i < frenchPronouns.length; ++i) {
        const fr = verb.conjugations[t][i];
        if (
          fr &&
          (
            normalizeFrench(`${frenchPronouns[i]} ${fr}`.toLowerCase()) === normalizeFrench(input) ||
            normalizeFrench(fr.toLowerCase()) === normalizeFrench(input)
          )
        ) {
          found = {verb, tense: t, pronounIdx: i};
          break;
        }
      }
      if (found) break;
    }
    if (found) break;
  }

  // 2. If not found, try to match infinitive (e.g., "parler"), accent-insensitive
  if (!found) {
    for (let verb of verbs) {
      if (normalizeFrench(verb.french.toLowerCase()) === normalizeFrench(input)) {
        found = {verb, tense: null, pronounIdx: null, isInfinitive: true};
        break;
      }
    }
  }

  const englishBox = document.getElementById('practiceInputFrEnglish');
  if (!found) {
    englishBox.value = '';
    practiceResults.innerHTML = `<div style="color:red; padding: 10px; background-color: #fee; border: 1px solid #fcc; border-radius: 4px;">
      <strong>Could not find a matching verb.</strong><br>
      <small style="color: #666;">This tool is specifically designed for French verbs (e.g., "être", "avoir", "faire"). 
      For translating other words or phrases, please use the general translation tool below.</small>
    </div>`;
    return;
  }

  // 3. If infinitive, show all tenses for all pronouns
  if (found.isInfinitive) {
    // Tab UI for multiple meanings
    let tabHtml = '';
    let meanings = Array.isArray(found.verb.english) ? found.verb.english : [found.verb.english];
    let meaningIdx = 0;
    tabHtml = `<div id="meaningTabsFr" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">` +
      meanings.map((m, idx) =>
        `<button class="meaning-tab-fr${idx === meaningIdx ? ' active' : ''}" data-meaning-idx="${idx}">${m}</button>`
      ).join('') +
      `</div>`;

    englishBox.value = meanings[meaningIdx];
    let html = tabHtml;
    html += `<h3>English equivalents for <b>${found.verb.french}</b> (all pronouns)</h3>`;
    html += `<table border="1" style="width:100%;text-align:center;">
      <tr>
        <th>Pronoun</th>
        <th>Tense</th>
        <th>French</th>
        <th>English</th>
      </tr>`;
    for (let i = 0; i < frenchPronouns.length; ++i) {
      for (let t of tenses) {
        let fr = found.verb.conjugations[t] ? found.verb.conjugations[t][i] : "(not available)";
        if (fr === "(not available)") continue; // <-- Only render if available
        let eng = buildEnglishPhrase(found.verb, t, i, meaningIdx);
        html += `<tr>
          <td>${frenchPronouns[i]}</td>
          <td>
            ${t}
            <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
          </td>
            <td>
            ${fr}
            <button type="button" class="speak-btn" data-text="${fr}" title="Hear pronunciation">🔊</button>
          </td>
          <td>
            ${eng}
            <button type="button" class="speak-btn-en" data-text="${eng}" title="Hear English pronunciation">🔊</button>
          </td>
        </tr>`;
      }
    }
    html += `</table>`;
    practiceResults.innerHTML = html;

    // Tab click handler for French→English
    if (meanings.length > 1) {
      document.querySelectorAll('.meaning-tab-fr').forEach(btn => {
        btn.onclick = () => {
          let idx = parseInt(btn.getAttribute('data-meaning-idx'));
          englishBox.value = meanings[idx];
          // Re-render table for selected meaning
          let html = `<div id="meaningTabsFr" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">` +
            meanings.map((m, j) =>
              `<button class="meaning-tab-fr${j === idx ? ' active' : ''}" data-meaning-idx="${j}">${m}</button>`
            ).join('') +
            `</div>`;
          html += `<h3>English equivalents for <b>${found.verb.french}</b> (all pronouns)</h3>`;
          html += `<table border="1" style="width:100%;text-align:center;">
            <tr>
              <th>Pronoun</th>
              <th>Tense</th>
              <th>French</th>
              <th>English</th>
            </tr>`;
          for (let i = 0; i < frenchPronouns.length; ++i) {
            for (let t of tenses) {
              let fr = found.verb.conjugations[t] ? found.verb.conjugations[t][i] : "(not available)";
              if (fr === "(not available)") continue; // <-- Only render if available
              let eng = buildEnglishPhrase(found.verb, t, i, idx);
              html += `<tr>
                <td>${frenchPronouns[i]}</td>
                <td>
                  ${t}
                  <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
                </td>
                <td>
                  ${fr}
                  <button type="button" class="speak-btn" data-text="${fr}" title="Hear pronunciation">🔊</button>
                </td>
                <td>
                  ${eng}
                  <button type="button" class="speak-btn-en" data-text="${eng}" title="Hear English pronunciation">🔊</button>
                </td>
              </tr>`;
            }
          }
          html += `</table>`;
          practiceResults.innerHTML = html;
        };
      });
    }
    return;
  }

  // Set the English translation in the output field
  let meanings = Array.isArray(found.verb.english) ? found.verb.english : [found.verb.english];
  let meaningIdx = 0;
  englishBox.value = `${pronouns[found.pronounIdx]} ${buildEnglishPhrase(found.verb, found.tense, found.pronounIdx, meaningIdx).replace(pronouns[found.pronounIdx] + ' ', '')}`;

  // Tab UI for multiple meanings
  let tabHtml = '';
  if (meanings.length > 1) {
    tabHtml = `<div id="meaningTabsFr" style="display:flex;gap:8px;margin-bottom:8px;">` +
      meanings.map((m, idx) =>
        `<button class="meaning-tab-fr${idx === meaningIdx ? ' active' : ''}" data-meaning-idx="${idx}">${m}</button>`
      ).join('') +
      `</div>`;
  }

  let html = tabHtml;
  html += `<h3>English equivalents for <b>${found.verb.french}</b> (${frenchPronouns[found.pronounIdx]})</h3>`;
  html += `<table border="1" style="width:100%;text-align:center;">
    <tr>
      <th>Tense</th>
      <th>English</th>
      <th>French</th>
    </tr>`;
  tenses.forEach(t => {
    let eng = buildEnglishPhrase(found.verb, t, found.pronounIdx, meaningIdx);
    let fr = found.verb.conjugations[t] ? found.verb.conjugations[t][found.pronounIdx] : "(not available)";
    if (fr === "(not available)") return; // <-- Only render if available
    html += `<tr>
      <td>
        ${t}
        <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
      </td>
      <td>
        ${eng}
        <button type="button" class="speak-btn-en" data-text="${eng}" title="Hear English pronunciation">🔊</button>
      </td>
      <td>
        ${fr}
        <button type="button" class="speak-btn" data-text="${fr}" title="Hear pronunciation">🔊</button>
      </td>
    </tr>`;
  });
  html += `</table>`;
  practiceResults.innerHTML = html;
};

// --- Practice Mode: English → French ---
practiceFormEn.onsubmit = function(e) {
  e.preventDefault();
  const input = practiceInputEn.value.trim();
  if (!input) return;

  // If this is a tab click, meaningIdx is passed in the event
  let meaningIdx = (e && typeof e.meaningIdx === "number") ? e.meaningIdx : 0;

  // Always use parseEnglishPhrase to get the correct meaningIdx for the input
  const result = parseEnglishPhrase(input, meaningIdx);
  const frenchBox = document.getElementById('practiceInputEnFrench');
  if (!result) {
    frenchBox.value = '';
    practiceResults.innerHTML = `<div style="color:red; padding: 10px; background-color: #fee; border: 1px solid #fcc; border-radius: 4px;">
      <strong>Could not find a matching verb.</strong><br>
      <small style="color: #666;">This tool is specifically designed for French verbs (e.g., "to be", "to have", "to do"). 
      For translating other words or phrases, please use the general translation tool below.</small>
    </div>`;
    return;
  }

  // Use allCandidates if present, otherwise just the single result
  let allCandidates = result.allCandidates || [result];
  let currentIdx = meaningIdx;
  let candidate = allCandidates[currentIdx] || allCandidates[0];

  let verb = candidate.verb;
  meaningIdx = candidate.meaningIdx || 0;
  const pronounIdx = (typeof candidate.pronounIdx === "number") ? candidate.pronounIdx : 0;
  const detectedTense = candidate.tense || "Present";

  // Tab UI for multiple meanings 
  let tabHtml = '';
  if (allCandidates.length > 1) {
    tabHtml = `<div id="meaningTabs" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">` +
      allCandidates.map((c, idx) => {
        let label;
        if (Array.isArray(c.verb.english)) {
          const meaning = c.verb.english[c.meaningIdx];
          label = `${c.verb.french} / ${meaning.replace(/^to /, '')}`;
        } else {
          label = `${c.verb.french} / ${c.verb.english.replace(/^to /, '')}`;
        }
        return `<button class="meaning-tab${idx === currentIdx ? ' active' : ''}" data-meaning-idx="${idx}">${label}</button>`;
      }).join('') +
      `</div>`;
  }

  let tenseToShow = detectedTense || "Present";
  let french = verb.conjugations[tenseToShow] ? verb.conjugations[tenseToShow][pronounIdx] : "(not available)";
  frenchBox.value = `${frenchPronouns[pronounIdx]} ${french}`;

  let html = tabHtml;
  let englishMeaning = Array.isArray(verb.english) ? verb.english[meaningIdx] : verb.english;
  html += `<h3>French conjugations for <b>${englishMeaning}</b> (${pronouns[pronounIdx]})`;
  if (detectedTense) html += ` <span style="font-size:0.9em;color:#666;">[${detectedTense}]</span>`;
  html += `</h3>`;
  html += `<table border="1" style="width:100%;text-align:center;">
    <tr>
      <th>Tense</th>
      <th>French</th>
      <th>English</th>
    </tr>`;
  tenses.forEach(t => {
    let conjugation = verb.conjugations[t] ? verb.conjugations[t][pronounIdx] : "(not available)";
    if (conjugation === "(not available)") return; // <-- Only render if available
    let english = buildEnglishPhrase(verb, t, pronounIdx, meaningIdx);
    let highlight = (detectedTense && t === detectedTense) ? ' style="background:#e0e7ff;font-weight:bold;"' : '';
    html += `<tr${highlight}>
      <td>
        ${t}
        <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
      </td>
      <td>
        ${conjugation}
        <button type="button" class="speak-btn" data-text="${frenchPronouns[pronounIdx]} ${conjugation}" title="Hear pronunciation">🔊</button>
      </td>
      <td>
        ${english}
        <button type="button" class="speak-btn-en" data-text="${english}" title="Hear English pronunciation">🔊</button>
      </td>
    </tr>`;
  });
  html += `</table>`;
  practiceResults.innerHTML = html;

  // Tab click handler
  if (allCandidates.length > 1) {
    document.querySelectorAll('.meaning-tab').forEach(btn => {
      btn.onclick = () => {
        practiceFormEn.onsubmit({
          preventDefault: () => {},
          target: practiceFormEn,
          meaningIdx: parseInt(btn.getAttribute('data-meaning-idx'))
        });
      };
    });
  }
};

// --- Quiz Mode: French → English ---
function startQuiz() {
  // Pick a random verb, tense, and pronoun
  const verb = verbs[Math.floor(Math.random() * verbs.length)];
  const availableTenses = tenses.filter(t => verb.conjugations[t]);
  const tense = availableTenses[Math.floor(Math.random() * availableTenses.length)];
  const pronounIdx = Math.floor(Math.random() * pronouns.length);
  const french = verb.conjugations[tense][pronounIdx];
  const english = buildEnglishPhrase(verb, tense, pronounIdx);

  quizState = { verb, tense, pronounIdx, french, english };

  quizPrompt.innerHTML = `
    <div>
      <b>Translate this French phrase to English:</b>
      <div style="font-size:1.5em;margin:1em 0;">
        <span style="color:#4f46e5;font-weight:bold">${frenchPronouns[pronounIdx]} ${french}</span>
      </div>
      <div style="font-size:0.9em;color:#888;">Verb: <b>${verb.french}</b> (${verb.english})<br>Tense: <b>${tense}</b></div>
    </div>
  `;
  quizInput.style.display = '';
  quizInput.value = '';
  quizForm.querySelector('button[type="submit"]').style.display = '';
  quizFeedback.innerHTML = '';
}

quizForm.onsubmit = e => {
  e.preventDefault();
  if (!quizState) return;
  const userAnswer = quizInput.value.trim().toLowerCase();
  const correctAnswer = quizState.english.toLowerCase();

  if (userAnswer === correctAnswer) {
    // Show all tenses for this verb and pronoun
    let html = `<div style="color:green;font-weight:bold;">Correct!</div>`;
    html += `<h4>All tenses for <b>${quizState.verb.english}</b> (${pronouns[quizState.pronounIdx]})</h4>`;
    html += `<table border="1" style="width:100%;text-align:center;">
      <tr>
        <th>Tense</th>
        <th>French</th>
        <th>English</th>
      </tr>`;
    tenses.forEach(t => {
      const fr = quizState.verb.conjugations[t] ? quizState.verb.conjugations[t][quizState.pronounIdx] : "(not available)";
      if (fr === "(not available)") return; // <-- Only render if available
      const en = buildEnglishPhrase(quizState.verb, t, quizState.pronounIdx);
      html += `<tr>
        <td>
          ${t}
          <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
        </td>
        <td>${fr}</td>
        <td>${en}</td>
      </tr>`;
    });
    html += `</table>`;
    html += `<button onclick="startQuiz()" style="margin-top:1em;">Next</button>`;
    quizFeedback.innerHTML = html;
    quizInput.style.display = 'none';
    quizForm.querySelector('button[type="submit"]').style.display = 'none';
  } else {
    quizFeedback.innerHTML = `<span style="color:red;">Incorrect. Try again!</span>
      <br>
      <button id="showAnswerBtn" style="margin-top:0.7em;">Show Answer</button>`;
    // Add event listener for Show Answer button
    document.getElementById('showAnswerBtn').onclick = function() {
      let html = `<div style="color:#2563eb;font-weight:bold;">Answer: ${quizState.english}</div>`;
      html += `<h4>All tenses for <b>${quizState.verb.english}</b> (${pronouns[quizState.pronounIdx]})</h4>`;
      html += `<table border="1" style="width:100%;text-align:center;">
        <tr>
          <th>Tense</th>
          <th>French</th>
          <th>English</th>
        </tr>`;
      tenses.forEach(t => {
        const fr = quizState.verb.conjugations[t] ? quizState.verb.conjugations[t][quizState.pronounIdx] : "(not available)";
        if (fr === "(not available)") return; // <-- Only render if available
        const en = buildEnglishPhrase(quizState.verb, t, quizState.pronounIdx);
        html += `<tr>
          <td>
            ${t}
            <button type="button" class="tense-info-btn" data-tense="${t}" title="What is ${t}?">ℹ️</button>
          </td>
          <td>${fr}</td>
          <td>${en}</td>
        </tr>`;
      });
      html += `</table>`;
      html += `<button onclick="startQuiz()" style="margin-top:1em;">Next</button>`;
      quizFeedback.innerHTML = html;
      quizInput.style.display = 'none';
      quizForm.querySelector('button[type="submit"]').style.display = 'none';
    };
  }
};

// --- Tense Info Popup Logic ---
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('tense-info-btn')) {
    const tense = e.target.getAttribute('data-tense');
    const def = (typeof tenseDefinitions !== 'undefined' && tenseDefinitions[tense]) ? tenseDefinitions[tense] : "No definition available.";
    showTensePopup(tense, def, e.target);
    return;
  }

  // Speak French phrase (uses global speakText if available, falls back to Web Speech API)
  if (e.target.classList.contains('speak-btn')) {
    const txt = e.target.getAttribute('data-text') || '';
    if (!txt) return;
    if (typeof window.speakText === 'function') {
      window.speakText(txt, 'fr');
    } else {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'fr-FR';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
    return;
  }

  // Speak English phrase
  if (e.target.classList.contains('speak-btn-en')) {
    const txt = e.target.getAttribute('data-text') || '';
    if (!txt) return;
    if (typeof window.speakText === 'function') {
      window.speakText(txt, 'en');
    } else {
      const u = new SpeechSynthesisUtterance(txt);
      u.lang = 'en-US';
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
    return;
  }
});

function showTensePopup(tense, def, anchor) {
  let old = document.getElementById('tense-popup');
  if (old) old.remove();

  const popup = document.createElement('div');
  popup.id = 'tense-popup';
  popup.style.position = 'absolute';
  popup.style.background = '#fff';
  popup.style.border = '1px solid #a78bfa';
  popup.style.borderRadius = '8px';
  popup.style.boxShadow = '0 4px 16px rgba(60,60,120,0.12)';
  popup.style.padding = '12px 18px';
  popup.style.zIndex = 1000;
  popup.style.maxWidth = '260px';
  popup.innerHTML = `<b>${tense}</b><br><span style="font-size:0.98em;">${def}</span>`;

  const rect = anchor.getBoundingClientRect();
  popup.style.left = (window.scrollX + rect.right + 8) + 'px';
  popup.style.top = (window.scrollY + rect.top - 8) + 'px';

  document.body.appendChild(popup);

  setTimeout(() => {
    document.addEventListener('mousedown', function handler(ev) {
      if (!popup.contains(ev.target)) {
        popup.remove();
        document.removeEventListener('mousedown', handler);
      }
    });
  }, 10);
}

// --- Helper: Parse English phrase to verb/tense/pronoun ---
function parseEnglishPhrase(phrase, meaningIdx = 0) {
  phrase = phrase.trim().toLowerCase();

  // Collect all possible matches (for ambiguous verbs like "to have")
  let candidates = [];
  for (let verb of verbs) {
    let meanings = Array.isArray(verb.english) ? verb.english : [verb.english];
    for (let idx = 0; idx < meanings.length; ++idx) {
      // Remove parenthetical notes for matching
      let meaningRaw = meanings[idx].toLowerCase();
      let meaningNoParen = meaningRaw.replace(/\s*\(.*?\)\s*/g, '').trim();
      let base = meaningRaw.replace(/^to /, '').split(',')[0].trim();

      // Try to match exact phrase for all tenses/pronouns
      for (let t of tenses) {
        if (!verb.conjugations[t]) continue;
        for (let i = 0; i < pronouns.length; ++i) {
          const eng = buildEnglishPhrase(verb, t, i, idx).toLowerCase();
          if (phrase === eng) {
            return { verb, tense: t, pronounIdx: i, meaningIdx: idx };
          }
        }
      }

      // Try to match base infinitive, or phrase matches meaning without parens
      if (
        phrase === meaningRaw ||
        phrase === meaningNoParen ||
        meaningRaw.startsWith(phrase) ||
        meaningNoParen.startsWith(phrase) ||
        phrase === base
      ) {
        candidates.push({ verb, tense: null, pronounIdx: null, meaningIdx: idx });
      }
    }
  }

  // If multiple candidates, return the first and attach all for tab UI
  if (candidates.length > 0) {
    let result = candidates[0];
    result.allCandidates = candidates;
    return result;
  }

  // Fallback: try to match verb and pronoun
  for (let verb of verbs) {
    let meanings = Array.isArray(verb.english) ? verb.english : [verb.english];
    for (let idx = 0; idx < meanings.length; ++idx) {
      let base = meanings[idx].replace(/^to /, '').split(',')[0].trim().toLowerCase();
      if (phrase.includes(base)) {
        for (let i = 0; i < pronouns.length; ++i) {
          if (phrase.includes(pronouns[i].toLowerCase())) {
            return { verb, pronounIdx: i, meaningIdx: idx };
          }
        }
        return { verb, pronounIdx: 0, meaningIdx: idx };
      }
    }
  }
  return null;
}

// --- Helper: Build English phrase for a verb/tense/pronoun ---
function buildEnglishPhrase(verb, tense, pronounIdx, meaningIdx = 0) {
  const pronoun = pronouns[pronounIdx];
  let meanings = Array.isArray(verb.english) ? verb.english : [verb.english];
  let meaning = meanings[meaningIdx];
  let base = meaning.replace(/^to /, '').split(',')[0].trim();

  // Remove parenthetical notes for matching irregulars
  let normalizedMeaning = meaning.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();

  // Irregulars lookup (expand as needed)
const irregulars = {
  "to be": { preterite: pronoun === "I" ? "was" : (["He", "She", "It"].includes(pronoun) ? "was" : "were"), pastPart: "been" },
  "to have": { preterite: "had", pastPart: "had" },
  "to do": { preterite: "did", pastPart: "done" },
  "to go": { preterite: "went", pastPart: "gone" },
  "to come": { preterite: "came", pastPart: "come" },
  "to take": { preterite: "took", pastPart: "taken" },
  "to make": { preterite: "made", pastPart: "made" },
  "to say": { preterite: "said", pastPart: "said" },
  "to see": { preterite: "saw", pastPart: "seen" },
  "to get": { preterite: "got", pastPart: "gotten" },
  "to know": { preterite: "knew", pastPart: "known" },
  "to think": { preterite: "thought", pastPart: "thought" },
  "to become": { preterite: "became", pastPart: "become" },
  "to begin": { preterite: "began", pastPart: "begun" },
  "to break": { preterite: "broke", pastPart: "broken" },
  "to bring": { preterite: "brought", pastPart: "brought" },
  "to buy": { preterite: "bought", pastPart: "bought" },
  "to choose": { preterite: "chose", pastPart: "chosen" },
  "to drink": { preterite: "drank", pastPart: "drunk" },
  "to drive": { preterite: "drove", pastPart: "driven" },
  "to eat": { preterite: "ate", pastPart: "eaten" },
  "to fall": { preterite: "fell", pastPart: "fallen" },
  "to feel": { preterite: "felt", pastPart: "felt" },
  "to find": { preterite: "found", pastPart: "found" },
  "to fly": { preterite: "flew", pastPart: "flown" },
  "to forget": { preterite: "forgot", pastPart: "forgotten" },
  "to give": { preterite: "gave", pastPart: "given" },
  "to grow": { preterite: "grew", pastPart: "grown" },
  "to hear": { preterite: "heard", pastPart: "heard" },
  "to hold": { preterite: "held", pastPart: "held" },
  "to keep": { preterite: "kept", pastPart: "kept" },
  "to leave": { preterite: "left", pastPart: "left" },
  "to let": { preterite: "let", pastPart: "let" },
  "to lose": { preterite: "lost", pastPart: "lost" },
  "to mean": { preterite: "meant", pastPart: "meant" },
  "to meet": { preterite: "met", pastPart: "met" },
  "to pay": { preterite: "paid", pastPart: "paid" },
  "to put": { preterite: "put", pastPart: "put" },
  "to read": { preterite: "read", pastPart: "read" },
  "to run": { preterite: "ran", pastPart: "run" },
  "to sell": { preterite: "sold", pastPart: "sold" },
  "to send": { preterite: "sent", pastPart: "sent" },
  "to set": { preterite: "set", pastPart: "set" },
  "to sit": { preterite: "sat", pastPart: "sat" },
  "to sleep": { preterite: "slept", pastPart: "slept" },
  "to speak": { preterite: "spoke", pastPart: "spoken" },
  "to spend": { preterite: "spent", pastPart: "spent" },
  "to stand": { preterite: "stood", pastPart: "stood" },
  "to swim": { preterite: "swam", pastPart: "swum" },
  "to teach": { preterite: "taught", pastPart: "taught" },
  "to tell": { preterite: "told", pastPart: "told" },
  "to understand": { preterite: "understood", pastPart: "understood" },
  "to wear": { preterite: "wore", pastPart: "worn" },
  "to win": { preterite: "won", pastPart: "won" },
  "to write": { preterite: "wrote", pastPart: "written" },
  "to lead": { preterite: "led", pastPart: "led" },
  "to lend": { preterite: "lent", pastPart: "lent" },
  "to tear": { preterite: "tore", pastPart: "torn" }
};

  // Try to find irregular by normalized meaning (for multi-meaning verbs)
  let irregularKey = normalizedMeaning;
  // Also check for multi-word verbs (e.g., "fall asleep")
  if (!irregulars[irregularKey] && meaning.toLowerCase().startsWith("to ")) {
    let multiWordKey = meaning.toLowerCase();
    if (irregulars[multiWordKey]) irregularKey = multiWordKey;
  }
  // Improved regular verb past tense logic: double consonant if CVC and ends with single consonant (not w, x, y)
  function regularPast(base) {
    if (/([aeiou][^aeiouwxy])$/.test(base)) {
      return base + base.slice(-1) + "ed";
    }
    if (base.endsWith("e")) return base + "d";
    return base + "ed";
  }
  let preterite = regularPast(base);
  let pastPart = preterite;
  if (irregulars[irregularKey]) {
    preterite = irregulars[irregularKey].preterite;
    pastPart = irregulars[irregularKey].pastPart;
  }

  // Present 3rd person singular
  let present = base;
  if (pronoun === "He") {
    if (base.endsWith('y')) present = base.slice(0, -1) + "ies";
    else if (base.endsWith('o') || base.endsWith('ch') || base.endsWith('s') || base.endsWith('sh') || base.endsWith('x') || base.endsWith('z'))
      present = base + "es";
    else present = base + "s";
  }

  // Map French tenses to English equivalents
  switch (tense) {
    case "Present":
      return `${pronoun} ${present}`;
    case "Passé Composé":
      return `${pronoun} ${["He", "She", "It"].includes(pronoun) ? "has" : "have"} ${pastPart}`;
    case "Imparfait":
      return `${pronoun} used to ${base}`;
    case "Passé Simple":
      return `${pronoun} ${preterite}`;
    case "Futur Simple":
      return `${pronoun} will ${base}`;
    case "Conditionnel Présent":
      return `${pronoun} would ${base}`;
    case "Plus-que-parfait":
      return `${pronoun} had ${pastPart}`;
    case "Futur Antérieur":
      return `${pronoun} will have ${pastPart}`;
    case "Conditionnel Passé":
      return `${pronoun} would have ${pastPart}`;
    default:
      return `${pronoun} ${base}`;
  }
}

// --- Practice/Quiz Mode Toggle ---
document.getElementById('practiceModeBtn').addEventListener('click', function() {
  document.getElementById('practiceSection').style.display = '';
  document.getElementById('quizSection').style.display = 'none';
});
document.getElementById('quizModeBtn').addEventListener('click', function() {
  document.getElementById('practiceSection').style.display = 'none';
  document.getElementById('quizSection').style.display = '';
  startQuiz();
});
