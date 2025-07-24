// Section Forms Configuration
// This file contains all the form configurations for each resume section

// Helper function to create form fields based on configuration
function createFormFields(sectionId, formConfig) {
    const formContainer = document.createElement('div');
    formContainer.className = 'section-editor-form';
    
    formConfig.forEach(field => {
        if (field.type === 'row') {
            const row = document.createElement('div');
            row.className = 'form-row';
            
            field.fields.forEach(rowField => {
                const fieldGroup = createFieldGroup(rowField);
                row.appendChild(fieldGroup);
            });
            
            formContainer.appendChild(row);
        } else {
            const fieldGroup = createFieldGroup(field);
            formContainer.appendChild(fieldGroup);
        }
    });
    
    return formContainer;
}

// Helper function to create a single form field group
function createFieldGroup(field) {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = `form-group ${field.fullWidth ? 'full-width' : ''}`;
    
    // Create label
    const label = document.createElement('label');
    label.setAttribute('for', field.id);
    label.textContent = field.label;
    if (field.required) {
        const required = document.createElement('span');
        required.className = 'required';
        required.textContent = '*';
        label.appendChild(required);
    }
    fieldGroup.appendChild(label);
    
    // Create input based on type
    let input;
    
    switch (field.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'url':
        case 'date':
        case 'number':
            input = document.createElement('input');
            input.type = field.type;
            input.id = field.id;
            input.name = field.name || field.id;
            if (field.placeholder) input.placeholder = field.placeholder;
            if (field.value) input.value = field.value;
            if (field.maxLength) input.maxLength = field.maxLength;
            break;
            
        case 'textarea':
            input = document.createElement('textarea');
            input.id = field.id;
            input.name = field.name || field.id;
            if (field.placeholder) input.placeholder = field.placeholder;
            if (field.value) input.value = field.value;
            if (field.maxLength) {
                input.maxLength = field.maxLength;
                
                // Add character counter
                const counter = document.createElement('div');
                counter.className = 'character-counter';
                counter.innerHTML = `<span class="current">0</span>/<span class="max">${field.maxLength}</span>`;
                
                input.addEventListener('input', function() {
                    const current = this.value.length;
                    counter.querySelector('.current').textContent = current;
                    
                    if (current >= field.maxLength) {
                        counter.classList.add('limit-reached');
                    } else {
                        counter.classList.remove('limit-reached');
                    }
                });
                
                fieldGroup.appendChild(counter);
            }
            break;
            
        case 'select':
            input = document.createElement('select');
            input.id = field.id;
            input.name = field.name || field.id;
            
            if (field.options) {
                field.options.forEach(option => {
                    const optionEl = document.createElement('option');
                    optionEl.value = option.value;
                    optionEl.textContent = option.label;
                    if (option.value === field.value) optionEl.selected = true;
                    input.appendChild(optionEl);
                });
            }
            break;
            
        case 'tags':
            input = document.createElement('div');
            input.className = 'tags-input';
            input.id = field.id;
            
            const tagsContainer = document.createElement('div');
            tagsContainer.className = 'tags-container';
            
            const tagInput = document.createElement('input');
            tagInput.type = 'text';
            tagInput.placeholder = field.placeholder || 'Add a tag...';
            
            // Add tag functionality
            tagInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    const tagValue = this.value.trim();
                    if (tagValue) {
                        addTag(tagsContainer, tagValue);
                        this.value = '';
                    }
                }
            });
            
            input.appendChild(tagsContainer);
            input.appendChild(tagInput);
            
            // Add initial tags if provided
            if (field.value && Array.isArray(field.value)) {
                field.value.forEach(tag => {
                    addTag(tagsContainer, tag);
                });
            }
            break;
            
        case 'checkbox':
            input = document.createElement('div');
            input.className = 'checkbox-group';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = field.id;
            checkbox.name = field.name || field.id;
            if (field.value) checkbox.checked = field.value;
            
            const checkboxLabel = document.createElement('label');
            checkboxLabel.setAttribute('for', field.id);
            checkboxLabel.textContent = field.checkboxLabel || field.label;
            
            input.appendChild(checkbox);
            input.appendChild(checkboxLabel);
            break;
            
        case 'radio':
            input = document.createElement('div');
            input.className = 'radio-group';
            
            if (field.options) {
                field.options.forEach((option, index) => {
                    const radioId = `${field.id}_${index}`;
                    
                    const radioInput = document.createElement('input');
                    radioInput.type = 'radio';
                    radioInput.id = radioId;
                    radioInput.name = field.name || field.id;
                    radioInput.value = option.value;
                    if (option.value === field.value) radioInput.checked = true;
                    
                    const radioLabel = document.createElement('label');
                    radioLabel.setAttribute('for', radioId);
                    radioLabel.textContent = option.label;
                    
                    const radioContainer = document.createElement('div');
                    radioContainer.className = 'radio-option';
                    radioContainer.appendChild(radioInput);
                    radioContainer.appendChild(radioLabel);
                    
                    input.appendChild(radioContainer);
                });
            }
            break;
            
        case 'slider':
            input = document.createElement('div');
            input.className = 'slider-container';
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.id = field.id;
            slider.name = field.name || field.id;
            slider.min = field.min || 0;
            slider.max = field.max || 100;
            slider.value = field.value || 0;
            
            const sliderValue = document.createElement('span');
            sliderValue.className = 'slider-value';
            sliderValue.textContent = slider.value;
            
            slider.addEventListener('input', function() {
                sliderValue.textContent = this.value;
            });
            
            input.appendChild(slider);
            input.appendChild(sliderValue);
            break;
    }
    
    if (input) {
        fieldGroup.appendChild(input);
    }
    
    // Add help text if provided
    if (field.helpText) {
        const helpText = document.createElement('div');
        helpText.className = 'help-text';
        helpText.textContent = field.helpText;
        fieldGroup.appendChild(helpText);
    }
    
    return fieldGroup;
}

