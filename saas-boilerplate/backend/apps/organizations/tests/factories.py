import factory
from datetime import timedelta
from django.utils import timezone
from apps.organizations.models import Organization, Membership, Invitation
from apps.accounts.tests.factories import UserFactory


class OrganizationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Organization

    name = factory.Faker('company')
    slug = factory.Faker('slug')


class MembershipFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Membership

    user = factory.SubFactory(UserFactory)
    organization = factory.SubFactory(OrganizationFactory)
    role = 'member'


class InvitationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Invitation

    organization = factory.SubFactory(OrganizationFactory)
    email = factory.Faker('email')
    invited_by = factory.SubFactory(UserFactory)
    role = 'member'
    expires_at = factory.LazyFunction(lambda: timezone.now() + timedelta(days=7))
    token_hash = factory.Faker('sha256')
