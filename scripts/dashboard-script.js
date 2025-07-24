// Enhanced Dashboard Script with Dynamic Resume Loading
document.addEventListener("DOMContentLoaded", function() {
    // Initialize all dashboard components
    initializeProfileDropdown();
    initializeMobileNavigation();
    initializeResumesSection();
    updateStatistics();
});

/**
 * Initialize the resumes section with dynamic loading
 */
function initializeResumesSection() {
    setupResumesEventListeners();
    loadUserResumes();
}

/**
 * Set up event listeners for the resumes section
 */
function setupResumesEventListeners() {
    // Refresh button
    const refreshBtn = document.getElementById('refreshResumes');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadUserResumes(true);
        });
    }
    
    // Retry button
    const retryBtn = document.getElementById('retryLoadResumes');
    if (retryBtn) {
        retryBtn.addEventListener('click', () => {
            loadUserResumes();
        });
    }
}

/**
 * Load user resumes from the API
 */
async function loadUserResumes(forceRefresh = false) {
    const userId = getCurrentUserId();
    
    if (!userId) {
        showResumesError('Please log in to view your resumes.');
        return;
    }
    
    // Show loading state
    showResumesLoading();
    
    try {
        // Add cache busting parameter if force refresh
        const cacheParam = forceRefresh ? `&_t=${Date.now()}` : '';
        const response = await fetch(`/api/user-templates/${userId}?limit=20&sortBy=updatedAt&sortOrder=desc${cacheParam}`);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch resumes: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Render the resumes
        renderResumes(data.templates || []);
        
        // Update statistics
        updateStatistics(data.templates || []);
        
        // Hide loading state
        hideResumesLoading();
        
    } catch (error) {
        console.error('Error loading resumes:', error);
        showResumesError('Failed to load your resumes. Please check your internet connection and try again.');
    }
}

/**
 * Render resumes in the cards container
 */
function renderResumes(resumes) {
    const container = document.getElementById('resumeCards');
    const emptyState = document.getElementById('resumesEmpty');
    
    if (!container) return;
    
    // Show empty state if no resumes
    if (!resumes || resumes.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }
    
    // Hide empty state
    if (emptyState) emptyState.style.display = 'none';
    
    // Generate resume cards HTML
    const resumesHTML = resumes.map(resume => createResumeCardHTML(resume)).join('');
    container.innerHTML = resumesHTML;
    
    // Add animation class to new cards
    const cards = container.querySelectorAll('.resume-card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('new');
        }, index * 100);
    });
    
    // Attach event listeners to action buttons
    attachResumeActionListeners();
}

/**
 * Create HTML for a single resume card
 */
function createResumeCardHTML(resume) {
    const createdDate = formatDate(resume.createdAt);
    const updatedDate = formatDate(resume.updatedAt);
    const isRecent = isRecentlyUpdated(resume.updatedAt);
    
    return `
        <div class="resume-card" data-resume-id="${resume._id}">
            <div class="resume-header">
                <div class="resume-icon">
                    <i class="fas fa-file-alt"></i>
                </div>
                <div class="resume-status ${isRecent ? 'recent' : ''}">${isRecent ? 'Recent' : 'Saved'}</div>
            </div>
            
            <div class="resume-content">
                <h3 class="resume-title">${escapeHtml(resume.name)}</h3>
                <p class="resume-description">${escapeHtml(resume.description || 'No description provided')}</p>
                
                <div class="resume-meta">
                    <div class="resume-meta-item">
                        <i class="fas fa-calendar-plus"></i>
                        <span>Created ${createdDate}</span>
                    </div>
                    <div class="resume-meta-item">
                        <i class="fas fa-clock"></i>
                        <span>Updated ${updatedDate}</span>
                    </div>
                    <div class="resume-meta-item-download">
                        <i class="fas fa-download"></i>
                        <span>${resume.downloads || 0} downloads</span>
                    </div>
                </div>
                
                <div class="resume-customizations">
                    <span class="customization-tag">${formatCustomizationValue(resume.customizations?.colorScheme)}</span>
                    <span class="customization-tag">${formatCustomizationValue(resume.customizations?.fontFamily)}</span>
                    <span class="customization-tag">${formatCustomizationValue(resume.customizations?.layoutStyle)}</span>
                </div>
            </div>
            
            <div class="resume-actions">
                <button class="action-btn view-btn" data-action="view" data-resume-id="${resume._id}" title="View Resume">
                    <i class="fas fa-eye"></i>
                    <span>Edit</span>
                </button>
                <button class="action-btn edit-btn" data-action="edit" data-resume-id="${resume._id}" title="Edit Resume">
                    <i class="fas fa-edit"></i>
                    <span>Edit</span>
                </button>
                <button class="action-btn download-btn" data-action="download" data-resume-id="${resume._id}" title="Download Resume">
                    <i class="fas fa-download"></i>
                    <span>Download</span>
                </button>
                <button class="action-btn share-btn" data-action="share" data-resume-id="${resume._id}" title="Share Resume">
                    <i class="fas fa-share-alt"></i>
                    <span>Share</span>
                </button>
                <button class="action-btn delete-btn" data-action="delete" data-resume-id="${resume._id}" title="Delete Resume">
                    <i class="fas fa-trash"></i>
                    <span>Delete</span>
                </button>
            </div>
        </div>
    `;
}

