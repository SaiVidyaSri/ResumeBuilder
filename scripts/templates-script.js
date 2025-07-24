// ==================================================================================
// UTILITY FUNCTIONS
// ==================================================================================

/**
 * Gets the current user ID from localStorage or sessionStorage.
 * IMPORTANT: Ensure you are setting 'userId' in localStorage or sessionStorage after a successful login.
 * @returns {string|null} The user ID or null if not found.
 */
function getCurrentUserId() {
    return localStorage.getItem("userId") || sessionStorage.getItem("userId");
}

/**
 * Displays a notification message on the screen.
 * @param {string} message - The message to display.
 * @param {string} [type='success'] - The type of notification ('success' or 'error').
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Add some basic styling
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 15px;
        border-radius: 5px;
        z-index: 1001;
        opacity: 0;
        transition: opacity 0.5s;
    `;

    // Fade in
    setTimeout(() => {
        notification.style.opacity = 1;
    }, 100);

    // Fade out and remove
    setTimeout(() => {
        notification.style.opacity = 0;
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 500);
    }, 3000);
}

// ==================================================================================
// API AND DATA HANDLING FUNCTIONS
// ==================================================================================

/**
 * Fetches all resume templates from the backend API.
 * @returns {Promise<Array>} A promise that resolves to an array of template objects.
 */
