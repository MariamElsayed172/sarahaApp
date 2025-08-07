import * as userService from "./user.service.js"
import {auth, authentication, authorization} from "../../middleware/authentication.middleware.js"
import {Router} from "express"
import { validation } from "../../middleware/validation.middleware.js";
import * as validators from "./user.validation.js"
import { roleEnum } from "../../DB/models/user.model.js";
const router = Router();

router.post("/logout",authentication(),validation(validators.logout),userService.logout)
router.get("/",authentication(), userService.profile)
router.get("/:userId",validation(validators.shareProfile), userService.shareProfile)
router.patch("/",authentication(),validation(validators.updateBasicInfo),userService.updateBasicInfo)
router.patch("/update-password",authentication(),validation(validators.updatePassword),userService.updatePassword)
router.delete("{/:userId}/freeze-account",authentication(),validation(validators.freezeAccount),userService.freezeAccount)
router.patch("/:userId/restore-account",auth({accessRoles:roleEnum.admin}),validation(validators.restoreAccount),userService.restoreAccount)
router.delete("/:userId",auth({accessRoles:roleEnum.admin}),validation(validators.deleteAccount),userService.deleteAccount)
export default router