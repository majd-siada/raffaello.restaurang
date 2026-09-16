from __future__ import annotations

from django.contrib.auth import authenticate, login, logout
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from .permissions import IsStaffUser, user_perm_flags


class OpsLoginThrottle(AnonRateThrottle):
    scope = 'ops_login'


class EnforceCSRFAuthentication(SessionAuthentication):
    """
    DRF SessionAuthentication only enforces CSRF when a session user exists.
    Login is anonymous — force CSRF check for the SPA cookie flow.
    """

    def authenticate(self, request):
        self.enforce_csrf(request)
        return None


@method_decorator(ensure_csrf_cookie, name='dispatch')
class CsrfView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request):
        return Response({'detail': 'CSRF cookie set'})


class LoginView(APIView):
    authentication_classes = [EnforceCSRFAuthentication]
    permission_classes: list = []
    throttle_classes = [OpsLoginThrottle]

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        if not username or not password:
            return Response(
                {'detail': 'Ange användarnamn och lösenord.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user = authenticate(request, username=username, password=password)
        if user is None or not user.is_active:
            return Response(
                {'detail': 'Fel användarnamn eller lösenord.'},
                status=status.HTTP_401_UNAUTHORIZED,
            )
        if not user.is_staff:
            return Response(
                {'detail': 'Kontot saknar personalbehörighet.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        login(request, user)
        return Response(
            {
                'authenticated': True,
                'username': user.username,
                'is_staff': True,
                'permissions': user_perm_flags(user),
            }
        )


class LogoutView(APIView):
    authentication_classes = [SessionAuthentication]
    permission_classes = [IsStaffUser]

    def post(self, request):
        logout(request)
        return Response({'authenticated': False})


class MeView(APIView):
    """Always 200 — client-friendly session probe."""

    authentication_classes = [SessionAuthentication]
    permission_classes = []

    def get(self, request):
        user = request.user
        if user.is_authenticated and user.is_staff and user.is_active:
            return Response(
                {
                    'authenticated': True,
                    'username': user.username,
                    'is_staff': True,
                    'permissions': user_perm_flags(user),
                }
            )
        return Response({'authenticated': False, 'permissions': {}})
