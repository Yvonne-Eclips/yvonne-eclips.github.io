document.addEventListener('DOMContentLoaded', function() {
    const API_KEY = 'AIzaSyAI0Cxih1zjrX7o4wQnW68NCMBVFqztK-A'; // Your YouTube API Key
    const CHANNEL_ID = 'UCDwGOo8zxlGaXMpA4pmIHdA'; // Your YouTube Channel ID (e.g., from youtube.com/account_advanced)

    // Playlist ID for your curated "Latest Videos" (excluding shorts)
    // This variable is no longer used for fetching 'latest shorts' directly, but kept for context.
    const SHORTS_PLAYLIST_ID = 'PLS15hKH3nTjkQGKa_MybUL8Wr4ykyHT35'; 

    const shortsContainer = document.getElementById('shorts-grid');
    const videosContainer = document.getElementById('videos-grid');
    const popularContainer = document.getElementById('popular-grid');

    const maxResults = 6; // Number of videos/shorts to display in each grid

    // Helper function to parse ISO 8601 duration to seconds
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
                    iframe.setAttribute('title', videoTitle); // Add title for accessibility

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

    // Function to fetch the latest regular videos (excluding shorts by strict duration check)
    async function fetchLatestVideos(containerElement) {
        let longFormVideos = [];
        let nextPageToken = null;
        const SHORTS_MAX_DURATION_SECONDS = 65; // Defining shorts as <= 65 seconds to be safe
        const ITEMS_PER_SEARCH_CALL = 50; // Max results per page for YouTube Search API

        try {
            containerElement.innerHTML = '<p class="loading-message">Loading latest videos...</p>';

            // Loop to fetch pages until we have enough long-form videos or no more pages
            while (longFormVideos.length < maxResults) {
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

                // Fetch full video details for these video IDs to get their durations
                const detailsResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(',')}&key=${API_KEY}`
                );
                const detailsData = await detailsResponse.json();

                if (detailsData.items) {
                    // Filter out shorts based on duration
                    const filteredVideos = detailsData.items.filter(item => {
                        const durationInSeconds = parseDuration(item.contentDetails.duration);
                        return durationInSeconds > SHORTS_MAX_DURATION_SECONDS;
                    });
                    longFormVideos = longFormVideos.concat(filteredVideos);
                }

                nextPageToken = searchData.nextPageToken;
                if (!nextPageToken) {
                    // No more pages to fetch from the API
                    break;
                }
            }

            containerElement.innerHTML = ''; // Clear loading message

            if (longFormVideos.length > 0) {
                // Sort by published date (descending) and take only the required number of results
                longFormVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

                longFormVideos.slice(0, maxResults).forEach(item => {
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
                containerElement.innerHTML = '<p class="loading-message">No latest long-form videos found.</p>';
            }

        } catch (error) {
            console.error('Error fetching latest long-form videos:', error);
            containerElement.innerHTML = '<p class="loading-message">Failed to load latest videos. Please check your API key and network connection, or API key restrictions.</p>';
        }
    }


    // Function to fetch popular videos using the search endpoint
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
            console.error('Error fetching popular videos:', error);
            containerElement.innerHTML = '<p class="loading-message">Failed to load popular videos. Please check your API key and network connection, or API key restrictions.</p>';
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
