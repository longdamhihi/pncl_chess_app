import { Component, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AngularFireDatabase } from '@angular/fire/compat/database';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-mainpage',
  templateUrl: './mainpage.component.html',
  styleUrls: ['./mainpage.component.sass'],
})
export class MainpageComponent {
  @ViewChild('white_board_iframe')
  whiteBoardIframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('black_board_iframe')
  blackBoardIframe!: ElementRef<HTMLIFrameElement>;
  @ViewChild('board_iframe')
  boardIframe!: ElementRef<HTMLIFrameElement>;

  gameFinished = false;
  iFrameWhiteBoardUrl: SafeResourceUrl = '';
  iFrameBlackBoardUrl: SafeResourceUrl = '';
  iFrameBoardUrl: SafeResourceUrl = '';

  isOnlineMode: boolean = false;
  winner: string = '';
  gameCode: string = '';
  isHost: boolean = true;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer,
    private db: AngularFireDatabase
  ) {}

  ngOnInit() {
    this.iFrameWhiteBoardUrl = this.getIframePageUrl(true);
    this.iFrameBlackBoardUrl = this.getIframePageUrl();
    this.iFrameBoardUrl = this.getIframePageUrl();
  }

  ngAfterViewInit() {
    window.addEventListener('message', (event) => {
      if (event.data.mate) {
        this.gameFinished = true;
        this.winner = event.data.isWhiteTurn ? 'White' : 'Black';
      }
      if (!this.isOnlineMode) {
        const lastTurnColor = event.data.color;
        const targetIframe =
          lastTurnColor === 'white'
            ? this.blackBoardIframe
            : this.whiteBoardIframe;

        const targetWindow = targetIframe.nativeElement.contentWindow;
        if (targetWindow) {
          targetWindow.postMessage(event.data, this.getIframePageUrl());
        }
      } else {
        this.listenToGameUpdates();
        this.moveChange(event.data);
      }
    });
  }

  onModeChange() {
    this.isOnlineMode = !this.isOnlineMode;
    this.ngOnInit();
    this.reset();
  }

  createGame() {
    this.isOnlineMode = true;
    this.isHost = true;
    this.gameCode = uuidv4().slice(0, 6);
    this.db.object(`games/${this.gameCode}`).set(null);
  }

  onJoinClick() {
    this.isHost = false;
  }

  joinGame(code: string) {
    this.isOnlineMode = true;
    this.gameCode = code;
    this.iFrameBoardUrl = this.getIframePageUrl();
    this.listenToGameUpdates();
  }

  moveChange(data: any) {
    this.db.object(`games/${this.gameCode}`).update(data);
  }

  reset() {
    this.gameFinished = false;
    const resetData = { reset: true };
    this.whiteBoardIframe.nativeElement.contentWindow?.postMessage(
      resetData,
      this.iFrameWhiteBoardUrl
    );

    this.blackBoardIframe.nativeElement.contentWindow?.postMessage(
      resetData,
      this.iFrameBlackBoardUrl
    );
    localStorage.clear();
  }

  getIframePageUrl(isWhite: boolean = false): SafeResourceUrl {
    const params = new URLSearchParams();

    if (this.isOnlineMode) {
      params.set('isOnlineMode', 'true');
      if (this.isHost) {
        params.set('isWhite', 'true');
      }
    } else if (isWhite) {
      params.set('isWhite', 'true');
    }

    const boardUrl = `${
      window.location.origin
    }/iframepage?${params.toString()}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(boardUrl);
  }

  private listenToGameUpdates() {
    if (this.gameCode) {
      this.db
        .object(`games/${this.gameCode}`)
        .valueChanges()
        .subscribe((data: any) => {
          if (data) {
            if (data.mate) {
              this.gameFinished = true;
              this.winner = data.color === 'white' ? 'White' : 'Black';
            }
            const targetIframe = this.boardIframe;
            const targetWindow = targetIframe.nativeElement.contentWindow;
            if (targetWindow) {
              targetWindow.postMessage(data, this.getIframePageUrl());
            }
          }
        });
    }
  }
}
