// Enhanced Audio URL Validation and Generation
// Add this to your admin dashboard

// Function to validate if an audio URL is publicly accessible
async function validateAudioUrl(audioUrl) {
    try {
        console.log('Validating audio URL:', audioUrl);
        
        // Test if the URL is accessible
        const response = await fetch(audioUrl, { method: 'HEAD' });
        
        if (response.ok) {
            console.log('✅ Audio URL is accessible');
            return { valid: true, status: response.status };
        } else {
            console.log('❌ Audio URL not accessible:', response.status);
            return { valid: false, status: response.status, error: response.statusText };
        }
    } catch (error) {
        console.error('❌ Error validating audio URL:', error);
        return { valid: false, error: error.message };
    }
}

// Enhanced upload function with URL validation
async function uploadAudioFileWithValidation(file) {
    try {
        console.log('Starting upload for file:', file.name, 'Size:', file.size, 'Type:', file.type);
        
        // Show progress
        document.getElementById('uploadProgress').classList.remove('hidden');
        document.getElementById('uploadContainer').classList.add('hidden');
        document.getElementById('uploadedFileInfo').classList.add('hidden');
        
        // Create a unique filename
        const timestamp = Date.now();
        const fileName = `audio_${currentRequest.id}_${timestamp}.${file.name.split('.').pop()}`;
        
        // Upload to Supabase Storage
        console.log('Uploading to Supabase Storage with filename:', fileName);
        const { data, error } = await supabase.storage
            .from('audio-files')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
        
        if (error) {
            console.error('Supabase upload error:', error);
            throw error;
        }
        
        console.log('Upload successful:', data);
        
        // Get public URL
        const { data: urlData } = supabase.storage
            .from('audio-files')
            .getPublicUrl(fileName);
        
        const audioUrl = urlData.publicUrl;
        console.log('Generated public URL:', audioUrl);
        
        // Validate the URL is publicly accessible
        const validation = await validateAudioUrl(audioUrl);
        
        if (!validation.valid) {
            throw new Error(`Audio URL is not publicly accessible: ${validation.error}`);
        }
        
        uploadedAudioUrl = audioUrl;
        
        // Update progress to 100%
        document.getElementById('progressBar').style.width = '100%';
        
        // Hide progress and show success
        setTimeout(() => {
            document.getElementById('uploadProgress').classList.add('hidden');
            document.getElementById('uploadedFileInfo').classList.remove('hidden');
            document.getElementById('uploadedFileName').textContent = file.name;
            document.getElementById('uploadedFileUrl').textContent = uploadedAudioUrl;
        }, 500);
        
        // Update the database with the audio file URL
        await updateAudioFileUrl(uploadedAudioUrl);
        
        return uploadedAudioUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file: ' + error.message);
        
        // Reset UI
        document.getElementById('uploadProgress').classList.add('hidden');
        document.getElementById('uploadContainer').classList.remove('hidden');
        document.getElementById('uploadedFileInfo').classList.add('hidden');
    }
}

// Enhanced email sending with URL validation
async function sendEmailWithValidation() {
    if (!currentRequest) {
        alert('No request selected');
        return;
    }
    
    if (!uploadedAudioUrl) {
        alert('Please upload an audio file first');
        return;
    }
    
    // Validate the audio URL before sending email
    console.log('Validating audio URL before sending email...');
    const validation = await validateAudioUrl(uploadedAudioUrl);
    
    if (!validation.valid) {
        alert(`Cannot send email: Audio file is not publicly accessible. Error: ${validation.error}`);
        return;
    }
    
    // Proceed with email sending (existing code)
    // ... rest of your email sending logic
}
