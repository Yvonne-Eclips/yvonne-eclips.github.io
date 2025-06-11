document.addEventListener('DOMContentLoaded', function() {
    const API_KEY = 'AIzaSyAI0Cxih1zjrX7o4wQnW68NCMBVFqztK-A'; // Your YouTube API Key
    const CHANNEL_ID = 'UCDwGOo8zxlGaXMpA4pmIHdA'; // Your YouTube Channel ID

    // Playlist ID for your curated "Latest Videos" (excluding shorts)
    const LATEST_VIDEOS_PLAYLIST_ID = 'PLS15hKH3nTjlw51NsU8PFGcezq0jpoNUh'; 

    // Optional: If you have a dedicated public playlist for your Shorts, enter its ID here.
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
    // Now also includes aspect ratio check for more robust filtering
    async function fetchLatestShorts(containerElement) {
        let actualShorts = [];
        let nextPageToken = null;
        const ITEMS_PER_SEARCH_CALL = 50; // Max results per page for YouTube Search API
        const VERTICAL_ASPECT_RATIO_THRESHOLD = 0.7; // Aspect ratio for vertical videos (height/width > 1.0)
                                                    // or width/height < this for landscape.
                                                    // Common Shorts are 9:16 (0.5625) or 3:4 (0.75)

        try {
            containerElement.innerHTML = '<p class="loading-message">Loading latest Shorts...</p>';

            // Loop to fetch pages until we have enough shorts or no more pages
            while (actualShorts.length < maxResults) {
                let searchUrl = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&channelId=${CHANNEL_ID}&type=video&order=date&videoDuration=short&key=${API_KEY}&maxResults=${ITEMS_PER_SEARCH_CALL}`;
                if (nextPageToken) {
                    searchUrl += `&pageToken=${nextPageToken}`;
                }

                const searchResponse = await fetch(searchUrl);
                const searchData = await searchResponse.json();

                if (!searchData.items || searchData.items.length === 0) {
                    // No more videos to process
                    break;
                }

                const videoIds = searchData.items.map(item => item.id.videoId).filter(id => id);

                if (videoIds.length === 0) {
                    nextPageToken = searchData.nextPageToken;
                    continue; // No valid video IDs, move to next page
                }

                // Fetch contentDetails for these video IDs to get their dimensions
                const detailsResponse = await fetch(
                    `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(',')}&key=${API_KEY}`
                );
                const detailsData = await detailsResponse.json();

                if (detailsData.items) {
                    const filteredByAspectRatio = detailsData.items.filter(item => {
                        const width = item.snippet.thumbnails?.high?.width;
                        const height = item.snippet.thumbnails?.high?.height;

                        // Check for vertical aspect ratio (height > width) or very close to it
                        // A common short aspect ratio is 9:16, 3:4 etc. width/height will be < 1
                        if (width && height) {
                             return (width / height) < VERTICAL_ASPECT_RATIO_THRESHOLD; // e.g., 0.7 for anything more vertical than ~16:9
                        }
                        return false; // If no dimensions, filter it out
                    });
                    actualShorts = actualShorts.concat(filteredByAspectRatio);
                }

                nextPageToken = searchData.nextPageToken;
                if (!nextPageToken) {
                    // No more pages to fetch
                    break;
                }
            }

            containerElement.innerHTML = ''; // Clear loading message

            if (actualShorts.length > 0) {
                // Sort by published date and take top 'maxResults'
                actualShorts.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

                actualShorts.slice(0, maxResults).forEach(item => {
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
              
