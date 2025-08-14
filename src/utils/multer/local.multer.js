import fs from "node:fs"
import path from "node:path"
import multer from "multer"

export const fileValidation = {
    image: ['image/jpeg', 'image/png'],
    document: ['application/pdf', 'application/msword']
}

export const localFileUpload = ({ customePath = "general", validation = [], maxSizeMB = 2 } = {}) => {

    const storage = multer.diskStorage({
        destination: function (req, file, callback) {
            let basePath = `uploads/${customePath}`
            if (req.user?._id) {
                basePath += `/${req.user._id}`
            }
            const fullPath = path.resolve(`./src/${basePath}`)
            if (!fs.existsSync(fullPath)) {
                fs.mkdirSync(fullPath, { recursive: true })
            }
            req.basePath = basePath
            return callback(null, path.resolve(fullPath))
        },
        filename: function (req, file, callback) {

            const uniqueFileName = Date.now() + "__" + Math.random() + "__" + file.originalname
            file.finalPath = req.basePath + "/" + uniqueFileName
            return callback(null, uniqueFileName)
        }
    })

    const fileFilter = function (req, file, callback) {
        if (validation.includes(file.mimetype)) {
            return callback(null, true)
        }
        return callback("In-valid file format", false)
    }
    return multer({
        dest: "./temp",
        fileFilter,
        storage,
        limits: {
            fileSize: maxSizeMB * 1024 * 1024
        }
    })
}