// Favorites and Saved Templates JavaScript
console.log('Favorites script file loaded');

document.addEventListener('DOMContentLoaded', function() {
    console.log('Favorites script DOM loaded!');
    // Initialize navigation components
    initProfileDropdown();
    initMobileNavigation();
    initLogoutModal();
    updateBreadcrumbs();
    setActiveNavLink();
    
    // Load favorites
    loadFavorites();
    
    // Initialize sort functionality
    initSortFunctionality();
    
    // Initialize clear all functionality
    initClearAllFunctionality();
    setupPreviewModal(); 
});

// Get current user ID
function getCurrentUserId() {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
}

function initProfileDropdown() {
    console.log('Initializing profile dropdown...');
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');

    if (!profileIcon || !profileDropdown) {
        console.error('Profile elements not found!');
        return;
    }

    profileIcon.setAttribute('tabindex', '0');
    
    const toggleDropdown = (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('show');
        console.log('Dropdown visibility:', profileDropdown.classList.contains('show'));
    };

    profileIcon.addEventListener('click', toggleDropdown);
    
    profileIcon.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            toggleDropdown(e);
        }
    });

    document.addEventListener('click', () => {
        profileDropdown.classList.remove('show');
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            profileDropdown.classList.remove('show');
        }
    });

    profileDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
}

// Load favorites from backend
async function loadFavorites() {
    const favoritesContainer = document.getElementById('favorites-container');
    const emptyState = document.getElementById('empty-favorites');
    
    if (!favoritesContainer) return;
    
    const userId = getCurrentUserId();
    
    if (!userId) {
        console.error('No user ID found');
        if (emptyState) {
            emptyState.innerHTML = `
                <div class="empty-icon">
                    <i class="fas fa-user-slash"></i>
                </div>
                <h4>Please log in</h4>
                <p>You need to be logged in to view your favorite templates</p>
                <a href="index.html" class="primary-btn">Login</a>
            `;
            emptyState.style.display = 'flex';
        }
        return;
    }
    
    // Clear container except empty state
    Array.from(favoritesContainer.children).forEach(child => {
        if (child.id !== 'empty-favorites') {
            favoritesContainer.removeChild(child);
        }
    });
    
    try {
        const response = await fetch(`/api/favorites/${userId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch favorites: ${response.status}`);
        }
        
        const result = await response.json();
        const favorites = result.data || [];
        
        // Show/hide empty state
        if (favorites.length === 0) {
            if (emptyState) emptyState.style.display = 'flex';
            return;
        } else {
            if (emptyState) emptyState.style.display = 'none';
        }
        
        // Create template cards for each favorite
        favorites.forEach(favorite => {
            if (favorite.templateId) {
                const templateCard = createTemplateCard(favorite.templateId, favorite.dateAdded);
                favoritesContainer.appendChild(templateCard);
            }
        });
        
    } catch (error) {
        console.error('Error loading favorites:', error);
        if (emptyState) {
            emptyState.innerHTML = `
                <div class="empty-icon">
                    <i class="fas fa-exclamation-triangle"></i>
                </div>
                <h4>Error loading favorites</h4>
                <p>There was an error loading your favorite templates. Please try again.</p>
                <button onclick="loadFavorites()" class="primary-btn">Retry</button>
            `;
            emptyState.style.display = 'flex';
        }
    }
}

// Create template card element
function createTemplateCard(template, dateAdded) {
    const card = document.createElement('div');
    card.className = 'template-card';
    card.dataset.templateId = template._id;
    
    // Generate star ratings dynamically
    const renderStars = (rating) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let starsHtml = "";
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        if (hasHalfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        return starsHtml;
    };
    
    card.innerHTML = `
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
                <span class="template-category">${template.category || 'Professional'}</span>
                <span class="template-rating">
                    ${renderStars(template.rating)}
                    <span>(${template.rating.toFixed(1)})</span>
                </span>
                <span class="template-date">Added ${formatDate(dateAdded)}</span>
            </div>
        </div>
        <button class="favorite-btn active" title="Remove from favorites" data-template-id="${template._id}">
            <i class="fas fa-heart"></i>
        </button>
    `;
    
    // Add event listeners
    const favoriteBtn = card.querySelector('.favorite-btn');
    favoriteBtn.addEventListener('click', function() {
        removeFromFavorites(template._id);
    });
    
    const previewBtn = card.querySelector('.preview-btn');
    previewBtn.addEventListener('click', function() {
        previewTemplate(template._id);
    });
    
    const useTemplateBtn = card.querySelector('.use-template-btn');
    useTemplateBtn.addEventListener('click', function() {
        useTemplate(template._id);
    });
    
    return card;
}

