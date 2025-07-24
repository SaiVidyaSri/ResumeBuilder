if (!window.html2pdf) {
    console.log("Loading html2pdf.js dynamically");
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    document.head.appendChild(script);
}
if (!window.docx) {
    console.log("Loading docx.js dynamically");
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/docx/7.1.0/docx.min.js";
    document.head.appendChild(script);
}
if (!window.saveAs && !!window.FileSaver) { 
    window.saveAs = window.FileSaver.saveAs;
} else if (!window.saveAs) {
    console.log("Loading FileSaver.js dynamically");
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
    document.head.appendChild(script);
}

let currentSection = "basics"; 

document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM fully loaded and parsed");

    initProfileDropdown();
    initMobileNavigation();
    initLogoutModal();
    updateBreadcrumbs();
    setActiveNavLink();

    let resumeData = loadResumeData();
    let templateOptions = loadTemplateOptions();

    updateSectionsList(resumeData); 
    loadSectionEditor(currentSection, resumeData); 
    updateLivePreview(resumeData, templateOptions);

    initSidebarListeners();
    initEditorActions();
    initModalListeners(); 
    initPreviewControls();

    console.log("Initialization complete");
});

function initProfileDropdown() {
    const profileIcon = document.getElementById("profileIcon");
    const profileDropdown = document.getElementById("profileDropdown");
    if (!profileIcon || !profileDropdown) return;

    profileIcon.setAttribute("tabindex", "0");
    const toggleDropdown = (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle("show");
    };
    profileIcon.addEventListener("click", toggleDropdown);
    profileIcon.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") toggleDropdown(e); });
    document.addEventListener("click", () => profileDropdown.classList.remove("show"));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") profileDropdown.classList.remove("show"); });
    profileDropdown.addEventListener("click", (e) => e.stopPropagation());
}

function loadResumeData() {
    const savedData = localStorage.getItem("resumeData");
    if (savedData) {
        try { return JSON.parse(savedData); } 
        catch (e) { console.error("Error parsing saved resume data:", e); }
    }
    return getDefaultResumeData(); 
}

function saveResumeData(data) {
    localStorage.setItem("resumeData", JSON.stringify(data));
}

function loadTemplateOptions() {
    const savedOptions = localStorage.getItem("templateCustomization");
    if (savedOptions) {
        try { return JSON.parse(savedOptions); } 
        catch (e) { console.error("Error parsing saved template options:", e); }
    }
    return { colorScheme: "default", fontFamily: "default", layoutStyle: "default" };
}

function saveTemplateOptions(options) {
    localStorage.setItem("templateCustomization", JSON.stringify(options));
}

function initSidebarListeners() {
    const sectionsListContainer = document.querySelector(".sections-list");
    if (!sectionsListContainer) return;

    sectionsListContainer.addEventListener("click", function(e) {
        const target = e.target;
        const sectionItem = target.closest(".section-item");
        const editBtn = target.closest(".edit-section-btn");
        const removeBtn = target.closest(".remove-section-btn");

        if (editBtn) {
            e.stopPropagation(); 
            const section = editBtn.dataset.section;
            loadSectionEditor(section, loadResumeData());
            setActiveSection(section);
        } else if (removeBtn) {
            e.stopPropagation(); 
            const section = removeBtn.dataset.section;
            openRemoveSectionModal(section);
        } else if (sectionItem) {
            const section = sectionItem.dataset.section;
            loadSectionEditor(section, loadResumeData());
            setActiveSection(section);
        }
    });

    const addSectionBtn = document.getElementById("add-section-btn");
    if (addSectionBtn) addSectionBtn.addEventListener("click", openAddSectionModal);
}

function setActiveSection(sectionKey) {
    document.querySelectorAll(".section-item").forEach(item => {
        item.classList.toggle("active", item.dataset.section === sectionKey);
    });
    currentSection = sectionKey;
}

function handleLiveUpdate() {
    const editorForm = document.querySelector("#section-editor .section-editor-form");
    if (!editorForm) return;

    const sectionConfig = getSectionConfig(currentSection);
    if (!sectionConfig) return;

    let sectionData = parseForm(editorForm, sectionConfig);
    let fullResumeData = loadResumeData();
    fullResumeData[currentSection] = sectionData;
    updateLivePreview(fullResumeData, loadTemplateOptions());
}

function loadSectionEditor(sectionKey, resumeData) {
    const editorContainer = document.getElementById("section-editor");
    if (!editorContainer) return;
    const sectionConfig = getSectionConfig(sectionKey);

    if (!sectionConfig) {
        editorContainer.innerHTML = `<p>Section configuration not found for "${sectionKey}".</p>`;
        return;
    }
    currentSection = sectionKey;

    editorContainer.innerHTML = `
        <div class="section-editor-header">
            <h2>${sectionConfig.title}</h2>
            <p>${sectionConfig.description}</p>
        </div>
        <div class="section-editor-form">
            ${generateFormHTML(sectionConfig.fields, resumeData[sectionKey] || sectionConfig.defaultData, sectionKey)}
        </div>
        <div class="section-editor-actions">
            <button class="secondary-btn" id="cancel-edit-btn">Cancel</button>
            <button class="primary-btn" id="save-section-btn">Save Changes</button>
        </div>
    `;

    document.getElementById("save-section-btn").addEventListener("click", () => saveCurrentSectionData());
    document.getElementById("cancel-edit-btn").addEventListener("click", () => loadSectionEditor(sectionKey, loadResumeData()));

    initListInputs(sectionKey, resumeData[sectionKey] || sectionConfig.defaultData);

    const editorForm = editorContainer.querySelector(".section-editor-form");
    if (editorForm) {
        editorForm.querySelectorAll("input, textarea, select").forEach(input => {
            const eventType = (input.tagName === "SELECT" || input.type === "checkbox" || input.type === "radio") ? "change" : "input";
            input.addEventListener(eventType, handleLiveUpdate);
        });
    }
}

