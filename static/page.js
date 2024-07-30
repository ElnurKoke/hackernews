const content = document.getElementById('content');
let commentCount = 0;

function getParameterByName(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
}
const id = getParameterByName('id');

async function fetchPostDetails(postId) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${postId}.json`);
    return response.json();
}

async function fetchComments(postId) {
    const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${postId}.json`);
    const post = await response.json();
    if (post.kids) {
    for (const commentId of (post.kids).sort((a, b) => b - a)) {
        const comment = await fetchPostDetails(commentId);
        const commentElement = document.createElement('div');
        commentElement.className = 'comment';
        if (post.type == 'comment'){
            const strongElement = document.createElement('p');
            const commentText = post.text ? post.text.substring(0, 7) + '...' : 'No content';
            strongElement.innerHTML = `<strong> ↪️ ${post.by}(${commentText})</strong>`;
            commentElement.appendChild(strongElement);
        };
        const postContent = generatePostHTML(comment);
        const contentContainer = document.createElement('div');
        contentContainer.innerHTML = postContent;
        commentElement.appendChild(contentContainer);

        content.appendChild(commentElement);

        if (comment.kids && comment.kids.length > 0){
            console.log(comment.by+"- Recourses comm \n");
            await fetchComments(commentId);
        }
    }
}
}


async function displayPost() {
    const post = await fetchPostDetails(id);
    const postElement = document.createElement('div');
    postElement.className = 'main-content';
    postElement.innerHTML = generatePostHTML(post);
    content.appendChild(postElement);
    if (post.type === 'story' || post.type === 'poll' || post.type === 'comment') {
        await fetchComments(post.id);
    }
}

function formatUnixTime(unixTime, timezoneOffset) {
    if (unixTime === null) {
        throw new Error("time cant be null");
    }
    let date = new Date(unixTime * 1000);
    let year = date.getUTCFullYear();
    let month = (date.getUTCMonth() + 1).toString().padStart(2, '0'); 
    let day = date.getUTCDate().toString().padStart(2, '0');
    let hours = date.getUTCHours() + timezoneOffset;
    let minutes = date.getUTCMinutes().toString().padStart(2, '0');
    let seconds = date.getUTCSeconds().toString().padStart(2, '0');
    if (hours >= 24) {
        hours -= 24;
        let nextDay = new Date(date);
        nextDay.setUTCDate(date.getUTCDate() + 1);
        day = nextDay.getUTCDate().toString().padStart(2, '0');
    } else if (hours < 0) {
        hours += 24;
        let prevDay = new Date(date);
        prevDay.setUTCDate(date.getUTCDate() - 1);
        day = prevDay.getUTCDate().toString().padStart(2, '0');
    }

    return `${day}/${month}/${year} ${hours.toString().padStart(2, '0')}:${minutes}:${seconds}`;
}

function generatePostHTML(post) {
    let date = formatUnixTime(post.time, 5);
    switch (post.type) {
        case 'story':
        return `
            <i><a href="page?id=${post.id}">story</a></i>
            <h2>${post.title}</h2>
            <p>author: ${post.by}</p>
            <a href="${post.url}" target="_blank">learn more</a>
            <p style="text-align: right;color:grey;">${date}</p>
        `;
        case 'job':
        return `
            <i>job</i>
            <h2>${post.title}</h2>
            <p>author:${post.by}</p>
            <a href="${post.url}" target="_blank">learn more</a>
            <p style="text-align: right;color:grey;">${date}</p>
        `;
        case 'poll':
        return `
            <i>poll</i>
            <h2>${post.title}</h2>
            <p>author:${post.by}</p>
            <p>${post.text}</p>
            <strong>Parts:</strong>
            <ul>
            ${post.parts.map(part => `<li><span class="part-id"><a href="page?id=${part}">${part}</a></span></li>`).join('')}
            </ul>
            <strong>Comment:</strong>
            <p style="text-align: right;color:grey;">${date}</p>
        `;
        case 'comment':
        return `
            <a href="page?id=${post.parent}">🔍head content</a>
            <a href="page?id=${post.id}">
            <p><strong>${post.by}</strong>:</a> ${post.text}</p>
            <p style="text-align: right;color:grey;">${date}</p>
        `;
        default:
        return `<p>error type post</p>`;
    }
}
displayPost();
// setInterval(displayPost, 5000); 