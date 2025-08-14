import { providerEnum, UserModel } from "../../DB/models/user.model.js"
import { asyncHandler, successResponse } from "../../utils/response.js"
import * as DBService from '../../DB/db.service.js'
import { compareHash, generateHash } from "../../utils/security/hash.security.js"
import { generateEncryption } from "../../utils/security/encryption.security.js"
import { generateLoginCredentials } from "../../utils/security/token.security.js"
import { OAuth2Client } from 'google-auth-library'
import { emailEvent } from "../../utils/events/email.event.js"
import { customAlphabet } from "nanoid"



export const signup = asyncHandler(
    async (req, res, next) => {

        const { fullName, email, password, phone } = req.body
        //console.log({ fullName, email, password, phone });

        if (await DBService.findOne({ model: UserModel, filter: { email } })) {
            return next(new Error("Email exist", { cause: 409 }))
        }
        const hashPassword = await generateHash({ plainText: password });
        const encPhone = await generateEncryption({ plainText: phone })
        const [user] = await DBService.create({
            model: UserModel,
            data: [
                {
                    fullName,
                    email,
                    password: hashPassword,
                    phone: encPhone,
                }
            ]
        })

        await sendConfirmEmailOtp({ email, next })
        return successResponse({ res, status: 201, data: { user } })

    }
)

export const confirmEmail = asyncHandler(
    async (req, res, next) => {

        const { email, otp } = req.body
        const user = await DBService.findOne({
            model: UserModel,
            filter: {
                email,
                confirmEmail: { $exists: false },
                confirmEmailOtp: { $exists: true }
            }
        })
        //console.log(user);

        if (!user) {
            return next(new Error("In-valid account or already verified", { cause: 404 }))
        }

        const now = Date.now();

        if (user.otpBannedUntil && user.otpBannedUntil > now) {
            return next(new Error("You are temporarily banned from verifying. Try again later.", { cause: 429 }));
        }

        const otpAgeInMinutes = (now - new Date(user.confirmEmailOtpCreatedAt)) / (1000 * 60);
        if (otpAgeInMinutes > 2) {
            return next(new Error("OTP has expired", { cause: 410 }));
        }


        const isMatch = await compareHash({ plainText: otp, hashValue: user.confirmEmailOtp });
        if (!isMatch) {
            const attempts = user.otpFailedAttempts + 1;
            const updateData = { otpFailedAttempts: attempts };

            if (attempts >= 5) {
                updateData.otpBannedUntil = new Date(now + 5 * 60 * 1000);
                updateData.otpFailedAttempts = 0;
            }

            await DBService.updateOne({
                model: UserModel,
                filter: { email },
                data: updateData
            });

            return next(new Error("Invalid OTP", { cause: 401 }));
        }

        const updateUser = await DBService.updateOne({
            model: UserModel,
            filter: { email },
            data: {
                confirmEmail: Date.now(),
                $unset: { confirmEmailOtp: true, otpFailedAttempts: 0 },
                $inc: { __v: 1 }
            }
        })

        return updateUser.matchedCount ? successResponse({ res, status: 200, data: {} })
            : next(new Error("fail to confirm user email"))

    }
)

export const sendConfirmEmailOtp = asyncHandler(
    async ({ email, next }) => {
        const user = await DBService.findOne({
            model: UserModel,
            filter: {
                email,
                confirmEmail: { $exists: false }
            }
        });

        if (!user) {
            return next(new Error("User not found or already verified", { cause: 404 }));
        }

        const now = new Date();

        if (user.otpBannedUntil && user.otpBannedUntil > now) {
            return next(new Error("You are temporarily banned from requesting a new code. Try again later.", { cause: 429 }));
        }

        const otpAgeInMinutes = (now - new Date(user.confirmEmailOtpCreatedAt)) / (1000 * 60);
        if (otpAgeInMinutes < 2) {
            return next(new Error("OTP is not expired, so please wait", { cause: 410 }));
        }


        const otp = customAlphabet('0123456789', 6)();
        const hashedOtp = await generateHash({ plainText: otp });

        await DBService.updateOne({
            model: UserModel,
            filter: { email },
            data: {
                confirmEmailOtp: hashedOtp,
                confirmEmailOtpCreatedAt: now,
                otpFailedAttempts: 0,
                otpBannedUntil: null
            }
        });

        emailEvent.emit("confirmEmail", { to: email, otp });
    }
);

export const resendConfirmEmailOtp = asyncHandler(async (req, res, next) => {
    const { email } = req.body;

    await sendConfirmEmailOtp({ email, next });

    return successResponse({ res, status: 200, message: "OTP resent successfully" });
});

export const login = asyncHandler(
    async (req, res, next) => {
        const { email, password } = req.body
        const user = await DBService.findOne({ model: UserModel, filter: { email } })
        if (!user) {
            return next(new Error("In-valid email or password", { cause: 404 }))
        }

        if (!user.confirmEmail) {
            return next(new Error("Please verify you account first"))
        }

        if (user.deletedAt) {
            return next(new Error("Account is deleted"))
        }

        if (!await compareHash({ plainText: password, hashValue: user.password })) {
            return next(new Error("In-valid email or password", { cause: 404 }))
        }

        const credentials = await generateLoginCredentials({ user })
        return successResponse({ res, data: { credentials } })
    }
)

