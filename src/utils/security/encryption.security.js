import CryptoJS from "crypto-js";
export const generateEncryption = async ({plainText = "", secretKey = process.env.ENCRYPTION_SECRET} = {}) => {
    return CryptoJS.AES.encrypt(plainText, secretKey).toString()
}

export const decryptEncryption = async ({cipherText = "", secretKey = process.env.ENCRYPTION_SECRET} = {}) => {
    return CryptoJS.AES.decrypt(cipherText, secretKey).toString(CryptoJS.enc.Utf8)
}