import { FireDocument, FireDocumentInput } from "@rei-sogawa/unfireorm";
import { now } from "lodash";
import { z } from "zod";

import { LikeStatus } from "../../graphql/generated";
import { createConverter } from "../helpers/create-converter";

const LikeSchema = z
  .object({
    senderId: z.string().min(1),
    receiverId: z.string().min(1),
    status: z.enum(["PENDING", "MATCHED", "SKIPPED"]),
    createdAt: z.date(),
    updatedAt: z.date(),
  })
  .strict();

export type LikeData = z.infer<typeof LikeSchema>;

export const likeConverter = createConverter<LikeData>();

export class LikeDoc extends FireDocument<LikeData> implements LikeData {
  senderId!: string;
  receiverId!: string;
  status!: LikeStatus;
  createdAt!: Date;
  updatedAt!: Date;

  constructor(snap: FireDocumentInput<LikeData>) {
    super(snap, likeConverter);
  }

  toData() {
    const { id, ref, ...data } = this;
    return LikeSchema.parse(data);
  }

  static create(data: Omit<LikeData, "createdAt" | "updatedAt">) {
    const createdAt = now();
    return LikeSchema.parse({ ...data, createdAt, updateAt: createdAt });
  }

  edit(data: Partial<Omit<LikeData, "createdAt" | "updatedAt">>) {
    const updatedAt = now();
    Object.assign(this, { ...data, updatedAt });
    LikeSchema.parse(this.toData());
    return this;
  }
}