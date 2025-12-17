// public/app.js
const NUM_RESULTS = 6;
let page = 0;
let loading = false;

async function loadMore() {
    if (loading) return;

    loading = true;
    page++;

    // Show spinner
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
        // Hide spinner afterwards
        setTimeout(() => {
            if (spinner) spinner.style.display = 'none';
            loading = false;
        }, 300);
    }
}

// Simple scroll
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
        loadMore();
    }
});

// --- Validation and AJAX pre-check merged from validate_create.js ---
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

    // Image preview setup
    (function setupImagePreview() {
        const input = els.image;
        if (!input) return;

        let preview = document.getElementById('imagePreview');
        if (!preview) {
            preview = document.createElement('img');
            preview.id = 'imagePreview';
            preview.alt = 'Preview';
            preview.style.display = 'none';
            preview.style.width = '100%';
            preview.style.height = 'auto';
            preview.style.maxHeight = '220px';
            preview.style.objectFit = 'contain';
            preview.style.marginTop = '8px';
            preview.className = 'img-fluid rounded';
            // Insert the preview inside the visible dropzone so it appears within the box
            const dropzone = document.getElementById('imageDropzone');
            if (dropzone) dropzone.insertBefore(preview, dropzone.firstChild);
            else input.parentNode.insertBefore(preview, input.nextSibling);
        }

        let currentObjectUrl = null;

        input.addEventListener('change', (e) => {
            const file = (e.target.files && e.target.files[0]) || null;
            if (!file) {
                if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); currentObjectUrl = null; }
                preview.src = '';
                preview.style.display = 'none';
                // restore dropzone placeholder text
                const dz = document.getElementById('imageDropzone');
                if (dz) {
                    const inner = dz.querySelector('div');
                    if (inner) inner.style.display = 'block';
                }
                clearError('image');
                return;
            }

            if (!file.type || !file.type.startsWith('image/')) {
                showError('image', 'El archivo debe ser una imagen.');
                preview.style.display = 'none';
                return;
            }

            clearError('image');
            if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); }
            currentObjectUrl = URL.createObjectURL(file);
            preview.src = currentObjectUrl;
            preview.style.display = 'block';
            // hide dropzone placeholder text when showing preview
            const dz = document.getElementById('imageDropzone');
            if (dz) {
                const inner = dz.querySelector('div');
                if (inner) inner.style.display = 'none';
            }
        });

        // Setup dropzone interactions (click-to-select + drag & drop)
        const dropzoneEl = document.getElementById('imageDropzone');
        if (dropzoneEl) {
            dropzoneEl.addEventListener('click', () => {
                input.click();
            });

            dropzoneEl.addEventListener('dragover', (ev) => {
                ev.preventDefault();
                dropzoneEl.style.background = '#0b0b0b55';
            });
            dropzoneEl.addEventListener('dragleave', (ev) => {
                ev.preventDefault();
                dropzoneEl.style.background = '#0b0b0b33';
            });
            dropzoneEl.addEventListener('drop', (ev) => {
                ev.preventDefault();
                dropzoneEl.style.background = '#0b0b0b33';
                const file = (ev.dataTransfer && ev.dataTransfer.files && ev.dataTransfer.files[0]) || null;
                if (!file) return;
                if (!file.type || !file.type.startsWith('image/')) {
                    showError('image', 'El archivo debe ser una imagen.');
                    return;
                }
                // Assign file to hidden input using DataTransfer
                try {
                    const dt = new DataTransfer();
                    dt.items.add(file);
                    input.files = dt.files;
                    // Trigger change handler
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                } catch (err) {
                    // Fallback: just show preview without setting input.files
                    if (currentObjectUrl) { URL.revokeObjectURL(currentObjectUrl); }
                    currentObjectUrl = URL.createObjectURL(file);
                    preview.src = currentObjectUrl;
                    preview.style.display = 'block';
                }
            });
        }
    })();

    // Create or attach delete button; supports server-side image (dataset.filename) or local selected file
    (function setupDeleteButtonAndInitialPreview() {
        const existingHidden = form.querySelector('input[name="existingImage"]');
        const existingFilename = existingHidden ? (existingHidden.value || '').trim() : '';
        const preview = document.getElementById('imagePreview');

        function createDeleteButton(filename) {
            let btn = document.getElementById('btnDeleteImage');
            if (!btn) {
                btn = document.createElement('button');
                btn.type = 'button';
                btn.id = 'btnDeleteImage';
                btn.className = 'btn btn-sm btn-danger';
                btn.style.marginTop = '10px';
                btn.style.display = 'block';
                btn.textContent = 'Eliminar imagen';
            }

            // Set dataset.filename (if server-side image) or empty for local-file-only
            if (filename) btn.dataset.filename = filename; else delete btn.dataset.filename;
            // If form has id hidden, attach it
            const idEl = form.querySelector('[name="id"]');
            if (idEl) btn.dataset.id = idEl.value || '';

            // Ensure event attached once
            btn.onclick = async function () {
                const fn = this.dataset.filename;
                // Server-side deletion (existing image stored on server)
                if (fn) {
                    const ok = window.confirm('¿Eliminar la imagen actual? Se borrará del servidor y de la base de datos si corresponde.');
                    if (!ok) return;
                    try {
                        const res = await fetch('/image/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                            body: JSON.stringify({ id: this.dataset.id || null, filename: fn })
                        });
                        const json = await res.json().catch(() => ({}));
                        if (res.ok && json.ok) {
                            const small = form.querySelector('small.text-muted');
                            if (small) small.remove();
                            this.remove();
                            if (existingHidden) existingHidden.value = '';
                            const imageInput = document.getElementById('image');
                            if (imageInput) imageInput.value = '';
                            if (preview) { preview.src = ''; preview.style.display = 'none'; }
                            alert('Imagen eliminada correctamente.');
                        } else {
                            alert('No se pudo eliminar la imagen.');
                        }
                    } catch (err) {
                        console.error('Error eliminando imagen:', err);
                        alert('Error de red al eliminar la imagen');
                    }
                } else {
                    // Local deletion: clear selected file and preview
                    const imageInput = document.getElementById('image');
                    if (imageInput) imageInput.value = '';
                    if (preview) { preview.src = ''; preview.style.display = 'none'; }
                    // Remove button and any small text if present
                    const small = form.querySelector('small.text-muted');
                    // keep small text if it describes server image; only remove if it was dynamic
                    if (small && (!existingFilename || small.textContent.includes(existingFilename) === false)) small.remove();
                    this.remove();
                }
            };

            // Insert button after dropzone (inside the mb-3 container) or after small text if exists
            const dropzone = document.getElementById('imageDropzone');
            const small = form.querySelector('small.text-muted');
            if (small && small.parentNode) {
                // If small text exists (server image), insert after its parent container (the mt-2 div)
                const parentDiv = small.parentNode; // the mt-2 div containing the small and button
                if (parentDiv && parentDiv.nextSibling) {
                    parentDiv.parentNode.insertBefore(btn, parentDiv.nextSibling);
                } else if (parentDiv && parentDiv.parentNode) {
                    parentDiv.parentNode.appendChild(btn);
                }
            } else if (dropzone && dropzone.parentNode) {
                // Otherwise insert after dropzone (within mb-3 container)
                const next = dropzone.nextSibling;
                if (next) dropzone.parentNode.insertBefore(btn, next);
                else dropzone.parentNode.appendChild(btn);
            } else {
                // Fallback: after hidden file input
                const input = document.getElementById('image');
                if (input && input.parentNode) input.parentNode.appendChild(btn);
            }
            return btn;
        }

        // If server provided existing image, show preview and ensure delete button
        if (existingFilename) {
            if (preview) {
                preview.src = `/uploads/${existingFilename}`;
                preview.style.display = 'block';
            }
            // Hide the placeholder text when editing with existing image
            const dz = document.getElementById('imageDropzone');
            if (dz) {
                const inner = dz.querySelector('div');
                if (inner) inner.style.display = 'none';
            }
            createDeleteButton(existingFilename);
        }

        // When user selects a new file, show preview (handled above) and ensure delete button for local clearing
        const input = els.image;
        if (input) {
            input.addEventListener('change', function (e) {
                const file = (e.target.files && e.target.files[0]) || null;
                if (file) {
                    // If delete button not present, create a local-only delete button
                    if (!document.getElementById('btnDeleteImage')) {
                        createDeleteButton(null);
                    }
                }
            });
        }
    })();

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
            // For the platform field insert the error above its whole row (label + input)
            if (fieldKey === 'platform') {
                const fieldRow = fieldEl.parentNode; // likely the form-group / mb-3
                if (fieldRow && fieldRow.parentNode) {
                    fieldRow.parentNode.insertBefore(box, fieldRow);
                } else {
                    fieldEl.parentNode.insertBefore(box, fieldEl);
                }
            } else {
                // insert box before the field element so it appears above the field
                fieldEl.parentNode.insertBefore(box, fieldEl);
            }
        }
        box.textContent = msg;
    }
    function clearError(fieldKey) { showError(fieldKey, '') }

    // Local validators (quick feedback)
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

    // Debounced remote uniqueness check for title
    let titleCheckTimer = null;
    const TITLE_CHECK_DELAY = 600;

    async function performTitleCheck(title) {
        // Only check if local validator passes
        const local = validateTitle(title);
        if (local) return;

        // show transient checking indicator
        showError('title', 'Comprobando título...');

        const idEl = form.querySelector('[name="id"]');
        const payload = { id: idEl ? idEl.value || null : null, title };
        try {
            const res = await fetch('/create/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const json = await res.json().catch(() => ({}));
            if (res.ok && json.ok) {
                clearError('title');
                return;
            }

            // Map server errors to field when possible
            const errors = json.errors || [];
            // Only surface errors that clearly map to title; ignore others (they may be unrelated because we sent minimal payload)
            const first = errors[0] || '';
            const mapped = mapServerErrorToField(first);
            if (mapped === 'title') {
                showError('title', first || 'El título ya existe');
            } else {
                // remove transient checking message if no title-specific error
                clearError('title');
            }
        } catch (err) {
            console.error('Title uniqueness check failed', err);
            // keep local state; remove checking message
            clearError('title');
        }
    }

    // Attach live validation + debounced remote check
    els.title && els.title.addEventListener('input', (e) => {
        clearError('title');
        const value = e.target.value.trim();
        const msg = validateTitle(value);
        if (msg) { showError('title', msg); return; }

        if (titleCheckTimer) clearTimeout(titleCheckTimer);
        titleCheckTimer = setTimeout(() => performTitleCheck(value), TITLE_CHECK_DELAY);
    });
    els.description && els.description.addEventListener('input', (e) => {
        clearError('description');
        const msg = validateDescription(e.target.value.trim());
        if (msg) showError('description', msg);
    });
    els.price && els.price.addEventListener('input', (e) => {
        clearError('price');
        const msg = validatePrice(e.target.value);
        if (msg) showError('price', msg);
    });
    els.year && els.year.addEventListener('input', (e) => {
        clearError('year');
        const msg = validateYear(e.target.value);
        if (msg) showError('year', msg);
    });
    els.developer && els.developer.addEventListener('input', (e) => {
        clearError('developer');
        const msg = validateDeveloper(e.target.value.trim());
        if (msg) showError('developer', msg);
    });
    els.trailer && els.trailer.addEventListener('input', (e) => {
        clearError('trailer');
        const msg = validateTrailer(e.target.value.trim());
        if (msg) showError('trailer', msg);
    });

    // Genre checkbox listeners: clear platform error when any genre selected
    (function setupGenreListeners() {
        const genreCheckboxes = Array.from(form.querySelectorAll('input[name="genres[]"]'));
        if (!genreCheckboxes.length) return;
        genreCheckboxes.forEach(cb => cb.addEventListener('change', () => {
            if (form.querySelectorAll('input[name="genres[]"]:checked').length > 0) clearError('platform');
        }));
    })();

    // Map server error messages to fields (simple heuristics)
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

    // Helper: show a closable validation popup (Bootstrap modal)
    function showValidationPopup(message) {
        let modalEl = document.getElementById('validationPopupModal');
        if (!modalEl) {
            const html = `
            <div class="modal fade" id="validationPopupModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content bg-dark text-light">
                        <div class="modal-header border-danger">
                            <h5 class="modal-title text-danger">Error de validación</h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p id="validationPopupMessage"></p>
                        </div>
                        <div class="modal-footer border-danger">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            modalEl = document.getElementById('validationPopupModal');
        }
        const msgEl = document.getElementById('validationPopupMessage');
        if (msgEl) msgEl.textContent = message || '';
        try {
            const m = new bootstrap.Modal(modalEl);
            m.show();
        } catch (e) {
            // Fallback to native alert if bootstrap not available
            alert(message);
        }
    }

    // On submit: run local validators, then AJAX validate on server for uniqueness and deeper checks
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Determine whether there was an inline title error BEFORE we clear any errors
        const hadTitleBox = document.getElementById('error-box-title');
        const hadTitleInline = document.getElementById('error-title');
        const hadTitleErrorBefore = Boolean((hadTitleBox && hadTitleBox.textContent && hadTitleBox.textContent.trim()) || (hadTitleInline && hadTitleInline.textContent && hadTitleInline.textContent.trim()));

        // Clear previous errors
        ['title','description','price','platform','year','developer','trailer'].forEach(clearError);

        const formData = new FormData(form);
        // collect genres checkboxes if any (they are named genres[] in template)
        const genres = [];
        form.querySelectorAll('input[name=\"genres[]\"]:checked').forEach(cb => genres.push(cb.value));

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

        // Category selection: require at least one genre; show error above Platform
        if (!genres || genres.length === 0) {
            localErrors.push('Debes seleccionar al menos una categoría');
            showError('platform', 'Debes seleccionar al menos una categoría');
        }

        if (localErrors.length > 0) {
            // don't call server if local errors
            return;
        }

        try {
            const resp = await fetch('/create/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (resp.ok) {
                const json = await resp.json().catch(() => ({}));
                if (json.ok) {
                    // No errors on server: submit via AJAX so we can navigate to detail without full reload
                    await ajaxSubmitForm(form);
                    return;
                }
            }

            // If here, server returned errors or non-OK status
            const data = await resp.json().catch(() => ({ errors: ['Error de validación en el servidor'] }));
            const errors = data.errors || ['Error de validación en el servidor'];
            // Map errors to fields when possible. If server reports a title-duplicate
            // and there was no title error detected before submit, show a closable popup
            // so the user can dismiss it and continue editing without losing data.
            errors.forEach(err => {
                const field = mapServerErrorToField(err);
                if (field === 'title' && !hadTitleErrorBefore) {
                    showValidationPopup(err || 'El título ya existe');
                } else if (field) {
                    showError(field, err);
                } else {
                    // fallback: show in title area
                    showError('title', err);
                }
            });

        } catch (err) {
            console.error('Validation request failed', err);
            showError('title', 'No se pudo validar en el servidor. Intenta de nuevo.');
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCreateValidation);
} else {
    initCreateValidation();
}

// ---- Detail page: AJAX delete with spinner + delayed redirect ----
function initDetailDelete() {
    const btn = document.getElementById('btnDeleteGame');
    if (!btn) return;

    const deleteUrl = btn.dataset.deleteUrl || (function(){
        // If template did not set data-delete-url, infer from URL
        const id = (window.location.pathname.split('/').pop());
        return `/detail/${id}/deleteVideogame`;
    })();

    // Create processing overlay
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.background = 'rgba(0,0,0,0.6)';
    overlay.style.display = 'none';
    overlay.style.zIndex = '1050';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.innerHTML = '<div class="text-center text-light"><div class="spinner-border text-light" role="status"></div><div class="mt-3">Procesando borrado...</div></div>';
    document.body.appendChild(overlay);

    // Optionally use native alert for error feedback
    const useNativeErrorDialog = true;

    function showOverlay(show){ overlay.style.display = show ? 'flex' : 'none'; }

    let locked = false;
    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (locked) return; // prevent double clicks
        const ok = window.confirm('¿Seguro que quieres borrar este videojuego?');
        if (!ok) return;
        locked = true;
        try {
            showOverlay(true);
            const res = await fetch(deleteUrl, { method: 'GET', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            // Success (200): redirect to home after short delay
            if (res.ok) {
                setTimeout(() => {
                    showOverlay(false);
                    window.location.href = '/';
                }, 800);
                return;
            }
            // Error: show native alert with server message, do not redirect
            const msg = await res.text().catch(() => 'Error del servidor al borrar');
            showOverlay(false);
            if (useNativeErrorDialog) {
                alert(msg || 'Error del servidor al borrar');
            } else {
                // fallback to console if native not desired
                console.error('Delete error:', msg);
            }
            locked = false;
        } catch (err) {
            showOverlay(false);
            const msg = 'Error de red: ' + (err?.message || 'desconocido');
            if (useNativeErrorDialog) {
                alert(msg);
            } else {
                console.error(msg);
            }
            locked = false;
        }
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDetailDelete);
} else {
    initDetailDelete();
}

// ============================================
// Comments: validation, edit modal and delete
// ============================================
function initCommentValidation() {
    const form = document.querySelector('form[action*="/comment"]');
    if (!form) return;

    const userName = document.getElementById('userName');
    const reviewText = document.getElementById('reviewText');
    const ratingInputs = form.querySelectorAll('input[name="rating"]');
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!userName || !reviewText || !submitBtn) return;

    // Success modal removed: use window.confirm and dynamic refresh

    // Errors
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
        if (ratingContainer) ratingContainer.parentNode.appendChild(ratingError);
    }

    // Character counter
    const charCounter = document.createElement('div');
    charCounter.className = 'text-muted small mt-1';
    charCounter.textContent = '0/500';
    reviewText.parentNode.appendChild(charCounter);

    // Listeners
    userName.addEventListener('input', () => { userNameError.style.display = 'none'; });
    userName.addEventListener('blur', () => {
        const name = userName.value.trim();
        if (name.length < 5) { userNameError.textContent = 'El nombre debe tener al menos 5 caracteres'; userNameError.style.display = 'block'; }
        else if (name.length > 30) { userNameError.textContent = 'El nombre no puede superar los 30 caracteres'; userNameError.style.display = 'block'; }
    });
    reviewText.addEventListener('input', () => {
        reviewTextError.style.display = 'none';
        charCounter.textContent = `${reviewText.value.length}/500`;
        if (reviewText.value.length > 500) { charCounter.classList.add('text-danger'); charCounter.classList.remove('text-muted'); }
        else { charCounter.classList.remove('text-danger'); charCounter.classList.add('text-muted'); }
    });
    reviewText.addEventListener('blur', () => {
        const text = reviewText.value.trim();
        if (text.length < 10) { reviewTextError.textContent = 'El comentario debe tener al menos 10 caracteres'; reviewTextError.style.display = 'block'; }
        else if (text.length > 500) { reviewTextError.textContent = 'El comentario no puede superar 500 caracteres'; reviewTextError.style.display = 'block'; }
    });
    ratingInputs.forEach(input => input.addEventListener('change', () => { ratingError.style.display = 'none'; }));

    // Submit
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let hasErrors = false;
        const name = userName.value.trim();
        if (name.length < 5) { userNameError.textContent = 'El nombre debe tener al menos 5 caracteres'; userNameError.style.display = 'block'; hasErrors = true; }
        else if (name.length > 30) { userNameError.textContent = 'El nombre no puede superar los 30 caracteres'; userNameError.style.display = 'block'; hasErrors = true; }
        const text = reviewText.value.trim();
        if (text.length < 10) { reviewTextError.textContent = 'El comentario debe tener al menos 10 caracteres'; reviewTextError.style.display = 'block'; hasErrors = true; }
        else if (text.length > 500) { reviewTextError.textContent = 'El comentario no puede superar 500 caracteres'; reviewTextError.style.display = 'block'; hasErrors = true; }
        let ratingSelected = Array.from(ratingInputs).some(r => r.checked);
        if (!ratingSelected) { ratingError.textContent = 'Debes seleccionar una valoración'; ratingError.style.display = 'block'; hasErrors = true; }
        if (hasErrors) return;

        const originalBtnText = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Enviando...';
        try {
            const params = new URLSearchParams();
            params.append('userName', userName.value);
            params.append('reviewText', reviewText.value);
            params.append('rating', Array.from(ratingInputs).find(r => r.checked)?.value || '5');
            const response = await fetch(form.action, {
                method: 'POST',
                body: params,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
            });
            const jsonData = await response.json();
            if (jsonData.success) {
                // Get gameId from the form URL (e.g., /detail/123/comment)
                const match = form.action.match(/\/detail\/([^\/]+)/);
                const gameId = match ? match[1] : null;

                const go = window.confirm('Comentario añadido correctamente. ¿Ver comentarios?');
                if (go && gameId) {
                    try {
                        await refreshCommentsSection(gameId);
                    } catch (err) {
                        console.error('No se pudo refrescar los comentarios dinámicamente', err);
                    }
                }
                userName.value = '';
                reviewText.value = '';
                ratingInputs.forEach(input => input.checked = false);
                charCounter.textContent = '0/500';
            } else {
                // Show server validation errors inline (AJAX)
                const serverErrors = Array.isArray(jsonData.errors) ? jsonData.errors : [jsonData.message || 'Error desconocido'];
                // Clear visible errors
                userNameError.style.display = 'none';
                reviewTextError.style.display = 'none';
                ratingError.style.display = 'none';

                // Simple mapping by keywords
                let focused = false;
                serverErrors.forEach(err => {
                    const msg = String(err || '').trim();
                    const low = msg.toLowerCase();
                    if (low.includes('nombre') || low.includes('usuario')) {
                        userNameError.textContent = msg;
                        userNameError.style.display = 'block';
                        if (!focused) { userName.focus(); focused = true; }
                    } else if (low.includes('comentario') || low.includes('texto')) {
                        reviewTextError.textContent = msg;
                        reviewTextError.style.display = 'block';
                        if (!focused) { reviewText.focus(); focused = true; }
                    } else if (low.includes('valoración') || low.includes('valoracion') || low.includes('estrellas') || low.includes('rating')) {
                        ratingError.textContent = msg;
                        ratingError.style.display = 'block';
                        if (!focused) { ratingInputs[0]?.focus(); focused = true; }
                    }
                });
                // If nothing matched, show a fallback alert to keep information
                if (!userNameError.offsetParent && !reviewTextError.offsetParent && !ratingError.offsetParent) {
                    alert('Error: ' + serverErrors.join('\n'));
                }
            }
        } catch (error) {
            alert('Error: No se pudo enviar el comentario');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnText;
        }
    });

    // Initialize counter
    charCounter.textContent = `${reviewText.value.length}/500`;
}

// Comment utilities
function openEditModal(gameId, commentId, userName, commentText, stars) {
    // Ensure modal exists (create if missing)
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
        // Attach counter listener
        const editCommentTextEl = document.getElementById('editCommentText');
        const editCharCounterEl = document.getElementById('editCharCounter');
        if (editCommentTextEl && editCharCounterEl) {
            editCommentTextEl.addEventListener('input', function () {
                editCharCounterEl.textContent = `${this.value.length}/500`;
                // Live hide error while typing
                const err = document.getElementById('editTextError');
                if (err) err.style.display = 'none';
            });
            // Show validation on blur like initCommentValidation
            editCommentTextEl.addEventListener('blur', function () {
                const err = document.getElementById('editTextError');
                if (!err) return;
                const text = this.value.trim();
                if (text.length < 10) { err.textContent = 'El comentario debe tener al menos 10 caracteres'; err.style.display = 'block'; }
                else if (text.length > 500) { err.textContent = 'El comentario no puede superar 500 caracteres'; err.style.display = 'block'; }
            });
        }
        // Attach live rating preview
        const ratingInputs = document.querySelectorAll('input[name="editRating"]');
        ratingInputs.forEach(input => {
            input.addEventListener('change', () => {
                const selected = parseInt(document.querySelector('input[name="editRating"]:checked')?.value || '0');
                // Update stars in the modal header as a small preview (optional)
                // Or directly update the card preview stars for immediate feedback
                const starContainer = document.querySelector(`#comment-${commentId} .star-rating`);
                if (starContainer) {
                    let starsVisual = '';
                    for (let i = 0; i < 5; i++) starsVisual += i < selected ? '★' : '☆';
                    starContainer.textContent = starsVisual;
                }
                // Hide rating error when a selection is made
                const rErr = document.getElementById('editRatingError');
                if (rErr) rErr.style.display = 'none';
            });
        });
        // Create field error containers (below fields)
        const editTextErr = document.createElement('div');
        editTextErr.id = 'editTextError';
        editTextErr.className = 'text-danger small';
        editTextErr.style.display = 'none';
        // Place immediately after the textarea for tighter association
        editCommentTextEl.insertAdjacentElement('afterend', editTextErr);

        const editRatingErr = document.createElement('div');
        editRatingErr.id = 'editRatingError';
        editRatingErr.className = 'text-danger small';
        editRatingErr.style.display = 'none';
        const ratingContainer = document.querySelector('#editCommentForm .rating-input');
        if (ratingContainer) ratingContainer.insertAdjacentElement('afterend', editRatingErr);

        // Attach save handler
        document.getElementById('saveEditBtn')?.addEventListener('click', saveEditedComment);
    }

    const editGameIdEl = document.getElementById('editGameId');
    const editCommentIdEl = document.getElementById('editCommentId');
    const editCommentTextEl = document.getElementById('editCommentText');
    const editCharCounterEl = document.getElementById('editCharCounter');

    if (!editGameIdEl || !editCommentIdEl || !editCommentTextEl || !editCharCounterEl) {
        console.error('Edit modal elements not found');
        return;
    }

    editGameIdEl.value = gameId;
    editCommentIdEl.value = commentId;
    // Prefer current DOM values to avoid stale data
    const domTextEl = document.getElementById(`comment-text-${commentId}`);
    const currentText = domTextEl ? domTextEl.textContent.trim() : commentText;
    editCommentTextEl.value = currentText;
    editCharCounterEl.textContent = `${currentText.length}/500`;

    const ratingInputs = document.querySelectorAll('input[name="editRating"]');
    // Read current stars from DOM if available
    const starContainer = document.querySelector(`#comment-${commentId} .star-rating`);
    let currentStars = parseInt(stars);
    if (starContainer) {
        const text = starContainer.textContent || '';
        currentStars = (text.match(/★/g) || []).length || currentStars || 0;
    }
    ratingInputs.forEach(input => { input.checked = parseInt(input.value) === parseInt(currentStars); });

    const modalEl = document.getElementById('editCommentModal');
    const editModal = new bootstrap.Modal(modalEl);
    editModal.show();
}

