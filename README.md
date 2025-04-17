﻿# Shogi Game

 これはブラウザで遊べる将棋ゲームです。

#セットアップ手順

このアプリを実行するにはPythonと仮想環境が必要です。

### 1. 仮想環境の作成(Windowsの場合)

'''bash
python -m venv venv 
venv\Scripts\activate

#必要なライブラリのインストール
pip install -r requirements.txt

#アプリの起動
Python backend.py

##注意
・venvフォルダはGit環境に含まれておりません。
ご自身の環境で作成してください。
 

 ##特徴
 -HTML + CSS + JS でフロントエンド
 -Python (Flask)をバックエンドに使用

 ##遊び方
 ・サーバーを起動します
 ・ブラウザで'http://localhost:5500'を開く
 ・振り駒を振る
 ・名前の入力
 ・対局開始
 ・投了
 ・リセット

 
 ※注意!!
 これはローカルで遊ぶwebアプリです。
 通信が暗号化されていません
 公開サーバーにして、他人がブラウザで直接アクセスできる状態にして遊ぶときは
 必ずhttpsで暗号化して遊んでください!!


  ##セキュリティに関する注意事項
 このアプリは学習・個人利用を目的としています。
 実際にWEB上で公開する場合は、以下の対策を行ってください。

 -ユーザー入力の文字入力の制限
 -SQLインジェクションやXSS対策
 -httpsによる通信の暗号化
 -セッション管理や認証の安全な実装

 これらを怠ると、情報漏洩や攻撃のリスクがあります。
 また使用は自己責任でお願いします。
 

 ##持将棋について
 ・このゲームではトライルールを採用しています。


