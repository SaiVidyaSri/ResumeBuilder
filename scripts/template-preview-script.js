// Place these at the very top of your template-preview-script.js file
let currentTemplateId = null;
let currentUserId = null;
let currentUserData = null; // To store the fetched user's resume data
let currentCustomizations = {
    colorScheme: 'default',
    fontFamily: 'default',
    layoutStyle: 'default'
};
// CORRECTED Template Preview Script - Fixes Modal Auto-Display Issue
let isViewingUserResume = false; // Flag to track if we're viewing a user's resume

document.addEventListener("DOMContentLoaded", async function() {
    // Initialize all components
    initProfileDropdown();
    initMobileNavigation();
    initLogoutModal();
    updateBreadcrumbs();
    setActiveNavLink();
    
    // CRITICAL FIX: Initialize action buttons FIRST before loading template data
    initActionButtons();
    
    // Get template ID from URL parameters
    const templateId = getTemplateIdFromURL();
    
    if (templateId) {
        await loadTemplateData(templateId);
        // Initialize favorite button state after template is loaded
        await initializeFavoriteButton();
        
        // Only initialize template preview if we're not viewing a user's resume
        if (!isViewingUserResume) {
            console.log('🔍 CLIENT DEBUG: isViewingUserResume is false, initializing template preview');
            initializeTemplatePreview();
        } else {
            console.log('🔍 CLIENT DEBUG: isViewingUserResume is true, skipping template preview initialization');
        }
    } else {
        showError("No template ID provided in URL");
    }
    
    // Initialize other components
    initPreviewControls();
    initCustomizationOptions();
});

/**
 * CRITICAL FIX: Initialize action buttons with proper event handling
 */
function initActionButtons() {
    console.log('Initializing action buttons...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');
    const isViewMode = mode === 'view';
    
    // Download button
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        console.log('Download button found, attaching event listener');
        downloadBtn.addEventListener('click', handleDownload);
    } else {
        console.warn('Download button not found in DOM');
    }
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        console.log('Save button found, attaching event listener');
        saveBtn.addEventListener('click', handleSave);
    } else {
        console.warn('Save button not found in DOM');
    }
    
    // Use Template buttons - these might not exist in view mode
    const useTemplateBtn = document.getElementById('use-template-btn');
    const useTemplateBtnBottom = document.getElementById('use-template-btn-bottom');
    
    if (useTemplateBtn) {
        console.log('Use template button found, attaching event listener');
        useTemplateBtn.addEventListener('click', handleUseTemplate);
    } else {
        if (!isViewMode) {
            console.warn('Use template button not found in DOM');
        }
    }
    
    if (useTemplateBtnBottom) {
        console.log('Use template bottom button found, attaching event listener');
        useTemplateBtnBottom.addEventListener('click', handleUseTemplate);
    } else {
        if (!isViewMode) {
            console.warn('Use template bottom button not found in DOM');
        }
    }
    
    // Favorite button
    const favoriteBtn = document.getElementById('favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', handleFavorite);
    }
    
    // CRITICAL FIX: Ensure modal is hidden on page load using CSS class
    const saveModal = document.getElementById('saveTemplateModal');
    if (saveModal) {
        saveModal.classList.remove('show'); // Remove the show class
        console.log('Save modal found and hidden on page load');
        
        // Initialize enhanced modal features
        initSaveModalFeatures();
    }
    
    // Retry button
    const retryBtn = document.getElementById('retry-btn');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            const templateId = getTemplateIdFromURL();
            if (templateId) {
                loadTemplateData(templateId);
            }
        });
    }
}

/**
 * Initialize enhanced save modal features
 */
function initSaveModalFeatures() {
    const templateDescription = document.getElementById('templateDescription');
    const charCount = document.getElementById('charCount');
    
    if (templateDescription && charCount) {
        // Character counter functionality
        function updateCharCount() {
            const count = templateDescription.value.length;
            charCount.textContent = count;
            
            // Color coding for character count
            if (count > 180) {
                charCount.style.color = '#ff6b6b';
            } else if (count > 150) {
                charCount.style.color = '#feca57';
            } else {
                charCount.style.color = 'rgba(255, 255, 255, 0.6)';
            }
        }
        
        // Update count on input
        templateDescription.addEventListener('input', updateCharCount);
        templateDescription.addEventListener('keyup', updateCharCount);
        templateDescription.addEventListener('change', updateCharCount);
        
        // Initialize count
        updateCharCount();
        
        console.log('Save modal character counter initialized');
    }
}

/**
 * Extract template ID from URL parameters
 */
function getTemplateIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('templateId');
}

function getUserIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('userId');
}

function getModeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('mode');
}

/**
 * Load template data from backend API - handles both base templates and user resumes
 */
