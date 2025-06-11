document.addEventListener('DOMContentLoaded', function() {
    const API_KEY = 'AIzaSyAI0Cxih1zjrX7o4wQnW68NCMBVFqztK-A'; // Your YouTube API Key
    const CHANNEL_ID = 'UCDwGOo8zxlGaXMpA4pmIHdA'; // Your YouTube Channel ID

    // Playlist ID for your curated "Latest Videos" (excluding shorts)
    // This will now be used directly for the 'videosContainer'
    const LATEST_VIDEOS_PLAYLIST_ID = 'PLS15hKH3nTjlw51NsU8PFGcezq0jpoNUh'; 

    // Optional: If you have a dedicated public playlist for your Shorts, enter its ID here.
    const SHORTS_PLAYLIST_ID = 'PLS15hKH3nTjkQGKa_MybUL8Wr4ykyHT35'; 

    const shortsContainer = document.getElementById('shorts-grid');
    const videosContainer = document.getElementById('videos-grid');
    const popularContainer = document.getElementById('popular-grid');

    const maxResults = 6; // Number of videos/shorts to display in each grid

    // Helper function to parse ISO 8601 duration to seconds
    // (Still included for potential future use or if 'short' filter is not perfect in API, though less critical now)
    function parseDuration(iso8601Duration) {
        const p = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        const matches = p.exec(iso8601Duration);
        if (!matches) return 0;

        const years = parseInt(matches[1] || 0, 10);
        const months = parseInt(matches[2] || 0, 10);
        const days = parseInt(matches[3] || 0, 10);
        const hours = parseInt(matches[4] || 0, 10);
        const minutes = parseInt(matches[5] || 0, 10);
        const seconds = parseInt(matches[6] || 0, 10);

        return years * 31536000 + months * 2592000 + days * 86400 + hours * 3600 + minutes * 60 + seconds;
    }

    // Function to fetch the latest Shorts from the channel using search endpoint and videoDuration=short
    async function fetchLatestShorts(containerElement) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=date&videoDuration=short&key=${API_KEY}&maxResults=${maxResults}`
            );
            const data = await response.json();

            containerElement.innerHTML = ''; // Clear loading message

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const videoId = item.id.videoId; // Use item.id.videoId for search results
                    const videoTitle = item.snippet.title;

                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}`;
                    iframe.frameBorder = "0";
                    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                    iframe.allowFullscreen = true;
                    iframe.setAttribute('title', videoTitle);

                    containerElement.appendChild(iframe);
                });
            } else {
                containerElement.innerHTML = '<p class="loading-message">No latest Shorts found.</p>';
            }
        } catch (error) {
            console.error('Error fetching latest Shorts:', error);
            containerElement.innerHTML = '<p class="loading-message">Failed to load Shorts. Please check your API key and network connection, or API key restrictions.</p>';
        }
    }

    // Function to fetch videos from a specific playlist (used for Latest Videos)
    async function fetchVideosFromPlaylist(playlistId, containerElement) {
        if (!playlistId) {
            containerElement.innerHTML = '<p class="loading-message">Error: Playlist ID for videos is missing or invalid. Please check your setup.</p>';
            return;
        }

        try {
            containerElement.innerHTML = '<p class="loading-message">Loading latest videos...</p>';

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&key=${API_KEY}&maxResults=${maxResults}`
            );
            const data = await response.json();

            containerElement.innerHTML = ''; // Clear loading message

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const videoId = item.snippet.resourceId.videoId;
                    const videoTitle = item.snippet.title;

                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}`;
                    iframe.frameBorder = "0";
                    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                    iframe.allowFullscreen = true;
                    iframe.setAttribute('title', videoTitle);

                    containerElement.appendChild(iframe);
                });
            } else {
                containerElement.innerHTML = '<p class="loading-message">No content found in this playlist.</p>';
            }
        } catch (error) {
            console.error('Error fetching videos from playlist:', error);
            containerElement.innerHTML = '<p class="loading-message">Failed to load videos. Please check your API key and network connection, or API key restrictions.</p>';
        }
    }


    // Function to fetch popular videos using the search endpoint
    async function fetchPopularVideos(containerElement) {
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=viewCount&key=${API_KEY}&maxResults=${maxResults}`
            );
            const data = await response.json();

            containerElement.innerHTML = ''; // Clear loading message

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const videoId = item.id.videoId;
                    const videoTitle = item.snippet.title;
                    const thumbnailUrl = item.snippet.thumbnails.high.url;

                    const popularItemDiv = document.createElement('div');
                    popularItemDiv.classList.add('popular-item');

                    const link = document.createElement('a');
                    link.href = `https://www.youtube.com/watch?v=${videoId}`;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";

                    const img = document.createElement('img');
                    img.src = thumbnailUrl;
                    img.alt = videoTitle;
                    img.onerror = function() { this.src = 'https://placehold.co/160x90/333/eee?text=No+Image'; };

                    const title = document.createElement('h3');
                    title.textContent = videoTitle;

                    link.appendChild(img);
                    link.appendChild(title);
                    popularItemDiv.appendChild(link);
                    containerElement.appendChild(popularItemDiv);
                });
            } else {
                containerElement.innerHTML = '<p class="loading-message">No popular videos found.</p>';
            }
        } catch (error) {
            console.error('Error fetching popular videos:', error);
            containerElement.innerHTML = '<p class="loading-message">Failed to load popular videos. Please check your API key and network connection, or API key restrictions.</p>';
        }
    }

    // --- Execute on page load ---

    // For Latest Shorts
    fetchLatestShorts(shortsContainer);

    // For Latest Videos (now uses the specific playlist you provided)
    fetchVideosFromPlaylist(LATEST_VIDEOS_PLAYLIST_ID, videosContainer);

    // For Most Popular videos
    fetchPopularVideos(popularContainer);
});
