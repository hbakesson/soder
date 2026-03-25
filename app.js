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
    window.openStreet = async (id) => {
        const street = streetData.find(s => s.id === id);
        if (!street) return;

        modalTitle.textContent = street.name;
        const streetDetails = document.getElementById('streetDetails');
        streetDetails.innerHTML = '<div class="loader"><div class="spinner"></div></div>';
        streetModal.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch(street.path);
            const html = await response.text();
            
            // Parse the HTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract the main content (usually inside <BODY> or a <TABLE>)
            const content = doc.body;
            
            // Standardize paths for images and links
            const folderPath = street.id === '.' ? 'sodermalm.one/' : street.path.substring(0, street.path.lastIndexOf('/') + 1);
            
            // Fix images
            content.querySelectorAll('img').forEach(img => {
                const src = img.getAttribute('src');
                if (src && !src.startsWith('http') && !src.startsWith('/')) {
                    img.src = folderPath + src;
                }
                // Remove fixed widths/heights to allow CSS to control them
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

            // Clean up the content (remove tables but keep inner content)
            // A simple way is to just take the innerHTML of body but we want to be cleaner
            // We'll remove original layout tables but keep their content
            const cleanedHTML = content.innerHTML;
            streetDetails.innerHTML = cleanedHTML;
            
        } catch (error) {
            console.error('Error fetching street details:', error);
            streetDetails.innerHTML = '<p class="error">Kunde inte ladda detaljinformation.</p>';
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