function generateFormHTML(fields, data, sectionKey) {
    let html = "";
    fields.forEach(field => {
        const value = data && data[field.name] !== undefined ? data[field.name] : (field.defaultValue !== undefined ? field.defaultValue : "");
        const fieldId = `${sectionKey}-${field.name}`; 

        if (field.type === "list") {
            html += `
                <div class="form-group full-width list-input-group" data-field-name="${field.name}">
                    <label>${field.label}</label>
                    <div class="list-items-container">
                        ${(value || []).map((item, index) => generateListItemHTML(field.itemFields, item, index, field.name, sectionKey)).join("")}
                    </div>
                    <button type="button" class="add-list-item-btn secondary-btn"><i class="fas fa-plus"></i> Add ${field.itemLabel || "Item"}</button>
                </div>
            `;
        } else {
            html += `<div class="form-group ${field.fullWidth ? "full-width" : ""}">`;
            html += `<label for="${fieldId}">${field.label}</label>`;
            if (field.type === "textarea") {
                html += `<textarea id="${fieldId}" name="${field.name}" placeholder="${field.placeholder || ""}" ${field.maxLength ? `maxlength="${field.maxLength}"` : ""}>${value}</textarea>`;
                if (field.maxLength) {
                    html += `<div class="character-counter"><span>${field.maxLength - String(value).length}</span> characters remaining</div>`;
                }
            } else if (field.type === "select") {
                html += `<select id="${fieldId}" name="${field.name}">`;
                html += (field.options || []).map(opt => `<option value="${opt.value}" ${String(value) === String(opt.value) ? "selected" : ""}>${opt.label}</option>`).join("");
                html += `</select>`;
            } else if (field.type === "checkbox") {
                html += `<input type="checkbox" id="${fieldId}" name="${field.name}" ${value ? "checked" : ""}> <label for="${fieldId}" class="checkbox-label">${field.checkboxLabel || ""}</label>`;
            } else {
                html += `<input type="${field.type || "text"}" id="${fieldId}" name="${field.name}" value="${value}" placeholder="${field.placeholder || ""}">`;
            }
            html += `</div>`;
        }
    });
    
    const formGroups = html.match(/<div class="form-group.*?<\/div>(<div class="character-counter.*?<\/div>)?/gs) || [];
    let groupedHtml = "";
    let rowBuffer = [];
    formGroups.forEach(groupHtml => {
        if (groupHtml.includes("full-width")) {
            if (rowBuffer.length > 0) {
                groupedHtml += `<div class="form-row">${rowBuffer.join("")}</div>`;
                rowBuffer = [];
            }
            groupedHtml += `<div class="form-row">${groupHtml}</div>`;
        } else {
            rowBuffer.push(groupHtml);
            if (rowBuffer.length === 2) {
                groupedHtml += `<div class="form-row">${rowBuffer.join("")}</div>`;
                rowBuffer = [];
            }
        }
    });
    if (rowBuffer.length > 0) groupedHtml += `<div class="form-row">${rowBuffer.join("")}</div>`;
    return groupedHtml;
}

function generateListItemHTML(itemFields, itemData, index, parentFieldName, sectionKey) {
    let itemHtml = `<div class="list-item" data-index="${index}">`;
    itemHtml += `<div class="list-item-fields">`;
    itemFields.forEach(field => {
        const value = itemData && itemData[field.name] !== undefined ? itemData[field.name] : (field.defaultValue !== undefined ? field.defaultValue : "");
        const fieldId = `${sectionKey}-${parentFieldName}-${field.name}-${index}`;
        itemHtml += `<div class="form-group ${field.fullWidth ? "full-width" : ""}">`;
        itemHtml += `<label for="${fieldId}">${field.label}</label>`;
        if (field.type === "textarea") {
            itemHtml += `<textarea id="${fieldId}" name="${field.name}" placeholder="${field.placeholder || ""}">${value}</textarea>`;
        } else if (field.type === "select") {
            itemHtml += `<select id="${fieldId}" name="${field.name}">`;
            itemHtml += (field.options || []).map(opt => `<option value="${opt.value}" ${String(value) === String(opt.value) ? "selected" : ""}>${opt.label}</option>`).join("");
            itemHtml += `</select>`;
        } else if (field.type === "list") { // Nested list
            itemHtml += `<div class="nested-list-input" data-nested-field-name="${field.name}">
                            <div class="nested-list-items">
                                ${(value || []).map((nestedItem, nestedIndex) => 
                                    `<div class="nested-item-wrapper"><input type="text" value="${nestedItem}" placeholder="${field.placeholder || "Highlight"}" data-nested-index="${nestedIndex}" name="${field.name}_nested"><button type="button" class="remove-nested-item-btn">&times;</button></div>`
                                ).join("")}
                            </div>
                            <button type="button" class="add-nested-item-btn secondary-btn-small"><i class="fas fa-plus"></i> Add</button>
                         </div>`;
        } else if (field.type === "checkbox") {
             itemHtml += `<input type="checkbox" id="${fieldId}" name="${field.name}" ${value ? "checked" : ""}> <label for="${fieldId}" class="checkbox-label">${field.checkboxLabel || ""}</label>`;
        } else {
            itemHtml += `<input type="${field.type || "text"}" id="${fieldId}" name="${field.name}" value="${value}" placeholder="${field.placeholder || ""}">`;
        }
        itemHtml += `</div>`;
    });
    itemHtml += `</div>`;
    itemHtml += `<button type="button" class="remove-list-item-btn icon-btn danger"><i class="fas fa-trash"></i></button>`;
    itemHtml += `</div>`;
    return itemHtml;
}

function initListInputs(sectionKey, data) {
    const listGroups = document.querySelectorAll(".list-input-group");
    listGroups.forEach(group => {
        const fieldName = group.dataset.fieldName;
        const container = group.querySelector(".list-items-container");
        const addBtn = group.querySelector(".add-list-item-btn");
        const sectionConfig = getSectionConfig(sectionKey);
        const fieldConfig = sectionConfig.fields.find(f => f.name === fieldName);
        if (!fieldConfig || !addBtn || !container) return;

        addBtn.addEventListener("click", () => {
            const newItemIndex = container.children.length;
            const newItemHtml = generateListItemHTML(fieldConfig.itemFields, fieldConfig.defaultItemData || {}, newItemIndex, fieldName, sectionKey);
            container.insertAdjacentHTML("beforeend", newItemHtml);
            const newItemElement = container.lastElementChild;
            initListItemListeners(newItemElement, fieldConfig.itemFields, fieldName, sectionKey);
            attachInputListenersToElement(newItemElement);
            handleLiveUpdate();
        });
        
        Array.from(container.children).forEach(item => initListItemListeners(item, fieldConfig.itemFields, fieldName, sectionKey));
    });
}

