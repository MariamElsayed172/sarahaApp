import { asyncHandler, successResponse } from "../../utils/response.js"
import * as DBService from '../../DB/db.service.js'
import { UserModel } from "../../DB/models/user.model.js"
import { uploadFiles } from "../../utils/multer/cloudinary.js"
import { MessageModel } from "../../DB/models/message.model.js"
export const sendMessage = asyncHandler(
    async (req, res, next) => {
        if(!req.body.content && !req.files){
            return next(new Error("message content is required"))
        }
        const { receiverId } = req.params
        if (! await DBService.findOne({
            model: UserModel,
            filter: {
                _id: receiverId,
                deletedAt: { $exists: false },
                confirmEmail: { $exists: true }
            }
        })) {
            return next(new Error("In-valid recipient account", {cause:404}))
        }
        const {content} = req.body;
        let attachments=[]
        if(req.files){
            attachments = await uploadFiles({files:req.files, path:`messages/${receiverId}`})
        }
        const [message] = await DBService.create({
            model:MessageModel,
            data:[{
                content,
                attachments,
                receiverId,
                senderId:req.user?._id
            }]
        })
        return successResponse({ res, status: 201, data:{message} })
    }
)