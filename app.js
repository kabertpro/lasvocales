// BANCO DE DATOS CONFIGURADO SEGÚN PARÁMETROS
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

// ESTADO DE LA APLICACIÓN
let gameState = {
    playerName: "",
    dificultad: "facil",
    currentQuestionIndex: 0,
    totalQuestions: 10,
    score: 0,
    playlist: [], // Almacenará los ítems estructurados de la partida actual
    settings: { music: true, sfx: true, voice: true }
};

// INICIALIZADOR AL CARGAR LA PÁGINA
window.addEventListener('DOMContentLoaded', () => {
    generarTecladoInfantil();
    cargarAjustesDeLocalStorage();
});

// GENERADOR DE TECLADO INTERNO NATIVO
function generarTecladoInfantil() {
    const keyboardContainer = document.getElementById('kid-keyboard');
    const alfabeto = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ".split("");
    
    keyboardContainer.innerHTML = "";
    alfabeto.forEach(letra => {
        const btn = document.createElement('button');
        btn.textContent = letra;
        btn.className = "key-btn";
        btn.onclick = () => { appendLetra(letra); playSFX('pop'); };
        keyboardContainer.appendChild(btn);
    });

    // Botón de borrar integrado al diseño
    const btnDel = document.createElement('button');
    btnDel.textContent = "⌫";
    btnDel.className = "key-btn key-del";
    btnDel.onclick = () => { borrarLetra(); playSFX('pop'); };
    keyboardContainer.appendChild(btnDel);
}

function appendLetra(l) {
    if (gameState.playerName.length < 12) {
        gameState.playerName += l;
        document.getElementById('name-display').textContent = gameState.playerName;
        evaluarBotonInicio();
    }
}

function borrarLetra() {
    gameState.playerName = gameState.playerName.slice(0, -1);
    document.getElementById('name-display').textContent = gameState.playerName || "Escribe tu nombre...";
    evaluarBotonInicio();
}

function evaluarBotonInicio() {
    const btn = document.getElementById('btn-start');
    if (gameState.playerName.trim().length >= 2) {
        btn.classList.remove('locked');
    } else {
        btn.classList.add('locked');
    }
}

function setDificultad(dif) {
    gameState.dificultad = dif;
    document.getElementById('btn-dif-facil').classList.toggle('active', dif === 'facil');
    document.getElementById('btn-dif-dificil').classList.toggle('active', dif === 'dificil');
    playSFX('button');
}

// GENERACIÓN DINÁMICA DE PARTIDAS (CERO MEMORIZACIÓN)
function construirPartida() {
    let poolCompleto = [];
    const vocales = ['A', 'E', 'I', 'O', 'U'];

    // Unir elementos en base a la dificultad seleccionada
    vocales.forEach(v => {
        BANCO_VOCALES[v][gameState.dificultad].forEach(item => {
            poolCompleto.push({ name: item, vowel: v });
        });
    });

    // Mezclar aleatoriamente el pool general
    poolCompleto.sort(() => Math.random() - 0.5);

    // Seleccionar de 10 a 12 preguntas por sesión dinámica para evitar fatiga cognitiva infantil
    const totalPreguntasPartida = Math.min(12, poolCompleto.length);
    gameState.playlist = [];

    for (let i = 0; i < totalPreguntasPartida; i++) {
        let itemActual = poolCompleto[i];
        let modoPregunta = Math.random() > 0.5 ? 1 : 2; // Alternancia balanceada de mecánicas de juego

        if (modoPregunta === 1) {
            // MODO 1: ¿Con qué vocal empieza? -> 1 Imagen, 3 letras opciones
            let opcionesLetras = [itemActual.vowel];
            while (opcionesLetras.length < 3) {
                let rVocal = vocales[Math.floor(Math.random() * 5)];
                if (!opcionesLetras.includes(rVocal)) opcionesLetras.push(rVocal);
            }
            opcionesLetras.sort(() => Math.random() - 0.5);

            gameState.playlist.push({
                modo: 1,
                target: itemActual,
                options: opcionesLetras,
                correct: itemActual.vowel
            });
        } else {
            // MODO 2: ¿Cuál imagen empieza con X?
            let opcionesImagenes = [itemActual];
            while (opcionesImagenes.length < 3) {
                let rItem = poolCompleto[Math.floor(Math.random() * poolCompleto.length)];
                // Evitar repetir la misma vocal inicial o el mismo item gráfico
                if (!opcionesImagenes.some(o => o.vowel === rItem.vowel) && rItem.name !== itemActual.name) {
                    opcionesImagenes.push(rItem);
                }
            }
            opcionesImagenes.sort(() => Math.random() - 0.5);

            gameState.playlist.push({
                modo: 2,
                target: itemActual, // La pista correcta es la vocal de itemActual
                options: opcionesImagenes,
                correct: itemActual.name
            });
        }
    }
    gameState.totalQuestions = gameState.playlist.length;
}

// FLUJO DE JUEGO
function iniciarJuego() {
    if (gameState.playerName.trim().length < 2) return;
    
    construirPartida();
    gameState.currentQuestionIndex = 0;
    gameState.score = 0;
    
    document.getElementById('screen-welcome').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
    
    if(gameState.settings.music) {
        const bgM = document.getElementById('bg-music');
        bgM.volume = 0.3;
        bgM.play().catch(()=>{});
    }

    playVoice('bienvenido');
    setTimeout(presentarPregunta, 1200);
}

