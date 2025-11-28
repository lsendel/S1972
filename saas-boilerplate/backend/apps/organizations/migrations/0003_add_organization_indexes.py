"""
Migration to add database indexes to Organization model for performance.
"""
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0001_initial'),
    ]

    operations = [
        # Add index to is_active field
        migrations.AlterField(
            model_name='organization',
            name='is_active',
            field=models.BooleanField(db_index=True, default=True),
        ),
        # Composite index for common queries (active orgs ordered by creation)
        migrations.AddIndex(
            model_name='organization',
            index=models.Index(fields=['is_active', 'created_at'], name='org_active_created_idx'),
        ),
    ]