/**
 * Attach event listeners to resume action buttons
 */
function attachResumeActionListeners() {
    const actionButtons = document.querySelectorAll('.resume-actions .action-btn');
    
    actionButtons.forEach(button => {
        button.addEventListener('click', handleResumeAction);
    });
}

/**
 * Handle resume action button clicks
 */
async function handleResumeAction(event) {
    const button = event.currentTarget;
    const action = button.dataset.action;
    const resumeId = button.dataset.resumeId;
    
    if (!action || !resumeId) {
        console.error('Missing action or resume ID');
        return;
    }
    
    // Prevent multiple clicks
    if (button.disabled) return;
    
    try {
        switch (action) {
            case 'view':
                await handleViewResume(resumeId, button);
                break;
            case 'edit':
                await handleEditResume(resumeId, button);
                break;
            case 'download':
                await handleDownloadResume(resumeId, button);
                break;
            case 'share':
                await handleShareResume(resumeId, button);
                break;
            case 'delete':
                await handleDeleteResume(resumeId, button);
                break;
            default:
                console.error('Unknown action:', action);
        }
    } catch (error) {
        console.error(`Error handling ${action} action:`, error);
        showNotification(`Failed to ${action} resume. Please try again.`, 'error');
    }
}

/**
 * Handle view resume action
 */
