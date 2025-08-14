import { Types } from "mongoose"
import { asyncHandler } from "../utils/response.js"
import joi from 'joi'
import { genderEnum } from "../DB/models/user.model.js"
export const generalFields = {
    email: joi.string().email({ minDomainSegments: 2, maxDomainSegments: 3, tlds: { allow: ['net', 'com'] } }),
    fullName: joi.string().min(2).max(20).messages({
        "string.min": "min name length is 2 char",
        "any.required": "fullName is mandatory",
    }),
    phone: joi.string().pattern(new RegExp(/^(002|\+2)?01[0125][0-9]{8}$/)),
    confirmPassword: joi.string().valid(joi.ref("password")),
    password: joi.string().pattern(new RegExp(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)),
    otp: joi.string().pattern(new RegExp(/^\d{6}$/)),
    gender: joi.string().valid(...Object.values(genderEnum)),
    id: joi.string().custom((value, helper) => {
        return Types.ObjectId.isValid(value) || helper.message("In-valid objectId")
    }),
    file: {
        fieldname: joi.string().required(),
        originalname: joi.string().required(),
        encoding: joi.string().required(),
        mimetype: joi.string().required(),
        finalPath: joi.string().required(),
        destination: joi.string().required(),
        filename: joi.string().required(),
        path: joi.string().required(),
        size: joi.number().positive().required(),
    },

}

export const validation = (schema) => {
    return asyncHandler(
        async (req, res, next) => {
            const validationErrors = []
            for (const key of Object.keys(schema)) {
                const validationResult = schema[key].validate(req[key], { abortEarly: false })
                if (validationResult.error) {
                    validationErrors.push(validationResult.error?.details.map(ele => {
                        return { message: ele.message, path: ele.path[0] }
                    }))
                }
            }
            if (validationErrors.length) {
                return res.status(400).json({ err_messages: "validation error", error: validationErrors })
            }

            return next()
        }
    )
}