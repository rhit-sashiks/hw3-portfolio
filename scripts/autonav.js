const MIN_HEIGHT_TILL_AUTONEXT = 10
function scrollToNextPageIfAtEnd(currentY, isEnd) {
    console.log(currentY)
    if (currentY == 0) {
        let path = window.location.pathname.split("?")[0]
        console.log(path)

        if (path.endsWith("portfolio.html")) {
            window.location.href = "./about.html"
        }
        return
    }

    if (!isEnd) {
        return
    }

    /*CITATION: https://developer.mozilla.org/en-US/docs/Web/API/Window/innerHeight and https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight for starting resources and then a ton of experimentation in the browser devtools*/
    let pageHeight = document.querySelector("html").scrollHeight - visualViewport.height
    console.log(pageHeight, currentY, pageHeight - currentY)

    if (pageHeight - currentY > MIN_HEIGHT_TILL_AUTONEXT) {
        return
    }

    let path = window.location.pathname.split("?")[0]
    console.log(path)

    if (path.endsWith("about.html")) {
        window.location.href = "./portfolio.html"
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