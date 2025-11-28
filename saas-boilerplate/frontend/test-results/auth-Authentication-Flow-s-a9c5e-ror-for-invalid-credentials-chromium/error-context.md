# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - img [ref=e6]
      - text: SaaS Inc
    - blockquote [ref=e9]:
      - paragraph [ref=e10]: “This library has saved me countless hours of work and helped me deliver stunning designs to my clients faster than ever before.”
      - contentinfo [ref=e11]: Sofia Davis
  - generic [ref=e13]:
    - generic [ref=e14]:
      - heading "Login" [level=1] [ref=e15]
      - paragraph [ref=e16]: Enter your email below to login to your account
    - generic [ref=e17]:
      - generic [ref=e19]:
        - generic [ref=e20]:
          - text: Email
          - textbox "Email" [ref=e21]:
            - /placeholder: name@example.com
            - text: invalid@example.com
        - generic [ref=e22]:
          - generic [ref=e23]:
            - text: Password
            - link "Forgot password?" [ref=e24] [cursor=pointer]:
              - /url: /forgot-password
          - textbox "Password" [ref=e25]: wrongpassword
        - generic [ref=e26]: Network Error
        - button "Sign In with Email" [ref=e27]
      - generic [ref=e29]: Or continue with
      - button "GitHub" [ref=e30]
    - paragraph [ref=e31]:
      - text: Don't have an account?
      - link "Sign up" [ref=e32] [cursor=pointer]:
        - /url: /signup
```