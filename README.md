# ピタッとけんしん

学校検診でやることを、見てわかって、試して覚えられる練習アプリです。

## 内容

- ピタッと ポーズ！
  - 内科 / 眼科 / 耳鼻科 / 心電図の静止練習
- おくち アーン
  - アーン / イーの口腔練習
- どっち むいてる？
  - ランドルト環を使った視力練習

## 使い方

```powershell
node server.js
```

ブラウザで `http://localhost:4173` を開いて確認します。

## 技術構成

- Vanilla JavaScript
- MediaPipe Face Landmarker
- LocalStorage による設定保存
- Service Worker によるローカル配信補助

## バージョン

- `1.0.0`