// Helper function to add a tag
function addTag(container, text) {
    const tag = document.createElement('div');
    tag.className = 'tag';
    tag.textContent = text;
    
    const removeBtn = document.createElement('span');
    removeBtn.className = 'remove-tag';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', function() {
        container.removeChild(tag);
    });
    
    tag.appendChild(removeBtn);
    container.appendChild(tag);
}

// Form configurations for each section
const sectionForms = {
    // Resume Headline Section
    summary: {
        title: 'Resume Headline',
        description: 'It is the first thing recruiters notice in your profile. Write a concise headline introducing yourself to employers.',
        fields: [
            {
                type: 'textarea',
                id: 'resumeHeadline',
                label: 'Resume Headline',
                placeholder: 'e.g., Experienced Software Engineer with 5+ years in web development and cloud technologies',
                maxLength: 250,
                required: true,
                fullWidth: true
            }
        ]
    },
    
    // Key Skills Section
    skills: {
        title: 'Key Skills',
        description: 'Add skills that highlight your strengths and are relevant to the job you\'re seeking.',
        fields: [
            {
                type: 'tags',
                id: 'keySkills',
                label: 'Skills',
                placeholder: 'Type a skill and press Enter (e.g., Project Management)',
                required: true,
                fullWidth: true,
                helpText: 'Add up to 15 key skills that are relevant to your target job'
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'skillLevel',
                        label: 'Proficiency Level',
                        options: [
                            { value: 'beginner', label: 'Beginner' },
                            { value: 'intermediate', label: 'Intermediate' },
                            { value: 'advanced', label: 'Advanced' },
                            { value: 'expert', label: 'Expert' }
                        ]
                    },
                    {
                        type: 'number',
                        id: 'yearsExperience',
                        label: 'Years of Experience',
                        min: 0,
                        max: 50
                    }
                ]
            }
        ]
    },
    
    // Education Section
    education: {
        title: 'Education',
        description: 'Add your educational qualifications, starting with the most recent one.',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'degree',
                        label: 'Degree/Certificate',
                        placeholder: 'e.g., Bachelor of Science',
                        required: true
                    },
                    {
                        type: 'text',
                        id: 'fieldOfStudy',
                        label: 'Field of Study',
                        placeholder: 'e.g., Computer Science'
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'institution',
                        label: 'Institution Name',
                        placeholder: 'e.g., University of California',
                        required: true
                    },
                    {
                        type: 'text',
                        id: 'location',
                        label: 'Location',
                        placeholder: 'e.g., Berkeley, CA'
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'startYear',
                        label: 'Start Year',
                        options: generateYearOptions(),
                        required: true
                    },
                    {
                        type: 'select',
                        id: 'endYear',
                        label: 'End Year (or Expected)',
                        options: generateYearOptions(true),
                        required: true
                    }
                ]
            },
            {
                type: 'textarea',
                id: 'description',
                label: 'Description (Optional)',
                placeholder: 'Add any achievements, activities, or relevant information about your education',
                maxLength: 500,
                fullWidth: true
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'grade',
                        label: 'Grade/GPA',
                        placeholder: 'e.g., 3.8/4.0'
                    },
                    {
                        type: 'checkbox',
                        id: 'currentlyStudying',
                        label: 'Currently Studying',
                        checkboxLabel: 'I am currently studying here'
                    }
                ]
            }
        ]
    },
    
    // IT Skills Section
    itskills: {
        title: 'IT Skills',
        description: 'Add technical skills, programming languages, software, or tools you\'re proficient in.',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'skillName',
                        label: 'Skill Name',
                        placeholder: 'e.g., JavaScript, Python, Adobe Photoshop',
                        required: true
                    },
                    {
                        type: 'select',
                        id: 'skillVersion',
                        label: 'Version (Optional)',
                        placeholder: 'e.g., ES6, 3.9, CC 2023'
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'proficiencyLevel',
                        label: 'Proficiency Level',
                        options: [
                            { value: 'beginner', label: 'Beginner' },
                            { value: 'intermediate', label: 'Intermediate' },
                            { value: 'advanced', label: 'Advanced' },
                            { value: 'expert', label: 'Expert' }
                        ],
                        required: true
                    },
                    {
                        type: 'number',
                        id: 'yearsExperience',
                        label: 'Years of Experience',
                        min: 0,
                        max: 50,
                        required: true
                    }
                ]
            },
            {
                type: 'textarea',
                id: 'lastUsed',
                label: 'Last Used',
                placeholder: 'When did you last use this skill? e.g., Currently using, 6 months ago',
                fullWidth: true
            }
        ]
    },
    
    // Projects Section
    projects: {
        title: 'Projects',
        description: 'Add details about projects you\'ve worked on, including your role and contributions.',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'projectTitle',
                        label: 'Project Title',
                        placeholder: 'e.g., E-commerce Website Redesign',
                        required: true
                    },
                    {
                        type: 'text',
                        id: 'clientName',
                        label: 'Client/Organization',
                        placeholder: 'e.g., ABC Company, Personal Project'
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'startMonth',
                        label: 'Start Date',
                        options: generateMonthOptions(),
                        required: true
                    },
                    {
                        type: 'select',
                        id: 'startYear',
                        options: generateYearOptions(),
                        required: true
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'endMonth',
                        label: 'End Date',
                        options: generateMonthOptions(true),
                        required: true
                    },
                    {
                        type: 'select',
                        id: 'endYear',
                        options: generateYearOptions(true),
                        required: true
                    }
                ]
            },
            {
                type: 'checkbox',
                id: 'currentProject',
                label: 'Current Project',
                checkboxLabel: 'I am currently working on this project'
            },
            {
                type: 'textarea',
                id: 'projectDescription',
                label: 'Project Description',
                placeholder: 'Describe the project, your role, and key achievements',
                maxLength: 1000,
                required: true,
                fullWidth: true
            },
            {
                type: 'tags',
                id: 'projectSkills',
                label: 'Skills Used',
                placeholder: 'Add skills used in this project',
                fullWidth: true
            },
            {
                type: 'url',
                id: 'projectUrl',
                label: 'Project URL (Optional)',
                placeholder: 'e.g., https://project-demo.com',
                fullWidth: true
            }
        ]
    },
    
    // Profile Summary Section
    profileSummary: {
        title: 'Profile Summary',
        description: 'Write a brief summary highlighting your experience, skills, and career goals.',
        fields: [
            {
                type: 'textarea',
                id: 'profileSummary',
                label: 'Profile Summary',
                placeholder: 'Write a concise summary of your professional background, key skills, and career objectives',
                maxLength: 2000,
                required: true,
                fullWidth: true,
                helpText: 'A good summary highlights your most relevant skills and experience in 3-5 sentences'
            }
        ]
    },
    
    // Accomplishments Section
    accomplishments: {
        title: 'Accomplishments',
        description: 'Showcase your credentials by adding relevant certifications, work samples, online profiles, etc.',
        fields: [
            {
                type: 'select',
                id: 'accomplishmentType',
                label: 'Accomplishment Type',
                options: [
                    { value: 'online_profile', label: 'Online Profile' },
                    { value: 'work_sample', label: 'Work Sample' },
                    { value: 'publication', label: 'Research Publication / Journal Entry' },
                    { value: 'presentation', label: 'Presentation' },
                    { value: 'patent', label: 'Patent' },
                    { value: 'certification', label: 'Certification' }
                ],
                required: true,
                fullWidth: true
            },
            
            // Online Profile Fields
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'profileName',
                        label: 'Profile Name',
                        placeholder: 'e.g., LinkedIn, GitHub, Behance',
                        required: true
                    },
                    {
                        type: 'url',
                        id: 'profileUrl',
                        label: 'Profile URL',
                        placeholder: 'e.g., https://linkedin.com/in/yourname',
                        required: true
                    }
                ]
            },
            
            // Work Sample Fields
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'sampleTitle',
                        label: 'Work Sample Title',
                        placeholder: 'e.g., Portfolio Website, GitHub Repository',
                        required: true
                    },
                    {
                        type: 'url',
                        id: 'sampleUrl',
                        label: 'Sample URL',
                        placeholder: 'e.g., https://github.com/username/project',
                        required: true
                    }
                ]
            },
            
            // Publication Fields
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'publicationTitle',
                        label: 'Publication Title',
                        placeholder: 'e.g., "Machine Learning Applications in Healthcare"',
                        required: true
                    },
                    {
                        type: 'text',
                        id: 'publisher',
                        label: 'Publisher/Journal',
                        placeholder: 'e.g., IEEE Journal of Biomedical and Health Informatics'
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'publicationMonth',
                        label: 'Publication Date',
                        options: generateMonthOptions(),
                        required: true
                    },
                    {
                        type: 'select',
                        id: 'publicationYear',
                        options: generateYearOptions(),
                        required: true
                    }
                ]
            },
            {
                type: 'url',
                id: 'publicationUrl',
                label: 'Publication URL',
                placeholder: 'e.g., https://journal.org/your-publication',
                fullWidth: true
            },
            
            // Presentation Fields
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'presentationTitle',
                        label: 'Presentation Title',
                        placeholder: 'e.g., "Future of AI in Business"',
                        required: true
                    },
                    {
                        type: 'text',
                        id: 'presentationVenue',
                        label: 'Venue/Event',
                        placeholder: 'e.g., TechConf 2023, Company Workshop'
                    }
                ]
            },
            {
                type: 'url',
                id: 'presentationUrl',
                label: 'Presentation URL',
                placeholder: 'e.g., https://slideshare.net/your-presentation',
                fullWidth: true
            },
            
            // Patent Fields
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'patentTitle',
                        label: 'Patent Title',
                        placeholder: 'e.g., "Method for Secure Data Transmission"',
                        required: true
                    },
                    {
                        type: 'text',
                        id: 'patentOffice',
                        label: 'Patent Office',
                        placeholder: 'e.g., USPTO, EPO'
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'patentNumber',
                        label: 'Patent Number',
                        placeholder: 'e.g., US 9,123,456'
                    },
                    {
                        type: 'select',
                        id: 'patentStatus',
                        label: 'Status',
                        options: [
                            { value: 'filed', label: 'Filed' },
                            { value: 'published', label: 'Published' },
                            { value: 'granted', label: 'Granted' },
                            { value: 'pending', label: 'Pending' }
                        ]
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'patentMonth',
                        label: 'Filing/Grant Date',
                        options: generateMonthOptions(),
                        required: true
                    },
                    {
                        type: 'select',
                        id: 'patentYear',
                        options: generateYearOptions(),
                        required: true
                    }
                ]
            },
            
            // Certification Fields
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'certificationName',
                        label: 'Certification Name',
                        placeholder: 'e.g., AWS Certified Solutions Architect',
                        required: true
                    },
                    {
                        type: 'text',
                        id: 'certificationAuthority',
                        label: 'Issuing Organization',
                        placeholder: 'e.g., Amazon Web Services'
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'certificationMonth',
                        label: 'Issue Date',
                        options: generateMonthOptions(),
                        required: true
                    },
                    {
                        type: 'select',
                        id: 'certificationYear',
                        options: generateYearOptions(),
                        required: true
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'expirationMonth',
                        label: 'Expiration Date (if applicable)',
                        options: generateMonthOptions(true),
                    },
                    {
                        type: 'select',
                        id: 'expirationYear',
                        options: generateYearOptions(true),
                    }
                ]
            },
            {
                type: 'text',
                id: 'certificationId',
                label: 'Certification ID/Credential URL',
                placeholder: 'e.g., ABC123XYZ or https://credential.net/abc123xyz',
                fullWidth: true
            }
        ]
    },
    
    // Career Profile Section
    career: {
        title: 'Career Profile',
        description: 'Add details about your work experience, including company names, roles, and responsibilities.',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'jobTitle',
                        label: 'Job Title',
                        placeholder: 'e.g., Senior Software Engineer',
                        required: true
                    },
                    {
                        type: 'text',
                        id: 'companyName',
                        label: 'Company Name',
                        placeholder: 'e.g., Google Inc.',
                        required: true
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'location',
                        label: 'Location',
                        placeholder: 'e.g., Mountain View, CA'
                    },
                    {
                        type: 'text',
                        id: 'employmentType',
                        label: 'Employment Type',
                        placeholder: 'e.g., Full-time, Contract, Internship'
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'startMonth',
                        label: 'Start Date',
                        options: generateMonthOptions(),
                        required: true
                    },
                    {
                        type: 'select',
                        id: 'startYear',
                        options: generateYearOptions(),
                        required: true
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'select',
                        id: 'endMonth',
                        label: 'End Date',
                        options: generateMonthOptions(true),
                        required: true
                    },
                    {
                        type: 'select',
                        id: 'endYear',
                        options: generateYearOptions(true),
                        required: true
                    }
                ]
            },
            {
                type: 'checkbox',
                id: 'currentJob',
                label: 'Current Job',
                checkboxLabel: 'I currently work here'
            },
            {
                type: 'textarea',
                id: 'jobDescription',
                label: 'Job Description',
                placeholder: 'Describe your responsibilities, achievements, and the skills you used or developed',
                maxLength: 2000,
                required: true,
                fullWidth: true
            }
        ]
    },
    
    // Personal Details Section
    personal: {
        title: 'Personal Details',
        description: 'Add personal information like date of birth, languages known, etc.',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        type: 'date',
                        id: 'dateOfBirth',
                        label: 'Date of Birth',
                        placeholder: 'MM/DD/YYYY'
                    },
                    {
                        type: 'select',
                        id: 'gender',
                        label: 'Gender',
                        options: [
                            { value: '', label: 'Select Gender' },
                            { value: 'male', label: 'Male' },
                            { value: 'female', label: 'Female' },
                            { value: 'non-binary', label: 'Non-binary' },
                            { value: 'prefer-not-to-say', label: 'Prefer not to say' }
                        ]
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'nationality',
                        label: 'Nationality',
                        placeholder: 'e.g., American, Indian, etc.'
                    },
                    {
                        type: 'text',
                        id: 'maritalStatus',
                        label: 'Marital Status',
                        placeholder: 'e.g., Single, Married'
                    }
                ]
            },
            {
                type: 'text',
                id: 'languages',
                label: 'Languages Known',
                placeholder: 'e.g., English (Native), Spanish (Intermediate), French (Basic)',
                fullWidth: true
            },
            {
                type: 'textarea',
                id: 'hobbies',
                label: 'Hobbies & Interests (Optional)',
                placeholder: 'e.g., Photography, Hiking, Reading',
                fullWidth: true
            },
            {
                type: 'textarea',
                id: 'additionalInfo',
                label: 'Additional Information (Optional)',
                placeholder: 'Any other details you would like to include',
                fullWidth: true
            }
        ]
    },
    
    // Personal Information (Basics) Section
    basics: {
        title: 'Personal Information',
        description: 'Add your contact details and basic information',
        fields: [
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'fullName',
                        label: 'Full Name',
                        placeholder: 'e.g., John Doe',
                        required: true
                    },
                    {
                        type: 'text',
                        id: 'jobTitle',
                        label: 'Job Title',
                        placeholder: 'e.g., Software Engineer',
                        required: true
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'email',
                        id: 'email',
                        label: 'Email',
                        placeholder: 'e.g., john.doe@example.com',
                        required: true
                    },
                    {
                        type: 'tel',
                        id: 'phone',
                        label: 'Phone',
                        placeholder: 'e.g., (555) 555-5555',
                        required: true
                    }
                ]
            },
            {
                type: 'row',
                fields: [
                    {
                        type: 'text',
                        id: 'city',
                        label: 'City',
                        placeholder: 'e.g., San Francisco'
                    },
                    {
                        type: 'text',
                        id: 'region',
                        label: 'State/Region',
                        placeholder: 'e.g., CA'
                    }
                ]
            },
            {
                type: 'url',
                id: 'website',
                label: 'Website/Portfolio (Optional)',
                placeholder: 'e.g., https://johndoe.com',
                fullWidth: true
            },
            {
                type: 'url',
                id: 'linkedin',
                label: 'LinkedIn (Optional)',
                placeholder: 'e.g., https://linkedin.com/in/johndoe',
                fullWidth: true
            }
        ]
    }
};

