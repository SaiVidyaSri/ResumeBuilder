// Public Resume Script
document.addEventListener('DOMContentLoaded', function() {
    loadPublicResume();
});

async function loadPublicResume() {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    
    if (!userId) {
        showError('No user ID provided in the link');
        return;
    }
    
    try {
        // Fetch the resume data from the server
        const response = await fetch(`/api/public-resume/${userId}`);
        
        if (!response.ok) {
            throw new Error('Resume not found or not available for public viewing');
        }
        
        const data = await response.json();
        
        if (data.success) {
            displayResume(data.resume);
            updatePageTitle(data.resume);
        } else {
            throw new Error(data.message || 'Failed to load resume');
        }
        
    } catch (error) {
        console.error('Error loading public resume:', error);
        showError(error.message);
    }
}

function displayResume(resumeData) {
    const resumeContent = document.getElementById('resumeContent');
    
    // Clear loading state
    resumeContent.innerHTML = '';
    
    // Generate HTML for the resume based on the data
    const resumeHTML = generateResumeHTML(resumeData);
    resumeContent.innerHTML = resumeHTML;
    
    // Add smooth fade-in animation
    resumeContent.style.opacity = '0';
    setTimeout(() => {
        resumeContent.style.transition = 'opacity 0.5s ease';
        resumeContent.style.opacity = '1';
    }, 100);
}

