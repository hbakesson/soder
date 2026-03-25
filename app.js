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
        contentFrame.src = street.path;
        streetModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    };

    // Close Modal
    function closeStreetModal() {
        streetModal.classList.remove('active');
        contentFrame.src = '';
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
