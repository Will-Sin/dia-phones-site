document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".golden-3").forEach(function (container) {
        let readMore = container.querySelector(".read-more");
        let panel = container.querySelector(".panel");
        let readLess = container.querySelector(".read-less");

        if (readMore && panel && readLess) {
            readMore.addEventListener("click", function () {
                $(readMore).fadeOut("slow", function () {
                    $(panel).slideDown("slow");
                });
            });

            readLess.addEventListener("click", function () {
                $(panel).slideUp("slow", function () {
                    $(readMore).fadeIn("slow");
                });
            });
        }
    });
    document.querySelectorAll(".project-title").forEach(function (title) {
        title.addEventListener("click", function () {
            const gridContainer = this.parentElement.nextElementSibling;
            if (!gridContainer || !gridContainer.classList.contains("grid-container")) return;

            const isAlreadyExpanded = gridContainer.classList.contains("expanded");
            const expandedProjects = document.querySelectorAll(".grid-container.expanded");
            expandedProjects.forEach(expanded => {
                $(expanded).slideUp("slow", function () {
                    expanded.classList.remove("expanded");

                    // Revert the spans back to their original state
                    const parent = expanded.previousElementSibling;
                    const spans = parent.children;

                    const secondSpan = spans[1];
                    const thirdSpan = spans[2];
                    const fourthSpan = spans[3];

                    // Animate font size and line height back to original
                    $(secondSpan).animate(
                        { fontSize: "0.618rem", lineHeight: "1.2rem" },
                        { duration: 200 }
                    );

                    // Hide the expanded spans
                    $(thirdSpan).fadeOut(200);
                    $(fourthSpan).fadeOut(200);
                });
            });

            if (!isAlreadyExpanded) {
                $(gridContainer).hide().addClass("expanded").slideDown("slow");

                // Find the parent <p> tag
                const parent = this.parentElement;

                // Get all child spans within the parent <p> tag
                const spans = parent.children;

                // Get the 2nd, 3rd, and 4th spans by their position in the list
                const secondSpan = spans[1]; // The second span (index 1)
                const thirdSpan = spans[2];  // The third span (index 2)
                const fourthSpan = spans[3]; // The fourth span (index 3)

                // Animate font size and line height to expanded size
                $(secondSpan).animate(
                    { fontSize: "0.854rem", lineHeight: "1.4rem" },
                    { duration: 200 }
                );

                // Reveal the expanded spans (third and fourth) with fade-in effect
                $(thirdSpan).hide().removeClass('hidden').fadeIn(400);
                $(fourthSpan).hide().removeClass('hidden').fadeIn(400);

                // Show images sequentially
                showImagesSequentially(gridContainer);
            }
        });
    });

    // Add event listener for "READ LESS" text
    document.querySelectorAll(".read-less").forEach(function (readLess) {
        readLess.addEventListener("click", function () {
            const gridContainer = readLess.closest(".grid-container");
            if (!gridContainer) return;

            const isAlreadyExpanded = gridContainer.classList.contains("expanded");
            if (isAlreadyExpanded) {
                $(gridContainer).slideUp("slow", function () {
                    gridContainer.classList.remove("expanded");

                    // Revert the spans back to their original state
                    const parent = gridContainer.previousElementSibling;
                    const spans = parent.children;

                    const secondSpan = spans[1];
                    const thirdSpan = spans[2];
                    const fourthSpan = spans[3];

                    // Animate font size and line height back to original
                    $(secondSpan).animate(
                        { fontSize: "0.618rem", lineHeight: "1.2rem" },
                        { duration: 200 }
                    );

                    // Hide the expanded spans
                    $(thirdSpan).fadeOut(200);
                    $(fourthSpan).fadeOut(200);
                });
            }
        });
    });

    function showImagesSequentially(container) {
        const images = container.querySelectorAll(".detail-image");
        images.forEach((img, index) => {
            setTimeout(() => {
                img.style.opacity = 1;
                if (index > 0) {
                    images[index - 1].style.opacity = 0;
                }
            }, index * 250); // 0.5 seconds delay between each image
        });
    }
});

