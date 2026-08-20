// --- INITIAL STATE & DATA ---
const defaultUser = {
  name: "MD. MOHAIMINUL ISLAM",
  institute: "United International University",
  age: 22,
  wing: "Education",
  intro: "Dedicated to spreading literacy and creating educational opportunities for all.",
  phone: "+8801700000000",
  email: "mohaiminul@example.com",
  avatar: "https://i.pravatar.cc/150?img=68"
};

let userProfile = JSON.parse(localStorage.getItem('volunteer_profile')) || defaultUser;

let posts = [
  {
    id: 1,
    author: "MD. MOHAIMINUL ISLAM",
    avatar: userProfile.avatar,
    time: "2 hours ago",
    text: "Distributed books and stationery items among 50 underprivileged children today in our Education Wing drive! 📚✨",
    image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80",
    likes: 12,
    liked: false,
    comments: ["Great initiative!", "Keep it up brother!"]
  }
];

let events = [
  { id: 1, title: "Free Literacy Workshop", wing: "Education", date: "Aug 20, 2026", desc: "Teaching primary basic English & Math to street kids.", joined: false },
  { id: 2, title: "Free Health Checkup Camp", wing: "Health", date: "Aug 22, 2026", desc: "Basic health diagnostic for elderly people.", joined: false },
  { id: 3, title: "Cultural Drama Festival", wing: "Culture", date: "Aug 28, 2026", desc: "Performing plays on social awareness topics.", joined: false },
  { id: 4, title: "Inter-Wing Football Match", wing: "Sports", date: "Sep 01, 2026", desc: "Annual sports gathering to foster unity.", joined: false }
];

let volunteers = [
  { id: 101, name: "Saima Eva", wing: "Health", avatar: "https://i.pravatar.cc/150?img=47", status: "suggested" },
  { id: 102, name: "Ayman Rahman", wing: "Culture", avatar: "https://i.pravatar.cc/150?img=11", status: "request_received" },
  { id: 103, name: "Nusrat Jahan", wing: "Education", avatar: "https://i.pravatar.cc/150?img=25", status: "connected" }
];

// --- DOM ELEMENTS ---
document.addEventListener('DOMContentLoaded', () => {
  renderProfileData();
  renderPosts();
  renderEvents();
  renderVolunteers();
  setupEventListeners();
});

// --- RENDER FUNCTIONS ---
function renderProfileData() {
  document.getElementById('sidebarName').innerText = userProfile.name;
  document.getElementById('sidebarWing').innerText = `${userProfile.wing} Wing`;
  document.getElementById('sidebarIntro').innerText = userProfile.intro;
  document.getElementById('sidebarAvatar').src = userProfile.avatar;
  document.getElementById('navAvatarImg').src = userProfile.avatar;
  document.getElementById('postInputAvatar').src = userProfile.avatar;
  document.getElementById('currentWingTitle').innerText = `${userProfile.wing} Wing`;

  // Pre-fill Edit Modal
  document.getElementById('editName').value = userProfile.name;
  document.getElementById('editInstitute').value = userProfile.institute;
  document.getElementById('editAge').value = userProfile.age;
  document.getElementById('editWing').value = userProfile.wing;
  document.getElementById('editPhone').value = userProfile.phone;
  document.getElementById('editEmail').value = userProfile.email;
  document.getElementById('editIntro').value = userProfile.intro;
  document.getElementById('editAvatarUrl').value = userProfile.avatar;
}

