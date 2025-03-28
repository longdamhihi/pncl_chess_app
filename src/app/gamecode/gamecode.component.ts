import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-game-code',
  templateUrl: './gamecode.component.html',
  styleUrls: ['./gamecode.component.sass'],
})
export class GameCodeComponent {
  @Input() gameCode: string = '';
  @Input() isHost: boolean = false;
  @Output() joinGame = new EventEmitter<string>();

  enteredGameCode: string = '';

  onJoinGame() {
    if (this.enteredGameCode.trim()) {
      this.joinGame.emit(this.enteredGameCode.trim());
    }
  }
}
