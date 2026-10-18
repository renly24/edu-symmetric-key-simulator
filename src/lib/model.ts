// ---------- モデル（スライドの内容） ----------

import type { SceneId } from "./transfer";

export const PLAIN_COLOR = "#2e7d32";
export const CIPHER_COLOR = "#6a1b9a";
export const KEY_COLOR = "#ef6c00";
export const EVE_COLOR = "#c62828";

export const CHAPTERS = [
  { id: 1, name: "情報の暗号化", color: "#455a64" },
  { id: 2, name: "共通鍵暗号方式", color: "#1565c0" },
  { id: 3, name: "共通鍵暗号方式の課題", color: EVE_COLOR },
  { id: 4, name: "まとめ", color: PLAIN_COLOR },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

// ---------- 問題 ----------

export interface ChoiceQuiz {
  kind: "choice";
  question: string;
  options: string[];
  answer: number;
  ok: string;
  ng: string;
  /** true の予想問題は、答えるまで次のスライドへ進めない */
  gate?: boolean;
}

export type Quiz = ChoiceQuiz | { kind: "task" } | { kind: "test" };

export type QuizLabel = "予想問題" | "体験問題" | "確認問題";

export function quizLabel(quiz: Quiz | undefined): QuizLabel | null {
  if (!quiz) return null;
  if (quiz.kind === "choice") return quiz.gate ? "予想問題" : "確認問題";
  if (quiz.kind === "test") return "確認問題";
  return "体験問題";
}

export const QUIZ_COLOR: Record<QuizLabel, string> = {
  予想問題: "#1565c0",
  体験問題: "#ef6c00",
  確認問題: "#2e7d32",
};

// ---------- スライド ----------

export type Stage =
  /** Aさん → Bさんの送受信。荷物をドラッグして送る */
  | { kind: "transfer"; scene: SceneId }
  /** 盗聴者になって、通信路の上をカーソルでのぞく */
  | { kind: "peek"; mode: "plain" | "cipher" }
  /** 平文・暗号文・鍵・暗号化・復号のことばを図に入れる */
  | { kind: "terms" }
  /** 暗号円盤をホイールやドラッグで回す */
  | { kind: "caesar" }
  /** 手で暗号化・復号してみる */
  | { kind: "handwork"; mode: "encrypt" | "decrypt"; text: string; key: number }
  /** 復号の鍵を変えてみる */
  | { kind: "wrongkey" }
  /** 人数と、必要な鍵の数 */
  | { kind: "keycount" }
  /** よいところ・困るところに仕分ける */
  | { kind: "summary" }
  /** 手順を並べる */
  | { kind: "order" }
  | { kind: "test" };

export interface Slide {
  id?: string;
  chapter: ChapterId;
  title: string;
  description: string;
  stage: Stage;
  /** 説明の下に出す要点 */
  points?: string[];
  quiz?: Quiz;
  /** やってみよう（操作の課題）。クリアするまで次のスライドへ進めない */
  mission?: string;
}

export const SLIDES: Slide[] = [
  // ---- 第1章 情報の暗号化 ----
  {
    id: "intro",
    chapter: 1,
    title: "通信はのぞかれているかもしれない",
    description:
      "ネットショッピングや電子決済では、カード番号などの大切な情報がインターネットを流れます。インターネットでは、データがいくつもの機器を中継して届くので、途中でだれかにコピーされる（盗聴される）かもしれません。Aさんになって、メッセージを Bさんに送ってみよう。",
    stage: { kind: "transfer", scene: "plain" },
    mission: "メッセージの札を Bさんまでドラッグして送り、最後の場面まで進めよう",
  },
  {
    id: "peek",
    chapter: 1,
    title: "盗聴者になってみよう",
    description:
      "今度は盗聴者の立場です。通信路には、だれかのメッセージが次々に流れています。のぞき見る道具（虫めがね）を通信路に当てると、流れているデータの中身が見えてしまいます。",
    stage: { kind: "peek", mode: "plain" },
    mission: "カーソル（指）を通信路の上で動かして、流れてくるメッセージを3つのぞき見よう",
    quiz: {
      kind: "choice",
      gate: true,
      question: "コピーされても中身を読まれないようにするには、どうすればよいと思う？",
      options: ["メッセージを短くして送る", "何回も同じメッセージを送る", "決まりにしたがって、読めない形に変えてから送る"],
      answer: 2,
      ok: "正解！ 第三者に読まれないように、読めない形に変えてから送ります。これを暗号化といいます。",
      ng: "短くしても、何回送っても、コピーされれば読まれてしまいます。読めない形に変えてから送るのが、暗号化です。",
    },
  },
  {
    id: "terms",
    chapter: 1,
    title: "暗号のことば",
    description:
      "暗号化されていないメッセージを平文（ひらぶん）、暗号化されたメッセージを暗号文といいます。暗号文を平文に戻すことを復号といいます。暗号化や復号のときに使うデータを鍵といいます。",
    stage: { kind: "terms" },
    quiz: { kind: "task" },
    mission: "ことばのカードを、図の空いているところへドラッグして入れよう（タップで選んでからタップでも入れられます）",
    points: ["平文 ＋ 鍵 → 暗号化 → 暗号文", "暗号文 ＋ 鍵 → 復号 → 平文", "鍵を使う代表的な方式に、共通鍵暗号方式と公開鍵暗号方式がある"],
  },

  // ---- 第2章 共通鍵暗号方式 ----
  {
    id: "caesar",
    chapter: 2,
    title: "鍵で暗号化してみよう",
    description:
      "ここでは例として、アルファベットを決まった数だけ後ろにずらす暗号を使います。ずらす数が鍵です。外側の円が平文の文字、内側の円が暗号文の文字です。内側の円盤を回すと、鍵が変わります。",
    stage: { kind: "caesar" },
    mission: "マウスホイール（または円盤をドラッグ）で内側の円盤を回して、外側の A の内側が D になるようにしよう",
    points: ["鍵が 3 なら A は D、B は E になる", "Z まで行ったら A に戻る"],
  },
  {
    id: "encrypt",
    chapter: 2,
    title: "暗号化してみよう",
    description:
      "鍵 3 で「NEKO」を暗号化してください。上の段（平文）から文字を探して、すぐ下の段（暗号文）の文字を書きます。入力する欄を選ぶと、探す文字が光ります。",
    stage: { kind: "handwork", mode: "encrypt", text: "NEKO", key: 3 },
    quiz: { kind: "task" },
    mission: "表の暗号文の文字をダブルクリックすると、選んでいる欄に入ります。4文字とも正しく入れて答え合わせしよう",
  },
  {
    id: "decrypt",
    chapter: 2,
    title: "復号してみよう",
    description:
      "Bさんに暗号文「VXVKL」が届きました。暗号化に使った鍵は 3 です。今度は下の段（暗号文）から文字を探して、すぐ上の段（平文）の文字を書きます。暗号化とは反対向きに、3 つ戻すことになります。",
    stage: { kind: "handwork", mode: "decrypt", text: "VXVKL", key: 3 },
    quiz: { kind: "task" },
    mission: "表の平文の文字をダブルクリックするか、キーボードで入力して、5文字とも正しく復号しよう",
  },
  {
    chapter: 2,
    title: "違う鍵で復号したら？",
    description: "Bさんが鍵をまちがえて覚えていたとします。暗号化には鍵 3 を使ったのに、鍵 5 で復号しようとしたらどうなるでしょう。",
    stage: { kind: "caesar" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "暗号化と違う鍵で復号すると、どうなると思う？",
      options: ["意味のない文字の並びになって、読めない", "少しまちがった平文になるが、だいたい読める", "自動で正しい鍵に直してくれる"],
      answer: 0,
      ok: "正解！ 文字のずれ方が全部変わるので、意味のない文字の並びになります。次のスライドで試してみよう。",
      ng: "文字のずれ方が全部変わるので、意味のない文字の並びになります。次のスライドで試してみよう。",
    },
  },
  {
    id: "wrong-key",
    chapter: 2,
    title: "同じ鍵でないと戻せない",
    description:
      "暗号文「VXVKL」を、いろいろな鍵で復号してみよう。円盤を回すと、復号に使う鍵が変わります。平文に戻るのは、暗号化に使ったのと同じ鍵のときだけです。",
    stage: { kind: "wrongkey" },
    mission: "円盤を回していろいろな鍵で復号し、意味のある言葉に戻る鍵を見つけよう",
    points: ["暗号化と復号に、同じ鍵を使う", "鍵がちがうと、平文には戻らない"],
  },
  {
    id: "cipher-flow",
    chapter: 2,
    title: "共通鍵暗号方式",
    description:
      "暗号化と復号に同じ鍵（共通鍵）を使うやり方を、共通鍵暗号方式といいます。対称鍵暗号とも呼ばれます。2人が同じ共通鍵を持っていれば、ネットワーク上を流れるのは暗号文だけなので、盗聴者にコピーされても中身は読まれません。",
    stage: { kind: "transfer", scene: "cipher" },
    mission: "暗号文の札を Bさんまでドラッグして送り、最後の場面まで進めよう",
    points: ["暗号化と復号に、同じ鍵（共通鍵）を使う", "共通鍵は、絶対に第三者にもらしてはいけない"],
  },
  {
    chapter: 2,
    title: "もう一度、盗聴者になってみよう",
    description:
      "今度は、流れているメッセージがすべて共通鍵で暗号化されています。さっきと同じように虫めがねでのぞいてみよう。中身を手に入れても、共通鍵を持っていない盗聴者には意味が分かりません。",
    stage: { kind: "peek", mode: "cipher" },
    mission: "通信路の上でカーソル（指）を動かして、暗号化されたメッセージを3つのぞき見よう",
  },
  {
    id: "order",
    chapter: 2,
    title: "手順を並べよう",
    description: "共通鍵暗号方式で、Aさんが Bさんに秘密のメッセージを送る手順を、正しい順番にタップしてください。",
    stage: { kind: "order" },
    quiz: { kind: "task" },
    mission: "4つの手順を、正しい順番に全部並べよう",
  },

  // ---- 第3章 共通鍵暗号方式の課題 ----
  {
    chapter: 3,
    title: "共通鍵はどうやって渡す？",
    description:
      "共通鍵暗号方式では、Bさんも同じ共通鍵を持っていないと復号できません。会って直接渡せればよいのですが、遠くにいる相手や、初めて通信する相手（ネットショップなど）だとそうはいきません。",
    stage: { kind: "transfer", scene: "cipher" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "共通鍵を、暗号文と同じようにインターネットで送ったらどうなると思う？",
      options: ["盗聴者に共通鍵もコピーされて、暗号文を復号されてしまう", "鍵は暗号ではないので、だれにも読まれない", "鍵を送ると、暗号文が自動で消える"],
      answer: 0,
      ok: "正解！ 共通鍵も盗聴者にコピーされてしまえば、暗号文を復号されてしまいます。次のスライドで確かめよう。",
      ng: "共通鍵も通信路を流れるデータなので、盗聴者にコピーされてしまいます。次のスライドで確かめよう。",
    },
  },
  {
    id: "key-leak",
    chapter: 3,
    title: "共通鍵を盗まれると",
    description:
      "共通鍵を暗号文と同じ通信路で送ると、盗聴者は共通鍵と暗号文の両方を手に入れて、復号できてしまいます。共通鍵暗号方式では、そもそも相手に共通鍵をどうやって安全に渡すかが問題になります。",
    stage: { kind: "transfer", scene: "keyleak" },
    mission: "鍵の札と暗号文の札を、順に Bさんまでドラッグして送ってみよう",
    points: ["共通鍵を、相手に安全に渡す方法が問題になる"],
  },
  {
    id: "key-count",
    chapter: 3,
    title: "相手ごとに鍵が必要",
    description:
      "同じ共通鍵をみんなで使うと、ほかの人にも読まれてしまいます。そのため、送る相手ごとに別の鍵を使い分ける必要があります。たとえば 3 人が互いに通信するなら、2 人の組み合わせは 3 通りなので、鍵は 3 個必要です。では 4 人ならどうでしょう。",
    stage: { kind: "keycount" },
    quiz: { kind: "task" },
    mission: "人から人へドラッグして線を引き、4人のどの2人の間にも鍵（線）を作ろう。いくつ必要か数えてみよう",
    points: ["送る相手ごとに、別の共通鍵が必要", "人数が増えると、たくさんの鍵を管理する手間がかかる"],
  },

  // ---- 第4章 まとめ ----
  {
    id: "summary",
    chapter: 4,
    title: "共通鍵暗号方式の長所と課題",
    description:
      "共通鍵暗号方式は、暗号化や復号の処理が速いという長所があります。一方で、相手ごとに鍵を使い分けて管理する手間や、鍵を安全に渡す方法が課題です。共通鍵暗号方式の代表的な暗号化アルゴリズムに AES があり、無線 LAN の通信を守る規格（WPA2・WPA3）にも使われています。",
    stage: { kind: "summary" },
    quiz: { kind: "task" },
    mission: "特徴のカードを「長所」「課題」の箱へドラッグして仕分けよう",
    points: ["代表的な暗号化アルゴリズム：AES（無線 LAN の規格 WPA2・WPA3 で使われている）", "鍵を渡す問題は、次の教材「公開鍵暗号方式」で考えよう"],
  },
  {
    chapter: 4,
    title: "まとめテスト",
    description:
      "ここまでの内容から8問です。全部答えたら「採点する」を押してください。間違えた問題は、説明のスライドに戻って確認できます。最後の結果画面をスクリーンショットして提出しましょう。",
    stage: { kind: "test" },
    quiz: { kind: "test" },
  },
];

export function slideIndexOf(id: string) {
  return SLIDES.findIndex((s) => s.id === id);
}

// ---------- 手順の並べ替え ----------

export const ORDER_STEPS = [
  "共通鍵を作り、Aさんと Bさんの2人で共有する",
  "Aさんが、共通鍵で平文を暗号化する",
  "ネットワーク上を、暗号文の状態で送る",
  "Bさんが、共通鍵で復号して平文を得る",
];
/** 選択肢を並べる順番（正しい順番とは変えておく） */
export const ORDER_SHOWN = [2, 0, 3, 1];
export const ORDER_HINT = [
  "暗号化する前に、2人が同じ鍵を持っていないと、Bさんは復号できません。",
  "鍵を共有したら、次は送る前に平文を暗号文に変えます。",
  "暗号化したら、暗号文を送ります。",
  "最後に、受け取った Bさんが元に戻します。",
];

// ---------- まとめテスト ----------

export const TEST_QUESTIONS: { question: string; options: string[]; answer: number; review: string }[] = [
  {
    question: "暗号化されていないメッセージを何という？",
    options: ["暗号文", "鍵", "平文"],
    answer: 2,
    review: "terms",
  },
  {
    question: "暗号文を平文に戻すことを何という？",
    options: ["暗号化", "復号", "盗聴"],
    answer: 1,
    review: "terms",
  },
  {
    question: "共通鍵暗号方式の特徴は？",
    options: ["暗号化と復号に違う鍵を使う", "鍵を使わない", "暗号化と復号に同じ鍵を使う"],
    answer: 2,
    review: "cipher-flow",
  },
  {
    question: "共通鍵暗号方式の別の呼び方は？",
    options: ["対称鍵暗号", "公開鍵暗号", "電子署名"],
    answer: 0,
    review: "cipher-flow",
  },
  {
    question: "共通鍵暗号方式の長所は？",
    options: ["鍵を渡す必要がない", "鍵が1つあれば、だれとでも通信できる", "暗号化や復号の処理が速い"],
    answer: 2,
    review: "summary",
  },
  {
    question: "共通鍵暗号方式で問題になることは？",
    options: ["暗号文が長くなりすぎること", "共通鍵を相手に安全に渡す方法", "平文に戻せないこと"],
    answer: 1,
    review: "key-leak",
  },
  {
    question: "4人が互いに通信するとき、共通鍵は何個必要？",
    options: ["6 個", "4 個", "12 個"],
    answer: 0,
    review: "key-count",
  },
  {
    question: "無線 LAN の規格 WPA2・WPA3 で使われている、共通鍵暗号方式の代表的な暗号化アルゴリズムは？",
    options: ["HTTP", "AES", "IP"],
    answer: 1,
    review: "summary",
  },
];

// ---------- 仕分け（長所・課題） ----------

export type SummaryBin = "good" | "bad";

export const SUMMARY_ITEMS: { label: string; answer: SummaryBin }[] = [
  { label: "暗号化や復号の処理が速い", answer: "good" },
  { label: "送る相手ごとに鍵を使い分ける必要がある", answer: "bad" },
  { label: "たくさんの鍵を管理する手間がかかる", answer: "bad" },
  { label: "相手に鍵を安全に渡す方法が問題になる", answer: "bad" },
];