async function fetchResumeTemplates() {
    try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch templates: ${response.status} ${response.statusText} - ${errorText}`);
        }
        // It's good practice to check content-type before parsing as JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        } else {
            throw new Error("Received non-JSON response from server");
        }
    } catch (error) {
        console.error("Error fetching templates from API:", error);
        const templatesGrid = document.getElementById('templatesGrid');
        if (templatesGrid) {
            templatesGrid.innerHTML = 
                '<p style="text-align: center; color: #ff6b6b;">Failed to load templates. Please check the server connection and try again.</p>';
        }
        return [];
    }
}

/**
 * Toggles a template's favorite status (adds or removes).
 * @param {string} templateId - The ID of the template to add/remove from favorites.
 */
async function toggleFavoriteStatus(templateId) {
    const userId = getCurrentUserId();
    if (!userId) {
        showNotification('Please log in to manage favorites.', 'error');
        return;
    }

    // IMPORTANT: Select ALL favorite buttons for this template ID
    // This ensures both the grid button and the modal button (if open) are updated.
    const favoriteButtons = document.querySelectorAll(`.favorite-btn[data-template-id="${templateId}"]`);
    if (favoriteButtons.length === 0) return;

    // Determine the current state from the first button found (they should be in sync)
    const isCurrentlyFavorite = favoriteButtons[0].classList.contains('active');
    const method = isCurrentlyFavorite ? 'DELETE' : 'POST';

    try {
        const response = await fetch('/api/favorites', {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, templateId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update favorites');
        }
        const btn = document.getElementById(`addToFavoritesModalBtn`);
        // Update ALL relevant buttons visually
        favoriteButtons.forEach(button => {
            const icon = button.querySelector('i');
            if (isCurrentlyFavorite) {
                button.classList.remove('active');
                if (icon) icon.className = 'far fa-heart'; // Change to outline heart
                button.title = 'Add to favorites';
                btn.innerHTML = '<i class="far fa-heart"></i> Add to Favorites'; // Update modal button text
            } else {
                button.classList.add('active');
                if (icon) icon.className = 'fas fa-heart'; // Change to solid heart
                button.title = 'Remove from favorites';
                btn.innerHTML = '<i class="fas fa-heart"></i> Remove from favorites'; // Update modal button text
            }
        });

        // Show notification based on the action performed
        if (isCurrentlyFavorite) {
            showNotification('Template removed from favorites');
        } else {
            showNotification('Template added to favorites');
        }

    } catch (error) {
        console.error('Error updating favorites:', error);
        showNotification(error.message, 'error');
    }
}

// ==================================================================================
// RENDERING AND DOM MANIPULATION
// ==================================================================================

/**
 * Renders the fetched templates onto the page.
 * @param {Array} templates - An array of template objects.
 */
async function renderAPITemplates(templates) {
    const templatesGrid = document.getElementById("templatesGrid");
    if (!templatesGrid) return;

    templatesGrid.innerHTML = ""; // Clear existing content

    if (!templates || templates.length === 0) {
        templatesGrid.innerHTML = 
            '<p style="text-align: center; color: #ccc;">No templates available yet.</p>';
        return;
    }

    const userId = getCurrentUserId();

    // Use Promise.all to fetch all favorite statuses concurrently for faster loading
    const favoriteStatuses = await Promise.all(
        templates.map(template => {
            if (!userId) return { templateId: template._id, isFavorite: false };
            return fetch(`/api/favorites/check/${userId}/${template._id}`)
                .then(res => res.ok ? res.json() : { isFavorite: false })
                .then(data => ({ templateId: template._id, isFavorite: data.isFavorite }))
                .catch(() => ({ templateId: template._id, isFavorite: false }));
        })
    );

    const favoriteMap = favoriteStatuses.reduce((map, status) => {
        map[status.templateId] = status.isFavorite;
        return map;
    }, {});

    for (const template of templates) {
        const templateCard = document.createElement("div");
        templateCard.className = "template-card";
        templateCard.dataset.templateId = template._id;
        templateCard.dataset.category = template.category || "uncategorized";
        templateCard.dataset.industry = template.industry || "general";

        const isFavorite = favoriteMap[template._id] || false;

        const renderStars = (rating = 0) => {
            const fullStars = Math.floor(rating);
            const hasHalfStar = rating % 1 !== 0;
            let starsHtml = "";
            for (let i = 0; i < fullStars; i++) starsHtml += `<i class="fas fa-star"></i>`;
            if (hasHalfStar) starsHtml += `<i class="fas fa-star-half-alt"></i>`;
            const emptyStars = 5 - Math.ceil(rating);
            for (let i = 0; i < emptyStars; i++) starsHtml += `<i class="far fa-star"></i>`;
            return starsHtml;
        };

        templateCard.innerHTML = `
            <div class="template-preview">
                <img src="${template.previewImagePath || '/images/default-template.png'}" alt="${template.name}">
                <div class="template-actions">
                    <button class="preview-btn" data-template-id="${template._id}">Preview</button>
                    <button class="use-template-btn" data-template-id="${template._id}">Use Template</button>
                </div>
            </div>
            <div class="template-info">
                <h3>${template.name}</h3>
                <div class="template-meta">
                    <span class="template-category">${template.category}</span>
                    <span class="template-rating">
                        ${renderStars(template.rating)}
                        <span>(${(template.rating || 0).toFixed(1)})</span>
                    </span>
                </div>
            </div>
            <button class="favorite-btn ${isFavorite ? 'active' : ''}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}" data-template-id="${template._id}">
                <i class="${isFavorite ? 'fas' : 'far'} fa-heart"></i>
            </button>
        `;
        templatesGrid.appendChild(templateCard);
    }

    attachTemplateCardListeners();
}

/**
 * Attaches event listeners to all template card buttons.
 */
function attachTemplateCardListeners() {
    document.querySelectorAll(".preview-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            // Ensure previewTemplate is defined globally or passed as an argument
            if (typeof previewTemplate === 'function') {
                previewTemplate(this.dataset.templateId);
            }
        });
    });

    document.querySelectorAll(".use-template-btn").forEach(btn => {
        btn.addEventListener("click", function() {
            window.location.href = `template-preview.html?templateId=${this.dataset.templateId}`;
        });
    });

    document.querySelectorAll(".favorite-btn").forEach(btn => {
        // Remove old listeners to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener("click", function() {
            toggleFavoriteStatus(this.dataset.templateId);
        });
    });
    document.querySelectorAll(".addToFavoritesModalBtn").forEach(btn => {
        // Remove old listeners to prevent duplicates
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener("click", function() {
            toggleFavoriteStatus(this.dataset.templateId);
        });
    });
}

// ==================================================================================
// INITIALIZATION AND EVENT LISTENERS
// ==================================================================================

document.addEventListener("DOMContentLoaded", async function() {
    // Initialize Profile Dropdown
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');
    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        document.addEventListener('click', () => profileDropdown.classList.remove('show'));
    }

    // Initialize Mobile Navigation
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function() {
            navLinks.classList.toggle("active");
            this.classList.toggle("active");
        });
    }

    // Load Templates
    const templatesGrid = document.getElementById("templatesGrid");
    const loadingIndicator = document.getElementById("templatesLoadingIndicator");
    if (templatesGrid && loadingIndicator) {
        loadingIndicator.style.display = 'block';
    }
    try {
        const apiTemplates = await fetchResumeTemplates();
        await renderAPITemplates(apiTemplates);
    } catch (error) {
        console.error("Error initializing templates:", error);
    } finally {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }

    // Setup other page features (ensure these functions are defined)
    if (typeof setupFiltering === 'function') setupFiltering();
    if (typeof setupModals === 'function') setupModals();
    if (typeof setupPagination === 'function') setupPagination();
    if (typeof initLogoutModal === 'function') initLogoutModal();
});

// NOTE: The functions setupFiltering, setupModals, setupPagination, previewTemplate, and initLogoutModal
// are assumed to be defined elsewhere in your script. If they are not, you will need to define them or remove the calls.
// Make sure to define previewTemplate if it's not already present.
async function previewTemplate(templateId) {
    const previewModal = document.getElementById("templatePreviewModal");
    if (!previewModal) {
        console.error("Preview modal not found!");
        return;
    }

    const previewImage = document.getElementById("previewImage");
    const previewTitle = document.getElementById("previewTitle");
    const previewDescription = document.getElementById("previewDescription");
    const previewFeaturesList = document.getElementById("previewFeaturesList");
    const useTemplateModalBtn = document.getElementById("useTemplateModalBtn");
    const addToFavoritesModalBtn = document.getElementById("addToFavoritesModalBtn"); // Get reference to the button

    try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch template details: ${response.statusText}`);
        }
        const template = await response.json();

        if (previewImage) previewImage.src = template.previewImagePath || "/images/default-template.png";
        if (previewTitle) previewTitle.textContent = template.name;
        if (previewDescription) previewDescription.textContent = template.description;

        if (previewFeaturesList) {
            previewFeaturesList.innerHTML = "";
            if (template.features && Array.isArray(template.features)) {
                template.features.forEach(feature => {
                    const li = document.createElement("li");
                    li.innerHTML = `<i class="fas fa-check"></i> ${feature}`;
                    previewFeaturesList.appendChild(li);
                });
            }
        }

        if (useTemplateModalBtn) useTemplateModalBtn.href = `template-preview.html?templateId=${template._id}`;

        // --- Start of changes for Add to Favorites button in modal ---
        if (addToFavoritesModalBtn) {
            const userId = getCurrentUserId(); // Ensure getCurrentUserId is accessible
            let isFavorite = false;

            if (userId) {
                try {
                    const favCheckResponse = await fetch(`/api/favorites/check/${userId}/${template._id}`);
                    if (favCheckResponse.ok) {
                        const result = await favCheckResponse.json();
                        isFavorite = result.isFavorite;
                    }
                } catch (favError) {
                    console.error("Error checking favorite status for modal button:", favError);
                }
            }

            // Update button appearance based on favorite status
            const icon = addToFavoritesModalBtn.querySelector("i");
            if (isFavorite) {
                addToFavoritesModalBtn.classList.add("active");
                if (icon) icon.className = "fas fa-heart";
                addToFavoritesModalBtn.title = "Remove from favorites";
            } else {
                addToFavoritesModalBtn.classList.remove("active");
                if (icon) icon.className = "far fa-heart";
                addToFavoritesModalBtn.title = "Add to favorites";
            }

            // Set data-template-id and attach event listener
            addToFavoritesModalBtn.dataset.templateId = template._id;
            
            // Remove existing listener to prevent duplicates before adding a new one
            const newBtn = addToFavoritesModalBtn.cloneNode(true);
            addToFavoritesModalBtn.parentNode.replaceChild(newBtn, addToFavoritesModalBtn);
            
            newBtn.addEventListener("click", function() {
                // Call the existing toggleFavoriteStatus function
                toggleFavoriteStatus(template._id);
                // Optionally, re-check status or update button immediately after toggle
                // For simplicity, you might just toggle the class and icon here too
                const currentIcon = newBtn.querySelector("i");
                if (newBtn.classList.contains("active")) {
                    newBtn.classList.remove("active");
                    if (currentIcon) currentIcon.className = "far fa-heart";
                    newBtn.title = "Add to favorites";
                } else {
                    newBtn.classList.add("active");
                    if (currentIcon) currentIcon.className = "fas fa-heart";
                    newBtn.title = "Remove from favorites";
                }
            });
        }
        // --- End of changes for Add to Favorites button in modal ---

        previewModal.style.display = "block";

    } catch (error) {
        console.error("Error showing template preview:", error);
        showNotification("Could not load template details. Please try again.", "error");
    }
}

