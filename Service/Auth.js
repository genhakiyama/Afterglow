const User = require('../Models/User');
const brcrypt = require('bcrypt');
const crypto = require('crypto');

const authErr = require('../Errors/Authen');

const notification = require('../Socket/Notification');

const EmailService = require('./Email');
const Token = require('../UTIL/Token');
const { error } = require('console');

async function SignUp(email , username , password) {
        const existingUser = await User.findOne({
            where : {
                username : username
            }
        });
        if (existingUser) {   
            return {
                status_code : authErr.UserAlreadyExistsError.defaultStatusCode , 
                error : authErr.UserAlreadyExistsError.defaultMessage
            };
        }
        const hashedpassword = await brcrypt.hash(password , 12);
        const {token , hashedToken} = Token.TokenGeneration();
        await User.create({
            email , username , password : hashedpassword , 
            isVerified : false , 
            verificationToken : hashedToken,
            verificationExpire : new Date(Date.now() + 15 * 60 * 1000)
        });
        EmailService.SendVerification(email , token);
        return {
            message : 'Đăng kí thành công - Làm ơn check Email'
        }
}   

async function Login(email  , username , password){
    const user = await User.findOne({where : {email : email , username : username}});
    if (!user || !user.isVerified) {
        {
            return {
                status_code : authErr.UserNotFoundError.defaultStatusCode,
                error : authErr.UserNotFoundError.defaultMessage
            }
        }
    }

    if (await brcrypt.compare(password , user.password)) {
        notification.SendMessage('Server' , {action : `User ${user.id} đăng nhập vào hệ thống thành công` , username : user.username});
        return {
            message : `Chào mừng trở lại ${user.username}` , 
            userId : user.id
        };
    }

    return {
        status_code : authErr.InvalidCredentialsError.defaultStatusCode , 
        error : authErr.InvalidCredentialsError.defaultMessage
    }
}

module.exports = {
    SignUp  , 
    Login
}