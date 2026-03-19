エントリーポイントのバンドルサイズ削減
Bundle Analyzerの導入
Bundle Analyzer導入 #1fbd3e

今回は Vite + React の構成だったので Vite の内部実装である Rollup の Plugin rollup-plugin-visualizerを導入しました。
これにより、ビルド後のバンドルサイズを可視化できます。

初期Bundle Analyzer画面

明らかにバンドルサイズが大きいとわかります。全体で 12.85MB もありました。
ここからまずはエントリーポイントのファイルサイズを減らすことを目標にしました。
初期ロードの js ファイルサイズを減らすことができれば、その分 FCP が上がるはずです。

Production Build化
Build Command が

{
  "scripts": {
    "build:vite": "cross-env NODE_ENV=development vite build",
  }
}

となっていたため

{
  "scripts": {
    "build:vite": "cross-env NODE_ENV=production vite build",
  }
}

としました。これで bundle size は 11.75MB になりました（それほど変わらなかった...）

チャンク分割
まずはこのひとつのファイルを、必要になったときだけ呼ぶように分たいため、Chunk Splitting を行うことにしました。
一番大きいのが date-time-format-timezone なんですが、これは後ほど削除できるかなと思ったので先に次に大きかった zipcode-ja を分割します。
特にこの zipcode-ja は購入画面の住所入力部分でしか使われてなかったので、全てのページで最初に読み込まれるのは無駄そうです。
そこで、購入画面のみで読み込まれるようにしました。

const OrderForm = lazy(() => import('../../components/order/OrderForm'));

これで Dynamic Import した分が Split Chunk され、Entry Point のファイルサイズは 8.22MB になりました。

split Chunk後Bundle Analyzer画面

zipcode-jaをDI #ed8c3d

また、ひとつの URl でひとつの Page が表示されるのにも関わらず、Entry Point で全てのコンポーネントを読み込んでいました。
そのため、各 page を Lazy Loading することで、必要なときだけ読み込むようにしました。

各pageをNI #a9e94c

Polyfillの削除、ESTargetの変更
今回はレギュレーションに「最新版の Chrome で動くことが条件」だと書いてあったため、IE11 などの古いブラウザに対応する必要はないと思い、Polyfill を削除しました。
また、ESBuild の Target もガン上げしました。

esnextに #62339b
code-jsやめる #d80b1e
date-time-format-timezoneやめる #c6d431
polyfill全消し（多分） #f0ac35

Tree Shakingの有効化
Default Import により、全てのコンポーネントや関数をライブラリから読み込んでいたので、Tree Shaking が有効になっておらず、これらを Named Import に変更しました。
必要なもののみを読み込むことで、バンドルサイズを減らすことができました。

react-iconをNI #89d9d4
lodash ES, lodashをNI #2e0ae2

ViteOptionの変更
Vite の Option を変更しました。

export default defineConfig(() => {
 return {
   build: {
     assetsInlineLimit: 20480,
      cssCodeSplit: false,
      cssCodeSplit: true,
     cssTarget: 'es6',
      minify: false,
      minify: true,
     ...
   }
 }
});

まあ Minify とか Split とかしてないのは？て感じなので。

よく考えれば Vite はそもそも最適化がデフォルトの設定で十分されているので、これらの設定ごと消すのが正解だったのかもしれないと思いました。

エントリーjs最適化後Bundle Analyzer画面

この時点でだいたい 1.52MB くらいまで減りました。

その他いらないライブラリをどんどん抹消、独自実装で置き換え
React Helmet 抹消 #70e86d
Canvas Kit 抹消 #ffa2b9
lodash 抹消 #ce233e

ここまでで一旦エントリーポイントのバンドルサイズ削減を終えました。

静的ファイルの最適化
EC サイトというのもあり、トップページやら詳細ページやらで画像と動画がとても多いのでここのアセットをまず最適化しました。

