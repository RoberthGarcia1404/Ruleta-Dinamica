// Variable global para manejar los segmentos
let segments = [];
const STORAGE_KEY = 'ruletaPreguntasCustom';

// Datos por defecto si no hay nada en localStorage
const defaultSegments = [
    { number: "1", pregunta: "1. ¿Pregunta de ejemplo 1?", respuesta: "Respuesta 1", used: false },
    { number: "2", pregunta: "2. ¿Pregunta de ejemplo 2?", respuesta: "Respuesta 2", used: false },
    { number: "3", pregunta: "3. ¿Puedes añadir más?", respuesta: "¡Claro! Usa el menú.", used: false },
];

// Variable para almacenar el índice de la pregunta que se está editando
let editingIndex = null;

// Función para cargar las preguntas desde localStorage
function loadQuestions() {
    const storedSegments = localStorage.getItem(STORAGE_KEY);
    try {
        segments = storedSegments ? JSON.parse(storedSegments) : [...defaultSegments];
        // Asegurar que todas las preguntas no están marcadas como usadas inicialmente
        segments.forEach(s => s.used = false);
    } catch (e) {
        console.error("Error al parsear preguntas de localStorage, usando default:", e);
        segments = [...defaultSegments];
        segments.forEach(s => s.used = false);
    }
    // Si no hay segmentos, se usa por defecto
    if (segments.length === 0) {
        segments = [...defaultSegments];
        segments.forEach(s => s.used = false);
        saveQuestions();
    }
}

// Función para guardar las preguntas en localStorage
function saveQuestions() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(segments));
}

// Funciones para renderizar la lista de preguntas en el modal
function renderQuestionList() {
    const listElement = document.getElementById('questionList');
    listElement.innerHTML = '';
    if (!segments || segments.length === 0) {
        listElement.innerHTML = '<li>No hay preguntas añadidas.</li>';
        return;
    }
    segments.forEach((seg, index) => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
       <div>
         <span class="q-label">P${seg.number}:</span> ${seg.pregunta}
         <br>
         <span class="a-label">R:</span> ${seg.respuesta}
       </div>
       <button class="edit-btn" data-index="${index}">Editar</button>
       <button class="delete-btn" data-number="${seg.number}">Eliminar</button>
     `;
        listElement.appendChild(listItem);
    });
}

// Función para añadir una nueva pregunta
function addQuestion() {
    const questionInput = document.getElementById('newQuestion');
    const answerInput = document.getElementById('newAnswer');
    const questionText = questionInput.value.trim();
    const answerText = answerInput.value.trim();

    if (!questionText || !answerText) {
        alert("Por favor, introduce tanto la pregunta como la respuesta.");
        return;
    }

    // Encontrar el número más alto actual y sumar 1
    const maxNumber = segments.reduce((max, seg) => Math.max(max, parseInt(seg.number) || 0), 0);
    const newNumber = (maxNumber + 1).toString();

    const newSegment = {
        number: newNumber,
        pregunta: `${newNumber}. ${questionText}`,
        respuesta: answerText,
        used: false
    };

    segments.push(newSegment);
    saveQuestions();
    renderQuestionList();
    drawWheel();

    questionInput.value = '';
    answerInput.value = '';
}

// Función para editar una pregunta
function editQuestion(index) {
    const segment = segments[index];
    document.getElementById('editQuestion').value = segment.pregunta.replace(/\d+\.\s*/, '');
    document.getElementById('editAnswer').value = segment.respuesta;
    editingIndex = index;
    document.getElementById('editModal').classList.add('visible');
}

// Función para guardar los cambios editados
function saveEdit() {
    if (editingIndex === null) return;

    const questionInput = document.getElementById('editQuestion');
    const answerInput = document.getElementById('editAnswer');
    const questionText = questionInput.value.trim();
    const answerText = answerInput.value.trim();

    if (!questionText || !answerText) {
        alert("Por favor, introduce tanto la pregunta como la respuesta.");
        return;
    }

    segments[editingIndex].pregunta = `${segments[editingIndex].number}. ${questionText}`;
    segments[editingIndex].respuesta = answerText;

    saveQuestions();
    renderQuestionList();
    drawWheel();
    document.getElementById('editModal').classList.remove('visible');
    editingIndex = null;
}

// Función para borrar una pregunta
function deleteQuestion(numberToDelete) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la pregunta número ${numberToDelete}?`)) {
        return;
    }
    segments = segments.filter(seg => seg.number !== numberToDelete);
    saveQuestions();
    renderQuestionList();
    drawWheel();
}