function initListItemListeners(itemElement, itemFieldsConfig, parentFieldName, sectionKey) {
    const removeBtn = itemElement.querySelector(".remove-list-item-btn");
    if (removeBtn) {
        removeBtn.addEventListener("click", () => {
            itemElement.remove();
            handleLiveUpdate();
        });
    }
    
    const nestedLists = itemElement.querySelectorAll(".nested-list-input");
    nestedLists.forEach(nestedList => {
        const addNestedBtn = nestedList.querySelector(".add-nested-item-btn");
        const nestedItemsContainer = nestedList.querySelector(".nested-list-items");
        const nestedFieldName = nestedList.dataset.nestedFieldName;
        const parentItemFieldConfig = itemFieldsConfig.find(f => f.name === nestedFieldName);

        if (addNestedBtn && nestedItemsContainer) {
            addNestedBtn.addEventListener("click", () => {
                const nestedIndex = nestedItemsContainer.children.length;
                const wrapper = document.createElement("div");
                wrapper.className = "nested-item-wrapper";
                const input = document.createElement("input");
                input.type = "text";
                input.placeholder = parentItemFieldConfig.placeholder || "Highlight";
                input.dataset.nestedIndex = nestedIndex;
                input.name = `${nestedFieldName}_nested`;
                input.addEventListener("input", handleLiveUpdate);
                wrapper.appendChild(input);
                const removeNestedBtn = document.createElement("button");
                removeNestedBtn.type = "button";
                removeNestedBtn.className = "remove-nested-item-btn";
                removeNestedBtn.innerHTML = "&times;";
                removeNestedBtn.addEventListener("click", () => { wrapper.remove(); handleLiveUpdate(); });
                wrapper.appendChild(removeNestedBtn);
                nestedItemsContainer.appendChild(wrapper);
                handleLiveUpdate();
            });
        }
        nestedItemsContainer.querySelectorAll(".remove-nested-item-btn").forEach(btn => {
            btn.addEventListener("click", () => { btn.parentElement.remove(); handleLiveUpdate(); });
        });
        nestedItemsContainer.querySelectorAll("input").forEach(input => input.addEventListener("input", handleLiveUpdate));
    });
}

function attachInputListenersToElement(element) {
    element.querySelectorAll("input, textarea, select").forEach(input => {
        const eventType = (input.tagName === "SELECT" || input.type === "checkbox" || input.type === "radio") ? "change" : "input";
        input.addEventListener(eventType, handleLiveUpdate);
        if (input.type === "textarea" && input.maxLength > 0) {
            const counter = input.parentElement.querySelector(".character-counter span");
            if (counter) {
                input.addEventListener("input", () => {
                    counter.textContent = input.maxLength - input.value.length;
                });
            }
        }
    });
}

function parseForm(formElement, sectionConfig) {
    let sectionData = {};
    sectionConfig.fields.forEach(field => {
        if (field.type === "list") {
            const listGroup = formElement.querySelector(`.list-input-group[data-field-name="${field.name}"]`);
            const items = [];
            if (listGroup) {
                listGroup.querySelectorAll(".list-item").forEach(itemElement => {
                    let itemData = {};
                    field.itemFields.forEach(itemField => {
                        const inputElement = itemElement.querySelector(`[name="${itemField.name}"]`);
                        if (itemField.type === "list") { // Nested list
                            const nestedItems = [];
                            itemElement.querySelectorAll(`.nested-list-input[data-nested-field-name="${itemField.name}"] input[name="${itemField.name}_nested"]`).forEach(nestedInput => {
                                if (nestedInput.value.trim()) nestedItems.push(nestedInput.value.trim());
                            });
                            itemData[itemField.name] = nestedItems;
                        } else if (inputElement) {
                            itemData[itemField.name] = inputElement.type === "checkbox" ? inputElement.checked : inputElement.value;
                        }
                    });
                    items.push(itemData);
                });
            }
            sectionData[field.name] = items;
        } else {
            const inputElement = formElement.querySelector(`[name="${field.name}"]`);
            if (inputElement) {
                sectionData[field.name] = inputElement.type === "checkbox" ? inputElement.checked : inputElement.value;
            }
        }
    });
    return sectionData;
}

function saveCurrentSectionData() {
    const editorForm = document.querySelector("#section-editor .section-editor-form");
    if (!editorForm) return;
    const sectionConfig = getSectionConfig(currentSection);
    if (!sectionConfig) return;

    let sectionData = parseForm(editorForm, sectionConfig);
    let resumeData = loadResumeData();
    resumeData[currentSection] = sectionData;
    saveResumeData(resumeData);
    updateLivePreview(resumeData, loadTemplateOptions());
    updateSectionsList(resumeData); // Update sidebar if section content affects its display (e.g. completion status)
    showNotification(`${sectionConfig.title} section saved successfully!`);
}

function updateLivePreview(data, options) {
    const iframe = document.getElementById("preview-iframe");
    if (!iframe) return;
    const resumeHtml = generatePreviewHTML(data, options);
    
    const writeToIframe = () => {
        try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
            iframeDoc.open();
            iframeDoc.write(resumeHtml);
            iframeDoc.close();
            applyCustomizationOptionsToPreview(iframeDoc, options);
        } catch (error) { console.error("Error updating preview:", error); }
    };

    if (iframe.contentDocument && iframe.contentDocument.readyState === "complete") {
        writeToIframe();
    } else {
        iframe.onload = writeToIframe;
        if (iframe.src === "about:blank") writeToIframe(); // For initial load of about:blank
    }
}

