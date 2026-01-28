module.exports.config = {
    name: "cotuong",
    version: "1.0.0",
    hasPermssion: 0,
    credits: "Copilot",
    description: "Chơi cờ tướng (Xiangqi)",
    commandCategory: "Trò Chơi",
    usages: "cotuong",
    cooldowns: 5
};

const fs = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");

const dataPath = __dirname + "/cache/cotuong/";

// Piece types: K=King, A=Advisor, E=Elephant, H=Horse, R=Rook, C=Cannon, P=Pawn
// Uppercase = Red (bottom), Lowercase = Black (top)
const INITIAL_BOARD = [
    ['r', 'h', 'e', 'a', 'k', 'a', 'e', 'h', 'r'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', 'c', ' ', ' ', ' ', ' ', ' ', 'c', ' '],
    ['p', ' ', 'p', ' ', 'p', ' ', 'p', ' ', 'p'],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ['P', ' ', 'P', ' ', 'P', ' ', 'P', ' ', 'P'],
    [' ', 'C', ' ', ' ', ' ', ' ', ' ', 'C', ' '],
    [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '],
    ['R', 'H', 'E', 'A', 'K', 'A', 'E', 'H', 'R']
];

const PIECE_NAMES = {
    'K': '帥', 'A': '仕', 'E': '相', 'H': '傌', 'R': '俥', 'C': '炮', 'P': '兵',
    'k': '將', 'a': '士', 'e': '象', 'h': '馬', 'r': '車', 'c': '砲', 'p': '卒'
};

function createNewGame(redPlayer, blackPlayer) {
    return {
        board: JSON.parse(JSON.stringify(INITIAL_BOARD)),
        currentPlayer: 'red',
        redPlayer: redPlayer,
        blackPlayer: blackPlayer,
        moves: []
    };
}

function isRed(piece) {
    return piece === piece.toUpperCase() && piece !== ' ';
}

function isBlack(piece) {
    return piece === piece.toLowerCase() && piece !== ' ';
}

function isValidPosition(row, col) {
    return row >= 0 && row < 10 && col >= 0 && col < 9;
}

function inPalace(row, col, isRedPiece) {
    if (isRedPiece) {
        return row >= 7 && row <= 9 && col >= 3 && col <= 5;
    } else {
        return row >= 0 && row <= 2 && col >= 3 && col <= 5;
    }
}

function canMove(board, fromRow, fromCol, toRow, toCol) {
    const piece = board[fromRow][fromCol];
    const target = board[toRow][toCol];
    const pieceType = piece.toUpperCase();
    const isRedPiece = isRed(piece);
    
    // Can't capture own piece
    if ((isRedPiece && isRed(target)) || (!isRedPiece && isBlack(target))) {
        return false;
    }
    
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    
    switch (pieceType) {
        case 'K': // King
            if (rowDiff + colDiff !== 1) return false;
            if (!inPalace(toRow, toCol, isRedPiece)) return false;
            // Check flying general
            if (target.toUpperCase() === 'K') {
                for (let r = Math.min(fromRow, toRow) + 1; r < Math.max(fromRow, toRow); r++) {
                    if (board[r][fromCol] !== ' ') return false;
                }
            }
            return true;
            
        case 'A': // Advisor
            if (rowDiff !== 1 || colDiff !== 1) return false;
            return inPalace(toRow, toCol, isRedPiece);
            
        case 'E': // Elephant
            if (rowDiff !== 2 || colDiff !== 2) return false;
            // Can't cross river
            if (isRedPiece && toRow < 5) return false;
            if (!isRedPiece && toRow > 4) return false;
            // Check blocking
            const blockRow = (fromRow + toRow) / 2;
            const blockCol = (fromCol + toCol) / 2;
            return board[blockRow][blockCol] === ' ';
            
        case 'H': // Horse
            if (!((rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2))) {
                return false;
            }
            // Check blocking
            if (rowDiff === 2) {
                const blockRow = fromRow + (toRow > fromRow ? 1 : -1);
                if (board[blockRow][fromCol] !== ' ') return false;
            } else {
                const blockCol = fromCol + (toCol > fromCol ? 1 : -1);
                if (board[fromRow][blockCol] !== ' ') return false;
            }
            return true;
            
        case 'R': // Rook
            if (fromRow !== toRow && fromCol !== toCol) return false;
            // Check path
            if (fromRow === toRow) {
                for (let c = Math.min(fromCol, toCol) + 1; c < Math.max(fromCol, toCol); c++) {
                    if (board[fromRow][c] !== ' ') return false;
                }
            } else {
                for (let r = Math.min(fromRow, toRow) + 1; r < Math.max(fromRow, toRow); r++) {
                    if (board[r][fromCol] !== ' ') return false;
                }
            }
            return true;
            
        case 'C': // Cannon
            if (fromRow !== toRow && fromCol !== toCol) return false;
            let piecesBetween = 0;
            if (fromRow === toRow) {
                for (let c = Math.min(fromCol, toCol) + 1; c < Math.max(fromCol, toCol); c++) {
                    if (board[fromRow][c] !== ' ') piecesBetween++;
                }
            } else {
                for (let r = Math.min(fromRow, toRow) + 1; r < Math.max(fromRow, toRow); r++) {
                    if (board[r][fromCol] !== ' ') piecesBetween++;
                }
            }
            if (target === ' ') return piecesBetween === 0;
            return piecesBetween === 1;
            
        case 'P': // Pawn
            if (isRedPiece) {
                // Red pawn moves up
                if (fromRow > 4) { // Not crossed river
                    return toRow === fromRow - 1 && toCol === fromCol;
                } else { // Crossed river
                    return (toRow === fromRow - 1 && toCol === fromCol) ||
                           (toRow === fromRow && colDiff === 1);
                }
            } else {
                // Black pawn moves down
                if (fromRow < 5) { // Not crossed river
                    return toRow === fromRow + 1 && toCol === fromCol;
                } else { // Crossed river
                    return (toRow === fromRow + 1 && toCol === fromCol) ||
                           (toRow === fromRow && colDiff === 1);
                }
            }
    }
    return false;
}

function makeMove(game, fromRow, fromCol, toRow, toCol) {
    if (!isValidPosition(fromRow, fromCol) || !isValidPosition(toRow, toCol)) {
        return { success: false, message: "Vị trí không hợp lệ!" };
    }
    
    const piece = game.board[fromRow][fromCol];
    if (piece === ' ') {
        return { success: false, message: "Không có quân cờ tại vị trí này!" };
    }
    
    const isRedPiece = isRed(piece);
    if ((game.currentPlayer === 'red' && !isRedPiece) || 
        (game.currentPlayer === 'black' && !isBlack(piece))) {
        return { success: false, message: "Không phải lượt của bạn!" };
    }
    
    if (!canMove(game.board, fromRow, fromCol, toRow, toCol)) {
        return { success: false, message: "Nước đi không hợp lệ!" };
    }
    
    const capturedPiece = game.board[toRow][toCol];
    game.board[toRow][toCol] = piece;
    game.board[fromRow][fromCol] = ' ';
    
    // Check if king is captured
    if (capturedPiece.toUpperCase() === 'K') {
        return { 
            success: true, 
            gameOver: true, 
            winner: game.currentPlayer,
            message: `${game.currentPlayer === 'red' ? 'Đỏ' : 'Đen'} thắng!`
        };
    }
    
    game.currentPlayer = game.currentPlayer === 'red' ? 'black' : 'red';
    game.moves.push({ fromRow, fromCol, toRow, toCol, piece, captured: capturedPiece });
    
    return { success: true, message: "Di chuyển thành công!" };
}

async function drawBoard(game, gameId) {
    const cellSize = 80;
    const margin = 60;
    const width = 9 * cellSize + 2 * margin;
    const height = 10 * cellSize + 2 * margin;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#f4e4c1';
    ctx.fillRect(0, 0, width, height);
    
    // Draw board lines
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    
    // Vertical lines
    for (let col = 0; col < 9; col++) {
        const x = margin + col * cellSize;
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, margin + 9 * cellSize);
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let row = 0; row < 10; row++) {
        const y = margin + row * cellSize;
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(margin + 8 * cellSize, y);
        ctx.stroke();
    }
    
    // Draw river
    ctx.font = '24px Arial';
    ctx.fillStyle = '#000000';
    ctx.textAlign = 'center';
    ctx.fillText('楚河', width / 2 - 60, margin + 4.5 * cellSize + 10);
    ctx.fillText('漢界', width / 2 + 60, margin + 4.5 * cellSize + 10);
    
    // Draw palace diagonals
    const drawPalaceDiagonals = (startRow) => {
        const y1 = margin + startRow * cellSize;
        const y2 = margin + (startRow + 2) * cellSize;
        const x1 = margin + 3 * cellSize;
        const x2 = margin + 5 * cellSize;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x2, y1);
        ctx.lineTo(x1, y2);
        ctx.stroke();
    };
    
    drawPalaceDiagonals(0); // Black palace
    drawPalaceDiagonals(7); // Red palace
    
    // Draw pieces
    for (let row = 0; row < 10; row++) {
        for (let col = 0; col < 9; col++) {
            const piece = game.board[row][col];
            if (piece !== ' ') {
                const x = margin + col * cellSize;
                const y = margin + row * cellSize;
                
                // Draw piece circle
                ctx.beginPath();
                ctx.arc(x, y, 30, 0, 2 * Math.PI);
                ctx.fillStyle = isRed(piece) ? '#ff6b6b' : '#4ecdc4';
                ctx.fill();
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // Draw piece character
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 36px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(PIECE_NAMES[piece], x, y);
            }
        }
    }
    
    // Draw turn indicator
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = game.currentPlayer === 'red' ? '#ff6b6b' : '#4ecdc4';
    ctx.textAlign = 'center';
    ctx.fillText(`Lượt: ${game.currentPlayer === 'red' ? 'Đỏ' : 'Đen'}`, width / 2, 30);
    
    const imagePath = path.join(dataPath, `${gameId}.png`);
    fs.writeFileSync(imagePath, canvas.toBuffer());
    return imagePath;
}

