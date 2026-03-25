document.addEventListener('DOMContentLoaded', () => {
    const streetGrid = document.getElementById('streetGrid');
    const streetSearch = document.getElementById('streetSearch');
    const streetModal = document.getElementById('streetModal');
    const closeModal = document.querySelector('.close-modal');
    const modalTitle = document.getElementById('modalTitle');
    const contentFrame = document.getElementById('contentFrame');

    let streetData = [];

    // Load street data from global variable (defined in data.js)
    if (typeof STREET_DATA !== 'undefined') {
        streetData = STREET_DATA;
        renderStreets(streetData);
    } else {
        console.error('Error: STREET_DATA not found. Make sure data.js is loaded.');
        streetGrid.innerHTML = '<p class="error">Kunde inte ladda gatuinformation. Kontrollera att data.js finns.</p>';
    }

    // Render street cards
    function renderStreets(data) {
        if (data.length === 0) {
            streetGrid.innerHTML = '<p class="no-results">Inga gator matchar din sökning.</p>';
            return;
        }

        streetGrid.innerHTML = data.map(street => `
            <div class="street-card" data-id="${street.id}" onclick="openStreet('${street.id}')">
                ${street.image ? `
                    <div class="image-container">
                        <img src="${street.image}" alt="${street.name}" loading="lazy">
                    </div>
                ` : '<div class="image-container no-image"><i class="ph ph-image"></i></div>'}
                <div class="content">
                    <h3>${street.name}</h3>
                    <p>Utforska historien om ${street.name.toLowerCase()}</p>
                </div>
                <div class="badge">Södermalm</div>
            </div>
        `).join('');
    }

    // Search/Filter logic
    streetSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredData = streetData.filter(street =>
            street.name.toLowerCase().includes(searchTerm) ||
            street.id.toLowerCase().includes(searchTerm)
        );
        renderStreets(filteredData);
    });

    // Open Modal
    window.openStreet = (id) => {
        const street = streetData.find(s => s.id === id);
        if (!street) return;

        modalTitle.textContent = street.name;
        const streetDetails = document.getElementById('streetDetails');
        streetModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (!street.content) {
            streetDetails.innerHTML = '<p class="error">Ingen detaljinformation tillgänglig för denna gata.</p>';
            return;
        }

        // Parse the pre-loaded HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(street.content, 'text/html');
        const content = doc.body;

        // Standardize paths for images and links
        const folderPath = street.path.substring(0, street.path.lastIndexOf('/') + 1);

        // Fix images and strip attributes
        content.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            if (src && !src.startsWith('http') && !src.startsWith('/')) {
                img.src = folderPath + src;
            }
            img.removeAttribute('width');
            img.removeAttribute('height');
            img.removeAttribute('border');
            img.removeAttribute('hspace');
            img.removeAttribute('vspace');
        });

        // Fix links
        content.querySelectorAll('a').forEach(a => {
            const href = a.getAttribute('href');
            if (href && !href.startsWith('http') && !href.startsWith('/') && !href.startsWith('#')) {
                a.href = folderPath + href;
            }
        });

        // Cleaning Logic: Flatten the structure by extracting text and images
        // We want to avoid nested tables but keep the flow
        const cleanContainer = document.createElement('div');

        // Extract all meaningful elements in order
        const elements = content.querySelectorAll('p, img, h1, h2, h3, font, b, center');

        if (elements.length > 0) {
            elements.forEach(el => {
                // If it's an image, just append it
                if (el.tagName === 'IMG') {
                    cleanContainer.appendChild(el.cloneNode(true));
                } else if (el.textContent.trim().length > 0) {
                    // For text elements, wrap them in clean tags if needed
                    const p = document.createElement('p');
                    p.innerHTML = el.innerHTML;
                    cleanContainer.appendChild(p);
                }
            });
            streetDetails.innerHTML = cleanContainer.innerHTML;
        } else {
            // Fallback for very simple pages
            streetDetails.innerHTML = content.innerHTML;
        }
    };

    // Close Modal
    function closeStreetModal() {
        streetModal.classList.remove('active');
        document.getElementById('streetDetails').innerHTML = '';
        document.body.style.overflow = 'auto';
    }

    closeModal.addEventListener('click', closeStreetModal);

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === streetModal) {
            closeStreetModal();
        }
    });

    // Close on Escape key
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && streetModal.classList.contains('active')) {
            closeStreetModal();
        }
    });
});