画像の最適化
画像は Squoosh で最適化しました。WebP60%くらいで、レンダリングサイズ用に何枚かバリエーションを作りました。
webp化 #c59486

SVG がなぜか 10MB くらいあったので、Figma に貼って png で export して webp にするとかいうすごい遠回りなことをしました。
svgデカすぎ #2ff63a

動画の最適化
動画は FFmpeg で最適化しました。FFmpeg を使ってとりあえず WebM に変換して、さらにサムネイル表示をフロント側で動画から生成していたので、webp でサムネイルを作って、それを表示するようにしました。
動画をWebMに変換 #031089
動画をWebPに変換 #ccd8e0

フォントの最適化
クソデカ NotoSerifJP フォントをところどころで呼び出して使っていたのですが、これらの文字はフロントだけで完結する定型分の表示にのみ使われていました。
なので、woff2 に変換して必要な文字のみを含むフォントにサブセット化しました。
また、Font 読み込み後の切り替わりの際にデザインが崩れていたので、font-display: swap を追加しました。

fontをサブセット化 #68a5be

実際に 6MB あったフォントが 10KB くらいになりました。

フロントエンドロジックの最適化
SuspenseQueryをやめる
今回の WSH では GraphQL でバックエンドと通信していたのですが、@apollo/client の useSuspenseQuery_experimental を使っていました。

このuseSuspenseQuery_experimentalは、SSRのフロントエンドにおいてData Fetchingを行う間useQueryを使うと完成前のHTMLがStreaming SSRとしてクライアントに送られてしまう問題を解消し、主にDataFetchingが終わるまでレンダリングを待機させ、HTMLが完成してから初めてクライアントに送るという実装で使います。

今回は SSR を行っておらず、Suspense されてしまうと Data Fetching が終わるまで何も表示されない状態になるので、useQuery を使うように変更しました。

useSuspenseQuery_experimentalをuseQueryに変更 #280054

これによって FCP が大幅に改善されました。

詳しくは参考にさせていただいたこちらの記事をご覧ください。


同期XHR接続でのGraphQL通信をやめる
utils/apollo_client.ts に syncXhr という関数を発見しました。
これは Apollo Client に渡す HTTP Link の fetch オプションに渡している関数です。
実は同期 XHR 接続で GraphQL 通信をするようになっていました。

これによって全ての GraphQL 通信が waterfall になっており、メインスレッドをブロックした結果 CWV の TBT や LCP が悪化していました。
非同期な並列通信を実現するために syncXhr をやめました。

apollo clientの通信を非同期にしてみる #22f186

これがサクセスパスとなり、FCP がさらに改善され、全体的にスコアも 2 倍になりました。
比較的早くこの問題に気づけたのでこの時点で総合 2 位になりました。


フォーム入力が遅すぎるのを改善
入力毎に zipcode-ja のクソデカ Object を Deep Copy するという破天荒ロジックを発見したので、それをやめて一度取得した Object を使い回すようにしました。

フォーム入力が遅すぎるのを改善 #24c653

さらにその後、フォーム画面の表示の遅さに結局 zipcode-ja の読み込みが影響していることに気付いたため、外部 API 呼び出しによって不必要なデータを完全に取得しないようにしました。

zipcodeを外部APIから呼びだす #58cf62

RecoilをReact Contextに置き換える
グローバルな状態共有ロジックがとても少ないユースケースであるため、Recoil を使う必要がないと判断し、React Context に置き換えました。（多分モーダルだけだったはず）

RecoilをReact Contextに置き換える #a26ad4

Form実装を全部自作ロジックで解決する
Form の実装には zod と Formik を使っていたのですが、どちらも自力で置き換えられそうだったので、自作ロジックで解決するようにしました。
（綺麗に書きたいなーとかいう適当なモチベーションで Reducer 使ったのでとても時間がかかったのは内緒です）

