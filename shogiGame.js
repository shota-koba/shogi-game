// shogiGame.js (トライ確認ダイアログ実装版)

class ShogiGame {
    constructor() {
        console.log("Constructor started");
        this.boardElement = document.getElementById('shogi-board');
        this.senteCapturesElement = document.getElementById('sente-captures');
        this.goteCapturesElement = document.getElementById('gote-captures');
        this.messageElement = document.getElementById('message');
        this.furigomaContainer = document.getElementById('furigoma-container');
        this.furigomaButton = document.getElementById('furigoma-button');
        this.furigomaResultElement = document.getElementById('furigoma-result');
        this.furigomaAnimationElement = document.getElementById('furigoma-animation');
        this.startButton = document.getElementById('start-button');
        this.senteNameInput = document.getElementById('sente-name');
        this.goteNameInput = document.getElementById('gote-name');
        this.resignButton = document.getElementById('resign-button');
        this.endGameButton = document.getElementById('end-game-button');
        this.liveRegion = document.getElementById('live-region');
        this.rewindAllButton = document.getElementById('rewind-all');
        this.rewindButton = document.getElementById('rewind');
        this.forwardButton = document.getElementById('forward');
        this.forwardAllButton = document.getElementById('forward-all');
        this.boardAreaElement = document.getElementById('board-area');
        this.goteInfoArea = document.getElementById('gote-info');
        this.senteInfoArea = document.getElementById('sente-info');
        this.controlPanelElement = document.getElementById('control-panel');
        console.log("DOM elements acquired");
        this.board = []; this.capturedPieces = { sente: [], gote: [] }; this.currentPlayer = null;
        this.selectedPiece = null; this.history = []; this.currentHistoryIndex = -1;
        this.gameStarted = false; this.gameOver = false; this.lastMoveNotation = "";
        this.messageTimeout = null;
        this.TARGET_SQUARE_FOR_SENTE = [0, 4]; this.TARGET_SQUARE_FOR_GOTE = [8, 4];
        this.BACKEND_URL = 'http://localhost:5001';
        this.pieceMap = { '歩': 'P', '香': 'L', '桂': 'N', '銀': 'S', '金': 'G', '角': 'B', '飛': 'R', '王': 'K', 'と': '+P', '成香': '+L', '成桂': '+N', '成銀': '+S', '馬': '+B', '龍': '+R' };
        this.reversePieceMap = { 'P': '歩', 'L': '香', 'N': '桂', 'S': '銀', 'G': '金', 'B': '角', 'R': '飛', 'K': '王', '+P': 'と', '+L': '成香', '+N': '成桂', '+S': '成銀', '+B': '馬', '+R': '龍' };
        console.log("Properties initialized");
        this.board = this._createInitialBoard(); console.log("Initial board created");
        this._setupEventListeners(); this._showFurigoma(); console.log("Constructor finished");
    }

    _createInitialBoard() { const b=Array(9).fill(null).map(()=>Array(9).fill(null)); const sr=(r,p,ps)=>ps.forEach((t,c)=>{if(t)b[r][c]={type:t,player:p,promoted:false}}); sr(0,'gote',['香','桂','銀','金','王','金','銀','桂','香']); b[1][1]={type:'飛',player:'gote',promoted:false}; b[1][7]={type:'角',player:'gote',promoted:false}; sr(2,'gote',Array(9).fill('歩')); sr(6,'sente',Array(9).fill('歩')); b[7][1]={type:'角',player:'sente',promoted:false}; b[7][7]={type:'飛',player:'sente',promoted:false}; sr(8,'sente',['香','桂','銀','金','王','金','銀','桂','香']); return b; }
    _setupEventListeners() { console.log("Setting up listeners..."); if(!this.furigomaButton||!this.startButton||!this.resignButton||!this.endGameButton||!this.rewindAllButton||!this.rewindButton||!this.forwardButton||!this.forwardAllButton||!this.boardElement||!this.senteCapturesElement||!this.goteCapturesElement){console.error("UI elements missing!");return;} this.furigomaButton.addEventListener('click',()=>this.handleFurigoma()); this.startButton.addEventListener('click',()=>this.startGame()); this.resignButton.addEventListener('click',()=>this.handleResign()); this.endGameButton.addEventListener('click',()=>this.handleEndGameButton()); this.rewindAllButton.addEventListener('click',()=>this.rewindAll()); this.rewindButton.addEventListener('click',()=>this.rewind()); this.forwardButton.addEventListener('click',()=>this.forward()); this.forwardAllButton.addEventListener('click',()=>this.forwardAll()); this.boardElement.addEventListener('click',(e)=>this._handleBoardClick(e)); this.senteCapturesElement.addEventListener('click',(e)=>this._handleCaptureClick(e,'sente')); this.goteCapturesElement.addEventListener('click',(e)=>this._handleCaptureClick(e,'gote')); this.boardElement.addEventListener('contextmenu',e=>e.preventDefault()); this.senteCapturesElement.addEventListener('contextmenu',e=>e.preventDefault()); this.goteCapturesElement.addEventListener('contextmenu',e=>e.preventDefault()); console.log("Listeners set up."); }
    _showFurigoma() { console.log("Showing Furigoma..."); if(!this.boardAreaElement||!this.goteInfoArea||!this.senteInfoArea||!this.controlPanelElement||!this.furigomaContainer||!this.startButton||!this.furigomaButton||!this.messageElement){console.error("Required elements missing!");return;} this.boardAreaElement.style.display='none'; this.goteInfoArea.style.display='none'; this.senteInfoArea.style.display='none'; this.controlPanelElement.style.display='none'; this.messageElement.textContent='振り駒を行ってください'; this.messageElement.classList.remove('board-alert'); this.messageElement.style.fontWeight='normal'; this.messageElement.style.color=''; this.messageElement.style.display='block'; this.furigomaContainer.style.display='flex'; this.startButton.disabled=true; this.furigomaButton.disabled=false; if(this.resignButton)this.resignButton.style.display='none'; if(this.endGameButton)this.endGameButton.style.display='none'; if(this.rewindAllButton)this.rewindAllButton.disabled=true; if(this.rewindButton)this.rewindButton.disabled=true; if(this.forwardButton)this.forwardButton.disabled=true; if(this.forwardAllButton)this.forwardAllButton.disabled=true; const gc=document.getElementById('game-container'); if(gc)gc.style.display='flex'; console.log("Furigoma screen displayed."); }

