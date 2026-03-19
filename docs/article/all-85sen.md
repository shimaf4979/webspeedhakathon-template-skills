---
title: Webフロントエンドパフォーマンスチューニング85選
tags: JavaScript フロントエンド Web React Vue.js
author: nuko-suke
slide: false
---
こんにちは、ぬこすけです。

近年、**Webフロントエンドではサイトのパフォーマンスの重要性が高まっています**。

例えば、GoogleはCore Web Vitalというパフォーマンスに指標を検索結果のランキング要因に組み込みました。
また、近年の某企業が「パフォーマンスの改善に取り組んだ結果、セッション数〇％アップ、CVR〇％アップ...」などの事例は枚挙にいとまがないでしょう。

https://web.dev/why-speed-matters/

パフォーマンスチューニングするためには、定量的に計測してボトルネックを探すようなトップダウンなアプローチもあります。

しかしながら、時には**千本ノック的にハウツーを片っ端から試していくボトムアップなアプローチも有効**になることもあったり、**日々のコーディングでパフォーマンスを意識したコードを書くことは大切**でしょう。

この記事では**パフォーマンス最適化のハウツー**を紹介します。
**パフォーマンス改善の施策が思い浮かばない時やフロントエンドのスキルを磨きたい時に辞書的な役割を果たせれば良い**かなーと思っています。

※この記事を読んでいる方にはこれからフロントエンジニアになりたい方、駆け出しエンジニアの方もいると思います。正直、**何言ってるかわからない部分が結構ある**と思います。ですが、私の経験則上、「あの時書いてあったことはこういうことか！」と後々になって理解することがよくありました。今はよくわからないかもしれませんが、**とりあえずストックなりしておいて、数ヶ月後にこの記事を見返すとまた理解度も変わる**のかなーと思います。

#### 更新情報(2025/02/10)
5つ追加しました

