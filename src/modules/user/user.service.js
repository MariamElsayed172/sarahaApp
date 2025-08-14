import { asyncHandler, successResponse } from "../../utils/response.js";
import * as DBService from "../../DB/db.service.js"
import { roleEnum, UserModel } from "../../DB/models/user.model.js";
import { decryptEncryption, generateEncryption } from "../../utils/security/encryption.security.js";
import { compareHash, generateHash } from "../../utils/security/hash.security.js";
import { createRevokeToken, logoutEnum } from "../../utils/security/token.security.js";
import { deleteFolderByPrefix, deleteResources, destroyFile, uploadFile, uploadFiles } from "../../utils/multer/cloudinary.js";

export const profile = asyncHandler(async (req, res, next) => {
    const user = await DBService.findById({
        model:UserModel,
        id:req.user._id,
        populate:[{path:"messages"}]
    })
    user.phone = await decryptEncryption({ cipherText: user.phone })
    return successResponse({ res, data: { user } })
})

export const logout = asyncHandler(async (req, res, next) => {
    const { flag } = req.body
    let status = 200
    switch (flag) {
        case logoutEnum.signoutFromAll:
            await DBService.updateOne({
                model: UserModel,
                filter: { _id: req.decoded._id },
                data: {
                    changeCredentialsTime: new Date()
                }
            })
            break;
        default:
            await createRevokeToken({ req })
            status = 201
            break;
    }
    return successResponse({ res, status, data: {} })
})

export const shareProfile = asyncHandler(async (req, res, next) => {
    const { userId } = req.params;
    const user = await DBService.findOne({
        model: UserModel,
        filter: {
            _id: userId,
            confirmEmail: { $exists: true }
        }
    })
    //user.phone = await decryptEncryption({cipherText:user.phone})
    return user ? successResponse({ res, data: { user } }) : next(new Error("In-valid account", { cause: 404 }))
})

export const updateBasicInfo = asyncHandler(async (req, res, next) => {
    if (req.body.phone) {
        req.body.phone = await generateEncryption({ plainText: req.body.phone })
    }
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: req.user._id
        },
        data: req.body
    })
    //user.phone = await decryptEncryption({cipherText:user.phone})
    return user ? successResponse({ res, data: { user } }) : next(new Error("In-valid account", { cause: 404 }))
})

export const freezeAccount = asyncHandler(async (req, res, next) => {
    const { userId } = req.params
    if (userId && req.user.role !== roleEnum.admin) {
        return next(new Error("Not authorized account", { cause: 403 }))
    }
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: userId || req.user._id,
            deletedBy: { $exists: false }
        },
        data: {
            deletedAt: Date.now(),
            deletedBy: req.user._id,
            changeCredentialsTime: new Date(),
            $unset: {
                restoreAt: 1,
                restoreBy: 1
            }
        }
    })
    //user.phone = await decryptEncryption({cipherText:user.phone})
    return user ? successResponse({ res, data: { user } }) : next(new Error("In-valid account", { cause: 404 }))
})

export const restoreAccount = asyncHandler(async (req, res, next) => {
    const { userId } = req.params
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: {
            _id: userId,
            deletedAt: { $exists: true },
            deletedBy: { $ne: userId }
        },
        data: {
            $unset: {
                deletedAt: 1,
                deletedBy: 1
            },
            restoreAt: Date.now(),
            restoreBy: req.user._id
        }
    })
    //user.phone = await decryptEncryption({cipherText:user.phone})
    return user ? successResponse({ res, data: { user } }) : next(new Error("In-valid account", { cause: 404 }))
})

export const deleteAccount = asyncHandler(async (req, res, next) => {
    const { userId } = req.params

    const user = await DBService.deleteOne({
        model: UserModel,
        filter: {
            _id: userId,
            deletedAt: { $exists: true }
        },
    })
    if(user.deletedCount){
        await deleteFolderByPrefix({prefix:`user/${userId}`})
    }
    //user.phone = await decryptEncryption({cipherText:user.phone})
    return user.deletedCount ? successResponse({ res, data: { user } }) : next(new Error("In-valid account", { cause: 404 }))
})

export const updatePassword = asyncHandler(async (req, res, next) => {
    const { oldPassword, password, flag } = req.body;


    const isMatch = await compareHash({ plainText: oldPassword, hashValue: req.user.password });

    if (!isMatch) {
        return next(new Error("Current password is incorrect", { cause: 400 }));
    }

    const hashedNewPassword = await generateHash({ plainText: password });


    let updatedData = {}

    switch (flag) {
        case logoutEnum.signoutFromAll:
            updatedData.changeCredentialsTime = new Date()
            break;
        case logoutEnum.signout:
            await createRevokeToken({ req })
            break;
        default:
            break;
    }
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: { _id: req.user._id },
        data: {
            password: hashedNewPassword,
            ...updatedData
        },
        select: "-password"
    });

    return successResponse({ res, data: { user } })
});

export const profileImage = asyncHandler(async (req, res, next) => {
    const { secure_url, public_id } = await uploadFile({ file: req.file, path: `user/${req.user._id}` })
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: { _id: req.user._id },
        data: {
            picture: { secure_url, public_id }
        },
        options: {
            new: false
        }
    })
    if (user?.picture?.public_id) {
        await destroyFile({ public_id: user.picture.public_id })
    }
    return successResponse({ res, data: { user } })
});

export const profileCoverImages = asyncHandler(async (req, res, next) => {
    const attachments = await uploadFiles({ files: req.files, path: `user/${req.user._id}/cover` })
    const user = await DBService.findOneAndUpdate({
        model: UserModel,
        filter: { _id: req.user._id },
        data: {
            coverImages: attachments
        },
        options:{
            new:false
        }
    })
    if (user?.coverImages?.length) {
        await deleteResources({
            public_ids: user.coverImages.map(ele => ele.public_id)
        })
    }
    return successResponse({ res, data: { user } })
});