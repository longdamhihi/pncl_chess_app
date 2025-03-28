import { Component, Input, ViewChild, HostListener } from '@angular/core';
import { NgxChessBoardView } from 'ngx-chess-board';
import { ActivatedRoute } from '@angular/router';
import { HistoryMove } from 'ngx-chess-board/lib/history-move-provider/history-move';
import { SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-iframepage',
  templateUrl: './iframepage.component.html',
  styleUrls: ['./iframepage.component.sass'],
})
export class IframepageComponent {
  isWhiteTurn: boolean = true;
  isWhiteBoard: boolean = false;
  lightTileColor: string = '#EEEED2';
  darkTileColor: string = '#769656';
  boardSize: number = 525; // Default size

  @Input() onGameEnd!: () => void;

  @ViewChild('board', { static: false }) board!: NgxChessBoardView;

  constructor(private route: ActivatedRoute) {}

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.updateBoardSize();
  }

  ngOnInit() {
    this.route.queryParams.subscribe((params) => {
      this.isWhiteBoard = params['isWhite'] ?? false;
    });

    window.addEventListener('message', (event) => {
      if (event.data.reset) {
        this.handleResetEvent();
      } else {
        this.handleMoveEvent(event.data);
      }
    });

    this.updateBoardSize();
  }

  ngAfterViewInit() {
    const currBoardState = localStorage.getItem('board');
    if (currBoardState) {
      this.board.setFEN(currBoardState);
    }

    if (!this.isWhiteBoard) {
      setTimeout(() => {
        this.board.reverse();
      });
    }
  }

  moveChange() {
    const lastMove = this.board.getMoveHistory().slice(-1)[0];
    window.parent.postMessage(lastMove, this.getMainPageUrl());
    this.isWhiteTurn = !this.isWhiteTurn;
  }

  private handleResetEvent() {
    this.board.reset();
    this.isWhiteTurn = true;

    if (!this.isWhiteBoard) {
      this.board.reverse();
    }

    localStorage.clear();
  }

  private handleMoveEvent(moveData: HistoryMove) {
    this.board.move(moveData.move);
    localStorage.setItem('board', this.board.getFEN());

    if (moveData.mate) {
      this.onGameEnd();
    }
  }

  private getMainPageUrl(): SafeResourceUrl {
    return `${window.location.origin}/mainpage`;
  }

  private updateBoardSize() {
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight - 16;
    this.boardSize = Math.min(containerWidth, containerHeight);
  }
}
