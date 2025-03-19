# symbol_book_v3_demo_dao
次世代組織のための実用 Symbol ブロックチェーンアプリケーションのデモアプリ（DAO）

## 動かし方
前提：Node.jsがインストールされていること。 動作確認済みNode.jsバージョン： 22.11.0

- .env  ファイル  
.env.sampleをコピーして、.envファイルを作成
```bash
cp server/.env.sample server/.env
``` 
 `PRIVATE_KEY`の設定をしてください
```ini: server/.env
PRIVATE_KEY=12*************************34
```

- server  
serverフォルダに移動し、依存パッケージをインストール。その後アプリケーションを起動。
```bash
cd server
npm i
npm run dev
```

- client  
clientフォルダに移動し、依存パッケージをインストール。その後アプリケーションを起動。
```bash
cd client
npm i
npm run dev
```
- serverおよびclientのアプリケーションが起動したら、ブラウザから http://localhost:3000 にアクセスしてください。