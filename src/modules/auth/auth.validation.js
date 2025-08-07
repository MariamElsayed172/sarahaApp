import joi from 'joi'
import { generalFields } from '../../middleware/validation.middleware.js'

export const login = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        password: generalFields.password.required()
    }).required().options({ allowUnknown: false })
}

export const signup = {
    body: login.body.append({
        fullName: generalFields.fullName.required(),
        phone: generalFields.phone.required(),
        confirmPassword: generalFields.confirmPassword.required(),
    }).required().options({ allowUnknown: false }),

    query: joi.object().keys({
        lang: joi.string().valid("ar", "en").required()
    }).required()
}

export const confirmEmail = {
    body: joi.object().keys({
        email: generalFields.email.required(),
        otp: generalFields.otp.required()
    }).required().options({ allowUnknown: false })
}

export const loginWithGmail = {
    body: joi.object().keys({
        idToken: joi.string().required(),
    }).required().options({ allowUnknown: false })
}

export const resendConfirmEmailOtp = {
    body: joi.object().keys({
        otp: generalFields.otp.required(),
    }).required().options({ allowUnknown: false })
}

export const sendForgotPassword = {
    body: joi.object().keys({
        email: generalFields.email.required()
    })
}

export const verifyForgotPassword = {
    body: sendForgotPassword.body.append({
        otp: generalFields.otp.required()
    })
}

export const resetPassword = {
    body: verifyForgotPassword.body.append({
        password: generalFields.password.required(),
        confirmPassword: generalFields.confirmPassword.required()
    })
}
