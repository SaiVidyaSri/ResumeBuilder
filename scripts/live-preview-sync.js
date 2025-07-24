// Live Preview Synchronization Script
// This script handles the synchronization between form fields and the live preview

// Main function to initialize live preview synchronization
function initLivePreviewSync() {
    // Get the preview iframe
    const previewIframe = document.getElementById('preview-iframe');
    if (!previewIframe) {
        console.error('Preview iframe not found');
        return;
    }
    
    // Initialize the preview with default template
    initializePreview(previewIframe);
    
    // Set up event delegation for all form inputs in the section editor
    const sectionEditor = document.getElementById('section-editor');
    if (sectionEditor) {
        sectionEditor.addEventListener('input', function(event) {
            const target = event.target;
            
            // Check if the event target is a form input
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
                // Get the section ID from the active section
                const activeSection = document.querySelector('.section-item.active');
                if (!activeSection) return;
                
                const sectionId = activeSection.getAttribute('data-section');
                
                // Update the preview based on the input change
                updatePreviewForField(previewIframe, sectionId, target);
            }
        });
        
        // Handle special cases like tag additions/removals
        sectionEditor.addEventListener('click', function(event) {
            if (event.target.classList.contains('remove-tag')) {
                // Wait a moment for the tag to be removed from the DOM
                setTimeout(() => {
                    const activeSection = document.querySelector('.section-item.active');
                    if (!activeSection) return;
                    
                    const sectionId = activeSection.getAttribute('data-section');
                    updatePreviewForSection(previewIframe, sectionId);
                }, 100);
            }
        });
    }
    
    // Set up event listeners for section selection
    const sectionItems = document.querySelectorAll('.section-item');
    sectionItems.forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            
            // Remove active class from all sections
            sectionItems.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked section
            this.classList.add('active');
            
            // Load the appropriate form for this section
            if (window.loadSectionForm) {
                window.loadSectionForm(sectionId);
                
                // Update the preview to highlight this section
                highlightSectionInPreview(previewIframe, sectionId);
            }
        });
    });
    
    // Set up event listeners for edit buttons
    const editButtons = document.querySelectorAll('.edit-section-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent triggering the section item click
            
            const sectionId = this.getAttribute('data-section');
            
            // Remove active class from all sections
            sectionItems.forEach(s => s.classList.remove('active'));
            
            // Add active class to the parent section item
            const parentSection = this.closest('.section-item');
            if (parentSection) {
                parentSection.classList.add('active');
            }
            
            // Load the appropriate form for this section
            if (window.loadSectionForm) {
                window.loadSectionForm(sectionId);
                
                // Update the preview to highlight this section
                highlightSectionInPreview(previewIframe, sectionId);
            }
        });
    });
    
    // Set up event listeners for remove buttons
    const removeButtons = document.querySelectorAll('.remove-section-btn');
    removeButtons.forEach(button => {
        button.addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent triggering the section item click
            
            const sectionId = this.getAttribute('data-section');
            
            // Show confirmation modal
            const modal = document.getElementById('removeSectionModal');
            if (modal) {
                modal.classList.add('active');
                
                // Store the section ID to be removed
                modal.setAttribute('data-section-to-remove', sectionId);
                
                // Set up confirm button
                const confirmButton = document.getElementById('confirm-remove-section-btn');
                if (confirmButton) {
                    confirmButton.onclick = function() {
                        const sectionToRemove = modal.getAttribute('data-section-to-remove');
                        removeSection(previewIframe, sectionToRemove);
                        modal.classList.remove('active');
                    };
                }
                
                // Set up cancel button
                const cancelButtons = modal.querySelectorAll('.cancel-btn, .close-modal-btn');
                cancelButtons.forEach(btn => {
                    btn.onclick = function() {
                        modal.classList.remove('active');
                    };
                });
            }
        });
    });
    
    // Set up save button
    const saveButton = document.getElementById('save-section-btn');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            const activeSection = document.querySelector('.section-item.active');
            if (!activeSection) return;
            
            const sectionId = activeSection.getAttribute('data-section');
            
            // Save the form data
            saveFormData(sectionId);
            
            // Update the preview
            updatePreviewForSection(previewIframe, sectionId);
            
            // Show success notification
            showNotification('Changes saved successfully!', 'success');
        });
    }
    
    // Set up zoom controls
    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    const zoomLevel = document.getElementById('zoom-level');
    
    if (zoomInBtn && zoomOutBtn && zoomLevel) {
        let currentZoom = 100;
        
        zoomInBtn.addEventListener('click', function() {
            if (currentZoom < 200) {
                currentZoom += 10;
                updateZoom();
            }
        });
        
        zoomOutBtn.addEventListener('click', function() {
            if (currentZoom > 50) {
                currentZoom -= 10;
                updateZoom();
            }
        });
        
        function updateZoom() {
            zoomLevel.textContent = `${currentZoom}%`;
            
            if (previewIframe.contentDocument) {
                const scale = currentZoom / 100;
                const body = previewIframe.contentDocument.body;
                if (body) {
                    body.style.transform = `scale(${scale})`;
                    body.style.transformOrigin = 'top center';
                }
            }
        }
    }
    
    // Set up download button
    const downloadBtn = document.getElementById('download-resume-btn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function() {
            const modal = document.getElementById('downloadOptionsModal');
            if (modal) {
                modal.classList.add('active');
                
                // Set up download options
                const pdfBtn = document.getElementById('download-pdf-btn');
                const docxBtn = document.getElementById('download-docx-btn');
                
                if (pdfBtn) {
                    pdfBtn.onclick = function() {
                        if (window.downloadResume) {
                            window.downloadResume('pdf');
                        } else {
                            showNotification('PDF download functionality not available', 'error');
                        }
                    };
                }
                
                if (docxBtn) {
                    docxBtn.onclick = function() {
                        if (window.downloadResume) {
                            window.downloadResume('docx');
                        } else {
                            showNotification('Word document download functionality not available', 'error');
                        }
                    };
                }
                
                // Set up close button
                const closeBtn = modal.querySelector('.close-modal-btn');
                if (closeBtn) {
                    closeBtn.onclick = function() {
                        modal.classList.remove('active');
                    };
                }
            }
        });
    }
}

