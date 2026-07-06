// BANCO DE DATOS EXACTO Y COMPLETO
const BANCO_VOCALES = {
    A: {
        facil: ['abeja', 'aguila', 'ala', 'almohada', 'ambulancia', 'angel', 'anillo', 'araña', 'arbol', 'auto', 'avion'],
        dificil: ['acuarela', 'aguacate', 'alarma', 'algodondeazucar', 'ancla', 'armario', 'arroz']
    },
    E: {
        facil: ['elefante', 'empanada', 'enchufe', 'erizo', 'escalera', 'escoba', 'estrella'],
        dificil: ['elote', 'engranaje', 'ensalada', 'entrada', 'escudo', 'escuela', 'esfera', 'espejo', 'estante', 'estuche', 'etiqueta']
    },
    I: {
        facil: ['iglu', 'iguana', 'iman', 'insectos', 'instrumentos', 'interruptor', 'invierno', 'inyeccion', 'isla'],
        dificil: ['iconos', 'iglesia', 'iglesias', 'imagenes', 'imanes', 'impermeable', 'impresion', 'impresora', 'incendio', 'interruptor', 'isla']
    },
    O: {
        facil: ['ocho', 'ojo', 'ola', 'olla', 'orca', 'oreja', 'oruga', 'osito', 'oso', 'oveja'],
        dificil: ['oasis', 'ocarina', 'oficina', 'oliva', 'orangutan', 'ostra', 'ovillo']
    },
    U: {
        facil: ['ukelele', 'ukeleleazul', 'ukelelerojo', 'unicornioazul', 'unicornioblanco', 'unicorniorosa', 'uno', 'uña', 'uvas', 'uvasmoradas', 'uvasverdes'],
        dificil: ['uniforme', 'uñapintada', 'uñasinpintar', 'urna', 'urraca']
    }
};

let gameState = {
    playerName: "",
    dificultad: "facil", 
    modoJuegoSeleccionado: "aleatorio", 
    currentQuestionIndex: 0,
    totalQuestions: 10,
    score: 0,
    playlist: [],
    settings: { music: true, sfx: true, voice: true }
};

const AudioSynth = {
    ctx: null,
    init() { if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)(); },
    play(type) {
        this.init();
        if(!gameState.settings.sfx) return;
        try {
            let osc = this.ctx.createOscillator();
            let gain = this.ctx.createGain();
            osc.connect(gain); gain.connect(this.ctx.destination);
            if(type === 'pop') {
                osc.frequency.setValueAtTime(400, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.1);
                gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.1);
                osc.start(); osc.stop(this.ctx.currentTime + 0.1);
            } else if(type === 'correcto') {
                osc.frequency.setValueAtTime(523.25, this.ctx.currentTime); 
                osc.frequency.setValueAtTime(659.25, this.ctx.currentTime + 0.1); 
                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.3);
                osc.start(); osc.stop(this.ctx.currentTime + 0.3);
            } else if(type === 'incorrecto') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, this.ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.25);
                gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.25);
                osc.start(); osc.stop(this.ctx.currentTime + 0.25);
            }
        } catch(e){}
    }
};

window.addEventListener('DOMContentLoaded', () => {
    generarTecladoInfantil();
    cargarAjustesDeLocalStorage();
    simularCargaSplash();
});

function simularCargaSplash() {
    let progreso = 0;
    const fill = document.getElementById('loading-fill');
    const text = document.getElementById('loading-text');
    const btn = document.getElementById('btn-splash-start');

    const intervalo = setInterval(() => {
        progreso += Math.floor(Math.random() * 15) + 5;
        if (progreso >= 100) {
            progreso = 100;
            clearInterval(intervalo);
            if(text) text.textContent = "¡Listo para jugar! 🎉";
            document.querySelector('.loading-wrapper').classList.add('hidden');
            if(btn) btn.classList.remove('hidden');
        }
        if(fill) fill.style.width = `${progreso}%`;
    }, 120);
}

function iniciarDesdeSplash() {
    AudioSynth.init();
    document.getElementById('splash-screen').style.display = 'none';
    const welcomeScreen = document.getElementById('screen-welcome');
    welcomeScreen.classList.add('active');
    document.body.style.background = varString('--bg-facil');
    playVoice('hola');
}

function generarTecladoInfantil() {
    const keyboardContainer = document.getElementById('kid-keyboard');
    const alfabeto = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
    keyboardContainer.innerHTML = "";
    alfabeto.forEach(letra => {
        const btn = document.createElement('button');
        btn.textContent = letra; btn.className = "key-btn";
        btn.onclick = () => { appendLetra(letra); AudioSynth.play('pop'); };
        keyboardContainer.appendChild(btn);
    });
    const btnDel = document.createElement('button');
    btnDel.textContent = "⌫"; btnDel.className = "key-btn key-del";
    btnDel.onclick = () => { borrarLetra(); AudioSynth.play('pop'); };
    keyboardContainer.appendChild(btnDel);
}

