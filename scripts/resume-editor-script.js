document.addEventListener("DOMContentLoaded", function() {
    
    initializeApp();
    
    
    loadSavedData();
    loadResumeHeadline();
    
    updateProfileCompletion();
    
    // Test connectivity and fetch profile
    const userId = getCurrentUserId();
    console.log('Testing connectivity and fetching profile for user ID:', userId);
    
    // Test server connectivity first
    testServerConnectivity().then(connected => {
        console.log('Server connectivity test result:', connected);
        if (connected) {
            fetchUserProfile(userId);
        } else {
            console.error('Server connectivity failed, cannot fetch profile');
        }
    });

    
    const profileIcon = document.getElementById("profileIcon");
    const profileDropdown = document.getElementById("profileDropdown");

    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener("click", function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle("show");
        });

        document.addEventListener("click", function(e) {
            if (!e.target.closest(".user-profile-nav")) {
                profileDropdown.classList.remove("show");
            }
        });

        profileDropdown.querySelectorAll(".dropdown-item").forEach(item => {
            item.addEventListener("click", function() {
                profileDropdown.classList.remove("show");
            });
        });
    }

    
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function() {
            navLinks.classList.toggle("active");
            this.classList.toggle("active");
        });
    }

    
    const sidebarLinks = document.querySelectorAll(".sidebar-link");
    const resumeSections = document.querySelectorAll(".resume-section");
    
    sidebarLinks.forEach(link => {
        link.addEventListener("click", function(e) {
            e.preventDefault();
            
            sidebarLinks.forEach(l => l.classList.remove("active"));
            this.classList.add("active");
            
            const targetId = this.getAttribute("href").substring(1);
            const targetSection = document.getElementById(targetId);
            
            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 100,
                    behavior: "smooth"
                });
            }
        });
    });
    
    
    window.addEventListener("scroll", function() {
        const scrollPosition = window.scrollY;
        
        resumeSections.forEach(section => {
            const sectionTop = section.offsetTop - 120;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute("id");
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                sidebarLinks.forEach(link => {
                    link.classList.remove("active");
                    if (link.getAttribute("href") === `#${sectionId}`) {
                        link.classList.add("active");
                    }
                });
            }
        });
    });
    
    
    const addNowButtons = document.querySelectorAll(".add-now-btn");
    
    addNowButtons.forEach(button => {
        button.addEventListener("click", function() {
            const sectionId = this.closest(".resume-section").getAttribute("id");
            openModal(sectionId);
        });
    });
    
    
    const addButtons = document.querySelectorAll(".add-btn");
    
    addButtons.forEach(button => {
        button.addEventListener("click", function() {
            const itemTitle = this.closest(".item-header").querySelector("h3").textContent;
            openAccomplishmentModal(itemTitle);
        });
    });
    
    
    const editSectionButtons = document.querySelectorAll(".edit-section-btn");
    
    editSectionButtons.forEach(button => {
        button.addEventListener("click", function() {
            const sectionId = this.closest(".resume-section").getAttribute("id");
            openModal(sectionId);
        });
    });
    
    
    const editProfileBtn = document.querySelector(".edit-profile-btn");
    
    // if (editProfileBtn) {
    //     editProfileBtn.addEventListener("click", function() {
    //         openProfileModal();
    //     });
    // }
    
    
    const backBtn = document.querySelector(".back-btn");
    
    if (backBtn) {
        backBtn.addEventListener("click", function() {
            window.location.href = "dashboard.html";
        });
    }
    
    
    const nextBtn = document.querySelector(".next-btn");
    
    if (nextBtn) {
        nextBtn.addEventListener("click", function() {
            window.location.href = "templates.html";
        });
    }
    
    
    const saveAllBtn = document.querySelector(".save-all-btn");
    
    if (saveAllBtn) {
        saveAllBtn.addEventListener("click", function() {
            saveAllData();
            showNotification("All changes saved successfully!");
        });
    }

    
    setupAddMoreButtons();
});

// API Helper Functions
async function makeAPICall(endpoint, method = 'GET', data = null) {
    try {
        const userId = getCurrentUserId();
        const token = localStorage.getItem('token');
        
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        if (data) {
            config.body = JSON.stringify({ userId, ...data });
        }

        const response = await fetch(endpoint, config);
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        return result;
    } catch (error) {
        console.error(`API call failed for ${endpoint}:`, error);
        throw error;
    }
}

// Test basic connectivity to server
async function testServerConnectivity() {
    console.log("=== TESTING SERVER CONNECTIVITY ===");
    try {
        // Test basic server response
        const response = await fetch('/');
        console.log("Basic server connectivity test:", response.status);
        
        // Test API base
        const apiTest = await fetch('/api/users');
        console.log("API connectivity test:", apiTest.status);
        
        return true;
    } catch (error) {
        console.error("Server connectivity failed:", error);
        return false;
    }
}

