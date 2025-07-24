
document.addEventListener('DOMContentLoaded', function() {
    

    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener('click', function() {
            navLinks.classList.toggle('active');
            this.classList.toggle('active');
        });
    }
     
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');

    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        
        document.addEventListener('click', function() {
            profileDropdown.classList.remove('show');
        });
    }
    
    
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
    
    
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            
            
            fileInput.click();
            
            
            fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    
                    reader.onload = function(e) {
                        
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.style.width = '100%';
                        img.style.height = '100%';
                        img.style.objectFit = 'cover';
                        img.style.borderRadius = '50%';
                        
                        
                        const avatarPlaceholder = document.querySelector('.avatar-placeholder');
                        avatarPlaceholder.innerHTML = '';
                        avatarPlaceholder.appendChild(img);
                        
                        
                        showNotification('Profile picture updated successfully!');
                    };
                    
                    reader.readAsDataURL(this.files[0]);
                }
            });
        });
    }
    
    
    const profileForms = document.querySelectorAll('.profile-form');
    
    profileForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            
            showNotification('Profile updated successfully!');
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
    
    
    function showNotification(message) {
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-check-circle"></i>
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
                background-color: rgba(46, 204, 113, 0.9);
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
            document.body.removeChild(notification);
        }, 3000);
    }
    
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
});
