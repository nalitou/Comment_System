// 后端接口占位：所有真实后端实现建议按这里的路径对齐。
// 前端调用统一从 `src/services/api/*` 进入。

export const ENDPOINTS = {
  auth: {
    smsSend: '/auth/sms/send',
    register: '/auth/register',
    loginSms: '/auth/login/sms',
    loginPassword: '/auth/login/password',
    passwordReset: '/auth/password/reset',
    me: '/me',
  },
  posts: {
    list: '/posts',
    create: '/posts',
    detail: (id: string) => `/posts/${id}`,
    update: (id: string) => `/posts/${id}`,
    remove: (id: string) => `/posts/${id}`,
    tags: '/tags',
    search: '/search',
  },
  comments: {
    list: (postId: string) => `/posts/${postId}/comments`,
    create: (postId: string) => `/posts/${postId}/comments`,
    remove: (id: string) => `/comments/${id}`,
  },
  rating: {
    upsert: (postId: string) => `/posts/${postId}/rating`,
    summary: (postId: string) => `/posts/${postId}/rating/summary`,
  },
  friends: {
    users: '/users',
    request: '/friends/request',
    requests: '/friends/requests',
    accept: (id: string) => `/friends/requests/${id}/accept`,
    reject: (id: string) => `/friends/requests/${id}/reject`,
    list: '/friends',
    remove: (friendUserId: string) => `/friends/${friendUserId}`,
  },
  moderation: {
    sensitiveWords: '/moderation/sensitive-words',
    text: '/moderation/text',
  },
  upload: {
    init: '/upload/init',
    chunk: '/upload/chunk',
    complete: '/upload/complete',
  },
  video: {
    jobCreate: '/video/job/create',
    jobStatus: '/video/job/status',
  },
  ai: {
    process: '/ai/process',
    task: (id: string) => `/ai/task/${id}`,
  },
  admin: {
    login: '/admin/login',
    users: '/admin/users',
    removeUser: (id: string) => `/admin/users/${id}`,
    posts: '/admin/posts',
    removePost: (id: string) => `/admin/posts/${id}`,
    stats: {
      active: '/admin/stats/active',
      postsTrend: '/admin/stats/posts-trend',
      typeRatio: '/admin/stats/type-ratio',
      topTags: '/admin/stats/top-tags',
    },
  },
}
