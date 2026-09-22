/* ==========================================================================
   MELODYHUB - MODERN MUSIC PLAYER SCRIPT
   Pure Vanilla JavaScript Implementation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. SONG DATASET
    // ----------------------------------------------------------------------
    const initialSongs = [
        {
            id: 1,
            title: "A Brighter Tomorrow",
            artist: "Daniel Levi",
            duration: "3:56",
            src: "assets/music/song1.mp3",
            image: "assets/images/song1.jpg",
            genre: "Pop",
            favorite: false
        },
        {
            id: 2,
            title: "Lost in the City",
            artist: "Mia Chen",
            duration: "4:12",
            src: "assets/music/song2.mp3",
            image: "assets/images/song2.jpg",
            genre: "Lo-fi",
            favorite: false
        },
        {
            id: 3,
            title: "Ocean Waves",
            artist: "The Sunsets",
            duration: "3:28",
            src: "assets/music/song3.mp3",
            image: "assets/images/song3.jpg",
            genre: "Lo-fi",
            favorite: false
        },
        {
            id: 4,
            title: "Midnight Drive",
            artist: "Arko",
            duration: "4:05",
            src: "assets/music/song4.mp3",
            image: "assets/images/song4.jpg",
            genre: "EDM",
            favorite: false
        },
        {
            id: 5,
            title: "Falling Stars",
            artist: "Luna Sky",
            duration: "3:44",
            src: "assets/music/song5.mp3",
            image: "assets/images/song5.jpg",
            genre: "Classical",
            favorite: false
        },
        {
            id: 6,
            title: "Better Days",
            artist: "Neon Heights",
            duration: "4:20",
            src: "assets/music/song6.mp3",
            image: "assets/images/song6.jpg",
            genre: "Rock",
            favorite: false
        },
        {
            id: 7,
            title: "Chasing Dreams",
            artist: "Alex Rivers",
            duration: "3:18",
            src: "assets/music/song7.mp3",
            image: "assets/images/song7.jpg",
            genre: "Hip Hop",
            favorite: false
        }
    ];

    // Load custom songs or favorites from LocalStorage
    let songs = loadStoredSongs(initialSongs);
    let favorites = new Set(JSON.parse(localStorage.getItem('melodyhub_favs') || '[]'));
    let recentlyPlayed = JSON.parse(localStorage.getItem('melodyhub_recents') || '[]');

    // Synchronize favorite flag in objects
    songs.forEach(s => {
        if (favorites.has(s.id)) s.favorite = true;
    });

    // Player State Variables
    let currentSongIndex = 0;
    let isPlaying = false;
    let isShuffle = false;
    let repeatMode = 0; // 0 = off, 1 = repeat all, 2 = repeat one
    let filteredSongs = [...songs];
    let activeFilter = { type: 'all', value: 'all' };

    // Audio Instance
    const audio = new Audio();
    audio.volume = 0.7;
    let isMuted = false;
    let previousVolume = 0.7;

    // Web Audio Synthesizer Fallback for complete robustness
    let audioCtx = null;
    let synthOscillator = null;
    let synthGain = null;
    let isSynthMode = false;
    let synthTimer = null;
    let synthCurrentTime = 0;

    // ----------------------------------------------------------------------
    // 2. DOM ELEMENTS
    // ----------------------------------------------------------------------
    const playerAlbumArt = document.getElementById('player-album-art');
    const artworkGlow = document.getElementById('artwork-glow');
    const playerSongTitle = document.getElementById('player-song-title');
    const playerArtist = document.getElementById('player-artist');
    const favoriteBtn = document.getElementById('favorite-btn');

    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');
    const progressBar = document.getElementById('progress-bar');
    const progressFill = document.getElementById('progress-fill');

    const playBtn = document.getElementById('play-btn');
    const playIcon = playBtn.querySelector('.play-icon');
    const pauseIcon = playBtn.querySelector('.pause-icon');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const shuffleBtn = document.getElementById('shuffle-btn');
    const repeatBtn = document.getElementById('repeat-btn');
    const repeatBadge = repeatBtn.querySelector('.repeat-one-badge');

    const muteBtn = document.getElementById('mute-btn');
    const volumeHighIcon = muteBtn.querySelector('.volume-high-icon');
    const volumeMuteIcon = muteBtn.querySelector('.volume-mute-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeFill = document.getElementById('volume-fill');
    const volumePercentage = document.getElementById('volume-percentage');

    const searchInput = document.getElementById('search-input');
    const searchClearBtn = document.getElementById('search-clear-btn');

    const playlistContainer = document.getElementById('playlist-container');
    const filterLabelText = document.getElementById('filter-label-text');
    const resetFilterBtn = document.getElementById('reset-filter-btn');
    const emptyPlaylistMsg = document.getElementById('empty-playlist-msg');
    const emptyResetBtn = document.getElementById('empty-reset-btn');

    const themeToggleBtn = document.getElementById('theme-toggle');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const sidebar = document.getElementById('sidebar');

    const addSongBtn = document.getElementById('add-song-btn');
    const addSongModal = document.getElementById('add-song-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const addSongForm = document.getElementById('add-song-form');

    const navHome = document.getElementById('nav-home');
    const navPlaylist = document.getElementById('nav-playlist');
    const navAbout = document.getElementById('nav-about');
    const aboutModal = document.getElementById('about-modal');
    const aboutCloseBtn = document.getElementById('about-close-btn');

    // ----------------------------------------------------------------------
    // 3. INITIALIZATION
    // ----------------------------------------------------------------------
    function init() {
        renderPlaylist();
        loadSong(currentSongIndex, false);
        updateVolumeUI();
        setupEventListeners();
    }

    // Load song details into UI
    function loadSong(index, shouldPlay = false) {
        if (filteredSongs.length === 0) return;
        
        if (index < 0) index = filteredSongs.length - 1;
        if (index >= filteredSongs.length) index = 0;

        currentSongIndex = index;
        const song = filteredSongs[currentSongIndex];

        // Update UI
        playerAlbumArt.src = song.image;
        artworkGlow.style.backgroundImage = `url('${song.image}')`;
        playerSongTitle.textContent = song.title;
        playerArtist.textContent = song.artist;
        totalDurationEl.textContent = song.duration || "0:00";

        // Update Favorite status
        if (song.favorite || favorites.has(song.id)) {
            favoriteBtn.classList.add('active');
        } else {
            favoriteBtn.classList.remove('active');
        }

        // Reset progress bar
        progressBar.value = 0;
        progressFill.style.width = '0%';
        currentTimeEl.textContent = "0:00";

        // Load Audio
        isSynthMode = false;
        audio.src = song.src;

        if (shouldPlay) {
            playSong();
        } else {
            pauseSong();
        }

        renderPlaylist();
    }

    // Play Audio
    function playSong() {
        isPlaying = true;
        playIcon.classList.add('hidden');
        pauseIcon.classList.remove('hidden');

        // Track recently played
        const currentSong = filteredSongs[currentSongIndex];
        if (currentSong) {
            addToRecentlyPlayed(currentSong.id);
        }

        if (isSynthMode) {
            startSynthPlayback();
            return;
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(err => {
                console.warn('HTML5 Audio playback interrupted or file missing, initiating synth fallback:', err);
                initSynthPlayback();
            });
        }
    }

    // Pause Audio
    function pauseSong() {
        isPlaying = false;
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');

        if (isSynthMode) {
            stopSynthPlayback();
        } else {
            audio.pause();
        }
        renderPlaylist();
    }

    // Toggle Play/Pause
    function togglePlay() {
        if (isPlaying) {
            pauseSong();
        } else {
            playSong();
        }
    }

    // Next Song
    function nextSong() {
        if (filteredSongs.length === 0) return;

        if (isShuffle) {
            let randomIndex = Math.floor(Math.random() * filteredSongs.length);
            if (filteredSongs.length > 1 && randomIndex === currentSongIndex) {
                randomIndex = (currentSongIndex + 1) % filteredSongs.length;
            }
            loadSong(randomIndex, true);
        } else {
            let nextIndex = currentSongIndex + 1;
            if (nextIndex >= filteredSongs.length) {
                nextIndex = 0;
            }
            loadSong(nextIndex, true);
        }
    }

    // Previous Song
    function prevSong() {
        if (filteredSongs.length === 0) return;

        // If played more than 3 seconds, restart song
        if (audio.currentTime > 3 || (isSynthMode && synthCurrentTime > 3)) {
            if (isSynthMode) synthCurrentTime = 0;
            else audio.currentTime = 0;
            return;
        }

        let prevIndex = currentSongIndex - 1;
        if (prevIndex < 0) {
            prevIndex = filteredSongs.length - 1;
        }
        loadSong(prevIndex, true);
    }

    // Toggle Shuffle
    function toggleShuffle() {
        isShuffle = !isShuffle;
        shuffleBtn.classList.toggle('active', isShuffle);
        showToast(isShuffle ? "Shuffle On" : "Shuffle Off");
    }

    // Toggle Repeat Mode (0 -> 1 -> 2 -> 0)
    function toggleRepeat() {
        repeatMode = (repeatMode + 1) % 3;
        if (repeatMode === 0) {
            repeatBtn.classList.remove('active');
            repeatBadge.classList.add('hidden');
            showToast("Repeat Off");
        } else if (repeatMode === 1) {
            repeatBtn.classList.add('active');
            repeatBadge.classList.add('hidden');
            showToast("Repeat All");
        } else {
            repeatBtn.classList.add('active');
            repeatBadge.classList.remove('hidden');
            showToast("Repeat One");
        }
    }

    // ----------------------------------------------------------------------
    // 4. PROGRESS & SEEKING
    // ----------------------------------------------------------------------
    function updateProgress() {
        if (!isPlaying) return;

        let curTime = 0;
        let dur = 0;

        if (isSynthMode) {
            curTime = synthCurrentTime;
            dur = parseDurationSeconds(filteredSongs[currentSongIndex]?.duration || "3:30");
        } else {
            curTime = audio.currentTime;
            dur = audio.duration;
        }

        if (isNaN(dur) || dur === 0) return;

        const percent = (curTime / dur) * 100;
        progressBar.value = percent;
        progressFill.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime(curTime);
        totalDurationEl.textContent = formatTime(dur);
    }

    function setProgress(e) {
        const percent = parseFloat(e.target.value);
        let dur = 0;

        if (isSynthMode) {
            dur = parseDurationSeconds(filteredSongs[currentSongIndex]?.duration || "3:30");
            synthCurrentTime = (percent / 100) * dur;
        } else if (audio.duration) {
            dur = audio.duration;
            audio.currentTime = (percent / 100) * dur;
        }

        progressFill.style.width = `${percent}%`;
        currentTimeEl.textContent = formatTime((percent / 100) * dur);
    }

    // ----------------------------------------------------------------------
    // 5. VOLUME & MUTE CONTROL
    // ----------------------------------------------------------------------
    function handleVolumeChange(e) {
        const val = parseFloat(e.target.value);
        audio.volume = val / 100;
        if (synthGain) synthGain.gain.value = (val / 100) * 0.1;

        isMuted = val === 0;
        updateVolumeUI();
    }

    function toggleMute() {
        if (isMuted) {
            audio.volume = previousVolume;
            volumeSlider.value = previousVolume * 100;
            isMuted = false;
        } else {
            previousVolume = audio.volume > 0 ? audio.volume : 0.7;
            audio.volume = 0;
            volumeSlider.value = 0;
            isMuted = true;
        }
        updateVolumeUI();
    }

    function updateVolumeUI() {
        const val = volumeSlider.value;
        volumeFill.style.width = `${val}%`;
        volumePercentage.textContent = `${Math.round(val)}%`;

        if (val == 0 || isMuted) {
            volumeHighIcon.classList.add('hidden');
            volumeMuteIcon.classList.remove('hidden');
        } else {
            volumeHighIcon.classList.remove('hidden');
            volumeMuteIcon.classList.add('hidden');
        }
    }

    // ----------------------------------------------------------------------
    // 6. FAVORITES & RECENTLY PLAYED
    // ----------------------------------------------------------------------
    function toggleFavoriteCurrent() {
        const song = filteredSongs[currentSongIndex];
        if (!song) return;

        toggleFavoriteById(song.id);
    }

    function toggleFavoriteById(songId) {
        const targetSong = songs.find(s => s.id === songId);
        if (!targetSong) return;

        if (favorites.has(songId)) {
            favorites.delete(songId);
            targetSong.favorite = false;
            showToast(`Removed "${targetSong.title}" from Favorites`);
        } else {
            favorites.add(songId);
            targetSong.favorite = true;
            showToast(`Added "${targetSong.title}" to Favorites`);
        }

        localStorage.setItem('melodyhub_favs', JSON.stringify([...favorites]));

        // Update favorite button if current song
        const currentSong = filteredSongs[currentSongIndex];
        if (currentSong && currentSong.id === songId) {
            favoriteBtn.classList.toggle('active', favorites.has(songId));
        }

        renderPlaylist();

        // If currently viewing favorites, refresh filter
        if (activeFilter.type === 'favorites') {
            applyFilter('favorites', 'Favorites');
        }
    }

    function addToRecentlyPlayed(songId) {
        recentlyPlayed = recentlyPlayed.filter(id => id !== songId);
        recentlyPlayed.unshift(songId);
        if (recentlyPlayed.length > 20) recentlyPlayed.pop();

        localStorage.setItem('melodyhub_recents', JSON.stringify(recentlyPlayed));
    }

    // ----------------------------------------------------------------------
    // 7. RENDER PLAYLIST & FILTERING
    // ----------------------------------------------------------------------
    function renderPlaylist() {
        playlistContainer.innerHTML = '';

        if (filteredSongs.length === 0) {
            emptyPlaylistMsg.classList.remove('hidden');
            return;
        } else {
            emptyPlaylistMsg.classList.add('hidden');
        }

        filteredSongs.forEach((song, idx) => {
            const isCurrent = idx === currentSongIndex;

            const item = document.createElement('div');
            item.className = `playlist-item ${isCurrent ? 'active' : ''} ${isCurrent && !isPlaying ? 'paused' : ''}`;
            item.setAttribute('data-id', song.id);

            item.innerHTML = `
                <img src="${song.image}" alt="${song.title}" class="item-art-thumb">
                <div class="item-info">
                    <div class="item-title">${escapeHtml(song.title)}</div>
                    <div class="item-artist">${escapeHtml(song.artist)} • ${escapeHtml(song.genre)}</div>
                </div>
                <div class="item-meta">
                    ${isCurrent ? `
                        <div class="equalizer-icon" title="Playing">
                            <span class="equalizer-bar"></span>
                            <span class="equalizer-bar"></span>
                            <span class="equalizer-bar"></span>
                        </div>
                    ` : `
                        <span class="item-duration">${song.duration}</span>
                    `}
                    <button class="favorite-toggle-btn ${song.favorite || favorites.has(song.id) ? 'active' : ''}" data-fav-id="${song.id}" title="Toggle Favorite">
                        <svg class="heart-icon" viewBox="0 0 24 24" width="16" height="16">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                        </svg>
                    </button>
                </div>
            `;

            // Click item to play
            item.addEventListener('click', (e) => {
                // If clicked favorite heart button inside playlist item
                const favBtn = e.target.closest('[data-fav-id]');
                if (favBtn) {
                    e.stopPropagation();
                    const songId = parseInt(favBtn.getAttribute('data-fav-id'));
                    toggleFavoriteById(songId);
                    return;
                }

                loadSong(idx, true);
            });

            playlistContainer.appendChild(item);
        });
    }

    function applyFilter(type, label, val = null) {
        activeFilter = { type, value: val || type };

        // Reset active sidebar highlights
        document.querySelectorAll('.sidebar-item, .genre-item').forEach(el => el.classList.remove('active'));

        if (type === 'all') {
            filteredSongs = [...songs];
            document.getElementById('menu-all-songs')?.classList.add('active');
            filterLabelText.textContent = "Showing All Songs";
            resetFilterBtn.classList.add('hidden');
        } else if (type === 'favorites') {
            filteredSongs = songs.filter(s => favorites.has(s.id));
            document.getElementById('menu-favorites')?.classList.add('active');
            filterLabelText.textContent = "Showing Favorites";
            resetFilterBtn.classList.remove('hidden');
        } else if (type === 'recent') {
            filteredSongs = recentlyPlayed.map(id => songs.find(s => s.id === id)).filter(Boolean);
            document.getElementById('menu-recently-played')?.classList.add('active');
            filterLabelText.textContent = "Showing Recently Played";
            resetFilterBtn.classList.remove('hidden');
        } else if (type === 'my-playlist') {
            filteredSongs = [...songs];
            document.getElementById('menu-my-playlist')?.classList.add('active');
            filterLabelText.textContent = "Showing My Playlist";
            resetFilterBtn.classList.add('hidden');
        } else if (type === 'genre') {
            filteredSongs = songs.filter(s => s.genre.toLowerCase() === val.toLowerCase());
            const genreItem = document.querySelector(`.genre-item[data-genre="${val}"]`);
            if (genreItem) genreItem.classList.add('active');
            filterLabelText.textContent = `Genre: ${val}`;
            resetFilterBtn.classList.remove('hidden');
        } else if (type === 'search') {
            const query = val.toLowerCase().trim();
            filteredSongs = songs.filter(s => 
                s.title.toLowerCase().includes(query) ||
                s.artist.toLowerCase().includes(query) ||
                s.genre.toLowerCase().includes(query)
            );
            filterLabelText.textContent = `Search: "${val}"`;
            resetFilterBtn.classList.remove('hidden');
        }

        currentSongIndex = 0;
        renderPlaylist();
        if (filteredSongs.length > 0) {
            loadSong(0, isPlaying);
        }
    }

    function handleSearchInput(e) {
        const query = e.target.value;
        if (query.trim() !== '') {
            searchClearBtn.classList.remove('hidden');
            applyFilter('search', 'Search', query);
        } else {
            searchClearBtn.classList.add('hidden');
            applyFilter('all', 'All Songs');
        }
    }

    // ----------------------------------------------------------------------
    // 8. ADD SONG MODAL & FORM
    // ----------------------------------------------------------------------
    function openAddSongModal() {
        addSongModal.classList.remove('hidden');
    }

    function closeAddSongModal() {
        addSongModal.classList.add('hidden');
        addSongForm.reset();
    }

    function handleAddSongSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('song-title-input').value.trim();
        const artist = document.getElementById('song-artist-input').value.trim();
        const genre = document.getElementById('song-genre-input').value;
        const audioFile = document.getElementById('song-audio-file').files[0];
        const audioUrlInput = document.getElementById('song-audio-url').value.trim();
        const imageFile = document.getElementById('song-image-file').files[0];
        const imageUrlInput = document.getElementById('song-image-url').value.trim();

        if (!title || !artist) return;

        let src = audioUrlInput || 'assets/music/song1.mp3';
        if (audioFile) {
            src = URL.createObjectURL(audioFile);
        }

        let image = imageUrlInput || 'assets/images/song1.jpg';
        if (imageFile) {
            image = URL.createObjectURL(imageFile);
        }

        const newSong = {
            id: Date.now(),
            title,
            artist,
            duration: "3:30",
            src,
            image,
            genre,
            favorite: false
        };

        songs.push(newSong);
        saveCustomSongs(songs);
        closeAddSongModal();

        showToast(`Added "${newSong.title}" to library!`);
        applyFilter('all', 'All Songs');
        
        // Play the newly added song
        const newIndex = filteredSongs.findIndex(s => s.id === newSong.id);
        if (newIndex !== -1) {
            loadSong(newIndex, true);
        }
    }

    // ----------------------------------------------------------------------
    // 9. WEB AUDIO API SYNTHESIZER FALLBACK
    // ----------------------------------------------------------------------
    function initSynthPlayback() {
        if (!audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioCtx();
        }

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        isSynthMode = true;
        startSynthPlayback();
    }

    function startSynthPlayback() {
        if (!isSynthMode || !audioCtx) return;

        stopSynthPlayback();

        synthOscillator = audioCtx.createOscillator();
        synthGain = audioCtx.createGain();

        // Harmonious chord notes based on song ID
        const currentSong = filteredSongs[currentSongIndex];
        const freqMap = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
        const freq = freqMap[(currentSong?.id || 1) % freqMap.length];

        synthOscillator.type = 'sine';
        synthOscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);

        synthGain.gain.setValueAtTime((audio.volume || 0.7) * 0.1, audioCtx.currentTime);

        synthOscillator.connect(synthGain);
        synthGain.connect(audioCtx.destination);

        synthOscillator.start();

        if (!synthTimer) {
            synthTimer = setInterval(() => {
                if (isPlaying && isSynthMode) {
                    synthCurrentTime += 0.2;
                    updateProgress();

                    const durSec = parseDurationSeconds(filteredSongs[currentSongIndex]?.duration || "3:30");
                    if (synthCurrentTime >= durSec) {
                        handleSongEnded();
                    }
                }
            }, 200);
        }
    }

    function stopSynthPlayback() {
        if (synthOscillator) {
            try { synthOscillator.stop(); } catch(e){}
            synthOscillator.disconnect();
            synthOscillator = null;
        }
    }

    // ----------------------------------------------------------------------
    // 10. AUDIO EVENT HANDLERS
    // ----------------------------------------------------------------------
    audio.addEventListener('timeupdate', updateProgress);

    audio.addEventListener('loadedmetadata', () => {
        totalDurationEl.textContent = formatTime(audio.duration);
    });

    audio.addEventListener('ended', handleSongEnded);

    audio.addEventListener('error', (e) => {
        console.warn('Audio element error, switching to synthetic playback mode:', e);
        if (isPlaying) {
            initSynthPlayback();
        }
    });

    function handleSongEnded() {
        if (repeatMode === 2) {
            // Repeat one
            if (isSynthMode) synthCurrentTime = 0;
            else audio.currentTime = 0;
            playSong();
        } else if (repeatMode === 1 && currentSongIndex === filteredSongs.length - 1 && !isShuffle) {
            // Repeat all at end
            loadSong(0, true);
        } else {
            nextSong();
        }
    }

    // ----------------------------------------------------------------------
    // 11. EVENT LISTENERS SETUP
    // ----------------------------------------------------------------------
    function setupEventListeners() {
        // Controls
        playBtn.addEventListener('click', togglePlay);
        nextBtn.addEventListener('click', nextSong);
        prevBtn.addEventListener('click', prevSong);
        shuffleBtn.addEventListener('click', toggleShuffle);
        repeatBtn.addEventListener('click', toggleRepeat);

        // Favorite & Volume
        favoriteBtn.addEventListener('click', toggleFavoriteCurrent);
        progressBar.addEventListener('input', setProgress);
        volumeSlider.addEventListener('input', handleVolumeChange);
        muteBtn.addEventListener('click', toggleMute);

        // Search
        searchInput.addEventListener('input', handleSearchInput);
        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchClearBtn.classList.add('hidden');
            applyFilter('all', 'All Songs');
        });

        // Sidebar Navigation
        document.getElementById('menu-all-songs').addEventListener('click', () => applyFilter('all', 'All Songs'));
        document.getElementById('menu-favorites').addEventListener('click', () => applyFilter('favorites', 'Favorites'));
        document.getElementById('menu-recently-played').addEventListener('click', () => applyFilter('recent', 'Recently Played'));
        document.getElementById('menu-my-playlist').addEventListener('click', () => applyFilter('my-playlist', 'My Playlist'));

        // Genre buttons
        document.querySelectorAll('.genre-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const genre = btn.getAttribute('data-genre');
                applyFilter('genre', `Genre: ${genre}`, genre);
            });
        });

        resetFilterBtn.addEventListener('click', () => applyFilter('all', 'All Songs'));
        emptyResetBtn.addEventListener('click', () => applyFilter('all', 'All Songs'));

        // Modals
        addSongBtn.addEventListener('click', openAddSongModal);
        modalCloseBtn.addEventListener('click', closeAddSongModal);
        modalCancelBtn.addEventListener('click', closeAddSongModal);
        addSongForm.addEventListener('submit', handleAddSongSubmit);

        // Header Navigation
        navHome.addEventListener('click', () => {
            setActiveNav(navHome);
            applyFilter('all', 'All Songs');
        });
        navPlaylist.addEventListener('click', () => {
            setActiveNav(navPlaylist);
            document.getElementById('playlist-panel')?.scrollIntoView({ behavior: 'smooth' });
        });
        navAbout.addEventListener('click', () => {
            aboutModal.classList.remove('hidden');
        });
        aboutCloseBtn.addEventListener('click', () => {
            aboutModal.classList.add('hidden');
        });

        // Theme Toggle
        themeToggleBtn.addEventListener('click', toggleTheme);

        // Mobile Menu Toggle
        mobileMenuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Keyboard Controls
        window.addEventListener('keydown', handleKeyboardShortcuts);
    }

    function setActiveNav(activeBtn) {
        [navHome, navPlaylist, navAbout].forEach(btn => btn.classList.remove('active'));
        activeBtn.classList.add('active');
    }

    function toggleTheme() {
        const isLight = document.body.classList.toggle('light-theme');
        document.body.classList.toggle('dark-theme', !isLight);
        localStorage.setItem('melodyhub_theme', isLight ? 'light' : 'dark');
        showToast(`Theme switched to ${isLight ? 'Light' : 'Dark'} Mode`);
    }

    // Keyboard Shortcuts
    function handleKeyboardShortcuts(e) {
        // Prevent shortcuts when user is typing in form inputs
        const activeTag = document.activeElement.tagName.toLowerCase();
        if (activeTag === 'input' || activeTag === 'select' || activeTag === 'textarea') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                togglePlay();
                break;
            case 'ArrowRight':
                e.preventDefault();
                if (e.shiftKey) {
                    // Seek forward 5s
                    if (isSynthMode) synthCurrentTime += 5;
                    else audio.currentTime = Math.min(audio.duration || 0, audio.currentTime + 5);
                } else {
                    nextSong();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (e.shiftKey) {
                    // Seek backward 5s
                    if (isSynthMode) synthCurrentTime = Math.max(0, synthCurrentTime - 5);
                    else audio.currentTime = Math.max(0, audio.currentTime - 5);
                } else {
                    prevSong();
                }
                break;
            case 'ArrowUp':
                e.preventDefault();
                volumeSlider.value = Math.min(100, parseInt(volumeSlider.value) + 5);
                handleVolumeChange({ target: volumeSlider });
                break;
            case 'ArrowDown':
                e.preventDefault();
                volumeSlider.value = Math.max(0, parseInt(volumeSlider.value) - 5);
                handleVolumeChange({ target: volumeSlider });
                break;
            case 'KeyM':
                toggleMute();
                break;
            case 'KeyS':
                toggleShuffle();
                break;
            case 'KeyR':
                toggleRepeat();
                break;
        }
    }

    // ----------------------------------------------------------------------
    // 12. UTILITY FUNCTIONS
    // ----------------------------------------------------------------------
    function formatTime(seconds) {
        if (isNaN(seconds) || seconds < 0) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    function parseDurationSeconds(durationStr) {
        if (!durationStr) return 210;
        const parts = durationStr.split(':');
        if (parts.length === 2) {
            return parseInt(parts[0]) * 60 + parseInt(parts[1]);
        }
        return 210;
    }

    function showToast(message) {
        const toastContainer = document.getElementById('toast-container');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>🎵</span> <span>${escapeHtml(message)}</span>`;

        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2500);
    }

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }

    function loadStoredSongs(defaults) {
        const custom = localStorage.getItem('melodyhub_custom_songs');
        if (custom) {
            try {
                const parsed = JSON.parse(custom);
                return [...defaults, ...parsed];
            } catch (e) {
                console.error('Failed to parse custom songs:', e);
            }
        }
        return defaults;
    }

    function saveCustomSongs(allSongs) {
        const custom = allSongs.filter(s => s.id > 100);
        localStorage.setItem('melodyhub_custom_songs', JSON.stringify(custom));
    }

    // Restore stored theme if set
    const savedTheme = localStorage.getItem('melodyhub_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
    }

    // Initialize Application
    init();
});
