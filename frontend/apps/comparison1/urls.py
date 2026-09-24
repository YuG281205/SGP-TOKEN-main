from django.urls import path

from .views import ComparisonHistoryAPIView

urlpatterns = [

    path(
        "comparison/",
        ComparisonHistoryAPIView.as_view(),
        name="comparison-history",
    ),

]