Zodを抹消 #1a71d9
Formikを抹消 #5783da

SPA遷移にする
a タグを使った href 遷移によるページ間移動をしていたのですが、これでは SPA としての性能が出ないので、React の Link コンポーネントを使って SPA 遷移にしました。
SPA 遷移を使わないと毎回エントリーポイントから JS の読み込みをやり直してしまいます。

SPA遷移にする #e061b9

（余談ですがこの変更で data-test-id を機能不全にしてしまい、採点が落ちてめっちゃ沼りました。）

バックエンドロジックの最適化
N+1問題の解消

GraphQLは触ったことがなかったのですが、自分がPrismaというORMが大好きで、その内部実装としてバッチローダーによるGraphQL向けのN+1問題の解消が組み込まれているということを知っていました。

そのため同等の処理がスピード改善に繋がるのではないかと思い、Facebook が作っているDataLoaderを使ってみました。

また同時に、使っていない GraphQL のフィールド(description)を削除しました。
（このフィールドを削除するだけで総テキスト転送量が 1/2 になります）

DataLoaderを使ってN+1問題を解消 #9c13d0

import DataLoader from 'dataloader';

import { Product } from '../../model/product';
import { dataSource } from '../data_source';

import type { FeatureItem } from './../../model/feature_item';
import type { GraphQLModelResolver } from './model_resolver';

export const featureItemResolver: GraphQLModelResolver<FeatureItem> = {
  product: async (parent) => await ProductLoader.load(parent.id),
};

const ProductLoader = new DataLoader(async (ids: readonly number[]) => {
  const products = await dataSource
    .createQueryBuilder(Product, 'product')
    .whereInIds(ids)
    .select(['product.id', 'product.name', 'product.price', 'product.description'])
    .getMany();

  return ids.map((id) => products.find((product) => product.id === id)) as Product[];
});

これにより通信に大体 1s 弱かかっていたのが、0.5s くらいに、約 50%の改善が見られました。

静的アセット配信時の処理
とりあえず静的アセットは全部 gzip 圧縮して配信し、さらに Cache-Control を設定しました。

Gzipで配信 #0f64c3
Cache-Controlを設定 #6108ec

サーバー分割
WSH ではお馴染みですがレギュレーションに毎年「無料の範囲内であればデプロイするサーバー等を変えてもよい」というルールが存在します。
個人的に推してるゆーすけべーさんの以前の WSH 参加記に Cloduflare への移行が話題に出ており、自分も参加する前から移行は絶対やりたいと思っていました。



なので今回はフロントエンドや静的アセットなど CDN におけるものを Cloudflare Pages から配信するようにしました。
また、Cloudflare Pages で配信される静的アセットはデフォルトで brotli 圧縮がかけられます。これは gzip よりも効率が良い圧縮方式です。

フロントエンドをCloudflare Pagesに移行
Cloudflare Pages は Github リポジトリとの連携がとても柔軟ですが、今回リポジトリに push できなかったため、連携を使わずに wrangler を使ってデプロイしました。
（Fork しているので簡単に private にできないという理由です）

Cloudflare Pagesを設定 #80065b
フロント分離 #8520db

ただ、ここでいくつか問題が出てきます。単純に Pages にデプロイするだけでは上手くいきませんでした。

弊害1: 認証が通らなくなる
バックエンドとフロントエンドが完全に別オリジンであるため、クロスオリジンでの cookie 認証に対応させなければなりません。
まず credentials を include にする必要があります。
そしてクロスオリジン間での API リクエストなため SameSite を None にする必要がありましたが、secure 属性を付与する必要があります。
さらに secure 属性を付与するためには HTTPS である必要があります。
その場合 fly.io の内部通信は http なため proxy 通信であることを明示させないといけません。
（これらでめっちゃつまりました）

credentials明示 #846d0a
secure貼る #b6879e
proxy(http通信内)でもsecure #9cffad

