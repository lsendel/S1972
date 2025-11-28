from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('subscriptions', '0002_add_subscription_indexes'),
    ]

    operations = [
        migrations.CreateModel(
            name='StripeEvent',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_id', models.CharField(db_index=True, max_length=255, unique=True)),
                ('type', models.CharField(db_index=True, max_length=100)),
                ('payload', models.JSONField()),
                ('status', models.CharField(default='processed', max_length=50)),
                ('message', models.CharField(blank=True, max_length=255)),
                ('processed_at', models.DateTimeField(auto_now_add=True)),
            ],
            options={
                'ordering': ['-processed_at'],
            },
        ),
        migrations.AddIndex(
            model_name='stripeevent',
            index=models.Index(fields=['type', 'processed_at'], name='subscriptions_type_proce_f96d2e_idx'),
        ),
    ]