async function saveEditedComment() {
    const gameId = document.getElementById('editGameId').value;
    const commentId = document.getElementById('editCommentId').value;
    const commentText = document.getElementById('editCommentText').value.trim();
    const ratingInput = document.querySelector('input[name="editRating"]:checked');
    const stars = ratingInput ? ratingInput.value : '0';
    // Inline error containers
    const editTextErr = document.getElementById('editTextError');
    const editRatingErr = document.getElementById('editRatingError');
    if (editTextErr) { editTextErr.style.display = 'none'; editTextErr.textContent = ''; }
    if (editRatingErr) { editRatingErr.style.display = 'none'; editRatingErr.textContent = ''; }

    // Client-side validations like initCommentValidation
    let hasErrors = false;
    const popupErrors = [];
    if (!commentText || commentText.length < 10) {
        const msg = 'El comentario debe tener al menos 10 caracteres';
        if (editTextErr) { editTextErr.textContent = msg; editTextErr.style.display = 'block'; }
        popupErrors.push(msg);
        hasErrors = true;
    } else if (commentText.length > 500) {
        const msg = 'El comentario no puede superar 500 caracteres';
        if (editTextErr) { editTextErr.textContent = msg; editTextErr.style.display = 'block'; }
        popupErrors.push(msg);
        hasErrors = true;
    }
    if (!ratingInput) {
        const msg = 'Debes seleccionar una valoración';
        if (editRatingErr) { editRatingErr.textContent = msg; editRatingErr.style.display = 'block'; }
        popupErrors.push(msg);
        hasErrors = true;
    }
    if (hasErrors) {
        // Show a closable alert so user can keep editing
        alert(popupErrors.join('\n'));
        return;
    }
    const saveBtn = document.getElementById('saveEditBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';
    try {
        const params = new URLSearchParams();
        params.append('reviewText', commentText);
        params.append(`rating-${commentId}`, stars);
        const response = await fetch(`/detail/${gameId}/comment/${commentId}/edit`, {
            method: 'POST',
            body: params,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (response.ok) {
            const json = await response.json();
            updateCommentInPage(commentId, json.comment.text, parseInt(json.comment.stars));
            // Recompute and update aggregate rating if present
            updateAggregateRating();
            // Update modal fields to persisted values (avoid stale on next open)
            document.getElementById('editCommentText').value = json.comment.text;
            const ratingInputs = document.querySelectorAll('input[name="editRating"]');
            ratingInputs.forEach(inp => inp.checked = parseInt(inp.value) === parseInt(json.comment.stars));
            const editModal = bootstrap.Modal.getInstance(document.getElementById('editCommentModal'));
            editModal.hide();
        } else {
            const errorData = await response.json().catch(() => ({ errors: ['Error al guardar'] }));
            // Map server errors to inline fields when possible
            const msgs = errorData.errors || [];
            msgs.forEach(msg => {
                const lower = (msg || '').toLowerCase();
                if (lower.includes('comentario') || lower.includes('texto')) {
                    if (editTextErr) { editTextErr.textContent = msg; editTextErr.style.display = 'block'; }
                } else if (lower.includes('valoración') || lower.includes('valoracion') || lower.includes('estrellas') || lower.includes('rating')) {
                    if (editRatingErr) { editRatingErr.textContent = msg; editRatingErr.style.display = 'block'; }
                } else {
                    // Fallback to text area error
                    if (editTextErr) { editTextErr.textContent = msg; editTextErr.style.display = 'block'; }
                }
            });
            // Also show a closable alert so user can keep editing
            if (msgs.length) alert(msgs.join('\n'));
        }
    } catch (error) {
        const msg = 'Error de conexión: ' + (error.message || 'desconocido');
        if (editTextErr) { editTextErr.textContent = msg; editTextErr.style.display = 'block'; }
        alert(msg);
    } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = originalText;
    }
}

function updateCommentInPage(commentId, newText, newStars) {
    const commentTextElement = document.getElementById(`comment-text-${commentId}`);
    if (commentTextElement) commentTextElement.textContent = newText;
    const starContainer = document.querySelector(`#comment-${commentId} .star-rating`);
    if (starContainer) {
        let starsVisual = '';
        for (let i = 0; i < 5; i++) starsVisual += i < newStars ? '★' : '☆';
        starContainer.textContent = starsVisual;
    }
}

async function deleteComment(gameId, commentId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este comentario?')) return;
    try {
        const response = await fetch(`/detail/${gameId}/comment/${commentId}/delete`, {
            method: 'GET',
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (response.ok) {
            const commentElement = document.getElementById(`comment-${commentId}`);
            if (commentElement) { commentElement.remove(); updateAggregateRating(); alert('Comentario eliminado correctamente'); }
        } else {
            alert('Error al eliminar el comentario');
        }
    } catch (error) {
        alert('Error de conexión');
    }
}

// Refresh the comments section without reloading the entire page
async function refreshCommentsSection(gameId) {
    const resp = await fetch(`/detail/${gameId}`, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Locate the LIST container (not the block that includes the form)
    function findCommentsList(root) {
        const listSelectors = ['#commentsList', '.comments-list', '[data-comments-list]', '.reviews-list'];
        const direct = listSelectors.map(s => root.querySelector(s)).find(Boolean);
        if (direct) return direct;
        // Heuristic fallback: container with multiple comments and WITHOUT the comment form
        const items = Array.from(root.querySelectorAll('[id^="comment-"]'));
        if (!items.length) return null;
        let candidate = items[0].parentElement;
        const containsForm = (el) => !!el.querySelector('form[action*="/comment"]');
        while (candidate && (!candidate.querySelectorAll('[id^="comment-"]').length || containsForm(candidate))) {
            candidate = candidate.parentElement;
        }
        // If no clean container is found, use the first parent with multiple comments even if there's no form inside
        if (!candidate) {
            candidate = items[0].parentElement;
            while (candidate && candidate.querySelectorAll('[id^="comment-"]').length <= 1) {
                candidate = candidate.parentElement;
            }
        }
        return candidate;
    }

    const newList = findCommentsList(doc);
    const currentList = findCommentsList(document);
    if (!newList || !currentList) return;

    // Replace ONLY the list to avoid losing the form listeners
    currentList.innerHTML = newList.innerHTML;

    // Also update the comment form with the latest version from the server
    const newForm = doc.querySelector('form[action*="/comment"]');
    const currentForm = document.querySelector('form[action*="/comment"]');
    if (newForm && currentForm) {
        // Completely replace the form to avoid stale validation artifacts
        currentForm.outerHTML = newForm.outerHTML;
        // Reattach handlers and validations on the new markup
        if (typeof initCommentValidation === 'function') {
            initCommentValidation();
        }
    }

    updateAggregateRating();
}

// Optional: Update aggregate rating displayed on detail page, if element exists
function updateAggregateRating() {
    // Collect stars from all comments
    const starBlocks = document.querySelectorAll('.comment .star-rating, [id^="comment-"] .star-rating');
    let total = 0, count = 0;
    starBlocks.forEach(block => {
        const starsText = block.textContent || '';
        const filled = (starsText.match(/★/g) || []).length;
        if (filled >= 0) { total += filled; count++; }
    });
    const avg = count > 0 ? (total / count) : 0;

    // Try multiple targets commonly used for average rating
    const targets = [
        document.getElementById('avgRating'),
        document.getElementById('averageRating'),
        document.querySelector('[data-avg-rating]'),
        document.querySelector('#avg-rating'),
        document.querySelector('.avg-rating')
    ].filter(Boolean);

    // Update numeric + star text if text container
    targets.forEach(t => {
        // If element expects stars-only (has class .star-rating)
        if (t.classList.contains('star-rating')) {
            let starsVisual = '';
            const rounded = Math.round(avg);
            for (let i = 0; i < 5; i++) starsVisual += i < rounded ? '★' : '☆';
            t.textContent = starsVisual;
        } else {
            t.textContent = `${avg.toFixed(1)} ★`;
        }
        // Also set a data attribute for custom templates
        t.setAttribute('data-avg-rating', avg.toFixed(2));
    });

    // Update dedicated number and stars blocks if present
    const avgNumberEl = document.getElementById('avgNumber') || document.querySelector('.avg-number');
    if (avgNumberEl) avgNumberEl.textContent = avg.toFixed(1);

    const avgStarsEl = document.getElementById('avgStars') || document.querySelector('.avg-stars');
    if (avgStarsEl) {
        let visual = '';
        const rounded = Math.round(avg);
        for (let i = 0; i < 5; i++) visual += i < rounded ? '★' : '☆';
        avgStarsEl.textContent = visual;
    }

    const countEl = document.getElementById('ratingsCount') || document.querySelector('[data-ratings-count]');
    if (countEl) {
        // If element contains a phrase, try to replace number only
        if (countEl.getAttribute('data-ratings-count') !== null) {
            countEl.setAttribute('data-ratings-count', String(count));
        }
        // Common phrase: "Basado en X valoraciones"
        const baseText = countEl.getAttribute('data-base-text');
        if (baseText) {
            countEl.textContent = baseText.replace('{count}', String(count));
        } else {
            countEl.textContent = `Basado en ${count} valoraciones`;
        }
    }

    // Explicitly update the overall-rating block shown in detail.html
    const overall = document.querySelector('.overall-rating');
    if (overall) {
        const numberEl = overall.querySelector('h2');
        const starsEl = overall.querySelector('.star-rating.star2');
        const textEl = overall.querySelector('p');
        if (numberEl) numberEl.textContent = avg.toFixed(1);
        if (starsEl) {
            let visual = '';
            const rounded = Math.round(avg);
            for (let i = 0; i < 5; i++) visual += i < rounded ? '★' : '☆';
            starsEl.textContent = visual;
        }
        if (textEl) textEl.textContent = `Basado en ${count} valoraciones`;
    }

    // Also update the "Game information" Rating row
    const infoItems = document.querySelectorAll('.game-info .info-item');
    infoItems.forEach(item => {
        const label = item.querySelector('.info-label');
        if (label && label.textContent.trim().toLowerCase() === 'valoración') {
            const value = item.querySelector('.info-value');
            if (value) {
                // Build stars visual
                let starsVisual = '';
                const rounded = Math.round(avg);
                for (let i = 0; i < 5; i++) starsVisual += i < rounded ? '★' : '☆';
                // Recompose innerHTML to keep structure
                value.innerHTML = `<span class="star-rating">${starsVisual}</span> ${avg.toFixed(1)}/5`;
            }
        }
    });
}

// Additional general initialization
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('form[action*="/comment"]')) initCommentValidation();
    // Ensure average rating is set on load
    updateAggregateRating();
});

// Submit the create form via AJAX (supports files) and load detail page without full reload
async function ajaxSubmitForm(form) {
    try {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtn = submitBtn ? submitBtn.innerHTML : null;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Creando...';
        }

        const fd = new FormData(form);
        const res = await fetch(form.action, {
            method: form.method || 'POST',
            body: fd,
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });

        const contentType = res.headers.get('content-type') || '';

        // If server returned JSON with redirect or id, follow it to get HTML
        if (contentType.includes('application/json')) {
            const j = await res.json().catch(() => ({}));
            // Expecting something like { ok: true, redirect: '/detail/123' } or { ok: true, id: 123 }
            const redirect = j.redirect || (j.id ? `/detail/${j.id}` : null);
            if (redirect) {
                const htmlResp = await fetch(redirect, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                const html = await htmlResp.text();
                applyFetchedHTML(html, redirect);
                return;
            }
            // If no redirect, but server returned an HTML fragment in a field
            if (j.html) {
                applyFetchedHTML(j.html, window.location.pathname);
                return;
            }
            // Fallback: if server signalled creation but no redirect, reload location to be safe
            if (j.ok) {
                window.location.href = '/';
                return;
            }
        }

        // If server returned HTML (e.g., redirected to detail or confirm page), try to detect detail link and inject it
        if (contentType.includes('text/html')) {
            const html = await res.text();
            // Try to parse returned HTML and detect a direct detail link (or meta refresh)
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                // 1) Look for anchor to /detail/
                const link = doc.querySelector('a[href*="/detail/"]');
                if (link && link.href) {
                    const href = link.getAttribute('href');
                    const abs = new URL(href, window.location.origin).pathname + new URL(href, window.location.origin).search;
                    const htmlResp = await fetch(abs, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                    const html2 = await htmlResp.text();
                    applyFetchedHTML(html2, abs);
                    return;
                }
                // 2) Look for meta refresh
                const meta = doc.querySelector('meta[http-equiv="refresh"]');
                if (meta) {
                    const content = meta.getAttribute('content') || '';
                    const m = content.match(/url=(.+)$/i);
                    if (m && m[1]) {
                        const abs = new URL(m[1].trim(), window.location.origin).pathname;
                        const htmlResp = await fetch(abs, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                        const html2 = await htmlResp.text();
                        applyFetchedHTML(html2, abs);
                        return;
                    }
                }
                // 3) If the returned HTML already looks like the detail page (heuristic: contains an element with class 'overall-rating' or '.videogame-detail'), apply it
                if (doc.querySelector('.overall-rating') || doc.querySelector('.videogame-detail')) {
                    const finalUrl = res.url || window.location.href;
                    applyFetchedHTML(html, finalUrl);
                    return;
                }
            } catch (e) {
                console.error('Could not parse returned HTML', e);
            }

            // Fallback: if HTML appears to be a generic confirmation page, try to find a detail link textually
            const match = html.match(/href=["']([^"']*\/detail\/[^"']*)["']/i);
            if (match && match[1]) {
                const abs = new URL(match[1], window.location.origin).pathname + new URL(match[1], window.location.origin).search;
                const htmlResp = await fetch(abs, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
                const html2 = await htmlResp.text();
                applyFetchedHTML(html2, abs);
                return;
            }

            // Otherwise apply HTML as-is (last resort)
            const finalUrl = res.url || window.location.href;
            applyFetchedHTML(html, finalUrl);
            return;
        }

        // Otherwise, fallback to full navigation
        window.location.href = form.action;
    } catch (err) {
        console.error('AJAX submit failed', err);
        alert('No se pudo crear el videojuego. Intenta de nuevo.');
    } finally {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            // restore original text if present
            // (we can't access original here reliably, so keep generic)
            submitBtn.innerHTML = 'Crear';
        }
    }
}

function applyFetchedHTML(html, url) {
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        // Replace body contents and title
        if (doc.title) document.title = doc.title;
        document.body.innerHTML = doc.body.innerHTML;
        if (url) history.pushState({}, '', url);

        // Re-run common initializers present in this script
        if (typeof initDetailDelete === 'function') initDetailDelete();
        if (typeof initCommentValidation === 'function') initCommentValidation();
        if (typeof updateAggregateRating === 'function') updateAggregateRating();
        // If the new page contains a create form (unlikely), re-init create validation
        if (document.getElementById('createForm') && typeof initCreateValidation === 'function') initCreateValidation();
    } catch (err) {
        console.error('Failed to apply fetched HTML', err);
        // As a fallback do a full navigation
        if (url) window.location.href = url;
    }
}