// Reiniciar el estado 'used' de todas las preguntas
function resetUsedStatus() {
    segments.forEach(seg => seg.used = false);
    saveQuestions();
    alert("El estado 'usado' de todas las preguntas ha sido reiniciado.");
    drawWheel();
}

// Obtener los segmentos disponibles (no usados) ordenados
function getAvailableSegments() {
    return segments.filter(seg => !seg.used)
        .sort((a, b) => parseInt(a.number) - parseInt(b.number));
}

// Dibujar la ruleta con los segmentos disponibles
function drawWheel() {
    const avail = getAvailableSegments();
    const n = avail.length;
    const svgNS = "http://www.w3.org/2000/svg";
    while (wheelEl.firstChild) { wheelEl.removeChild(wheelEl.firstChild); }
    const cx = 150, cy = 150, r = 150;
    if (n === 0) {
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", cx);
        text.setAttribute("y", cy);
        text.setAttribute("font-size", "16");
        text.setAttribute("font-weight", "500");
        text.setAttribute("fill", "var(--text-secondary)");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.textContent = "Añade preguntas";
        wheelEl.appendChild(text);
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", cx);
        circle.setAttribute("cy", cy);
        circle.setAttribute("r", r - 1);
        circle.setAttribute("fill", "var(--system-gray-light)");
        circle.setAttribute("stroke", "var(--system-gray-border)");
        circle.setAttribute("stroke-width", "1");
        wheelEl.insertBefore(circle, text);
        return;
    }

    const anglePerSegment = 360 / n;
    const fillColor1 = getComputedStyle(document.documentElement).getPropertyValue('--system-gray-light').trim() || '#f2f2f7';
    const fillColor2 = getComputedStyle(document.documentElement).getPropertyValue('--system-gray-medium').trim() || '#e5e5ea';
    const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim() || '#1d1d1f';
    const strokeColor = getComputedStyle(document.documentElement).getPropertyValue('--system-gray-border').trim() || 'rgba(30, 30, 30, 0.125)';

    for (let i = 0; i < n; i++) {
        const startAngle = anglePerSegment * i - 90;
        const endAngle = anglePerSegment * (i + 1) - 90;
        const startX = cx + r * Math.cos(startAngle * Math.PI / 180);
        const startY = cy + r * Math.sin(startAngle * Math.PI / 180);
        const endX = cx + r * Math.cos(endAngle * Math.PI / 180);
        const endY = cy + r * Math.sin(endAngle * Math.PI / 180);
        const largeArcFlag = anglePerSegment > 180 ? 1 : 0;
        const pathData = `M ${cx},${cy} L ${startX},${startY} A ${r},${r} 0 ${largeArcFlag} 1 ${endX},${endY} Z`;
        const path = document.createElementNS(svgNS, "path");
        const fill = (i % 2 === 0) ? fillColor1 : fillColor2;
        path.setAttribute("d", pathData);
        path.setAttribute("fill", fill);
        path.setAttribute("stroke", strokeColor);
        path.setAttribute("stroke-width", "0.5");
        path.setAttribute("id", "seg-" + avail[i].number);
        wheelEl.appendChild(path);

        const textAngle = startAngle + anglePerSegment / 2;
        const textRadius = r * 0.78;
        const textX = cx + textRadius * Math.cos(textAngle * Math.PI / 180);
        const textY = cy + textRadius * Math.sin(textAngle * Math.PI / 180);
        const text = document.createElementNS(svgNS, "text");
        text.setAttribute("x", textX);
        text.setAttribute("y", textY);
        text.setAttribute("font-size", "22");
        text.setAttribute("font-weight", "500");
        text.setAttribute("fill", textColor);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.textContent = avail[i].number;
        wheelEl.appendChild(text);
    }
}

