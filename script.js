const clientId = "6f086206832c4dc69d30b26dc990de39";  // Replace with your actual Client ID
const clientSecret = "9fd0ff521c444427b60b0a19650e069f";  // Replace with your actual Client Secret

// Function to Get Spotify Access Token
async function getSpotifyToken() {
    const url = "https://accounts.spotify.com/api/token";

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Authorization": "Basic " + btoa(clientId + ":" + clientSecret),
        },
        body: "grant_type=client_credentials",
    });

    const data = await response.json();
    return data.access_token;  // Returns the token
}

//function for search spotify 
async function searchSpotifySong(songTitle) {
    const token = await getSpotifyToken();  // Get the access token

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(songTitle)}&type=track&limit=1`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
        },
    });

    const data = await response.json();

    if (data.tracks && data.tracks.items.length > 0) {
        return data.tracks.items[0].external_urls.spotify;  // Return Spotify song link
    } else {
        return null;  // No song found
    }
}


// YouTube API Key - Replace with your key
const apiKey =  "AIzaSyAaga13oOSytv1cmdncR4MjajnTuVOsPHc"; 

// Global Variables
let nextPageToken = '';
let isLoading = false;
let currentMood = '';
let currentLanguage = 'all';

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const moodSelect = document.getElementById('mood-select');
const languageSelect = document.getElementById('language-select');
const languageFilter = document.getElementById('language-filter');
const getMusicBtn = document.getElementById('get-music-btn');
const musicGrid = document.getElementById('music-grid');
const loadingSpinner = document.getElementById('loading-spinner');
const loadMoreSpinner = document.getElementById('load-more-spinner');
const welcomeMessage = document.getElementById('welcome-message');
const activeFilters = document.getElementById('active-filters');
const categoryTag = document.getElementById('category-tag');
const languageTag = document.getElementById('language-tag');

// Theme Toggle
themeToggleBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    
    const icon = themeToggleBtn.querySelector('i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    }
});

// Show/Hide Language Filter based on Category
moodSelect.addEventListener('change', () => {
    const selectedMood = moodSelect.value;
    if (selectedMood && selectedMood !== 'bhajan') {
        languageFilter.classList.remove('hidden');
    } else {
        languageFilter.classList.add('hidden');
        languageSelect.value = 'all';
    }
    updateActiveFilters();
});

// Update Active Filters Display
function updateActiveFilters() {
    const mood = moodSelect.value;
    const language = languageSelect.value;

    if (mood || language !== 'all') {
        activeFilters.classList.remove('hidden');
        categoryTag.textContent = mood ? `Category: ${mood}` : '';
        languageTag.textContent = language !== 'all' ? `Language: ${language}` : '';
    } else {
        activeFilters.classList.add('hidden');
    }
}

// Language Filter Change Handler
languageSelect.addEventListener('change', updateActiveFilters);

// Get Music Suggestions
async function getMusicSuggestions(isLoadMore = false) {
    if (isLoading) return;

    const mood = moodSelect.value;

    if (!mood) {
        alert('Please select a category first!');
        return;
    }

    if (!isLoadMore) {
        nextPageToken = '';
        musicGrid.innerHTML = '';
        welcomeMessage.style.display = 'none';
    }

    showLoading(true, isLoadMore);

    try {
        let videos = [];

        // If "Trending" is selected, fetch trending music instead
        if (mood === "trending") {
            videos = await getTrendingMusic();
        } else {
            videos = await getYouTubeMusic(mood, isLoadMore);
        }

        if (videos.length > 0) {
            displayVideos(videos);
        } else if (!isLoadMore) {
            showError('No videos found for this category.');
            welcomeMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to fetch music suggestions. Please try again.');
    } finally {
        showLoading(false, isLoadMore);
    }
}

//Trending Suggestion
async function getTrendingMusic() {
    const trendingUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&chart=mostPopular&videoCategoryId=10&regionCode=IN&maxResults=10&key=${apiKey}`;

    try {
        const response = await fetch(trendingUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch trending music');
        }
        
        const data = await response.json();
        return data.items; // Return trending videos
    } catch (error) {
        console.error('Error fetching trending music:', error);
        showError('Failed to load trending music.');
        return [];
    }
}

// Build Search Query Based on Category and Language
function buildSearchQuery(mood) {
    let query = '';
    
    if (mood === 'bhajan') {
        return 'best popular bhajan songs Hindi';
    }

    const moodQueries = {
        'new': 'new songs 2024',
        'happy': 'happy upbeat songs',
        'sad': 'sad emotional songs',
        'party': 'party dance songs',
        'chill': 'chill relaxing songs'
    };

    query = moodQueries[mood] || `${mood} songs`;

    // Add language filter if not 'all'
    if (currentLanguage !== 'all') {
        query += ` ${currentLanguage}`;
    } else {
        // For 'all', include multiple languages in search
        query += ' Hindi OR Punjabi OR Haryanvi';
    }

    return query;
}

