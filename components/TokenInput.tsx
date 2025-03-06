"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface TokenInputProps {
  accessToken: string;
  setAccessToken: (token: string) => void;
  onFetch: () => void;
  loading: boolean;
}

export function TokenInput({
  accessToken,
  setAccessToken,
  onFetch,
  loading,
}: TokenInputProps) {
  return (
    <div className="flex items-end gap-4 mb-8 max-w-xl mx-auto">
      <div className="flex-1">
        <label
          htmlFor="access-token"
          className="block text-sm font-medium mb-1"
        >
          Token de Acceso
        </label>
        <Input
          id="access-token"
          type="text"
          value={accessToken}
          onChange={(e) => setAccessToken(e.target.value)}
          placeholder="Ingresa tu access_token de Mercado Pago"
          className="w-full"
        />
      </div>
      <Button onClick={onFetch} disabled={loading} variant="secondary">
        {loading ? (
          <span className="flex items-center gap-2">
            <Skeleton className="h-4 w-4 rounded-full animate-spin" />
            Consultando...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Consultar
          </span>
        )}
      </Button>
    </div>
  );
}
