/**
 * GENIUS (Simon) — Clássico dos Anos 80
 * Engine de Áudio Analógico (Web Audio API) + Haptic Feedback + 3 Modos de Jogo
 * Desenvolvido para 4U.IA.BR
 */

(function () {
    'use strict';

    // ==========================================
    // CONFIGURAÇÃO DE CORES E FREQUÊNCIAS (ORIGINAIS 1978)
    // ==========================================
    const COLORS = {
        topleft:     { name: 'green',  frequency: 329.63, label: 'VERDE' },   // E4
        topright:    { name: 'red',    frequency: 261.63, label: 'VERMELHO' },// C4
        bottomleft:  { name: 'yellow', frequency: 220.00, label: 'AMARELO' }, // A3
        bottomright: { name: 'blue',   frequency: 164.81, label: 'AZUL' }     // E3
    };

    const COLOR_KEYS = ['topleft', 'topright', 'bottomleft', 'bottomright'];

    // Modos de Jogo
    const MODES = [
        { id: 'classic', label: 'CLÁSSICO' },
        { id: 'strict',  label: 'STRICT' },
        { id: 'reverse', label: 'INVERSO' }
    ];

    // Níveis de Habilidade (Velocidades)
    const SKILL_LEVELS = [
        { level: 1, toneDuration: 450, gap: 140 },
        { level: 2, toneDuration: 360, gap: 100 },
        { level: 3, toneDuration: 280, gap: 70 },
        { level: 4, toneDuration: 200, gap: 45 }
    ];

    // ==========================================
    // ESTADO DO JOGO
    // ==========================================
    let isOn = false;
    let isPlaying = false;
    let sequence = [];
    let playerSequence = [];
    let level = 0;
    let currentModeIndex = 0; // 0 = Classic, 1 = Strict, 2 = Reverse
    let currentSkillIndex = 0; // 0 = Skill 1, 1 = Skill 2, etc.
    let canPlayerClick = false;
    let isShowingSequence = false;
    let highScores = [];
    let playerTimeoutId = null;

    // Áudio
    let audioCtx = null;
    let isMuted = localStorage.getItem('genius_sound_muted') === 'true';
    let distortionCurve = null;

    // DOM Elements
    let powerBtn, startBtn, turnDisplay, scoreList;
    let modeText, skillText, btnMode, btnSkill;
    let soundBtn, soundLabel, helpModal, modalOverlay;
    let btnShare, shareToast;
    const quadrantElements = {};

    // ==========================================
    // AUDIO ENGINE (SÍNTESE ANALÓGICA TIPO SIMON)
    // ==========================================
    function initAudio() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                audioCtx = new AudioContextClass();
            }
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function getDistortionCurve() {
        if (distortionCurve) return distortionCurve;
        const amount = 35;
        const n = 2048;
        const curve = new Float32Array(n);
        const deg = Math.PI / 180;
        for (let i = 0; i < n; i++) {
            const x = (i * 2) / (n - 1) - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        distortionCurve = curve;
        return curve;
    }

    function playTone(freq, durationSec) {
        if (isMuted || !audioCtx) return;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();

            const now = audioCtx.currentTime;
            const osc = audioCtx.createOscillator();
            const filter = audioCtx.createBiquadFilter();
            const shaper = audioCtx.createWaveShaper();
            const gain = audioCtx.createGain();

            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now);

            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1400, now);
            filter.Q.setValueAtTime(0.7, now);

            shaper.curve = getDistortionCurve();
            shaper.oversample = '4x';

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.linearRampToValueAtTime(0.35, now + 0.015);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

            osc.connect(filter);
            filter.connect(shaper);
            shaper.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(now);
            osc.stop(now + durationSec + 0.05);
        } catch (e) {
            console.error('Audio play error:', e);
        }
    }

    function playErrorSound() {
        if (isMuted || !audioCtx) return;
        try {
            if (audioCtx.state === 'suspended') audioCtx.resume();

            const now = audioCtx.currentTime;
            const duration = 0.85;

            const masterGain = audioCtx.createGain();
            masterGain.gain.setValueAtTime(0.001, now);
            masterGain.gain.linearRampToValueAtTime(0.5, now + 0.02);
            masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
            masterGain.connect(audioCtx.destination);

            const osc1 = audioCtx.createOscillator();
            osc1.type = 'sawtooth';
            osc1.frequency.setValueAtTime(120, now);
            osc1.frequency.exponentialRampToValueAtTime(55, now + duration);

            const osc2 = audioCtx.createOscillator();
            osc2.type = 'square';
            osc2.frequency.setValueAtTime(58, now);

            osc1.connect(masterGain);
            osc2.connect(masterGain);

            osc1.start(now);
            osc2.start(now);
            osc1.stop(now + duration);
            osc2.stop(now + duration);
        } catch (e) {
            console.error('Error sound error:', e);
        }
    }

    function playVictoryFanfare() {
        if (isMuted || !audioCtx) return;
        const notes = [164.81, 220.00, 261.63, 329.63, 329.63, 329.63];
        notes.forEach((freq, idx) => {
            setTimeout(() => {
                playTone(freq, 0.15);
            }, idx * 120);
        });
    }

    // ==========================================
    // HAPTIC FEEDBACK (VIBRAÇÃO EM SMARTPHONES)
    // ==========================================
    function triggerHaptic(type = 'tap') {
        if (!navigator.vibrate) return;
        try {
            if (type === 'tap') navigator.vibrate(35);
            else if (type === 'error') navigator.vibrate([80, 40, 150]);
            else if (type === 'victory') navigator.vibrate([30, 30, 30, 30, 80]);
        } catch (e) {}
    }

    // ==========================================
    // EFEITOS VISUAIS E ILUMINAÇÃO
    // ==========================================
    function lightQuadrant(id) {
        const el = quadrantElements[id];
        if (el) el.classList.add('lit');
    }

    function unlightQuadrant(id) {
        const el = quadrantElements[id];
        if (el) el.classList.remove('lit');
    }

    function unlightAllQuadrants() {
        COLOR_KEYS.forEach(key => unlightQuadrant(key));
    }

    function flashQuadrant(id, durationMs, callback) {
        lightQuadrant(id);
        playTone(COLORS[id].frequency, durationMs / 1000);

        setTimeout(() => {
            unlightQuadrant(id);
            setTimeout(() => {
                if (callback) callback();
            }, SKILL_LEVELS[currentSkillIndex].gap);
        }, durationMs);
    }

    function celebrationAnimation(callback) {
        playVictoryFanfare();
        triggerHaptic('victory');

        let step = 0;
        const totalSteps = 8;
        const interval = setInterval(() => {
            unlightAllQuadrants();
            lightQuadrant(COLOR_KEYS[step % 4]);
            step++;
            if (step >= totalSteps) {
                clearInterval(interval);
                setTimeout(() => {
                    unlightAllQuadrants();
                    if (callback) callback();
                }, 200);
            }
        }, 100);
    }

    function showErrorAnimation(callback) {
        triggerHaptic('error');
        COLOR_KEYS.forEach(key => {
            if (quadrantElements[key]) quadrantElements[key].classList.add('error');
        });

        playErrorSound();

        setTimeout(() => {
            COLOR_KEYS.forEach(key => {
                if (quadrantElements[key]) quadrantElements[key].classList.remove('error');
            });
            if (callback) callback();
        }, 800);
    }

    // ==========================================
    // DISPLAY LED & UI
    // ==========================================
    function updateDisplay(text = null) {
        if (!turnDisplay) return;

        if (!isOn) {
            turnDisplay.textContent = '--';
            turnDisplay.classList.add('off');
        } else {
            turnDisplay.classList.remove('off');
            if (text !== null) {
                turnDisplay.textContent = text;
            } else if (level === 0) {
                turnDisplay.textContent = '--';
            } else {
                turnDisplay.textContent = level < 10 ? '0' + level : String(level);
            }
        }
    }

    function updateModesUI() {
        if (modeText) modeText.textContent = MODES[currentModeIndex].label;
        if (skillText) skillText.textContent = SKILL_LEVELS[currentSkillIndex].level;
        if (soundLabel) soundLabel.textContent = isMuted ? '🔇 MUDO' : '🔊 SOM';
    }

    // ==========================================
    // REGRAS E LÓGICA DO JOGO
    // ==========================================
    function clearPlayerTimer() {
        if (playerTimeoutId) {
            clearTimeout(playerTimeoutId);
            playerTimeoutId = null;
        }
    }

    function armPlayerTimer() {
        clearPlayerTimer();
        if (!isOn || !isPlaying || !canPlayerClick || isShowingSequence) return;

        // Tempo limite para o jogador responder (5.5s a 2s conforme o nível)
        const timeoutMs = Math.max(2000, 5500 - (level - 1) * 160);
        playerTimeoutId = setTimeout(() => {
            if (!isOn || !isPlaying || !canPlayerClick || isShowingSequence) return;
            handleMistake('timeout');
        }, timeoutMs);
    }

    function playSequence(index) {
        if (index >= sequence.length) {
            isShowingSequence = false;
            canPlayerClick = true;
            playerSequence = [];
            armPlayerTimer();
            return;
        }

        const currentSkill = SKILL_LEVELS[currentSkillIndex];
        const id = sequence[index];
        flashQuadrant(id, currentSkill.toneDuration, () => {
            playSequence(index + 1);
        });
    }

    function startSequence() {
        clearPlayerTimer();
        isShowingSequence = true;
        canPlayerClick = false;

        setTimeout(() => {
            playSequence(0);
        }, 500);
    }

    function nextLevel() {
        clearPlayerTimer();
        level++;
        updateDisplay();

        // Adiciona nova cor aleatória à sequência
        const randomKey = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];
        sequence.push(randomKey);

        // Marcos clássicos com fanfarra comemorativa (níveis 8, 14, 20 e 31)
        if (level === 8 || level === 14 || level === 20 || level === 31) {
            celebrationAnimation(() => {
                startSequence();
            });
        } else {
            startSequence();
        }
    }

    function checkPlayerInput() {
        const currentIdx = playerSequence.length - 1;
        const currentMode = MODES[currentModeIndex].id;

        let expectedColor;
        if (currentMode === 'reverse') {
            // No modo Inverso, a ordem esperada é de trás para frente!
            expectedColor = sequence[sequence.length - 1 - currentIdx];
        } else {
            // Modo Clássico ou Strict: ordem direta
            expectedColor = sequence[currentIdx];
        }

        const playerColor = playerSequence[currentIdx];

        if (playerColor !== expectedColor) {
            handleMistake('wrong');
            return;
        }

        // Acertou toda a sequência desta rodada!
        if (playerSequence.length === sequence.length) {
            clearPlayerTimer();
            canPlayerClick = false;
            setTimeout(() => {
                nextLevel();
            }, 800);
        }
    }

    function handleMistake(reason) {
        clearPlayerTimer();
        canPlayerClick = false;
        isPlaying = false;
        isShowingSequence = false;

        updateDisplay('!!');

        showErrorAnimation(() => {
            const finalScore = level > 0 ? level - 1 : 0;
            if (finalScore > 0) {
                addScore(finalScore);
            }

            level = 0;
            sequence = [];
            playerSequence = [];
            updateDisplay();
        });
    }

    function resetGame() {
        clearPlayerTimer();
        isPlaying = false;
        canPlayerClick = false;
        isShowingSequence = false;
        level = 0;
        sequence = [];
        playerSequence = [];
        unlightAllQuadrants();
        updateDisplay();
    }

    function startGame() {
        if (!isOn || isPlaying) return;
        clearPlayerTimer();
        isPlaying = true;
        level = 0;
        sequence = [];
        playerSequence = [];
        canPlayerClick = false;

        nextLevel();
    }

    // ==========================================
    // RECORDES (HIGH SCORES)
    // ==========================================
    function loadHighScores() {
        try {
            const saved = localStorage.getItem('geniusHighScores');
            highScores = saved ? JSON.parse(saved) : [];
            if (!Array.isArray(highScores)) highScores = [];
        } catch (e) {
            highScores = [];
        }
        updateScoreboard();
    }

    function saveHighScores() {
        try {
            localStorage.setItem('geniusHighScores', JSON.stringify(highScores));
        } catch (e) {}
    }

    function addScore(score) {
        if (score <= 0) return;
        highScores.push(score);
        highScores.sort((a, b) => b - a);
        highScores = highScores.slice(0, 5);
        saveHighScores();
        updateScoreboard();
    }

    function updateScoreboard() {
        if (!scoreList) return;
        scoreList.innerHTML = '';
        for (let i = 0; i < 5; i++) {
            const li = document.createElement('li');
            const score = highScores[i];
            const text = (score !== undefined && score !== null) ? (score < 10 ? '0' + score : String(score)) : '--';
            li.innerHTML = `<span>#${i + 1}</span><span>${text} RODADAS</span>`;
            scoreList.appendChild(li);
        }
    }

    // ==========================================
    // INTERAÇÃO E EVENTOS
    // ==========================================
    function handleQuadrantClick(id) {
        if (!isOn || !canPlayerClick || isShowingSequence) return;
        initAudio();

        triggerHaptic('tap');
        lightQuadrant(id);
        playTone(COLORS[id].frequency, 0.22);

        setTimeout(() => {
            unlightQuadrant(id);
        }, 180);

        playerSequence.push(id);
        armPlayerTimer();

        setTimeout(() => {
            checkPlayerInput();
        }, 220);
    }

    function handlePowerToggle() {
        initAudio();
        triggerHaptic('tap');
        isOn = !isOn;

        if (isOn) {
            powerBtn.classList.add('power-on');
            startBtn.classList.remove('disabled');
            loadHighScores();
        } else {
            powerBtn.classList.remove('power-on');
            startBtn.classList.add('disabled');
            resetGame();
        }
        updateDisplay();
    }

    function cycleMode() {
        if (isPlaying) return;
        currentModeIndex = (currentModeIndex + 1) % MODES.length;
        updateModesUI();
        triggerHaptic('tap');
        updateDisplay(MODES[currentModeIndex].label.substring(0, 2));
        setTimeout(() => updateDisplay(), 600);
    }

    function cycleSkill() {
        if (isPlaying) return;
        currentSkillIndex = (currentSkillIndex + 1) % SKILL_LEVELS.length;
        updateModesUI();
        triggerHaptic('tap');
        updateDisplay('S' + SKILL_LEVELS[currentSkillIndex].level);
        setTimeout(() => updateDisplay(), 600);
    }

    function toggleSound() {
        initAudio();
        isMuted = !isMuted;
        localStorage.setItem('genius_sound_muted', isMuted);
        updateModesUI();
    }

    function shareRecord() {
        const topScore = highScores[0] || 0;
        const shareText = `🧠 Bati ${topScore} rodadas no Genius da 4U.IA.BR! Consegue superar esse desafio de memória? 👉4u.ia.br/app/genius`;

        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareText).then(() => {
                showToast('Link copiado para a área de transferência!');
            }).catch(() => {
                showToast('Acesse: 4u.ia.br/app/genius');
            });
        } else {
            showToast('Acesse: 4u.ia.br/app/genius');
        }
    }

    function showToast(msg) {
        if (!shareToast) return;
        shareToast.textContent = msg;
        shareToast.style.display = 'block';
        setTimeout(() => {
            shareToast.style.display = 'none';
        }, 2500);
    }

    // ==========================================
    // REGISTRO DE EVENTOS E ATALHOS
    // ==========================================
    function setupEvents() {
        powerBtn = document.getElementById('on');
        startBtn = document.getElementById('start');
        turnDisplay = document.getElementById('turn');
        scoreList = document.getElementById('score-list');
        btnMode = document.getElementById('btn-mode');
        btnSkill = document.getElementById('btn-skill');
        modeText = document.getElementById('mode-text');
        skillText = document.getElementById('skill-text');
        soundBtn = document.getElementById('btn-sound');
        soundLabel = document.getElementById('sound-label');
        helpModal = document.getElementById('help-modal');
        modalOverlay = document.getElementById('modal-overlay');
        btnShare = document.getElementById('btn-share');
        shareToast = document.getElementById('share-toast');

        COLOR_KEYS.forEach(key => {
            quadrantElements[key] = document.getElementById(key);
            const el = quadrantElements[key];
            if (el) {
                const onTrigger = (e) => {
                    if (e.cancelable) e.preventDefault();
                    handleQuadrantClick(key);
                };
                el.addEventListener('touchstart', onTrigger, { passive: false });
                el.addEventListener('mousedown', onTrigger);
            }
        });

        // Power & Start
        if (powerBtn) {
            powerBtn.addEventListener('click', handlePowerToggle);
        }

        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!isOn || isPlaying) return;
                initAudio();
                startGame();
            });
        }

        // Modos e Dificuldade
        if (btnMode) btnMode.addEventListener('click', cycleMode);
        if (btnSkill) btnSkill.addEventListener('click', cycleSkill);
        if (soundBtn) soundBtn.addEventListener('click', toggleSound);
        if (btnShare) btnShare.addEventListener('click', shareRecord);

        // Modal de Ajuda
        const openHelp = () => {
            initAudio();
            helpModal.classList.add('active');
            modalOverlay.classList.add('active');
        };
        const closeHelp = () => {
            helpModal.classList.remove('active');
            modalOverlay.classList.remove('active');
        };

        const btnHelp = document.getElementById('btn-help');
        const closeHelpBtn = document.getElementById('close-help-btn');
        const btnModalOk = document.getElementById('btn-modal-ok');

        if (btnHelp) btnHelp.addEventListener('click', openHelp);
        if (closeHelpBtn) closeHelpBtn.addEventListener('click', closeHelp);
        if (btnModalOk) btnModalOk.addEventListener('click', closeHelp);
        if (modalOverlay) modalOverlay.addEventListener('click', closeHelp);

        // Teclado PC
        window.addEventListener('keydown', (e) => {
            initAudio();

            // Quadrantes
            if (e.code === 'KeyW' || e.code === 'ArrowUp' || e.code === 'Digit1' || e.code === 'Numpad1') {
                e.preventDefault();
                handleQuadrantClick('topleft');
            } else if (e.code === 'KeyD' || e.code === 'ArrowRight' || e.code === 'Digit2' || e.code === 'Numpad2') {
                e.preventDefault();
                handleQuadrantClick('topright');
            } else if (e.code === 'KeyA' || e.code === 'ArrowLeft' || e.code === 'Digit3' || e.code === 'Numpad3') {
                e.preventDefault();
                handleQuadrantClick('bottomleft');
            } else if (e.code === 'KeyS' || e.code === 'ArrowDown' || e.code === 'Digit4' || e.code === 'Numpad4') {
                e.preventDefault();
                handleQuadrantClick('bottomright');
            }

            // Ações
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                if (isOn && !isPlaying) startGame();
            } else if (e.code === 'KeyP') {
                e.preventDefault();
                handlePowerToggle();
            } else if (e.code === 'KeyM') {
                e.preventDefault();
                cycleMode();
            } else if (e.code === 'KeyH') {
                e.preventDefault();
                openHelp();
            }
        });
    }

    // ==========================================
    // INICIALIZAÇÃO
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        setupEvents();
        loadHighScores();
        updateModesUI();
        updateDisplay();
    });
})();