function generateResumeHTML(resumeData) {
    // Extract data with proper field mapping
    const personalInfo = resumeData.personalDetails || {};
    const contactInfo = resumeData.contactInfo || {};
    const professionalInfo = resumeData.professionalInfo || {};
    
    // Basic resume structure - this should match your template structure
    return `
        <div class="resume-header">
            <h1 class="full-name">${personalInfo.firstName || ''} ${personalInfo.lastName || ''}</h1>
            ${resumeData.resumeHeadline ? `<p class="resume-headline">${resumeData.resumeHeadline}</p>` : ''}
            <div class="contact-info">
                ${contactInfo.email ? `<span><i class="fas fa-envelope"></i> ${contactInfo.email}</span>` : ''}
                ${contactInfo.phone || contactInfo.mobile ? `<span><i class="fas fa-phone"></i> ${contactInfo.phone || contactInfo.mobile}</span>` : ''}
                ${contactInfo.location || contactInfo.address ? `<span><i class="fas fa-map-marker-alt"></i> ${contactInfo.location || contactInfo.address}</span>` : ''}
                ${contactInfo.linkedin ? `<span><i class="fab fa-linkedin"></i> <a href="${contactInfo.linkedin}" target="_blank">LinkedIn</a></span>` : ''}
            </div>
        </div>
        
        ${professionalInfo.summary || resumeData.summary ? `
        <div class="resume-section">
            <h2>Professional Summary</h2>
            <p>${professionalInfo.summary || resumeData.summary}</p>
        </div>
        ` : ''}
        
        ${resumeData.experience && resumeData.experience.length > 0 ? `
        <div class="resume-section">
            <h2>Work Experience</h2>
            ${resumeData.experience.map(exp => `
                <div class="experience-item">
                    <h3>${exp.jobTitle || exp.title || ''}</h3>
                    <h4>${exp.company || exp.companyName || ''}</h4>
                    <p class="duration">${exp.startDate || ''} - ${exp.endDate || 'Present'}</p>
                    ${exp.description || exp.responsibilities ? `<p>${exp.description || exp.responsibilities}</p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${resumeData.education && resumeData.education.length > 0 ? `
        <div class="resume-section">
            <h2>Education</h2>
            ${resumeData.education.map(edu => `
                <div class="education-item">
                    <h3>${edu.degree || edu.qualification || ''}</h3>
                    <h4>${edu.institution || edu.institute || ''}</h4>
                    <p class="duration">${edu.startDate || ''} - ${edu.endDate || ''}</p>
                    ${edu.gpa || edu.grade ? `<p class="grade">Grade: ${edu.gpa || edu.grade}</p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${resumeData.skills && (resumeData.skills.technical || resumeData.skills.all) ? `
        <div class="resume-section">
            <h2>Skills</h2>
            <div class="skills-list">
                ${(resumeData.skills.technical || resumeData.skills.all || []).map(skill => {
                    const skillName = typeof skill === 'string' ? skill : (skill.name || skill.skill || skill);
                    return `<span class="skill-tag">${skillName}</span>`;
                }).join('')}
            </div>
        </div>
        ` : ''}
        
        ${resumeData.projects && resumeData.projects.length > 0 ? `
        <div class="resume-section">
            <h2>Projects</h2>
            ${resumeData.projects.map(project => `
                <div class="project-item">
                    <h3>${project.title || project.name || ''}</h3>
                    ${project.description ? `<p>${project.description}</p>` : ''}
                    ${project.technologies ? `<p class="technologies">Technologies: ${project.technologies}</p>` : ''}
                    ${project.url ? `<p class="project-link"><a href="${project.url}" target="_blank">View Project</a></p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
        
        ${resumeData.certifications && resumeData.certifications.length > 0 ? `
        <div class="resume-section">
            <h2>Certifications</h2>
            ${resumeData.certifications.map(cert => `
                <div class="certification-item">
                    <h3>${cert.name || cert.title || ''}</h3>
                    ${cert.issuer || cert.organization ? `<h4>${cert.issuer || cert.organization}</h4>` : ''}
                    ${cert.date || cert.issueDate ? `<p class="duration">${cert.date || cert.issueDate}</p>` : ''}
                </div>
            `).join('')}
        </div>
        ` : ''}
    `;
}

function updatePageTitle(resumeData) {
    const personalInfo = resumeData.personalDetails || {};
    const firstName = personalInfo.firstName || '';
    const lastName = personalInfo.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (fullName) {
        document.title = `${fullName}'s Resume - NextHire`;
    }
}

function showError(message) {
    const resumeContent = document.getElementById('resumeContent');
    resumeContent.innerHTML = `
        <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Resume Not Available</h3>
            <p>${message}</p>
            <a href="index.html" class="btn btn-primary">
                <i class="fas fa-home"></i>
                Go to NextHire
            </a>
        </div>
    `;
}

// Add CSS for resume content
const resumeStyles = `
<style>
.resume-header {
    text-align: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid #667eea;
}

.full-name {
    font-size: 2.5rem;
    margin: 0 0 10px 0;
    color: #2c3e50;
    font-weight: bold;
}

.contact-info {
    display: flex;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    color: #666;
}

.contact-info span {
    display: flex;
    align-items: center;
    gap: 5px;
}

.resume-section {
    margin-bottom: 30px;
}

.resume-section h2 {
    color: #667eea;
    font-size: 1.5rem;
    margin: 0 0 15px 0;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
}

.experience-item, .education-item, .project-item {
    margin-bottom: 20px;
    padding-left: 20px;
    border-left: 3px solid #667eea;
}

.experience-item h3, .education-item h3, .project-item h3 {
    margin: 0 0 5px 0;
    color: #2c3e50;
    font-size: 1.2rem;
}

.experience-item h4, .education-item h4 {
    margin: 0 0 5px 0;
    color: #666;
    font-weight: normal;
    font-style: italic;
}

.duration {
    color: #888;
    font-size: 0.9rem;
    margin: 0 0 10px 0;
}

.skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.skill-tag {
    background: #667eea;
    color: white;
    padding: 5px 12px;
    border-radius: 15px;
    font-size: 0.9rem;
}

.technologies {
    font-style: italic;
    color: #666;
}

@media (max-width: 768px) {
    .full-name {
        font-size: 2rem;
    }
    
    .contact-info {
        flex-direction: column;
        gap: 10px;
    }
    
    .experience-item, .education-item, .project-item {
        padding-left: 15px;
    }
}
</style>
`;

// Inject styles
document.head.insertAdjacentHTML('beforeend', resumeStyles);