from django.shortcuts import redirect

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny

from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import (
    urlsafe_base64_encode,
    urlsafe_base64_decode
)
from django.utils.encoding import force_bytes

from django.core.mail import EmailMultiAlternatives
from django.conf import settings

from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import RegisterSerializer, LoginSerializer


class TestAPIView(APIView):

    permission_classes = [AllowAny]

    def get(self, request):
        return Response({
            "message": "Hello, this is a test API."
        })


class RegisterAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.save()

            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)

            verification_link = (
                f"http://127.0.0.1:8000/api/verify-email/{uid}/{token}/"
            )

            subject = "Verify Your Email"

            text_content = f"""
            Hi {user.username},

            Thanks for creating your AI Token Optimizer account.

            Verify your email to activate it:
            {verification_link}

            This link expires shortly, so please use it soon.

            If you didn't create this account, you can safely ignore this email.

            — AI Token Optimizer
            """

            html_content = f"""\
            <!DOCTYPE html>
            <html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
            <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <title>Verify your email</title>
            <!--[if mso]>
            <style>
                table {{ border-collapse: collapse; }}
                .fallback-font {{ font-family: Arial, sans-serif; }}
            </style>
            <![endif]-->
            </head>
            <body style="margin:0; padding:0; background-color:#f2f4f8;">

                <!-- preheader (hidden preview text) -->
                <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
                    Confirm your email to finish setting up AI Token Optimizer.
                </div>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f2f4f8;">
                    <tr>
                        <td align="center" style="padding:40px 16px;">

                            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
                                style="max-width:600px; width:100%; background-color:#ffffff; border-radius:14px; overflow:hidden; box-shadow:0 4px 20px rgba(15,23,42,0.06);">

                                <!-- brand header band -->
                                <tr>
                                    <td style="background-color:#0f1420; padding:22px 32px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-family:Arial,Helvetica,sans-serif; font-size:16px; font-weight:bold; color:#ffffff;">
                                                    AI Token&nbsp;<span style="color:#8b8cf6;">Optimizer</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- body -->
                                <tr>
                                    <td style="padding:40px 40px 32px;">

                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-family:Arial,Helvetica,sans-serif; font-size:21px; font-weight:bold; color:#0f172a; padding-bottom:14px;">
                                                    Confirm your email address
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#475569; padding-bottom:8px;">
                                                    Hi <strong style="color:#0f172a;">{user.username}</strong>,
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="font-family:Arial,Helvetica,sans-serif; font-size:15px; line-height:24px; color:#475569; padding-bottom:28px;">
                                                    Thanks for creating your account. Click the button below to verify
                                                    your email and activate it.
                                                </td>
                                            </tr>

                                            <!-- bulletproof button -->
                                            <tr>
                                                <td align="center" style="padding-bottom:28px;">
                                                    <!--[if mso]>
                                                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{verification_link}"
                                                        style="height:48px;v-text-anchor:middle;width:220px;" arcsize="12%"
                                                        strokecolor="#6366f1" fillcolor="#6366f1">
                                                    <w:anchorlock/>
                                                    <center style="color:#ffffff;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">
                                                        Verify Email
                                                    </center>
                                                    </v:roundrect>
                                                    <![endif]-->
                                                    <!--[if !mso]><!-->
                                                    <a href="{verification_link}"
                                                    style="display:inline-block; padding:14px 32px; background-color:#6366f1;
                                                            background-image:linear-gradient(90deg,#7c6cf6,#6366f1);
                                                            color:#ffffff !important; font-family:Arial,Helvetica,sans-serif;
                                                            font-size:15px; font-weight:bold; text-decoration:none;
                                                            border-radius:10px; mso-hide:all;">
                                                        Verify Email
                                                    </a>
                                                    <!--<![endif]-->
                                                </td>
                                            </tr>

                                           
                                        </table>

                                    </td>
                                </tr>

                                <!-- divider -->
                                <tr>
                                    <td style="padding:0 40px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="border-top:1px solid #e6e8ef; font-size:0; line-height:0;">&nbsp;</td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                                <!-- footer -->
                                <tr>
                                    <td style="padding:24px 40px 32px;">
                                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                            <tr>
                                                <td style="font-family:Arial,Helvetica,sans-serif; font-size:12.5px; line-height:19px; color:#94a3b8;">
                                                    If you didn't create this account, you can safely ignore this email —
                                                    no changes will be made.
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>

                            </table>

                            <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; width:100%;">
                                <tr>
                                    <td align="center" style="font-family:Arial,Helvetica,sans-serif; font-size:12px; color:#a3aab8; padding:20px 12px 0;">
                                        &copy; {2026} AI Token Optimizer. All rights reserved.
                                    </td>
                                </tr>
                            </table>

                        </td>
                    </tr>
                </table>

            </body>
            </html>
            """

            email = EmailMultiAlternatives(
                subject,
                text_content,
                settings.DEFAULT_FROM_EMAIL,
                [user.email]
            )

            email.attach_alternative(html_content, "text/html")
            email.send()

            return Response(
                {
                    "message": "Registration successful. Please check your email."
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class VerifyEmailAPIView(APIView):

    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):

        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)

        except Exception:
            return redirect("verification_failed")

        if default_token_generator.check_token(user, token):

            user.is_active = True
            user.save()

            return redirect("email_verified")

        return redirect("verification_failed")


class LoginAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        serializer = LoginSerializer(data=request.data)

        if serializer.is_valid():

            user = serializer.validated_data["user"]

            if not user.is_active:
                return Response(
                    {
                        "message": "Please verify your email before logging in."
                    },
                    status=status.HTTP_403_FORBIDDEN
                )

            refresh = RefreshToken.for_user(user)

            return Response(
                {
                    "message": "Login Successful",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "username": user.username,
                    "email": user.email
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "message": serializer.errors.get("message", ["Login Failed"])[0]
            },
            status=status.HTTP_400_BAD_REQUEST
        )