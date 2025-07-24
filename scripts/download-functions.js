// Function to handle document downloads with fixed duplicate issue
function downloadResume(format) {
    console.log(`Starting download in ${format} format...`);
    const iframe = document.getElementById("preview-iframe");
    if (!iframe) {
        showNotification("Preview not available. Please try again.", "error");
        return;
    }

    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
    if (!iframeDoc) {
        showNotification("Cannot access preview content. Please try again.", "error");
        return;
    }

    // Get user's name for the filename
    const resumeData = loadResumeData();
    const userName = (resumeData.basics && resumeData.basics.fullName) ? 
        resumeData.basics.fullName.replace(/\s+/g, '_') : 'resume';
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `${userName}_resume_${timestamp}`;

    // Close the download modal
    document.getElementById("downloadOptionsModal").classList.remove("active");
    
    // Show loading indicator
    showNotification("Preparing your download...", "info");

    if (format === "pdf") {
        // Use html2pdf library
        const element = iframeDoc.documentElement.cloneNode(true);
        const opt = {
            margin: [10, 10],
            filename: `${fileName}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Use a timeout to ensure the notification is shown before processing begins
        setTimeout(() => {
            html2pdf().from(element).set(opt).save()
                .then(() => {
                    showNotification("PDF downloaded successfully!", "success");
                })
                .catch(error => {
                    console.error("PDF download error:", error);
                    showNotification("Error creating PDF. Please try again.", "error");
                });
        }, 100);
    } 
    else if (format === "docx") {
        try {
            // Create a new Document
            const doc = new docx.Document({
                sections: [{
                    properties: {},
                    children: convertHtmlToDocxElements(iframeDoc.body)
                }]
            });

            // Used to prevent duplicate downloads - track if download has started
            let downloadStarted = false;

            // Generate the document as a blob
            docx.Packer.toBlob(doc).then(blob => {
                if (downloadStarted) return; // Prevent duplicate downloads
                downloadStarted = true;
                
                // Use FileSaver to save the blob
                saveAs(blob, `${fileName}.docx`);
                showNotification("Word document downloaded successfully!", "success");
            }).catch(error => {
                console.error("DOCX generation error:", error);
                showNotification("Error creating Word document. Please try again.", "error");
            });
        } catch (error) {
            console.error("DOCX creation error:", error);
            showNotification("Error creating Word document. Please try again.", "error");
        }
    }
}

// Helper function to convert HTML elements to DOCX compatible format
function convertHtmlToDocxElements(element) {
    const result = [];
    
    // Process text nodes
    function processTextNode(node) {
        return new docx.TextRun({
            text: node.textContent,
            bold: isNodeBold(node.parentElement),
            italics: isNodeItalic(node.parentElement),
            underline: isNodeUnderlined(node.parentElement)
        });
    }
    
    // Check if node has specific style
    function isNodeBold(node) {
        if (!node) return false;
        const style = window.getComputedStyle(node);
        return style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700;
    }
    
    function isNodeItalic(node) {
        if (!node) return false;
        const style = window.getComputedStyle(node);
        return style.fontStyle === 'italic';
    }
    
    function isNodeUnderlined(node) {
        if (!node) return false;
        const style = window.getComputedStyle(node);
        return style.textDecoration.includes('underline');
    }
    
    // Process element and its children
    function processElement(element) {
        if (element.nodeType === Node.TEXT_NODE) {
            if (element.textContent.trim()) {
                return [processTextNode(element)];
            }
            return [];
        }
        
        if (element.nodeType !== Node.ELEMENT_NODE) {
            return [];
        }
        
        const tagName = element.tagName.toLowerCase();
        
        // Handle headings
        if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || tagName === 'h6') {
            const children = [];
            for (const child of element.childNodes) {
                children.push(...processElement(child));
            }
            
            return [new docx.Paragraph({
                children,
                heading: tagName === 'h1' ? 'Heading1' : 
                         tagName === 'h2' ? 'Heading2' : 
                         tagName === 'h3' ? 'Heading3' : 'Heading4',
                spacing: { after: 200 }
            })];
        }
        
        // Handle paragraphs
        if (tagName === 'p') {
            const children = [];
            for (const child of element.childNodes) {
                children.push(...processElement(child));
            }
            
            return [new docx.Paragraph({
                children,
                spacing: { after: 200 }
            })];
        }
        
        // Handle lists
        if (tagName === 'ul' || tagName === 'ol') {
            const result = [];
            for (const li of element.querySelectorAll('li')) {
                const children = [];
                for (const child of li.childNodes) {
                    if (child.nodeType === Node.TEXT_NODE) {
                        if (child.textContent.trim()) {
                            children.push(processTextNode(child));
                        }
                    } else if (child.nodeType === Node.ELEMENT_NODE && 
                              child.tagName.toLowerCase() !== 'ul' && 
                              child.tagName.toLowerCase() !== 'ol') {
                        children.push(...processElement(child).flatMap(p => p.children || []));
                    }
                }
                
                result.push(new docx.Paragraph({
                    children,
                    bullet: tagName === 'ul' ? { level: 0 } : undefined,
                    numbering: tagName === 'ol' ? { reference: 'default-numbering', level: 0 } : undefined,
                    spacing: { after: 120 }
                }));
                
                // Process nested lists
                for (const nestedList of li.querySelectorAll(':scope > ul, :scope > ol')) {
                    result.push(...processElement(nestedList));
                }
            }
            return result;
        }
        
        // Handle other elements recursively
        const result = [];
        for (const child of element.childNodes) {
            result.push(...processElement(child));
        }
        return result;
    }
    
    // Process all children of the body
    for (const child of element.childNodes) {
        result.push(...processElement(child));
    }
    
    return result;
}

// Function to open download options modal
function openDownloadOptionsModal() {
    const modal = document.getElementById("downloadOptionsModal");
    if (!modal) {
        // Create modal if it doesn't exist
        const modalHTML = `
            <div class="modal" id="downloadOptionsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Download Options</h3>
                        <button class="close-modal-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Choose a format to download your resume:</p>
                        <div class="download-options-form">
                            <button id="download-pdf-btn" class="primary-btn">
                                <i class="fas fa-file-pdf"></i> PDF Format
                            </button>
                            <button id="download-docx-btn" class="primary-btn">
                                <i class="fas fa-file-word"></i> Word Document
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Add event listeners to the new modal
        const newModal = document.getElementById("downloadOptionsModal");
        newModal.querySelector(".close-modal-btn").addEventListener("click", () => {
            newModal.classList.remove("active");
        });
        
        newModal.querySelector("#download-pdf-btn").addEventListener("click", () => {
            downloadResume("pdf");
        });
        
        newModal.querySelector("#download-docx-btn").addEventListener("click", () => {
            downloadResume("docx");
        });
        
        newModal.classList.add("active");
    } else {
        modal.classList.add("active");
    }
}

// Enhanced notification function
function showNotification(message, type = "success") {
    console.log(`Notification (${type}): ${message}`);
    
    // Remove any existing notification
    const existingNotification = document.querySelector(".notification");
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                           type === 'error' ? 'fa-exclamation-circle' : 
                           'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Show with animation
    setTimeout(() => {
        notification.classList.add("show");
    }, 10);
    
    // Auto-hide after delay
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => {
            notification.remove();
        }, 300); // Match transition duration
    }, 3000);
}