* [WebWorkerで巨大なデータを転送する時は移譲可能オブジェクト(Transferable objects)を使う](#webworkerで巨大なデータを転送する時は移譲可能オブジェクトtransferable-objectsを使う)
* [リアルタイム配信にはx-accel-buffering-noヘッダーを付与する](#リアルタイム配信にはx-accel-buffering-noヘッダーを付与する)
* [forEachよりもfor...ofを使う](#foreachよりもforofを使う)
* [reduceでスプレッド構文は使わない](#reduceでスプレッド構文は使わない)
* [サイズ変更の検知にはResize Observerを使う](#サイズ変更の検知にはresize-observerを使う)

#### 注意事項
* 一口にフロントエンドといっても、SSRやらSSGやらでサーバー側も関わってくることもあるので、**バックエンド寄りも話も混じっている**ので悪しからず。
* わかりやすくするためにカテゴリに分けしていますが、**微妙なカテゴリ分けのものもある**ので悪しからず。
* 中には具体的なハウツーというより**考え方みたいなものも混じっている**かもしれませんが悪しからず。
* **環境によって必ずしもパフォーマンスが改善されるとは限らない**ので悪しからず。
* あくまでパフォーマンスの観点なので**他の観点では最適となるとは限らない**ので悪しからず。例えば、`IndexedDB`を紹介していますが、[Sarafi 15で脆弱性](https://gigazine.net/news/20220117-safari-bug-google-id-leak/)が見つかっています。
* 紹介するものには**特定のブラウザでしかサポートされていないものもある**ので悪しからず。

# JavaScript編

## 複数の非同期処理はPromise.allを使う
もし互いに依存関係のない複数の非同期処理を実行しているのならば、`Promise.all`を使うのも手です。

https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Promise/all

```js
async function notUsePromiseAll() {
  console.log('Start!!');
  const response1 = await fetch("https://example.com/api/1");
  const response2 = await fetch("https://example.com/api/2");
  console.log('End!!');
}

async function usePromiseAll() {
  console.log('Start!!');
  const [response1, response2] = await Promise.all([
    fetch("https://example.com/api/1"),
    fetch("https://example.com/api/2"),
  ]);
  console.log('End!!');
}
```

`Promise.all`はいずれかの非同期処理が失敗すると、 `Promise.all` の結果は失敗扱いになります。
失敗扱いにしたくない場合は`Promise.allSettled`が使えます。

https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled

## 非同期処理を待たなくて良い場合は待たない
コードを眺めてみて、非同期処理を待たなくて良いところは待たないようにしましよう。
具体的には、もし`async/await`構文を使っているなら`await`を使わないことです。

```js
const sendErrorToServer = async (message) => {
  // サーバーにエラー情報を送る処理
};

console.log('何かエラーが起きた');
// 後続の処理はサーバーにエラー情報を送る処理とは関係ないので await をつけない
sendErrorToServer('エラーです');
console.log('後続の処理');
```

## 先に非同期処理を走らせておく
互いに依存関係のある複数の非同期処理を実行する場合でも、時間がかかる処理の方を先に走らせておくのも良いでしょう。

```js
const response1Promise = requestLongTime();
// ...
// 色々処理
// ...
const response1 = await response1Promise;
const response2 = await requestShortTime();
console.log(response1, response2);
```

## キー/バリューを頻繁に追加や削除する場合はMapを使う
MDNにも記載がありますが、キー/バリューのペアを頻繁に追加や削除する場合は`Object`よりも`Map`を使ったほうが最適です。

https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Map

```js
const nameAgeMap = new Map()
nameAgeMap.set('Tom', 19)
nameAgeMap.set('Nancy', 32)
nameAgeMap.delete('Tom')
nameAgeMap.delete('Nancy')
...
```

## 膨大な配列の検索はキー/バリューで
`JavaScript`というよりかはロジックの問題かもしれません。
膨大な配列を検索する場合はキー/バリューに変換してから検索した方が速いです。

```js
const thousandsPeople = [
  { name: 'Tom', age: 19 },
  { name: 'Nancy', age: 32 },
  // ...めちゃくちゃ多い
]

// 時間かかる
const myFriend = thousandsPeople.find(({ name }) => name === 'Tom');
console.log(`The age is ${myFriend.age}`);

const thousandsPeopleMap = {
  'Tom': 19,
  'Nancy': 32,
  // ...
}

// こっちのほうが速い
const myFriendAge = thousandsPeopleMap['Tom'];
console.log(`The age is ${myFriendAge}`);
```

## 関数の結果をキャッシュする
頻繁に同じ引数で関数を実行したり、重い処理を走らせるなら関数の結果をキャッシュするのも有効です。
次のようなデコレータ関数を作れば、関数の結果をキャッシュできます。

```js
function cachingDecorator(func) {
  const cache = new Map();
  return x => {
    if (!x) {
      return func(x)
    }
    if (cache.has(x)) {
      return cache.get(x);
    }
    const result = func(x);
    cache.set(x, result);
    return result;
  }
}

function heavyFuncNoCache(str) {
  // 重い処理
}

const heavyFunc = cachingDecorator(heavyFuncNoCache);
heavyFunc('hoge');
// キャッシュから結果が返却される
heavyFunc('hoge');
```

## requireではなくimportを使う
JavaScriptのモジュールの読み込み方には`require`と`import`の２種類があります。
`require`は同期的、`import`は非同期的にモジュールを読み込むので、`import`の方が良いでしょう。
`Node.js`といったサーバーサイドでJavaScriptを記述する場合は`require`を使うことが多いと思いますが、バージョン14であれば`package.json`だったりファイルの拡張子を`mjs`にしたりいじることで`import`で読み込めます。

なお、Qiitaのこの記事がわかりやすいです。

https://qiita.com/suin/items/a106289e2d1d8d9c1490

## フェッチにはKeep-Aliveを指定する
何度も同じドメインへアクセスするのであれば`keep-alive`を指定することでフェッチ処理が短縮されます。

```js
import axios from 'axios';
import { Agent as HttpAgent } from 'http';
import { Agent as HttpsAgent } from 'https';

const httpAgent = new HttpAgent({ keepAlive: true });
const httpsAgent = new HttpsAgent({ keepAlive: true });

const keepAliveAxios = axios.create({
  httpAgent,
  httpsAgent,
});

keepAliveAxios.get(...);
```

https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Keep-Alive

## 非同期の関数を使う
`Node.js`には同期/非同期で別で用意されている関数があったりします。
例えばファイルに書き込みをする関数には`fs.writeFileSync`と`fs.writeFile`があります。
もしフロントエンドアプリケーションのビルド時などに静的ファイルを生成する必要がある場合、特段理由がなければ`fs.writeFile`を使いましょう。

## 不要なimportは削除する
不要な import によってスクリプトサイズが肥大化しないように削除しましょう。
`eslint` を使っているのであれば `eslint-plugin-unused-imports` で不要な import を発見できます。
VSCode や WebStorm などのIDEでファイル保存時に `eslint` を走らせるようにすると便利です。

https://github.com/sweepline/eslint-plugin-unused-imports

## TreeShaking を意識して書く
webpack などのバンドラーではコードを解析し、利用していないコードは削除してくれる **TreeShaking** という仕組みがあります。
この Tree Shaking を理解しながらコードを書くとスクリプトサイズを落とすことができます。

例えば、「クラスを使わずにできるだけ関数に分割して export する」というのが挙げられます。
次のような 2 つのファイルがあったとしましょう。

```js
// ファイル1：クラスで書いたファイル
export class Test {
  static hoge() { console.log('hoge') }
  static fuga() { console.log('fuga') }
}

// ファイル2：関数で書いたファイル
export function hoge() { console.log('hoge') }
export function fuga() { console.log('fuga') }
```

このとき、 `hoge` の機能を使いたい場合、それぞれ次のようなコードになります。

```js
// ファイル1の場合
import { Test } from 'file1';

Test.hoge();

// ファイル2の場合
import { hoge } from 'file2';

hoge();
```

ファイル1のケースでは、 `Text` クラスを丸ごと import しているため、 Tree Shaking が効かず利用していない `fuga` がバンドルに含まれます。
一方でファイル2では `hoge` のみ import しているため、 Tree Shaking が効いて `fuga` はバンドルに含まれず、最終的なスクリプト量を削減することができます。

このように、 Tree Shaking を意識してコードを設計することによりスクリプトサイズを削減することができます。
[Tree Shaking はライブラリを選定する上でも重要](#treeshakable-なライブラリを採用する)です。

## トランスパイル後のコードを意識して書く
Babel などを使って JavaScript をブラウザが対応するバージョンへ変換（トランスパイル）することが多いと思います。
**自分が書いたコードが最終的にどのようなコードに変換されるかはチェックした方が良い**でしょう。

例えば、次のようなクラスを使ったコードを ES2015 に変換するとします。

```js
class Test {
    hoge(){
      console.log('hoge');
    }
}
```

この場合、次のようにスクリプトサイズが大きくなってしまいます。

```js
'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Test = function () {
    function Test() {
        _classCallCheck(this, Test);
    }

    _createClass(Test, [{
        key: 'hoge',
        value: function hoge() {
            console.log('hoge');
        }
    }]);

    return Test;
}();
```

一方で関数の場合はどうでしょうか？

```js
function hoge() {
  console.log('hoge');
}
```

このコードはほぼそのままの形で変換されます。

```js
'use strict';

function hoge() {
  console.log('hoge');
}
```

このように、 **同じ機能を実現しようとしても書き方によってはトランスパイル後のコードが肥大化する**こともあります。

なお、簡易的にトランスパイル後のコードを確認するツールもあるので利用するのも良いでしょう。

https://es6console.com/

## `forEach`よりも`for...of`を使う
静的コード解析ツールであるBiomeにあるルールです。

http://biomejs.dev/ja/linter/rules/no-for-each/

`forEach`がパフォーマンス的に良いか悪いかは一概に言えないところもありますが、少なくともBiomeでは、`map`や`filter`のような、配列を扱う上で便利な関数と組み合わせを使うことが2重で配列の処理が入ってしまうことで、特に巨大な配列を扱う場合パフォーマンス上でのデメリットであることをドキュメント上で述べています。

## `reduce`でスプレッド構文は使わない
静的コード解析ツールであるBiomeにもある、`noAccumulatingSpread`というルールです。

https://biomejs.dev/ja/linter/rules/no-accumulating-spread/

```js
var a = ['a', 'b', 'c'];
a.reduce((acc, val) => [...acc, val], []);
```

このような`reduce`の処理は、`O(n)`ではなく`O(n^2)`の計算量となるためです（配列の数が多ければ多いほど計算量も増大すると理解してもらえれば）。

もし`resuce`を使いたい場合は、次のようなコードを使うことがBiomeのルール上では推奨されます。

```js
var a = ['a', 'b', 'c'];
a.reduce((acc, val) => {acc.push(val); return acc}, []);
```

# HTML/CSSなどリソース編

## imgやiframe、linkタグなどにimportance属性を追加する
imgやiframe、linkタグなどでは`importance`属性を使うことでブラウザに読み込みの優先度を指定できます。
タグだけでなく`fetch`関数でもオプションで`importance`を指定できたりします。

https://twitter.com/addyosmani/status/1491272900292530179

**(2022/4/26 追記)**
`importance`属性は`fetchpriority`属性に変更されました。
また、`fetch`関数を使う場合は`priority`プロパティを指定することなります。

```
<img src="/images/sample.svg" fetchpriority="low" alt="example">

fetch('https://example.com/', {priority: 'low'})
```

https://web.dev/priority-hints/#history

## imgやiframeタグにloading属性を追加する
imgやiframeタグには`loading`属性を使うことで読み込みのタイミングを指定できます。
もし、遅延/非同期読み込みしたい場合は`loading='lazy'`を使うと良いでしょう。
ただし、[ファーストビューに使うと返って読み込みが遅くなる可能性](https://www.suzukikenichi.com/blog/lazy-loading-images-above-the-fold-can-make-lcp-slower/)もあるので注意しましょう。

https://developer.mozilla.org/ja/docs/Web/HTML/Element/img#attr-loading

https://developer.mozilla.org/ja/docs/Web/HTML/Element/iframe#attr-loading

## imgタグにdecoding属性を追加する
imgタグは`decoding`属性を使うことでデコードを同期/非同期的に読み込むかを指定できます。
`decoding='async'`を指定すれば非同期的にデコード処理をブラウザに指示できます。

https://developer.mozilla.org/ja/docs/Web/HTML/Element/img#attr-decoding

## imgタグにはサイズを指定しておく
imgタグの`width/height`属性などを使って、画像のサイズを指定しておきましょう。ブラウザのレンダリングの助けになります。
CLSの改善にも繋がります。
わからない場合は大体のサイズを指定しましょう。

## 優先度の高いリソースはlinkタグにpreloadを指定する
ファーストビューに表示する画像など、優先度の高いリソースはlinkタグのrel属性に`preload`を指定ことで速い読み込みが期待できます。

https://developer.mozilla.org/ja/docs/Web/HTML/Link_types/preload

## 優先度の高い外部ドメインへのアクセスがある時はlinkタグにdns-prefetchまたはpreconnectを指定する
外部ドメインからリソースを取得したり重要度の高い外部リンクを設置している場合などは、linkタグの`dns-prefetch`や`preconnect`が使えます。
`dns-prefetch`はDNSルックアップ、`preconnect`は事前接続まで行います。
かなり優先度の高い外部ドメインへのアクセスは`preconnect`、少し優先度が落ちる場合は`dns-prefetch`を使うと良いでしょう。

https://developer.mozilla.org/ja/docs/Web/HTML/Link_types/dns-prefetch

https://developer.mozilla.org/ja/docs/Web/HTML/Link_types/preconnect

## ユーザーがよく遷移するページはlinkタグにprerenderを指定する
linkタグのrel属性に`prerender`を指定することで、ブラウザは指定されたページをバック　グラウンドでレンダリングします。
なので、ユーザーが指定されたページへ遷移する時はすぐに画面表示ができます。
ユースケースとしては、ランキングサイトのようなページで1位へのページへ遷移するユーザーは多いので、`prerender`を指定しておくと良いかもしれません。
ただし、レンダリングされる都合上、ブラウザへの負荷が高かったり、JavaScriptで仕込んでいる計測処理が発火するなどの注意は必要です。

https://developer.mozilla.org/ja/docs/Glossary/prerender

## scriptタグにdeferやasync属性を追加する
ブラウザでスクリプトが読み込まれるとHTMLやCSSの解析がブロックされます。
このような問題を解決するために`defer`や`async`属性が使えます。

`defer`はHTMLやCSSの解析をブロックすることなくスクリプトを読み込んでおき、解析が完了したらスクリプトを実行します。

`async`はHTMLやCSSの解析とは独立してスクリプトの読み込み・実行をします。

Qiitaのこの記事がわかりやすいです。

https://qiita.com/phanect/items/82c85ea4b8f9c373d684

## 優先度の高いリソースの読み込みはできるだけHTML上部で定義する
ブラウザはHTMLドキュメントの上から解釈してきます。
なので、例えば同じ`preload`を指定しているリソースでも、さらに優先度の高いものはよりHTML上部に定義して早めにブラウザが読み込めるようにしましょう。

## CSSで余計なセレクタは書かない
ブラウザはCSSセレクタを右から左に解析します。
なので、できる限り単一のクラス名やid名で指定した方が解析のスピードが上がります。

```css
/* ブラウザは全てのdivタグを探し、さらに上の階層のhogeクラスを見つけようと解析する */
.hoge div {}

/* Best Practice */
.hoge {}
#hoge {}
```

## style属性を使って直接スタイルを指定する
クラスなどセレクタを指定してCSSを書くよりも、直接HTMLタグのstyle属性を使ったほうがブラウザの解析は速いです。
ただし、コードの可読性やメンテが厳しくはなります。

```html
<div style='color: red;'>ほげ</div>
```

## 不要なCSSを削除する
使っていないCSSは削除しましょう。
Chromeのデベロッパーツールを使えば不要なCSSを洗い出すことができます。

## 不要なJavaScriptを削除する
使っていないJavaScriptは削除しましょう。
例えば、`console.log`は基本的にプロダクションのコードでは不要なので、`eslint`で検出するなり`babel`で削除するなりします。

## ファーストビューに影響のあるCSSはheadタグの先頭で読み込む
JavaScriptと違い、ブラウザのCSSの解析はHTMLの解析をブロックしません。
ファーストビューで読み込ませたいCSSはできるだけheadタグの先頭に読み込ませて、速くスタイリングされたファーストビューをユーザーに見せるようにしましょう。

## ファーストビューに影響のないCSSはbodyタグの末尾で読み込む
逆にファーストビューに影響のないCSSはbodyタグの末尾で読み込ませることで、ブラウザにCSSの読み込みを遅延させます。

## JavaScriptはbodyタグの末尾で読み込む
ブラウザはJavaScriptの解析を始めるとHTMLやCSSの解析をストップします。
なので、JavaScriptはbodyタグの末尾で読み込み、HTMLやCSSの解析が終わった後のJavaScriptを解析するようにしましょう。
ただし、Google Analyticsなどの解析用のJavaScript等は除きます。

## HTMLやCSS、JSをMinify/バンドルする
`webpack`や`swc`などのバンドラーを使いましょう。

## JavaScriptのトランスパイルを最新のESに合わせる
もしJavaScriptを`ES2015`でトランスパイルしている場合は、それよりも最新のバージョンでトランスパイルすることによって、JavaScriptのサイズを落とすことができます。
ただし、IEといった古いブラウザを切り捨てる覚悟は必要です。

## 画像はWebPやAVIFを使う
次世代の画像フォーマットとして`WebP`や`AVIF`があります。
こららの画像フォーマットを使うことで従来の`PNG`等の形式よりも画像サイズを縮小できたりします。

IKEAではAVIFによって画像の転送量を21.4%削減した例もあります。

https://twitter.com/robinwhittleton/status/1486013791670353922

## 画像サイズを縮小する
画質を落とすなり幅/高さを小さくするなりして画像サイズを縮小させます。
例えば、SVGでは作成したツールによってはコメントアウトが残っていたりで最適化されずに出力されている場合もあるので、手動で削除するなりツールを使うなりで縮小させます。

## 画像をインライン化する
インライン画像としてHTMLに直接埋め込むことで、画像のリクエスト数を抑えることができます。
ただし、画像サイズが大きくなったりブラウザのキャッシュが効かない等のデメリットはあります。
画像サイズが小さく、一度しか読み込まれない場合などに有効といわれています。

## 過大なDOMを避ける
DOMが多すぎるとブラウザの描画に負担をかけてしまいます。
不要なDOMを削除するのはもちろん、遅延読み込みや仮想無限スクロールなどを駆使してユーザーに表示されている部分だけ描画することで対策できます。

## サードパーティスクリプトの読み込みにはPartytownを使う
Google Analytics のような分析、または Google Adsense のような広告などサードパーティスクリプトをサイトに貼っている人も多いかと思います。
このようなサードパーティスクリプトはブラウザのメインスレッドの処理を妨げることが多々あります。

この記事の執筆現在、まだベータ版ではありますが `Partytown` というライブラリが使えます。
詳しい仕組みは割愛しますが、 `Partytown` によってサードパーティスクリプトの読み込みを `WebWorker` に移譲することができ、メインスレッドへの負担を軽減させることができます。

https://partytown.builder.io/

## 特定の文字のみGoogleFontを使っている場合はtextパラメータを使う
もしあなたのサイトで特定の文字の装飾のためにGoogleFontを読み込んでいる場合は、 `text` パラメータに装飾したい文字だけ指定することでパフォーマンスを上げることができます。

https://twitter.com/addyosmani/status/1494209686161088514

## CSS Containment を活用する
JavaScript で DOM を挿入するように、DOM の構造が変わることで全体のスタイルの再計算が走ります。
CSS Containment を活用することで、ある箇所で DOM の変更があっても、他の箇所のスタイルの再計算は走らせないといった制御ができます。

https://developer.mozilla.org/ja/docs/Web/CSS/CSS_Containment

## リダイレクトを避ける
a タグや img タグなどブラウザからリソースを取得させる場合は、できる限りリダイレクトが発生しない URL を設定した方がリソースの取得が早くなります。

```html
<!-- リダイレクトが発生する -->
<img src='//www.test.com/images/1234.png' />

<!-- リダイレクトが発生しない -->
<img src='//test.com/images/1234.png' />
```

## 画像を使わず HTML/CSS でアイコンを表示する
複雑なアイコンでなければインラインで SVG を埋め込んだり外部から画像をリクエストせず HTML/CSS を使ってアイコンを表示できます。

![hamburger button.png](https://qiita-image-store.s3.ap-northeast-1.amazonaws.com/0/164159/b409ec07-79d3-7251-a934-aeb0a7fe6bb5.png)

例としてハンバーガーボタンを挙げましょう。
ハンバーガーボタンは次のような HTML と CSS で作成できます。

```html
<button class='hamburger-button' aria-label='メニュー'>
  <div class='bar'></div>
</button>
```

```css
.hamburger-button, .hamburger-button::before, .hamburger-button::after, .bar {
  width: 32px;
}

.hamburger-button {
  height: 32px;
  background-color: white;
  /* ユーザーエージェントの Style が当たるのでリセット */
  padding: 0;
  border-width: 0;
}

.hamburger-button::before, .hamburger-button::after, .bar {
  height: 4px;
  background-color: gray;
}

.hamburger-button::before, .hamburger-button::after {
  display: block;
  content: ' ';
}

.hamburger-button::before {
  margin-bottom: 8px;
}

.hamburger-button::after {
  margin-top: 8px;
}
```

## before や after の疑似要素を使って不要な DOM を作らない
**疑似要素の `before` や `after` を使えば必要以上な DOM の作成を抑えることもできます**。

先述の「[画像を使わず HTML/CSS でアイコンを表示する](https://qiita.com/nuko-suke/items/50ba4e35289e98d95753#%E7%94%BB%E5%83%8F%E3%82%92%E4%BD%BF%E3%82%8F%E3%81%9A-htmlcss-%E3%81%A7%E3%82%A2%E3%82%A4%E3%82%B3%E3%83%B3%E3%82%92%E8%A1%A8%E7%A4%BA%E3%81%99%E3%82%8B)」のハンバーガーメニューを例に挙げます。
疑似要素を使わない場合は次のような HTML になります。

```html
<button class='hamburger-button' aria-label='メニュー'>
  <div class='bar1'></div>
  <div class='bar2'></div>
  <div class='bar3'></div>
</button>
```

このように装飾のために `div` を作成する必要があります。
一方で、 画像を使わず「[画像を使わず HTML/CSS でアイコンを表示する](https://qiita.com/nuko-suke/items/50ba4e35289e98d95753#%E7%94%BB%E5%83%8F%E3%82%92%E4%BD%BF%E3%82%8F%E3%81%9A-htmlcss-%E3%81%A7%E3%82%A2%E3%82%A4%E3%82%B3%E3%83%B3%E3%82%92%E8%A1%A8%E7%A4%BA%E3%81%99%E3%82%8B)」でお話したように疑似要素の `before` や `after` を使って次のように `div` を減らすことができます。

```html
<button class='hamburger-button' aria-label='メニュー'>
  <div class='bar'></div>
</button>
```

このように **疑似要素の `before` や `after` を使うことで必要以上な DOM 生成を抑え、 HTML ファイルサイズの削減にも繋がります**。
この他、コードの可読性を高めたり、 SEO 対策（直接的にページのコンテンツに関係ないものを省けて適切なコンテンツ評価に繋がる）にもなるといったメリットもあります。

## JSONCrush を使って JSON 文字列を圧縮する

`JSONCrush` というライブラリを使うことで JSON 文字列を圧縮することができます。

https://github.com/KilledByAPixel/JSONCrush

アプリケーションのビルド時に json 形式で静的なファイルに出力してアプリケーションで参照するなどの場合は `JSONCrush` で圧縮するのも 1 つの選択肢でしょう。
また、 URL に JSON 文字列を含める場合も `JSONCrush` で圧縮した文字列を URL にセットするといったこともできます。

## TreeShaking を有効化する

webpack や rollup などのバンドラーはバンドル時に実行されないコードを削除します。
これを **TreeShaking** と言います。

もし開発しているアプリケーションで TreeShaking が有効でない場合は有効化するようにしましょう。
TreeShaking を有効化させるには、 ESM にする、 package.json に `sideEffects: false` を指定するといった条件があります。下記は webpack の例です。

https://webpack.js.org/guides/tree-shaking/

# ブラウザAPI編

## 永続化ストレージはLocalStorageよりIndexedDBを使う
ブラウザの永続化ストレージには`LocalStorage`と`IndexedDB`が使えます。
`LocalStorage`は同期的、`IndexedDB`は非同期処理なので、`IndexedDB`の方がブラウザの動きを阻害することなくデータアクセスができます。

https://developer.mozilla.org/ja/docs/Web/API/Window/localStorage

https://developer.mozilla.org/ja/docs/Web/API/IndexedDB_API

## 重たい処理やUIに依存しない処理はWebWorkerを使う
`WebWorker`を使うことでブラウザのメインスレッドとは別のスレッド立ち上げることができます。
フロントで検索機能といった重たい処理だったり、エラーをサーバーに送信するといったUIに依存しない処理は`WebWorker`を使うことでメインスレッドの処理を阻害させません。

https://developer.mozilla.org/ja/docs/Web/API/Web_Workers_API

## WebWorkerで巨大なデータを転送する時は移譲可能オブジェクト(Transferable objects)を使う
`WebWorker`からメインスレッドへ巨大なデータを転送する時には **移譲可能オブジェクト(Transferable objects)** がパフォーマンス的に有効なケースがあります。
移譲可能オブジェクトに分類されるものはいくつかありますが、例えば`ArrayBuffer`のようなオブジェクトが挙げられます。

https://developer.mozilla.org/ja/docs/Web/API/Web_Workers_API/Transferable_objects

転送するオブジェクトの構造にもよりますが、[著者が個人開発したサイト](https://chaisear.com/)の経験では少量のデータであれば移譲可能オブジェクトを使っても転送速度は変わらず、数千くらいの規模のデータだと顕著に転送速度が速くなった経験はあります。

## ServiceWorkerでリソースをキャッシュする
`ServiceWorker` といえばPWA（Progressive Web Application）のイメージが強いですが、ブラウザから外部サーバーへのリクエストをフックしてHTMLやCSS、JSなどのリソースをキャッシュすることができます。
リクエストする際はキャッシュから取得することができるので外部サーバーへのリクエストするよりも処理が速くなります。
また、キャッシュから取得するか、先にサーバーへデータ取得してからキャッシュするかなど柔軟なキャッシュ戦略を選択できます。

https://developer.mozilla.org/ja/docs/Web/API/Service_Worker_API

## ServiceWorkerを使う時はNavigationPreloadsも使う
サイトにアクセス時、必要なリソースをフェッチする時には`ServiceWorker`が起動するのを待ってフェッチ処理が走ります。
`NavigationPreloads`では`ServiceWorker`の起動を待たずフェッチ処理を開始することができます。

https://developers.google.com/web/updates/2017/02/navigation-preload

## WebAssembly を使う
JavaScriptだけでなく、CやRustで書いたコードがブラウザで実行でき、JavaScriptよりも高速化される場合があります。
Amazonの事例もあります。

https://www.publickey1.jp/blog/22/amazon_prime_videowebassemblywasm_vm.html

## 優先度の低く軽い処理は requestIdleCallback を使う
`requestIdleCallback` を使えばブラウザのアイドル中（何もしていない状態）に処理を走らせることができます。

なお、`requestIdleCallback` はアイドル状態が解除された後続の処理に影響が出てしまわないように軽い処理をすることがおすすめです。

例えば、 Google Analyticsで重要度の低いイベントの送信をする際に活用できるでしょう。
そうすればブラウザはイベントによるメインの処理を優先的に行うことができます。

https://developer.mozilla.org/ja/docs/Web/API/Window/requestIdleCallback

`requestIdleCallback` を便利に扱うライブラリも公開しているので、ぜひ使ってみてください！

https://www.npmjs.com/package/idle-task

## アニメーション中の JavaScript の実行は requestAnimationFrame を使う
ブラウザは絶えずフレームを更新し再描画をしていますが、スクロール等のアニメーション中に `setInterval` などで JavaScript を実行すると描画を中断してしまいます。
その結果、ユーザーから見たらアニメーションがカクついて見えることもあります。

`requestAnimationFrame` を使えば次のフレーム開始で JavaScript を実行することができ、アニメーションでの JavaScript 実行を最適化することができます。

https://developer.mozilla.org/ja/docs/Web/API/Window/requestAnimationFrame

## アナリティクスにはnavigator.sendBeaconを使う
ページ遷移する際、ページ遷移をブロックして分析用のデータを送信しているケースがあるのではないでしょうか。
確実に分析データを送信するためには必要ですが、ページ遷移が遅くなってしまいます。
これを防ぐためには `navigator.sendBeacon` が使えます。

https://developer.mozilla.org/ja/docs/Web/API/Navigator/sendBeacon

ちなみにほとんどのWebサイト運営者が使っている Google Analytics にも `sendBeacon` を使うことができます。
`gtag.js` であれ `anatlytics.js` であれ `sendBeacon` を設定できます。

https://developers.google.com/analytics/devguides/collection/gtagjs/sending-data?hl=ja#specify_different_transport_mechanisms

https://developers.google.com/analytics/devguides/collection/analyticsjs/sending-hits?hl=ja#specifying_different_transport_mechanisms

## Event.preventDefault を使わない場合は passive: true を指定する
`touchstart`などのタッチイベントで `Event.preventDefault` を使わない場合は `passive: true` を指定することでスクロールの性能が改善されることがあります。
（ただし、ブラウザによってはデフォルトで `passive: true` になっていたりします）

```js
const handler = () => console.log('test');

window.addEventListener('touchstart', handler, {
   passive: true,
});
```

https://developer.mozilla.org/ja/docs/Web/API/EventTarget/addEventListener#%E3%83%91%E3%83%83%E3%82%B7%E3%83%96%E3%83%AA%E3%82%B9%E3%83%8A%E3%83%BC%E3%81%AB%E3%82%88%E3%82%8B%E3%82%B9%E3%82%AF%E3%83%AD%E3%83%BC%E3%83%AB%E3%81%AE%E6%80%A7%E8%83%BD%E6%94%B9%E5%96%84

## 遅延読み込みや無限スクロール等を実装するときは Intersection Observer API を使う
遅延読み込みや無限スクロール等を実装するときはブラウザ上での座標の計算が必要になります。
`Element.getBoundingClientRect` を使えば座標計算ができますが、 `setInterval` 等を用いて逐一計算するのはパフォーマンスに悪影響が出ます。
Intersection Observer API を使えばこのような問題を回避できます。

https://developer.mozilla.org/ja/docs/Web/API/Intersection_Observer_API

個人的に Intersection Observer API を使って遅延読み込みできる React コンポーネントを npm で公開しているので参考にしてみてください。

https://www.npmjs.com/package/react-dom-lazyload-component

## サイズ変更の検知にはResize Observerを使う

ある要素が変更されたかを検知するには Resize Observer API を使うとパフォーマンス的なメリットが得られるでしょう。

https://developer.mozilla.org/ja/docs/Web/API/Resize_Observer_API

要素の変更検知には例えば `window` に対して `resize` イベントをアタッチする方法がありますが、特定の要素の変更を検知したい場合は不都合です。
例えば `getBoundingClientRect` のような同期的に座標を取得する処理が入っている場合、ウィンドウサイズが変わるたびに高価な処理が走ることになります。

ブラウザ側で最適化された Resize Observer API を使うことで、ある要素が変更された場合のみに処理を走らせることができます。

## setTimeout を使ってタスクを分割する

次の記事で詳しく説明していますが、 `setTimeout` を使うことでタスクを分割することができます。

https://qiita.com/nuko-suke/items/5b16ab9de402547c5797

[50 ミリ秒での実行が推奨](https://web.dev/long-tasks-devtools/?utm_source=lighthouse&utm_medium=lr#:~:text=CPU%20%E3%82%92%E5%A4%9A%E7%94%A8%E3%81%99%E3%82%8B%E9%95%B7%E3%81%84%E3%82%BF%E3%82%B9%E3%82%AF%E3%81%AF%E3%80%8150%20%E3%83%9F%E3%83%AA%E7%A7%92%E4%BB%A5%E4%B8%8A%E3%81%8B%E3%81%8B%E3%82%8B%E8%A4%87%E9%9B%91%E3%81%AA%E4%BD%9C%E6%A5%AD%E3%81%8C%E5%8E%9F%E5%9B%A0%E3%81%A7%E7%99%BA%E7%94%9F%E3%81%97%E3%81%BE%E3%81%99%E3%80%82%E3%81%AA%E3%81%9C%2050%20%E3%83%9F%E3%83%AA%E7%A7%92%E3%81%AA%E3%81%AE%E3%81%A7%E3%81%97%E3%82%87%E3%81%86%E3%81%8B%EF%BC%9FThe%20RAIL%20model%20%E3%81%A7%E3%81%AF%E3%80%81100%20%E3%83%9F%E3%83%AA%E7%A7%92%E4%BB%A5%E5%86%85%E3%81%AB%E8%A6%96%E8%A6%9A%E7%9A%84%E3%81%AA%E5%BF%9C%E7%AD%94%E3%82%92%E5%BE%97%E3%82%8B%E3%81%AB%E3%81%AF%E3%80%81%E3%83%A6%E3%83%BC%E3%82%B6%E3%83%BC%E5%85%A5%E5%8A%9B%E3%82%A4%E3%83%99%E3%83%B3%E3%83%88%E3%82%92%2050%20%E3%83%9F%E3%83%AA%E7%A7%92%E3%81%A7%E5%87%A6%E7%90%86%E3%81%99%E3%82%8B%E3%81%93%E3%81%A8%E3%82%92%E6%8E%A8%E5%A5%A8%E3%81%97%E3%81%A6%E3%81%84%E3%81%BE%E3%81%99%E3%80%82%E3%81%9D%E3%81%86%E3%81%A7%E3%81%AA%E3%81%84%E5%A0%B4%E5%90%88%E3%80%81%E3%82%A2%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3%E3%81%A8%E3%83%AA%E3%82%A2%E3%82%AF%E3%82%B7%E3%83%A7%E3%83%B3%E3%81%AE%E9%96%A2%E4%BF%82%E3%81%8C%E5%B4%A9%E3%82%8C%E3%81%A6%E3%81%97%E3%81%BE%E3%81%86%E3%81%9F%E3%82%81%E3%81%A7%E3%81%99%E3%80%82) されているので、 50 ミリ秒を超える処理は `setTimeout` を使ってタスクを分割することによって、例えばボタンをクリックした時にユーザーは UI の更新が早く感じられます。

```javascript
function clickHandler() {
  // 50 ミリ秒かかる処理
  hoge();
  // タスクを分割して処理を後回し
  setTimeout(fuga, 0);
}
```

## document.readyState や load イベントを使ってページが完全に読み込まれたら処理を開始する

これは [Next.js](https://github.com/vercel/next.js/blob/canary/packages/next/client/script.tsx#L143-L151) や [Partytown](https://github.com/BuilderIO/partytown/blob/05b90737e9805332610a7d1eeed4424ca54791f3/src/lib/sandbox/main-register-window.ts#L114-L118) などでも使われているテクニックです。

次のようなコードを利用することで、 CSS などのサブリソースを含めて完全にページが読み込みを完了したら処理を開始させることができます。
こうすることによって、優先度の低い処理は後回しにすることができます。

```javascript
// すでにページが完全に読み込まれている
if (document.readyState === 'complete') {
  hoge();
} else {
  // またページが完全に読み込まれていないので、読み込みが完了したら処理させる
  window.addEventListener('load', hoge);
}
```

## Scheduler.postTask を使って処理の優先度を決める

執筆時点（2022/12/8）で [Chrome など一部の最新版のブラウザ](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask#browser_compatibility)で `Scheduler.postTask` API が使えます。

https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask

`Scheduler.postTask` では引数に `user-blocking` と `user-visible` , `background` という優先度を指定することができます。
`user-blocking` > `user-visible` > `background` の順で処理の優先度が高くなります。

使い分けとしては、例えば画像を表示するカルーセルで 1 枚目の画像読み込みは `user-blocking` 、 2 枚目以降の読み込みは `user-visible` を使う、といったことが考えられるでしょう。

## bfcache を無効化させない

モダンブラウザには **bfcache** という機能が備わっています。
bfcache はブラウザで「戻る」や「進む」を押した時に、キャッシュからページを復元し、高速に表示できる機能です。
bfcache は基本的に有効化されていますが、条件によっては無効になっているケースがあります。

無効になる条件を含め bfcache について詳しく知りたい方は次の記事が参考になります。

https://web.dev/i18n/ja/bfcache/

# V8エンジン編
ChromeやNode.jsでは内部的にV8エンジンが使われています。
ここまで最適化すると変態ですが、チップスとして紹介します。

参考
- https://www.youtube.com/watch?v=UJPdhx5zTaw
- https://www.digitalocean.com/community/tutorials/js-v8-engine
- https://blog.logrocket.com/how-javascript-works-optimizing-the-v8-compiler-for-efficiency/

## 値の格納はコンストラクタで
V8エンジンでは内部的に`hidden class`というものを生成します。
詳しい仕組みは割愛しますが、インスタンス化したオブジェクトに対して値を追加すると、新しい`hidden class`が生成されてしまいます。

```js
class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

var p1 = new Point(11, 22);  // hidden class の生成
var p2 = new Point(33, 44);  // hidden class の再利用

p1.z = 55; // hidden class が生成されてしまう
```

## オブジェクトは同じ順番のプロパティで生成する
これも`hidden class`に関わる話ですが、違う順番でプロパティを生成すると新たに`hidden class`が生成されます。

```js
const obj = { a: 1 };
obj.b = 2

// hidden classを使い回せる
const obj2 = { a: 1 };
obj2.b = 2

// 新しいhidden classが生成されてしまう
const obj3 = { b: 2 };
obj3.a = 1
```

## 関数は同じ引数の型を使う
関数の引数はできるだけ同じ型を使うようにします。
V8エンジン(正確には内部で使われている TurboFun と呼ばれるコンパイラ)は引数の型が異なっても4回目までは最適化してくれますが、それ以降は最適化してくれません。

```js
function add(x,y) {
  return x + y
}

add(1, 2);  // 最適化
add("a", "b"); // 再度最適化
add(true, false);
add([], []);
add({}, {});  // 最適化が働かない
```

## クラスは関数外で定義する
[関数の引数はできるだけ同じ型を使う](#関数は同じ引数の型を使う)の文脈で、関数内でクラスを定義するのも良くはありません。

```js
// NG
function createPoint(x, y) {
  class Point {
    constructor(x,y) {
      this.x = x
      this.y = y
    }
  }

  return new Point(x,y)
}

function length(point) {
  //...
}
```

`createPoint` で `Point` インスタンスを生成し、 `length` の引数に渡すことを考えます。
この時 `length` の引数の型は毎回違うものとして認識されるため、 [関数の引数はできるだけ同じ型を使う](#関数は同じ引数の型を使う) と同じく最適化が行われません。

# ライブラリ編

## 軽量なライブラリを採用する
ライブラリを採用する１つの観点としてサイズがあります。
bundlephobia というサイトでライブラリのサイズをチェックすることができます。

https://bundlephobia.com/

## ライブラリのサイズを減らす
`moment.js` や `lodash` などのライブラリはWebpackのプラグインを使って不必要なスクリプトを削減することができます。

## ライブラリのドキュメントを読む
ライブラリの公式ドキュメントには最適化のTipsが載っていたりします。
例えば、`React`には[パフォーマンス最適化](https://ja.reactjs.org/docs/optimizing-performance.html)、`TailwindCSS`には[Optimizing for Production](https://tailwindcss.com/docs/optimizing-for-production)というページが公式のドキュメントに記載されています。
各ライブラリのドキュメントをしっかり見てみましょう。

## ライブラリに頼らず自前で作る
ライブラリは万人向けに最適化されており、あなたのアプリケーション向けには最適化されていません。
あなたのアプリケーション以上に機能過多であることがほとんどです。
時には自前で作るのも1つの手です。

## ライブラリを最新バージョンにアップデートさせる

ライブラリを最新バージョンにアップデートさせることでパフォーマンスが良くなることもあります。

例えば、 [React は v18 へのメジャーアップデート時にメモリの改善](https://github.com/facebook/react/releases#:~:text=Improved%20memory%20usage) を行っており、 [著者が個人開発したサイト](https://nuko-programming.com/ranking/Python/page/1)でもメモリ使用量が 20 % ほど改善されました。
その他、 [`Chart.js` も v3 では Tree Shaking が効かせられるようになった](https://www.chartjs.org/docs/latest/getting-started/v3-migration.html) 例もあります。

このように、ライブラリを最新バージョンにアップデートさせることもパフォーマンス改善につながったりします。

## 代替ライブラリに切り替える

同じ機能を実現するものでも、より軽量なライブラリに乗り換えるのも 1 つの手です。
例えば、 `moment.js` を使っているのであれば `day.js` 、 `React` を使っているのであれば `Preact` への切り替えが考えられるでしょう。

## TreeShakable なライブラリを採用する

webpack や rollup などのバンドラーはバンドル時に実行されないコードを削除します。
これを **TreeShaking** と言います。

TreeShaking を有効化するには条件があります。
そのため、ライブラリによっては TreeShaking が有効化されていないものもあります。

TreeShaking が有効かどうかは[軽量なライブラリを採用する](#軽量なライブラリを採用する)で紹介した [bundlephobia](https://bundlephobia.com/) というサイトでチェックできます。

ライブラリの観点で TreeShaking が重要かを紹介しましたが、[TreeShaking は普段コードを書く上でも重要](#treeshaking-を意識して書く)です。

# SPA編
`React`や`Vue`といったコンポーネント志向のライブラリを想定しています。
`React`のコード例が多いですが、`Vue`でも参考になるかと思います。

## コンポーネントがマウントされた後、遅延的にデータを読み込みする
優先順位だったりデータサイズが大きい場合等はマウント後リソースを取得します。

```react
// 先にimportしない
// import articles from './articles.json';

function ArticlesComponent() {
  const [articles, setArticles] = useState([]);

  // マウント後にデータを読み込む
  useEffect(() => {
    import('./articles.json').then(res => setArticles(res.default));
  }, [])

  return articles.map(article => <div key={article.id}>{article.title}</div>)
}
```

## クリック等のイベント後に遅延的にデータを読み込みする
[コンポーネントがマウントされた後、遅延的にデータを読み込みする](#コンポーネントがマウントされた後遅延的にデータを読み込みする)と話は似ていますが、
クリック後など必要なタイミングで遅延的にデータを読み込みするのもアリです。

```react
// 先にimportしない
// import articles from './articles.json';

function ArticlesComponent() {
  const [articles, setArticles] = useState([]);

  return (
    <>
      <div onClick={() => import('./articles.json').then(res => setArticles(res.default))}>
        記事一覧を見る
      </div>
      <div>
         {articles.map(article => <div key={article.id}>{article.title}</div>)}
      </div>
    </>
  )
}
```

## コンポーネントを遅延読み込みする
初めてコンポーネントが表示されるタイミングでコンポーネントを読み込みます。
例えば、ユーザーがボタンをタップして初めて表示されるコンポーネントは遅延読み込みでの実装を考えます。
`React`で言えば`Suspense`、`Next.js`なら`dyamic`のAPIを使ってコンポーネントの遅延読み込みを実装できます。

## SSRやSSG、ISRに移行する
`React`や`Vue`など通常のSPAは性質上、初期描画が遅くなります。
`React`であれば`Next.js`や`Gatsuby.js`、`Vue`であれば`Nuxt.js`といったフレームワークを使えば初期描画が遅くなる問題を解決できます。

## コンポーネントの設計を最適化する
`React`や`Vue`だとコンポーネントのレンダリングの仕組みが違うので一概にこれが最適とは言えませんが、共通した設計の最適化があります。
例えば、「コンポーネントとデータの依存を考えて、再レンダリングの範囲を最小限にする」ことでしょう。
次のコンポーネントの例を見てください。

```html
<!-- とあるコンポーネント -->
<div>
  <div>データAに依存するUI部分</div>
  <div>データAに依存しないUI部分</div>
</div>
```

1つのコンポーネント内に「データAに依存するUI部分」と「データAに依存しないUI部分」があります。
`React`であれ`Vue`であれこのようなケースの場合は「データAに依存しないUI部分」を別コンポーネントに切り出したほうが良いでしょう。
そうすればデータAに変更があった時、「データAに依存するUI部分」のみ再レンダリングさせることができます。
（`Vue`であれば問題ないですが、`React`の場合はステート管理のライブラリを使っていない場合は`React.memo`を使う必要はあります）

# サーバー編

## 必要なデータのみフロントへ返却する
例えば、記事の一覧ページに各記事の本文を一部表示するとします。
「本文を一部」だけならサーバーからは一部だけ返却するようにします。
そうすることでファイルサイズ削減などができます。

## 事前に静的ファイルにしておく
都度APIへアクセスするのであれば予めJsonにしておくのも良いでしょう。

## 日本にあるサーバーを使う
日本向けのアプリを開発しているのであれば、地理的に近い日本のサーバーを選びましょう。

## Brotli圧縮を使う
gzipよりは圧縮後のサイズ削減や圧縮速度の向上が見込めます。

https://blog.redbox.ne.jp/cdn_brotli.html

## CDNを使う
`Amazon CloudFront`などのCDNはできるなら使いましょう。

## HTTP/2を使う
できるなら使いましょう。HTTP/1.1より速いです。

## HTTPキャッシュを使う
`Cache-Control`などのHTTPヘッダーを利用して、Nginxのようなミドルウェアやブラウザにリソースをキャッシュさせます。

https://developer.mozilla.org/ja/docs/Web/HTTP/Headers/Cache-Control

## 103 Early Hints を使う

最初にリクエストする HTML には CSS に代表される色々なリソースファイルの読み込みの記述があるでしょう。
通常であれば HTML の解析中にリソースファイルを外部から取得します。
が、 CSS のようなファイルは事前に取得した方が HTML の解析中に即座に CSS の解析も始められます。

**[103 Early Hints](https://developer.mozilla.org/ja/docs/Web/HTTP/Status/103) を使うことでリソースファイルの読み込みを最適化できます** 。
**サーバーが HTML のレスポンスを準備している前に先に CSS をブラウザに返却することで、ブラウザが HTML を取得・解析を始めて即座に CSS も解析することができます**。

https://developer.chrome.com/blog/early-hints/

## リアルタイム配信には`X-Accel-Buffering: no`ヘッダーを付与する

記事の追記時点(2024/02/08)において、ChatGPTのようなLLMの台頭によって、チャットのようなインターフェースでリアルタイムのレスポンスが使われることも多くなってきました。
アプリケーションのミドルウェアとしてNginxのようなプロキシを使うケースも多いと思いますが、Server-Sent Events(SSE)のような形でレスポンスを返そうとすると、レスポンスが遅延する場合があります。
Nginxのようなミドルウェアでレスポンスをバッファリング(蓄積)することがあるためです。

このようなバッファリングを防ぐための方法として、レスポンスヘッダーに`X-Accel-Buffering: no`を付与する方法があります。
これにより、ミドルウェアに対してバッファリングを無効化するように通知し、即時にレスポンスをユーザーに返すことができます。


# まとめ
この記事では次のようにカテゴリ分けしてWebフロントエンドのパフォーマンスチューニングのハウツーを紹介しました。

* [JavaScript編](#JavaScript編)
* [HTML/CSSなどリソース編](#HTML/CSSなどリソース編)
* [ブラウザAPI編](#ブラウザAPI編)
* [V8エンジン編](#V8エンジン編)
* [ライブラリ編](#ライブラリ編)
* [SPA編](#SPA編)

その他、パフォーマンスチューニングの実例も紹介しているので、興味あればぜひご覧ください。

https://qiita.com/nuko-suke/items/22702472543bfd3e585f

https://qiita.com/nuko-suke/items/58de7fc0ad8eb5efd7bc

https://zenn.dev/nuko_suke_dev/articles/f14fcc1acd2b5a

皆さんのパフォーマンスチューニング力の力添えになれば幸いです！ by [ぬこすけ](https://twitter.com/nuko_suke_dev)
s