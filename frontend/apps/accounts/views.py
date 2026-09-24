from django.shortcuts import render
from ..optimizer.analytics.overview import get_overview_statistics
from django.contrib.auth.decorators import login_required

from apps.optimizer.analytics.overview import (
    get_overview_statistics,
)

def signup(request):
    return render(request, "accounts/signup.html")


def login(request):
    return render(request, "accounts/login.html")


def dashboard(request):
    return render(request, "accounts/dashboard.html")

def check_email(request):
    return render(request,"accounts/check_email.html")

def email_verified(request):
    return render(request,"accounts/email_verified.html")

def varification_failed(request):
    return render(request,"accounts/verification_fail.html")


def history_page(request):
    return render(request, "accounts/history.html")


def analytics_view(request):
    """
    Analytics Dashboard
    """
    return render(
        request,
        "accounts/analytics.html",
    )

def prompt_analysis_view(request):
    return render(request,"accounts/prompt_analysis.html")

def comparison_view(request):
    return render(request,"accounts/comparison.html")

def index(request):
    return render(request,"accounts/index.html")

def prompting_page(request):
    return render(request,"accounts/prompting_panel.html")