    // --- Rendering Methods ---
    renderBoard() { this.boardElement.innerHTML=''; this.boardElement.style.display='grid'; for(let i=0; i<9; i++){for(let j=0; j<9; j++){ const c=document.createElement('div'); c.classList.add('cell'); c.dataset.row=i; c.dataset.col=j; c.setAttribute('role','gridcell'); const p=this.board?.[i]?.[j]; const crd=this._getCoordsNotation([i,j]); if(p){const el=this._createPieceElement(p,[i,j]); c.appendChild(el); c.setAttribute('aria-label',`${crd}, ${el.getAttribute('aria-label')}`);} else{c.setAttribute('aria-label',`${crd}, 空`);} this.boardElement.appendChild(c);}} this._updateBoardAriaLabel(); }
     _createPieceElement(p, pos=null) { const el=document.createElement('div'); el.classList.add('piece'); if(!p?.player||!p?.type){el.textContent='?'; return el;} el.classList.add(p.player); let txt=p.type; let code=this.pieceMap[txt]; let prom=p.promoted; if(code?.startsWith('+')){prom=true; txt=this.reversePieceMap[code]||`+${txt}`;} else if(prom){const bc=code||'?'; const pc='+'+bc; txt=this.reversePieceMap[pc]||`+${txt}`;} if(prom)el.classList.add('promoted'); el.textContent=txt; el.setAttribute('role','button'); const pn=p.player==='sente'?'先手':'後手'; const pstr=pos?` (${this._getCoordsNotation(pos)})`:''; el.setAttribute('aria-label',`${pn}の${txt}${pstr}`); return el; }
    _updateBoardAriaLabel() { const t=this.gameStarted?`${this.getPlayerName(this.currentPlayer)}の手番`:'対局開始前'; this.boardElement.setAttribute('aria-label', `将棋盤 ${t}`); }
    renderCaptures() { this._renderCaptureArea(this.senteCapturesElement, this.capturedPieces.sente, 'sente'); this._renderCaptureArea(this.goteCapturesElement, this.capturedPieces.gote, 'gote'); }
    _renderCaptureArea(element, pieces, player) { if(!element)return; element.innerHTML=''; const order=['飛','角','金','銀','桂','香','歩']; const sorted=[...pieces].sort((a,b)=>order.indexOf(a.type)-order.indexOf(b.type)); const groups=sorted.reduce((acc,p)=>{if(!acc[p.type])acc[p.type]={c:0,d:p};acc[p.type].c++;return acc;},{}); let countString=""; order.forEach(type=>{if(groups[type]){const g=groups[type]; const d={type:g.d.type,player:player,promoted:false}; const el=this._createPieceElement(d); el.dataset.type=type; const pn=player==='sente'?'先手':'後手'; if(g.c>1){const s=document.createElement('span'); s.textContent=`${g.c}`; s.classList.add('count'); el.appendChild(s); el.setAttribute('aria-label',`${pn}持駒 ${type} ${g.c}枚`); countString+=`${type}${g.c}枚 `;} else{el.setAttribute('aria-label',`${pn}持駒 ${type}`); countString+=`${type} `;} element.appendChild(el);}}); element.setAttribute('aria-label',`${player==='sente'?'先手':'後手'}持駒 (${countString.trim()||'なし'})`); }

