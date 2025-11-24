let posts = [];
let users = [];
let comments = [];
let currentAuthorFilter = null;

const authorList = document.getElementById('author-list');
const postsContainer = document.getElementById('posts-container');

const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const commentsList = document.getElementById('comments-list');
const closeModal = document.querySelector('#modal .close');

const modalForm = document.getElementById('modal-form');
const formClose = document.querySelector('.form-close');
const createPostForm = document.getElementById('create-post-form');
const createBtn = document.querySelector('.create-btn');

async function fetchData() {
  try {
    const [postsRes, usersRes, commentsRes] = await Promise.all([
      fetch('http://localhost:3000/posts'),
      fetch('http://localhost:3000/users'),
      fetch('http://localhost:3000/comments')
    ]);

    posts = await postsRes.json();
    users = await usersRes.json();
    comments = await commentsRes.json();

    posts = posts.map(p => ({ ...p, likes: p.likes || 0 }));

    populateAuthors();
    renderPosts();

  } catch (err) {
    console.error("Ошибка загрузки:", err);
  }
}

function populateAuthors() {
  authorList.innerHTML = '';

  const allLi = document.createElement('li');
  allLi.textContent = "Все";
  allLi.classList.add("active");
  allLi.addEventListener("click", () => filterByAuthor(null));
  authorList.appendChild(allLi);

  const lastNames = new Set();

  posts.forEach(p => {
    const user = users.find(u => u.id === p.userId);
    if (user) {
      const ln = user.name.split(" ").pop();
      lastNames.add(ln);
    }
  });

  lastNames.forEach(ln => {
    const li = document.createElement('li');
    li.textContent = ln;
    li.addEventListener("click", () => filterByAuthor(ln));
    authorList.appendChild(li);
  });
}

function filterByAuthor(lastName) {
  currentAuthorFilter = lastName;

  [...authorList.children].forEach(li => {
    li.classList.toggle("active", li.textContent === (lastName || "Все"));
  });

  renderPosts();
}

function renderPosts() {
  postsContainer.innerHTML = '';

  const filtered = currentAuthorFilter
    ? posts.filter(p => {
        const u = users.find(u => u.id === p.userId);
        return u && u.name.split(" ").pop() === currentAuthorFilter;
      })
    : posts;

  filtered.forEach(post => {
    const user = users.find(u => u.id === post.userId);
    const lastName = user ? user.name.split(" ").pop() : "Неизвестно";

    const div = document.createElement('div');
    div.className = "post";

    div.innerHTML = `
      <p><strong>Автор:</strong> ${lastName}</p>
      <p>${post.body.substring(0, 100)}${post.body.length > 100 ? "..." : ""}</p>
      <div class="post-actions">
      <button class="read-more" data-id="${post.id}">Read More</button>
      <button class="delete-post" data-id="${post.id}">Удалить</button>
      </div>
      <div class="like">
        <svg width="16" height="16">
          <path class="like-path" data-idpost="${post.id}"
                fill="#bb8cf0"
                d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 
                 4.736 3.562-3.248 8 1.314"/>
        </svg>
        <span>${post.likes}</span>
      </div>
    `;

    postsContainer.appendChild(div);
  });
}
postsContainer.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-post')) {
    const id = Number(e.target.dataset.id);

    if (!confirm("Удалить этот пост?")) return;

    try {
      await fetch(`http://localhost:3000/posts/${id}`, {
        method: "DELETE"
      });
      posts = posts.filter(p => Number(p.id) !== id);
      renderPosts();
      populateAuthors();
    } catch (err) {
      console.error("Ошибка удаления:", err);
    }
  }
});
function showPostModal(postId) {
  const post = posts.find(p => Number(p.id) === Number(postId));
  if (!post) return;

  modalTitle.textContent = post.title;
  modalBody.textContent = post.body;

  const postComments = comments.filter(c => c.postId === postId);
  commentsList.innerHTML = '';

  postComments.forEach(c => {
    const li = document.createElement("li");
    li.className = "comment";
    li.innerHTML = `
      <p><strong>${c.name}</strong> (${c.email})</p>
      <p>${c.body}</p>
    `;
    commentsList.appendChild(li);
  });

  modal.style.display = "block";
}

postsContainer.addEventListener("click", e => {
  if (e.target.classList.contains("read-more")) {
    const id = Number(e.target.dataset.id);
    showPostModal(id);
  }
});

postsContainer.addEventListener("click", e => {
  if (e.target.classList.contains("like-path")) {
    const id = Number(e.target.dataset.idpost);
    const post = posts.find(p => Number(p.id) === id);

    post.likes++;
    e.target.closest(".like").querySelector("span").textContent = post.likes;

    fetch(`http://localhost:3000/posts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ likes: post.likes })
    });
  }
});

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});

window.addEventListener("click", e => {
  if (e.target === modal) modal.style.display = "none";
});

createBtn.addEventListener("click", () => {
  modalForm.style.display = "block";
});

formClose.addEventListener("click", () => {
  modalForm.style.display = "none";
});

window.addEventListener("click", e => {
  if (e.target === modalForm) modalForm.style.display = "none";
});

createPostForm.addEventListener("submit", async e => {
  e.preventDefault();

  const title = document.getElementById('new-title').value.trim();
  const body = document.getElementById('new-body').value.trim();
  const userId = Number(document.getElementById('new-userId').value);

  const newPost = { title, body, userId, likes: 0 };

   try {
    const res = await fetch("http://localhost:3000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPost)
    });

    const createdPost = await res.json();

    createdPost.id = Number(createdPost.id);

    posts.push(createdPost);

    renderPosts();

    modalForm.style.display = "none";
    createPostForm.reset();

  } catch (error) {
    console.error("Ошибка создания поста:", error);
  }
});

document.addEventListener("DOMContentLoaded", fetchData);
