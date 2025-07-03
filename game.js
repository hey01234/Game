const svg = document.getElementById("board");
const status = document.getElementById("status");
const boardContainer = document.querySelector(".board-container");

const positions = [
    { x: 50, y: 50 }, { x: 150, y: 50 }, { x: 250, y: 50 },
    { x: 50, y: 150 }, { x: 150, y: 150 }, { x: 250, y: 150 },
    { x: 50, y: 250 }, { x: 150, y: 250 }, { x: 250, y: 250 }
];

const links = {
    0: [1, 3, 4], 1: [0, 2, 4], 2: [1, 4, 5],
    3: [0, 4, 6], 4: [0, 1, 2, 3, 5, 6, 7, 8],
    5: [2, 4, 8], 6: [3, 4, 7], 7: [4, 6, 8], 8: [4, 5, 7]
};

let state, currentPlayer, selected, placed, gameOver, winningLine;
let aiPlayer = "O";
let humanPlayer = "X";
let isSinglePlayer = true;

function init() {
    const existingWinScreen = document.querySelector(".winner-screen");
    if (existingWinScreen) existingWinScreen.remove();

    svg.innerHTML = '';
    svg.style.display = "block";

    state = Array(9).fill(null);
    currentPlayer = Math.random() < 0.5 ? humanPlayer : aiPlayer;
    placed = { X: 0, O: 0 };
    selected = null;
    gameOver = false;
    winningLine = null;

    drawBoard();

    if (currentPlayer === aiPlayer) {
        status.textContent = "L'IA joue..."; // Texte mis à jour pour le style
        // status.style.background = "#001100"; // REMOVED: Géré par CSS
        // status.style.color = "#00ff00"; // REMOVED: Géré par CSS
        setTimeout(aiTurn, 500);
    } else {
        updateStatus();
    }
}

function drawBoard() {
    svg.innerHTML = '';

    for (let i = 0; i < 9; i++) {
        for (let j of links[i]) {
            if (i < j) {
                const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                line.setAttribute("x1", positions[i].x);
                line.setAttribute("y1", positions[i].y);
                line.setAttribute("x2", positions[j].x);
                line.setAttribute("y2", positions[j].y);
                // line.setAttribute("stroke", "#00ff00"); // REMOVED: Géré par CSS
                line.setAttribute("stroke-width", "1.5");
                line.setAttribute("opacity", "0.8"); // Augmenté pour être plus visible avec les couleurs anciennes
                svg.appendChild(line);
            }
        }
    }

    positions.forEach((pos, i) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", pos.x);
        circle.setAttribute("cy", pos.y);
        circle.setAttribute("r", 18);
        // REMOVED: Les couleurs de remplissage sont gérées par CSS maintenant
        if (state[i] === "X") {
            circle.setAttribute("fill", "#e63946"); // Dummy color for CSS targeting
        } else if (state[i] === "O") {
            circle.setAttribute("fill", "#007bff"); // Dummy color for CSS targeting
        } else {
            circle.setAttribute("fill", "#111"); // Dummy color for CSS targeting
        }

        // REMOVED: Les couleurs de bordure sont gérées par CSS
        // La couleur de sélection est toujours gérée par CSS via l'attribut stroke
        circle.setAttribute("stroke", i === selected ? "#ffd700" : "#00ff00");
        circle.setAttribute("stroke-width", i === selected ? "5" : "3");

        if (!gameOver && (!state[i] || (state[i] === currentPlayer && placed[currentPlayer] >= 3))) { // Ajout condition pour déplacer uniquement si 3 pions sont placés
            circle.style.cursor = 'pointer';
            circle.addEventListener('click', () => handleClick(i));
        } else if (!gameOver && !state[i] && placed[currentPlayer] < 3) { // Condition pour placer
            circle.style.cursor = 'pointer';
            circle.addEventListener('click', () => handleClick(i));
        } else {
            circle.style.cursor = 'default'; // Curseurs par défaut pour les cercles non interactifs
        }

        svg.appendChild(circle);
    });

    if (gameOver && winningLine) {
        const [a, , c] = winningLine;
        const start = positions[a];
        const end = positions[c];

        const winLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
        winLine.setAttribute("x1", start.x);
        winLine.setAttribute("y1", start.y);
        winLine.setAttribute("x2", end.x);
        winLine.setAttribute("y2", end.y);
        winLine.setAttribute("class", "animated-win-line");
        svg.appendChild(winLine);
    }
}

