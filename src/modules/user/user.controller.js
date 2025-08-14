import { Router } from "express";
import { roleEnum } from "../../DB/models/user.model.js";
import { auth, authentication } from "../../middleware/authentication.middleware.js";
import { validation } from "../../middleware/validation.middleware.js";
import { cloudFileUpload } from "../../utils/multer/cloud.multer.js";
import { fileValidation } from "../../utils/multer/local.multer.js";
import * as userService from "./user.service.js";
import * as validators from "./user.validation.js";
const router = Router();

router.post("/logout",authentication(),validation(validators.logout),userService.logout)
router.get("/",authentication(), userService.profile)
router.get("/:userId",validation(validators.shareProfile), userService.shareProfile)
router.patch("/",authentication(),validation(validators.updateBasicInfo),userService.updateBasicInfo)
router.patch("/update-password",authentication(),validation(validators.updatePassword),userService.updatePassword)
router.patch("/profile-image",authentication(),cloudFileUpload({ validation:fileValidation.image, maxSizeMB:3}).single("image"),validation(validators.profileImage),userService.profileImage)
router.patch("/profileCover-images",authentication(),cloudFileUpload({ validation:fileValidation.image}).array("images", 2),validation(validators.coverImages),userService.profileCoverImages)
router.delete("{/:userId}/freeze-account",authentication(),validation(validators.freezeAccount),userService.freezeAccount)
router.patch("/:userId/restore-account",auth({accessRoles:roleEnum.admin}),validation(validators.restoreAccount),userService.restoreAccount)
router.delete("/:userId",auth({accessRoles:roleEnum.admin}),validation(validators.deleteAccount),userService.deleteAccount)
export default router