function setupModals() {
    const previewModal = document.getElementById("templatePreviewModal");
    if (!previewModal) return;

    const closeModalBtn = previewModal.querySelector(".close-modal");
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            previewModal.style.display = "none";
        });
    }

    window.addEventListener("click", (e) => {
        if (e.target === previewModal) {
            previewModal.style.display = "none";
        }
    });
}


function setupFiltering() {
    const searchInput = document.getElementById("templateSearch");
    const searchBtn = document.getElementById("searchBtn");

    if (searchInput) {
        // Real-time search as user types
        searchInput.addEventListener("input", function() {
            filterTemplatesBySearch();
        });

        // Search on Enter key press
        searchInput.addEventListener("keyup", function(e) {
            if (e.key === "Enter") {
                filterTemplatesBySearch();
            }
        });
    }

    if (searchBtn) {
        // Search on button click
        searchBtn.addEventListener("click", function() {
            filterTemplatesBySearch();
        });
    }
}

/**
 * Filters templates based on search input
 */
function filterTemplatesBySearch() {
    const searchInput = document.getElementById("templateSearch");
    const templatesGrid = document.getElementById("templatesGrid");
    
    if (!searchInput || !templatesGrid) return;
    
    const searchTerm = searchInput.value.toLowerCase().trim();
    const templateCards = Array.from(templatesGrid.querySelectorAll(".template-card"));

    templateCards.forEach(card => {
        const templateName = card.querySelector("h3").textContent.toLowerCase();
        const templateCategory = card.dataset.category ? card.dataset.category.toLowerCase() : '';
        
        // Show card if search term matches name or category, or if search is empty
        if (searchTerm === '' || 
            templateName.includes(searchTerm) || 
            templateCategory.includes(searchTerm)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });

    // Show message if no templates match
    const visibleCards = templateCards.filter(card => card.style.display !== "none");
    
    // Remove existing "no results" message
    const existingMessage = templatesGrid.querySelector(".no-results-message");
    if (existingMessage) {
        existingMessage.remove();
    }

    if (visibleCards.length === 0 && searchTerm !== '') {
        const noResultsMessage = document.createElement("div");
        noResultsMessage.className = "no-results-message";
        noResultsMessage.style.cssText = `
            grid-column: 1 / -1;
            text-align: center;
            color: #666;
            font-size: 18px;
            padding: 40px;
            background: #f9f9f9;
            border-radius: 8px;
            margin: 20px 0;
        `;
        noResultsMessage.innerHTML = `
            <i class="fas fa-search" style="font-size: 48px; color: #ddd; margin-bottom: 16px;"></i>
            <p>No templates found matching "${searchTerm}"</p>
            <p style="font-size: 14px; color: #999;">Try searching with different keywords</p>
        `;
        templatesGrid.appendChild(noResultsMessage);
    }
}

// Dummy functions for completeness, replace with your actual implementation if needed
function setupPagination() { console.log("Pagination setup placeholder"); }
function initLogoutModal() { console.log("Logout modal setup placeholder"); }

