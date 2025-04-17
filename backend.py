# backend.py (トライ判定簡略化・status追加版)
from flask import Flask, request, jsonify
from flask_cors import CORS
import shogi # python-shogiライブラリ
import traceback # エラー詳細表示のため
from collections import defaultdict # 局面カウント用

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# --- 定数 ---
SENTE = 'sente'
GOTE = 'gote'
SHOGI_SENTE = shogi.BLACK
SHOGI_GOTE = shogi.WHITE

# --- トライルール判定用 定数 ---
TARGET_SQUARE_SENTE_WINS = 4  # 5i (後手初期位置) - 先手がここに来たら勝ち
TARGET_SQUARE_GOTE_WINS = 76 # 5a (先手初期位置) - 後手がここに来たら勝ち

# --- ヘルパー関数 ---
def player_to_shogi_color(player_str): return SHOGI_SENTE if player_str == SENTE else SHOGI_GOTE
def shogi_color_to_player(color): return SENTE if color == SHOGI_SENTE else GOTE

def generate_captured_sfen(board):
    """持ち駒部分のSFEN文字列を生成する"""
    sente_str = ""; gote_str = ""
    piece_order = [shogi.ROOK, shogi.BISHOP, shogi.GOLD, shogi.SILVER, shogi.KNIGHT, shogi.LANCE, shogi.PAWN]
    piece_symbols = { shogi.ROOK: 'R', shogi.BISHOP: 'B', shogi.GOLD: 'G', shogi.SILVER: 'S', shogi.KNIGHT: 'N', shogi.LANCE: 'L', shogi.PAWN: 'P'}
    for p_type in piece_order:
        s_count = board.pieces_in_hand[SHOGI_SENTE].get(p_type, 0)
        g_count = board.pieces_in_hand[SHOGI_GOTE].get(p_type, 0)
        p_symbol = piece_symbols.get(p_type)
        if p_symbol:
            if s_count > 0: sente_str += (str(s_count) if s_count > 1 else '') + p_symbol.upper()
            if g_count > 0: gote_str += (str(g_count) if g_count > 1 else '') + p_symbol.lower()
    captured_part = sente_str + gote_str
    return captured_part if captured_part else "-"

def get_position_hash(board: shogi.Board):
    """手番、盤面、持ち駒を含む一意なハッシュ文字列を生成 (千日手判定用)"""
    full_sfen = board.sfen()
    parts = full_sfen.split(' ')
    if len(parts) >= 3: return f"{parts[0]} {parts[1]} {parts[2]}"
    else: print(f"Warn: Bad SFEN: {full_sfen}. Fallback hash."); bp=getattr(board,'board_sfen',lambda:parts[0]if parts else"")(); tp='b'if board.turn==SHOGI_SENTE else 'w'; cs=generate_captured_sfen(board); return f"{bp} {tp} {cs}"

# --- 簡易的なゲーム状態と履歴管理 ---
game_state = { 'board': shogi.Board(), 'history': defaultdict(int) }
initial_hash = get_position_hash(game_state['board']); game_state['history'][initial_hash] += 1
print(f"Initial state hash: {initial_hash}")

# --- トライルール判定 (条件を満たすかだけ返す) ---
# ★★★ check_try_win_condition: エラー回避のため簡略化 ★★★
def check_try_win_condition(board: shogi.Board):
    """玉が相手の初期位置に到達しているかチェック (勝ち宣言はクライアント)"""
    moved_player_color = not board.turn
    moved_player_str = shogi_color_to_player(moved_player_color)
    print(f"Checking Try Win condition for player: {moved_player_str}")

    # Find the king square *manually* to avoid potential method issues
    king_pos = None
    king_piece_type = shogi.KING
    for square_index in range(81):
        piece = board.piece_at(square_index)
        if piece is not None and piece.piece_type == king_piece_type and piece.color == moved_player_color:
            king_pos = square_index
            break

    print(f"King position for {moved_player_str} (found manually): {king_pos}")
    if king_pos is None: return False # 玉がいない

    if moved_player_str == SENTE and king_pos == TARGET_SQUARE_SENTE_WINS: print("Try win condition MET for Sente."); return True
    elif moved_player_str == GOTE and king_pos == TARGET_SQUARE_GOTE_WINS: print("Try win condition MET for Gote."); return True
    return False # 条件満たさず

# --- 千日手判定 ---
def check_repetition(board: shogi.Board, history: dict):
    current_position_hash = get_position_hash(board)
    count = history.get(current_position_hash, 0)
    print(f"Checking repetition for hash: {current_position_hash}, Count: {count}")
    return count >= 4

# --- APIエンドポイント ---
@app.route('/reset', methods=['POST'])
def handle_reset():
    """ゲーム状態をリセット"""
    global game_state; game_state={'board':shogi.Board(),'history':defaultdict(int)}
    hsh=get_position_hash(game_state['board']); game_state['history'][hsh]+=1
    print("--- Game Reset ---"); print(f"Initial hash after reset: {hsh}")
    return jsonify({'success': True, 'message': 'Game reset.', 'sfen': game_state['board'].sfen()})

