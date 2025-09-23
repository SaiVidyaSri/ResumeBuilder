document.addEventListener('DOMContentLoaded', function() {
    // Utility function to get current user ID
    function getCurrentUserId() {
        // Check localStorage and sessionStorage for userId
        const userId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
        if (!userId) {
            console.warn('No user ID found in storage');
            return null;
        }
        return userId;
    }
    
    // Get current user ID (you'll need to implement this based on your auth system)
    const currentUserId = getCurrentUserId();
    
    console.log('Profile Script - Current User ID:', currentUserId);
    
    if (!currentUserId) {
        console.error('No user ID found. Profile functionality may not work correctly.');
        showNotification('Please log in to view your profile', 'error');
        return;
    }
    
    // Initialize profile functionality
    initializeProfile();
    initializeModal();
    initializePasswordForm();
    
    // Existing code for menu toggle, tabs, etc. (keep your existing code)
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
    
    // Tab functionality (keep existing)
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });
    
    // Profile functionality
    async function initializeProfile() {
        try {
            await loadProfileData();
            await updateStatistics();
        } catch (error) {
            console.error('Error initializing profile:', error);
            showNotification('Failed to load profile data', 'error');
        }
    }
    
    async function loadProfileData() {
        try {
            console.log(`Loading profile data for user: ${currentUserId}`);
            const response = await fetch(`/api/users/${currentUserId}/profile`);
            
            if (!response.ok) {
                console.error('Profile API response not OK:', response.status, response.statusText);
                throw new Error('Failed to fetch profile data');
            }
            
            const data = await response.json();
            console.log('Profile data received:', data);
            
            updateProfileDisplay(data);
            populateFormFields(data);
            
        } catch (error) {
            console.error('Error loading profile data:', error);
            // Show empty state
            console.log('Using fallback empty state for profile');
            updateProfileDisplay({
                user: { fullName: '', email: '', username: '', avatar: null },
                personalInfo: { phone: '', location: '', bio: '' },
                completion: { percentage: 0 }
            });
        }
    }
    
    function updateProfileDisplay(data) {
        console.log('Updating profile display with data:', data);
        
        // Update profile name
        const profileName = document.getElementById('profileName');
        if (profileName) {
            const name = data.user?.fullName || 'Add your name';
            profileName.textContent = name;
            console.log('Updated profile name to:', name);
        } else {
            console.error('profileName element not found');
        }
        
        // Update profile meta
        const profileMeta = document.getElementById('profileMeta');
        if (profileMeta) {
            if (data.user?.memberSince) {
                const memberDate = new Date(data.user.memberSince).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long'
                });
                profileMeta.textContent = `Member since ${memberDate}`;
                console.log('Updated profile meta to member since:', memberDate);
            } else {
                profileMeta.textContent = 'Complete your profile to get started';
                console.log('Updated profile meta to default message');
            }
        } else {
            console.error('profileMeta element not found');
        }
    }
    
    /**
     * Update resume statistics in the profile
     */
    async function updateStatistics() {
        try {
            const userId = getCurrentUserId();
            console.log('UpdateStatistics - User ID:', userId);
            
            if (!userId) {
                console.warn('No user ID available for statistics');
                return;
            }
            
            console.log(`Fetching statistics from: /api/user-templates/${userId}?limit=100`);
            const response = await fetch(`/api/user-templates/${userId}?limit=100`);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Statistics API response:', data);
                
                const resumes = data.templates || [];
                console.log('Found resumes:', resumes.length);
                
                // Calculate statistics
                const totalResumes = resumes.length;
                const totalDownloads = resumes.reduce((sum, resume) => sum + (resume.downloads || 0), 0);
                
                console.log('Statistics calculated - Resumes:', totalResumes, 'Downloads:', totalDownloads);
                
                // Update statistics display
                const resumeCountElement = document.getElementById('resumeCount');
                const downloadCountElement = document.getElementById('downloadCount');
                
                if (resumeCountElement) {
                    resumeCountElement.textContent = totalResumes;
                    console.log('Updated resumeCount element');
                } else {
                    console.error('resumeCount element not found');
                }
                
                if (downloadCountElement) {
                    downloadCountElement.textContent = totalDownloads;
                    console.log('Updated downloadCount element');
                } else {
                    console.error('downloadCount element not found');
                }
                
            } else {
                console.error('Failed to fetch user templates for statistics. Status:', response.status);
                console.error('Response:', await response.text());
            }
        } catch (error) {
            console.error('Error updating statistics:', error);
        }
    }
    
    function populateFormFields(data) {
        // Populate main form fields
        const fields = {
            'fullName': data.user.fullName,
            'email': data.user.email,
            'phone': data.personalInfo.phone,
            'location': data.personalInfo.location,
            'bio': data.personalInfo.bio,
            'username': data.user.username
        };
        
        Object.keys(fields).forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = fields[fieldId] || '';
                field.placeholder = field.placeholder || `Enter your ${fieldId.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
            }
        });
    }
    
    // Modal functionality
    function initializeModal() {
        const editProfileBtn = document.getElementById('editProfileBtn');
        const profileEditModal = document.getElementById('profileEditModal');
        const closeModalBtn = document.getElementById('closeModalBtn');
        const cancelModalBtn = document.getElementById('cancelModalBtn');
        const saveProfileBtn = document.getElementById('saveProfileBtn');
        
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', openProfileModal);
        }
        
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeProfileModal);
        }
        
        if (cancelModalBtn) {
            cancelModalBtn.addEventListener('click', closeProfileModal);
        }
        
        if (saveProfileBtn) {
            saveProfileBtn.addEventListener('click', saveProfileData);
        }
        
        // Close modal when clicking outside
        if (profileEditModal) {
            profileEditModal.addEventListener('click', function(e) {
                if (e.target === profileEditModal) {
                    closeProfileModal();
                }
            });
        }
    }
    
    function openProfileModal() {
        const modal = document.getElementById('profileEditModal');
        if (modal) {
            // Populate modal fields with current data
            const fields = ['fullName', 'email', 'phone', 'location', 'bio', 'username'];
            fields.forEach(fieldId => {
                const mainField = document.getElementById(fieldId);
                const modalField = document.getElementById(`modal${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
                if (mainField && modalField) {
                    modalField.value = mainField.value;
                }
            });
            
            modal.classList.add('active');
        }
    }
    
    function closeProfileModal() {
        const modal = document.getElementById('profileEditModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    async function saveProfileData() {
        try {
            const formData = {
                fullName: document.getElementById('modalFullName').value,
                email: document.getElementById('modalEmail').value,
                phone: document.getElementById('modalPhone').value,
                location: document.getElementById('modalLocation').value,
                bio: document.getElementById('modalBio').value,
                username: document.getElementById('modalUsername').value
            };
            
            const response = await fetch(`/api/users/${currentUserId}/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to update profile');
            }
            
            showNotification('Profile updated successfully!', 'success');
            closeProfileModal();
            await loadProfileData(); // Refresh the display
            
        } catch (error) {
            console.error('Error saving profile:', error);
            showNotification('Failed to update profile', 'error');
        }
    }

    // Password form functionality
    function initializePasswordForm() {
        const privacySecurityTab = document.getElementById('privacy-security');
        const updateSecurityBtn = privacySecurityTab?.querySelector('.primary-btn');
        
        if (updateSecurityBtn) {
            updateSecurityBtn.addEventListener('click', async function(e) {
                e.preventDefault();
                await handlePasswordUpdate();
            });
        }
    }

    async function handlePasswordUpdate() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        // Validate input fields
        if (!currentPassword) {
            showNotification('Please enter your current password', 'error');
            return;
        }

        if (!newPassword) {
            showNotification('Please enter a new password', 'error');
            return;
        }

        if (!confirmPassword) {
            showNotification('Please confirm your new password', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('New passwords do not match', 'error');
            return;
        }

        // Validate password requirements
        if (!validatePassword(newPassword)) {
            showNotification('Password does not meet requirements', 'error');
            return;
        }

        try {
            const response = await fetch(`/api/users/${currentUserId}/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    currentPassword: currentPassword,
                    newPassword: newPassword
                })
            });

            const result = await response.json();

            if (response.ok) {
                showNotification('Password updated successfully!', 'success');
                // Clear the form
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                document.getElementById('confirmPassword').value = '';
            } else {
                showNotification(result.message || 'Failed to update password', 'error');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            showNotification('Failed to update password. Please try again.', 'error');
        }
    }

    function validatePassword(password) {
        // At least 8 characters
        if (password.length < 8) return false;
        
        // At least one uppercase letter
        if (!/[A-Z]/.test(password)) return false;
        
        // At least one number
        if (!/\d/.test(password)) return false;
        
        // At least one special character
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
        
        return true;
    }
    
    // Enhanced notification function
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icon = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        const bgColor = type === 'success' ? 'rgba(46, 204, 113, 0.9)' : 'rgba(231, 76, 60, 0.9)';
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icon}"></i>
                <span>${message}</span>
            </div>
        `;
        
        const style = document.createElement('style');
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                animation: slideIn 0.3s ease, fadeOut 0.5s ease 2.5s forwards;
            }
            
            .notification-content {
                background-color: ${bgColor};
                color: white;
                padding: 15px 20px;
                border-radius: 4px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
            }
            
            .notification-content i {
                margin-right: 10px;
                font-size: 1.2rem;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            
            @keyframes fadeOut {
                from {
                    opacity: 1;
                }
                to {
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
    
    // Keep your existing logout modal functionality
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
            
            const cancelBtn = logoutModal.querySelector('.cancel-btn');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', function() {
                    logoutModal.classList.remove('active');
                });
            }
            
            const logoutBtn = logoutModal.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', function() {
                    window.location.href = 'index.html';
                });
            }
            
            logoutModal.addEventListener('click', function(e) {
                if (e.target === logoutModal) {
                    logoutModal.classList.remove('active');
                }
            });
        }
    }
    
    initLogoutModal();
    
    // Keep your existing form submission handlers
    const profileForms = document.querySelectorAll('.profile-form');
    
    profileForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data and save to database
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            // Call the save function
            saveProfileData();
        });
    });
    
    const cancelButtons = document.querySelectorAll('.secondary-btn');
    
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            const form = this.closest('form');
            if (form) {
                form.reset();
            }
        });
    });
    
    const deleteAccountBtn = document.querySelector('.danger-btn');
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                alert('Account deletion request submitted. You will receive a confirmation email.');
            }
        });
    }
});