弊害2: initialize apiが動かなくなる
WSH の採点方法は ISSUE のコメントに貼ったフロントエンドが存在するURL先へ採点しに行くというものでした。
そのため、フロントとバックが異なるサーバーにある場合、[フロントのURL]/initialize に POST された時、[バックのURL]/initialize にプロキシする必要があります。
そこで、Cloudflare Pages のリダイレクト機能を使って、[フロンのURL]/initialize に POST されると、それをリダイレクトさせるようにしました。

リダイレクト設定 #2f686a

ただ、どうもこれが上手くいかず、採点前に initialize できていないというエラーが出てしまいました。
おそらくリダイレクトのステータスコードが 302 であるためかなと考えます。

そのため、Cloudflare Pages の Functions を使って、POST された時にバックへリクエストを投げ、そのレスポンスをそのまま返すようにしてみました。

export const onRequestPost = async () => {
  const url = new URL('https://sor4chi-web-speed-hackathon-2023.fly.dev/initialize');
  const response = await fetch(url, {
    method: 'POST',
  });
  return new Response(response.body, {
    status: response.status,
  });
};

Functionsを使ってinitializeを引き継ぐ #b8e8e8

これが上手くいき、無事フロントエンドを完全にバックエンドから引き剥がした状態で採点を受けることができるようになりました。

最終調整
ここまでやってあと 2 時間くらい、特に今からめちゃくちゃ動いても点数があまり変わらないだろうという確信があったので、最終調整をしました。

logを全消し #b61804
GraphQL Playground #234866
HeroImageのPreload設定 #45c4ae
ここまでやって最高点 347 点が出ました。

この時点で残り 15 分です。

ここで焦ったのか私 monica、CSS の最適化をし始めます..。

画面幅を変える -> class を切り替える
という操作を JS でやっていたので、これを CSS の media query でやるようにしました。

DeviceType撲滅 #e58528

はい。なんとここで痛恨のミスをしてしまいます。
痛恨のミスmax と min を逆にしてしまいました。
このミスによって Footer の Navigation の並びが PC と SP で縦横逆になってしまいました。
正しいFooter誤ったFooter

試したけど断念したこと・やりたかったこと
react-routerのwouter置き換え
wouterは react-router の軽量版のようなものです。
Zero dependency で、gziped size で react-router よりも 10KB ほど小さい 1.36KB で実装されています。
また、Preact にも対応しているため、もし Preact に置き換えるタイミングがくればということで先に Router だけ置き換えようと思いました。

react-routerをwouterに置き換える #fae46d

ただこの置き換えの PR でローカルでは動いているのにどうしても採点チェックが通らなくなってしまい、上手くいかなかったため断念しました...。

Preactに置き換え
言わずもがな、Preact に置き換えることで React から簡単にマイグレーションできかつ軽量化を図ることができるので、やりたかったなぁという悔しさがあります...。

SSR
バックエンドが Koa なので React を Server 側で Hydrate して Server 側で DOM を生成してから返すのがとてもやりやすい環境でした。
SSR は必要なもののみをレスポンスでき、さらにはクライアント側での DOM 生成を省略できるのでとても効率的です。
もし余裕があればこれを真っ先にやってましたね...。多分 Next.js にリプレイスするよりよっぽど楽。

Cloudflare Workers
Cloudflare Workers は Cloudflare の CDN の中で動く JavaScript です。
Cloudflare の CDN を使うことで、世界中のユーザーに近い場所からコンテンツを配信できます。
もし数分の遅延が許容されるのなら Cloudflare Workers を使って重い API を KV にキャッシュしておくことで相当 Top が高速化できたかなと。

Static CSS化
スタイルは全て emotion の CSS in JS で書枯れていました。
これを全て静的な CSS ファイルに切り出すことができれば CSS が JS に含まれなくなり、HTTP/2 通信とも相まってパフォーマンスが向上すると思いました。