/* ============================================================
   FLASH - Chat Extras (Voice + Journal)
   Injects 2 buttons into the AI Chat composer
   ============================================================ */
(function () {
  'use strict';
  var API_BASE = (window.FLASH_CONFIG && window.FLASH_CONFIG.API_BASE) || 'http://localhost:3000';
  var SF = window.FLASH_SAFE_FETCH;
  if (!SF) { console.warn('[chat-extras] safe-fetch missing'); return; }

  function lang() { return document.documentElement.lang === 'ar' ? 'ar' : 'en'; }
  function t(en, ar) { return lang() === 'ar' ? ar : en; }
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ============================================================
     Voice recording
     ============================================================ */
  var mediaRecorder = null;
  var audioChunks = [];
  var recordingButton = null;

  async function startVoiceRecording(btn) {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(t('Voice not supported in this browser.', 'الصوت مش مدعوم في المتصفح ده.'));
      return;
    }
    try {
      var stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = function (e) {
        if (e.data && e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async function () {
        stream.getTracks().forEach(function (t) { t.stop(); });
        btn.classList.remove('recording');
        var blob = new Blob(audioChunks, { type: 'audio/webm' });
        if (blob.size < 500) return;
        await sendVoice(blob);
      };

      mediaRecorder.start();
      btn.classList.add('recording');
      recordingButton = btn;

      /* Auto-stop after 15s */
      setTimeout(function () {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 15000);
    } catch (e) {
      alert(t('Could not access microphone.', 'مش قادر أوصل للمايك.'));
    }
  }

  function stopVoiceRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }

  async function sendVoice(blob) {
    try {
      var fd = new FormData();
      fd.append('audio', blob, 'voice.webm');
      fd.append('language', lang());

      var res = await SF(API_BASE + '/ai/voice/chat', {
        method: 'POST',
        body: fd,
        timeoutMs: 45000,
        silent: true
      });

      if (!res || !res.ok) throw new Error('voice_failed');
      var data = await res.json();
      var transcript = data.transcript || data.text || '';
      var reply = data.reply || data.response || '';

      /* Show in chat */
      if (window.FLASH_AI_CHAT) {
        if (transcript) {
          window.FLASH_AI_CHAT.send && window.FLASH_AI_CHAT.send('[Voice] ' + transcript);
        }
      }
    } catch (e) {
      alert(t('Voice request failed. Try again.', 'فشل الطلب الصوتي. حاول تاني.'));
    }
  }

  /* ============================================================
     Journal modal
     ============================================================ */
  var journalState = { mood: null, energy: null };

  function openJournal() {
    if (document.querySelector('.journal-backdrop')) return;

    var backdrop = document.createElement('div');
    backdrop.className = 'journal-backdrop';

    var moods = [
      { id: 'calm',       en: 'Calm',       ar: 'هادئ' },
      { id: 'focused',    en: 'Focused',    ar: 'مركّز' },
      { id: 'tired',      en: 'Tired',      ar: 'تعبان' },
      { id: 'stressed',   en: 'Stressed',   ar: 'متوتر' },
      { id: 'energized',  en: 'Energized',  ar: 'نشيط' }
    ];

    var moodHtml = moods.map(function (m) {
      return '<button type="button" class="journal-mood" data-mood="' + m.id + '" aria-pressed="false">' + esc(lang() === 'ar' ? m.ar : m.en) + '</button>';
    }).join('');

    var energyHtml = [1, 2, 3, 4, 5].map(function (n) {
      return '<button type="button" data-energy="' + n + '" aria-pressed="false">' + n + '</button>';
    }).join('');

    backdrop.innerHTML =
      '<div class="journal-modal">' +
        '<h3 class="journal-h">' + esc(t('How are you feeling?', 'إيه حالتك دلوقتي؟')) + '</h3>' +
        '<p class="journal-sub">' + esc(t('Helps us adapt today\'s training.', 'بيساعدنا نظبط تدريب النهاردة.')) + '</p>' +

        '<span class="journal-label">' + esc(t('Mood', 'الحالة')) + '</span>' +
        '<div class="journal-moods">' + moodHtml + '</div>' +

        '<span class="journal-label">' + esc(t('Energy (1-5)', 'الطاقة (1-5)')) + '</span>' +
        '<div class="journal-energy">' + energyHtml + '</div>' +

        '<div class="journal-actions">' +
          '<button type="button" class="journal-btn secondary" data-action="cancel">' + esc(t('Cancel', 'إلغاء')) + '</button>' +
          '<button type="button" class="journal-btn primary" data-action="save">' + esc(t('Save', 'حفظ')) + '</button>' +
        '</div>' +

        '<div class="journal-result" id="journal-result" hidden></div>' +
      '</div>';

    document.body.appendChild(backdrop);

    /* Wire mood */
    backdrop.querySelectorAll('.journal-mood').forEach(function (b) {
      b.addEventListener('click', function () {
        backdrop.querySelectorAll('.journal-mood').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        journalState.mood = b.getAttribute('data-mood');
      });
    });

    /* Wire energy */
    backdrop.querySelectorAll('.journal-energy button').forEach(function (b) {
      b.addEventListener('click', function () {
        backdrop.querySelectorAll('.journal-energy button').forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
        b.setAttribute('aria-pressed', 'true');
        journalState.energy = parseInt(b.getAttribute('data-energy'), 10);
      });
    });

    /* Actions */
    backdrop.querySelector('[data-action="cancel"]').addEventListener('click', function () {
      backdrop.remove();
    });
    backdrop.querySelector('[data-action="save"]').addEventListener('click', function () {
      saveJournal(backdrop);
    });
    backdrop.addEventListener('click', function (e) {
      if (e.target === backdrop) backdrop.remove();
    });
  }

  async function saveJournal(backdrop) {
    if (!journalState.mood || !journalState.energy) return;

    var resultEl = backdrop.querySelector('#journal-result');
    resultEl.hidden = false;
    resultEl.textContent = t('Saving…', 'بيتم الحفظ…');

    try {
      var res = await SF(API_BASE + '/ai/journal/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: journalState.mood,
          energy: journalState.energy,
          language: lang()
        }),
        timeoutMs: 20000,
        silent: true
      });

      if (!res || !res.ok) throw new Error('journal_failed');
      var data = await res.json();

      var adj = data.plan_adjustment || data.adjustment || 'normal';
      var explanation = data.explanation || data.message || '';

      var adjLabels = {
        normal: t('Normal plan', 'خطة عادية'),
        lighter: t('Lighter plan today', 'خطة أخفّ النهاردة'),
        recovery: t('Recovery mode', 'وضع استشفاء'),
        stretch: t('Stretch mode', 'وضع تحدّي'),
        warmup_only: t('Warm-up only', 'تسخين فقط')
      };

      resultEl.innerHTML =
        '<strong>' + esc(adjLabels[adj] || adj) + '</strong>' +
        (explanation ? '<br>' + esc(explanation) : '');

      /* Auto close after 3s */
      setTimeout(function () {
        if (backdrop.parentNode) backdrop.remove();
      }, 3200);
    } catch (e) {
      resultEl.textContent = t('Save failed. Try again.', 'فشل الحفظ. حاول تاني.');
    }
  }

  /* ============================================================
     Inject buttons
     ============================================================ */
  function injectButtons() {
    var composer = document.querySelector('.ai-chat-composer');
    if (!composer) return false;

    /* Prevent double */
    if (composer.querySelector('.ai-chat-tools')) return true;

    var tools = document.createElement('div');
    tools.className = 'ai-chat-tools';

    /* Voice button */
    var voice = document.createElement('button');
    voice.type = 'button';
    voice.className = 'ai-chat-tool';
    voice.setAttribute('aria-label', t('Voice input', 'إدخال صوتي'));
    voice.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>' +
      '<span>' + esc(t('Voice', 'صوت')) + '</span>';

    voice.addEventListener('click', function () {
      if (voice.classList.contains('recording')) {
        stopVoiceRecording();
      } else {
        startVoiceRecording(voice);
      }
    });

    /* Journal button */
    var journal = document.createElement('button');
    journal.type = 'button';
    journal.className = 'ai-chat-tool';
    journal.setAttribute('aria-label', t('Journal', 'يوميات'));
    journal.innerHTML =
      '<svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>' +
      '<span>' + esc(t('Journal', 'يوميات')) + '</span>';

    journal.addEventListener('click', openJournal);

    tools.appendChild(voice);
    tools.appendChild(journal);
    composer.insertBefore(tools, composer.firstChild);

    return true;
  }

  function tryInject(attempt) {
    attempt = attempt || 0;
    if (injectButtons()) {
      console.info('[chat-extras] buttons injected');
      return;
    }
    if (attempt < 20) setTimeout(function () { tryInject(attempt + 1); }, 400);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(function () { tryInject(0); }, 1200); });
  } else {
    setTimeout(function () { tryInject(0); }, 1200);
  }

  window.FLASH_CHAT_EXTRAS = { openJournal: openJournal, version: '1.0.0' };
})();