async function fetchUserProfile(userId) {
    console.log("=== fetchUserProfile called with userId:", userId);
    try {
        console.log("Making fetch request to:", `/api/users/${userId}/profile`);
        const response = await fetch(`/api/users/${userId}/profile`);
        console.log("API response received:", response);
        console.log("API response status:", response.status);
        console.log("API response ok:", response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log("Error response text:", errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        
        const data = await response.json();
        console.log("Profile data received:", data);
        
        updateProfileCardUI(data);
        populateEditModal(data);
    } catch (error) {
        console.error("=== FULL ERROR DETAILS ===");
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
        console.error("Full error object:", error);
        showNotification(`Failed to load profile data: ${error.message || 'Unknown error'}`, "error");
    }
}
function populateEditModal(profileData) {
    // Extract data from the new API response structure
    const user = profileData.user || {};
    const personalInfo = profileData.personalInfo || {};
    
    // Store current file input state to preserve it
    const fileInput = document.getElementById("editProfilePicture");
    const hasSelectedFile = fileInput && fileInput.files && fileInput.files.length > 0;
    console.log("=== POPULATE EDIT MODAL ===");
    console.log("File input has selected file:", hasSelectedFile);
    if (hasSelectedFile) {
        console.log("Preserving selected file:", fileInput.files[0].name);
    }
    
    document.getElementById("editFirstName").value = user.fullName ? user.fullName.split(' ')[0] : "";
    document.getElementById("editLastName").value = user.fullName ? user.fullName.split(' ').slice(1).join(' ') : "";
    document.getElementById("editMobileNumber").value = personalInfo.phone || "";
    document.getElementById("editLocation").value = personalInfo.location || "";
    document.getElementById("editEmail").value = user.email || "";
    document.getElementById("editBio").value = personalInfo.bio || "";
    
    // Only update the preview if no file is currently selected
    if (!hasSelectedFile) {
        const profilePicturePreview = document.getElementById("profilePicturePreview");
        if (user.avatar) {
            profilePicturePreview.src = `/uploads/profile_pictures/${user.avatar}`;
            profilePicturePreview.style.display = "block";
        } else {
            profilePicturePreview.src = "/images/default-avatar.png";
            profilePicturePreview.style.display = "block";
        }
    } else {
        console.log("Skipping preview update to preserve selected file preview");
    }
}

    document.getElementById("editProfilePicture").addEventListener("change", function(event) {
        const [file] = event.target.files;
        const profilePicturePreview = document.getElementById("profilePicturePreview");
        if (file) {
            profilePicturePreview.src = URL.createObjectURL(file);
            profilePicturePreview.style.display = "block";
        } else {
            profilePicturePreview.src = "";
            profilePicturePreview.style.display = "none";
        }
    });

document.getElementById("saveProfileBtn").addEventListener("click", async function() {
    console.log("=== SAVE BUTTON CLICKED ===");
    
    // First, let's check the file input state immediately
    const fileInput = document.getElementById("editProfilePicture");
    console.log("File input element found:", !!fileInput);
    console.log("File input files property:", fileInput ? fileInput.files : "No input found");
    console.log("File input files length:", fileInput ? fileInput.files.length : "N/A");
    
    const userId = getUserIdFromSession();
    if (!userId) {
        console.error("User ID not found. Cannot save profile.");
        showNotification("Please log in to save profile changes", "error");
        return;
    }

    const firstName = document.getElementById("editFirstName").value.trim();
    const lastName = document.getElementById("editLastName").value.trim();
    const phone = document.getElementById("editMobileNumber").value.trim();
    const location = document.getElementById("editLocation").value.trim();
    const email = document.getElementById("editEmail").value.trim();
    const bio = document.getElementById("editBio").value.trim();
    
    const fullName = `${firstName} ${lastName}`.trim();

    // Handle profile picture upload separately if a new file is selected
    const profilePictureFile = document.getElementById("editProfilePicture").files[0];
    
    try {
        console.log("=== STARTING PROFILE SAVE OPERATION ===");
        console.log("User ID:", userId);
        console.log("Profile data to save:", { firstName, lastName, phone, location, email, bio });
        console.log("=== FILE INPUT DEBUG ===");
        console.log("File input element:", document.getElementById("editProfilePicture"));
        console.log("Files array:", document.getElementById("editProfilePicture").files);
        console.log("Files array length:", document.getElementById("editProfilePicture").files.length);
        console.log("Profile picture file:", profilePictureFile);
        console.log("Profile picture file name:", profilePictureFile ? profilePictureFile.name : "No file selected");
        console.log("Profile picture file size:", profilePictureFile ? profilePictureFile.size : "N/A");
        
        // Upload profile picture first if a new one is selected
        if (profilePictureFile) {
            console.log("=== UPLOADING AVATAR ===");
            const avatarFormData = new FormData();
            avatarFormData.append("avatar", profilePictureFile);
            
            console.log("Making avatar upload request to:", `/api/users/${userId}/avatar`);
            const avatarResponse = await fetch(`/api/users/${userId}/avatar`, {
                method: "POST",
                body: avatarFormData,
            });
            
            console.log("Avatar upload response status:", avatarResponse.status);
            console.log("Avatar upload response ok:", avatarResponse.ok);
            
            if (!avatarResponse.ok) {
                const errorData = await avatarResponse.json();
                console.error("Avatar upload failed:", errorData);
                throw new Error(`Failed to upload avatar: ${errorData.error}`);
            }
            
            const avatarResult = await avatarResponse.json();
            console.log("Avatar upload result:", avatarResult);
        }

        // Update profile data
        const profileData = {
            user: {
                fullName: fullName,
                email: email
            },
            personalInfo: {
                phone: phone,
                location: location,
                bio: bio
            }
        };

        console.log("=== UPDATING PROFILE DATA ===");
        console.log("Profile data payload:", JSON.stringify(profileData, null, 2));
        console.log("Making profile update request to:", `/api/users/${userId}/profile`);
        
        const response = await fetch(`/api/users/${userId}/profile`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(profileData),
        });

        console.log("Profile update response status:", response.status);
        console.log("Profile update response ok:", response.ok);

        if (!response.ok) {
            const errorData = await response.json();
            console.error("Profile update failed:", errorData);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.error}`);
        }

        const result = await response.json();
        console.log("Profile update result:", result);
        
        console.log("=== UPDATING UI WITH RESULT DATA ===");
        // Update the UI directly with the response data instead of fetching again
        updateProfileCardUI(result);
        
        closeModal();
        showNotification("Profile updated successfully!", "success");
        
    } catch (error) {
        console.error("Error saving profile:", error);
        showNotification(`Error saving profile: ${error.message}`, "error");
    }
});


     const editProfileBtn = document.getElementById("editProfileBtn");
    const profileEditModal = document.getElementById("profileEditModal"); 
    const closeBtn = document.getElementById("closeModalBtn"); 

    editProfileBtn.addEventListener("click", () => {
        console.log("=== EDIT PROFILE BUTTON CLICKED ===");
        profileEditModal.classList.add("active");
        
        // Only fetch profile data if we don't have it yet (form fields are empty)
        const firstNameField = document.getElementById("editFirstName");
        if (!firstNameField || !firstNameField.value.trim()) {
            console.log("Form fields empty, fetching profile data...");
            const currentUserId = getUserIdFromSession();
            if (currentUserId) {
                fetchUserProfile(currentUserId);
            }
        } else {
            console.log("Form already populated, skipping profile fetch to preserve file selection");
        }
    });
    
    // Test button for debugging
    const testFetchBtn = document.getElementById("testFetchBtn");
    if (testFetchBtn) {
        testFetchBtn.addEventListener("click", () => {
            console.log("=== MANUAL TEST FETCH TRIGGERED ===");
            const userId = getCurrentUserId();
            console.log("Test fetch with user ID:", userId);
            fetchUserProfile(userId);
        });
    }

    closeBtn.addEventListener("click", () => {
        console.log("=== MODAL CLOSED BY CLOSE BUTTON ===");
        closeModal();
    });

    profileEditModal.addEventListener("click", (event) => {
        if (event.target === profileEditModal) {
            console.log("=== MODAL CLOSED BY CLICKING OUTSIDE ===");
            closeModal();
        }
    });

    // Add file input change listener for debugging
    const profilePictureInput = document.getElementById("editProfilePicture");
    if (profilePictureInput) {
        profilePictureInput.addEventListener("change", (event) => {
            console.log("=== FILE INPUT CHANGED ===");
            console.log("Files selected:", event.target.files.length);
            if (event.target.files.length > 0) {
                console.log("Selected file:", event.target.files[0].name);
                console.log("File size:", event.target.files[0].size);
                console.log("File type:", event.target.files[0].type);
            }
        });
    }

    function closeModal() {
        profileEditModal.classList.remove("active");
        
        // Clear the file input when modal is closed to reset state
        const fileInput = document.getElementById("editProfilePicture");
        if (fileInput) {
            fileInput.value = "";
            console.log("File input cleared on modal close");
        }
        
        // Reset preview to current avatar
        const currentUserId = getUserIdFromSession();
        if (currentUserId) {
            // Refresh the form with latest data for next time modal opens
            setTimeout(() => {
                fetchUserProfile(currentUserId);
            }, 100);
        }
    }

    function getUserIdFromSession() {
    // This is a placeholder. Replace with your actual logic to get the logged-in user\'s ID.
    // For example, from localStorage, a cookie, or a global JS variable set after login.
    return localStorage.getItem("userId"); // Assuming you store it here after successful login
}
// Refactored Data Storage Functions
async function saveToDatabase(sectionId, data) {
    try {
        const endpointMap = {
            'resume-headline': '/api/resume-headline',
            'key-skills': '/api/key-skills',
            'education': '/api/education',
            'it-skills': '/api/it-skills',
            'projects': '/api/projects',
            'profile-summary': '/api/profile-summary',
            'career-profile': '/api/career-profile',
            'personal-details': '/api/personal-details'
        };

        const endpoint = endpointMap[sectionId];
        if (!endpoint) {
            throw new Error(`No API endpoint found for section: ${sectionId}`);
        }

        const result = await makeAPICall(endpoint, 'POST', data);
        return result.data;
    } catch (error) {
        console.error(`Error saving ${sectionId} to database:`, error);
        showNotification(`Error saving ${sectionId}: ${error.message}`, true);
        throw error;
    }
}

async function updateInDatabase(sectionId, entryId, data) {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            throw new Error('No user ID found');
        }

        const endpointMap = {
            'education': `/api/education/${entryId}`,
            'it-skills': `/api/it-skills/${entryId}`,
            'projects': `/api/projects/${entryId}`,
            'career-profile': `/api/career-profile/${entryId}`
        };

        const endpoint = endpointMap[sectionId];
        if (!endpoint) {
            throw new Error(`No update endpoint found for section: ${sectionId}`);
        }

        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, ...data })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        return result.data;
    } catch (error) {
        console.error(`Error updating ${sectionId} in database:`, error);
        showNotification(`Error updating ${sectionId}: ${error.message}`, true);
        throw error;
    }
}

async function loadFromDatabase(sectionId) {
    try {
        const userId = getCurrentUserId();
        if (!userId) return null;

        const endpointMap = {
            'resume-headline': `/api/resume-headline/${userId}`,
            'key-skills': `/api/key-skills/${userId}`,
            'education': `/api/education/${userId}`,
            'it-skills': `/api/it-skills/${userId}`,
            'projects': `/api/projects/${userId}`,
            'profile-summary': `/api/profile-summary/${userId}`,
            'career-profile': `/api/career-profile/${userId}`,
            'personal-details': `/api/personal-details/${userId}`
        };

        const endpoint = endpointMap[sectionId];
        if (!endpoint) {
            console.warn(`No API endpoint found for section: ${sectionId}`);
            return null;
        }

        const result = await makeAPICall(endpoint, 'GET');
        return result.data;
    } catch (error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
            // Data doesn't exist yet, return null
            return null;
        }
        console.error(`Error loading ${sectionId} from database:`, error);
        return null;
    }
}

async function saveAccomplishmentToDatabase(type, data) {
    try {
        const endpointMap = {
            'Online profile': '/api/online-profile',
            'Work sample': '/api/work-sample',
            'Research publication / Journal entry': '/api/publication',
            'Presentation': '/api/presentation',
            'Patent': '/api/patent',
            'Certification': '/api/certification'
        };

        const endpoint = endpointMap[type];
        if (!endpoint) {
            throw new Error(`No API endpoint found for accomplishment type: ${type}`);
        }

        const result = await makeAPICall(endpoint, 'POST', data);
        return result.data;
    } catch (error) {
        console.error(`Error saving ${type} accomplishment to database:`, error);
        showNotification(`Error saving ${type}: ${error.message}`, true);
        throw error;
    }
}


async function loadAccomplishmentsFromDatabase() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return {};

        const accomplishmentTypes = [
            'Online profile',
            'Work sample', 
            'Research publication / Journal entry',
            'Presentation',
            'Patent',
            'Certification'
        ];

        const endpointMap = {
            'Online profile': `/api/online-profile/${userId}`,
            'Work sample': `/api/work-sample/${userId}`,
            'Research publication / Journal entry': `/api/publication/${userId}`,
            'Presentation': `/api/presentation/${userId}`,
            'Patent': `/api/patent/${userId}`,
            'Certification': `/api/certification/${userId}`
        };

        const accomplishments = {};

        for (const type of accomplishmentTypes) {
            try {
                const endpoint = endpointMap[type];
                const result = await makeAPICall(endpoint, 'GET');
                if (result.data && result.data.length > 0) {
                    accomplishments[type] = result.data;
                }
            } catch (error) {
                if (!error.message.includes('404') && !error.message.includes('not found')) {
                    console.error(`Error loading ${type} accomplishments:`, error);
                }
            }
        }

        return accomplishments;
    } catch (error) {
        console.error('Error loading accomplishments from database:', error);
        return {};
    }
}

// Legacy functions replaced with database calls
function saveToLocalStorage(key, data) {
    console.warn('saveToLocalStorage is deprecated. Use saveToDatabase instead.');
    // Keep for backward compatibility but don't actually save to localStorage
}

function loadFromLocalStorage(key) {
    console.warn('loadFromLocalStorage is deprecated. Use loadFromDatabase instead.');
    // Keep for backward compatibility but return null
    return null;
}

async function saveAllData() {
    try {
        showNotification("Saving all data...");
        
        // Get all current data from the UI and save to database
        const sections = ["resume-headline", "key-skills", "education", "it-skills", "projects", 
                         "profile-summary", "career-profile", "personal-details"];
        
        const savePromises = [];
        
        for (const sectionId of sections) {
            try {
                const data = await loadFromDatabase(sectionId);
                if (data) {
                    // Data already exists in database, no need to save again
                    continue;
                }
            } catch (error) {
                console.log(`Section ${sectionId} not found in database, will be saved when user adds data`);
            }
        }

        await Promise.all(savePromises);
        showNotification("All data saved successfully!");
    } catch (error) {
        console.error('Error saving all data:', error);
        showNotification("Error saving data. Please try again.", true);
    }
}

function updateProfileCardUI(profileData) {
    console.log("=== updateProfileCardUI called with:", profileData);

    const profileAvatarImg = document.getElementById("profileAvatar");
    const defaultAvatarIcon = document.getElementById("defaultAvatarIcon");

    // Handle new data structure
    const user = profileData.user || {};
    const personalInfo = profileData.personalInfo || {};
    const completion = profileData.completion || {};

    console.log("Extracted data:", { user, personalInfo, completion });

    // Update profile picture
    if (user.avatar) {
        const imgSrc = user.avatar.startsWith('/') ? user.avatar : `/uploads/profile_pictures/${user.avatar}`;
        profileAvatarImg.src = imgSrc;
        profileAvatarImg.style.display = "block";
        if (defaultAvatarIcon) defaultAvatarIcon.style.display = "none";
    } else {
        profileAvatarImg.src = "/images/default-avatar.png";
        profileAvatarImg.style.display = "block";
        if (defaultAvatarIcon) defaultAvatarIcon.style.display = "none";
    }

    // Update profile information
    const nameElement = document.getElementById("profileName");
    const locationElement = document.getElementById("profileLocation");
    const mobileElement = document.getElementById("profileMobile");
    const progressElement = document.getElementById("progressPercentage");
    
    console.log("DOM elements found:", {
        nameElement: !!nameElement,
        locationElement: !!locationElement,
        mobileElement: !!mobileElement,
        progressElement: !!progressElement
    });
    
    if (nameElement) nameElement.textContent = user.fullName || "Add your name";
    if (locationElement) locationElement.textContent = personalInfo.location || "Add your location";
    if (mobileElement) mobileElement.textContent = personalInfo.phone || "Add your mobile number";
    if (progressElement) progressElement.textContent = `${completion.percentage || 0}%`;
    
    // Update email if element exists
    const emailElement = document.getElementById("profileEmail");
    if (emailElement) {
        emailElement.textContent = user.email || "Add your email";
    }

    // Progress circle
    const progressCircle = document.getElementById("progressCircle");
    if (progressCircle) {
        const radius = progressCircle.r.baseVal.value;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - ((completion.percentage || 0) / 100) * circumference;
        progressCircle.style.strokeDashoffset = offset;
    }
    
    // Update statistics
    updateStatistics();
}

/**
 * Update resume statistics in the profile card
 */
async function updateStatistics() {
    try {
        const userId = getCurrentUserId();
        if (!userId) return;
        
        const response = await fetch(`/api/user-templates/${userId}?limit=100`);
        if (response.ok) {
            const data = await response.json();
            const resumes = data.templates || [];
            
            // Calculate statistics
            const totalResumes = resumes.length;
            const totalDownloads = resumes.reduce((sum, resume) => sum + (resume.downloads || 0), 0);
            
            // Update statistics display
            const resumeCountElement = document.getElementById('resumeCount');
            const downloadCountElement = document.getElementById('downloadCount');
            
            if (resumeCountElement) resumeCountElement.textContent = totalResumes;
            if (downloadCountElement) downloadCountElement.textContent = totalDownloads;
            
        } else {
            console.error('Failed to fetch user templates for statistics');
        }
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

function getProfileData() {
    
    
    return {
        name: document.querySelector(".profile-name") ? document.querySelector(".profile-name").textContent : "",
        email: document.querySelector(".contact-item:nth-child(1) span") ? document.querySelector(".contact-item:nth-child(1) span").textContent : "",
        phone: document.querySelector(".contact-item:nth-child(2) span") ? document.querySelector(".contact-item:nth-child(2) span").textContent : "",
        location: document.querySelector(".contact-item:nth-child(3) span") ? document.querySelector(".contact-item:nth-child(3) span").textContent : ""
    };
}

// Test server connectivity
async function testServerConnectivity() {
    try {
        console.log('Testing server connectivity...');
        const response = await fetch('/api/test-connection', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            console.log('Server connectivity test: SUCCESS');
            return true;
        } else {
            console.log('Server connectivity test: FAILED - Response not OK');
            return false;
        }
    } catch (error) {
        console.error('Server connectivity test: FAILED - Error:', error);
        return false;
    }
}

async function loadSavedData() {
    try {
        
        const sections = ["resume-headline", "key-skills", "education", "it-skills", "projects", 
                         "profile-summary", "career-profile", "personal-details"];
        
        for (const sectionId of sections) {
            try {
                const data = await loadFromDatabase(sectionId);
                if (data) {
                    displaySectionData(sectionId, data);
                }
            } catch (error) {
                console.error(`Error loading ${sectionId}:`, error);
            }
        }
        
        // Load accomplishments
        try {
            const accomplishmentsData = await loadAccomplishmentsFromDatabase();
            for (const type in accomplishmentsData) {
                if (accomplishmentsData.hasOwnProperty(type)) {
                    displayAccomplishmentData(type, accomplishmentsData[type]);
                }
            }
        } catch (error) {
            console.error('Error loading accomplishments:', error);
        }
    } catch (error) {
        console.error('Error loading saved data:', error);
        showNotification("Error loading saved data. Please refresh the page.", true);
    }
}

function displaySectionData(sectionId, data) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const emptyState = section.querySelector(".empty-state");
    const contentCards = section.querySelector(".content-cards");
    const addMoreSection = section.querySelector(".add-more-section");

    if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
        if (emptyState) emptyState.style.display = "none";
        if (contentCards) {
            contentCards.style.display = "block";
            contentCards.innerHTML = "";
            
            if (Array.isArray(data)) {
                data.forEach((item, index) => {
                    const card = createDataCard(sectionId, item, index);
                    contentCards.appendChild(card);
                });
                
                
                if (["education", "projects", "career-profile"].includes(sectionId) && addMoreSection) {
                    addMoreSection.style.display = "block";
                }
            } else {
                const card = createDataCard(sectionId, data);
                contentCards.appendChild(card);
            }
        }
    } else {
        
        if (emptyState) emptyState.style.display = "block";
        if (contentCards) contentCards.style.display = "none";
        if (addMoreSection) addMoreSection.style.display = "none";
    }
}

function createDataCard(sectionId, data, index = null) {
    const card = document.createElement("div");
    card.className = "data-card";
    
    let cardContent = "";
    
    switch (sectionId) {
        case "resume-headline":
            cardContent = `
                <div class="card-content">
                    <p>${data.headline}</p>
                </div>
            `;
            break;
            
        case "key-skills":
            cardContent = `
                <div class="card-content">
                    <div class="skills-display">
                        ${data.skills.map(skill => `<span class="skill-tag-display">${skill}</span>`).join("")}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editKeySkills()">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            `;
            break;
            
        case "education":
            cardContent = `
                <div class="card-content">
                    <h4>${data.degree} from ${data.institute}</h4>
                    <p>${data.field} | ${data.startYear} - ${data.endYear}</p>
                    ${data.grade ? `<p>Grade: ${data.grade}</p>` : ""}
                    ${data.description ? `<p>${data.description}</p>` : ""}
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editCard('${sectionId}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteCard('${sectionId}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
            
        case "it-skills":
            cardContent = `
                <div class="card-content">
                    <h4>${data.skillName}</h4>
                    <p><strong>Level:</strong> ${data.level}</p>
                    <p><strong>Experience:</strong> ${data.experience}</p>
                    ${data.lastUsed ? `<p><strong>Last Used:</strong> ${data.lastUsed}</p>` : ""}
                    ${data.version ? `<p><strong>Version:</strong> ${data.version}</p>` : ""}
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editCard('${sectionId}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteCard('${sectionId}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
            
        case "projects":
            cardContent = `
                <div class="card-content">
                    <h4>${data.title}</h4>
                    ${data.client ? `<p><strong>Client:</strong> ${data.client}</p>` : ""}
                    <p><strong>Role:</strong> ${data.role}</p>
                    <p><strong>Duration:</strong> ${data.startDate} - ${data.ongoing ? "Ongoing" : data.endDate}</p>
                    ${data.url ? `<p><strong>URL:</strong> <a href="${data.url}" target="_blank">${data.url}</a></p>` : ""}
                    <p>${data.description}</p>
                    ${data.skills && data.skills.length > 0 ? `
                        <div class="skills-display">
                            ${data.skills.map(skill => `<span class="skill-tag-display">${skill}</span>`).join("")}
                        </div>
                    ` : ""}
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editCard('${sectionId}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteCard('${sectionId}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
            
        case "profile-summary":
            cardContent = `
                <div class="card-content">
                    <p>${data.summary}</p>
                </div>
            `;
            break;
            
        case "career-profile":
            cardContent = `
                <div class="card-content">
                    <h4>${data.jobTitle} at ${data.company}</h4>
                    <p>${data.startDate} - ${data.currentlyWorking ? "Present" : data.endDate}</p>
                    ${data.location ? `<p><strong>Location:</strong> ${data.location}</p>` : ""}
                    ${data.employmentType ? `<p><strong>Employment Type:</strong> ${data.employmentType}</p>` : ""}
                    <p>${data.description}</p>
                    ${data.skills && data.skills.length > 0 ? `
                        <div class="skills-display">
                            ${data.skills.map(skill => `<span class="skill-tag-display">${skill}</span>`).join("")}
                        </div>
                    ` : ""}
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editCard('${sectionId}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteCard('${sectionId}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
            
        case "personal-details":
            cardContent = `
                <div class="card-content">
                    ${data.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${data.dateOfBirth}</p>` : ""}
                    ${data.gender ? `<p><strong>Gender:</strong> ${data.gender}</p>` : ""}
                    ${data.maritalStatus ? `<p><strong>Marital Status:</strong> ${data.maritalStatus}</p>` : ""}
                    ${data.nationality ? `<p><strong>Nationality:</strong> ${data.nationality}</p>` : ""}
                    ${data.passportNumber ? `<p><strong>Passport:</strong> ${data.passportNumber}</p>` : ""}
                    ${data.languages && data.languages.length > 0 ? `
                        <div class="languages-display">
                            <strong>Languages:</strong>
                            <ul>
                                ${data.languages.map(lang => `<li>${lang.name} (${lang.proficiency})</li>`).join("")}
                            </ul>
                        </div>
                    ` : ""}
                    ${data.hobbies ? `<p><strong>Hobbies:</strong> ${data.hobbies}</p>` : ""}
                </div>
            `;
            break;
    }
    
    card.innerHTML = cardContent;
    return card;
}

async function editCard(sectionId, entryId) {
    try {
        const data = await loadFromDatabase(sectionId);
        if (data && Array.isArray(data)) {
            const entryToEdit = data.find(item => item._id === entryId);
            if (entryToEdit) {
                openModalWithData(sectionId, entryToEdit, entryId);
            } else {
                showNotification("Entry not found for editing.", true);
            }
        } else if (data && !Array.isArray(data)) {
            // For single-entry sections like profile summary
            openModalWithData(sectionId, data, entryId);
        }
    } catch (error) {
        console.error(`Error loading data for editing ${sectionId}:`, error);
        showNotification("Error loading data for editing. Please try again.", true);
    }
}

async function deleteCard(sectionId, entryId) {
    if (confirm("Are you sure you want to delete this item?")) {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                showNotification("Please sign in first", true);
                return;
            }

            const endpointMap = {
                'education': `/api/education/${entryId}`,
                'it-skills': `/api/it-skills/${entryId}`,
                'projects': `/api/projects/${entryId}`,
                'career-profile': `/api/career-profile/${entryId}`
            };

            const endpoint = endpointMap[sectionId];
            if (!endpoint) {
                showNotification("Delete not supported for this section yet.", true);
                return;
            }

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId })
            });

            const result = await response.json();

            if (response.ok) {
                showNotification("Item deleted successfully!");
                // Reload and refresh the display
                const updatedData = await loadFromDatabase(sectionId);
                if (updatedData) {
                    displaySectionData(sectionId, updatedData);
                }
                updateProfileCompletion();
            } else {
                throw new Error(result.message || 'Failed to delete item');
            }

        } catch (error) {
            console.error(`Error deleting ${sectionId} item:`, error);
            showNotification("Error deleting item. Please try again.", true);
        }
    }
}

function setupAddMoreButtons() {
    
    document.addEventListener("click", function(e) {
        if (e.target.classList.contains("add-more-btn")) {
            const section = e.target.closest(".resume-section");
            const sectionId = section.getAttribute("id");
            openModal(sectionId);
        }
    });
}


function openModal(sectionId, editIndex = null) {
    let modalId;
    
    switch(sectionId) {
        case "resume-headline":
            modalId = "resumeHeadlineModal";
            break;
        case "key-skills":
            modalId = "keySkillsModal";
            break;
        case "education":
            modalId = "educationModal";
            populateYearDropdowns("educationStartYear");
            populateYearDropdowns("educationEndYear");
            break;
        case "it-skills":
            modalId = "itSkillsModal";
            break;
        case "projects":
            modalId = "projectsModal";
            break;
        case "profile-summary":
            modalId = "profileSummaryModal";
            break;
        case "career-profile":
            modalId = "careerProfileModal";
            break;
        case "personal-details":
            modalId = "personalDetailsModal";
            break;
        default:
            return;
    }
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
        modal.setAttribute("data-edit-id", editIndex !== null ? editIndex : "");        
        
        setTimeout(() => {
            const input = modal.querySelector(".modal-input");
            if (input) input.focus();
        }, 300);
    }
}

function openModalWithData(sectionId, data, editId = null) {
    openModal(sectionId, editId);
    
    const modal = document.getElementById(getModalId(sectionId));
    if (modal && data) {
        populateModalWithData(modal, data, sectionId);
    }
}

function getModalId(sectionId) {
    const modalMap = {
        "resume-headline": "resumeHeadlineModal",
        "key-skills": "keySkillsModal",
        "education": "educationModal",
        "it-skills": "itSkillsModal",
        "projects": "projectsModal",
        "profile-summary": "profileSummaryModal",
        "career-profile": "careerProfileModal",
        "personal-details": "personalDetailsModal"
    };
    return modalMap[sectionId];
}

function populateModalWithData(modal, data, sectionId) {
    
    Object.keys(data).forEach(key => {
        const input = modal.querySelector(`#${key}`) || modal.querySelector(`[name="${key}"]`);
        if (input) {
            if (input.type === "checkbox") {
                input.checked = data[key];
            } else {
                input.value = data[key];
            }
        }
    });
    
    
    if (sectionId === "key-skills" && data.skills) {
        const skillsContainer = modal.querySelector(".skills-tags");
        skillsContainer.innerHTML = "";
        data.skills.forEach(skill => {
            addSkillTag(skillsContainer, skill);
        });
    }
    
    if (sectionId === "projects" && data.skills) {
        const skillsContainer = modal.querySelector(".project-skills");
        skillsContainer.innerHTML = "";
        data.skills.forEach(skill => {
            addSkillTag(skillsContainer, skill);
        });
    }
    
    if (sectionId === "career-profile" && data.skills) {
        const skillsContainer = modal.querySelector(".job-skills");
        skillsContainer.innerHTML = "";
        data.skills.forEach(skill => {
            addSkillTag(skillsContainer, skill);
        });
    }
    
    if (sectionId === "personal-details" && data.languages) {
        const languagesContainer = modal.querySelector(".languages-container");
        
        const entries = languagesContainer.querySelectorAll(".language-entry");
        entries.forEach((entry, index) => {
            if (index > 0) entry.remove();
        });
        
        data.languages.forEach((lang, index) => {
            if (index === 0) {
                
                const firstEntry = languagesContainer.querySelector(".language-entry");
                firstEntry.querySelector(".language-name").value = lang.name;
                firstEntry.querySelector(".language-proficiency").value = lang.proficiency;
            } else {
                
                addLanguageEntry(languagesContainer, lang);
            }
        });
    }
}

function addSkillTag(container, skillText) {
    const tag = document.createElement("div");
    tag.className = "skill-tag";
    tag.innerHTML = `
        <span>${skillText}</span>
        <button type="button" class="remove-skill">&times;</button>
    `;
    container.appendChild(tag);
    
    tag.querySelector(".remove-skill").addEventListener("click", () => {
        tag.remove();
    });
}


async function editKeySkills() {
    try {
        const data = await loadFromDatabase('key-skills');
        if (data && data.skills) {
            openModalWithData('key-skills', data);
        } else {
            // If no data exists, just open empty modal
            openModal('key-skills');
        }
    } catch (error) {
        console.error('Error loading key skills for editing:', error);
        showNotification("Error loading key skills for editing. Please try again.", true);
    }
}
function addLanguageEntry(container, langData = null) {
    const entry = document.createElement("div");
    entry.className = "language-entry";
    entry.innerHTML = `
        <div class="language-row">
            <input type="text" class="modal-input language-name" placeholder="Language name" value="${langData ? langData.name : ""}">
            <select class="modal-input language-proficiency">
                <option value="">Proficiency</option>
                <option value="Native" ${langData && langData.proficiency === "Native" ? "selected" : ""}>Native</option>
                <option value="Fluent" ${langData && langData.proficiency === "Fluent" ? "selected" : ""}>Fluent</option>
                <option value="Intermediate" ${langData && langData.proficiency === "Intermediate" ? "selected" : ""}>Intermediate</option>
                <option value="Basic" ${langData && langData.proficiency === "Basic" ? "selected" : ""}>Basic</option>
            </select>
            <button type="button" class="remove-language-btn"><i class="fas fa-times"></i></button>
        </div>
    `;
    
    const addButton = container.querySelector(".add-language-btn");
    container.insertBefore(entry, addButton);
    
    entry.querySelector(".remove-language-btn").addEventListener("click", () => {
        entry.remove();
    });
}

function openAccomplishmentModal(itemTitle) {
    let modalId;
    switch(itemTitle) {
        case "Online profile":
            modalId = "onlineProfileModal";
            break;
        case "Work sample":
            modalId = "workSampleModal";
            break;
        case "Research publication / Journal entry":
            modalId = "publicationModal";
            break;
        case "Presentation":
            modalId = "presentationModal";
            break;
        case "Patent":
            modalId = "patentModal";
            break;
        case "Certification":
            modalId = "certificationModal";
            break;
        default:
            return;
    }
    
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = "block";
        modal.removeAttribute("data-edit-id"); // This line ensures new entries are created
        
        // Clear form fields for new entry
        const form = modal.querySelector('form') || modal;
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                input.checked = false;
            } else {
                input.value = '';
            }
        });
    }
}