function movePieceWithAnimation(fromIndex, toIndex, player, callback) {
    const fromPos = positions[fromIndex];
    const toPos = positions[toIndex];

    state[fromIndex] = null;
    drawBoard();

    const movingCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    movingCircle.setAttribute("cx", fromPos.x);
    movingCircle.setAttribute("cy", fromPos.y);
    movingCircle.setAttribute("r", 18);
    // REMOVED: Les couleurs de remplissage sont gérées par CSS maintenant
    movingCircle.setAttribute("fill", player === "X" ? "#e63946" : "#007bff"); // Dummy color for CSS targeting
    // REMOVED: Les couleurs de bordure sont gérées par CSS
    movingCircle.setAttribute("stroke", "#00ff00"); // Dummy color for CSS targeting
    movingCircle.setAttribute("stroke-width", "3");
    movingCircle.setAttribute("class", "moving-piece");
    svg.appendChild(movingCircle);

    // Les variables CSS pour l'animation sont bonnes
    movingCircle.style.setProperty('--from-x', `${fromPos.x}px`);
    movingCircle.style.setProperty('--from-y', `${fromPos.y}px`);
    movingCircle.style.setProperty('--to-x', `${toPos.x}px`);
    movingCircle.style.setProperty('--to-y', `${toPos.y}px`);

    setTimeout(() => {
        movingCircle.remove();
        state[toIndex] = player;
        drawBoard();
        callback();
    }, 500);
}

function handleClick(i) {
    if (gameOver || currentPlayer === aiPlayer) return;

    if (placed[currentPlayer] < 3) {
        if (!state[i]) {
            state[i] = currentPlayer;
            placed[currentPlayer]++;
            drawBoard();
            if (checkWin()) return;
            switchPlayer();
        }
    } else {
        if (selected === null) {
            if (state[i] === currentPlayer) {
                selected = i;
                drawBoard();
            }
        } else {
            if (state[i]) {
                if (state[i] === currentPlayer) {
                    selected = i;
                } else {
                    selected = null;
                }
                drawBoard();
                return;
            }

            if (links[selected].includes(i)) {
                const fromIndex = selected;
                const toIndex = i;
                selected = null;
                movePieceWithAnimation(fromIndex, toIndex, currentPlayer, () => {
                    if (checkWin()) return;
                    switchPlayer();
                });
            } else {
                // Si l'emplacement n'est pas lié, déselectionne
                selected = null;
                drawBoard();
            }
        }
    }
}

function checkWin() {
    const winLines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];

    for (const line of winLines) {
        const [a, b, c] = line;
        if (state[a] && state[a] === state[b] && state[a] === state[c]) {
            winningLine = line;
            gameOver = true;
            drawBoard();
            setTimeout(showWinnerScreen, 1000);
            return true;
        }
    }

    // Check for draw (only if all cells are filled AND no win)
    // For Three Men's Morris, a draw is when all 3 pieces are placed for both players
    // AND no one can make a move OR no one has won.
    // The current logic only checks if all cells are filled, which is not ideal for the "move" phase.
    // Let's refine this to be more appropriate for Three Men's Morris.
    // A simpler draw check for this game is often:
    // if all pieces are placed for both players (6 pieces total) AND no valid moves for current player
    // For now, keeping the `state.every(cell => cell !== null)` as it's what you had,
    // but note this is more suited for Tic-Tac-Toe like games.
    if (placed.X === 3 && placed.O === 3 && !hasValidMoves(currentPlayer)) {
        gameOver = true;
        setTimeout(showDrawScreen, 1000);
        return true;
    }


    return false;
}

// Helper to check if a player has any valid moves (only applicable in move phase)
function hasValidMoves(player) {
    if (placed[player] < 3) return true; // Can always place if less than 3 pieces

    for (let i = 0; i < 9; i++) {
        if (state[i] === player) {
            for (let j of links[i]) {
                if (!state[j]) {
                    return true; // Found a valid move
                }
            }
        }
    }
    return false; // No valid moves
}


