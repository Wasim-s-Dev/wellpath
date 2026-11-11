/** A WellPath account. The password hash is excluded from queries unless explicitly selected. */
import { type HydratedDocument, type InferSchemaType, Schema, model } from "mongoose";
import { ROLES, type PublicUser } from "@wellpath/shared";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true, default: "user" },
    status: { type: String, enum: ["active", "suspended"], required: true, default: "active" },
  },
  { timestamps: true },
);

export const User = model("User", userSchema);
export type UserDocument = HydratedDocument<InferSchemaType<typeof userSchema>>;

export function toPublicUser(user: UserDocument): PublicUser {
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
