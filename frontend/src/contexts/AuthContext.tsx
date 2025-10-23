import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { useAccount, useSignMessage } from "wagmi";
import { authApi } from "../services/api";
import { toast } from "sonner";
import type { AxiosError } from "axios";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  // Cargar token y usuario del localStorage al montar
  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Auto-logout si la wallet se desconecta
  useEffect(() => {
    if (!isConnected && user) {
      logout();
    }
  }, [isConnected, user]);

  const login = async () => {
    if (!address || !isConnected) {
      toast.error("Por favor conecta tu wallet primero");
      return;
    }

    try {
      setIsLoading(true);

      // 1. Obtener nonce del servidor
      const { nonce } = await authApi.getNonce(address);

      // 2. Crear mensaje para firmar
      const message = `Bienvenido a Kanban Colaborativo!\n\nFirma este mensaje para autenticarte.\n\nWallet: ${address}\nNonce: ${nonce}`;

      // 3. Firmar mensaje con la wallet
      const signature = await signMessageAsync({ message });

      // 4. Verificar firma en el servidor
      const { token: authToken, user: userData } = await authApi.verify(
        address,
        signature,
        message
      );

      // 5. Guardar en estado y localStorage
      setToken(authToken);
      setUser(userData as User);
      localStorage.setItem("auth_token", authToken);
      localStorage.setItem("auth_user", JSON.stringify(userData as User));

      toast.success("Autenticación exitosa!");
    } catch (error: unknown) {
      console.error("Error en login:", error);
      toast.error(
        (error as AxiosError<{ message: string }>)?.response?.data?.message ||
          "Error al autenticar"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    toast.info("Sesión cerrada");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return context;
}
