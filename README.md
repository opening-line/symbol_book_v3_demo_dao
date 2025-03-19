# symbol_book_v3_demo_dao
次世代組織のための実用 Symbol ブロックチェーンアプリケーションのデモアプリ（DAO）

## 動かし方
前提：Node.jsがインストールされていること  
動作確認済みバージョン： 22.11.0

- .env  ファイル  
.env.sampleをコピーして、.envファイルを作成。作成後に `PRIVATE_KEY`の設定をしてください。
```
cp server/.env.sample server/.env
```

- server  
serverフォルダに移動し、依存パッケージをインストール。その後アプリケーションを起動。
```
cd server
npm i
npm run dev
```

- client  
clientフォルダに移動し、依存パッケージをインストール。その後アプリケーションを起動。
```
cd client
npm i
npm run dev
```
- serverおよびclientのアプリケーションが起動したら、ブラウザから http://localhost:3000 にアクセスしてください。