// Initialize the preview iframe with default template
function initializePreview(iframe) {
    if (!iframe.contentDocument) {
        console.error('Cannot access iframe document');
        return;
    }
    
    // Load the resume data from localStorage or use default data
    const resumeData = loadResumeData();
    
    // Generate HTML for the preview
    const previewHtml = generateResumeHtml(resumeData);
    
    // Write to the iframe
    iframe.contentDocument.open();
    iframe.contentDocument.write(previewHtml);
    iframe.contentDocument.close();
    
    // Apply styles to the iframe content
    applyStylesToPreview(iframe);
}

// Load resume data from localStorage or return default data
function loadResumeData() {
    const savedData = localStorage.getItem('resumeData');
    
    if (savedData) {
        try {
            return JSON.parse(savedData);
        } catch (e) {
            console.error('Error parsing saved resume data:', e);
        }
    }
    
    // Return default data structure
    return {
        basics: {
            fullName: 'Your Name',
            jobTitle: 'Professional Title',
            email: 'email@example.com',
            phone: '(123) 456-7890',
            city: 'City',
            region: 'State',
            website: '',
            linkedin: ''
        },
        summary: '',
        skills: {
            skillsList: []
        },
        education: {
            items: []
        },
        itskills: {
            items: []
        },
        work: {
            items: []
        },
        projects: {
            items: []
        },
        profileSummary: '',
        accomplishments: {
            items: []
        },
        career: {
            items: []
        },
        personal: {
            dateOfBirth: '',
            gender: '',
            nationality: '',
            maritalStatus: '',
            languages: '',
            hobbies: '',
            additionalInfo: ''
        }
    };
}

// Save form data to localStorage
function saveFormData(sectionId) {
    const resumeData = loadResumeData();
    
    // Get the form data based on the section
    const formData = collectFormData(sectionId);
    
    // Update the resume data
    if (sectionId === 'basics') {
        resumeData.basics = formData;
    } else {
        resumeData[sectionId] = formData;
    }
    
    // Save to localStorage
    localStorage.setItem('resumeData', JSON.stringify(resumeData));
    
    return resumeData;
}

