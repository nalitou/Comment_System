import process from 'node:process'

export const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me',
  tokenExpiresIn: '7d',
  admin: {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    phone: process.env.ADMIN_PHONE || '19900000000',
    nickname: '管理员',
  },
  superUser: {
    phone: process.env.SUPER_PHONE || '18800000000',
    smsCode: process.env.SUPER_SMS_CODE || '000000',
    password: process.env.SUPER_PASSWORD || 'Admin@123',
    nickname: '超级用户',
  },
}
