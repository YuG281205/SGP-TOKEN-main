from django.urls import path, include
from .views import TestAPIView,RegisterAPIView,VerifyEmailAPIView,LoginAPIView

urlpatterns = [
    path('test/', TestAPIView.as_view(), name='test_api'),
    path('register/',RegisterAPIView.as_view(),name='register_api'),
    path(
        "verify-email/<uidb64>/<token>/",
        VerifyEmailAPIView.as_view(),
        name="verify-email",
    ),
    path("login/", LoginAPIView.as_view(), name="api-login"),
    
]