function generatePreviewHTML(data, options) {
    let html = `<html><head><style>
        body { font-family: ${options.fontFamily || "Arial, sans-serif"}; margin: 20px; line-height: 1.6; color: #333; }
        .preview-section { margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
        .preview-section:last-child { border-bottom: none; }
        .preview-section h2 { font-size: 1.4em; color: ${options.colorScheme === "blue" ? "#0056b3" : "#2c3e50"}; margin-bottom: 8px; }
        .preview-section h3 { font-size: 1.1em; margin-bottom: 5px; font-weight: bold; }
        .preview-section p, .preview-section li { font-size: 0.95em; margin-bottom: 4px; }
        .preview-list-item { margin-bottom: 10px; padding-left: 15px; border-left: 2px solid #ccc; }
        .preview-highlights { list-style-type: disc; margin-left: 20px; }
        .preview-highlights li { font-size: 0.9em; color: #555; }
        .skills-preview-container { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-tag-preview { background-color: #e9ecef; color: #495057; padding: 3px 8px; border-radius: 4px; font-size: 0.85em; }
    </style></head><body>`;

    // Basics Section (Header)
    if (data.basics) {
        html += `<div style="text-align: center; margin-bottom: 20px;">`;
        if (data.basics.fullName) html += `<h1 style="margin-bottom: 5px;">${data.basics.fullName}</h1>`;
        let contactInfo = [];
        if (data.basics.jobTitle) contactInfo.push(data.basics.jobTitle);
        if (data.basics.email) contactInfo.push(data.basics.email);
        if (data.basics.phone) contactInfo.push(data.basics.phone);
        if (data.basics.city && data.basics.region) contactInfo.push(`${data.basics.city}, ${data.basics.region}`);
        else if (data.basics.city) contactInfo.push(data.basics.city);
        else if (data.basics.region) contactInfo.push(data.basics.region);
        if (data.basics.website) contactInfo.push(`<a href="${data.basics.website}" target="_blank">${data.basics.website}</a>`);
        html += `<p style="font-size: 1em; color: #555;">${contactInfo.join(" | ")}</p>`;
        html += `</div>`;
    }

    // Iterate over section configurations to maintain order and titles
    const sectionOrder = ["summary", "skills", "education", "itskills", "work", "projects", "accomplishments", "career", "personal"];
    sectionOrder.forEach(sectionKey => {
        const sectionConfig = getSectionConfig(sectionKey);
        const sectionData = data[sectionKey];
        if (!sectionConfig || !sectionData || (Array.isArray(sectionData) && sectionData.length === 0) || (typeof sectionData === "string" && !sectionData.trim())) return;

        html += `<div class="preview-section ${sectionKey}-preview-section">`;
        html += `<h2>${sectionConfig.title}</h2>`;

        if (sectionKey === "summary" && typeof sectionData === "string") {
            html += `<p>${sectionData}</p>`;
        } else if (sectionKey === "skills" && sectionData.skillsList && Array.isArray(sectionData.skillsList)) {
            html += `<div class="skills-preview-container">`;
            sectionData.skillsList.forEach(skill => {
                if (skill.name) html += `<span class="skill-tag-preview">${skill.name}${skill.level ? ` (${skill.level})` : ""}</span>`;
            });
            html += `</div>`;
        } else if (Array.isArray(sectionData[sectionConfig.fields[0].name])) { // Generic list handling
            const listData = sectionData[sectionConfig.fields[0].name];
            listData.forEach(item => {
                html += `<div class="preview-list-item">`;
                sectionConfig.fields[0].itemFields.forEach(itemField => {
                    if (item[itemField.name]) {
                        if (itemField.type === "list" && Array.isArray(item[itemField.name])) { // Nested list (e.g., highlights)
                            if (item[itemField.name].length > 0) {
                                html += `<h4>${itemField.label}</h4><ul class="preview-highlights">`;
                                item[itemField.name].forEach(highlight => { if(highlight) html += `<li>${highlight}</li>`; });
                                html += `</ul>`;
                            }
                        } else {
                            html += `<p><strong>${itemField.label}:</strong> ${item[itemField.name]}</p>`;
                        }
                    }
                });
                html += `</div>`;
            });
        } else if (typeof sectionData === "object") { // For flat object sections (not typical with current config)
            sectionConfig.fields.forEach(field => {
                if (sectionData[field.name]) {
                     html += `<p><strong>${field.label}:</strong> ${sectionData[field.name]}</p>`;
                }
            });
        } else if (typeof sectionData === "string" && sectionData.trim()) { // Simple string sections (if any)
             html += `<p>${sectionData}</p>`;
        }
        html += `</div>`;
    });

    html += "</body></html>";
    return html;
}

function applyCustomizationOptionsToPreview(iframeDoc, options) {
    if (!iframeDoc || !options) return;
    iframeDoc.body.style.fontFamily = options.fontFamily || "Arial, sans-serif";
    const headers = iframeDoc.querySelectorAll("h1, h2"); // Target main headers
    let primaryColor = "#333"; // Default
    if (options.colorScheme === "blue") primaryColor = "#0056b3";
    else if (options.colorScheme === "green") primaryColor = "#1e7e34";
    else if (options.colorScheme === "purple") primaryColor = "#563d7c";
    else if (options.colorScheme === "red") primaryColor = "#c82333";
    headers.forEach(h => h.style.color = primaryColor);
    // Add more style changes based on options.layoutStyle etc.
}

function initEditorActions() {
    const saveBtn = document.getElementById("save-resume-btn");
    const downloadBtn = document.getElementById("download-resume-btn");
    const templateOptionsBtn = document.getElementById("template-options-btn");

    if (saveBtn) saveBtn.addEventListener("click", () => {
        saveCurrentSectionData(); // Save current section before global save if needed, or rely on live updates
        saveResumeData(loadResumeData()); 
        showNotification("Resume data saved to browser storage!");
    });
    if (downloadBtn) downloadBtn.addEventListener("click", openDownloadOptionsModal);
    if (templateOptionsBtn) templateOptionsBtn.addEventListener("click", openTemplateOptionsModal);
}

