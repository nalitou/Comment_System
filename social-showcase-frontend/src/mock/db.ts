import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type {
  AITask,
  Comment,
  FileRecord,
  FriendRequest,
  Friendship,
  Post,
  Rating,
  TokenRecord,
  User,
  VideoJob,
} from '../types/models'

interface SocialDB extends DBSchema {
  users: {
    key: string
    value: User
    indexes: { 'by-phone': string; 'by-role': string }
  }
  tokens: { key: string; value: TokenRecord }
  smsCodes: { key: string; value: { phone: string; code: string; createdAt: number } }
  posts: { key: string; value: Post; indexes: { 'by-author': string; 'by-createdAt': number } }
  comments: {
    key: string
    value: Comment
    indexes: { 'by-post': string; 'by-createdAt': number }
  }
  ratings: { key: string; value: Rating; indexes: { 'by-post': string } }
  friendRequests: {
    key: string
    value: FriendRequest
    indexes: { 'by-to': string; 'by-from': string; 'by-status': string }
  }
  friendships: { key: string; value: Friendship; indexes: { 'by-userA': string; 'by-userB': string } }
  files: { key: string; value: FileRecord }
  videoJobs: { key: string; value: VideoJob }
  aiTasks: { key: string; value: AITask }
  sensitiveWords: { key: string; value: { id: string; word: string } }
}

let _db: IDBPDatabase<SocialDB> | null = null

export async function getDB() {
  if (_db) return _db
  _db = await openDB<SocialDB>('social_showcase_db', 1, {
    upgrade(db) {
      const users = db.createObjectStore('users', { keyPath: 'id' })
      users.createIndex('by-phone', 'phone', { unique: true })
      users.createIndex('by-role', 'role')

      db.createObjectStore('tokens', { keyPath: 'token' })
      db.createObjectStore('smsCodes', { keyPath: 'phone' })

      const posts = db.createObjectStore('posts', { keyPath: 'id' })
      posts.createIndex('by-author', 'authorId')
      posts.createIndex('by-createdAt', 'createdAt')

      const comments = db.createObjectStore('comments', { keyPath: 'id' })
      comments.createIndex('by-post', 'postId')
      comments.createIndex('by-createdAt', 'createdAt')

      const ratings = db.createObjectStore('ratings', { keyPath: 'id' })
      ratings.createIndex('by-post', 'postId')

      const fr = db.createObjectStore('friendRequests', { keyPath: 'id' })
      fr.createIndex('by-to', 'toUserId')
      fr.createIndex('by-from', 'fromUserId')
      fr.createIndex('by-status', 'status')

      const fs = db.createObjectStore('friendships', { keyPath: 'id' })
      fs.createIndex('by-userA', 'userA')
      fs.createIndex('by-userB', 'userB')

      db.createObjectStore('files', { keyPath: 'id' })
      db.createObjectStore('videoJobs', { keyPath: 'id' })
      db.createObjectStore('aiTasks', { keyPath: 'id' })
      db.createObjectStore('sensitiveWords', { keyPath: 'id' })
    },
  })
  return _db
}



