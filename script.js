document.addEventListener('DOMContentLoaded', function() {
    const API_KEY = 'AIzaSyAI0Cxih1zjrX7o4wQnW68NCMBVFqztK-A'; // Your YouTube API Key
    const CHANNEL_ID = 'UCDwGOo8zxlGaXMpA4pmIHdA'; // Your YouTube Channel ID

    // Optional: If you have a dedicated public playlist for your Shorts, enter its ID here.
    // If empty, the script will attempt to use the default Shorts playlist ID derived from your channel ID.
    // However, for precise Shorts fetching, a dedicated playlist is recommended.
    const SHORTS_PLAYLIST_ID = 'PLS15hKH3nTjkQGKa_MybUL8Wr4ykyHT35'; // Corrected: Just the Playlist ID

    const shortsContainer = document.getElementById('shorts-grid');
    const videosContainer = document.getElementById('videos-grid');
    const popularContainer = document.getElementById('popular-grid');

    const maxResults = 6; // Number of videos/shorts to display in each grid

    // Function to fetch videos from a playlist (for Latest Shorts & Latest Videos)
    async function fetchPlaylistVideos(playlistId, containerElement, isShorts = false) {
        if (!playlistId) {
            containerElement.innerHTML = `<p class="loading-message">Error: ${isShorts ? 'Shorts' : 'Videos'} Playlist ID is missing or invalid. Please check your setup.</p>`;
            return;
        }

        try {
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
                    iframe.src = `https://www.youtube.com/embed/${videoId}`; // Corrected iframe src
                    iframe.frameBorder = "0";
                    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
                    iframe.allowFullscreen = true;
                    iframe.setAttribute('title', videoTitle); // Add title for accessibility

                    containerElement.appendChild(iframe);
                });
            } else {
                containerElement.innerHTML = '<p class="loading-message">No content found in this playlist.</p>';
            }
        } catch (error) {
            console.error(`Error fetching ${isShorts ? 'shorts' : 'videos'}:`, error);
            containerElement.innerHTML = '<p class="loading-message">Failed to load content. Please check your API key and network connection, or API key restrictions.</p>';
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
                    const thumbnailUrl = item.snippet.thumbnails.high.url; // 'high' for better quality

                    const popularItemDiv = document.createElement('div');
                    popularItemDiv.classList.add('popular-item');

                    const link = document.createElement('a');
                    link.href = `https://www.youtube.com/watch?v=${videoId}`;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer"; // Security best practice

                    const img = document.createElement('img');
                    img.src = thumbnailUrl;
                    img.alt = videoTitle;
                    img.onerror = function() { this.src = 'https://placehold.co/160x90/333/eee?text=No+Image'; }; // Fallback for broken images

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

    // Determine the uploads playlist ID from the channel ID
    // Standard YouTube format: 'UU' + channelId (slice removes the 'UC' prefix)
    const uploadsPlaylistId = `UU${CHANNEL_ID.slice(2)}`;

    // If a specific shorts playlist ID is provided, use it. Otherwise, attempt to derive.
    const finalShortsPlaylistId = SHORTS_PLAYLIST_ID || `UU${CHANNEL_ID.slice(2)}/shorts`; // Note: '/shorts' might not always work as a playlist ID

    fetchPlaylistVideos(finalShortsPlaylistId, shortsContainer, true);
    fetchPlaylistVideos(uploadsPlaylistId, videosContainer, false);
    fetchPopularVideos(popularContainer);
});