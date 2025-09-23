// Enhanced Navigation and Profile Toggle JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Profile Toggle Functionality
    initProfileToggle();
    
    // Mobile Navigation
    initMobileNavigation();
    
    // Logout Modal
    initLogoutModal();
    
    // Breadcrumb Navigation
    updateBreadcrumbs();
    
    // Active Navigation Link
    setActiveNavLink();
});

// Initialize Profile Toggle
function initProfileToggle() {
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');
    
    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (profileDropdown.classList.contains('show') && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }
}

// Initialize Mobile Navigation
function initMobileNavigation() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
}

// Initialize Logout Modal
function initLogoutModal() {
    const logoutLinks = document.querySelectorAll('.logout-link');
    const logoutModal = document.getElementById('logoutModal');
    
    if (logoutLinks.length && logoutModal) {
        logoutLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                logoutModal.classList.add('active');
            });
        });
        
        // Cancel button
        const cancelBtn = logoutModal.querySelector('.cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                logoutModal.classList.remove('active');
            });
        }
        
        // Confirm logout
        const logoutBtn = logoutModal.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() {
                // Redirect to logout page or perform logout action
                window.location.href = 'index.html';
            });
        }
        
        // Close when clicking outside
        logoutModal.addEventListener('click', function(e) {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('active');
            }
        });
    }
}

// Update Breadcrumbs based on current page
function updateBreadcrumbs() {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;
    
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop().replace('.html', '');
    
    // Define breadcrumb structure
    const breadcrumbMap = {
        'dashboard': [
            { name: 'Home', url: 'dashboard.html', active: true }
        ],
        'resume-editor': [
            { name: 'Home', url: 'dashboard.html', active: false },
            { name: 'Resume Editor', url: 'resume-editor.html', active: true }
        ],
        'templates': [
            { name: 'Home', url: 'dashboard.html', active: false },
            { name: 'Templates', url: 'templates.html', active: true }
        ],
        'profile': [
            { name: 'Home', url: 'dashboard.html', active: false },
            { name: 'Profile', url: 'profile.html', active: true }
        ],
        'favorites': [
            { name: 'Home', url: 'dashboard.html', active: false },
            { name: 'Favorites', url: 'favorites.html', active: true }
        ]
    };
    
    // Get breadcrumb items for current page
    const items = breadcrumbMap[pageName] || [];
    
    // Clear existing breadcrumb
    breadcrumb.innerHTML = '';
    
    // Build breadcrumb
    items.forEach((item, index) => {
        const breadcrumbItem = document.createElement('div');
        breadcrumbItem.className = `breadcrumb-item ${item.active ? 'active' : ''}`;
        
        if (item.active) {
            breadcrumbItem.textContent = item.name;
        } else {
            const link = document.createElement('a');
            link.href = item.url;
            link.textContent = item.name;
            breadcrumbItem.appendChild(link);
        }
        
        breadcrumb.appendChild(breadcrumbItem);
        
        // Add separator if not last item
        if (index < items.length - 1) {
            const separator = document.createElement('div');
            separator.className = 'breadcrumb-separator';
            separator.textContent = '/';
            breadcrumb.appendChild(separator);
        }
    });
}

// Set active navigation link based on current page
function setActiveNavLink() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop().replace('.html', '');
    
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(pageName)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Also check dropdown items
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(pageName)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Function to navigate between pages with data persistence
function navigateTo(url, data = null) {
    if (data) {
        // Store data in sessionStorage for use on the next page
        sessionStorage.setItem('navigationData', JSON.stringify(data));
    }
    window.location.href = url;
}

// Function to retrieve navigation data on page load
function getNavigationData() {
    const dataString = sessionStorage.getItem('navigationData');
    if (dataString) {
        try {
            const data = JSON.parse(dataString);
            // Clear after retrieving to avoid stale data
            sessionStorage.removeItem('navigationData');
            return data;
        } catch (e) {
            console.error('Error parsing navigation data:', e);
            return null;
        }
    }
    return null;
}

// Add to favorites functionality
function addToFavorites(templateId, templateName, templateImage) {
    // Get existing favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('favoriteTemplates')) || [];
    
    // Check if already in favorites
    const existingIndex = favorites.findIndex(fav => fav.id === templateId);
    
    if (existingIndex >= 0) {
        // Already in favorites, remove it
        favorites.splice(existingIndex, 1);
        showNotification(`Removed "${templateName}" from favorites`);
    } else {
        // Add to favorites
        favorites.push({
            id: templateId,
            name: templateName,
            image: templateImage,
            dateAdded: new Date().toISOString()
        });
        showNotification(`Added "${templateName}" to favorites`);
    }
    
    // Save updated favorites
    localStorage.setItem('favoriteTemplates', JSON.stringify(favorites));
    
    // Update UI if on favorites page
    if (window.location.pathname.includes('favorites.html')) {
        loadFavorites();
    }
    
    // Update favorite buttons
    updateFavoriteButtons(templateId);
}

// Update favorite button states
function updateFavoriteButtons(templateId) {
    // Get existing favorites from localStorage
    let favorites = JSON.parse(localStorage.getItem('favoriteTemplates')) || [];
    
    // Check if template is in favorites
    const isFavorite = favorites.some(fav => fav.id === templateId);
    
    // Update all buttons for this template
    const favoriteButtons = document.querySelectorAll(`.favorite-btn[data-template-id="${templateId}"]`);
    favoriteButtons.forEach(btn => {
        const icon = btn.querySelector('i');
        if (isFavorite) {
            btn.classList.add('active');
            if (icon) {
                icon.className = 'fas fa-heart';
            }
            btn.title = 'Remove from favorites';
        } else {
            btn.classList.remove('active');
            if (icon) {
                icon.className = 'far fa-heart';
            }
            btn.title = 'Add to favorites';
        }
    });
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="${type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after animation
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}
