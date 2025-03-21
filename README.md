# symbol_book_v3_demo_dao
次世代組織のための実用 Symbol ブロックチェーンアプリケーションのデモアプリ（DAO）

## 動かし方
前提：Node.jsがインストールされていること。 動作確認済みNode.jsバージョン： 22.11.0

- .env  ファイル  
プロジェクトのルートディレクトリから .env.sampleをコピーして、.envファイルを作成
```bash
cp server/.env.sample server/.env
``` 
.envファイルの `PRIVATE_KEY`の設定をしてください
```ini: server/.env
PRIVATE_KEY=12*************************34
```

- server  
serverディレクトリに移動し、依存パッケージをインストール。その後アプリケーションを起動
```bash
cd server
npm i
npm run dev
```

- client  
新しくターミナルを起動  
ルートディレクトリからclientディレクトリに移動し、依存パッケージをインストール。その後アプリケーションを起動
```bash
cd client
npm i
npm run dev
```
- serverおよびclientのアプリケーションが起動したら、ブラウザからclientのURL( http://localhost:5173 など)にアクセスしてください