document.addEventListener("DOMContentLoaded", function () {
    // Function to set a cookie
    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "") + expires + "; path=/; SameSite=Lax";
    }

    // Function to get a cookie
    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    // Function to get device and browser information
    function getDeviceAndBrowserInfo() {
        var userAgent = navigator.userAgent;
        var deviceInfo = "Machine: " + userAgent.split(') ')[0] + ')';
        var browserInfo = "Browser: " + userAgent.split(') ')[1];
        return { deviceInfo, browserInfo };
    }

    // Function to get IP address and location information
    function getIPAndLocationInfo(callback) {
        fetch('https://ipapi.co/json/')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log("Location Data:", data);
                var ipInfo = `IP: ${data.ip}`;
                var locationInfo = `Location: ${data.region}, ${data.country_name}`;
                callback({ ipInfo, locationInfo });
            })
            .catch(error => {
                console.error("Error fetching IP or location data:", error);
                callback({ ipInfo: "IP: Unknown", locationInfo: "Location: Unknown" });
            });
    }

    // Check if cookies are already set
    var deviceInfoCookie = getCookie("deviceInfo");
    var browserInfoCookie = getCookie("browserInfo");
    var ipInfoCookie = getCookie("ipInfo");
    var locationInfoCookie = getCookie("locationInfo");

    if (deviceInfoCookie && browserInfoCookie && ipInfoCookie && locationInfoCookie && locationInfoCookie !== "Location: Unknown") {
        document.getElementById("device-info").innerText = deviceInfoCookie;
        document.getElementById("browser-info").innerText = browserInfoCookie;
        document.getElementById("ip-info").innerText = ipInfoCookie;
        document.getElementById("location-info").innerText = locationInfoCookie;
    } else {
        // Get device and browser information
        var { deviceInfo, browserInfo } = getDeviceAndBrowserInfo();
        setCookie("deviceInfo", deviceInfo, 365);
        setCookie("browserInfo", browserInfo, 365);
        document.getElementById("device-info").innerText = deviceInfo;
        document.getElementById("browser-info").innerText = browserInfo;

        // Defer IP/location lookup so it doesn't compete with image loading
        function fetchIPAndLocation() {
            getIPAndLocationInfo(function ({ ipInfo, locationInfo }) {
                setCookie("ipInfo", ipInfo, 365);
                setCookie("locationInfo", locationInfo, 365);
                document.getElementById("ip-info").innerText = ipInfo;
                document.getElementById("location-info").innerText = locationInfo;
            });
        }
        if ('requestIdleCallback' in window) {
            requestIdleCallback(fetchIPAndLocation);
        } else {
            setTimeout(fetchIPAndLocation, 2000);
        }
    }
});






// Define the folder paths where the images are stored
const folderPath = 'images/Icons/';
const originalsFolderPath = 'images/Icons/originals/';

// Image names loaded from manifest (kept in sync with Are.na by GitHub Action)
let imageNames = [];

// Load image count from manifest
async function loadImageManifest() {
    const response = await fetch(folderPath + 'manifest.json');
    const data = await response.json();
    for (let i = 1; i <= data.count; i++) {
        imageNames.push(`image${i}.jpg`);
    }
}

// Cryptographically strong random number in [0, 1)
function cryptoRandom() {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xFFFFFFFF + 1);
}

