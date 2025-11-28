"""
Migration to add database indexes to Subscription model for performance.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0001_initial'),
    ]

    operations = [
        # Add index to status field (frequently filtered)
        migrations.AddIndex(
            model_name='subscription',
            index=models.Index(fields=['status'], name='sub_status_idx'),
        ),
        # Add index to current_period_end (for expiration queries)
        migrations.AddIndex(
            model_name='subscription',
            index=models.Index(fields=['current_period_end'], name='sub_period_end_idx'),
        ),
        # Composite index for common query patterns
        migrations.AddIndex(
            model_name='subscription',
            index=models.Index(fields=['status', 'current_period_end'], name='sub_status_period_idx'),
        ),
    ]
