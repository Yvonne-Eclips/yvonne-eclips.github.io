document.addEventListener('DOMContentLoaded', function() {
    const API_KEY = 'AIzaSyAI0Cxih1zjrX7o4wQnW68NCMBVFqztK-A'; // Your YouTube API Key
    const CHANNEL_ID = 'UCDwGOo8zxlGaXMpA4pmIHdA'; // Your YouTube Channel ID

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

    // Function to fetch the latest regular videos (excluding shorts by duration)
    async function fetchLatestVideos(containerElement) {
        let videoIds = [];
        let videosDetails = [];
        const THRESHOLD_SECONDS_FOR_SHORTS = 60; // Videos 60 seconds or less are considered shorts

        try {
            // First, get a list of latest video IDs from the channel (without duration filter)
            // We fetch more than maxResults initially to allow for filtering
            const searchResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=id&channelId=${CHANNEL_ID}&type=video&order=date&key=${API_KEY}&maxResults=${maxResults * 3}` // Fetch more to filter out shorts
            );
            const searchData = await searchResponse.json();

            if (!searchData.items || searchData.items.length === 0) {
                containerElement.innerHTML = '<p class="loading-message">No latest long-form videos found.</p>';
                return;
            }

            videoIds = searchData.items.map(item => item.id.videoId);

            // Now fetch contentDetails (including duration) for these video IDs
            const detailsResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoIds.join(',')}&key=${API_KEY}`
            );
            const detailsData = await detailsResponse.json();

            if (detailsData.items) {
                // Filter out shorts based on duration
                videosDetails = detailsData.items.filter(item => {
                    const durationInSeconds = parseDuration(item.contentDetails.duration);
                    return durationInSeconds > THRESHOLD_SECONDS_FOR_SHORTS;
                });

                // Sort again by published date in case the video details API changed order
                videosDetails.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

                containerElement.innerHTML = ''; // Clear loading message

                if (videosDetails.length > 0) {
                    // Take only the top 'maxResults' after sorting and filtering
                    videosDetails.slice(0, maxResults).forEach(item => {
                        const videoId = item.id; // Corrected: item.id for videos endpoint
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
                    containerElement.innerHTML = '<p class="loading-message">No latest long-form videos found.</p>';
                }
            } else {
                containerElement.innerHTML = '<p class="loading-message">Failed to retrieve video details.</p>';
            }

        } catch (error) {
            console.error('Error fetching latest long-form videos:', error);
            containerElement.innerHTML = '<p class="loading-message">Failed to load latest videos. Please check your API key and network connection, or API key restrictions.</p>';
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

    // For Latest Shorts
    fetchLatestShorts(shortsContainer);

    // For Latest Videos (excluding shorts by duration)
    fetchLatestVideos(videosContainer);

    // For Most Popular videos
    fetchPopularVideos(popularContainer);
});