function showWinnerScreen() {
    const winnerScreen = document.createElement("div");
    winnerScreen.classList.add("winner-screen");

    const winnerCircle = document.createElement("div");
    winnerCircle.classList.add("winner-circle");
    // winnerCircle.style.backgroundColor = currentPlayer === "X" ? "#e63946" : "#007bff"; // REMOVED: Géré par CSS
    // Nous devons quand même passer une classe ou un attribut pour que le CSS puisse cibler
    if (currentPlayer === "X") {
        winnerCircle.setAttribute("data-winner", "X");
    } else {
        winnerCircle.setAttribute("data-winner", "O");
    }


    const winnerText = document.createElement("div");
    winnerText.classList.add("winner-text");
    winnerText.textContent = currentPlayer === humanPlayer ? "Vous avez gagné !" : "L'IA a gagné !"; // Textes mis à jour

    const newGameBtn = document.createElement("button");
    newGameBtn.classList.add("new-game-btn");
    newGameBtn.textContent = "Nouvelle Partie"; // Texte mis à jour
    newGameBtn.onclick = init;

    winnerScreen.appendChild(winnerCircle);
    winnerScreen.appendChild(winnerText);
    winnerScreen.appendChild(newGameBtn);
    boardContainer.appendChild(winnerScreen);

    // Ajustements pour le statut
    if (currentPlayer === humanPlayer) {
        status.textContent = "Victoire ! 🎉";
        status.style.background = "#00ff00"; // Dummy color for CSS targeting
    } else {
        status.textContent = "Défaite !";
        status.style.background = "#ff0000"; // Dummy color for CSS targeting
    }
    status.style.color = "#000"; // Couleur du texte gérée par CSS pour le statut de victoire/défaite
}

function showDrawScreen() {
    const winnerScreen = document.createElement("div");
    winnerScreen.classList.add("winner-screen");

    const winnerCircle = document.createElement("div");
    winnerCircle.classList.add("winner-circle");
    winnerCircle.setAttribute("data-winner", "draw"); // Attribut pour cibler en CSS
    // winnerCircle.style.backgroundColor = "#555"; // REMOVED: Géré par CSS

    const winnerText = document.createElement("div");
    winnerText.classList.add("winner-text");
    winnerText.textContent = "Match Nul !"; // Texte mis à jour

    const newGameBtn = document.createElement("button");
    newGameBtn.classList.add("new-game-btn");
    newGameBtn.textContent = "Nouvelle Partie"; // Texte mis à jour
    newGameBtn.onclick = init;

    winnerScreen.appendChild(winnerCircle);
    winnerScreen.appendChild(winnerText);
    winnerScreen.appendChild(newGameBtn);
    boardContainer.appendChild(winnerScreen);

    status.textContent = "Match Nul !"; // Texte mis à jour
    status.style.background = "#ffff00"; // Dummy color for CSS targeting
    status.style.color = "#000"; // Couleur du texte gérée par CSS pour le statut de nul
}

function switchPlayer() {
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    if (gameOver) return;

    if (currentPlayer === aiPlayer && isSinglePlayer) {
        status.textContent = "L'IA joue..."; // Texte mis à jour
        // status.style.background = "#001100"; // REMOVED: Géré par CSS
        // status.style.color = "#00ff00"; // REMOVED: Géré par CSS
        drawBoard();
        setTimeout(aiTurn, 500);
    } else {
        updateStatus();
        drawBoard();
    }
}

function updateStatus() {
    if (placed[currentPlayer] < 3) {
        status.textContent = "Placez une pièce"; // Texte mis à jour
    } else {
        status.textContent = "Déplacez une pièce"; // Texte mis à jour
    }
    // status.style.background = "#001100"; // REMOVED: Géré par CSS
    // status.style.color = "#00ff00"; // REMOVED: Géré par CSS
    status.removeAttribute('style'); // Retire tout style inline résiduel
}

function aiTurn() {
    if (gameOver) return;

    if (placed[aiPlayer] < 3) {
        const move = findBestPlacement();
        if (move !== null) {
            state[move] = aiPlayer;
            placed[aiPlayer]++;
            drawBoard();
            if (!checkWin()) switchPlayer();
        }
    } else {
        const move = findBestMove();
        if (move) {
            const fromIndex = move.from;
            const toIndex = move.to;
            movePieceWithAnimation(fromIndex, toIndex, aiPlayer, () => {
                if (!checkWin()) switchPlayer();
            });
        } else {
            // Si l'IA ne peut pas bouger (rare pour minimax bien implémenté), on peut considérer un nul
            gameOver = true;
            setTimeout(showDrawScreen, 1000);
        }
    }
}

function findBestPlacement() {
    let bestScore = -Infinity;
    let bestMove = null;

    for (let i = 0; i < 9; i++) {
        if (!state[i]) {
            state[i] = aiPlayer;
            placed[aiPlayer]++; // Simuler le placement
            let score = minimax(state, 0, false);
            state[i] = null;
            placed[aiPlayer]--; // Annuler le placement
            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }
    }
    return bestMove;
}

