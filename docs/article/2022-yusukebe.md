イテレーションを回す
採点はLeaderboardのレポジトリにIssueをつくってURLを貼り付けるとGitHub Actionsが自動で走り、VRTとScoringをしてくれます。 終わったら、500点中何点だったかがIssueのコメントに付きます。すごくよくできた仕組みです。 スクショが一番最初のものです。11点でした。

SS
さて、点数を確認するために毎回/retryとコメントして、GitHub Actionsの実行終了を待つのは非常にだるいです。 VRTのレギュレーションテストは少しでも見た目がずれると違反になってしまいます。 例えば画像が正しくリサイズされているかを確認するだけでも、時間がかかってしまいます。 まず本体に手を付ける前に、ここをなんとかすることにしました。

ありがたいことにVRTとスコアリングをローカルのマシンでやる方法が書いてあったので、 そのまま採用させてもらいます。

Web Speed Hackathon 2022 を勝手に開催する
点数はとある5つのエンドポイントに対してつくのですが、 これがWSH_SCORING_TARGET_PATHSというsecret変数になっていて、どこが叩かれるかわからないようになっています。 どうしたものかと言うと、単純で、採点中にHerokuサーバーのアクセスログを見て判断しました。 これでローカルでも、コマンド一発でVRTのテストができるようになりました。 イテレーションが速く回せます。

SS
手作業
難しいことを考える前に何も考えずにできることからやります。

SS
アセットのファイルがassets/images以下で85MBとバカでかいので削ります。

アプリ内では、TrimmedImageというReactのコンポーネントを画像表示のためにつかっていて、 これが元画像を読み込みつつCanvasでクロップとリサイズとかまどろっこしいことをしているのでこいつを消しました。 macOSにはもともとsipsコマンドが入ってるので、これでリサイズ。 さらにSquooshという画像最適化ソフトのCLIをつかって、WebPにします。

sips --resampleWidth 500 --resampleHeight 359 hero-small.jpg
squoosh-cli --webp '{quality: 60}' hero-small.jpg
次にフォントです。オッズ表の表示のところで、外部のフォントを使っていてこれが5.8MBとでかい。 よく見てみると数字と一部記号しか使っていない。 そこで、それ以外を削って、最小のフォントセットを作成。さらにttfからwoffへ変換をかけて読み込むことにしました。

またアイコンセットにFont Awesomeを使ってるのですが、これもよく見ると3箇所しか使われてない様子。 そこでその3つのみSVGを出すようにして、全体のCSS、JSとフォントセットを読まないようにしました。

画像なら例えばimgixを挟んでエッジでリサイズ・クロップするという手がありますが、 今回のように手作業でやっちゃた方が早いし、速い場合があります。

色々やめる
次にJSです。main.jsが30MBあります。これが中身。

SS
zengin-data.jsは置いといて、やめられるものはやめる。より小さい代替があるものはそれに変えます。 ブラウザのサポートも切って、最低限のものにします。

Lodashをやめる。
Font AwesomeのJSやめる。
axiosをやめる。
Polyfillやめる。
core-jsをやめる。
Moment.jsやめてdayjsにする。
CommonJSやめる。
これで、必要な外部ライブラリはReact、React Router、Styled Components、dayjsくらいになりました。

Zengin問題
誰もがぶち当たるであろうものが、「Zengin問題」です。 サイト内で銀行情報を入力するダイアログで使われている「全国の銀行とその支店コード」を収録している3MBある.jsファイルです。 これをどうするか。データを圧縮したり、APIにするという方法が思いつきますが、Dynamic Importで簡単に解決しました。 このzengin-data.jsが必要になるのは、ダイアログのコンポーネントからのみで、ページで必要になるわけではありません。 ダイアログをDynamic Importして、Webpackがそれを解釈してCode Splittingしてくれればメインの.jsには含まれなくなりました。

const ChargeDialog = React.lazy(() => import("./internal/ChargeDialog"));
React.lazy()で読み込ませたあと、Suspenseで囲みます。

<Suspense fallback="">
  <ChargeDialog ref="{chargeDialogRef}" onComplete="{handleCompleteCharge}" />
