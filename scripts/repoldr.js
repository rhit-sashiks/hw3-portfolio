let startUrl = `https://api.github.com/users/cheesycod/repos`
const MAX_REPOS_WITH_FORKS = 10
const featuredOrgs = ["cheesycod", "Anti-Raid", "InfinityBotList"]

async function createError(rootEl, resp, context) {
    let errEl = document.createElement("p");
    errEl.classList.add("error");

    let error = "Something went wrong while trying to fetch repo contents"

    if (resp) {
        try {
            error = (await resp.json())["message"]
        } catch (err) {
            console.error(err)
        }
    }

    errEl.textContent = error

    if (context) {
        errEl.textContent = `${context}: ${errEl.textContent}`
    }

    rootEl.appendChild(errEl);
}

async function cachedFetch(url, times) {
    if (localStorage.getItem(url)) {
        // Return a new response to the caller containing the cached content
        return new Response(localStorage.getItem(url))
    } else {
        // I prefer fetch to XMLHttpRequest since it's just an easier API to actually use.
        //
        // I also prefer async function over Promise.then usually as well so I might just be weird that way :)
        let resp = await fetch(url)
        console.log(`resp status: ${resp.status}`)

        if (resp.status == 429) {
            times = times || 0

            if (times > 10) {
                throw new Error(`Failed to fetch url ${url} due to running into ratelimits over ${times} times!`)
            }

            let retryAfter = parseFloat(resp.headers.get("Retry-After") || "10") || 10

            // Citation: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
            await new Promise(resolve => setTimeout(resolve, retryAfter * (2 ** times) * 1000))

            return await cachedFetch(url, times + 1)
        }

        if (resp.status === 403) {
            console.log("403 case entered")
            times = times || 0

            if (times > 10) {
                throw new Error(`Failed to fetch url ${url} due to running into ratelimits over ${times} times!`)
            }

            console.log("is here")

            let retryAfterF = parseFloat(resp.headers.get("x-ratelimit-reset") || "")

            let retryAfter = retryAfterF ? ((retryAfterF - Date.now() / 1000) + 10) : 60

            console.log(`Waiting ${retryAfter}`)

            // Citation: https://stackoverflow.com/questions/951021/what-is-the-javascript-version-of-sleep
            await new Promise(resolve => setTimeout(resolve, retryAfter * (2 ** times) * 1000))

            return await cachedFetch(url, times + 1)
        }
        return resp
    }
}

async function createReposOnRoot(rootEl, repo, careAboutForks, level) {
    if (level === undefined) throw new Error("undefined level")
    let name = repo.name
    let description = repo.description
    let htmlUrl = repo.html_url
    let license = repo.license

    let forkedFromName = null
    let forkedFromHtmlUrl = null

    let projectBox = document.createElement("section")
    projectBox.classList.add("card")

    if (repo.fork && careAboutForks) {
        // Get the parent repo to handle forks
        let parentRepo = await cachedFetch(repo.url)
        if (!parentRepo.ok) {
            await createError(rootEl, parentRepo)
        } else {
            let parentRepoData = await parentRepo.json();
            forkedFromName = parentRepoData.parent.full_name
            forkedFromHtmlUrl = parentRepoData.parent.html_url
            console.log("fork repo data", parentRepoData.parent)
            localStorage.setItem(repo.url, JSON.stringify(parentRepoData))
        }
    }

    let nameElement = document.createElement(`h${level}`)
    nameElement.textContent = name
    let descriptionElement = document.createElement("p")
    descriptionElement.textContent = description
    let viewRepoLink = document.createElement("a")
    viewRepoLink.href = htmlUrl
    viewRepoLink.textContent = "View Repository Here"

    projectBox.appendChild(nameElement)

    if (forkedFromHtmlUrl) {
        console.log("adding fork el")
        let forkedFromEl = document.createElement("p")
        forkedFromEl.innerHTML = `<em>Forked from <a href='${forkedFromHtmlUrl}'>${forkedFromName}</a></em>`
        projectBox.appendChild(forkedFromEl)
    }

    projectBox.appendChild(descriptionElement)

    if (license) {
        let licenseEl = document.createElement("p")
        licenseEl.textContent = `License: ${license.name} [${license.spdx_id}]`
        projectBox.appendChild(licenseEl)
    }

    projectBox.appendChild(viewRepoLink)
    rootEl.appendChild(projectBox)

    //console.log(repo)
}

async function createRepoList(rootEl, careAboutForks) {
    // Add loading text
    let loadingEl = document.createElement("p")
    loadingEl.textContent = "Loading data for featured orgs"
    rootEl.appendChild(loadingEl)

    let numReposWithForks = 0
    for (let org of featuredOrgs) {
        console.log(org)
        let url = `https://api.github.com/users/${org}/repos?per_page=100&sort=updated`
        let repoData = await cachedFetch(url) // Fetch from github API
        if (!repoData.ok) {
            await createError(rootEl, repoData, `Error while fetching ${org}`)
            continue
        }

        let repoList = null
        try {
            repoList = await repoData.json()
        } catch (err) {
            await createError(rootEl, repoData, `Error while fetching ${org}`)
            continue
        }
        localStorage.setItem(url, JSON.stringify(repoList))

        orgSection = document.createElement("section")
        orgNameEl = document.createElement("h2")
        orgNameEl.classList.add("gitrepoorgname")
        orgNameEl.textContent = org
        orgSection.appendChild(orgNameEl)

        let orgRepos = document.createElement("div")
        orgRepos.classList.add("gh-project-cards")
        orgSection.appendChild(orgRepos)

        for (let repo of repoList) {
            if (repo.fork) {
                numReposWithForks++
            }
            await createReposOnRoot(orgRepos, repo, careAboutForks && numReposWithForks < MAX_REPOS_WITH_FORKS, 3) // No fork detection for orgs to avoid spamming github
        }
        rootEl.appendChild(orgSection)
    }

    loadingEl.remove()
}

document.addEventListener("DOMContentLoaded", () => {
    let rootElOuter = document.querySelector("#github-project-area")
    let rootEl = document.createElement("div")
    rootEl.id = "a" // this is what is first presented to users
    rootElOuter.appendChild(rootEl)

    createRepoList(rootEl, false)
        .then(() => {
            console.log("am done with base")
            let rootElTwo = document.createElement("div")
            rootElTwo.id = "b"
            rootElTwo.style.display = "none" // hide the second div initially in background until its finished loading
            rootElOuter.appendChild(rootElTwo)

            // Render with forks in a hidden div
            createRepoList(rootElTwo, true)
                .then(() => {
                    console.log("am done with fork")
                    rootElTwo.style.display = ""
                    rootEl.remove()
                })
                .catch((err) => {
                    console.error(err)
                    createError(rootEl, null, `Failed to render projects [${err}]`)
                })
        })
        .catch((err) => {
            console.error(err)
            createError(rootEl, null, `Failed to render projects [${err}]`)
        })
})