let currentRotation = 0;
let spinning = false;
let preguntaSeleccionada = null;

const wheelEl = document.getElementById("wheel");
const spinButton = document.getElementById("spinButton");
const fullscreenButton = document.getElementById("fullscreenButton");
const banner = document.getElementById("banner");
const bannerPregunta = document.getElementById("bannerPregunta");
const bannerRespuesta = document.getElementById("bannerRespuesta");
const bannerAnswerButton = document.getElementById("bannerAnswerButton");
const closeBanner = document.getElementById("closeBanner");
const selectedNumberEl = document.getElementById("selectedNumber");

// Elementos del Modal
const manageButton = document.getElementById('manageButton');
const manageModal = document.getElementById('manageModal');
const closeModalButton = document.getElementById('closeModalButton');
const addQuestionButton = document.getElementById('addQuestionButton');
const questionListElement = document.getElementById('questionList');
const resetUsedBtn = document.getElementById('resetUsedButton');
// Elementos para la personalización
const changeTitleButton = document.getElementById('changeTitleButton');
const shareButton = document.getElementById('shareButton');
const shareLinkInput = document.getElementById('shareLink');
// Elementos del Modal de Edición
const editModal = document.getElementById('editModal');
const closeEditModalButton = document.getElementById('closeEditModalButton');
const saveEditButton = document.getElementById('saveEditButton');

// Función para girar la ruleta
function spinWheel() {
    if (spinning) return;
    const avail = getAvailableSegments();
    if (avail.length === 0) {
        alert("¡Felicidades! Has respondido todas las preguntas. Puedes reiniciar el estado 'usado' o añadir más preguntas en el menú.");
        return;
    }

    spinning = true;
    spinButton.disabled = true;
    banner.classList.remove('visible');
    bannerRespuesta.textContent = "";
    selectedNumberEl.classList.remove('visible');

    const n = avail.length;
    const anglePerSegment = 360 / n;

    const chosenIndex = Math.floor(Math.random() * n);
    const chosenSegment = avail[chosenIndex];

    const currentVisualRotation = currentRotation % 360;
    const centerAngleSVG = anglePerSegment * chosenIndex + anglePerSegment / 2 - 90;
    const targetAngle = (360 - centerAngleSVG + 360) % 360;
    const rotationNeeded = (targetAngle - currentVisualRotation + 360) % 360;
    const randomExtraRotation = Math.random() * 360;
    const totalRotation = (5 * 360) + rotationNeeded + randomExtraRotation;
    currentRotation += totalRotation;
    wheelEl.style.transform = `rotate(${currentRotation}deg)`;

    setTimeout(() => {
        const originalIndex = segments.findIndex(seg => seg.number === chosenSegment.number);
        if (originalIndex !== -1) {
            segments[originalIndex].used = true;
        } else {
            console.error("Error: Índice original no encontrado.");
        }

        selectedNumberEl.textContent = chosenSegment.number;
        selectedNumberEl.classList.add('visible');
        preguntaSeleccionada = chosenSegment;
        bannerPregunta.textContent = chosenSegment.pregunta;
        banner.classList.add('visible');
        spinning = false;
        spinButton.disabled = false;

        setTimeout(() => {
            drawWheel();
            wheelEl.style.transition = 'none';
            const finalTargetAngle = (360 - centerAngleSVG + 360) % 360;
            wheelEl.style.transform = `rotate(${finalTargetAngle}deg)`;
            void wheelEl.offsetWidth;
            wheelEl.style.transition = 'transform 4s cubic-bezier(0.33, 1, 0.68, 1)';
            currentRotation = finalTargetAngle;
        }, 800);

    }, 4000);
}

