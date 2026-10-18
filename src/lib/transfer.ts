// ---------- 送受信の場面（Aさん → Bさん、間で盗聴者がのぞき見る） ----------

export type Who = "a" | "b" | "eve";
export type PacketKind = "plain" | "cipher" | "key";

export interface Bubble {
  text: string;
  /** 困ったこと（読まれた・鍵を取られた）を赤で表示する */
  alert?: boolean;
}

export interface TransferStep {
  /** 下に出す説明 */
  text: string;
  /** このステップで A → B へ流れるもの */
  packet?: { label: string; kind: PacketKind };
  /** 盗聴者が流れたものをコピーする */
  tapped?: boolean;
  bubbles?: Partial<Record<Who, Bubble>>;
  /** このステップの時点で鍵を持っている人 */
  keys?: Who[];
}

export interface TransferScene {
  caption: string;
  intro: string;
  /** はじめに鍵を持っている人 */
  keys: Who[];
  steps: TransferStep[];
}

export type SceneId = "plain" | "cipher" | "keyleak";

export const SCENES: Record<SceneId, TransferScene> = {
  plain: {
    caption: "暗号を使わずに送ると",
    intro: "Aさんが Bさんにメッセージを送ります。2人の間の通信路は、だれかにのぞかれているかもしれません。「1つ進める」を押して確かめよう。",
    keys: [],
    steps: [
      {
        text: "Aさんは「SUSHI」というメッセージを、そのまま送ることにしました。",
        bubbles: { a: { text: "SUSHI を送るね" } },
      },
      {
        text: "メッセージが通信路を流れて、Bさんに届きました。ところが、通信路の途中で盗聴者が同じものをコピーしています。",
        packet: { label: "SUSHI", kind: "plain" },
        tapped: true,
        bubbles: { b: { text: "SUSHI 届いた！" } },
      },
      {
        text: "盗聴者は、コピーしたメッセージをそのまま読めてしまいました。Aさんも Bさんも、のぞかれたことに気づいていません。",
        packet: { label: "SUSHI", kind: "plain" },
        tapped: true,
        bubbles: { b: { text: "SUSHI 届いた！" }, eve: { text: "SUSHI…読めた！", alert: true } },
      },
    ],
  },
  cipher: {
    caption: "共通鍵で暗号化して送ると",
    intro: "Aさんと Bさんは、共通鍵「3」を作って、2人で共有しておきました。この共通鍵は、絶対に第三者にもらしてはいけません。",
    keys: ["a", "b"],
    steps: [
      {
        text: "Aさんは、平文「SUSHI」を鍵「3」で暗号化して、暗号文「VXVKL」にしました。",
        bubbles: { a: { text: "SUSHI → VXVKL" } },
      },
      {
        text: "暗号文が通信路を流れます。盗聴者はまたコピーしましたが、鍵を持っていないので意味が分かりません。",
        packet: { label: "VXVKL", kind: "cipher" },
        tapped: true,
        bubbles: { eve: { text: "VXVKL…？ 読めない" } },
      },
      {
        text: "Bさんは、暗号化に使ったのと同じ鍵「3」で復号して、平文「SUSHI」に戻せました。",
        packet: { label: "VXVKL", kind: "cipher" },
        tapped: true,
        bubbles: { b: { text: "VXVKL → SUSHI" }, eve: { text: "VXVKL…？ 読めない" } },
      },
    ],
  },
  keyleak: {
    caption: "鍵も通信路で送ると",
    intro: "今度は、Aさんしか鍵を持っていません。Bさんが復号するには、同じ鍵が必要です。Aさんは、鍵もインターネットで送ることにしました。",
    keys: ["a"],
    steps: [
      {
        text: "Aさんは、Bさんに鍵「3」を送りました。盗聴者は、流れてきた鍵もコピーできてしまいます。",
        packet: { label: "🔑 鍵＝3", kind: "key" },
        tapped: true,
        keys: ["a", "b", "eve"],
        bubbles: { b: { text: "鍵を受け取った" }, eve: { text: "鍵を手に入れた！", alert: true } },
      },
      {
        text: "Aさんは、平文「SUSHI」を鍵「3」で暗号化して、暗号文「VXVKL」を送りました。盗聴者は、これもコピーします。",
        packet: { label: "VXVKL", kind: "cipher" },
        tapped: true,
        keys: ["a", "b", "eve"],
        bubbles: { a: { text: "SUSHI → VXVKL" } },
      },
      {
        text: "Bさんは鍵「3」で復号できました。でも、同じ鍵を持っている盗聴者も復号できてしまいます。鍵を同じ通信路で送ると、暗号にした意味がなくなります。",
        packet: { label: "VXVKL", kind: "cipher" },
        tapped: true,
        keys: ["a", "b", "eve"],
        bubbles: { b: { text: "VXVKL → SUSHI" }, eve: { text: "復号したら SUSHI！", alert: true } },
      },
    ],
  },
};
