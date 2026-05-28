from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView
from rest_framework.authtoken import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tracker.urls')),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
    path('api-token-auth/', views.obtain_auth_token, name='api_token_auth'),
    path('', RedirectView.as_view(url='/api/')),
]