// Mostrar la respuesta en el banner
function mostrarRespuesta() {
    if (preguntaSeleccionada) {
        bannerRespuesta.textContent = preguntaSeleccionada.respuesta;
    }
}

// Activar o desactivar pantalla completa
function activarPantallaCompleta() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error(`Error pantalla completa: ${err.message} (${err.name})`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
}

// Cerrar el banner
closeBanner.addEventListener("click", () => { banner.classList.remove('visible'); });
spinButton.addEventListener("click", spinWheel);
bannerAnswerButton.addEventListener("click", mostrarRespuesta);
fullscreenButton.addEventListener("click", activarPantallaCompleta);

// Abrir el Modal
manageButton.addEventListener('click', () => {
    renderQuestionList();
    manageModal.classList.add('visible');
});
// Cerrar el Modal
closeModalButton.addEventListener('click', () => {
    manageModal.classList.remove('visible');
    drawWheel();
});
manageModal.addEventListener('click', (event) => {
    if (event.target === manageModal) {
        manageModal.classList.remove('visible');
        drawWheel();
    }
});
addQuestionButton.addEventListener('click', addQuestion);
resetUsedBtn.addEventListener('click', resetUsedStatus);
questionListElement.addEventListener('click', (event) => {
    if (event.target.classList.contains('delete-btn')) {
        const numberToDelete = event.target.getAttribute('data-number');
        deleteQuestion(numberToDelete);
    } else if (event.target.classList.contains('edit-btn')) {
        const indexToEdit = event.target.getAttribute('data-index');
        editQuestion(indexToEdit);
    }
});

// Abrir el Modal de Edición
saveEditButton.addEventListener('click', saveEdit);
closeEditModalButton.addEventListener('click', () => {
    editModal.classList.remove('visible');
    editingIndex = null;
});
editModal.addEventListener('click', (event) => {
    if (event.target === editModal) {
        editModal.classList.remove('visible');
        editingIndex = null;
    }
});

// Funcionalidad para cambiar el título
changeTitleButton.addEventListener('click', () => {
    const newTitle = document.getElementById('newTitle').value.trim();
    if (newTitle) {
        document.querySelector('.container h1').textContent = newTitle;
        localStorage.setItem('ruletaTitle', newTitle);
    } else {
        alert("Por favor, ingresa un título válido.");
    }
});

// Funcionalidad para compartir la ruleta
shareButton.addEventListener('click', () => {
    const ruletaData = {
        title: document.querySelector('.container h1').textContent,
        segments: segments
    };
    const encodedData = encodeURIComponent(JSON.stringify(ruletaData));
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = baseUrl + "?data=" + encodedData;
    navigator.clipboard.writeText(shareUrl).then(() => {
        shareLinkInput.style.display = "block";
        shareLinkInput.value = shareUrl;
        alert("¡Enlace copiado al portapapeles!");
    }).catch(err => {
        alert("No se pudo copiar el enlace: " + err);
    });
});

// Cargar datos desde un enlace compartido (si existe el parámetro "data")
function loadFromUrl() {
    const params = new URLSearchParams(window.location.search);
    if (params.has("data")) {
        try {
            const data = JSON.parse(decodeURIComponent(params.get("data")));
            if (data.title) {
                document.querySelector('.container h1').textContent = data.title;
                localStorage.setItem('ruletaTitle', data.title);
            }
            if (data.segments) {
                segments = data.segments;
                saveQuestions();
                renderQuestionList();
                drawWheel();
            }
        } catch (e) {
            console.error("Error cargando datos desde URL", e);
        }
    }
}

// Al iniciar, cargar título almacenado (si existe)
const storedTitle = localStorage.getItem('ruletaTitle');
if (storedTitle) {
    document.querySelector('.container h1').textContent = storedTitle;
}

// Inicialización
loadFromUrl();
loadQuestions();
drawWheel();
