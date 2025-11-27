# Generated migration for TOTP and Backup Codes
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TOTPDevice',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('secret', models.CharField(help_text='Base32 encoded secret', max_length=32)),
                ('name', models.CharField(default='Default', help_text='Device name', max_length=64)),
                ('confirmed', models.BooleanField(default=False, help_text='Whether the device has been confirmed')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_used_at', models.DateTimeField(blank=True, null=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='totp_device', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'TOTP device',
                'verbose_name_plural': 'TOTP devices',
            },
        ),
        migrations.CreateModel(
            name='BackupCode',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('code_hash', models.CharField(help_text='Hashed backup code', max_length=255)),
                ('used', models.BooleanField(default=False)),
                ('used_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='backup_codes', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'backup code',
                'verbose_name_plural': 'backup codes',
            },
        ),
    ]