async function loadTemplateData(templateId) {
    showLoading();
    
    console.log('🔍 CLIENT DEBUG: loadTemplateData called with templateId:', templateId);
    console.log('🔍 CLIENT DEBUG: Current URL:', window.location.href);
    console.log('🔍 CLIENT DEBUG: URL search params:', window.location.search);
    
    try {
        const userId = getUserIdFromURL();
        const mode = getModeFromURL();
        
        console.log('🔍 CLIENT DEBUG: Extracted userId:', userId);
        console.log('🔍 CLIENT DEBUG: Extracted mode:', mode);
        
        let response;
        let template;
        
        // If mode=view, prioritize loading user's resume data
        if (mode === 'view' && userId) {
            console.log('View mode detected - loading user resume data');
            try {
                response = await fetch(`/api/user-templates/${userId}/${templateId}/populated`);
                
                if (response.ok) {
                    const data = await response.json();
                    
                    if (data.success) {
                        template = data.template;
                        isViewingUserResume = true;
                        
                        // Populate template information
                        populateTemplateInfo(template);
                        
                        // Load the populated template preview
                        await loadTemplatePreview(template, data.populatedHTML);
                        
                        // Initialize template-specific functionality
                        initTemplateActions(templateId);
                        
                        // Hide elements that don't make sense for user resume viewing
                        hideUserResumeViewElements();
                        
                        hideLoading();
                        showNotification('Your resume loaded successfully!', 'success');
                        return;
                    }
                }
            } catch (userTemplateError) {
                console.log('User template not found in view mode:', userTemplateError);
                showNotification('Resume not found, showing base template', 'warning');
            }
        }
        
        // Fallback: try to load user's resume if userId is available (for regular template preview)
        if (userId) {
            console.log('🔍 CLIENT DEBUG: Attempting to load user template');
            console.log('🔍 CLIENT DEBUG: userId =', userId);
            console.log('🔍 CLIENT DEBUG: templateId =', templateId);
            
            try {
                const apiUrl = `/api/user-templates/${userId}/${templateId}/populated`;
                console.log('🔍 CLIENT DEBUG: Calling API:', apiUrl);
                
                response = await fetch(apiUrl);
                console.log('🔍 CLIENT DEBUG: Response status:', response.status);
                console.log('🔍 CLIENT DEBUG: Response ok:', response.ok);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('🔍 CLIENT DEBUG: Response data success:', data.success);
                    console.log('🔍 CLIENT DEBUG: User data keys:', Object.keys(data.userData || {}));
                    console.log('🔍 CLIENT DEBUG: Template data received:');
                    console.log('  - Template Name:', data.template?.name);
                    console.log('  - Template Rating:', data.template?.rating);
                    console.log('  - Template Category:', data.template?.category);
                    console.log('  - Template ID:', data.template?._id);
                    
                    if (data.success) {
                        template = data.template;
                        isViewingUserResume = true; // Set this flag IMMEDIATELY when user data is loaded
                        
                        console.log('✅ CLIENT DEBUG: Successfully loaded user resume data');
                        console.log('🔍 CLIENT DEBUG: Set isViewingUserResume to true');
                        
                        // Populate template information
                        populateTemplateInfo(template);
                        
                        // Load the populated template preview
                        await loadTemplatePreview(template, data.populatedHTML);
                        
                        // Initialize template-specific functionality
                        initTemplateActions(templateId);
                        
                        // Hide elements that don't make sense for user resume viewing
                        hideUserResumeViewElements();
                        
                        hideLoading();
                        return;
                    }
                }
            } catch (userTemplateError) {
                console.error('❌ CLIENT DEBUG: Error loading user template:', userTemplateError);
                console.log('User template not found, falling back to base template:', userTemplateError);
            }
        } else {
            console.log('🔍 CLIENT DEBUG: No userId provided, loading base template');
        }
        
        // Fallback to base template if user template not found
        response = await fetch(`/api/templates/${templateId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
        }
        
        template = await response.json();
        
        // Populate template information
        populateTemplateInfo(template);
        
        // Load template preview
        await loadTemplatePreview(template);
        
        // Initialize template-specific functionality
        initTemplateActions(templateId);
        
        hideLoading();
        
    } catch (error) {
        console.error("Error loading template:", error);
        showError(`Failed to load template: ${error.message}`);
    }
}

/**
 * Load user resume preview - for viewing populated resumes
 */
async function loadUserResumePreview(populatedHTML, template) {
    // Update page title for user resume view
    document.title = `${template.name} - Resume View - NextHire`;
    
    // Update template name
    const templateNameElement = document.getElementById('template-name');
    if (templateNameElement) {
        templateNameElement.textContent = `${template.name} (Your Resume)`;
    }
    
    // Update breadcrumbs for user resume view
    updateBreadcrumbs(`${template.name} (Resume View)`);
    
    // Get the template content container
    const contentContainer = document.querySelector('.template-preview-content');
    if (!contentContainer) {
        throw new Error('Template content container not found');
    }
    
    // Clear any existing content
    contentContainer.innerHTML = '';
    
    // Create iframe for the populated resume
    const iframe = document.createElement('iframe');
    iframe.style.width = '100%';
    iframe.style.height = '100vh';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
    
    // Set up iframe content
    iframe.onload = function() {
        console.log('User resume loaded successfully');
        
        // Apply any necessary styling to the iframe content
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (iframeDoc) {
            // Add some basic styling to ensure proper display
            const style = iframeDoc.createElement('style');
            style.textContent = `
                body {
                    margin: 0;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                img {
                    max-width: 100%;
                    height: auto;
                }
            `;
            iframeDoc.head.appendChild(style);
        }
    };
    
    // Add iframe to container
    contentContainer.appendChild(iframe);
    
    // Write the populated HTML to the iframe
    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(populatedHTML);
    iframeDoc.close();
    
    // Hide template info section for user resume view (optional)
    const templateInfoSection = document.querySelector('.template-info');
    if (templateInfoSection) {
        templateInfoSection.style.display = 'none';
    }
    
    // Update action buttons for user resume view
    updateActionButtonsForUserResume();
}

/**
 * Update action buttons when viewing user resume
 */
function updateActionButtonsForUserResume() {
    // Hide "Add to Favorites" button since this is a user's own resume
    const favoriteBtn = document.getElementById('favorite-btn');
    if (favoriteBtn) {
        favoriteBtn.style.display = 'none';
    }
    
    // Update button texts to be more appropriate for resume viewing
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Resume';
    }
    
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        saveBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Resume';
        // Optionally change the save button to redirect to resume editor
        saveBtn.onclick = function() {
            const templateId = getTemplateIdFromURL();
            const userId = getUserIdFromURL();
            window.location.href = `resume-editor.html?templateId=${templateId}&userId=${userId}`;
        };
    }
}

/**
 * Hide elements that aren't relevant when viewing a user's resume
 */
function hideUserResumeViewElements() {
    // Hide "Use Template" buttons since we're viewing a completed resume
    const useTemplateBtn = document.getElementById('use-template-btn');
    if (useTemplateBtn) {
        useTemplateBtn.style.display = 'none';
    }
    
    const useTemplateBtnBottom = document.getElementById('use-template-btn-bottom');
    if (useTemplateBtnBottom) {
        useTemplateBtnBottom.style.display = 'none';
    }
    
    // Hide template customization options since we're viewing a completed resume
    const customizationPanel = document.querySelector('.customization-panel');
    if (customizationPanel) {
        customizationPanel.style.display = 'none';
    }
    
    // Update page title to indicate this is a resume view
    const templateName = document.getElementById('template-name');
    if (templateName) {
        templateName.textContent = templateName.textContent + ' (Your Resume)';
    }
    
    // Update breadcrumbs
    const breadcrumbContainer = document.querySelector('.breadcrumb');
    if (breadcrumbContainer) {
        breadcrumbContainer.innerHTML = `
            <a href="dashboard.html">Dashboard</a>
            <span class="breadcrumb-separator">></span>
            <span class="current">Resume View</span>
        `;
    }
    
    console.log('User resume view elements hidden/updated');
}

/**
 * Populate template information in the UI
 */
function populateTemplateInfo(template) {
    console.log('🔍 CLIENT DEBUG: populateTemplateInfo called with template:');
    console.log('  - Template object:', template);
    console.log('  - Template Name:', template?.name);
    console.log('  - Template Rating:', template?.rating);
    console.log('  - Template Category:', template?.category);
    console.log('  - Template Downloads:', template?.downloads);
    
    // Update page title
    document.title = `${template.name} - Template Preview - NextHire`;
    
    // Update template name
    const templateNameElement = document.getElementById('template-name');
    if (templateNameElement) {
        templateNameElement.textContent = template.name;
    }
    
    // Update template information card
    updateElement('info-name', template.name);
    updateElement('info-category', template.category || 'General');
    updateElement('info-industry', template.industry || 'All Industries');
    updateElement('info-downloads', template.downloads || 0);
    
    // Update rating
    updateRating(template.rating || 0);
    
    // Update features list
    updateFeaturesList(template.features || []);
    
    // Update breadcrumbs
    updateBreadcrumbs(template.name);
}

/**
 * Update rating display
 */
function updateRating(rating) {
    const ratingStarsElement = document.getElementById('rating-stars');
    const ratingValueElement = document.getElementById('rating-value');
    
    if (ratingStarsElement) {
        ratingStarsElement.innerHTML = generateStarRating(rating);
    }
    
    if (ratingValueElement) {
        ratingValueElement.textContent = `(${rating.toFixed(1)})`;
    }
}

/**
 * Generate star rating HTML
 */
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    let starsHTML = '';
    
    // Full stars
    for (let i = 0; i < fullStars; i++) {
        starsHTML += '<i class="fas fa-star"></i>';
    }
    
    // Half star
    if (hasHalfStar) {
        starsHTML += '<i class="fas fa-star-half-alt"></i>';
    }
    
    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
        starsHTML += '<i class="far fa-star"></i>';
    }
    
    return starsHTML;
}

/**
 * Update features list
 */
function updateFeaturesList(features) {
    const featureListElement = document.getElementById('feature-list');
    
    if (!featureListElement) return;
    
    if (features.length === 0) {
        featureListElement.innerHTML = '<li class="no-features">No features listed</li>';
        return;
    }
    
    const featuresHTML = features.map(feature => 
        `<li><i class="fas fa-check"></i> ${feature}</li>`
    ).join('');
    
    featureListElement.innerHTML = featuresHTML;
}

/**
 * Load template preview in iframe with user data population
 */
async function loadTemplatePreview(template, populatedHTML = null) {
    const iframe = document.getElementById("templatePreviewIframe");
    
    if (!iframe) {
        console.error("Preview iframe not found");
        return;
    }
    
    try {
        // Get userId from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        let templateHTML;
        
        // Use provided populated HTML if available, otherwise use template's base HTML
        if (populatedHTML) {
            templateHTML = populatedHTML;
            console.log('Using provided populated HTML for user resume');
        } else {
            templateHTML = template.htmlContent;
            
            if (!templateHTML) {
                throw new Error("No HTML content found for this template");
            }
            
            // If we have a userId, try to render template with user data
            if (userId) {
                try {
                    const customizations = getCustomizationSettings();
                    
                    const response = await fetch('/api/render-template', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            templateId: template._id,
                            userId: userId,
                            customizations: customizations
                        })
                    });
                    
                    if (response.ok) {
                        const result = await response.json();
                        if (result.success) {
                            templateHTML = result.data.renderedHtml;
                            console.log('Template rendered with user data successfully');
                            
                            // Store user data for potential use (like in downloads)
                            currentUserData = result.data.userData;
                            currentUserId = userId; // Store the user ID globally
                            currentTemplateId = template._id; // Store the template ID globally
                            
                            console.log('Stored user data for downloads:', currentUserData ? 'Available' : 'Not available');
                        } else {
                            console.warn('Failed to render with user data:', result.message);
                            // Fall back to empty template
                            templateHTML = applyCustomizations(templateHTML);
                        }
                    } else {
                        console.warn('API call failed, using empty template');
                        templateHTML = applyCustomizations(templateHTML);
                    }
                } catch (error) {
                    console.warn('Error rendering with user data, using empty template:', error);
                    templateHTML = applyCustomizations(templateHTML);
                }
            } else {
                // No userId, just show empty template with customizations
                templateHTML = applyCustomizations(templateHTML);
            }
        }
        
        // Set the iframe content
        iframe.srcdoc = templateHTML;
        
        // Force iframe dimensions immediately
        iframe.style.width = '100%';
        iframe.style.height = '800px';
        iframe.style.minHeight = '800px';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        
        // Wait for iframe to load and resize properly
        iframe.onload = function() {
            try {
                console.log('Iframe onload - dimensions:', {
                    width: iframe.offsetWidth,
                    height: iframe.offsetHeight,
                    style: iframe.style.cssText
                });
                
                // Apply any additional styling or customizations
                applyIframeCustomizations(iframe);
                
                // Ensure iframe shows full content
                resizeIframeToContent(iframe);
                
                console.log('Template preview loaded and resized successfully');
            } catch (error) {
                console.error('Error in iframe onload:', error);
            }
        };
        
    } catch (error) {
        console.error("Error loading template preview:", error);
        iframe.srcdoc = `
            <div style="padding: 40px; text-align: center; font-family: Arial, sans-serif;">
                <h3 style="color: #dc3545;">Error Loading Template</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

/**
 * Apply customizations to template HTML
 */
function applyCustomizations(templateHTML) {
    const customizations = getCustomizationSettings();
    
    // Create a temporary DOM to manipulate the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(templateHTML, 'text/html');
    
    // Apply color scheme
    if (customizations.colorScheme && customizations.colorScheme !== 'default') {
        doc.body.classList.add(`color-${customizations.colorScheme}`);
    }
    
    // Apply font family
    if (customizations.fontFamily && customizations.fontFamily !== 'default') {
        doc.body.style.fontFamily = getFontFamily(customizations.fontFamily);
    }
    
    // Apply layout style
    if (customizations.layoutStyle && customizations.layoutStyle !== 'default') {
        doc.body.classList.add(`layout-${customizations.layoutStyle}`);
    }
    
    return doc.documentElement.outerHTML;
}

/**
 * Get font family CSS value
 */
function getFontFamily(fontName) {
    const fontMap = {
        'arial': 'Arial, sans-serif',
        'georgia': 'Georgia, serif',
        'roboto': 'Roboto, sans-serif',
        'montserrat': 'Montserrat, sans-serif'
    };
    
    return fontMap[fontName] || 'Arial, sans-serif';
}

/**
 * Get current customization settings
 */
function getCustomizationSettings() {
    return {
        colorScheme: document.getElementById('color-scheme')?.value || 'default',
        fontFamily: document.getElementById('font-family')?.value || 'default',
        layoutStyle: document.getElementById('layout-style')?.value || 'default'
    };
}

/**
 * Resize iframe to fit content properly
 */
function resizeIframeToContent(iframe) {
    try {
        // Force initial dimensions
        iframe.style.width = '100%';
        iframe.style.height = '1200px'; // Increased initial height
        iframe.style.minHeight = '1200px'; // Increased minimum height
        iframe.style.maxHeight = 'none';
        iframe.style.border = 'none';
        iframe.style.display = 'block';
        iframe.style.overflow = 'visible';
        
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return;
        
        // Wait for images and content to load
        setTimeout(() => {
            try {
                // Get the full height of the content
                const body = iframeDoc.body;
                const html = iframeDoc.documentElement;
                
                if (body && html) {
                    const contentHeight = Math.max(
                        body.scrollHeight,
                        body.offsetHeight,
                        html.clientHeight,
                        html.scrollHeight,
                        html.offsetHeight
                    );
                    
                    // Set minimum height but allow content to expand
                    const minHeight = 1200; // Increased minimum height
                    const finalHeight = Math.max(contentHeight + 80, minHeight); // More padding
                    
                    iframe.style.height = finalHeight + 'px';
                    iframe.style.minHeight = finalHeight + 'px';
                    
                    console.log('Iframe resized to content height:', finalHeight);
                    
                    // Ensure iframe container adapts
                    const container = iframe.closest('.preview-frame-container');
                    if (container) {
                        container.style.minHeight = finalHeight + 'px';
                        container.style.height = 'auto';
                    }
                    
                    // Also update the template-preview-frame
                    const frame = iframe.closest('.template-preview-frame');
                    if (frame) {
                        frame.style.minHeight = finalHeight + 'px';
                        frame.style.height = 'auto';
                    }
                }
            } catch (error) {
                console.error('Error calculating iframe content height:', error);
            }
        }, 500); // Wait for content to fully render
        
    } catch (error) {
        console.error('Error resizing iframe:', error);
    }
}

/**
 * Apply customizations to iframe content
 */
function applyIframeCustomizations(iframe) {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return;
        
        // Add comprehensive styling for full-page display
        const style = iframeDoc.createElement('style');
        style.textContent = `
            /* Full page iframe styling */
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: auto !important;
                min-height: 100% !important;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
                background: white;
                overflow-x: hidden;
                zoom: 1;
                transform: scale(1);
            }
            
            body {
                padding: 20px !important;
                max-width: 100% !important;
                overflow-x: hidden !important;
                line-height: 1.6;
                position: relative;
            }
            
            /* Ensure images are responsive and display properly */
            img {
                max-width: 100% !important;
                height: auto;
                display: block;
                margin: 10px 0;
            }
            
            /* Profile picture styling - more specific selectors */
            .profile-photo img, .profile-picture, .avatar, 
            .profile-photo .placeholder,
            [class*="profile-photo"], [class*="profile-pic"], 
            [class*="avatar"], img[class*="profile"], img[class*="photo"] {
                width: 150px;
                height: 150px;
                object-fit: cover;
                border-radius: 50%;
                margin: 10px auto;
                display: block;
            }
            
            /* Ensure profile-summary is not affected by profile styling */
            .profile-summary {
                width: 100% !important;
                height: auto !important;
                border-radius: 5px !important;
                margin: 0 !important;
                display: block !important;
                padding: 15px !important;
                box-sizing: border-box !important;
            }
            
            /* Color scheme styles */
            .color-blue { --primary-color: #007bff; }
            .color-green { --primary-color: #28a745; }
            .color-purple { --primary-color: #6f42c1; }
            .color-red { --primary-color: #dc3545; }
            
            /* Layout styles */
            .layout-compact { line-height: 1.4; }
            .layout-expanded { line-height: 1.8; }
            .layout-modern { 
                font-weight: 300;
                letter-spacing: 0.5px;
            }
            
            /* Ensure sections are well-spaced */
            .section, .resume-section, div[class*="section"] {
                margin: 20px 0;
                page-break-inside: avoid;
            }
            
            /* Header styling */
            h1, h2, h3, h4, h5, h6 {
                margin: 15px 0 10px 0;
                color: var(--primary-color, #333);
            }
            
            /* Contact information styling */
            .contact-info, .personal-info {
                margin: 10px 0;
            }
            
            /* Skills and experience styling */
            .skills, .experience, .education {
                margin: 15px 0;
            }
            
            /* Print-friendly styles */
            @media print {
                body {
                    padding: 0;
                    margin: 0;
                }
                
                .no-print {
                    display: none !important;
                }
            }
        `;
        
        iframeDoc.head.appendChild(style);
        
        // Ensure the iframe scales properly to fit content
        const metaViewport = iframeDoc.createElement('meta');
        metaViewport.name = 'viewport';
        metaViewport.content = 'width=device-width, initial-scale=1.0';
        iframeDoc.head.appendChild(metaViewport);
        
        console.log('Applied full-page iframe customizations');
        
    } catch (error) {
        console.error("Error applying iframe customizations:", error);
    }
}

/**
 * Handle template download
 */
/**
 * Enhanced download handler with format selection
 */
async function handleDownload() {
    console.log('Download button clicked - showing format selection');
    
    const templateId = getTemplateIdFromURL();
    if (!templateId) {
        showNotification('No template selected for download', 'error');
        return;
    }
    
    // Show the download format selection modal
    showDownloadModal();
}

// Place this function after handleDownload
function updateDownloadModalPreview() {
    const downloadColorScheme = document.getElementById("downloadPreviewColorScheme");
    if (downloadColorScheme) {
        downloadColorScheme.textContent = getColorSchemeName(currentCustomizations.colorScheme);
    }
    
    const downloadFontFamily = document.getElementById("downloadPreviewFontFamily");
    if (downloadFontFamily) {
        downloadFontFamily.textContent = getFontFamilyName(currentCustomizations.fontFamily);
    }
    
    const downloadLayoutStyle = document.getElementById("downloadPreviewLayoutStyle");
    if (downloadLayoutStyle) {
        downloadLayoutStyle.textContent = getLayoutStyleName(currentCustomizations.layoutStyle);
    }
}

/**
 * Show the download format selection modal
 */
function showDownloadModal() {
    console.log('Showing download format modal...');
    
    const modal = document.getElementById('downloadFormatModal');
    if (!modal) {
        console.error('Download format modal not found in DOM');
        showNotification('Download modal not available. Please refresh the page.', 'error');
        return;
    }
    
    // Update customization preview
    updateDownloadCustomizationPreview();
    
    // Reset selection
    const formatOptions = document.querySelectorAll('.format-option');
    formatOptions.forEach(option => option.classList.remove('selected'));
    
    // Disable confirm button initially
    const confirmBtn = document.getElementById('confirmDownload');
    if (confirmBtn) {
        confirmBtn.disabled = true;
    }
    
    // Show modal
    modal.classList.add('show');
    
    // Set up event listeners
    setupDownloadModalEventListeners();
}

/**
 * Update customization preview in download modal
 */
function updateDownloadCustomizationPreview() {
    const customizations = getCustomizationSettings();
    
    // Update color scheme preview
    const colorSchemeElement = document.getElementById('downloadPreviewColorScheme');
    if (colorSchemeElement) {
        colorSchemeElement.textContent = formatCustomizationValue(customizations.colorScheme);
    }
    
    // Update font family preview
    const fontFamilyElement = document.getElementById('downloadPreviewFontFamily');
    if (fontFamilyElement) {
        fontFamilyElement.textContent = formatCustomizationValue(customizations.fontFamily);
    }
    
    // Update layout style preview
    const layoutStyleElement = document.getElementById('downloadPreviewLayoutStyle');
    if (layoutStyleElement) {
        layoutStyleElement.textContent = formatCustomizationValue(customizations.layoutStyle);
    }
}

/**
 * Set up event listeners for download modal
 */
function setupDownloadModalEventListeners() {
    const modal = document.getElementById('downloadFormatModal');
    const closeBtn = document.getElementById('closeDownloadModal');
    const cancelBtn = document.getElementById('cancelDownload');
    const confirmBtn = document.getElementById('confirmDownload');
    const formatOptions = document.querySelectorAll('.format-option');
    
    // Remove existing listeners to prevent duplicates
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', hideDownloadModal);
    }
    
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', hideDownloadModal);
    }
    
    if (confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirmDownload);
    }
    
    // Format option selection
    formatOptions.forEach(option => {
        const newOption = option.cloneNode(true);
        option.parentNode.replaceChild(newOption, option);
        newOption.addEventListener('click', () => selectDownloadFormat(newOption));
    });
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideDownloadModal();
            }
        });
    }
    
    // Handle Escape key
    document.addEventListener('keydown', handleDownloadEscapeKey);
}

