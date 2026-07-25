document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const pages = document.querySelectorAll('.portal-page');

    function switchPage(pageId) {
        // Remove active class from all tabs and section pages
        tabButtons.forEach(btn => btn.classList.remove('active'));
        pages.forEach(page => page.classList.remove('active'));

        // Find target button and target section page
        const targetBtn = document.querySelector(`[data-target="${pageId}"]`);
        const targetPage = document.getElementById(pageId);

        if (targetBtn && targetPage) {
            targetBtn.classList.add('active');
            targetPage.classList.add('active');
        }
    }

    // Add click listeners to tab buttons
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const pageId = button.getAttribute('data-target');
            switchPage(pageId);
        });
    });

    // Make switchPage globally accessible for embedded buttons
    window.switchPage = switchPage;
});