// function openProfileModal() {
//     const profileData = getProfileData();
    
//     const modalHTML = `
//         <div class="modal" id="profileModal">
//             <div class="modal-content">
//                 <span class="close-modal">&times;</span>
//                 <div class="modal-header">
//                     <h2>Edit Profile</h2>
//                 </div>
//                 <div class="modal-body">
//                     <p class="modal-description">Update your profile information.</p>
//                     <div class="form-group">
//                         <label>Full Name</label>
//                         <input type="text" class="modal-input" id="profileName" value="${profileData.name}">
//                     </div>
//                     <div class="form-group">
//                         <label>Email</label>
//                         <input type="email" class="modal-input" id="profileEmail" value="${profileData.email}">
//                     </div>
//                     <div class="form-group">
//                         <label>Phone</label>
//                         <input type="tel" class="modal-input" id="profilePhone" value="${profileData.phone}">
//                     </div>
//                     <div class="form-group">
//                         <label>Location</label>
//                         <input type="text" class="modal-input" id="profileLocation" value="${profileData.location}">
//                     </div>
//                 </div>
//                 <div class="modal-footer">
//                     <button class="secondary-btn cancel-btn">Cancel</button>
//                     <button class="primary-btn save-btn">Save</button>
//                 </div>
//             </div>
//         </div>
//     `;
    
