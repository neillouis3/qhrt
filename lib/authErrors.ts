type AuthLikeError = {
  message?: string;
  code?: string;
  status?: number;
};

function looksLikeConfiguredKey(value: string | undefined): boolean {
  if (!value) return false;
  return (
    value.startsWith('eyJ') ||
    value.startsWith('sb_publishable_') ||
    value.startsWith('sb_secret_')
  );
}

export function supabaseKeysAreConfigured(): boolean {
  return (
    looksLikeConfiguredKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) &&
    looksLikeConfiguredKey(process.env.SUPABASE_SECRET_KEY)
  );
}

export function signupClientMessage(error: AuthLikeError): string {
  const message = (error.message ?? '').toLowerCase();
  const code = error.code ?? '';

  if (
    error.status === 401 ||
    message.includes('invalid api key') ||
    message.includes('invalid jwt') ||
    !looksLikeConfiguredKey(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  ) {
    return 'Auth is not configured. Add a real Supabase publishable key and secret key to .env.local, then restart the dev server.';
  }

  if (code === 'over_email_send_rate_limit' || message.includes('rate limit')) {
    return 'Too many signup emails were sent. Wait a minute and try again, or sign in if the account already exists.';
  }

  if (code === 'user_already_exists' || message.includes('already registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }

  if (code === 'weak_password' || (message.includes('password') && message.includes('short'))) {
    return 'Password is too short. Use at least 6 characters.';
  }

  if (
    code === 'email_address_invalid' ||
    message.includes('invalid format') ||
    message.includes('unable to validate email')
  ) {
    return 'Please use a valid email address.';
  }

  return 'Signup failed. Please try again.';
}
