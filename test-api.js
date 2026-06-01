const api = async (url, method, body, token) => {
  const res = await fetch(`http://localhost${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

(async () => {
  try {
    console.log("=== 1. CREATION ADMIN (Auth Service) ===");
    try {
      await api(':3001/auth/register', 'POST', { name: "Admin", email: "admin@test.com", password: "password123", role: "admin" });
    } catch(e) {} // ignore if exists
    
    console.log("=== 2. LOGIN ADMIN ===");
    const adminAuth = await api(':3001/auth/login', 'POST', { email: "admin@test.com", password: "password123" });
    console.log("Admin loggé avec succès, token récupéré.");

    console.log("\n=== 3. CREATION STAGIAIRE ET FORMATEUR ===");
    const stagiaireData = { name: "Paul Stagiaire", email: "paul@test.com", password: "password123", role: "stagiaire", filiere: "Cloud" };
    const formateurData = { name: "Marie Formateur", email: "marie@test.com", password: "password123", role: "formateur" };
    
    try { await api(':3001/auth/register', 'POST', stagiaireData); } catch(e){}
    try { await api(':3001/auth/register', 'POST', formateurData); } catch(e){}
    
    let stagUser;
    try {
        stagUser = await api(':3002/users', 'POST', stagiaireData, adminAuth.token);
    } catch(e) {
        // If exists, fetch it
        const users = await api(':3002/users?role=stagiaire', 'GET', null, adminAuth.token);
        stagUser = { data: users.data.find(u => u.email === "paul@test.com") };
    }
    const stagId = stagUser.data._id;
    console.log("Stagiaire créé/récupéré :", stagUser.data.name, " (ID:", stagId, ")");

    console.log("\n=== 4. LOGIN FORMATEUR ET AJOUT NOTE ===");
    const formateurAuth = await api(':3001/auth/login', 'POST', { email: "marie@test.com", password: "password123" });
    const noteData = { stagiaireId: stagId, module: "Docker", note: 18, commentaire: "Excellent travail" };
    const addedNote = await api(':3003/notes', 'POST', noteData, formateurAuth.token);
    console.log("Note ajoutée par le formateur :", addedNote.data);

    console.log("\n=== 5. LOGIN STAGIAIRE ET LECTURE DU BULLETIN ===");
    const stagAuth = await api(':3001/auth/login', 'POST', { email: "paul@test.com", password: "password123" });
    const bulletin = await api(`:3003/notes/bulletin/${stagId}`, 'GET', null, stagAuth.token);
    console.log("Bulletin du stagiaire :");
    console.log(`Moyenne Générale: ${bulletin.data.overallAverage}/20`);
    console.log(`Mention: ${bulletin.data.mention}`);
    console.log("Modules:", JSON.stringify(bulletin.data.modules, null, 2));

  } catch(e) {
    console.error("Test failed:", e.message);
  }
})();