/**
 * Handle format selection
 */
function selectDownloadFormat(selectedOption) {
    // Remove selection from all options
    const formatOptions = document.querySelectorAll('.format-option');
    formatOptions.forEach(option => option.classList.remove('selected'));
    
    // Add selection to clicked option
    selectedOption.classList.add('selected');
    
    // Enable confirm button
    const confirmBtn = document.getElementById('confirmDownload');
    if (confirmBtn) {
        confirmBtn.disabled = false;
        
        // Update button text based on selection
        const format = selectedOption.dataset.format;
        const btnText = confirmBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = `Download ${format.toUpperCase()}`;
        }
    }
}

/**
 * Handle Escape key for download modal
 */
function handleDownloadEscapeKey(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('downloadFormatModal');
        if (modal && modal.classList.contains('show')) {
            hideDownloadModal();
        }
    }
}

/**
 * Hide download modal
 */
function hideDownloadModal() {
    console.log('Hiding download format modal...');
    
    const modal = document.getElementById('downloadFormatModal');
    if (modal) {
        modal.classList.remove('show');
    }
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleDownloadEscapeKey);
}

/**
 * Handle confirmed download with selected format
 */
async function handleConfirmDownload() {
    const selectedOption = document.querySelector('.format-option.selected');
    if (!selectedOption) {
        showNotification('Please select a download format', 'error');
        return;
    }
    
    const format = selectedOption.dataset.format;
    const templateId = getTemplateIdFromURL();
    const confirmBtn = document.getElementById('confirmDownload');
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    
    console.log('=== DOWNLOAD DEBUG INFO ===');
    console.log('Template ID:', templateId);
    console.log('User ID:', userId);
    console.log('Format:', format);
    console.log('Current User Data Available:', currentUserData ? 'Yes' : 'No');
    console.log('Current Template ID:', currentTemplateId);
    console.log('Current User ID:', currentUserId);
    
    if (!templateId) {
        showNotification('No template selected for download', 'error');
        return;
    }
    
    try {
        // Show loading state
        if (confirmBtn) {
            confirmBtn.classList.add('loading');
            confirmBtn.disabled = true;
        }
        
        // Perform download based on selected format
        await performFormatDownload(templateId, format);
        
        // Hide modal and show success message
        hideDownloadModal();
        const message = userId ? 
            `Your personalized resume downloaded successfully as ${format.toUpperCase()}!` :
            `Template downloaded successfully as ${format.toUpperCase()}!`;
        showNotification(message, 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification(`Failed to download ${format.toUpperCase()} resume: ${error.message}`, 'error');
    } finally {
        // Restore button state
        if (confirmBtn) {
            confirmBtn.classList.remove('loading');
            confirmBtn.disabled = false;
        }
    }
}

/**
 * Perform download based on selected format
 */
async function performFormatDownload(templateId, format) {
    const customizations = getCustomizationSettings();
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    
    let htmlContentToDownload;
    let templateName;
    
    try {
        // If we have a userId, render the template with user data
        if (userId) {
            console.log('Downloading template with user data...');
            
            // Use the render template API to get the populated HTML
            const renderResponse = await fetch('/api/render-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    templateId: templateId,
                    userId: userId,
                    customizations: customizations
                })
            });
            
            if (renderResponse.ok) {
                const renderResult = await renderResponse.json();
                if (renderResult.success) {
                    htmlContentToDownload = renderResult.data.renderedHtml;
                    templateName = renderResult.data.templateName || 'resume';
                    console.log('Successfully got rendered template with user data');
                } else {
                    throw new Error('Failed to render template with user data');
                }
            } else {
                throw new Error('Failed to fetch rendered template');
            }
        } else {
            // Fallback: fetch empty template
            console.log('No user ID found, downloading empty template...');
            const response = await fetch(`/api/templates/${templateId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch template data');
            }
            
            const template = await response.json();
            htmlContentToDownload = applyCustomizations(template.htmlContent);
            templateName = template.name;
        }
        
        // Prepare download request with the populated HTML
        const downloadData = {
            templateId: templateId,
            userId: userId,
            format: format,
            customizations: customizations,
            templateData: {
                name: templateName,
                htmlContent: htmlContentToDownload
            }
        };
        
        // Send download request to backend
        const downloadResponse = await fetch('/api/templates/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(downloadData)
        });
        
        if (!downloadResponse.ok) {
            const errorData = await downloadResponse.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to generate ${format.toUpperCase()} file`);
        }
        
        // Handle file download
        const blob = await downloadResponse.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Get filename from input field or use default
        const filenameInput = document.getElementById("downloadFileName") || document.getElementById("file-name") || document.getElementById("filename-input");
        let fileName = "";
        
        if (filenameInput && filenameInput.value.trim()) {
            // Use user-provided filename, remove any invalid characters
            fileName = filenameInput.value.trim().replace(/[<>:"/\\|?*]/g, '_');
        } else {
            // Fallback logic with template name and user data
            fileName = templateName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            
            // If we have user data, try to get user's name for filename
            if (userId && currentUserData && currentUserData.personalDetails) {
                const userFirstName = currentUserData.personalDetails.firstName || '';
                const userLastName = currentUserData.personalDetails.lastName || '';
                if (userFirstName || userLastName) {
                    fileName = `${userFirstName}_${userLastName}_resume`.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                }
            }
        }
        
        const extension = format === 'pdf' ? '.pdf' : '.docx';
        a.download = fileName + extension;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Update download count
        await updateDownloadCount(templateId);
        
        console.log(`Successfully downloaded ${format.toUpperCase()} with${userId ? ' user data' : ' template data'}`);
        
    } catch (error) {
        console.error('Error in performFormatDownload:', error);
        throw error;
    }
}
/**
 * Create downloadable template content
 */