</Suspense>
これで、コードが分割され、遅延で読み込まれることになります。 この手法は後ほど他のコンポーネントでも使われ、さらに最適化を加えると最終的なバンドルサイズは以下のようになりました。

SS
メインの.jsは開発用で1.08MB、gzipして278.KB、プロダクトで353KB、gzipで62KBです。 JSのサイズが小さくならなくてはTBTのスコアが上がらず、最後までこれには手を焼きました。 ページごとにJSを吐くといったCode Splittingをしたり、ReactをPreactにするなどの作戦でもっと小さくできそうですが、 今回は採用せずに、500点を目指します。

Reactわかりませーん
これまで偉そうに書いてきましたが、実は僕、業務でReactを触ったことがなく、趣味で触るくらいなので、わりとReactわかりませーん。 でもわからないなりに、チューニングしていきます。JavaScriptの実行時間が足を引っ張っているのです。

主にやったのは「memo化」です。why-did-you-updateというライブラリ（deprecatedなのでwhy-did-you-renderを使ったほうがいいかもです）を使って、怒られたところをReact.memoで囲うという簡単なお仕事です。

SS
無駄な再レンダリングを避けることができます。memo化だけで、だいぶパフォーマンスがあがりました。

SS
Fastifyに手をいれる
フロントエンドだけではなくバックエンドにも手を付けてみます。 このサイトは当初いわゆるSPAになっています。裏ではFastifyが動いていて、/api/*にレース情報を配信するAPIが生えています。 そして、残りはエントリーポイントとなるHTMLと.js、アセットファイルがfastify-staticというミドルウェアを通して、配信されています。

アセットファイルの配信はそのままにして、HTMLの配信は後ほど紹介するSSR、もしくは「SPAとSSRの中間」を実現するために、 ダイナミックにします。具体的には、/や/:date、/races/:raceId/*というルートを生やし、その中でHTMLをダイナミックに生成します。 HTMLを組み立てるのには変数にベタ貼りしたコードとReactのSSRを使いました。これについては後述します。

SQLiteにインデックスを貼る
データのストアにはSQLiteを使っているので、それにもテコ入れします。 貼れてなかったところにインデックスを貼ります。 採点の最初には/api/initializeというエンドポイントが叩かれ、seeds.sqliteがdatabase.sqliteへとコピーされます。 この際にCREATE INDEXするのです。

export async function initialize() {
  await fs.copyFile(INITIAL_DATABASE_PATH, DATABASE_PATH);

  const db = new sqlite3.Database(DATABASE_PATH);
  db.run("create index index_race_id on odds_item(raceId)", [], (err) => {
    console.log(err);
  });
}
これで、/races/:raceIdのエンドポイントで発行されるクエリが当初より速くなりました。

-- BEFORE
Run Time: real 0.902 user 0.474481 sys 0.070793

-- AFTER
Run Time: real 0.281 user 0.049322 sys 0.025765
さらばHeroku
推奨されているHerokuを使っていましたが、そろそろ辛くなってきました。 Herokuは遅い！ リージョンがUSで遠いです。採点するGitHub ActionsのマシンがHerokuに近ければ点数には響きませんが、 こちらで本番サイトを確認する時に遅いとフラストレーションがたまりますし、手元でLighthouseを実行した時の点も低く出てしまいます。 つまり、Developer Experience = DXが悪いのです。 これからよりテクニカルなことをやっていくのに大変です。

もうHerokuはやめましょう！ この時点で350点程度、まだまだHerokuでも頑張れそうです。が、やめます。

以前から馴染みのあるLinodeというVPSを使います。一番低い「Nanode 1 GB」というプランです。「5ドル/月」課金しました。 ちなみに、課金しちゃったけど、最終的にこのHackathonに使った金額はこの「5ドル」だけです（CloudflareとFastlyは以前から契約していました…）！

SS
VPSにはDebianを入れて、そこでNodeを動かします。他にはリバースプロキシにNginxかH2Oを入れるか入れなかったりです。 コンテナは使いません。この場合、それが一番早いし速いです。

デプロイフロー
Herokuをやめたので、デプロイフローをオリジナルで作らなくてはいけません。 同じようにGitHubレポジトリにpushしたタイミングでデプロイされると嬉しい。 そこで、デプロイ専用のレポジトリを作り、以下のようなGitHub Actionsを組みました。ホストでの操作はAnsibleを使います。

デプロイ用のレポジトリをチェックアウト
Ansibleを実行する環境をGitHub Actions上に作る
Linodeのホストに対し、AnsibleのPlaybookを実行
ホストではGitチェックアウト
yarn installとyarn build
サーバーの再起動
これで、VPSでもHerokuと同じような仕組みで、かつ高速なデプロイフローを構築できました。

SSRを自作する
さて、ここからコアなチューニングをしていきます。

前述した通り、この課題は当初Single Page Application = SPAで作られています。 SPAの最大の問題はメインの.jsをロードしない限り、描画が始まらないことです。 そのため、どうしてもFCPとLCPが遅く=スコアが悪くなります。 また、例えば、ローディング用のテキストとして「loading...」と表示していたところへ、 長いテキストが入ると改行されてレイアウトシフトが発生します。 となるとCLSを0にするのが難しくなります。

SS
そこで、SPAの対極にあるServer Side Rendering = SSRをしてみます。 Fastifyに手を入れたのが生きてきます。 ようは素のReactからSSRを実装するのです。 Next.jsでは勝手にやってくれるのですが、それを自作します。 なお、こちらの記事を参考にさせてもらいました。

React.jsのSSRをTypeScriptで自前で実装してみた
Reactのルーティングをサーバーからも参照して、React RouterのStaticRouterで囲みます。

import React from "react";
import { StaticRouter } from "react-router-dom/server";

import { Routes } from "../client/foundation/routes";

export const App = ({ location, serverData }) => {
  return (
    <StaticRouter location={location}>
      <Routes serverData={serverData} />
    </StaticRouter>
  );
};
それをFastifyのハンドラでimportして、ReactのrenderToNodeStream()に渡します（renderToString()でも良さそうですが、Suspenseを使うとエラーがでたのでこれです）。

import React from "react";
import { renderToNodeStream } from "react-dom/server";
import { ServerStyleSheet } from "styled-components";

import { App } from "../App.jsx";

//...

fastify.get("/races/:raceId/*", async (req, res) => {
  res.raw.setHeader("Content-Type", "text/html; charset=utf-8");
  const repo = (await createConnection()).getRepository(Race);
  // 全部持ってくる
  const race = await repo.findOne(req.params.raceId, {
    relations: ["entries", "entries.player", "trifectaOdds"],
  });

  // Styled Componentsのために必要
  const sheet = new ServerStyleSheet();
  // (1) `serverData`の値にraceを渡す
  const jsx = sheet.collectStyles(
    <App location={req.url.toString()} serverData={race} />
  );
  const stream = sheet.interleaveWithNodeStream(renderToNodeStream(jsx));

  // topを書き込み
  // (2) `data-react`の値にrace情報をシリアライズして渡す
  const top = `${getHead()}<body><div id="root" data-react=${JSON.stringify(
    race
  )}>`;

  res.raw.write(top);
  // streamが終わったら下部を描画
  stream.on("end", () => res.raw.end(getBottom()));

  // streamを返却
  return res.send(stream);
});
ここで肝は(1)と(2)でそれぞれ、コンテンツとなるraceオブジェクトを<App />とエントリーポイントとなるHTMLに渡しているところです。

<App />では、サーバーからserverDataという変数で値をもらい、それを各ページに渡しています。

export const Routes = ({ serverData }) => {
  return (
    <Suspense fallback="">
      <RouterRoutes>
        <Route element={<CommonLayout />}>
          <Route index element={<Top serverData={serverData} />} />
          <Route element={<Top serverData={serverData} />} path=":date" />
          <Route path="races/:raceId">
            <Route
              element={<RaceCard serverData={serverData} />}
              path="race-card"
            />
            <Route element={<Odds serverData={serverData} />} path="odds" />
            <Route
              element={<RaceResult serverData={serverData} />}
              path="result"
            />
          </Route>
        </Route>
      </RouterRoutes>
    </Suspense>
  );
};
各々のページでは、ブラウザからの実行か、サーバーからの実行かを判断します。 サーバーからだったら上記で受け取ったserverDataをdataにセットして、 HTMLの時点で描画、つまりSSRできるようにします。 ブラウザだったら、(2)でdata-reactにセットしたraceのデータをデシリアライズして、 dataにセットします。これは.jsが読み込まれてからAPIのフェッチまでの描画を担います。

export const RaceResult = ({ serverData }) => {
  const { raceId } = useParams();

  let { data } = useFetch(`/api/races/${raceId}`);

  if (typeof document !== "undefined") {
    // ブラウザだったら...
    const elem = document.getElementById("root");
    const dataPool = elem.dataset.react;
    const initialData = JSON.parse(dataPool);
    data = initialData;
    elem.dataset.react = "";
  } else {
    // サーバーだったら...
    data = serverData;
  }

  //...
};
最後に、クライアント側のindex.jsでHydrateの指示を出せば完成です。

import { App } from "./foundation/App";

hydrateRoot(document.getElementById("root"), <App />);
流れをまとめると以下のとおりです。

FastifyでDBから持ってきたraceを<App />に渡して、それをHTMLとして描画。
HTMLの<div id="root" ...のdata-react属性の値にはraceをJSON化してセットしておく。
ブラウザでメインの.jsが読み込まれたら、data-react属性の値をデシリアライズしてハイドレートする。
さらに今回はAPIからフェッチしたデータを最終的にセットしています。

SPAかSSRかSPAとSSRか
SSRにすることで、レイアウトシフトの発生を抑えることができ、CLSのスコアを0にすることができます。 しかし、問題はDBから引いてくる時間があるので、サーバーからのレスポンスタイム、TTFBが伸びてしまうことです。 わかりやすいように「SQLiteにインデックスをかけてない」状態でHTMLが返ってくる時間を測ると500msかかってしまいます （当然、インデックスをつければより速いのですがそれでもマシンスペックが十分でないと100ms以上かかってしまいます）。

SS
これでは戦えません。そこで、SPAとSSRのハイブリッドみたいなことします。

データベースから持ってくるところのコードはここです。

const race = await repo.findOne(req.params.raceId, {
  relations: ["entries", "entries.player", "trifectaOdds"],
});
Joinしています。これをJoinなしにするとキーで引くだけなのでとても速いです。

const race = await repo.findOne(req.params.raceId);
実は、SSRしてHTMLにする時に必要は情報はこれだけで十分です。 つまりレースページにおける以下の情報です。

レース名
写真
開始時間、終了時間
これさえあれば、CLSは防げます。 そして、写真のURLが分かるので、リソースヒントを使ったpreloadができます。 FCP、LCPの向上が期待できます。 残りのエントリー情報、オッズ情報はAPIでフェッチしてあとから追加すればいいでしょう。 最終的なコードはこうなります。 今回はLinkヘッダでリソースヒントをしています。

fastify.get("/races/:raceId/*", async (req, res) => {
  res.raw.setHeader("Content-Type", "text/html; charset=utf-8");
  const repo = (await createConnection()).getRepository(Race);
  // 基本情報だけ持ってくる
  const race = await repo.findOne(req.params.raceId);

  // LCPの画像を抽出
  const match = race.image.match(/([0-9]+)\.jpg$/);
  const imageURL = `/assets/images/races/400x225/${match[1]}.webp`;

  res.raw.setHeader("Link", `<${imageURL}>; rel=preload; as=image`);

  //...
  return res.send(stream);
});
これで、TTFBが短くなり、 CLS、FCP/LCPのスコアを維持したまま、全体の描画時間、主にTTIのスコアを上げることができました。

SS
CDNで本気を出す
さてもっと速くしましょう。CDNを使います。

CDNはCloudflareとFastly、どちらも試しました。 色々試して、速度で言うとFastlyの方が若干速いかな…という具合ですが、 それがスコアには反映されませんでした。 なので、後述するCloudflare Workersを使いたかったのでCloudflareを使いました。 が、今思えば、Compute@Edgeでも可能なので、そちらでも試してみたいです。

さて、CDNにキャッシュします。 アセットは当然のこと、HTMLもキャッシュします。 HTMLにはハイドレートに必要な情報も入ってますが、「A」というURLに対しての情報は常に「A」なので変わることがありません。 なので、バリバリキャッシュしてOKです。 .jsファイルもキャッシュしてしまいましょう。 ビルドごとに内容が変わりますが、 上記のデプロイフローでビルドが終わったらCloudflareのキャッシュをAPI経由でパージするフローを追加すればOKです。

SS
さて、あとキャッシュしていないのはAPIです。 ユーザーログインの部分は性質上キャッシュできません。 GET /races/:raceIdはどうでしょう。賭けが終了したものに対してはエントリーやオッズは変更されないので、キャッシュしてもOKです。 ただ、終了していないものについては、POST /races/:raceId/betting-ticketsが走れば更新される可能性があります。 なのでずっとキャッシュしているとデータの不整合が起こる可能性があります。 うーむ。APIのキャッシュは難しそうです。 なので、この時点ではキャッシュの対象から外しました。この時は。

Cloudflareではエッジでのキャッシュのみならず以下をしました。

Brotli圧縮
HTTP/3
0-RTT
Cache-Controlヘッダの追加
103 Early Hintsの設定（Chrome DevToolsでは挙動が確認できないので、スコアには反映してなさそう）
その頃には「490点」が出るようになっていました。

fade-in しながら順に表示されること
しかし、大変な事に気づいてしまいました。 今回のレギュレーションにはVRT以外にチェック項目があります。 それをひとつひとつ確認していくと…

各レースがfade-inしながら順に表示されること

これ、めっちゃ見逃していました。アニメーションのコード削っちゃってたのよね…

この「fade-inしながら順に」が厄介で、そのままのコードだとTimerだらけになってJavaScriptのExecutionが増える。 どうしたものかと結構悩んだんですが、CSSを使えばいいじゃんとあっさり解決しました。

もっと良い書き方があるでしょうが、これでOKでした。

const ItemWrapper = styled.div`
  @keyframes fadeInOpacity {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  opacity: 1;
  animation-name: fadeInOpacity;
  animation-iteration-count: 1;
  animation-timing-function: ease-in;
  animation-duration: 0.5s;

  /* ... */
