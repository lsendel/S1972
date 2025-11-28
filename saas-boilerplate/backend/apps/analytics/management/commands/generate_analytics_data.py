import random
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.analytics.models import DailyMetric

class Command(BaseCommand):
    help = 'Generates fake analytics data for testing'

    def handle(self, *args, **options):
        self.stdout.write('Generating fake analytics data...')
        
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=30)
        
        metrics = [
            ('users.new', 5, 20),
            ('users.active', 50, 200),
            ('users.total', 100, 500), # This should technically be cumulative, but for simple charts random is ok-ish, though weird.
            ('revenue.mrr', 1000, 5000),
            ('subs.new', 1, 5),
            ('subs.cancelled', 0, 3),
            ('subs.active', 20, 100),
        ]

        # Clear existing data for this period to avoid duplicates
        DailyMetric.objects.filter(date__gte=start_date, date__lte=end_date).delete()

        current_date = start_date
        while current_date <= end_date:
            for metric_type, min_val, max_val in metrics:
                value = random.uniform(min_val, max_val)
                if 'revenue' not in metric_type:
                    value = int(value)
                
                DailyMetric.objects.create(
                    date=current_date,
                    metric_type=metric_type,
                    value=value
                )
            current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS('Successfully generated fake analytics data'))
