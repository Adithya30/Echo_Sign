from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import SignUpView, UserProfileView, UserListView, UpdateRoleView

urlpatterns = [
    path('signup/', SignUpView.as_view(), name='auth_signup'),
    path('login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('list/', UserListView.as_view(), name='user_list'),
    path('role-update/<uuid:id>/', UpdateRoleView.as_view(), name='user_role_update'),
]