// Remove from favorites
async function removeFromFavorites(templateId) {
    const userId = getCurrentUserId();
    
    if (!userId) {
        alert('Please log in to manage favorites');
        return;
    }

    try {
        const response = await fetch('/api/favorites', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                templateId: templateId
            })
        });

        if (response.ok) {
            showNotification('Template removed from favorites');
            loadFavorites(); // Reload the favorites list
        } else {
            const error = await response.json();
            console.error('Error removing from favorites:', error);
            showNotification(error.message || 'Error removing from favorites', 'error');
        }
    } catch (error) {
        console.error('Error removing from favorites:', error);
        showNotification('Error removing from favorites', 'error');
    }
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        return 'today';
    } else if (diffDays === 1) {
        return 'yesterday';
    } else if (diffDays < 7) {
        return `${diffDays} days ago`;
    } else if (diffDays < 30) {
        const weeks = Math.floor(diffDays / 7);
        return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else {
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }
}

// Preview template
async function previewTemplate(templateId) {
    const previewModal = document.getElementById("templatePreviewModal");
    if (!previewModal) {
        console.error("Preview modal element not found!");
        return;
    }

    const previewImage = document.getElementById("previewImage");
    const previewTitle = document.getElementById("previewTitle");
    const previewDescription = document.getElementById("previewDescription");
    const previewFeaturesList = document.getElementById("previewFeaturesList");
    const useTemplateModalBtn = document.getElementById("useTemplateModalBtn");
    const removeFromFavoritesBtn = document.getElementById("removeFromFavoritesBtn");

    try {
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) {
            throw new Error(`Failed to fetch template details: ${response.statusText}`);
        }
        const template = await response.json();

        // Populate the modal with the fetched template data
        if (previewImage) previewImage.src = template.previewImagePath || "/images/default-template.png";
        if (previewTitle) previewTitle.textContent = template.name;
        if (previewDescription) previewDescription.textContent = template.description;

        if (previewFeaturesList) {
            previewFeaturesList.innerHTML = ""; // Clear previous features
            if (template.features && Array.isArray(template.features)) {
                template.features.forEach(feature => {
                    const li = document.createElement("li");
                    li.innerHTML = `<i class="fas fa-check"></i> ${feature}`;
                    previewFeaturesList.appendChild(li);
                });
            }
        }

        if (useTemplateModalBtn) useTemplateModalBtn.href = `template-preview.html?templateId=${template._id}`;

        // Set up the remove button
        if (removeFromFavoritesBtn) {
            // Clone and replace the button to remove any old event listeners
            const newBtn = removeFromFavoritesBtn.cloneNode(true);
            removeFromFavoritesBtn.parentNode.replaceChild(newBtn, removeFromFavoritesBtn);

            newBtn.addEventListener("click", async () => {
                await removeFromFavorites(template._id);
                previewModal.style.display = "none"; // Close modal after removing
            });
        }

        // Display the modal
        previewModal.style.display = "block";

    } catch (error) {
        console.error("Error showing template preview:", error);
        showNotification("Could not load template details. Please try again.", "error");
    }
}
// Sets up the event listeners for the preview modal
function setupPreviewModal() {
    const previewModal = document.getElementById("templatePreviewModal");
    if (!previewModal) return;

    const closeModalBtn = previewModal.querySelector(".close");
    
    // Close modal when the 'x' is clicked
    if (closeModalBtn) {
        closeModalBtn.addEventListener("click", () => {
            previewModal.style.display = "none";
        });
    }

    // Close modal when clicking outside of the modal content
    window.addEventListener("click", (event) => {
        if (event.target === previewModal) {
            previewModal.style.display = "none";
        }
    });
}
// Use template
function useTemplate(templateId) {
    window.location.href = `template-preview.html?templateId=${templateId}`;
}

// Initialize sort functionality
function initSortFunctionality() {
    const sortSelect = document.getElementById('sort-select');
    if (!sortSelect) return;
    
    sortSelect.addEventListener('change', function() {
        const sortBy = this.value;
        sortFavorites(sortBy);
    });
}

// Sort favorites (this would need backend support for different sorting)
function sortFavorites(sortBy) {
    // For now, just reload favorites
    // You could implement different sorting on the backend
    loadFavorites();
}

// Initialize clear all functionality
function initClearAllFunctionality() {
    const clearAllBtn = document.querySelector('.clear-all');
    if (!clearAllBtn) return;
    
    clearAllBtn.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (confirm('Are you sure you want to remove all templates from your favorites?')) {
            await clearAllFavorites();
        }
    });
}

// Clear all favorites
async function clearAllFavorites() {
    const userId = getCurrentUserId();
    
    if (!userId) {
        alert('Please log in to manage favorites');
        return;
    }

    try {
        // Get all favorites first
        const response = await fetch(`/api/favorites/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch favorites');
        
        const result = await response.json();
        const favorites = result.data || [];
        
        // Remove each favorite
        for (const favorite of favorites) {
            await fetch('/api/favorites', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: userId,
                    templateId: favorite.templateId._id
                })
            });
        }
        
        showNotification('All favorites have been removed');
        loadFavorites();
        
    } catch (error) {
        console.error('Error clearing favorites:', error);
        showNotification('Error clearing favorites', 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Placeholder functions for navigation features
function initMobileNavigation() {
    // Implement mobile navigation if needed
}

function initLogoutModal() {
    // Implement logout modal if needed
}

function updateBreadcrumbs() {
    // Implement breadcrumbs if needed
}

function setActiveNavLink() {
    // Implement active nav link highlighting if needed
}