function initModalListeners() {
    document.querySelectorAll(".modal .close-modal-btn, .modal .cancel-btn").forEach(btn => {
        btn.addEventListener("click", () => btn.closest(".modal").classList.remove("active"));
    });
    const confirmRemoveBtn = document.getElementById("confirm-remove-section-btn");
    if (confirmRemoveBtn) confirmRemoveBtn.addEventListener("click", () => {
        const sectionToRemove = confirmRemoveBtn.dataset.sectionToRemove;
        if (sectionToRemove) removeResumeSection(sectionToRemove);
    });
    const confirmAddSectionBtn = document.getElementById("confirm-add-section-btn");
    if (confirmAddSectionBtn) confirmAddSectionBtn.addEventListener("click", addSelectedResumeSections);
    const saveTemplateOptionsBtn = document.getElementById("save-template-options-btn");
    if (saveTemplateOptionsBtn) saveTemplateOptionsBtn.addEventListener("click", saveAndApplyTemplateOptionsFromModal);
    const downloadPdfBtn = document.getElementById("download-pdf-btn");
    if (downloadPdfBtn) downloadPdfBtn.addEventListener("click", () => downloadResume("pdf"));
    const downloadDocxBtn = document.getElementById("download-docx-btn");
    if (downloadDocxBtn) downloadDocxBtn.addEventListener("click", () => downloadResume("docx"));
}

function updateSectionsList(resumeData) {
    const sectionsListContainer = document.querySelector(".sections-list");
    if (!sectionsListContainer) return;
    sectionsListContainer.innerHTML = ""; // Clear existing
    const allSectionConfigs = getAllSectionConfigs(); // Get all possible sections

    for (const sectionKey in allSectionConfigs) {
        const config = allSectionConfigs[sectionKey];
        // Check if section has data or is a default section to display
        const hasData = resumeData[sectionKey] && 
                        (Array.isArray(resumeData[sectionKey]) ? resumeData[sectionKey].length > 0 : Object.keys(resumeData[sectionKey]).length > 0 || typeof resumeData[sectionKey] === "string");
        
        // For now, display all sections defined in config. Later, can filter by template.
        // if (hasData || config.alwaysVisible) { 
            const item = document.createElement("div");
            item.className = `section-item ${currentSection === sectionKey ? "active" : ""}`;
            item.dataset.section = sectionKey;
            item.innerHTML = `
                <div class="section-item-content">
                    <i class="${config.icon || "fas fa-file-alt"} section-icon"></i>
                    <span>${config.title}</span>
                </div>
                <div class="section-item-actions">
                    <button class="edit-section-btn" data-section="${sectionKey}"><i class="fas fa-pen"></i></button>
                    ${config.canBeDeleted === false ? "" : `<button class="remove-section-btn" data-section="${sectionKey}"><i class="fas fa-trash"></i></button>`}
                </div>
            `;
            sectionsListContainer.appendChild(item);
        // }
    }
}

function openAddSectionModal() {
    const modal = document.getElementById("addSectionModal");
    const availableSectionsContainer = modal.querySelector(".available-sections");
    if (!modal || !availableSectionsContainer) return;
    availableSectionsContainer.innerHTML = "";
    const resumeData = loadResumeData();
    const allConfigs = getAllSectionConfigs();
    for (const key in allConfigs) {
        if (!resumeData[key] || (Array.isArray(resumeData[key]) && resumeData[key].length === 0)) { // Show only sections not yet added or empty
            const item = document.createElement("div");
            item.className = "available-section-item";
            item.dataset.sectionKey = key;
            item.innerHTML = `<i class="${allConfigs[key].icon || "fas fa-file-alt"}"></i> <span>${allConfigs[key].title}</span>`;
            item.addEventListener("click", () => item.classList.toggle("selected"));
            availableSectionsContainer.appendChild(item);
        }
    }
    modal.classList.add("active");
}

function addSelectedResumeSections() {
    const selectedItems = document.querySelectorAll("#addSectionModal .available-section-item.selected");
    let resumeData = loadResumeData();
    selectedItems.forEach(item => {
        const sectionKey = item.dataset.sectionKey;
        const config = getSectionConfig(sectionKey);
        if (config && !resumeData[sectionKey]) {
            resumeData[sectionKey] = config.defaultData;
        }
    });
    saveResumeData(resumeData);
    updateSectionsList(resumeData);
    if (selectedItems.length > 0) {
        loadSectionEditor(selectedItems[0].dataset.sectionKey, resumeData); // Load first added section
        setActiveSection(selectedItems[0].dataset.sectionKey);
    }
    updateLivePreview(resumeData, loadTemplateOptions());
    document.getElementById("addSectionModal").classList.remove("active");
}

function openRemoveSectionModal(sectionKey) {
    const modal = document.getElementById("removeSectionModal");
    if (!modal) return;
    const confirmBtn = document.getElementById("confirm-remove-section-btn");
    confirmBtn.dataset.sectionToRemove = sectionKey;
    // You might want to display the section name in the modal text
    modal.classList.add("active");
}

function removeResumeSection(sectionKey) {
    let resumeData = loadResumeData();
    delete resumeData[sectionKey]; // Or set to empty/null if you prefer to keep the key
    saveResumeData(resumeData);
    updateSectionsList(resumeData);
    // Decide which section to load next, e.g., the first one or basics
    const nextSectionToLoad = Object.keys(getAllSectionConfigs())[0] || "basics";
    loadSectionEditor(nextSectionToLoad, resumeData);
    setActiveSection(nextSectionToLoad);
    updateLivePreview(resumeData, loadTemplateOptions());
    document.getElementById("removeSectionModal").classList.remove("active");
    showNotification(`Section "${getSectionConfig(sectionKey).title}" removed.`);
}

function openTemplateOptionsModal() {
    const modal = document.getElementById("templateOptionsModal");
    if (!modal) return;
    const options = loadTemplateOptions();
    modal.querySelector("#colorScheme").value = options.colorScheme || "default";
    modal.querySelector("#fontFamily").value = options.fontFamily || "default";
    modal.querySelector("#layoutStyle").value = options.layoutStyle || "default";
    modal.classList.add("active");
}

