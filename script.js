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
                    <iframe src="https://www.youtube.com/embed/videoseries?list=UUDwGOo8zxlGaXMpA4pmIHdA" title="Latest Uploads" allowfullscreen></iframe>
                </div>
                <div class="card-info">
                    <h4>Latest VTuber Highlights & Stream Edits</h4>
                    <p class="meta-text"><i class="fa-solid fa-rotate"></i> Auto-updated channel uploads feed</p>
                </div>
            </div>
        `,
        popular: `
            <div class="showcase-card glass">
                <div class="responsive-video">
                    <iframe src="https://www.youtube.com/embed/2syrU4IFuUM" title="Most Viewed Highlight" allowfullscreen></iframe>
                </div>
                <div class="card-info">
                    <h4>Top Viral Edit: Chat Reacts to 'CaseOh'</h4>
                    <p class="meta-text"><i class="fa-solid fa-fire glow-icon-red"></i> Highest Engagement Highlight</p>
                </div>
            </div>
        `,
        shorts: `
            <div class="showcase-card glass">
                <div class="responsive-video">
                    <iframe src="https://www.youtube.com/embed/videoseries?list=UUDwGOo8zxlGaXMpA4pmIHdA" title="VTuber Shorts" allowfullscreen></iframe>
                </div>
                <div class="card-info">
                    <h4>Vertical TikToks, Reels & VTuber Shorts</h4>
                    <p class="meta-text"><i class="fa-solid fa-mobile-screen-button"></i> Short-form high-retention cuts</p>
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