    // --- Helper Methods ---
    _getCurrentSfen_ForHistory() { let sB=''; for(let r=0;r<9;r++){let ec=0; for(let c=0;c<9;c++){const p=this.board?.[r]?.[c]; if(p){if(ec>0){sB+=ec;ec=0;} let pc=this.pieceMap[p.type]; if(!pc)continue; let sc=pc.startsWith('+')?pc.substring(1):pc; if(p.promoted)sc='+'+sc; sB+=(p.player==='sente'?sc.toUpperCase():sc.toLowerCase());} else ec++;} if(ec>0)sB+=ec; if(r<8)sB+='/';} const t=this.currentPlayer==='sente'?'b':'w'; let scs=''; let gcs=''; const o=['R','B','G','S','N','L','P']; const ct=(cap)=>{const cts={}; cap.forEach(p=>{const c=this.pieceMap[p.type]; const bc=c?.startsWith('+')?c.substring(1):c; if(bc)cts[bc]=(cts[bc]||0)+1;}); return cts;}; const sCts=ct(this.capturedPieces.sente); const gCts=ct(this.capturedPieces.gote); o.forEach(pc=>{if(sCts[pc])scs+=(sCts[pc]>1?sCts[pc]:'')+pc.toUpperCase(); if(gCts[pc])gcs+=(gCts[pc]>1?gCts[pc]:'')+pc.toLowerCase();}); const cap=scs||gcs?scs+gcs:'-'; const mn=this.currentHistoryIndex+1>=1?this.currentHistoryIndex+1:1; return `${sB} ${t} ${cap} ${mn}`; }
    _loadFromSfen(sfen) { try{const parts=sfen.split(' '); if(parts.length<3)throw new Error("Invalid SFEN."); const [bStr, tStr, cStr]=parts; const nB=Array(9).fill(null).map(()=>Array(9).fill(null)); const rows=bStr.split('/'); if(rows.length!==9)throw new Error("Invalid rows."); for(let r=0;r<9;r++){let c=0; let sI=0; while(sI<rows[r].length&&c<9){let char=rows[r][sI]; let pr=false; let pC=''; if(char==='+'){pr=true; sI++; char=rows[r][sI];} if(!char)throw new Error(`Invalid row ${r+1}: end after+`); if(/\d/.test(char)){const ec=parseInt(char); if(isNaN(ec)||c+ec>9)throw new Error(`Invalid row ${r+1}: num err.`); c+=ec; sI++;} else{pC=char.toUpperCase(); const pl=(char===char.toUpperCase())?'sente':'gote'; const bT=this.reversePieceMap[pC]; if(bT)nB[r][c]={type:bT,player:pl,promoted:pr}; else console.warn(`Unknown piece:${ch}(P:${pr})`); c++; sI++;}} if(c!==9)throw new Error(`Invalid row ${r+1}: length err.`);} this.board=nB; if(tStr!=='b'&&tStr!=='w')throw new Error("Invalid turn."); const pP=this.currentPlayer; this.currentPlayer=(tStr==='b')?'sente':'gote'; console.log(`Loaded SFEN. Prev:${pP}, New:${this.currentPlayer}`); this.capturedPieces={sente:[],gote:[]}; if(cStr!=='-'){let cc=1; let idx=0; while(idx<cStr.length){let char=cStr[idx]; let ns=""; while(idx<cStr.length&&/\d/.test(cStr[idx])){ns+=cStr[idx]; idx++;} if(ns.length>0){cc=parseInt(ns); if(isNaN(cc))throw new Error("Invalid capture count.");} else cc=1; if(idx>=cStr.length)break; char=cStr[idx]; const pl=(char===char.toUpperCase())?'sente':'gote'; const tc=char.toUpperCase(); const type=this.reversePieceMap[tc]; if(type){for(let j=0;j<cc;j++)this.capturedPieces[pl].push({type,player:pl,promoted:false});} else console.warn(`Unknown capture:${char}`); idx++;}}} catch(e){console.error("Error loading SFEN:",sfen,e); this.updateMessage(`SFEN解析エラー`,true,true);} }
    _posToUsi(pos) { if (!pos||!Array.isArray(pos)||pos.length!==2)return ''; const[r,c]=pos; if(isNaN(r)||isNaN(c)||r<0||r>8||c<0||c>8)return ''; return `${9-c}${String.fromCharCode(97+r)}`; }
    _moveToUsi(f, t, p) { const fu=this._posToUsi(f); const tu=this._posToUsi(t); return fu&&tu?fu+tu+(p?'+':''):''; }
    _dropToUsi(type, t) { const bc=this.pieceMap[type]?this.pieceMap[type].replace('+',''):null; if(!bc){return '';} const tu=this._posToUsi(t); return tu?`${bc.toUpperCase()}*${tu}`:''; }
     _usiToNotation(usi, type=null, cap=false) { if(!usi)return ''; try{if(usi.includes('*')){const p=usi.split('*'); const pc=p[0]; const up=p[1]; if(up.length!==2)return usi; const t=this.reversePieceMap[pc]||'?'; const f=up[0]; const rc=up[1]; const ri=rc.charCodeAt(0)-97; if(ri<0||ri>8)return usi; const r=['一','二','三','四','五','六','七','八','九'][ri]; const fi=parseInt(f)-1; if(isNaN(fi)||fi<0||fi>8)return usi; const fn=['９','８','７','６','５','４','３','２','１'][fi]; return `${fn}${r}${t}打`;} else {if(usi.length<4||usi.length>5)return usi; const fp=usi.substring(0,2); const tp=usi.substring(2,4); const pr=usi.endsWith('+'); let dt='?'; if(type){const bc=this.pieceMap[type]; dt=this.reversePieceMap[bc?.replace('+','')||'?']||'?'; if(pr&&bc){const pCode='+'+bc.replace('+',''); dt=this.reversePieceMap[pCode]||`+${dt}`;}} const ffi=parseInt(fp[0])-1; const fri=fp[1].charCodeAt(0)-97; const tfi=parseInt(tp[0])-1; const tri=tp[1].charCodeAt(0)-97; if(ffi<0||ffi>8||fri<0||fri>8||tfi<0||tfi>8||tri<0||tri>8)return usi; const ff=['９','８','７','６','５','４','３','２','１'][ffi]; const fr=['一','二','三','四','五','六','七','八','九'][fri]; const tf=['９','８','７','６','５','４','３','２','１'][tfi]; const tr=['一','二','三','四','五','六','七','八','九'][tri]; return `${tf}${tr}${dt}${pr?'成':''}(${ff}${fr})`;}}catch(e){return usi;} }

    // --- Action Methods ---
    async movePiece(f, t) { const p=this.board?.[f?.[0]]?.[f?.[1]]; if(!p){this.deselectPiece();return;} if (this.currentHistoryIndex < this.history.length - 1) { if (!confirm("履歴を破棄してこの手で分岐しますか？")) { this.deselectPiece(); return; } } let pr=false; const cp=this._canPromote(f,t,p); const mp=this._mustPromote(t,p); if(mp)pr=true; else if(cp&&confirm(`${p.type}成りますか？`))pr=true; const usi=this._moveToUsi(f,t,pr); if(!usi)return; await this.sendMoveToServer(usi,p,t); }
    async dropPiece(pd, t) { const pt=pd?.type; if(!pt){this.deselectPiece();return;} if (this.currentHistoryIndex < this.history.length - 1) { if (!confirm("履歴を破棄してこの手で分岐しますか？")) { this.deselectPiece(); return; } } const usi=this._dropToUsi(pt,t); if(!usi)return; await this.sendMoveToServer(usi,pd,t); }

