// Admin Dashboard JavaScript

class AdminDashboard {
    constructor() {
        this.currentSection = 'dashboard';
        this.users = [];
        this.templates = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboardData();
        this.showSection('dashboard');
        document.getElementById("editTemplateForm").addEventListener("submit", this.handleEditTemplate.bind(this));

    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        document.querySelectorAll('.activity-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Profile dropdown
        const profileIcon = document.getElementById('profileIcon');
        const profileDropdown = document.getElementById('profileDropdown');
        
        profileIcon.addEventListener('click', () => {
            profileDropdown.classList.toggle('show');
        });

        // Profile dropdown actions
        document.querySelectorAll('.dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const href = item.getAttribute('href');
                
                if (href === '#logout') {
                    this.handleLogout();
                } else if (href === '#profile') {
                    this.showProfile();
                } else if (href === '#settings') {
                    this.showSettings();
                }
                
                profileDropdown.classList.remove('show');
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!profileIcon.contains(e.target) && !profileDropdown.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.querySelector('.nav-links');
        
        menuToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });

        // Add Template Modal
        const addTemplateBtn = document.getElementById('addTemplateBtn');
        const addTemplateModal = document.getElementById('addTemplateModal');
        const closeTemplateModal = document.getElementById('closeTemplateModal');
        const cancelTemplateBtn = document.getElementById('cancelTemplateBtn');

        addTemplateBtn.addEventListener('click', () => {
            this.showModal('addTemplateModal');
        });

        closeTemplateModal.addEventListener('click', () => {
            this.hideModal('addTemplateModal');
        });

        cancelTemplateBtn.addEventListener('click', () => {
            this.hideModal('addTemplateModal');
        });

        // Add Template Form
        const addTemplateForm = document.getElementById('addTemplateForm');
        addTemplateForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddTemplate(e);
        });

        // Edit User Modal
        const editUserModal = document.getElementById('editUserModal');
        const closeEditUserModal = document.getElementById('closeEditUserModal');
        const cancelEditUserBtn = document.getElementById('cancelEditUserBtn');

        closeEditUserModal.addEventListener('click', () => {
            this.hideModal('editUserModal');
        });

        cancelEditUserBtn.addEventListener('click', () => {
            this.hideModal('editUserModal');
        });

        // Edit User Form
        const editUserForm = document.getElementById('editUserForm');
        editUserForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditUser(e);
        });

        // User search and filter
        const userSearch = document.getElementById('userSearch');
        const userFilter = document.getElementById('userFilter');

        if (userSearch) {
            userSearch.addEventListener('input', () => {
                this.filterUsers();
            });
        }

        if (userFilter) {
            userFilter.addEventListener('change', () => {
                this.filterUsers();
            });
        }

        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });
    }

    showSection(sectionName) {
        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        this.currentSection = sectionName;

        // Load section-specific data
        switch (sectionName) {
            case 'users':
                this.loadUsers();
                break;
            case 'templates':
                this.loadTemplates();
                break;
            case 'dashboard':
                this.loadDashboardData();
                break;
        }
    }

    async loadDashboardData() {
        try {
            // Load user stats
            const userStatsResponse = await fetch('/api/users/stats');
            const userStats = await userStatsResponse.json();
            
            document.getElementById('totalUsersCount').textContent = userStats.totalUsers || 0;
            document.getElementById('verifiedUsersCount').textContent = 
                `Verified: ${userStats.verifiedUsers || 0}`;

            // Load template stats
            const templateStatsResponse = await fetch('/api/templates/stats');
            const templateStats = await templateStatsResponse.json();
            
            document.getElementById('totalTemplatesCount').textContent = templateStats.totalTemplates || 0;
            document.getElementById('totalDownloadsCount').textContent = templateStats.totalDownloads || 0;

        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadUsers() {
        const loadingSpinner = document.getElementById('usersLoading');
        const tableBody = document.getElementById('usersTableBody');
        
        try {
            loadingSpinner.classList.add('active');
            
            const response = await fetch('/api/users');
            this.users = await response.json();
            
            this.renderUsers(this.users);
            
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Error loading users', 'error');
        } finally {
            loadingSpinner.classList.remove('active');
        }
    }

    renderUsers(users) {
        const tableBody = document.getElementById('usersTableBody');
        
        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px;">
                        <i class="fas fa-users" style="font-size: 2rem; color: rgba(255,255,255,0.3); margin-bottom: 10px;"></i>
                        <p>No users found</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.email}</td>
                <td>
                    <span class="status-badge ${user.isVerified ? 'status-verified' : 'status-unverified'}">
                        ${user.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                </td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit-btn" onclick="adminDashboard.editUser('${user._id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="action-btn delete-btn" onclick="adminDashboard.deleteUser('${user._id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    filterUsers() {
        const searchTerm = document.getElementById('userSearch').value.toLowerCase();
        const filterValue = document.getElementById('userFilter').value;
        
        let filteredUsers = this.users;

        // Apply search filter
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.email.toLowerCase().includes(searchTerm)
            );
        }

        // Apply status filter
        if (filterValue !== 'all') {
            const isVerified = filterValue === 'verified';
            filteredUsers = filteredUsers.filter(user => user.isVerified === isVerified);
        }

        this.renderUsers(filteredUsers);
    }

    async editUser(userId) {
        try {
            const response = await fetch(`/api/users/${userId}`);
            const user = await response.json();
            
            document.getElementById('editUserId').value = user._id;
            document.getElementById('editUserEmail').value = user.email;
            document.getElementById('editUserVerified').value = user.isVerified.toString();
            
            this.showModal('editUserModal');
        } catch (error) {
            console.error('Error loading user:', error);
            this.showNotification('Error loading user data', 'error');
        }
    }

    async handleEditUser(e) {
        const formData = new FormData(e.target);
        const userId = document.getElementById('editUserId').value;
        
        const userData = {
            email: formData.get('email'),
            isVerified: formData.get('isVerified') === 'true'
        };

        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                this.showNotification('User updated successfully', 'success');
                this.hideModal('editUserModal');
                this.loadUsers();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Error updating user', 'error');
            }
        } catch (error) {
            console.error('Error updating user:', error);
            this.showNotification('Error updating user', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteUser(userId) {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/users/${userId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('User deleted successfully', 'success');
                this.loadUsers();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Error deleting user', 'error');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            this.showNotification('Error deleting user', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async loadTemplates() {
        const loadingSpinner = document.getElementById('templatesLoading');
        const templatesGrid = document.getElementById('templatesGrid');
        
        try {
            loadingSpinner.classList.add('active');
            
            const response = await fetch('/api/templates');
            this.templates = await response.json();
            
            this.renderTemplates(this.templates);
            
        } catch (error) {
            console.error('Error loading templates:', error);
            this.showNotification('Error loading templates', 'error');
        } finally {
            loadingSpinner.classList.remove('active');
        }
    }

    renderTemplates(templates) {
        const templatesGrid = document.getElementById('templatesGrid');
        
        if (templates.length === 0) {
            templatesGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
                    <i class="fas fa-file-alt" style="font-size: 3rem; color: rgba(255,255,255,0.3); margin-bottom: 20px;"></i>
                    <h3>No templates found</h3>
                    <p style="color: rgba(255,255,255,0.7); margin-bottom: 20px;">Add ATS-friendly templates to help users get hired with NextHire</p>
                    <button class="primary-btn" onclick="document.getElementById('addTemplateBtn').click()">
                        <i class="fas fa-plus"></i> Add Your First Template
                    </button>
                </div>
            `;
            return;
        }

        const editTemplateForm = document.getElementById("editTemplateForm");
        editTemplateForm.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleEditTemplate(e);
        });

        // Add event listener for the Save Changes button outside the form
        const saveChangesBtn = document.querySelector("#editTemplateModal .save");
        if (saveChangesBtn) {
            saveChangesBtn.addEventListener("click", (e) => {
                e.preventDefault();
                document.getElementById("editTemplateForm").dispatchEvent(new Event("submit"));
            });
        }
        // Inside AdminDashboard class



templatesGrid.innerHTML = templates.map(template => {
    // Create a safe stringified version of the template data
    const templateData = JSON.stringify({
        _id: template._id,
        name: template.name,
        previewImagePath: template.previewImagePath || '/images/default-template.png',
        description: template.description || 'No description available',
        features: template.features || ['No features listed'],
        category: template.category,
        rating: template.rating,
        downloads: template.downloads
    }).replace(/"/g, '&quot;');

    return `
    <div class="template-card">
        <div class="template-preview">
            <img src="${template.previewImagePath || '/images/default-template.png'}" 
                 alt="${template.name}" 
                 onerror="this.src='/images/default-template.png'"
                 onclick="adminDashboard.showTemplatePreview(${templateData})"
                 style="cursor: pointer;">
        </div>

        <div class="template-actions-top">
            <button class="action-btn edit-btn" onclick="adminDashboard.editTemplate('${template._id}')" title="Edit">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete-btn" onclick="adminDashboard.deleteTemplate('${template._id}')" title="Delete">
                <i class="fas fa-trash"></i>
            </button>
        </div>

        <div class="template-info">
            <h3>${template.name}</h3>
            <div class="template-meta">
                <span class="template-category">${template.category}</span>
                <span class="template-rating">
                    ${this.renderStars(template.rating)}
                    <span>(${template.rating})</span>
                </span>
            </div>
            <div class="template-downloads">
                <i class="fas fa-download"></i> ${template.downloads} downloads
            </div>
        </div>
    </div>
    `;
}).join('');

    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        const emptyStars = 5 - Math.ceil(rating);
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    async handleAddTemplate(e) {
        const formData = new FormData(e.target);

        try {
            this.showLoading(true);
            
            const response = await fetch('/api/templates', {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                this.showNotification('Template added successfully', 'success');
                this.hideModal('addTemplateModal');
                document.getElementById('addTemplateForm').reset();
                this.loadTemplates();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Error adding template', 'error');
            }
        } catch (error) {
            console.error('Error adding template:', error);
            this.showNotification('Error adding template', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async deleteTemplate(templateId) {
        if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`/api/templates/${templateId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('Template deleted successfully', 'success');
                this.loadTemplates();
                this.loadDashboardData();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Error deleting template', 'error');
            }
        } catch (error) {
            console.error('Error deleting template:', error);
            this.showNotification('Error deleting template', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    showLoading(show) {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (show) {
            loadingOverlay.classList.add('active');
        } else {
            loadingOverlay.classList.remove('active');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add styles if not already added
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: var(--card-bg);
                    backdrop-filter: blur(10px);
                    border-radius: var(--border-radius);
                    padding: 15px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    min-width: 300px;
                    z-index: 3000;
                    animation: slideIn 0.3s ease;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
                }
                .notification-success { border-left: 4px solid var(--success-color); }
                .notification-error { border-left: 4px solid var(--danger-color); }
                .notification-warning { border-left: 4px solid var(--warning-color); }
                .notification-info { border-left: 4px solid var(--info-color); }
                .notification-content { display: flex; align-items: center; gap: 10px; }
                .notification-close { background: none; border: none; color: var(--text-color); cursor: pointer; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);

        // Manual close
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            default: return 'fa-info-circle';
        }
    }

    handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Clear any stored session data
            localStorage.clear();
            sessionStorage.clear();
            
            // Show logout message
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = 'logout.html'; // Adjust this URL as needed
                this.showNotification('Logged out successfully', 'success');
            }, 1500);
        }
    }

    showProfile() {
        // Create and show profile modal
        const profileModal = this.createProfileModal();
        document.body.appendChild(profileModal);
        profileModal.classList.add('active');
    }

    showSettings() {
        this.showNotification('Settings functionality coming soon!', 'info');
    }

    createProfileModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = 'profileModal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-user"></i> Admin Profile</h2>
                    <button class="close4" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="profile-info">
                        <div class="profile-avatar">
                            <i class="fas fa-user-circle" style="font-size: 4rem; color: var(--secondary-color);"></i>
                        </div>
                        <div class="profile-details">
                            <h3>Admin User</h3>
                            <p><i class="fas fa-envelope"></i> hirewithnexthire@gmail.com</p>
                            <p><i class="fas fa-shield-alt"></i> Administrator</p>
                            <p><i class="fas fa-calendar"></i> Last Login: ${new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                    <div class="profile-stats">
                        <h4>Quick Stats</h4>
                        <div class="stats-grid">
                            <div class="stat-item">
                                <i class="fas fa-users"></i>
                                <span>Total Users</span>
                                <strong id="profileTotalUsers">-</strong>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-file-alt"></i>
                                <span>Total Templates</span>
                                <strong id="profileTotalTemplates">-</strong>
                            </div>
                            <div class="stat-item">
                                <i class="fas fa-download"></i>
                                <span>Total Downloads</span>
                                <strong id="profileTotalDownloads">-</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inside setupEventListeners()


        // Add profile modal styles
        if (!document.querySelector('#profile-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'profile-modal-styles';
            styles.textContent = `
                .profile-info {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: var(--border-radius);
                }
                .profile-details h3 {
                    margin-bottom: 10px;
                    color: var(--secondary-color);
                }
                .profile-details p {
                    margin-bottom: 8px;
                    color: rgba(255, 255, 255, 0.8);
                }
                .profile-details i {
                    margin-right: 10px;
                    width: 16px;
                }
                .profile-stats h4 {
                    margin-bottom: 15px;
                    color: var(--text-color);
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                }
                .stat-item {
                    text-align: center;
                    padding: 15px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: var(--border-radius);
                }
                .stat-item i {
                    font-size: 1.5rem;
                    color: var(--secondary-color);
                    margin-bottom: 8px;
                }
                .stat-item span {
                    display: block;
                    font-size: 0.9rem;
                    color: rgba(255, 255, 255, 0.7);
                    margin-bottom: 5px;
                }
                .stat-item strong {
                    font-size: 1.2rem;
                    color: var(--text-color);
                }
            `;
            document.head.appendChild(styles);
        }

        // Load profile stats
        this.loadProfileStats();

        return modal;
    }

    async loadProfileStats() {
        try {
            const [userStats, templateStats] = await Promise.all([
                fetch('/api/users/stats').then(r => r.json()),
                fetch('/api/templates/stats').then(r => r.json())
            ]);

            const profileTotalUsers = document.getElementById('profileTotalUsers');
            const profileTotalTemplates = document.getElementById('profileTotalTemplates');
            const profileTotalDownloads = document.getElementById('profileTotalDownloads');

            if (profileTotalUsers) profileTotalUsers.textContent = userStats.totalUsers || 0;
            if (profileTotalTemplates) profileTotalTemplates.textContent = templateStats.totalTemplates || 0;
            if (profileTotalDownloads) profileTotalDownloads.textContent = templateStats.totalDownloads || 0;
        } catch (error) {
            console.error('Error loading profile stats:', error);
        }
    }


    
    // Function to open the edit modal and populate it
async editTemplate(templateId) {
    try {
        this.showLoading(true);
        const response = await fetch(`/api/templates/${templateId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const template = await response.json();

        // Populate the form fields
        document.getElementById("editTemplateId").value = template._id;
        document.getElementById("editTemplateName").value = template.name;
        document.getElementById("editTemplateDescription").value = template.description;
        document.getElementById("editTemplateFeatures").value = template.features.join(", "); // Join array for textarea
        document.getElementById("editTemplateCategory").value = template.category;
        document.getElementById("editTemplateIndustry").value = template.industry || "";
        document.getElementById("editTemplateRating").value = template.rating;
                // Display current preview image path
        const currentPreviewImageSpan = document.getElementById("currentEditPreviewImage");
        if (currentPreviewImageSpan) {
            currentPreviewImageSpan.textContent = template.previewImagePath ? `Current: ${template.previewImagePath.split('/').pop()}` : "No image uploaded";
        }

        // Display current HTML file status (you might not have a direct path for HTML content stored as string)
        const currentHtmlFileSpan = document.getElementById("currentEditHtmlFile");
        if (currentHtmlFileSpan) {
            currentHtmlFileSpan.textContent = template.htmlContent ? "HTML file uploaded" : "No HTML file uploaded";
        }


        this.showModal("editTemplateModal");
    } catch (error) {
        console.error("Error fetching template for edit:", error);
        this.showNotification("Error loading template for edit", "error");
    } finally {
        this.showLoading(false);
    }
}

showTemplatePreview(template) {
    document.getElementById("previewModalImage").src = template.previewImagePath || "/images/default-template.png";
    document.getElementById("previewModalName").textContent = template.name;
    document.getElementById("previewModalDescription").textContent = template.description;

    const featuresList = document.getElementById("previewModalFeatures");
    featuresList.innerHTML = ""; // Clear previous features
    if (template.features && Array.isArray(template.features)) {
        template.features.forEach(feature => {
            const li = document.createElement("li");
            li.innerHTML = `<i class="fas fa-check"></i> ${feature}`;
            featuresList.appendChild(li);
        });
    }

    // Set up the edit button in the preview modal (if you want to keep it)
    const previewModalEditBtn = document.getElementById("previewModalEditBtn");
    previewModalEditBtn.onclick = () => {
        this.hideModal("templatePreviewModal"); // Hide preview modal
        this.editTemplate(template._id); // Call editTemplate with the template ID
    };

    this.showModal("templatePreviewModal");
}




// Function to handle the submission of the edit form
async handleEditTemplate(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const templateId = formData.get("_id"); // Get the ID from the hidden field

    try {
        this.showLoading(true);
        
        const response = await fetch(`/api/templates/${templateId}`, {
            method: "PUT", // Use PUT for updates
            body: formData
        });

        if (response.ok) {
            this.showNotification("Template updated successfully", "success");
            this.hideModal("editTemplateModal");
            this.loadTemplates(); // Reload templates to show changes
        } else {
            const error = await response.json();
            this.showNotification(error.error || "Error updating template", "error");
        }
    } catch (error) {
        console.error("Error updating template:", error);
        this.showNotification("Error updating template", "error");
    } finally {
        this.showLoading(false);
    }
}
async handleEditTemplate(e) {
    const formData = new FormData(e.target);
    const templateId = document.getElementById("editTemplateId").value;

    try {
        this.showLoading(true);
        
        const response = await fetch(`/api/templates/${templateId}`, {
            method: "PUT", // Use PUT for updates
            body: formData
        });

        if (response.ok) {
            this.showNotification("Template updated successfully", "success");
            this.hideModal("editTemplateModal");
            this.loadTemplates(); // Reload templates to show changes
        } else {
            const error = await response.json();
            this.showNotification(error.error || "Error updating template", "error");
        }
    } catch (error) {
        console.error("Error updating template:", error);
        this.showNotification("Error updating template", "error");
    } finally {
        this.showLoading(false);
    }
}
async deleteTemplate(templateId) {
    if (!confirm("Are you sure you want to delete this template?")) {
        return; // User cancelled
    }

    try {
        this.showLoading(true);
        const response = await fetch(`/api/templates/${templateId}`, {
            method: "DELETE",
        });

        if (response.ok) {
            this.showNotification("Template deleted successfully", "success");
            this.loadTemplates(); // Reload templates
        } else {
            const error = await response.json();
            this.showNotification(error.error || "Error deleting template", "error");
        }
    } catch (error) {
        console.error("Error deleting template:", error);
        this.showNotification("Error deleting template", "error");
    } finally {
        this.showLoading(false);
    }
}


}

// Initialize the admin dashboard when the page loads
let adminDashboard;
document.addEventListener('DOMContentLoaded', () => {
    adminDashboard = new AdminDashboard();
});