function renderPosts() {
  const container = document.getElementById('feedPostsContainer');
  container.innerHTML = '';

  posts.forEach(post => {
    const postEl = document.createElement('div');
    postEl.className = 'feed-post';
    postEl.innerHTML = `
      <div class="feed-header">
        <img src="${post.avatar}" alt="Avatar">
        <div class="feed-author">
          <strong>${post.author}</strong>
          <span>${post.time}</span>
        </div>
      </div>
      <div class="feed-content">
        <p>${post.text}</p>
        ${post.image ? `<img src="${post.image}" alt="Post image">` : ''}
      </div>
      <div class="feed-stats">
        <span><i class="fa-solid fa-heart" style="color: var(--deep-red);"></i> ${post.likes} Appreciations</span>
        <span>${post.comments.length} Comments</span>
      </div>
      <div class="feed-actions">
        <button class="action-btn ${post.liked ? 'liked' : ''}" onclick="toggleLike(${post.id})">
          <i class="fa-${post.liked ? 'solid' : 'regular'} fa-heart"></i> Appreciate
        </button>
        <button class="action-btn"><i class="fa-regular fa-comment"></i> Comment</button>
      </div>
      <div class="comments-section">
        <div class="comment-input-box">
          <input type="text" placeholder="Write an appreciation comment..." id="commentInput-${post.id}">
          <button class="btn btn-primary btn-sm" onclick="addComment(${post.id})">Send</button>
        </div>
        <div class="comments-list">
          ${post.comments.map(c => `<div class="comment-item"><strong>Volunteer:</strong> ${c}</div>`).join('')}
        </div>
      </div>
    `;
    container.appendChild(postEl);
  });
}