//     const modalContainer = document.createElement("div");
//     modalContainer.innerHTML = modalHTML;
//     document.body.appendChild(modalContainer.firstElementChild);
    
//     const modal = document.getElementById("profileModal");
//     modal.style.display = "block";
    
//     setupModalEventListeners(modal);
// }


function initializeApp() {
    
    setupModalEventListeners();
    
    
    setupSkillsInput("#keySkillsModal .skills-input-container");
    setupSkillsInput("#projectsModal .skills-input-container");
    setupSkillsInput("#careerProfileModal .skills-input-container");
    
    
    handleDateCheckbox("projectOngoing", "projectEndDate");
    handleDateCheckbox("certificationNoExpiry", "certificationExpiryDate");
    handleDateCheckbox("currentlyWorking", "jobEndDate");
    
    
    handleOtherTypeField("profileType", "otherProfileTypeGroup", "otherProfileType");
    handleOtherTypeField("sampleType", "otherSampleTypeGroup", "otherSampleType");
    handleOtherTypeField("publicationType", "otherPublicationTypeGroup", "otherPublicationType");
    handleOtherTypeField("presentationPlatform", "otherPlatformGroup", "otherPlatform");
    
    
    setupLanguagesContainer();
}

function setupModalEventListeners(specificModal = null) {
    const modals = specificModal ? [specificModal] : document.querySelectorAll(".modal");
    
    modals.forEach(modal => {
        
        const closeBtn = modal.querySelector(".close-modal");
        const cancelBtn = modal.querySelector(".cancel-btn");
        
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                modal.style.display = "none";
                if (modal.id === "profileModal") {
                    document.body.removeChild(modal);
                }
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                modal.style.display = "none";
                if (modal.id === "profileModal") {
                    document.body.removeChild(modal);
                }
            });
        }
        
        
        const saveBtn = modal.querySelector(".save-btn");
        if (saveBtn) {
            saveBtn.addEventListener("click", () => {
                handleModalSave(modal);
            });
        }
        
        
        const textareas = modal.querySelectorAll("textarea.modal-input");
        textareas.forEach(textarea => {
            const counter = modal.querySelector(".character-counter span");
            if (counter) {
                textarea.addEventListener("input", function() {
                    const maxLength = parseInt(textarea.getAttribute("maxlength")) || 300;
                    const remainingChars = maxLength - textarea.value.length;
                    counter.textContent = remainingChars;
                });
            }
        });
    });
    
    
    window.addEventListener("click", function(e) {
        if (e.target.classList.contains("modal")) {
            e.target.style.display = "none";
            if (e.target.id === "profileModal") {
                document.body.removeChild(e.target);
            }
        }
    });
}