// Display Videos with Language Filter
async function displayVideos(videos) {
    for (const video of videos) {
        const card = document.createElement('div');
        card.className = 'music-card';
        
        const videoTitle = video.snippet.title;
        const spotifyUrl = await searchSpotifySong(videoTitle);
        
        card.innerHTML = `
            <div class="thumbnail-container">
                <img class="thumbnail" 
                     src="${video.snippet.thumbnails.high.url}" 
                     alt="${videoTitle}"
                     loading="lazy">
            </div>
            <div class="card-content">
                <h3 class="video-title">${videoTitle}</h3>
                <p class="channel-name">${video.snippet.channelTitle}</p>
                <div class="button-container">
                    <a href="https://www.youtube.com/watch?v=${video.id.videoId || video.id}" 
                       class="watch-button" 
                       target="_blank" 
                       rel="noopener noreferrer">
                       🎬 Watch on YouTube
                    </a>
                    ${spotifyUrl ? `
                        <a href="${spotifyUrl}" 
                           class="spotify-button" 
                           target="_blank" 
                           rel="noopener noreferrer">
                           🎵 Listen on Spotify
                        </a>
                    ` : ''}
                </div>
            </div>
        `;
        
        musicGrid.appendChild(card);
    }
}
function toggleSpotifyPlayer(button, embedUrl) {
    const container = button.nextElementSibling;
    const iframe = container.querySelector('iframe');
    
    if (container.style.display === 'none') {
        // Show player and load track
        container.style.display = 'block';
        iframe.src = embedUrl;
        button.textContent = '🎵 Stop';
    } else {
        // Hide player and stop track
        container.style.display = 'none';
        iframe.src = '';
        button.textContent = '🎵 Play on Spotify';
    }
}


// Get Music Suggestions
async function getMusicSuggestions(isLoadMore = false) {
    if (isLoading) return;
    
    const mood = moodSelect.value;
    if (!mood) {
        alert('Please select a category first!');
        return;
    }

    if (!isLoadMore) {
        nextPageToken = '';
        musicGrid.innerHTML = '';
        currentMood = mood;
        welcomeMessage.style.display = 'none'; // Hide welcome message when search starts
    }

    showLoading(true, isLoadMore);

    try {
        const videos = await getYouTubeMusic(mood, isLoadMore);
        if (videos.length > 0) {
            displayVideos(videos);
        } else if (!isLoadMore) {
            showError('No videos found for this category.');
            welcomeMessage.style.display = 'block'; // Show welcome message if no results
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to fetch music suggestions. Please try again.');
    } finally {
        showLoading(false, isLoadMore);
    }
}

// Fetch YouTube Music
async function getYouTubeMusic(mood, isLoadMore) {
    let searchQuery = buildSearchQuery(mood);
    
   const baseUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=20&videoDuration=medium&key=${apiKey}`;
    const pageToken = isLoadMore && nextPageToken ? `&pageToken=${nextPageToken}` : '';
    const url = `${baseUrl}&q=${encodeURIComponent(searchQuery)}${pageToken}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
        throw new Error('YouTube API request failed');
    }
    
    const data = await response.json();
    nextPageToken = data.nextPageToken || '';
    return data.items || [];
}

// Build Search Query Based on Category
function buildSearchQuery(mood) {
    let query = '';

    // Define mood-based search terms
    const moodQueries = {
        'new': 'new songs 2024',
        'happy': 'happy upbeat songs',
        'sad': 'sad emotional songs',
        'party': 'party dance songs',
        'chill': 'chill relaxing songs',
        'bhajan': 'best popular bhajan songs'
    };

    // Get the selected language
    const selectedLanguage = languageSelect.value.toLowerCase();

    // Start with mood-based query
    query = moodQueries[mood] || `${mood} songs`;

    // Apply strict language filter
    if (selectedLanguage !== 'all') {
        query += ` ${selectedLanguage}`;
    }

    return query;
}


// Infinite Scroll Handler
function handleScroll() {
    if (isLoading) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const bodyHeight = document.documentElement.scrollHeight;
    
    // Load more content when user is near bottom
    if (bodyHeight - scrollPosition < 1000 && nextPageToken) {
        getMusicSuggestions(true);
    }
}

// Loading State
function showLoading(show, isLoadMore = false) {
    isLoading = show;
    const spinner = isLoadMore ? loadMoreSpinner : loadingSpinner;
    spinner.classList.toggle('hidden', !show);
}

// Error Display
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    musicGrid.appendChild(errorDiv);
}

// Event Listeners
getMusicBtn.addEventListener('click', () => getMusicSuggestions(false));
window.addEventListener('scroll', handleScroll);

// Initial theme check
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('light-mode');
    themeToggleBtn.querySelector('i').classList.replace('fa-moon', 'fa-sun');
}

