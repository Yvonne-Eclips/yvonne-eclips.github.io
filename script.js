document.addEventListener('DOMContentLoaded', function() {
    // --- API Configuration ---
    // IMPORTANT: Replace these placeholders with your actual YouTube Data API Key and Channel ID.
    // Ensure your API key is restricted to your domain and the YouTube Data API v3 in Google Cloud Console.
    const API_KEY = 'AIzaSyAI0Cxih1zjrX7o4wQnW68NCMBVFqztK-A'; // Your YouTube Data API Key
    const CHANNEL_ID = 'UCDwGOo8zxlGaXMpA4pmIHdA'; // Your YouTube Channel ID (e.g., from youtube.com/account_advanced)

    // Playlist ID for your curated "Latest Videos" (excluding shorts)
    // This provides direct control over the content in the 'Latest Videos' section.
    const LATEST_VIDEOS_PLAYLIST_ID = 'PLS15hKH3nTjlw51NsU8PFGcezq0jpoNUh'; 

    // This variable is no longer actively used for fetching 'latest shorts' as we're
    // now fetching them via search and filtering by aspect ratio for more precision.
    const SHORTS_PLAYLIST_ID_CONTEXT = 'PLS15hKH3nTjkQGKa_MybUL8Wr4ykyHT35'; 

    // --- DOM Elements ---
    const shortsContainer = document.getElementById('shorts-grid');
    const videosContainer = document.getElementById('videos-grid');
    const popularContainer = document.getElementById('popular-grid');

    // --- General Settings ---
    const maxResults = 6; // Number of videos/shorts to display in each grid section
    const ITEMS_PER_SEARCH_CALL = 50; // Max results per page for YouTube Search API (helps for filtering)

    // --- Helper Functions ---

    /**
     * Creates and appends an iframe for a YouTube video to a given container.
     * @param {HTMLElement} containerElement - The DOM element to append the iframe to.
     * @param {string} videoId - The YouTube video ID.
     * @param {string} videoTitle - The title of the video for accessibility.
     */
    function appendVideoIframe(containerElement, videoId, videoTitle) {
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}`;
        iframe.frameBorder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
        iframe.allowFullscreen = true;
        iframe.setAttribute('title', videoTitle); // Essential for accessibility

        containerElement.appendChild(iframe);
    }

    /**
     * Handles common error display for API fetching.
     * @param {HTMLElement} containerElement - The container to display the error in.
     * @param {string} message - A user-friendly error message.
     * @param {Error} error - The actual error object for console logging.
     */
    function handleError(containerElement, message, error) {
        console.error(`Error fetching content: ${message}`, error);
        containerElement.innerHTML = `<p class="loading-message error-message">${message}</p>`;
    }


    // --- Core Fetching Functions ---

    /**
     * Fetches the latest YouTube Shorts from the channel.
     * This function primarily filters by video aspect ratio (vertical orientation),
     * and uses the YouTube Data API's 'search' endpoint ordered by date.
     * @param {HTMLElement} containerElement - The DOM element to display the shorts in.
     */
    async function fetchLatestShorts(containerElement) {
        let shortsToDisplay = [];
        let nextPageToken = null;
        // Aspect ratio for vertical videos (width/height less than this threshold)
        // Common Shorts are 9:16 (0.5625) or 3:4 (0.75). Setting 0.7 filters out most landscape.
        const VERTICAL_ASPECT_RATIO_THRESHOLD = 0.7; 

        try {
            containerElement.innerHTML = '<p class="loading-message">Loading latest Shorts...</p>';

            // Loop to fetch pages until we have enough shorts or no more pages
            while (shortsToDisplay.length < maxResults) {
                // Fetch latest videos from the channel, ordered by date.
                // We're intentionally NOT using videoDuration=short here, as it can be inconsistent.
                // Instead, we will filter by aspect ratio.
                let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&channelId=${CHANNEL_ID}&type=video&order=date&key=${API_KEY}&maxResults=${ITEMS_PER_SEARCH_CALL}`;
                if (nextPageToken) {
                    searchUrl += `&pageToken=${nextPageToken}`;
                }

                const searchResponse = await fetch(searchUrl);
                const searchData = await searchResponse.json();

                if (!searchData.items || searchData.items.length === 0) {
                    // No more videos to process or no content at all
                    break;
                }

                // Collect video IDs from the current page, filtering out any invalid ones
                const videoIds = searchData.items.map(item => item.id.videoId).filter(id => id);

                if (videoIds.length === 0) {
                    nextPageToken = searchData.nextPageToken;
                    continue; // No valid video IDs found on this page, move to next
                }

                // Fetch full video details for these video IDs to get thumbnail dimensions
                const detailsResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoIds.join(',')}&key=${API_KEY}`
                );
                const detailsData = await detailsResponse.json();

                if (detailsData.items) {
                    // Filter by aspect ratio: only include videos with a significantly vertical orientation
                    const filteredByAspectRatio = detailsData.items.filter(item => {
                        const width = item.snippet.thumbnails?.high?.width;
                        const height = item.snippet.thumbnails?.high?.height;

                        // Check if dimensions are available and the video is vertical
                        return (width && height && (width / height) < VERTICAL_ASPECT_RATIO_THRESHOLD);
                    });
                    shortsToDisplay = shortsToDisplay.concat(filteredByAspectRatio);
                }

                nextPageToken = searchData.nextPageToken;
                if (!nextPageToken) {
                    // No more pages to fetch from the API
                    break;
                }
            }

            containerElement.innerHTML = ''; // Clear loading message

            if (shortsToDisplay.length > 0) {
                // Sort by published date (descending) and take only the required number of results
                shortsToDisplay.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

                shortsToDisplay.slice(0, maxResults).forEach(item => {
                    // For the 'videos' API endpoint, 'item.id' directly holds the video ID string
                    // For 'search' endpoint (which gives us item.id.videoId), we still rely on the 'videos' API for details.
                    const videoId = item.id; 
                    const videoTitle = item.snippet.title;
                    appendVideoIframe(containerElement, videoId, videoTitle);
                });
            } else {
                containerElement.innerHTML = '<p class="loading-message">No latest Shorts found that match criteria.</p>';
            }
        } catch (error) {
            handleError(containerElement, 'Failed to load latest Shorts. Please check your API key and network connection, or API key restrictions.', error);
        }
    }

    /**
     * Fetches videos from a specific YouTube playlist.
     * This function is used for the 'Latest Videos' section to display curated content.
     * @param {string} playlistId - The ID of the YouTube playlist.
     * @param {HTMLElement} containerElement - The DOM element to display the videos in.
     */
    async function fetchVideosFromPlaylist(playlistId, containerElement) {
        if (!playlistId) {
            handleError(containerElement, 'Playlist ID for Latest Videos is missing or invalid. Please check your setup.', null);
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
                    // For the 'playlistItems' API endpoint, video ID is in snippet.resourceId.videoId
                    const videoId = item.snippet.resourceId.videoId;
                    const videoTitle = item.snippet.title;
                    appendVideoIframe(containerElement, videoId, videoTitle);
                });
            } else {
                containerElement.innerHTML = '<p class="loading-message">No content found in this playlist.</p>';
            }
        } catch (error) {
            handleError(containerElement, 'Failed to load videos from playlist. Please check your API key and network connection, or API key restrictions.', error);
        }
    }

    /**
     * Fetches the most popular videos from the channel.
     * This uses the YouTube Data API's 'search' endpoint ordered by viewCount.
     * @param {HTMLElement} containerElement - The DOM element to display the popular videos in.
     */
    async function fetchPopularVideos(containerElement) {
        try {
            containerElement.innerHTML = '<p class="loading-message">Loading most popular videos...</p>';

            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=viewCount&key=${API_KEY}&maxResults=${maxResults}`
            );
            const data = await response.json();

            containerElement.innerHTML = ''; // Clear loading message

            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const videoId = item.id.videoId; // For 'search' endpoint, video ID is in item.id.videoId
                    const videoTitle = item.snippet.title;
                    const thumbnailUrl = item.snippet.thumbnails.high.url; // 'high' for better thumbnail quality

                    const popularItemDiv = document.createElement('div');
                    popularItemDiv.classList.add('popular-item');

                    const link = document.createElement('a');
                    link.href = `https://www.youtube.com/watch?v=${videoId}`;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer"; // Security best practice

                    const img = document.createElement('img');
                    img.src = thumbnailUrl;
                    img.alt = videoTitle;
                    // Fallback for broken image links
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
            handleError(containerElement, 'Failed to load popular videos. Please check your API key and network connection, or API key restrictions.', error);
        }
    }

    // --- Initial Execution on Page Load ---

    // Fetch and display the latest Shorts
    fetchLatestShorts(shortsContainer);

    // Fetch and display the curated Latest Videos from the specified playlist
    fetchVideosFromPlaylist(LATEST_VIDEOS_PLAYLIST_ID, videosContainer);

    // Fetch and display the most popular videos
    fetchPopularVideos(popularContainer);
});