async function handleModalSave(modal) {
    const modalId = modal.id;
    const sectionId = modalId.replace("Modal", "").replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    const editId = modal.getAttribute("data-edit-id");
    
    let formData = {};
    
    
    switch (modalId) {
        case "resumeHeadlineModal":
            const headline = modal.querySelector("textarea").value.trim();
            if (headline.length < 5) {
                alert("Resume headline must be at least 5 words.");
                return;
            }
            formData = { headline };
            
            try {
                await saveResumeHeadline(formData.headline);
                modal.style.display = "none";
                // showNotification("Resume headline saved successfully!");
            } catch (error) {
                console.error('Error saving resume headline:', error);
                return;
            }
            break;
            
        case "keySkillsModal":
            const skills = Array.from(modal.querySelectorAll(".skills-tags .skill-tag span")).map(span => span.textContent);
            if (skills.length === 0) {
                alert("Please add at least one skill.");
                return;
            }
            formData = { skills };
            break;
            
        case "educationModal":
            formData = {
                degree: modal.querySelector("#educationDegree").value.trim(),
                institute: modal.querySelector("#educationInstitute").value.trim(),
                startYear: modal.querySelector("#educationStartYear").value,
                endYear: modal.querySelector("#educationEndYear").value,
                field: modal.querySelector("#educationField").value.trim(),
                grade: modal.querySelector("#educationGrade").value.trim(),
                description: modal.querySelector("#educationDescription").value.trim()
            };
            
            if (!formData.degree || !formData.institute || !formData.startYear || !formData.endYear || !formData.field) {
                alert("Please fill in all required fields.");
                return;
            }
            break;
            
        case "itSkillsModal":
            formData = {
                skillName: modal.querySelector("#itSkillName").value.trim(),
                level: modal.querySelector("#itSkillLevel").value,
                experience: modal.querySelector("#itSkillExperience").value,
                lastUsed: modal.querySelector("#itSkillLastUsed").value,
                version: modal.querySelector("#itSkillVersion").value.trim()
            };
            
            if (!formData.skillName || !formData.level || !formData.experience) {
                alert("Please fill in all required fields.");
                return;
            }
            break;
            
        case "projectsModal":
            const projectSkills = Array.from(modal.querySelectorAll(".project-skills .skill-tag span")).map(span => span.textContent);
            formData = {
                title: modal.querySelector("#projectTitle").value.trim(),
                client: modal.querySelector("#projectClient").value.trim(),
                startDate: modal.querySelector("#projectStartDate").value,
                endDate: modal.querySelector("#projectEndDate").value,
                ongoing: modal.querySelector("#projectOngoing").checked,
                url: modal.querySelector("#projectUrl").value.trim(),
                role: modal.querySelector("#projectRole").value.trim(),
                description: modal.querySelector("#projectDescription").value.trim(),
                skills: projectSkills
            };
            
            if (!formData.title || !formData.startDate || (!formData.endDate && !formData.ongoing) || !formData.role || !formData.description) {
                alert("Please fill in all required fields.");
                return;
            }
            break;
            
        case "profileSummaryModal":
            const summary = modal.querySelector("#profileSummaryText").value.trim();
            if (summary.length < 50) {
                alert("Profile summary should be at least 50 characters.");
                return;
            }
            formData = { summary };
            break;
            
        case "careerProfileModal":
            const jobSkills = Array.from(modal.querySelectorAll(".job-skills .skill-tag span")).map(span => span.textContent);
            formData = {
                jobTitle: modal.querySelector("#jobTitle").value.trim(),
                company: modal.querySelector("#companyName").value.trim(),
                startDate: modal.querySelector("#jobStartDate").value,
                endDate: modal.querySelector("#jobEndDate").value,
                currentlyWorking: modal.querySelector("#currentlyWorking").checked,
                location: modal.querySelector("#jobLocation").value.trim(),
                employmentType: modal.querySelector("#employmentType").value,
                description: modal.querySelector("#jobDescription").value.trim(),
                skills: jobSkills
            };
            
            if (!formData.jobTitle || !formData.company || !formData.startDate || (!formData.endDate && !formData.currentlyWorking) || !formData.description) {
                alert("Please fill in all required fields.");
                return;
            }
            break;
            
        case "personalDetailsModal":
            const languages = [];
            modal.querySelectorAll(".language-entry").forEach(entry => {
                const name = entry.querySelector(".language-name").value.trim();
                const proficiency = entry.querySelector(".language-proficiency").value;
                if (name) {
                    languages.push({ name, proficiency });
                }
            });
            
            formData = {
                dateOfBirth: modal.querySelector("#dateOfBirth").value,
                gender: modal.querySelector("#gender").value,
                maritalStatus: modal.querySelector("#maritalStatus").value,
                nationality: modal.querySelector("#nationality").value.trim(),
                passportNumber: modal.querySelector("#passportNumber").value.trim(),
                hobbies: modal.querySelector("#hobbies").value.trim(),
                languages
            };
            break;
            
        case "profileModal":
            const name = modal.querySelector("#profileName").value.trim();
            const email = modal.querySelector("#profileEmail").value.trim();
            const phone = modal.querySelector("#profilePhone").value.trim();
            const location = modal.querySelector("#profileLocation").value.trim();
            
            if (!name || !email || !phone || !location) {
                alert("Please fill in all fields.");
                return;
            }
            
            
            document.querySelector(".profile-name").textContent = name;
            document.querySelector(".contact-item:nth-child(1) span").textContent = email;
            document.querySelector(".contact-item:nth-child(2) span").textContent = phone;
            document.querySelector(".contact-item:nth-child(3) span").textContent = location;
            
            modal.style.display = "none";
            document.body.removeChild(modal);
            showNotification("Profile updated successfully!");
            return;
            
        default:
            
            if (modalId.includes("Modal")) {
                formData = collectAccomplishmentData(modal);
                if (!formData) return;
                
                const accomplishmentType = getAccomplishmentType(modalId);
                try {
                    if (editId) {
                        // Update existing accomplishment
                        await updateAccomplishmentInDatabase(accomplishmentType, editId, formData);
                    } else {
                        // Create new accomplishment
                        await saveAccomplishmentData(accomplishmentType, formData);
                    }
                    modal.style.display = "none";
                    showNotification("Accomplishment saved successfully!");
                } catch (error) {
                    console.error('Error saving accomplishment:', error);
                }
                return;
            }
    }
    
    
    if (Object.keys(formData).length > 0) {
        try {
            await saveFormData(sectionId, formData, editId);
            modal.style.display = "none";
            showNotification("Data saved successfully!");
        } catch (error) {
            console.error('Error saving form data:', error);
        }
    }
}