// Helper function to generate year options
function generateYearOptions(includeCurrent) {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 70;
    const endYear = currentYear + 10;
    
    const options = [];
    
    if (includeCurrent) {
        options.push({ value: 'present', label: 'Present' });
    }
    
    for (let year = endYear; year >= startYear; year--) {
        options.push({ value: year.toString(), label: year.toString() });
    }
    
    return options;
}

// Helper function to generate month options
function generateMonthOptions(includePresent) {
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    const options = [];
    
    if (includePresent) {
        options.push({ value: 'present', label: 'Present' });
    }
    
    months.forEach((month, index) => {
        options.push({ value: (index + 1).toString().padStart(2, '0'), label: month });
    });
    
    return options;
}

// Function to load the appropriate form for a section
function loadSectionForm(sectionId) {
    const sectionConfig = sectionForms[sectionId];
    if (!sectionConfig) {
        console.error(`No form configuration found for section: ${sectionId}`);
        return null;
    }
    
    const sectionEditor = document.getElementById('section-editor');
    if (!sectionEditor) {
        console.error('Section editor element not found');
        return null;
    }
    
    // Create section header
    const header = document.createElement('div');
    header.className = 'section-editor-header';
    header.innerHTML = `
        <h2>${sectionConfig.title}</h2>
        <p>${sectionConfig.description}</p>
    `;
    
    // Create form
    const form = createFormFields(sectionId, sectionConfig.fields);
    
    // Create action buttons
    const actions = document.createElement('div');
    actions.className = 'section-editor-actions';
    actions.innerHTML = `
        <button class="secondary-btn" id="cancel-edit-btn">Cancel</button>
        <button class="primary-btn" id="save-section-btn">Save Changes</button>
    `;
    
    // Clear existing content and append new elements
    sectionEditor.innerHTML = '';
    sectionEditor.appendChild(header);
    sectionEditor.appendChild(form);
    sectionEditor.appendChild(actions);
    
    // Add event listeners
    document.getElementById('cancel-edit-btn').addEventListener('click', function() {
        // Handle cancel action
    });
    
    document.getElementById('save-section-btn').addEventListener('click', function() {
        // Handle save action
    });
    
    return sectionEditor;
}

// Export the functions and configurations
window.sectionForms = sectionForms;
window.loadSectionForm = loadSectionForm;
