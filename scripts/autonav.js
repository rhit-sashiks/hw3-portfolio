const MIN_HEIGHT_TILL_AUTONEXT = 10
async function scrollToNextPageIfAtEnd(isEnd) {
    let currentY = window.scrollY

    let scrollToTopBtn = document.querySelector("#scrolltotop-btn")
    if (currentY > 30) {
        scrollToTopBtn.classList.add("scrolltotop-btn-visible")
    } else {
        scrollToTopBtn.classList.remove("scrolltotop-btn-visible")
    }

    currentY = window.scrollY

    if (currentY == 0) {
        let path = window.location.pathname.split("?")[0]

        if (path.endsWith("portfolio.html")) {
            window.location.href = "./about.html"
        } else if (path.endsWith("about.html")) {
            window.location.href = "./"
        }
        return
    }

    if (isEnd) {
        return // only proceed if the user is still scrolling to improve user engagement
    }

    /*CITATION: https://developer.mozilla.org/en-US/docs/Web/API/Window/innerHeight and https://developer.mozilla.org/en-US/docs/Web/API/Element/clientHeight for starting resources. Some experimentation in the browser devtools then brought me to scrollHeight and visualViewport.height (i still dont know what visualviewport is but the browser devtools says it exists and it seems to work for the purpose of determining end of page) */
    let pageHeight = document.querySelector("html").scrollHeight - visualViewport.height
    console.log("pageHeight -> ", pageHeight, currentY, pageHeight - currentY)

    if (pageHeight - currentY <= 3) {
        let path = window.location.pathname.split("?")[0]

        if (path.endsWith("about.html")) {
            window.location.href = "./portfolio.html"
        } else if (path.endsWith("portfolio.html")) {
            // Do nothing
        } else {
            window.location.href = "./about.html"
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    let tickingA = false;
    let tickingB = false;

    let scrollToTopBtn = document.createElement("button")
    scrollToTopBtn.id = "scrolltotop-btn"
    scrollToTopBtn.textContent = "^"
    scrollToTopBtn.addEventListener("click", async (evt) => {
        tickingA = true
        tickingB = true
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        })

        // Wait till scroll finishes
        while (window.scrollY != 0) {
            // Citation: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
            await new Promise(resolve => setTimeout(resolve, 100))
            continue
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
        tickingA = false
        tickingB = false
    })
    document.body.appendChild(scrollToTopBtn)

    window.addEventListener("scroll", (evt) => {
        // CITATION: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
        if (!tickingA) {
            window.requestAnimationFrame(() => {
                scrollToNextPageIfAtEnd(false)
                tickingA = false;
            })
        }

        tickingA = true;
    })

    window.addEventListener("scrollend", (evt) => {
        // CITATION: https://developer.mozilla.org/en-US/docs/Web/API/Document/scroll_event
        if (!tickingB) {
            window.requestAnimationFrame(() => {
                scrollToNextPageIfAtEnd(true)
                tickingB = false;
            })
        }

        tickingB = true;
    })
})