// Collect form data from the current section
function collectFormData(sectionId) {
    const formData = {};
    
    // Get all inputs in the section editor
    const inputs = document.querySelectorAll('#section-editor input, #section-editor textarea, #section-editor select');
    
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            formData[input.id] = input.checked;
        } else if (input.type === 'radio') {
            if (input.checked) {
                formData[input.name] = input.value;
            }
        } else {
            formData[input.id] = input.value;
        }
    });
    
    // Handle special cases like tags
    const tagsContainers = document.querySelectorAll('#section-editor .tags-container');
    tagsContainers.forEach(container => {
        const tags = [];
        const tagElements = container.querySelectorAll('.tag');
        
        tagElements.forEach(tag => {
            // Get the text content without the × symbol
            const tagText = tag.textContent.replace('×', '').trim();
            tags.push(tagText);
        });
        
        // Find the parent tags input ID
        const tagsInput = container.closest('.tags-input');
        if (tagsInput) {
            formData[tagsInput.id] = tags;
        }
    });
    
    // For sections with items array
    if (['education', 'itskills', 'work', 'projects', 'accomplishments', 'career'].includes(sectionId)) {
        // Convert flat form data to items array
        formData.items = formData.items || [];
        
        // Create a new item with the current form data
        const newItem = { ...formData };
        delete newItem.items;
        
        // Add to items array
        formData.items.push(newItem);
    }
    
    return formData;
}

// Update the preview for a specific field change
function updatePreviewForField(iframe, sectionId, inputElement) {
    if (!iframe.contentDocument) {
        console.error('Cannot access iframe document');
        return;
    }
    
    const resumeData = loadResumeData();
    
    // Update the specific field in the resume data
    if (sectionId === 'basics') {
        resumeData.basics[inputElement.id] = inputElement.value;
    } else {
        if (!resumeData[sectionId]) {
            resumeData[sectionId] = {};
        }
        
        resumeData[sectionId][inputElement.id] = inputElement.value;
    }
    
    // Update the preview
    updatePreviewElement(iframe, sectionId, inputElement.id, inputElement.value);
    
    // Save the updated data
    localStorage.setItem('resumeData', JSON.stringify(resumeData));
}

// Update the preview for an entire section
function updatePreviewForSection(iframe, sectionId) {
    if (!iframe.contentDocument) {
        console.error('Cannot access iframe document');
        return;
    }
    
    const resumeData = saveFormData(sectionId);
    
    // Find the section in the preview
    const sectionElement = iframe.contentDocument.getElementById(`section-${sectionId}`);
    if (!sectionElement) {
        console.warn(`Section element not found in preview: ${sectionId}`);
        return;
    }
    
    // Generate the HTML for this section
    let sectionHtml = '';
    
    switch (sectionId) {
        case 'basics':
            sectionHtml = generateBasicsHtml(resumeData.basics);
            break;
        case 'summary':
            sectionHtml = generateSummaryHtml(resumeData.summary);
            break;
        case 'skills':
            sectionHtml = generateSkillsHtml(resumeData.skills);
            break;
        case 'education':
            sectionHtml = generateEducationHtml(resumeData.education);
            break;
        case 'itskills':
            sectionHtml = generateItSkillsHtml(resumeData.itskills);
            break;
        case 'work':
            sectionHtml = generateWorkHtml(resumeData.work);
            break;
        case 'projects':
            sectionHtml = generateProjectsHtml(resumeData.projects);
            break;
        case 'accomplishments':
            sectionHtml = generateAccomplishmentsHtml(resumeData.accomplishments);
            break;
        case 'career':
            sectionHtml = generateCareerHtml(resumeData.career);
            break;
        case 'personal':
            sectionHtml = generatePersonalHtml(resumeData.personal);
            break;
        default:
            console.warn(`Unknown section ID: ${sectionId}`);
            return;
    }
    
    // Update the section content
    sectionElement.innerHTML = sectionHtml;
}