async function handleViewResume(resumeId, button) {
    setButtonLoading(button, true);
    
    try {
        // Navigate to a preview page for user templates
        window.location.href = `user-template-preview.html?templateId=${resumeId}`;
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Handle edit resume action
 */
async function handleEditResume(resumeId, button) {
    setButtonLoading(button, true);
    
    try {
        // Navigate to template editor with the user template
        window.location.href = `template-editor.html?userTemplateId=${resumeId}`;
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Handle download resume action
 */
async function handleDownloadResume(resumeId, button) {
    setButtonLoading(button, true);
    
    try {
        // Mark this resume as selected for download
        const resumeCard = button.closest('.resume-card');
        if (resumeCard) {
            // Remove selection from other cards
            document.querySelectorAll('.resume-card').forEach(card => {
                card.classList.remove('selected');
                card.removeAttribute('data-selected-for-download');
            });
            // Mark current card as selected
            resumeCard.classList.add('selected');
            resumeCard.dataset.selectedForDownload = 'true';
        }
        
        // Show the download format selection modal
        showDownloadModal();
        
    } catch (error) {
        console.error('Error initiating download:', error);
        showNotification('Failed to initiate download. Please try again.', 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

function getTemplateIdFromURL() {
    // In dashboard context, we'll get the template ID from the currently selected resume
    const selectedResumeCard = document.querySelector('.resume-card[data-selected-for-download="true"]');
    return selectedResumeCard?.dataset.resumeId || null;
}

/**
 * Get customization settings (dashboard context adaptation)
 */
function getCustomizationSettings() {
    // In dashboard context, we'll get customizations from the selected resume card
    const selectedResumeCard = document.querySelector('.resume-card[data-selected-for-download="true"]');
    if (selectedResumeCard) {
        const customizationTags = selectedResumeCard.querySelectorAll('.customization-tag');
        const customizations = {
            colorScheme: customizationTags[0]?.textContent || 'Default',
            fontFamily: customizationTags[1]?.textContent || 'Default',
            layoutStyle: customizationTags[2]?.textContent || 'Default'
        };
        return customizations;
    }
    
    return {
        colorScheme: 'Default',
        fontFamily: 'Default',
        layoutStyle: 'Default'
    };
}

/**
 * Apply customizations to HTML content
 */
function applyCustomizations(htmlContent) {
    // For now, return the content as-is
    // You can enhance this later to apply actual customizations
    return htmlContent;
}

/**
 * Update download count for a template
 */
async function updateDownloadCount(templateId) {
    try {
        const userId = getCurrentUserId();
        await fetch(`/api/user-templates/${userId}/${templateId}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Failed to update download count:', error);
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
        const btnText = confirmBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Select Format';
        }
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
        colorSchemeElement.textContent = customizations.colorScheme;
    }
    
    // Update font family preview
    const fontFamilyElement = document.getElementById('downloadPreviewFontFamily');
    if (fontFamilyElement) {
        fontFamilyElement.textContent = customizations.fontFamily;
    }
    
    // Update layout style preview
    const layoutStyleElement = document.getElementById('downloadPreviewLayoutStyle');
    if (layoutStyleElement) {
        layoutStyleElement.textContent = customizations.layoutStyle;
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
        modal.classList.add('hiding');
        setTimeout(() => {
            modal.classList.remove('show', 'hiding');
        }, 300);
    }
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleDownloadEscapeKey);
    
    // Clear selection from resume cards
    document.querySelectorAll('.resume-card').forEach(card => {
        card.classList.remove('selected');
        card.removeAttribute('data-selected-for-download');
    });
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
        showNotification(`Resume downloaded successfully as ${format.toUpperCase()}!`, 'success');
        
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
 * Perform download based on selected format - Dashboard version
 */
async function performFormatDownload(templateId, format) {
    const userId = getCurrentUserId();
    if (!userId) {
        throw new Error('Please log in to download templates');
    }
    
    // Fetch user template data
    const response = await fetch(`/api/user-templates/${userId}/${templateId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch template data');
    }
    
    const template = await response.json();
    const customizations = template.customizations || getCustomizationSettings();
    
    // Prepare download request
    const downloadData = {
        templateId: templateId,
        format: format,
        customizations: customizations,
        templateData: {
            name: template.name,
            htmlContent: template.htmlContent || template.content || '<html><body><h1>Resume Template</h1></body></html>'
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
    const fileName = `${template.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_resume`;
    const extension = format === 'pdf' ? '.pdf' : '.docx';
    a.download = fileName + extension;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Update download count in the resume card
    const resumeCard = document.querySelector(`[data-resume-id="${templateId}"]`);
    if (resumeCard) {
        const downloadCountElement = resumeCard.querySelector('.resume-meta-item-download span');
        if (downloadCountElement) {
            const currentCount = parseInt(downloadCountElement.textContent.match(/\d+/)?.[0] || '0');
            downloadCountElement.textContent = `${currentCount + 1} downloads`;
        }
        // Remove the selection marker
        resumeCard.removeAttribute('data-selected-for-download');
    }
    
    // Update download count on server
    await updateDownloadCount(templateId);
    
    // Update statistics
    setTimeout(() => {
        updateStatistics();
    }, 500);
}
/**
 * Handle share resume action
 */
async function handleShareResume(resumeId, button) {
    setButtonLoading(button, true);
    
    try {
        // Create a shareable link (you may need to implement a public sharing endpoint)
        const shareUrl = `${window.location.origin}/shared-resume.html?id=${resumeId}`;
        
        // Try to use the Web Share API if available
        if (navigator.share) {
            await navigator.share({
                title: 'Check out my resume',
                text: 'I created this resume using NextHire',
                url: shareUrl
            });
            showNotification('Resume shared successfully!', 'success');
        } else {
            // Fallback to copying to clipboard
            await navigator.clipboard.writeText(shareUrl);
            showNotification('Share link copied to clipboard!', 'success');
        }
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Share error:', error);
            showNotification('Failed to share resume', 'error');
        }
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Handle delete resume action
 */
async function handleDeleteResume(resumeId, button) {
    const resumeCard = button.closest('.resume-card');
    const resumeTitle = resumeCard?.querySelector('.resume-title')?.textContent || 'this resume';
    
    if (!confirm(`Are you sure you want to delete "${resumeTitle}"? This action cannot be undone.`)) {
        return;
    }
    
    setButtonLoading(button, true);
    
    try {
        const userId = getCurrentUserId();
        const response = await fetch(`/api/user-templates/${userId}/${resumeId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            throw new Error('Failed to delete resume');
        }
        
        showNotification('Resume deleted successfully!', 'success');
        
        // Remove the card with animation
        if (resumeCard) {
            resumeCard.style.animation = 'slideOutUp 0.3s ease-out';
            setTimeout(() => {
                resumeCard.remove();
                
                // Check if no more resumes and show empty state
                const remainingCards = document.querySelectorAll('.resume-card');
                if (remainingCards.length === 0) {
                    const emptyState = document.getElementById('resumesEmpty');
                    if (emptyState) emptyState.style.display = 'block';
                }
            }, 300);
        }
        
        // Update statistics
        setTimeout(() => {
            updateStatistics();
        }, 500);
        
    } finally {
        setButtonLoading(button, false);
    }
}

/**
 * Set button loading state
 */
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.disabled = true;
        button.classList.add('loading');
    } else {
        button.disabled = false;
        button.classList.remove('loading');
    }
}

/**
 * Show loading state for resumes section
 */
function showResumesLoading() {
    const loading = document.getElementById('resumesLoading');
    const error = document.getElementById('resumesError');
    const empty = document.getElementById('resumesEmpty');
    const cards = document.getElementById('resumeCards');
    
    if (loading) loading.style.display = 'block';
    if (error) error.style.display = 'none';
    if (empty) empty.style.display = 'none';
    if (cards) cards.style.opacity = '0.5';
}

/**
 * Hide loading state for resumes section
 */
function hideResumesLoading() {
    const loading = document.getElementById('resumesLoading');
    const cards = document.getElementById('resumeCards');
    
    if (loading) loading.style.display = 'none';
    if (cards) cards.style.opacity = '1';
}

/**
 * Show error state for resumes section
 */
function showResumesError(message) {
    const loading = document.getElementById('resumesLoading');
    const error = document.getElementById('resumesError');
    const empty = document.getElementById('resumesEmpty');
    const cards = document.getElementById('resumeCards');
    const errorMessage = document.getElementById('errorMessage');
    
    if (loading) loading.style.display = 'none';
    if (error) error.style.display = 'block';
    if (empty) empty.style.display = 'none';
    if (cards) cards.innerHTML = '';
    if (errorMessage) errorMessage.textContent = message;
}

/**
 * Update statistics based on resumes data
 */
async function updateStatistics(resumes = null) {
    try {
        if (!resumes) {
            const userId = getCurrentUserId();
            if (!userId) return;
            
            const response = await fetch(`/api/user-templates/${userId}?limit=100`);
            if (response.ok) {
                const data = await response.json();
                resumes = data.templates || [];
            } else {
                return;
            }
        }
        
        // Calculate statistics
        const totalResumes = resumes.length;
        const totalDownloads = resumes.reduce((sum, resume) => sum + (resume.downloads || 0), 0);
        const lastEdited = resumes.length > 0 ? 
            formatRelativeDate(Math.max(...resumes.map(r => new Date(r.updatedAt).getTime()))) : 
            'Never';
        
        // Update statistics display
        updateStatCard('resumes created', totalResumes);
        updateStatCard('Downloads', totalDownloads);
        updateStatCard('Last Edited', lastEdited);
        
    } catch (error) {
        console.error('Error updating statistics:', error);
    }
}

/**
 * Update a single stat card
 */
function updateStatCard(label, value) {
    const statCards = document.querySelectorAll('.stat-card');
    
    statCards.forEach(card => {
        const labelElement = card.querySelector('.stat-label');
        if (labelElement && labelElement.textContent.toLowerCase().includes(label.toLowerCase())) {
            const valueElement = card.querySelector('.stat-value');
            if (valueElement) {
                valueElement.textContent = value;
            }
        }
    });
}

/**
 * Utility Functions
 */

function getCurrentUserId() {
    return localStorage.getItem('userId') || sessionStorage.getItem('userId');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatRelativeDate(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
}

function isRecentlyUpdated(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    return diffHours < 24; // Consider recent if updated within 24 hours
}

function formatCustomizationValue(value) {
    if (!value || value === 'default') {
        return 'Default';
    }
    
    return value
        .replace(/([A-Z])/g, ' $1')
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .trim();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

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

function getNotificationIcon(type) {
    const icons = {
        'success': 'check-circle',
        'error': 'exclamation-circle',
        'warning': 'exclamation-triangle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

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
 * Initialize profile dropdown (existing functionality)
 */
function initializeProfileDropdown() {
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

/**
 * Initialize mobile navigation (existing functionality)
 */
function initializeMobileNavigation() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    
    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", function() {
            navLinks.classList.toggle("active");
            this.classList.toggle("active");
        });
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
        
        @keyframes slideOutUp {
            from {
                opacity: 1;
                transform: translateY(0);
            }
            to {
                opacity: 0;
                transform: translateY(-20px);
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