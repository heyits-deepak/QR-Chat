from fastapi import FastAPI, WebSocket, Request, WebSocketDisconnect
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from typing import Dict
import uuid
import json

app = FastAPI()

# Serve static files from the 'static' directory
app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        id = str(uuid.uuid4())
        self.active_connections[id] = websocket
        await self.send_message(websocket, json.dumps({"isMe": True, "data": "Have joined!!", "username": "You"}))

    async def send_message(self, ws: WebSocket, message: str):
        await ws.send_text(message)

    def find_connection_id(self, websocket: WebSocket):
        for id, ws in self.active_connections.items():
            if ws == websocket:
                return id
        return None

    async def broadcast(self, webSocket: WebSocket, data: str):
        decoded_data = json.loads(data)
        for id, connection in self.active_connections.items():
            is_me = connection == webSocket
            await connection.send_text(json.dumps({"isMe": is_me, "data": decoded_data['message'], "username": decoded_data['username'], "type": decoded_data.get('type')}))

    def disconnect(self, websocket: WebSocket):
        id = self.find_connection_id(websocket)
        if id:
            del self.active_connections[id]
        return id

connection_manager = ConnectionManager()

@app.get("/", response_class=HTMLResponse)
async def get_room(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.websocket("/message")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await connection_manager.broadcast(websocket, data)
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)

@app.get("/join", response_class=HTMLResponse)
async def join_room(request: Request):
    return templates.TemplateResponse("room.html", {"request": request})