// Alternative: Serve audio files through Vercel
// Create this as api/audio/[filename].js in your Vercel project

// This would create a proxy endpoint like: https://www.muzimake.com/api/audio/audio_123_456.mp3
// That serves the file from Supabase storage

export default async function handler(req, res) {
    const { filename } = req.query;
    
    try {
        // Get the file from Supabase storage
        const { data, error } = await supabase.storage
            .from('audio-files')
            .download(filename);
        
        if (error) throw error;
        
        // Set appropriate headers
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=3600');
        
        // Stream the file
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        res.status(200).send(buffer);
    } catch (error) {
        console.error('Error serving audio file:', error);
        res.status(404).json({ error: 'Audio file not found' });
    }
}
