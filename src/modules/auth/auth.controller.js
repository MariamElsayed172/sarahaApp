import * as authService from "./auth.service.js"
import { authentication } from "../../middleware/authentication.middleware.js";
import {Router} from 'express'
import { tokenTypeEnum } from "../../utils/security/token.security.js";
import * as validators from './auth.validation.js'
import { validation } from "../../middleware/validation.middleware.js";
const router = Router();

router.post("/signup" ,validation(validators.signup), authService.signup)
router.patch("/confirm-email",validation(validators.confirmEmail), authService.confirmEmail)
router.post("/resend-confirm-email",validation(validators.resendConfirmEmailOtp), authService.resendConfirmEmailOtp);
router.post("/login" ,validation(validators.login), authService.login)
router.patch("/send-forgot-password" ,validation(validators.sendForgotPassword), authService.sendForgotPassword)
router.patch("/verify-forgot-password" ,validation(validators.verifyForgotPassword), authService.verifyForgotPassword)
router.patch("/reset-forgot-password" ,validation(validators.resetPassword), authService.resetPassword)
router.post("/refresh", authentication({tokenType:tokenTypeEnum.refresh}),authService.getNewLoginCredentials)
router.post("/signup/gmail" ,validation(validators.loginWithGmail), authService.signupWithGmail)
router.post("/login/gmail" ,validation(validators.loginWithGmail), authService.loginWithGmail)
export default router