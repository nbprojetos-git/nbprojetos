import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA5cFM7baPCN_9QXDgYYybooj-DHVBsAsY",
  authDomain: "plannernb.firebaseapp.com",
  projectId: "plannernb",
  storageBucket: "plannernb.firebasestorage.app",
  messagingSenderId: "629344668472",
  appId: "1:629344668472:web:a49faf88027c0a23728fcd"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const userInfo = document.getElementById('user-info');
const kanbanTab = document.getElementById('kanban-tab');
const newProjectTab = document.getElementById('new-project-tab');

function renderProjects(projects) {
  if (projects.length === 0) {
    kanbanTab.innerHTML = "<p>Nenhum projeto encontrado.</p>";
    return;
  }
  kanbanTab.innerHTML = '<h3>Projetos</h3><ul>';
  projects.forEach(proj => {
    kanbanTab.innerHTML += `<li><strong>${proj.projeto}</strong> - Status: ${proj.status} - Responsável: ${proj.responsavel}</li>`;
  });
  kanbanTab.innerHTML += '</ul>';
}

async function loadProjects(user) {
  const q = query(collection(db, "projetos"), where("criadoPor", "==", user.uid));
  const querySnapshot = await getDocs(q);
  const projects = [];
  querySnapshot.forEach(doc => {
    projects.push(doc.data());
  });
  renderProjects(projects);
}

function createNewProjectForm() {
  newProjectTab.innerHTML = `
    <h3>Novo Projeto</h3>
    <form id="project-form">
      <label>Cliente:<br><input type="text" name="cliente" required></label><br><br>
      <label>Projeto:<br><input type="text" name="projeto" required></label><br><br>
      <label>Responsável:<br><input type="text" name="responsavel" required></label><br><br>
      <label>Status:<br>
        <select name="status" required>
          <option value="A Fazer">A Fazer</option>
          <option value="Em Progresso">Em Progresso</option>
          <option value="Concluído">Concluído</option>
        </select>
      </label><br><br>
      <label>Observações:<br><textarea name="observacoes"></textarea></label><br><br>
      <button type="submit" class="btn btn-primary">Salvar Projeto</button>
    </form>
    <div id="form-message"></div>
  `;

  const form = document.getElementById('project-form');
  const formMessage = document.getElementById('form-message');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);

    try {
      await addDoc(collection(db, "projetos"), {
        cliente: data.get('cliente'),
        projeto: data.get('projeto'),
        responsavel: data.get('responsavel'),
        status: data.get('status'),
        observacoes: data.get('observacoes') || "",
        criadoPor: auth.currentUser.uid,
        criadoEm: serverTimestamp()
      });
      formMessage.textContent = "Projeto criado com sucesso!";
      form.reset();
      await loadProjects(auth.currentUser);
      showTab('kanban-tab');
    } catch (error) {
      formMessage.textContent = `Erro ao criar projeto: ${error.message}`;
    }
  });
}

getRedirectResult(auth).then((result) => {
  if (result && result.user) {
    userInfo.textContent = `Olá, ${result.user.displayName}`;
  }
}).catch((error) => {
  console.error("Erro no login com redirect:", error.message);
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    userInfo.textContent = `Olá, ${user.displayName}`;
    document.getElementById('btn-logout').onclick = async () => {
      await signOut(auth);
      location.reload();
    };

    await loadProjects(user);
    createNewProjectForm();

  } else {
    userInfo.innerHTML = '<button id="login-btn" class="btn btn-primary">Login com Google</button>';
    document.getElementById("login-btn").addEventListener("click", () => {
      signInWithRedirect(auth, provider);
    });
  }
});
