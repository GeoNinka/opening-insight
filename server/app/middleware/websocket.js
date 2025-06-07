import { WebSocketServer } from 'ws';

const clients = new Map();

export function setupWebSocket(server) {
    const wss = new WebSocketServer({ server });

    wss.on('connection', (ws, req) => {
        const userId = req.url.split('?id=')[1]; // Простой способ передать ID клиента
        if (userId) {
            clients.set(userId, ws);
            console.log(`Клиент ${userId} подключился`);
        }

        ws.on('close', () => {
            clients.delete(userId);
            console.log(`Клиент ${userId} отключился`);
        });
    });
    }

export function sendToClient(userId, message) {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
    }
}