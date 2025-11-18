let posts = [];
let users = [];
let comments = [];
let author
let currentAuthorFilter = null;


const authorList = document.getElementById('author-list');
const postsContainer = document.getElementById('posts-container');
const modal = document.getElementById('modal');
const closeModal = document.querySelector('.close');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const commentsList = document.getElementById('comments-list');
const createBtn = document.querySelector('.create-btn');
const modalForm = document.querySelector('.modal-form');
const formClose = document.querySelector('.form-close')

async function fetchData() {
  try {
    const [postsRes, usersRes, commentsRes, authorsRes] = await Promise.all([
      fetch('http://localhost:3000/posts'),
      fetch('http://localhost:3000/users'),
      fetch('http://localhost:3000/comments'),
      fetch('')
    ]);

    if (!postsRes.ok || !usersRes.ok || !commentsRes.ok) {
      throw new Error('Один из запросов вернул ошибку');
    }

    posts = await postsRes.json();
    users = await usersRes.json();
    comments = await commentsRes.json();
    
    posts = posts.map(post => {
     if (!post.hasOwnProperty('likes')) {
        post.likes = 0;
     }
     return post;
    });
    populateAuthors();

    renderPosts();
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    alert('Не удалось загрузить данные. Убедитесь, что json-server запущен на порту 3000.');
  }
}

function populateAuthors() {
  authorList.innerHTML = '';

  const allItem = document.createElement('li');
  allItem.textContent = 'Все';
  allItem.addEventListener('click', () => filterByAuthor(null));
  authorList.appendChild(allItem);

  const uniqueLastNames = new Set();
  posts.forEach(post => {
    const user = users.find(u => u.id === post.userId);
    if (user && user.name) {
      const lastName = user.name.trim().split(' ').pop();
      uniqueLastNames.add(lastName);
    }
  });

  uniqueLastNames.forEach(lastName => {
    const li = document.createElement('li');
    li.textContent = lastName;
    li.addEventListener('click', () => filterByAuthor(lastName));
    authorList.appendChild(li);
  });
}

function filterByAuthor(lastName) {
  currentAuthorFilter = lastName;
  renderPosts();

  Array.from(authorList.children).forEach(li => {
    const isActive = (lastName === null && li.textContent === 'Все') ||
                     (lastName && li.textContent === lastName);
    li.classList.toggle('active', isActive);
  });
}

function renderPosts() {
  postsContainer.innerHTML = '';

  const filteredPosts = currentAuthorFilter
    ? posts.filter(post => {
        const user = users.find(u => u.id === post.userId);
        return user && user.name.trim().split(' ').pop() === currentAuthorFilter;
      })
    : posts;

  filteredPosts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = 'post';

    const user = users.find(u => u.id === post.userId);
    const lastName = user ? user.name.trim().split(' ').pop() : 'Неизвестно';

    postEl.innerHTML = `
      <p><strong>Автор:</strong> ${lastName}</p>
      <p>${post.body.substring(0, 100)}${post.body.length > 100 ? '...' : ''}</p>
      <button class="read-more" data-id="${post.id}">Read More</button>
      <div class='like'>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="btn-like bi bi-heart-fill" viewBox="0 0 16 16">
  <path data-idpost=${post.id} class = "like-path" fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
      </svg>
      <span>${post.likes || 0}</span>
      </div>
    `;

    postsContainer.appendChild(postEl);
  });

  document.querySelectorAll('.read-more').forEach(button => {
    button.addEventListener('click', (e) => {
      const postId = parseInt(e.target.dataset.id, 10);
      showPostModal(postId); 
    });
  });
}

function showPostModal(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const user = users.find(u => u.id === post.userId);
  const postComments = comments.filter(c => c.postId === postId);

  modalTitle.textContent = post.title;
  modalBody.textContent = post.body;

  commentsList.innerHTML = '';
  postComments.forEach(comment => {
    const commentEl = document.createElement('li');
    commentEl.className = 'comment';
    commentEl.innerHTML = `
      <p><strong>${comment.name}</strong> (${comment.email})</p>
      <p>${comment.body}</p>
    `;
    commentsList.appendChild(commentEl);
  });

  modal.style.display = 'block';
}

if (closeModal) {
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (!authorList || !postsContainer || !modal) {
    console.error('Не найдены необходимые элементы в HTML!');
    return;
  }
  fetchData();
});


/*--------------лайки----------------*/ 
document.querySelector(".content").addEventListener('click', (e) => {
if(e.target.classList.contains("like-path")){
    let idPost = e.target.dataset.idpost;
    
    const post = posts.find(p => p.id == idPost);
    if (post) {
     post.likes = (post.likes || 0) + 1;
    
     const likeSpan = e.target.closest('.like').querySelector('span');
     likeSpan.textContent = post.likes;
    
     fetch("http://localhost:3000/posts/" + idPost, {
        headers:{
         'Accept': 'application/json',
         'Content-Type': 'application/json'
        },
        method: "PATCH",
        body: JSON.stringify({
         "likes": post.likes
        })
     })
     .catch((error) => console.log(error));
    }
}
});