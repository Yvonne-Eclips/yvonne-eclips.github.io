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

    // Helper function to parse ISO 8601 duration to seconds
    // (Still included for potential future use or if 'short' filter is not perfect in API)
    function parseDuration(iso8601Duration) {
        const p = /P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        const matches = p.exec(iso8601Duration);
        if (!matches) return 0; // Return 0 if parsing fails

        const years = parseInt(matches[1] || 0, 10);
        const months = parseInt(matches[2] || 0, 10);
        const days = parseInt(matches[3] || 0, 10);
        const hours = parseInt(matches[4] || 0, 10);
        const minutes = parseInt(matches[5] || 0, 10);
        const seconds = parseInt(matches[6] || 0, 10);

        return years * 31536000 + months * 2592000 + days * 86400 + hours * 3600 + minutes * 60 + seconds;
    }

    // Function to fetch the latest Shorts from the channel using search endpoint
    // Now filters primarily by aspect ratio, without videoDuration=short API parameter
    async function fetchLatestShorts(containerElement) {
        let shortsToDisplay = [];
        let nextPageToken = null;
        const ITEMS_PER_SEARCH_CALL = 50; // Max results per page for YouTube Search API
        const VERTICAL_ASPECT_RATIO_THRESHOLD = 0.9; // Aspect ratio for vertical videos (width/height < this)

        try {
            containerElement.innerHTML = '<p class="loading-message">Loading latest Shorts...</p>';

            // Loop to fetch pages until we have enough shorts or no more pages
            while (shortsToDisplay.length < maxResults) {
                // Fetch latest videos from the channel, ordered by date.
                // Removed videoDuration=short filter from API call
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

                        if (width && height) {
                             return (width / height) < VERTICAL_ASPECT_RATIO_THRESHOLD;
                        }
                        return false; // If no dimensions, filter it out
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
                    const videoId = item.id; // From videos endpoint, 'id' is just the video ID string
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
                containerElement.innerHTML = '<p class="loading-message">No latest Shorts found that match criteria.</p>';
            }
        } catch (error) {
            handleError(containerElement, 'Failed to load latest Shorts. Please check your API key and network connection, or API key restrictions.', error);
        }
    }

    // Function to fetch videos from a specific playlist (used for Latest Videos)
    // No duration filtering is done here as it's playlist-based.
    async function fetchVideosFromPlaylist(playlistId, containerElement) {
        if (!playlistId) {
            containerElement.innerHTML = '<p class="loading-message">Error: Playlist ID for Latest Videos is missing or invalid. Please check your setup.</p>';
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
            handleError(containerElement, 'Failed to load videos from playlist. Please check your API key and network connection, or API key restrictions.', error);
        }
    }


    // Function to fetch popular videos using the search endpoint
    // No duration filtering is done here as it's sorted by viewCount.
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
