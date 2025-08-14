
import multer from "multer"

export const fileValidation = {
    image: ['image/jpeg', 'image/png'],
    document: ['application/pdf', 'application/msword']
}

export const cloudFileUpload = ({  validation = [], maxSizeMB = 2 } = {}) => {

    const storage = multer.diskStorage({})

    const fileFilter = function (req, file, callback) {
        if (validation.includes(file.mimetype)) {
            return callback(null, true)
        }
        return callback("In-valid file format", false)
    }
    return multer({
        fileFilter,
        storage,
        limits: {
            fileSize: maxSizeMB * 1024 * 1024
        }
    })
}