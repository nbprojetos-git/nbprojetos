// kanban.js
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  onSnapshot,
  deleteDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const db = window.firebaseRefs.db;
const projectsCol = collection(db, "projetos");

const checklistPadrao = [
  "Briefing",
  "Pré-Projeto",
  "Projeto",
  "Detalhamento",
  "Protótipo",
  "Revisão",
  "Finalizado"
];

const form = document.getElementById("project-form");
form.innerHTML = `
  <input type="text" id="project-name" placeholder="Nome do projeto" required />
  <input type="text" id="project-client" placeholder="Cliente" required />
  <input type="number" id="project-valorhora" placeholder="Valor da hora" required />
  <textarea id="project-desc" placeholder="Descrição do projeto"></textarea>
  <button type="submit">Salvar Projeto</button>
`;

form.onsubmit = async (e) => {
  e.preventDefault();

  const projeto = {
    nome: document.getElementById("project-name").value,
    cliente: document.getElementById("project-client").value,
    valorHora: parseFloat(document.getElementById("project-valorhora").value),
    descricao: document.getElementById("project-desc").value,
    status: "A Fazer",
    checklist: checklistPadrao.map(item => ({ nome: item, feito: false })),
    criadoEm: new Date().toISOString()
  };

  await addDoc(projectsCol, projeto);
  form.reset();
  alert("Projeto salvo!");
};

const kanban = document.getElementById("kanban");
const filtros = {
  cliente: "",
  projeto: ""
};

const renderKanban = (projetos) => {
  kanban.innerHTML = "";
  const colunas = ["A Fazer", "Em Andamento", "Concluído"];
  colunas.forEach(coluna => {
    const col = document.createElement("div");
    col.className = "kanban-col";
    col.dataset.status = coluna;
    col.innerHTML = `<h2>${coluna}</h2>`;

    projetos.filter(p => p.status === coluna).forEach(proj => {
      const card = document.createElement("div");
      card.className = "kanban-card";
      card.draggable = true;
      card.dataset.id = proj.id;
      card.innerHTML = `
        <strong>${proj.nome}</strong><br>
        <small>${proj.cliente}</small>
        <ul>
          ${proj.checklist.map(item => `<li><input type="checkbox" ${item.feito ? "checked" : ""} disabled /> ${item.nome}</li>`).join("")}
        </ul>
      `;
      card.onclick = () => abrirModal(proj);
      col.appendChild(card);
    });

    col.ondragover = e => e.preventDefault();
    col.ondrop = async e => {
      const id = e.dataTransfer.getData("text/plain");
      const ref = doc(projectsCol, id);
      await updateDoc(ref, { status: col.dataset.status });
    };

    kanban.appendChild(col);
  });
};

document.addEventListener("dragstart", e => {
  if (e.target.classList.contains("kanban-card")) {
    e.dataTransfer.setData("text/plain", e.target.dataset.id);
  }
});

onSnapshot(projectsCol, snap => {
  const projetos = [];
  snap.forEach(doc => projetos.push({ id: doc.id, ...doc.data() }));
  renderKanban(projetos.filter(p => {
    return (!filtros.cliente || p.cliente === filtros.cliente) &&
           (!filtros.projeto || p.nome === filtros.projeto);
  }));
  preencherFiltros(projetos);
});

const preencherFiltros = (projetos) => {
  const clientes = [...new Set(projetos.map(p => p.cliente))];
  const projetosNomes = [...new Set(projetos.map(p => p.nome))];
  const filtroCliente = document.getElementById("filter-client");
  const filtroProjeto = document.getElementById("filter-project");

  filtroCliente.innerHTML = `<option value="">Todos os clientes</option>` +
    clientes.map(c => `<option value="${c}">${c}</option>`).join("");
  filtroProjeto.innerHTML = `<option value="">Todos os projetos</option>` +
    projetosNomes.map(p => `<option value="${p}">${p}</option>`).join("");
};

window.applyFilters = () => {
  filtros.cliente = document.getElementById("filter-client").value;
  filtros.projeto = document.getElementById("filter-project").value;
  onSnapshot(projectsCol, snap => {
    const projetos = [];
    snap.forEach(doc => projetos.push({ id: doc.id, ...doc.data() }));
    renderKanban(projetos.filter(p => {
      return (!filtros.cliente || p.cliente === filtros.cliente) &&
             (!filtros.projeto || p.nome === filtros.projeto);
    }));
  });
};

const abrirModal = (projeto) => {
  const modal = document.getElementById("project-modal");
  modal.style.display = "block";
  modal.innerHTML = `
    <div style="background:#fff;padding:20px;border:1px solid #ccc">
      <h2>${projeto.nome}</h2>
      <p><strong>Cliente:</strong> ${projeto.cliente}</p>
      <p><strong>Descrição:</strong><br>${projeto.descricao}</p>
      <p><strong>Checklist:</strong></p>
      <ul>
        ${projeto.checklist.map(item => `<li>${item.nome} - ${item.feito ? "✔" : "❌"}</li>`).join("")}
      </ul>
      <button onclick="document.getElementById('project-modal').style.display='none'">Fechar</button>
    </div>
  `;
};