    // ★★★ sendMoveToServer: トライ確認ダイアログ処理追加 ★★★
    async sendMoveToServer(usiMove, pieceInfo, targetPos) {
        const isBranching = this.currentHistoryIndex < this.history.length - 1; if (isBranching) { console.log(`Branching history...`); this.history = this.history.slice(0, this.currentHistoryIndex + 1); this._updateHistoryButtons();}
        this.deselectPiece(); this.updateMessage("サーバー通信中です..."); console.log("Sending:",{usi_move:usiMove});
        try{const response=await fetch(`${this.BACKEND_URL}/move`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({usi_move:usiMove})}); const ct=response.headers.get("content-type"); let rdt=''; if(!response.ok){let emsg=`サーバーエラー:${response.status}`; try{rdt=await response.text(); if(ct?.includes("application/json")){const d=JSON.parse(rdt); emsg+=` - ${d.error||d.message||rdt}`; } else { emsg+=` - ${rdt}`;}} catch(e){emsg+=` (応答解析エラー:${e})`;} console.error('Server Error:',emsg,"Raw:",rdt); this.updateMessage(emsg,true,true); this.checkGameState(); return;} rdt=await response.text(); if(ct?.includes("application/json")){const data=JSON.parse(rdt); console.log("Received:",data);
                if(data.success){
                    this._loadFromSfen(data.new_sfen); const cap=false; this.lastMoveNotation=this._usiToNotation(usiMove,pieceInfo?.type,cap); this.renderBoard(); this.renderCaptures();

                    // ★★★ トライ可能状態の処理 ★★★
                    if (data.status === 'try_possible') {
                        this.updateMessage(data.message, true); // "入玉宣言可能" を表示
                        if (confirm("トライが可能です。宣言して勝ちにしますか？")) {
                            const winnerPlayer = this.currentPlayer === 'sente' ? 'gote' : 'sente'; // 指した側が勝ち
                            this.endGame(winnerPlayer, `${this.getPlayerName(winnerPlayer)}の勝ちです。(入玉宣言勝ち)`);
                            this.announceMove(`${this.getPlayerName(winnerPlayer)}が入玉宣言で勝ちました。`);
                        } else { // 続行する場合
                            this.gameOver = false; this.checkGameState(); this._updateHistoryButtons();
                        }
                    } else if (data.status !== 'ongoing') {
                         this.endGame(data.winner, data.message); this.announceMove(data.message); this.displayBoardMessage(data.message);
                    } else { // ゲーム続行
                         this.updateMessage(data.message, false, data.is_check); this.gameOver = false; this._updateHistoryButtons(); if(targetPos&&!usiMove.includes('*')){const cell=this.boardElement?.querySelector(`.cell[data-row="${targetPos[0]}"][data-col="${targetPos[1]}"]`); if(cell)cell.focus();} const mp=this.currentPlayer==='sente'?'gote':'sente'; this.announceMove(`${this.getPlayerName(mp)} ${this.lastMoveNotation} ${data.is_check?'王手':''}`); if(data.is_check){this.displayBoardMessage("王手！",2000);}
                    }
                    // ★★★ 状態更新後に履歴記録 ★★★
                    this.recordHistory();
                } else { console.log("Move rejected:", data.message); this.updateMessage(data.message||'不正な手です。',true,true); this.checkGameState();}
            } else { console.error('Non-JSON success:',rdt); this.updateMessage('サーバー応答形式不正。',true,true); this.checkGameState();}
        } catch(error){ console.error('Fetch API Error:',error); this.updateMessage('サーバー通信失敗。',true,true); this.checkGameState();}
    }
    displayBoardMessage(text, duration = null) { if (!this.messageElement) return; const isGameOverMessage = this.gameOver; this.messageElement.textContent = text; this.messageElement.classList.add('board-alert'); this.messageElement.setAttribute('role', 'alert'); if (this.messageTimeout) clearTimeout(this.messageTimeout); this.messageTimeout = null; if (duration && !isGameOverMessage) { this.messageTimeout = setTimeout(() => { if (!this.gameOver && this.messageElement.classList.contains('board-alert')) { this.messageElement.classList.remove('board-alert'); this.checkGameState(); } }, duration); } }

    // --- Game Logic & State Check ---
    checkGameState() { if(this.gameOver) return; const isCheck=this._isCheck(this.currentPlayer); let msg=`${this.getPlayerName(this.currentPlayer)}の手番`; if(isCheck) msg+=" (王手)"; if (!this.messageElement.classList.contains('board-alert') || isCheck) { this.updateMessage(msg,false,isCheck); if (!isCheck && this.messageElement.classList.contains('board-alert')) { this.messageElement.classList.remove('board-alert'); } } this._updateHistoryButtons(); }
    _isCheck(player, board = this.board) { const kPos=this._findKing(player, board); if(!kPos)return false; const opp=player==='sente'?'gote':'sente'; for(let r=0;r<9;r++){if(!board?.[r])continue; for(let c=0;c<9;c++){const p=board[r][c]; if(p?.player===opp && this._checkBasicMoveGeometry([r,c], kPos, p, board)) return true;}} return false; }
     _findKing(player, board = this.board) { if (!board) return null; for(let r=0;r<9;r++){if(!board[r])continue; for(let c=0;c<9;c++){const p=board[r][c]; if(p?.type==='王'&&p.player===player)return [r,c];}} return null; }
     _checkBasicMoveGeometry(f, t, p, b = this.board) { if (!p||!b||!f||!t)return false; const [fr,fc]=f; const [tr,tc]=t; if (tr<0||tr>8||tc<0||tc>8||fr<0||fr>8||fc<0||fc>8)return false; if (fr===tr&&fc===tc)return false; const target=b[tr]?.[tc]; if(target?.player===p.player)return false; let ct=p.type; let cd=this.pieceMap[ct]; if(p.promoted){const bc=cd?.startsWith('+')?cd.substring(1):cd; const pCode=bc?('+'+bc):null; ct=pCode?this.reversePieceMap[pCode]:`+${ct}`;}
        switch(ct){ case '歩':return this._isValidFuMoveGeometry(f,t,p); case '香':return this._isValidKyoshaMoveGeometry(f,t,p,b); case '桂':return this._isValidKeimaMoveGeometry(f,t,p); case '銀':return this._isValidGinMoveGeometry(f,t,p); case '金':case 'と':case '成香':case '成桂':case '成銀':return this._isValidKinMoveGeometry(f,t,p); case '王':return this._isValidOuMoveGeometry(f,t); case '飛':return this._isValidHishaMoveGeometry(f,t,p,b); case '角':return this._isValidKakugyoMoveGeometry(f,t,p,b); case '龍':return this._isValidRyuMoveGeometry(f,t,p,b); case '馬':return this._isValidUmaMoveGeometry(f,t,p,b); default: return false;} }
    _isValidFuMoveGeometry(f,t,p){const [fr,fc]=f,[tr,tc]=t; const dir=p.player==='sente'?-1:1; return tc===fc&&tr===fr+dir;}
    _isValidKyoshaMoveGeometry(f,t,p,b){const [fr,fc]=f,[tr,tc]=t; const dir=p.player==='sente'?-1:1; if(tc!==fc||(dir===-1&&tr>=fr)||(dir===1&&tr<=fr))return false; const st=tr>fr?1:-1; for(let r=fr+st;r!==tr;r+=st){if(b[r]?.[fc])return false;} return true;}
    _isValidKeimaMoveGeometry(f,t,p){const [fr,fc]=f,[tr,tc]=t; const dir=p.player==='sente'?-1:1; const rd=tr-fr; const cd=Math.abs(tc-fc); return rd===2*dir&&cd===1;}
    _isValidGinMoveGeometry(f,t,p){const [fr,fc]=f,[tr,tc]=t; const dir=p.player==='sente'?-1:1; const rd=tr-fr; const cd=Math.abs(tc-fc); return(rd===dir&&cd<=1)||(rd===-dir&&cd===1);}
    _isValidKinMoveGeometry(f,t,p){const [fr,fc]=f,[tr,tc]=t; const rd=tr-fr; const cd=Math.abs(tc-fc); const dir=p.player==='sente'?-1:1; return(Math.abs(rd)<=1&&Math.abs(cd)<=1)&&!(rd===-dir&&cd===1);}
    _isValidOuMoveGeometry(f,t){const [fr,fc]=f,[tr,tc]=t; const rd=Math.abs(tr-fr); const cd=Math.abs(tc-fc); return rd<=1&&cd<=1&&(rd!==0||cd!==0);}
    _isValidHishaMoveGeometry(f,t,p,b){const [fr,fc]=f,[tr,tc]=t; if(fr!==tr&&fc!==tc)return false; if(fr===tr){const st=tc>fc?1:-1; for(let c=fc+st;c!==tc;c+=st){if(b[fr]?.[c])return false;}} else{const st=tr>fr?1:-1; for(let r=fr+st;r!==tr;r+=st){if(b[r]?.[fc])return false;}} return true;}
    _isValidKakugyoMoveGeometry(f,t,p,b){const [fr,fc]=f,[tr,tc]=t; const rd=Math.abs(tr-fr); const cd=Math.abs(tc-fc); if(rd!==cd||rd===0)return false; const rs=tr>fr?1:-1; const cs=tc>fc?1:-1; let r=fr+rs; let c=fc+cs; while(r!==tr){ if(b[r]?.[c])return false; r+=rs; c+=cs; } return true;}
    _isValidRyuMoveGeometry(f,t,p,b){if(this._isValidHishaMoveGeometry(f,t,p,b))return true; const rd=Math.abs(t[0]-f[0]); const cd=Math.abs(t[1]-f[1]); return rd===1&&cd===1;}
    _isValidUmaMoveGeometry(f,t,p,b){if(this._isValidKakugyoMoveGeometry(f,t,p,b))return true; const rd=Math.abs(t[0]-f[0]); const cd=Math.abs(t[1]-f[1]); return(rd===1&&cd===0)||(rd===0&&cd===1);}
    _canPromote(f,t,p){if(!p||p.promoted)return false; const ty=['歩','香','桂','銀','角','飛']; if(!ty.includes(p.type))return false; const fr=f[0]; const tr=t[0]; const z=p.player==='sente'?2:6; return p.player==='sente'?(tr<=z||fr<=z):(tr>=z||fr>=z);}
    _mustPromote(t,p){if(!p||p.promoted)return false; const[tr]=t; const ty=p.type; const pl=p.player; if(pl==='sente'){if(tr===0&&(ty==='歩'||ty==='香'))return true; if(tr<=1&&ty==='桂')return true;}else{if(tr===8&&(ty==='歩'||ty==='香'))return true; if(tr>=7&&ty==='桂')return true;} return false;}

    // --- Game End & Reset ---
     endGame(winner, message) { if(this.gameOver) return; console.log(`Game ended. Winner: ${winner||'none'}, Msg: ${message}`); this.gameOver=true; this.deselectPiece(); this.updateMessage(message, true, true); this.displayBoardMessage(message); if(this.resignButton)this.resignButton.disabled=true; if(this.endGameButton){this.endGameButton.textContent="リセット"; this.endGameButton.disabled=false;} this._updateHistoryButtons(); }
     async handleEndGameButton() { if(this.gameOver){if(confirm("リセットしますか？")) await this.resetGame();}else if(this.gameStarted){if(confirm("ゲームを終了しますか？(勝敗なし)")) {this.endGame(null,"手動で終了"); this.announceMove("ゲーム終了");}} }
     async resetGame() { console.log("Resetting game..."); await this._resetServerState(); this.board=this._createInitialBoard(); this.capturedPieces={sente:[],gote:[]}; this.currentPlayer=null; this.selectedPiece=null; this.history=[]; this.currentHistoryIndex=-1; this.gameStarted=false; this.gameOver=false; this.lastMoveNotation=""; if(this.senteNameInput)this.senteNameInput.value=""; if(this.goteNameInput)this.goteNameInput.value=""; if(this.furigomaResultElement)this.furigomaResultElement.textContent=""; if(this.furigomaAnimationElement)this.furigomaAnimationElement.querySelectorAll('.furigoma-animation-piece').forEach(p=>p.textContent=''); if(this.endGameButton){this.endGameButton.textContent="終了"; this.endGameButton.disabled=true;} if(this.resignButton)this.resignButton.disabled=true; this._showFurigoma(); this.renderCaptures(); this.announceMove("リセットしました"); console.log("Game reset complete."); }
     async _resetServerState() { try { console.log("Sending reset..."); const r = await fetch(`${this.BACKEND_URL}/reset`,{method:'POST'}); if(r.ok)console.log("Server reset OK."); else console.error("Server reset fail:", r.status); } catch (e) { console.error("Fail reset request:", e); this.updateMessage("サーバーリセット失敗", true, true); } }
     updateMessage(text, isSticky=false, isAlert=false){ if(!this.messageElement)return; this.messageElement.textContent=text; this.messageElement.setAttribute('role', isAlert?'alert':'status'); if (!isAlert && !this.gameOver) this.messageElement.classList.remove('board-alert'); }

    // --- Furigoma & Start ---
    handleFurigoma() {
        console.log("handleFurigoma");
        if (this.furigomaButton.disabled) {
            console.log("Furigoma busy");
            return;
        }
        this.furigomaButton.disabled = true;
        this.startButton.disabled = true;
        this.furigomaResultElement.textContent = '振り駒中...';
    
        const ps = this.furigomaAnimationElement?.querySelectorAll('.furigoma-animation-piece');
        if (!ps || ps.length === 0) {
            console.error("No anim pieces!");
            this.updateMessage("アニメ要素エラー", true, true);
            this.furigomaButton.disabled = false;
            return;
        }
    
        let tc = 0; // と金の枚数
        const res = [];
        const dur = 1000;
    
        console.log(`Animating ${ps.length} pieces...`);
    
        ps.forEach((p, idx) => {
            try {
                p.textContent = '';
                p.style.animation = 'none';
                void p.offsetWidth;
                p.style.animation = `flip ${dur / 1000}s ease-in-out`;
    
                setTimeout(() => {
                    try {
                        const isTo = Math.random() < 0.5; // trueなら「と」、falseなら「歩」
                        res.push(isTo);
                        p.textContent = isTo ? 'と' : '歩';
                        p.style.animation = '';
    
                        if (res.length === ps.length) {
                            console.log("All flips done.");
                            tc = res.filter(r => r === true).length;
                            const numFu = 5 - tc;
    
                            // ★ 先手判定：歩が3枚以上なら先手
                            const firstPlayer = numFu >= 3 ? 'sente' : 'gote';
    
                            this.currentPlayer = firstPlayer;
    
                            // 表示用変数
                            const fp = firstPlayer;
                            const nf = numFu;
    
                            const rt = `歩${nf}枚, と金${tc}枚。${this.getPlayerName(fp)}が先手。`;
                            this.furigomaResultElement.textContent = rt;
                            this.startButton.disabled = false;
                            this.startButton.focus();
                            this.announceMove(`振駒結果、${this.getPlayerName(fp)}が先手です。`);
                            console.log(`Furigoma done. Fu: ${numFu}, To: ${tc}. Player: ${fp}`);
                        }
                    } catch (e) {
                        console.error(`Error in setTimeout ${idx + 1}:`, e);
                        this.updateMessage("振駒処理エラー", true, true);
                        this.furigomaButton.disabled = false;
                        this.startButton.disabled = true;
                    }
                }, dur);
            } catch (e) {
                console.error(`Error anim setup ${idx + 1}:`, e);
                this.updateMessage("アニメ設定エラー", true, true);
                this.furigomaButton.disabled = false;
                this.startButton.disabled = true;
            }
        });
    }
    
     async startGame() { console.log("startGame entered"); if(!this.currentPlayer){this.updateMessage("振駒要",true,true);return;} await this._setServerTurn(this.currentPlayer); this.gameStarted=true; this.gameOver=false; console.log("Flags set"); this.board=this._createInitialBoard(); this.capturedPieces={sente:[],gote:[]}; this.history=[]; this.currentHistoryIndex=-1; this.selectedPiece=null; this.lastMoveNotation=""; console.log("Game state reset"); if(!this.furigomaContainer||!this.goteInfoArea||!this.senteInfoArea||!this.boardAreaElement||!this.resignButton||!this.endGameButton||!this.controlPanelElement){console.error("UI elements missing!"); this.gameStarted=false; return;} this.furigomaContainer.style.display='none'; this.boardAreaElement.style.display='block'; this.goteInfoArea.style.display='flex'; this.senteInfoArea.style.display='flex'; this.controlPanelElement.style.display='flex'; if(this.boardElement)this.boardElement.style.display='grid'; if(this.messageElement)this.messageElement.style.display='block'; this.resignButton.style.display='inline-block'; this.endGameButton.style.display='inline-block'; this.resignButton.disabled=false; this.endGameButton.textContent="終了"; this.endGameButton.disabled=false; this.renderBoard(); this.renderCaptures(); this.recordHistory(); this.checkGameState(); this.announceMove("対局開始"); console.log("Game started UI updated."); }
     async _setServerTurn(player) { try { console.log(`Setting server turn: ${player}`); const response = await fetch(`${this.BACKEND_URL}/set_turn`, { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ player }) }); if (response.ok) { const data = await response.json(); console.log("Server turn set OK:", data); } else { console.error("Set server turn Fail:", response.status, await response.text()); this.updateMessage("サーバー手番設定失敗", true, true); } } catch (e) { console.error("Error setting server turn:", e); this.updateMessage("サーバー通信失敗(手番設定)", true, true); } }
     handleResign() { if(this.gameOver||!this.gameStarted)return; /* 履歴中でも投了可能とする場合 */ const rp=this.currentPlayer; const w=rp==='sente'?'gote':'sente'; if(confirm(`${this.getPlayerName(rp)}投了しますか？`)){this.endGame(w,`${this.getPlayerName(rp)}投了、${this.getPlayerName(w)}の勝ち
     `); this.announceMove(`${this.getPlayerName(rp)}投了、${this.getPlayerName(w)}の勝ち`);} }

    // ★★★ History Management (閲覧モード実装 + 分岐対応 + サーバー同期) ★★★
    recordHistory(moveDetails = {}) { if(!this.gameStarted)return; const state={sfen:this._getCurrentSfen_ForHistory(),moveNotation:this.lastMoveNotation}; this.history.push(state); this.currentHistoryIndex++; console.log(`History[${this.currentHistoryIndex}] Recorded`); this._updateHistoryButtons(); }
    async loadState(historyIndex) { console.log(`Loading history index: ${historyIndex}`); if(historyIndex<0||historyIndex>=this.history.length){return;} const state=this.history[historyIndex]; if(!state?.sfen){return;} await this._setServerState(state.sfen); this._loadFromSfen(state.sfen); this.currentHistoryIndex=historyIndex; this.lastMoveNotation=state.moveNotation||""; this.gameOver=false; this.deselectPiece(); this.clearBoardHighlights(); this.renderBoard(); this.renderCaptures(); const moveNum=historyIndex; const turnPlayer=this.currentPlayer; let msg=`${moveNum}手目 (${this.getPlayerName(turnPlayer)}手番)`; const isCheck=this._isCheck(turnPlayer); if(isCheck)msg+=" - 王手"; this.updateMessage(msg,false,isCheck); if(isCheck) this.displayBoardMessage("王手 (履歴)",2000); this._updateHistoryButtons(); if(this.boardElement)this.boardElement.focus(); }
    async _setServerState(sfen) { try { console.log(`Sending set_state: ${sfen}`); const response = await fetch(`${this.BACKEND_URL}/set_state`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ sfen }) }); if (response.ok) { const data = await response.json(); console.log("Server state set OK:", data); } else { console.error("Failed set server state:", response.status, await response.text()); this.updateMessage("サーバー状態同期失敗", true, true); } } catch (e) { console.error("Error sending set_state:", e); this.updateMessage("サーバー通信失敗(状態同期)", true, true); } }
    // ★★★ _updateHistoryButtons: forwardAll, resign ボタン修正 ★★★
    _updateHistoryButtons() { const canRewind=this.currentHistoryIndex>0; const isAtLatest=this.currentHistoryIndex===this.history.length-1; this.rewindAllButton.disabled=!canRewind; this.rewindButton.disabled=!canRewind; this.forwardButton.disabled=isAtLatest;
        // ★ 「最後まで進む」は最新でなければ有効 ★
        this.forwardAllButton.disabled = isAtLatest;
        // ★ 投了はゲーム中なら常に可能とする (履歴閲覧中でも) ★
        this.resignButton.disabled = this.gameOver || !this.gameStarted;
        if(this.endGameButton) this.endGameButton.disabled = false;
        // ★ 履歴閲覧中クラスは削除 ★
        // if (this.boardElement) { ... }
        console.log(`History buttons updated: R:${!canRewind}, F:${isAtLatest}, FA:${isAtLatest}, Resign:${this.resignButton.disabled}`);
    }
    rewindAll() { if(this.gameStarted && this.currentHistoryIndex > 0) this.loadState(0); }
    rewind() { if(this.gameStarted && this.currentHistoryIndex > 0) this.loadState(this.currentHistoryIndex - 1); }
    forward() { if(this.gameStarted && this.currentHistoryIndex < this.history.length - 1) this.loadState(this.currentHistoryIndex + 1); }
    forwardAll() { if(this.gameStarted && this.currentHistoryIndex < this.history.length - 1) this.loadState(this.history.length - 1); }
    clearBoardHighlights() { this.boardElement?.querySelectorAll('.cell.check-highlight').forEach(c => c.classList.remove('check-highlight')); }

    // --- Event Handlers (確認ダイアログ追加) ---
    // ★★★ _handleBoardClick, _handleCaptureClick: 確認ダイアログ追加 ★★★
    _handleBoardClick(event) { if (!this.gameStarted||this.gameOver) return; const cell=event.target.closest('.cell'); if(!cell)return; const r=parseInt(cell.dataset.row); const c=parseInt(cell.dataset.col); if(isNaN(r)||isNaN(c)) return; const clickedPos=[r,c]; const clickedPiece=this.board?.[r]?.[c]; console.log(`Board click: Player ${this.currentPlayer}, Clicked [${r},${c}]`); if (this.selectedPiece) { if (this.selectedPiece.type==='board') { const fromPos=this.selectedPiece.position; if (!fromPos){this.deselectPiece();return;} if(fromPos[0]===r&&fromPos[1]===c){this.deselectPiece();return;} this.movePiece(fromPos, clickedPos); } else { this.dropPiece(this.selectedPiece.piece, clickedPos); } } else { if(clickedPiece?.player===this.currentPlayer) { this.selectPiece(clickedPiece, clickedPos); } } }
    _handleCaptureClick(event, player) { if (!this.gameStarted||this.gameOver||player!==this.currentPlayer) { return; } /* ★ 確認は打つときなので選択は許可 ★ */ console.log(`Capture click: Player ${this.currentPlayer}`); const el=event.target.closest('.piece'); if(!el)return; const type=el.dataset.type; if(!type)return; const has=this.capturedPieces[player]?.some(p=>p.type===type); if(!has){return;} const data={type:type, player:this.currentPlayer, promoted:false}; if(this.selectedPiece?.type==='capture'&&this.selectedPiece.piece.type===type)this.deselectPiece(); else this.selectPiece(data,null,'capture'); }

    // --- Piece Selection & Highlighting ---
     selectPiece(pieceData, position, type='board') { this.deselectPiece(); if(!pieceData)return; this.selectedPiece={type:type, piece:pieceData, position:position}; const name=pieceData.type; console.log(`Selected: ${name}`); if(type==='board'&&position){const cell=this.boardElement?.querySelector(`.cell[data-row="${position[0]}"][data-col="${position[1]}"]`); if(cell?.firstChild){cell.firstChild.classList.add('selected'); cell.firstChild.setAttribute('aria-pressed','true');}} else if(type==='capture'){const cont=this.currentPlayer==='sente'?this.senteCapturesElement:this.goteCapturesElement; const el=cont?.querySelector(`.piece[data-type="${pieceData.type}"]`); if(el){el.classList.add('selected'); el.setAttribute('aria-pressed','true');}} this.highlightValidMoves(); this.updateMessage(`${this.getPlayerName(this.currentPlayer)}が${name}を選択`); }
    deselectPiece() { this.clearHighlights(); if(this.selectedPiece){ if(this.selectedPiece.type==='board'&&this.selectedPiece.position){ const[r,c]=this.selectedPiece.position; const cell=this.boardElement?.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`); if(cell?.firstChild){cell.firstChild.classList.remove('selected'); cell.firstChild.removeAttribute('aria-pressed');}} else if(this.selectedPiece.type==='capture'){const cont=this.currentPlayer==='sente'?this.senteCapturesElement:this.goteCapturesElement; const el=cont?.querySelector('.piece.selected'); if(el){el.classList.remove('selected'); el.removeAttribute('aria-pressed');}} this.selectedPiece=null; if(this.gameStarted&&!this.gameOver){ this.checkGameState();}} } // 履歴中でも手番表示に戻す
    highlightValidMoves() { this.clearHighlights(); if (!this.selectedPiece) return; const piece=this.selectedPiece.piece; const type=this.selectedPiece.type; const fromPos=this.selectedPiece.position; let highlightedCount = 0; for(let r=0;r<9;r++){for(let c=0;c<9;c++){ const toPos=[r,c]; let isValid=false; if(type==='board'&&fromPos){isValid=this._checkBasicMoveGeometry(fromPos,toPos,piece); if(isValid&&piece.type==='王'){const tmpB=this._cloneBoard(this.board); if(tmpB[fromPos[0]]?.[fromPos[1]]){ tmpB[r][c]={...tmpB[fromPos[0]][fromPos[1]]}; tmpB[fromPos[0]][fromPos[1]]=null; if(this._isCheck(piece.player,tmpB))isValid=false; } else { isValid = false; } } } else if(type==='capture'){isValid=!(this.board?.[r]?.[c]); if(isValid){const pl=this.currentPlayer; const pt=piece.type; if(pl==='sente'&&((r===0&&(pt==='歩'||pt==='香'))||(r<=1&&pt==='桂')))isValid=false; else if(pl==='gote'&&((r===8&&(pt==='歩'||pt==='香'))||(r>=7&&pt==='桂')))isValid=false; if(isValid&&pt==='歩'){for(let ri=0;ri<9;ri++){const ex=this.board?.[ri]?.[c]; if(ex?.type==='歩'&&!ex.promoted&&ex.player===pl){isValid=false;break;}}}}} if(isValid){ const cell=this.boardElement?.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`); if(cell) { cell.classList.add('highlighted'); highlightedCount++; const el=cell.getAttribute('aria-label')||this._getCoordsNotation(toPos); cell.setAttribute('aria-label',`${el.replace(/ \(移動可能\)$/,'')} (移動可能)`); } } }} /*console.log(`Highlighted ${highlightedCount} moves.`);*/ }
    clearHighlights() { this.boardElement?.querySelectorAll('.cell.highlighted').forEach(c=>{c.classList.remove('highlighted'); let l=c.getAttribute('aria-label'); if(l?.includes('(移動可能)'))c.setAttribute('aria-label',l.replace(' (移動可能)','').trim());}); }

    // --- Other Helpers ---
     getPlayerName(player) { if (!player) return ''; const i=player==='sente'?this.senteNameInput:this.goteNameInput; return i?(i.value.trim()||(player==='sente'?'先手':'後手')):(player==='sente'?'先手':'後手'); }
     _getCoordsNotation(pos) { if(!pos?.length === 2)return'??'; const[r,c]=pos; if(isNaN(r)||isNaN(c)||r<0||r>8||c<0||c>8)return'??'; return`${9-c}${String.fromCharCode(97+r)}`; }
     _generateMoveNotation(f,t,p,pr,cap){if(!p)return"?"; const m=p.player==='sente'?'▲':'△'; const tc=this._posToUsi(t)||"??"; const fc=this._posToUsi(f)||"??"; let n=p.type; if(pr){const bc=this.pieceMap[n]; if(bc){const pc='+'+bc.replace('+',''); n=this.reversePieceMap[pc]||`+${n}`;}else{n=`+${n}`;}} return`${m}${tc}${n}${pr?'成':''}(${fc})`; }
     _generateDropNotation(t,p){if(!p)return"?"; const m=p.player==='sente'?'▲':'△'; const tc=this._posToUsi(t)||"??"; const n=p.type||'?'; return`${m}${tc}${n}打`; }
     announceMove(announcement) { if(this.liveRegion){this.liveRegion.textContent=announcement; setTimeout(()=>{if(this.liveRegion)this.liveRegion.textContent='';},500);} console.log("Announce:",announcement); }
     _cloneBoard(board) { return board.map(row => row?.map(p => p ? { ...p } : null) ?? null); }
     _cloneCaptures(captures) { return { sente: captures.sente.map(p => ({ ...p })), gote: captures.gote.map(p => ({ ...p })) }; }

} // ★★★ End of ShogiGame class ★★★

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOMContentLoaded event fired. Initializing ShogiGame...");
    try { const game = new ShogiGame(); window.shogiGame = game; console.log("ShogiGame instance created successfully."); }
    catch (e) { console.error("Error creating ShogiGame instance:", e); const body = document.querySelector('body'); if(body) body.innerHTML = `<p style="color:red;font-weight:bold;padding:20px;">初期化失敗: ${e.message}<br>コンソール確認。</p>`; }
});