function saveAndApplyTemplateOptionsFromModal() {
    const modal = document.getElementById("templateOptionsModal");
    const options = {
        colorScheme: modal.querySelector("#colorScheme").value,
        fontFamily: modal.querySelector("#fontFamily").value,
        layoutStyle: modal.querySelector("#layoutStyle").value
    };
    saveTemplateOptions(options);
    updateLivePreview(loadResumeData(), options);
    modal.classList.remove("active");
    showNotification("Template options applied!");
}

function openDownloadOptionsModal() {
    const modal = document.getElementById("downloadOptionsModal");
    if (modal) modal.classList.add("active");
}

function showNotification(message, type = "success") {
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) existingNotification.remove();
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `<div class="notification-content"><i class="fas ${type === "success" ? "fa-check-circle" : type === "error" ? "fa-exclamation-circle" : "fa-info-circle"}"></i><span>${message}</span></div>`;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add("show"), 10);
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function initPreviewControls() {
    const zoomInBtn = document.getElementById("zoom-in-btn");
    const zoomOutBtn = document.getElementById("zoom-out-btn");
    const fullscreenBtn = document.getElementById("fullscreen-btn");
    const iframe = document.getElementById("preview-iframe");
    let currentZoom = 1;

    if (zoomInBtn) zoomInBtn.addEventListener("click", () => {
        currentZoom += 0.1;
        if(iframe) iframe.style.transform = `scale(${currentZoom})`;
    });
    if (zoomOutBtn) zoomOutBtn.addEventListener("click", () => {
        currentZoom = Math.max(0.5, currentZoom - 0.1);
        if(iframe) iframe.style.transform = `scale(${currentZoom})`;
    });
    if (fullscreenBtn && iframe) fullscreenBtn.addEventListener("click", () => {
        if (iframe.requestFullscreen) iframe.requestFullscreen();
        else if (iframe.mozRequestFullScreen) iframe.mozRequestFullScreen(); 
        else if (iframe.webkitRequestFullscreen) iframe.webkitRequestFullscreen();
        else if (iframe.msRequestFullscreen) iframe.msRequestFullscreen();
    });
}

// Placeholder for other utility functions from the original script
function initMobileNavigation() { 
    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    if(menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => navLinks.classList.toggle("active"));
    }
}
function initLogoutModal() { /* ... */ }
function updateBreadcrumbs() { /* ... */ }
function setActiveNavLink() { /* ... */ }

function getDefaultResumeData() {
    const sections = getAllSectionConfigs();
    const defaultData = {};
    for (const key in sections) {
        defaultData[key] = sections[key].defaultData;
    }
    // Pre-fill some basics for a better initial experience
    defaultData.basics = {
        fullName: "Your Name", jobTitle: "Your Profession", email: "your.email@example.com", phone: "(555) 123-4567", 
        city: "Your City", region: "Your State", website: "yourportfolio.com"
    };
    return defaultData;
}

