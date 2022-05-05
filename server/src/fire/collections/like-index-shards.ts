import { FireCollection } from "@rei-sogawa/unfireorm";
import { CollectionReference } from "firebase-admin/firestore";
import { has, merge, shuffle } from "lodash";

import { LikeIndexShardData, LikeIndexShardDoc } from "../docs/like-index-shard";

export class LikeIndexShardsCollection extends FireCollection<LikeIndexShardData, LikeIndexShardDoc> {
  docIds = ["0", "1", "2"];

  constructor(ref: CollectionReference) {
    super(ref, (snap) => new LikeIndexShardDoc(snap));
  }

  async getIndex() {
    const docs = await this.findManyByQuery((ref) => ref);
    return docs.map((doc) => doc.toData()).reduce((prev, curr) => merge(prev, curr), {} as LikeIndexShardData).shard;
  }

  async getById(id: string) {
    const docs = await this.findManyByQuery((ref) => ref);
    const doc = docs.find((_doc) => has(_doc.shard, id));
    if (!doc) throw new Error("doc not found");
    return doc;
  }

  async get() {
    const docId = shuffle(this.docIds)[0];
    const snap = await this.ref.doc(docId).get();
    const data = snap.data() ?? ({} as LikeIndexShardData);
    return new LikeIndexShardDoc({ id: snap.id, ref: snap.ref, data: () => data });
  }
}
