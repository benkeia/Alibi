<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accusé • Alibi</title>
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="css/accuse.css">
  <script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
  <style>
    /* Admin Panel Flottant */
    .admin-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 280px;
      background: rgba(0, 0, 0, 0.9);
      border: 1px solid var(--color-primary);
      border-radius: 8px;
      z-index: 2000;
      font-family: var(--font-body);
      box-shadow: 0 0 20px rgba(3, 255, 152, 0.3);
      transition: all 0.3s ease;
    }
    
    .admin-panel.minimized {
      height: 40px;
      overflow: hidden;
    }
    
    .admin-header {
      background: rgba(3, 255, 152, 0.1);
      padding: 0.8rem;
      border-bottom: 1px solid rgba(3, 255, 152, 0.3);
      cursor: move;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .admin-title {
      color: var(--color-primary);
      font-size: 0.9rem;
      font-weight: 600;
      text-shadow: var(--glow);
      margin: 0;
    }
    
    .admin-controls {
      display: flex;
      gap: 0.5rem;
    }
    
    .control-icon {
      width: 16px;
      height: 16px;
      border: 1px solid var(--color-primary);
      background: none;
      color: var(--color-primary);
      cursor: pointer;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .control-icon:hover {
      background: var(--color-primary);
      color: #000;
    }
    
    .admin-content {
      padding: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .admin-section {
      margin-bottom: 1rem;
      padding-bottom: 0.8rem;
      border-bottom: 1px solid rgba(3, 255, 152, 0.2);
    }
    
    .admin-section:last-child {
      border-bottom: none;
      margin-bottom: 0;
    }
    
    .section-title {
      color: var(--color-primary);
      font-size: 0.8rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      text-shadow: var(--glow);
    }
    
    .admin-btn {
      background: none;
      border: 1px solid rgba(3, 255, 152, 0.5);
      color: var(--color-primary);
      font-family: var(--font-body);
      font-size: 0.75rem;
      padding: 0.4rem 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;
      text-shadow: var(--glow);
      margin: 0.2rem;
      border-radius: 3px;
    }
    
    .admin-btn:hover {
      border-color: var(--color-primary);
      background: rgba(3, 255, 152, 0.1);
    }
    
    .admin-btn.success {
      border-color: #4CAF50;
      color: #4CAF50;
    }
    
    .admin-btn.error {
      border-color: #F44336;
      color: #F44336;
    }
    
    .btn-row {
      display: flex;
      gap: 0.3rem;
    }
    
    .info-panel {
      background: rgba(3, 255, 152, 0.05);
      border: 1px solid rgba(3, 255, 152, 0.2);
      padding: 0.5rem;
      margin-top: 0.5rem;
      font-size: 0.7rem;
      color: var(--color-primary);
      opacity: 0.8;
    }
    
    .team-controls {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }
    
    .team-group {
      text-align: center;
    }
    
    .team-label {
      font-size: 0.7rem;
      color: var(--color-primary);
      margin-bottom: 0.3rem;
      font-weight: 600;
    }
  </style>
</head>
<body class="accused-body">
  <div class="background"></div>

  <!-- État de connexion -->
  <div class="connection-status" id="connection-status" style="display: none;">
    <span class="status-text">Connecté • Interrogatoire en cours</span>
  </div>

  <!-- Info de partie -->
  <div class="room-info" id="room-info" style="display: none;">
    <div>Partie: <span id="room-code-display">ALB-1234</span></div>
  </div>

  <!-- Scores des équipes -->
  <div class="team-score team-score-a active" id="team-score-a">
    <div class="team-name">Équipe A</div>
    <div class="score-circles" id="team-a-circles">
      <span class="score-circle correct"></span>
      <span class="score-circle correct"></span>
      <span class="score-circle incorrect"></span>
      <span class="score-circle pending"></span>
      <span class="score-circle pending"></span>
    </div>
    <div class="team-total"><span id="team-a-score">2</span>/5</div>
  </div>
  
  <div class="team-score team-score-b" id="team-score-b">
    <div class="team-name">Équipe B</div>
    <div class="score-circles" id="team-b-circles">
      <span class="score-circle correct"></span>
      <span class="score-circle incorrect"></span>
      <span class="score-circle pending"></span>
      <span class="score-circle pending"></span>
      <span class="score-circle pending"></span>
    </div>
    <div class="team-total"><span id="team-b-score">1</span>/5</div>
  </div>

  <!-- Overlay de flash pour les animations -->
  <div class="flash-overlay" id="flash-overlay"></div>

  <!-- Admin Panel Flottant -->
  <div class="admin-panel" id="admin-panel">
    <div class="admin-header" id="admin-header">
      <h4 class="admin-title">&gt; Test Admin</h4>
      <div class="admin-controls">
        <button class="control-icon" id="minimize-btn" title="Minimiser">−</button>
        <button class="control-icon" id="close-btn" title="Fermer">×</button>
      </div>
    </div>
    
    <div class="admin-content" id="admin-content">
      <div class="admin-section">
        <div class="section-title">Feedback</div>
        <div class="btn-row">
          <button class="admin-btn success" onclick="triggerSuccess()">✓ Correct</button>
          <button class="admin-btn error" onclick="triggerError()">✗ Incorrect</button>
        </div>
      </div>
      
      <div class="admin-section">
        <div class="section-title">Scores</div>
        <div class="team-controls">
          <div class="team-group">
            <div class="team-label">Équipe A</div>
            <button class="admin-btn success" onclick="addPoint('A', true)">+✓</button>
            <button class="admin-btn error" onclick="addPoint('A', false)">+✗</button>
            <button class="admin-btn" onclick="resetTeam('A')">Reset</button>
          </div>
          
          <div class="team-group">
            <div class="team-label">Équipe B</div>
            <button class="admin-btn success" onclick="addPoint('B', true)">+✓</button>
            <button class="admin-btn error" onclick="addPoint('B', false)">+✗</button>
            <button class="admin-btn" onclick="resetTeam('B')">Reset</button>
          </div>
        </div>
      </div>
      
      <div class="admin-section">
        <div class="section-title">Contrôles</div>
        <button class="admin-btn" onclick="changeQuestion()">Nouvelle Question</button>
        <button class="admin-btn" onclick="toggleActiveTeam()">Toggle Équipe</button>
        <button class="admin-btn" onclick="resetAll()">Reset Tout</button>
      </div>
      
      <div class="info-panel">
        <div>État: <span id="status-display">Prêt</span></div>
        <div>A: <span id="score-a-display">2</span>/5 | B: <span id="score-b-display">1</span>/5</div>
        <div>Active: <span id="active-team-display">A</span></div>
      </div>
    </div>
  </div>

  <!-- Écran principal -->
  <main class="accused-main">
    <!-- Section d'attente (cachée par défaut) -->
    <section class="waiting-screen" id="waiting-screen" style="display: none;">
      <h1 class="accused-title">
        Accusé<span class="blinker">_</span>
      </h1>
      <p class="waiting-text">En attente du début de l'interrogatoire...</p>
      <div class="loading-dots">
        <span>.</span><span>.</span><span>.</span>
      </div>
    </section>

    <!-- Section de jeu (visible par défaut pour test) -->
    <section class="game-screen" id="game-screen">
      <!-- Question centrale -->
      <div class="question-container">
        <div class="question-label">&gt; Question actuelle</div>
        <div class="question-text" id="current-question">
          Où étiez-vous le 15 mars entre 14h et 16h ?
        </div>
      </div>
    </section>

    <!-- Section de fin -->
    <section class="end-screen" id="end-screen" style="display: none;">
      <h2 class="end-title">Interrogatoire terminé</h2>
      <div class="final-score">
        <p>Score final: <span class="final-score-value" id="final-score">0</span></p>
        <p class="final-result" id="final-result">-</p>
      </div>
      <div class="end-message" id="end-message">
        Merci d'avoir participé !
      </div>
    </section>
  </main>

  <!-- Navigation -->
  <nav class="accused-nav">
    <a href="index.html" class="nav-btn">&gt; Menu</a>
  </nav>

  <script src="js/websocket.js"></script>
  <script src="js/accuse.js"></script>
  <script>
    // Variables globales pour l'admin
    let scoreA = 2;
    let scoreB = 1;
    let activeTeam = 'A';
    let questionIndex = 0;
    let isMinimized = false;
    
    const questions = [
      "Où étiez-vous le 15 mars entre 14h et 16h ?",
      "Qui était avec vous ce jour-là ?",
      "Qu'avez-vous fait exactement ?",
      "À quelle heure êtes-vous parti de chez vous ?",
      "Avez-vous des témoins de votre présence ?",
      "Que portez-vous ce jour-là ?",
      "Quel moyen de transport avez-vous utilisé ?",
      "Qu'avez-vous mangé ce midi-là ?",
      "Qui avez-vous appelé dans l'après-midi ?",
      "À quelle heure êtes-vous rentré chez vous ?"
    ];
    
    // Drag & Drop pour le panel admin
    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
    
    const adminPanel = document.getElementById('admin-panel');
    const adminHeader = document.getElementById('admin-header');
    
    adminHeader.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
    
    function dragStart(e) {
      if (e.target.classList.contains('control-icon')) return;
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      if (e.target === adminHeader || adminHeader.contains(e.target)) {
        isDragging = true;
        adminPanel.style.transition = 'none';
      }
    }
    
    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        adminPanel.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    }
    
    function dragEnd() {
      if (isDragging) {
        isDragging = false;
        adminPanel.style.transition = 'all 0.3s ease';
      }
    }
    
    // Contrôles du panel
    document.getElementById('minimize-btn').addEventListener('click', function() {
      isMinimized = !isMinimized;
      adminPanel.classList.toggle('minimized', isMinimized);
      this.textContent = isMinimized ? '+' : '−';
    });
    
    document.getElementById('close-btn').addEventListener('click', function() {
      adminPanel.style.display = 'none';
    });
    
    // Double-click sur header pour minimiser
    adminHeader.addEventListener('dblclick', function() {
      document.getElementById('minimize-btn').click();
    });
    
    // Fonctions de test
    function triggerSuccess() {
      const flashOverlay = document.getElementById('flash-overlay');
      const body = document.body;
      
      // Flash overlay avec effet étendu
      if (flashOverlay) {
        flashOverlay.className = 'flash-overlay success';
      }
      
      // Appliquer l'effet à tous les éléments avec vibration légère
      body.classList.add('feedback-success-global');
      
      // Vibration success (si supportée)
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
      
      // Reset après animation
      setTimeout(() => {
        if (flashOverlay) {
          flashOverlay.className = 'flash-overlay';
        }
        body.classList.remove('feedback-success-global');
      }, 1200);
      
      updateStatus('✓ Réponse Correcte!');
    }
    
    function triggerError() {
      const flashOverlay = document.getElementById('flash-overlay');
      const body = document.body;
      
      // Flash overlay avec effet étendu
      if (flashOverlay) {
        flashOverlay.className = 'flash-overlay error';
      }
      
      // Appliquer l'effet à tous les éléments + shake amélioré
      body.classList.add('feedback-error-global', 'shake-global');
      
      // Vibration error plus intense (si supportée)
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]);
      }
      
      // Reset après animation
      setTimeout(() => {
        if (flashOverlay) {
          flashOverlay.className = 'flash-overlay';
        }
        body.classList.remove('feedback-error-global', 'shake-global');
      }, 1200);
      
      updateStatus('✗ Réponse Incorrecte!');
    }
    
    function addPoint(team, isCorrect) {
      let score, circles;
      
      if (team === 'A') {
        if (scoreA < 5) {
          score = ++scoreA;
          circles = document.querySelectorAll('#team-a-circles .score-circle');
        }
      } else {
        if (scoreB < 5) {
          score = ++scoreB;
          circles = document.querySelectorAll('#team-b-circles .score-circle');
        }
      }
      
      if (circles && circles[score - 1]) {
        circles[score - 1].className = isCorrect ? 'score-circle correct' : 'score-circle incorrect';
      }
      
      const scoreDisplay = document.getElementById(`team-${team.toLowerCase()}-score`);
      if (scoreDisplay) {
        scoreDisplay.textContent = score;
      }
      
      if (isCorrect) {
        triggerSuccess();
      } else {
        triggerError();
      }
      
      updateDisplay();
    }
    
    function resetTeam(team) {
      if (team === 'A') {
        scoreA = 0;
      } else {
        scoreB = 0;
      }
      
      const circles = document.querySelectorAll(`#team-${team.toLowerCase()}-circles .score-circle`);
      circles.forEach(circle => {
        circle.className = 'score-circle pending';
      });
      
      const scoreDisplay = document.getElementById(`team-${team.toLowerCase()}-score`);
      if (scoreDisplay) {
        scoreDisplay.textContent = '0';
      }
      
      updateDisplay();
    }
    
    function changeQuestion() {
      const questionText = document.getElementById('current-question');
      if (questionText) {
        questionIndex = (questionIndex + 1) % questions.length;
        questionText.textContent = questions[questionIndex];
      }
      updateStatus(`Question ${questionIndex + 1}`);
    }
    
    function toggleActiveTeam() {
      activeTeam = activeTeam === 'A' ? 'B' : 'A';
      
      const teamA = document.getElementById('team-score-a');
      const teamB = document.getElementById('team-score-b');
      
      if (teamA && teamB) {
        if (activeTeam === 'A') {
          teamA.classList.add('active');
          teamB.classList.remove('active');
        } else {
          teamB.classList.add('active');
          teamA.classList.remove('active');
        }
      }
      
      updateDisplay();
    }
    
    function resetAll() {
      resetTeam('A');
      resetTeam('B');
      questionIndex = 0;
      changeQuestion();
      updateStatus('Reset complet');
    }
    
    function updateStatus(message) {
      document.getElementById('status-display').textContent = message;
    }
    
    function updateDisplay() {
      document.getElementById('score-a-display').textContent = scoreA;
      document.getElementById('score-b-display').textContent = scoreB;
      document.getElementById('active-team-display').textContent = activeTeam;
    }
    
    // Raccourcis clavier
    document.addEventListener('keydown', function(e) {
      if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
          case '1':
            e.preventDefault();
            triggerSuccess();
            break;
          case '2':
            e.preventDefault();
            triggerError();
            break;
          case '3':
            e.preventDefault();
            changeQuestion();
            break;
          case '4':
            e.preventDefault();
            toggleActiveTeam();
            break;
        }
      }
    });
    
    // Initialisation
    updateDisplay();
  </script>
</body>
</html>