function getCurrentUserId() {
    let userId = localStorage.getItem('userId');
    
    // If no userId is set, automatically set a test user ID
    if (!userId || userId === 'default-user-id') {
        const testUserId = "687627950d7da3940afa2751"; // Known working user ID
        localStorage.setItem('userId', testUserId);
        console.log('Auto-set test user ID:', testUserId);
        return testUserId;
    }
    
    return userId; 
}

async function saveResumeHeadline(headline) {
    try {
        const userId = localStorage.getItem('userId');
        
        
        if (!userId || userId === 'default-user-id') {
            showNotification('Please sign in first', true);
            throw new Error('Invalid user ID in localStorage');
        }

        console.log('Attempting to save headline:', {
            userId,
            headline,
            time: new Date().toISOString()
        });

        
        const saveResponse = await fetch('/api/resume-headline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                userId, 
                headline 
            })
        });

        const saveData = await saveResponse.json();
        
        if (!saveResponse.ok) {
            throw new Error(saveData.message || 'Failed to save headline');
        }

        // showNotification('Resume headline saved successfully!');
        return saveData.data;
        
    } catch (error) {
        console.error('Complete save error:', {
            error: error.message,
            stack: error.stack,
            time: new Date().toISOString()
        });
        
        showNotification(`Error: ${error.message}`, true);
        throw error;
    }
}

async function loadResumeHeadline() {
    try {
        const userId = localStorage.getItem("userId");;
        if (!userId) return;

        const response = await fetch(`/api/resume-headline/${userId}`);
        const data = await response.json();

        if (response.ok && data.data) {
            
            const headlineTextarea = document.querySelector('#resumeHeadlineModal textarea');
            if (headlineTextarea) {
                headlineTextarea.value = data.data.headline;
            }
            
            
            displaySectionData('resume-headline', data.data);
        }
    } catch (error) {
        console.error('Error loading resume headline:', error);
    }
}

