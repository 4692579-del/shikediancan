'use strict'

const db = uniCloud.database()
const users = db.collection('sk_users')

function publicUser(user) {
  return {
    uid: user._id,
    accountId: `cloud:${user._id}`,
    username: user.username,
    nickname: user.nickname || user.username,
    phone: user.phone || '',
    avatar: user.avatar || '/static/assets/icons/smile.svg'
  }
}

exports.main = async (event = {}) => {
  const action = event.action
  const uid = String(event.uid || '').trim()

  if (!uid) return { code: 401, message: '\u8bf7\u5148\u767b\u5f55' }

  const userResult = await users.doc(uid).get()
  const user = userResult.data && userResult.data[0]
  if (!user) return { code: 404, message: '\u7528\u6237\u4e0d\u5b58\u5728' }

  if (action === 'get') {
    return { code: 0, user: publicUser(user) }
  }

  if (action === 'updateAvatar') {
    const avatar = String(event.avatar || '').trim()
    if (!avatar) return { code: 1001, message: '\u5934\u50cf\u4e0a\u4f20\u5931\u8d25' }

    // 头像支持两类来源：
    // 1. 本项目当前 H5 预览使用的 base64 图片数据；
    // 2. 后续如接入云存储后返回的 http/https/cloud 地址。
    // 这里做基础格式与大小校验，避免异常内容写入用户资料。
    const isImageData = /^data:image\/(png|jpe?g|webp);base64,/i.test(avatar)
    const isRemoteImage = /^(https?:\/\/|cloud:\/\/|\/static\/)/i.test(avatar)
    if (!isImageData && !isRemoteImage) {
      return { code: 1002, message: '\u5934\u50cf\u683c\u5f0f\u4e0d\u6b63\u786e' }
    }
    if (isImageData && avatar.length > 900 * 1024) {
      return { code: 1003, message: '\u5934\u50cf\u56fe\u7247\u8fc7\u5927' }
    }

    await users.doc(uid).update({
      avatar,
      updatedAt: Date.now()
    })
    return {
      code: 0,
      message: '\u5934\u50cf\u5df2\u66f4\u65b0',
      user: publicUser({ ...user, avatar })
    }
  }

  return { code: -1, message: '\u975e\u6cd5\u64cd\u4f5c' }
}