export const sendForgotPassword = asyncHandler(
    async (req, res, next) => {
        const { email } = req.body
        const otp = customAlphabet("0123456789", 6)()
        const user = await DBService.findOneAndUpdate({
            model: UserModel,
            filter: {
                email,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                provider: providerEnum.system
            },
            data: {
                forgotPasswordOtp: await generateHash({ plainText: otp })
            }
        })

        if (!user) {
            return next(new Error("In-valid account", { cause: 404 }))
        }
        emailEvent.emit("sendForgotPassword", { to: email, subject: "Forgot password", title: "Reset-password", otp })
        return successResponse({ res })
    }
)

export const verifyForgotPassword = asyncHandler(
    async (req, res, next) => {
        const { email, otp } = req.body
        const user = await DBService.findOne({
            model: UserModel,
            filter: {
                email,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                forgotPasswordOtp: { $exists: true },
                provider: providerEnum.system
            }
        })

        if (!user) {
            return next(new Error("In-valid account", { cause: 404 }))
        }

        if (!await compareHash({ plainText: otp, hashValue: user.forgotPasswordOtp })) {
            return next(new Error("In-valid otp", { cause: 400 }))
        }

        return successResponse({ res })
    }
)

export const resetPassword = asyncHandler(
    async (req, res, next) => {
        const { email, otp, password } = req.body
        const user = await DBService.findOne({
            model: UserModel,
            filter: {
                email,
                confirmEmail: { $exists: true },
                deletedAt: { $exists: false },
                forgotPasswordOtp: { $exists: true },
                provider: providerEnum.system
            }
        })

        if (!user) {
            return next(new Error("In-valid account", { cause: 404 }))
        }

        if (!await compareHash({ plainText: otp, hashValue: user.forgotPasswordOtp })) {
            return next(new Error("In-valid otp", { cause: 400 }))
        }
        
        await DBService.updateOne({
            model:UserModel,
            filter:{email},
            data:{
                password: await generateHash({plainText:password}),
                createRevokeToken: new Date(),
                $unset:{
                    forgotPasswordOtp:1
                }
            }
        })

        return updatedUser.matchedCount? successResponse({ res }): next(new Error("Fail to reset account password"), {cause:400})
    }
)

export const getNewLoginCredentials = asyncHandler(async (req, res, next) => {
    const credentials = await generateLoginCredentials({ user: req.user })
    return successResponse({ res, data: { credentials } })
});

async function verifyGoogleAccount({ idToken } = {}) {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload

}

export const signupWithGmail = asyncHandler(
    async (req, res, next) => {
        const { idToken } = req.body
        const { picture, name, email, email_verified } = await verifyGoogleAccount({ idToken })
        if (!email_verified) {
            return next(new Error("not verified account", { cause: 404 }))
        }
        const user = await DBService.findOne({
            model: UserModel,
            filter: { email }
        })

        if (user) {
            if (user.provider === providerEnum.google) {
                const credentials = await generateLoginCredentials({ user })
                return successResponse({ res, status: 200, data: { credentials } })
            }
            return next(new Error("Email exist", { cause: 409 }))
        }
        const otp = customAlphabet('0123456789', 6)()
        const confirmEmailOtp = await generateHash({ plainText: otp })
        const [newUser] = await DBService.create({
            model: UserModel,
            data: [{
                fullName: name,
                email,
                picture,
                confirmEmail: Date.now(),
                confirmEmailOtp,
                provider: providerEnum.google
            }]
        })
        //console.log(newUser);

        const credentials = generateLoginCredentials({ user: newUser })
        emailEvent.emit("confirmEmail", { to: email, otp: otp })
        /* await sendEmail({
            to: newUser.email,
            subject: "Confirm Email",
            html: `
                <h1>Hello ${newUser.fullName},</h1>
                <p>Welcome to Saraha app!</p>
                <br />
                <h2>OTP: ${Date.now()}</h2>
                <br />
                <strong>The Team</strong>
            `
        }); */
        return successResponse({ res, status: 201, data: { credentials } })
        //return successResponse({ res, status: 201, data: { user: newUser._id } })

    }
)

export const loginWithGmail = asyncHandler(
    async (req, res, next) => {
        const { idToken } = req.body
        const { email, email_verified } = await verifyGoogleAccount({ idToken })
        if (!email_verified) {
            return next(new Error("not verified account", { cause: 404 }))
        }
        const user = await DBService.findOne({
            model: UserModel,
            filter: { email, provider: providerEnum.google }
        })

        if (!user) {
            return next(new Error("In-valid login data or in-valid provider", { cause: 404 }))
        }

        const credentials = await generateLoginCredentials({ user })

        return successResponse({ res, status: 200, data: { credentials } })

    }
)
