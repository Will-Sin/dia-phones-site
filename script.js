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

        // Get IP and location information
        getIPAndLocationInfo(function ({ ipInfo, locationInfo }) {
            setCookie("ipInfo", ipInfo, 365);
            setCookie("locationInfo", locationInfo, 365);
            document.getElementById("ip-info").innerText = ipInfo;
            document.getElementById("location-info").innerText = locationInfo;
        });
    }
});






// Are.na channel configuration
const ARENA_CHANNEL_SLUG = 'dia-phone-site';
const ARENA_API_BASE = `https://api.are.na/v2/channels/${ARENA_CHANNEL_SLUG}`;

// Store image data fetched from Are.na (with multiple sizes)
let imageData = [];

// Fetch all images from Are.na API (handles pagination)
async function fetchArenaImages() {
    try {
        // First, get channel info to know total content count
        const channelResponse = await fetch(ARENA_API_BASE);
        if (!channelResponse.ok) {
            throw new Error(`Are.na API error: ${channelResponse.status}`);
        }
        const channelData = await channelResponse.json();
        const totalCount = channelData.length; // Total number of blocks in channel

        // Fetch all pages (100 items per page is the max)
        const perPage = 100;
        const totalPages = Math.ceil(totalCount / perPage);
        const allContents = [];

        for (let page = 1; page <= totalPages; page++) {
            const response = await fetch(`${ARENA_API_BASE}/contents?per=${perPage}&page=${page}`);
            if (!response.ok) {
                throw new Error(`Are.na API error: ${response.status}`);
            }
            const data = await response.json();
            allContents.push(...data.contents);
        }

        // Filter for image blocks and extract both thumbnail and large URLs
        const images = allContents
            .filter(block => block.class === 'Image' && block.image)
            .map(block => ({
                // Use square or thumb for small icons (faster loading during shuffle)
                thumb: block.image.square?.url || block.image.thumb?.url || block.image.display?.url,
                // Use display or large for the right-side duplicates
                large: block.image.display?.url || block.image.large?.url || block.image.original?.url
            }))
            .filter(img => img.thumb && img.large); // Ensure both URLs exist

        console.log(`Loaded ${images.length} images from Are.na`);
        return images;
    } catch (error) {
        console.error('Error fetching Are.na images:', error);
        return [];
    }
}

// Function to randomly select n unique images from the provided image array
function getRandomImages(imageArray, count) {
    // Shuffle the array randomly and pick the first `count` elements
    const shuffled = [...imageArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count); // Return the selected images
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
    // Fetch images from Are.na first
    imageData = await fetchArenaImages();

    if (imageData.length === 0) {
        console.warn('No images loaded from Are.na, icons will not display');
        // Still reveal the page content even if images fail
        document.querySelector('.body-div')?.classList.remove('preload');
        return;
    }

    // Start the image shuffling process
    shuffleImagesRepeatedly();
});

// Function to simulate image shuffling multiple times before finalizing
function shuffleImagesRepeatedly() {
    const imgTags = document.querySelectorAll('img.icon'); // Select all img tags with the class 'icon'

    const totalShuffles = 20; // Total number of shuffles before finalizing
    const initialShuffleInterval = 50; // Initial shuffle interval in milliseconds
    const finalShuffleInterval = 500; // Final shuffle interval in milliseconds
    const changePoint = Math.floor(totalShuffles * (0.6)); // Point at which to start changing the interval

    // Pre-determine the final images at the START of animation
    // This ensures consistent final images regardless of load timing
    const finalImages = getRandomImages(imageData, imgTags.length);

    // Only preload thumbnails for faster initial load (used in shuffle animation)
    const preloadPromises = imageData.map(img => {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = resolve;
            image.onerror = resolve; // Resolve even on error to not block animation
            image.src = img.thumb;
        });
    });

    // Wait for thumbnails to preload, then start the animation
    Promise.all(preloadPromises).then(() => {
        startShuffleAnimation();
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
    function startShuffleAnimation() {
        let shuffleCount = 0; // Counter to track the number of shuffles

        // Function to perform a single shuffle
        function performShuffle() {
            // During shuffling, show random images (but NOT the final images yet)
            let randomImages;
            if (shuffleCount < totalShuffles - 1) {
                // During animation, show random images
                randomImages = getRandomImages(imageData, imgTags.length);
            } else {
                // On the last shuffle, transition to the pre-determined final images
                randomImages = finalImages;
            }

            // Assign each random image to the corresponding img tag (use thumbnails for performance)
            randomImages.forEach((img, index) => {
                if (imgTags[index]) { // Check if the img tag exists
                    imgTags[index].style.display = 'block'; // Make the image visible
                    imgTags[index].src = img.thumb; // Use thumbnail for fast shuffle animation
                }
            });

            shuffleCount++; // Increment the shuffle counter

            // Check if animation is complete
            if (shuffleCount >= totalShuffles) {
                // Animation complete - final images are already displayed
                // Now just wait for page to fully load before revealing content
                if (pageFullyLoaded) {
                    finalizeImages(imgTags, finalImages);
                } else {
                    // Page not loaded yet - wait without changing images
                    // The final images stay displayed while we wait
                    pendingFinalize = () => finalizeImages(imgTags, finalImages);
                }
            } else {
                // Schedule the next shuffle with the adjusted interval
                const nextInterval = getShuffleInterval(shuffleCount, totalShuffles, initialShuffleInterval, finalShuffleInterval, changePoint);
                setTimeout(performShuffle, nextInterval);
            }
        }

        // Start the shuffle process
        performShuffle();
    }
}

// Finalize the images - uses pre-determined final images passed from shuffleImagesRepeatedly
function finalizeImages(imgTags, finalImages) {
    // Final images are already displayed from the last shuffle
    // Just ensure they're set (in case this is called directly)
    if (finalImages) {
        finalImages.forEach((img, index) => {
            if (imgTags[index]) {
                imgTags[index].src = img.thumb; // Keep thumbnails for small icons
            }
        });
    }

    // Create duplicates using larger images for the right half of the screen
    createDuplicateImages(imgTags, finalImages);

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
    // Use larger images for better quality at this size
    for (let i = 0; i < Math.min(3, finalImages.length); i++) {
        const duplicate = document.createElement('img');
        duplicate.src = finalImages[i].large; // Use large version for right-side duplicates
        duplicate.className = 'icon-duplicate';
        
        // Set the specified CSS properties with calculated height
        duplicate.style.width = '700px';
        duplicate.style.height = `${imageHeight}px`;
        duplicate.style.display = 'block';
        duplicate.style.opacity = '0.3';
        
        duplicateContainer.appendChild(duplicate);
    }
}