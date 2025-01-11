import mongoose, { Document, Model, Query } from "mongoose";
import bcrypt from "bcrypt";
import isEmail from "validator/lib/isEmail";

export interface IUser {
  fullname: string;
  email: string;
  password: string;
  passwordConfirm: string | undefined;
  //   contact: number;
  //   address: string;
  //   city: string;
  //   country: string;
  photo: string;
  role: "user" | "guide" | "lead-guide" | "admin";
  active: boolean;
  lastLogin?: Date;
  isVerified?: boolean;
  passwordChangedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordTokenExpiresAt?: Date;
  verificationToken?: string;
  verificationTokenExpiresAt?: Date;
}

export interface IUserDocument extends IUser, Document {
  createdAt: Date;
  updatedAt: Date;
}

// Defining schema
const userSchema = new mongoose.Schema<IUserDocument>({
  fullname: {
    type: String,
    required: [true, "Please tell us your full name"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [isEmail, "Please provide a valid email"],
  },
  photo: {
    type: String,
    default: "default.jpg",
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: 8,
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only works on CREATE and SAVE!!!
      validator: function (el: IUser["passwordConfirm"]) {
        return el === this.password;
      },
      message: "Password and Confirm password are not the same",
    },
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  passwordChangedAt: Date,
  resetPasswordToken: String,
  resetPasswordTokenExpiresAt: Date,
  verificationToken: String,
  verificationTokenExpiresAt: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

/**
 * Hash the password before saving it to database
 *
 * '.pre' hook for "save" operates on documents
 */
userSchema.pre<IUserDocument>("save", async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

/**
 * The regular expression matches for example like "find", "findOne", "findOneAndUpdate", etc.
 *
 * '.pre' hook for "find" operates on Query
 */
userSchema.pre<Query<unknown, IUserDocument>>(/^find/, function (next) {
  // 'this' points to the current query
  this.find({ active: { $ne: false } });
  next();
});

export const User: Model<IUserDocument> = mongoose.model<IUserDocument>(
  "User",
  userSchema
);
