let startUrl = `https://api.github.com/users/cheesycod/repos`
const featuredOrgs = ["Anti-Raid"]

async function createError(rootEl, resp) {
    let errEl = document.createElement("p");
    errEl.classList.add("error");

    let error = "Something went wrong while trying to fetch repo contents"

    try {
        error = (await resp.json())["message"]
    } catch (err) {
        console.error(err)
    }

    errEl.textContent = error
    rootEl.appendChild(err);
}

async function cachedFetch(url) {
    if (localStorage.getItem(url)) {
        // Return a new response to the caller containing the cached content
        return new Response(localStorage.getItem(url))
    } else {
        return await fetch(url)
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

    if (repo.fork && careAboutForks) {
        // Get the parent repo to handle forks
        let parentRepo = await cachedFetch(repo.url)
        if (!parentRepo.ok) {
            await createError(rootEl, parentRepo)
        } else {
            let parentRepoData = await parentRepo.json();
            forkedFromName = parentRepoData.parent.name
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
        console.log(forkedFromEl)
    }

    projectBox.appendChild(descriptionElement)
    projectBox.appendChild(viewRepoLink)
    rootEl.appendChild(projectBox)

    console.log(repo)
}

async function createRepoList(rootElSelector) {
    let rootEl = document.querySelector(rootElSelector)

    // Add loading text
    let loadingEl = document.createElement("p")
    loadingEl.textContent = "Loading data for cheesycod";
    rootEl.appendChild(loadingEl)

    // I prefer fetch to XMLHttpRequest since it's just an easier API to actually use.
    //
    // I also prefer async function over Promise.then usually as well so I might just be weird that way :)
    let repoData = await cachedFetch(startUrl) // Fetch from github API
    if (!repoData.ok) {
        await createError(rootEl, repoData)
        return
    }

    let repoList = null;
    try {
        repoList = await repoData.json()
    } catch (err) {
        await createError(rootEl, repoData) // create a error
        return
    }
    localStorage.setItem(startUrl, JSON.stringify(repoList))
    for (let repo of repoList) {
        await createReposOnRoot(rootEl, repo, true, 3)
    }

    loadingEl.textContent = "Loading data for featured orgs"

    for (let org of featuredOrgs) {
        let url = `https://api.github.com/users/${org}/repos`
        let repoData = await cachedFetch(url) // Fetch from github API
        if (!repoData.ok) {
            await createError(rootEl, repoData)
            continue
        }

        let repoList = null
        try {
            repoList = await repoData.json()
        } catch (err) {
            await createError(rootEl, repoData)
            continue
        }
        localStorage.setItem(url, JSON.stringify(repoList))

        orgSection = document.createElement("section")
        orgNameEl = document.createElement("h3")
        orgNameEl.textContent = org
        orgSection.appendChild(orgNameEl)
        for (let repo of repoList) {
            await createReposOnRoot(orgSection, repo, false, 4)
        }
        rootEl.appendChild(orgSection)
    }

    loadingEl.remove()
}

document.addEventListener("DOMContentLoaded", () => {
    createRepoList("#github-project-area")
})