function presentarPregunta() {
    if (gameState.currentQuestionIndex >= gameState.totalQuestions) {
        finalizarJuego();
        return;
    }

    // Actualizar barra e indicadores visuales
    document.getElementById('progress-text').textContent = `${gameState.currentQuestionIndex + 1} / ${gameState.totalQuestions}`;
    document.getElementById('progress-fill').style.width = `${((gameState.currentQuestionIndex) / gameState.totalQuestions) * 100}%`;
    document.getElementById('stars-count').textContent = gameState.score;

    const preguntaActual = gameState.playlist[gameState.currentQuestionIndex];

    if (preguntaActual.modo === 1) {
        document.getElementById('game-question-text').textContent = "¿Con qué vocal empieza?";
        document.getElementById('mode-1-container').classList.remove('hidden');
        document.getElementById('mode-2-container').classList.add('hidden');

        document.getElementById('m1-target-img').src = `assets/images/${preguntaActual.target.vowel}/${preguntaActual.target.name}.png`;
        
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
            div.innerHTML = `<img src="assets/images/${item.vowel}/${item.name}.png" alt="opcion">`;
            div.onclick = () => procesarRespuesta(item.name, div);
            containerOpts.appendChild(div);
        });

        playVoice('toca_la_imagen_correcta');
    }
}

function procesarRespuesta(seleccion, elementoDom) {
    const preguntaActual = gameState.playlist[gameState.currentQuestionIndex];
    // Deshabilitar clicks temporales para asegurar flujo ordenado
    document.querySelectorAll('.vowel-option, .image-option').forEach(el => el.style.pointerEvents = 'none');

    if (seleccion === preguntaActual.correct) {
        gameState.score++;
        elementoDom.classList.add('correct-flash');
        playSFX('correcto');
        
        // Feedbacks aleatorios motivacionales nativos
        const motivaciones = ['muy_bien', 'excelente', 'correcto', 'fantastico', 'eres_increible'];
        const rVoz = motivaciones[Math.floor(Math.random() * motivaciones.length)];
        setTimeout(() => playVoice(rVoz), 600);

    } else {
        elementoDom.classList.add('incorrect-flash');
        playSFX('incorrecto');
        
        const reintentos = ['intenta_otra_vez', 'casi_lo_logras', 'piensa_con_calma'];
        const rVoz = reintentos[Math.floor(Math.random() * reintentos.length)];
        setTimeout(() => playVoice(rVoz), 600);
    }

    gameState.currentQuestionIndex++;
    setTimeout(presentarPregunta, 2500);
}

function finalizarJuego() {
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-reward').classList.add('active');
    document.getElementById('player-congrats-name').textContent = gameState.playerName;

    // Renderizado dinámico de estrellas ganadas
    const starsContainer = document.getElementById('final-stars-container');
    starsContainer.innerHTML = "";
    
    let totalEstrellas = 1;
    if(gameState.score === gameState.totalQuestions) totalEstrellas = 3;
    else if(gameState.score >= gameState.totalQuestions / 2) totalEstrellas = 2;

    for(let i=0; i<totalEstrellas; i++) {
        starsContainer.innerHTML += "<span style='font-size:3.5rem; margin:0 5px;'>⭐</span>";
    }

    playSFX('confeti');
    playVoice('lo_lograste');
}

function regresarAlMenu() {
    document.getElementById('screen-reward').classList.remove('active');
    document.getElementById('screen-welcome').classList.add('active');
    playSFX('sparkle');
}

// CONTROL DE RECURSOS DE AUDIO INTEGRADOS
function playSFX(key) {
    if (!gameState.settings.sfx) return;
    // Usamos síntesis interna o hilos específicos si existieran archivos, o mapeo por canal de efectos
    const player = document.getElementById('sfx-player');
    // Mapeo controlado si cuentas con audios de efectos, alternativamente usamos feedback nativo visual seguro.
}

function playVoice(filename) {
    if (!gameState.settings.voice) return;
    const voicePlayer = document.getElementById('voice-player');
    voicePlayer.src = `assets/audio/${filename}.mp3`;
    voicePlayer.play().catch(()=>{});
}

// UTILIDADES Y MODALES DE CONFIGURACIÓN
function toggleConfig() {
    document.getElementById('modal-config').classList.toggle('hidden');
    playSFX('button');
}

function toggleCredits() {
    document.getElementById('modal-credits').classList.toggle('hidden');
    playSFX('button');
}

function updateSettings() {
    gameState.settings.music = document.getElementById('cfg-music').checked;
    gameState.settings.sfx = document.getElementById('cfg-sfx').checked;
    gameState.settings.voice = document.getElementById('cfg-voice').checked;

    const bgM = document.getElementById('bg-music');
    if (!gameState.settings.music) {
        bgM.pause();
    } else if (document.getElementById('screen-game').classList.contains('active')) {
        bgM.play().catch(()=>{});
    }
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
    document.getElementById('name-display').textContent = "Escribe tu nombre...";
    evaluarBotonInicio();
    toggleConfig();
    regresarAlMenu();
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(()=>{});
    } else {
        document.exitFullscreen();
    }
}