function showNotification(message, isError = false) {
    const notification = document.createElement("div");
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function collectAccomplishmentData(modal) {
    const modalId = modal.id;
    let formData = {};
    
    switch (modalId) {
        case "onlineProfileModal":
            formData = {
                type: modal.querySelector("#profileType").value,
                otherType: modal.querySelector("#otherProfileType").value.trim(),
                url: modal.querySelector("#profileUrl").value.trim(),
                description: modal.querySelector("#profileDescription").value.trim()
            };
            
            if (!formData.type || !formData.url) {
                alert("Please fill in all required fields.");
                return null;
            }
            break;
            
        case "workSampleModal":
            formData = {
                type: modal.querySelector("#sampleType").value,
                otherType: modal.querySelector("#otherSampleType").value.trim(),
                title: modal.querySelector("#sampleTitle").value.trim(),
                url: modal.querySelector("#sampleUrl").value.trim(),
                description: modal.querySelector("#sampleDescription").value.trim()
            };
            
            if (!formData.type || !formData.title || !formData.url || !formData.description) {
                alert("Please fill in all required fields.");
                return null;
            }
            break;
            
        case "publicationModal":
            formData = {
                type: modal.querySelector("#publicationType").value,
                otherType: modal.querySelector("#otherPublicationType").value.trim(),
                title: modal.querySelector("#publicationTitle").value.trim(),
                name: modal.querySelector("#publicationName").value.trim(),
                date: modal.querySelector("#publicationDate").value,
                url: modal.querySelector("#publicationUrl").value.trim(),
                description: modal.querySelector("#publicationDescription").value.trim()
            };
            
            if (!formData.type || !formData.title || !formData.name || !formData.date) {
                alert("Please fill in all required fields.");
                return null;
            }
            break;
            
        case "presentationModal":
            formData = {
                title: modal.querySelector("#presentationTitle").value.trim(),
                platform: modal.querySelector("#presentationPlatform").value,
                otherPlatform: modal.querySelector("#otherPlatform").value.trim(),
                url: modal.querySelector("#presentationUrl").value.trim(),
                date: modal.querySelector("#presentationDate").value,
                description: modal.querySelector("#presentationDescription").value.trim()
            };
            
            if (!formData.title || !formData.platform || !formData.url) {
                alert("Please fill in all required fields.");
                return null;
            }
            break;
            
        case "patentModal":
            formData = {
                title: modal.querySelector("#patentTitle").value.trim(),
                office: modal.querySelector("#patentOffice").value.trim(),
                number: modal.querySelector("#patentNumber").value.trim(),
                status: modal.querySelector("#patentStatus").value,
                filingDate: modal.querySelector("#patentFilingDate").value,
                issueDate: modal.querySelector("#patentIssueDate").value,
                url: modal.querySelector("#patentUrl").value.trim(),
                description: modal.querySelector("#patentDescription").value.trim()
            };
            
            if (!formData.title || !formData.office || !formData.number || !formData.status || !formData.filingDate || !formData.description) {
                alert("Please fill in all required fields.");
                return null;
            }
            break;
            
        case "certificationModal":
            formData = {
                name: modal.querySelector("#certificationName").value.trim(),
                organization: modal.querySelector("#certificationOrg").value.trim(),
                issueDate: modal.querySelector("#certificationIssueDate").value,
                expiryDate: modal.querySelector("#certificationExpiryDate").value,
                noExpiry: modal.querySelector("#certificationNoExpiry").checked,
                credentialId: modal.querySelector("#certificationId").value.trim(),
                url: modal.querySelector("#certificationUrl").value.trim(),
                description: modal.querySelector("#certificationDescription").value.trim()
            };
            
            if (!formData.name || !formData.organization || !formData.issueDate) {
                alert("Please fill in all required fields.");
                return null;
            }
            break;
    }
    
    return formData;
}


function openAccomplishmentModalWithData(type, data, editId = null) {
    const modalMap = {
        'Online profile': 'onlineProfileModal',
        'Work sample': 'workSampleModal',
        'Research publication / Journal entry': 'publicationModal',
        'Presentation': 'presentationModal',
        'Patent': 'patentModal',
        'Certification': 'certificationModal'
    };
    
    const modalId = modalMap[type];
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.style.display = "block";
        modal.setAttribute("data-edit-id", editId || "");
        
        // Populate the modal with existing data
        Object.keys(data).forEach(key => {
            const input = modal.querySelector(`#${key}`) || modal.querySelector(`[name="${key}"]`);
            if (input) {
                if (input.type === "checkbox") {
                    input.checked = data[key];
                } else {
                    input.value = data[key];
                }
            }
        });
        
        // Handle special cases for "Other" type fields
        if (data.type === "Other" && data.otherType) {
            const typeSelect = modal.querySelector('#profileType, #sampleType, #publicationType');
            if (typeSelect) {
                typeSelect.value = "Other";
                typeSelect.dispatchEvent(new Event('change')); // Trigger the change event
            }
        }
        
        if (data.platform === "Other" && data.otherPlatform) {
            const platformSelect = modal.querySelector('#presentationPlatform');
            if (platformSelect) {
                platformSelect.value = "Other";
                platformSelect.dispatchEvent(new Event('change'));
            }
        }
    }
}
function getAccomplishmentType(modalId) {
    const typeMap = {
        "onlineProfileModal": "Online profile",
        "workSampleModal": "Work sample",
        "publicationModal": "Research publication / Journal entry",
        "presentationModal": "Presentation",
        "patentModal": "Patent",
        "certificationModal": "Certification"
    };
    return typeMap[modalId];
}

async function saveAccomplishmentData(type, data) {
    try {
        const result = await saveAccomplishmentToDatabase(type, data);
        
        // Reload accomplishments to update the display
        const accomplishmentsData = await loadAccomplishmentsFromDatabase();
        if (accomplishmentsData[type]) {
            displayAccomplishmentData(type, accomplishmentsData[type]);
        }
        
        updateProfileCompletion();
        return result;
    } catch (error) {
        console.error(`Error saving ${type} accomplishment:`, error);
        throw error;
    }
}

function displayAccomplishmentData(type, dataArray) {
    const accomplishmentItems = document.querySelectorAll(".accomplishment-item");
    let targetItem = null;
    
    accomplishmentItems.forEach(item => {
        const title = item.querySelector("h3").textContent;
        if (title === type) {
            targetItem = item;
        }
    });
    
    if (targetItem) {
        const contentCards = targetItem.querySelector(".content-cards");
        const addBtn = targetItem.querySelector(".add-btn");
        
        contentCards.style.display = "block";
        contentCards.innerHTML = "";
        
        dataArray.forEach((data, index) => {
            const card = createAccomplishmentCard(type, data, index);
            contentCards.appendChild(card);
        });
        
        addBtn.textContent = "ADD";
    }
}

function createAccomplishmentCard(type, data, index) {
    const card = document.createElement("div");
    card.className = "data-card accomplishment-card";
    
    let cardContent = "";
    
    switch (type) {
        case "Online profile":
            cardContent = `
                <div class="card-content">
                    <h4>${data.type === "Other" ? data.otherType : data.type}</h4>
                    <p><a href="${data.url}" target="_blank">${data.url}</a></p>
                    ${data.description ? `<p>${data.description}</p>` : ""}
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
            
        case "Work sample":
            cardContent = `
                <div class="card-content">
                    <h4>${data.title}</h4>
                    <p><strong>Type:</strong> ${data.type === "Other" ? data.otherType : data.type}</p>
                    <p><a href="${data.url}" target="_blank">${data.url}</a></p>
                    <p>${data.description}</p>
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
            
        case "Research publication / Journal entry":
            cardContent = `
                <div class="card-content">
                    <h4>${data.title}</h4>
                    <p><strong>Type:</strong> ${data.type === "Other" ? data.otherType : data.type}</p>
                    <p><strong>Published in:</strong> ${data.name}</p>
                    <p><strong>Date:</strong> ${data.date}</p>
                    ${data.url ? `<p><a href="${data.url}" target="_blank">View Publication</a></p>` : ""}
                    ${data.description ? `<p>${data.description}</p>` : ""}
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
            
        case "Presentation":
            cardContent = `
                <div class="card-content">
                    <h4>${data.title}</h4>
                    <p><strong>Platform:</strong> ${data.platform === "Other" ? data.otherPlatform : data.platform}</p>
                    <p><a href="${data.url}" target="_blank">View Presentation</a></p>
                    ${data.date ? `<p><strong>Date:</strong> ${data.date}</p>` : ""}
                    ${data.description ? `<p>${data.description}</p>` : ""}
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
            
        case "Patent":
            cardContent = `
                <div class="card-content">
                    <h4>${data.title}</h4>
                    <p><strong>Patent Number:</strong> ${data.number}</p>
                    <p><strong>Office:</strong> ${data.office}</p>
                    <p><strong>Status:</strong> ${data.status}</p>
                    <p><strong>Filing Date:</strong> ${data.filingDate}</p>
                    ${data.issueDate ? `<p><strong>Issue Date:</strong> ${data.issueDate}</p>` : ""}
                    ${data.url ? `<p><a href="${data.url}" target="_blank">View Patent</a></p>` : ""}
                    <p>${data.description}</p>
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
            
        case "Certification":
            cardContent = `
                <div class="card-content">
                    <h4>${data.name}</h4>
                    <p><strong>Organization:</strong> ${data.organization}</p>
                    <p><strong>Issue Date:</strong> ${data.issueDate}</p>
                    ${!data.noExpiry && data.expiryDate ? `<p><strong>Expiry Date:</strong> ${data.expiryDate}</p>` : ""}
                    ${data.noExpiry ? `<p><strong>No Expiry</strong></p>` : ""}
                    ${data.credentialId ? `<p><strong>Credential ID:</strong> ${data.credentialId}</p>` : ""}
                    ${data.url ? `<p><a href="${data.url}" target="_blank">View Credential</a></p>` : ""}
                    ${data.description ? `<p>${data.description}</p>` : ""}
                </div>
                <div class="card-actions">
                    <button class="edit-card-btn" onclick="editAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-card-btn" onclick="deleteAccomplishmentCard('${type}', '${data._id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            break;
    }
    
    card.innerHTML = cardContent;
    return card;
}

