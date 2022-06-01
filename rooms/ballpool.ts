import { Room, Delayed, Client } from 'colyseus';
import { type, Schema, MapSchema, ArraySchema } from '@colyseus/schema';

const TURN_TIMEOUT = 10
const BOARD_WIDTH = 3;

class State extends Schema {
  @type("string") currentTurn: string;
  @type("string") creator: string;
  @type("string") joiner: string;
  @type({ map: "boolean" }) players = new MapSchema<boolean>();
  @type(["number"]) board: number[] = new ArraySchema<number>(0, 0, 0, 0, 0, 0, 0, 0, 0);
  @type("string") winner: string;
  @type("boolean") draw: boolean;
}

export class BallPool extends Room<State> {
  maxClients = 2;
  randomMoveTimeout: Delayed;

  onCreate(options: any) {
    this.setState(new State());
    // this.onMessage("action", (client, message) => this.playerAction(client, message));
    this.onMessage("change_turn", (client) => this.playerChangeTurn(client));
  }

  onJoin(client: Client) {
    this.state.players.set(client.sessionId, true);

    if (this.state.players.size === 1) {
      this.state.currentTurn = client.sessionId;
      this.state.creator = client.sessionId;
    }
    else if (this.state.players.size === 2) {
      // this.setAutoMoveTimeout();
      // lock this room for new users
      this.state.joiner = client.sessionId;
      this.lock();
    }
  }

  playerChangeTurn(client: Client) {
    this.state.currentTurn = (client.sessionId == this.state.creator) ? this.state.joiner : this.state.creator;
    console.log(this.state.currentTurn)
  }

  checkBoardComplete() {
    return this.state.board
      .filter(item => item === 0)
      .length === 0;
  }

  checkWin(x, y, move) {
    let won = false;
    let board = this.state.board;

    // horizontal
    for (let y = 0; y < BOARD_WIDTH; y++) {
      const i = x + BOARD_WIDTH * y;
      if (board[i] !== move) { break; }
      if (y == BOARD_WIDTH - 1) {
        won = true;
      }
    }

    // vertical
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const i = x + BOARD_WIDTH * y;
      if (board[i] !== move) { break; }
      if (x == BOARD_WIDTH - 1) {
        won = true;
      }
    }

    // cross forward
    if (x === y) {
      for (let xy = 0; xy < BOARD_WIDTH; xy++) {
        const i = xy + BOARD_WIDTH * xy;
        if (board[i] !== move) { break; }
        if (xy == BOARD_WIDTH - 1) {
          won = true;
        }
      }
    }

    // cross backward
    for (let x = 0; x < BOARD_WIDTH; x++) {
      const y = (BOARD_WIDTH - 1) - x;
      const i = x + BOARD_WIDTH * y;
      if (board[i] !== move) { break; }
      if (x == BOARD_WIDTH - 1) {
        won = true;
      }
    }

    return won;
  }

  onLeave(client) {
    this.state.players.delete(client.sessionId);

    if (this.randomMoveTimeout) {
      this.randomMoveTimeout.clear()
    }

    let remainingPlayerIds = Array.from(this.state.players.keys());
    if (!this.state.winner && !this.state.draw && remainingPlayerIds.length > 0) {
      this.state.winner = remainingPlayerIds[0]
    }
  }

}