function getAllSectionConfigs() {
    return {
        basics: {
            title: "Personal Information", icon: "fas fa-user", canBeDeleted: false,
            description: "Add your contact details and basic information.",
            defaultData: { fullName: "", jobTitle: "", email: "", phone: "", city: "", region: "", website: "" },
            fields: [
                { name: "fullName", label: "Full Name", placeholder: "e.g. John Doe" },
                { name: "jobTitle", label: "Job Title", placeholder: "e.g. Software Engineer" },
                { name: "email", label: "Email", type: "email", placeholder: "e.g. john.doe@example.com" },
                { name: "phone", label: "Phone", type: "tel", placeholder: "e.g. (555) 555-5555" },
                { name: "city", label: "City", placeholder: "e.g. San Francisco" },
                { name: "region", label: "State/Region", placeholder: "e.g. CA" },
                { name: "website", label: "Website/Portfolio (Optional)", type: "url", placeholder: "e.g. https://johndoe.com", fullWidth: true },
            ]
        },
        summary: { // Resume Headline
            title: "Resume Headline", icon: "fas fa-align-left",
            description: "A concise headline introducing yourself.",
            defaultData: "", // Simple string for this section
            fields: [
                { name: "summaryText", label: "Headline", type: "textarea", placeholder: "e.g. Experienced project manager with a decade of experience...", fullWidth: true, maxLength: 250 }
            ]
        },
        skills: { // Key Skills
            title: "Key Skills", icon: "fas fa-tools",
            description: "List your most relevant skills.",
            defaultData: { skillsList: [] },
            fields: [
                { 
                    name: "skillsList", label: "Skills", type: "list", itemLabel: "Skill", fullWidth: true,
                    itemFields: [
                        { name: "name", label: "Skill Name", placeholder: "e.g. JavaScript" },
                        { name: "level", label: "Proficiency", type: "select", options: [
                            {value: "", label: "Select Level"}, {value: "Beginner", label: "Beginner"}, 
                            {value: "Intermediate", label: "Intermediate"}, {value: "Advanced", label: "Advanced"}, 
                            {value: "Expert", label: "Expert"}
                        ] }
                    ],
                    defaultItemData: { name: "", level: "" }
                }
            ]
        },
        education: {
            title: "Education", icon: "fas fa-graduation-cap",
            description: "Your educational qualifications.",
            defaultData: { educationList: [] },
            fields: [
                { 
                    name: "educationList", label: "Education Entries", type: "list", itemLabel: "Education", fullWidth: true,
                    itemFields: [
                        { name: "degree", label: "Degree/Certificate", placeholder: "e.g. Bachelor of Technology" },
                        { name: "institute", label: "University/Institute", placeholder: "e.g. Massachusetts Institute of Technology" },
                        { name: "startYear", label: "Start Year", type: "text", placeholder: "YYYY" }, // Changed to text for flexibility
                        { name: "endYear", label: "End Year (or Expected)", type: "text", placeholder: "YYYY or Present" },
                        { name: "field", label: "Field of Study", placeholder: "e.g. Computer Science", fullWidth: true },
                        { name: "grade", label: "Grade/Score (Optional)", placeholder: "e.g. 3.8 GPA or 85%", fullWidth: true },
                        { name: "description", label: "Description (Optional)", type: "textarea", placeholder: "Relevant coursework, honors, thesis, etc.", fullWidth: true }
                    ],
                    defaultItemData: { degree: "", institute: "", startYear: "", endYear: "", field: "", grade: "", description: "" }
                }
            ]
        },
        itskills: {
            title: "IT Skills", icon: "fas fa-laptop-code",
            description: "Technical skills, programming languages, software, or tools.",
            defaultData: { itSkillsList: [] },
            fields: [
                {
                    name: "itSkillsList", label: "IT Skill Entries", type: "list", itemLabel: "IT Skill", fullWidth: true,
                    itemFields: [
                        { name: "skillName", label: "Skill/Technology", placeholder: "e.g. Python, AWS, Photoshop" },
                        { name: "proficiency", label: "Proficiency", type: "select", options: [
                            {value: "", label: "Select Level"}, {value: "Beginner", label: "Beginner"}, 
                            {value: "Intermediate", label: "Intermediate"}, {value: "Advanced", label: "Advanced"}, 
                            {value: "Expert", label: "Expert"}
                        ]},
                        { name: "experience", label: "Years of Experience (Optional)", type: "text", placeholder: "e.g., 3+" },
                        { name: "lastUsed", label: "Last Used (Optional)", type: "text", placeholder: "e.g., Currently Using or YYYY" }
                    ],
                    defaultItemData: { skillName: "", proficiency: "", experience: "", lastUsed: "" }
                }
            ]
        },
        work: {
            title: "Work Experience", icon: "fas fa-briefcase",
            description: "Your professional experience.",
            defaultData: { workList: [] },
            fields: [
                {
                    name: "workList", label: "Work Experience Entries", type: "list", itemLabel: "Experience", fullWidth: true,
                    itemFields: [
                        { name: "title", label: "Job Title", placeholder: "e.g. Senior Software Engineer" },
                        { name: "company", label: "Company Name", placeholder: "e.g. Google LLC" },
                        { name: "location", label: "Location (Optional)", placeholder: "e.g. Mountain View, CA" },
                        { name: "startDate", label: "Start Date", type: "text", placeholder: "Month YYYY" },
                        { name: "endDate", label: "End Date", type: "text", placeholder: "Month YYYY or Present" },
                        { name: "currentlyWorking", label: "I currently work here", type: "checkbox", checkboxLabel: ""}, // For JS to disable endDate
                        { name: "description", label: "Description/Responsibilities", type: "textarea", placeholder: "Describe your role and key responsibilities.", fullWidth: true },
                        {
                            name: "highlights", label: "Key Achievements/Highlights (Optional)", type: "list", itemLabel: "Highlight", fullWidth: true,
                            placeholder: "e.g., Led a team of 5 engineers...", // Placeholder for individual highlight input
                            itemFields: [{ name: "highlightText", label: "Highlight", type: "text" }], 
                            defaultItemData: { highlightText: "" }
                        }
                    ],
                    defaultItemData: { title: "", company: "", location: "", startDate: "", endDate: "", currentlyWorking: false, description: "", highlights: [] }
                }
            ]
        },
        projects: {
            title: "Projects", icon: "fas fa-project-diagram",
            description: "Details about projects you have worked on.",
            defaultData: { projectList: [] },
            fields: [
                {
                    name: "projectList", label: "Project Entries", type: "list", itemLabel: "Project", fullWidth: true,
                    itemFields: [
                        { name: "title", label: "Project Title", placeholder: "e.g. E-commerce Platform Development" },
                        { name: "client", label: "Client/Organization (Optional)", placeholder: "e.g. Self-initiated or Company Name" },
                        { name: "status", label: "Project Status", type: "select", options:[
                            {value: "Completed", label: "Completed"}, {value: "In Progress", label: "In Progress"}, {value: "Ongoing", label: "Ongoing"}
                        ]},
                        { name: "startDate", label: "Start Date (Optional)", type: "text", placeholder: "Month YYYY" },
                        { name: "endDate", label: "End Date (Optional)", type: "text", placeholder: "Month YYYY" },
                        { name: "url", label: "Project URL (Optional)", type: "url", placeholder: "e.g. https://github.com/user/project" },
                        { name: "role", label: "Your Role (Optional)", placeholder: "e.g. Lead Developer, Project Manager" },
                        { name: "description", label: "Project Description", type: "textarea", placeholder: "Describe the project, your contributions, and technologies used.", fullWidth: true },
                        { 
                            name: "skillsUsed", label: "Skills Used (Optional)", type: "list", itemLabel: "Skill", fullWidth: true,
                            placeholder: "e.g., React, Node.js, Agile",
                            itemFields: [{ name: "skillName", label: "Skill", type: "text" }],
                            defaultItemData: { skillName: "" }
                        }
                    ],
                    defaultItemData: { title: "", client: "", status: "Completed", startDate: "", endDate: "", url: "", role: "", description: "", skillsUsed: [] }
                }
            ]
        },
        accomplishments: {
            title: "Accomplishments", icon: "fas fa-trophy",
            description: "Showcase credentials like profiles, samples, publications, patents, certifications.",
            defaultData: { onlineProfiles: [], workSamples: [], publications: [], presentations: [], patents: [], certifications: [] }, // Separate lists for each type
            fields: [
                // Online Profiles
                { 
                    name: "onlineProfiles", label: "Online Profiles", type: "list", itemLabel: "Profile", fullWidth: true,
                    itemFields: [
                        { name: "type", label: "Profile Type", placeholder: "e.g. LinkedIn, GitHub, Portfolio"},
                        { name: "url", label: "URL", type: "url", placeholder: "https://..." }
                    ],
                    defaultItemData: { type: "", url: "" }
                },
                // Work Samples
                { 
                    name: "workSamples", label: "Work Samples", type: "list", itemLabel: "Sample", fullWidth: true,
                    itemFields: [
                        { name: "title", label: "Sample Title", placeholder: "e.g. My Awesome Project Showcase"},
                        { name: "url", label: "URL", type: "url", placeholder: "https://..." },
                        { name: "description", label: "Brief Description (Optional)", type: "textarea", placeholder: "A short note about this sample."}
                    ],
                    defaultItemData: { title: "", url: "", description: "" }
                },
                // Publications
                { 
                    name: "publications", label: "Publications/Journals", type: "list", itemLabel: "Publication", fullWidth: true,
                    itemFields: [
                        { name: "title", label: "Title", placeholder: "e.g. Research on AI Ethics"},
                        { name: "journal", label: "Journal/Platform", placeholder: "e.g. Nature, arXiv, Medium"},
                        { name: "year", label: "Year", type: "text", placeholder: "YYYY"},
                        { name: "url", label: "URL (Optional)", type: "url", placeholder: "https://..." },
                        { name: "description", label: "Abstract/Summary (Optional)", type: "textarea"}
                    ],
                    defaultItemData: { title: "", journal: "", year: "", url: "", description: "" }
                },
                // Presentations
                { 
                    name: "presentations", label: "Presentations", type: "list", itemLabel: "Presentation", fullWidth: true,
                    itemFields: [
                        { name: "title", label: "Title", placeholder: "e.g. Keynote on Future of Web"},
                        { name: "event", label: "Event/Conference", placeholder: "e.g. Web Summit 2023"},
                        { name: "year", label: "Year", type: "text", placeholder: "YYYY"},
                        { name: "url", label: "URL (Optional)", type: "url", placeholder: "https://slideshare.net/..." },
                        { name: "description", label: "Brief Description (Optional)", type: "textarea"}
                    ],
                    defaultItemData: { title: "", event: "", year: "", url: "", description: "" }
                },
                // Patents
                { 
                    name: "patents", label: "Patents", type: "list", itemLabel: "Patent", fullWidth: true,
                    itemFields: [
                        { name: "title", label: "Patent Title"},
                        { name: "patentOffice", label: "Patent Office", placeholder: "e.g. USPTO"},
                        { name: "applicationNumber", label: "Application/Patent Number"},
                        { name: "status", label: "Status", type: "select", options:[
                            {value: "Filed", label: "Filed"}, {value: "Granted", label: "Granted"}, {value: "Pending", label: "Pending"}
                        ]},
                        { name: "year", label: "Year Filed/Granted", type: "text", placeholder: "YYYY"},
                        { name: "url", label: "URL (Optional)", type: "url" },
                        { name: "description", label: "Abstract/Summary (Optional)", type: "textarea"}
                    ],
                    defaultItemData: { title: "", patentOffice: "", applicationNumber: "", status: "Filed", year: "", url: "", description: "" }
                },
                // Certifications
                { 
                    name: "certifications", label: "Certifications", type: "list", itemLabel: "Certification", fullWidth: true,
                    itemFields: [
                        { name: "name", label: "Certification Name", placeholder: "e.g. AWS Certified Solutions Architect"},
                        { name: "issuingOrganization", label: "Issuing Organization", placeholder: "e.g. Amazon Web Services"},
                        { name: "issueDate", label: "Issue Date (Optional)", type: "text", placeholder: "Month YYYY"},
                        { name: "expiryDate", label: "Expiry Date (Optional)", type: "text", placeholder: "Month YYYY or No Expiry"},
                        { name: "credentialID", label: "Credential ID (Optional)"},
                        { name: "credentialURL", label: "Credential URL (Optional)", type: "url" }
                    ],
                    defaultItemData: { name: "", issuingOrganization: "", issueDate: "", expiryDate: "", credentialID: "", credentialURL: "" }
                }
            ]
        },
        career: { // Career Profile / Objective
            title: "Career Profile", icon: "fas fa-chart-line",
            description: "Your career objective or professional profile summary.",
            defaultData: { careerObjective: "" },
            fields: [
                { name: "careerObjective", label: "Career Objective / Summary", type: "textarea", placeholder: "e.g. A highly motivated and results-oriented professional seeking a challenging position...", fullWidth: true, maxLength: 1000 }
            ]
        },
        personal: {
            title: "Personal Details", icon: "fas fa-id-card",
            description: "Additional personal information.",
            defaultData: { dob: "", gender: "", nationality: "", maritalStatus: "", address: "", languages: [] },
            fields: [
                { name: "dob", label: "Date of Birth (Optional)", type: "text", placeholder: "DD-MM-YYYY" },
                { name: "gender", label: "Gender (Optional)", type: "select", options: [
                    {value: "", label: "Select Gender"}, {value: "Male", label: "Male"}, 
                    {value: "Female", label: "Female"}, {value: "Other", label: "Other"}, {value: "Prefer not to say", label: "Prefer not to say"}
                ]},
                { name: "nationality", label: "Nationality (Optional)", placeholder: "e.g. American" },
                { name: "maritalStatus", label: "Marital Status (Optional)", type: "select", options: [
                    {value: "", label: "Select Status"}, {value: "Single", label: "Single"}, 
                    {value: "Married", label: "Married"}, {value: "Divorced", label: "Divorced"}, {value: "Widowed", label: "Widowed"}
                ]},
                { name: "address", label: "Full Address (Optional)", type: "textarea", placeholder: "Your Street, Apartment, City, Zip Code", fullWidth: true },
                { 
                    name: "languages", label: "Languages Known", type: "list", itemLabel: "Language", fullWidth: true,
                    itemFields: [
                        { name: "name", label: "Language", placeholder: "e.g. Spanish" },
                        { name: "proficiency", label: "Proficiency", type: "select", options: [
                            {value: "", label: "Select Level"}, {value: "Native", label: "Native Speaker"}, 
                            {value: "Fluent", label: "Fluent"}, {value: "Proficient", label: "Proficient"}, 
                            {value: "Intermediate", label: "Intermediate"}, {value: "Basic", label: "Basic"}
                        ] }
                    ],
                    defaultItemData: { name: "", proficiency: "" }
                }
            ]
        }
    };
}

function getSectionConfig(sectionKey) {
    return getAllSectionConfigs()[sectionKey];
}

