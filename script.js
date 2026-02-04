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






// Define the folder path where the images are stored
const folderPath = 'images/Icons/'; // Update this to your actual folder path

// Generate the image names dynamically based on the total number of images
function generateImageNames(count) {
    const imageNames = [];
    // Loop from 1 to the specified count to generate image file names
    for (let i = 1; i <= count; i++) {
        imageNames.push(`image${i}.jpg`); // Create file names like image1.jpg, image2.jpg, etc.
    }
    return imageNames; // Return the array of generated image names
}

// Specify the total number of images available in the folder
const totalImages = 65; // Update this number as needed to match the number of images in your folder
const imageNames = generateImageNames(totalImages); // Generate the image name list

// Function to randomly select n unique images from the provided image array
function getRandomImages(imageArray, count) {
    // Shuffle the array randomly and pick the first `count` elements
    const shuffled = [...imageArray].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count); // Return the selected images
}

window.onload = () => {
    // Function to calculate and fix the positions of the icon images
    function fixIconPositions() {
        const icons = document.querySelectorAll('img.icon');

        icons.forEach(icon => {
            const rect = icon.getBoundingClientRect();
            const top = rect.top + window.scrollY;
            const bottom = window.innerHeight - rect.bottom + window.scrollY;

            // Set the fixed positions
            icon.style.top = `${top}px`;
            icon.style.bottom = 'auto'; // Ensure bottom is not set
            icon.style.display = 'block'; // Make the image visible
        });
    }

    // Start the image shuffling process
    shuffleImagesRepeatedly();

    // Fix the positions of the icon images after shuffling
    setTimeout(fixIconPositions, 1000); // Adjust the timeout as needed
};

// Function to simulate image shuffling multiple times before finalizing
function shuffleImagesRepeatedly() {
    const imgTags = document.querySelectorAll('img.icon'); // Select all img tags with the class 'icon'

    let shuffleCount = 0; // Counter to track the number of shuffles
    const totalShuffles = 20; // Total number of shuffles before finalizing
    const initialShuffleInterval = 50; // Initial shuffle interval in milliseconds
    const finalShuffleInterval = 500; // Final shuffle interval in milliseconds
    const changePoint = Math.floor(totalShuffles * (0.6)); // Point at which to start changing the interval

    // Preload all images to avoid delays
    const preloadImages = new Set();
    imageNames.forEach(image => {
        const img = new Image();
        img.src = folderPath + image;
        preloadImages.add(img);
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

    // Function to perform a single shuffle
    function performShuffle() {
        const randomImages = getRandomImages(imageNames, imgTags.length); // Get a new set of random images

        // Assign each random image to the corresponding img tag
        randomImages.forEach((image, index) => {
            if (imgTags[index]) { // Check if the img tag exists
                imgTags[index].style.display = 'block'; // Make the image visible
                imgTags[index].src = folderPath + image; // Set the src attribute to the random image
            }
        });

        shuffleCount++; // Increment the shuffle counter
        if (shuffleCount >= totalShuffles) {
            finalizeImages(imgTags); // Call the function to finalize the images
        } else {
            // Schedule the next shuffle with the adjusted interval
            const nextInterval = getShuffleInterval(shuffleCount, totalShuffles, initialShuffleInterval, finalShuffleInterval, changePoint);
            setTimeout(performShuffle, nextInterval);
        }
    }

    // Start the shuffle process
    performShuffle();
}

// Finalize the images by selecting a final random image for each img tag
function finalizeImages(imgTags) {
    const finalImages = getRandomImages(imageNames, imgTags.length); // Select the final set of random images

    // Assign each final image to the corresponding img tag
    finalImages.forEach((image, index) => {
        if (imgTags[index]) { // Check if the img tag exists
            imgTags[index].src = folderPath + image; // Set the src attribute to the final image
        }
    });

    // Create duplicates of the finalized images for the right half of the screen
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
    for (let i = 0; i < Math.min(3, originalImgTags.length); i++) {
        const duplicate = document.createElement('img');
        duplicate.src = originalImgTags[i].src;
        duplicate.className = 'icon-duplicate';
        
        // Set the specified CSS properties with calculated height
        duplicate.style.width = '700px';
        duplicate.style.height = `${imageHeight}px`;
        duplicate.style.display = 'block';
        duplicate.style.opacity = '0.3';
        
        duplicateContainer.appendChild(duplicate);
    }
}