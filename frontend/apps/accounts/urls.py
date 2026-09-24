from django.urls import path
from . import views

urlpatterns = [
    path('',views.index,name='index'),
    path('signup/', views.signup, name='signup'),
    path('login/', views.login, name='login'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('check_email/',views.check_email,name='check_email'),
    path('email_verified/',views.email_verified,name='email_verified'),
    path('verification_fail/',views.varification_failed,name='verification_failed'),
    path('history/',views.history_page,name='history_page'),
    path('analytics/',views.analytics_view,name='analytics'),
    path('prompt-analysis/',views.prompt_analysis_view,name='prompt-analysis'),
    path('comparison/',views.comparison_view,name='comparison'),
    path('prompting_panel/',views.prompting_page,name='prompting_panel'),
]