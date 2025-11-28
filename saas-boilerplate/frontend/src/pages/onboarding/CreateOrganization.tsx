import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreateOrganization } from "@/hooks/useOrganization"
import { MetaTags } from "@/components/SEO/MetaTags"
import { AnalyticsOrg } from "@/lib/analytics/events"
import type { ApiError } from "@/api/generated"

interface FormData {
  name: string
  slug: string
}

export default function CreateOrganization() {
  const navigate = useNavigate()
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>()
  const createOrganization = useCreateOrganization()
  const [error, setError] = useState<string | null>(null)

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
    setValue("slug", slug)
  }

  const onSubmit = async (data: FormData) => {
    try {
      setError(null)
      const org = await createOrganization.mutateAsync(data)

      // Track organization creation
      AnalyticsOrg.created(org.id, org.name)

      // Redirect to the new organization's dashboard
      navigate(`/app/${org.slug}`)
    } catch (err) {
      const apiError = err as ApiError
      const body = apiError.body as { slug?: string[], name?: string[], error?: string }
      // Handle error messages from backend
      const errorMessage = body?.slug?.[0] ??
        body?.name?.[0] ??
        body?.error ??
        "Failed to create organization"
      setError(errorMessage)
    }
  }

  return (
    <>
      <MetaTags
        title="Create Organization"
        description="Set up your organization workspace and start collaborating with your team"
        noindex={true}
      />
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Create Your Organization
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Let's get started by setting up your workspace
          </p>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          {error && (
            <div className="mb-6 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={(e) => void handleSubmit(onSubmit)(e)}>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Organization Name *
              </label>
              <Input
                id="name"
                {...register("name", {
                  required: "Organization name is required",
                  minLength: { value: 3, message: "Name must be at least 3 characters" }
                })}
                onChange={(e) => {
                  register("name").onChange(e)
                  handleNameChange(e)
                }}
                placeholder="Acme Inc."
                className="mt-1"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message!}</p>
              )}
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-gray-700">
                URL Slug *
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                  yourapp.com/
                </span>
                <Input
                  id="slug"
                  {...register("slug", {
                    required: "URL slug is required",
                    pattern: {
                      value: /^[a-z0-9-]+$/,
                      message: "Slug can only contain lowercase letters, numbers, and hyphens"
                    }
                  })}
                  placeholder="acme-inc"
                  className="rounded-l-none"
                />
              </div>
              {errors.slug && (
                <p className="mt-1 text-sm text-red-600">{errors.slug.message!}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                This will be used in your organization's URL
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createOrganization.isPending}
              >
                {createOrganization.isPending ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </form>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            You can always create more organizations later
          </p>
        </div>
      </div>
    </div>
    </>
  )
}
