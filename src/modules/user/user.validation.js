import joi from 'joi'
import { generalFields } from '../../middleware/validation.middleware.js'
import { logoutEnum } from '../../utils/security/token.security.js'
import { fileValidation } from '../../utils/multer/local.multer.js'
export const shareProfile = {
    params: joi.object().keys({
        userId: generalFields.id.required()
    })
}

export const logout = {
    body: joi.object().keys({
        flag: joi.string().valid(...Object.values(logoutEnum)).default(logoutEnum.stayLoggedIn)
    })
}

export const updateBasicInfo = {
    body: joi.object().keys({
        fullName: generalFields.fullName,
        phone: generalFields.phone,
        gender: generalFields.gender
    }).required()
}

export const updatePassword = {
    body: logout.body.append({
        oldPassword: generalFields.password.required(),
        password: generalFields.password.not(joi.ref("oldPassword")).required(),
        confirmPassword: generalFields.confirmPassword.required()
    }).required()
}


export const profileImage = {
    file: joi.object().keys({
        fieldname: generalFields.file.fieldname.valid("image").required(),
        originalname: generalFields.file.originalname,
        encoding: generalFields.file.encoding,
        mimetype: generalFields.file.mimetype.valid(...fileValidation.image).required(),
        //finalPath: generalFields.file.finalPath,
        destination: generalFields.file.destination,
        filename: generalFields.file.filename,
        path: generalFields.file.path,
        size: generalFields.file.size,
    }).required()
}

export const coverImages = {
    files: joi.array().items(joi.object().keys({
        fieldname: generalFields.file.fieldname.valid("images").required(),
        originalname: generalFields.file.originalname,
        encoding: generalFields.file.encoding,
        mimetype: generalFields.file.mimetype.valid(...Object.values(fileValidation.image)).required(),
        //finalPath: generalFields.file.finalPath,
        destination: generalFields.file.destination,
        filename: generalFields.file.filename,
        path: generalFields.file.path,
        size: generalFields.file.size,
    }).required()
    ).min(1).max(2).required()
}


export const freezeAccount = {
    params: joi.object().keys({
        userId: generalFields.id
    })
}

export const restoreAccount = {
    params: joi.object().keys({
        userId: generalFields.id.required()
    })
}

export const deleteAccount = {
    params: joi.object().keys({
        userId: generalFields.id.required()
    })
}