function parseMove(text) {
    // Format: a1-a2 or a1 a2 or 0,0-1,0
    text = text.toLowerCase().trim();
    
    // Try coordinate format: 0,0-1,0 or 00-10
    const coordMatch = text.match(/(\d),(\d)[- ](\d),(\d)/);
    if (coordMatch) {
        return {
            fromRow: parseInt(coordMatch[1]),
            fromCol: parseInt(coordMatch[2]),
            toRow: parseInt(coordMatch[3]),
            toCol: parseInt(coordMatch[4])
        };
    }
    
    const coordMatch2 = text.match(/(\d)(\d)[- ](\d)(\d)/);
    if (coordMatch2) {
        return {
            fromRow: parseInt(coordMatch2[1]),
            fromCol: parseInt(coordMatch2[2]),
            toRow: parseInt(coordMatch2[3]),
            toCol: parseInt(coordMatch2[4])
        };
    }
    
    return null;
}

module.exports.onLoad = function() {
    if (!fs.existsSync(dataPath)) {
        fs.mkdirSync(dataPath, { recursive: true });
    }
};

module.exports.run = async function({ api, event, Users }) {
    const { threadID, messageID, senderID } = event;
    
    return api.sendMessage(
        "🎮 Cờ Tướng (Xiangqi)\n\n" +
        "Chọn:\n" +
        "1. Tạo ván mới (2 người chơi)\n" +
        "2. Hướng dẫn\n" +
        "3. Tiếp tục ván đang chơi\n\n" +
        "Reply số để chọn!",
        threadID,
        (error, info) => {
            global.client.handleReply.push({
                name: this.config.name,
                messageID: info.messageID,
                author: senderID,
                type: "menu"
            });
        },
        messageID
    );
};

