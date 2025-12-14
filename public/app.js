// public/app.js
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
            // insert box before the field element so it appears above
            fieldEl.parentNode.insertBefore(box, fieldEl);
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

    // Attach live validation
    els.title && els.title.addEventListener('input', (e) => {
        clearError('title');
        const msg = validateTitle(e.target.value.trim());
        if (msg) showError('title', msg);
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

    // On submit: run local validators, then AJAX validate on server for uniqueness and deeper checks
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

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
                const json = await resp.json();
                if (json.ok) {
                    // No errors on server: submit the actual form (so files upload correctly)
                    form.submit();
                    return;
                }
            }

            // If here, server returned errors or non-OK status
            const data = await resp.json().catch(() => ({ errors: ['Error de validación en el servidor'] }));
            const errors = data.errors || ['Error de validación en el servidor'];
            // Map errors to fields when possible
            errors.forEach(err => {
                const field = mapServerErrorToField(err);
                if (field) showError(field, err);
                else {
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