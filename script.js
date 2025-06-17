document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.querySelector('.menu-toggle');
    const closeSidebar = document.querySelector('.close-sidebar');
    const navLinks = document.querySelectorAll('#sidebar nav ul li a');
    const body = document.body;

    function openNav() {
        sidebar.classList.add('open');
        body.classList.add('sidebar-open');
    }

    function closeNav() {
        sidebar.classList.remove('open');
        body.classList.remove('sidebar-open');
    }

    if (menuToggle) {
        menuToggle.addEventListener('click', openNav);
    }

    if (closeSidebar) {
        closeSidebar.addEventListener('click', closeNav);
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            closeNav();
        });
    });

    document.addEventListener('click', (event) => {
        if (sidebar.classList.contains('open')) {
            if (!sidebar.contains(event.target) && !menuToggle.contains(event.target) && event.target !== menuToggle) {
                closeNav();
            }
        }
    });
});
