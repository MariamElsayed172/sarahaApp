import mongoose from "mongoose"

export let genderEnum = { male: "male", female: "female" }
export let roleEnum = { user: "user", admin: "admin" }
export const providerEnum = { system: "system", google: "google" }


const userSchema = new mongoose.Schema({
    firstName: {
        type: String, require: true, minLength: 2, maxLength: 20
    },
    lastName: {
        type: String, require: true, minLength: 2, maxLength: 20
    },
    email: { type: String, require: true, unique: true },
    password: { type: String, require: function () { return this.provider === providerEnum.system ? true : false } },
    forgotPasswordOtp:String,
    changeCredentialsTime:Date,
    gender: { type: String, enum: Object.values(genderEnum), default: genderEnum.male },
    role: { type: String, enum: Object.values(roleEnum), default: roleEnum.user },
    phone: { type: String, require: function () { return this.provider === providerEnum.system ? true : false } },
    provider: { type: String, enum: Object.values(providerEnum), default: providerEnum.system },
    confirmEmail: Date,
    confirmEmailOtp: String,
    confirmEmailOtpCreatedAt: Date,
    otpFailedAttempts: { type: Number, default: 0 },
    otpBannedUntil: Date,
    deletedAt:Date,
    deletedBy:{type:mongoose.Schema.Types.ObjectId, ref:"User"},
    restoreAt:Date,
    restoreBy:{type:mongoose.Schema.Types.ObjectId, ref:"User"},

    picture: {secure_url:String , public_id:String},
    coverImages: [{secure_url:String , public_id:String}]
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
})
userSchema.virtual("fullName").set(function (value) {
    const [firstName, lastName] = value?.split(" ") || [];
    this.set({ firstName, lastName })
}).get(function () {
    return this.firstName + " " + this.lastName;
})
userSchema.virtual('messages',{
    localField:"_id",
    foreignField:"receiverId",
    ref:"Message"
})
export const UserModel = mongoose.models.User || mongoose.model("User", userSchema)
UserModel.syncIndexes()