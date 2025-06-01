chrome.webNavigation.onCompleted.addListener(handleNavigation);

chrome.webNavigation.onHistoryStateUpdated.addListener(details => {
    setTimeout(() => {
        handleNavigation(details);
    }, 2500);
});

async function handleNavigation(details) {
    const currentUrl = details.url;

    if (details.frameId !== 0 || currentUrl === 'https://www.google.com/' || currentUrl.includes('www.youtubekids.com')) return; 

    try {

        if (currentUrl.includes("www.youtube.com")) {
            chrome.tabs.sendMessage(details.tabId, {
                action: "show_notification",
                url: currentUrl,
                extractedText: "",
                apiResponse: {
                    isReproved: true,
                },
                redirectURL: "https://www.youtubekids.com/"
            });
            return;
        }

        chrome.storage.local.get([currentUrl], (result) => {            
            
            if (result[currentUrl]) {
                console.log("Response retrieved from cache for the URL:", currentUrl);
                console.log(result[currentUrl]);

                chrome.tabs.sendMessage(details.tabId, {
                    action: "show_notification",
                    url: currentUrl,
                    apiResponse: result[currentUrl],
                    redirectURL: "https://www.google.com"
                });
            } else {
                chrome.tabs.sendMessage(details.tabId, {
                    action: "extract_html",
                    url: currentUrl,
                    redirectURL: "https://www.google.com"
                },
                    async (response) => {

                        if (chrome.runtime.lastError) {
                            console.error(
                                "Error sending message to the content script:",
                                chrome.runtime.lastError.message
                            );
                            return;
                        }

                        if (!response || !response.htmlChunks) {
                            console.error(
                                "No response or HTML received from the content script."
                            );
                            return;
                        }

                        const extractedText = response.htmlChunks;
                        console.log(extractedText);

                        try {
                            const apiResponse = await sendPostRequest(currentUrl, extractedText);

                            let time = 60 * 60 * 1 * 1000; // 1H
                            if (apiResponse.isReproved) time = 60 * 60 * 3 * 1000; // 3H

                            saveCacheResponse(apiResponse, currentUrl, time)

                            chrome.tabs.sendMessage(details.tabId, {
                                action: "show_notification",
                                url: currentUrl,
                                extractedText: extractedText,
                                apiResponse: apiResponse,
                                redirectURL: "https://www.google.com"
                            });
                        } catch (error) {
                            console.error("Error sending POST request:", error);
                        }
                    }
                );
            }
        });
    } catch (error) {
        console.error("Error processing navigation:", error);
    }
}

async function sendPostRequest(url, htmlChunks) {
    try {
        const request = {
            textChunks: htmlChunks,
            url: url,
        };

        const body = JSON.stringify(request);

        const response = await fetch("http://localhost:3333/text", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: body,
        });

        if (!response.ok) {
            throw new Error(
                `Error in POST request: ${response.status} ${response.statusText}`
            );
        }

        const result = await response.json();
        console.log(result);
        return result;
    } catch (error) {
        console.error("Error sending the POST request:", error);
        throw error;
    }
}

function saveCacheResponse(apiResponse, url, expirationTime) {
    try {
        const currentTime = Date.now();
        const cacheData = {
            [url]: {
                isReproved: apiResponse.isReproved,
                timestamp: currentTime
            }
        };

        removeExpiredCache(currentTime, expirationTime);

        chrome.storage.local.set(cacheData, () => {
            if (chrome.runtime.lastError) {
                console.error("Error saving to cache:", chrome.runtime.lastError.message);
            } else {
                console.log("Response saved to cache for the URL:", url);
            }
        });
    } catch (error) {
        console.error("Error saving to cache:", error);
    }
}

function removeExpiredCache(currentTime, expirationTime) {
    chrome.storage.local.get(null, (result) => {
        if (chrome.runtime.lastError) {
            console.error("Error accessing the cache:", chrome.runtime.lastError.message);
            return;
        }

        for (const url in result) {
            const cachedData = result[url];

            if (cachedData && (currentTime - cachedData.timestamp) > expirationTime) {
                chrome.storage.local.remove(url, () => {
                    if (chrome.runtime.lastError) {
                        console.error(`Error removing expired cache for ${url}:`, chrome.runtime.lastError.message);
                    } else {
                        console.log(`Cache expired and removed for the URL: ${url}`);
                    }
                });
            }
        }
    });
}