// app.js - CÓDIGO COMPLETO CON TODO FUNCIONAL

// ============================================
// 1. SCROLL INFINITO (código original)
// ============================================
const NUM_RESULTS = 6;
let page = 0;
let loading = false;

async function loadMore() {
    if (loading) return;

    loading = true;
    page++;

    // Mostrar spinner
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) spinner.style.display = 'flex';

    try {
        const from = page * NUM_RESULTS;
        const to = from + NUM_RESULTS;
        let url = window.location.pathname + window.location.search;

        url += url.includes('?') ? `&from=${from}&to=${to}` : `?from=${from}&to=${to}`;

        const response = await fetch(url);
        const html = await response.text();

        if (html.trim()) {
            document.getElementById("videogamesContainer").innerHTML += html;
        } else {
            if (spinner) spinner.innerHTML = '<p class="text-muted">Fin</p>';
        }
    } finally {
        // Ocultar spinner después
        setTimeout(() => {
            if (spinner) spinner.style.display = 'none';
            loading = false;
        }, 300);
    }
}

// Scroll simple
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        loadMore();
    }
});

// ============================================
// 2. VALIDACIÓN DE FORMULARIO DE CREACIÓN
// ============================================
function initCreateValidation() {
    const form = document.getElementById('createForm');
    if (!form) return;

    const els = {
        title: document.getElementById('inputName'),
        description: document.getElementById('inputDescription'),
        price: document.getElementById('inputPrice'),
        platform: document.getElementById('inputPlatform'),
        year: document.getElementById('inputYear'),
        developer: document.getElementById('inputStudio'),
        trailer: document.getElementById('inputTrailer'),
        image: document.getElementById('image')
    };

    function showError(fieldKey, msg) {
        const el = document.getElementById('error-' + fieldKey);
        if (el) el.textContent = msg || '';

        const fieldEl = els[fieldKey];
        if (!fieldEl) return;
        const boxId = 'error-box-' + fieldKey;
        let box = document.getElementById(boxId);

        if (!msg) {
            if (box) box.remove();
            return;
        }

        if (!box) {
            box = document.createElement('div');
            box.id = boxId;
            box.className = 'error-box';
            fieldEl.parentNode.insertBefore(box, fieldEl);
        }
        box.textContent = msg;
    }

    function clearError(fieldKey) { showError(fieldKey, '') }

    // Local validators
    function validateTitle(value) {
        if (!value) return 'El nombre es obligatorio.';
        if (!/^[A-ZÁÉÍÓÚÑ].*/.test(value)) return 'El nombre debe comenzar con mayúscula.';
        return '';
    }

    function validateDescription(value) {
        if (!value) return 'La descripción es obligatoria.';
        if (value.length < 20) return 'La descripción debe tener entre 20 y 350 caracteres.';
        if (value.length > 350) return 'La descripción debe tener entre 20 y 350 caracteres.';
        return '';
    }

    function validatePrice(value) {
        if (!value) return 'El precio es obligatorio.';
        if (isNaN(Number(value))) return 'El precio debe ser un numero valido';
        return '';
    }

    function validateYear(value) {
        const actual = new Date().getFullYear();
        const y = parseInt(value, 10);
        if (!value) return 'El año es obligatorio.';
        if (isNaN(y) || y < 1950 || y > actual + 1) return 'El año no puede ser inferior a 1950 ni superior al año que viene';
        return '';
    }

    function validateDeveloper(value) {
        if (!value) return 'El Estudio debe ser un nombre escrito con letras';
        return '';
    }

    function validateTrailer(value) {
        if (!value) return 'El trailer es obligatorio.';
        if (!/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/.test(value)) return 'El trailer debe ser una URL de YouTube';
        return '';
    }

    // Attach live validation
    if (els.title) els.title.addEventListener('input', (e) => {
        clearError('title');
        const msg = validateTitle(e.target.value.trim());
        if (msg) showError('title', msg);
    });

    if (els.description) els.description.addEventListener('input', (e) => {
        clearError('description');
        const msg = validateDescription(e.target.value.trim());
        if (msg) showError('description', msg);
    });

    if (els.price) els.price.addEventListener('input', (e) => {
        clearError('price');
        const msg = validatePrice(e.target.value);
        if (msg) showError('price', msg);
    });

    if (els.year) els.year.addEventListener('input', (e) => {
        clearError('year');
        const msg = validateYear(e.target.value);
        if (msg) showError('year', msg);
    });

    if (els.developer) els.developer.addEventListener('input', (e) => {
        clearError('developer');
        const msg = validateDeveloper(e.target.value.trim());
        if (msg) showError('developer', msg);
    });

    if (els.trailer) els.trailer.addEventListener('input', (e) => {
        clearError('trailer');
        const msg = validateTrailer(e.target.value.trim());
        if (msg) showError('trailer', msg);
    });

    // Map server error messages to fields
    function mapServerErrorToField(errorMsg) {
        const msg = (errorMsg || '').toLowerCase();
        if (msg.includes('nombre') || msg.includes('ya existe')) return 'title';
        if (msg.includes('descripción') || msg.includes('descripcion')) return 'description';
        if (msg.includes('precio')) return 'price';
        if (msg.includes('año') || msg.includes('ano')) return 'year';
        if (msg.includes('estudio')) return 'developer';
        if (msg.includes('trailer')) return 'trailer';
        return null;
    }

    // On submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Clear previous errors
        ['title', 'description', 'price', 'platform', 'year', 'developer', 'trailer'].forEach(clearError);

        const formData = new FormData(form);
        const genres = [];
        form.querySelectorAll('input[name="genres[]"]:checked').forEach(cb => genres.push(cb.value));

        const payload = {
            id: formData.get('id') || null,
            title: formData.get('title') || '',
            description: formData.get('description') || '',
            price: formData.get('price') || '',
            platform: formData.get('platform') || '',
            year: formData.get('year') || '',
            developer: formData.get('developer') || '',
            genres: genres,
            trailer: formData.get('trailer') || ''
        };

        // Run local validation first
        const localErrors = [];
        const t = validateTitle(payload.title);
        if (t) { localErrors.push(t); showError('title', t); }
        const d = validateDescription(payload.description);
        if (d) { localErrors.push(d); showError('description', d); }
        const p = validatePrice(payload.price);
        if (p) { localErrors.push(p); showError('price', p); }
        const y = validateYear(payload.year);
        if (y) { localErrors.push(y); showError('year', y); }
        const dev = validateDeveloper(payload.developer);
        if (dev) { localErrors.push(dev); showError('developer', dev); }
        const tr = validateTrailer(payload.trailer);
        if (tr) { localErrors.push(tr); showError('trailer', tr); }

        if (localErrors.length > 0) {
            return;
        }

        try {
            const resp = await fetch('/create/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (resp.ok) {
                const json = await resp.json();
                if (json.ok) {
                    form.submit();
                    return;
                }
            }

            const data = await resp.json().catch(() => ({ errors: ['Error de validación en el servidor'] }));
            const errors = data.errors || ['Error de validación en el servidor'];

            errors.forEach(err => {
                const field = mapServerErrorToField(err);
                if (field) showError(field, err);
                else {
                    showError('title', err);
                }
            });

        } catch (err) {
            console.error('Validation request failed', err);
            showError('title', 'No se pudo validar en el servidor. Intenta de nuevo.');
        }
    });
}

