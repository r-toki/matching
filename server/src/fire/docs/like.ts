import { CollectionReference, Timestamp } from "firebase-admin/firestore";
import { z } from "zod";

import { LikeStatus } from "../../graphql/generated";
import { FireDocument, FireDocumentInput } from "../lib/fire-document";

const LikeSchema = z
  .object({
    senderId: z.string().min(1),
    receiverId: z.string().min(1),
    status: z.enum(["PENDING", "MATCHED", "SKIPPED"]),
    createdAt: z.instanceof(Timestamp),
    updatedAt: z.instanceof(Timestamp),
  })
  .strict();

export type LikeData = z.infer<typeof LikeSchema>;

export type LikeIndexData = { id: string } & Pick<LikeData, "senderId" | "receiverId" | "status" | "createdAt">;

export class LikeDoc extends FireDocument<LikeData> implements LikeData {
  static create(
    collection: CollectionReference<LikeData>,
    { senderId, receiverId }: Pick<LikeData, "senderId" | "receiverId">
  ) {
    const docRef = collection.doc();
    const createdAt = Timestamp.now();
    return new LikeDoc({
      id: docRef.id,
      ref: docRef,
      data: () => ({
        senderId,
        receiverId,
        status: "PENDING",
        createdAt,
        updatedAt: createdAt,
      }),
    });
  }

  senderId!: string;
  receiverId!: string;
  status!: LikeStatus;
  createdAt!: Timestamp;
  updatedAt!: Timestamp;

  constructor(snap: FireDocumentInput<LikeData>) {
    super(snap);
  }

  toData() {
    const { id, ref, ...data } = this;
    return data;
  }

  toBatch() {
    const { id, ref, ...data } = this;
    return [ref, data] as const;
  }

  toIndex() {
    const { id, ref, ...data } = this;
    const { senderId, receiverId, status, createdAt } = data;
    const index: LikeIndexData = { id, senderId, receiverId, status, createdAt };
    return index;
  }

  skip() {
    return this.edit({ status: "SKIPPED", updatedAt: Timestamp.now() });
  }

  match() {
    return this.edit({ status: "MATCHED", updatedAt: Timestamp.now() });
  }
}
