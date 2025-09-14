// Alternative approach: Use signed URLs for more security
// This generates temporary URLs that expire after 7 days

// In your admin dashboard, replace the getPublicUrl call with:
async function generateSignedAudioUrl(fileName) {
    try {
        const { data, error } = await supabase.storage
            .from('audio-files')
            .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days expiry
        
        if (error) throw error;
        
        return data.signedUrl;
    } catch (error) {
        console.error('Error generating signed URL:', error);
        throw error;
    }
}

// Usage in uploadAudioFile function:
// Replace this line:
// const { data: urlData } = supabase.storage.from('audio-files').getPublicUrl(fileName);
// uploadedAudioUrl = urlData.publicUrl;

// With this:
// uploadedAudioUrl = await generateSignedAudioUrl(fileName);