// ============================================
// 3. COMENTARIOS (nuevo código)
// ============================================
function initCommentValidation() {
    const form = document.querySelector('form[action*="/comment"]');
    if (!form) return;

    const userName = document.getElementById('userName');
    const reviewText = document.getElementById('reviewText');
    const ratingInputs = form.querySelectorAll('input[name="rating"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!userName || !reviewText || !submitBtn) return;

    // Crear modal de éxito para nuevos comentarios
    if (!document.getElementById('commentSuccessModal')) {
        const modalHTML = `
        <div class="modal fade" id="commentSuccessModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark text-light">
                    <div class="modal-header border-success">
                        <h5 class="modal-title text-success">
                            <i class="bi bi-check-circle-fill me-2"></i>¡Comentario añadido!
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>Tu comentario se ha añadido correctamente.</p>
                    </div>
                    <div class="modal-footer border-success">
                        <button type="button" class="btn btn-success" id="reloadPageBtn">Ver comentarios</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('reloadPageBtn')?.addEventListener('click', function () {
            window.location.reload();
        });
    }

    // Crear modal de edición de comentarios
    if (!document.getElementById('editCommentModal')) {
        const editModalHTML = `
        <div class="modal fade" id="editCommentModal" tabindex="-1">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content bg-dark text-light">
                    <div class="modal-header border-warning">
                        <h5 class="modal-title text-warning">
                            <i class="bi bi-pencil-fill me-2"></i>Editar comentario
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <form id="editCommentForm">
                            <input type="hidden" id="editGameId">
                            <input type="hidden" id="editCommentId">
                            
                            <div class="mb-3">
                                <label class="form-label">Tu valoración</label>
                                <div class="rating-input d-flex flex-row-reverse justify-content-start">
                                    <input type="radio" name="editRating" id="editStar5" value="5">
                                    <label for="editStar5">★</label>
                                    <input type="radio" name="editRating" id="editStar4" value="4">
                                    <label for="editStar4">★</label>
                                    <input type="radio" name="editRating" id="editStar3" value="3">
                                    <label for="editStar3">★</label>
                                    <input type="radio" name="editRating" id="editStar2" value="2">
                                    <label for="editStar2">★</label>
                                    <input type="radio" name="editRating" id="editStar1" value="1">
                                    <label for="editStar1">★</label>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="editCommentText" class="form-label">Tu comentario</label>
                                <textarea class="form-control" id="editCommentText" rows="4" maxlength="500"></textarea>
                                <div class="text-muted small mt-1" id="editCharCounter">0/500</div>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer border-warning">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-warning" id="saveEditBtn">Guardar cambios</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', editModalHTML);
    }

    // Elementos de error para nuevos comentarios
    const userNameError = document.createElement('div');
    userNameError.className = 'text-danger small mt-1';
    userNameError.style.display = 'none';
    userName.parentNode.appendChild(userNameError);

    const reviewTextError = document.createElement('div');
    reviewTextError.className = 'text-danger small mt-1';
    reviewTextError.style.display = 'none';
    reviewText.parentNode.appendChild(reviewTextError);

    const ratingError = document.createElement('div');
    ratingError.className = 'text-danger small mt-2';
    ratingError.style.display = 'none';

    if (ratingInputs.length > 0) {
        const ratingContainer = ratingInputs[0].parentNode;
        if (ratingContainer) {
            ratingContainer.parentNode.appendChild(ratingError);
        }
    }

    // Contador de caracteres para nuevo comentario
    const charCounter = document.createElement('div');
    charCounter.className = 'text-muted small mt-1';
    charCounter.textContent = '0/500';
    reviewText.parentNode.appendChild(charCounter);

    // Contador de caracteres para edición
    const editCharCounter = document.getElementById('editCharCounter');
    const editCommentText = document.getElementById('editCommentText');

    if (editCommentText && editCharCounter) {
        editCommentText.addEventListener('input', function () {
            editCharCounter.textContent = `${this.value.length}/500`;
        });
    }

    // Event listeners para nuevo comentario
    userName.addEventListener('input', () => {
        userNameError.style.display = 'none';
    });

    userName.addEventListener('blur', () => {
        const name = userName.value.trim();
        if (name.length < 5) {
            userNameError.textContent = 'El nombre debe tener al menos 5 caracteres';
            userNameError.style.display = 'block';
        } else if (name.length > 30) {
            userNameError.textContent = 'El nombre no puede superar los 30 caracteres';
            userNameError.style.display = 'block';
        }
    });

    reviewText.addEventListener('input', () => {
        reviewTextError.style.display = 'none';
        charCounter.textContent = `${reviewText.value.length}/500`;

        if (reviewText.value.length > 500) {
            charCounter.classList.add('text-danger');
            charCounter.classList.remove('text-muted');
        } else {
            charCounter.classList.remove('text-danger');
            charCounter.classList.add('text-muted');
        }
    });

    reviewText.addEventListener('blur', () => {
        const text = reviewText.value.trim();
        if (text.length < 10) {
            reviewTextError.textContent = 'El comentario debe tener al menos 10 caracteres';
            reviewTextError.style.display = 'block';
        } else if (text.length > 500) {
            reviewTextError.textContent = 'El comentario no puede superar 500 caracteres';
            reviewTextError.style.display = 'block';
        }
    });

    ratingInputs.forEach(input => {
        input.addEventListener('change', () => {
            ratingError.style.display = 'none';
        });
    });

    // Manejador para NUEVO comentario
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validar
        let hasErrors = false;

        // Nombre
        const name = userName.value.trim();
        if (name.length < 5) {
            userNameError.textContent = 'El nombre debe tener al menos 5 caracteres';
            userNameError.style.display = 'block';
            hasErrors = true;
        } else if (name.length > 30) {
            userNameError.textContent = 'El nombre no puede superar los 30 caracteres';
            userNameError.style.display = 'block';
            hasErrors = true;
        }

        // Comentario
        const text = reviewText.value.trim();
        if (text.length < 10) {
            reviewTextError.textContent = 'El comentario debe tener al menos 10 caracteres';
            reviewTextError.style.display = 'block';
            hasErrors = true;
        } else if (text.length > 500) {
            reviewTextError.textContent = 'El comentario no puede superar 500 caracteres';
            reviewTextError.style.display = 'block';
            hasErrors = true;
        }

        // Rating
        let ratingSelected = false;
        ratingInputs.forEach(input => {
            if (input.checked) ratingSelected = true;
        });

        if (!ratingSelected) {
            ratingError.textContent = 'Debes seleccionar una valoración';
            ratingError.style.display = 'block';
            hasErrors = true;
        }

        if (hasErrors) return;

        // Mostrar loading
        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';

        try {
            // Enviar datos
            const params = new URLSearchParams();
            params.append('userName', userName.value);
            params.append('reviewText', reviewText.value);
            params.append('rating', Array.from(ratingInputs).find(r => r.checked)?.value || '5');

            const response = await fetch(form.action, {
                method: 'POST',
                body: params,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const jsonData = await response.json();

            if (jsonData.success) {
                // Mostrar modal de éxito
                const successModal = new bootstrap.Modal(document.getElementById('commentSuccessModal'));
                successModal.show();

                // Limpiar formulario
                userName.value = '';
                reviewText.value = '';
                ratingInputs.forEach(input => input.checked = false);
                charCounter.textContent = '0/500';

            } else {
                alert('Error: ' + (jsonData.errors?.join(', ') || 'Error desconocido'));
            }

        } catch (error) {
            alert('Error: No se pudo enviar el comentario');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // Inicializar contador
    charCounter.textContent = `${reviewText.value.length}/500`;

    // Configurar botón para guardar edición
    document.getElementById('saveEditBtn')?.addEventListener('click', saveEditedComment);
}

// Función para abrir modal de edición (global)
function openEditModal(gameId, commentId, userName, commentText, stars) {
    // Guardar IDs
    document.getElementById('editGameId').value = gameId;
    document.getElementById('editCommentId').value = commentId;

    // Establecer texto del comentario
    document.getElementById('editCommentText').value = commentText;
    document.getElementById('editCharCounter').textContent = `${commentText.length}/500`;

    // Establecer rating
    const ratingInputs = document.querySelectorAll('input[name="editRating"]');
    ratingInputs.forEach(input => {
        input.checked = parseInt(input.value) === stars;
    });

    // Mostrar modal
    const editModal = new bootstrap.Modal(document.getElementById('editCommentModal'));
    editModal.show();
}

// Función para guardar comentario editado (global)
async function saveEditedComment() {
    const gameId = document.getElementById('editGameId').value;
    const commentId = document.getElementById('editCommentId').value;
    const commentText = document.getElementById('editCommentText').value.trim();
    const ratingInput = document.querySelector('input[name="editRating"]:checked');
    const stars = ratingInput ? ratingInput.value : '0';

    if (!commentText || commentText.length < 10) {
        alert('El comentario debe tener al menos 10 caracteres');
        return;
    }

    if (commentText.length > 500) {
        alert('El comentario no puede superar 500 caracteres');
        return;
    }

    if (!ratingInput) {
        alert('Debes seleccionar una valoración');
        return;
    }

    const saveBtn = document.getElementById('saveEditBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

    try {
        // Enviar datos de edición
        const params = new URLSearchParams();
        params.append('reviewText', commentText);
        params.append(`rating-${commentId}`, stars);

        const response = await fetch(`/detail/${gameId}/comment/${commentId}/edit`, {
            method: 'POST',
            body: params,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            // Actualizar el comentario en la página SIN recargar
            updateCommentInPage(commentId, commentText, parseInt(stars));

            // Cerrar modal
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editCommentModal'));
            editModal.hide();

            // Mostrar mensaje de éxito
            alert('¡Comentario actualizado correctamente!');

        } else {
            const errorData = await response.json();
            alert('Error: ' + (errorData.errors?.join(', ') || 'Error al guardar'));
        }

    } catch (error) {
        alert('Error de conexión: ' + error.message);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

// Función para actualizar comentario en la página (global)
function updateCommentInPage(commentId, newText, newStars) {
    // Actualizar texto
    const commentTextElement = document.getElementById(`comment-text-${commentId}`);
    if (commentTextElement) {
        commentTextElement.textContent = newText;
    }

    // Actualizar estrellas
    const starContainer = document.querySelector(`#comment-${commentId} .star-rating`);
    if (starContainer) {
        let starsVisual = '';
        for (let i = 0; i < 5; i++) {
            starsVisual += i < newStars ? '★' : '☆';
        }
        starContainer.textContent = starsVisual;
    }
}

// Función para eliminar comentario (global)
async function deleteComment(gameId, commentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) {
        return;
    }

    try {
        const response = await fetch(`/detail/${gameId}/comment/${commentId}/delete`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            // Eliminar el comentario del DOM
            const commentElement = document.getElementById(`comment-${commentId}`);
            if (commentElement) {
                commentElement.remove();
                alert('Comentario eliminado correctamente');
            }
        } else {
            alert('Error al eliminar el comentario');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

// ============================================
// 4. INICIALIZACIÓN GENERAL
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar validación del formulario de creación (si existe)
    if (document.getElementById('createForm')) {
        initCreateValidation();
    }

    // Inicializar sistema de comentarios (si estamos en página de detalle)
    if (document.querySelector('form[action*="/comment"]')) {
        initCommentValidation();
    }

    // Verificar Bootstrap
    if (typeof bootstrap === 'undefined') {
        console.warn('Bootstrap no está disponible');
    }
});