// Update a specific element in the preview
function updatePreviewElement(iframe, sectionId, fieldId, value) {
    if (!iframe.contentDocument) {
        console.error('Cannot access iframe document');
        return;
    }
    
    // Find the element in the preview
    const element = iframe.contentDocument.querySelector(`[data-field="${fieldId}"]`);
    if (element) {
        element.textContent = value;
    } else {
        // If the element doesn't exist, update the entire section
        updatePreviewForSection(iframe, sectionId);
    }
}

// Highlight a section in the preview
function highlightSectionInPreview(iframe, sectionId) {
    if (!iframe.contentDocument) {
        console.error('Cannot access iframe document');
        return;
    }
    
    // Remove highlight from all sections
    const allSections = iframe.contentDocument.querySelectorAll('.resume-section');
    allSections.forEach(section => {
        section.classList.remove('highlighted');
    });
    
    // Add highlight to the selected section
    const sectionElement = iframe.contentDocument.getElementById(`section-${sectionId}`);
    if (sectionElement) {
        sectionElement.classList.add('highlighted');
        
        // Scroll the section into view
        sectionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Remove a section from the preview
function removeSection(iframe, sectionId) {
    if (!iframe.contentDocument) {
        console.error('Cannot access iframe document');
        return;
    }
    
    // Get the resume data
    const resumeData = loadResumeData();
    
    // Remove the section data
    if (sectionId !== 'basics') { // Don't allow removing the basics section
        delete resumeData[sectionId];
        
        // Save the updated data
        localStorage.setItem('resumeData', JSON.stringify(resumeData));
        
        // Remove the section from the preview
        const sectionElement = iframe.contentDocument.getElementById(`section-${sectionId}`);
        if (sectionElement) {
            sectionElement.remove();
        }
        
        // Hide the section item in the sidebar
        const sectionItem = document.querySelector(`.section-item[data-section="${sectionId}"]`);
        if (sectionItem) {
            sectionItem.classList.add('hidden');
        }
        
        // Show success notification
        showNotification('Section removed successfully', 'success');
    } else {
        showNotification('Cannot remove the Personal Information section', 'error');
    }
}

// Generate HTML for the entire resume
function generateResumeHtml(data) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Resume Preview</title>
            <style>
                /* Preview styles will be injected here */
            </style>
        </head>
        <body>
            <div class="resume-container">
                <div class="resume-header" id="section-basics">
                    ${generateBasicsHtml(data.basics)}
                </div>
                
                ${data.summary ? `
                <div class="resume-section" id="section-summary">
                    ${generateSummaryHtml(data.summary)}
                </div>
                ` : ''}
                
                ${data.skills && data.skills.skillsList && data.skills.skillsList.length > 0 ? `
                <div class="resume-section" id="section-skills">
                    ${generateSkillsHtml(data.skills)}
                </div>
                ` : ''}
                
                ${data.education && data.education.items && data.education.items.length > 0 ? `
                <div class="resume-section" id="section-education">
                    ${generateEducationHtml(data.education)}
                </div>
                ` : ''}
                
                ${data.itskills && data.itskills.items && data.itskills.items.length > 0 ? `
                <div class="resume-section" id="section-itskills">
                    ${generateItSkillsHtml(data.itskills)}
                </div>
                ` : ''}
                
                ${data.work && data.work.items && data.work.items.length > 0 ? `
                <div class="resume-section" id="section-work">
                    ${generateWorkHtml(data.work)}
                </div>
                ` : ''}
                
                ${data.projects && data.projects.items && data.projects.items.length > 0 ? `
                <div class="resume-section" id="section-projects">
                    ${generateProjectsHtml(data.projects)}
                </div>
                ` : ''}
                
                ${data.accomplishments && data.accomplishments.items && data.accomplishments.items.length > 0 ? `
                <div class="resume-section" id="section-accomplishments">
                    ${generateAccomplishmentsHtml(data.accomplishments)}
                </div>
                ` : ''}
                
                ${data.career && data.career.items && data.career.items.length > 0 ? `
                <div class="resume-section" id="section-career">
                    ${generateCareerHtml(data.career)}
                </div>
                ` : ''}
                
                ${data.personal ? `
                <div class="resume-section" id="section-personal">
                    ${generatePersonalHtml(data.personal)}
                </div>
                ` : ''}
            </div>
        </body>
        </html>
    `;
}

// Generate HTML for each section
function generateBasicsHtml(basics) {
    return `
        <h1 class="resume-name" data-field="fullName">${basics.fullName || 'Your Name'}</h1>
        <p class="resume-title" data-field="jobTitle">${basics.jobTitle || 'Professional Title'}</p>
        <div class="resume-contact">
            <div class="contact-item">
                <i class="fas fa-envelope"></i>
                <span data-field="email">${basics.email || 'email@example.com'}</span>
            </div>
            <div class="contact-item">
                <i class="fas fa-phone"></i>
                <span data-field="phone">${basics.phone || '(123) 456-7890'}</span>
            </div>
            <div class="contact-item">
                <i class="fas fa-map-marker-alt"></i>
                <span>${basics.city || 'City'}${basics.region ? ', ' + basics.region : ''}</span>
            </div>
            ${basics.website ? `
            <div class="contact-item">
                <i class="fas fa-globe"></i>
                <span data-field="website">${basics.website}</span>
            </div>
            ` : ''}
            ${basics.linkedin ? `
            <div class="contact-item">
                <i class="fab fa-linkedin"></i>
                <span data-field="linkedin">${basics.linkedin}</span>
            </div>
            ` : ''}
        </div>
    `;
}

function generateSummaryHtml(summary) {
    return `
        <h2 class="section-title">Resume Headline</h2>
        <p class="summary-text" data-field="resumeHeadline">${summary || 'Add your resume headline here'}</p>
    `;
}

function generateSkillsHtml(skills) {
    const skillsList = skills.skillsList || [];
    
    return `
        <h2 class="section-title">Key Skills</h2>
        <div class="skills-container">
            ${skillsList.length > 0 ? 
                skillsList.map(skill => `
                    <div class="skill-tag">${skill}</div>
                `).join('') : 
                '<p class="empty-text">No skills added yet</p>'
            }
        </div>
    `;
}

function generateEducationHtml(education) {
    const items = education.items || [];
    
    return `
        <h2 class="section-title">Education</h2>
        ${items.length > 0 ? 
            items.map(item => `
                <div class="education-item">
                    <h3>${item.degree || 'Degree'} ${item.fieldOfStudy ? `in ${item.fieldOfStudy}` : ''}</h3>
                    <h4>${item.institution || 'Institution'} ${item.location ? `- ${item.location}` : ''}</h4>
                    <p class="date-range">${item.startYear || 'Start Year'} - ${item.currentlyStudying ? 'Present' : (item.endYear || 'End Year')}</p>
                    ${item.description ? `<p class="description">${item.description}</p>` : ''}
                    ${item.grade ? `<p class="grade">Grade: ${item.grade}</p>` : ''}
                </div>
            `).join('') : 
            '<p class="empty-text">No education details added yet</p>'
        }
    `;
}

function generateItSkillsHtml(itskills) {
    const items = itskills.items || [];
    
    return `
        <h2 class="section-title">IT Skills</h2>
        ${items.length > 0 ? 
            items.map(item => `
                <div class="it-skill-item">
                    <h3>${item.skillName || 'Skill'} ${item.skillVersion ? `(${item.skillVersion})` : ''}</h3>
                    <div class="skill-details">
                        <span class="proficiency">${item.proficiencyLevel || 'Beginner'}</span>
                        <span class="experience">${item.yearsExperience || '0'} years experience</span>
                        ${item.lastUsed ? `<span class="last-used">Last used: ${item.lastUsed}</span>` : ''}
                    </div>
                </div>
            `).join('') : 
            '<p class="empty-text">No IT skills added yet</p>'
        }
    `;
}

function generateWorkHtml(work) {
    const items = work.items || [];
    
    return `
        <h2 class="section-title">Work Experience</h2>
        ${items.length > 0 ? 
            items.map(item => `
                <div class="work-item">
                    <h3>${item.jobTitle || 'Job Title'}</h3>
                    <h4>${item.companyName || 'Company'} ${item.location ? `- ${item.location}` : ''}</h4>
                    <p class="date-range">
                        ${item.startMonth ? `${getMonthName(item.startMonth)} ` : ''}${item.startYear || 'Start Year'} - 
                        ${item.currentJob ? 'Present' : `${item.endMonth ? `${getMonthName(item.endMonth)} ` : ''}${item.endYear || 'End Year'}`}
                        ${item.employmentType ? ` | ${item.employmentType}` : ''}
                    </p>
                    ${item.jobDescription ? `<p class="description">${item.jobDescription}</p>` : ''}
                </div>
            `).join('') : 
            '<p class="empty-text">No work experience added yet</p>'
        }
    `;
}

function generateProjectsHtml(projects) {
    const items = projects.items || [];
    
    return `
        <h2 class="section-title">Projects</h2>
        ${items.length > 0 ? 
            items.map(item => `
                <div class="project-item">
                    <h3>${item.projectTitle || 'Project Title'} ${item.clientName ? `for ${item.clientName}` : ''}</h3>
                    <p class="date-range">
                        ${item.startMonth ? `${getMonthName(item.startMonth)} ` : ''}${item.startYear || 'Start Year'} - 
                        ${item.currentProject ? 'Present' : `${item.endMonth ? `${getMonthName(item.endMonth)} ` : ''}${item.endYear || 'End Year'}`}
                    </p>
                    ${item.projectDescription ? `<p class="description">${item.projectDescription}</p>` : ''}
                    ${item.projectSkills && item.projectSkills.length > 0 ? `
                        <div class="project-skills">
                            <strong>Skills Used:</strong> ${item.projectSkills.join(', ')}
                        </div>
                    ` : ''}
                    ${item.projectUrl ? `<p class="project-url"><a href="${item.projectUrl}" target="_blank">${item.projectUrl}</a></p>` : ''}
                </div>
            `).join('') : 
            '<p class="empty-text">No projects added yet</p>'
        }
    `;
}

function generateAccomplishmentsHtml(accomplishments) {
    const items = accomplishments.items || [];
    
    return `
        <h2 class="section-title">Accomplishments</h2>
        ${items.length > 0 ? 
            items.map(item => {
                let accomplishmentHtml = '';
                
                switch (item.accomplishmentType) {
                    case 'online_profile':
                        accomplishmentHtml = `
                            <div class="accomplishment-item">
                                <h3>Online Profile: ${item.profileName || 'Profile'}</h3>
                                <p><a href="${item.profileUrl || '#'}" target="_blank">${item.profileUrl || 'URL'}</a></p>
                            </div>
                        `;
                        break;
                        
                    case 'work_sample':
                        accomplishmentHtml = `
                            <div class="accomplishment-item">
                                <h3>Work Sample: ${item.sampleTitle || 'Sample'}</h3>
                                <p><a href="${item.sampleUrl || '#'}" target="_blank">${item.sampleUrl || 'URL'}</a></p>
                            </div>
                        `;
                        break;
                        
                    case 'publication':
                        accomplishmentHtml = `
                            <div class="accomplishment-item">
                                <h3>Publication: ${item.publicationTitle || 'Publication'}</h3>
                                ${item.publisher ? `<p>${item.publisher}</p>` : ''}
                                <p class="date">
                                    ${item.publicationMonth ? `${getMonthName(item.publicationMonth)} ` : ''}${item.publicationYear || 'Year'}
                                </p>
                                ${item.publicationUrl ? `<p><a href="${item.publicationUrl}" target="_blank">${item.publicationUrl}</a></p>` : ''}
                            </div>
                        `;
                        break;
                        
                    case 'presentation':
                        accomplishmentHtml = `
                            <div class="accomplishment-item">
                                <h3>Presentation: ${item.presentationTitle || 'Presentation'}</h3>
                                ${item.presentationVenue ? `<p>${item.presentationVenue}</p>` : ''}
                                ${item.presentationUrl ? `<p><a href="${item.presentationUrl}" target="_blank">${item.presentationUrl}</a></p>` : ''}
                            </div>
                        `;
                        break;
                        
                    case 'patent':
                        accomplishmentHtml = `
                            <div class="accomplishment-item">
                                <h3>Patent: ${item.patentTitle || 'Patent'}</h3>
                                <p>
                                    ${item.patentOffice ? `${item.patentOffice} ` : ''}
                                    ${item.patentNumber ? `| ${item.patentNumber} ` : ''}
                                    ${item.patentStatus ? `| ${item.patentStatus}` : ''}
                                </p>
                                <p class="date">
                                    ${item.patentMonth ? `${getMonthName(item.patentMonth)} ` : ''}${item.patentYear || 'Year'}
                                </p>
                            </div>
                        `;
                        break;
                        
                    case 'certification':
                        accomplishmentHtml = `
                            <div class="accomplishment-item">
                                <h3>Certification: ${item.certificationName || 'Certification'}</h3>
                                ${item.certificationAuthority ? `<p>${item.certificationAuthority}</p>` : ''}
                                <p class="date">
                                    ${item.certificationMonth ? `${getMonthName(item.certificationMonth)} ` : ''}${item.certificationYear || 'Year'}
                                    ${item.expirationYear && item.expirationYear !== 'present' ? 
                                        ` - ${item.expirationMonth ? `${getMonthName(item.expirationMonth)} ` : ''}${item.expirationYear}` : 
                                        ''}
                                </p>
                                ${item.certificationId ? `<p>Credential ID: ${item.certificationId}</p>` : ''}
                            </div>
                        `;
                        break;
                        
                    default:
                        accomplishmentHtml = `
                            <div class="accomplishment-item">
                                <h3>${item.accomplishmentType || 'Accomplishment'}</h3>
                            </div>
                        `;
                }
                
                return accomplishmentHtml;
            }).join('') : 
            '<p class="empty-text">No accomplishments added yet</p>'
        }
    `;
}

function generateCareerHtml(career) {
    const items = career.items || [];
    
    return `
        <h2 class="section-title">Career Profile</h2>
        ${items.length > 0 ? 
            items.map(item => `
                <div class="career-item">
                    <h3>${item.jobTitle || 'Job Title'}</h3>
                    <h4>${item.companyName || 'Company'} ${item.location ? `- ${item.location}` : ''}</h4>
                    <p class="date-range">
                        ${item.startMonth ? `${getMonthName(item.startMonth)} ` : ''}${item.startYear || 'Start Year'} - 
                        ${item.currentJob ? 'Present' : `${item.endMonth ? `${getMonthName(item.endMonth)} ` : ''}${item.endYear || 'End Year'}`}
                        ${item.employmentType ? ` | ${item.employmentType}` : ''}
                    </p>
                    ${item.jobDescription ? `<p class="description">${item.jobDescription}</p>` : ''}
                </div>
            `).join('') : 
            '<p class="empty-text">No career profile added yet</p>'
        }
    `;
}

function generatePersonalHtml(personal) {
    return `
        <h2 class="section-title">Personal Details</h2>
        <div class="personal-details">
            ${personal.dateOfBirth ? `<p><strong>Date of Birth:</strong> ${personal.dateOfBirth}</p>` : ''}
            ${personal.gender ? `<p><strong>Gender:</strong> ${personal.gender}</p>` : ''}
            ${personal.nationality ? `<p><strong>Nationality:</strong> ${personal.nationality}</p>` : ''}
            ${personal.maritalStatus ? `<p><strong>Marital Status:</strong> ${personal.maritalStatus}</p>` : ''}
            ${personal.languages ? `<p><strong>Languages:</strong> ${personal.languages}</p>` : ''}
            ${personal.hobbies ? `<p><strong>Hobbies & Interests:</strong> ${personal.hobbies}</p>` : ''}
            ${personal.additionalInfo ? `<p><strong>Additional Information:</strong> ${personal.additionalInfo}</p>` : ''}
        </div>
    `;
}

// Helper function to get month name from number
function getMonthName(monthNum) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    if (monthNum === 'present') return 'Present';
    
    const num = parseInt(monthNum, 10);
    if (isNaN(num) || num < 1 || num > 12) return '';
    
    return months[num - 1];
}

// Apply styles to the preview iframe
function applyStylesToPreview(iframe) {
    if (!iframe.contentDocument) {
        console.error('Cannot access iframe document');
        return;
    }
    
    const style = iframe.contentDocument.createElement('style');
    style.textContent = `
        /* Reset and base styles */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Arial', sans-serif;
        }
        
        body {
            background-color: #f5f5f5;
            padding: 20px;
        }
        
        .resume-container {
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            padding: 40px;
            border-radius: 5px;
        }
        
        /* Header styles */
        .resume-header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #6a11cb;
        }
        
        .resume-name {
            font-size: 28px;
            color: #6a11cb;
            margin-bottom: 5px;
        }
        
        .resume-title {
            font-size: 18px;
            color: #333;
            margin-bottom: 15px;
        }
        
        .resume-contact {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 15px;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 5px;
            font-size: 14px;
        }
        
        /* Section styles */
        .resume-section {
            margin-bottom: 25px;
            padding-bottom: 15px;
            transition: background-color 0.3s ease;
        }
        
        .resume-section.highlighted {
            background-color: rgba(106, 17, 203, 0.05);
            padding: 10px;
            border-radius: 5px;
        }
        
        .section-title {
            font-size: 20px;
            color: #6a11cb;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
        }
        
        /* Skills styles */
        .skills-container {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
        }
        
        .skill-tag {
            background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            font-size: 14px;
        }
        
        /* Education styles */
        .education-item, .work-item, .project-item, .it-skill-item, .accomplishment-item, .career-item {
            margin-bottom: 20px;
        }
        
        .education-item h3, .work-item h3, .project-item h3, .it-skill-item h3, .accomplishment-item h3, .career-item h3 {
            font-size: 18px;
            color: #333;
            margin-bottom: 5px;
        }
        
        .education-item h4, .work-item h4, .project-item h4 {
            font-size: 16px;
            color: #555;
            font-weight: normal;
            margin-bottom: 5px;
        }
        
        .date-range {
            font-size: 14px;
            color: #777;
            margin-bottom: 8px;
        }
        
        .description {
            font-size: 14px;
            color: #444;
            line-height: 1.5;
        }
        
        /* IT Skills styles */
        .skill-details {
            display: flex;
            gap: 15px;
            font-size: 14px;
            color: #555;
        }
        
        .proficiency {
            color: #6a11cb;
            font-weight: bold;
        }
        
        /* Project styles */
        .project-skills {
            font-size: 14px;
            color: #555;
            margin-top: 5px;
        }
        
        .project-url {
            font-size: 14px;
            margin-top: 5px;
        }
        
        .project-url a {
            color: #2575fc;
            text-decoration: none;
        }
        
        /* Personal details styles */
        .personal-details p {
            font-size: 14px;
            color: #444;
            margin-bottom: 8px;
        }
        
        /* Empty state */
        .empty-text {
            font-style: italic;
            color: #999;
        }
    `;
    
    iframe.contentDocument.head.appendChild(style);
}

// Show notification
function showNotification(message, type = 'info') {
    // Create notification element if it doesn't exist
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        document.body.appendChild(notification);
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            #notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                border-radius: 5px;
                color: white;
                font-size: 14px;
                z-index: 1000;
                opacity: 0;
                transform: translateY(-20px);
                transition: opacity 0.3s, transform 0.3s;
                max-width: 300px;
            }
            
            #notification.show {
                opacity: 1;
                transform: translateY(0);
            }
            
            #notification.info {
                background-color: #2575fc;
            }
            
            #notification.success {
                background-color: #28a745;
            }
            
            #notification.error {
                background-color: #dc3545;
            }
            
            #notification.warning {
                background-color: #ffc107;
                color: #333;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Set notification content and type
    notification.textContent = message;
    notification.className = type;
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide notification after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initLivePreviewSync();
});
