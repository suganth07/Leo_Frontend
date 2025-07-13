import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface SecureTokenData {
  valid: boolean;
  folder_id?: string;
  folder_name?: string;
  expires_at?: string;
  error?: string;
}

export function useSecureQRAccess() {
  const searchParams = useSearchParams();
  const [tokenData, setTokenData] = useState<SecureTokenData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = searchParams?.get('token');
    if (token) {
      verifyQRToken(token);
    }
  }, [searchParams]);

  const verifyQRToken = async (token: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/verify-qr-token?token=${token}`);
      const data = await response.json();
      setTokenData(data);
    } catch (error) {
      setTokenData({ valid: false, error: 'Failed to verify access token' });
    } finally {
      setLoading(false);
    }
  };

  return { tokenData, loading };
}