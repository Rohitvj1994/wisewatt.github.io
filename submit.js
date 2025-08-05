// Submit Blog JavaScript functionality
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('blogForm');
    const contentTypeToggles = document.querySelectorAll('.toggle-btn');
    const textContentDiv = document.getElementById('textContent');
    const fileContentDiv = document.getElementById('fileContent');
    const fileInput = document.getElementById('docxFile');
    const fileDisplay = document.getElementById('fileDisplay');
    const statusMessage = document.getElementById('statusMessage');
    const submitBtn = document.querySelector('.submit-btn');

    let currentContentType = 'text';
    let convertedContent = '';

    // Content type toggle functionality
    contentTypeToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            contentTypeToggles.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            currentContentType = this.dataset.type;
            
            if (currentContentType === 'text') {
                textContentDiv.style.display = 'block';
                fileContentDiv.style.display = 'none';
                document.getElementById('content').required = true;
                fileInput.required = false;
            } else {
                textContentDiv.style.display = 'none';
                fileContentDiv.style.display = 'block';
                document.getElementById('content').required = false;
                fileInput.required = true;
            }
        });
    });

    // File input handling
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                showMessage('Please select a valid .docx file', 'error');
                return;
            }
            
            fileDisplay.innerHTML = `<i class="fas fa-file-word"></i> ${file.name}`;
            convertDocxToHtml(file);
        }
    });

    // Convert DOCX to HTML using Mammoth.js
    function convertDocxToHtml(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            mammoth.convertToHtml({arrayBuffer: e.target.result})
                .then(function(result) {
                    convertedContent = result.value;
                    showMessage('Document converted successfully!', 'success');
                })
                .catch(function(error) {
                    console.error('Error converting document:', error);
                    showMessage('Error converting document. Please try again.', 'error');
                });
        };
        reader.readAsArrayBuffer(file);
    }

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(form);
        const passkey = formData.get('passkey');
        
        // Validate passkey
        if (passkey !== PASSKEY) {
            showMessage('Invalid passkey!', 'error');
            return;
        }

        // Prepare blog data
        const blogData = {
            title: formData.get('title'),
            theme: formData.get('theme'),
            content: currentContentType === 'text' ? formData.get('content') : convertedContent,
            passkey: passkey,
            contentType: currentContentType
        };

        // Validate content
        if (!blogData.content || blogData.content.trim() === '') {
            showMessage('Please provide blog content!', 'error');
            return;
        }

        try {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
            
            await submitBlog(blogData);
            
        } catch (error) {
            console.error('Submission error:', error);
            showMessage('Error submitting blog. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Blog Post';
        }
    });

    // Submit blog to Netlify function
    async function submitBlog(blogData) {
        const response = await fetch('/.netlify/functions/publish-blog', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(blogData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to publish blog');
        }

        const result = await response.json();
        showMessage(`Blog published successfully! <a href="${result.blogUrl}" target="_blank" style="color: #4caf50; text-decoration: underline;">View Blog</a>`, 'success');
        
        // Reset form after successful submission
        setTimeout(() => {
            form.reset();
            convertedContent = '';
            fileDisplay.innerHTML = '<i class="fas fa-upload"></i> Click to upload .docx file or drag and drop';
            contentTypeToggles.forEach(btn => btn.classList.remove('active'));
            contentTypeToggles[0].classList.add('active');
            textContentDiv.style.display = 'block';
            fileContentDiv.style.display = 'none';
            currentContentType = 'text';
        }, 3000);
    }

    // Show status messages
    function showMessage(message, type) {
        statusMessage.innerHTML = message;
        statusMessage.className = `status-message status-${type}`;
        statusMessage.style.display = 'block';
        
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 5000);
    }

    // Drag and drop functionality
    const fileInputDisplay = document.querySelector('.file-input-display');
    
    fileInputDisplay.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.style.borderColor = '#00e676';
        this.style.background = 'rgba(0, 230, 118, 0.1)';
    });

    fileInputDisplay.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        this.style.background = 'rgba(255, 255, 255, 0.05)';
    });

    fileInputDisplay.addEventListener('drop', function(e) {
        e.preventDefault();
        this.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        this.style.background = 'rgba(255, 255, 255, 0.05)';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            fileInput.dispatchEvent(new Event('change'));
        }
    });
});