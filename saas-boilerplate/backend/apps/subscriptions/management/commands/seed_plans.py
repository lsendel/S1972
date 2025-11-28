from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.subscriptions.models import Plan


DEFAULT_PLANS = [
    {
        "id": "starter",
        "name": "Starter",
        "description": "For small teams getting started",
        "stripe_price_id_monthly": "price_starter_monthly",
        "stripe_price_id_yearly": "price_starter_yearly",
        "price_monthly": Decimal("29.00"),
        "price_yearly": Decimal("290.00"),
        "limits": {"users": 5, "projects": 10},
        "features": ["Basic analytics", "Email support", "Projects: 10"],
        "display_order": 1,
    },
    {
        "id": "pro",
        "name": "Pro",
        "description": "For growing teams that need more",
        "stripe_price_id_monthly": "price_pro_monthly",
        "stripe_price_id_yearly": "price_pro_yearly",
        "price_monthly": Decimal("99.00"),
        "price_yearly": Decimal("990.00"),
        "limits": {"users": 25, "projects": 100},
        "features": ["Advanced analytics", "Priority support", "SSO (SAML/OIDC)"],
        "display_order": 2,
    },
    {
        "id": "enterprise",
        "name": "Enterprise",
        "description": "For organizations with advanced needs",
        "stripe_price_id_monthly": "price_enterprise_monthly",
        "stripe_price_id_yearly": "price_enterprise_yearly",
        "price_monthly": Decimal("299.00"),
        "price_yearly": Decimal("2990.00"),
        "limits": {"users": 500, "projects": 1000},
        "features": ["Dedicated support", "Custom SLA", "Security reviews"],
        "display_order": 3,
    },
]


class Command(BaseCommand):
    help = "Seed default subscription plans. Safe to run multiple times."

    def add_arguments(self, parser):
        parser.add_argument(
            "--activate-all",
            action="store_true",
            help="Reactivate plans if they exist but are inactive.",
        )

    def handle(self, *args, **options):
        activate_all = options["activate_all"]

        for plan_data in DEFAULT_PLANS:
            plan, created = Plan.objects.update_or_create(
                id=plan_data["id"],
                defaults=plan_data,
            )
            if activate_all and not plan.is_active:
                plan.is_active = True
                plan.save(update_fields=["is_active"])

            if created:
                self.stdout.write(self.style.SUCCESS(f"Created plan {plan.id}"))
            else:
                self.stdout.write(self.style.WARNING(f"Updated plan {plan.id}"))

        self.stdout.write(self.style.SUCCESS("Plan seeding complete."))