`;
これで、トップページのスコアは落ちずに済みました。

あと1点
Code Splittingとロードタイミングの最適化などを施し、もうスコアは498点台が出るようになっていました。 本家のLeaderboardをforkした自分のリポジトリで結果を確認していたのですが、 そこで何度もチャレンジしても500点は出ません。

あと1点が遠い。「SPAに戻せばスコア上がるじゃね？」って試してみても、TBTのスコアが上がるが、FCPが落ちてしまいます。 「あちらが立てばこちらが立たず」です。

奥の手「APIキャッシュ」
今まで封じてきた奥の手を使います。そう、APIをキャッシュするのです！ 前述したGET /races/:raceIdをキャッシュしてしまえば、課題である/races/:raceId/oddsのスコアが上がるかもしれない。 でも、POST /races/:raceId/betting-ticketsによって、データが更新される可能性があるので、 むやみにキャッシュはできません。

でもどうでしょう。ベットされた瞬間に/races/{対象のraceId}/oddsがパージされたら… それならよいではないでしょうか！ならば、Cloudflare Workersで実装しましょう！ こういう時のCloudflare Workersです！

Honoで実装します。2つのハンドラーと1つのミドルウェアを作ります。

まずキャッシュをせずにレスポンスをそのまま返すハンドラです。 Cache-Controlヘッダも強制的に削除しています。

const passHandler: Handler = async (c) => {
  const response = await fetch(c.req);
  const newResponse = new Response(response.body, response);
  newResponse.headers.delete("cache-control");
  return newResponse;
};
次に、キャッシュをするハンドラ。maxAgeで指定した秒数をエッジでキャッシュし、 Cache-Controlヘッダにもその値をセットしています。

const cacheHandler: Handler = async (c) => {
  const response = await fetch(c.req, {
    cf: {
      cacheEverything: true,
      cacheTtl: maxAge,
    },
  });
  const newResponse = new Response(response.body, response);
  newResponse.headers.delete("cache-control");
  newResponse.headers.append("cache-control", `max-age=${maxAge}`);
  return newResponse;
};
そして、肝となるパージ用のミドルウェア。 POST /api/races/:raceId/betting-ticketsにアクセスが来たら、 /api/races/${raceId}のキャッシュをAPI経由で削除します。

const purgeMiddleware: Handler = async (c, next) => {
  const raceId = c.req.param("raceId");
  const url = new URL(c.req.url);

  const apiURL = `https://api.cloudflare.com/client/v4/zones/${c.env.ZONE_ID}/purge_cache`;
  const data = {
    files: [`https://${url.hostname}/api/races/${raceId}`],
  };

  const fetchResponse = await fetch(apiURL, {
    body: JSON.stringify(data),
    headers: {
      Authorization: `Bearer ${c.env.API_TOKEN}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  console.log(await fetchResponse.json());
  await next();
};
この3つを各エンドポイントにマップしていきます。

まず認証とチャージ用のエンドポイントではパスします。

app.get("/api/users/me", passHandler);
app.post("/api/users/me/charge", passHandler);
トップページで使っているレース一覧と各レースページで使っているレース詳細のエンドポイントはキャッシュします。

app.get("/api/races", cacheHandler);
app.get("/api/races/:raceId", cacheHandler);
自分がどのチケットにベットしたかを返すエンドポイントは変更される可能性があるのと、 呼ばれる回数が少ないので、キャッシュしなくていいでしょう。

app.get("/api/races/:raceId/betting-tickets", passHandler);
そして、これが今回の肝のエンドポイントです。ここではパージをします。 purgeMiddlewareがミドルウェアになっているので、パージしつつ、パスするという挙動をこう書くことができます。

app.post("/api/races/:raceId/betting-tickets", purgeMiddleware, passHandler);
ただし、キャッシュして返すだけのページやアセットはWorkersを挟まない方が若干ですが速いと分かったので、 Workersルートの設定で、/api/*のみをWorkers経由にしました。

SS
これで、パージされてから2度目のアクセス以降、APIがキャッシュされます。 /races/:raceId/race-card、/races/:raceId/odds、/races/:raceId/resultの描画が爆速になりました。

500点
これでいけるはず！恐る恐る実行してみると…「499.7！」。 まだ、いけるはず…。何度か/retryしていると…出ました！

SS
やったーーーー。あああああああ、報われた、僕の17日間。

やり方は一つじゃない
と、まぁ頑張ってきました。 振り返るとたくさんのことをやってきたものです。

最初の点数
VRTの環境を作る
Scoringの環境を作る
まずherokuで頑張る
herokuからVPSへ
Linode使う
デプロイ
コンテナ使わない
キャッシュをパージする
Bundle Analyrizer
lodashやめる
memontからdayjsへ
CommonJSをやめる
ブラウザサポートも切る
Polyfillやめる
Cache-Control
hero画像
font-awesomeのSVGを抽出する
画像の最適化
TrimmedImageやめる
webp
比率問題
axiosやめる
画像のCLS問題
フェイクデータでCLS対策
Zengin問題
DevToolsを学ぶ
SQLiteにインデックスをはる
DOMを削る
React.memo
why-did-you-update
Dynamic Import
Fastifyに手を入れる
SPA、SPA+SSR、SSR
SPAだとFCPが遅い
Initiatorがズレる問題
Hydrateの仕組み
Linkヘッダ
103 EarlyHints
HTTP/3
チェックリストに気づく
CSSでアニメーションする
CDNの導入
Cloudflare vs Fastly
gzip、brotli
HTMLをガンガンキャッシュさせる
満点が難しい
あとはTBTだけ
APIをキャッシュするか
Cloudflare Workersでキャッシュの制御
Workersルートで/apiだけ賢くする
でも、チューニングの方法はこれだけじゃないでしょう。 他の参加者の方やこれから参加する人は他のやり方を知っています（そう、まだ期限内なのです！）。 特にReact、Webpackのあたりはもっと賢い方法がたくさんありそうです。 やり方はたくさんあります。ひとつじゃありません。 最後にラリー・ウォールの言葉をもじって終わりにしましょう。

There is more than one way to hack it!

PS.

採点システムを含め素晴らしいイベントを開催してくれているサイバーエージェントさんに感謝。