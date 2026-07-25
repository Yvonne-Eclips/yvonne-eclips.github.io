document.addEventListener('DOMContentLoaded', () => {
    // Tab Navigation Switcher
    const tabButtons = document.querySelectorAll('.tab-btn');
    const pages = document.querySelectorAll('.portal-page');

    function switchPage(pageId) {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        const targetBtn = document.querySelector(`[data-target="${pageId}"]`);
        const targetPage = document.getElementById(pageId);

        if (targetBtn && targetPage) {
            targetBtn.classList.add('active');
            targetPage.classList.add('active');
        }
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-target');
            switchPage(pageId);
        });
    });

    window.switchPage = switchPage;

    // Content Showcase Filter Switcher
    const filterButtons = document.querySelectorAll('.filter-btn');
    const showcaseGrid = document.getElementById('showcase-grid');

    const contentMap = {
        latest: `
            <div class="showcase-card glass">
                <div class="responsive-video">
                    <iframe src="https://www.youtube.com/embed/videoseries?list=PLS15hKH3nTjlw51NsU8PFGcezq0jpoNUh" title="Latest Uploads Playlist" allowfullscreen></iframe>
                </div>
                <div class="card-info">
                    <h4>Latest VTuber Clips & Stream Edits</h4>
                    <p class="meta-text"><i class="fa-solid fa-sparkles"></i> Auto-updated latest uploads playlist</p>
                </div>
            </div>
        `,
        popular: `
            <div class="showcase-card glass">
                <div class="responsive-video">
                    <iframe src="https://www.youtube.com/embed/videoseries?list=PLS15hKH3nTjlOCzZCasgSd11TR-zRcU_2" title="Most Viewed Playlist" allowfullscreen></iframe>
                </div>
                <div class="card-info">
                    <h4>Most Viewed Highlights & Viral Edits</h4>
                    <p class="meta-text"><i class="fa-solid fa-fire glow-icon-red"></i> Top Performing VTuber Clips Playlist</p>
                </div>
            </div>
        `,
        shorts: `
            <div class="showcase-card glass">
                <div class="responsive-video">
                    <iframe src="https://www.youtube.com/embed/videoseries?list=PLS15hKH3nTjkQGKa_MybUL8Wr4ykyHT35" title="VTuber Shorts Playlist" allowfullscreen></iframe>
                </div>
                <div class="card-info">
                    <h4>Shorts, Reels & TikTok Edits</h4>
                    <p class="meta-text"><i class="fa-solid fa-mobile-screen-button"></i> Short-form vertical highlights playlist</p>
                </div>
            </div>
        `
    };

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filter = btn.getAttribute('data-filter');
            if (contentMap[filter]) {
                showcaseGrid.innerHTML = contentMap[filter];
            }
        });
    });
});
