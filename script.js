document.addEventListener('DOMContentLoaded', function() {
    const API_KEY = 'AIzaSyAI0Cxih1zjrX7o4wQnW68NCMBVFqztK-A'; // Your YouTube API Key
    const CHANNEL_ID = 'UCDwGOo8zxlGaXMpA4pmIHdA'; // Your YouTube Channel ID

    // Optional: If you have a dedicated public playlist for your Shorts, enter its ID here.
    // If empty, the script will attempt to use the default Shorts playlist ID derived from your channel ID.
    // However, for precise Shorts fetching, a dedicated playlist is recommended.
    // This variable is no longer used for fetching 'latest shorts' directly, but kept for context.
    const SHORTS_PLAYLIST_ID = 'PLS15hKH3nTjkQGKa_MybUL8Wr4ykyHT35'; // Corrected: Just the Playlist ID

    const shortsContainer = document.getElementById('shorts-grid');
    const videosContainer = document.getElementById('videos-grid');
    const popularContainer = document.getElementById('popular-grid');

    const maxResults = 6; // Number of videos/shorts to display in each grid

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

    // Function to fetch the latest regular videos (excluding shorts)
    async function fetchLatestVideos(containerElement) {
        let allVideos = [];
        const maxVideosPerDuration = Math.ceil(maxResults / 2); // To ensure we get enough videos after combining

        try {
            // Fetch 'medium' duration videos
            const mediumVideosResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=date&videoDuration=medium&key=${API_KEY}&maxResults=${maxVideosPerDuration}`
            );
            const mediumData = await mediumVideosResponse.json();
            if (mediumData.items) {
                allVideos = allVideos.concat(mediumData.items);
            }

            // Fetch 'long' duration videos
            const longVideosResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&type=video&order=date&videoDuration=long&key=${API_KEY}&maxResults=${maxVideosPerDuration}`
            );
            const longData = await longVideosResponse.json();
            if (longData.items) {
                allVideos = allVideos.concat(longData.items);
            }

            // Sort all collected videos by published date in descending order to get the absolute latest
            allVideos.sort((a, b) => new Date(b.snippet.publishedAt) - new Date(a.snippet.publishedAt));

            containerElement.innerHTML = ''; // Clear loading message

            if (allVideos.length > 0) {
                // Take only the top 'maxResults' after sorting
                allVideos.slice(0, maxResults).forEach(item => {
                    const videoId = item.id.videoId;
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

    // For Latest Videos (excluding shorts)
    fetchLatestVideos(videosContainer);

    // For Most Popular videos
    fetchPopularVideos(popularContainer);
});