function appendLetra(l) {
    if (gameState.playerName.length < 10) {
        gameState.playerName += l;
        document.getElementById('name-display').textContent = gameState.playerName;
        evaluarBotonInicio();
    }
}

function borrarLetra() {
    gameState.playerName = gameState.playerName.slice(0, -1);
    document.getElementById('name-display').textContent = gameState.playerName || "...";
    evaluarBotonInicio();
}

function evaluarBotonInicio() {
    document.getElementById('btn-start').classList.toggle('locked', gameState.playerName.trim().length < 2);
}

function cambiarDificultadSlider(value) {
    gameState.dificultad = (value == 0) ? "facil" : "dificil";
    document.body.style.background = (value == 0) ? varString('--bg-facil') : varString('--bg-dificil');
    AudioSynth.play('pop');
}
function varString(v) { return getComputedStyle(document.documentElement).getPropertyValue(v); }

function construirPartida() {
    let poolCompleto = [];
    const vocales = ['A', 'E', 'I', 'O', 'U'];
    gameState.modoJuegoSeleccionado = document.getElementById('game-mode-selector').value;

    vocales.forEach(v => {
        BANCO_VOCALES[v][gameState.dificultad].forEach(item => {
            poolCompleto.push({ name: item, vowel: v, pathFolder: gameState.dificultad });
        });
    });

    poolCompleto.sort(() => Math.random() - 0.5);
    gameState.playlist = [];

    for (let i = 0; i < 10; i++) {
        let itemActual = poolCompleto[i % poolCompleto.length];
        let modoPregunta = 1; 
        if (gameState.modoJuegoSeleccionado === "aleatorio") {
            modoPregunta = Math.random() > 0.5 ? 1 : 2;
        } else if (gameState.modoJuegoSeleccionado === "imagen") {
            modoPregunta = 2;
        }

        if (modoPregunta === 1) { 
            let opcionesLetras = [itemActual.vowel];
            while (opcionesLetras.length < 3) {
                let rVocal = vocales[Math.floor(Math.random() * 5)];
                if (!opcionesLetras.includes(rVocal)) opcionesLetras.push(rVocal);
            }
            opcionesLetras.sort(() => Math.random() - 0.5);
            gameState.playlist.push({ modo: 1, target: itemActual, options: opcionesLetras, correct: itemActual.vowel });
        } else { 
            let opcionesImagenes = [itemActual];
            while (opcionesImagenes.length < 3) {
                let rItem = poolCompleto[Math.floor(Math.random() * poolCompleto.length)];
                if (!opcionesImagenes.some(o => o.vowel === rItem.vowel) && rItem.name !== itemActual.name) {
                    opcionesImagenes.push(rItem);
                }
            }
            opcionesImagenes.sort(() => Math.random() - 0.5);
            gameState.playlist.push({ modo: 2, target: itemActual, options: opcionesImagenes, correct: itemActual.name });
        }
    }
    gameState.totalQuestions = gameState.playlist.length;
}

function iniciarJuego() {
    if (gameState.playerName.trim().length < 2) return;
    construirPartida();
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    
    document.getElementById('screen-welcome').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    
    if(gameState.settings.music) {
        const bgM = document.getElementById('bg-music');
        bgM.volume = 0.2; bgM.play().catch(()=>{});
    }
    playVoice('vamos_a_jugar');
    setTimeout(presentarPregunta, 800);
}

function presentarPregunta() {
    if (gameState.currentQuestionIndex >= gameState.totalQuestions) {
        finalizarJuego();
        return;
    }

    // Progreso dinámico elástico
    let porcentajeProgreso = Math.round((gameState.currentQuestionIndex / gameState.totalQuestions) * 100);
    document.getElementById('progress-text').textContent = `Progreso: ${porcentajeProgreso}%`;
    document.getElementById('progress-fill').style.width = `${porcentajeProgreso}%`;
    document.getElementById('stars-count').textContent = gameState.score;

    const preguntaActual = gameState.playlist[gameState.currentQuestionIndex];

    if (preguntaActual.modo === 1) {
        document.getElementById('game-question-text').textContent = "¿Con qué vocal empieza?";
        document.getElementById('mode-1-container').classList.remove('hidden');
        document.getElementById('mode-2-container').classList.add('hidden');

        document.getElementById('m1-target-img').src = `assets/images/${preguntaActual.target.vowel}/${preguntaActual.target.pathFolder}/${preguntaActual.target.name}.png`;
        
        const containerOpts = document.getElementById('m1-options');
        containerOpts.innerHTML = "";
        preguntaActual.options.forEach(vocal => {
            const btn = document.createElement('button');
            btn.className = "vowel-option animate-pop";
            btn.textContent = vocal;
            btn.onclick = () => procesarRespuesta(vocal, btn);
            containerOpts.appendChild(btn);
        });
        playVoice('observa_la_imagen');
    } else {
        document.getElementById('game-question-text').textContent = `¿Cuál empieza con la letra "${preguntaActual.target.vowel}"?`;
        document.getElementById('mode-1-container').classList.add('hidden');
        document.getElementById('mode-2-container').classList.remove('hidden');

        const containerOpts = document.getElementById('m2-options');
        containerOpts.innerHTML = "";
        preguntaActual.options.forEach(item => {
            const div = document.createElement('div');
            div.className = "image-option animate-pop";
            div.innerHTML = `<img src="assets/images/${item.vowel}/${item.pathFolder}/${item.name}.png" alt="opcion">`;
            div.onclick = () => procesarRespuesta(item.name, div);
            containerOpts.appendChild(div);
        });
        playVoice('toca_la_imagen_correcta');
    }
}