// Function to randomly select n unique images from the provided image array
function getRandomImages(imageArray, count) {
    // Fisher-Yates shuffle with crypto-strength randomness
    const shuffled = [...imageArray];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(cryptoRandom() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
}

// Track page load state
let pageFullyLoaded = false;
let pendingFinalize = null;

// Mark page as fully loaded when all resources are ready
window.addEventListener('load', () => {
    pageFullyLoaded = true;
    // If animation was waiting to finish, finalize now
    if (pendingFinalize) {
        pendingFinalize();
        pendingFinalize = null;
    }
});

// Start animation as soon as DOM is ready (much earlier than window.onload)
document.addEventListener("DOMContentLoaded", async function() {
    // Load image manifest from Are.na sync, then start shuffling
    await loadImageManifest();
    shuffleImagesRepeatedly();
});

// Function to simulate image shuffling multiple times before finalizing
function shuffleImagesRepeatedly() {
    const imgTags = document.querySelectorAll('img.icon'); // Select all img tags with the class 'icon'

    const totalShuffles = 40; // Total number of shuffles before finalizing
    const initialShuffleInterval = 50; // Initial shuffle interval in milliseconds
    const finalShuffleInterval = 500; // Final shuffle interval in milliseconds
    const changePoint = Math.floor(totalShuffles * (0.6)); // Point at which to start changing the interval

    // Phase 1: Pick a random subset of 30 images for the shuffle animation
    const shufflePoolSize = Math.min(30, imageNames.length);
    const shufflePool = getRandomImages(imageNames, shufflePoolSize);

    // Phase 2: Pick 3 final images from the FULL pool (independent of shuffle pool)
    const finalImages = getRandomImages(imageNames, imgTags.length);

    // Preload only the shuffle pool (30 images instead of all 125+)
    // Track which images actually loaded successfully
    const loadedShuffleImages = new Set();
    const preloadPromises = shufflePool.map(image => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => { loadedShuffleImages.add(image); resolve(); };
            img.onerror = resolve; // Resolve even on error to not block animation
            img.src = folderPath + image;
        });
    });

    // Preload the 3 final original-resolution images in parallel
    // These load during the shuffle animation so they're ready at the end
    const finalOriginalsReady = Promise.all(finalImages.map(image => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = originalsFolderPath + image;
        });
    }));

    // Also preload the thumbnail versions of final images (for the icon display)
    finalImages.forEach(image => {
        const img = new Image();
        img.src = folderPath + image;
    });

    // Wait for shuffle pool to preload, then start the animation
    Promise.all(preloadPromises).then(() => {
        // Filter to only successfully loaded images
        const availableShufflePool = shufflePool.filter(name => loadedShuffleImages.has(name));
        // Fallback: if nothing loaded, use the full imageNames array
        const animationPool = availableShufflePool.length > 0 ? availableShufflePool : imageNames;
        startShuffleAnimation(animationPool);
    });

    // Function to calculate the current shuffle interval
    function getShuffleInterval(shuffleCount, totalShuffles, initialInterval, finalInterval, changePoint) {
        if (shuffleCount < changePoint) {
            return initialInterval;
        } else {
            const progress = (shuffleCount - changePoint) / (totalShuffles - changePoint);
            const interval = initialInterval + (finalInterval - initialInterval) * progress;
            return interval;
        }
    }

    // Function to start the shuffle animation after images are preloaded
    function startShuffleAnimation(animationPool) {
        let shuffleCount = 0; // Counter to track the number of shuffles

        // Function to perform a single shuffle
        function performShuffle() {
            if (shuffleCount < totalShuffles) {
                // During animation, show random images from the preloaded pool
                const randomImages = getRandomImages(animationPool, imgTags.length);

                // Assign each random image to the corresponding img tag
                randomImages.forEach((image, index) => {
                    if (imgTags[index]) {
                        imgTags[index].style.display = 'block';
                        imgTags[index].src = folderPath + image;
                    }
                });

                shuffleCount++;

                // Schedule the next shuffle with the adjusted interval
                const nextInterval = getShuffleInterval(shuffleCount, totalShuffles, initialShuffleInterval, finalShuffleInterval, changePoint);
                setTimeout(performShuffle, nextInterval);
            } else {
                // Animation complete - show final thumbnails, wait for originals to finalize
                finalImages.forEach((image, index) => {
                    if (imgTags[index]) {
                        imgTags[index].src = folderPath + image;
                    }
                });

                finalOriginalsReady.then(() => {
                    if (pageFullyLoaded) {
                        finalizeImages(imgTags, finalImages);
                    } else {
                        pendingFinalize = () => finalizeImages(imgTags, finalImages);
                    }
                });
            }
        }

        // Start the shuffle process
        performShuffle();
    }
}

// Finalize the images - uses pre-determined final images passed from shuffleImagesRepeatedly
function finalizeImages(imgTags, finalImages) {
    // Create duplicates of the finalized images for the right half of the screen
    createDuplicateImages(imgTags, finalImages);

    // Add finalized class for mobile opacity transition
    imgTags.forEach(img => {
        img.classList.add('finalized');
    });

    // Trigger the rest of the page to load after final images are selected
    document.querySelector('.body-div').classList.remove('preload'); // Remove the preload class to reveal the rest of the page
}

// Function to create and position duplicate images on the right half of the screen
function createDuplicateImages(originalImgTags, finalImages) {
    // Find the background-full container
    const backgroundFull = document.querySelector('.background-full');
    
    if (!backgroundFull) {
        console.error('Could not find .background-full container');
        return;
    }
    
    // Create or select a container for the duplicated images
    let duplicateContainer = document.getElementById('duplicate-image-container');
    
    if (!duplicateContainer) {
        duplicateContainer = document.createElement('div');
        duplicateContainer.id = 'duplicate-image-container';
        duplicateContainer.style.position = 'fixed';
        duplicateContainer.style.right = '0';
        duplicateContainer.style.top = '0';
        duplicateContainer.style.width = '50%';
        duplicateContainer.style.height = '100vh';
        duplicateContainer.style.overflow = 'hidden';
        duplicateContainer.style.pointerEvents = 'none';
        duplicateContainer.style.zIndex = '-2';
        backgroundFull.appendChild(duplicateContainer);
    }

    // Clear any existing duplicates
    duplicateContainer.innerHTML = '';

    // Calculate the height for each image to fill the entire viewport evenly
    const viewportHeight = window.innerHeight;
    const imageHeight = viewportHeight / 3;

    // Create duplicates of the first 3 finalized images, stacked vertically edge-to-edge
    // Use original (full-resolution) images for high-quality display at large sizes
    for (let i = 0; i < Math.min(3, originalImgTags.length); i++) {
        const duplicate = document.createElement('img');
        duplicate.src = originalsFolderPath + finalImages[i];
        duplicate.className = 'icon-duplicate';
        
        // Set the specified CSS properties with calculated height
        duplicate.style.width = '100%';
        duplicate.style.height = `${imageHeight}px`;
        duplicate.style.display = 'block';
        duplicate.style.opacity = '0.3';
        
        duplicateContainer.appendChild(duplicate);
    }
}