async function updateAccomplishmentInDatabase(type, entryId, data) {
    try {
        const userId = getCurrentUserId();
        if (!userId) {
            throw new Error('No user ID found');
        }

        const endpointMap = {
            'Online profile': `/api/online-profile/${entryId}`,
            'Work sample': `/api/work-sample/${entryId}`,
            'Research publication / Journal entry': `/api/publication/${entryId}`,
            'Presentation': `/api/presentation/${entryId}`,
            'Patent': `/api/patent/${entryId}`,
            'Certification': `/api/certification/${entryId}`
        };

        const endpoint = endpointMap[type];
        if (!endpoint) {
            throw new Error(`No update endpoint found for accomplishment type: ${type}`);
        }

        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId, ...data })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `HTTP error! status: ${response.status}`);
        }

        // Reload accomplishments to update the display
        const accomplishmentsData = await loadAccomplishmentsFromDatabase();
        if (accomplishmentsData[type]) {
            displayAccomplishmentData(type, accomplishmentsData[type]);
        }
        
        updateProfileCompletion();
        return result.data;
    } catch (error) {
        console.error(`Error updating ${type} accomplishment:`, error);
        showNotification(`Error updating ${type}: ${error.message}`, true);
        throw error;
    }
}
async function editAccomplishmentCard(type, entryId) {
    try {
        const accomplishmentsData = await loadAccomplishmentsFromDatabase();
        if (accomplishmentsData[type]) {
            const entryToEdit = accomplishmentsData[type].find(item => item._id === entryId);
            if (entryToEdit) {
                openAccomplishmentModalWithData(type, entryToEdit, entryId);
            } else {
                showNotification("Accomplishment not found for editing.", true);
            }
        }
    } catch (error) {
        console.error(`Error loading ${type} accomplishment for editing:`, error);
        showNotification("Error loading accomplishment for editing. Please try again.", true);
    }
}

async function deleteAccomplishmentCard(type, entryId) {
    if (confirm("Are you sure you want to delete this accomplishment?")) {
        try {
            const userId = getCurrentUserId();
            if (!userId) {
                showNotification("Please sign in first", true);
                return;
            }

            const endpointMap = {
                'Online profile': `/api/online-profile/${entryId}`,
                'Work sample': `/api/work-sample/${entryId}`,
                'Research publication / Journal entry': `/api/publication/${entryId}`,
                'Presentation': `/api/presentation/${entryId}`,
                'Patent': `/api/patent/${entryId}`,
                'Certification': `/api/certification/${entryId}`
            };

            const endpoint = endpointMap[type];
            if (!endpoint) {
                showNotification("Delete not supported for this accomplishment type yet.", true);
                return;
            }

            const response = await fetch(endpoint, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId })
            });

            const result = await response.json();

            if (response.ok) {
                showNotification("Accomplishment deleted successfully!");
                // Reload accomplishments
                const accomplishmentsData = await loadAccomplishmentsFromDatabase();
                if (accomplishmentsData[type]) {
                    displayAccomplishmentData(type, accomplishmentsData[type]);
                } else {
                    // Clear the display if no data left
                    displayAccomplishmentData(type, []);
                }
                updateProfileCompletion();
            } else {
                throw new Error(result.message || 'Failed to delete accomplishment');
            }

        } catch (error) {
            console.error(`Error deleting ${type} accomplishment:`, error);
            showNotification("Error deleting accomplishment. Please try again.", true);
        }
    }
}

async function saveFormData(sectionId, formData, editId) {
    try {
        let result;
        
        if (editId) {
            // Update existing entry
            result = await updateInDatabase(sectionId, editId, formData);
        } else {
            // Create new entry
            result = await saveToDatabase(sectionId, formData);
        }
        
        // Reload data to update the display
        const updatedData = await loadFromDatabase(sectionId);
        if (updatedData) {
            displaySectionData(sectionId, updatedData);
        }
        
        updateProfileCompletion();
        return result;
    } catch (error) {
        console.error(`Error saving ${sectionId} form data:`, error);
        showNotification(`Error saving ${sectionId}. Please try again.`, true);
        throw error;
    }
}


function populateYearDropdowns(selectId) {
    const selectElement = document.getElementById(selectId);
    if (!selectElement || selectElement.options.length > 1) return;
    
    const currentYear = new Date().getFullYear();
    for (let year = currentYear + 5; year >= currentYear - 70; year--) {
        const option = document.createElement("option");
        option.value = year;
        option.textContent = year;
        selectElement.appendChild(option);
    }
}

function handleDateCheckbox(checkboxId, dateInputId) {
    const checkbox = document.getElementById(checkboxId);
    const dateInput = document.getElementById(dateInputId);
    if (checkbox && dateInput) {
        checkbox.addEventListener("change", () => {
            dateInput.disabled = checkbox.checked;
            if (checkbox.checked) dateInput.value = "";
        });
    }
}

function handleOtherTypeField(selectId, otherInputGroupId, otherInputId) {
    const select = document.getElementById(selectId);
    const otherGroup = document.getElementById(otherInputGroupId);
    const otherInput = document.getElementById(otherInputId);

    if (select && otherGroup && otherInput) {
        select.addEventListener("change", () => {
            if (select.value === "Other") {
                otherGroup.style.display = "block";
            } else {
                otherGroup.style.display = "none";
                otherInput.value = "";
            }
        });
    }
}

function setupSkillsInput(containerSelector, maxSkills = 15) {
    const containers = document.querySelectorAll(containerSelector);
    containers.forEach(container => {
        const skillInput = container.querySelector(".skill-input");
        const addSkillBtn = container.querySelector(".add-skill-btn");
        const skillsTagsContainer = container.querySelector(".skills-tags");

        const addSkill = (skillValue) => {
            if (skillValue.trim() !== "" && skillsTagsContainer.children.length < maxSkills) {
                addSkillTag(skillsTagsContainer, skillValue.trim());
                skillInput.value = "";
            }
        };

        if (skillInput && addSkillBtn && skillsTagsContainer) {
            addSkillBtn.addEventListener("click", () => addSkill(skillInput.value));
            skillInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill(skillInput.value);
                }
            });
        }
    });
}

function setupLanguagesContainer() {
    const languagesContainer = document.querySelector("#personalDetailsModal .languages-container");
    if (languagesContainer) {
        const addLanguageBtn = languagesContainer.querySelector(".add-language-btn");
        
        addLanguageBtn.addEventListener("click", () => {
            addLanguageEntry(languagesContainer);
        });
    }
}

async function updateProfileCompletion() {
    try {
        const sections = ["resume-headline", "key-skills", "education", "it-skills", "projects", 
                         "profile-summary", "career-profile", "personal-details"];
        
        let filledSections = 0;
        const totalSections = sections.length;
        
        for (const sectionId of sections) {
            try {
                const data = await loadFromDatabase(sectionId);
                if (data) {
                    if (Array.isArray(data) && data.length > 0) {
                        filledSections++;
                    } else if (!Array.isArray(data) && Object.keys(data).length > 0) {
                        filledSections++;
                    }
                }
            } catch (error) {
                // Section not found, continue
            }
        }
        
        // Check accomplishments
        try {
            const accomplishments = await loadAccomplishmentsFromDatabase();
            if (Object.keys(accomplishments).length > 0) {
                filledSections++; // Count accomplishments as one section
            }
        } catch (error) {
            // Accomplishments not found, continue
        }
        
        const percentage = Math.round((filledSections / (totalSections + 1)) * 100); // +1 for accomplishments
        
        
        const circle = document.querySelector(".circle");
        if (circle) {
            circle.setAttribute("stroke-dasharray", `${percentage}, 100`);
        }
        
        
        const percentageText = document.querySelector(".percentage");
        if (percentageText) {
            percentageText.textContent = `${percentage}%`;
        }
    } catch (error) {
        console.error('Error updating profile completion:', error);
    }
}

function showNotification(message) {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    
    if (!document.querySelector("#notification-styles")) {
        const style = document.createElement("style");
        style.id = "notification-styles";
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (document.body.contains(notification)) {
            document.body.removeChild(notification);
        }
    }, 3000);
}

// Utility function to set a valid user ID for testing
// Call this in the browser console: setTestUserId()
function setTestUserId() {
    const validUserId = "687627950d7da3940afa2751"; // Known working user ID
    localStorage.setItem("userId", validUserId);
    console.log("User ID set to:", validUserId);
    console.log("You can now test the profile functionality!");
    // Refresh the profile data
    if (typeof fetchUserProfile === 'function') {
        fetchUserProfile(validUserId);
    }
}

// Make it globally available for testing
window.setTestUserId = setTestUserId;

