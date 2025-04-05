const MIN_HEIGHT_TILL_AUTONEXT = 10
async function scrollToNextPageIfAtEnd(currentY, isEnd) {
    // Wait 500 ms to make sure the user can at least see whats in the footer
    // Citation: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
    await new Promise(resolve => setTimeout(resolve, 500))

    console.log(currentY)
    if (currentY == 0) {
        let path = window.location.pathname.split("?")[0]
        console.log(path)

        if (path.endsWith("portfolio.html")) {
            window.location.href = "./about.html"
        } else if (path.endsWith("about.html")) {
            window.location.href = "./"
        }
        return
    }

    if (!isEnd) {
        return // only proceed if the user has *finished* scrolling to improve user engagement
    }

    /*CITATION: https://developer.mozilla.org/en-US/docs/Web/API/Window/innerHeight and https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight for starting resources. Some experimentation in the browser devtools then brought me to scrollHeight and visualViewport.height (i still dont know what visualviewport is but the browser devtools says it exists and it seems to work for the purpose of determining end of page) */
    let pageHeight = document.querySelector("html").scrollHeight - visualViewport.height
    console.log(pageHeight, currentY, pageHeight - currentY)

    if (pageHeight - currentY > MIN_HEIGHT_TILL_AUTONEXT) {
        return
    }

    let path = window.location.pathname.split("?")[0]
    console.log(path)

    if (path.endsWith("about.html")) {
        window.location.href = "./portfolio.html"
    } else if (path.endsWith("portfolio.html")) {
        // Do nothing
    } else {
        window.location.href = "./about.html"
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let tickingA = false;
    window.addEventListener("scroll", (evt) => {
        // CITATION: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
        let lastKnownScrollPosition = window.scrollY
        if (!tickingA) {
            window.requestAnimationFrame(() => {
                scrollToNextPageIfAtEnd(lastKnownScrollPosition, false)
                tickingA = false;
            })
        }

        tickingA = true;
    })

    let tickingB = false;
    window.addEventListener("scrollend", (evt) => {
        // CITATION: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
        let lastKnownScrollPosition = window.scrollY
        if (!tickingB) {
            window.requestAnimationFrame(() => {
                scrollToNextPageIfAtEnd(lastKnownScrollPosition, true)
                tickingB = false;
            })
        }

        tickingB = true;
    })
})