module.exports.handleReply = async function({ api, event, handleReply, Users }) {
    const { threadID, messageID, senderID, body } = event;
    
    if (handleReply.author !== senderID && handleReply.type === "menu") return;
    
    const { sendMessage: send, unsendMessage: unsend } = api;
    
    try {
        if (handleReply.type === "menu") {
            unsend(handleReply.messageID);
            
            if (body === "1") {
                // Create new game
                return send(
                    "Tag người chơi thứ 2 (Người được tag sẽ là Đen, bạn là Đỏ):",
                    threadID,
                    (error, info) => {
                        global.client.handleReply.push({
                            name: this.config.name,
                            messageID: info.messageID,
                            author: senderID,
                            type: "waiting_player2"
                        });
                    },
                    messageID
                );
            } else if (body === "2") {
                return send(
                    "📖 Hướng dẫn Cờ Tướng:\n\n" +
                    "• Bàn cờ 10x9, mỗi bên 16 quân\n" +
                    "• Quân cờ: Tướng, Sĩ, Tượng, Mã, Xe, Pháo, Tốt\n" +
                    "• Mục tiêu: Chiếu tướng đối phương\n\n" +
                    "Di chuyển:\n" +
                    "• Format: hàng_cột-hàng_cột (vd: 90-80)\n" +
                    "• Hàng: 0-9 (từ trên xuống)\n" +
                    "• Cột: 0-8 (từ trái sang phải)\n\n" +
                    "Ví dụ:\n" +
                    "• Di chuyển mã: 00-21\n" +
                    "• Di chuyển tốt: 30-40",
                    threadID,
                    messageID
                );
            } else if (body === "3") {
                const gameId = `${threadID}_current`;
                const gamePath = path.join(dataPath, `${gameId}.json`);
                
                if (!fs.existsSync(gamePath)) {
                    return send("❌ Không có ván đấu nào đang diễn ra!", threadID, messageID);
                }
                
                const game = JSON.parse(fs.readFileSync(gamePath, 'utf8'));
                const imagePath = await drawBoard(game, gameId);
                
                const currentPlayerName = game.currentPlayer === 'red' ? 
                    (await Users.getNameUser(game.redPlayer)) : 
                    (await Users.getNameUser(game.blackPlayer));
                
                return send(
                    {
                        body: `Tiếp tục ván đấu!\n\nLượt: ${currentPlayerName}\nReply với nước đi (vd: 90-80)`,
                        attachment: fs.createReadStream(imagePath)
                    },
                    threadID,
                    (error, info) => {
                        global.client.handleReply.push({
                            name: this.config.name,
                            messageID: info.messageID,
                            author: senderID,
                            gameId: gameId,
                            type: "playing"
                        });
                    },
                    messageID
                );
            }
        } else if (handleReply.type === "waiting_player2") {
            unsend(handleReply.messageID);
            
            const mentions = Object.keys(event.mentions);
            if (mentions.length === 0) {
                return send("❌ Vui lòng tag người chơi thứ 2!", threadID, messageID);
            }
            
            const player2 = mentions[0];
            if (player2 === senderID) {
                return send("❌ Không thể chơi với chính mình!", threadID, messageID);
            }
            
            const gameId = `${threadID}_current`;
            const game = createNewGame(senderID, player2);
            
            fs.writeFileSync(
                path.join(dataPath, `${gameId}.json`),
                JSON.stringify(game, null, 2)
            );
            
            const imagePath = await drawBoard(game, gameId);
            const player1Name = await Users.getNameUser(senderID);
            const player2Name = await Users.getNameUser(player2);
            
            return send(
                {
                    body: `🎮 Ván cờ mới!\n\n` +
                          `Đỏ: ${player1Name}\n` +
                          `Đen: ${player2Name}\n\n` +
                          `Lượt: ${player1Name} (Đỏ)\n` +
                          `Reply với nước đi (vd: 90-80)`,
                    attachment: fs.createReadStream(imagePath)
                },
                threadID,
                (error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        gameId: gameId,
                        type: "playing"
                    });
                },
                messageID
            );
        } else if (handleReply.type === "playing") {
            const gamePath = path.join(dataPath, `${handleReply.gameId}.json`);
            
            if (!fs.existsSync(gamePath)) {
                return send("❌ Ván đấu không tồn tại!", threadID, messageID);
            }
            
            const game = JSON.parse(fs.readFileSync(gamePath, 'utf8'));
            
            // Check if it's the player's turn
            const isRedTurn = game.currentPlayer === 'red';
            const currentPlayerId = isRedTurn ? game.redPlayer : game.blackPlayer;
            
            if (senderID !== currentPlayerId) {
                return send("❌ Không phải lượt của bạn!", threadID, messageID);
            }
            
            const move = parseMove(body);
            if (!move) {
                return send(
                    "❌ Format không hợp lệ!\nSử dụng: hàng_cột-hàng_cột (vd: 90-80)",
                    threadID,
                    messageID
                );
            }
            
            const result = makeMove(game, move.fromRow, move.fromCol, move.toRow, move.toCol);
            
            if (!result.success) {
                return send(`❌ ${result.message}`, threadID, messageID);
            }
            
            fs.writeFileSync(gamePath, JSON.stringify(game, null, 2));
            const imagePath = await drawBoard(game, handleReply.gameId);
            
            if (result.gameOver) {
                fs.unlinkSync(gamePath);
                const winnerName = result.winner === 'red' ? 
                    (await Users.getNameUser(game.redPlayer)) : 
                    (await Users.getNameUser(game.blackPlayer));
                
                return send(
                    {
                        body: `🎉 Trò chơi kết thúc!\n\n${winnerName} (${result.winner === 'red' ? 'Đỏ' : 'Đen'}) thắng!`,
                        attachment: fs.createReadStream(imagePath)
                    },
                    threadID,
                    messageID
                );
            }
            
            const nextPlayerName = game.currentPlayer === 'red' ? 
                (await Users.getNameUser(game.redPlayer)) : 
                (await Users.getNameUser(game.blackPlayer));
            
            unsend(handleReply.messageID);
            
            return send(
                {
                    body: `✅ Nước đi hợp lệ!\n\nLượt: ${nextPlayerName} (${game.currentPlayer === 'red' ? 'Đỏ' : 'Đen'})\nReply với nước đi tiếp theo (vd: 90-80)`,
                    attachment: fs.createReadStream(imagePath)
                },
                threadID,
                (error, info) => {
                    global.client.handleReply.push({
                        name: this.config.name,
                        messageID: info.messageID,
                        author: senderID,
                        gameId: handleReply.gameId,
                        type: "playing"
                    });
                },
                messageID
            );
        }
    } catch (error) {
        console.error(error);
        return send(`❌ Đã xảy ra lỗi: ${error.message}`, threadID, messageID);
    }
};
