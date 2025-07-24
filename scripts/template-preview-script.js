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
document.addEventListener("DOMContentLoaded", async function() {
    // Initialize all components
    initProfileDropdown();
    initMobileNavigation();
    initLogoutModal();
    updateBreadcrumbs();
    setActiveNavLink();
    
    // CRITICAL FIX: Initialize action buttons FIRST before loading template data
    initActionButtons();
    initializeTemplatePreview();
    // Get template ID from URL parameters
    const templateId = getTemplateIdFromURL();
    
    if (templateId) {
        await loadTemplateData(templateId);
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
    
    // Download button
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        console.log('Download button found, attaching event listener');
        downloadBtn.addEventListener('click', handleDownload);
    } else {
        console.error('Download button not found in DOM');
    }
    
    // Save button
    const saveBtn = document.getElementById('save-btn');
    if (saveBtn) {
        console.log('Save button found, attaching event listener');
        saveBtn.addEventListener('click', handleSave);
    } else {
        console.error('Save button not found in DOM');
    }
    
    // CRITICAL FIX: Ensure modal is hidden on page load using CSS class
    const saveModal = document.getElementById('saveTemplateModal');
    if (saveModal) {
        saveModal.classList.remove('show'); // Remove the show class
        console.log('Save modal found and hidden on page load');
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
 * Extract template ID from URL parameters
 */
function getTemplateIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('templateId');
}

/**
 * Load template data from backend API
 */
async function loadTemplateData(templateId) {
    showLoading();
    
    try {
        const response = await fetch(`/api/templates/${templateId}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch template: ${response.status} ${response.statusText}`);
        }
        
        const template = await response.json();
        
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
 * Populate template information in the UI
 */
function populateTemplateInfo(template) {
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
 * Load template preview in iframe
 */
async function loadTemplatePreview(template) {
    const iframe = document.getElementById("preview-iframe");
    
    if (!iframe) {
        console.error("Preview iframe not found");
        return;
    }
    
    try {
        // Use the HTML content from the database
        let templateHTML = template.htmlContent;
        
        if (!templateHTML) {
            throw new Error("No HTML content found for this template");
        }
        
        // Apply any customizations
        templateHTML = applyCustomizations(templateHTML);
        
        // Set the iframe content
        iframe.srcdoc = templateHTML;
        
        // Wait for iframe to load
        iframe.onload = function() {
            // Apply any additional styling or customizations
            applyIframeCustomizations(iframe);
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
 * Apply customizations to iframe content
 */
function applyIframeCustomizations(iframe) {
    try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        if (!iframeDoc) return;
        
        // Add any additional styling or scripts to the iframe content
        const style = iframeDoc.createElement('style');
        style.textContent = `
            /* Additional iframe styling */
            body {
                margin: 0;
                padding: 20px;
                box-sizing: border-box;
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
        `;
        
        iframeDoc.head.appendChild(style);
        
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
        showNotification(`Template downloaded successfully as ${format.toUpperCase()}!`, 'success');
        
    } catch (error) {
        console.error('Download error:', error);
        showNotification(`Failed to download ${format.toUpperCase()} template: ${error.message}`, 'error');
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
    // Fetch template data
    const response = await fetch(`/api/templates/${templateId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch template data');
    }
    
    const template = await response.json();
    const customizations = getCustomizationSettings();
    
    // Prepare download request
    const downloadData = {
        templateId: templateId,
        format: format,
        customizations: customizations,
        templateData: {
            name: template.name,
            htmlContent: applyCustomizations(template.htmlContent)
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
    
    // Set appropriate filename and extension
    const fileName = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_template`;
    const extension = format === 'pdf' ? '.pdf' : '.docx';
    a.download = fileName + extension;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Update download count
    await updateDownloadCount(templateId);
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
    
    // Get current customizations
    const customizations = getCustomizationSettings();
    
    // Apply customizations to template content
    const customizedContent = applyCustomizations(originalTemplate.htmlContent);
    
    // Prepare save data
    const saveData = {
        userId: userId,
        originalTemplateId: templateId,
        name: templateName,
        description: templateDescription,
        htmlContent: customizedContent,
        customizations: customizations,
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
    
    // Load saved customizations
    const savedOptions = JSON.parse(localStorage.getItem("templateCustomization")) || {};
    
    if (colorScheme && savedOptions.colorScheme) {
        colorScheme.value = savedOptions.colorScheme;
    }
    
    if (fontFamily && savedOptions.fontFamily) {
        fontFamily.value = savedOptions.fontFamily;
    }
    
    if (layoutStyle && savedOptions.layoutStyle) {
        layoutStyle.value = savedOptions.layoutStyle;
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
    
    // Save to localStorage
    localStorage.setItem("templateCustomization", JSON.stringify(customizations));
    
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
    try {
        // Get template ID from URL parameters (e.g., template-preview.html?templateId=...) 
        currentTemplateId = getTemplateIdFromURL();
        if (!currentTemplateId) {
            throw new Error('No template ID provided in URL');
        }
        
        // Get current user ID (you need to implement getCurrentUserId() based on your auth system)
        currentUserId = getCurrentUserId();
        if (!currentUserId) {
            // If user is not authenticated, you might want to redirect to login or show a message
            showErrorState('User not authenticated. Please log in to view your resume preview.');
            return; // Stop execution if no user ID
        }
        
        // Show a loading indicator while data is being fetched and processed
        showLoadingState('Loading your personalized resume preview...');
        
        // Fetch user data and template data simultaneously for efficiency
        const [userData, templateData] = await Promise.all([
            fetchUserResumeData(currentUserId), // Fetches all resume data for the user
            fetchTemplateData(currentTemplateId) // Fetches the selected template's details
        ]);
        
        // Store the fetched user data globally for use in customization updates
        currentUserData = userData;
        
        // Populate the template with the fetched user data and current customizations
        await populateTemplatePreview(templateData, userData, currentCustomizations);
        
        // Initialize the customization controls (color, font, layout selectors)
        initializeCustomizationControls();
        
        // Hide the loading indicator once everything is loaded
        hideLoadingState();
        
        console.log('Template preview initialized successfully with user data.');
        
    } catch (error) {
        console.error('Error initializing template preview:', error);
        // Display a user-friendly error message
        showErrorState('Failed to load template preview. Please ensure you are logged in and have resume data. ' + error.message);
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
async function populateTemplatePreview(templateData, userData, customizations) {
    try {
        // Make a POST request to your backend to get the populated HTML
        const response = await fetch(`/api/templates/${currentTemplateId}/populate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${getAuthToken()}` // Include auth token
            },
            body: JSON.stringify({
                userId: currentUserId,
                customizations: customizations // Send current customization settings
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to get populated template from backend');
        }
        
        const result = await response.json();
        
        // Update the template information displayed on the page (name, description, features)
        updateTemplateInfoDisplay(templateData, result.data);
        
        // Render the received populated HTML into the iframe
        renderPopulatedTemplate(result.data.populatedHTML);
        
        // Update the customization preview section on the page
        updateCustomizationPreview(customizations);
        
        console.log('Template populated and rendered successfully.');
        
    } catch (error) {
        console.error('Error populating template preview:', error);
        throw error;
    }
}

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
        await populateTemplatePreview(templateData, currentUserData, currentCustomizations);
        
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