import { ENDPOINTS } from '../endpoints'
import { http } from '../http'
import { isMock } from '../runtime'
import { mockFriends } from '../../mock/api'

export const friendsApi = {
  searchUsers: (q: string) => (isMock() ? mockFriends.searchUsers(q) : http(`${ENDPOINTS.friends.users}?q=${encodeURIComponent(q)}`)),
  listFriends: () => (isMock() ? mockFriends.listFriends() : http(ENDPOINTS.friends.list)),
  sendRequest: (toUserId: string) =>
    isMock() ? mockFriends.sendFriendRequest(toUserId) : http(ENDPOINTS.friends.request, { method: 'POST', body: JSON.stringify({ toUserId }) }),
  listRequests: () => (isMock() ? mockFriends.listFriendRequests() : http(ENDPOINTS.friends.requests)),
  accept: (id: string) => (isMock() ? mockFriends.acceptFriendRequest(id) : http(ENDPOINTS.friends.accept(id), { method: 'POST' })),
  reject: (id: string) => (isMock() ? mockFriends.rejectFriendRequest(id) : http(ENDPOINTS.friends.reject(id), { method: 'POST' })),
  remove: (friendUserId: string) => (isMock() ? mockFriends.removeFriend(friendUserId) : http(ENDPOINTS.friends.remove(friendUserId), { method: 'DELETE' })),
  getUser: (id: string) => (isMock() ? mockFriends.getUserById(id) : http(`/users/${id}`)),
}
