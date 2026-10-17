require('dotenv').config();
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const User = require('../Models/User');
const Token = require('../UTIL/Token');

const mailError = require('../Errors/Email');

const notification = require('../Socket/Notification');

const transporter = nodemailer.createTransport({
    service : 'gmail' , 
    pool : true , 
    auth : {
        user : process.env.EMAIL_USER , 
        pass : process.env.EMAIL_PASSWORD
    }
});

async function SendVerification(email , token) {
    const link = `${process.env.BASE_URL}/auth/verify-Email?token=${token}`;
    return transporter.sendMail({
        from : process.env.EMAIL_USER , 
        to : email , 
        subject : "Verify your email" , 
        html : `
            <h2>Welcome to Home!</h2>
            <p>Please click the link below to verify your email:</p>
            <a href="${link}">Verify Email</a>
            <p>This link expires in 15 minutes.</p>
        `
    });
}

async function verifyEmail(token) {
    if (!token || typeof token !== 'string') {
        return {
            error : 'Invalid verification link'
        };
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');;
    const user = await User.findOne({
        where : {
            verificationToken : hashedToken
        }
    });
    
    if (!user) return {
        status_code : mailError.EmailNotFoundError.defaultStatusCode , 
        error : mailError.EmailNotFoundError.defaultMessage
    };

    if (!user.verificationToken) return {
        status_code : mailError.EmailAlreadyInUseError.defaultStatusCode , 
        error : mailError.EmailAlreadyInUseError.defaultMessage
    };

    if (user.verificationExpire <= new Date()) {
        return {
            status_code : mailError.EmailVerificationExpiredError.defaultStatusCode , 
            error : mailError.EmailVerificationExpiredError.defaultMessage
        };
    }

    await user.update({
        isVerified : true , 
        verificationToken : null , 
        verificationExpire : null
    });
    
    notification.SendMessage('email-verified' , {action : 'Email Verified' , userId : user.id});

    return {message : `User ${user.id} xax tuc email thanh cong`};
}

module.exports = {
    SendVerification,
    verifyEmail
};