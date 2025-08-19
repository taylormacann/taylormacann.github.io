class VideoEditor {
    constructor() {
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.isPlaying = false;
        this.currentFilter = 'none';
        this.textOverlays = [];
        this.trimStart = 0;
        this.trimEnd = 0;
        this.volume = 1;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupCanvas();
    }

    setupEventListeners() {
        // File upload
        const videoInput = document.getElementById('video-input');
        const uploadZone = document.getElementById('upload-zone');

        videoInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.loadVideo(files[0]);
            }
        });

        uploadZone.addEventListener('click', () => {
            videoInput.click();
        });

        // Video controls
        document.getElementById('play-pause-btn').addEventListener('click', () => this.togglePlayPause());
        
        // Timeline
        const timeline = document.getElementById('timeline');
        timeline.addEventListener('click', (e) => this.seekVideo(e));

        // Trim controls
        document.getElementById('trim-start').addEventListener('input', (e) => {
            this.trimStart = parseFloat(e.target.value);
        });

        document.getElementById('trim-end').addEventListener('input', (e) => {
            this.trimEnd = parseFloat(e.target.value);
        });

        document.getElementById('auto-trim-btn').addEventListener('click', () => this.autoTrim());

        // Filter controls
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyFilter(e.target.dataset.filter));
        });

        document.getElementById('auto-enhance-btn').addEventListener('click', () => this.autoEnhance());

        // Text overlay
        document.getElementById('add-text-btn').addEventListener('click', () => this.addTextOverlay());

        // Audio controls
        const volumeSlider = document.getElementById('volume-slider');
        volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));

        document.getElementById('auto-balance-btn').addEventListener('click', () => this.autoBalanceAudio());

        // Export
        document.getElementById('export-btn').addEventListener('click', () => this.exportVideo());

        // Modal controls
        document.getElementById('close-success-btn').addEventListener('click', () => {
            document.getElementById('success-modal').style.display = 'none';
        });

        document.getElementById('download-btn').addEventListener('click', () => this.downloadVideo());
    }

    setupCanvas() {
        this.canvas = document.getElementById('video-canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadVideo(file);
        }
    }

    loadVideo(file) {
        // Validate file size (500MB limit)
        if (file.size > 500 * 1024 * 1024) {
            alert('File size must be less than 500MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('video/')) {
            alert('Please select a valid video file');
            return;
        }

        const url = URL.createObjectURL(file);
        this.video = document.getElementById('video-player');
        this.video.src = url;

        // Setup video event listeners
        this.video.addEventListener('loadedmetadata', () => {
            this.onVideoLoaded();
        });

        this.video.addEventListener('timeupdate', () => {
            this.updateTimeline();
        });

        this.video.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayButton();
        });

        // Show editor section
        document.getElementById('upload-section').style.display = 'none';
        document.getElementById('editor-section').style.display = 'block';
    }

    onVideoLoaded() {
        const duration = this.video.duration;
        this.trimEnd = duration;
        
        // Update UI
        document.getElementById('trim-end').value = duration.toFixed(1);
        document.getElementById('trim-end').max = duration;
        document.getElementById('trim-start').max = duration;
        document.getElementById('total-time').textContent = this.formatTime(duration);
        
        // Setup canvas dimensions
        this.canvas.width = this.video.videoWidth;
        this.canvas.height = this.video.videoHeight;

        // Enable export button
        document.getElementById('export-btn').disabled = false;
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.video.pause();
            this.isPlaying = false;
        } else {
            this.video.play();
            this.isPlaying = true;
        }
        this.updatePlayButton();
    }

    updatePlayButton() {
        const btn = document.getElementById('play-pause-btn');
        const icon = btn.querySelector('i');
        icon.className = this.isPlaying ? 'fas fa-pause' : 'fas fa-play';
    }

    seekVideo(e) {
        const timeline = document.getElementById('timeline');
        const rect = timeline.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newTime = percent * this.video.duration;
        this.video.currentTime = newTime;
    }

    updateTimeline() {
        const progress = (this.video.currentTime / this.video.duration) * 100;
        document.getElementById('timeline-progress').style.width = progress + '%';
        document.getElementById('timeline-handle').style.left = progress + '%';
        document.getElementById('current-time').textContent = this.formatTime(this.video.currentTime);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    applyFilter(filter) {
        this.currentFilter = filter;
        
        // Update active button
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');

        // Apply filter styles to video
        const filters = {
            none: '',
            bright: 'brightness(1.3)',
            contrast: 'contrast(1.4)',
            vintage: 'sepia(0.5) saturate(1.2)',
            bw: 'grayscale(1)',
            sepia: 'sepia(1)'
        };

        this.video.style.filter = filters[filter] || '';
    }

    autoTrim() {
        // Simple auto-trim: remove first and last 10% of video
        const duration = this.video.duration;
        const start = duration * 0.1;
        const end = duration * 0.9;
        
        this.trimStart = start;
        this.trimEnd = end;
        
        document.getElementById('trim-start').value = start.toFixed(1);
        document.getElementById('trim-end').value = end.toFixed(1);
        
        this.showNotification('Auto-trim applied: removed first and last 10%');
    }

    autoEnhance() {
        // Apply automatic enhancement (brightness + contrast)
        this.applyFilter('bright');
        this.showNotification('Auto-enhancement applied');
    }

    addTextOverlay() {
        const text = document.getElementById('overlay-text').value;
        const fontSize = document.getElementById('font-size').value;
        const color = document.getElementById('text-color').value;

        if (!text.trim()) {
            alert('Please enter text for the overlay');
            return;
        }

        const overlay = {
            text: text,
            fontSize: parseInt(fontSize),
            color: color,
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            startTime: this.video.currentTime,
            endTime: this.video.currentTime + 5 // 5 seconds duration
        };

        this.textOverlays.push(overlay);
        document.getElementById('overlay-text').value = '';
        
        this.showNotification(`Text overlay "${text}" added`);
    }

    setVolume(value) {
        this.volume = value / 100;
        this.video.volume = this.volume;
        document.getElementById('volume-value').textContent = value + '%';
    }

    autoBalanceAudio() {
        // Set optimal volume (80%)
        this.setVolume(80);
        document.getElementById('volume-slider').value = 80;
        this.showNotification('Audio auto-balanced to 80%');
    }

    async exportVideo() {
        this.showProcessingModal();
        
        try {
            // Simulate processing time
            await this.processVideo();
            
            this.hideProcessingModal();
            this.showSuccessModal();
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed. Please try again.');
            this.hideProcessingModal();
        }
    }

    async processVideo() {
        const steps = [
            'Applying filters...',
            'Processing text overlays...',
            'Adjusting audio...',
            'Trimming video...',
            'Finalizing export...'
        ];

        for (let i = 0; i < steps.length; i++) {
            document.getElementById('progress-text').textContent = steps[i];
            document.getElementById('progress-fill').style.width = ((i + 1) / steps.length) * 100 + '%';
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Create processed video blob (simplified)
        this.processedVideoBlob = await this.createVideoBlob();
    }

    async createVideoBlob() {
        // In a real implementation, you would use WebCodecs API or similar
        // For demo purposes, we'll create a simple blob
        return new Promise((resolve) => {
            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;
            
            // Draw current frame with effects
            this.ctx.filter = this.video.style.filter;
            this.ctx.drawImage(this.video, 0, 0);
            
            // Draw text overlays
            this.textOverlays.forEach(overlay => {
                if (this.video.currentTime >= overlay.startTime && 
                    this.video.currentTime <= overlay.endTime) {
                    this.ctx.font = `${overlay.fontSize}px Inter`;
                    this.ctx.fillStyle = overlay.color;
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(overlay.text, overlay.x, overlay.y);
                }
            });
            
            this.canvas.toBlob(resolve, 'image/jpeg', 0.8);
        });
    }

    downloadVideo() {
        // In a real implementation, you would download the processed video
        // For demo purposes, we'll create a sample file
        const link = document.createElement('a');
        link.href = this.video.src;
        link.download = 'edited-video.mp4';
        link.click();
        
        this.showNotification('Video download started');
    }

    showProcessingModal() {
        document.getElementById('processing-modal').style.display = 'flex';
        document.getElementById('progress-fill').style.width = '0%';
    }

    hideProcessingModal() {
        document.getElementById('processing-modal').style.display = 'none';
    }

    showSuccessModal() {
        document.getElementById('success-modal').style.display = 'flex';
    }

    showNotification(message) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #27ae60;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            z-index: 1001;
            animation: slideIn 0.3s ease-out;
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Add notification animation CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// Initialize the video editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new VideoEditor();
});

// Service Worker registration for offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}