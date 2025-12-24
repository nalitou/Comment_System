import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { RequireAuth } from './RequireAuth'
import { RequireAdmin } from './RequireAdmin'
import { UserLayout } from '../layouts/UserLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { RegisterPage } from '../pages/auth/RegisterPage'
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage'
import { FeedPage } from '../pages/feed/FeedPage'
import { PostCreatePage } from '../pages/post/PostCreatePage'
import { PostDetailPage } from '../pages/post/PostDetailPage'
import { PostEditPage } from '../pages/post/PostEditPage'
import { MyPostsPage } from '../pages/post/MyPostsPage'
import { SearchPage } from '../pages/search/SearchPage'
import { ProfilePage } from '../pages/profile/ProfilePage'
import { FriendsPage } from '../pages/friends/FriendsPage'
import { FriendRequestsPage } from '../pages/friends/FriendRequestsPage'
import { UserSearchPage } from '../pages/friends/UserSearchPage'
import { AdminLoginPage } from '../pages/admin/AdminLoginPage'
import { AdminUsersPage } from '../pages/admin/AdminUsersPage'
import { AdminPostsPage } from '../pages/admin/AdminPostsPage'
import { AdminStatsPage } from '../pages/admin/AdminStatsPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <UserLayout />
            </RequireAuth>
          }
        >
          <Route index element={<FeedPage />} />
          <Route path="post/new" element={<PostCreatePage />} />
          <Route path="post/:id" element={<PostDetailPage />} />
          <Route path="post/:id/edit" element={<PostEditPage />} />
          <Route path="me" element={<ProfilePage />} />
          <Route path="me/posts" element={<MyPostsPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="friends" element={<FriendsPage />} />
          <Route path="friends/requests" element={<FriendRequestsPage />} />
          <Route path="users" element={<UserSearchPage />} />
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminStatsPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="posts" element={<AdminPostsPage />} />
          <Route path="stats" element={<AdminStatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