function findBestMove() {
    let bestScore = -Infinity;
    let best = null;

    for (let i = 0; i < 9; i++) {
        if (state[i] === aiPlayer) {
            for (let to of links[i]) {
                if (!state[to]) {
                    state[i] = null;
                    state[to] = aiPlayer;
                    let score = minimax(state, 0, false);
                    state[i] = aiPlayer;
                    state[to] = null;
                    if (score > bestScore) {
                        bestScore = score;
                        best = { from: i, to };
                    }
                }
            }
        }
    }
    return best;
}

function minimax(newState, depth, isMaximizing) {
    // La profondeur max est souvent ajoutée pour des jeux plus complexes
    // ou si la fonction d'évaluation est coûteuse. Pour 3 Men's Morris,
    // c'est un arbre de jeu petit donc pas forcément nécessaire.
    // Cependant, si vous avez une boucle infinie ou des performances lentes,
    // une limite de profondeur peut aider.
    const MAX_DEPTH = 5; // Exemple de limite de profondeur
    if (depth >= MAX_DEPTH) {
        return 0; // Ou une évaluation heuristique de l'état
    }

    const result = evaluate(newState);
    if (result !== null) return result - depth; // Poids la victoire plus tôt

    if (isMaximizing) {
        let best = -Infinity;
        let possibleMoves = [];

        // Phase de placement ou de mouvement
        if (placed.O < 3) { // AI player is 'O'
             for (let i = 0; i < 9; i++) {
                if (!newState[i]) {
                    possibleMoves.push({ type: 'place', index: i });
                }
            }
        } else { // Phase de mouvement
            for (let i = 0; i < 9; i++) {
                if (newState[i] === aiPlayer) {
                    for (let to of links[i]) {
                        if (!newState[to]) {
                            possibleMoves.push({ type: 'move', from: i, to: to });
                        }
                    }
                }
            }
        }

        if (possibleMoves.length === 0) {
            // Pas de mouvements possibles, c'est potentiellement un nul ou une défaite
            return -100; // Une valeur très basse pour décourager cet état
        }

        for (const move of possibleMoves) {
            if (move.type === 'place') {
                newState[move.index] = aiPlayer;
                placed.O++;
                best = Math.max(best, minimax(newState, depth + 1, false));
                newState[move.index] = null;
                placed.O--;
            } else if (move.type === 'move') {
                newState[move.from] = null;
                newState[move.to] = aiPlayer;
                best = Math.max(best, minimax(newState, depth + 1, false));
                newState[move.from] = aiPlayer;
                newState[move.to] = null;
            }
        }
        return best;
    } else { // Minimizing player (humanPlayer)
        let best = Infinity;
        let possibleMoves = [];

        if (placed.X < 3) { // Human player is 'X'
            for (let i = 0; i < 9; i++) {
                if (!newState[i]) {
                    possibleMoves.push({ type: 'place', index: i });
                }
            }
        } else { // Phase de mouvement
            for (let i = 0; i < 9; i++) {
                if (newState[i] === humanPlayer) {
                    for (let to of links[i]) {
                        if (!newState[to]) {
                            possibleMoves.push({ type: 'move', from: i, to: to });
                        }
                    }
                }
            }
        }

        if (possibleMoves.length === 0) {
             return 100; // Une valeur très haute car l'adversaire n'a plus de mouvements
        }

        for (const move of possibleMoves) {
            if (move.type === 'place') {
                newState[move.index] = humanPlayer;
                placed.X++;
                best = Math.min(best, minimax(newState, depth + 1, true));
                newState[move.index] = null;
                placed.X--;
            } else if (move.type === 'move') {
                newState[move.from] = null;
                newState[move.to] = humanPlayer;
                best = Math.min(best, minimax(newState, depth + 1, true));
                newState[move.from] = humanPlayer;
                newState[move.to] = null;
            }
        }
        return best;
    }
}


function evaluate(state) {
    const wins = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (let [a, b, c] of wins) {
        if (state[a] && state[a] === state[b] && state[a] === state[c]) {
            return state[a] === aiPlayer ? 10 : -10;
        }
    }
    // Check for draw condition in evaluate
    // This is a more robust draw check for the minimax context
    let allPiecesPlaced = placed.X === 3 && placed.O === 3;
    let noMovesForAI = allPiecesPlaced && !hasValidMoves(aiPlayer);
    let noMovesForHuman = allPiecesPlaced && !hasValidMoves(humanPlayer);

    if (allPiecesPlaced && (noMovesForAI || noMovesForHuman)) {
        return 0; // Draw
    }


    return null; // Game not over
}


// Game initialization
init();

  
