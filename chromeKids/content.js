chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {

    if (message.action === "extract_html") {
        try {
            const html = document.documentElement.outerHTML;
            const searchText = ["RTA-5042-1996-1400-1577-RTA", "PORN", "18+"];
            const containsText = isTextInMetaTag(html, searchText);
            
            if (containsText) {
                handleBlockedSite(true, message.redirectURL);
                return;
            }

            const extractedText = extractHeadAndBodyFromHtmlPage(html, message.url);

            sendResponse({ htmlChunks: extractedText });
        } catch (error) {
            sendResponse({ error: "Erro ao extrair HTML." });
        }
    } else if (message.action === "show_notification") {
        const { apiResponse, redirectURL } = message;

        try {
            await handleBlockedSite(apiResponse.isReproved, redirectURL);
            sendResponse({ message: "Notification displayed successfully!" });
        } catch (error) {
            sendResponse({ error: "Error showing the notification." });
        }
    }

    return true;
});

function extractHeadAndBodyFromHtmlPage(html) {
    try {
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, "text/html");

        dom.querySelectorAll("script, style, noscript, iframe, link").forEach((el) => el.remove());

        const metaTags = Array.from(dom.querySelectorAll("meta"))
            .map(meta => {
                const name = meta.getAttribute("name") || meta.getAttribute("property") || "";
                const content = meta.getAttribute("content") || "";
                return name && content ? `${name}=${content}` : "";
            })
            .filter(Boolean)
            .join("; ");

        const headText = dom.head?.textContent.trim() || "";
        const fullHeadText = metaTags ? `${metaTags}; ${headText}` : headText;
        const bodyText = dom.body?.textContent || "";

        let fullText = `head=${fullHeadText}; body=${bodyText}`;

        fullText = fullText.replace(/\s+/g, " ").trim();

        const textChunks = [];
        for (let i = 0; i < fullText.length; i += 10000) {
            textChunks.push(fullText.substring(i, i + 10000));
        }

        return textChunks;
    } catch (error) {
        throw error;
    }
}

function isTextInMetaTag(html, searchTexts) {
    try {
        const parser = new DOMParser();
        const dom = parser.parseFromString(html, "text/html");

        return Array.from(dom.querySelectorAll("meta"))
            .some(meta => {
                const content = (meta.getAttribute("content") || "").toLowerCase();
                return searchTexts.some(text => content.includes(text.toLowerCase()));
            });
    } catch (error) {
        console.error("Error parsing HTML:", error);
        return false;
    }
}



function handleBlockedSite(isReproved, redirectURL) {
    if (isReproved) {
        showNotificationForBlockedSite("Access to this site has been blocked. You will be redirected.", redirectURL);
    } else {
        showNotification("This site is accessible.");
    }
}

function showNotification(message) {
    const notification = document.createElement("div");
    notification.style.position = "fixed";
    notification.style.bottom = "20px";
    notification.style.right = "20px";
    notification.style.background = "rgba(0, 0, 0, 0.8)";
    notification.style.color = "white";
    notification.style.padding = "10px 20px";
    notification.style.borderRadius = "8px";
    notification.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.2)";
    notification.style.zIndex = "9999";
    notification.innerText = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 5000);
}

function showNotificationForBlockedSite(message, redirectURL) {
    document.body.style.cssText = `
        background: white !important;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        margin: 0;
        overflow: hidden;
    `;
    document.body.innerHTML = "";

    const notification = document.createElement("div");
    notification.style.cssText = `
        color: black;
        font-size: 30px;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
    `;

    notification.innerText = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        window.location.href = redirectURL ?? "https://www.google.com";
    }, 3000);
}