@app.route('/set_turn', methods=['POST'])
def handle_set_turn():
    """サーバー側の手番を設定（振り駒結果同期用）"""
    global game_state; data = request.json; player = data.get('player')
    print(f"Received set_turn request for: {player}")
    if player not in [SENTE, GOTE]: return jsonify({'error': 'Invalid player specified'}), 400
    try:
        new_turn_color = player_to_shogi_color(player)
        current_sfen_parts = game_state['board'].sfen().split(' ')
        if len(current_sfen_parts) >= 4:
            current_sfen_parts[1] = 'b' if new_turn_color == SHOGI_SENTE else 'w'
            new_sfen = ' '.join(current_sfen_parts)
            game_state['board'] = shogi.Board(new_sfen)
            game_state['history'] = defaultdict(int) # 履歴もリセット
            hsh = get_position_hash(game_state['board'])
            game_state['history'][hsh] += 1
            print(f"Turn set to {player}. New hash: {hsh}")
            return jsonify({'success': True, 'message': f'Turn set to {player}', 'sfen': game_state['board'].sfen()})
        else: return jsonify({'error': 'Failed to parse SFEN for turn update'}), 500
    except Exception as e: print(f"Error setting turn: {e}"); traceback.print_exc(); return jsonify({'error': f'サーバー内部エラー: {e}'}), 500

@app.route('/set_state', methods=['POST'])
def handle_set_state():
    """クライアントの履歴ロードに合わせてサーバーの状態を設定"""
    global game_state; data = request.json; sfen = data.get('sfen')
    print(f"Received set_state request with SFEN: {sfen}")
    if not sfen: return jsonify({'error': 'Missing sfen parameter'}), 400
    try:
        new_board = shogi.Board(sfen); game_state['board'] = new_board
        # 履歴をクリアし、この局面を初期状態とする
        game_state['history'] = defaultdict(int)
        current_hash = get_position_hash(game_state['board'])
        game_state['history'][current_hash] += 1
        print(f"Server state set by SFEN. New hash: {current_hash}")
        return jsonify({'success': True, 'message': 'Server state set.', 'sfen': game_state['board'].sfen()})
    except ValueError as e: print(f"Error setting state from SFEN: {e}"); traceback.print_exc(); return jsonify({'error': f'Invalid SFEN format: {e}'}), 400
    except Exception as e: print(f"Server error during set_state: {e}"); traceback.print_exc(); return jsonify({'error': f'サーバー内部エラー: {e}'}), 500

@app.route('/move', methods=['POST'])
def handle_move():
    global game_state; data=request.json; usi_move=data.get('usi_move')
    print(f"\n--- Move Request: {usi_move} ---")
    if not usi_move: return jsonify({'error': 'Missing usi_move'}), 400
    try:
        # 現在のサーバー状態からコピーを作成 (SFEN経由)
        current_sfen = game_state['board'].sfen()
        board = shogi.Board(current_sfen)
        print(f"Copied board from SFEN: {current_sfen}")

        current_turn_str = shogi_color_to_player(board.turn); print(f"Current Turn: {current_turn_str}")
        move = shogi.Move.from_usi(usi_move); print(f"Parsed USI: {move.usi()}")

        if move in board.legal_moves:
            print("Legal move."); board.push(move); next_turn_str = shogi_color_to_player(board.turn); print(f"New turn: {next_turn_str}")
            hsh=get_position_hash(board); game_state['history'][hsh]+=1; print(f"Hash: {hsh}, Count: {game_state['history'][hsh]}")

            status='ongoing'; reason=''; winner=None; msg = ''

            # ★★★ 判定順序: トライ条件 -> 詰み -> 千日手 ★★★
            if check_try_win_condition(board): # トライ条件チェック
                 status = 'try_possible'       # ステータスを 'try_possible' に
                 winner = None                 # 勝者はクライアントで決定
                 reason = '入玉宣言可能'
                 turn_display = '先手' if next_turn_str == SENTE else '後手'
                 msg = f"{turn_display}の手番 ({reason})" # メッセージに宣言可能と表示
                 print(f"Result: Try possible for {shogi_color_to_player(not board.turn)}")
            elif board.is_checkmate():
                winner = shogi_color_to_player(not board.turn); status = 'checkmate'; reason = '詰み'
                msg = f"{('先手' if winner == SENTE else '後手')}の勝ち({reason})"
                print(f"Result: Checkmate. Winner: {winner}")
            elif check_repetition(board, game_state['history']):
                status = 'repetition'; reason = '千日手'; winner = None
                msg = f"{reason}により引き分けです。"
                print("Result: Repetition draw.")
            else: # ゲーム続行
                status = 'ongoing'
                turn_display = '先手' if next_turn_str == SENTE else '後手'
                if board.is_check(): msg=f"{turn_display}の手番 (王手)"
                else: msg = f"{turn_display}の手番"
            # ★★★★★★★★★★★★★★★★★★★★★★★★

            game_state['board'] = board # 内部状態更新

            resp={'success':True, 'new_sfen':board.sfen(), 'status':status, 'winner':winner, 'is_check':board.is_check(), 'message':msg}
            print(f"Response: {resp}"); return jsonify(resp)
        else: print(f"Illegal: {usi_move} (Turn: {current_turn_str})"); return jsonify({'success':False, 'message':"不正な手です。"})

    except ValueError as e: print(f"Err parse/illegal: {e}"); traceback.print_exc(); return jsonify({'error':f'Invalid fmt/move: {e}'}),400
    except AttributeError as e: print(f"Attribute Error: {e}"); traceback.print_exc(); error_msg = f"サーバー内部エラー (属性エラー): {e}"; return jsonify({'error': error_msg}), 500
    except Exception as e: print(f"Server error: {e}"); traceback.print_exc(); return jsonify({'error':f'サーバー内部エラー: {e}'}),500

if __name__ == '__main__': print("Starting server..."); app.run(host='0.0.0.0', port=5001, debug=True)