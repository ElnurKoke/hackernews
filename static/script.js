const postsContainer = document.getElementById('posts');
const loadMoreButton = document.getElementById('load-more');
let lastItemIndex = 0;
let postType = 'newstories';
let maxId=0;

async function fetchPostIds() {
  const response = await fetch(`https://hacker-news.firebaseio.com/v0/${postType}.json`);
  const rmaxid = await fetch(`https://hacker-news.firebaseio.com/v0/maxitem.json`);
  const postIds = await response.json();
  const maxid = await rmaxid.json();
  return postIds.slice(lastItemIndex, lastItemIndex + 10);
}

async function fetchMaxId() {
  const rmaxid = await fetch(`https://hacker-news.firebaseio.com/v0/maxitem.json`);
  const maxid = await rmaxid.json();
  return maxid;
}

async function fetchPostDetails(postId) {
  const response = await fetch(`https://hacker-news.firebaseio.com/v0/item/${postId}.json`);
  return response.json();
}

async function displayLiveData(){
  const maxitem = await fetchMaxId();
  console.log(maxId)
  if (maxId<maxitem){
    const post = await fetchPostDetails(maxitem);
    let container1Content = document.getElementById('container1').innerHTML;
    let container2Content = document.getElementById('container2').innerHTML;
    document.getElementById('container1').innerHTML = generatePostHTML(post);
    document.getElementById('container2').innerHTML = container1Content; 
    document.getElementById('container3').innerHTML = container2Content;
    maxId = maxitem;
    }
}

async function displayPosts() {
  const postIds = await fetchPostIds();
  for (const id of postIds) {
    const post = await fetchPostDetails(id);
    const postElement = document.createElement('div');
    postElement.className = 'post';
    postElement.innerHTML = generatePostHTML(post);
    postsContainer.appendChild(postElement);
    if (post.type === 'story' || post.type === 'poll') {
      await fetchComments(post.id);
    }
  }
  lastItemIndex += 10;
  console.log(lastItemIndex+"\n");
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
      return `<p>error type post:${post.type}</p>`;
  }
}

loadMoreButton.addEventListener('click', displayPosts);

displayLiveData();

displayPosts();



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
          strongElement.innerHTML = `<strong> ↪️  ${post.by}(${post.text.substring(0,7)}...)</strong>`;
          commentElement.appendChild(strongElement);
        };
        const postContent = generatePostHTML(comment);
        const contentContainer = document.createElement('div');
        contentContainer.innerHTML = postContent;
        commentElement.appendChild(contentContainer);

        const postsContainer = document.getElementById('posts');
        postsContainer.appendChild(commentElement);

        if (commentId.kids){
          console.log(comment.by+"- Recourses comm \n");
          await fetchComments(commentId);
        }
      }
    }
  }

  async function checkForUpdates() {
    const latestPostIds = await fetchPostIds();
    if (latestPostIds[0] > lastItemIndex) {
      displayPosts();
    }
  }
  
  setInterval(checkForUpdates, 5000); 
  
  setInterval(displayLiveData, 4000); 

  

  function throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }
  }
  
  window.addEventListener('scroll', throttle(() => {
    if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
      displayPosts();
    }
  }, 2000));
  