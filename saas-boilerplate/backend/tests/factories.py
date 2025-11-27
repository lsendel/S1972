"""
Factory classes for creating test data.
Using basic factory pattern (can be upgraded to factory_boy if needed).
"""
from django.utils import timezone
from datetime import timedelta
from apps.accounts.models import User
from apps.organizations.models import Organization, Membership, Invitation
from apps.subscriptions.models import Plan, Subscription
import uuid


class UserFactory:
    """Factory for creating User instances."""

    @staticmethod
    def create(
        email=None,
        password='testpass123456',
        full_name='Test User',
        email_verified=True,
        **kwargs
    ):
        """Create a user with default or provided values."""
        if email is None:
            email = f'user_{uuid.uuid4().hex[:8]}@example.com'

        return User.objects.create_user(
            email=email,
            password=password,
            full_name=full_name,
            email_verified=email_verified,
            **kwargs
        )

    @staticmethod
    def create_batch(count=3, **kwargs):
        """Create multiple users."""
        return [UserFactory.create(**kwargs) for _ in range(count)]


class OrganizationFactory:
    """Factory for creating Organization instances."""

    @staticmethod
    def create(
        name=None,
        slug=None,
        owner=None,
        **kwargs
    ):
        """Create an organization with an owner."""
        if name is None:
            name = f'Test Organization {uuid.uuid4().hex[:8]}'
        if slug is None:
            slug = f'test-org-{uuid.uuid4().hex[:8]}'

        org = Organization.objects.create(
            name=name,
            slug=slug,
            **kwargs
        )

        # Create owner membership if owner provided
        if owner:
            MembershipFactory.create(
                user=owner,
                organization=org,
                role='owner'
            )

        return org

    @staticmethod
    def create_with_members(
        owner=None,
        member_count=2,
        admin_count=1,
        **kwargs
    ):
        """Create an organization with owner, admins, and members."""
        if owner is None:
            owner = UserFactory.create()

        org = OrganizationFactory.create(owner=owner, **kwargs)

        # Create admins
        for _ in range(admin_count):
            admin = UserFactory.create()
            MembershipFactory.create(
                user=admin,
                organization=org,
                role='admin'
            )

        # Create members
        for _ in range(member_count):
            member = UserFactory.create()
            MembershipFactory.create(
                user=member,
                organization=org,
                role='member'
            )

        return org


class MembershipFactory:
    """Factory for creating Membership instances."""

    @staticmethod
    def create(
        user=None,
        organization=None,
        role='member',
        **kwargs
    ):
        """Create a membership."""
        if user is None:
            user = UserFactory.create()
        if organization is None:
            organization = OrganizationFactory.create()

        return Membership.objects.create(
            user=user,
            organization=organization,
            role=role,
            **kwargs
        )


class InvitationFactory:
    """Factory for creating Invitation instances."""

    @staticmethod
    def create(
        email=None,
        organization=None,
        invited_by=None,
        role='member',
        **kwargs
    ):
        """Create an invitation."""
        if email is None:
            email = f'invite_{uuid.uuid4().hex[:8]}@example.com'
        if organization is None:
            organization = OrganizationFactory.create()
        if invited_by is None:
            invited_by = UserFactory.create()

        return Invitation.objects.create(
            email=email,
            organization=organization,
            invited_by=invited_by,
            role=role,
            token=uuid.uuid4().hex,
            expires_at=timezone.now() + timedelta(days=7),
            **kwargs
        )


class PlanFactory:
    """Factory for creating Plan instances."""

    @staticmethod
    def create(
        id=None,
        name=None,
        price_monthly=29.00,
        price_yearly=290.00,
        **kwargs
    ):
        """Create a subscription plan."""
        if id is None:
            id = f'plan_{uuid.uuid4().hex[:8]}'
        if name is None:
            name = f'Test Plan {uuid.uuid4().hex[:8]}'

        return Plan.objects.create(
            id=id,
            name=name,
            description='Test plan description',
            price_monthly=price_monthly,
            price_yearly=price_yearly,
            stripe_price_id_monthly=f'price_monthly_{uuid.uuid4().hex[:8]}',
            stripe_price_id_yearly=f'price_yearly_{uuid.uuid4().hex[:8]}',
            limits={'seats': 10, 'projects': 20},
            features=['feature1', 'feature2'],
            is_active=True,
            **kwargs
        )


class SubscriptionFactory:
    """Factory for creating Subscription instances."""

    @staticmethod
    def create(
        organization=None,
        plan=None,
        billing_cycle='monthly',
        status='active',
        **kwargs
    ):
        """Create a subscription."""
        if organization is None:
            organization = OrganizationFactory.create()
        if plan is None:
            plan = PlanFactory.create()

        return Subscription.objects.create(
            organization=organization,
            plan=plan,
            stripe_subscription_id=f'sub_{uuid.uuid4().hex[:8]}',
            stripe_price_id=plan.stripe_price_id_monthly if billing_cycle == 'monthly' else plan.stripe_price_id_yearly,
            billing_cycle=billing_cycle,
            status=status,
            current_period_start=timezone.now(),
            current_period_end=timezone.now() + timedelta(days=30),
            **kwargs
        )