// CORRECCIÓN TOTAL DE DISPARO DE CAPAS
function dispararFeedbackFlash(esCorrecto) {
    const layerId = esCorrecto ? 'flash-correct' : 'flash-incorrect';
    const layer = document.getElementById(layerId);
    
    // Forzar render visible antes de la animación
    layer.classList.add('show-feedback');
    
    // Removerlo limpiamente después del efecto visual
    setTimeout(() => {
        layer.classList.remove('show-feedback');
    }, 900);
}

function procesarRespuesta(seleccion, elementoDom) {
    const preguntaActual = gameState.playlist[gameState.currentQuestionIndex];
    document.querySelectorAll('.vowel-option, .image-option').forEach(el => el.style.pointerEvents = 'none');

    if (seleccion === preguntaActual.correct) {
        gameState.score++;
        elementoDom.classList.add('correct-flash');
        AudioSynth.play('correcto');
        dispararFeedbackFlash(true); // Activa el Check ✅
        playVoice('muy_bien');
    } else {
        elementoDom.classList.add('incorrect-flash');
        AudioSynth.play('incorrecto');
        dispararFeedbackFlash(false); // Activa la X ❌
        playVoice('intenta_otra_vez');
    }

    gameState.currentQuestionIndex++;
    setTimeout(presentarPregunta, 1300);
}

function finalizarJuego() {
    document.getElementById('progress-text').textContent = `Progreso: 100%`;
    document.getElementById('progress-fill').style.width = `100%`;

    setTimeout(() => {
        document.getElementById('screen-game').classList.remove('active');
        document.getElementById('screen-reward').classList.add('active');
        document.getElementById('player-congrats-name').textContent = gameState.playerName;

        const starsContainer = document.getElementById('final-stars-container');
        starsContainer.innerHTML = "";
        let estrellas = gameState.score >= 8 ? 3 : (gameState.score >= 5 ? 2 : 1);

        for(let i=0; i<estrellas; i++) {
            starsContainer.innerHTML += "<span style='font-size:3.5rem; margin:0 4px;'>⭐</span>";
        }
        playVoice('excelente');
    }, 600);
}

function siguienteNivelDinamico() {
    document.getElementById('screen-reward').classList.remove('active');
    construirPartida();
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    document.getElementById('screen-game').classList.add('active');
    presentarPregunta();
}

function playVoice(filename) {
    if (!gameState.settings.voice) return;
    const voicePlayer = document.getElementById('voice-player');
    voicePlayer.src = `assets/audio/${filename}.mp3`;
    voicePlayer.play().catch(()=>{});
}

function toggleConfig() {
    document.getElementById('modal-config').classList.toggle('hidden');
}
function toggleCredits() {
    document.getElementById('modal-credits').classList.toggle('hidden');
}

function updateSettings() {
    gameState.settings.music = document.getElementById('cfg-music').checked;
    gameState.settings.sfx = document.getElementById('cfg-sfx').checked;
    gameState.settings.voice = document.getElementById('cfg-voice').checked;
    const bgM = document.getElementById('bg-music');
    if(!gameState.settings.music) bgM.pause(); else if(document.getElementById('screen-game').classList.contains('active')) bgM.play().catch(()=>{});
    localStorage.setItem('silabin_vocal_settings', JSON.stringify(gameState.settings));
}

function cargarAjustesDeLocalStorage() {
    const saved = localStorage.getItem('silabin_vocal_settings');
    if (saved) {
        gameState.settings = JSON.parse(saved);
        document.getElementById('cfg-music').checked = gameState.settings.music;
        document.getElementById('cfg-sfx').checked = gameState.settings.sfx;
        document.getElementById('cfg-voice').checked = gameState.settings.voice;
    }
}

function reiniciarProgreso() {
    localStorage.removeItem('silabin_vocal_settings');
    gameState.playerName = "";
    document.getElementById('name-display').textContent = "...";
    document.getElementById('difficulty-range').value = 0;
    document.getElementById('game-mode-selector').value = "aleatorio";
    gameState.dificultad = "facil";
    document.body.style.background = varString('--bg-facil');
    evaluarBotonInicio();
    
    document.getElementById('modal-config').classList.add('hidden');
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-reward').classList.remove('active');
    document.getElementById('screen-welcome').classList.add('active');
    
    const bgM = document.getElementById('bg-music');
    bgM.pause(); bgM.currentTime = 0;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(()=>{});
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(()=>{});
        }
    }
}