function createDownloadableTemplate(template) {
    const customizations = getCustomizationSettings();
    let htmlContent = template.htmlContent;
    
    // Apply customizations to the downloadable version
    htmlContent = applyCustomizations(htmlContent);
    
    // Add metadata comments
    const metadata = `
<!-- 
Template: ${template.name}
Category: ${template.category}
Downloaded from: NextHire
Date: ${new Date().toISOString()}
-->
`;
    
    // Insert metadata at the beginning of the HTML
    if (htmlContent.includes('<html>')) {
        htmlContent = htmlContent.replace('<html>', `<html>\n${metadata}`);
    } else {
        htmlContent = metadata + htmlContent;
    }
    
    return htmlContent;
}

/**
 * Update download count on server
 */
async function updateDownloadCount(templateId) {
    try {
        await fetch(`/api/templates/${templateId}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        // Update the download count in the UI
        const response = await fetch(`/api/templates/${templateId}`);
        if (response.ok) {
            const template = await response.json();
            updateElement('info-downloads', template.downloads || 0);
        }
        
    } catch (error) {
        console.error('Error updating download count:', error);
    }
}

/**
 * CRITICAL FIX: Handle template save - shows modal ONLY when button is clicked
 */
async function handleSave() {
    console.log('Save button clicked');
    
    const userId = getCurrentUserId();
    if (!userId) {
        showNotification('Please log in to save templates', 'error');
        return;
    }
    
    const templateId = getTemplateIdFromURL();
    if (!templateId) {
        showNotification('No template selected for saving', 'error');
        return;
    }
    
    // Show the save modal ONLY when this function is called
    showSaveModal();
}

/**
 * CRITICAL FIX: Show the save template modal with proper initialization
 */
/**
 * CORRECTED: Show the save template modal with proper initialization
 */
function showSaveModal() {
    console.log('Showing save modal...');
    
    const modal = document.getElementById('saveTemplateModal');
    if (!modal) {
        console.error('Save modal not found in DOM');
        showNotification('Save modal not available. Please refresh the page.', 'error');
        return;
    }
    
    const templateNameInput = document.getElementById('templateName');
    const templateDescriptionInput = document.getElementById('templateDescription');
    
    // Clear previous inputs
    if (templateNameInput) templateNameInput.value = '';
    if (templateDescriptionInput) templateDescriptionInput.value = '';
    
    // Update customization preview
    updateCustomizationPreview();
    
    // CRITICAL FIX: Use the CSS class instead of inline style
    modal.classList.add('show');
    
    // Focus on name input
    if (templateNameInput) {
        setTimeout(() => templateNameInput.focus(), 100);
    }
    
    // Set up event listeners
    setupSaveModalEventListeners();
}

/**
 * Update the customization preview in the modal
 */
function updateCustomizationPreview() {
    const customizations = getCustomizationSettings();
    
    // Update color scheme preview
    const colorSchemeElement = document.getElementById('previewColorScheme');
    if (colorSchemeElement) {
        colorSchemeElement.textContent = formatCustomizationValue(customizations.colorScheme);
    }
    
    // Update font family preview
    const fontFamilyElement = document.getElementById('previewFontFamily');
    if (fontFamilyElement) {
        fontFamilyElement.textContent = formatCustomizationValue(customizations.fontFamily);
    }
    
    // Update layout style preview
    const layoutStyleElement = document.getElementById('previewLayoutStyle');
    if (layoutStyleElement) {
        layoutStyleElement.textContent = formatCustomizationValue(customizations.layoutStyle);
    }
}

/**
 * Format customization values for display
 */
function formatCustomizationValue(value) {
    if (!value || value === 'default') {
        return 'Default';
    }
    
    // Convert camelCase or kebab-case to Title Case
    return value
        .replace(/([A-Z])/g, ' $1')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

/**
 * CRITICAL FIX: Set up event listeners for the save modal
 */
function setupSaveModalEventListeners() {
    const modal = document.getElementById('saveTemplateModal');
    const closeBtn = document.getElementById('closeSaveModal');
    const cancelBtn = document.getElementById('cancelSave');
    const confirmBtn = document.getElementById('confirmSave');
    const templateNameInput = document.getElementById('templateName');
    
    // Remove existing listeners to prevent duplicates
    if (closeBtn) {
        const newCloseBtn = closeBtn.cloneNode(true);
        closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
        newCloseBtn.addEventListener('click', hideSaveModal);
    }
    
    if (cancelBtn) {
        const newCancelBtn = cancelBtn.cloneNode(true);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        newCancelBtn.addEventListener('click', hideSaveModal);
    }
    
    if (confirmBtn) {
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
        newConfirmBtn.addEventListener('click', handleConfirmSave);
    }
    
    // Close modal when clicking outside
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideSaveModal();
            }
        });
    }
    
    // Handle Enter key in name input
    if (templateNameInput) {
        templateNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirmSave();
            }
        });
    }
    
    // Handle Escape key
    document.addEventListener('keydown', handleEscapeKey);
}

/**
 * Handle Escape key to close modal
 */
function handleEscapeKey(e) {
    if (e.key === 'Escape') {
        const modal = document.getElementById('saveTemplateModal');
        if (modal && modal.style.display === 'flex') {
            hideSaveModal();
        }
    }
}

/**
 * CRITICAL FIX: Hide the save template modal
 */
/**
 * CORRECTED: Hide the save template modal
 */
function hideSaveModal() {
    console.log('Hiding save modal...');
    
    const modal = document.getElementById('saveTemplateModal');
    if (modal) {
        // CRITICAL FIX: Use the CSS class instead of inline style
        modal.classList.remove('show');
    }
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey);
}

/**
 * Handle the confirm save action
 */
async function handleConfirmSave() {
    const templateNameInput = document.getElementById('templateName');
    const templateDescriptionInput = document.getElementById('templateDescription');
    const confirmBtn = document.getElementById('confirmSave');
    
    if (!templateNameInput) {
        showNotification('Template name input not found', 'error');
        return;
    }
    
    const templateName = templateNameInput.value.trim();
    const templateDescription = templateDescriptionInput?.value.trim() || '';
    
    // Validate template name
    if (!templateName) {
        showNotification('Please enter a template name', 'error');
        templateNameInput.focus();
        return;
    }
    
    if (templateName.length < 3) {
        showNotification('Template name must be at least 3 characters long', 'error');
        templateNameInput.focus();
        return;
    }
    
    if (templateName.length > 100) {
        showNotification('Template name must be less than 100 characters', 'error');
        templateNameInput.focus();
        return;
    }
    
    // Show loading state
    if (confirmBtn) {
        confirmBtn.classList.add('loading');
        confirmBtn.disabled = true;
    }
    
    try {
        await performTemplateSave(templateName, templateDescription);
        hideSaveModal();
        showNotification('Template saved successfully!', 'success');
    } catch (error) {
        console.error('Save error:', error);
        showNotification(error.message || 'Failed to save template', 'error');
    } finally {
        // Remove loading state
        if (confirmBtn) {
            confirmBtn.classList.remove('loading');
            confirmBtn.disabled = false;
        }
    }
}

/**
 * Perform the actual template save operation
 */
async function performTemplateSave(templateName, templateDescription) {
    const userId = getCurrentUserId();
    const templateId = getTemplateIdFromURL();
    
    if (!userId || !templateId) {
        throw new Error('Missing user ID or template ID');
    }
    
    // Get current template data
    const templateResponse = await fetch(`/api/templates/${templateId}`);
    if (!templateResponse.ok) {
        throw new Error('Failed to fetch template data');
    }
    
    const originalTemplate = await templateResponse.json();
    
    // Prepare save data WITHOUT customizations
    const saveData = {
        userId: userId,
        originalTemplateId: templateId,
        name: templateName,
        description: templateDescription,
        htmlContent: originalTemplate.htmlContent, // Use original content without customizations
        originalTemplate: {
            name: originalTemplate.name,
            category: originalTemplate.category,
            industry: originalTemplate.industry
        }
    };
    
    // Send save request to backend
    const response = await fetch('/api/user-templates', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(saveData)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save template');
    }
    
    const result = await response.json();
    return result;
}

/**
 * Get current user ID from storage
 */
function getCurrentUserId() {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
}

/**
 * Handle Use Template button click
 */
async function handleUseTemplate() {
    console.log('Use Template button clicked');
    
    const userId = getCurrentUserId();
    if (!userId) {
        showNotification('Please log in to use templates', 'error');
        // Redirect to login
        window.location.href = '/#loginModal';
        return;
    }
    
    const templateId = getTemplateIdFromURL();
    if (!templateId) {
        showNotification('No template selected', 'error');
        return;
    }
    
    try {
        // Show loading state
        showNotification('Loading your personalized resume...', 'info');
        
        // Redirect to resume editor with this template and user data
        window.location.href = `resume-editor.html?templateId=${templateId}&userId=${userId}`;
        
    } catch (error) {
        console.error('Error using template:', error);
        showNotification('Failed to load template. Please try again.', 'error');
    }
}

/**
 * Handle Favorite button click
 */
async function handleFavorite() {
    console.log('Favorite button clicked');
    
    const userId = getCurrentUserId();
    if (!userId) {
        showNotification('Please log in to add favorites', 'error');
        return;
    }
    
    const templateId = getTemplateIdFromURL();
    if (!templateId) {
        showNotification('No template selected', 'error');
        return;
    }
    
    const favoriteBtn = document.getElementById('favorite-btn');
    if (!favoriteBtn) return;
    
    try {
        // Check current favorite status
        const checkResponse = await fetch(`/api/favorites/check/${userId}/${templateId}`);
        const checkResult = await checkResponse.json();
        
        if (checkResult.isFavorite) {
            // Remove from favorites
            const response = await fetch('/api/favorites', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    templateId: templateId
                })
            });
            
            if (response.ok) {
                favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Add to Favorites';
                favoriteBtn.classList.remove('favorited');
                showNotification('Removed from favorites', 'success');
            } else {
                throw new Error('Failed to remove from favorites');
            }
        } else {
            // Add to favorites
            const response = await fetch('/api/favorites', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: userId,
                    templateId: templateId
                })
            });
            
            if (response.ok) {
                favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
                favoriteBtn.classList.add('favorited');
                showNotification('Added to favorites', 'success');
            } else {
                throw new Error('Failed to add to favorites');
            }
        }
        
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Failed to update favorites. Please try again.', 'error');
    }
}

/**
 * Initialize favorite button state
 */
async function initializeFavoriteButton() {
    const userId = getCurrentUserId();
    const templateId = getTemplateIdFromURL();
    const favoriteBtn = document.getElementById('favorite-btn');
    
    if (!userId || !templateId || !favoriteBtn) return;
    
    try {
        const response = await fetch(`/api/favorites/check/${userId}/${templateId}`);
        const result = await response.json();
        
        if (result.isFavorite) {
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
            favoriteBtn.classList.add('favorited');
        } else {
            favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Add to Favorites';
            favoriteBtn.classList.remove('favorited');
        }
    } catch (error) {
        console.error('Error checking favorite status:', error);
    }
}

/**
 * Enhanced notification system
 */
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 500px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 300);
            }
        });
    }
}

/**
 * Get notification icon based on type
 */
function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

/**
 * Get notification color based on type
 */
function getNotificationColor(type) {
    const colors = {
        'success': '#28a745',
        'error': '#dc3545',
        'warning': '#ffc107',
        'info': '#17a2b8'
    };
    return colors[type] || '#17a2b8';
}

/**
 * Show loading state
 */
function showLoading() {
    const loadingElement = document.getElementById('template-loading');
    const errorElement = document.getElementById('template-error');
    const contentElement = document.querySelector('.template-preview-content');
    
    if (loadingElement) loadingElement.style.display = 'block';
    if (errorElement) errorElement.style.display = 'none';
    if (contentElement) contentElement.style.opacity = '0.5';
}

/**
 * Hide loading state
 */
function hideLoading() {
    const loadingElement = document.getElementById('template-loading');
    const contentElement = document.querySelector('.template-preview-content');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (contentElement) contentElement.style.opacity = '1';
}

/**
 * Show error state
 */
function showError(message) {
    const loadingElement = document.getElementById('template-loading');
    const errorElement = document.getElementById('template-error');
    const errorMessageElement = document.getElementById('error-message');
    const contentElement = document.querySelector('.template-preview-content');
    
    if (loadingElement) loadingElement.style.display = 'none';
    if (errorElement) errorElement.style.display = 'block';
    if (errorMessageElement) errorMessageElement.textContent = message;
    if (contentElement) contentElement.style.display = 'none';
}

/**
 * Update element text content safely
 */
function updateElement(elementId, content) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = content;
    }
}

// Keep existing functions that are still needed
function initProfileDropdown() {
    console.log('Template preview: Initializing profile dropdown...');
    const profileIcon = document.getElementById('profileIcon');
    const profileDropdown = document.getElementById('profileDropdown');
    
    console.log('Template preview: Profile elements found:', profileIcon, profileDropdown);

    if (profileIcon && profileDropdown) {
        profileIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
            console.log('Template preview: Dropdown toggled, show class:', profileDropdown.classList.contains('show'));
        });

        document.addEventListener('click', function() {
            profileDropdown.classList.remove('show');
        });
    } else {
        console.error('Template preview: Profile elements not found!');
    }
}

function initMobileNavigation() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function() {
            navLinks.classList.toggle("active");
            this.classList.toggle("active");
        });
    }
}

function initLogoutModal() {
    // Your existing implementation
}

function updateBreadcrumbs(templateName) {
    const breadcrumbElement = document.querySelector('.breadcrumb');
    if (breadcrumbElement) {
        breadcrumbElement.innerHTML = `
            <a href="dashboard.html">Dashboard</a>
            <span class="breadcrumb-separator">/</span>
            <a href="templates.html">Templates</a>
            <span class="breadcrumb-separator">/</span>
            <span class="breadcrumb-current">${templateName || 'Template Preview'}</span>
        `;
    }
}

function setActiveNavLink() {
    // Set the templates link as active
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.href.includes('templates.html')) {
            link.classList.add('active');
        }
    });
}

function initPreviewControls() {
    // Initialize zoom and page controls
    const zoomInBtn = document.getElementById('zoom-in');
    const zoomOutBtn = document.getElementById('zoom-out');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    let currentZoom = 100;
    let currentPage = 1;
    const totalPages = 2; // This should be dynamic based on template
    
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            if (currentZoom < 200) {
                currentZoom += 25;
                updateZoomLevel(currentZoom);
            }
        });
    }
    
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            if (currentZoom > 50) {
                currentZoom -= 25;
                updateZoomLevel(currentZoom);
            }
        });
    }
    
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updatePageIndicator(currentPage, totalPages);
                updatePageButtons(currentPage, totalPages);
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updatePageIndicator(currentPage, totalPages);
                updatePageButtons(currentPage, totalPages);
            }
        });
    }
    
    // Initialize page buttons
    updatePageButtons(currentPage, totalPages);
}

function updateZoomLevel(zoom) {
    const zoomLevelElement = document.getElementById('zoom-level');
    const iframe = document.getElementById('preview-iframe');
    
    if (zoomLevelElement) {
        zoomLevelElement.textContent = `${zoom}%`;
    }
    
    if (iframe) {
        iframe.style.transform = `scale(${zoom / 100})`;
        iframe.style.transformOrigin = 'top left';
    }
}

function updatePageIndicator(page, total) {
    const pageIndicator = document.getElementById('page-indicator');
    if (pageIndicator) {
        pageIndicator.textContent = `Page ${page} of ${total}`;
    }
}

function updatePageButtons(page, total) {
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    if (prevBtn) {
        prevBtn.disabled = page <= 1;
    }
    
    if (nextBtn) {
        nextBtn.disabled = page >= total;
    }
}

function initCustomizationOptions() {
    // Enhanced version of your existing implementation
    const colorScheme = document.getElementById("color-scheme");
    const fontFamily = document.getElementById("font-family");
    const layoutStyle = document.getElementById("layout-style");
    
    // Note: No longer loading saved customizations from localStorage
    // All customizations are temporary for preview only
    
    // Set default values
    if (colorScheme) {
        colorScheme.value = "default";
    }
    
    if (fontFamily) {
        fontFamily.value = "default";
    }
    
    if (layoutStyle) {
        layoutStyle.value = "default";
    }
    
    // Add event listeners for real-time preview updates
    if (colorScheme) colorScheme.addEventListener("change", updatePreviewCustomizations);
    if (fontFamily) fontFamily.addEventListener("change", updatePreviewCustomizations);
    if (layoutStyle) layoutStyle.addEventListener("change", updatePreviewCustomizations);
}

/**
 * Update preview with new customizations
 */
function updatePreviewCustomizations() {
    const customizations = getCustomizationSettings();
    
    // Note: Customizations are no longer saved to localStorage
    // They are only applied temporarily for preview purposes
    
    // Reload the preview with new customizations
    const templateId = getTemplateIdFromURL();
    if (templateId) {
        // Re-fetch and apply customizations
        fetch(`/api/templates/${templateId}`)
            .then(response => response.json())
            .then(template => loadTemplatePreview(template))
            .catch(error => console.error('Error updating preview:', error));
    }
}

function initTemplateActions(templateId) {
    // Enhanced version of your existing implementation
    const backBtn = document.getElementById("back-to-templates");
    if (backBtn) {
        backBtn.addEventListener("click", function() {
            window.location.href = "templates.html";
        });
    }
    
    const useTemplateBtn = document.getElementById("use-template-btn");
    const useTemplateBottomBtn = document.getElementById("use-template-btn-bottom");
    
    const useTemplateAction = function() {
        // Navigate to resume editor with template ID
        window.location.href = `resume-editor.html?templateId=${templateId}`;
    };
    
    if (useTemplateBtn) useTemplateBtn.addEventListener("click", useTemplateAction);
    if (useTemplateBottomBtn) useTemplateBottomBtn.addEventListener("click", useTemplateAction);
    
    // Enhanced favorite button functionality
    const favoriteBtn = document.getElementById("favorite-btn");
    if (favoriteBtn) {
        // Check current favorite status
        checkFavoriteStatus(templateId);
        
        favoriteBtn.addEventListener("click", function() {
            toggleFavoriteStatus(templateId);
        });
    }
}

/**
 * Check if template is favorited by current user
 */
async function checkFavoriteStatus(templateId) {
    const userId = getCurrentUserId();
    if (!userId) return;
    
    try {
        const response = await fetch(`/api/favorites/check/${userId}/${templateId}`);
        if (response.ok) {
            const result = await response.json();
            updateFavoriteButton(result.isFavorite);
        }
    } catch (error) {
        console.error('Error checking favorite status:', error);
    }
}

/**
 * Toggle favorite status
 */
async function toggleFavoriteStatus(templateId) {
    const userId = getCurrentUserId();
    if (!userId) {
        showNotification('Please log in to manage favorites', 'error');
        return;
    }
    
    const favoriteBtn = document.getElementById("favorite-btn");
    const isCurrentlyFavorite = favoriteBtn.classList.contains('active');
    
    try {
        const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
        const response = await fetch('/api/favorites', {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                templateId: templateId
            })
        });
        
        if (response.ok) {
            updateFavoriteButton(!isCurrentlyFavorite);
            const message = isCurrentlyFavorite ? 'Template removed from favorites' : 'Template added to favorites';
            showNotification(message, 'success');
        } else {
            throw new Error('Failed to update favorite status');
        }
        
    } catch (error) {
        console.error('Error toggling favorite:', error);
        showNotification('Failed to update favorite status', 'error');
    }
}

/**
 * Update favorite button appearance
 */
function updateFavoriteButton(isFavorite) {
    const favoriteBtn = document.getElementById("favorite-btn");
    if (!favoriteBtn) return;
    
    if (isFavorite) {
        favoriteBtn.classList.add('active');
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Remove from Favorites';
    } else {
        favoriteBtn.classList.remove('active');
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Add to Favorites';
    }
}

// Add notification animations to the page
if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 5px;
            margin-left: 15px;
            border-radius: 3px;
            transition: background-color 0.2s ease;
        }
        
        .notification-close:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
    `;
    document.head.appendChild(style);
}

// Place this function after your global variable declarations or existing utility functions
 async function initializeTemplatePreview() {
        console.log('🔍 CLIENT DEBUG: initializeTemplatePreview called, isViewingUserResume:', isViewingUserResume);
        
        // If we're already viewing a user resume, don't run this function
        if (isViewingUserResume) {
            console.log('🚫 CLIENT DEBUG: Skipping initializeTemplatePreview because user resume is already loaded');
            return;
        }
        
        console.log('🔄 CLIENT DEBUG: Proceeding with initializeTemplatePreview');
        
        const urlParams = new URLSearchParams(window.location.search);
        const templateId = urlParams.get('templateId');
        const userId = urlParams.get('userId'); 

        if (!templateId || !userId) {
            console.error("Template ID or User ID not found in URL parameters.");
            // Display an error message to the user or redirect
            return;
        }

        try {
            // Make a POST request to the correct render template endpoint
            const response = await fetch('/api/render-template', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    templateId: templateId,
                    userId: userId
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                throw new Error(`Failed to load rendered template: ${response.status} ${response.statusText} - ${JSON.stringify(errorData)}`);
            }

            const responseData = await response.json();
            const renderedHtml = responseData.html;

            // Inject the rendered HTML into the iframe
            const previewIframe = document.getElementById('templatePreviewIframe');
            if (previewIframe) {
                // Using srcdoc is generally safer and simpler for injecting full HTML
                previewIframe.srcdoc = renderedHtml;
            } else {
                console.error("Iframe with ID 'templatePreviewIframe' not found.");
            }

            console.log("Template preview initialized successfully with rendered data.");

        } catch (error) {
            console.error("Error initializing template preview:", error);
            // Display user-friendly error message
            alert("Could not load resume preview. Please try again.");
        }
    }

// Place this function alongside initializeTemplatePreview
async function fetchUserResumeData(userId) {
    try {
        // Use a utility function for API requests if you have one (e.g., apiRequest)
        const response = await fetch(`/api/users/${userId}/resume-data`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Include authorization token if your API requires it
                'Authorization': `Bearer ${getAuthToken()}` 
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch user data');
        }
        
        const result = await response.json();
        return result.data; // Return the 'data' field from your API response
        
    } catch (error) {
        console.error('Error fetching user resume data:', error);
        throw error; // Re-throw to be handled by initializeTemplatePreview's catch block
    }
}

// Place this function alongside fetchUserResumeData
async function fetchTemplateData(templateId) {
    try {
        const response = await fetch(`/api/templates/${templateId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch template details');
        }
        
        const result = await response.json();
        return result.data; // Return the template object
        
    } catch (error) {
        console.error('Error fetching template data:', error);
        throw error;
    }
}

// Place this function alongside fetchTemplateData
// async function populateTemplatePreview(templateData, userData, customizations) {
//     try {
//         // Make a POST request to your backend to get the populated HTML
//         const response = await fetch(`/api/templates/${currentTemplateId}/populate`, {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': `Bearer ${getAuthToken()}` // Include auth token
//             },
//             body: JSON.stringify({
//                 userId: currentUserId,
//                 customizations: customizations // Send current customization settings
//             })
//         });
        
//         if (!response.ok) {
//             const errorData = await response.json();
//             throw new Error(errorData.message || 'Failed to get populated template from backend');
//         }
        
//         const result = await response.json();
        
//         // Update the template information displayed on the page (name, description, features)
//         updateTemplateInfoDisplay(templateData, result.data);
        
//         // Render the received populated HTML into the iframe
//         renderPopulatedTemplate(result.data.populatedHTML);
        
//         // Update the customization preview section on the page
//         updateCustomizationPreview(customizations);
        
//         console.log('Template populated and rendered successfully.');
        
//     } catch (error) {
//         console.error('Error populating template preview:', error);
//         throw error;
//     }
// }

// Place this function alongside populateTemplatePreview
function renderPopulatedTemplate(populatedHTML) {
    const previewFrame = document.getElementById('templatePreviewFrame');
    if (!previewFrame) {
        console.error('Template preview iframe not found!');
        return;
    }
    
    // Create a Blob from the HTML string with 'text/html' type
    const blob = new Blob([populatedHTML], { type: 'text/html' });
    // Create a URL for the Blob
    const blobURL = URL.createObjectURL(blob);
    
    // Set the iframe's src to the Blob URL. This will load the HTML content.
    previewFrame.src = blobURL;
    
    // Clean up the Blob URL once the iframe has loaded to free up memory
    previewFrame.onload = function() {
        URL.revokeObjectURL(blobURL);
        
        // Optionally, apply any additional enhancements or event listeners to the iframe's content
        // This might be necessary if you have interactive elements *inside* the resume template
        applyPreviewFrameEnhancements();
    };
}

// Place this function alongside renderPopulatedTemplate
function updateTemplateInfoDisplay(templateData, populatedData) {
    // Update template name display
    const templateNameElement = document.getElementById('templateName');
    if (templateNameElement) {
        templateNameElement.textContent = templateData.name || 'Resume Template';
    }
    
    // Update template description display
    const templateDescElement = document.getElementById('templateDescription');
    if (templateDescElement) {
        templateDescElement.textContent = templateData.description || 'A professional and customizable resume template.';
    }
    
    // Update template features list
    const templateFeaturesElement = document.getElementById('templateFeatures');
    if (templateFeaturesElement && templateData.features) {
        templateFeaturesElement.innerHTML = ''; // Clear existing features
        templateData.features.forEach(feature => {
            const li = document.createElement('li');
            li.innerHTML = `<i class="fas fa-check"></i> ${feature}`; // Add Font Awesome icon
            templateFeaturesElement.appendChild(li);
        });
    }
    
    // Update template rating display (assuming you have a renderStars function)
    const templateRatingElement = document.getElementById('templateRating');
    if (templateRatingElement && templateData.rating) {
        // Ensure renderStars function is defined elsewhere in your script
        if (typeof renderStars === 'function') {
            templateRatingElement.innerHTML = renderStars(templateData.rating);
        } else {
            templateRatingElement.textContent = `Rating: ${templateData.rating.toFixed(1)} / 5`;
        }
    }
}

// Place this function after updateTemplateInfoDisplay
function initializeCustomizationControls() {
    // Event listener for Color Scheme selector
    const colorSchemeSelect = document.getElementById('colorScheme');
    if (colorSchemeSelect) {
        colorSchemeSelect.addEventListener('change', handleColorSchemeChange);
        colorSchemeSelect.value = currentCustomizations.colorScheme; // Set initial value
    }
    
    // Event listener for Font Family selector
    const fontFamilySelect = document.getElementById('fontFamily');
    if (fontFamilySelect) {
        fontFamilySelect.addEventListener('change', handleFontFamilyChange);
        fontFamilySelect.value = currentCustomizations.fontFamily; // Set initial value
    }
    
    // Event listener for Layout Style selector
    const layoutStyleSelect = document.getElementById('layoutStyle');
    if (layoutStyleSelect) {
        layoutStyleSelect.addEventListener('change', handleLayoutStyleChange);
        layoutStyleSelect.value = currentCustomizations.layoutStyle; // Set initial value
    }
    
    // Event listener for Real-time Preview toggle
    const realtimeToggle = document.getElementById('realtimePreview');
    if (realtimeToggle) {
        realtimeToggle.addEventListener('change', handleRealtimeToggleChange);
        // If real-time is off, show the manual update button
        const updatePreviewBtn = document.getElementById('updatePreviewBtn');
        if (updatePreviewBtn) {
            updatePreviewBtn.style.display = realtimeToggle.checked ? 'none' : 'block';
        }
    }
    
    // Event listener for the manual Update Preview button
    const updatePreviewBtn = document.getElementById('updatePreviewBtn');
    if (updatePreviewBtn) {
        updatePreviewBtn.addEventListener('click', updateTemplatePreview);
    }
}

// Place these functions after initializeCustomizationControls
async function handleColorSchemeChange(event) {
    const newColorScheme = event.target.value;
    currentCustomizations.colorScheme = newColorScheme;
    
    // If real-time preview is enabled, update the template immediately
    if (isRealtimePreviewEnabled()) {
        await updateTemplatePreview();
    }
    
    // Update the visual preview of the customization (e.g., a color swatch)
    updateCustomizationPreview(currentCustomizations);
}

async function handleFontFamilyChange(event) {
    const newFontFamily = event.target.value;
    currentCustomizations.fontFamily = newFontFamily;
    
    if (isRealtimePreviewEnabled()) {
        await updateTemplatePreview();
    }
    
    updateCustomizationPreview(currentCustomizations);
}

async function handleLayoutStyleChange(event) {
    const newLayoutStyle = event.target.value;
    currentCustomizations.layoutStyle = newLayoutStyle;
    
    if (isRealtimePreviewEnabled()) {
        await updateTemplatePreview();
    }
    
    updateCustomizationPreview(currentCustomizations);
}

function handleRealtimeToggleChange(event) {
    const isChecked = event.target.checked;
    const updatePreviewBtn = document.getElementById('updatePreviewBtn');
    if (updatePreviewBtn) {
        updatePreviewBtn.style.display = isChecked ? 'none' : 'block';
    }
    // If real-time is just enabled, trigger an update
    if (isChecked) {
        updateTemplatePreview();
    }
}

// Place this function after handleLayoutStyleChange
async function updateTemplatePreview() {
    try {
        showLoadingState("Updating preview...");
        
        // Re-fetch template data (in case it changed, though less likely in this context)
        const templateData = await fetchTemplateData(currentTemplateId);
        
        // Re-populate the template with the globally stored user data and current customizations
        // await populateTemplatePreview(templateData, currentUserData, currentCustomizations);
        
        hideLoadingState();
        
    } catch (error) {
        console.error("Error updating template preview:", error);
        showNotification("Failed to update preview. Please try again.", "error");
        hideLoadingState();
    }
}

// Place this function after updateTemplatePreview
function updateCustomizationPreview(customizations) {
    // Update color scheme preview display
    const colorPreview = document.getElementById("colorSchemePreview");
    if (colorPreview) {
        colorPreview.textContent = getColorSchemeName(customizations.colorScheme);
        // Add a class to visually represent the color scheme (e.g., a colored square)
        colorPreview.className = `customization-preview color-preview ${customizations.colorScheme}`;
    }
    
    // Update font family preview display
    const fontPreview = document.getElementById("fontFamilyPreview");
    if (fontPreview) {
        fontPreview.textContent = getFontFamilyName(customizations.fontFamily);
        // Apply the font style directly to the preview element for visual feedback
        fontPreview.style.fontFamily = getFontFamilyCSS(customizations.fontFamily);
    }
    
    // Update layout style preview display
    const layoutPreview = document.getElementById("layoutStylePreview");
    if (layoutPreview) {
        layoutPreview.textContent = getLayoutStyleName(customizations.layoutStyle);
    }
}

// Place this function after updateCustomizationPreview
async function handleSave() {
    try {
        // Show the save modal (assuming showSaveModal() is defined elsewhere)
        showSaveModal();
        
        // Populate the save modal with current template and customization data
        populateSaveModal();
        
    } catch (error) {
        console.error("Error initiating save:", error);
        showNotification("Failed to initiate save. Please try again.", "error");
    }
}

// Place this function after handleSave
function populateSaveModal() {
    // Update the template name displayed in the save modal
    const modalTemplateName = document.getElementById("saveModalTemplateName");
    if (modalTemplateName) {
        modalTemplateName.textContent = document.getElementById("templateName")?.textContent || "Resume Template";
    }
    
    // Update the customization summary within the save modal
    updateSaveModalCustomizations();
}

// Place this function after populateSaveModal
function updateSaveModalCustomizations() {
    const colorSchemeSpan = document.getElementById("saveModalColorScheme");
    if (colorSchemeSpan) {
        colorSchemeSpan.textContent = getColorSchemeName(currentCustomizations.colorScheme);
    }
    
    const fontFamilySpan = document.getElementById("saveModalFontFamily");
    if (fontFamilySpan) {
        fontFamilySpan.textContent = getFontFamilyName(currentCustomizations.fontFamily);
    }
    
    const layoutStyleSpan = document.getElementById("saveModalLayoutStyle");
    if (layoutStyleSpan) {
        layoutStyleSpan.textContent = getLayoutStyleName(currentCustomizations.layoutStyle);
    }
}

// Place this function after updateSaveModalCustomizations
async function handleDownload() {
    try {
        // Show the download format selection modal (assuming showDownloadModal() is defined elsewhere)
        showDownloadModal();
        
        // Update the download modal with current customization data
        updateDownloadModalPreview();
        
    } catch (error) {
        console.error("Error initiating download:", error);
        showNotification("Failed to initiate download. Please try again.", "error");
    }
}

// Place these utility functions at the end of your script, before the DOMContentLoaded listener
function getColorSchemeName(colorScheme) {
    const colorSchemeNames = {
        "default": "Default Blue",
        "blue": "Professional Blue",
        "green": "Modern Green",
        "purple": "Creative Purple",
        "red": "Bold Red",
        "dark": "Dark Theme"
    };
    return colorSchemeNames[colorScheme] || "Default";
}

function getFontFamilyName(fontFamily) {
    const fontFamilyNames = {
        "default": "Arial (Default)",
        "times": "Times New Roman",
        "georgia": "Georgia",
        "helvetica": "Helvetica",
        "calibri": "Calibri",
        "opensans": "Open Sans"
    };
    return fontFamilyNames[fontFamily] || "Default";
}

function getLayoutStyleName(layoutStyle) {
    const layoutStyleNames = {
        "default": "Standard",
        "compact": "Compact",
        "expanded": "Expanded",
        "modern": "Modern"
    };
    return layoutStyleNames[layoutStyle] || "Standard";
}
// Place this function with other utility functions
function getTemplateIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("templateId");
}

// Place this function with other utility functions
function getAuthToken() {
    // IMPORTANT: Implement this function based on how your application stores authentication tokens.
    // Example: retrieving from localStorage or sessionStorage
    return localStorage.getItem("authToken") || sessionStorage.getItem("authToken");
    
    // If you store tokens in cookies, you might retrieve it like this:
    // return getCookie("authToken");
}

// Example getCookie function if needed:
// function getCookie(name) {
//     const value = `; ${document.cookie}`;
//     const parts = value.split(`; ${name}=`);
//     if (parts.length === 2) return parts.pop().split(";").shift();
// }

// Place this function with other utility functions
function isRealtimePreviewEnabled() {
    const realtimeToggle = document.getElementById("realtimePreview");
    return realtimeToggle ? realtimeToggle.checked : false;
}

// Place this function with other utility functions
function showLoadingState(message = "Loading...") {
    const loadingIndicator = document.getElementById("loadingIndicator");
    const loadingMessage = document.getElementById("loadingMessage");
    
    if (loadingIndicator) {
        loadingIndicator.style.display = "flex"; // Use flex to center content
    }
    
    if (loadingMessage) {
        loadingMessage.textContent = message;
    }
}

// Place this function with other utility functions
function hideLoadingState() {
    const loadingIndicator = document.getElementById("loadingIndicator");
    if (loadingIndicator) {
        loadingIndicator.style.display = "none";
    }
}
// Place this function with other utility functions
function showErrorState(message) {
    const errorContainer = document.getElementById("errorContainer");
    const errorMessage = document.getElementById("errorMessage");
    
    if (errorContainer) {
        errorContainer.style.display = "block";
    }
    
    if (errorMessage) {
        errorMessage.textContent = message;
    }
    
    // Always hide loading state if an error occurs
    hideLoadingState();
}
// Place this function with other utility functions
function applyPreviewFrameEnhancements() {
    const previewFrame = document.getElementById("templatePreviewFrame");
    if (!previewFrame) return;
    
    try {
        // Access the contentDocument of the iframe
        const frameDocument = previewFrame.contentDocument || previewFrame.contentWindow.document;
        
        // Example: Add a click handler to the iframe's document
        frameDocument.addEventListener("click", handlePreviewFrameClick);
        
        // Example: Add a scroll handler to the iframe's document
        frameDocument.addEventListener("scroll", handlePreviewFrameScroll);
        
        // You can also inject CSS or JavaScript into the iframe here if needed
        // const style = frameDocument.createElement("style");
        // style.textContent = "body { background-color: #f0f0f0; }";
        // frameDocument.head.appendChild(style);
        
    } catch (error) {
        // This catch block will typically execute if the iframe content is from a different origin
        // due to browser security restrictions (Same-Origin Policy).
        console.log("Preview frame enhancements limited due to cross-origin restrictions or iframe not fully loaded:", error);
    }
}
// Place these functions with other utility functions
function handlePreviewFrameClick(event) {
    // Log clicks within the preview frame for debugging or analytics
    console.log("Preview frame clicked:", event.target);
    // You could add logic here to prevent default link behavior, etc.
}

function handlePreviewFrameScroll(event) {
    // Log scroll events within the preview frame
    console.log("Preview frame scrolled");
    // You could add logic here for lazy loading or other scroll-based effects
}

// Place this function with your other utility functions in template-preview-script.js
function handleAPIError(error, context = "API request") {
    console.error(`Error in ${context}:`, error);
    
    let userMessage = "An unexpected error occurred. Please try again.";
    
    if (error.message) {
        if (error.message.includes("Authentication") || error.message.includes("token")) {
            userMessage = "Your session has expired or you are not logged in. Please log in to continue.";
            // Optionally, redirect to login page after a short delay
            setTimeout(() => redirectToLogin(), 2000);
        } else if (error.message.includes("not found")) {
            userMessage = "The requested data or template was not found.";
        } else if (error.message.includes("network") || error.message.includes("fetch")) {
            userMessage = "Network error: Please check your internet connection and try again.";
        } else {
            userMessage = error.message; // Display the specific error message from the backend
        }
    }
    
    showErrorState(userMessage); // Use your existing showErrorState function
    return userMessage;
}

function redirectToLogin() {
    // Implement this function based on your application's routing
    // Example: window.location.href = "/login.html";
    console.log("Redirecting to login page...");
}