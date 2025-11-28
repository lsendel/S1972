"""
Django management command to create a test user for E2E testing.

This command creates a test user with a known email/password and a test organization.
It's idempotent - can be run multiple times safely.

Usage:
    python manage.py create_test_user
    python manage.py create_test_user --email custom@test.com --password mypass
"""
from django.core.management.base import BaseCommand
from django.db import transaction
from apps.accounts.models import User
from apps.organizations.models import Organization, Membership


class Command(BaseCommand):
    help = 'Creates a test user and organization for E2E testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            default='test@example.com',
            help='Email address for the test user (default: test@example.com)',
        )
        parser.add_argument(
            '--password',
            type=str,
            default='testpassword123',
            help='Password for the test user (default: testpassword123)',
        )
        parser.add_argument(
            '--org-name',
            type=str,
            default='Test Organization',
            help='Name for the test organization (default: Test Organization)',
        )
        parser.add_argument(
            '--org-slug',
            type=str,
            default='test-org',
            help='Slug for the test organization (default: test-org)',
        )
        parser.add_argument(
            '--delete',
            action='store_true',
            help='Delete the test user and organization if they exist',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        email = options['email']
        password = options['password']
        org_name = options['org_name']
        org_slug = options['org_slug']
        delete = options['delete']

        # Handle deletion
        if delete:
            self.stdout.write(self.style.WARNING(f'Deleting test user: {email}'))

            try:
                user = User.objects.get(email=email)
                # Delete organizations owned by this user
                org_count = Organization.objects.filter(
                    memberships__user=user,
                    memberships__role=Membership.ROLE_OWNER
                ).count()
                Organization.objects.filter(
                    memberships__user=user,
                    memberships__role=Membership.ROLE_OWNER
                ).delete()

                user.delete()
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Deleted test user and {org_count} organization(s)'
                ))
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING('Test user does not exist'))

            return

        # Create or get test user
        user, user_created = User.objects.get_or_create(
            email=email,
            defaults={
                'full_name': 'Test User',
                'email_verified': True,
                'is_active': True,
            }
        )

        if user_created:
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'✓ Created test user: {email}'))
        else:
            # Update password in case it changed
            user.set_password(password)
            user.email_verified = True
            user.is_active = True
            user.save()
            self.stdout.write(self.style.WARNING(f'⚠ Test user already exists: {email} (password updated)'))

        # Create or get test organization
        org, org_created = Organization.objects.get_or_create(
            slug=org_slug,
            defaults={
                'name': org_name,
                'is_active': True,
            }
        )

        if org_created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created test organization: {org_name} ({org_slug})'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠ Test organization already exists: {org_name} ({org_slug})'))

        # Create or update membership
        membership, membership_created = Membership.objects.get_or_create(
            user=user,
            organization=org,
            defaults={
                'role': Membership.ROLE_OWNER,
                'is_active': True,
            }
        )

        if membership_created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created membership: {user.email} → {org.name} (owner)'))
        else:
            # Ensure role is owner
            if membership.role != Membership.ROLE_OWNER:
                membership.role = Membership.ROLE_OWNER
                membership.save()
                self.stdout.write(self.style.WARNING('⚠ Updated membership role to owner'))
            else:
                self.stdout.write(self.style.WARNING('⚠ Membership already exists'))

        # Print summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('═' * 60))
        self.stdout.write(self.style.SUCCESS('  E2E Test User Setup Complete'))
        self.stdout.write(self.style.SUCCESS('═' * 60))
        self.stdout.write(f'  Email:        {email}')
        self.stdout.write(f'  Password:     {password}')
        self.stdout.write(f'  Organization: {org.name}')
        self.stdout.write(f'  Org Slug:     {org.slug}')
        self.stdout.write(f'  Role:         {membership.role}')
        self.stdout.write(self.style.SUCCESS('═' * 60))
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('You can now run E2E tests with these credentials.'))
        self.stdout.write(f'  Dashboard URL: /app/{org.slug}')
        self.stdout.write('')
