import http from 'http';
import express from 'express';
import cors from "cors";
import { Server } from 'colyseus';
import { BallPool } from "./rooms/ballpool"

const app = express();
const port = Number(process.env.PORT || 3555);

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const gameServer = new Server({
  server: server,
  // express: app
});

gameServer.define('ballpool', BallPool);
gameServer.listen(port);

app.use(express.static(__dirname + "/../frontend/public"));
console.log(`Listening on ws://localhost:${port}`);
