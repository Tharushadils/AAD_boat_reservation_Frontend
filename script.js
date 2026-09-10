/* =========================================================
   AQUAVENTURE
   Vanilla JavaScript
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const header = document.getElementById("siteHeader");
    const menuToggle = document.getElementById("menuToggle");
    const navMenu = document.getElementById("navMenu");
    const navLinks = document.querySelectorAll(".nav-link");
    const backToTop = document.getElementById("backToTop");
    const bookingSearch = document.getElementById("bookingSearch");
    const toast = document.getElementById("toast");

    const bookingDate = document.getElementById("bookingDate");
    const bookingLocation = document.getElementById("location");
    const bookingGuests = document.getElementById("guests");


    /* =====================================================
       SET MINIMUM BOOKING DATE
    ===================================================== */

    if (bookingDate) {

        const today = new Date();

        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");

        bookingDate.min = `${year}-${month}-${day}`;
    }


    /* =====================================================
       STICKY NAVBAR
    ===================================================== */

    function updateHeader() {

        if (window.scrollY > 40) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }

        if (window.scrollY > 500) {
            backToTop.classList.add("show");
        } else {
            backToTop.classList.remove("show");
        }
    }

    window.addEventListener("scroll", updateHeader, {
        passive: true
    });

    updateHeader();


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    function toggleMobileMenu() {

        const isOpen = navMenu.classList.toggle("open");

        menuToggle.classList.toggle("open", isOpen);

        menuToggle.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        document.body.classList.toggle("menu-open", isOpen);
    }

    menuToggle.addEventListener("click", toggleMobileMenu);


    /* =====================================================
       CLOSE MOBILE MENU WHEN LINK CLICKED
    ===================================================== */

    navLinks.forEach(link => {

        link.addEventListener("click", () => {

            navMenu.classList.remove("open");
            menuToggle.classList.remove("open");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            document.body.classList.remove("menu-open");

        });

    });


    /* =====================================================
       CLOSE MOBILE MENU WHEN CLICKING OUTSIDE
    ===================================================== */

    document.addEventListener("click", event => {

        const clickedInsideMenu =
            navMenu.contains(event.target);

        const clickedToggle =
            menuToggle.contains(event.target);

        if (
            !clickedInsideMenu &&
            !clickedToggle &&
            navMenu.classList.contains("open")
        ) {

            navMenu.classList.remove("open");
            menuToggle.classList.remove("open");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            document.body.classList.remove("menu-open");
        }

    });


    /* =====================================================
       SMOOTH SCROLLING
    ===================================================== */

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {

        anchor.addEventListener("click", event => {

            const targetId =
                anchor.getAttribute("href");

            if (
                !targetId ||
                targetId === "#"
            ) {
                return;
            }

            const target =
                document.querySelector(targetId);

            if (!target) {
                return;
            }

            event.preventDefault();

            target.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });

        });

    });


    /* =====================================================
       ACTIVE NAVIGATION LINK
    ===================================================== */

    const sections = document.querySelectorAll(
        "main section[id]"
    );

    function updateActiveNavigation() {

        const scrollPosition =
            window.scrollY + 180;

        let currentSection = "home";

        sections.forEach(section => {

            const sectionTop =
                section.offsetTop;

            if (scrollPosition >= sectionTop) {
                currentSection = section.id;
            }

        });

        navLinks.forEach(link => {

            const href =
                link.getAttribute("href");

            link.classList.toggle(
                "active",
                href === `#${currentSection}`
            );

        });

    }

    window.addEventListener(
        "scroll",
        updateActiveNavigation,
        { passive: true }
    );

    updateActiveNavigation();


    /* =====================================================
       SCROLL REVEAL
    ===================================================== */

    const revealElements =
        document.querySelectorAll(".reveal");

    if ("IntersectionObserver" in window) {

        const revealObserver =
            new IntersectionObserver(
                (entries, observer) => {

                    entries.forEach(entry => {

                        if (entry.isIntersecting) {

                            entry.target.classList.add(
                                "visible"
                            );

                            observer.unobserve(
                                entry.target
                            );
                        }

                    });

                },
                {
                    threshold: 0.12,
                    rootMargin: "0px 0px -50px 0px"
                }
            );

        revealElements.forEach(element => {
            revealObserver.observe(element);
        });

    } else {

        revealElements.forEach(element => {
            element.classList.add("visible");
        });

    }


    /* =====================================================
       BACK TO TOP
    ===================================================== */

    backToTop.addEventListener("click", () => {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    });


    /* =====================================================
       BOOKING SEARCH
    ===================================================== */

    bookingSearch.addEventListener("click", () => {

        const location =
            bookingLocation.value;

        const date =
            bookingDate.value;

        const guests =
            bookingGuests.value;

        if (!location) {

            showToast(
                "Choose a destination",
                "Select where you'd like to start your adventure."
            );

            bookingLocation.focus();

            return;
        }

        if (!date) {

            showToast(
                "Choose a date",
                "Select a date for your adventure."
            );

            bookingDate.focus();

            return;
        }

        const selectedDate =
            new Date(`${date}T00:00:00`);

        const formattedDate =
            selectedDate.toLocaleDateString(
                "en-LK",
                {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                }
            );

        showToast(
            "Adventure found",
            `${formatLocation(location)} · ${formattedDate} · ${guests} guest${guests === "1" ? "" : "s"}`
        );

        setTimeout(() => {

            window.location.href =
                "reservation.html";

        }, 1800);

    });


    /* =====================================================
       FORMAT LOCATION
    ===================================================== */

    function formatLocation(value) {

        const locations = {

            bentota: "Bentota",

            balapitiya: "Balapitiya",

            hikkaduwa: "Hikkaduwa",

            baddegama: "Baddegama River"

        };

        return locations[value] || "AquaVenture";
    }


    /* =====================================================
       TOAST
    ===================================================== */

    let toastTimeout;

    function showToast(title, message) {

        if (!toast) {
            return;
        }

        const strong =
            toast.querySelector("strong");

        const span =
            toast.querySelector("span");

        strong.textContent = title;
        span.textContent = message;

        toast.classList.add("show");

        clearTimeout(toastTimeout);

        toastTimeout = setTimeout(() => {

            toast.classList.remove("show");

        }, 3500);

    }


    /* =====================================================
       HERO CTA BUTTON INTERACTIONS
    ===================================================== */

    const heroExplore =
        document.querySelector(
            '.hero-buttons a[href="#experiences"]'
        );

    if (heroExplore) {

        heroExplore.addEventListener(
            "click",
            () => {

                document
                    .getElementById("experiences")
                    ?.scrollIntoView({
                        behavior: "smooth"
                    });

            }
        );

    }


    /* =====================================================
       EXPERIENCE CARD INTERACTION
    ===================================================== */

    const experienceCards =
        document.querySelectorAll(
            ".experience-card"
        );

    experienceCards.forEach(card => {

        card.addEventListener(
            "mouseenter",
            () => {

                card.style.zIndex = "5";

            }
        );

        card.addEventListener(
            "mouseleave",
            () => {

                card.style.zIndex = "";

            }
        );

    });


    /* =====================================================
       DESTINATION CARD INTERACTION
    ===================================================== */

    const destinationCards =
        document.querySelectorAll(
            ".destination-card"
        );

    destinationCards.forEach(card => {

        card.addEventListener(
            "mouseenter",
            () => {

                card.style.zIndex = "5";

            }
        );

        card.addEventListener(
            "mouseleave",
            () => {

                card.style.zIndex = "";

            }
        );

    });


    /* =====================================================
       ESCAPE KEY
    ===================================================== */

    document.addEventListener("keydown", event => {

        if (
            event.key === "Escape" &&
            navMenu.classList.contains("open")
        ) {

            navMenu.classList.remove("open");
            menuToggle.classList.remove("open");

            menuToggle.setAttribute(
                "aria-expanded",
                "false"
            );

            document.body.classList.remove(
                "menu-open"
            );

        }

    });


    /* =====================================================
       PARALLAX EFFECT FOR HERO
    ===================================================== */

    const heroBackground =
        document.querySelector(
            ".hero-background"
        );

    const reducedMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    if (
        heroBackground &&
        !reducedMotion
    ) {

        window.addEventListener(
            "scroll",
            () => {

                const scrollY =
                    window.scrollY;

                if (scrollY < window.innerHeight) {

                    heroBackground.style.transform =
                        `scale(1.03) translateY(${scrollY * 0.08}px)`;

                }

            },
            { passive: true }
        );

    }


    /* =====================================================
       PREVENT EMPTY FOOTER LINKS
    ===================================================== */

    document.querySelectorAll(
        'a[href="#"]'
    ).forEach(link => {

        link.addEventListener(
            "click",
            event => {
                event.preventDefault();
            }
        );

    });


    /* =====================================================
       IMAGE ERROR FALLBACK
    ===================================================== */

    document.querySelectorAll("img").forEach(image => {

        image.addEventListener(
            "error",
            () => {

                image.style.background =
                    "linear-gradient(135deg, #073647, #12b8b0)";

                image.removeAttribute("src");

            }
        );

    });

});