function renderEvents() {
  const container = document.getElementById('eventsGrid');
  container.innerHTML = '';

  events.forEach(evt => {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
      <div>
        <span class="badge" style="margin-bottom:6px;">${evt.wing}</span>
        <h4>${evt.title}</h4>
        <p>${evt.desc}</p>
      </div>
      <div>
        <div class="event-meta"><i class="fa-regular fa-calendar"></i> ${evt.date}</div>
        <button class="btn ${evt.joined ? 'btn-secondary' : 'btn-primary'} btn-sm" style="width:100%; justify-content:center;" onclick="toggleJoinEvent(${evt.id})">
          ${evt.joined ? '<i class="fa-solid fa-check"></i> Request Sent' : 'Request to Join'}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

function renderVolunteers() {
  const reqList = document.getElementById('requestsList');
  const grid = document.getElementById('volunteersGrid');

  reqList.innerHTML = '';
  grid.innerHTML = '';

  volunteers.forEach(v => {
    if (v.status === 'request_received') {
      const card = document.createElement('div');
      card.className = 'volunteer-card';
      card.innerHTML = `
        <img src="${v.avatar}" alt="${v.name}">
        <h5>${v.name}</h5>
        <span>${v.wing} Wing</span>
        <button class="btn btn-primary btn-sm" onclick="acceptRequest(${v.id})" style="width:100%; justify-content:center;">Accept Request</button>
      `;
      reqList.appendChild(card);
    } else {
      const card = document.createElement('div');
      card.className = 'volunteer-card';
      card.innerHTML = `
        <img src="${v.avatar}" alt="${v.name}">
        <h5>${v.name}</h5>
        <span>${v.wing} Wing</span>
        ${
          v.status === 'connected'
            ? `<button class="btn btn-secondary btn-sm" onclick="openChat('${v.name}', '${v.avatar}')" style="width:100%; justify-content:center;"><i class="fa-regular fa-comment"></i> Chat</button>`
            : `<button class="btn btn-outline btn-sm" onclick="sendConnectRequest(${v.id})" style="width:100%; justify-content:center;"><i class="fa-solid fa-user-plus"></i> Connect</button>`
        }
      `;
      grid.appendChild(card);
    }
  });
}

// --- INTERACTION HANDLERS ---
function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('.side-menu .menu-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = btn.getAttribute('data-tab');
      if (!tabId) return;

      document.querySelectorAll('.side-menu .menu-item').forEach(i => i.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Post image upload label feedback
  document.getElementById('postImageUpload').addEventListener('change', function() {
    const file = this.files[0];
    document.getElementById('selectedImageName').innerText = file ? file.name : '';
  });

  // Create Post
  document.getElementById('submitPostBtn').addEventListener('click', () => {
    const text = document.getElementById('postTextInput').value.trim();
    const imageInput = document.getElementById('postImageUpload');
    
    if (!text && !imageInput.files[0]) {
      alert("Please enter some text or select an image!");
      return;
    }

    let imageUrl = "";
    if (imageInput.files[0]) {
      imageUrl = URL.createObjectURL(imageInput.files[0]);
    }

    const newPost = {
      id: Date.now(),
      author: userProfile.name,
      avatar: userProfile.avatar,
      time: "Just now",
      text: text,
      image: imageUrl,
      likes: 0,
      liked: false,
      comments: []
    };

    posts.unshift(newPost);
    document.getElementById('postTextInput').value = '';
    imageInput.value = '';
    document.getElementById('selectedImageName').innerText = '';
    renderPosts();
  });

  // Edit Profile Modal
  document.getElementById('editProfileBtn').addEventListener('click', () => {
    document.getElementById('profileModal').classList.add('open');
  });
  document.getElementById('closeProfileModal').addEventListener('click', () => {
    document.getElementById('profileModal').classList.remove('open');
  });
  document.getElementById('cancelProfileBtn').addEventListener('click', () => {
    document.getElementById('profileModal').classList.remove('open');
  });

  document.getElementById('profileForm').addEventListener('submit', (e) => {
    e.preventDefault();
    userProfile.name = document.getElementById('editName').value;
    userProfile.institute = document.getElementById('editInstitute').value;
    userProfile.age = document.getElementById('editAge').value;
    userProfile.wing = document.getElementById('editWing').value;
    userProfile.phone = document.getElementById('editPhone').value;
    userProfile.email = document.getElementById('editEmail').value;
    userProfile.intro = document.getElementById('editIntro').value;
    
    const avatarInput = document.getElementById('editAvatarUrl').value;
    if(avatarInput) userProfile.avatar = avatarInput;

    localStorage.setItem('volunteer_profile', JSON.stringify(userProfile));
    renderProfileData();
    document.getElementById('profileModal').classList.remove('open');
    alert("Profile Updated Successfully!");
  });

  // Request Wing Modal
  const openWingModal = () => document.getElementById('wingRequestModal').classList.add('open');
  document.getElementById('requestWingMenuBtn').addEventListener('click', openWingModal);
  document.getElementById('requestWingBtn2').addEventListener('click', openWingModal);
  
  document.getElementById('closeWingModal').addEventListener('click', () => document.getElementById('wingRequestModal').classList.remove('open'));
  document.getElementById('cancelWingBtn').addEventListener('click', () => document.getElementById('wingRequestModal').classList.remove('open'));

  document.getElementById('wingRequestForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const selected = document.getElementById('requestedWing').value;
    alert(`Your request to switch/join the ${selected} Wing has been submitted to Admin!`);
    document.getElementById('wingRequestModal').classList.remove('open');
  });

  // Logout Action
  document.getElementById('logoutBtn').addEventListener('click', () => {
    if (confirm("Are you sure you want to log out?")) {
      window.location.href = "volunteer-login.html";
    }
  });

  // Chat Widgets
  document.getElementById('closeChatBtn').addEventListener('click', () => {
    document.getElementById('chatPopup').classList.remove('open');
  });

  document.getElementById('sendChatBtn').addEventListener('click', sendChatMessage);
  document.getElementById('chatInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
}

// Post Actions
function toggleLike(postId) {
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    renderPosts();
  }
}

function addComment(postId) {
  const input = document.getElementById(`commentInput-${postId}`);
  const val = input.value.trim();
  if (val) {
    const post = posts.find(p => p.id === postId);
    post.comments.push(val);
    renderPosts();
  }
}

// Event Join
function toggleJoinEvent(eventId) {
  const evt = events.find(e => e.id === eventId);
  if (evt) {
    evt.joined = !evt.joined;
    renderEvents();
  }
}

// Volunteer Network Actions
function sendConnectRequest(vId) {
  const v = volunteers.find(vol => vol.id === vId);
  if (v) {
    v.status = 'requested';
    alert(`Connection request sent to ${v.name}`);
    renderVolunteers();
  }
}

function acceptRequest(vId) {
  const v = volunteers.find(vol => vol.id === vId);
  if (v) {
    v.status = 'connected';
    renderVolunteers();
  }
}

// Chat functions
function openChat(name, avatar) {
  document.getElementById('chatUserName').innerText = name;
  document.getElementById('chatUserImg').src = avatar;
  document.getElementById('chatPopup').classList.add('open');
}

function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (text) {
    const body = document.getElementById('chatBody');
    const msg = document.createElement('div');
    msg.className = 'chat-msg sent';
    msg.innerText = text;
    body.appendChild(msg);
    input.value = '';
    body.scrollTop = body.scrollHeight;
  }
}